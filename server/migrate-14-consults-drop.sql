-- 책사 migrate-14 : 상담내역을 지운다 (2026-08-31 결재)
--
-- 왜 —
--   심층 상담(consult) 기능은 v390 에서 화면에서 지웠다.
--   그런데 **동기화만 남아** 매 세션 consults 를 내려받고 밀어올리고 있었다.
--   읽는 화면이 하나도 없다 — app/ 안에 consult.js 는 존재하지 않고,
--   ai.js 의 deepNarrate() 를 부르는 곳도 없다.
--
--   쓰지도 않을 개인 데이터를 계속 모으고 있었다.
--   채점 때와 같은 판단이다(server/migrate-13-grade-drop.sql).
--
-- **이 스크립트는 상담내역을 지웁니다. 되돌릴 수 없습니다.**
--   지우기 전에 세어 보시려면 먼저 이 한 줄을 돌려 보십시오.
--     select count(*) as 건, count(distinct user_id) as 사람 from public.consults;
--   남겨 두실 것이 있으면 지금 내려받으십시오.
--
-- 클라이언트는 이미 끊었다 — app/cloud.js 가 consults 를 더 부르지 않는다.
-- 기기에 남은 chaeksa.consults 는 계정 삭제 때 함께 지워진다(app.js).
--
-- 여러 번 실행해도 안전하다.

-- schema-3 의 delete_me() 가 consults 를 지운다. 표를 먼저 없애면 그 함수가
-- 깨져 **계정 삭제가 안 된다.** 그래서 함수부터 consults 없이 다시 만든다.
-- (schema-3 원본을 그대로 옮기고 consults 줄만 뺐다 — auth.users 삭제까지 그대로다)
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
  delete from public.people   where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;

-- 그 다음에 표를 내린다.
drop table if exists public.consults;
