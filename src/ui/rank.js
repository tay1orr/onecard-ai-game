// 내 단계 그림 · 단계 오름 연출 — 금별 · 루비 · 분홍 장미 · 왕관을 단계 수만큼(core/rank.js).
// 선생님 GPT 「레벨단계」 그림(cut/rank-*)이 들어오면 저절로 켜지고, 그 전에는 지금 별(★1~★8) 글자 그대로(11-25)
import gsap from 'gsap';
import { h, formatNumber, stars } from './dom.js';
import { cut } from '../data/assets.js';
import { hasGptArt } from '../data/gpt-art.js';
import { RANK_UNITS, aiRankForStars, rankForPoints } from '../core/rank.js';
import { playerStarsForPoints } from '../core/rating.js';
import { play } from './sound.js';
import { settings } from './settings.js';
import { openModal } from './modal.js';

export const rankArtReady = () => RANK_UNITS.every((unit) => hasGptArt(unit.art));

// 단계 그림 줄 — 그림이 없으면 지금 별 글자(문장 안에 그대로 넣을 수 있게 글자 마디로)
// compact — 그림 하나 + ×개수(휴대폰 점수 칩처럼 좁은 자리. 다섯 개를 다 그리면 칩 밖으로 넘쳤다, 11-25 선생님 사진)
export function rankBadge(points, { size = 'sm', compact = false } = {}) {
  if (!rankArtReady()) return document.createTextNode(stars(playerStarsForPoints(points)));
  const rank = rankForPoints(points);
  const icon = () => h('img', { src: cut(rank.art, 's'), alt: '', draggable: 'false' });
  if (compact) {
    return h(`span.rank-badge.is-compact.u-${rank.unit}.is-${size}`, { role: 'img', 'aria-label': rank.name, title: rank.name },
      icon(), rank.count > 1 ? h('small.rank-count', {}, `×${rank.count}`) : null);
  }
  return h(`span.rank-badge.u-${rank.unit}.is-${size}`, { role: 'img', 'aria-label': rank.name, title: rank.name },
    ...Array.from({ length: rank.count }, icon));
}

// AI 상대 난이도(★1~★8) — 같은 그림으로(core/rank.js AI_RANK_LEVELS). 그림이 없으면 옛 별 글자
export function aiBadge(difficulty, { size = 'sm' } = {}) {
  if (!rankArtReady()) return document.createTextNode(stars(difficulty));
  const rank = aiRankForStars(difficulty);
  return h(`span.rank-badge.u-${rank.unit}.is-${size}`, { role: 'img', 'aria-label': `난이도 ${rank.name}`, title: rank.name },
    ...Array.from({ length: rank.count }, () => h('img', { src: cut(rank.art, 's'), alt: '' })));
}

// 로비 「만나는 난이도」 한 칸 — 그림 하나 + 개수(×4)로 짧게
export function aiOddsBadge(difficulty) {
  if (!rankArtReady()) return h('i', {}, `★${difficulty}`);
  const rank = aiRankForStars(difficulty);
  return h(`span.odds-rank.u-${rank.unit}`, { role: 'img', 'aria-label': rank.name, title: rank.name },
    h('img', { src: cut(rank.art, 's'), alt: '' }), rank.count > 1 ? h('small', {}, `×${rank.count}`) : null);
}

