(function () {
  'use strict';

  var grid = document.getElementById('requests');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.req'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var search = document.getElementById('search');
  var sort = document.getElementById('sort');
  var count = document.getElementById('count');
  var empty = document.getElementById('no-results');
  var toast = document.getElementById('toast');
  var metaCsrf = document.querySelector('meta[name="csrf-token"]');
  var csrf = metaCsrf ? metaCsrf.getAttribute('content') : '';
  var total = cards.length;
  var activeFilter = 'all';
  var STATUS_CLASSES = ['nouvelle', 'en_cours', 'confirmee', 'refusee'];
  var ORDER = { nouvelle: 0, en_cours: 1, confirmee: 2, refusee: 3 };
  var toastTimer;

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  cards.forEach(function (c) { c._search = norm(c.getAttribute('data-search')); });

  function pad(n) { return String(n).padStart(2, '0'); }
  function nowKey() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function cmp(a, b) { return a < b ? -1 : (a > b ? 1 : 0); }
  function createdDesc(a, b) { return -cmp(a.getAttribute('data-created'), b.getAttribute('data-created')); }

  var sorters = {
    recent: createdDesc,
    oldest: function (a, b) { return -createdDesc(a, b); },
    appt: function (a, b) {
      var n = nowKey();
      var A = a.getAttribute('data-appt');
      var B = b.getAttribute('data-appt');
      var aUp = A >= n;
      var bUp = B >= n;
      if (aUp !== bUp) return aUp ? -1 : 1;
      return aUp ? cmp(A, B) : -cmp(A, B);
    },
    status: function (a, b) {
      var d = ORDER[a.getAttribute('data-status')] - ORDER[b.getAttribute('data-status')];
      return d !== 0 ? d : createdDesc(a, b);
    }
  };

  function applySort() {
    var fn = sorters[sort.value] || sorters.recent;
    cards.slice().sort(fn).forEach(function (c) { grid.appendChild(c); });
  }

  function applyFilter() {
    var q = norm(search.value.trim());
    var visible = 0;
    cards.forEach(function (c) {
      var okStatus = activeFilter === 'all' || c.getAttribute('data-status') === activeFilter;
      var okText = !q || c._search.indexOf(q) !== -1;
      var show = okStatus && okText;
      c.hidden = !show;
      if (show) visible++;
    });
    count.textContent = visible + ' demande' + (visible > 1 ? 's' : '') + ' affichée' + (visible > 1 ? 's' : '') + ' sur ' + total;
    empty.hidden = visible !== 0;
  }

  function refreshCounts() {
    var counts = { all: cards.length, nouvelle: 0, en_cours: 0, confirmee: 0, refusee: 0 };
    cards.forEach(function (c) { counts[c.getAttribute('data-status')]++; });
    chips.forEach(function (chip) {
      var n = chip.querySelector('.chip__n');
      if (n) n.textContent = counts[chip.getAttribute('data-filter')];
    });
  }

  function say(msg, isError) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.toggle('toast--error', Boolean(isError));
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3500);
  }

  if (search) search.addEventListener('input', applyFilter);
  if (sort) sort.addEventListener('change', applySort);
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeFilter = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyFilter();
    });
  });

  // Changement de statut sans rechargement
  grid.addEventListener('change', function (e) {
    var sel = e.target.closest ? e.target.closest('select[name="status"]') : null;
    if (!sel) return;
    var card = sel.closest('.req');
    var previous = card.getAttribute('data-status');
    sel.disabled = true;

    fetch(sel.form.action, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ status: sel.value })
    })
      .then(function (res) {
        if (res.status === 401 || res.status === 403) { window.location.href = '/admin/login'; throw new Error('auth'); }
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var badge = card.querySelector('.badge');
        STATUS_CLASSES.forEach(function (s) {
          card.classList.remove('req--' + s);
          if (badge) badge.classList.remove('badge--' + s);
        });
        card.classList.add('req--' + data.status);
        card.setAttribute('data-status', data.status);
        if (badge) { badge.classList.add('badge--' + data.status); badge.textContent = data.label; }
        refreshCounts();
        applyFilter();
        if (sort && sort.value === 'status') applySort();
        say('Statut mis à jour : ' + data.label);
      })
      .catch(function (err) {
        if (err && err.message === 'auth') return;
        sel.value = previous;
        say('Le statut n’a pas pu être modifié. Rechargez la page puis réessayez.', true);
      })
      .then(function () { sel.disabled = false; });
  });
})();