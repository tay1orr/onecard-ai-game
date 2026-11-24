// 보상 상자 고르기 — 선물 상자 셋이 떨어지고, 하나를 고르면 흔들리다 열린다.
// 열리면 기본 점수가 먼저 오르고, 배수(×2 · ×3 · ×5 · ×10) 도장이 찍히며 한 번 더 뛴다. 아이템이 들어 있으면 점수와 함께 나온다.
// 고른 뒤 나머지 둘도 열어 무엇이 들어 있었는지 보여 준다. 내용은 미리 정해져 있고 고르는 것은 순수한 선택이다.
import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { h, formatNumber } from './dom.js';
import { cut } from '../data/assets.js';
import { cosmeticById, COSMETIC_SLOTS } from '../core/cosmetics.js';
import { RARITY_NAMES } from '../core/reward-box.js';
import { itemPreview } from './item-preview.js';
import { play } from './sound.js';
import { settings } from './settings.js';

gsap.registerPlugin(Physics2DPlugin);

const BOX_ART = ['box-heart', 'box-white', 'box-black'];
const rand = (min, max) => min + Math.random() * (max - min);
const slotName = (slot) => COSMETIC_SLOTS.find((entry) => entry.key === slot)?.name || '';
const COINS = { common: 3, rare: 5, epic: 7, legend: 10, mythic: 16 };

function peekLabel(box) {
  const points = `${box.multiplier > 1 ? `×${box.multiplier} ` : ''}+${formatNumber(box.amount)}점`;
  return box.itemId ? `${points} · ${cosmeticById(box.itemId)?.name || '아이템'}` : points;
}

