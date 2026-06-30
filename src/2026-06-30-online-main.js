import { SUIT_SYMBOLS } from './game-engine.js';
import { calculateFanTransform, calculateHandLayout } from './2026-06-30-hand-layout.js';
import { createGameEffects } from './2026-06-30-effects.js';
import { makeToyDraggable } from './2026-06-30-toy-drag.js';
import { MultiplayerClient } from './2026-06-30-multiplayer.js';
import { getSeatView, isMyTurn, normalizeRoomCode, validateNickname, validateRoomCode } from './2026-06-30-multiplayer-helpers.js';
import { isSupabaseConfigured } from './2026-06-30-supabase-config.js';
import { playSound } from './audio.js';
import { animateCardToPile } from './2026-06-30-card-motion.js';

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
els['online-draw-pile'].addEventListener('click', () => perform(() => client.drawCards(), 'online-toast'));
els['online-suit-cancel'].addEventListener('click', closeSuitPicker);
els['online-draw-close'].addEventListener('click', closeDrawReveal);
document.querySelectorAll('[data-online-suit]').forEach((button) => {
  button.addEventListener('click', () => submitCard(pendingSeven, button.dataset.onlineSuit));
});

document.querySelectorAll('[data-online-toy]').forEach((button) => {
  makeToyDraggable(button, els['online-table'], () => playOnlineToy(button));
});
window.addEventListener('resize', scheduleHandLayout);

if (!isSupabaseConfigured()) {
  els['setup-required'].classList.remove('hidden');
  els['create-room-button'].disabled = true;
  els['join-room-button'].disabled = true;
  renderConnection('setup required');
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
    if (!client.supabase) await client.connect();
    if (mode === 'create') await client.createRoom(nickname);
    else await client.joinRoom(code, nickname);
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
  ['create-room-button','join-room-button','ready-button','online-roll-button','online-draw-pile']
    .forEach((id) => { if (els[id]) els[id].classList.toggle('is-busy', value); });
}

function handleView(nextView) {
  view = nextView;
  if (nextView.drawnCards?.length) {
    latestDeferredView = nextView;
    if (!revealActive) showDrawReveal(nextView.drawnCards);
    return;
  }
  if (revealActive) {
    latestDeferredView = nextView;
    return;
  }
  renderView(nextView);
}

