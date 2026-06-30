import { SUPABASE_CONFIG, isSupabaseConfigured } from './2026-06-30-supabase-config.js';

const ACTIVE_ROOM_KEY = 'onecard-active-room-v1';

export class MultiplayerClient {
  constructor({ onView, onConnection }) {
    this.onView = onView;
    this.onConnection = onConnection;
    this.supabase = null;
    this.roomId = null;
    this.view = null;
    this.channel = null;
    this.heartbeat = null;
    this.refreshing = false;
  }

  async connect() {
    if (this.supabase) return;
    if (!isSupabaseConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    const { data: sessionData } = await this.supabase.auth.getSession();
    if (!sessionData.session) {
      const { error } = await this.supabase.auth.signInAnonymously();
      if (error) throw error;
    }
    this.onConnection?.('connected');
  }

  async createRoom(nickname) {
    const view = await this.rpc('onecard_create_room', { p_nickname: nickname });
    await this.attachRoom(view);
    return view;
  }

  async joinRoom(code, nickname) {
    const view = await this.rpc('onecard_join_room', { p_code: code, p_nickname: nickname });
    await this.attachRoom(view);
    return view;
  }

  async rollDice() {
    return this.updateFromRpc('onecard_roll_dice', { p_room_id: this.roomId });
  }

  async playCard(cardId, chosenSuit = null) {
    return this.updateFromRpc('onecard_play_card', {
      p_room_id: this.roomId,
      p_card_id: cardId,
      p_chosen_suit: chosenSuit,
      p_action_id: crypto.randomUUID(),
      p_expected_version: this.view.version,
    });
  }

  async drawCards() {
    return this.updateFromRpc('onecard_draw_cards', {
      p_room_id: this.roomId,
      p_action_id: crypto.randomUUID(),
      p_expected_version: this.view.version,
    });
  }

  async setReady() {
    return this.updateFromRpc('onecard_set_ready', { p_room_id: this.roomId });
  }

  async requestRematch() {
    return this.updateFromRpc('onecard_request_rematch', { p_room_id: this.roomId });
  }

  async getHistory() {
    return this.rpc('onecard_get_history', { p_room_id: this.roomId });
  }

  async sendEmote(emote) {
    return this.updateFromRpc('onecard_send_emote', { p_room_id: this.roomId, p_emote: emote });
  }

  async restoreRoom() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(ACTIVE_ROOM_KEY) || 'null'); } catch { saved = null; }
    if (!saved?.roomId) return null;
    try {
      const view = await this.rpc('onecard_get_view', { p_room_id: saved.roomId });
      await this.attachRoom(view);
      return view;
    } catch {
      try { localStorage.removeItem(ACTIVE_ROOM_KEY); } catch { /* 저장소가 차단될 수 있습니다. */ }
      return null;
    }
  }

  async refresh() {
    if (!this.roomId || this.refreshing) return this.view;
    this.refreshing = true;
    try {
      const view = await this.rpc('onecard_get_view', { p_room_id: this.roomId });
      this.view = view;
      this.onView?.(view);
      return view;
    } finally {
      this.refreshing = false;
    }
  }

  async leave() {
    if (this.roomId) {
      try { await this.rpc('onecard_leave_room', { p_room_id: this.roomId }); } catch { /* best effort */ }
    }
    await this.detachRoom({ forget: true });
  }

  async attachRoom(view) {
    await this.detachRoom({ forget: false });
    this.roomId = view.roomId;
    this.view = view;
    try { localStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify({ roomId: view.roomId, code: view.code })); } catch { /* 저장소가 차단될 수 있습니다. */ }
    this.onView?.(view);
    this.channel = this.supabase
      .channel(`onecard:${this.roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'onecard_rooms', filter: `id=eq.${this.roomId}`,
      }, () => this.refresh())
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'onecard_events', filter: `room_id=eq.${this.roomId}`,
      }, () => this.refresh())
      .subscribe((status) => this.onConnection?.(status === 'SUBSCRIBED' ? 'live' : status.toLowerCase()));
    this.heartbeat = setInterval(() => {
      this.rpc('onecard_ping', { p_room_id: this.roomId }).catch(() => this.onConnection?.('reconnecting'));
    }, 15000);
  }

  async detachRoom({ forget = false } = {}) {
    clearInterval(this.heartbeat);
    this.heartbeat = null;
    if (this.channel && this.supabase) await this.supabase.removeChannel(this.channel);
    this.channel = null;
    this.roomId = null;
    this.view = null;
    if (forget) {
      try { localStorage.removeItem(ACTIVE_ROOM_KEY); } catch { /* 저장소가 차단될 수 있습니다. */ }
    }
  }

  async updateFromRpc(name, args) {
    const view = await this.rpc(name, args);
    this.view = view;
    this.onView?.(view);
    return view;
  }

  async rpc(name, args) {
    if (!this.supabase) throw new Error('Supabase 연결이 필요합니다.');
    const { data, error } = await this.supabase.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  }
}
