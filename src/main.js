import { OneCardGame, SUIT_SYMBOLS } from './game-engine.js';
import { chooseAiMove } from './ai-player.js';
import { isSoundEnabled, playSound, toggleSound } from './audio.js';
import { calculateFanTransform, calculateHandLayout } from './2026-06-30-hand-layout.js';
import { createGameEffects } from './2026-06-30-effects.js';
import { makeToyDraggable } from './2026-06-30-toy-drag.js';
import { animateCardToPile } from './2026-06-30-card-motion.js';
import { runDealAnimation } from './2026-06-30-deal-animation.js';
import { REACTIONS, createReactionArtwork, createReactionButton, getReaction } from './2026-06-30-reactions.js';
import { aiReactionDelay, chooseAiReaction } from './2026-07-01-ai-reactions.js';
import { createCardCenter } from './2026-07-01-card-art.js';
import {
  AI_OPPONENTS,
  loadPlayerProfile,
  matchmakingWeights,
  ratingProgress,
  recordMatchResult,
  rememberAiOpponent,
  rewardForStars,
  rollBonusMatch,
  savePlayerProfile,
  selectAiOpponent,
  starsText,
} from './2026-07-05-rating.js';
import {
  COSMETICS,
  COSMETIC_SLOTS,
  allSetBonusClassNames,
  cosmeticById,
  cosmeticSetForItem,
  cosmeticSetProgress,
  cosmeticsForSlot,
  equippedClassNames,
  nextCosmeticUnlock,
} from './2026-07-06-cosmetics.js';
import {
  applyMissionEvents,
  loadMissionDashboard,
  mergeUnlockedItems,
  missionEventsForCard,
} from './2026-07-07-missions.js';
import {
  friendlyAccountSyncError,
  getAccountSyncState,
  queueAccountProfileSync,
  requestEmailRecordLink,
  syncAccountProfile,
} from './2026-07-07-account-sync.js';

const DIFFICULTIES = Object.fromEntries(AI_OPPONENTS.map((opponent) => [opponent.key, opponent]));

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map((element) => [element.id, element]));
const game = new OneCardGame();
let difficulty = 'star3';
let playerProfile = loadPlayerProfile();
let currentMatchId = '';
let currentBonusMatch = false;
let lastRatingResult = null;
let pendingMissionUnlocks = [];
let matching = false;
let activeCosmeticSlot = 'all';
let previewCosmeticId = null;
let cosmeticPreviewMode = 'normal';
let startedAt = 0;
let timerId = null;
let aiTimer = null;
let resultRevealTimer = null;
let moves = 0;
let pendingSeven = null;
let toastTimer = null;
let handLayoutFrame = null;
let isPeekingHand = false;
let oneCardAnnounced = [false, false];
let gameReady = false;
let diceRolling = false;
let drawAnimating = false;
let drawRevealResolve = null;
let drawRevealTimer = null;
let cardAnimating = false;
let oneCardEffectTimer = null;
let reactionTimer = null;
let reactionPickerTimer = null;
let aiReactionTimer = null;
let aiReactionCooldownUntil = 0;
let cosmeticPreviewTimer = null;
let currentAccountSyncState = { status: 'checking' };

const CARD_FACE_CLASS_NAMES = COSMETICS
  .filter((item) => item.slot === 'cardFace' && item.cssClass)
  .map((item) => item.cssClass);
const VICTORY_RESULT_REVEAL_DELAY_MS = 2550;

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const TOY_LINES = {
  jelly: ['말랑!', '뿌잉!', '또 눌러줘!'],
  star: ['빙글!', '반짝!', '슈웅!'],
  rose: ['향긋!', '사랑을 담아!', '장미 파워!'],
  'rose-musicbox': ['딩딩딩♪', '태엽 감기!', '장미 왈츠!'],
  'rose-teacup': ['살랑!', '이슬 톡!', '꽃잎 팡!'],
  'crimson-clockwork': ['활짝!', '진홍 팡!', '꽃잎 폭발!'],
  'royal-flower-fountain': ['촤르르르!', '꽃정원 만개!', '무지개 분수 팡!'],
};

const TOY_VARIANTS = [
  { base: 'star', cssClass: 'skin-charm-rose-musicbox', key: 'rose-musicbox' },
  { base: 'jelly', cssClass: 'skin-charm-rose-teacup', key: 'rose-teacup' },
  { base: 'rose', cssClass: 'skin-charm-crimson-clockwork', key: 'crimson-clockwork' },
  { base: 'star', cssClass: 'skin-charm-royal-flower-fountain', key: 'royal-flower-fountain' },
];
const TOY_PARTICLE_COUNTS = {
  'rose-musicbox': 16,
  'rose-teacup': 14,
  'crimson-clockwork': 18,
  'royal-flower-fountain': 30,
};
const TOY_PLAY_DURATIONS = { 'royal-flower-fountain': 1400 };
const TOY_PARTICLE_SPREADS = { 'royal-flower-fountain': 1.75 };

const effects = createGameEffects({
  root: els['action-overlay'],
  particles: els['effect-particles'],
  symbol: els['effect-symbol'],
  title: els['effect-title'],
  subtitle: els['effect-subtitle'],
});

const toyControllers = [...document.querySelectorAll('[data-toy]')]
  .map((button) => makeToyDraggable(button, els['game-table'], playWithToy));

els['ai-match-button'].addEventListener('click', beginAiMatchmaking);
document.querySelectorAll('[data-open-modal]').forEach((button) => {
  button.addEventListener('click', () => openModal(button.dataset.openModal));
});
document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', () => closeModal(button.dataset.closeModal));
});
document.querySelectorAll('[data-suit]').forEach((button) => {
  button.addEventListener('click', () => finishSeven(button.dataset.suit));
});
document.querySelectorAll('.sound-button').forEach((button) => button.addEventListener('click', () => {
  toggleSound();
  updateSoundButtons();
}));
els['draw-pile'].addEventListener('click', playerDraw);
els['discard-pile'].addEventListener('click', openHistory);
els['exit-button'].addEventListener('click', goHome);
els['match-again-button'].addEventListener('click', matchAgain);
els['result-home-button'].addEventListener('click', goHome);
els['cosmetics-button'].addEventListener('click', openCosmetics);
els['account-profile-button']?.addEventListener('click', openAccountModal);
els['account-connect-button']?.addEventListener('click', openAccountModal);
els['account-refresh-button']?.addEventListener('click', refreshAccountSync);
els['account-modal-sync-button']?.addEventListener('click', () => refreshAccountSync({ manual: true }));
els['account-link-email-button']?.addEventListener('click', connectAccountEmail);
els['account-email-input']?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    connectAccountEmail();
  }
});
els['cosmetic-preview-replay'].addEventListener('click', replayCosmeticPreview);
els['cosmetic-preview-equip'].addEventListener('click', equipPreviewedCosmetic);
document.querySelectorAll('[data-cosmetic-preview-mode]').forEach((button) => {
  button.addEventListener('click', () => setCosmeticPreviewMode(button.dataset.cosmeticPreviewMode));
});
els['reduced-effects-button'].addEventListener('click', toggleReducedEffects);
els['peek-hand-button'].addEventListener('click', peekAtHand);
els['return-to-suit-button'].addEventListener('click', returnToSuitPicker);
els['cancel-seven-button'].addEventListener('click', cancelSevenSelection);
els['roll-dice-button'].addEventListener('click', rollForFirstTurn);
els['draw-reveal-skip'].addEventListener('click', finishDrawReveal);
els['ai-reaction-toggle'].addEventListener('click', toggleAiReactionPicker);

setupAiReactionPickers();
setupCosmeticTabs();
applyEquippedCosmetics();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const open = document.querySelector('.modal:not(.hidden)');
    if (open?.id === 'suit-picker') peekAtHand();
    if (['rules-modal', 'history-modal'].includes(open?.id)) closeModal(open.id);
  }
});
window.addEventListener('resize', () => {
  scheduleHandLayout();
  toyControllers.forEach((controller) => controller.reset());
});

