export const SUITS = ['hearts', 'diamonds', 'spades', 'clubs'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS = {
  hearts: '♥', diamonds: '♦', spades: '♠', clubs: '♣',
};

const VALID_DIFFICULTIES = new Set(['easy', 'normal', 'hard']);

export function createDeck() {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({
    id: `${suit}-${rank}`,
    suit,
    rank,
  })));
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
    this.hands = [deck.splice(0, 7), deck.splice(0, 7)];
    this.discardPile = [];
    this.drawPile = deck;
    this.currentPlayer = 0;
    this.attackCount = 0;
    this.requestedSuit = null;
    this.winner = null;
    this.turnNumber = 1;
    this.playedCount = [0, 0];

    let firstCard = this.drawPile.pop();
    while (['2', '7', 'A', 'J', 'Q', 'K'].includes(firstCard.rank)) {
      this.drawPile.unshift(firstCard);
      firstCard = this.drawPile.pop();
    }
    this.discardPile.push(firstCard);
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
      requestedSuit: this.requestedSuit,
      activeSuit: this.activeSuit,
      winner: this.winner,
      turnNumber: this.turnNumber,
      playedCount: [...this.playedCount],
      difficulty: this.difficulty,
    };
  }

  isPlayable(card) {
    if (this.winner !== null) return false;
    if (this.attackCount > 0) return card.rank === '2' || card.rank === 'A';
    return card.rank === '7' || card.suit === this.activeSuit || card.rank === this.topCard.rank;
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

    hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    this.playedCount[player] += 1;
    this.requestedSuit = card.rank === '7' ? chosenSuit : null;

    if (card.rank === '2') this.attackCount += 2;
    if (card.rank === 'A') this.attackCount += 3;

    if (hand.length === 0) {
      this.winner = player;
      return { type: 'win', player, card: { ...card }, winner: player };
    }

    const extraTurn = ['J', 'Q', 'K'].includes(card.rank);
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
    this.attackCount = 0;
    this.advanceTurn();
    return { type: 'draw', player, count: cards.length, cards, wasPenalty };
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

  assertTurn(player) {
    if (this.winner !== null) throw new Error('이미 끝난 게임입니다.');
    if (this.currentPlayer !== player) throw new Error('지금은 해당 플레이어의 차례가 아닙니다.');
  }
}
