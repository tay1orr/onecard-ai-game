import assert from 'node:assert/strict';
import { createDeck, OneCardGame } from '../src/game-engine.js';
import { chooseAiMove, chooseSuit } from '../src/ai-player.js';
import { calculateFanTransform, calculateHandLayout } from '../src/2026-06-30-hand-layout.js';
import { aiReactionDelay, chooseAiReaction } from '../src/2026-07-01-ai-reactions.js';

function card(suit, rank) { return { id: `${suit}-${rank}`, suit, rank }; }

function setState(game, { player = 0, top = card('hearts', '5'), hands, attack = 0, requestedSuit = null, freePlay = false }) {
  game.currentPlayer = player;
  game.discardPile = [top];
  game.hands = hands;
  game.drawPile = [card('clubs', '3'), card('spades', '4'), card('diamonds', '5'), card('clubs', '6')];
  game.attackCount = attack;
  game.freePlay = freePlay;
  game.requestedSuit = requestedSuit;
  game.winner = null;
  game.history = [{ player: null, card: { ...top }, turn: 0, requestedSuit: null }];
}

const game = new OneCardGame({ random: () => 0.42 });

assert.equal(createDeck().length, 54, '표준 카드 52장과 조커 2장을 생성해야 함');
assert.equal(createDeck().filter((item) => item.rank === 'JOKER').length, 2, '조커는 정확히 2장이어야 함');
assert.deepEqual(game.hands.map((hand) => hand.length), [5, 5], '양쪽 플레이어는 5장으로 시작해야 함');
assert.equal(game.drawPile.length, 43, '5장씩 배분하고 시작 카드를 뺀 43장이 덱에 남아야 함');

setState(game, { hands: [[card('hearts', '9'), card('clubs', '5'), card('spades', '7')], [card('clubs', '3')]] });
assert.equal(game.playableCards(0).length, 2, '7도 같은 무늬가 아니면 낼 수 없어야 함');

setState(game, { hands: [[card('hearts', '7'), card('spades', '7')], [card('clubs', '3')]] });
assert.deepEqual(game.playableCards(0).map((item) => item.id), ['hearts-7'], '7은 현재 무늬와 맞을 때만 낼 수 있어야 함');

setState(game, { top: card('spades', '7'), requestedSuit: 'hearts', hands: [[card('spades', '7'), card('hearts', '3')], [card('clubs', '3')]] });
assert.deepEqual(game.playableCards(0).map((item) => item.id), ['spades-7', 'hearts-3'], '7 이후에는 선택된 무늬 또는 다른 7을 낼 수 있어야 함');

setState(game, { hands: [[card('hearts', '9')], [card('clubs', '3')]] });
assert.equal(game.setStartingPlayer(1), 1, '주사위 결과에 따라 AI를 선공으로 지정할 수 있어야 함');
assert.equal(game.currentPlayer, 1, '선공 지정이 현재 플레이어에 반영되어야 함');

setState(game, { attack: 5, hands: [[card('hearts', '2'), card('clubs', 'A'), card('joker', 'JOKER'), card('hearts', '9')], [card('clubs', '3')]] });
assert.deepEqual(game.playableCards(0).map((item) => item.rank).sort(), ['2', 'A', 'JOKER'], '공격 중에는 2, A, 조커만 허용');
game.playCard(0, 'hearts-2');
assert.equal(game.attackCount, 7, '공격이 누적되어야 함');

setState(game, { top: card('joker', 'JOKER'), attack: 5, hands: [[card('hearts', '2'), card('clubs', 'A'), card('joker', 'JOKER')], [card('clubs', '3')]] });
assert.deepEqual(game.playableCards(0).map((item) => item.rank), ['JOKER'], '조커 공격은 조커로만 방어할 수 있어야 함');

setState(game, { top: card('diamonds', '6'), hands: [[card('joker', 'JOKER'), card('clubs', '3')], [card('clubs', '4')]] });
game.playCard(0, 'joker-JOKER');
assert.equal(game.attackCount, 5, '조커 공격은 5장이 누적되어야 함');
assert.equal(game.activeSuit, 'diamonds', '조커 이후에는 직전 유효 무늬를 유지해야 함');

setState(game, { top: card('diamonds', '6'), hands: [[card('joker', 'JOKER'), card('clubs', '3')], [card('spades', '4')]] });
game.playCard(0, 'joker-JOKER');
const jokerPenalty = game.drawCards(1);
assert.equal(jokerPenalty.grantsFreePlay, true, '조커 공격을 받으면 다음 플레이어에게 자유 플레이를 부여해야 함');
assert.equal(game.isPlayable(card('clubs', '3')), true, '조커 공격 다음 턴에는 무늬와 관계없이 낼 수 있어야 함');
game.playCard(0, 'clubs-3');
assert.equal(game.freePlay, false, '자유 플레이는 한 번 행동하면 종료되어야 함');

