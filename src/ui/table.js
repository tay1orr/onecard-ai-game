// 게임판 — AI 대전과 온라인이 함께 쓴다. 카드는 실제 자리에서 실제 자리로 움직인다.
import gsap from 'gsap';
import { h, stars as starText, formatNumber } from './dom.js';
import { cardBack, cardFace, cardLabel } from './cards.js';
import { fanLayout, sortHand } from '../core/hand-layout.js';
import { SUIT_NAMES, RED_SUITS, suitSvg } from './suits.js';
import { cut } from '../data/assets.js';
import { play } from './sound.js';
import { settings } from './settings.js';
import { rankBadge } from './rank.js';

const PILE_KEEP = 5;
const RIVAL_TOP = 16; // CSS .rival-card top 과 같게
const rand = (min, max) => min + Math.random() * (max - min);

function centerOf(el) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function createTable({ mode = 'ai', onPlay, onDraw, onPileTap, onExit, onRules, onEmoteToggle } = {}) {
  let handOrder = [];
  const handMap = new Map(); // id → { slot, card, data }
  let rivalBacks = [];
  let pileCards = [];
  let turn = '';
  let compact = false;
  let playableIds = new Set();
  let handEnabled = false;

  // ── 위: 나가기 · 경기 정보 · 단추
  const matchTitle = h('strong.match-title', {}, '');
  const matchSub = h('span.match-sub', {}, '');
  const bonusTag = h('span.match-bonus', { hidden: true }, '보너스판 2배');
  const top = h('header.game-top', {},
    h('button.icon-btn.exit-btn', { type: 'button', 'aria-label': '나가기', onClick: () => onExit?.() },
      h('span', { html: '<svg viewBox="0 0 24 24"><path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' })),
    h('div.match-info', {}, matchTitle, matchSub, bonusTag),
    h('div.top-actions', {},
      h('button.icon-btn', { type: 'button', 'aria-label': '규칙 보기', onClick: () => onRules?.() }, h('span', { html: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9M12 16.6v.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' })),
    ));

  // ── 상대
  const rivalImg = h('img.portrait-img', { alt: '', draggable: 'false' });
  const rivalBubble = h('div.bubble', { role: 'status', 'aria-live': 'polite' });
  const rivalName = h('strong.who-name', {}, '');
  const rivalStars = h('span.who-stars', {}, '');
  const rivalCount = h('b.count-chip', {}, '5');
  const rivalStatus = h('span.who-status', {}, '');
  const rivalPortrait = h('div.portrait', {}, h('div.portrait-disc'), rivalImg);
  const rivalHand = h('div.rival-hand', { 'aria-label': '상대 카드' });
  const rivalZone = h('section.zone.rival-zone', { 'aria-label': '상대' },
    h('div.who', {}, rivalPortrait, h('div.who-text', {}, h('div.who-line', {}, rivalName, rivalStars), rivalStatus), h('div.who-count', {}, rivalCount, h('small', {}, '장'))),
    rivalBubble,
    rivalHand,
    mode === 'online' || onEmoteToggle ? h('button.emote-toggle', { type: 'button', 'aria-label': '반응 보내기', onClick: () => onEmoteToggle?.() }, '반응') : null,
  );

  // ── 탁자
  const deckCount = h('b.deck-count', {}, '44');
  const deck = h('button.deck', { type: 'button', 'aria-label': '카드 한 장 뽑기', disabled: true, onClick: () => onDraw?.() },
    h('span.deck-stack', {}, cardBack(), cardBack(), cardBack()), deckCount);
  const pile = h('button.pile', { type: 'button', 'aria-label': '낸 카드 기록 보기', onClick: () => onPileTap?.() });
  const medallion = h('div.suit-medallion', { hidden: true }, h('span.medal-suit'), h('small.medal-name'));
  const attackValue = h('b.attack-value', {}, '+0');
  const attackMeter = h('div.attack-meter', { hidden: true, role: 'status', 'aria-live': 'assertive' }, h('small', {}, '공격'), attackValue);
  const hint = h('p.table-hint', { role: 'status', 'aria-live': 'polite' }, '');
  // 맵 장면 — 화면 전체 배경 사진(또는 시즌 1 그림) · 양옆 소품 · 조명. 탁자 뒤에 깔린다
  const sceneProps = h('div.scene-props');
  const sceneEl = h('div.scene', { 'aria-hidden': 'true' }, h('div.scene-photo'), sceneProps, h('div.scene-light'), h('div.scene-shade'));
  const toysLayer = h('div.toys-layer');
  const felt = h('div.felt', {},
    h('div.felt-light', { 'aria-hidden': 'true' }),
    h('div.pile-area', {}, deck, h('div.pile-wrap', {}, pile, medallion), attackMeter),
    hint, toysLayer);
  const tableWrap = h('div.table-wrap', {}, h('div.rim', {}, felt));

  // ── 나
  const meImg = h('img.portrait-img', { alt: '', draggable: 'false' });
  const meName = h('strong.who-name', {}, '나');
  const meStars = h('span.who-stars', {}, '');
  const meCount = h('b.count-chip', {}, '5');
  const meStatus = h('span.who-status', {}, '');
  const meBubble = h('div.bubble.me-bubble', { role: 'status' });
  const hand = h('div.hand', { role: 'group', 'aria-label': '내 카드' });
  const meZone = h('section.zone.me-zone', { 'aria-label': '나' },
    h('div.who', {}, h('div.portrait.small', {}, h('div.portrait-disc'), meImg), h('div.who-text', {}, h('div.who-line', {}, meName, meStars), meStatus), h('div.who-count', {}, meCount, h('small', {}, '장'))),
    meBubble,
    hand);

  const flyLayer = h('div.fly-layer', { 'aria-hidden': 'true' });
  const fxLayer = h('div.fx-layer', { 'aria-hidden': 'true' });
  const root = h('section.game', { dataset: { mode }, 'aria-label': '원카드 게임판' }, sceneEl, top, rivalZone, tableWrap, meZone, flyLayer, fxLayer);

  // ── 크기
  // 카드 폭은 실제 덱 크기로 잰다(CSS 변수 값은 clamp() 글자 그대로라 숫자로 못 쓴다)
  const cardWidth = () => deck.offsetWidth || 110;
  const measure = () => { compact = root.clientWidth < 760; };

  function placeFixed(el, center, width, height, rotation = 0) {
    el.style.left = `${center.x - width / 2}px`;
    el.style.top = `${center.y - height / 2}px`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    gsap.set(el, { x: 0, y: 0, rotation, scale: 1, transformOrigin: '50% 50%', transformPerspective: 900 });
  }

  function flight(el, from, to, { scale = 1, rotation = 0, arc = 60, duration = 0.42, ease = 'power2.inOut' } = {}) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return gsap.to(el, {
      keyframes: { x: [0, dx * 0.55, dx], y: [0, dy * 0.45 - arc, dy], ease: 'none' },
      rotation, scale, duration: settings.reduced() ? Math.min(duration, 0.18) : duration, ease,
    });
  }

  // ── 손패
  function layoutHand(animate = true) {
    measure();
    const cw = cardWidth();
    const positions = fanLayout(handOrder.length, hand.clientWidth || root.clientWidth, cw, { compact });
    handOrder.forEach((id, index) => {
      const entry = handMap.get(id);
      if (!entry) return;
      entry.slot.style.zIndex = String(index + 1);
      const pos = positions[index];
      if (animate) gsap.to(entry.slot, { x: pos.x, y: pos.y, rotation: pos.r, duration: 0.34, ease: 'power3.out', overwrite: 'auto' });
      else gsap.set(entry.slot, { x: pos.x, y: pos.y, rotation: pos.r });
    });
    return positions;
  }

  function makeSlot(card) {
    const button = cardFace(card, { tag: 'button' });
    const slot = h('div.slot', {}, button);
    attachCardInput(button, card.id);
    return { slot, card: button, data: card };
  }

  function attachCardInput(button, id) {
    let start = null;
    let dragging = false;
    button.addEventListener('pointerdown', (event) => {
      if (!handEnabled || button.disabled) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      dragging = false;
      button.setPointerCapture?.(event.pointerId);
    });
    button.addEventListener('pointermove', (event) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) > 9) dragging = true;
      if (dragging) gsap.set(button, { x: dx * 0.9, y: Math.min(dy, 24), rotation: dx * 0.04 });
    });
    const finish = (event) => {
      if (!start || event.pointerId !== start.id) return;
      const dy = event.clientY - start.y;
      const wasDrag = dragging;
      start = null;
      dragging = false;
      if (wasDrag && dy > -70) {
        gsap.to(button, { x: 0, y: 0, rotation: 0, duration: 0.25, ease: 'back.out(2)', clearProps: 'transform' });
        return;
      }
      gsap.set(button, { clearProps: 'transform' });
      tryPlay(id, button);
    };
    button.addEventListener('pointerup', finish);
    button.addEventListener('pointercancel', () => { start = null; dragging = false; gsap.to(button, { x: 0, y: 0, rotation: 0, duration: 0.2, clearProps: 'transform' }); });
    // 키보드(Enter · Space) — 포인터 클릭은 위에서 이미 처리
    button.addEventListener('click', (event) => { if (event.detail === 0) tryPlay(id, button); });
  }

  function tryPlay(id, button) {
    if (!handEnabled) return;
    if (!playableIds.has(id)) {
      play('error', { volume: 0.5 });
      gsap.fromTo(button, { x: -6 }, { x: 0, duration: 0.35, ease: 'elastic.out(2.4, .3)', clearProps: 'transform' });
      onPlay?.(id, { blocked: true });
      return;
    }
    onPlay?.(id, { blocked: false });
  }

  hand.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const buttons = handOrder.map((id) => handMap.get(id)?.card).filter(Boolean);
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    buttons[(index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length].focus();
  });

  function syncHand(cards, { animate = true, hiddenIds = new Set() } = {}) {
    const sorted = sortHand(cards);
    const ids = new Set(sorted.map((card) => card.id));
    for (const [id, entry] of handMap) {
      if (!ids.has(id)) { entry.slot.remove(); handMap.delete(id); }
    }
    sorted.forEach((card) => {
      if (handMap.has(card.id)) return;
      const entry = makeSlot(card);
      handMap.set(card.id, entry);
      hand.append(entry.slot);
      if (!hiddenIds.has(card.id) && animate) gsap.fromTo(entry.card, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.8)' });
    });
    handOrder = sorted.map((card) => card.id);
    hiddenIds.forEach((id) => handMap.get(id)?.slot.classList.add('is-incoming'));
    applyPlayable();
    return layoutHand(animate);
  }

  function applyPlayable() {
    handOrder.forEach((id) => {
      const entry = handMap.get(id);
      if (!entry) return;
      const playable = playableIds.has(id);
      entry.card.classList.toggle('is-playable', handEnabled && playable);
      entry.card.classList.toggle('is-dim', handEnabled && !playable);
      entry.card.disabled = !handEnabled;
      entry.card.setAttribute('aria-label', `${cardLabel(entry.data)}${handEnabled ? (playable ? ', 낼 수 있음' : ', 지금은 못 냄') : ''}`);
    });
  }

  // ── 상대 손패
  function layoutRival(animate = true) {
    const width = rivalHand.clientWidth || 320;
    const cw = cardWidth() * 0.6;
    const positions = fanLayout(rivalBacks.length, Math.min(width, cw * 10), cw, { compact: true, invert: true });
    rivalBacks.forEach((back, index) => {
      back.style.zIndex = String(index + 1);
      const pos = positions[index];
      // 맞은편 사람 카드라 뒷면이 거꾸로 보인다
      const props = { x: pos.x, y: pos.y, rotation: 180 + pos.r };
      if (animate) gsap.to(back, { ...props, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
      else gsap.set(back, props);
    });
  }

  function setRivalCount(count, { animate = true } = {}) {
    while (rivalBacks.length < count) {
      const back = cardBack();
      back.classList.add('rival-card');
      rivalHand.append(back);
      rivalBacks.push(back);
      if (animate) gsap.fromTo(back, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.25 });
    }
    while (rivalBacks.length > count) rivalBacks.pop().remove();
    rivalCount.textContent = String(count);
    layoutRival(animate);
  }

  // ── 더미
  function pushPile(card, rotation = rand(-9, 9)) {
    pile.querySelectorAll('.fx-token-seat').forEach((seat) => seat.remove()); // 앞 카드에 내려앉은 효과 조각(카드보다 위층) — 새 카드가 덮으므로 걷는다
    const el = cardFace(card);
    el.classList.add('pile-card');
    gsap.set(el, { xPercent: -50, yPercent: -50, x: rand(-5, 5), y: rand(-4, 4), rotation });
    pile.append(el);
    pileCards.push(el);
    while (pileCards.length > PILE_KEEP) pileCards.shift().remove();
    pile.setAttribute('aria-label', `맨 위 카드 ${cardLabel(card)}. 낸 카드 기록 보기`);
    return el;
  }

  function setTop(card) {
    const current = pileCards.at(-1);
    if (current?.dataset.id === card?.id) return;
    if (card) pushPile(card);
  }

  // ── 날아가는 카드
  async function flyMine(cardId, card) {
    const entry = handMap.get(cardId);
    const cw = cardWidth();
    const from = entry ? centerOf(entry.card) : centerOf(hand);
    const fromRotation = entry ? Number(gsap.getProperty(entry.slot, 'rotation')) || 0 : 0;
    if (entry) {
      entry.slot.remove();
      handMap.delete(cardId);
      handOrder = handOrder.filter((id) => id !== cardId);
      meCount.textContent = String(handOrder.length);
      layoutHand(true);
    }
    const fly = cardFace(card);
    fly.classList.add('flying');
    flyLayer.append(fly);
    placeFixed(fly, from, cw, cw * 1.4, fromRotation);
    const finalRotation = rand(-9, 9);
    play('slide', { volume: 0.55 });
    await flight(fly, from, centerOf(pile), { rotation: finalRotation + rand(-4, 4), arc: 70, duration: 0.42 });
    play('place');
    pushPile(card, finalRotation);
    fly.remove();
  }

  async function flyRival(card) {
    const cw = cardWidth();
    const source = rivalBacks.at(-1) || rivalHand;
    const from = centerOf(source);
    if (rivalBacks.length) {
      rivalBacks.pop().remove();
      rivalCount.textContent = String(rivalBacks.length);
      layoutRival(true);
    }
    const fly = h('div.flip-card.flying', {}, cardBack(), cardFace(card));
    flyLayer.append(fly);
    placeFixed(fly, from, cw, cw * 1.4, 180);
    gsap.set(fly, { scale: 0.62 });
    const finalRotation = rand(-9, 9);
    play('slide', { volume: 0.5, pan: 0.1 });
    const timeline = gsap.timeline();
    timeline.add(flight(fly, from, centerOf(pile), { rotation: finalRotation, arc: -30, duration: 0.5 }), 0);
    timeline.to(fly, { scale: 1, duration: 0.5, ease: 'power2.out' }, 0);
    timeline.to(fly, { rotationY: 180, duration: 0.32, ease: 'power2.inOut' }, 0.08);
    await timeline;
    play('place');
    pushPile(card, finalRotation);
    fly.remove();
  }

  // 손패 자리의 화면 위치(부채꼴 회전 축은 카드 아래 가운데)
  function slotCenter(pos, { invert = false, scale = 1, box = hand } = {}) {
    const rect = box.getBoundingClientRect();
    const height = cardWidth() * 1.4 * scale;
    const rad = (pos.r * Math.PI) / 180;
    // 상대 카드는 가운데를 축으로 돈다(뒤집혀 보이게 180도)
    if (invert) return { x: rect.left + rect.width / 2 + pos.x, y: rect.top + RIVAL_TOP + height / 2 + pos.y };
    const anySlot = box.querySelector('.slot');
    const slotBottom = anySlot ? parseFloat(getComputedStyle(anySlot).bottom) || 0 : 0;
    return { x: rect.left + rect.width / 2 + pos.x + Math.sin(rad) * height / 2, y: rect.bottom - slotBottom + pos.y - Math.cos(rad) * height / 2 };
  }

  // 내 손으로 뽑기 — 새 카드 자리를 먼저 잡고, 덱에서 그 자리로 날아와 뒤집힌다
  async function drawMine(newCards, allCards, { stagger = 0.11 } = {}) {
    const cw = cardWidth();
    const newIds = new Set(newCards.map((card) => card.id));
    const positions = syncHand(allCards, { animate: true, hiddenIds: newIds });
    meCount.textContent = String(allCards.length);
    const deckCenter = centerOf(deck);
    const flights = newCards.map((card, index) => {
      const entry = handMap.get(card.id);
      const pos = positions[handOrder.indexOf(card.id)];
      if (!entry || !pos) return Promise.resolve();
      const target = slotCenter(pos);
      const fly = h('div.flip-card.flying', {}, cardBack(), cardFace(card));
      flyLayer.append(fly);
      placeFixed(fly, deckCenter, cw, cw * 1.4, 0);
      gsap.set(fly, { opacity: 0 });
      const timeline = gsap.timeline({ delay: index * stagger });
      timeline.set(fly, { opacity: 1 });
      timeline.call(() => play('slide', { volume: 0.45, rate: 1.1 }));
      timeline.add(flight(fly, deckCenter, target, { rotation: pos.r, arc: 40, duration: 0.42 }));
      timeline.to(fly, { rotationY: 180, duration: 0.28, ease: 'power2.inOut' }, '<0.12');
      return timeline.then(() => {
        entry.slot.classList.remove('is-incoming');
        fly.remove();
      });
    });
    await Promise.all(flights);
    applyPlayable();
  }

  async function drawRival(count, { stagger = 0.09 } = {}) {
    const cw = cardWidth();
    const deckCenter = centerOf(deck);
    const startIndex = rivalBacks.length;
    setRivalCount(startIndex + count);
    const width = rivalHand.clientWidth || 320;
    const positions = fanLayout(rivalBacks.length, Math.min(width, cw * 0.6 * 10), cw * 0.6, { compact: true, invert: true });
    const flights = Array.from({ length: count }, (_, index) => {
      const back = rivalBacks[startIndex + index];
      const pos = positions[startIndex + index];
      if (!back || !pos) return Promise.resolve();
      back.style.visibility = 'hidden';
      const target = slotCenter(pos, { invert: true, scale: 0.6, box: rivalHand });
      const fly = cardBack();
      fly.classList.add('flying');
      flyLayer.append(fly);
      placeFixed(fly, deckCenter, cw, cw * 1.4, 0);
      gsap.set(fly, { opacity: 0 });
      const timeline = gsap.timeline({ delay: index * stagger });
      timeline.set(fly, { opacity: 1 });
      timeline.call(() => play('slide', { volume: 0.4, rate: 1.15, pan: 0.2 }));
      timeline.add(flight(fly, deckCenter, target, { rotation: 180 + pos.r, scale: 0.6, arc: 30, duration: 0.38 }));
      return timeline.then(() => { back.style.visibility = ''; fly.remove(); });
    });
    await Promise.all(flights);
  }

  // 처음 나누기 — 상대 · 나 번갈아 다섯 장씩, 실제 자리로
  async function deal(myCards, rivalTotal) {
    syncHand([], { animate: false });
    setRivalCount(0, { animate: false });
    meCount.textContent = '0';
    play('shuffle');
    await gsap.fromTo(deck, { rotation: -6 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(1.4, .35)' });
    const mine = sortHand(myCards);
    for (let index = 0; index < Math.max(mine.length, rivalTotal); index += 1) {
      if (index < rivalTotal) drawRival(1, { stagger: 0 });
      await new Promise((resolve) => setTimeout(resolve, settings.reduced() ? 20 : 90));
      if (index < mine.length) drawMine([mine[index]], mine.slice(0, index + 1), { stagger: 0 });
      await new Promise((resolve) => setTimeout(resolve, settings.reduced() ? 20 : 110));
    }
    await new Promise((resolve) => setTimeout(resolve, 480));
    handOrder.forEach((id) => handMap.get(id)?.slot.classList.remove('is-incoming'));
    play('fan');
  }

  // ── 바깥에서 부르는 것
  const api = {
    root, fxLayer, flyLayer, felt, sceneProps, toysLayer, deck, pile, hand, rivalZone, meZone, rivalPortrait, rivalBubble, meBubble,
    rivalImg, meImg,
    setMatch({ title, sub, bonus }) {
      matchTitle.textContent = title || '';
      matchSub.textContent = sub || '';
      bonusTag.hidden = !bonus;
    },
    // starsCount = AI 상대 난이도(★1~★8) · rankPoints = 친구(사람)의 점수 — 사람은 내 단계와 같은 그림으로
    setRival({ name, starsCount, rankPoints, color, portrait, status }) {
      rivalName.textContent = name;
      if (rankPoints != null) rivalStars.replaceChildren(rankBadge(rankPoints));
      else rivalStars.textContent = starsCount ? starText(starsCount) : '';
      rivalStatus.textContent = status || '';
      rivalZone.style.setProperty('--who-color', color);
      rivalImg.src = cut(portrait);
    },
    setRivalStatus(text) { rivalStatus.textContent = text || ''; },
    setMe({ name = '나', portrait, points, color }) {
      meName.textContent = name;
      meStars.replaceChildren(...(points != null ? [rankBadge(points), ` ${formatNumber(points)}점`] : []));
      meImg.src = cut(portrait);
      if (color) meZone.style.setProperty('--who-color', color);
    },
    setMeStatus(text) { meStatus.textContent = text || ''; },
    syncHand,
    setPlayable(ids, enabled) {
      playableIds = new Set(ids);
      handEnabled = enabled;
      applyPlayable();
    },
    setRivalCount,
    setMyCount(count) { meCount.textContent = String(count); },
    setTop,
    resetPile(card) {
      pileCards.forEach((el) => el.remove());
      pileCards = [];
      if (card) pushPile(card, rand(-6, 6));
    },
    setDeckCount(count) { deckCount.textContent = String(count); },
    setDeckEnabled(enabled) { deck.disabled = !enabled; deck.classList.toggle('is-ready', enabled); },
    setAttack(count, joker = false) {
      attackMeter.hidden = !count;
      attackMeter.classList.toggle('is-joker', joker);
      attackValue.textContent = `+${count}`;
    },
    setActiveSuit(suit) {
      medallion.hidden = !suit;
      if (!suit) return;
      medallion.classList.toggle('is-red', RED_SUITS.has(suit));
      medallion.querySelector('.medal-suit').innerHTML = suitSvg(suit);
      medallion.querySelector('.medal-name').textContent = SUIT_NAMES[suit];
    },
    setHint(text) { hint.textContent = text || ''; },
    setTurn(next) {
      turn = next || '';
      root.dataset.turn = turn;
    },
    get turn() { return turn; },
    flyMine, flyRival, drawMine, drawRival, deal,
    layout() { layoutHand(false); layoutRival(false); },
    // 초상이 반응하듯 살짝 들썩 — 실사 초상이라 표정 대신 몸짓으로
    nudge(el, power = 1) {
      if (settings.reduced()) return;
      gsap.fromTo(el, { y: 0, rotation: 0 }, { y: -7 * power, rotation: 3 * power, duration: 0.16, yoyo: true, repeat: 3, ease: 'sine.inOut', clearProps: 'transform' });
    },
    rect: { deck: () => centerOf(deck), pile: () => centerOf(pile), rival: () => centerOf(rivalPortrait), me: () => centerOf(hand) },
    cardWidth,
  };

  const resizeObserver = new ResizeObserver(() => { layoutHand(false); layoutRival(false); });
  resizeObserver.observe(root);
  api.destroy = () => resizeObserver.disconnect();
  return api;
}
