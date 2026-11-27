// 보상 상자 — AI 대전이 끝나면 상자 셋 중 하나를 고른다.
// 내용은 판이 끝날 때 미리 정해 두고(고르기 전에는 안 보임), 고른 상자만 받는다. 고른 뒤 나머지 둘도 열어 보여 준다.
// 11-24 선생님: 「점수 스케일은 100만 점으로 하고 상자에서 주는 점수를 늘리면 되는 거잖아」 · 「2배 3배 10배 이런 것도」
//   · 「점수는 무조건 어떤 상자 골라도 나오게 하고 아이템은 랜덤(점수와 함께 받을 수도 있게)」
// 그래서 상자마다: 기본 점수(상대 난이도 단계 · 승패 · 보너스판 · 판수 보너스) × 배수(×1~×10) + 가끔 상자 전용 아이템.
// 11-25 선생님: 「상자에서 얻는 점수 상향 및 배율 나오는 확률 상향」 — 기본 몫 28% · 12% → 34% · 15%, 배수 기댓값 ×2.11 → ×2.68.
// 11-27 선생님: 「상자에서 얻는 점수 20퍼센트 정도 상향 · 배율이나 아이템이 약간 더 자주」 — 기본 점수는 승리 보상(20% 올림)을 따라 함께 오르고,
//   배수 기댓값 ×2.68 → ×2.90(×2 이상 66% → 72%), 아이템 15% · 6% → 20% · 8%.
// 기댓값은 tests/economy-sim.mjs 로 잰다.

// 상자 그림 — 셋 모두 선생님 GPT 「미스터리상자」(빨간 상자 · 금빛 장식 · 물음표, 11-25) · 열면 「미스터리상자-열림」(뚜껑이 젖혀지고 안이 빛남)
export const BOX_ART = 'chest-mystery';
export const BOX_OPEN_ART = 'chest-mystery-open';
import { BOX_ITEMS } from './cosmetics.js';
import { AI_LEVEL_COUNT, WIN_REWARDS } from './rating.js';

// 상자 기본 점수 = 그 판 승리 보상(상대 난이도 단계의)의 몇 할(이기면 34%, 져도 15%)
export const BOX_SHARE = Object.freeze({ win: 0.34, lose: 0.15 });
// 배수 — 상자 색(등급)이 배수를 알려 준다. 기댓값 ×2.90(×2 이상 72% · ×5 이상 21% · ×10 7%)
export const BOX_MULTIPLIERS = Object.freeze([
  { x: 1, weight: 28, rarity: 'common' },
  { x: 2, weight: 31, rarity: 'rare' },
  { x: 3, weight: 20, rarity: 'epic' },
  { x: 5, weight: 14, rarity: 'legend' },
  { x: 10, weight: 7, rarity: 'mythic' },
]);
export const RARITY_ORDER = Object.freeze(['common', 'rare', 'epic', 'legend', 'mythic']);
export const RARITY_NAMES = Object.freeze({ common: '일반', rare: '희귀', epic: '영웅', legend: '전설', mythic: '신화' });
// 상자 하나에 상자 전용 아이템이 함께 들어 있을 확률(점수는 늘 있음)
export const BOX_ITEM_CHANCE = Object.freeze({ win: 0.2, lose: 0.08 });
const ITEM_RARITY_WEIGHTS = { rare: 62, epic: 28, legend: 10 };
// 판수 보너스 — 100판마다 +0.1배, 1,000판이면 ×2(오래 한 사람일수록 상자가 커진다)
export const VETERAN_STEP = 100;
export const VETERAN_MAX = 2;

export function veteranBonus(games = 0) {
  const played = Math.max(0, Math.floor(Number(games) || 0));
  return Math.min(VETERAN_MAX, 1 + Math.floor(played / VETERAN_STEP) * 0.1);
}

export function boxBase({ won, level = 1, bonus = false, games = 0 }) {
  const reward = WIN_REWARDS[Math.min(AI_LEVEL_COUNT, Math.max(1, Math.floor(Number(level) || 1)))];
  return reward * (won ? BOX_SHARE.win : BOX_SHARE.lose) * (bonus ? 2 : 1) * veteranBonus(games);
}

const roundTen = (value) => Math.max(10, Math.round(value / 10) * 10);
const higher = (a, b) => (RARITY_ORDER.indexOf(a) >= RARITY_ORDER.indexOf(b) ? a : b);

function weighted(list, weightOf, random) {
  const total = list.reduce((sum, entry) => sum + weightOf(entry), 0);
  let cursor = random() * total;
  for (const entry of list) {
    cursor -= weightOf(entry);
    if (cursor < 0) return entry;
  }
  return list.at(-1);
}

// 상자 셋 — [{ slot, base, multiplier, amount, rarity, itemId }]
// amount = base × multiplier(늘 있음). itemId 는 가끔(이미 가진 것 · 같은 판의 다른 상자와 겹치는 것은 빼고)
export function rollRewardBoxes({ won, level = 1, bonus = false, games = 0, owned = [] } = {}, random = Math.random) {
  const base = boxBase({ won, level, bonus, games });
  const ownedSet = new Set(owned);
  const used = new Set();
  const chance = won ? BOX_ITEM_CHANCE.win : BOX_ITEM_CHANCE.lose;
  return [0, 1, 2].map((slot) => {
    const boxBaseAmount = roundTen(base * (0.85 + random() * 0.3));
    const multiplier = weighted(BOX_MULTIPLIERS, (entry) => entry.weight, random);
    let itemId = null;
    let rarity = multiplier.rarity;
    const available = BOX_ITEMS.filter((entry) => !ownedSet.has(entry.id) && !used.has(entry.id));
    if (available.length && random() < chance) {
      const rarities = Object.entries(ITEM_RARITY_WEIGHTS).filter(([key]) => available.some((entry) => entry.boxRarity === key));
      const [itemRarity] = weighted(rarities, ([, weight]) => weight, random);
      const choices = available.filter((entry) => entry.boxRarity === itemRarity);
      const item = choices[Math.floor(random() * choices.length)];
      used.add(item.id);
      itemId = item.id;
      rarity = higher(rarity, itemRarity);
    }
    return { slot, base: boxBaseAmount, multiplier: multiplier.x, amount: boxBaseAmount * multiplier.x, rarity, itemId };
  });
}

// 한 판 상자 하나의 점수 기댓값(고르기는 순수한 선택이라 셋 중 아무거나의 기댓값과 같다)
export function expectedBoxPoints({ won, level, bonus = false, games = 0 }) {
  const meanMultiplier = BOX_MULTIPLIERS.reduce((sum, entry) => sum + entry.x * entry.weight, 0) / BOX_MULTIPLIERS.reduce((sum, entry) => sum + entry.weight, 0);
  return boxBase({ won, level, bonus, games }) * meanMultiplier;
}
