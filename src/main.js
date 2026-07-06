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
  savePlayerProfile,
  selectAiOpponent,
  starsText,
} from './2026-07-05-rating.js';
import {
  COSMETICS,
  COSMETIC_SLOTS,
  cosmeticById,
  cosmeticsForSlot,
  equippedClassNames,
  nextCosmeticUnlock,
} from './2026-07-06-cosmetics.js';

const DIFFICULTIES = Object.fromEntries(AI_OPPONENTS.map((opponent) => [opponent.key, opponent]));

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map((element) => [element.id, element]));
const game = new OneCardGame();
let difficulty = 'star3';
let playerProfile = loadPlayerProfile();
let currentMatchId = '';
let lastRatingResult = null;
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

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const TOY_LINES = {
  jelly: ['말랑!', '뿌잉!', '또 눌러줘!'],
  star: ['빙글!', '반짝!', '슈웅!'],
  rose: ['향긋!', '사랑을 담아!', '장미 파워!'],
};

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
  const weights = matchmakingWeights(playerProfile.points);
  els['matching-kicker'].textContent = 'AI MATCHING';
  els['matching-points'].textContent = `${playerProfile.points.toLocaleString('ko-KR')}점`;
  els['matching-probability'].textContent = weights
    .map((weight, index) => weight ? `${index + 1}성 ${weight}%` : '')
    .filter(Boolean)
    .join(' · ');
  els['matching-result'].classList.remove('decided');
  openModal('matching-modal');
  playSound('card');

  const sequence = Array.from({ length: 16 }, (_, index) => AI_OPPONENTS[(index + Math.floor(Math.random() * 5)) % 5]);
  sequence.push(opponent);
  for (let index = 0; index < sequence.length; index += 1) {
    const candidate = sequence[index];
    els['matching-icon'].textContent = candidate.icon;
    els['matching-name'].textContent = candidate.name;
    els['matching-stars'].textContent = starsText(candidate.stars);
    els['matching-reward'].textContent = `승리 +${rewardForStars(candidate.stars)}점`;
    els['matching-result'].classList.remove('tick');
    void els['matching-result'].offsetWidth;
    els['matching-result'].classList.add('tick');
    playSound('card');
    const progress = index / (sequence.length - 1);
    await wait(50 + Math.round(progress ** 3 * 260));
  }

  els['matching-result'].classList.add('decided');
  els['matching-kicker'].textContent = '상대 결정!';
  playerProfile = rememberAiOpponent(playerProfile, opponent.stars);
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
  if (!playerFirst) setTimeout(scheduleAiTurn, 2150);
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