// 단계표 창 — 네 가지 × 다섯 단계를 점수와 함께. 지난 단계는 흐리게, 지금은 「지금」, 다음은 「○점 남음」(11-25 선생님 「어떤 걸 누르면 랭크표를 볼 수 있게」)
export function openRankTable(points) {
  const score = Math.max(0, Math.floor(Number(points) || 0));
  const now = rankForPoints(score);
  const icons = (unit, count) => h('span.rt-icons', { 'aria-hidden': 'true' }, ...Array.from({ length: count }, () => h('img', { src: cut(unit.art, 's'), alt: '' })));
  const groups = RANK_UNITS.map((unit, unitIndex) => h(`section.rt-group.u-${unit.key}`, { 'aria-label': unit.name },
    h('h3.rt-title', {}, h('img', { src: cut(unit.art, 's'), alt: '' }), unit.name),
    h('ol.rt-rows', {}, ...unit.thresholds.map((min, step) => {
      const level = unitIndex * 5 + step + 1;
      const state = level < now.level ? 'is-done' : level === now.level ? 'is-now' : level === now.level + 1 ? 'is-next' : '';
      const tag = state === 'is-now' ? '지금' : state === 'is-next' ? `${formatNumber(min - score)}점 남음` : '';
      return h(`li.rt-row${state ? `.${state}` : ''}`, {},
        icons(unit, step + 1),
        h('b.rt-name', {}, `${unit.name} ${step + 1}단계`),
        h('span.rt-points', {}, `${formatNumber(min)}점`),
        tag ? h('em.rt-tag', {}, tag) : null);
    }))));
  const body = h('div.rank-table', {},
    h('p.rt-now', {}, '지금 ', rankBadge(score), h('b', {}, ` ${now.name}`), `, ${formatNumber(score)}점`),
    h('div.rt-groups', {}, ...groups));
  return openModal({ title: '단계표', body, className: 'is-rank', label: '단계표' });
}

// 단계 그림을 단추로 — 누르면 단계표(결과 판 · 내 프로필). 그림이 없으면 그냥 별 글자
export function rankButton(points, { size = 'sm', className = '' } = {}) {
  if (!rankArtReady()) return rankBadge(points, { size });
  return h(`button.rank-btn${className ? `.${className}` : ''}`, { type: 'button', 'aria-label': `${rankForPoints(points).name}, 단계표 보기`, onClick: () => { play('click'); openRankTable(points); } },
    rankBadge(points, { size }), h('small', {}, '단계표'));
}

const UNIT_CLASSES = RANK_UNITS.map((unit) => `u-${unit.key}`);
const ratioIn = (rank, value) => (rank.next ? Math.min(1, Math.max(0, (value - rank.min) / (rank.next.min - rank.min))) : 1);

// 다음 단계까지 막대 — 단계 그림 · 이름 · 막대 · 남은 점수(로비 「내 단계」 칸 · 결과 판).
// 처음 점수로 그리고, update(점수)로 옮기면 함께 바뀐다. 결과 판은 판 앞 점수로 그린 뒤 점수가 들어오는 만큼 막대가 옆으로 차오르고,
// 처음 점수에서 얻은 만큼은 밝게(잃은 만큼은 붉게) 따로 보인다. 단계를 넘으면 그림 · 이름이 바뀌고 막대는 새 단계 처음부터(11-25 선생님)
export function rankMeter(points, { size = 'sm' } = {}) {
  if (!rankArtReady()) return null;
  const badge = h('span.rm-badge');
  const name = h('b.rm-name');
  const base = h('i.rm-base');
  const gain = h('i.rm-gain');
  const tip = h('i.rm-tip');
  const bar = h('div.rm-track', {}, h('div.rm-bar', {}, gain, base), tip);
  const next = h('small.rm-next');
  const meter = { badge, name, bar, tip, next, root: null, rank: null, value: 0, update };
  let start = Math.max(0, Math.floor(Number(points) || 0));
  function update(value) {
    const score = Math.max(0, Math.floor(Number(value) || 0));
    const rank = rankForPoints(score);
    const crossed = meter.rank && rank.level !== meter.rank.level;
    if (crossed) start = rank.level > meter.rank.level ? rank.min : (rank.next?.min ?? rank.min);
    if (!meter.rank || crossed) {
      badge.replaceChildren(rankBadge(score, { size }));
      name.textContent = rank.name;
      meter.root?.classList.remove(...UNIT_CLASSES);
      meter.root?.classList.add(`u-${rank.unit}`);
    }
    const low = ratioIn(rank, Math.min(start, score));
    const high = ratioIn(rank, Math.max(start, score));
    base.style.transform = `scaleX(${low})`;
    gain.style.transform = `scaleX(${high})`;
    gain.classList.toggle('is-minus', score < start);
    tip.style.transform = `translate(${(score < start ? low : high) * bar.clientWidth}px, -50%)`;
    next.textContent = rank.next ? `${rank.next.name}까지 ${formatNumber(Math.max(0, rank.next.min - score))}점 남았어요` : '가장 높은 단계예요';
    meter.rank = rank;
    meter.value = score;
    return crossed;
  }
  update(start);
  return meter;
}

