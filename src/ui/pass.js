// 시즌 패스 — 20단계 보상 길. 경험치는 판을 마치면(이기면 더) 쌓이고, 미션 하나에 40
import gsap from 'gsap';
import { h, formatNumber } from './dom.js';
import { SEASON, PASS_REWARDS, tierProgress, isOpeningEventActive, openingEventDaysLeft, OPENING_EVENT, MISSION_XP } from '../core/season.js';
import { cosmeticById } from '../core/cosmetics.js';
import { loadPlayerProfile } from '../core/rating.js';
import { itemPreview } from './item-preview.js';
import { play } from './sound.js';

export function openPass({ host, onClose }) {
  const profile = loadPlayerProfile();
  const progress = tierProgress(profile.seasonXp);
  const nodes = PASS_REWARDS.map(({ tier, itemId }) => {
    const item = cosmeticById(itemId);
    const reached = progress.tier >= tier;
    return h(`li.pass-node${reached ? '.is-reached' : ''}${tier === progress.tier + 1 ? '.is-next' : ''}`, {},
      h('b.node-tier', {}, String(tier)),
      h('div.node-card', {}, itemPreview(item), h('small', {}, item.name)),
      h('span.node-state', {}, reached ? '받았어요' : tier === progress.tier + 1 ? `${formatNumber(progress.needed - progress.into)} 경험치 남음` : ''));
  });
  const track = h('ol.pass-track', { 'aria-label': '시즌 패스 보상' }, ...nodes);
  const endDate = new Date(`${SEASON.endsAt}T00:00:00`);
  const el = h('section.pass-page', { 'aria-label': '시즌 패스' },
    h('header.page-top', {},
      h('button.icon-btn', { type: 'button', 'aria-label': '로비로', onClick: () => close(), html: '<svg viewBox="0 0 24 24"><path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
      h('h1.page-title', {}, `${SEASON.name} 패스`),
      h('p.locker-peak', {}, `${endDate.getMonth() + 1}월 ${endDate.getDate()}일까지`)),
    h('div.pass-hero', {},
      h('div.pass-tier', {}, h('b', {}, String(progress.tier)), h('small', {}, `/ ${SEASON.tiers}단계`)),
      h('div.pass-meter', {},
        h('div.xp-bar.is-big', {}, h('i.xp-fill', { style: { transform: `scaleX(${progress.ratio})` } })),
        h('p', {}, progress.maxed ? '시즌 2 보상을 모두 받았어요' : `다음 단계까지 ${formatNumber(progress.needed - progress.into)} 경험치`)),
      isOpeningEventActive() ? h('p.event-ribbon', {}, h('b', {}, OPENING_EVENT.name), h('span', {}, `${openingEventDaysLeft()}일 남음, 경험치 2배`)) : null),
    track,
    h('div.pass-how', {},
      h('p', {}, '판을 마칠 때마다 경험치가 쌓여요.'),
      h('p', {}, `이기면 120~200, 지면 45, 미션 하나에 ${MISSION_XP}.`),
      h('p', {}, '친구와 대전은 20을 더 받고, 보너스판에서 이기면 1.5배예요.')));
  host.append(el);
  gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
  gsap.from(track.children, { y: 30, opacity: 0, duration: 0.35, stagger: 0.025, ease: 'back.out(1.6)' });
  const current = track.querySelector('.is-next') || track.querySelector('.is-reached:last-of-type');
  setTimeout(() => current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }), 250);
  play('open', { volume: 0.5 });

  function close() {
    gsap.to(el, { opacity: 0, y: 20, duration: 0.2, onComplete: () => { el.remove(); onClose?.(); } });
  }
  return { close };
}