async function beginAiMatchmaking() {
  if (matching) return;
  matching = true;
  playerProfile = loadPlayerProfile();
  const opponent = selectAiOpponent(playerProfile.points, Math.random, playerProfile.recentAiStars);
  const bonusMatch = rollBonusMatch(playerProfile.points);
  const weights = matchmakingWeights(playerProfile.points);
  els['matching-kicker'].textContent = bonusMatch ? 'BONUS MATCH!' : 'AI MATCHING';
  els['matching-points'].textContent = `${playerProfile.points.toLocaleString('ko-KR')}점`;
  els['matching-probability'].textContent = weights
    .map((weight, index) => weight ? `${index + 1}성 ${weight}%` : '')
    .filter(Boolean)
    .join(' · ');
  els['matching-result'].classList.remove('decided');
  els['matching-result'].classList.toggle('bonus', bonusMatch);
  openModal('matching-modal');
  playSound('card');

  const sequence = Array.from({ length: 16 }, (_, index) => AI_OPPONENTS[(index + Math.floor(Math.random() * 5)) % 5]);
  sequence.push(opponent);
  for (let index = 0; index < sequence.length; index += 1) {
    const candidate = sequence[index];
    els['matching-icon'].textContent = candidate.icon;
    els['matching-name'].textContent = candidate.name;
    els['matching-stars'].textContent = starsText(candidate.stars);
    els['matching-reward'].textContent = bonusMatch
      ? `승리 +${rewardForStars(candidate.stars) * 2}점 · 보너스 ×2`
      : `승리 +${rewardForStars(candidate.stars)}점`;
    els['matching-result'].classList.remove('tick');
    void els['matching-result'].offsetWidth;
    els['matching-result'].classList.add('tick');
    playSound('card');
    const progress = index / (sequence.length - 1);
    await wait(50 + Math.round(progress ** 3 * 260));
  }

  els['matching-result'].classList.add('decided');
  els['matching-kicker'].textContent = bonusMatch ? '보너스판 상대 결정!' : '상대 결정!';
  currentBonusMatch = bonusMatch;
  playerProfile = rememberAiOpponent(playerProfile, opponent.stars);
  scheduleAccountSync();
  await wait(1150);
  closeModal('matching-modal');
  matching = false;
  await wait(220);
  startGame(opponent.key);
}

