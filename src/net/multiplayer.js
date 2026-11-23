// 온라인 2인 대전 클라이언트 — 서버(Supabase RPC)가 규칙을 판정하고 패를 숨긴다.
// 시즌 2에서 고친 것
//  · Supabase 클라이언트를 기록 동기화와 함께 쓴다(하나만 만든다)
//  · 판 버전이 그대로면 다시 받지 않는다(15초 접속 확인 · 같은 행동의 두 번째 알림)
//  · 다시 받는 중에 새 알림이 오면 끝난 뒤 한 번 더 받는다(시즌 1은 버렸다)
//  · 스티커는 알림에 담긴 내용으로 바로 보여 준다(판을 다시 받지 않음)
//  · 상대 접속 여부는 알림의 마지막 접속 시각으로 이 브라우저에서 센다
import { isSupabaseConfigured } from './config.js';
import { getSupabase } from './supabase.js';

const ACTIVE_ROOM_KEY = 'onecard-active-room-v1';
const PRESENCE_WINDOW_MS = 35000;

export class MultiplayerClient {
  constructor({ onView, onConnection, onEmote, onPresence }) {
    this.onView = onView;
    this.onConnection = onConnection;
    this.onEmote = onEmote;
    this.onPresence = onPresence;
    this.supabase = null;
    this.roomId = null;
    this.view = null;
    this.channel = null;
    this.heartbeat = null;
    this.presenceTimer = null;
    this.lastSeen = { host: 0, guest: 0 };
    this.refreshing = false;
    this.refreshAgain = false;
  }

