/* Home hero: two glass juice bottles with yellow caps (a nod to the brochure), wobbling juice,
   orbiting fruit slices and mint, golden splash bursts and warm bokeh. The poster image stays
   when WebGL is unavailable, on save-data/low-power devices, or with reduced motion. */
(function () {
  'use strict';
  var U = window.ULIKE || {};
  var hero = document.querySelector('[data-hero]');
  var canvas = document.querySelector('[data-hero-canvas]');
  if (!hero || !canvas || U.reduced || !U.webglOK || !U.webglOK() || U.lowPower()) return;

  var go = function () { U.loadThree().then(function (m) { init(m.THREE, m.RoomEnvironment); }).catch(function () { /* poster stays */ }); };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 900 }); else setTimeout(go, 250);

  function init(THREE, RoomEnvironment) {
    var K = U.kit(THREE);
    var small = window.matchMedia('(max-width: 820px)').matches;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    var scene = new THREE.Scene();
    K.env(renderer, scene, RoomEnvironment);
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    var CAM_Z = 10.5;
    camera.position.set(0, 0.5, CAM_Z);

    var key = new THREE.DirectionalLight(0xffe0a8, 2.4); key.position.set(-4, 6, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0xfff27a, 2.2); rim.position.set(5, 2, -5); scene.add(rim);
    var warm = new THREE.PointLight(0xffa640, 18, 9, 2); warm.position.set(0, 0.4, 2.6); scene.add(warm);

    if (!small) renderer.setClearColor(0x050505, 1); // transmissive glass needs a real backdrop to refract

    var world = new THREE.Group(); scene.add(world);
    var rig = new THREE.Group(); world.add(rig);
    var glowTex = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
      var gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, 'rgba(255,176,40,0.42)'); gr.addColorStop(0.45, 'rgba(255,140,20,0.12)'); gr.addColorStop(1, 'rgba(255,140,20,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
    })();
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    glow.position.set(0, 0, -3.2); world.add(glow);

    /* ---- bottle profile (radius, height) ---- */
    var V2 = THREE.Vector2;
    function profile(R, top, neck) {
      var pts = [new V2(0, 0)], c = 0.13, i, a;
      for (i = 0; i <= 6; i++) { a = -Math.PI / 2 + i / 6 * Math.PI / 2; pts.push(new V2(R - c + c * Math.cos(a), c + c * Math.sin(a))); }
      pts.push(new V2(R, top));
      for (i = 1; i <= 8; i++) { var t = i / 8; pts.push(new V2(R * (1 - t) * (1 - t) + 2 * (1 - t) * t * R + t * t * neck, top + t * 0.26)); }
      pts.push(new V2(neck, top + 0.42), new V2(neck + 0.035, top + 0.44), new V2(neck + 0.035, top + 0.52), new V2(neck, top + 0.54));
      return pts;
    }
    function liquidProfile(R, h) {
      var pts = [new V2(0, 0.05)], c = 0.11, i, a;
      for (i = 0; i <= 5; i++) { a = -Math.PI / 2 + i / 5 * Math.PI / 2; pts.push(new V2(R - c + c * Math.cos(a), 0.05 + c + c * Math.sin(a))); }
      pts.push(new V2(R, h), new V2(R * 0.75, h), new V2(R * 0.5, h), new V2(R * 0.25, h), new V2(0, h));
      return pts;
    }
    var wobbleUniforms = [];
    function liquidMat(hex, top) {
      var m = K.liquidMaterial(hex, 1);
      var u = { uTime: { value: 0 }, uAmp: { value: 1 }, uTop: { value: top } };
      wobbleUniforms.push(u);
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uTime = u.uTime; sh.uniforms.uAmp = u.uAmp; sh.uniforms.uTop = u.uTop;
        sh.vertexShader = 'uniform float uTime; uniform float uAmp; uniform float uTop;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\nfloat topMask = smoothstep(uTop - 0.08, uTop, position.y);\n' +
          'transformed.y += topMask * uAmp * (sin(position.x * 6.0 + uTime * 2.4) * 0.03 + sin(position.z * 5.0 + uTime * 1.8) * 0.025);');
      };
      return m;
    }
    function bottle(hex) {
      var g = new THREE.Group();
      var R = 0.62, TOP = 1.62, NECK = 0.5;
      var glass = new THREE.Mesh(new THREE.LatheGeometry(profile(R, TOP, NECK), 56), K.glassMaterial(true, !small));
      glass.renderOrder = 2;
      var fill = 1.42;
      var liquid = new THREE.Mesh(new THREE.LatheGeometry(liquidProfile(R * 0.93, fill), 48), liquidMat(hex, fill));
      liquid.renderOrder = 1;
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(NECK + 0.09, NECK + 0.09, 0.36, 44, 1), new THREE.MeshPhysicalMaterial({ color: 0xF2EA18, emissive: 0x3a3600, roughness: 0.28, clearcoat: 0.7, flatShading: true, envMapIntensity: 0.7 }));
      cap.position.y = TOP + 0.58;
      var capTop = new THREE.Mesh(new THREE.CylinderGeometry(NECK + 0.06, NECK + 0.09, 0.03, 44), new THREE.MeshPhysicalMaterial({ color: 0xF7F040, emissive: 0x3a3600, roughness: 0.22, clearcoat: 0.8, envMapIntensity: 0.7 }));
      capTop.position.y = TOP + 0.775;
      g.add(liquid, glass, cap, capTop);
      g.userData.top = TOP + 0.8;
      return g;
    }
    var b1 = bottle('#FFAE00'), b2 = bottle('#FF7A1A');
    b1.position.set(-0.78, -1.2, 0.1); b1.rotation.set(0, 0.3, 0.05);
    b2.position.set(0.8, -1.32, -0.25); b2.rotation.set(0, -0.4, -0.04);
    rig.add(b1, b2);

    /* ---- orbiting fruit ---- */
    var orbit = new THREE.Group(); rig.add(orbit);
    var pieces = [];
    var kinds = small ? ['orange', 'lime', 'grapefruit', 'straw', 'mint', 'orange', 'mint', 'lemon']
                      : ['orange', 'lime', 'grapefruit', 'straw', 'mint', 'orange', 'lemon', 'mint', 'straw', 'lime', 'mint', 'grapefruit', 'orange'];
    kinds.forEach(function (k, i) {
      var m = k === 'straw' ? K.strawberry(0.9) : k === 'mint' ? K.mint(0.9) : K.slice(k, 0.34 + Math.random() * 0.1);
      var ang = i / kinds.length * Math.PI * 2 + Math.random() * 0.4;
      var rad = (small ? 1.9 : 1.75) + Math.random() * (small ? 0.7 : 0.8);
      m.userData = { ang: ang, rad: rad, y: -0.8 + Math.random() * 2.9, spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.9), bob: Math.random() * 6.28 };
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      orbit.add(m); pieces.push(m);
    });

    /* ---- splash sparks & bokeh ---- */
    var SPARKS = small ? 180 : 420;
    var spark = K.particles(SPARKS, '#FFC21A');
    var sv = new Float32Array(SPARKS * 3), slife = new Float32Array(SPARKS), smax = new Float32Array(SPARKS);
    for (var i = 0; i < SPARKS; i++) { spark.pos[i * 3 + 1] = -99; slife[i] = 1; smax[i] = 1; }
    rig.add(spark.points);
    var BOKEH = small ? 40 : 90;
    var bokeh = K.particles(BOKEH, '#FFB45A');
    for (i = 0; i < BOKEH; i++) {
      bokeh.pos[i * 3] = (Math.random() - 0.5) * 22; bokeh.pos[i * 3 + 1] = (Math.random() - 0.5) * 12; bokeh.pos[i * 3 + 2] = -6 - Math.random() * 8;
      bokeh.size[i] = 0.25 + Math.random() * 0.9; bokeh.alpha[i] = 0.05 + Math.random() * 0.22;
    }
    scene.add(bokeh.points);
    var nextBurst = 1.2;
    function burst(from) {
      var made = 0, want = small ? 70 : 150;
      for (var j = 0; j < SPARKS && made < want; j++) {
        if (slife[j] < smax[j]) continue;
        var a = Math.random() * Math.PI * 2, sp = 0.3 + Math.random() * 0.9;
        spark.pos[j * 3] = from.x + (Math.random() - 0.5) * 0.3; spark.pos[j * 3 + 1] = from.y; spark.pos[j * 3 + 2] = from.z + (Math.random() - 0.5) * 0.3;
        sv[j * 3] = Math.cos(a) * sp; sv[j * 3 + 1] = 2.2 + Math.random() * 2.6; sv[j * 3 + 2] = Math.sin(a) * sp;
        slife[j] = 0; smax[j] = 1.1 + Math.random() * 0.9; spark.size[j] = 0.04 + Math.random() * 0.09;
        made++;
      }
    }

    /* ---- layout, pointer, scroll ---- */
    var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    function layout() {
      var w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      var halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z, halfW = halfH * camera.aspect;
      if (camera.aspect > 1.05) {
        world.position.set(halfW * 0.47, 0.25, 0);
        world.scale.setScalar(Math.min(1.12, halfH / 3.1));
      } else {
        // portrait: fit the bottles into the free band between the text and the bottom of the screen
        var copy = hero.querySelector('.hero-copy');
        var top = copy ? copy.getBoundingClientRect().bottom - hero.getBoundingClientRect().top + 24 : h * 0.6;
        var bottom = Math.min(h, window.innerHeight - (window.innerWidth < 900 ? 74 : 0)) - 8;
        if (bottom - top < 140) { top = h * 0.55; bottom = h - 20; }
        var ppu = (h / 2) / halfH;
        var sc = Math.min(0.95, ((bottom - top) * 0.88) / (2.45 * ppu), halfW / 2.5);
        world.scale.setScalar(sc);
        world.position.set(0, 0.5 - ((top + bottom) / 2 - h / 2) / ppu, 0);
      }
      var scale = renderer.getDrawingBufferSize(new THREE.Vector2()).y * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      spark.mat.uniforms.uScale.value = scale; bokeh.mat.uniforms.uScale.value = scale;
    }
    layout();
    window.addEventListener('resize', layout);
    if (U.finePointer) {
      window.addEventListener('pointermove', function (e) {
        target.x = (e.clientX / window.innerWidth - 0.5); target.y = (e.clientY / window.innerHeight - 0.5);
      }, { passive: true });
    } else if (window.DeviceOrientationEvent) {
      var onTilt = function (e) { if (e.gamma == null) return; target.x = Math.max(-0.5, Math.min(0.5, e.gamma / 50)); target.y = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 70)); };
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        hero.addEventListener('touchend', function ask() {
          hero.removeEventListener('touchend', ask);
          DeviceOrientationEvent.requestPermission().then(function (s) { if (s === 'granted') window.addEventListener('deviceorientation', onTilt); }).catch(function () {});
        });
      } else window.addEventListener('deviceorientation', onTilt);
    }

    var visible = true, running = false, clock = new THREE.Clock(), first = true;
    function frame() {
      running = false;
      if (!visible || document.hidden) return;
      var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      var p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
      camera.position.z = CAM_Z - p * 2.6;
      camera.position.y = 0.5 + p * 0.6;
      canvas.style.opacity = String(Math.max(0, 1 - p * 1.15));

      cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
      rig.rotation.y = Math.sin(t * 0.25) * 0.25 + cur.x * 0.6;
      rig.rotation.x = cur.y * 0.22;
      b1.position.y = -1.2 + Math.sin(t * 1.1) * 0.06; b2.position.y = -1.32 + Math.sin(t * 1.1 + 1.6) * 0.06;
      b1.rotation.z = 0.05 + Math.sin(t * 0.9) * 0.03; b2.rotation.z = -0.04 + Math.sin(t * 0.9 + 1.2) * 0.03;
      wobbleUniforms.forEach(function (u, k) { u.uTime.value = t + k; u.uAmp.value += (1 + Math.abs(cur.x) * 3 - u.uAmp.value) * 0.05; });

      orbit.rotation.y += dt * 0.16;
      pieces.forEach(function (m) {
        var d = m.userData;
        m.position.set(Math.cos(d.ang) * d.rad, d.y + Math.sin(t * 0.8 + d.bob) * 0.18, Math.sin(d.ang) * d.rad * 0.7);
        m.rotation.x += d.spin.x * dt; m.rotation.y += d.spin.y * dt; m.rotation.z += d.spin.z * dt;
      });

      nextBurst -= dt;
      if (nextBurst <= 0) {
        var b = Math.random() < 0.5 ? b1 : b2;
        burst(new THREE.Vector3(b.position.x, b.position.y + b.userData.top + 0.05, b.position.z));
        nextBurst = 2.6 + Math.random() * 1.6;
      }
      for (var j = 0; j < SPARKS; j++) {
        if (slife[j] >= smax[j]) { spark.alpha[j] = 0; continue; }
        slife[j] += dt;
        sv[j * 3 + 1] -= 4.6 * dt;
        spark.pos[j * 3] += sv[j * 3] * dt; spark.pos[j * 3 + 1] += sv[j * 3 + 1] * dt; spark.pos[j * 3 + 2] += sv[j * 3 + 2] * dt;
        var k = slife[j] / smax[j];
        spark.alpha[j] = (1 - k) * Math.min(1, k * 8) * 0.95;
      }
      spark.geo.attributes.position.needsUpdate = true; spark.geo.attributes.aAlpha.needsUpdate = true; spark.geo.attributes.aSize.needsUpdate = true;
      for (j = 0; j < BOKEH; j++) { bokeh.pos[j * 3 + 1] += dt * 0.08; if (bokeh.pos[j * 3 + 1] > 6) bokeh.pos[j * 3 + 1] = -6; }
      bokeh.geo.attributes.position.needsUpdate = true;
      bokeh.points.position.x = -cur.x * 0.8;

      renderer.render(scene, camera);
      if (first) { first = false; hero.classList.add('is-3d'); }
      if (p < 1) loop();
    }
    function loop() { if (!running) { running = true; requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { clock.getDelta(); loop(); } }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { clock.getDelta(); loop(); } });
    window.addEventListener('scroll', loop, { passive: true });
    loop();
  }
})();
