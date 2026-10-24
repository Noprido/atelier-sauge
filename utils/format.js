'use strict';

const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function eur(n) {
  return eurFmt.format(n);
}

// 'YYYY-MM-DD' -> 'vendredi 30 octobre 2026'
function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  return dateFmt.format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
}

// ISO UTC -> '23/10/2026 18:42' (fuseau du site)
function fmtDateTime(isoString, tz) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz || 'Europe/Paris',
  }).format(d);
}

// '14:30' -> '14h30'
function fmtTime(t) {
  return String(t || '').replace(':', 'h');
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = { eur, fmtDate, fmtDateTime, fmtTime, escapeHtml };
