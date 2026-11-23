// 꾸미기 모습 — 아이템마다 실제 에셋(사진 · 명화 · 실물 누끼 · 재질 사진 · 시즌 1 그림)으로 그린다.
// 맵(table) · 뒷면(cardBack) · 앞면(cardFace) · 효과(effect) · 승리(victory) 칸이 같은 이름(look)을 함께 쓸 수 있다.
import { PLATE_NAMES } from './plate-names.js';

// 그림 키: scene/<키> = 맵 사진, paint/<키> = 시즌 1 그림, back/<키> = 뒷면 그림, court/<묶음>/<키> = 그림카드, cut/<키> = 누끼

// ── 맵: 배경 사진(또는 시즌 1 그림) + 탁자 윗면 · 테두리 재질 + 양옆 소품 + 조명
// props: [누끼, 가로 %, 바닥 세로 %, 높이(화면 높이 %), 기울기, 좌우 뒤집기]
const M = (o) => ({
  scene: null, painted: null, photo: null, blur: 2, bright: 0.66, sat: 1, light: 'none', shape: 'oval',
  top: ['felt', '#1d6b52', 'multiply', 420], rim: ['walnut', '#6a4429', 'multiply', 420], props: [], accent: '#f2b544', ...o,
});
const painted = (key, accent) => M({ painted: key, blur: 0, bright: 1, light: 'none', top: 'none', rim: 'none', accent });

