import { DEFAULT_EQUIPPED, newlyUnlockedCosmetics, normalizeEquipped } from './2026-07-06-cosmetics.js';

export const LEGACY_RECORD_KEY = 'onecard-record';
export const LEGACY_BACKUP_KEY = 'onecard-record-backup-v1';
export const PROFILE_KEY = 'onecard-player-profile-v2';

export const WIN_REWARDS = Object.freeze({ 1: 125, 2: 180, 3: 250, 4: 340, 5: 500 });
export const LOSS_PENALTY = -50;
export const BONUS_MATCH_MULTIPLIER = 2;

export const AI_OPPONENTS = Object.freeze([
  { key: 'star1', stars: 1, name: '느긋한 루미', icon: '☁', status: '마음 가는 카드를 고르고 있어요', delay: 820 },
  { key: 'star2', stars: 2, name: '재빠른 미오', icon: '◆', status: '무늬와 공격 카드를 살펴봐요', delay: 900 },
  { key: 'star3', stars: 3, name: '영리한 네오', icon: '✦', status: '좋은 수를 생각하고 있어요', delay: 1030 },
  { key: 'star4', stars: 4, name: '냉철한 아스트라', icon: '♛', status: '최선과 차선의 흐름을 계산해요', delay: 1160 },
  { key: 'star5', stars: 5, name: '무결한 오르비스', icon: '◈', status: '공개된 정보로 다음 수를 읽어요', delay: 1280 },
]);

export const MATCH_BANDS = Object.freeze([
  { min: 0, max: 499, weights: [55, 35, 10, 0, 0] },
  { min: 500, max: 1499, weights: [20, 45, 30, 5, 0] },
  { min: 1500, max: 3499, weights: [5, 25, 45, 22, 3] },
  { min: 3500, max: 6999, weights: [0, 8, 42, 40, 10] },
  { min: 7000, max: 10999, weights: [0, 2, 25, 48, 25] },
  { min: 11000, max: 14999, weights: [0, 0, 12, 48, 40] },
  { min: 15000, max: 19999, weights: [0, 0, 5, 40, 55] },
  { min: 20000, max: Number.POSITIVE_INFINITY, weights: [0, 0, 0, 30, 70] },
]);

const PLAYER_STAR_THRESHOLDS = [0, 500, 1500, 3500, 11000];
const PROGRESS_TARGETS = [500, 1500, 3500, 11000, 20000];

