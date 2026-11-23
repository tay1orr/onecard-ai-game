// 에셋 주소 — public/assets/s2 (출처: docs/ASSET-CREDITS.md)
const BASE = `${import.meta.env?.BASE_URL || '/'}assets/s2`.replace(/\/{2,}/g, '/');

export const img = (key) => `${BASE}/m/${key}.webp`;
export const anim = (key) => `${BASE}/a/${key}.webp`;
export const tex = (key) => `${BASE}/t/${key}.webp`;
export const photo = (key, kind = 'card') => `${BASE}/p/${key}-${kind}.webp`;
export const sfxUrl = (key) => `${BASE}/sfx/${key}.mp3`;

// 움직이는 판이 있는 그림(Fluent Emoji Animated)
export const ANIMATED = new Set([
  'sloth', 'cat-face', 'owl', 'wolf', 'dragon-face', 'teddy-bear', 'cat', 'flying-saucer', 'unicorn', 'fountain', 'star',
  'rocket', 'octopus', 'spouting-whale', 'crystal-ball', 'fire', 'high-voltage', 'party-popper', 'partying', 'rofl',
  'star-struck', 'steam', 'crying', 'screaming', 'sunglasses',
]);

// "photo:rose-2" 처럼 사진을 가리키는 값도 받는다
export function artUrl(value, kind = 'card') {
  if (!value || value === 'none' || value === 'suit') return null;
  if (value.startsWith('photo:')) return photo(value.slice(6), kind);
  return img(value);
}

const warmed = new Set();
export function warm(urls) {
  urls.filter(Boolean).forEach((url) => {
    if (warmed.has(url)) return;
    warmed.add(url);
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
  });
}
