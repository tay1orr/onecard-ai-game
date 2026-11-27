// 시즌 2 — 기록 이어 가기 · 실사 에셋 파일 · 점수 사다리 · AI 상대 ★6~★8 · 3방향 병합 · 시즌 패스 · 온라인 다시 받기
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_COSMETICS } from './legacy-cosmetics.mjs';
import { COSMETICS, COSMETIC_SLOTS, TOYS, cosmeticById, isUnlocked, normalizeEquipped, DEFAULT_EQUIPPED, charmToyConfig, nextCosmeticUnlock } from '../src/core/cosmetics.js';
import { MAPS, BACKS, FACES, EFFECTS, VICTORIES, lookOf } from '../src/data/looks.js';
import { CHARACTERS, makeRival, pickPersona, shufflePersonas } from '../src/data/characters.js';
import { mergeProfiles3, snapshotForBase } from '../src/core/profile-merge.js';
import { SEASON, PASS_REWARDS, tierForXp, tierProgress, xpForMatch, isOpeningEventActive } from '../src/core/season.js';
import { PROFILE_KEY, recordMatchResult, loadPlayerProfile, MATCH_BANDS, matchmakingWeights, playerStarsForPoints, AI_OPPONENTS, AI_LEVEL_COUNT, WIN_REWARDS, FRIEND_WIN_REWARDS, LOSS_PENALTIES } from '../src/core/rating.js';
import { AI_LEVELS, chooseAiMove, engineFor } from '../src/core/ai-player.js';
import { ELITE_KEYS } from '../src/core/ai-elite.js';
import { OneCardGame } from '../src/core/game-engine.js';
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

// 2. 실사 에셋 파일 — 아이템 모습 · 캐릭터 · 장난감이 가리키는 그림이 모두 있어야 함(Fluent 3D 는 스티커만)
const S2 = path.join(root, 'public/assets/s2');
const has = (rel) => fs.existsSync(path.join(S2, rel));
const missing = [];
const need = (rel, why) => { if (!has(rel)) missing.push(`${rel} (${why})`); };
const needCut = (key, why) => { need(`r/cut/${key}.webp`, why); need(`r/cut/${key}-s.webp`, why); };
const needCourt = (value, set, why) => {
  if (!value) return;
  if (value.startsWith('cut:')) needCut(value.slice(4), why);
  else if (value.startsWith('photo:')) need(`p/${value.slice(6)}-card.webp`, why);
  else if (value.includes('/')) need(`r/court/${value}.webp`, why);
  else need(`r/court/${set}/${value}.webp`, why);
};
Object.entries(MAPS).forEach(([key, map]) => {
  if (map.painted) ['', '-m', '-s'].forEach((suffix) => need(`r/paint/${map.painted}${suffix}.webp`, `맵 ${key}`));
  if (map.scene) ['', '-m', '-s'].forEach((suffix) => need(`r/scene/${map.scene}${suffix}.webp`, `맵 ${key}`));
  [map.top, map.rim].filter((spec) => Array.isArray(spec)).forEach(([tex]) => need(`t/${tex}.webp`, `맵 ${key} 재질`));
  (map.props || []).forEach(([cut]) => needCut(cut, `맵 ${key} 소품`));
});
Object.entries(BACKS).forEach(([key, back]) => {
  if (back.art) ['', '-s'].forEach((suffix) => need(`r/back/${back.art}${suffix}.webp`, `뒷면 ${key}`));
  if (back.paint) ['', '-s'].forEach((suffix) => need(`r/paint/${back.paint}${suffix}.webp`, `뒷면 ${key}`));
  if (back.tex) need(`t/${back.tex}.webp`, `뒷면 ${key} 재질`);
  if (back.paper) need(`t/${back.paper}.webp`, `뒷면 ${key} 종이`);
});
Object.entries(FACES).forEach(([key, face]) => {
  if (face.paper) need(`t/${face.paper}.webp`, `앞면 ${key} 종이`);
  const set = typeof face.court === 'string' ? face.court : null;
  ['K', 'Q', 'J'].forEach((rank) => {
    if (typeof face.court !== 'string') needCourt(face.court?.[rank], null, `앞면 ${key}`);
    else if (face.perSuit) ['S', 'H', 'D', 'C'].forEach((suit) => needCourt(`${rank}${suit}`, set, `앞면 ${key}`));
    else needCourt(rank, set, `앞면 ${key}`);
  });
  const aces = typeof face.ace === 'string' ? [face.ace] : Object.values(face.ace || {});
  aces.forEach((ace) => needCourt(ace, null, `앞면 ${key} 에이스`));
  needCourt(face.joker || 'jokers/joker-1', null, `앞면 ${key} 조커`);
  if (face.frame?.startsWith?.('paint:')) need(`r/paint/${face.frame.slice(6)}.webp`, `앞면 ${key} 테`);
});
Object.entries(EFFECTS).forEach(([key, effect]) => {
  [...effect.sprites, ...(effect.petals || [])].forEach((cut) => needCut(cut, `효과 ${key}`));
  if (effect.band) need(`r/scene/${effect.band}.webp`, `효과 ${key} 사진 띠`);
});
Object.entries(VICTORIES).forEach(([key, victory]) => {
  needCut(victory.hero, `승리 ${key}`);
  [...(victory.sprites || []), ...(victory.petals || []), ...(victory.sweep || [])].forEach((cut) => needCut(cut, `승리 ${key}`));
  (victory.fireworks || []).forEach((scene) => need(`r/scene/${scene}.webp`, `승리 ${key} 불꽃`));
  if (victory.backdrop?.scene) ['', '-s'].forEach((suffix) => need(`r/scene/${victory.backdrop.scene}${suffix}.webp`, `승리 ${key} 배경`));
  if (victory.backdrop?.paint) need(`r/paint/${victory.backdrop.paint}.webp`, `승리 ${key} 배경`);
});
Object.entries(TOYS).forEach(([key, toy]) => { needCut(toy.img, `장난감 ${key}`); (toy.burst || []).forEach((cut) => needCut(cut, `장난감 ${key} 소품`)); });
CHARACTERS.forEach((rival) => needCut(rival.portrait, `상대 ${rival.name}`));
COSMETICS.filter((item) => item.slot === 'avatar').forEach((item) => needCut(item.portrait, `캐릭터 ${item.name}`));
['fire', 'smoke', 'gift-box', 'confetti', 'sword', 'dice', 'chest-mystery', 'chest-mystery-open', 'gold-coins', 'gold-star', 'soap-bubble'].forEach((cut) => needCut(cut, '연출 · 로비 · 승리'));
STICKERS.forEach((sticker) => need(`m/${sticker.motif}.webp`, `스티커 ${sticker.label}`));
assert.deepEqual(missing, [], `없는 에셋 ${missing.length}개:\n  ${missing.slice(0, 40).join('\n  ')}`);
count += 1;
// 모든 아이템은 자기 칸의 모습(또는 장난감 · 캐릭터 그림)을 가리켜야 함
COSMETICS.forEach((item) => {
  if (item.slot === 'charm') assert.ok(item.id === 'charm-classic' || TOYS[item.toy], `장난감 ${item.id} 의 toy`);
  else if (item.slot === 'avatar') assert.ok(item.portrait, `캐릭터 ${item.id} 의 portrait`);
  else assert.ok({ table: MAPS, cardBack: BACKS, cardFace: FACES, effect: EFFECTS, victory: VICTORIES }[item.slot][item.look], `${item.id} 의 모습 ${item.look}`);
});
count += 1;
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
check(!isUnlocked(cosmeticById('avatar-pompompurin'), 999999, 0) && isUnlocked(cosmeticById('avatar-pompompurin'), 0, 1), '패스 아이템은 점수가 아니라 단계로 열려야 함');
check(normalizeEquipped({ ...DEFAULT_EQUIPPED, avatar: 'avatar-pompompurin' }, 50000, 0).avatar === DEFAULT_EQUIPPED.avatar && DEFAULT_EQUIPPED.avatar === 'avatar-choonsik', '단계가 모자라면 패스 아이템을 장착하지 못해야 함(기본은 춘식이)');
check(PASS_REWARDS.filter((reward) => cosmeticById(reward.itemId)?.slot === 'avatar').length === 4 && PASS_REWARDS.every((reward) => !['charm-s2-die', 'effect-s2-thunder', 'effect-s2-spotlight', 'face-s2-league'].includes(reward.itemId)), '패스 캐릭터 넷 · 뺀 보상(주사위 · 번개 · 스포트라이트 · 금박 테)은 없어야 함');

