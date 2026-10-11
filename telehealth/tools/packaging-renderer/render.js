import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DISPLAY = '"Bodoni Moda", serif';
const MONO = '"IBM Plex Mono", monospace';
const SANS = '"Hanken Grotesk", sans-serif';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
document.body.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* ---------- helpers ---------- */
const mute = (hex, l, sat = 0.7) => {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * sat, Math.max(0, hsl.l + l)); return '#' + c.getHexString();
};
const tint = (hex, amt) => {
  const c = new THREE.Color(hex);
  const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amt)));
  return '#' + c.getHexString();
};

function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function spaced(g, text, x, y, spacing, align = 'center') {
  const chars = [...text];
  const widths = chars.map(c => g.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  g.textAlign = 'left';
  chars.forEach((c, i) => { g.fillText(c, cx, y); cx += widths[i] + spacing; });
}

// smooth lathe from [r, y] control points
function lathe(points, segs = 128) {
  const v = points.map(([r, y]) => new THREE.Vector2(r, y));
  const curve = new THREE.SplineCurve(v);
  const pts = curve.getPoints(points.length * 12);
  const geo = new THREE.LatheGeometry(pts, segs);
  geo.computeVertexNormals();
  return geo;
}
// lathe with rounded corners built from a polyline of [r,y] with fillet radius
function roundedLathe(poly, fillet = 0.04, segs = 128) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = new THREE.Vector2(...poly[i]);
    if (i === 0 || i === poly.length - 1) { out.push(p); continue; }
    const a = new THREE.Vector2(...poly[i - 1]), b = new THREE.Vector2(...poly[i + 1]);
    const da = a.clone().sub(p), db = b.clone().sub(p);
    const fa = Math.min(fillet, da.length() / 2), fb = Math.min(fillet, db.length() / 2);
    const p0 = p.clone().add(da.normalize().multiplyScalar(fa));
    const p2 = p.clone().add(db.normalize().multiplyScalar(fb));
    for (let t = 0; t <= 1.0001; t += 1 / 8) {
      const q = p0.clone().multiplyScalar((1 - t) ** 2)
        .add(p.clone().multiplyScalar(2 * (1 - t) * t))
        .add(p2.clone().multiplyScalar(t * t));
      out.push(q);
    }
  }
  const geo = new THREE.LatheGeometry(out, segs);
  geo.computeVertexNormals();
  return geo;
}

const M = {
  amber: () => new THREE.MeshPhysicalMaterial({ color: '#7a3a0e', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, transmission: 0.45, thickness: 1.2, ior: 1.5, attenuationColor: '#4a1f05', attenuationDistance: 0.5 }),
  inkGlass: () => new THREE.MeshPhysicalMaterial({ color: '#16302a', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, transmission: 0.3, thickness: 1, ior: 1.5, attenuationColor: '#0c1f1a', attenuationDistance: 0.4 }),
  frost: (c = '#efefea') => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.35 }),
  matte: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }),
  satin: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  brass: () => new THREE.MeshStandardMaterial({ color: '#c09a5b', metalness: 1, roughness: 0.26 }),
  rubber: () => new THREE.MeshStandardMaterial({ color: '#1b1d1c', roughness: 0.7 }),
  paper: (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.62 }),
  printed: (map) => new THREE.MeshPhysicalMaterial({ map, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
};

function shadowAll(obj) { obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return obj; }

/* ---------- label artwork ---------- */
// p: {bg, fg, accent, name, sub, strength, qty, rx, cat}
function labelArt(g, w, h, p, opts = {}) {
  const cx = w / 2;
  const s = h / 1000;
  g.fillStyle = p.bg; g.fillRect(0, 0, w, h);
  // paper grain
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${p.dark ? '255,255,255' : '0,0,0'},${Math.random() * 0.025})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  g.fillStyle = p.fg;
  g.font = `600 ${78 * s}px ${DISPLAY}`;
  spaced(g, 'AUMBRY', cx, 150 * s, 30 * s);
  g.fillStyle = p.accent;
  g.fillRect(cx - 70 * s, 200 * s, 140 * s, 3 * s);
  g.fillStyle = p.fg;
  const nameSize = (opts.nameSize || 132) * s;
  g.font = `italic 400 ${nameSize}px ${DISPLAY}`;
  g.textAlign = 'center';
  let ny = 380 * s;
  (p.nameLines || [p.name]).forEach((ln, i) => { g.fillText(ln, cx, ny + i * nameSize * 1.02); });
  ny += ((p.nameLines || [p.name]).length - 1) * nameSize * 1.02;
  g.font = `400 ${40 * s}px ${MONO}`;
  g.globalAlpha = 0.86;
  if (p.strength) spaced(g, p.strength.toUpperCase(), cx, ny + 110 * s, 4 * s);
  if (p.qty) spaced(g, p.qty.toUpperCase(), cx, ny + 170 * s, 4 * s);
  g.globalAlpha = 1;
  // bottom band
  if (p.rx) {
    g.strokeStyle = p.fg; g.lineWidth = 3 * s;
    const bx = cx - 250 * s, by = h - 200 * s;
    g.strokeRect(bx, by, 500 * s, 84 * s);
    g.font = `400 ${32 * s}px ${MONO}`;
    spaced(g, 'PRESCRIPTION ONLY', cx, by + 55 * s, 5 * s);
  } else if (p.cat) {
    g.font = `500 ${34 * s}px ${SANS}`;
    spaced(g, p.cat.toUpperCase(), cx, h - 130 * s, 10 * s);
  }
  g.font = `400 ${24 * s}px ${MONO}`;
  g.globalAlpha = 0.6;
  spaced(g, opts.lot || 'LOT 26-0917  ·  EXP 09/2028', cx, h - 50 * s, 3 * s);
  g.globalAlpha = 1;
}

