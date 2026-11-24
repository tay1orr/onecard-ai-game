// 로비 — 장착한 맵 사진을 깐 무대 위에 지금 점수로 만나는 상대들 + 시즌 2 글자. 나머지(패스 · 미션 · 보관함)는 차분하게
import gsap from 'gsap';
import { h, formatNumber, stars } from './dom.js';
import { cut } from '../data/assets.js';
import { lookOf } from '../data/looks.js';
import { mapVars } from './look-apply.js';
import { RIVALS } from '../data/characters.js';
import { loadMissionDashboard } from '../core/missions.js';
import { tierProgress, isOpeningEventActive, openingEventDaysLeft, OPENING_EVENT, SEASON, PASS_REWARDS } from '../core/season.js';
import { cosmeticById, nextCosmeticUnlock } from '../core/cosmetics.js';
import { matchmakingWeights, playerStarsForPoints, ratingProgress } from '../core/rating.js';
import { itemPreview } from './item-preview.js';
import { play } from './sound.js';
import { settings } from './settings.js';

const ICON = {
  gear: '<svg viewBox="0 0 24 24"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Zm8.2 4.6-1.9-.4a6.7 6.7 0 0 1-.6 1.5l1.1 1.6-1.6 1.6-1.6-1.1a6.7 6.7 0 0 1-1.5.6l-.4 1.9h-2.3l-.4-1.9a6.7 6.7 0 0 1-1.5-.6l-1.6 1.1-1.6-1.6 1.1-1.6a6.7 6.7 0 0 1-.6-1.5l-1.9-.4v-2.3l1.9-.4a6.7 6.7 0 0 1 .6-1.5L4.4 7.2 6 5.6l1.6 1.1a6.7 6.7 0 0 1 1.5-.6l.4-1.9h2.3l.4 1.9a6.7 6.7 0 0 1 1.5.6L15.3 5.6l1.6 1.6-1.1 1.6c.3.5.5 1 .6 1.5l1.9.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4Z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.2 6a8.6 8.6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4Z" fill="currentColor"/><path d="m16 9.5 5 5m0-5-5 5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
};

function soundIcon() { return settings.get().sound ? ICON.sound : ICON.mute; }

