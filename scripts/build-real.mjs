// 실사 에셋 줄이기 — node scripts/build-real.mjs [--force]
// .asset-cache/real 아래(받은 원본 · 시즌 1 그림 · 재질 사진)를 public/assets/s2 의 WebP 로 바꾼다.
//   t/<키>            재질 사진(타일)            1024
//   r/scene/<키>      맵 · 승리 배경 사진        1920×1080 · -m 휴대폰 세로 900×1600 · -s 384×216
//   r/paint/<키>      시즌 1 그림(탁자 장면 · 뒷면 · 앞면 틀)
//   r/back/<키>       카드 뒷면 그림             500×700 · -s 150×210
//   r/court/<묶음>/<키> 그림카드 · 에이스 · 조커  최대 420×560
//   r/cut/<키>        누끼(투명)                 최대 560 · -s 192
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

sharp.cache(false);
sharp.concurrency(1);
const SRC = path.resolve('.asset-cache/real');
const OUT = path.resolve('public/assets/s2');
const force = process.argv.includes('--force');
const ensure = (dir) => fs.mkdirSync(dir, { recursive: true });
const fresh = (file) => !force && fs.existsSync(file) && fs.statSync(file).size > 0;
const counts = {};
const note = (kind) => { counts[kind] = (counts[kind] || 0) + 1; };

async function make(input, output, pipeline) {
  if (!fs.existsSync(input) || fresh(output)) return false;
  ensure(path.dirname(output));
  await (await pipeline(sharp(input, { limitInputPixels: 80_000_000 }))).toFile(output);
  return true;
}
const webp = (quality, alpha = false) => (img) => img.webp({ quality, effort: 5, ...(alpha ? { alphaQuality: 90 } : {}) });

// 흰 종이 기준 「색 → 투명도」 — 흰색은 투명, 짙을수록 불투명(가장 짙은 채널 기준). 카드 종이 위에 섞기 없이 얹어도
// 곱하기(multiply)로 섞은 모습과 같다(흰 종이 위에서는 꼭 같고, 크림 종이에서 2~5% 차이 · 색을 뒤집는 어두운 앞면도 그대로).
// 11-25 안드로이드 WebView(카카오톡 · 네이버 앱)가 움직인 카드 안의 곱하기 섞기 그림을 그리지 못해 J Q K 가 비었다 → 그림카드에서 섞기를 없앰
async function whiteToAlpha(img) {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const alpha = 255 - Math.min(data[i], data[i + 1], data[i + 2]);
    if (alpha === 0) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 0; continue; }
    for (let c = 0; c < 3; c += 1) data[i + c] = Math.round(255 - ((255 - data[i + c]) * 255) / alpha);
    data[i + 3] = Math.round((alpha * data[i + 3]) / 255);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}

// 1) 재질 사진
for (const file of fs.existsSync(path.join(SRC, 'tex')) ? fs.readdirSync(path.join(SRC, 'tex')).filter((name) => name.endsWith('.jpg')) : []) {
  const key = file.replace(/\.jpg$/, '');
  if (await make(path.join(SRC, 'tex', file), path.join(OUT, 't', `${key}.webp`), (img) => webp(76)(img.resize(1024, 1024, { fit: 'cover' })))) note('재질');
}

