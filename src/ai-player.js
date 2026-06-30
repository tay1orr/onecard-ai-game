import { SUITS } from './game-engine.js';

export function chooseAiMove(game, difficulty = 'normal', random = Math.random) {
  const player = 1;
  const playable = game.playableCards(player);
  if (playable.length === 0) return { type: 'draw' };

  let card;
  if (difficulty === 'easy') {
    card = playable[Math.floor(random() * playable.length)];
  } else {
    const scored = playable.map((candidate) => ({
      card: candidate,
      score: scoreCard(candidate, game, difficulty, player),
    }));
    scored.sort((a, b) => b.score - a.score);
    const bestScore = scored[0].score;
    const best = scored.filter((entry) => entry.score === bestScore);
    card = best[Math.floor(random() * best.length)].card;
  }

  return {
    type: 'play',
    cardId: card.id,
    chosenSuit: card.rank === '7' ? chooseSuit(game.hands[player], card.id) : null,
  };
}

function scoreCard(card, game, difficulty, player) {
  const handAfter = game.hands[player].filter((item) => item.id !== card.id);
  const opponentCount = game.hands[0].length;
  const suitStrength = handAfter.filter((item) => item.suit === card.suit).length;
  let score = suitStrength * 2;

  if (card.rank === '2') score += opponentCount <= 3 ? 14 : 8;
  if (card.rank === 'A') score += opponentCount <= 3 ? 16 : 9;
  if (['J', 'Q', 'K'].includes(card.rank)) score += opponentCount <= 3 ? 12 : 6;
  if (card.rank === '7') score += handAfter.length <= 2 ? 9 : 3;
  if (game.attackCount > 0) score += card.rank === 'A' ? 4 : 2;

  if (difficulty === 'hard') {
    const nextSuit = card.rank === '7' ? chooseSuit(handAfter) : card.suit;
    const futureMatches = handAfter.filter((item) => item.suit === nextSuit || item.rank === card.rank || item.rank === '7').length;
    score += futureMatches * 3;
    if (handAfter.length === 1 && canFollow(handAfter[0], card, nextSuit)) score += 18;
    if (opponentCount === 1 && ['2', 'A', 'J', 'Q', 'K'].includes(card.rank)) score += 15;
    if (opponentCount > 4 && ['2', 'A'].includes(card.rank)) score -= 4;
  }

  return score;
}

function canFollow(card, previous, activeSuit) {
  return card.rank === '7' || card.suit === activeSuit || card.rank === previous.rank;
}

export function chooseSuit(hand, excludedCardId = null) {
  const counts = Object.fromEntries(SUITS.map((suit) => [suit, 0]));
  hand.forEach((card) => {
    if (card.id !== excludedCardId) counts[card.suit] += 1;
  });
  return SUITS.reduce((best, suit) => counts[suit] > counts[best] ? suit : best, SUITS[0]);
}
