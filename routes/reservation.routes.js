'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { create } = require('../controllers/reservation.controller');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 6,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.renderPage(
      'pages/error',
      {
        title: 'Trop de demandes',
        noindex: true,
        code: 429,
        message: 'Plusieurs demandes ont été envoyées depuis votre connexion. Patientez quelques minutes ou contactez-nous directement.',
        backHref: '/#contact',
        backLabel: 'Voir les moyens de contact',
      },
      429
    );
  },
});

router.post('/', limiter, create);

module.exports = router;
