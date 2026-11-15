(function () {
'use strict';
var T = THREE, Q = new URLSearchParams(location.search);
// ---------- grid (same as the 2D office) ----------
var GW = 22, GH = 16, g = [], B = {}, x, y;
for (y = 0; y < GH; y++) { g.push([]); for (x = 0; x < GW; x++) g[y].push('X'); }
function fill(x0, y0, x1, y1, v) { for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) g[yy][xx] = v; }
fill(1, 1, 10, 5, 'C'); fill(12, 1, 20, 5, 'M'); fill(1, 7, 20, 8, 'H'); fill(1, 10, 12, 14, 'L'); fill(14, 10, 20, 14, 'S');
fill(5, 6, 6, 6, 'D'); fill(15, 6, 16, 6, 'D'); fill(4, 9, 9, 9, 'D'); fill(18, 9, 18, 9, 'D');
function blk(x0, y0, x1, y1) { for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) B[xx + ',' + yy] = 1; }
blk(1, 1, 1, 2); blk(4, 1, 6, 1); blk(10, 1, 10, 1); blk(2, 3, 3, 3); blk(5, 3, 6, 3); blk(8, 3, 9, 3);
blk(12, 1, 12, 1); blk(14, 2, 18, 3); blk(20, 1, 20, 1); blk(20, 4, 20, 5); blk(1, 7, 1, 7); blk(20, 7, 20, 7);
blk(8, 13, 11, 13); blk(14, 10, 14, 10); blk(15, 10, 15, 11); blk(17, 10, 17, 11); blk(19, 10, 19, 11); blk(14, 14, 15, 14); blk(20, 14, 20, 14);
function walk(x, y) { return x >= 0 && y >= 0 && x < GW && y < GH && g[y][x] !== 'X'; }
function open(x, y) { return walk(x, y) && !B[x + ',' + y]; }
var ZONE = { C: '교실 · Aula', M: '회의실 · Sala de reuniones', S: '서버 관리실 · Servidores', L: '메인 홀 · Hall', H: '복도 · Pasillo', D: '문 앞 · Puerta' };
var OBJ = [
  { n: '선생님 책상 · Mesa de la profe', x: 5.5, z: 1.5 }, { n: '학생 책상 · Mesas de alumnos', x: 6, z: 3.5 }, { n: '회의 테이블 · Mesa de reuniones', x: 16.5, z: 3 },
  { n: '전화기 · Teléfono', x: 20.5, z: 5 }, { n: '화이트보드 · Pizarra', x: 14, z: 1 }, { n: '공지판 · Tablón', x: 11.5, z: 10 }, { n: '안내 데스크 · Recepción', x: 10, z: 13.5 },
  { n: '서버 랙 · Servidores', x: 17.5, z: 11 }, { n: '개발자 책상 · Mesa de dev', x: 15, z: 14.5 }, { n: '소화기 · Extintor', x: 20.5, z: 14.5 }
];

