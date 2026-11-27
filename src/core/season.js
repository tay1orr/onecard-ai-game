// 시즌 2 — 시즌 패스 경험치 · 단계 · 개막 축제
import { COSMETICS } from './cosmetics.js';

export const SEASON = Object.freeze({
  id: 's2',
  name: '시즌 2',
  startsAt: '2026-11-23',
  endsAt: '2027-03-01',
  tiers: 20,
  xpPerTier: 300,
});

// 개막 축제: 경험치 2배 · 보너스판이 더 자주
export const OPENING_EVENT = Object.freeze({
  id: 's2-opening',
  name: '시즌 2 개막 축제',
  startsAt: '2026-11-23',
  endsBefore: '2026-12-08',
  xpMultiplier: 2,
  bonusChance: 0.3,
});

export const MISSION_XP = 40;

function dayKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function isOpeningEventActive(now = new Date()) {
  const today = dayKey(now);
  return today >= OPENING_EVENT.startsAt && today < OPENING_EVENT.endsBefore;
}

export function openingEventDaysLeft(now = new Date()) {
  if (!isOpeningEventActive(now)) return 0;
  const end = new Date(`${OPENING_EVENT.endsBefore}T00:00:00`);
  return Math.max(1, Math.ceil((end - now) / 86400000));
}

export function xpForMatch({ won, stars = 1, bonus = false, mode = 'ai', now = new Date() } = {}) {
  const safeStars = Math.min(8, Math.max(1, Number(stars) || 1)); // AI 난이도 사이 단계는 옛 별로 소수(4.67 성 …)
  let xp = won ? Math.round(100 + safeStars * 20) : 45;
  if (mode === 'multi') xp += 20;
  if (bonus && won) xp = Math.round(xp * 1.5);
  if (isOpeningEventActive(now)) xp *= OPENING_EVENT.xpMultiplier;
  return xp;
}

export function tierForXp(xp) {
  const value = Math.max(0, Math.floor(Number(xp) || 0));
  return Math.min(SEASON.tiers, Math.floor(value / SEASON.xpPerTier));
}

export function tierProgress(xp) {
  const value = Math.max(0, Math.floor(Number(xp) || 0));
  const tier = tierForXp(value);
  if (tier >= SEASON.tiers) return { tier, into: SEASON.xpPerTier, needed: SEASON.xpPerTier, ratio: 1, maxed: true };
  const into = value - tier * SEASON.xpPerTier;
  return { tier, into, needed: SEASON.xpPerTier, ratio: into / SEASON.xpPerTier, maxed: false };
}

export const PASS_REWARDS = Object.freeze(
  COSMETICS.filter((entry) => entry.pass).sort((a, b) => a.pass - b.pass).map((entry) => ({ tier: entry.pass, itemId: entry.id })),
);

export function bonusChanceWithEvent(baseChance, now = new Date()) {
  return isOpeningEventActive(now) ? Math.max(baseChance, OPENING_EVENT.bonusChance) : baseChance;
}
