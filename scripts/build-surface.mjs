// 사진 한 장 판 — 위에서 내려다본 꽃 · 테이블 사진(Pexels · Unsplash)을 원본으로 받아 맵 배경 크기로 줄인다.
// node scripts/build-surface.mjs [--force]
// 후보는 .asset-cache/real/surface/candidates-*.json(하위 작업이 골라 온 미리 보기), 고른 것은 아래 PICKS.
// 결과: public/assets/s2/r/scene/<키>.webp(1920×1080) · -m(휴대폰 세로 900×1600, focus 로 꽃 쪽을 남김) · -s(384×216)
// 출처: .asset-cache/real/surface/manifest.json → node scripts/credits.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '.asset-cache/real/surface');
const OUT = path.join(root, 'public/assets/s2/r/scene');
const force = process.argv.includes('--force');
const UA = 'asset-fetch/1.0';

// focus: 휴대폰 세로로 자를 때 가로 위치(0 왼쪽 ~ 1 오른쪽) — 꽃이 있는 쪽
export const PICKS = [
  { key: 'surf-tulips-white', from: 'tulips/07.jpg', focus: 0.78 },
  { key: 'surf-lavender', from: 'lavender/01.jpg', focus: 0.3 },
  { key: 'surf-water-lily', from: 'water-lily/08.jpg', focus: 0.7 },
  { key: 'surf-sunflower', from: 'sunflower/01.jpg', focus: 0.3 },
  { key: 'surf-hydrangea', from: 'hydrangea/01.jpg', focus: 0.32 },
  { key: 'surf-peony', from: 'peony/01.jpg', focus: 0.5 },
  { key: 'surf-lilac', from: 'lilac-wisteria/04.jpg', focus: 0.8 },
  { key: 'surf-cherry', from: 'cherry-blossom/01.jpg', focus: 0.75 },
  { key: 'surf-rose-white', from: 'rose-white-linen/01.jpg', focus: 0.5 },
  { key: 'surf-rose-apricot', from: 'rose-yellow-peach/01.jpg', focus: 0.68 },
  { key: 'surf-rose-pink', from: 'rose-pink-marble/02.jpg', focus: 0.5 },
  { key: 'surf-rose-red', from: 'rose-red-dark/07.jpg', focus: 0.3 },
  { key: 'surf-rose-night', from: 'rose-red-dark/02.jpg', focus: 0.72 },
  { key: 'surf-rose-petals', from: 'rose-petals/05.jpg', focus: 0.5 },
  { key: 'surf-white-blossom', from: 'cherry-blossom/06.jpg', focus: 0.55 },
  { key: 'surf-rose-border', from: 'black-rose/02.jpg', focus: 0.2 },
  { key: 'surf-rose-wreath', from: 'conservatory-marble/01.jpg', focus: 0.5 },
  { key: 'surf-dark-bloom', from: 'black-rose/03.jpg', focus: 0.35 },
  { key: 'surf-fairy-lights', from: 'picnic-night/01.jpg', focus: 0.5 },
  { key: 'surf-macarons', from: 'patisserie-pink/01.jpg', focus: 0.5 },
  { key: 'surf-cafe-pink', from: 'patisserie-pink/03.jpg', focus: 0.62 },
  { key: 'surf-peach', from: 'peach-soda/01.jpg', focus: 0.3 },
  { key: 'surf-sea-shells', from: 'sea-shells/01.jpg', focus: 0.78 },
];

const candidates = fs.readdirSync(SRC).filter((name) => /^candidates-.*\.json$/.test(name))
  .flatMap((name) => JSON.parse(fs.readFileSync(path.join(SRC, name), 'utf8')));
const metaFor = (from) => candidates.find((entry) => String(entry.file || '').replace(/\\/g, '/').endsWith(from));

function fullUrl(meta) {
  const url = String(meta.fullUrl || '');
  if (url.includes('images.pexels.com')) return `${url.split('?')[0]}?auto=compress&cs=tinysrgb&w=2400`;
  if (url.includes('images.unsplash.com')) return `${url.split('?')[0]}?w=2400&q=85&fm=jpg`;
  return url;
}

fs.mkdirSync(path.join(SRC, 'full'), { recursive: true });
const manifest = [];
for (const pick of PICKS) {
  const meta = metaFor(pick.from);
  if (!meta) throw new Error(`후보 정보 없음: ${pick.from}`);
  const full = path.join(SRC, 'full', `${pick.key}.jpg`);
  if (force || !fs.existsSync(full) || fs.statSync(full).size < 50000) {
    const response = await fetch(fullUrl(meta), { headers: { 'User-Agent': UA } });
    if (!response.ok) throw new Error(`받기 실패 ${response.status}: ${pick.key}`);
    fs.writeFileSync(full, Buffer.from(await response.arrayBuffer()));
  }
  const outFile = path.join(OUT, `${pick.key}.webp`);
  if (force || !fs.existsSync(outFile)) {
    const image = sharp(full).rotate();
    const { width, height } = await image.metadata();
    await sharp(full).rotate().resize(1920, 1080, { fit: 'cover' }).webp({ quality: 80 }).toFile(outFile);
    const cropWidth = Math.min(width, Math.round(height * 900 / 1600));
    const left = Math.round((width - cropWidth) * Math.min(1, Math.max(0, pick.focus ?? 0.5)));
    await sharp(full).rotate().extract({ left, top: 0, width: cropWidth, height }).resize(900, 1600, { fit: 'cover' }).webp({ quality: 78 }).toFile(path.join(OUT, `${pick.key}-m.webp`));
    await sharp(full).rotate().resize(384, 216, { fit: 'cover' }).webp({ quality: 76 }).toFile(path.join(OUT, `${pick.key}-s.webp`));
    console.log(`만듦 ${pick.key} ← ${pick.from}`);
  }
  manifest.push({
    key: pick.key,
    file: `full/${pick.key}.jpg`,
    title: decodeURIComponent(String(meta.pageUrl || '').split('/').filter(Boolean).pop() || pick.key).replace(/-/g, ' '),
    author: meta.photographer || '',
    license: meta.license || '',
    source_page: meta.pageUrl || '',
  });
}
fs.writeFileSync(path.join(SRC, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`사진 판 ${manifest.length}장 — 출처는 node scripts/credits.mjs`);