// ---------- renderer / scene ----------
var canvas = document.getElementById('c');
var R = new T.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
var scene = new T.Scene();
var cam = new T.PerspectiveCamera(46, 1, 0.05, 220);
function resize() { var w = window.innerWidth, h = window.innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
window.addEventListener('resize', resize); resize();

// ---------- procedural textures ----------
function tex(w, h, draw, rx, ry) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; if (rx) t.repeat.set(rx, ry || rx); t.anisotropy = 8; return t; }
function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function shade(hex, k) { var c = new T.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); }
function woodTex(base, seed) { return tex(512, 512, function (c, w, h) { var r = rnd(seed), ph = 64; for (var yy = 0; yy < h; yy += ph) { var xx = -r() * 200; while (xx < w) { var L = 150 + r() * 160; c.fillStyle = shade(base, (r() - .5) * .07); c.fillRect(xx, yy, L, ph); c.strokeStyle = shade(base, -.16); c.lineWidth = 2; c.strokeRect(xx + 1, yy + 1, L - 2, ph - 2); for (var i = 0; i < 5; i++) { c.strokeStyle = shade(base, -.05 - r() * .05); c.lineWidth = 1; c.beginPath(); var gy = yy + 6 + r() * (ph - 12); c.moveTo(xx + 4, gy); c.bezierCurveTo(xx + L * .3, gy + (r() - .5) * 6, xx + L * .6, gy + (r() - .5) * 6, xx + L - 4, gy); c.stroke(); } if (r() < .3) { c.strokeStyle = shade(base, -.2); c.beginPath(); c.ellipse(xx + 20 + r() * (L - 40), yy + ph / 2, 7, 4, 0, 0, 7); c.stroke(); } xx += L; } } }); }
function herringTex(base) { return tex(512, 512, function (c, w, h) { var r = rnd(7); c.fillStyle = base; c.fillRect(0, 0, w, h); var s = 64; for (var yy = -s; yy < h + s; yy += s / 2) for (var xx = -s; xx < w + s; xx += s) { var o = ((yy / (s / 2)) % 2) * (s / 2); c.save(); c.translate(xx + o, yy); c.rotate(Math.PI / 4); c.fillStyle = shade(base, (r() - .5) * .08); c.fillRect(0, 0, s * .9, s * .3); c.strokeStyle = shade(base, -.16); c.lineWidth = 1.5; c.strokeRect(0, 0, s * .9, s * .3); c.restore(); c.save(); c.translate(xx + o + s * .64, yy); c.rotate(-Math.PI / 4 + Math.PI); c.fillStyle = shade(base, (r() - .5) * .08); c.fillRect(-s * .9, 0, s * .9, s * .3); c.strokeRect(-s * .9, 0, s * .9, s * .3); c.restore(); } }); }
function tileTex(base) { return tex(256, 256, function (c, w, h) { c.fillStyle = base; c.fillRect(0, 0, w, h); c.strokeStyle = shade(base, -.12); c.lineWidth = 4; c.strokeRect(0, 0, w, h); var gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.05)'); c.fillStyle = gr; c.fillRect(4, 4, w - 8, h - 8); }); }
function logTex(base) { return tex(256, 256, function (c, w, h) { var r = rnd(3), n = 4, ph = h / n; for (var i = 0; i < n; i++) { var gr = c.createLinearGradient(0, i * ph, 0, (i + 1) * ph); gr.addColorStop(0, shade(base, -.1)); gr.addColorStop(.3, shade(base, .07)); gr.addColorStop(.8, base); gr.addColorStop(1, shade(base, -.2)); c.fillStyle = gr; c.fillRect(0, i * ph, w, ph); for (var k = 0; k < 6; k++) { c.strokeStyle = shade(base, -.08); c.lineWidth = 1; c.beginPath(); var gy = i * ph + 8 + r() * (ph - 16); c.moveTo(0, gy); c.bezierCurveTo(w * .3, gy + (r() - .5) * 8, w * .7, gy + (r() - .5) * 8, w, gy); c.stroke(); } } }); }
function rugTex(c1, c2) { return tex(512, 320, function (c, w, h) { c.fillStyle = c1; c.fillRect(0, 0, w, h); c.strokeStyle = c2; c.lineWidth = 10; c.strokeRect(18, 18, w - 36, h - 36); c.lineWidth = 3; c.setLineDash([14, 10]); c.strokeRect(40, 40, w - 80, h - 80); c.setLineDash([]); for (var i = 0; i < 2600; i++) { c.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,255,255' : '0,0,0') + ',.05)'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }); }
function grassTex() { return tex(256, 256, function (c, w, h) { c.fillStyle = '#8FBF78'; c.fillRect(0, 0, w, h); for (var i = 0; i < 1800; i++) { c.strokeStyle = Math.random() < .5 ? '#7DB068' : '#A4D08C'; c.beginPath(); var px = Math.random() * w, py = Math.random() * h; c.moveTo(px, py); c.lineTo(px + 2, py - 6); c.stroke(); } }, 40, 40); }
function labelSprite(text, bg, fg) { var c = document.createElement('canvas'), cx = c.getContext('2d'); cx.font = '500 34px "Noto Sans KR", system-ui, sans-serif'; var w = Math.ceil(cx.measureText(text).width) + 44; c.width = w; c.height = 60; cx.font = '500 34px "Noto Sans KR", system-ui, sans-serif'; cx.fillStyle = bg || '#FFFBF3'; cx.strokeStyle = '#8A766B'; cx.lineWidth = 3; var r = 28; cx.beginPath(); cx.moveTo(r, 2); cx.arcTo(w - 2, 2, w - 2, 58, r); cx.arcTo(w - 2, 58, 2, 58, r); cx.arcTo(2, 58, 2, 2, r); cx.arcTo(2, 2, w - 2, 2, r); cx.closePath(); cx.fill(); cx.stroke(); cx.fillStyle = fg || '#4A3A32'; cx.textBaseline = 'middle'; cx.fillText(text, 22, 32); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; var s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(w / 60 * .26, .26, 1); s.renderOrder = 10; return s; }

// ---------- materials ----------
function M(color, o) { return new T.MeshStandardMaterial(Object.assign({ color: color, roughness: .8, metalness: 0 }, o || {})); }
var mWood = M('#A06E40', { roughness: .7 }), mWoodD = M('#7A4E32', { roughness: .75 }), mWoodL = M('#C08E5C', { roughness: .65 });
var mLog = new T.MeshStandardMaterial({ map: logTex('#B98A60'), roughness: .85 }), mLogTop = M('#D2A679');
var mCream = M('#FFF7EA', { roughness: .9 }), mInk = M('#4A3428', { roughness: .6 });
function box(w, h, d, mat, x, y, z, parent) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m; }
function cyl(rt, rb, h, mat, x, y, z, parent, seg) { var m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 20), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m; }
function sph(r, mat, x, y, z, parent, sx, sy, sz) { var m = new T.Mesh(new T.SphereGeometry(r, 24, 18), mat); m.position.set(x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); m.castShadow = true; (parent || scene).add(m); return m; }
function rbox(w, h, d, r, mat, x, y, z, parent) { // rounded box via extruded rounded rect (top view)
  var s = new T.Shape(), a = w / 2, b = d / 2; s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r); s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b); s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b);
  var geo = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2);
  var m = new T.Mesh(geo, mat); m.position.set(x, y - h / 2, z); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m; }

// ---------- ground, floors ----------
var ground = new T.Mesh(new T.CircleGeometry(90, 48), new T.MeshStandardMaterial({ map: grassTex(), roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set(11, -0.02, 8); ground.receiveShadow = true; scene.add(ground);
function floorRect(x0, z0, w, d, t, rep) { t.repeat.set(w / rep, d / rep); var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ map: t, roughness: .75 })); m.rotation.x = -Math.PI / 2; m.position.set(x0 + w / 2, 0, z0 + d / 2); m.receiveShadow = true; scene.add(m); return m; }
floorRect(.5, .5, 10.5, 6, woodTex('#D9AE80', 1), 4); floorRect(11, .5, 10.5, 6, woodTex('#D4A878', 2), 4);
floorRect(.5, 6.5, 21, 3, woodTex('#C99A6C', 3), 4); floorRect(.5, 9.5, 13, 6, herringTex('#DDB487'), 5); floorRect(13.5, 9.5, 8, 6, tileTex('#C9D3DC'), 1);
function rug(x, z, w, d, c1, c2, round) { var geo = round ? new T.CircleGeometry(.5, 40) : new T.PlaneGeometry(1, 1); var m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: rugTex(c1, c2), roughness: 1 })); m.material.map.wrapS = m.material.map.wrapT = T.ClampToEdgeWrapping; m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.set(x, .012, z); m.receiveShadow = true; scene.add(m); }
rug(6, 4, 8.6, 2.8, '#E8C890', '#B07A50'); rug(16.5, 3, 7.4, 3.6, '#8FBF9C', '#FBF3E2', true); rug(18.2, 13.5, 3.6, 2, '#8FBF9C', '#FBF3E2', true);

