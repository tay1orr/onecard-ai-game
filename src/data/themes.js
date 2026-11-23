// 시즌 2 테마 — 꾸미기 아이템은 모두 테마 하나를 가리키고, 화면은 테마 값으로 그린다.
// motif 이름은 public/assets/s2/m/<이름>.webp (Fluent Emoji 3D · MIT)

const BASE = {
  felt: '#1d6b52', feltDeep: '#0b3528', rim: 'walnut', rimColor: null, cloth: 'none', clothColor: 'rgba(255,255,255,.08)',
  paper: '#fbf7ee', ink: '#1b1d24', red: '#c62f3b', accent: '#f2b544', accent2: '#ffffff', faceStyle: 'classic',
  back: { base: '#15223a', base2: '#1d2f4f', pattern: 'weave', line: 'rgba(242,181,68,.22)', frame: '#f2b544', emblem: 'text:ONE!' },
  court: { J: 'crossed-swords', Q: 'ring', K: 'crown' }, ace: 'suit',
  burst: ['spade', 'heart', 'diamond', 'club'], physics: 'fall', decor: [], hero: 'trophy', victory: 'classic', photo: null,
};

const T = (id, name, values) => {
  const theme = { ...BASE, ...values, id, name };
  theme.back = { ...BASE.back, ...(values.back || {}) };
  theme.court = { ...BASE.court, ...(values.court || {}) };
  return theme;
};