  async connect() {
    if (this.supabase) return;
    if (!isSupabaseConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
    this.supabase = await getSupabase();
    const { data } = await this.supabase.auth.getSession();
    if (!data.session) {
      const { error } = await this.supabase.auth.signInAnonymously();
      if (error) throw error;
    }
    this.onConnection?.('connected');
  }

  async createRoom(nickname, rating = 0, cardBack = 'back-classic') {
    const view = await this.rpc('onecard_create_room', { p_nickname: nickname });
    await this.attachRoom(view);
    await this.setRating(rating);
    return this.setCardBack(cardBack);
  }

  async joinRoom(code, nickname, rating = 0, cardBack = 'back-classic') {
    const view = await this.rpc('onecard_join_room', { p_code: code, p_nickname: nickname });
    await this.attachRoom(view);
    await this.setRating(rating);
    return this.setCardBack(cardBack);
  }

  rollDice() { return this.updateFromRpc('onecard_roll_dice', { p_room_id: this.roomId }); }
  setReady() { return this.updateFromRpc('onecard_set_ready', { p_room_id: this.roomId }); }
  requestRematch() { return this.updateFromRpc('onecard_request_rematch', { p_room_id: this.roomId }); }
  getHistory() { return this.rpc('onecard_get_history', { p_room_id: this.roomId }); }
  sendEmote(emote) { return this.rpc('onecard_send_emote', { p_room_id: this.roomId, p_emote: emote }); }

  playCard(cardId, chosenSuit = null) {
    return this.updateFromRpc('onecard_play_card', {
      p_room_id: this.roomId, p_card_id: cardId, p_chosen_suit: chosenSuit,
      p_action_id: crypto.randomUUID(), p_expected_version: this.view?.version ?? null,
    });
  }

  drawCards() {
    return this.updateFromRpc('onecard_draw_cards', {
      p_room_id: this.roomId, p_action_id: crypto.randomUUID(), p_expected_version: this.view?.version ?? null,
    });
  }

  setRating(rating) {
    return this.updateFromRpc('onecard_set_rating', { p_room_id: this.roomId, p_rating: Math.max(0, Math.floor(Number(rating) || 0)) });
  }

  setCardBack(cardBack) {
    return this.updateFromRpc('onecard_set_card_back', { p_room_id: this.roomId, p_card_back: cardBack });
  }

  async restoreRoom(rating = 0, cardBack = 'back-classic') {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(ACTIVE_ROOM_KEY) || 'null'); } catch { saved = null; }
    if (!saved?.roomId) return null;
    try {
      const view = await this.rpc('onecard_get_view', { p_room_id: saved.roomId });
      await this.attachRoom(view);
      await this.setRating(rating);
      return this.setCardBack(cardBack);
    } catch {
      try { localStorage.removeItem(ACTIVE_ROOM_KEY); } catch { /* 저장소가 막혀 있을 수 있다 */ }
      return null;
    }
  }

  async refresh() {
    if (!this.roomId) return this.view;
    if (this.refreshing) {
      this.refreshAgain = true;
      return this.view;
    }
    this.refreshing = true;
    try {
      const view = await this.rpc('onecard_get_view', { p_room_id: this.roomId });
      this.acceptView(view);
      return view;
    } finally {
      this.refreshing = false;
      if (this.refreshAgain) {
        this.refreshAgain = false;
        this.refresh().catch(() => this.onConnection?.('reconnecting'));
      }
    }
  }

  acceptView(view) {
    if (!view) return;
    if (this.view && view.roomId === this.view.roomId && Number(view.version) < Number(this.view.version)) return;
    this.view = view;
    this.onView?.(view);
  }

  handleRoomChange(payload) {
    const row = payload?.new;
    if (row) {
      if (row.host_last_seen) this.lastSeen.host = Date.parse(row.host_last_seen) || this.lastSeen.host;
      if (row.guest_last_seen) this.lastSeen.guest = Date.parse(row.guest_last_seen) || this.lastSeen.guest;
      this.emitPresence();
    }
    const version = Number(row?.version);
    if (Number.isFinite(version) && this.view && version <= Number(this.view.version)) return;
    this.refresh().catch(() => this.onConnection?.('reconnecting'));
  }

  handleEventInsert(payload) {
    const row = payload?.new;
    if (row?.event_type === 'emote') {
      this.onEmote?.({ id: row.id, actorSeat: row.actor_seat, payload: row.payload || {} });
    }
  }

  emitPresence() {
    if (!this.view) return;
    const now = Date.now();
    const presence = {
      host: this.lastSeen.host ? now - this.lastSeen.host < PRESENCE_WINDOW_MS : Boolean(this.view.host?.connected),
      guest: this.lastSeen.guest ? now - this.lastSeen.guest < PRESENCE_WINDOW_MS : Boolean(this.view.guest?.connected),
    };
    this.onPresence?.(presence);
  }

  async leave() {
    if (this.roomId) {
      try { await this.rpc('onecard_leave_room', { p_room_id: this.roomId }); } catch { /* 나가기는 최선만 */ }
    }
    await this.detachRoom({ forget: true });
  }

  async attachRoom(view) {
    await this.detachRoom({ forget: false });
    this.roomId = view.roomId;
    this.view = view;
    this.lastSeen = { host: 0, guest: 0 };
    try { localStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify({ roomId: view.roomId, code: view.code })); } catch { /* 막혀 있을 수 있다 */ }
    this.onView?.(view);
    this.channel = this.supabase
      .channel(`onecard:${this.roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'onecard_rooms', filter: `id=eq.${this.roomId}` }, (payload) => this.handleRoomChange(payload))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'onecard_events', filter: `room_id=eq.${this.roomId}` }, (payload) => this.handleEventInsert(payload))
      .subscribe((status) => {
        this.onConnection?.(status === 'SUBSCRIBED' ? 'live' : status.toLowerCase());
        if (status === 'SUBSCRIBED') this.refresh().catch(() => {});
      });
    this.heartbeat = setInterval(() => {
      this.rpc('onecard_ping', { p_room_id: this.roomId }).catch(() => this.onConnection?.('reconnecting'));
    }, 15000);
    this.presenceTimer = setInterval(() => this.emitPresence(), 5000);
  }

  async detachRoom({ forget = false } = {}) {
    clearInterval(this.heartbeat);
    clearInterval(this.presenceTimer);
    this.heartbeat = null;
    this.presenceTimer = null;
    if (this.channel && this.supabase) await this.supabase.removeChannel(this.channel);
    this.channel = null;
    this.roomId = null;
    this.view = null;
    if (forget) {
      try { localStorage.removeItem(ACTIVE_ROOM_KEY); } catch { /* 막혀 있을 수 있다 */ }
    }
  }

  async updateFromRpc(name, args) {
    const view = await this.rpc(name, args);
    this.acceptView(view);
    return view;
  }

  async rpc(name, args) {
    if (!this.supabase) throw new Error('Supabase 연결이 필요합니다.');
    const { data, error } = await this.supabase.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  }
}
