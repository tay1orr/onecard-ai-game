// 만나는 상대 창 찍기(빌드 뒤) — 로비 무대 제목 옆 ⓘ 를 누르면 창이 뜨고, 그 점수의 난이도 줄이 확률표와 같은지 · 화면 밖으로 넘치지 않는지(11-27)
// node tests/e2e/odds-shot.mjs [--mobile]   → tests/e2e/_shots/<d|m>-odds-<점수>[-<폭>].png
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { matchmakingWeights } from '../../src/core/rating.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mobile = process.argv.includes('--mobile');
const PORT = mobile ? 4194 : 4193;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = path.join(root, 'tests/e2e/_shots');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tag = mobile ? 'm' : 'd';
const results = [];
const check = (ok, label) => { results.push(ok); console.log(`${ok ? '통과' : '실패'} ${label}`); };
const SCORES = [0, 36280, 335000, 569515, 1000000];
const WIDTHS = mobile ? [360, 412] : [1920];

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(200); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const points of SCORES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext(mobile
        ? { viewport: { width, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' }
        : { viewport: { width, height: 1080 }, deviceScaleFactor: 1, locale: 'ko-KR' });
      await context.addInitScript((seed) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 1.6, effects: 'full' }));
        localStorage.setItem('onecard-player-profile-v2', JSON.stringify({ version: 4, seasonId: 's2', points: seed, peakPoints: seed, wins: 300, games: 500, seasonXp: 4000 }));
        localStorage.setItem('onecard-s2-gift-shown', '1');
      }, points);
      await context.route(/supabase\.co/, (route) => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(BASE, { waitUntil: 'load' });
      await page.waitForSelector('.lobby .odds-btn', { timeout: 15000 });
      await sleep(900);
      const label = `[${points.toLocaleString()}점 · 폭 ${width}]`;
      const lobby = await page.evaluate(() => {
        const button = document.querySelector('.lobby .odds-btn').getBoundingClientRect();
        const stage = document.querySelector('.lobby .stage').getBoundingClientRect();
        return { oldLine: Boolean(document.querySelector('.stage-odds')), inside: button.left >= stage.left && button.right <= stage.right && button.top >= stage.top, size: Math.round(button.width), scroll: document.documentElement.scrollWidth, view: document.documentElement.clientWidth };
      });
      check(!lobby.oldLine && lobby.inside && lobby.size >= 32 && lobby.scroll <= lobby.view, `${label} 로비에는 만나는 난이도 줄 없이 ⓘ 단추만(무대 안 · ${lobby.size}px) · 옆으로 안 넘침`);
      if (points === 36280 || points === 569515) await page.screenshot({ path: path.join(SHOTS, `${tag}-odds-lobby-${points}${mobile ? `-${width}` : ''}.png`) });
      await (mobile ? page.tap('.lobby .odds-btn') : page.click('.lobby .odds-btn'));
      await page.waitForSelector('.modal-card.is-odds .mo-row', { timeout: 8000 });
      await sleep(500);
      const odds = await page.evaluate(() => {
        const card = document.querySelector('.modal-card.is-odds');
        const box = card.getBoundingClientRect();
        const rows = [...card.querySelectorAll('.mo-row')].map((row) => ({ name: row.querySelector('.mo-name').textContent, chance: row.querySelector('.mo-chance').textContent, icons: row.querySelectorAll('.mo-badge img').length, text: row.innerText.replace(/\s+/g, ' ') }));
        const overflow = [...card.querySelectorAll('.mo-row *')].some((el) => el.getBoundingClientRect().right > box.right + 0.5);
        return { title: card.querySelector('.modal-title').textContent, lead: card.querySelector('.mo-lead').innerText, note: card.querySelector('.modal-note').textContent, rows, overflow, left: box.left, right: box.right, view: document.documentElement.clientWidth, scrollable: card.scrollHeight > card.clientHeight };
      });
      const expected = matchmakingWeights(points).map((weight, index) => ({ level: index + 1, weight })).filter((entry) => entry.weight > 0);
      check(odds.title === '만나는 상대' && odds.rows.length === expected.length && odds.rows.every((row, index) => row.chance === `${expected[index].weight}%` && row.icons >= 1 && row.text.includes('이기면 +')), `${label} 창 줄 ${odds.rows.length}개가 확률표와 같음 — ${odds.rows.map((row) => `${row.name} ${row.chance}`).join(' · ')}`);
      check(!odds.overflow && odds.left >= 0 && odds.right <= odds.view, `${label} 창 안 글 · 그림이 창 밖으로 안 넘침${odds.scrollable ? ' (창 안 스크롤)' : ''}`);
      check(errors.length === 0, `${label} 화면 오류 없음${errors.length ? ` — ${errors.join(' / ')}` : ''}`);
      console.log(`   ${odds.lead.replace(/\s+/g, ' ')} / ${odds.note}`);
      await page.screenshot({ path: path.join(SHOTS, `${tag}-odds-${points}${mobile ? `-${width}` : ''}.png`) });
      await context.close();
    }
  }
} finally {
  await browser?.close();
  server.kill();
}
const failed = results.filter((ok) => !ok).length;
console.log(failed ? `[${tag}] 만나는 상대 창 검사 실패 ${failed}개 / ${results.length}개` : `[${tag}] 만나는 상대 창 검사 통과 ${results.length}개`);
process.exitCode = failed ? 1 : 0;