function startGame(selectedDifficulty) {
  clearTimeout(aiTimer);
  clearTimeout(resultRevealTimer);
  clearTimeout(aiReactionTimer);
  clearTimeout(reactionTimer);
  window.scrollTo(0, 0);
  difficulty = selectedDifficulty;
  currentMatchId = `ai:${Date.now()}:${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
  lastRatingResult = null;
  pendingMissionUnlocks = [];
  game.reset(difficulty);
  moves = 0;
  pendingSeven = null;
  isPeekingHand = false;
  oneCardAnnounced = [false, false];
  gameReady = false;
  diceRolling = false;
  drawAnimating = false;
  cardAnimating = false;
  aiReactionCooldownUntil = 0;
  hideAiReaction();
  closeAiReactionPicker(true);
  clearTimeout(oneCardEffectTimer);
  effects.clear();
  toyControllers.forEach((controller) => controller.reset());
  els['game-screen'].classList.remove('suit-peek-active');
  els['suit-return-bar'].classList.add('hidden');
  startedAt = 0;
  els['home-screen'].classList.add('hidden');
  els['game-screen'].classList.remove('hidden');
  els['game-table'].classList.add('dealing-cards');
  els['bonus-match-badge'].classList.toggle('hidden', !currentBonusMatch);
  closeModal('result-modal');
  els['match-again-button'].disabled = false;
  const profile = DIFFICULTIES[difficulty];
  els['difficulty-label'].textContent = profile.name;
  els['ai-name'].textContent = profile.name;
  els['ai-avatar'].textContent = profile.icon;
  els['ai-status'].textContent = profile.status;
  els['dice-ai-name'].textContent = profile.name;
  clearInterval(timerId);
  timerId = null;
  updateTimer();
  playSound('card');
  render();
  resetDiceModal();
  setTimeout(() => openModal('dice-modal'), 180);
}

function resetDiceModal() {
  els['player-die'].textContent = DIE_FACES[0];
  els['ai-die'].textContent = DIE_FACES[0];
  els['player-die-result'].textContent = '-';
  els['ai-die-result'].textContent = '-';
  els['dice-status'].textContent = '먼저 내 주사위를 굴려 선공을 정해요.';
  els['roll-dice-button'].textContent = '내 주사위 굴리기';
  els['roll-dice-button'].disabled = false;
  els['dice-modal'].classList.remove('dice-tie', 'dice-decided');
}

async function rollForFirstTurn() {
  if (diceRolling || gameReady) return;
  diceRolling = true;
  els['roll-dice-button'].disabled = true;
  els['dice-status'].textContent = '내 주사위가 데구르르…';
  els['dice-modal'].classList.remove('dice-tie', 'dice-decided');
  const playerRoll = randomDie();
  const aiRoll = randomDie();
  playSound('dice');
  await animateDie(els['player-die'], els['player-die-result'], playerRoll, 920);
  els['dice-status'].textContent = `나는 ${playerRoll}! 이제 ${DIFFICULTIES[difficulty].name}가 굴립니다.`;
  await wait(420);
  playSound('dice');
  await animateDie(els['ai-die'], els['ai-die-result'], aiRoll, 1060);

  if (playerRoll === aiRoll) {
    els['dice-modal'].classList.add('dice-tie');
    els['dice-status'].textContent = `${playerRoll} 대 ${aiRoll}, 동점! 한 번 더 굴려요.`;
    els['roll-dice-button'].textContent = '다시 굴리기';
    els['roll-dice-button'].disabled = false;
    diceRolling = false;
    playSound('dice-tie');
    return;
  }

  const playerFirst = playerRoll > aiRoll;
  game.setStartingPlayer(playerFirst ? 0 : 1);
  diceRolling = false;
  els['dice-modal'].classList.add('dice-decided');
  els['dice-status'].textContent = playerFirst
    ? `${playerRoll} 대 ${aiRoll}! 내가 먼저 시작합니다.`
    : `${playerRoll} 대 ${aiRoll}! ${DIFFICULTIES[difficulty].name}가 먼저 시작합니다.`;
  els['roll-dice-button'].textContent = playerFirst ? '내가 선공!' : '나는 후공!';
  render();
  await wait(1050);
  closeModal('dice-modal');
  await wait(220);
  els['game-table'].classList.add('dealing-cards');
  await runDealAnimation({
    playerCards: game.hands[0],
    createCardFace: (card) => createCardElement(card, false),
    playSound,
  });
  els['game-table'].classList.remove('dealing-cards');
  gameReady = true;
  startedAt = Date.now();
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 1000);
  render();
  effects.play('initiative', {
    symbol: playerFirst ? '1st' : '2nd',
    title: playerFirst ? '선공!' : '후공!',
    subtitle: playerFirst ? '내가 먼저 카드를 냅니다' : `${DIFFICULTIES[difficulty].name}의 선공입니다`,
    particleCount: 24,
  });
  playSound(playerFirst ? 'first' : 'second');
  if (currentBonusMatch) {
    setTimeout(() => playBonusStartEffect(els['game-table']), 1700);
  }
  if (!playerFirst) setTimeout(scheduleAiTurn, currentBonusMatch ? 4050 : 2150);
}

function randomDie() {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return (value[0] % 6) + 1;
  }
  return Math.floor(Math.random() * 6) + 1;
}

function animateDie(die, resultLabel, result, duration) {
  return new Promise((resolve) => {
    die.classList.add('rolling');
    resultLabel.textContent = '…';
    let tick = 0;
    const interval = setInterval(() => {
      die.textContent = DIE_FACES[(tick + Math.floor(Math.random() * 6)) % 6];
      tick += 1;
    }, 75);
    setTimeout(() => {
      clearInterval(interval);
      die.textContent = DIE_FACES[result - 1];
      die.classList.remove('rolling');
      die.classList.add('landed');
      resultLabel.textContent = String(result);
      setTimeout(() => die.classList.remove('landed'), 500);
      resolve();
    }, duration);
  });
}

function playBonusStartEffect(tableElement) {
  tableElement?.classList.add('bonus-starting');
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
  setTimeout(() => tableElement?.classList.remove('bonus-starting'), 2100);
  setTimeout(() => flare.remove(), 2300);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showDrawReveal(cards, wasPenalty) {
  if (!cards.length) return Promise.resolve();
  clearTimeout(drawRevealTimer);
  els['draw-reveal-title'].textContent = wasPenalty
    ? `공격으로 받은 카드 ${cards.length}장`
    : '뽑은 카드를 확인하세요';
  els['draw-reveal-cards'].replaceChildren();
  const track = document.createElement('div');
  track.className = 'draw-reveal-track';
  cards.forEach((card, index) => {
    const cardElement = createCardElement(card, false);
    cardElement.classList.add('drawn-card');
    cardElement.style.setProperty('--draw-index', index);
    cardElement.style.setProperty('--draw-count', cards.length);
    track.append(cardElement);
  });
  els['draw-reveal-cards'].append(track);
  els['draw-reveal-cards'].scrollLeft = 0;
  els['draw-reveal'].classList.remove('hidden', 'leaving');
  requestAnimationFrame(() => els['draw-reveal'].classList.add('open'));
  setTimeout(() => els['draw-reveal-skip'].focus(), 120);

  return new Promise((resolve) => {
    drawRevealResolve = resolve;
    drawRevealTimer = setTimeout(finishDrawReveal, Math.min(2600, 1150 + cards.length * 180));
  });
}

function finishDrawReveal() {
  if (!drawRevealResolve) return;
  clearTimeout(drawRevealTimer);
  const resolve = drawRevealResolve;
  drawRevealResolve = null;
  els['draw-reveal'].classList.add('leaving');
  els['draw-reveal'].classList.remove('open');
  setTimeout(() => {
    els['draw-reveal'].classList.add('hidden');
    els['draw-reveal'].classList.remove('leaving');
    resolve();
  }, 320);
}

function setupAiReactionPickers() {
  [els['ai-reaction-picker'], els['ai-result-reaction-picker']].forEach((picker) => {
    picker.replaceChildren();
    REACTIONS.forEach((reaction) => {
      const button = createReactionButton(reaction);
      button.addEventListener('click', () => sendPlayerReaction(reaction.key));
      picker.append(button);
    });
  });
}

function toggleAiReactionPicker() {
  clearTimeout(reactionPickerTimer);
  const picker = els['ai-reaction-picker'];
  const willOpen = picker.classList.contains('hidden');
  if (willOpen) {
    picker.classList.remove('hidden');
    els['ai-reaction-toggle'].setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => picker.classList.add('open'));
  } else {
    closeAiReactionPicker();
  }
}

function closeAiReactionPicker(immediate = false) {
  clearTimeout(reactionPickerTimer);
  const picker = els['ai-reaction-picker'];
  picker.classList.remove('open');
  els['ai-reaction-toggle'].setAttribute('aria-expanded', 'false');
  if (immediate) picker.classList.add('hidden');
  else reactionPickerTimer = setTimeout(() => picker.classList.add('hidden'), 160);
}

function sendPlayerReaction(key) {
  closeAiReactionPicker();
  showAiReaction(key, false);
  handleMissionEvents([{ id: `${currentMatchId || 'home'}:emote:${key}:${Date.now()}`, type: 'emote' }]);
  maybeAiReact({ type: 'player-emote', emote: key }, { force: true });
}

function maybeAiReact(context, { force = false, delay = null } = {}) {
  if (!force && Date.now() < aiReactionCooldownUntil) return;
  const key = chooseAiReaction(context, difficulty);
  if (!key) return;
  const waitFor = delay ?? aiReactionDelay(difficulty);
  clearTimeout(aiReactionTimer);
  aiReactionCooldownUntil = Date.now() + waitFor + 3400;
  aiReactionTimer = setTimeout(() => {
    if (els['game-screen'].classList.contains('hidden')) return;
    showAiReaction(key, true);
  }, waitFor);
}

function showAiReaction(key, isAi) {
  const reaction = getReaction(key);
  if (!reaction) return;
  clearTimeout(reactionTimer);
  const bubble = els['ai-reaction-bubble'];
  els['ai-reaction-art'].replaceChildren(createReactionArtwork(reaction.key));
  els['ai-reaction-label'].textContent = reaction.label;
  els['ai-reaction-owner'].textContent = isAi ? `${DIFFICULTIES[difficulty].name}의 반응` : '내 반응';
  bubble.className = `reaction-bubble ai-reaction-bubble reaction-${reaction.key} ${isAi ? 'theirs' : 'mine'}`;
  requestAnimationFrame(() => bubble.classList.add('show'));
  playSound(`reaction-${reaction.key}`);
  reactionTimer = setTimeout(() => {
    bubble.classList.remove('show');
    setTimeout(() => bubble.classList.add('hidden'), 220);
  }, 2600);
}

function hideAiReaction() {
  const bubble = els['ai-reaction-bubble'];
  bubble.classList.remove('show');
  bubble.classList.add('hidden');
}

function reactToCard(result, isAi) {
  const remaining = game.hands[isAi ? 1 : 0].length;
  const owner = isAi ? 'ai' : 'player';
  let context = null;
  if (remaining === 1) context = `${owner}-onecard`;
  else if (result.card.rank === 'JOKER') context = `${owner}-joker`;
  else if (['2', 'A'].includes(result.card.rank)) context = `${owner}-attack`;
  if (context) maybeAiReact(context);
}

function matchAgain() {
  if (matching) return;
  els['match-again-button'].disabled = true;
  maybeAiReact('rematch', { force: true, delay: 80 });
  closeModal('result-modal');
  updateRecord();
  setTimeout(beginAiMatchmaking, 520);
}

function setupCosmeticTabs() {
  els['cosmetics-tabs'].replaceChildren();
  [{ key: 'all', name: '전체보기' }, ...COSMETIC_SLOTS].forEach((slot) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cosmetics-tab';
    button.dataset.cosmeticSlot = slot.key;
    button.setAttribute('role', 'tab');
    button.textContent = slot.name;
    button.addEventListener('click', () => {
      activeCosmeticSlot = slot.key;
      if (slot.key !== 'all') previewCosmeticId = playerProfile.equipped?.[slot.key] || cosmeticsForSlot(slot.key)[0]?.id;
      else previewCosmeticId ||= playerProfile.equipped?.table;
      renderCosmeticsModal();
    });
    els['cosmetics-tabs'].append(button);
  });
}

function openCosmetics() {
  playerProfile = loadPlayerProfile();
  previewCosmeticId = activeCosmeticSlot === 'all'
    ? previewCosmeticId || playerProfile.equipped?.table
    : playerProfile.equipped?.[activeCosmeticSlot] || cosmeticsForSlot(activeCosmeticSlot)[0]?.id;
  renderCosmeticsModal();
  openModal('cosmetics-modal');
}

function renderCosmeticsModal({ preserveGridScroll = null } = {}) {
  const peak = playerProfile.peakPoints || 0;
  els['cosmetics-peak-points'].textContent = `${peak.toLocaleString('ko-KR')}점`;
  document.querySelectorAll('.cosmetics-tab').forEach((button) => {
    const active = button.dataset.cosmeticSlot === activeCosmeticSlot;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  const next = nextCosmeticUnlock(peak);
  if (next) {
    const previousThreshold = Math.max(0, ...COSMETICS.filter((item) => item.threshold <= peak).map((item) => item.threshold));
    const ratio = (peak - previousThreshold) / (next.threshold - previousThreshold);
    els['cosmetics-next-copy'].textContent = `${next.items[0].name}까지 ${next.remaining.toLocaleString('ko-KR')}점`;
    els['cosmetics-progress-fill'].style.width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
  } else {
    els['cosmetics-next-copy'].textContent = '모든 꾸미기를 해금했어요!';
    els['cosmetics-progress-fill'].style.width = '100%';
  }

  els['cosmetics-grid'].replaceChildren();
  els['cosmetics-grid'].classList.toggle('all-items', activeCosmeticSlot === 'all');
  const visibleItems = activeCosmeticSlot === 'all'
    ? [...COSMETICS].sort((a, b) => Number(a.threshold === 0) - Number(b.threshold === 0) || a.threshold - b.threshold || a.slot.localeCompare(b.slot))
    : cosmeticsForSlot(activeCosmeticSlot);
  visibleItems.forEach((item) => {
    const unlocked = item.threshold <= peak;
    const equipped = playerProfile.equipped?.[item.slot] === item.id;
    const selected = previewCosmeticId === item.id;
    const itemSet = cosmeticSetForItem(item.id);
    const slotName = COSMETIC_SLOTS.find((slot) => slot.key === item.slot)?.name || item.slot;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `cosmetic-item ${equipped ? 'equipped' : ''} ${selected ? 'selected' : ''} ${unlocked ? '' : 'locked'} ${item.legendary ? 'legendary' : ''}`;
    button.dataset.cosmeticState = selected ? 'previewing' : equipped ? 'equipped' : unlocked ? 'unlocked' : 'locked';
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${item.name} 미리보기${unlocked ? '' : `, ${item.threshold}점에 해금`}`);
    const stateLabel = selected
      ? equipped ? '✓ 현재 장착 · 미리보기' : unlocked ? '● 미리보기 중' : `● 미리보기 중 · ${item.threshold.toLocaleString('ko-KR')}점 잠금`
      : equipped ? '✓ 현재 장착' : unlocked ? '눌러서 미리보기' : `🔒 ${item.threshold.toLocaleString('ko-KR')}점에 해금`;
    button.innerHTML = `<span class="cosmetic-item-meta"><em>${slotName}</em>${itemSet || item.concept ? `<i>${itemSet?.name || item.concept}</i>` : ''}</span><span class="cosmetic-item-icon">${item.icon}</span><strong>${item.name}</strong><small>${item.description}</small><b>${stateLabel}</b>`;
    button.addEventListener('click', () => {
      const scrollTop = els['cosmetics-grid'].scrollTop;
      previewCosmeticId = item.id;
      cosmeticPreviewMode = item.slot === 'effect' ? 'effect' : item.slot === 'victory' ? 'victory' : 'normal';
      renderCosmeticsModal({ preserveGridScroll: scrollTop });
      replayCosmeticPreview();
    });
    els['cosmetics-grid'].append(button);
  });
  renderCosmeticPreview();
  renderReducedEffectsButton();
  if (Number.isFinite(preserveGridScroll)) {
    requestAnimationFrame(() => { els['cosmetics-grid'].scrollTop = preserveGridScroll; });
  }
}

