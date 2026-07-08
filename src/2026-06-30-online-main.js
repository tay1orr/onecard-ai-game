import { SUIT_SYMBOLS } from './game-engine.js';
import { calculateFanTransform, calculateHandLayout } from './2026-06-30-hand-layout.js';
import { createGameEffects } from './2026-06-30-effects.js';
import { makeToyDraggable } from './2026-06-30-toy-drag.js';
import { MultiplayerClient } from './2026-06-30-multiplayer.js';
import { getSeatView, isMyTurn, normalizeRoomCode, validateNickname, validateRoomCode } from './2026-06-30-multiplayer-helpers.js';
import { isSupabaseConfigured } from './2026-06-30-supabase-config.js';
import { playSound } from './audio.js';
import { animateCardToPile } from './2026-06-30-card-motion.js';
import { runDealAnimation } from './2026-06-30-deal-animation.js';
import { REACTIONS, createReactionArtwork, createReactionButton, getReaction } from './2026-06-30-reactions.js';
import { createCardCenter } from './2026-07-01-card-art.js';
import { loadPlayerProfile, playerStarsForPoints, recordMatchResult, starsText } from './2026-07-05-rating.js';
import { COSMETICS, allSetBonusClassNames, cosmeticById, equippedClassNames, nextCosmeticUnlock } from './2026-07-06-cosmetics.js';
import {
  applyMissionEvents,
  loadMissionDashboard,
  mergeUnlockedItems,
  missionEventsForCard,
} from './2026-07-07-missions.js';
import {
  queueAccountProfileSync,
  syncAccountProfile,
} from './2026-07-07-account-sync.js';

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map((element) => [element.id, element]));
const effects = createGameEffects({
  root: els['online-action-overlay'], particles: els['online-effect-particles'],
  symbol: els['online-effect-symbol'], title: els['online-effect-title'], subtitle: els['online-effect-subtitle'],
});
const client = new MultiplayerClient({ onView: handleView, onConnection: renderConnection });
let view = null;
let previousStatus = null;
let lastEventId = null;
let pendingSeven = null;
let busy = false;
let revealActive = false;
let revealResolve = null;
let latestDeferredView = null;
let eventEffectTimer = null;
let eventEffectGeneration = 0;
let startSequenceRunning = false;
let deferredStartView = null;
let displayedDice = [null, null];
let diceIntervals = [null, null];
let diceTimeouts = [null, null];
let diceGenerations = [0, 0];
let lastDiceTie = false;
let connectionPromise = null;
let reactionTimer = null;
let reactionSending = false;
let playerProfile = loadPlayerProfile();
let resultRevealTimer = null;
let currentResultKey = '';
let pendingOnlineMissionUnlocks = [];
const resultRatingCache = new Map();
const CARD_FACE_CLASS_NAMES = COSMETICS
  .filter((item) => item.slot === 'cardFace' && item.cssClass)
  .map((item) => item.cssClass);
const VICTORY_RESULT_REVEAL_DELAY_MS = 2550;
const ONLINE_TOY_LINES = {
  jelly: ['말랑!', '뿌잉!', '또 눌러줘!'],
  star: ['빙글!', '반짝!', '슈웅!'],
  rose: ['향긋!', '사랑을 담아!', '장미 파워!'],
  'rose-musicbox': ['딩딩딩♪', '태엽 감기!', '장미 왈츠!'],
  'rose-teacup': ['살랑!', '이슬 톡!', '꽃잎 팡!'],
  'crimson-clockwork': ['활짝!', '진홍 팡!', '꽃잎 폭발!'],
};
const ONLINE_TOY_VARIANTS = [
  { base: 'star', cssClass: 'skin-charm-rose-musicbox', key: 'rose-musicbox' },
  { base: 'jelly', cssClass: 'skin-charm-rose-teacup', key: 'rose-teacup' },
  { base: 'rose', cssClass: 'skin-charm-crimson-clockwork', key: 'crimson-clockwork' },
];
const ONLINE_TOY_PARTICLE_COUNTS = {
  'rose-musicbox': 16,
  'rose-teacup': 14,
  'crimson-clockwork': 18,
};

els['room-code-input'].addEventListener('input', () => {
  els['room-code-input'].value = normalizeRoomCode(els['room-code-input'].value);
});
els['create-room-button'].addEventListener('click', () => runEntryAction('create'));
els['join-room-button'].addEventListener('click', () => runEntryAction('join'));
els['copy-code-button'].addEventListener('click', copyRoomCode);
els['ready-button'].addEventListener('click', () => perform(() => client.setReady(), 'lobby-error'));
els['online-roll-button'].addEventListener('click', rollOnlineDice);
els['leave-lobby-button'].addEventListener('click', leaveRoom);
els['leave-game-button'].addEventListener('click', leaveRoom);
els['online-result-leave'].addEventListener('click', leaveRoom);
els['online-rematch-button'].addEventListener('click', () => perform(() => client.requestRematch(), 'online-toast'));
els['online-draw-pile'].addEventListener('click', () => perform(() => client.drawCards(), 'online-toast'));
els['online-suit-cancel'].addEventListener('click', closeSuitPicker);
els['online-draw-close'].addEventListener('click', closeDrawReveal);
els['online-top-card'].addEventListener('click', openOnlineHistory);
els['online-top-card'].addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openOnlineHistory();
  }
});
els['online-history-close'].addEventListener('click', closeOnlineHistory);
els['online-history-modal'].addEventListener('click', (event) => {
  if (event.target === els['online-history-modal']) closeOnlineHistory();
});
els['reaction-toggle'].addEventListener('click', toggleReactionPicker);
document.querySelectorAll('[data-online-suit]').forEach((button) => {
  button.addEventListener('click', () => submitCard(pendingSeven, button.dataset.onlineSuit));
});

document.querySelectorAll('[data-online-toy]').forEach((button) => {
  makeToyDraggable(button, els['online-table'], () => playOnlineToy(button));
});
window.addEventListener('resize', scheduleHandLayout);

setupReactionPickers();
applyOnlineCosmetics();
renderOnlineMissionPanel();

if (!isSupabaseConfigured()) {
  els['setup-required'].classList.remove('hidden');
  els['create-room-button'].disabled = true;
  els['join-room-button'].disabled = true;
  renderConnection('setup required');
} else {
  els['create-room-button'].disabled = true;
  els['join-room-button'].disabled = true;
  connectionPromise = initializeConnection();
}

