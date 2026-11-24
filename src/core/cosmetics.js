// 꾸미기 목록 — 시즌 2
// 시즌 1 아이템 87개는 ID · 칸 · 해금 점수를 그대로 두고(기록 이어 가기) 모습만 실제 에셋으로 다시 만든다.
// 시즌 1에서 그린 그림이 있던 아이템(장미 무도회 · 리얼 로즈가든 · 장미 오르골 · 왕실 꽃정원 분수 …)은 그 그림을 그대로 쓴다.
// 해금: 역대 최고 점수(threshold) · 시즌 패스 단계(pass) · 보상 상자(box — 상자에서만 나옴). 모습은 src/data/looks.js 의 look 값.
// 점수 사다리는 100만 점까지 — 30만~40만 5천 점 · 40만~60만 5천~1만 점 · 60만~100만 1만 점마다(끝 셋은 2만~2만 5천). 점수 펌핑은 보상 상자(reward-box.js)가 맡는다.
import { TOYS } from '../data/looks.js';
import { PLATE_NAMES } from '../data/plate-names.js';

export { TOYS };

export const COSMETIC_SLOTS = Object.freeze([
  { key: 'table', name: '맵' },
  { key: 'cardBack', name: '카드 뒷면' },
  { key: 'cardFace', name: '카드 앞면' },
  { key: 'effect', name: '카드 효과' },
  { key: 'charm', name: '장난감' },
  { key: 'victory', name: '승리 연출' },
  { key: 'avatar', name: '내 캐릭터' },
]);

const item = (id, slot, threshold, look, name, description, extra = {}) => Object.freeze({ id, slot, threshold, look, name, description, ...extra });
const pass = (id, slot, tier, look, name, description, extra = {}) => Object.freeze({ id, slot, threshold: null, pass: tier, look, name, description, season: 's2', ...extra });
const s2 = (id, slot, threshold, look, name, description, extra = {}) => item(id, slot, threshold, look, name, description, { season: 's2', ...extra });
// 상자 전용 — 점수로는 안 열리고 AI 대전 뒤 보상 상자에서만 나온다(rare · epic · legend 순으로 드묾)
const box = (id, slot, rarity, look, name, description, extra = {}) => Object.freeze({ id, slot, threshold: null, box: true, boxRarity: rarity, look, name, description, season: 's2', ...extra });
const CUTE = ['cute'];
const DESSERT = ['dessert'];
const ROSE = ['rose'];
const FLOWER = ['flower'];
const ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ'];
// 레두테 「장미」 도감 — 이름은 실제 판화 제목(학명)에서
export const REDOUTE_PLATES = Object.freeze([
  ['redoute-01', 305000], ['redoute-02', 315000], ['redoute-03', 325000], ['redoute-04', 335000],
  ['redoute-05', 345000], ['redoute-06', 355000], ['redoute-07', 365000], ['redoute-08', 375000],
  ['redoute-09', 385000], ['redoute-10', 395000], ['redoute-11', 410000], ['redoute-12', 470000],
]);

