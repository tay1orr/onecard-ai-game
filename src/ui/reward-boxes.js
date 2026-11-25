// 보상 상자 고르기 — 미스터리 상자 셋이 떨어지고, 하나를 고르면 흔들리다 뚜껑이 들리며 열린다.
// 빛은 몸통이 아니라 열리는 뚜껑 틈에서 나온다(11-25 선생님). 좋은 상자(영웅 이상)는 흔들릴 때 틈으로 금빛이 새고, 열리면 틈에서 금빛 빛살이 위로 퍼진다(전설 이상은 빛기둥도).
// 열리면 기본 점수가 먼저 오르고, 배수(×2 · ×3 · ×5 · ×10) 도장이 찍히며 한 번 더 뛴다. 아이템이 들어 있으면 점수와 함께 나온다.
// 고른 뒤 나머지 둘도 열어 무엇이 들어 있었는지 보여 준다. 내용은 미리 정해져 있고 고르는 것은 순수한 선택이다.
import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { h, formatNumber } from './dom.js';
import { cut } from '../data/assets.js';
import { cosmeticById, COSMETIC_SLOTS } from '../core/cosmetics.js';
import { BOX_ART, RARITY_NAMES, RARITY_ORDER } from '../core/reward-box.js';
import { itemPreview } from './item-preview.js';
import { play } from './sound.js';
import { settings } from './settings.js';

gsap.registerPlugin(Physics2DPlugin);

