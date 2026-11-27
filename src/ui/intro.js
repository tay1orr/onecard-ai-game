// 대전 소개 — 상대가 정해지는 VS 화면과 선공을 정하는 주사위
import gsap from 'gsap';
import { h, stars, formatNumber, wait, josa } from './dom.js';
import { cut } from '../data/assets.js';
import { CHARACTERS } from '../data/characters.js';
import { play } from './sound.js';
import { settings } from './settings.js';
import { aiBadge, rankArtReady, rankBadge } from './rank.js';

const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const FACE_ROT = { 1: [0, 0], 2: [-90, 0], 3: [0, 90], 4: [0, -90], 5: [90, 0], 6: [180, 0] };

function dieFace(value) {
  return h('div.die-face', { dataset: { value } }, ...Array.from({ length: 9 }, (_, index) => h(`i${PIPS[value].includes(index + 1) ? '.on' : ''}`)));
}

function makeDie(color) {
  const cube = h('div.die-cube', {}, ...[1, 2, 3, 4, 5, 6].map((value) => dieFace(value)));
  return h('div.die', { vars: { '--die': color } }, cube);
}

export async function rollDie(die, value) {
  const cube = die.querySelector('.die-cube');
  const [x, y] = FACE_ROT[value];
  play('dice');
  const spinsX = 720 + Math.floor(Math.random() * 2) * 360;
  const spinsY = 720 + Math.floor(Math.random() * 2) * 360;
  const timeline = gsap.timeline();
  timeline.fromTo(die, { y: -120, rotation: -30 }, { y: 0, rotation: 0, duration: settings.reduced() ? 0.2 : 0.75, ease: 'bounce.out' }, 0);
  timeline.fromTo(cube, { rotationX: 0, rotationY: 0 }, { rotationX: spinsX + x, rotationY: spinsY + y, duration: settings.reduced() ? 0.2 : 0.85, ease: 'power3.out' }, 0);
  timeline.call(() => play('throw', { volume: 0.8 }), null, 0.3);
  await timeline;
}

