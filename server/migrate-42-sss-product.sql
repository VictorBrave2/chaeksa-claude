-- migrate-42 · 2026-11-03 SSS급 궁합 분석(code sss, 29,700원) — 사장님 11-03 「SSS급 궁합 분석 대중적인감성으로 29700원?」(결정함 117).
--   「나는 뭐해 먹고 살까?」(migrate-39)와 같은 길 — 결제하면 바로. 함수 이름만 ilgyeol_* → sss_*. LLM 없음(계산 결과 JSON 을 보관 · 손님 화면이 그린다).
--
-- ■ 사장님이 하실 일 (한 번)
--   1) 이 파일 전체를 복사해 Supabase → SQL Editor 에 붙여 넣고 Run. 확인 상자가 뜨면 「Run this query」.
--   2) 맨 아래 결과 한 줄 — 첫 칸 sss · 29700 · true · 둘째 칸 {"r": "forbidden"} · 셋째 칸 1.
--   비밀값은 들어 있지 않다 · Vercel 에 새로 넣을 값도 없다. 여러 번 돌려도 안전하다.
--   먼저 돌아 있어야 하는 것: migrate-39(app_flags · love_hook_ok) · migrate-41(gyeolhon).
--
-- ■ 무엇을 만드나
--   1) products 한 줄(값은 여기서만) · 2) order_intake 가 sss 도 받게(taekil · ilgyeol · gyeolhon 그대로)
--   3) 표 sss_reports(RLS 켜고 정책 없음 — 함수로만) · 스위치 app_flags sss_auto_release(처음 '1')
--   4) 문 — 서버(열쇠): sss_take · sss_save · sss_release_busy / 손님: my_sss · sss_view / 사장님(super): sss_admin_list · release · redo · note · auto
--   5) delete_me 가 sss_reports 도 지우게. 보관은 결제일부터 2년.

-- ── 1. 상품 ──
insert into public.products (code, name, amount, blurb, sort, active)
values ('sss', 'SSS급 궁합 분석', 29700,
        '서로 끌리는 이유부터 자꾸 다투는 지점까지. 두 사람의 연애를 24가지 질문으로 읽어요.', 26, true)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, blurb = excluded.blurb, sort = excluded.sort, active = true;

-- ── 2. 신청서 붙이기 — taekil · ilgyeol · gyeolhon · sss ──

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
   where id = p_order and user_id = auth.uid() and product in ('taekil', 'ilgyeol', 'gyeolhon', 'sss') and status in ('open', 'paid');
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