// ---------- walls (log) with windows ----------
var walls = new T.Group(); scene.add(walls); var WH = 1.25, WT = .34;
var glassMats = [];
function isW(x, y) { if (x < 0 || y < 0 || x >= GW || y >= GH || g[y][x] !== 'X') return false; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) if (walk(x + dx, y + dy)) return true; return false; }
for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) {
  if (!isW(x, y)) continue;
  var cx = x + .5, cz = y + .5, hx = isW(x - 1, y) || isW(x + 1, y), vz = isW(x, y - 1) || isW(x, y + 1);
  var outer = x === 0 || y === 0 || x === GW - 1 || y === GH - 1;
  var win = outer && ((hx && !vz && x % 3 === 2) || (vz && !hx && y % 3 === 2));
  if (hx) { var x0 = isW(x - 1, y) ? x : cx - WT / 2, x1 = isW(x + 1, y) ? x + 1 : cx + WT / 2; wallSeg((x0 + x1) / 2, cz, x1 - x0, WT, win && !vz, true); }
  if (vz) { var z0 = isW(x, y - 1) ? y : cz - WT / 2, z1 = isW(x, y + 1) ? y + 1 : cz + WT / 2; wallSeg(cx, (z0 + z1) / 2, WT, z1 - z0, win && !hx, false); }
  if ((hx && vz) || (!hx && !vz)) { var p = cyl(.24, .24, WH + .06, mLogTop, cx, (WH + .06) / 2, cz, walls, 14); }
}
function wallSeg(cx, cz, w, d, win, alongX) {
  if (!win) { var m = box(w, WH, d, mLog, cx, WH / 2, cz, walls); box(w + .02, .05, d + .04, mLogTop, cx, WH + .025, cz, walls); return; }
  box(w, .5, d, mLog, cx, .25, cz, walls); box(w, .15, d, mLog, cx, WH - .075, cz, walls); box(w + .02, .05, d + .04, mLogTop, cx, WH + .025, cz, walls);
  var gm = new T.MeshStandardMaterial({ color: '#BFE2F4', emissive: '#9CCBEA', emissiveIntensity: .5, roughness: .1, transparent: true, opacity: .75 }); glassMats.push(gm);
  box(alongX ? w : .04, .6, alongX ? .04 : d, gm, cx, .8, cz, walls).castShadow = false;
  box(alongX ? .05 : d * .5, .6, alongX ? d * .5 : .05, mWoodD, cx, .8, cz, walls); box(alongX ? w : d * .5, .05, alongX ? d * .5 : w, mWoodD, cx, .8, cz, walls);
  box(alongX ? w + .1 : d + .16, .05, alongX ? d + .16 : w + .1, mWoodL, cx, .49, cz, walls);
}

// ---------- furniture ----------
var F = new T.Group(); scene.add(F); var leds = [];
function desk(x, z, w, d, h) { h = h || .62; var G = new T.Group(); G.position.set(x, 0, z); F.add(G);
  rbox(w, .06, d, .05, mWoodL, 0, h, 0, G); box(w - .16, .08, d - .16, mWood, 0, h - .08, 0, G);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(.08, h - .1, .08, mWoodD, s[0] * (w / 2 - .1), (h - .1) / 2, s[1] * (d / 2 - .1), G); }); return G; }
function stool(x, z, col) { var G = new T.Group(); G.position.set(x, 0, z); F.add(G); cyl(.2, .2, .07, M(col, { roughness: .9 }), 0, .4, 0, G, 24); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(.025, .03, .38, mWoodD, s[0] * .11, .19, s[1] * .11, G, 8); }); }
function books(parent, x, y, z, len, alongX, seed) { var r = rnd(seed), cols = ['#E07A5F', '#F6C760', '#7FA8C9', '#9BD3A8', '#C6A6E0', '#E98FA0', '#F2A86F'], u = 0; while (u < len - .05) { var bw = .045 + r() * .04, bh = .16 + r() * .08, m = M(cols[Math.floor(r() * 7)], { roughness: .85 }); if (alongX) box(bw, bh, .13, m, x + u + bw / 2, y + bh / 2, z, parent); else box(.13, bh, bw, m, x, y + bh / 2, z + u + bw / 2, parent); u += bw + .006; } }
function mug(parent, x, y, z, col) { cyl(.045, .04, .09, M(col, { roughness: .4 }), x, y + .045, z, parent, 16); var t = new T.Mesh(new T.TorusGeometry(.03, .008, 8, 14), M(col)); t.position.set(x + .05, y + .045, z); parent.add(t); }
function paper(parent, x, y, z, rot) { var m = box(.2, .006, .15, M('#FFFBF2', { roughness: 1 }), x, y + .004, z, parent); m.rotation.y = rot || 0; m.castShadow = false; }
function laptop(parent, x, y, z, rot) { var G = new T.Group(); G.position.set(x, y, z); G.rotation.y = rot || 0; parent.add(G); box(.28, .015, .2, M('#C3CBD4', { metalness: .4, roughness: .4 }), 0, .008, 0, G); var s = box(.28, .19, .012, M('#2E3442'), 0, .1, -.1, G); s.rotation.x = -.2; var scr = box(.25, .16, .004, new T.MeshStandardMaterial({ color: '#8FD0FF', emissive: '#6FB8F0', emissiveIntensity: .9 }), 0, .1, -.092, G); scr.rotation.x = -.2; }
function plant(x, z, s, tall) { var G = new T.Group(); G.position.set(x, 0, z); G.scale.setScalar(s || 1); F.add(G);
  cyl(.2, .15, .3, M('#C77F58', { roughness: .9 }), 0, .15, 0, G, 18); cyl(.21, .21, .04, M('#D99270'), 0, .3, 0, G, 18); cyl(.17, .17, .02, M('#4A3020'), 0, .31, 0, G, 18);
  var lm = [M('#7DBB72', { roughness: .9 }), M('#94CC86', { roughness: .9 }), M('#6AA35E', { roughness: .9 })], by = .5;
  if (tall) { cyl(.025, .035, .5, M('#6E5034'), 0, .55, 0, G, 8); by = .95; }
  [[0, 0, 0, .26], [.16, -.06, .08, .19], [-.15, -.04, .1, .2], [.03, .1, -.16, .19], [-.05, .2, .02, .2], [.1, .16, .1, .15]].forEach(function (p, i) { var l = new T.Mesh(new T.IcosahedronGeometry(p[3], 1), lm[i % 3]); l.position.set(p[0], by + p[1], p[2]); l.castShadow = true; G.add(l); }); }
