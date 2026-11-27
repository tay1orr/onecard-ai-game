// AI 대전 진행 — 엔진(규칙) · AI · 게임판 · 연출을 연출 순서표로 차례차례 돌린다
import gsap from 'gsap';
import { OneCardGame } from '../core/game-engine.js';
import { chooseAiMove } from '../core/ai-player.js';
import { chooseAiReaction } from '../core/ai-reactions.js';
import {
  loadPlayerProfile, recordMatchResult, rememberAiOpponent, rewardForLevel, selectAiOpponent, bonusMatchChance, claimRewardBox,
} from '../core/rating.js';
import { rankForPoints } from '../core/rank.js';
import { rollRewardBoxes, veteranBonus } from '../core/reward-box.js';
import { applyMissionEvents, missionEventsForCard, mergeUnlockedItems } from '../core/missions.js';
import { bonusChanceWithEvent, isOpeningEventActive, OPENING_EVENT } from '../core/season.js';
import { cosmeticById, DEFAULT_EQUIPPED } from '../core/cosmetics.js';
import { makeRival, pickLine } from '../data/characters.js';
import { normalizeNickname } from '../net/multiplayer-helpers.js';
import { wait, josa } from './dom.js';
import { openRewardBoxes } from './reward-boxes.js';
import { createTable } from './table.js';
import { createFx, preloadEffect } from './fx.js';
import { preloadVictory } from './victory.js';
import { createDirector } from './director.js';
import { createRivalController } from './rival.js';
import { mountToys } from './toys.js';
import { applyEquipped, lookFor } from './look-apply.js';
import { showVersus, runDice, closeVersus } from './intro.js';
import { pickSuit, showHistory, playHint, blockedReason } from './play-ui.js';
import { showResult } from './result.js';
import { showRankUp } from './rank.js';
import { setMusicScene } from './music.js';
import { confirmModal, toast } from './modal.js';
import { stickerPicker, showSticker } from './reactions.js';
import { play } from './sound.js';
import { settings } from './settings.js';

const SPECIAL = new Set(['2', 'A', 'J', '7', 'JOKER']);

