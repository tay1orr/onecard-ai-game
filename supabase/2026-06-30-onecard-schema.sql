-- ONE! 온라인 대전용 Supabase 스키마
-- Supabase SQL Editor에서 이 파일 전체를 한 번 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.onecard_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  status text not null default 'waiting' check (status in ('waiting', 'dice', 'playing', 'finished')),
  host_id uuid not null,
  guest_id uuid,
  host_nickname text not null check (char_length(host_nickname) between 2 and 12),
  guest_nickname text,
  host_ready boolean not null default false,
  guest_ready boolean not null default false,
  host_die smallint check (host_die between 1 and 6),
  guest_die smallint check (guest_die between 1 and 6),
  dice_tie boolean not null default false,
  host_last_seen timestamptz not null default now(),
  guest_last_seen timestamptz,
  current_seat smallint check (current_seat in (0, 1)),
  active_suit text check (active_suit in ('hearts', 'diamonds', 'spades', 'clubs')),
  attack_count integer not null default 0 check (attack_count >= 0),
  top_card jsonb,
  host_count integer not null default 0 check (host_count >= 0),
  guest_count integer not null default 0 check (guest_count >= 0),
  winner_seat smallint check (winner_seat in (0, 1)),
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

create table if not exists public.onecard_private_state (
  room_id uuid primary key references public.onecard_rooms(id) on delete cascade,
  draw_pile jsonb not null default '[]'::jsonb,
  discard_pile jsonb not null default '[]'::jsonb,
  host_hand jsonb not null default '[]'::jsonb,
  guest_hand jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.onecard_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.onecard_rooms(id) on delete cascade,
  actor_seat smallint check (actor_seat in (0, 1)),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  action_id uuid unique,
  created_at timestamptz not null default now()
);

create index if not exists onecard_rooms_expires_idx on public.onecard_rooms(expires_at);
create index if not exists onecard_events_room_idx on public.onecard_events(room_id, id desc);

alter table public.onecard_rooms enable row level security;
alter table public.onecard_private_state enable row level security;
alter table public.onecard_events enable row level security;

drop policy if exists "players can read their room" on public.onecard_rooms;
create policy "players can read their room"
on public.onecard_rooms for select to authenticated
using (auth.uid() = host_id or auth.uid() = guest_id);

-- private_state에는 클라이언트 정책을 만들지 않습니다. 패/덱은 RPC만 읽을 수 있습니다.
drop policy if exists "players can read room events" on public.onecard_events;
create policy "players can read room events"
on public.onecard_events for select to authenticated
using (
  exists (
    select 1 from public.onecard_rooms r
    where r.id = room_id and (r.host_id = auth.uid() or r.guest_id = auth.uid())
  )
);

revoke all on public.onecard_rooms from anon, authenticated;
revoke all on public.onecard_private_state from anon, authenticated;
revoke all on public.onecard_events from anon, authenticated;
grant select on public.onecard_rooms to authenticated;
grant select on public.onecard_events to authenticated;

create or replace function public.onecard_clean_nickname(p_value text)
returns text
language sql immutable
set search_path = ''
as $$
  select left(regexp_replace(trim(coalesce(p_value, '')), '\s+', ' ', 'g'), 12)
$$;

create or replace function public.onecard_random_code()
returns text
language plpgsql volatile
set search_path = ''
as $$
declare
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_index integer;
begin
  for v_index in 1..6 loop
    v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::integer, 1);
  end loop;
  return v_code;
end;
$$;

create or replace function public.onecard_shuffle_jsonb(p_cards jsonb)
returns jsonb
language sql volatile
set search_path = ''
as $$
  select coalesce(jsonb_agg(card order by random()), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_cards, '[]'::jsonb)) as cards(card)
$$;