const passStorage = memoryStorage({ [PROFILE_KEY]: JSON.stringify({ points: 100, peakPoints: 100, wins: 1, games: 2, seasonXp: 290 }) });
const passWin = recordMatchResult({ won: true, opponentLevel: 1, mode: 'ai', matchId: 'pass-win' }, passStorage);
check(passWin.xpGained >= 120 && passWin.tier >= 1, '이기면 경험치가 쌓여 단계가 올라야 함');
check(passWin.unlockedItems.some((item) => item.id === 'avatar-pompompurin'), '1단계 보상(폼폼푸린)이 결과에 함께 나와야 함');
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

// 6. 30만 점대 플레이어에 맞춘 사다리 · AI 상대
const ladder = COSMETICS.filter((item) => !item.pass && item.threshold > 0).map((item) => item.threshold).sort((a, b) => a - b);
check(ladder.at(-1) === 1000000, `점수 보상은 100만 점까지 이어져야 함(지금 끝 ${ladder.at(-1)})`);
for (let score = 300000; score < 400000; score += 1000) {
  const next = nextCosmeticUnlock(score);
  assert.ok(next && next.remaining <= 10000, `30만~40만 사이 어디서든 다음 보상이 1만 점 안에 있어야 함(${score}점 → ${next?.remaining})`);
}
count += 1;
for (let score = 400000; score < 1000000; score += 2500) {
  const next = nextCosmeticUnlock(score);
  assert.ok(next && next.remaining <= 30000, `40만~100만 사이 어디서든 다음 보상이 3만 점 안에 있어야 함(${score}점 → ${next?.remaining})`);
}
count += 1;
const roseItems = COSMETICS.filter((item) => (item.tags || []).includes('rose'));
check(roseItems.length >= 40, `장미 아이템이 넉넉해야 함(지금 ${roseItems.length}개)`);
check(COSMETICS.filter((item) => item.threshold > 300000 && item.threshold <= 400000).every((item) => (item.tags || []).length), '30만~40만 보상은 모두 장미 · 꽃이어야 함');
// AI 난이도 20단계(11-27 선생님 「만나는 AI 상대도 왜 2종류의 난이도밖에 없어 — 세분화」)
check(MATCH_BANDS.every((band) => band.weights.length === AI_LEVEL_COUNT && band.weights.reduce((sum, value) => sum + value, 0) === 100), '점수대별 상대 확률은 20단계 합이 100이어야 함');
check(MATCH_BANDS.every((band, index) => index === 0 || band.min === MATCH_BANDS[index - 1].max + 1) && MATCH_BANDS[0].min === 0 && MATCH_BANDS.at(-1).max === Number.POSITIVE_INFINITY, '점수대는 0점부터 빈틈없이 이어져야 함');
const kinds = (points) => matchmakingWeights(points).filter((weight) => weight > 0).length;
check(MATCH_BANDS.every((band) => kinds(band.min) >= 3) && MATCH_BANDS.filter((band) => band.min >= 1500).every((band) => kinds(band.min) >= 4), `점수대마다 난이도가 3~5가지(1,500점부터는 넷 이상) — 지금 ${MATCH_BANDS.map((band) => kinds(band.min)).join(' · ')}`);
check(kinds(36280) >= 4 && kinds(569515) >= 4, '선생님 사진의 두 점수(36,280 · 569,515)도 네 가지 넘게 만남');
const meanLevel = (points) => matchmakingWeights(points).reduce((sum, weight, index) => sum + weight * (index + 1), 0) / 100;
check(MATCH_BANDS.every((band, index) => index === 0 || meanLevel(band.min) > meanLevel(MATCH_BANDS[index - 1].min)), '점수대가 오를수록 만나는 난이도도 올라야 함');
check(matchmakingWeights(49999).slice(8).every((weight) => weight === 0), '5만 점 아래(학생 점수대)는 8단계까지 — 카드를 세는 AI(9단계부터 섞임)가 나오지 않아야 함');
check(matchmakingWeights(330000).slice(10).filter((weight) => weight > 0).length >= 4, '33만 점이면 카드를 세는 · 판을 그려 보는 AI(11단계 이상)를 여러 단계 만나야 함');
check(matchmakingWeights(999999)[19] === 0 && matchmakingWeights(1000000)[19] > 0, '왕관 5단계(20단계 = 옛 ★8) 상대는 100만 점부터');
check(playerStarsForPoints(330000) === 7 && playerStarsForPoints(400000) === 8, '33만 점은 ★7, 40만 점부터 ★8');
check(AI_OPPONENTS.length === AI_LEVEL_COUNT && AI_OPPONENTS.every((opponent, index) => opponent.level === index + 1 && opponent.key === `lv${index + 1}` && opponent.status) && CHARACTERS.length === 15 && new Set(CHARACTERS.map((persona) => persona.id)).size === 15, '난이도 20단계(lv1~lv20, 설명 한 줄씩), 상대 캐릭터 열다섯');
check([1, 2, 3, 5, 8, 11, 15, 20].every((level, index) => AI_OPPONENTS[level - 1].tier === index + 1) && AI_OPPONENTS.every((opponent, index) => index === 0 || opponent.tier > AI_OPPONENTS[index - 1].tier), '옛 ★1~★8 은 1 · 2 · 3 · 5 · 8 · 11 · 15 · 20단계, 옛 별로 친 값은 단계마다 오름');
// 엔진 — 옛 별 자리는 그 엔진 그대로, 사이 단계는 이웃 둘을 섞고(센 쪽 비율이 오름), 16~19단계는 판을 더 많이 그려 봄
const ENGINES = ['star1', 'star2', 'star3', 'star4', 'star5', ...ELITE_KEYS];
check(AI_LEVELS.length === AI_LEVEL_COUNT && AI_LEVELS.every((plan, index) => plan.level === index + 1 && ENGINES.includes(plan.base) && (!plan.up || (ENGINES.includes(plan.up) && plan.mix > 0 && plan.mix < 1 && ENGINES.indexOf(plan.up) === ENGINES.indexOf(plan.base) + 1))), '단계마다 엔진이 있고, 섞는 단계는 바로 위 엔진을 0~1 사이 비율로');
check([1, 2, 3, 5, 8, 11, 15, 20].every((level, index) => AI_LEVELS[level - 1].base === `star${index + 1}` && !AI_LEVELS[level - 1].up), '옛 ★ 자리 단계는 옛 엔진 그대로(섞지 않음)');
const strength = (plan) => ENGINES.indexOf(plan.base) + (plan.up ? plan.mix : 0);
check(AI_LEVELS.every((plan, index) => index === 0 || strength(plan) > strength(AI_LEVELS[index - 1])), '단계가 오를수록 엔진 세기(섞는 비율 포함)가 늘 오름');
check(engineFor('lv13', () => 0.49) === 'star7' && engineFor('lv13', () => 0.51) === 'star6' && engineFor('lv20') === 'star8' && engineFor('star5') === 'star5' && engineFor('lv99') === 'star8', '단계 키는 이번 수의 엔진으로, 옛 키는 그대로');
const sampleRandom = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const sampleGame = new OneCardGame({ random: sampleRandom(5) });
sampleGame.reset('lv1');
check(sampleGame.difficulty === 'lv1', '엔진은 단계 키(lv1~lv20)를 받음');
sampleGame.currentPlayer = 1;
const legalIds = new Set(sampleGame.playableCards(1).map((card) => card.id));
check(AI_LEVELS.every((plan) => { const move = chooseAiMove(sampleGame, `lv${plan.level}`, sampleRandom(plan.level)); return move.type === 'draw' ? legalIds.size === 0 : legalIds.has(move.cardId); }), '20단계 모두 낼 수 있는 카드 가운데서 고름');
check(!CHARACTERS.some((persona) => COSMETICS.some((item) => item.portrait === persona.portrait)), '상대 캐릭터와 내 캐릭터는 겹치지 않아야 함');
const avatars = COSMETICS.filter((item) => item.slot === 'avatar');
check(avatars.length === 14 && avatars.every((item) => item.character && item.portrait.startsWith('char-')), '내 캐릭터는 동물 없이 GPT 캐릭터 열넷뿐(11-24 동물 뺌 · 저녁 일곱 더함)');
check(avatars.filter((item) => item.threshold === 0).length === 3 && avatars.filter((item) => item.pass).length === 4, '셋은 처음부터, 넷은 시즌 패스');
// 선생님 GPT 그림(11-24) — 넣은 그림은 모두 아이템 · 캐릭터로 쓰이고, 그 가운데 상자 전용은 둘뿐
const { GPT_ART } = await import('../src/data/gpt-art.js');
const LOOKS_BY_SLOT = { table: MAPS, cardBack: BACKS, cardFace: FACES };
const gptKeyOf = (slot, look) => ({ table: look?.painted, cardBack: look?.paint, cardFace: look?.frame?.replace?.(/^paint:/, '') }[slot] || '').replace(/^gpt-/, '');
const { BOX_ART, BOX_OPEN_ART } = await import('../src/core/reward-box.js');
const { RANK_UNITS: RANK_ART_UNITS } = await import('../src/core/rank.js');
const gptUsed = new Set([
  BOX_ART, BOX_OPEN_ART, // 보상 상자 그림(셋 모두 같은 상자) · 열린 상자
  ...RANK_ART_UNITS.map((unit) => unit.art), // 내 단계 그림 넷(「레벨단계」가 들어오면)
  ...CHARACTERS.map((persona) => persona.portrait),
  ...COSMETICS.map((item) => item.portrait),
  ...COSMETICS.filter((item) => LOOKS_BY_SLOT[item.slot]).map((item) => gptKeyOf(item.slot, LOOKS_BY_SLOT[item.slot][item.look])),
  ...Object.values(EFFECTS).flatMap((effect) => [...effect.sprites, ...(effect.petals || [])]),
  ...Object.values(MAPS).filter((look) => look.painted).map((look) => `tall-${look.painted}`),
  ...Object.values(VICTORIES).flatMap((look) => [look.hero, (look.backdrop?.paint || '').replace(/^gpt-/, ''), ...(look.sprites || []), ...(look.petals || []), ...(look.sweep || [])]),
]);
const unusedGpt = GPT_ART.filter((key) => !gptUsed.has(key));
check(GPT_ART.length === 221 && unusedGpt.length === 0, `선생님 GPT 그림(캐릭터 29 · 판 19 · 세로 판 26 · 뒷면 14 · 앞면 13 · 승리 배경 6 · 효과 조각 108 · 보상 상자 2 · 단계 그림 4)은 모두 써야 함(지금 ${GPT_ART.length} · 안 쓴 그림: ${unusedGpt.join(', ') || '없음'})`);
// 시즌 2 첫 판 선물 — 크리스마스 다섯 칸, 상자에서는 나오지 않음
const { FIRST_GAME_GIFT } = await import('../src/core/cosmetics.js');
check(FIRST_GAME_GIFT.length === 5 && new Set(FIRST_GAME_GIFT.map((item) => item.slot)).size === 5 && FIRST_GAME_GIFT.every((item) => !item.box && item.set === 'christmas'), '첫 판 선물은 크리스마스 세트 다섯 칸(맵 · 뒷면 · 앞면 · 효과 · 승리)');
const gptBox = COSMETICS.filter((item) => item.box && LOOKS_BY_SLOT[item.slot] && GPT_ART.includes(gptKeyOf(item.slot, LOOKS_BY_SLOT[item.slot][item.look])));
check(gptBox.length === 2, `GPT 그림 아이템 가운데 상자 전용은 둘뿐(지금 ${gptBox.map((item) => item.id).join(', ')})`);
check(!['effect-golden-rose', 'victory-golden-rose', 'charm-golden-rose'].some((id) => cosmeticById(id)) && cosmeticById('table-golden-rose'), '황금 장미 효과 · 피날레 · 장난감은 빼고 맵은 남김(11-24)');
check(Object.values(VICTORIES).every((look) => ['head', 'feet', 'beside', 'behind', 'sky', 'frame'].includes(look.anchor) && ['pan', 'petals', 'flash', 'confetti'].includes(look.transition)), '승리 연출은 모두 붙는 자리 · 넘어가는 방식이 정해져 있어야 함');
check(new Set(Object.values(VICTORIES).map((look) => look.transition)).size === 4 && new Set(Object.values(VICTORIES).map((look) => look.anchor)).size === 6, '넘어가는 방식 넷 · 붙는 자리 여섯이 모두 쓰여야 함(단조롭지 않게)');
// 카드 효과(11-24) — 동작은 정해진 여섯 가운데서, 내려앉는 효과는 실물이 있어야 하고, 빛 리본은 사진이 있어야 함
const MOVES = ['fan', 'ring', 'rise', 'breeze', 'settle', 'sweep'];
check(Object.values(EFFECTS).every((effect) => effect.moves.length && effect.moves.every((move) => MOVES.includes(move)) && (!effect.moves.includes('settle') || effect.sprites.length) && (!effect.moves.includes('sweep') || effect.band) && effect.tone), '카드 효과는 정해진 동작 · 실물 · 빛 색을 가져야 함');
check(new Set(Object.values(EFFECTS).flatMap((effect) => effect.moves)).size === MOVES.length && Object.values(EFFECTS).filter((effect) => effect.moves.length > 1).length >= 18, '동작 여섯이 모두 쓰이고, 대부분의 효과는 동작을 둘 이상 돌려 씀(단조롭지 않게)');
check(CHARACTERS.every((persona) => persona.stars === undefined && persona.key === undefined && persona.name && persona.portrait && persona.lines?.win?.length), '캐릭터에는 별 · 난이도가 붙어 있지 않아야 함(따로 뽑음)');
const seededPick = (seed) => () => { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646; };
const ranked = makeRival(AI_OPPONENTS[14], CHARACTERS[0]);
check(ranked.key === 'lv15' && ranked.level === 15 && ranked.tier === 7 && ranked.elite && ranked.name === CHARACTERS[0].name && ranked.blurb === AI_OPPONENTS[14].status, '상대 = 캐릭터(이름 · 그림 · 대사) + 난이도(단계 · AI 세기 · 설명)');
check(!makeRival(AI_OPPONENTS[9], CHARACTERS[0]).elite && makeRival(AI_OPPONENTS[10], CHARACTERS[0]).elite, '대결 화면의 센 상대 표시는 11단계(옛 ★6)부터');
const pickRandom = seededPick(11);
const facesAtTop = new Set(Array.from({ length: 200 }, () => makeRival(AI_OPPONENTS[19], pickPersona(pickRandom)).name));
check(facesAtTop.size === CHARACTERS.length, `20단계에서도 캐릭터 열다섯이 모두 나와야 함(지금 ${facesAtTop.size})`);
const pairsSeen = new Set(Array.from({ length: 400 }, (_, index) => { const rival = makeRival(AI_OPPONENTS[index % AI_LEVEL_COUNT], pickPersona(pickRandom)); return `${rival.name}:${rival.level}`; }));
check(pairsSeen.size > 40, `캐릭터와 단계가 짝지어지지 않고 섞여야 함(400판에 짝 ${pairsSeen.size}가지)`);
let previous = pickPersona(pickRandom).id;
let repeats = 0;
for (let index = 0; index < 200; index += 1) { const next = pickPersona(pickRandom).id; if (next === previous) repeats += 1; previous = next; }
check(repeats === 0, '바로 전 판과 같은 캐릭터는 다시 나오지 않아야 함');
check(new Set(shufflePersonas(4, seededPick(3)).map((persona) => persona.id)).size === 4, '로비 무대 캐릭터 넷은 서로 달라야 함');
const rewards = Array.from({ length: AI_LEVEL_COUNT }, (_, index) => WIN_REWARDS[index + 1]);
check(rewards.every((reward, index) => reward > 0 && reward % 10 === 0 && (index === 0 || reward > rewards[index - 1])), '센 단계일수록 승리 점수가 커야 함(10점 단위)');
// 11-27 선생님 「친구 대전 · AI 대전 · 상자 점수 20퍼센트 정도 상향」 — 옛 ★ 자리 보상은 옛 값의 1.2배(10점 단위로 반올림)
const OLD_STAR_REWARDS = [125, 180, 250, 340, 500, 700, 1000, 1400];
check([1, 2, 3, 5, 8, 11, 15, 20].every((level, index) => Math.abs(WIN_REWARDS[level] - OLD_STAR_REWARDS[index] * 1.2) <= 5), `옛 ★1~★8 자리 승리 점수는 20% 올림 — ${[1, 2, 3, 5, 8, 11, 15, 20].map((level) => WIN_REWARDS[level]).join(' · ')}`);
check([1, 2, 3, 4, 5].every((stars) => Math.abs(FRIEND_WIN_REWARDS[stars] - OLD_STAR_REWARDS[stars - 1] * 1.2) <= 5), '친구 대전 승리 점수도 20% 올림');
check(Object.values(LOSS_PENALTIES).every((loss, index, list) => loss <= -60 && loss >= -160 && (index === 0 || loss <= list[index - 1])) && LOSS_PENALTIES[11] === -80 && LOSS_PENALTIES[15] === -120 && LOSS_PENALTIES[20] === -160, '잃는 점수는 옛 ★6 · ★7 · ★8 그대로(−80 · −120 · −160), 사이는 고르게');
const eliteStorage = memoryStorage({ [PROFILE_KEY]: JSON.stringify({ points: 330000, peakPoints: 330000, wins: 700, games: 900 }) });
const eliteWin = recordMatchResult({ won: true, opponentLevel: 15, mode: 'ai', matchId: 'elite-win' }, eliteStorage);
check(eliteWin.delta === WIN_REWARDS[15], `15단계(옛 ★7)를 이기면 +${WIN_REWARDS[15]}점(지금 ${eliteWin.delta})`);
const onlineWin = recordMatchResult({ won: true, opponentStars: 8, mode: 'multi', matchId: 'friend-win' }, eliteStorage);
check(onlineWin.delta === FRIEND_WIN_REWARDS[5], '친구 대전 보상은 ★5 까지만(점수 몰아주기 막기)');
const eliteLoss = recordMatchResult({ won: false, opponentLevel: 20, mode: 'ai', matchId: 'elite-loss' }, eliteStorage);
check(eliteLoss.delta === -160, `20단계(옛 ★8)에게 지면 −160점(지금 ${eliteLoss.delta})`);
const friendLoss = recordMatchResult({ won: false, opponentStars: 8, mode: 'multi', matchId: 'friend-loss' }, eliteStorage);
check(friendLoss.delta === -50, `친구 대전에서 지면 −50점(지금 ${friendLoss.delta})`);
check(xpForMatch({ won: true, stars: AI_OPPONENTS[6].tier, now: new Date('2027-01-10T12:00:00') }) === 193, '사이 단계 경험치는 옛 별로 친 값으로(7단계 = 4.67성 → 193)');
check(normalizeEquipped({ cardBack: 'back-s2-emblem', table: 'table-s2-arena' }, 0, 20).cardBack === 'back-classic', '없어진 미리 보기 아이템 ID 는 기본으로 돌아가야 함');
check(charmToyConfig('charm-rose-dome', 0).img === 'rose-dome', '장난감 아이템은 실물 누끼를 가리켜야 함');
check(lookOf('table', 'rose-ballroom').painted === 'rose-ballroom-table', '장미 무도회 맵은 시즌 1 그림을 그대로 써야 함');