-- ── 3. 스위치 · 풀이 표 ──
alter table public.orders add column if not exists opened_at timestamptz;
create table if not exists public.app_flags (
  k          text primary key,
  v          text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_flags enable row level security;
revoke all on table public.app_flags from anon, authenticated;
insert into public.app_flags (k, v) values ('sss_auto_release', '1') on conflict (k) do nothing;   -- 처음 값 '1' — 결제하면 바로. 다시 돌려도 사장님이 바꾼 값은 그대로

create table if not exists public.sss_reports (
  order_id    text primary key,                       -- orders.id('ck_sss_…')
  user_id     uuid references auth.users(id) on delete cascade,
  state       text not null default 'making' check (state in ('making', 'held', 'ready', 'blocked')),
  n           int not null default 0,                 -- 만들기를 잡은 횟수(손님은 2번까지 — 검수 계정은 예외)
  busy_at     timestamptz,                            -- 만드는 중 표시(6분 안이면 다른 기기는 기다린다)
  report      jsonb,                                  -- 손님 몫 { v, title, 이름{나,그}, 오늘, 결과(lib/sss-gunghap.js 계산 · 칸 24), 만든날 } — 비공개 lib/sss-report.js 꼴
  meta        jsonb,                                  -- 속 몫(판 · 모델 · 토큰 · 걸린 시간 · LLM 글 JSON) — 검수 계정만
  missing     text[] not null default '{}',           -- 검사에 걸린 것 — 하나라도 있으면 blocked
  cands       int,                                    -- 뽑힌 조건 수 — 0 이면 스위치와 상관없이 held
  prev_report jsonb,                                  -- 「다시 만들기」 앞 판
  owner_note  text,
  made_at     timestamptz,
  released_at timestamptz,
  released_by uuid,
  opened_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists sss_reports_user_idx on public.sss_reports (user_id);
alter table public.sss_reports enable row level security;   -- 정책 없음 — 손님은 읽지도 쓰지도 못하고 아래 함수로만 닿는다
revoke all on table public.sss_reports from anon, authenticated;

-- ── 4. 속 함수 — 문(함수) 안에서만 ──
-- 손님에게 보이는 상태. p_super = 주문 임자가 검수 계정인가(시험 결제를 인정하나)
create or replace function public._sss_cstate(p_status text, p_mode text, p_has_intake boolean, p_made boolean,
                                                  p_state text, p_busy_at timestamptz, p_n int, p_super boolean)
returns text language sql stable set search_path = public as $$
  select case
    when p_status = 'canceled' then 'canceled'
    when coalesce(p_made, false) and p_state = 'ready' and (p_mode = 'live' or coalesce(p_super, false)) then 'ready'
    when coalesce(p_made, false) then 'checking'
    when p_busy_at is not null and p_busy_at > now() - interval '6 minutes' then 'making'
    when not (coalesce(p_mode, '') = 'live' or coalesce(p_super, false)) then 'checking'   -- 시험 결제는 검수 계정만
    when not coalesce(p_has_intake, false) then 'no_intake'
    when coalesce(p_n, 0) >= 2 and not coalesce(p_super, false) then 'checking'          -- 만들 횟수를 다 씀 — 사장님 목록에서 만든다
    else 'todo'
  end
$$;

-- 사장님 목록의 나누기
create or replace function public._sss_aview(p_status text, p_has_intake boolean, p_made boolean, p_state text, p_busy_at timestamptz)
returns text language sql stable set search_path = public as $$
  select case
    when p_status = 'canceled' then 'canceled'
    when coalesce(p_made, false) then coalesce(p_state, 'held')
    when p_busy_at is not null and p_busy_at > now() - interval '6 minutes' then 'making'
    when not coalesce(p_has_intake, false) then 'no_intake'
    else 'todo'
  end
$$;

-- 스위치 — '1' 일 때만 true
create or replace function public._sss_auto()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select v from public.app_flags where k = 'sss_auto_release'), '1') = '1'
$$;

-- 주문 임자가 검수 계정인가
create or replace function public._sss_owner_super(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select u.raw_app_meta_data ->> 'plan' from auth.users u where u.id = p_user), '') = 'super'
$$;

-- 이 주문으로 풀이를 만들어도 되나 — 'ok' 또는 까닭. sss · 결제완료 · 결제일부터 2년 안 · 본인(검수 계정은 누구 것이든) · 운영 결제(시험 결제는 검수 계정만)
create or replace function public._sss_order(p_order text)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  sup boolean := public.ai_plan() = 'super';
begin
  select * into o from public.orders where id = p_order and product = 'sss';
  if not found then return 'not_found'; end if;
  if not sup and o.user_id is distinct from auth.uid() then return 'not_found'; end if;   -- 남의 주문은 있는지도 말하지 않는다
  if o.status <> 'paid' or o.paid_at is null or o.paid_at < now() - interval '2 years' then return 'not_paid'; end if;
  if not (o.pay_mode = 'live' or sup) then return 'not_paid'; end if;
  return 'ok';
end $$;

