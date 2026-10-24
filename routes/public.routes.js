'use strict';

const express = require('express');
const site = require('../config/site');
const { showHome, confirmation } = require('../controllers/reservation.controller');

const router = express.Router();

router.get('/', showHome);
router.get('/confirmation', confirmation);

const legalPages = {
  '/mentions-legales': { page: 'mentions', title: 'Mentions légales' },
  '/confidentialite': { page: 'confidentialite', title: 'Politique de confidentialité' },
  '/conditions': { page: 'conditions', title: 'Conditions de réservation' },
};
Object.keys(legalPages).forEach((route) => {
  router.get(route, (req, res) => {
    res.renderPage('pages/legal', Object.assign({ canonicalPath: route }, legalPages[route]));
  });
});

router.get('/robots.txt', (req, res) => {
  const base = res.app.locals.siteUrl;
  res.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  const base = res.app.locals.siteUrl;
  const urls = ['/'].concat(Object.keys(legalPages));
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  res.type('application/xml').send(xml);
});

module.exports = router;
