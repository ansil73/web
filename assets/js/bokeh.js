/* Warm fairy-light bokeh behind event sections (2D canvas, pre-rendered sprites, pauses off-screen). */
(function () {
  'use strict';
  var U = window.ULIKE || {};
  var canvases = document.querySelectorAll('[data-bokeh]');
  if (!canvases.length) return;
  var COLORS = [[255, 196, 110], [255, 170, 80], [255, 226, 160], [255, 214, 120], [242, 234, 24]];

  function sprite(rgb) {
    var s = document.createElement('canvas'), size = 128; s.width = s.height = size;
    var g = s.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(' + rgb + ',1)'); grad.addColorStop(0.45, 'rgba(' + rgb + ',0.55)'); grad.addColorStop(0.75, 'rgba(' + rgb + ',0.12)'); grad.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grad; g.fillRect(0, 0, size, size);
    return s;
  }
  var sprites = COLORS.map(function (c) { return sprite(c.join(',')); });

  canvases.forEach(function (c) {
    var host = c.parentElement, ctx = c.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = 0, h = 0, parts = [], visible = false, raf = 0, px = 0, py = 0, tx = 0, ty = 0;
    var small = window.innerWidth < 700;
    var count = small ? 30 : 64;
    function size() {
      var r = host.getBoundingClientRect(); w = r.width; h = r.height;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make() {
      var depth = Math.random();
      return {
        x: Math.random() * w, y: Math.random() * h, r: 6 + depth * depth * 42, depth: depth,
        s: sprites[Math.random() < 0.06 ? 4 : Math.floor(Math.random() * 4)],
        a: 0.12 + Math.random() * 0.4, tw: Math.random() * 6.28, sp: 0.004 + Math.random() * 0.01,
        vx: (Math.random() - 0.5) * 0.12, vy: -0.05 - Math.random() * 0.14
      };
    }
    function draw() {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      parts.forEach(function (p) {
        if (!U.reduced) {
          p.x += p.vx; p.y += p.vy; p.tw += p.sp;
          if (p.y < -60) { p.y = h + 40; p.x = Math.random() * w; }
          if (p.x < -60) p.x = w + 40; if (p.x > w + 60) p.x = -40;
        }
        var a = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        var ox = px * (0.2 + p.depth) * 18, oy = py * (0.2 + p.depth) * 12;
        ctx.globalAlpha = a;
        ctx.drawImage(p.s, p.x + ox - p.r, p.y + oy - p.r, p.r * 2, p.r * 2);
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (visible && !U.reduced) raf = requestAnimationFrame(draw);
    }
    size();
    for (var i = 0; i < count; i++) parts.push(make());
    draw();
    window.addEventListener('resize', function () { size(); if (!raf) draw(); });
    if (U.finePointer) {
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); }).observe(host);
    }
  });
})();