// 7. 보상 상자 — 셋 중 하나, 판마다 한 번. 점수는 어느 상자든 늘 있고(기본 × 배수), 상자 전용 아이템은 함께 나올 수 있다
const { rollRewardBoxes, boxBase, veteranBonus, BOX_MULTIPLIERS, BOX_SHARE, expectedBoxPoints } = await import('../src/core/reward-box.js');
const { claimRewardBox } = await import('../src/core/rating.js');
const { BOX_ITEMS } = await import('../src/core/cosmetics.js');
const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
check(Object.entries(WIN_REWARDS).every(([level, reward]) => Math.abs(boxBase({ won: true, level: Number(level) }) - reward * BOX_SHARE.win) < 1e-9), '상자 기본 점수는 그 단계 승리 보상에 비례해야 함(보상이 20% 오르면 상자도 함께)');
check(boxBase({ won: true, level: 15 }) > boxBase({ won: false, level: 15 }) && boxBase({ won: false, level: 15 }) > 0 && Math.abs(boxBase({ won: true, level: 15, bonus: true }) - 2 * boxBase({ won: true, level: 15 })) < 1e-9, '이기면 더 크고, 져도 점수가 있고, 보너스판은 두 배');
// 11-27 선생님 「상자에서 배율이나 아이템이 약간 더 자주」 — ×2 이상 66% → 72%, 아이템 15% · 6% → 20% · 8%
const { BOX_ITEM_CHANCE } = await import('../src/core/reward-box.js');
const multiplierShare = (min) => BOX_MULTIPLIERS.filter((entry) => entry.x >= min).reduce((sum, entry) => sum + entry.weight, 0);
check(multiplierShare(2) === 72 && multiplierShare(5) === 21 && multiplierShare(10) === 7, `배수가 붙는 상자가 조금 더 자주(×2 이상 ${multiplierShare(2)}% · ×5 이상 ${multiplierShare(5)}% · ×10 ${multiplierShare(10)}%)`);
check(BOX_ITEM_CHANCE.win === 0.2 && BOX_ITEM_CHANCE.lose === 0.08, '상자 아이템도 조금 더 자주(이기면 20% · 져도 8%)');
check(veteranBonus(0) === 1 && veteranBonus(99) === 1 && Math.abs(veteranBonus(100) - 1.1) < 1e-9 && Math.abs(veteranBonus(900) - 1.9) < 1e-9 && veteranBonus(5000) === 2, '판수 보너스는 100판마다 +0.1배, 최대 ×2');
check(BOX_MULTIPLIERS.map((entry) => entry.x).join() === '1,2,3,5,10' && BOX_MULTIPLIERS.reduce((sum, entry) => sum + entry.weight, 0) === 100, '배수는 ×1 · ×2 · ×3 · ×5 · ×10(가중치 합 100)');
const someBoxes = Array.from({ length: 200 }, (_, index) => rollRewardBoxes({ won: index % 2 === 0, level: 15, games: 900 }, seeded(index + 7))).flat();
check(someBoxes.every((box) => box.amount >= 10 && box.amount === box.base * box.multiplier && [1, 2, 3, 5, 10].includes(box.multiplier)), '어느 상자든 점수가 있어야 함(기본 × 배수)');
check(someBoxes.some((box) => box.multiplier === 10) && someBoxes.some((box) => box.multiplier === 1), '×10 상자도 가끔 나와야 함');
const itemBoxes = rollRewardBoxes({ won: true, level: 8 }, () => 0.01);
check(itemBoxes.every((box) => box.itemId && box.amount > 0) && new Set(itemBoxes.map((box) => box.itemId)).size === 3, '아이템은 점수와 함께, 세 상자에 서로 다른 것');
check(rollRewardBoxes({ won: true, owned: BOX_ITEMS.map((entry) => entry.id) }, () => 0.01).every((box) => !box.itemId && box.amount > 0), '상자 아이템을 다 가지면 점수만 나와야 함');
check(expectedBoxPoints({ won: true, level: 15, games: 900 }) > 1000, '33만 점대(약 900판)가 15단계(옛 ★7)를 이기면 상자 하나가 평균 1,000점 넘게 줘야 함');
check(BOX_ITEMS.length >= 30 && BOX_ITEMS.every((entry) => entry.threshold === null && !entry.pass), '상자 전용 아이템은 점수 · 패스로 안 열림');
check(BOX_ITEMS.some((entry) => (entry.tags || []).includes('dessert')) && BOX_ITEMS.some((entry) => (entry.tags || []).includes('cute')) && BOX_ITEMS.some((entry) => (entry.tags || []).includes('flower')), '상자에는 디저트 · 귀여운 것 · 꽃이 모두 있어야 함');
const boxStorage = memoryStorage({ [PROFILE_KEY]: JSON.stringify({ points: 330000, peakPoints: 330000, wins: 700, games: 900 }) });
const pointsClaim = claimRewardBox({ matchId: 'm-1', box: { base: 800, multiplier: 3, amount: 2400 } }, boxStorage);
check(pointsClaim.delta === 2400 && pointsClaim.multiplier === 3 && loadPlayerProfile(boxStorage).points === 332400, '상자 점수(기본 × 배수)를 더해야 함');
check(claimRewardBox({ matchId: 'm-1', box: { amount: 2400 } }, boxStorage).duplicate, '같은 판 상자는 한 번만');
const teddy = BOX_ITEMS.find((entry) => entry.id === 'charm-box-teddy-rose');
check(!isUnlocked(teddy, 1000000, 20, []), '상자 전용 아이템은 점수가 높아도 상자 없이는 잠겨 있어야 함');
const itemClaim = claimRewardBox({ matchId: 'm-2', box: { amount: 1500, multiplier: 1, itemId: teddy.id } }, boxStorage);
check(itemClaim.item?.id === teddy.id && itemClaim.delta === 1500 && loadPlayerProfile(boxStorage).boxItems.includes(teddy.id), '아이템이 든 상자는 아이템과 점수를 함께 줘야 함');
const againClaim = claimRewardBox({ matchId: 'm-3', box: { amount: 900, multiplier: 1, itemId: teddy.id } }, boxStorage);
check(againClaim.item === null && againClaim.delta === 900, '이미 가진 아이템이면 점수만');
check(claimRewardBox({ matchId: 'm-4', box: { amount: 999999 } }, boxStorage).delta === 36000, '상자 하나 점수는 3만 6천 점을 넘지 않음(11-27 점수 20% 올리며 상한도 함께)');
check(normalizeEquipped({ charms: [teddy.id] }, 330000, 0, [teddy.id]).charms[0] === teddy.id && normalizeEquipped({ charms: [teddy.id] }, 330000, 0, []).charms[0] === 'charm-classic', '상자 아이템은 가졌을 때만 장착');
const mergedBox = mergeProfiles3({ boxItems: ['charm-box-hedgehog'], claimedBoxIds: ['box:a'] }, { boxItems: ['charm-box-duckling'], claimedBoxIds: ['box:b'] }, base);
check(mergedBox.boxItems.length === 2 && mergedBox.claimedBoxIds.length === 2, '두 기기의 상자 아이템 · 받은 상자를 모두 남겨야 함');

