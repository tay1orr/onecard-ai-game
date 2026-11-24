// 꾸미기 모습 찍기 — 점수 · 장착을 미리 넣고 로비 · 게임판 · 보관함을 찍는다(빌드 뒤)
// node tests/e2e/showcase.mjs [--mobile] [--only=이름,이름]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const shots = path.join(root, 'tests/e2e/_shots');
fs.mkdirSync(shots, { recursive: true });
const mobile = process.argv.includes('--mobile');
const only = (process.argv.find((arg) => arg.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const PORT = mobile ? 4183 : 4182;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const problems = [];

const PRESETS = [
  { name: 'rose-ballroom', points: 335000, gift: true, equipped: { table: 'table-rose-ballroom', cardBack: 'back-rose-ballroom', cardFace: 'face-real-rose-garden', effect: 'effect-rose-ballroom-waltz', victory: 'victory-rose-ballroom-gala', avatar: 'avatar-mymelody', charms: ['charm-rose-musicbox', 'charm-crimson-rose-clockwork', 'charm-royal-flower-fountain'] } },
  { name: 'rose-garden', points: 360000, equipped: { table: 'table-rose-garden-3', cardBack: 'back-redoute-03', cardFace: 'face-redoute', effect: 'effect-single-rose', victory: 'victory-curtain-call', avatar: 'avatar-choonsik', charms: ['charm-rose-dome', 'charm-perfume', 'charm-rose-teacup-set'] } },
  { name: 'peony', points: 560000, equipped: { table: 'table-peony', cardBack: 'back-vangogh-almond', cardFace: 'face-rose-tea', effect: 'effect-petal-wind', victory: 'victory-lily', avatar: 'avatar-cinnamoroll', charms: ['charm-lily', 'charm-pink-rose', 'charm-peony-vase'] } },
  { name: 'golden-rose', points: 950000, equipped: { table: 'table-golden-rose', cardBack: 'back-golden-rose', cardFace: 'face-golden-rose', effect: 'effect-single-rose', victory: 'victory-versailles', avatar: 'avatar-mymelody', charms: ['charm-crown', 'charm-candelabra', 'charm-champagne'] } },
  { name: 'versailles', points: 1000000, equipped: { table: 'table-versailles', cardBack: 'back-redoute-09', cardFace: 'face-redoute', effect: 'effect-single-rose', victory: 'victory-versailles', avatar: 'avatar-choonsik', charms: ['charm-rose-vase', 'charm-candelabra', 'charm-crown'] } },
  // 선생님 GPT 그림 세트(11-24)
  { name: 'winter-garden', points: 460000, equipped: { table: 'table-winter-garden', cardBack: 'back-winter-garden', cardFace: 'face-winter-garden', effect: 'effect-white-rose', victory: 'victory-lily', avatar: 'avatar-mymelody', charms: ['charm-white-rose', 'charm-rose-vase', 'charm-pink-rose'] } },
  { name: 'millefeuille', points: 650000, equipped: { table: 'table-millefeuille', cardBack: 'back-millefeuille', cardFace: 'face-millefeuille', effect: 'effect-cherry-breeze', victory: 'victory-lavender', avatar: 'avatar-pompompurin', charms: ['charm-macarons', 'charm-teacup', 'charm-lilac'] } },
  { name: 'dubai', points: 735000, equipped: { table: 'table-dubai', cardBack: 'back-dubai', cardFace: 'face-dubai', effect: 'effect-petal-wind', victory: 'victory-sunflower', avatar: 'avatar-mangom', charms: ['charm-macarons', 'charm-teapot', 'charm-pearls'] } },
  { name: 'amethyst', points: 795000, equipped: { table: 'table-amethyst', cardBack: 'back-amethyst', cardFace: 'face-amethyst', effect: 'effect-white-rose', victory: 'victory-lavender', avatar: 'avatar-sailormoon', charms: ['charm-pearls', 'charm-heart-lantern', 'charm-lilac'] } },
  { name: 'ruby-crown', points: 845000, equipped: { table: 'table-ruby-crown', cardBack: 'back-ruby-crown', cardFace: 'face-ruby-crown', effect: 'effect-single-rose', victory: 'victory-curtain-call', avatar: 'avatar-choonsik', charms: ['charm-candelabra', 'charm-champagne', 'charm-pearls'] } },
  // 11-24 저녁 둘째 묶음 — 크리스마스(시즌 2 첫 판 선물) · 베르사유 · 백만 송이 장미 카드 · 효과, 새 내 캐릭터
  { name: 'christmas', points: 335000, owned: ['table-christmas', 'back-christmas', 'face-christmas', 'effect-christmas', 'victory-christmas'], equipped: { table: 'table-christmas', cardBack: 'back-christmas', cardFace: 'face-christmas', effect: 'effect-christmas', victory: 'victory-christmas', avatar: 'avatar-korilakkuma', charms: ['charm-music-box', 'charm-rose-teacup-set', 'charm-rose-dome'] } },
  { name: 'versailles-cards', points: 1000000, equipped: { table: 'table-versailles', cardBack: 'back-versailles', cardFace: 'face-versailles', effect: 'effect-versailles', victory: 'victory-versailles', avatar: 'avatar-little-prince', charms: ['charm-candelabra', 'charm-champagne', 'charm-crown'] } },
  { name: 'million-roses', points: 1000000, equipped: { table: 'table-million-roses', cardBack: 'back-million-roses', cardFace: 'face-million-roses', effect: 'effect-million-roses', victory: 'victory-million-roses', avatar: 'avatar-bellygom', charms: ['charm-crown', 'charm-black-rose', 'charm-white-rose'] } },
  { name: 'student', points: 0, equipped: null },
  { name: 'dessert', points: 20000, equipped: { table: 'table-dessert-cafe', cardBack: 'back-strawberry-milk', cardFace: 'face-dessert-cafe', effect: 'effect-cloud-pop', victory: 'victory-confetti-cannons', avatar: 'avatar-cinnamoroll', charms: ['charm-cafe-bear', 'charm-classic', 'charm-classic'] } },
  { name: 'picnic', points: 20000, equipped: { table: 'table-night-picnic', cardBack: 'back-antique-atlas', cardFace: 'face-antique-manuscript', effect: 'effect-aurora', victory: 'victory-dual-fireworks', avatar: 'avatar-choonsik', charms: ['charm-classic', 'charm-star-cat', 'charm-classic'] } },
].filter((preset) => !only.length || only.includes(preset.name));

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(200); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const preset of PRESETS) {
    const tag = `${mobile ? 'm' : 'd'}-show-${preset.name}`;
    const context = await browser.newContext(mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' }
      : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
    const profile = { points: preset.points, peakPoints: preset.points, wins: Math.round(preset.points / 450), games: Math.round(preset.points / 350), seasonXp: 0 };
    if (preset.equipped) profile.equipped = preset.equipped;
    if (preset.owned) profile.boxItems = preset.owned;
    await context.addInitScript(({ profile: seeded, gift }) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1.6, effects: 'full' }));
      localStorage.setItem('onecard-player-profile-v2', JSON.stringify(seeded));
      if (!gift) localStorage.setItem('onecard-s2-gift-shown', '1');
    }, { profile, gift: Boolean(preset.gift) });
    await context.route(/supabase\.co/, (route) => route.abort());
    const page = await context.newPage();
    page.on('pageerror', (error) => problems.push(`${preset.name} 페이지 오류: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') problems.push(`${preset.name} 콘솔 오류: ${message.text()}`); });
    page.on('response', (response) => { if (response.status() >= 400) problems.push(`${preset.name} ${response.status()} ${response.url().replace(BASE, '/')}`); });
    const shot = (name) => page.screenshot({ path: path.join(shots, `${tag}-${name}.png`) });
    try {
      await page.goto(BASE, { waitUntil: 'load' });
      await page.waitForSelector('.lobby', { timeout: 10000 });
      await sleep(1400);
      if (preset.gift) {
        await page.waitForSelector('.modal-card.is-gift', { timeout: 5000 }).catch(() => problems.push(`${preset.name} 시즌 2 선물 창이 안 뜸`));
        await sleep(600);
        await shot('0-gift');
        await page.click('.modal-card.is-gift .btn.ghost').catch(() => {});
        await sleep(500);
      }
      await shot('1-lobby');
      await page.click('.play-btn.is-primary');
      await page.waitForSelector('.versus', { timeout: 8000 });
      await sleep(900);
      await shot('2-versus');
      await page.waitForSelector('.dice-btn', { timeout: 20000 });
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await page.click('.dice-btn').catch(() => {});
        await sleep(2300);
        if (await page.evaluate(() => !document.querySelector('.versus'))) break;
      }
      await page.waitForFunction(() => document.querySelectorAll('.hand .slot').length >= 5 && !document.querySelector('.hand .slot.is-incoming'), null, { timeout: 15000 });
      await sleep(2200);
      await shot('3-table');
      // 내 차례면 한 장 내서 효과를 찍는다
      const playable = await page.$('.hand .slot .card.is-playable');
      if (playable) {
        await playable.click({ position: { x: 10, y: 26 }, timeout: 4000 }).catch(() => playable.click({ force: true }));
        await sleep(mobile ? 520 : 480);
        await shot('4-effect');
      }
      await page.click('.exit-btn');
      await sleep(400);
      await page.click('.modal .btn.primary').catch(() => {});
      await page.waitForSelector('.lobby', { timeout: 8000 });
      await sleep(500);
      if (!preset.equipped || preset.name === 'rose-garden') {
        await page.click('.locker-card');
        await page.waitForSelector('.locker .item-tile', { timeout: 8000 });
        await page.click('.locker .tab[data-tab="flower"]');
        await sleep(1200);
        await shot('5-locker-flower');
        const victoryTile = await page.$('.locker .item-tile[data-id^="victory-"]');
        if (victoryTile) {
          await victoryTile.click();
          await sleep(1500);
          await shot('6-locker-victory');
        }
      }
      console.log(`${tag} 찍음`);
    } catch (error) {
      problems.push(`${preset.name} 멈춤: ${error.message.split('\n')[0]}`);
      await page.screenshot({ path: path.join(shots, `${tag}-99-stuck.png`) }).catch(() => {});
    }
    await context.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}
const real = problems.filter((line) => !/favicon|supabase\.co|realtime|websocket/i.test(line));
if (real.length) {
  console.log(`문제 ${real.length}개`);
  real.slice(0, 30).forEach((line) => console.log(`  - ${line}`));
  process.exitCode = 1;
} else console.log('꾸미기 모습 찍기 끝(문제 없음)');
