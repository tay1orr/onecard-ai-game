// 보관함 — 목록은 칸을 바꿀 때만 그리고, 고를 때는 표시와 미리보기 변수만 바꾼다(시즌 1은 누를 때마다 94개를 다시 그려 0.2초 멈췄다)
import gsap from 'gsap';
import { h, formatNumber } from './dom.js';
import {
  COSMETICS, COSMETIC_SLOTS, COSMETIC_SETS, CHARM_SLOT_COUNT, charmToyConfig, cosmeticById, cosmeticSetForItem, cosmeticSetProgress,
  equippedCharmIds, isUnlocked, nextCosmeticUnlock,
} from '../core/cosmetics.js';

import { loadPlayerProfile, savePlayerProfile } from '../core/rating.js';
import { tierForXp } from '../core/season.js';
import { lookOf } from '../data/looks.js';
import { cut } from '../data/assets.js';
import { itemPreview } from './item-preview.js';
import { applyEquipped } from './look-apply.js';
import { toyMotion, toySound } from './toys.js';
import { cardBack, cardFace } from './cards.js';
import { createFx } from './fx.js';
import { createDirector } from './director.js';
import { play } from './sound.js';
import { toast } from './modal.js';

// 장미와 꽃 — 가장 많이 하는 플레이어가 좋아하는 것만 모아 보기
const TABS = [{ key: 'all', name: '전체' }, { key: 'flower', name: '장미와 꽃' }, { key: 'box', name: '상자 전용' }, ...COSMETIC_SLOTS];
const isFlower = (item) => (item.tags || []).some((tag) => tag === 'rose' || tag === 'flower');

function stateText(item, profile, passTier) {
  if (isUnlocked(item, profile.peakPoints, passTier, profile.boxItems)) return '';
  if (item.box) return 'AI 대전 보상 상자에서만 나와요';
  if (item.pass) return `시즌 패스 ${item.pass}단계`;
  return `${formatNumber(item.threshold)}점에 열려요`;
}

