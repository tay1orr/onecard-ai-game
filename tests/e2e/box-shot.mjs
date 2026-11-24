// 보상 상자 장면 찍기 — 개발 서버에서 상자 셋을 정해 놓고(×10 + 아이템 등) 고르기 전 · 연 뒤를 찍는다
// node tests/e2e/box-shot.mjs [--mobile]
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mobile = process.argv.includes('--mobile');
const PORT = 4188;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tag = mobile ? 'm' : 'd';

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 80; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(250); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  await context.addInitScript(() => {
    localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1, effects: 'full' }));
    localStorage.setItem('onecard-s2-gift-shown', '1');
  });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'commit', timeout: 180000 });
  await page.waitForSelector('.lobby', { timeout: 180000 });
  await page.evaluate(async () => {
    const { openRewardBoxes } = await import('/src/ui/reward-boxes.js');
    const boxes = [
      { slot: 0, base: 1010, multiplier: 2, amount: 2020, rarity: 'rare', itemId: null },
      { slot: 1, base: 1060, multiplier: 10, amount: 10600, rarity: 'mythic', itemId: 'charm-box-teddy-rose' },
      { slot: 2, base: 980, multiplier: 1, amount: 980, rarity: 'common', itemId: null },
    ];
    window.__boxDone = openRewardBoxes({ host: document.body, boxes, won: true, veteran: 1.9, games: 894 });
  });
  await sleep(1600);
  await page.screenshot({ path: path.join(root, `tests/e2e/_shots/${tag}-box-1-pick.png`) });
  await page.locator('.reward-boxes .rb-box').nth(1).click();
  await sleep(2300);
  await page.screenshot({ path: path.join(root, `tests/e2e/_shots/${tag}-box-2-stamp.png`) });
  await page.waitForSelector('.rb-take:not([hidden])', { timeout: 15000 });
  await sleep(500);
  await page.screenshot({ path: path.join(root, `tests/e2e/_shots/${tag}-box-3-open.png`) });
  console.log('상자 장면 찍음');
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}