setState(game, { hands: [[card('hearts', 'K'), card('clubs', '3')], [card('clubs', '4')]] });
const kingPlay = game.playCard(0, 'hearts-K');
assert.equal(kingPlay.extraTurn, false, '2인 게임에서 K는 추가 효과가 없어야 함');
assert.equal(game.currentPlayer, 1, 'K를 내면 일반 카드처럼 상대 차례가 되어야 함');

setState(game, { hands: [[card('hearts', 'Q'), card('clubs', '3')], [card('clubs', '4')]] });
const queenPlay = game.playCard(0, 'hearts-Q');
assert.equal(queenPlay.extraTurn, false, '2인 게임에서 Q는 추가 효과가 없어야 함');
assert.equal(game.currentPlayer, 1, 'Q를 내면 일반 카드처럼 상대 차례가 되어야 함');

setState(game, { top: card('spades', '5'), hands: [[card('spades', '7'), card('clubs', '3')], [card('clubs', '4')]] });
game.playCard(0, 'spades-7', 'clubs');
assert.equal(game.activeSuit, 'clubs', '7이 선택한 무늬를 적용해야 함');
assert.equal(game.history.at(-1).requestedSuit, 'clubs', '카드 기록에 선택한 무늬가 남아야 함');

setState(game, { hands: [[card('hearts', '9')], [card('clubs', '4')]] });
const win = game.playCard(0, 'hearts-9');
assert.equal(win.type, 'win');
assert.equal(game.winner, 0, '마지막 카드를 내면 승리해야 함');

setState(game, { player: 1, hands: [[card('clubs', '4')], [card('hearts', '2'), card('hearts', '8')]] });
assert.equal(chooseAiMove(game, 'normal', () => 0).type, 'play', 'AI가 낼 수 있는 카드를 선택해야 함');
assert.equal(chooseSuit([card('clubs', '3'), card('clubs', '9'), card('spades', '4')]), 'clubs', 'AI가 가장 많은 무늬를 선택해야 함');

const desktop16 = calculateHandLayout({ containerWidth: 900, horizontalPadding: 40, cardWidth: 108, cardCount: 16 });
assert.equal(desktop16.scrolls, false, '데스크톱에서는 16장 양끝이 손패 영역 안에 들어와야 함');
assert.equal(Math.round(desktop16.contentWidth), 900, '데스크톱 16장 너비가 컨테이너에 맞아야 함');

const mobile5 = calculateHandLayout({ containerWidth: 366, horizontalPadding: 36, cardWidth: 72, cardCount: 5, compact: true });
assert.equal(mobile5.scrolls, false, '모바일 시작 패 5장은 스크롤 없이 양끝이 보여야 함');

const mobile16 = calculateHandLayout({ containerWidth: 366, horizontalPadding: 36, cardWidth: 72, cardCount: 16, compact: true });
assert.equal(mobile16.scrolls, true, '모바일 16장은 식별 가능한 간격으로 스크롤되어야 함');
assert.equal(mobile16.step, 42, '모바일 다량 손패의 최소 노출 폭을 보장해야 함');

assert.equal(calculateFanTransform({ index: 0, cardCount: 5, compact: true }).angle, -15, '모바일 첫 카드는 왼쪽으로 펼쳐져야 함');
assert.equal(calculateFanTransform({ index: 2, cardCount: 5, compact: true }).y, -13, '모바일 가운데 카드는 가장 위로 올라와야 함');
assert.equal(calculateFanTransform({ index: 4, cardCount: 5, compact: true }).angle, 15, '모바일 마지막 카드는 오른쪽으로 펼쳐져야 함');
assert.equal(calculateFanTransform({ index: 15, cardCount: 16, compact: true }).angle, 9, '많은 패는 부채 각도를 줄여야 함');

assert.equal(chooseAiReaction('player-win', 'hard', () => 0.99), 'gg', '게임 종료에는 AI가 반드시 GG로 반응해야 함');
assert.equal(chooseAiReaction({ type: 'player-emote', emote: 'lol' }, 'normal', () => 0), 'lol', '플레이어 스티커에 어울리는 답장을 선택해야 함');
assert.equal(chooseAiReaction('player-attack', 'hard', () => 0.99), null, '냉철한 AI는 모든 행동에 과하게 반응하지 않아야 함');
assert.ok(aiReactionDelay('easy', () => 0.5) < aiReactionDelay('hard', () => 0.5), '쉬운 AI가 어려운 AI보다 빠르게 반응해야 함');

console.log('원카드 규칙·레이아웃·AI 반응 테스트 33개 통과');
