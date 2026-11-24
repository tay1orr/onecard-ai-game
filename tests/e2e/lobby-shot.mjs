// 로비 무대 찍기(빌드 뒤) — 상대 열다섯이 한 자리씩 번갈아 앉는지 · 겹치지 않는지 · 누르면 인사 말풍선이 뜨는지(11-25)
// node tests/e2e/lobby-shot.mjs [--mobile] [--seconds=50]
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { CHARACTERS } from '../../src/data/characters.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mobile = process.argv.includes('--mobile');
const seconds = Number(process.argv.find((arg) => arg.startsWith('--seconds='))?.slice(10)) || 50;
const PORT = mobile ? 4192 : 4191;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tag = mobile ? 'm' : 'd';
const problems = [];

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(200); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  await context.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1.6, effects: 'full' }));
    localStorage.setItem('onecard-player-profile-v2', JSON.stringify({ points: 335000, peakPoints: 335000, wins: 700, games: 894, seasonXp: 4000 }));
    localStorage.setItem('onecard-s2-gift-shown', '1');
  });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`페이지 오류: ${error.message}`));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('.lobby .stage-rival', { timeout: 15000 });
  const stage = await page.$('.stage');
  const frames = [];
  const grab = async (label) => frames.push({ label, buffer: await stage.screenshot() });
  const seated = () => page.$$eval('.stage-lineup .stage-rival', (buttons) => buttons.map((button) => button.dataset.name));

  await sleep(1200);
  await grab('0초');
  const first = await seated();
  const expectSeats = mobile ? 4 : 5;
  if (first.length !== expectSeats) problems.push(`자리 수 ${first.length}(기대 ${expectSeats})`);

  // 가운데 캐릭터를 눌러 인사 말풍선 — 떠 있는 동안 자리가 바뀌지 않아야 한다
  // 휴대폰은 맨 왼쪽(말풍선이 무대 밖으로 잘리기 쉬운 자리), 넓은 화면은 가운데
  const middle = mobile ? 0 : Math.floor(first.length / 2);
  // 휴대폰은 손가락으로 누른다. 마우스는 누른 뒤 무대 밖으로 치운다(올려 두면 바꿔 앉기가 기다린다)
  const target = `.stage-lineup .stage-rival:nth-child(${middle + 1})`;
  if (mobile) await page.tap(target); else { await page.click(target); await page.mouse.move(4, 4); }
  await sleep(450);
  const bubble = await page.$eval('.rival-say', (node) => node.textContent).catch(() => '');
  if (!bubble) problems.push('누른 캐릭터의 말풍선이 뜨지 않음');
  const inside = await page.evaluate(() => { const b = document.querySelector('.rival-say')?.getBoundingClientRect(); const s = document.querySelector('.stage').getBoundingClientRect(); return !b || (b.left >= s.left - 1 && b.right <= s.right + 1); });
  if (!inside) problems.push('말풍선이 무대 밖으로 잘림');
  await grab(`누름 · ${bubble}`);
  const heldStart = await seated();
  await sleep(2000);
  if ((await seated()).join() !== heldStart.join()) problems.push('말풍선이 떠 있는 동안 자리가 바뀜');

  // 시간이 흐르며 몇 장 — 바뀌는 중인 장면도 한 장
  const seen = new Set(first);
  const changes = [];
  let previous = await seated();
  const started = Date.now();
  let midCaught = false;
  while (Date.now() - started < seconds * 1000) {
    await sleep(250);
    const now = await seated();
    if (new Set(now).size !== now.length) problems.push(`같은 캐릭터가 두 자리에: ${now.join(', ')}`);
    now.forEach((name) => seen.add(name));
    if (now.join() !== previous.join()) {
      changes.push(Math.round((Date.now() - started) / 100) / 10);
      if (frames.length < 6) await grab(`${Math.round((Date.now() - started) / 1000)}초 뒤`);
      previous = now;
    }
    if (!midCaught && changes.length >= 1) {
      // 다음 바꿔 앉기 한가운데(내려가거나 떨어지는 중)를 한 장
      const moving = await page.$$eval('.stage-lineup .stage-rival', (buttons) => buttons.some((button) => { const style = getComputedStyle(button); return Number(style.opacity) < 0.95; }));
      if (moving) { await grab('바뀌는 중'); midCaught = true; }
    }
  }
  const missing = CHARACTERS.map((rival) => rival.name).filter((name) => !seen.has(name));
  console.log(`[${tag}] 자리 ${first.length} · ${seconds}초 동안 바뀜 ${changes.length}번(${changes.join(' · ')}초) · 나온 캐릭터 ${seen.size}/${CHARACTERS.length}`);
  if (missing.length) problems.push(`${seconds}초 안에 안 나온 캐릭터: ${missing.join(', ')}`);
  if (changes.length < 3) problems.push(`바꿔 앉기가 너무 적음(${changes.length}번)`);

  // 찍은 장면을 한 장으로
  const width = mobile ? 360 : 640;
  const tiles = await Promise.all(frames.map(async ({ buffer }) => sharp(buffer).resize({ width }).png().toBuffer()));
  const heights = await Promise.all(tiles.map(async (tile) => (await sharp(tile).metadata()).height));
  const cell = Math.max(...heights) + 26;
  const cols = mobile ? 4 : 3;
  const rows = Math.ceil(tiles.length / cols);
  const labels = frames.map((frame, index) => ({ input: Buffer.from(`<svg width="${width}" height="24"><rect width="100%" height="100%" fill="#111"/><text x="6" y="17" font-size="15" fill="#fff" font-family="sans-serif">${frame.label.replace(/[<&>]/g, '')}</text></svg>`), left: (index % cols) * (width + 8), top: Math.floor(index / cols) * cell }));
  await sharp({ create: { width: cols * (width + 8), height: rows * cell, channels: 3, background: '#111' } })
    .composite([...labels, ...tiles.map((input, index) => ({ input, left: (index % cols) * (width + 8), top: Math.floor(index / cols) * cell + 24 }))])
    .png().toFile(path.join(root, `tests/e2e/_shots/${tag}-lobby-rotation.png`));
  console.log(`찍음 tests/e2e/_shots/${tag}-lobby-rotation.png`);
} finally {
  await browser?.close();
  server.kill();
}
if (problems.length) { console.log(problems.map((problem) => `- ${problem}`).join('\n')); process.exit(1); }
console.log(`[${tag}] 로비 무대 검사 통과`);