export const COSMETICS = Object.freeze([
  // ── 기본
  item('table-midnight', 'table', 0, 'classic', '미드나잇 펠트', '어두운 카드 살롱, 호두나무 테를 두른 초록 펠트'),
  item('back-classic', 'cardBack', 0, 'classic', '클래식 ONE!', '남색 리넨 위에 금박 ONE!'),
  item('face-classic', 'cardFace', 0, 'classic', '클래식 카드', '실제 카드와 같은 영국식 왕 · 여왕 · 기사 그림'),
  item('effect-classic', 'effect', 0, 'classic', '클래식 스파크', '카드를 낼 때 칩과 금화가 튀어 올라요'),
  item('charm-classic', 'charm', 0, 'classic', '기본 친구들', '딸기, 금빛 별, 빨간 장미'),
  item('victory-classic', 'victory', 0, 'classic', '클래식 피날레', '금빛 트로피가 솟아올라요'),

  // ── 시즌 1 아이템(ID · 해금 점수 그대로)
  item('back-strawberry-milk', 'cardBack', 300, 'strawberry-milk', '딸기우유', '옛 식물 도감의 딸기 그림'),
  item('effect-cloud-pop', 'effect', 700, 'cloud', '구름퐁퐁', '비눗방울과 분홍 풍선이 둥실 떠올라요'),
  item('table-peach-soda', 'table', 1200, 'peach', '복숭아 소다', '흰 리넨 위 살구 한 자루와 로제 한 병'),
  item('face-bunny-mail', 'cardFace', 1800, 'bunny', '토끼 우편', '베아트릭스 포터의 피터 래빗 그림카드(1902)'),
  item('back-antique-atlas', 'cardBack', 2300, 'atlas', '고대 천체 지도', '셀라리우스 「대우주의 조화」(1660) 천체도'),
  item('face-antique-manuscript', 'cardFace', 3200, 'manuscript', '왕립 필사본', '15세기 손으로 그린 「클로이스터스 카드」 그림'),
  item('victory-cotton-candy', 'victory', 3500, 'cloud', '솜사탕 폭죽', '분홍 풍선과 비눗방울이 내려와요'),
  item('table-dessert-cafe', 'table', 4200, 'dessert-cafe', '분홍 디저트 카페', '분홍 탁자 위 크루아상과 라테, 장미 한 송이', { set: 'dessert-cafe' }),
  item('victory-dual-fireworks', 'victory', 4500, 'fireworks', '트윈 불꽃축제', '밤하늘에 진짜 불꽃이 연달아 터져요'),
  item('back-star-candy', 'cardBack', 4800, 'star-candy', '별사탕', '알록달록 별사탕 사진'),
  item('face-neon-arcade', 'cardFace', 5200, 'arcade', '네온 아케이드', '검은 카드에 조이스틱, 게임패드, 주사위 사진', { set: 'neon-arcade' }),
  item('back-bauhaus', 'cardBack', 5600, 'bauhaus', '바우하우스 1923', '칸딘스키 「구성 8」(1923)'),
  item('table-night-picnic', 'table', 6200, 'night-picnic', '별빛 피크닉', '남색 천 위에 둥글게 놓인 꼬마전구'),
  item('face-art-deco', 'cardFace', 6700, 'deco', '블랙 골드 데코', '검은 카드에 금박 무늬와 금선 그림카드'),
  item('charm-cafe-bear', 'charm', 7200, 'dessert-cafe', '푸딩곰 점원', '오래된 곰 인형', { set: 'dessert-cafe', toy: 'cafe-bear' }),
  item('effect-aurora', 'effect', 8000, 'aurora', '오로라 리본', '카드 위로 진짜 오로라 빛이 지나가요'),
  item('victory-confetti-cannons', 'victory', 8500, 'confetti', '더블 색종이 대포', '양쪽에서 색종이와 선물 상자가 날아올라요'),
  item('table-deep-aquarium', 'table', 9000, 'aquarium', '푸른 조개 테이블', '하늘빛 바탕 위 조개껍데기와 산호'),
  item('face-stone-tablet', 'cardFace', 9200, 'stone-temple', '태양신 석판', '사암 결 카드에 모아이 · 항아리 · 석상 사진', { set: 'ancient-temple' }),
  item('back-jade-rune', 'cardBack', 9600, 'stone-temple', '옥빛 봉인문', '박물관에 있는 옛 옥 조각', { set: 'ancient-temple' }),
  item('table-rose-conservatory', 'table', 9800, 'rose-conservatory', '장미 온실', '장미 화분이 가득한 유리 온실의 초록 펠트 탁자', { set: 'rose-conservatory', tags: ROSE }),
  item('face-rose-tea', 'cardFace', 10000, 'rose-conservatory', '장미 티파티', '튤립 · 백합 · 장미 식물화 그림카드', { set: 'rose-conservatory', tags: ROSE }),
  item('back-rose-arbor', 'cardBack', 10300, 'rose-arbor', '비밀 장미 아치', '윌리엄 모리스 「격자」 — 격자를 타고 오르는 장미', { set: 'rose-conservatory', tags: ROSE }),
  item('effect-rose-petal-storm', 'effect', 10600, 'rose-conservatory', '장미 꽃잎 폭풍', '진짜 장미 꽃잎이 감돌다 흩어져요', { set: 'rose-conservatory', tags: ROSE }),
  item('victory-rose-grand-bloom', 'victory', 10900, 'rose-conservatory', '그랜드 로즈 블룸', '온실 가득 장미 꽃다발이 피어나요', { set: 'rose-conservatory', tags: ROSE }),
  item('effect-pixel-combo', 'effect', 11000, 'arcade', '픽셀 콤보!', '조이스틱과 게임패드가 튀어나와요', { set: 'neon-arcade' }),
  item('face-glass-modern', 'cardFace', 11800, 'glass', '모던 글라스', '서리 낀 유리 결에 아르누보 꽃병, 향수병, 다이아몬드'),
  item('victory-celestial-burst', 'victory', 12500, 'celestial', '초신성 피날레', '허블이 찍은 게 성운이 화면을 채워요'),
  item('face-dessert-cafe', 'cardFace', 13000, 'dessert-cafe', '딸기 케이크 카드', '컵케이크 · 조각 케이크 · 생일 케이크 사진', { set: 'dessert-cafe' }),
  item('back-brass-orbit', 'cardBack', 13800, 'brass', '황동 궤도장치', '박물관의 옛 황동 천구의'),
  item('charm-star-cat', 'charm', 14500, 'cat', '별빛 고양이', '쓰다듬으면 골골대는 고양이', { toy: 'star-cat' }),
  item('face-blueprint', 'cardFace', 14800, 'blueprint', '청사진 설계도', '에디슨 전구 · 벨 전화기 · 라이트 형제 비행기 특허 도면'),
  item('victory-neon-concert', 'victory', 16000, 'neon-concert', '네온 콘서트', '무대 조명이 교차하는 피날레'),
  item('table-cherry-picnic', 'table', 17000, 'cherry', '벚꽃 소풍', '남색 바탕에 늘어진 벚꽃 가지', { tags: FLOWER }),
  item('back-monochrome-wave', 'cardBack', 17600, 'monochrome', '모노크롬 파동', '호쿠사이 「가나가와 앞바다」를 흑백으로'),
  item('charm-ufo-pet', 'charm', 18000, 'arcade', 'UFO 픽셀펫', '빙글 도는 비행접시 모형', { set: 'neon-arcade', toy: 'ufo-pet' }),
  item('face-ink-landscape', 'cardFace', 18200, 'ink', '수묵 산수', '겸재 정선의 산수화 그림카드'),
  item('back-space-whale', 'cardBack', 18500, 'space-whale', '우주 고래', '허블 · 찬드라가 찍은 「고래 은하」 NGC 4631'),
  item('victory-cherry-finale', 'victory', 18800, 'cherry', '천앵화 피날레', '벚꽃 길을 배경으로 꽃가지가 피어나요', { tags: FLOWER }),
  item('back-antique-library', 'cardBack', 19200, 'library', '금서고 문장', '금박을 눌러 찍은 옛 가죽 장정'),
  item('face-royal-tarot', 'cardFace', 19300, 'tarot', '왕실 타로', '15세기 비스콘티 · 스포르차 타로 그림카드'),
  item('victory-high-score', 'victory', 19500, 'arcade', '하이 스코어 피날레', '트로피와 게임패드로 끝내는 승리', { set: 'neon-arcade' }),

  item('table-dream-kingdom', 'table', 20000, 'dream', '꿈빛 왕국 테이블', '노을 진 성 아래 라일락 벨벳 탁자', { legendary: true, set: 'dream-kingdom' }),
  item('back-dream-kingdom', 'cardBack', 20000, 'dream', '꿈빛 왕국 카드', '동화 속 성 그림', { legendary: true, set: 'dream-kingdom' }),
  item('face-dream-kingdom', 'cardFace', 20000, 'dream', '꿈빛 왕국 카드 앞면', '에드먼드 뒬라크 · 아서 래컴의 동화 삽화 그림카드', { legendary: true, set: 'dream-kingdom' }),
  item('effect-dream-kingdom', 'effect', 20000, 'dream', '꿈빛 마법', '다이아몬드 · 진주 · 왕관이 튀어나와요', { legendary: true, set: 'dream-kingdom' }),
  item('charm-dream-kingdom', 'charm', 20000, 'dream', '꿈빛 친구들', '갈기 흩날리는 백마', { legendary: true, set: 'dream-kingdom', toy: 'unicorn' }),
  item('victory-dream-kingdom', 'victory', 20000, 'dream', '꿈빛 대관식', '왕관이 내려와 내 캐릭터에 씌워져요', { legendary: true, set: 'dream-kingdom' }),

  item('table-pink-cloud-pop', 'table', 20700, 'pink-cloud', '핑크 구름 팝 테이블', '분홍 구름과 하트 풍선 사이의 퀼팅 탁자(시즌 1 그림)', { legendary: true, set: 'pink-cloud-pop' }),
  item('back-pink-cloud-pop', 'cardBack', 21200, 'pink-cloud', '핑크 구름 팝 카드', '리본과 하트 보석(시즌 1 그림)', { legendary: true, set: 'pink-cloud-pop' }),
  item('effect-pink-cloud-carnival', 'effect', 21700, 'pink-cloud', '핑크 구름 카니발', '분홍 풍선과 비눗방울이 떠올라요', { legendary: true, set: 'pink-cloud-pop' }),
  item('victory-pink-cloud-pop', 'victory', 22400, 'pink-cloud', '핑크 구름 팝 피날레', '구름 테이블 위로 분홍 풍선이 내려와요', { legendary: true, set: 'pink-cloud-pop' }),
  item('table-moon-rabbit-observatory', 'table', 23200, 'moon-rabbit', '달토끼 천문대', '구름 위 천문대와 별자리 탁자(시즌 1 그림)', { legendary: true, set: 'moon-rabbit-observatory' }),
  item('back-moon-rabbit-observatory', 'cardBack', 23800, 'moon-rabbit', '달토끼 별자리 카드', '초승달에 앉은 토끼와 별자리(시즌 1 그림)', { legendary: true, set: 'moon-rabbit-observatory' }),
  item('effect-moon-rabbit-orbit', 'effect', 24400, 'moon-rabbit', '달토끼 궤도', '진짜 달과 토끼가 카드 둘레를 돌아요', { legendary: true, set: 'moon-rabbit-observatory' }),
  item('charm-rose-musicbox', 'charm', 24900, 'rose-conservatory', '복숭아 장미 오르골', '누르면 태엽이 돌며 노래하는 장미 오르골(시즌 1 그림)', { legendary: true, toy: 'rose-musicbox', tags: ROSE }),
  item('victory-moon-rabbit-observatory', 'victory', 25200, 'moon-rabbit', '달토끼 천문대 피날레', '천문대 위로 보름달이 떠올라요', { legendary: true, set: 'moon-rabbit-observatory' }),
  item('table-strawberry-toy-parade', 'table', 26100, 'strawberry-parade', '딸기 토이 퍼레이드', '회전목마와 딸기 수레가 둘러싼 탁자(시즌 1 그림)', { legendary: true, set: 'strawberry-toy-parade' }),
  item('back-strawberry-toy-parade', 'cardBack', 26800, 'strawberry-parade', '딸기 퍼레이드 카드', '딸기 회전목마(시즌 1 그림)', { legendary: true, set: 'strawberry-toy-parade' }),
  item('effect-strawberry-ribbon-pop', 'effect', 27600, 'strawberry-parade', '딸기 리본 팝', '딸기와 선물 상자가 튀어 올라요', { legendary: true, set: 'strawberry-toy-parade' }),
  item('victory-strawberry-toy-parade', 'victory', 28600, 'strawberry-parade', '딸기 토이 퍼레이드 피날레', '딸기 케이크와 선물이 쏟아지는 퍼레이드', { legendary: true, set: 'strawberry-toy-parade' }),
  item('charm-rose-teacup', 'charm', 29200, 'rose-conservatory', '복숭아 장미 인형꽃', '이슬이 톡 터지는 복숭아빛 장미(시즌 1 그림)', { legendary: true, toy: 'rose-teacup', tags: ROSE }),
  item('table-rose-ballroom', 'table', 29500, 'rose-ballroom', '장미 무도회', '촛불과 장미가 둘러싼 와인빛 벨벳 무도회장(시즌 1 그림)', { legendary: true, set: 'rose-ballroom', tags: ROSE }),
  item('back-rose-ballroom', 'cardBack', 30300, 'rose-ballroom', '장미 무도회 카드', '금테 두른 진홍 장미 문장(시즌 1 그림)', { legendary: true, set: 'rose-ballroom', tags: ROSE }),
  item('effect-rose-ballroom-waltz', 'effect', 30900, 'rose-ballroom', '장미 왈츠', '붉은 장미와 꽃잎이 춤추듯 돌아요', { legendary: true, set: 'rose-ballroom', tags: ROSE }),
  item('victory-rose-ballroom-gala', 'victory', 31600, 'rose-ballroom', '장미 무도회 갈라', '무도회장 위로 왕관이 내려와요', { legendary: true, set: 'rose-ballroom', tags: ROSE }),
  item('table-real-rose-garden', 'table', 32200, 'real-rose', '리얼 로즈가든 테이블', '복숭아빛 장미 넝쿨이 둘러싼 정원 탁자(시즌 1 그림)', { legendary: true, set: 'real-rose-garden', tags: ROSE }),
  item('back-real-rose-garden', 'cardBack', 32800, 'real-rose', '리얼 로즈가든 카드', '장미 넝쿨 테두리(시즌 1 그림)', { legendary: true, set: 'real-rose-garden', tags: ROSE }),
  item('face-real-rose-garden', 'cardFace', 33400, 'real-rose', '리얼 로즈가든 앞면', '장미 넝쿨 테에 선생님이 찍은 장미 사진 그림카드', { legendary: true, set: 'real-rose-garden', tags: ROSE }),
  item('effect-real-rose-garden', 'effect', 34000, 'real-rose', '리얼 로즈 샤워', '장미 꽃다발이 더미 위에 내려앉아요', { legendary: true, set: 'real-rose-garden', tags: ROSE }),
  item('victory-real-rose-garden', 'victory', 34800, 'real-rose', '리얼 로즈가든 만개', '선생님이 찍은 장미 사진 위로 꽃다발이 피어나요', { legendary: true, set: 'real-rose-garden', tags: ROSE }),
  item('table-neon-deepsea-city', 'table', 35600, 'neon-deepsea', '네온 심해 도시', '해파리 등불이 빛나는 해저 도시(시즌 1 그림)', { legendary: true, set: 'neon-deepsea-city' }),
  item('back-neon-deepsea-city', 'cardBack', 36400, 'neon-deepsea', '네온 심해 카드', '빛나는 해파리 회로(시즌 1 그림)', { legendary: true, set: 'neon-deepsea-city' }),
  item('effect-neon-deepsea-current', 'effect', 37200, 'neon-deepsea', '네온 심해 해류', '해파리와 물방울이 떠올라요', { legendary: true, set: 'neon-deepsea-city' }),
  item('victory-neon-deepsea-city', 'victory', 38200, 'neon-deepsea', '네온 심해 도시 피날레', '해저 도시 위로 혹등고래가 솟아올라요', { legendary: true, set: 'neon-deepsea-city' }),
  item('table-ancient-sun-temple', 'table', 39400, 'sun-temple', '고대 태양 신전', '횃불 켠 사막 신전의 돌 탁자(시즌 1 그림)', { legendary: true, set: 'ancient-sun-temple' }),
  item('charm-crimson-rose-clockwork', 'charm', 40000, 'rose-ballroom', '진홍 장미 인형꽃', '활짝 피며 꽃잎이 터지는 진홍 장미(시즌 1 그림)', { legendary: true, toy: 'crimson-clockwork', tags: ROSE }),
  item('back-ancient-sun-temple', 'cardBack', 40400, 'sun-temple', '태양 신전 카드', '황금 태양 문장(시즌 1 그림)', { legendary: true, set: 'ancient-sun-temple' }),
  item('effect-ancient-sun-rune', 'effect', 41400, 'sun-temple', '태양 룬 폭발', '금화와 보석이 터져 나와요', { legendary: true, set: 'ancient-sun-temple' }),
  item('victory-ancient-sun-temple', 'victory', 42600, 'sun-temple', '태양 신전 대관식', '신전 위로 진짜 태양(NASA)이 떠올라요', { legendary: true, set: 'ancient-sun-temple' }),
  item('charm-royal-flower-fountain', 'charm', 130000, 'rose-conservatory', '왕실 꽃정원 분수', '누르면 물줄기와 꽃이 솟구치는 신화 등급 분수(시즌 1 그림)', { legendary: true, mythic: true, toy: 'royal-flower-fountain', tags: FLOWER }),

  // ── 시즌 2 — 내 캐릭터(점수)
  s2('avatar-rabbit', 'avatar', 0, null, '토끼', '기본 캐릭터', { portrait: 'rabbit' }),
  s2('avatar-dog', 'avatar', 0, null, '강아지', '언제나 신나는 강아지', { portrait: 'dog' }),
  s2('avatar-bear', 'avatar', 0, null, '곰', '듬직한 갈색곰', { portrait: 'bear' }),
  s2('avatar-hamster', 'avatar', 1500, null, '햄스터', '볼이 빵빵한 햄스터', { portrait: 'hamster' }),
  s2('avatar-frog', 'avatar', 5000, null, '청개구리', '눈이 동그란 청개구리', { portrait: 'frog' }),
  s2('avatar-chick', 'avatar', 9000, null, '병아리', '삐약삐약 병아리', { portrait: 'chick' }),
  // 내 캐릭터 일곱 — 상대 캐릭터와 따로(11-24 선생님). 선생님이 GPT 로 만든 그림 가운데 카드 대신 장미 · 디저트 · 풍선을 든 캐릭터(상대는 src/data/characters.js)
  // 출처: 마이멜로디 · 시나모롤 · 폼폼푸린(산리오) · 망그러진 곰(유랑) · 잔망루피(아이코닉스 「뽀롱뽀롱 뽀로로」) · 세일러문(다케우치 나오코) · 춘식이(카카오프렌즈) — 수업 자료(저작권 교육 예외)
  ...[
    ['mymelody', '마이멜로디', '분홍 장미를 든 마이멜로디'], ['mangom', '망그러진 곰', '빨간 장미를 든 망그러진 곰'], ['sailormoon', '세일러문', '빨간 장미를 든 세일러문'],
    ['cinnamoroll', '시나모롤', '시나몬롤을 안은 시나모롤'], ['pompompurin', '폼폼푸린', '푸딩을 든 폼폼푸린'], ['loopy', '잔망루피', '하트 풍선을 든 잔망루피'], ['choonsik', '춘식이', '군고구마를 든 춘식이'],
  ].map(([key, name, description]) => s2(`avatar-${key}`, 'avatar', 0, null, name, description, { portrait: `char-${key}`, character: true })),

  // ── 시즌 2 — 시즌 패스 보상
  pass('avatar-fox', 'avatar', 1, null, '붉은여우', '시즌 2 패스 1단계', { portrait: 'fox' }),
  pass('back-s2-mucha', 'cardBack', 2, 'mucha-lily', '무하 — 꽃', '알폰스 무하의 꽃 연작(1898)', { tags: FLOWER }),
  pass('charm-s2-die', 'charm', 3, null, '행운의 주사위', '누르면 데굴데굴 굴러 숫자가 나와요', { toy: 'die' }),
  pass('effect-s2-spotlight', 'effect', 4, 'spotlight', '스포트라이트', '카드를 낼 때 무대 조명이 지나가요'),
  pass('avatar-penguin', 'avatar', 5, null, '황제펭귄', '시즌 2 패스 5단계', { portrait: 'penguin' }),
  pass('face-s2-league', 'cardFace', 6, 'league', '리그 금박 카드', '금박 무늬와 금테를 두른 카드'),
  pass('charm-s2-mask', 'charm', 7, null, '베네치아 가면', '가면무도회의 금빛 가면', { toy: 'mask' }),
  pass('table-s2-tulips', 'table', 8, 'tulips', '흰 튤립 탁자', '짙은 원목 위에 놓인 흰 튤립 다발', { tags: FLOWER }),
  pass('avatar-tiger', 'avatar', 9, null, '호랑이', '시즌 2 패스 9단계', { portrait: 'tiger' }),
  pass('victory-s2-champion', 'victory', 10, 'champion', '챔피언 피날레', '불꽃이 터지고 트로피가 솟아요'),
  pass('back-s2-hubble', 'cardBack', 11, 'hubble-rose', '허블 — 장미 은하', '허블이 찍은 장미 모양 은하 Arp 273', { tags: ROSE }),
  pass('avatar-panda', 'avatar', 12, null, '판다', '시즌 2 패스 12단계', { portrait: 'panda' }),
  pass('effect-s2-thunder', 'effect', 13, 'thunder', '번개', '카드가 놓이면 진짜 번개가 내리쳐요'),
  pass('charm-s2-globe', 'charm', 14, null, '앤티크 지구본', '누르면 빙글빙글 돌아요', { toy: 'globe' }),
  pass('avatar-white-horse', 'avatar', 15, null, '백마', '시즌 2 패스 15단계', { portrait: 'white-horse' }),
  pass('table-s2-lavender', 'table', 16, 'lavender', '라벤더 다발', '짙은 돌판 위 라벤더 한 다발', { tags: FLOWER }),
  pass('face-s2-silver', 'cardFace', 17, 'silver', '은테 카드', '가는 은테를 두른 아이보리 카드'),
  pass('charm-s2-whale', 'charm', 18, null, '혹등고래', '누르면 물을 뿜어요', { toy: 'whale' }),
  pass('avatar-koala', 'avatar', 19, null, '코알라', '시즌 2 패스 19단계', { portrait: 'koala' }),
  pass('victory-s2-legend', 'victory', 20, 'legend', '오로라 대관식', '시즌 2 마지막 단계 — 오로라 아래 왕관이 씌워져요', { legendary: true }),

  // ── 시즌 2 — 블랙 오닉스(4만 5천~5만)
  s2('table-obsidian', 'table', 45000, 'obsidian', '블랙 오닉스 테이블', '밤의 도시를 내려다보는 검은 오닉스 탁자', { legendary: true, set: 'obsidian' }),
  s2('back-obsidian', 'cardBack', 46500, 'obsidian', '블랙 오닉스 카드', '검은 오닉스 결에 은박 ONE!', { legendary: true, set: 'obsidian' }),
  s2('face-obsidian', 'cardFace', 48000, 'obsidian', '블랙 오닉스 앞면', '검은 카드에 은박 무늬와 은선 그림카드', { legendary: true, set: 'obsidian' }),
  s2('victory-obsidian', 'victory', 50000, 'obsidian', '블랙 오닉스 피날레', '밤의 도시 위로 다이아몬드가 떠올라요', { legendary: true, set: 'obsidian' }),

  // ── 시즌 2 — 꽃의 계절 · 명화 속 꽃(5만~30만)
  s2('back-vangogh-almond', 'cardBack', 55000, 'vangogh-almond', '반 고흐 — 꽃 피는 아몬드 나무', '빈센트 반 고흐, 1890', { set: 'masterpiece', tags: FLOWER }),
  s2('table-giverny', 'table', 60000, 'giverny', '모네의 연못', '수련 잎이 떠 있는 어두운 연못', { set: 'seasons', tags: FLOWER }),
  s2('charm-teacup', 'charm', 65000, null, '꽃무늬 찻잔', '누르면 찻잔이 달그락', { toy: 'teacup', tags: FLOWER }),
  s2('back-japanese-cherry', 'cardBack', 70000, 'japanese-cherry', '우키요에 — 벚꽃', '일본 목판화 속 벚꽃', { set: 'masterpiece', tags: FLOWER }),
  s2('charm-macarons', 'charm', 75000, null, '마카롱', '누르면 바삭', { toy: 'macarons' }),
  s2('effect-white-rose', 'effect', 80000, 'white-rose', '하얀 장미', '하얀 장미와 꽃잎이 감돌아요', { tags: ROSE }),
  s2('table-sunflower', 'table', 90000, 'sunflower', '해바라기 원목 탁자', '오래된 원목 위 해바라기 세 송이', { set: 'seasons', tags: FLOWER }),
  s2('back-vangogh-irises', 'cardBack', 100000, 'vangogh-irises', '반 고흐 — 붓꽃', '빈센트 반 고흐, 1890', { set: 'masterpiece', tags: FLOWER }),
  s2('charm-perfume', 'charm', 110000, null, '장미 향수', '누르면 칙 — 장미 향', { toy: 'perfume', tags: ROSE }),
  s2('face-redoute', 'cardFace', 120000, 'redoute', '보태니컬 카드', '레두테의 장미 판화로 그린 그림카드, 에이스는 진짜 장미', { set: 'redoute', tags: ROSE }),
  s2('table-hydrangea', 'table', 135000, 'hydrangea', '수국 테이블', '연보랏빛 판 위 수국과 고사리', { set: 'seasons', tags: FLOWER }),
  s2('charm-pocket-watch', 'charm', 145000, null, '금 회중시계', '누르면 째깍 — 내 차례를 알려 줘요', { toy: 'pocket-watch' }),
  s2('back-monet-waterlilies', 'cardBack', 150000, 'monet-waterlilies', '모네 — 수련', '클로드 모네의 수련', { set: 'masterpiece', tags: FLOWER }),
  s2('victory-curtain-call', 'victory', 165000, 'curtain-call', '커튼콜', '붉은 막 앞으로 장미 꽃다발이 날아와요', { tags: ROSE }),
  s2('table-peony', 'table', 180000, 'peony', '작약 테이블', '회색 돌판 위에 나란히 놓인 흰 작약', { set: 'seasons', tags: FLOWER }),
  s2('back-japanese-peony', 'cardBack', 195000, 'japanese-peony', '우키요에 — 모란', '목판화 속 모란', { set: 'masterpiece', tags: FLOWER }),
  s2('charm-music-box', 'charm', 210000, null, '황동 축음기', '바늘을 올리면 옛 노래가 흘러요', { toy: 'music-box' }),
  s2('table-wisteria', 'table', 225000, 'wisteria', '라일락 원목 탁자', '보랏빛 라일락이 놓인 짙은 원목 탁자', { set: 'seasons', tags: FLOWER }),
  s2('back-morris-rose', 'cardBack', 240000, 'morris-rose', '윌리엄 모리스 — 장미', '윌리엄 모리스의 장미 무늬', { set: 'masterpiece', tags: ROSE }),
  s2('effect-petal-wind', 'effect', 255000, 'petal-wind', '꽃잎 바람', '장미 꽃잎이 바람을 타고 탁자를 가로질러요', { tags: ROSE }),
  s2('back-morris-strawberry', 'cardBack', 270000, 'morris-strawberry', '윌리엄 모리스 — 딸기 도둑', '윌리엄 모리스 「딸기 도둑」(1883)', { set: 'masterpiece', tags: FLOWER }),
  s2('charm-rose-teacup-set', 'charm', 285000, null, '장미 홍차 세트', '장미가 담긴 찻잔(시즌 1 그림)', { toy: 'rose-teacup-s1', tags: ROSE }),

  // ── 시즌 2 — 장미 도감 · 장미 정원(30만~40만, 5천 점마다)
  ...REDOUTE_PLATES.map(([look, threshold], index) => s2(`back-${look}`, 'cardBack', threshold, look, `장미 도감 ${ROMAN[index]}`, `르두테 「장미」(1817~1824) — ${PLATE_NAMES[look]?.latin || '장미'}`, { set: 'redoute', tags: ROSE })),
  s2('table-rose-garden-1', 'table', 310000, 'rose-garden-1', '분홍 장미 아치', '분홍 덩굴장미 아치가 두른 정원', { set: 'rose-gardens', tags: ROSE }),
  s2('charm-rose-dome', 'charm', 320000, null, '유리 구슬 장미', '유리 구슬 속에서 시들지 않는 장미', { toy: 'rose-dome', tags: ROSE }),
  s2('table-rose-garden-2', 'table', 330000, 'rose-garden-2', '하얀 장미 테라스', '흰 장미가 넘치는 대리석 테라스', { set: 'rose-gardens', tags: ROSE }),
  s2('effect-single-rose', 'effect', 340000, 'single-rose', '장미 한 송이', '낸 카드 위에 붉은 장미 한 송이가 내려앉아요', { tags: ROSE }),
  s2('table-rose-garden-3', 'table', 350000, 'rose-garden-3', '영국식 장미 정원', '살구빛 장미와 라벤더가 핀 정원', { set: 'rose-gardens', tags: ROSE }),
  s2('charm-clockwork-rose', 'charm', 360000, null, '태엽 장미', '금빛 태엽 위에 핀 진홍 장미(시즌 1 그림)', { toy: 'rose-clockwork-s1', tags: ROSE }),
  s2('table-rose-garden-4', 'table', 370000, 'rose-garden-4', '분홍 장미 파빌리온', '레이스 커튼과 찻잔이 있는 장미 정자', { set: 'rose-gardens', tags: ROSE }),
  s2('victory-rose-fireworks', 'victory', 380000, 'rose-fireworks', '장미 불꽃', '붉은 불꽃 사이로 장미 한 송이가 솟아요', { tags: ROSE }),
  s2('table-rose-garden-5', 'table', 390000, 'rose-garden-5', '호숫가 노란 장미', '노란 장미가 핀 호숫가 산책길', { set: 'rose-gardens', tags: ROSE }),

  // ── 시즌 2 — 장미와 꽃 정원 · 선생님 GPT 카드(40만~60만, 5천~1만 점마다)
  // 11-24 선생님이 GPT 로 만든 판 · 뒷면 · 앞면은 같은 주제끼리 한 벌(세트)로 묶어 40만~100만 사이에 나눠 둔다
  s2('charm-white-rose', 'charm', 400000, null, '하얀 장미', '순백의 장미 한 송이', { toy: 'rose-white', tags: ROSE }),
  s2('table-rose-garden-6', 'table', 405000, 'rose-garden-6', '붉은 장미 터널', '붉은 덩굴장미 터널 아래 탁자', { set: 'rose-gardens', tags: ROSE }),
  s2('back-pink-rose', 'cardBack', 415000, 'pink-rose', '분홍 장미 카드', '금빛 덩굴 안에 핀 분홍 장미', { tags: ROSE }),
  s2('charm-rose-bouquet', 'charm', 420000, null, '장미 꽃다발', '누르면 꽃잎이 흩날려요', { toy: 'rose-bouquet', tags: ROSE }),
  s2('charm-pink-rose', 'charm', 430000, null, '분홍 장미', '갓 핀 분홍 장미 한 송이', { toy: 'rose-pink', tags: ROSE }),
  s2('table-winter-garden', 'table', 435000, 'winter-garden', '왕실 겨울 정원', '흰 장미와 동백이 핀 유리 온실', { legendary: true, set: 'winter-garden', tags: ROSE }),
  s2('back-vangogh-roses', 'cardBack', 440000, 'vangogh-roses', '반 고흐 — 장미', '빈센트 반 고흐, 1890', { set: 'masterpiece', tags: ROSE }),
  s2('back-winter-garden', 'cardBack', 445000, 'winter-garden', '하얀 장미 카드', '은빛 덩굴과 진주로 두른 하얀 장미', { legendary: true, set: 'winter-garden', tags: ROSE }),
  s2('table-rose-night', 'table', 450000, 'rose-night', '밤의 장미 정원', '등불과 달빛이 비추는 장미 정원', { set: 'rose-gardens', tags: ROSE }),
  s2('face-winter-garden', 'cardFace', 455000, 'winter-garden', '하얀 장미 앞면', '하얀 장미와 진주 덩굴 테', { legendary: true, set: 'winter-garden', tags: ROSE }),
  s2('charm-rose-vase', 'charm', 460000, null, '장미 꽃병', '활짝 핀 장미 한 다발', { toy: 'rose-vase', tags: ROSE }),
  s2('back-moon-tiara', 'cardBack', 475000, 'moon-tiara', '달빛 티아라 카드', '남색 벨벳 위 초승달 티아라와 월장석', { set: 'moon-tiara' }),
  s2('charm-yellow-roses', 'charm', 480000, null, '노란 장미 다발', '노란 장미 마흔 송이를 묶은 다발', { toy: 'rose-yellow', tags: ROSE }),
  s2('face-moon-tiara', 'cardFace', 485000, 'moon-tiara', '달빛 티아라 앞면', '초승달과 진주를 단 은테', { set: 'moon-tiara' }),
  s2('back-mucha-rose', 'cardBack', 490000, 'mucha-rose', '무하 — 장미', '알폰스 무하 「꽃」 연작의 장미(1898)', { set: 'masterpiece', tags: ROSE }),
  s2('charm-vintage-bouquet', 'charm', 500000, null, '빈티지 꽃다발', '장미와 들꽃을 엮은 옛 꽃다발', { toy: 'bouquet-vintage', tags: ROSE }),
  s2('back-pearl-shell', 'cardBack', 505000, 'pearl-shell', '진주 조개 카드', '분홍 조개껍데기와 오팔', { set: 'pearl-shell' }),
  s2('effect-lily-drop', 'effect', 510000, 'lily-drop', '백합 한 송이', '낸 카드 위에 분홍 백합이 내려앉아요', { tags: FLOWER }),
  s2('face-pearl-shell', 'cardFace', 515000, 'pearl-shell', '진주 조개 앞면', '조개와 진주를 단 분홍 테', { set: 'pearl-shell' }),
  s2('charm-lily', 'charm', 520000, null, '스타게이저 백합', '분홍 점이 박힌 백합', { toy: 'lily', tags: FLOWER }),
  s2('victory-lily', 'victory', 530000, 'lily', '백합 온실 피날레', '유리 온실 가운데에서 백합이 피어나요', { tags: FLOWER }),
  s2('back-montblanc', 'cardBack', 535000, 'montblanc', '흑임자 몽블랑 카드', '흑임자 몽블랑과 자수정', { set: 'montblanc', tags: DESSERT }),
  s2('charm-peony-vase', 'charm', 540000, null, '작약 꽃병', '흰 작약을 꽂은 둥근 꽃병', { toy: 'peony-vase', tags: FLOWER }),
  s2('face-montblanc', 'cardFace', 545000, 'montblanc', '흑임자 몽블랑 앞면', '깨알을 얹은 구릿빛 테', { set: 'montblanc', tags: DESSERT }),
  s2('charm-tulips', 'charm', 550000, null, '튤립 다발', '분홍 · 흰 튤립 한 다발', { toy: 'tulip-bunch', tags: FLOWER }),
  s2('victory-tulip', 'victory', 560000, 'tulip', '튤립 들판 피날레', '튤립 들판 한가운데에서 꽃다발이 피어나요', { tags: FLOWER }),
  s2('charm-lotus', 'charm', 570000, null, '연꽃', '물 위에 핀 분홍 연꽃', { toy: 'lotus', tags: FLOWER }),
  s2('effect-lotus-float', 'effect', 580000, 'lotus-float', '연꽃 둥실', '연꽃과 수련이 둥실 떠올라요', { tags: FLOWER }),
  s2('victory-lotus', 'victory', 590000, 'lotus', '연꽃 연못 피날레', '연못 위로 연꽃이 활짝 피어나요', { tags: FLOWER }),

  // ── 시즌 2 — 디저트 · 보석의 방 · 베르사유 · 황금 장미 · 백만 송이 장미(60만~100만, 1만 점마다)
  s2('table-millefeuille', 'table', 600000, 'millefeuille', '밀푀유 파티스리', '오렌지 밀푀유가 놓인 파리 과자점의 탁자', { legendary: true, set: 'millefeuille', tags: DESSERT }),
  s2('charm-lilac', 'charm', 610000, null, '라일락 가지', '보랏빛 라일락 한 가지', { toy: 'lilac-branch', tags: FLOWER }),
  s2('back-millefeuille', 'cardBack', 620000, 'millefeuille', '오렌지 밀푀유 카드', '밀푀유와 오렌지 조각, 바닐라 꽃', { legendary: true, set: 'millefeuille', tags: DESSERT }),
  s2('victory-lavender', 'victory', 630000, 'lavender', '라벤더 언덕 피날레', '보랏빛 언덕 위로 라일락이 피어나요', { tags: FLOWER }),
  s2('face-millefeuille', 'cardFace', 640000, 'millefeuille', '오렌지 밀푀유 앞면', '오렌지 조각을 단 금테', { legendary: true, set: 'millefeuille', tags: DESSERT }),
  s2('charm-cherry-branch', 'charm', 650000, null, '벚꽃 가지', '분홍 벚꽃 한 가지', { toy: 'cherry-branch', tags: FLOWER }),
  s2('effect-cherry-breeze', 'effect', 660000, 'cherry-breeze', '벚꽃 바람', '벚꽃 가지가 바람을 타고 감돌아요', { tags: FLOWER }),
  s2('charm-sunflower', 'charm', 670000, null, '해바라기', '활짝 핀 해바라기 한 송이', { toy: 'sunflower', tags: FLOWER }),
  s2('victory-sunflower', 'victory', 680000, 'sunflower', '해바라기 피날레', '해바라기 들판 위로 해바라기가 떠올라요', { tags: FLOWER }),
  s2('charm-heart-lantern', 'charm', 690000, null, '하트 풍등', '누르면 하늘로 둥실 떠올라요', { toy: 'heart-lantern' }),
  s2('table-dubai', 'table', 700000, 'dubai', '두바이 쫀득쿠키 카페', '피스타치오 쫀득쿠키와 초콜릿이 놓인 카페 탁자', { legendary: true, set: 'dubai', tags: DESSERT }),
  s2('back-dubai', 'cardBack', 710000, 'dubai', '두바이 쫀득쿠키 카드', '카다이프를 채운 초콜릿 쿠키와 와플', { legendary: true, set: 'dubai', tags: DESSERT }),
  s2('charm-pearls', 'charm', 720000, null, '진주 목걸이', '누르면 진주알이 반짝여요', { toy: 'pearls' }),
  s2('face-dubai', 'cardFace', 730000, 'dubai', '두바이 쫀득쿠키 앞면', '와플 무늬와 피스타치오를 단 테', { legendary: true, set: 'dubai', tags: DESSERT }),
  s2('charm-teapot', 'charm', 740000, null, '금테 찻주전자', '누르면 찻물이 보글보글', { toy: 'teapot' }),
  s2('table-amethyst', 'table', 750000, 'amethyst', '자수정 무도회장', '크리스털 샹들리에 아래 자수정을 박은 탁자', { legendary: true, set: 'amethyst' }),
  s2('effect-black-rose', 'effect', 760000, 'black-rose', '흑장미 한 송이', '연기 속에서 흑장미가 내려앉아요', { legendary: true, tags: ROSE }),
  s2('back-amethyst', 'cardBack', 770000, 'amethyst', '자수정 카드', '다이아몬드 테 안의 커다란 자수정', { legendary: true, set: 'amethyst' }),
  s2('charm-black-rose', 'charm', 780000, null, '흑장미', '신비로운 검붉은 장미', { legendary: true, toy: 'rose-black', tags: ROSE }),
  s2('face-amethyst', 'cardFace', 790000, 'amethyst', '자수정 앞면', '자수정과 다이아몬드를 박은 은테', { legendary: true, set: 'amethyst' }),
  s2('table-ruby-crown', 'table', 800000, 'ruby-crown', '루비 왕관의 방', '왕관과 루비 목걸이가 놓인 진홍 벨벳 방', { legendary: true, set: 'ruby-crown' }),
  s2('charm-candelabra', 'charm', 810000, null, '금빛 촛대', '누르면 촛불이 흔들려요', { toy: 'candelabra' }),
  s2('back-ruby-crown', 'cardBack', 820000, 'ruby-crown', '루비 왕관 카드', '금빛 왕관 아래 커다란 루비', { legendary: true, set: 'ruby-crown' }),
  s2('charm-champagne', 'charm', 830000, null, '샴페인', '누르면 거품이 보글보글', { toy: 'champagne' }),
  s2('face-ruby-crown', 'cardFace', 840000, 'ruby-crown', '루비 왕관 앞면', '루비와 진주를 박은 금테', { legendary: true, set: 'ruby-crown' }),
  s2('table-versailles', 'table', 850000, 'versailles', '베르사유 거울의 방', '샹들리에와 금빛 거울의 방', { legendary: true, set: 'versailles' }),
  s2('victory-versailles', 'victory', 860000, 'versailles', '거울의 방 대관식', '거울의 방에서 왕관이 씌워져요', { legendary: true, set: 'versailles' }),
  s2('charm-crown', 'charm', 870000, null, '보석 왕관', '누르면 빙그르르', { toy: 'crown' }),
  s2('table-golden-rose', 'table', 880000, 'golden-rose', '황금 장미의 방', '검은 벨벳과 금빛 장미의 방', { legendary: true, set: 'golden-rose', tags: ROSE }),
  s2('back-golden-rose', 'cardBack', 890000, 'golden-rose', '황금 장미 카드', '금박 테 안의 장미 다마스크', { legendary: true, set: 'golden-rose', tags: ROSE }),
  s2('face-golden-rose', 'cardFace', 900000, 'golden-rose', '황금 장미 앞면', '금박 무늬와 금테, 에이스는 황금 장미', { legendary: true, set: 'golden-rose', tags: ROSE }),
  s2('effect-golden-rose', 'effect', 910000, 'golden-rose', '황금 장미 한 송이', '낸 카드 위에 황금 장미가 내려앉아요', { legendary: true, set: 'golden-rose', tags: ROSE }),
  s2('victory-golden-rose', 'victory', 920000, 'golden-rose', '황금 장미 피날레', '거울의 방에서 황금 장미가 솟아올라요', { legendary: true, set: 'golden-rose', tags: ROSE }),
  s2('charm-golden-rose', 'charm', 930000, null, '황금 장미', '영원히 피어 있는 금빛 장미', { legendary: true, set: 'golden-rose', toy: 'rose-gold', tags: ROSE }),
  s2('back-million-roses', 'cardBack', 950000, 'million-roses', '백만 송이 장미 카드', '촛불 켠 아치 사이 붉은 장미 문장', { legendary: true, mythic: true, set: 'million-roses', tags: ROSE }),
  s2('victory-million-roses', 'victory', 975000, 'million-roses', '백만 송이 장미 피날레', '장미 들판 위로 꽃다발이 피어나요', { legendary: true, mythic: true, set: 'million-roses', tags: ROSE }),
  s2('table-million-roses', 'table', 1000000, 'million-roses', '백만 송이 장미', '끝없는 붉은 장미 바다 한가운데', { legendary: true, mythic: true, set: 'million-roses', tags: ROSE }),

  // ── 시즌 2 — 상자 전용(AI 대전 보상 상자에서만)
  box('charm-box-teddy-bow', 'charm', 'rare', null, '빨간 리본 곰', '빨간 리본을 맨 곰 인형', { toy: 'teddy-red-bow', set: 'box-teddy', tags: CUTE }),
  box('charm-box-teddy-sweater', 'charm', 'rare', null, '스웨터 곰', '털 스웨터를 입은 곰 인형', { toy: 'teddy-sweater', set: 'box-teddy', tags: CUTE }),
  box('charm-box-duckling', 'charm', 'rare', null, '아기 오리', '뒤뚱뒤뚱 노란 아기 오리', { toy: 'duckling', tags: CUTE }),
  box('charm-box-hedgehog', 'charm', 'rare', null, '아기 고슴도치', '동그랗게 몸을 마는 고슴도치', { toy: 'hedgehog', tags: CUTE }),
  box('charm-box-kitten', 'charm', 'rare', null, '아기 고양이', '브리티시 쇼트헤어 아기 고양이', { toy: 'kitten', tags: CUTE }),
  box('charm-box-capybara', 'charm', 'rare', null, '카피바라', '언제나 느긋한 카피바라', { toy: 'capybara', tags: CUTE }),
  box('charm-box-carnation', 'charm', 'rare', null, '분홍 카네이션', '감사를 전하는 카네이션', { toy: 'carnation', set: 'box-garden', tags: FLOWER }),
  box('charm-box-poppy', 'charm', 'rare', null, '양귀비', '붉은 양귀비 두 송이', { toy: 'poppy', set: 'box-garden', tags: FLOWER }),
  box('charm-box-pansy', 'charm', 'rare', null, '팬지', '보랏빛 팬지', { toy: 'pansy', set: 'box-garden', tags: FLOWER }),
  box('charm-box-camomile', 'charm', 'rare', null, '캐모마일', '하얀 캐모마일 한 다발', { toy: 'camomile', set: 'box-garden', tags: FLOWER }),
  box('charm-box-halva', 'charm', 'rare', null, '피스타치오 할바', '중동의 깨 과자에 피스타치오', { toy: 'halva', set: 'box-patisserie', tags: DESSERT }),
  box('charm-box-kulich', 'charm', 'rare', null, '쿨리치', '설탕옷을 입힌 러시아 부활절 케이크', { toy: 'kulich', set: 'box-patisserie', tags: DESSERT }),
  box('charm-box-teddy-angel', 'charm', 'epic', null, '천사 곰', '날개를 단 하얀 곰 인형', { toy: 'teddy-angel', set: 'box-teddy', tags: CUTE }),
  box('charm-box-samoyed', 'charm', 'epic', null, '사모예드', '웃는 얼굴의 하얀 사모예드', { toy: 'samoyed', tags: CUTE }),
  box('charm-box-matryoshka', 'charm', 'epic', null, '장미 마트료시카', '장미를 그린 러시아 인형', { toy: 'matryoshka', tags: [...CUTE, 'rose'] }),
  box('charm-box-lilac', 'charm', 'epic', null, '라일락 꽃병', '유리 꽃병에 꽂은 라일락', { toy: 'lilac-vase', set: 'box-garden', tags: FLOWER }),
  box('charm-box-violet', 'charm', 'epic', null, '바이올렛 화분', '보랏빛 아프리칸 바이올렛', { toy: 'violet-pot', set: 'box-garden', tags: FLOWER }),
  box('charm-box-water-lily', 'charm', 'epic', null, '수련', '연못에 뜬 분홍 수련', { toy: 'water-lily', set: 'box-garden', tags: FLOWER }),
  box('charm-box-campanula', 'charm', 'epic', null, '캄파눌라', '종 모양 분홍 꽃', { toy: 'campanula', set: 'box-garden', tags: FLOWER }),
  box('charm-box-tulips', 'charm', 'epic', null, '흰 튤립', '새하얀 튤립 다발', { toy: 'tulips-white', set: 'box-garden', tags: FLOWER }),
  box('charm-box-macaron-tower', 'charm', 'epic', null, '마카롱 탑', '알록달록 쌓은 마카롱', { toy: 'macaron-tower', set: 'box-patisserie', tags: DESSERT }),
  box('charm-box-parfait', 'charm', 'epic', null, '딸기 파르페', '유리잔에 담은 딸기 파르페', { toy: 'parfait', set: 'box-patisserie', tags: DESSERT }),
  box('charm-box-jelly-cake', 'charm', 'epic', null, '키위 젤리 케이크', '키위 젤리를 덮은 케이크', { toy: 'jelly-cake', set: 'box-patisserie', tags: DESSERT }),
  box('charm-box-upside-down', 'charm', 'epic', null, '파인애플 업사이드다운', '뒤집어 구운 파인애플 케이크', { toy: 'upside-down-cake', set: 'box-patisserie', tags: DESSERT }),
  box('effect-box-macarons', 'effect', 'epic', 'box-macarons', '마카롱 팝', '카드를 낼 때 마카롱이 튀어 올라요', { set: 'box-patisserie', tags: DESSERT }),
  box('effect-box-flowers', 'effect', 'epic', 'box-flowers', '꽃 한 아름', '카네이션, 팬지, 캐모마일, 양귀비가 떠올라요', { set: 'box-garden', tags: FLOWER }),
  box('effect-box-teddy', 'effect', 'epic', 'box-teddy', '곰 인형 착지', '낸 카드 위에 곰 인형이 폴짝 앉아요', { set: 'box-teddy', tags: CUTE }),
  box('charm-box-teddy-rose', 'charm', 'legend', null, '장미 든 곰', '분홍 장미 다발을 안은 곰 인형', { toy: 'teddy-rose', set: 'box-teddy', tags: [...CUTE, 'rose'], legendary: true }),
  box('charm-box-teddy-family', 'charm', 'legend', null, '곰 가족', '아기 곰을 머리에 얹은 곰 인형', { toy: 'teddy-family', set: 'box-teddy', tags: CUTE, legendary: true }),
  box('charm-box-wedding-cake', 'charm', 'legend', null, '장미 웨딩 케이크', '분홍 장미가 흘러내리는 세 단 케이크', { toy: 'wedding-cake', set: 'box-patisserie', tags: [...DESSERT, 'rose'], legendary: true }),
  box('charm-box-bouquet-heart', 'charm', 'legend', null, '하트 장미 부케', '하트 모양으로 엮은 분홍 장미', { toy: 'bouquet-heart', tags: ROSE, legendary: true }),
  box('charm-box-galle-vase', 'charm', 'legend', null, '아르누보 꽃병', '붉은 꽃을 새긴 유리 꽃병', { toy: 'galle-vase', set: 'box-garden', tags: FLOWER, legendary: true }),
  box('table-box-patisserie', 'table', 'legend', 'box-patisserie', '마카롱 파티스리', '분홍 탁자 위에 흩어진 마카롱', { set: 'box-patisserie', tags: DESSERT, legendary: true }),
  box('victory-box-wedding', 'victory', 'legend', 'box-wedding', '웨딩 케이크 피날레', '진열장 앞에서 장미 웨딩 케이크가 솟아올라요', { set: 'box-patisserie', tags: [...DESSERT, 'rose'], legendary: true }),
  box('victory-box-teddy', 'victory', 'legend', 'box-teddy', '곰 인형 퍼레이드', '곰 가족 뒤로 곰 인형들이 날아올라요', { set: 'box-teddy', tags: CUTE, legendary: true }),
  // 선생님 GPT 카드 24장 가운데 둘만 상자 전용(11-24 「상자 획득 아이템을 너무 많이 배치하지 말고」)
  box('back-box-pistachio', 'cardBack', 'epic', 'pistachio', '피스타치오 파리브레스트 카드', '초록 벨벳 위 피스타치오 파리브레스트', { set: 'box-patisserie', tags: DESSERT }),
  box('face-box-pistachio', 'cardFace', 'epic', 'pistachio', '피스타치오 앞면', '피스타치오 열매를 단 금테', { set: 'box-patisserie', tags: DESSERT }),
]);

