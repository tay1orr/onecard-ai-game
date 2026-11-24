// 찍은 미리보기를 한 장에 모아 보기 — node tests/e2e/audit-sheet.mjs <칸 폴더> [열 수] [칸 너비] [--t=t700]
// 결과: tests/e2e/_shots/audit/sheets/<칸>-<번호>.png (한 장에 열 수 × 3줄)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const suffix = (process.argv.find((arg) => arg.startsWith('--t=')) || '').slice(4);
const folder = args[0];
const cols = Number(args[1]) || 4;
const cellW = Number(args[2]) || 470;
const rows = 3;
const dir = path.join(root, 'tests/e2e/_shots/audit', folder);
const out = path.join(root, 'tests/e2e/_shots/audit/sheets');
fs.mkdirSync(out, { recursive: true });

const { COSMETICS } = await import(path.join(root, 'src/core/cosmetics.js').replace(/\\/g, '/').replace(/^([A-Z]):/, 'file:///$1:'));
const nameOf = (id) => COSMETICS.find((item) => item.id === id);
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const files = fs.readdirSync(dir).filter((file) => /^\d{3}-.+\.png$/.test(file))
  .filter((file) => (suffix ? file.endsWith(`-${suffix}.png`) : !/-t\d+\.png$/.test(file))).sort();
const first = await sharp(path.join(dir, files[0])).metadata();
const cellH = Math.round(cellW * (first.height / first.width));
const labelH = 34;
const perSheet = cols * rows;
for (let sheet = 0; sheet * perSheet < files.length; sheet += 1) {
  const chunk = files.slice(sheet * perSheet, (sheet + 1) * perSheet);
  const layers = [];
  for (const [index, file] of chunk.entries()) {
    const x = (index % cols) * (cellW + 8);
    const y = Math.floor(index / cols) * (cellH + labelH + 8);
    const image = await sharp(path.join(dir, file)).resize(cellW, cellH, { fit: 'contain', background: '#222' }).png().toBuffer();
    const id = file.replace(/^\d{3}-/, '').replace(/(-t\d+)?\.png$/, '');
    const item = nameOf(id);
    const label = `${file.slice(0, 3)} ${item ? item.name : id} · ${item?.threshold ?? (item?.pass ? `패스${item.pass}` : item?.boxRarity || '')}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="${labelH}"><rect width="100%" height="100%" fill="#111"/><text x="8" y="23" font-family="Malgun Gothic, sans-serif" font-size="17" fill="#fff">${esc(label)}</text></svg>`;
    layers.push({ input: image, left: x, top: y }, { input: Buffer.from(svg), left: x, top: y + cellH });
  }
  const width = cols * (cellW + 8) - 8;
  const height = Math.ceil(chunk.length / cols) * (cellH + labelH + 8) - 8;
  const file = path.join(out, `${folder}${suffix ? `-${suffix}` : ''}-${String(sheet + 1).padStart(2, '0')}.png`);
  await sharp({ create: { width, height, channels: 3, background: '#000' } }).composite(layers).png().toFile(file);
  console.log(file);
}
