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

// 앞뒤 무음 — 곡 끝에서 처음으로 되풀이할 때 빈 틈이 짧게. 소리가 끝난 뒤 여운 0.5초만 남긴다(Kevin MacLeod 곡은 끝에 2초 정적이 있었음)
async function audibleRange(file) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'silencedetect=noise=-55dB:d=0.25', '-f', 'null', '-'], { maxBuffer: 1 << 24 });
  const [, h, m, sec] = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/) || [0, 0, 0, 0];
  const duration = Number(h) * 3600 + Number(m) * 60 + Number(sec);
  const starts = [...stderr.matchAll(/silence_start: (-?[\d.]+)/g)].map((match) => Number(match[1]));
  const ends = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map((match) => Number(match[1]));
  const start = starts.length && starts[0] <= 0.05 && ends.length ? Math.max(0, ends[0] - 0.05) : 0;
  const lastStart = starts.at(-1);
  const trailing = lastStart != null && lastStart > start && (ends.length < starts.length || ends.at(-1) >= duration - 0.05);
  return { start, end: trailing ? Math.min(duration, lastStart + 0.5) : duration, duration };
}

// 소리 크기 맞추기 — 두 번 잰다(한 번에 하면 곡의 셈여림이 눌림)
async function loudnormArgs(file, trim) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `${trim},loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { maxBuffer: 1 << 24 });
  const json = JSON.parse(stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1));
  return `loudnorm=I=-18:TP=-1.5:LRA=11:measured_I=${json.input_i}:measured_TP=${json.input_tp}:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}:offset=${json.target_offset}:linear=true`;
}

const files = fs.readdirSync(SRC).filter((name) => AUDIO.test(name)).sort((a, b) => a.localeCompare(b, 'ko'));
const tracks = [];
const counts = {};
for (const name of files) {
  const scene = SCENES.find(([pattern]) => pattern.test(name))?.[1];
  if (!scene) { console.log(`건너뜀(이름 앞에 로비- 나 대전- 을 붙여 주세요): ${name}`); continue; }
  counts[scene] = (counts[scene] || 0) + 1;
  const file = `${scene}-${counts[scene]}`;
  const input = path.join(SRC, name);
  const range = await audibleRange(input);
  const trim = `atrim=start=${range.start.toFixed(3)}:end=${range.end.toFixed(3)},asetpts=PTS-STARTPTS`;
  await run('ffmpeg', ['-v', 'error', '-y', '-i', input, '-vn', '-map_metadata', '-1', '-ac', '2',
    '-af', `${trim},${await loudnormArgs(input, trim)}`, '-ar', '44100', '-b:a', '128k', path.join(OUT, `${file}.mp3`)]);
  console.log(`${file} ← ${name}: ${range.duration.toFixed(1)}초 → ${(range.end - range.start).toFixed(1)}초(앞 ${range.start.toFixed(2)}초 · 뒤 ${(range.duration - range.end).toFixed(2)}초 무음 자름)`);
  const meta = info[name] || {};
  tracks.push({
    scene, file,
    title: String(meta.title || name.replace(AUDIO, '').replace(SCENES.find(([pattern]) => pattern.test(name))[0], '')).trim(),
    author: String(meta.author || '').trim(),
    license: String(meta.license || '').trim(),
    source: String(meta.source || '').trim(),
  });
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
