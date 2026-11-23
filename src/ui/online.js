// 친구와 대전 — 방 만들기 · 코드로 들어가기 · 대기실 · 주사위 · 게임판(AI 대전과 같은 판) · 재대결
import gsap from 'gsap';
import { h, formatNumber, stars, wait } from './dom.js';
import { MultiplayerClient } from '../net/multiplayer.js';
import { getSeatView, isMyTurn, normalizeRoomCode, validateNickname, validateRoomCode } from '../net/multiplayer-helpers.js';
import { isSupabaseConfigured } from '../net/config.js';
import { loadPlayerProfile, playerStarsForPoints, recordMatchResult } from '../core/rating.js';
import { applyMissionEvents, missionEventsForCard } from '../core/missions.js';
import { cosmeticById } from '../core/cosmetics.js';
import { onlineLook } from '../data/characters.js';
import { img } from '../data/assets.js';
import { createTable } from './table.js';
import { createFx } from './fx.js';
import { createDirector } from './director.js';
import { applyEquipped, backVars, themeFor } from './theme-apply.js';
import { renderDecor } from './decor.js';
import { mountToys } from './toys.js';
import { pickSuit, playHint, blockedReason } from './play-ui.js';
import { showResult } from './result.js';
import { confirmModal, toast } from './modal.js';
import { stickerPicker, showSticker } from './reactions.js';
import { rollDie } from './intro.js';
import { settings } from './settings.js';
import { play } from './sound.js';

const ERRORS = {
  ROOM_NOT_FOUND: '방을 찾지 못했어요. 코드를 다시 확인해 주세요.',
  ROOM_FULL: '이미 두 명이 들어간 방이에요.',
  STALE_VERSION: '판이 바뀌었어요. 한 번 더 눌러 주세요.',
  NOT_YOUR_TURN: '지금은 상대 차례예요.',
  MUST_DEFEND_JOKER: '조커 공격은 조커로만 막을 수 있어요.',
  MUST_DEFEND_ATTACK: '2나 A, 조커로 막거나 덱을 눌러 받아요.',
  CARD_NOT_PLAYABLE: '같은 무늬나 같은 숫자를 내요.',
  SUPABASE_NOT_CONFIGURED: '온라인 서버 설정이 없어요.',
  EMOTE_RATE_LIMIT: '반응은 잠깐 쉬었다가 다시 보내 주세요.',
  EMOTE_NOT_AVAILABLE: '게임을 시작한 뒤에 반응을 보낼 수 있어요.',
};
const friendly = (message = '') => {
  if (/Failed to fetch|NetworkError|ERR_|network/i.test(message)) return '온라인 서버에 닿지 못했어요. 인터넷 연결을 확인하고 다시 해 주세요.';
  return Object.entries(ERRORS).find(([key]) => message.includes(key))?.[1] || '잠시 문제가 생겼어요. 다시 해 주세요.';
};
const ACTIVE_ROOM_KEY = 'onecard-active-room-v1';
const hasActiveRoom = () => { try { return Boolean(JSON.parse(localStorage.getItem(ACTIVE_ROOM_KEY) || 'null')?.roomId); } catch { return false; } };

function isPlayableOnline(card, view) {
  if (view.attackCount > 0) return view.topCard.rank === 'JOKER' ? card.rank === 'JOKER' : ['2', 'A', 'JOKER'].includes(card.rank);
  if (view.freePlay) return true;
  return card.rank === 'JOKER' || card.suit === view.activeSuit || card.rank === view.topCard.rank;
}

