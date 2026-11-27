import { DEFAULT_EQUIPPED, FIRST_GAME_GIFT, cosmeticById, isOwnedItemId, newlyUnlockedByPass, newlyUnlockedCosmetics, normalizeEquipped } from './cosmetics.js';
import { tierForXp, xpForMatch } from './season.js';

export const LEGACY_RECORD_KEY = 'onecard-record';
export const LEGACY_BACKUP_KEY = 'onecard-record-backup-v1';
export const PROFILE_KEY = 'onecard-player-profile-v2';
// 운영에 올릴 때 기록을 지키는 열쇠 둘(11-24)
// · S1_PROFILE_BACKUP_KEY 시즌 1 프로필 원본을 처음 한 번 그대로 떠 둔다(무엇이 잘못돼도 되살릴 수 있게)
// · S2_PROGRESS_KEY 시즌 2 에만 있는 값(패스 경험치 · 상자 아이템 · 장착)을 따로도 적는다
//   배포 전부터 열려 있던 시즌 1 탭은 프로필을 옛 모양으로 덮어쓰며 이 값들을 버리는데, 그래도 여기서 되살아난다
//   줄어들지 않는 값이라 큰 값 · 합침으로 지킨다 — 시즌을 새로 열 때는 이 열쇠도 함께 비운다
export const S1_PROFILE_BACKUP_KEY = 'onecard-player-profile-s1-backup';
export const S2_PROGRESS_KEY = 'onecard-s2-progress-v1';

// AI 상대 난이도 — 내 단계와 같은 20단계(금별 1단계 ~ 왕관 5단계 그림 · 이름, 11-27 선생님 「만나는 AI 상대도 왜 2종류의 난이도밖에 없어 — 세분화」).
// 옛 ★1~★8 AI 는 1 · 2 · 3 · 5 · 8 · 11 · 15 · 20단계에 그대로 두고, 사이 단계는 이웃 두 AI 를 섞어 세기가 고르게 오른다(core/ai-player.js AI_LEVELS).
// tier = 옛 별로 치면 몇 성인지(경험치 · 생각하는 시간 · 반응에 씀). status = 대결 화면 · 게임판 · 만나는 상대 창에 나오는 한 줄
export const AI_LEVEL_COUNT = 20;
export const AI_OPPONENTS = Object.freeze([
  { level: 1, tier: 1, status: '마음 가는 카드를 고르고 있어요' },
  { level: 2, tier: 2, status: '무늬와 공격 카드를 살펴봐요' },
  { level: 3, tier: 3, status: '좋은 수를 생각하고 있어요' },
  { level: 4, tier: 3.5, status: '좋은 수 몇 가지를 견줘 봐요' },
  { level: 5, tier: 4, status: '최선과 차선의 흐름을 계산해요' },
  { level: 6, tier: 4.33, status: '가끔 한 수 앞을 읽어요' },
  { level: 7, tier: 4.67, status: '한 수 앞을 자주 읽어요' },
  { level: 8, tier: 5, status: '공개된 정보로 다음 수를 읽어요' },
  { level: 9, tier: 5.33, status: '가끔 나온 카드를 세어 봐요' },
  { level: 10, tier: 5.67, status: '나온 카드를 자주 세어 봐요' },
  { level: 11, tier: 6, status: '지나간 카드를 모두 기억해요' },
  { level: 12, tier: 6.25, status: '가끔 나올 카드를 그려 봐요' },
  { level: 13, tier: 6.5, status: '나올 카드를 자주 그려 봐요' },
  { level: 14, tier: 6.75, status: '거의 늘 나올 카드를 그려 보고 골라요' },
  { level: 15, tier: 7, status: '나올 카드를 수백 번 그려 봐요' },
  { level: 16, tier: 7.2, status: '나올 카드를 더 많이 그려 봐요' },
  { level: 17, tier: 7.4, status: '좋은 수에 생각을 몰아 써요' },
  { level: 18, tier: 7.6, status: '판을 끝까지 여러 번 두어 봐요' },
  { level: 19, tier: 7.8, status: '아주 깊이 읽고 골라요' },
  { level: 20, tier: 8, status: '가장 깊이 읽고 골라요' },
].map((entry) => Object.freeze({ key: `lv${entry.level}`, ...entry })));
export const MAX_AI_STARS = 8;
export const BONUS_MATCH_MULTIPLIER = 2;

