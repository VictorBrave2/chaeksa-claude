-- migrate-37 — 네이버페이 주문(10-03 사장님 「네이버 카카오 토스 테스트 API로 연결은 다 해두자」)
--
-- 사장님이 Supabase → SQL Editor 에 이 파일 전부를 붙여 넣고 Run 한 번. 여러 번 돌려도 같다.
--
-- 무엇이 바뀌나
--   1) 주문의 결제사(provider)에 'naver' 를 허락한다(지금은 toss · kakao 만).
--   2) 카카오페이용 서버 함수 다섯(order_pg_ready · paid · failed · note · canceled)이 네이버페이 주문도 받는다.
--      돈 흐름은 카카오와 같다 — 서버 열쇠(p_server)가 있어야 결제완료를 적고, 그 주문의 그 거래표(pg_tid)일 때만 바뀐다.
--      네이버페이는 결제창을 연 뒤에야 결제번호(paymentId)가 생겨서, 주문을 열 때 pg_tid 에 「np_주문번호」 자리표를 적고
--      승인 뒤 네이버 결제번호를 pg_aid 에 적는다(환불 때 그 번호로 취소한다).
--   3) order_pg_get 이 pg_aid 도 돌려준다(네이버 환불에 필요).
--   4) 상품 설명(products.blurb)의 옛 말 — 출산택일 「사람이 만들어 메일로 드립니다」를 지금 약속(장부 yaksok.js 한줄)으로 맞춘다.
--      화면(pay.html)은 10-03 부터 장부에서 읽지만, 표에 남은 옛 말도 걷는다.
--
-- 되돌리기: 네이버 주문이 하나도 없으면 아래 「되돌리기」를 돌리면 된다(지금은 필요 없음).
--   alter table public.orders drop constraint orders_provider_chk;
--   alter table public.orders add constraint orders_provider_chk check (provider in ('toss', 'kakao'));
--
-- 돌린 뒤 확인(둘 다 한 줄씩 나와야 한다):
--   select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'orders_provider_chk';
--   select code, left(blurb, 40) from public.products where code = 'taekil';

-- ── 1. 결제사에 naver ─────────────────────────────────────────────
alter table public.orders drop constraint if exists orders_provider_chk;
alter table public.orders add constraint orders_provider_chk check (provider in ('toss', 'kakao', 'naver'));

