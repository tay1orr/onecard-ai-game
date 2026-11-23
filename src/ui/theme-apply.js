// 테마 → CSS 변수. 카드 · 탁자 요소는 변수만 읽고, 아이템을 바꾸면 변수만 바뀐다(목록을 다시 그리지 않음).
import { themeById } from '../data/themes.js';
import { artUrl, img, photo, tex } from '../data/assets.js';
import { cosmeticById } from '../core/cosmetics.js';
import { SUIT_MOTIF } from './suits.js';

const url = (value) => (value ? `url("${value}")` : 'none');

export function backPatternCss(back) {
  const c = back.line;
  switch (back.pattern) {
    case 'weave': return `repeating-linear-gradient(45deg, ${c} 0 1.5px, transparent 1.5px 7px), repeating-linear-gradient(-45deg, ${c} 0 1.5px, transparent 1.5px 7px)`;
    case 'gingham': return `repeating-linear-gradient(0deg, ${c} 0 7px, transparent 7px 14px), repeating-linear-gradient(90deg, ${c} 0 7px, transparent 7px 14px)`;
    case 'dots': return `radial-gradient(${c} 24%, transparent 27%) 0 0/14px 14px, radial-gradient(${c} 24%, transparent 27%) 7px 7px/14px 14px`;
    case 'seeds': return `radial-gradient(ellipse 28% 42% at 50% 50%, ${c} 62%, transparent 68%) 0 0/12px 16px, radial-gradient(ellipse 28% 42% at 50% 50%, ${c} 62%, transparent 68%) 6px 8px/12px 16px`;
    case 'stars': return `radial-gradient(circle at 20% 30%, ${c} 0 1.2px, transparent 1.7px) 0 0/22px 22px, radial-gradient(circle at 70% 80%, ${c} 0 .9px, transparent 1.4px) 0 0/17px 17px, radial-gradient(circle at 50% 50%, ${c} 0 1.6px, transparent 2.1px) 0 0/31px 31px`;
    case 'compass': return `repeating-conic-gradient(from 0deg at 50% 50%, ${c} 0 1deg, transparent 1deg 15deg), repeating-radial-gradient(circle at 50% 50%, transparent 0 13px, ${c} 13px 14px)`;
    case 'gears': return `repeating-radial-gradient(circle at 50% 50%, ${c} 0 2px, transparent 2px 9px), repeating-conic-gradient(from 7deg at 50% 50%, ${c} 0 4deg, transparent 4deg 20deg)`;
    case 'ripples': return `repeating-radial-gradient(circle at 30% 115%, transparent 0 9px, ${c} 9px 10px, transparent 10px 17px)`;
    case 'runes': return `repeating-linear-gradient(60deg, ${c} 0 1.5px, transparent 1.5px 12px), repeating-linear-gradient(-60deg, ${c} 0 1.5px, transparent 1.5px 12px)`;
    case 'damask': return `radial-gradient(circle at 50% 50%, transparent 0 6px, ${c} 6px 7.2px, transparent 7.2px) 0 0/20px 20px, radial-gradient(circle at 50% 50%, ${c} 0 2px, transparent 2.6px) 10px 10px/20px 20px`;
    case 'argyle': return `linear-gradient(45deg, transparent 47%, ${c} 47% 53%, transparent 53%) 0 0/18px 18px, linear-gradient(-45deg, transparent 47%, ${c} 47% 53%, transparent 53%) 0 0/18px 18px, conic-gradient(from 45deg, rgba(255,255,255,.07) 25%, transparent 0 50%, rgba(255,255,255,.07) 0 75%, transparent 0) 0 0/36px 36px`;
    case 'chevron': return `linear-gradient(135deg, ${c} 25%, transparent 25%) -9px 0/18px 18px, linear-gradient(225deg, ${c} 25%, transparent 25%) -9px 0/18px 18px`;
    case 'herringbone': return `repeating-linear-gradient(45deg, ${c} 0 2px, transparent 2px 10px) 0 0/20px 20px, repeating-linear-gradient(-45deg, ${c} 0 2px, transparent 2px 10px) 10px 0/20px 20px`;
    case 'circuit': return `linear-gradient(${c} 1px, transparent 1px) 0 0/16px 16px, linear-gradient(90deg, ${c} 1px, transparent 1px) 0 0/16px 16px, radial-gradient(${c} 2px, transparent 2.6px) 8px 8px/32px 32px`;
    case 'rays': return `repeating-conic-gradient(from 0deg at 50% 50%, ${c} 0 6deg, transparent 6deg 15deg)`;
    case 'constellation': return `radial-gradient(circle at 25% 30%, ${c} 0 1.5px, transparent 2px) 0 0/34px 34px, radial-gradient(circle at 70% 65%, ${c} 0 1.2px, transparent 1.7px) 0 0/26px 26px, linear-gradient(32deg, transparent 49.4%, ${c} 49.4% 50.6%, transparent 50.6%) 0 0/34px 34px`;
    case 'bauhaus': return 'radial-gradient(circle at 32% 28%, #d93a2f 0 17%, transparent 17.6%), linear-gradient(135deg, transparent 63%, #2a5bd7 63%), linear-gradient(#f2c230, #f2c230) 70% 74%/24% 18% no-repeat, linear-gradient(90deg, transparent 48%, #1d1d1b 48% 52%, transparent 52%) 0 0/100% 100% no-repeat';
    case 'holo': return 'conic-gradient(from 210deg at 30% 40%, rgba(255,140,200,.5), rgba(140,200,255,.5), rgba(170,255,200,.45), rgba(255,240,150,.45), rgba(255,140,200,.5)), repeating-linear-gradient(115deg, rgba(255,255,255,.16) 0 2px, transparent 2px 9px)';
    default: return 'none';
  }
}