// AI 대전 승리 점수 — 옛 ★ 보상(125 · 180 · 250 · 340 · 500 · 700 · 1,000 · 1,400)을 단계 사이에 고르게 펴고
// 20% 올림(11-27 선생님 「친구 대전 · AI 대전 · 상자 점수 20퍼센트 정도 상향」), 10점 단위
export const WIN_REWARDS = Object.freeze({
  1: 150, 2: 220, 3: 300, 4: 350, 5: 410, 6: 470, 7: 540, 8: 600, 9: 680, 10: 760,
  11: 840, 12: 930, 13: 1020, 14: 1110, 15: 1200, 16: 1300, 17: 1390, 18: 1490, 19: 1580, 20: 1680,
});
// 지면 −50점, 9단계부터 조금씩 더 잃는다(옛 ★6 −80 · ★7 −120 · ★8 −160 그대로 — 잃는 점수는 올리지 않음)
export const LOSS_PENALTY = -50;
export const LOSS_PENALTIES = Object.freeze({ 9: -60, 10: -70, 11: -80, 12: -90, 13: -100, 14: -110, 15: -120, 16: -130, 17: -140, 18: -140, 19: -150, 20: -160 });
// 친구 대전 승리 점수 — 상대 점수의 별(★1~★5, 서로 점수 몰아주기 막기로 ★5 까지). 옛 125 · 180 · 250 · 340 · 500 에서 20% 올림
export const FRIEND_WIN_REWARDS = Object.freeze({ 1: 150, 2: 220, 3: 300, 4: 410, 5: 600 });

