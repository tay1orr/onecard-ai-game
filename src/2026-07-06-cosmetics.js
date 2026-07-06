export const COSMETIC_SLOTS = Object.freeze([
  { key: 'table', name: '테이블' },
  { key: 'cardBack', name: '카드 뒷면' },
  { key: 'cardFace', name: '카드 앞면' },
  { key: 'effect', name: '카드 효과' },
  { key: 'pile', name: '카드 더미' },
  { key: 'charm', name: '장난감·장식' },
  { key: 'victory', name: '승리 연출' },
]);

export const COSMETICS = Object.freeze([
  { id: 'table-midnight', slot: 'table', threshold: 0, name: '미드나잇 테이블', icon: '◆', description: '차분한 기본 게임 테이블', cssClass: 'skin-table-midnight' },
  { id: 'back-classic', slot: 'cardBack', threshold: 0, name: '클래식 ONE!', icon: 'ONE!', description: '선명한 기본 카드 뒷면', cssClass: 'skin-back-classic' },
  { id: 'face-classic', slot: 'cardFace', threshold: 0, name: '클래식 카드', icon: 'A♠', description: '가독성이 좋은 기본 카드 앞면', cssClass: 'skin-face-classic' },
  { id: 'effect-classic', slot: 'effect', threshold: 0, name: '클래식 스파크', icon: '✦', description: '깔끔한 기본 카드 효과', cssClass: 'skin-effect-classic' },
  { id: 'pile-classic', slot: 'pile', threshold: 0, name: '클래식 더미', icon: '▣', description: '기본 카드 더미 테두리', cssClass: 'skin-pile-classic' },
  { id: 'charm-classic', slot: 'charm', threshold: 0, name: '기본 친구들', icon: '•ᴗ•', description: '젤리·별·장미 기본 장식', cssClass: 'skin-charm-classic' },
  { id: 'victory-classic', slot: 'victory', threshold: 0, name: '클래식 피날레', icon: 'WIN', description: '기본 승리 결과 연출', cssClass: 'skin-victory-classic' },

  { id: 'back-strawberry-milk', slot: 'cardBack', threshold: 300, name: '딸기우유', icon: '🍓', description: '우유빛 분홍 체크 카드', cssClass: 'skin-back-strawberry' },
  { id: 'effect-cloud-pop', slot: 'effect', threshold: 700, name: '구름퐁퐁', icon: '☁', description: '포근한 구름과 별가루 효과', cssClass: 'skin-effect-cloud' },
  { id: 'table-peach-soda', slot: 'table', threshold: 1200, name: '복숭아 소다', icon: '🍑', description: '톡톡 튀는 복숭아빛 테이블', cssClass: 'skin-table-peach' },
  { id: 'face-bunny-mail', slot: 'cardFace', threshold: 1800, name: '토끼 우편', icon: '🐰', description: '모서리에 토끼 편지가 숨어 있어요', cssClass: 'skin-face-bunny' },
  { id: 'pile-moon-jelly', slot: 'pile', threshold: 2600, name: '달빛 젤리', icon: '🌙', description: '말랑하게 빛나는 카드 더미', cssClass: 'skin-pile-moon' },
  { id: 'victory-cotton-candy', slot: 'victory', threshold: 3500, name: '솜사탕 폭죽', icon: '🎉', description: '분홍빛 솜사탕 승리 피날레', cssClass: 'skin-victory-cotton' },
  { id: 'table-dessert-cafe', slot: 'table', threshold: 4200, name: '딸기 디저트 카페', icon: '🍰', description: '체크 식탁보와 크림 접시가 놓인 달콤한 카페', cssClass: 'skin-table-cafe', concept: '디저트 카페' },
  { id: 'back-star-candy', slot: 'cardBack', threshold: 4800, name: '별사탕', icon: '⭐', description: '작은 별사탕이 반짝이는 카드', cssClass: 'skin-back-star' },
  { id: 'face-neon-arcade', slot: 'cardFace', threshold: 5200, name: '네온 아케이드', icon: '👾', description: '검은 화면 위에 픽셀 숫자가 빛나는 게임 카드', cssClass: 'skin-face-neon', concept: '네온 아케이드' },
  { id: 'table-night-picnic', slot: 'table', threshold: 6200, name: '별빛 피크닉', icon: '🌌', description: '잔잔한 밤하늘 소풍 테이블', cssClass: 'skin-table-night' },
  { id: 'charm-cafe-bear', slot: 'charm', threshold: 7200, name: '푸딩곰 점원', icon: '🧸', description: '젤리 친구가 캐러멜 푸딩곰으로 변신해요', cssClass: 'skin-charm-cafe', concept: '디저트 카페' },
  { id: 'effect-aurora', slot: 'effect', threshold: 8000, name: '오로라 리본', icon: '〰', description: '카드를 따라 흐르는 오로라', cssClass: 'skin-effect-aurora' },
  { id: 'table-deep-aquarium', slot: 'table', threshold: 9000, name: '심해 수족관', icon: '🐠', description: '물결과 산호 그림자가 흐르는 푸른 심해 테이블', cssClass: 'skin-table-aquarium', concept: '심해 수족관' },
  { id: 'face-rose-tea', slot: 'cardFace', threshold: 10000, name: '장미 티파티', icon: '🌹', description: '크림 종이와 장미 문양 카드', cssClass: 'skin-face-rose' },
  { id: 'effect-pixel-combo', slot: 'effect', threshold: 11000, name: '픽셀 콤보!', icon: '⚡', description: '8비트 블록과 네온 스캔라인이 터지는 효과', cssClass: 'skin-effect-pixel', concept: '네온 아케이드' },
  { id: 'pile-cream-ribbon', slot: 'pile', threshold: 12000, name: '크림 리본', icon: '🎀', description: '리본으로 묶은 듯한 더미', cssClass: 'skin-pile-ribbon' },
  { id: 'face-dessert-cafe', slot: 'cardFace', threshold: 13000, name: '딸기 케이크 카드', icon: '🍓', description: '생크림 테두리와 딸기 도장이 찍힌 달콤한 앞면', cssClass: 'skin-face-cafe', concept: '디저트 카페' },
  { id: 'charm-star-cat', slot: 'charm', threshold: 14500, name: '별빛 고양이', icon: '🐱', description: '별 팽이에 고양이 친구가 찾아와요', cssClass: 'skin-charm-cat' },
  { id: 'pile-shell-treasure', slot: 'pile', threshold: 15500, name: '진주 조개 더미', icon: '🫧', description: '진주빛 조개와 물방울이 감싸는 카드 더미', cssClass: 'skin-pile-shell', concept: '심해 수족관' },
  { id: 'table-cherry-picnic', slot: 'table', threshold: 17000, name: '벚꽃 소풍', icon: '🌸', description: '꽃잎이 흩날리는 봄 테이블', cssClass: 'skin-table-cherry' },
  { id: 'charm-ufo-pet', slot: 'charm', threshold: 18000, name: 'UFO 픽셀펫', icon: '🛸', description: '별 장난감이 빙글도는 네온 UFO로 변신해요', cssClass: 'skin-charm-ufo', concept: '네온 아케이드' },
  { id: 'back-space-whale', slot: 'cardBack', threshold: 18500, name: '우주 고래', icon: '🐋', description: '은하를 헤엄치는 작은 고래 카드', cssClass: 'skin-back-whale' },
  { id: 'victory-high-score', slot: 'victory', threshold: 19500, name: '하이 스코어 피날레', icon: '🏆', description: '네온 전광판과 픽셀 폭죽으로 마무리하는 승리 연출', cssClass: 'skin-victory-arcade', concept: '네온 아케이드' },

  { id: 'table-dream-kingdom', slot: 'table', threshold: 20000, name: '꿈빛 왕국 테이블', icon: '🏰', description: '전설 등급 꿈빛 왕국 테이블', cssClass: 'skin-table-dream', legendary: true },
  { id: 'back-dream-kingdom', slot: 'cardBack', threshold: 20000, name: '꿈빛 왕국 카드', icon: '👑', description: '왕관과 보석 카드 뒷면', cssClass: 'skin-back-dream', legendary: true },
  { id: 'face-dream-kingdom', slot: 'cardFace', threshold: 20000, name: '꿈빛 왕국 카드 앞면', icon: '♕', description: '금빛 테두리의 전설 카드', cssClass: 'skin-face-dream', legendary: true },
  { id: 'effect-dream-kingdom', slot: 'effect', threshold: 20000, name: '꿈빛 마법', icon: '✨', description: '별과 보석이 터지는 카드 효과', cssClass: 'skin-effect-dream', legendary: true },
  { id: 'pile-dream-kingdom', slot: 'pile', threshold: 20000, name: '꿈빛 보물함', icon: '💎', description: '보석 상자 카드 더미', cssClass: 'skin-pile-dream', legendary: true },
  { id: 'charm-dream-kingdom', slot: 'charm', threshold: 20000, name: '꿈빛 친구들', icon: '🦄', description: '작은 유니콘 장난감 장식', cssClass: 'skin-charm-dream', legendary: true },
  { id: 'victory-dream-kingdom', slot: 'victory', threshold: 20000, name: '꿈빛 대관식', icon: '👑', description: '전설 등급 왕관 승리 연출', cssClass: 'skin-victory-dream', legendary: true },
]);