// 로비 「내 단계」 칸 — 단계 그림 · 이름 · 다음 단계까지 막대와 남은 점수, 누르면 단계표(11-25 선생님 「모바일 메인 화면에서도 잘 보이게」)
export function rankCard(points) {
  const meter = rankMeter(points, { size: 'lg' });
  if (!meter) return null;
  const card = h(`button.rank-card.rank-meter.u-${meter.rank.unit}`, { type: 'button', 'aria-label': `내 단계 ${meter.rank.name}, 단계표 보기`, onClick: () => { play('click'); openRankTable(meter.value); } },
    h('div.card-head', {}, h('b', {}, '내 단계'), h('small.rank-card-more', {}, '단계표')),
    h('div.rank-card-now', {}, meter.badge, meter.name),
    meter.bar, meter.next);
  meter.root = card;
  return card;
}

// 단계 이름과 다음 단계까지 남은 점수 한 줄(그림이 들어온 뒤에만 — 그 전에는 빈 글)
export function rankCaption(points) {
  if (!rankArtReady()) return '';
  const rank = rankForPoints(points);
  return rank.next ? `${rank.name}, ${rank.next.name}까지 ${formatNumber(rank.next.min - Math.floor(points || 0))}점` : `${rank.name}, 가장 높은 단계`;
}