async function initializeConnection() {
  try {
    await client.connect();
    await hydrateOnlineAccountProfile();
    await client.restoreRoom(playerProfile.points, playerProfile.equipped.cardBack);
  } catch (error) {
    els['entry-error'].textContent = friendlyError(error.message);
    renderConnection('reconnecting');
  } finally {
    els['create-room-button'].disabled = false;
    els['join-room-button'].disabled = false;
  }
}

async function hydrateOnlineAccountProfile() {
  try {
    const result = await syncAccountProfile();
    if (result.profile) {
      playerProfile = result.profile;
      applyOnlineCosmetics();
      renderOnlineMissionPanel();
    }
  } catch {
    /* 프로필 동기화가 실패해도 멀티 입장은 계속 가능해야 합니다. */
  }
}

function scheduleOnlineAccountSync(delay = 700) {
  queueAccountProfileSync({
    delay,
    onComplete: (result) => {
      if (!result?.profile) return;
      playerProfile = result.profile;
      applyOnlineCosmetics();
      renderOnlineMissionPanel();
    },
    onError: () => {},
  });
}

async function runEntryAction(mode) {
  if (busy) return;
  let nickname;
  let code;
  try {
    nickname = validateNickname(els['online-nickname'].value);
    code = mode === 'join' ? validateRoomCode(els['room-code-input'].value) : null;
  } catch (error) {
    els['entry-error'].textContent = friendlyError(error.message);
    return;
  }
  await perform(async () => {
    if (connectionPromise) await connectionPromise;
    else if (!client.supabase) await client.connect();
    await hydrateOnlineAccountProfile();
    playerProfile = loadPlayerProfile();
    if (mode === 'create') await client.createRoom(nickname, playerProfile.points, playerProfile.equipped.cardBack);
    else await client.joinRoom(code, nickname, playerProfile.points, playerProfile.equipped.cardBack);
  }, 'entry-error');
}

async function perform(action, errorTarget) {
  if (busy) return;
  busy = true;
  setButtonsBusy(true);
  if (els[errorTarget]) els[errorTarget].textContent = '';
  try {
    return await action();
  } catch (error) {
    const message = friendlyError(error.message);
    if (errorTarget === 'online-toast') showToast(message);
    else if (els[errorTarget]) els[errorTarget].textContent = message;
    return null;
  } finally {
    busy = false;
    setButtonsBusy(false);
  }
}

function setButtonsBusy(value) {
  ['create-room-button','join-room-button','ready-button','online-roll-button','online-draw-pile','online-rematch-button']
    .forEach((id) => { if (els[id]) els[id].classList.toggle('is-busy', value); });
}

function handleView(nextView) {
  const priorView = view;
  view = nextView;
  if (startSequenceRunning) {
    deferredStartView = nextView;
    return;
  }
  if (nextView.drawnCards?.length) {
    latestDeferredView = nextView;
    if (!revealActive) showDrawReveal(nextView.drawnCards);
    return;
  }
  if (revealActive) {
    latestDeferredView = nextView;
    return;
  }
  if (nextView.status === 'playing' && priorView?.status === 'dice') {
    runOnlineStartSequence(nextView);
    return;
  }
  renderView(nextView);
}

function renderView(nextView) {
  view = nextView;
  els['online-entry'].classList.add('hidden');
  els['lobby-room-code'].textContent = nextView.code;
  els['online-room-mini'].textContent = nextView.code;
  if (nextView.status !== 'finished') closeOnlineResult();
  if (nextView.status === 'playing' || nextView.status === 'finished') {
    els['online-lobby'].classList.add('hidden');
    els['online-game'].classList.remove('hidden');
    renderGame(nextView);
    if (previousStatus !== 'playing' && nextView.status === 'playing') announceInitiative(nextView);
    if (nextView.status === 'finished') renderOnlineResult(nextView);
  } else {
    els['online-game'].classList.add('hidden');
    els['online-lobby'].classList.remove('hidden');
    renderLobby(nextView);
  }
  renderLastEvent(nextView.lastEvent);
  previousStatus = nextView.status;
}

function renderLobby(nextView) {
  const { mine, opponent } = getSeatView(nextView);
  renderLobbySlot(els['host-slot'], nextView.host, nextView.mySeat === 0);
  renderLobbySlot(els['guest-slot'], nextView.guest, nextView.mySeat === 1);
  els['lobby-host-wins'].textContent = nextView.host?.wins ?? 0;
  els['lobby-guest-wins'].textContent = nextView.guest?.wins ?? 0;
  const hasTwo = Boolean(nextView.host && nextView.guest);
  els['lobby-title'].textContent = !hasTwo ? '친구를 기다리는 중' : nextView.status === 'dice' ? '주사위로 선공 결정' : '두 플레이어가 모였어요';
  els['ready-button'].classList.toggle('hidden', nextView.status === 'dice');
  els['ready-button'].disabled = !hasTwo;
  els['ready-button'].classList.toggle('is-ready', Boolean(mine?.ready));
  els['ready-button'].textContent = mine?.ready ? '준비 취소' : hasTwo ? '준비 완료' : '친구를 기다리는 중';
  els['online-dice-area'].classList.toggle('hidden', nextView.status !== 'dice');
  if (nextView.status === 'dice') {
    if (lastDiceTie && !nextView.diceTie && (!nextView.host?.die || !nextView.guest?.die)) {
      displayedDice = [null, null];
      clearDiceAnimation(0);
      clearDiceAnimation(1);
    }
    renderDiceValue(0, nextView.host?.die);
    renderDiceValue(1, nextView.guest?.die);
    els['online-dice-status'].textContent = nextView.diceTie ? '동점! 두 플레이어가 다시 굴려요.' : '두 플레이어가 각자 주사위를 굴려요.';
    updateDiceControls(nextView);
    lastDiceTie = nextView.diceTie;
  }
  els['lobby-error'].textContent = opponent && !opponent.connected ? '상대 연결이 잠시 끊겼어요. 60초 동안 기다립니다.' : '';
}

function renderLobbySlot(element, player, isMine) {
  element.classList.toggle('me', isMine);
  element.classList.toggle('ready', Boolean(player?.ready));
  element.querySelector('strong').textContent = player?.nickname || '친구 대기 중';
  element.querySelector('small').textContent = !player
    ? '방 코드를 알려주세요'
    : `${starsText(playerStarsForPoints(player.rating || 0))} · ${(player.rating || 0).toLocaleString('ko-KR')}점 · ${player.ready ? '준비 완료' : player.connected ? '준비 전' : '재접속 대기'}`;
}

