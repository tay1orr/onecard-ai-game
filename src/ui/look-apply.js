// 꾸미기 → 화면. 맵(배경 사진 · 탁자 재질 · 소품) · 카드 뒷면 · 카드 앞면을 CSS 변수와 장면 요소로 입힌다.
// 아이템을 바꾸면 변수와 소품만 바뀐다(목록 · 카드를 다시 그리지 않음).
import { h } from './dom.js';
import { backArt, court, cut, paint, photo, scene, tex } from '../data/assets.js';
import { lookOf } from '../data/looks.js';
import { hasGptArt } from '../data/gpt-art.js';
import { cosmeticById } from '../core/cosmetics.js';

const url = (value) => (value ? `url("${value}")` : 'none');
const SUITS = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' };
const RANKS = ['K', 'Q', 'J'];

// 조명 — 장면 위에 덮는 빛(사진을 살리고 탁자로 눈이 가게)
export const LIGHTS = {
  none: 'none',
  spot: 'radial-gradient(ellipse 62% 70% at 50% 48%, transparent 38%, rgba(4,6,10,.62) 100%)',
  warm: 'radial-gradient(ellipse 70% 60% at 50% 42%, rgba(255,196,128,.16), transparent 70%), radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(28,12,2,.5) 100%)',
  candle: 'radial-gradient(circle at 8% 38%, rgba(255,170,80,.26), transparent 26%), radial-gradient(circle at 92% 38%, rgba(255,170,80,.26), transparent 26%), radial-gradient(ellipse 80% 80% at 50% 50%, transparent 46%, rgba(20,6,4,.62) 100%)',
  moon: 'linear-gradient(180deg, rgba(40,70,140,.28), rgba(6,10,30,.42)), radial-gradient(ellipse 70% 70% at 50% 45%, transparent 40%, rgba(2,4,14,.55) 100%)',
  day: 'radial-gradient(ellipse 85% 80% at 50% 45%, transparent 55%, rgba(10,14,20,.32) 100%)',
  cool: 'linear-gradient(180deg, rgba(10,60,110,.22), rgba(2,12,30,.45))',
  dusk: 'linear-gradient(180deg, rgba(120,60,90,.18), rgba(20,8,24,.5)), radial-gradient(ellipse 80% 80% at 50% 50%, transparent 46%, rgba(8,4,12,.5) 100%)',
  // 사진 한 장 판 — 가장자리만 살짝 어둡게(가운데 카드로 눈이 가게)
  vignette: 'radial-gradient(ellipse 80% 74% at 50% 48%, transparent 50%, rgba(6,8,12,.34) 100%)',
};

// 재질 한 겹: [질감, 덧칠 색, 섞기, 무늬 크기(px)] → background · blend 짝
function layer(spec, fallback) {
  if (!spec || spec === 'none') return { bg: 'none', blend: 'normal' };
  const [key, tint = null, blend = 'multiply', size = 420] = spec;
  const image = `${url(tex(key))} center / ${size}px`;
  return tint ? { bg: `${image}, ${tint}`, blend: `${blend}, normal` } : { bg: `${image}, ${fallback}`, blend: 'normal, normal' };
}

export function mapVars(map, { small = false } = {}) {
  const vars = {};
  if (map.painted) {
    vars['--scene-photo'] = url(paint(map.painted, small ? 's' : ''));
    // 휴대폰 세로 화면 — 선생님이 GPT 로 따로 그린 세로 판(tall-<판>)이 있으면 그것, 없으면 가로 그림의 가운데를 자른 것(-m)
    const tall = `tall-${map.painted}`;
    vars['--scene-photo-tall'] = url(small ? paint(map.painted, 's') : hasGptArt(tall) ? paint(tall) : paint(map.painted, 'm'));
  } else if (map.scene) {
    vars['--scene-photo'] = url(scene(map.scene, small ? 's' : ''));
    vars['--scene-photo-tall'] = url(scene(map.scene, small ? 's' : 'm'));
  } else if (map.photo) {
    vars['--scene-photo'] = url(photo(map.photo, 'wide'));
    vars['--scene-photo-tall'] = vars['--scene-photo'];
  } else {
    vars['--scene-photo'] = 'none';
    vars['--scene-photo-tall'] = 'none';
  }
  vars['--scene-base'] = map.base || '#10131c';
  vars['--scene-blur'] = `${small ? Math.min(1, map.blur) : map.blur}px`;
  vars['--scene-bright'] = String(map.bright);
  vars['--scene-sat'] = String(map.sat);
  vars['--scene-light'] = LIGHTS[map.light] || 'none';
  const top = layer(map.top, map.topColor || '#1d6b52');
  vars['--top-bg'] = top.bg;
  vars['--top-blend'] = top.blend;
  const rim = layer(map.rim, '#2a1a10');
  vars['--rim-bg'] = rim.bg;
  vars['--rim-blend'] = rim.blend;
  vars['--table-accent'] = map.accent;
  return vars;
}

