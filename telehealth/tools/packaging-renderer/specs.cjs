// Studio shot specs. Backdrop tint per category, packaging accent per category.
const C = {
  weight:   { bg: '#c9d2cb', accent: '#2e5b4f' },
  hair:     { bg: '#c6ced4', accent: '#3b4f63' },
  sexual:   { bg: '#d3c8cc', accent: '#5e3b4a' },
  skin:     { bg: '#d8d0c8', accent: '#7d6553' },
  hormones: { bg: '#cfccd8', accent: '#564c70' },
  wellness: { bg: '#d2d3c2', accent: '#646238' },
  testing:  { bg: '#c9cfd0', accent: '#34495a' },
};
const INK = '#17221e', PAPER = '#f4f3ee';
const lbl = (cat, o) => ({ bg: PAPER, fg: INK, accent: C[cat].accent, ...o });
const darkLbl = (cat, o) => ({ bg: C[cat].accent, fg: '#f1efe8', accent: '#c09a5b', dark: true, ...o });

const portrait = { w: 1440, h: 1800, cam: [0, 3.4, 12.5], target: [0, 1.5, 0], fov: 22 };
const pl = (cat, r = 1.35, h = 0.5) => ({ r, h, color: undefined });

module.exports = [
  // ---------- weight ----------
  { file: 'tirzepatide', bg: C.weight.bg, ...portrait, target: [0, 1.25, 0], items: [
    { plinth: { r: 1.9, h: 0.45 } },
    { type: 'carton', x: -0.55, z: -0.6, rotY: 0.25, w: 1.45, h: 2.25, d: 0.55, ox: 0, label: darkLbl('weight', { nameLines: ['Tirzepatide'], strength: 'Weekly pen', qty: '2.5 – 15 mg', rx: true }), nameSize: 112, plinth: undefined },
    { type: 'pen', lie: true, x: 0.0, z: 0.85, rotY: -0.35, doseColor: '#2e5b4f', capColor: '#2e5b4f', label: { name: 'Tirzepatide', strength: '2.5 mg / 0.6 ml' }, lieShift: 1.65 },
  ].map(fixBase(0.45)) },
  { file: 'semaglutide', bg: C.weight.bg, ...portrait, target: [0, 1.25, 0], items: [
    { plinth: { r: 1.9, h: 0.45 } },
    { type: 'carton', x: 0.5, z: -0.6, rotY: -0.25, w: 1.45, h: 2.25, d: 0.55, label: lbl('weight', { nameLines: ['Semaglutide'], strength: 'Weekly pen', qty: '0.25 – 2.4 mg', rx: true }), nameSize: 108 },
    { type: 'pen', lie: true, x: -0.1, z: 0.85, rotY: 0.4, doseColor: '#8fa89a', capColor: '#17221e', label: { name: 'Semaglutide', strength: '0.25 mg / 0.5 ml' }, lieShift: 1.65 },
  ].map(fixBase(0.45)) },
  { file: 'satiety-fibre', bg: C.weight.bg, ...portrait, items: [
    { plinth: { r: 1.5, h: 0.6 } },
    { type: 'jar', r: 0.85, h: 1.55, lidH: 0.38, lid: 'brass', body: '#efefea', printed: true, nameSize: 96, label: lbl('weight', { bg: '#efefea', nameLines: ['Satiety', 'Fibre'], strength: 'Glucomannan + psyllium', qty: '30 servings · 240 g', cat: 'Weight support' }) },
  ].map(fixBase(0.6)) },

  // ---------- hair ----------
  { file: 'finasteride', bg: C.hair.bg, ...portrait, items: [
    { plinth: { r: 1.25, h: 0.7 } },
    { type: 'pillBottle', scale: 1.05, capColor: '#3b4f63', label: lbl('hair', { name: 'Finasteride', strength: '1 mg tablets', qty: '28 tablets', rx: true }) },
  ].map(fixBase(0.7)) },
  { file: 'minoxidil', bg: C.hair.bg, ...portrait, items: [
    { plinth: { r: 1.2, h: 0.75 } },
    { type: 'dropper', scale: 1.15, glass: 'amber', label: lbl('hair', { name: 'Minoxidil', strength: '5% w/v solution', qty: '60 ml', cat: 'Pharmacy medicine' }), nameSize: 100 },
  ].map(fixBase(0.75)) },
  { file: 'density-serum', bg: C.hair.bg, ...portrait, items: [
    { plinth: { r: 1.2, h: 0.55 } },
    { type: 'pump', scale: 0.95, body: '#3b4f63', headColor: '#17221e', nameSize: 100, label: darkLbl('hair', { bg: '#3b4f63', nameLines: ['Density', 'Serum'], strength: 'Peptide + caffeine', qty: '50 ml', cat: 'Scalp care' }) },
  ].map(fixBase(0.55)) },

  // ---------- sexual health ----------
  { file: 'sildenafil', bg: C.sexual.bg, ...portrait, items: [
    { plinth: { r: 1.35, h: 0.55 } },
    { type: 'carton', w: 1.55, h: 2.2, d: 0.42, rotY: -0.3, label: darkLbl('sexual', { name: 'Sildenafil', strength: '50 mg · 100 mg', qty: '8 tablets', rx: true }), nameSize: 112 },
  ].map(fixBase(0.55)) },
  { file: 'tadalafil', bg: C.sexual.bg, ...portrait, items: [
    { plinth: { r: 1.25, h: 0.7 } },
    { type: 'pillBottle', scale: 1.05, cap: 'white', label: lbl('sexual', { name: 'Tadalafil', strength: '5 mg daily', qty: '28 tablets', rx: true }) },
  ].map(fixBase(0.7)) },

  // ---------- skin ----------
  { file: 'tretinoin', bg: C.skin.bg, ...portrait, items: [
    { plinth: { r: 1.2, h: 0.6 } },
    { type: 'tube', body: '#f1efe9', capColor: '#7d6553', nameSize: 100, label: lbl('skin', { bg: '#f1efe9', name: 'Tretinoin', strength: '0.025% cream', qty: '30 g', rx: true }) },
  ].map(fixBase(0.6)) },
  { file: 'barrier-cream', bg: C.skin.bg, ...portrait, target: [0, 1.2, 0], items: [
    { plinth: { r: 1.45, h: 0.75 } },
    { type: 'jar', r: 1.0, h: 0.85, lidH: 0.4, lid: 'brass', glass: false, body: '#efece6', printed: true, nameSize: 88, label: lbl('skin', { bg: '#efece6', nameLines: ['Barrier Cream'], strength: 'Ceramide + squalane', qty: '50 ml', cat: 'Daily skin' }) },
  ].map(fixBase(0.75)) },
  { file: 'mineral-spf', bg: C.skin.bg, ...portrait, items: [
    { plinth: { r: 1.2, h: 0.6 } },
    { type: 'tube', body: '#7d6553', capColor: '#17221e', nameSize: 96, label: darkLbl('skin', { bg: '#7d6553', nameLines: ['Mineral', 'SPF 50'], strength: 'Zinc oxide 18%', qty: '50 ml', cat: 'Daily skin' }) },
  ].map(fixBase(0.6)) },

  // ---------- hormones ----------
  { file: 'hrt', bg: C.hormones.bg, ...portrait, items: [
    { plinth: { r: 1.75, h: 0.5 } },
    { type: 'pump', x: -0.55, z: -0.15, scale: 0.92, body: '#ecebef', headColor: '#564c70', nameSize: 100, label: lbl('hormones', { bg: '#ecebef', name: 'Estradiol', strength: '0.06% gel', qty: '80 g · 64 doses', rx: true }) },
    { type: 'pillBottle', x: 0.75, z: 0.45, scale: 0.72, capColor: '#564c70', nameSize: 96, label: lbl('hormones', { name: 'Progesterone', strength: '100 mg capsules', qty: '30 capsules', rx: true }) },
  ].map(fixBase(0.5)) },

  // ---------- wellness ----------
  { file: 'magnesium', bg: C.wellness.bg, ...portrait, items: [
    { plinth: { r: 1.4, h: 0.65 } },
    { type: 'jar', r: 0.8, h: 1.45, lidH: 0.36, lidColor: '#646238', body: '#efefe8', printed: true, nameSize: 92, label: lbl('wellness', { bg: '#efefe8', name: 'Magnesium', strength: 'Glycinate 300 mg', qty: '60 capsules', cat: 'Sleep & recovery' }) },
  ].map(fixBase(0.65)) },
  { file: 'vitamin-d', bg: C.wellness.bg, ...portrait, items: [
    { plinth: { r: 1.2, h: 0.8 } },
    { type: 'dropper', scale: 1.1, glass: 'amber', nameSize: 96, label: lbl('wellness', { name: 'D3 + K2', strength: '1000 IU · 50 µg', qty: '30 ml drops', cat: 'Daily essentials' }) },
  ].map(fixBase(0.8)) },
  { file: 'omega-3', bg: C.wellness.bg, ...portrait, items: [
    { plinth: { r: 1.25, h: 0.7 } },
    { type: 'pillBottle', scale: 1.05, capColor: '#646238', nameSize: 104, label: lbl('wellness', { name: 'Omega-3', strength: 'EPA 600 · DHA 400', qty: '60 softgels' }) },
  ].map(fixBase(0.7)) },

  // ---------- testing ----------
  { file: 'blood-panel', bg: C.testing.bg, ...portrait, items: [
    { plinth: { r: 1.6, h: 0.45 } },
    { type: 'kitBox', w: 2.0, h: 2.45, d: 0.7, rotY: 0.28, nameSize: 104, label: darkLbl('testing', { nameLines: ['Advanced', 'Health Panel'], strength: '42 biomarkers', qty: 'Home finger-prick kit', cat: 'UKAS-accredited lab' }) },
  ].map(fixBase(0.45)) },
  { file: 'hormone-panel', bg: C.testing.bg, ...portrait, items: [
    { plinth: { r: 1.6, h: 0.45 } },
    { type: 'kitBox', w: 2.0, h: 2.45, d: 0.7, rotY: -0.28, nameSize: 104, label: lbl('testing', { nameLines: ['Hormone', 'Panel'], strength: '12 biomarkers', qty: 'Home finger-prick kit', cat: 'UKAS-accredited lab' }) },
  ].map(fixBase(0.45)) },

  // ---------- editorial ----------
  { file: 'hero', bg: '#c9d2cb', w: 2400, h: 1600, cam: [0, 3.6, 15], target: [0.2, 1.35, 0], fov: 22, items: [
    { plinth: { r: 1.25, h: 1.25 }, x: -2.3, z: -0.6 },
    { type: 'pillBottle', x: -2.3, z: -0.6, scale: 0.95, capColor: '#3b4f63', label: lbl('hair', { name: 'Finasteride', strength: '1 mg tablets', qty: '28 tablets', rx: true }), base: 1.25 },
    { plinth: { r: 2.1, h: 0.4 }, x: 0.5, z: 0.4 },
    { type: 'carton', x: 0.15, z: -0.1, rotY: 0.15, w: 1.45, h: 2.25, d: 0.55, label: darkLbl('weight', { nameLines: ['Tirzepatide'], strength: 'Weekly pen', qty: '2.5 – 15 mg', rx: true }), nameSize: 112, base: 0.4 },
    { type: 'pen', lie: true, x: 0.7, z: 1.25, rotY: -0.25, doseColor: '#2e5b4f', capColor: '#2e5b4f', label: { name: 'Tirzepatide', strength: '2.5 mg / 0.6 ml' }, lieShift: 1.65, base: 0.4 },
    { plinth: { r: 1.15, h: 0.85 }, x: 3.1, z: -0.9 },
    { type: 'jar', x: 3.1, z: -0.9, r: 0.82, h: 0.8, lidH: 0.38, lid: 'brass', body: '#efece6', printed: true, nameSize: 84, label: lbl('skin', { bg: '#efece6', nameLines: ['Barrier Cream'], strength: 'Ceramide + squalane', qty: '50 ml', cat: 'Daily skin' }), base: 0.85 },
  ].map(hero) },
  { file: 'discreet', bg: '#cfd3cf', w: 2000, h: 1500, cam: [0, 7.5, 11], target: [0, 0.4, 0], fov: 24, items: [
    { type: 'mailer', color: '#22332d', rotY: -0.3 },
  ] },
  { file: 'clinic', bg: '#cfccd8', w: 1800, h: 2000, cam: [0, 3.2, 13], target: [0, 1.45, 0], fov: 23, items: [
    { plinth: { r: 1.1, h: 1.1, shape: 'square' }, x: -1.1, z: -0.4 },
    { type: 'pump', x: -1.1, z: -0.4, scale: 0.85, body: '#ecebef', headColor: '#564c70', nameSize: 100, label: lbl('hormones', { bg: '#ecebef', name: 'Estradiol', strength: '0.06% gel', qty: '80 g · 64 doses', rx: true }), base: 1.1 },
    { plinth: { r: 1.05, h: 0.5, shape: 'square' }, x: 1.05, z: 0.5 },
    { type: 'dropper', x: 1.05, z: 0.5, scale: 1.0, glass: 'amber', nameSize: 96, label: lbl('wellness', { name: 'D3 + K2', strength: '1000 IU · 50 µg', qty: '30 ml drops', cat: 'Daily essentials' }), base: 0.5 },
  ].map(hero) },
];

// products sitting on the single plinth: lift them by plinth height
function fixBase(h) { return (it) => (it.plinth || !it.type) ? it : { ...it, plinth: { r: 0.001, h, color: '#000' }, _hidePlinth: true }; }
function hero(it) { return (it.plinth || !it.type) ? it : { ...it, plinth: { r: 0.001, h: it.base || 0, color: '#000' } }; }