// label fitting a cylinder segment: draw art in centre; edges get a soft rule
function wrapLabel(p, aspect, opts) {
  const H = 1100, W = Math.round(H * aspect);
  return canvasTex(W, H, (g, w, h) => {
    g.fillStyle = p.bg; g.fillRect(0, 0, w, h);
    const inner = Math.min(w, h * (opts?.innerAspect || 0.95));
    g.save(); g.translate((w - inner) / 2, 0);
    labelArt(g, inner, h, p, opts);
    g.restore();
    // full-width paper grain
  });
}

function labelSleeve(r, h, theta, p, opts = {}) {
  const aspect = (r * theta) / h;
  const tex = wrapLabel(p, aspect, opts);
  const geo = new THREE.CylinderGeometry(r, r, h, 128, 1, true, -theta / 2, theta);
  const mat = opts.printed ? M.printed(tex) : M.paper(tex);
  const m = new THREE.Mesh(geo, mat);
  return m;
}

/* ---------- product models ---------- */
function pillBottle(p) {
  const g = new THREE.Group();
  const R = 0.62;
  g.add(new THREE.Mesh(roundedLathe([[0, 0], [R, 0], [R, 1.6], [0.44, 1.84], [0.44, 2.0], [0, 2.0]], 0.07), M.amber()));
  const cap = new THREE.Mesh(roundedLathe([[0, 1.86], [0.5, 1.86], [0.5, 2.3], [0, 2.3]], 0.035), p.cap === 'white' ? M.satin('#ecebe5') : M.matte(p.capColor || '#17221e'));
  g.add(cap);
  // ribs
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.36, 0.018), cap.material);
    rib.position.set(Math.sin(a) * 0.505, 2.06, Math.cos(a) * 0.505);
    rib.rotation.y = a;
    g.add(rib);
  }
  const lab = labelSleeve(R + 0.004, 1.12, 3.5, { ...p.label, bg: '#f4f3ee', fg: '#18211e' }, { innerAspect: 0.92, nameSize: p.nameSize || 112 });
  lab.position.y = 0.82;
  g.add(lab);
  return g;
}

function dropper(p) {
  const g = new THREE.Group();
  const R = 0.5;
  g.add(new THREE.Mesh(roundedLathe([[0, 0], [R, 0], [R, 1.3], [0.19, 1.55], [0.19, 1.66], [0, 1.66]], 0.08), p.glass === 'amber' ? M.amber() : M.inkGlass()));
  g.add(new THREE.Mesh(roundedLathe([[0, 1.6], [0.25, 1.6], [0.25, 1.86], [0, 1.86]], 0.02), M.brass()));
  g.add(new THREE.Mesh(lathe([[0.001, 2.55], [0.12, 2.52], [0.17, 2.4], [0.165, 2.18], [0.14, 2.02], [0.2, 1.95], [0.2, 1.86], [0.001, 1.86]]), M.rubber()));
  const lab = labelSleeve(R + 0.004, 0.98, 3.4, p.label, { innerAspect: 0.9, nameSize: p.nameSize || 104 });
  lab.position.y = 0.68;
  g.add(lab);
  return g;
}

