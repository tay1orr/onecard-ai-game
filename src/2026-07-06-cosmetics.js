export const COSMETIC_SLOTS = Object.freeze([
  { key: 'table', name: '테이블' },
  { key: 'cardBack', name: '카드 뒷면' },
  { key: 'cardFace', name: '카드 앞면' },
  { key: 'effect', name: '카드 효과' },
  { key: 'charm', name: '장난감·장식' },
  { key: 'victory', name: '승리 연출' },
]);

export const COSMETICS = Object.freeze([
  { id: 'table-midnight', slot: 'table', threshold: 0, name: '미드나잇 테이블', icon: '◆', description: '차분한 기본 게임 테이블', cssClass: 'skin-table-midnight' },
  { id: 'back-classic', slot: 'cardBack', threshold: 0, name: '클래식 ONE!', icon: 'ONE!', description: '선명한 기본 카드 뒷면', cssClass: 'skin-back-classic' },
  { id: 'face-classic', slot: 'cardFace', threshold: 0, name: '클래식 카드', icon: 'A♠', description: '가독성이 좋은 기본 카드 앞면', cssClass: 'skin-face-classic' },
  { id: 'effect-classic', slot: 'effect', threshold: 0, name: '클래식 스파크', icon: '✦', description: '깔끔한 기본 카드 효과', cssClass: 'skin-effect-classic' },
  { id: 'charm-classic', slot: 'charm', threshold: 0, name: '기본 친구들', icon: '•ᴗ•', description: '젤리·별·장미 기본 장식', cssClass: 'skin-charm-classic' },
  { id: 'victory-classic', slot: 'victory', threshold: 0, name: '클래식 피날레', icon: 'WIN', description: '기본 승리 결과 연출', cssClass: 'skin-victory-classic' },

  { id: 'back-strawberry-milk', slot: 'cardBack', threshold: 300, name: '딸기우유', icon: '🍓', description: '우유빛 분홍 체크 카드', cssClass: 'skin-back-strawberry' },
  { id: 'effect-cloud-pop', slot: 'effect', threshold: 700, name: '구름퐁퐁', icon: '☁', description: '포근한 구름과 별가루 효과', cssClass: 'skin-effect-cloud' },
  { id: 'table-peach-soda', slot: 'table', threshold: 1200, name: '복숭아 소다', icon: '🍑', description: '톡톡 튀는 복숭아빛 테이블', cssClass: 'skin-table-peach' },
  { id: 'face-bunny-mail', slot: 'cardFace', threshold: 1800, name: '토끼 우편', icon: '🐰', description: '모서리에 토끼 편지가 숨어 있어요', cssClass: 'skin-face-bunny' },
  { id: 'back-antique-atlas', slot: 'cardBack', threshold: 2300, name: '고대 천체 지도', icon: '✧', description: '별자리 선과 낡은 지도 질감의 앤틱 뒷면', cssClass: 'skin-back-atlas', concept: '고대 천문대' },
  { id: 'face-antique-manuscript', slot: 'cardFace', threshold: 3200, name: '왕립 필사본', icon: 'A', description: '양피지와 잉크 번짐, 세밀한 장식 테두리', cssClass: 'skin-face-manuscript', concept: '앤틱 필사본' },
  { id: 'victory-cotton-candy', slot: 'victory', threshold: 3500, name: '솜사탕 폭죽', icon: '🎉', description: '분홍빛 솜사탕 승리 피날레', cssClass: 'skin-victory-cotton' },
  { id: 'table-dessert-cafe', slot: 'table', threshold: 4200, name: '딸기 디저트 카페', icon: '🍰', description: '체크 식탁보와 크림 접시가 놓인 달콤한 카페', cssClass: 'skin-table-cafe', concept: '디저트 카페' },
  { id: 'victory-dual-fireworks', slot: 'victory', threshold: 4500, name: '트윈 불꽃축제', icon: '✹', description: '화면 양쪽에서 연속으로 솟아 중앙에서 터지는 폭죽', cssClass: 'skin-victory-fireworks', concept: '불꽃축제' },
  { id: 'back-star-candy', slot: 'cardBack', threshold: 4800, name: '별사탕', icon: '⭐', description: '작은 별사탕이 반짝이는 카드', cssClass: 'skin-back-star' },
  { id: 'face-neon-arcade', slot: 'cardFace', threshold: 5200, name: '네온 아케이드', icon: '👾', description: '검은 화면 위에 픽셀 숫자가 빛나는 게임 카드', cssClass: 'skin-face-neon', concept: '네온 아케이드' },
  { id: 'back-bauhaus', slot: 'cardBack', threshold: 5600, name: '바우하우스 1923', icon: '●▲', description: '원색 원과 직선이 교차하는 현대 조형 뒷면', cssClass: 'skin-back-bauhaus', concept: '바우하우스' },
  { id: 'table-night-picnic', slot: 'table', threshold: 6200, name: '별빛 피크닉', icon: '🌌', description: '잔잔한 밤하늘 소풍 테이블', cssClass: 'skin-table-night' },
  { id: 'face-art-deco', slot: 'cardFace', threshold: 6700, name: '블랙 골드 데코', icon: 'A', description: '검정 바탕과 금빛 대칭선으로 만든 아르데코 카드', cssClass: 'skin-face-deco', concept: '아르데코' },
  { id: 'charm-cafe-bear', slot: 'charm', threshold: 7200, name: '푸딩곰 점원', icon: '🧸', description: '젤리 친구가 캐러멜 푸딩곰으로 변신해요', cssClass: 'skin-charm-cafe', concept: '디저트 카페' },
  { id: 'effect-aurora', slot: 'effect', threshold: 8000, name: '오로라 리본', icon: '〰', description: '카드를 따라 흐르는 오로라', cssClass: 'skin-effect-aurora' },
  { id: 'victory-confetti-cannons', slot: 'victory', threshold: 8500, name: '더블 색종이 대포', icon: '彡', description: '좌우 대포에서 리본과 색종이가 화면을 가득 채워요', cssClass: 'skin-victory-confetti', concept: '파티 캐넌' },
  { id: 'table-deep-aquarium', slot: 'table', threshold: 9000, name: '심해 수족관', icon: '🐠', description: '물결과 산호 그림자가 흐르는 푸른 심해 테이블', cssClass: 'skin-table-aquarium', concept: '심해 수족관' },
  { id: 'face-stone-tablet', slot: 'cardFace', threshold: 9200, name: '태양신 석판', icon: '◇', description: '깎인 모서리와 룬 문양이 새겨진 고대 석판 카드', cssClass: 'skin-face-stone', concept: '고대 신전' },
  { id: 'back-jade-rune', slot: 'cardBack', threshold: 9600, name: '옥빛 봉인문', icon: '◇', description: '비취 결정과 고대 봉인선이 빛나는 뒷면', cssClass: 'skin-back-jade', concept: '고대 신전' },
  { id: 'table-rose-conservatory', slot: 'table', threshold: 9800, name: '장미 온실', icon: '❦', description: '유리 온실과 금빛 격자 사이로 장미 덩굴이 자라는 테이블', cssClass: 'skin-table-rose', concept: '장미 온실' },
  { id: 'face-rose-tea', slot: 'cardFace', threshold: 10000, name: '장미 티파티', icon: '🌹', description: '카드 가장자리를 입체 장미와 덩굴이 완전히 휘감은 앞면', cssClass: 'skin-face-rose', concept: '장미 온실' },
  { id: 'back-rose-arbor', slot: 'cardBack', threshold: 10300, name: '비밀 장미 아치', icon: '❧', description: '대칭 덩굴과 붉은 장미 봉인이 새겨진 정원 아치 뒷면', cssClass: 'skin-back-rose', concept: '장미 온실' },
  { id: 'effect-rose-petal-storm', slot: 'effect', threshold: 10600, name: '장미 꽃잎 폭풍', icon: '❀', description: '카드를 낼 때 꽃잎과 금빛 잎사귀가 크게 소용돌이쳐요', cssClass: 'skin-effect-rose', concept: '장미 온실' },
  { id: 'victory-rose-grand-bloom', slot: 'victory', threshold: 10900, name: '그랜드 로즈 블룸', icon: '🌹', description: '좌우 덩굴이 자라 중앙의 거대한 장미와 꽃잎 폭죽으로 완성돼요', cssClass: 'skin-victory-rose', concept: '장미 온실' },
  { id: 'effect-pixel-combo', slot: 'effect', threshold: 11000, name: '픽셀 콤보!', icon: '⚡', description: '8비트 블록과 네온 스캔라인이 터지는 효과', cssClass: 'skin-effect-pixel', concept: '네온 아케이드' },
  { id: 'face-glass-modern', slot: 'cardFace', threshold: 11800, name: '모던 글라스', icon: 'A', description: '반투명 유리층과 얇은 빛 테두리의 현대 카드', cssClass: 'skin-face-glass', concept: '모던 스튜디오' },
  { id: 'victory-celestial-burst', slot: 'victory', threshold: 12500, name: '초신성 피날레', icon: '✦', description: '중앙의 별이 커진 뒤 수십 개의 별빛으로 폭발해요', cssClass: 'skin-victory-celestial', concept: '우주 극장' },
  { id: 'face-dessert-cafe', slot: 'cardFace', threshold: 13000, name: '딸기 케이크 카드', icon: '🍓', description: '생크림 테두리와 딸기 도장이 찍힌 달콤한 앞면', cssClass: 'skin-face-cafe', concept: '디저트 카페' },
  { id: 'back-brass-orbit', slot: 'cardBack', threshold: 13800, name: '황동 궤도장치', icon: '⚙', description: '회전축과 황동 톱니가 맞물린 기계식 뒷면', cssClass: 'skin-back-brass', concept: '기계 천문대' },
  { id: 'charm-star-cat', slot: 'charm', threshold: 14500, name: '별빛 고양이', icon: '🐱', description: '별 팽이에 고양이 친구가 찾아와요', cssClass: 'skin-charm-cat' },
  { id: 'face-blueprint', slot: 'cardFace', threshold: 14800, name: '청사진 설계도', icon: 'A', description: '정밀 격자와 치수선으로 구성한 엔지니어 카드', cssClass: 'skin-face-blueprint', concept: '설계 연구소' },
  { id: 'victory-neon-concert', slot: 'victory', threshold: 16000, name: '네온 콘서트', icon: 'LASER', description: '양쪽 레이저와 전광판 픽셀 폭죽이 교차해요', cssClass: 'skin-victory-neon', concept: '네온 스테이지' },
  { id: 'table-cherry-picnic', slot: 'table', threshold: 17000, name: '벚꽃 소풍', icon: '🌸', description: '꽃잎이 흩날리는 봄 테이블', cssClass: 'skin-table-cherry' },
  { id: 'back-monochrome-wave', slot: 'cardBack', threshold: 17600, name: '모노크롬 파동', icon: '≋', description: '검정과 은빛 곡선이 끝없이 이어지는 미니멀 뒷면', cssClass: 'skin-back-wave', concept: '모노크롬' },
  { id: 'charm-ufo-pet', slot: 'charm', threshold: 18000, name: 'UFO 픽셀펫', icon: '🛸', description: '별 장난감이 빙글도는 네온 UFO로 변신해요', cssClass: 'skin-charm-ufo', concept: '네온 아케이드' },
  { id: 'face-ink-landscape', slot: 'cardFace', threshold: 18200, name: '수묵 산수', icon: '山', description: '먹의 농담과 넓은 여백으로 완성한 동양화 카드', cssClass: 'skin-face-ink', concept: '수묵 화원' },
  { id: 'back-space-whale', slot: 'cardBack', threshold: 18500, name: '우주 고래', icon: '🐋', description: '은하를 헤엄치는 작은 고래 카드', cssClass: 'skin-back-whale' },
  { id: 'victory-cherry-finale', slot: 'victory', threshold: 18800, name: '천앵화 피날레', icon: '花', description: '화면 양쪽에서 거대한 꽃잎 소용돌이가 만나요', cssClass: 'skin-victory-cherry', concept: '벚꽃 극장' },
  { id: 'back-antique-library', slot: 'cardBack', threshold: 19200, name: '금서고 문장', icon: 'Ⅱ', description: '가죽 표지와 금박 문장으로 만든 고서 뒷면', cssClass: 'skin-back-library', concept: '왕립 도서관' },
  { id: 'face-royal-tarot', slot: 'cardFace', threshold: 19300, name: '왕실 타로', icon: '♜', description: '긴 비례와 금박 프레임을 가진 왕실 카드', cssClass: 'skin-face-tarot', concept: '왕실 타로' },
  { id: 'victory-high-score', slot: 'victory', threshold: 19500, name: '하이 스코어 피날레', icon: '🏆', description: '네온 전광판과 픽셀 폭죽으로 마무리하는 승리 연출', cssClass: 'skin-victory-arcade', concept: '네온 아케이드' },

  { id: 'table-dream-kingdom', slot: 'table', threshold: 20000, name: '꿈빛 왕국 테이블', icon: '🏰', description: '전설 등급 꿈빛 왕국 테이블', cssClass: 'skin-table-dream', legendary: true },
  { id: 'back-dream-kingdom', slot: 'cardBack', threshold: 20000, name: '꿈빛 왕국 카드', icon: '👑', description: '왕관과 보석 카드 뒷면', cssClass: 'skin-back-dream', legendary: true },
  { id: 'face-dream-kingdom', slot: 'cardFace', threshold: 20000, name: '꿈빛 왕국 카드 앞면', icon: '♕', description: '금빛 테두리의 전설 카드', cssClass: 'skin-face-dream', legendary: true },
  { id: 'effect-dream-kingdom', slot: 'effect', threshold: 20000, name: '꿈빛 마법', icon: '✨', description: '별과 보석이 터지는 카드 효과', cssClass: 'skin-effect-dream', legendary: true },
  { id: 'charm-dream-kingdom', slot: 'charm', threshold: 20000, name: '꿈빛 친구들', icon: '🦄', description: '작은 유니콘 장난감 장식', cssClass: 'skin-charm-dream', legendary: true },
  { id: 'victory-dream-kingdom', slot: 'victory', threshold: 20000, name: '꿈빛 대관식', icon: '👑', description: '전설 등급 왕관 승리 연출', cssClass: 'skin-victory-dream', legendary: true },
]);

