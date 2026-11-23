// 기록 합치기 — 3방향(지난 동기화 기준점 · 이 브라우저 · 서버)
// 시즌 1은 두 쪽 중 큰 값을 골라서 진 점수(−50)가 다음 동기화에 되돌아갔다.
// 기준점이 있으면 「서버 값 + 이 브라우저에서 늘거나 준 만큼」으로 합쳐 패배도 남는다.

export const COUNTERS = Object.freeze(['points', 'wins', 'games', 'losses', 'aiWins', 'aiGames', 'multiWins', 'multiGames', 'seasonXp']);

const int = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : 0;
};
const nonNegative = (value) => Math.max(0, int(value));
const list = (value) => (Array.isArray(value) ? value : []);

function unique(...groups) {
  const seen = new Set();
  return groups.flat().filter((value) => {
    const key = String(value || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sameJson(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function snapshotForBase(profile = {}) {
  return {
    ...Object.fromEntries(COUNTERS.map((key) => [key, nonNegative(profile[key])])),
    peakPoints: nonNegative(profile.peakPoints),
    equipped: profile.equipped ? JSON.parse(JSON.stringify(profile.equipped)) : null,
  };
}

// base 가 없으면(처음 동기화) 예전처럼 큰 값을 고른다 — 어느 쪽 기록도 잃지 않게
export function mergeProfiles3(local = {}, remote = {}, base = null) {
  const merged = {};
  for (const key of COUNTERS) {
    const l = nonNegative(local[key]);
    const r = nonNegative(remote[key]);
    merged[key] = base ? Math.max(0, r + (l - nonNegative(base[key]))) : Math.max(l, r);
  }
  merged.games = Math.max(merged.games, merged.wins);
  merged.losses = Math.max(merged.losses, merged.games - merged.wins);
  merged.aiGames = Math.max(merged.aiGames, merged.aiWins);
  merged.multiGames = Math.max(merged.multiGames, merged.multiWins);
  merged.peakPoints = Math.max(nonNegative(local.peakPoints), nonNegative(remote.peakPoints), merged.points);

  const localChangedEquip = !base || !sameJson(local.equipped, base.equipped);
  const equipped = localChangedEquip ? (local.equipped || remote.equipped) : (remote.equipped || local.equipped);

  return {
    ...remote,
    ...local,
    ...merged,
    version: Math.max(int(local.version), int(remote.version), 4),
    seasonId: local.seasonId || remote.seasonId || 's2',
    awardedMatchIds: unique(list(remote.awardedMatchIds), list(local.awardedMatchIds)).slice(-150),
    boxItems: unique(list(remote.boxItems), list(local.boxItems)),
    claimedBoxIds: unique(list(remote.claimedBoxIds), list(local.claimedBoxIds)).slice(-150),
    recentAiStars: list(local.recentAiStars).length ? list(local.recentAiStars).slice(-2) : list(remote.recentAiStars).slice(-2),
    equipped: equipped || null,
    reducedEffects: typeof local.reducedEffects === 'boolean' ? local.reducedEffects : Boolean(remote.reducedEffects),
  };
}