function renderCosmeticsModal() {
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
    ? [...COSMETICS].sort((a, b) => a.threshold - b.threshold || a.slot.localeCompare(b.slot))
    : cosmeticsForSlot(activeCosmeticSlot);
  visibleItems.forEach((item) => {
    const unlocked = item.threshold <= peak;
    const equipped = playerProfile.equipped?.[item.slot] === item.id;
    const selected = previewCosmeticId === item.id;
    const slotName = COSMETIC_SLOTS.find((slot) => slot.key === item.slot)?.name || item.slot;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `cosmetic-item ${equipped ? 'equipped' : ''} ${selected ? 'selected' : ''} ${unlocked ? '' : 'locked'} ${item.legendary ? 'legendary' : ''}`;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${item.name} 미리보기${unlocked ? '' : `, ${item.threshold}점에 해금`}`);
    button.innerHTML = `<span class="cosmetic-item-meta"><em>${slotName}</em>${item.concept ? `<i>${item.concept}</i>` : ''}</span><span class="cosmetic-item-icon">${item.icon}</span><strong>${item.name}</strong><small>${item.description}</small><b>${equipped ? '장착 중' : unlocked ? '미리보기' : `미리보기 · ${item.threshold.toLocaleString('ko-KR')}점`}</b>`;
    button.addEventListener('click', () => {
      previewCosmeticId = item.id;
      cosmeticPreviewMode = item.slot === 'effect' ? 'effect' : item.slot === 'victory' ? 'victory' : 'normal';
      renderCosmeticsModal();
      replayCosmeticPreview();
    });
    els['cosmetics-grid'].append(button);
  });
  renderCosmeticPreview();
  renderReducedEffectsButton();
}

function equipCosmetic(item) {
  if (!item || item.threshold > (playerProfile.peakPoints || 0)) return;
  playerProfile.equipped = { ...playerProfile.equipped, [item.slot]: item.id };
  playerProfile = savePlayerProfile(playerProfile);
  applyEquippedCosmetics();
  renderCosmeticsModal();
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
  root.classList.remove(...allClasses, 'preview-playing');
  root.classList.add(...equippedClassNames(previewEquipped));

  const unlocked = item.threshold <= (playerProfile.peakPoints || 0);
  const equipped = playerProfile.equipped?.[item.slot] === item.id;
  els['cosmetic-preview-status'].textContent = unlocked ? equipped ? '장착 중' : '해금 완료' : `잠금 · ${item.threshold.toLocaleString('ko-KR')}점에 해금`;
  els['cosmetic-preview-name'].textContent = item.name;
  const slotName = COSMETIC_SLOTS.find((slot) => slot.key === item.slot)?.name || item.slot;
  els['cosmetic-preview-description'].textContent = `${slotName} · ${item.description}`;
  els['cosmetic-preview-equip'].disabled = !unlocked || equipped;
  els['cosmetic-preview-equip'].textContent = !unlocked
    ? `${item.threshold.toLocaleString('ko-KR')}점에 해금`
    : equipped ? '장착 중' : '이 아이템 장착';
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
  cosmeticPreviewTimer = setTimeout(() => root.classList.remove('preview-playing'), 1200);
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
  document.body.classList.remove(...allClasses, 'reduced-effects');
  document.body.classList.add(...equippedClassNames(playerProfile.equipped));
  document.body.classList.toggle('reduced-effects', Boolean(playerProfile.reducedEffects));
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
  gameReady = false;
  pendingSeven = null;
  isPeekingHand = false;
  els['suit-return-bar'].classList.add('hidden');
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
  const toy = button.dataset.toy;
  const lines = TOY_LINES[toy];
  const count = Number(button.dataset.playCount || 0);
  button.dataset.playCount = String(count + 1);
  button.querySelector('.toy-bubble').textContent = lines[count % lines.length];
  button.classList.remove('is-playing');
  void button.offsetWidth;
  button.classList.add('is-playing');
  playSound(`toy-${toy}`);
  burstToyParticles(button, toy);
  setTimeout(() => button.classList.remove('is-playing'), 850);
}

function burstToyParticles(button, toy) {
  button.querySelector('.toy-particles')?.remove();
  const burst = document.createElement('span');
  burst.className = `toy-particles toy-particles-${toy}`;
  for (let index = 0; index < 10; index += 1) {
    const spark = document.createElement('i');
    const angle = (Math.PI * 2 * index) / 10;
    const distance = 28 + (index % 3) * 8;
    spark.style.setProperty('--toy-px', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--toy-py', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--toy-delay', `${(index % 4) * 25}ms`);
    burst.append(spark);
  }
  button.append(burst);
  setTimeout(() => burst.remove(), 850);
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
  maybeAiReact(won ? 'player-win' : 'ai-win', { force: true, delay: 260 });
  playSound(won ? 'win' : 'lose');
  els['result-icon'].textContent = won ? '✦' : '↻';
  els['result-kicker'].textContent = won ? 'NICE PLAY' : 'GOOD TRY';
  els['result-title'].textContent = won ? '당신의 승리!' : `${DIFFICULTIES[difficulty].name}의 승리`;
  els['result-description'].textContent = won ? victoryMessage() : '흐름을 다시 읽으면 다음 판은 달라질 거예요.';
  els['result-opponent-meta'].textContent = `${starsText(DIFFICULTIES[difficulty].stars)} ${DIFFICULTIES[difficulty].name} · 승리 시 +${rewardForStars(DIFFICULTIES[difficulty].stars)}점`;
  els['result-time'].textContent = formatTime(Date.now() - startedAt);
  els['result-moves'].textContent = `${moves}장`;
  els['result-final-card'].replaceChildren(createCardElement(game.topCard, false));
  els['result-final-owner'].textContent = won ? '내가 낸 마지막 카드' : `${DIFFICULTIES[difficulty].name}가 낸 마지막 카드`;
  lastRatingResult = recordMatchResult({
    won,
    opponentStars: DIFFICULTIES[difficulty].stars,
    mode: 'ai',
    matchId: currentMatchId,
  });
  playerProfile = lastRatingResult.profile;
  els['result-points-delta'].textContent = `${lastRatingResult.delta > 0 ? '+' : ''}${lastRatingResult.delta}점`;
  els['result-points-delta'].classList.toggle('lost', lastRatingResult.delta < 0);
  els['result-current-points'].textContent = `현재 ${playerProfile.points.toLocaleString('ko-KR')}점 · ${starsText(ratingProgress(playerProfile.points).stars)}`;
  renderResultUnlocks(lastRatingResult.unlockedItems || []);
  resultRevealTimer = setTimeout(() => {
    openModal('result-modal');
    setTimeout(() => els['match-again-button'].focus(), 0);
  }, 1150);
}

function renderResultUnlocks(unlockedItems) {
  const unlock = els['result-unlock'];
  unlock.classList.toggle('hidden', unlockedItems.length === 0);
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

function victoryMessage() {
  if (DIFFICULTIES[difficulty].stars >= 4) return `${DIFFICULTIES[difficulty].name}의 계산을 멋지게 넘어섰어요.`;
  if (moves <= 8) return '군더더기 없는 빠른 승리였어요.';
  return '마지막까지 흐름을 놓치지 않았네요.';
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
