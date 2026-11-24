// 아이템 작은 그림 — 보관함 · 결과 · 시즌 패스 · 로비가 함께 쓴다. 실제 에셋의 작은 판(-s)을 써서 가볍게.
import { h } from './dom.js';
import { lookOf } from '../data/looks.js';
import { backArt, cut, paint, photo, scene } from '../data/assets.js';
import { backVars, faceVars, applyFaceStyle, mapVars } from './look-apply.js';
import { cardBack, cardFace } from './cards.js';
import { charmToyConfig } from '../core/cosmetics.js';

const url = (value) => `url("${value}")`;

function setVars(el, vars) {
  Object.entries(vars).forEach(([key, value]) => el.style.setProperty(key, value));
}

export function smallBackVars(back) {
  const vars = backVars(back);
  if (back.art) vars['--back-art'] = url(backArt(back.art, 's'));
  else if (back.paint) vars['--back-art'] = url(paint(back.paint, 's'));
  return vars;
}

function backdropThumb(backdrop) {
  if (!backdrop) return null;
  if (backdrop.scene) return scene(backdrop.scene, 's');
  if (backdrop.paint) return paint(backdrop.paint, 's');
  if (backdrop.photo) return photo(backdrop.photo, 'wide');
  return null;
}

export function itemPreview(item) {
  if (!item) return h('div.pv');
  if (item.slot === 'table') {
    const map = lookOf('table', item.look);
    const el = h('div.pv.pv-map', { dataset: { map: map.painted || map.surface ? 'painted' : 'photo', rim: !map.rim || map.rim === 'none' ? 'none' : 'on', shape: map.shape } },
      h('i.pv-scene'), h('i.pv-rim', {}, h('i.pv-top')));
    setVars(el, mapVars(map, { small: true }));
    return el;
  }
  if (item.slot === 'cardBack') {
    const el = h('div.pv.pv-card', {}, cardBack());
    setVars(el, smallBackVars(lookOf('cardBack', item.look)));
    return el;
  }
  if (item.slot === 'cardFace') {
    const face = lookOf('cardFace', item.look);
    const el = h('div.pv.pv-card.pv-face', {}, cardFace({ id: `pv-${item.id}`, suit: 'hearts', rank: 'A' }), cardFace({ id: `pv2-${item.id}`, suit: 'spades', rank: 'K' }));
    setVars(el, faceVars(face));
    applyFaceStyle(el, face);
    return el;
  }
  if (item.slot === 'effect') {
    const effect = lookOf('effect', item.look);
    const keys = effect.sprites.length ? effect.sprites.slice(0, 2) : [];
    const el = h('div.pv.pv-burst', {}, ...keys.map((key, index) => h(`img.b${index}`, { src: cut(key, 's'), alt: '', loading: 'lazy' })));
    if (effect.band) el.style.setProperty('--pv-band', url(scene(effect.band, 's')));
    if (effect.band) el.classList.add('has-band');
    return el;
  }
  if (item.slot === 'charm') {
    if (item.id === 'charm-classic') return h('div.pv.pv-trio', {}, ...[0, 1, 2].map((slot) => h('img', { src: cut(charmToyConfig(item.id, slot).img, 's'), alt: '', loading: 'lazy' })));
    return h('div.pv.pv-toy', {}, h('img', { src: cut(charmToyConfig(item.id, 0).img, 's'), alt: '', loading: 'lazy' }));
  }
  if (item.slot === 'victory') {
    const victory = lookOf('victory', item.look);
    const backdrop = backdropThumb(victory.backdrop);
    const el = h('div.pv.pv-victory', { vars: { '--v-accent': victory.accent } }, h('i.pv-backdrop'), h('img', { src: cut(victory.hero, 's'), alt: '', loading: 'lazy' }));
    if (backdrop) el.style.setProperty('--pv-backdrop', url(backdrop));
    return el;
  }
  if (item.slot === 'avatar') {
    return h('div.pv.pv-avatar', {}, h('img', { src: cut(item.portrait || 'rabbit', 's'), alt: '', loading: 'lazy' }));
  }
  return h('div.pv');
}
