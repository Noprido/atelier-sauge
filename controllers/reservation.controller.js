'use strict';

const site = require('../config/site');
const store = require('../utils/reservations-store');
const { validateReservation } = require('../utils/validation');
const { buildSlots, bookingWindow } = require('../utils/dates');
const { eur } = require('../utils/format');
const email = require('../services/email.service');

function formContext(state) {
  const st = state || {};
  const win = bookingWindow(site.booking, site.business.timezone);
  const groups = site.services.map((s) => ({
    id: s.id,
    name: s.name,
    options: s.durations.map((d) => ({ value: `${s.id}:${d.minutes}`, label: `${d.minutes} min — ${eur(d.price)}` })),
  }));
  const errors = st.errors || {};
  return {
    values: st.values || {},
    errors,
    errorList: Object.keys(errors).map((k) => ({ field: k, message: errors[k] })),
    groups,
    slots: buildSlots(site.booking),
    minDate: win.min,
    maxDate: win.max,
    ts: Date.now(),
  };
}

function homeLocals(state) {
  return {
    title: `${site.business.name} — ${site.business.tagline}`,
    canonicalPath: '/',
    form: formContext(state),
  };
}

function showHome(req, res) {
  const values = {};
  const wanted = typeof req.query.formula === 'string' ? req.query.formula : '';
  const valid = site.services.some((s) => s.durations.some((d) => `${s.id}:${d.minutes}` === wanted));
  if (valid) values.formula = wanted;
  res.renderPage('pages/home', homeLocals({ values }));
}

// Protection de base contre les envois depuis un autre site
function sameOrigin(req) {
  // Les navigateurs modernes indiquent si la requête vient d'un autre site
  if (req.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.get('origin');
  // Origin absent ou "null" (selon la Referrer-Policy) : on ne peut pas conclure, on laisse passer
  if (!origin || origin === 'null') return true;
  try {
    const host = new URL(origin).host;
    const allowed = [req.get('host')];
    if (process.env.SITE_URL) allowed.push(new URL(process.env.SITE_URL).host);
    const forwarded = req.get('x-forwarded-host');
    if (forwarded && req.app.get('trust proxy')) allowed.push(forwarded);
    return allowed.includes(host);
  } catch (e) {
    return false;
  }
}

async function create(req, res, next) {
  try {
    if (!sameOrigin(req)) {
      return res.renderPage('pages/error', { title: 'Requête refusée', noindex: true, code: 403, message: 'Cette requête provient d’un autre site et a été refusée.' }, 403);
    }

    const body = req.body || {};
    const elapsed = Date.now() - Number(body.ts);
    const looksLikeBot = (typeof body.website === 'string' && body.website.trim() !== '') || !Number.isFinite(elapsed) || elapsed < 2000;
    if (looksLikeBot) {
      // Réponse neutre : on ne renseigne pas les robots
      return res.redirect(303, '/confirmation');
    }

    const { errors, values, data } = validateReservation(body, site);
    if (!data) {
      return res.renderPage('pages/home', homeLocals({ values, errors }), 422);
    }

    let record;
    try {
      record = await store.add(data);
    } catch (err) {
      console.error('[réservation] enregistrement impossible :', err.message);
      return res.renderPage(
        'pages/error',
        { title: 'Demande non enregistrée', noindex: true, code: 500, message: 'Votre demande n’a pas pu être enregistrée. Aucune information n’a été conservée : réessayez dans quelques instants ou contactez-nous directement.', backHref: '/#reservation', backLabel: 'Retour au formulaire' },
        500
      );
    }

    const results = await Promise.allSettled([email.sendCustomerReceipt(record), email.sendAdminNotification(record)]);
    const customerOk = results[0].status === 'fulfilled' && results[0].value && results[0].value.ok;
    return res.redirect(303, `/confirmation?ref=${encodeURIComponent(record.id)}&mail=${customerOk ? 1 : 0}`);
  } catch (err) {
    return next(err);
  }
}

function confirmation(req, res) {
  const ref = typeof req.query.ref === 'string' && store.ID_RE.test(req.query.ref) ? req.query.ref : '';
  res.renderPage('pages/confirmation', {
    title: 'Demande reçue',
    noindex: true,
    ref,
    mailSent: req.query.mail !== '0',
  });
}

module.exports = { showHome, create, confirmation };
