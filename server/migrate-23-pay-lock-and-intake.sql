-- migrate-23 : 결제 기록 잠금을 실제로 건다 + 출산택일 주문서를 주문에 붙인다 (2026-09-11)
--
-- ■ 왜 — 첫 테스트 결제(ck_taekil_20260911203811_…)에서 드러났다
--   토스 승인은 됐는데 pay-done 에 「결제는 되었으나 주문 기록에 문제가 있었습니다」.
--   DB 에는 migrate-12 전의 order_paid(인자 넷)만 있었다 — migrate-12 가 한 번도 안 돌았다.
--   api/pay.js 는 인자 다섯(p_server)으로 부르므로 「그런 함수 없음」(404) → 기록 실패.
--   게다가 옛 함수는 잠금 전이라, 로그인한 누구나 결제 없이 자기 주문을 「결제완료」로 만들 수 있었다.
--   이 파일이 migrate-12 의 잠금을 대신한다. 열쇠는 **DB 가 만든다** — 대화·저장소 어디에도 안 남는다.
--
-- ■ 순서
--   1) 이 파일 전체를 Supabase SQL Editor 에 붙여넣고 Run
--      (Supabase 가 「destructive operation」 경고를 띄운다 — 옛 order_paid 를 지우는 줄 때문이다. Run query)
--   2) 결과 맨 아래 한 칸(PAY_HOOK_SECRET 에 넣을 값)을 복사
--   3) Vercel → chaeksa-claude → Settings → Environment Variables → PAY_HOOK_SECRET = (그 값) → Redeploy
--   4) 첫 테스트 결제의 「결제가 끝났습니다」 화면을 새로고침 — 그 주문이 결제완료로 적힌다
--      (토스 승인은 같은 주문번호로 다시 불러도 한 번만 처리된다: Idempotency-Key)

-- ── 1. 서버만 읽는 서랍 ─────────────────────────────────────────
create table if not exists public.app_secret (
  k text primary key,
  v text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_secret enable row level security;   -- 정책 없음 = 어떤 클라이언트도 못 읽는다
revoke all on table public.app_secret from anon, authenticated;

-- 열쇠는 DB 가 만든다(64자). 이미 진짜 값이 있으면 그대로 둔다 — 다시 돌려도 Vercel 값과 어긋나지 않는다.
-- migrate-12 의 자리표시 「여기에-열쇠」가 들어가 있던 경우에만 새로 만든다.
insert into public.app_secret (k, v)
values ('pay_hook', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (k) do update
  set v = excluded.v, updated_at = now()
  where public.app_secret.v = '여기에-열쇠';

-- ── 2. 승인 기록 — 서버 열쇠를 가진 쪽만 (migrate-12 와 같은 몸통) ──────
drop function if exists public.order_paid(text, text, text, text);

create or replace function public.order_paid(
  p_order text, p_payment_key text, p_method text default null,
  p_receipt text default null, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare o public.orders%rowtype; s text;
begin
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

-- anon 까지 분명히 뺀다. schema-8 은 public 에서만 걷었는데, Supabase 기본 권한이 anon 에게도
-- 실행을 줘서 옛 함수는 anon 으로도 불렸다(2026-09-11 확인).
revoke all on function public.order_paid(text, text, text, text, text) from public, anon;
grant execute on function public.order_paid(text, text, text, text, text) to authenticated;

-- ── 3. 출산택일 주문서 ───────────────────────────────────────────
-- 결제 뒤 「메일로 이어가기」 대신 그 자리에서 주문서를 받는다(2026-09-11 사장님).
-- 주문 한 줄에 붙인다 — 결제와 주문서가 따로 놀면 누구 것인지 맞추는 일이 생긴다.
alter table public.orders add column if not exists intake    jsonb;
alter table public.orders add column if not exists intake_at timestamptz;

create or replace function public.order_intake(p_order text, p_intake jsonb)
returns json language plpgsql security definer set search_path = public as $fn$
declare o public.orders%rowtype;
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_intake is null or jsonb_typeof(p_intake) <> 'object' or length(p_intake::text) > 8000 then
    return json_build_object('ok', false, 'reason', 'bad_request');
  end if;
  -- 내 주문 · 출산택일 · 아직 닫히지 않은 것만. 'open' 도 받는다 — 결제 기록이 늦게 적혀도
  -- (오늘처럼) 손님의 주문서가 막히면 안 된다. 처리는 사장님이 결제 여부를 보고 한다.
  update public.orders
     set intake = p_intake, intake_at = now()
   where id = p_order and user_id = auth.uid() and product = 'taekil'
     and status in ('open', 'paid')
  returning * into o;
  if o.id is null then
    return json_build_object('ok', false, 'reason', 'no_order');
  end if;
  return json_build_object('ok', true, 'orderId', o.id, 'at', o.intake_at);
end $fn$;

revoke all on function public.order_intake(text, jsonb) from public, anon;
grant execute on function public.order_intake(text, jsonb) to authenticated;

-- ── 들어온 주문서 보기 (사장님용 — 필요할 때 이 줄만 따로 돌린다) ─────────
--   select id, status, amount, intake_at, intake
--     from public.orders where product = 'taekil' and status = 'paid'
--    order by coalesce(intake_at, created_at) desc;
--   (status = 'paid' 가 결제된 것. 신청서를 고쳐 다시 보내면 intake_at 이 바뀌어 맨 위로 온다)

-- ── 4. 무료 등급 story 한도 24 → 40 (migrate-12 에 같이 있다가 함께 안 돌았던 몫) ──
-- 결제해도 등급은 free 로 남는다. 앱(app/usage.js)은 이미 40 인데 서버(schema-9)는 24 라,
-- 결제한 손님의 서술이 24번째에서 서버에 막힌다. app/usage.js 의 값과 반드시 같아야 한다.
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

-- ── 5. Vercel 에 넣을 값 — 이 결과 한 칸을 복사한다 ─────────────────
select v as "PAY_HOOK_SECRET 에 넣을 값" from public.app_secret where k = 'pay_hook';
