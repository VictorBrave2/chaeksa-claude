-- 책사 schema-8 : 결제 (토스페이먼츠)
--
-- 표가 둘인 이유
--   products  가격의 **유일한** 출처. 코드에 두면 반드시 두 벌이 되고, 두 벌은 반드시 어긋난다
--             (2026-08-28 gyeokguk.js·typecard 사고와 같은 종류의 실패). 클라이언트는
--             api/pay.js 를 통해 이 표를 **받아다 그린다**. 어디에도 가격을 안 적는다.
--   orders    주문 한 건.
--
-- 금액 위변조를 어디서 막는가
--   결제창에 보낸 amount 와 승인 요청의 amount 가 같아도 아무 방어가 아니다 --
--   둘 다 브라우저가 만든 값이기 때문이다. 그래서 **승인 직전에** orders.amount 와 대조한다.
--   orders.amount 는 order_open 이 products 에서 읽어 넣은 값이라 브라우저가 못 건드린다.
--   이 대조가 없으면 100원 결제로 3만원짜리를 살 수 있다.
--
-- 왜 insert/update 정책을 안 여는가
--   anon key 는 공개값이라 누구나 Supabase 를 직접 부를 수 있다. 주문을 만들거나
--   status 를 'paid' 로 바꾸는 길을 정책으로 열면 그대로 무료 결제가 된다.
--   쓰기는 전부 security definer 함수로만 하고, 함수 안에서 auth.uid() 로 임자를 확인한다.

