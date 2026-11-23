// 꾸미기 목록 — 시즌 2
// 시즌 1 아이템 87개는 ID · 칸 · 해금 점수를 그대로 두고(기록 이어 가기) 그림만 새 테마로 다시 그린다.
// 해금: 역대 최고 점수(threshold) 또는 시즌 패스 단계(pass). 그림은 src/data/themes.js 의 theme 값으로 그린다.

export const COSMETIC_SLOTS = Object.freeze([
  { key: 'table', name: '테이블' },
  { key: 'cardBack', name: '카드 뒷면' },
  { key: 'cardFace', name: '카드 앞면' },
  { key: 'effect', name: '카드 효과' },
  { key: 'charm', name: '장난감' },
  { key: 'victory', name: '승리 연출' },
  { key: 'avatar', name: '내 캐릭터' },
]);

const item = (id, slot, threshold, theme, name, description, extra = {}) => Object.freeze({ id, slot, threshold, theme, name, description, ...extra });
const pass = (id, slot, tier, theme, name, description, extra = {}) => Object.freeze({ id, slot, threshold: null, pass: tier, theme, name, description, season: 's2', ...extra });

export const COSMETICS = Object.freeze([
  // 기본
  item('table-midnight', 'table', 0, 'classic', '미드나잇 펠트', '호두나무 테두리에 짙은 초록 펠트를 깐 기본 테이블'),
  item('back-classic', 'cardBack', 0, 'classic', '클래식 ONE!', '남색 직물 무늬에 금빛 테를 두른 기본 뒷면'),
  item('face-classic', 'cardFace', 0, 'classic', '클래식 카드', '또렷한 숫자와 왕관 · 반지 · 칼 그림카드'),
  item('effect-classic', 'effect', 0, 'classic', '클래식 스파크', '카드를 낼 때 네 가지 무늬가 튀어 올라요'),
  item('charm-classic', 'charm', 0, 'toybox', '기본 친구들', '말랑 푸딩 · 별 · 장미 세 친구'),
  item('victory-classic', 'victory', 0, 'classic', '클래식 피날레', '트로피가 솟고 금빛 띠가 화면을 가로질러요'),

  item('back-strawberry-milk', 'cardBack', 300, 'strawberry-milk', '딸기우유', '분홍 체크에 딸기 한 알'),
  item('effect-cloud-pop', 'effect', 700, 'cloud', '구름퐁퐁', '구름과 사탕이 둥실 떠올라요'),
  item('table-peach-soda', 'table', 1200, 'peach', '복숭아 소다', '복숭아빛 펠트에 소다 줄무늬와 탄산 방울'),
  item('face-bunny-mail', 'cardFace', 1800, 'bunny', '토끼 우편', '그림카드에 토끼와 편지가 들어간 앞면'),
  item('back-antique-atlas', 'cardBack', 2300, 'atlas', '고대 천체 지도', '낡은 종이 위에 나침반과 별자리 선'),
  item('face-antique-manuscript', 'cardFace', 3200, 'manuscript', '왕립 필사본', '양피지 결 위에 깃펜 · 두루마리 그림카드'),
  item('victory-cotton-candy', 'victory', 3500, 'cloud', '솜사탕 폭죽', '구름과 사탕이 하늘에서 쏟아져요'),
  item('table-dessert-cafe', 'table', 4200, 'dessert-cafe', '딸기 디저트 카페', '빨간 체크 식탁보에 케이크와 코코아', { set: 'dessert-cafe' }),
  item('victory-dual-fireworks', 'victory', 4500, 'fireworks', '트윈 불꽃축제', '화면 양쪽에서 불꽃이 연달아 터져요'),
  item('back-star-candy', 'cardBack', 4800, 'star-candy', '별사탕', '보랏빛 밤하늘에 작은 별이 촘촘히'),
  item('face-neon-arcade', 'cardFace', 5200, 'arcade', '네온 아케이드', '검은 화면 위 네온 숫자와 로봇 · 외계인 그림카드', { set: 'neon-arcade' }),
  item('back-bauhaus', 'cardBack', 5600, 'bauhaus', '바우하우스 1923', '빨강 원 · 파랑 삼각 · 노랑 사각의 조형 뒷면'),
  item('table-night-picnic', 'table', 6200, 'night-picnic', '별빛 피크닉', '남색 체크 돗자리에 바구니와 등불'),
  item('face-art-deco', 'cardFace', 6700, 'deco', '블랙 골드 데코', '검은 바탕에 금빛 숫자와 부채꼴 테두리'),
  item('charm-cafe-bear', 'charm', 7200, 'dessert-cafe', '푸딩곰 점원', '꼭 안아 주고 싶은 곰 인형', { set: 'dessert-cafe' }),
  item('effect-aurora', 'effect', 8000, 'aurora', '오로라 리본', '카드 둘레로 초록 · 보라 빛 띠가 흘러요'),
  item('victory-confetti-cannons', 'victory', 8500, 'confetti', '더블 색종이 대포', '양쪽 대포에서 폭죽과 풍선이 쏟아져요'),
  item('table-deep-aquarium', 'table', 9000, 'aquarium', '심해 수족관', '물결 무늬 위로 열대어와 산호'),
  item('face-stone-tablet', 'cardFace', 9200, 'stone-temple', '태양신 석판', '돌 결 앞면에 모아이 · 항아리 그림카드', { set: 'ancient-temple' }),
  item('back-jade-rune', 'cardBack', 9600, 'stone-temple', '옥빛 봉인문', '비취색 바탕에 고대 신전 문장', { set: 'ancient-temple' }),
  item('table-rose-conservatory', 'table', 9800, 'rose-conservatory', '장미 온실', '금빛 격자 온실 아래 장미와 찻주전자', { set: 'rose-conservatory' }),
  item('face-rose-tea', 'cardFace', 10000, 'rose-conservatory', '장미 티파티', '장미 · 튤립 · 꽃다발 그림카드', { set: 'rose-conservatory' }),
  item('back-rose-arbor', 'cardBack', 10300, 'rose-conservatory', '비밀 장미 아치', '와인빛 다마스크 무늬에 장미 한 송이', { set: 'rose-conservatory' }),
  item('effect-rose-petal-storm', 'effect', 10600, 'rose-conservatory', '장미 꽃잎 폭풍', '장미와 꽃이 소용돌이치며 퍼져요', { set: 'rose-conservatory' }),
  item('victory-rose-grand-bloom', 'victory', 10900, 'rose-conservatory', '그랜드 로즈 블룸', '거대한 꽃다발이 피어나요', { set: 'rose-conservatory' }),
  item('effect-pixel-combo', 'effect', 11000, 'arcade', '픽셀 콤보!', '8비트 조각과 게임기가 튀어나와요', { set: 'neon-arcade' }),
  item('face-glass-modern', 'cardFace', 11800, 'glass', '모던 글라스', '서리 낀 유리 결에 수정구 그림카드'),
  item('victory-celestial-burst', 'victory', 12500, 'celestial', '초신성 피날레', '가운데 별이 커지다 별빛으로 흩어져요'),
  item('face-dessert-cafe', 'cardFace', 13000, 'dessert-cafe', '딸기 케이크 카드', '컵케이크 · 조각 케이크 · 생일 케이크 그림카드', { set: 'dessert-cafe' }),
  item('back-brass-orbit', 'cardBack', 13800, 'brass', '황동 궤도장치', '맞물린 동심원과 황동 톱니'),
  item('charm-star-cat', 'charm', 14500, 'cat', '별빛 고양이', '쓰다듬으면 꼬리를 흔드는 고양이'),
  item('face-blueprint', 'cardFace', 14800, 'blueprint', '청사진 설계도', '파란 모눈 위 흰 선으로 그린 카드'),
  item('victory-neon-concert', 'victory', 16000, 'neon-concert', '네온 콘서트', '빛줄기가 교차하고 음표가 쏟아져요'),
  item('table-cherry-picnic', 'table', 17000, 'cherry', '벚꽃 소풍', '분홍 펠트 위에 벚꽃과 경단'),
  item('back-monochrome-wave', 'cardBack', 17600, 'monochrome', '모노크롬 파동', '검정 위로 은빛 물결이 번져요'),
  item('charm-ufo-pet', 'charm', 18000, 'arcade', 'UFO 픽셀펫', '빙글 도는 작은 비행접시', { set: 'neon-arcade' }),
  item('face-ink-landscape', 'cardFace', 18200, 'ink', '수묵 산수', '먹빛 숫자와 설산 · 등불 그림카드'),
  item('back-space-whale', 'cardBack', 18500, 'space-whale', '우주 고래', '은하를 헤엄치는 고래'),
  item('victory-cherry-finale', 'victory', 18800, 'cherry', '천앵화 피날레', '벚꽃이 소용돌이치며 피어나요'),
  item('back-antique-library', 'cardBack', 19200, 'library', '금서고 문장', '가죽 표지에 금박 책 문장'),
  item('face-royal-tarot', 'cardFace', 19300, 'tarot', '왕실 타로', '두 줄 금테와 마법봉 · 수정구 그림카드'),
  item('victory-high-score', 'victory', 19500, 'arcade', '하이 스코어 피날레', '픽셀 블록과 트로피로 끝내는 승리', { set: 'neon-arcade' }),

  item('table-dream-kingdom', 'table', 20000, 'dream', '꿈빛 왕국 테이블', '라일락 펠트에 성과 유니콘', { legendary: true, set: 'dream-kingdom' }),
  item('back-dream-kingdom', 'cardBack', 20000, 'dream', '꿈빛 왕국 카드', '보랏빛 아가일 무늬에 왕관', { legendary: true, set: 'dream-kingdom' }),
  item('face-dream-kingdom', 'cardFace', 20000, 'dream', '꿈빛 왕국 카드 앞면', '마법봉 · 유니콘 · 왕관 그림카드', { legendary: true, set: 'dream-kingdom' }),
  item('effect-dream-kingdom', 'effect', 20000, 'dream', '꿈빛 마법', '보석과 왕관이 반짝 튀어나와요', { legendary: true, set: 'dream-kingdom' }),
  item('charm-dream-kingdom', 'charm', 20000, 'dream', '꿈빛 친구들', '갈기가 흩날리는 유니콘', { legendary: true, set: 'dream-kingdom' }),
  item('victory-dream-kingdom', 'victory', 20000, 'dream', '꿈빛 대관식', '왕관이 내려와 내 캐릭터에 씌워져요', { legendary: true, set: 'dream-kingdom' }),

  item('table-pink-cloud-pop', 'table', 20700, 'pink-cloud', '핑크 구름 팝 테이블', '하얀 물방울 펠트에 구름과 풍선', { legendary: true, set: 'pink-cloud-pop' }),
  item('back-pink-cloud-pop', 'cardBack', 21200, 'pink-cloud', '핑크 구름 팝 카드', '분홍 물방울에 구름 한 조각', { legendary: true, set: 'pink-cloud-pop' }),
  item('effect-pink-cloud-carnival', 'effect', 21700, 'pink-cloud', '핑크 구름 카니발', '구름과 하트가 통통 떠올라요', { legendary: true, set: 'pink-cloud-pop' }),
  item('victory-pink-cloud-pop', 'victory', 22400, 'pink-cloud', '핑크 구름 팝 피날레', '풍선과 구름이 하늘에서 내려와요', { legendary: true, set: 'pink-cloud-pop' }),
  item('table-moon-rabbit-observatory', 'table', 23200, 'moon-rabbit', '달토끼 천문대', '밤하늘 펠트에 초승달과 망원경', { legendary: true, set: 'moon-rabbit-observatory' }),
  item('back-moon-rabbit-observatory', 'cardBack', 23800, 'moon-rabbit', '달토끼 별자리 카드', '별자리 선 위의 초승달', { legendary: true, set: 'moon-rabbit-observatory' }),
  item('effect-moon-rabbit-orbit', 'effect', 24400, 'moon-rabbit', '달토끼 궤도', '달과 토끼가 카드 둘레를 돌아요', { legendary: true, set: 'moon-rabbit-observatory' }),
  item('charm-rose-musicbox', 'charm', 24900, 'rose-conservatory', '복숭아 장미 오르골', '누르면 음표가 흘러나오는 복숭아빛 장미', { legendary: true }),
  item('victory-moon-rabbit-observatory', 'victory', 25200, 'moon-rabbit', '달토끼 천문대 피날레', '보름달이 떠오르고 별이 쏟아져요', { legendary: true, set: 'moon-rabbit-observatory' }),
  item('table-strawberry-toy-parade', 'table', 26100, 'strawberry-parade', '딸기 토이 퍼레이드', '딸기빛 줄무늬 펠트에 곰 인형과 풍선', { legendary: true, set: 'strawberry-toy-parade' }),
  item('back-strawberry-toy-parade', 'cardBack', 26800, 'strawberry-parade', '딸기 퍼레이드 카드', '딸기씨 무늬에 딸기 한 알', { legendary: true, set: 'strawberry-toy-parade' }),
  item('effect-strawberry-ribbon-pop', 'effect', 27600, 'strawberry-parade', '딸기 리본 팝', '딸기 · 리본 · 선물이 튀어 올라요', { legendary: true, set: 'strawberry-toy-parade' }),
  item('victory-strawberry-toy-parade', 'victory', 28600, 'strawberry-parade', '딸기 토이 퍼레이드 피날레', '양쪽 대포에서 딸기와 선물이 쏟아져요', { legendary: true, set: 'strawberry-toy-parade' }),
  item('charm-rose-teacup', 'charm', 29200, 'rose-conservatory', '복숭아 장미 인형꽃', '이슬방울이 톡 터지는 연한 장미', { legendary: true }),
  item('table-rose-ballroom', 'table', 29500, 'rose-ballroom', '장미 무도회', '와인빛 벨벳에 금테와 반지', { legendary: true, set: 'rose-ballroom' }),
  item('back-rose-ballroom', 'cardBack', 30300, 'rose-ballroom', '장미 무도회 카드', '와인빛 다마스크에 금테 장미', { legendary: true, set: 'rose-ballroom' }),
  item('effect-rose-ballroom-waltz', 'effect', 30900, 'rose-ballroom', '장미 왈츠', '장미와 반짝임이 춤추듯 돌아요', { legendary: true, set: 'rose-ballroom' }),
  item('victory-rose-ballroom-gala', 'victory', 31600, 'rose-ballroom', '장미 무도회 갈라', '왕관이 피어나는 화려한 마무리', { legendary: true, set: 'rose-ballroom' }),
  item('table-real-rose-garden', 'table', 32200, 'real-rose', '리얼 로즈가든 테이블', '선생님이 찍은 장미 사진을 깐 테이블', { legendary: true, set: 'real-rose-garden' }),
  item('back-real-rose-garden', 'cardBack', 32800, 'real-rose', '리얼 로즈가든 카드', '복숭아 장미 사진에 금테', { legendary: true, set: 'real-rose-garden' }),
  item('face-real-rose-garden', 'cardFace', 33400, 'real-rose', '리얼 로즈가든 앞면', '그림카드마다 진짜 장미 사진', { legendary: true, set: 'real-rose-garden' }),
  item('effect-real-rose-garden', 'effect', 34000, 'real-rose', '리얼 로즈 샤워', '장미와 꽃다발이 쏟아져요', { legendary: true, set: 'real-rose-garden' }),
  item('victory-real-rose-garden', 'victory', 34800, 'real-rose', '리얼 로즈가든 만개', '장미 사진 위로 꽃다발이 피어나요', { legendary: true, set: 'real-rose-garden' }),
  item('table-neon-deepsea-city', 'table', 35600, 'neon-deepsea', '네온 심해 도시', '회로 무늬 바다에 해파리와 문어', { legendary: true, set: 'neon-deepsea-city' }),
  item('back-neon-deepsea-city', 'cardBack', 36400, 'neon-deepsea', '네온 심해 카드', '푸른 회로 위의 해파리', { legendary: true, set: 'neon-deepsea-city' }),
  item('effect-neon-deepsea-current', 'effect', 37200, 'neon-deepsea', '네온 심해 해류', '해파리와 거품이 솟아올라요', { legendary: true, set: 'neon-deepsea-city' }),
  item('victory-neon-deepsea-city', 'victory', 38200, 'neon-deepsea', '네온 심해 도시 피날레', '고래가 물을 뿜고 거품이 솟구쳐요', { legendary: true, set: 'neon-deepsea-city' }),
  item('table-ancient-sun-temple', 'table', 39400, 'sun-temple', '고대 태양 신전', '모래빛 펠트에 검은 대리석 테두리', { legendary: true, set: 'ancient-sun-temple' }),
  item('charm-crimson-rose-clockwork', 'charm', 40000, 'rose-ballroom', '진홍 장미 인형꽃', '활짝 피며 꽃잎이 터지는 진홍 장미', { legendary: true }),
  item('back-ancient-sun-temple', 'cardBack', 40400, 'sun-temple', '태양 신전 카드', '햇살 무늬 가운데 태양', { legendary: true, set: 'ancient-sun-temple' }),
  item('effect-ancient-sun-rune', 'effect', 41400, 'sun-temple', '태양 룬 폭발', '태양과 보석이 터져 나와요', { legendary: true, set: 'ancient-sun-temple' }),
  item('victory-ancient-sun-temple', 'victory', 42600, 'sun-temple', '태양 신전 대관식', '거대한 태양 뒤로 햇살이 돌아요', { legendary: true, set: 'ancient-sun-temple' }),
  item('charm-royal-flower-fountain', 'charm', 130000, 'rose-conservatory', '왕실 꽃정원 분수', '누르면 물줄기와 꽃이 솟구치는 신화 등급 분수', { legendary: true, mythic: true }),

  // 시즌 2 — 내 캐릭터(점수)
  item('avatar-rabbit', 'avatar', 0, 'classic', '토끼', '기본 캐릭터', { motif: 'rabbit-face' }),
  item('avatar-dog', 'avatar', 0, 'classic', '강아지', '언제나 신나는 강아지', { motif: 'dog-face' }),
  item('avatar-bear', 'avatar', 0, 'classic', '곰', '듬직한 곰', { motif: 'bear' }),
  item('avatar-hamster', 'avatar', 1500, 'classic', '햄스터', '볼이 빵빵한 햄스터', { motif: 'hamster' }),
  item('avatar-frog', 'avatar', 5000, 'classic', '개구리', '폴짝 뛰는 개구리', { motif: 'frog' }),
  item('avatar-chick', 'avatar', 9000, 'classic', '병아리', '삐약삐약 병아리', { motif: 'baby-chick' }),

  // 시즌 2 — 시즌 패스 보상
  pass('avatar-fox', 'avatar', 1, 'classic', '여우', '시즌 2 패스 1단계', { motif: 'fox' }),
  pass('back-s2-emblem', 'cardBack', 2, 's2-arena', '시즌 2 엠블럼', '금빛 갈매기 무늬에 숫자 2', { set: 's2-arena' }),
  pass('charm-s2-die', 'charm', 3, 's2-arena', '행운의 주사위', '누르면 데굴데굴 굴러 숫자가 나와요'),
  pass('effect-s2-spotlight', 'effect', 4, 'spotlight', '스포트라이트', '카드를 낼 때 조명이 내리쬐어요'),
  pass('avatar-penguin', 'avatar', 5, 'classic', '펭귄', '시즌 2 패스 5단계', { motif: 'penguin' }),
  pass('face-s2-league', 'cardFace', 6, 's2-arena', '시즌 2 리그 카드', '트로피와 메달 그림카드', { set: 's2-arena' }),
  pass('charm-s2-rocket', 'charm', 7, 's2-arena', '꼬마 로켓', '누르면 불꽃을 뿜으며 솟아요'),
  pass('table-s2-arena', 'table', 8, 's2-arena', '시즌 2 아레나', '남색 펠트에 금빛 경기장 선', { set: 's2-arena' }),
  pass('avatar-tiger', 'avatar', 9, 'classic', '호랑이', '시즌 2 패스 9단계', { motif: 'tiger-face' }),
  pass('victory-s2-champion', 'victory', 10, 's2-arena', '챔피언 피날레', '금빛 띠와 트로피가 쏟아지는 우승 연출', { set: 's2-arena' }),
  pass('back-s2-holo', 'cardBack', 11, 's2-holo', '홀로그램 카드', '빛에 따라 색이 바뀌는 뒷면', { set: 's2-holo' }),
  pass('avatar-panda', 'avatar', 12, 'classic', '판다', '시즌 2 패스 12단계', { motif: 'panda' }),
  pass('effect-s2-thunder', 'effect', 13, 'thunder', '번개 콤보', '카드가 놓이면 번개가 내리쳐요'),
  pass('charm-s2-octopus', 'charm', 14, 's2-holo', '꾸물 문어', '누르면 다리를 흔드는 문어'),
  pass('avatar-unicorn', 'avatar', 15, 'classic', '유니콘', '시즌 2 패스 15단계', { motif: 'unicorn' }),
  pass('table-s2-holo', 'table', 16, 's2-holo', '홀로그램 테이블', '어두운 펠트에 빛이 도는 테두리', { set: 's2-holo' }),
  pass('face-s2-holo', 'cardFace', 17, 's2-holo', '홀로그램 앞면', '수정구와 보석 그림카드', { set: 's2-holo' }),
  pass('charm-s2-whale', 'charm', 18, 's2-holo', '물 뿜는 고래', '누르면 물줄기를 뿜어요'),
  pass('avatar-koala', 'avatar', 19, 'classic', '코알라', '시즌 2 패스 19단계', { motif: 'koala' }),
  pass('victory-s2-legend', 'victory', 20, 's2-holo', '레전드 피날레', '시즌 2 마지막 단계 보상 — 수정구가 별빛으로 터져요', { set: 's2-holo', legendary: true }),

  // 시즌 2 — 최고 점수 새 세트
  item('table-obsidian', 'table', 45000, 'obsidian', '블랙 오닉스 테이블', '숯빛 헤링본 펠트에 검은 대리석', { legendary: true, set: 'obsidian', season: 's2' }),
  item('back-obsidian', 'cardBack', 46500, 'obsidian', '블랙 오닉스 카드', '은빛 헤링본에 보석 하나', { legendary: true, set: 'obsidian', season: 's2' }),
  item('face-obsidian', 'cardFace', 48000, 'obsidian', '블랙 오닉스 앞면', '은테 두른 단정한 카드', { legendary: true, set: 'obsidian', season: 's2' }),
  item('victory-obsidian', 'victory', 50000, 'obsidian', '블랙 오닉스 피날레', '보석 뒤로 은빛 햇살이 돌아요', { legendary: true, set: 'obsidian', season: 's2' }),
]);

