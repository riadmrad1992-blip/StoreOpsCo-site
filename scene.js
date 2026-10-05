/*
  StoreOpsCo hero scene (three.js r128, classic script).
  Scroll progress p (0..1) scrubs the story; the idle orbit and object drift use a real clock.
  Reuses the logic and camera keyframes of ref-showcase3d.html with instanced meshes.
  Exposes window.StoreOpsScene.start(options). three.js must already be loaded.
*/
(function () {
  'use strict';

  var FLOOR_Y = [0, 1.5, 3.0, 4.5];
  var FLOOR_START = [4.6, 6.0, 7.4, 8.8];
  var COLORS = [0x7CB7FF, 0xE5484D, 0x2FBF71, 0xF27A2E];
  var GROUND = 0x0E141B;

  // scroll progress -> story seconds of the reference film (chaos, snap, order, connect, reveal)
  var SEG = [[0, 0], [0.15, 3], [0.25, 4.5], [0.70, 10], [0.80, 11.5], [1, 15]];
  function pToT(p) {
    for (var i = 1; i < SEG.length; i++) {
      if (p <= SEG[i][0]) {
        var a = SEG[i - 1], b = SEG[i];
        return a[1] + (b[1] - a[1]) * ((p - a[0]) / (b[0] - a[0]));
      }
    }
    return SEG[SEG.length - 1][1];
  }

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var eio = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var eout = function (t) { return 1 - Math.pow(1 - t, 3); };
  var eback = function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  var prog = function (t, a, d) { return clamp((t - a) / d, 0, 1); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  function keys(K, t) {
    if (t <= K[0][0]) return K[0][1];
    for (var i = 1; i < K.length; i++) {
      if (t <= K[i][0]) {
        var a = K[i - 1], b = K[i];
        return a[1] + (b[1] - a[1]) * eio((t - a[0]) / (b[0] - a[0]));
      }
    }
    return K[K.length - 1][1];
  }
  // camera keyframes (distance, height, look-at height) in story seconds
  var R_K = [[0, 10.5], [3.0, 10.5], [4.5, 8.6], [10, 8.6], [11.5, 9.2], [15, 16.5]];
  var Y_K = [[0, 2.9], [3.0, 3.3], [4.5, 2.1], [6.3, 3.5], [7.7, 4.9], [9.1, 6.3], [10.4, 5.2], [11.5, 5.2], [15, 10.2]];
  var L_K = [[0, 2.25], [3.0, 2.25], [4.5, 0.9], [6.3, 2.3], [7.7, 3.7], [9.1, 5.1], [10.4, 3.1], [15, 0.2]];

  function start(opt) {
    var THREE = window.THREE;
    var hero = opt.hero, canvas = opt.canvas;
    var phone = window.matchMedia('(max-width: 700px)').matches || window.matchMedia('(pointer: coarse)').matches;
    var perCount = phone ? 12 : 24;                 // objects per kind (4 kinds): 48 on phones, 96 on desktop
    var dpr = window.devicePixelRatio || 1;
    var pixelRatio = Math.min(dpr, phone ? 1.5 : 2);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !phone, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(pixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(GROUND, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(GROUND, 14, 36);
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
    var C = new THREE.Vector3(0, 2.25, 0);

    scene.add(new THREE.HemisphereLight(0xDFE8F5, GROUND, 0.6));
    var key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(5, 10, 7); scene.add(key);
    var rim = new THREE.DirectionalLight(0x7CB7FF, 0.35); rim.position.set(-6, 4, -6); scene.add(rim);
    var core = new THREE.PointLight(0xF27A2E, 0.6, 18); core.position.copy(C); scene.add(core);

    // soft additive glow on the core (cheap bloom stand-in)
    var glowTex = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,170,110,1)'); gr.addColorStop(.25, 'rgba(242,122,46,.55)'); gr.addColorStop(1, 'rgba(242,122,46,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0.25 }));
    glow.position.copy(C); scene.add(glow);

    // background dust
    (function () {
      var n = phone ? 200 : 380, pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        var r = 16 + Math.random() * 14, a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(b) * Math.cos(a); pos[i * 3 + 1] = r * Math.cos(b) + 2; pos[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xF3F1EC, size: 0.07, transparent: true, opacity: 0.35, fog: false })));
    })();

    // reveal ring of signal particles
    var ring = (function () {
      var n = phone ? 300 : 520, pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, r = 4.6 + Math.random() * 2.4;
        pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 2.25 + (Math.random() - .5) * 0.9 * (1 + (r - 4.6) * .3); pos[i * 3 + 2] = Math.sin(a) * r;
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xF27A2E, size: 0.075, transparent: true, opacity: 0 }));
      scene.add(p); return p;
    })();

    // platforms (3 draw calls each)
    var slabGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.18, 6);
    var edgeGeo = new THREE.EdgesGeometry(slabGeo);
    var slabMat = new THREE.MeshStandardMaterial({ color: 0x111923, metalness: 0.25, roughness: 0.6 });
    var glowGeo = new THREE.CylinderGeometry(2.18, 2.18, 0.03, 6);
    var platforms = FLOOR_Y.map(function (y, k) {
      var g = new THREE.Group(); g.position.set(0, y, 0);
      var slab = new THREE.Mesh(slabGeo, slabMat);
      var edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: COLORS[k], transparent: true, opacity: 0.9 }));
      var under = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: COLORS[k], transparent: true, opacity: 0.35 }));
      under.position.y = -0.1;
      g.add(slab, edges, under); g.scale.setScalar(0.001); scene.add(g);
      return { g: g, under: under };
    });

    // beam
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.2, 16), new THREE.MeshBasicMaterial({ color: 0xF27A2E, transparent: true, opacity: 0.85 }));
    beam.position.copy(C); beam.scale.y = 0.001; scene.add(beam);
    var beamGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5.2, 16), new THREE.MeshBasicMaterial({ color: 0xF27A2E, transparent: true, opacity: 0.12 }));
    beamGlow.position.copy(C); beamGlow.scale.y = 0.001; scene.add(beamGlow);

    // instanced objects: one InstancedMesh per kind (plus bubble tails and parcel tape)
    var n = perCount;
    var KINDS = ['msg', 'box', 'coin', 'ai'];
    var geo = {
      msg: new THREE.BoxGeometry(0.5, 0.34, 0.05),
      box: new THREE.BoxGeometry(0.42, 0.3, 0.42),
      coin: new THREE.CylinderGeometry(0.2, 0.2, 0.07, 24),
      ai: new THREE.IcosahedronGeometry(0.17, 0),
      tail: new THREE.ConeGeometry(0.06, 0.12, 3),
      tape: new THREE.BoxGeometry(0.43, 0.31, 0.08)
    };
    var mat = {
      msg: new THREE.MeshStandardMaterial({ color: 0xF3F1EC, roughness: 0.5, emissive: 0x223044, emissiveIntensity: 0.25 }),
      box: new THREE.MeshStandardMaterial({ color: 0xC89B6D, roughness: 0.85 }),
      coin: new THREE.MeshStandardMaterial({ color: 0xF2B33D, metalness: 0.75, roughness: 0.28 }),
      ai: new THREE.MeshStandardMaterial({ color: 0xF27A2E, emissive: 0xF27A2E, emissiveIntensity: 0.8, roughness: 0.3 }),
      tape: new THREE.MeshStandardMaterial({ color: 0xE8D2B4, roughness: 0.7 })
    };
    function inst(g, m) {
      var im = new THREE.InstancedMesh(g, m, n);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.frustumCulled = false; scene.add(im); return im;
    }
    var meshes = { msg: inst(geo.msg, mat.msg), box: inst(geo.box, mat.box), coin: inst(geo.coin, mat.coin), ai: inst(geo.ai, mat.ai), tail: inst(geo.tail, mat.msg), tape: inst(geo.tape, mat.tape) };

    var tailLocal = new THREE.Matrix4().compose(new THREE.Vector3(-0.16, -0.2, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI)), new THREE.Vector3(1, 1, 1));
    var cols = Math.ceil(Math.sqrt(n)), sp = Math.min(0.7, 2.4 / cols);
    var items = [];
    for (var k = 0; k < 4; k++) {
      for (var j = 0; j < n; j++) {
        var kind = KINDS[k];
        var dir = new THREE.Vector3(rnd(-1, 1), rnd(-.8, .8), rnd(-1, 1)).normalize();
        var base = C.clone().add(dir.multiplyScalar(rnd(2.6, 6.2)));
        var target = new THREE.Vector3(), tq = new THREE.Quaternion();
        var fy = FLOOR_Y[k] + 0.09, gx = j % cols, gz = Math.floor(j / cols);
        var off = (cols - 1) * sp / 2;
        if (kind === 'msg') { target.set(-off + gx * sp, fy + 0.03, -off + gz * sp); tq.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, rnd(-.25, .25))); }
        if (kind === 'box') { target.set(-off + gx * sp, fy + 0.15, -off + gz * sp); tq.setFromEuler(new THREE.Euler(0, rnd(-.12, .12), 0)); }
        if (kind === 'coin') {
          var s = j % 4, lv = Math.floor(j / 4), sx = [-.55, .55, -.55, .55][s], sz = [-.55, -.55, .55, .55][s];
          target.set(sx + rnd(-.02, .02), fy + 0.035 + lv * 0.075, sz + rnd(-.02, .02)); tq.setFromEuler(new THREE.Euler(0, rnd(0, 3), 0));
        }
        items.push({
          k: k, j: j, kind: kind, base: base, target: target, tq: tq,
          sp: new THREE.Vector3(rnd(-1.6, 1.6), rnd(-1.6, 1.6), rnd(-1.6, 1.6)),
          ph: rnd(0, 6.28), f: rnd(.5, 1.1), a0: j / n * Math.PI * 2, idx: j
        });
      }
    }

    // reusable temporaries
    var tmpQ = new THREE.Quaternion(), chaosQ = new THREE.Quaternion(), eul = new THREE.Euler();
    var chaosP = new THREE.Vector3(), pos = new THREE.Vector3(), look = new THREE.Vector3(), sc = new THREE.Vector3(), mtx = new THREE.Matrix4(), mtx2 = new THREE.Matrix4(), dv = new THREE.Vector3();
    var distMul = 1, aspect = 1;
    var mouseX = 0, mouseY = 0, camX = 0, camY = 0;
    var countFrac = 1;

    function frame(p, clock) {
      var T = pToT(p);
      // camera: constant orbit + keyframes + small desktop parallax
      var ang = 0.5 + clock * 0.26;
      var r = keys(R_K, T) * distMul * (1 - 0.2 * eio(prog(T, 11.5, 3.5)));
      var lookY = keys(L_K, T);
      if (aspect > 1.2) lookY -= 0.9 * eio(prog(T, 11.5, 3.5)) * Math.min(1, (aspect - 1.2)); // lift the tower above the wordmark
      else if (aspect > 0) lookY -= 0.4 * eio(prog(T, 11.5, 3.5));
      camera.position.set(Math.cos(ang) * r + camX, keys(Y_K, T) + camY, Math.sin(ang) * r);
      look.set(0, lookY, 0); camera.lookAt(look);

      for (var k = 0; k < 4; k++) {
        var s = eback(prog(T, FLOOR_START[k] - 0.4, 0.55));
        platforms[k].g.scale.setScalar(Math.max(0.001, s));
        platforms[k].under.material.opacity = 0.35 + 0.45 * Math.exp(-Math.pow((T - FLOOR_START[k] - 0.6) * 1.6, 2)) + (T > 10.1 ? 0.25 : 0);
      }

      var b = eout(prog(T, 10, 0.7));
      beam.scale.y = beamGlow.scale.y = Math.max(0.001, b);
      var snap = T > 3 && T < 4.5 ? Math.sin((T - 3) / 1.5 * Math.PI) : 0;
      core.intensity = 0.6 + 1.6 * b + 1.2 * snap;
      glow.material.opacity = 0.18 + 0.5 * b + 0.45 * snap;
      glow.scale.setScalar(2.2 + 3.2 * b + 3.0 * snap);

      ring.material.opacity = 0.9 * eout(prog(T, 11.2, 1.4));
      ring.rotation.y = clock * 0.18;

      var contract = 1 - 0.35 * eio(prog(T, 3.0, 1.4));
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it.idx >= Math.ceil(n * countFrac)) continue;
        dv.subVectors(it.base, C).multiplyScalar(contract);
        chaosP.set(
          C.x + dv.x + Math.sin(clock * it.f + it.ph) * 0.45,
          C.y + dv.y + Math.cos(clock * it.f * 1.2 + it.ph) * 0.45,
          C.z + dv.z + Math.sin(clock * it.f * 0.8 + it.ph * 1.7) * 0.45);
        eul.set(it.sp.x * clock * 0.5 + it.ph, it.sp.y * clock * 0.5, it.sp.z * clock * 0.5); chaosQ.setFromEuler(eul);

        var st = FLOOR_START[it.k] + it.j * (0.7 / n);
        var pp = eio(prog(T, st, 0.95));
        if (it.kind === 'ai') {
          var a = it.a0 + Math.max(0, T - st) * 0.9 + clock * 0.3 * pp;
          var tr = 1.35 + (it.j % 2) * 0.35;
          it.target.set(Math.cos(a) * tr, FLOOR_Y[3] + 0.75 + Math.sin(clock * 2 + it.j) * 0.15, Math.sin(a) * tr);
          eul.set(clock * 1.2 + it.j, clock * 0.8, 0); it.tq.setFromEuler(eul);
        }
        pos.lerpVectors(chaosP, it.target, pp);
        tmpQ.copy(chaosQ).slerp(it.tq, pp);
        sc.setScalar(it.kind === 'ai' ? 1 + 0.25 * Math.sin(clock * 4 + it.j) : 1);
        mtx.compose(pos, tmpQ, sc);
        meshes[it.kind].setMatrixAt(it.idx, mtx);
        if (it.kind === 'msg') { mtx2.multiplyMatrices(mtx, tailLocal); meshes.tail.setMatrixAt(it.idx, mtx2); }
        if (it.kind === 'box') { meshes.tape.setMatrixAt(it.idx, mtx); }
      }
      var live = Math.ceil(n * countFrac);
      for (var name in meshes) { meshes[name].count = live; meshes[name].instanceMatrix.needsUpdate = true; }
      renderer.render(scene, camera);
    }

    function resize() {
      var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix();
      distMul = aspect < 0.8 ? 1.5 : aspect < 1.2 ? 1.18 : 1;
    }

    // ---- quality steps (never step back up) ----
    var level = 0, noAdapt = /[?&]noadapt\b/.test(location.search);  // test switch: keep full quality
    var steps = [
      function () { pixelRatio = Math.min(pixelRatio, 1.25); renderer.setPixelRatio(pixelRatio); resize(); },
      function () { pixelRatio = 1; renderer.setPixelRatio(pixelRatio); resize(); },
      function () { countFrac = 0.6; },
      function () { countFrac = 0.35; pixelRatio = 0.75; renderer.setPixelRatio(pixelRatio); resize(); }
    ];
    var stats = { frames: 0, avgMs: 0, level: 0, pixelRatio: pixelRatio, countFrac: 1, drawCalls: 0, running: false, p: 0, renders: 0 };
    window.__sceneStats = stats;

    // ---- loop: runs only while the hero is on screen and the tab is visible ----
    var visible = true, lost = false, running = false, last = 0, clock = 0, smoothP = -1;
    var winSum = 0, winN = 0, winStart = 0;
    function scrollP() {
      var rect = hero.getBoundingClientRect();
      var span = Math.max(1, hero.offsetHeight - window.innerHeight);
      return clamp(-rect.top / span, 0, 1);
    }
    function loop(now) {
      if (!running) return;
      var dt = last ? Math.min((now - last) / 1000, 0.25) : 0.016;
      var raw = last ? now - last : 0;
      last = now; clock += dt;
      var tp = scrollP();
      smoothP = smoothP < 0 ? tp : smoothP + (tp - smoothP) * (1 - Math.exp(-dt * 9));
      mouseX += (opt.mouse.x - mouseX) * (1 - Math.exp(-dt * 4));
      mouseY += (opt.mouse.y - mouseY) * (1 - Math.exp(-dt * 4));
      camX = mouseX * 0.21; camY = -mouseY * 0.21;     // at most 0.3 units in total
      var t0 = performance.now();
      frame(smoothP, clock);
      stats.jsMs = (stats.jsMs || 0) * 0.95 + (performance.now() - t0) * 0.05;   // CPU time spent per frame (JS + GL submit)
      if (opt.onProgress) opt.onProgress(smoothP);

      stats.renders++; stats.p = smoothP; stats.drawCalls = renderer.info.render.calls;
      if (raw > 0 && raw < 250) {                       // ignore tab-switch gaps
        winSum += raw; winN++;
        if (!winStart) winStart = now;
        if (now - winStart >= 2000) {
          var avg = winSum / winN; stats.avgMs = avg; stats.frames += winN;
          if (avg > 28 && level < steps.length && !noAdapt) {
            steps[level++](); stats.level = level; stats.pixelRatio = pixelRatio; stats.countFrac = countFrac;
          }
          winSum = 0; winN = 0; winStart = now;
        }
      }
      requestAnimationFrame(loop);
    }
    function sync() {
      var want = visible && !document.hidden && !lost;
      if (want && !running) { running = true; last = 0; winSum = winN = winStart = 0; requestAnimationFrame(loop); }
      else if (!want && running) { running = false; }
      stats.running = running;
    }

    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
    document.addEventListener('visibilitychange', sync);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; sync(); if (opt.onFail) opt.onFail(); }, false);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    resize();
    sync();
    return { renderer: renderer };
  }

  window.StoreOpsScene = { start: start };
})();
