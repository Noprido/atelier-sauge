'use strict';

module.exports = function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) return next();
  if (req.method === 'GET' || req.method === 'HEAD') return res.redirect('/admin/login');
  return res.status(401).json({ ok: false, error: 'Non authentifié' });
};
