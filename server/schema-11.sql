-- ██ 폐기 (2026-08-30). 실행하지 마십시오. ██
--
-- 이 스크립트가 만든 것을 server/migrate-13-grade-drop.sql 이 전부 지웁니다.
-- 기록으로만 남깁니다 — 무엇을 왜 만들었다가 왜 걷어냈는지가 남아야 하기 때문입니다.
--
-- 걷어낸 이유: 채점을 서버에 모으던 유일한 목적이 적중률 집계였는데
-- 그것을 안 하기로 했다(docs/25). 채점은 살아 있고, 공주님 기기에만 남는다.
--
-- ─────────────────────────────────────────────────────────────
-- 책사 schema-11 : 간명 채점 저장
--
-- 왜 — 문항별 [맞다/애매/아니다]가 이 서비스의 심장 데이터다:
--   · 「적중률을 공개하는 사주」의 실데이터 (랜딩 16/18 을 실측 누계로 갱신)
--   · 어떤 잣대(문항 유형)가 빗나가는지 — 법전을 벼리는 재료
-- 기기(localStorage)에만 두면 둘 다 못 한다 (2026-08-30 「db에 저장할 수 있어야」).
--
-- 여러 번 실행해도 안전하다.

create table if not exists public.ganmyeong_grade (
  user_id uuid not null,
  pk      text not null,            -- 사주 키 'YYYY.M.D.H'
  item    int  not null,            -- 문항 번호 (0부터)
  grade   text not null check (grade in ('y', 'm', 'n')),
  at      timestamptz not null default now(),
  primary key (user_id, pk, item)
);
alter table public.ganmyeong_grade enable row level security;
-- 접근은 함수로만 (정책 없음 = 직접 접근 차단)

create or replace function public.ganmyeong_grade_put(p_pk text, p_item int, p_grade text)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if p_grade not in ('y', 'm', 'n') or p_item < 0 or p_item > 60 then
    return json_build_object('ok', false, 'reason', 'bad_input');
  end if;
  insert into ganmyeong_grade (user_id, pk, item, grade) values (v_uid, p_pk, p_item, p_grade)
  on conflict (user_id, pk, item) do update set grade = excluded.grade, at = now();
  return json_build_object('ok', true);
end $$;

-- 전체 집계 — 공개 적중률의 원천. 개인은 식별되지 않는다(합계만).
create or replace function public.ganmyeong_grade_stats()
returns json language sql security definer set search_path = public stable as $$
  select json_build_object(
    'ok', true,
    'y', count(*) filter (where grade = 'y'),
    'm', count(*) filter (where grade = 'm'),
    'n', count(*) filter (where grade = 'n'),
    'raters', count(distinct user_id))
  from ganmyeong_grade;
$$;

revoke all on function public.ganmyeong_grade_put(text, int, text) from public, anon;
revoke all on function public.ganmyeong_grade_stats()              from public, anon;
grant execute on function public.ganmyeong_grade_put(text, int, text) to authenticated;
grant execute on function public.ganmyeong_grade_stats()              to authenticated;
