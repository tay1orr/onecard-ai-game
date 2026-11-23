// 보상 상자 고르기 — 선물 상자 셋이 떨어지고, 하나를 고르면 흔들리다 열리며 점수(또는 상자 전용 아이템)가 나온다.
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

function contentLabel(box) {
  if (box.kind === 'item') return cosmeticById(box.itemId)?.name || '아이템';
  return `+${formatNumber(box.amount)}점`;
}

export function openRewardBoxes({ host, boxes, won }) {
  return new Promise((resolve) => {
    const reduced = settings.reduced();
    const title = h('h2.rb-title', {}, won ? '승리 보상 상자' : '위로 상자');
    const sub = h('p.rb-sub', {}, '상자 하나를 골라 열어 보세요');
    const buttons = boxes.map((box, index) => h('button.rb-box', {
      type: 'button', 'aria-label': `${index + 1}번 상자 열기`, dataset: { slot: index },
      onClick: () => pick(index),
    }, h('span.rb-shadow'), h('img.rb-art', { src: cut(BOX_ART[index % BOX_ART.length]), alt: '', draggable: 'false' }), h('span.rb-peek')));
    const row = h('div.rb-row', {}, ...buttons);
    const reveal = h('div.rb-reveal', { role: 'status', 'aria-live': 'polite' });
    const take = h('button.btn.primary.rb-take', { type: 'button', hidden: true }, '받기');
    const glow = h('i.rb-glow');
    const overlay = h('div.reward-boxes', { role: 'dialog', 'aria-label': '보상 상자 고르기' }, h('i.rb-dim'), glow, title, sub, row, reveal, take);
    host.append(overlay);
    let picked = false;

    // 등장 — 위에서 떨어져 통 튀고, 살짝 떠 있는다
    gsap.fromTo(overlay.querySelector('.rb-dim'), { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo([title, sub], { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power3.out' });
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
        gsap.to(coin, { physics2D: { velocity: rand(520, 820), angle: rand(-150, -30), gravity: 1400 }, rotation: rand(-240, 240), duration: 1.3, ease: 'none', delay: index * 0.04, onComplete: () => coin.remove() });
        gsap.to(coin, { opacity: 0, duration: 0.3, delay: 0.95 + index * 0.04 });
      }
    }

    function showContent(box, big) {
      const card = h(`div.rb-card.r-${box.rarity}${big ? '.is-big' : ''}`, {}, h('span.rb-rarity', {}, RARITY_NAMES[box.rarity] || '희귀'));
      if (box.kind === 'item') {
        const item = cosmeticById(box.itemId);
        card.append(itemPreview(item), h('small.rb-kind', {}, `상자 전용 ${slotName(item?.slot)}`), h('b.rb-name', {}, item?.name || '아이템'));
      } else {
        const number = h('b.rb-points', {}, '+0');
        card.append(number, h('small.rb-kind', {}, '점'));
        if (big && !reduced) {
          const counter = { value: 0 };
          gsap.to(counter, { value: box.amount, duration: 1.1, ease: 'power2.out', onUpdate: () => { number.textContent = `+${formatNumber(Math.round(counter.value))}`; } });
        } else number.textContent = `+${formatNumber(box.amount)}`;
      }
      return card;
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
      const timeline = gsap.timeline();
      if (!reduced) {
        // 기대감 — 점점 세게 세 번 흔들린다
        play('dice', { volume: 0.7 });
        timeline.to(chosen, { scale: 1.18, y: -18, duration: 0.25, ease: 'power2.out' });
        [5, 9, 14].forEach((power, beat) => {
          timeline.to(chosen, { rotation: power, duration: 0.06 }).to(chosen, { rotation: -power, duration: 0.08 }).to(chosen, { rotation: 0, duration: 0.07 });
          timeline.to({}, { duration: 0.14 - beat * 0.03 });
        });
      }
      await timeline;
      // 열림 — 빛이 터지고 상자가 부풀며 사라진다
      play('pack', { volume: 0.9 });
      const rect = chosen.getBoundingClientRect();
      const box0 = overlay.getBoundingClientRect();
      const at = { x: rect.left - box0.left + rect.width / 2, y: rect.top - box0.top + rect.height * 0.45 };
      gsap.set(glow, { left: at.x, top: at.y, xPercent: -50, yPercent: -50 });
      gsap.fromTo(glow, { scale: 0.2, opacity: 0.95 }, { scale: 2.6, opacity: 0, duration: reduced ? 0.2 : 0.9, ease: 'power2.out' });
      gsap.to(chosen.querySelector('.rb-art'), { scale: 1.5, opacity: 0, duration: 0.35, ease: 'power2.in' });
      const card = showContent(box, true);
      reveal.replaceChildren(card);
      gsap.fromTo(card, { scale: 0.3, y: 60, opacity: 0, rotation: -8 }, { scale: 1, y: 0, opacity: 1, rotation: 0, duration: reduced ? 0.15 : 0.6, ease: 'back.out(2)' });
      if (box.kind === 'item') play('unlock');
      else if (box.rarity === 'legend' || box.rarity === 'epic') play('bonus');
      else play('stack');
      burstCoins(at, box.kind === 'item' ? 4 : { common: 3, rare: 5, epic: 7, legend: 9 }[box.rarity] || 4);
      sub.textContent = box.kind === 'item' ? '상자에서만 나오는 아이템이에요' : `${RARITY_NAMES[box.rarity]} 상자였어요`;
      // 나머지 상자도 열어 보여 준다
      await new Promise((done) => setTimeout(done, reduced ? 200 : 900));
      buttons.forEach((button, other) => {
        if (other === index) return;
        const peek = button.querySelector('.rb-peek');
        peek.textContent = contentLabel(boxes[other]);
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
