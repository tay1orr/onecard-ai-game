// 결과 판 — 이번 판 합계가 맨 위에 크게, 그 아래 승패 · 보상 상자 · 미션이 한 줄씩 들어오며 합계를 채운다.
// 그 밑에 지금 점수와 다음 단계까지 막대(점수가 들어오는 만큼 차오름) · 시즌 패스 막대 · 새 아이템(뒤집혀 나옴, 상자에서 나온 것은 상자 표시) · 걸린 시간
// 11-25 선생님 「승리 점수와 보상 점수를 합해 총 몇 점 얻었는지 잘 보이게 · 배치 · 가독성 전면 보완」 — 전에는 큰 숫자가 승패 점수뿐이고
// 상자 점수는 맨 아래 작은 알약, 미션은 따로 떨어진 칸이라 한 판에 얼마를 얻었는지 더해 봐야 했다. 합계는 「지금 N점」의 변화와 꼭 맞는다
import gsap from 'gsap';
import { h, formatNumber } from './dom.js';
import { itemPreview } from './item-preview.js';
import { tierProgress } from '../core/season.js';
import { BOX_ART, RARITY_NAMES } from '../core/reward-box.js';
import { cut } from '../data/assets.js';
import { openRankTable, rankButton, rankMeter } from './rank.js';
import { play } from './sound.js';
import { settings } from './settings.js';

function formatTime(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}분 ${String(seconds % 60).padStart(2, '0')}초`;
}
const signed = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(Math.round(value)))}`;