var lamps = [];
function floorLamp(x, z) { var G = new T.Group(); G.position.set(x, 0, z); F.add(G); cyl(.14, .16, .04, mInk, 0, .02, 0, G); cyl(.018, .018, 1.2, mInk, 0, .62, 0, G, 8); var sm = new T.MeshStandardMaterial({ color: '#FFF1CC', emissive: '#FFC870', emissiveIntensity: .6, roughness: .9, side: T.DoubleSide }); var sh = new T.Mesh(new T.CylinderGeometry(.13, .2, .26, 20, 1, true), sm); sh.position.y = 1.25; G.add(sh); var L = new T.PointLight('#FFC37A', 0, 6.5, 1.8); L.position.set(x, 1.2, z); scene.add(L); lamps.push({ L: L, m: sm, k: 1 }); }
function deskLamp(parent, x, y, z) { cyl(.05, .06, .02, mInk, x, y + .01, z, parent, 12); cyl(.01, .01, .22, mInk, x, y + .12, z, parent, 6); var sm = new T.MeshStandardMaterial({ color: '#FFF1CC', emissive: '#FFC870', emissiveIntensity: .6, side: T.DoubleSide }); var sh = new T.Mesh(new T.CylinderGeometry(.05, .09, .1, 16, 1, true), sm); sh.position.set(x, y + .26, z); parent.add(sh); var w = new T.Vector3(); parent.localToWorld(w.set(x, y + .25, z)); var L = new T.PointLight('#FFC37A', 0, 3.2, 2); L.position.copy(w); scene.add(L); lamps.push({ L: L, m: sm, k: .55 }); }
// classroom
var td = desk(5.5, 1.5, 2.6, .8); td.updateMatrixWorld(); books(td, -1.1, .65, -.2, .7, true, 4); paper(td, -.1, .65, .05, .2); mug(td, .5, .65, .1, '#F7B8C4'); deskLamp(td, 1.05, .65, -.15); stool(5.5, 2.35, '#E9A06E');
[[2.5, 3.5], [5.5, 3.5], [8.5, 3.5]].forEach(function (p, i) { var d = desk(p[0], p[1], 1.7, .7); paper(d, -.5, .65, 0, (i - 1) * .3); box(.3, .03, .22, M(['#E07A5F', '#9BD3A8', '#F6C760'][i]), .35, .665, -.05, d); cyl(.012, .012, .2, M('#F6C760'), 0, .66, .12, d, 6).rotation.z = Math.PI / 2; stool(p[0] - .4, p[1] + .85, '#E9A06E'); stool(p[0] + .4, p[1] + .85, '#E9A06E'); });
(function () { var G = new T.Group(); G.position.set(1.35, 0, 2); F.add(G); box(.36, 1.5, .05, mWoodD, 0, .75, -.95, G); box(.36, 1.5, .05, mWoodD, 0, .75, .95, G); box(.04, 1.5, 1.9, mWoodD, -.16, .75, 0, G); [.04, .5, .96, 1.46].forEach(function (yy, i) { box(.36, .04, 1.9, mWood, 0, yy, 0, G); if (i < 3) books(G, .02, yy + .02, -.88, 1.7, false, i + 9); }); })();
(function () { var G = new T.Group(); G.position.set(10.5, 0, 1.5); F.add(G); cyl(.05, .16, .5, mWoodD, 0, .25, 0, G); var gl = new T.Mesh(new T.SphereGeometry(.22, 24, 18), M('#6FAFD6', { roughness: .5 })); gl.position.y = .72; gl.castShadow = true; G.add(gl); [[.1, .1, .15], [-.12, .05, .14], [.02, -.1, .19]].forEach(function (p) { sph(.08, M('#8FCB7E'), p[0], .72 + p[1], p[2], G, 1, 1, .5); }); })();
(function () { var b = box(4.4, .8, .05, M('#3F5A4C', { roughness: .95 }), 5.5, .82, .7, F); box(4.5, .86, .03, mWoodD, 5.5, .82, .68, F); box(4.4, .04, .1, mWoodL, 5.5, .42, .76, F); })();
// meeting
var mt = desk(16.5, 3, 4.6, 1.5, .64); laptop(mt, -1.4, .67, .1, .2); laptop(mt, 1.2, .67, -.1, Math.PI + .1); paper(mt, -.3, .67, .2, .3); paper(mt, .3, .67, -.25, -.2); mug(mt, -.7, .67, -.35, '#FFFBF3'); mug(mt, .8, .67, .4, '#BFE3C8'); mug(mt, 1.9, .67, .3, '#F7B8C4');
[14.5, 15.5, 16.5, 17.5, 18.5].forEach(function (xx) { stool(xx, 1.75, '#8CB4D0'); stool(xx, 4.25, '#8CB4D0'); });
(function () { box(1.9, .8, .04, M('#FBF8F1', { roughness: .4 }), 14, .85, .7, F); box(2, .88, .03, M('#AEB7C2', { metalness: .5, roughness: .4 }), 14, .85, .68, F); ['#FFE08A', '#F7B8C4', '#BFE3C8', '#BFD9F2', '#FFE08A'].forEach(function (c, i) { var n = box(.16, .16, .01, M(c, { roughness: 1 }), 13.3 + i * .32, .95 - (i % 2) * .22, .73, F); n.rotation.z = (i % 2 ? 1 : -1) * .08; }); })();
(function () { var d = desk(20.45, 5, .7, 1.6, .62); box(.34, .1, .26, M('#C9614C', { roughness: .5 }), 0, .7, -.2, d); box(.32, .05, .08, M('#3A2A24'), 0, .77, -.28, d); paper(d, 0, .65, .4, 0); })();
// hall
(function () { var G = new T.Group(); G.position.set(10, 0, 13.5); F.add(G); rbox(3.9, .78, .7, .12, mWood, 0, .39, 0, G); rbox(4.05, .06, .84, .1, mWoodL, 0, .81, 0, G); for (var i = -4; i <= 4; i++) box(.02, .6, .02, mWoodD, i * .42, .4, .36, G); cyl(.07, .09, .04, M('#E9C25B', { metalness: .7, roughness: .3 }), -1.5, .86, 0, G); sph(.05, M('#E9C25B', { metalness: .7, roughness: .3 }), -1.5, .9, 0, G); paper(G, -.8, .84, 0, .1); books(G, -.2, .84, -.1, .5, true, 21); mug(G, .7, .84, .1, '#FFFBF3'); deskLamp(G, 1.6, .84, -.1); })();
(function () { box(2.7, .8, .05, M('#C9A06A', { roughness: 1 }), 11.5, .85, 9.74, F); box(2.8, .88, .03, mWoodD, 11.5, .85, 9.72, F); ['#FFE08A', '#F7B8C4', '#BFE3C8', '#FFFBF2', '#BFD9F2', '#FFE08A', '#FFFBF2'].forEach(function (c, i) { var n = box(.22, .26, .01, M(c, { roughness: 1 }), 10.45 + i * .36, .9 - (i % 2) * .1, 9.78, F); n.rotation.z = ((i * 37) % 5 - 2) * .04; }); })();
(function () { // fireplace on the west wall of the hall
  var G = new T.Group(); G.position.set(1.0, 0, 12.5); F.add(G); var st = M('#A89C92', { roughness: 1 }); box(.5, 1.25, 1.7, st, 0, .625, 0, G); box(.6, .08, 1.9, M('#8A7E74'), .02, 1.0, 0, G); box(.3, .55, .9, M('#2A1E18'), .14, .3, 0, G);
  cyl(.05, .05, .7, mWoodD, .3, .08, 0, G, 8).rotation.x = Math.PI / 2; cyl(.05, .05, .6, mWoodD, .32, .16, .05, G, 8).rotation.x = Math.PI / 2 + .3;
  var fm = new T.MeshBasicMaterial({ color: '#FFB347' }); G.userData.fl = [sph(.12, fm, .32, .28, -.1, G, 1, 1.8, 1), sph(.1, new T.MeshBasicMaterial({ color: '#FFE08A' }), .32, .26, .08, G, 1, 1.6, 1), sph(.08, fm, .32, .24, .2, G, 1, 1.5, 1)]; G.userData.fl.forEach(function (f) { f.castShadow = false; });
  var L = new T.PointLight('#FF9A4B', 1.2, 7, 1.6); L.position.set(1.5, .5, 12.5); L.castShadow = true; L.shadow.mapSize.set(512, 512); scene.add(L); fire = { G: G, L: L }; })();
