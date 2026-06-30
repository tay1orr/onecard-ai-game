# ONE! 원카드 — Claude Git·Vercel 인계

## 현재 상태

- Codex가 처음부터 작성한 AI 원카드 1차 버전
- 규칙 자동 테스트 7개 통과
- 데스크톱 1280×720, 모바일 390×844 브라우저 점검 완료
- 실제 카드 선택, 7 무늬 변경, AI 응답, 턴 연속 진행 확인
- 브라우저 콘솔 오류와 경고 없음
- Git 커밋과 원격 저장소 작업은 수행하지 않음

## 배포 대상

프로젝트 루트는 이 문서의 상위 폴더인 `2026-06-30-onecard-game`입니다. 별도 빌드 명령이나 설치 과정이 없습니다.

Vercel 권장 설정:

- Framework Preset: `Other`
- Root Directory: `2026-06-30-onecard-game` 폴더를 저장소 루트로 올릴 경우 `.`
- Build Command: 비움
- Output Directory: 비움
- Install Command: 비움

## 커밋 전 확인

```powershell
node tests\2026-06-30-game-rules.test.mjs
python -m http.server 8765
```

브라우저에서 `http://localhost:8765/`을 열어 홈 화면과 AI 대전을 확인합니다.

## 권장 커밋 메시지

```text
feat: add responsive one-card game with three AI levels
```

## 구현 구성

- `index.html`: 홈, 게임판, 무늬 선택, 규칙, 결과 화면
- `styles.css`: 다크 테이블 디자인, 카드 UI, 반응형 레이아웃
- `src/game-engine.js`: 덱, 턴, 공격, 특수 카드, 승리 처리
- `src/ai-player.js`: 쉬움·보통·어려움 AI 선택 로직
- `src/main.js`: 렌더링, 입력, AI 턴, 기록과 화면 흐름
- `src/audio.js`: Web Audio 효과음과 소리 설정
- `tests/2026-06-30-game-rules.test.mjs`: 핵심 규칙 자동 테스트
- `vercel.json`: 정적 배포 URL 설정

## 적용 규칙

- 7장씩 배분하는 52장 덱
- 같은 무늬 또는 같은 숫자, 7은 와일드 카드
- 2는 +2, A는 +3이며 서로 누적 방어 가능
- J는 턴 건너뛰기
- Q는 방향 전환이며 2인 대전에서는 한 번 더
- K는 한 번 더
- 공격을 막지 못하면 누적 장수를 받고 턴 종료
- 일반 드로우도 한 장을 받고 턴 종료
- 덱이 떨어지면 맨 위 카드를 제외한 버린 카드 재혼합

## 멀티플레이 확장 메모

`game-engine.js`는 DOM과 분리되어 있으므로 향후 방 코드 대전에서는 게임 상태의 소유권과 전송 계층을 추가하면 됩니다. 다음 단계에서 정할 사항은 다음과 같습니다.

1. 실시간 백엔드: Supabase Realtime, Firebase 또는 별도 WebSocket
2. 방 코드 길이와 방 만료 시간
3. 재접속·이탈 승패 정책
4. 서버 권위형 검증과 카드 정보 비공개 전송 방식

정적 파일만으로는 신뢰할 수 있는 온라인 멀티플레이를 구현할 수 없으므로 이 단계부터 외부 실시간 서비스가 필요합니다.
