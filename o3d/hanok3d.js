/* Yoolmi Office · ㅁ자 한옥 3D 엔진. window.Hanok3D.create(host, opts) */
(function () {
'use strict';
function create(host, opts) {
  var T = window.THREE; opts = opts || {};
  if (!T || !host) return null;
  var R, canvas = document.createElement('canvas');
  try { R = new T.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: !!opts.capture, powerPreference: 'high-performance' }); } catch (e) { return null; }
  var es = !!opts.es, light = !!opts.light, fp = !!opts.fp, disposed = false;
  // ---------- DOM ----------
  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;border-radius:inherit;background:#cfe8f4;font-family:inherit';
  canvas.style.cssText = 'display:block;width:100%;height:100%;outline:none;touch-action:none;cursor:grab';
  canvas.tabIndex = 0; canvas.setAttribute('role', 'application');
  wrap.appendChild(canvas); host.appendChild(wrap);
  function el(tag, css, parent) { var e = document.createElement(tag); e.style.cssText = css; (parent || wrap).appendChild(e); return e; }
  var CHIP = 'background:rgba(255,251,243,.95);border:1.4px solid #8A766B;border-radius:999px;color:#3F3129;font-size:13px;font-weight:500;';
  var zoneEl = el('div', 'position:absolute;left:12px;top:12px;padding:6px 14px;pointer-events:none;' + CHIP);
  var promptEl = el('button', 'position:absolute;left:50%;bottom:16px;transform:translateX(-50%);min-height:44px;padding:0 20px;cursor:pointer;display:none;font-family:inherit;background:#3F3129;color:#fff;border:0;border-radius:999px;font-size:14px;font-weight:500;box-shadow:0 6px 18px rgba(63,49,41,.25)');
  promptEl.type = 'button';
  var btns = el('div', 'position:absolute;right:12px;bottom:12px;display:flex;gap:6px');
  function mkBtn(label) { var b = el('button', 'min-height:40px;padding:0 14px;cursor:pointer;font-family:inherit;' + CHIP, btns); b.type = 'button'; b.textContent = label; return b; }
  var bView = mkBtn(''), bLight = mkBtn('');
  var hintEl = el('div', 'position:absolute;left:50%;top:14px;transform:translateX(-50%);padding:7px 16px;pointer-events:none;transition:opacity .8s;white-space:nowrap;' + CHIP);
  var mini = el('canvas', 'position:absolute;left:12px;bottom:12px;width:150px;height:123px;border-radius:12px;border:1.4px solid #8A766B;background:#F7F1E6;pointer-events:none');
  mini.width = 300; mini.height = 246; var mctx = mini.getContext('2d');

  // ---------- renderer / scene ----------
  R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.LinearToneMapping;
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.shadowMap.autoUpdate = false;
  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(46, 1, 0.08, 900);
  var ocam = new T.OrthographicCamera(-16, 16, 13, -13, 1, 120);
  var W = 0, H = 0, prCap = 1.5, qLevel = 0, qAcc = 0, qN = 0, compact = false;
  function resize() {
    var w = wrap.clientWidth || 800, h = wrap.clientHeight || 520; if (w === W && h === H) return; W = w; H = h;
    R.setPixelRatio(light ? 1 : Math.min(window.devicePixelRatio || 1, prCap)); R.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    compact = w < 430; [zoneEl, btns, mini, hintEl].forEach(function (x) { x.style.visibility = compact ? 'hidden' : ''; }); promptEl.style.visibility = compact ? 'hidden' : '';
    var vh = 26.5, vw = vh * w / h; if (vw < 32) { vw = 32; vh = vw * h / w; }
    ocam.left = -vw / 2; ocam.right = vw / 2; ocam.top = vh / 2; ocam.bottom = -vh / 2; ocam.updateProjectionMatrix();
  }

  // ---------- helpers ----------
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function shade(hex, k) { var c = new T.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); }
  function tex(w, h, draw, rx, ry) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; if (rx) t.repeat.set(rx, ry || rx); t.anisotropy = 4; return t; }
  function M(color, o) { return new T.MeshStandardMaterial(Object.assign({ color: color, roughness: .85, metalness: 0 }, o || {})); }
  function add(m, parent, noShadow) { if (!noShadow) { m.castShadow = true; m.receiveShadow = true; } (parent || scene).add(m); return m; }
  function box(w, h, d, mat, x, y, z, parent, ns) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return add(m, parent, ns); }
  function cyl(rt, rb, h, mat, x, y, z, parent, seg, ns) { var m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 16), mat); m.position.set(x, y, z); return add(m, parent, ns); }
  function sph(r, mat, x, y, z, parent, sx, sy, sz, ns) { var m = new T.Mesh(new T.SphereGeometry(r, 20, 14), mat); m.position.set(x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); return add(m, parent, ns); }
  function grp(x, y, z, parent, ry) { var G = new T.Group(); G.position.set(x, y, z); if (ry) G.rotation.y = ry; (parent || scene).add(G); return G; }

  // ---------- textures ----------
  function noise(c, w, h, n, a) { for (var i = 0; i < n; i++) { c.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,255,255' : '60,40,20') + ',' + (Math.random() * a) + ')'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
  var tSand = tex(512, 512, function (c, w, h) { var r = rnd(8); c.fillStyle = '#DCC8A6'; c.fillRect(0, 0, w, h); for (var i = 0; i < 70; i++) { var x = r() * w, y = r() * h, rad = 30 + r() * 90, g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(' + (r() < .5 ? '120,95,60' : '255,246,225') + ',' + (.10 * r()) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); } noise(c, w, h, 22000, .2); for (i = 0; i < 260; i++) { c.fillStyle = 'rgba(' + (r() < .5 ? '110,95,80' : '240,230,210') + ',.5)'; c.beginPath(); c.ellipse(r() * w, r() * h, 1 + r() * 2.2, 1 + r() * 1.6, r() * 3, 0, 7); c.fill(); } }, 5, 4);
  var tGrass = tex(256, 256, function (c, w, h) { c.fillStyle = '#8DB978'; c.fillRect(0, 0, w, h); for (var i = 0; i < 2200; i++) { c.strokeStyle = Math.random() < .5 ? '#7BAA66' : '#A3CC8C'; c.beginPath(); var px = Math.random() * w, py = Math.random() * h; c.moveTo(px, py); c.lineTo(px + 2, py - 6); c.stroke(); } }, 50, 50);
  function woodTex(base, seed, ph) { return tex(512, 512, function (c, w, h) { var r = rnd(seed); ph = ph || 64; for (var yy = 0; yy < h; yy += ph) { var xx = -r() * 200; while (xx < w) { var L = 170 + r() * 200; c.fillStyle = shade(base, (r() - .5) * .07); c.fillRect(xx, yy, L, ph); c.strokeStyle = shade(base, -.17); c.lineWidth = 2; c.strokeRect(xx + 1, yy + 1, L - 2, ph - 2); for (var i = 0; i < 4; i++) { c.strokeStyle = 'rgba(90,55,25,.10)'; c.beginPath(); var gy = yy + 6 + r() * (ph - 12); c.moveTo(xx + 4, gy); c.bezierCurveTo(xx + L * .3, gy + 4, xx + L * .6, gy - 4, xx + L - 4, gy + 2); c.stroke(); } xx += L; } } }); }
  var tTile = tex(128, 128, function (c, w, h) { for (var i = 0; i < 4; i++) { var g = c.createLinearGradient(i * 32, 0, i * 32 + 32, 0); g.addColorStop(0, '#2E333B'); g.addColorStop(.18, '#4A515B'); g.addColorStop(.5, '#6B737E'); g.addColorStop(.82, '#4A515B'); g.addColorStop(1, '#2E333B'); c.fillStyle = g; c.fillRect(i * 32, 0, 32, h); } var rr = rnd(3); for (var ty = 0; ty < 4; ty++) for (var tx2 = 0; tx2 < 4; tx2++) { c.fillStyle = 'rgba(' + (rr() < .5 ? '0,0,0' : '170,180,195') + ',' + (rr() * .13) + ')'; c.fillRect(tx2 * 32, ty * 32, 32, 32); } c.fillStyle = 'rgba(15,17,22,.4)'; for (var y = 0; y < h; y += 32) { c.fillRect(0, y, w, 3); c.fillStyle = 'rgba(200,210,225,.10)'; c.fillRect(0, y + 3, w, 2); c.fillStyle = 'rgba(15,17,22,.4)'; } noise(c, w, h, 1800, .1); });
  var tRafter = tex(128, 64, function (c, w, h) { c.fillStyle = '#E9DCC4'; c.fillRect(0, 0, w, h); for (var i = 0; i < 4; i++) { var g = c.createLinearGradient(i * 32 + 6, 0, i * 32 + 26, 0); g.addColorStop(0, '#6E4628'); g.addColorStop(.5, '#A5733F'); g.addColorStop(1, '#6E4628'); c.fillStyle = g; c.fillRect(i * 32 + 6, 0, 20, h); } });
  var tHanji = tex(256, 512, function (c, w, h) { c.fillStyle = '#F6EDD8'; c.fillRect(0, 0, w, h); noise(c, w, h, 2600, .06); var i, k; c.fillStyle = '#5E3A24'; for (i = 1; i < 12; i++) c.fillRect(Math.round(i * w / 12) - 2, 14, 4, h - 28); [[.10, 4], [.47, 5], [.86, 4]].forEach(function (g) { for (k = 0; k < g[1]; k++) c.fillRect(14, Math.round(h * g[0] + k * 13), w - 28, 4); }); c.strokeStyle = '#4E2E1C'; c.lineWidth = 22; c.strokeRect(11, 11, w - 22, h - 22); c.strokeStyle = 'rgba(255,230,190,.18)'; c.lineWidth = 2; c.strokeRect(22, 22, w - 44, h - 44); });
  var tStone = tex(256, 256, function (c, w, h) { c.fillStyle = '#B9B2A6'; c.fillRect(0, 0, w, h); noise(c, w, h, 4000, .14); }, 2, 2);
  var tWall = tex(256, 128, function (c, w, h) { c.fillStyle = '#E8DCC4'; c.fillRect(0, 0, w, h); var r = rnd(9); for (var row = 0; row < 3; row++) { var x = -r() * 30; while (x < w) { var L = 34 + r() * 30; c.fillStyle = shade('#A89C8C', (r() - .5) * .12); c.beginPath(); if (c.roundRect) c.roundRect(x + 3, h - 14 - row * 26 - 20, L - 6, 20, 8); else c.rect(x + 3, h - 34 - row * 26, L - 6, 20); c.fill(); x += L; } } noise(c, w, h, 1500, .08); });
  function grain(base, seed, rot) { var t = tex(512, 512, function (c, w, h) { var r = rnd(seed), i, x; c.fillStyle = base; c.fillRect(0, 0, w, h);
      for (i = 0; i < 520; i++) { var y = r() * h, a = .03 + r() * .08; c.strokeStyle = r() < .55 ? 'rgba(55,28,10,' + a + ')' : 'rgba(255,232,196,' + (a * .8) + ')'; c.lineWidth = .5 + r() * 1.8; c.beginPath(); var ph = r() * 6, amp = 1 + r() * 4; c.moveTo(0, y); for (x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x / 90 + ph) * amp); c.stroke(); }
      for (i = 0; i < 4; i++) { var kx = r() * w, ky = r() * h, g = c.createRadialGradient(kx, ky, 1, kx, ky, 16); g.addColorStop(0, 'rgba(45,22,8,.5)'); g.addColorStop(1, 'rgba(45,22,8,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(kx, ky, 26, 9, 0, 0, 7); c.fill(); }
      noise(c, w, h, 2500, .06); }); if (rot) { t.center.set(.5, .5); t.rotation = Math.PI / 2; } return t; }
  function woodMat(base, seed, rough, rot) { var t = grain(base, seed, rot); return new T.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: .015, roughness: rough || .6 }); }
  function mottled(base, seed, n, a) { return tex(256, 256, function (c, w, h) { var r = rnd(seed); c.fillStyle = base; c.fillRect(0, 0, w, h); for (var i = 0; i < n; i++) { var x = r() * w, y = r() * h, rad = 10 + r() * 40, g = c.createRadialGradient(x, y, 0, x, y, rad); var dark = r() < .5; g.addColorStop(0, 'rgba(' + (dark ? '70,50,30' : '255,250,240') + ',' + (a * r()) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); } noise(c, w, h, 3000, .07); }); }
  function labelSprite(text, bg, fg) {
    var c = document.createElement('canvas'), cx = c.getContext('2d'), f = '500 34px "Noto Sans KR", system-ui, sans-serif'; cx.font = f;
    var w = Math.ceil(cx.measureText(text).width) + 44; c.width = w; c.height = 60; cx.font = f;
    cx.fillStyle = bg || '#FFFBF3'; cx.strokeStyle = '#8A766B'; cx.lineWidth = 3; var r = 28; cx.beginPath(); cx.moveTo(r, 2); cx.lineTo(w - r, 2); cx.arc(w - r, 30, r, -Math.PI / 2, Math.PI / 2); cx.lineTo(r, 58); cx.arc(r, 30, r, Math.PI / 2, Math.PI * 1.5); cx.fill(); cx.stroke();
    cx.fillStyle = fg || '#3F3129'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(text, w / 2, 32);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; var s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(w / 60 * .26, .26, 1); s.renderOrder = 50; return s;
  }
  function plaque(text, w) {
    var t = tex(512, 160, function (c, cw, ch) { c.fillStyle = '#2F2620'; c.fillRect(0, 0, cw, ch); c.strokeStyle = '#C9A25A'; c.lineWidth = 8; c.strokeRect(10, 10, cw - 20, ch - 20); c.fillStyle = '#F3E3B8'; c.font = '700 84px "Noto Serif KR","Noto Sans KR",serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cw / 2, ch / 2 + 6); });
    t.wrapS = t.wrapT = T.ClampToEdgeWrapping; var G = new T.Group(); box(w + .1, w * .31 + .1, .06, M('#5A3A26'), 0, 0, -.02, G); var p = new T.Mesh(new T.PlaneGeometry(w, w * .31), new T.MeshStandardMaterial({ map: t, roughness: .7 })); p.position.z = .015; G.add(p); return G;
  }

  // ---------- materials ----------
  var mWood = woodMat('#9A6A3E', 11, .62), mWoodD = woodMat('#6B432C', 12, .66), mWoodL = woodMat('#C0905F', 13, .55), mCol = woodMat('#74452B', 14, .58, true);
  var mStone = new T.MeshStandardMaterial({ map: tStone, bumpMap: tStone, bumpScale: .03, roughness: .95 }), tStoneD = mottled('#8E877C', 21, 60, .3), mStoneD = new T.MeshStandardMaterial({ map: tStoneD, bumpMap: tStoneD, bumpScale: .03, roughness: .95 }), tPl = mottled('#F1E9D8', 22, 40, .12), mPlaster = new T.MeshStandardMaterial({ map: tPl, bumpMap: tPl, bumpScale: .006, roughness: 1 });
  var mInk = M('#4A3428', { roughness: .6 }), mCream = M('#FFF7EA', { roughness: .9 });
  var mHanji = new T.MeshStandardMaterial({ map: tHanji, emissiveMap: tHanji, emissive: '#FFD9A0', emissiveIntensity: .05, roughness: .9, side: T.DoubleSide });
  var tMaru = woodTex('#C59463', 4, 64), mMaru = new T.MeshStandardMaterial({ map: tMaru, bumpMap: tMaru, bumpScale: .012, roughness: .45 });
  var glow = [], lampLights = [];

  // ---------- world layout ----------
  var FH = .3, PH = .45, WX = 30, WZ = 24.5;
  var BL = [
    { k: 'hall', x0: 8, x1: 22, z0: 1.5, z1: 6.5, open: 's', ko: '대청', sign: '대청' },
    { k: 'mk', x0: 1.2, x1: 6.8, z0: 1.5, z1: 19.5, open: 'e', sign: '사랑채' },
    { k: 'tc', x0: 23.2, x1: 28.8, z0: 1.5, z1: 19.5, open: 'w', sign: '서당' },
    { k: 'bug', x0: 8.4, x1: 12.6, z0: 20.1, z1: 23.3, open: 'n', sign: '제보함' }
  ];
  var PAV = { x: 15, z: 13, r: 3.3 };
  var ZN = {
    hall: ['대청 · 학생 창구', 'Daecheong · Estudiantes', '학생 창구 열기', 'Abrir estudiantes'],
    mk: ['사랑채 · 마케터 사무실', 'Sarangchae · Marketing', '내 책상 열기', 'Abrir mi escritorio'],
    tc: ['서당 · 선생님 방', 'Seodang · Profes', '선생님 방 열기', 'Abrir sala de profes'],
    bug: ['오류 제보함', 'Buzón de errores', '오류 제보함 열기', 'Abrir buzón'],
    pav: ['정자 · 회의실', 'Pabellón · Reuniones', '회의 열기', 'Abrir reunión'],
    yard: ['마당', 'Patio', '', '']
  };
  var OB = [], occ = [];
  function ob(x0, z0, x1, z1) { OB.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]); }
  function obc(x, z, r) { ob(x - r, z - r, x + r, z + r); }

  // ground
  (function () {
    // floating island: grassy rim, earth slab, rock underside
    var rim = new T.Mesh(new T.PlaneGeometry(WX + 5, WZ + 5), new T.MeshStandardMaterial({ map: tGrass, roughness: 1 })); tGrass.repeat.set(9, 8); rim.rotation.x = -Math.PI / 2; rim.position.set(WX / 2, -.03, WZ / 2); rim.receiveShadow = true; scene.add(rim);
    box(WX + 5, 1.1, WZ + 5, M('#8A6B4E', { roughness: 1 }), WX / 2, -.6, WZ / 2, scene, true);
    var rk = rnd(31), rm = [M('#7A6352', { roughness: 1, flatShading: true }), M('#6A5546', { roughness: 1, flatShading: true }), M('#8C7460', { roughness: 1, flatShading: true })];
    var big = new T.Mesh(new T.ConeGeometry(19.5, 17, 9, 3), rm[0]); big.rotation.x = Math.PI; big.scale.set(1.02, 1, .86); big.position.set(WX / 2, -9.6, WZ / 2); scene.add(big);
    for (var q = 0; q < 9; q++) { var an = q / 9 * Math.PI * 2 + rk() * .4, rr = 8 + rk() * 5, ch = 5 + rk() * 6, c = new T.Mesh(new T.ConeGeometry(2.6 + rk() * 2.6, ch, 6, 1), rm[q % 3]); c.rotation.x = Math.PI; c.rotation.y = rk() * 3; c.position.set(WX / 2 + Math.cos(an) * rr * 1.05, -1.25 - ch / 2, WZ / 2 + Math.sin(an) * rr * .86); scene.add(c); }
    var y = new T.Mesh(new T.PlaneGeometry(WX, WZ), new T.MeshStandardMaterial({ map: tSand, bumpMap: tSand, bumpScale: .02, roughness: 1 })); y.rotation.x = -Math.PI / 2; y.position.set(WX / 2, 0, WZ / 2); y.receiveShadow = true; scene.add(y);
    // stepping stones
    var r = rnd(21), sm = M('#A9A297', { roughness: 1 });
    function stone(x, z) { var s = cyl(.36 + r() * .1, .4 + r() * .1, .06, sm, x + (r() - .5) * .12, .03, z + (r() - .5) * .12, scene, 9); s.rotation.y = r() * 3; s.scale.z = .75 + r() * .2; s.castShadow = false; }
    var z, x, a;
    for (z = 23.4; z > 17.6; z -= .95) stone(15, z);
    for (a = .62; a < Math.PI - .5; a += .22) { stone(15 + Math.sin(a) * 4.6, 13 + Math.cos(a) * 4.6); stone(15 - Math.sin(a) * 4.6, 13 + Math.cos(a) * 4.6); }
    for (z = 8.6; z > 7.2; z -= .9) stone(15, z);
    for (x = 10.2; x > 7.9; x -= .95) stone(x, 13); for (x = 19.8; x < 22.2; x += .95) stone(x, 13);
    for (z = 18.6; z < 19.9; z += .9) stone(10.5, z);
    // grass borders inside the wall
    [[13.2, 21.7, 3.6, 5.6], [0.3, 19.9, 8, 4.4], [16.9, 19.9, 12.8, 4.4]].forEach(function (q, i) { if (i === 0) return; var p = new T.Mesh(new T.PlaneGeometry(q[2], q[3]), new T.MeshStandardMaterial({ color: '#93BF7E', roughness: 1 })); p.rotation.x = -Math.PI / 2; p.position.set(q[0] + q[2] / 2, .012, q[1] + q[3] / 2); p.receiveShadow = true; scene.add(p); });
  })();

  // ---------- roof ----------
  function roofProfile(u, v, RH, lift) { var av = Math.abs(v), au = Math.abs(u); return RH * Math.pow(1 - av, 1.34) + lift * Math.pow(av, 1.5) * au * au * au + .22 * u * u * (1 - av); }
  function roofXZ(u, v, L, Wd) { var av = Math.abs(v), au = Math.abs(u); return [u * L / 2 * (1 + .045 * av * av * au), v * Wd / 2 * (1 + .075 * u * u * u * u)]; }
  function roofGeo(L, Wd, RH, lift) {
    var nu = 22, nv = 14, pos = [], uv = [], idx = [], i, j;
    for (j = 0; j <= nv; j++) for (i = 0; i <= nu; i++) { var u = i / nu * 2 - 1, v = j / nv * 2 - 1; var xz = roofXZ(u, v, L, Wd); pos.push(xz[0], roofProfile(u, v, RH, lift), xz[1]); uv.push(u * L / 2 / .52, Math.abs(v) * Wd / 2 / .9); }
    for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) { var a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function roof(cx, cz, len, wid, alongX, baseY, over) {
    var L = len + over * 2, Wd = wid + over * 2.2, RH = 1.15 + wid * .1, lift = .8, G = grp(cx, baseY, cz, scene, alongX ? 0 : Math.PI / 2);
    var mt = new T.MeshStandardMaterial({ map: tTile, bumpMap: tTile, bumpScale: .06, roughness: .62, metalness: .05, transparent: true }), mu = new T.MeshStandardMaterial({ map: tRafter, roughness: .9, side: T.BackSide, transparent: true });
    var geo = roofGeo(L, Wd, RH, lift), top = new T.Mesh(geo, mt); top.castShadow = true; top.receiveShadow = true; G.add(top);
    var un = new T.Mesh(geo, mu); un.position.y = -.05; G.add(un);
    var pts = []; for (var i = 0; i <= 10; i++) { var u = i / 10 * 2 - 1; pts.push(new T.Vector3(u * L / 2, roofProfile(u, 0, RH, lift) + .06, 0)); }
    var mr = new T.MeshStandardMaterial({ color: '#E7E1D3', roughness: .9, transparent: true }), mrd = new T.MeshStandardMaterial({ color: '#3A4048', roughness: .7, transparent: true });
    var ridge = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, .2, 8), mr); ridge.castShadow = true; G.add(ridge);
    var rtop = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(function (p) { return new T.Vector3(p.x, p.y + .19, p.z); })), 20, .085, 6), mrd); G.add(rtop);
    [-1, 1].forEach(function (su) { [-1, 1].forEach(function (sv) { var cp = [], uu = su * (len / L) * .995; for (var q = 0; q <= 8; q++) { var vv = sv * q / 8, xz = roofXZ(uu + su * .1 * (q / 8) * (q / 8), vv, L, Wd); cp.push(new T.Vector3(xz[0], roofProfile(uu + su * .1 * (q / 8) * (q / 8), vv, RH, lift) + .07, xz[1])); } var dr = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cp), 12, .13, 6), mr); dr.castShadow = true; G.add(dr); }); });
    var mcap = new T.MeshStandardMaterial({ color: '#D9D3C6', roughness: .9, transparent: true });
    [-1, 1].forEach(function (s) { var e = sph(.2, mcap, s * L / 2, roofProfile(s, 0, RH, lift) + .08, 0, G, .6, 1.1, 1.1); });
    // gable ends
    var mg = new T.MeshStandardMaterial({ color: '#F3ECDD', roughness: 1, side: T.DoubleSide, transparent: true });
    [-1, 1].forEach(function (s) { var uw = s * len / L, sh = new T.Shape(), hw = wid / 2 + .1, n = 12; sh.moveTo(-hw, 0); sh.lineTo(hw, 0); for (var k = n; k >= 0; k--) { var v = (k / n * 2 - 1) * (hw / (Wd / 2)); sh.lineTo(v * Wd / 2, roofProfile(uw, v, RH, lift) - .04); } var m = new T.Mesh(new T.ShapeGeometry(sh), mg); m.rotation.y = Math.PI / 2; m.position.x = s * len / 2; m.castShadow = true; G.add(m); box(.1, RH * .55, .12, mWoodD, s * len / 2, RH * .3, 0, G); });
    G.userData.keep = true; return { G: G, mats: [mt, mu, mr, mrd, mcap, mg], op: 1, un: un };
  }

  // ---------- hanok building ----------
  function lantern(parent, x, y, z) {
    cyl(.01, .01, .3, mInk, x, y + .15, z, parent, 5, true);
    var mm = new T.MeshStandardMaterial({ color: '#E05A4E', emissive: '#FF8A5A', emissiveIntensity: .15, roughness: .9 }), mb = new T.MeshStandardMaterial({ color: '#5E86C6', emissive: '#6FA0FF', emissiveIntensity: .1, roughness: .9 });
    cyl(.1, .1, .14, mb, x, y - .07, z, parent, 10, true); cyl(.1, .1, .14, mm, x, y - .21, z, parent, 10, true); cyl(.07, .07, .03, mInk, x, y + .01, z, parent, 10, true); cyl(.07, .07, .03, mInk, x, y - .29, z, parent, 10, true);
    glow.push({ m: mm, d: .15, n: 1.3 }, { m: mb, d: .1, n: .9 });
  }
  var roofs = {};
  function hanok(b) {
    var w = b.x1 - b.x0, d = b.z1 - b.z0, alongX = w >= d, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, CH = 2.0;
    // platform + floor
    box(w + 1, .24, d + 1, mStone, cx, .12, cz); var fl = box(w, .08, d, mMaru, cx, FH - .04, cz); fl.castShadow = false;
    // columns
    var nx = Math.max(1, Math.round(w / 2.9)), nz = Math.max(1, Math.round(d / 2.9)), i, cols = { n: [], s: [], w: [], e: [] };
    for (i = 0; i <= nx; i++) { cols.n.push([b.x0 + w * i / nx, b.z0]); cols.s.push([b.x0 + w * i / nx, b.z1]); }
    for (i = 0; i <= nz; i++) { cols.w.push([b.x0, b.z0 + d * i / nz]); cols.e.push([b.x1, b.z0 + d * i / nz]); }
    var seen = {};
    ['n', 's', 'w', 'e'].forEach(function (s) { cols[s].forEach(function (p) { var k = p[0].toFixed(2) + ',' + p[1].toFixed(2); if (seen[k]) return; seen[k] = 1; cyl(.13, .14, CH, mCol, p[0], FH + CH / 2, p[1], scene, 14); cyl(.2, .24, .1, mStoneD, p[0], FH + .02, p[1], scene, 10); if (s === b.open) obc(p[0], p[1], .16); }); });
    // beams
    box(w + .3, .22, .2, mCol, cx, FH + CH + .05, b.z0); box(w + .3, .22, .2, mCol, cx, FH + CH + .05, b.z1); box(.2, .22, d + .3, mCol, b.x0, FH + CH + .05, cz); box(.2, .22, d + .3, mCol, b.x1, FH + CH + .05, cz);
    // walls on closed sides
    ['n', 's', 'w', 'e'].forEach(function (s) {
      var ps = cols[s], horiz = s === 'n' || s === 's';
      if (s === b.open) { // lanterns + plaque
        ps.forEach(function (p, j) { if (j === 0 || j === ps.length - 1) return; var ox = s === 'e' ? .28 : s === 'w' ? -.28 : 0, oz = s === 's' ? .28 : s === 'n' ? -.28 : 0; lantern(scene, p[0] + ox, FH + CH - .12, p[1] + oz); });
        var pq = plaque(b.sign, 1.5), off = .16; pq.position.set(horiz ? cx : (s === 'e' ? b.x1 + off : b.x0 - off), FH + CH + .28, horiz ? (s === 's' ? b.z1 + off : b.z0 - off) : cz); pq.rotation.y = s === 's' ? 0 : s === 'n' ? Math.PI : s === 'e' ? Math.PI / 2 : -Math.PI / 2; pq.rotation.x = 0; scene.add(pq);
        return;
      }
      for (var j = 0; j < ps.length - 1; j++) {
        var a = ps[j], q = ps[j + 1], L = Math.hypot(q[0] - a[0], q[1] - a[1]), G = grp((a[0] + q[0]) / 2, FH, (a[1] + q[1]) / 2, scene, horiz ? 0 : Math.PI / 2);
        box(L, .16, .18, mCol, 0, .08, 0, G); box(L - .26, .44, .08, mWood, 0, .38, 0, G);
        var hm = mHanji.clone(); hm.map = tHanji.clone(); hm.map.needsUpdate = true; hm.map.repeat.set(Math.max(2, Math.round(L / .78)), 1); hm.emissiveMap = hm.map; glow.push({ m: hm, d: .04, n: .75 });
        var win = box(L - .26, CH - .6, .05, hm, 0, .6 + (CH - .6) / 2, 0, G); occ.push(win);
      }
      var t = .5; if (s === 'n') ob(b.x0 - t, b.z0 - t, b.x1 + t, b.z0 + .12); if (s === 's') ob(b.x0 - t, b.z1 - .12, b.x1 + t, b.z1 + t); if (s === 'w') ob(b.x0 - t, b.z0 - t, b.x0 + .12, b.z1 + t); if (s === 'e') ob(b.x1 - .12, b.z0 - t, b.x1 + t, b.z1 + t);
    });
    // step stone on the open side
    var sl = Math.min(alongX ? w : d, 5) * .5, sm = M('#B5AEA2', { roughness: 1 });
    if (b.open === 's') box(sl, .12, .5, sm, cx, .06, b.z1 + .78); if (b.open === 'n') box(sl, .12, .5, sm, cx, .06, b.z0 - .78);
    if (b.open === 'e') [-.25, .25].forEach(function (f) { box(.5, .12, 2.2, sm, b.x1 + .78, .06, cz + d * f); }); if (b.open === 'w') [-.25, .25].forEach(function (f) { box(.5, .12, 2.2, sm, b.x0 - .78, .06, cz + d * f); });
    roofs[b.k] = roof(cx, cz, alongX ? w : d, alongX ? d : w, alongX, FH + CH + .16, 1.0);
    // interior night light
    if (b.k !== 'bug') { var L2 = new T.PointLight('#FFC98A', 0, alongX ? w * .8 : d * .6, 1.6); L2.position.set(cx, FH + 1.7, cz); scene.add(L2); lampLights.push({ L: L2, n: 1.1 }); }
  }
  BL.forEach(hanok);
  function aoPlane(cx, cz, w, d, pad, round) { var t = tex(128, 128, function (c, W, H) { c.clearRect(0, 0, W, H); for (var i = 0; i < 16; i++) { c.fillStyle = 'rgba(38,24,14,.034)'; var ix = i * (pad / w) * W / 16, iz = i * (pad / d) * H / 16; if (round) { c.beginPath(); c.ellipse(W / 2, H / 2, W / 2 - ix, H / 2 - iz, 0, 0, 7); c.fill(); } else c.fillRect(ix, iz, W - 2 * ix, H - 2 * iz); } }); t.wrapS = t.wrapT = T.ClampToEdgeWrapping; var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(cx, .008, cz); m.userData.keep = true; m.renderOrder = 1; scene.add(m); }
  BL.forEach(function (b) { aoPlane((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, b.x1 - b.x0 + 4.4, b.z1 - b.z0 + 4.4, 2.2); });
  aoPlane(PAV.x, PAV.z, 10.6, 10.6, 2.4, true);

  // ---------- furniture ----------
  function lowDesk(parent, x, z, w, d, ry) { var G = grp(x, FH, z, parent, ry || 0); box(w, .05, d, mWoodL, 0, .36, 0, G); box(w - .1, .06, d - .1, mWood, 0, .31, 0, G); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(.06, .3, .06, mWoodD, s[0] * (w / 2 - .07), .15, s[1] * (d / 2 - .07), G); }); return G; }
  function cushion(x, y, z, col, parent) { var c = cyl(.27, .29, .09, M(col, { roughness: 1 }), x, y + .045, z, parent, 18); return c; }
  function laptop(parent, x, y, z, rot) { var G = grp(x, y, z, parent, rot || 0); box(.3, .015, .21, M('#C3CBD4', { metalness: .4, roughness: .4 }), 0, .008, 0, G, true); var s = box(.3, .2, .012, M('#2E3442'), 0, .105, -.11, G, true); s.rotation.x = -.2; var sm = new T.MeshStandardMaterial({ color: '#8FD0FF', emissive: '#6FB8F0', emissiveIntensity: .7 }); var scr = box(.27, .17, .004, sm, 0, .105, -.102, G, true); scr.rotation.x = -.2; }
  function deskLamp(parent, x, y, z) { cyl(.05, .06, .02, mInk, x, y + .01, z, parent, 10, true); cyl(.01, .01, .2, mInk, x, y + .11, z, parent, 6, true); var sm = new T.MeshStandardMaterial({ color: '#FFF1CC', emissive: '#FFC870', emissiveIntensity: .3, side: T.DoubleSide, roughness: .9 }); var sh = new T.Mesh(new T.CylinderGeometry(.05, .09, .1, 14, 1, true), sm); sh.position.set(x, y + .24, z); parent.add(sh); glow.push({ m: sm, d: .3, n: 1.5 }); }
  function mug(parent, x, y, z, col) { cyl(.04, .035, .08, M(col, { roughness: .4 }), x, y + .04, z, parent, 12, true); }
  function paper(parent, x, y, z, rot) { var m = box(.2, .006, .15, M('#FFFBF2', { roughness: 1 }), x, y + .004, z, parent, true); m.rotation.y = rot || 0; }
  function books(parent, x, y, z, len, alongX, seed) { var r = rnd(seed), cols = ['#E07A5F', '#F6C760', '#7FA8C9', '#9BD3A8', '#C6A6E0', '#E98FA0', '#F2A86F'], u = 0; while (u < len - .05) { var bw = .045 + r() * .04, bh = .17 + r() * .08, m = M(cols[Math.floor(r() * 7)], { roughness: .85 }); if (alongX) box(bw, bh, .14, m, x + u + bw / 2, y + bh / 2, z, parent, true); else box(.14, bh, bw, m, x, y + bh / 2, z + u + bw / 2, parent, true); u += bw + .004; } }
  function shelf(x, z, len, alongX, seed) { var G = grp(x, FH, z, scene, alongX ? 0 : Math.PI / 2); box(len, 1.3, .04, mWoodD, 0, .65, -.17, G); [.03, .45, .87, 1.29].forEach(function (yy, i) { box(len, .04, .36, mWood, 0, yy, 0, G); if (i < 3) books(G, -len / 2 + .06, yy + .02, 0, len - .12, true, seed + i); }); box(.04, 1.3, .36, mWoodD, -len / 2, .65, 0, G); box(.04, 1.3, .36, mWoodD, len / 2, .65, 0, G); if (alongX) ob(x - len / 2, z - .22, x + len / 2, z + .22); else ob(x - .22, z - len / 2, x + .22, z + len / 2); }
  function pot(x, y, z, s) { var G = grp(x, y, z); G.scale.setScalar(s || 1); cyl(.2, .14, .28, M('#EDE6DA', { roughness: .5 }), 0, .14, 0, G, 14); var lm = [M('#6FA866', { roughness: 1 }), M('#8CC47E', { roughness: 1 })]; [[0, .5, 0, .24], [.14, .42, .06, .17], [-.13, .44, .08, .18], [.02, .62, -.1, .16]].forEach(function (p, i) { var l = new T.Mesh(new T.IcosahedronGeometry(p[3], 1), lm[i % 2]); l.position.set(p[0], p[1], p[2]); l.castShadow = true; G.add(l); }); obc(x, z, .18 * (s || 1)); }

  var mMat = new T.MeshStandardMaterial({ map: tex(256, 256, function (c, w, h) { c.fillStyle = '#E9DBB4'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(150,120,70,.22)'; c.lineWidth = 1; for (var y = 0; y < h; y += 3) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.lineWidth = 3; c.strokeStyle = '#B5473C'; c.strokeRect(9, 9, w - 18, h - 18); c.strokeStyle = '#3F6AA8'; c.strokeRect(15, 15, w - 30, h - 30); }), roughness: 1 });
  mMat.map.wrapS = mMat.map.wrapT = T.ClampToEdgeWrapping;
  var mScreen = M('#F6EEDC', { roughness: 1 });
  var seats = {}, seatData = {};
  function drawPlate(p, name) { var c = p.cv.getContext('2d'); c.fillStyle = name ? '#FFF7EA' : '#EFE6D6'; c.fillRect(0, 0, 384, 112); c.strokeStyle = '#7A4E32'; c.lineWidth = 8; c.strokeRect(4, 4, 376, 104); c.fillStyle = name ? '#3F3129' : '#9A8B7D'; c.font = (name ? '700 50px' : '500 40px') + ' "Noto Sans KR",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; var t = name || (es ? 'Libre' : '빈 자리'); if (t.length > 9) t = t.slice(0, 8) + '…'; c.fillText(t, 192, 60); p.tx.needsUpdate = true; }
  function seatPlate(key, i, x, z, ry) { var cv = document.createElement('canvas'); cv.width = 384; cv.height = 112; var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; var G = grp(x, FH, z, scene, ry); cyl(.035, .045, .95, mWoodD, 0, .475, 0, G, 8); cyl(.14, .16, .05, mWoodD, 0, .025, 0, G, 10); box(.76, .26, .04, mWoodD, 0, 1.02, 0, G); var pl = new T.Mesh(new T.PlaneGeometry(.7, .2), new T.MeshStandardMaterial({ map: tx, roughness: .8 })); pl.position.set(0, 1.02, .022); G.add(pl); var pb = pl.clone(); pb.rotation.y = Math.PI; pb.position.z = -.022; G.add(pb); obc(x, z, .1); var p = { cv: cv, tx: tx }; (seats[key] = seats[key] || [])[i] = p; drawPlate(p, (seatData[key] || [])[i]); }
  function setSeats(d) { seatData = d || {}; Object.keys(seats).forEach(function (k) { seats[k].forEach(function (p, i) { drawPlate(p, (seatData[k] || [])[i]); }); }); }
  // 대청: 현황판 + 여섯 단계 탁자
  var boardCv = document.createElement('canvas'); boardCv.width = 1024; boardCv.height = 400; var boardTx = new T.CanvasTexture(boardCv); boardTx.encoding = T.sRGBEncoding;
  var boardData = null;
  var STC = ['#8FB8E8', '#B9A6E0', '#F5C542', '#F2A86F', '#7CC38C', '#C9BFB3'];
  function drawBoard() {
    var c = boardCv.getContext('2d'), d = boardData || {}, st = d.stages || [['문의', '-'], ['상담 예약', '-'], ['상담 완료', '-'], ['결제 대기', '-'], ['수강 중', '-'], ['보류·이탈', '-']];
    c.fillStyle = '#FBF6EC'; c.fillRect(0, 0, 1024, 400); c.fillStyle = '#3F3129'; c.font = '700 40px "Noto Sans KR",sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(d.title || (es ? 'Estudiantes' : '학생 창구 현황'), 40, 52);
    c.font = '500 26px "Noto Sans KR",sans-serif'; c.textAlign = 'right'; c.fillStyle = d.pend ? '#B03A48' : '#6B5D52'; c.fillText((es ? 'Recibidos: ' : '넘겨받은 일 ') + (d.pend == null ? '-' : d.pend) + '   ·   ' + (es ? 'Vencidos: ' : '마감 지남 ') + (d.late == null ? '-' : d.late), 984, 54);
    st.forEach(function (s, i) { var x = 40 + i * 160; c.fillStyle = '#FFFFFF'; c.strokeStyle = '#E6DED3'; c.lineWidth = 3; c.beginPath(); if (c.roundRect) c.roundRect(x, 100, 144, 262, 18); else c.rect(x, 100, 144, 262); c.fill(); c.stroke(); c.fillStyle = STC[i]; c.beginPath(); if (c.roundRect) c.roundRect(x, 100, 144, 16, [18, 18, 0, 0]); else c.rect(x, 100, 144, 16); c.fill(); c.fillStyle = '#3F3129'; c.textAlign = 'center'; c.font = '700 96px "Fredoka","Noto Sans KR",sans-serif'; c.fillText(String(s[1]), x + 72, 222); c.font = '500 25px "Noto Sans KR",sans-serif'; c.fillStyle = '#6B5D52'; c.fillText(s[0], x + 72, 322); });
    boardTx.needsUpdate = true;
  }
  (function () {
    var b = BL[0], cx = 15, z = b.z0 + .2;
    box(6.3, 2.5, .08, mWoodD, cx, FH + 1.35, z - .02); var bm = new T.MeshStandardMaterial({ map: boardTx, emissiveMap: boardTx, emissive: '#ffffff', emissiveIntensity: .12, roughness: .6 }); glow.push({ m: bm, d: .12, n: .42 });
    var p = new T.Mesh(new T.PlaneGeometry(6, 2.34), bm); p.position.set(cx, FH + 1.35, z + .03); scene.add(p); drawBoard();
    // long low table with six stage trays
    var tb = lowDesk(scene, cx, b.z0 + 1.9, 6.4, .9); ob(cx - 3.25, b.z0 + 1.42, cx + 3.25, b.z0 + 2.38);
    STC.forEach(function (c, i) { var x = -2.65 + i * 1.06; box(.62, .1, .44, M(c, { roughness: .8 }), x, .435, 0, tb); box(.5, .012, .34, M('#FFFBF2'), x, .49, 0, tb, true); box(.5, .012, .34, M('#FFFBF2'), x + .02, .5, .01, tb, true).rotation.y = .06; });
    [-2.6, -.9, .9, 2.6].forEach(function (x, i) { cushion(cx + x, FH, b.z0 + 2.95, ['#E9A06E', '#8CB4D0', '#9BC7A2', '#E9A06E'][i]); });
    // 운영자 자리 (동쪽) + 서쪽은 여백: 달항아리
    (function () { var x = b.x1 - 1.9, z = b.z0 + 3.2, d = lowDesk(scene, x, z, 1.7, .85, -Math.PI / 2); laptop(d, 0, .385, 0, 0); mug(d, .55, .385, .2, '#F7B8C4'); deskLamp(d, -.6, .385, -.22); paper(d, .5, .385, -.2, .3); ob(x - .48, z - .9, x + .48, z + .9); cushion(x + .9, FH, z, '#E9A06E'); box(2.6, .02, 3.0, mMat, x + .25, FH + .012, z, scene, true); seatPlate('op', 0, x - 1.25, z - 1.2, Math.PI); })();
    (function () { var x = b.x0 + 1.7, z = b.z0 + 3.2; box(.9, .34, .5, mWoodD, x, FH + .17, z); ob(x - .5, z - .3, x + .5, z + .3); var pts = [[.06, 0], [.2, .06], [.27, .22], [.24, .4], [.13, .5], [.11, .54]].map(function (p) { return new T.Vector2(p[0], p[1]); }); var j = new T.Mesh(new T.LatheGeometry(pts, 24), M('#F6F2EA', { roughness: .35 })); j.position.set(x, FH + .34, z); j.castShadow = true; scene.add(j); })();
    shelf(b.x0 + 1.7, b.z0 + .45, 2.4, true, 3); shelf(b.x1 - 1.7, b.z0 + .45, 2.4, true, 13);
    pot(b.x0 + .6, FH, b.z1 - .6, 1.1); pot(b.x1 - .6, FH, b.z1 - .6, 1.1);
  })();
  // 개인 자리: 돗자리 + 낮은 책상 + 가림막 + 문갑 + 벽 게시판 + 이름표
  function nook(key, i, wallX, dirX, zc, col, withScreen) {
    // dirX: +1 = back wall on the west (faces east), -1 = back wall on the east
    var X = function (d) { return wallX + dirX * d; };
    box(2.9, .02, 3.6, mMat, X(1.75), FH + .012, zc, scene, true);
    var d = lowDesk(scene, X(1.75), zc, 1.6, .8, dirX > 0 ? Math.PI / 2 : -Math.PI / 2); laptop(d, 0, .385, .02, 0); deskLamp(d, .58, .385, -.24); mug(d, -.55, .385, .22, ['#FFFBF3', '#F7B8C4', '#BFE3C8'][i % 3]); paper(d, -.5, .385, -.16, .3);
    ob(X(1.75) - .45, zc - .85, X(1.75) + .45, zc + .85); cushion(X(.85), FH, zc, col);
    // wall pin board
    box(.04, .8, 1.7, M('#C9A06A', { roughness: 1 }), X(.17), FH + 1.25, zc); ['#FFE08A', '#F7B8C4', '#BFE3C8', '#BFD9F2', '#FFFBF2'].forEach(function (c, j) { var n = box(.012, .22, .22, M(c, { roughness: 1 }), X(.2), FH + 1.42 - (j % 2) * .34, zc - .6 + j * .3, scene, true); n.rotation.x = ((j * 37) % 5 - 2) * .05; });
    // low cabinet + small things
    var cz = zc - 1.82; box(1.5, .46, .4, mWood, X(1.0), FH + .23, cz); box(1.56, .04, .44, mWoodL, X(1.0), FH + .48, cz); ob(X(1.0) - .78, cz - .22, X(1.0) + .78, cz + .22);
    books(scene, X(1.0) - .6, FH + .5, cz, .55, true, 60 + i * 7 + (dirX > 0 ? 0 : 30)); var p = cyl(.09, .07, .13, M('#EDE6DA', { roughness: .5 }), X(1.0) + .45, FH + .565, cz, scene, 12, true); var lf = new T.Mesh(new T.IcosahedronGeometry(.13, 1), M('#7DBB72', { roughness: 1 })); lf.position.set(X(1.0) + .45, FH + .74, cz); scene.add(lf);
    // folding screen between nooks
    if (withScreen) { var sz = zc - 2.22; box(2.6, 1.15, .05, mScreen, X(1.45), FH + .62, sz); box(2.66, .06, .08, mWoodD, X(1.45), FH + 1.22, sz); box(2.66, .08, .08, mWoodD, X(1.45), FH + .04, sz); [0, 1.3, 2.6].forEach(function (u) { box(.06, 1.2, .08, mWoodD, X(.15 + u), FH + .6, sz); }); ob(X(.15), sz - .06, X(2.75), sz + .06); }
    seatPlate(key, i, X(2.95), zc - 1.75, dirX > 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  // 사랑채: 마케터 3명 + 남쪽 공용 탁자
  (function () {
    var b = BL[1], cols = ['#E9A06E', '#8CB4D0', '#9BC7A2'];
    for (var i = 0; i < 3; i++) nook('mk', i, b.x0, 1, b.z0 + 2.75 + i * 4.75, cols[i], i > 0);
    var tx = b.x0 + 2.5, tz = b.z1 - 2.7; cyl(.7, .7, .05, mWoodL, tx, FH + .36, tz, scene, 28); cyl(.1, .28, .32, mWood, tx, FH + .17, tz, scene, 12); obc(tx, tz, .55);
    cyl(.08, .06, .09, M('#EDE6DA', { roughness: .4 }), tx, FH + .43, tz, scene, 12, true); [[.3, .1], [-.25, .2]].forEach(function (q) { cyl(.035, .03, .05, M('#BFE3C8', { roughness: .4 }), tx + q[0], FH + .41, tz + q[1], scene, 10, true); });
    [0, 2.1, 4.2].forEach(function (a, j) { cushion(tx + Math.cos(a) * 1.25, FH, tz + Math.sin(a) * 1.25, ['#D9B26F', '#C6A6E0', '#E98FA0'][j]); });
    shelf(b.x0 + 2.2, b.z1 - .45, 2.6, true, 33); pot(b.x1 - .6, FH, b.z0 + .7, 1.1); pot(b.x1 - .6, FH, b.z1 - .7, 1.1);
  })();
  // 서당: 수업 준비 탁자 + 선생님 2명 + 교재 책장
  (function () {
    var b = BL[2], cx = (b.x0 + b.x1) / 2;
    box(3.2, 1.3, .06, mWoodD, cx, FH + 1.25, b.z0 + .2); var bd = box(3, 1.14, .04, M('#3F5A4C', { roughness: .95 }), cx, FH + 1.25, b.z0 + .24); bd.castShadow = false;
    var ht = tex(512, 196, function (c, w, h) { c.fillStyle = '#3F5A4C'; c.fillRect(0, 0, w, h); c.fillStyle = '#F4F1E6'; c.font = '700 74px "Noto Sans KR",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('가 나 다 라', w / 2, h / 2 - 22); c.font = '500 34px "Noto Sans KR",sans-serif'; c.fillStyle = '#FFE08A'; c.fillText('안녕하세요 · Hola', w / 2, h / 2 + 50); }); ht.wrapS = ht.wrapT = T.ClampToEdgeWrapping;
    var hp = new T.Mesh(new T.PlaneGeometry(3, 1.14), new T.MeshStandardMaterial({ map: ht, roughness: .95 })); hp.position.set(cx, FH + 1.25, b.z0 + .265); scene.add(hp);
    var td = lowDesk(scene, cx, b.z0 + 2.3, 2.6, 1.0); books(td, -1.1, .385, -.25, .6, true, 5); paper(td, .1, .385, .1, .2); paper(td, .5, .385, -.15, -.3); mug(td, 1.0, .385, .25, '#F7B8C4'); ob(cx - 1.33, b.z0 + 1.78, cx + 1.33, b.z0 + 2.82);
    [-.8, .8].forEach(function (x, j) { cushion(cx + x, FH, b.z0 + 3.25, ['#E9C98A', '#9BC7A2'][j]); });
    for (var i = 0; i < 2; i++) nook('tc', i, b.x1, -1, b.z0 + 6.9 + i * 4.75, ['#E98FA0', '#8CB4D0'][i], true);
    shelf(b.x1 - .45, b.z1 - 2.6, 3.2, false, 43); shelf(cx + .4, b.z1 - .45, 2.6, true, 53);
    cushion(cx - .5, FH, b.z1 - 2.2, '#D9B26F'); cushion(cx + .7, FH, b.z1 - 1.7, '#C6A6E0'); box(.6, .3, .6, mWoodL, cx - 1.5, FH + .15, b.z1 - 1.5); ob(cx - 1.85, b.z1 - 1.85, cx - 1.15, b.z1 - 1.15); books(scene, cx - 1.7, FH + .3, b.z1 - 1.5, .35, true, 77);
    pot(b.x0 + .6, FH, b.z0 + .7, 1.1); pot(b.x0 + .6, FH, b.z1 - .7, 1.1);
  })();
  // 오류 제보함
  (function () {
    var b = BL[3], cx = (b.x0 + b.x1) / 2;
    var G = grp(b.x0 + 1, FH, b.z1 - .75); box(.62, .9, .5, M('#C9614C', { roughness: .6 }), 0, .45, 0, G); box(.7, .08, .58, M('#A84A3A'), 0, .93, 0, G); box(.36, .035, .02, M('#2A1E18'), 0, .7, -.26, G, true);
    var lt = tex(256, 96, function (c, w, h) { c.fillStyle = '#FFF7EA'; c.fillRect(0, 0, w, h); c.fillStyle = '#3F3129'; c.font = '700 44px "Noto Sans KR",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('오류 제보', w / 2, h / 2 + 2); }); lt.wrapS = lt.wrapT = T.ClampToEdgeWrapping;
    var lp = new T.Mesh(new T.PlaneGeometry(.5, .19), new T.MeshStandardMaterial({ map: lt })); lp.position.set(0, .45, -.256); lp.rotation.y = Math.PI; G.add(lp); ob(b.x0 + .62, b.z1 - 1.05, b.x0 + 1.38, b.z1 - .45);
    box(1.9, 1.0, .05, M('#C9A06A', { roughness: 1 }), cx + .3, FH + 1.2, b.z1 - .2); ['#FFE08A', '#F7B8C4', '#BFE3C8', '#BFD9F2', '#FFE08A', '#FFFBF2'].forEach(function (c, i) { var n = box(.22, .24, .01, M(c, { roughness: 1 }), cx - .35 + (i % 3) * .58 + .1, FH + 1.42 - Math.floor(i / 3) * .42, b.z1 - .235, scene, true); n.rotation.z = ((i * 37) % 5 - 2) * .05; });
    var d = lowDesk(scene, b.x1 - .95, b.z0 + 1.6, 1.3, .7, -Math.PI / 2); laptop(d, 0, .385, 0, 0); mug(d, .45, .385, .2, '#BFD9F2'); ob(b.x1 - 1.35, b.z0 + .9, b.x1 - .55, b.z0 + 2.3); cushion(b.x1 - 1.75, FH, b.z0 + 1.6, '#8CB4D0'); seatPlate('dev', 0, b.x1 - .55, b.z0 + .55, Math.PI);
  })();

  // ---------- pavilion (정자) ----------
  var pavRoof, blinds = [];
  (function () {
    var G = grp(PAV.x, 0, PAV.z), r = PAV.r;
    var base = cyl(r + .25, r + .35, .3, mStone, 0, .15, 0, G, 6); base.rotation.y = Math.PI / 2;
    var fl = cyl(r, r, PH - .28, mMaru, 0, .28 + (PH - .28) / 2, 0, G, 6); fl.rotation.y = Math.PI / 2;
    var V = []; for (var k = 0; k < 6; k++) V.push([Math.cos(k * Math.PI / 3) * (r - .35), Math.sin(k * Math.PI / 3) * (r - .35)]);
    var mRed = M('#8C3A2B', { roughness: .6 }), mJade = M('#5E8E7B', { roughness: .7 }), mDc = M('#D9B45A', { roughness: .6 });
    V.forEach(function (p) { cyl(.14, .15, 2.15, mRed, p[0], PH + 1.075, p[1], G, 14); cyl(.155, .155, .12, mJade, p[0], PH + 1.95, p[1], G, 14); cyl(.2, .24, .1, mStoneD, p[0], PH + .03, p[1], G, 10); });
    for (k = 0; k < 6; k++) { var a = V[k], b = V[(k + 1) % 6], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      var S = grp(mx, PH, mz, G, ang); box(L, .2, .18, mJade, 0, 2.1, 0, S); box(L, .04, .2, mRed, 0, 1.99, 0, S); [-1, 1].forEach(function (e2) { box(.1, .21, .19, mDc, e2 * (L / 2 - .32), 2.1, 0, S); });
      if (k !== 1 && k !== 4) { box(L - .3, .06, .1, mWood, 0, .52, 0, S); box(L - .3, .05, .08, mWood, 0, .14, 0, S); for (var q = -3; q <= 3; q++) box(.05, .4, .05, mWoodD, q * (L - .5) / 6, .33, 0, S); }
      // bamboo blind (rolled up by default)
      var bm = new T.MeshStandardMaterial({ color: '#D9C28A', roughness: .9, side: T.DoubleSide, transparent: true, opacity: .96 });
      var roll = cyl(.07, .07, L - .4, M('#CDB67C'), 0, 1.93, 0, S, 10); roll.rotation.z = Math.PI / 2;
      var sheet = new T.Mesh(new T.PlaneGeometry(L - .4, 1.5), bm); sheet.position.set(0, 1.2, 0); sheet.visible = false; sheet.userData.keep = true; roll.userData.keep = true; S.add(sheet); blinds.push({ roll: roll, sheet: sheet });
    }
    // table + cushions + tea
    cyl(.75, .75, .06, mWoodL, 0, PH + .36, 0, G, 28); cyl(.12, .3, .32, mWood, 0, PH + .17, 0, G, 12);
    cyl(.09, .07, .1, M('#EDE6DA', { roughness: .4 }), 0, PH + .44, 0, G, 14, true); sph(.05, M('#EDE6DA', { roughness: .4 }), 0, PH + .5, 0, G, 1, .7, 1, true);
    [[.3, .1], [-.25, .2], [.05, -.32]].forEach(function (p) { cyl(.035, .03, .05, M('#BFE3C8', { roughness: .4 }), p[0], PH + .415, p[1], G, 10, true); });
    for (k = 0; k < 7; k++) { var an = k * Math.PI * 2 / 7 + .22; cushion(Math.cos(an) * 1.5, PH, Math.sin(an) * 1.5, ['#8CB4D0', '#E9A06E', '#9BC7A2', '#D9B26F', '#C6A6E0', '#E98FA0', '#E9C98A'][k], G); }
    // steps
    [-1, 1].forEach(function (s) { box(1.6, .22, .6, M('#B5AEA2', { roughness: 1 }), 0, .11, s * (r * .866 + .5), G); });
    // roof (hex, concave)
    var pts = [], n = 14; for (var i = 0; i <= n; i++) { var t = i / n; pts.push(new T.Vector2(.02 + t * (r + 1.05), 1.95 * Math.pow(1 - t, 1.6) + .5 * Math.pow(t, 4))); }
    var mt = new T.MeshStandardMaterial({ map: tTile.clone(), roughness: .62, metalness: .05, transparent: true, side: T.DoubleSide }); mt.map.needsUpdate = true; mt.map.repeat.set(4, 3); mt.bumpMap = mt.map; mt.bumpScale = .06;
    var rg = new T.Group(); rg.position.y = PH + 2.22; rg.rotation.y = Math.PI / 2; G.add(rg);
    var rm = new T.Mesh(new T.LatheGeometry(pts, 6), mt); rm.castShadow = true; rg.add(rm);
    var mr = new T.MeshStandardMaterial({ color: '#E7E1D3', roughness: .9, transparent: true });
    for (k = 0; k < 6; k++) { var cp = []; for (i = 0; i <= 8; i++) { var tt = i / 8, rr = .02 + tt * (r + 1.05); cp.push(new T.Vector3(Math.sin(k * Math.PI / 3) * rr, 1.95 * Math.pow(1 - tt, 1.6) + .5 * Math.pow(tt, 4) + .06, Math.cos(k * Math.PI / 3) * rr)); } var tb = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cp), 12, .11, 6), mr); tb.castShadow = true; rg.add(tb); }
    var mf = new T.MeshStandardMaterial({ color: '#D9D3C6', roughness: .9, transparent: true }); cyl(.12, .2, .3, mf, 0, 2.1, 0, rg, 10); sph(.16, mf, 0, 2.34, 0, rg);
    rg.userData.keep = true; pavRoof = { G: rg, mats: [mt, mr, mf], op: 1, un: rm }; roofs.pav = pavRoof;
    var plq = plaque('정자', 1.2); plq.position.set(0, PH + 2.45, r * .866 - .12); G.add(plq); var plq2 = plaque('정자', 1.2); plq2.position.set(0, PH + 2.45, -(r * .866 - .12)); plq2.rotation.y = Math.PI; G.add(plq2);
    var L2 = new T.PointLight('#FFC98A', 0, 9, 1.6); L2.position.set(PAV.x, PH + 1.8, PAV.z); scene.add(L2); lampLights.push({ L: L2, n: 1.2 });
    lantern(G, 1.2, PH + 2.0, r * .866 - .3); lantern(G, -1.2, PH + 2.0, r * .866 - .3); lantern(G, 1.2, PH + 2.0, -(r * .866 - .3)); lantern(G, -1.2, PH + 2.0, -(r * .866 - .3));
  })();
  function setBlinds(down) { blinds.forEach(function (b) { b.sheet.visible = !!down; b.roll.visible = !down; }); }

  // ---------- compound wall, gate ----------
  (function () {
    var mw = new T.MeshStandardMaterial({ map: tWall, roughness: 1 }), mcap = M('#4A515B', { roughness: .8 });
    function seg(x0, z0, x1, z1) { var L = Math.hypot(x1 - x0, z1 - z0), hz = x0 !== x1, m = box(hz ? L : .36, 1.5, hz ? .36 : L, mw.clone(), (x0 + x1) / 2, .75, (z0 + z1) / 2); m.material.map = tWall.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set(L / 2.4, 1); box(hz ? L + .1 : .6, .14, hz ? .6 : L + .1, mcap, (x0 + x1) / 2, 1.57, (z0 + z1) / 2); box(hz ? L + .1 : .3, .12, hz ? .3 : L + .1, mcap, (x0 + x1) / 2, 1.68, (z0 + z1) / 2); ob(x0 - .2, z0 - .2, x1 + .2, z1 + .2); }
    seg(0, 0, WX, 0); seg(0, 0, 0, WZ); seg(WX, 0, WX, WZ); seg(0, WZ, 13.4, WZ); seg(16.6, WZ, WX, WZ);
    ob(0, 0, WX, 1.0); ob(13.4, WZ - .1, 16.6, WZ + .4);
    // gate
    var G = grp(15, 0, WZ); [-1.6, 1.6].forEach(function (x) { cyl(.17, .18, 2.7, mCol, x, 1.35, 0, G, 14); cyl(.26, .3, .14, mStoneD, x, .07, 0, G, 10); });
    box(3.6, .26, .26, mCol, 0, 2.62, 0, G);
    [-1, 1].forEach(function (s) { var d = grp(s * 1.45, 0, 0, G, s * 1.25); var dm = box(1.35, 2.2, .08, mWood, -s * .68, 1.2, 0, d); for (var i = 0; i < 3; i++) box(1.35, .06, .1, mWoodD, -s * .68, .4 + i * .8, 0, d); cyl(.06, .06, .03, M('#C9A25A', { metalness: .6, roughness: .4 }), -s * 1.15, 1.2, s > 0 ? -.05 : -.05, d, 12).rotation.x = Math.PI / 2; });
    var tg = tex(128, 128, function (c, w, h) { c.clearRect(0, 0, w, h); c.beginPath(); c.arc(64, 64, 58, Math.PI, 0); c.fillStyle = '#C8392F'; c.fill(); c.beginPath(); c.arc(64, 64, 58, 0, Math.PI); c.fillStyle = '#2F5DA8'; c.fill(); c.beginPath(); c.arc(35, 64, 29, 0, 7); c.fillStyle = '#C8392F'; c.fill(); c.beginPath(); c.arc(93, 64, 29, 0, 7); c.fillStyle = '#2F5DA8'; c.fill(); }); tg.wrapS = tg.wrapT = T.ClampToEdgeWrapping;
    G.children.forEach(function (d) { if (!d.isGroup) return; var sx = d.children[0].position.x; [-1, 1].forEach(function (f) { var p = new T.Mesh(new T.CircleGeometry(.3, 28), new T.MeshStandardMaterial({ map: tg, transparent: true, roughness: .8 })); p.position.set(sx, 1.45, f * .046); if (f < 0) p.rotation.y = Math.PI; p.userData.keep = true; d.add(p); }); });
    var rf = roof(15, WZ, 4.4, 1.5, true, 2.75, .55); rf.G.scale.set(1, .8, 1); roofs.gate = rf;
    var pq = plaque('율미', 1.3); pq.position.set(0, 2.3, -.2); pq.rotation.y = Math.PI; G.add(pq);
  })();

  // ---------- yard decor ----------
  var stoneLamps = [];
  function stoneLantern(x, z, lit) { var G = grp(x, 0, z); cyl(.2, .24, .12, mStoneD, 0, .06, 0, G, 8); cyl(.05, .06, 1.95, mWoodD, 0, 1.05, 0, G, 8); var arm = box(.62, .06, .06, mWoodD, .26, 1.95, 0, G); box(.06, .2, .06, mWoodD, 0, 2.08, 0, G); lantern(G, .5, 1.9, 0); if (lit) { var L = new T.PointLight('#FFB060', 0, 9, 1.8); L.position.set(x + .5, 1.6, z); scene.add(L); lampLights.push({ L: L, n: 1.2 }); } obc(x, z, .16); }
  stoneLantern(10.3, 9.2, true); stoneLantern(19.7, 9.2); stoneLantern(10.3, 17.2); stoneLantern(19.7, 17.2, true);
  var tLeaf = tex(256, 256, function (c, w, h) { var r = rnd(41); c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); for (var i = 0; i < 1400; i++) { var v = Math.floor(150 + r() * 105); c.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.55)'; c.beginPath(); c.ellipse(r() * w, r() * h, 3 + r() * 6, 2 + r() * 3, r() * 3, 0, 7); c.fill(); } }, 2, 2);
  function leafMat(col) { return new T.MeshStandardMaterial({ color: col, map: tLeaf, bumpMap: tLeaf, bumpScale: .09, roughness: .95 }); }
  function blob(r, seed, flat) { var g = new T.IcosahedronGeometry(r, 3), p = g.attributes.position, q = rnd(seed), ph = [q() * 6, q() * 6, q() * 6]; for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + .13 * Math.sin(x * 4.2 / r + ph[0]) * Math.sin(y * 3.7 / r + ph[1]) + .09 * Math.sin(z * 6.1 / r + ph[2]) + .05 * Math.sin((x + y + z) * 11 / r); p.setXYZ(i, x * k, y * k * (flat || 1), z * k); } g.computeVertexNormals(); return g; }
  function pine(x, z, s) { var G = grp(x, 0, z); G.scale.setScalar(s); var bm = M('#6E4A34', { roughness: 1 }); var tube = function (pts, r) { var m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })), 10, r, 7), bm); m.castShadow = true; G.add(m); }; tube([[0, 0, 0], [.14, .9, 0], [-.06, 1.8, .05], [-.22, 2.8, 0]], .16); tube([[.02, 1.5, 0], [.5, 1.95, .08], [.95, 2.25, .15]], .08); tube([[-.1, 2.0, 0], [-.55, 2.35, -.12], [-.9, 2.5, -.2]], .07); var lm = [leafMat('#3E6A48'), leafMat('#4B7B55'), leafMat('#34593E')]; [[-.2, 3.0, 0, 1.0], [.98, 2.4, .15, .72], [-.95, 2.62, -.2, .68], [.25, 3.45, .1, .58], [-.6, 3.3, .35, .52]].forEach(function (p, i) { var l = new T.Mesh(blob(p[3], 50 + i, .42), lm[i % 3]); l.position.set(p[0], p[1], p[2]); l.castShadow = true; l.receiveShadow = true; G.add(l); }); obc(x, z, .3 * s); }
  function maple(x, z, s, col, fruit) { var G = grp(x, 0, z); G.scale.setScalar(s); cyl(.08, .13, 1.2, M('#7A5638'), 0, .6, 0, G, 8); var lm = [leafMat(col), leafMat(shade(col, .05))]; [[0, 1.6, 0, .62], [.4, 1.35, .1, .42], [-.38, 1.4, -.1, .45], [.05, 1.95, .05, .4]].forEach(function (p, i) { var l = new T.Mesh(blob(p[3], 70 + i + Math.round(x)), lm[i % 2]); l.position.set(p[0], p[1], p[2]); l.castShadow = true; l.receiveShadow = true; G.add(l); }); if (fruit) { var fm2 = M('#E8822E', { roughness: .5 }), fr = rnd(90); for (var fi = 0; fi < 14; fi++) { var fa = fr() * 6.28, fy = 1.15 + fr() * .9, fd = .45 + fr() * .25; sph(.06, fm2, Math.cos(fa) * fd, fy, Math.sin(fa) * fd, G, 1, .9, 1); } } obc(x, z, .2 * s); }
  function jar(x, z, s) { var pts = [[.1, 0], [.2, .08], [.27, .3], [.24, .5], [.15, .6], [.17, .64]].map(function (p) { return new T.Vector2(p[0] * s, p[1] * s); }); var m = new T.Mesh(new T.LatheGeometry(pts, 14), M('#6B4A3A', { roughness: .45 })); m.position.set(x, .12, z); m.castShadow = true; scene.add(m); cyl(.19 * s, .19 * s, .03, M('#4A3428'), x, .12 + .65 * s, z, scene, 14); }
  pine(21.2, 21.6, 1.25); maple(27.2, 22.4, 1.1, '#6E9E5A', true); maple(2.2, 22.6, 1.0, '#7FB26A'); maple(7.4, 7.7, .8, '#6FA35E');
  (function () { // 장독대
    box(4.4, .12, 2.2, mStone, 4.4, .06, 22.4); var r = rnd(4); for (var i = 0; i < 9; i++) jar(2.9 + (i % 5) * .78 + (r() - .5) * .1, 21.9 + Math.floor(i / 5) * .85, .8 + r() * .5); ob(2.2, 21.3, 6.6, 23.5);
    // 평상 (low bench platform) under the pine
    var G = grp(24.4, 0, 21.9); box(2.4, .06, 1.5, mWoodL, 0, .36, 0, G); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(.1, .34, .1, mWoodD, s[0] * 1.08, .17, s[1] * .63, G); }); ob(23.2, 21.15, 25.6, 22.65);
    // grass tufts + flowers along the walls
    var fm = [M('#F7B8C4'), M('#FFE08A'), M('#FFFBF2')], gm2 = M('#7DB068', { roughness: 1 });
    for (i = 0; i < 46; i++) { var x = i < 23 ? 13.6 + r() * 1.0 - (r() < .5 ? 0 : -2.4) : 17 + r() * 12, z = i < 23 ? 23.2 + r() * .9 : 23.3 + r() * .8; if (i < 23) x = r() < .5 ? 13 + r() * .9 : 16.2 + r() * .9; var t = new T.Mesh(new T.ConeGeometry(.09, .26, 5), gm2); t.position.set(x, .13, z); scene.add(t); if (i % 3 === 0) sph(.05, fm[i % 3 === 0 ? (i / 3) % 3 | 0 : 0], x + .08, .24, z, scene, 1, 1, 1, true); }
  })();
  // outside: nothing but sky. a stone landing at the gate, and slow clouds
  var clouds = [];
  (function () {
    box(3.6, .14, 2.2, mStone, 15, -.02, WZ + 1.3);
    var r = rnd(17), mt = tex(256, 256, function (c, w, h) { c.clearRect(0, 0, w, h); for (var i = 0; i < 26; i++) { var x = w * (.25 + r() * .5), y = h * (.36 + r() * .28), rad = 30 + r() * 62, g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); } }); mt.wrapS = mt.wrapT = T.ClampToEdgeWrapping;
    var cm = new T.SpriteMaterial({ map: mt, transparent: true, depthWrite: false, opacity: .8, fog: false });
    for (var i = 0; i < 54; i++) { var a = r() * Math.PI * 2, d = 30 + r() * 150, sp = new T.Sprite(cm), sc = 46 + r() * 70; sp.position.set(15 + Math.cos(a) * d, (d < 60 ? -17 : -12) + r() * 9 - (i % 9 === 0 ? -22 : 0), 12 + Math.sin(a) * d * .9); sp.scale.set(sc, sc * .42, 1); sp.renderOrder = -1; scene.add(sp); clouds.push({ G: sp, v: .15 + r() * .3 }); }
    clouds.mat = cm;
  })();

  // ---------- characters ----------
  function mochi(look, name, isMe) {
    look = look || {}; var G = new T.Group(), body = new T.Group(); G.add(body);
    var skinC = !look.skin || look.skin === 'cream' ? '#FFF7EA' : look.skin, hood = M(look.tc || '#F7C9C9', { roughness: .95 }), skin = M(skinC, { roughness: .9 }), hair = M(look.hc || '#A0674A', { roughness: .8 });
    var pts = []; for (var i = 0; i <= 20; i++) { var t = i / 20, a = t * Math.PI; pts.push(new T.Vector2(Math.sin(a) * (.30 + .05 * (1 - t)) * (t < .12 ? t / .12 * .9 + .1 : 1), .08 + (1 - Math.cos(a)) * .36)); }
    var b = new T.Mesh(new T.LatheGeometry(pts, 28), hood); b.castShadow = true; body.add(b);
    [-1, 1].forEach(function (s) { var e = new T.Mesh(new T.CapsuleGeometry(.045, .09, 4, 10), hood); e.position.set(s * .13, .82, 0); e.rotation.z = -s * .15; e.castShadow = true; body.add(e); G.userData[s < 0 ? 'fl' : 'fr'] = sph(.085, mCream, s * .12, .05, .04, G, 1, .6, 1.25); sph(.05, mCream, s * .2, .3, .22, body, 1, 1, 1, true); });
    sph(.225, skin, 0, .5, .2, body, 1, .92, .72);
    var hs = look.hair || 'soft', fr = new T.Mesh(new T.SphereGeometry(.232, 22, 12, 0, Math.PI * 2, 0, Math.PI * (hs === 'straight' ? .42 : .36)), hair); fr.position.set(0, .5, .195); fr.scale.set(1, .93, .76); fr.rotation.x = -.25; if (hs === 'side') fr.rotation.z = .35; body.add(fr);
    if (hs === 'long' || hs === 'straight') [-1, 1].forEach(function (s) { sph(.06, hair, s * .19, .44, .27, body, .7, 1.7, .7, true); });
    if (hs === 'spiky') [-.1, 0, .1].forEach(function (x, j) { var c = new T.Mesh(new T.ConeGeometry(.04, .1, 6), hair); c.position.set(x, .6 - Math.abs(x) * .3, .36); c.rotation.x = Math.PI - .5; c.rotation.z = -x * 3; body.add(c); });
    if (hs === 'curly') [-.13, -.045, .045, .13].forEach(function (x) { sph(.045, hair, x, .615 - Math.abs(x) * .25, .345, body, 1, 1, 1, true); });
    var face = look.face || 'grin', wh = new T.MeshBasicMaterial({ color: '#fff' });
    [-1, 1].forEach(function (s) {
      var closed = face === 'happy' || (face === 'wink' && s > 0);
      if (closed) { var arc = new T.Mesh(new T.TorusGeometry(.028, .007, 6, 12, Math.PI), mInk); arc.position.set(s * .085, .495, .362); body.add(arc); }
      else { var r = face === 'wow' ? .032 : .026; sph(r, mInk, s * .085, .5, .355, body, 1, 1.35, .6, true); sph(.009, wh, s * .085 + .008, .512, .372, body, 1, 1, 1, true); }
      if (look.cheek !== 'none') sph(.04, new T.MeshBasicMaterial({ color: look.cheek || '#F7AEB8', transparent: true, opacity: .75 }), s * .15, .43, .325, body, 1, .6, .3, true);
    });
    if (face === 'wow') sph(.022, M('#C9616E'), 0, .415, .356, body, 1, 1.2, .5, true); else sph(.03, M('#E9858F'), 0, .42, .352, body, face === 'grin' ? 1.3 : 1, face === 'grin' ? .9 : .6, .5, true);
    if (look.acc === 'glasses') [-1, 1].forEach(function (s) { var g = new T.Mesh(new T.TorusGeometry(.05, .008, 6, 18), mInk); g.position.set(s * .085, .5, .365); body.add(g); });
    if (look.acc === 'phones') { var hb = new T.Mesh(new T.TorusGeometry(.3, .022, 6, 20, Math.PI), M('#4A4A55')); hb.position.set(0, .52, .05); body.add(hb); [-1, 1].forEach(function (s) { sph(.07, M('#F2A86F'), s * .3, .5, .06, body, .6, 1, 1, true); }); }
    if (look.acc === 'pin') { var st = new T.Mesh(new T.OctahedronGeometry(.045), M('#F5C542', { roughness: .4 })); st.position.set(.17, .68, .2); body.add(st); }
    if (look.acc === 'ribbon') [-1, 1].forEach(function (s) { var c = new T.Mesh(new T.ConeGeometry(.05, .1, 8), M('#E98FA0')); c.position.set(s * .05 + .0, .8, .12); c.rotation.z = s * Math.PI / 2; body.add(c); });
    if (look.item === 'book') { var bk = box(.2, .13, .03, M('#F7C9A8'), 0, .28, .34, body, true); bk.rotation.x = -.3; }
    if (look.item === 'laptop') { var lp = box(.24, .15, .02, M('#C3CBD4', { metalness: .4, roughness: .4 }), 0, .28, .34, body, true); lp.rotation.x = -.3; }
    if (look.item === 'phone') { var ph = box(.08, .14, .015, M('#3A4252'), .1, .3, .34, body, true); ph.rotation.x = -.3; }
    if (look.item === 'mug') { cyl(.045, .04, .08, M('#FFFBF3', { roughness: .4 }), .1, .3, .33, body, 12, true); }
    var lab = labelSprite(name || '', isMe ? '#3F3129' : '#FFFBF3', isMe ? '#FFFBF3' : '#3F3129'); lab.position.y = 1.1; G.add(lab); G.userData.lab = lab;
    G.userData.body = body; scene.add(G); return G;
  }
  function dropChar(G) { if (!G) return; scene.remove(G); G.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map && o.isSprite) o.material.map.dispose(); }); }
  // ---------- merge static meshes (far fewer draw calls) ----------
  (function mergeStatic() {
    scene.updateMatrixWorld(true);
    var keepM = []; glow.forEach(function (g) { keepM.push(g.m); }); occ.forEach(function (o) { o.userData.keep = true; });
    var groups = {};
    (function walk(o) {
      if (o.userData && o.userData.keep) return;
      if (o.isMesh && o.visible && !Array.isArray(o.material) && keepM.indexOf(o.material) < 0 && !o.material.transparent && o.geometry && o.geometry.attributes.position) {
        var m = o.material, key = [m.type, m.color ? m.color.getHexString() : '', m.roughness, m.metalness, m.map ? m.map.uuid : '', m.emissive ? m.emissive.getHexString() : '', m.emissiveIntensity, m.side, o.castShadow ? 1 : 0, o.receiveShadow ? 1 : 0, m.fog ? 1 : 0].join('|');
        (groups[key] = groups[key] || { mat: m, cast: o.castShadow, recv: o.receiveShadow, list: [] }).list.push(o);
      }
      for (var i = 0; i < o.children.length; i++) walk(o.children[i]);
    })(scene);
    Object.keys(groups).forEach(function (k) {
      var g = groups[k]; if (g.list.length < 2) return;
      var pos = [], nor = [], uv = [];
      g.list.forEach(function (o) {
        var geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geo.applyMatrix4(o.matrixWorld);
        if (!geo.attributes.normal) geo.computeVertexNormals();
        var p = geo.attributes.position, n = geo.attributes.normal, u = geo.attributes.uv, i;
        for (i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); if (u) uv.push(u.getX(i), u.getY(i)); else uv.push(0, 0); }
        geo.dispose(); if (o.parent) o.parent.remove(o); o.geometry.dispose();
      });
      var bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); bg.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); bg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      var mesh = new T.Mesh(bg, g.mat); mesh.castShadow = g.cast; mesh.receiveShadow = g.recv; scene.add(mesh);
    });
  })();
  var saved = null; try { saved = JSON.parse(sessionStorage.getItem('yo3d-pos') || 'null'); } catch (e) {}
  var st0 = opts.start || saved || { x: 15, z: 18.6, dir: Math.PI };
  var P = { x: st0.x, z: st0.z, y: 0, dir: st0.dir == null ? Math.PI : st0.dir, walk: 0 }, meLook = opts.look || { tc: '#F7C9C9', hc: '#A0674A', item: 'book' }, meName = opts.name || (es ? 'Yo' : '나');
  var meG = mochi(meLook, meName, true), meKey = JSON.stringify([meLook, meName]);
  var others = {};

  var zoneLabs = [];
  function mkZoneLabs() { zoneLabs.forEach(function (s) { scene.remove(s); }); zoneLabs = []; BL.concat([{ k: 'pav', x0: PAV.x, x1: PAV.x, z0: PAV.z - 1.5, z1: PAV.z - 1.5 }]).forEach(function (b) { var sp = labelSprite(ZN[b.k][es ? 1 : 0].split(' · ').pop(), '#3F3129', '#FFFBF3'); sp.scale.multiplyScalar(4.2); sp.position.set((b.x0 + b.x1) / 2, 5, (b.z0 + b.z1) / 2); sp.visible = light; scene.add(sp); zoneLabs.push(sp); }); }
  function labScale() { [meG].concat(Object.keys(others).map(function (id) { return others[id].G; })).forEach(function (G) { if (!G) return; var l = G.userData.lab; if (!l.userData.b) l.userData.b = l.scale.clone(); var b = l.userData.b; if (light) { l.material.sizeAttenuation = true; l.scale.copy(b).multiplyScalar(3); } else { l.material.sizeAttenuation = false; l.scale.set(b.x / b.y * .042, .042, 1); } l.material.needsUpdate = true; l.position.y = light ? 2.2 : 1.12; }); zoneLabs.forEach(function (s) { s.visible = light; }); }
  // ---------- lights, sky ----------
  var hemi = new T.HemisphereLight('#FFFFFF', '#8A6A4A', .6); scene.add(hemi);
  var sun = new T.DirectionalLight('#FFF1D6', 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 90; sun.shadow.bias = -.0005; sun.shadow.normalBias = .03; sun.shadow.radius = 3.2; sun.target.position.set(15, 0, 12); scene.add(sun, sun.target);
  var stars = (function () { var n = 1500, pos = new Float32Array(n * 3), r = rnd(5); for (var i = 0; i < n; i++) { var a = r() * Math.PI * 2, e = (r() - .5) * Math.PI * .96, d = 300; pos[i * 3] = 15 + Math.cos(a) * Math.cos(e) * d; pos[i * 3 + 1] = Math.sin(e) * d; pos[i * 3 + 2] = 12 + Math.sin(a) * Math.cos(e) * d; } var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); var p = new T.Points(geo, new T.PointsMaterial({ color: '#FFFFFF', size: 1.7, sizeAttenuation: false, fog: false, transparent: true, opacity: .9 })); scene.add(p); return p; })();
  var orbT = tex(128, 128, function (c, w, h) { var g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.16, 'rgba(255,255,255,.95)'); g.addColorStop(.3, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }); orbT.wrapS = orbT.wrapT = T.ClampToEdgeWrapping;
  var orb = new T.Sprite(new T.SpriteMaterial({ map: orbT, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending })); orb.scale.set(120, 120, 1); orb.renderOrder = -4; scene.add(orb);
  var dome = new T.Mesh(new T.SphereGeometry(420, 32, 24), new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); dome.position.set(15, 0, 12); dome.renderOrder = -5; dome.userData.keep = true; scene.add(dome);
  dome.geometry.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(dome.geometry.attributes.position.count * 3), 3));
  var SKY = { d: [[-1, '#D9C7CF'], [-.12, '#EFDCD5'], [.04, '#F3E4DA'], [.3, '#CBD3E6'], [1, '#93A9D2']], n: [[-1, '#1C1A40'], [-.1, '#3B3368'], [.05, '#4A3F78'], [.32, '#1A1D4A'], [1, '#080A22']] };
  function paintSky(st) { var p = dome.geometry.attributes.position, col = dome.geometry.attributes.color, a = new T.Color(), b = new T.Color(); for (var i = 0; i < p.count; i++) { var t = p.getY(i) / 420, k = 0; while (k < st.length - 2 && t > st[k + 1][0]) k++; var f = Math.max(0, Math.min(1, (t - st[k][0]) / (st[k + 1][0] - st[k][0]))); a.set(st[k][1]).convertSRGBToLinear(); b.set(st[k + 1][1]).convertSRGBToLinear(); a.lerp(b, f * f * (3 - 2 * f)); col.setXYZ(i, a.r, a.g, a.b); } col.needsUpdate = true; }
  var night = false, nightAuto = opts.night == null;
  function seoulHour() { return new Date(Date.now() + 9 * 3600000).getUTCHours(); }
  function setNight(n) {
    night = !!n;
    scene.background = null; R.setClearColor(n ? '#3B3368' : '#F1E0D7', 1); paintSky(n ? SKY.n : SKY.d); scene.fog = null; if (clouds.mat) { clouds.mat.color.set(n ? '#8C86C4' : '#FFF4EC'); clouds.mat.opacity = n ? .5 : .85; }
    hemi.intensity = n ? .26 : .46; hemi.color.set(n ? '#8E8FD8' : '#EEF0FB'); hemi.groundColor.set(n ? '#2A2238' : '#C3A88C');
    sun.intensity = n ? .34 : 1.02; sun.color.set(n ? '#AFB4F2' : '#FFE6C8'); sun.position.set(n ? 34 : -6, n ? 30 : 27, n ? -4 : 34);
    orb.position.set(n ? 150 : -170, n ? 170 : 120, n ? -250 : -280); orb.material.color.set(n ? '#E8E4FF' : '#FFE9C8'); orb.scale.setScalar(n ? 70 : 150); stars.visible = n;
    glow.forEach(function (g) { g.m.emissiveIntensity = n ? g.n : g.d; });
    lampLights.forEach(function (l) { l.L.intensity = n ? l.n : 0; l.L.visible = !!n; }); scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; });
    R.toneMappingExposure = n ? 1.3 : .96; wrap.style.background = n ? '#3B3368' : '#F1E0D7';
  }
  setNight(nightAuto ? (seoulHour() < 6 || seoulHour() >= 18) : opts.night);

  // ---------- zones, height, collision ----------
  function zoneAt(x, z) { for (var i = 0; i < BL.length; i++) { var b = BL[i]; if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return b.k; } if (Math.hypot(x - PAV.x, z - PAV.z) < 2.75) return 'pav'; return 'yard'; }
  function hAt(x, z) {
    for (var i = 0; i < BL.length; i++) { var b = BL[i]; if (x > b.x0 - .5 && x < b.x1 + .5 && z > b.z0 - .5 && z < b.z1 + .5) return (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) ? FH : .24; }
    var d = Math.hypot(x - PAV.x, z - PAV.z); if (d < 3.05) return PH; if (d < 3.85 && Math.abs(x - PAV.x) < .95) return .22; return 0;
  }
  function free(x, z) {
    var r = .26, i, o;
    for (i = 0; i < OB.length; i++) { o = OB[i]; var nx = Math.max(o[0], Math.min(x, o[2])), nz = Math.max(o[1], Math.min(z, o[3])); if ((x - nx) * (x - nx) + (z - nz) * (z - nz) < r * r) return false; }
    var dx = x - PAV.x, d = Math.hypot(dx, z - PAV.z); if (d < .95) return false; if (d > 2.5 && d < 3.6 && Math.abs(dx) > .7) return false;
    return x > .4 && x < WX - .4 && z > .4 && z < WZ - .3;
  }
  if (!free(P.x, P.z)) { P.x = 15; P.z = 18.6; }
  function stepChar(c, vx, vz, dt) { var sp = Math.hypot(vx, vz); if (sp < .001) { c.walk = Math.max(0, c.walk - dt * 6); return; } var nx = c.x + vx * dt, nz = c.z + vz * dt; if (free(nx, c.z)) c.x = nx; if (free(c.x, nz)) c.z = nz; var td = Math.atan2(vx, vz), dd = ((td - c.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI; c.dir += dd * Math.min(1, dt * 12); c.walk = Math.min(1, c.walk + dt * 6); }
  function pose(G, c, t) { G.position.set(c.x, c.y + Math.abs(Math.sin(t * 9)) * .035 * c.walk, c.z); G.rotation.y = c.dir; var b = G.userData.body; b.rotation.z = Math.sin(t * 9) * .06 * c.walk; b.scale.y = 1 + Math.sin(t * 2.2 + c.x) * .012; G.userData.fl.position.z = .04 + Math.sin(t * 9) * .07 * c.walk; G.userData.fr.position.z = .04 - Math.sin(t * 9) * .07 * c.walk; }

  // ---------- input ----------
  var keys = {}, yaw = opts.yaw == null ? 0 : opts.yaw, pitch = opts.pitch == null ? .9 : opts.pitch, dist = opts.dist || 9, drag = null, moved = 0;
  function kd(e) { if (e.metaKey || e.ctrlKey || e.altKey) return; var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault(); if (k === 'v' && !light) setFp(!fp); if (k === 'Enter') openZone(); }
  function ku(e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; }
  canvas.addEventListener('keydown', kd); canvas.addEventListener('keyup', ku); canvas.addEventListener('blur', function () { keys = {}; });
  canvas.addEventListener('pointerdown', function (e) { canvas.focus({ preventScroll: true }); drag = { x: e.clientX, y: e.clientY }; moved = 0; canvas.style.cursor = 'grabbing'; try { canvas.setPointerCapture(e.pointerId); } catch (er) {} });
  canvas.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); if (!light) { if (moved > 6) autoCam = null; yaw -= dx * .006; pitch = Math.max(fp ? -.5 : .22, Math.min(fp ? .5 : 1.4, pitch + dy * .004 * (fp ? -1 : 1))); } drag = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', function (e) { canvas.style.cursor = 'grab'; if (drag && moved < 6) pick(e); drag = null; });
  canvas.addEventListener('wheel', function (e) { e.preventDefault(); autoCam = null; dist = Math.max(3.2, Math.min(24, dist + e.deltaY * .012)); }, { passive: false });
  var ray = new T.Raycaster(), v2 = new T.Vector2();
  function pick(e) { var r = canvas.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, light ? ocam : cam); var best = null, bd = 1e9; Object.keys(others).forEach(function (id) { var o = others[id], hit = ray.intersectObject(o.G, true); if (hit.length && hit[0].distance < bd) { bd = hit[0].distance; best = id; } }); if (best && opts.onPerson) opts.onPerson(best); }
  function setFp(v) { fp = v; autoCam = null; pitch = v ? 0 : (curZone && curZone !== 'yard' ? 1.12 : .9); meG.visible = !v; labels(); try { canvas.focus({ preventScroll: true }); } catch (e) {} }
  function setLight(v) { light = !!v; if (light) fp = false; meG.visible = !fp; R.shadowMap.enabled = !light && qLevel < 3; scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; }); W = 0; resize(); labels(); labScale(); try { localStorage.setItem('yo3d-light', light ? '1' : '0'); } catch (e) {} }
  bView.addEventListener('click', function () { setFp(!fp); }); bLight.addEventListener('click', function () { setLight(!light); canvas.focus({ preventScroll: true }); });
  var curZone = '', autoCam = null, outView = null, pLift = 0, pEff = .9;
  function openZone() { if (curZone && curZone !== 'yard' && opts.onOpen) opts.onOpen(curZone); }
  promptEl.addEventListener('click', openZone);
  function labels() {
    bView.textContent = fp ? (es ? 'Vista normal' : '따라가기 시점') : (es ? 'Primera persona' : '1인칭'); bView.style.display = light ? 'none' : '';
    bLight.textContent = light ? (es ? 'Modo 3D' : '3D로 보기') : (es ? 'Modo ligero' : '가벼운 모드');
    canvas.setAttribute('aria-label', es ? 'Oficina 3D. Flechas o WASD para caminar' : '3D 오피스. 방향키나 WASD로 걸어요');
    var z = ZN[curZone || 'yard']; zoneEl.textContent = z[es ? 1 : 0];
    if (curZone && curZone !== 'yard') { promptEl.style.display = 'block'; promptEl.textContent = 'Enter · ' + z[es ? 3 : 2]; } else promptEl.style.display = 'none';
    hintEl.textContent = es ? 'WASD / flechas: caminar · Arrastrar: mirar · Rueda: zoom · V: primera persona' : 'WASD·방향키: 걷기 · 드래그: 둘러보기 · 휠: 확대 · V: 1인칭';
  }
  var seen = false; try { seen = localStorage.getItem('yo3d-hint') === '1'; localStorage.setItem('yo3d-hint', '1'); } catch (e) {}
  if (seen || opts.capture) hintEl.style.display = 'none'; else setTimeout(function () { hintEl.style.opacity = '0'; }, 9000);
  if (opts.capture) { mini.style.display = opts.capture === 'ui' ? '' : 'none'; if (opts.capture !== 'ui') { btns.style.display = 'none'; } }

  // ---------- minimap ----------
  function drawMini() {
    var c = mctx, s = 300 / WX; c.clearRect(0, 0, 300, 246); c.fillStyle = '#EDE3CF'; c.fillRect(0, 0, 300, 246);
    var col = { hall: '#FFE9A8', mk: '#F9D3DE', tc: '#DDF0DF', bug: '#E3E0F5' };
    BL.forEach(function (b) { c.fillStyle = col[b.k]; c.strokeStyle = '#8A766B'; c.lineWidth = 2; c.fillRect(b.x0 * s, b.z0 * s, (b.x1 - b.x0) * s, (b.z1 - b.z0) * s); c.strokeRect(b.x0 * s, b.z0 * s, (b.x1 - b.x0) * s, (b.z1 - b.z0) * s); });
    c.fillStyle = '#CFE6F7'; c.beginPath(); for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; c[k ? 'lineTo' : 'moveTo']((PAV.x + Math.cos(a) * PAV.r) * s, (PAV.z + Math.sin(a) * PAV.r) * s); } c.closePath(); c.fill(); c.stroke();
    Object.keys(others).forEach(function (id) { var o = others[id]; c.fillStyle = (o.look && o.look.tc) || '#BFD9F2'; c.strokeStyle = '#3F3129'; c.lineWidth = 2; c.beginPath(); c.arc(o.c.x * s, o.c.z * s, 6, 0, 7); c.fill(); c.stroke(); });
    c.fillStyle = '#3F3129'; c.beginPath(); c.arc(P.x * s, P.z * s, 7, 0, 7); c.fill(); c.strokeStyle = '#F5C542'; c.lineWidth = 3; c.stroke();
  }

  // ---------- loop ----------
  var last = performance.now(), camPos = new T.Vector3(P.x, 6, P.z + 8), camTgt = new T.Vector3(P.x, .6, P.z), frame = 0, lastSent = '', tv = new T.Vector3(), tv2 = new T.Vector3();
  function fadeRoof(rf, target, dt) { if (!rf) return; var o = rf.op + (target - rf.op) * Math.min(1, dt * 7); if (Math.abs(o - rf.op) < .0005 && rf.G.visible === (o > .03)) return; rf.op = o; rf.mats.forEach(function (m) { m.opacity = o; }); rf.G.visible = o > .03; }
  function tick(now) {
    if (disposed) return; requestAnimationFrame(tick);
    if (!wrap.isConnected) return;
    resize(); var dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now; frame++;
    // movement
    var f = (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0), sd = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0);
    if (!light) { if (keys.q) yaw += dt * 1.8; if (keys.e) yaw -= dt * 1.8; }
    var vx = 0, vz = 0, spd = keys.Shift ? 5.2 : 3.2;
    if (f || sd) { var cy = light ? 0 : yaw, fx = -Math.sin(cy), fz = -Math.cos(cy), rx = Math.cos(cy), rz = -Math.sin(cy), n = Math.hypot(f, sd); vx = (fx * f + rx * sd) / n * spd; vz = (fz * f + rz * sd) / n * spd; }
    stepChar(P, vx, vz, dt); P.y += (hAt(P.x, P.z) - P.y) * Math.min(1, dt * 12);
    if (fp) P.dir = yaw + Math.PI;
    pose(meG, P, t);
    // others
    Object.keys(others).forEach(function (id) { var o = others[id], c = o.c, dx = o.t.x - c.x, dz = o.t.z - c.z, d = Math.hypot(dx, dz); if (d > 6) { c.x = o.t.x; c.z = o.t.z; d = 0; } if (d > .03) { var s = Math.min(d, Math.max(3.4, d * 4) * dt); c.x += dx / d * s; c.z += dz / d * s; var td = Math.atan2(dx, dz), dd = ((td - c.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI; c.dir += dd * Math.min(1, dt * 12); c.walk = Math.min(1, c.walk + dt * 6); } else { c.walk = Math.max(0, c.walk - dt * 6); if (o.t.dir != null) { var d2 = ((o.t.dir - c.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI; c.dir += d2 * Math.min(1, dt * 8); } } c.y += (hAt(c.x, c.z) - c.y) * Math.min(1, dt * 12); pose(o.G, c, t + o.ph); });
    for (var ci = 0; ci < clouds.length; ci++) { var cg = clouds[ci].G; cg.position.x += clouds[ci].v * dt; if (cg.position.x > 200) cg.position.x = -170; }
    // zone
    var z = zoneAt(P.x, P.z); if (z !== curZone) { var wasIn = curZone && curZone !== 'yard', isIn = z !== 'yard'; if (!fp && !light) { if (isIn && !wasIn) { outView = { pitch: pitch, dist: dist }; autoCam = { pitch: 1.14, dist: z === 'pav' ? 9.5 : z === 'bug' ? 8.5 : 12 }; } else if (!isIn && wasIn) autoCam = outView || { pitch: .9, dist: 9 }; } curZone = z; labels(); if (opts.onZone) opts.onZone(z); }
    if (autoCam && !fp && !light) { var ak = opts.capture ? 1 : Math.min(1, dt * 3.5); pitch += (autoCam.pitch - pitch) * ak; dist += (autoCam.dist - dist) * ak; if (Math.abs(autoCam.pitch - pitch) < .01 && Math.abs(autoCam.dist - dist) < .05) autoCam = null; }
    // roofs
    var k, ocl = []; for (k in roofs) { var hide = light || (!fp && (k === z || (k === 'gate' && P.z > 22.9 && Math.abs(P.x - 15) < 1.9))); fadeRoof(roofs[k], hide ? 0 : 1, light || opts.capture ? 1 : dt); if (!hide && roofs[k].un) ocl.push(roofs[k].un); }
    // camera
    var C;
    if (light) { C = ocam; ocam.position.set(15, 60, 12.25); ocam.up.set(0, 0, -1); ocam.lookAt(15, 0, 12.25); }
    else if (fp) { C = cam; cam.position.set(P.x, P.y + .78 + Math.abs(Math.sin(t * 9)) * .02 * P.walk, P.z); tv.set(P.x - Math.sin(yaw) * Math.cos(pitch), P.y + .78 + Math.sin(pitch), P.z - Math.cos(yaw) * Math.cos(pitch)); cam.lookAt(tv); }
    else {
      C = cam; camTgt.lerp(tv.set(P.x, P.y + .7, P.z), Math.min(1, dt * 8));
      var dd = dist, pe = pitch, tries = 0;
      if (frame % 3 === 0 || opts.capture) { for (; tries < 9; tries++) { tv2.set(Math.sin(yaw) * Math.cos(pe), Math.sin(pe), Math.cos(yaw) * Math.cos(pe)); ray.set(tv.set(P.x, P.y + .18, P.z), tv2); ray.far = dist; if (!ocl.length || !ray.intersectObjects(ocl, false).length) break; pe = Math.min(1.5, pe + .09); } pLift = pe - pitch; }
      pEff += ((pitch + pLift) - pEff) * (opts.capture ? 1 : Math.min(1, dt * 5)); pe = pEff;
      tv2.set(Math.sin(yaw) * Math.cos(pe), Math.sin(pe), Math.cos(yaw) * Math.cos(pe));
      if (occ.length) { ray.set(camTgt, tv2); ray.far = dist; var hit = ray.intersectObjects(occ, false); if (hit.length) dd = Math.max(2.2, hit[0].distance - .45); }
      tv.copy(camTgt).addScaledVector(tv2, dd); camPos.lerp(tv, Math.min(1, dt * 10)); cam.position.copy(camPos); cam.lookAt(camTgt);
    }
    if (compact && frame % 3) return;
    if (!light && R.shadowMap.enabled && frame % (qLevel >= 2 ? 3 : 2) === 0) R.shadowMap.needsUpdate = true;
    R.render(scene, C);
    if (!light && !opts.capture && !compact && frame > 90) { qAcc += dt; qN++; if (qN >= 120) { var avg = qAcc / qN; qAcc = 0; qN = 0; if (avg > 1 / 27 && qLevel < 3) { qLevel++; if (qLevel === 1) { prCap = 1; W = 0; } else if (qLevel === 2) { sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } } else { R.shadowMap.enabled = false; scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; }); } } } }
    if (frame % 6 === 0) drawMini();
    if (frame % 8 === 0) { var key = P.x.toFixed(2) + ',' + P.z.toFixed(2) + ',' + P.dir.toFixed(1); if (key !== lastSent) { lastSent = key; if (opts.onMove) opts.onMove(+P.x.toFixed(2), +P.z.toFixed(2), +P.dir.toFixed(2), z); try { sessionStorage.setItem('yo3d-pos', JSON.stringify({ x: P.x, z: P.z, dir: P.dir })); } catch (e) {} } }
    if (nightAuto && frame % 1800 === 0) { var nn = seoulHour() < 6 || seoulHour() >= 18; if (nn !== night) setNight(nn); }
  }
  mkZoneLabs(); labScale(); if (fp) setFp(true); if (light) setLight(true); labels(); resize(); requestAnimationFrame(tick);

  // ---------- API ----------
  return {
    setMe: function (look, name) { var k = JSON.stringify([look, name]); if (k === meKey) return; meKey = k; meLook = look; meName = name; dropChar(meG); meG = mochi(look, name, true); meG.visible = !fp; labScale(); },
    setPeople: function (list) {
      var keep = {};
      (list || []).forEach(function (p, i) {
        keep[p.id] = 1; var o = others[p.id], k = JSON.stringify([p.look, p.name]), tx = p.x == null ? 13.2 + (i % 4) * 1.2 : p.x, tz = p.z == null ? 21.2 : p.z;
        if (!o) { o = others[p.id] = { c: { x: tx, z: tz, y: 0, dir: p.dir == null ? Math.PI : p.dir, walk: 0 }, t: {}, ph: i * 1.7 }; }
        if (o.k !== k) { dropChar(o.G); o.G = mochi(p.look, p.name, false); o.k = k; o.look = p.look; }
        o.t.x = tx; o.t.z = tz; o.t.dir = p.dir;
      });
      Object.keys(others).forEach(function (id) { if (!keep[id]) { dropChar(others[id].G); delete others[id]; } });
      labScale();
    },
    setBoard: function (d) { var k = JSON.stringify(d); if (k === this._bk) return; this._bk = k; boardData = d; drawBoard(); },
    setLang: function (v) { if (!!v === es) return; es = !!v; labels(); drawBoard(); mkZoneLabs(); setSeats(seatData); },
    setNight: function (v) { nightAuto = v == null; setNight(v == null ? (seoulHour() < 6 || seoulHour() >= 18) : v); },
    setSeats: function (d) { var kk = JSON.stringify(d); if (kk === this._sk) return; this._sk = kk; setSeats(d); },
    setLight: setLight, setFp: setFp, setBlinds: setBlinds,
    getPos: function () { return { x: P.x, z: P.z, dir: P.dir, zone: curZone }; },
    setView: function (o) { if (o.yaw != null) yaw = o.yaw; if (o.pitch != null) pitch = o.pitch; if (o.dist != null) dist = o.dist; if (o.x != null) { P.x = o.x; P.z = o.z; camTgt.set(P.x, .7, P.z); camPos.set(P.x, 6, P.z + 6); } },
    attach: function (h) { if (wrap.parentNode !== h) h.appendChild(wrap); W = 0; },
    focus: function () { try { canvas.focus({ preventScroll: true }); } catch (e) {} },
    isLight: function () { return light; },
    dispose: function () { disposed = true; try { R.dispose(); } catch (e) {} if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
  };
}
window.Hanok3D = { create: create };
})();