export const MAPS = {
  classic: M({ scene: 'card-room', bright: 0.5, blur: 3, light: 'spot' }),
  peach: M({ scene: 'cafe-terrace', bright: 0.74, light: 'day', top: ['linen', '#f0ae8c', 'multiply', 380], rim: ['cherry', null, 'normal', 380], shape: 'rect', props: [['peach', 7, 80, 15, -8], ['soda-glass', 92, 82, 30, 3]], accent: '#ffb48a' }),
  'dessert-cafe': M({ scene: 'patisserie', bright: 0.66, light: 'warm', top: ['gingham', '#c6283b', 'multiply', 240], rim: ['cherry', null, 'normal', 380], shape: 'rect', props: [['strawberry-cake', 8, 82, 24, 0], ['coffee-cup', 92, 80, 18, 0], ['cupcake', 88, 62, 15, 6]], accent: '#ff8fa3' }),
  'night-picnic': M({ scene: 'night-meadow', bright: 0.72, blur: 1, light: 'moon', top: ['gingham', '#2b416f', 'multiply', 280], rim: 'none', shape: 'rect', props: [['lantern', 8, 84, 34, 0], ['picnic-basket', 91, 86, 24, 0]], accent: '#ffd27a' }),
  aquarium: M({ scene: 'aquarium', bright: 0.6, light: 'cool', top: ['suede', '#1b5466', 'multiply', 420], rim: ['brass', null, 'normal', 300], props: [['seashell', 8, 86, 16, 0], ['jellyfish', 92, 54, 30, 0]], accent: '#7fe3ff' }),
  'rose-conservatory': M({ scene: 'glasshouse', bright: 0.72, light: 'day', top: ['marble-white', null, 'normal', 620], rim: ['brass', null, 'normal', 320], props: [['rose-vase', 8, 84, 40, 0], ['teapot', 91, 82, 20, 0], ['teacup', 87, 64, 12, 0]], accent: '#e8a0a8' }),
  cherry: M({ scene: 'cherry-park', bright: 0.76, light: 'day', top: ['linen', '#f4c9d2', 'multiply', 380], rim: 'none', shape: 'rect', props: [['cherry-branch', 6, 72, 46, -10]], accent: '#ffb7c8' }),
  dream: M({ scene: 'fairy-castle', bright: 0.64, light: 'dusk', top: ['velvet', '#8a6fc0', 'multiply', 520], rim: ['gold', '#b8913f', 'multiply', 320], props: [['candelabra', 8, 86, 44, 0], ['crown', 91, 80, 16, 6]], accent: '#d9c2ff' }),
  'pink-cloud': painted('pink-cloud-table', '#ff9ccc'),
  'moon-rabbit': painted('moon-rabbit-table', '#cdd8ff'),
  'strawberry-parade': painted('strawberry-parade-table', '#ff8fa3'),
  'rose-ballroom': painted('rose-ballroom-table', '#f1cf8b'),
  'real-rose': painted('real-rose-garden-table', '#f4c2a8'),
  'neon-deepsea': painted('neon-deepsea-table', '#76efff'),
  'sun-temple': painted('sun-temple-table', '#ffd46c'),
  // 시즌 2
  tulips: M({ scene: 'tulip-field', bright: 0.74, light: 'day', top: ['linen', '#f6efe2', 'multiply', 380], rim: ['walnut', '#6a4429', 'multiply', 380], shape: 'rect', props: [['tulip-bunch', 8, 84, 34, -4]], accent: '#ff7a8a' }),
  lavender: M({ scene: 'lavender-field', bright: 0.72, light: 'dusk', top: ['linen', '#d9cdee', 'multiply', 380], rim: ['cherry', null, 'normal', 380], shape: 'rect', props: [['lilac', 8, 84, 36, -6]], accent: '#b9a2ff' }),
  hydrangea: M({ scene: 'hydrangea', bright: 0.72, light: 'day', top: ['satin', '#a9c3ec', 'multiply', 520], rim: ['gold-pale', null, 'normal', 300], props: [['galle-vase', 8, 86, 30, 0]], accent: '#9fc4ff' }),
  wisteria: M({ scene: 'wisteria', bright: 0.7, light: 'dusk', top: ['jacquard-floral', '#bfa6e6', 'multiply', 360], rim: ['rosewood', null, 'normal', 380], props: [['lilac', 92, 70, 40, 0, true]], accent: '#c8b0ff' }),
  giverny: M({ scene: 'lotus-pond', bright: 0.72, light: 'day', top: ['linen', '#cfe3d2', 'multiply', 380], rim: ['walnut', '#6a4429', 'multiply', 380], props: [['lotus', 8, 86, 20, 0], ['lily', 92, 84, 36, 0]], accent: '#9fe0b5' }),
  peony: M({ scene: 'peony-garden', bright: 0.72, light: 'warm', top: ['satin', '#f3c2cf', 'multiply', 520], rim: ['gold-pale', null, 'normal', 300], props: [['peony', 8, 84, 24, 0]], accent: '#ff9db5' }),
  sunflower: M({ scene: 'sunflower-field', bright: 0.76, light: 'day', top: ['linen', '#f5e3b0', 'multiply', 380], rim: ['cherry', null, 'normal', 380], shape: 'rect', props: [['sunflower', 8, 86, 44, -6]], accent: '#ffd24a' }),
  'rose-garden-1': M({ scene: 'rose-garden-1', bright: 0.72, light: 'day', top: ['marble-white', null, 'normal', 620], rim: ['gold-pale', null, 'normal', 300], props: [['rose-vase', 8, 86, 38, 0], ['rose-pink', 92, 82, 26, 10]], accent: '#ff9db0' }),
  'rose-garden-2': M({ scene: 'rose-garden-2', bright: 0.7, light: 'warm', top: ['jacquard-floral', '#e9c9cf', 'multiply', 360], rim: ['walnut', '#6a4429', 'multiply', 380], props: [['rose-bouquet', 9, 86, 34, -8], ['teacup', 91, 82, 12, 0]], accent: '#f6a5b5' }),
  'rose-garden-3': M({ scene: 'rose-garden-3', bright: 0.7, light: 'day', top: ['linen', '#f6efe6', 'multiply', 380], rim: ['brass', null, 'normal', 320], shape: 'rect', props: [['rose-white', 8, 84, 26, -6], ['perfume', 92, 82, 22, 0]], accent: '#f3d7d0' }),
  'rose-garden-4': M({ scene: 'rose-garden-4', bright: 0.68, light: 'warm', top: ['velvet', '#8c1d36', 'multiply', 520], rim: ['gold', '#b8913f', 'multiply', 320], props: [['candelabra', 8, 86, 42, 0], ['rose-red', 92, 82, 26, -10]], accent: '#e8475f' }),
  'rose-garden-5': M({ scene: 'rose-garden-5', bright: 0.7, light: 'day', top: ['terrazzo', null, 'normal', 520], rim: ['gold-pale', null, 'normal', 300], props: [['rose-yellow', 8, 84, 26, 8], ['macarons', 92, 84, 14, 0]], accent: '#ffd38a' }),
  'rose-garden-6': M({ scene: 'rose-garden-6', bright: 0.7, light: 'dusk', top: ['satin', '#e7b7c4', 'multiply', 520], rim: ['rosewood', null, 'normal', 380], props: [['rose-dome', 8, 84, 30, 0], ['gramophone', 92, 86, 30, 0]], accent: '#f2a7c0' }),
  'rose-night': M({ scene: 'rose-arch-night', bright: 0.7, light: 'candle', top: ['velvet', '#5d1428', 'multiply', 520], rim: ['gold', '#b8913f', 'multiply', 320], props: [['candelabra', 8, 86, 44, 0], ['champagne', 92, 82, 22, 0]], accent: '#ffb38a' }),
  versailles: M({ scene: 'ballroom-mirrors', bright: 0.66, light: 'candle', top: ['velvet', '#6e1426', 'multiply', 520], rim: ['gold', '#b8913f', 'multiply', 320], props: [['candelabra', 8, 86, 46, 0], ['rose-vase', 92, 86, 40, 0, true]], accent: '#f3cf7a' }),
  opera: M({ scene: 'opera-garnier', bright: 0.64, light: 'warm', top: ['velvet', '#7a1a2c', 'multiply', 520], rim: ['gold', '#b8913f', 'multiply', 320], props: [['champagne', 8, 82, 24, 0], ['rose-bouquet', 92, 86, 34, 8]], accent: '#f6d38a' }),
  palace: M({ scene: 'palace-gallery', bright: 0.66, light: 'warm', top: ['checker-marble', null, 'normal', 360], rim: ['gold', '#b8913f', 'multiply', 320], props: [['candelabra', 8, 86, 44, 0], ['crown', 92, 80, 16, 0]], accent: '#f2d48a' }),
  library: M({ scene: 'library-grand', bright: 0.62, light: 'warm', top: ['leather-red', '#7d2a22', 'multiply', 420], rim: ['walnut', '#6a4429', 'multiply', 380], props: [['books-stack', 8, 86, 26, 0], ['globe', 92, 86, 30, 0]], accent: '#d9b36c' }),
  'winter-garden': M({ scene: 'winter-garden', bright: 0.72, light: 'day', top: ['marble-white', null, 'normal', 620], rim: ['brass', null, 'normal', 320], props: [['rose-vase', 8, 86, 40, 0], ['teapot', 92, 84, 18, 0]], accent: '#bfe3c6' }),
  'million-roses': M({ scene: 'rose-field', bright: 0.74, light: 'dusk', top: ['velvet', '#a3122f', 'multiply', 520], rim: ['gold', '#b8913f', 'multiply', 320], props: [['rose-bouquet', 8, 88, 40, -6], ['rose-dome', 92, 86, 30, 0]], accent: '#ff5d73' }),
  'golden-rose': M({ scene: 'ballroom-mirrors', bright: 0.56, blur: 4, light: 'candle', top: ['satin', '#c9a14a', 'multiply', 520], rim: ['gold', '#b8913f', 'multiply', 320], props: [['rose-gold', 8, 84, 30, -6], ['candelabra', 92, 86, 44, 0]], accent: '#ffd67a' }),
  'black-rose': M({ scene: 'card-room', bright: 0.4, blur: 4, light: 'spot', top: ['onyx-black', null, 'normal', 520], rim: ['marble-black-gold', null, 'normal', 360], props: [['rose-black', 8, 84, 28, -8], ['candle', 92, 84, 26, 0]], accent: '#d8c7a0' }),
  arena: M({ scene: 'opera-garnier', bright: 0.5, blur: 4, light: 'spot', top: ['herringbone', '#22325a', 'multiply', 420], rim: ['brass', null, 'normal', 300], props: [['trophy', 8, 84, 28, 0]], accent: '#f2b544' }),
  'box-patisserie': M({ scene: 'patisserie', bright: 0.62, blur: 2, light: 'warm', top: ['satin', '#f2c4cf', 'multiply', 520], rim: ['gold-pale', null, 'normal', 300], props: [['wedding-cake', 8, 88, 40, 0], ['macaron-tower', 92, 86, 34, 0]], accent: '#ff9db0' }),
  obsidian: M({ scene: 'night-city', bright: 0.48, blur: 3, light: 'spot', top: ['onyx-black', null, 'normal', 520], rim: ['marble-black', null, 'normal', 360], props: [['diamond', 92, 80, 12, 0]], accent: '#c9d3e6' }),
};