export const COSMETIC_SETS = Object.freeze([
  { id: 'rose-conservatory', name: '장미 온실', motif: 'rose', itemIds: ['table-rose-conservatory', 'face-rose-tea', 'back-rose-arbor', 'effect-rose-petal-storm', 'victory-rose-grand-bloom'] },
  { id: 'dessert-cafe', name: '딸기 디저트 카페', motif: 'shortcake', itemIds: ['table-dessert-cafe', 'charm-cafe-bear', 'face-dessert-cafe'] },
  { id: 'ancient-temple', name: '고대 신전', motif: 'moai', itemIds: ['face-stone-tablet', 'back-jade-rune'] },
  { id: 'neon-arcade', name: '네온 아케이드', motif: 'alien-monster', itemIds: ['face-neon-arcade', 'effect-pixel-combo', 'charm-ufo-pet', 'victory-high-score'] },
  { id: 'dream-kingdom', name: '꿈빛 왕국', motif: 'castle', itemIds: ['table-dream-kingdom', 'back-dream-kingdom', 'face-dream-kingdom', 'effect-dream-kingdom', 'charm-dream-kingdom', 'victory-dream-kingdom'] },
  { id: 'pink-cloud-pop', name: '핑크 구름 팝', motif: 'cloud', itemIds: ['table-pink-cloud-pop', 'back-pink-cloud-pop', 'effect-pink-cloud-carnival', 'victory-pink-cloud-pop'] },
  { id: 'moon-rabbit-observatory', name: '달토끼 천문대', motif: 'crescent-moon', itemIds: ['table-moon-rabbit-observatory', 'back-moon-rabbit-observatory', 'effect-moon-rabbit-orbit', 'victory-moon-rabbit-observatory'] },
  { id: 'strawberry-toy-parade', name: '딸기 토이 퍼레이드', motif: 'strawberry', itemIds: ['table-strawberry-toy-parade', 'back-strawberry-toy-parade', 'effect-strawberry-ribbon-pop', 'victory-strawberry-toy-parade'] },
  { id: 'rose-ballroom', name: '장미 무도회', motif: 'ring', itemIds: ['table-rose-ballroom', 'back-rose-ballroom', 'effect-rose-ballroom-waltz', 'victory-rose-ballroom-gala'] },
  { id: 'real-rose-garden', name: '리얼 로즈가든', motif: 'bouquet', itemIds: ['table-real-rose-garden', 'back-real-rose-garden', 'face-real-rose-garden', 'effect-real-rose-garden', 'victory-real-rose-garden'] },
  { id: 'neon-deepsea-city', name: '네온 심해 도시', motif: 'jellyfish', itemIds: ['table-neon-deepsea-city', 'back-neon-deepsea-city', 'effect-neon-deepsea-current', 'victory-neon-deepsea-city'] },
  { id: 'ancient-sun-temple', name: '고대 태양 신전', motif: 'sun', itemIds: ['table-ancient-sun-temple', 'back-ancient-sun-temple', 'effect-ancient-sun-rune', 'victory-ancient-sun-temple'] },
  { id: 's2-arena', name: '시즌 2 아레나', motif: 'trophy', itemIds: ['back-s2-emblem', 'face-s2-league', 'table-s2-arena', 'victory-s2-champion'] },
  { id: 's2-holo', name: '시즌 2 홀로그램', motif: 'crystal-ball', itemIds: ['back-s2-holo', 'table-s2-holo', 'face-s2-holo', 'victory-s2-legend'] },
  { id: 'obsidian', name: '블랙 오닉스', motif: 'gem-stone', itemIds: ['table-obsidian', 'back-obsidian', 'face-obsidian', 'victory-obsidian'] },
]);

