// 카드 무늬 — 글꼴 기호 대신 SVG(기기마다 모양이 달라지지 않게)
const PATHS = {
  hearts: '<path d="M50 90C24 70 6 54 6 34 6 19 17 9 30.5 9 39.5 9 46 14 50 22 54 14 60.5 9 69.5 9 83 9 94 19 94 34 94 54 76 70 50 90Z"/>',
  diamonds: '<path d="M50 4C60 22 74 38 90 50 74 62 60 78 50 96 40 78 26 62 10 50 26 38 40 22 50 4Z"/>',
  spades: '<path d="M50 5C62 24 92 37 92 60 92 74 81 82 69 82 61 82 55.5 78.5 52.5 73 53.5 82 57.5 89.5 65 95H35C42.5 89.5 46.5 82 47.5 73 44.5 78.5 39 82 31 82 19 82 8 74 8 60 8 37 38 24 50 5Z"/>',
  clubs: '<circle cx="50" cy="28" r="19"/><circle cx="27" cy="57" r="19"/><circle cx="73" cy="57" r="19"/><path d="M44 50h12c0 21 4 33 11 45H33c7-12 11-24 11-45Z"/>',
  joker: '<path d="M50 6 61 37 94 38 68 58 77 91 50 72 23 91 32 58 6 38 39 37Z"/>',
};

export const SUIT_NAMES = { hearts: '하트', diamonds: '다이아', spades: '스페이드', clubs: '클로버', joker: '조커' };
export const RED_SUITS = new Set(['hearts', 'diamonds']);
export const SUIT_MOTIF = { hearts: 'heart', diamonds: 'diamond', spades: 'spade', clubs: 'club' };

export function installSuitSprite() {
  if (document.getElementById('suit-sprite')) return;
  const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sprite.id = 'suit-sprite';
  sprite.setAttribute('aria-hidden', 'true');
  sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  sprite.innerHTML = Object.entries(PATHS).map(([suit, body]) => `<symbol id="suit-${suit}" viewBox="0 0 100 100">${body}</symbol>`).join('');
  document.body.prepend(sprite);
}

export function suitSvg(suit, className = 'suit') {
  return `<svg class="${className}" viewBox="0 0 100 100" aria-hidden="true"><use href="#suit-${suit}"/></svg>`;
}

// 숫자 카드 무늬 자리(가로 %, 세로 %, 뒤집힘) — 실제 카드와 같은 배치
const C = 50; const L = 28; const R = 72;
export const PIP_LAYOUTS = {
  2: [[C, 18], [C, 82, 1]],
  3: [[C, 18], [C, 50], [C, 82, 1]],
  4: [[L, 18], [R, 18], [L, 82, 1], [R, 82, 1]],
  5: [[L, 18], [R, 18], [C, 50], [L, 82, 1], [R, 82, 1]],
  6: [[L, 18], [R, 18], [L, 50], [R, 50], [L, 82, 1], [R, 82, 1]],
  7: [[L, 18], [R, 18], [C, 34], [L, 50], [R, 50], [L, 82, 1], [R, 82, 1]],
  8: [[L, 18], [R, 18], [C, 34], [L, 50], [R, 50], [C, 66, 1], [L, 82, 1], [R, 82, 1]],
  9: [[L, 16], [R, 16], [L, 39], [R, 39], [C, 50], [L, 61, 1], [R, 61, 1], [L, 84, 1], [R, 84, 1]],
  10: [[L, 16], [R, 16], [C, 29], [L, 39], [R, 39], [L, 61, 1], [R, 61, 1], [C, 71, 1], [L, 84, 1], [R, 84, 1]],
};