function pump(p) {
  const g = new THREE.Group();
  const R = 0.5, H = 2.2;
  const body = new THREE.Mesh(roundedLathe([[0, 0], [R, 0], [R, H], [0.22, H + 0.02], [0, H + 0.02]], 0.12), M.frost(p.body || '#eeeeea'));
  g.add(body);
  g.add(new THREE.Mesh(roundedLathe([[0, H - 0.02], [0.3, H - 0.02], [0.3, H + 0.2], [0, H + 0.2]], 0.02), M.brass()));
  g.add(new THREE.Mesh(roundedLathe([[0, H + 0.2], [0.11, H + 0.2], [0.11, H + 0.42], [0, H + 0.42]], 0.02), M.satin(p.headColor || '#17221e')));
  const head = new THREE.Mesh(roundedLathe([[0, H + 0.42], [0.27, H + 0.42], [0.27, H + 0.62], [0, H + 0.62]], 0.05), M.satin(p.headColor || '#17221e'));
  g.add(head);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.34, 32), M.satin(p.headColor || '#17221e'));
  nozzle.rotation.x = Math.PI / 2; nozzle.position.set(0, H + 0.54, 0.38);
  g.add(nozzle);
  const lab = labelSleeve(R + 0.003, 1.35, 3.3, { ...p.label, bg: p.body || '#eeeeea' }, { innerAspect: 0.9, printed: true, nameSize: p.nameSize || 110 });
  lab.position.y = 0.95;
  g.add(lab);
  return g;
}

function jar(p) {
  const g = new THREE.Group();
  const R = p.r || 0.95, H = p.h || 0.9;
  g.add(new THREE.Mesh(roundedLathe([[0, 0], [R, 0], [R, H], [R - 0.06, H + 0.02], [0, H + 0.02]], 0.06), p.glass ? M.inkGlass() : M.frost(p.body || '#efefea')));
  const lid = new THREE.Mesh(roundedLathe([[0, H], [R + 0.02, H], [R + 0.02, H + (p.lidH || 0.42)], [0, H + (p.lidH || 0.42)]], 0.05), p.lid === 'brass' ? M.brass() : M.satin(p.lidColor || '#17221e'));
  g.add(lid);
  const lab = labelSleeve(R + 0.004, H * 0.86, 2.6, { ...p.label }, { innerAspect: 0.95, printed: !!p.printed, nameSize: p.nameSize || 100 });
  lab.position.y = H * 0.48;
  g.add(lab);
  return g;
}

function tube(p) {
  const g = new THREE.Group();
  const R = 0.44, L = 2.5, base = 0.42;
  g.add(new THREE.Mesh(roundedLathe([[0, 0], [0.32, 0], [0.32, 0.36], [0, 0.36]], 0.04), M.satin(p.capColor || '#17221e')));
  g.add(new THREE.Mesh(lathe([[0.001, 0.34], [0.2, 0.35], [0.36, 0.38], [0.43, base], [0.44, base + 0.02]]), M.frost(p.body)));
  const tex = canvasTex(1400, 1500, (gg, w, h) => {
    gg.fillStyle = p.body; gg.fillRect(0, 0, w, h);
    gg.save(); gg.translate(w * 0.25, h * 0.05);
    labelArt(gg, w * 0.5, h * 0.62, { ...p.label, bg: p.body }, { nameSize: p.nameSize || 108 });
    gg.restore();
    gg.fillStyle = p.label.accent; gg.fillRect(0, h * 0.8, w, h * 0.012);
  });
  // repaint background under art (labelArt draws a full rect) handled by same colour
  const geo = new THREE.CylinderGeometry(R, R, L, 128, 60, true, Math.PI, Math.PI * 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + L / 2; // 0..L
    const t = y / L;
    const f = THREE.MathUtils.smoothstep(t, 0.15, 1.0);
    pos.setX(i, pos.getX(i) * (1 + 0.42 * f));
    pos.setZ(i, pos.getZ(i) * (1 - 0.94 * f));
    pos.setY(i, y + base);
  }
  // flip v so artwork reads from cap upward? keep: top of canvas -> top of tube
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, M.printed(tex)));
  const crimp = new THREE.Mesh(new THREE.BoxGeometry(R * 2 * 1.44, 0.2, 0.05), M.frost(p.body));
  crimp.position.y = base + L + 0.08;
  g.add(crimp);
  return g;
}

