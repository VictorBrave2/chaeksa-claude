-- 책사 데이터베이스 스키마 (Supabase / PostgreSQL)
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여넣고 실행하세요.
-- 두 번 실행해도 안전합니다.

-- ─────────────────────────────────────────────
-- 1) 프로필 — 사용자당 한 줄. 원국 입력값과 고정 해석.
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  birth       jsonb not null default '{}'::jsonb,  -- {year,month,day,hour,minute,gender,solarCorrection,calendar,lunarInput}
  ai_profile  text,                                 -- 비서의 고정 원국 해석
  settings    jsonb not null default '{}'::jsonb,   -- 테마 등
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2) 심층 상담 — 가설·판단·관측 지표 기록
-- ─────────────────────────────────────────────
create table if not exists public.consults (
  id           text primary key,                    -- 클라이언트가 만든 id (c<timestamp>)
  user_id      uuid not null references auth.users(id) on delete cascade,
  question     text not null,
  domain_key   text,
  domain_label text,
  target_label text,
  top_id       text,
  top_title    text,
  top_p        int,
  action       text,
  metric       text,
  first_answer jsonb not null default '{}'::jsonb,
  checkins     jsonb not null default '[]'::jsonb,
  logs         jsonb not null default '[]'::jsonb,  -- [{date, value}] 관측 지표 기록
  created_at   date not null default current_date,
  updated_at   timestamptz not null default now()
);
create index if not exists consults_user_idx on public.consults(user_id, updated_at desc);

-- ─────────────────────────────────────────────
-- 3) 행 수준 보안 — 내 데이터만 보고 고칠 수 있다
-- ─────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.consults enable row level security;

drop policy if exists "profiles are private" on public.profiles;
create policy "profiles are private" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "consults are private" on public.consults;
create policy "consults are private" on public.consults
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 4) updated_at 자동 갱신
-- ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists consults_touch on public.consults;
create trigger consults_touch before update on public.consults
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────
-- 5) 회원 가입 시 빈 프로필 자동 생성
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
