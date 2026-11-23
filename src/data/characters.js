// AI 상대 다섯 — 그림은 Fluent Emoji 3D(MIT)
// 대사는 상황마다 몇 개씩, 표정은 Fluent 얼굴 그림 이름
export const RIVALS = Object.freeze([
  {
    key: 'star1', stars: 1, name: '루미', title: '느긋한', motif: 'sloth', color: '#9cc9a6', deep: '#21483a',
    blurb: '마음 가는 카드를 천천히 고르는 나무늘보',
    faces: { think: 'sleeping', happy: 'squinting', shock: 'astonished', sad: 'crying', smug: 'smirking', party: 'partying', angry: 'grimacing' },
    lines: {
      intro: ['천천히 해도 괜찮아요', '오늘은 느긋하게 한 판'],
      think: ['음…', '어디 보자', '하암…'],
      attack: ['살짝 받아 볼래요?', '미안해요, 공격이에요'],
      hit: ['아이고, 많이 받았네', '괜찮아요, 천천히…'],
      playerAttack: ['어머, 공격이네요', '살살 해 줘요'],
      joker: ['조커라니!', '깜짝이야'],
      onecard: ['저 한 장 남았어요', '어, 이기는 건가?'],
      playerOnecard: ['벌써 한 장이요?', '빠르다…'],
      win: ['헤헤, 운이 좋았어요', '느긋한 게 이겼네요'],
      lose: ['잘했어요! 다음엔 저도', '역시 빠르시네요'],
    },
  },
  {
    key: 'star2', stars: 2, name: '미오', title: '재빠른', motif: 'cat-face', color: '#f4a93b', deep: '#5a3608',
    blurb: '무늬와 공격 카드를 재빨리 살피는 고양이',
    faces: { think: 'zany', happy: 'rofl', shock: 'screaming', sad: 'crying', smug: 'squinting', party: 'partying', angry: 'steam' },
    lines: {
      intro: ['빨리빨리! 시작하자', '내가 더 빠를걸'],
      think: ['요거!', '흠흠', '이거다!'],
      attack: ['받아라 냥!', '공격 간다!'],
      hit: ['으앗, 너무 많아!', '냥… 억울해'],
      playerAttack: ['칫, 막아 볼까', '그걸 내?'],
      joker: ['조커?! 반칙이야', '앗, 조커다!'],
      onecard: ['한 장 남았다냥!', '이제 끝이다냥'],
      playerOnecard: ['안 돼, 막아야 해', '벌써?!'],
      win: ['내가 제일 빨라!', '헤헤 이겼다'],
      lose: ['다시 해! 한 판 더!', '이번엔 봐준 거야'],
    },
  },
  {
    key: 'star3', stars: 3, name: '네오', title: '영리한', motif: 'owl', color: '#7c93ff', deep: '#1e2a66',
    blurb: '좋은 수를 계산하는 부엉이',
    faces: { think: 'monocle', happy: 'sunglasses', shock: 'astonished', sad: 'crying', smug: 'smirking', party: 'partying', angry: 'grimacing' },
    lines: {
      intro: ['좋은 승부를 기대할게', '확률은 내 편이야'],
      think: ['계산 중…', '이 수가 좋겠군'],
      attack: ['예상했지?', '계산된 공격이야'],
      hit: ['계산 밖이었어', '흠, 다시 세어 보자'],
      playerAttack: ['흥미로운 수네', '그렇게 나오는군'],
      joker: ['조커는 계산에 없었는데', '좋은 한 수야'],
      onecard: ['마지막 한 장이야', '체크메이트가 보이네'],
      playerOnecard: ['이런, 서둘러야겠군', '한 장이라니'],
      win: ['논리적인 결과야', '좋은 판이었어'],
      lose: ['훌륭해, 배웠어', '다음엔 내가 맞힐 거야'],
    },
  },
  {
    key: 'star4', stars: 4, name: '아스트라', title: '냉철한', motif: 'wolf', color: '#6fd6e8', deep: '#0f4752',
    blurb: '최선과 차선의 흐름을 읽는 늑대',
    faces: { think: 'monocle', happy: 'sunglasses', shock: 'astonished', sad: 'grimacing', smug: 'smirking', party: 'sunglasses', angry: 'steam' },
    lines: {
      intro: ['봐주지 않아', '흐름은 내가 읽는다'],
      think: ['…', '최선은 이거'],
      attack: ['버텨 봐', '이제 시작이야'],
      hit: ['…괜찮아', '이 정도는 예상했어'],
      playerAttack: ['나쁘지 않군', '제법이야'],
      joker: ['조커… 대단한데', '좋아, 받아 주지'],
      onecard: ['끝이 보이네', '마지막이다'],
      playerOnecard: ['막는다', '여기서 끝낼 수 없어'],
      win: ['당연한 결과', '다음에 또 와'],
      lose: ['…인정할게', '실력이 늘었네'],
    },
  },
  {
    key: 'star5', stars: 5, name: '오르비스', title: '무결한', motif: 'dragon-face', color: '#e35a6a', deep: '#5a1520',
    blurb: '공개된 정보로 다음 수를 읽는 용',
    faces: { think: 'monocle', happy: 'smirking', shock: 'screaming', sad: 'grimacing', smug: 'smirking', party: 'sunglasses', angry: 'steam' },
    lines: {
      intro: ['도전자인가', '나를 이길 수 있을까'],
      think: ['모든 수가 보인다', '흥미롭군'],
      attack: ['이것이 힘의 차이', '불꽃이다'],
      hit: ['…이럴 수가', '흠집이 났군'],
      playerAttack: ['감히', '건방지군'],
      joker: ['조커를 쓰다니!', '대담하구나'],
      onecard: ['마지막 한 장', '끝이다'],
      playerOnecard: ['멈춰라', '그럴 수는 없지'],
      win: ['무결한 승리', '아직 멀었다'],
      lose: ['내가… 졌다고?', '인정하지. 강하구나'],
    },
  },
]);

export function rivalByKey(key) {
  return RIVALS.find((rival) => rival.key === key) || RIVALS[2];
}

export function pickLine(rival, situation, random = Math.random) {
  const lines = rival?.lines?.[situation] || [];
  return lines.length ? lines[Math.floor(random() * lines.length)] : '';
}

// 온라인 상대는 닉네임으로 캐릭터를 정한다(두 브라우저에서 같게 보이도록)
const ONLINE_LOOKS = ['fox', 'penguin', 'panda', 'koala', 'tiger-face', 'frog', 'hamster', 'bear', 'dog-face', 'baby-chick'];
const ONLINE_COLORS = ['#f4a93b', '#7c93ff', '#9cc9a6', '#6fd6e8', '#e35a6a', '#ff8fab', '#c9a45c', '#b39bff'];
export function onlineLook(nickname = '') {
  let hash = 0;
  for (const char of String(nickname)) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return { motif: ONLINE_LOOKS[hash % ONLINE_LOOKS.length], color: ONLINE_COLORS[(hash >> 4) % ONLINE_COLORS.length] };
}
