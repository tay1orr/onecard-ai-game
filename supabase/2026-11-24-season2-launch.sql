-- ONE! 시즌 2 — 운영에 올릴 때 한 번 넣는 SQL(11-24)
-- 넣는 법: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체를 붙여 넣고 Run
--   여러 번 넣어도 괜찮다(있으면 고쳐 쓰기만 한다). 기록 표(onecard_profiles)와 방 · 패 기록은 건드리지 않는다
-- 들어 있는 것
--   1) 휴면 막기 — 꼭 넣기. 하루 한 번 Vercel 예약 실행이 이 함수를 불러 데이터베이스에 한 줄을 쓴다
--   2) 시즌 2 카드 뒷면을 온라인 상대에게도 그대로 보이게 — 이름이 back- 로 시작하면 받는다(뒷면이 늘어도 다시 넣지 않아도 됨)
--   3) (선택) 기한이 지난 방 · 패 · 기록을 매시간 지우는 예약 — pg_cron 을 켠 뒤 맨 아래 줄의 주석을 풀어 따로 실행

-- 1) 휴면 막기
--    Supabase 무료 프로젝트는 일주일 동안 데이터베이스 활동이 적으면 멈춘다(휴면).
--    Vercel 예약 실행(vercel.json 의 crons → /api/keepalive)이 하루 한 번 이 함수를 불러 아래 표의 한 줄을 고쳐 쓴다.
--    공개 키로 부르는 함수라 아무나 부를 수 있지만, 하는 일은 이 한 줄의 시각 · 횟수를 고치는 것뿐이다(1분에 한 번만 씀)
create table if not exists public.onecard_heartbeat (
  id smallint primary key default 1 check (id = 1),
  beat_at timestamptz not null default now(),
  beats bigint not null default 0
);
alter table public.onecard_heartbeat enable row level security;
revoke all on public.onecard_heartbeat from anon, authenticated;

create or replace function public.onecard_keepalive()
returns timestamptz
language plpgsql security definer
set search_path = ''
as $$
declare
  v_at timestamptz;
begin
  insert into public.onecard_heartbeat as h (id, beat_at, beats) values (1, now(), 1)
  on conflict (id) do update set beat_at = now(), beats = h.beats + 1
  where h.beat_at < now() - interval '1 minute'
  returning h.beat_at into v_at;
  if v_at is null then
    select h.beat_at into v_at from public.onecard_heartbeat as h where h.id = 1;
  end if;
  return v_at;
end;
$$;

revoke execute on function public.onecard_keepalive() from public;
grant execute on function public.onecard_keepalive() to anon, authenticated;

-- 2) 카드 뒷면 — 이름이 back- 로 시작하면 받는다(11-24 저녁: 뒷면이 늘 때마다 목록을 고쳐 넣지 않게). 모르는 이름은 화면이 클래식으로 그린다
create or replace function public.onecard_set_card_back(p_room_id uuid, p_card_back text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
  v_seat smallint;
  v_card_back text := coalesce(p_card_back, 'back-classic');
begin
  if v_card_back !~ '^back-[a-z0-9-]{1,48}$' then
    v_card_back := 'back-classic';
  end if;
  select * into v_room from public.onecard_rooms where id = p_room_id for update;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then raise exception 'ROOM_NOT_FOUND'; end if;
  v_seat := case when v_room.host_id = v_uid then 0 else 1 end;
  update public.onecard_rooms
  set host_card_back = case when v_seat = 0 then v_card_back else host_card_back end,
      guest_card_back = case when v_seat = 1 then v_card_back else guest_card_back end,
      updated_at = now(), version = version + 1
  where id = p_room_id;
  return public.onecard_get_view(p_room_id);
end;
$$;

revoke execute on function public.onecard_set_card_back(uuid, text) from public, anon;
grant execute on function public.onecard_set_card_back(uuid, text) to authenticated;

-- 3) (선택) 매시간 만료 방 정리 — pg_cron 이 켜진 프로젝트에서만(Database → Extensions 에서 pg_cron 켜기)
-- select cron.schedule('onecard-clean-expired', '17 * * * *', 'select public.onecard_cleanup_expired()');