function renderGame(nextView) {
  const { mine, opponent } = getSeatView(nextView);
  els['online-my-name'].textContent = mine.nickname;
  els['online-opponent-name'].textContent = opponent.nickname;
  els['online-opponent-title'].textContent = opponent.nickname;
  els['online-match-score'].textContent = `HOST ${nextView.host.wins ?? 0} : ${nextView.guest.wins ?? 0} GUEST`;
  els['online-my-count'].textContent = mine.count;
  els['online-opponent-count'].textContent = opponent.count;
  els['online-opponent-status'].textContent = opponent.connected ? '온라인' : '재접속 대기 중';
  els['online-opponent-rating'].textContent = `${starsText(playerStarsForPoints(opponent.rating || 0))} ${(opponent.rating || 0).toLocaleString('ko-KR')}점`;
  els['online-my-rating'].textContent = `${starsText(playerStarsForPoints(mine.rating || 0))} ${(mine.rating || 0).toLocaleString('ko-KR')}점`;
  els['online-my-status'].textContent = isMyTurn(nextView)
    ? nextView.freePlay ? '내 차례 · 자유 카드' : '내 차례'
    : '상대 차례';
  const bonusMatch = (nextView.bonusMultiplier || 1) > 1;
  els['online-bonus-match-badge'].classList.toggle('hidden', !bonusMatch);
  els['online-live-state'].textContent = bonusMatch ? 'BONUS ×2' : 'LIVE';
  els['online-live-state'].classList.toggle('bonus', bonusMatch);
  renderOpponentHand(opponent.count, opponent.cardBack);
  renderHand(nextView);
    renderTopCard(nextView.topCard, nextView.activeSuit);
  els['online-deck-count'].textContent = nextView.drawCount;
  els['online-draw-pile'].disabled = busy || startSequenceRunning || !isMyTurn(nextView) || nextView.status !== 'playing';
  els['online-turn-banner'].textContent = nextView.status === 'finished'
    ? nextView.winnerSeat === nextView.mySeat ? '내 승리!' : '상대 승리'
    : isMyTurn(nextView) ? '내 차례예요' : `${opponent.nickname}의 차례`;
  els['online-action-hint'].textContent = nextView.attackCount
    ? nextView.topCard.rank === 'JOKER'
      ? `조커 공격 +${nextView.attackCount} · 조커로만 방어할 수 있어요`
      : `공격 +${nextView.attackCount} · 2, A, 조커로 방어하세요`
    : nextView.freePlay
      ? '조커 공격 성공! 이번에는 원하는 카드 한 장을 낼 수 있어요'
      : `${suitName(nextView.activeSuit)} 또는 ${nextView.topCard.rank} 카드를 낼 수 있어요`;
  els['online-attack-badge'].classList.toggle('hidden', !nextView.attackCount);
  els['online-attack-badge'].querySelector('b').textContent = nextView.attackCount;
  if (nextView.status === 'finished' && previousStatus !== 'finished' && nextView.lastEvent?.eventType !== 'play') {
    playFinishEffect(nextView);
  }
}

function renderOpponentHand(count, cardBackId = 'back-classic') {
  els['online-opponent-hand'].replaceChildren();
  const cardBack = cosmeticById(cardBackId);
  for (let index = 0; index < count; index += 1) {
    const card = document.createElement('div');
    card.className = 'mini-back card-back';
    if (cardBack?.slot === 'cardBack') card.classList.add(cardBack.cssClass);
    card.style.setProperty('--i', index);
    card.style.setProperty('--count', count);
    card.innerHTML = '<span class="back-logo">ONE<b>!</b></span>';
    els['online-opponent-hand'].append(card);
  }
}

function applyOnlineCosmetics() {
  const allClasses = COSMETICS.map((item) => item.cssClass).filter(Boolean);
  document.body.classList.remove(...allClasses, ...allSetBonusClassNames(), 'reduced-effects');
  document.body.classList.add(...equippedClassNames(playerProfile.equipped));
  document.body.classList.toggle('reduced-effects', Boolean(playerProfile.reducedEffects));
  applyOnlineDiscardFaceSkin();
}

function equippedCardFaceClassName() {
  const cardFace = cosmeticById(playerProfile.equipped?.cardFace);
  return cardFace?.slot === 'cardFace' ? cardFace.cssClass : 'skin-face-classic';
}

function applyOnlineDiscardFaceSkin() {
  const discardWrap = els['online-top-card']?.closest('.discard-wrap');
  if (!discardWrap) return;
  discardWrap.classList.remove(...CARD_FACE_CLASS_NAMES);
  discardWrap.classList.add(equippedCardFaceClassName());
}

function renderHand(nextView) {
  const hand = els['online-player-hand'];
  hand.replaceChildren();
  nextView.myHand.forEach((card) => {
    const button = createCard(card, true);
    const playable = isMyTurn(nextView) && isPlayable(card, nextView);
    button.classList.toggle('playable', playable);
    button.classList.toggle('not-playable', isMyTurn(nextView) && !playable);
    button.disabled = busy || startSequenceRunning || !isMyTurn(nextView) || nextView.status !== 'playing';
    button.addEventListener('click', () => {
      if (busy) return;
      if (!playable) return showToast(nextView.attackCount && nextView.topCard.rank === 'JOKER'
        ? '조커 공격은 조커로만 막을 수 있어요'
        : '지금은 낼 수 없는 카드예요');
      if (card.rank === '7') {
        pendingSeven = card.id;
        openSuitPicker();
      } else submitCard(card.id);
    });
    hand.append(button);
  });
  scheduleHandLayout();
}

function renderTopCard(card, activeSuit) {
  const element = createCard(card, false);
  els['online-top-card'].className = `${element.className} discard-card`;
  els['online-top-card'].replaceChildren(...element.childNodes);
  applyOnlineDiscardFaceSkin();
  const showSuit = ['7','JOKER'].includes(card.rank) && activeSuit;
  els['online-active-suit'].classList.toggle('hidden', !showSuit);
  els['online-active-suit'].classList.toggle('red', ['hearts','diamonds'].includes(activeSuit));
  els['online-active-suit'].textContent = showSuit ? SUIT_SYMBOLS[activeSuit] : '';
}

