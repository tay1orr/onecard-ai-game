// 상대 캐릭터 — 말풍선 · 표정 · 몸짓. 평소엔 정지 그림, 반응할 때만 움직이는 판으로 바꾼다(가볍게).
import gsap from 'gsap';
import { img } from '../data/assets.js';
import { pickLine } from '../data/characters.js';
import { settings } from './settings.js';

export function createRivalController(table, rival) {
  let bubbleTimer = null;
  let faceTimer = null;
  const portrait = table.rivalPortrait;
  const bubble = table.rivalBubble;
  const faceBadge = table.rivalFace;

  function say(text, { hold = 1900 } = {}) {
    if (!text) return;
    clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.classList.add('is-on');
    gsap.fromTo(bubble, { scale: 0.7, opacity: 0, y: 8 }, { scale: 1, opacity: 1, y: 0, duration: 0.28, ease: 'back.out(2.2)' });
    bubbleTimer = setTimeout(() => {
      gsap.to(bubble, { opacity: 0, y: -6, duration: 0.2, onComplete: () => bubble.classList.remove('is-on') });
    }, hold);
  }

  function showFace(kind) {
    const motif = rival.faces?.[kind];
    if (!motif) return;
    clearTimeout(faceTimer);
    faceBadge.src = img(motif);
    faceBadge.hidden = false;
    gsap.fromTo(faceBadge, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2.4)' });
    faceTimer = setTimeout(() => gsap.to(faceBadge, { scale: 0, duration: 0.2, onComplete: () => { faceBadge.hidden = true; } }), 1700);
  }

  function react(kind, situation) {
    if (situation) say(pickLine(rival, situation));
    showFace(kind);
    table.swapAnimated(table.rivalImg, rival.motif, 2400);
    if (settings.reduced()) return;
    const target = table.rivalImg;
    gsap.killTweensOf(target);
    if (kind === 'happy' || kind === 'party') gsap.fromTo(target, { y: 0 }, { y: -18, duration: 0.18, yoyo: true, repeat: 3, ease: 'power2.out' });
    else if (kind === 'shock') gsap.fromTo(target, { y: 0, scale: 1 }, { y: -10, scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
    else if (kind === 'sad') gsap.fromTo(target, { rotation: 0, y: 0 }, { rotation: -8, y: 6, duration: 0.4, yoyo: true, repeat: 1, ease: 'sine.inOut' });
    else if (kind === 'angry') gsap.fromTo(target, { x: -5 }, { x: 0, duration: 0.5, ease: 'elastic.out(3, .2)' });
    else if (kind === 'smug') gsap.fromTo(target, { rotation: 0 }, { rotation: 7, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' });
    else gsap.fromTo(target, { rotation: 0 }, { rotation: -4, duration: 0.3, yoyo: true, repeat: 1 });
  }

  function think(on) {
    portrait.classList.toggle('is-thinking', on);
    if (on && Math.random() < 0.45) say(pickLine(rival, 'think'), { hold: 1100 });
  }

  return { say, react, think, showFace };
}
