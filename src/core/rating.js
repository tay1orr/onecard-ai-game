import { DEFAULT_EQUIPPED, cosmeticById, isBoxItemId, newlyUnlockedByPass, newlyUnlockedCosmetics, normalizeEquipped } from './cosmetics.js';
import { tierForXp, xpForMatch } from './season.js';

export const LEGACY_RECORD_KEY = 'onecard-record';
export const LEGACY_BACKUP_KEY = 'onecard-record-backup-v1';
export const PROFILE_KEY = 'onecard-player-profile-v2';
// 운영에 올릴 때 기록을 지키는 열쇠 둘(11-25)
// · S1_PROFILE_BACKUP_KEY 시즌 1 프로필 원본을 처음 한 번 그대로 떠 둔다(무엇이 잘못돼도 되살릴 수 있게)
// · S2_PROGRESS_KEY 시즌 2 에만 있는 값(패스 경험치 · 상자 아이템 · 장착)을 따로도 적는다
//   배포 전부터 열려 있던 시즌 1 탭은 프로필을 옛 모양으로 덮어쓰며 이 값들을 버리는데, 그래도 여기서 되살아난다
//   줄어들지 않는 값이라 큰 값 · 합침으로 지킨다 — 시즌을 새로 열 때는 이 열쇠도 함께 비운다
export const S1_PROFILE_BACKUP_KEY = 'onecard-player-profile-s1-backup';
export const S2_PROGRESS_KEY = 'onecard-s2-progress-v1';

// ★6~★8 은 5만 점부터 만나는 상대 — 더 세고, 이기면 더 많이, 지면 조금 더 잃는다
export const WIN_REWARDS = Object.freeze({ 1: 125, 2: 180, 3: 250, 4: 340, 5: 500, 6: 700, 7: 1000, 8: 1400 });
export const LOSS_PENALTY = -50;
export const LOSS_PENALTIES = Object.freeze({ 6: -80, 7: -120, 8: -160 });
export const MAX_AI_STARS = 8;
export const BONUS_MATCH_MULTIPLIER = 2;

export const AI_OPPONENTS = Object.freeze([
  { key: 'star1', stars: 1, name: '느긋한 루미', icon: '☁', status: '마음 가는 카드를 고르고 있어요', delay: 820 },
  { key: 'star2', stars: 2, name: '재빠른 미오', icon: '◆', status: '무늬와 공격 카드를 살펴봐요', delay: 900 },
  { key: 'star3', stars: 3, name: '영리한 네오', icon: '✦', status: '좋은 수를 생각하고 있어요', delay: 1030 },
  { key: 'star4', stars: 4, name: '냉철한 아스트라', icon: '♛', status: '최선과 차선의 흐름을 계산해요', delay: 1160 },
  { key: 'star5', stars: 5, name: '무결한 오르비스', icon: '◈', status: '공개된 정보로 다음 수를 읽어요', delay: 1280 },
  { key: 'star6', stars: 6, name: '우아한 세레나', icon: '◇', status: '지나간 카드를 모두 기억해요', delay: 1320 },
  { key: 'star7', stars: 7, name: '그림자 녹턴', icon: '◆', status: '나올 카드를 수백 번 그려 봐요', delay: 1380 },
  { key: 'star8', stars: 8, name: '장미 정원의 로제아', icon: '❀', status: '가장 깊이 읽고 골라요', delay: 1440 },
]);

// 점수대별로 만나는 상대(★1~★8) 확률. 2만 점 아래는 시즌 1 그대로, 5만 점부터 ★6~★8 이 섞인다
export const MATCH_BANDS = Object.freeze([
  { min: 0, max: 499, weights: [55, 35, 10, 0, 0, 0, 0, 0] },
  { min: 500, max: 1499, weights: [20, 45, 30, 5, 0, 0, 0, 0] },
  { min: 1500, max: 3499, weights: [5, 25, 45, 22, 3, 0, 0, 0] },
  { min: 3500, max: 6999, weights: [0, 8, 42, 40, 10, 0, 0, 0] },
  { min: 7000, max: 10999, weights: [0, 2, 25, 48, 25, 0, 0, 0] },
  { min: 11000, max: 14999, weights: [0, 0, 12, 48, 40, 0, 0, 0] },
  { min: 15000, max: 19999, weights: [0, 0, 5, 40, 55, 0, 0, 0] },
  { min: 20000, max: 49999, weights: [0, 0, 0, 30, 70, 0, 0, 0] },
  { min: 50000, max: 99999, weights: [0, 0, 0, 15, 55, 30, 0, 0] },
  { min: 100000, max: 199999, weights: [0, 0, 0, 0, 35, 50, 15, 0] },
  { min: 200000, max: 299999, weights: [0, 0, 0, 0, 15, 45, 40, 0] },
  { min: 300000, max: 399999, weights: [0, 0, 0, 0, 5, 30, 50, 15] },
  { min: 400000, max: 599999, weights: [0, 0, 0, 0, 0, 20, 50, 30] },
  { min: 600000, max: Number.POSITIVE_INFINITY, weights: [0, 0, 0, 0, 0, 10, 45, 45] },
]);