-- 사장님 목록 줄 — p_id 가 있으면 그 줄 하나
create or replace function public._sss_list(p_id text default null)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'id', o.id, 'mode', case when o.pay_mode = 'live' then 'live' else 'test' end,
           'view', public._sss_aview(o.status, o.intake is not null, t.report is not null, t.state, t.busy_at),
           'state', t.state, 'orderStatus', o.status, 'amount', o.amount,
           'paidAt', o.paid_at, 'createdAt', o.created_at, 'at', coalesce(o.paid_at, o.created_at), 'intakeAt', o.intake_at,
           'who', left(coalesce(o.intake -> '나' ->> 'name', '') || ' · ' || coalesce(o.intake -> '그' ->> 'name', ''), 40),
           'intake', o.intake, 'orderNote', o.note,
           'missingN', coalesce(cardinality(t.missing), 0), 'missing', coalesce(to_jsonb(t.missing), '[]'::jsonb), 'cands', t.cands, 'n', coalesce(t.n, 0),
           'madeAt', t.made_at, 'releasedAt', t.released_at, 'openedAt', coalesce(t.opened_at, o.opened_at),
           'note', left(t.owner_note, 200), 'hasPrev', t.prev_report is not null, 'gone', o.user_id is null,
           '결론', t.report -> '결과' -> '칸' -> 'V24' -> '갈래', 'meta', t.meta - '글')
    from public.orders o
    left join public.sss_reports t on t.order_id = o.id
   where o.product = 'sss' and o.status in ('paid', 'canceled') and o.paid_at is not null
     and o.paid_at > now() - interval '2 years'
     and (p_id is null or o.id = p_id)
$$;

-- 사장님이 줄 하나를 펼쳤을 때(sss_view, 검수 계정) — 본문 · meta · 신청서까지
create or replace function public._sss_admin_row(p_order text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ok', true, 'admin', true, 'orderId', o.id,
    'mode', case when o.pay_mode = 'live' then 'live' else 'test' end,
    'view', public._sss_aview(o.status, o.intake is not null, t.report is not null, t.state, t.busy_at),
    'cstate', public._sss_cstate(o.status, o.pay_mode, o.intake is not null, t.report is not null, t.state, t.busy_at, t.n, public._sss_owner_super(o.user_id)),
    'state', t.state, 'report', t.report, 'prevReport', t.prev_report, 'meta', t.meta,
    'missing', coalesce(to_jsonb(t.missing), '[]'::jsonb), 'cands', t.cands, 'n', coalesce(t.n, 0), 'busyAt', t.busy_at, 'madeAt', t.made_at,
    'releasedAt', t.released_at, 'releasedBy', t.released_by, 'openedAt', coalesce(t.opened_at, o.opened_at),
    'note', t.owner_note, 'intake', o.intake, 'intakeAt', o.intake_at,
    'order', jsonb_build_object('status', o.status, 'payMode', o.pay_mode, 'amount', o.amount, 'paidAt', o.paid_at,
                                'createdAt', o.created_at, 'intakeAt', o.intake_at, 'openedAt', o.opened_at, 'gone', o.user_id is null, 'note', o.note),
    'createdAt', t.created_at, 'updatedAt', t.updated_at)
    from public.orders o
    left join public.sss_reports t on t.order_id = o.id
   where o.id = p_order and o.product = 'sss'
$$;