function createCard(card, interactive) {
  const element = document.createElement(interactive ? 'button' : 'div');
  const joker = card.rank === 'JOKER';
  element.className = `playing-card ${['hearts','diamonds'].includes(card.suit) ? 'red-card' : ''} ${joker ? 'joker-card' : ''}`;
  if (interactive) {
    element.type = 'button';
    element.dataset.cardId = card.id;
    element.setAttribute('aria-label', joker ? '조커 공격 +5' : `${suitName(card.suit)} ${card.rank}`);
  }
  const top = document.createElement('span');
  top.className = 'card-corner top';
  top.innerHTML = `<b>${joker ? 'JOKER' : card.rank}</b><i>${SUIT_SYMBOLS[card.suit]}</i>`;
  const center = createCardCenter(card, SUIT_SYMBOLS[card.suit]);
  const bottom = top.cloneNode(true); bottom.classList.replace('top','bottom');
  element.append(top,center,bottom);
  return element;
}

function isPlayable(card, nextView) {
  if (nextView.attackCount > 0) {
    return nextView.topCard.rank === 'JOKER'
      ? card.rank === 'JOKER'
      : ['2','A','JOKER'].includes(card.rank);
  }
  if (nextView.freePlay) return true;
  return card.rank === 'JOKER' || card.suit === nextView.activeSuit || card.rank === nextView.topCard.rank;
}

function submitCard(cardId, chosenSuit = null) {
  closeSuitPicker();
  const source = els['online-player-hand'].querySelector(`[data-card-id="${cardId}"]`);
  return perform(async () => {
    clearTimeout(eventEffectTimer);
    effects.clear();
    await animateCardToPile({ source, target: els['online-top-card'] });
    return client.playCard(cardId, chosenSuit);
  }, 'online-toast');
}

function openSuitPicker() {
  els['online-suit-picker'].classList.remove('hidden');
  requestAnimationFrame(() => els['online-suit-picker'].classList.add('open'));
}

function closeSuitPicker() {
  pendingSeven = null;
  els['online-suit-picker'].classList.remove('open');
  setTimeout(() => els['online-suit-picker'].classList.add('hidden'), 180);
}

async function rollOnlineDice() {
  if (busy || diceTimeouts[view.mySeat]) return;
  startDiceSuspense(view.mySeat);
  playSound('dice');
  const result = await perform(() => client.rollDice(), 'lobby-error');
  if (!result) renderDiceValue(view.mySeat, getSeatDie(view, view.mySeat), true);
}

function getDiceElements(seat) {
  return seat === 0
    ? { die: els['online-host-die'], label: els['online-host-roll'] }
    : { die: els['online-guest-die'], label: els['online-guest-roll'] };
}

function getSeatDie(nextView, seat) {
  return seat === 0 ? nextView.host?.die : nextView.guest?.die;
}

function clearDiceAnimation(seat) {
  diceGenerations[seat] += 1;
  clearInterval(diceIntervals[seat]);
  clearTimeout(diceTimeouts[seat]);
  diceIntervals[seat] = null;
  diceTimeouts[seat] = null;
  const { die } = getDiceElements(seat);
  die.classList.remove('rolling', 'landed');
}

function startDiceSuspense(seat) {
  clearDiceAnimation(seat);
  displayedDice[seat] = null;
  const generation = diceGenerations[seat];
  const { die, label } = getDiceElements(seat);
  die.classList.add('rolling');
  label.textContent = '…';
  let tick = 0;
  diceIntervals[seat] = setInterval(() => {
    if (generation !== diceGenerations[seat]) return;
    die.textContent = dieFace((tick % 6) + 1);
    tick += 1;
  }, 75);
}

function animateOnlineDie(seat, value, force = false) {
  if (!value) {
    clearDiceAnimation(seat);
    displayedDice[seat] = null;
    const { die, label } = getDiceElements(seat);
    die.textContent = dieFace(null);
    label.textContent = '-';
    return Promise.resolve();
  }
  if (!force && displayedDice[seat] === value) return Promise.resolve();
  clearDiceAnimation(seat);
  displayedDice[seat] = value;
  const generation = diceGenerations[seat];
  const { die, label } = getDiceElements(seat);
  die.classList.add('rolling');
  label.textContent = '…';
  let tick = 0;
  diceIntervals[seat] = setInterval(() => {
    if (generation !== diceGenerations[seat]) return;
    die.textContent = dieFace(((tick * 3 + seat) % 6) + 1);
    tick += 1;
  }, 72);
  return new Promise((resolve) => {
    diceTimeouts[seat] = setTimeout(() => {
      if (generation !== diceGenerations[seat]) return resolve();
      clearInterval(diceIntervals[seat]);
      diceIntervals[seat] = null;
      diceTimeouts[seat] = null;
      die.textContent = dieFace(value);
      label.textContent = String(value);
      die.classList.remove('rolling');
      die.classList.add('landed');
      setTimeout(() => die.classList.remove('landed'), 480);
      if (view?.status === 'dice') updateDiceControls(view);
      resolve();
    }, 880);
  });
}

function renderDiceValue(seat, value, force = false) {
  animateOnlineDie(seat, value, force);
}

function updateDiceControls(nextView) {
  const { mine } = getSeatView(nextView);
  const rolling = diceTimeouts.some(Boolean) || diceIntervals.some(Boolean);
  els['online-roll-button'].disabled = rolling || (Boolean(mine?.die) && !nextView.diceTie);
  els['online-roll-button'].textContent = rolling
    ? '주사위가 구르는 중…'
    : mine?.die && !nextView.diceTie ? '상대 주사위 대기 중' : nextView.diceTie ? '다시 굴리기' : '내 주사위 굴리기';
}

async function runOnlineStartSequence(nextView) {
  if (startSequenceRunning) return;
  startSequenceRunning = true;
  pendingOnlineMissionUnlocks = [];
  deferredStartView = nextView;
  els['online-dice-status'].textContent = '두 주사위의 결과를 확인합니다!';
  await Promise.all([
    animateOnlineDie(0, nextView.host?.die),
    animateOnlineDie(1, nextView.guest?.die),
  ]);
  const gameView = deferredStartView || nextView;
  const starter = gameView.currentSeat === 0 ? gameView.host.nickname : gameView.guest.nickname;
  els['online-dice-status'].textContent = `${gameView.host.die} 대 ${gameView.guest.die} · ${starter} 선공!`;
  await wait(1350);
  els['online-table'].classList.add('dealing-cards');
  previousStatus = 'playing';
  renderView(gameView);
  await runDealAnimation({
    playerCards: gameView.myHand,
    createCardFace: (card) => createCard(card, false),
    playSound,
  });
  els['online-table'].classList.remove('dealing-cards');
  startSequenceRunning = false;
  const latest = deferredStartView || gameView;
  deferredStartView = null;
  renderView(latest);
  announceInitiative(latest);
  if ((latest.bonusMultiplier || 1) > 1) {
    setTimeout(() => playOnlineBonusStartEffect(), 1700);
  }
}

