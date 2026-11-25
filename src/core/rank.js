// 내 단계 — 금별 · 루비 · 분홍 장미 · 왕관, 다섯 단계씩 모두 20단계(11-25 선생님 「별 다음에는 루비 · 그다음 것도 다섯 개씩 · 황금 말고 분홍 장미」)
// 점수로 정하고 그림 개수로 보인다(루비 3단계 = 루비 셋). 마지막 왕관 5단계 = 100만 점(시즌 목표).
// 보상 · 친구 대전 점수 계산 · AI 상대 난이도는 지금 별(rating.js 의 1~8) 그대로 — 단계는 「내가 어디쯤인가」를 보여 주는 것만
// 단계 점수 — 「왕관 5 = 100만 점으로 잘 스케일링」(11-25 선생님). 시즌 2 규칙 모의 실험(보상 상자 · 판수 보너스 · ★6~★8, 승률 가정은
// tests/economy-sim.mjs 와 같음)으로 0 → 100만 점이 가운데값 약 680판, k 단계에 닿는 판 ≈ 680 × ((k−1)/19)^1.8 로 잡았다.
// 한 단계에 걸리는 판이 4판(처음)에서 64판(마지막)까지 고르게 늘어난다(같은 간격으로 두면 판당 점수가 큰 위쪽이 오히려 빨리 올랐다)
export const RANK_UNITS = Object.freeze([
  Object.freeze({ key: 'star', name: '금별', art: 'rank-star', thresholds: Object.freeze([0, 1000, 5000, 13000, 26000]) }),
  Object.freeze({ key: 'ruby', name: '루비', art: 'rank-ruby', thresholds: Object.freeze([42000, 62000, 87000, 120000, 160000]) }),
  Object.freeze({ key: 'rose', name: '분홍 장미', art: 'rank-rose', thresholds: Object.freeze([200000, 250000, 300000, 370000, 450000]) }),
  Object.freeze({ key: 'crown', name: '왕관', art: 'rank-crown', thresholds: Object.freeze([540000, 640000, 750000, 870000, 1000000]) }),
]);

const LADDER = Object.freeze(RANK_UNITS.flatMap((unit, unitIndex) => unit.thresholds.map((min, step) => Object.freeze({
  level: unitIndex * 5 + step + 1, unit, count: step + 1, min,
}))));
export const RANK_LEVELS = LADDER.length;

const nameOf = (step) => `${step.unit.name} ${step.count}단계`;

// { level 1~20, unit 'star' · 'ruby' · 'rose' · 'crown', unitName, art, count 1~5, name, min, next: { level, name, min } | null }
export function rankForPoints(points) {
  const score = Math.max(0, Math.floor(Number(points) || 0));
  let current = LADDER[0];
  for (const step of LADDER) if (score >= step.min) current = step;
  const next = LADDER[current.level] || null;
  return {
    level: current.level, unit: current.unit.key, unitName: current.unit.name, art: current.unit.art, count: current.count,
    name: nameOf(current), min: current.min, next: next ? { level: next.level, name: nameOf(next), min: next.min } : null,
  };
}
