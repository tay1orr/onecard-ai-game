// 운영(시즌 1) → 시즌 2 기록 옮김 검사(11-24) — 판수 · 점수 · 장착 · 패스 경험치가 하나도 날아가지 않는지
// 재료(tests/fixtures)는 운영(main 0670f83)의 진짜 시즌 1 코드로 만든 저장 모양 그대로다
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadPlayerProfile, recordMatchResult, PROFILE_KEY, LEGACY_RECORD_KEY, S1_PROFILE_BACKUP_KEY } from '../src/core/rating.js';
import { DEFAULT_EQUIPPED, FIRST_GAME_GIFT } from '../src/core/cosmetics.js';
import { loadMissionDashboard } from '../src/core/missions.js';
import { snapshotForBase } from '../src/core/profile-merge.js';
import { mergeAccountBundles, readLocalAccountBundle } from '../src/net/account.js';

const fixture = (name) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

const COUNTERS = ['points', 'peakPoints', 'wins', 'games', 'losses', 'aiWins', 'aiGames', 'multiWins', 'multiGames'];

// 1) 시즌 2 가 시즌 1 기록을 처음 읽을 때 — 숫자 · 장착 · 받은 판 목록이 그대로, 원본은 따로 떠 둠
const s1 = fixture('s1-storage.json');
const storage = memoryStorage(s1.storage);
const before = JSON.parse(s1.storage[PROFILE_KEY]);
const legacyBefore = JSON.parse(s1.storage[LEGACY_RECORD_KEY]);
const profile = loadPlayerProfile(storage);
for (const key of COUNTERS) assert.equal(profile[key], before[key], `시즌 1 의 ${key} 가 그대로여야 함`);
assert.deepEqual(profile.awardedMatchIds, before.awardedMatchIds, '이미 점수를 받은 판 목록이 그대로여야 함(같은 판 두 번 받기 막기)');
for (const [slot, value] of Object.entries(before.equipped)) assert.deepEqual(profile.equipped[slot], value, `시즌 1 장착(${slot})이 그대로여야 함`);
assert.equal(profile.equipped.avatar, DEFAULT_EQUIPPED.avatar, '시즌 2 에 새로 생긴 내 캐릭터 칸은 기본 캐릭터로');
assert.equal(profile.seasonXp, 0, '시즌 2 패스는 0 부터');
assert.equal(storage.getItem(S1_PROFILE_BACKUP_KEY), s1.storage[PROFILE_KEY], '시즌 1 프로필 원본을 글자 하나 다르지 않게 떠 둬야 함');
assert.equal(JSON.parse(storage.getItem(PROFILE_KEY)).version, 4, '시즌 2 모양으로 한 번 옮겨 적어야 함');
const legacyAfter = JSON.parse(storage.getItem(LEGACY_RECORD_KEY));
assert.equal(legacyAfter.nickname, legacyBefore.nickname, '아주 옛 기록의 다른 값(닉네임)도 남아야 함');
assert.ok(legacyAfter.games >= legacyBefore.games && legacyAfter.wins >= legacyBefore.wins, '아주 옛 기록의 판수 · 승수가 줄면 안 됨');
assert.deepEqual(loadPlayerProfile(storage), profile, '다시 읽어도 똑같아야 함');
assert.doesNotThrow(() => loadMissionDashboard(storage, new Date('2026-11-25T10:00:00+09:00')), '시즌 1 미션 기록도 읽혀야 함');
assert.equal(loadPlayerProfile(storage).points, before.points, '미션을 읽는 것만으로 점수가 바뀌면 안 됨');

// 2) 시즌 2 에서 한 판 이기면 시즌 1 숫자에서 이어서 늘어난다 · 원본 사본은 그대로
const firstGame = recordMatchResult({ won: true, opponentStars: 5, mode: 'ai', matchId: 'ai:s2-first' }, storage);
const next = loadPlayerProfile(storage);
assert.ok(FIRST_GAME_GIFT.every((gift) => next.boxItems.includes(gift.id)), '시즌 2 첫 판을 마치면 크리스마스 세트를 가져야 함');
assert.ok(FIRST_GAME_GIFT.every((gift) => firstGame.unlockedItems.some((item) => item.id === gift.id)), '크리스마스 세트가 결과 화면의 새로 얻은 아이템에 떠야 함');
const secondGame = recordMatchResult({ won: false, opponentStars: 5, mode: 'ai', matchId: 'ai:s2-second' }, storage);
assert.ok(!secondGame.unlockedItems.some((item) => item.gift), '첫 판 선물은 한 번만');
assert.equal(next.games, before.games + 1, '판수는 시즌 1 판수 + 1');
assert.equal(loadPlayerProfile(storage).games, before.games + 2, '둘째 판도 이어서 셈');
assert.equal(next.wins, before.wins + 1, '승수는 시즌 1 승수 + 1');
assert.equal(next.aiGames, before.aiGames + 1, 'AI 판수 + 1');
assert.ok(next.points > before.points && next.peakPoints >= next.points, '점수 · 최고 점수가 이어서 올라야 함');
assert.ok(next.seasonXp > 0, '패스 경험치가 쌓여야 함');
assert.equal(storage.getItem(S1_PROFILE_BACKUP_KEY), s1.storage[PROFILE_KEY], '원본 사본은 다시 덮이지 않아야 함');