function playOnlineBonusStartEffect() {
  els['online-table']?.classList.add('bonus-starting');
  const flare = document.createElement('div');
  flare.className = 'bonus-start-flare';
  document.body.append(flare);
  effects.play('onecard', {
    symbol: '×2',
    title: 'BONUS MATCH!',
    subtitle: '이번 판은 승리 포인트가 2배예요',
    particleCount: 58,
  });
  playSound('onecard');
  setTimeout(() => els['online-table']?.classList.remove('bonus-starting'), 2100);
  setTimeout(() => flare.remove(), 2300);
}

function announceInitiative(nextView) {
  clearTimeout(eventEffectTimer);
  const first = nextView.currentSeat === nextView.mySeat;
  effects.play('initiative', { symbol:first?'1st':'2nd', title:first?'선공!':'후공!', subtitle:first?'내가 먼저 시작합니다':'상대가 먼저 시작합니다', particleCount:24 });
  playSound(first ? 'first' : 'second');
}

async function renderLastEvent(event) {
  if (!event || event.id === lastEventId) return;
  lastEventId = event.id;
  if (event.eventType === 'emote') {
    if (event.actorSeat === view.mySeat) {
      handleOnlineMissionEvents([{ id: `online:${event.id}:emote`, type: 'emote', mode: 'multi' }]);
    }
    showReaction(event);
    return;
  }
  if (!['draw', 'play'].includes(event.eventType)) return;
  eventEffectGeneration += 1;
  const generation = eventEffectGeneration;
  clearTimeout(eventEffectTimer);
  effects.clear();

  if (event.eventType === 'draw') {
    const owner = event.actorSeat === view.mySeat ? '내가' : '상대가';
    if (event.actorSeat === view.mySeat) {
      handleOnlineMissionEvents([{ id: `online:${event.id}:draw`, type: 'draw-card', mode: 'multi', amount: event.payload.count || 1 }]);
    }
    effects.play('impact', {
      symbol: `+${event.payload.count}`,
      title: `${owner} ${event.payload.count}장 뽑기`,
      subtitle: event.payload.penalty ? '누적 공격을 받았어요' : '카드를 패에 넣었어요',
    });
    return;
  }
  const card = event.payload.card;
  const owner = event.actorSeat === view.mySeat ? '내가' : '상대가';
  if (event.actorSeat === view.mySeat) {
    const events = missionEventsForCard(card, { idPrefix: `online:${event.id}` });
    if (event.payload.remaining === 1) events.push({ id: `online:${event.id}:onecard`, type: 'one-card', mode: 'multi' });
    handleOnlineMissionEvents(events.map((item) => ({ ...item, mode: 'multi' })));
  }
  if (event.actorSeat !== view.mySeat) {
    const source = els['online-opponent-hand'].lastElementChild;
    await animateCardToPile({
      source,
      target: els['online-top-card'],
      cardFace: createCard(card, false),
      fromOpponent: true,
      hideTarget: true,
    });
    if (generation !== eventEffectGeneration) return;
  }
  const notices = {
    '2':['attack','+2','+2 공격!',`${owner} 공격을 보냈어요`],
    A:['attack','+3','+3 공격!',`${owner} 공격을 보냈어요`],
    J:['skip','≫','턴 스킵!',`${owner} 턴을 건너뜁니다`],
    '7':['suit',SUIT_SYMBOLS[event.payload.chosenSuit],`${suitName(event.payload.chosenSuit)}로 변경!`,`${owner} 무늬를 바꿨어요`],
    JOKER:['joker','★','JOKER +5',`${owner} 조커 공격을 보냈어요`],
  };
  const notice = notices[card.rank];
  if (notice) effects.play(notice[0], { symbol:notice[1], title:notice[2], subtitle:notice[3] });
  else effects.play('impact', {
    symbol: SUIT_SYMBOLS[card.suit],
    title: `${owner} ${card.rank} 카드 내기`,
    subtitle: `${suitName(card.suit)} 카드가 필드에 놓였어요`,
  });
  if (event.payload.remaining === 1) {
    eventEffectTimer = setTimeout(() => {
      if (generation !== eventEffectGeneration) return;
      effects.play('onecard', {
        symbol: '1', title: 'ONE CARD!', subtitle: `${owner} 마지막 한 장을 남겼어요`, particleCount: 32,
      });
      playSound('onecard');
    }, notice ? 2200 : 1900);
  } else if (view.status === 'finished' && event.payload.remaining === 0) {
    eventEffectTimer = setTimeout(() => {
      if (generation !== eventEffectGeneration) return;
      playFinishEffect(view);
    }, notice ? 2200 : 1900);
  }
}

function playFinishEffect(nextView) {
  const won = nextView.winnerSeat === nextView.mySeat;
  effects.play('onecard', {
    symbol: won ? 'WIN' : 'LOSE',
    title: won ? '승리!' : '패배',
    subtitle: won ? '멋진 온라인 승부였어요' : '재대결에서 흐름을 뒤집어 보세요',
  });
  playSound(won ? 'win' : 'lose');
}

