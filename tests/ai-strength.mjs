// 상위 AI 세기 검사 — 6 · 7 · 8성이 한 단계 아래를 이기는지, 한 수 생각 시간이 예산 안인지
//   node tests/ai-strength.mjs           전체 검사(이 PC 약 2~3분)
//   node tests/ai-strength.mjs --quick   빠른 검사(npm test 에 넣을 수 있게)
// 판은 모두 정해진 씨앗으로 섞고 AI 에도 씨앗 난수를 넘긴다.
// 같은 판(같은 배분 · 같은 덱)을 두 번 두되 두 AI 가 자리를 바꾼다 — 패 운을 덜어 실력 차만 본다.
// AI 에는 상대 손패와 덱을 가린(가짜 카드로 바꾼) 얼린 사본을 준다 — 훔쳐보거나 판을 바꾸면 바로 깨진다.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { OneCardGame } from '../src/core/game-engine.js';
import { chooseAiMove } from '../src/core/ai-player.js';

const QUICK = process.argv.includes('--quick');
const MAX_MS = 60; // 한 수 최대 — 느린 학교 PC 기준 예산
const AVG_MS = 15; // 한 수 평균
const Z95 = 1.645; // 한쪽 95%

// [위 단계, 아래 단계, 배분 수(판 수 = 배분 × 2)]
// 전체 검사: 이웃 단계끼리 — 위 단계 승률의 한쪽 95% 하한이 50% 위여야(통계적으로 셈) 통과
// 빠른 검사: 판이 적어 5성과의 큰 차이만 — 위 단계 승률이 50% 위면 통과
const MATCHES = QUICK
  ? [['star6', 'star5', 150], ['star7', 'star5', 30], ['star8', 'star5', 20]]
  : [['star6', 'star5', 200], ['star7', 'star6', 500], ['star8', 'star7', 400], ['star8', 'star5', 150]];

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

// seat 자리의 사람이 보는 판: 자기는 늘 1번 자리, 상대 손패 · 덱은 장 수만(가짜 카드), 엔진 난수는 못 씀
function viewFor(game, seat) {
  const hidden = (count, tag) => Array.from({ length: count }, (_, index) => ({ id: `${tag}-${index}`, suit: 'hidden', rank: 'hidden' }));
  const view = Object.create(OneCardGame.prototype);
  Object.assign(view, {
    random: () => { throw new Error('AI 가 엔진 난수(덱 섞기)를 쓰면 안 됨'); },
    difficulty: game.difficulty,
    hands: [hidden(game.hands[1 - seat].length, 'opp'), game.hands[seat].map((card) => ({ ...card }))],
    discardPile: game.discardPile.map((card) => ({ ...card })),
    drawPile: hidden(game.drawPile.length, 'deck'),
    currentPlayer: 1,
    attackCount: game.attackCount,
    freePlay: game.freePlay,
    requestedSuit: game.requestedSuit,
    winner: null,
    turnNumber: game.turnNumber,
    playedCount: [game.playedCount[1 - seat], game.playedCount[seat]],
    history: game.history.map((entry) => ({
      ...entry,
      card: { ...entry.card },
      player: entry.player === null ? null : entry.player === seat ? 1 : 0,
    })),
  });
  return deepFreeze(view);
}

const timing = new Map();
let retimed = 0;

// 한 수 시간 재기. 예산을 넘으면 다른 프로그램 때문에 멈췄을 수 있어 같은 자리를 한 번 더 재고 빠른 쪽을 쓴다
// (다시 잴 때는 따로 난수를 써서 대전의 난수 흐름은 그대로 둔다)
function timedMove(view, level, random, step) {
  const start = performance.now();
  const move = chooseAiMove(view, level, random);
  let spent = performance.now() - start;
  if (spent > MAX_MS) {
    retimed += 1;
    const again = performance.now();
    chooseAiMove(view, level, mulberry32(step));
    spent = Math.min(spent, performance.now() - again);
  }
  recordTime(level, spent);
  return move;
}

function recordTime(level, ms) {
  const item = timing.get(level) || { count: 0, total: 0, max: 0 };
  item.count += 1;
  item.total += ms;
  item.max = Math.max(item.max, ms);
  timing.set(level, item);
}

