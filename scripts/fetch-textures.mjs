// 실제 재질 사진(CC0) 받기 — node scripts/fetch-textures.mjs [.asset-cache/real/tex]
// Poly Haven(텍스처 · Diffuse 2k JPG) · ambientCG(1K-JPG 묶음에서 Color 만). 출처 기록은 docs/ASSET-CREDITS.md
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { REAL_TEXTURES } from './asset-list.mjs';

const OUT = path.resolve(process.argv[2] || '.asset-cache/real/tex');
const UA = { 'User-Agent': 'onecard-asset-fetch/1.0 (classroom project)' };
const TAR = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
fs.mkdirSync(path.join(OUT, 'zip'), { recursive: true });

async function save(url, target) {
  if (fs.existsSync(target) && fs.statSync(target).size > 5000) return 'skip';
  const response = await fetch(url, { headers: UA });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  return 'ok';
}

for (const [key, source] of Object.entries(REAL_TEXTURES)) {
  const target = path.join(OUT, `${key}.jpg`);
  if (fs.existsSync(target)) continue;
  try {
    if (source.polyhaven) {
      const files = await (await fetch(`https://api.polyhaven.com/files/${source.polyhaven}`, { headers: UA })).json();
      const map = files.Diffuse || files.diffuse || files.diff || files.Color;
      const url = map?.['2k']?.jpg?.url || map?.['1k']?.jpg?.url;
      if (!url) throw new Error(`Diffuse 없음: ${Object.keys(files).join(',')}`);
      await save(url, target);
    } else {
      const zip = path.join(OUT, 'zip', `${source.ambientcg}.zip`);
      await save(`https://ambientcg.com/get?file=${source.ambientcg}_1K-JPG.zip`, zip);
      const listing = execFileSync(TAR, ['-tf', zip], { encoding: 'utf8' }).split(/\r?\n/);
      const color = listing.find((name) => /_Color\.jpg$/i.test(name));
      if (!color) throw new Error('Color 지도 없음');
      execFileSync(TAR, ['-xf', zip, '-C', path.join(OUT, 'zip'), color]);
      fs.renameSync(path.join(OUT, 'zip', color), target);
    }
    console.log('받음', key);
  } catch (error) {
    console.log('실패', key, error.message);
  }
}