function equipCosmetic(item) {
  if (!item || item.threshold > (playerProfile.peakPoints || 0)) return;
  const scrollTop = els['cosmetics-grid'].scrollTop;
  playerProfile.equipped = { ...playerProfile.equipped, [item.slot]: item.id };
  playerProfile = savePlayerProfile(playerProfile);
  scheduleAccountSync();
  applyEquippedCosmetics();
  renderCosmeticsModal({ preserveGridScroll: scrollTop });
  playSound('card');
  showToast(`${item.name} 장착 완료!`);
}

function renderCosmeticPreview() {
  const fallbackId = activeCosmeticSlot === 'all'
    ? playerProfile.equipped?.table
    : playerProfile.equipped?.[activeCosmeticSlot] || cosmeticsForSlot(activeCosmeticSlot)[0]?.id;
  const item = cosmeticById(previewCosmeticId) || cosmeticById(fallbackId);
  if (!item) return;
  previewCosmeticId = item.id;

  const previewEquipped = { ...playerProfile.equipped, [item.slot]: item.id };

  const root = els['cosmetic-preview'];
  const allClasses = COSMETICS.map((candidate) => candidate.cssClass).filter(Boolean);
  root.classList.remove(...allClasses, ...allSetBonusClassNames(), 'preview-playing');
  root.classList.add(...equippedClassNames(previewEquipped));

  const unlocked = item.threshold <= (playerProfile.peakPoints || 0);
  const equipped = playerProfile.equipped?.[item.slot] === item.id;
  const itemSet = cosmeticSetForItem(item.id);
  const setProgress = cosmeticSetProgress(itemSet, playerProfile.peakPoints);
  els['cosmetic-preview-set'].classList.toggle('hidden', !itemSet);
  els['cosmetic-preview-set'].textContent = itemSet ? `${itemSet.icon} ${itemSet.name} ${setProgress.unlocked}/${setProgress.total}` : '';
  els['cosmetic-preview-status'].textContent = unlocked ? equipped ? '미리보기 · 현재 장착' : '미리보기 · 장착 가능' : `미리보기 · ${item.threshold.toLocaleString('ko-KR')}점에 해금`;
  els['cosmetic-preview-name'].textContent = item.name;
  const slotName = COSMETIC_SLOTS.find((slot) => slot.key === item.slot)?.name || item.slot;
  els['cosmetic-preview-description'].textContent = `${slotName} · ${item.description}`;
  els['cosmetic-preview-equip'].disabled = !unlocked || equipped;
  els['cosmetic-preview-equip'].textContent = !unlocked
    ? `${item.threshold.toLocaleString('ko-KR')}점에 해금`
    : equipped ? '✓ 현재 장착' : '이 아이템 장착';
  renderCosmeticPreviewMode();
}

function equipPreviewedCosmetic() {
  equipCosmetic(cosmeticById(previewCosmeticId));
}

function replayCosmeticPreview() {
  const root = els['cosmetic-preview'];
  clearTimeout(cosmeticPreviewTimer);
  root.classList.remove('preview-playing');
  void root.offsetWidth;
  root.classList.add('preview-playing');
  const item = cosmeticById(previewCosmeticId);
  playSound(item?.slot === 'victory' || item?.legendary ? 'win' : 'action');
  cosmeticPreviewTimer = setTimeout(() => root.classList.remove('preview-playing'), item?.slot === 'victory' ? 3600 : 1400);
}

function setCosmeticPreviewMode(mode) {
  if (!['normal', 'effect', 'victory'].includes(mode)) return;
  cosmeticPreviewMode = mode;
  renderCosmeticPreviewMode();
  if (mode !== 'normal') replayCosmeticPreview();
}

