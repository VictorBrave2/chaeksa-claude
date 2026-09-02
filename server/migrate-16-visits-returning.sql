-- 책사 migrate-16 : 「돌아온 사람」을 센다 (2026-09-02 · docs/29 여덟)
--
-- 왜 —
--   비서 계획(docs/29)이 맞는지 가르는 숫자는 하나다 — 돌아온 사람.
--   지금 visits 는 브라우저를 가르는 값이 없어서 「돌아온 방문」(first_time=false)까지만 센다.
--   방문과 사람은 다르다. 한 사람이 하루 세 번 오면 방문 셋, 사람 하나다.
--
-- 무엇을 저장하나 —
--   vid : 브라우저가 스스로 만든 무작위 id(localStorage). IP·UA·계정과 무관하다.
--         지우면 새 사람으로 센다. 그래서 「최소한 이만큼은 돌아왔다」다.
--   저장하지 않는 것은 그대로다 — IP, 사용자 에이전트, 계정, 화면 크기.
--
-- 순서 —
--   1 이 파일을 Supabase SQL 편집기에서 실행
--   2 app/config.js 의 CHAEKSA_TRACK_VID 를 1 로 (클라이언트가 vid 를 보내기 시작한다)
--   순서를 바꾸면 PostgREST 가 모르는 열이라며 방문 기록 전체를 거절한다.
--
-- 여러 번 실행해도 안전하다.

alter table public.visits add column if not exists vid text;
create index if not exists visits_vid_at_idx on public.visits (vid, at desc) where vid is not null;

-- visits_stats 에 두 값을 더한다.
--   returning   날마다 「돌아온 방문」 (first_time=false) — vid 없이도 지금부터 보인다
--   people      vid 가 있는 14일 안에서: 온 사람 수 · 이틀 이상 온 사람 수
create or replace function public.visits_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  return json_build_object(
    'total', (select count(*) from public.visits),
    'today', (select count(*) from public.visits
              where at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'),
    'days', coalesce((
      select json_agg(json_build_object('d', d, 'n', n, 'first', f, 'returning', n - f) order by d desc)
      from (
        select to_char(at at time zone 'Asia/Seoul', 'MM-DD') as d,
               count(*) as n,
               count(*) filter (where first_time) as f
        from public.visits
        where at >= now() - interval '14 days'
        group by 1
      ) t), '[]'::json),
    'sources', coalesce((
      select json_agg(json_build_object('s', source, 'n', n) order by n desc)
      from (
        select source, count(*) as n
        from public.visits
        where at >= now() - interval '14 days'
        group by 1
      ) t), '[]'::json),
    'people', (
      select json_build_object(
        'seen',      count(*),                              -- vid 로 가른 사람 수
        'two_days',  count(*) filter (where days >= 2),     -- 이틀 이상 온 사람
        'three_days', count(*) filter (where days >= 3)
      )
      from (
        select vid, count(distinct (at at time zone 'Asia/Seoul')::date) as days
        from public.visits
        where vid is not null and at >= now() - interval '14 days'
        group by vid
      ) p)
  );
end $$;

revoke all on function public.visits_stats() from public;
grant execute on function public.visits_stats() to anon, authenticated;

-- 확인
--   select public.visits_stats();
--   people.seen 이 0 이면 아직 클라이언트가 vid 를 안 보내는 것이다 (config.js 스위치).