export const COSMETIC_SETS = Object.freeze([
  { id: 'rose-conservatory', name: '장미 온실', itemIds: ['table-rose-conservatory', 'face-rose-tea', 'back-rose-arbor', 'effect-rose-petal-storm', 'victory-rose-grand-bloom'] },
  { id: 'dessert-cafe', name: '딸기 디저트 카페', itemIds: ['table-dessert-cafe', 'charm-cafe-bear', 'face-dessert-cafe'] },
  { id: 'ancient-temple', name: '고대 신전', itemIds: ['face-stone-tablet', 'back-jade-rune'] },
  { id: 'neon-arcade', name: '네온 아케이드', itemIds: ['face-neon-arcade', 'effect-pixel-combo', 'charm-ufo-pet', 'victory-high-score'] },
  { id: 'dream-kingdom', name: '꿈빛 왕국', itemIds: ['table-dream-kingdom', 'back-dream-kingdom', 'face-dream-kingdom', 'effect-dream-kingdom', 'charm-dream-kingdom', 'victory-dream-kingdom'] },
  { id: 'pink-cloud-pop', name: '핑크 구름 팝', itemIds: ['table-pink-cloud-pop', 'back-pink-cloud-pop', 'effect-pink-cloud-carnival', 'victory-pink-cloud-pop'] },
  { id: 'moon-rabbit-observatory', name: '달토끼 천문대', itemIds: ['table-moon-rabbit-observatory', 'back-moon-rabbit-observatory', 'effect-moon-rabbit-orbit', 'victory-moon-rabbit-observatory'] },
  { id: 'strawberry-toy-parade', name: '딸기 토이 퍼레이드', itemIds: ['table-strawberry-toy-parade', 'back-strawberry-toy-parade', 'effect-strawberry-ribbon-pop', 'victory-strawberry-toy-parade'] },
  { id: 'rose-ballroom', name: '장미 무도회', itemIds: ['table-rose-ballroom', 'back-rose-ballroom', 'effect-rose-ballroom-waltz', 'victory-rose-ballroom-gala'] },
  { id: 'real-rose-garden', name: '리얼 로즈가든', itemIds: ['table-real-rose-garden', 'back-real-rose-garden', 'face-real-rose-garden', 'effect-real-rose-garden', 'victory-real-rose-garden'] },
  { id: 'neon-deepsea-city', name: '네온 심해 도시', itemIds: ['table-neon-deepsea-city', 'back-neon-deepsea-city', 'effect-neon-deepsea-current', 'victory-neon-deepsea-city'] },
  { id: 'ancient-sun-temple', name: '고대 태양 신전', itemIds: ['table-ancient-sun-temple', 'back-ancient-sun-temple', 'effect-ancient-sun-rune', 'victory-ancient-sun-temple'] },
  { id: 'obsidian', name: '블랙 오닉스', itemIds: ['table-obsidian', 'back-obsidian', 'face-obsidian', 'victory-obsidian'] },
  { id: 'redoute', name: '장미 도감', itemIds: ['face-redoute', ...REDOUTE_PLATES.map(([look]) => `back-${look}`)] },
  { id: 'rose-gardens', name: '장미 정원', itemIds: ['table-rose-garden-1', 'table-rose-garden-2', 'table-rose-garden-3', 'table-rose-garden-4', 'table-rose-garden-5', 'table-rose-garden-6', 'table-rose-night'] },
  { id: 'seasons', name: '꽃의 계절', itemIds: ['table-giverny', 'table-sunflower', 'table-hydrangea', 'table-peony', 'table-wisteria'] },
  { id: 'masterpiece', name: '명화 속 꽃', itemIds: ['back-vangogh-almond', 'back-japanese-cherry', 'back-vangogh-irises', 'back-monet-waterlilies', 'back-japanese-peony', 'back-morris-rose', 'back-morris-strawberry', 'back-vangogh-roses', 'back-mucha-rose'] },
  { id: 'winter-garden', name: '왕실 겨울 정원', itemIds: ['table-winter-garden', 'back-winter-garden', 'face-winter-garden'] },
  { id: 'moon-tiara', name: '달빛 티아라', itemIds: ['back-moon-tiara', 'face-moon-tiara'] },
  { id: 'pearl-shell', name: '진주 조개', itemIds: ['back-pearl-shell', 'face-pearl-shell'] },
  { id: 'montblanc', name: '흑임자 몽블랑', itemIds: ['back-montblanc', 'face-montblanc'] },
  { id: 'millefeuille', name: '밀푀유 파티스리', itemIds: ['table-millefeuille', 'back-millefeuille', 'face-millefeuille'] },
  { id: 'dubai', name: '두바이 쫀득쿠키', itemIds: ['table-dubai', 'back-dubai', 'face-dubai'] },
  { id: 'amethyst', name: '자수정', itemIds: ['table-amethyst', 'back-amethyst', 'face-amethyst'] },
  { id: 'ruby-crown', name: '루비 왕관', itemIds: ['table-ruby-crown', 'back-ruby-crown', 'face-ruby-crown'] },
  { id: 'versailles', name: '베르사유', itemIds: ['table-versailles', 'victory-versailles'] },
  { id: 'golden-rose', name: '황금 장미', itemIds: ['table-golden-rose', 'back-golden-rose', 'face-golden-rose', 'effect-golden-rose', 'victory-golden-rose', 'charm-golden-rose'] },
  { id: 'million-roses', name: '백만 송이 장미', itemIds: ['table-million-roses', 'back-million-roses', 'victory-million-roses'] },
  { id: 'box-teddy', name: '상자 — 곰 인형', itemIds: ['charm-box-teddy-bow', 'charm-box-teddy-sweater', 'charm-box-teddy-angel', 'charm-box-teddy-rose', 'charm-box-teddy-family', 'effect-box-teddy', 'victory-box-teddy'] },
  { id: 'box-patisserie', name: '상자 — 파티스리', itemIds: ['charm-box-halva', 'charm-box-kulich', 'charm-box-macaron-tower', 'charm-box-parfait', 'charm-box-jelly-cake', 'charm-box-upside-down', 'charm-box-wedding-cake', 'effect-box-macarons', 'table-box-patisserie', 'victory-box-wedding', 'back-box-pistachio', 'face-box-pistachio'] },
  { id: 'box-garden', name: '상자 — 꽃 정원', itemIds: ['charm-box-carnation', 'charm-box-poppy', 'charm-box-pansy', 'charm-box-camomile', 'charm-box-lilac', 'charm-box-violet', 'charm-box-water-lily', 'charm-box-campanula', 'charm-box-tulips', 'charm-box-galle-vase', 'effect-box-flowers'] },
]);

