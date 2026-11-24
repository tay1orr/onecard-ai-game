// 점수 흐름 모의 실험 — node tests/economy-sim.mjs [--players=2000] [--from=335000] [--games=900]
// 1) 시즌 1 규칙(★1~★5, 패배 −50, 보너스판 ×2)으로 0 → 33만 점에 몇 판이 걸렸는지(친구 판수 추정)
// 2) 시즌 2(★6~★8 + 보상 상자: 기본 × 배수 + 판수 보너스)로 33만 → 100만 점에 몇 판이 걸리는지
// 승률은 가정값이다(아래 WIN_RATE). 실제 판수 · 승률을 알면 바꿔 넣고 다시 돌린다.
import { WIN_REWARDS, LOSS_PENALTIES, matchmakingWeights, bonusMatchChance, BONUS_MATCH_MULTIPLIER } from '../src/core/rating.js';
import { rollRewardBoxes, veteranBonus } from '../src/core/reward-box.js';

const arg = (name, fallback) => {
  const raw = (process.argv.find((value) => value.startsWith(`--${name}=`)) || '').split('=')[1];
  const number = Number(raw);
  return raw != null && raw !== '' && Number.isFinite(number) ? number : fallback;
};
const PLAYERS = arg('players', 2000);
const FROM = arg('from', 335000);
const TARGET = arg('to', 1000000);
// 가정 승률 — 시즌 1 ★4 · ★5 는 「아무 카드나 내는 것과 세기가 같았다」(11-24 AI 검사), 시즌 2 ★6~★8 은 공개 정보만 쓰는 강한 AI
const WIN_RATE = { 1: 0.85, 2: 0.82, 3: 0.8, 4: 0.78, 5: 0.75, 6: 0.62, 7: 0.55, 8: 0.5 };
const S1_LOSS = -50;

function pickStars(points, random) {
  const weights = matchmakingWeights(points);
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cursor = random() * total;
  for (let index = 0; index < weights.length; index += 1) {
    cursor -= weights[index];
    if (cursor < 0) return index + 1;
  }
  return weights.length;
}

// 시즌 1: 2만 점 넘으면 ★4 30% · ★5 70%(시즌 1 마지막 띠), 상자 없음
function season1GamesTo(goal, random) {
  let points = 0;
  let games = 0;
  while (points < goal && games < 20000) {
    games += 1;
    const stars = points >= 20000 ? (random() < 0.3 ? 4 : 5) : Math.min(5, pickStars(points, random));
    const bonus = random() < bonusMatchChance(points);
    if (random() < WIN_RATE[stars]) points += WIN_REWARDS[stars] * (bonus ? BONUS_MATCH_MULTIPLIER : 1);
    else points = Math.max(0, points + S1_LOSS);
  }
  return games;
}

// 시즌 2: 판 점수 + 상자 하나(셋 중 아무거나 — 고르기는 순수한 선택)
function season2Run(from, startGames, goal, random) {
  let points = from;
  let games = startGames;
  let played = 0;
  let fromBoxes = 0;
  let fromMatches = 0;
  let tens = 0;
  while (points < goal && played < 20000) {
    played += 1;
    games += 1;
    const stars = pickStars(points, random);
    const bonus = random() < bonusMatchChance(points);
    const won = random() < WIN_RATE[stars];
    const match = won ? WIN_REWARDS[stars] * (bonus ? BONUS_MATCH_MULTIPLIER : 1) : (LOSS_PENALTIES[stars] ?? S1_LOSS);
    const boxes = rollRewardBoxes({ won, stars, bonus, games, owned: [] }, random);
    const box = boxes[Math.floor(random() * 3)];
    if (box.multiplier === 10) tens += 1;
    points = Math.max(0, points + match + box.amount);
    fromMatches += match;
    fromBoxes += box.amount;
  }
  return { played, fromBoxes, fromMatches, tens };
}

const quantile = (list, q) => [...list].sort((a, b) => a - b)[Math.floor((list.length - 1) * q)];
const s1 = Array.from({ length: PLAYERS }, () => season1GamesTo(Math.max(FROM, 1), Math.random));
const s1Median = quantile(s1, 0.5);
const startGames = arg('games', s1Median);
const runs = Array.from({ length: PLAYERS }, () => season2Run(FROM, startGames, TARGET, Math.random));
const played = runs.map((run) => run.played);
const boxShare = runs.reduce((sum, run) => sum + run.fromBoxes, 0) / runs.reduce((sum, run) => sum + run.fromBoxes + run.fromMatches, 0);
const perGame = (TARGET - FROM) / quantile(played, 0.5);

console.log(`가정 승률 ${Object.entries(WIN_RATE).map(([stars, rate]) => `★${stars} ${Math.round(rate * 100)}%`).join(' · ')}`);
console.log(`시즌 1 규칙으로 0 → ${FROM.toLocaleString()}점: 가운데 ${s1Median}판 (10%~90%: ${quantile(s1, 0.1)}~${quantile(s1, 0.9)}판) — 판당 약 ${Math.round(FROM / s1Median)}점`);
console.log(`시즌 2로 ${FROM.toLocaleString()} → ${TARGET.toLocaleString()}점 (시작 판수 ${startGames}판, 판수 보너스 ×${veteranBonus(startGames).toFixed(1)}): 가운데 ${quantile(played, 0.5)}판 (10%~90%: ${quantile(played, 0.1)}~${quantile(played, 0.9)}판) — 판당 약 ${Math.round(perGame)}점`);
console.log(`그중 상자 몫 ${Math.round(boxShare * 100)}% · ×10 상자는 한 사람 평균 ${(runs.reduce((sum, run) => sum + run.tens, 0) / PLAYERS).toFixed(1)}번`);
