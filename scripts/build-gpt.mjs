// GPT 로 만든 그림 넣기 — node scripts/build-gpt.mjs
// 선생님이 gpt그림/ 에 넣은 그림을 게임 크기로 줄여 public/assets/s2/r 에 넣고, src/data/gpt-art.js 에 있는 그림 목록을 적는다.
// 파일 이름은 앞 번호만 본다: 상대N · 나N(캐릭터) · 판NN(맵) · 뒷면NN(카드 뒷면) · 앞면NN(카드 앞면 테). 프롬프트는 docs/GPT-그림-프롬프트.md
// 같은 번호 파일이 여럿이면 가장 최근 것을 쓴다. 캐릭터 그림은 배경이 투명하지 않으면 가장자리 단색 배경을 지운다.
// 캐릭터는 파일 이름(상대 · 나)이 아니라 그림을 보고 누구인지 아래 표에 적는다. 상대로 쓸지 내 캐릭터로 쓸지는 src/data/characters.js · src/core/cosmetics.js 가 정한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'gpt그림');
const OUT = path.join(root, 'public/assets/s2/r');
const KINDS = { 상대: 'rival', 나: 'me', 판: 'map', 뒷면: 'back', 앞면: 'face' };
// 그림 속 캐릭터(11-24 선생님이 넣은 22장을 하나씩 보고 적음) → cut/char-<이름>.webp
const CHARACTER_FILES = {
  상대1: 'choonsik', 상대2: 'chiikawa', 상대3: 'hachiware', 상대4: 'usagi', 상대5: 'shinchan', 상대6: 'sakura', 상대7: 'rakko', 상대8: 'sailormoon',
  상대9: 'pochacco', 상대10: 'hangyodon', 상대11: 'hachuping', 상대12: 'keroro', 상대13: 'hellokitty', 상대14: 'rose-princess', 상대15: 'conan', 상대16: 'kid',
  나1: 'mymelody', 나2: 'kuromi', 나3: 'cinnamoroll', 나4: 'pompompurin', 나5: 'mangom', 나6: 'loopy',
};

fs.mkdirSync(SRC, { recursive: true });
const files = fs.readdirSync(SRC, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name))
  .map((entry) => {
    const match = entry.name.match(/^(상대|나|판|뒷면|앞면)\s*0*(\d+)/);
    if (!match) return null;
    const kind = KINDS[match[1]];
    const number = Number(match[2]);
    if (!number) return null;
    const full = path.join(SRC, entry.name);
    return { kind, number, label: `${match[1]}${number}`, file: full, time: fs.statSync(full).mtimeMs, name: entry.name };
  })
  .filter(Boolean);
const latest = new Map();
files.forEach((entry) => {
  const key = `${entry.kind}-${entry.number}`;
  if (!latest.has(key) || latest.get(key).time < entry.time) latest.set(key, entry);
});
const skipped = fs.readdirSync(SRC).filter((name) => /\.(png|jpe?g|webp)$/i.test(name) && !files.some((entry) => entry.name === name));

const pad = (number) => String(number).padStart(2, '0');

