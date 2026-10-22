-- migrate-41 · 2026-10-22 결혼상대 점검(code gyeolhon, 49,000원)을 카카오페이로 — 사장님 10-22 결정 25 「모든 콘텐츠는 카카오페이 결제 받는 거지 당연히」.
--   10-07 ~ 10-22 는 로그인 없는 신청서 + 계좌이체(비공개 sql-gyeolhon-apply.sql · 표 gyeolhon_applies)였다. 그 표 · 함수는 그대로 둔다(옛 신청 기록 · 사장님 목록 아래 접힘).
--   새 신청은 모두 사이트 결제 주문(orders)으로 들어온다 — 신청서(두 사람 · 메일)는 결제창을 열 때 주문에 붙는다(api/pay.js kopen → order_intake).
--   보고서(PDF)는 지금처럼 사장님이 비공개 tools/gyeolhon-manual.js 로 만들어 메일로 보낸다 — 자동 만들기 없음(출산택일 · 「나는 뭐해 먹고 살까?」와 다른 점).
--
-- ■ 사장님이 하실 일 (한 번)
--   1) 이 파일 전체를 복사해 Supabase → SQL Editor 에 붙여 넣고 Run. 확인 상자가 뜨면 「Run this query」.
--   2) 맨 아래 결과 한 줄을 본다 — 첫 칸 {"code":"gyeolhon","amount":49000,"active":true} · 둘째 칸 {"ok": false, "reason": "forbidden"}(검수 계정이 아니면 막힘 = 문이 서 있다).
--   비밀값은 들어 있지 않다 · Vercel 에 새로 넣을 값도 없다. 여러 번 돌려도 안전하다(값 · 표 · 보냄 표시는 있으면 그대로).
--   먼저 돌아 있어야 하는 것: sql-launch-10-01.sql(ai_plan) · migrate-25(orders.intake) · migrate-39(order_intake 새 판 · 「나는 뭐해 먹고 살까?」).
--
-- ■ 무엇을 만드나
--   1) products 한 줄 — 값(49,000원)은 여기서만 정한다(앱은 서버 표를 읽는다. 상품표에 줄이 없으면 신청 쪽 결제 단추가 잠긴다).
--   2) order_intake(migrate-39)가 taekil · ilgyeol 만 받던 것을 gyeolhon 도 받게.
--   3) 표 gyeolhon_orders — 주문마다 「보냄」 표시 · 사장님 메모. 손님이 표에 직접 닿는 길은 없다(RLS 켜고 정책 없음).
--   4) 문(함수) — 손님(로그인): my_gyeolhon(내 신청 상태)  ·  사장님 목록(super): gyeolhon_order_list · gyeolhon_order_mark
--
-- ■ 상태(state) — received(결제됐고 아직 안 보냄) · sent(보냄) · canceled(환불). 2년 지난 주문은 목록에 안 나온다(약관 보관 기간).

-- ── 1. 상품 ──
insert into public.products (code, name, amount, blurb, sort, active)
values ('gyeolhon', '결혼상대 점검 보고서', 49000,
        '두 사람의 생년월일시로 같이 가도 되는지 · 서로 맞춰 가야 하는지 · 날짜를 잡기 전에 다시 생각해 봐야 하는지. 결혼 전에 할 일과 피할 해까지. 책사가 확인한 뒤 메일로 PDF.', 23, true)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, blurb = excluded.blurb, sort = excluded.sort, active = true;

-- ── 2. 신청서 붙이기 — taekil · ilgyeol · gyeolhon ──
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
   where id = p_order and user_id = auth.uid() and product in ('taekil', 'ilgyeol', 'gyeolhon') and status in ('open', 'paid');
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

