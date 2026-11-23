// 보상 상자 — AI 대전이 끝나면 상자 셋 중 하나를 고른다.
// 내용은 판이 끝날 때 미리 정해 두고(고르기 전에는 안 보임), 고른 상자만 받는다. 고른 뒤 나머지 둘도 열어 보여 준다.
// 점수는 그 판 승리 보상(상대 별)에 비례 — 100만 점까지 이어지는 사다리를 오르는 힘(점수 펌핑).
// 상자 전용 아이템(cosmetics 의 box)은 점수로는 안 열리고 여기서만 나온다.
import { BOX_ITEMS } from './cosmetics.js';

const WIN_REWARDS = { 1: 125, 2: 180, 3: 250, 4: 340, 5: 500, 6: 700, 7: 1000, 8: 1400 }; // rating.js 와 같게(테스트로 확인)

export const BOX_RARITIES = Object.freeze([
  { key: 'common', name: '일반', weight: 52, min: 0.35, max: 0.65 },
  { key: 'rare', name: '희귀', weight: 30, min: 0.85, max: 1.3 },
  { key: 'epic', name: '영웅', weight: 13, min: 1.8, max: 2.6 },
  { key: 'legend', name: '전설', weight: 5, min: 3.6, max: 5 },
]);
export const RARITY_NAMES = Object.freeze(Object.fromEntries(BOX_RARITIES.map((rarity) => [rarity.key, rarity.name])));
// 상자 하나에 상자 전용 아이템이 들어 있을 확률(이기면 더 자주)
export const BOX_ITEM_CHANCE = Object.freeze({ win: 0.14, lose: 0.05 });
const ITEM_RARITY_WEIGHTS = { rare: 62, epic: 28, legend: 10 };

export function boxBase({ won, stars = 1, bonus = false }) {
  const reward = WIN_REWARDS[Math.min(8, Math.max(1, Math.floor(Number(stars) || 1)))];
  return Math.round(reward * (won ? 1 : 0.4) * (bonus ? 2 : 1));
}

const roundTen = (value) => Math.max(10, Math.round(value / 10) * 10);

function weighted(list, weightOf, random) {
  const total = list.reduce((sum, entry) => sum + weightOf(entry), 0);
  let cursor = random() * total;
  for (const entry of list) {
    cursor -= weightOf(entry);
    if (cursor < 0) return entry;
  }
  return list.at(-1);
}

// 상자 셋 — [{ slot, kind: 'points' | 'item', rarity, amount, itemId }]
// 아이템 상자도 amount(이미 가진 아이템이면 대신 줄 점수)를 갖는다
export function rollRewardBoxes({ won, stars = 1, bonus = false, owned = [] } = {}, random = Math.random) {
  const base = boxBase({ won, stars, bonus });
  const ownedSet = new Set(owned);
  const used = new Set();
  const chance = won ? BOX_ITEM_CHANCE.win : BOX_ITEM_CHANCE.lose;
  return [0, 1, 2].map((slot) => {
    const available = BOX_ITEMS.filter((entry) => !ownedSet.has(entry.id) && !used.has(entry.id));
    if (available.length && random() < chance) {
      const rarities = Object.entries(ITEM_RARITY_WEIGHTS).filter(([key]) => available.some((entry) => entry.boxRarity === key));
      const [rarity] = weighted(rarities, ([, weight]) => weight, random);
      const choices = available.filter((entry) => entry.boxRarity === rarity);
      const item = choices[Math.floor(random() * choices.length)];
      used.add(item.id);
      return { slot, kind: 'item', rarity: item.boxRarity === 'legend' ? 'legend' : item.boxRarity === 'epic' ? 'epic' : 'rare', itemId: item.id, amount: roundTen(base * 3) };
    }
    const rarity = weighted(BOX_RARITIES, (entry) => entry.weight, random);
    return { slot, kind: 'points', rarity: rarity.key, amount: roundTen(base * (rarity.min + (rarity.max - rarity.min) * random())), itemId: null };
  });
}
