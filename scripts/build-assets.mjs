// 시즌 2 에셋 줄이기 — node scripts/build-assets.mjs <받은 폴더> <내보낼 폴더> [--animated]
// 그림은 WebP, 소리는 MP3 로 바꿔 public/assets/s2 아래에 둔다.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { FLUENT_ANIMATED, FLUENT_STATIC, JINGLES } from './asset-list.mjs';

const run = promisify(execFile);
const [srcArg = '.asset-cache', outArg = 'public/assets/s2'] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const SRC = path.resolve(srcArg);
const OUT = path.resolve(outArg);
const withAnimated = process.argv.includes('--animated');
const ROOT = path.resolve('.');

const ensure = (dir) => fs.mkdirSync(dir, { recursive: true });
const fresh = (target) => fs.existsSync(target) && fs.statSync(target).size > 0;

async function pool(items, size, worker) {
  let index = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  }));
}

// 1) Fluent 3D 정지 그림 → 256px WebP
ensure(path.join(OUT, 'm'));
await pool(Object.keys(FLUENT_STATIC), 6, async (key) => {
  const input = path.join(SRC, 'fluent-3d', `${key}.png`);
  const output = path.join(OUT, 'm', `${key}.webp`);
  if (!fs.existsSync(input) || fresh(output)) return;
  await sharp(input).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 86, alphaQuality: 92, effort: 5 }).toFile(output);
});

// 2) 질감 → WebP
// 나머지 재질(벨벳 · 대리석 · 원목 · 금속 …)은 scripts/fetch-textures.mjs → build-real.mjs 가 만든다
const textures = {
  felt: ['felt/felt_grey.jpg', 1024],
};
ensure(path.join(OUT, 't'));
for (const [name, [file, size]] of Object.entries(textures)) {
  const input = path.join(SRC, file);
  const output = path.join(OUT, 't', `${name}.webp`);
  if (!fs.existsSync(input) || fresh(output)) continue;
  await sharp(input).resize(size, size, { fit: 'cover' }).webp({ quality: 78, effort: 5 }).toFile(output);
}

// 3) 선생님 장미 사진 → 리얼 로즈 테마
const roses = ['KakaoTalk_20260708_201207212_01.jpg', 'KakaoTalk_20260708_201207212_02.jpg', 'KakaoTalk_20260708_201207212_03.jpg'];
ensure(path.join(OUT, 'p'));
await pool(roses, 2, async (file) => {
  const input = path.join(ROOT, file);
  const index = roses.indexOf(file) + 1;
  if (!fs.existsSync(input)) return;
  const wide = path.join(OUT, 'p', `rose-${index}-wide.webp`);
  const card = path.join(OUT, 'p', `rose-${index}-card.webp`);
  if (!fresh(wide)) await sharp(input).rotate().resize(1600, 1000, { fit: 'cover', position: 'attention' }).webp({ quality: 76, effort: 5 }).toFile(wide);
  if (!fresh(card)) await sharp(input).rotate().resize(420, 600, { fit: 'cover', position: 'attention' }).webp({ quality: 80, effort: 5 }).toFile(card);
});