// 장면 소품 — 탁자 바깥 양옆에 세운 실물 누끼
export function renderProps(el, map) {
  el.replaceChildren(...(map.props || []).map(([key, x, y, height, rotate = 0, flip = false]) => h('img.scene-prop', {
    src: cut(key), alt: '', draggable: 'false', decoding: 'async',
    vars: { '--x': `${x}%`, '--y': `${y}%`, '--h': `${height}%`, '--r': `${rotate}deg`, '--flip': flip ? -1 : 1 },
  })));
}

export function backVars(back) {
  let art = 'none';
  if (back.art) art = url(backArt(back.art));
  else if (back.paint) art = url(paint(back.paint));
  else if (back.photo) art = url(photo(back.photo, 'card'));
  return {
    '--back-art': art,
    '--back-fit': back.fit === 'fill' ? '100% 100%' : 'cover',
    '--back-pos': back.pos || 'center',
    '--back-filter': back.filter || 'none',
    '--back-base': back.base,
    '--back-border': back.border === 'none' ? 'transparent' : back.border,
    '--back-inset': back.border === 'none' ? '0%' : `${back.inset}%`,
    '--back-paper': back.border === 'none' ? 'none' : url(tex(back.paper || 'paper-white')),
    '--back-frame': back.frame || 'transparent',
    '--back-texture': back.tex ? url(tex(back.tex)) : 'none',
    '--back-emblem-text': back.emblem ? `"${back.emblem}"` : '""',
    '--back-caption': back.caption ? `"${back.caption}"` : '""',
    '--back-foil': back.foil ? '1' : '0',
  };
}

function courtUrl(value, set) {
  if (!value) return null;
  if (value.startsWith('cut:')) return cut(value.slice(4));
  if (value.startsWith('photo:')) return photo(value.slice(6), 'card');
  if (value.startsWith('paint:')) return paint(value.slice(6));
  if (value.includes('/')) {
    const [s, k] = value.split('/');
    return court(s, k);
  }
  return court(set, value);
}

export function faceVars(face) {
  const vars = {
    '--paper': face.tint,
    '--paper-img': face.paper ? url(tex(face.paper)) : 'none',
    '--ink': face.ink,
    '--red': face.red,
    '--face-accent': face.accent,
    '--court-fx': face.courtFx || 'none',
    '--court-blend': face.courtBlend || 'multiply',
    '--court-fit': face.courtFit || 'cover',
    '--face-frame': face.frame?.startsWith?.('paint:') ? url(paint(face.frame.slice(6))) : 'none',
    '--joker-art': url(courtUrl(face.joker || 'jokers/joker-1')),
    '--pip-foil': face.pips === 'gold' ? url(tex('gold-foil')) : face.pips === 'silver' ? url(tex('onyx-white')) : 'none',
  };
  Object.entries(SUITS).forEach(([suit, letter]) => {
    RANKS.forEach((rank) => {
      const value = typeof face.court === 'string'
        ? (face.perSuit ? `${face.court}/${rank}${letter}` : `${face.court}/${rank}`)
        : face.court?.[rank];
      vars[`--court-${rank}${letter}`] = url(courtUrl(value, typeof face.court === 'string' ? face.court : null));
    });
    const ace = typeof face.ace === 'string' ? face.ace : face.ace?.[suit];
    vars[`--ace-${letter}`] = ace ? url(courtUrl(ace)) : 'none';
    vars[`--ace-on-${letter}`] = ace ? '1' : '0';
  });
  return vars;
}

export const FACE_STYLES = ['plain', 'thin', 'gold', 'deco', 'glass', 'grid', 'neon', 'paint'];

export function applyFaceStyle(el, face) {
  FACE_STYLES.forEach((style) => el.classList.remove(`ff-${style}`));
  const frame = face.frame?.startsWith?.('paint:') ? 'paint' : face.frame || 'plain';
  el.classList.add(`ff-${frame}`);
  el.classList.toggle('pips-foil', face.pips === 'gold' || face.pips === 'silver');
}

export const lookFor = (itemId) => {
  const item = cosmeticById(itemId);
  return item ? lookOf(item.slot, item.look) : null;
};

function setVars(el, vars) {
  Object.entries(vars).forEach(([prop, value]) => el.style.setProperty(prop, value));
}

// 장착한 아이템 → 한 요소(게임판 · 미리보기)에 입히기. 장면 소품 칸(propsEl)이 있으면 소품도 세운다.
export function applyEquipped(el, equipped, { propsEl = null, small = false } = {}) {
  const map = lookOf('table', cosmeticById(equipped.table)?.look);
  const back = lookOf('cardBack', cosmeticById(equipped.cardBack)?.look);
  const face = lookOf('cardFace', cosmeticById(equipped.cardFace)?.look);
  setVars(el, { ...mapVars(map, { small }), ...backVars(back), ...faceVars(face) });
  applyFaceStyle(el, face);
  el.dataset.map = map.painted || map.surface ? 'painted' : 'photo';
  el.dataset.shape = map.shape;
  el.dataset.backFoil = back.foil ? '1' : '0';
  el.dataset.rim = !map.rim || map.rim === 'none' ? 'none' : 'on';
  if (propsEl) renderProps(propsEl, map);
  return {
    map, back, face,
    effect: lookOf('effect', cosmeticById(equipped.effect)?.look),
    victory: lookOf('victory', cosmeticById(equipped.victory)?.look),
  };
}