export function openRewardBoxes({ host, boxes, won, veteran = 1, games = 0 }) {
  return new Promise((resolve) => {
    const reduced = settings.reduced();
    const title = h('h2.rb-title', {}, won ? '승리 보상 상자' : '위로 상자');
    const sub = h('p.rb-sub', {}, '상자 하나를 골라 열어 보세요. 어느 상자든 점수가 들어 있어요');
    const vet = veteran > 1 ? h('p.rb-vet', {}, `판수 보너스 ×${veteran.toFixed(1)} · 지금까지 ${formatNumber(games)}판`) : null;
    const buttons = boxes.map((box, index) => h('button.rb-box', {
      type: 'button', 'aria-label': `${index + 1}번 상자 열기`, dataset: { slot: index },
      onClick: () => pick(index),
    }, h('span.rb-shadow'), h('img.rb-art', { src: cut(BOX_ART[index % BOX_ART.length]), alt: '', draggable: 'false' }), h('span.rb-peek')));
    const row = h('div.rb-row', {}, ...buttons);
    const reveal = h('div.rb-reveal', { role: 'status', 'aria-live': 'polite' });
    const take = h('button.btn.primary.rb-take', { type: 'button', hidden: true }, '받기');
    const glow = h('i.rb-glow');
    const flash = h('i.rb-flash');
    const overlay = h('div.reward-boxes', { role: 'dialog', 'aria-label': '보상 상자 고르기' }, h('i.rb-dim'), glow, flash, title, sub, vet, row, reveal, take);
    host.append(overlay);
    let picked = false;

    // 등장 — 위에서 떨어져 통 튀고, 살짝 떠 있는다
    gsap.fromTo(overlay.querySelector('.rb-dim'), { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo([title, sub, vet].filter(Boolean), { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power3.out' });
    buttons.forEach((button, index) => {
      gsap.fromTo(button, { y: -420, rotation: rand(-24, 24), opacity: 0 }, { y: 0, rotation: [-5, 3, -2][index], opacity: 1, duration: reduced ? 0.2 : 0.75, delay: 0.12 + index * 0.12, ease: reduced ? 'none' : 'bounce.out' });
      if (!reduced) gsap.to(button.querySelector('.rb-art'), { y: -8, duration: 1.3 + index * 0.17, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 + index * 0.2 });
    });
    setTimeout(() => play('drop', { volume: 0.6 }), 260);
    setTimeout(() => play('drop', { volume: 0.5, rate: 1.1 }), 400);
    setTimeout(() => play('drop', { volume: 0.5, rate: 1.2 }), 520);
    setTimeout(() => buttons[0]?.focus(), 900);

    function burstCoins(at, count) {
      if (reduced) return;
      for (let index = 0; index < count; index += 1) {
        const coin = h('img.rb-coin', { src: cut('gold-coins'), alt: '' });
        overlay.append(coin);
        gsap.set(coin, { left: at.x - 36, top: at.y - 36 });
        gsap.to(coin, { physics2D: { velocity: rand(520, 860), angle: rand(-150, -30), gravity: 1400 }, rotation: rand(-240, 240), duration: 1.3, ease: 'none', delay: index * 0.04, onComplete: () => coin.remove() });
        gsap.to(coin, { opacity: 0, duration: 0.3, delay: 0.95 + index * 0.04 });
      }
    }

    // 점수 카드 — 기본 점수가 오른 뒤 배수 도장이 찍히고 다시 오른다. 아이템은 아래에 함께
    function playContent(box, at) {
      const number = h('b.rb-points', {}, '+0');
      const card = h(`div.rb-card.r-${box.rarity}`, {}, h('span.rb-rarity', {}, `${RARITY_NAMES[box.rarity] || '일반'} 상자`), number, h('small.rb-kind', {}, '점'));
      reveal.replaceChildren(card);
      const timeline = gsap.timeline();
      const counter = { value: 0 };
      const show = () => { number.textContent = `+${formatNumber(Math.round(counter.value))}`; };
      timeline.fromTo(card, { scale: 0.3, y: 60, opacity: 0, rotation: -8 }, { scale: 1, y: 0, opacity: 1, rotation: 0, duration: reduced ? 0.15 : 0.55, ease: 'back.out(2)' });
      timeline.to(counter, { value: box.base, duration: reduced ? 0.1 : 0.6, ease: 'power2.out', onUpdate: show }, reduced ? 0 : 0.2);
      if (box.multiplier > 1) {
        const stamp = h('b.rb-mult', {}, `×${box.multiplier}`);
        card.append(stamp);
        const big = box.multiplier >= 5;
        timeline.fromTo(stamp, { scale: 2.8, opacity: 0, rotation: -24 }, { scale: 1, opacity: 1, rotation: -8, duration: reduced ? 0.1 : 0.32, ease: 'power4.in' }, '+=0.15');
        timeline.call(() => {
          play(big ? 'bonus' : 'stack', { volume: big ? 1 : 0.8 });
          if (big) play('unlock', { volume: 0.7 });
          if (!reduced) {
            gsap.fromTo(card, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: 'elastic.out(1.2, 0.4)' });
            gsap.fromTo(flash, { opacity: big ? 0.85 : 0.4 }, { opacity: 0, duration: big ? 0.7 : 0.4, ease: 'power2.out' });
          }
          burstCoins(at, COINS[box.rarity] || 4);
        });
        timeline.to(counter, { value: box.amount, duration: reduced ? 0.1 : (big ? 1.1 : 0.7), ease: 'power2.out', onUpdate: show }, '>');
      } else {
        timeline.call(() => { play('stack', { volume: 0.7 }); burstCoins(at, COINS.common); });
      }
      if (box.itemId) {
        const item = cosmeticById(box.itemId);
        const extra = h('div.rb-item', {}, itemPreview(item), h('div.rb-item-text', {}, h('small.rb-kind', {}, `상자 전용 ${slotName(item?.slot)}도 함께`), h('b.rb-name', {}, item?.name || '아이템')));
        card.append(extra);
        timeline.fromTo(extra, { y: 18, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: reduced ? 0.1 : 0.4, ease: 'back.out(1.8)' }, '+=0.1');
        timeline.call(() => play('unlock'));
      }
      timeline.call(show);
      return timeline;
    }

    async function pick(index) {
      if (picked) return;
      picked = true;
      const box = boxes[index];
      const chosen = buttons[index];
      play('select');
      buttons.forEach((button, other) => {
        button.disabled = true;
        gsap.killTweensOf(button.querySelector('.rb-art'));
        if (other !== index) gsap.to(button, { opacity: 0.4, scale: 0.86, duration: 0.3 });
      });
      const shake = gsap.timeline();
      if (!reduced) {
        // 기대감 — 점점 세게 세 번 흔들린다
        play('dice', { volume: 0.7 });
        shake.to(chosen, { scale: 1.18, y: -18, duration: 0.25, ease: 'power2.out' });
        [5, 9, 14].forEach((power, beat) => {
          shake.to(chosen, { rotation: power, duration: 0.06 }).to(chosen, { rotation: -power, duration: 0.08 }).to(chosen, { rotation: 0, duration: 0.07 });
          shake.to({}, { duration: 0.14 - beat * 0.03 });
        });
      }
      await shake;
      // 열림 — 빛이 터지고 상자가 부풀며 사라진다
      play('pack', { volume: 0.9 });
      const rect = chosen.getBoundingClientRect();
      const box0 = overlay.getBoundingClientRect();
      const at = { x: rect.left - box0.left + rect.width / 2, y: rect.top - box0.top + rect.height * 0.45 };
      gsap.set(glow, { left: at.x, top: at.y, xPercent: -50, yPercent: -50 });
      gsap.fromTo(glow, { scale: 0.2, opacity: 0.95 }, { scale: 2.6, opacity: 0, duration: reduced ? 0.2 : 0.9, ease: 'power2.out' });
      gsap.to(chosen.querySelector('.rb-art'), { scale: 1.5, opacity: 0, duration: 0.35, ease: 'power2.in' });
      sub.textContent = box.multiplier > 1 ? `${RARITY_NAMES[box.rarity]} 상자 — 점수 ×${box.multiplier}!` : '점수를 받았어요';
      await playContent(box, at);
      // 나머지 상자도 열어 보여 준다
      await new Promise((done) => setTimeout(done, reduced ? 150 : 500));
      buttons.forEach((button, other) => {
        if (other === index) return;
        const peek = button.querySelector('.rb-peek');
        peek.textContent = peekLabel(boxes[other]);
        peek.classList.add(`r-${boxes[other].rarity}`);
        gsap.to(button.querySelector('.rb-art'), { opacity: 0.25, duration: 0.25 });
        gsap.fromTo(peek, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: other * 0.08, ease: 'power2.out' });
      });
      play('pluck', { rate: 1.3, volume: 0.5 });
      take.hidden = false;
      gsap.fromTo(take, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
      take.focus();
      take.addEventListener('click', () => {
        play('confirm');
        gsap.to(overlay, { opacity: 0, duration: 0.25, onComplete: () => { overlay.remove(); resolve(box); } });
      }, { once: true });
    }
  });
}