// ── 카드 뒷면: 흰 테(종이 결) 안에 그림. 시즌 1 그림은 테 없이 꽉 채운다.
const B = (o) => ({
  art: null, paint: null, photo: null, base: '#15223a', border: '#f6f1e6', inset: 5.5, paper: 'paper-white', frame: null,
  tex: null, emblem: null, caption: null, foil: false, fit: 'cover', pos: 'center', filter: null, ...o,
});
const s1Back = (key) => B({ paint: key, border: 'none', fit: 'fill' });
const redoute = (n) => {
  const key = `redoute-${String(n).padStart(2, '0')}`;
  return B({ art: key, border: '#f3ead6', paper: 'paper-cream', inset: 6, frame: 'rgba(120,90,50,.55)', caption: PLATE_NAMES[key]?.latin || null });
};

export const BACKS = {
  classic: B({ tex: 'linen', base: '#1b2a4a', emblem: 'ONE!', frame: '#d8b36a' }),
  'strawberry-milk': B({ art: 'strawberry-plate', border: '#fbf6ee', paper: 'paper-cream', frame: 'rgba(170,60,80,.45)' }),
  atlas: B({ art: 'celestial-map', border: '#efe3c8', paper: 'paper-cream' }),
  'star-candy': B({ art: 'star-candy', border: '#f7f2ff' }),
  bauhaus: B({ art: 'kandinsky-comp8', border: '#f4efe6' }),
  'stone-temple': B({ art: 'jade-carving', border: '#10201a', paper: null }),
  'rose-arbor': B({ art: 'morris-trellis', border: '#efe6d2', paper: 'paper-cream' }),
  brass: B({ art: 'orrery', border: '#17120d', paper: null }),
  monochrome: B({ art: 'great-wave', border: '#f4f1ea', filter: 'grayscale(1) contrast(1.12)' }),
  'space-whale': B({ art: 'whale-galaxy', border: '#0b0d14', paper: null }),
  library: B({ art: 'bookbinding', border: '#1a120c', paper: null }),
  dream: B({ art: 'dream-castle', border: '#f3eee6' }),
  'pink-cloud': s1Back('pink-cloud-back'),
  'moon-rabbit': s1Back('moon-rabbit-back'),
  'strawberry-parade': s1Back('strawberry-parade-back'),
  'rose-ballroom': s1Back('rose-ballroom-back'),
  'real-rose': s1Back('real-rose-garden-back'),
  'neon-deepsea': s1Back('neon-deepsea-back'),
  'sun-temple': s1Back('sun-temple-back'),
  // 시즌 2 — 장미 도감(레두테, 1817~1824)
  'redoute-01': redoute(1), 'redoute-02': redoute(2), 'redoute-03': redoute(3), 'redoute-04': redoute(4),
  'redoute-05': redoute(5), 'redoute-06': redoute(6), 'redoute-07': redoute(7), 'redoute-08': redoute(8),
  'redoute-09': redoute(9), 'redoute-10': redoute(10), 'redoute-11': redoute(11), 'redoute-12': redoute(12),
  // 시즌 2 — 명화 속 꽃
  'fantin-roses': B({ art: 'fantin-roses', border: '#1b1612', paper: null }),
  'vangogh-roses': B({ art: 'vangogh-roses', border: '#f2eee4' }),
  'vangogh-irises': B({ art: 'vangogh-irises', border: '#f2eee4' }),
  'vangogh-almond': B({ art: 'vangogh-almond', border: '#f2eee4' }),
  'huysum-flowers': B({ art: 'huysum-flowers', border: '#16110c', paper: null }),
  'ruysch-flowers': B({ art: 'ruysch-flowers', border: '#16110c', paper: null }),
  'bosschaert-flowers': B({ art: 'bosschaert-flowers', border: '#16110c', paper: null }),
  'mucha-rose': B({ art: 'mucha-rose', border: '#efe6d2', paper: 'paper-cream' }),
  'mucha-lily': B({ art: 'mucha-lily', border: '#efe6d2', paper: 'paper-cream' }),
  'klimt-roses': B({ art: 'klimt-roses', border: '#e9dcc0', paper: 'paper-cream' }),
  'monet-waterlilies': B({ art: 'monet-waterlilies', border: '#eef1ea' }),
  'renoir-roses': B({ art: 'renoir-roses', border: '#f2eee4' }),
  'morris-rose': B({ art: 'morris-rose', border: '#efe6d2', paper: 'paper-cream' }),
  'morris-strawberry': B({ art: 'morris-strawberry', border: '#13233a', paper: null }),
  'japanese-peony': B({ art: 'japanese-peony', border: '#f1e9d8', paper: 'paper-cream' }),
  'japanese-cherry': B({ art: 'japanese-cherry', border: '#f1e9d8', paper: 'paper-cream' }),
  'rose-damask': B({ art: 'rose-damask', border: '#2a0d16', paper: null, foil: true }),
  'rose-window': B({ art: 'rose-window', border: '#0b0b12', paper: null, foil: true }),
  'hubble-rose': B({ art: 'hubble-rose', border: '#07080f', paper: null }),
  'golden-rose': B({ art: 'rose-damask', border: '#c9a14a', paper: null, tex: null, foil: true, frame: '#f7dd96', filter: 'sepia(.55) saturate(1.4) hue-rotate(-8deg) brightness(1.05)' }),
  'black-rose': B({ art: 'rose-window', border: '#0a0a0c', paper: null, frame: '#c9c2b0', filter: 'grayscale(1) contrast(1.25) brightness(.85)', foil: true }),
  arena: B({ art: 'sunburst-gold', border: '#121a2b', paper: null, frame: '#f2b544' }),
  obsidian: B({ tex: 'onyx-black', base: '#0d0d10', emblem: 'ONE!', frame: '#c9d3e6', border: '#0d0d10', paper: null, foil: true }),
};

