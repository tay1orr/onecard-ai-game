// 손패 부채꼴 배치 — 카드 수와 폭에 맞춰 간격 · 기울기 · 높이를 정한다(순수 함수 · 테스트 대상)
export function fanLayout(count, width, cardWidth, { compact = false, invert = false } = {}) {
  if (count <= 0) return [];
  const maxSpan = Math.max(0, width - cardWidth - 12);
  const ideal = cardWidth * (compact ? 0.6 : 0.74);
  const step = count > 1 ? Math.min(ideal, maxSpan / (count - 1)) : 0;
  const mid = (count - 1) / 2;
  const maxAngle = compact ? 20 : 14;
  const angleStep = count > 1 ? Math.min(compact ? 4.5 : 3.2, maxAngle / Math.max(1, mid)) : 0;
  const sink = compact ? 2.4 : 1.7;
  return Array.from({ length: count }, (_, index) => {
    const offset = index - mid;
    const y = Math.abs(offset) ** 1.55 * sink * Math.max(0.5, angleStep / 3);
    return { x: offset * step, y: invert ? -y : y, r: (invert ? -1 : 1) * offset * angleStep };
  });
}

// 보기 좋게 정렬: 스페이드 · 하트 · 클로버 · 다이아(검정 · 빨강이 번갈아), 숫자 차례, 조커는 끝
const SUIT_ORDER = { spades: 0, hearts: 1, clubs: 2, diamonds: 3, joker: 4 };
const RANK_ORDER = { A: 1, J: 11, Q: 12, K: 13, JOKER: 14 };
export function sortHand(cards) {
  return [...cards].sort((a, b) => (SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit])
    || ((RANK_ORDER[a.rank] || Number(a.rank)) - (RANK_ORDER[b.rank] || Number(b.rank)))
    || a.id.localeCompare(b.id));
}
