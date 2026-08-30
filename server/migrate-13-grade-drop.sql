-- 책사 migrate-13 : 채점 서버 수집을 통째로 걷어낸다 (2026-08-30 결재)
--
-- 왜 —
--   schema-11 이 채점을 서버에 모으던 이유는 딱 둘이었다:
--     ① 「적중률을 공개하는 사주」의 실데이터
--     ② 어떤 잣대가 빗나가는지 — 법전을 벼리는 재료
--   ①은 폐기됐다(docs/25). 적중률 숫자를 내걸지 않기로 했으니 집계 자체를 안 한다.
--   재는 순간 숫자를 내걸고 싶어지고, 책사별로 세면 잘 맞힌 책사를 자주 부르고 싶어진다.
--   그러면 판정이 인기순으로 왜곡된다 — 책사는 인기로 뽑는 자리가 아니라 엔진 축이다.
--   ②는 읽는 코드가 한 줄도 없었다. 남은 것은 쓰지도 않을 개인 데이터를 모으는 일뿐이다.
--
-- **이 스크립트는 쌓인 채점 행을 지웁니다. 되돌릴 수 없습니다.**
--   지금은 개통 전이라 사장님 본인의 시험 채점만 들어 있다.
--   그래도 지우기 전에 한 번 세어 보시려면 아래 한 줄을 먼저 돌려 보십시오.
--     select count(*) as 행, count(distinct user_id) as 사람 from public.ganmyeong_grade;
--
-- 클라이언트는 이미 끊었다 — app.js 가 ganmyeong_grade_put 을 더 부르지 않는다.
-- 채점은 그대로 살아 있다. 다만 공주님 기기(localStorage)에만 남는다.
--
-- 여러 번 실행해도 안전하다.

drop function if exists public.ganmyeong_grade_stats();
drop function if exists public.ganmyeong_grade_put(text, int, text);
drop table    if exists public.ganmyeong_grade;
