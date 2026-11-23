// 스티커 반응 6종 — 3D 얼굴 그림 + 짧은 말
import gsap from 'gsap';
import { h } from './dom.js';
import { img } from '../data/assets.js';
import { play } from './sound.js';

export const STICKERS = Object.freeze([
  { key: 'nice', label: '좋은 수!', motif: 'star-struck' },
  { key: 'fire', label: '강렬해!', motif: 'fire' },
  { key: 'oops', label: '앗!', motif: 'grimacing' },
  { key: 'lol', label: '하하!', motif: 'rofl' },
  { key: 'gg', label: '좋은 게임!', motif: 'saluting' },
  { key: 'again', label: '한 판 더!', motif: 'steam' },
]);

export const stickerByKey = (key) => STICKERS.find((sticker) => sticker.key === key) || null;

export function stickerPicker({ onPick }) {
  const panel = h('div.sticker-picker', { role: 'menu', 'aria-label': '반응 고르기' },
    ...STICKERS.map((sticker) => h('button.sticker', { type: 'button', role: 'menuitem', 'aria-label': sticker.label, onClick: () => onPick(sticker.key) },
      h('img', { src: img(sticker.motif), alt: '' }), h('small', {}, sticker.label))));
  return panel;
}

export function showSticker(bubble, key) {
  const sticker = stickerByKey(key);
  if (!sticker) return;
  bubble.replaceChildren(h('img.bubble-face', { src: img(sticker.motif), alt: '' }), h('span', {}, sticker.label));
  bubble.classList.add('is-on');
  play('pluck', { rate: 1.4, volume: 0.6 });
  gsap.fromTo(bubble, { scale: 0.6, opacity: 0, y: 10 }, { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2.4)' });
  clearTimeout(bubble._timer);
  bubble._timer = setTimeout(() => gsap.to(bubble, { opacity: 0, duration: 0.25, onComplete: () => bubble.classList.remove('is-on') }), 2200);
}
