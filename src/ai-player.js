import { SUITS } from './game-engine.js';

export function chooseAiMove(game, difficulty = 'normal', random = Math.random) {
  const player = 1;
  const playable = game.playableCards(player);
  if (playable.length === 0) return { type: 'draw' };

  const tier = difficultyTier(difficulty);
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
