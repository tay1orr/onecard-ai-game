// 6~8성 AI — 6성: 카드를 세어 손익을 따진다 · 7 · 8성: 공개 정보에 맞는 판을 여러 벌 뽑아 끝까지 두어 본다
// 판을 읽는 법(공정한 정보만)은 ai-tracker.js 에 있다. 넘겨받은 game 은 바꾸지 않는다.
import { SUITS } from './game-engine.js';
import {
  BITS, DEFENCE_BITS, JOKER, JOKER_BIT, RANK_OF, R_2, R_7, R_A, R_J, SUIT_OF,
  attackValue, chanceOpponentHasNone, playMask, readTable, sampleWorld, shuffleInPlace,
} from './ai-tracker.js';

const now = () => (globalThis.performance?.now ? globalThis.performance.now() : Date.now());

// 단계별 설정 — worlds: 뽑아 볼 판 수(상한) · budgetMs: 한 수에 쓰는 시간(상한)
// candidates: 어림 점수 상위 몇 수를 두어 볼지 · rounds: 판 수 몇 할마다 아래 절반을 버릴지
// search80 ~ search300 은 AI 난이도 16~19단계(7성과 8성 사이, 11-27) — 판 수 · 시간 · 후보를 고르게 늘림
const SETTINGS = {
  star6: { search: false },
  star7: { search: true, worlds: 40, minWorlds: 8, budgetMs: 30, candidates: 5, rounds: [1] },
  search80: { search: true, worlds: 80, minWorlds: 10, budgetMs: 31, candidates: 6, rounds: [0.5, 1] },
  search140: { search: true, worlds: 140, minWorlds: 12, budgetMs: 32, candidates: 6, rounds: [0.5, 1] },
  search210: { search: true, worlds: 210, minWorlds: 13, budgetMs: 34, candidates: 7, rounds: [0.25, 0.5, 1] },
  search300: { search: true, worlds: 300, minWorlds: 14, budgetMs: 35, candidates: 8, rounds: [0.25, 0.5, 1] },
  star8: { search: true, worlds: 400, minWorlds: 16, budgetMs: 36, candidates: 8, rounds: [0.25, 0.5, 1] },
};

export const ELITE_KEYS = Object.keys(SETTINGS);

export function chooseEliteMove(game, level, random = Math.random) {
  const settings = SETTINGS[level] || SETTINGS.star6;
  const table = readTable(game, 1);
  const options = rootCandidates(table);
  if (!options.length) return { type: 'draw' };
  options.forEach((option) => { option.score = heuristicScore(table, option, 0); });
  options.sort((a, b) => b.score - a.score);
  let pick = options[0];
  if (settings.search && options.length > 1 && pick.score < WIN_SCORE) {
    pick = searchBest(table, options.slice(0, settings.candidates), settings, random);
  }
  const card = table.handCards[pick.index];
  return { type: 'play', cardId: card.id, chosenSuit: pick.suit >= 0 ? SUITS[pick.suit] : null };
}

// ── 후보 수: 낼 수 있는 카드(7은 무늬마다 따로), 같은 조커 두 장은 하나로
function rootCandidates(table) {
  const mask = playMask(table.top, table.req, table.atk, table.free);
  const options = [];
  let jokerSeen = false;
  table.hand.forEach((code, index) => {
    if (!(BITS[code] & mask)) return;
    if (RANK_OF[code] === JOKER) {
      if (jokerSeen) return;
      jokerSeen = true;
    }
    if (RANK_OF[code] === R_7) for (let suit = 0; suit < 4; suit += 1) options.push({ index, code, suit });
    else options.push({ index, code, suit: -1 });
  });
  return options;
}

// ── 6성 어림 점수(카드 장 수 단위) — 7 · 8성은 후보를 추리고 동점을 가를 때 쓴다
const WIN_SCORE = 1000;