export function clothCss(theme) {
  const c = theme.clothColor;
  switch (theme.cloth) {
    case 'gingham': return `repeating-linear-gradient(0deg, ${c} 0 26px, transparent 26px 52px), repeating-linear-gradient(90deg, ${c} 0 26px, transparent 26px 52px)`;
    case 'stripes': return `repeating-linear-gradient(100deg, ${c} 0 22px, transparent 22px 64px)`;
    case 'dots': return `radial-gradient(${c} 18%, transparent 21%) 0 0/46px 46px, radial-gradient(${c} 18%, transparent 21%) 23px 23px/46px 46px`;
    case 'waves': return `repeating-radial-gradient(ellipse 60% 30% at 30% 40%, transparent 0 30px, ${c} 30px 33px, transparent 33px 58px)`;
    case 'lattice': return `repeating-linear-gradient(45deg, ${c} 0 2px, transparent 2px 46px), repeating-linear-gradient(-45deg, ${c} 0 2px, transparent 2px 46px)`;
    case 'stars': return `radial-gradient(circle at 20% 30%, ${c} 0 1.6px, transparent 2.2px) 0 0/70px 70px, radial-gradient(circle at 60% 70%, ${c} 0 1.2px, transparent 1.8px) 0 0/53px 53px, radial-gradient(circle at 80% 20%, ${c} 0 2px, transparent 2.8px) 0 0/121px 121px`;
    case 'damask': return `radial-gradient(circle at 50% 50%, transparent 0 16px, ${c} 16px 18px, transparent 18px) 0 0/58px 58px, radial-gradient(circle at 50% 50%, ${c} 0 4px, transparent 5px) 29px 29px/58px 58px`;
    case 'arena': return `radial-gradient(circle at 50% 50%, transparent 0 17%, ${c} 17% calc(17% + 3px), transparent calc(17% + 3px)), linear-gradient(90deg, transparent calc(50% - 1.5px), ${c} calc(50% - 1.5px) calc(50% + 1.5px), transparent calc(50% + 1.5px))`;
    case 'circuit': return `linear-gradient(${c} 1px, transparent 1px) 0 0/44px 44px, linear-gradient(90deg, ${c} 1px, transparent 1px) 0 0/44px 44px, radial-gradient(${c} 3px, transparent 3.5px) 22px 22px/88px 88px`;
    case 'runes': return `repeating-linear-gradient(60deg, ${c} 0 2px, transparent 2px 40px), repeating-linear-gradient(-60deg, ${c} 0 2px, transparent 2px 40px)`;
    case 'herringbone': return `repeating-linear-gradient(45deg, ${c} 0 3px, transparent 3px 18px) 0 0/36px 36px, repeating-linear-gradient(-45deg, ${c} 0 3px, transparent 3px 18px) 18px 0/36px 36px`;
    case 'holo': return 'conic-gradient(from 120deg at 50% 50%, rgba(255,140,200,.10), rgba(140,200,255,.10), rgba(170,255,200,.08), rgba(255,240,150,.08), rgba(255,140,200,.10))';
    default: return 'none';
  }
}