var fire;
floorLamp(12.2, 10.6); floorLamp(1.5, 8.2); floorLamp(20.4, 7.6);
// server
[15.5, 17.5, 19.5].forEach(function (xx, i) { var G = new T.Group(); G.position.set(xx, 0, 11); F.add(G); rbox(.8, 1.9, 1.7, .04, M('#3E4452', { metalness: .5, roughness: .45 }), 0, .95, 0, G); for (var k = 0; k < 9; k++) { box(.03, .12, 1.5, M('#535C6E', { metalness: .4, roughness: .5 }), -.4, .25 + k * .19, 0, G).castShadow = false; var led = new T.Mesh(new T.SphereGeometry(.018, 8, 6), new T.MeshBasicMaterial({ color: ['#7CD992', '#F6C760', '#7CD992', '#8FD0E8'][(k + i) % 4] })); led.position.set(-.425, .25 + k * .19, -.6 + ((k * 3 + i) % 5) * .08); G.add(led); leds.push(led); } });
(function () { var d = desk(15, 14.45, 1.8, .7); [-.4, .4].forEach(function (o) { box(.1, .02, .1, mInk, o, .66, -.15, d); box(.02, .12, .02, mInk, o, .72, -.15, d); box(.6, .36, .02, mInk, o, .94, -.16, d); var sc = box(.56, .32, .005, new T.MeshStandardMaterial({ color: '#8FD0FF', emissive: '#5FA8F0', emissiveIntensity: 1 }), o, .94, -.147, d); sc.castShadow = false; }); box(.5, .02, .16, M('#E9E4DC'), 0, .66, .12, d); box(.07, .025, .11, M('#E9E4DC'), .4, .66, .14, d); mug(d, -.7, .65, .15, '#FFFBF3'); sph(.05, M('#F6CF4A'), .72, .7, .1, d, 1, .9, 1.1); stool(15, 13.75, '#9BD3A8'); var L = new T.PointLight('#8FD0FF', .5, 3, 2); L.position.set(15, 1.1, 14.2); scene.add(L); })();
(function () { var G = new T.Group(); G.position.set(20.5, 0, 14.5); F.add(G); cyl(.1, .1, .42, M('#D9493E', { roughness: .4 }), 0, .24, 0, G); sph(.1, M('#D9493E', { roughness: .4 }), 0, .45, 0, G); cyl(.03, .03, .08, mInk, 0, .56, 0, G); box(.12, .02, .03, mInk, .05, .6, 0, G); })();
(function () { var bb = sph(.42, M('#E9A06E', { roughness: 1 }), 18.2, .26, 13.5, F, 1.1, .62, 1.1); })();
plant(12.5, 1.5, 1, true); plant(20.5, 1.5, 1.1, false); plant(1.5, 7.5, 1.1, true); plant(20.5, 7.5, 1, false); plant(14.5, 10.5, 1, true); plant(1.5, 14.4, 1.2, false);

