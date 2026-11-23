// 아이템 작은 그림 — 보관함 · 결과 · 시즌 패스가 함께 쓴다
import { h, setVars } from './dom.js';
import { themeById } from '../data/themes.js';
import { img } from '../data/assets.js';
import { backVars, faceVars, tableVars, applyFaceStyle } from './theme-apply.js';
import { cardBack, cardFace } from './cards.js';
import { charmToyConfig } from '../core/cosmetics.js';

const FILTERS = {
  peach: 'hue-rotate(28deg) saturate(.62) brightness(1.18)',
  blush: 'hue-rotate(18deg) saturate(.5) brightness(1.3)',
  crimson: 'saturate(1.3) brightness(.92)',
};

export function itemPreview(item) {
  const theme = themeById(item.theme);
  if (item.slot === 'table') {
    const el = h('div.pv.pv-table', {}, h('div.pv-felt', {}, h('div.felt-photo'), h('div.felt-cloth')), ...(theme.decor || []).slice(0, 2).map((motif, index) => h(`img.pv-decor.d${index}`, { src: img(motif), alt: '' })));
    setVars(el, tableVars(theme));
    return el;
  }
  if (item.slot === 'cardBack') {
    const el = h('div.pv.pv-card', {}, cardBack());
    setVars(el, backVars(theme));
    return el;
  }
  if (item.slot === 'cardFace') {
    const el = h('div.pv.pv-card.pv-face', {}, cardFace({ id: `pv-${item.id}`, suit: 'hearts', rank: 'K' }), cardFace({ id: `pv2-${item.id}`, suit: 'spades', rank: '7' }));
    setVars(el, faceVars(theme));
    applyFaceStyle(el, theme);
    return el;
  }
  if (item.slot === 'effect') {
    const motifs = theme.burst?.length ? theme.burst : ['sparkles'];
    return h('div.pv.pv-burst', {}, ...motifs.slice(0, 3).map((motif, index) => h(`img.b${index}`, { src: img(motif), alt: '' })));
  }
  if (item.slot === 'charm') {
    const toy = charmToyConfig(item.id, 0);
    const image = h('img', { src: img(toy.motif), alt: '' });
    if (toy.filter) image.style.filter = FILTERS[toy.filter] || '';
    if (item.id === 'charm-classic') return h('div.pv.pv-trio', {}, ...['custard', 'star', 'rose'].map((motif) => h('img', { src: img(motif), alt: '' })));
    return h('div.pv.pv-toy', {}, image);
  }
  if (item.slot === 'victory') {
    return h('div.pv.pv-victory', { vars: { '--v-accent': theme.accent } }, h('i.pv-rays'), h('img', { src: img(theme.hero || 'trophy'), alt: '' }));
  }
  if (item.slot === 'avatar') {
    return h('div.pv.pv-avatar', {}, h('img', { src: img(item.motif || 'rabbit-face'), alt: '' }));
  }
  return h('div.pv');
}
