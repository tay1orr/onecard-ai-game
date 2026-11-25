// 보상 상자 고르기 — 미스터리 상자 셋이 떨어지고, 하나를 고르면 흔들리다 뚜껑이 젖혀지며 열린다(열린 그림으로 바뀜).
// 빛은 몸통이 아니라 열린 입구에서 나온다(11-25 선생님). 좋은 상자(영웅 이상)는 흔들릴 때 뚜껑 틈으로 금빛이 새고, 열리면 입구에서 금빛 빛살이 위로 퍼진다(전설 이상은 빛기둥도).
// 열리는 순간 입구에서 동전이 쏟아지고 점수 카드가 튀어나와 자리를 잡는다(11-25 선생님 「상자가 열리면서 뭔가 나와야지」). 아이템도 바로 뒤따라 나온다.
// 기본 점수가 먼저 오르고, 배수(×2 · ×3 · ×5 · ×10) 도장이 찍히며 한 번 더 뛴다.
// 고른 뒤 나머지 둘도 열어 무엇이 들어 있었는지 보여 준다. 내용은 미리 정해져 있고 고르는 것은 순수한 선택이다.
import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { h, formatNumber } from './dom.js';
import { cut } from '../data/assets.js';
import { cosmeticById, COSMETIC_SLOTS } from '../core/cosmetics.js';
import { BOX_ART, BOX_OPEN_ART, RARITY_NAMES, RARITY_ORDER } from '../core/reward-box.js';
import { itemPreview } from './item-preview.js';
import { play } from './sound.js';
import { settings } from './settings.js';

gsap.registerPlugin(Physics2DPlugin);