// 2) 시즌 1 그림 — 탁자 장면 · 뒷면 · 앞면 틀 · 장난감
const S1 = path.join(SRC, 's1');
const S1_SCENES = ['moon-rabbit', 'neon-deepsea', 'pink-cloud', 'rose-ballroom', 'strawberry-parade', 'sun-temple'];
for (const name of S1_SCENES) {
  const table = path.join(S1, `2026-07-06-${name}-table.png`);
  const back = path.join(S1, `2026-07-06-${name}-card-back.png`);
  if (await make(table, path.join(OUT, 'r/paint', `${name}-table.webp`), (img) => webp(80)(img.resize(1600, 1068, { fit: 'cover' })))) note('시즌 1 그림');
  await make(table, path.join(OUT, 'r/paint', `${name}-table-m.webp`), (img) => webp(76)(img.resize(720, 1080, { fit: 'cover' })));
  await make(table, path.join(OUT, 'r/paint', `${name}-table-s.webp`), (img) => webp(70)(img.resize(384, 256, { fit: 'cover' })));
  if (await make(back, path.join(OUT, 'r/paint', `${name}-back.webp`), (img) => webp(82)(img.resize(500, 750, { fit: 'fill' })))) note('시즌 1 그림');
  await make(back, path.join(OUT, 'r/paint', `${name}-back-s.webp`), (img) => webp(72)(img.resize(150, 225, { fit: 'fill' })));
}
const rose = (kind) => path.join(S1, `2026-07-07-real-rose-garden-${kind}.png`);
await make(rose('table'), path.join(OUT, 'r/paint', 'real-rose-garden-table.webp'), (img) => webp(80)(img.resize(1600, 1280, { fit: 'cover' })));
await make(rose('table'), path.join(OUT, 'r/paint', 'real-rose-garden-table-m.webp'), (img) => webp(76)(img.resize(720, 1080, { fit: 'cover' })));
await make(rose('table'), path.join(OUT, 'r/paint', 'real-rose-garden-table-s.webp'), (img) => webp(70)(img.resize(384, 256, { fit: 'cover' })));
await make(rose('card-back'), path.join(OUT, 'r/paint', 'real-rose-garden-back.webp'), (img) => webp(82)(img.resize(500, 750, { fit: 'fill' })));
await make(rose('card-back'), path.join(OUT, 'r/paint', 'real-rose-garden-back-s.webp'), (img) => webp(72)(img.resize(150, 225, { fit: 'fill' })));
await make(rose('card-face'), path.join(OUT, 'r/paint', 'real-rose-face.webp'), (img) => webp(82)(img.resize(500, 750, { fit: 'fill' })));
const S1_TOYS = {
  's1-rose-musicbox': '2026-07-08-rose-musicbox.png',
  's1-peach-rose': '2026-07-08-cute-peach-rose.png',
  's1-crimson-rose': '2026-07-08-cute-crimson-rose.png',
  's1-rose-teacup': '2026-07-08-rose-teacup.png',
  's1-clockwork-rose': '2026-07-08-crimson-rose-clockwork.png',
  's1-royal-fountain': '2026-07-22-royal-flower-fountain.png',
};
for (const [key, file] of Object.entries(S1_TOYS)) {
  const input = path.join(S1, file);
  if (await make(input, path.join(OUT, 'r/cut', `${key}.webp`), (img) => webp(84, true)(img.trim({ threshold: 4 }).resize(560, 560, { fit: 'inside' })))) note('시즌 1 장난감');
  await make(input, path.join(OUT, 'r/cut', `${key}-s.webp`), (img) => webp(76, true)(img.trim({ threshold: 4 }).resize(192, 192, { fit: 'inside' })));
}

// 3) 카드 뒷면 그림(5:7)
const BACKS = path.join(SRC, 'backs/out');
for (const file of fs.existsSync(BACKS) ? fs.readdirSync(BACKS).filter((name) => /\.(jpe?g|png)$/i.test(name)) : []) {
  const key = file.replace(/\.(jpe?g|png)$/i, '');
  const input = path.join(BACKS, file);
  if (await make(input, path.join(OUT, 'r/back', `${key}.webp`), (img) => webp(82)(img.resize(500, 700, { fit: 'cover' })))) note('뒷면');
  await make(input, path.join(OUT, 'r/back', `${key}-s.webp`), (img) => webp(72)(img.resize(150, 210, { fit: 'cover' })));
}

