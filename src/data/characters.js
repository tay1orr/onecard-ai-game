// AI 상대 캐릭터 — 누구인지(이름 · 그림 · 대사)만 정한다. 단계 · AI 세기 · 설명은 난이도(rating.js 의 AI_OPPONENTS)가 따로 정한다(makeRival)
// 그림은 선생님이 GPT 로 만든 것(gpt그림/ → scripts/build-gpt.mjs → cut/char-<이름>).
// 11-24 선생님 「그림 제목에 영향받지 말고 알아서 판단해서 캐릭터 배치」 — 카드를 든 열다섯은 상대로, 장미 · 디저트 · 풍선을 든 일곱은 내 캐릭터(cosmetics.js)로 나눴다
// 출처: 치이카와 · 하치와레 · 우사기 · 랏코(나가노 「치이카와」) · 짱구(우스이 요시토 「크레용 신짱」) · 체리(CLAMP 「카드캡터 사쿠라」)
//       코난 · 괴도 키드(아오야마 고쇼 「명탐정 코난」) · 케로로(요시자키 미네 「개구리 중사 케로로」) · 하츄핑(SAMG 「캐치! 티니핑」)
//       쿠로미 · 헬로키티 · 포차코 · 한교동(산리오) · 장미 공주(90년대 순정 만화풍 공주 그림 — 어느 작품인지 확인하지 못해 이름을 붙임) — 수업 자료(저작권 교육 예외)
const RIVALS = [
  {
    name: '치이카와', title: '열심히 하는', portrait: 'char-chiikawa', color: '#f7e3e6', deep: '#5a3a44',
    lines: {
      intro: ['우와…!', '할 수 있어…!'],
      think: ['으음…', '이거…?', '흐에…'],
      attack: ['에잇…!', '미안해…!'],
      hit: ['흐에에…', '울지 않을 거야…'],
      playerAttack: ['힉!', '무, 무서워…'],
      joker: ['우와아앗!', '조커…!'],
      onecard: ['한 장 남았어…!', '할 수 있어…!'],
      playerOnecard: ['아앗…!', '안 돼…!'],
      win: ['해냈다…!', '우와아…!'],
      lose: ['흐에에…', '다음엔… 꼭…!'],
    },
  },
  {
    name: '하치와레', title: '낙천적인', portrait: 'char-hachiware', color: '#9ec3ff', deep: '#1f3560',
    lines: {
      intro: ['같이 재밌게 하자!', '어떻게든 될 거야!'],
      think: ['음, 이게 좋겠다!', '어디 보자~', '괜찮아 괜찮아'],
      attack: ['자, 받아!', '공격이다~!'],
      hit: ['으앗, 많다!', '그래도 괜찮아!'],
      playerAttack: ['오, 대단해!', '그렇게 나온다면…!'],
      joker: ['조커다! 멋있다!', '우와, 조커!'],
      onecard: ['한 장 남았다!', '어떻게든 될 거야~!'],
      playerOnecard: ['앗, 서둘러야지!', '아직 몰라!'],
      win: ['이겼다~! 재밌었어!', '역시 어떻게든 됐어!'],
      lose: ['너 정말 잘한다!', '다음 판도 같이 하자!'],
    },
  },
  {
    name: '우사기', title: '종잡을 수 없는', portrait: 'char-usagi', color: '#ffe27a', deep: '#5a4808',
    lines: {
      intro: ['우라!', '야하!'],
      think: ['하아?', '후루룻…', '우라…'],
      attack: ['우라아!', '야하하!'],
      hit: ['하아아?!', '우…우라…'],
      playerAttack: ['하아?!', '야!'],
      joker: ['우라라라!', '야하아아!'],
      onecard: ['우라!!', '야하~!'],
      playerOnecard: ['하아?!', '우라…!'],
      win: ['우라라라라!', '야하하하!'],
      lose: ['하…하아…', '우라…'],
    },
  },
  {
    name: '랏코', title: '토벌 1위', portrait: 'char-rakko', color: '#c9a27e', deep: '#3a2a1e',
    lines: {
      intro: ['…시작하지', '토벌 1위의 실력을 보여 주지'],
      think: ['…', '이 길이 맞아', '흐름을 읽는다'],
      attack: ['토벌이다', '피할 수 없어'],
      hit: ['…흠', '아직이다'],
      playerAttack: ['제법이군', '그 수는 봤다'],
      joker: ['조커… 좋아', '흥미롭군'],
      onecard: ['마지막이다', '끝이 보인다'],
      playerOnecard: ['막는다', '그 한 장을 읽는다'],
      win: ['수련을 계속해라', '좋은 승부였다'],
      lose: ['…강하군', '나도 더 수련해야겠어'],
    },
  },
  {
    name: '짱구', title: '장난꾸러기', portrait: 'char-shinchan', color: '#ff6b5a', deep: '#5a1a12',
    lines: {
      intro: ['안녕~ 짱구예요!', '오늘도 이겨 볼까~'],
      think: ['음~ 이거 할까?', '흐흐흐', '엄마한텐 비밀~'],
      attack: ['액션 빔~!', '받아라, 짱구 공격!'],
      hit: ['으악, 너무해~', '엄마한테 이를 거야~'],
      playerAttack: ['어라라?', '헤헤, 제법인데~'],
      joker: ['조커다~!', '와, 조커!'],
      onecard: ['한 장 남았지롱~', '이제 끝이야~'],
      playerOnecard: ['어라, 벌써?', '막아야지~'],
      win: ['이겼다~ 부리부리~', '역시 나야~'],
      lose: ['에이~ 졌다', '다시 해~ 한 판 더~'],
    },
  },
  {
    name: '체리', title: '카드캡터', portrait: 'char-sakura', color: '#ff9ccf', deep: '#5a1a3a',
    lines: {
      intro: ['잘 부탁해!', '절대 괜찮을 거야!'],
      think: ['아까 그 카드가 나왔으니까…', '어떤 카드가 좋을까', '집중, 집중!'],
      attack: ['카드여, 힘을 빌려줘!', '봉인 해제!'],
      hit: ['호에에~!', '괜찮아, 아직이야!'],
      playerAttack: ['호에!', '대단해!'],
      joker: ['조커 카드…!', '이건 예상 못 했어!'],
      onecard: ['마지막 카드야!', '절대 괜찮을 거야!'],
      playerOnecard: ['서둘러야 해!', '아직 끝나지 않았어!'],
      win: ['해냈다! 절대 괜찮다고 했지?', '모든 카드가 도와줬어!'],
      lose: ['호에에… 졌다', '다음엔 꼭 이길 거야!'],
    },
  },
  {
    name: '코난', title: '명탐정', portrait: 'char-conan', color: '#4f7fe0', deep: '#14254f',
    lines: {
      intro: ['진실은 언제나 하나!', '추리를 시작해 볼까'],
      think: ['잠깐, 아까 그 카드…', '흠…', '단서는 다 나와 있어'],
      attack: ['범인은 바로 너야!', '이 카드로 증명하지'],
      hit: ['아차, 놓쳤다', '이건 계산 밖이야'],
      playerAttack: ['그렇게 나올 줄 알았어', '제법인데?'],
      joker: ['조커라니, 트릭이군', '예상 밖이야!'],
      onecard: ['마지막 한 장, 추리 끝!', '이제 진실이 드러날 거야'],
      playerOnecard: ['그 한 장, 무늬가 뭘까', '막아야 해!'],
      win: ['진실은 언제나 하나!', '사건 해결!'],
      lose: ['내 추리가 틀렸다니…', '다음엔 꼭 밝혀낼 거야'],
    },
  },
  {
    name: '키드', title: '괴도', portrait: 'char-kid', color: '#dfe8f2', deep: '#1e2f5a',
    lines: {
      intro: ['쇼타임이다!', '오늘 밤, 이 판을 훔치러 왔지'],
      think: ['예고장대로…', '후훗', '마술의 비밀은 말할 수 없지'],
      attack: ['마술 같은 한 수!', '눈 깜짝할 사이에'],
      hit: ['이런, 들켰나', '마술이 살짝 빗나갔군'],
      playerAttack: ['훌륭한 트릭이군', '제법이야, 탐정님'],
      joker: ['조커라니, 나다운 카드군', '멋진 마술이야!'],
      onecard: ['마지막 한 장, 쇼의 피날레다', '예고한 대로지'],
      playerOnecard: ['그 한 장, 훔쳐 가겠어', '아직 쇼는 안 끝났어'],
      win: ['예고대로 훔쳐 갔다!', '오늘 밤 쇼는 여기까지'],
      lose: ['오늘은 내가 졌군', '다음 예고장을 기다려'],
    },
  },
  {
    name: '케로로', title: '지구 침략 중인', portrait: 'char-keroro', color: '#7cc957', deep: '#1f4a14',
    lines: {
      intro: ['케로케로~ 침략 개시다!', '이 판을 이기면 지구는 내 것이다!'],
      think: ['케로…', '작전을 세우는 중이다', '흠, 건프라 생각 중'],
      attack: ['돌격이다, 케로!', '받아라, 케로로 공격!'],
      hit: ['케로오오?!', '작전 실패다…'],
      playerAttack: ['케, 케로?!', '제법이군, 지구인!'],
      joker: ['조커라니, 반칙이다 케로!', '케로케로?!'],
      onecard: ['한 장 남았다, 케로!', '침략 직전이다!'],
      playerOnecard: ['막아라, 케로!', '비상사태다!'],
      win: ['케로케로~ 침략 성공!', '역시 이 몸이다, 케로!'],
      lose: ['케로… 작전 실패다', '다음엔 꼭 침략한다!'],
    },
  },
  {
    name: '하츄핑', title: '사랑의', portrait: 'char-hachuping', color: '#ff7eb6', deep: '#5a1a3a',
    lines: {
      intro: ['사랑의 하츄핑이야!', '하츄~ 같이 놀자!'],
      think: ['어떤 카드에 사랑을 담을까?', '하츄…', '음~ 이거!'],
      attack: ['사랑의 공격!', '하츄~ 받아!'],
      hit: ['히잉, 너무 많아', '그래도 괜찮아!'],
      playerAttack: ['꺄, 깜짝이야!', '대단해!'],
      joker: ['조커라니, 반짝반짝!', '우와~'],
      onecard: ['한 장 남았어, 하츄!', '마지막 카드에 사랑을!'],
      playerOnecard: ['안 돼~', '서둘러야 해!'],
      win: ['사랑이 이겼어!', '하츄~ 신난다!'],
      lose: ['너도 정말 잘한다!', '다음엔 꼭 이길 거야!'],
    },
  },
  {
    name: '쿠로미', title: '시크한', portrait: 'char-kuromi', color: '#a38bd0', deep: '#24163a',
    lines: {
      intro: ['흥, 한판 붙자!', '마이멜로디보다 내가 더 잘해'],
      think: ['흐음…', '어떻게 골려 줄까', '이거다!'],
      attack: ['받아라, 쿠로미 공격!', '히히, 걸렸다!'],
      hit: ['으으, 분해!', '이건 마이멜로디 탓이야!'],
      playerAttack: ['뭐야, 제법인데?', '흥!'],
      joker: ['조커?! 반칙이야!', '으악!'],
      onecard: ['한 장 남았다, 히히', '이제 끝이야!'],
      playerOnecard: ['안 돼, 막을 거야!', '흥, 아직이야!'],
      win: ['역시 쿠로미 님이야!', '히히, 이겼다!'],
      lose: ['흥, 오늘만 봐준 거야', '분해! 한 판 더!'],
    },
  },
  {
    name: '헬로키티', title: '다정한', portrait: 'char-hellokitty', color: '#e8394a', deep: '#5a1018',
    lines: {
      intro: ['안녕! 같이 놀자', '친구랑 하는 카드놀이 좋아'],
      think: ['어떤 카드가 좋을까?', '음~', '사과 파이 생각 중'],
      attack: ['미안, 공격이야!', '살짝 받아 줄래?'],
      hit: ['어머, 많이 받았네', '괜찮아, 아직이야'],
      playerAttack: ['어머나!', '잘하는데?'],
      joker: ['조커다!', '깜짝 놀랐어'],
      onecard: ['한 장 남았어!', '거의 다 왔어'],
      playerOnecard: ['벌써 한 장이야?', '서둘러야겠다'],
      win: ['이겼다! 사과 파이 먹자', '같이 해서 즐거웠어'],
      lose: ['정말 잘했어!', '다음에 또 놀자'],
    },
  },
  {
    name: '포차코', title: '공놀이 좋아하는', portrait: 'char-pochacco', color: '#ff6b6b', deep: '#5a1a1a',
    lines: {
      intro: ['같이 뛰어놀자!', '공놀이도 카드놀이도 좋아!'],
      think: ['음… 이거!', '킁킁, 좋은 카드 냄새', '어디 보자~'],
      attack: ['슛~!', '받아라, 멍!'],
      hit: ['깨갱…', '아직 힘 남았어!'],
      playerAttack: ['왈! 깜짝이야', '멋진 패스인데?'],
      joker: ['우와, 조커다!', '멍멍?!'],
      onecard: ['한 장 남았다, 멍!', '골인 직전이야!'],
      playerOnecard: ['앗, 막아야 해!', '수비, 수비!'],
      win: ['골인~! 이겼다!', '바나나 아이스크림 먹으러 가자!'],
      lose: ['좋은 경기였어!', '다음엔 더 빨리 뛸 거야!'],
    },
  },
  {
    name: '한교동', title: '웃기고 싶은', portrait: 'char-hangyodon', color: '#4fb8b0', deep: '#123f3c',
    lines: {
      intro: ['뻐끔뻐끔, 한판 할까?', '오늘은 내가 영웅이 될 거야'],
      think: ['뻐끔…', '물속처럼 조용히…', '음, 이거다'],
      attack: ['물대포 발사!', '받아라, 한교동 공격!'],
      hit: ['뻐끔… 많다', '눈물이 바다만큼…'],
      playerAttack: ['어푸어푸!', '헉, 파도가 친다'],
      joker: ['조커?! 비늘이 다 섰어', '뻐끔?!'],
      onecard: ['한 장 남았어, 뻐끔', '영웅의 시간이다!'],
      playerOnecard: ['앗, 그물을 쳐야 해!', '막아야 해!'],
      win: ['나도 영웅이 됐다!', '웃었지? 내가 이겼어!'],
      lose: ['뻐끔… 졌다', '그래도 재밌었지?'],
    },
  },
  {
    name: '장미 공주', title: '무도회의', portrait: 'char-rose-princess', color: '#f7a8c4', deep: '#5a2140',
    lines: {
      intro: ['장미 무도회에 온 걸 환영해요', '오늘은 카드로 춤춰 볼까요'],
      think: ['어느 장미를 고를까…', '음…', '우아하게, 정확하게'],
      attack: ['장미에는 가시가 있죠', '실례할게요'],
      hit: ['드레스가 구겨졌어요', '꽃잎이 떨어졌네요'],
      playerAttack: ['대담하시네요', '어머!'],
      joker: ['조커라니, 장미보다 화려해요', '눈부신 한 수예요'],
      onecard: ['마지막 한 장이에요', '이제 활짝 필 차례'],
      playerOnecard: ['그 꽃은 피우게 둘 수 없어요', '무도회는 아직 안 끝났어요'],
      win: ['오늘 무도회의 주인공은 저예요', '장미처럼 아름다운 승부였어요'],
      lose: ['당신이 오늘의 주인공이에요', '이렇게 아름다운 패배는 처음이에요'],
    },
  },
];

