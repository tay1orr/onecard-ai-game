import { SUITS } from './game-engine.js';
import { chooseEliteMove, ELITE_KEYS } from './ai-elite.js';

// AI 엔진 — star1~star5 는 카드 점수, star6 은 카드 세기, star7 · search… · star8 은 공개 정보에 맞는 판을 뽑아 끝까지 두어 봄(ai-elite.js)
// AI 난이도 20단계(lv1~lv20, 11-27) — 옛 ★1~★8 은 1 · 2 · 3 · 5 · 8 · 11 · 15 · 20단계에 그대로 두고,
// 사이 단계는 이웃 두 엔진을 수마다 정한 비율(mix = 센 쪽을 쓸 확률)로 섞어 세기가 고르게 오르게 한다.
// 16~19단계는 7성과 8성 사이로 뽑아 보는 판 · 시간 · 후보를 늘린다. 어느 단계든 상대 손패 · 덱 내용은 보지 않는다
export const AI_LEVELS = Object.freeze([
  { level: 1, base: 'star1', summary: '낼 수 있는 카드 중 아무거나' },
  { level: 2, base: 'star2', summary: '점수 높은 절반 중 아무거나' },
  { level: 3, base: 'star3', summary: '점수 상위 3장 중 고름' },
  { level: 4, base: 'star3', up: 'star4', mix: 1 / 2, summary: '3성과 4성 반반' },
  { level: 5, base: 'star4', summary: '다음 수까지 보는 점수 · 상위 2장' },
  { level: 6, base: 'star4', up: 'star5', mix: 1 / 3, summary: '4성에 5성 1/3' },
  { level: 7, base: 'star4', up: 'star5', mix: 2 / 3, summary: '4성에 5성 2/3' },
  { level: 8, base: 'star5', summary: '한 수 앞 점수 · 가끔 차선' },
  { level: 9, base: 'star5', up: 'star6', mix: 1 / 3, summary: '5성에 6성 1/3' },
  { level: 10, base: 'star5', up: 'star6', mix: 2 / 3, summary: '5성에 6성 2/3' },
  { level: 11, base: 'star6', summary: '나온 카드를 세고 상대가 못 낸 무늬를 기억 · 막기 카드를 아낌' },
  { level: 12, base: 'star6', up: 'star7', mix: 1 / 4, summary: '6성에 7성 1/4' },
  { level: 13, base: 'star6', up: 'star7', mix: 1 / 2, summary: '6성과 7성 반반' },
  { level: 14, base: 'star6', up: 'star7', mix: 3 / 4, summary: '6성에 7성 3/4' },
  { level: 15, base: 'star7', summary: '보이는 정보에 맞는 판을 여러 벌 뽑아 후보 수마다 끝까지 두어 봄' },
  { level: 16, base: 'search80', summary: '판 80벌까지 · 후보 6' },
  { level: 17, base: 'search140', summary: '판 140벌까지 · 후보 6' },
  { level: 18, base: 'search210', summary: '판 210벌까지 · 후보 7 · 좋은 후보에 몰아 씀' },
  { level: 19, base: 'search300', summary: '판 300벌까지 · 후보 8 · 좋은 후보에 몰아 씀' },
  { level: 20, base: 'star8', summary: '7성보다 열 배 넘게 두어 보고, 좋은 후보에 판을 몰아 씀' },
].map((plan) => Object.freeze(plan)));

// 이번 수에 쓸 엔진 — 단계 키(lv1~lv20)는 위 표로, 옛 키(star1~star8 · easy · normal · hard)는 그대로
export function engineFor(difficulty, random = Math.random) {
  const match = /^lv(\d{1,2})$/.exec(String(difficulty));
  if (!match) return difficulty;
  const plan = AI_LEVELS[Math.min(AI_LEVELS.length, Math.max(1, Number(match[1]))) - 1];
  return plan.up && random() < plan.mix ? plan.up : plan.base;
}