// 4) 그림카드 · 에이스 · 조커 — 바탕은 whiteToAlpha 로 투명하게(장식 묶음 ornaments 는 화면에서 안 써서 그대로)
const COURTS = path.join(SRC, 'courts/out');
if (fs.existsSync(COURTS)) {
  for (const set of fs.readdirSync(COURTS).filter((name) => fs.statSync(path.join(COURTS, name)).isDirectory())) {
    for (const file of fs.readdirSync(path.join(COURTS, set)).filter((name) => /\.(png|jpe?g)$/i.test(name) && !/-full\./.test(name))) {
      const key = file.replace(/\.(png|jpe?g)$/i, '');
      const fit = (img) => img.resize(420, 560, { fit: 'inside' });
      if (await make(path.join(COURTS, set, file), path.join(OUT, 'r/court', set, `${key}.webp`), async (img) => webp(84, true)(set === 'ornaments' ? fit(img) : await whiteToAlpha(fit(img))))) note('그림카드');
    }
  }
}
// 레두테 장미로 그린 그림카드(보태니컬 카드) — 뒷면 그림에서 꽃 부분을 세로로
for (const [rank, plate] of [['K', 'redoute-01'], ['Q', 'redoute-04'], ['J', 'redoute-07']]) {
  const input = path.join(BACKS, `${plate}.jpg`);
  if (await make(input, path.join(OUT, 'r/court/redoute', `${rank}.webp`), async (img) => webp(84, true)(await whiteToAlpha(img.resize(420, 560, { fit: 'cover', position: 'attention' }))))) note('그림카드');
}

// 5) 맵 · 승리 배경 사진
const SCENES = path.join(SRC, 'scenes/out');
for (const file of fs.existsSync(SCENES) ? fs.readdirSync(SCENES).filter((name) => /\.jpe?g$/i.test(name) && !/-tall\.jpe?g$/i.test(name)) : []) {
  const key = file.replace(/\.jpe?g$/i, '');
  const input = path.join(SCENES, file);
  const tall = path.join(SCENES, `${key}-tall.jpg`);
  if (await make(input, path.join(OUT, 'r/scene', `${key}.webp`), (img) => webp(74)(img.resize(1920, 1080, { fit: 'cover' })))) note('배경 사진');
  await make(input, path.join(OUT, 'r/scene', `${key}-s.webp`), (img) => webp(66)(img.resize(384, 216, { fit: 'cover' })));
  await make(fs.existsSync(tall) ? tall : input, path.join(OUT, 'r/scene', `${key}-m.webp`), (img) => webp(70)(img.resize(900, 1600, { fit: 'cover', position: 'centre' })));
}

// 6) 누끼(투명 배경) — cutouts(1차) · cutouts2(상자 · 귀여운 것 · 디저트 · 꽃 · 고친 것)
const CUT_FILES = ['cutouts/out', 'cutouts2/out'].flatMap((dir) => {
  const full = path.join(SRC, dir);
  return fs.existsSync(full) ? fs.readdirSync(full).filter((name) => name.endsWith('.png')).map((name) => path.join(full, name)) : [];
});
for (const input of CUT_FILES) {
  const key = path.basename(input).replace(/\.png$/, '');
  if (await make(input, path.join(OUT, 'r/cut', `${key}.webp`), (img) => webp(84, true)(img.resize(560, 560, { fit: 'inside', withoutEnlargement: true })))) note('누끼');
  await make(input, path.join(OUT, 'r/cut', `${key}-s.webp`), (img) => webp(76, true)(img.resize(192, 192, { fit: 'inside', withoutEnlargement: true })));
}

// 7) 달 · 해 — NASA 사진(검은 배경)을 둥글게 오려 누끼로
for (const [key, file] of [['moon', 'moon-full.jpg'], ['sun', 'sun-sdo.jpg']]) {
  const input = path.join(SCENES, file);
  if (!fs.existsSync(input)) continue;
  for (const [suffix, size] of [['', 560], ['-s', 192]]) {
    const output = path.join(OUT, 'r/cut', `${key}${suffix}.webp`);
    if (fresh(output)) continue;
    ensure(path.dirname(output));
    const disc = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.47}" fill="#fff"/></svg>`);
    await sharp(input).resize(size, size, { fit: 'cover' }).composite([{ input: disc, blend: 'dest-in' }]).webp({ quality: 84, alphaQuality: 90 }).toFile(output);
    if (!suffix) note('달 · 해');
  }
}

console.log('만든 것', Object.entries(counts).map(([kind, count]) => `${kind} ${count}`).join(', ') || '없음(이미 있음)');
