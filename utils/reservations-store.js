'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
const FILE = path.join(DATA_DIR, 'reservations.json');

const STATUSES = {
  nouvelle: 'Nouvelle',
  en_cours: 'En cours de traitement',
  confirmee: 'Confirmée',
  refusee: 'Refusée ou annulée',
};
const ID_RE = /^R-\d{8}-[0-9A-F]{8}$/;

// File d'attente : une seule opération sur le fichier à la fois (évite les écritures concurrentes)
let queue = Promise.resolve();
function enqueue(task) {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
}

async function readAll() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    if (!raw.trim()) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Format de reservations.json invalide (tableau attendu)');
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Écriture atomique : fichier temporaire puis remplacement
async function writeAll(list) {
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), { encoding: 'utf8', mode: 0o600 });
  await fs.rename(tmp, FILE);
}

async function init() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await enqueue(async () => {
    const list = await readAll(); // lève une erreur si le fichier existe mais est corrompu
    try {
      await fs.access(FILE);
    } catch (e) {
      await writeAll(list);
    }
  });
}

function list() {
  return enqueue(readAll);
}

function makeId(existing) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let id;
  do {
    id = `R-${day}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  } while (existing.some((r) => r.id === id));
  return id;
}

function add(data) {
  return enqueue(async () => {
    const all = await readAll();
    const now = new Date().toISOString();
    const record = Object.assign({ id: makeId(all), status: 'nouvelle', createdAt: now, updatedAt: now }, data);
    all.push(record);
    await writeAll(all);
    return record;
  });
}

function updateStatus(id, status) {
  return enqueue(async () => {
    const all = await readAll();
    const record = all.find((r) => r.id === id);
    if (!record) return null;
    record.status = status;
    record.updatedAt = new Date().toISOString();
    await writeAll(all);
    return record;
  });
}

module.exports = { STATUSES, ID_RE, init, list, add, updateStatus };
