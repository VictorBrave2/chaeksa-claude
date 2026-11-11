-- migrate-45 · 2026-11-11 출산택일 보고서 「빈 칸」 판정에서 alldays 를 뺀다 — 결제 손님 보고서가 「막힘(sec:alldays)」으로 안 열리던 것.
--   10-06 사장님 「제외시킨 날짜와 시간이 필요하냐」 → 보고서에서 「날짜별로 전부」(alldays) 칸을 걷었는데(비공개 lib/taekil-report.js),
--   DB 의 _taekil_missing(migrate-36)은 alldays 를 「늘 있어야 할 칸」으로 그대로 들고 있어 사이트 결제 보고서마다 missing 에 sec:alldays 가 붙고 state 가 blocked 가 됐다.
--   (11-11 로스앤젤레스 여아 · 결제 11/10 17:55 건에서 드러남 — 엔진 고침 뒤에도 「빠진 칸 1 · sec:alldays」.)
--
-- ■ 사장님이 하실 일 (한 번)
--   1) 이 파일 전체를 복사해 Supabase → SQL Editor 에 붙여 넣고 Run. 확인 상자가 뜨면 「Run this query」.
--   2) 맨 아래 결과 한 줄 — 첫 칸 7 · 둘째 칸 false · 셋째 칸 true.
--   3) 그다음 사장님 목록(taekil-admin)에서 그 손님 줄 「다시 만들기」. 비밀값 없음 · 여러 번 돌려도 안전.
--
-- ■ 무엇을 바꾸나 — 함수 하나(_taekil_missing)의 「늘 있어야 할 칸」 목록에서 'alldays' 만 뺀다. 나머지는 migrate-36 그대로.

create or replace function public._taekil_missing(p_report jsonb, p_required text[])
returns text[] language sql immutable set search_path = public as $$
  select coalesce(array_agg('sec:' || s.id order by s.id), '{}'::text[])
    from (select distinct u.id
            from unnest(array['readback', 'verdict', 'block', 'method', 'clock', 'close', 'receipt']::text[]
                        || coalesce(p_required, '{}'::text[])) as u(id)
           where u.id ~ '^[a-z][a-z0-9_]{0,39}$') s
   where case when jsonb_typeof(p_report -> s.id -> 'body') = 'array'
              then jsonb_array_length(p_report -> s.id -> 'body') = 0
              else true end
$$;

-- ── 확인 (Run 결과로 보인다) ──
-- 첫 칸 7 — 빈 보고서에서 빠진 칸 수(readback · verdict · block · method · clock · close · receipt) · 둘째 칸 false — alldays 는 더 안 센다 · 셋째 칸 true — 일곱 칸이 있으면 빠진 칸 0
select cardinality(public._taekil_missing('{}'::jsonb, '{}'::text[])) as "늘 있어야 할 칸 수(7)",
       'sec:alldays' = any(public._taekil_missing('{}'::jsonb, '{}'::text[])) as "alldays 를 세나(false)",
       cardinality(public._taekil_missing(
         '{"readback":{"body":[1]},"verdict":{"body":[1]},"block":{"body":[1]},"method":{"body":[1]},"clock":{"body":[1]},"close":{"body":[1]},"receipt":{"body":[1]}}'::jsonb,
         '{}'::text[])) = 0 as "일곱 칸 있으면 빠짐 0(true)";
