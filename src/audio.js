const STORAGE_KEY = 'onecard-sound-enabled';
let context;
let enabled = localStorage.getItem(STORAGE_KEY) !== 'false';

function getContext() {
  if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
  if (context.state === 'suspended') context.resume();
  return context;
}

function tone(frequency, duration = 0.08, type = 'sine', volume = 0.035, delay = 0) {
  if (!enabled) return;
  const audio = getContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

export function playSound(name) {
  if (name === 'card') { tone(280, 0.07, 'triangle'); tone(420, 0.05, 'sine', 0.02, 0.035); }
  if (name === 'draw') tone(190, 0.12, 'triangle');
  if (name === 'action') { tone(330, 0.08, 'square', 0.025); tone(520, 0.12, 'triangle', 0.025, 0.05); }
  if (name === 'win') [440, 554, 659, 880].forEach((note, i) => tone(note, 0.22, 'sine', 0.035, i * 0.09));
  if (name === 'lose') [330, 277, 220].forEach((note, i) => tone(note, 0.2, 'triangle', 0.03, i * 0.1));
  if (name === 'error') tone(135, 0.12, 'sawtooth', 0.02);
  if (name === 'toy') { tone(620, 0.07, 'sine', 0.018); tone(820, 0.09, 'triangle', 0.015, 0.04); }
  if (name === 'joker') { [180, 240, 360, 720].forEach((note, i) => tone(note, 0.2, i % 2 ? 'square' : 'sawtooth', 0.022, i * 0.055)); }
  if (name === 'onecard') { [523, 659, 784, 1047].forEach((note, i) => tone(note, 0.25, 'triangle', 0.032, i * 0.075)); }
}

export function toggleSound() {
  enabled = !enabled;
  localStorage.setItem(STORAGE_KEY, String(enabled));
  if (enabled) tone(520, 0.08, 'sine');
  return enabled;
}

export function isSoundEnabled() { return enabled; }
