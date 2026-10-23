/* Shared Three.js kit for the U Like 3D scenes. Everything is built procedurally (no model files):
   citrus wheels, strawberries, mint, grapes, berries, watermelon, pineapple, apple, coconut, cream,
   glass and juice materials, and a GPU-light spark/bokeh particle system. */
(function () {
  'use strict';
  var U = window.ULIKE = window.ULIKE || {};

  U.webglOK = function () {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
    catch (e) { return false; }
  };
  U.lowPower = function () {
    var conn = navigator.connection || {};
    if (conn.saveData) return true;
    var cores = navigator.hardwareConcurrency || 8, mem = navigator.deviceMemory || 8;
    return cores <= 2 || mem <= 2;
  };
  U.loadThree = function () {
    if (!U._three) {
      U._three = Promise.all([import('three'), import('three/addons/environments/RoomEnvironment.js')])
        .then(function (m) { return { THREE: m[0], RoomEnvironment: m[1].RoomEnvironment }; });
    }
    return U._three;
  };

  U.kit = function (THREE) {
    var K = {};
    var srgb = function (tex) { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex; };
    var canvasTex = function (size, draw) { var c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); return srgb(new THREE.CanvasTexture(c)); };

    K.env = function (renderer, scene, RoomEnvironment) {
      var pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    };

    K.glassMaterial = function (strong, transmissive) {
      if (transmissive) {
        return new THREE.MeshPhysicalMaterial({
          color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.18, ior: 1.5,
          clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8, specularIntensity: 1, attenuationColor: 0xfff6e0, attenuationDistance: 6
        });
      }
      return new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: strong ? 0.13 : 0.1,
        clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.2, depthWrite: false, side: THREE.DoubleSide,
        specularIntensity: 1, ior: 1.5
      });
    };
    K.liquidMaterial = function (hex, opacity) {
      var c = new THREE.Color(hex);
      return new THREE.MeshPhysicalMaterial({
        color: c, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0, sheenColor: c.clone(),
        emissive: c.clone().multiplyScalar(0.3), transparent: opacity < 1, opacity: opacity || 1, envMapIntensity: 0.55
      });
    };

    /* citrus wheel texture: rind, pith, ten segments, centre */
    K.citrusTex = function (rind, pith, flesh, membrane) {
      return canvasTex(256, function (g, s) {
        var c = s / 2;
        g.fillStyle = rind; g.beginPath(); g.arc(c, c, c, 0, 6.2832); g.fill();
        g.fillStyle = pith; g.beginPath(); g.arc(c, c, c * 0.88, 0, 6.2832); g.fill();
        for (var i = 0; i < 10; i++) {
          var a0 = i / 10 * 6.2832 + 0.03, a1 = (i + 1) / 10 * 6.2832 - 0.03;
          var grad = g.createRadialGradient(c, c, c * 0.1, c, c, c * 0.8);
          grad.addColorStop(0, membrane); grad.addColorStop(0.25, flesh); grad.addColorStop(1, flesh);
          g.fillStyle = grad; g.beginPath(); g.moveTo(c + Math.cos((a0 + a1) / 2) * c * 0.1, c + Math.sin((a0 + a1) / 2) * c * 0.1);
          g.arc(c, c, c * 0.8, a0, a1); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2;
          for (var k = 0; k < 7; k++) { var r = c * (0.25 + Math.random() * 0.5), a = a0 + Math.random() * (a1 - a0); g.beginPath(); g.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r); g.lineTo(c + Math.cos(a) * (r + 10), c + Math.sin(a) * (r + 10)); g.stroke(); }
        }
        g.fillStyle = membrane; g.beginPath(); g.arc(c, c, c * 0.07, 0, 6.2832); g.fill();
      });
    };
    var CITRUS = {
      orange: ['#E9790E', '#FFE7B8', '#FF9F1C', '#FFD08A'],
      lime: ['#3F8F22', '#EAF5C9', '#A9D13F', '#E3F1B0'],
      grapefruit: ['#F08A3C', '#FFE3CF', '#F2546A', '#FFC1C8'],
      lemon: ['#F2C81B', '#FFF6CF', '#F7E35A', '#FFF3B0']
    };
    var cache = {};
    K.slice = function (kind, radius) {
      var p = CITRUS[kind] || CITRUS.orange;
      if (!cache[kind]) cache[kind] = K.citrusTex(p[0], p[1], p[2], p[3]);
      var face = new THREE.MeshStandardMaterial({ map: cache[kind], roughness: 0.45, emissive: new THREE.Color(p[2]).multiplyScalar(0.08) });
      var side = new THREE.MeshStandardMaterial({ color: p[0], roughness: 0.6 });
      var m = new THREE.Mesh(new THREE.CylinderGeometry(radius || 0.42, radius || 0.42, 0.075, 48), [side, face, face]);
      return m;
    };
    K.strawberry = function (scale) {
      var pts = [[0, -0.34], [0.1, -0.31], [0.19, -0.22], [0.26, -0.09], [0.28, 0.04], [0.25, 0.15], [0.17, 0.23], [0.07, 0.27], [0, 0.275]]
        .map(function (q) { return new THREE.Vector2(q[0], q[1]); });
      var tex = cache.straw || (cache.straw = canvasTex(256, function (g, s) {
        var grad = g.createLinearGradient(0, 0, 0, s); grad.addColorStop(0, '#B5121F'); grad.addColorStop(1, '#F0344B');
        g.fillStyle = grad; g.fillRect(0, 0, s, s);
        g.fillStyle = '#FFE27A';
        for (var y = 14; y < s; y += 22) for (var x = (y / 22 % 2) * 11; x < s; x += 22) { g.beginPath(); g.ellipse(x, y, 2.2, 3.4, 0, 0, 6.28); g.fill(); }
      }));
      var body = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, emissive: 0x2a0004 }));
      var grp = new THREE.Group(); grp.add(body);
      var leafMat = new THREE.MeshStandardMaterial({ color: 0x3E9B3A, roughness: 0.6, side: THREE.DoubleSide });
      for (var i = 0; i < 6; i++) {
        var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), leafMat);
        leaf.position.set(Math.cos(i) * 0.08, 0.28, Math.sin(i) * 0.08); leaf.rotation.set(Math.sin(i) * 1.2, 0, -Math.cos(i) * 1.2);
        grp.add(leaf);
      }
      grp.scale.setScalar(scale || 1);
      return grp;
    };
    K.mint = function (scale) {
      var s = new THREE.Shape();
      s.moveTo(0, 0); s.bezierCurveTo(0.2, 0.08, 0.22, 0.42, 0, 0.62); s.bezierCurveTo(-0.22, 0.42, -0.2, 0.08, 0, 0);
      var geo = new THREE.ShapeGeometry(s, 12);
      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) { var x = pos.getX(i), y = pos.getY(i); pos.setZ(i, x * x * 1.6 - y * 0.12); }
      geo.computeVertexNormals();
      var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x3E9B3A, roughness: 0.45, side: THREE.DoubleSide, emissive: 0x0a2a08 }));
      m.scale.setScalar(scale || 1);
      return m;
    };
    K.mintSprig = function (scale) {
      var g = new THREE.Group();
      for (var i = 0; i < 3; i++) { var l = K.mint(0.75); l.rotation.set(-0.3, i * 2.1, (i - 1) * 0.5); g.add(l); }
      g.scale.setScalar(scale || 1);
      return g;
    };
    K.balls = function (hex, positions, r) {
      var g = new THREE.Group(), mat = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.25, clearcoat: 0.6 });
      var geo = new THREE.SphereGeometry(r, 20, 14);
      positions.forEach(function (p) { var b = new THREE.Mesh(geo, mat); b.position.set(p[0], p[1], p[2]); g.add(b); });
      return g;
    };
    K.grapes = function (hex) { return K.balls(hex || 0x6A2669, [[0, 0, 0], [0.13, 0.02, 0.05], [-0.13, 0.02, 0.04], [0.06, -0.12, 0.02], [-0.07, -0.12, 0.03], [0, -0.24, 0], [0, 0.04, -0.12]], 0.09); };
    K.berries = function (hex) { return K.balls(hex || 0x3B2F86, [[0, 0, 0], [0.13, 0.05, 0.03], [-0.12, 0.04, 0.05], [0.02, 0.12, -0.06]], 0.085); };
    K.wedge = function (outer, mid, inner, depth) {
      var s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.42, Math.PI * 0.18, Math.PI * 0.82, false); s.lineTo(0, 0);
      var geo = new THREE.ExtrudeGeometry(s, { depth: depth || 0.12, bevelEnabled: false, curveSegments: 18 });
      var tex = canvasTex(256, function (g, sz) {
        var c = sz / 2, gr = g.createRadialGradient(c, c, 0, c, c, c);
        gr.addColorStop(0, inner); gr.addColorStop(0.8, inner); gr.addColorStop(0.84, mid); gr.addColorStop(0.9, mid); gr.addColorStop(0.93, outer); gr.addColorStop(1, outer);
        g.fillStyle = gr; g.fillRect(0, 0, sz, sz);
      });
      // planar uv: the wedge apex sits at the texture centre, the arc on the rind
      var pos = geo.attributes.position, uv = geo.attributes.uv;
      for (var i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 0.42 * 0.5 + 0.5, pos.getY(i) / 0.42 * 0.5 + 0.5);
      uv.needsUpdate = true;
      geo.translate(0, -0.2, -(depth || 0.12) / 2);
      return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
    };
    K.watermelon = function () {
      var m = K.wedge('#2E8B3A', '#F4F1E4', '#E8344B', 0.1);
      var seedMat = new THREE.MeshStandardMaterial({ color: 0x141414 });
      for (var i = 0; i < 4; i++) { var sd = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), seedMat); sd.scale.set(1, 1.6, 0.6); sd.position.set(-0.12 + i * 0.08, 0.02 + (i % 2) * 0.05, 0.055); m.add(sd); }
      return m;
    };
    K.pineapple = function () {
      var m = K.wedge('#C98A10', '#F7D547', '#FBE27A', 0.12);
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0x3E9B3A }));
      leaf.position.set(0, 0.32, 0); m.add(leaf);
      return m;
    };
    K.apple = function () { return K.wedge('#C9241D', '#F6EBC8', '#F3E2B0', 0.08); };
    K.coconut = function () {
      var g = new THREE.Group();
      var shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9, side: THREE.DoubleSide }));
      var meat = new THREE.Mesh(new THREE.CircleGeometry(0.28, 28), new THREE.MeshStandardMaterial({ color: 0xF4F1E4, roughness: 0.5 }));
      meat.rotation.x = -Math.PI / 2; meat.position.y = 0.001;
      shell.rotation.x = Math.PI; g.add(shell); g.add(meat);
      return g;
    };
    K.cream = function () {
      var g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xFFF7EA, roughness: 0.55 });
      for (var i = 0; i < 4; i++) { var tr = new THREE.Mesh(new THREE.TorusGeometry(0.34 - i * 0.08, 0.09 - i * 0.012, 12, 32), mat); tr.rotation.x = Math.PI / 2; tr.position.y = i * 0.09; g.add(tr); }
      var cherry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 18, 12), new THREE.MeshPhysicalMaterial({ color: 0xD7192E, roughness: 0.15, clearcoat: 1 }));
      cherry.position.y = 0.42; g.add(cherry);
      return g;
    };
    K.garnish = function (kind, color) {
      switch (kind) {
        case 'orange': return K.slice('orange', 0.36);
        case 'lime': return K.slice('lime', 0.34);
        case 'strawberry': return K.strawberry(0.95);
        case 'mint': return K.mintSprig(0.8);
        case 'coconut': return K.coconut();
        case 'grape': return K.grapes(new THREE.Color(color || '#6A2669'));
        case 'berry': return K.berries(new THREE.Color(color || '#4B3C9C'));
        case 'watermelon': return K.watermelon();
        case 'pineapple': return K.pineapple();
        case 'apple': return K.apple();
        default: return K.cream();
      }
    };

    /* soft additive particles with per-particle alpha and size */
    K.particles = function (count, color, opts) {
      opts = opts || {};
      var geo = new THREE.BufferGeometry();
      var pos = new Float32Array(count * 3), size = new Float32Array(count), alpha = new Float32Array(count);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
      geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
      var mat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uScale: { value: 400 } },
        vertexShader: 'attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;' +
          'void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 uColor; varying float vA;' +
          'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); if (a < 0.01) discard; gl_FragColor = vec4(uColor * (0.9 + 0.6 * (1.0 - d * 2.0)), a * vA); }',
        transparent: true, depthWrite: false, blending: opts.normal ? THREE.NormalBlending : THREE.AdditiveBlending
      });
      var pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      return { points: pts, pos: pos, size: size, alpha: alpha, geo: geo, mat: mat, count: count };
    };

    K.stripeTex = function () {
      return canvasTex(128, function (g, s) {
        g.fillStyle = '#111'; g.fillRect(0, 0, s, s);
        g.fillStyle = '#F2EA18';
        for (var i = -s; i < s * 2; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 16, 0); g.lineTo(i + 16 - s, s); g.lineTo(i - s, s); g.closePath(); g.fill(); }
      });
    };
    return K;
  };
})();
