-- ONE! 시즌 2 — 선택 SQL (넣지 않아도 시즌 2는 그대로 돌아간다)
-- 넣으면 좋아지는 것
--   1) 시즌 2 새 카드 뒷면(장미 도감 · 명화 · 블랙 오닉스 …, 모두 53종)이 온라인 상대에게도 그대로 보인다
--      (지금은 서버 허용 목록에 없어서 상대 화면에는 클래식으로 보인다)
--   2) 기한이 지난 방 · 패 · 기록을 매시간 지운다(지금은 지우는 함수만 있고 예약이 없다)
-- 넣는 법: Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여 실행

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
  if v_card_back not in (
    'back-classic', 'back-strawberry-milk', 'back-antique-atlas', 'back-star-candy', 'back-bauhaus',
    'back-jade-rune', 'back-rose-arbor', 'back-brass-orbit', 'back-monochrome-wave', 'back-space-whale',
    'back-antique-library', 'back-dream-kingdom', 'back-pink-cloud-pop', 'back-moon-rabbit-observatory', 'back-strawberry-toy-parade',
    'back-rose-ballroom', 'back-real-rose-garden', 'back-neon-deepsea-city', 'back-ancient-sun-temple', 'back-s2-mucha',
    'back-s2-hubble', 'back-obsidian', 'back-vangogh-almond', 'back-japanese-cherry', 'back-vangogh-irises',
    'back-monet-waterlilies', 'back-japanese-peony', 'back-bosschaert-flowers', 'back-ruysch-flowers', 'back-huysum-flowers',
    'back-redoute-01', 'back-redoute-02', 'back-redoute-03', 'back-redoute-04', 'back-redoute-05',
    'back-redoute-06', 'back-redoute-07', 'back-redoute-08', 'back-redoute-09', 'back-redoute-10',
    'back-redoute-11', 'back-redoute-12', 'back-fantin-roses', 'back-vangogh-roses', 'back-mucha-rose',
    'back-rose-window', 'back-klimt-roses', 'back-morris-rose', 'back-renoir-roses', 'back-black-rose',
    'back-rose-damask', 'back-golden-rose', 'back-morris-strawberry'
  ) then
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

-- 2) 매시간 만료 방 정리 — pg_cron 이 켜진 프로젝트에서만(Database → Extensions 에서 pg_cron 켜기)
-- select cron.schedule('onecard-clean-expired', '17 * * * *', 'select public.onecard_cleanup_expired()');
