// 상위 AI(6~8성)가 판을 읽는 법 — 사람이 그 자리에 앉아 알 수 있는 것만 쓴다
// 쓰는 것: 내 손패 · 버린 더미와 낸 카드 기록(공개) · 상대 손패 장 수 · 덱 장 수 · 공격/무늬 상태
// 쓰지 않는 것: 상대 손패의 카드 · 덱 순서 · 엔진 난수
import { SUITS, RANKS } from './game-engine.js';

// 카드 번호: 무늬 × 13 + 숫자 칸(A=0 … K=12), 조커는 52 · 53
export const JOKER = 13;
export const R_A = 0;
export const R_2 = 1;
export const R_7 = 6;
export const R_J = 10;
export const SUIT_OF = new Int8Array(54);
export const RANK_OF = new Int8Array(54);
// 카드마다 비트 하나씩: 무늬(0~3) | 숫자(4~16) | 조커(17)
// "이 상태에서 낼 수 있는 카드"도 같은 비트 모양(playMask)이라 AND 한 번으로 판정한다
export const BITS = new Int32Array(54);
export const suitBit = (suit) => 1 << suit;
export const rankBit = (rank) => 1 << (4 + rank);
export const JOKER_BIT = rankBit(JOKER);
export const ALL_BITS = (1 << 18) - 1;
export const DEFENCE_BITS = rankBit(R_A) | rankBit(R_2) | JOKER_BIT;

for (let code = 0; code < 54; code += 1) {
  SUIT_OF[code] = code < 52 ? Math.floor(code / 13) : 4;
  RANK_OF[code] = code < 52 ? code % 13 : JOKER;
  BITS[code] = (code < 52 ? suitBit(SUIT_OF[code]) : 0) | rankBit(RANK_OF[code]);
}

export function attackValue(code) {
  const rank = RANK_OF[code];
  return rank === R_2 ? 2 : rank === R_A ? 3 : rank === JOKER ? 5 : 0;
}

// 엔진 isPlayable 과 같은 규칙을 비트로: (BITS[카드] & playMask) !== 0 이면 낼 수 있다
export function playMask(top, req, atk, free) {
  const rank = RANK_OF[top];
  if (atk > 0) return rank === JOKER ? JOKER_BIT : DEFENCE_BITS;
  if (free) return ALL_BITS;
  const active = req >= 0 ? req : SUIT_OF[top];
  let mask = JOKER_BIT | (active < 4 ? suitBit(active) : 0);
  if (rank === R_7) mask |= rankBit(R_7);
  if (req < 0) mask |= rankBit(rank);
  return mask;
}

export function popBits(value) {
  let count = 0;
  for (let rest = value; rest; rest &= rest - 1) count += 1;
  return count;
}

export function suitIndex(suit) {
  const index = SUITS.indexOf(suit);
  return index < 0 ? -1 : index;
}

function codeOf(card) {
  if (card.rank === 'JOKER') return card.id === 'joker-2' ? 53 : 52;
  return SUITS.indexOf(card.suit) * 13 + RANKS.indexOf(card.rank);
}

// 판 읽기: 내 카드 · 공개 더미 · 남은 모르는 카드 · 상대 손패 자리마다 "없다고 본 카드" 비트
export function readTable(game, me = 1) {
  const opp = 1 - me;
  const known = new Uint8Array(54);
  const take = (card) => {
    let code = codeOf(card);
    if (code >= 52 && known[code]) code = 105 - code; // 조커 두 장은 52 · 53 으로 나눠 센다
    known[code] = 1;
    return code;
  };
  const hand = game.hands[me].map(take);
  const disc = game.discardPile.map(take);
  const unknown = [];
  for (let code = 0; code < 54; code += 1) if (!known[code]) unknown.push(code);
  const oppCount = game.hands[opp].length;
  return {
    me,
    handCards: game.hands[me],
    hand,
    disc,
    unknown,
    oppCount,
    drawCount: game.drawPile.length,
    top: disc[disc.length - 1],
    req: suitIndex(game.requestedSuit),
    atk: game.attackCount,
    free: game.freePlay,
    slots: inferOpponentSlots(game, me, oppCount),
  };
}