create or replace function public.onecard_new_deck()
returns jsonb
language sql volatile
set search_path = ''
as $$
  with suits(suit_name) as (
    values ('hearts'), ('diamonds'), ('spades'), ('clubs')
  ), ranks(rank_name) as (
    values ('A'), ('2'), ('3'), ('4'), ('5'), ('6'), ('7'), ('8'), ('9'), ('10'), ('J'), ('Q'), ('K')
  ), cards as (
    select jsonb_build_object(
      'id', suit_name || '-' || rank_name,
      'suit', suit_name,
      'rank', rank_name
    ) as card
    from suits cross join ranks
    union all
    select jsonb_build_object('id', 'joker-' || joker_no, 'suit', 'joker', 'rank', 'JOKER')
    from generate_series(1, 2) as jokers(joker_no)
  )
  select coalesce(jsonb_agg(card order by random()), '[]'::jsonb) from cards
$$;

create or replace function public.onecard_get_view(p_room_id uuid)
returns jsonb
language plpgsql security definer stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
  v_state public.onecard_private_state%rowtype;
  v_seat smallint;
  v_hand jsonb;
  v_event jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_room from public.onecard_rooms where id = p_room_id;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  v_seat := case when v_room.host_id = v_uid then 0 else 1 end;
  select * into v_state from public.onecard_private_state where room_id = p_room_id;
  v_hand := case when v_seat = 0 then v_state.host_hand else v_state.guest_hand end;

  select jsonb_build_object(
    'id', e.id,
    'eventType', e.event_type,
    'actorSeat', e.actor_seat,
    'payload', e.payload,
    'createdAt', e.created_at
  ) into v_event
  from public.onecard_events e
  where e.room_id = p_room_id
  order by e.id desc limit 1;

  return jsonb_build_object(
    'roomId', v_room.id,
    'code', v_room.code,
    'status', v_room.status,
    'mySeat', v_seat,
    'version', v_room.version,
    'currentSeat', v_room.current_seat,
    'activeSuit', v_room.active_suit,
    'attackCount', v_room.attack_count,
    'topCard', v_room.top_card,
    'drawCount', coalesce(jsonb_array_length(v_state.draw_pile), 0),
    'winnerSeat', v_room.winner_seat,
    'diceTie', v_room.dice_tie,
    'host', jsonb_build_object(
      'nickname', v_room.host_nickname,
      'ready', v_room.host_ready,
      'die', v_room.host_die,
      'count', v_room.host_count,
      'connected', v_room.host_last_seen > now() - interval '35 seconds'
    ),
    'guest', case when v_room.guest_id is null then null else jsonb_build_object(
      'nickname', v_room.guest_nickname,
      'ready', v_room.guest_ready,
      'die', v_room.guest_die,
      'count', v_room.guest_count,
      'connected', v_room.guest_last_seen > now() - interval '35 seconds'
    ) end,
    'myHand', coalesce(v_hand, '[]'::jsonb),
    'lastEvent', v_event
  );
end;
$$;

