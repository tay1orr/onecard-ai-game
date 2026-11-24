// 시즌 2 첫 방문 선물 — 들어오자마자 최고 점수로 이미 열린 시즌 2 새 아이템을 한 번만 보여 준다(30만 점대 플레이어는 수십 개가 한꺼번에 열린다)
// 그 뒤에 판을 하며 열리는 것은 결과 화면이 보여 준다.
import { h, formatNumber } from './dom.js';
import { COSMETICS, COSMETIC_SLOTS, FIRST_GAME_GIFT, isUnlocked } from '../core/cosmetics.js';
import { itemPreview } from './item-preview.js';
import { openModal } from './modal.js';

const SHOWN_KEY = 'onecard-s2-gift-shown';

function alreadyShown() {
  try { return Boolean(localStorage.getItem(SHOWN_KEY)); } catch { return true; }
}

function markShown() {
  try { localStorage.setItem(SHOWN_KEY, '1'); } catch { /* 저장이 막히면 다음에 한 번 더 보일 뿐 */ }
}

// 점수로 열린 시즌 2 새 아이템(시즌 패스 · 상자 전용은 빼고)
export function seasonGiftItems(profile) {
  return COSMETICS.filter((item) => item.season === 's2' && !item.pass && !item.box && item.threshold > 0 && isUnlocked(item, profile.peakPoints));
}

export function showSeasonGift(profile, { onOpenCollection } = {}) {
  if (alreadyShown()) return null;
  markShown();
  const items = seasonGiftItems(profile);
  if (!items.length) return null;
  const roses = items.filter((item) => (item.tags || []).some((tag) => tag === 'rose' || tag === 'flower')).length;
  const slotName = (slot) => COSMETIC_SLOTS.find((entry) => entry.key === slot)?.name || '';
  const shown = [...items].sort((a, b) => b.threshold - a.threshold).slice(0, 12);
  const body = h('div.gift', {},
    h('p.modal-text', {}, `최고 점수 ${formatNumber(profile.peakPoints)}점으로 시즌 2 새 아이템 ${items.length}개가 열렸어요.`),
    roses ? h('p.modal-text.gift-sub', {}, `그중 ${roses}개는 장미와 꽃이에요. 보관함의 「장미와 꽃」에서 모아 볼 수 있어요.`) : null,
    FIRST_GAME_GIFT.some((item) => !(profile.boxItems || []).includes(item.id)) ? h('p.modal-text.gift-sub', {}, '시즌 2 첫 판을 마치면 크리스마스 세트를 드려요.') : null,
    h('ul.gift-grid', {}, ...shown.map((item) => h('li.gift-item', {}, itemPreview(item), h('small', {}, slotName(item.slot)), h('b', {}, item.name)))),
    items.length > shown.length ? h('p.gift-more', {}, `이 밖에 ${items.length - shown.length}개 더`) : null);
  return openModal({
    title: '시즌 2 선물',
    body,
    className: 'is-gift',
    actions: [
      { label: '나중에', kind: 'ghost', onClick: (modal) => modal.close() },
      { label: '보관함 열기', kind: 'primary', onClick: (modal) => { modal.close(); onOpenCollection?.(); } },
    ],
  });
}
