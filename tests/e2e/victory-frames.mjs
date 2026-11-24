// 승리 연출 프레임 찍기 — 개발 서버에서 실제 게임판 · 연출 코드로 승리 장면을 만들고, GSAP 시간을 멈춰 정해진 시각마다 찍어 한 장에 모은다
// node tests/e2e/victory-frames.mjs [--mobile] [--only=million-roses,classic] [--seed=3] [--all] [--finals --full=5.3]
// --all 승리 아이템 모두(맵은 그 세트 맵, 없으면 기본) · --finals 16장 묶음 없이 --full 시각 한 장씩만
// 찍은 그림: tests/e2e/_shots/victory/<묶음>.png (프레임 16장 모음)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mobile = process.argv.includes('--mobile');
const only = (process.argv.find((arg) => arg.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const seed = Number((process.argv.find((arg) => arg.startsWith('--seed=')) || '').slice(7)) || 7;
const PORT = mobile ? 4193 : 4192;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.join(root, 'tests/e2e/_shots/victory');
const TIMES = [0.05, 0.25, 0.5, 0.85, 1.15, 1.45, 1.8, 2.1, 2.45, 2.75, 3.05, 3.35, 3.7, 4.1, 4.6, 5.3];
// --full=1.2,3 — 그 시각은 원래 크기 그림도 따로 남긴다
const full = (process.argv.find((arg) => arg.startsWith('--full=')) || '').slice(7).split(',').filter(Boolean).map(Number);
const all = process.argv.includes('--all');
const finals = process.argv.includes('--finals') && full.length > 0;

// 묶음 — 맵 · 승리 아이템 · 내 캐릭터 · 상대
const PRESETS = [
  { name: 'million-roses', table: 'table-rose-garden-3', victory: 'victory-million-roses', avatar: 'avatar-mymelody', rival: '치이카와' },
  { name: 'rose-ballroom', table: 'table-rose-ballroom', victory: 'victory-rose-ballroom-gala', avatar: 'avatar-sailormoon', rival: '코난' },
  { name: 'classic', table: 'table-dessert-cafe', victory: 'victory-classic', avatar: 'avatar-choonsik', rival: '짱구' },
  { name: 'moon-rabbit', table: 'table-night-picnic', victory: 'victory-moon-rabbit-observatory', avatar: 'avatar-cinnamoroll', rival: '케로로' },
  { name: 'cherry', table: 'table-cherry-picnic', victory: 'victory-cherry-finale', avatar: 'avatar-loopy', rival: '하츄핑' },
  { name: 'cloud', table: 'table-peach-soda', victory: 'victory-cotton-candy', avatar: 'avatar-pompompurin', rival: '포차코' },
  { name: 'versailles', table: 'table-golden-rose', victory: 'victory-versailles', avatar: 'avatar-mangom', rival: '키드' },
  { name: 'lavender', table: 'table-s2-lavender', victory: 'victory-lavender', avatar: 'avatar-cinnamoroll', rival: '쿠로미' },
  { name: 'deepsea', table: 'table-amethyst', victory: 'victory-neon-deepsea-city', avatar: 'avatar-choonsik', rival: '한교동' },
  { name: 'fireworks', table: 'table-ruby-crown', victory: 'victory-dual-fireworks', avatar: 'avatar-mymelody', rival: '랏코' },
  // 11-24 저녁 GPT 승리 장면 배경 여섯 · 새 내 캐릭터
  { name: 'christmas', table: 'table-christmas', victory: 'victory-christmas', avatar: 'avatar-rilakkuma', rival: '치이카와' },
  { name: 'winter-garden', table: 'table-winter-garden', victory: 'victory-winter-garden', avatar: 'avatar-little-prince', rival: '헬로키티' },
  { name: 'ruby-crown', table: 'table-ruby-crown', victory: 'victory-ruby-crown', avatar: 'avatar-bellygom', rival: '키드' },
  { name: 'amethyst', table: 'table-amethyst', victory: 'victory-amethyst', avatar: 'avatar-molang', rival: '쿠로미' },
  { name: 'dubai', table: 'table-dubai', victory: 'victory-dubai', avatar: 'avatar-korilakkuma', rival: '짱구' },
  { name: 'millefeuille', table: 'table-millefeuille', victory: 'victory-millefeuille', avatar: 'avatar-carebear', rival: '우사기' },
];
if (all) {
  // 승리 아이템 모두 — 캐릭터 · 상대는 돌려 가며, 맵은 그 세트의 맵(없으면 기본)
  const { COSMETICS, COSMETIC_SETS, DEFAULT_EQUIPPED } = await import(pathToFileURL(path.join(root, 'src/core/cosmetics.js')).href);
  const avatars = COSMETICS.filter((item) => item.slot === 'avatar').map((item) => item.id);
  const rivals = ['치이카와', '하치와레', '짱구', '케로로', '쿠로미', '헬로키티', '코난', '하츄핑'];
  PRESETS.length = 0;
  COSMETICS.filter((item) => item.slot === 'victory').forEach((item, index) => {
    const set = COSMETIC_SETS.find((entry) => entry.itemIds.includes(item.id));
    const table = set?.itemIds.find((id) => id.startsWith('table-')) || DEFAULT_EQUIPPED.table;
    PRESETS.push({ name: item.id.replace(/^victory-/, ''), table, victory: item.id, avatar: avatars[index % avatars.length], rival: rivals[index % rivals.length] });
  });
}
for (let index = PRESETS.length - 1; index >= 0; index -= 1) if (only.length && !only.includes(PRESETS[index].name)) PRESETS.splice(index, 1);

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
  for (const preset of PRESETS) {
    await page.evaluate(async ({ preset: chosen, seed: start }) => {
      const { createTable } = await import('/src/ui/table.js');
      const { applyEquipped } = await import('/src/ui/look-apply.js');
      const { createFx } = await import('/src/ui/fx.js');
      const { createDirector } = await import('/src/ui/director.js');
      const { preloadVictory } = await import('/src/ui/victory.js');
      const { CHARACTERS, pickLine } = await import('/src/data/characters.js');
      const { cosmeticById, DEFAULT_EQUIPPED } = await import('/src/core/cosmetics.js');
      // 앱과 같은 GSAP(개발 서버가 붙인 주소 그대로)를 불러야 시간을 멈추고 옮길 수 있다
      const gsapUrl = performance.getEntriesByType('resource').map((entry) => entry.name).find((name) => /\/\.vite\/deps\/gsap\.js/.test(name));
      const gsapModule = await import(gsapUrl);
      const gsap = gsapModule.gsap || gsapModule.default;
      window.__gsap = gsap;
      gsap.globalTimeline.resume();
      window.__victory?.finish();
      const table = createTable({ mode: 'ai' });
      document.getElementById('app').replaceChildren(table.root);
      const equipped = { ...DEFAULT_EQUIPPED, table: chosen.table, victory: chosen.victory, avatar: chosen.avatar };
      const looks = applyEquipped(table.root, equipped, { propsEl: table.sceneProps });
      const rival = CHARACTERS.find((persona) => persona.name === chosen.rival) || CHARACTERS[0];
      const avatar = cosmeticById(chosen.avatar);
      table.setMatch({ title: `${rival.title} ${rival.name}`, sub: '이기면 +1,000점', bonus: false });
      table.setRival({ name: rival.name, starsCount: 7, color: rival.color, portrait: rival.portrait, status: '나올 카드를 수백 번 그려 봐요' });
      table.setMe({ name: '장미여왕', portrait: avatar.portrait, points: 335000, starsCount: 7, color: '#f2b544' });
      table.setRivalCount(3, { animate: false });
      table.resetPile({ id: 'p1', suit: 'hearts', rank: '9' });
      table.setTop({ id: 'p2', suit: 'hearts', rank: '7' });
      table.syncHand([], { animate: false });
      table.setDeckCount(21);
      preloadVictory(looks.victory, { rival: rival.portrait, me: avatar.portrait });
      await new Promise((resolve) => setTimeout(resolve, 1800));
      // 판마다 바뀌는 연출(구석 쪽 · 상대 반응 · 뛰는 모습)을 정해진 씨앗으로
      let value = start;
      const random = Math.random;
      Math.random = () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646; };
      const director = createDirector();
      const fx = createFx({ layer: table.fxLayer, root: table.root, director });
      const shown = fx.victory({
        look: looks.victory,
        me: { portrait: avatar.portrait, el: table.meImg },
        rival: { portrait: rival.portrait, el: table.rivalImg, line: pickLine(rival, 'lose') },
        table: { root: table.root, pile: table.pile, rivalHand: table.rivalZone.querySelector('.rival-hand'), cards: [{ id: 'r1', suit: 'spades', rank: 'K' }, { id: 'r2', suit: 'diamonds', rank: '3' }, { id: 'r3', suit: 'clubs', rank: 'Q' }] },
        title: '승리',
        sub: '장미여왕 · 치이카와를 이겼어요'.replace('치이카와를', `${rival.name}${/[가-힣]$/.test(rival.name) && (rival.name.charCodeAt(rival.name.length - 1) - 0xac00) % 28 ? '을' : '를'}`),
      });
      Math.random = random;
      gsap.globalTimeline.pause();
      window.__victory = shown;
      window.__t0 = shown.timeline.startTime();
      const imgs = [...shown.scene.querySelectorAll('img')];
      await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; }))));
      await new Promise((resolve) => setTimeout(resolve, 500));
    }, { preset, seed });
    const frames = [];
    for (const time of (finals ? full : [...new Set([...TIMES, ...full])]).sort((x, y) => x - y)) {
      await page.evaluate((t) => { window.__gsap.globalTimeline.seek(window.__t0 + t); }, time);
      await sleep(140);
      const shot = await page.screenshot();
      if (TIMES.includes(time)) frames.push(shot);
      if (full.includes(time)) fs.writeFileSync(path.join(outDir, `${mobile ? 'm' : 'd'}-${preset.name}-t${time}.png`), shot);
    }
    if (finals) { console.log(`찍음 ${preset.name} 마지막 장면`); continue; }
    const tileW = mobile ? 260 : 480;
    const tileH = mobile ? 563 : 270;
    const cols = mobile ? 8 : 4;
    const rows = Math.ceil(frames.length / cols);
    const layers = [];
    for (const [index, frame] of frames.entries()) {
      const tile = await sharp(frame).resize(tileW, tileH).png().toBuffer();
      const x = (index % cols) * (tileW + 6);
      const y = Math.floor(index / cols) * (tileH + 26);
      layers.push({ input: tile, left: x, top: y + 22 });
      layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="22"><text x="4" y="16" font-family="Arial" font-size="15" font-weight="700" fill="#fff">${TIMES[index].toFixed(2)}s</text></svg>`), left: x, top: y });
    }
    const file = path.join(outDir, `${mobile ? 'm' : 'd'}-${preset.name}.png`);
    await sharp({ create: { width: cols * (tileW + 6), height: rows * (tileH + 26), channels: 3, background: '#111' } }).composite(layers).png().toFile(file);
    console.log(`찍음 ${path.relative(root, file)}`);
  }
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}
if (problems.length) { console.log(`문제 ${problems.length}개`); problems.forEach((line) => console.log(`  - ${line}`)); process.exitCode = 1; }