// 점수대별로 만나는 AI 난이도(단계: %) — 옛 ★1~★8 표를 20단계로 펴되 점수대마다 판당 기대 점수(판 + 상자)는 옛 표와 같게 맞췄다
// (가운데 단계 둘레로 3~5가지, 계산은 tests/economy-sim.mjs 의 가정 승률로). 5만 점 아래(학생 점수대)는 옛 표처럼 카드를 세는 AI(9단계부터 섞임)가 안 나오게 8단계까지.
// 100만 점을 넘으면 왕관 5단계까지
const band = (min, max, odds) => Object.freeze({ min, max, weights: Object.freeze(Array.from({ length: AI_LEVEL_COUNT }, (_, index) => odds[index + 1] || 0)) });
export const MATCH_BANDS = Object.freeze([
  band(0, 499, { 1: 54, 2: 37, 3: 9 }),
  band(500, 1499, { 1: 22, 2: 41, 3: 29, 4: 8 }),
  band(1500, 3499, { 1: 4, 2: 19, 3: 39, 4: 30, 5: 8 }),
  band(3500, 6999, { 2: 3, 3: 19, 4: 39, 5: 30, 6: 9 }),
  band(7000, 10999, { 3: 4, 4: 19, 5: 39, 6: 30, 7: 8 }),
  band(11000, 14999, { 4: 6, 5: 25, 6: 40, 7: 24, 8: 5 }),
  band(15000, 19999, { 5: 12, 6: 35, 7: 38, 8: 15 }),
  band(20000, 49999, { 5: 3, 6: 20, 7: 43, 8: 34 }),
  band(50000, 99999, { 6: 3, 7: 18, 8: 39, 9: 31, 10: 9 }),
  band(100000, 199999, { 9: 11, 10: 34, 11: 39, 12: 16 }),
  band(200000, 299999, { 10: 4, 11: 20, 12: 39, 13: 29, 14: 8 }),
  band(300000, 399999, { 12: 4, 13: 19, 14: 39, 15: 30, 16: 8 }),
  band(400000, 599999, { 14: 10, 15: 32, 16: 40, 17: 18 }),
  band(600000, 999999, { 15: 9, 16: 30, 17: 39, 18: 19, 19: 3 }),
  band(1000000, Number.POSITIVE_INFINITY, { 17: 13, 18: 37, 19: 37, 20: 13 }),
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

// 가진 아이템 — 상자에서 얻은 것과 시즌 2 첫 판 선물만, 겹치지 않게
export function boxItemList(value) {
  return Array.isArray(value) ? [...new Set(value.map(String))].filter(isOwnedItemId) : [];
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
    recentAiStars: Array.isArray(saved.recentAiStars) ? saved.recentAiStars.filter((value) => value >= 1 && value <= AI_LEVEL_COUNT).slice(-2) : [], // 이름은 옛 그대로, 값은 AI 난이도 단계(11-27 부터 1~20)
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

// AI 대전은 상대 난이도 단계(opponentLevel 1~20)로, 친구 대전은 상대 점수의 별(opponentStars, ★5 까지 — 서로 점수 몰아주기 막기)로 셈
export function recordMatchResult({ won, opponentLevel = 1, opponentStars = 1, mode = 'ai', matchId, bonusMultiplier: requestedMultiplier = 1 }, storage = defaultStorage()) {
  const profile = loadPlayerProfile(storage);
  const friend = mode === 'multi';
  const level = Math.min(AI_LEVEL_COUNT, Math.max(1, safeInteger(opponentLevel, 1)));
  const friendStars = Math.min(5, Math.max(1, safeInteger(opponentStars, 1)));
  const id = String(matchId || `${mode}:${Date.now()}`);
  if (profile.awardedMatchIds.includes(id)) return { profile, delta: 0, duplicate: true };

  const bonusMultiplier = Math.max(1, Math.min(BONUS_MATCH_MULTIPLIER, safeInteger(requestedMultiplier, 1)));
  const baseDelta = friend ? (won ? FRIEND_WIN_REWARDS[friendStars] : LOSS_PENALTY) : (won ? WIN_REWARDS[level] : lossForLevel(level));
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
  const xpGained = xpForMatch({ won, stars: friend ? friendStars : aiTier(level), bonus: bonusMultiplier > 1, mode });
  profile.seasonXp = safeInteger(profile.seasonXp) + xpGained;
  const tier = tierForXp(profile.seasonXp);
  // 시즌 2 첫 판 선물(크리스마스 세트) — 아직 없으면 이 판으로 받는다. 결과 화면의 새로 얻은 아이템에 함께 뜬다
  const gifts = FIRST_GAME_GIFT.filter((entry) => !profile.boxItems.includes(entry.id));
  if (gifts.length) profile.boxItems = [...profile.boxItems, ...gifts.map((entry) => entry.id)];
  return {
    profile: savePlayerProfile(profile, storage),
    delta,
    baseDelta,
    bonusMultiplier,
    duplicate: false,
    xpGained,
    previousTier,
    tier,
    unlockedItems: [...newlyUnlockedCosmetics(previousPeak, profile.peakPoints), ...newlyUnlockedByPass(previousTier, tier), ...gifts],
  };
}

// 보상 상자 받기 — 판마다 한 번(matchId). 점수는 늘 받고(기본 × 배수), 상자 전용 아이템이 함께 들어 있으면 그것도 받는다.
// 한 상자 점수 상한 3만 6천 점(20단계 · 보너스판 · 판수 ×2 · ×10 이 겹쳐도 넘지 않음 — 11-27 점수 20% 올리며 상한도 함께)
export const BOX_POINTS_CAP = 36000;
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

export function rememberAiOpponent(profile, level, storage = defaultStorage()) {
  profile.recentAiStars = [...(profile.recentAiStars || []), level].slice(-2);
  return savePlayerProfile(profile, storage);
}

const clampLevel = (level) => Math.min(AI_LEVEL_COUNT, Math.max(1, safeInteger(level, 1)));

export function rewardForLevel(level) {
  return WIN_REWARDS[clampLevel(level)];
}

export function lossForLevel(level) {
  return LOSS_PENALTIES[clampLevel(level)] ?? LOSS_PENALTY;
}

// 그 단계를 옛 별로 치면 몇 성인지(1~8, 소수) — 경험치 · 생각하는 시간 · 반응
export function aiTier(level) {
  return AI_OPPONENTS[clampLevel(level) - 1].tier;
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