export function startOnline({ host, onExit, openRules }) {
  const profile = loadPlayerProfile();
  const avatar = cosmeticById(profile.equipped.avatar) || cosmeticById('avatar-rabbit');
  let applied = null;
  let table = null;
  let fx = null;
  let toys = null;
  let director = createDirector();
  let busy = false;
  let pendingPlay = null;
  let lastEventId = null;
  let resultKey = '';
  let resultPanel = null;
  let stickerPanel = null;
  let diceOverlay = null;
  let presence = { host: true, guest: true };

  const client = new MultiplayerClient({
    onView: (view) => director.run(() => applyView(view)),
    onConnection: (state) => renderConnection(state),
    onEmote: (event) => handleEmote(event),
    onPresence: (next) => { presence = next; renderPresence(); },
  });

  // ── 들어가기 화면
  const pill = h('span.conn-pill', {}, '연결 중');
  const nickname = h('input.text-input', { maxlength: '12', placeholder: '닉네임 2~12자', value: settings.get().nickname || '', 'aria-label': '닉네임' });
  const codeInput = h('input.text-input.code-input', { maxlength: '6', placeholder: '방 코드 6자리', autocomplete: 'off', 'aria-label': '방 코드', onInput: (event) => { event.currentTarget.value = normalizeRoomCode(event.currentTarget.value); } });
  const entryError = h('p.form-error', { role: 'alert' }, '');
  const createButton = h('button.btn.primary', { type: 'button', disabled: true, onClick: () => enter('create') }, '방 만들기');
  const joinButton = h('button.btn.ghost', { type: 'button', disabled: true, onClick: () => enter('join') }, '들어가기');
  const entry = h('section.online-entry', { 'aria-label': '친구와 대전' },
    h('header.page-top', {},
      h('button.icon-btn', { type: 'button', 'aria-label': '로비로', onClick: () => exit(), html: '<svg viewBox="0 0 24 24"><path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
      h('h1.page-title', {}, '친구와 대전'), pill),
    h('div.entry-body', {},
      h('div.entry-card', {},
        h('img.entry-art', { src: img(avatar.motif), alt: '' }),
        h('label.field', {}, h('span', {}, '닉네임'), nickname),
        h('div.entry-split', {},
          h('section.entry-col', {}, h('b', {}, '방을 만들어요'), h('small', {}, '코드를 친구에게 알려 주세요'), createButton),
          h('section.entry-col', {}, h('b', {}, '코드로 들어가요'), codeInput, joinButton)),
        entryError)));
  host.replaceChildren(entry);

  // 들어가던 방이 있을 때만 바로 잇는다. 아니면 방을 만들거나 들어갈 때 로그인한다(구경만 하면 서버에 익명 계정을 만들지 않게)
  if (!isSupabaseConfigured()) {
    entryError.textContent = ERRORS.SUPABASE_NOT_CONFIGURED;
  } else if (hasActiveRoom()) {
    client.connect()
      .then(() => client.restoreRoom(profile.points, profile.equipped.cardBack))
      .catch((error) => { entryError.textContent = friendly(error.message); renderConnection('reconnecting'); })
      .finally(() => { createButton.disabled = false; joinButton.disabled = false; });
  } else {
    createButton.disabled = false;
    joinButton.disabled = false;
    renderConnection('ready');
  }

  async function enter(mode) {
    if (busy) return;
    let name;
    let code;
    try {
      name = validateNickname(nickname.value);
      code = mode === 'join' ? validateRoomCode(codeInput.value) : null;
    } catch (error) { entryError.textContent = error.message; play('error'); return; }
    settings.set({ nickname: name });
    busy = true;
    entryError.textContent = '';
    try {
      await client.connect();
      if (mode === 'create') await client.createRoom(name, profile.points, profile.equipped.cardBack);
      else await client.joinRoom(code, name, profile.points, profile.equipped.cardBack);
      play('confirm');
    } catch (error) {
      entryError.textContent = friendly(error.message);
      play('error');
    } finally { busy = false; }
  }

  function renderConnection(state) {
    pill.textContent = { live: '실시간 연결됨', connected: '서버 연결됨', reconnecting: '다시 잇는 중', ready: '방을 만들거나 들어가요' }[state] || '연결 중';
    pill.dataset.state = state;
  }

  // ── 대기실
  let roomEl = null;
  function renderRoom(view) {
    const { mine, opponent } = getSeatView(view);
    const seat = (player, label, me) => h(`div.seat${player?.ready ? '.is-ready' : ''}${me ? '.is-me' : ''}`, {},
      h('img', { src: img(me ? avatar.motif : onlineLook(player?.nickname || '').motif), alt: '' }),
      h('b', {}, player?.nickname || '친구를 기다리는 중'),
      h('small', {}, player ? `${stars(playerStarsForPoints(player.rating || 0))} ${formatNumber(player.rating || 0)}점, ${player.ready ? '준비 완료' : '준비 전'}` : '방 코드를 알려 주세요'),
      h('span.seat-label', {}, label));
    const readyButton = h('button.btn.primary', { type: 'button', disabled: !opponent, onClick: () => run(() => client.setReady()) }, mine?.ready ? '준비 취소' : opponent ? '준비 완료' : '친구를 기다려요');
    const next = h('section.room', { 'aria-label': '대기실' },
      h('header.page-top', {},
        h('button.icon-btn', { type: 'button', 'aria-label': '방 나가기', onClick: () => leave(), html: '<svg viewBox="0 0 24 24"><path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
        h('h1.page-title', {}, '대기실'), pill),
      h('div.room-body', {},
        h('button.room-code', { type: 'button', 'aria-label': `방 코드 ${view.code}, 눌러서 복사`, onClick: (event) => copyCode(view.code, event.currentTarget) }, ...view.code.split('').map((char) => h('b', {}, char)), h('small', {}, '눌러서 복사')),
        h('div.seats', {}, seat(view.host, '방장', view.mySeat === 0), h('b.seats-vs', {}, 'VS'), seat(view.guest, '손님', view.mySeat === 1)),
        h('p.room-score', {}, `이 방 전적 ${view.host?.wins ?? 0} : ${view.guest?.wins ?? 0}`),
        readyButton));
    if (roomEl) roomEl.replaceWith(next); else host.replaceChildren(next);
    roomEl = next;
  }

  async function copyCode(code, anchor) {
    try { await navigator.clipboard.writeText(code); toast('방 코드를 복사했어요', { anchor, tone: 'good' }); } catch { toast(`방 코드 ${code}`, { anchor }); }
  }

  async function run(action) {
    if (busy) return null;
    busy = true;
    try { return await action(); } catch (error) { toast(friendly(error.message), { tone: 'warn' }); play('error'); return null; } finally { busy = false; }
  }

  // ── 게임판
  function ensureTable(view) {
    if (table) return;
    roomEl = null;
    table = createTable({
      mode: 'online',
      onPlay: (id, { blocked }) => (blocked ? toast(blockedReason(applied), { anchor: table.hand }) : submitPlay(id)),
      onDraw: () => submitDraw(),
      onPileTap: () => {},
      onExit: () => leave(),
      onRules: () => openRules?.(),
      onEmoteToggle: () => toggleStickers(),
    });
    const themes = applyEquipped(table.root, profile.equipped);
    fx = createFx({ layer: table.fxLayer, root: table.root, director });
    host.replaceChildren(table.root);
    renderDecor(table.decor, themes.table);
    toys = mountToys({ layer: table.toysLayer, equipped: profile.equipped, fx });
    table.themes = themes;
    table.root.addEventListener('pointerdown', (event) => { if (event.target.closest('.fx-layer') && director.busy()) director.skip(); });
    const { opponent } = getSeatView(view);
    const look = onlineLook(opponent?.nickname || '');
    table.setRival({ name: opponent?.nickname || '상대', starsCount: playerStarsForPoints(opponent?.rating || 0), color: look.color, motif: look.motif, status: '' });
    table.setMe({ name: getSeatView(view).mine?.nickname || '나', motif: avatar.motif, points: profile.points, starsCount: playerStarsForPoints(profile.points), color: '#f2b544' });
  }

  function syncTable(view) {
    const { mine, opponent } = getSeatView(view);
    const myTurn = isMyTurn(view);
    table.setMatch({ title: `${mine?.nickname || '나'} 대 ${opponent?.nickname || '상대'}`, sub: `이 방 ${view.host?.wins ?? 0} : ${view.guest?.wins ?? 0}`, bonus: (view.bonusMultiplier || 1) > 1 });
    Object.entries(backVars(themeFor(opponent?.cardBack || 'back-classic'))).forEach(([key, value]) => table.rivalZone.style.setProperty(key, value));
    table.setTurn(view.status === 'playing' ? (myTurn ? 'me' : 'rival') : '');
    table.setDeckCount(view.drawCount);
    table.setAttack(view.attackCount, view.topCard?.rank === 'JOKER' && view.attackCount > 0);
    table.setActiveSuit(['7', 'JOKER'].includes(view.topCard?.rank) ? view.activeSuit : null);
    table.setRivalCount(opponent?.count ?? 0, { animate: false });
    table.syncHand(view.myHand || [], { animate: true });
    table.setMyCount((view.myHand || []).length);
    table.setTop(view.topCard);
    table.setHint(view.topCard ? playHint({ attackCount: view.attackCount, topCard: view.topCard, freePlay: view.freePlay, activeSuit: view.activeSuit, requestedSuit: view.topCard.rank === '7' ? view.activeSuit : null, myTurn }) : '');
    table.setMeStatus(myTurn ? '내 차례' : '');
    table.setRivalStatus(view.status === 'playing' && !myTurn ? '고르는 중' : '');
    const playable = myTurn ? (view.myHand || []).filter((card) => isPlayableOnline(card, view)).map((card) => card.id) : [];
    table.setPlayable(playable, myTurn && !busy);
    table.setDeckEnabled(myTurn && !busy);
    renderPresence();
  }

  function renderPresence() {
    if (!table || !applied) return;
    const opponentConnected = applied.mySeat === 0 ? presence.guest : presence.host;
    if (!opponentConnected) table.setRivalStatus('연결이 잠시 끊겼어요');
  }

  async function submitPlay(cardId) {
    if (busy || !applied || !isMyTurn(applied)) return;
    const card = applied.myHand.find((item) => item.id === cardId);
    if (!card) return;
    let suit = null;
    if (card.rank === '7') {
      suit = await pickSuit({ host: table.root, hand: applied.myHand.filter((item) => item.id !== cardId) });
      if (!suit) return;
    }
    busy = true;
    table.setPlayable([], false);
    table.setDeckEnabled(false);
    pendingPlay = cardId;
    const flying = table.flyMine(cardId, card);
    try {
      await client.playCard(cardId, suit);
    } catch (error) {
      pendingPlay = null;
      toast(friendly(error.message), { tone: 'warn' });
      play('error');
      await flying;
      busy = false;
      director.run(() => client.refresh());
      return;
    }
    await flying;
    busy = false;
  }

  async function submitDraw() {
    if (busy || !applied || !isMyTurn(applied)) return;
    busy = true;
    table.setDeckEnabled(false);
    try { await client.drawCards(); } catch (error) { toast(friendly(error.message), { tone: 'warn' }); play('error'); }
    busy = false;
  }

  // ── 서버 판 → 화면(차례대로)
  async function applyView(view) {
    const previous = applied;
    applied = view;
    if (view.status === 'waiting') {
      closeResult();
      return renderRoom(view);
    }
    if (view.status === 'dice') {
      closeResult();
      if (table) { cleanupTable(); }
      return renderDice(view, previous);
    }
    if (view.status === 'playing' && (!previous || previous.status !== 'playing') && !table?.dealt) {
      await finishDice(view);
      ensureTable(view);
      table.resetPile(view.topCard);
      await table.deal(view.myHand, getSeatView(view).opponent?.count ?? 5);
      table.dealt = true;
      lastEventId = view.lastEvent?.id ?? null;
      syncTable(view);
      if ((view.bonusMultiplier || 1) > 1) await fx.bonusStart();
      await fx.slab({ text: isMyTurn(view) ? '내가 먼저' : '상대 먼저', color: '#f2b544', ink: '#121a2b', size: 'm', tilt: -6, hold: 0.4 });
      return undefined;
    }
    ensureTable(view);
    const event = view.lastEvent;
    if (event && event.id !== lastEventId) {
      lastEventId = event.id;
      await animateEvent(event, view, previous);
    }
    syncTable(view);
    if (view.status === 'finished') await showFinished(view);
    return undefined;
  }

  async function animateEvent(event, view, previous) {
    const mine = event.actorSeat === view.mySeat;
    const at = table.rect.pile();
    if (event.eventType === 'play') {
      const card = event.payload.card;
      if (mine && pendingPlay === card.id) pendingPlay = null;
      else if (mine) await table.flyMine(card.id, card);
      else await table.flyRival(card);
      if (mine) {
        const events = missionEventsForCard(card, { idPrefix: `online:${event.id}` }).map((item) => ({ ...item, mode: 'multi' }));
        if (event.payload.remaining === 1) events.push({ id: `online:${event.id}:onecard`, type: 'one-card', mode: 'multi' });
        applyMissionEvents(events);
      }
      fx.burst(mine ? table.themes.effect : themeFor('effect-classic'), at, { count: mine ? 5 : 3, sizeScale: mine ? 1 : 0.7 });
      if (card.rank === 'JOKER') await fx.jokerTime({ at, owner: mine ? 'me' : 'rival', card });
      else if (card.rank === '2' || card.rank === 'A') await fx.attack({ at, added: card.rank === '2' ? 2 : 3, total: event.payload.attackCount || view.attackCount, owner: mine ? 'me' : 'rival' });
      else if (card.rank === '7') { table.setActiveSuit(event.payload.chosenSuit); await fx.suitChange({ at, suit: event.payload.chosenSuit, medallion: table.root.querySelector('.suit-medallion') }); }
      else if (card.rank === 'J') await fx.skip({ zone: mine ? table.rivalZone : table.meZone, portrait: mine ? table.rivalPortrait : null, owner: mine ? 'me' : 'rival' });
      if (event.payload.remaining === 1) await fx.oneCard({ zone: mine ? table.meZone : table.rivalZone, mine, name: getSeatView(view).opponent?.nickname || '상대', color: '#f2b544' });
    } else if (event.eventType === 'draw') {
      if (mine) {
        const drawn = view.drawnCards || [];
        applyMissionEvents([{ id: `online:${event.id}:draw`, type: 'draw-card', mode: 'multi', amount: event.payload.count || 1 }]);
        if (drawn.length) await table.drawMine(drawn, view.myHand);
      } else {
        await table.drawRival(event.payload.count || 1);
      }
      if (event.payload.penalty) await fx.penalty({ zone: mine ? table.meZone : table.rivalZone, count: event.payload.count, mine });
    } else if (event.eventType === 'left' && !mine) {
      toast('상대가 방을 나갔어요', { tone: 'warn' });
    }
    if (previous && previous.status === 'playing' && view.status === 'playing') table.setTop(view.topCard);
  }

  async function showFinished(view) {
    const key = `multi:${view.roomId}:round:${view.roundNo}`;
    if (resultKey === key) return;
    resultKey = key;
    const { mine, opponent } = getSeatView(view);
    const won = view.winnerSeat === view.mySeat;
    const xpBefore = loadPlayerProfile().seasonXp;
    const rating = recordMatchResult({ won, opponentStars: playerStarsForPoints(opponent?.rating || 0), mode: 'multi', matchId: key, bonusMultiplier: view.bonusMultiplier || 1 });
    applyMissionEvents([
      { id: `${key}:mission:game`, type: 'game', mode: 'multi' },
      ...(won ? [{ id: `${key}:mission:win`, type: 'win', mode: 'multi', opponentStars: playerStarsForPoints(opponent?.rating || 0) }] : []),
    ]);
    const after = loadPlayerProfile();
    if (!rating.duplicate) client.setRating(after.points).catch(() => {});
    const look = onlineLook(opponent?.nickname || '');
    const scene = won
      ? fx.victory({ theme: table.themes.victory, avatarEl: table.meImg, title: '승리', sub: `${opponent?.nickname || '상대'}를 이겼어요` })
      : fx.defeat({ rival: { name: opponent?.nickname || '상대', motif: look.motif, faces: { smug: 'smirking' } }, portrait: table.rivalPortrait });
    await scene.timeline;
    resultPanel = showResult({
      host: table.root, won, delta: rating.delta || 0, bonus: (view.bonusMultiplier || 1) > 1, profile: after,
      xpGained: after.seasonXp - xpBefore, xpBefore, unlocked: rating.unlockedItems || [],
      subtitle: `이 방 전적 ${view.host?.wins ?? 0} : ${view.guest?.wins ?? 0}`,
      primaryLabel: mine?.ready ? '재대결 신청 취소' : '재대결 신청',
      onPrimary: () => run(() => client.requestRematch()),
      onHome: () => leave(true),
    });
    resultPanel.scene = scene;
  }

  function closeResult() {
    resultPanel?.scene?.finish?.();
    resultPanel?.close();
    resultPanel = null;
  }

  // ── 주사위(두 사람이 각자 굴림)
  function renderDice(view) {
    const { mine, opponent } = getSeatView(view);
    if (!diceOverlay) {
      const myDie = h('div.die', { vars: { '--die': '#f2b544' } }, h('div.die-cube', {}, ...[1, 2, 3, 4, 5, 6].map((value) => h('div.die-face', { dataset: { value } }, ...Array.from({ length: 9 }, (_, index) => h(`i${({ 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] })[value].includes(index + 1) ? '.on' : ''}`))))));
      const theirDie = myDie.cloneNode(true);
      theirDie.style.setProperty('--die', onlineLook(opponent?.nickname || '').color);
      const note = h('p.dice-note', { role: 'status' }, '각자 주사위를 굴려요');
      const button = h('button.btn.primary.dice-btn', { type: 'button', onClick: async () => { button.disabled = true; await run(() => client.rollDice()); } }, '주사위 굴리기');
      diceOverlay = { el: h('div.versus.is-online', {}, h('div.vs-bg'), h('div.dice-panel', {},
        h('div.dice-row', {}, h('div.dice-col', {}, myDie, h('small', {}, mine?.nickname || '나'), h('b.dice-value.mine', {}, '')), h('div.dice-col', {}, theirDie, h('small', {}, opponent?.nickname || '상대'), h('b.dice-value.theirs', {}, ''))),
        note, button)), myDie, theirDie, note, button, shown: [null, null] };
      host.replaceChildren(diceOverlay.el);
      roomEl = null;
    }
    const myValue = view.mySeat === 0 ? view.host?.die : view.guest?.die;
    const theirValue = view.mySeat === 0 ? view.guest?.die : view.host?.die;
    if (view.diceTie) { diceOverlay.shown = [null, null]; diceOverlay.note.textContent = '같은 눈이에요. 다시 굴려요'; diceOverlay.button.disabled = false; diceOverlay.button.textContent = '다시 굴리기'; }
    if (myValue && diceOverlay.shown[0] !== myValue) { diceOverlay.shown[0] = myValue; rollDie(diceOverlay.myDie, myValue).then(() => { diceOverlay.el.querySelector('.dice-value.mine').textContent = String(myValue); }); diceOverlay.button.disabled = true; }
    if (theirValue && diceOverlay.shown[1] !== theirValue) { diceOverlay.shown[1] = theirValue; rollDie(diceOverlay.theirDie, theirValue).then(() => { diceOverlay.el.querySelector('.dice-value.theirs').textContent = String(theirValue); }); }
    if (!myValue && !view.diceTie) diceOverlay.button.disabled = false;
  }

  async function finishDice(view) {
    if (!diceOverlay) return;
    const myValue = view.mySeat === 0 ? view.host?.die : view.guest?.die;
    const theirValue = view.mySeat === 0 ? view.guest?.die : view.host?.die;
    if (myValue && diceOverlay.shown[0] !== myValue) await rollDie(diceOverlay.myDie, myValue);
    if (theirValue && diceOverlay.shown[1] !== theirValue) await rollDie(diceOverlay.theirDie, theirValue);
    diceOverlay.note.textContent = isMyTurn(view) ? `${myValue} 대 ${theirValue}, 내가 먼저 내요` : `${myValue} 대 ${theirValue}, 상대가 먼저 내요`;
    await wait(settings.reduced() ? 200 : 900);
    await gsap.to(diceOverlay.el, { opacity: 0, duration: 0.25 });
    diceOverlay.el.remove();
    diceOverlay = null;
  }

  // ── 스티커
  function toggleStickers() {
    if (stickerPanel) { stickerPanel.remove(); stickerPanel = null; return; }
    stickerPanel = stickerPicker({ onPick: (key) => { stickerPanel?.remove(); stickerPanel = null; run(() => client.sendEmote(key)); } });
    table.rivalZone.append(stickerPanel);
  }

  function handleEmote(event) {
    if (!table || !applied) return;
    const mine = event.actorSeat === applied.mySeat;
    showSticker(mine ? table.meBubble : table.rivalBubble, event.payload?.emote);
    if (mine) applyMissionEvents([{ id: `online:${event.id}:emote`, type: 'emote', mode: 'multi' }]);
  }

  // ── 나가기
  function cleanupTable() {
    closeResult();
    toys?.destroy();
    table?.destroy();
    table = null;
    toys = null;
    director.reset();
    director = createDirector();
  }

  async function leave(skipConfirm = false) {
    if (!skipConfirm && applied?.status === 'playing') {
      const ok = await confirmModal({ title: '방에서 나갈까요?', message: '게임 중에 나가면 상대의 승리가 돼요.', confirmLabel: '나가기', cancelLabel: '계속하기' });
      if (!ok) return;
    }
    try { await client.leave(); } catch { /* 나가기는 최선만 */ }
    cleanupTable();
    exit();
  }

  function exit() {
    client.detachRoom({ forget: false }).catch(() => {});
    onExit?.();
  }

  return { leave };
}
