// 탁자 장난감 — 끌어서 던지면 미끄러지고(관성), 누르면 살아 움직이며 대사 · 소리 · 소품
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { h } from './dom.js';
import { anim, img, ANIMATED } from '../data/assets.js';
import { charmToyConfig, equippedCharmIds } from '../core/cosmetics.js';
import { play, playFountain, playMusicBox } from './sound.js';
import { settings } from './settings.js';

gsap.registerPlugin(Draggable, InertiaPlugin);

const SPOTS = [
  { left: '7%', top: '62%' },
  { left: '86%', top: '22%' },
  { left: '80%', top: '70%' },
];

const FILTERS = {
  peach: 'hue-rotate(28deg) saturate(.62) brightness(1.18)',
  blush: 'hue-rotate(18deg) saturate(.5) brightness(1.3)',
  crimson: 'saturate(1.3) brightness(.92)',
};

export function mountToys({ layer, equipped, fx, onPlayed }) {
  layer.replaceChildren();
  const draggables = [];
  equippedCharmIds(equipped).forEach((itemId, slot) => {
    const toy = charmToyConfig(itemId, slot);
    const image = h('img.toy-img', { src: img(toy.motif), alt: '', draggable: 'false' });
    if (toy.filter) image.style.filter = FILTERS[toy.filter] || '';
    const bubble = h('span.toy-bubble', {}, '');
    const button = h('button.toy', { type: 'button', 'aria-label': `${slot + 1}번 장난감 누르기`, class: toy.big ? 'is-big' : '' }, h('span.toy-shadow'), image, bubble);
    Object.assign(button.style, SPOTS[slot]);
    layer.append(button);
    let taps = 0;

    const tap = () => {
      taps += 1;
      bubble.textContent = toy.lines[(taps - 1) % toy.lines.length];
      gsap.fromTo(bubble, { opacity: 0, y: 6, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(2)' });
      gsap.to(bubble, { opacity: 0, duration: 0.3, delay: 1.1 });
      if (toy.sound === 'music') playMusicBox();
      else if (toy.sound === 'fountain') playFountain();
      else if (toy.sound === 'whoosh') play('whoosh');
      else if (toy.sound === 'die') play('die');
      else play(toy.sound || 'pluck', { rate: 0.9 + Math.random() * 0.3 });
      if (toy.animated && ANIMATED.has(toy.animated) && !settings.reduced()) {
        image.src = anim(toy.animated);
        clearTimeout(image._still);
        image._still = setTimeout(() => { image.src = img(toy.motif); }, 2600);
      }
      if (settings.reduced()) return;
      if (toy.spin) gsap.fromTo(image, { rotation: 0 }, { rotation: 360, duration: 0.7, ease: 'power3.out' });
      else if (toy.launch) gsap.timeline().to(image, { y: -160, duration: 0.45, ease: 'power2.out' }).to(image, { y: 0, duration: 0.5, ease: 'bounce.out' });
      else if (toy.die) {
        gsap.fromTo(image, { rotation: 0 }, { rotation: 720 + Math.random() * 90, duration: 0.6, ease: 'power3.out' });
        bubble.textContent = `${1 + Math.floor(Math.random() * 6)}!`;
      } else gsap.fromTo(image, { scaleX: 1, scaleY: 1 }, { scaleX: toy.squish || 1.18, scaleY: 0.8, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' });
      if (toy.burst?.length) {
        const rect = image.getBoundingClientRect();
        fx.burst({ burst: toy.burst, physics: toy.big ? 'fall' : 'float' }, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 }, { count: toy.big ? 9 : 3, sizeScale: toy.big ? 0.9 : 0.6 });
      }
      onPlayed?.(toy.key);
    };

    const [draggable] = Draggable.create(button, {
      bounds: layer, inertia: true, edgeResistance: 0.75, minimumMovement: 6,
      onClick: tap,
      onDragStart: () => button.classList.add('is-dragging'),
      onDragEnd: () => button.classList.remove('is-dragging'),
      onThrowComplete: () => play('drop', { volume: 0.35, rate: 1.2 }),
    });
    button.addEventListener('keydown', (event) => {
      const moves = { ArrowLeft: [-14, 0], ArrowRight: [14, 0], ArrowUp: [0, -14], ArrowDown: [0, 14] };
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tap(); return; }
      if (!moves[event.key]) return;
      event.preventDefault();
      gsap.set(button, { x: `+=${moves[event.key][0]}`, y: `+=${moves[event.key][1]}` });
      draggable.update(true);
    });
    draggables.push(draggable);
  });
  return { destroy: () => draggables.forEach((draggable) => draggable.kill()) };
}