// ---------- outside: trees, path, lanterns ----------
(function () { var r = rnd(11), tm = [M('#5C8E55', { roughness: 1 }), M('#6FA866', { roughness: 1 }), M('#4E7E4A', { roughness: 1 })];
  for (var i = 0; i < 70; i++) { var a = r() * Math.PI * 2, d = 14 + r() * 26, tx = 11 + Math.cos(a) * d * 1.25, tz = 8 + Math.sin(a) * d; if (tx > -2 && tx < 24 && tz > -2 && tz < 18) continue; var s = .8 + r() * 1.2, G = new T.Group(); G.position.set(tx, 0, tz); G.scale.setScalar(s); scene.add(G); cyl(.12, .16, .9, M('#7A5638'), 0, .45, 0, G, 8); var k = Math.floor(r() * 3); if (r() < .5) { var c1 = new T.Mesh(new T.ConeGeometry(.8, 1.4, 10), tm[k]); c1.position.y = 1.4; c1.castShadow = true; G.add(c1); var c2 = new T.Mesh(new T.ConeGeometry(.6, 1.1, 10), tm[(k + 1) % 3]); c2.position.y = 2.1; c2.castShadow = true; G.add(c2); } else { [[0, 1.5, 0, .8], [.4, 1.3, .2, .55], [-.4, 1.35, -.1, .6]].forEach(function (p) { var l = new T.Mesh(new T.IcosahedronGeometry(p[3], 1), tm[(k + (p[0] > 0 ? 1 : 0)) % 3]); l.position.set(p[0], p[1], p[2]); l.castShadow = true; G.add(l); }); } }
  var pm = new T.Mesh(new T.PlaneGeometry(2.2, 9), M('#D9BE94', { roughness: 1 })); pm.rotation.x = -Math.PI / 2; pm.position.set(7, 0.0, 20); pm.receiveShadow = true; scene.add(pm);
})();

// ---------- characters: hood mochi in 3D ----------
function mochi(look, name) {
  var G = new T.Group(), body = new T.Group(); G.add(body);
  var hood = M(look.tc, { roughness: .95 }), skin = M(look.skin || '#FFF7EA', { roughness: .9 }), hair = M(look.hc, { roughness: .8 });
  var pts = []; for (var i = 0; i <= 20; i++) { var t = i / 20, a = t * Math.PI; pts.push(new T.Vector2(Math.sin(a) * (.30 + .05 * (1 - t)) * (t < .12 ? t / .12 * .9 + .1 : 1), .08 + (1 - Math.cos(a)) * .36)); }
  var b = new T.Mesh(new T.LatheGeometry(pts, 32), hood); b.castShadow = true; body.add(b);
  [-1, 1].forEach(function (s) { var e = new T.Mesh(new T.CapsuleGeometry(.045, .09, 6, 12), hood); e.position.set(s * .13, .82, 0); e.rotation.z = -s * .15; e.castShadow = true; body.add(e); var ft = sph(.085, mCream, s * .12, .05, .04, G, 1, .6, 1.25); G.userData[s < 0 ? 'fl' : 'fr'] = ft; });
  var face = sph(.225, skin, 0, .5, .2, body, 1, .92, .72);
  var fr = new T.Mesh(new T.SphereGeometry(.232, 24, 12, 0, Math.PI * 2, 0, Math.PI * .36), hair); fr.position.set(0, .5, .195); fr.scale.set(1, .93, .76); fr.rotation.x = -.25; body.add(fr);
  [-1, 1].forEach(function (s) { sph(.026, mInk, s * .085, .5, .355, body, 1, 1.35, .6); var hl = sph(.009, new T.MeshBasicMaterial({ color: '#fff' }), s * .085 + .008, .512, .372, body); hl.castShadow = false; var bl = sph(.04, new T.MeshBasicMaterial({ color: '#F7AEB8', transparent: true, opacity: .75 }), s * .15, .43, .325, body, 1, .6, .3); bl.castShadow = false; var hd = sph(.05, mCream, s * .17, .3, .3, body); });
  var mo = sph(.03, M('#E9858F'), 0, .42, .352, body, 1.1, .8, .5);
  if (look.glasses) [-1, 1].forEach(function (s) { var t = new T.Mesh(new T.TorusGeometry(.05, .008, 8, 20), mInk); t.position.set(s * .085, .5, .365); body.add(t); });
  if (look.item === 'book') { var bk = box(.2, .13, .03, M('#F7C9A8'), 0, .28, .34, body); bk.rotation.x = -.3; }
  if (look.item === 'laptop') { var lp = box(.24, .15, .02, M('#C3CBD4', { metalness: .4, roughness: .4 }), 0, .28, .34, body); lp.rotation.x = -.3; }
  var lab = labelSprite(name, look.me ? '#4A3A32' : '#FFFBF3', look.me ? '#FFFBF3' : '#4A3A32'); lab.position.y = 1.08; G.add(lab);
  G.userData.body = body; scene.add(G); return G;
}
var me = mochi({ tc: '#F7C9C9', hc: '#A0674A', item: 'book', me: true }, '나');
var dev = mochi({ tc: '#BFD9F2', hc: '#3B3236', item: 'laptop', glasses: true }, '개발자 1');
var P = { x: +(Q.get('px') || 7.5), z: +(Q.get('pz') || 2.6), dir: 0, walk: 0 };
var D = { x: 16.5, z: 13.2, dir: Math.PI, tx: 16.5, tz: 13.2, wait: 0, walk: 0 };

