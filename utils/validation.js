'use strict';

const { isValidISODate, weekdayOf, buildSlots, bookingWindow } = require('./dates');

const CTRL_SINGLE = /[\u0000-\u001F\u007F]/g;
const CTRL_MULTI = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const single = (v) => (typeof v === 'string' ? v.replace(CTRL_SINGLE, ' ').trim() : '');
const multi = (v) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(CTRL_MULTI, '').trim() : '');

function validateReservation(input, site) {
  const errors = {};
  const src = input && typeof input === 'object' ? input : {};

  const values = {
    formula: single(src.formula),
    name: single(src.name),
    email: single(src.email),
    phone: single(src.phone),
    address: single(src.address),
    postalCode: single(src.postalCode),
    city: single(src.city),
    date: single(src.date),
    time: single(src.time),
    comment: multi(src.comment),
    consent: src.consent === 'on' || src.consent === 'true' ? 'on' : '',
  };

  // Prestation + durée (valeur "idPrestation:minutes")
  let service = null;
  let duration = null;
  const m = /^([a-z0-9-]+):(\d{1,3})$/.exec(values.formula);
  if (m) {
    service = site.services.find((s) => s.id === m[1]) || null;
    if (service) duration = service.durations.find((d) => d.minutes === Number(m[2])) || null;
  }
  if (!service || !duration) errors.formula = 'Choisissez une prestation et une durée dans la liste.';

  if (values.name.length < 2 || values.name.length > 100) errors.name = 'Indiquez votre nom et prénom (2 à 100 caractères).';

  if (!values.email || values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) {
    errors.email = 'Indiquez une adresse e-mail valide, par exemple prenom@exemple.fr.';
  }

  const phone = values.phone.replace(/[\s.\-()]/g, '');
  if (!/^\+?\d{9,15}$/.test(phone)) errors.phone = 'Indiquez un numéro de téléphone valide, par exemple 06 12 34 56 78.';

  if (values.address.length < 5 || values.address.length > 200) errors.address = 'Indiquez votre adresse complète (numéro et rue).';
  if (!/^\d{5}$/.test(values.postalCode)) errors.postalCode = 'Le code postal doit comporter 5 chiffres.';
  if (values.city.length < 2 || values.city.length > 80) errors.city = 'Indiquez votre ville.';

  // Date et heure
  const slots = buildSlots(site.booking);
  const win = bookingWindow(site.booking, site.business.timezone);
  if (!isValidISODate(values.date)) {
    errors.date = 'Choisissez une date valide.';
  } else if (site.booking.closedWeekdays.includes(weekdayOf(values.date))) {
    errors.date = 'Nous n’intervenons pas ce jour-là. Choisissez une autre date.';
  } else if (values.date > win.max) {
    errors.date = 'Cette date est trop lointaine. Choisissez une date plus proche.';
  }
  if (!slots.includes(values.time)) {
    errors.time = 'Choisissez une heure dans la liste.';
  }
  if (!errors.date && !errors.time) {
    const [y, mo, d] = values.date.split('-').map(Number);
    const [hh, mm] = values.time.split(':').map(Number);
    if (Date.UTC(y, mo - 1, d, hh, mm) < win.earliestMs) {
      errors.date = `Le rendez-vous doit être demandé au moins ${site.booking.leadHours} h à l’avance.`;
    }
  }

  if (values.comment.length > 500) errors.comment = 'Le message est limité à 500 caractères.';
  if (values.consent !== 'on') errors.consent = 'Vous devez accepter le traitement de vos données pour envoyer la demande.';

  let data = null;
  if (Object.keys(errors).length === 0) {
    data = {
      service: { id: service.id, name: service.name },
      duration: { minutes: duration.minutes, price: duration.price },
      customer: { name: values.name, email: values.email, phone },
      appointment: { date: values.date, time: values.time },
      address: { street: values.address, postalCode: values.postalCode, city: values.city },
      comment: values.comment,
    };
  }
  return { errors, values, data };
}

module.exports = { validateReservation };
