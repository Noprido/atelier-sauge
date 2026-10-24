'use strict';

function wallParts(date, tz) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const o = {};
  parts.forEach((p) => {
    if (p.type !== 'literal') o[p.type] = Number(p.value);
  });
  return o;
}

// Heure « murale » d'un instant dans le fuseau tz, exprimée comme un timestamp UTC (pour comparer des dates calendaires)
function wallClockMs(date, tz) {
  const p = wallParts(date, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
}

function isValidISODate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
  if (!m) return false;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function weekdayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function buildSlots(booking) {
  const slots = [];
  for (let t = toMinutes(booking.firstSlot); t <= toMinutes(booking.lastSlot); t += booking.stepMinutes) {
    slots.push(String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'));
  }
  return slots;
}

// Premier instant réservable et dernière date réservable (en heure murale du fuseau du site)
function bookingWindow(booking, tz) {
  const now = new Date();
  const earliestMs = wallClockMs(new Date(now.getTime() + booking.leadHours * 3600 * 1000), tz);
  const latestMs = wallClockMs(now, tz) + booking.maxAdvanceDays * 86400 * 1000;
  return {
    earliestMs,
    min: new Date(earliestMs).toISOString().slice(0, 10),
    max: new Date(latestMs).toISOString().slice(0, 10),
  };
}

module.exports = { wallClockMs, isValidISODate, weekdayOf, buildSlots, bookingWindow };
