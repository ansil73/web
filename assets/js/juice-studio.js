/* Fresh Juice "Juice Studio": a 3D glass that drains and refills in the colour of the drink you tap,
   with a pour stream, splash particles, a yellow-and-black U Like straw and a garnish per drink.
   Without WebGL (or with reduced motion) an SVG glass changes colour instead. */
(function () {
  'use strict';
  var U = window.ULIKE || {};
  var JUICES = window.ULIKE_JUICES || [];
  var root = document.querySelector('[data-juice-studio]');
  if (!root || !JUICES.length) return;
  var nameEl = root.querySelector('[data-studio-name]');
  var fallback = root.querySelector('[data-studio-fallback]');
  var stage = root.querySelector('[data-studio-stage]');
  var canvas = root.querySelector('[data-studio-canvas]');
  var current = 12; // Mango
  U.currentJuice = JUICES[current];
  var api = null;

  function select(i, fromUser) {
    i = (i + JUICES.length) % JUICES.length;
    current = i;
    var j = JUICES[i];
    U.currentJuice = j;
    nameEl.textContent = j.name + (j.note ? ' (' + j.note + ')' : '');
    root.querySelectorAll('.swatch-btn').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.juice === i ? 'true' : 'false'); });
    if (fallback) {
      fallback.style.setProperty('--liquid', j.color);
      fallback.classList.remove('is-pouring'); void fallback.offsetWidth; fallback.classList.add('is-pouring');
    }
    if (api) api.pour(j);
    if (fromUser) U.track('juice_pour', { juice: j.name });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-juice]');
    if (!b) return;
    select(+b.dataset.juice, true);
    if (b.classList.contains('juice-card-pour')) {
      var r = stage.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) stage.scrollIntoView({ behavior: U.reduced ? 'auto' : 'smooth', block: 'center' });
    }
  });
  root.addEventListener('keydown', function (e) {
    if (!e.target.classList.contains('swatch-btn')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      var n = current + (e.key === 'ArrowRight' ? 1 : -1);
      select(n, true);
      var nb = root.querySelector('.swatch-btn[data-juice="' + ((n + JUICES.length) % JUICES.length) + '"]');
      if (nb) nb.focus();
    }
  });
  select(current, false);

  if (U.reduced || !U.webglOK || !U.webglOK() || U.lowPower() || !canvas) return;
  U.loadThree().then(function (m) { api = init(m.THREE, m.RoomEnvironment); }).catch(function () { /* SVG glass stays */ });

  function init(THREE, RoomEnvironment) {
    var K = U.kit(THREE);
    var small = window.matchMedia('(max-width: 820px)').matches;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    if (!small) renderer.setClearColor(0x081C1C, 1); // transmissive glass needs a real backdrop; CSS feathers the canvas edges
    var scene = new THREE.Scene();
    K.env(renderer, scene, RoomEnvironment);
    var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 1.9, 8.2);
    camera.lookAt(0, 1.05, 0);
    var key = new THREE.DirectionalLight(0xfff0d0, 2.2); key.position.set(-3, 5, 4); scene.add(key);
    var rim = new THREE.DirectionalLight(0xffe066, 2.4); rim.position.set(3, 3, -4); scene.add(rim);
    var under = new THREE.PointLight(0xffc040, 10, 6, 2); under.position.set(0, 0.3, 2); scene.add(under);

    var rig = new THREE.Group(); scene.add(rig);
    if (!small) {
      var gc = document.createElement('canvas'); gc.width = gc.height = 256; var gg = gc.getContext('2d');
      var gr = gg.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, 'rgba(252,204,6,0.30)'); gr.addColorStop(0.5, 'rgba(252,180,6,0.08)'); gr.addColorStop(1, 'rgba(252,180,6,0)');
      gg.fillStyle = gr; gg.fillRect(0, 0, 256, 256);
      var gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
      var glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      glowPlane.position.set(0, 1.2, -2.5); scene.add(glowPlane);
    }
    var V2 = THREE.Vector2;
    var BASE = 0.2, H = 2.25, R0 = 0.6, R1 = 0.82, WALL = 0.045;
    var rAt = function (y) { return R0 + (R1 - R0) * (y / H); };
    // tumbler with real wall thickness and a heavy base
    var gp = [new V2(0, 0), new V2(R0 - 0.04, 0), new V2(R0, 0.04), new V2(R1, H), new V2(R1 - WALL, H), new V2(rAt(BASE) - WALL, BASE), new V2(0, BASE)];
    var glass = new THREE.Mesh(new THREE.LatheGeometry(gp, 64), K.glassMaterial(true, !small));
    glass.renderOrder = 3;
    rig.add(glass);

    // liquid: rebuilt when the level changes so it always hugs the tapered wall
    var level = 0.82, liquidColor = new THREE.Color(JUICES[current].color);
    var liqMat = K.liquidMaterial(JUICES[current].color, small ? (JUICES[current].opacity || 1) : 1);
    var wob = { uTime: { value: 0 }, uAmp: { value: 1 }, uTop: { value: 1 } };
    liqMat.onBeforeCompile = function (sh) {
      sh.uniforms.uTime = wob.uTime; sh.uniforms.uAmp = wob.uAmp; sh.uniforms.uTop = wob.uTop;
      sh.vertexShader = 'uniform float uTime; uniform float uAmp; uniform float uTop;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\nfloat topMask = smoothstep(uTop - 0.06, uTop, position.y);\n' +
        'transformed.y += topMask * uAmp * (sin(position.x * 7.0 + uTime * 3.0) * 0.028 + sin(position.z * 6.0 + uTime * 2.2) * 0.022);');
    };
    var liquid = new THREE.Mesh(new THREE.BufferGeometry(), liqMat);
    liquid.renderOrder = 1;
    rig.add(liquid);
    function buildLiquid() {
      var top = BASE + 0.005 + (H - BASE - 0.12) * Math.max(0.02, level);
      var pts = [new V2(0, BASE + 0.005), new V2(rAt(BASE) - WALL - 0.012, BASE + 0.005), new V2(rAt(top) - WALL - 0.012, top),
        new V2((rAt(top) - WALL) * 0.66, top), new V2((rAt(top) - WALL) * 0.33, top), new V2(0, top)];
      liquid.geometry.dispose();
      liquid.geometry = new THREE.LatheGeometry(pts, 56);
      wob.uTop.value = top;
      return top;
    }
    var liquidTop = buildLiquid();

    // ice
    var iceMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, transparent: true, opacity: 0.38, clearcoat: 1, depthWrite: false });
    var ice = [0, 1].map(function (k) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.32, 2, 2, 2), iceMat);
      m.renderOrder = 2; m.userData.o = k * 2.4; rig.add(m); return m;
    });

    // U Like straw
    var straw = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.1, 20, 1, true), new THREE.MeshStandardMaterial({ map: K.stripeTex(), roughness: 0.4, side: THREE.DoubleSide }));
    straw.material.map.wrapS = straw.material.map.wrapT = THREE.RepeatWrapping;
    straw.material.map.repeat.set(1, 8);
    straw.position.set(0.28, 1.75, -0.12); straw.rotation.z = -0.24; straw.rotation.x = 0.1;
    rig.add(straw);

    // pour stream
    var stream = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1, 16, 1, true), K.liquidMaterial(JUICES[current].color, 1));
    stream.visible = false; rig.add(stream);

    // garnish on the rim
    var garnish = null;
    function setGarnish(j) {
      if (garnish) { rig.remove(garnish); }
      garnish = K.garnish(j.garnish, j.color);
      var flat = ['orange', 'lime', 'apple', 'watermelon', 'pineapple'].indexOf(j.garnish) > -1;
      if (flat) { garnish.position.set(-R1 + 0.05, H - 0.02, 0.15); garnish.rotation.set(Math.PI / 2, 0, 0.25); if (j.garnish === 'orange' || j.garnish === 'lime') garnish.rotation.set(0, 0.5, Math.PI / 2 - 0.15); }
      else if (j.garnish === 'cream') { garnish.position.set(0, H - 0.05, 0); garnish.scale.setScalar(1.6); }
      else if (j.garnish === 'coconut') { garnish.position.set(-R1 + 0.15, H + 0.05, 0.1); garnish.rotation.set(0.4, 0, 0.6); }
      else { garnish.position.set(-R1 + 0.12, H + 0.12, 0.12); }
      garnish.userData.s = garnish.scale.x; garnish.scale.multiplyScalar(0.01);
      rig.add(garnish);
    }
    setGarnish(JUICES[current]);

    var splash = K.particles(small ? 90 : 200, JUICES[current].color, { normal: false });
    var sv = new Float32Array(splash.count * 3), sl = new Float32Array(splash.count).fill(9), sm = new Float32Array(splash.count).fill(1);
    for (var i = 0; i < splash.count; i++) splash.pos[i * 3 + 1] = -99;
    rig.add(splash.points);
    function doSplash(y) {
      for (var j = 0; j < splash.count; j++) {
        var a = Math.random() * 6.283, s = 0.4 + Math.random() * 1.1, r = Math.random() * 0.5;
        splash.pos[j * 3] = Math.cos(a) * r; splash.pos[j * 3 + 1] = y; splash.pos[j * 3 + 2] = Math.sin(a) * r;
        sv[j * 3] = Math.cos(a) * s; sv[j * 3 + 1] = 1.5 + Math.random() * 2.4; sv[j * 3 + 2] = Math.sin(a) * s;
        sl[j] = 0; sm[j] = 0.7 + Math.random() * 0.7; splash.size[j] = 0.03 + Math.random() * 0.06;
      }
    }

    // pour animation state
    var anim = null;
    function pour(j) {
      anim = { t: 0, from: level, color0: liquidColor.clone(), color1: new THREE.Color(j.color), op1: small ? (j.opacity || 1) : 1, juice: j, swapped: false };
    }

    // drag to turn
    var drag = null, spin = 0, spinVel = 0;
    stage.addEventListener('pointerdown', function (e) { drag = { x: e.clientX }; stage.setPointerCapture && stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x; drag.x = e.clientX; spinVel = dx * 0.01; spin += spinVel; });
    var up = function () { drag = null; };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

    function layout() {
      var w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      var sc = renderer.getDrawingBufferSize(new THREE.Vector2()).y * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      splash.mat.uniforms.uScale.value = sc;
      rig.scale.setScalar(camera.aspect < 0.8 ? 0.82 : 1);
    }
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage); else window.addEventListener('resize', layout);

    var visible = true, running = false, clock = new THREE.Clock(), first = true;
    var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    function frame() {
      running = false;
      if (!visible || document.hidden) return;
      var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      if (!drag) { spinVel *= 0.94; spin += spinVel + dt * 0.25; }
      rig.rotation.y = spin;
      rig.position.y = Math.sin(t * 1.2) * 0.03;

      if (anim) {
        anim.t += dt;
        var DRAIN = 0.45, FILL = 0.95;
        if (anim.t < DRAIN) {
          level = anim.from + (0.06 - anim.from) * ease(anim.t / DRAIN);
        } else {
          if (!anim.swapped) {
            anim.swapped = true;
            liquidColor.copy(anim.color1);
            liqMat.color.copy(anim.color1); liqMat.emissive.copy(anim.color1).multiplyScalar(0.3);
            liqMat.sheenColor.copy(anim.color1).offsetHSL(0, 0, 0.2);
            liqMat.opacity = anim.op1; liqMat.transparent = anim.op1 < 1; liqMat.needsUpdate = true;
            stream.material.color.copy(anim.color1); stream.material.emissive.copy(anim.color1).multiplyScalar(0.2);
            splash.mat.uniforms.uColor.value.copy(anim.color1);
            setGarnish(anim.juice);
            stream.visible = true;
          }
          var k = Math.min(1, (anim.t - DRAIN) / FILL);
          level = 0.06 + (0.82 - 0.06) * ease(k);
          wob.uAmp.value = 1 + (1 - k) * 2.6;
          if (k >= 1) { stream.visible = false; doSplash(liquidTop); anim = null; }
        }
        liquidTop = buildLiquid();
      } else {
        wob.uAmp.value += (1 - wob.uAmp.value) * 0.05;
      }
      if (stream.visible) {
        var topY = 3.6, len = topY - liquidTop;
        stream.scale.y = len; stream.position.set(0, liquidTop + len / 2, 0);
        stream.rotation.y = -spin;
      }
      ice.forEach(function (m, k) {
        var a = t * 0.5 + m.userData.o;
        m.position.set(Math.cos(a) * 0.28, liquidTop - 0.06 + Math.sin(t * 1.4 + k) * 0.03, Math.sin(a) * 0.22);
        m.rotation.set(t * 0.2 + k, t * 0.3, 0.2);
        m.visible = level > 0.3;
      });
      if (garnish && garnish.scale.x < garnish.userData.s) garnish.scale.setScalar(Math.min(garnish.userData.s, garnish.scale.x + dt * garnish.userData.s * 3.5));
      if (garnish && garnish.userData.s && ['grape', 'berry', 'strawberry', 'mint'].indexOf(U.currentJuice.garnish) > -1) garnish.rotation.y += dt * 0.4;
      wob.uTime.value = t;

      for (var j = 0; j < splash.count; j++) {
        if (sl[j] >= sm[j]) { splash.alpha[j] = 0; continue; }
        sl[j] += dt; sv[j * 3 + 1] -= 5 * dt;
        splash.pos[j * 3] += sv[j * 3] * dt; splash.pos[j * 3 + 1] += sv[j * 3 + 1] * dt; splash.pos[j * 3 + 2] += sv[j * 3 + 2] * dt;
        var kk = sl[j] / sm[j]; splash.alpha[j] = (1 - kk) * 0.9;
      }
      splash.geo.attributes.position.needsUpdate = true; splash.geo.attributes.aAlpha.needsUpdate = true; splash.geo.attributes.aSize.needsUpdate = true;

      renderer.render(scene, camera);
      if (first) { first = false; root.classList.add('is-3d'); }
      loop();
    }
    function loop() { if (!running) { running = true; requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { clock.getDelta(); loop(); } }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { clock.getDelta(); loop(); } });
    loop();
    pour(JUICES[current]);
    return { pour: pour };
  }
})();
