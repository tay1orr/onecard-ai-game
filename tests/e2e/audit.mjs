// 꾸미기 하나하나 보기 — 모든 아이템을 연 프로필로 보관함을 열고, 아이템마다 큰 미리보기를 찍는다(빌드 뒤)
// node tests/e2e/audit.mjs [--mobile] [--slot=table,cardBack] [--replay]
// 찍은 그림: tests/e2e/_shots/audit/<칸>/<순번>-<id>.png → node tests/e2e/audit-sheet.mjs 로 모아 보기
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'tests/e2e/_shots/audit');
const mobile = process.argv.includes('--mobile');
const replay = process.argv.includes('--replay');
const slots = (process.argv.find((arg) => arg.startsWith('--slot=')) || '').slice(7).split(',').filter(Boolean);
const PORT = 4186;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const problems = [];

const { COSMETICS, COSMETIC_SLOTS } = await import(path.join(root, 'src/core/cosmetics.js').replace(/\\/g, '/').replace(/^([A-Z]):/, 'file:///$1:'));
const wanted = COSMETIC_SLOTS.map((slot) => slot.key).filter((key) => !slots.length || slots.includes(key));

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(200); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  const profile = {
    points: 500000, peakPoints: 1000000, wins: 1200, games: 1500, seasonXp: 999999,
    boxItems: COSMETICS.filter((item) => item.box).map((item) => item.id),
  };
  await context.addInitScript((seeded) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1, effects: 'full' }));
    localStorage.setItem('onecard-player-profile-v2', JSON.stringify(seeded));
    localStorage.setItem('onecard-s2-gift-shown', '1');
  }, profile);
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`페이지 오류: ${error.message}`));
  page.on('response', (response) => { if (response.status() >= 400) problems.push(`${response.status()} ${response.url().replace(BASE, '/')}`); });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('.lobby', { timeout: 10000 });
  await page.click('.locker-card');
  await page.waitForSelector('.locker .item-tile', { timeout: 8000 });
  for (const slot of wanted) {
    const dir = path.join(outDir, `${mobile ? 'm-' : ''}${slot}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    await page.click(`.locker .tab[data-tab="${slot}"]`);
    await sleep(500);
    const ids = await page.$$eval('.locker .item-tile[data-id]', (tiles) => tiles.map((tile) => tile.dataset.id));
    // 칸 목록(작은 그림) 전체
    await page.evaluate(() => document.querySelectorAll('.locker .item-tile img').forEach((img) => { img.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('.locker .item-tile img')].every((img) => img.complete), null, { timeout: 15000 }).catch(() => problems.push(`${slot} 목록 그림이 다 안 들어옴`));
    await page.locator('.locker-right').screenshot({ path: path.join(dir, '00-grid.png') }).catch(() => {});
    let index = 0;
    for (const id of ids) {
      index += 1;
      await page.click(`.locker .item-tile[data-id="${id}"]`);
      await sleep(450);
      await page.waitForFunction(() => [...document.querySelectorAll('.locker-preview img')].every((img) => img.complete), null, { timeout: 8000 }).catch(() => {});
      await sleep(250);
      const name = `${String(index).padStart(3, '0')}-${id}`;
      await page.locator('.locker-preview').screenshot({ path: path.join(dir, `${name}.png`) });
      if (replay && (slot === 'victory' || slot === 'effect')) {
        const button = await page.$('.locker .btn.ghost');
        if (button) {
          await button.click();
          const marks = slot === 'victory' ? [250, 700, 1400, 2600] : [150, 420, 900];
          let last = 0;
          for (const at of marks) {
            await sleep(at - last);
            last = at;
            await page.locator('.locker-preview').screenshot({ path: path.join(dir, `${name}-t${at}.png`) });
          }
          await sleep(2500);
        }
      }
    }
    console.log(`${slot} ${ids.length}개 찍음`);
  }
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}
const real = problems.filter((line) => !/favicon|supabase\.co|realtime|websocket/i.test(line));
if (real.length) {
  console.log(`문제 ${real.length}개`);
  [...new Set(real)].slice(0, 30).forEach((line) => console.log(`  - ${line}`));
}
console.log('꾸미기 하나하나 찍기 끝');