// 장난감 자리
const DEFAULT_TOYS = ['custard', 'star', 'rose'];
export const CHARM_SLOT_COUNT = 3;
export const DEFAULT_CHARM_LOADOUT = Object.freeze(Array(CHARM_SLOT_COUNT).fill('charm-classic'));

export const DEFAULT_EQUIPPED = Object.freeze({
  ...Object.fromEntries(COSMETIC_SLOTS.map(({ key }) => [key, COSMETICS.find((entry) => entry.slot === key && entry.threshold === 0).id])),
  charms: DEFAULT_CHARM_LOADOUT,
});

const BY_ID = new Map(COSMETICS.map((entry) => [entry.id, entry]));

export function cosmeticById(id) {
  return BY_ID.get(id) || null;
}

export function cosmeticSetForItem(itemId) {
  return COSMETIC_SETS.find((set) => set.itemIds.includes(itemId)) || null;
}

export function cosmeticsForSlot(slot) {
  return COSMETICS.filter((entry) => entry.slot === slot);
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function isUnlocked(entry, peakPoints = 0, passTier = 0, boxItems = []) {
  if (!entry) return false;
  if (entry.box) return Array.isArray(boxItems) && boxItems.includes(entry.id);
  if (entry.pass) return asNumber(passTier) >= entry.pass;
  return entry.threshold <= Math.max(0, asNumber(peakPoints));
}

export function cosmeticSetProgress(set, peakPoints, passTier = 0, boxItems = []) {
  const itemIds = set?.itemIds || [];
  return { unlocked: itemIds.filter((id) => isUnlocked(cosmeticById(id), peakPoints, passTier, boxItems)).length, total: itemIds.length };
}

export function unlockedCosmetics(peakPoints, passTier = 0, boxItems = []) {
  return COSMETICS.filter((entry) => isUnlocked(entry, peakPoints, passTier, boxItems));
}

// 상자에서만 나오는 아이템
export const BOX_ITEMS = Object.freeze(COSMETICS.filter((entry) => entry.box));
export const isBoxItemId = (id) => Boolean(cosmeticById(id)?.box);

// 점수로 새로 풀린 것(시즌 패스 보상은 newlyUnlockedByPass)
export function newlyUnlockedCosmetics(previousPeak, nextPeak) {
  const before = Math.max(0, asNumber(previousPeak));
  const after = Math.max(before, asNumber(nextPeak));
  return COSMETICS.filter((entry) => !entry.pass && !entry.box && entry.threshold > before && entry.threshold <= after);
}

export function newlyUnlockedByPass(previousTier, nextTier) {
  return COSMETICS.filter((entry) => entry.pass && entry.pass > asNumber(previousTier) && entry.pass <= asNumber(nextTier));
}

export function nextCosmeticUnlock(peakPoints) {
  const peak = Math.max(0, asNumber(peakPoints));
  const threshold = COSMETICS.reduce((next, entry) => (!entry.pass && !entry.box && entry.threshold > peak && entry.threshold < next ? entry.threshold : next), Number.POSITIVE_INFINITY);
  if (!Number.isFinite(threshold)) return null;
  return { threshold, remaining: threshold - peak, items: COSMETICS.filter((entry) => !entry.pass && !entry.box && entry.threshold === threshold) };
}

export function equippedCharmIds(equipped) {
  const saved = Array.isArray(equipped?.charms) && equipped.charms.length ? equipped.charms : [equipped?.charm];
  return Array.from({ length: CHARM_SLOT_COUNT }, (_, index) => {
    const candidate = saved[index] || DEFAULT_CHARM_LOADOUT[index];
    return cosmeticById(candidate)?.slot === 'charm' ? candidate : DEFAULT_CHARM_LOADOUT[index];
  });
}

export function normalizeEquipped(equipped, peakPoints, passTier = 0, boxItems = []) {
  const normalized = Object.fromEntries(COSMETIC_SLOTS.map(({ key }) => {
    const candidate = equipped?.[key];
    const entry = cosmeticById(candidate);
    return [key, entry?.slot === key && isUnlocked(entry, peakPoints, passTier, boxItems) ? candidate : DEFAULT_EQUIPPED[key]];
  }));
  const saved = Array.isArray(equipped?.charms) && equipped.charms.length ? equipped.charms : [equipped?.charm];
  const used = new Set();
  normalized.charms = Array.from({ length: CHARM_SLOT_COUNT }, (_, index) => {
    const candidate = saved[index] || DEFAULT_CHARM_LOADOUT[index];
    const entry = cosmeticById(candidate);
    const valid = entry?.slot === 'charm' && isUnlocked(entry, peakPoints, passTier, boxItems);
    if (!valid || (candidate !== 'charm-classic' && used.has(candidate))) return 'charm-classic';
    if (candidate !== 'charm-classic') used.add(candidate);
    return candidate;
  });
  normalized.charm = normalized.charms[0];
  return normalized;
}

// 장난감 자리 하나의 설정 — 기본 친구들은 자리마다 푸딩 · 별 · 장미
export function charmToyConfig(itemId, slotIndex = 0) {
  if (!itemId || itemId === 'charm-classic') {
    const key = DEFAULT_TOYS[Math.max(0, Math.min(CHARM_SLOT_COUNT - 1, Number(slotIndex) || 0))];
    return { key, ...TOYS[key] };
  }
  const key = cosmeticById(itemId)?.toy || 'star';
  return { key, ...(TOYS[key] || TOYS.star) };
}

export function equippedSetBonuses(equipped) {
  const charms = equippedCharmIds(equipped);
  return COSMETIC_SETS.filter((set) => set.itemIds.every((id) => {
    const entry = cosmeticById(id);
    return entry && (entry.slot === 'charm' ? charms.includes(id) : equipped?.[entry.slot] === id);
  }));
}