// 4) 소리 → MP3
const sounds = {
  'card-place-1': 'kenney-casino/Audio/card-place-1.ogg', 'card-place-2': 'kenney-casino/Audio/card-place-2.ogg',
  'card-place-3': 'kenney-casino/Audio/card-place-3.ogg', 'card-place-4': 'kenney-casino/Audio/card-place-4.ogg',
  'card-slide-1': 'kenney-casino/Audio/card-slide-1.ogg', 'card-slide-2': 'kenney-casino/Audio/card-slide-2.ogg',
  'card-slide-3': 'kenney-casino/Audio/card-slide-3.ogg', 'card-slide-5': 'kenney-casino/Audio/card-slide-5.ogg',
  'card-shove-1': 'kenney-casino/Audio/card-shove-1.ogg', 'card-shove-3': 'kenney-casino/Audio/card-shove-3.ogg',
  'card-fan-1': 'kenney-casino/Audio/card-fan-1.ogg', 'card-fan-2': 'kenney-casino/Audio/card-fan-2.ogg',
  'card-shuffle': 'kenney-casino/Audio/card-shuffle.ogg', 'pack-open': 'kenney-casino/Audio/cards-pack-open-1.ogg',
  'chip-lay-1': 'kenney-casino/Audio/chip-lay-1.ogg', 'chip-lay-2': 'kenney-casino/Audio/chip-lay-2.ogg',
  'chips-collide': 'kenney-casino/Audio/chips-collide-2.ogg', 'chips-stack': 'kenney-casino/Audio/chips-stack-3.ogg',
  'chips-handle': 'kenney-casino/Audio/chips-handle-4.ogg',
  'dice-shake': 'kenney-casino/Audio/dice-shake-1.ogg', 'dice-throw': 'kenney-casino/Audio/dice-throw-2.ogg',
  'die-throw': 'kenney-casino/Audio/die-throw-3.ogg',
  click: 'kenney-interface/Audio/click_002.ogg', select: 'kenney-interface/Audio/select_002.ogg',
  confirm: 'kenney-interface/Audio/confirmation_002.ogg', 'confirm-big': 'kenney-interface/Audio/confirmation_004.ogg',
  error: 'kenney-interface/Audio/error_006.ogg', open: 'kenney-interface/Audio/open_002.ogg',
  close: 'kenney-interface/Audio/close_002.ogg', toggle: 'kenney-interface/Audio/toggle_002.ogg',
  drop: 'kenney-interface/Audio/drop_002.ogg', glass: 'kenney-interface/Audio/glass_002.ogg',
  pluck: 'kenney-interface/Audio/pluck_002.ogg', bong: 'kenney-interface/Audio/bong_001.ogg',
  tick: 'kenney-interface/Audio/tick_002.ogg', glitch: 'kenney-interface/Audio/glitch_003.ogg',
  maximize: 'kenney-interface/Audio/maximize_006.ogg', minimize: 'kenney-interface/Audio/minimize_006.ogg',
  scratch: 'kenney-interface/Audio/scratch_003.ogg',
};
const jingleDir = path.join(SRC, 'kenney-jingles');
const jingleFiles = fs.existsSync(jingleDir)
  ? (await fs.promises.readdir(jingleDir, { recursive: true })).filter((file) => file.endsWith('.ogg'))
  : [];
const jingles = Object.fromEntries(Object.entries(JINGLES)
  .map(([name, base]) => [name, jingleFiles.find((file) => path.basename(file) === base)])
  .filter(([, file]) => file));
ensure(path.join(OUT, 'sfx'));
await pool(Object.entries({ ...sounds, ...jingles }), 3, async ([name, file]) => {
  const input = jingleFiles.includes(file) ? path.join(jingleDir, file) : path.join(SRC, file);
  const output = path.join(OUT, 'sfx', `${name}.mp3`);
  if (!fs.existsSync(input) || fresh(output)) return;
  const stereo = name.startsWith('jingle');
  await run('ffmpeg', ['-v', 'error', '-y', '-i', input, '-ac', stereo ? '2' : '1', '-ar', '44100', '-b:a', stereo ? '128k' : '96k', output]);
});

// 5) 움직이는 판 → 움직이는 WebP (오래 걸려서 --animated 일 때만)
if (withAnimated) {
  ensure(path.join(OUT, 'a'));
  await pool(FLUENT_ANIMATED, 2, async (key) => {
    const input = path.join(SRC, 'fluent-animated', `${key}.png`);
    const output = path.join(OUT, 'a', `${key}.webp`);
    if (!fs.existsSync(input) || fresh(output)) return;
    await run('ffmpeg', ['-v', 'error', '-y', '-i', input, '-vf', 'fps=15,scale=192:192:flags=lanczos',
      '-c:v', 'libwebp_anim', '-lossless', '0', '-quality', '66', '-compression_level', '4', '-loop', '0', output]);
    console.log(`움직이는 판 ${key}`);
  });
}

const count = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).length : 0);
console.log(`그림 ${count(path.join(OUT, 'm'))} · 질감 ${count(path.join(OUT, 't'))} · 사진 ${count(path.join(OUT, 'p'))} · 소리 ${count(path.join(OUT, 'sfx'))} · 움직이는 판 ${count(path.join(OUT, 'a'))}`);
