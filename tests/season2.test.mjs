// 시즌 2 — 기록 이어 가기 · 그림 파일 · 3방향 병합 · 시즌 패스 · 온라인 다시 받기
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_COSMETICS } from './legacy-cosmetics.mjs';
import { COSMETICS, COSMETIC_SLOTS, TOYS, cosmeticById, isUnlocked, normalizeEquipped, DEFAULT_EQUIPPED } from '../src/core/cosmetics.js';
import { THEMES } from '../src/data/themes.js';
import { RIVALS } from '../src/data/characters.js';
import { mergeProfiles3, snapshotForBase } from '../src/core/profile-merge.js';
import { SEASON, PASS_REWARDS, tierForXp, tierProgress, xpForMatch, isOpeningEventActive } from '../src/core/season.js';
import { PROFILE_KEY, recordMatchResult, loadPlayerProfile } from '../src/core/rating.js';
import { MultiplayerClient } from '../src/net/multiplayer.js';
import { STICKERS } from '../src/ui/reactions.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const motifExists = (key) => fs.existsSync(path.join(root, 'public/assets/s2/m', `${key}.webp`));
const photoExists = (key) => fs.existsSync(path.join(root, 'public/assets/s2/p', `${key}-card.webp`)) && fs.existsSync(path.join(root, 'public/assets/s2/p', `${key}-wide.webp`));
const artExists = (value) => !value || value === 'none' || value === 'suit' || value.startsWith('text:') || (value.startsWith('photo:') ? photoExists(value.slice(6)) : motifExists(value));
const memoryStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => (values.has(key) ? values.get(key) : null), setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
};
let count = 0;
const check = (condition, message) => { assert.ok(condition, message); count += 1; };

// 1. 시즌 1 아이템 87개 — ID · 칸 · 해금 점수 그대로
check(LEGACY_COSMETICS.length === 87, '시즌 1 아이템 목록은 87개');
for (const [id, slot, threshold] of LEGACY_COSMETICS) {
  const item = cosmeticById(id);
  assert.ok(item, `시즌 1 아이템 ${id} 이 남아 있어야 함`);
  assert.equal(item.slot, slot, `${id} 칸이 그대로여야 함`);
  assert.equal(item.threshold, threshold, `${id} 해금 점수가 그대로여야 함`);
}
count += 1;
check(new Set(COSMETICS.map((item) => item.id)).size === COSMETICS.length, '아이템 ID 는 겹치지 않아야 함');
check(COSMETICS.length >= 87 + 30, `시즌 2 새 아이템이 30개 이상 더해져야 함(지금 ${COSMETICS.length - 87}개)`);
check(COSMETIC_SLOTS.every(({ key }) => COSMETICS.some((item) => item.slot === key && item.threshold === 0)), '칸마다 기본 아이템이 있어야 함');

// 2. 그림 파일 — 테마 · 캐릭터 · 장난감 · 스티커가 가리키는 그림이 모두 있어야 함
for (const theme of Object.values(THEMES)) {
  [...theme.decor, ...theme.burst, theme.hero, theme.ace, theme.court.J, theme.court.Q, theme.court.K, theme.back.emblem].forEach((value) => {
    assert.ok(artExists(value), `테마 ${theme.id} 그림 ${value} 이 있어야 함`);
  });
  if (theme.photo) assert.ok(photoExists(theme.photo), `테마 ${theme.id} 사진이 있어야 함`);
}
count += 1;
RIVALS.forEach((rival) => {
  assert.ok(motifExists(rival.motif), `${rival.name} 그림`);
  Object.values(rival.faces).forEach((face) => assert.ok(motifExists(face), `${rival.name} 표정 ${face}`));
  assert.ok(fs.existsSync(path.join(root, 'public/assets/s2/a', `${rival.motif}.webp`)), `${rival.name} 움직이는 판`);
});
count += 1;
Object.values(TOYS).forEach((toy) => { assert.ok(motifExists(toy.motif), `장난감 ${toy.motif}`); (toy.burst || []).forEach((motif) => assert.ok(motifExists(motif), `장난감 소품 ${motif}`)); });
COSMETICS.filter((item) => item.slot === 'avatar').forEach((item) => assert.ok(motifExists(item.motif), `캐릭터 ${item.motif}`));
STICKERS.forEach((sticker) => assert.ok(motifExists(sticker.motif), `스티커 ${sticker.motif}`));
count += 3;
['place', 'slide', 'shuffle', 'jingle-win', 'jingle-lose', 'jingle-onecard', 'jingle-season'].forEach((name) => {
  const file = name.startsWith('jingle') ? name : `card-${name === 'place' ? 'place-1' : name === 'slide' ? 'slide-1' : 'shuffle'}`;
  assert.ok(fs.existsSync(path.join(root, 'public/assets/s2/sfx', `${file}.mp3`)), `소리 ${file}`);
});
count += 1;

