import { OneCardGame, SUIT_SYMBOLS } from './game-engine.js';
import { chooseAiMove } from './ai-player.js';
import { isSoundEnabled, playSound, toggleSound } from './audio.js';

const DIFFICULTIES = {
  easy: { name: '느긋한 루미', icon: '☁', status: '느긋하게 패를 살펴보고 있어요', delay: 850 },
  normal: { name: '영리한 네오', icon: '✦', status: '좋은 수를 생각하고 있어요', delay: 1050 },
  hard: { name: '냉철한 아스트라', icon: '♛', status: '다음 흐름까지 계산하고 있어요', delay: 1250 },
};

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map((element) => [element.id, element]));
const game = new OneCardGame();
let difficulty = 'normal';
let startedAt = 0;
let timerId = null;
let aiTimer = null;
let moves = 0;
let pendingSeven = null;
let toastTimer = null;

document.querySelectorAll('[data-difficulty]').forEach((button) => {
  button.addEventListener('click', () => startGame(button.dataset.difficulty));
});
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
els['exit-button'].addEventListener('click', goHome);
els['rematch-button'].addEventListener('click', () => startGame(difficulty));
els['change-ai-button'].addEventListener('click', goHome);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const open = document.querySelector('.modal:not(.hidden)');
    if (open?.id === 'rules-modal') closeModal(open.id);
  }
});

function startGame(selectedDifficulty) {
  clearTimeout(aiTimer);
  window.scrollTo(0, 0);
  difficulty = selectedDifficulty;
  game.reset(difficulty);
  moves = 0;
  startedAt = Date.now();
  els['home-screen'].classList.add('hidden');
  els['game-screen'].classList.remove('hidden');
  closeModal('result-modal');
  const profile = DIFFICULTIES[difficulty];
  els['difficulty-label'].textContent = profile.name;
  els['ai-name'].textContent = profile.name;
  els['ai-avatar'].textContent = profile.icon;
  els['ai-status'].textContent = profile.status;
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 1000);
  updateTimer();
  playSound('card');
  render();
}

function goHome() {
  clearTimeout(aiTimer);
  clearInterval(timerId);
  window.scrollTo(0, 0);
  closeModal('result-modal');
  els['game-screen'].classList.add('hidden');
  els['home-screen'].classList.remove('hidden');
  updateRecord();
}