-- == 상품 ==========================================================
create table if not exists public.products (
  code       text primary key,
  name       text not null,
  amount     integer not null check (amount > 0),
  blurb      text,
  sort       integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select to anon, authenticated using (active);   -- 가격은 공개 정보다

-- 가격은 여기서 한 번만 정한다. 나중에 바꿀 때는 update 로 -- do nothing 이라
-- 이 파일을 다시 돌려도 이미 있는 가격을 덮어쓰지 않는다.
-- taekil 만 사람이 붙는 상담이다. 나머지 셋은 결제하면 앱에서 바로 열린다 —
-- 무료가 멈춘 자리(해·달·개수)에서 같은 잣대로 한 단계 내려간 화면이다.
insert into public.products (code, name, amount, blurb, sort) values
  ('taekil',   '출산택일 1:1 상담', 30000, '기간 전체를 12시진 전수 계산한 보고서를 사람이 만들어 카카오로 드립니다', 10),
  ('inyeon',   '인연 시기 — 달까지', 20000, '무료는 어느 해까지. 결제하면 그 해 열두 달이 앱에서 바로 열립니다',      20),
  ('relation', '두 사람 — 날짜까지', 20000, '무료는 좋은 달과 날 수까지. 결제하면 날짜와 시진이 바로 열립니다',       30),
  ('month',    '이번 달 일운 달력',  10000, '이번 달 서른 날의 흐름이 바로 열립니다. 달이 바뀌면 새로 사는 것입니다', 40)
on conflict (code) do nothing;

-- == 주문 ==========================================================
create table if not exists public.orders (
  id           text primary key,            -- 토스에 보내는 orderId (6~64자)
  user_id      uuid not null references auth.users(id) on delete cascade,
  product      text not null references public.products(code),
  name         text not null,               -- 주문 당시의 상품명. 이름이 바뀌어도 영수증은 그대로여야 한다
  amount       integer not null,            -- 주문 당시의 가격. 승인 때 이것과 대조한다
  status       text not null default 'open'
               check (status in ('open','paid','failed','canceled')),
  payment_key  text,
  method       text,
  receipt_url  text,
  fail_code    text,
  fail_message text,
  note         text,                        -- 주문서에 적은 것 (생년월일·희망 기간 등)
  created_at   timestamptz not null default now(),
  paid_at      timestamptz
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
alter table public.orders enable row level security;

drop policy if exists orders_mine on public.orders;
create policy orders_mine on public.orders
  for select to authenticated using (user_id = auth.uid());
-- insert / update / delete 정책은 일부러 없다. 아래 함수로만.

-- == 주문을 연다 ====================================================
-- 금액을 **인자로 안 받는다**. 받는 순간 방어가 사라진다.
create or replace function public.order_open(p_product text, p_note text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare p public.products%rowtype; oid text; n integer;
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  select * into p from public.products where code = p_product and active;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_product');
  end if;

  -- 열어만 두고 안 내는 주문으로 표를 채우는 것을 막는다. 사람이 하루 20건을 열 일은 없다.
  select count(*) into n from public.orders
   where user_id = auth.uid() and created_at > now() - interval '1 day';
  if n >= 20 then
    return json_build_object('ok', false, 'reason', 'too_many');
  end if;

  oid := 'ck_' || p.code || '_' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDDHH24MISS')
         || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.orders (id, user_id, product, name, amount, note)
  values (oid, auth.uid(), p.code, p.name, p.amount,
          nullif(btrim(coalesce(p_note, '')), ''));

  return json_build_object('ok', true, 'orderId', oid, 'amount', p.amount, 'name', p.name);
end $fn$;

-- == 승인 직전 대조 =================================================
-- 이 주문이 정말 이 사람 것인가, 아직 안 냈는가, 얼마짜리인가.
create or replace function public.order_check(p_order text)
returns json language plpgsql security definer set search_path = public as $fn$
declare o public.orders%rowtype;
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  select * into o from public.orders where id = p_order and user_id = auth.uid();
  if not found then
    return json_build_object('ok', false, 'reason', 'no_order');
  end if;
  -- 이미 낸 주문에 승인을 다시 부르는 일은 정상적으로 일어난다(착지 페이지 새로고침).
  -- 오류로 만들지 않는다.
  if o.status = 'paid' then
    return json_build_object('ok', true, 'already', true,
                             'amount', o.amount, 'name', o.name, 'receipt', o.receipt_url);
  end if;
  if o.status <> 'open' then
    return json_build_object('ok', false, 'reason', 'closed', 'status', o.status);
  end if;
  return json_build_object('ok', true, 'amount', o.amount, 'name', o.name);
end $fn$;

-- == 승인됨 ========================================================
create or replace function public.order_paid(
  p_order text, p_payment_key text, p_method text default null, p_receipt text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare o public.orders%rowtype;
begin
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

-- == 실패 ==========================================================
create or replace function public.order_failed(
  p_order text, p_code text default null, p_message text default null)
returns json language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  update public.orders
     set status = 'failed', fail_code = p_code, fail_message = left(coalesce(p_message, ''), 300)
   where id = p_order and user_id = auth.uid() and status = 'open';
  return json_build_object('ok', true);
end $fn$;

-- == 내 주문 =======================================================
create or replace function public.my_orders()
returns json language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then return '[]'::json; end if;
  return coalesce((
    select json_agg(json_build_object(
             'id', id, 'product', product, 'name', name, 'amount', amount, 'status', status,
             'receipt', receipt_url, 'at', created_at, 'paidAt', paid_at) order by created_at desc)
    from public.orders
   where user_id = auth.uid() and created_at > now() - interval '2 years'
  ), '[]'::json);
end $fn$;

revoke all on function public.order_open(text, text)             from public;
revoke all on function public.order_check(text)                  from public;
revoke all on function public.order_paid(text, text, text, text) from public;
revoke all on function public.order_failed(text, text, text)     from public;
revoke all on function public.my_orders()                        from public;
grant execute on function public.order_open(text, text)             to authenticated;
grant execute on function public.order_check(text)                  to authenticated;
grant execute on function public.order_paid(text, text, text, text) to authenticated;
grant execute on function public.order_failed(text, text, text)     to authenticated;
grant execute on function public.my_orders()                        to authenticated;