function carton(p) {
  const w = p.w || 1.5, h = p.h || 2.3, d = p.d || 0.6;
  const front = canvasTex(1000, Math.round(1000 * h / w), (g, W, H) => {
    labelArt(g, W, H, p.label, { nameSize: p.nameSize || 118 });
  });
  const side = canvasTex(400, Math.round(400 * h / d), (g, W, H) => {
    g.fillStyle = p.label.bg; g.fillRect(0, 0, W, H);
    g.fillStyle = p.label.accent; g.fillRect(0, H * 0.82, W, H * 0.012);
    g.save(); g.translate(W / 2, H / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = p.label.fg; g.font = `600 ${W * 0.16}px ${DISPLAY}`;
    spaced(g, 'AUMBRY', 0, W * 0.06, W * 0.06);
    g.restore();
  });
  const top = canvasTex(400, Math.round(400 * d / w), (g, W, H) => { g.fillStyle = p.label.bg; g.fillRect(0, 0, W, H); });
  const mats = [M.paper(side), M.paper(side), M.paper(top), M.paper(top), M.paper(front), M.paper(side)];
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.y = h / 2;
  const g = new THREE.Group(); g.add(m);
  return g;
}

function pen(p) {
  const g = new THREE.Group();
  const r = 0.17;
  const btn = new THREE.Mesh(roundedLathe([[0, -0.2], [0.11, -0.2], [0.11, 0.02], [0, 0.02]], 0.03), M.satin(p.doseColor));
  g.add(btn);
  const tex = canvasTex(1600, 500, (gg, w, h) => {
    gg.fillStyle = '#f2f2ee'; gg.fillRect(0, 0, w, h);
    gg.fillStyle = p.doseColor; gg.fillRect(0, 0, w * 0.1, h);
    gg.fillStyle = '#17221e';
    gg.font = `600 ${h * 0.12}px ${DISPLAY}`; spaced(gg, 'AUMBRY', w * 0.265, h * 0.6, h * 0.035);
    gg.fillStyle = p.doseColor; gg.fillRect(w * 0.415, h * 0.5, 2, h * 0.14); gg.fillStyle = '#17221e';
    gg.font = `italic 400 ${h * 0.15}px ${DISPLAY}`; gg.textAlign = 'left'; gg.fillText(p.label.name.toLowerCase(), w * 0.44, h * 0.6);
    gg.font = `400 ${h * 0.065}px ${MONO}`; spaced(gg, p.label.strength.toUpperCase(), w * 0.44, h * 0.74, h * 0.01, 'left');
    // window
    gg.fillStyle = 'rgba(23,34,30,0.08)'; gg.fillRect(w * 0.12, h * 0.42, w * 0.14, h * 0.16);
  });
  tex.rotation = 0;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.4, 96, 1, true, Math.PI, Math.PI * 2), M.printed(tex));
  // map texture u around circumference, v along length: rotate uv so text runs along pen
  const uv = body.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, 1 - v, u); }
  body.position.y = 1.2;
  g.add(body);
  g.add(new THREE.Mesh(roundedLathe([[0, 0], [r, 0], [r, 0.02], [0, 0.02]], 0.01), M.satin('#f2f2ee')));
  const cap = new THREE.Mesh(roundedLathe([[0, 2.3], [r + 0.012, 2.3], [r + 0.012, 3.35], [0.12, 3.45], [0, 3.46]], 0.05), M.satin(p.capColor || '#2e5b4f'));
  g.add(cap);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.62, 0.04), M.brass());
  clip.position.set(0, 2.9, r + 0.04);
  g.add(clip);
  return g;
}

function kitBox(p) { return carton({ ...p, w: p.w || 2.0, h: p.h || 2.5, d: p.d || 0.8 }); }

function mailer(p) {
  const w = 3.0, h = 0.75, d = 2.1;
  const top = canvasTex(1200, 840, (g, W, H) => {
    g.fillStyle = p.color; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 20000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.font = `600 ${W * 0.06}px ${DISPLAY}`; spaced(g, 'AUMBRY', W / 2 + 2, H / 2 + 22, W * 0.02);
    g.fillStyle = 'rgba(255,255,255,0.10)'; spaced(g, 'AUMBRY', W / 2, H / 2 + 20, W * 0.02);
  });
  const side = canvasTex(400, 100, (g, W, H) => { g.fillStyle = p.color; g.fillRect(0, 0, W, H); });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [M.paper(side), M.paper(side), M.paper(top), M.paper(side), M.paper(side), M.paper(side)]);
  m.position.y = h / 2;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.28, h + 0.004, d + 0.004), M.matte('#e9e6dc'));
  band.position.set(w * 0.28, h / 2, 0);
  const g = new THREE.Group(); g.add(m, band);
  return g;
}

