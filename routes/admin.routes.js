'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/admin.controller');
const requireAdmin = require('../middleware/require-admin');
const { ensureToken, csrfLocals, verifyCsrf } = require('../middleware/csrf');

const router = express.Router();

// Jamais de cache ni d'indexation pour l'administration
router.use((req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.locals.csrfToken = ensureToken(req);
    res.renderPage(
      'admin/login',
      { title: 'Connexion — administration', area: 'admin', error: 'Trop de tentatives. Patientez 15 minutes avant de réessayer.' },
      429
    );
  },
});

router.get('/login', csrfLocals, ctrl.loginForm);
router.post('/login', loginLimiter, verifyCsrf, ctrl.login);
router.post('/logout', requireAdmin, verifyCsrf, ctrl.logout);
router.get('/', requireAdmin, csrfLocals, ctrl.dashboard);
router.post('/reservations/:id/status', requireAdmin, verifyCsrf, ctrl.updateStatus);

module.exports = router;
