# ONE! 멀티플레이 Supabase 설정

이 설정은 이메일이나 비밀번호를 받지 않고, 브라우저마다 임시 익명 계정을 만들어 2명이 6자리 방 코드로 대전하도록 구성합니다.

## 1. 새 프로젝트 만들기

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인합니다.
2. 화면 오른쪽 위 `New project`를 누릅니다.
3. Organization은 현재 사용 중인 조직을 선택합니다.
4. Project name은 `onecard-online`을 권장합니다.
5. Database password는 비밀번호 관리자에 별도로 저장합니다. 이 비밀번호는 웹 앱 코드에 넣지 않습니다.
6. Region은 실제 플레이어와 가까운 곳을 고릅니다. 한국 중심이면 Tokyo 또는 Seoul이 보일 경우 가까운 쪽을 선택합니다.
7. `Create new project`를 누르고 준비가 끝날 때까지 기다립니다.

기존 프로젝트에 설치해도 작동하지만, 다른 앱의 테이블·정책과 섞이지 않도록 새 프로젝트를 권장합니다.

## 2. 익명 로그인 켜기

1. 왼쪽 메뉴에서 `Authentication`을 엽니다.
2. `Providers` 또는 `Sign In / Providers`에서 `Anonymous`를 찾습니다.
3. `Allow anonymous sign-ins`를 켜고 저장합니다.

