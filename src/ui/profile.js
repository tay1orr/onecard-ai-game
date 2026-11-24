// 내 프로필 — 내 캐릭터 고르기 · 이름 · 기록 보호. 로비 오른쪽 위의 내 점수 칩을 누르면 열린다.
// 11-24 선생님 「프로필 설정 같은 걸 만들면 좋을 것 같긴 한데, 아니면 내 캐릭터 꾸미기 같은?」
// 내 캐릭터는 상대 캐릭터와 따로(「아예 별도의 캐릭터로 상대 캐릭터 + 아예 별도 사용자 캐릭터 몇 개」).
// 고르면 바로 장착되고(적용 단추 없음), 이름은 적는 대로 저장된다.
import gsap from 'gsap';
import { h, formatNumber, stars } from './dom.js';
import { cut } from '../data/assets.js';
import { COSMETICS, cosmeticById, isUnlocked } from '../core/cosmetics.js';
import { loadPlayerProfile, savePlayerProfile, playerStarsForPoints } from '../core/rating.js';
import { tierForXp } from '../core/season.js';
import { normalizeNickname } from '../net/multiplayer-helpers.js';
import { settings } from './settings.js';
import { play } from './sound.js';

const BACK_ICON = '<svg viewBox="0 0 24 24"><path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function lockText(item) {
  if (item.pass) return `시즌 패스 ${item.pass}단계`;
  return `${formatNumber(item.threshold)}점에 열려요`;
}

export function openProfile({ host, onClose, onChanged, onAccount }) {
  let profile = loadPlayerProfile();
  const passTier = tierForXp(profile.seasonXp);
  const unlocked = (item) => isUnlocked(item, profile.peakPoints, passTier, profile.boxItems);
  // 열린 것 먼저, 그다음 열리는 차례대로
  const avatars = COSMETICS.filter((item) => item.slot === 'avatar')
    .sort((a, b) => Number(unlocked(b)) - Number(unlocked(a)) || Number(Boolean(b.character)) - Number(Boolean(a.character)) || (a.pass ? 1e9 + a.pass : a.threshold) - (b.pass ? 1e9 + b.pass : b.threshold));
  const myName = () => normalizeNickname(settings.get().nickname) || '나';

  // 왼쪽 — 내 캐릭터 무대
  const heroImg = h('img.pf-hero', { alt: '', draggable: 'false' });
  const heroName = h('strong.pf-name', {}, '');
  const heroLabel = h('small.pf-character', {}, '');
  const heroStats = h('p.pf-stats', {}, '');
  const stage = h('div.pf-stage', {}, h('div.pf-hero-wrap', {}, h('i.pf-spot'), heroImg), h('div.pf-plate', {}, heroLabel, heroName, h('span.pf-stars', {}, stars(playerStarsForPoints(profile.points)))), heroStats);

  // 오른쪽 — 이름 · 캐릭터 고르기 · 기록 보호
  const nameInput = h('input.text-input.pf-input', { maxlength: '12', placeholder: '이름 2~12자', value: settings.get().nickname || '', 'aria-label': '내 이름', autocomplete: 'off' });
  const nameHint = h('small.pf-hint', {}, '대전 화면과 친구와 대전에 이 이름이 나와요');
  let nameTimer = null;
  nameInput.addEventListener('input', () => {
    clearTimeout(nameTimer);
    nameTimer = setTimeout(() => {
      const value = normalizeNickname(nameInput.value);
      if (value && value.length < 2) { nameHint.textContent = '이름은 2자 이상이어야 해요'; nameHint.dataset.state = 'warn'; return; }
      settings.set({ nickname: value });
      nameHint.textContent = value ? '저장했어요' : '이름을 비우면 기본 이름(나)으로 나와요';
      nameHint.dataset.state = 'ok';
      refreshHero(false);
      onChanged?.(profile);
    }, 350);
  });

  const grid = h('div.pf-grid', { role: 'listbox', 'aria-label': '내 캐릭터' });
  function tile(item) {
    const open = unlocked(item);
    const on = profile.equipped.avatar === item.id;
    return h(`button.pf-tile${on ? '.is-on' : ''}${open ? '' : '.is-locked'}`, {
      type: 'button', role: 'option', 'aria-selected': String(on), dataset: { id: item.id },
      'aria-label': open ? `${item.name}${on ? ', 지금 내 캐릭터' : ''}` : `${item.name}, ${lockText(item)}`,
      onClick: () => choose(item),
    }, h('img', { src: cut(item.portrait, 's'), alt: '', loading: 'lazy', draggable: 'false' }), h('b', {}, item.name), h('small', {}, open ? (on ? '내 캐릭터' : '고르기') : lockText(item)));
  }
  function renderGrid() {
    grid.replaceChildren(...avatars.map((item) => tile(item)));
  }

  function refreshHero(animate = true) {
    const item = cosmeticById(profile.equipped.avatar) || cosmeticById('avatar-rabbit');
    heroImg.src = cut(item.portrait);
    heroLabel.textContent = item.name;
    heroName.textContent = myName();
    heroStats.textContent = `${formatNumber(profile.points)}점 · ${formatNumber(profile.wins)}승 ${formatNumber(Math.max(0, profile.games - profile.wins))}패 · ${formatNumber(profile.games)}판`;
    if (animate && !settings.reduced()) {
      gsap.fromTo(heroImg, { y: 40, scale: 0.86, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' });
    }
  }

  function choose(item) {
    if (!unlocked(item)) {
      play('error', { volume: 0.4 });
      const target = grid.querySelector(`[data-id="${item.id}"]`);
      if (target && !settings.reduced()) gsap.fromTo(target, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1.6, .3)' });
      return;
    }
    if (profile.equipped.avatar === item.id) return;
    profile = savePlayerProfile({ ...profile, equipped: { ...profile.equipped, avatar: item.id } });
    play('select');
    refreshHero(true);
    renderGrid();
    onChanged?.(profile);
  }

  const el = h('section.profile-page', { 'aria-label': '내 프로필' },
    h('header.page-top', {},
      h('button.icon-btn', { type: 'button', 'aria-label': '로비로', onClick: () => close(), html: BACK_ICON }),
      h('h1.page-title', {}, '내 프로필')),
    h('div.pf-body', {},
      stage,
      h('div.pf-side', {},
        h('label.field.pf-field', {}, h('span', {}, '내 이름'), nameInput, nameHint),
        h('div.pf-section', {}, h('div.pf-head', {}, h('b', {}, '내 캐릭터'), h('small', {}, '고르면 바로 바뀌어요. 상대 캐릭터와는 따로예요')), grid),
        h('button.btn.ghost.pf-account', { type: 'button', onClick: () => onAccount?.() }, '기록 보호 · 계정'))));
  host.append(el);
  refreshHero(true);
  renderGrid();
  gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });

  function close() {
    clearTimeout(nameTimer);
    gsap.to(el, { opacity: 0, y: 20, duration: 0.2, onComplete: () => { el.remove(); onClose?.(); } });
  }
  return { close };
}