function heuristicScore(table, option, depth) {
  const { code, index, suit } = option;
  const rank = RANK_OF[code];
  const after = table.hand.filter((_, at) => at !== index);
  if (!after.length) return WIN_SCORE;
  const oppCount = table.oppCount;
  const prevActive = table.req >= 0 ? table.req : SUIT_OF[table.top];
  const req = rank === R_7 ? suit : rank === JOKER ? prevActive : -1;
  const atk = table.atk + attackValue(code);

  if (rank === R_J && table.atk === 0) {
    // J: 한 번 더 낸다 — 이어 낼 수 중 가장 좋은 것, 없으면 한 장 뽑는다
    const next = { ...table, hand: after, top: code, req: -1, atk: 0, free: false };
    if (depth >= 2) return 0.5;
    const follow = rootCandidates(next).map((item) => heuristicScore(next, item, depth + 1));
    return follow.length ? 0.6 + Math.max(...follow) : -1.2 + holdValue(after, oppCount);
  }

  const answer = playMask(code, req, atk, false);
  const none = chanceOpponentHasNone(table, answer);
  let score = 0;
  if (atk > 0) {
    // 공격: 못 막으면 atk 장(조커면 우리가 자유롭게 한 장 더) · 받아치면 우리가 막거나 더 크게 먹는다
    const myGuard = after.filter((item) => BITS[item] & (rank === JOKER ? JOKER_BIT : DEFENCE_BITS)).length;
    score += none * (atk + (rank === JOKER ? 1.2 : 0));
    score -= (1 - none) * (myGuard ? 1.5 + atk * 0.15 : atk + 2.5);
  } else {
    score += none * (oppCount <= 2 ? 2.2 : 1.1);
  }
  // 상대가 한두 장이면 내 카드가 상대의 마지막 수를 열어 주는지가 가장 크다
  if (oppCount === 1) score -= (1 - none) * 8;
  else if (oppCount === 2) score -= (1 - none) * 1.5;
  score += holdValue(after, oppCount);
  score += followValue(after, req >= 0 ? req : SUIT_OF[code], code);
  return score;
}

// 손에 남겨 두는 값: 조커는 언제나 낼 수 있는 마지막 카드 · 2/A 는 막기 · 7은 무늬 바꾸기
function holdValue(hand, oppCount) {
  const late = oppCount <= 2;
  let value = 0;
  for (const code of hand) {
    const rank = RANK_OF[code];
    if (rank === JOKER) value += late ? 1.2 : 2.6;
    else if (rank === R_2 || rank === R_A) value += late ? 0.5 : 1.1;
    else if (rank === R_7) value += 0.9;
    else if (rank === R_J) value += 0.3;
  }
  return value - hand.length * 0.05;
}

// 상대가 못 내면 내 카드 위에 내가 다시 낸다 — 이어 낼 수 있는 카드가 많을수록 좋다
function followValue(hand, active, top) {
  let same = 0;
  for (const code of hand) {
    if (SUIT_OF[code] === active) same += 1;
    else if (RANK_OF[code] === RANK_OF[top] && RANK_OF[top] !== R_7) same += 0.5;
  }
  return Math.min(same, 3) * 0.35;
}

