-- migrate-26 : 유료 LLM 문 — 결제한 주문만 LLM 을 부른다 (2026-09-12)
--
-- ■ 왜 — 사장님 결정(2026-09-12): 「만들어둔 문장표를 무료콘텐츠로 활용하고 LLM 을 유료 콘텐츠에」.
--   지금까지 프록시(api/chat.js)는 로그인과 등급 한도만 봤고, 결제는 브라우저에서만 확인했다.
--   그래서 로그인만 한 무료 계정이 결제 없이 긴 글 호출(story)을 40번 부를 수 있었다.
--   이 파일 뒤로 프록시는 LLM 을 부르기 전에 **이 사람의 결제된(운영) 주문**을 서버에서 확인한다.
--   service_role 은 쓰지 않는다 — 전부 로그인 토큰(auth.uid())으로 도는 security definer 함수다.
--
-- ■ 순서 (사장님)
--   1) 이 파일 전체를 Supabase SQL Editor 에 붙여넣고 Run.
--      더하기와 함수 교체뿐이다 — 지우는 행이 없다. 여러 번 돌려도 안전하다.
--   2) 끝. 확인은 https://chaeksa-claude.vercel.app/api/chat 을 열어 "gateProbe":"ok" 인지 보면 된다.
--      (이 파일을 돌리기 전에는 "missing 404 …" 로 나오고, 그동안 유료 LLM 은 전부 막혀 있다 — 막히는 쪽이 안전하다.)
--   ※ 토스 운영 키(live_)로 바꾸기 **전에** 돌려야 한다. 이 파일 없이 운영 결제가 들어오면 그 주문에 결제 모드가
--     안 적혀 시험 주문으로 보이고, 운영으로 바뀐 뒤에는 LLM 이 안 열린다.
--
-- ■ 무엇이 바뀌나
--   · orders.pay_mode      승인 때 토스 키가 시험(test)인지 운영(live)인지 적는다.
--                          운영 키로 바꾼 뒤에는 운영 주문만 LLM 을 연다. 시험 키로 도는 동안(토스 심사 기간)은
--                          시험 결제 주문도 연다 — 심사하는 쪽이 결제 뒤 글이 나오는지 볼 수 있어야 한다.
--                          다만 시험 카드는 돈이 안 들어 누구나 긁을 수 있으니, 시험 주문으로 여는 것은 모두 합쳐 하루 30번(한 사람 6번)까지.
--   · llm_uses             LLM 을 부를 때마다 한 줄(주문·작업·달·토큰). 원가를 처음으로 잰다.
--   · llm_gate/refund/log  프록시만 부를 수 있다(서버 열쇠 = Vercel PAY_HOOK_SECRET, 이미 들어 있다 — 새로 넣을 것 없음).
--                          주문 하나에 한 달 몇 번까지(작업마다). 되돌린 호출까지 합쳐도 그 두 배까지.
--   · order_mode           api/pay.js 가 승인 직후 부른다(서버 열쇠 PAY_HOOK_SECRET 이 있어야 된다).
--   · ai_usage_limit       무료·손님 등급의 LLM 한도를 0 으로. 옛 프록시가 떠 있어도 무료 호출이 막힌다.
--   · llm_report           사장님(super 계정)만 — 최근 원가 요약.

-- ── 1. 결제 모드 ────────────────────────────────────────────────
alter table public.orders add column if not exists pay_mode text;
do $$ begin
  alter table public.orders add constraint orders_pay_mode_chk check (pay_mode is null or pay_mode in ('test', 'live'));
exception when duplicate_object then null; end $$;

