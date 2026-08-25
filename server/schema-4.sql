-- ─────────────────────────────────────────────────────────────
-- 책사 · 유입 카운터 (schema-4)
--
-- 블로그를 올려도 그중 몇 명이 사이트에 왔는지 알 방법이 없었다.
-- 그 하나만 세기 위한 표다.
--
-- 원칙
--   · 개인을 식별할 수 있는 값은 아무것도 넣지 않는다.
--     IP, 사용자 에이전트, 로그인 계정, 화면 크기 전부 저장하지 않는다.
--   · 넣는 것은 넷뿐이다 — 언제 / 어디서 왔나 / 어느 화면 / 첫 방문인가.
--   · 익명 사용자는 넣기만 되고 읽지 못한다. 통계는 대시보드에서 본다.
--
-- Supabase → SQL Editor 에 붙여넣고 Run.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.visits (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  source     text not null default 'direct',   -- naver / google / kakao / direct / 기타 호스트
  path       text not null default '/',        -- 어느 화면으로 들어왔나
  first_time boolean not null default false    -- 이 브라우저의 첫 방문인가
);

create index if not exists visits_at_idx     on public.visits (at desc);
create index if not exists visits_source_idx on public.visits (source, at desc);

alter table public.visits enable row level security;

-- 익명도 기록은 남길 수 있다 (로그인 전 방문자를 세야 하므로)
drop policy if exists "anon can insert visits" on public.visits;
create policy "anon can insert visits"
  on public.visits for insert
  to anon, authenticated
  with check (
    source is not null and length(source) <= 40
    and path is not null and length(path) <= 120
  );

-- 다만 아무도 읽지 못한다. 통계는 Supabase 대시보드(service role)로만 본다.
-- select 정책을 만들지 않으면 RLS 가 전부 막는다.

-- ─────────────────────────────────────────────────────────────
-- 보는 법 — SQL Editor 에서 아래를 실행
-- ─────────────────────────────────────────────────────────────

-- 날짜별 · 유입원별
--   select date_trunc('day', at at time zone 'Asia/Seoul')::date as 날짜,
--          source as 유입원,
--          count(*) as 방문,
--          count(*) filter (where first_time) as 첫방문
--   from public.visits
--   group by 1, 2
--   order by 1 desc, 3 desc;

-- 최근 7일 요약
--   select source as 유입원,
--          count(*) as 방문,
--          count(*) filter (where first_time) as 첫방문
--   from public.visits
--   where at > now() - interval '7 days'
--   group by 1 order by 2 desc;

-- 90일 지난 기록은 지운다 (필요할 때 수동 실행)
--   delete from public.visits where at < now() - interval '90 days';