export const DEFAULT_EQUIPPED = Object.freeze(Object.fromEntries(
  COSMETIC_SLOTS.map(({ key }) => [key, COSMETICS.find((item) => item.slot === key && item.threshold === 0).id]),
));

export function cosmeticById(id) {
  return COSMETICS.find((item) => item.id === id) || null;
}

export function cosmeticsForSlot(slot) {
  return COSMETICS.filter((item) => item.slot === slot);
}

export function unlockedCosmetics(peakPoints) {
  const peak = Math.max(0, Number(peakPoints) || 0);
  return COSMETICS.filter((item) => item.threshold <= peak);
}

export function newlyUnlockedCosmetics(previousPeak, nextPeak) {
  const before = Math.max(0, Number(previousPeak) || 0);
  const after = Math.max(before, Number(nextPeak) || 0);
  return COSMETICS.filter((item) => item.threshold > before && item.threshold <= after);
}

export function nextCosmeticUnlock(peakPoints) {
  const peak = Math.max(0, Number(peakPoints) || 0);
  const threshold = COSMETICS.reduce((next, item) => item.threshold > peak && item.threshold < next ? item.threshold : next, Number.POSITIVE_INFINITY);
  if (!Number.isFinite(threshold)) return null;
  return {
    threshold,
    remaining: threshold - peak,
    items: COSMETICS.filter((item) => item.threshold === threshold),
  };
}

export function normalizeEquipped(equipped, peakPoints) {
  const unlocked = new Set(unlockedCosmetics(peakPoints).map((item) => item.id));
  return Object.fromEntries(COSMETIC_SLOTS.map(({ key }) => {
    const candidate = equipped?.[key];
    const item = cosmeticById(candidate);
    return [key, item?.slot === key && unlocked.has(candidate) ? candidate : DEFAULT_EQUIPPED[key]];
  }));
}

export function equippedClassNames(equipped) {
  return COSMETIC_SLOTS
    .map(({ key }) => cosmeticById(equipped?.[key])?.cssClass)
    .filter(Boolean);
}
