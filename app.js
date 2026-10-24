'use strict';
require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const site = require('./config/site');
const format = require('./utils/format');
const store = require('./utils/reservations-store');
const publicRoutes = require('./routes/public.routes');
const reservationRoutes = require('./routes/reservation.routes');
const adminRoutes = require('./routes/admin.routes');

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  if (isProd) {
    console.error('[config] SESSION_SECRET (32 caractères minimum) est obligatoire en production.');
    process.exit(1);
  }
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[config] SESSION_SECRET absent : secret temporaire généré (sessions admin perdues à chaque redémarrage).');
}
if (!process.env.ADMIN_PASSWORD_HASH) {
  console.warn('[config] ADMIN_PASSWORD_HASH absent : la connexion à l’espace admin est impossible (voir README).');
}

const app = express();
app.disable('x-powered-by');

if (process.env.TRUST_PROXY) {
  const n = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(n) ? process.env.TRUST_PROXY : n);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'upgrade-insecure-requests': isProd ? [] : null,
      },
    },
    referrerPolicy: { policy: 'same-origin' },
    strictTransportSecurity: isProd,
    strictTransportSecurity: isProd,
  })
);

app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '7d' : 0, index: false }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '5kb' }));

// Variables disponibles dans toutes les vues
app.locals.site = site;
app.locals.siteUrl = SITE_URL;
app.locals.eur = format.eur;
app.locals.fmtDate = format.fmtDate;
app.locals.fmtDateTime = format.fmtDateTime;
app.locals.fmtTime = format.fmtTime;
app.locals.year = new Date().getFullYear();

// res.renderPage(vue, données, statut) : rend la vue puis l'insère dans le layout
app.use((req, res, next) => {
  res.renderPage = function renderPage(view, locals = {}, status = 200) {
    const data = Object.assign({}, res.locals, locals);
    const fail = (err) => {
      if (res.locals.inErrorHandler) {
        return res.status(500).type('text/plain; charset=utf-8').send('Erreur interne.');
      }
      return next(err);
    };
    app.render(view, data, (err, body) => {
      if (err) return fail(err);
      res.status(status).render('layouts/main', Object.assign({}, data, { body }), (err2, html) => {
        if (err2) return fail(err2);
        return res.send(html);
      });
    });
  };
  next();
});

// Sessions : uniquement pour l'espace admin (aucun cookie pour les visiteurs)
const cookieSecure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd;
const sessionMiddleware = session({
  name: 'admin.sid',
  secret: sessionSecret,
  store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/admin',
  },
});

app.use('/', publicRoutes);
app.use('/reservations', reservationRoutes);
app.use('/admin', sessionMiddleware, adminRoutes);

app.use((req, res) => {
  res.renderPage('pages/404', { title: 'Page introuvable', noindex: true }, 404);
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err && err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
  console.error('[erreur]', status, err && err.message ? err.message : err);
  if (res.headersSent) return next(err);
  res.locals.inErrorHandler = true;
  if (req.accepts(['html', 'json']) === 'json') {
    return res.status(status).json({ ok: false, error: status === 500 ? 'Erreur interne' : 'Requête invalide' });
  }
  return res.renderPage(
    'pages/error',
    {
      title: 'Une erreur est survenue',
      noindex: true,
      code: status,
      message:
        status === 500
          ? 'Une erreur est survenue de notre côté. Réessayez dans quelques instants.'
          : 'La requête n’a pas pu être traitée. Vérifiez les informations envoyées et réessayez.',
    },
    status
  );
});

store
  .init()
  .then(() => {
    app.listen(PORT, () => console.log(`[serveur] ${site.business.name} : ${SITE_URL} (port ${PORT})`));
  })
  .catch((err) => {
    console.error('[démarrage] Impossible d’initialiser le stockage :', err.message);
    process.exit(1);
  });