function renderOnlineResult(nextView) {
  const { mine, opponent } = getSeatView(nextView);
  const won = nextView.winnerSeat === nextView.mySeat;
  const roundIdentity = Number.isInteger(nextView.roundNo)
    ? `round:${nextView.roundNo}`
    : `legacy-score:${nextView.host.wins ?? 0}:${nextView.guest.wins ?? 0}`;
  const resultKey = `multi:${nextView.roomId}:${roundIdentity}`;
  const recordedResult = nextView.topCard ? recordMatchResult({
    won,
    opponentStars: playerStarsForPoints(opponent.rating || 0),
    mode: 'multi',
    matchId: resultKey,
    bonusMultiplier: nextView.bonusMultiplier || 1,
  }) : { profile: loadPlayerProfile(), delta: 0, duplicate: true };
  if (!recordedResult.duplicate) scheduleOnlineAccountSync();
  if (!recordedResult.duplicate) resultRatingCache.set(resultKey, recordedResult);
  const ratingResult = recordedResult.duplicate && resultRatingCache.has(resultKey)
    ? resultRatingCache.get(resultKey)
    : recordedResult;
  const missionResult = !recordedResult.duplicate && nextView.topCard
    ? handleOnlineMissionEvents(onlineResultMissionEvents({
      won,
      resultKey,
      opponentStars: playerStarsForPoints(opponent.rating || 0),
      bonus: (nextView.bonusMultiplier || 1) > 1,
    }), { resultElementId: 'online-result-mission-summary', suppressToast: true })
    : { completedMissions: [], rewardDelta: 0, unlockedItems: [] };
  if (recordedResult.duplicate || !nextView.topCard) renderOnlineMissionSummary(missionResult, 'online-result-mission-summary');
  playerProfile = missionResult.profile || recordedResult.profile || ratingResult.profile;
  renderOnlineBonusResultSummary(won, ratingResult);
  els['online-result-modal'].classList.toggle('victory-earned', won);
  els['online-result-icon'].textContent = won ? '✦' : '↻';
  els['online-result-title'].textContent = won ? '내 승리!' : '상대 승리';
  els['online-result-description'].textContent = `현재 전적 ${mine.wins ?? 0}승 ${opponent.wins ?? 0}패 · ${won ? '같은 방에서 흐름을 이어가 보세요.' : '바로 다시 도전할 수 있어요.'}`;
  els['online-result-points-delta'].textContent = nextView.topCard ? `${ratingResult.delta > 0 ? '+' : ''}${ratingResult.delta}점` : '점수 변동 없음';
  els['online-result-points-delta'].classList.toggle('lost', ratingResult.delta < 0);
  els['online-result-current-points'].textContent = `현재 ${playerProfile.points.toLocaleString('ko-KR')}점 · ${starsText(playerStarsForPoints(playerProfile.points))}`;
  const unlockedItems = mergeUnlockedItems(ratingResult.unlockedItems || [], pendingOnlineMissionUnlocks, missionResult.unlockedItems || []);
  els['online-result-unlock'].classList.toggle('hidden', unlockedItems.length === 0);
  els['online-result-unlock'].classList.toggle('result-unlock-celebration', unlockedItems.length > 0);
  if (unlockedItems.length) {
    els['online-result-unlock-title'].textContent = unlockedItems.length >= 5 ? '꿈빛 왕국 풀 세트 해금!' : '새 꾸미기 해금!';
    els['online-result-unlock-copy'].textContent = `${unlockedItems.slice(0, 3).map((item) => `${item.icon} ${item.name}`).join(' · ')}${unlockedItems.length > 3 ? ` 외 ${unlockedItems.length - 3}개` : ''}`;
  }
  const nextUnlock = nextCosmeticUnlock(playerProfile.peakPoints);
  els['online-result-next-unlock'].classList.toggle('hidden', !nextUnlock);
  if (nextUnlock) {
    els['online-result-next-name'].textContent = `다음 보상 · ${nextUnlock.items[0].name}`;
    els['online-result-next-remaining'].textContent = `${nextUnlock.remaining.toLocaleString('ko-KR')}점 남음`;
  }
  els['online-rematch-me'].textContent = mine.ready ? '나 · 재대결 신청' : '나 · 대기';
  els['online-rematch-opponent'].textContent = opponent.ready ? `${opponent.nickname} · 신청` : `${opponent.nickname} · 대기`;
  els['online-rematch-me'].classList.toggle('ready', mine.ready);
  els['online-rematch-opponent'].classList.toggle('ready', opponent.ready);
  els['online-rematch-button'].textContent = mine.ready ? '재대결 신청 취소' : '재대결 신청';
  els['online-rematch-button'].disabled = !opponent.connected;
  if (!recordedResult.duplicate) client.setRating(playerProfile.points).catch(() => {});
  if (currentResultKey !== resultKey) {
    currentResultKey = resultKey;
    clearTimeout(resultRevealTimer);
    showOnlineResultModal(won);
  }
}

function showOnlineResultModal(won) {
  const modal = els['online-result-modal'];
  modal.classList.remove('victory-preview');
  if (won) {
    modal.classList.add('victory-preview');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('open'));
    resultRevealTimer = setTimeout(() => {
      modal.classList.remove('victory-preview');
    }, VICTORY_RESULT_REVEAL_DELAY_MS);
    return;
  }
  resultRevealTimer = setTimeout(() => {
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('open'));
  }, 1150);
}

function renderOnlineBonusResultSummary(won, ratingResult) {
  const bonus = (ratingResult?.bonusMultiplier || 1) > 1;
  els['online-result-bonus-summary'].classList.toggle('hidden', !bonus);
  if (!bonus) return;
  els['online-result-bonus-summary'].textContent = won
    ? `BONUS MATCH · 기본 +${ratingResult.baseDelta}점 ×${ratingResult.bonusMultiplier} = +${ratingResult.delta}점`
    : 'BONUS MATCH · 패배는 추가 차감 없이 -50점만 적용돼요';
}

function handleOnlineMissionEvents(events, { resultElementId = null, suppressToast = false } = {}) {
  const missionResult = applyMissionEvents(events);
  if (missionResult.profile) {
    playerProfile = missionResult.profile;
    applyOnlineCosmetics();
  }
  pendingOnlineMissionUnlocks = mergeUnlockedItems(pendingOnlineMissionUnlocks, missionResult.unlockedItems || []);
  scheduleOnlineAccountSync();
  renderOnlineMissionPanel();
  if (resultElementId) renderOnlineMissionSummary(missionResult, resultElementId);
  if (missionResult.rewardDelta > 0 && !suppressToast) {
    showToast(`미션 완료! +${missionResult.rewardDelta.toLocaleString('ko-KR')}점`);
  }
  return missionResult;
}

function renderOnlineMissionPanel() {
  if (!els['online-daily-missions-list'] || !els['online-weekly-missions-list']) return;
  const dashboard = loadMissionDashboard();
  renderOnlineMissionList(els['online-daily-missions-list'], dashboard.daily.missions);
  renderOnlineMissionList(els['online-weekly-missions-list'], dashboard.weekly.missions);
  els['online-daily-missions-count'].textContent = `${dashboard.daily.completedCount}/${dashboard.daily.total}`;
  els['online-weekly-missions-count'].textContent = `${dashboard.weekly.completedCount}/${dashboard.weekly.total}`;
}

function renderOnlineMissionList(container, missions) {
  container.replaceChildren();
  missions.forEach((mission) => {
    const article = document.createElement('article');
    article.className = `mission-item ${mission.completed ? 'complete' : ''}`;
    article.innerHTML = `
      <div class="mission-topline"><strong>${mission.title}</strong><b>+${mission.reward}점</b></div>
      <p>${mission.description}</p>
      <div class="mission-progress-row">
        <div class="mission-progress"><span style="--mission-progress:${mission.percent}%"></span></div>
        <small>${mission.progress}/${mission.target}</small>
      </div>
    `;
    container.append(article);
  });
}