-- ── 3. 보냄 표시 · 메모 표 ──
create table if not exists public.gyeolhon_orders (
  order_id   text primary key references public.orders(id) on delete cascade,
  sent_at    timestamptz,                -- 사장님이 PDF 를 메일로 보낸 때(「보냄 표시」)
  sent_by    uuid,
  owner_note text,                       -- 사장님 메모(손님에게 안 보인다)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gyeolhon_orders enable row level security;
revoke all on table public.gyeolhon_orders from anon, authenticated;

-- ── 4. 안쪽 도움 함수 ──
create or replace function public._gyeolhon_state(p_status text, p_sent_at timestamptz)
returns text language sql immutable as $$
  select case when p_status = 'canceled' then 'canceled' when p_sent_at is not null then 'sent' else 'received' end
$$;

-- 줄 하나 — p_id 가 있으면 그 주문만, p_user 가 있으면 그 사람 것만(손님). 둘 다 null 이면 전부(사장님 목록 — 부르는 함수가 super 를 본다)
create or replace function public._gyeolhon_list(p_id text default null, p_user uuid default null)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'id', o.id, 'mode', case when o.pay_mode = 'live' then 'live' else 'test' end,
           'state', public._gyeolhon_state(o.status, g.sent_at),
           'orderStatus', o.status, 'amount', o.amount,
           'paidAt', o.paid_at, 'createdAt', o.created_at, 'at', coalesce(o.paid_at, o.created_at), 'intakeAt', o.intake_at,
           'kind', o.intake ->> 'kind',
           'who', left(coalesce(o.intake -> 'first' ->> 'name', '?') || ' · ' || coalesce(o.intake -> 'second' ->> 'name', '?'), 40),
           'email', left(o.intake ->> 'email', 120),
           'intake', o.intake, 'orderNote', o.note,
           'sentAt', g.sent_at, 'note', left(g.owner_note, 4000), 'gone', o.user_id is null)
    from public.orders o
    left join public.gyeolhon_orders g on g.order_id = o.id
   where o.product = 'gyeolhon' and o.status in ('paid', 'canceled') and o.paid_at is not null
     and o.paid_at > now() - interval '2 years'
     and (p_id is null or o.id = p_id)
     and (p_user is null or o.user_id = p_user)
$$;

-- ── 5. 손님 — 내 신청(상태만 · 신청서 본문은 안 준다) ──
create or replace function public.my_gyeolhon()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); v jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', x ->> 'id', 'paidAt', x -> 'paidAt', 'amount', x -> 'amount', 'state', x ->> 'state',
                                               'sentAt', x -> 'sentAt', 'kind', x ->> 'kind', 'who', x ->> 'who', 'email', x ->> 'email')
                            order by (x ->> 'at')::timestamptz desc nulls last), '[]'::jsonb) into v
    from public._gyeolhon_list(null, uid) as x;
  return v;
end $$;

-- ── 6. 사장님 목록(super) ──
create or replace function public.gyeolhon_order_list(p_filter text default null, p_limit int default 200)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  lim int := least(greatest(coalesce(p_limit, 200), 1), 500);
  v_counts jsonb;
  v_rows jsonb;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select coalesce(jsonb_object_agg(q.v, q.c), '{}'::jsonb) into v_counts
    from (select x ->> 'state' as v, count(*) as c from public._gyeolhon_list(null, null) as x group by 1) q;
  select coalesce(jsonb_agg(q.x order by (q.x ->> 'at')::timestamptz desc nulls last), '[]'::jsonb) into v_rows
    from (select x from public._gyeolhon_list(null, null) as x
           where p_filter is null or p_filter = '' or x ->> 'state' = p_filter
           order by (x ->> 'at')::timestamptz desc nulls last
           limit lim) q;
  return jsonb_build_object('ok', true, 'counts', v_counts, 'rows', v_rows);
end $$;

-- 보냄 표시(p_sent true) · 되돌리기(false) · 그대로(null) — 메모(p_note, null 이면 그대로 · '' 이면 지움). → { ok, row }
create or replace function public.gyeolhon_order_mark(p_order text, p_sent boolean default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; r jsonb;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into o from public.orders where id = p_order and product = 'gyeolhon';
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  insert into public.gyeolhon_orders (order_id) values (o.id) on conflict (order_id) do nothing;
  if p_sent is true then
    update public.gyeolhon_orders set sent_at = coalesce(sent_at, now()), sent_by = auth.uid(), updated_at = now() where order_id = o.id;
  elsif p_sent is false then
    update public.gyeolhon_orders set sent_at = null, sent_by = null, updated_at = now() where order_id = o.id;
  end if;
  if p_note is not null then
    update public.gyeolhon_orders set owner_note = nullif(left(p_note, 4000), ''), updated_at = now() where order_id = o.id;
  end if;
  select x into r from public._gyeolhon_list(o.id, null) as x limit 1;
  return jsonb_build_object('ok', true, 'row', r);
end $$;

-- ── 7. 권한 ──
revoke all on function public._gyeolhon_state(text, timestamptz)                 from public, anon, authenticated;
revoke all on function public._gyeolhon_list(text, uuid)                          from public, anon, authenticated;
revoke all on function public.my_gyeolhon()                                       from public, anon;
revoke all on function public.gyeolhon_order_list(text, int)                      from public, anon;
revoke all on function public.gyeolhon_order_mark(text, boolean, text)            from public, anon;
grant execute on function public.my_gyeolhon()                                    to authenticated;
grant execute on function public.gyeolhon_order_list(text, int)                   to authenticated;
grant execute on function public.gyeolhon_order_mark(text, boolean, text)         to authenticated;

-- ── 8. 확인 ──
select (select row_to_json(p) from (select code, amount, active from public.products where code = 'gyeolhon') p) as 상품,
       public.gyeolhon_order_list(null, 1) as 사장님목록문;