// 운영에 올릴 때 넣는 SQL · 휴면 막기(11-24)
const launchSql = fs.readFileSync(path.join(root, 'supabase/2026-11-24-season2-launch.sql'), 'utf8');
check(launchSql.includes("v_card_back !~ '^back-[a-z0-9-]{1,48}$'"), '운영 SQL 은 카드 뒷면을 이름 모양(back-…)으로 받아야 함');
const missingBacks = COSMETICS.filter((entry) => entry.slot === 'cardBack' && !/^back-[a-z0-9-]{1,48}$/.test(entry.id)).map((entry) => entry.id);
check(missingBacks.length === 0, `카드 뒷면 이름이 back-… 모양이 아니면 온라인 상대에게 클래식으로 보임: ${missingBacks.join(', ')}`);
check(launchSql.includes('grant execute on function public.onecard_keepalive() to anon'), '휴면 막기 함수는 공개 키(anon)로 부를 수 있어야 함');
const { keepAlive } = await import('../api/keepalive.js');
let keepCall = null;
const keepOk = await keepAlive(async (url, init) => { keepCall = { url, init }; return { ok: true, status: 200, text: async () => '"2026-11-25T00:00:00+00:00"' }; }, { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' });
check(keepOk.ok && keepCall.url === 'https://example.supabase.co/rest/v1/rpc/onecard_keepalive' && keepCall.init.method === 'POST' && keepCall.init.headers.apikey === 'sb_publishable_test', '휴면 막기는 공개 키로 onecard_keepalive 를 부름');
const keepMissing = await keepAlive(async () => ({ ok: false, status: 404, text: async () => '{"code":"PGRST202"}' }), { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' });
check(!keepMissing.ok && keepMissing.status === 404, 'SQL 을 아직 안 넣었으면 실패로 알려야 함');
check(!/service_role|sb_secret_/.test(fs.readFileSync(path.join(root, 'api/keepalive.js'), 'utf8')), '휴면 막기에 비밀 키를 쓰지 않음');
const keepCron = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).crons?.find((entry) => entry.path === '/api/keepalive');
check(keepCron && /^\d{1,2} \d{1,2} \* \* \*$/.test(keepCron.schedule), 'Vercel 예약 실행은 하루 한 번(무료 요금제 한도)');

// 내 단계(11-25) — 금별 · 루비 · 분홍 장미 · 왕관 다섯 단계씩 20단계, 마지막 왕관 5단계 = 100만 점(시즌 목표)
const { RANK_UNITS, RANK_LEVELS, rankForPoints } = await import('../src/core/rank.js');
const { FINAL_TARGET } = await import('../src/core/rating.js');
const rankAt = (points) => { const rank = rankForPoints(points); return `${rank.unit}${rank.count}`; };
check(RANK_LEVELS === 20 && RANK_UNITS.every((unit) => unit.thresholds.length === 5), '단계는 네 가지 × 다섯 단계 = 20');
const rankMins = RANK_UNITS.flatMap((unit) => unit.thresholds);
check(rankMins[0] === 0 && rankMins.every((min, index) => index === 0 || min > rankMins[index - 1]) && rankMins.at(-1) === FINAL_TARGET, '단계 점수는 0 에서 시작해 늘 오르고 마지막이 100만 점');
check(rankAt(0) === 'star1' && rankAt(999) === 'star1' && rankAt(1000) === 'star2' && rankAt(25999) === 'star4' && rankAt(26000) === 'star5' && rankAt(41999) === 'star5', '금별 경계(2만 6천 점에서 금별 5)');
check(rankAt(42000) === 'ruby1' && rankAt(160000) === 'ruby5' && rankAt(199999) === 'ruby5' && rankAt(200000) === 'rose1', '루비 → 분홍 장미 경계');
check(rankAt(335000) === 'rose3' && rankAt(540000) === 'crown1' && rankAt(1000000) === 'crown5' && rankAt(5000000) === 'crown5' && rankForPoints(1000000).next === null, '분홍 장미 → 왕관, 100만 점이 마지막(다음 없음)');
check(rankForPoints(41999).next?.name === '루비 1단계' && rankForPoints(-5).level === 1 && rankForPoints('abc').level === 1, '다음 단계 이름 · 이상한 점수는 1단계');
// AI 난이도도 내 단계와 같은 20단계 이름 · 그림(11-27) — 36,280점(금별 5)은 금별 5 ~ 루비 3, 569,515점(왕관 1)은 분홍 장미 4 ~ 왕관 2 를 만남
const { rankForLevel } = await import('../src/core/rank.js');
const unitsAt = (points) => matchmakingWeights(points).map((weight, index) => (weight > 0 ? `${rankForLevel(index + 1).unit}${rankForLevel(index + 1).count}` : null)).filter(Boolean).join(',');
check(unitsAt(36280) === 'star5,ruby1,ruby2,ruby3' && unitsAt(569515) === 'rose4,rose5,crown1,crown2', `만나는 난이도 단계 — 36,280점 ${unitsAt(36280)} · 569,515점 ${unitsAt(569515)}`);
check(rankForLevel(0).level === 1 && rankForLevel(99).level === 20, '벗어난 단계는 끝에 맞춤');

// 배경음악 목록(scripts/build-music.mjs) — 넣은 곡은 파일이 있고 장면은 로비 · 대전뿐, 출처가 적혀 있음
const { MUSIC } = await import('../src/data/music.js');
check(MUSIC.every((track) => ['lobby', 'game'].includes(track.scene) && fs.existsSync(path.join(root, 'public/assets/s2/bgm', `${track.file}.mp3`)) && track.title && track.license), `배경음악 ${MUSIC.length}곡은 파일 · 장면 · 출처가 맞아야 함`);

console.log(`시즌 2 테스트 ${count}개 통과`);
