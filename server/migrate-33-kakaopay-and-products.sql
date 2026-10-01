-- migrate-33 · 카카오페이 단건결제 + 파는 상품 셋 (2026-10-01)
--
-- ■ 사장님 결정(10-01) — 돈을 받는 것은 셋, 나머지는 모두 무료
--   taekil     출산택일 보고서                     99,000
--   love_full  「사랑할 때만 나오는 당신」 전체판   9,900  (화면에는 「출시 기념가 9,900원」)
--   love_pair  행동양식 궁합                       19,900  (화면에는 「출시 기념가 19,900원」)
--   그 밖의 옛 상품은 판매를 내린다(행은 지우지 않는다 — 주문 기록이 붙어 있다. 이미 산 분은 그대로다).
--
-- ■ 카카오페이 — 설계 chaeksa-behavior-core/design/kakaopay-10-01.md
--   ready 에서 받은 tid 는 **DB 에만** 둔다(브라우저로 안 내려간다). 승인 · 결제완료 기록은 서버 열쇠(PAY_HOOK_SECRET =
--   app_secret 'pay_hook', migrate-23 이 만든 값)를 가진 api/pay.js 만 할 수 있다.
--   order_pg_get / order_pg_paid / order_pg_failed / order_pg_note / order_pg_canceled 는 anon 에게도 열려 있다 —
--   카카오톡에서 결제하고 로그인 안 된 다른 브라우저로 돌아와도 승인되게(api/pay.js 는 이 다섯을 늘 anon 키로 부른다).
--   열쇠(p_server, 64자 무작위)가 없으면 전부 forbidden 이다. service_role 은 쓰지 않는다.
--   시험 모드(dev 키 · TC CID) 결제는 super 계정(또는 Vercel PAY_TEST_OPEN=1)만 열 수 있다(api/pay.js kopen).
--
-- ■ 순서 (사장님)
--   1) 이 파일 전체를 Supabase → SQL Editor 에 붙여넣고 Run. 비밀값은 들어 있지 않다. 여러 번 돌려도 안전하다.
--   2) 끝. 확인은 https://chaeksa-claude.vercel.app/api/pay 의 products 가 셋인지 보면 된다.
--   (새 열쇠를 만들지 않는다 — migrate-23 의 pay_hook 을 그대로 쓴다. Vercel 에 새로 넣을 값도 없다.)
--
-- ■ 사장님이 따로 돌리는 줄 (필요할 때 한 줄씩. '주문번호' 자리만 바꾼다)
--   · 카카오페이 가맹점 관리자 화면에서 직접 환불했을 때 — 주문을 「환불됨」으로 적는다:
--       update public.orders set status = 'canceled', fail_code = 'REFUND_MANUAL', fail_message = '가맹점 관리자에서 환불' where id = '주문번호' and provider = 'kakao' and status = 'paid';
--   · 돈은 빠졌는데 기록이 안 된 주문(SAVE_FAILED) · 금액이 어긋난 주문 찾기:
--       select id, product, status, amount, fail_code, fail_message, created_at from public.orders where provider = 'kakao' and (fail_code like 'SAVE_FAILED%' or fail_code like 'AMOUNT_MISMATCH%') and status <> 'paid' order by created_at desc;
--     SAVE_FAILED 는 손님이 결제 확인 화면을 새로고침하면 저절로 결제완료로 적힌다. 그래도 안 되면 카카오 관리자
--     화면에서 결제된 것을 확인한 뒤:
--       update public.orders set status = 'paid', pay_mode = 'live', paid_at = now() where id = '주문번호' and provider = 'kakao' and status in ('open', 'failed');

-- ── 1. 상품 ─────────────────────────────────────────────────────
-- 값은 이 표 한 곳에만 있다(docs/17). 화면은 GET /api/pay 로 받아 그린다.
insert into public.products (code, name, amount, blurb, sort, active) values
  ('love_full', '사랑할 때만 나오는 당신 — 전체판', 9900,
   '연애할 때 내가 어떻게 움직이는지 묻는 질문과 그 답이 모두 열립니다. 결제한 카카오 계정의 한 사람 것입니다.', 20, true),
  ('love_pair', '행동양식 궁합', 19900,
   '두 사람이 연애할 때 서로 잘 맞는 행동과 부딪히는 행동을 나란히 보여 드립니다. 결제한 카카오 계정의 두 사람 한 쌍 것입니다.', 30, true)
on conflict (code) do update
  set name = excluded.name, amount = excluded.amount, blurb = excluded.blurb,
      sort = excluded.sort, active = true;

update public.products set amount = 99000, active = true where code = 'taekil';

update public.products set active = false
 where code not in ('taekil', 'love_full', 'love_pair') and active;

-- ── 2. 주문에 결제사 · 거래번호 ─────────────────────────────────────
alter table public.orders add column if not exists provider    text not null default 'toss';   -- 옛 주문은 전부 토스
do $$ begin
  alter table public.orders add constraint orders_provider_chk check (provider in ('toss', 'kakao'));
