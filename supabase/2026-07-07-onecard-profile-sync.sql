-- ONE! 프로필/미션 Supabase 동기화 테이블
-- 기존 멀티플레이 방/전적 테이블은 건드리지 않고, 로그인한 사용자 본인 기록만 저장합니다.

create table if not exists public.onecard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  mission_state jsonb not null default '{}'::jsonb,
  client_saved_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.onecard_profiles add column if not exists profile jsonb not null default '{}'::jsonb;
alter table public.onecard_profiles add column if not exists mission_state jsonb not null default '{}'::jsonb;
alter table public.onecard_profiles add column if not exists client_saved_at timestamptz;
alter table public.onecard_profiles add column if not exists updated_at timestamptz not null default now();

alter table public.onecard_profiles enable row level security;

drop policy if exists "onecard profile owners can read" on public.onecard_profiles;
create policy "onecard profile owners can read"
on public.onecard_profiles for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "onecard profile owners can insert" on public.onecard_profiles;
create policy "onecard profile owners can insert"
on public.onecard_profiles for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "onecard profile owners can update" on public.onecard_profiles;
create policy "onecard profile owners can update"
on public.onecard_profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on public.onecard_profiles from anon, authenticated;
grant select, insert, update on public.onecard_profiles to authenticated;