function safeParse(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

function safeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function defaultStorage() {
  return globalThis.localStorage;
}

function write(storage, key, value) {
  try { storage?.setItem(key, value); } catch { /* 저장소가 차단되면 현재 세션만 사용합니다. */ }
}

export function loadPlayerProfile(storage = defaultStorage()) {
  const legacyRaw = storage?.getItem(LEGACY_RECORD_KEY) || '';
  const legacy = safeParse(legacyRaw) || {};
  const saved = safeParse(storage?.getItem(PROFILE_KEY)) || {};

  if (legacyRaw && !storage?.getItem(LEGACY_BACKUP_KEY)) write(storage, LEGACY_BACKUP_KEY, legacyRaw);

  const legacyWins = safeInteger(legacy.wins);
  const legacyGames = safeInteger(legacy.games);
  const savedWins = safeInteger(saved.wins);
  const savedGames = safeInteger(saved.games);
  const wins = Math.max(legacyWins, savedWins);
  const games = Math.max(legacyGames, savedGames, wins);
  const points = safeInteger(saved.points);
  const peakPoints = Math.max(points, safeInteger(saved.peakPoints));
  const profile = {
    version: 3,
    points,
    peakPoints,
    wins,
    games,
    losses: Math.max(safeInteger(saved.losses), Math.max(0, games - wins)),
    aiWins: safeInteger(saved.aiWins),
    aiGames: safeInteger(saved.aiGames),
    multiWins: safeInteger(saved.multiWins),
    multiGames: safeInteger(saved.multiGames),
    awardedMatchIds: Array.isArray(saved.awardedMatchIds) ? saved.awardedMatchIds.slice(-100) : [],
    recentAiStars: Array.isArray(saved.recentAiStars) ? saved.recentAiStars.filter((value) => value >= 1 && value <= 5).slice(-2) : [],
    equipped: normalizeEquipped(saved.equipped || DEFAULT_EQUIPPED, peakPoints),
    reducedEffects: Boolean(saved.reducedEffects),
  };
  savePlayerProfile(profile, storage);
  return profile;
}

export function savePlayerProfile(profile, storage = defaultStorage()) {
  const peakPoints = Math.max(safeInteger(profile.peakPoints), safeInteger(profile.points));
  const normalized = {
    ...profile,
    version: 3,
    peakPoints,
    equipped: normalizeEquipped(profile.equipped || DEFAULT_EQUIPPED, peakPoints),
    reducedEffects: Boolean(profile.reducedEffects),
  };
  write(storage, PROFILE_KEY, JSON.stringify(normalized));

  const legacy = safeParse(storage?.getItem(LEGACY_RECORD_KEY)) || {};
  write(storage, LEGACY_RECORD_KEY, JSON.stringify({
    ...legacy,
    wins: Math.max(safeInteger(legacy.wins), safeInteger(normalized.wins)),
    games: Math.max(safeInteger(legacy.games), safeInteger(normalized.games)),
  }));
  return normalized;
}

export function recordMatchResult({ won, opponentStars = 1, mode = 'ai', matchId, bonusMultiplier: requestedMultiplier = 1 }, storage = defaultStorage()) {
  const profile = loadPlayerProfile(storage);
  const safeStars = Math.min(5, Math.max(1, safeInteger(opponentStars, 1)));
  const id = String(matchId || `${mode}:${Date.now()}`);
  if (profile.awardedMatchIds.includes(id)) return { profile, delta: 0, duplicate: true };

  const bonusMultiplier = Math.max(1, Math.min(BONUS_MATCH_MULTIPLIER, safeInteger(requestedMultiplier, 1)));
  const baseDelta = won ? WIN_REWARDS[safeStars] : LOSS_PENALTY;
  const requestedDelta = won ? baseDelta * bonusMultiplier : baseDelta;
  const previousPoints = profile.points;
  const previousPeak = profile.peakPoints;
  profile.points = Math.max(0, profile.points + requestedDelta);
  profile.peakPoints = Math.max(profile.peakPoints, profile.points);
  const delta = profile.points - previousPoints;
  profile.games += 1;
  if (won) profile.wins += 1;
  else profile.losses += 1;
  if (mode === 'multi') {
    profile.multiGames += 1;
    if (won) profile.multiWins += 1;
  } else {
    profile.aiGames += 1;
    if (won) profile.aiWins += 1;
  }
  profile.awardedMatchIds = [...profile.awardedMatchIds, id].slice(-100);
  return {
    profile: savePlayerProfile(profile, storage),
    delta,
    baseDelta,
    bonusMultiplier,
    duplicate: false,
    unlockedItems: newlyUnlockedCosmetics(previousPeak, profile.peakPoints),
  };
}

export function playerStarsForPoints(points) {
  const score = safeInteger(points);
  let stars = 1;
  PLAYER_STAR_THRESHOLDS.forEach((threshold, index) => {
    if (score >= threshold) stars = index + 1;
  });
  return stars;
}

export function ratingProgress(points) {
  const score = safeInteger(points);
  const stars = playerStarsForPoints(score);
  const floor = PLAYER_STAR_THRESHOLDS[stars - 1];
  const target = PROGRESS_TARGETS[stars - 1];
  if (score >= 20000) return { stars: 5, floor: 20000, target: null, ratio: 1, remaining: 0 };
  return {
    stars,
    floor,
    target,
    ratio: Math.max(0, Math.min(1, (score - floor) / (target - floor))),
    remaining: Math.max(0, target - score),
  };
}

export function matchmakingWeights(points) {
  const score = safeInteger(points);
  return [...(MATCH_BANDS.find((band) => score >= band.min && score <= band.max) || MATCH_BANDS.at(-1)).weights];
}

function weightedIndex(weights, random) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cursor = random() * total;
  for (let index = 0; index < weights.length; index += 1) {
    cursor -= weights[index];
    if (cursor < 0) return index;
  }
  return weights.length - 1;
}

export function selectAiOpponent(points, random = Math.random, recentStars = []) {
  const weights = matchmakingWeights(points);
  let index = weightedIndex(weights, random);
  const repeatedThreeTimes = recentStars.length >= 2
    && recentStars.at(-1) === index + 1
    && recentStars.at(-2) === index + 1;
  if (repeatedThreeTimes && weights.some((weight, candidate) => candidate !== index && weight > 0)) {
    const adjusted = weights.map((weight, candidate) => candidate === index ? 0 : weight);
    index = weightedIndex(adjusted, random);
  }
  return AI_OPPONENTS[index];
}

export function rememberAiOpponent(profile, stars, storage = defaultStorage()) {
  profile.recentAiStars = [...(profile.recentAiStars || []), stars].slice(-2);
  return savePlayerProfile(profile, storage);
}

export function rewardForStars(stars) {
  return WIN_REWARDS[Math.min(5, Math.max(1, safeInteger(stars, 1)))];
}

export function bonusMatchChance(points) {
  const score = Math.min(40000, safeInteger(points));
  return Number((0.2 - (score / 40000) * 0.05).toFixed(4));
}

export function rollBonusMatch(points, random = Math.random) {
  return random() < bonusMatchChance(points);
}

export function starsText(stars) {
  return '★'.repeat(Math.min(5, Math.max(1, safeInteger(stars, 1))));
}
