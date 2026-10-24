/* U Like core: config binding, language toggle, navigation, page transitions, reveals, tilt, small effects. */
(function () {
  'use strict';
  var CFG = window.ULIKE_CONFIG || {};
  var I18N = window.ULIKE_I18N || { en: {}, ml: {} };
  var root = document.documentElement;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q).matches : false; };
  var reduced = mq('(prefers-reduced-motion: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)');

  var store = {
    get: function (k, session) { try { return (session ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, session) { try { (session ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* storage blocked */ } },
    del: function (k, session) { try { (session ? sessionStorage : localStorage).removeItem(k); } catch (e) { /* storage blocked */ } }
  };

  var U = window.ULIKE = window.ULIKE || {};
  U.cfg = CFG;
  U.store = store;
  U.reduced = reduced;
  U.finePointer = finePointer;
  U.lang = root.lang === 'ml' ? 'ml' : 'en';
  U.langHooks = U.langHooks || [];
  U.t = function (key) { return (I18N[U.lang] && I18N[U.lang][key]) || I18N.en[key] || key; };
  U.track = function (name, data) {
    try {
      (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: 'ulike_' + name }, data || {}));
      if (typeof window.gtag === 'function') window.gtag('event', name, data || {});
    } catch (e) { /* analytics is optional */ }
  };
  U.waNumber = String(CFG.whatsapp || '').replace(/\D/g, '');
  U.waUrl = function (text) { return 'https://wa.me/' + U.waNumber + (text ? '?text=' + encodeURIComponent(text) : ''); };
  var addrQuery = 'U Like, ' + ((CFG.address && CFG.address.full) || '').replace('–', '-');
  U.links = {
    tel1: CFG.phones && CFG.phones[0] ? 'tel:' + CFG.phones[0].tel : '',
    tel2: CFG.phones && CFG.phones[1] ? 'tel:' + CFG.phones[1].tel : '',
    mailto: CFG.email ? 'mailto:' + CFG.email : '',
    wa: U.waUrl("Hello U Like! I'd like to know more about your catering services."),
    maps: CFG.mapLink || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CFG.mapCoords || addrQuery),
    directions: 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(CFG.mapCoords || addrQuery),
    review: CFG.googleReviewLink || ''
  };

  /* ---------------- config binding: site-config.js is the single place to change details ---------------- */
  function bindConfig() {
    var phones = CFG.phones || [];
    var text = {
      phone1: phones[0] && phones[0].display, phone2: phones[1] && phones[1].display, email: CFG.email,
      address: CFG.address && CFG.address.full, whatsappDisplay: CFG.whatsappDisplay, hours: CFG.hours, footerCredit: CFG.footerCredit
    };
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var v = text[el.dataset.cfg];
      if (v) { el.textContent = v; el.hidden = false; }
      else if (el.dataset.cfg === 'hours' || el.dataset.cfg === 'footerCredit') { el.hidden = true; }
    });
    document.querySelectorAll('[data-cfg-wrap]').forEach(function (el) { el.hidden = !text[el.dataset.cfgWrap]; });
    document.querySelectorAll('[data-cfg-href]').forEach(function (el) {
      var v = U.links[el.dataset.cfgHref];
      if (v) { el.setAttribute('href', v); if (el.dataset.cfgHref === 'review') el.hidden = false; }
      else if (el.dataset.cfgHref === 'review') { el.hidden = true; }
    });
    var ig = CFG.instagram || [];
    document.querySelectorAll('[data-ig]').forEach(function (el) {
      var g = ig[+el.dataset.ig];
      var a = el.matches('a') ? el : el.querySelector('a');
      if (g && g.url) { el.hidden = false; if (a) a.href = g.url; } else { el.hidden = true; }
    });
    var stats = (CFG.stats || []).filter(function (s) { return s.value; });
    var trust = document.querySelector('[data-trust]');
    if (trust && stats.length) {
      stats.forEach(function (s) {
        var li = document.createElement('li');
        li.innerHTML = '<b data-count="' + s.value + '">' + s.value + (s.suffix || '') + '</b>&nbsp;<span></span>';
        li.querySelector('span').textContent = s.label;
        li.querySelector('b').dataset.suffix = s.suffix || '';
        trust.appendChild(li);
      });
    }
    var yearsDone = new Date().getFullYear() - (CFG.foundedYear || 2005);
    document.querySelectorAll('[data-years]').forEach(function (el) {
      var shown = Math.max(5, Math.floor(yearsDone / 5) * 5);
      el.textContent = shown + '+';
      el.dataset.count = shown; el.dataset.suffix = '+';
    });
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------------- language ---------------- */
  function applyLang(lang, persist) {
    U.lang = lang === 'ml' ? 'ml' : 'en';
    root.lang = U.lang;
    if (persist) store.set('ulike-lang', U.lang);
    var dict = I18N[U.lang] || {};
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.dataset.i18n;
      var v = dict[k] || I18N.en[k];
      if (v != null && el.textContent !== v) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.dataset.i18nAttr.split(';').forEach(function (pair) {
        var parts = pair.split(':');
        var v = dict[parts[1]] || I18N.en[parts[1]];
        if (v) el.setAttribute(parts[0], v);
      });
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === U.lang ? 'true' : 'false'); });
    U.langHooks.forEach(function (fn) { try { fn(U.lang); } catch (e) { /* keep going */ } });
  }
  U.applyLang = applyLang;

  /* ---------------- header & navigation ---------------- */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var hasHero = !!document.querySelector('.has-hero');
    var onScroll = function () { header.classList.toggle('is-solid', !hasHero || window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var subs = Array.prototype.slice.call(document.querySelectorAll('.has-sub'));
    var closeSubs = function (except) {
      subs.forEach(function (li) { if (li !== except) { li.classList.remove('is-open'); li.querySelector('button').setAttribute('aria-expanded', 'false'); } });
    };
    subs.forEach(function (li) {
      var btn = li.querySelector('button');
      btn.addEventListener('click', function () {
        var open = !li.classList.contains('is-open');
        closeSubs(li);
        li.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.has-sub')) closeSubs(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSubs(); });

    var mm = document.querySelector('[data-mobile-menu]');
    var openBtn = document.querySelector('[data-menu-open]');
    if (!mm || !openBtn) return;
    mm.inert = true;
    var setMenu = function (open) {
      mm.classList.toggle('is-open', open);
      mm.setAttribute('aria-hidden', open ? 'false' : 'true');
      mm.inert = !open;
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      root.style.overflow = open ? 'hidden' : '';
      if (open) mm.querySelector('[data-menu-close]').focus(); else openBtn.focus({ preventScroll: true });
    };
    openBtn.addEventListener('click', function () { setMenu(true); });
    mm.querySelector('[data-menu-close]').addEventListener('click', function () { setMenu(false); });
    mm.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    mm.addEventListener('click', function (e) { if (e.target.closest('a')) setTimeout(function () { setMenu(false); }, 50); });
    U.closeMobileMenu = function () { if (mm.classList.contains('is-open')) setMenu(false); };
  }

  /* ---------------- preloader (first visit only) & page transitions ---------------- */
  function initPreloader() {
    var pre = document.querySelector('.preloader');
    if (!pre || !root.classList.contains('show-preloader')) return;
    store.set('ulike-visited', '1');
    var t0 = Date.now(), done = false;
    var finish = function () {
      if (done) return; done = true;
      setTimeout(function () { pre.classList.add('is-done'); }, Math.max(0, 650 - (Date.now() - t0)));
    };
    window.addEventListener('load', finish);
    setTimeout(finish, 1150);
  }

  function initWipe() {
    var wipe = document.querySelector('.page-wipe');
    if (!wipe) return;
    if (root.classList.contains('wipe-enter')) {
      wipe.classList.add('is-entering');
      root.classList.remove('wipe-enter');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          wipe.classList.remove('is-entering');
          wipe.classList.add('is-leaving');
          setTimeout(function () { wipe.classList.remove('is-leaving'); }, 800);
        });
      });
    }
    if (reduced) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-open-quote')) return;
      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page, maybe an anchor
      e.preventDefault();
      store.set('ulike-wipe', '1', true);
      wipe.classList.remove('is-leaving');
      wipe.classList.add('is-covering');
      setTimeout(function () { location.href = url.href; }, 440);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) wipe.classList.remove('is-covering'); });
  }

  /* ---------------- reveal on scroll (content stays visible if JS or observers are unavailable) ---------------- */
  var io = null;
  function reveal(scope) {
    if (reduced || !('IntersectionObserver' in window)) return;
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('rv-in');
          en.target.classList.remove('rv-pending');
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    }
    var vh = window.innerHeight;
    (scope || document).querySelectorAll('.rv:not(.rv-in):not(.rv-pending)').forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.94) return; // already on screen: leave it visible
      var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty('--rv-delay', (Math.min(idx % 8, 6) * 0.06) + 's');
      el.classList.add('rv-pending');
      io.observe(el);
    });
    if (!reveal._guard) {
      // safety net: anything already scrolled into or past the viewport is shown, even if a frame was skipped
      reveal._guard = true;
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var limit = window.innerHeight;
          document.querySelectorAll('.rv-pending').forEach(function (el) {
            if (el.getBoundingClientRect().top < limit) { el.classList.add('rv-in'); el.classList.remove('rv-pending'); if (io) io.unobserve(el); }
          });
        });
      }, { passive: true });
    }
  }
  U.reveal = reveal;

  /* ---------------- counters ---------------- */
  function initCounters() {
    if (reduced || !('IntersectionObserver' in window)) return;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, to = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now();
        cio.unobserve(el);
        var step = function (t) {
          var p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------------- tilt, magnetic buttons, parallax ---------------- */
  function initTilt(scope) {
    if (!finePointer || reduced) return;
    (scope || document).querySelectorAll('[data-tilt]').forEach(function (el) {
      if (el._tilt) return;
      el._tilt = true;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 7).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 9).toFixed(2) + 'deg)';
        el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('is-tilting'); el.style.transform = ''; });
    });
  }
  U.initTilt = initTilt;

  function initMagnetic() {
    if (!finePointer || reduced) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.16).toFixed(1) + 'px,' + (dy * 0.26).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  function initParallax() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!els.length || reduced) return;
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        var child = el.firstElementChild;
        if (child) child.style.transform = 'translate3d(0,' + (p * -60).toFixed(1) + 'px,0) scale(1.12)';
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------------- steam over tea / dosa visuals ---------------- */
  function initSteam(scope) {
    if (reduced) return;
    (scope || document).querySelectorAll('[data-steam]:not(.has-steam)').forEach(function (host) {
      host.classList.add('has-steam');
      var c = document.createElement('canvas');
      c.className = 'steam-canvas'; c.setAttribute('aria-hidden', 'true');
      host.appendChild(c);
      var ctx = c.getContext('2d'), w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5), parts = [], visible = false, raf = 0;
      var size = function () { var r = host.getBoundingClientRect(); w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      var spawn = function (p) {
        p = p || {};
        p.x = w * (0.35 + Math.random() * 0.3); p.y = h * (0.62 + Math.random() * 0.12); p.r = 10 + Math.random() * 16;
        p.vy = 0.25 + Math.random() * 0.35; p.life = 0; p.max = 200 + Math.random() * 160; p.seed = Math.random() * 6.28; return p;
      };
      for (var i = 0; i < 22; i++) { var p = spawn(); p.life = Math.random() * p.max; parts.push(p); }
      var draw = function () {
        raf = 0; if (!visible) return;
        ctx.clearRect(0, 0, w, h);
        parts.forEach(function (p) {
          p.life++; p.y -= p.vy; p.r += 0.12;
          var k = p.life / p.max, a = Math.sin(Math.PI * Math.min(1, k)) * 0.09;
          var x = p.x + Math.sin(p.seed + p.life * 0.02) * 14 * k;
          var g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r);
          g.addColorStop(0, 'rgba(255,255,255,' + a + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, 6.283); ctx.fill();
          if (p.life > p.max) spawn(p);
        });
        raf = requestAnimationFrame(draw);
      };
      size();
      window.addEventListener('resize', size);
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); }).observe(host);
    });
  }
  U.initSteam = initSteam;

  /* ---------------- copy buttons & map ---------------- */
  function initCopy() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      var text = b.dataset.copy;
      var done = function () {
        b.textContent = U.t('cta.copied');
        setTimeout(function () { b.textContent = U.t('cta.copy'); }, 1600);
      };
      var fallback = function () {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { /* user can select the visible text */ }
        ta.remove();
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
        else fallback();
      } catch (err) { fallback(); }
    });
  }

  function initMap() {
    document.querySelectorAll('[data-map-load]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('[data-map]');
        var q = CFG.mapCoords || card.dataset.mapQuery;
        var f = document.createElement('iframe');
        f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(q) + '&z=15&output=embed';
        f.title = 'Map showing the location of U Like';
        f.loading = 'lazy';
        f.referrerPolicy = 'no-referrer-when-downgrade';
        f.allowFullscreen = true;
        card.querySelector('.map-art').replaceChildren(f);
        card.classList.add('has-map');
        btn.hidden = true;
        U.track('map_load');
      });
    });
  }

  /* ---------------- home: featured juice chips recolour the animated bottle ---------------- */
  function initJuicePicks() {
    var group = document.querySelector('[data-juice-picks]');
    var bottle = document.querySelector('[data-juice-bottle]');
    if (!group || !bottle) return;
    var chips = Array.prototype.slice.call(group.querySelectorAll('[data-liquid]'));
    var at = 0, timer = 0, touched = false;
    var pick = function (i) {
      at = i;
      chips.forEach(function (c, k) { c.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      bottle.style.setProperty('--liquid', chips[i].dataset.liquid);
    };
    chips.forEach(function (c, i) {
      c.addEventListener('click', function () { touched = true; pick(i); });
      if (finePointer) c.addEventListener('pointerenter', function () { touched = true; pick(i); });
    });
    if (reduced || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) {
      clearInterval(timer);
      if (en[0].isIntersecting) timer = setInterval(function () { if (!touched) pick((at + 1) % chips.length); }, 2600);
    }).observe(bottle);
  }

  /* ---------------- analytics hooks ---------------- */
  function initTracking() {
    if (CFG.gaId) {
      var s = document.createElement('script');
      s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.gaId);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', CFG.gaId);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      var kind = a.dataset.track || (h.indexOf('tel:') === 0 ? 'call' : h.indexOf('mailto:') === 0 ? 'email' : h.indexOf('wa.me') > -1 ? 'whatsapp' : /maps\/dir/.test(h) ? 'directions' : '');
      if (kind) U.track('click_' + kind, { href: h.slice(0, 60) });
    });
  }

  /* ---------------- boot ---------------- */
  bindConfig();
  if (U.lang === 'ml') applyLang('ml', false);
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.dataset.lang, true); });
  });
  initHeader();
  initPreloader();
  initWipe();
  reveal();
  initCounters();
  initTilt();
  initMagnetic();
  initParallax();
  initSteam();
  initCopy();
  initMap();
  initJuicePicks();
  initTracking();
})();