익명 사용자는 개인정보를 입력하지 않지만, 내부적으로는 `authenticated` 역할을 받습니다. 그래서 이 프로젝트의 RLS 정책은 방 참가자만 자기 방을 읽도록 제한합니다. 자세한 동작은 [Supabase 익명 로그인 공식 문서](https://supabase.com/docs/guides/auth/auth-anonymous)에서 확인할 수 있습니다.

> 공개 배포 후 봇 생성이 많아지면 Supabase가 권장하는 CAPTCHA/Turnstile과 사용량 제한을 추가하세요. 첫 소규모 플레이 테스트에는 현재 구성이 가장 간단합니다.

## 3. 게임 DB와 서버 규칙 설치하기

1. 왼쪽 메뉴에서 `SQL Editor`를 엽니다.
2. `New query`를 누릅니다.
3. 프로젝트의 `supabase/2026-06-30-onecard-schema.sql` 파일 전체를 복사해 붙여 넣습니다.
4. 오른쪽 아래 `Run`을 누릅니다.
5. 성공 메시지가 나오면 설치 완료입니다.

> 카드 뒷면 꾸미기 목록이 갱신된 배포에서는 이 SQL 파일 전체를 다시 실행하세요. 기존 테이블이나 승패 기록을 삭제하지 않고 `onecard_set_card_back` 함수의 허용 목록만 최신 상태로 교체합니다.

이 SQL이 만드는 것은 다음과 같습니다.

- `onecard_rooms`: 방 코드, 접속 상태, 공개 게임 상태
- `onecard_private_state`: 양쪽 손패와 덱. 브라우저에서 직접 읽을 수 없음
- `onecard_events`: 카드 내기·뽑기·주사위·스티커 같은 공개 이벤트
- 앱 RPC: 방 생성/참가, 준비 토글, 주사위, 카드 내기/뽑기, 재대결, 상태·기록 조회, 스티커, 점수·카드 스킨 공유, 연결 유지, 나가기
- RLS: 자기 방만 읽게 제한
- Realtime publication: 방 상태와 이벤트 실시간 갱신

SQL은 카드가 실제로 손에 있는지, 지금 자기 턴인지, 낼 수 있는 카드인지, 요청한 화면 버전이 최신인지 DB 안에서 다시 검사합니다. 상대 손패는 장수만 공개됩니다.

## 4. Realtime 확인하기

SQL 마지막 부분에서 `onecard_rooms`, `onecard_events`를 Realtime publication에 자동 등록합니다. 확인하고 싶다면 Dashboard의 `Database` → `Publications`에서 `supabase_realtime`을 열어 두 테이블이 켜져 있는지 봅니다.

공식 설정 방식은 [Postgres Changes 문서](https://supabase.com/docs/guides/realtime/postgres-changes)와 같습니다.

## 5. 공개 연결값 복사하기

1. 프로젝트 상단의 `Connect`를 누르거나, `Project Settings` → `API Keys`를 엽니다.
2. `Project URL`을 복사합니다. 형태는 `https://xxxxxxxx.supabase.co`입니다.
3. `Publishable key`를 복사합니다. 보통 `sb_publishable_...`로 시작합니다.
4. `src/2026-06-30-supabase-config.js`를 열고 아래 두 값만 채웁니다.

```js
export const SUPABASE_CONFIG = Object.freeze({
  url: 'https://xxxxxxxx.supabase.co',
  publishableKey: 'sb_publishable_xxxxxxxxx',
});
```

`Publishable key`는 RLS와 함께 브라우저에서 사용하도록 만들어진 공개 키입니다. 새 키 체계는 [Supabase API key 안내](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)에 설명돼 있습니다.

### 절대 넣으면 안 되는 값

- `Secret key` (`sb_secret_...`)
- `service_role` key
- Database password
- JWT secret

이 값들은 RLS를 우회하거나 DB를 관리할 수 있으므로 Git·Vercel·브라우저 코드 어디에도 넣지 않습니다.

## 6. 로컬에서 2인 테스트하기

프로젝트 폴더에서 정적 서버를 실행합니다.

```powershell
python -m http.server 8765
```

1. 일반 Chrome 창에서 `http://localhost:8765/2026-06-30-online.html`을 엽니다.
2. 닉네임을 넣고 `새 방 만들기`를 누릅니다.
3. 시크릿 창 또는 다른 브라우저에서 같은 주소를 엽니다.
4. 다른 닉네임과 첫 창의 6자리 코드를 넣어 참가합니다.
5. 둘 다 `준비 완료`를 누릅니다.
   - 한 명만 준비한 상태에서는 같은 버튼을 다시 눌러 준비를 취소할 수 있습니다.
6. 양쪽이 각자 주사위를 누릅니다. 동점이면 양쪽 모두 다시 굴립니다.
7. 선공/후공 이펙트 뒤 양쪽 시작 패가 5장인지 확인하고, 카드 내기, 7 무늬 변경, 공격 누적, 뽑기 공개를 확인합니다.
8. 한 판이 끝나면 양쪽 모두 `재대결 신청`을 눌러 같은 방 코드로 새 덱과 주사위 단계가 시작되는지 확인합니다.
9. 대기실·게임 상단·결과 화면의 HOST/GUEST 승수가 재대결 후에도 유지되는지 확인합니다. 새 상대가 참가하는 새 대전 묶음에서는 0:0으로 초기화됩니다.
10. 게임 중 버린 카드 더미를 눌러 이번 판 이력을 보고, 양쪽에서 6종 스티커를 보내 상대 화면에도 표시되는지 확인합니다.
11. 방을 나가지 않은 채 새로고침해 진행 중인 방이 자동 복원되는지 확인합니다.
12. 상대 이름 아래 별 등급과 점수가 보이고, 종료 화면에서 마지막 카드와 점수 증감을 확인합니다.
13. AI 화면에서 해금한 카드 뒷면을 장착한 뒤 온라인 방에 다시 들어가 상대 화면에도 같은 뒷면이 보이는지 확인합니다.

기존에 이 SQL을 실행한 프로젝트도 기능 업데이트 후에는 파일 전체를 다시 실행해야 합니다. `host_rating`, `guest_rating`, `host_card_back`, `guest_card_back`, `round_no` 컬럼은 `add column if not exists`로 추가되고 함수는 `create or replace function`으로 갱신되므로 기존 방 전적·데이터를 삭제하지 않습니다. `round_no`는 같은 방의 각 경기를 고유하게 구분해 새 상대와 경기할 때도 개인 승수·판수가 빠지지 않게 합니다.

같은 브라우저의 일반 탭 두 개는 익명 세션을 공유하므로 같은 사용자로 인식됩니다. 반드시 일반 창 + 시크릿 창, 또는 서로 다른 브라우저를 사용하세요.

## 7. Vercel 배포

이 프로젝트는 빌드 없는 정적 앱이라 기존과 동일하게 Vercel에 배포하면 됩니다. Claude가 Git 커밋과 배포를 담당할 때 아래 파일이 빠지지 않았는지 확인하면 됩니다.

- `2026-06-30-online.html`
- `2026-06-30-online.css`
- `src/2026-06-30-online-main.js`
- `src/2026-06-30-multiplayer.js`
- `src/2026-06-30-multiplayer-helpers.js`
- `src/2026-06-30-reactions.js`
- `src/2026-06-30-supabase-config.js` (공개 URL/Publishable key 입력 후)

배포 뒤에는 실제 주소의 `/2026-06-30-online.html`에서 다시 일반 창 + 시크릿 창 테스트를 합니다.

## 8. 운영 동작과 제한

- 방은 2명 전용이고 코드는 6자리입니다.
- 마지막 활동을 기준으로 만료 시간이 2시간 연장됩니다.
- 15초마다 연결 신호를 보내며, 35초 이상 신호가 없으면 화면에 재접속 대기로 표시합니다.
- 브라우저 새로고침은 저장된 익명 세션과 활성 방 ID를 이용해 진행 중인 방을 자동 복원합니다. `방 나가기`를 누르면 이 복원 정보도 지워집니다.
- 스티커는 서버가 허용한 6종만 전송되며 같은 사용자는 1.2초 간격으로만 보낼 수 있습니다.
- 호스트가 대기실에서 나가면 방이 삭제됩니다.
- 게임 중 한 명이 나가면 상대 승리로 종료됩니다.

선택적으로 만료 방을 자동 삭제하려면 Supabase에서 `pg_cron`을 활성화한 뒤 SQL 파일 맨 아래의 `cron.schedule` 한 줄 주석을 해제합니다. 무료 프로젝트에서 해당 기능을 쓰지 않아도 게임에는 지장이 없습니다.

## 9. 문제 해결

### `Anonymous sign-ins are disabled`

2단계의 `Allow anonymous sign-ins`가 저장됐는지 확인합니다.

### 온라인 화면에 `Supabase 연결 설정이 필요해요`

`src/2026-06-30-supabase-config.js`의 URL과 Publishable key가 빈 문자열인지 확인합니다.

### `function onecard_create_room does not exist`

SQL Editor에서 스키마 파일 전체가 성공했는지 확인하고, 오류가 난 줄부터가 아니라 전체 SQL을 다시 실행합니다. 스키마는 재실행 가능하게 작성돼 있습니다.

### 상대 화면이 바로 바뀌지 않음

`Database` → `Publications` → `supabase_realtime`에 `onecard_rooms`와 `onecard_events`가 등록돼 있는지 확인합니다. 그래도 안 되면 개발자 도구 Network 탭에서 WebSocket 연결을 확인합니다.

### `STALE_VERSION`

양쪽 요청이 거의 동시에 들어와 먼저 처리된 상태가 있을 때 정상적으로 발생할 수 있는 안전장치입니다. 화면이 Realtime으로 갱신된 뒤 다시 누르면 됩니다.

### SQL을 완전히 제거하고 다시 설치하고 싶음

현재 파일과 데이터를 삭제하는 작업이므로 바로 실행하지 말고 먼저 백업 여부를 정하세요. 삭제용 SQL은 이 저장소에 포함하지 않았습니다.