// ── 카드 앞면: 종이 결 · 잉크 색 · 그림카드 묶음 · 에이스 그림 · 테
// court: 묶음 이름(영국식은 무늬마다 다른 그림, perSuit) 또는 { K, Q, J } 그림 값
const F = (o) => ({
  paper: 'paper-white', tint: '#fbf8f1', ink: '#1b1d24', red: '#b8232f', accent: '#c9a25a',
  court: 'english', perSuit: true, ace: { spades: 'aces/spade-1' }, courtBlend: 'multiply', courtFx: null, courtFit: 'cover',
  pips: 'ink', frame: null, joker: 'jokers/joker-1', ...o,
});
const set3 = (name, o = {}) => F({ court: name, perSuit: false, ace: `${name}/A`, ...o });

export const FACES = {
  classic: F({}),
  bunny: set3('potter', { paper: 'paper-cream', tint: '#fbf3e2', red: '#b8343c' }),
  manuscript: set3('cloisters', { paper: 'paper-cream', tint: '#efdcb8', ink: '#3b2a18', red: '#9b2d20', frame: 'thin', accent: '#9b7a3a' }),
  arcade: F({ paper: 'onyx-black', tint: '#17151f', ink: '#e9f1ff', red: '#ff5c93', court: { K: 'cut:joystick', Q: 'cut:gamepad', J: 'cut:dice' }, perSuit: false, ace: null, courtBlend: 'normal', courtFit: 'contain', frame: 'neon', accent: '#5cf2ff' }),
  deco: F({ paper: 'onyx-black', tint: '#131313', ink: '#e2c27a', red: '#e8c77e', courtFx: 'invert(1) sepia(1) saturate(2.4) hue-rotate(-10deg) brightness(.92)', courtBlend: 'screen', pips: 'gold', frame: 'deco', accent: '#e2c27a' }),
  'stone-temple': set3('antiquity', { paper: 'sandstone', tint: '#efe2c8', ink: '#3a2b1c', red: '#8f3a1e', courtBlend: 'multiply' }),
  'rose-conservatory': set3('botanical', { paper: 'paper-cream', tint: '#fbf2ea', red: '#b3263a' }),
  glass: F({ paper: 'paper-white', tint: '#eef5fb', ink: '#1d2a3a', red: '#c2304a', court: { K: 'cut:galle-vase', Q: 'cut:perfume', J: 'cut:diamond' }, perSuit: false, ace: null, courtBlend: 'normal', courtFit: 'contain', frame: 'glass', accent: '#7fc3e8' }),
  'dessert-cafe': F({ paper: 'paper-cream', tint: '#fff8f1', ink: '#4a2a22', red: '#d0364d', court: { K: 'cut:birthday-cake', Q: 'cut:cake-slice', J: 'cut:cupcake' }, perSuit: false, ace: { hearts: 'cut:strawberry', diamonds: 'cut:strawberry' }, courtBlend: 'normal', courtFit: 'contain', accent: '#ff9db0' }),
  blueprint: set3('patent', { paper: 'paper-white', tint: '#2a5ea8', ink: '#f2f7ff', red: '#ffffff', courtFx: 'invert(1)', courtBlend: 'screen', frame: 'grid', accent: '#cfe2ff' }),
  ink: set3('ink', { paper: 'paper-cream', tint: '#f4ecdc', ink: '#1a1a1a', red: '#b3262e' }),
  tarot: set3('tarot', { paper: 'paper-cream', tint: '#f3e6c8', ink: '#2a1d10', red: '#9e2a22', courtBlend: 'multiply', frame: 'gold' }),
  dream: set3('fairy', { paper: 'paper-cream', tint: '#f8f3ea', ink: '#2b2240', red: '#a8324a', courtBlend: 'normal', frame: 'thin', accent: '#a58bd6' }),
  'real-rose': F({ paper: null, tint: '#fbf3e6', court: { K: 'photo:rose-1', Q: 'photo:rose-2', J: 'photo:rose-3' }, perSuit: false, ace: { hearts: 'cut:rose-pink', diamonds: 'cut:rose-pink' }, courtBlend: 'normal', frame: 'paint:real-rose-face' }),
  // 시즌 2
  league: F({ paper: 'paper-white', tint: '#fbf8f1', pips: 'gold', frame: 'gold' }),
  silver: F({ paper: 'paper-white', tint: '#f7f8fa', ink: '#1d2230', red: '#a8243a', pips: 'silver', frame: 'thin', courtFx: 'grayscale(1) contrast(1.1)', accent: '#b9c2d4' }),
  'golden-rose': F({ paper: 'paper-cream', tint: '#fbf3e2', ink: '#2a2014', red: '#a5212e', pips: 'gold', frame: 'gold', ace: { hearts: 'cut:rose-gold', diamonds: 'cut:rose-gold', spades: 'aces/spade-1' }, courtBlend: 'multiply', accent: '#d4a84a' }),
  'black-rose': F({ paper: 'onyx-black', tint: '#121214', ink: '#e8e3d6', red: '#d9435a', courtFx: 'invert(1) grayscale(1) brightness(.9)', courtBlend: 'screen', pips: 'silver', frame: 'thin', ace: { hearts: 'cut:rose-black', diamonds: 'cut:rose-black' }, accent: '#c9c2b0' }),
  redoute: F({ paper: 'paper-cream', tint: '#f8f0e0', ink: '#2b241a', red: '#a3223a', court: { K: 'redoute/K', Q: 'redoute/Q', J: 'redoute/J' }, perSuit: false, ace: { hearts: 'cut:rose-red', diamonds: 'cut:rose-pink', spades: 'aces/spade-1', clubs: 'cut:rose-white' }, courtBlend: 'multiply', frame: 'thin', accent: '#a3223a' }),
  obsidian: F({ paper: 'onyx-black', tint: '#101012', ink: '#dfe5f0', red: '#e0566d', courtFx: 'invert(1) grayscale(1) brightness(.92)', courtBlend: 'screen', pips: 'silver', frame: 'thin', accent: '#c9d3e6' }),
};