// ── 7 · 8성: 결정화 몬테카를로 — 공개 정보에 맞는 판(상대 손패 + 덱 순서)을 뽑아 후보마다 끝까지 두어 본다
// 같은 판 · 같은 난수를 모든 후보에 써서 운이 아닌 수의 차이만 견준다.
// 8성은 판 수의 25% · 50% 지점에서 아래 절반을 버리고 남은 후보에 판을 더 쓴다.
function searchBest(table, options, settings, random) {
  const deadline = now() + settings.budgetMs;
  const wins = new Float64Array(options.length);
  let alive = options.map((_, at) => at);
  let worlds = 0;
  for (let round = 0; round < settings.rounds.length; round += 1) {
    const target = Math.round(settings.worlds * settings.rounds[round]);
    while (worlds < target && (worlds < settings.minWorlds || now() < deadline)) {
      const world = sampleWorld(table, random);
      const seed = Math.floor(random() * 4294967296);
      for (const at of alive) {
        const sim = new Sim(table, world, mulberry32(seed));
        wins[at] += playOut(sim, options[at]);
      }
      worlds += 1;
    }
    if (worlds < target || round === settings.rounds.length - 1) break; // 시간이 다 됐거나 마지막 회
    if (alive.length > 2) {
      const keep = Math.max(2, Math.ceil(alive.length / 2));
      alive = alive.slice().sort((a, b) => wins[b] - wins[a] || a - b).slice(0, keep).sort((a, b) => a - b);
    }
  }
  // 이긴 판이 같으면 어림 점수가 높은(앞에 있는) 수
  let best = alive[0];
  for (const at of alive) if (wins[at] > wins[best] + 1e-9) best = at;
  return options[best];
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 가벼운 판(시뮬레이션): 카드 번호 배열만 들고 엔진과 같은 규칙으로 진행한다
const MAX_PLIES = 240;
const SUIT_COUNT = new Int8Array(5);

class Sim {
  constructor(table, world, rng) {
    const me = table.me;
    this.me = me;
    this.hands = me === 1 ? [world.oppHand.slice(), table.hand.slice()] : [table.hand.slice(), world.oppHand.slice()];
    this.deck = world.deck.slice();
    this.disc = table.disc.slice();
    this.top = table.top;
    this.req = table.req;
    this.atk = table.atk;
    this.free = table.free;
    this.cur = me;
    this.suit = 0; // 정책이 7을 고르면 바꿀 무늬를 여기 적는다
    this.rng = rng;
  }

  // 엔진 playCard 와 같다. 손패가 비면 true
  play(player, at, suit) {
    const hand = this.hands[player];
    const code = hand[at];
    hand[at] = hand[hand.length - 1];
    hand.pop();
    const prevActive = this.req >= 0 ? this.req : SUIT_OF[this.top];
    this.disc.push(code);
    this.top = code;
    this.free = false;
    const rank = RANK_OF[code];
    this.req = rank === R_7 ? suit : rank === JOKER ? prevActive : -1;
    this.atk += attackValue(code);
    if (!hand.length) return true;
    if (rank !== R_J) this.cur = 1 - player;
    return false;
  }

  // 엔진 drawCards 와 같다(덱이 비면 더미를 섞어 덱으로)
  draw(player) {
    const hand = this.hands[player];
    for (let count = this.atk > 0 ? this.atk : 1; count > 0; count -= 1) {
      if (!this.deck.length) this.recycle();
      if (!this.deck.length) break;
      hand.push(this.deck.pop());
    }
    this.free = this.atk > 0 && RANK_OF[this.top] === JOKER;
    this.atk = 0;
    this.cur = 1 - player;
  }

  recycle() {
    if (this.disc.length <= 1) return;
    const top = this.disc.pop();
    this.deck = shuffleInPlace(this.disc, this.rng);
    this.disc = [top];
  }
}

// 후보 수를 두고 양쪽 모두 빠른 정책으로 끝까지 — 내가 이기면 1
function playOut(sim, option) {
  const me = sim.me;
  if (sim.play(me, option.index, option.suit)) return 1;
  for (let ply = 0; ply < MAX_PLIES; ply += 1) {
    const player = sim.cur;
    const at = rolloutPolicy(sim, player);
    if (at < 0) sim.draw(player);
    else if (sim.play(player, at, sim.suit)) return player === me ? 1 : 0;
  }
  const mine = sim.hands[me].length;
  const theirs = sim.hands[1 - me].length;
  return mine < theirs ? 0.7 : mine > theirs ? 0.3 : 0.5;
}

function countSuits(hand, skip) {
  SUIT_COUNT.fill(0);
  for (let at = 0; at < hand.length; at += 1) if (at !== skip) SUIT_COUNT[SUIT_OF[hand[at]]] += 1;
}

function bestSuit(hand, skip) {
  countSuits(hand, skip);
  let best = 0;
  for (let suit = 1; suit < 4; suit += 1) if (SUIT_COUNT[suit] > SUIT_COUNT[best]) best = suit;
  return best;
}

// 시뮬 안 정책: 자기 손패와 상대 장 수만 보고 빠르게(점수에 작은 흔들림)
// 더 많이 따지는 정책도 견줘 봤지만 시뮬 정책으로는 이것이 가장 나았다
function rolloutPolicy(sim, player) {
  const hand = sim.hands[player];
  const mask = playMask(sim.top, sim.req, sim.atk, sim.free);
  if (hand.length === 1) return BITS[hand[0]] & mask ? 0 : -1;
  const oppCount = sim.hands[1 - player].length;
  countSuits(hand, -1);
  let best = -1;
  let bestScore = -1e9;
  for (let at = 0; at < hand.length; at += 1) {
    const code = hand[at];
    if (!(BITS[code] & mask)) continue;
    const rank = RANK_OF[code];
    let score;
    if (sim.atk > 0) score = rank === R_2 ? 3 : rank === R_A ? 2 : 1;
    else {
      score = rank === JOKER ? 0 : SUIT_COUNT[SUIT_OF[code]];
      if (rank === JOKER) score += oppCount <= 2 ? 12 : -6;
      else if (rank === R_2 || rank === R_A) score += oppCount <= 2 ? 8 : -2;
      else if (rank === R_J) score += SUIT_COUNT[SUIT_OF[code]] >= 2 ? 3 : -3;
      else if (rank === R_7) score -= 2;
    }
    score += sim.rng() * 1.5;
    if (score > bestScore) { bestScore = score; best = at; }
  }
  if (best >= 0 && RANK_OF[hand[best]] === R_7) sim.suit = bestSuit(hand, best);
  return best;
}
