/* "Live counters" 3D ring carousel: CSS 3D transforms, drag/swipe with inertia, idle auto-rotate, keyboard friendly. */
(function () {
  'use strict';
  var U = window.ULIKE || {};
  var stage = document.querySelector('[data-ring]');
  if (!stage) return;
  var ring = stage.querySelector('.ring');
  var cards = Array.prototype.slice.call(ring.children);
  var n = cards.length, step = 360 / n;
  var angle = 0, vel = 0, target = null, radius = 400, visible = true, lastInteract = 0, raf = 0;
  var dragging = false, startX = 0, lastX = 0, lastT = 0, moved = 0;

  function layout() {
    var w = stage.clientWidth;
    var cw = w < 520 ? 196 : w < 900 ? 232 : 272;
    stage.style.setProperty('--card-w', cw + 'px');
    stage.style.setProperty('--card-h', Math.round(cw * 1.36) + 'px');
    radius = Math.round((cw / 2) / Math.tan(Math.PI / n) * 1.16);
    cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)'; });
    paint();
  }
  function paint() {
    ring.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + angle.toFixed(3) + 'deg)';
    cards.forEach(function (c, i) {
      var a = ((i * step + angle) % 360 + 360) % 360;
      var facing = Math.cos(a * Math.PI / 180); // 1 = front
      c.style.opacity = (0.25 + 0.75 * Math.max(0, facing)).toFixed(3);
      c.style.filter = facing > 0.92 ? 'none' : 'brightness(' + (0.45 + 0.5 * Math.max(0, facing)).toFixed(2) + ')';
      c.tabIndex = facing > 0.5 ? 0 : -1;
      c.setAttribute('aria-hidden', facing > 0.2 ? 'false' : 'true');
    });
  }
  function tick() {
    raf = 0;
    var now = performance.now();
    if (!dragging) {
      if (target != null) {
        var d = target - angle;
        angle += d * 0.12;
        if (Math.abs(d) < 0.05) { angle = target; target = null; }
      } else if (Math.abs(vel) > 0.01) {
        angle += vel; vel *= 0.94;
      } else if (!U.reduced && now - lastInteract > 2600) {
        angle -= 0.07;
      }
    }
    paint();
    if (visible && (dragging || target != null || Math.abs(vel) > 0.01 || !U.reduced)) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(tick); }
  function snapTo(dir) {
    lastInteract = performance.now(); vel = 0;
    var base = Math.round(angle / step) * step;
    target = base + dir * step;
    kick();
  }

  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    dragging = true; moved = 0; startX = lastX = e.clientX; lastT = performance.now(); vel = 0; target = null;
    stage.classList.add('is-dragging');
    kick();
  });
  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, now = performance.now();
    if (Math.abs(e.clientX - startX) > 6 && !stage.hasPointerCapture(e.pointerId)) { try { stage.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } }
    moved = Math.max(moved, Math.abs(e.clientX - startX));
    angle += dx * 0.28;
    vel = (dx * 0.28) / Math.max(1, now - lastT) * 16;
    lastX = e.clientX; lastT = now; lastInteract = now;
  });
  var end = function () {
    if (!dragging) return;
    dragging = false; stage.classList.remove('is-dragging'); lastInteract = performance.now();
    if (Math.abs(vel) < 0.4) { target = Math.round(angle / step) * step; }
    kick();
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  stage.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  stage.addEventListener('dragstart', function (e) { e.preventDefault(); });

  var prev = document.querySelector('[data-ring-prev]'), next = document.querySelector('[data-ring-next]');
  if (prev) prev.addEventListener('click', function () { snapTo(1); });
  if (next) next.addEventListener('click', function () { snapTo(-1); });
  cards.forEach(function (c, i) {
    c.addEventListener('focus', function () { lastInteract = performance.now(); vel = 0; target = -i * step + Math.round((angle + i * step) / 360) * 360; kick(); });
  });
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { snapTo(1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { snapTo(-1); e.preventDefault(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }).observe(stage);
  }
  window.addEventListener('resize', layout);
  layout();
  kick();
})();
