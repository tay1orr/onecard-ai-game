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
import { createDealSequence } from '../src/2026-06-30-deal-animation.js';
import { REACTIONS } from '../src/2026-06-30-reactions.js';

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

test('시작 배분은 상대와 나에게 번갈아 5장씩 나눈다', () => {
  const sequence = createDealSequence();
  assert.equal(sequence.length, 10);
  assert.equal(sequence.filter((item) => item.toPlayer).length, 5);
  assert.deepEqual(sequence.slice(0, 4).map((item) => item.toPlayer), [false, true, false, true]);
});

const sql = await readFile(new URL('../supabase/2026-06-30-onecard-schema.sql', import.meta.url), 'utf8');
const onlineHtml = await readFile(new URL('../2026-06-30-online.html', import.meta.url), 'utf8');
const onlineMain = await readFile(new URL('../src/2026-06-30-online-main.js', import.meta.url), 'utf8');
const aiHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const aiMain = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const baseCss = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const cosmeticsCss = await readFile(new URL('../2026-07-06-cosmetics.css', import.meta.url), 'utf8');
const reactionsCss = await readFile(new URL('../2026-07-01-reactions.css', import.meta.url), 'utf8');
const multiplayerClient = await readFile(new URL('../src/2026-06-30-multiplayer.js', import.meta.url), 'utf8');

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

test('AI 결과 화면은 같은 상대 재대결 없이 반드시 다시 매칭한다', () => {
  assert.doesNotMatch(aiHtml, /같은 상대와 다시 하기/);
  assert.match(aiHtml, /id="match-again-button"[^>]*>다시 매칭하기</);
  assert.match(aiHtml, /id="result-home-button"[^>]*>홈으로</);
  assert.match(aiMain, /function matchAgain\(\)[\s\S]*?setTimeout\(beginAiMatchmaking, 520\)/);
});

