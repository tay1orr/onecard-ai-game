export const SUITS = ['hearts', 'diamonds', 'spades', 'clubs'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const JOKER_COUNT = 2;

export const SUIT_SYMBOLS = {
  hearts: '♥', diamonds: '♦', spades: '♠', clubs: '♣', joker: '★',
};

const VALID_DIFFICULTIES = new Set(['easy', 'normal', 'hard']);

export function createDeck() {
  const standardCards = SUITS.flatMap((suit) => RANKS.map((rank) => ({
    id: `${suit}-${rank}`,
    suit,
    rank,
  })));
  const jokers = Array.from({ length: JOKER_COUNT }, (_, index) => ({
    id: `joker-${index + 1}`,
    suit: 'joker',
    rank: 'JOKER',
  }));
  return [...standardCards, ...jokers];
}

export function shuffled(cards, random = Math.random) {
  const result = [...cards];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export class OneCardGame {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.difficulty = 'normal';
    this.reset();
  }

  reset(difficulty = this.difficulty) {
    this.difficulty = VALID_DIFFICULTIES.has(difficulty) ? difficulty : 'normal';
    const deck = shuffled(createDeck(), this.random);
    this.hands = [deck.splice(0, 5), deck.splice(0, 5)];
    this.discardPile = [];
    this.drawPile = deck;
    this.currentPlayer = 0;
    this.attackCount = 0;
    this.freePlay = false;
    this.requestedSuit = null;
    this.winner = null;
    this.turnNumber = 1;
    this.playedCount = [0, 0];

    let firstCard = this.drawPile.pop();
    while (['2', '7', 'A', 'J', 'Q', 'K', 'JOKER'].includes(firstCard.rank)) {
      this.drawPile.unshift(firstCard);
      firstCard = this.drawPile.pop();
    }
    this.discardPile.push(firstCard);
    this.history = [{
      player: null,
      card: { ...firstCard },
      turn: 0,
      requestedSuit: null,
    }];
    return this.snapshot();
  }

  get topCard() {
    return this.discardPile.at(-1);
  }

  get activeSuit() {
    return this.requestedSuit || this.topCard.suit;
  }

  snapshot() {
    return {
      hands: this.hands.map((hand) => hand.map((card) => ({ ...card }))),
      drawCount: this.drawPile.length,
      topCard: { ...this.topCard },
      currentPlayer: this.currentPlayer,
      attackCount: this.attackCount,
      freePlay: this.freePlay,
      requestedSuit: this.requestedSuit,
      activeSuit: this.activeSuit,
      winner: this.winner,
      turnNumber: this.turnNumber,
      playedCount: [...this.playedCount],
      difficulty: this.difficulty,
      history: this.history.map((entry) => ({
        ...entry,
        card: { ...entry.card },
      })),
    };
  }

  isPlayable(card) {
    if (this.winner !== null) return false;
    if (this.attackCount > 0) {
      return this.topCard.rank === 'JOKER'
        ? card.rank === 'JOKER'
        : ['2', 'A', 'JOKER'].includes(card.rank);
    }
    if (this.freePlay) return true;
    if (card.rank === 'JOKER') return true;
    if (card.suit === this.activeSuit) return true;
    if (this.topCard.rank === '7' && card.rank === '7') return true;
    if (this.requestedSuit) return false;
    return card.rank === this.topCard.rank;
  }

  playableCards(player = this.currentPlayer) {
    return this.hands[player].filter((card) => this.isPlayable(card));
  }

  playCard(player, cardId, chosenSuit = null) {
    this.assertTurn(player);
    const hand = this.hands[player];
    const cardIndex = hand.findIndex((card) => card.id === cardId);
    if (cardIndex < 0) throw new Error('손에 없는 카드입니다.');
    const card = hand[cardIndex];
    if (!this.isPlayable(card)) throw new Error('지금은 낼 수 없는 카드입니다.');
    if (card.rank === '7' && !SUITS.includes(chosenSuit)) throw new Error('변경할 무늬를 선택해 주세요.');
    const previousActiveSuit = this.activeSuit;
    this.freePlay = false;

    hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    this.playedCount[player] += 1;
    this.requestedSuit = card.rank === '7'
      ? chosenSuit
      : card.rank === 'JOKER' ? previousActiveSuit : null;
    this.history.push({
      player,
      card: { ...card },
      turn: this.turnNumber,
      requestedSuit: this.requestedSuit,
    });

    if (card.rank === '2') this.attackCount += 2;
    if (card.rank === 'A') this.attackCount += 3;
    if (card.rank === 'JOKER') this.attackCount += 5;

    if (hand.length === 0) {
      this.winner = player;
      return { type: 'win', player, card: { ...card }, winner: player };
    }

    const extraTurn = ['J', 'K'].includes(card.rank);
    if (!extraTurn) this.advanceTurn();
    return {
      type: 'play', player, card: { ...card }, extraTurn,
      attackCount: this.attackCount, requestedSuit: this.requestedSuit,
    };
  }

  drawCards(player) {
    this.assertTurn(player);
    const count = this.attackCount > 0 ? this.attackCount : 1;
    const cards = [];
    for (let index = 0; index < count; index += 1) {
      const card = this.drawOne();
      if (!card) break;
      this.hands[player].push(card);
      cards.push({ ...card });
    }
    const wasPenalty = this.attackCount > 0;
    const grantsFreePlay = wasPenalty && this.topCard.rank === 'JOKER';
    this.attackCount = 0;
    this.advanceTurn();
    this.freePlay = grantsFreePlay;
    return { type: 'draw', player, count: cards.length, cards, wasPenalty, grantsFreePlay };
  }

  drawOne() {
    if (this.drawPile.length === 0) this.recycleDiscardPile();
    return this.drawPile.pop() || null;
  }

  recycleDiscardPile() {
    if (this.discardPile.length <= 1) return;
    const top = this.discardPile.pop();
    this.drawPile = shuffled(this.discardPile, this.random);
    this.discardPile = [top];
  }

  advanceTurn() {
    this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
    this.turnNumber += 1;
  }

  setStartingPlayer(player) {
    if (![0, 1].includes(player)) throw new Error('선공 플레이어 값이 올바르지 않습니다.');
    if (this.turnNumber !== 1 || this.playedCount.some((count) => count > 0)) {
      throw new Error('게임 시작 전에만 선공을 정할 수 있습니다.');
    }
    this.currentPlayer = player;
    return this.currentPlayer;
  }

  assertTurn(player) {
    if (this.winner !== null) throw new Error('이미 끝난 게임입니다.');
    if (this.currentPlayer !== player) throw new Error('지금은 해당 플레이어의 차례가 아닙니다.');
  }
}