const rand = (min, max) => min + Math.random() * (max - min);
const slotName = (slot) => COSMETIC_SLOTS.find((entry) => entry.key === slot)?.name || '';
const COINS = { common: 3, rare: 5, epic: 7, legend: 10, mythic: 16 };
// 미스터리 상자 그림의 뚜껑 틈(상자 칸에 대한 비율) — 앞면은 위에서 32.5%, 오른쪽 옆면으로 가며 30% 쪽으로 오른다(fx.css .rb-lid · .is-body 의 자르는 선)
const SEAM = { x: 0.49, y: 0.325 };
const LIFT = 0.17; // 뚜껑이 들리는 높이(상자 높이에 대한 비율)

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
    }, h('span.rb-shadow'), h('img.rb-art', { src: cut(BOX_ART), alt: '', draggable: 'false' }), h('span.rb-peek')));
    const row = h('div.rb-row', {}, ...buttons);
    const reveal = h('div.rb-reveal', { role: 'status', 'aria-live': 'polite' });
    const take = h('button.btn.primary.rb-take', { type: 'button', style: { visibility: 'hidden' } }, '받기'); // 자리는 처음부터 — 나중에 나타나며 열린 상자를 밀어 올리지 않게
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

    // 금빛 빛살 — 열린 뚜껑 틈에서 위로 부채꼴로 뻗어 살랑이다 사라진다. 전설 이상은 틈에서 빛기둥과 번쩍임, 신화는 장밋빛 빛살이 섞인다.
    // 큰 원 한 장을 돌리지 않고 가늘고 긴 쐐기 여럿으로 그린다(휴대폰에서 그림 한 장이 너무 커지지 않게) · 열 때마다 각도 · 굵기가 조금씩 다르다
    function goldBeams(at, rank, chest) {
      const area = overlay.getBoundingClientRect();
      const reach = Math.hypot(Math.max(at.x, area.width - at.x), at.y);
      const legend = rank >= RARITY_ORDER.indexOf('legend');
      const mythic = rank >= RARITY_ORDER.indexOf('mythic');
      const total = mythic ? 3.4 : legend ? 2.8 : 2.2;
      const count = mythic ? 16 : legend ? 13 : 10;
      const spread = mythic ? 196 : legend ? 180 : 164; // 위로 펼치는 각도 — 양옆은 수평보다 조금 더, 그 아래는 상자 몸통 뒤라 안 보인다
      const dim = overlay.querySelector('.rb-dim');
      const fan = h('div.rb-beams');
      gsap.set(fan, { left: at.x, top: at.y });
      dim.after(fan); // 어둠 바로 위 — 상자 · 글씨 · 점수 카드보다 아래라 빛이 들린 뚜껑 뒤로 솟아오른다
      for (let index = 0; index < count; index += 1) {
        const width = reach * rand(0.12, 0.22);
        const beam = h(`i.rb-beam${mythic && index % 2 ? '.is-rose' : ''}`);
        Object.assign(beam.style, { width: `${width}px`, height: `${reach * rand(0.72, 1.02)}px`, marginLeft: `${-width / 2}px` });
        fan.append(beam);
        gsap.set(beam, { rotation: -spread / 2 + (spread / (count - 1)) * index + rand(-5, 5) });
        const peak = rand(0.5, 0.92);
        gsap.fromTo(beam, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: peak, duration: rand(0.32, 0.5), delay: rand(0, 0.08), ease: 'power3.out' });
        gsap.to(beam, { opacity: peak * 0.45, duration: rand(0.35, 0.6), delay: 0.6 + rand(0, 0.3), repeat: 3, yoyo: true, ease: 'sine.inOut' });
      }
      gsap.fromTo(fan, { rotation: rand(-4, 4), scale: 0.9 }, { rotation: rand(-8, 8), scale: 1.04, duration: total, ease: 'sine.inOut' });
      gsap.to(fan, { opacity: 0, duration: 0.7, delay: total - 0.7, ease: 'power1.in', onComplete: () => fan.remove() });
      if (legend) {
        const pillar = h('i.rb-pillar');
        const width = chest.width * 0.8;
        Object.assign(pillar.style, { left: `${at.x - width / 2}px`, width: `${width}px`, height: `${at.y + 60}px`, bottom: `${area.height - at.y}px` });
        dim.after(pillar);
        gsap.fromTo(pillar, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 0.85, duration: 0.42, ease: 'power3.out' });
        gsap.to(pillar, { opacity: 0, duration: 0.9, delay: total * 0.55, onComplete: () => pillar.remove() });
        gsap.fromTo(flash, { opacity: mythic ? 0.95 : 0.75 }, { opacity: 0, duration: 0.9, ease: 'power2.out' });
      }
      play('unlock', { volume: legend ? 0.9 : 0.6 });
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
      const art = chosen.querySelector('.rb-art');
      gsap.to(art, { y: 0, duration: 0.2 }); // 둥실 뜨던 자리를 제자리로 — 열 때 뚜껑 조각이 몸통과 꼭 맞게
      // 좋은 상자(영웅 이상 — ×3 이상이거나 영웅 · 전설 아이템) — 흔들릴수록 뚜껑 틈으로 금빛이 새어 나온다
      const rank = RARITY_ORDER.indexOf(box.rarity);
      const good = rank >= RARITY_ORDER.indexOf('epic') && !reduced;
      const leak = good ? h('span.rb-leak') : null;
      if (leak) art.after(leak);
      // 점수 카드 자리를 고를 때 먼저 낸다 — 열 때 카드가 끼어들면 상자 줄이 튀어 올라 열린 상자와 틈의 빛이 어긋났다.
      // 줄은 새 자리로 미끄러져 가고, 카드는 숨긴 채 기다린다(알림 읽기도 열 때까지 미룸). 동전이 나오는 자리(at)는 열 때 채운다
      const at = { x: 0, y: 0 };
      const before = row.getBoundingClientRect().top;
      sub.style.minHeight = `${sub.offsetHeight}px`; // 열 때 바뀌는 안내 글이 짧아져도 줄 높이는 그대로
      reveal.setAttribute('aria-busy', 'true');
      const content = playContent(box, at);
      content.pause();
      const shift = before - row.getBoundingClientRect().top;
      if (shift) gsap.fromTo([title, sub, vet, row].filter(Boolean), { y: shift }, { y: 0, duration: reduced ? 0 : 0.4, ease: 'power2.out', overwrite: 'auto' });
      const shake = gsap.timeline();
      if (!reduced) {
        // 기대감 — 점점 세게 세 번 흔들린다
        play('dice', { volume: 0.7 });
        shake.to(chosen, { scale: 1.18, y: -18, duration: 0.25, ease: 'power2.out' });
        [5, 9, 14].forEach((power, beat) => {
          shake.to(chosen, { rotation: power, duration: 0.06 });
          if (leak) shake.to(leak, { opacity: 0.4 + beat * 0.3, scaleX: 0.8 + beat * 0.1, scaleY: 0.6 + beat * 0.45, duration: 0.2, ease: 'power2.out' }, '<');
          shake.to(chosen, { rotation: -power, duration: 0.08 }).to(chosen, { rotation: 0, duration: 0.07 });
          shake.to({}, { duration: 0.14 - beat * 0.03 });
        });
      }
      await shake;
      // 열림 — 같은 그림을 뚜껑 틈에서 뚜껑 · 몸통 두 장으로 나눠 뚜껑을 들어 올린다. 안쪽 빛 · 빛살 · 동전은 그 틈에서 나온다
      // (11-25 선생님 「몸에서 빛이 뻗어 나가는 게 아니고 열리는 곳에서」 — 전에는 상자 가운데에서 사방으로 퍼지고 상자는 빛 속으로 사라졌다)
      play('pack', { volume: 0.9 });
      sub.textContent = box.multiplier > 1 ? `${RARITY_NAMES[box.rarity]} 상자 — 점수 ×${box.multiplier}!` : '점수를 받았어요';
      const lid = h('img.rb-art.rb-lid', { src: art.src, alt: '', draggable: 'false' });
      const inner = h('span.rb-inner');
      art.classList.add('is-body');
      art.after(inner, lid);
      // 열린 상자는 조금 내려앉아 뚜껑이 들릴 자리를 낸다(흔들릴 때처럼 떠 있으면 들린 뚜껑이 위 글씨를 가렸다). 빛 · 빛살 자리는 내려앉은 자리로 잰다
      gsap.set(chosen, { scale: 1.06, y: 0 });
      const rect = chosen.getBoundingClientRect();
      if (!reduced) gsap.fromTo(chosen, { scale: 1.18, y: -18 }, { scale: 1.06, y: 0, duration: 0.35, ease: 'power2.out' });
      const box0 = overlay.getBoundingClientRect();
      Object.assign(at, { x: rect.left - box0.left + rect.width * SEAM.x, y: rect.top - box0.top + rect.height * (SEAM.y - LIFT / 2) });
      gsap.set(glow, { left: at.x, top: at.y, xPercent: -50, yPercent: -50 });
      gsap.fromTo(glow, { scale: 0.2, opacity: 0.95 }, { scale: good ? 3 : 2.2, opacity: 0, duration: reduced ? 0.2 : good ? 1.2 : 0.8, ease: 'power2.out' });
      if (reduced) {
        gsap.set(lid, { yPercent: -LIFT * 100 });
        gsap.set(inner, { opacity: 0.8 });
      } else {
        // 뚜껑이 툭 들리며 살짝 기울고, 받기 전까지 틈 위에 둥실 떠 있다. 안쪽 빛은 숨 쉬듯 일렁인다
        gsap.to(lid, { yPercent: -LIFT * 100, rotation: -4, transformOrigin: '50% 32%', duration: 0.34, ease: 'back.out(2.4)' });
        gsap.to(lid, { yPercent: -LIFT * 100 + 3, duration: 1.1, delay: 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.fromTo(inner, { opacity: 0, scaleX: 0.5, scaleY: 0.2 }, { opacity: good ? 1 : 0.8, scaleX: 1, scaleY: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(inner, { opacity: good ? 0.7 : 0.5, duration: 0.9, delay: 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
      if (good) {
        // 틈에서 빛살이 솟고, 안에서 나온 빛이 상자를 한 번 환하게 비춘 뒤 가라앉는다
        goldBeams(at, rank, rect);
        gsap.fromTo([art, lid], { filter: 'brightness(1.8) drop-shadow(0px 0px 22px rgba(255, 222, 140, 0.9))' }, { filter: 'brightness(1) drop-shadow(0px 18px 16px rgba(0, 0, 0, 0.55))', duration: 0.9, ease: 'power2.out' });
        gsap.to(leak, { opacity: 0, duration: 0.3, onComplete: () => leak.remove() });
      }
      reveal.removeAttribute('aria-busy');
      await content.play();
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
      take.style.visibility = '';
      gsap.fromTo(take, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
      take.focus();
      take.addEventListener('click', () => {
        play('confirm');
        gsap.to(overlay, { opacity: 0, duration: 0.25, onComplete: () => { gsap.killTweensOf([lid, inner]); overlay.remove(); resolve(box); } });
      }, { once: true });
    }
  });
}