// ---------- lights, sky, day/night ----------
var hemi = new T.HemisphereLight('#FFFFFF', '#8A6A4A', .7); scene.add(hemi);
var sun = new T.DirectionalLight('#FFF1D6', 1.1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 13; sc.bottom = -13; sc.near = 1; sc.far = 60; sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.target.position.set(11, 0, 8); scene.add(sun, sun.target);
var stars = (function () { var n = 900, pos = new Float32Array(n * 3), r = rnd(5); for (var i = 0; i < n; i++) { var a = r() * Math.PI * 2, e = r() * Math.PI * .48 + .06, d = 150; pos[i * 3] = 11 + Math.cos(a) * Math.cos(e) * d; pos[i * 3 + 1] = Math.sin(e) * d; pos[i * 3 + 2] = 8 + Math.sin(a) * Math.cos(e) * d; } var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); var p = new T.Points(geo, new T.PointsMaterial({ color: '#FFF6D6', size: 1.1, sizeAttenuation: true, transparent: true, fog: false })); scene.add(p); return p; })();
var orb = new T.Mesh(new T.SphereGeometry(5, 24, 18), new T.MeshBasicMaterial({ color: '#FFF4CC', fog: false })); scene.add(orb);
var night = false;
function seoulHour() { return new Date(Date.now() + 9 * 3600000).getUTCHours(); }
function setTod(n) {
  night = n;
  var sky = new T.Color(n ? '#141a36' : '#A9D6F0'); scene.background = sky; scene.fog = new T.Fog(n ? '#1a2040' : '#CFE8F4', 40, 130);
  hemi.intensity = n ? .16 : .5; hemi.color.set(n ? '#7F8FD0' : '#FFFFFF'); hemi.groundColor.set(n ? '#2A2030' : '#8A6A4A');
  sun.intensity = n ? .22 : .95; sun.color.set(n ? '#A9B8F0' : '#FFF1D6'); sun.position.set(n ? 22 : 2, n ? 26 : 30, n ? -6 : 22);
  orb.position.set(n ? 60 : -50, n ? 70 : 90, n ? -110 : 120); orb.material.color.set(n ? '#FFF4CC' : '#FFE9A0'); stars.visible = n;
  lamps.forEach(function (l) { l.L.intensity = (n ? 1.5 : .25) * l.k; l.m.emissiveIntensity = n ? 1.4 : .5; });
  glassMats.forEach(function (m) { m.color.set(n ? '#2F3E6A' : '#BFE2F4'); m.emissive.set(n ? '#1C2850' : '#9CCBEA'); m.emissiveIntensity = n ? .5 : .45; });
  if (fire) fire.L.intensity = n ? 1.8 : .7;
  R.toneMappingExposure = n ? 1.2 : .7; ground.material.color.set(n ? '#5A6E78' : '#FFFFFF');
}
setTod(Q.get('tod') ? Q.get('tod') === 'night' : (seoulHour() < 6 || seoulHour() >= 18));