export function openCollection({ host, onClose, onChanged }) {
  let profile = loadPlayerProfile();
  let passTier = tierForXp(profile.seasonXp);
  let tab = 'all';
  let selected = cosmeticById(profile.equipped.table);
  let charmSlot = 0;
  const director = createDirector();

  // 미리보기 — 작은 탁자
  const previewDeck = h('div.pv-deck', {}, cardBack(), cardBack());
  const previewPile = h('div.pv-pile', {}, cardFace({ id: 'pv-a', suit: 'spades', rank: 'A' }), cardFace({ id: 'pv-q', suit: 'hearts', rank: 'Q' }));
  const previewAvatar = h('img.pv-me', { alt: '' });
  const previewToys = h('div.pv-toys');
  const previewProps = h('div.scene-props');
  const previewFelt = h('div.felt', {}, h('div.felt-light'), h('div.pv-play', {}, previewDeck, previewPile), previewToys, previewAvatar);
  const fxLayer = h('div.fx-layer');
  // 미리보기도 맵 그대로 — 배경 사진(또는 시즌 1 그림) · 소품 · 조명 위에 작은 탁자
  const preview = h('div.locker-preview.show-caption', {},
    h('div.scene', { 'aria-hidden': 'true' }, h('div.scene-photo'), previewProps, h('div.scene-light'), h('div.scene-shade')),
    h('div.rim', {}, previewFelt), fxLayer);
  const fx = createFx({ layer: fxLayer, root: preview, director });

  const selName = h('strong.sel-name', {}, '');
  const selDesc = h('p.sel-desc', {}, '');
  const selState = h('span.sel-state', {}, '');
  const selSet = h('span.sel-set', {}, '');
  const equipButton = h('button.btn.primary', { type: 'button', onClick: () => equip() }, '장착하기');
  const replayButton = h('button.btn.ghost', { type: 'button', onClick: () => replay() }, '연출 보기');
  const charmSlots = h('div.charm-slots', { role: 'group', 'aria-label': '장난감 자리' }, ...Array.from({ length: CHARM_SLOT_COUNT }, (_, index) => h('button.slot-btn', {
    type: 'button', onClick: () => { charmSlot = index; play('select'); refreshSelection(); },
  }, `${index + 1}번 자리`)));

  const tabsEl = h('div.locker-tabs', { role: 'tablist' }, ...TABS.map((entry) => h('button.tab', {
    type: 'button', role: 'tab', dataset: { tab: entry.key }, onClick: () => { tab = entry.key; play('select'); renderGrid(); },
  }, entry.name)));
  const grid = h('div.item-grid', { role: 'listbox', 'aria-label': '아이템' });
  const peakLine = h('p.locker-peak', {}, '');

  const el = h('section.locker', { 'aria-label': '보관함' },
    h('header.page-top', {},
      h('button.icon-btn', { type: 'button', 'aria-label': '로비로', onClick: () => close(), html: '<svg viewBox="0 0 24 24"><path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
      h('h1.page-title', {}, '보관함'), peakLine),
    h('div.locker-body', {},
      h('div.locker-left', {}, preview,
        h('div.locker-sel', {}, h('div.sel-head', {}, selName, selState), selSet, selDesc, charmSlots, h('div.sel-actions', {}, equipButton, replayButton))),
      h('div.locker-right', {}, tabsEl, grid)));
  host.append(el);
  gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });

  function previewEquipped() {
    if (!selected) return profile.equipped;
    if (selected.slot === 'charm') {
      const charms = equippedCharmIds(profile.equipped);
      charms[charmSlot] = selected.id;
      return { ...profile.equipped, charms, charm: charms[0] };
    }
    return { ...profile.equipped, [selected.slot]: selected.id };
  }

  function renderPreview() {
    const equipped = previewEquipped();
    applyEquipped(preview, equipped, { propsEl: previewProps });
    previewAvatar.src = cut((cosmeticById(equipped.avatar) || cosmeticById('avatar-rabbit')).portrait);
    // 자리마다 그 자리에 실제로 나오는 장난감 하나씩(기본 친구들은 푸딩 · 별 · 장미)
    previewToys.replaceChildren(...equippedCharmIds(equipped).map((id, slot) => {
      const toy = charmToyConfig(id, slot);
      return h('div.pv.pv-toy', { vars: { '--toy-size': toy.size || 1 } }, h('img', { src: cut(toy.img), alt: '' }));
    }));
  }

  function renderGrid() {
    tabsEl.querySelectorAll('.tab').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
    const items = tab === 'all'
      ? [...COSMETICS].sort((a, b) => Number(!isUnlocked(a, profile.peakPoints, passTier, profile.boxItems)) - Number(!isUnlocked(b, profile.peakPoints, passTier, profile.boxItems)) || (a.pass ? a.pass * 1000 : a.box ? 2e9 : a.threshold) - (b.pass ? b.pass * 1000 : b.box ? 2e9 : b.threshold))
      : tab === 'flower' ? COSMETICS.filter(isFlower).sort((a, b) => (a.pass ? a.pass * 1000 : a.box ? 9e9 : a.threshold) - (b.pass ? b.pass * 1000 : b.box ? 9e9 : b.threshold))
        : tab === 'box' ? COSMETICS.filter((item) => item.box).sort((a, b) => Number(!isUnlocked(a, profile.peakPoints, passTier, profile.boxItems)) - Number(!isUnlocked(b, profile.peakPoints, passTier, profile.boxItems)))
        : COSMETICS.filter((item) => item.slot === tab);
    grid.replaceChildren(...items.map((item) => {
      const locked = !isUnlocked(item, profile.peakPoints, passTier, profile.boxItems);
      const slotName = COSMETIC_SLOTS.find((slot) => slot.key === item.slot)?.name || '';
      return h(`button.item-tile${locked ? '.is-locked' : ''}${item.legendary ? '.is-legend' : ''}${item.box ? '.is-box' : item.season ? '.is-s2' : ''}`, {
        type: 'button', role: 'option', dataset: { id: item.id }, onClick: () => select(item),
      }, itemPreview(item), h('span.tile-text', {}, h('small', {}, slotName), h('b', {}, item.name), h('em.tile-state', {}, stateText(item, profile, passTier))));
    }));
    markTiles();
  }

  function markTiles() {
    const charms = equippedCharmIds(profile.equipped);
    grid.querySelectorAll('.item-tile').forEach((tile) => {
      const item = cosmeticById(tile.dataset.id);
      const on = item.slot === 'charm' ? charms.includes(item.id) : profile.equipped[item.slot] === item.id;
      tile.classList.toggle('is-on', on);
      tile.classList.toggle('is-selected', selected?.id === item.id);
      tile.setAttribute('aria-selected', String(selected?.id === item.id));
      const state = tile.querySelector('.tile-state');
      if (on) state.textContent = '장착 중';
      else state.textContent = stateText(item, profile, passTier);
    });
  }

  function refreshSelection() {
    if (!selected) return;
    const locked = !isUnlocked(selected, profile.peakPoints, passTier, profile.boxItems);
    const charms = equippedCharmIds(profile.equipped);
    const on = selected.slot === 'charm' ? charms[charmSlot] === selected.id : profile.equipped[selected.slot] === selected.id;
    selName.textContent = selected.name;
    selDesc.textContent = selected.description;
    selState.textContent = locked ? stateText(selected, profile, passTier) : on ? '장착 중' : '장착할 수 있어요';
    selState.dataset.state = locked ? 'locked' : on ? 'on' : 'ready';
    const set = cosmeticSetForItem(selected.id);
    const progress = set ? cosmeticSetProgress(set, profile.peakPoints, passTier, profile.boxItems) : null;
    selSet.textContent = set ? `${set.name} 세트 ${progress.unlocked}/${progress.total}` : '';
    selSet.hidden = !set;
    charmSlots.hidden = selected.slot !== 'charm';
    charmSlots.querySelectorAll('.slot-btn').forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === charmSlot));
      const current = cosmeticById(charms[index]);
      button.textContent = `${index + 1}번 ${current?.name || ''}`;
    });
    equipButton.disabled = locked || on;
    equipButton.textContent = locked ? '아직 잠겨 있어요' : on ? '장착 중' : selected.slot === 'charm' ? `${charmSlot + 1}번 자리에 장착` : '장착하기';
    replayButton.hidden = !['effect', 'victory', 'charm'].includes(selected.slot);
    renderPreview();
    markTiles();
  }

  function select(item) {
    selected = item;
    play('select');
    refreshSelection();
    if (['effect', 'victory'].includes(item.slot)) replay();
  }

  function replay() {
    if (!selected) return;
    const at = (() => { const rect = previewPile.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })();
    if (selected.slot === 'effect') fx.burst(lookOf('effect', selected.look), at, { sizeScale: 0.8 });
    else if (selected.slot === 'victory') {
      const shown = fx.victory({ look: lookOf('victory', selected.look), avatarEl: previewAvatar, title: '승리', sub: selected.name });
      shown.timeline.then(() => setTimeout(() => shown.finish(), 600));
    } else if (selected.slot === 'charm') {
      const toy = charmToyConfig(selected.id, charmSlot);
      const toyEl = previewToys.children[charmSlot]?.querySelector('img');
      if (toyEl) toyMotion(toyEl, toy);
      toySound(toy);
    }
  }

  function equip() {
    if (!selected || !isUnlocked(selected, profile.peakPoints, passTier, profile.boxItems)) return;
    const equipped = previewEquipped();
    profile = savePlayerProfile({ ...profile, equipped });
    passTier = tierForXp(profile.seasonXp);
    play('confirm');
    toast(`${selected.name} 장착`, { anchor: equipButton, tone: 'good' });
    refreshSelection();
    onChanged?.(profile);
  }

  function close() {
    director.reset();
    gsap.to(el, { opacity: 0, y: 20, duration: 0.2, onComplete: () => { el.remove(); onClose?.(); } });
  }

  const next = nextCosmeticUnlock(profile.peakPoints);
  peakLine.textContent = `최고 점수 ${formatNumber(profile.peakPoints)}점${next ? `, 다음 보상까지 ${formatNumber(next.remaining)}점` : ''}`;
  renderGrid();
  refreshSelection();
  return { close };
}

export { COSMETIC_SETS };
