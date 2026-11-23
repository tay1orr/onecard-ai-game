// 연출 — 기울어진 띠(방송 그래픽) · 충격파 · 화면 흔들림 · 큰 3D 소품.
// 빛 번짐 대신 무광 그림자 · 비대칭 기울기 · 조금씩 다른 간격으로(AI 티 피하기).
import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { h } from './dom.js';
import { anim, artUrl, img, ANIMATED } from '../data/assets.js';
import { cardFace } from './cards.js';
import { SUIT_NAMES, RED_SUITS, suitSvg } from './suits.js';
import { play } from './sound.js';
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

  function sprite(motif, size, at, { animated = false } = {}) {
    const el = h('img.fx-sprite', { src: animated && ANIMATED.has(motif) ? anim(motif) : (artUrl(motif) || img(motif)), alt: '', draggable: 'false' });
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${at.x - size / 2}px`;
    el.style.top = `${at.y - size / 2}px`;
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

  // 테마 소품 터뜨리기 — 적게 · 크게(작은 조각이 떼로 퍼지지 않게)
  function burst(theme, at, { count = 6, sizeScale = 1 } = {}) {
    if (!theme) return null;
    const physics = theme.physics;
    if (physics === 'aurora') return aurora(theme, at);
    if (physics === 'spotlight') return spotlight(theme, at);
    if (physics === 'thunder') return thunder(theme, at);
    if (physics === 'pixel') pixels(theme, at);
    const point = local(at);
    const motifs = theme.burst || [];
    const total = reduced() ? Math.min(2, count) : count;
    const timeline = gsap.timeline();
    for (let index = 0; index < total; index += 1) {
      const size = rand(52, 92) * sizeScale;
      const el = sprite(motifs[index % motifs.length], size, point);
      const delay = index * rand(0.02, 0.05);
      if (physics === 'float') {
        timeline.fromTo(el, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'back.out(2)' }, delay);
        timeline.to(el, { y: -rand(160, 260), x: rand(-140, 140), rotation: rand(-25, 25), duration: rand(1.1, 1.5), ease: 'sine.out' }, delay);
        timeline.to(el, { opacity: 0, duration: 0.4, onComplete: () => el.remove() }, delay + 0.9);
      } else if (physics === 'pop') {
        const angle = (index / total) * Math.PI * 2 + rand(-0.3, 0.3);
        const distance = rand(90, 170);
        timeline.fromTo(el, { scale: 0, rotation: rand(-40, 40) }, { scale: 1.15, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance * 0.7, duration: 0.32, ease: 'back.out(2.4)' }, delay);
        timeline.to(el, { scale: 0, rotation: rand(-90, 90), duration: 0.3, ease: 'power2.in', onComplete: () => el.remove() }, delay + 0.55);
      } else if (physics === 'orbit' || physics === 'swirl') {
        const startAngle = (index / total) * 360;
        const radius = rand(110, 160);
        const holder = { angle: startAngle, radius: 20 };
        const update = () => {
          const rad = (holder.angle * Math.PI) / 180;
          gsap.set(el, { x: Math.cos(rad) * holder.radius, y: Math.sin(rad) * holder.radius * 0.62, rotation: holder.angle * 0.4 });
        };
        timeline.fromTo(el, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.2 }, delay);
        timeline.to(holder, { angle: startAngle + (physics === 'swirl' ? 260 : 360), radius: physics === 'swirl' ? radius * 1.8 : radius, duration: 1.1, ease: 'power1.inOut', onUpdate: update }, delay);
        timeline.to(el, { opacity: 0, duration: 0.3, onComplete: () => el.remove() }, delay + 0.9);
      } else {
        timeline.to(el, {
          physics2D: { velocity: rand(520, 760), angle: rand(-155, -25), gravity: 1500 },
          rotation: rand(-260, 260), duration: rand(0.9, 1.2), ease: 'none',
        }, delay);
        timeline.fromTo(el, { scale: 0.4 }, { scale: 1, duration: 0.18, ease: 'back.out(2)' }, delay);
        timeline.to(el, { opacity: 0, duration: 0.25, onComplete: () => el.remove() }, delay + 0.78);
      }
    }
    return timeline;
  }

  function pixels(theme, at) {
    const point = local(at);
    const colors = [theme.accent, theme.accent2, '#ffe66d', '#ffffff'];
    for (let index = 0; index < (reduced() ? 4 : 14); index += 1) {
      const el = h('i.fx-pixel');
      const size = pick([10, 14, 18]);
      Object.assign(el.style, { width: `${size}px`, height: `${size}px`, left: `${point.x}px`, top: `${point.y}px`, background: colors[index % colors.length] });
      layer.append(el);
      const angle = (index / 14) * Math.PI * 2;
      gsap.to(el, { x: Math.cos(angle) * rand(80, 190), y: Math.sin(angle) * rand(60, 150), duration: 0.6, ease: 'steps(6)', onComplete: () => el.remove() });
    }
  }

  function aurora(theme, at) {
    const point = local(at);
    const svg = h('div.fx-aurora', { html: `<svg viewBox="0 0 600 240" preserveAspectRatio="none"><defs><linearGradient id="au1" x1="0" x2="1"><stop offset="0" stop-color="${theme.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${theme.accent}"/><stop offset="1" stop-color="${theme.accent2}" stop-opacity="0"/></linearGradient></defs><path d="M0 150 C120 60 220 210 330 110 S520 60 600 120" fill="none" stroke="url(#au1)" stroke-width="22" stroke-linecap="round"/><path d="M0 180 C140 110 250 230 360 150 S500 110 600 160" fill="none" stroke="url(#au1)" stroke-width="12" stroke-linecap="round" opacity=".7"/></svg>` });
    svg.style.left = `${point.x - 300}px`;
    svg.style.top = `${point.y - 120}px`;
    layer.append(svg);
    const paths = svg.querySelectorAll('path');
    paths.forEach((path) => { const length = path.getTotalLength(); path.style.strokeDasharray = length; path.style.strokeDashoffset = length; });
    return gsap.timeline({ onComplete: () => svg.remove() })
      .to(paths, { strokeDashoffset: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' })
      .to(svg, { opacity: 0, y: -30, duration: 0.5 }, 0.75);
  }

  function spotlight(theme, at) {
    const point = local(at);
    const cone = h('div.fx-cone');
    cone.style.left = `${point.x - 160}px`;
    cone.style.top = `${point.y - 520}px`;
    layer.append(cone);
    const timeline = gsap.timeline({ onComplete: () => cone.remove() });
    timeline.fromTo(cone, { opacity: 0, rotation: -24, transformOrigin: '50% 0%' }, { opacity: 1, rotation: 0, duration: 0.35, ease: 'power2.out' });
    timeline.call(() => burst({ ...theme, physics: 'pop', burst: ['sparkles'] }, at, { count: 4, sizeScale: 0.8 }), null, 0.25);
    timeline.to(cone, { opacity: 0, duration: 0.45 }, 0.8);
    return timeline;
  }

  function thunder(theme, at) {
    const point = local(at);
    const bolt = h('div.fx-bolt', { html: '<svg viewBox="0 0 120 420"><path d="M70 0 L30 180 L72 176 L24 420 L102 150 L58 156 L94 0Z" fill="#ffe14d" stroke="#1b1d24" stroke-width="6" stroke-linejoin="round"/></svg>' });
    bolt.style.left = `${point.x - 60}px`;
    bolt.style.top = `${point.y - 420}px`;
    layer.append(bolt);
    flash('#fff6c4', 0.3);
    shake(0.7);
    play('glitch', { volume: 0.6 });
    const timeline = gsap.timeline({ onComplete: () => bolt.remove() });
    timeline.fromTo(bolt, { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.12, ease: 'power4.in' });
    timeline.to(bolt, { opacity: 0, duration: 0.3, delay: 0.18 });
    const spark = sprite('high-voltage', 110, point, { animated: true });
    timeline.fromTo(spark, { scale: 0 }, { scale: 1.2, duration: 0.25, ease: 'back.out(2)' }, 0.1);
    timeline.to(spark, { opacity: 0, duration: 0.3, onComplete: () => spark.remove() }, 0.7);
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
      const fire = sprite('fire', 120, local({ x: at.x, y: at.y + 20 }), { animated: true });
      timeline.fromTo(fire, { scale: 0, opacity: 1 }, { scale: 1.3, duration: 0.3, ease: 'back.out(2)' }, 0.05);
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
      const dizzy = sprite('dizzy', 88, local({ x: at.x + 90, y: at.y - 40 }));
      timeline.fromTo(dizzy, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2)' }, 0.05);
      timeline.to(dizzy, { opacity: 0, y: -30, duration: 0.35, onComplete: () => dizzy.remove() }, 0.8);
    }
    return timeline;
  }

  function bonusStart() {
    play('bonus');
    const box = layer.getBoundingClientRect();
    const timeline = director.timeline();
    timeline.add(slab({ text: '보너스판', sub: '이기면 점수가 2배예요', color: '#f2b544', ink: '#121a2b', size: 'xl', tilt: -6, hold: 0.9 }), 0);
    if (!reduced()) {
      [0.18, 0.82].forEach((ratio, index) => {
        const popper = sprite('party-popper', 130, { x: box.width * ratio, y: box.height * 0.62 }, { animated: true });
        timeline.fromTo(popper, { scale: 0, rotation: index ? 20 : -20 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0.1);
        timeline.to(popper, { opacity: 0, duration: 0.3, onComplete: () => popper.remove() }, 1.4);
      });
    }
    return timeline;
  }

  // ── 승리 · 패배
  function victory({ theme, avatarEl = null, title = '승리', sub = '' }) {
    play('win');
    const box = layer.getBoundingClientRect();
    const center = { x: box.width / 2, y: box.height * 0.38 };
    const scene = h('div.fx-victory', { vars: { '--v-accent': theme.accent, '--v-accent2': theme.accent2 || '#ffffff' } },
      h('i.v-dim'), h('i.v-band.band-a'), h('i.v-band.band-b'), h('i.v-band.band-c'));
    layer.append(scene);
    const timeline = director.timeline();
    timeline.fromTo(scene.querySelector('.v-dim'), { opacity: 0 }, { opacity: 0.72, duration: 0.3 }, 0);
    scene.querySelectorAll('.v-band').forEach((band, index) => {
      timeline.fromTo(band, { xPercent: index % 2 ? 120 : -120 }, { xPercent: 0, duration: 0.42, ease: 'power3.out' }, 0.05 + index * 0.07);
    });
    let rays = null;
    if (['sunburst', 'champion', 'celestial'].includes(theme.victory) && !reduced()) {
      rays = h('div.v-rays');
      scene.append(rays);
      gsap.set(rays, { left: center.x, top: center.y, xPercent: -50, yPercent: -50 });
      timeline.fromTo(rays, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6 }, 0.2);
      gsap.to(rays, { rotation: 360, duration: 14, ease: 'none', repeat: -1 });
    }
    const hero = sprite(theme.hero || 'trophy', Math.min(260, box.width * 0.42), center, { animated: true });
    hero.classList.add('v-hero');
    timeline.fromTo(hero, { y: box.height * 0.6, scale: 0.4, rotation: -14 }, { y: 0, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.5)' }, 0.25);
    const sweep = h('i.v-sweep');
    scene.append(sweep);
    gsap.set(sweep, { left: center.x, top: center.y, xPercent: -50, yPercent: -50 });
    timeline.fromTo(sweep, { x: -220, opacity: 0 }, { x: 220, opacity: 0.5, duration: 0.6, ease: 'power2.inOut' }, 0.95);
    timeline.to(sweep, { opacity: 0, duration: 0.2 }, 1.5);
    timeline.call(() => { shake(1); shockwave({ x: box.left + center.x, y: box.top + center.y }, theme.accent, { size: 380, rings: 2 }); }, null, 0.85);

    const motifs = theme.burst?.length ? theme.burst : ['star'];
    const style = reduced() ? 'none' : theme.victory;
    if (style === 'cannons' || style === 'classic' || style === 'champion') {
      [[0.04, -60], [0.96, -120]].forEach(([ratio, angle], side) => {
        for (let index = 0; index < 9; index += 1) {
          const el = sprite(pick(style === 'champion' ? ['trophy', 'medal', 'sparkles'] : motifs), rand(56, 96), { x: box.width * ratio, y: box.height * 0.95 });
          timeline.to(el, { physics2D: { velocity: rand(900, 1250), angle: angle + rand(-14, 14), gravity: 1300 }, rotation: rand(-360, 360), duration: 1.9, ease: 'none' }, 0.5 + index * 0.06 + side * 0.04);
          timeline.to(el, { opacity: 0, duration: 0.3, onComplete: () => el.remove() }, 2.15 + index * 0.05);
        }
      });
    } else if (style === 'fireworks' || style === 'laser') {
      for (let index = 0; index < 5; index += 1) {
        const at = { x: box.width * rand(0.12, 0.88), y: box.height * rand(0.12, 0.5) };
        const el = sprite(style === 'laser' ? pick(motifs) : pick(['fireworks', 'sparkler']), rand(120, 180), at);
        timeline.fromTo(el, { scale: 0, rotation: rand(-30, 30) }, { scale: 1.2, duration: 0.35, ease: 'back.out(2)' }, 0.45 + index * 0.22);
        timeline.call(() => play('pluck', { rate: rand(1.4, 2), volume: 0.4 }), null, 0.45 + index * 0.22);
        timeline.to(el, { scale: 0.2, opacity: 0, duration: 0.4, onComplete: () => el.remove() }, 0.95 + index * 0.22);
      }
      if (style === 'laser') {
        [0, 1, 2, 3].forEach((index) => {
          const beam = h('i.v-beam');
          scene.append(beam);
          gsap.set(beam, { left: `${15 + index * 23}%`, top: '-10%', rotation: index % 2 ? 24 : -24, transformOrigin: '50% 0%' });
          timeline.fromTo(beam, { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: 'power3.out' }, 0.3 + index * 0.08);
          timeline.to(beam, { rotation: index % 2 ? -24 : 24, duration: 1.2, ease: 'sine.inOut' }, 0.6);
        });
      }
    } else if (style === 'rain' || style === 'arcade' || style === 'bloom' || style === 'coronation') {
      for (let index = 0; index < 14; index += 1) {
        const el = sprite(pick(motifs), rand(52, 92), { x: box.width * rand(0.04, 0.96), y: -80 });
        timeline.to(el, { y: box.height + 160, rotation: rand(-220, 220), x: `+=${rand(-80, 80)}`, duration: rand(1.6, 2.3), ease: 'power1.in' }, 0.4 + index * 0.07);
        timeline.call(() => el.remove(), null, 2.8);
      }
      if (style === 'coronation' && avatarEl) {
        const rect = avatarEl.getBoundingClientRect();
        const crown = sprite('crown', 110, local({ x: rect.left + rect.width / 2, y: rect.top - 260 }));
        timeline.to(crown, { y: 230, duration: 0.7, ease: 'bounce.out' }, 0.9);
        timeline.to(crown, { opacity: 0, duration: 0.3, onComplete: () => crown.remove() }, 2.5);
      }
    } else if (style === 'celestial' || style === 'sunburst' || style === 'rise') {
      for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * Math.PI * 2;
        const el = sprite(pick(motifs), rand(48, 80), center);
        timeline.fromTo(el, { scale: 0 }, { scale: 1, x: Math.cos(angle) * rand(220, 360), y: Math.sin(angle) * rand(150, 260) + (style === 'rise' ? -120 : 0), rotation: rand(-120, 120), duration: 0.9, ease: 'power3.out' }, 0.75 + index * 0.02);
        timeline.to(el, { opacity: 0, duration: 0.4, onComplete: () => el.remove() }, 1.9 + index * 0.02);
      }
    }

    const word = h('div.v-word', {}, h('b', {}, title), sub ? h('small', {}, sub) : null);
    scene.append(word);
    gsap.set(word, { left: box.width / 2, top: box.height * 0.66, xPercent: -50, yPercent: -50 });
    timeline.fromTo(word, { scale: 2.2, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: -4, duration: 0.42, ease: 'back.out(2.4)' }, 0.6);
    timeline.call(() => play('stack', { volume: 0.7 }), null, 0.62);
    timeline.to({}, { duration: 0.6 }, '>');
    timeline.eventCallback('onComplete', () => {});
    return { timeline, scene, finish: () => { gsap.killTweensOf(rays); scene.remove(); hero.remove(); } };
  }

  function defeat({ rival, portrait }) {
    play('lose');
    const box = layer.getBoundingClientRect();
    const scene = h('div.fx-defeat', {}, h('i.d-dim'));
    layer.append(scene);
    const timeline = director.timeline();
    timeline.fromTo(scene.querySelector('.d-dim'), { opacity: 0 }, { opacity: 0.66, duration: 0.4 }, 0);
    const face = sprite(rival.motif, Math.min(220, box.width * 0.4), { x: box.width / 2, y: box.height * 0.4 }, { animated: true });
    timeline.fromTo(face, { scale: 0.3, y: 80, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)' }, 0.15);
    const smug = sprite(rival.faces?.smug || 'smirking', 90, { x: box.width / 2 + 110, y: box.height * 0.3 });
    timeline.fromTo(smug, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.35, ease: 'back.out(2)' }, 0.55);
    if (portrait) timeline.to(portrait, { y: -8, duration: 0.2, yoyo: true, repeat: 3 }, 0.3);
    const word = h('div.v-word.is-defeat', {}, h('b', {}, '패배'), h('small', {}, `${rival.name}의 승리`));
    scene.append(word);
    gsap.set(word, { left: box.width / 2, top: box.height * 0.66, xPercent: -50, yPercent: -50 });
    timeline.fromTo(word, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.5);
    timeline.to({}, { duration: 0.5 }, '>');
    return { timeline, scene, finish: () => { scene.remove(); face.remove(); smug.remove(); } };
  }

  return { burst, attack, jokerTime, suitChange, skip, oneCard, penalty, bonusStart, victory, defeat, slab, shockwave, shake, flash, sprite, local };
}
