import assert from 'node:assert/strict';
import { OneCardGame } from '../src/game-engine.js';
import { chooseAiMove, chooseSuit } from '../src/ai-player.js';
import { calculateHandLayout } from '../src/2026-06-30-hand-layout.js';

function card(suit, rank) { return { id: `${suit}-${rank}`, suit, rank }; }

function setState(game, { player = 0, top = card('hearts', '5'), hands, attack = 0, requestedSuit = null }) {
  game.currentPlayer = player;
  game.discardPile = [top];
  game.hands = hands;
  game.drawPile = [card('clubs', '3'), card('spades', '4'), card('diamonds', '5'), card('clubs', '6')];
  game.attackCount = attack;
  game.requestedSuit = requestedSuit;
  game.winner = null;
  game.history = [{ player: null, card: { ...top }, turn: 0, requestedSuit: null }];
}

const game = new OneCardGame({ random: () => 0.42 });

setState(game, { hands: [[card('hearts', '9'), card('clubs', '5'), card('spades', '7')], [card('clubs', '3')]] });
assert.equal(game.playableCards(0).length, 2, '7도 같은 무늬가 아니면 낼 수 없어야 함');

setState(game, { hands: [[card('hearts', '7'), card('spades', '7')], [card('clubs', '3')]] });
assert.deepEqual(game.playableCards(0).map((item) => item.id), ['hearts-7'], '7은 현재 무늬와 맞을 때만 낼 수 있어야 함');

setState(game, { top: card('spades', '7'), requestedSuit: 'hearts', hands: [[card('spades', '7'), card('hearts', '3')], [card('clubs', '3')]] });
assert.deepEqual(game.playableCards(0).map((item) => item.id), ['hearts-3'], '7 이후에는 선택된 무늬만 따라야 함');

setState(game, { attack: 5, hands: [[card('hearts', '2'), card('clubs', 'A'), card('hearts', '9')], [card('clubs', '3')]] });
assert.deepEqual(game.playableCards(0).map((item) => item.rank).sort(), ['2', 'A'], '공격 중에는 공격 카드만 허용');
game.playCard(0, 'hearts-2');
assert.equal(game.attackCount, 7, '공격이 누적되어야 함');

setState(game, { hands: [[card('hearts', 'K'), card('clubs', '3')], [card('clubs', '4')]] });
game.playCard(0, 'hearts-K');
assert.equal(game.currentPlayer, 0, 'K 이후 같은 플레이어 차례여야 함');

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

const mobile7 = calculateHandLayout({ containerWidth: 366, horizontalPadding: 36, cardWidth: 72, cardCount: 7, compact: true });
assert.equal(mobile7.scrolls, false, '모바일 7장은 스크롤 없이 양끝이 보여야 함');

const mobile16 = calculateHandLayout({ containerWidth: 366, horizontalPadding: 36, cardWidth: 72, cardCount: 16, compact: true });
assert.equal(mobile16.scrolls, true, '모바일 16장은 식별 가능한 간격으로 스크롤되어야 함');
assert.equal(mobile16.step, 34, '모바일 다량 손패의 최소 노출 폭을 보장해야 함');

console.log('원카드 규칙·레이아웃 테스트 14개 통과');