exception when duplicate_object then null; end $$;
alter table public.orders add column if not exists pg_tid      text;          -- 카카오 tid. 브라우저로 안 내려간다
alter table public.orders add column if not exists pg_aid      text;          -- 카카오 승인 번호
alter table public.orders add column if not exists pg_ready_at timestamptz;   -- ready 시각(기록용 — 이것만으로 주문을 닫지 않는다)
alter table public.orders add column if not exists pay_mode    text;          -- migrate-26 에 있다. 안 돌았을 때를 위해
-- 처음 열어 보신 시각(청약철회 · 환불 때 「열어 보신 것」인지 보는 기록). 비공개 서버가 유료 본문을 실제로 내보낼 때만
-- order_mark_opened(chaeksa-behavior-core/sql-love-paid.sql)로 한 번 적는다. 한 번 적히면 바뀌지 않는다.
alter table public.orders add column if not exists opened_at   timestamptz;
create unique index if not exists orders_pg_tid_uq on public.orders (pg_tid) where pg_tid is not null;

-- ── 3. 주문 열기 — 판매를 내린 상품은 거절한다 ─────────────────────────
-- schema-8 과 같은 몸통이다(금액을 인자로 안 받는다 · active 인 상품만 · 하루 20건). 확실히 하려고 다시 건다.
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

  -- 누구 것을 사는지(note) — 서버가 만든 결제 열쇠 꼴만 받는다. 생일 같은 다른 글이 주문에 적히지 않게.
  --   love_full = 'love_full:' + 32자 · love_pair = 'love_pair:' + 32자 · taekil = 비워 둔다(신청서는 order_intake 로 따로 붙는다).
  if (p.code = 'love_full' and coalesce(p_note, '') !~ '^love_full:[0-9a-f]{32}$')
     or (p.code = 'love_pair' and coalesce(p_note, '') !~ '^love_pair:[0-9a-f]{32}$')
     or (p.code = 'taekil' and btrim(coalesce(p_note, '')) <> '') then
    return json_build_object('ok', false, 'reason', 'bad_request');
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
revoke all on function public.order_open(text, text) from public, anon;
grant execute on function public.order_open(text, text) to authenticated;

-- 토스 실패 기록(schema-8 의 order_failed) — 토스 주문 · 열린 주문만 건드린다. 카카오 주문은 order_pg_failed(서버 열쇠)로만 닫힌다.
-- (api/pay.js 'fail' 도 토스가 꺼져 있으면 not_ready 로 막는다.)
create or replace function public.order_failed(
  p_order text, p_code text default null, p_message text default null)
returns json language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  update public.orders
     set status = 'failed', fail_code = p_code, fail_message = left(coalesce(p_message, ''), 300)
   where id = p_order and user_id = auth.uid() and status = 'open' and coalesce(provider, 'toss') = 'toss';
  return json_build_object('ok', true);
end $fn$;
revoke all on function public.order_failed(text, text, text) from public, anon;
grant execute on function public.order_failed(text, text, text) to authenticated;