// 내 별 — ★5 까지는 시즌 1 그대로, ★6 5만 · ★7 15만 · ★8 40만. 100만 점이 끝
const PLAYER_STAR_THRESHOLDS = [0, 500, 1500, 3500, 11000, 50000, 150000, 400000];
const PROGRESS_TARGETS = [500, 1500, 3500, 11000, 50000, 150000, 400000, 1000000];
export const FINAL_TARGET = 1000000;

function safeParse(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

function safeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

const listOf = (value) => (Array.isArray(value) ? value : []);
const claimedList = (...groups) => [...new Set(groups.flatMap(listOf).map(String))].slice(-150);

// 상자에서 얻은 아이템 — 목록에 있는 상자 전용 아이템만, 겹치지 않게
export function boxItemList(value) {
  return Array.isArray(value) ? [...new Set(value.map(String))].filter(isBoxItemId) : [];
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
  const savedRaw = storage?.getItem(PROFILE_KEY) || '';
  const saved = safeParse(savedRaw) || {};
  const kept = safeParse(storage?.getItem(S2_PROGRESS_KEY)) || {};

  if (legacyRaw && !storage?.getItem(LEGACY_BACKUP_KEY)) write(storage, LEGACY_BACKUP_KEY, legacyRaw);
  if (savedRaw && saved.version !== 4 && !storage?.getItem(S1_PROFILE_BACKUP_KEY)) write(storage, S1_PROFILE_BACKUP_KEY, savedRaw);

  const legacyWins = safeInteger(legacy.wins);
  const legacyGames = safeInteger(legacy.games);
  const savedWins = safeInteger(saved.wins);
  const savedGames = safeInteger(saved.games);
  const wins = Math.max(legacyWins, savedWins);
  const games = Math.max(legacyGames, savedGames, wins);
  const points = safeInteger(saved.points);
  const peakPoints = Math.max(points, safeInteger(saved.peakPoints));
  const seasonXp = Math.max(safeInteger(saved.seasonXp), safeInteger(kept.seasonXp));
  const boxItems = boxItemList([...listOf(saved.boxItems), ...listOf(kept.boxItems)]);
  // 프로필이 시즌 1 모양인데 시즌 2 장착이 따로 있으면 시즌 1 탭이 덮어쓴 것 — 시즌 2 장착을 되살린다
  const equipped = saved.version !== 4 && kept.equipped ? kept.equipped : saved.equipped;
  const profile = {
    version: 4,
    seasonId: 's2',
    points,
    peakPoints,
    seasonXp,
    wins,
    games,
    losses: Math.max(safeInteger(saved.losses), Math.max(0, games - wins)),
    aiWins: safeInteger(saved.aiWins),
    aiGames: safeInteger(saved.aiGames),
    multiWins: safeInteger(saved.multiWins),
    multiGames: safeInteger(saved.multiGames),
    awardedMatchIds: Array.isArray(saved.awardedMatchIds) ? saved.awardedMatchIds.slice(-150) : [],
    recentAiStars: Array.isArray(saved.recentAiStars) ? saved.recentAiStars.filter((value) => value >= 1 && value <= MAX_AI_STARS).slice(-2) : [],
    boxItems,
    claimedBoxIds: claimedList(saved.claimedBoxIds, kept.claimedBoxIds),
    equipped: normalizeEquipped(equipped || DEFAULT_EQUIPPED, peakPoints, tierForXp(seasonXp), boxItems),
    reducedEffects: Boolean(saved.reducedEffects),
  };
  // 읽을 때마다 다시 쓰지 않는다 — 옛 형식에서 옮겨 올 때만 저장
  if (saved.version !== 4 || legacyWins > savedWins || legacyGames > savedGames) savePlayerProfile(profile, storage);
  return profile;
}

export function savePlayerProfile(profile, storage = defaultStorage()) {
  const peakPoints = Math.max(safeInteger(profile.peakPoints), safeInteger(profile.points));
  const seasonXp = safeInteger(profile.seasonXp);
  const normalized = {
    ...profile,
    version: 4,
    seasonId: 's2',
    peakPoints,
    seasonXp,
    boxItems: boxItemList(profile.boxItems),
    claimedBoxIds: Array.isArray(profile.claimedBoxIds) ? profile.claimedBoxIds.map(String).slice(-150) : [],
    equipped: normalizeEquipped(profile.equipped || DEFAULT_EQUIPPED, peakPoints, tierForXp(seasonXp), boxItemList(profile.boxItems)),
    reducedEffects: Boolean(profile.reducedEffects),
  };
  write(storage, PROFILE_KEY, JSON.stringify(normalized));

  const kept = safeParse(storage?.getItem(S2_PROGRESS_KEY)) || {};
  write(storage, S2_PROGRESS_KEY, JSON.stringify({
    seasonXp: Math.max(seasonXp, safeInteger(kept.seasonXp)),
    boxItems: boxItemList([...normalized.boxItems, ...listOf(kept.boxItems)]),
    claimedBoxIds: claimedList(kept.claimedBoxIds, normalized.claimedBoxIds),
    equipped: normalized.equipped,
  }));

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
  // 친구 대전은 ★5 보상까지(서로 점수 몰아주기 막기), AI 대전은 ★8 까지
  const safeStars = Math.min(mode === 'multi' ? 5 : MAX_AI_STARS, Math.max(1, safeInteger(opponentStars, 1)));
  const id = String(matchId || `${mode}:${Date.now()}`);
  if (profile.awardedMatchIds.includes(id)) return { profile, delta: 0, duplicate: true };

  const bonusMultiplier = Math.max(1, Math.min(BONUS_MATCH_MULTIPLIER, safeInteger(requestedMultiplier, 1)));
  const baseDelta = won ? WIN_REWARDS[safeStars] : lossForStars(safeStars);
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
  profile.awardedMatchIds = [...profile.awardedMatchIds, id].slice(-150);
  const previousTier = tierForXp(profile.seasonXp);
  const xpGained = xpForMatch({ won, stars: safeStars, bonus: bonusMultiplier > 1, mode });
  profile.seasonXp = safeInteger(profile.seasonXp) + xpGained;
  const tier = tierForXp(profile.seasonXp);
  return {
    profile: savePlayerProfile(profile, storage),
    delta,
    baseDelta,
    bonusMultiplier,
    duplicate: false,
    xpGained,
    previousTier,
    tier,
    unlockedItems: [...newlyUnlockedCosmetics(previousPeak, profile.peakPoints), ...newlyUnlockedByPass(previousTier, tier)],
  };
}

// 보상 상자 받기 — 판마다 한 번(matchId). 점수는 늘 받고(기본 × 배수), 상자 전용 아이템이 함께 들어 있으면 그것도 받는다.
// 한 상자 점수 상한 3만 점(★8 · 보너스판 · 판수 ×2 · ×10 이 겹쳐도 넘지 않음)
export const BOX_POINTS_CAP = 30000;
export function claimRewardBox({ matchId, box }, storage = defaultStorage()) {
  const profile = loadPlayerProfile(storage);
  const id = `box:${String(matchId || '')}`;
  if (!box || !matchId || profile.claimedBoxIds.includes(id)) return { profile, delta: 0, multiplier: 1, item: null, duplicate: true, unlockedItems: [] };
  const previousPeak = profile.peakPoints;
  const delta = Math.max(0, Math.min(BOX_POINTS_CAP, safeInteger(box.amount)));
  profile.points += delta;
  profile.peakPoints = Math.max(profile.peakPoints, profile.points);
  let item = null;
  const boxItem = box.itemId ? cosmeticById(box.itemId) : null;
  if (boxItem?.box && !profile.boxItems.includes(boxItem.id)) {
    item = boxItem;
    profile.boxItems = [...profile.boxItems, boxItem.id];
  }
  profile.claimedBoxIds = [...profile.claimedBoxIds, id].slice(-150);
  const saved = savePlayerProfile(profile, storage);
  return { profile: saved, delta, multiplier: Math.max(1, safeInteger(box.multiplier, 1)), item, duplicate: false, unlockedItems: [...(item ? [item] : []), ...newlyUnlockedCosmetics(previousPeak, saved.peakPoints)] };
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
  if (score >= FINAL_TARGET) return { stars: PLAYER_STAR_THRESHOLDS.length, floor: FINAL_TARGET, target: null, ratio: 1, remaining: 0 };
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
  return WIN_REWARDS[Math.min(MAX_AI_STARS, Math.max(1, safeInteger(stars, 1)))];
}

export function lossForStars(stars) {
  return LOSS_PENALTIES[safeInteger(stars, 1)] ?? LOSS_PENALTY;
}

export function bonusMatchChance(points) {
  const score = Math.min(40000, safeInteger(points));
  return Number((0.2 - (score / 40000) * 0.05).toFixed(4));
}

export function rollBonusMatch(points, random = Math.random) {
  return random() < bonusMatchChance(points);
}

export function starsText(stars) {
  return '★'.repeat(Math.min(MAX_AI_STARS, Math.max(1, safeInteger(stars, 1))));
}
