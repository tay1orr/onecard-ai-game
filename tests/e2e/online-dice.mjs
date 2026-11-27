// 친구와 대전 주사위 시험 — 진짜 서버에는 닿지 않는다.
// Supabase 요청(로그인 · RPC)과 실시간 연결을 모두 이 파일 안의 가짜 서버가 받는다(SQL 과 같은 규칙을 짧게 옮김).
// 안전장치: 브라우저가 supabase.co 를 127.0.0.1 로 찾게 해서, 혹시 새는 요청이 있어도 밖으로 나가지 않는다.
//  1) 같은 눈 → 두 사람 모두 「다시 굴리기」가 켜진다(11-25 고침 전에는 둘 다 잠겨 갇혔다)
//  2) 같은 눈 방에 다시 들어와도(새로 고침 → 친구와 대전) 「다시 굴리기」가 켜져 있다
//  3) 다시 굴려 게임이 시작된다(두 사람 모두 패 다섯 장)
//  4) 주사위 화면에서 나가기 → 나간 사람은 로비, 남은 사람은 알림 뒤 로비 · 승패 기록 없음
// node tests/e2e/online-dice.mjs [--mobile] [--dist=<빌드 폴더>]   (먼저 npm run build)
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mobile = process.argv.includes('--mobile');
const dist = (process.argv.find((arg) => arg.startsWith('--dist=')) || '').slice(7) || path.join(root, 'dist');
const PORT = 4199;
const BASE = `http://127.0.0.1:${PORT}/`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = path.join(root, 'tests/e2e/_shots');
const tag = mobile ? 'm' : 'd';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── 가짜 서버(방 · 사건 · 주사위)
const users = new Map(); // 토큰 → uid
const rooms = new Map();
const hidden = new Map(); // 방 → 패 · 덱
const events = [];
const sockets = new Set();
const leaked = [];
let nextEvent = 1;
let nextBinding = 100;
let diceQueue = [];
const rpcLog = [];
const rpcErrors = [];

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
function signUp() {
  const uid = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: uid, role: 'authenticated', aud: 'authenticated', exp, is_anonymous: true })}.mock`;
  users.set(token, uid);
  const now = new Date().toISOString();
  return { access_token: token, token_type: 'bearer', expires_in: 86400 * 30, expires_at: exp, refresh_token: `refresh-${uid}`, user: { id: uid, aud: 'authenticated', role: 'authenticated', email: '', phone: '', app_metadata: { provider: 'anonymous', providers: [] }, user_metadata: {}, identities: [], created_at: now, updated_at: now, is_anonymous: true } };
}
class Raise extends Error {}
const raise = (code) => { throw new Raise(code); };
const seatOf = (room, uid) => (room.host_id === uid ? 0 : room.guest_id === uid ? 1 : raise('ROOM_NOT_FOUND'));
const roomFor = (id, uid) => { const room = rooms.get(id); if (!room) raise('ROOM_NOT_FOUND'); seatOf(room, uid); return room; };
function addEvent(room, seat, type, payload = {}) { events.push({ id: nextEvent++, room_id: room.id, actor_seat: seat, event_type: type, payload, created_at: new Date().toISOString() }); }
function bump(room) { room.version += 1; pushRoom(room, 'UPDATE'); }

function viewOf(room, uid) {
  const seat = seatOf(room, uid);
  const secret = hidden.get(room.id) || {};
  const last = [...events].reverse().find((event) => event.room_id === room.id);
  const player = (prefix) => ({ nickname: room[`${prefix}_nickname`], ready: room[`${prefix}_ready`], die: room[`${prefix}_die`], count: room[`${prefix}_count`], wins: room[`${prefix}_wins`], rating: room[`${prefix}_rating`], cardBack: room[`${prefix}_card_back`], connected: true });
  return {
    roomId: room.id, code: room.code, status: room.status, mySeat: seat, version: room.version, roundNo: room.round_no,
    bonusMultiplier: room.bonus_multiplier, currentSeat: room.current_seat, activeSuit: room.active_suit, attackCount: room.attack_count,
    freePlay: room.free_play, topCard: room.top_card, drawCount: (secret.draw || []).length, winnerSeat: room.winner_seat, diceTie: room.dice_tie,
    host: player('host'), guest: room.guest_id ? player('guest') : null,
    myHand: (seat === 0 ? secret.host : secret.guest) || [],
    lastEvent: last ? { id: last.id, eventType: last.event_type, actorSeat: last.actor_seat, payload: last.payload, createdAt: last.created_at } : null,
  };
}

function startGame(room, first) {
  const suits = ['hearts', 'diamonds', 'spades', 'clubs'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = suits.flatMap((suit) => ranks.map((rank) => ({ id: `${suit}-${rank}`, suit, rank })));
  deck.push({ id: 'joker-1', suit: 'joker', rank: 'JOKER' }, { id: 'joker-2', suit: 'joker', rank: 'JOKER' });
  for (let index = deck.length - 1; index > 0; index -= 1) { const other = (index * 7919 + 13) % (index + 1); [deck[index], deck[other]] = [deck[other], deck[index]]; }
  const host = deck.slice(0, 5);
  const guest = deck.slice(5, 10);
  const rest = deck.slice(10);
  const topIndex = rest.findIndex((card) => !['A', '2', '7', 'J', 'Q', 'K', 'JOKER'].includes(card.rank));
  const [top] = rest.splice(topIndex, 1);
  hidden.set(room.id, { host, guest, draw: rest });
  Object.assign(room, { status: 'playing', current_seat: first, round_no: room.round_no + 1, active_suit: top.suit, attack_count: 0, free_play: false, top_card: top, host_count: 5, guest_count: 5, winner_seat: null, dice_tie: false, bonus_multiplier: 1, host_ready: false, guest_ready: false });
}

// 방 코드 — 진짜 서버(onecard_random_code)와 같은 글자. 앱은 헷갈리는 I · O · 0 · 1 을 받지 않아, 이 글자가 섞이면 손님이 못 들어간다(11-25 시험이 네 판에 한 번꼴로 멈췄다)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RPC = {
  onecard_create_room(uid, { p_nickname }) {
    const room = { id: crypto.randomUUID(), code: Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(''), status: 'waiting', host_id: uid, guest_id: null, host_nickname: p_nickname, guest_nickname: null, host_ready: false, guest_ready: false, host_die: null, guest_die: null, dice_tie: false, host_wins: 0, guest_wins: 0, host_rating: 0, guest_rating: 0, host_card_back: 'back-classic', guest_card_back: 'back-classic', host_count: 0, guest_count: 0, current_seat: null, active_suit: null, attack_count: 0, free_play: false, top_card: null, winner_seat: null, bonus_multiplier: 1, round_no: 0, version: 1 };
    rooms.set(room.id, room);
    addEvent(room, 0, 'room_created');
    return viewOf(room, uid);
  },
  onecard_join_room(uid, { p_code, p_nickname }) {
    const room = [...rooms.values()].find((entry) => entry.code === p_code) || raise('ROOM_NOT_FOUND');
    if (room.guest_id && room.guest_id !== uid) raise('ROOM_FULL');
    Object.assign(room, { guest_id: uid, guest_nickname: p_nickname });
    addEvent(room, 1, 'joined');
    bump(room);
    return viewOf(room, uid);
  },
  onecard_set_rating(uid, { p_room_id, p_rating }) { const room = roomFor(p_room_id, uid); room[seatOf(room, uid) ? 'guest_rating' : 'host_rating'] = p_rating; bump(room); return viewOf(room, uid); },
  onecard_set_card_back(uid, { p_room_id, p_card_back }) { const room = roomFor(p_room_id, uid); room[seatOf(room, uid) ? 'guest_card_back' : 'host_card_back'] = p_card_back; bump(room); return viewOf(room, uid); },
  onecard_ping(uid, { p_room_id }) { roomFor(p_room_id, uid); return { ok: true }; },
  onecard_get_view(uid, { p_room_id }) { return viewOf(roomFor(p_room_id, uid), uid); },
  onecard_set_ready(uid, { p_room_id }) {
    const room = roomFor(p_room_id, uid);
    if (!room.guest_id) raise('WAITING_FOR_GUEST');
    if (room.status !== 'waiting') raise('ROOM_ALREADY_STARTED');
    const key = seatOf(room, uid) ? 'guest_ready' : 'host_ready';
    room[key] = !room[key];
    if (room.host_ready && room.guest_ready) Object.assign(room, { status: 'dice', bonus_multiplier: 1 });
    addEvent(room, seatOf(room, uid), 'ready_changed', { ready: room[key] });
    bump(room);
    return viewOf(room, uid);
  },
  onecard_roll_dice(uid, { p_room_id }) {
    const room = roomFor(p_room_id, uid);
    if (room.status !== 'dice') raise('NOT_DICE_PHASE');
    const seat = seatOf(room, uid);
    if (room.dice_tie && room.host_die != null && room.guest_die != null) Object.assign(room, { host_die: null, guest_die: null, dice_tie: false });
    if (room[seat ? 'guest_die' : 'host_die'] != null) raise('DIE_ALREADY_ROLLED');
    const die = diceQueue.length ? diceQueue.shift() : 1 + Math.floor(Math.random() * 6);
    room[seat ? 'guest_die' : 'host_die'] = die;
    room.version += 1;
    addEvent(room, seat, 'dice_roll', { value: die });
    if (room.host_die != null && room.guest_die != null) {
      if (room.host_die === room.guest_die) {
        room.dice_tie = true;
        addEvent(room, null, 'dice_tie', { host: room.host_die, guest: room.guest_die });
      } else {
        const first = room.host_die > room.guest_die ? 0 : 1;
        startGame(room, first);
        addEvent(room, null, 'game_started', { hostDie: room.host_die, guestDie: room.guest_die, firstSeat: first, bonusMultiplier: 1 });
      }
    }
    bump(room);
    return viewOf(room, uid);
  },
  onecard_leave_room(uid, { p_room_id }) {
    const room = rooms.get(p_room_id);
    if (!room || (room.host_id !== uid && room.guest_id !== uid)) return { left: true };
    const seat = seatOf(room, uid);
    if (['playing', 'dice'].includes(room.status) && room.guest_id) {
      Object.assign(room, { status: 'finished', winner_seat: 1 - seat, host_ready: false, guest_ready: false });
      if (room.status === 'playing') room[seat ? 'host_wins' : 'guest_wins'] += 1;
      addEvent(room, seat, 'left');
      bump(room);
    } else if (seat === 1) {
      Object.assign(room, { guest_id: null, guest_nickname: null, guest_ready: false, guest_die: null, guest_rating: 0, guest_card_back: 'back-classic', host_ready: false, host_die: null, status: 'waiting', dice_tie: false, host_wins: 0, guest_wins: 0, bonus_multiplier: 1 });
      bump(room);
    } else {
      rooms.delete(room.id);
      pushRoom(room, 'DELETE');
    }
    return { left: true };
  },
};

// 실시간 — Phoenix 채널(vsn 2.0.0: [join_ref, ref, topic, event, payload])
function pushRoom(room, type) {
  const record = { id: room.id, version: room.version, status: room.status, host_last_seen: new Date().toISOString(), guest_last_seen: new Date().toISOString() };
  const columns = [{ name: 'id', type: 'uuid' }, { name: 'version', type: 'int4' }, { name: 'status', type: 'text' }, { name: 'host_last_seen', type: 'timestamptz' }, { name: 'guest_last_seen', type: 'timestamptz' }];
  for (const socket of sockets) {
    for (const [topic, joined] of socket.topics) {
      for (const binding of joined.bindings) {
        if (binding.table !== 'onecard_rooms' || binding.filter !== `id=eq.${room.id}`) continue;
        socket.ws.send(JSON.stringify([joined.joinRef, null, topic, 'postgres_changes', { ids: [binding.id], data: { schema: 'public', table: 'onecard_rooms', commit_timestamp: new Date().toISOString(), type, record: type === 'DELETE' ? {} : record, old_record: { id: room.id }, columns, errors: null } }]));
      }
    }
  }
}

async function wire(context) {
  const cors = (request) => ({ 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS', 'access-control-allow-headers': request.headers()['access-control-request-headers'] || 'authorization, apikey, content-type, x-client-info', 'access-control-expose-headers': 'content-range' });
  await context.route(/supabase\.co/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (status, body) => route.fulfill({ status, headers: { ...cors(request), 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors(request), body: '' });
    if (url.pathname === '/auth/v1/signup') return json(200, signUp());
    const token = (request.headers().authorization || '').replace(/^Bearer\s+/i, '');
    if (url.pathname === '/auth/v1/user') { const uid = users.get(token); return uid ? json(200, { id: uid, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {} }) : json(401, { message: 'no user' }); }
    if (url.pathname.startsWith('/auth/v1/')) return json(200, {});
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
    if (rpc) {
      const handler = RPC[rpc[1]];
      const uid = users.get(token);
      if (!handler || !uid) return json(404, { code: 'PGRST202', message: `mock: ${rpc[1]} 없음`, details: null, hint: null });
      rpcLog.push(rpc[1]);
      try { return json(200, handler(uid, JSON.parse(request.postData() || '{}'))); } catch (error) {
        if (error instanceof Raise) { rpcErrors.push(`${rpc[1]}:${error.message}`); return json(400, { code: 'P0001', message: error.message, details: null, hint: null }); }
        throw error;
      }
    }
    if (url.pathname.startsWith('/rest/v1/')) return json(request.method() === 'GET' ? 200 : 201, []);
    leaked.push(request.url());
    return json(404, { message: 'mock: 모르는 요청' });
  });
  await context.routeWebSocket(/supabase\.co/, (ws) => {
    const socket = { ws, topics: new Map() };
    sockets.add(socket);
    ws.onMessage((raw) => {
      let message;
      try { message = JSON.parse(String(raw)); } catch { return; }
      const [joinRef, ref, topic, event, payload] = message;
      const reply = (response = {}) => ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response }]));
      if (event === 'phx_join') {
        const bindings = (payload?.config?.postgres_changes || []).map((binding) => ({ ...binding, id: nextBinding++ }));
        socket.topics.set(topic, { joinRef, bindings });
        reply({ postgres_changes: bindings.map(({ id, event: kind, schema, table, filter }) => ({ id, event: kind, schema, table, filter })) });
      } else if (event === 'phx_leave') { socket.topics.delete(topic); reply(); } else if (event !== 'access_token' && ref) reply();
    });
    ws.onClose(() => sockets.delete(socket));
  });
}

// ── 화면
const results = [];
const check = (ok, label) => { results.push({ ok, label }); console.log(`${ok ? '통과' : '실패'} ${label}`); };
const diceState = (page) => page.evaluate(() => {
  const button = document.querySelector('.versus.is-online .dice-btn');
  return button ? { disabled: button.disabled, text: button.textContent, note: document.querySelector('.versus.is-online .dice-note')?.textContent, mine: document.querySelector('.dice-value.mine')?.textContent, theirs: document.querySelector('.dice-value.theirs')?.textContent, back: Boolean(document.querySelector('.versus.is-online .dice-top .icon-btn')) } : null;
});

async function player(browser, name, points = null) {
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' }
    : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, locale: 'ko-KR' });
  await context.addInitScript(({ nickname, points: seedPoints }) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    if (!localStorage.getItem('onecard-s2-settings')) localStorage.setItem('onecard-s2-settings', JSON.stringify({ seenOpening: true, sound: false, speed: 2, effects: 'full', nickname }));
    localStorage.setItem('onecard-s2-gift-shown', '1');
    // 점수를 정해 두는 사람(대기실 모습 찍기) — 처음 한 번만
    if (seedPoints != null && !localStorage.getItem('onecard-player-profile-v2')) localStorage.setItem('onecard-player-profile-v2', JSON.stringify({ version: 4, seasonId: 's2', points: seedPoints, peakPoints: seedPoints, wins: 120, games: 200 }));
  }, { nickname: name, points });
  await wire(context);
  const page = await context.newPage();
  page.on('pageerror', (error) => console.log(`[${name}] 화면 오류: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') console.log(`[${name}] 콘솔 오류: ${message.text().slice(0, 300)}`); });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('.lobby', { timeout: 20000 });
  return { context, page, name };
}
async function openFriend(page) {
  await page.click('.lobby-actions .play-btn:not(.is-primary)');
  await page.waitForSelector('.online-entry, .room, .versus.is-online', { timeout: 15000 });
}
const press = (page, selector) => (mobile ? page.tap(selector) : page.click(selector));
const gamesPlayed = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('onecard-player-profile-v2') || '{}').games || 0);

