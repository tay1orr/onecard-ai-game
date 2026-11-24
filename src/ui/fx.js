// 연출 — 기울어진 띠(방송 그래픽) · 충격파 · 화면 흔들림 · 실물 누끼와 사진.
// 빛 번짐 대신 무광 그림자 · 비대칭 기울기 · 조금씩 다른 간격으로(AI 티 피하기).
import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { h } from './dom.js';
import { cut, scene } from '../data/assets.js';
import { cardFace } from './cards.js';
import { SUIT_NAMES, RED_SUITS, suitSvg } from './suits.js';
import { play } from './sound.js';
import { playVictory } from './victory.js';
import { settings } from './settings.js';

gsap.registerPlugin(Physics2DPlugin);

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function createFx({ layer, root, director }) {
  const reduced = () => settings.reduced();

  function local(point) {
    const rect = layer.getBoundingClientRect();
    return { x: point.x - rect.left, y: point.y - rect.top };
  }

  // 실물 누끼 하나를 연출 층에 — blend 로 사진(불 · 번개 · 불꽃)을 밝게 섞는다
  function sprite(key, size, at, { blend = 'normal' } = {}) {
    const el = h('img.fx-sprite', { src: cut(key), alt: '', draggable: 'false', decoding: 'async' });
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${at.x - size / 2}px`;
    el.style.top = `${at.y - size / 2}px`;
    if (blend && blend !== 'normal') el.style.mixBlendMode = blend;
    layer.append(el);
    return el;
  }

  function shake(power = 1) {
    if (reduced() || !root) return;
    const timeline = gsap.timeline();
    for (let index = 0; index < 6; index += 1) {
      const fade = 1 - index / 6;
      timeline.to(root, { x: rand(-9, 9) * power * fade, y: rand(-6, 6) * power * fade, duration: 0.045, ease: 'none' });
    }
    timeline.to(root, { x: 0, y: 0, duration: 0.08 });
  }

  function flash(color = '#fff', strength = 0.22) {
    if (reduced()) return;
    const el = h('div.fx-flash');
    el.style.background = color;
    layer.append(el);
    gsap.fromTo(el, { opacity: strength }, { opacity: 0, duration: 0.32, ease: 'power2.out', onComplete: () => el.remove() });
  }

  function shockwave(at, color = '#fff', { size = 220, rings = 2 } = {}) {
    const point = local(at);
    for (let index = 0; index < rings; index += 1) {
      const ring = h('div.fx-ring');
      ring.style.left = `${point.x - size / 2}px`;
      ring.style.top = `${point.y - size / 2}px`;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.borderColor = color;
      layer.append(ring);
      gsap.fromTo(ring, { scale: 0.15, opacity: 0.95, borderWidth: 14 }, {
        scale: 1.4 + index * 0.5, opacity: 0, borderWidth: 1, duration: 0.62 + index * 0.12, delay: index * 0.07, ease: 'power2.out', onComplete: () => ring.remove(),
      });
    }
  }

  // 방송 그래픽처럼 기울어진 띠 위 글자 — 들어오고, 잠깐 멈추고, 빠진다
  function slab({ text, sub = '', color = '#f2b544', ink = '#121a2b', at = null, size = 'l', tilt = -7, hold = 0.55, from = 'left', className = '' }) {
    const box = layer.getBoundingClientRect();
    const point = at ? local(at) : { x: box.width / 2, y: box.height * 0.46 };
    const el = h(`div.fx-slab.size-${size}${className ? `.${className}` : ''}`, { vars: { '--slab': color, '--slab-ink': ink } },
      h('span.slab-back'), h('span.slab-body', {}, h('b.slab-text', {}, text), sub ? h('small.slab-sub', {}, sub) : null));
    layer.append(el);
    gsap.set(el, { left: point.x, top: point.y, xPercent: -50, yPercent: -50, rotation: tilt });
    const dir = from === 'left' ? -1 : 1;
    const timeline = gsap.timeline({ onComplete: () => el.remove() });
    if (reduced()) {
      timeline.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.12 }).to(el, { opacity: 0, duration: 0.2, delay: hold + 0.3 });
      return timeline;
    }
    timeline.fromTo(el.querySelector('.slab-back'), { scaleX: 0, transformOrigin: from === 'left' ? '0% 50%' : '100% 50%' }, { scaleX: 1, duration: 0.2, ease: 'power3.out' }, 0);
    timeline.fromTo(el.querySelector('.slab-body'), { x: 140 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'back.out(2.2)' }, 0.06);
    timeline.to(el, { scale: 1.04, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.34);
    timeline.to(el.querySelector('.slab-body'), { x: -120 * dir, opacity: 0, duration: 0.22, ease: 'power2.in' }, 0.36 + hold);
    timeline.to(el.querySelector('.slab-back'), { scaleX: 0, transformOrigin: from === 'left' ? '100% 50%' : '0% 50%', duration: 0.2, ease: 'power2.in' }, 0.42 + hold);
    return timeline;
  }

  // ── 카드 효과(꾸미기) — 실물 몇 개를 크게. 작은 조각이 떼로 퍼지지 않게 개수는 적게
  function burst(effect, at, { count = null, sizeScale = 1 } = {}) {
    if (!effect) return null;
    const point = local(at);
    const motion = effect.motion;
    const timeline = gsap.timeline();
    if (effect.band) timeline.add(band(effect.band, at), 0);
    const total = reduced() ? Math.min(1, effect.count) : Math.max(0, count ?? effect.count);
    const [min, max] = effect.size || [70, 110];
    for (let index = 0; index < total; index += 1) {
      const key = effect.sprites[index % effect.sprites.length];
      if (!key) continue;
      const size = rand(min, max) * sizeScale;
      const delay = index * rand(0.04, 0.08);
      if (motion === 'drop') {
        const el = sprite(key, size, point, { blend: effect.blend });
        timeline.fromTo(el, { y: -Math.max(260, point.y + size), rotation: rand(-30, 30), scale: 1.25, opacity: 0 }, { y: 0, rotation: rand(-12, 12), scale: 1, opacity: 1, duration: 0.5, ease: 'bounce.out' }, delay);
        timeline.to(el, { scale: 0.6, opacity: 0, y: 12, duration: 0.35, ease: 'power2.in', onComplete: () => el.remove() }, delay + 1.05);
      } else if (motion === 'float') {
        const el = sprite(key, size, point, { blend: effect.blend });
        timeline.fromTo(el, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, delay);
        timeline.to(el, { y: -rand(170, 260), x: rand(-150, 150), rotation: rand(-18, 18), duration: rand(1.3, 1.6), ease: 'sine.out' }, delay);
        timeline.to(el, { opacity: 0, duration: 0.45, onComplete: () => el.remove() }, delay + 1.05);
      } else if (motion === 'swirl' || motion === 'orbit') {
        const el = sprite(key, size, point, { blend: effect.blend });
        const startAngle = (index / Math.max(1, total)) * 360 + rand(-20, 20);
        const holder = { angle: startAngle, radius: 24 };
        const reach = motion === 'orbit' ? rand(120, 150) : rand(130, 190);
        const update = () => {
          const rad = (holder.angle * Math.PI) / 180;
          gsap.set(el, { x: Math.cos(rad) * holder.radius, y: Math.sin(rad) * holder.radius * 0.6, rotation: holder.angle * 0.5 });
        };
        timeline.fromTo(el, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.22 }, delay);
        timeline.to(holder, { angle: startAngle + (motion === 'orbit' ? 360 : 250), radius: reach, duration: motion === 'orbit' ? 1.4 : 1.15, ease: 'power1.inOut', onUpdate: update }, delay);
        if (motion === 'swirl') timeline.to(el, { y: '+=90', duration: 0.6, ease: 'power1.in' }, delay + 1.05);
        timeline.to(el, { opacity: 0, duration: 0.35, onComplete: () => el.remove() }, delay + (motion === 'orbit' ? 1.3 : 1.25));
      } else if (motion === 'sweep-petals') {
        const box = layer.getBoundingClientRect();
        const el = sprite(key, size, { x: -60, y: point.y + rand(-140, 80) }, { blend: effect.blend });
        timeline.fromTo(el, { x: 0, rotation: rand(-90, 90), opacity: 0 }, { x: box.width + 120, opacity: 1, rotation: `+=${rand(240, 420)}`, duration: rand(1.4, 1.9), ease: 'sine.inOut' }, delay * 1.6);
        timeline.to(el, { y: `+=${rand(-70, 70)}`, duration: 0.45, yoyo: true, repeat: 3, ease: 'sine.inOut' }, delay * 1.6);
        timeline.call(() => el.remove(), null, delay * 1.6 + 1.95);
      } else {
        const el = sprite(key, size, point, { blend: effect.blend });
        timeline.to(el, { physics2D: { velocity: rand(480, 700), angle: rand(-150, -30), gravity: 1500 }, rotation: rand(-200, 200), duration: rand(0.95, 1.2), ease: 'none' }, delay);
        timeline.fromTo(el, { scale: 0.4 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' }, delay);
        timeline.to(el, { opacity: 0, duration: 0.25, onComplete: () => el.remove() }, delay + 0.85);
      }
    }
    return timeline;
  }

  // 사진 한 줄기(오로라 · 무대 조명 · 불꽃)가 탁자를 가로질러 흐른다 — 사진을 밝게 섞어서
  function band(key, at, { height = 300, duration = 1.2 } = {}) {
    if (reduced()) return gsap.timeline();
    const point = local(at);
    const el = h('div.fx-band');
    el.style.backgroundImage = `url("${scene(key)}")`;
    el.style.top = `${point.y - height / 2}px`;
    el.style.height = `${height}px`;
    layer.append(el);
    return gsap.timeline({ onComplete: () => el.remove() })
      .fromTo(el, { opacity: 0, scaleY: 0.5 }, { opacity: 1, scaleY: 1, duration: 0.3, ease: 'power2.out' }, 0)
      .fromTo(el, { backgroundPosition: '0% 50%' }, { backgroundPosition: '100% 50%', duration, ease: 'sine.inOut' }, 0)
      .to(el, { opacity: 0, duration: 0.4 }, duration - 0.25);
  }

  // 장난감을 누를 때 — 꽃잎 · 물보라 두세 개
  function toyBurst(toy, at) {
    if (reduced()) return null;
    const point = local(at);
    const timeline = gsap.timeline();
    const keys = toy.burst || [];
    const total = toy.motion === 'fountain' ? 4 : 2;
    for (let index = 0; index < total; index += 1) {
      const key = keys[index % keys.length];
      const big = key === 'water-splash';
      const el = sprite(key, big ? rand(110, 150) : rand(34, 52), point, { blend: big ? 'screen' : 'normal' });
      if (big) {
        timeline.fromTo(el, { scale: 0.2, y: 20, opacity: 0.95 }, { scale: 1.2, y: -50, duration: 0.5, ease: 'power2.out' }, index * 0.12);
        timeline.to(el, { opacity: 0, duration: 0.35, onComplete: () => el.remove() }, index * 0.12 + 0.45);
      } else {
        timeline.fromTo(el, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, x: rand(-70, 70), y: -rand(50, 90), rotation: rand(-120, 120), duration: 0.45, ease: 'power2.out' }, index * 0.1);
        timeline.to(el, { y: '+=110', rotation: '+=90', opacity: 0, duration: 0.8, ease: 'power1.in', onComplete: () => el.remove() }, index * 0.1 + 0.45);
      }
    }
    return timeline;
  }

  // ── 카드 효과
  function attack({ at, added, total, joker = false, owner = 'me' }) {
    shockwave(at, '#e8483b');
    shake(0.6 + Math.min(1, total / 8));
    play('chips', { volume: 0.85 });
    play('chip', { delay: 0.08, volume: 0.6 });
    const timeline = director.timeline();
    timeline.add(slab({ text: `+${added}`, sub: total > added ? `쌓인 공격 ${total}장` : '공격', color: '#e8483b', ink: '#fff', at, size: 'm', tilt: owner === 'me' ? -9 : 7, hold: 0.35, from: owner === 'me' ? 'left' : 'right' }), 0);
    if (total >= 5 && !reduced()) {
      const fire = sprite('fire', 150, local({ x: at.x, y: at.y - 10 }), { blend: 'screen' });
      timeline.fromTo(fire, { scaleY: 0.2, scaleX: 0.6, opacity: 1, transformOrigin: '50% 100%' }, { scaleY: 1.25, scaleX: 1, duration: 0.3, ease: 'back.out(2)' }, 0.05);
      timeline.to(fire, { scaleY: 1.05, duration: 0.12, yoyo: true, repeat: 3 }, 0.35);
      timeline.to(fire, { opacity: 0, duration: 0.35, onComplete: () => fire.remove() }, 0.85);
    }
    if (joker) timeline.duration();
    return timeline;
  }

  function jokerTime({ at, owner = 'me', card }) {
    const box = layer.getBoundingClientRect();
    const center = { x: box.width / 2, y: box.height * 0.45 };
    const dim = h('div.fx-dim');
    layer.append(dim);
    const big = cardFace(card || { id: 'joker-fx', suit: 'joker', rank: 'JOKER' });
    big.classList.add('fx-joker-card');
    layer.append(big);
    const start = local(at);
    gsap.set(big, { left: start.x, top: start.y, xPercent: -50, yPercent: -50, scale: 0.9 });
    const letters = h('div.fx-joker-word', {}, ...'JOKER'.split('').map((letter) => h('b', {}, letter)));
    layer.append(letters);
    gsap.set(letters, { left: center.x, top: center.y + box.height * 0.2, xPercent: -50, yPercent: -50 });
    play('glitch', { volume: 0.7 });
    play('bong', { delay: 0.3 });
    play('stack', { delay: 0.55 });
    const timeline = director.timeline({ onComplete: () => { dim.remove(); big.remove(); letters.remove(); } });
    if (reduced()) {
      timeline.to(dim, { opacity: 0.6, duration: 0.15 }).to(big, { left: center.x, top: center.y, scale: 1.8, duration: 0.25 }, 0)
        .to([dim, big, letters], { opacity: 0, duration: 0.25, delay: 0.6 });
      return timeline;
    }
    timeline.fromTo(dim, { opacity: 0 }, { opacity: 0.78, duration: 0.25 }, 0);
    timeline.to(big, { left: center.x, top: center.y, scale: 2.3, rotationY: 720, rotation: owner === 'me' ? -6 : 6, duration: 0.7, ease: 'power3.out' }, 0);
    timeline.call(() => { shockwave({ x: box.left + center.x, y: box.top + center.y }, '#f2b544', { size: 420, rings: 3 }); shake(1.6); flash('#f2b544', 0.18); }, null, 0.62);
    timeline.fromTo(letters.children, { y: (index) => (index % 2 ? -160 : 160), opacity: 0, rotation: () => rand(-14, 14) },
      { y: 0, opacity: 1, rotation: () => rand(-5, 5), duration: 0.32, stagger: 0.05, ease: 'back.out(2.6)' }, 0.55);
    timeline.add(slab({ text: '+5', sub: '조커로만 막을 수 있어요', color: '#e8483b', ink: '#fff', size: 'l', tilt: -8, hold: 0.55, at: { x: box.left + center.x, y: box.top + center.y + box.height * 0.33 } }), 0.82);
    timeline.to(letters, { opacity: 0, scale: 1.15, duration: 0.25 }, 1.75);
    timeline.to(big, { left: start.x, top: start.y, scale: 1, rotationY: 0, rotation: 0, duration: 0.42, ease: 'power3.inOut' }, 1.75);
    timeline.to(dim, { opacity: 0, duration: 0.35 }, 1.85);
    return timeline;
  }

  function suitChange({ at, suit, medallion }) {
    play('glass', { volume: 0.8 });
    play('pluck', { delay: 0.18, rate: 1.3 });
    const timeline = director.timeline();
    shockwave(at, RED_SUITS.has(suit) ? '#e8483b' : '#e9eef6', { size: 200 });
    if (medallion && !reduced()) {
      const order = ['spades', 'hearts', 'clubs', 'diamonds'];
      const holder = { step: 0 };
      timeline.fromTo(medallion, { scale: 0.4, rotationY: 0 }, { scale: 1.35, rotationY: 1080, duration: 0.7, ease: 'power3.out' }, 0);
      timeline.to(holder, {
        step: 9, duration: 0.6, ease: 'power2.out', onUpdate: () => {
          const current = order[Math.floor(holder.step) % 4];
          medallion.querySelector('.medal-suit').innerHTML = suitSvg(current);
          medallion.classList.toggle('is-red', RED_SUITS.has(current));
        },
        onComplete: () => {
          medallion.querySelector('.medal-suit').innerHTML = suitSvg(suit);
          medallion.classList.toggle('is-red', RED_SUITS.has(suit));
        },
      }, 0);
      timeline.to(medallion, { scale: 1, duration: 0.3, ease: 'back.out(2)' }, 0.72);
    }
    timeline.add(slab({ text: `${SUIT_NAMES[suit]}로 변경`, color: RED_SUITS.has(suit) ? '#e8483b' : '#e9eef6', ink: RED_SUITS.has(suit) ? '#fff' : '#121a2b', size: 'm', at: { x: at.x, y: at.y + 130 }, tilt: -5, hold: 0.4 }), 0.25);
    return timeline;
  }

  function skip({ zone, portrait, owner = 'me' }) {
    play('whoosh', { volume: 0.8 });
    const rect = zone.getBoundingClientRect();
    const point = local({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    const timeline = director.timeline();
    const chevrons = h('div.fx-chevrons', { html: '<svg viewBox="0 0 160 100"><path d="M10 10 50 50 10 90" /><path d="M60 10 100 50 60 90"/><path d="M110 10 150 50 110 90"/></svg>' });
    chevrons.style.left = `${point.x}px`;
    chevrons.style.top = `${point.y}px`;
    layer.append(chevrons);
    const direction = owner === 'me' ? 1 : -1;
    timeline.fromTo(chevrons, { xPercent: -50 - 300 * direction, yPercent: -50, opacity: 0 }, { xPercent: -50, opacity: 1, duration: 0.25, ease: 'power3.out' }, 0);
    timeline.to(chevrons, { xPercent: -50 + 300 * direction, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => chevrons.remove() }, 0.55);
    if (portrait) {
      timeline.to(portrait, { filter: 'grayscale(1) brightness(.8)', duration: 0.15 }, 0.1);
      timeline.fromTo(portrait, { rotation: -6 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(2, .3)' }, 0.1);
      timeline.to(portrait, { filter: 'none', duration: 0.3 }, 0.9);
    }
    timeline.add(slab({ text: '건너뛰기', sub: owner === 'me' ? '한 번 더 내 차례' : '상대가 한 번 더', color: '#7c93ff', ink: '#fff', size: 'm', at: { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.62 }, tilt: 5, hold: 0.35 }), 0.05);
    return timeline;
  }

  function oneCard({ zone, name, color = '#f2b544', mine = false, lastCard = null }) {
    play('onecard');
    const rect = zone.getBoundingClientRect();
    const timeline = director.timeline();
    flash(color, 0.14);
    shake(0.6);
    if (lastCard && !reduced()) timeline.fromTo(lastCard, { y: 0, rotation: 0 }, { y: -46, rotation: 360, duration: 0.6, ease: 'back.out(1.6)', yoyo: true, repeat: 1, repeatDelay: 0.2 }, 0);
    timeline.add(slab({ text: '원카드!', sub: mine ? '마지막 한 장이에요' : `${name}의 마지막 한 장`, color, ink: '#121a2b', size: 'l', tilt: mine ? -8 : 8, hold: 0.7, at: { x: rect.left + rect.width / 2, y: rect.top + rect.height * (mine ? 0.15 : 0.85) }, from: mine ? 'left' : 'right' }), 0.05);
    return timeline;
  }

  function penalty({ zone, count, mine }) {
    play('shove', { volume: 0.9 });
    const rect = zone.getBoundingClientRect();
    const at = { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.5 };
    shockwave(at, '#e8483b', { size: 160, rings: 1 });
    const timeline = director.timeline();
    timeline.add(slab({ text: `+${count}장`, sub: mine ? '공격을 받았어요' : '상대가 공격을 받았어요', color: '#1b1d24', ink: '#fff', size: 'm', tilt: mine ? 6 : -6, hold: 0.45, at }), 0);
    if (!reduced()) {
      const puff = sprite('smoke', 160, local({ x: at.x, y: at.y }), { blend: 'screen' });
      timeline.fromTo(puff, { scale: 0.3, opacity: 0.85 }, { scale: 1.3, opacity: 0, y: -40, duration: 0.9, ease: 'power2.out', onComplete: () => puff.remove() }, 0.02);
    }
    return timeline;
  }

  function bonusStart() {
    play('bonus');
    const box = layer.getBoundingClientRect();
    const timeline = director.timeline();
    timeline.add(slab({ text: '보너스판', sub: '이기면 점수가 2배예요', color: '#f2b544', ink: '#121a2b', size: 'xl', tilt: -6, hold: 0.9 }), 0);
    if (!reduced()) {
      [0.16, 0.84].forEach((ratio, index) => {
        const popper = sprite('gift-box', 140, { x: box.width * ratio, y: box.height * 0.64 });
        timeline.fromTo(popper, { scale: 0, rotation: index ? 35 : -35 }, { scale: 1, rotation: index ? 18 : -18, duration: 0.35, ease: 'back.out(2)' }, 0.1);
        const confetti = sprite('confetti', 170, { x: box.width * ratio + (index ? -60 : 60), y: box.height * 0.5 });
        timeline.fromTo(confetti, { scale: 0.2, opacity: 0 }, { scale: 1.1, opacity: 1, y: -60, duration: 0.45, ease: 'power2.out' }, 0.25);
        timeline.to([popper, confetti], { opacity: 0, duration: 0.3, onComplete: () => { popper.remove(); confetti.remove(); } }, 1.4);
      });
    }
    return timeline;
  }

  // ── 승리(victory.js — 맵 위 마지막 한 장 → 우는 상대 → 뛰어오르는 나 → 승리 장면) · 패배
  function victory(options) {
    return playVictory({ layer, director, shockwave, shake, reduced }, options);
  }

  // 패배 — 상대 초상이 가운데로 다가오고, 이긴 상대 이름
  function defeat({ rival, portrait }) {
    play('lose');
    const box = layer.getBoundingClientRect();
    const stage = h('div.fx-defeat', {}, h('i.d-dim'));
    layer.append(stage);
    const timeline = director.timeline();
    timeline.fromTo(stage.querySelector('.d-dim'), { opacity: 0 }, { opacity: 0.7, duration: 0.4 }, 0);
    const size = Math.min(300, box.width * 0.46, box.height * 0.42);
    const face = sprite(rival.portrait, size, { x: box.width / 2, y: box.height * 0.4 });
    face.classList.add('d-portrait');
    timeline.fromTo(face, { scale: 0.5, y: 70, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.15);
    timeline.to(face, { rotation: -3, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.85);
    if (portrait) timeline.to(portrait, { y: -8, duration: 0.2, yoyo: true, repeat: 3 }, 0.3);
    const word = h('div.v-word.is-defeat', {}, h('b', {}, '패배'), h('small', {}, `${rival.name}의 승리`));
    stage.append(word);
    gsap.set(word, { left: box.width / 2, top: box.height * 0.7, xPercent: -50, yPercent: -50 });
    timeline.fromTo(word, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.5);
    timeline.to({}, { duration: 0.5 }, '>');
    return { timeline, scene: stage, finish: () => { stage.remove(); face.remove(); } };
  }

  return { burst, band, toyBurst, attack, jokerTime, suitChange, skip, oneCard, penalty, bonusStart, victory, defeat, slab, shockwave, shake, flash, sprite, local };
}
