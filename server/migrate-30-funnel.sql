-- migrate-30 · 깔때기 계기판 (2026-09-15 사장님 「계기판을 어떻게 살리지」)
--
-- 클라이언트(track.js)가 같은 visits 표에 path='ev:profile' / 'ev:sheet' / 'ev:pay' 로 사건을 한 줄씩 넣는다.
--   profile  생년월일을 넣었다      sheet  유료 장을 열었다(결제 단추가 보이는 화면)      pay  결제 단추를 눌렀다
-- 이 파일은 둘을 한다.
--   1) visits_stats 가 사건 줄(path like 'ev:%')을 방문으로 세지 않게 한다 — 안 그러면 방문 수가 부푼다.
--   2) funnel_stats — 14일 안에서 「온 사람 → 생년월일 → 유료 장 → 결제 단추」 사람 수(vid 로 가름)와 줄 수.
-- 지우는 행 없음. 두 번 돌려도 안전.

create or replace function public.visits_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
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
grant execute on function public.visits_stats() to anon, authenticated;

-- 깔때기. 사람 수는 vid 가 있는 줄만 가른다(스위치가 꺼져 있던 기간은 줄 수만 남는다).
create or replace function public.funnel_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
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
grant execute on function public.funnel_stats() to anon, authenticated;

-- 확인
--   select public.funnel_stats();
--   curl -s -X POST "$SUPA/rest/v1/rpc/funnel_stats" -H "apikey: $ANON" -H "authorization: Bearer $ANON" -H "content-type: application/json" -d '{}'