async function pairUp(browser, hostName, guestName) {
  const host = await player(browser, hostName);
  const guest = await player(browser, guestName);
  await openFriend(host.page);
  await press(host.page, '.online-entry .entry-col .btn.primary');
  await host.page.waitForSelector('.room .room-code', { timeout: 15000 });
  const code = await host.page.evaluate(() => [...document.querySelectorAll('.room .room-code b')].map((el) => el.textContent).join(''));
  await openFriend(guest.page);
  await guest.page.fill('.online-entry .code-input', code);
  await press(guest.page, '.online-entry .btn.ghost');
  await guest.page.waitForSelector('.room', { timeout: 15000 });
  await host.page.waitForFunction(() => !document.querySelector('.room .btn.primary')?.disabled, null, { timeout: 15000 });
  await press(host.page, '.room .btn.primary');
  await sleep(400);
  await press(guest.page, '.room .btn.primary');
  await host.page.waitForSelector('.versus.is-online .dice-btn', { timeout: 15000 });
  await guest.page.waitForSelector('.versus.is-online .dice-btn', { timeout: 15000 });
  return { host, guest, code };
}

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--outDir', dist, '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 80; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* 기다림 */ } await sleep(250); }
  browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--host-resolver-rules=MAP *.supabase.co 127.0.0.1, MAP supabase.co 127.0.0.1'] });

  // 0) 대기실 모습 — 두 자리가 한 줄(방장 · VS · 손님), 단계 그림은 작게 칸 안에, 화면이 옆으로 넘치지 않음
  //    (11-27 선생님 휴대폰 사진: 569,515점 방장 · 36,280점 손님 — 왕관 · 별 다섯이 84px 로 커져 칸 밖으로, 손님 칸은 아래로 떨어짐)
  {
    const roomHost = await player(browser, 'bella', 569515);
    const roomGuest = await player(browser, '서냇', 36280);
    await openFriend(roomHost.page);
    await press(roomHost.page, '.online-entry .entry-col .btn.primary');
    await roomHost.page.waitForSelector('.room .room-code', { timeout: 15000 });
    const roomCode = await roomHost.page.evaluate(() => [...document.querySelectorAll('.room .room-code b')].map((el) => el.textContent).join(''));
    await openFriend(roomGuest.page);
    await roomGuest.page.fill('.online-entry .code-input', roomCode);
    await press(roomGuest.page, '.online-entry .btn.ghost');
    await roomGuest.page.waitForFunction(() => document.querySelectorAll('.room .seat .seat-rank img').length >= 2, null, { timeout: 15000 });
    const roomLayout = (page) => page.evaluate(() => {
      const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, width: r.width }; };
      const seats = [...document.querySelectorAll('.room .seat')].map(box);
      const icons = [...document.querySelectorAll('.room .seat-rank img')].map(box);
      return {
        seats, view: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
        maxIcon: Math.max(...icons.map((icon) => icon.width)),
        inside: icons.every((icon) => seats.some((seat) => icon.left >= seat.left - 0.5 && icon.right <= seat.right + 0.5)),
        texts: [...document.querySelectorAll('.room .seat')].map((el) => el.innerText.replace(/\s+/g, ' ')),
      };
    });
    for (const width of mobile ? [360, 390, 412] : [1280]) {
      if (mobile) await roomGuest.page.setViewportSize({ width, height: 844 });
      await sleep(400);
      const layout = await roomLayout(roomGuest.page);
      const [left, right] = layout.seats;
      check(layout.seats.length === 2 && Math.abs(left.top - right.top) < 1 && left.right < right.left, `[${width}] 대기실 두 자리가 한 줄 — ${JSON.stringify(layout.seats.map((seat) => [Math.round(seat.left), Math.round(seat.right), Math.round(seat.top)]))}`);
      check(layout.maxIcon <= 26 && layout.inside, `[${width}] 단계 그림은 작게(가장 큰 ${Math.round(layout.maxIcon)}px) 칸 안에`);
      check(layout.scroll <= layout.view, `[${width}] 화면이 옆으로 넘치지 않음(${layout.scroll} / ${layout.view})`);
      check(layout.texts[0].includes('569,515점') && layout.texts[1].includes('36,280점') && layout.texts.every((text) => text.includes('준비 전')), `[${width}] 점수 · 준비 상태 — ${layout.texts.join(' | ')}`);
      await roomGuest.page.screenshot({ path: path.join(SHOTS, `${tag}-online-room-${width}.png`) });
    }
    await press(roomGuest.page, '.room .btn.primary');
    await roomHost.page.waitForFunction(() => document.querySelector('.room .seat.is-ready .seat-state')?.textContent === '준비 완료', null, { timeout: 15000 });
    await sleep(300);
    await roomHost.page.screenshot({ path: path.join(SHOTS, `${tag}-online-room-ready.png`) });
    check(true, '손님이 준비하면 방장 화면의 손님 칸에 준비 완료');
    await roomHost.context.close();
    await roomGuest.context.close();
  }

  // 1 ~ 3) 같은 눈 → 다시 굴리기 → 다시 들어와도 켜짐 → 게임 시작
  const first = await pairUp(browser, '장미여왕', '케로로');
  diceQueue = [4, 4, 2, 5];
  await press(first.host.page, '.versus.is-online .dice-btn');
  await sleep(1400);
  const hostWaiting = await diceState(first.host.page);
  check(hostWaiting?.disabled === true && hostWaiting.mine === '4', `굴린 사람은 상대를 기다림(단추 잠김 · 내 눈 4) — ${JSON.stringify(hostWaiting)}`);
  check(hostWaiting?.back === true, '주사위 화면에 나가기 단추가 있음');
  await press(first.guest.page, '.versus.is-online .dice-btn');
  await sleep(1600);
  const tieHost = await diceState(first.host.page);
  const tieGuest = await diceState(first.guest.page);
  await first.host.page.screenshot({ path: path.join(SHOTS, `${tag}-online-dice-tie.png`) });
  check(tieHost && !tieHost.disabled && tieHost.text === '다시 굴리기', `같은 눈 — 방장 「다시 굴리기」 켜짐 — ${JSON.stringify(tieHost)}`);
  check(tieGuest && !tieGuest.disabled && tieGuest.text === '다시 굴리기', `같은 눈 — 손님 「다시 굴리기」 켜짐 — ${JSON.stringify(tieGuest)}`);
  // 다시 들어오기(앱을 나갔다 들어옴) — 같은 방 · 같은 눈 화면, 단추가 켜져 있어야
  await first.host.page.reload({ waitUntil: 'load' });
  await first.host.page.waitForSelector('.lobby', { timeout: 20000 });
  await openFriend(first.host.page);
  await first.host.page.waitForSelector('.versus.is-online .dice-btn', { timeout: 15000 });
  await sleep(1600);
  const back = await diceState(first.host.page);
  check(back && !back.disabled && back.text === '다시 굴리기', `다시 들어와도 「다시 굴리기」 켜짐 — ${JSON.stringify(back)}`);
  await press(first.host.page, '.versus.is-online .dice-btn');
  await sleep(1600);
  const rerollHost = await diceState(first.host.page);
  const rerollGuest = await diceState(first.guest.page);
  check(rerollHost?.disabled === true && rerollHost.mine === '2' && !rerollHost.theirs, `다시 굴린 방장은 기다림(내 눈 2 · 상대 눈 지워짐) — ${JSON.stringify(rerollHost)}`);
  check(rerollGuest && !rerollGuest.disabled && !rerollGuest.mine && rerollGuest.theirs === '2', `손님은 새로 굴릴 수 있음(내 눈 지워짐 · 상대 2) — ${JSON.stringify(rerollGuest)}`);
  await press(first.guest.page, '.versus.is-online .dice-btn');
  for (const who of [first.host, first.guest]) {
    const started = await who.page.waitForFunction(() => !document.querySelector('.versus.is-online') && document.querySelectorAll('.hand .slot').length === 5, null, { timeout: 20000 }).then(() => true, () => false);
    check(started, `${who.name}: 주사위가 끝나고 게임 시작(패 다섯 장)`);
  }
  await first.guest.page.screenshot({ path: path.join(SHOTS, `${tag}-online-dice-started.png`) });
  await first.host.context.close();
  await first.guest.context.close();

  // 4) 주사위 화면에서 나가기
  const second = await pairUp(browser, '장미여왕', '쿠로미');
  const gamesBefore = await gamesPlayed(second.host.page);
  await second.guest.page.screenshot({ path: path.join(SHOTS, `${tag}-online-dice-screen.png`) });
  await press(second.guest.page, '.versus.is-online .dice-top .icon-btn');
  await second.guest.page.waitForSelector('.modal-card.is-confirm', { timeout: 8000 });
  await sleep(500); // 창이 다 나타난 뒤 찍기
  await second.guest.page.screenshot({ path: path.join(SHOTS, `${tag}-online-dice-leave-confirm.png`) });
  await press(second.guest.page, '.modal-card.is-confirm .btn.primary');
  const guestLobby = await second.guest.page.waitForSelector('.lobby', { timeout: 15000 }).then(() => true, () => false);
  check(guestLobby, '나간 사람은 로비로');
  const hostLobby = await second.host.page.waitForSelector('.lobby', { timeout: 15000 }).then(() => true, () => false);
  const hostToast = await second.host.page.evaluate(() => document.querySelector('.toast')?.textContent || '');
  check(hostLobby && hostToast.includes('상대가 방을 나갔어요'), `남은 사람은 알림 뒤 로비로(알림 「${hostToast}」)`);
  check(!(await second.host.page.$('.result-panel')), '남은 사람에게 승리 · 결과 판이 뜨지 않음');
  check((await gamesPlayed(second.host.page)) === gamesBefore, '판수 · 승패 기록이 늘지 않음');
  check([...rooms.values()].every((room) => room.code !== second.code), '방이 정리됨(방장이 나가며 지움)');
  check(leaked.length === 0, `모르는 요청 없음${leaked.length ? ` — ${leaked.join(', ')}` : ''}`);
  await second.host.context.close();
  await second.guest.context.close();
} finally {
  await browser?.close();
  server.kill();
}
const failed = results.filter((result) => !result.ok);
console.log(`서버가 거절한 요청: ${rpcErrors.join(', ') || '없음'}`);
console.log(failed.length ? `[${tag}] 친구와 대전 주사위 시험 실패 ${failed.length}개 / ${results.length}개` : `[${tag}] 친구와 대전 주사위 시험 통과 ${results.length}개`);
process.exitCode = failed.length ? 1 : 0;