function renderCosmeticPreviewMode() {
  const root = els['cosmetic-preview'];
  root.classList.remove('preview-mode-normal', 'preview-mode-effect', 'preview-mode-victory');
  root.classList.add(`preview-mode-${cosmeticPreviewMode}`);
  document.querySelectorAll('[data-cosmetic-preview-mode]').forEach((button) => {
    const active = button.dataset.cosmeticPreviewMode === cosmeticPreviewMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function toggleReducedEffects() {
  playerProfile.reducedEffects = !playerProfile.reducedEffects;
  playerProfile = savePlayerProfile(playerProfile);
  scheduleAccountSync();
  applyEquippedCosmetics();
  renderReducedEffectsButton();
}

function renderReducedEffectsButton() {
  const reduced = Boolean(playerProfile.reducedEffects);
  els['reduced-effects-button'].setAttribute('aria-pressed', String(reduced));
  els['reduced-effects-button'].querySelector('strong').textContent = '효과 줄이기';
  els['reduced-effects-button'].querySelector('small').textContent = '파티클과 큰 연출을 최소화해요';
  els['reduced-effects-button'].querySelector('b').textContent = reduced ? 'ON' : 'OFF';
}

function applyEquippedCosmetics() {
  const allClasses = COSMETICS.map((item) => item.cssClass).filter(Boolean);
  document.body.classList.remove(...allClasses, ...allSetBonusClassNames(), 'reduced-effects');
  document.body.classList.add(...equippedClassNames(playerProfile.equipped));
  document.body.classList.toggle('reduced-effects', Boolean(playerProfile.reducedEffects));
  applyDiscardFaceSkin();
}

function equippedCardFaceClassName() {
  const cardFace = cosmeticById(playerProfile.equipped?.cardFace);
  return cardFace?.slot === 'cardFace' ? cardFace.cssClass : 'skin-face-classic';
}

function applyDiscardFaceSkin() {
  const discardWrap = els['discard-pile']?.closest('.discard-wrap');
  if (!discardWrap) return;
  discardWrap.classList.remove(...CARD_FACE_CLASS_NAMES);
  discardWrap.classList.add(equippedCardFaceClassName());
}

function goHome() {
  clearTimeout(aiTimer);
  clearTimeout(resultRevealTimer);
  clearTimeout(aiReactionTimer);
  clearTimeout(reactionTimer);
  clearTimeout(oneCardEffectTimer);
  clearInterval(timerId);
  window.scrollTo(0, 0);
  effects.clear();
  hideAiReaction();
  closeAiReactionPicker(true);
  els['game-table'].classList.remove('dealing-cards');
  els['result-modal'].classList.remove('victory-preview');
  gameReady = false;
  currentBonusMatch = false;
  pendingSeven = null;
  isPeekingHand = false;
  els['suit-return-bar'].classList.add('hidden');
  els['bonus-match-badge'].classList.add('hidden');
  els['game-screen'].classList.remove('suit-peek-active');
  closeModal('suit-picker');
  closeModal('result-modal');
  els['game-screen'].classList.add('hidden');
  els['home-screen'].classList.remove('hidden');
  updateRecord();
}

function playerPlay(cardId) {
  if (!gameReady || drawAnimating || cardAnimating || game.currentPlayer !== 0 || game.winner !== null) return;
  if (pendingSeven) {
    showToast('먼저 7의 무늬를 선택하거나 내기를 취소해 주세요');
    return;
  }
  const card = game.hands[0].find((item) => item.id === cardId);
  if (!card || !game.isPlayable(card)) {
    playSound('error');
    showToast(game.attackCount
      ? game.topCard.rank === 'JOKER' ? '조커 공격은 조커로만 막을 수 있어요' : '2, A, 조커로 막거나 카드를 뽑아야 해요'
      : '같은 무늬나 숫자의 카드를 골라주세요');
    return;
  }
  if (card.rank === '7') {
    pendingSeven = cardId;
    isPeekingHand = false;
    renderPlayerHand();
    openModal('suit-picker');
    return;
  }
  applyPlayerCard(cardId);
}

function finishSeven(suit) {
  if (!pendingSeven) return;
  closeModal('suit-picker');
  const cardId = pendingSeven;
  pendingSeven = null;
  isPeekingHand = false;
  els['suit-return-bar'].classList.add('hidden');
  els['game-screen'].classList.remove('suit-peek-active');
  applyPlayerCard(cardId, suit);
}

function peekAtHand() {
  if (!pendingSeven) return;
  isPeekingHand = true;
  closeModal('suit-picker');
  els['suit-return-bar'].classList.remove('hidden');
  els['game-screen'].classList.add('suit-peek-active');
  renderPlayerHand();
  setTimeout(() => els['return-to-suit-button'].focus(), 190);
}

function returnToSuitPicker() {
  if (!pendingSeven) return;
  isPeekingHand = false;
  els['suit-return-bar'].classList.add('hidden');
  els['game-screen'].classList.remove('suit-peek-active');
  openModal('suit-picker');
}

function cancelSevenSelection() {
  pendingSeven = null;
  isPeekingHand = false;
  els['suit-return-bar'].classList.add('hidden');
  els['game-screen'].classList.remove('suit-peek-active');
  closeModal('suit-picker');
  renderPlayerHand();
  showToast('7 내기를 취소했어요');
}

async function applyPlayerCard(cardId, suit = null) {
  if (cardAnimating) return;
  cardAnimating = true;
  clearTimeout(oneCardEffectTimer);
  effects.clear();
  const source = els['player-hand'].querySelector(`[data-card-id="${cardId}"]`);
  await animateCardToPile({ source, target: els['discard-pile'] });
  if (!gameReady || game.currentPlayer !== 0 || !game.hands[0].some((card) => card.id === cardId)) {
    cardAnimating = false;
    return;
  }
  const result = game.playCard(0, cardId, suit);
  moves += 1;
  handleMissionEvents(missionEventsForCard(result.card, { idPrefix: `${currentMatchId}:player:${moves}:${result.card.id}` }));
  playSound(result.card.rank === 'JOKER' ? 'joker' : ['2', 'A', 'J', '7'].includes(result.card.rank) ? 'action' : 'card');
  cardAnimating = false;
  render();
  if (result.type === 'win') return endGame(0);
  const hasSpecialEffect = announceSpecial(result);
  announceOneCardIfNeeded(0, hasSpecialEffect ? 2200 : 0);
  reactToCard(result, false);
  if (game.currentPlayer === 1) scheduleAiTurn();
}

async function playerDraw() {
  if (!gameReady || drawAnimating || cardAnimating || game.currentPlayer !== 0 || game.winner !== null) return;
  drawAnimating = true;
  clearTimeout(oneCardEffectTimer);
  effects.clear();
  const result = game.drawCards(0);
  handleMissionEvents([{ id: `${currentMatchId}:draw:${Date.now()}`, type: 'draw-card', amount: result.cards.length || 1 }]);
  playSound('draw');
  await showDrawReveal(result.cards, result.wasPenalty);
  render();
  if (result.wasPenalty) {
    effects.play('impact', { symbol: `+${result.count}`, title: `${result.count}장 받기!`, subtitle: '공격을 막지 못했어요' });
    maybeAiReact('player-penalty');
  } else {
    showToast('카드 1장을 뽑았어요');
  }
  refreshOneCardFlags();
  drawAnimating = false;
  scheduleAiTurn();
}

function scheduleAiTurn() {
  clearTimeout(aiTimer);
  if (!gameReady || game.currentPlayer !== 1 || game.winner !== null) return;
  render();
  aiTimer = setTimeout(runAiTurn, DIFFICULTIES[difficulty].delay);
}

async function runAiTurn() {
  if (!gameReady || game.currentPlayer !== 1 || game.winner !== null) return;
  clearTimeout(oneCardEffectTimer);
  effects.clear();
  const move = chooseAiMove(game, difficulty);
  if (move.type === 'draw') {
    const result = game.drawCards(1);
    playSound('draw');
    if (result.wasPenalty) {
      effects.play('impact', { symbol: `+${result.count}`, title: `${result.count}장 받기!`, subtitle: `${DIFFICULTIES[difficulty].name}가 공격을 받았어요` });
      maybeAiReact('ai-penalty');
    } else {
      showToast('상대가 카드 1장을 뽑았어요');
    }
    refreshOneCardFlags();
  } else {
    cardAnimating = true;
    const aiCard = game.hands[1].find((card) => card.id === move.cardId);
    const source = els['ai-hand'].lastElementChild;
    await animateCardToPile({
      source,
      target: els['discard-pile'],
      cardFace: createCardElement(aiCard, false),
      fromOpponent: true,
    });
    if (!gameReady || game.currentPlayer !== 1 || !game.hands[1].some((card) => card.id === move.cardId)) {
      cardAnimating = false;
      return;
    }
    const result = game.playCard(1, move.cardId, move.chosenSuit);
    playSound(result.card.rank === 'JOKER' ? 'joker' : ['2', 'A', 'J', '7'].includes(result.card.rank) ? 'action' : 'card');
    cardAnimating = false;
    if (result.type === 'win') { render(); return endGame(1); }
    const hasSpecialEffect = announceSpecial(result, true);
    announceOneCardIfNeeded(1, hasSpecialEffect ? 2200 : 0);
    reactToCard(result, true);
  }
  render();
  if (game.currentPlayer === 1) scheduleAiTurn();
}

function announceSpecial(result, isAi = false) {
  clearTimeout(oneCardEffectTimer);
  const owner = isAi ? '상대가' : '내가';
  const notices = {
    '2': { type: 'attack', symbol: '+2', title: '+2 공격!', subtitle: `${owner} 공격을 이어갑니다` },
    A: { type: 'attack', symbol: '+3', title: '+3 공격!', subtitle: `${owner} 강한 공격을 보냈어요` },
    J: { type: 'skip', symbol: '≫', title: '턴 스킵!', subtitle: `${owner} 상대 턴을 건너뜁니다` },
    '7': { type: 'suit', symbol: SUIT_SYMBOLS[result.requestedSuit], title: `${suitName(result.requestedSuit)}로 변경!`, subtitle: `${owner} 무늬를 바꿨어요` },
    JOKER: { type: 'joker', symbol: '★', title: 'JOKER +5', subtitle: `${owner} 무시무시한 조커 공격을 보냈어요` },
  };
  const notice = notices[result.card.rank];
  if (notice) effects.play(notice.type, notice);
  return Boolean(notice);
}

function announceOneCardIfNeeded(player, delay = 0) {
  if (game.hands[player].length !== 1 || oneCardAnnounced[player]) return;
  oneCardAnnounced[player] = true;
  if (player === 0) {
    const lastCard = game.hands[player][0];
    handleMissionEvents([{ id: `${currentMatchId}:onecard:${moves}:${lastCard?.id || 'last'}`, type: 'one-card' }]);
  }
  const owner = player === 0 ? '내 손에 마지막 한 장!' : `${DIFFICULTIES[difficulty].name}도 단 한 장!`;
  const showEffect = () => {
    effects.play('onecard', { symbol: '1', title: 'ONE CARD!', subtitle: owner, particleCount: 32 });
    playSound('onecard');
    els['game-table'].classList.add('one-card-pulse');
    setTimeout(() => els['game-table'].classList.remove('one-card-pulse'), 1500);
  };
  if (delay) oneCardEffectTimer = setTimeout(showEffect, delay);
  else showEffect();
}

function refreshOneCardFlags() {
  game.hands.forEach((hand, player) => {
    if (hand.length !== 1) oneCardAnnounced[player] = false;
  });
}

function render() {
  renderOpponent();
  renderPlayerHand();
  renderTopCard();
  const playerTurn = gameReady && game.currentPlayer === 0;
  els['game-table'].classList.toggle('ai-turn', !playerTurn);
  els['turn-banner'].textContent = !gameReady ? '주사위로 선공을 정하는 중' : playerTurn ? '내 차례예요' : `${DIFFICULTIES[difficulty].name}의 차례`;
  els['player-status'].textContent = !gameReady
    ? '선공 결정 후 카드를 낼 수 있어요'
    : playerTurn ? game.attackCount ? '공격을 막거나 카드를 뽑으세요' : game.freePlay ? '아무 카드나 한 장 낼 수 있어요' : '낼 카드를 선택하세요'
      : '상대의 선택을 기다리는 중';
  els['action-hint'].textContent = game.attackCount
    ? game.topCard.rank === 'JOKER'
      ? `조커 공격이 ${game.attackCount}장 누적됐어요 · 조커로만 방어할 수 있어요`
      : `공격이 ${game.attackCount}장 누적됐어요 · 2, A, 조커로 방어하세요`
    : game.freePlay ? '조커 보너스 · 이번 턴에는 아무 카드나 낼 수 있어요'
      : `${suitName(game.activeSuit)} 또는 ${game.topCard.rank} 카드를 낼 수 있어요`;
  els['deck-count'].textContent = game.drawPile.length;
  els['draw-pile'].disabled = !playerTurn || drawAnimating || game.winner !== null;
  els['attack-badge'].classList.toggle('hidden', game.attackCount === 0);
  els['attack-badge'].querySelector('b').textContent = game.attackCount;
  els['bonus-match-badge'].classList.toggle('hidden', !currentBonusMatch);
}

function renderOpponent() {
  els['ai-card-count'].textContent = game.hands[1].length;
  els['ai-hand'].setAttribute('aria-label', `상대방 카드 ${game.hands[1].length}장`);
  els['ai-hand'].replaceChildren();
  game.hands[1].forEach((_, index) => {
    const card = document.createElement('div');
    card.className = 'mini-back card-back';
    card.style.setProperty('--i', index);
    card.style.setProperty('--count', game.hands[1].length);
    card.innerHTML = '<span class="back-logo">ONE<b>!</b></span>';
    els['ai-hand'].append(card);
  });
}

function renderPlayerHand() {
  els['player-card-count'].textContent = game.hands[0].length;
  els['player-hand'].replaceChildren();
  const playerTurn = gameReady && game.currentPlayer === 0;
  game.hands[0].forEach((card) => {
    const button = createCardElement(card, true);
    const playable = playerTurn && game.isPlayable(card);
    button.classList.toggle('playable', playable);
    button.classList.toggle('not-playable', playerTurn && !playable);
    button.classList.toggle('pending-wild', card.id === pendingSeven);
    button.disabled = !playerTurn || cardAnimating || Boolean(pendingSeven);
    button.addEventListener('click', () => playerPlay(card.id));
    els['player-hand'].append(button);
  });
  scheduleHandLayout();
}

function renderTopCard() {
  const card = game.topCard;
  const current = createCardElement(card, false);
  els['discard-pile'].className = `${current.className} discard-card history-trigger`;
  els['discard-pile'].replaceChildren(...current.childNodes);
  applyDiscardFaceSkin();
  els['discard-pile'].setAttribute('aria-label', `현재 카드 ${suitName(card.suit)} ${card.rank}, 낸 카드 기록 보기`);
  els['discard-pile'].dataset.historyCount = String(game.history.length);
  const changed = Boolean(game.requestedSuit);
  els['active-suit'].classList.toggle('hidden', !changed);
  els['active-suit'].classList.toggle('red', ['hearts', 'diamonds'].includes(game.requestedSuit));
  els['active-suit'].textContent = changed ? SUIT_SYMBOLS[game.requestedSuit] : '';
}

function scheduleHandLayout() {
  cancelAnimationFrame(handLayoutFrame);
  handLayoutFrame = requestAnimationFrame(updateHandLayout);
}

function updateHandLayout() {
  const hand = els['player-hand'];
  const cards = [...hand.children];
  if (!cards.length || hand.clientWidth === 0) return;

  const cardWidth = cards[0].getBoundingClientRect().width;
  const style = getComputedStyle(hand);
  const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const { step, contentWidth, scrolls } = calculateHandLayout({
    containerWidth: hand.clientWidth,
    horizontalPadding,
    cardWidth,
    cardCount: cards.length,
    compact: window.innerWidth <= 760,
  });

  hand.style.setProperty('--hand-step', `${step}px`);
  hand.classList.toggle('hand-scrolls', scrolls);
  hand.classList.toggle('hand-centered', !scrolls);
  const compact = window.innerWidth <= 760;
  hand.classList.toggle('fan-hand', compact);
  cards.forEach((card, index) => {
    const { angle, hoverAngle, y } = calculateFanTransform({ index, cardCount: cards.length, compact });
    card.style.setProperty('--fan-rotate', `${angle}deg`);
    card.style.setProperty('--fan-hover-rotate', `${hoverAngle}deg`);
    card.style.setProperty('--fan-y', `${y}px`);
    card.style.zIndex = String(index + 1);
  });
}

function openHistory() {
  clearTimeout(aiTimer);
  renderHistory();
  openModal('history-modal');
}

function renderHistory() {
  els['history-list'].replaceChildren();
  [...game.history].reverse().forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = `history-row ${entry.player === 0 ? 'mine' : entry.player === 1 ? 'theirs' : 'initial'}`;

    const miniCard = createCardElement(entry.card, false);
    miniCard.classList.add('history-mini-card');

    const copy = document.createElement('div');
    const title = document.createElement('strong');
    const detail = document.createElement('small');
    title.textContent = entry.player === null ? '시작 카드' : entry.player === 0 ? '내가 낸 카드' : `${DIFFICULTIES[difficulty].name}가 낸 카드`;
    const suitChange = entry.requestedSuit
      ? entry.card.rank === 'JOKER' ? ` · ${suitName(entry.requestedSuit)} 유지` : ` · ${suitName(entry.requestedSuit)}로 변경`
      : '';
    detail.textContent = `${suitName(entry.card.suit)} ${entry.card.rank}${suitChange}`;
    copy.append(title, detail);

    const order = document.createElement('span');
    order.className = 'history-order';
    order.textContent = index === 0 ? '최근' : entry.turn ? `${entry.turn}턴` : '시작';
    row.append(miniCard, copy, order);
    els['history-list'].append(row);
  });
}

function playWithToy(button) {
  const baseToy = button.dataset.toy;
  const toy = activeToyKey(baseToy);
  const lines = TOY_LINES[toy];
  const count = Number(button.dataset.playCount || 0);
  button.dataset.playCount = String(count + 1);
  button.querySelector('.toy-bubble').textContent = lines[count % lines.length];
  button.classList.remove('is-playing');
  void button.offsetWidth;
  button.classList.add('is-playing');
  playSound(`toy-${toy}`);
  burstToyParticles(button, toy);
  setTimeout(() => button.classList.remove('is-playing'), TOY_PLAY_DURATIONS[toy] || 850);
}

function activeToyKey(baseToy) {
  const variant = TOY_VARIANTS.find((item) => item.base === baseToy && document.body.classList.contains(item.cssClass));
  return variant?.key || baseToy;
}

function burstToyParticles(button, toy) {
  button.querySelector('.toy-particles')?.remove();
  const burst = document.createElement('span');
  burst.className = `toy-particles toy-particles-${toy}`;
  const particleCount = TOY_PARTICLE_COUNTS[toy] || 10;
  const spread = TOY_PARTICLE_SPREADS[toy] || 1;
  for (let index = 0; index < particleCount; index += 1) {
    const spark = document.createElement('i');
    const angle = (Math.PI * 2 * index) / particleCount;
    const distance = (28 + (index % 3) * 8 + (TOY_PARTICLE_COUNTS[toy] ? 8 : 0)) * spread;
    spark.style.setProperty('--toy-px', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--toy-py', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--toy-delay', `${(index % 4) * 25}ms`);
    burst.append(spark);
  }
  button.append(burst);
  setTimeout(() => burst.remove(), TOY_PLAY_DURATIONS[toy] || 850);
}

function createCardElement(card, interactive) {
  const element = document.createElement(interactive ? 'button' : 'div');
  const isJoker = card.rank === 'JOKER';
  element.className = `playing-card ${['hearts', 'diamonds'].includes(card.suit) ? 'red-card' : ''} ${isJoker ? 'joker-card' : ''}`;
  if (interactive) {
    element.type = 'button';
    element.dataset.cardId = card.id;
    element.setAttribute('aria-label', isJoker ? '조커 공격 +5' : `${suitName(card.suit)} ${card.rank}`);
  }
  const top = document.createElement('span');
  top.className = 'card-corner top';
  top.innerHTML = `<b>${isJoker ? 'JOKER' : card.rank}</b><i>${SUIT_SYMBOLS[card.suit]}</i>`;
  const center = createCardCenter(card, SUIT_SYMBOLS[card.suit]);
  const bottom = top.cloneNode(true);
  bottom.classList.replace('top', 'bottom');
  element.append(top, center, bottom);
  return element;
}

function endGame(winner) {
  clearInterval(timerId);
  clearTimeout(aiTimer);
  clearTimeout(oneCardEffectTimer);
  const won = winner === 0;
  els['result-modal'].classList.toggle('victory-earned', won);
  maybeAiReact(won ? 'player-win' : 'ai-win', { force: true, delay: 260 });
  playSound(won ? 'win' : 'lose');
  els['result-icon'].textContent = won ? '✦' : '↻';
  els['result-kicker'].textContent = won ? 'NICE PLAY' : 'GOOD TRY';
  els['result-title'].textContent = won ? '당신의 승리!' : `${DIFFICULTIES[difficulty].name}의 승리`;
  els['result-description'].textContent = won ? victoryMessage() : '흐름을 다시 읽으면 다음 판은 달라질 거예요.';
  const baseReward = rewardForStars(DIFFICULTIES[difficulty].stars);
  const displayedReward = currentBonusMatch ? baseReward * 2 : baseReward;
  els['result-opponent-meta'].textContent = `${starsText(DIFFICULTIES[difficulty].stars)} ${DIFFICULTIES[difficulty].name} · 승리 시 +${displayedReward}점`;
  els['result-time'].textContent = formatTime(Date.now() - startedAt);
  els['result-moves'].textContent = `${moves}장`;
  lastRatingResult = recordMatchResult({
    won,
    opponentStars: DIFFICULTIES[difficulty].stars,
    mode: 'ai',
    matchId: currentMatchId,
    bonusMultiplier: currentBonusMatch ? 2 : 1,
  });
  scheduleAccountSync();
  playerProfile = lastRatingResult.profile;
  const missionResult = lastRatingResult.duplicate
    ? { completedMissions: [], rewardDelta: 0, unlockedItems: [] }
    : handleMissionEvents(aiResultMissionEvents(won), { resultElementId: 'result-mission-summary', suppressToast: true });
  if (lastRatingResult.duplicate) renderMissionSummary(missionResult, 'result-mission-summary');
  if (missionResult.profile) playerProfile = missionResult.profile;
  renderBonusResultSummary(won, lastRatingResult, 'result-bonus-summary');
  els['result-points-delta'].textContent = `${lastRatingResult.delta > 0 ? '+' : ''}${lastRatingResult.delta}점`;
  els['result-points-delta'].classList.toggle('lost', lastRatingResult.delta < 0);
  els['result-current-points'].textContent = `현재 ${playerProfile.points.toLocaleString('ko-KR')}점 · ${starsText(ratingProgress(playerProfile.points).stars)}`;
  renderResultUnlocks(mergeUnlockedItems(lastRatingResult.unlockedItems || [], pendingMissionUnlocks, missionResult.unlockedItems || []));
  showResultModal(won);
}

function showResultModal(won) {
  clearTimeout(resultRevealTimer);
  const modal = els['result-modal'];
  modal.classList.remove('victory-preview');
  if (won) {
    modal.classList.add('victory-preview');
    openModal('result-modal');
    resultRevealTimer = setTimeout(() => {
      modal.classList.remove('victory-preview');
      setTimeout(() => els['match-again-button'].focus(), 0);
    }, VICTORY_RESULT_REVEAL_DELAY_MS);
    return;
  }
  resultRevealTimer = setTimeout(() => {
    openModal('result-modal');
    setTimeout(() => els['match-again-button'].focus(), 0);
  }, 1150);
}

function renderResultUnlocks(unlockedItems) {
  const unlock = els['result-unlock'];
  unlock.classList.toggle('hidden', unlockedItems.length === 0);
  unlock.classList.toggle('result-unlock-celebration', unlockedItems.length > 0);
  if (unlockedItems.length) {
    const names = unlockedItems.slice(0, 3).map((item) => `${item.icon} ${item.name}`).join(' · ');
    els['result-unlock-title'].textContent = unlockedItems.length >= 5 ? '꿈빛 왕국 풀 세트 해금!' : '새 꾸미기 해금!';
    els['result-unlock-copy'].textContent = `${names}${unlockedItems.length > 3 ? ` 외 ${unlockedItems.length - 3}개` : ''}`;
  }
  const next = nextCosmeticUnlock(playerProfile.peakPoints);
  els['result-next-unlock'].classList.toggle('hidden', !next);
  if (next) {
    els['result-next-unlock-name'].textContent = `다음 보상 · ${next.items[0].name}`;
    els['result-next-unlock-remaining'].textContent = `${next.remaining.toLocaleString('ko-KR')}점 남음`;
  }
}

function renderBonusResultSummary(won, ratingResult, elementId) {
  const element = els[elementId];
  const bonus = (ratingResult?.bonusMultiplier || 1) > 1;
  element.classList.toggle('hidden', !bonus);
  if (!bonus) return;
  element.textContent = won
    ? `BONUS MATCH · 기본 +${ratingResult.baseDelta}점 ×${ratingResult.bonusMultiplier} = +${ratingResult.delta}점`
    : 'BONUS MATCH · 패배는 추가 차감 없이 -50점만 적용돼요';
}

function handleMissionEvents(events, { resultElementId = null, suppressToast = false } = {}) {
  const missionResult = applyMissionEvents(events);
  if (missionResult.profile) {
    playerProfile = missionResult.profile;
    applyEquippedCosmetics();
  }
  pendingMissionUnlocks = mergeUnlockedItems(pendingMissionUnlocks, missionResult.unlockedItems || []);
  scheduleAccountSync();
  renderMissionPanel();
  if (resultElementId) renderMissionSummary(missionResult, resultElementId);
  if (missionResult.rewardDelta > 0 && !suppressToast) {
    showToast(`미션 완료! +${missionResult.rewardDelta.toLocaleString('ko-KR')}점`);
  }
  return missionResult;
}

function renderMissionPanel() {
  if (!els['daily-missions-list'] || !els['weekly-missions-list']) return;
  const dashboard = loadMissionDashboard();
  renderMissionList(els['daily-missions-list'], dashboard.daily.missions);
  renderMissionList(els['weekly-missions-list'], dashboard.weekly.missions);
  if (els['daily-missions-count']) els['daily-missions-count'].textContent = `${dashboard.daily.completedCount}/${dashboard.daily.total}`;
  if (els['weekly-missions-count']) els['weekly-missions-count'].textContent = `${dashboard.weekly.completedCount}/${dashboard.weekly.total}`;
}

function renderMissionList(container, missions) {
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

function renderMissionSummary(missionResult, elementId) {
  const element = els[elementId];
  if (!element) return;
  const completed = missionResult?.completedMissions || [];
  element.classList.toggle('hidden', completed.length === 0);
  if (!completed.length) return;
  const names = completed.slice(0, 3).map((mission) => mission.title).join(' · ');
  element.innerHTML = `<strong>미션 보상 +${missionResult.rewardDelta.toLocaleString('ko-KR')}점</strong><small>${names}${completed.length > 3 ? ` 외 ${completed.length - 3}개` : ''}</small>`;
}

function aiResultMissionEvents(won) {
  const stars = DIFFICULTIES[difficulty].stars;
  const prefix = `${currentMatchId}:result`;
  return [
    { id: `${prefix}:game`, type: 'game', mode: 'ai', bonus: currentBonusMatch },
    ...(won ? [{ id: `${prefix}:win`, type: 'win', mode: 'ai', opponentStars: stars, bonus: currentBonusMatch }] : []),
    ...(currentBonusMatch ? [{ id: `${prefix}:bonus-match`, type: 'bonus-match', mode: 'ai' }] : []),
    ...(currentBonusMatch && won ? [{ id: `${prefix}:bonus-win`, type: 'bonus-win', mode: 'ai', opponentStars: stars }] : []),
  ];
}

function victoryMessage() {
  if (DIFFICULTIES[difficulty].stars >= 4) return `${DIFFICULTIES[difficulty].name}의 계산을 멋지게 넘어섰어요.`;
  if (moves <= 8) return '군더더기 없는 빠른 승리였어요.';
  return '마지막까지 흐름을 놓치지 않았네요.';
}

function scheduleAccountSync(delay = 700) {
  queueAccountProfileSync({
    delay,
    onComplete: handleAccountSyncComplete,
    onError: (error) => renderAccountSyncState({ status: 'error', error }),
  });
}

function handleAccountSyncComplete(result) {
  if (result?.profile) {
    playerProfile = result.profile;
    applyEquippedCosmetics();
    renderMissionPanel();
  }
  if (result && !result.skipped) renderAccountSyncState(result);
}

async function refreshAccountSync(options = {}) {
  const manual = options?.type === 'click' || options.manual;
  renderAccountSyncState({ status: 'checking' });
  try {
    const result = await syncAccountProfile();
    if (result.profile) {
      playerProfile = result.profile;
      updateRecord();
    }
    const state = await getAccountSyncState();
    renderAccountSyncState({ ...state, lastSyncedAt: result.lastSyncedAt });
    if (manual && result.status !== 'local') showToast('기록 동기화 완료!');
  } catch (error) {
    renderAccountSyncState({ status: 'error', error });
    if (manual) showToast(friendlyAccountSyncError(error));
  }
}

function renderAccountSyncState(state = {}) {
  const card = els['account-sync-card'];
  if (!card) return;
  const status = state.status || 'local';
  const email = state.email || state.pendingEmail || '';
  const previousAccountStatus = currentAccountSyncState.status;
  currentAccountSyncState = { ...state, status, email };
  const messages = {
    checking: {
      label: '기록 상태 확인 중',
      title: '기록 보호 확인 중',
      copy: 'Supabase 연결 상태를 확인하고 있어요.',
    },
    local: {
      label: '브라우저에만 저장 중',
      title: '기록 보호',
      copy: '지금 기록은 이 브라우저에 먼저 저장돼요. 이메일을 연결하면 브라우저를 바꿔도 점수와 꾸밈을 다시 불러올 수 있어요.',
    },
    guest: {
      label: '게스트 기록 저장 중',
      title: '게스트 저장 활성화',
      copy: email
        ? `${email} 인증 메일을 확인하면 이 기록이 이메일 계정으로 보호돼요.`
        : 'Supabase에 게스트 기록을 저장 중이에요. 브라우저 데이터를 지우면 다시 찾기 어려우니 이메일 연결을 추천해요.',
    },
    email: {
      label: '이메일로 기록 보호 중',
      title: '기록 보호 완료',
      copy: `${email || '연결된 이메일'} 계정으로 점수, 미션, 꾸밈을 조용히 동기화하고 있어요.`,
    },
    'not-configured': {
      label: 'Supabase 설정 필요',
      title: '기록 보호 준비 필요',
      copy: 'Supabase 공개 설정 또는 프로필 저장 SQL이 필요해요.',
    },
    error: {
      label: '동기화 확인 필요',
      title: '기록 보호 확인 필요',
      copy: friendlyAccountSyncError(state.error),
    },
  };
  const message = messages[status] || messages.local;
  const cardStatus = status === 'checking' && previousAccountStatus === 'email' ? 'email' : status;
  card.dataset.accountStatus = cardStatus;
  card.classList.toggle('syncing', status === 'checking');
  updateAccountProfileButton(status, email);
  els['account-sync-state'].textContent = message.label;
  els['account-sync-title'].textContent = message.title;
  els['account-sync-copy'].textContent = message.copy;
  if (els['account-connect-button']) {
    els['account-connect-button'].textContent = status === 'email' ? '관리' : '이메일로 기록 연결';
  }
  if (els['account-refresh-button']) els['account-refresh-button'].disabled = status === 'checking';
  renderAccountModalMode(cardStatus === 'email' ? 'email' : status, email);
}

function updateAccountProfileButton(status, email = '') {
  const button = els['account-profile-button'];
  if (!button) return;
  button.dataset.accountStatus = status;
  button.classList.toggle('syncing', status === 'checking');
  const labels = {
    checking: '확인 중',
    local: '기록',
    guest: '게스트',
    email: '보호됨',
    'not-configured': '설정',
    error: '확인',
  };
  els['account-profile-icon'].textContent = status === 'email' ? '✅' : status === 'guest' ? '👤' : status === 'checking' ? '⏳' : '👤';
  els['account-profile-label'].textContent = labels[status] || '기록';
  button.setAttribute('aria-label', status === 'email'
    ? `${email || '이메일'} 기록 계정 관리`
    : '이메일로 기록 연결');
}

function renderAccountModalMode(status = currentAccountSyncState.status, email = currentAccountSyncState.email || '') {
  const connected = status === 'email';
  const summary = els['account-modal-summary'];
  const emailField = document.querySelector('.account-email-field');
  const options = document.querySelector('.account-modal-options');
  summary?.classList.toggle('hidden', !connected);
  emailField?.classList.toggle('hidden', connected);
  options?.classList.toggle('hidden', connected);
  if (connected) {
    els['account-modal-title'].textContent = '기록 보호 완료';
    if (els['account-modal-summary-title']) els['account-modal-summary-title'].textContent = email ? `${email}로 보호 중` : '이메일로 보호 중';
    if (els['account-modal-summary-copy']) els['account-modal-summary-copy'].textContent = '점수, 승수, 판수, 꾸밈, 미션을 조용히 동기화하고 있어요.';
    if (els['account-modal-sync-button']) els['account-modal-sync-button'].disabled = status === 'checking';
  } else {
    els['account-modal-title'].textContent = '이메일로 기록 연결';
    if (els['account-modal-sync-button']) els['account-modal-sync-button'].disabled = status === 'checking';
  }
}

function openAccountModal() {
  const email = els['account-email-input']?.value || '';
  if (!email && els['account-sync-card']?.dataset.accountStatus === 'email') {
    els['account-email-input'].placeholder = '이미 이메일로 보호 중이에요';
  }
  renderAccountModalMode(currentAccountSyncState.status, currentAccountSyncState.email || '');
  setAccountModalStatus(currentAccountSyncState.status === 'email'
    ? '이 브라우저에서도 조용히 동기화하고 있어요.'
    : '이메일을 입력하고 “이메일로 기록 연결”을 누르면 현재 기록 보호 또는 기존 기록 불러오기를 자동으로 처리해요.');
  openModal('account-modal');
}

function accountEmailValue() {
  return String(els['account-email-input']?.value || '').trim();
}

async function connectAccountEmail() {
  setAccountModalBusy(true, '이메일 기록 연결을 준비하고 있어요...');
  try {
    const result = await requestEmailRecordLink(accountEmailValue());
    if (result.status === 'already-connected') {
      setAccountModalStatus(`${result.email} 계정으로 이미 연결되어 있어요. 기록을 한 번 더 동기화했어요.`);
      showToast('이미 연결된 계정이에요!');
    } else if (result.status === 'magic-link-sent') {
      setAccountModalStatus(`${result.email}로 로그인 메일을 보냈어요. 링크를 열면 저장된 기록을 이 브라우저로 불러와 합쳐요.`);
      showToast('기록 불러오기 메일을 보냈어요!');
    } else {
      setAccountModalStatus(`${result.email}로 인증 메일을 보냈어요. 링크를 열면 이 기록이 이메일 계정으로 보호돼요.`);
      showToast('기록 연결 메일을 보냈어요!');
    }
    await refreshAccountSync({ manual: false });
  } catch (error) {
    setAccountModalStatus(friendlyAccountSyncError(error), true);
  } finally {
    setAccountModalBusy(false);
  }
}

function setAccountModalBusy(busy, message = '') {
  ['account-link-email-button'].forEach((id) => {
    if (els[id]) els[id].disabled = busy;
  });
  if (message) setAccountModalStatus(message);
}

function setAccountModalStatus(message, error = false) {
  if (!els['account-modal-status']) return;
  els['account-modal-status'].textContent = message;
  els['account-modal-status'].classList.toggle('error', error);
}

function updateRecord() {
  playerProfile = loadPlayerProfile();
  const progress = ratingProgress(playerProfile.points);
  els['record-summary'].textContent = playerProfile.games
    ? `누적 ${playerProfile.wins}승 · ${playerProfile.games}게임`
    : '첫 승리에 도전해 보세요';
  els['home-rating-points'].textContent = `${playerProfile.points.toLocaleString('ko-KR')}점`;
  els['home-rating-stars'].textContent = starsText(progress.stars);
  els['home-rating-fill'].style.width = `${Math.round(progress.ratio * 100)}%`;
  els['home-rating-next'].textContent = progress.target
    ? `다음 등급까지 ${progress.remaining.toLocaleString('ko-KR')}점`
    : '최고 점수 구간에 도달했어요';
  const next = nextCosmeticUnlock(playerProfile.peakPoints);
  els['home-next-unlock'].textContent = next
    ? `다음 보상 · ${next.items[0].name} (${next.remaining.toLocaleString('ko-KR')}점)`
    : '모든 꾸미기 해금 완료';
  applyEquippedCosmetics();
  renderMissionPanel();
}

function updateTimer() {
  els['round-timer'].textContent = startedAt ? formatTime(Date.now() - startedAt) : '00:00';
}

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function suitName(suit) {
  return { hearts: '하트', diamonds: '다이아', spades: '스페이드', clubs: '클로버', joker: '조커' }[suit] || '';
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  requestAnimationFrame(() => els.toast.classList.add('show'));
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('show');
    setTimeout(() => els.toast.classList.add('hidden'), 220);
  }, 2200);
}

function openModal(id) {
  const modal = els[id];
  if (!modal) return;
  modal.classList.remove('hidden');
  requestAnimationFrame(() => modal.classList.add('open'));
  modal.querySelector('button')?.focus();
}

function closeModal(id) {
  const modal = els[id];
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.classList.add('hidden'), 180);
  if (id === 'history-modal' && game.currentPlayer === 1 && game.winner === null) {
    setTimeout(scheduleAiTurn, 190);
  }
}

function updateSoundButtons() {
  document.querySelectorAll('.sound-button').forEach((button) => {
    button.textContent = isSoundEnabled() ? '♪' : '×';
    button.classList.toggle('muted', !isSoundEnabled());
    button.setAttribute('aria-label', isSoundEnabled() ? '소리 끄기' : '소리 켜기');
  });
}

updateSoundButtons();
updateRecord();
refreshAccountSync({ manual: false });
