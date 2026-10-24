(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu mobile
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });
  }

  // « Choisir cette prestation » / « Réserver » : présélectionne la formule sans recharger la page
  var select = document.getElementById('formula');
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[data-formula]') : null;
    if (!link || !select) return;
    e.preventDefault();
    select.value = link.getAttribute('data-formula');
    var target = document.getElementById('reservation');
    if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    select.focus({ preventScroll: true });
    if (window.history && history.replaceState) history.replaceState(null, '', '#reservation');
  });

  // Formulaire : erreurs serveur et double envoi
  var form = document.getElementById('reservation-form');
  if (form) {
    if (form.getAttribute('data-has-errors') === '1') {
      var summary = document.getElementById('form-errors');
      if (summary) summary.focus();
    }
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Envoi en cours…';
      }
    });
    window.addEventListener('pageshow', function (ev) {
      var btn = form.querySelector('button[type="submit"]');
      if (ev.persisted && btn) {
        btn.disabled = false;
        btn.textContent = 'Envoyer ma demande';
      }
    });
  }
})();
