// 배경음악 넣기 — node scripts/build-music.mjs
// 음악/ 폴더(저장소에 올리지 않음)에 곡을 넣고 돌리면 public/assets/s2/bgm/<장면>-<번호>.mp3 로 줄이고(스테레오 128k · 소리 크기 맞춤)
// src/data/music.js 를 다시 쓴다. 장면은 파일 이름 앞머리로 정한다:
//   로비- · lobby-  → 로비 · 친구 방       대전- · game-  → 대전 중
// 한 장면에 여러 곡을 넣으면 끝날 때마다 다음 곡, 한 곡이면 되풀이.
// 출처는 음악/목록.json — { "파일 이름": { "title": "곡 이름", "author": "만든 사람", "license": "CC0 · CC BY 4.0 …", "source": "주소" } }.
// 게임 안 출처 창에 나온다(없으면 파일 이름을 곡 이름으로). 음악/ 에서 뺀 곡은 bgm/ 에서도 지운다
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const SRC = path.resolve('음악');
const OUT = path.resolve('public/assets/s2/bgm');
const DATA = path.resolve('src/data/music.js');
const SCENES = [[/^(로비|lobby)[-_ ]/i, 'lobby'], [/^(대전|게임|game)[-_ ]/i, 'game']];
const AUDIO = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i;

fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const listFile = path.join(SRC, '목록.json');
const info = fs.existsSync(listFile) ? JSON.parse(fs.readFileSync(listFile, 'utf8')) : {};

const files = fs.readdirSync(SRC).filter((name) => AUDIO.test(name)).sort((a, b) => a.localeCompare(b, 'ko'));
const tracks = [];
const counts = {};
for (const name of files) {
  const scene = SCENES.find(([pattern]) => pattern.test(name))?.[1];
  if (!scene) { console.log(`건너뜀(이름 앞에 로비- 나 대전- 을 붙여 주세요): ${name}`); continue; }
  counts[scene] = (counts[scene] || 0) + 1;
  const file = `${scene}-${counts[scene]}`;
  await run('ffmpeg', ['-v', 'error', '-y', '-i', path.join(SRC, name), '-vn', '-ac', '2', '-ar', '44100',
    '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11', '-b:a', '128k', path.join(OUT, `${file}.mp3`)]);
  const meta = info[name] || {};
  tracks.push({
    scene, file,
    title: String(meta.title || name.replace(AUDIO, '').replace(SCENES.find(([pattern]) => pattern.test(name))[0], '')).trim(),
    author: String(meta.author || '').trim(),
    license: String(meta.license || '').trim(),
    source: String(meta.source || '').trim(),
  });
  console.log(`${file} ← ${name}`);
}

const keep = new Set(tracks.map((track) => `${track.file}.mp3`));
for (const old of fs.readdirSync(OUT)) if (!keep.has(old)) { fs.rmSync(path.join(OUT, old)); console.log(`지움: bgm/${old}`); }

const body = tracks.map((track) => `  Object.freeze(${JSON.stringify(track)}),`).join('\n');
fs.writeFileSync(DATA, `// 배경음악 목록 — node scripts/build-music.mjs 가 음악/ 폴더에서 만든다(손으로 고치지 않음).
// 비어 있으면 배경음악이 없고, 설정 창의 배경음악 줄도 보이지 않는다
export const MUSIC = Object.freeze([${body ? `\n${body}\n` : ''}]);
`);
const missing = tracks.filter((track) => !track.license);
console.log(`배경음악 ${tracks.length}곡(로비 ${counts.lobby || 0} · 대전 ${counts.game || 0})${missing.length ? ` — 출처가 비어 있는 곡 ${missing.length}: 음악/목록.json 에 적어 주세요` : ''}`);
