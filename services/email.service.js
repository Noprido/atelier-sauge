'use strict';

const nodemailer = require('nodemailer');
const site = require('../config/site');
const { eur, fmtDate, fmtTime, escapeHtml } = require('../utils/format');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return transporter;
}

async function send(message) {
  const tx = getTransporter();
  if (!tx) {
    console.warn('[email] SMTP non configuré : e-mail non envoyé.');
    return { ok: false, skipped: true };
  }
  try {
    await tx.sendMail(Object.assign({ from: process.env.MAIL_FROM || process.env.SMTP_USER }, message));
    return { ok: true };
  } catch (err) {
    console.error('[email] échec d’envoi :', err.code || '', err.responseCode || '');
    return { ok: false };
  }
}

function recap(r) {
  return [
    ['Référence', r.id],
    ['Prestation', `${r.service.name} (${r.duration.minutes} min)`],
    ['Tarif indicatif', eur(r.duration.price)],
    ['Date souhaitée', `${fmtDate(r.appointment.date)} à ${fmtTime(r.appointment.time)}`],
    ['Adresse', `${r.address.street}, ${r.address.postalCode} ${r.address.city}`],
  ];
}

function table(rows) {
  return (
    '<table style="border-collapse:collapse;margin:16px 0">' +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#5B635E;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0;font-weight:600">${escapeHtml(v)}</td></tr>`
      )
      .join('') +
    '</table>'
  );
}

function wrap(inner) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#232826;max-width:560px">${inner}</div>`;
}

function sendCustomerReceipt(r) {
  const rows = recap(r);
  const name = r.customer.name;
  const text =
    `Bonjour ${name},\n\nNous avons bien reçu votre demande de massage. Elle n’est pas encore confirmée : nous vérifions la disponibilité, votre adresse et le tarif final, puis nous revenons vers vous.\n\n` +
    rows.map(([k, v]) => `${k} : ${v}`).join('\n') +
    `\n\nLe tarif final et les éventuels frais de déplacement vous sont confirmés avant le rendez-vous. Aucun paiement n’est demandé à ce stade.\n\nPour modifier ou annuler, répondez à ce message en indiquant votre référence.\n\n${site.business.name}`;
  const html = wrap(
    `<p>Bonjour ${escapeHtml(name)},</p>` +
      '<p>Nous avons bien reçu votre demande de massage. <strong>Elle n’est pas encore confirmée</strong> : nous vérifions la disponibilité, votre adresse et le tarif final, puis nous revenons vers vous.</p>' +
      table(rows) +
      '<p>Le tarif final et les éventuels frais de déplacement vous sont confirmés avant le rendez-vous. Aucun paiement n’est demandé à ce stade.</p>' +
      '<p>Pour modifier ou annuler, répondez à ce message en indiquant votre référence.</p>' +
      `<p>${escapeHtml(site.business.name)}</p>`
  );
  return send({
    to: r.customer.email,
    replyTo: process.env.ADMIN_NOTIFY_EMAIL || undefined,
    subject: `Demande de massage reçue (réf. ${r.id})`,
    text,
    html,
  });
}

function sendAdminNotification(r) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) {
    console.warn('[email] ADMIN_NOTIFY_EMAIL absent : notification non envoyée.');
    return Promise.resolve({ ok: false, skipped: true });
  }
  const rows = recap(r).concat([
    ['Nom', r.customer.name],
    ['E-mail', r.customer.email],
    ['Téléphone', r.customer.phone],
    ['Message', r.comment || '—'],
  ]);
  const base = (process.env.SITE_URL || '').replace(/\/+$/, '');
  const link = base ? `${base}/admin` : '/admin';
  return send({
    to,
    replyTo: r.customer.email,
    subject: `Nouvelle demande de massage (réf. ${r.id})`,
    text: `Nouvelle demande reçue.\n\n${rows.map(([k, v]) => `${k} : ${v}`).join('\n')}\n\nAdministration : ${link}`,
    html: wrap(`<p><strong>Nouvelle demande reçue.</strong></p>${table(rows)}<p>Administration : ${escapeHtml(link)}</p>`),
  });
}

module.exports = { sendCustomerReceipt, sendAdminNotification };
