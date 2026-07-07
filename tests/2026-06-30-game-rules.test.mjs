import assert from 'node:assert/strict';
import { createDeck, OneCardGame } from '../src/game-engine.js';
import { chooseAiMove, chooseSuit } from '../src/ai-player.js';
import { calculateFanTransform, calculateHandLayout } from '../src/2026-06-30-hand-layout.js';
import { aiReactionDelay, chooseAiReaction } from '../src/2026-07-01-ai-reactions.js';
import {
  LEGACY_BACKUP_KEY,
  LEGACY_RECORD_KEY,
  PROFILE_KEY,
  bonusMatchChance,
  loadPlayerProfile,
  matchmakingWeights,
  recordMatchResult,
  rewardForStars,
  rollBonusMatch,
  savePlayerProfile,
  selectAiOpponent,
} from '../src/2026-07-05-rating.js';
import {
  COSMETICS,
  COSMETIC_SETS,
  DEFAULT_EQUIPPED,
  cosmeticSetForItem,
  cosmeticSetProgress,
  cosmeticsForSlot,
  equippedClassNames,
  equippedSetBonuses,
  newlyUnlockedCosmetics,
  nextCosmeticUnlock,
  normalizeEquipped,
} from '../src/2026-07-06-cosmetics.js';
import {
  DAILY_MISSION_COUNT,
  WEEKLY_MISSION_COUNT,
  applyMissionEvents,
  loadMissionDashboard,
} from '../src/2026-07-07-missions.js';

function card(suit, rank) { return { id: `${suit}-${rank}`, suit, rank }; }

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

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

const legacyRaw = JSON.stringify({ wins: 12, games: 20, nickname: '기존 플레이어' });
const legacyStorage = memoryStorage({ [LEGACY_RECORD_KEY]: legacyRaw });
const migrated = loadPlayerProfile(legacyStorage);
assert.deepEqual([migrated.wins, migrated.games, migrated.losses, migrated.points], [12, 20, 8, 0], '기존 승수와 판수를 그대로 이전해야 함');
assert.equal(legacyStorage.getItem(LEGACY_BACKUP_KEY), legacyRaw, '이전 전 원본 기록을 정확히 백업해야 함');
assert.deepEqual(JSON.parse(legacyStorage.getItem(LEGACY_RECORD_KEY)), { wins: 12, games: 20, nickname: '기존 플레이어' }, '기존 기록의 추가 필드까지 보존해야 함');
assert.ok(legacyStorage.getItem(PROFILE_KEY), '새 프로필을 별도 키로 저장해야 함');

assert.deepEqual([1, 2, 3, 4, 5].map(rewardForStars), [125, 180, 250, 340, 500], '상대 등급별 상향된 승리 보상을 적용해야 함');
const firstWin = recordMatchResult({ won: true, opponentStars: 5, mode: 'ai', matchId: 'ai-safe-1' }, legacyStorage);
assert.deepEqual([firstWin.delta, firstWin.profile.points, firstWin.profile.wins, firstWin.profile.games], [500, 500, 13, 21], '5성 승리는 기존 기록 위에 상향된 점수와 승리를 더해야 함');
const duplicateWin = recordMatchResult({ won: true, opponentStars: 5, mode: 'ai', matchId: 'ai-safe-1' }, legacyStorage);
assert.deepEqual([duplicateWin.duplicate, duplicateWin.profile.wins, duplicateWin.profile.games], [true, 13, 21], '같은 경기 결과는 중복 반영하지 않아야 함');
const fixedLoss = recordMatchResult({ won: false, opponentStars: 5, mode: 'ai', matchId: 'ai-safe-2' }, legacyStorage);
assert.deepEqual([fixedLoss.delta, fixedLoss.profile.points, fixedLoss.profile.games], [-50, 450, 22], '상대 등급과 무관하게 패배는 50점만 차감해야 함');
assert.deepEqual(JSON.parse(legacyStorage.getItem(LEGACY_RECORD_KEY)), { wins: 13, games: 22, nickname: '기존 플레이어' }, '새 결과 반영 뒤에도 기존 키의 승수·판수와 추가 필드를 보존해야 함');

