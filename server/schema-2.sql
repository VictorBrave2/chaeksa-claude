-- 책사 스키마 추가분 (2) — 계정·데이터 완전 삭제
-- Supabase > SQL Editor 에 붙여넣고 실행하세요. 두 번 실행해도 안전합니다.
--
-- 왜 필요한가: 개인정보보호법상 이용자는 자신의 정보를 파기하도록 요구할 수 있어야 한다.
-- 클라이언트에서는 auth.users 를 지울 권한이 없으므로, 본인 것만 지우는 함수를 서버에 둔다.

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
  delete from public.consults where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;   -- 계정 자체를 지운다
end $$;

revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;
