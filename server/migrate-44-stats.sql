-- migrate-44 · 방문 · 깔때기 집계 함수는 사장님(super) 만 (2026-11-05 상세점검 docs/140 · 결정함 128)
--
-- visits_stats · funnel_stats 가 anon 실행 허용이라 공개 열쇠만으로 누구나 방문 수 · 유입 경로 · 결제 사람 수를 봤다.
-- 본문은 migrate-30 그대로, 맨 앞에 「super 아니면 거절」 한 문장. anon 실행 권한은 걷고, 로그인한 사장님 계정(ai_plan() = 'super')만 부른다.
-- tools/visits.html 은 로그인 토큰을 보낸다(v1629). 지우는 행 없음. 두 번 돌려도 안전.


create or replace function public.visits_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.ai_plan(), '') <> 'super' then raise exception 'forbidden' using errcode = '42501'; end if;
  return json_build_object(
    'total', (select count(*) from public.visits where path not like 'ev:%'),
    'today', (select count(*) from public.visits
              where path not like 'ev:%'
                and at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'),
    'days', coalesce((
      select json_agg(json_build_object('d', d, 'n', n, 'first', f, 'returning', n - f) order by d desc)
      from (
        select to_char(at at time zone 'Asia/Seoul', 'MM-DD') as d,
               count(*) as n,
               count(*) filter (where first_time) as f
        from public.visits
        where path not like 'ev:%' and at >= now() - interval '14 days'
        group by 1
      ) t), '[]'::json),
    'sources', coalesce((
      select json_agg(json_build_object('s', source, 'n', n) order by n desc)
      from (
        select source, count(*) as n
        from public.visits
        where path not like 'ev:%' and at >= now() - interval '14 days'
        group by 1
      ) t), '[]'::json),
    'people', (
      select json_build_object(
        'seen',      count(*),
        'two_days',  count(*) filter (where days >= 2),
        'three_days', count(*) filter (where days >= 3)
      )
      from (
        select vid, count(distinct (at at time zone 'Asia/Seoul')::date) as days
        from public.visits
        where path not like 'ev:%' and vid is not null and at >= now() - interval '14 days'
        group by vid
      ) p)
  );
end $$;

revoke all on function public.visits_stats() from public;
revoke execute on function public.visits_stats() from anon;
grant execute on function public.visits_stats() to authenticated;

-- 깔때기. 사람 수는 vid 가 있는 줄만 가른다(스위치가 꺼져 있던 기간은 줄 수만 남는다).
create or replace function public.funnel_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.ai_plan(), '') <> 'super' then raise exception 'forbidden' using errcode = '42501'; end if;
  return json_build_object(
    'days', 14,
    'visit',   json_build_object(
                 'people', (select count(distinct vid) from public.visits where path not like 'ev:%' and vid is not null and at >= now() - interval '14 days'),
                 'rows',   (select count(*) from public.visits where path not like 'ev:%' and at >= now() - interval '14 days')),
    'profile', json_build_object(
                 'people', (select count(distinct vid) from public.visits where path = 'ev:profile' and vid is not null and at >= now() - interval '14 days'),
                 'rows',   (select count(*) from public.visits where path = 'ev:profile' and at >= now() - interval '14 days')),
    'sheet',   json_build_object(
                 'people', (select count(distinct vid) from public.visits where path = 'ev:sheet' and vid is not null and at >= now() - interval '14 days'),
                 'rows',   (select count(*) from public.visits where path = 'ev:sheet' and at >= now() - interval '14 days')),
    'pay',     json_build_object(
                 'people', (select count(distinct vid) from public.visits where path = 'ev:pay' and vid is not null and at >= now() - interval '14 days'),
                 'rows',   (select count(*) from public.visits where path = 'ev:pay' and at >= now() - interval '14 days')),
    'by_day', coalesce((
      select json_agg(json_build_object('d', d, 'profile', p, 'sheet', s, 'pay', y) order by d desc)
      from (
        select to_char(at at time zone 'Asia/Seoul', 'MM-DD') as d,
               count(*) filter (where path = 'ev:profile') as p,
               count(*) filter (where path = 'ev:sheet') as s,
               count(*) filter (where path = 'ev:pay') as y
        from public.visits
        where path like 'ev:%' and at >= now() - interval '14 days'
        group by 1
      ) t), '[]'::json)
  );
end $$;

revoke all on function public.funnel_stats() from public;
revoke execute on function public.funnel_stats() from anon;
grant execute on function public.funnel_stats() to authenticated;

-- 확인(사장님으로 로그인한 토큰으로만 200)
--   select public.visits_stats();
