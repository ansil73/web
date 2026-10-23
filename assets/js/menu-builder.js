/* Menu page rendering (from menu-data.js), search & filters, scrollspy tabs, and the "My Event Menu" tray. */
(function () {
  'use strict';
  var U = window.ULIKE;
  var t = U.t;
  var MENU = window.ULIKE_MENU || [];
  var JUICES = window.ULIKE_JUICES || [];
  var IMAGES = window.ULIKE_IMAGES || {};
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm4.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74 1.65.71 2.29.77 3.12.65.5-.08 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>';

  function imgTag(name, alt, sizes, cls) {
    var set = IMAGES[name];
    if (!set) return '';
    var big = set[set.length - 1], mid = set[Math.min(1, set.length - 1)];
    return '<img src="' + mid.path + '" srcset="' + set.map(function (s) { return s.path + ' ' + s.w + 'w'; }).join(', ') +
      '" sizes="' + sizes + '" width="' + big.w + '" height="' + big.h + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : '') + '>';
  }
  function mark(tag) { return tag ? '<i class="food-mark food-mark--' + tag + '" role="img" aria-label="' + (tag === 'veg' ? 'Veg' : 'Non-veg') + '"></i>' : ''; }
  function addBtn(cat, name, service, extraCls) {
    var on = U.menuSel.has(cat, name);
    return '<button type="button" class="mi-add' + (extraCls ? ' ' + extraCls : '') + '" data-add data-cat="' + esc(cat) + '" data-name="' + esc(name) + '" data-service="' + esc(service || '') + '" aria-pressed="' + on + '" aria-label="' + esc((on ? t('menu.added') : t('menu.add')) + ': ' + name) + '">' +
      (on ? CHECK : PLUS) + '<span>' + esc(on ? t('menu.added') : t('menu.add')) + '</span></button>';
  }

  /* ---------------- menu page ---------------- */
  var rootEl = document.querySelector('[data-menu-root]');
  if (rootEl) {
    rootEl.innerHTML = MENU.map(function (c) {
      var media;
      if (c.image) {
        var alts = { 'thattukada-dosa': 'Crispy dosha with coconut chutney', 'arabic-alfaham': 'Grilled Al Faham chicken', 'live-bread': 'Pathiri and palappam on a banana leaf',
          'pizza': 'Pizza from the live station', 'starters-samosa': 'Samosas on a plate', 'malabar-unnakkai': 'Unnakkai in a clay bowl', 'desserts-kunafa': 'Kunafa topped with pistachio', 'tea-cup': 'A steaming cup of tea' };
        media = '<div class="menu-cat-media"' + (c.style === 'tea' || c.style === 'chalk' ? ' data-steam' : '') + '>' + imgTag(c.image, alts[c.image] || c.title, '(max-width: 900px) 100vw, 45vw') +
          (c.image2 ? '<div class="menu-cat-inset">' + imgTag(c.image2, c.title, '220px') + '</div>' : '') +
          (c.gallery ? '<div class="menu-cat-strip">' + c.gallery.map(function (g) { return imgTag(g, c.title, '140px'); }).join('') + '</div>' : '') + '</div>';
      } else {
        media = '<div class="menu-cat-media menu-cat-media--type" aria-hidden="true"><span class="type-art">' + esc(c.title) + '</span>' +
          '<span class="type-art type-art--ghost">' + esc(c.title) + '</span></div>';
      }
      var items = c.items.map(function (it) {
        var tags = [];
        if (it.tag) tags.push(it.tag);
        (it.variants || []).forEach(function (v) { if (v.tag && tags.indexOf(v.tag) < 0) tags.push(v.tag); });
        if (c.live) tags.push('live');
        var search = (it.name + ' ' + (it.variants || []).map(function (v) { return v.name; }).join(' ') + ' ' + c.title).toLowerCase();
        var variants = it.variants ? '<div class="mi-variants">' + it.variants.map(function (v) {
          var nm = it.name + ' (' + v.name + ')', on = U.menuSel.has(c.title, nm);
          return '<button type="button" class="mi-variant" data-add data-cat="' + esc(c.title) + '" data-name="' + esc(nm) + '" data-service="' + esc(c.service || '') + '" aria-pressed="' + on + '">' + mark(v.tag) + '<span>' + esc(v.name) + '</span>' + (on ? CHECK : PLUS) + '</button>';
        }).join('') + '</div>' : '';
        return '<li class="menu-item rv" data-tags="' + tags.join(' ') + '" data-search="' + esc(search) + '">' +
          '<div class="mi-text"><span class="mi-name">' + esc(it.name) + '</span>' + mark(it.tag) + (it.note ? '<span class="mi-note">' + esc(it.note) + '</span>' : '') + '</div>' +
          (it.variants ? '' : addBtn(c.title, it.name, c.service)) + variants + '</li>';
      }).join('');
      var count = c.items.length;
      return '<section class="menu-cat menu-cat--' + c.style + '" id="' + c.id + '" data-cat-section="' + c.id + '" aria-labelledby="h-' + c.id + '">' +
        '<div class="menu-cat-head">' + media +
        '<div class="menu-cat-title rv">' +
        '<p class="eyebrow">' + (c.live ? '<span class="badge-live">Live</span> ' : '') + count + ' <span data-i18n="menu.items">' + esc(t('menu.items')) + '</span></p>' +
        '<h2 id="h-' + c.id + '"' + (c.style === 'chalk' ? ' class="hand"' : '') + '>' + esc(c.title) + (c.subtitle ? ' <span class="cat-sub">' + esc(c.subtitle) + '</span>' : '') + '</h2>' +
        '<p class="lead">' + esc(c.desc) + '</p></div></div>' +
        '<ul class="menu-items" role="list">' + items + '</ul>' +
        (c.more ? '<p class="menu-more">+ ' + esc(c.more) + '</p>' : '') + '</section>';
    }).join('');
    U.reveal(rootEl);
    U.initSteam(rootEl);
    U.initTilt(rootEl);

    // filters & search
    var search = document.getElementById('menu-search');
    var filter = 'all';
    var empty = document.querySelector('[data-menu-empty]');
    var apply = function () {
      var q = (search && search.value || '').trim().toLowerCase(), any = false;
      rootEl.querySelectorAll('.menu-cat').forEach(function (sec) {
        var shown = 0;
        sec.querySelectorAll('.menu-item').forEach(function (li) {
          var ok = (!q || li.dataset.search.indexOf(q) > -1) && (filter === 'all' || (' ' + li.dataset.tags + ' ').indexOf(' ' + filter + ' ') > -1);
          li.hidden = !ok; if (ok) { shown++; li.classList.remove('rv-pending'); li.classList.add('rv-in'); }
        });
        sec.hidden = shown === 0;
        if (shown) any = true;
      });
      if (empty) empty.hidden = any;
    };
    if (search) search.addEventListener('input', apply);
    document.querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });

    // scrollspy tabs
    var tabs = {};
    document.querySelectorAll('[data-tab]').forEach(function (a) { tabs[a.dataset.tab] = a; });
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          Object.keys(tabs).forEach(function (k) { tabs[k].classList.toggle('is-active', k === en.target.id); });
          var tab = tabs[en.target.id];
          if (tab && tab.parentElement) {
            var nav = tab.parentElement, l = tab.offsetLeft - nav.clientWidth / 2 + tab.clientWidth / 2;
            nav.scrollTo({ left: l, behavior: U.reduced ? 'auto' : 'smooth' });
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      rootEl.querySelectorAll('.menu-cat').forEach(function (s) { spy.observe(s); });
    }
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'auto' }); }, 60);
    }
  }

  /* ---------------- add / remove (menu items, juices) ---------------- */
  var refreshButtons = function () {
    document.querySelectorAll('[data-add]').forEach(function (b) {
      var on = U.menuSel.has(b.dataset.cat, b.dataset.name);
      if (b.getAttribute('aria-pressed') === String(on) && b._lang === U.lang) return;
      b._lang = U.lang;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (b.classList.contains('mi-variant')) {
        var label = b.querySelector('span:not(.food-mark)');
        b.querySelector('svg:last-child').outerHTML = on ? CHECK : PLUS;
      } else {
        b.innerHTML = (on ? CHECK : PLUS) + '<span>' + esc(on ? t('menu.added') : t('menu.add')) + '</span>';
        b.setAttribute('aria-label', (on ? t('menu.added') : t('menu.add')) + ': ' + b.dataset.name);
      }
    });
    document.querySelectorAll('[data-add-juice]').forEach(function (b) {
      var j = JUICES[+b.dataset.addJuice];
      var on = j && U.menuSel.has('Fresh Juice', j.name);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.innerHTML = (on ? CHECK : PLUS) + '<span>' + esc(on ? t('menu.added') : t('menu.add')) + '</span>';
    });
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (b) {
      U.menuSel.toggle(b.dataset.cat, b.dataset.name, b.dataset.service);
      U.track('menu_toggle', { item: b.dataset.name });
      return;
    }
    var jb = e.target.closest('[data-add-juice]');
    if (jb) {
      var j = JUICES[+jb.dataset.addJuice];
      if (j) U.menuSel.toggle('Fresh Juice', j.name, 'Fresh juice counter');
      return;
    }
    var sa = e.target.closest('[data-studio-add]');
    if (sa && U.currentJuice) {
      if (!U.menuSel.has('Fresh Juice', U.currentJuice.name)) U.menuSel.toggle('Fresh Juice', U.currentJuice.name, 'Fresh juice counter');
      sa.querySelector('span').textContent = t('juice.added');
      setTimeout(function () { sa.querySelector('span').textContent = t('juice.add'); }, 1600);
    }
  });

  /* ---------------- tray ---------------- */
  var tray = document.querySelector('[data-tray]');
  var renderTray = function (bump) {
    if (!tray) return;
    var n = U.menuSel.count();
    tray.hidden = n === 0;
    if (!tray._built) {
      tray._built = true;
      tray.innerHTML =
        '<div class="tray-panel" id="tray-panel" hidden>' +
        '<div class="tray-panel-head"><h3 data-i18n="menu.myMenu">' + esc(t('menu.myMenu')) + '</h3>' +
        '<button class="icon-btn" type="button" data-tray-close aria-label="Close">' + CLOSE + '</button></div>' +
        '<div class="tray-list" data-tray-list></div>' +
        '<div class="tray-foot"><button class="btn btn--wa btn--block" type="button" data-tray-send>' + WA + '<span data-i18n="menu.sendMenu">' + esc(t('menu.sendMenu')) + '</span></button>' +
        '<button class="text-btn" type="button" data-tray-clear data-i18n="menu.clear">' + esc(t('menu.clear')) + '</button></div></div>' +
        '<button class="tray-toggle" type="button" aria-expanded="false" aria-controls="tray-panel" data-tray-toggle>' +
        '<span data-i18n="menu.myMenu">' + esc(t('menu.myMenu')) + '</span><span class="tray-count" data-tray-count>0</span></button>';
      var panel = tray.querySelector('.tray-panel'), toggle = tray.querySelector('[data-tray-toggle]');
      var setOpen = function (open) { panel.hidden = !open; toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); };
      toggle.addEventListener('click', function () { setOpen(panel.hidden); });
      tray.querySelector('[data-tray-close]').addEventListener('click', function () { setOpen(false); toggle.focus(); });
      tray.querySelector('[data-tray-clear]').addEventListener('click', function () { U.menuSel.clear(); setOpen(false); });
      tray.querySelector('[data-tray-send]').addEventListener('click', function () { setOpen(false); U.openQuote({ menu: true }); });
      tray.addEventListener('click', function (e) {
        var r = e.target.closest('[data-remove]');
        if (r) U.menuSel.remove(r.dataset.cat, r.dataset.name);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });
    }
    var g = U.menuSel.grouped();
    var list = tray.querySelector('[data-tray-list]');
    var keys = Object.keys(g);
    list.innerHTML = keys.length ? keys.map(function (k) {
      return '<div class="tray-group"><h4>' + esc(k) + '</h4>' + g[k].map(function (nm) {
        return '<div class="tray-item"><span>' + esc(nm) + '</span><button type="button" data-remove data-cat="' + esc(k) + '" data-name="' + esc(nm) + '" aria-label="Remove ' + esc(nm) + '">' + CLOSE + '</button></div>';
      }).join('') + '</div>';
    }).join('') : '<p class="tray-empty">' + esc(t('menu.empty')) + '</p>';
    var c = tray.querySelector('[data-tray-count]');
    c.textContent = n;
    if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  };
  U.menuSel.onChange(function () { refreshButtons(); renderTray(true); });
  U.langHooks.push(function () { refreshButtons(); });
  refreshButtons();
  renderTray(false);
})();
