// 7 을 내면 무늬를 사람이 고르는지(빌드 뒤) — 11-24 휴대폰에서 7 을 누른 손가락을 떼면 그 자리에 오는 마우스 누름이
// 막 뜬 무늬 단추에 떨어져 무늬가 저절로 골라졌다. 손패에서 7 이 실제로 보이는 점을 찾아 손가락(휴대폰) · 마우스(넓은 화면)로 누르고
// 1.2초 동안 무늬 창이 남아 기다리는지, 그다음 고른 무늬로 7 이 내지는지 본다
// node tests/e2e/seven-pick.mjs [--mobile]
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mobile = process.argv.includes('--mobile');
const PORT = mobile ? 4198 : 4197;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tag = mobile ? 'm' : 'd';
const problems = [];

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
let checked = 0;
try {
  for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(200); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  await context.addInitScript(() => {
    localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1.6, effects: 'full' }));
    localStorage.setItem('onecard-s2-gift-shown', '1');
  });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`페이지 오류: ${error.message}`));
  const pressAt = (x, y) => (mobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
  const press = async (selector) => {
    const box = await page.locator(selector).first().boundingBox();
    if (box) await pressAt(box.x + box.width / 2, box.y + box.height / 2);
  };
  // 부채꼴로 겹친 손패 — 그 카드가 맨 위에 보이는 점(다른 카드에 가리지 않은 곳)을 찾는다
  const visiblePoint = (selector) => page.evaluate((query) => {
    const card = document.querySelector(query);
    if (!card) return null;
    const box = card.getBoundingClientRect();
    for (let fy = 0.15; fy < 0.95; fy += 0.1) {
      for (let fx = 0.08; fx < 0.95; fx += 0.08) {
        const x = box.left + box.width * fx;
        const y = box.top + box.height * fy;
        if (document.elementFromPoint(x, y)?.closest('.card') === card) return { x, y };
      }
    }
    return null;
  }, selector);

  for (let gameNo = 1; gameNo <= 5 && checked < 2; gameNo += 1) {
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForSelector('.lobby', { timeout: 15000 });
    await press('.play-btn.is-primary');
    await page.waitForSelector('.dice-btn', { timeout: 25000 });
    await sleep(300);
    await press('.dice-btn');
    const started = Date.now();
    while (Date.now() - started < 150000 && checked < 2) {
      const state = await page.evaluate(() => {
        if (document.querySelector('.result-panel') || document.querySelector('.reward-boxes')) return 'done';
        if (document.querySelector('.suit-sheet')) return 'suit';
        const game = document.querySelector('.game');
        const deck = document.querySelector('.deck');
        if (game?.dataset.turn === 'me' && deck && !deck.disabled) return 'mine';
        return 'wait';
      });
      if (state === 'done') break;
      if (state === 'suit') { await press('.suit-btn'); await sleep(250); continue; }
      if (state !== 'mine') { await sleep(200); continue; }
      const sevenPoint = await visiblePoint('.hand .slot .card.is-playable.r-7');
      if (sevenPoint) {
        await pressAt(sevenPoint.x, sevenPoint.y);
        await sleep(1200);
        const open = await page.evaluate(() => Boolean(document.querySelector('.suit-sheet')));
        if (!open) problems.push('7 을 누르고 1.2초 뒤 무늬 창이 닫혀 있음(사람이 고르기 전에 닫힘)');
        if (open) {
          // 셋째 무늬(클로버)를 직접 누르면 그 무늬로 7 이 내져야 한다
          const box = await page.locator('.suit-sheet .suit-btn').nth(2).boundingBox();
          await pressAt(box.x + box.width / 2, box.y + box.height / 2);
          await sleep(900);
          const after = await page.evaluate(() => ({ open: Boolean(document.querySelector('.suit-sheet')), top: document.querySelector('.pile .card:last-child')?.className || '' }));
          if (after.open) problems.push('무늬를 눌러도 창이 닫히지 않음');
          else if (!/\br-7\b/.test(after.top)) problems.push(`무늬를 고른 뒤 맨 위 카드가 7 이 아님(${after.top})`);
        }
        checked += 1;
        continue;
      }
      const otherPoint = await visiblePoint('.hand .slot .card.is-playable:not(.r-7)');
      if (otherPoint) await pressAt(otherPoint.x, otherPoint.y);
      else await press('.deck');
      await sleep(300);
    }
  }
} finally {
  await browser?.close();
  server.kill();
}
if (!checked) problems.push('낼 수 있는 7 이 다섯 판 동안 오지 않음 — 다시 돌려 주세요');
if (problems.length) { console.log(problems.map((problem) => `- [${tag}] ${problem}`).join('\n')); process.exit(1); }
console.log(`[${tag}] 7 무늬 고르기 검사 통과(${checked}번 — 창이 남아 기다리고, 고른 무늬로 7 이 내짐)`);
