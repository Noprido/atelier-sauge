'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const store = require('../utils/reservations-store');

function loginPage(res, error, status) {
  res.renderPage('admin/login', { title: 'Connexion — administration', area: 'admin', error: error || null }, status || 200);
}

function loginForm(req, res) {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  return loginPage(res);
}

async function login(req, res, next) {
  try {
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash) {
      console.error('[admin] ADMIN_PASSWORD_HASH non défini : connexion impossible.');
      return loginPage(res, 'L’espace d’administration n’est pas configuré. Consultez le README.', 500);
    }
    const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
    let ok = false;
    if (password.length > 0 && password.length <= 200) {
      ok = await bcrypt.compare(password, hash);
    }
    if (!ok) return loginPage(res, 'Mot de passe incorrect.', 401);

    // Nouvelle session après connexion (évite la fixation de session)
    return req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.isAdmin = true;
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      return req.session.save((err2) => {
        if (err2) return next(err2);
        return res.redirect(303, '/admin');
      });
    });
  } catch (err) {
    return next(err);
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('admin.sid', { path: '/admin' });
    res.redirect(303, '/admin/login');
  });
}

async function dashboard(req, res, next) {
  try {
    const reservations = (await store.list()).slice().reverse();
    res.renderPage('admin/dashboard', { title: 'Demandes — administration', area: 'admin', reservations, statuses: store.STATUSES });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const wantsJson = Boolean(req.is('json')) || req.accepts(['html', 'json']) === 'json';
    const { id } = req.params;
    const status = req.body && req.body.status;
    if (!store.ID_RE.test(id) || typeof status !== 'string' || !Object.prototype.hasOwnProperty.call(store.STATUSES, status)) {
      return wantsJson ? res.status(400).json({ ok: false, error: 'Données invalides' }) : res.redirect(303, '/admin');
    }
    const record = await store.updateStatus(id, status);
    if (!record) {
      return wantsJson ? res.status(404).json({ ok: false, error: 'Demande introuvable' }) : res.redirect(303, '/admin');
    }
    if (wantsJson) return res.json({ ok: true, status: record.status, label: store.STATUSES[record.status] });
    return res.redirect(303, '/admin');
  } catch (err) {
    return next(err);
  }
}

module.exports = { loginForm, login, logout, dashboard, updateStatus };
