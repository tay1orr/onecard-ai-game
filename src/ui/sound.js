// 소리 — Kenney(CC0) 녹음 소리를 Web Audio 로 재생. 같은 소리도 조금씩 다르게(높이 · 크기)
import { sfxUrl } from '../data/assets.js';
import { settings } from './settings.js';

const GROUPS = {
  place: ['card-place-1', 'card-place-2', 'card-place-3', 'card-place-4'],
  slide: ['card-slide-1', 'card-slide-2', 'card-slide-3', 'card-slide-5'],
  shove: ['card-shove-1', 'card-shove-3'],
  fan: ['card-fan-1', 'card-fan-2'],
  shuffle: ['card-shuffle'],
  pack: ['pack-open'],
  chip: ['chip-lay-1', 'chip-lay-2'],
  chips: ['chips-collide'],
  stack: ['chips-stack'],
  handle: ['chips-handle'],
  dice: ['dice-shake'],
  throw: ['dice-throw', 'die-throw'],
  click: ['click'], select: ['select'], confirm: ['confirm'], confirmBig: ['confirm-big'], error: ['error'],
  open: ['open'], close: ['close'], toggle: ['toggle'], drop: ['drop'], glass: ['glass'], pluck: ['pluck'],
  bong: ['bong'], tick: ['tick'], glitch: ['glitch'], whoosh: ['maximize'], swoop: ['minimize'], scratch: ['scratch'],
  win: ['jingle-win'], lose: ['jingle-lose'], unlock: ['jingle-unlock'], season: ['jingle-season'],
  bonus: ['jingle-bonus'], onecard: ['jingle-onecard'], level: ['jingle-level'],
};

const CORE = ['place', 'slide', 'shuffle', 'click', 'select', 'confirm', 'error', 'chip', 'chips', 'whoosh', 'bong', 'onecard', 'win', 'lose', 'dice', 'throw'];

let context = null;
let master = null;
const buffers = new Map();
const loading = new Map();

function ensureContext() {
  if (!context) {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = settings.get().volume;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
}

settings.subscribe((state) => { if (master) master.gain.value = state.volume; });

function load(name) {
  if (buffers.has(name)) return Promise.resolve(buffers.get(name));
  if (loading.has(name)) return loading.get(name);
  const ctx = ensureContext();
  if (!ctx) return Promise.resolve(null);
  const promise = fetch(sfxUrl(name))
    .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => { buffers.set(name, buffer); return buffer; })
    .catch(() => null)
    .finally(() => loading.delete(name));
  loading.set(name, promise);
  return promise;
}

export function preloadSounds(groups = CORE) {
  groups.forEach((group) => (GROUPS[group] || []).forEach((name) => load(name)));
}

function start(buffer, { volume = 1, rate = 1, delay = 0, pan = 0 }) {
  const ctx = ensureContext();
  if (!ctx || !buffer) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  let node = source.connect(gain);
  if (pan && ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    node = node.connect(panner);
  }
  node.connect(master);
  source.start(ctx.currentTime + delay);
}

export function play(group, options = {}) {
  if (!settings.get().sound) return;
  const names = GROUPS[group];
  if (!names) return;
  const name = names[Math.floor(Math.random() * names.length)];
  const jitter = options.exact ? 1 : 1 + (Math.random() - 0.5) * 0.08;
  const params = { volume: options.volume ?? 1, rate: (options.rate ?? 1) * jitter, delay: options.delay ?? 0, pan: options.pan ?? 0 };
  const buffer = buffers.get(name);
  if (buffer) start(buffer, params);
  else load(name).then((loaded) => { if (loaded) start(loaded, params); });
}

// 오르골 — pluck 소리를 음높이만 바꿔 다섯 음 가락으로
export function playMusicBox() {
  [1, 1.26, 1.5, 1.68, 2].forEach((rate, index) => play('pluck', { rate, delay: index * 0.11, volume: 0.7, exact: true }));
}

export function playFountain() {
  play('glass', { rate: 1.3, volume: 0.7 });
  [0.06, 0.14, 0.24, 0.34].forEach((delay, index) => play('drop', { rate: 1.6 + index * 0.18, delay, volume: 0.5, exact: true }));
}

export function unlockAudio() {
  ensureContext();
}