export function chooseAiMove(game, difficulty = 'normal', random = Math.random) {
  const engine = engineFor(difficulty, random);
  if (ELITE_KEYS.includes(engine)) return chooseEliteMove(game, engine, random);
  const player = 1;
  const playable = game.playableCards(player);
  if (playable.length === 0) return { type: 'draw' };

  const tier = difficultyTier(engine);
  let card;
  if (tier === 1) {
    card = playable[Math.floor(random() * playable.length)];
  } else {
    const scored = playable.map((candidate) => ({
      card: candidate,
      score: scoreCard(candidate, game, tier, player),
    }));
    scored.sort((a, b) => b.score - a.score);
    const choicePool = tier === 2
      ? scored.slice(0, Math.max(1, Math.ceil(scored.length / 2)))
      : scored.slice(0, Math.min(tier === 3 ? 3 : 2, scored.length));
    const weights = tier === 2
      ? choicePool.map(() => 1)
      : tier === 3 ? [55, 30, 15]
        : tier === 4 ? [72, 28]
          : [88, 12];
    card = weightedChoice(choicePool, weights, random).card;
  }

  return {
    type: 'play',
    cardId: card.id,
    chosenSuit: card.rank === '7' ? chooseSuit(game.hands[player], card.id) : null,
  };
}

function difficultyTier(difficulty) {
  if (/^star[1-5]$/.test(difficulty)) return Number(difficulty.at(-1));
  return difficulty === 'easy' ? 1 : difficulty === 'hard' ? 4 : 3;
}

function weightedChoice(items, weights, random) {
  const usableWeights = items.map((_, index) => weights[index] ?? 1);
  const total = usableWeights.reduce((sum, value) => sum + value, 0);
  let cursor = random() * total;
  for (let index = 0; index < items.length; index += 1) {
    cursor -= usableWeights[index];
    if (cursor < 0) return items[index];
  }
  return items.at(-1);
}

function scoreCard(card, game, tier, player) {
  const handAfter = game.hands[player].filter((item) => item.id !== card.id);
  const opponentCount = game.hands[0].length;
  const suitStrength = handAfter.filter((item) => item.suit === card.suit).length;
  let score = suitStrength * 2;

  if (card.rank === '2') score += opponentCount <= 3 ? 14 : 8;
  if (card.rank === 'A') score += opponentCount <= 3 ? 16 : 9;
  if (card.rank === 'JOKER') score += opponentCount <= 3 ? 24 : 12;
  if (card.rank === 'J') score += opponentCount <= 3 ? 12 : 6;
  if (card.rank === '7') score += handAfter.length <= 2 ? 9 : 3;
  if (game.attackCount > 0) score += card.rank === 'JOKER' ? 8 : card.rank === 'A' ? 4 : 2;

  if (tier >= 4) {
    const nextSuit = card.rank === '7' ? chooseSuit(handAfter) : card.rank === 'JOKER' ? game.activeSuit : card.suit;
    const futureMatches = handAfter.filter((item) => item.rank === 'JOKER' || item.suit === nextSuit || item.rank === card.rank).length;
    score += futureMatches * 3;
    if (handAfter.length === 1 && canFollow(handAfter[0], card, nextSuit)) score += 18;
    if (opponentCount === 1 && ['2', 'A', 'JOKER', 'J'].includes(card.rank)) score += 15;
    if (opponentCount > 4 && ['2', 'A', 'JOKER'].includes(card.rank)) score -= 4;
  }

  if (tier >= 5) {
    const sameRank = handAfter.filter((item) => item.rank === card.rank).length;
    const safeSuitCards = handAfter.filter((item) => item.suit === card.suit || item.rank === 'JOKER').length;
    score += sameRank * 2 + safeSuitCards;
    if (handAfter.length <= 2 && card.rank === '7') score += 5;
  }

  return score;
}

function canFollow(card, previous, activeSuit) {
  if (card.rank === 'JOKER') return true;
  if (previous.rank === '7') return card.suit === activeSuit || card.rank === '7';
  if (previous.rank === 'JOKER') return card.suit === activeSuit;
  return card.suit === activeSuit || card.rank === previous.rank;
}

export function chooseSuit(hand, excludedCardId = null) {
  const counts = Object.fromEntries(SUITS.map((suit) => [suit, 0]));
  hand.forEach((card) => {
    if (card.id !== excludedCardId) counts[card.suit] += 1;
  });
  return SUITS.reduce((best, suit) => counts[suit] > counts[best] ? suit : best, SUITS[0]);
}