// box: { delta, multiplier, rarity, item } — AI 대전에서 고른 보상 상자(없으면 줄을 두지 않음)
export function showResult({ host, won, delta = 0, bonus = false, box = null, profile, xpGained = 0, xpBefore = 0, unlocked = [], missions = [], missionPoints = 0, stats = {}, title, subtitle, primaryLabel = '다시 하기', onPrimary, onHome }) {
  const rows = [
    { key: 'match', label: won ? '승리' : '패배', note: bonus && won ? '보너스판 2배' : '', value: delta },
    box ? { key: 'box', label: '보상 상자', note: `${RARITY_NAMES[box.rarity] || '일반'}${box.multiplier > 1 ? ` ×${box.multiplier}` : ''}`, rarity: box.rarity, value: box.delta, item: box.item } : null,
    missionPoints > 0 ? { key: 'mission', label: '미션', note: missions.length > 1 ? `${missions[0].title} 외 ${missions.length - 1}개` : missions[0]?.title || '', value: missionPoints } : null,
  ].filter(Boolean);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  const counter = h('b.res-points', {}, '0');
  const rowEls = rows.map((row) => {
    const value = h('b.res-row-value', {}, '0');
    const el = h(`li.res-row${row.value < 0 ? '.is-minus' : ''}${row.key === 'box' ? `.is-box.r-${row.rarity || 'common'}` : ''}`, { dataset: { key: row.key } },
      h('span.res-row-label', {}, h('b', {}, row.label), row.note ? h('small.res-row-note', {}, row.note) : null),
      value,
      row.item ? h('small.res-row-item', {}, `상자 전용 ${row.item.name}도 받았어요`) : null);
    return { row, el, value };
  });
  // 지금 점수 · 다음 단계까지 막대 — 판 앞 점수에서 시작해, 위 줄의 점수가 들어오는 만큼 막대가 옆으로 차오르고 남은 점수가 줄어든다(11-25 선생님)
  const pointsBefore = Math.max(0, profile.points - total);
  const meter = rankMeter(pointsBefore);
  const nowValue = h('b', {}, `${formatNumber(pointsBefore)}점`);
  const rankEl = meter
    ? h(`button.res-rank.rank-meter.u-${meter.rank.unit}`, { type: 'button', 'aria-label': '단계표 보기', onClick: () => { play('click'); openRankTable(meter.value); } },
      h('span.res-rank-top', {}, h('span.res-rank-now', {}, meter.badge, meter.name), h('span.res-total', {}, '지금 ', nowValue)),
      meter.bar,
      h('span.res-rank-bottom', {}, meter.next, h('small.res-rank-more', {}, '단계표')))
    : h('p.res-total', {}, '지금 ', h('b', {}, `${formatNumber(profile.points)}점`), ' ', rankButton(profile.points));
  if (meter) meter.root = rankEl;
  // 새 아이템 — 상자에서 나온 것은 상자 표시를 붙여 맨 앞에(11-25 선생님 「상자로 얻었다고 뭔가 표시」)
  const fromBox = (item) => Boolean(box?.item && item.id === box.item.id);
  const shownItems = [...unlocked].sort((a, b) => Number(fromBox(b)) - Number(fromBox(a))).slice(0, 5);
  const before = tierProgress(xpBefore);
  const after = tierProgress(xpBefore + xpGained);
  const xpFill = h('i.xp-fill');
  const tierText = (tier) => (tier > 0 ? `시즌 패스 ${tier}단계` : '시즌 패스 1단계까지');
  const xpLabel = h('span.xp-label', {}, tierText(before.tier));
  // 내용은 판 안에서 스크롤되고 단추 줄은 늘 아래에 보인다(낮은 휴대폰 화면에서 아이템이 많으면 단추가 판 밖으로 밀렸다)
  const panel = h(`div.result-panel${won ? '.is-win' : '.is-lose'}`, { role: 'dialog', 'aria-label': won ? '승리 결과' : '패배 결과' },
    h('div.res-body', {},
      h('div.res-head', {}, h('strong.res-title', {}, title || (won ? '승리' : '패배')), subtitle ? h('small.res-sub', {}, subtitle) : null),
      h('div.res-hero', { 'aria-label': `이번 판 합계 ${signed(total)}점` },
        h('small.res-hero-label', {}, '이번 판 합계'),
        h(`div.res-score${total < 0 ? '.is-minus' : ''}`, {}, counter, h('small', {}, '점'))),
      h('ol.res-rows', {}, ...rowEls.map((entry) => entry.el)),
      rankEl,
      h('div.res-xp', {}, h('div.xp-top', {}, xpLabel, h('b', {}, `+${formatNumber(xpGained)} 경험치`)), h('div.xp-bar', {}, xpFill)),
      unlocked.length ? h('div.res-unlocks', {}, h('p.res-label', {}, unlocked.length > 1 ? `새 아이템 ${unlocked.length}개` : '새 아이템'),
        h('div.unlock-row', {}, ...shownItems.map((item) => (fromBox(item)
          ? h(`div.unlock-card.is-box.r-${box.rarity || 'common'}`, { 'aria-label': `상자에서 나온 ${item.name}` },
            h('span.unlock-from', { 'aria-hidden': 'true' }, h('img', { src: cut(BOX_ART, 's'), alt: '' }), '상자'), itemPreview(item), h('small', {}, item.name))
          : h('div.unlock-card', {}, itemPreview(item), h('small', {}, item.name)))))) : null,
      stats.time != null ? h('p.res-stats', {}, `걸린 시간 ${formatTime(stats.time)}, 낸 카드 ${stats.moves || 0}장`) : null),
    h('div.res-actions', {},
      h('button.btn.primary', { type: 'button', onClick: () => { play('confirm'); onPrimary?.(); } }, primaryLabel),
      h('button.btn.ghost', { type: 'button', onClick: () => { play('click'); onHome?.(); } }, '로비로')));
  host.append(panel);
  const reduced = settings.reduced();
  const timeline = gsap.timeline();
  timeline.fromTo(panel, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.4)' });

  // 줄이 하나씩 들어오며 제 점수를 세고, 그만큼 합계가 이어서 오른다(승패 → 상자 → 미션).
  // 같은 때 지금 점수도 오르고 단계 막대가 옆으로 차오른다 — 단계를 넘으면 막대가 한 번 환해지고 새 단계 처음부터
  const tally = { value: 0 };
  const showTotal = () => { counter.textContent = signed(tally.value); };
  const points = { value: pointsBefore };
  const showPoints = () => {
    nowValue.textContent = `${formatNumber(Math.round(points.value))}점`;
    if (meter?.update(points.value)) {
      play('unlock', { volume: 0.5 });
      if (!reduced) gsap.fromTo(meter.bar, { filter: 'brightness(2.2)' }, { filter: 'brightness(1)', duration: 0.6, ease: 'power2.out' });
    }
  };
  let running = 0;
  rowEls.forEach(({ row, el, value }, index) => {
    const at = reduced ? 0 : 0.3 + index * 0.5;
    const own = { value: 0 };
    running += row.value;
    timeline.fromTo(el, { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: reduced ? 0.01 : 0.25, ease: 'power2.out' }, at);
    timeline.to(own, { value: row.value, duration: reduced ? 0.01 : 0.4, ease: 'power2.out', onUpdate: () => { value.textContent = signed(own.value); } }, at);
    timeline.to(tally, { value: running, duration: reduced ? 0.01 : 0.45, ease: 'power2.out', onUpdate: showTotal, onStart: () => play(row.value < 0 ? 'scratch' : 'stack', { volume: 0.5 + index * 0.1 }) }, at + 0.05);
    timeline.to(points, { value: pointsBefore + running, duration: reduced ? 0.01 : 0.45, ease: 'power2.out', onUpdate: showPoints, onStart: () => meter?.bar.classList.add('is-moving') }, at + 0.05);
  });
  timeline.call(() => {
    tally.value = total;
    showTotal();
    points.value = profile.points;
    showPoints();
    rowEls.forEach(({ row, value }) => { value.textContent = signed(row.value); });
    if (!reduced) gsap.fromTo(counter, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: 'back.out(2.4)' });
    setTimeout(() => meter?.bar.classList.remove('is-moving'), 900);
  });
  const settled = reduced ? 0.1 : 0.3 + rowEls.length * 0.5;
  gsap.set(xpFill, { scaleX: before.ratio, transformOrigin: '0% 50%' });
  if (after.tier > before.tier) {
    timeline.to(xpFill, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, settled);
    timeline.call(() => { xpLabel.textContent = `시즌 패스 ${after.tier}단계 달성`; play('level'); panel.classList.add('is-levelup'); }, null, settled + 0.5);
    timeline.set(xpFill, { scaleX: 0 }, settled + 0.52);
    timeline.to(xpFill, { scaleX: after.ratio, duration: 0.4 }, settled + 0.55);
  } else {
    timeline.to(xpFill, { scaleX: after.ratio, duration: 0.6, ease: 'power2.out' }, settled);
  }
  panel.querySelectorAll('.unlock-card').forEach((card, index) => {
    timeline.fromTo(card, { rotationY: 90, opacity: 0 }, { rotationY: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.8)' }, settled + 0.3 + index * 0.15);
    if (index === 0) timeline.call(() => play('unlock'), null, settled + 0.3);
  });
  // preventScroll — 휴대폰에서 판이 길면 맨 아래 단추로 포커스가 가며 판이 스크롤되어 점수가 잘렸다(11-24)
  setTimeout(() => panel.querySelector('.btn.primary')?.focus({ preventScroll: true }), 400);
  return { el: panel, close: () => panel.remove() };
}
