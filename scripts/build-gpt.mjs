// GPT 로 만든 그림 넣기 — node scripts/build-gpt.mjs
// 선생님이 gpt그림/ 에 넣은 그림을 게임 크기로 줄여 public/assets/s2/r 에 넣고, src/data/gpt-art.js 에 있는 그림 목록을 적는다.
// 파일 이름은 앞 번호만 본다: 상대N · 나N(캐릭터) · 울음NN(우는 상대) · 승리NN(기뻐하는 내 캐릭터) · 판NN(맵) · 뒷면NN(카드 뒷면) · 앞면NN(카드 앞면 테)
// · 효과NN(카드 효과 조각 — 가로 3 × 세로 2 칸 스티커 판을 여섯 조각으로 잘라 cut/fx-<주제>-<1~6>) · 배경NN(승리 장면 배경 → paint/gpt-scene-NN). 프롬프트는 docs/GPT-그림-프롬프트.md
// 같은 번호 파일이 여럿이면 가장 최근 것을 쓴다. 캐릭터 그림은 배경이 투명하지 않으면 가장자리 단색 배경을 지운다.
// 캐릭터는 파일 이름(상대 · 나)이 아니라 그림을 보고 누구인지 아래 표에 적는다. 상대로 쓸지 내 캐릭터로 쓸지는 src/data/characters.js · src/core/cosmetics.js 가 정한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'gpt그림');
const OUT = path.join(root, 'public/assets/s2/r');
const KINDS = { 상대: 'rival', 나: 'me', 울음: 'cry', 승리: 'win', 판: 'map', 뒷면: 'back', 앞면: 'face', 효과: 'fx', 배경: 'scene' };
// 효과 스티커 판의 주제(11-24 선생님이 넣은 10장을 보고 적음) — 칸 번호는 왼쪽 위부터 오른쪽으로, 윗줄 다음 아랫줄
const FX_SHEETS = { 1: 'rose', 2: 'white', 3: 'pink', 4: 'lily', 5: 'cherry', 6: 'heart', 7: 'macaron', 8: 'teddy', 9: 'dubai', 10: 'jewel',
  // 11~18 은 11-24 저녁 둘째 묶음
  11: 'winter', 12: 'millefeuille', 13: 'versailles', 14: 'million', 15: 'moon', 16: 'pearl', 17: 'montblanc', 18: 'christmas' };
// 세로판(휴대폰 세로 화면용 판, 11-24) — 세로판NN 은 GPT 판NN, 세로판-<이름> 은 시즌 1 그림 판 → paint/tall-<그 판 그림>.webp
const TALL_S1 = { 핑크구름: 'pink-cloud-table', 달토끼: 'moon-rabbit-table', 딸기퍼레이드: 'strawberry-parade-table', 장미무도회: 'rose-ballroom-table', 리얼로즈: 'real-rose-garden-table', 네온심해: 'neon-deepsea-table', 태양신전: 'sun-temple-table' };
// 그림 속 캐릭터(11-24 선생님이 넣은 22장을 하나씩 보고 적음) → cut/char-<이름>.webp
const CHARACTER_FILES = {
  상대1: 'choonsik', 상대2: 'chiikawa', 상대3: 'hachiware', 상대4: 'usagi', 상대5: 'shinchan', 상대6: 'sakura', 상대7: 'rakko', 상대8: 'sailormoon',
  상대9: 'pochacco', 상대10: 'hangyodon', 상대11: 'hachuping', 상대12: 'keroro', 상대13: 'hellokitty', 상대14: 'rose-princess', 상대15: 'conan', 상대16: 'kid',
  나1: 'mymelody', 나2: 'kuromi', 나3: 'cinnamoroll', 나4: 'pompompurin', 나5: 'mangom', 나6: 'loopy',
  // 11-24 저녁 둘째 묶음(그림을 보고 적음 — 나9 · 나13 · 나14 는 GPT 가 그리지 않아 없음)
  나7: 'rilakkuma', 나8: 'korilakkuma', 나10: 'carebear', 나11: 'bellygom', 나12: 'little-prince', 나15: 'miffy', 나16: 'molang',
  // 승리 연출 표정(프롬프트 번호 그대로) — 우는 상대 → char-<이름>-cry, 기뻐하는 나 → char-<이름>-win
  울음1: 'chiikawa-cry', 울음2: 'hachiware-cry', 울음3: 'usagi-cry', 울음4: 'rakko-cry', 울음5: 'shinchan-cry', 울음6: 'sakura-cry', 울음7: 'conan-cry', 울음8: 'kid-cry',
  울음9: 'keroro-cry', 울음10: 'hachuping-cry', 울음11: 'kuromi-cry', 울음12: 'hellokitty-cry', 울음13: 'pochacco-cry', 울음14: 'hangyodon-cry', 울음15: 'rose-princess-cry',
  승리1: 'mymelody-win', 승리2: 'mangom-win', 승리3: 'sailormoon-win', 승리4: 'cinnamoroll-win', 승리5: 'pompompurin-win', 승리6: 'loopy-win', 승리7: 'choonsik-win',
};

// 보상 상자(11-25) — 배경이 이미 투명한 그림 → cut/chest-<이름>.webp
// 「미스터리상자-열림」도 「미스터리상자」로 시작하니 열린 그림부터 찾는다(그대로 두면 더 새 파일인 열린 그림이 닫힌 상자 자리를 덮었다, 11-25)
const CHEST_FILES = [[/^미스터리상자\s*[-_ ]?\s*열림/, '미스터리상자 열림', 'chest-mystery-open'], [/^미스터리상자/, '미스터리상자', 'chest-mystery']];

