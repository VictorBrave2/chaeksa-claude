-- migrate-39 · 2026-10-22 「무슨 결로 먹고사나」(진로 보고서, code ilgyeol) — 카카오페이로 판다(사장님 10-21 「지금 걸자 · 카카오페이 연결」).
--
-- 1) 상품 한 줄 — 값은 여기서만 정한다(앱은 서버 표를 읽는다). 69,000원(사장님 「값 네가 넣어」 · 「만만해 보이고 싶진 않다」 → 메인이 정함).
-- 2) order_intake(migrate-25)가 출산택일(taekil)만 받던 것을 진로 보고서(ilgyeol)도 받게.
-- 3) 사장님 목록 — 결제된 진로 보고서 주문과 신청서를 super 계정만 본다(ilgyeol_admin_list). 손 도구(tools/livelihood-manual.js)에 붙여 넣을 JSON 이 여기서 나온다.
-- 다시 돌려도 된다.

-- ── 1. 상품 ──
insert into public.products (code, name, amount, blurb, sort, active)
values ('ilgyeol', '무슨 결로 먹고사나 — 진로 보고서', 69000,
        '한 사람의 사주와 자미두수로 맞는 일의 조건 · 피할 꼴 · 돈이 오는 길 · 같이 일할 사람 · 앞으로 10년을 적은 보고서. 통설로 보면 · 원문으로 보면을 나란히.', 25, true)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, blurb = excluded.blurb, sort = excluded.sort, active = true;

-- ── 2. 신청서 붙이기 — taekil · ilgyeol ──
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
  select * into o from public.orders
   where id = p_order and user_id = auth.uid() and product in ('taekil', 'ilgyeol') and status in ('open', 'paid');
  if not found then
    return json_build_object('ok', false, 'reason', 'no_order');
  end if;
  if o.intake is not null then
    return json_build_object('ok', false, 'reason', 'already', 'at', o.intake_at);
  end if;
  update public.orders set intake = p_intake, intake_at = now() where id = o.id;
  return json_build_object('ok', true, 'orderId', o.id);
end $fn$;
revoke all on function public.order_intake(text, jsonb) from public, anon;
grant execute on function public.order_intake(text, jsonb) to authenticated;

-- ── 3. 사장님 목록(super 만) — 결제된 · 환불된 진로 보고서 주문 ──
create or replace function public.ilgyeol_admin_list(p_limit int default 200)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  lim int := least(greatest(coalesce(p_limit, 200), 1), 500);
  v_rows jsonb;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', o.id, 'status', o.status, 'mode', o.pay_mode, 'amount', o.amount,
           'paidAt', o.paid_at, 'createdAt', o.created_at, 'intakeAt', o.intake_at,
           'intake', o.intake, 'note', o.note) order by coalesce(o.paid_at, o.created_at) desc), '[]'::jsonb)
    into v_rows
    from (select * from public.orders where product = 'ilgyeol' and status in ('paid', 'canceled')
          order by coalesce(paid_at, created_at) desc limit lim) o;
  return jsonb_build_object('ok', true, 'rows', v_rows);
end $$;
revoke all on function public.ilgyeol_admin_list(int) from public, anon;
grant execute on function public.ilgyeol_admin_list(int) to authenticated;

-- 확인(사장님이 Run 한 뒤):
--   select code, name, amount, active from public.products where code = 'ilgyeol';   → 한 줄 · 69000 · true