export async function startAiMatch({ host, onExit, onFinished, openRules }) {
  let profile = loadPlayerProfile();
  const opponent = selectAiOpponent(profile.points, Math.random, profile.recentAiStars);
  const rival = makeRival(opponent); // 난이도(1~20단계)와 캐릭터를 따로 무작위로
  const myName = normalizeNickname(settings.get().nickname) || '나';
  const bonus = Math.random() < bonusChanceWithEvent(bonusMatchChance(profile.points));
  profile = rememberAiOpponent(profile, rival.level);
  const xpAtStart = profile.seasonXp;
  const rankAtStart = rankForPoints(profile.points); // 판이 끝나 단계가 올랐으면 결과 판 앞에 단계 오름 연출
  const matchId = `ai:${Date.now()}:${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
  const reward = rewardForLevel(rival.level) * (bonus ? 2 : 1);
  const avatar = cosmeticById(profile.equipped.avatar) || cosmeticById(DEFAULT_EQUIPPED.avatar);
  const startedAt = Date.now();
  let moves = 0;
  let busy = true;
  let ended = false;
  let stickerPanel = null;
  let finale = null; // 승리 · 패배 장면 — 나갈 때 계속 도는 움직임까지 걷는다
  let streak = 0; // 뽑지 않고 이어서 낸 횟수 — 카드 효과 세기에 쓴다
  const missionUnlocks = [];
  const missionDone = [];
  let missionPoints = 0;

  const director = createDirector();
  const game = new OneCardGame();
  game.reset(rival.key);

  const table = createTable({
    mode: 'ai',
    onPlay: (id, { blocked }) => (blocked ? toast(blockedReason(game), { anchor: table.hand }) : playerPlay(id)),
    onDraw: () => playerDraw(),
    onPileTap: () => showHistory(game.history, { nameOf: (player) => (player === 0 ? myName : rival.name) }),
    onExit: () => leave(),
    onRules: () => openRules?.(),
    onEmoteToggle: () => toggleStickers(),
  });
  const looks = applyEquipped(table.root, profile.equipped, { propsEl: table.sceneProps });
  const fx = createFx({ layer: table.fxLayer, root: table.root, director });
  preloadVictory(looks.victory, { rival: rival.portrait, me: avatar.portrait });
  preloadEffect(looks.effect);
  const rivalCtl = createRivalController(table, rival);
  host.replaceChildren(table.root);
  const toys = mountToys({ layer: table.toysLayer, equipped: profile.equipped, fx });

  table.setMatch({ title: `${rival.title} ${rival.name}`, sub: `이기면 +${reward}점`, bonus });
  table.setRival({ name: rival.name, aiLevel: rival.level, color: rival.color, portrait: rival.portrait, status: rival.blurb });
  table.setMe({ name: myName, portrait: avatar.portrait, points: profile.points, color: '#f2b544' });
  table.resetPile(null);
  table.setDeckCount(game.drawPile.length + 10);
  table.root.addEventListener('pointerdown', (event) => { if (event.target.closest('.fx-layer') && director.busy()) director.skip(); });

  // ── 소개
  const overlay = await showVersus({
    host: table.root,
    me: { name: myName, portrait: avatar.portrait, points: profile.points, color: '#f2b544' },
    rival, reward, bonus, eventName: isOpeningEventActive() ? `${OPENING_EVENT.name} 중, 경험치 2배` : '',
  });
  const first = await runDice({ overlay, rival, meName: myName });
  game.setStartingPlayer(first);
  await closeVersus(overlay);

  table.resetPile(game.topCard);
  await table.deal(game.hands[0], game.hands[1].length);
  table.setDeckCount(game.drawPile.length);
  rivalCtl.react('happy', 'intro');
  if (bonus) await fx.bonusStart();
  await fx.slab({ text: first === 0 ? '내가 먼저' : `${rival.name} 먼저`, color: first === 0 ? '#f2b544' : rival.color, ink: '#121a2b', size: 'm', tilt: -6, hold: 0.45 });
  nextTurn();

  // ── 차례
  function sync() {
    const myTurn = game.currentPlayer === 0 && game.winner === null;
    table.setTurn(game.winner !== null ? '' : myTurn ? 'me' : 'rival');
    table.setDeckCount(game.drawPile.length);
    table.setAttack(game.attackCount, game.topCard.rank === 'JOKER' && game.attackCount > 0);
    table.setActiveSuit(game.requestedSuit);
    table.setRivalCount(game.hands[1].length, { animate: false });
    table.setMyCount(game.hands[0].length);
    table.setHint(playHint({ attackCount: game.attackCount, topCard: game.topCard, freePlay: game.freePlay, activeSuit: game.activeSuit, requestedSuit: game.requestedSuit, myTurn, beginner: profile.games < 3 }));
    table.setMeStatus(myTurn ? (game.attackCount ? '공격을 막거나 받아요' : '내 차례') : '');
    table.setPlayable(myTurn ? game.playableCards(0).map((card) => card.id) : [], myTurn && !busy);
    table.setDeckEnabled(myTurn && !busy);
  }

  function nextTurn() {
    if (ended) return;
    if (game.winner !== null) return;
    if (game.currentPlayer === 0) {
      busy = false;
      sync();
    } else {
      busy = true;
      sync();
      aiTurn();
    }
  }

  function missions(events) {
    const result = applyMissionEvents(events);
    if (result.rewardDelta > 0) {
      missionPoints += result.rewardDelta;
      missionDone.push(...result.completedMissions);
      missionUnlocks.push(...(result.unlockedItems || []));
      toast(`미션 완료 +${result.rewardDelta}점`, { tone: 'good' });
      play('confirm', { volume: 0.6 });
    }
  }

  async function playerPlay(cardId) {
    if (busy || ended || game.currentPlayer !== 0) return;
    const card = game.hands[0].find((item) => item.id === cardId);
    if (!card || !game.isPlayable(card)) return;
    let suit = null;
    // 마지막 한 장인 7 은 이 카드로 이기므로 무늬를 묻지 않는다 — 규칙 엔진은 7에 무늬가 있어야 받아 줘서 카드 무늬를 그대로 넘긴다
    // (11-25 선생님: 마지막에 7을 내면 고르는 창이 뜨고 「undefined」가 나왔다)
    if (card.rank === '7' && game.hands[0].length === 1) suit = card.suit;
    else if (card.rank === '7') {
      busy = true;
      sync();
      suit = await pickSuit({ host: table.root, hand: game.hands[0].filter((item) => item.id !== cardId) });
      if (!suit) { busy = false; sync(); return; }
    }
    busy = true;
    sync();
    const result = game.playCard(0, cardId, suit);
    moves += 1;
    missions(missionEventsForCard(result.card, { idPrefix: `${matchId}:me:${moves}:${result.card.id}` }));
    await director.run(() => table.flyMine(cardId, card));
    await afterPlay(result, 0);
    if (result.type === 'win') return finish(0);
    nextTurn();
  }

  async function playerDraw() {
    if (busy || ended || game.currentPlayer !== 0) return;
    busy = true;
    sync();
    const result = game.drawCards(0);
    streak = 0;
    missions([{ id: `${matchId}:draw:${Date.now()}`, type: 'draw-card', amount: result.cards.length || 1 }]);
    await director.run(() => table.drawMine(result.cards, game.hands[0]));
    if (result.wasPenalty) {
      await director.run(() => fx.penalty({ zone: table.meZone, count: result.count, mine: true }));
      rivalCtl.react('happy', 'attack');
    }
    nextTurn();
  }

  async function aiTurn() {
    if (ended) return;
    rivalCtl.think(true);
    const speed = Number(settings.get().speed) || 1;
    await wait((520 + rival.tier * 110 + Math.random() * 380) / speed); // 센 단계일수록 조금 더 생각하는 척(옛 별로 친 값)
    rivalCtl.think(false);
    if (ended) return;
    const move = chooseAiMove(game, rival.key);
    if (move.type === 'draw') {
      const result = game.drawCards(1);
      await director.run(() => table.drawRival(result.count));
      if (result.wasPenalty) {
        await director.run(() => fx.penalty({ zone: table.rivalZone, count: result.count, mine: false }));
        rivalCtl.react('sad', 'hit');
      }
      nextTurn();
      return;
    }
    const card = game.hands[1].find((item) => item.id === move.cardId);
    const result = game.playCard(1, move.cardId, move.chosenSuit);
    await director.run(() => table.flyRival(card));
    await afterPlay(result, 1);
    if (result.type === 'win') return finish(1);
    nextTurn();
  }

  async function afterPlay(result, actor) {
    const mine = actor === 0;
    const card = result.card;
    sync();
    const at = table.rect.pile();
    // 카드 효과 — 보통 카드는 작게, 특수 카드 · 한 장 남음 · 연속 넷째부터는 조금 크게, 조커 · 큰 공격(+5 이상)은 크게. 상대가 낸 카드는 빛 테만
    const topCard = table.pile.lastElementChild;
    if (mine) {
      streak += 1;
      const tier = card.rank === 'JOKER' || game.attackCount >= 5 ? 'big' : SPECIAL.has(card.rank) || game.hands[0].length === 1 || streak >= 4 ? 'accent' : 'soft';
      fx.burst(looks.effect, at, { tier, onto: topCard });
    } else fx.burst(lookFor('effect-classic'), at, { tier: 'rival', onto: topCard });
    if (card.rank === 'JOKER') {
      await director.run(() => fx.jokerTime({ at, owner: mine ? 'me' : 'rival', card }));
      if (mine) rivalCtl.react('shock', 'joker'); else rivalCtl.react('smug', 'attack');
    } else if (card.rank === '2' || card.rank === 'A') {
      await director.run(() => fx.attack({ at, added: card.rank === '2' ? 2 : 3, total: game.attackCount, owner: mine ? 'me' : 'rival' }));
      if (mine) rivalCtl.react('angry', 'playerAttack'); else rivalCtl.react('smug', 'attack');
    } else if (card.rank === '7' && result.type !== 'win') { // 이긴 판은 바꾼 무늬가 없다(「undefined로 변경」이 떴다)
      await director.run(() => fx.suitChange({ at, suit: result.requestedSuit, medallion: table.root.querySelector('.suit-medallion') }));
    } else if (card.rank === 'J') {
      await director.run(() => fx.skip({ zone: mine ? table.rivalZone : table.meZone, portrait: mine ? table.rivalPortrait : null, owner: mine ? 'me' : 'rival' }));
    }
    if (result.type !== 'win' && game.hands[actor].length === 1) {
      if (mine) {
        missions([{ id: `${matchId}:onecard:${moves}`, type: 'one-card' }]);
        const last = table.hand.querySelector('.slot .card');
        await director.run(() => fx.oneCard({ zone: table.meZone, mine: true, color: '#f2b544', lastCard: last }));
        rivalCtl.react('shock', 'playerOnecard');
      } else {
        await director.run(() => fx.oneCard({ zone: table.rivalZone, color: rival.color }));
        rivalCtl.react('smug', 'onecard');
      }
    }
    sync();
  }

  // ── 스티커
  function toggleStickers() {
    if (stickerPanel) { stickerPanel.remove(); stickerPanel = null; return; }
    stickerPanel = stickerPicker({ onPick: (key) => sendSticker(key) });
    table.rivalZone.append(stickerPanel);
    gsap.fromTo(stickerPanel, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2 });
  }

  function sendSticker(key) {
    stickerPanel?.remove();
    stickerPanel = null;
    showSticker(table.meBubble, key);
    missions([{ id: `${matchId}:emote:${key}:${Date.now()}`, type: 'emote' }]);
    const reply = chooseAiReaction({ type: 'player-emote', emote: key }, rival.key);
    if (reply) setTimeout(() => { if (!ended) { showSticker(table.rivalBubble, reply); table.nudge(table.rivalImg, 0.8); } }, 700 + Math.random() * 500);
  }

  // ── 끝
  async function finish(winner) {
    if (ended) return;
    ended = true;
    busy = true;
    sync();
    table.setTurn('');
    await director.idle();
    const won = winner === 0;
    setMusicScene(null); // 승리 · 패배 잔음악이 들리게 배경음악은 줄여 끈다(로비 · 다음 판에서 다시)
    const xpBefore = xpAtStart;
    const rating = recordMatchResult({ won, opponentLevel: rival.level, mode: 'ai', matchId, bonusMultiplier: bonus ? 2 : 1 });
    const resultEvents = [
      { id: `${matchId}:result:game`, type: 'game', mode: 'ai', bonus },
      ...(won ? [{ id: `${matchId}:result:win`, type: 'win', mode: 'ai', opponentLevel: rival.level, bonus }] : []),
      ...(bonus ? [{ id: `${matchId}:result:bonus-match`, type: 'bonus-match', mode: 'ai' }] : []),
      ...(bonus && won ? [{ id: `${matchId}:result:bonus-win`, type: 'bonus-win', mode: 'ai', opponentLevel: rival.level }] : []),
    ];
    missions(resultEvents);
    const profileNow = loadPlayerProfile();
    // 이기면 상대의 진 대사는 승리 연출(2막)이 크게 말한다
    if (!won) rivalCtl.react('party', 'win');
    finale = won
      ? fx.victory({
        look: looks.victory,
        me: { portrait: avatar.portrait, el: table.meImg },
        rival: { portrait: rival.portrait, el: table.rivalImg, line: pickLine(rival, 'lose') },
        table: { root: table.root, pile: table.pile, rivalHand: table.rivalZone.querySelector('.rival-hand'), cards: game.hands[1] },
        title: '승리',
        sub: `${myName === '나' ? '' : `${myName} · `}${josa(rival.name, '을/를')} 이겼어요`,
      })
      : fx.defeat({ rival, portrait: table.rivalPortrait });
    await finale.timeline;
    // 보상 상자 — 내용은 지금 정해 두고, 고른 하나만 받는다(같은 판은 한 번만). 점수는 늘 있고, 판수가 쌓일수록 커진다
    const beforeBox = loadPlayerProfile();
    const boxes = rollRewardBoxes({ won, level: rival.level, bonus, games: beforeBox.games, owned: beforeBox.boxItems });
    const pickedBox = await openRewardBoxes({ host: table.root, boxes, won, veteran: veteranBonus(beforeBox.games), games: beforeBox.games });
    const claim = claimRewardBox({ matchId, box: pickedBox });
    const profileAfter = loadPlayerProfile();
    const box = claim.duplicate ? null : { delta: claim.delta, multiplier: claim.multiplier, rarity: pickedBox?.rarity, item: claim.item };
    const unlocked = mergeUnlockedItems([...(rating.unlockedItems || []), ...(claim.unlockedItems || [])], missionUnlocks);
    await showRankUp({ host: table.root, from: rankAtStart, to: rankForPoints(profileAfter.points), points: profileAfter.points });
    showResult({
      host: table.root, won, delta: rating.delta, bonus, profile: profileAfter, box,
      xpGained: profileNow.seasonXp - xpBefore, xpBefore, unlocked, missions: missionDone, missionPoints,
      stats: { time: Date.now() - startedAt, moves },
      subtitle: won ? `${rival.title} ${josa(rival.name, '을/를')} 이겼어요` : pickLine(rival, 'win'),
      primaryLabel: '다시 매칭',
      onPrimary: () => { cleanup(); onFinished?.({ again: true }); },
      onHome: () => { cleanup(); onFinished?.({ again: false }); },
    });
  }

  async function leave() {
    if (!ended && game.winner === null) {
      const ok = await confirmModal({ title: '대전에서 나갈까요?', message: '이번 판은 기록되지 않아요.', confirmLabel: '나가기', cancelLabel: '계속하기' });
      if (!ok) return;
    }
    cleanup();
    onExit?.();
  }

  function cleanup() {
    ended = true;
    finale?.finish();
    finale = null;
    director.reset();
    toys.destroy();
    table.destroy();
  }

  return { leave };
}
