// 결과 판 — 점수가 굴러가며 올라가고, 시즌 패스 막대가 차고, 새 아이템이 뒤집혀 나온다
import gsap from 'gsap';
import { h, formatNumber, stars } from './dom.js';
import { itemPreview } from './item-preview.js';
import { tierProgress } from '../core/season.js';
import { playerStarsForPoints } from '../core/rating.js';
import { play } from './sound.js';
import { settings } from './settings.js';

function formatTime(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}분 ${String(seconds % 60).padStart(2, '0')}초`;
}

export function showResult({ host, won, delta = 0, bonus = false, profile, xpGained = 0, xpBefore = 0, unlocked = [], missions = [], missionPoints = 0, stats = {}, title, subtitle, primaryLabel = '다시 하기', onPrimary, onHome, extra = null }) {
  const counter = h('b.res-points', {}, '0');
  const before = tierProgress(xpBefore);
  const after = tierProgress(xpBefore + xpGained);
  const xpFill = h('i.xp-fill');
  const tierText = (tier) => (tier > 0 ? `시즌 패스 ${tier}단계` : '시즌 패스 1단계까지');
  const xpLabel = h('span.xp-label', {}, tierText(before.tier));
  const panel = h(`div.result-panel${won ? '.is-win' : '.is-lose'}`, { role: 'dialog', 'aria-label': won ? '승리 결과' : '패배 결과' },
    h('div.res-head', {}, h('strong.res-title', {}, title || (won ? '승리' : '패배')), subtitle ? h('small.res-sub', {}, subtitle) : null),
    h('div.res-score', {}, counter, h('small', {}, '점')),
    bonus && won ? h('span.res-bonus', {}, '보너스판 2배') : null,
    h('p.res-total', {}, `지금 ${formatNumber(profile.points)}점 ${stars(playerStarsForPoints(profile.points))}`),
    h('div.res-xp', {}, h('div.xp-top', {}, xpLabel, h('b', {}, `+${formatNumber(xpGained)} 경험치`)), h('div.xp-bar', {}, xpFill)),
    unlocked.length ? h('div.res-unlocks', {}, h('p.res-label', {}, unlocked.length > 1 ? `새 아이템 ${unlocked.length}개` : '새 아이템'),
      h('div.unlock-row', {}, ...unlocked.slice(0, 5).map((item) => h('div.unlock-card', {}, itemPreview(item), h('small', {}, item.name))))) : null,
    missions.length ? h('div.res-missions', {}, h('p.res-label', {}, `미션 완료 +${formatNumber(missionPoints)}점`), h('p.res-mission-names', {}, missions.map((mission) => mission.title).join(', '))) : null,
    stats.time != null ? h('p.res-stats', {}, `걸린 시간 ${formatTime(stats.time)}, 낸 카드 ${stats.moves || 0}장`) : null,
    extra,
    h('div.res-actions', {},
      h('button.btn.primary', { type: 'button', onClick: () => { play('confirm'); onPrimary?.(); } }, primaryLabel),
      h('button.btn.ghost', { type: 'button', onClick: () => { play('click'); onHome?.(); } }, '로비로')));
  host.append(panel);
  const reduced = settings.reduced();
  const timeline = gsap.timeline();
  timeline.fromTo(panel, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.4)' });
  const tally = { value: 0 };
  timeline.to(tally, {
    value: delta, duration: reduced ? 0.1 : 0.9, ease: 'power2.out',
    onUpdate: () => { counter.textContent = `${delta > 0 ? '+' : ''}${formatNumber(Math.round(tally.value))}`; },
    onStart: () => play(won ? 'stack' : 'scratch', { volume: 0.6 }),
  }, 0.2);
  gsap.set(xpFill, { scaleX: before.ratio, transformOrigin: '0% 50%' });
  if (after.tier > before.tier) {
    timeline.to(xpFill, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 0.6);
    timeline.call(() => { xpLabel.textContent = `시즌 패스 ${after.tier}단계 달성`; play('level'); panel.classList.add('is-levelup'); }, null, 1.1);
    timeline.set(xpFill, { scaleX: 0 }, 1.12);
    timeline.to(xpFill, { scaleX: after.ratio, duration: 0.4 }, 1.15);
  } else {
    timeline.to(xpFill, { scaleX: after.ratio, duration: 0.6, ease: 'power2.out' }, 0.6);
  }
  panel.querySelectorAll('.unlock-card').forEach((card, index) => {
    timeline.fromTo(card, { rotationY: 90, opacity: 0 }, { rotationY: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.8)' }, 1.2 + index * 0.15);
    if (index === 0) timeline.call(() => play('unlock'), null, 1.2);
  });
  setTimeout(() => panel.querySelector('.btn.primary')?.focus(), 400);
  return { el: panel, close: () => panel.remove() };
}
