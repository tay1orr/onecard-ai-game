// 실제 화면 검사 — 빌드한 판을 띄워 오프닝 → 로비 → AI 대전 한 판(자동) → 결과 → 보관함 · 시즌 패스 · 친구와 대전 입구
// node tests/e2e/play.mjs [--mobile] [--keep]   (먼저 npm run build)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const shots = path.join(root, 'tests/e2e/_shots');
fs.mkdirSync(shots, { recursive: true });
const mobile = process.argv.includes('--mobile');
const PORT = mobile ? 4181 : 4180;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tag = mobile ? 'm' : 'd';
const problems = [];
const log = (line) => console.log(`[${tag}] ${line}`);

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(200); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  if (mobile) await context.addInitScript(() => localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1.6, effects: 'full' })));
  else await context.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: false, sound: false, speed: 1.6, effects: 'full' })); } });
  // 검사는 운영 Supabase 에 닿지 않는다(익명 계정 · 방을 만들지 않게)
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`페이지 오류: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') problems.push(`콘솔 오류: ${message.text()}`); });
  page.on('requestfailed', (request) => problems.push(`요청 실패: ${request.url().replace(BASE, '/')}`));
  page.on('response', (response) => { if (response.status() >= 400) problems.push(`${response.status()} ${response.url().replace(BASE, '/')}`); });
  const shot = (name) => page.screenshot({ path: path.join(shots, `${tag}-${name}.png`) });

  await page.goto(BASE, { waitUntil: 'load' });
  if (!mobile) {
    await page.waitForSelector('.opening', { timeout: 8000 });
    await sleep(1700);
    await shot('01-opening-mid');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.op-start')).opacity === '1', null, { timeout: 8000 });
    await shot('02-opening-end');
    await page.click('.op-start');
    await sleep(600);
  }
  await page.waitForSelector('.lobby', { timeout: 8000 });
  await sleep(900);
  await shot('03-lobby');
  log('로비 OK');

  await page.click('.play-btn.is-primary');
  await page.waitForSelector('.versus', { timeout: 8000 });
  await sleep(600);
  await shot('04-versus');
  await page.waitForSelector('.dice-btn', { timeout: 20000 });
  await sleep(300);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.click('.dice-btn');
    await sleep(2200);
    const gone = await page.evaluate(() => !document.querySelector('.versus'));
    if (gone) break;
    const again = await page.evaluate(() => document.querySelector('.dice-btn')?.disabled === false);
    if (!again) await sleep(1200);
  }
  await page.waitForFunction(() => !document.querySelector('.versus'), null, { timeout: 12000 });
  await sleep(300);
  await shot('05-dealing');
  await page.waitForFunction(() => document.querySelectorAll('.hand .slot').length >= 5 && !document.querySelector('.hand .slot.is-incoming'), null, { timeout: 15000 });
  await sleep(1800);
  await shot('06-table');
  log('배분 OK');

  // 자동으로 끝까지 — 낼 수 있으면 내고(7이면 가장 많은 무늬), 없으면 덱
  const started = Date.now();
  let turns = 0;
  let specialShot = false;
  while (Date.now() - started < 240000) {
    const state = await page.evaluate(() => {
      if (document.querySelector('.result-panel')) return 'done';
      if (document.querySelector('.reward-boxes .rb-box:not(:disabled)')) return 'box';
      if (document.querySelector('.suit-sheet')) return 'suit';
      const game = document.querySelector('.game');
      const deck = document.querySelector('.deck');
      if (game?.dataset.turn === 'me' && deck && !deck.disabled) return 'mine';
      return 'wait';
    });
    if (state === 'done') break;
    if (state === 'box') {
      // 보상 상자 — 하나 고르고, 열리는 모습을 찍고, 받기
      await sleep(1200);
      await shot('07b-boxes');
      await page.locator('.reward-boxes .rb-box').nth(1).click({ timeout: 5000 });
      await page.waitForSelector('.rb-take:not([hidden])', { timeout: 12000 });
      await sleep(700);
      await shot('07c-box-open');
      await page.click('.rb-take');
      await sleep(600);
      continue;
    }
    if (state === 'suit') { await page.locator('.suit-btn.is-best, .suit-btn').first().click({ timeout: 5000 }); await sleep(200); continue; }
    if (state !== 'mine') { await sleep(250); continue; }
    turns += 1;
    const playable = await page.$('.hand .slot .card.is-playable');
    if (playable) {
      const rank = await playable.evaluate((el) => [...el.classList].find((name) => name.startsWith('r-')));
      // 부채꼴로 겹쳐서 카드 가운데는 다음 카드가 덮는다 — 보이는 왼쪽 위를 누른다
      await playable.click({ position: { x: 10, y: 26 }, timeout: 5000 }).catch(() => playable.click({ force: true }));
      if (!specialShot && ['r-2', 'r-A', 'r-JOKER', 'r-J'].includes(rank)) { await sleep(520); await shot('07-effect'); specialShot = true; }
    } else {
      await page.locator('.deck').click({ timeout: 5000 });
    }
    await sleep(350);
  }
  const finished = await page.evaluate(() => Boolean(document.querySelector('.result-panel')));
  if (!finished) {
    await shot('08-unfinished');
    const counts = await page.evaluate(() => ({ mine: document.querySelectorAll('.hand .slot').length, rival: document.querySelectorAll('.rival-card').length, deck: document.querySelector('.deck-count')?.textContent }));
    // 긴 판은 규칙상 생길 수 있다 — 진행이 됐으면 실패가 아니라 참고로만
    const line = `4분 안에 한 판이 끝나지 않음(내 차례 ${turns}번, 내 패 ${counts.mine} · 상대 ${counts.rival} · 덱 ${counts.deck})`;
    if (turns < 10) problems.push(`${line} — 진행이 멈춘 것 같음`); else log(`참고: ${line}`);
  }
  else {
    await sleep(2200);
    await shot('08-result');
    log(`한 판 끝 — 내 차례 ${turns}번, ${Math.round((Date.now() - started) / 1000)}초`);
  }

  // 로비 → 보관함 → 시즌 패스 → 친구와 대전 입구
  if (finished) await page.click('.result-panel .btn.ghost');
  else { await page.click('.exit-btn'); await sleep(300); await page.click('.modal .btn.primary').catch(() => {}); }
  await page.waitForSelector('.lobby', { timeout: 8000 });
  await sleep(700);
  await shot('09-lobby-after');
  await page.click('.locker-card');
  await page.waitForSelector('.locker .item-tile', { timeout: 8000 });
  await sleep(700);
  await shot('10-collection');
  const tiles = await page.$$('.locker .item-tile');
  if (tiles.length < 110) problems.push(`보관함 아이템이 ${tiles.length}개뿐`);
  const t0 = Date.now();
  await tiles[Math.min(12, tiles.length - 1)].click();
  const clickMs = Date.now() - t0;
  await sleep(1300);
  await shot('11-collection-select');
  log(`보관함 아이템 ${tiles.length}개 · 고르기 ${clickMs}ms`);
  await page.click('.locker .page-top .icon-btn');
  await page.waitForSelector('.lobby', { timeout: 8000 });
  await page.click('.pass-card');
  await page.waitForSelector('.pass-page .pass-node', { timeout: 8000 });
  await sleep(900);
  await shot('12-pass');
  await page.click('.pass-page .page-top .icon-btn');
  await page.waitForSelector('.lobby', { timeout: 8000 });
  await page.click('.lobby-actions .play-btn:not(.is-primary)');
  await page.waitForSelector('.online-entry', { timeout: 8000 });
  await sleep(900);
  await shot('13-online-entry');
  await context.close();
} catch (error) {
  problems.push(`검사 멈춤: ${error.message.split('\n').slice(0, 8).join(' / ')}`);
  try {
    const stuck = browser?.contexts()[0]?.pages()[0];
    if (stuck) await stuck.screenshot({ path: path.join(shots, `${tag}-99-stuck.png`) });
  } catch { /* 그림을 못 찍어도 괜찮다 */ }
} finally {
  if (browser) await browser.close();
  server.kill();
}

const ignorable = (line) => /favicon|supabase\.co|realtime|websocket/i.test(line);
const real = problems.filter((line) => !ignorable(line));
if (real.length) {
  console.log(`[${tag}] 문제 ${real.length}개`);
  real.slice(0, 20).forEach((line) => console.log(`  - ${line}`));
  process.exitCode = 1;
} else {
  console.log(`[${tag}] 화면 검사 통과 (그림: tests/e2e/_shots)`);
}