function renderView(nextView) {
  view = nextView;
  els['online-entry'].classList.add('hidden');
  els['lobby-room-code'].textContent = nextView.code;
  els['online-room-mini'].textContent = nextView.code;
  if (nextView.status === 'playing' || nextView.status === 'finished') {
    els['online-lobby'].classList.add('hidden');
    els['online-game'].classList.remove('hidden');
    renderGame(nextView);
    if (previousStatus !== 'playing' && nextView.status === 'playing') announceInitiative(nextView);
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
  const hasTwo = Boolean(nextView.host && nextView.guest);
  els['lobby-title'].textContent = !hasTwo ? '친구를 기다리는 중' : nextView.status === 'dice' ? '주사위로 선공 결정' : '두 플레이어가 모였어요';
  els['ready-button'].classList.toggle('hidden', nextView.status === 'dice');
  els['ready-button'].disabled = !hasTwo || mine?.ready;
  els['ready-button'].textContent = mine?.ready ? '준비 완료 ✓' : hasTwo ? '준비 완료' : '친구를 기다리는 중';
  els['online-dice-area'].classList.toggle('hidden', nextView.status !== 'dice');
  if (nextView.status === 'dice') {
    els['online-host-die'].textContent = dieFace(nextView.host?.die);
    els['online-guest-die'].textContent = dieFace(nextView.guest?.die);
    els['online-host-roll'].textContent = nextView.host?.die || '-';
    els['online-guest-roll'].textContent = nextView.guest?.die || '-';
    els['online-dice-status'].textContent = nextView.diceTie ? '동점! 두 플레이어가 다시 굴려요.' : '두 플레이어가 각자 주사위를 굴려요.';
    els['online-roll-button'].disabled = Boolean(mine?.die) && !nextView.diceTie;
    els['online-roll-button'].textContent = mine?.die && !nextView.diceTie ? '상대 주사위 대기 중' : nextView.diceTie ? '다시 굴리기' : '내 주사위 굴리기';
  }
  els['lobby-error'].textContent = opponent && !opponent.connected ? '상대 연결이 잠시 끊겼어요. 60초 동안 기다립니다.' : '';
}

function renderLobbySlot(element, player, isMine) {
  element.classList.toggle('me', isMine);
  element.classList.toggle('ready', Boolean(player?.ready));
  element.querySelector('strong').textContent = player?.nickname || '친구 대기 중';
  element.querySelector('small').textContent = !player ? '방 코드를 알려주세요' : player.ready ? '준비 완료' : player.connected ? '접속됨 · 준비 전' : '재접속 대기 중';
}

function renderGame(nextView) {
  const { mine, opponent } = getSeatView(nextView);
  els['online-my-name'].textContent = mine.nickname;
  els['online-opponent-name'].textContent = opponent.nickname;
  els['online-opponent-title'].textContent = opponent.nickname;
  els['online-my-count'].textContent = mine.count;
  els['online-opponent-count'].textContent = opponent.count;
  els['online-opponent-status'].textContent = opponent.connected ? '온라인' : '재접속 대기 중';
  els['online-my-status'].textContent = isMyTurn(nextView) ? '내 차례' : '상대 차례';
  renderOpponentHand(opponent.count);
  renderHand(nextView);
  renderTopCard(nextView.topCard, nextView.activeSuit);
  els['online-deck-count'].textContent = nextView.drawCount;
  els['online-draw-pile'].disabled = busy || !isMyTurn(nextView) || nextView.status !== 'playing';
  els['online-turn-banner'].textContent = nextView.status === 'finished'
    ? nextView.winnerSeat === nextView.mySeat ? '내 승리!' : '상대 승리'
    : isMyTurn(nextView) ? '내 차례예요' : `${opponent.nickname}의 차례`;
  els['online-action-hint'].textContent = nextView.attackCount
    ? `공격 +${nextView.attackCount} · 2, A, 조커로 방어하세요`
    : `${suitName(nextView.activeSuit)} 또는 ${nextView.topCard.rank} 카드를 낼 수 있어요`;
  els['online-attack-badge'].classList.toggle('hidden', !nextView.attackCount);
  els['online-attack-badge'].querySelector('b').textContent = nextView.attackCount;
  if (nextView.status === 'finished' && previousStatus !== 'finished' && nextView.lastEvent?.eventType !== 'play') {
    playFinishEffect(nextView);
  }
}

function renderOpponentHand(count) {
  els['online-opponent-hand'].replaceChildren();
  for (let index = 0; index < count; index += 1) {
    const card = document.createElement('div');
    card.className = 'mini-back card-back';
    card.style.setProperty('--i', index);
    card.style.setProperty('--count', count);
    card.innerHTML = '<span class="back-logo">ONE<b>!</b></span>';
    els['online-opponent-hand'].append(card);
  }
}

function renderHand(nextView) {
  const hand = els['online-player-hand'];
  hand.replaceChildren();
  nextView.myHand.forEach((card) => {
    const button = createCard(card, true);
    const playable = isMyTurn(nextView) && isPlayable(card, nextView);
    button.classList.toggle('playable', playable);
    button.classList.toggle('not-playable', isMyTurn(nextView) && !playable);
    button.disabled = busy || !isMyTurn(nextView) || nextView.status !== 'playing';
    button.addEventListener('click', () => {
      if (busy) return;
      if (!playable) return showToast('지금은 낼 수 없는 카드예요');
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
  const center = document.createElement('strong');
  center.className = 'card-suit'; center.textContent = SUIT_SYMBOLS[card.suit];
  const bottom = top.cloneNode(true); bottom.classList.replace('top','bottom');
  element.append(top,center,bottom);
  return element;
}

function isPlayable(card, nextView) {
  if (nextView.attackCount > 0) return ['2','A','JOKER'].includes(card.rank);
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
  if (busy) return;
  const mineDie = view.mySeat === 0 ? els['online-host-die'] : els['online-guest-die'];
  mineDie.classList.add('rolling');
  playSound('dice');
  try { await perform(() => client.rollDice(), 'lobby-error'); }
  finally { setTimeout(() => mineDie.classList.remove('rolling'), 500); }
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
  if (!['draw', 'play'].includes(event.eventType)) return;
  eventEffectGeneration += 1;
  const generation = eventEffectGeneration;
  clearTimeout(eventEffectTimer);
  effects.clear();

  if (event.eventType === 'draw') {
    const owner = event.actorSeat === view.mySeat ? '내가' : '상대가';
    effects.play('impact', {
      symbol: `+${event.payload.count}`,
      title: `${owner} ${event.payload.count}장 뽑기`,
      subtitle: event.payload.penalty ? '누적 공격을 받았어요' : '카드를 패에 넣었어요',
    });
    return;
  }
  const card = event.payload.card;
  const owner = event.actorSeat === view.mySeat ? '내가' : '상대가';
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
    Q:['skip','↻','방향 전환!',`${owner} 한 번 더 플레이합니다`],
    K:['skip','♛','한 번 더!',`${owner} 연속 플레이합니다`],
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

function showDrawReveal(cards) {
  revealActive = true;
  els['online-draw-cards'].replaceChildren();
  cards.forEach((card,index) => {
    const element = createCard(card,false);
    element.classList.add('drawn-card');
    element.style.setProperty('--draw-index',index);
    element.style.setProperty('--draw-count',cards.length);
    els['online-draw-cards'].append(element);
  });
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
  const toy = button.dataset.onlineToy;
  button.classList.remove('is-playing'); void button.offsetWidth; button.classList.add('is-playing');
  playSound(`toy-${toy}`);
  burstOnlineToyParticles(button, toy);
  setTimeout(() => button.classList.remove('is-playing'),850);
}

function burstOnlineToyParticles(button, toy) {
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
  if (message.includes('SUPABASE_NOT_CONFIGURED')) return 'Supabase 공개 설정을 먼저 입력해 주세요.';
  return message || '처리 중 문제가 생겼어요.';
}
