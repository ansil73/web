/* U Like enquiry system: forms that open WhatsApp with a ready message, email fallback, quote dialog,
   and the shared "My Event Menu" selection used by the Menu Builder. */
(function () {
  'use strict';
  var U = window.ULIKE || {};
  var CFG = U.cfg || window.ULIKE_CONFIG || {};
  var t = U.t;

  /* ---------------- shared menu selection (kept for the visit in sessionStorage) ---------------- */
  var KEY = 'ulike-menu';
  var sel = [];
  try { sel = JSON.parse(U.store.get(KEY, true) || '[]') || []; } catch (e) { sel = []; }
  var listeners = [];
  var save = function () { U.store.set(KEY, JSON.stringify(sel), true); listeners.forEach(function (fn) { fn(sel); }); };
  U.menuSel = {
    all: function () { return sel.slice(); },
    has: function (cat, name) { return sel.some(function (s) { return s.cat === cat && s.name === name; }); },
    toggle: function (cat, name, service) {
      if (this.has(cat, name)) sel = sel.filter(function (s) { return !(s.cat === cat && s.name === name); });
      else sel.push({ cat: cat, name: name, service: service || '' });
      save();
      return this.has(cat, name);
    },
    remove: function (cat, name) { sel = sel.filter(function (s) { return !(s.cat === cat && s.name === name); }); save(); },
    clear: function () { sel = []; save(); },
    count: function () { return sel.length; },
    grouped: function () {
      var g = {};
      sel.forEach(function (s) { (g[s.cat] = g[s.cat] || []).push(s.name); });
      return g;
    },
    text: function () {
      var g = this.grouped();
      return Object.keys(g).map(function (k) { return k + ': ' + g[k].join(', '); }).join('\n');
    },
    services: function () {
      var out = [];
      sel.forEach(function (s) { if (s.service && out.indexOf(s.service) < 0) out.push(s.service); });
      return out;
    },
    onChange: function (fn) { listeners.push(fn); }
  };

  /* ---------------- helpers ---------------- */
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>';
  var MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>';
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var todayISO = function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  var prettyDate = function (iso) {
    if (!iso) return '';
    var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };
  var cleanPhone = function (v) { return String(v || '').replace(/[\s\-()]/g, ''); };
  var validPhone = function (v) { return /^(?:\+?91|0)?[6-9]\d{9}$/.test(cleanPhone(v)); };

  var careers = (window.ULIKE_CAREERS || []).filter(function (c) { return c.status !== 'hidden'; }).map(function (c) { return c.title; });

  /* ---------------- form definitions ---------------- */
  var SUPPORT = ['Fresh juice counters', 'Live food stations', 'Dessert & live-scooping counters', 'Special counters',
    'Service & hosting staff', 'Service plates & chafing dishes', 'Stage décor, lights & sound', 'Products (Ulike Distributors)'];
  var F = {
    name: { key: 'f.name', type: 'text', req: true, auto: 'name', err: 'err.name' },
    mobile: { key: 'f.mobile', type: 'tel', req: true, auto: 'tel', err: 'err.mobile', placeholder: '90729 00080' },
    event: { key: 'f.event', type: 'select', req: true, options: CFG.eventTypes || [], err: 'err.select' },
    date: { key: 'f.date', type: 'date', req: true, err: 'err.date' },
    guests: { key: 'f.guests', type: 'select', req: true, options: CFG.guestRanges || [], err: 'err.select' },
    venue: { key: 'f.venue', type: 'text', req: true, err: 'err.required', placeholder: 'e.g. Pala, Parish Hall' },
    services: { key: 'f.services', type: 'checks', options: CFG.quoteServices || [], span: true },
    menu: { key: 'f.menu', type: 'textarea', span: true, hint: 'f.menuHint', rows: 3 },
    message: { key: 'f.message', type: 'textarea', span: true },
    business: { key: 'f.business', type: 'text', req: true, err: 'err.required' },
    contact: { key: 'f.contactPerson', type: 'text', req: true, auto: 'name', err: 'err.name' },
    location: { key: 'f.location', type: 'text', req: true, err: 'err.required' },
    size: { key: 'f.eventSize', type: 'select', options: CFG.guestRanges || [] },
    support: { key: 'f.support', type: 'checks', options: SUPPORT, span: true },
    place: { key: 'f.place', type: 'text', req: true, err: 'err.required' },
    role: { key: 'f.role', type: 'select', req: true, options: careers.concat(['Other']), err: 'err.select' },
    experience: { key: 'f.experience', type: 'select', options: ['Fresher', 'Less than 1 year', '1–3 years', '3–5 years', '5+ years'] },
    availability: { key: 'f.availability', type: 'select', options: ['Weekends', 'Weekdays', 'Full-time', 'Any day'] },
    adult: { key: 'f.adult', type: 'check', req: true, err: 'err.adult', span: true },
    fbEvent: { key: 'f.event', type: 'select', options: CFG.eventTypes || [] },
    feedback: { key: 'f.feedback', type: 'textarea', req: true, err: 'err.required', span: true, rows: 4 }
  };
  var FORMS = {
    quote: { fields: ['name', 'mobile', 'event', 'date', 'guests', 'venue', 'services', 'menu', 'message'], submit: 'cta.sendWa' },
    quick: { fields: ['name', 'mobile', 'event', 'date', 'guests', 'venue'], submit: 'cta.planWa' },
    partner: { fields: ['business', 'contact', 'mobile', 'location', 'size', 'support', 'message'], submit: 'cta.partner' },
    career: { fields: ['name', 'mobile', 'place', 'role', 'experience', 'availability', 'message', 'adult'], submit: 'cta.applyWa', email: 'cta.emailCv' },
    feedback: { fields: ['name', 'fbEvent', 'feedback'], submit: 'cta.feedbackWa' }
  };

  /* ---------------- rendering ---------------- */
  function fieldHTML(fid, name) {
    var f = F[name], id = fid + '-' + name, req = f.req ? ' <span class="req" aria-hidden="true">*</span>' : '';
    var cls = 'field' + (f.span || f.type === 'checks' ? ' span-2' : '');
    var label = '<span data-i18n="' + f.key + '">' + esc(t(f.key)) + '</span>' + req;
    var common = ' id="' + id + '" name="' + name + '"' + (f.req ? ' required aria-required="true"' : '') + ' aria-describedby="' + id + '-err"';
    var html = '';
    if (f.type === 'checks') {
      html = '<fieldset class="' + cls + '"><legend>' + label + '</legend><div class="check-grid">' +
        f.options.map(function (o, i) {
          return '<label class="check"><input type="checkbox" name="' + name + '" value="' + esc(o) + '" id="' + id + '-' + i + '"><span class="box">' + CHECK + '</span><span>' + esc(o) + '</span></label>';
        }).join('') + '</div></fieldset>';
      return html;
    }
    if (f.type === 'check') {
      return '<div class="' + cls + '"><label class="check"><input type="checkbox"' + common + '><span class="box">' + CHECK + '</span><span data-i18n="' + f.key + '">' + esc(t(f.key)) + '</span></label><p class="field-error" id="' + id + '-err" role="alert"></p></div>';
    }
    html = '<div class="' + cls + '"><label for="' + id + '">' + label + '</label>';
    if (f.type === 'select') {
      html += '<select class="select"' + common + '><option value="" data-i18n="f.choose">' + esc(t('f.choose')) + '</option>' +
        f.options.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    } else if (f.type === 'textarea') {
      html += '<textarea class="textarea" rows="' + (f.rows || 3) + '"' + common + '></textarea>';
    } else {
      html += '<input class="input" type="' + f.type + '"' + common + (f.auto ? ' autocomplete="' + f.auto + '"' : '') +
        (f.type === 'tel' ? ' inputmode="tel"' : '') + (f.type === 'date' ? ' min="' + todayISO() + '"' : '') +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + '>';
    }
    if (f.hint) html += '<p class="field-hint" data-i18n="' + f.hint + '">' + esc(t(f.hint)) + '</p>';
    html += '<p class="field-error" id="' + id + '-err" role="alert"></p></div>';
    return html;
  }

  function render(host) {
    if (host._rendered) return host._form;
    var type = host.dataset.form, def = FORMS[type];
    if (!def) return null;
    var fid = 'f-' + (host.dataset.formId || type);
    var emailKey = def.email || 'cta.sendEmail';
    host.innerHTML =
      '<form class="form" novalidate data-type="' + type + '">' +
      '<div class="form-grid">' + def.fields.map(function (n) { return fieldHTML(fid, n); }).join('') + '</div>' +
      '<div class="form-actions">' +
      '<button class="btn btn--wa" type="submit">' + WA + '<span data-i18n="' + def.submit + '">' + esc(t(def.submit)) + '</span></button>' +
      '<a class="btn btn--ghost" data-email href="mailto:' + esc(CFG.email || '') + '">' + MAIL + '<span data-i18n="' + emailKey + '">' + esc(t(emailKey)) + '</span></a>' +
      '</div>' +
      '<p class="form-note" data-i18n="f.privacy">' + esc(t('f.privacy')) + '</p>' +
      '</form>' +
      '<div class="form-success" hidden tabindex="-1">' +
      '<h3 data-i18n="ok.title">' + esc(t('ok.title')) + '</h3><p data-i18n="ok.text">' + esc(t('ok.text')) + '</p>' +
      '<p class="muted" data-i18n="ok.openHint">' + esc(t('ok.openHint')) + '</p>' +
      '<div class="btn-row"><a class="btn btn--wa" data-ok-link target="_blank" rel="noopener" href="#">' + WA + '<span data-i18n="ok.open">' + esc(t('ok.open')) + '</span></a>' +
      '<button class="text-btn" type="button" data-ok-again data-i18n="ok.again">' + esc(t('ok.again')) + '</button></div></div>';
    var form = host.querySelector('form');
    host._rendered = true; host._form = form;
    wire(host, form, type);
    prefillMenu(form);
    return form;
  }

  function values(form) {
    var v = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        if (F[el.name] && F[el.name].type === 'checks') { v[el.name] = v[el.name] || []; if (el.checked) v[el.name].push(el.value); }
        else v[el.name] = el.checked;
      } else v[el.name] = el.value.trim();
    });
    return v;
  }

  function compose(type, v) {
    var L = [];
    var line = function (label, val) { if (val) L.push('• ' + label + ': ' + val); };
    if (type === 'quote' || type === 'quick') {
      L.push("Hello U Like! I'd like a quote for my event.");
      line('Name', v.name); line('Mobile', v.mobile); line('Event', v.event); line('Date', prettyDate(v.date));
      line('Guests', v.guests); line('Venue', v.venue);
      if (v.services && v.services.length) line('Services', v.services.join(', '));
      if (v.menu) {
        L.push('• Menu picks:');
        v.menu.split(/\n+/).forEach(function (row) { if (row.trim()) L.push('   – ' + row.trim()); });
      }
      line('Note', v.message);
    } else if (type === 'partner') {
      L.push('Hello U Like! Caterer Partnership Enquiry.');
      line('Business', v.business); line('Contact person', v.contact); line('Mobile', v.mobile); line('Location', v.location);
      line('Typical event size', v.size);
      if (v.support && v.support.length) line('Support needed', v.support.join(', '));
      line('Note', v.message);
    } else if (type === 'career') {
      L.push('Hello U Like! I would like to apply for a job.');
      line('Name', v.name); line('Mobile', v.mobile); line('Place', v.place); line('Role', v.role);
      line('Experience', v.experience); line('Availability', v.availability); line('Note', v.message);
      L.push('• I confirm I am 18 years or older.');
      L.push('(I will attach my CV / photo in this chat.)');
    } else if (type === 'feedback') {
      L.push('Hello U Like! Here is my feedback.');
      line('Name', v.name); line('Event', v.fbEvent);
      L.push('', v.feedback);
    }
    L.push('', '(Sent from the U Like website)');
    return L.join('\n');
  }

  function subjectFor(type, v) {
    if (type === 'career') return 'Job Application – ' + (v.role || 'U Like');
    if (type === 'partner') return 'Caterer Partnership Enquiry – ' + (v.business || '');
    if (type === 'feedback') return 'Feedback for U Like';
    return 'Event enquiry – ' + [v.event, prettyDate(v.date)].filter(Boolean).join(', ');
  }

  function setError(form, name, key) {
    var el = form.elements[name];
    if (!el) return;
    if (el.length && !el.tagName) el = el[0];
    var field = el.closest('.field');
    var msg = field && field.querySelector('.field-error');
    if (field) field.classList.toggle('has-error', !!key);
    if (el.setAttribute) el.setAttribute('aria-invalid', key ? 'true' : 'false');
    if (msg) { msg.textContent = key ? t(key) : ''; msg.dataset.errKey = key || ''; }
  }

  function validate(form, type) {
    var v = values(form), first = null;
    FORMS[type].fields.forEach(function (n) {
      var f = F[n], bad = '';
      if (f.type === 'tel') bad = validPhone(v[n]) ? '' : f.err;
      else if (f.type === 'date') bad = !v[n] ? f.err : (v[n] < todayISO() ? f.err : '');
      else if (f.type === 'check') bad = f.req && !v[n] ? f.err : '';
      else if (f.req) bad = (!v[n] || (n === 'name' && v[n].length < 2)) ? f.err : '';
      if (f.type !== 'checks') setError(form, n, bad);
      if (bad && !first) first = form.elements[n];
    });
    if (first) { (first.focus ? first : first[0]).focus(); return null; }
    return v;
  }

  function wire(host, form, type) {
    var email = form.querySelector('[data-email]');
    var success = host.querySelector('.form-success');
    var updateEmail = function () {
      var v = values(form);
      email.href = 'mailto:' + (CFG.email || '') + '?subject=' + encodeURIComponent(subjectFor(type, v)) + '&body=' + encodeURIComponent(compose(type, v));
    };
    form.addEventListener('input', function (e) {
      updateEmail();
      if (e.target.name && e.target.closest('.field.has-error')) setError(form, e.target.name, '');
    });
    form.addEventListener('change', updateEmail);
    updateEmail();
    email.addEventListener('click', function () { updateEmail(); U.track('email_compose', { form: type }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = validate(form, type);
      if (!v) return;
      var text = compose(type, v);
      var url = U.waUrl(text);
      U.track('whatsapp_submit', { form: type });
      try { var w = window.open(url, '_blank'); if (w) w.opener = null; } catch (err) { /* the button below still works */ }
      if (CFG.web3formsKey && window.fetch) {
        fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: CFG.web3formsKey, subject: subjectFor(type, v), from_name: 'U Like website', message: text })
        }).catch(function () { /* email copy is optional */ });
      }
      success.querySelector('[data-ok-link]').href = url;
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });
    success.querySelector('[data-ok-again]').addEventListener('click', function () {
      form.reset(); prefillMenu(form); updateEmail();
      success.hidden = true; form.hidden = false;
      var first = form.querySelector('input,select,textarea'); if (first) first.focus();
    });
    form._updateEmail = updateEmail;
  }

  function prefillMenu(form) {
    if (!form || !form.elements.menu) return;
    var txt = U.menuSel.text();
    if (txt && !form.elements.menu.value) form.elements.menu.value = txt;
  }

  function tickServices(form, list) {
    if (!form || !list || !list.length) return;
    Array.prototype.forEach.call(form.querySelectorAll('input[name="services"]'), function (cb) {
      if (list.indexOf(cb.value) > -1) cb.checked = true;
    });
  }

  /* ---------------- quote dialog ---------------- */
  var dlg = document.getElementById('quote-dialog');
  U.openQuote = function (opts) {
    opts = opts || {};
    if (U.closeMobileMenu) U.closeMobileMenu();
    if (!dlg) { location.href = U.waUrl(); return; }
    var host = dlg.querySelector('[data-form]');
    var form = render(host);
    var success = host.querySelector('.form-success');
    if (success && !success.hidden) { success.hidden = true; form.hidden = false; form.reset(); }
    if (opts.menu) form.elements.menu.value = U.menuSel.text();
    else prefillMenu(form);
    tickServices(form, (opts.services || []).concat(U.menuSel.services()));
    if (opts.event && form.elements.event) {
      Array.prototype.forEach.call(form.elements.event.options, function (o) { if (o.value === opts.event) form.elements.event.value = o.value; });
    }
    if (form._updateEmail) form._updateEmail();
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    U.track('quote_open');
    setTimeout(function () { var f = form.querySelector('input'); if (f) f.focus(); }, 60);
  };
  if (dlg) {
    var closeDlg = function () { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); };
    dlg.querySelector('[data-dialog-close]').addEventListener('click', closeDlg);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open-quote]');
    if (!b) return;
    e.preventDefault();
    U.openQuote({
      services: b.dataset.services ? b.dataset.services.split(/\s*,\s*/) : [],
      event: b.dataset.event || '',
      menu: b.hasAttribute('data-with-menu')
    });
  });

  /* ---------------- inline forms on the page ---------------- */
  document.querySelectorAll('[data-form]').forEach(function (host) {
    if (host.closest('dialog')) return;
    render(host);
  });
  U.menuSel.onChange(function () {
    document.querySelectorAll('[data-form] form').forEach(function (f) { if (f._updateEmail) f._updateEmail(); });
  });
  U.langHooks.push(function () {
    document.querySelectorAll('.field-error').forEach(function (m) { if (m.dataset.errKey) m.textContent = t(m.dataset.errKey); });
  });
})();