create or replace function public.order_mode(p_order text, p_mode text, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare s text;
begin
  select v into s from public.app_secret where k = 'pay_hook';
  if s is null or p_server is null or p_server <> s then
    return json_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_mode is null or p_mode not in ('test', 'live') then
    return json_build_object('ok', false, 'reason', 'bad_mode');
  end if;
  update public.orders set pay_mode = p_mode
   where id = p_order and user_id = auth.uid() and status = 'paid' and pay_mode is null;
  return json_build_object('ok', true);
end $fn$;

revoke all on function public.order_mode(text, text, text) from public, anon;
grant execute on function public.order_mode(text, text, text) to authenticated;

-- ── 2. LLM 사용 기록 ────────────────────────────────────────────
create table if not exists public.llm_uses (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete set null,   -- 탈퇴해도 줄은 남는다(지워지면 시험 한도가 되살아나고 원가 기록이 사라진다)
  order_id    text,                         -- 연 주문. super 계정은 null
  task        text not null,                -- sheet · story · profile
  product     text not null,
  note        text,                         -- 사람마다 사는 장의 열쇠 (예: maeum:1995-5-15-10-30)
  pay_mode    text,                         -- 연 주문의 결제 모드(test/live). super 계정은 null
  ym          text not null,                -- 'YYYY-MM' (서울) — 주문당 달마다 센다
  counted     boolean not null default true,-- 되돌린 호출(시간초과·잘림·거절)은 false — 횟수에서 뺀다
  created_at  timestamptz not null default now(),
  model       text,
  in_tok      integer,
  out_tok     integer,
  cache_read  integer,
  cache_write integer,
  ms          integer,
  stop        text,
  rkey        uuid not null default gen_random_uuid()  -- 되돌리기·기록 열쇠. llm_gate 가 프록시에만 준다(손님 화면으로 안 나간다)
);
create index if not exists llm_uses_order_idx on public.llm_uses (order_id, ym);
create index if not exists llm_uses_user_idx  on public.llm_uses (user_id, created_at desc);
alter table public.llm_uses enable row level security;   -- 정책 없음 = 클라이언트가 직접 못 읽고 못 쓴다
revoke all on table public.llm_uses from anon, authenticated;

-- ── 3. 문 — 이 사람에게 이 상품의 결제된 운영 주문이 있는가, 이번 달 횟수가 남았는가 ──
-- p_live_only: 프록시가 토스 키 앞머리로 정한다(live_ 면 true).
-- p_server: 서버 열쇠(app_secret 'pay_hook' = Vercel PAY_HOOK_SECRET). 프록시만 부를 수 있게 한다 — 손님이 직접 부르면
-- 시험 한도를 남의 몫까지 태우거나 되돌리기 열쇠를 손에 쥔다(2026-09-12 검토).
create or replace function public.llm_gate(p_task text, p_product text, p_note text default null, p_live_only boolean default true, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare
  v_uid    uuid := auth.uid();
  v_ym     text := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM');
  v_person boolean := coalesce(p_product, '') in ('maeum','gunghap','sok','gyeolhon','ibyeol','jigeum','geunamja','jjak');
  v_note   text := nullif(btrim(coalesce(p_note, '')), '');
  v_live   boolean := coalesce(p_live_only, true);
  v_order  text;
  v_mode   text;
  v_cap    integer;
  v_n      integer;
  v_id     bigint;
  v_key    uuid;
  v_all    integer;
  v_s      text;
begin
  select v into v_s from public.app_secret where k = 'pay_hook';
  if v_s is null or p_server is null or p_server <> v_s then
    return json_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if v_uid is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  -- 어떤 작업이 어떤 상품으로 열리나. 여기 없는 조합은 부르지 못한다.
  if not (   (p_task = 'sheet'   and v_person and v_note is not null)
          or (p_task = 'story'   and p_product in ('inyeon', 'wealth'))
          or (p_task = 'profile' and p_product = 'wongook')) then
    return json_build_object('ok', false, 'reason', 'bad_task');
  end if;
  -- 주문 하나로 한 달에 부를 수 있는 횟수(되돌린 호출은 안 센다)
  v_cap := case p_task when 'sheet' then 3 when 'story' then 4 when 'profile' then 2 else 0 end;

  -- 운영자 확인용 계정은 주문 없이 부른다(기록은 남긴다)
  if public.ai_plan() = 'super' then
    insert into public.llm_uses (user_id, order_id, task, product, note, ym)
    values (v_uid, null, p_task, p_product, v_note, v_ym) returning id, rkey into v_id, v_key;
    return json_build_object('ok', true, 'use', v_id, 'key', v_key, 'super', true);
  end if;

  -- 운영 주문을 먼저 고른다. 모드가 비어 있는 주문(이 파일 전에 결제된 것)은 전부 시험 기간의 것이라 시험으로 본다.
  select id, coalesce(pay_mode, 'test') into v_order, v_mode from public.orders
   where user_id = v_uid and product = p_product and status = 'paid'
     and (not v_person or note = v_note)
     and (v_person or paid_at > now() - interval '366 days')   -- 인연·재물·원국은 1년 열람(app/pay.js paidFor 와 같다)
     and (pay_mode = 'live' or not v_live)
   order by (pay_mode = 'live') desc nulls last, paid_at desc nulls last
   limit 1;
  if v_order is null then
    if v_live and exists (select 1 from public.orders
                           where user_id = v_uid and product = p_product and status = 'paid'
                             and (not v_person or note = v_note)
                             and (v_person or paid_at > now() - interval '366 days')) then
      return json_build_object('ok', false, 'reason', 'test_order');   -- 운영 중인데 시험 결제로만 산 주문
    end if;
    return json_build_object('ok', false, 'reason', 'not_paid');
  end if;

  -- 같은 주문으로 동시에 들어와도 한 번씩 세도록 주문 행을 잠근다
  perform 1 from public.orders where id = v_order for update;
  if v_mode <> 'live' then
    -- 시험 주문으로 여는 것은 모두 합쳐 하루 30번. 주문이 달라도 한 줄로 세도록 한 자물쇠를 건다.
    -- 되돌린 호출도 센다 — 안 세면 일부러 잘리게 해서(시간초과·길이) 한도 밖에서 원가만 태울 수 있다.
    perform pg_advisory_xact_lock(7260126);
    select count(*) into v_n from public.llm_uses
     where pay_mode = 'test' and created_at > now() - interval '1 day';
    if v_n >= 30 then
      return json_build_object('ok', false, 'reason', 'test_busy');
    end if;
    -- 한 사람이 그 30번을 혼자 다 태우지 못하게 — 한 사람 하루 6번
    select count(*) into v_n from public.llm_uses
     where user_id = v_uid and pay_mode = 'test' and created_at > now() - interval '1 day';
    if v_n >= 6 then
      return json_build_object('ok', false, 'reason', 'test_busy');
    end if;
  end if;
  -- 받은 것(counted)은 v_cap 번까지, 되돌린 것까지 합치면 두 배까지 — 되돌리기에 끝이 없으면 일부러 잘리게 해서 끝없이 태운다.
  select count(*) filter (where counted), count(*) into v_n, v_all
    from public.llm_uses where order_id = v_order and ym = v_ym;
  if v_n >= v_cap or v_all >= v_cap * 2 then
    return json_build_object('ok', false, 'reason', 'over_cap', 'cap', v_cap);
  end if;
  insert into public.llm_uses (user_id, order_id, task, product, note, pay_mode, ym)
  values (v_uid, v_order, p_task, p_product, v_note, v_mode, v_ym) returning id, rkey into v_id, v_key;
  return json_build_object('ok', true, 'use', v_id, 'key', v_key, 'left', v_cap - v_n - 1, 'mode', v_mode);
end $fn$;

-- 손님이 받은 게 없으면(시간초과·잘림·거절·실패) 횟수를 되돌린다. 기록은 지우지 않는다 — 원가는 원가다.
-- 열쇠(rkey)가 있어야 된다. 번호만으로 되게 두면 손님이 제 번호를 짐작해(번호는 차례로 붙는다) 직접 불러
-- 횟수를 끝없이 되살린다 — 한 번 결제로 LLM 을 무한히 부르는 길이다. 열쇠는 llm_gate 가 프록시에만 준다.
create or replace function public.llm_refund(p_use bigint, p_key uuid, p_server text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare s text;
begin
  select v into s from public.app_secret where k = 'pay_hook';
  if s is null or p_server is null or p_server <> s then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  update public.llm_uses set counted = false where id = p_use and user_id = auth.uid() and rkey = p_key;
  return json_build_object('ok', true);
end $fn$;

-- 호출마다 토큰·시간·끝난 이유를 적는다 (같은 열쇠 — 손님이 원가 기록을 고쳐 쓰지 못하게)
create or replace function public.llm_log(
  p_use bigint, p_key uuid, p_server text default null, p_model text default null, p_in integer default null, p_out integer default null,
  p_cr integer default null, p_cw integer default null, p_ms integer default null, p_stop text default null)
returns json language plpgsql security definer set search_path = public as $fn$
declare s text;
begin
  select v into s from public.app_secret where k = 'pay_hook';
  if s is null or p_server is null or p_server <> s then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  update public.llm_uses
     set model = left(p_model, 60), in_tok = p_in, out_tok = p_out, cache_read = p_cr, cache_write = p_cw,
         ms = p_ms, stop = left(p_stop, 40)
   where id = p_use and user_id = auth.uid() and rkey = p_key;
  return json_build_object('ok', true);
end $fn$;

-- 사장님(super)만 — 최근 원가 요약. SQL Editor 에서 select public.llm_report(30); 로도 볼 수 있다.
create or replace function public.llm_report(p_days integer default 30)
returns json language plpgsql security definer set search_path = public as $fn$
begin
  if public.ai_plan() <> 'super' then return json_build_object('ok', false, 'reason', 'forbidden'); end if;
  return json_build_object('ok', true, 'rows', coalesce((
    select json_agg(r) from (
      select task, product, model, count(*) as calls, count(*) filter (where counted) as counted,
             sum(in_tok) as in_tok, sum(out_tok) as out_tok, sum(cache_read) as cache_read,
             sum(cache_write) as cache_write, round(avg(ms)) as avg_ms
        from public.llm_uses
       where created_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 366)))
       group by task, product, model
       order by count(*) desc) r), '[]'::json));
