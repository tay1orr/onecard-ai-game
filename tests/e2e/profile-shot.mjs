// 내 프로필 장면 찍기(빌드 뒤) — 로비 내 점수 칩 → 내 프로필 → 이름 적기 · 캐릭터 고르기 → 로비 · 대결 화면에 이름이 나오는지
// node tests/e2e/profile-shot.mjs [--mobile]
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mobile = process.argv.includes('--mobile');
const PORT = mobile ? 4190 : 4189;
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
  const shot = (name) => page.screenshot({ path: path.join(root, `tests/e2e/_shots/${tag}-profile-${name}.png`) });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('.lobby', { timeout: 15000 });
  await page.click('.profile-chip');
  await page.waitForSelector('.profile-page .pf-tile', { timeout: 8000 });
  await sleep(900);
  await shot('1-open');
  await page.fill('.pf-input', '장미여왕');
  await sleep(700);
  const tiles = await page.$$('.profile-page .pf-tile:not(.is-locked):not(.is-on)');
  if (tiles.length) await tiles[Math.min(2, tiles.length - 1)].click();
  await sleep(900);
  await shot('2-chosen');
  const saved = await page.evaluate(() => ({ name: JSON.parse(localStorage.getItem('onecard-s2-settings') || '{}').nickname, avatar: JSON.parse(localStorage.getItem('onecard-player-profile-v2') || '{}').equipped?.avatar }));
  if (saved.name !== '장미여왕') problems.push(`이름이 저장되지 않음(${saved.name})`);
  if (!saved.avatar || saved.avatar === 'avatar-rabbit') problems.push(`캐릭터가 바뀌지 않음(${saved.avatar})`);
  await page.click('.profile-page .page-top .icon-btn');
  await page.waitForSelector('.lobby', { timeout: 8000 });
  await page.click('.play-btn.is-primary');
  await page.waitForSelector('.versus', { timeout: 8000 });
  await sleep(1200);
  await shot('3-versus-spin');
  await page.waitForSelector('.dice-btn', { timeout: 20000 });
  await shot('4-versus-done');
  const versusName = await page.evaluate(() => document.querySelector('.vs-me .vs-name')?.textContent);
  if (versusName !== '장미여왕') problems.push(`대결 화면 내 이름이 다름(${versusName})`);
  console.log(`${tag} 프로필 장면 찍음 · 저장 ${JSON.stringify(saved)} · 대결 화면 이름 ${versusName}`);
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}
if (problems.length) { console.log(`문제 ${problems.length}개`); problems.forEach((line) => console.log(`  - ${line}`)); process.exitCode = 1; }