const rand = (min, max) => min + Math.random() * (max - min);
const slotName = (slot) => COSMETIC_SLOTS.find((entry) => entry.key === slot)?.name || '';
// 뚜껑이 열리는 순간 입구에서 쏟아지는 동전 수(좋은 상자일수록 많이 · 큰 동전이라 떼로 보이지 않게 14개까지)
const COINS = { common: 6, rare: 8, epic: 10, legend: 12, mythic: 14 };
// 열린 상자 그림에서 안쪽 빛이 나오는 입구(상자 칸에 대한 비율) — 빛 · 빛살 · 동전이 여기서 나온다. 열린 그림을 닫힌 몸통에 겹치는 자리는 fx.css .rb-open
const OPENING = { x: 0.5, y: 0.25 };

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
    }, h('span.rb-shadow'), h('img.rb-art', { src: cut(BOX_ART), alt: '', draggable: 'false' }),
    h('img.rb-open', { src: cut(BOX_OPEN_ART), alt: '', draggable: 'false' }), h('span.rb-peek'))); // 열린 그림은 미리 받아 숨겨 둔다(열 때 바로 바뀌게)
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

    // 상자 입구(at)에서 튀어나와 제자리로 — 작게 나와 위로 솟았다가 내려앉는다(11-25 선생님 「상자가 열리면서 뭔가 나와야지 —
    // 열리고 1초 있다가 따로 나오는 것보다」). 제자리는 지금 놓인 자리로 잰다
    function emerge(el, at, { lift = 70, duration = 0.7 } = {}) {
      const r = el.getBoundingClientRect();
      const o = overlay.getBoundingClientRect();
      const dx = at.x - (r.left - o.left + r.width / 2);
      const dy = at.y - (r.top - o.top + r.height / 2);
      return gsap.timeline()
        .fromTo(el, { x: dx, y: dy, scale: 0.12, opacity: 0, rotation: -14 }, { x: dx * 0.45, y: Math.min(dy, 0) - lift, scale: 0.7, opacity: 1, rotation: 6, duration: duration * 0.42, ease: 'power2.out' })
        .to(el, { x: 0, y: 0, scale: 1, rotation: 0, duration: duration * 0.58, ease: 'back.out(1.7)' });
    }

    // 점수 카드 — 상자에서 튀어나와 자리를 잡고, 기본 점수가 오른 뒤 배수 도장이 찍히고 다시 오른다. 아이템도 상자에서 뒤따라 나온다
    function playContent(box, at) {
      const number = h('b.rb-points', {}, '+0');
      const card = h(`div.rb-card.r-${box.rarity}`, {}, h('span.rb-rarity', {}, `${RARITY_NAMES[box.rarity] || '일반'} 상자`), number, h('small.rb-kind', {}, '점'));
      reveal.replaceChildren(card);
      gsap.set(card, { opacity: 0 });
      const timeline = gsap.timeline();
      const counter = { value: 0 };
      const show = () => { number.textContent = `+${formatNumber(Math.round(counter.value))}`; };
      timeline.call(() => { if (reduced) gsap.set(card, { opacity: 1 }); else emerge(card, at); }, null, 0);
      timeline.to(counter, { value: box.base, duration: reduced ? 0.1 : 0.6, ease: 'power2.out', onUpdate: show }, reduced ? 0 : 0.25);
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
          if (big) burstCoins(at, 6); // 큰 배수(×5 이상)는 도장에 맞춰 상자에서 한 번 더
        });
        timeline.to(counter, { value: box.amount, duration: reduced ? 0.1 : (big ? 1.1 : 0.7), ease: 'power2.out', onUpdate: show }, '>');
      } else {
        timeline.call(() => play('stack', { volume: 0.7 }));
      }
      if (box.itemId) {
        const item = cosmeticById(box.itemId);
        const extra = h('div.rb-item', {}, itemPreview(item), h('div.rb-item-text', {}, h('small.rb-kind', {}, `상자 전용 ${slotName(item?.slot)}도 함께`), h('b.rb-name', {}, item?.name || '아이템')));
        card.append(extra);
        gsap.set(extra, { opacity: 0 });
        // 점수 카드가 자리를 잡자마자 뒤따라 나온다(전에는 점수가 다 오른 뒤라 열고 2초 넘게 빈 칸이었다)
        timeline.call(() => { if (reduced) gsap.set(extra, { opacity: 1 }); else emerge(extra, at, { lift: 50, duration: 0.6 }); play('confirmBig'); }, null, reduced ? 0 : 0.6);
        timeline.to({}, { duration: 0.01 }, reduced ? 0.05 : 1.25); // 아이템이 자리를 잡을 때까지는 끝나지 않게
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
      // 열림 — 빛이 번쩍이는 순간 뚜껑이 젖혀진 그림(선생님 GPT)으로 바뀌며 통 튄다. 두 그림은 몸통이 꼭 겹치게 맞춰 두었다(fx.css .rb-open).
      // 안쪽 빛 · 빛살 · 동전은 열린 입구에서 나온다(11-25 선생님 「몸에서 빛이 뻗어 나가는 게 아니고 열리는 곳에서」 — 전에는 상자 가운데에서 사방으로 퍼지고 상자는 빛 속으로 사라졌다)
      play('pack', { volume: 0.9 });
      sub.textContent = box.multiplier > 1 ? `${RARITY_NAMES[box.rarity]} 상자 — 점수 ×${box.multiplier}!` : '점수를 받았어요';
      const open = chosen.querySelector('.rb-open');
      const inner = h('span.rb-inner');
      open.after(inner);
      // 열린 상자는 조금 내려앉고(흔들릴 때처럼 떠 있으면 뚜껑이 위 글씨를 더 가린다), 젖혀진 뚜껑이 그래도 위 글씨에 닿으면 글씨 묶음이 그만큼 위로 비킨다.
      // 빛 · 빛살 자리와 뚜껑 높이는 내려앉은 자리로 잰다
      gsap.set(chosen, { scale: 1.06, y: 0 });
      const rect = chosen.getBoundingClientRect();
      const box0 = overlay.getBoundingClientRect();
      const clash = (vet || sub).getBoundingClientRect().bottom + 6 - open.getBoundingClientRect().top;
      const lift = Math.min(clash, title.getBoundingClientRect().top - box0.top - 8); // 제목이 화면 위로 밀려 나가지 않을 만큼만(낮은 화면 · 아이템 든 상자)
      if (!reduced) gsap.fromTo(chosen, { scale: 1.18, y: -18 }, { scale: 1.06, y: 0, duration: 0.35, ease: 'power2.out' });
      if (lift > 0) gsap.to([title, sub, vet].filter(Boolean), { y: -lift, duration: reduced ? 0 : 0.35, ease: 'power2.out', overwrite: 'auto' });
      Object.assign(at, { x: rect.left - box0.left + rect.width * OPENING.x, y: rect.top - box0.top + rect.height * OPENING.y });
      gsap.set(glow, { left: at.x, top: at.y, xPercent: -50, yPercent: -50 });
      gsap.fromTo(glow, { scale: 0.2, opacity: 0.95 }, { scale: good ? 3 : 2.2, opacity: 0, duration: reduced ? 0.2 : good ? 1.2 : 0.8, ease: 'power2.out' });
      burstCoins(at, COINS[box.rarity] || 6); // 열리는 순간 입구에서 동전이 쏟아진다(점수 카드 · 아이템도 이 입구에서 튀어나온다)
      gsap.set(art, { opacity: 0 });
      gsap.set(open, { opacity: 1 });
      if (reduced) gsap.set(inner, { opacity: 0.8 });
      else {
        // 뚜껑이 젖혀지는 순간 상자가 납작했다가 통 튀어 오르고, 입구의 빛은 받기 전까지 숨 쉬듯 일렁인다
        gsap.fromTo(open, { scaleX: 1.08, scaleY: 0.9, transformOrigin: '50% 100%' }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.5)' });
        gsap.fromTo(inner, { opacity: 0, scaleX: 0.5, scaleY: 0.2 }, { opacity: good ? 1 : 0.8, scaleX: 1, scaleY: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(inner, { opacity: good ? 0.6 : 0.45, duration: 0.9, delay: 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
      if (good) {
        // 입구에서 빛살이 솟고, 안에서 나온 빛이 상자를 한 번 환하게 비춘 뒤 가라앉는다
        goldBeams(at, rank, rect);
        gsap.fromTo(open, { filter: 'brightness(1.8) drop-shadow(0px 0px 22px rgba(255, 222, 140, 0.9))' }, { filter: 'brightness(1) drop-shadow(0px 18px 16px rgba(0, 0, 0, 0.55))', duration: 0.9, ease: 'power2.out' });
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
        gsap.to(overlay, { opacity: 0, duration: 0.25, onComplete: () => { gsap.killTweensOf(inner); overlay.remove(); resolve(box); } });
      }, { once: true });
    }
  });
}
