// 시즌 2 오프닝 — 카드 한 장이 떨어져 뒤집히면 「2」, 그 카드가 터지며 상대들이 나오고 로고가 꽂힌다(처음 한 번 · 설정에서 다시 보기)
import gsap from 'gsap';
import { h } from './dom.js';
import { cut } from '../data/assets.js';
import { shufflePersonas } from '../data/characters.js';
import { cardBack, cardFace } from './cards.js';
import { play } from './sound.js';
import { settings } from './settings.js';

export function playOpening({ host, themeVars = {} }) {
  return new Promise((resolve) => {
    const card = h('div.flip-card.op-card', {}, cardBack(), cardFace({ id: 'op-2', suit: 'spades', rank: '2' }));
    // 상대 열다섯 가운데 여덟만 부채꼴로(다 세우면 겹친다)
    const rivals = shufflePersonas(8).map((rival, index) => h(`img.op-rival.o${index}`, { src: cut(rival.portrait), alt: '' }));
    const logo = h('div.op-logo', {}, h('b.logo-word', {}, 'ONE!'), h('span.logo-season', {}, h('small', {}, 'SEASON'), h('b', {}, '2')));
    const copy = h('p.op-copy', {}, '장미 정원 맵과 새 카드, 캐릭터 상대들이 기다려요');
    const start = h('button.btn.primary.op-start', { type: 'button' }, '시작하기');
    const skip = h('button.op-skip', { type: 'button' }, '건너뛰기');
    const overlay = h('div.opening', { 'aria-label': '시즌 2 시작' }, h('div.op-bg'), h('div.op-slab.a'), h('div.op-slab.b'), card, ...rivals, logo, copy, start, skip);
    Object.entries(themeVars).forEach(([key, value]) => overlay.style.setProperty(key, value));
    host.append(overlay);

    const finish = () => {
      settings.set({ seenOpening: true });
      gsap.to(overlay, { opacity: 0, duration: 0.35, onComplete: () => { overlay.remove(); resolve(); } });
    };
    start.addEventListener('click', () => { play('confirm'); finish(); });
    skip.addEventListener('click', () => { timeline.progress(1); });

    const reduced = settings.reduced();
    const timeline = gsap.timeline();
    timeline.set(start, { opacity: 0, y: 20 });
    timeline.set([logo, copy], { opacity: 0 });
    timeline.set(rivals, { opacity: 0, scale: 0.2 });
    if (reduced) {
      timeline.to([logo, copy, start], { opacity: 1, y: 0, duration: 0.3 });
      timeline.to(rivals, { opacity: 1, scale: 1, duration: 0.3 }, 0);
      return;
    }
    timeline.fromTo(card, { y: '-80vh', rotation: -40, scale: 1.6 }, { y: 0, rotation: -6, duration: 0.7, ease: 'power3.in' }, 0.2);
    timeline.call(() => { play('place', { volume: 1 }); play('bong', { volume: 0.7 }); gsap.fromTo(overlay, { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(3, .3)' }); }, null, 0.9);
    timeline.to(card, { rotationY: 180, scale: 2.1, duration: 0.55, ease: 'back.out(1.6)' }, 1.05);
    timeline.call(() => play('season'), null, 1.15);
    timeline.fromTo('.op-slab.a', { xPercent: -110 }, { xPercent: 0, duration: 0.4, ease: 'power3.out' }, 1.35);
    timeline.fromTo('.op-slab.b', { xPercent: 110 }, { xPercent: 0, duration: 0.4, ease: 'power3.out' }, 1.42);
    timeline.to(card, { scale: 0.2, opacity: 0, rotation: 30, duration: 0.3, ease: 'power3.in' }, 1.95);
    rivals.forEach((rival, index) => {
      const angle = -160 + index * (140 / Math.max(1, rivals.length - 1));
      const rad = (angle * Math.PI) / 180;
      timeline.fromTo(rival, { x: 0, y: 0, opacity: 1, scale: 0.2, rotation: -30 }, {
        x: Math.cos(rad) * Math.min(440, innerWidth * 0.36), y: Math.sin(rad) * Math.min(220, innerHeight * 0.22) + 40,
        scale: 1, rotation: [-8, 6, -3, 8, -5, 4, -6, 7][index % 8], duration: 0.6, ease: 'back.out(1.8)',
      }, 2.05 + index * 0.06);
    });
    timeline.call(() => { play('chips', { volume: 0.7 }); }, null, 2.1);
    timeline.fromTo(logo, { scale: 2.6, opacity: 0, rotation: -12 }, { scale: 1, opacity: 1, rotation: -4, duration: 0.45, ease: 'back.out(2.4)' }, 2.5);
    timeline.call(() => { play('stack'); gsap.fromTo(overlay, { y: 8 }, { y: 0, duration: 0.4, ease: 'elastic.out(3, .3)' }); }, null, 2.62);
    timeline.to(copy, { opacity: 1, duration: 0.4 }, 2.9);
    timeline.to(start, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 3.05);
    timeline.call(() => start.focus(), null, 3.1);
  });
}
