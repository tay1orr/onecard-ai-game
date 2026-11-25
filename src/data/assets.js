// 에셋 주소 — public/assets/s2 (출처: docs/ASSET-CREDITS.md)
const BASE = `${import.meta.env?.BASE_URL || '/'}assets/s2`.replace(/\/{2,}/g, '/');
const suffix = (variant) => (variant ? `-${variant}` : '');

export const img = (key) => `${BASE}/m/${key}.webp`; // Fluent 3D(반응 스티커만)
export const anim = (key) => `${BASE}/a/${key}.webp`;
export const tex = (key) => `${BASE}/t/${key}.webp`; // 실제 재질 사진(CC0)
export const photo = (key, kind = 'card') => `${BASE}/p/${key}-${kind}.webp`; // 선생님 장미 사진
export const sfxUrl = (key) => `${BASE}/sfx/${key}.mp3`;
export const musicUrl = (file) => `${BASE}/bgm/${file}.mp3`; // 배경음악(src/data/music.js)

// 실사 에셋 — 맵 배경 사진 · 시즌 1 그림 · 카드 뒷면 그림 · 그림카드 · 누끼
export const scene = (key, variant) => `${BASE}/r/scene/${key}${suffix(variant)}.webp`; // 1920 · -m 휴대폰 세로 · -s 작은 그림
export const paint = (key, variant) => `${BASE}/r/paint/${key}${suffix(variant)}.webp`; // 시즌 1 그림(탁자 장면 · 앞면 틀)
export const backArt = (key, variant) => `${BASE}/r/back/${key}${suffix(variant)}.webp`; // 카드 뒷면 그림 · -s 작은 그림
export const court = (set, key) => `${BASE}/r/court/${set}/${key}.webp`; // 그림카드 · 에이스 · 조커
export const cut = (key, variant) => `${BASE}/r/cut/${key}${suffix(variant)}.webp`; // 누끼(투명 배경) · -s 작은 그림

// 움직이는 판이 있는 그림(Fluent Emoji Animated) — 반응 스티커에만 남김
export const ANIMATED = new Set([
  'partying', 'rofl', 'star-struck', 'steam', 'crying', 'screaming', 'sunglasses',
]);

// "photo:rose-2" 처럼 선생님 사진을, "cut:rose-red" 처럼 누끼를 가리키는 값도 받는다
export function artUrl(value, kind = 'card') {
  if (!value || value === 'none' || value === 'suit') return null;
  if (value.startsWith('photo:')) return photo(value.slice(6), kind);
  if (value.startsWith('cut:')) return cut(value.slice(4));
  if (value.startsWith('court:')) {
    const [set, key] = value.slice(6).split('/');
    return court(set, key);
  }
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
