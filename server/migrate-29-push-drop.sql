-- 2026-09-14 아침 알림 삭제(사장님 「오늘 탭이 없으니 아침 알림도 삭제」). 구독 표·설정 표·RPC 를 내린다.
-- 실행 전 확인: select count(*) from public.push_subs;
drop function if exists public.push_subscribe(text, text, text);
drop function if exists public.push_unsubscribe(text);
drop function if exists public.push_list(uuid);
drop table if exists public.push_subs;
drop table if exists public.push_config;
