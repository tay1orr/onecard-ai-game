import assert from 'node:assert/strict';
import { OneCardGame } from '../src/game-engine.js';
import { chooseAiMove, chooseSuit } from '../src/ai-player.js';

function card(suit, rank) { return { id: `${suit}-${rank}`, suit, rank }; }

function setState(game, { player = 0, top = card('hearts', '5'), hands, attack = 0, requestedSuit = null }) {
  game.currentPlayer = player;
  game.discardPile = [top];
  game.hands = hands;
  game.drawPile = [card('clubs', '3'), card('spades', '4'), card('diamonds', '5'), card('clubs', '6')];
  game.attackCount = attack;
  game.requestedSuit = requestedSuit;
  game.winner = null;
}

const game = new OneCardGame({ random: () => 0.42 });

setState(game, { hands: [[card('hearts', '9'), card('clubs', '5'), card('spades', '7')], [card('clubs', '3')]] });
assert.equal(game.playableCards(0).length, 3, '같은 무늬, 같은 숫자, 7을 낼 수 있어야 함');

setState(game, { attack: 5, hands: [[card('hearts', '2'), card('clubs', 'A'), card('hearts', '9')], [card('clubs', '3')]] });
assert.deepEqual(game.playableCards(0).map((item) => item.rank).sort(), ['2', 'A'], '공격 중에는 공격 카드만 허용');
game.playCard(0, 'hearts-2');
assert.equal(game.attackCount, 7, '공격이 누적되어야 함');

setState(game, { hands: [[card('hearts', 'K'), card('clubs', '3')], [card('clubs', '4')]] });
game.playCard(0, 'hearts-K');
assert.equal(game.currentPlayer, 0, 'K 이후 같은 플레이어 차례여야 함');

setState(game, { hands: [[card('spades', '7'), card('clubs', '3')], [card('clubs', '4')]] });
game.playCard(0, 'spades-7', 'clubs');
assert.equal(game.activeSuit, 'clubs', '7이 선택한 무늬를 적용해야 함');

setState(game, { hands: [[card('hearts', '9')], [card('clubs', '4')]] });
const win = game.playCard(0, 'hearts-9');
assert.equal(win.type, 'win');
assert.equal(game.winner, 0, '마지막 카드를 내면 승리해야 함');

setState(game, { player: 1, hands: [[card('clubs', '4')], [card('hearts', '2'), card('hearts', '8')]] });
assert.equal(chooseAiMove(game, 'normal', () => 0).type, 'play', 'AI가 낼 수 있는 카드를 선택해야 함');
assert.equal(chooseSuit([card('clubs', '3'), card('clubs', '9'), card('spades', '4')]), 'clubs', 'AI가 가장 많은 무늬를 선택해야 함');

console.log('원카드 게임 규칙 테스트 7개 통과');
