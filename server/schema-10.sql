-- 책사 schema-10 : 간명서 서버 캐시
--
-- 왜 — 간명서(Opus, 장문)는 한 번 굽는 데 1분·수백 원이다. 브라우저 캐시(localStorage)만
-- 믿었더니 「굽는 중 새로고침」이 요청을 죽이고, 죽은 요청도 서버에서는 끝까지 과금됐다
-- (2026-08-30 「토큰 녹잖아」). 결과를 서버에 저장하면:
--   · 새로고침·기기 변경·캐시 삭제에도 두 번 굽지 않는다
--   · 클라이언트가 떠나도 Vercel 함수는 계속 돌므로, 죽은 요청의 결과까지 저장된다
--
-- 쓰는 쪽 — api/chat.js 가 x-chaeksa-cache 헤더(사주 키)를 받으면:
--   bump 전에 ganmyeong_get 을 보고, 있으면 그대로 반환(과금·계량 없음).
--   없으면 정상 생성 후 ganmyeong_put.
--
-- 여러 번 실행해도 안전하다 (or replace / if not exists).

create table if not exists public.ganmyeong_cache (
  user_id uuid not null,
  pk      text not null,             -- 'YYYY.M.D.H' — 사주 입력 키
  body    text not null,
  at      timestamptz not null default now(),
  primary key (user_id, pk)
);
alter table public.ganmyeong_cache enable row level security;
-- 접근은 아래 security definer 함수로만 한다 — 정책은 만들지 않는다(직접 접근 차단).

create or replace function public.ganmyeong_get(p_pk text)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_body text;
begin
  if v_uid is null then return json_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  select body into v_body from ganmyeong_cache where user_id = v_uid and pk = p_pk;
  if v_body is null then return json_build_object('ok', true, 'hit', false); end if;
  return json_build_object('ok', true, 'hit', true, 'body', v_body);
end $$;

create or replace function public.ganmyeong_put(p_pk text, p_body text)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if length(p_body) > 60000 then return json_build_object('ok', false, 'reason', 'too_big'); end if;
  insert into ganmyeong_cache (user_id, pk, body) values (v_uid, p_pk, left(p_body, 60000))
  on conflict (user_id, pk) do update set body = excluded.body, at = now();
  return json_build_object('ok', true);
end $$;

revoke all on function public.ganmyeong_get(text)       from public, anon;
revoke all on function public.ganmyeong_put(text, text) from public, anon;
grant execute on function public.ganmyeong_get(text)       to authenticated;
grant execute on function public.ganmyeong_put(text, text) to authenticated;
