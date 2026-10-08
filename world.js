/*
  StoreOpsCo section scenes (three.js r128, classic script).
  One fixed, transparent canvas behind the page. Every section has an empty
  <div class="stage" data-stage="..."> placeholder; each 3D scene is pinned to its
  stage's position on screen and plays as that stage scrolls through the viewport.
  Exposes window.StoreOpsWorld.start(options). three.js must already be loaded.
*/
(function () {
  'use strict';

  var C = { ground: 0x0E141B, surface: 0x151D27, raised: 0x1B2531, line: 0x26313D, ink: 0xF3F1EC, muted: 0x8C97A3,
    signal: 0xF27A2E, ledger: 0x2FBF71, loss: 0xFF6B70, blue: 0x7CB7FF, red: 0xE5484D, kraft: 0xC89B6D, tape: 0xE8D2B4, coin: 0xF2B33D };
  var ENGINE = [C.blue, C.red, C.ledger, C.signal];
  var FH = '"Plus Jakarta Sans", Inter, "Segoe UI", Arial, sans-serif';
  var FB = 'Inter, "Segoe UI", Arial, sans-serif';

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var prog = function (t, a, d) { return clamp((t - a) / d, 0, 1); };
  var eio = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var eout = function (t) { return 1 - Math.pow(1 - t, 3); };
  var eback = function (t) { if (t <= 0) return 0; var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  var hex = function (n) { return '#' + ('000000' + n.toString(16)).slice(-6); };
  // fixed pseudo-random numbers, so every visit looks the same
  var seed = 7;
  var rnd = function (a, b) { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };

  function start(opt) {
    var THREE = window.THREE;
    var canvas = opt.canvas;
    var phone = window.matchMedia('(max-width: 700px)').matches || window.matchMedia('(pointer: coarse)').matches;
    var dpr = window.devicePixelRatio || 1;
    var pixelRatio = Math.min(dpr, phone ? 1.25 : 1.75);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !phone, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(pixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var FOV = 35, CAM_Z = 14;
    var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    camera.position.set(0, 0, CAM_Z); camera.lookAt(0, 0, 0);
    var halfH = Math.tan(FOV / 2 * Math.PI / 180) * CAM_Z, halfW = halfH;

    scene.add(new THREE.HemisphereLight(0xDFE8F5, C.ground, 0.65));
    var key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(5, 8, 9); scene.add(key);
    var rim = new THREE.DirectionalLight(C.blue, 0.4); rim.position.set(-7, 3, -6); scene.add(rim);

    var maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;

    /* ---------- helpers ---------- */
    function canvasTex(w, h, draw) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d'); draw(g, w, h);
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(4, maxAniso);
      return t;
    }
    function rr(g, x, y, w, h, r) {
      g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
      g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
    }
    function pill(g, x, y, text, bg, fg, size) {
      g.font = '700 ' + size + 'px ' + FB;
      var w = g.measureText(text).width + size * 1.4, h = size * 1.9;
      g.fillStyle = bg; rr(g, x, y, w, h, h / 2); g.fill();
      g.fillStyle = fg; g.textBaseline = 'middle'; g.fillText(text, x + size * 0.7, y + h / 2 + 1);
      return w;
    }
    function glowSprite(color, opacity) {
      var t = canvasTex(128, 128, function (g) {
        var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, 'rgba(255,190,140,1)'); gr.addColorStop(.3, 'rgba(242,122,46,.5)'); gr.addColorStop(1, 'rgba(242,122,46,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      });
      return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: opacity, color: color || 0xffffff }));
    }
    var std = function (color, o) {
      var p = { color: color, roughness: 0.55, metalness: 0.1 };
      for (var k in o) p[k] = o[k];
      return new THREE.MeshStandardMaterial(p);
    };
    var M = {
      paper: std(C.ink, { roughness: 0.5, emissive: 0x223044, emissiveIntensity: 0.25 }),
      kraft: std(C.kraft, { roughness: 0.85 }),
      tape: std(C.tape, { roughness: 0.7 }),
      coin: std(C.coin, { metalness: 0.75, roughness: 0.28 }),
      slab: std(0x111923, { metalness: 0.25, roughness: 0.6 }),
      signal: std(C.signal, { emissive: C.signal, emissiveIntensity: 0.8, roughness: 0.3 }),
      dark: std(0x111923, { metalness: 0.3, roughness: 0.5 }),
      line: std(C.line, { metalness: 0.4, roughness: 0.5 })
    };
    var G = {
      msg: new THREE.BoxGeometry(0.62, 0.42, 0.06),
      tail: new THREE.ConeGeometry(0.07, 0.15, 3),
      box: new THREE.BoxGeometry(0.5, 0.36, 0.5),
      tapeBand: new THREE.BoxGeometry(0.51, 0.37, 0.1),
      coin: new THREE.CylinderGeometry(0.22, 0.22, 0.075, 28),
      crystal: new THREE.IcosahedronGeometry(0.17, 0)
    };
    var mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), eul = new THREE.Euler();
    function setInst(im, i, x, y, z, rx, ry, rz, s) {
      eul.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(eul); v.set(x, y, z);
      mtx.compose(v, q, s === undefined ? one : new THREE.Vector3(s, s, s)); im.setMatrixAt(i, mtx);
    }
    function messageCard() {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(G.msg, M.paper));
      var t = new THREE.Mesh(G.tail, M.paper); t.position.set(-0.18, -0.25, 0); t.rotation.z = Math.PI; g.add(t);
      return g;
    }
    function parcel() {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(G.box, M.kraft), new THREE.Mesh(G.tapeBand, M.tape));
      return g;
    }

    /* ---------- scene 1: the day (problem) ---------- */
    function sceneDay() {
      var g = new THREE.Group();
      var face = new THREE.Group(); g.add(face);
      face.add(new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), std(C.surface, { roughness: 0.8 })));
      face.add(new THREE.Mesh(new THREE.TorusGeometry(1.53, 0.04, 8, 96), M.line));
      var N = 60, segs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
      var col = new THREE.Color();
      for (var i = 0; i < N; i++) {
        var a = Math.PI / 2 - (i + 0.5) / N * Math.PI * 2;
        setInst(segs, i, Math.cos(a) * 1.78, Math.sin(a) * 1.78, 0, 0, 0, a + Math.PI / 2);
        segs.setColorAt(i, col.setHex(ENGINE[Math.floor(i / (N / 4))]));
      }
      face.add(segs);
      for (var h = 0; h < 12; h++) {
        var b = h / 12 * Math.PI * 2, d = new THREE.Mesh(new THREE.CircleGeometry(h % 3 ? 0.03 : 0.055, 12), new THREE.MeshBasicMaterial({ color: C.muted }));
        d.position.set(Math.cos(b) * 1.3, Math.sin(b) * 1.3, 0.01); face.add(d);
      }
      var minG = new THREE.BoxGeometry(0.05, 1.2, 0.04); minG.translate(0, 0.52, 0.06);
      var hrG = new THREE.BoxGeometry(0.09, 0.78, 0.04); hrG.translate(0, 0.33, 0.05);
      var minute = new THREE.Mesh(minG, M.paper), hour = new THREE.Mesh(hrG, M.paper);
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 24), M.signal); cap.rotation.x = Math.PI / 2; cap.position.z = 0.09;
      face.add(minute, hour, cap);

      // what eats the day, one per quarter
      var tagTex = canvasTex(256, 160, function (c, w, hh) {
        c.fillStyle = '#F3F1EC'; rr(c, 4, 4, w - 8, hh - 8, 22); c.fill();
        c.fillStyle = '#F27A2E'; c.font = '800 92px ' + FH; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$?', w / 2, hh / 2 + 4);
      });
      var tag = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.41), new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.6, side: THREE.DoubleSide }));
      var coins = new THREE.Group();
      for (var c = 0; c < 3; c++) { var cm = new THREE.Mesh(G.coin, M.coin); cm.position.y = c * 0.08 - 0.08; cm.rotation.y = c; coins.add(cm); }
      coins.rotation.x = 0.5;
      var icons = [messageCard(), parcel(), coins, tag].map(function (o, k) {
        var holder = new THREE.Group(), a = Math.PI / 2 - (k + 0.5) * Math.PI / 2;
        holder.position.set(Math.cos(a) * 2.3, Math.sin(a) * 1.95, 0.5);
        holder.add(o); g.add(holder); holder.scale.setScalar(0.001);
        return holder;
      });

      return {
        g: g,
        update: function (u, clock) {
          var fill = eio(clamp(u * 1.08, 0, 1));
          segs.count = Math.round(N * fill);
          minute.rotation.z = -fill * Math.PI * 8 - clock * 0.05;
          hour.rotation.z = -fill * Math.PI * 2 * (8 / 12) - clock * 0.004;
          for (var k = 0; k < 4; k++) {
            var s = eback(prog(fill, k * 0.25 + 0.02, 0.16));
            icons[k].scale.setScalar(Math.max(0.001, s));
            icons[k].children[0].rotation.y = Math.sin(clock * 0.7 + k) * 0.6;
            icons[k].position.z = 0.5 + Math.sin(clock * 1.1 + k * 1.7) * 0.12;
          }
          g.rotation.x = -0.12; g.rotation.y = Math.sin(clock * 0.25) * 0.18;
        }
      };
    }

    /* ---------- scene 2: the tower (system) ---------- */
    function sceneTower() {
      var g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
      var FY = [-1.15, -0.38, 0.39, 1.16];
      var slabGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.12, 6), edgeGeo = new THREE.EdgesGeometry(slabGeo);
      var underGeo = new THREE.CylinderGeometry(1.26, 1.26, 0.03, 6);
      var floors = FY.map(function (y, k) {
        var f = new THREE.Group(); f.position.y = y;
        f.add(new THREE.Mesh(slabGeo, M.slab));
        f.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: ENGINE[k] })));
        var under = new THREE.Mesh(underGeo, new THREE.MeshBasicMaterial({ color: ENGINE[k], transparent: true, opacity: 0.4 }));
        under.position.y = -0.07; f.add(under);
        f.scale.setScalar(0.001); spin.add(f);
        return { g: f, under: under };
      });
      // what sits on each floor
      var msgs = new THREE.InstancedMesh(G.msg, M.paper, 4);
      var boxes = new THREE.InstancedMesh(G.box, M.kraft, 4), tapes = new THREE.InstancedMesh(G.tapeBand, M.tape, 4);
      var coins = new THREE.InstancedMesh(G.coin, M.coin, 12);
      var gems = new THREE.InstancedMesh(G.crystal, M.signal, 4);
      [[-0.32, -0.25], [0.32, -0.25], [-0.32, 0.3], [0.32, 0.3]].forEach(function (p, i) {
        setInst(msgs, i, p[0], 0.1, p[1], -Math.PI / 2, 0, rnd(-.3, .3), 0.85);
        setInst(boxes, i, p[0], 0.2, p[1], 0, rnd(-.2, .2), 0, 0.75);
        setInst(tapes, i, p[0], 0.2, p[1], 0, 0, 0, 0.75);
        for (var c = 0; c < 3; c++) setInst(coins, i * 3 + c, p[0] * 1.1, 0.1 + c * 0.075, p[1] * 1.1, 0, rnd(0, 3), 0);
      });
      floors[0].g.add(msgs); floors[1].g.add(boxes, tapes); floors[2].g.add(coins); floors[3].g.add(gems);
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 12), new THREE.MeshBasicMaterial({ color: C.signal, transparent: true, opacity: 0.9 }));
      var beamGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.0, 12), new THREE.MeshBasicMaterial({ color: C.signal, transparent: true, opacity: 0.12, depthWrite: false }));
      beam.scale.y = beamGlow.scale.y = 0.001; spin.add(beam, beamGlow);
      var glow = glowSprite(0xffffff, 0); glow.scale.setScalar(2.4); spin.add(glow);
      return {
        g: g,
        update: function (u, clock) {
          for (var k = 0; k < 4; k++) {
            floors[k].g.scale.setScalar(Math.max(0.001, eback(prog(u, 0.06 + k * 0.15, 0.14))));
            floors[k].under.material.opacity = 0.35 + 0.4 * Math.exp(-Math.pow((u - 0.13 - k * 0.15) * 9, 2)) + (u > 0.72 ? 0.2 : 0);
          }
          for (var i = 0; i < 4; i++) {
            var a = clock * 0.9 + i * Math.PI / 2;
            setInst(gems, i, Math.cos(a) * 0.55, 0.35 + Math.sin(clock * 2 + i) * 0.08, Math.sin(a) * 0.55, clock * 1.2 + i, clock, 0);
          }
          gems.instanceMatrix.needsUpdate = true;
          var b = eout(prog(u, 0.68, 0.16));
          beam.scale.y = beamGlow.scale.y = Math.max(0.001, b);
          glow.material.opacity = 0.55 * b;
          spin.rotation.y = clock * 0.32 + u * 1.2;
          g.rotation.x = 0.38; g.rotation.z = Math.sin(clock * 0.3) * 0.03;
        }
      };
    }

    /* ---------- scene 3: Notion pages fanning out (products) ---------- */
    function pageTexture(color, title, price, kind) {
      return canvasTex(512, 680, function (c, w, h) {
        c.save(); rr(c, 0, 0, w, h, 34); c.clip();
        c.fillStyle = '#F7F5F0'; c.fillRect(0, 0, w, h);
        c.fillStyle = hex(color); c.fillRect(0, 0, w, 92);
        c.fillStyle = '#FFFFFF'; rr(c, 36, 62, 64, 64, 14); c.fill();
        c.fillStyle = hex(color); rr(c, 48, 74, 40, 40, 9); c.fill();
        c.fillStyle = '#16202B'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
        var size = title.length > 18 ? 34 : 42;
        c.font = '800 ' + size + 'px ' + FH;
        var words = title.split(' '), line = '', y = 182, lines = [];
        words.forEach(function (wd) { var t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > w - 72 && line) { lines.push(line); line = wd; } else line = t; });
        lines.push(line);
        lines.forEach(function (l, i) { c.fillText(l, 36, y + i * (size + 6)); });
        y += lines.length * (size + 6) + 6;
        if (price) pill(c, 36, y - 4, price, '#16202B', '#F7F5F0', 22); else pill(c, 36, y - 4, 'In the bundles', '#E7E3DA', '#4A5562', 20);
        y += 70;
        c.fillStyle = '#E2DED5'; c.fillRect(36, y - 18, w - 72, 2);
        var rows = function (labels, pills) {
          labels.forEach(function (lb, i) {
            var yy = y + i * 64;
            c.fillStyle = '#C9CDD3'; rr(c, 36, yy, 150, 16, 8); c.fill();
            c.fillStyle = '#DADDE1'; rr(c, 36, yy + 26, 100, 12, 6); c.fill();
            if (pills[i]) pill(c, w - 40 - (c.font = '700 20px ' + FB, c.measureText(pills[i][0]).width + 28), yy - 2, pills[i][0], pills[i][1], pills[i][2], 20);
          });
        };
        if (kind === 'pilot') rows([1, 2, 3, 4], [['Healthy', '#D8F3E4', '#17824B'], ['Below target', '#FFE8D6', '#B4531A'], ['Losing money', '#FFE0E1', '#C2323A'], ['Healthy', '#D8F3E4', '#17824B']]);
        if (kind === 'refund') rows([1, 2, 3, 4], [['Open', '#FFE0E1', '#C2323A'], ['Resolved', '#D8F3E4', '#17824B'], ['Resolved', '#D8F3E4', '#17824B'], ['Open', '#FFE0E1', '#C2323A']]);
        if (kind === 'bank') {
          pill(c, 36, y - 4, 'Formal', '#16202B', '#F7F5F0', 20); pill(c, 150, y - 4, 'Friendly', '#E7E3DA', '#4A5562', 20);
          [[36, 300], [96, 260], [36, 330], [96, 220]].forEach(function (b, i) {
            var yy = y + 62 + i * 62; c.fillStyle = i % 2 ? '#DCEBFF' : '#ECEAE4'; rr(c, b[0], yy, b[1], 44, 16); c.fill();
          });
        }
        if (kind === 'bundle') {
          ['Replies', 'Refunds', 'Profit', 'AI'].forEach(function (lb, i) {
            var x = 36 + (i % 2) * 226, yy = y + Math.floor(i / 2) * 128;
            c.fillStyle = '#ECEAE4'; rr(c, x, yy, 206, 110, 18); c.fill();
            c.fillStyle = hex(ENGINE[[0, 1, 2, 3][i]]); rr(c, x + 18, yy + 18, 34, 34, 8); c.fill();
            c.fillStyle = '#16202B'; c.font = '700 24px ' + FB; c.textBaseline = 'alphabetic'; c.fillText(lb, x + 18, yy + 88);
          });
        }
        c.restore();
      });
    }
    function scenePages() {
      var g = new THREE.Group();
      var defs = [[C.ledger, 'Profit Pilot', '$17', 'pilot'], [C.blue, 'Customer Response Bank', '$12', 'bank'], [C.signal, 'Back Office + AI', '$39', 'bundle'], [C.red, 'Refund & Dispute Manager', '', 'refund']];
      var W = 1.3, H = 1.73;
      var plane = new THREE.PlaneGeometry(W, H);
      var backTex = canvasTex(128, 170, function (c, w, h) { c.fillStyle = '#1B2531'; rr(c, 0, 0, w, h, 9); c.fill(); });
      var backMat = new THREE.MeshStandardMaterial({ map: backTex, transparent: true, roughness: 0.6, alphaTest: 0.5 });
      var FINAL = [[-1.62, 0.14, -0.35, 0.42], [-0.54, -0.1, 0.05, 0.14], [0.54, 0.14, 0.05, -0.14], [1.62, -0.1, -0.35, -0.42]];
      var pages = defs.map(function (d, i) {
        var p = new THREE.Group();
        var front = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ map: pageTexture(d[0], d[1], d[2], d[3]), transparent: true, alphaTest: 0.5, roughness: 0.55 }));
        front.position.z = 0.012;
        var back = new THREE.Mesh(plane, backMat); back.rotation.y = Math.PI; back.position.z = -0.012;
        p.add(front, back); g.add(p);
        return p;
      });
      return {
        g: g,
        update: function (u, clock) {
          for (var i = 0; i < 4; i++) {
            var f = FINAL[i], s = eio(prog(u, 0.05 + i * 0.07, 0.42));
            var p = pages[i];
            p.position.set(f[0] * s + (1 - s) * (i * 0.06 - 0.09), f[1] * s - (1 - s) * i * 0.05 + Math.sin(clock * 0.9 + i * 1.3) * 0.05, f[2] * s - (1 - s) * i * 0.12);
            p.rotation.set(-0.05 + (1 - s) * 0.25, f[3] * s + (1 - s) * 0.3, (1 - s) * (i - 1.5) * 0.06);
          }
          g.rotation.y = Math.sin(clock * 0.2) * 0.08;
        }
      };
    }

    /* ---------- scene 4: the price tag flip (calculator) ---------- */
    function tagShape(c, w, h) {
      var nx = 120;
      c.beginPath(); c.moveTo(nx, 8); c.lineTo(w - 30, 8); c.quadraticCurveTo(w - 8, 8, w - 8, 30);
      c.lineTo(w - 8, h - 30); c.quadraticCurveTo(w - 8, h - 8, w - 30, h - 8); c.lineTo(nx, h - 8); c.lineTo(10, h / 2); c.closePath();
    }
    function scenePriceTag() {
      var g = new THREE.Group();
      var TW = 800, TH = 440;
      var hole = function (c) { c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(92, TH / 2, 26, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over'; };
      var front = canvasTex(TW, TH, function (c, w, h) {
        tagShape(c, w, h); c.fillStyle = '#F3F1EC'; c.fill(); hole(c);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillStyle = '#16202B'; c.font = '800 168px ' + FH; c.fillText('$10.00', 168, 228);
        c.fillStyle = '#E5484D'; c.font = '800 64px ' + FH; c.fillText('−$2.29', 172, 330);
        c.fillStyle = '#6B7682'; c.font = '600 40px ' + FB; c.fillText('per sale', 430, 326);
      });
      var back = canvasTex(TW, TH, function (c, w, h) {
        c.save(); c.translate(w, 0); c.scale(-1, 1); tagShape(c, w, h); c.restore();
        c.fillStyle = '#151D27'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#F27A2E'; c.stroke();
        c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(w - 92, h / 2, 26, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillStyle = '#F27A2E'; c.font = '800 168px ' + FH; c.fillText('$19.53', 56, 228);
        c.fillStyle = '#2FBF71'; c.font = '800 64px ' + FH; c.fillText('+$5.86', 60, 330);
        c.fillStyle = '#8C97A3'; c.font = '600 40px ' + FB; c.fillText('per sale', 318, 326);
      });
      var pw = 2.7, ph = pw * TH / TW;
      var geo = new THREE.PlaneGeometry(pw, ph);
      var flip = new THREE.Group();
      var f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: front, transparent: true, alphaTest: 0.5, roughness: 0.6 }));
      var b = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: back, transparent: true, alphaTest: 0.5, roughness: 0.45, emissive: 0x111111 }));
      f.position.z = 0.01; b.rotation.y = Math.PI; b.position.z = -0.01;
      flip.add(f, b);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 24), M.coin);
      ring.position.set(-pw / 2 + pw * 92 / TW, 0, 0); flip.add(ring);
      flip.position.set(-0.35, 0.45, 0); g.add(flip);
      var glow = glowSprite(0xffffff, 0); glow.position.set(-0.35, 0.45, -0.4); glow.scale.set(4, 2.6, 1); g.add(glow);
      var NC = 14, coins = new THREE.InstancedMesh(G.coin, M.coin, NC);
      for (var i = 0; i < NC; i++) setInst(coins, i, (i % 2) * 0.03 - 0.015 + 1.2, -1.2 + i * 0.08, 0.35, 0, i * 0.7, 0);
      g.add(coins);
      return {
        g: g,
        update: function (u, clock) {
          var fl = eio(prog(u, 0.28, 0.3));
          flip.rotation.y = fl * Math.PI + Math.sin(clock * 0.8) * 0.12;
          flip.rotation.z = Math.sin(clock * 0.9) * 0.04;
          flip.position.y = 0.45 + Math.sin(clock * 1.1) * 0.05;
          glow.material.opacity = 0.35 * fl;
          coins.count = Math.round(NC * eout(prog(u, 0.45, 0.35)));
        }
      };
    }

    /* ---------- scene 5: the video screen (watch) ---------- */
    function sceneScreen() {
      var g = new THREE.Group();
      var SW = 3.0, SH = 1.72;
      var body = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.14, SH + 0.14, 0.12), M.dark);
      var faceTex = canvasTex(768, 440, function (c, w, h) {
        var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1B2531'); gr.addColorStop(1, '#0E141B');
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.strokeStyle = 'rgba(243,241,236,.05)'; c.lineWidth = 1;
        for (var x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
        for (var y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
        c.font = '800 34px ' + FH; c.textBaseline = 'alphabetic';
        c.fillStyle = '#F3F1EC'; c.fillText('StoreOps', 30, 56); var mw = c.measureText('StoreOps').width;
        c.fillStyle = '#F27A2E'; c.fillText('Co', 30 + mw, 56);
        c.fillStyle = 'rgba(243,241,236,.18)'; rr(c, 30, h - 46, w - 60, 8, 4); c.fill();
      });
      var face = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: faceTex }));
      face.position.z = 0.065;
      var fillGeo = new THREE.PlaneGeometry(SW * (708 / 768), 0.034); fillGeo.translate(SW * (708 / 768) / 2, 0, 0);
      var bar = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: C.signal }));
      bar.position.set(-SW / 2 + SW * 30 / 768, -SH / 2 + SH * 42 / 440, 0.07);
      var playGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.16, 3); playGeo.rotateX(Math.PI / 2); playGeo.rotateZ(Math.PI / 2);
      var play = new THREE.Mesh(playGeo, M.signal); play.position.set(0.06, 0.05, 0.2);
      var glow = glowSprite(0xffffff, 0.35); glow.position.set(0, 0.05, 0.12); glow.scale.setScalar(1.6);
      var screen = new THREE.Group(); screen.add(body, face, bar, play, glow); g.add(screen);
      var stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.4), M.dark); stand.position.set(0, -SH / 2 - 0.2, 0);
      var neck = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.08), M.dark); neck.position.set(0, -SH / 2 - 0.08, -0.02);
      g.add(stand, neck);
      var shortTex = canvasTex(220, 390, function (c, w, h) {
        c.save(); rr(c, 0, 0, w, h, 22); c.clip();
        c.fillStyle = '#151D27'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#F27A2E'; c.fillRect(0, 0, w, 10);
        c.fillStyle = 'rgba(243,241,236,.9)'; c.font = '800 22px ' + FH; c.fillText('SHORT', 18, 50);
        c.fillStyle = '#F27A2E'; c.beginPath(); c.moveTo(w / 2 - 18, h / 2 - 26); c.lineTo(w / 2 + 26, h / 2); c.lineTo(w / 2 - 18, h / 2 + 26); c.closePath(); c.fill();
        c.fillStyle = 'rgba(243,241,236,.25)'; rr(c, 18, h - 70, w - 36, 12, 6); c.fill(); rr(c, 18, h - 46, w - 80, 12, 6); c.fill();
        c.restore();
      });
      var shortGeo = new THREE.PlaneGeometry(0.6, 1.06);
      var shortMat = new THREE.MeshStandardMaterial({ map: shortTex, transparent: true, alphaTest: 0.5, roughness: 0.5, side: THREE.DoubleSide });
      var shorts = [0, 1, 2].map(function () { var m = new THREE.Mesh(shortGeo, shortMat); m.scale.setScalar(0.001); g.add(m); return m; });
      return {
        g: g,
        update: function (u, clock) {
          bar.scale.x = Math.max(0.001, eio(prog(u, 0.1, 0.6)));
          var pulse = 1 + 0.06 * Math.sin(clock * 3);
          play.scale.setScalar(pulse * Math.max(0.001, eback(prog(u, 0.02, 0.2))));
          for (var i = 0; i < 3; i++) {
            var a = clock * 0.45 + i * Math.PI * 2 / 3;
            var s = eback(prog(u, 0.25 + i * 0.1, 0.2));
            shorts[i].position.set(Math.cos(a) * 2.15, -0.1 + Math.sin(clock * 0.9 + i) * 0.12, Math.sin(a) * 0.95);
            shorts[i].rotation.y = -Math.cos(a) * 0.5;
            shorts[i].scale.setScalar(Math.max(0.001, s));
          }
          screen.rotation.y = Math.sin(clock * 0.3) * 0.12;
          g.rotation.x = -0.05;
        }
      };
    }

    /* ---------- scene 6: envelopes into the inbox (join) ---------- */
    function sceneMail() {
      var g = new THREE.Group();
      var envTex = canvasTex(320, 212, function (c, w, h) {
        c.fillStyle = '#F3F1EC'; rr(c, 2, 2, w - 4, h - 4, 14); c.fill();
        c.strokeStyle = '#C9C4B8'; c.lineWidth = 5; c.beginPath(); c.moveTo(10, 14); c.lineTo(w / 2, h * 0.58); c.lineTo(w - 10, 14); c.stroke();
        c.fillStyle = '#F27A2E'; c.beginPath(); c.arc(w / 2, h * 0.58, 20, 0, Math.PI * 2); c.fill();
      });
      var NE = 9;
      var env = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.0, 0.66), new THREE.MeshStandardMaterial({ map: envTex, transparent: true, alphaTest: 0.5, roughness: 0.55, side: THREE.DoubleSide }), NE);
      env.frustumCulled = false; g.add(env);
      var tray = new THREE.Group(); tray.position.set(0, -1.05, 0); tray.scale.setScalar(1.25); g.add(tray);
      var base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 1.3), M.dark); tray.add(base);
      var wallMat = std(C.raised, { roughness: 0.6 });
      var back = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 0.06), wallMat); back.position.set(0, 0.25, -0.62);
      var l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 1.3), wallMat); l.position.set(-1.02, 0.16, 0);
      var r = l.clone(); r.position.x = 1.02;
      var front = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.06), wallMat); front.position.set(0, 0.11, 0.62);
      tray.add(back, l, r, front);
      var edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.14, 0.08, 1.34)), new THREE.LineBasicMaterial({ color: C.signal }));
      edge.position.y = 0.0; tray.add(edge);
      var paths = [];
      for (var i = 0; i < NE; i++) {
        paths.push({
          s: new THREE.Vector3(rnd(2.4, 3.4), rnd(1.4, 2.4), rnd(-1.6, 0.4)),
          c: new THREE.Vector3(rnd(0.3, 1.4), rnd(2.0, 2.8), rnd(0.2, 1.0)),
          e: new THREE.Vector3(rnd(-0.2, 0.2), -0.97 + i * 0.035, rnd(-0.15, 0.15)),
          spin: rnd(2, 5), ez: rnd(-0.25, 0.25)
        });
      }
      var p = new THREE.Vector3();
      return {
        g: g,
        update: function (u, clock) {
          for (var i = 0; i < NE; i++) {
            var P = paths[i], t = eio(prog(u, 0.04 + i * 0.065, 0.24));
            if (t <= 0) { setInst(env, i, 0, -5, 0, 0, 0, 0, 0.0001); continue; }
            var a = 1 - t;
            p.set(a * a * P.s.x + 2 * a * t * P.c.x + t * t * P.e.x, a * a * P.s.y + 2 * a * t * P.c.y + t * t * P.e.y, a * a * P.s.z + 2 * a * t * P.c.z + t * t * P.e.z);
            var flut = (1 - t) * P.spin;
            setInst(env, i, p.x, p.y, p.z, -Math.PI / 2 * t + Math.sin(clock * 3 + i) * 0.4 * (1 - t), flut + P.ez * t, Math.sin(clock * 2 + i) * 0.3 * (1 - t), 1);
          }
          env.instanceMatrix.needsUpdate = true;
          g.rotation.x = 0.3; g.rotation.y = -0.35 + Math.sin(clock * 0.25) * 0.1; g.position.x -= 0.35 * g.scale.x;
        }
      };
    }

    /* ---------- scene 7: one system (about) ---------- */
    function sceneCore() {
      var g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
      var slab = new THREE.CylinderGeometry(1.3, 1.3, 0.14, 6);
      var plat = new THREE.Mesh(slab, M.slab); plat.position.y = -0.9; spin.add(plat);
      var e = new THREE.LineSegments(new THREE.EdgesGeometry(slab), new THREE.LineBasicMaterial({ color: C.signal })); e.position.y = -0.9; spin.add(e);
      var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), M.signal); core.position.y = 0.35; spin.add(core);
      var glow = glowSprite(0xffffff, 0.6); glow.position.y = 0.35; glow.scale.setScalar(2.6); g.add(glow);
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 10), new THREE.MeshBasicMaterial({ color: C.signal })); beam.position.y = -0.27; spin.add(beam);
      var gems = new THREE.InstancedMesh(G.crystal, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333, roughness: 0.3 }), 4);
      var col = new THREE.Color(); for (var i = 0; i < 4; i++) gems.setColorAt(i, col.setHex(ENGINE[i]));
      spin.add(gems);
      var n = phone ? 220 : 380, pos = new Float32Array(n * 3);
      for (var j = 0; j < n; j++) { var a = rnd(0, Math.PI * 2), r = rnd(1.7, 2.3); pos[j * 3] = Math.cos(a) * r; pos[j * 3 + 1] = 0.35 + rnd(-0.18, 0.18); pos[j * 3 + 2] = Math.sin(a) * r; }
      var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var ring = new THREE.Points(pg, new THREE.PointsMaterial({ color: C.signal, size: 0.045, transparent: true, opacity: 0, depthWrite: false }));
      g.add(ring);
      return {
        g: g,
        update: function (u, clock) {
          var s = eback(prog(u, 0.05, 0.3));
          core.scale.setScalar(Math.max(0.001, s) * (1 + 0.05 * Math.sin(clock * 2.5)));
          core.rotation.set(clock * 0.4, clock * 0.6, 0);
          beam.scale.y = Math.max(0.001, eout(prog(u, 0.2, 0.25)));
          for (var i = 0; i < 4; i++) {
            var a = clock * 0.8 + i * Math.PI / 2, rr2 = 1.0 * eout(prog(u, 0.25 + i * 0.06, 0.2));
            setInst(gems, i, Math.cos(a) * rr2, 0.35 + Math.sin(clock * 1.5 + i) * 0.15, Math.sin(a) * rr2, clock + i, clock * 0.7, 0, Math.max(0.001, rr2));
          }
          gems.instanceMatrix.needsUpdate = true;
          ring.material.opacity = 0.85 * eout(prog(u, 0.35, 0.3));
          ring.rotation.y = clock * 0.18;
          spin.rotation.y = clock * 0.3;
          g.rotation.x = 0.28;
        }
      };
    }

    var BUILD = { day: sceneDay, tower: sceneTower, pages: scenePages, tag: scenePriceTag, screen: sceneScreen, mail: sceneMail, core: sceneCore };
    var scenes = [];
    opt.stages.forEach(function (el) {
      var make = BUILD[el.getAttribute('data-stage')];
      if (!make) return;
      var s = make(); s.el = el; s.u = -1; s.g.visible = false; scene.add(s.g); scenes.push(s);
    });

    /* ---------- placement: each scene sits on its stage ---------- */
    var vw = 1, vh = 1, aspect = 1;
    function resize() {
      vw = window.innerWidth; vh = window.innerHeight;
      renderer.setSize(vw, vh, false);
      aspect = vw / vh; camera.aspect = aspect; camera.updateProjectionMatrix();
      halfW = halfH * aspect;
    }
    var mouseX = 0, mouseY = 0;
    var stats = { avgMs: 0, level: 0, pixelRatio: pixelRatio, running: false, renders: 0, drawCalls: 0, active: [] };
    window.__worldStats = stats;

    function frame(dt, clock) {
      mouseX += (opt.mouse.x - mouseX) * (1 - Math.exp(-dt * 4));
      mouseY += (opt.mouse.y - mouseY) * (1 - Math.exp(-dt * 4));
      stats.active.length = 0;
      for (var i = 0; i < scenes.length; i++) {
        var s = scenes[i], r = s.el.getBoundingClientRect();
        if (r.height < 2 || r.bottom < -vh * 0.15 || r.top > vh * 1.15) { s.g.visible = false; continue; }
        s.g.visible = true; stats.active.push(s.el.getAttribute('data-stage'));
        var cx = (r.left + r.width / 2) / vw * 2 - 1, cy = 1 - (r.top + r.height / 2) / vh * 2;
        s.g.position.set(cx * halfW, cy * halfH, 0);
        var sc = Math.min((r.width / vw) * 2 * halfW / 4.2, (r.height / vh) * 2 * halfH / 3.7);
        s.g.scale.setScalar(sc);
        var t = clamp((vh - r.top) / (vh + r.height), 0, 1);
        var target = clamp((t - 0.1) / 0.5, 0, 1);
        s.u = s.u < 0 ? target : s.u + (target - s.u) * (1 - Math.exp(-dt * 6));
        s.update(s.u, clock);
        // small mouse parallax on top of each scene's own motion
        s.g.rotation.y += mouseX * 0.12; s.g.rotation.x += mouseY * 0.08;
      }
      renderer.render(scene, camera);
    }

    /* ---------- quality steps (never step back up) ---------- */
    var level = 0, noAdapt = /[?&]noadapt\b/.test(location.search);
    var steps = [
      function () { pixelRatio = Math.min(pixelRatio, 1.25); renderer.setPixelRatio(pixelRatio); resize(); },
      function () { pixelRatio = 1; renderer.setPixelRatio(pixelRatio); resize(); },
      function () { pixelRatio = 0.75; renderer.setPixelRatio(pixelRatio); resize(); }
    ];

    /* ---------- loop: only while a stage is near the screen and the tab is visible ---------- */
    var near = 0, lost = false, running = false, last = 0, clock = 0, winSum = 0, winN = 0, winStart = 0;
    function loop(now) {
      if (!running) return;
      var raw = last ? now - last : 0, dt = last ? Math.min(raw / 1000, 0.25) : 0.016;
      last = now; clock += dt;
      frame(dt, clock);
      stats.renders++; stats.drawCalls = renderer.info.render.calls;
      if (raw > 0 && raw < 250) {
        winSum += raw; winN++;
        if (!winStart) winStart = now;
        if (now - winStart >= 2000) {
          var avg = winSum / winN; stats.avgMs = avg;
          if (avg > 28 && level < steps.length && !noAdapt) { steps[level++](); stats.level = level; stats.pixelRatio = pixelRatio; }
          winSum = 0; winN = 0; winStart = now;
        }
      }
      requestAnimationFrame(loop);
    }
    function sync() {
      var want = near > 0 && !document.hidden && !lost;
      if (want && !running) { running = true; last = 0; winSum = winN = winStart = 0; requestAnimationFrame(loop); }
      else if (!want && running) { running = false; renderer.clear(); }   // never leave a stale frame on the fixed canvas
      stats.running = running;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.__near = e.isIntersecting; });
      near = scenes.filter(function (s) { return s.el.__near; }).length;
      sync();
    }, { rootMargin: '15% 0px 15% 0px', threshold: 0 });
    scenes.forEach(function (s) { io.observe(s.el); });
    document.addEventListener('visibilitychange', sync);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; sync(); if (opt.onFail) opt.onFail(); }, false);
    window.addEventListener('resize', resize);
    resize();
    return { renderer: renderer };
  }

  window.StoreOpsWorld = { start: start };
})();