// 3) 배포 전부터 열려 있던 시즌 1 탭이 한 판을 더 저장하며 프로필을 옛 모양으로 덮어쓴 뒤
//    (재료는 진짜 시즌 1 코드가 경험치 · 상자 아이템을 버리고 시즌 2 맵을 기본 맵으로 되돌린 상태)
const tab = fixture('s1-tab-after-s2.json');
const tabRaw = JSON.parse(tab.storage[PROFILE_KEY]);
assert.equal(tabRaw.version, 3, '재료: 시즌 1 탭이 옛 모양으로 덮어쓴 상태여야 함');
assert.equal(tabRaw.seasonXp, undefined, '재료: 시즌 1 탭이 경험치를 버린 상태여야 함');
const healed = loadPlayerProfile(memoryStorage(tab.storage));
assert.equal(healed.seasonXp, tab.expect.seasonXp, '패스 경험치가 되살아나야 함');
assert.deepEqual(healed.boxItems, tab.expect.boxItems, '상자에서 얻은 아이템이 되살아나야 함');
assert.ok(tab.expect.claimedBoxIds.every((id) => healed.claimedBoxIds.includes(id)), '이미 연 상자 목록이 되살아나야 함');
assert.equal(healed.equipped.table, tab.expect.table, '시즌 2 장착(맵)이 되살아나야 함');
for (const key of ['games', 'wins', 'points']) assert.equal(healed[key], tab.expect[key], `시즌 1 탭에서 둔 판도 ${key} 에 남아야 함`);

// 4) 서버 기록과 합치기
const local = readLocalAccountBundle(memoryStorage(s1.storage));
// 4-1 처음 동기화(기준점 없음) — 다른 기기가 올린 시즌 1 서버 기록과는 칸마다 큰 값
const remoteS1 = { ...before, games: before.games + 40, wins: before.wins + 25, losses: before.losses + 15, points: before.points - 3000 };
const first = mergeAccountBundles(local, { profile: remoteS1, missionState: {}, hasProfile: true, hasMissionState: false }, null).profile;
assert.equal(first.games, remoteS1.games, '다른 기기에서 둔 판수가 남아야 함');
assert.equal(first.wins, remoteS1.wins, '다른 기기에서 이긴 수가 남아야 함');
assert.equal(first.points, before.points, '이 브라우저의 더 높은 점수가 남아야 함');

// 4-2 시즌 1 탭이 서버까지 덮어쓴 뒤 — 서버는 옛 모양(경험치 없음), 그 탭의 한 판은 이 브라우저에도 이미 들어 있음
const synced = { ...local.profile, seasonXp: 1800 };
const base = snapshotForBase(synced);
const localNow = { ...synced, games: synced.games + 1, wins: synced.wins + 1, aiGames: synced.aiGames + 1, aiWins: synced.aiWins + 1, points: synced.points + 500, peakPoints: synced.peakPoints + 500, seasonXp: 1840 };
const { seasonXp: _dropped, boxItems: _b, claimedBoxIds: _c, seasonId: _s, ...s1Shape } = localNow;
const remoteByOldTab = { ...s1Shape, version: 3 };
const healedMerge = mergeAccountBundles({ ...local, profile: localNow }, { profile: remoteByOldTab, missionState: {}, hasProfile: true, hasMissionState: false }, base).profile;
assert.equal(healedMerge.seasonXp, 1840, '서버에 경험치가 없어도 경험치가 줄면 안 됨');
assert.equal(healedMerge.games, localNow.games, '그 탭의 한 판을 두 번 세면 안 됨');
assert.equal(healedMerge.points, localNow.points, '그 탭의 점수를 두 번 더하면 안 됨');

// 4-3 두 기기 모두 시즌 2 — 보통 3방향: 다른 기기 +2판 · 이 브라우저 +1판 → +3판, 진 점수도 남음
const remoteS2 = { ...synced, version: 4, games: synced.games + 2, wins: synced.wins + 1, losses: synced.losses + 1, points: synced.points + 450, seasonXp: 1800 + 60 };
const localS2 = { ...synced, version: 4, games: synced.games + 1, losses: synced.losses + 1, points: synced.points - 50, seasonXp: 1800 + 20 };
const both = mergeAccountBundles({ ...local, profile: localS2 }, { profile: remoteS2, missionState: {}, hasProfile: true, hasMissionState: false }, base).profile;
assert.equal(both.games, synced.games + 3, '두 기기의 판수가 모두 더해져야 함');
assert.equal(both.points, synced.points + 450 - 50, '다른 기기에서 얻은 점수와 이 브라우저에서 진 점수가 모두 남아야 함');
assert.equal(both.seasonXp, 1800 + 60 + 20, '두 기기의 경험치가 모두 더해져야 함');

console.log('시즌 1 → 시즌 2 기록 옮김 검사 통과');