const BUILDERS = { pillBottle, dropper, pump, jar, tube, carton, pen, kitBox, mailer };

/* ---------- studio ---------- */
function sweep(color) {
  const geo = new THREE.PlaneGeometry(60, 1, 1, 200);
  const pos = geo.attributes.position;
  const floorLen = 16, rad = 5, arc = rad * Math.PI / 2, total = floorLen + arc + 14;
  for (let i = 0; i < pos.count; i++) {
    const s = (pos.getY(i) + 0.5) * total;
    let y, z;
    if (s < floorLen) { y = 0; z = 10 - s; }
    else if (s < floorLen + arc) { const a = (s - floorLen) / rad; y = rad - rad * Math.cos(a); z = 10 - floorLen - rad * Math.sin(a); }
    else { y = rad + (s - floorLen - arc); z = 10 - floorLen - rad; }
    pos.setY(i, y); pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: mute(color, -0.2, 0.55), roughness: 1, envMapIntensity: 0.25, side: THREE.DoubleSide }));
  m.receiveShadow = true;
  return m;
}

function plinth(r, h, color, shape = 'round') {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, envMapIntensity: 0.35 });
  let m;
  if (shape === 'square') {
    m = new THREE.Mesh(new THREE.BoxGeometry(r * 2, h, r * 2), mat);
    m.position.y = h / 2;
  } else {
    m = new THREE.Mesh(roundedLathe([[0, 0], [r, 0], [r, h], [0, h]], 0.02, 160), mat);
  }
  m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m); g.userData.top = h;
  return g;
}

window.renderShot = async (spec) => {
  const W = spec.w || 1440, H = spec.h || 1800;
  renderer.setSize(W, H);
  const scene = new THREE.Scene();
  scene.environment = envTex;
  scene.environmentIntensity = spec.env ?? 0.55;
  scene.background = new THREE.Color(mute(spec.bg, -0.1, 0.55));
  scene.add(sweep(spec.bg));

  scene.add(new THREE.HemisphereLight('#ffffff', tint(spec.bg, -0.2), 0.5));
  const key = new THREE.DirectionalLight('#fff8ee', spec.key ?? 2.6);
  key.position.set(-5, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
  key.shadow.radius = 14; key.shadow.blurSamples = 24; key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#eef4ff', 0.7); fill.position.set(6, 3, 5); scene.add(fill);
  const rim = new THREE.DirectionalLight('#ffffff', 1.4); rim.position.set(2, 6, -8); scene.add(rim);

  for (const it of spec.items) {
    let base = 0;
    const root = new THREE.Group();
    if (it.plinth) {
      const pl = plinth(it.plinth.r, it.plinth.h, it.plinth.color || mute(spec.bg, -0.1, 0.6), it.plinth.shape);
      root.add(pl); base = it.plinth.h;
    }
    if (it.type) {
      const obj = shadowAll(BUILDERS[it.type](it));
      obj.scale.setScalar(it.scale || 1);
      if (it.lie) { // lay pens flat
        obj.rotation.z = Math.PI / 2;
        obj.position.y = base + (it.lieR || 0.19) * (it.scale || 1);
        obj.position.x = (it.lieShift || 1.6) * (it.scale || 1);
        const holder = new THREE.Group(); holder.add(obj); holder.rotation.y = it.rotY || 0;
        holder.position.set(it.ox || 0, 0, it.oz || 0);
        root.add(holder);
      } else {
        obj.position.set(it.ox || 0, base, it.oz || 0);
        obj.rotation.y = it.rotY || 0;
        root.add(obj);
      }
    }
    root.position.set(it.x || 0, 0, it.z || 0);
    scene.add(root);
  }

  const cam = new THREE.PerspectiveCamera(spec.fov || 26, W / H, 0.1, 100);
  cam.position.set(...(spec.cam || [0, 3.2, 12]));
  cam.lookAt(new THREE.Vector3(...(spec.target || [0, 1.4, 0])));
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL('image/png');
  scene.traverse(o => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(m => { m.map && m.map.dispose(); m.dispose(); }); } });
  return url;
};

window.ready = (async () => {
  await Promise.all([
    document.fonts.load(`600 40px ${DISPLAY}`),
    document.fonts.load(`italic 400 40px ${DISPLAY}`),
    document.fonts.load(`400 20px ${MONO}`),
    document.fonts.load(`500 20px ${SANS}`),
  ]);
  return true;
})();
