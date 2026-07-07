import { loadPlayerProfile, savePlayerProfile } from './2026-07-05-rating.js';
import { newlyUnlockedCosmetics } from './2026-07-06-cosmetics.js';

export const MISSION_STORAGE_KEY = 'onecard-missions-v1';
export const DAILY_MISSION_COUNT = 3;
export const WEEKLY_MISSION_COUNT = 5;

const DAILY_GROUPS = Object.freeze([
  Object.freeze([
    { id: 'daily-play-ai-1', period: 'daily', counter: 'game-ai', target: 1, reward: 45, title: 'AI 한 판', description: 'AI 대전을 1판 완료하기' },
    { id: 'daily-play-any-1', period: 'daily', counter: 'game-any', target: 1, reward: 40, title: '오늘의 한 판', description: '아무 모드에서 1판 완료하기' },
    { id: 'daily-win-any-1', period: 'daily', counter: 'win-any', target: 1, reward: 75, title: '가볍게 1승', description: '아무 모드에서 1승 하기' },
  ]),
  Object.freeze([
    { id: 'daily-card-play-10', period: 'daily', counter: 'card-play', target: 10, reward: 55, title: '카드 손풀기', description: '카드 10장 내기' },
    { id: 'daily-draw-6', period: 'daily', counter: 'draw-card', target: 6, reward: 45, title: '덱 탐험', description: '카드 6장 뽑기' },
    { id: 'daily-attack-2', period: 'daily', counter: 'attack-card', target: 2, reward: 55, title: '살짝 공격적', description: '공격 카드 2장 내기' },
    { id: 'daily-seven-1', period: 'daily', counter: 'seven-card', target: 1, reward: 45, title: '무늬 바꾸기', description: '7 카드 1장 내기' },
  ]),
  Object.freeze([
    { id: 'daily-emote-1', period: 'daily', counter: 'emote', target: 1, reward: 30, title: '인사 한 번', description: '이모티콘 1번 보내기' },
    { id: 'daily-onecard-1', period: 'daily', counter: 'one-card', target: 1, reward: 60, title: 'ONE CARD!', description: '내 카드가 1장 남는 순간 만들기' },
    { id: 'daily-bonus-see-1', period: 'daily', counter: 'bonus-match', target: 1, reward: 70, title: '보너스판 발견', description: '보너스판 1번 만나기' },
    { id: 'daily-joker-1', period: 'daily', counter: 'joker-card', target: 1, reward: 70, title: '조커 등장', description: '조커 카드 1장 내기' },
  ]),
]);

const WEEKLY_GROUPS = Object.freeze([
  Object.freeze([
    { id: 'weekly-games-8', period: 'weekly', counter: 'game-any', target: 8, reward: 280, title: '주간 경기 감각', description: '아무 모드에서 8판 완료하기' },
    { id: 'weekly-ai-games-6', period: 'weekly', counter: 'game-ai', target: 6, reward: 230, title: 'AI 스파링', description: 'AI 대전을 6판 완료하기' },
    { id: 'weekly-wins-4', period: 'weekly', counter: 'win-any', target: 4, reward: 360, title: '주간 4승', description: '아무 모드에서 4승 하기' },
    { id: 'weekly-multi-2', period: 'weekly', counter: 'game-multi', target: 2, reward: 320, title: '친구와 두 판', description: '멀티 대전을 2판 완료하기' },
  ]),
  Object.freeze([
    { id: 'weekly-cards-75', period: 'weekly', counter: 'card-play', target: 75, reward: 300, title: '카드 러너', description: '카드 75장 내기' },
    { id: 'weekly-draw-35', period: 'weekly', counter: 'draw-card', target: 35, reward: 240, title: '덱을 훑는 손', description: '카드 35장 뽑기' },
    { id: 'weekly-attacks-14', period: 'weekly', counter: 'attack-card', target: 14, reward: 300, title: '공격 루틴', description: '공격 카드 14장 내기' },
    { id: 'weekly-sevens-7', period: 'weekly', counter: 'seven-card', target: 7, reward: 260, title: '무늬 조율사', description: '7 카드 7장 내기' },
    { id: 'weekly-jokers-3', period: 'weekly', counter: 'joker-card', target: 3, reward: 340, title: '조커 헌터', description: '조커 카드 3장 내기' },
  ]),
  Object.freeze([
    { id: 'weekly-emotes-7', period: 'weekly', counter: 'emote', target: 7, reward: 170, title: '감정 표현 장인', description: '이모티콘 7번 보내기' },
    { id: 'weekly-bonus-see-3', period: 'weekly', counter: 'bonus-match', target: 3, reward: 270, title: '보너스판 사냥', description: '보너스판 3번 만나기' },
    { id: 'weekly-bonus-win-1', period: 'weekly', counter: 'bonus-win', target: 1, reward: 420, title: '더블 찬스 성공', description: '보너스판에서 1승 하기' },
    { id: 'weekly-onecard-5', period: 'weekly', counter: 'one-card', target: 5, reward: 330, title: '원카드 감각', description: '내 카드가 1장 남는 순간 5번 만들기' },
    { id: 'weekly-strong-ai-win-2', period: 'weekly', counter: 'win-strong-ai', target: 2, reward: 420, title: '강자에게 한 방', description: '4성 이상 AI에게 2승 하기' },
  ]),
]);