fs.mkdirSync(SRC, { recursive: true });
const files = fs.readdirSync(SRC, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name))
  .map((entry) => {
    const tall = entry.name.match(/^세로판\s*(?:0*(\d+)|-([^.]+))/);
    if (tall) {
      const target = tall[1] ? `gpt-map-${String(Number(tall[1])).padStart(2, '0')}` : TALL_S1[tall[2].trim()];
      if (!target) return null;
      const full = path.join(SRC, entry.name);
      return { kind: 'tall', number: 0, target, label: `세로판 ${target}`, file: full, time: fs.statSync(full).mtimeMs, name: entry.name };
    }
    const chest = CHEST_FILES.find(([pattern]) => pattern.test(entry.name));
    if (chest) {
      const full = path.join(SRC, entry.name);
      return { kind: 'chest', number: 0, target: chest[2], label: chest[1], file: full, time: fs.statSync(full).mtimeMs, name: entry.name };
    }
    const match = entry.name.match(/^(상대|나|울음|승리|판|뒷면|앞면|효과|배경)\s*0*(\d+)/);
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
  const key = entry.kind === 'tall' || entry.kind === 'chest' ? `${entry.kind}-${entry.target}` : `${entry.kind}-${entry.number}`;
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
  } else if (entry.kind === 'scene') {
    // 승리 장면 배경 — 맵과 같은 크기(화면을 덮음) + 보관함 미리 보기용 작은 그림
    const key = `gpt-scene-${pad(entry.number)}`;
    await sharp(entry.file).resize(1600, 1068, { fit: 'cover' }).webp({ quality: 82 }).toFile(path.join(OUT, 'paint', `${key}.webp`));
    await sharp(entry.file).resize(384, 256, { fit: 'cover' }).webp({ quality: 78 }).toFile(path.join(OUT, 'paint', `${key}-s.webp`));
    made.push(`scene-${pad(entry.number)}`);
  } else if (entry.kind === 'chest') {
    // 보상 상자 — 투명 가장자리만 다듬어 상자 칸(최대 230px · 휴대폰 2배)에 맞게
    const trimmed = await sharp(entry.file).trim({ threshold: 1 }).png().toBuffer();
    await sharp(trimmed).resize(480, 480, { fit: 'inside' }).webp({ quality: 88, alphaQuality: 92 }).toFile(path.join(OUT, 'cut', `${entry.target}.webp`));
    await sharp(trimmed).resize(160, 160, { fit: 'inside' }).webp({ quality: 82, alphaQuality: 88 }).toFile(path.join(OUT, 'cut', `${entry.target}-s.webp`));
    made.push(entry.target);
  } else if (entry.kind === 'tall') {
    // 휴대폰 세로 화면용 판 — 화면을 덮는 크기 하나. look-apply 가 tall-<판> 이 있으면 세로 화면에서 이 그림을 쓴다
    const key = `tall-${entry.target}`;
    await sharp(entry.file).resize(1024, 1536, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(OUT, 'paint', `${key}.webp`));
    made.push(key);
  } else if (entry.kind === 'fx') {
    // 스티커 판 — 3 × 2 칸을 하나씩 잘라 배경을 지우고(투명하지 않으면) 가장자리를 다듬는다
    const theme = FX_SHEETS[entry.number] || `sheet${entry.number}`;
    const cellW = Math.floor(meta.width / 3);
    const cellH = Math.floor(meta.height / 2);
    for (let cell = 0; cell < 6; cell += 1) {
      const piece = await sharp(entry.file).extract({ left: (cell % 3) * cellW, top: Math.floor(cell / 3) * cellH, width: cellW, height: cellH }).png().toBuffer();
      const clean = await cutOut(piece);
      const trimmed = await sharp(clean).trim({ threshold: 1 }).png().toBuffer();
      const key = `fx-${theme}-${cell + 1}`;
      await sharp(trimmed).resize(360, 360, { fit: 'inside' }).webp({ quality: 86, alphaQuality: 90 }).toFile(path.join(OUT, 'cut', `${key}.webp`));
      await sharp(trimmed).resize(120, 120, { fit: 'inside' }).webp({ quality: 82, alphaQuality: 88 }).toFile(path.join(OUT, 'cut', `${key}-s.webp`));
    }
    made.push(`fx-${theme}`);
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
  ...fs.readdirSync(path.join(OUT, 'paint')).map((name) => name.match(/^gpt-((?:map|back|face|scene)-\d+)\.webp$/)?.[1]),
  ...fs.readdirSync(path.join(OUT, 'paint')).map((name) => name.match(/^(tall-[a-z0-9-]+)\.webp$/)?.[1]),
  ...fs.readdirSync(path.join(OUT, 'cut')).map((name) => name.match(/^((?:char|fx|chest)-[a-z0-9-]+?)\.webp$/)?.[1]).filter((key) => key && !key.endsWith('-s')),
].filter(Boolean).sort();
fs.writeFileSync(path.join(root, 'src/data/gpt-art.js'), `// GPT 로 만든 그림 목록 — scripts/build-gpt.mjs 가 gpt그림/ 을 줄여 public 에 넣고 이 파일을 다시 쓴다(손으로 고치지 않음)\nexport const GPT_ART = Object.freeze(${JSON.stringify(list)});\nexport const hasGptArt = (key) => GPT_ART.includes(key);\n`);
console.log(`GPT 그림 ${list.length}장: ${list.join(', ') || '없음'}`);
if (skipped.length) console.log(`이름이 맞지 않아 건너뜀: ${skipped.join(', ')} (앞에 상대1 · 나1 · 판01 · 뒷면01 · 앞면01 처럼 번호를 붙여 주세요)`);
