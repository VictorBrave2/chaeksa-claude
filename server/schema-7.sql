-- 책사 schema-7 : 유입 집계 읽기 통로
--
-- visits 표는 원시 행 보호를 위해 익명 읽기를 막아뒀다(schema-4, select 정책 없음).
-- 그대로 두되, '날짜별 개수'라는 집계만 내주는 SECURITY DEFINER 함수를 연다.
-- 집계 숫자는 민감하지 않고, 이게 있어야 "오늘 몇 명 들어왔나"를
-- 대시보드 없이 바로 확인할 수 있다.

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
      select json_agg(json_build_object('d', d, 'n', n, 'first', f) order by d desc)
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
      ) t), '[]'::json)
  );
end $$;

revoke all on function public.visits_stats() from public;
grant execute on function public.visits_stats() to anon, authenticated;

-- 확인: select public.visits_stats();
