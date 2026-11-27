// 점수 흐름 모의 실험 — node tests/economy-sim.mjs [--players=2000] [--from=335000] [--to=1000000] [--games=900]
// 1) 시즌 1 규칙(★1~★5, 패배 −50, 보너스판 ×2)으로 0 → FROM 점에 몇 판이 걸렸는지(친구 판수 추정)
// 2) 시즌 2(AI 난이도 1~20단계 + 보상 상자: 기본 × 배수 + 판수 보너스)로 FROM → TO 점에 몇 판이 걸리는지
// 승률은 가정값이다(아래 WIN_RATE). 실제 판수 · 승률을 알면 바꿔 넣고 다시 돌린다.
import { AI_LEVEL_COUNT, WIN_REWARDS, lossForLevel, matchmakingWeights, bonusMatchChance, BONUS_MATCH_MULTIPLIER } from '../src/core/rating.js';
import { rollRewardBoxes, veteranBonus } from '../src/core/reward-box.js';

const arg = (name, fallback) => {
  const raw = (process.argv.find((value) => value.startsWith(`--${name}=`)) || '').split('=')[1];
  const number = Number(raw);
  return raw != null && raw !== '' && Number.isFinite(number) ? number : fallback;
};
const PLAYERS = arg('players', 2000);
const FROM = arg('from', 335000);
const TARGET = arg('to', 1000000);
// 가정 승률 — 옛 ★1~★8(1 · 2 · 3 · 5 · 8 · 11 · 15 · 20단계) 값을 사이 단계에 고르게 편 것(11-27 AI 난이도 20단계).
// 시즌 1 ★4 · ★5 는 「아무 카드나 내는 것과 세기가 같았다」(11-24 AI 검사), ★6~★8 은 공개 정보만 쓰는 강한 AI
const STAR_WIN_RATE = [0.85, 0.82, 0.8, 0.78, 0.75, 0.62, 0.55, 0.5];
const STAR_LEVELS = [1, 2, 3, 5, 8, 11, 15, 20];
const WIN_RATE = Object.fromEntries(Array.from({ length: AI_LEVEL_COUNT }, (_, index) => {
  const level = index + 1;
  const upper = STAR_LEVELS.findIndex((anchor) => anchor >= level);
  if (STAR_LEVELS[upper] === level) return [level, STAR_WIN_RATE[upper]];
  const t = (level - STAR_LEVELS[upper - 1]) / (STAR_LEVELS[upper] - STAR_LEVELS[upper - 1]);
  return [level, STAR_WIN_RATE[upper - 1] + (STAR_WIN_RATE[upper] - STAR_WIN_RATE[upper - 1]) * t];
}));
// 시즌 1 규칙 — 친구의 시즌 1 판수 추정에만(보상 ★1~★5 · 점수대별 ★ 확률, 2만 점부터 ★4 30% · ★5 70%)
const S1_REWARDS = [125, 180, 250, 340, 500];
const S1_LOSS = -50;
const S1_BANDS = [[500, [55, 35, 10, 0, 0]], [1500, [20, 45, 30, 5, 0]], [3500, [5, 25, 45, 22, 3]], [7000, [0, 8, 42, 40, 10]], [11000, [0, 2, 25, 48, 25]], [15000, [0, 0, 12, 48, 40]], [20000, [0, 0, 5, 40, 55]], [Infinity, [0, 0, 0, 30, 70]]];

function pickIndex(weights, random) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cursor = random() * total;
  for (let index = 0; index < weights.length; index += 1) {
    cursor -= weights[index];
    if (cursor < 0) return index;
  }
  return weights.length - 1;
}

function season1GamesTo(goal, random) {
  let points = 0;
  let games = 0;
  while (points < goal && games < 20000) {
    games += 1;
    const star = pickIndex(S1_BANDS.find(([below]) => points < below)[1], random);
    const bonus = random() < bonusMatchChance(points);
    if (random() < STAR_WIN_RATE[star]) points += S1_REWARDS[star] * (bonus ? BONUS_MATCH_MULTIPLIER : 1);
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
    const level = pickIndex(matchmakingWeights(points), random) + 1;
    const bonus = random() < bonusMatchChance(points);
    const won = random() < WIN_RATE[level];
    const match = won ? WIN_REWARDS[level] * (bonus ? BONUS_MATCH_MULTIPLIER : 1) : lossForLevel(level);
    const boxes = rollRewardBoxes({ won, level, bonus, games, owned: [] }, random);
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

console.log(`가정 승률 ${Object.entries(WIN_RATE).map(([level, rate]) => `${level}단계 ${Math.round(rate * 100)}%`).join(' · ')}`);
console.log(`시즌 1 규칙으로 0 → ${FROM.toLocaleString()}점: 가운데 ${s1Median}판 (10%~90%: ${quantile(s1, 0.1)}~${quantile(s1, 0.9)}판) — 판당 약 ${Math.round(FROM / Math.max(1, s1Median))}점`);
console.log(`시즌 2로 ${FROM.toLocaleString()} → ${TARGET.toLocaleString()}점 (시작 판수 ${startGames}판, 판수 보너스 ×${veteranBonus(startGames).toFixed(1)}): 가운데 ${quantile(played, 0.5)}판 (10%~90%: ${quantile(played, 0.1)}~${quantile(played, 0.9)}판) — 판당 약 ${Math.round(perGame)}점`);
console.log(`그중 상자 몫 ${Math.round(boxShare * 100)}% · ×10 상자는 한 사람 평균 ${(runs.reduce((sum, run) => sum + run.tens, 0) / PLAYERS).toFixed(1)}번`);