export function renderLobby({ host, profile, accountStatus, onAi, onOnline, onCollection, onPass, onMissions, onSettings, onAccount, onToggleSound }) {
  const progress = ratingProgress(profile.points);
  const weights = matchmakingWeights(profile.points);
  const pass = tierProgress(profile.seasonXp);
  const nextPass = PASS_REWARDS.find((reward) => reward.tier > pass.tier);
  const nextPassItem = nextPass ? cosmeticById(nextPass.itemId) : null;
  const nextUnlock = nextCosmeticUnlock(profile.peakPoints);
  const missions = loadMissionDashboard();
  const avatar = cosmeticById(profile.equipped.avatar) || cosmeticById('avatar-rabbit');
  const eventOn = isOpeningEventActive();

  // 이 점수에서 만날 수 있는 상대만 무대에 세운다(30만 점대면 ★5~★8)
  const meetable = RIVALS.filter((rival) => (weights[rival.stars - 1] || 0) > 0);
  const COUNT_WORD = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟'];
  const rivals = meetable.map((rival, index) => {
    const chance = weights[rival.stars - 1] || 0;
    return h(`button.stage-rival.r${index}`, {
      type: 'button', vars: { '--rival': rival.color, '--bob-delay': `${(index * 0.37) % 1.4}s`, '--lineup': meetable.length, '--lift': `${Math.round((1 - Math.abs((meetable.length > 1 ? (2 * index) / (meetable.length - 1) : 1) - 1)) * 16)}%` },
      'aria-label': `${rival.title} ${rival.name}, ${rival.stars}성, 만날 확률 ${chance}%`,
      onClick: (event) => {
        play('select');
        const target = event.currentTarget.querySelector('img');
        gsap.fromTo(target, { y: 0 }, { y: -26, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' });
      },
    },
    h('span.rival-spot'),
    h('img.rival-art', { src: cut(rival.portrait), alt: '', draggable: 'false' }),
    h('span.rival-plate', {}, h('small', {}, rival.title), h('b', {}, rival.name)),
    h('span.rival-meta', {}, h('i', {}, stars(rival.stars)), h('em', {}, `만날 확률 ${chance}%`)));
  });

  const missionRows = missions.daily.missions.map((mission) => h(`li.mission-row${mission.completed ? '.is-done' : ''}`, {},
    h('div.mission-line', {}, h('b', {}, mission.title), h('small', {}, `+${mission.reward}점`)),
    h('div.mission-bar', {}, h('i', { style: { width: `${mission.percent}%` } })),
    h('small.mission-count', {}, `${mission.progress}/${mission.target}`)));

  const statusLabel = { email: '기록 보호 중', guest: '게스트 기록', local: '이 브라우저에만 저장', checking: '확인 중' }[accountStatus] || '이 브라우저에만 저장';

  const el = h('section.lobby', { 'aria-label': '로비' },
    h('header.lobby-top', {},
      h('div.logo', { 'aria-label': 'ONE! 시즌 2' }, h('b.logo-word', {}, 'ONE!'), h('span.logo-season', {}, h('small', {}, 'SEASON'), h('b', {}, '2'))),
      h('div.top-right', {},
        h('button.profile-chip', { type: 'button', onClick: () => onAccount?.(), 'aria-label': `내 기록 ${formatNumber(profile.points)}점, ${statusLabel}` },
          h('img', { src: cut(avatar.portrait), alt: '' }),
          h('span.chip-text', {}, h('b', {}, `${formatNumber(profile.points)}점`), h('small', {}, `${stars(progress.stars)} ${statusLabel}`))),
        h('button.icon-btn.sound-btn', { type: 'button', 'aria-label': '소리 켜기 끄기', html: soundIcon(), onClick: (event) => { onToggleSound?.(); event.currentTarget.innerHTML = soundIcon(); } }),
        h('button.icon-btn', { type: 'button', 'aria-label': '설정', html: ICON.gear, onClick: () => onSettings?.() }))),
    h('div.lobby-main', {},
      h('div.stage', {},
        h('div.stage-scene', { 'aria-hidden': 'true' }),
        h('div.stage-felt', { 'aria-hidden': 'true' }),
        h('div.stage-copy', {},
          h('h1.stage-title', {}, `${COUNT_WORD[meetable.length] || meetable.length} 상대가 기다려요`),
          h('p.stage-sub', {}, `${formatNumber(profile.points)}점이면 이 확률로 만나요`),
          eventOn ? h('p.event-ribbon', {}, h('b', {}, OPENING_EVENT.name), h('span', {}, `${openingEventDaysLeft()}일 남음, 경험치 2배에 보너스판이 더 자주 나와요`)) : null),
        h('div.stage-lineup', {}, ...rivals)),
      h('aside.lobby-actions', {},
        h('button.play-btn.is-primary', { type: 'button', onClick: () => onAi?.() },
          h('span.play-label', {}, h('b', {}, 'AI 대전'), h('small', {}, '끝나면 보상 상자 하나를 골라 열어요')),
          h('img.play-art', { src: cut('sword'), alt: '' })),
        h('button.play-btn', { type: 'button', onClick: () => onOnline?.() },
          h('span.play-label', {}, h('b', {}, '친구와 대전'), h('small', {}, '방 코드 여섯 자리로 둘이서')),
          h('img.play-art', { src: cut('dice'), alt: '' })),
        h('button.pass-card', { type: 'button', onClick: () => onPass?.() },
          h('div.pass-head', {}, h('b', {}, `${SEASON.name} 패스`), h('span', {}, pass.maxed ? '마지막 단계까지 왔어요' : pass.tier > 0 ? `${pass.tier}단계` : '첫 판부터 시작')),
          h('div.xp-bar', {}, h('i.xp-fill', { style: { transform: `scaleX(${pass.ratio})` } })),
          nextPassItem ? h('div.pass-next', {}, itemPreview(nextPassItem), h('span', {}, h('small', {}, `${nextPass.tier}단계 보상`), h('b', {}, nextPassItem.name))) : null),
        h('div.mission-card', {},
          h('div.card-head', {}, h('b', {}, '오늘의 미션'), h('button.text-btn', { type: 'button', onClick: () => onMissions?.() }, '주간 미션까지 보기')),
          h('ul.mission-list', {}, ...missionRows)),
        h('button.locker-card', { type: 'button', onClick: () => onCollection?.() },
          h('div.locker-stack', { 'aria-hidden': 'true' }, itemPreview(cosmeticById(profile.equipped.cardBack)), itemPreview(cosmeticById(profile.equipped.cardFace))),
          h('span.locker-text', {}, h('b', {}, '보관함'), h('small', {}, nextUnlock ? `다음 보상 ${nextUnlock.items[0].name}까지 ${formatNumber(nextUnlock.remaining)}점` : '점수 보상을 모두 열었어요'))))));

  // 무대 바닥 · 배경은 장착한 맵(사진 · 시즌 1 그림)
  const map = lookOf('table', cosmeticById(profile.equipped.table)?.look);
  Object.entries(mapVars(map)).forEach(([key, value]) => el.style.setProperty(key, value));
  el.dataset.map = map.painted || map.surface ? 'painted' : 'photo';
  host.replaceChildren(el);
  if (!settings.reduced()) {
    gsap.from(el.querySelectorAll('.stage-rival'), { y: 60, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'back.out(1.6)' });
    gsap.from(el.querySelector('.logo'), { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });
  }
  return el;
}