-- ── 5. 비공개 서버 문 — 손님 토큰 + 서버 열쇠(p_server = LOVE_HOOK_SECRET, love_hook_ok 로 확인) ──
--   계약은 chaeksa-behavior-core/lib/sss-report.js 머리 주석과 같다.
create or replace function public.sss_take(p_order text, p_server text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
  chk text;
  o public.orders%rowtype;
  r public.sss_reports%rowtype;
begin
  if not public.love_hook_ok(p_server) then return jsonb_build_object('r', 'forbidden'); end if;
  if uid is null then return jsonb_build_object('r', 'login'); end if;
  if p_order is null or length(p_order) > 100 then return jsonb_build_object('r', 'not_found'); end if;
  sup := public.ai_plan() = 'super';
  delete from public.sss_reports where created_at < now() - interval '2 years';   -- 볼 수 있는 기간이 지난 줄을 치운다

  chk := public._sss_order(p_order);
  if chk <> 'ok' then return jsonb_build_object('r', chk); end if;
  select * into o from public.orders where id = p_order;
  insert into public.sss_reports (order_id, user_id) values (p_order, o.user_id) on conflict (order_id) do nothing;
  select * into r from public.sss_reports where order_id = p_order for update;
  if not found then return jsonb_build_object('r', 'not_found'); end if;

  if r.report is not null then return jsonb_build_object('r', 'saved', 'state', r.state); end if;   -- 다시 만들기는 사장님 sss_admin_redo 뒤에만
  if o.intake is null or jsonb_typeof(o.intake) <> 'object' then return jsonb_build_object('r', 'no_intake'); end if;
  if r.busy_at is not null and r.busy_at > now() - interval '6 minutes' then return jsonb_build_object('r', 'busy'); end if;
  if r.n >= 2 and not sup then return jsonb_build_object('r', 'used_up'); end if;   -- 처음 한 번 + 끊겼을 때 한 번(토큰을 지킨다)

  update public.sss_reports set n = n + 1, busy_at = now(), state = 'making', updated_at = now() where order_id = p_order;
  return jsonb_build_object('r', 'ok', 'id', p_order, 'mode', case when o.pay_mode = 'live' then 'live' else 'test' end,
                            'intake', o.intake, 'at', coalesce(o.intake_at, o.paid_at, o.created_at), 'n', r.n + 1);
end $$;

-- 만든 풀이를 보관한다 — report 가 비었을 때만 한 번. 600KB 이하.
--   상태: 빠진 것(p_missing)이 있으면 blocked, 스위치 '1' 이고 (운영 결제 또는 임자가 검수 계정) 이고 조건 1개 이상이면 ready, 나머지는 held.
create or replace function public.sss_save(p_order text, p_report jsonb, p_meta jsonb, p_missing text[], p_cands int, p_server text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
  r public.sss_reports%rowtype;
  o public.orders%rowtype;
  v_missing text[];
  v_live boolean := false;
  v_state text;
begin
  if not public.love_hook_ok(p_server) then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'login'); end if;
  if p_order is null or length(p_order) > 100 then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if p_report is null or jsonb_typeof(p_report) <> 'object' or jsonb_typeof(p_report -> 'v') <> 'string'
     or (p_meta is not null and jsonb_typeof(p_meta) <> 'object') then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  if octet_length(p_report::text) + coalesce(octet_length(p_meta::text), 0) > 200 * 1024 then
    return jsonb_build_object('ok', false, 'reason', 'too_big');
  end if;
  sup := public.ai_plan() = 'super';
  select * into r from public.sss_reports where order_id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if not sup and r.user_id is distinct from uid then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if r.report is not null then return jsonb_build_object('ok', false, 'reason', 'saved', 'state', r.state); end if;

  v_missing := array(select y from (select distinct left(x, 200) as y from unnest(coalesce(p_missing, '{}'::text[])) as x where x is not null and x <> '') q order by y limit 300);
  select * into o from public.orders where id = p_order;
  v_live := o.status = 'paid' and (o.pay_mode = 'live' or public._sss_owner_super(o.user_id));
  v_state := case when cardinality(v_missing) > 0 then 'blocked'
                  when public._sss_auto() and coalesce(v_live, false) and coalesce(p_cands, 0) >= 1 then 'ready'
                  else 'held' end;

  update public.sss_reports
     set report = p_report, meta = p_meta, missing = v_missing, cands = greatest(coalesce(p_cands, 0), 0),
         state = v_state, busy_at = null, made_at = now(),
         released_at = case when v_state = 'ready' then now() end, released_by = null, updated_at = now()
   where order_id = p_order;
  return jsonb_build_object('ok', true, 'state', v_state);
end $$;

-- 만들다 실패하면 「만드는 중」을 바로 푼다. 센 횟수(n)는 되돌리지 않는다.
create or replace function public.sss_release_busy(p_order text, p_server text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
begin
  if not public.love_hook_ok(p_server) then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'login'); end if;
  sup := public.ai_plan() = 'super';
  update public.sss_reports set busy_at = null, updated_at = now()
   where order_id = p_order and report is null and (sup or user_id = uid);
  return jsonb_build_object('ok', true);
end $$;

-- ── 6. 손님 문 — 열쇠 없음 · 로그인한 본인 ──
-- 내 주문들 — 본문 없이 상태만. 결제일부터 2년 안 · 결제완료 또는 환불됨.
create or replace function public.my_sss()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
begin
  if uid is null then return '[]'::jsonb; end if;
  sup := public.ai_plan() = 'super';
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', o.id, 'name', o.name, 'paidAt', o.paid_at, 'who', left(coalesce(o.intake -> '나' ->> 'name', '') || ' · ' || coalesce(o.intake -> '그' ->> 'name', ''), 40),
             'state', public._sss_cstate(o.status, o.pay_mode, o.intake is not null, t.report is not null, t.state, t.busy_at, t.n, sup),
             'openedAt', t.opened_at)
           order by o.paid_at desc)
      from public.orders o
      left join public.sss_reports t on t.order_id = o.id
     where o.user_id = uid and o.product = 'sss' and o.status in ('paid', 'canceled')
       and o.paid_at is not null and o.paid_at > now() - interval '2 years'
  ), '[]'::jsonb);
