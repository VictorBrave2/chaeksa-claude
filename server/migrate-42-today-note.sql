-- migrate-42 · 오늘의 운세 사건 빈도 (2026-10-28 사장님 「사건 빈도수를 측정하란 뜻이야」)
--
-- 저녁 기록(비슷했어요 · 달랐어요 · 특별한 일 없었어요)은 손님 브라우저에만 남았다 — 문장마다 실제로 일어났는지 셀 수 없었다.
-- track.js 가 같은 visits 표에 path = 'ev:tn|<조각 열쇠>|<답>' 한 줄을 넣는다(조용한 날은 'ev:tq|…').
--   조각 열쇠 = 그날 첫 줄(예: 새로|지지|정관|없음). 생년월일 · 메모 · 이름은 보내지 않는다.
-- today_note_stats(일수) — 열쇠마다 답 셋의 줄 수 · 사람 수(vid). 지우는 행 없음. 두 번 돌려도 안전.

create or replace function public.today_note_stats(days int default 90)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(json_agg(r order by r.n desc), '[]'::json)
  from (
    select substring(path from '^ev:t[nq]\|(.*)\|[^|]+$') as key,
           substring(path from '\|([^|]+)$')             as answer,
           (path like 'ev:tq|%')                          as quiet,
           count(*)                                       as n,
           count(distinct vid)                            as people
    from public.visits
    where path like 'ev:t_|%' and at >= now() - make_interval(days => greatest(1, least(days, 365)))
    group by 1, 2, 3
  ) r;
$$;

revoke all on function public.today_note_stats(int) from public;
grant execute on function public.today_note_stats(int) to anon, authenticated;
