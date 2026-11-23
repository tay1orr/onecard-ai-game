// AI 상대 — 실제 동물 사진 초상(누끼). ★1~★5 는 시즌 1부터의 상대, ★6~★8 은 높은 점수(5만 점 이상) 상대
// 대사는 상황마다 몇 개씩
export const RIVALS = Object.freeze([
  {
    key: 'star1', stars: 1, name: '루미', title: '느긋한', portrait: 'sloth', color: '#9cc9a6', deep: '#21483a',
    blurb: '마음 가는 카드를 천천히 고르는 나무늘보',
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
    key: 'star2', stars: 2, name: '미오', title: '재빠른', portrait: 'cat', color: '#f4a93b', deep: '#5a3608',
    blurb: '무늬와 공격 카드를 재빨리 살피는 고양이',
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
    key: 'star3', stars: 3, name: '네오', title: '영리한', portrait: 'owl', color: '#7c93ff', deep: '#1e2a66',
    blurb: '좋은 수를 계산하는 부엉이',
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
    key: 'star4', stars: 4, name: '아스트라', title: '냉철한', portrait: 'wolf', color: '#6fd6e8', deep: '#0f4752',
    blurb: '최선과 차선의 흐름을 읽는 늑대',
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
    key: 'star5', stars: 5, name: '오르비스', title: '무결한', portrait: 'dragon', color: '#e35a6a', deep: '#5a1520',
    blurb: '공개된 정보로 다음 수를 읽는 용',
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
  {
    key: 'star6', stars: 6, name: '세레나', title: '우아한', portrait: 'swan', color: '#dfe8f2', deep: '#2b3a52', elite: true,
    blurb: '지나간 카드를 하나도 잊지 않는 백조',
    lines: {
      intro: ['우아하게 겨뤄 봐요', '오늘 나온 카드는 다 기억할게요'],
      think: ['아까 그 카드가 나왔으니…', '남은 건 이것뿐이네요', '조용히, 정확하게'],
      attack: ['실례할게요', '피할 카드가 없을 텐데요'],
      hit: ['어머, 예상보다 많네요', '깃털이 조금 흐트러졌어요'],
      playerAttack: ['좋은 타이밍이에요', '기억해 둘게요'],
      joker: ['조커가 남아 있었군요', '이건 계산에 넣었어야 했는데'],
      onecard: ['마지막 한 장이에요', '이제 물 위로 올라갈 때'],
      playerOnecard: ['그 한 장, 무늬가 뭘까요', '서두르지 않을게요'],
      win: ['우아한 마무리였어요', '다음에도 기억할게요'],
      lose: ['훌륭해요, 정말로', '오늘은 제가 졌네요'],
    },
  },
  {
    key: 'star7', stars: 7, name: '녹턴', title: '그림자', portrait: 'black-panther', color: '#9a7cff', deep: '#1a1230', elite: true,
    blurb: '나올 카드를 수백 번 그려 보고 고르는 흑표범',
    lines: {
      intro: ['…시작하지', '어둠 속에서 다 보여'],
      think: ['수백 갈래 중에 하나', '…', '이 길이 가장 길어'],
      attack: ['도망칠 곳은 없어', '조용히, 깊게'],
      hit: ['…흠', '그림자가 길어졌군'],
      playerAttack: ['날카롭군', '그 수는 봤어'],
      joker: ['조커… 좋아', '빛이 번쩍이는군'],
      onecard: ['마지막 걸음', '끝이 가까워'],
      playerOnecard: ['막는다', '그 한 장을 읽는다'],
      win: ['밤은 내 편이야', '다시 와, 어둠 속으로'],
      lose: ['…강하군', '빛이 이겼어'],
    },
  },
  {
    key: 'star8', stars: 8, name: '로제아', title: '장미 정원의', portrait: 'peacock', color: '#ff6f8a', deep: '#3a0f1e', elite: true,
    blurb: '장미 정원의 주인 — 가장 깊이 읽는 공작',
    lines: {
      intro: ['내 장미 정원에 온 걸 환영해요', '꽃이 지기 전에 끝내 볼까요'],
      think: ['가시는 숨겨 두는 거예요', '어느 꽃을 피울까', '한 수 더 깊이'],
      attack: ['가시에 찔렸네요', '장미에는 가시가 있죠'],
      hit: ['꽃잎이 떨어졌어요', '괜찮아요, 다시 피면 돼요'],
      playerAttack: ['대담하네요', '정원사가 놀라겠어요'],
      joker: ['조커라니, 장미보다 화려하네요', '눈부신 한 수예요'],
      onecard: ['마지막 꽃봉오리', '이제 활짝 필 차례'],
      playerOnecard: ['그 꽃은 피우게 둘 수 없어요', '정원 문을 닫을게요'],
      win: ['내 정원은 오늘도 만개', '백만 송이 중 한 송이를 드릴게요'],
      lose: ['당신이 정원의 새 주인이에요', '이렇게 아름다운 패배는 처음이에요'],
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
const ONLINE_LOOKS = ['fox', 'penguin', 'panda', 'koala', 'tiger', 'frog', 'hamster', 'bear', 'dog', 'chick'];
const ONLINE_COLORS = ['#f4a93b', '#7c93ff', '#9cc9a6', '#6fd6e8', '#e35a6a', '#ff8fab', '#c9a45c', '#b39bff'];
export function onlineLook(nickname = '') {
  let hash = 0;
  for (const char of String(nickname)) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return { portrait: ONLINE_LOOKS[hash % ONLINE_LOOKS.length], color: ONLINE_COLORS[(hash >> 4) % ONLINE_COLORS.length] };
}
