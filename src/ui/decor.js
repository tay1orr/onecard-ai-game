// 탁자 소품 — 테마의 3D 소품을 펠트 가장자리에 올려 둔다(테두리에 살짝 걸치게, 크기 · 기울기를 조금씩 다르게)
import { h } from './dom.js';
import { img } from '../data/assets.js';

const SPOTS = [
  { left: '-1.5%', top: '-7%', size: 1, rotate: -13 },
  { left: '63%', top: '-9%', size: 0.82, rotate: 9 },
  { left: '24%', top: '84%', size: 0.9, rotate: -6 },
];

export function renderDecor(el, theme) {
  el.replaceChildren(...(theme.decor || []).slice(0, 3).map((motif, index) => {
    const spot = SPOTS[index];
    return h('img.decor-item', {
      src: img(motif), alt: '', draggable: 'false',
      vars: { '--decor-size': spot.size, '--decor-rotate': `${spot.rotate}deg` },
      style: { left: spot.left, top: spot.top },
    });
  }));
}