const bonusStorage = memoryStorage();
const bonusWin = recordMatchResult({ won: true, opponentStars: 3, mode: 'ai', matchId: 'bonus-win', bonusMultiplier: 2 }, bonusStorage);
assert.deepEqual([bonusWin.baseDelta, bonusWin.delta, bonusWin.bonusMultiplier, bonusWin.profile.points], [250, 500, 2, 500], '보너스판 승리는 기본 승리 보상을 2배로 지급해야 함');
const bonusLoss = recordMatchResult({ won: false, opponentStars: 5, mode: 'ai', matchId: 'bonus-loss', bonusMultiplier: 2 }, bonusStorage);
assert.deepEqual([bonusLoss.delta, bonusLoss.bonusMultiplier, bonusLoss.profile.points], [-50, 2, 450], '보너스판에서 져도 패배 차감은 2배가 아니어야 함');
assert.equal(bonusMatchChance(0), 0.2, '초기 보너스판 확률은 20%여야 함');
assert.equal(bonusMatchChance(40000), 0.15, '고점 보너스판 확률은 15%까지 완만히 줄어야 함');
assert.equal(rollBonusMatch(0, () => 0.19), true, '확률 안쪽이면 보너스판이 등장해야 함');
assert.equal(rollBonusMatch(40000, () => 0.16), false, '고점 확률 밖이면 일반판이어야 함');

const floorStorage = memoryStorage();
const floorLoss = recordMatchResult({ won: false, opponentStars: 1, matchId: 'floor-loss' }, floorStorage);
assert.equal(floorLoss.profile.points, 0, '점수는 0 아래로 내려가지 않아야 함');
assert.equal(floorLoss.delta, 0, '0점에서 패배하면 실제 점수 변화도 0으로 표시해야 함');
assert.deepEqual(matchmakingWeights(0), [55, 35, 10, 0, 0], '초기 점수대 매칭 확률을 적용해야 함');
assert.deepEqual(matchmakingWeights(20000), [0, 0, 0, 30, 70], '2만점 이상은 4·5성만 매칭해야 함');
assert.equal(selectAiOpponent(0, () => 0, [1, 1]).stars, 2, '같은 AI가 세 번 연속 걸리려 하면 다른 가능한 등급으로 바꿔야 함');