export const COSMETIC_SETS = Object.freeze([
  { id: 'rose-conservatory', name: '장미 온실 세트', icon: '🌹', itemIds: ['table-rose-conservatory', 'face-rose-tea', 'back-rose-arbor', 'effect-rose-petal-storm', 'victory-rose-grand-bloom'] },
  { id: 'dessert-cafe', name: '딸기 디저트 카페 세트', icon: '🍰', itemIds: ['table-dessert-cafe', 'charm-cafe-bear', 'face-dessert-cafe'] },
  { id: 'ancient-temple', name: '고대 신전 세트', icon: '◇', itemIds: ['face-stone-tablet', 'back-jade-rune'] },
  { id: 'neon-arcade', name: '네온 아케이드 세트', icon: '👾', itemIds: ['face-neon-arcade', 'effect-pixel-combo', 'charm-ufo-pet', 'victory-high-score'] },
  { id: 'dream-kingdom', name: '꿈빛 왕국 세트', icon: '👑', itemIds: ['table-dream-kingdom', 'back-dream-kingdom', 'face-dream-kingdom', 'effect-dream-kingdom', 'charm-dream-kingdom', 'victory-dream-kingdom'] },
]);

export const DEFAULT_EQUIPPED = Object.freeze(Object.fromEntries(
  COSMETIC_SLOTS.map(({ key }) => [key, COSMETICS.find((item) => item.slot === key && item.threshold === 0).id]),
));

export function cosmeticById(id) {
  return COSMETICS.find((item) => item.id === id) || null;
}

export function cosmeticSetForItem(itemId) {
  return COSMETIC_SETS.find((set) => set.itemIds.includes(itemId)) || null;
}

export function cosmeticSetProgress(set, peakPoints) {
  const itemIds = set?.itemIds || [];
  const unlocked = itemIds.filter((id) => (cosmeticById(id)?.threshold ?? Number.POSITIVE_INFINITY) <= Math.max(0, Number(peakPoints) || 0)).length;
  return { unlocked, total: itemIds.length };
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