// 상대 결정 룰렛 + VS — 끝나면 { el, rollStage } 를 돌려준다
export async function showVersus({ host, me, rival, reward, bonus, eventName }) {
  const rivalImg = h('img.vs-portrait', { src: cut(rival.portrait), alt: '' });
  const rivalName = h('strong.vs-name', {}, '');
  const rivalTitle = h('small.vs-title', {}, '');
  const rivalStars = h('span.vs-stars', {}, '');
  const rivalLevel = h('small.vs-level', {}, '');
  const rivalPlate = h('div.vs-plate', {}, rivalImg);
  const rivalSide = h('div.vs-side.vs-rival', {}, rivalPlate, h('div.vs-text', {}, rivalTitle, rivalName, rivalStars, rivalLevel));
  const meSide = h('div.vs-side.vs-me', { vars: { '--side': me.color || '#f2b544' } },
    h('div.vs-plate', {}, h('img.vs-portrait', { src: cut(me.portrait), alt: '' })),
    h('div.vs-text', {}, h('small.vs-title', {}, `${formatNumber(me.points)}점`), h('strong.vs-name', {}, me.name || '나'), h('span.vs-stars', {}, rankBadge(me.points))));
  const vsMark = h('b.vs-mark', {}, 'VS');
  const rewardLine = h('div.vs-reward', {}, '');
  const bonusBadge = bonus ? h('div.vs-bonus', {}, h('b', {}, '보너스판'), h('small', {}, '이기면 점수 2배')) : null;
  const status = h('p.vs-status', { role: 'status', 'aria-live': 'polite' }, '상대를 찾고 있어요');
  const stage = h('div.vs-stage', {}, meSide, vsMark, rivalSide);
  const overlay = h('div.versus', { 'aria-label': '대전 상대' }, h('div.vs-bg'), stage, rewardLine, bonusBadge, status, eventName ? h('small.vs-event', {}, eventName) : null);
  host.append(overlay);
  const reduced = settings.reduced();

  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2 });
  gsap.fromTo(meSide, { xPercent: -120 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' });
  gsap.fromTo(rivalSide, { xPercent: 120 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' });

  // 화면을 누르면 끝으로 건너뛴다(하루에 여러 판 하는 사람이 기다리지 않게)
  let skipped = reduced;
  overlay.addEventListener('pointerdown', () => { skipped = true; }, { once: true });
  const pause = (ms) => (skipped ? Promise.resolve() : wait(ms));

  // 첫 박자 「누구?」 — 캐릭터 여덟이 빠르게 돌다가 점점 느려지며 멈춘다(약 2.4초). 난이도(별)는 아직 안 보인다
  status.textContent = '상대를 고르고 있어요';
  const pool = CHARACTERS;
  const sequence = [];
  if (pool.length > 1) {
    let previous = null;
    for (let index = 0; index < 17; index += 1) {
      const choices = pool.filter((candidate) => candidate.id !== previous && candidate.id !== rival.id);
      const candidate = choices[Math.floor(Math.random() * choices.length)] || pool[0];
      sequence.push(candidate);
      previous = candidate.id;
    }
  }
  sequence.push(rival);
  for (let index = 0; index < sequence.length; index += 1) {
    if (skipped) break;
    const candidate = sequence[index];
    rivalImg.src = cut(candidate.portrait);
    rivalName.textContent = candidate.name;
    rivalTitle.textContent = candidate.title;
    rivalSide.style.setProperty('--side', candidate.color);
    const progress = index / Math.max(1, sequence.length - 1);
    play('tick', { volume: 0.45, rate: 1.25 - progress * 0.45 });
    gsap.fromTo(rivalImg, { y: -14, scale: 0.9, opacity: 0.6 }, { y: 0, scale: 1, opacity: 1, duration: 0.1 + progress * 0.12, ease: 'power2.out' });
    await pause(45 + Math.round(progress ** 2.4 * 300));
  }
  // 멈춤 — 고른 캐릭터를 확정한다
  rivalImg.src = cut(rival.portrait);
  rivalName.textContent = rival.name;
  rivalTitle.textContent = rival.title;
  rivalSide.style.setProperty('--side', rival.color);
  status.textContent = `${rival.title} ${josa(rival.name, '과/와')} 붙어요`;
  play('bong');
  if (!reduced) {
    gsap.fromTo(rivalPlate, { boxShadow: `0 0 0 0 ${rival.color}` }, { boxShadow: `0 0 0 26px transparent`, duration: 0.7, ease: 'power2.out' });
    gsap.fromTo(rivalImg, { scale: 1.28 }, { scale: 1, duration: 0.55, ease: 'elastic.out(1.4, .4)' });
  }
  await pause(450);

  // 둘째 박자 「얼마나 센가?」 — 별이 하나씩 켜지고, 그 난이도가 어떻게 두는지 한 줄
  if (rankArtReady()) {
    // 단계 그림(금별 · 루비 · 분홍 장미 · 왕관)이 하나씩 켜진다(11-25 — 옛 별 글자 대신)
    const badge = aiBadge(rival.level, { size: 'md' });
    const icons = [...badge.querySelectorAll('img')];
    gsap.set(icons, { opacity: 0, scale: 0.4 });
    rivalStars.replaceChildren(badge);
    for (const [index, icon] of icons.entries()) {
      if (skipped) break;
      play('tick', { volume: 0.55, rate: 1 + (index + 1) * 0.12 });
      gsap.to(icon, { opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(2.4)' });
      await pause(rival.elite ? 160 : 130);
    }
    if (skipped) gsap.set(icons, { opacity: 1, scale: 1 });
  } else {
    const count = Math.round(rival.tier); // 그림이 없을 때는 옛 별 글자(20단계를 옛 별로 친 값)
    for (let step = 1; step <= count; step += 1) {
      if (skipped) break;
      rivalStars.textContent = stars(step);
      play('tick', { volume: 0.55, rate: 1 + step * 0.09 });
      gsap.fromTo(rivalStars, { scale: 1.35 }, { scale: 1, duration: 0.18, ease: 'power2.out' });
      await pause(rival.elite ? 130 : 110);
    }
    rivalStars.textContent = stars(count);
  }
  rivalLevel.textContent = rival.blurb || '';
  rivalSide.classList.toggle('is-elite', rival.elite);
  if (!skipped) gsap.fromTo(rivalLevel, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
  if (rival.elite && !skipped) {
    play('bonus', { volume: 0.5 });
    gsap.fromTo(rivalStars, { filter: 'drop-shadow(0px 0px 0px rgba(255, 210, 120, 0))' }, { filter: 'drop-shadow(0px 0px 12px rgba(255, 210, 120, 0.95))', duration: 0.3, yoyo: true, repeat: 1 });
  }
  await pause(320);
  rewardLine.textContent = `이기면 +${formatNumber(reward)}점`;
  play('stack', { volume: 0.7 });
  if (!reduced) {
    gsap.fromTo(vsMark, { scale: 3, opacity: 0, rotation: -20 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.4, ease: 'back.out(2.6)' });
    gsap.to(stage, { x: 6, duration: 0.05, yoyo: true, repeat: 5 });
  } else gsap.set(vsMark, { opacity: 1 });
  gsap.fromTo(rewardLine, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.2 });
  if (bonusBadge) {
    play('bonus', { delay: 0.25 });
    gsap.fromTo(bonusBadge, { scale: 0, rotation: -12 }, { scale: 1, rotation: -6, duration: 0.4, delay: 0.35, ease: 'back.out(2.4)' });
  }
  await wait(reduced ? 300 : 900);
  return overlay;
}

// 주사위로 선공 — 같은 눈이면 다시
export function runDice({ overlay, rival, meName = '나' }) {
  return new Promise((resolve) => {
    const myDie = makeDie('#f2b544');
    const rivalDie = makeDie(rival.color);
    const myValue = h('b.dice-value', {}, '');
    const rivalValue = h('b.dice-value', {}, '');
    const note = h('p.dice-note', { role: 'status', 'aria-live': 'polite' }, '주사위를 굴려 먼저 낼 사람을 정해요');
    const button = h('button.btn.primary.dice-btn', { type: 'button' }, '주사위 굴리기');
    const panel = h('div.dice-panel', {},
      h('div.dice-row', {}, h('div.dice-col', {}, myDie, h('small', {}, meName), myValue), h('div.dice-col', {}, rivalDie, h('small', {}, rival.name), rivalValue)),
      note, button);
    overlay.querySelector('.vs-status')?.replaceWith(panel);
    overlay.querySelector('.vs-reward')?.classList.add('is-small');
    gsap.fromTo(panel, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
    button.focus();
    let rolling = false;
    button.addEventListener('click', async () => {
      if (rolling) return;
      rolling = true;
      button.disabled = true;
      const mine = 1 + Math.floor(Math.random() * 6);
      const theirs = 1 + Math.floor(Math.random() * 6);
      myValue.textContent = '';
      rivalValue.textContent = '';
      await rollDie(myDie, mine);
      myValue.textContent = String(mine);
      await wait(180);
      await rollDie(rivalDie, theirs);
      rivalValue.textContent = String(theirs);
      if (mine === theirs) {
        note.textContent = `${mine} 대 ${theirs}, 같은 눈이에요. 한 번 더 굴려요`;
        button.textContent = '다시 굴리기';
        button.disabled = false;
        rolling = false;
        play('error', { volume: 0.4 });
        return;
      }
      const first = mine > theirs ? 0 : 1;
      note.textContent = first === 0 ? `${mine} 대 ${theirs}, 내가 먼저 내요` : `${mine} 대 ${theirs}, ${josa(rival.name, '이/가')} 먼저 내요`;
      play('confirm');
      gsap.fromTo(first === 0 ? myDie : rivalDie, { scale: 1 }, { scale: 1.18, duration: 0.18, yoyo: true, repeat: 1 });
      await wait(settings.reduced() ? 200 : 750);
      resolve(first);
    });
  });
}

export async function closeVersus(overlay) {
  await gsap.to(overlay, { opacity: 0, duration: 0.3 });
  overlay.remove();
}