create or replace function public.onecard_create_room(p_nickname text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nickname text := public.onecard_clean_nickname(p_nickname);
  v_room_id uuid;
  v_code text;
  v_attempt integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(v_nickname) < 2 then raise exception 'INVALID_NICKNAME'; end if;

  for v_attempt in 1..20 loop
    v_code := public.onecard_random_code();
    begin
      insert into public.onecard_rooms(code, host_id, host_nickname)
      values (v_code, v_uid, v_nickname)
      returning id into v_room_id;
      exit;
    exception when unique_violation then
      v_room_id := null;
    end;
  end loop;
  if v_room_id is null then raise exception 'ROOM_CODE_GENERATION_FAILED'; end if;

  insert into public.onecard_private_state(room_id) values (v_room_id);
  insert into public.onecard_events(room_id, actor_seat, event_type, payload)
  values (v_room_id, 0, 'room_created', jsonb_build_object('nickname', v_nickname));
  return public.onecard_get_view(v_room_id);
end;
$$;

create or replace function public.onecard_join_room(p_code text, p_nickname text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nickname text := public.onecard_clean_nickname(p_nickname);
  v_room public.onecard_rooms%rowtype;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(v_nickname) < 2 then raise exception 'INVALID_NICKNAME'; end if;

  select * into v_room from public.onecard_rooms
  where code = upper(trim(p_code)) and expires_at > now()
  for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.host_id = v_uid then return public.onecard_get_view(v_room.id); end if;
  if v_room.guest_id = v_uid then return public.onecard_get_view(v_room.id); end if;
  if v_room.guest_id is not null or v_room.status <> 'waiting' then raise exception 'ROOM_FULL'; end if;

  update public.onecard_rooms
  set guest_id = v_uid,
      guest_nickname = v_nickname,
      guest_last_seen = now(),
      updated_at = now(),
      version = version + 1
  where id = v_room.id;
  insert into public.onecard_events(room_id, actor_seat, event_type, payload)
  values (v_room.id, 1, 'joined', jsonb_build_object('nickname', v_nickname));
  return public.onecard_get_view(v_room.id);
end;
$$;

create or replace function public.onecard_set_ready(p_room_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
  v_seat smallint;
  v_ready boolean;
begin
  select * into v_room from public.onecard_rooms where id = p_room_id for update;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.guest_id is null then raise exception 'WAITING_FOR_GUEST'; end if;
  if v_room.status <> 'waiting' then raise exception 'ROOM_ALREADY_STARTED'; end if;
  v_seat := case when v_room.host_id = v_uid then 0 else 1 end;
  v_ready := not (case when v_seat = 0 then v_room.host_ready else v_room.guest_ready end);

  update public.onecard_rooms
  set host_ready = case when v_seat = 0 then v_ready else host_ready end,
      guest_ready = case when v_seat = 1 then v_ready else guest_ready end,
      updated_at = now(), version = version + 1
  where id = p_room_id;

  update public.onecard_rooms
  set status = 'dice', updated_at = now(), version = version + 1
  where id = p_room_id and host_ready and guest_ready and status = 'waiting';

  insert into public.onecard_events(room_id, actor_seat, event_type, payload)
  values (p_room_id, v_seat, 'ready_changed', jsonb_build_object('ready', v_ready));
  return public.onecard_get_view(p_room_id);
end;
$$;

create or replace function public.onecard_start_game(p_room_id uuid, p_first_seat smallint)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_deck jsonb := public.onecard_new_deck();
  v_host_hand jsonb;
  v_guest_hand jsonb;
  v_draw_pile jsonb;
  v_top_card jsonb;
  v_top_position bigint;
begin
  select coalesce(jsonb_agg(card order by position), '[]'::jsonb)
  into v_host_hand
  from jsonb_array_elements(v_deck) with ordinality as d(card, position)
  where position between 1 and 7;

  select coalesce(jsonb_agg(card order by position), '[]'::jsonb)
  into v_guest_hand
  from jsonb_array_elements(v_deck) with ordinality as d(card, position)
  where position between 8 and 14;

  select card, position into v_top_card, v_top_position
  from jsonb_array_elements(v_deck) with ordinality as d(card, position)
  where position > 14 and card->>'rank' not in ('A', '2', '7', 'J', 'Q', 'K', 'JOKER')
  order by position limit 1;
  if v_top_card is null then
    select card, position into v_top_card, v_top_position
    from jsonb_array_elements(v_deck) with ordinality as d(card, position)
    where position > 14 order by position limit 1;
  end if;

  select coalesce(jsonb_agg(card order by position), '[]'::jsonb)
  into v_draw_pile
  from jsonb_array_elements(v_deck) with ordinality as d(card, position)
  where position > 14 and position <> v_top_position;

  update public.onecard_private_state
  set draw_pile = v_draw_pile,
      discard_pile = jsonb_build_array(v_top_card),
      host_hand = v_host_hand,
      guest_hand = v_guest_hand,
      updated_at = now()
  where room_id = p_room_id;

  update public.onecard_rooms
  set status = 'playing', current_seat = p_first_seat,
      active_suit = v_top_card->>'suit', attack_count = 0,
      top_card = v_top_card, host_count = 7, guest_count = 7,
      winner_seat = null, dice_tie = false,
      host_ready = false, guest_ready = false,
      updated_at = now(), version = version + 1
  where id = p_room_id;
end;
$$;

create or replace function public.onecard_roll_dice(p_room_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
  v_seat smallint;
  v_die smallint := 1 + floor(random() * 6)::smallint;
  v_first smallint;
begin
  select * into v_room from public.onecard_rooms where id = p_room_id for update;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.status <> 'dice' then raise exception 'NOT_DICE_PHASE'; end if;
  v_seat := case when v_room.host_id = v_uid then 0 else 1 end;

  if v_room.dice_tie and v_room.host_die is not null and v_room.guest_die is not null then
    update public.onecard_rooms set host_die = null, guest_die = null, dice_tie = false where id = p_room_id;
    v_room.host_die := null; v_room.guest_die := null; v_room.dice_tie := false;
  end if;
  if (v_seat = 0 and v_room.host_die is not null) or (v_seat = 1 and v_room.guest_die is not null) then
    raise exception 'DIE_ALREADY_ROLLED';
  end if;

  update public.onecard_rooms
  set host_die = case when v_seat = 0 then v_die else host_die end,
      guest_die = case when v_seat = 1 then v_die else guest_die end,
      updated_at = now(), version = version + 1
  where id = p_room_id
  returning * into v_room;
  insert into public.onecard_events(room_id, actor_seat, event_type, payload)
  values (p_room_id, v_seat, 'dice_roll', jsonb_build_object('value', v_die));

  if v_room.host_die is not null and v_room.guest_die is not null then
    if v_room.host_die = v_room.guest_die then
      update public.onecard_rooms
      set dice_tie = true, updated_at = now(), version = version + 1
      where id = p_room_id;
      insert into public.onecard_events(room_id, event_type, payload)
      values (p_room_id, 'dice_tie', jsonb_build_object('host', v_room.host_die, 'guest', v_room.guest_die));
    else
      v_first := case when v_room.host_die > v_room.guest_die then 0 else 1 end;
      perform public.onecard_start_game(p_room_id, v_first);
      insert into public.onecard_events(room_id, event_type, payload)
      values (p_room_id, 'game_started', jsonb_build_object(
        'hostDie', v_room.host_die, 'guestDie', v_room.guest_die, 'firstSeat', v_first
      ));
    end if;
  end if;
  return public.onecard_get_view(p_room_id);
end;
$$;

create or replace function public.onecard_play_card(
  p_room_id uuid,
  p_card_id text,
  p_chosen_suit text default null,
  p_action_id uuid default gen_random_uuid(),
  p_expected_version bigint default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
  v_state public.onecard_private_state%rowtype;
  v_seat smallint;
  v_hand jsonb;
  v_new_hand jsonb;
  v_card jsonb;
  v_rank text;
  v_suit text;
  v_next_seat smallint;
  v_attack integer;
  v_active_suit text;
begin
  if exists (select 1 from public.onecard_events where action_id = p_action_id) then
    return public.onecard_get_view(p_room_id);
  end if;
  select * into v_room from public.onecard_rooms where id = p_room_id for update;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then raise exception 'ROOM_NOT_FOUND'; end if;
  v_seat := case when v_room.host_id = v_uid then 0 else 1 end;
  if v_room.status <> 'playing' then raise exception 'GAME_NOT_PLAYING'; end if;
  if v_room.current_seat <> v_seat then raise exception 'NOT_YOUR_TURN'; end if;
  if p_expected_version is not null and v_room.version <> p_expected_version then raise exception 'STALE_VERSION'; end if;

  select * into v_state from public.onecard_private_state where room_id = p_room_id for update;
  v_hand := case when v_seat = 0 then v_state.host_hand else v_state.guest_hand end;
  select card into v_card from jsonb_array_elements(v_hand) as cards(card) where card->>'id' = p_card_id limit 1;
  if v_card is null then raise exception 'CARD_NOT_IN_HAND'; end if;
  v_rank := v_card->>'rank'; v_suit := v_card->>'suit';

  if v_room.attack_count > 0 then
    if v_rank not in ('2', 'A', 'JOKER') then raise exception 'MUST_DEFEND_ATTACK'; end if;
  elsif not (v_rank = 'JOKER' or v_suit = v_room.active_suit or v_rank = v_room.top_card->>'rank') then
    raise exception 'CARD_NOT_PLAYABLE';
  end if;
  if v_rank = '7' and (p_chosen_suit is null or p_chosen_suit not in ('hearts', 'diamonds', 'spades', 'clubs')) then
    raise exception 'SUIT_REQUIRED';
  end if;

  select coalesce(jsonb_agg(card order by position), '[]'::jsonb)
  into v_new_hand
  from jsonb_array_elements(v_hand) with ordinality as cards(card, position)
  where card->>'id' <> p_card_id;

  v_attack := v_room.attack_count + case v_rank when '2' then 2 when 'A' then 3 when 'JOKER' then 5 else 0 end;
  v_active_suit := case when v_rank = '7' then p_chosen_suit when v_rank = 'JOKER' then v_room.active_suit else v_suit end;
  v_next_seat := case when v_rank in ('J', 'Q', 'K') then v_seat else 1 - v_seat end;

  update public.onecard_private_state
  set host_hand = case when v_seat = 0 then v_new_hand else host_hand end,
      guest_hand = case when v_seat = 1 then v_new_hand else guest_hand end,
      discard_pile = discard_pile || jsonb_build_array(v_card),
      updated_at = now()
  where room_id = p_room_id;

  update public.onecard_rooms
  set top_card = v_card,
      active_suit = v_active_suit,
      attack_count = v_attack,
      current_seat = v_next_seat,
      host_count = case when v_seat = 0 then jsonb_array_length(v_new_hand) else host_count end,
      guest_count = case when v_seat = 1 then jsonb_array_length(v_new_hand) else guest_count end,
      status = case when jsonb_array_length(v_new_hand) = 0 then 'finished' else status end,
      winner_seat = case when jsonb_array_length(v_new_hand) = 0 then v_seat else winner_seat end,
      host_ready = case when jsonb_array_length(v_new_hand) = 0 then false else host_ready end,
      guest_ready = case when jsonb_array_length(v_new_hand) = 0 then false else guest_ready end,
      updated_at = now(), version = version + 1
  where id = p_room_id;

  insert into public.onecard_events(room_id, actor_seat, event_type, payload, action_id)
  values (p_room_id, v_seat, 'play', jsonb_build_object(
    'card', v_card,
    'chosenSuit', case when v_rank = '7' then p_chosen_suit else null end,
    'extraTurn', v_rank in ('J', 'Q', 'K'),
    'remaining', jsonb_array_length(v_new_hand),
    'attackCount', v_attack
  ), p_action_id);
  return public.onecard_get_view(p_room_id);
end;
$$;

create or replace function public.onecard_request_rematch(p_room_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
  v_seat smallint;
  v_ready boolean;
begin
  select * into v_room from public.onecard_rooms where id = p_room_id for update;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.status <> 'finished' then raise exception 'GAME_NOT_FINISHED'; end if;
  if v_room.guest_id is null then raise exception 'WAITING_FOR_GUEST'; end if;
  v_seat := case when v_room.host_id = v_uid then 0 else 1 end;
  v_ready := not (case when v_seat = 0 then v_room.host_ready else v_room.guest_ready end);

  update public.onecard_rooms
  set host_ready = case when v_seat = 0 then v_ready else host_ready end,
      guest_ready = case when v_seat = 1 then v_ready else guest_ready end,
      updated_at = now(), version = version + 1
  where id = p_room_id;

  insert into public.onecard_events(room_id, actor_seat, event_type, payload)
  values (p_room_id, v_seat, 'rematch_ready', jsonb_build_object('ready', v_ready));

  update public.onecard_rooms
  set status = 'dice', host_die = null, guest_die = null, dice_tie = false,
      current_seat = null, active_suit = null, attack_count = 0, top_card = null,
      host_count = 0, guest_count = 0, winner_seat = null,
      updated_at = now(), version = version + 1
  where id = p_room_id and host_ready and guest_ready and status = 'finished';

  if found then
    insert into public.onecard_events(room_id, event_type) values (p_room_id, 'rematch_started');
  end if;
  return public.onecard_get_view(p_room_id);
end;
$$;

create or replace function public.onecard_draw_cards(
  p_room_id uuid,
  p_action_id uuid default gen_random_uuid(),
  p_expected_version bigint default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
  v_state public.onecard_private_state%rowtype;
  v_seat smallint;
  v_count integer;
  v_drawn jsonb;
  v_remaining jsonb;
  v_recyclable jsonb;
  v_top jsonb;
  v_new_hand jsonb;
begin
  if exists (select 1 from public.onecard_events where action_id = p_action_id) then
    return public.onecard_get_view(p_room_id);
  end if;
  select * into v_room from public.onecard_rooms where id = p_room_id for update;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then raise exception 'ROOM_NOT_FOUND'; end if;
  v_seat := case when v_room.host_id = v_uid then 0 else 1 end;
  if v_room.status <> 'playing' then raise exception 'GAME_NOT_PLAYING'; end if;
  if v_room.current_seat <> v_seat then raise exception 'NOT_YOUR_TURN'; end if;
  if p_expected_version is not null and v_room.version <> p_expected_version then raise exception 'STALE_VERSION'; end if;
  select * into v_state from public.onecard_private_state where room_id = p_room_id for update;
  v_count := case when v_room.attack_count > 0 then v_room.attack_count else 1 end;

  if jsonb_array_length(v_state.draw_pile) < v_count and jsonb_array_length(v_state.discard_pile) > 1 then
    v_top := v_state.discard_pile -> (jsonb_array_length(v_state.discard_pile) - 1);
    select coalesce(jsonb_agg(card order by position), '[]'::jsonb)
    into v_recyclable
    from jsonb_array_elements(v_state.discard_pile) with ordinality as cards(card, position)
    where position < jsonb_array_length(v_state.discard_pile);
    v_state.draw_pile := v_state.draw_pile || public.onecard_shuffle_jsonb(v_recyclable);
    v_state.discard_pile := jsonb_build_array(v_top);
  end if;

  select coalesce(jsonb_agg(card order by position), '[]'::jsonb)
  into v_drawn
  from jsonb_array_elements(v_state.draw_pile) with ordinality as cards(card, position)
  where position <= v_count;
  select coalesce(jsonb_agg(card order by position), '[]'::jsonb)
  into v_remaining
  from jsonb_array_elements(v_state.draw_pile) with ordinality as cards(card, position)
  where position > v_count;

  v_new_hand := (case when v_seat = 0 then v_state.host_hand else v_state.guest_hand end) || v_drawn;
  update public.onecard_private_state
  set draw_pile = v_remaining,
      discard_pile = v_state.discard_pile,
      host_hand = case when v_seat = 0 then v_new_hand else host_hand end,
      guest_hand = case when v_seat = 1 then v_new_hand else guest_hand end,
      updated_at = now()
  where room_id = p_room_id;

  update public.onecard_rooms
  set current_seat = 1 - v_seat,
      attack_count = 0,
      host_count = case when v_seat = 0 then jsonb_array_length(v_new_hand) else host_count end,
      guest_count = case when v_seat = 1 then jsonb_array_length(v_new_hand) else guest_count end,
      updated_at = now(), version = version + 1
  where id = p_room_id;
  insert into public.onecard_events(room_id, actor_seat, event_type, payload, action_id)
  values (p_room_id, v_seat, 'draw', jsonb_build_object(
    'count', jsonb_array_length(v_drawn), 'penalty', v_room.attack_count > 0
  ), p_action_id);
  return public.onecard_get_view(p_room_id) || jsonb_build_object('drawnCards', v_drawn);
end;
$$;

create or replace function public.onecard_ping(p_room_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
begin
  select * into v_room from public.onecard_rooms where id = p_room_id;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then raise exception 'ROOM_NOT_FOUND'; end if;
  update public.onecard_rooms
  set host_last_seen = case when host_id = v_uid then now() else host_last_seen end,
      guest_last_seen = case when guest_id = v_uid then now() else guest_last_seen end,
      expires_at = greatest(expires_at, now() + interval '2 hours')
  where id = p_room_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.onecard_leave_room(p_room_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.onecard_rooms%rowtype;
  v_seat smallint;
begin
  select * into v_room from public.onecard_rooms where id = p_room_id for update;
  if not found or (v_room.host_id <> v_uid and v_room.guest_id is distinct from v_uid) then return jsonb_build_object('left', true); end if;
  v_seat := case when v_room.host_id = v_uid then 0 else 1 end;
  if v_room.status in ('playing', 'dice') and v_room.guest_id is not null then
    update public.onecard_rooms
    set status = 'finished', winner_seat = 1 - v_seat,
        host_ready = false, guest_ready = false, updated_at = now(), version = version + 1
    where id = p_room_id;
    insert into public.onecard_events(room_id, actor_seat, event_type)
    values (p_room_id, v_seat, 'left');
  elsif v_seat = 1 then
    update public.onecard_rooms
    set guest_id = null, guest_nickname = null, guest_ready = false, guest_die = null,
        host_ready = false, host_die = null, status = 'waiting', dice_tie = false,
        updated_at = now(), version = version + 1
    where id = p_room_id;
  else
    delete from public.onecard_rooms where id = p_room_id;
  end if;
  return jsonb_build_object('left', true);
end;
$$;

create or replace function public.onecard_cleanup_expired()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare v_deleted integer;
begin
  delete from public.onecard_rooms where expires_at < now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- 내부 도우미는 외부 실행을 막고, 앱에서 쓰는 RPC만 authenticated 역할에 엽니다.
revoke execute on function public.onecard_clean_nickname(text) from public, anon, authenticated;
revoke execute on function public.onecard_random_code() from public, anon, authenticated;
revoke execute on function public.onecard_shuffle_jsonb(jsonb) from public, anon, authenticated;
revoke execute on function public.onecard_new_deck() from public, anon, authenticated;
revoke execute on function public.onecard_start_game(uuid, smallint) from public, anon, authenticated;
revoke execute on function public.onecard_cleanup_expired() from public, anon, authenticated;

revoke execute on function public.onecard_get_view(uuid) from public, anon;
revoke execute on function public.onecard_create_room(text) from public, anon;
revoke execute on function public.onecard_join_room(text, text) from public, anon;
revoke execute on function public.onecard_set_ready(uuid) from public, anon;
revoke execute on function public.onecard_roll_dice(uuid) from public, anon;
revoke execute on function public.onecard_play_card(uuid, text, text, uuid, bigint) from public, anon;
revoke execute on function public.onecard_draw_cards(uuid, uuid, bigint) from public, anon;
revoke execute on function public.onecard_ping(uuid) from public, anon;
revoke execute on function public.onecard_leave_room(uuid) from public, anon;
revoke execute on function public.onecard_request_rematch(uuid) from public, anon;

grant execute on function public.onecard_get_view(uuid) to authenticated;
grant execute on function public.onecard_create_room(text) to authenticated;
grant execute on function public.onecard_join_room(text, text) to authenticated;
grant execute on function public.onecard_set_ready(uuid) to authenticated;
grant execute on function public.onecard_roll_dice(uuid) to authenticated;
grant execute on function public.onecard_play_card(uuid, text, text, uuid, bigint) to authenticated;
grant execute on function public.onecard_draw_cards(uuid, uuid, bigint) to authenticated;
grant execute on function public.onecard_ping(uuid) to authenticated;
grant execute on function public.onecard_leave_room(uuid) to authenticated;
grant execute on function public.onecard_request_rematch(uuid) to authenticated;

-- Realtime에서 방 상태와 공개 이벤트를 전달합니다. 이미 추가돼 있으면 오류 없이 넘어갑니다.
do $$
begin
  alter publication supabase_realtime add table public.onecard_rooms;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.onecard_events;
exception when duplicate_object then null;
end $$;

-- 선택 사항: pg_cron을 활성화한 프로젝트라면 아래 한 줄의 주석을 풀어 매시간 만료 방을 정리하세요.
-- select cron.schedule('onecard-clean-expired', '17 * * * *', 'select public.onecard_cleanup_expired()');