// ── 카드 효과: 낼 때 실물 몇 개(많이 흩뿌리지 않음 — 크게 몇 개만)
// motion: pop(튀어 오름) · swirl(감돌다 흩어짐) · float(떠오름) · drop(위에서 떨어져 앉음) · sweep(빛 띠가 지나감) · strike(번개) · orbit(둘레를 돎)
const E = (o) => ({ sprites: ['poker-chips'], motion: 'pop', count: 4, size: [70, 110], blend: 'normal', band: null, ...o });

export const EFFECTS = {
  classic: E({ sprites: ['poker-chips', 'gold-coins'], motion: 'pop', count: 3 }),
  cloud: E({ sprites: ['soap-bubble', 'balloon-pink'], motion: 'float', count: 4, size: [60, 110] }),
  aurora: E({ motion: 'sweep', band: 'aurora', sprites: [], count: 0 }),
  'rose-conservatory': E({ sprites: ['rose-petal-1', 'rose-petal-2', 'rose-petal-3'], motion: 'swirl', count: 6, size: [46, 78] }),
  arcade: E({ sprites: ['gamepad', 'joystick'], motion: 'pop', count: 3, size: [80, 120] }),
  dream: E({ sprites: ['diamond', 'pearls', 'crown'], motion: 'pop', count: 3, size: [70, 110] }),
  'pink-cloud': E({ sprites: ['balloon-pink', 'soap-bubble'], motion: 'float', count: 4, size: [70, 120] }),
  'moon-rabbit': E({ sprites: ['moon', 'rabbit'], motion: 'orbit', count: 2, size: [80, 120] }),
  'strawberry-parade': E({ sprites: ['strawberry', 'gift-box'], motion: 'pop', count: 4, size: [60, 100] }),
  'rose-ballroom': E({ sprites: ['rose-red', 'rose-petal-1', 'rose-petal-2'], motion: 'swirl', count: 5, size: [56, 100] }),
  'real-rose': E({ sprites: ['rose-bouquet'], motion: 'drop', count: 1, size: [150, 170] }),
  'neon-deepsea': E({ sprites: ['jellyfish', 'soap-bubble'], motion: 'float', count: 3, size: [70, 130] }),
  'sun-temple': E({ sprites: ['gold-coins', 'diamond'], motion: 'pop', count: 4, size: [60, 100] }),
  spotlight: E({ motion: 'sweep', band: 'concert-lights', sprites: [], count: 0 }),
  thunder: E({ sprites: ['lightning'], motion: 'strike', count: 1, size: [200, 240] }),
  // 시즌 2
  'single-rose': E({ sprites: ['rose-red'], motion: 'drop', count: 1, size: [130, 150] }),
  'petal-wind': E({ sprites: ['rose-petal-1', 'rose-petal-2', 'rose-petal-3'], motion: 'sweep-petals', count: 7, size: [40, 70] }),
  'white-rose': E({ sprites: ['rose-white', 'rose-petal-3'], motion: 'swirl', count: 4, size: [60, 100] }),
  'golden-rose': E({ sprites: ['rose-gold', 'gold-coins'], motion: 'drop', count: 1, size: [130, 150] }),
  'black-rose': E({ sprites: ['rose-black', 'smoke'], motion: 'drop', count: 1, size: [130, 150] }),
  fireworks: E({ motion: 'sweep', band: 'fireworks-2', sprites: [], count: 0 }),
  'box-macarons': E({ sprites: ['macarons', 'macaron-tower'], motion: 'pop', count: 3, size: [80, 120] }),
  'box-flowers': E({ sprites: ['carnation', 'pansy', 'camomile', 'poppy'], motion: 'float', count: 4, size: [70, 110] }),
  'box-teddy': E({ sprites: ['teddy-red-bow'], motion: 'drop', count: 1, size: [130, 150] }),
};

// ── 승리 연출: 화면 전체 배경(사진 · 시즌 1 그림) + 가운데 실물 + 몇 개의 소품
// motion: rise(솟음) · bloom(피어남) · drop(내려앉음) · crown(내 캐릭터에 씌움) · fireworks(불꽃 사진이 터짐) · cannons(양쪽에서 쏨) · rain(위에서 몇 개 떨어짐) · curtain(막이 열림)
const V = (o) => ({ backdrop: null, hero: 'trophy', heroSize: 1, sprites: [], motion: 'rise', accent: '#f2b544', ...o });