// 장난감 — 그림 · 움직이는 판 · 소리 · 누를 때 대사 · 튀는 소품
export const TOYS = Object.freeze({
  custard: { motif: 'custard', sound: 'drop', lines: ['말랑!', '뿌잉!', '또 눌러 줘!'], burst: ['bubbles'], squish: 1.3 },
  star: { motif: 'star', animated: 'star', sound: 'glass', lines: ['빙글!', '반짝!', '슈웅!'], burst: ['sparkles'], spin: true },
  rose: { motif: 'rose', sound: 'pluck', lines: ['향긋!', '사랑을 담아!', '장미 파워!'], burst: ['rose'] },
  'cafe-bear': { motif: 'teddy-bear', animated: 'teddy-bear', sound: 'bong', lines: ['어서 오세요!', '푸딩 한 입?', '곰곰!'], burst: ['custard', 'hot-beverage'] },
  'star-cat': { motif: 'cat', animated: 'cat', sound: 'pluck', lines: ['냐옹!', '반짝 냥!', '별 보러 가자냥'], burst: ['star'] },
  'ufo-pet': { motif: 'flying-saucer', animated: 'flying-saucer', sound: 'glitch', lines: ['삐빅!', '외계 신호 수신', '슈우웅'], burst: ['alien-monster'], spin: true },
  unicorn: { motif: 'unicorn', animated: 'unicorn', sound: 'glass', lines: ['반짝반짝!', '꿈빛 마법!', '히힝!'], burst: ['sparkles', 'gem-stone'] },
  'rose-musicbox': { motif: 'rose', filter: 'peach', sound: 'music', lines: ['딩딩딩', '태엽 감기!', '장미 왈츠!'], burst: ['musical-notes'] },
  'rose-teacup': { motif: 'rose', filter: 'blush', sound: 'glass', lines: ['살랑!', '이슬 톡!', '꽃잎 팡!'], burst: ['bubbles', 'rose'] },
  'crimson-clockwork': { motif: 'rose', filter: 'crimson', sound: 'pluck', lines: ['활짝!', '진홍 팡!', '꽃잎 폭발!'], burst: ['rose', 'hibiscus'] },
  'royal-flower-fountain': { motif: 'fountain', animated: 'fountain', sound: 'fountain', lines: ['촤르르르!', '꽃정원 만개!', '무지개 분수 팡!'], burst: ['bouquet', 'cherry-blossom', 'tulip', 'bubbles'], big: true },
  die: { motif: 'game-die', sound: 'die', lines: ['데구르르!'], die: true },
  rocket: { motif: 'rocket', animated: 'rocket', sound: 'whoosh', lines: ['발사!', '3, 2, 1…', '슈웅!'], burst: ['fire'], launch: true },
  octopus: { motif: 'octopus', animated: 'octopus', sound: 'drop', lines: ['꾸물꾸물', '먹물 발사!', '다리가 여덟 개'], burst: ['bubbles'] },
  whale: { motif: 'spouting-whale', animated: 'spouting-whale', sound: 'fountain', lines: ['푸우!', '물줄기 발사', '고래 등장'], burst: ['bubbles', 'water-wave'] },
});

