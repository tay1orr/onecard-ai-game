# ONE! 원카드 — Claude Git·Vercel 인계

## 현재 상태

- Codex가 처음부터 작성한 AI 원카드와 Supabase 2인 온라인 대전 버전
- 규칙·레이아웃·멀티 보안·DOM 계약 자동 테스트 34개 통과
- 데스크톱 1280×720, 모바일 390×844 브라우저 점검 완료
- 실제 카드 선택, 7 무늬 변경, AI 응답, 턴 연속 진행 확인
- 7장·16장 손패 배치, 카드 기록, 장난감 상호작용 확인
- 조커 +5, 7 패 확인, 원카드·공격 이펙트, 장난감 이동 확인
- 주사위 선공, 뽑은 카드 공개, 손패→더미 카드 이동 애니메이션 구현
- 새 액션은 재생 중인 이전 액션을 즉시 교체하도록 구현
- 온라인 화면은 Supabase 공개 값 입력 전 설정 안내 상태로 유지
- 실제 온라인 2브라우저 통합 테스트는 Supabase 설정 후 필요
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
npm.cmd test
python -m http.server 8765
```

브라우저에서 `http://localhost:8765/`의 AI 대전을 확인합니다. Supabase 설정 후 일반 창과 시크릿 창에서 `/2026-06-30-online.html`을 각각 열어 2인 대전도 확인합니다.

## 권장 커밋 메시지

```text
feat: add dice-driven AI and secure Supabase multiplayer
```

## 구현 구성

- `index.html`: 홈, 게임판, 무늬 선택, 규칙, 결과 화면
- `styles.css`: 다크 테이블 디자인, 카드 UI, 반응형 레이아웃
- `src/game-engine.js`: 덱, 턴, 공격, 특수 카드, 승리 처리
- `src/ai-player.js`: 쉬움·보통·어려움 AI 선택 로직
- `src/main.js`: 렌더링, 입력, AI 턴, 기록과 화면 흐름
- `src/audio.js`: Web Audio 효과음과 소리 설정
- `src/2026-06-30-hand-layout.js`: 손패 수와 화면 폭에 따른 동적 간격 계산
- `src/2026-06-30-effects.js`: 공격·조커·원카드 전체 화면 이펙트와 새 액션 우선 교체
- `src/2026-06-30-card-motion.js`: 플레이 카드의 손패→더미 이동
- `src/2026-06-30-toy-drag.js`: 마우스·터치·키보드 장난감 이동
- `2026-06-30-online.html`, `2026-06-30-online.css`: 온라인 입장·대기실·게임판
- `src/2026-06-30-multiplayer.js`: 익명 인증, RPC, Realtime, 연결 유지
- `src/2026-06-30-online-main.js`: 온라인 UI·주사위·카드·이펙트 흐름
- `supabase/2026-06-30-onecard-schema.sql`: 방·비공개 패·이벤트·RLS·게임 RPC
- `docs/2026-06-30-supabase-setup.md`: 사용자용 Supabase 설치 절차
- `tests/`: 핵심 규칙·멀티·DOM 계약 자동 테스트
- `vercel.json`: 정적 배포 URL 설정

## 적용 규칙

- 7장씩 배분하는 표준 52장 + 조커 2장 덱
- 같은 무늬 또는 같은 숫자를 낼 수 있음
- 2는 +2, A는 +3, 조커는 +5이며 세 종류로 누적 방어 가능
- 조커는 언제든 낼 수 있고 직전 유효 무늬를 유지
- J는 턴 건너뛰기
- Q는 방향 전환이며 2인 대전에서는 한 번 더
- K는 한 번 더
- 공격을 막지 못하면 누적 장수를 받고 턴 종료
- 일반 드로우도 한 장을 받고 턴 종료
- 덱이 떨어지면 맨 위 카드를 제외한 버린 카드 재혼합
- 7 선언 뒤에는 선언 무늬 또는 다른 7을 낼 수 있고, 새 7은 무늬를 다시 변경

## 멀티플레이 배포 전 필수 작업

1. `docs/2026-06-30-supabase-setup.md`대로 새 Supabase 프로젝트를 만듭니다.
2. Anonymous sign-ins를 켭니다.
3. `supabase/2026-06-30-onecard-schema.sql` 전체를 SQL Editor에서 실행합니다.
4. `src/2026-06-30-supabase-config.js`에 Project URL과 Publishable key만 입력합니다.
5. 일반 창 + 시크릿 창으로 방 생성, 참가, 준비, 양쪽 주사위, 카드 내기·뽑기·나가기를 확인합니다.
6. 그 다음 Git 커밋과 Vercel 배포를 진행합니다.

`src/2026-06-30-supabase-config.js`는 현재 빈 값입니다. Secret key, service_role key, DB password는 어떤 경우에도 커밋하지 않습니다.