// 배경 지우기 — 네 가장자리 색의 평균과 가까운 색을 가장자리부터 이어서 투명하게(가운데 같은 색은 남김)
async function cutOut(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const at = (x, y) => (y * width + x) * 4;
  let transparent = 0;
  for (let index = 3; index < data.length; index += 4) if (data[index] < 250) transparent += 1;
  if (transparent > width * height * 0.02) return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const border = [];
  for (let x = 0; x < width; x += 4) border.push(at(x, 0), at(x, height - 1));
  for (let y = 0; y < height; y += 4) border.push(at(0, y), at(width - 1, y));
  const mean = [0, 1, 2].map((channel) => border.reduce((sum, index) => sum + data[index + channel], 0) / border.length);
  const close = (index) => Math.hypot(data[index] - mean[0], data[index + 1] - mean[1], data[index + 2] - mean[2]) < 38;
  const seen = new Uint8Array(width * height);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const cell = y * width + x;
    if (seen[cell] || !close(cell * 4)) return;
    seen[cell] = 1;
    queue.push(cell);
  };
  for (let x = 0; x < width; x += 1) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y += 1) { push(0, y); push(width - 1, y); }
  while (queue.length) {
    const cell = queue.pop();
    const x = cell % width;
    const y = (cell - x) / width;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  for (let cell = 0; cell < width * height; cell += 1) if (seen[cell]) data[cell * 4 + 3] = 0;
  // 가장자리를 1px 부드럽게
  const alpha = await sharp(data, { raw: { width, height, channels: 4 } }).extractChannel(3).blur(0.8).raw().toBuffer();
  for (let cell = 0; cell < width * height; cell += 1) data[cell * 4 + 3] = Math.min(data[cell * 4 + 3], alpha[cell]);
  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

const made = [];
for (const entry of [...latest.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.number - b.number)) {
  const source = sharp(entry.file).rotate();
  const meta = await source.metadata();
  if (entry.kind === 'map') {
    const key = `gpt-map-${pad(entry.number)}`;
    await sharp(entry.file).resize(1600, 1068, { fit: 'cover' }).webp({ quality: 82 }).toFile(path.join(OUT, 'paint', `${key}.webp`));
    const cropWidth = Math.min(meta.width, Math.round(meta.height * 2 / 3));
    await sharp(entry.file).extract({ left: Math.round((meta.width - cropWidth) / 2), top: 0, width: cropWidth, height: meta.height }).resize(720, 1080, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(OUT, 'paint', `${key}-m.webp`));
    await sharp(entry.file).resize(384, 256, { fit: 'cover' }).webp({ quality: 78 }).toFile(path.join(OUT, 'paint', `${key}-s.webp`));
    made.push(`map-${pad(entry.number)}`);
  } else if (entry.kind === 'back' || entry.kind === 'face') {
    const key = `gpt-${entry.kind}-${pad(entry.number)}`;
    await sharp(entry.file).resize(500, 750, { fit: 'cover' }).webp({ quality: 84 }).toFile(path.join(OUT, 'paint', `${key}.webp`));
    await sharp(entry.file).resize(150, 225, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(OUT, 'paint', `${key}-s.webp`));
    made.push(`${entry.kind}-${pad(entry.number)}`);
  } else {
    const who = CHARACTER_FILES[entry.label];
    if (!who) console.log(`누구인지 표에 없음: ${entry.name} → char-new-${entry.kind}-${entry.number} 로 넣음(scripts/build-gpt.mjs 의 CHARACTER_FILES 에 적어 주세요)`);
    const key = `char-${who || `new-${entry.kind}-${entry.number}`}`;
    const png = await cutOut(entry.file);
    const trimmed = await sharp(png).trim({ threshold: 1 }).png().toBuffer();
    await sharp(trimmed).resize(640, 640, { fit: 'inside' }).webp({ quality: 86, alphaQuality: 90 }).toFile(path.join(OUT, 'cut', `${key}.webp`));
    await sharp(trimmed).resize(200, 200, { fit: 'inside' }).webp({ quality: 82, alphaQuality: 88 }).toFile(path.join(OUT, 'cut', `${key}-s.webp`));
    made.push(key);
  }
  console.log(`넣음 ${entry.name} → ${made.at(-1)}`);
}

// 목록은 public 에 실제로 있는 그림으로 — 원본 폴더(gpt그림/, 저장소에 안 올림)가 없는 PC 에서 돌려도 넣어 둔 그림이 빠지지 않게
const list = [
  ...fs.readdirSync(path.join(OUT, 'paint')).map((name) => name.match(/^gpt-((?:map|back|face)-\d+)\.webp$/)?.[1]),
  ...fs.readdirSync(path.join(OUT, 'cut')).map((name) => name.match(/^(char-[a-z0-9-]+?)\.webp$/)?.[1]).filter((key) => key && !key.endsWith('-s')),
].filter(Boolean).sort();
fs.writeFileSync(path.join(root, 'src/data/gpt-art.js'), `// GPT 로 만든 그림 목록 — scripts/build-gpt.mjs 가 gpt그림/ 을 줄여 public 에 넣고 이 파일을 다시 쓴다(손으로 고치지 않음)\nexport const GPT_ART = Object.freeze(${JSON.stringify(list)});\nexport const hasGptArt = (key) => GPT_ART.includes(key);\n`);
console.log(`GPT 그림 ${list.length}장: ${list.join(', ') || '없음'}`);
if (skipped.length) console.log(`이름이 맞지 않아 건너뜀: ${skipped.join(', ')} (앞에 상대1 · 나1 · 판01 · 뒷면01 · 앞면01 처럼 번호를 붙여 주세요)`);
