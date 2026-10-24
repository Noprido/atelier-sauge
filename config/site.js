'use strict';

/*
 * ⚠️  CONFIGURATION CENTRALISÉE DU SITE
 * Toutes les valeurs ci-dessous sont des EXEMPLES à remplacer par les informations
 * fournies et validées par le client (prestations, prix, coordonnées, textes légaux…).
 * Les champs laissés vides ('') ne sont pas affichés sur le site.
 */
module.exports = {
  business: {
    name: 'Atelier Sauge', // nom commercial d’exemple
    tagline: 'Massage à domicile',
    description:
      'Massages à domicile en France : choisissez une prestation, indiquez votre adresse et votre créneau, nous revenons vers vous pour confirmer.',
    timezone: 'Europe/Paris',
    ogImage: '', // ex. '/images/og.jpg' (1200×630) quand l’image sera fournie
  },

  contact: {
    email: 'contact@exemple.fr',
    phone: '', // ex. '+33 6 12 34 56 78'
    whatsapp: '', // numéro international, chiffres uniquement, ex. '33612345678'
    telegram: '', // identifiant sans @, ex. 'atelier_sauge'
  },

  socials: [
    // { label: 'Instagram', url: 'https://www.instagram.com/votre-compte' },
    // { label: 'Facebook', url: 'https://www.facebook.com/votre-page' },
  ],

  hero: {
    title: 'Un massage chez vous, à l’heure qui vous convient.',
    text:
      'Choisissez une prestation, indiquez votre adresse et le créneau souhaité. Nous vérifions la disponibilité et revenons vers vous pour confirmer le rendez-vous.',
    assurances: [
      'Une demande n’est pas une réservation : le rendez-vous est confirmé après validation explicite.',
      'Aucun paiement ni coordonnée bancaire n’est demandé sur ce site.',
      'Intervention en France, selon l’adresse et la faisabilité du déplacement.',
    ],
  },

  booking: {
    leadHours: 24,
    maxAdvanceDays: 90,
    firstSlot: '09:00',
    lastSlot: '19:30',
    stepMinutes: 30,
    closedWeekdays: [], // 0 = dimanche … 6 = samedi
  },

  services: [
    {
      id: 'relaxant',
      name: 'Massage relaxant',
      description: 'Un massage enveloppant, à la pression douce à moyenne, pour relâcher les tensions du quotidien.',
      goal: 'Pensé pour la détente et le bien-être. Il ne remplace pas un avis médical.',
      durations: [
        { minutes: 60, price: 70 },
        { minutes: 90, price: 100 },
      ],
    },
    {
      id: 'dos-nuque',
      name: 'Massage dos et nuque',
      description: 'Une séance ciblée sur le haut du corps, utile après de longues journées assis ou devant un écran.',
      goal: 'Vise à apaiser les zones de tension du dos, des épaules et de la nuque.',
      durations: [
        { minutes: 30, price: 45 },
        { minutes: 45, price: 60 },
      ],
    },
    {
      id: 'recuperation',
      name: 'Massage de récupération',
      description: 'Des pressions plus appuyées sur les muscles sollicités, adaptées après l’effort ou une période sédentaire.',
      goal: 'Accompagne la récupération et la sensation de légèreté musculaire.',
      durations: [
        { minutes: 60, price: 75 },
        { minutes: 90, price: 105 },
      ],
    },
  ],

  pricing: {
    intro: 'Les tarifs ci-dessous concernent la prestation seule. Le tarif final vous est confirmé avant le rendez-vous.',
    notes: [
      'Le tarif peut varier selon la prestation, la durée et l’adresse d’intervention.',
      'Options et suppléments éventuels : [à compléter avec le client].',
    ],
  },

  travel: {
    title: 'Frais de déplacement',
    text: 'Le déplacement est inclus dans un rayon de [X] km autour de [ville]. Au-delà, des frais peuvent s’appliquer : ils vous sont communiqués avant toute confirmation.',
  },

  about: {
    name: '[Prénom Nom]',
    paragraphs: [
      '[Présentation du praticien ou de la praticienne : parcours, approche, façon de travailler.]',
      '[Valeurs et manière d’accueillir : écoute, respect du rythme de chacun, discrétion.]',
    ],
    qualifications: [], // uniquement des qualifications exactes et validées par le client
  },

  whyUs: [
    { title: 'Le confort de chez soi', text: 'Pas de trajet ni de salle d’attente : vous restez au calme et gardez votre soirée une fois la séance terminée.' },
    { title: 'Du temps gagné', text: 'Le praticien se déplace, vous n’avez qu’à libérer un espace pour la séance.' },
    { title: 'Une séance à votre mesure', text: 'Vous indiquez vos attentes ; la pression et le rythme s’ajustent pendant le massage.' },
    { title: 'Une organisation simple', text: 'Une demande en ligne, une confirmation claire, et les modalités de paiement communiquées avant le rendez-vous.' },
  ],

  steps: [
    { title: 'Vous choisissez une prestation', text: 'Durée et tarif sont indiqués avant l’envoi.' },
    { title: 'Vous remplissez la demande', text: 'Coordonnées, adresse, date et heure souhaitées.' },
    { title: 'Nous enregistrons votre demande', text: 'Vous recevez un e-mail récapitulatif. À ce stade, le créneau n’est pas réservé.' },
    { title: 'Nous vérifions la faisabilité', text: 'Disponibilité, zone d’intervention, tarif final et modalités de paiement.' },
    { title: 'Nous revenons vers vous', text: 'Vous recevez les instructions de paiement ou un appel pour finaliser.' },
    { title: 'Le rendez-vous est confirmé', text: 'Il l’est seulement après validation explicite de notre part.' },
  ],

  faq: [
    { q: 'Comment demander un rendez-vous ?', a: 'Remplissez le formulaire de demande en indiquant la prestation, votre adresse, la date et l’heure souhaitées. Vous recevez un e-mail de réception ; le rendez-vous n’est confirmé qu’après notre validation.' },
    { q: 'Comment savoir si mon adresse est desservie ?', a: 'Nous intervenons en France, sous réserve de la faisabilité du déplacement. Nous vérifions votre adresse à réception de la demande et vous indiquons si nous pouvons venir, et à quelles conditions.' },
    { q: 'Quels sont les tarifs et les éventuels frais de déplacement ?', a: 'Les tarifs de chaque prestation sont affichés dans la section Tarifs. Des frais de déplacement peuvent s’ajouter selon l’adresse ; ils sont communiqués avant toute confirmation. [À valider avec le client.]' },
    { q: 'Quels moyens de paiement sont acceptés ?', a: '[À compléter avec le client.] Le paiement n’est jamais demandé sur ce site : les modalités vous sont communiquées après étude de votre demande.' },
    { q: 'Quand le rendez-vous est-il confirmé ?', a: 'Une fois que nous avons vérifié la disponibilité, l’adresse et le tarif final, et que nous vous l’avons confirmé explicitement par e-mail ou par téléphone.' },
    { q: 'Comment modifier ou annuler une demande ?', a: 'Répondez à l’e-mail de réception ou contactez-nous en indiquant votre référence de demande. [Conditions d’annulation à compléter avec le client.]' },
    { q: 'Comment préparer la séance ?', a: 'Prévoyez un espace calme et suffisamment dégagé, à bonne température. [Consignes détaillées à valider avec le client.]' },
  ],

  legal: {
    draftNotice: true, // passer à false une fois les textes légaux relus et complétés
    companyName: '[Raison sociale ou nom de l’entrepreneur individuel]',
    legalForm: '[Forme juridique]',
    siret: '[Numéro SIRET]',
    address: '[Adresse du siège]',
    publisher: '[Nom du directeur de la publication]',
    host: { name: '[Nom de l’hébergeur]', address: '[Adresse de l’hébergeur]' },
    retention: '[Durée de conservation à définir, par exemple 12 mois après la dernière demande]',
    cancellation: '[Conditions d’annulation, de retard et de remboursement à définir]',
    payment: '[Modalités de paiement acceptées à définir]',
  },
};
