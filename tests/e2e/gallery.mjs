// 카드 모습 크게 보기 — 개발 서버에서 실제 카드 코드로 앞면(여러 장) · 뒷면을 게임 크기로 그려 찍는다
// node tests/e2e/gallery.mjs [face|back] [--only=키,키] [--cw=120]
// 찍은 그림: tests/e2e/_shots/audit/gal-face · gal-back → node tests/e2e/audit-sheet.mjs gal-face 2 900
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const kinds = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const only = (process.argv.find((arg) => arg.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const cw = Number((process.argv.find((arg) => arg.startsWith('--cw=')) || '').slice(5)) || 120;
const PORT = 4187;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 80; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(250); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  await context.addInitScript(() => {
    localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1, effects: 'full' }));
    localStorage.setItem('onecard-s2-gift-shown', '1');
  });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('.lobby', { timeout: 90000 });
  for (const kind of (kinds.length ? kinds : ['face', 'back'])) {
    const dir = path.join(root, 'tests/e2e/_shots/audit', `gal-${kind}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const keys = await page.evaluate(async ({ kind: which, only: picked, cw: width }) => {
      const { FACES, BACKS } = await import('/src/data/looks.js');
      const { faceVars, backVars, applyFaceStyle } = await import('/src/ui/look-apply.js');
      const { cardFace, cardBack } = await import('/src/ui/cards.js');
      document.body.querySelectorAll('.gal').forEach((el) => el.remove());
      const host = document.createElement('div');
      host.className = 'gal';
      Object.assign(host.style, { position: 'fixed', inset: '0', zIndex: '9999', overflow: 'auto', background: '#1b2a24', padding: '16px' });
      document.body.append(host);
      const table = which === 'face' ? FACES : BACKS;
      const list = Object.keys(table).filter((key) => !picked.length || picked.includes(key));
      const cards = [['spades', 'A'], ['hearts', 'A'], ['spades', 'K'], ['hearts', 'Q'], ['diamonds', 'J'], ['clubs', '10'], ['diamonds', '7'], ['hearts', '3']];
      list.forEach((key, index) => {
        const row = document.createElement('div');
        row.className = 'gal-row';
        row.dataset.key = key;
        Object.assign(row.style, { position: 'relative', display: 'flex', gap: '14px', padding: '18px 20px', marginBottom: '10px', background: 'radial-gradient(ellipse at 50% 40%, #2c6b50, #133626)', borderRadius: '14px', width: 'max-content' });
        row.style.setProperty('--cw', `${width}px`);
        const look = table[key];
        const vars = which === 'face' ? faceVars(look) : backVars(look);
        Object.entries(vars).forEach(([prop, value]) => row.style.setProperty(prop, value));
        if (which === 'face') {
          applyFaceStyle(row, look);
          cards.forEach(([suit, rank], at) => {
            const slot = document.createElement('div');
            Object.assign(slot.style, { position: 'relative', width: `${width}px`, height: `${width * 1.4}px` });
            const card = cardFace({ id: `g-${index}-${at}`, suit, rank });
            card.style.position = 'absolute';
            card.style.inset = '0';
            slot.append(card);
            row.append(slot);
          });
        } else {
          row.dataset.backFoil = look.foil ? '1' : '0';
          [0, 1, 2].forEach(() => {
            const slot = document.createElement('div');
            Object.assign(slot.style, { position: 'relative', width: `${width}px`, height: `${width * 1.4}px` });
            const card = cardBack();
            card.style.position = 'absolute';
            card.style.inset = '0';
            slot.append(card);
            row.append(slot);
          });
        }
        host.append(row);
      });
      return list;
    }, { kind, only, cw });
    await page.evaluate(() => Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })))));
    await sleep(1500);
    let index = 0;
    for (const key of keys) {
      index += 1;
      await page.locator(`.gal-row[data-key="${key}"]`).screenshot({ path: path.join(dir, `${String(index).padStart(3, '0')}-${key}.png`) });
    }
    console.log(`${kind} ${keys.length}개 찍음`);
  }
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}