export const THEMES = Object.fromEntries([
  T('classic', '클래식', {}),
  T('strawberry-milk', '딸기우유', {
    paper: '#fffafb', ink: '#3b1d27', red: '#e04466', accent: '#ff8fab',
    back: { base: '#ffe3ea', base2: '#ffd3de', pattern: 'gingham', line: 'rgba(232,92,124,.32)', frame: '#ffffff', emblem: 'strawberry' },
    burst: ['strawberry', 'milk', 'ribbon'], physics: 'fall', hero: 'strawberry',
  }),
  T('cloud', '구름', {
    accent: '#9ad7ff', accent2: '#ffc6e6', burst: ['cloud', 'balloon', 'candy', 'lollipop'], physics: 'float',
    hero: 'lollipop', victory: 'rain',
  }),
  T('peach', '복숭아 소다', {
    felt: '#f2a27e', feltDeep: '#b7633f', rim: 'maple', cloth: 'stripes', clothColor: 'rgba(255,255,255,.16)',
    decor: ['peach', 'cup-with-straw', 'bubbles'], burst: ['peach', 'bubbles'], physics: 'float', accent: '#ffcf9e',
  }),
  T('bunny', '토끼 우편', {
    paper: '#fffdf8', ink: '#3a2f2a', red: '#e0566d', accent: '#f2a7b8',
    court: { J: 'carrot', Q: 'love-letter', K: 'rabbit' }, ace: 'rabbit-face',
  }),
  T('atlas', '고대 천체 지도', {
    back: { base: '#2b2116', base2: '#3e2e1b', pattern: 'compass', line: 'rgba(232,201,140,.34)', frame: '#d9b36c', emblem: 'compass', texture: 'kraft' },
    accent: '#d9b36c',
  }),
  T('manuscript', '왕립 필사본', {
    paper: '#f1e2c2', ink: '#3b2a18', red: '#9b2d20', accent: '#b8862f', faceStyle: 'parchment',
    court: { J: 'feather', Q: 'scroll', K: 'crown' }, ace: 'open-book',
  }),
  T('dessert-cafe', '딸기 디저트 카페', {
    felt: '#f0c3c3', feltDeep: '#c27f80', rim: 'maple', cloth: 'gingham', clothColor: 'rgba(214,58,79,.20)',
    decor: ['shortcake', 'hot-beverage', 'cupcake'], paper: '#fffaf5', ink: '#4a2a22', red: '#d63a4f', accent: '#ff9db0',
    court: { J: 'cupcake', Q: 'shortcake', K: 'birthday-cake' }, ace: 'strawberry',
    burst: ['strawberry', 'shortcake', 'cupcake'], hero: 'birthday-cake', victory: 'cannons',
  }),
  T('fireworks', '불꽃축제', {
    accent: '#ffcf5c', accent2: '#ff5c8a', burst: ['fireworks', 'sparkler', 'star'], hero: 'fireworks', victory: 'fireworks',
  }),
  T('star-candy', '별사탕', {
    back: { base: '#2a2350', base2: '#3a2f6b', pattern: 'stars', line: '#ffe27a', frame: '#ffd1f0', emblem: 'glowing-star' },
    burst: ['star', 'glowing-star'], physics: 'pop', accent: '#ffe27a',
  }),
  T('arcade', '네온 아케이드', {
    paper: '#16142c', ink: '#e9f1ff', red: '#ff4f8b', accent: '#5cf2ff', accent2: '#b46bff', faceStyle: 'scanline',
    court: { J: 'joystick', Q: 'alien-monster', K: 'robot' }, ace: 'video-game',
    burst: ['alien-monster', 'joystick', 'video-game'], physics: 'pixel', hero: 'trophy', victory: 'arcade',
  }),
  T('bauhaus', '바우하우스 1923', {
    back: { base: '#f0e7d3', base2: '#f0e7d3', pattern: 'bauhaus', line: '#1d1d1b', frame: '#1d1d1b', emblem: 'none' },
  }),
  T('night-picnic', '별빛 피크닉', {
    felt: '#27406a', feltDeep: '#0f1c33', rim: 'maple', cloth: 'gingham', clothColor: 'rgba(170,200,255,.12)',
    decor: ['basket', 'lantern', 'crescent-moon'], burst: ['star', 'shooting-star'], accent: '#ffe08a',
  }),
  T('deco', '블랙 골드 데코', {
    paper: '#151515', ink: '#e7c46a', red: '#e9a08c', accent: '#e7c46a', faceStyle: 'deco',
    court: { J: 'crossed-swords', Q: 'gem-stone', K: 'crown' }, ace: 'gem-stone',
  }),
  T('aurora', '오로라', { accent: '#7af0c8', accent2: '#9b8cff', physics: 'aurora', burst: ['sparkles'] }),
  T('confetti', '색종이 대포', {
    accent: '#ff6b6b', accent2: '#4dabf7', burst: ['confetti-ball', 'party-popper', 'balloon', 'ribbon'], hero: 'party-popper', victory: 'cannons',
  }),
  T('aquarium', '심해 수족관', {
    felt: '#0f5b78', feltDeep: '#062b3d', rim: 'color', rimColor: '#7cc6d8', cloth: 'waves', clothColor: 'rgba(160,235,255,.10)',
    decor: ['tropical-fish', 'coral', 'spiral-shell'], burst: ['tropical-fish', 'bubbles', 'blowfish'], physics: 'float', accent: '#8fe7ff',
  }),
  T('stone-temple', '태양신 석판', {
    paper: '#d9d1bf', ink: '#2d2a26', red: '#8f3b2e', accent: '#3aa58c', faceStyle: 'stone',
    court: { J: 'amphora', Q: 'hourglass', K: 'moai' }, ace: 'sun',
    back: { base: '#0e5a4a', base2: '#147a62', pattern: 'runes', line: 'rgba(183,240,220,.34)', frame: '#b7f0dc', emblem: 'classical-building' },
  }),
  T('rose-conservatory', '장미 온실', {
    felt: '#2f5d45', feltDeep: '#13291c', rim: 'color', rimColor: '#c9a45c', cloth: 'lattice', clothColor: 'rgba(233,200,120,.16)',
    decor: ['rose', 'teapot', 'bouquet'], paper: '#fff8f4', ink: '#2b1b1d', red: '#c0263e', accent: '#e7a2ad',
    court: { J: 'tulip', Q: 'rose', K: 'bouquet' }, ace: 'rose',
    back: { base: '#4a1520', base2: '#6b1d2c', pattern: 'damask', line: 'rgba(230,195,122,.30)', frame: '#e6c37a', emblem: 'rose' },
    burst: ['rose', 'hibiscus', 'tulip'], physics: 'swirl', hero: 'bouquet', victory: 'bloom',
  }),
  T('glass', '모던 글라스', {
    paper: '#eef4fb', ink: '#10233a', red: '#d23c5a', accent: '#7fd3ff', faceStyle: 'glass',
    court: { J: 'triangular-ruler', Q: 'gem-stone', K: 'crystal-ball' }, ace: 'crystal-ball',
  }),
  T('celestial', '초신성', {
    accent: '#ffd76b', accent2: '#8fa8ff', burst: ['star', 'comet', 'ringed-planet', 'shooting-star'], hero: 'glowing-star', victory: 'celestial',
  }),
  T('brass', '황동 궤도장치', {
    back: { base: '#3a2412', base2: '#5a3a1c', pattern: 'gears', line: 'rgba(217,162,92,.36)', frame: '#d9a25c', emblem: 'gear' },
  }),
  T('blueprint', '청사진 설계도', {
    paper: '#1d528f', ink: '#eef5ff', red: '#ffd0d0', accent: '#9fd0ff', faceStyle: 'blueprint',
    court: { J: 'straight-ruler', Q: 'triangular-ruler', K: 'gear' }, ace: 'compass',
  }),
  T('neon-concert', '네온 콘서트', {
    accent: '#ff4fd8', accent2: '#4ff0ff', burst: ['musical-notes', 'guitar', 'microphone'], hero: 'microphone', victory: 'laser',
  }),
  T('cherry', '벚꽃 소풍', {
    felt: '#efbfd0', feltDeep: '#c4839c', rim: 'maple', decor: ['cherry-blossom', 'dango', 'basket'],
    burst: ['cherry-blossom', 'dango'], physics: 'swirl', hero: 'cherry-blossom', victory: 'bloom', accent: '#ff9fc0',
  }),
  T('monochrome', '모노크롬 파동', {
    back: { base: '#121212', base2: '#262626', pattern: 'ripples', line: 'rgba(255,255,255,.34)', frame: '#d9d9d9', emblem: 'none' },
  }),
  T('ink', '수묵 산수', {
    paper: '#f4f0e6', ink: '#1a1a1a', red: '#b33a2a', accent: '#6b6b6b', faceStyle: 'ink',
    court: { J: 'tanabata-tree', Q: 'lantern', K: 'snow-capped-mountain' }, ace: 'snow-capped-mountain',
  }),
  T('space-whale', '우주 고래', {
    back: { base: '#0f1a3d', base2: '#1d2d66', pattern: 'stars', line: '#cfe0ff', frame: '#9cc8ff', emblem: 'spouting-whale' },
  }),
  T('library', '금서고 문장', {
    back: { base: '#3d1f18', base2: '#5a2e22', pattern: 'none', line: 'rgba(216,180,106,.3)', frame: '#d8b46a', emblem: 'books', texture: 'leather' },
  }),
  T('tarot', '왕실 타로', {
    paper: '#f6efe0', ink: '#2a1f3d', red: '#9e2a4b', accent: '#c9a227', faceStyle: 'tarot',
    court: { J: 'magic-wand', Q: 'crystal-ball', K: 'crown' }, ace: 'sun',
  }),
  T('dream', '꿈빛 왕국', {
    felt: '#8a74c9', feltDeep: '#3f2f73', rim: 'color', rimColor: '#f1d27a', cloth: 'stars', clothColor: 'rgba(255,240,190,.20)',
    decor: ['castle', 'unicorn', 'crown'], paper: '#fffaf0', ink: '#2c2350', red: '#d1426c', accent: '#ffd36e',
    court: { J: 'magic-wand', Q: 'unicorn', K: 'crown' }, ace: 'castle',
    back: { base: '#3b2f6e', base2: '#5a47a3', pattern: 'argyle', line: 'rgba(255,211,110,.30)', frame: '#ffd36e', emblem: 'crown' },
    burst: ['gem-stone', 'sparkles', 'crown'], physics: 'pop', hero: 'castle', victory: 'coronation',
  }),
  T('pink-cloud', '핑크 구름 팝', {
    felt: '#ffbcd9', feltDeep: '#e084b0', rim: 'color', rimColor: '#ffffff', cloth: 'dots', clothColor: 'rgba(255,255,255,.34)',
    decor: ['cloud', 'balloon', 'lollipop'], accent: '#ff7eb8',
    back: { base: '#ff9ccb', base2: '#ffc2e0', pattern: 'dots', line: 'rgba(255,255,255,.55)', frame: '#ffffff', emblem: 'cloud' },
    burst: ['cloud', 'growing-heart', 'balloon'], physics: 'float', hero: 'balloon', victory: 'rain',
  }),
  T('moon-rabbit', '달토끼 천문대', {
    felt: '#1f2c5e', feltDeep: '#0b1230', rim: 'color', rimColor: '#c9a45c', cloth: 'stars', clothColor: 'rgba(255,245,200,.16)',
    decor: ['crescent-moon', 'telescope', 'rabbit'], accent: '#f6e7a8',
    back: { base: '#121a40', base2: '#243170', pattern: 'constellation', line: 'rgba(240,232,200,.45)', frame: '#e8e3c8', emblem: 'crescent-moon' },
    burst: ['crescent-moon', 'star', 'rabbit'], physics: 'orbit', hero: 'full-moon', victory: 'celestial',
  }),
  T('strawberry-parade', '딸기 토이 퍼레이드', {
    felt: '#ff5d73', feltDeep: '#a8162e', rim: 'color', rimColor: '#fff4f4', cloth: 'stripes', clothColor: 'rgba(255,255,255,.14)',
    decor: ['strawberry', 'teddy-bear', 'balloon'], accent: '#ffe17a',
    back: { base: '#e8364f', base2: '#ff6b80', pattern: 'seeds', line: '#ffe17a', frame: '#ffffff', emblem: 'strawberry' },
    burst: ['strawberry', 'ribbon', 'wrapped-gift'], hero: 'strawberry', victory: 'cannons',
  }),
  T('rose-ballroom', '장미 무도회', {
    felt: '#5a0f1c', feltDeep: '#22040a', rim: 'color', rimColor: '#d8b35a', cloth: 'damask', clothColor: 'rgba(216,179,90,.12)',
    decor: ['rose', 'ring', 'gem-stone'], accent: '#d8b35a',
    back: { base: '#5a0f1c', base2: '#7a1a2b', pattern: 'damask', line: 'rgba(216,179,90,.34)', frame: '#d8b35a', emblem: 'rose' },
    burst: ['rose', 'sparkles'], physics: 'swirl', hero: 'crown', victory: 'bloom',
  }),
  T('real-rose', '리얼 로즈가든', {
    felt: '#2c3b2a', feltDeep: '#0d140c', rim: 'color', rimColor: '#c8a15a', photo: 'rose-1', accent: '#f2b8a2',
    paper: '#fffaf6', ink: '#2b1d1b', red: '#c2384a', faceStyle: 'photo',
    court: { J: 'photo:rose-3', Q: 'photo:rose-2', K: 'photo:rose-1' }, ace: 'photo:rose-2',
    back: { base: '#2b1d1b', base2: '#3b2824', pattern: 'photo', line: 'rgba(200,161,90,.4)', frame: '#c8a15a', emblem: 'none', photo: 'rose-2' },
    burst: ['rose', 'bouquet'], physics: 'swirl', hero: 'bouquet', victory: 'bloom',
  }),
  T('neon-deepsea', '네온 심해 도시', {
    felt: '#082040', feltDeep: '#020611', rim: 'color', rimColor: '#2fd6ff', cloth: 'circuit', clothColor: 'rgba(60,220,255,.14)',
    decor: ['jellyfish', 'octopus', 'coral'], accent: '#2fe3ff', accent2: '#ff5fd2',
    back: { base: '#061428', base2: '#0b2a4d', pattern: 'circuit', line: 'rgba(47,227,255,.45)', frame: '#7af0ff', emblem: 'jellyfish' },
    burst: ['jellyfish', 'bubbles', 'tropical-fish'], physics: 'float', hero: 'spouting-whale', victory: 'rise',
  }),
  T('sun-temple', '고대 태양 신전', {
    felt: '#c08a3c', feltDeep: '#6e4316', rim: 'marble', cloth: 'runes', clothColor: 'rgba(255,236,180,.12)',
    decor: ['sun', 'classical-building', 'amphora'], accent: '#ffe08a',
    back: { base: '#7a4e1c', base2: '#b07a2e', pattern: 'rays', line: 'rgba(255,224,138,.30)', frame: '#ffe08a', emblem: 'sun' },
    burst: ['sun', 'gem-stone', 'sparkles'], physics: 'pop', hero: 'sun', victory: 'sunburst',
  }),
  // 시즌 2 새 테마
  T('s2-arena', '시즌 2 아레나', {
    felt: '#14335a', feltDeep: '#06142a', rim: 'leather', cloth: 'arena', clothColor: 'rgba(242,181,68,.10)',
    decor: ['trophy', 'medal'], paper: '#fbf7ee', accent: '#f2b544',
    court: { J: 'medal', Q: 'sports-medal', K: 'trophy' }, ace: 'trophy', faceStyle: 'league',
    back: { base: '#0e1a2e', base2: '#162a4a', pattern: 'chevron', line: 'rgba(242,181,68,.28)', frame: '#f2b544', emblem: 'text:2' },
    burst: ['trophy', 'medal', 'sparkles'], hero: 'trophy', victory: 'champion',
  }),
  T('s2-holo', '시즌 2 홀로그램', {
    felt: '#191d33', feltDeep: '#07080f', rim: 'color', rimColor: '#b9c6ff', cloth: 'holo', clothColor: 'rgba(255,255,255,.08)',
    decor: ['crystal-ball', 'gem-stone'], paper: '#f3f5ff', ink: '#171a33', red: '#e0356a', accent: '#a9b8ff', accent2: '#ffb3e6',
    court: { J: 'magic-wand', Q: 'crystal-ball', K: 'gem-stone' }, ace: 'gem-stone', faceStyle: 'holo',
    back: { base: '#1a1e3a', base2: '#2b2f5c', pattern: 'holo', line: 'rgba(255,255,255,.3)', frame: '#d9e0ff', emblem: 'text:ONE!' },
    burst: ['gem-stone', 'sparkles', 'crystal-ball'], physics: 'pop', hero: 'crystal-ball', victory: 'celestial',
  }),
  T('spotlight', '스포트라이트', { accent: '#fff3c4', physics: 'spotlight', burst: ['sparkles'] }),
  T('thunder', '번개', { accent: '#ffe14d', accent2: '#7ad7ff', physics: 'thunder', burst: ['high-voltage', 'collision'] }),
  T('obsidian', '블랙 오닉스', {
    felt: '#1c1c22', feltDeep: '#050507', rim: 'marble', cloth: 'herringbone', clothColor: 'rgba(255,255,255,.05)',
    decor: ['gem-stone', 'crown'], paper: '#f4f4f6', ink: '#121215', red: '#b31b3a', accent: '#cfd6e6', faceStyle: 'deco',
    court: { J: 'crossed-swords', Q: 'ring', K: 'crown' }, ace: 'gem-stone',
    back: { base: '#0b0b0e', base2: '#18181d', pattern: 'herringbone', line: 'rgba(207,214,230,.22)', frame: '#cfd6e6', emblem: 'gem-stone' },
    burst: ['gem-stone', 'sparkles'], physics: 'pop', hero: 'gem-stone', victory: 'sunburst',
  }),
  T('toybox', '장난감', {}),
].map((theme) => [theme.id, theme]));

export function themeById(id) {
  return THEMES[id] || THEMES.classic;
}
