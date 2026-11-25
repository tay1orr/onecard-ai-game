// 배경음악 — 장면마다 곡을 튼다(lobby: 로비 · 친구 방, game: 대전 중). 곡 목록은 src/data/music.js(scripts/build-music.mjs 가 음악/ 폴더에서 만듦).
// 곡이 없으면 아무것도 하지 않는다. 판이 끝나면(승리 · 패배 잔음악 · 상자 · 결과) 천천히 줄여 끄고, 로비나 다음 판에서 다시 튼다.
// 소리 끄기 · 배경음악 끄기면 멈추고, 앱을 떠나 화면이 가려지면 바로 쉬었다가 돌아오면 이어서. 한 장면에 곡이 여럿이면 끝날 때마다 다음 곡.
// 재생기는 하나만 쓴다 — 안드로이드 앱 안 브라우저(카카오톡 · 네이버)는 손길로 한 번 튼 재생기만 나중에 손길 없이 다시 틀어 준다.
// 첫 손길 전에는 브라우저가 소리를 막아서, 장면만 기억해 두었다가 첫 손길(unlockMusic) 때 튼다
import { MUSIC } from '../data/music.js';
import { musicUrl } from '../data/assets.js';
import { settings } from './settings.js';

export const hasMusic = () => MUSIC.length > 0;

const FADE_IN = 1.2;
const FADE_OUT = 0.9;
const audio = typeof Audio === 'function' ? new Audio() : null;
let wanted = null; // 지금 있어야 할 장면
let loaded = null; // 재생기에 넣어 둔 장면
let leaving = false; // 줄여 끄는 중(다 줄인 뒤 다시 본다)
let unlocked = false;
let fadeFrame = 0;
const turn = new Map(); // 장면마다 다음 곡 차례

const enabled = () => settings.get().sound && settings.get().music;
const level = () => Math.max(0, Math.min(1, settings.get().volume * settings.get().musicVolume));

// 소리 크기를 천천히 바꾼다(화면이 가려지면 멈추므로 가려질 때는 바로 쉰다)
function fade(to, seconds, done) {
  cancelAnimationFrame(fadeFrame);
  const from = audio.volume;
  const startedAt = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - startedAt) / (seconds * 1000));
    audio.volume = from + (to - from) * t;
    if (t < 1) fadeFrame = requestAnimationFrame(step);
    else done?.();
  };
  fadeFrame = requestAnimationFrame(step);
}

function resume() {
  audio.play().then(() => { if (!leaving) fade(level(), FADE_IN); }).catch(() => {}); // 막히면 다음 손길 · 장면 바꿈 때 다시
}

function begin(scene) {
  const list = MUSIC.filter((track) => track.scene === scene);
  if (!list.length) return;
  const index = turn.has(scene) ? turn.get(scene) : Math.floor(Math.random() * list.length);
  turn.set(scene, (index + 1) % list.length);
  loaded = scene;
  audio.loop = list.length === 1;
  audio.src = musicUrl(list[index].file);
  audio.volume = 0;
  resume();
}

function apply() {
  if (!audio || !hasMusic() || leaving || document.hidden) return;
  const target = unlocked && enabled() ? wanted : null;
  if (target && loaded === target) {
    if (audio.paused) resume();
    return;
  }
  if (loaded && !audio.paused) {
    leaving = true;
    fade(0, FADE_OUT, () => { leaving = false; audio.pause(); loaded = null; apply(); });
    return;
  }
  loaded = null;
  if (target) begin(target);
}

// 장면 바꾸기 — null 이면 줄여서 끈다(판이 끝날 때)
export function setMusicScene(scene) {
  wanted = scene || null;
  apply();
}

export function unlockMusic() {
  unlocked = true;
  apply();
}

if (audio && typeof document !== 'undefined') {
  audio.addEventListener('ended', () => { loaded = null; apply(); }); // 곡이 여럿인 장면 — 다음 곡
  settings.subscribe(() => {
    if (loaded && !leaving && !audio.paused && enabled()) { cancelAnimationFrame(fadeFrame); audio.volume = level(); }
    apply();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { apply(); return; }
    cancelAnimationFrame(fadeFrame);
    if (leaving) { leaving = false; loaded = null; }
    audio.pause();
  });
}