function playerPlay(cardId) {
  if (game.currentPlayer !== 0 || game.winner !== null) return;
  const card = game.hands[0].find((item) => item.id === cardId);
  if (!card || !game.isPlayable(card)) {
    playSound('error');
    showToast(game.attackCount ? '2 또는 A로 막거나 카드를 뽑아야 해요' : '같은 무늬나 숫자의 카드를 골라주세요');
    return;
  }
  if (card.rank === '7') {
    pendingSeven = cardId;
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
  applyPlayerCard(cardId, suit);
}

function applyPlayerCard(cardId, suit = null) {
  const result = game.playCard(0, cardId, suit);
  moves += 1;
  playSound(['2', 'A', 'J', 'Q', 'K', '7'].includes(result.card.rank) ? 'action' : 'card');
  render();
  if (result.type === 'win') return endGame(0);
  announceSpecial(result);
  if (game.currentPlayer === 1) scheduleAiTurn();
}

function playerDraw() {
  if (game.currentPlayer !== 0 || game.winner !== null) return;
  const result = game.drawCards(0);
  playSound('draw');
  showToast(result.wasPenalty ? `공격을 받아 ${result.count}장을 뽑았어요` : '카드 1장을 뽑았어요');
  render();
  scheduleAiTurn();
}

function scheduleAiTurn() {
  clearTimeout(aiTimer);
  if (game.currentPlayer !== 1 || game.winner !== null) return;
  render();
  aiTimer = setTimeout(runAiTurn, DIFFICULTIES[difficulty].delay);
}

function runAiTurn() {
  if (game.currentPlayer !== 1 || game.winner !== null) return;
  const move = chooseAiMove(game, difficulty);
  if (move.type === 'draw') {
    const result = game.drawCards(1);
    playSound('draw');
    showToast(result.wasPenalty ? `${DIFFICULTIES[difficulty].name}가 ${result.count}장을 받았어요` : '상대가 카드 1장을 뽑았어요');
  } else {
    const result = game.playCard(1, move.cardId, move.chosenSuit);
    playSound(['2', 'A', 'J', 'Q', 'K', '7'].includes(result.card.rank) ? 'action' : 'card');
    if (result.type === 'win') { render(); return endGame(1); }
    announceSpecial(result, true);
  }
  render();
  if (game.currentPlayer === 1) scheduleAiTurn();
}

function announceSpecial(result, isAi = false) {
  const owner = isAi ? '상대가' : '내가';
  const messages = {
    '2': `${owner} +2 공격을 보냈어요`,
    A: `${owner} +3 공격을 보냈어요`,
    J: `${owner} 상대 턴을 건너뛰었어요`,
    Q: `${owner} 방향을 바꿔 한 번 더 플레이해요`,
    K: `${owner} 한 번 더 플레이해요`,
    '7': `${owner} ${suitName(result.requestedSuit)} 무늬를 선택했어요`,
  };
  if (messages[result.card.rank]) showToast(messages[result.card.rank]);
}

function render() {
  renderOpponent();
  renderPlayerHand();
  renderTopCard();
  const playerTurn = game.currentPlayer === 0;
  els['game-table'].classList.toggle('ai-turn', !playerTurn);
  els['turn-banner'].textContent = playerTurn ? '내 차례예요' : `${DIFFICULTIES[difficulty].name}의 차례`;
  els['player-status'].textContent = playerTurn ? (game.attackCount ? '공격을 막거나 카드를 뽑으세요' : '낼 카드를 선택하세요') : '상대의 선택을 기다리는 중';
  els['action-hint'].textContent = game.attackCount
    ? `공격이 ${game.attackCount}장 누적됐어요 · 2 또는 A로 방어하세요`
    : `${suitName(game.activeSuit)} 또는 ${game.topCard.rank} 카드를 낼 수 있어요`;
  els['deck-count'].textContent = game.drawPile.length;
  els['draw-pile'].disabled = !playerTurn || game.winner !== null;
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
  const playerTurn = game.currentPlayer === 0;
  game.hands[0].forEach((card) => {
    const button = createCardElement(card, true);
    const playable = playerTurn && game.isPlayable(card);
    button.classList.toggle('playable', playable);
    button.classList.toggle('not-playable', playerTurn && !playable);
    button.disabled = !playerTurn;
    button.addEventListener('click', () => playerPlay(card.id));
    els['player-hand'].append(button);
  });
}

function renderTopCard() {
  const card = game.topCard;
  const current = createCardElement(card, false);
  els['discard-pile'].className = current.className;
  els['discard-pile'].replaceChildren(...current.childNodes);
  const changed = Boolean(game.requestedSuit);
  els['active-suit'].classList.toggle('hidden', !changed);
  els['active-suit'].classList.toggle('red', ['hearts', 'diamonds'].includes(game.requestedSuit));
  els['active-suit'].textContent = changed ? SUIT_SYMBOLS[game.requestedSuit] : '';
}

function createCardElement(card, interactive) {
  const element = document.createElement(interactive ? 'button' : 'div');
  element.className = `playing-card ${['hearts', 'diamonds'].includes(card.suit) ? 'red-card' : ''}`;
  if (interactive) {
    element.type = 'button';
    element.setAttribute('aria-label', `${suitName(card.suit)} ${card.rank}`);
  }
  const top = document.createElement('span');
  top.className = 'card-corner top';
  top.innerHTML = `<b>${card.rank}</b><i>${SUIT_SYMBOLS[card.suit]}</i>`;
  const center = document.createElement('strong');
  center.className = 'card-suit';
  center.textContent = SUIT_SYMBOLS[card.suit];
  const bottom = top.cloneNode(true);
  bottom.classList.replace('top', 'bottom');
  element.append(top, center, bottom);
  return element;
}

function endGame(winner) {
  clearInterval(timerId);
  clearTimeout(aiTimer);
  const won = winner === 0;
  playSound(won ? 'win' : 'lose');
  els['result-icon'].textContent = won ? '✦' : '↻';
  els['result-kicker'].textContent = won ? 'NICE PLAY' : 'GOOD TRY';
  els['result-title'].textContent = won ? '당신의 승리!' : `${DIFFICULTIES[difficulty].name}의 승리`;
  els['result-description'].textContent = won ? victoryMessage() : '흐름을 다시 읽으면 다음 판은 달라질 거예요.';
  els['result-time'].textContent = formatTime(Date.now() - startedAt);
  els['result-moves'].textContent = `${moves}장`;
  saveRecord(won);
  setTimeout(() => openModal('result-modal'), 450);
}

function victoryMessage() {
  if (difficulty === 'hard') return '아스트라의 계산을 멋지게 넘어섰어요.';
  if (moves <= 8) return '군더더기 없는 빠른 승리였어요.';
  return '마지막까지 흐름을 놓치지 않았네요.';
}

function saveRecord(won) {
  const record = JSON.parse(localStorage.getItem('onecard-record') || '{"wins":0,"games":0}');
  record.games += 1;
  if (won) record.wins += 1;
  localStorage.setItem('onecard-record', JSON.stringify(record));
}

function updateRecord() {
  const record = JSON.parse(localStorage.getItem('onecard-record') || '{"wins":0,"games":0}');
  els['record-summary'].textContent = record.games ? `누적 ${record.wins}승 · ${record.games}게임` : '첫 승리에 도전해 보세요';
}

function updateTimer() {
  els['round-timer'].textContent = formatTime(Date.now() - startedAt);
}

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function suitName(suit) {
  return { hearts: '하트', diamonds: '다이아', spades: '스페이드', clubs: '클로버' }[suit] || '';
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