// 한 판: levels[자리] 가 두고, 자리 0 이 먼저 낸다. 이긴 자리를 돌려준다.
function playGame(levels, dealSeed) {
  const game = new OneCardGame({ random: mulberry32(dealSeed) });
  game.setStartingPlayer(0);
  const randoms = [mulberry32(dealSeed * 31 + 1), mulberry32(dealSeed * 31 + 2)];
  for (let step = 0; game.winner === null; step += 1) {
    assert.ok(step < 3000, '판이 끝나지 않음');
    const seat = game.currentPlayer;
    const move = timedMove(viewFor(game, seat), levels[seat], randoms[seat], step);
    if (move.type === 'draw') game.drawCards(seat);
    else game.playCard(seat, move.cardId, move.chosenSuit); // 규칙에 어긋난 수면 엔진이 오류를 낸다
  }
  return game.winner;
}

// 배분마다 두 판(자리 바꿔) — 위 단계 점수 0 · 0.5 · 1
function runMatch(upper, lower, deals, seedBase) {
  const scores = [];
  for (let deal = 0; deal < deals; deal += 1) {
    const dealSeed = seedBase + deal;
    const first = playGame([upper, lower], dealSeed) === 0 ? 1 : 0;
    const second = playGame([lower, upper], dealSeed) === 1 ? 1 : 0;
    scores.push((first + second) / 2);
  }
  const mean = scores.reduce((sum, value) => sum + value, 0) / deals;
  const variance = scores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, deals - 1);
  return { mean, lowerBound: mean - Z95 * Math.sqrt(variance / deals), games: deals * 2 };
}

const started = performance.now();
const results = MATCHES.map(([upper, lower, deals], index) => {
  const result = runMatch(upper, lower, deals, 100000 * (index + 1));
  const rate = (result.mean * 100).toFixed(1);
  const bound = (result.lowerBound * 100).toFixed(1);
  console.log(`${upper} 대 ${lower}: ${upper} 승률 ${rate}% (${result.games}판, 95% 하한 ${bound}%)`);
  return { upper, lower, ...result };
});

console.log('한 수 생각 시간(가린 판 만들기 제외):');
for (const [level, item] of [...timing].sort()) {
  console.log(`  ${level}: 평균 ${(item.total / item.count).toFixed(2)}ms · 최대 ${item.max.toFixed(1)}ms (${item.count}수)`);
}
if (retimed) console.log(`  ${MAX_MS}ms 를 넘어 한 번 더 잰 수: ${retimed}개(다른 프로그램 부하로 멈춘 경우)`);
console.log(`걸린 시간 ${((performance.now() - started) / 1000).toFixed(1)}초`);

// 같은 씨앗이면 같은 수 — 대전 뒤(JIT 가 데워진 뒤) 시간 상한에 걸리지 않는 첫 수들로 확인
for (const level of ['star6', 'star7', 'star8']) {
  for (let seed = 1; seed <= 12; seed += 1) {
    const game = new OneCardGame({ random: mulberry32(9000 + seed) });
    game.setStartingPlayer(1);
    const view = viewFor(game, 1);
    const first = chooseAiMove(view, level, mulberry32(seed));
    assert.deepEqual(chooseAiMove(view, level, mulberry32(seed)), first, `${level}: 같은 씨앗 난수면 같은 수를 골라야 함`);
  }
}

for (const result of results) {
  const beats = QUICK ? result.mean > 0.5 : result.lowerBound > 0.5;
  assert.ok(beats, `${result.upper} 가 ${result.lower} 를 이겨야 함(승률 ${(result.mean * 100).toFixed(1)}%, 95% 하한 ${(result.lowerBound * 100).toFixed(1)}%)`);
}
for (const [level, item] of timing) {
  assert.ok(item.max <= MAX_MS, `${level} 한 수 최대 ${item.max.toFixed(1)}ms 는 ${MAX_MS}ms 안이어야 함`);
  assert.ok(item.total / item.count <= AVG_MS, `${level} 한 수 평균은 ${AVG_MS}ms 안이어야 함`);
}
console.log(QUICK ? 'AI 세기 빠른 검사 통과' : 'AI 세기 검사 통과');