function renderOnlineMissionSummary(missionResult, elementId) {
  const element = els[elementId];
  if (!element) return;
  const completed = missionResult?.completedMissions || [];
  element.classList.toggle('hidden', completed.length === 0);
  if (!completed.length) return;
  const names = completed.slice(0, 3).map((mission) => mission.title).join(' · ');
  element.innerHTML = `<strong>미션 보상 +${missionResult.rewardDelta.toLocaleString('ko-KR')}점</strong><small>${names}${completed.length > 3 ? ` 외 ${completed.length - 3}개` : ''}</small>`;
}

function onlineResultMissionEvents({ won, resultKey, opponentStars, bonus }) {
  return [
    { id: `${resultKey}:mission:game`, type: 'game', mode: 'multi', bonus },
    ...(won ? [{ id: `${resultKey}:mission:win`, type: 'win', mode: 'multi', opponentStars, bonus }] : []),
    ...(bonus ? [{ id: `${resultKey}:mission:bonus-match`, type: 'bonus-match', mode: 'multi' }] : []),
    ...(bonus && won ? [{ id: `${resultKey}:mission:bonus-win`, type: 'bonus-win', mode: 'multi', opponentStars }] : []),
  ];
}

function closeOnlineResult() {
  clearTimeout(resultRevealTimer);
  els['online-result-modal'].classList.remove('victory-preview');
  els['online-result-modal'].classList.remove('open');
  setTimeout(() => {
    if (view?.status !== 'finished') {
      els['online-result-modal'].classList.add('hidden');
      currentResultKey = '';
    }
  }, 180);
}

function setupReactionPickers() {
  [els['reaction-picker'], els['result-reaction-picker']].forEach((picker) => {
    picker.replaceChildren();
    REACTIONS.forEach((reaction) => {
      const button = createReactionButton(reaction);
      button.addEventListener('click', () => sendReaction(reaction.key));
      picker.append(button);
    });
  });
}

function toggleReactionPicker() {
  const willOpen = els['reaction-picker'].classList.contains('hidden');
  els['reaction-picker'].classList.toggle('hidden', !willOpen);
  els['reaction-toggle'].setAttribute('aria-expanded', String(willOpen));
  if (willOpen) requestAnimationFrame(() => els['reaction-picker'].classList.add('open'));
  else els['reaction-picker'].classList.remove('open');
}

function closeReactionPicker() {
  els['reaction-picker'].classList.remove('open');
  els['reaction-toggle'].setAttribute('aria-expanded', 'false');
  setTimeout(() => els['reaction-picker'].classList.add('hidden'), 160);
}

async function sendReaction(key) {
  if (reactionSending || !view || !['dice', 'playing', 'finished'].includes(view.status)) return;
  reactionSending = true;
  closeReactionPicker();
  try {
    await client.sendEmote(key);
  } catch (error) {
    showToast(friendlyError(error.message));
  } finally {
    setTimeout(() => { reactionSending = false; }, 1200);
  }
}

function showReaction(event) {
  const reaction = getReaction(event.payload?.emote);
  if (!reaction) return;
  const mine = event.actorSeat === view.mySeat;
  clearTimeout(reactionTimer);
  els['online-reaction-art'].replaceChildren(createReactionArtwork(reaction.key));
  els['online-reaction-label'].textContent = reaction.label;
  els['online-reaction-owner'].textContent = mine ? '내 반응' : `${getSeatView(view).opponent.nickname}의 반응`;
  els['online-reaction-bubble'].className = `reaction-bubble reaction-${reaction.key} ${mine ? 'mine' : 'theirs'}`;
  requestAnimationFrame(() => els['online-reaction-bubble'].classList.add('show'));
  playSound(`reaction-${reaction.key}`);
  reactionTimer = setTimeout(() => {
    els['online-reaction-bubble'].classList.remove('show');
    setTimeout(() => els['online-reaction-bubble'].classList.add('hidden'), 220);
  }, 2600);
}

async function openOnlineHistory() {
  if (!view || !['playing', 'finished'].includes(view.status)) return;
  els['online-history-list'].innerHTML = '<p class="history-empty">기록을 불러오는 중…</p>';
  els['online-history-modal'].classList.remove('hidden');
  requestAnimationFrame(() => els['online-history-modal'].classList.add('open'));
  try {
    const history = await client.getHistory();
    renderOnlineHistory(Array.isArray(history) ? history : []);
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'history-empty';
    message.textContent = friendlyError(error.message);
    els['online-history-list'].replaceChildren(message);
  }
}

function renderOnlineHistory(history) {
  els['online-history-list'].replaceChildren();
  if (!history.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = '아직 이번 판에 낸 카드가 없어요.';
    els['online-history-list'].append(empty);
    return;
  }
  history.forEach((entry, index) => {
    if (!entry.card) return;
    const mine = entry.actorSeat === view.mySeat;
    const row = document.createElement('article');
    row.className = `history-row ${mine ? 'mine' : 'theirs'}`;
    const card = createCard(entry.card, false);
    card.classList.add('history-mini-card');
    const detail = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = mine ? '내가 낸 카드' : `${getSeatView(view).opponent.nickname}이(가) 낸 카드`;
    const meta = document.createElement('small');
    const changedSuit = entry.chosenSuit ? ` · ${suitName(entry.chosenSuit)}로 변경` : '';
    meta.textContent = `${suitName(entry.card.suit)} ${entry.card.rank}${changedSuit}`;
    detail.append(title, meta);
    const order = document.createElement('span');
    order.className = 'history-order';
    order.textContent = `#${history.length - index}`;
    row.append(card, detail, order);
    els['online-history-list'].append(row);
  });
}

function closeOnlineHistory() {
  els['online-history-modal'].classList.remove('open');
  setTimeout(() => els['online-history-modal'].classList.add('hidden'), 180);
}

function showDrawReveal(cards) {
  revealActive = true;
  els['online-draw-cards'].replaceChildren();
  const track = document.createElement('div');
  track.className = 'draw-reveal-track';
  cards.forEach((card,index) => {
    const element = createCard(card,false);
    element.classList.add('drawn-card');
    element.style.setProperty('--draw-index',index);
    element.style.setProperty('--draw-count',cards.length);
    track.append(element);
  });
  els['online-draw-cards'].append(track);
  els['online-draw-cards'].scrollLeft = 0;
  els['online-draw-title'].textContent = cards.length > 1 ? `뽑은 카드 ${cards.length}장` : '뽑은 카드';
  els['online-draw-reveal'].classList.remove('hidden','leaving');
  requestAnimationFrame(() => els['online-draw-reveal'].classList.add('open'));
  setTimeout(closeDrawReveal, Math.min(2600,1200+cards.length*180));
}

