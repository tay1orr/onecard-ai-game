// 대전 소개 — 상대가 정해지는 VS 화면과 선공을 정하는 주사위
import gsap from 'gsap';
import { h, stars, formatNumber, wait } from './dom.js';
import { cut } from '../data/assets.js';
import { RIVALS } from '../data/characters.js';
import { matchmakingWeights } from '../core/rating.js';
import { play } from './sound.js';
import { settings } from './settings.js';

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
  const rivalSide = h('div.vs-side.vs-rival', {}, h('div.vs-plate', {}, rivalImg), h('div.vs-text', {}, rivalTitle, rivalName, rivalStars));
  const meSide = h('div.vs-side.vs-me', { vars: { '--side': me.color || '#f2b544' } },
    h('div.vs-plate', {}, h('img.vs-portrait', { src: cut(me.portrait), alt: '' })),
    h('div.vs-text', {}, h('small.vs-title', {}, `${formatNumber(me.points)}점`), h('strong.vs-name', {}, '나'), h('span.vs-stars', {}, stars(me.stars))));
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

  // 룰렛 — 점점 느려지다 멈춘다
  // 이 점수에서 만날 수 있는 상대만 돌린다
  const weights = matchmakingWeights(me.points || 0);
  const pool = RIVALS.filter((candidate) => weights[candidate.stars - 1] > 0);
  const sequence = reduced || pool.length < 2 ? [] : Array.from({ length: 11 }, (_, index) => pool[(index * 2 + Math.floor(Math.random() * pool.length)) % pool.length]);
  sequence.push(rival);
  for (let index = 0; index < sequence.length; index += 1) {
    const candidate = sequence[index];
    rivalImg.src = cut(candidate.portrait);
    rivalName.textContent = candidate.name;
    rivalTitle.textContent = candidate.title;
    rivalStars.textContent = stars(candidate.stars);
    rivalSide.style.setProperty('--side', candidate.color);
    play('tick', { volume: 0.5, rate: 0.9 + index * 0.03 });
    gsap.fromTo(rivalImg, { scale: 0.88 }, { scale: 1, duration: 0.12 });
    const progress = index / Math.max(1, sequence.length - 1);
    await wait(40 + Math.round(progress ** 2.6 * 190));
  }
  status.textContent = `${rival.title} ${rival.name}와 붙어요`;
  rewardLine.textContent = `이기면 +${formatNumber(reward)}점`;
  play('bong');
  if (!reduced) {
    gsap.fromTo(vsMark, { scale: 3, opacity: 0, rotation: -20 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.4, ease: 'back.out(2.6)' });
    gsap.fromTo(rivalImg, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.4, .4)' });
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
export function runDice({ overlay, rival }) {
  return new Promise((resolve) => {
    const myDie = makeDie('#f2b544');
    const rivalDie = makeDie(rival.color);
    const myValue = h('b.dice-value', {}, '');
    const rivalValue = h('b.dice-value', {}, '');
    const note = h('p.dice-note', { role: 'status', 'aria-live': 'polite' }, '주사위를 굴려 먼저 낼 사람을 정해요');
    const button = h('button.btn.primary.dice-btn', { type: 'button' }, '주사위 굴리기');
    const panel = h('div.dice-panel', {},
      h('div.dice-row', {}, h('div.dice-col', {}, myDie, h('small', {}, '나'), myValue), h('div.dice-col', {}, rivalDie, h('small', {}, rival.name), rivalValue)),
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
      note.textContent = first === 0 ? `${mine} 대 ${theirs}, 내가 먼저 내요` : `${mine} 대 ${theirs}, ${rival.name}가 먼저 내요`;
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
