// 금속 금빛 입히기 — 누끼의 밝기만 뽑아 대비를 키운 뒤 금 그라데이션 지도(어두운 갈색 → 금 → 밝은 연금빛)에 맞춰 칠한다.
// 색만 돌리면(채널 섞기) 국방색처럼 칙칙해진다(11-24 선생님 지적). 금속은 명암 대비와 밝은 반사가 있어야 금으로 보인다.
// node scripts/gold-map.mjs <입력 png> <출력 png> [gold|rosegold|silver]
import sharp from 'sharp';

const PALETTES = {
  gold: [[0, '#0f0801'], [0.15, '#341f04'], [0.32, '#6b430a'], [0.48, '#a8731a'], [0.62, '#d29d2c'], [0.74, '#e9bd45'], [0.85, '#f7d873'], [0.94, '#fdeeb0'], [1, '#fffaf0']],
  rosegold: [[0, '#1d0c08'], [0.2, '#4a2219'], [0.4, '#8c4c3a'], [0.58, '#c27c62'], [0.72, '#e0a487'], [0.86, '#f5cdb6'], [1, '#fff3ea']],
  silver: [[0, '#0c0d10'], [0.2, '#2c2f36'], [0.42, '#5f646e'], [0.6, '#959aa4'], [0.76, '#c6cad1'], [0.9, '#e8eaee'], [1, '#ffffff']],
};

const hex = (value) => [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16));

function lut(palette) {
  const stops = PALETTES[palette].map(([at, color]) => [at, hex(color)]);
  return Array.from({ length: 256 }, (_, index) => {
    const t = index / 255;
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k += 1;
    const [a, ca] = stops[k];
    const [b, cb] = stops[k + 1];
    const f = Math.min(1, Math.max(0, (t - a) / (b - a)));
    return ca.map((channel, i) => Math.round(channel + (cb[i] - channel) * f));
  });
}

export async function goldMap(input, output, palette = 'gold') {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const count = info.width * info.height;
  const lum = new Float32Array(count);
  const seen = [];
  for (let p = 0; p < count; p += 1) {
    const r = data[p * 4]; const g = data[p * 4 + 1]; const b = data[p * 4 + 2]; const a = data[p * 4 + 3];
    // 빨강 · 초록이 많은 꽃잎 · 잎 모두 형태가 살게 최대 채널과 평균을 섞는다
    const value = 0.55 * Math.max(r, g, b) + 0.45 * (0.299 * r + 0.587 * g + 0.114 * b);
    lum[p] = value;
    if (a > 200) seen.push(value);
  }
  seen.sort((x, y) => x - y);
  const lo = seen[Math.floor(seen.length * 0.02)] || 0;
  const hi = seen[Math.floor(seen.length * 0.985)] || 255;
  const table = lut(palette);
  const out = Buffer.alloc(count * 4);
  for (let p = 0; p < count; p += 1) {
    let t = (lum[p] - lo) / Math.max(1, hi - lo);
    t = Math.min(1, Math.max(0, t));
    // S 곡선 — 어두운 곳은 더 깊게, 밝은 곳은 반사처럼 튀게
    t = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    // 1.3~1.6 사이가 금도금 장미처럼 보였다(1.0 은 크림색, 1.9 는 너무 어두움)
    t = Math.pow(t, 1.45);
    const color = table[Math.round(t * 255)];
    out[p * 4] = color[0]; out[p * 4 + 1] = color[1]; out[p * 4 + 2] = color[2]; out[p * 4 + 3] = data[p * 4 + 3];
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(output);
}

if (process.argv[1] && process.argv[1].endsWith('gold-map.mjs')) {
  const [input, output, palette] = process.argv.slice(2);
  await goldMap(input, output, palette || 'gold');
  console.log(output);
}