// 3. 3방향 병합 — 진 점수가 되돌아가지 않고, 두 기기 기록이 모두 남는다
const base = snapshotForBase({ points: 1000, peakPoints: 1200, wins: 10, games: 20, losses: 10, seasonXp: 300 });
const afterLoss = mergeProfiles3({ points: 950, peakPoints: 1200, wins: 10, games: 21, losses: 11, seasonXp: 345 }, { points: 1000, peakPoints: 1200, wins: 10, games: 20, losses: 10, seasonXp: 300 }, base);
check(afterLoss.points === 950, `패배 −50점이 동기화 뒤에도 남아야 함(지금 ${afterLoss.points})`);
check(afterLoss.games === 21 && afterLoss.losses === 11, '패배 판수가 남아야 함');
const twoDevices = mergeProfiles3({ points: 1250, peakPoints: 1250, wins: 11, games: 21, seasonXp: 460 }, { points: 1180, peakPoints: 1180, wins: 11, games: 21, seasonXp: 440 }, base);
check(twoDevices.points === 1430 && twoDevices.wins === 12 && twoDevices.games === 22, `두 기기에서 늘어난 만큼 모두 더해야 함(점수 ${twoDevices.points}, 승 ${twoDevices.wins})`);
check(twoDevices.peakPoints === 1430, '최고 점수는 합친 점수 이상');
check(twoDevices.seasonXp === 600, '시즌 경험치도 두 기기 몫을 더해야 함');
const firstSync = mergeProfiles3({ points: 300 }, { points: 900 }, null);
check(firstSync.points === 900, '기준점이 없으면(처음 동기화) 어느 쪽도 잃지 않게 큰 값을 골라야 함');

// 4. 시즌 패스
check(tierForXp(0) === 0 && tierForXp(299) === 0 && tierForXp(300) === 1 && tierForXp(99999) === SEASON.tiers, '단계는 300 경험치마다 오르고 20에서 멈춰야 함');
check(tierProgress(450).ratio === 0.5, '단계 안 진행률');
check(PASS_REWARDS.length === SEASON.tiers && PASS_REWARDS.every((reward, index) => reward.tier === index + 1), '패스 보상은 1~20단계에 하나씩');
check(xpForMatch({ won: true, stars: 3, now: new Date('2027-01-10T12:00:00') }) === 160, '3성 승리 경험치 160');
check(xpForMatch({ won: false, now: new Date('2027-01-10T12:00:00') }) === 45, '패배 경험치 45');
check(xpForMatch({ won: true, stars: 3, now: new Date('2026-11-25T12:00:00') }) === 320, '개막 축제 동안 경험치 2배');
check(!isOpeningEventActive(new Date('2026-12-08T09:00:00')), '개막 축제는 12월 7일까지');
check(!isUnlocked(cosmeticById('avatar-fox'), 999999, 0) && isUnlocked(cosmeticById('avatar-fox'), 0, 1), '패스 아이템은 점수가 아니라 단계로 열려야 함');
check(normalizeEquipped({ ...DEFAULT_EQUIPPED, avatar: 'avatar-fox' }, 50000, 0).avatar === 'avatar-rabbit', '단계가 모자라면 패스 아이템을 장착하지 못해야 함');

const passStorage = memoryStorage({ [PROFILE_KEY]: JSON.stringify({ points: 100, peakPoints: 100, wins: 1, games: 2, seasonXp: 290 }) });
const passWin = recordMatchResult({ won: true, opponentStars: 1, mode: 'ai', matchId: 'pass-win' }, passStorage);
check(passWin.xpGained >= 120 && passWin.tier >= 1, '이기면 경험치가 쌓여 단계가 올라야 함');
check(passWin.unlockedItems.some((item) => item.id === 'avatar-fox'), '1단계 보상(여우)이 결과에 함께 나와야 함');
check(loadPlayerProfile(passStorage).seasonXp === 290 + passWin.xpGained, '경험치가 저장돼야 함');

// 5. 온라인 — 버전이 같으면 다시 받지 않고, 받는 중에 온 알림은 한 번 더 받는다
const calls = [];
const client = new MultiplayerClient({ onView: () => {} });
client.roomId = 'room-1';
client.view = { roomId: 'room-1', version: 5, host: {}, guest: {} };
let release;
client.rpc = (name) => { calls.push(name); return new Promise((resolve) => { release = () => resolve({ roomId: 'room-1', version: 6, host: {}, guest: {} }); }); };
client.handleRoomChange({ new: { version: 5, host_last_seen: new Date().toISOString() } });
check(calls.length === 0, '접속 확인처럼 버전이 그대로인 알림은 판을 다시 받지 않아야 함');
client.handleRoomChange({ new: { version: 6 } });
client.handleRoomChange({ new: { version: 7 } });
check(calls.length === 1, '받는 중에는 겹쳐 받지 않아야 함');
release();
await new Promise((resolve) => setTimeout(resolve, 20));
check(calls.length === 2, '받는 중에 온 알림은 끝난 뒤 한 번 더 받아야 함');
release();
await new Promise((resolve) => setTimeout(resolve, 20));
let emote = null;
const emoteClient = new MultiplayerClient({ onEmote: (event) => { emote = event; } });
emoteClient.handleEventInsert({ new: { id: 9, event_type: 'emote', actor_seat: 1, payload: { emote: 'gg' } } });
check(emote?.payload?.emote === 'gg', '스티커는 알림 내용으로 바로 보여 줘야 함');

console.log(`시즌 2 테스트 ${count}개 통과`);