const ALL_MISSIONS = Object.freeze([...DAILY_GROUPS.flat(), ...WEEKLY_GROUPS.flat()]);
const MISSION_BY_ID = new Map(ALL_MISSIONS.map((mission) => [mission.id, mission]));

function defaultStorage() {
  return globalThis.localStorage;
}

function safeParse(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

function safeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function write(storage, value) {
  try { storage?.setItem(MISSION_STORAGE_KEY, JSON.stringify(value)); } catch { /* storage may be blocked */ }
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function weekStartKey(date = new Date()) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  return localDateKey(copy);
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(group, random, count = 1) {
  const pool = [...group];
  const selected = [];
  while (pool.length && selected.length < count) {
    const index = Math.floor(random() * pool.length);
    selected.push(pool.splice(index, 1)[0].id);
  }
  return selected;
}

function createBoard(period, key) {
  const random = seededRandom(`${period}:${key}`);
  const groups = period === 'daily' ? DAILY_GROUPS : WEEKLY_GROUPS;
  const missionIds = period === 'daily'
    ? groups.flatMap((group) => pick(group, random, 1)).slice(0, DAILY_MISSION_COUNT)
    : [...pick(groups[0], random, 2), ...pick(groups[1], random, 2), ...pick(groups[2], random, 1)].slice(0, WEEKLY_MISSION_COUNT);
  return { key, missionIds, progress: {}, claimed: {} };
}

function ensureState(storage = defaultStorage(), now = new Date()) {
  const saved = safeParse(storage?.getItem(MISSION_STORAGE_KEY)) || {};
  const dailyKey = localDateKey(now);
  const weeklyKey = weekStartKey(now);
  const state = {
    version: 1,
    daily: saved.daily?.key === dailyKey ? saved.daily : createBoard('daily', dailyKey),
    weekly: saved.weekly?.key === weeklyKey ? saved.weekly : createBoard('weekly', weeklyKey),
    seenEventIds: Array.isArray(saved.seenEventIds) ? saved.seenEventIds.slice(-400) : [],
  };
  write(storage, state);
  return state;
}

function eventAmount(event, mission) {
  if (mission.counter === 'draw-card') return Math.max(1, safeInteger(event.amount, 1));
  return Math.max(1, safeInteger(event.amount, 1));
}

function eventMatches(mission, event) {
  if (!event) return false;
  if (mission.counter === event.type) return true;
  if (mission.counter === 'game-any') return event.type === 'game';
  if (mission.counter === 'game-ai') return event.type === 'game' && event.mode === 'ai';
  if (mission.counter === 'game-multi') return event.type === 'game' && event.mode === 'multi';
  if (mission.counter === 'win-any') return event.type === 'win';
  if (mission.counter === 'win-ai') return event.type === 'win' && event.mode === 'ai';
  if (mission.counter === 'win-multi') return event.type === 'win' && event.mode === 'multi';
  if (mission.counter === 'win-strong-ai') return event.type === 'win' && event.mode === 'ai' && safeInteger(event.opponentStars, 1) >= 4;
  return false;
}

function hydrateBoard(board, period) {
  const missions = board.missionIds
    .map((id) => MISSION_BY_ID.get(id))
    .filter(Boolean)
    .map((mission) => {
      const progress = Math.min(mission.target, safeInteger(board.progress?.[mission.id]));
      const completed = progress >= mission.target;
      return {
        ...mission,
        progress,
        completed,
        claimed: Boolean(board.claimed?.[mission.id]),
        remaining: Math.max(0, mission.target - progress),
        percent: Math.round((progress / mission.target) * 100),
        period,
      };
    });
  const completedCount = missions.filter((mission) => mission.completed).length;
  return { key: board.key, missions, completedCount, total: missions.length };
}

export function loadMissionDashboard(storage = defaultStorage(), now = new Date()) {
  const state = ensureState(storage, now);
  return {
    daily: hydrateBoard(state.daily, 'daily'),
    weekly: hydrateBoard(state.weekly, 'weekly'),
  };
}

export function applyMissionEvents(inputEvents, options = {}) {
  const storage = options.storage || defaultStorage();
  const now = options.now || new Date();
  const events = Array.isArray(inputEvents) ? inputEvents : [inputEvents];
  const state = ensureState(storage, now);
  const seen = new Set(state.seenEventIds || []);
  const completedMissions = [];
  let rewardDelta = 0;

  events.filter(Boolean).forEach((event) => {
    const eventId = String(event.id || `${event.type}:${event.mode || 'any'}:${event.timestamp || Date.now()}:${Math.random()}`);
    if (seen.has(eventId)) return;
    seen.add(eventId);
    [state.daily, state.weekly].forEach((board) => {
      board.progress ||= {};
      board.claimed ||= {};
      board.missionIds.forEach((missionId) => {
        const mission = MISSION_BY_ID.get(missionId);
        if (!mission || board.claimed[mission.id] || !eventMatches(mission, event)) return;
        const before = safeInteger(board.progress[mission.id]);
        const after = Math.min(mission.target, before + eventAmount(event, mission));
        board.progress[mission.id] = after;
        if (before < mission.target && after >= mission.target) {
          board.claimed[mission.id] = true;
          rewardDelta += mission.reward;
          completedMissions.push({ ...mission, progress: after });
        }
      });
    });
  });

  state.seenEventIds = [...seen].slice(-400);
  write(storage, state);

  let profile = null;
  let unlockedItems = [];
  if (rewardDelta > 0) {
    const current = loadPlayerProfile(storage);
    const previousPeak = current.peakPoints || 0;
    current.points = Math.max(0, safeInteger(current.points) + rewardDelta);
    current.peakPoints = Math.max(safeInteger(current.peakPoints), current.points);
    profile = savePlayerProfile(current, storage);
    unlockedItems = newlyUnlockedCosmetics(previousPeak, profile.peakPoints);
  }

  return {
    dashboard: loadMissionDashboard(storage, now),
    completedMissions,
    rewardDelta,
    profile,
    unlockedItems,
  };
}

export function missionEventsForCard(card, context = {}) {
  if (!card) return [];
  const idPrefix = context.idPrefix || `card:${card.id}:${context.turn || Date.now()}`;
  const events = [{ id: `${idPrefix}:play`, type: 'card-play', amount: 1 }];
  if (['2', 'A', 'JOKER'].includes(card.rank)) events.push({ id: `${idPrefix}:attack`, type: 'attack-card', amount: 1 });
  if (card.rank === '7') events.push({ id: `${idPrefix}:seven`, type: 'seven-card', amount: 1 });
  if (card.rank === 'JOKER') events.push({ id: `${idPrefix}:joker`, type: 'joker-card', amount: 1 });
  return events;
}

export function mergeUnlockedItems(...groups) {
  const seen = new Set();
  return groups.flat().filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