test('꾸미기 보관함은 잠긴 아이템도 미리 보고 해금된 아이템만 장착한다', () => {
  assert.match(aiHtml, /id="cosmetic-preview-board"/);
  assert.match(aiHtml, /id="cosmetic-preview-replay"/);
  assert.match(aiHtml, /id="cosmetic-preview-equip"/);
  assert.match(aiMain, /let previewCosmeticId = null/);
  assert.match(aiMain, /button\.addEventListener\('click', \(\) => \{\s*previewCosmeticId = item\.id/);
  assert.match(aiMain, /if \(!item \|\| item\.threshold > \(playerProfile\.peakPoints \|\| 0\)\) return/);
  assert.match(aiMain, /playerProfile\.equipped = \{ \.\.\.playerProfile\.equipped, \[item\.slot\]: item\.id \}/);
  assert.doesNotMatch(aiMain, /if \(item\.legendary\)[\s\S]*?equipped\[candidate\.slot\]/);
  assert.match(aiMain, /void root\.offsetWidth/);
  assert.match(aiMain, /\[\{ key: 'all', name: '전체보기' \}, \.\.\.COSMETIC_SLOTS\]/);
  assert.match(aiMain, /activeCosmeticSlot === 'all'/);
  assert.match(aiHtml, /id="cosmetic-preview-face" class="playing-card red-card/);
  assert.match(aiHtml, />내가 보는 앞면</);
  assert.match(aiHtml, /data-cosmetic-preview-mode="normal"/);
  assert.match(aiHtml, /data-cosmetic-preview-mode="effect"/);
  assert.match(aiHtml, /data-cosmetic-preview-mode="victory"/);
  assert.match(cosmeticsCss, /\.cosmetic-preview-card\s*\{\s*width:var\(--card-w\);\s*height:var\(--card-h\);\s*\}/);
  assert.match(cosmeticsCss, /grid-template-columns:minmax\(0,1fr\); grid-template-rows:auto minmax\(0,1fr\) auto auto/);
  assert.match(cosmeticsCss, /grid-template-rows:auto minmax\(0,1fr\) auto auto/);
  assert.match(cosmeticsCss, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(aiMain, /Number\(a\.threshold === 0\) - Number\(b\.threshold === 0\)/);
  assert.match(aiMain, /data\.cosmeticState|dataset\.cosmeticState/);
});

test('홈은 대전 선택을 꾸미기함보다 먼저 보여주고 게임 안내와 반응 도크를 또렷하게 배치한다', () => {
  assert.ok(aiHtml.indexOf('class="mode-grid"') < aiHtml.indexOf('id="cosmetics-button"'));
  assert.match(baseCss, /\.home-screen \.hero \{ min-height:280px/);
  assert.match(baseCss, /\.action-hint \{[^}]*font-size:13px/);
  assert.match(reactionsCss, /\.ai-reaction-dock \{ left:auto; right:18px; top:22%/);
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

test('온라인 시작 패는 양쪽 5장이고 남은 덱은 11번째 카드부터 구성한다', () => {
  assert.match(sql, /position between 1 and 5/);
  assert.match(sql, /position between 6 and 10/);
  assert.match(sql, /position > 10 and position <> v_top_position/);
  assert.match(sql, /host_count = 5, guest_count = 5/);
});

test('서버 SQL은 준비 취소와 같은 방 재대결을 지원한다', () => {
  assert.match(sql, /v_ready := not \(case when v_seat = 0 then v_room\.host_ready else v_room\.guest_ready end\)/);
  assert.match(sql, /onecard_request_rematch/);
  assert.match(sql, /rematch_started/);
  assert.match(sql, /grant execute on function public\.onecard_request_rematch\(uuid\) to authenticated/);
});

test('같은 방 승패는 승리 시 누적되고 새 상대가 들어오면 초기화된다', () => {
  assert.match(sql, /add column if not exists host_wins integer not null default 0/);
  assert.match(sql, /'wins', v_room\.host_wins/);
  assert.match(sql, /host_wins = host_wins \+ case when jsonb_array_length\(v_new_hand\) = 0 and v_seat = 0 then 1 else 0 end/);
  assert.match(sql, /host_wins = 0, guest_wins = 0/);
});

test('조커 공격 뒤 자유 내기를 지원하고 Q와 K는 2인전 일반 카드로 처리한다', () => {
  assert.match(sql, /add column if not exists free_play boolean not null default false/);
  assert.match(sql, /elsif not v_room\.free_play and not/);
  assert.match(sql, /free_play = v_room\.attack_count > 0 and v_room\.top_card->>'rank' = 'JOKER'/);
  assert.match(sql, /v_next_seat := case when v_rank = 'J' then v_seat else 1 - v_seat end/);
  assert.match(sql, /'extraTurn', v_rank = 'J'/);
  assert.doesNotMatch(sql, /v_rank in \('J', 'K'\)/);
});

test('온라인 조커 공격은 조커로만 방어하도록 서버가 강제한다', () => {
  assert.match(sql, /v_room\.top_card->>'rank' = 'JOKER' and v_rank <> 'JOKER'/);
  assert.match(sql, /MUST_DEFEND_JOKER/);
});

test('카드 기록과 커스텀 스티커 RPC는 참가자 확인·종류 제한·도배 방지를 포함한다', () => {
  assert.match(sql, /function public\.onecard_get_history\(p_room_id uuid\)/);
  assert.match(sql, /event_type = 'play' and e\.id > v_start_id/);
  assert.match(sql, /function public\.onecard_send_emote\(p_room_id uuid, p_emote text\)/);
  assert.match(sql, /interval '1200 milliseconds'/);
  assert.match(sql, /p_emote not in \('nice', 'fire', 'oops', 'lol', 'gg', 'again'\)/);
  assert.deepEqual(REACTIONS.map(({ key }) => key), ['nice', 'fire', 'oops', 'lol', 'gg', 'again']);
});

test('새로고침하면 익명 세션과 활성 방을 복원하고 주사위 결과를 보여준 뒤 시작한다', () => {
  assert.match(multiplayerClient, /persistSession: true/);
  assert.match(multiplayerClient, /async restoreRoom\(rating = 0, cardBack = 'back-classic'\)/);
  assert.match(multiplayerClient, /onecard-active-room-v1/);
  assert.match(onlineMain, /await wait\(1350\)/);
  assert.match(onlineMain, /client\.getHistory\(\)/);
  assert.match(onlineMain, /client\.sendEmote\(key\)/);
});

test('멀티 대전은 상대 점수를 공유하고 결과를 한 번만 개인 점수에 반영한다', () => {
  assert.match(sql, /add column if not exists host_rating integer not null default 0/);
  assert.match(sql, /function public\.onecard_set_rating\(p_room_id uuid, p_rating integer\)/);
  assert.match(sql, /'rating', v_room\.host_rating/);
  assert.match(multiplayerClient, /onecard_set_rating/);
  assert.match(onlineMain, /recordMatchResult\(/);
  assert.match(sql, /add column if not exists round_no bigint not null default 0/);
  assert.match(sql, /'roundNo', v_room\.round_no/);
  assert.match(sql, /round_no = round_no \+ 1/);
  assert.match(onlineMain, /round:\$\{nextView\.roundNo\}/);
  assert.doesNotMatch(onlineMain, /const resultKey = `multi:\$\{nextView\.roomId\}:\$\{nextView\.host\.wins/);
});

test('멀티 대전은 허용된 카드 뒷면 스킨만 상대에게 공유한다', () => {
  assert.match(sql, /add column if not exists host_card_back text not null default 'back-classic'/);
  assert.match(sql, /function public\.onecard_set_card_back\(p_room_id uuid, p_card_back text\)/);
  assert.match(sql, /'back-antique-atlas', 'back-bauhaus', 'back-jade-rune', 'back-brass-orbit'/);
  assert.match(sql, /'back-monochrome-wave', 'back-antique-library'/);
  assert.match(sql, /'back-rose-arbor'/);
  assert.match(sql, /'back-pink-cloud-pop', 'back-moon-rabbit-observatory', 'back-strawberry-toy-parade'/);
  assert.match(sql, /'back-rose-ballroom', 'back-real-rose-garden', 'back-neon-deepsea-city', 'back-ancient-sun-temple'/);
  assert.match(sql, /'cardBack', v_room\.host_card_back/);
  assert.match(multiplayerClient, /onecard_set_card_back/);
  assert.match(onlineMain, /renderOpponentHand\(opponent\.count, opponent\.cardBack\)/);
  assert.match(cosmeticsCss, /2026-07-06-pink-cloud-card-back\.webp/);
  assert.match(cosmeticsCss, /2026-07-07-real-rose-garden-card-back\.webp/);
  assert.match(cosmeticsCss, /2026-07-06-sun-temple-table\.webp/);
});

test('AI와 멀티 대전은 보너스판 승리 포인트 2배 이벤트를 지원한다', () => {
  assert.match(aiHtml, /id="bonus-match-badge"/);
  assert.match(onlineHtml, /id="online-bonus-match-badge"/);
  assert.match(aiHtml, /id="result-bonus-summary"/);
  assert.match(onlineHtml, /id="online-result-bonus-summary"/);
  assert.match(aiMain, /rollBonusMatch\(playerProfile\.points\)/);
  assert.match(aiMain, /bonusMultiplier: currentBonusMatch \? 2 : 1/);
  assert.match(onlineMain, /bonusMultiplier: nextView\.bonusMultiplier \|\| 1/);
  assert.match(sql, /add column if not exists bonus_multiplier smallint not null default 1/);
  assert.match(sql, /'bonusMultiplier', v_room\.bonus_multiplier/);
  assert.match(sql, /greatest\(0\.15, 0\.20 - \(least\(greatest\(v_room\.host_rating, v_room\.guest_rating\), 40000\)::numeric \/ 40000\) \* 0\.05\)/);
});

test('게임 시작 전 이미 나온 상대 주사위를 강제로 다시 돌리지 않는다', () => {
  assert.match(onlineMain, /animateOnlineDie\(0, nextView\.host\?\.die\)/);
  assert.match(onlineMain, /animateOnlineDie\(1, nextView\.guest\?\.die\)/);
  assert.doesNotMatch(onlineMain, /animateOnlineDie\(0, nextView\.host\?\.die, true\)/);
});

test('AI 결과창 예약은 홈으로 나갈 때 취소된다', () => {
  assert.match(aiMain, /let resultRevealTimer = null/);
  assert.match(aiMain, /function goHome\(\)[\s\S]*?clearTimeout\(resultRevealTimer\)/);
  assert.match(aiMain, /resultRevealTimer = setTimeout\(\(\) =>/);
});

test('멀티 기권 종료는 마지막 필드 카드를 승자의 카드로 오인하지 않는다', () => {
  assert.match(onlineMain, /finishedByLeave = nextView\.lastEvent\?\.eventType === 'left'/);
  assert.match(onlineMain, /상대 퇴장으로 종료 · 마지막 필드 카드/);
});

test('AI와 멀티 결과창은 승리한 경우에만 장착한 대형 승리 연출을 재생한다', () => {
  assert.match(aiHtml, /class="victory-stage"/);
  assert.match(aiHtml, /class="preview-victory-stage"/);
  assert.match(onlineHtml, /class="victory-stage"/);
  assert.match(aiMain, /classList\.toggle\('victory-earned', won\)/);
  assert.match(onlineMain, /classList\.toggle\('victory-earned', won\)/);
  assert.match(cosmeticsCss, /\.skin-victory-fireworks \.victory-earned\.open \.victory-stage i/);
  assert.doesNotMatch(cosmeticsCss, /\.skin-victory-fireworks \.victory-stage i \{/);
});

test('승리 연출은 실제 게임과 미리보기에서 각각 48개 파티클을 사용한다', () => {
  const particleCount = (html, className) => {
    const stage = html.match(new RegExp(`<div class="${className}"[^>]*>([\\s\\S]*?)<\\/div>`))?.[1] ?? '';
    return stage.match(/<i><\/i>/g)?.length ?? 0;
  };
  assert.equal(particleCount(aiHtml, 'victory-stage'), 48);
  assert.equal(particleCount(aiHtml, 'preview-victory-stage'), 48);
  assert.equal(particleCount(onlineHtml, 'victory-stage'), 48);
  assert.match(cosmeticsCss, /\.victory-stage i:nth-child\(n\+33\) \{ display:none; \}/);
  assert.match(cosmeticsCss, /\.preview-victory-stage i:nth-child\(n\+33\) \{ display:none; \}/);
});

test('불꽃·색종이·네온·솜사탕·하이스코어는 서로 다른 전용 연출을 사용한다', () => {
  assert.match(cosmeticsCss, /animation:victory-firework-shell/);
  assert.match(cosmeticsCss, /animation:victory-confetti-left/);
  assert.match(cosmeticsCss, /animation:victory-neon-equalizer/);
  assert.match(cosmeticsCss, /animation:victory-cotton-left/);
  assert.match(cosmeticsCss, /animation:victory-highscore-burst/);
  assert.match(cosmeticsCss, /animation:preview-firework-shell/);
  assert.match(cosmeticsCss, /animation:preview-confetti-left/);
  assert.match(cosmeticsCss, /animation:preview-neon-equalizer/);
  assert.match(cosmeticsCss, /animation:preview-cotton-left/);
  assert.match(cosmeticsCss, /animation:preview-highscore-burst/);
  assert.doesNotMatch(cosmeticsCss, /skin-victory-neon[^\n]+skin-victory-arcade[^\n]+animation/);
});

test('리얼 로즈가든과 신규 고점수 세트도 전용 이펙트와 승리 연출을 가진다', () => {
  assert.match(cosmeticsCss, /\.skin-table-real-rose \.table/);
  assert.match(cosmeticsCss, /\.skin-face-real-rose \.playing-card/);
  assert.match(cosmeticsCss, /2026-07-07-real-rose-garden-card-face\.webp/);
  assert.match(cosmeticsCss, /\.skin-effect-real-rose \.effect-particles i/);
  assert.match(cosmeticsCss, /animation:victory-real-rose-petal-left/);
  assert.match(cosmeticsCss, /animation:preview-rose-petal/);
  assert.match(cosmeticsCss, /animation:victory-pink-heart-left/);
  assert.match(cosmeticsCss, /animation:victory-moon-star/);
  assert.match(cosmeticsCss, /animation:victory-strawberry-ribbon-left/);
  assert.match(cosmeticsCss, /animation:victory-ballroom-waltz/);
  assert.match(cosmeticsCss, /animation:victory-deepsea-bubble/);
  assert.match(cosmeticsCss, /animation:victory-sun-rune/);
});

console.log(`멀티플레이 도우미·보안 테스트 ${passed}개 통과`);
