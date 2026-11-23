// 시즌 2 원본 에셋 받기 — node scripts/fetch-assets.mjs <받을 폴더>
// 받은 파일은 git 에 올리지 않는다(.asset-cache). 이미 받은 것은 건너뛴다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { AMBIENTCG, FLUENT_ANIMATED, FLUENT_STATIC, OGA_FILES, OGA_PAGES } from './asset-list.mjs';

const OUT = path.resolve(process.argv[2] || '.asset-cache');
fs.mkdirSync(OUT, { recursive: true });

// Fluent 파일 이름: 소문자 · 빈칸은 _ · 붙임표는 그대로(star-struck_3d.png)
const fileName = (folder) => folder.toLowerCase().replace(/[^a-z0-9-]+/g, '_').replace(/^_|_$/g, '');

async function download(url, target, { minBytes = 200 } = {}) {
  if (fs.existsSync(target) && fs.statSync(target).size >= minBytes) return 'skip';
  fs.mkdirSync(path.dirname(target), { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'onecard-asset-fetch' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < minBytes) throw new Error(`too small (${buffer.length} bytes)`);
      fs.writeFileSync(target, buffer);
      return 'ok';
    } catch (error) {
      if (attempt === 3) throw new Error(`${url} → ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
  return 'fail';
}

async function pool(items, size, worker) {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: size }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      try { results.push(await worker(item)); } catch (error) { results.push(`FAIL ${error.message}`); }
    }
  });
  await Promise.all(runners);
  return results;
}

function extract(archive, targetDir) {
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length) return;
  fs.mkdirSync(targetDir, { recursive: true });
  // Git Bash 의 GNU tar 는 C: 를 원격 주소로 읽고 zip 도 못 푼다 → 윈도우 기본 bsdtar
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  execFileSync(tar, ['-xf', archive, '-C', targetDir]);
}

const staticJobs = Object.entries(FLUENT_STATIC).map(([key, folder]) => ({
  key,
  url: `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURIComponent(folder)}/3D/${fileName(folder)}_3d.png`,
  target: path.join(OUT, 'fluent-3d', `${key}.png`),
}));
const animatedJobs = FLUENT_ANIMATED.map((key) => {
  const folder = FLUENT_STATIC[key];
  return {
    key,
    url: `https://media.githubusercontent.com/media/microsoft/fluentui-emoji-animated/main/assets/${encodeURIComponent(folder)}/animated/${fileName(folder)}_animated.png`,
    target: path.join(OUT, 'fluent-animated', `${key}.png`),
    minBytes: 20000,
  };
});

console.log(`Fluent 3D ${staticJobs.length}개 · 움직이는 판 ${animatedJobs.length}개 받기…`);
const staticResults = await pool(staticJobs, 8, (job) => download(job.url, job.target).then((r) => `${r} ${job.key}`));
const animatedResults = await pool(animatedJobs, 4, (job) => download(job.url, job.target, { minBytes: job.minBytes }).then((r) => `${r} ${job.key}`));

for (const [name, url] of Object.entries(OGA_FILES)) {
  const ext = url.endsWith('.tar.gz') ? '.tar.gz' : '.zip';
  const archive = path.join(OUT, 'archives', `${name}${ext}`);
  await download(url, archive, { minBytes: 10000 });
  extract(archive, path.join(OUT, name));
}

for (const [name, page] of Object.entries(OGA_PAGES)) {
  const html = await (await fetch(page)).text();
  const zip = html.match(/https:\/\/opengameart\.org\/sites\/default\/files\/[^"'\s]+\.zip/)?.[0];
  if (!zip) { console.log(`못 찾음: ${name}`); continue; }
  const archive = path.join(OUT, 'archives', `${name}.zip`);
  await download(zip, archive, { minBytes: 10000 });
  extract(archive, path.join(OUT, name));
}

await pool(AMBIENTCG, 3, async (id) => {
  const archive = path.join(OUT, 'archives', `${id}_1K-JPG.zip`);
  await download(`https://ambientcg.com/get?file=${id}_1K-JPG.zip`, archive, { minBytes: 10000 });
  extract(archive, path.join(OUT, 'ambientcg', id));
  return id;
});

const failures = [...staticResults, ...animatedResults].filter((line) => line.startsWith('FAIL'));
console.log(`완료 — 실패 ${failures.length}개`);
failures.forEach((line) => console.log(line));