export const VICTORIES = {
  classic: V({ hero: 'trophy', sprites: ['confetti'], motion: 'rise' }),
  cloud: V({ hero: 'balloon-pink', sprites: ['balloon-pink', 'soap-bubble'], motion: 'rain', accent: '#ffc6e6' }),
  fireworks: V({ backdrop: { scene: 'fireworks-1' }, hero: 'trophy', motion: 'fireworks', fireworks: ['fireworks-1', 'fireworks-2', 'fireworks-3'], accent: '#ffcf5c' }),
  confetti: V({ hero: 'trophy', sprites: ['confetti', 'gift-box'], motion: 'cannons', accent: '#ff5c8a' }),
  'rose-conservatory': V({ backdrop: { scene: 'glasshouse' }, hero: 'rose-bouquet', heroSize: 1.15, sprites: ['rose-petal-1', 'rose-petal-2'], motion: 'bloom', accent: '#ff9db0' }),
  celestial: V({ backdrop: { scene: 'crab-nebula' }, hero: 'trophy', motion: 'rise', accent: '#b8c8ff', zoom: true }),
  'neon-concert': V({ backdrop: { scene: 'concert-lights' }, hero: 'trophy', motion: 'rise', accent: '#ff6bd6' }),
  cherry: V({ backdrop: { scene: 'cherry-park' }, hero: 'cherry-branch', sprites: ['cherry-branch'], motion: 'bloom', accent: '#ffb7c8' }),
  arcade: V({ hero: 'trophy', sprites: ['gamepad', 'joystick'], motion: 'cannons', accent: '#5cf2ff', word: 'HIGH SCORE' }),
  dream: V({ backdrop: { scene: 'fairy-castle' }, hero: 'crown', motion: 'crown', accent: '#d9c2ff' }),
  'pink-cloud': V({ backdrop: { paint: 'pink-cloud-table' }, hero: 'balloon-pink', sprites: ['balloon-pink'], motion: 'rain', accent: '#ff9ccc' }),
  'moon-rabbit': V({ backdrop: { paint: 'moon-rabbit-table' }, hero: 'moon', heroSize: 1.2, motion: 'rise', accent: '#cdd8ff' }),
  'strawberry-parade': V({ backdrop: { paint: 'strawberry-parade-table' }, hero: 'strawberry-cake', sprites: ['strawberry', 'gift-box'], motion: 'cannons', accent: '#ff8fa3' }),
  'rose-ballroom': V({ backdrop: { paint: 'rose-ballroom-table' }, hero: 'crown', sprites: ['rose-red'], motion: 'crown', accent: '#f1cf8b' }),
  'real-rose': V({ backdrop: { photo: 'rose-1' }, hero: 'rose-bouquet', heroSize: 1.2, sprites: ['rose-petal-1', 'rose-petal-2'], motion: 'bloom', accent: '#f4c2a8' }),
  'neon-deepsea': V({ backdrop: { paint: 'neon-deepsea-table' }, hero: 'whale', heroSize: 1.3, sprites: ['soap-bubble'], motion: 'rise', accent: '#76efff' }),
  'sun-temple': V({ backdrop: { paint: 'sun-temple-table' }, hero: 'sun', heroSize: 1.3, motion: 'rise', accent: '#ffd46c' }),
  // 시즌 2
  champion: V({ backdrop: { scene: 'fireworks-3' }, hero: 'trophy', heroSize: 1.15, sprites: ['confetti'], motion: 'fireworks', fireworks: ['fireworks-3', 'fireworks-1'], accent: '#f2b544' }),
  legend: V({ backdrop: { scene: 'aurora' }, hero: 'crown', motion: 'crown', accent: '#9ef0c8', zoom: true }),
  'curtain-call': V({ backdrop: { scene: 'stage-curtain' }, hero: 'rose-bouquet', heroSize: 1.15, sprites: ['rose-red', 'rose-red', 'rose-pink'], motion: 'curtain', accent: '#ffcf7a' }),
  'rose-fireworks': V({ backdrop: { scene: 'fireworks-2' }, hero: 'rose-red', heroSize: 1.1, motion: 'fireworks', fireworks: ['fireworks-2', 'fireworks-1'], accent: '#ff5d73' }),
  'million-roses': V({ backdrop: { scene: 'rose-field' }, hero: 'rose-bouquet', heroSize: 1.25, sprites: ['rose-red', 'rose-pink', 'rose-white'], motion: 'bloom', accent: '#ff5d73', zoom: true }),
  'golden-rose': V({ backdrop: { scene: 'ballroom-mirrors' }, hero: 'rose-gold', heroSize: 1.2, motion: 'rise', accent: '#ffd67a' }),
  'black-rose': V({ backdrop: { scene: 'card-room' }, hero: 'rose-black', heroSize: 1.2, sprites: ['smoke'], motion: 'rise', accent: '#d8c7a0' }),
  versailles: V({ backdrop: { scene: 'ballroom-mirrors' }, hero: 'crown', motion: 'crown', accent: '#f3cf7a', zoom: true }),
  'box-wedding': V({ backdrop: { scene: 'patisserie' }, hero: 'wedding-cake', heroSize: 1.25, sprites: ['rose-petal-1', 'rose-petal-2'], motion: 'rise', accent: '#ffd1dc', zoom: true }),
  'box-teddy': V({ hero: 'teddy-family', heroSize: 1.15, sprites: ['teddy-red-bow', 'teddy-angel', 'teddy-sweater'], motion: 'cannons', accent: '#e8b48a' }),
  obsidian: V({ backdrop: { scene: 'night-city' }, hero: 'diamond', heroSize: 1.1, motion: 'rise', accent: '#c9d3e6' }),
};

// ── 장난감(탁자 위 실물) — 끌어 던지고 누르면 움직이며 소리 · 대사
// motion: wobble(흔들) · spin(돎) · hop(뜀) · roll(구름) · launch(솟음) · bloom(피어나듯 커짐) · fountain(물 · 꽃이 솟음)
const T = (o) => ({ size: 1, sound: 'pluck', lines: ['!'], burst: [], motion: 'wobble', ...o });