const CHARM_TOYS = Object.freeze({
  'charm-cafe-bear': 'cafe-bear', 'charm-star-cat': 'star-cat', 'charm-ufo-pet': 'ufo-pet', 'charm-dream-kingdom': 'unicorn',
  'charm-rose-musicbox': 'rose-musicbox', 'charm-rose-teacup': 'rose-teacup', 'charm-crimson-rose-clockwork': 'crimson-clockwork',
  'charm-royal-flower-fountain': 'royal-flower-fountain', 'charm-s2-die': 'die', 'charm-s2-rocket': 'rocket',
  'charm-s2-octopus': 'octopus', 'charm-s2-whale': 'whale',
});

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

export function isUnlocked(entry, peakPoints = 0, passTier = 0) {
  if (!entry) return false;
  if (entry.pass) return asNumber(passTier) >= entry.pass;
  return entry.threshold <= Math.max(0, asNumber(peakPoints));
}

export function cosmeticSetProgress(set, peakPoints, passTier = 0) {
  const itemIds = set?.itemIds || [];
  return { unlocked: itemIds.filter((id) => isUnlocked(cosmeticById(id), peakPoints, passTier)).length, total: itemIds.length };
}

export function unlockedCosmetics(peakPoints, passTier = 0) {
  return COSMETICS.filter((entry) => isUnlocked(entry, peakPoints, passTier));
}

