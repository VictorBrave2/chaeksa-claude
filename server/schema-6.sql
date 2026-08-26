-- 책사 schema-6 : 아침 푸시 알림 구독
--
-- 궁극의 목표("매일 열어보는 명리비서")에서 빠져 있던 조각 — 매일 열게 만드는 장치.
-- 매일 아침 07:30(KST)에 Vercel Cron이 구독된 기기로 빈 푸시를 보내고,
-- 알림 문구와 오늘 계산은 기기가 스스로 만든다(개인정보가 서버를 오가지 않는다).
--
-- visits·ai_usage와 같은 방식: 표에는 RLS 정책을 '하나도' 만들지 않고
-- (= 익명·로그인 누구도 직접 접근 불가), 오직 SECURITY DEFINER 함수만 통과시킨다.

create table if not exists public.push_subs (
  endpoint   text primary key,              -- 푸시 서비스가 발급한 기기 고유 주소
  p256dh     text not null,                 -- (지금은 빈 푸시라 안 쓰지만, 본문 암호화로 갈 때 필요)
  auth       text not null,
  user_id    uuid references auth.users(id) on delete set null,  -- 로그인 안 해도 구독 가능
  created_at timestamptz not null default now(),
  last_ok    timestamptz
);
alter table public.push_subs enable row level security;
-- 정책 없음 — 의도된 상태다.

-- 발송자(Vercel Cron)를 확인할 비밀. 실행할 때마다 새로 만들어지는 것을 막기 위해 한 줄 고정.
create table if not exists public.push_config (
  id     int primary key default 1 check (id = 1),
  secret uuid not null default gen_random_uuid()
);
insert into public.push_config (id) values (1) on conflict (id) do nothing;
alter table public.push_config enable row level security;
-- 역시 정책 없음.

-- ── 구독 / 해지 — 기기가 직접 부른다 ────────────────────
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1024
     or length(coalesce(p_p256dh,'')) > 256 or length(coalesce(p_auth,'')) > 256 then
    return json_build_object('ok', false);
  end if;
  insert into public.push_subs (endpoint, p256dh, auth, user_id)
  values (p_endpoint, p_p256dh, p_auth, auth.uid())
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth,
    user_id = coalesce(excluded.user_id, push_subs.user_id);
  return json_build_object('ok', true);
end $$;

-- endpoint를 아는 것은 그 기기뿐이므로, endpoint 제시가 곧 본인 증명이다.
create or replace function public.push_unsubscribe(p_endpoint text)
returns json language plpgsql security definer set search_path = public as $$
begin
  delete from public.push_subs where endpoint = p_endpoint;
  return json_build_object('ok', true);
end $$;

-- ── 발송자 전용 — 비밀이 맞아야 목록을 준다 ──────────────
create or replace function public.push_list(p_secret uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from (select secret from public.push_config where id = 1) then
    return json_build_object('ok', false);
  end if;
  return json_build_object('ok', true, 'subs',
    coalesce((select json_agg(json_build_object('endpoint', endpoint)) from public.push_subs), '[]'::json));
end $$;

-- 죽은 구독 정리 + 성공 시각 기록
create or replace function public.push_mark(p_secret uuid, p_dead text[], p_alive text[])
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from (select secret from public.push_config where id = 1) then
    return json_build_object('ok', false);
  end if;
  delete from public.push_subs where endpoint = any(coalesce(p_dead, '{}'));
  update public.push_subs set last_ok = now() where endpoint = any(coalesce(p_alive, '{}'));
  return json_build_object('ok', true);
end $$;

revoke all on function public.push_subscribe(text,text,text) from public;
revoke all on function public.push_unsubscribe(text) from public;
revoke all on function public.push_list(uuid) from public;
revoke all on function public.push_mark(uuid,text[],text[]) from public;
grant execute on function public.push_subscribe(text,text,text) to anon, authenticated;
grant execute on function public.push_unsubscribe(text) to anon, authenticated;
grant execute on function public.push_list(uuid) to anon, authenticated;      -- 비밀로 걸러진다
grant execute on function public.push_mark(uuid,text[],text[]) to anon, authenticated;

-- ★ 실행하면 아래 비밀이 결과로 나온다. 그 값을 복사해서
--   Vercel 환경변수 CRON_SECRET 에 넣는다 (docs/07 참조).
select secret as "이 값을 Vercel CRON_SECRET에 넣으세요" from public.push_config where id = 1;