export const TOYS = {
  custard: T({ img: 'strawberry', sound: 'drop', lines: ['새콤달콤!', '딸기 한 입', '또 눌러 줘!'], motion: 'hop' }),
  star: T({ img: 'gold-star', sound: 'glass', lines: ['반짝!', '빙글!', '별 하나'], motion: 'spin' }),
  rose: T({ img: 'rose-red', sound: 'pluck', lines: ['향긋!', '장미 한 송이', '사랑을 담아'], burst: ['rose-petal-1'], motion: 'bloom' }),
  'cafe-bear': T({ img: 'teddy-bear', sound: 'bong', lines: ['어서 오세요!', '푸딩 한 입?', '꼭 안아 줘'], motion: 'hop' }),
  'star-cat': T({ img: 'cat', sound: 'pluck', lines: ['냐옹', '골골골', '쓰담쓰담'], motion: 'hop' }),
  'ufo-pet': T({ img: 'ufo', sound: 'glitch', lines: ['삐빅!', '외계 신호 수신', '슈우웅'], motion: 'launch' }),
  unicorn: T({ img: 'white-horse', sound: 'glass', lines: ['히힝!', '꿈빛 왕국으로', '반짝반짝'], motion: 'hop' }),
  'rose-musicbox': T({ img: 's1-rose-musicbox', size: 1.25, sound: 'music', lines: ['딩딩딩', '태엽 감기!', '장미 왈츠'], burst: ['rose-petal-2'], motion: 'spin' }),
  'rose-teacup': T({ img: 's1-peach-rose', size: 1.15, sound: 'glass', lines: ['살랑!', '이슬 톡!', '꽃잎 팡!'], burst: ['rose-petal-2'], motion: 'bloom' }),
  'crimson-clockwork': T({ img: 's1-crimson-rose', size: 1.15, sound: 'pluck', lines: ['활짝!', '진홍 팡!', '꽃잎 폭발!'], burst: ['rose-petal-1'], motion: 'bloom' }),
  'royal-flower-fountain': T({ img: 's1-royal-fountain', size: 1.5, sound: 'fountain', lines: ['촤르르르!', '꽃정원 만개!', '무지개 분수 팡!'], burst: ['water-splash', 'rose-petal-2'], motion: 'fountain' }),
  die: T({ img: 'dice', sound: 'die', lines: ['데구르르!'], motion: 'roll' }),
  mask: T({ img: 'venetian-mask', sound: 'glass', lines: ['가면무도회', '누구게요?', '쉿'], motion: 'wobble' }),
  whale: T({ img: 'whale', size: 1.2, sound: 'fountain', lines: ['푸우!', '물줄기 발사', '고래 등장'], burst: ['water-splash'], motion: 'hop' }),
  // 시즌 2 — 장미 · 꽃 · 고급 소품
  'rose-dome': T({ img: 'rose-dome', size: 1.25, sound: 'music', lines: ['마지막 꽃잎까지', '유리 돔 속 장미', '시들지 않아요'], burst: ['rose-petal-1'], motion: 'bloom' }),
  'rose-bouquet': T({ img: 'rose-bouquet', size: 1.3, sound: 'pluck', lines: ['꽃다발 받아요', '오늘의 주인공', '향기 가득'], burst: ['rose-petal-1', 'rose-petal-2'], motion: 'wobble' }),
  'rose-vase': T({ img: 'rose-vase', size: 1.35, sound: 'glass', lines: ['물 갈아 줄게요', '활짝 피었어요', '장미 한 다발'], burst: ['rose-petal-2'], motion: 'wobble' }),
  'rose-gold': T({ img: 'rose-gold', size: 1.15, sound: 'glass', lines: ['황금 장미', '번쩍!', '영원히 피어 있어요'], motion: 'spin' }),
  'rose-black': T({ img: 'rose-black', size: 1.1, sound: 'pluck', lines: ['흑장미', '신비로워요', '…'], burst: ['rose-petal-1'], motion: 'bloom' }),
  'rose-white': T({ img: 'rose-white', size: 1.1, sound: 'pluck', lines: ['하얀 장미', '순수한 마음', '살랑'], burst: ['rose-petal-3'], motion: 'bloom' }),
  'rose-teacup-s1': T({ img: 's1-rose-teacup', size: 1.25, sound: 'glass', lines: ['장미 홍차 한 잔', '따뜻해요', '후우'], burst: ['rose-petal-2'], motion: 'wobble' }),
  'rose-clockwork-s1': T({ img: 's1-clockwork-rose', size: 1.25, sound: 'music', lines: ['째깍째깍', '태엽 장미', '활짝!'], burst: ['rose-petal-1'], motion: 'spin' }),
  perfume: T({ img: 'perfume', size: 1.05, sound: 'glass', lines: ['칙!', '장미 향수', '은은해요'], burst: ['rose-petal-3'], motion: 'wobble' }),
  'music-box': T({ img: 'gramophone', size: 1.2, sound: 'music', lines: ['옛 노래 한 곡', '바늘을 올려요', '지지직… 딩동'], motion: 'wobble' }),
  'pocket-watch': T({ img: 'pocket-watch', sound: 'glass', lines: ['째깍', '시간이 됐어요', '내 차례!'], motion: 'spin' }),
  teacup: T({ img: 'teacup', sound: 'glass', lines: ['차 한 잔', '홀짝', '향긋해요'], motion: 'wobble' }),
  macarons: T({ img: 'macarons', sound: 'drop', lines: ['달콤!', '한 입만', '바삭'], motion: 'hop' }),
  champagne: T({ img: 'champagne', size: 1.1, sound: 'glass', lines: ['건배!', '축하해요', '뽀글뽀글'], burst: ['soap-bubble'], motion: 'wobble' }),
  crown: T({ img: 'crown', sound: 'glass', lines: ['왕관을 써요', '오늘의 왕', '반짝'], motion: 'spin' }),
  candelabra: T({ img: 'candelabra', size: 1.35, sound: 'glass', lines: ['촛불 켜기', '은은한 빛', '무도회 시작'], motion: 'wobble' }),
  // 상자 전용 — 곰 인형 · 귀여운 친구들 · 디저트 · 꽃
  'teddy-rose': T({ img: 'teddy-rose', size: 1.25, sound: 'bong', lines: ['장미 받아요', '꼭 안아 줄게요', '오늘도 수고했어요'], burst: ['rose-petal-1'], motion: 'hop' }),
  'teddy-red-bow': T({ img: 'teddy-red-bow', size: 1.1, sound: 'bong', lines: ['안녕!', '리본 예쁘죠', '곰곰'], motion: 'hop' }),
  'teddy-angel': T({ img: 'teddy-angel', size: 1.15, sound: 'glass', lines: ['날개 달린 곰', '행운을 빌어요', '사뿐'], motion: 'launch' }),
  'teddy-family': T({ img: 'teddy-family', size: 1.3, sound: 'bong', lines: ['곰 가족', '아기 곰도 왔어요', '다 같이 응원해요'], motion: 'hop' }),
  'teddy-sweater': T({ img: 'teddy-sweater', size: 1.1, sound: 'bong', lines: ['따뜻해요', '스웨터 새로 샀어요', '포근포근'], motion: 'wobble' }),
  samoyed: T({ img: 'samoyed', size: 1.2, sound: 'pluck', lines: ['멍!', '꼬리 살랑', '쓰다듬어 줘요'], motion: 'hop' }),
  hedgehog: T({ img: 'hedgehog', size: 0.95, sound: 'drop', lines: ['또르르', '가시는 말랑해요', '킁킁'], motion: 'roll' }),
  capybara: T({ img: 'capybara', size: 1.1, sound: 'bong', lines: ['느긋하게', '온천 가고 싶다', '…'], motion: 'wobble' }),
  duckling: T({ img: 'duckling', size: 0.95, sound: 'pluck', lines: ['꽥!', '삐약 아니고 꽥', '뒤뚱뒤뚱'], motion: 'hop' }),
  kitten: T({ img: 'kitten', size: 1, sound: 'pluck', lines: ['야옹', '골골골', '꾹꾹이'], motion: 'hop' }),
  matryoshka: T({ img: 'matryoshka', size: 1.1, sound: 'glass', lines: ['안에 또 있어요', '장미 무늬', '하나, 둘, 셋'], motion: 'wobble' }),
  'wedding-cake': T({ img: 'wedding-cake', size: 1.35, sound: 'glass', lines: ['장미 웨딩 케이크', '세 단이에요', '축하해요'], burst: ['rose-petal-2'], motion: 'wobble' }),
  'macaron-tower': T({ img: 'macaron-tower', size: 1.2, sound: 'drop', lines: ['마카롱 탑', '하나만 빼 먹을까', '바삭 쫀득'], motion: 'wobble' }),
  kulich: T({ img: 'kulich', size: 1.05, sound: 'drop', lines: ['쿨리치', '러시아 부활절 빵', '달콤한 설탕옷'], motion: 'hop' }),
  halva: T({ img: 'halva', size: 1, sound: 'drop', lines: ['피스타치오 할바', '고소해요', '사르르'], motion: 'wobble' }),
  'upside-down-cake': T({ img: 'upside-down-cake', size: 1.05, sound: 'drop', lines: ['뒤집힌 케이크', '파인애플 가득', '캐러멜 향'], motion: 'roll' }),
  'jelly-cake': T({ img: 'jelly-cake', size: 1.1, sound: 'drop', lines: ['키위 젤리', '탱글탱글', '상큼해요'], motion: 'wobble' }),
  parfait: T({ img: 'parfait', size: 1.05, sound: 'glass', lines: ['딸기 파르페', '한 숟갈', '차가워요'], motion: 'wobble' }),
  'lilac-vase': T({ img: 'lilac-vase', size: 1.2, sound: 'glass', lines: ['라일락 향기', '봄이 왔어요', '보랏빛'], motion: 'bloom' }),
  'violet-pot': T({ img: 'violet-pot', size: 1, sound: 'pluck', lines: ['바이올렛 화분', '물 줄 시간', '방긋'], motion: 'bloom' }),
  'water-lily': T({ img: 'water-lily', size: 1.05, sound: 'glass', lines: ['수련', '모네의 연못처럼', '동동'], burst: ['water-splash'], motion: 'bloom' }),
  campanula: T({ img: 'campanula', size: 1.05, sound: 'glass', lines: ['종 모양 꽃', '딸랑딸랑', '캄파눌라'], motion: 'bloom' }),
  carnation: T({ img: 'carnation', size: 1, sound: 'pluck', lines: ['카네이션', '감사해요', '분홍빛'], motion: 'bloom' }),
  poppy: T({ img: 'poppy', size: 1.05, sound: 'pluck', lines: ['양귀비', '빨간 꽃잎', '살랑'], motion: 'bloom' }),
  pansy: T({ img: 'pansy', size: 0.95, sound: 'pluck', lines: ['팬지', '나를 생각해 줘요', '보라 보라'], motion: 'bloom' }),
  camomile: T({ img: 'camomile', size: 1, sound: 'pluck', lines: ['캐모마일', '차 한 잔 할까요', '하얀 꽃'], motion: 'bloom' }),
  'tulips-white': T({ img: 'tulips-white', size: 1.15, sound: 'pluck', lines: ['흰 튤립', '새 출발', '깨끗한 마음'], motion: 'bloom' }),
  'bouquet-heart': T({ img: 'bouquet-heart', size: 1.25, sound: 'glass', lines: ['하트 장미 부케', '사랑을 담아', '두근'], burst: ['rose-petal-1', 'rose-petal-2'], motion: 'bloom' }),
  'galle-vase': T({ img: 'galle-vase', size: 1.2, sound: 'glass', lines: ['아르누보 꽃병', '유리 공예', '은은하게'], motion: 'wobble' }),
  globe: T({ img: 'globe', size: 1.15, sound: 'whoosh', lines: ['빙글빙글', '여행 가자', '어디로 갈까'], motion: 'spin' }),
};

const FALLBACK = { table: MAPS.classic, cardBack: BACKS.classic, cardFace: FACES.classic, effect: EFFECTS.classic, victory: VICTORIES.classic };
const BY_SLOT = { table: MAPS, cardBack: BACKS, cardFace: FACES, effect: EFFECTS, victory: VICTORIES };

export function lookOf(slot, key) {
  return BY_SLOT[slot]?.[key] || FALLBACK[slot] || null;
}