const cosmeticStorage = memoryStorage({
  [PROFILE_KEY]: JSON.stringify({ points: 1800, wins: 2, games: 3 }),
  [LEGACY_RECORD_KEY]: JSON.stringify({ wins: 12, games: 20 }),
});
const cosmeticProfile = loadPlayerProfile(cosmeticStorage);
assert.equal(cosmeticProfile.peakPoints, 1800, '기존 점수를 역대 최고 점수로 안전하게 이전해야 함');
assert.deepEqual([cosmeticProfile.wins, cosmeticProfile.games], [12, 20], '꾸미기 프로필 이전 중 기존 승수·판수가 유지되어야 함');
assert.deepEqual(cosmeticProfile.equipped, DEFAULT_EQUIPPED, '처음에는 슬롯마다 기본 꾸미기를 장착해야 함');
assert.equal(cosmeticsForSlot('cardBack').some((item) => item.threshold === 300), true, '300점부터 첫 카드 스킨을 해금해야 함');
assert.equal(nextCosmeticUnlock(700).threshold, 1200, '현재 최고 점수 다음 보상까지 정확히 안내해야 함');
assert.deepEqual(newlyUnlockedCosmetics(250, 750).map((item) => item.threshold), [300, 700], '한 번에 여러 기준을 넘으면 모든 보상을 해금해야 함');
assert.equal(normalizeEquipped({ cardBack: 'back-space-whale' }, 1000).cardBack, 'back-classic', '점수가 부족한 아이템은 장착할 수 없어야 함');
assert.equal(normalizeEquipped({ cardBack: 'back-strawberry-milk' }, 1000).cardBack, 'back-strawberry-milk', '해금한 아이템은 장착 상태를 유지해야 함');
cosmeticProfile.equipped.cardBack = 'back-strawberry-milk';
savePlayerProfile(cosmeticProfile, cosmeticStorage);
const cosmeticLoss = recordMatchResult({ won: false, opponentStars: 5, mode: 'ai', matchId: 'cosmetic-loss' }, cosmeticStorage);
assert.deepEqual([cosmeticLoss.profile.points, cosmeticLoss.profile.peakPoints], [1750, 1800], '패배해 현재 점수가 내려가도 역대 최고 점수는 유지해야 함');
assert.equal(cosmeticLoss.profile.equipped.cardBack, 'back-strawberry-milk', '점수가 내려가도 이미 해금하고 장착한 스킨은 유지해야 함');
assert.equal(nextCosmeticUnlock(20000).threshold, 20700, '2만점 이후에는 마스터 꾸미기 라인이 이어져야 함');
assert.equal(newlyUnlockedCosmetics(19999, 20000).length, 6, '2만점 달성 시 꿈빛 왕국 풀 세트 6종을 함께 해금해야 함');
assert.equal(nextCosmeticUnlock(20699).threshold, 20700, '20,700점부터 신규 이미지 테이블 보상이 시작되어야 함');
assert.equal(newlyUnlockedCosmetics(20699, 21200).map((item) => item.id).join(','), 'table-pink-cloud-pop,back-pink-cloud-pop', '핑크 구름 팝은 테이블과 카드 뒷면 순서로 해금되어야 함');
assert.deepEqual(newlyUnlockedCosmetics(21200, 22400).map((item) => item.id), ['effect-pink-cloud-carnival', 'victory-pink-cloud-pop'], '핑크 구름 팝은 이펙트와 승리 연출까지 이어서 해금되어야 함');
assert.equal(COSMETICS.filter((item) => item.concept).length >= 9, true, '서로 다른 신규 콘셉트 꾸미기가 충분히 제공되어야 함');
assert.equal(cosmeticsForSlot('cardFace').some((item) => item.id === 'face-neon-arcade'), true, '네온 아케이드 카드 앞면을 제공해야 함');
assert.equal(cosmeticsForSlot('cardFace').some((item) => item.id === 'face-dessert-cafe'), true, '디저트 카페 카드 앞면을 제공해야 함');
assert.equal(cosmeticsForSlot('pile').length, 0, '더미 꾸밈 아이템은 모두 제거되어야 함');
assert.equal(Object.hasOwn(DEFAULT_EQUIPPED, 'pile'), false, '장착 정보에 더미 슬롯을 새로 저장하지 않아야 함');
assert.equal(cosmeticsForSlot('cardFace').some((item) => item.id === 'face-royal-tarot'), true, '카드 전체를 바꾸는 왕실 타로 앞면을 제공해야 함');
assert.equal(cosmeticsForSlot('cardBack').some((item) => item.id === 'back-antique-library'), true, '카드 전체를 바꾸는 고서관 뒷면을 제공해야 함');
assert.equal(cosmeticsForSlot('victory').some((item) => item.id === 'victory-dual-fireworks'), true, '양쪽 폭죽 승리 연출을 제공해야 함');
const roseSet = COSMETIC_SETS.find((set) => set.id === 'rose-conservatory');
assert.equal(roseSet.itemIds.length, 5, '장미 온실은 배경·앞면·뒷면·효과·승리 연출 5종 세트여야 함');
assert.deepEqual(cosmeticSetProgress(roseSet, 10000), { unlocked: 2, total: 5 }, '1만점에서는 장미 온실 배경과 앞면까지 해금되어야 함');
assert.deepEqual(cosmeticSetProgress(roseSet, 10900), { unlocked: 5, total: 5 }, '10,900점에서는 장미 온실 5종이 모두 해금되어야 함');
assert.equal(['table-rose-conservatory', 'back-rose-arbor', 'effect-rose-petal-storm', 'victory-rose-grand-bloom'].every((id) => COSMETICS.some((item) => item.id === id)), true, '장미 온실의 네 가지 신규 아이템이 모두 있어야 함');
assert.equal(cosmeticSetForItem('face-rose-tea')?.id, 'rose-conservatory', '장미 티파티 앞면은 장미 온실 세트로 표시되어야 함');
assert.equal(normalizeEquipped({ cardBack: 'back-rose-arbor' }, 14000).cardBack, 'back-rose-arbor', '해금한 장미 뒷면은 정상 장착되어야 함');
const roseBallroomSet = COSMETIC_SETS.find((set) => set.id === 'rose-ballroom');
assert.deepEqual(cosmeticSetProgress(roseBallroomSet, 31600), { unlocked: 4, total: 4 }, '장미 무도회 이미지 세트는 효과와 승리 연출까지 4종으로 완성되어야 함');
const realRoseSet = COSMETIC_SETS.find((set) => set.id === 'real-rose-garden');
assert.deepEqual(cosmeticSetProgress(realRoseSet, 33400), { unlocked: 3, total: 5 }, '리얼 로즈가든은 앞면까지 단계적으로 해금되어야 함');
assert.deepEqual(cosmeticSetProgress(realRoseSet, 34800), { unlocked: 5, total: 5 }, '리얼 로즈가든은 테이블·뒷면·앞면·효과·승리 연출 5종 풀세트여야 함');
assert.equal(cosmeticSetForItem('face-real-rose-garden')?.id, 'real-rose-garden', '리얼 로즈가든 앞면은 리얼 로즈가든 세트로 표시되어야 함');
assert.equal(normalizeEquipped({ cardFace: 'face-real-rose-garden', cardBack: 'back-real-rose-garden' }, 34800).cardFace, 'face-real-rose-garden', '해금한 리얼 로즈가든 앞면은 정상 장착되어야 함');
assert.equal(normalizeEquipped({ cardBack: 'back-ancient-sun-temple' }, 40400).cardBack, 'back-ancient-sun-temple', '고대 태양 신전 뒷면은 최고 구간에서 장착되어야 함');