end $$;

-- 풀이 한 벌 보기. 손님(또는 검수 계정 「손님 눈으로 보기」): { ok, orderId, state } — ready 일 때만 report. 검수 계정: 사장님 몫 전부.
create or replace function public.sss_view(p_order text, p_as_customer boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
  cust boolean := coalesce(p_as_customer, false);
  o public.orders%rowtype;
  r public.sss_reports%rowtype;
  has_r boolean;
  in_time boolean;
  psup boolean;
  cs text;
  v_opened timestamptz;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'login'); end if;
  if p_order is null or length(p_order) > 100 then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  sup := public.ai_plan() = 'super';
  select * into o from public.orders where id = p_order and product = 'sss';
  if not found or (not sup and o.user_id is distinct from uid) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  select * into r from public.sss_reports where order_id = p_order;
  has_r := found;
  in_time := o.status = 'paid' and o.paid_at is not null and o.paid_at > now() - interval '2 years';
  psup := case when o.user_id = uid then sup else public._sss_owner_super(o.user_id) end;
  cs := public._sss_cstate(o.status, o.pay_mode, o.intake is not null, has_r and r.report is not null, r.state, r.busy_at, r.n, psup);

  v_opened := r.opened_at;
  if cs = 'ready' and in_time and not cust and o.user_id = uid then
    update public.sss_reports set opened_at = coalesce(opened_at, now()) where order_id = p_order returning opened_at into v_opened;
    update public.orders set opened_at = coalesce(opened_at, now()) where id = p_order;
  end if;

  if sup and not cust then
    return coalesce(public._sss_admin_row(p_order), jsonb_build_object('ok', false, 'reason', 'not_found'));
  end if;
  if o.status not in ('paid', 'canceled') then return jsonb_build_object('ok', false, 'reason', 'not_paid'); end if;
  if o.status = 'paid' and not in_time then return jsonb_build_object('ok', false, 'reason', 'expired'); end if;
  if cs <> 'ready' then return jsonb_build_object('ok', true, 'orderId', p_order, 'state', cs, 'paidAt', o.paid_at); end if;
  return jsonb_build_object('ok', true, 'orderId', p_order, 'state', 'ready', 'paidAt', o.paid_at,
                            'report', r.report, 'madeAt', r.made_at, 'openedAt', v_opened);
end $$;

