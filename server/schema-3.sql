-- 책사 스키마 추가분 (3) — 여러 사람의 사주를 함께 보관
-- Supabase > SQL Editor 에 붙여넣고 실행하세요. 두 번 실행해도 안전합니다.

create table if not exists public.people (
  id          text primary key,                     -- 클라이언트가 만든 id
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  relation    text,
  is_self     boolean not null default false,
  birth       jsonb not null default '{}'::jsonb,
  ai_profile  text,
  created_at  date not null default current_date,
  updated_at  timestamptz not null default now()
);
create index if not exists people_user_idx on public.people(user_id, updated_at desc);

alter table public.people enable row level security;
drop policy if exists "people are private" on public.people;
create policy "people are private" on public.people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists people_touch on public.people;
create trigger people_touch before update on public.people
  for each row execute function public.touch_updated_at();

-- 상담을 어떤 사람에 대한 것인지 연결
alter table public.consults add column if not exists person_id text;

-- 삭제 함수에 people 도 포함
create or replace function public.delete_me()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  delete from public.consults where user_id = uid;
  delete from public.people   where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;