// 점수로 새로 풀린 것(시즌 패스 보상은 newlyUnlockedByPass)
export function newlyUnlockedCosmetics(previousPeak, nextPeak) {
  const before = Math.max(0, asNumber(previousPeak));
  const after = Math.max(before, asNumber(nextPeak));
  return COSMETICS.filter((entry) => !entry.pass && entry.threshold > before && entry.threshold <= after);
}

export function newlyUnlockedByPass(previousTier, nextTier) {
  return COSMETICS.filter((entry) => entry.pass && entry.pass > asNumber(previousTier) && entry.pass <= asNumber(nextTier));
}

export function nextCosmeticUnlock(peakPoints) {
  const peak = Math.max(0, asNumber(peakPoints));
  const threshold = COSMETICS.reduce((next, entry) => (!entry.pass && entry.threshold > peak && entry.threshold < next ? entry.threshold : next), Number.POSITIVE_INFINITY);
  if (!Number.isFinite(threshold)) return null;
  return { threshold, remaining: threshold - peak, items: COSMETICS.filter((entry) => !entry.pass && entry.threshold === threshold) };
}

export function equippedCharmIds(equipped) {
  const saved = Array.isArray(equipped?.charms) && equipped.charms.length ? equipped.charms : [equipped?.charm];
  return Array.from({ length: CHARM_SLOT_COUNT }, (_, index) => {
    const candidate = saved[index] || DEFAULT_CHARM_LOADOUT[index];
    return cosmeticById(candidate)?.slot === 'charm' ? candidate : DEFAULT_CHARM_LOADOUT[index];
  });
}

