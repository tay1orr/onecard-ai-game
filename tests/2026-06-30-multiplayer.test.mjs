import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  getSeatView,
  isMyTurn,
  normalizeNickname,
  normalizeRoomCode,
  validateNickname,
  validateRoomCode,
} from '../src/2026-06-30-multiplayer-helpers.js';
import { calculateCardFlight } from '../src/2026-06-30-card-motion.js';

let passed = 0;
function test(name, callback) {
  callback();
  passed += 1;
  console.log(`✓ ${name}`);
}

test('방 코드는 혼동 문자를 빼고 대문자 6자리로 정리한다', () => {
  assert.equal(normalizeRoomCode(' abci01-z29 '), 'ABCZ29');
});

test('방 코드는 정확히 6자리여야 한다', () => {
  assert.throws(() => validateRoomCode('ABC2'), /6자리/);
  assert.equal(validateRoomCode('abc234'), 'ABC234');
});

test('닉네임 공백과 길이를 안전하게 정리한다', () => {
  assert.equal(normalizeNickname('  카드   왕자님  '), '카드 왕자님');
  assert.equal(normalizeNickname('123456789012345'), '123456789012');
  assert.throws(() => validateNickname('A'), /2자/);
});

test('내 좌석에 따라 상대 정보를 뒤집어 제공한다', () => {
  const base = { host: { nickname: '호스트' }, guest: { nickname: '게스트' } };
  assert.equal(getSeatView({ ...base, mySeat: 0 }).mine.nickname, '호스트');
  assert.equal(getSeatView({ ...base, mySeat: 1 }).opponent.nickname, '호스트');
});

test('플레이 중이며 현재 좌석이 나일 때만 내 턴이다', () => {
  assert.equal(isMyTurn({ status: 'playing', currentSeat: 1, mySeat: 1 }), true);
  assert.equal(isMyTurn({ status: 'dice', currentSeat: 1, mySeat: 1 }), false);
  assert.equal(isMyTurn({ status: 'playing', currentSeat: 0, mySeat: 1 }), false);
});

test('카드 이동은 양쪽 카드 중심을 정확히 연결한다', () => {
  const flight = calculateCardFlight(
    { left: 100, top: 500, width: 100, height: 150 },
    { left: 430, top: 210, width: 110, height: 165 },
  );
  assert.equal(flight.x, 335);
  assert.equal(flight.y, -282.5);
  assert.equal(flight.scale, 1.1);
  assert.ok(flight.arc >= 30 && flight.arc <= 76);
});

const sql = await readFile(new URL('../supabase/2026-06-30-onecard-schema.sql', import.meta.url), 'utf8');
const onlineHtml = await readFile(new URL('../2026-06-30-online.html', import.meta.url), 'utf8');
const onlineMain = await readFile(new URL('../src/2026-06-30-online-main.js', import.meta.url), 'utf8');
const aiHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const aiMain = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

function assertReferencedIdsExist(html, source) {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const bracketRefs = [...source.matchAll(/els\['([^']+)'\]/g)].map((match) => match[1]);
  const dotRefs = [...source.matchAll(/\bels\.([a-zA-Z][\w-]*)/g)].map((match) => match[1]);
  const missing = [...new Set([...bracketRefs, ...dotRefs])].filter((id) => !ids.has(id));
  assert.deepEqual(missing, []);
}

test('AI와 온라인 화면의 모든 요소 참조가 실제 HTML에 존재한다', () => {
  assertReferencedIdsExist(aiHtml, aiMain);
  assertReferencedIdsExist(onlineHtml, onlineMain);
});

test('서버 SQL은 비공개 패 테이블에 클라이언트 정책을 열지 않는다', () => {
  assert.match(sql, /onecard_private_state enable row level security/i);
  assert.doesNotMatch(sql, /create policy[^;]+onecard_private_state/is);
});

test('서버 SQL은 턴과 화면 버전을 모두 검증한다', () => {
  assert.match(sql, /NOT_YOUR_TURN/);
  assert.match(sql, /STALE_VERSION/);
  assert.match(sql, /p_expected_version/);
});

test('서버 SQL은 같은 숫자 7과 조커 공격 규칙을 지원한다', () => {
  assert.match(sql, /v_rank = v_room\.top_card->>'rank'/);
  assert.match(sql, /when 'JOKER' then 5/);
  assert.match(sql, /p_chosen_suit is null/);
});

console.log(`멀티플레이 도우미·보안 테스트 ${passed}개 통과`);
