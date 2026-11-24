// 로비 — 장착한 맵 사진을 깐 무대 위에 지금 점수로 만나는 상대들 + 시즌 2 글자. 나머지(패스 · 미션 · 보관함)는 차분하게
import gsap from 'gsap';
import { h, formatNumber, stars } from './dom.js';
import { cut } from '../data/assets.js';
import { lookOf } from '../data/looks.js';
import { mapVars } from './look-apply.js';
import { CHARACTERS, pickLine, shufflePersonas } from '../data/characters.js';
import { loadMissionDashboard } from '../core/missions.js';
import { tierProgress, isOpeningEventActive, openingEventDaysLeft, OPENING_EVENT, SEASON, PASS_REWARDS } from '../core/season.js';
import { cosmeticById, nextCosmeticUnlock, DEFAULT_EQUIPPED } from '../core/cosmetics.js';
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

// 무대 캐릭터를 누르면 그 캐릭터의 인사 한마디
function say(button, line) {
  if (!line) return;
  button.querySelector('.rival-say')?.remove();
  const bubble = h('span.rival-say', { 'aria-hidden': 'true' }, line);
  button.append(bubble);
  // 가장자리 캐릭터의 긴 말은 무대 밖으로 잘린다 — 무대 안으로 밀고, 꼬리는 그대로 캐릭터를 가리키게
  gsap.set(bubble, { xPercent: -50 });
  const box = bubble.getBoundingClientRect();
  const stage = button.closest('.stage')?.getBoundingClientRect();
  const shift = !stage ? 0 : box.left < stage.left + 8 ? stage.left + 8 - box.left : box.right > stage.right - 8 ? stage.right - 8 - box.right : 0;
  bubble.style.setProperty('--tail', `${-shift}px`);
  gsap.timeline({ onComplete: () => bubble.remove() })
    .fromTo(bubble, { x: shift, scale: 0.6, opacity: 0 }, { x: shift, scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' })
    .to(bubble, { opacity: 0, duration: 0.3 }, '+=2.1');
}

export function renderLobby({ host, profile, accountStatus, onAi, onOnline, onCollection, onPass, onMissions, onSettings, onAccount, onProfile, onToggleSound }) {
  const progress = ratingProgress(profile.points);
  const weights = matchmakingWeights(profile.points);
  const pass = tierProgress(profile.seasonXp);
  const nextPass = PASS_REWARDS.find((reward) => reward.tier > pass.tier);
  const nextPassItem = nextPass ? cosmeticById(nextPass.itemId) : null;
  const nextUnlock = nextCosmeticUnlock(profile.peakPoints);
  const missions = loadMissionDashboard();
  const avatar = cosmeticById(profile.equipped.avatar) || cosmeticById(DEFAULT_EQUIPPED.avatar);
  const eventOn = isOpeningEventActive();

  // 캐릭터와 난이도는 따로 무작위 — 이 점수에서 만나는 난이도 확률은 따로 한 줄로(30만 점대면 ★5~★8)
  // 무대 자리는 넓으면 다섯 · 좁으면 넷이고, 상대 열다섯이 몇 초마다 한 자리씩 번갈아 앉는다(11-25 「넷만 나오는 게 아깝다」)
  const odds = weights.map((chance, index) => ({ stars: index + 1, chance })).filter((level) => level.chance > 0);
  const order = shufflePersonas(CHARACTERS.length);
  const lineupEl = h('div.stage-lineup');
  let holdUntil = 0;
  let hovering = false;
  const seat = (rival, index, count) => h(`button.stage-rival.r${index}`, {
    type: 'button', vars: { '--rival': rival.color, '--bob-delay': `${(index * 0.37) % 1.4}s`, '--lineup': count, '--lift': `${Math.round((1 - Math.abs((count > 1 ? (2 * index) / (count - 1) : 1) - 1)) * 16)}%` },
    'aria-label': `${rival.title} ${rival.name}`,
    dataset: { name: rival.name },
    onPointerenter: (event) => { if (event.pointerType === 'mouse') hovering = true; },
    onPointerleave: () => { hovering = false; },
    onClick: (event) => {
      play('select');
      holdUntil = Date.now() + 2800;
      const button = event.currentTarget;
      gsap.fromTo(button, { y: 0 }, { y: -22, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });
      say(button, pickLine(rival, 'intro'));
    },
  },
  h('span.rival-spot'),
  h('img.rival-art', { src: cut(rival.portrait), alt: '', draggable: 'false' }),
  h('span.rival-plate', {}, h('small', {}, rival.title), h('b', {}, rival.name)));

  const missionRows = missions.daily.missions.map((mission) => h(`li.mission-row${mission.completed ? '.is-done' : ''}`, {},
    h('div.mission-line', {}, h('b', {}, mission.title), h('small', {}, `+${mission.reward}점`)),
    h('div.mission-bar', {}, h('i', { style: { width: `${mission.percent}%` } })),
    h('small.mission-count', {}, `${mission.progress}/${mission.target}`)));

  const statusLabel = { email: '기록 보호 중', guest: '게스트 기록', local: '이 브라우저에만 저장', checking: '확인 중' }[accountStatus] || '이 브라우저에만 저장';

  const el = h('section.lobby', { 'aria-label': '로비' },
    h('header.lobby-top', {},
      h('div.logo', { 'aria-label': 'ONE! 시즌 2' }, h('b.logo-word', {}, 'ONE!'), h('span.logo-season', {}, h('small', {}, 'SEASON'), h('b', {}, '2'))),
      h('div.top-right', {},
        h('button.profile-chip', { type: 'button', onClick: () => onProfile?.(), 'aria-label': `내 프로필 열기, ${formatNumber(profile.points)}점, ${statusLabel}` },
          h('img', { src: cut(avatar.portrait), alt: '' }),
          h('span.chip-text', {}, h('b', {}, `${formatNumber(profile.points)}점`), h('small', {}, `${stars(progress.stars)} ${statusLabel}`))),
        h('button.icon-btn.sound-btn', { type: 'button', 'aria-label': '소리 켜기 끄기', html: soundIcon(), onClick: (event) => { onToggleSound?.(); event.currentTarget.innerHTML = soundIcon(); } }),
        h('button.icon-btn', { type: 'button', 'aria-label': '설정', html: ICON.gear, onClick: () => onSettings?.() }))),
    h('div.lobby-main', {},
      h('div.stage', {},
        h('div.stage-scene', { 'aria-hidden': 'true' }),
        h('div.stage-felt', { 'aria-hidden': 'true' }),
        h('div.stage-copy', {},
          h('h1.stage-title', {}, '오늘은 누구와 붙을까요'),
          h('p.stage-sub', {}, '캐릭터와 난이도는 판마다 따로 정해져요'),
          h('p.stage-odds', { 'aria-label': `${formatNumber(profile.points)}점에서 만나는 난이도` }, h('small', {}, '만나는 난이도'), ...odds.map((level) => h('span', {}, h('i', {}, `★${level.stars}`), ` ${level.chance}%`))),
          eventOn ? h('p.event-ribbon', {}, h('b', {}, OPENING_EVENT.name), h('span', {}, `${openingEventDaysLeft()}일 남음, 경험치 2배에 보너스판이 더 자주 나와요`)) : null),
        lineupEl),
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

  // 자리 수는 무대 너비로(실습실 1920 은 다섯, 노트북 · 휴대폰은 넷)
  const seatCount = el.querySelector('.stage').clientWidth >= 900 ? 5 : 4;
  lineupEl.append(...order.slice(0, seatCount).map((rival, index) => seat(rival, index, seatCount)));
  // 한 자리씩 바꿔 앉기 — 아직 무대에 없던 캐릭터를 차례로. 마우스를 올렸거나 말풍선이 떠 있으면 기다린다
  const reduced = settings.reduced();
  let next = seatCount;
  let lastSeat = -1;
  let swapping = false;
  const timer = setInterval(() => {
    if (!el.isConnected) { clearInterval(timer); return; }
    if (swapping || document.hidden || hovering || Date.now() < holdUntil) return;
    const seated = new Set([...lineupEl.children].map((button) => button.dataset.name));
    let incoming = null;
    for (let step = 0; step < order.length && !incoming; step += 1, next += 1) {
      const candidate = order[next % order.length];
      if (!seated.has(candidate.name)) incoming = candidate;
    }
    if (!incoming) return;
    let index = Math.floor(Math.random() * seatCount);
    if (index === lastSeat) index = (index + 1) % seatCount;
    lastSeat = index;
    const leaving = lineupEl.children[index];
    const arriving = seat(incoming, index, seatCount);
    const art = new Image();
    art.src = cut(incoming.portrait);
    swapping = true;
    art.decode().catch(() => {}).then(() => {
      if (!leaving.isConnected) { swapping = false; return; }
      gsap.timeline({ onComplete: () => { swapping = false; } })
        .to(leaving, reduced ? { opacity: 0, duration: 0.35 } : { yPercent: 18, opacity: 0, duration: 0.3, ease: 'power2.in' })
        .add(() => leaving.replaceWith(arriving))
        .fromTo(arriving, reduced ? { opacity: 0 } : { yPercent: -30, opacity: 0 }, reduced ? { opacity: 1, duration: 0.45 } : { yPercent: 0, opacity: 1, duration: 0.6, ease: 'bounce.out' });
    });
  }, reduced ? 5200 : 3400);

  if (!settings.reduced()) {
    gsap.from(el.querySelectorAll('.stage-rival'), { y: 60, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'back.out(1.6)' });
    gsap.from(el.querySelector('.logo'), { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });
  }
  return el;
}
