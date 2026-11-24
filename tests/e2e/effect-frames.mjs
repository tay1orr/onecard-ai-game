// 카드 효과 프레임 찍기 — 개발 서버에서 실제 게임판 · 연출 코드로 카드를 낸 순간의 효과를 만들고, GSAP 시간을 멈춰 시각마다 더미 둘레를 찍어 한 장에 모은다
// node tests/e2e/effect-frames.mjs [--mobile] [--only=classic,single-rose] [--tier=soft|accent|big] [--name=before]
// 찍은 그림: tests/e2e/_shots/effect/<이름>-<번호>.png (효과 여섯 줄 × 시각 여섯 칸)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (name) => (process.argv.find((item) => item.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const mobile = process.argv.includes('--mobile');
const only = arg('only').split(',').filter(Boolean);
const tier = arg('tier') || 'soft';
const name = arg('name') || `${mobile ? 'm' : 'd'}-${tier}`;
const PORT = mobile ? 4195 : 4194;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.join(root, 'tests/e2e/_shots/effect');
const TIMES = [0.06, 0.18, 0.32, 0.5, 0.75, 1.05];

fs.mkdirSync(outDir, { recursive: true });
const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
const problems = [];
try {
  for (let i = 0; i < 80; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(250); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ko-KR' }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  await context.addInitScript(() => {
    localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1, effects: 'full' }));
    localStorage.setItem('onecard-s2-gift-shown', '1');
  });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`페이지 오류: ${error.message}`));
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('.lobby', { timeout: 90000 });
  // 게임판 하나를 세우고 효과 목록을 받는다
  const keys = await page.evaluate(async ({ picked }) => {
    const { createTable } = await import('/src/ui/table.js');
    const { applyEquipped } = await import('/src/ui/look-apply.js');
    const { createFx } = await import('/src/ui/fx.js');
    const { createDirector } = await import('/src/ui/director.js');
    const { EFFECTS } = await import('/src/data/looks.js');
    const { DEFAULT_EQUIPPED } = await import('/src/core/cosmetics.js');
    const gsapUrl = performance.getEntriesByType('resource').map((entry) => entry.name).find((url) => /\/\.vite\/deps\/gsap\.js/.test(url));
    const gsapModule = await import(gsapUrl);
    window.__gsap = gsapModule.gsap || gsapModule.default;
    const table = createTable({ mode: 'ai' });
    document.getElementById('app').replaceChildren(table.root);
    applyEquipped(table.root, { ...DEFAULT_EQUIPPED, table: 'table-rose-garden-3' }, { propsEl: table.sceneProps });
    table.setRival({ name: '치이카와', starsCount: 5, color: '#f7e3e6', portrait: 'char-chiikawa', status: '' });
    table.setMe({ name: '장미여왕', portrait: 'char-mymelody', points: 335000, starsCount: 7, color: '#f2b544' });
    table.setRivalCount(4, { animate: false });
    table.resetPile({ id: 'p1', suit: 'clubs', rank: '9' });
    table.setTop({ id: 'p2', suit: 'hearts', rank: '7' });
    table.syncHand([{ id: 'h1', suit: 'spades', rank: '4' }, { id: 'h2', suit: 'hearts', rank: 'Q' }, { id: 'h3', suit: 'diamonds', rank: '8' }, { id: 'h4', suit: 'clubs', rank: 'A' }, { id: 'h5', suit: 'hearts', rank: '2' }], { animate: false });
    table.setDeckCount(21);
    window.__table = table;
    window.__fx = createFx({ layer: table.fxLayer, root: table.root, director: createDirector() });
    // 효과 실물을 미리 받아 둔다
    const { cut } = await import('/src/data/assets.js');
    await Promise.all(Object.values(EFFECTS).flatMap((effect) => effect.sprites).map((key) => new Promise((resolve) => { const img = new Image(); img.onload = resolve; img.onerror = resolve; img.src = cut(key); })));
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return Object.keys(EFFECTS).filter((key) => !picked.length || picked.includes(key));
  }, { picked: only });
  const rows = [];
  for (const key of keys) {
    const shots = await page.evaluate(async ({ effectKey, level }) => {
      const { EFFECTS } = await import('/src/data/looks.js');
      const gsap = window.__gsap;
      gsap.globalTimeline.resume();
      window.__table.fxLayer.replaceChildren();
      await new Promise((resolve) => setTimeout(resolve, 120));
      const pile = window.__table.pile.getBoundingClientRect();
      const at = { x: pile.left + pile.width / 2, y: pile.top + pile.height / 2 };
      const before = gsap.globalTimeline.time();
      window.__table.pile.querySelectorAll('.fx-token').forEach((el) => el.remove());
      const options = level ? { tier: level, onto: window.__table.pile.lastElementChild } : {};
      window.__fx.burst(EFFECTS[effectKey], at, options);
      gsap.globalTimeline.pause();
      window.__t0 = before;
      const imgs = [...window.__table.fxLayer.querySelectorAll('img'), ...window.__table.pile.querySelectorAll('img')];
      await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; }))));
      return { x: pile.left + pile.width / 2, y: pile.top + pile.height / 2 };
    }, { effectKey: key, level: tier });
    const frames = [];
    for (const time of TIMES) {
      await page.evaluate((t) => { window.__gsap.globalTimeline.seek(window.__t0 + t); }, time);
      await sleep(90);
      const w = mobile ? 390 : 960;
      const h = mobile ? 520 : 540;
      const clip = { x: Math.max(0, Math.round(shots.x - w / 2)), y: Math.max(0, Math.round(shots.y - h / 2)), width: w, height: h };
      frames.push(await page.screenshot({ clip }));
    }
    rows.push({ key, frames });
  }
  const tileW = mobile ? 195 : 320;
  const tileH = mobile ? 260 : 180;
  for (let sheet = 0; sheet * 6 < rows.length; sheet += 1) {
    const part = rows.slice(sheet * 6, sheet * 6 + 6);
    const layers = [];
    for (const [rowIndex, row] of part.entries()) {
      const y = rowIndex * (tileH + 24);
      layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${6 * (tileW + 4)}" height="22"><text x="4" y="16" font-family="Arial" font-size="15" font-weight="700" fill="#fff">${row.key} · ${TIMES.map((t) => `${t}s`).join('  ')}</text></svg>`), left: 0, top: y });
      for (const [index, frame] of row.frames.entries()) layers.push({ input: await sharp(frame).resize(tileW, tileH).png().toBuffer(), left: index * (tileW + 4), top: y + 22 });
    }
    const file = path.join(outDir, `${name}-${sheet + 1}.png`);
    await sharp({ create: { width: 6 * (tileW + 4), height: part.length * (tileH + 24), channels: 3, background: '#111' } }).composite(layers).png().toFile(file);
    console.log(`찍음 ${path.relative(root, file)}`);
  }
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}
if (problems.length) { console.log(`문제 ${problems.length}개`); problems.forEach((line) => console.log(`  - ${line}`)); process.exitCode = 1; }
