'use strict';

const crypto = require('crypto');

function ensureToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  return req.session.csrfToken;
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a || ''));
  const B = Buffer.from(String(b || ''));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

// Rend le jeton disponible dans les vues (pages GET)
function csrfLocals(req, res, next) {
  res.locals.csrfToken = ensureToken(req);
  next();
}

// Vérifie le jeton sur les requêtes qui modifient l'état (en-tête X-CSRF-Token ou champ _csrf)
function verifyCsrf(req, res, next) {
  const expected = req.session && req.session.csrfToken;
  const received = req.get('x-csrf-token') || (req.body && req.body._csrf);
  if (expected && safeEqual(expected, received)) {
    res.locals.csrfToken = expected;
    return next();
  }
  if (req.is('json') || req.accepts(['html', 'json']) === 'json') {
    return res.status(403).json({ ok: false, error: 'Jeton CSRF invalide ou expiré' });
  }
  return res.renderPage(
    'pages/error',
    {
      title: 'Session expirée',
      noindex: true,
      code: 403,
      message: 'Votre session a expiré ou le formulaire n’est plus valide. Revenez à la page de connexion et réessayez.',
      backHref: '/admin/login',
      backLabel: 'Retour à la connexion',
    },
    403
  );
}

module.exports = { ensureToken, csrfLocals, verifyCsrf };