end $fn$;

revoke all on function public.llm_gate(text, text, text, boolean, text) from public, anon;
revoke all on function public.llm_refund(bigint, uuid, text) from public, anon;
revoke all on function public.llm_log(bigint, uuid, text, text, integer, integer, integer, integer, integer, text) from public, anon;
revoke all on function public.llm_report(integer) from public, anon;
grant execute on function public.llm_gate(text, text, text, boolean, text) to authenticated;
grant execute on function public.llm_refund(bigint, uuid, text) to authenticated;
grant execute on function public.llm_log(bigint, uuid, text, text, integer, integer, integer, integer, integer, text) to authenticated;
grant execute on function public.llm_report(integer) to authenticated;

-- ── 4. 무료·손님 등급 LLM 한도 0 ─────────────────────────────────
-- 유료 LLM 은 위 llm_gate(주문) 로만 연다. 등급 한도(ai_usage_bump)는 새 프록시가 더는 부르지 않지만,
-- 옛 프록시가 떠 있는 동안에도 무료 호출이 막히게 여기서도 0 으로 둔다. app/usage.js 의 PLANS 와 같은 값이다.
create or replace function public.ai_usage_limit(p_plan text, p_task text)
returns integer language sql immutable as $$
  select case
    when p_plan = 'super' then 100000
    when p_plan = 'member' then
      case p_task when 'brief' then 62 when 'chat' then 100 when 'consult' then 15
                  when 'profile' then 4 when 'compat' then 20 when 'story' then 60 else 0 end
    else 0
    end;
$$;