-- ── 4. 서버 열쇠 확인 (아래 함수 안에서만 쓴다) ──────────────────────
create or replace function public._pay_hook_ok(p_server text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_server is not null
     and exists (select 1 from public.app_secret where k = 'pay_hook' and v = p_server)
$$;
revoke all on function public._pay_hook_ok(text) from public, anon, authenticated;

-- ── 5. ready 뒤 tid 를 붙인다 — 주문 임자(사용자 JWT) + 서버 열쇠 ──────────
-- 한 주문에 tid 하나(pg_tid is null 일 때만). 열린 주문만.
create or replace function public.order_pg_ready(p_order text, p_provider text, p_tid text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if p_provider is null or p_provider not in ('kakao') or coalesce(p_tid, '') = '' or length(p_tid) > 64 then
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

-- ── 6. 승인에 필요한 것 — 서버 열쇠만 (세션 없이 돌아온 경우도 받는다) ─────
create or replace function public.order_pg_get(p_order text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare o public.orders%rowtype;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into o from public.orders where id = p_order;
  if not found then return json_build_object('ok', false, 'reason', 'no_order'); end if;
  return json_build_object('ok', true, 'status', o.status, 'amount', o.amount, 'name', o.name,
    'product', o.product, 'provider', o.provider, 'tid', o.pg_tid, 'user_id', o.user_id,
    'readyAt', o.pg_ready_at, 'pay_mode', o.pay_mode, 'fail_code', o.fail_code);
end $fn$;

-- 결제완료 — 그 주문의 그 tid 일 때만. 결제 순간에 시험/운영(pay_mode)을 함께 적는다. 두 번 불러도 같다.
-- 실패(failed)로 닫힌 카카오 주문도 받는다 — api/pay.js 가 카카오 주문 조회로 SUCCESS_PAYMENT · 금액 일치를
-- 확인한 뒤에만 부른다(잘못 닫힌 주문 되살리기). 금액 불일치(AMOUNT_MISMATCH…)로 닫은 주문은 되살리지 않는다.
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
   where id = p_order and provider = 'kakao' and pg_tid = p_tid
     and (status in ('open', 'paid')
          or (status = 'failed' and coalesce(fail_code, '') not like 'AMOUNT\_MISMATCH%'))
  returning * into o;
  if o.id is null then return json_build_object('ok', false, 'reason', 'no_order'); end if;
  return json_build_object('ok', true, 'orderId', o.id, 'amount', o.amount, 'name', o.name);
end $fn$;

-- 실패 — 카카오 주문 · 열린 주문만. api/pay.js 는 카카오가 「결제 안 됨」이라고 할 때만 부른다.
create or replace function public.order_pg_failed(p_order text, p_code text, p_message text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  update public.orders
     set status = 'failed', fail_code = left(coalesce(p_code, ''), 60), fail_message = left(coalesce(p_message, ''), 300)
   where id = p_order and provider = 'kakao' and status = 'open';
  return json_build_object('ok', true);
end $fn$;

-- 메모 — 결제완료가 아닌 카카오 주문(open · failed)에 사장님이 찾을 코드를 남긴다. 상태는 안 바꾼다.
--   SAVE_FAILED       카카오 승인은 됐는데 order_pg_paid 가 실패했다(돈은 빠졌다 — 맞춰야 한다)
--   AMOUNT_MISMATCH…  되살리기 경로에서 금액이 어긋났다(order_pg_failed 는 failed 주문을 안 건드려서)
create or replace function public.order_pg_note(p_order text, p_tid text, p_code text, p_message text,
                                                 p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if coalesce(p_tid, '') = '' then return json_build_object('ok', false, 'reason', 'bad_request'); end if;
  update public.orders
     set fail_code = left(coalesce(p_code, ''), 60), fail_message = left(coalesce(p_message, ''), 300)
   where id = p_order and provider = 'kakao' and pg_tid = p_tid and status in ('open', 'failed');
  get diagnostics n = row_count;
  return json_build_object('ok', n = 1);
end $fn$;

-- 환불 — api/pay.js krefund(사장님 super 계정만)가 카카오 cancel 이 된 뒤에만 부른다. 결제완료 → 환불됨.
create or replace function public.order_pg_canceled(p_order text, p_tid text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not public._pay_hook_ok(p_server) then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if coalesce(p_tid, '') = '' then return json_build_object('ok', false, 'reason', 'bad_request'); end if;
  update public.orders
     set status = 'canceled', fail_code = 'REFUND', fail_message = '카카오페이 전액 환불(krefund)'
   where id = p_order and provider = 'kakao' and pg_tid = p_tid and status = 'paid';
  get diagnostics n = row_count;
  if n = 1 then return json_build_object('ok', true); end if;
  return json_build_object('ok', false, 'reason', 'no_order');
end $fn$;

revoke all on function public.order_pg_get(text, text)                      from public;
revoke all on function public.order_pg_paid(text, text, text, text, text, text) from public;
revoke all on function public.order_pg_failed(text, text, text, text)         from public;
revoke all on function public.order_pg_note(text, text, text, text, text)     from public;
revoke all on function public.order_pg_canceled(text, text, text)             from public;
grant execute on function public.order_pg_get(text, text)                      to anon, authenticated;
grant execute on function public.order_pg_paid(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.order_pg_failed(text, text, text, text)         to anon, authenticated;
grant execute on function public.order_pg_note(text, text, text, text, text)     to anon, authenticated;
grant execute on function public.order_pg_canceled(text, text, text)             to anon, authenticated;

-- ── 7. 탈퇴 — migrate-25 의 delete_me 그대로 + 행동양식 궁합 보관(pair_quota) 지우기 ─────────
-- pair_quota 는 비공개 저장소(sql-love-paid.sql)가 만든다. 아직 없으면 건너뛴다.
create or replace function public.delete_me()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  update public.orders set intake = null, intake_at = null, note = null where user_id = uid;
  if to_regclass('public.consults') is not null then          -- migrate-14 전이면 아직 있다
    execute 'delete from public.consults where user_id = $1' using uid;
  end if;
  delete from public.people   where user_id = uid;
  delete from public.profiles where id = uid;
  if to_regclass('public.pair_quota') is not null then        -- 행동양식 궁합의 두 사람 표시 · 카드
    execute 'delete from public.pair_quota where user_id = $1' using uid;
  end if;
  delete from auth.users where id = uid;                       -- orders.user_id 는 migrate-25 로 null 이 된다
end $$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;

-- ── 확인 (Run 결과로 보인다) ──────────────────────────────────────
-- 파는 것 셋이 active 로 보여야 한다.
select code, name, amount, active from public.products where active order by sort;
-- 열쇠 없이 부르면 forbidden 이어야 한다(잠김 확인). 아래 줄만 따로 돌려 본다.
--   select public.order_pg_get('아무거나');
-- 진짜 돈이 들어온 주문만(사장님 확인용 — 따로 돌린다):
--   select id, product, provider, pay_mode, amount, paid_at, intake_at
--     from public.orders where status = 'paid' and pay_mode = 'live'
--    order by paid_at desc;
