// 앱 — 화면 전환 · 기록 동기화 시점(판 끝 · 장착 · 화면 떠날 때) · 첫 방문 오프닝
import { h } from './dom.js';
import { setModalHost, toast } from './modal.js';
import { installSuitSprite } from './suits.js';
import { settings } from './settings.js';
import { applySpeed } from './director.js';
import { preloadSounds, unlockAudio } from './sound.js';
import { renderLobby } from './lobby.js';
import { startAiMatch } from './ai-match.js';
import { startOnline } from './online.js';
import { openCollection } from './collection.js';
import { openPass } from './pass.js';
import { playOpening } from './opening.js';
import { openSettings, openRules, openMissions, openCredits, openAccount } from './panels.js';
import { loadPlayerProfile } from '../core/rating.js';
import { hasAuthCallbackInUrl, hasStoredSession } from '../net/supabase.js';
import { warm, cut } from '../data/assets.js';
import { RIVALS } from '../data/characters.js';
import { applyEquipped } from './look-apply.js';
import { showSeasonGift } from './season-gift.js';

export function createApp(root) {
  installSuitSprite();
  applySpeed();
  const screen = h('main.screen', { id: 'screen' });
  const overlayHost = h('div.overlay-host');
  root.replaceChildren(screen, overlayHost);
  setModalHost(overlayHost);
  let accountStatus = hasStoredSession() ? 'checking' : 'local';
  let accountModule = null;

  document.addEventListener('pointerdown', () => { unlockAudio(); preloadSounds(); }, { once: true });
  warm(RIVALS.map((rival) => cut(rival.portrait)));

  async function loadAccount() {
    if (!accountModule) accountModule = await import('../net/account.js');
    return accountModule;
  }

  // 로그인이 있을 때만 동기화(없으면 라이브러리도 받지 않음)
  async function syncNow({ quiet = true } = {}) {
    if (!hasStoredSession() && !hasAuthCallbackInUrl()) return;
    try {
      const account = await loadAccount();
      const result = await account.syncAccountProfile();
      const state = await account.getAccountSyncState();
      accountStatus = state.status;
      if (!quiet) toast('기록을 동기화했어요', { tone: 'good' });
      if (current === 'lobby') showLobby();
      return result;
    } catch {
      accountStatus = 'error';
      return null;
    }
  }

  let syncTimer = null;
  function requestSync(delay = 1200) {
    if (!hasStoredSession()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncNow(), delay);
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') requestSync(0); });

  let current = '';
  function showLobby() {
    current = 'lobby';
    document.body.dataset.screen = 'lobby';
    const profile = loadPlayerProfile();
    applyEquipped(document.body, profile.equipped);
    renderLobby({
      host: screen, profile, accountStatus,
      onAi: () => startAi(),
      onOnline: () => startFriend(),
      onCollection: () => openCollection({ host: overlayHost, onClose: () => { showLobby(); requestSync(); }, onChanged: () => requestSync(2500) }),
      onPass: () => openPass({ host: overlayHost, onClose: () => showLobby() }),
      onMissions: () => openMissions(),
      onSettings: () => openSettingsPanel(),
      onAccount: () => openAccountPanel(),
      onToggleSound: () => settings.set({ sound: !settings.get().sound }),
    });
    // 최고 점수로 이미 열린 시즌 2 새 아이템이 있으면 한 번 보여 준다
    setTimeout(() => {
      if (current !== 'lobby' || document.querySelector('.opening')) return;
      showSeasonGift(profile, { onOpenCollection: () => openCollection({ host: overlayHost, onClose: () => { showLobby(); requestSync(); }, onChanged: () => requestSync(2500) }) });
    }, 700);
  }

  function openSettingsPanel() {
    openSettings({
      onReplayOpening: () => runOpening(),
      onAccount: () => openAccountPanel(),
      onRules: () => openRules(),
      onCredits: () => openCredits(),
    });
  }

  function openAccountPanel() {
    openAccount({
      getState: async (account) => { const state = await account.getAccountSyncState(); accountStatus = state.status; return state; },
      onSynced: () => { if (current === 'lobby') showLobby(); },
    });
  }

  async function startAi() {
    current = 'game';
    document.body.dataset.screen = 'game';
    await startAiMatch({
      host: screen,
      openRules: () => openRules(),
      onExit: () => showLobby(),
      onFinished: ({ again }) => { requestSync(); if (again) startAi(); else showLobby(); },
    });
  }

  function startFriend() {
    current = 'online';
    document.body.dataset.screen = 'online';
    startOnline({ host: screen, openRules: () => openRules(), onExit: () => { requestSync(); showLobby(); } });
  }

  async function runOpening() {
    await playOpening({ host: overlayHost });
    showLobby();
  }

  // 시작
  const params = new URLSearchParams(location.search);
  if (params.get('mode') === 'online') {
    history.replaceState(null, '', location.pathname);
    startFriend();
  } else {
    showLobby();
    if (!settings.get().seenOpening && !params.has('skip-opening')) runOpening();
  }
  if (hasStoredSession() || hasAuthCallbackInUrl()) setTimeout(() => syncNow(), 1500);
  return { showLobby, requestSync };
}