// ---------- input ----------
var keys = {}, yaw = +(Q.get('yaw') || .6), pitch = +(Q.get('pitch') || .86), dist = +(Q.get('dist') || 8.5), fp = Q.get('fp') === '1', drag = null;
canvas.addEventListener('keydown', function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault(); if (k === 'v') setFp(!fp); if (k === 'Enter' && nearObj) toast(nearObj.n + ' — 여기서 기능 창이 열려요 (시안)'); });
canvas.addEventListener('keyup', function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; });
canvas.addEventListener('blur', function () { keys = {}; });
canvas.addEventListener('pointerdown', function (e) { canvas.focus(); drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', function (e) { if (!drag) return; yaw -= (e.clientX - drag.x) * .006; pitch = Math.max(fp ? -.5 : .3, Math.min(fp ? .5 : 1.35, pitch + (e.clientY - drag.y) * .004 * (fp ? -1 : 1))); drag = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', function () { drag = null; });
canvas.addEventListener('wheel', function (e) { e.preventDefault(); dist = Math.max(3.5, Math.min(18, dist + e.deltaY * .01)); }, { passive: false });
var bView = document.getElementById('bView');
function setFp(v) { fp = v; pitch = v ? 0 : .86; bView.setAttribute('aria-pressed', v ? 'true' : 'false'); bView.textContent = v ? '따라가기 시점으로' : '1인칭으로 보기'; me.visible = !v; canvas.focus(); }
bView.addEventListener('click', function () { setFp(!fp); });
document.getElementById('bTod').addEventListener('click', function () { setTod(!night); canvas.focus(); });
var toastT; function toast(t) { var el = document.getElementById('toast'); el.textContent = t; el.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(function () { el.style.display = 'none'; }, 2200); }
if (fp) setFp(true);

// ---------- movement with collision ----------
function free(x, z) { var r = .27; for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { var tx = Math.floor(x) + dx, tz = Math.floor(z) + dz; if (open(tx, tz)) continue; var nx = Math.max(tx, Math.min(x, tx + 1)), nz = Math.max(tz, Math.min(z, tz + 1)); if ((x - nx) * (x - nx) + (z - nz) * (z - nz) < r * r) return false; } return true; }
function stepChar(c, vx, vz, dt) { var sp = Math.hypot(vx, vz); if (sp < .001) { c.walk = Math.max(0, c.walk - dt * 6); return; } var nx = c.x + vx * dt, nz = c.z + vz * dt; if (free(nx, c.z)) c.x = nx; if (free(c.x, nz)) c.z = nz; var td = Math.atan2(vx, vz), dd = ((td - c.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI; c.dir += dd * Math.min(1, dt * 12); c.walk = Math.min(1, c.walk + dt * 6); }
function pose(G, c, t) { G.position.set(c.x, Math.abs(Math.sin(t * 9)) * .035 * c.walk, c.z); G.rotation.y = c.dir; var b = G.userData.body; b.rotation.z = Math.sin(t * 9) * .06 * c.walk; b.scale.y = 1 + Math.sin(t * 2.2) * .012; G.userData.fl.position.z = .04 + Math.sin(t * 9) * .07 * c.walk; G.userData.fr.position.z = .04 - Math.sin(t * 9) * .07 * c.walk; }

// ---------- minimap ----------
var mini = document.getElementById('mini').getContext('2d');
function drawMini() { var s = 16; mini.clearRect(0, 0, 352, 256); var col = { C: '#F3DDB8', M: '#DDEBD3', H: '#EAD5B6', L: '#F6E3C5', S: '#D9E3EA', D: '#EAD5B6' }; for (var yy = 0; yy < GH; yy++) for (var xx = 0; xx < GW; xx++) { var v = g[yy][xx]; mini.fillStyle = v === 'X' ? (isW(xx, yy) ? '#8A6446' : 'rgba(0,0,0,0)') : (B[xx + ',' + yy] ? '#C9A27C' : col[v]); mini.fillRect(xx * s, yy * s, s, s); } mini.fillStyle = '#7FA8C9'; mini.beginPath(); mini.arc(D.x * s, D.z * s, 5, 0, 7); mini.fill(); mini.fillStyle = '#E36B7C'; mini.beginPath(); mini.arc(P.x * s, P.z * s, 6, 0, 7); mini.fill(); mini.strokeStyle = '#E36B7C'; mini.lineWidth = 2; mini.beginPath(); mini.moveTo(P.x * s, P.z * s); mini.lineTo(P.x * s - Math.sin(yaw) * 14, P.z * s - Math.cos(yaw) * 14); mini.stroke(); }

// ---------- loop ----------
var nearObj = null, nearEl = document.getElementById('near'), roomEl = document.getElementById('room'), clockEl = document.getElementById('clock'), last = performance.now(), camPos = new T.Vector3(), camTgt = new T.Vector3(P.x, .6, P.z), frame = 0;
function tick(now) {
  var dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now; frame++;
  if (keys.q) yaw += dt * 1.8; if (keys.e) yaw -= dt * 1.8;
  var f = (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0), sd = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0);
  if (fp && !keys.a && !keys.d) { yaw -= sd * dt * 2.2; sd = 0; }
  var fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), vx = fx * f + rx * sd, vz = fz * f + rz * sd, L = Math.hypot(vx, vz) || 1;
  stepChar(P, vx / L * 2.6 * (f || sd ? 1 : 0), vz / L * 2.6 * (f || sd ? 1 : 0), dt); pose(me, P, t);
  D.wait -= dt; var ddx = D.tx - D.x, ddz = D.tz - D.z, dl = Math.hypot(ddx, ddz);
  if (dl < .1) { if (D.wait < -1) { var tries = 0; do { D.tx = 14.5 + Math.random() * 6; D.tz = 12.2 + Math.random() * 2; } while (!open(Math.floor(D.tx), Math.floor(D.tz)) && ++tries < 20); D.wait = 2 + Math.random() * 4; } stepChar(D, 0, 0, dt); } else if (D.wait < 0) stepChar(D, ddx / dl * 1.2, ddz / dl * 1.2, dt); else stepChar(D, 0, 0, dt);
  pose(dev, D, t + 1.3);
  walls.scale.y += ((fp ? 2.3 : 1) - walls.scale.y) * Math.min(1, dt * 6);
  if (fp) { camPos.set(P.x, .72 + Math.abs(Math.sin(t * 9)) * .02 * P.walk, P.z); cam.position.lerp(camPos, Math.min(1, dt * 14)); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0); cam.fov = 68; }
  else { camTgt.lerp(new T.Vector3(P.x, .55, P.z), Math.min(1, dt * 8)); camPos.set(camTgt.x + Math.sin(yaw) * Math.cos(pitch) * dist, camTgt.y + Math.sin(pitch) * dist, camTgt.z + Math.cos(yaw) * Math.cos(pitch) * dist); cam.position.lerp(camPos, Math.min(1, dt * 10)); cam.lookAt(camTgt); cam.fov = 46; }
  cam.updateProjectionMatrix();
  if (fire) { fire.L.intensity = (night ? 1.8 : .7) * (0.85 + Math.sin(t * 11) * .08 + Math.sin(t * 23) * .06); fire.G.userData.fl.forEach(function (fl, i) { fl.scale.y = 1.5 + Math.sin(t * (9 + i * 3) + i) * .35; }); }
  leds.forEach(function (l, i) { l.visible = Math.sin(t * (2 + (i % 5)) + i) > -.6; });
  if (frame % 6 === 0) {
    var best = null, bd = 1.7; OBJ.forEach(function (o) { var d = Math.hypot(o.x - P.x, o.z - P.z); if (d < bd) { bd = d; best = o; } }); nearObj = best;
    nearEl.style.display = best ? 'block' : 'none'; if (best) nearEl.textContent = 'Enter · ' + best.n;
    roomEl.textContent = ZONE[g[Math.floor(P.z)][Math.floor(P.x)]] || ''; var kd = new Date(Date.now() + 9 * 3600000); clockEl.textContent = '서울 ' + ('0' + kd.getUTCHours()).slice(-2) + ':' + ('0' + kd.getUTCMinutes()).slice(-2) + (night ? ' · 밤' : ' · 낮'); drawMini();
  }
  R.render(scene, cam); requestAnimationFrame(tick);
}
cam.position.set(P.x + Math.sin(yaw) * 6, 6, P.z + Math.cos(yaw) * 6); pose(me, P, 0);
requestAnimationFrame(tick); canvas.focus();
})();
