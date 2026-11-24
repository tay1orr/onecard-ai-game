// 대전 화면 공통 조각 — 무늬 고르기(손패를 가리지 않는 판), 낸 카드 기록, 안내 문구
import gsap from 'gsap';
import { h } from './dom.js';
import { openModal } from './modal.js';
import { cardFace, cardLabel } from './cards.js';
import { SUIT_NAMES, RED_SUITS, suitSvg } from './suits.js';
import { play } from './sound.js';

const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'];

// 7을 낼 때 — 손패 위에 뜨는 판이라 내 패를 보면서 고른다
export function pickSuit({ host, hand }) {
  return new Promise((resolve) => {
    const counts = Object.fromEntries(SUITS.map((suit) => [suit, hand.filter((card) => card.suit === suit).length]));
    const best = SUITS.reduce((top, suit) => (counts[suit] > counts[top] ? suit : top), SUITS[0]);
    const done = (suit) => {
      play(suit ? 'confirm' : 'close');
      gsap.to(sheet, { y: 30, opacity: 0, duration: 0.16, onComplete: () => sheet.remove() });
      document.removeEventListener('keydown', onKey);
      resolve(suit);
    };
    const onKey = (event) => { if (event.key === 'Escape') done(null); };
    // 창 위에서 누르기 시작한 것만 받는다(11-24) — 휴대폰은 7 을 누른 손가락을 떼면 그 자리에 마우스 누름을 한 번 더 보내는데,
    // 그 자리에 막 뜬 무늬 단추가 있어 사람이 고르기도 전에 무늬가 정해졌다. 키보드(Enter · Space)는 detail 0 이라 그대로 받는다
    let pressedHere = false;
    const pick = (suit) => (event) => { if (event.detail !== 0 && !pressedHere) return; done(suit); };
    const sheet = h('div.suit-sheet', { role: 'dialog', 'aria-label': '바꿀 무늬 고르기', onPointerdown: () => { pressedHere = true; } },
      h('p.sheet-title', {}, '바꿀 무늬를 골라요'),
      h('div.suit-grid', {}, ...SUITS.map((suit) => h(`button.suit-btn${RED_SUITS.has(suit) ? '.is-red' : ''}${suit === best && counts[suit] ? '.is-best' : ''}`, {
        type: 'button', onClick: pick(suit), 'aria-label': `${SUIT_NAMES[suit]}, 내 패에 ${counts[suit]}장`,
      }, h('span.suit-icon', { html: suitSvg(suit) }), h('b', {}, SUIT_NAMES[suit]), h('small', {}, `내 패 ${counts[suit]}장`)))),
      h('button.btn.ghost.sheet-cancel', { type: 'button', onClick: pick(null) }, '7 내기 그만두기'));
    host.append(sheet);
    document.addEventListener('keydown', onKey);
    gsap.fromTo(sheet, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'back.out(1.8)' });
    sheet.querySelector('.suit-btn')?.focus();
  });
}

export function showHistory(entries, { nameOf }) {
  const list = h('ol.history-list', {}, ...[...entries].reverse().map((entry, index) => {
    const mini = cardFace(entry.card);
    mini.classList.add('mini');
    const who = entry.player === null ? '시작 카드' : nameOf(entry.player);
    const change = entry.requestedSuit
      ? entry.card.rank === 'JOKER' ? `, ${SUIT_NAMES[entry.requestedSuit]} 그대로` : `, ${SUIT_NAMES[entry.requestedSuit]}로 바꿈`
      : '';
    return h(`li.history-row${entry.player === 0 ? '.is-me' : ''}`, {}, mini, h('div', {}, h('strong', {}, who), h('small', {}, `${cardLabel(entry.card)}${change}`)), h('span.history-order', {}, index === 0 ? '방금' : `${entry.turn || 0}턴`));
  }));
  openModal({ title: '낸 카드', body: h('div.history-wrap', {}, list), className: 'is-history', actions: [{ label: '닫기', kind: 'ghost', onClick: (modal) => modal.close() }] });
}

// 판 가운데 안내 — 처음 세 판(beginner)은 자세히, 그 뒤로는 내 차례에 공격을 받았을 때 · 무늬가 바뀌었을 때만 짧게
// (11-24 「낼 때마다 나오는 글씨가 정신없고 초보자 설명 같다」 — 낼 수 있는 카드는 손패에서 이미 떠오른다)
export function playHint(state) {
  const { attackCount, topCard, freePlay, activeSuit, requestedSuit, myTurn, beginner = false } = state;
  if (!beginner) {
    if (!myTurn) return '';
    if (attackCount) return topCard.rank === 'JOKER' ? `조커 공격 ${attackCount}장 — 조커로만 막기` : `공격 ${attackCount}장 — 막거나 받기`;
    if (freePlay) return '아무 카드나 한 장';
    return requestedSuit ? `${SUIT_NAMES[activeSuit]} 또는 7` : '';
  }
  if (attackCount) {
    return topCard.rank === 'JOKER'
      ? `조커 공격 ${attackCount}장이 쌓였어요. 조커로만 막을 수 있어요`
      : `공격 ${attackCount}장이 쌓였어요. 2나 A, 조커로 막거나 덱을 눌러 받아요`;
  }
  if (freePlay) return '조커 공격이 통했어요. 아무 카드나 한 장 내요';
  if (!myTurn) return '';
  if (requestedSuit) return `${SUIT_NAMES[activeSuit]} 카드나 다른 7을 낼 수 있어요`;
  return `${SUIT_NAMES[activeSuit]} 카드나 ${topCard.rank === 'JOKER' ? '조커' : topCard.rank}를 낼 수 있어요`;
}

export function blockedReason({ attackCount, topCard }) {
  if (attackCount) return topCard.rank === 'JOKER' ? '조커 공격은 조커로만 막을 수 있어요' : '2나 A, 조커로 막거나 덱을 눌러 받아요';
  return '같은 무늬나 같은 숫자를 내요';
}