-- ── 7. 사장님 문 — 안에서 ai_plan() = 'super' 를 본다 ──
create or replace function public.sss_admin_list(p_filter text default null, p_limit int default 200)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  lim int := least(greatest(coalesce(p_limit, 200), 1), 500);
  v_counts jsonb;
  v_rows jsonb;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select coalesce(jsonb_object_agg(q.v, q.c), '{}'::jsonb) into v_counts
    from (select x ->> 'view' as v, count(*) as c from public._sss_list(null) as x group by 1) q;
  select coalesce(jsonb_agg(q.x order by (q.x ->> 'at')::timestamptz desc nulls last), '[]'::jsonb) into v_rows
    from (select x from public._sss_list(null) as x
           where p_filter is null or x ->> 'view' = p_filter or (p_filter = 'todo' and x ->> 'view' = 'no_intake')
           order by (x ->> 'at')::timestamptz desc nulls last
           limit lim) q;
  return jsonb_build_object('ok', true, 'auto', public._sss_auto(),
    'released', (select count(*) from public.sss_reports where released_at is not null),
    'counts', v_counts, 'rows', v_rows);
end $$;

-- 내보내기 — 검수 대기(held)이고 걸린 것 0 · 결제완료 주문만
create or replace function public.sss_admin_release(p_order text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.sss_reports%rowtype;
  st text;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into r from public.sss_reports where order_id = p_order for update;
  if not found or r.report is null then return jsonb_build_object('ok', false, 'reason', 'not_made'); end if;
  if r.state <> 'held' then return jsonb_build_object('ok', false, 'reason', 'not_held', 'state', r.state); end if;
  if cardinality(r.missing) > 0 then return jsonb_build_object('ok', false, 'reason', 'missing'); end if;
  select o.status into st from public.orders o where o.id = p_order;
  if st is distinct from 'paid' then return jsonb_build_object('ok', false, 'reason', 'not_paid', 'status', st); end if;
  update public.sss_reports set state = 'ready', released_at = now(), released_by = auth.uid(), updated_at = now() where order_id = p_order;
  return jsonb_build_object('ok', true, 'state', 'ready', 'row', (select x from public._sss_list(p_order) as x limit 1));
end $$;

-- 다시 만들기 — 손님이 아직 열지 않았을 때만. 지금 판은 prev_report 로. 그다음 「만들기」(비공개 서버)를 부른다.
create or replace function public.sss_admin_redo(p_order text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.sss_reports%rowtype;
  op timestamptz;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into r from public.sss_reports where order_id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  select o.opened_at into op from public.orders o where o.id = p_order;
  if r.opened_at is not null or op is not null then return jsonb_build_object('ok', false, 'reason', 'opened'); end if;
  if r.busy_at is not null and r.busy_at > now() - interval '6 minutes' then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  if r.report is null then return jsonb_build_object('ok', false, 'reason', 'not_made'); end if;
  update public.sss_reports
     set prev_report = r.report, report = null, meta = null, missing = '{}', cands = null,
         state = 'making', made_at = null, released_at = null, released_by = null, busy_at = null, updated_at = now()
   where order_id = p_order;
  return jsonb_build_object('ok', true, 'row', (select x from public._sss_list(p_order) as x limit 1));
end $$;

-- 메모 — 틀린 곳을 적어 둔다. 빈 글이면 지운다.
create or replace function public.sss_admin_note(p_order text, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into o from public.orders where id = p_order and product = 'sss';
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  insert into public.sss_reports (order_id, user_id) values (p_order, o.user_id) on conflict (order_id) do nothing;
  update public.sss_reports set owner_note = nullif(left(btrim(coalesce(p_note, '')), 4000), ''), updated_at = now() where order_id = p_order;
  return jsonb_build_object('ok', true, 'row', (select x from public._sss_list(p_order) as x limit 1));
end $$;

-- 스위치 — p_on 이 true 면 '1'(바로 열기), false 면 '0'(사장님 확인 뒤), 비우면 읽기만.
create or replace function public.sss_admin_auto(p_on boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if p_on is not null then
    insert into public.app_flags (k, v) values ('sss_auto_release', case when p_on then '1' else '0' end)
    on conflict (k) do update set v = excluded.v, updated_at = now();
  end if;
  return jsonb_build_object('ok', true, 'auto', public._sss_auto(),
    'released', (select count(*) from public.sss_reports where released_at is not null));
end $$;

-- ── 8. 탈퇴 — migrate-39 몸통 그대로 + SSS 풀이 줄 지우기 ──
create or replace function public.delete_me()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  update public.orders set intake = null, intake_at = null, note = null where user_id = uid;
  if to_regclass('public.consults') is not null then
    execute 'delete from public.consults where user_id = $1' using uid;
  end if;
  delete from public.people   where user_id = uid;
  delete from public.profiles where id = uid;
  if to_regclass('public.pair_quota') is not null then
    execute 'delete from public.pair_quota where user_id = $1' using uid;
  end if;
  if to_regclass('public.taekil_reports') is not null then
    execute 'delete from public.taekil_reports where user_id = $1' using uid;
  end if;
  delete from public.ilgyeol_reports where user_id = uid;      -- 「나는 뭐해 먹고 살까?」 풀이(10-22)
  delete from public.sss_reports where user_id = uid;          -- SSS급 궁합 분석(11-03)
  delete from auth.users where id = uid;
end $$;

-- ── 9. 권한 ──
revoke all on function public._sss_cstate(text, text, boolean, boolean, text, timestamptz, int, boolean) from public, anon, authenticated;
revoke all on function public._sss_aview(text, boolean, boolean, text, timestamptz)                    from public, anon, authenticated;
revoke all on function public._sss_auto()                                                              from public, anon, authenticated;
revoke all on function public._sss_owner_super(uuid)                                                   from public, anon, authenticated;
revoke all on function public._sss_order(text)                                                         from public, anon, authenticated;
revoke all on function public._sss_list(text)                                                          from public, anon, authenticated;
revoke all on function public._sss_admin_row(text)                                                     from public, anon, authenticated;

revoke all on function public.sss_take(text, text)                                from public, anon;
revoke all on function public.sss_save(text, jsonb, jsonb, text[], int, text)    from public, anon;
revoke all on function public.sss_release_busy(text, text)                        from public, anon;
revoke all on function public.my_sss()                                            from public, anon;
revoke all on function public.sss_view(text, boolean)                             from public, anon;
revoke all on function public.sss_admin_list(text, int)                           from public, anon;
revoke all on function public.sss_admin_release(text)                             from public, anon;
revoke all on function public.sss_admin_redo(text)                                from public, anon;
revoke all on function public.sss_admin_note(text, text)                          from public, anon;
revoke all on function public.sss_admin_auto(boolean)                             from public, anon;
revoke all on function public.delete_me()                                             from public, anon;

grant execute on function public.sss_take(text, text)                                to authenticated;
grant execute on function public.sss_save(text, jsonb, jsonb, text[], int, text)    to authenticated;
grant execute on function public.sss_release_busy(text, text)                        to authenticated;
grant execute on function public.my_sss()                                            to authenticated;
grant execute on function public.sss_view(text, boolean)                             to authenticated;
grant execute on function public.sss_admin_list(text, int)                           to authenticated;
grant execute on function public.sss_admin_release(text)                             to authenticated;
grant execute on function public.sss_admin_redo(text)                                to authenticated;
grant execute on function public.sss_admin_note(text, text)                          to authenticated;
grant execute on function public.sss_admin_auto(boolean)                             to authenticated;
grant execute on function public.delete_me()                                             to authenticated;

notify pgrst, 'reload schema';

-- ── 확인 (Run 결과로 보인다) ──
-- 첫 칸 sss · 29700 · true — 상품 한 줄 · 둘째 칸 {"r": "forbidden"} — 열쇠 없이는 막힘 · 셋째 칸 "1" — 결제하면 바로 열림
select (select code || ' · ' || amount || ' · ' || active from public.products where code = 'sss') as "상품(sss · 29700 · true)",
       public.sss_take('x') as "열쇠 없이 부르면(forbidden)",
       (select v from public.app_flags where k = 'sss_auto_release') as "결제하면 바로 열기(1)";