export function normalizeEquipped(equipped, peakPoints, passTier = 0) {
  const normalized = Object.fromEntries(COSMETIC_SLOTS.map(({ key }) => {
    const candidate = equipped?.[key];
    const entry = cosmeticById(candidate);
    return [key, entry?.slot === key && isUnlocked(entry, peakPoints, passTier) ? candidate : DEFAULT_EQUIPPED[key]];
  }));
  const saved = Array.isArray(equipped?.charms) && equipped.charms.length ? equipped.charms : [equipped?.charm];
  const used = new Set();
  normalized.charms = Array.from({ length: CHARM_SLOT_COUNT }, (_, index) => {
    const candidate = saved[index] || DEFAULT_CHARM_LOADOUT[index];
    const entry = cosmeticById(candidate);
    const valid = entry?.slot === 'charm' && isUnlocked(entry, peakPoints, passTier);
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
    const key = ['custard', 'star', 'rose'][Math.max(0, Math.min(CHARM_SLOT_COUNT - 1, Number(slotIndex) || 0))];
    return { key, ...TOYS[key] };
  }
  const key = CHARM_TOYS[itemId] || 'star';
  return { key, ...TOYS[key] };
}

export function equippedSetBonuses(equipped) {
  const charms = equippedCharmIds(equipped);
  return COSMETIC_SETS.filter((set) => set.itemIds.every((id) => {
    const entry = cosmeticById(id);
    return entry && (entry.slot === 'charm' ? charms.includes(id) : equipped?.[entry.slot] === id);
  }));
}
