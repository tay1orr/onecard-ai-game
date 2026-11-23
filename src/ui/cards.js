// 카드 그리기 — 숫자 카드는 실제 카드처럼 무늬를 배치하고, 그림카드 · A 는 테마 그림을 쓴다
import { PIP_LAYOUTS, RED_SUITS, SUIT_NAMES, suitSvg } from './suits.js';

const RANK_LABEL = { A: 'A', J: 'J', Q: 'Q', K: 'K' };

export function cardLabel(card) {
  if (!card) return '';
  if (card.rank === 'JOKER') return '조커';
  return `${SUIT_NAMES[card.suit]} ${card.rank}`;
}

function pipsHtml(card) {
  const layout = PIP_LAYOUTS[card.rank];
  return layout.map(([x, y, flip]) => `<span class="pip${flip ? ' flip' : ''}" style="left:${x}%;top:${y}%">${suitSvg(card.suit)}</span>`).join('');
}

export function cardFace(card, { tag = 'div' } = {}) {
  const el = document.createElement(tag);
  const joker = card.rank === 'JOKER';
  el.className = `card face s-${card.suit} r-${card.rank} ${RED_SUITS.has(card.suit) ? 'is-red' : 'is-black'}${joker ? ' is-joker' : ''}`;
  el.dataset.id = card.id;
  if (tag === 'button') el.type = 'button';
  el.setAttribute('aria-label', joker ? '조커, 공격 다섯 장' : cardLabel(card));
  if (joker) {
    el.innerHTML = '<span class="joker-band"><b>JOKER</b></span><span class="joker-art"></span><b class="joker-power">+5</b><span class="joker-band bottom"><b>JOKER</b></span>';
    return el;
  }
  const label = RANK_LABEL[card.rank] || card.rank;
  const index = `<b>${label}</b>${suitSvg(card.suit)}`;
  let center;
  if (PIP_LAYOUTS[card.rank]) center = `<span class="pips">${pipsHtml(card)}</span>`;
  else if (card.rank === 'A') center = `<span class="ace-art"></span><span class="ace-suit">${suitSvg(card.suit)}</span>`;
  else center = `<span class="court"><b class="court-letter">${label}</b><span class="court-art"></span>${suitSvg(card.suit, 'suit court-suit')}</span>`;
  el.innerHTML = `<span class="idx tl">${index}</span><span class="center">${center}</span><span class="idx br">${index}</span>`;
  return el;
}

export function cardBack() {
  const el = document.createElement('div');
  el.className = 'card back';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i class="back-photo"></i><i class="back-pattern"></i><i class="back-frame"></i><b class="back-emblem"></b>';
  return el;
}