// 단계가 오르면 — 판이 끝나고 보상 상자를 연 뒤, 결과 판 앞에 한 번.
//  · 같은 그림 안에서 오르면(루비 2 → 3): 지금 그림이 놓이고 새 그림이 위에서 떨어져 자리에 박힌다
//  · 그림이 바뀌면(금별 5 → 루비 1): 다섯이 가운데로 모여 번쩍이고, 그 빛 속에서 새 그림이 크게 나왔다가 자리를 잡는다
//  뒤로 그림 색 빛줄기가 천천히 돈다. 작은 조각을 떼로 날리지 않는다. 누르면 바로 넘어간다
export function showRankUp({ host, from, to, points }) {
  return new Promise((resolve) => {
    if (!rankArtReady() || !from || !to || to.level <= from.level) { resolve(); return; }
    const reduced = settings.reduced();
    const changed = to.unit !== from.unit;
    const icon = (rank) => h('img.ru-icon', { src: cut(rank.art), alt: '', draggable: 'false' });
    const kept = changed ? [] : Array.from({ length: from.count }, () => icon(to));
    const fresh = Array.from({ length: changed ? to.count : to.count - from.count }, () => icon(to));
    const leaving = changed ? Array.from({ length: from.count }, () => icon(from)) : [];
    const row = h('div.ru-row', {}, ...(changed ? leaving : [...kept, ...fresh]));
    const next = to.next ? `${to.next.name}까지 ${formatNumber(Math.max(0, to.next.min - (points ?? to.min)))}점` : '가장 높은 단계예요';
    const text = h('div.ru-text', {}, h('small.ru-kicker', {}, '새 단계에 올랐어요'), h('strong.ru-name', {}, to.name), h('small.ru-next', {}, next));
    const rays = h('i.ru-rays');
    const flash = h('i.ru-flash');
    const overlay = h(`div.rank-up.u-${to.unit}`, { role: 'dialog', 'aria-label': `${to.name}에 올랐어요` }, h('i.ru-dim'), rays, flash, row, text);
    host.append(overlay);

    let done = false;
    const timeline = gsap.timeline();
    const finish = () => {
      if (done) return;
      done = true;
      timeline.kill();
      gsap.killTweensOf(rays);
      gsap.to(overlay, { opacity: 0, duration: 0.25, onComplete: () => { overlay.remove(); resolve(); } });
    };
    overlay.addEventListener('pointerdown', finish, { once: true });

    if (reduced) {
      if (changed) row.replaceChildren(...fresh);
      gsap.set(overlay, { opacity: 1 });
      setTimeout(finish, 1800);
      play('level');
      return;
    }
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(rays, { rotation: 0 }, { rotation: 60, duration: 8, ease: 'none' });
    timeline.fromTo(changed ? leaving : kept, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, stagger: 0.06, ease: 'back.out(2)' }, 0.1);
    gsap.set(fresh, { opacity: 0 });
    if (changed) {
      // 모여서 번쩍 — 가운데로 모이며 작아지고 밝아진다
      timeline.call(() => {
        const box = row.getBoundingClientRect();
        leaving.forEach((el) => {
          const r = el.getBoundingClientRect();
          // 필터는 처음과 끝을 같은 모양(밝기 + 그림자)으로 — 그림자만 있던 데서 밝기로 바로 가면 중간에 검게 변했다
          gsap.fromTo(el, { filter: 'brightness(1) drop-shadow(0px 10px 14px rgba(0, 0, 0, 0.55))' }, { x: box.left + box.width / 2 - (r.left + r.width / 2), scale: 0.5, filter: 'brightness(2.2) drop-shadow(0px 0px 18px rgba(255, 236, 170, 0.9))', duration: 0.45, ease: 'power3.in' });
        });
        play('whoosh', { volume: 0.6 });
      }, null, 0.75);
      timeline.fromTo(flash, { scale: 0.2, opacity: 0 }, { scale: 1.6, opacity: 1, duration: 0.22, ease: 'power2.out' }, 1.12);
      timeline.call(() => { row.replaceChildren(...fresh); play('level'); play('bonus', { volume: 0.6 }); }, null, 1.2);
      timeline.fromTo(fresh, { scale: 0, opacity: 0 }, { scale: 1.45, opacity: 1, duration: 0.32, stagger: 0.05, ease: 'back.out(2.2)' }, 1.2);
      timeline.to(fresh, { scale: 1, duration: 0.35, ease: 'power2.inOut' }, 1.55);
      timeline.to(flash, { opacity: 0, scale: 2.2, duration: 0.6, ease: 'power2.out' }, 1.32);
      timeline.fromTo(rays, { opacity: 0.35 }, { opacity: 1, duration: 0.4 }, 1.2);
    } else {
      // 새 그림이 위에서 떨어져 박힌다 — 하나씩
      fresh.forEach((el, index) => {
        const at = 0.6 + index * 0.32;
        timeline.fromTo(el, { y: -140, scale: 1.5, opacity: 0, rotation: -12 }, { y: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.42, ease: 'bounce.out' }, at);
        timeline.call(() => play(index === fresh.length - 1 ? 'level' : 'unlock', { volume: 0.7 }), null, at + 0.18);
        timeline.fromTo(flash, { scale: 0.3, opacity: 0.9 }, { scale: 1.3, opacity: 0, duration: 0.5, ease: 'power2.out' }, at + 0.2);
      });
      timeline.fromTo(rays, { opacity: 0.35 }, { opacity: 1, duration: 0.4 }, 0.6);
    }
    timeline.fromTo(text.children, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: 'power2.out' }, changed ? 1.45 : 0.9);
    timeline.call(() => setTimeout(finish, 1500));
  });
}
