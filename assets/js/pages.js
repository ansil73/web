/* Gallery (filters, masonry, lightbox, reels), reviews and careers, rendered from their data files. */
(function () {
  'use strict';
  var U = window.ULIKE;
  var t = U.t;
  var IMAGES = window.ULIKE_IMAGES || {};
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var svg = function (p, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + p + '</svg>'; };
  var I_IMG = svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>');
  var I_VID = svg('<rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 10l5-3v10l-5-3z"/>');
  var I_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>';
  var I_L = svg('<path d="M15 18l-6-6 6-6"/>'), I_R = svg('<path d="M9 18l6-6-6-6"/>'), I_X = svg('<path d="M6 6l12 12M18 6L6 18"/>');
  var I_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z" fill="currentColor"/></svg>';

  function srcFor(item) {
    if (!item.src) return null;
    var set = IMAGES[item.src];
    if (set) return { src: set[Math.min(1, set.length - 1)].path, srcset: set.map(function (s) { return s.path + ' ' + s.w + 'w'; }).join(', '), w: set[set.length - 1].w, h: set[set.length - 1].h, big: set[set.length - 1].path };
    return { src: item.src, srcset: '', w: item.w || 1200, h: item.h || 900, big: item.src };
  }
  function placeholder(path, label, icon) {
    return '<div class="ph">' + (icon || I_IMG) + '<strong>' + esc(label) + '</strong><code>' + esc(path) + '</code></div>';
  }

  /* ---------------- gallery ---------------- */
  var grid = document.querySelector('[data-gallery]');
  if (grid) {
    var items = window.ULIKE_GALLERY || [], cats = window.ULIKE_GALLERY_CATS || [];
    var tabs = document.querySelector('[data-gallery-tabs]');
    var used = cats.filter(function (c) { return c.id === 'all' || items.some(function (i) { return i.cat === c.id; }); });
    var current = 'all';
    tabs.innerHTML = used.map(function (c) { return '<button class="chip" type="button" data-gcat="' + c.id + '" aria-pressed="' + (c.id === 'all') + '">' + esc(c.label) + '</button>'; }).join('');
    var visible = [];
    var draw = function () {
      visible = items.filter(function (i) { return current === 'all' || i.cat === current; });
      grid.innerHTML = visible.map(function (it, idx) {
        var s = srcFor(it);
        var inner = s
          ? '<img src="' + s.src + '"' + (s.srcset ? ' srcset="' + s.srcset + '" sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"' : '') + ' width="' + s.w + '" height="' + s.h + '" alt="' + esc(it.caption) + '" loading="lazy" decoding="async">'
          : placeholder(it.path, it.caption);
        return '<figure class="masonry-item rv' + (s ? '' : ' is-ph') + '"><button type="button" data-open="' + idx + '" aria-label="Open: ' + esc(it.caption) + '">' + inner + '</button><figcaption>' + esc(it.caption) + '</figcaption></figure>';
      }).join('');
      U.reveal(grid);
    };
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gcat]');
      if (!b) return;
      current = b.dataset.gcat;
      tabs.querySelectorAll('[data-gcat]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      draw();
    });
    draw();

    // lightbox
    var lb = null, at = 0, lastFocus = null;
    var show = function (i) {
      at = (i + visible.length) % visible.length;
      var it = visible[at], s = srcFor(it);
      lb.querySelector('.lightbox-stage-inner').innerHTML = s ? '<img src="' + s.big + '" alt="' + esc(it.caption) + '">' : placeholder(it.path, it.caption);
      lb.querySelector('.lightbox-cap').textContent = it.caption;
      lb.querySelector('.lightbox-count').textContent = (at + 1) + ' / ' + visible.length;
    };
    var close = function () { if (!lb) return; lb.hidden = true; document.documentElement.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    var open = function (i) {
      if (!lb) {
        lb = document.createElement('div');
        lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
        lb.innerHTML = '<div class="lightbox-top"><span class="lightbox-count"></span><button class="icon-btn" type="button" data-lb-close aria-label="Close">' + I_X + '</button></div>' +
          '<div class="lightbox-stage"><button class="icon-btn lightbox-nav prev" type="button" aria-label="Previous photo">' + I_L + '</button><div class="lightbox-stage-inner"></div>' +
          '<button class="icon-btn lightbox-nav next" type="button" aria-label="Next photo">' + I_R + '</button></div><p class="lightbox-cap"></p>';
        document.body.appendChild(lb);
        lb.querySelector('[data-lb-close]').addEventListener('click', close);
        lb.querySelector('.prev').addEventListener('click', function () { show(at - 1); });
        lb.querySelector('.next').addEventListener('click', function () { show(at + 1); });
        lb.addEventListener('click', function (e) { if (e.target.classList.contains('lightbox-stage')) close(); });
        document.addEventListener('keydown', function (e) {
          if (!lb || lb.hidden) return;
          if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(at - 1); else if (e.key === 'ArrowRight') show(at + 1);
        });
        var x0 = null;
        lb.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
        lb.addEventListener('pointerup', function (e) { if (x0 == null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); });
      }
      lastFocus = document.activeElement;
      lb.hidden = false; document.documentElement.style.overflow = 'hidden';
      show(i);
      lb.querySelector('[data-lb-close]').focus();
    };
    grid.addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) open(+b.dataset.open); });
  }

  /* ---------------- reels ---------------- */
  var reels = document.querySelector('[data-reels]');
  if (reels) {
    var list = window.ULIKE_REELS || [];
    reels.innerHTML = list.map(function (r, i) {
      if (r.src) {
        return '<figure class="reel"><video src="' + esc(r.src) + '"' + (r.poster ? ' poster="' + esc(r.poster) + '"' : '') + ' muted playsinline loop preload="none" aria-label="' + esc(r.caption) + '"></video>' +
          '<button class="reel-sound" type="button" aria-label="Play with sound">' + I_PLAY + '</button><figcaption>' + esc(r.caption) + '</figcaption></figure>';
      }
      if (r.url) {
        return '<figure class="reel reel--link"><a href="' + esc(r.url) + '" target="_blank" rel="noopener"><span class="reel-play">' + I_PLAY + '</span><span>' + esc(r.caption) + '</span></a><figcaption>' + esc(r.caption) + '</figcaption></figure>';
      }
      return '<figure class="reel">' + placeholder(r.path, r.caption, I_VID) + '<figcaption>' + esc(r.caption) + '</figcaption></figure>';
    }).join('');
    var vids = reels.querySelectorAll('video');
    if (vids.length && 'IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          var v = x.target;
          if (x.isIntersecting && !U.reduced) { v.preload = 'metadata'; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
        });
      }, { threshold: 0.5 });
      vids.forEach(function (v) { vio.observe(v); });
    }
    reels.addEventListener('click', function (e) {
      var b = e.target.closest('.reel-sound');
      if (!b) return;
      var v = b.parentElement.querySelector('video');
      v.muted = !v.muted; var p = v.play(); if (p && p.catch) p.catch(function () {});
      b.classList.toggle('is-on', !v.muted);
    });
  }

  /* ---------------- reviews (real reviews only) ---------------- */
  var REV = (window.ULIKE_REVIEWS || []).filter(function (r) { return r && r.text && r.name; });
  var stars = function (n) { var s = ''; for (var i = 0; i < 5; i++) s += '<span class="' + (i < (n || 5) ? 'on' : '') + '">' + I_STAR + '</span>'; return '<div class="stars" aria-label="' + (n || 5) + ' out of 5">' + s + '</div>'; };
  var card = function (r, big) {
    return '<figure class="review' + (big ? ' review--big' : '') + ' rv">' + (r.rating ? stars(r.rating) : '') + '<blockquote>' + esc(r.text) + '</blockquote>' +
      '<figcaption><b>' + esc(r.name) + '</b>' + [r.event, r.place, r.date].filter(Boolean).map(esc).join(' · ') + '</figcaption></figure>';
  };
  var revHost = document.querySelector('[data-reviews]');
  if (revHost && REV.length) {
    revHost.innerHTML = card(REV[0], true) + '<div class="reviews-grid">' + REV.slice(1).map(function (r) { return card(r); }).join('') + '</div>';
    document.querySelector('[data-reviews-wrap]').hidden = false;
    U.reveal(revHost);
  }
  var revPrev = document.querySelector('[data-reviews-preview]');
  if (revPrev && REV.length) {
    revPrev.querySelector('.wrap').innerHTML = '<div class="section-head"><p class="eyebrow" data-i18n="share.eyebrow">' + esc(t('share.eyebrow')) + '</p></div>' +
      '<div class="reviews-grid">' + REV.slice(0, 3).map(function (r) { return card(r); }).join('') + '</div>' +
      '<a class="link-arrow" href="reviews.html" style="margin-top:1.5rem">' + esc(t('nav.reviews')) + '</a>';
    U.reveal(revPrev);
  }

  /* ---------------- careers ---------------- */
  var roles = document.querySelector('[data-careers]');
  if (roles) {
    var jobs = (window.ULIKE_CAREERS || []).filter(function (j) { return j.status !== 'hidden'; });
    var drawRoles = function () {
      roles.innerHTML = jobs.map(function (j) {
        var open = j.status === 'open';
        return '<article class="role rv" data-tilt><div class="role-top"><span class="role-status' + (open ? ' is-open' : '') + '">' + esc(open ? t('careers.open') : t('careers.interest')) + '</span>' +
          '<span class="role-type">' + esc(j.type) + '</span></div><h3>' + esc(j.title) + '</h3><p>' + esc(j.desc) + '</p>' +
          '<a class="link-arrow" href="#apply" data-role="' + esc(j.title) + '">' + esc(t('careers.applyFor')) + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></article>';
      }).join('');
      U.reveal(roles); U.initTilt(roles);
    };
    drawRoles();
    U.langHooks.push(drawRoles);
    roles.addEventListener('click', function (e) {
      var a = e.target.closest('[data-role]');
      if (!a) return;
      var sel = document.querySelector('[data-form="career"] select[name="role"]');
      if (sel) { sel.value = a.dataset.role; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    var perks = window.ULIKE_CAREER_PERKS || [];
    if (perks.length) {
      document.querySelector('[data-perks]').innerHTML = perks.map(function (p) { return '<li class="chip chip--static">' + esc(p) + '</li>'; }).join('');
      document.querySelector('[data-perks-wrap]').hidden = false;
    }
  }
})();
