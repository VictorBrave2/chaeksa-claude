-- 결제 승인을 서버만 기록할 수 있게 잠근다 (2026-08-30)
--
-- ■ 무엇이 열려 있었나
--   order_paid 가 authenticated 에게 실행 권한이 있었다(schema-8.sql:186).
--   그런데 이 함수는 「내 주문인가」만 보고 status 를 paid 로 올린다 —
--   토스 승인이 실제로 있었는지, 돈이 들어왔는지는 아무 데서도 안 본다.
--   Supabase anon 키는 app/config.js 에 공개돼 있으므로, 로그인한 사람이면 누구나
--
--     order_open  으로 주문번호를 받고
--     POST /rest/v1/rpc/order_paid  {p_order:…, p_payment_key:'x'}
--
--   두 번으로 자기 주문을 「결제완료」로 만들 수 있었다. api/pay.js 의 금액 대조와
--   토스 승인은 이 경로를 아예 지나지 않는다. 그러면 my_orders 가 paid 로 돌려주고
--   paidFor() 가 유료 화면을 전부 연다. 30,000원짜리 택일 보고서도 사람이 만들어
--   메일로 나간다.
--
-- ■ 어떻게 막는가
--   서버(api/pay.js)만 아는 열쇠를 하나 요구한다. 브라우저는 그 값을 모른다.
--   service_role 키를 쓰지 않는 방식으로 골랐다 — 그 키는 어디에도 두지 않는다는
--   원칙이 있어서다.
--
-- ■ 반드시 이 순서로 (토스 키를 넣기 전에 이 파일을 먼저 돌릴 것)
--   1) 아래 SQL 을 Supabase SQL Editor 에 붙여넣기
--   2) 34줄의 '여기에-열쇠' 을 실제 값으로 바꿔서 Run
--   3) Vercel 환경변수에 PAY_HOOK_SECRET = (같은 값) 추가
--   4) 그다음에 TOSS_CLIENT_KEY / TOSS_SECRET_KEY 를 넣는다
--   지금은 토스 키가 없어 실제 결제가 일어날 수 없으므로, 이 사이에 손님이
--   다칠 일은 없다.

-- ── 서버만 읽는 서랍 ────────────────────────────────────
create table if not exists public.app_secret (
  k text primary key,
  v text not null,
  updated_at timestamptz not null default now()
);
-- RLS 를 켜고 정책을 하나도 만들지 않는다 = 어떤 클라이언트도 못 읽는다.
-- security definer 함수만 이 표를 본다.
alter table public.app_secret enable row level security;
revoke all on table public.app_secret from anon, authenticated;

insert into public.app_secret (k, v) values ('pay_hook', '여기에-열쇠')
on conflict (k) do update set v = excluded.v, updated_at = now();

-- ── 승인 기록 — 서버 열쇠를 가진 쪽만 ───────────────────
drop function if exists public.order_paid(text, text, text, text);

create or replace function public.order_paid(
  p_order text, p_payment_key text, p_method text default null,
  p_receipt text default null, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare o public.orders%rowtype; s text;
begin
  -- 서버 열쇠가 먼저다. 로그인만으로는 여기 못 들어온다.
  select v into s from public.app_secret where k = 'pay_hook';
  if s is null or p_server is null or p_server <> s then
    return json_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  update public.orders
     set status = 'paid', payment_key = p_payment_key, method = p_method,
         receipt_url = p_receipt, paid_at = now()
   where id = p_order and user_id = auth.uid() and status in ('open', 'paid')
  returning * into o;
  if o.id is null then
    return json_build_object('ok', false, 'reason', 'no_order');
  end if;
  return json_build_object('ok', true, 'orderId', o.id, 'amount', o.amount, 'name', o.name);
end $fn$;

revoke all on function public.order_paid(text, text, text, text, text) from public;
grant execute on function public.order_paid(text, text, text, text, text) to authenticated;

-- ── 확인 ────────────────────────────────────────────────
-- 아래가 forbidden 을 돌려주면 잠긴 것이다(열쇠 없이 부른 경우).
-- select public.order_paid('아무거나', 'x');

-- ── 무료 등급의 story 한도 24 -> 40 ─────────────────────
-- 결제해도 등급은 free 로 남는다(등급 승격은 service_role 이 필요한데 그 키는 안 쓴다).
-- 1년 열람 상품이 분기마다 서술을 다시 굽는 것을 감당하려면 24 로는 열람 기간이
-- 끝나기 전에 바닥난다 — 손님은 「돈 냈는데 글이 사라졌다」로 겪는다.
-- app/usage.js 의 free.limits.story 와 반드시 같은 값이어야 한다.
create or replace function public.ai_usage_limit(p_plan text, p_task text)
returns integer language sql immutable as $$
  select case
    when p_plan = 'super' then 100000
    when p_plan = 'member' then
      case p_task when 'brief' then 62 when 'chat' then 100 when 'consult' then 15
                  when 'profile' then 4 when 'compat' then 20 when 'story' then 60 else 0 end
    else
      case p_task when 'brief' then 5 when 'chat' then 5 when 'consult' then 1
                  when 'profile' then 1 when 'compat' then 1 when 'story' then 40 else 0 end
    end;
$$;
