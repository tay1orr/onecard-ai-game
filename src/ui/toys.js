// 탁자 장난감 — 실물 누끼(장미 · 오르골 · 유리 돔 …). 끌어서 던지면 미끄러지고(관성), 누르면 움직이며 대사 · 소리 · 소품
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { h } from './dom.js';
import { cut } from '../data/assets.js';
import { charmToyConfig, equippedCharmIds } from '../core/cosmetics.js';
import { play, playFountain, playMusicBox } from './sound.js';
import { settings } from './settings.js';

gsap.registerPlugin(Draggable, InertiaPlugin);

const SPOTS = [
  { left: '7%', top: '58%' },
  { left: '86%', top: '18%' },
  { left: '80%', top: '64%' },
];

// 누를 때 몸짓 — 실물이라 부드럽고 무게감 있게
export function toyMotion(image, toy) {
  const motion = toy.motion || 'wobble';
  if (motion === 'spin') return gsap.fromTo(image, { rotationY: 0 }, { rotationY: 360, duration: 0.9, ease: 'power3.out', transformPerspective: 600, clearProps: 'transform' });
  if (motion === 'hop') return gsap.timeline().to(image, { y: -26, scaleY: 1.04, duration: 0.18, ease: 'power2.out' }).to(image, { y: 0, scaleY: 0.94, duration: 0.2, ease: 'power2.in' }).to(image, { scaleY: 1, duration: 0.16, ease: 'back.out(3)', clearProps: 'transform' });
  if (motion === 'launch') return gsap.timeline().to(image, { y: -150, rotation: -6, duration: 0.45, ease: 'power2.out' }).to(image, { y: 0, rotation: 0, duration: 0.55, ease: 'bounce.out', clearProps: 'transform' });
  if (motion === 'roll') return gsap.fromTo(image, { rotation: 0 }, { rotation: 720 + Math.random() * 90, duration: 0.7, ease: 'power3.out' });
  if (motion === 'bloom') return gsap.timeline().to(image, { scale: 1.18, rotation: -4, duration: 0.22, ease: 'power2.out' }).to(image, { scale: 1, rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)', clearProps: 'transform' });
  if (motion === 'fountain') return gsap.timeline().to(image, { scaleY: 1.08, y: -10, duration: 0.25, ease: 'power2.out' }).to(image, { scaleY: 1, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)', clearProps: 'transform' });
  return gsap.timeline().to(image, { rotation: -7, duration: 0.09 }).to(image, { rotation: 6, duration: 0.12 }).to(image, { rotation: -3, duration: 0.12 }).to(image, { rotation: 0, duration: 0.14, clearProps: 'transform' });
}

export function toySound(toy) {
  if (toy.sound === 'music') playMusicBox();
  else if (toy.sound === 'fountain') playFountain();
  else if (toy.sound === 'whoosh') play('whoosh');
  else if (toy.sound === 'die') play('die');
  else play(toy.sound || 'pluck', { rate: 0.9 + Math.random() * 0.3 });
}

export function mountToys({ layer, equipped, fx, onPlayed }) {
  layer.replaceChildren();
  const draggables = [];
  equippedCharmIds(equipped).forEach((itemId, slot) => {
    const toy = charmToyConfig(itemId, slot);
    const image = h('img.toy-img', { src: cut(toy.img), alt: '', draggable: 'false', decoding: 'async' });
    const bubble = h('span.toy-bubble', {}, '');
    const button = h('button.toy', { type: 'button', 'aria-label': `${slot + 1}번 장난감 누르기`, vars: { '--toy-size': toy.size || 1 } }, h('span.toy-shadow'), image, bubble);
    Object.assign(button.style, SPOTS[slot]);
    layer.append(button);
    let taps = 0;

    const tap = () => {
      taps += 1;
      bubble.textContent = toy.motion === 'roll' ? `${1 + Math.floor(Math.random() * 6)}!` : toy.lines[(taps - 1) % toy.lines.length];
      gsap.fromTo(bubble, { opacity: 0, y: 6, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(2)' });
      gsap.to(bubble, { opacity: 0, duration: 0.3, delay: 1.1 });
      toySound(toy);
      if (settings.reduced()) return;
      toyMotion(image, toy);
      if (toy.burst?.length) {
        const rect = image.getBoundingClientRect();
        fx.toyBurst(toy, { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.3 });
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