function closeDrawReveal() {
  if (!revealActive) return;
  revealActive = false;
  els['online-draw-reveal'].classList.add('leaving');
  els['online-draw-reveal'].classList.remove('open');
  setTimeout(() => {
    els['online-draw-reveal'].classList.add('hidden');
    els['online-draw-reveal'].classList.remove('leaving');
    const nextView = latestDeferredView || view;
    latestDeferredView = null;
    if (nextView) renderView({ ...nextView, drawnCards: undefined });
    revealResolve?.(); revealResolve = null;
  },320);
}

function scheduleHandLayout() { requestAnimationFrame(updateHandLayout); }
function updateHandLayout() {
  const hand = els['online-player-hand'];
  const cards = [...hand.children];
  if (!cards.length || !hand.clientWidth) return;
  const width = cards[0].getBoundingClientRect().width;
  const style = getComputedStyle(hand);
  const padding = parseFloat(style.paddingLeft)+parseFloat(style.paddingRight);
  const compact = window.innerWidth <= 760;
  const layout = calculateHandLayout({containerWidth:hand.clientWidth,horizontalPadding:padding,cardWidth:width,cardCount:cards.length,compact});
  hand.style.setProperty('--hand-step',`${layout.step}px`);
  hand.classList.toggle('hand-scrolls',layout.scrolls);
  hand.classList.toggle('hand-centered',!layout.scrolls);
  hand.classList.toggle('fan-hand',compact);
  cards.forEach((card,index) => {
    const fan = calculateFanTransform({index,cardCount:cards.length,compact});
    card.style.setProperty('--fan-rotate',`${fan.angle}deg`);
    card.style.setProperty('--fan-hover-rotate',`${fan.hoverAngle}deg`);
    card.style.setProperty('--fan-y',`${fan.y}px`);
    card.style.zIndex=String(index+1);
  });
}

async function copyRoomCode() {
  try { await navigator.clipboard.writeText(view.code); showToast('방 코드를 복사했어요'); }
  catch { showToast(`방 코드: ${view.code}`); }
}

async function leaveRoom() {
  if (busy) return;
  busy = true;
  try { await client.leave(); }
  finally {
    busy = false; view = null; previousStatus = null; lastEventId = null;
    eventEffectGeneration += 1; clearTimeout(eventEffectTimer); effects.clear();
    els['online-table'].classList.remove('dealing-cards');
    displayedDice = [null, null]; lastDiceTie = false; clearDiceAnimation(0); clearDiceAnimation(1); closeOnlineResult(); closeOnlineHistory();
    els['online-game'].classList.add('hidden'); els['online-lobby'].classList.add('hidden'); els['online-entry'].classList.remove('hidden');
  }
}

function renderConnection(status) {
  els['connection-pill'].textContent = status === 'live' ? '● 실시간 연결' : status === 'connected' ? '인증 완료' : status === 'setup required' ? '설정 필요' : '재연결 중';
  els['connection-pill'].classList.toggle('live',status === 'live');
}

function dieFace(value) { return value ? ['⚀','⚁','⚂','⚃','⚄','⚅'][value-1] : '⚀'; }
function suitName(suit) { return {hearts:'하트',diamonds:'다이아',spades:'스페이드',clubs:'클로버',joker:'조커'}[suit] || ''; }

function playOnlineToy(button) {
  const baseToy = button.dataset.onlineToy;
  const toy = activeOnlineToyKey(baseToy);
  const lines = ONLINE_TOY_LINES[toy];
  const count = Number(button.dataset.playCount || 0);
  button.dataset.playCount = String(count + 1);
  button.querySelector('.toy-bubble').textContent = lines[count % lines.length];
  button.classList.remove('is-playing'); void button.offsetWidth; button.classList.add('is-playing');
  playSound(`toy-${toy}`);
  burstOnlineToyParticles(button, toy);
  setTimeout(() => button.classList.remove('is-playing'),850);
}

function activeOnlineToyKey(baseToy) {
  const variant = ONLINE_TOY_VARIANTS.find((item) => item.base === baseToy && document.body.classList.contains(item.cssClass));
  return variant?.key || baseToy;
}

function burstOnlineToyParticles(button, toy) {
  button.querySelector('.toy-particles')?.remove();
  const burst = document.createElement('span');
  burst.className = `toy-particles toy-particles-${toy}`;
  const particleCount = ONLINE_TOY_PARTICLE_COUNTS[toy] || 10;
  for (let index = 0; index < particleCount; index += 1) {
    const spark = document.createElement('i');
    const angle = (Math.PI * 2 * index) / particleCount;
    const distance = 28 + (index % 3) * 8 + (ONLINE_TOY_PARTICLE_COUNTS[toy] ? 8 : 0);
    spark.style.setProperty('--toy-px', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--toy-py', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--toy-delay', `${(index % 4) * 25}ms`);
    burst.append(spark);
  }
  button.append(burst);
  setTimeout(() => burst.remove(), 850);
}

function showToast(message) {
  els['online-toast'].textContent=message; els['online-toast'].classList.remove('hidden');
  requestAnimationFrame(()=>els['online-toast'].classList.add('show'));
  setTimeout(()=>{els['online-toast'].classList.remove('show');setTimeout(()=>els['online-toast'].classList.add('hidden'),220);},2300);
}

function friendlyError(message='') {
  if (message.includes('ROOM_NOT_FOUND')) return '방을 찾을 수 없어요. 코드를 확인해 주세요.';
  if (message.includes('ROOM_FULL')) return '이미 두 명이 참가한 방이에요.';
  if (message.includes('STALE_VERSION')) return '상태가 갱신됐어요. 다시 시도해 주세요.';
  if (message.includes('NOT_YOUR_TURN')) return '지금은 내 차례가 아니에요.';
  if (message.includes('MUST_DEFEND_JOKER')) return '조커 공격은 조커로만 막을 수 있어요.';
  if (message.includes('SUPABASE_NOT_CONFIGURED')) return 'Supabase 공개 설정을 먼저 입력해 주세요.';
  if (message.includes('EMOTE_RATE_LIMIT')) return '반응은 잠깐 쉬었다가 다시 보내 주세요.';
  if (message.includes('EMOTE_NOT_AVAILABLE')) return '게임 준비 후 반응을 보낼 수 있어요.';
  return message || '처리 중 문제가 생겼어요.';
}

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