function rimCss(theme) {
  if (theme.rim === 'color') return theme.rimColor;
  const tone = { walnut: '#3a2416', maple: '#a0602e', leather: '#16161a', marble: '#151518', kraft: '#8a6a3c' }[theme.rim] || '#3a2416';
  return `${url(tex(theme.rim))} center/360px, ${tone}`;
}

export function tableVars(theme) {
  return {
    '--felt': theme.felt,
    '--felt-deep': theme.feltDeep,
    '--rim': rimCss(theme),
    '--cloth': clothCss(theme),
    '--felt-photo': theme.photo ? url(photo(theme.photo, 'wide')) : 'none',
    '--table-accent': theme.accent,
  };
}

export function backVars(theme) {
  const back = theme.back;
  const emblem = back.emblem || 'none';
  const textEmblem = emblem.startsWith('text:') ? emblem.slice(5) : '';
  return {
    '--back-base': back.base,
    '--back-base2': back.base2,
    '--back-line': back.line,
    '--back-frame': back.frame,
    '--back-pattern': backPatternCss(back),
    '--back-emblem': !textEmblem && emblem !== 'none' ? url(img(emblem)) : 'none',
    '--back-emblem-text': `"${textEmblem}"`,
    '--back-texture': back.texture ? url(tex(back.texture)) : 'none',
    '--back-photo': back.photo ? url(photo(back.photo, 'card')) : 'none',
  };
}

export function faceVars(theme) {
  const vars = {
    '--paper': theme.paper,
    '--ink': theme.ink,
    '--red': theme.red,
    '--face-accent': theme.accent,
    '--court-J': url(artUrl(theme.court.J)),
    '--court-Q': url(artUrl(theme.court.Q)),
    '--court-K': url(artUrl(theme.court.K)),
    '--ace-art': theme.ace === 'suit' ? '' : url(artUrl(theme.ace)),
    '--ace-small': theme.ace === 'suit' ? 'none' : 'block',
    '--joker-art': url(img('joker')),
    '--face-texture': theme.faceStyle === 'parchment' ? url(tex('kraft')) : 'none',
  };
  Object.entries(SUIT_MOTIF).forEach(([suit, motif]) => { vars[`--ace-${suit}`] = url(img(motif)); });
  return vars;
}

export const FACE_STYLES = ['classic', 'parchment', 'scanline', 'deco', 'stone', 'glass', 'blueprint', 'ink', 'tarot', 'league', 'holo', 'photo'];

export function applyFaceStyle(el, theme) {
  FACE_STYLES.forEach((style) => el.classList.remove(`fs-${style}`));
  el.classList.add(`fs-${theme.faceStyle || 'classic'}`);
}

export function themeFor(itemId) {
  return themeById(cosmeticById(itemId)?.theme);
}

// 장착한 아이템 → 한 요소(게임판 · 미리보기)에 변수 입히기
export function applyEquipped(el, equipped) {
  const table = themeFor(equipped.table);
  const back = themeFor(equipped.cardBack);
  const face = themeFor(equipped.cardFace);
  const vars = { ...tableVars(table), ...backVars(back), ...faceVars(face) };
  Object.entries(vars).forEach(([prop, value]) => el.style.setProperty(prop, value));
  applyFaceStyle(el, face);
  el.dataset.tableTheme = table.id;
  return { table, back, face, effect: themeFor(equipped.effect), victory: themeFor(equipped.victory) };
}