// 캐릭터 열다섯 — 별 · 플레이 방식 설명은 캐릭터가 아니라 난이도가 정한다
export const CHARACTERS = Object.freeze(RIVALS.map((persona) => Object.freeze({ id: persona.portrait, ...persona })));

// 캐릭터는 열다섯 중 무작위 — 바로 전 판 캐릭터만 피한다
let lastPersonaId = null;
export function pickPersona(random = Math.random, avoid = lastPersonaId) {
  const pool = CHARACTERS.filter((persona) => persona.id !== avoid);
  const persona = pool[Math.floor(random() * pool.length)] || CHARACTERS[0];
  lastPersonaId = persona.id;
  return persona;
}

// 로비 무대에 세울 캐릭터 몇 — 겹치지 않게 섞어서
export function shufflePersonas(count, random = Math.random) {
  const list = [...CHARACTERS];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [list[index], list[other]] = [list[other], list[index]];
  }
  return list.slice(0, Math.max(0, count));
}

// 상대 = 캐릭터(누구) + 난이도(1~20단계, rating.js 의 AI_OPPONENTS 한 줄). key 는 난이도(AI 세기 · 반응이 쓴다)
// elite = 11단계(옛 ★6, 카드를 세는 AI)부터 — 대결 화면에서 조금 더 무게 있게 보인다
export function makeRival(opponent, persona = pickPersona()) {
  return Object.freeze({ ...persona, key: opponent.key, level: opponent.level, tier: opponent.tier, elite: opponent.level >= 11, blurb: opponent.status });
}

export function pickLine(rival, situation, random = Math.random) {
  const lines = rival?.lines?.[situation] || [];
  return lines.length ? lines[Math.floor(random() * lines.length)] : '';
}

// 온라인 상대는 닉네임으로 캐릭터를 정한다(두 브라우저에서 같게 보이도록) — 동물 대신 내 캐릭터 일곱 가운데 하나(11-24)
const ONLINE_LOOKS = ['char-choonsik', 'char-mymelody', 'char-cinnamoroll', 'char-pompompurin', 'char-loopy', 'char-mangom', 'char-sailormoon'];
const ONLINE_COLORS = ['#f4a93b', '#7c93ff', '#9cc9a6', '#6fd6e8', '#e35a6a', '#ff8fab', '#c9a45c', '#b39bff'];
export function onlineLook(nickname = '') {
  let hash = 0;
  for (const char of String(nickname)) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return { portrait: ONLINE_LOOKS[hash % ONLINE_LOOKS.length], color: ONLINE_COLORS[(hash >> 4) % ONLINE_COLORS.length] };
}