-- ── 2. ready — 카카오 tid 또는 네이버 자리표(np_주문번호) ────────────────
create or replace function public.order_pg_ready(p_order text, p_provider text, p_tid text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if p_provider is null or p_provider not in ('kakao', 'naver') or coalesce(p_tid, '') = '' or length(p_tid) > 80 then
    return json_build_object('ok', false, 'reason', 'bad_request');
  end if;
  update public.orders
     set provider = p_provider, pg_tid = p_tid, payment_key = p_tid, pg_ready_at = now()
   where id = p_order and user_id = auth.uid() and status = 'open' and pg_tid is null;
  get diagnostics n = row_count;
  if n = 1 then return json_build_object('ok', true); end if;
  return json_build_object('ok', false, 'reason', 'no_order');
end $fn$;
revoke all on function public.order_pg_ready(text, text, text, text) from public, anon;
grant execute on function public.order_pg_ready(text, text, text, text) to authenticated;

-- ── 3. 승인에 필요한 것 — pg_aid(네이버 결제번호)도 돌려준다 ───────────────
create or replace function public.order_pg_get(p_order text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare o public.orders%rowtype;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into o from public.orders where id = p_order;
  if not found then return json_build_object('ok', false, 'reason', 'no_order'); end if;
  return json_build_object('ok', true, 'status', o.status, 'amount', o.amount, 'name', o.name,
    'product', o.product, 'provider', o.provider, 'tid', o.pg_tid, 'aid', o.pg_aid, 'user_id', o.user_id,
    'readyAt', o.pg_ready_at, 'pay_mode', o.pay_mode, 'fail_code', o.fail_code);
end $fn$;

-- ── 4. 결제완료 — 카카오 · 네이버. 그 주문의 그 tid 일 때만 ───────────────
create or replace function public.order_pg_paid(p_order text, p_tid text, p_aid text, p_method text, p_mode text,
                                                 p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare o public.orders%rowtype;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if p_mode is null or p_mode not in ('test', 'live') then return json_build_object('ok', false, 'reason', 'bad_mode'); end if;
  if coalesce(p_tid, '') = '' then return json_build_object('ok', false, 'reason', 'bad_request'); end if;
  update public.orders
     set status = 'paid', pg_aid = coalesce(pg_aid, left(p_aid, 64)), method = coalesce(method, left(p_method, 30)),
         pay_mode = coalesce(pay_mode, p_mode), paid_at = coalesce(paid_at, now())
   where id = p_order and provider in ('kakao', 'naver') and pg_tid = p_tid
     and (status in ('open', 'paid')
          or (status = 'failed' and coalesce(fail_code, '') not like 'AMOUNT\_MISMATCH%'))
  returning * into o;
  if o.id is null then return json_build_object('ok', false, 'reason', 'no_order'); end if;
  return json_build_object('ok', true, 'orderId', o.id, 'amount', o.amount, 'name', o.name);
end $fn$;

-- ── 5. 실패 — 카카오 · 네이버의 열린 주문만 ─────────────────────────────
create or replace function public.order_pg_failed(p_order text, p_code text, p_message text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  update public.orders
     set status = 'failed', fail_code = left(coalesce(p_code, ''), 60), fail_message = left(coalesce(p_message, ''), 300)
   where id = p_order and provider in ('kakao', 'naver') and status = 'open';
  return json_build_object('ok', true);
end $fn$;

-- ── 6. 메모 — 결제완료가 아닌 카카오 · 네이버 주문에 사장님이 찾을 코드 ───────
create or replace function public.order_pg_note(p_order text, p_tid text, p_code text, p_message text,
                                                 p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if coalesce(p_tid, '') = '' then return json_build_object('ok', false, 'reason', 'bad_request'); end if;
  update public.orders
     set fail_code = left(coalesce(p_code, ''), 60), fail_message = left(coalesce(p_message, ''), 300)
   where id = p_order and provider in ('kakao', 'naver') and pg_tid = p_tid and status in ('open', 'failed');
  get diagnostics n = row_count;
  return json_build_object('ok', n = 1);
end $fn$;

-- ── 7. 환불 — api/pay.js krefund · nrefund(사장님 super 계정만)가 결제사 취소가 된 뒤에만 부른다 ──
create or replace function public.order_pg_canceled(p_order text, p_tid text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if coalesce(p_tid, '') = '' then return json_build_object('ok', false, 'reason', 'bad_request'); end if;
  update public.orders
     set status = 'canceled', fail_code = 'REFUND',
         fail_message = case provider when 'naver' then '네이버페이 전액 환불(nrefund)' else '카카오페이 전액 환불(krefund)' end
   where id = p_order and provider in ('kakao', 'naver') and pg_tid = p_tid and status = 'paid';
  get diagnostics n = row_count;
  if n = 1 then return json_build_object('ok', true); end if;
  return json_build_object('ok', false, 'reason', 'no_order');
end $fn$;

-- 권한은 migrate-33 과 같다(create or replace 는 권한을 그대로 둔다). 확실히 하려고 다시 건다.
revoke all on function public.order_pg_get(text, text)                          from public;
revoke all on function public.order_pg_paid(text, text, text, text, text, text) from public;
revoke all on function public.order_pg_failed(text, text, text, text)           from public;
revoke all on function public.order_pg_note(text, text, text, text, text)       from public;
revoke all on function public.order_pg_canceled(text, text, text)               from public;
grant execute on function public.order_pg_get(text, text)                          to anon, authenticated;
grant execute on function public.order_pg_paid(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.order_pg_failed(text, text, text, text)           to anon, authenticated;
grant execute on function public.order_pg_note(text, text, text, text, text)       to anon, authenticated;
grant execute on function public.order_pg_canceled(text, text, text)               to anon, authenticated;

-- ── 8. 상품 설명의 옛 말 걷기(장부 yaksok.js 한줄과 같은 말) ──────────────
update public.products
   set blurb = '병원이 말한 범위 안에서 아이가 태어날 날과 시각을 엔진이 모든 날 · 모든 시각으로 계산해 고르고, 근거를 적은 보고서로 드려요.'
 where code = 'taekil';
