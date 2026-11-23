// 이 브라우저 설정 — 소리 · 효과 크기 · 연출 속도 · 시즌 2 오프닝을 봤는지
const KEY = 'onecard-s2-settings';
const LEGACY_SOUND_KEY = 'onecard-sound-enabled';

const defaults = { sound: true, volume: 0.8, effects: 'full', speed: 1, seenOpening: false, nickname: '' };

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) return { ...defaults, ...saved };
    const legacySound = localStorage.getItem(LEGACY_SOUND_KEY);
    return { ...defaults, sound: legacySound !== 'false' };
  } catch {
    return { ...defaults };
  }
}

let state = read();
const listeners = new Set();

export const settings = {
  get: () => state,
  set(patch) {
    state = { ...state, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 막혀 있으면 이번만 */ }
    listeners.forEach((listener) => listener(state));
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  reduced: () => state.effects === 'reduced' || Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
};