const realRoseEquipped = {
  ...DEFAULT_EQUIPPED,
  table: 'table-real-rose-garden',
  cardBack: 'back-real-rose-garden',
  cardFace: 'face-real-rose-garden',
  effect: 'effect-real-rose-garden',
  victory: 'victory-real-rose-garden',
};
assert.equal(equippedSetBonuses(realRoseEquipped).some((set) => set.id === 'real-rose-garden'), true, '리얼 로즈가든 풀 장착 시 세트 보너스를 감지해야 함');
assert.equal(equippedClassNames(realRoseEquipped).includes('set-bonus-real-rose-garden'), true, '세트 보너스 CSS 클래스가 장착 클래스에 포함되어야 함');
assert.equal(equippedClassNames(realRoseEquipped).includes('set-bonus-active'), true, '세트 보너스 공통 CSS 클래스가 장착 클래스에 포함되어야 함');

const missionNow = new Date('2026-07-07T12:00:00+09:00');
const missionStorage = memoryStorage({
  [PROFILE_KEY]: JSON.stringify({ points: 100, peakPoints: 100, wins: 9, games: 12 }),
  [LEGACY_RECORD_KEY]: JSON.stringify({ wins: 9, games: 12 }),
});
const missionDashboard = loadMissionDashboard(missionStorage, missionNow);
assert.equal(missionDashboard.daily.total, DAILY_MISSION_COUNT, '일일 미션은 3개 조합되어야 함');
assert.equal(missionDashboard.weekly.total, WEEKLY_MISSION_COUNT, '주간 미션은 5개 조합되어야 함');
assert.equal(missionDashboard.weekly.missions.reduce((sum, mission) => sum + mission.target, 0) >= 18, true, '주간 미션은 일일보다 높은 목표량으로 구성되어야 함');
const missionEvents = [
  { id: 'mission-game', type: 'game', mode: 'ai', amount: 99, bonus: true },
  { id: 'mission-win', type: 'win', mode: 'ai', amount: 99, opponentStars: 5, bonus: true },
  { id: 'mission-card', type: 'card-play', amount: 99 },
  { id: 'mission-draw', type: 'draw-card', amount: 99 },
  { id: 'mission-attack', type: 'attack-card', amount: 99 },
  { id: 'mission-seven', type: 'seven-card', amount: 99 },
  { id: 'mission-joker', type: 'joker-card', amount: 99 },
  { id: 'mission-emote', type: 'emote', amount: 99 },
  { id: 'mission-onecard', type: 'one-card', amount: 99 },
  { id: 'mission-bonus', type: 'bonus-match', amount: 99 },
  { id: 'mission-bonus-win', type: 'bonus-win', amount: 99 },
];
const missionReward = applyMissionEvents(missionEvents, { storage: missionStorage, now: missionNow });
assert.equal(missionReward.rewardDelta > 0, true, '완료된 미션은 점수 보상을 지급해야 함');
assert.deepEqual([missionReward.profile.wins, missionReward.profile.games], [9, 12], '미션 보상은 기존 승수와 판수를 바꾸지 않아야 함');
assert.equal(missionReward.profile.points, 100 + missionReward.rewardDelta, '미션 보상은 현재 점수에만 더해져야 함');
const duplicatedMissionReward = applyMissionEvents(missionEvents, { storage: missionStorage, now: missionNow });
assert.equal(duplicatedMissionReward.rewardDelta, 0, '같은 미션 이벤트 ID는 중복 보상되지 않아야 함');

const preservedCosmeticStorage = memoryStorage({
  [PROFILE_KEY]: JSON.stringify({
    points: 12345,
    peakPoints: 14000,
    wins: 44,
    games: 70,
    equipped: { ...DEFAULT_EQUIPPED, pile: 'pile-moon-jelly', cardBack: 'back-antique-atlas' },
  }),
  [LEGACY_RECORD_KEY]: JSON.stringify({ wins: 44, games: 70 }),
});
const preservedCosmeticProfile = loadPlayerProfile(preservedCosmeticStorage);
assert.deepEqual(
  [preservedCosmeticProfile.points, preservedCosmeticProfile.peakPoints, preservedCosmeticProfile.wins, preservedCosmeticProfile.games],
  [12345, 14000, 44, 70],
  '꾸밈 목록 변경 후에도 기존 점수·최고점수·승수·판수를 보존해야 함',
);
assert.equal(preservedCosmeticProfile.equipped.cardBack, 'back-antique-atlas', '해금한 새 카드 뒷면 장착 상태를 보존해야 함');
assert.equal(Object.hasOwn(preservedCosmeticProfile.equipped, 'pile'), false, '예전 더미 장착값은 기록을 건드리지 않고 정규화 과정에서만 제외해야 함');

console.log('원카드 규칙·레이아웃·AI 반응·기록·꾸미기 테스트 89개 통과');