// 상대 손패를 자리(slot) 목록으로 본다. 자리마다 "이 카드는 아니다"라는 비트를 쌓는다.
// 기록(history)은 낸 카드만 남기지만 차례 번호가 비면 그 차례에 뽑았다는 뜻이다.
// 상대가 뽑았을 때 그때 낼 수 있던 카드(playMask)는 그 순간 쥔 자리 모두에서 지운다.
function inferOpponentSlots(game, me, oppCount) {
  const opp = 1 - me;
  const history = game.history || [];
  const slots = [0, 0, 0, 0, 0];
  if (history.length && history[0].player === null) {
    const now = game.turnNumber;
    const ownerOf = (turn) => ((now - turn) % 2 === 0 ? game.currentPlayer : 1 - game.currentPlayer);
    let top = codeOf(history[0].card);
    let req = -1;
    let atk = 0;
    let free = false;
    let index = 1;
    for (let turn = 1; turn <= now; turn += 1) {
      let endedWithCard = false;
      while (index < history.length && history[index].turn <= turn) {
        const entry = history[index];
        index += 1;
        if (entry.turn < turn || entry.player === null) continue;
        const code = codeOf(entry.card);
        if (entry.player === opp) removeSlot(slots, code);
        top = code;
        req = suitIndex(entry.requestedSuit);
        atk += attackValue(code);
        free = false;
        endedWithCard = RANK_OF[code] !== R_J;
      }
      if (turn === now) break;
      if (endedWithCard) continue;
      // 이 차례는 뽑고 끝났다(J 뒤에 못 내고 뽑은 경우 포함)
      if (ownerOf(turn) === opp) {
        const mask = playMask(top, req, atk, free);
        if (mask !== ALL_BITS) for (let slot = 0; slot < slots.length; slot += 1) slots[slot] |= mask;
        for (let drawn = atk > 0 ? atk : 1; drawn > 0; drawn -= 1) slots.push(0);
      }
      free = atk > 0 && RANK_OF[top] === JOKER;
      atk = 0;
    }
  }
  // 덱이 바닥나 덜 뽑은 경우 등은 실제 장 수에 맞춘다(조건이 센 자리부터 뺀다)
  while (slots.length > oppCount) slots.splice(strongestSlot(slots, 0), 1);
  while (slots.length < oppCount) slots.push(0);
  return slots;
}

// 상대가 낸 카드는 그 카드와 어긋나지 않는 자리 가운데 조건이 가장 센 자리에서 나왔다고 본다
function removeSlot(slots, code) {
  if (!slots.length) return;
  let pick = strongestSlot(slots, BITS[code]);
  if (pick < 0) {
    // 추론이 틀렸다(일부러 뽑았거나 놓침) — 그 카드를 막던 조건을 지운다
    for (let slot = 0; slot < slots.length; slot += 1) slots[slot] &= ~BITS[code];
    pick = strongestSlot(slots, BITS[code]);
  }
  slots.splice(pick, 1);
}

function strongestSlot(slots, cardBits) {
  let pick = -1;
  let best = -1;
  for (let slot = 0; slot < slots.length; slot += 1) {
    if (slots[slot] & cardBits) continue;
    const strength = popBits(slots[slot]);
    if (strength > best) { best = strength; pick = slot; }
  }
  return pick;
}

// 상대 손패 + 덱 한 벌을 뽑는다(결정화). 조건이 센 자리부터 맞는 카드를 고르고, 없으면 조건을 푼다.
export function sampleWorld(table, random) {
  const pool = table.unknown.slice();
  shuffleInPlace(pool, random);
  const order = table.slotOrder || (table.slotOrder = table.slots.slice().sort((a, b) => popBits(b) - popBits(a)));
  const oppHand = [];
  let end = pool.length;
  for (let slot = 0; slot < order.length && end > 0; slot += 1) {
    const mask = order[slot];
    let pick = end - 1;
    if (mask) {
      while (pick >= 0 && (BITS[pool[pick]] & mask)) pick -= 1;
      if (pick < 0) pick = end - 1;
    }
    oppHand.push(pool[pick]);
    pool[pick] = pool[end - 1];
    end -= 1;
  }
  pool.length = Math.min(end, table.drawCount);
  return { oppHand, deck: pool };
}

export function shuffleInPlace(items, random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    const temp = items[index];
    items[index] = items[target];
    items[target] = temp;
  }
  return items;
}

// 상대가 지금 손패로 mask 에 맞는 카드를 하나도 못 낼 확률(자리마다 맞는 카드 수로 어림)
export function chanceOpponentHasNone(table, mask) {
  const groups = table.slotGroups || (table.slotGroups = groupSlots(table));
  let chance = 1;
  for (const group of groups) {
    let hits = 0;
    for (const code of group.pool) if (BITS[code] & mask) hits += 1;
    const size = group.pool.length;
    for (let taken = 0; taken < group.count && taken < size; taken += 1) {
      chance *= Math.max(0, size - hits - taken) / (size - taken);
    }
  }
  return chance;
}

function groupSlots(table) {
  const byMask = new Map();
  table.slots.forEach((mask) => byMask.set(mask, (byMask.get(mask) || 0) + 1));
  return [...byMask].map(([mask, count]) => ({
    count,
    pool: table.unknown.filter((code) => !(BITS[code] & mask)),
  }));
}
