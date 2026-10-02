-- migrate-36 · 출산택일 자동 보고서 — 보관 표 · 스위치 · 문(함수) (2026-10-02)
--
-- ■ 사장님이 하실 일 (한 번)
--   1) 이 파일 전체를 복사해 Supabase → SQL Editor 에 붙여 넣고 Run. 확인 상자가 뜨면 「Run this query」.
--   2) 맨 아래 결과 한 줄을 본다 — 첫 칸 {"r": "forbidden"}(열쇠 없이는 막힘) · 둘째 칸 {"taekil_auto_release": "0"}(처음 몇 건은 사장님 확인).
--   비밀값은 들어 있지 않다 — 서버 열쇠는 10-01 에 돌린 love_hook_ok(LOVE_HOOK_SECRET)를 그대로 쓴다. Vercel 에 새로 넣을 값도 없다.
--   여러 번 돌려도 안전하다 — 표 · 스위치 값 · 만든 보고서는 있으면 그대로 둔다.
--   먼저 돌아 있어야 하는 것: chaeksa-behavior-core/sql-launch-10-01.sql(love_hook_ok · ai_plan · pair_quota · orders.opened_at) — 10-01 에 돌렸다.
--
-- ■ 무엇을 만드나
--   표 app_flags      스위치 한 줄 taekil_auto_release. '0' = 처음 몇 건은 사장님이 「내보내기」를 눌러야 손님에게 열림(10-01 결정).
--                     '1' = 누락 검사를 통과한 운영 결제 보고서는 바로 열림. 사장님 말이 있을 때만 '1' 로 바꾼다.
--   표 taekil_reports 주문마다 보고서 한 벌(order_id = orders.id). 사장님 목록 「대신 넣기」(네이버폼 신청)는 'M-…' 수기 줄.
--   문(함수)          비공개 서버(서버 열쇠): taekil_take · taekil_save · taekil_release_busy
--                     손님 화면(로그인):     my_taekil · taekil_view
--                     사장님 목록(검수 계정 super): taekil_admin_list · _release · _redo · _intake · _manual · _note · _auto
--   delete_me         탈퇴하면 보고서 줄도 지운다(10-01 몸통 그대로 + 한 줄).
--
-- ■ 왜 orders 가 아니라 새 표인가
--   orders 는 orders_mine 정책(schema-8)으로 손님이 자기 줄 전체를 REST 로 읽는다 — 거기 두면 사장님 확인 전 보고서가 샌다.
--   taekil_reports 는 RLS 를 켜고 정책을 두지 않는다(pair_quota 꼴) — 손님은 읽지도 쓰지도 못하고, 아래 함수로만 닿는다.
--   손님 몫(report)과 속 몫(meta — 엔진판 · 토큰 · 걸린 시간 · 가린 사연)을 나눠 담는다. 손님은 report 만, 열렸을 때만 받는다.
--   orders 에 외래키를 걸지 않는다(수기 줄 때문). 사이트 줄의 짝(이 주문 · 이 임자)은 함수가 지킨다.
--   service_role 은 쓰지 않는다 — 서버는 손님 토큰 + 서버 열쇠(p_server)로만 부른다(10-01 연애 · 궁합과 같은 꼴).
--
-- ■ 상태 — 표의 state 와 화면에 보이는 것
--   표 state  making(만드는 중 또는 아직 안 만듦) · held(검수 대기) · ready(열림) · blocked(막힘 — 빠진 칸이 있어 손님에게 안 나감)
--   손님(my_taekil · taekil_view 의 state)
--     todo       결제됐고 신청서도 있는데 아직 안 만듦(또는 만들다 멈춤) — 화면이 비공개 서버 /api/taekil-report 를 부른다
--     no_intake  결제됐는데 신청서가 아직 이 주문에 안 붙음 — 화면이 기기 초안을 order_intake 로 붙이거나 문의를 안내한다
--     making     만드는 중(6분 안)
--     checking   책사가 한 번 더 확인 중 — held · blocked · 만들 횟수를 다 씀 · 시험 결제(검수 계정이 아닌 사람)
--     ready      열림 — 이때만 보고서 본문(report)을 받는다
--     canceled   환불됨 — 보고서가 닫힌다
--   사장님 목록(taekil_admin_list 의 view): held(검수 대기) · blocked(막힘) · todo · no_intake(결제됐는데 안 만듦) · making · ready(열림) · canceled(환불)
--
-- ■ 처음 열어 보신 때(opened_at — 청약철회 · 환불 기록)
--   주문 임자가 열린(ready) 보고서를 taekil_view 로 처음 띄울 때 taekil_reports.opened_at 과 orders.opened_at 에 한 번 적는다.
--   (order_mark_opened 는 연애 · 궁합 열쇠만 받아서 택일은 여기서 적는다.) 「손님 눈으로 보기」(p_as_customer = true)와
--   검수 계정이 남의 주문을 볼 때는 적지 않는다. 검수 계정이 자기 시험 주문을 열면 적힌다(시험 결제 ⑦ — 다시 만들기가 막히는지 본다).
--
-- ■ 설계서에 없던 것 둘(작게 더함): taekil_reports.cands(권할 곳 수 — 0곳이면 스위치와 상관없이 held, 목록에 보임) ·
--   intake_at(사장님이 신청서를 고친 때 · 수기 줄을 넣은 때 — 읽개가 「지난 날짜」를 그때 기준으로 본다).
--
-- ■ 사장님이 따로 돌리는 줄 (필요할 때 한 줄씩 — 보통은 사장님 목록 화면의 단추로 한다)
--   · 처음 몇 건 확인을 끝내고 바로 열기로 바꿀 때(사장님 말이 있을 때만):
--       update public.app_flags set v = '1', updated_at = now() where k = 'taekil_auto_release';
--   · 다시 처음 몇 건 확인으로:
--       update public.app_flags set v = '0', updated_at = now() where k = 'taekil_auto_release';
--
-- ■ Run 뒤 시험 (메인이 한다)
--   · 손님 토큰으로 GET rest/v1/taekil_reports?select=*  → 막힘(401 · 403) 또는 0행
--   · 손님 토큰으로 GET rest/v1/app_flags?select=*       → 막힘 또는 0행
--   · 일반 계정으로 rpc/taekil_admin_list               → {"ok": false, "reason": "forbidden"}
--   · 손님 토큰으로 rpc/taekil_take (p_server 없이)      → {"r": "forbidden"}

-- ── 0. 주문에 「처음 열어 보신 시각」 칸 — 10-01 에 이미 있다. 순서가 바뀌어도 되게 한 번 더 건다 ──────────
alter table public.orders add column if not exists opened_at timestamptz;

-- ── 1. 스위치 표 ─────────────────────────────────────────────────
create table if not exists public.app_flags (
  k          text primary key,
  v          text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_flags enable row level security;   -- 정책 없음 = 손님은 읽지도 쓰지도 못한다. 아래 함수(security definer)만.
revoke all on table public.app_flags from anon, authenticated;
-- 처음 값 '0'. 다시 돌려도 사장님이 바꾼 값은 그대로 둔다(do nothing).
insert into public.app_flags (k, v) values ('taekil_auto_release', '0') on conflict (k) do nothing;

-- ── 2. 보고서 표 ─────────────────────────────────────────────────
create table if not exists public.taekil_reports (
  order_id    text primary key,                       -- 사이트 줄 = orders.id('ck_taekil_…') · 수기 줄 = 'M-…'
  source      text not null default 'site' check (source in ('site', 'manual')),
  user_id     uuid references auth.users(id) on delete cascade,   -- 사이트 줄의 주문 임자. 수기 줄은 비어 있다
  state       text not null default 'making' check (state in ('making', 'held', 'ready', 'blocked')),
  n           int not null default 0,                 -- 만들기를 잡은 횟수(손님은 2번까지 — 검수 계정은 예외)
  busy_at     timestamptz,                            -- 만드는 중 표시(6분 안이면 다른 기기는 기다린다)
  intake      jsonb,                                  -- 수기 줄의 신청서 · 사장님이 고친 신청서(주문 줄의 원본은 건드리지 않는다)
  intake_at   timestamptz,                            -- 위 신청서를 넣은 때
  report      jsonb,                                  -- 손님 몫(칸 id 가 열쇠 — 비공개 서버 lib/taekil-report.js 꼴)
  meta        jsonb,                                  -- 속 몫(엔진판 · 프롬프트 · 모델 · 토큰 · 걸린 시간 · 누락 검사 문제) — 검수 계정만
  required    text[] not null default '{}',           -- 이 보고서에 꼭 있어야 하는 칸 id
  missing     text[] not null default '{}',           -- 누락 검사에 걸린 것 — 하나라도 있으면 blocked
  cands       int,                                    -- 권할 곳 수(엔진 · 고르기) — 0 이면 스위치와 상관없이 held
  prev_report jsonb,                                  -- 「다시 만들기」 앞 판(전후 나란히)
  owner_note  text,                                   -- 사장님 메모(틀린 곳)
  made_at     timestamptz,
  released_at timestamptz,                            -- 손님에게 열린 때(사장님 「내보내기」 또는 스위치 '1')
  released_by uuid,                                   -- 내보낸 검수 계정(스위치로 열렸으면 비어 있다)
  opened_at   timestamptz,                            -- 손님이 처음 연 때
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint taekil_reports_id_chk check ((source = 'manual') = (order_id like 'M-%'))
);
create index if not exists taekil_reports_user_idx on public.taekil_reports (user_id);
alter table public.taekil_reports enable row level security;   -- 정책 없음(pair_quota 꼴)
revoke all on table public.taekil_reports from anon, authenticated;

-- ── 3. 속 함수 — 아래 문(함수) 안에서만 부른다. 아무도 직접 못 부른다 ─────────────
-- 신청서 원문 — 비공개 서버 원문뽑기와 같은 꼴(감싼 { 원문 | raw | data } 가 있으면 그 안)
create or replace function public._taekil_src(p_intake jsonb)
returns jsonb language sql immutable set search_path = public as $$
  select case when jsonb_typeof(p_intake -> '원문') = 'object' then p_intake -> '원문'
              when jsonb_typeof(p_intake -> 'raw')  = 'object' then p_intake -> 'raw'
              when jsonb_typeof(p_intake -> 'data') = 'object' then p_intake -> 'data'
              else p_intake end
$$;

-- 빈 칸 — 늘 있어야 할 칸 + required 가운데, 그 열쇠가 없거나 body 가 빈 배열이 아닌 칸. 'sec:<칸 id>' (비공개 서버 누락 검사와 같은 이름)
create or replace function public._taekil_missing(p_report jsonb, p_required text[])
returns text[] language sql immutable set search_path = public as $$
  select coalesce(array_agg('sec:' || s.id order by s.id), '{}'::text[])
    from (select distinct u.id
            from unnest(array['readback', 'verdict', 'block', 'method', 'alldays', 'clock', 'close', 'receipt']::text[]
                        || coalesce(p_required, '{}'::text[])) as u(id)
           where u.id ~ '^[a-z][a-z0-9_]{0,39}$') s
   where case when jsonb_typeof(p_report -> s.id -> 'body') = 'array'
              then jsonb_array_length(p_report -> s.id -> 'body') = 0
              else true end
$$;

-- 손님에게 보이는 상태(위 머리 주석 「손님」). p_super = 주문 임자가 검수 계정인가(시험 결제를 인정하나)
create or replace function public._taekil_cstate(p_status text, p_mode text, p_has_intake boolean, p_made boolean,
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

-- 사장님 목록의 나누기(위 머리 주석 「사장님 목록」)
create or replace function public._taekil_aview(p_status text, p_has_intake boolean, p_made boolean, p_state text, p_busy_at timestamptz)
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
create or replace function public._taekil_auto()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select v from public.app_flags where k = 'taekil_auto_release'), '0') = '1'
$$;

-- 이 사이트 주문으로 보고서를 만들어도 되나 — 'ok' 또는 까닭. _pair_order(sql-love-paid) 꼴.
--   출산택일 · 결제완료 · 결제일부터 2년 안 · 본인(검수 계정은 누구 것이든) · 운영 결제(시험 결제는 검수 계정만)
create or replace function public._taekil_order(p_order text)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  sup boolean := public.ai_plan() = 'super';
begin
  select * into o from public.orders where id = p_order and product = 'taekil';
  if not found then return 'not_found'; end if;
  if not sup and o.user_id is distinct from auth.uid() then return 'not_found'; end if;   -- 남의 주문은 있는지도 말하지 않는다
  if o.status <> 'paid' or o.paid_at is null or o.paid_at < now() - interval '2 years' then return 'not_paid'; end if;
  if not (o.pay_mode = 'live' or sup) then return 'not_paid'; end if;   -- 시험 결제(돈이 안 드는 TC0ONETIME)로 공짜 보고서를 못 받게
  return 'ok';
end $$;

-- 사장님 목록 줄 — p_id 가 있으면 그 줄 하나(단추를 누른 뒤 그 줄만 다시 그린다)
create or replace function public._taekil_list(p_id text default null)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'id', z.id, 'source', z.source, 'mode', z.mode,
           'view', public._taekil_aview(z.ostatus, z.intake is not null, z.made, z.state, z.busy_at),
           'state', z.state, 'orderStatus', z.ostatus,
           'paidAt', z.paid_at, 'createdAt', z.created_at, 'at', coalesce(z.paid_at, z.created_at),
           'range', left(s.src ->> 'range', 80), 'place', left(s.src ->> 'place', 40), 'sex', left(s.src ->> 'sex', 10),
           'missingN', coalesce(cardinality(z.missing), 0), 'cands', z.cands, 'n', coalesce(z.n, 0),
           'madeAt', z.made_at, 'releasedAt', z.released_at, 'openedAt', z.opened_at,
           'note', left(z.owner_note, 200), 'hasPrev', z.has_prev, 'intakeEdited', z.edited, 'gone', z.gone)
    from (
      select o.id, 'site'::text as source,
             case when o.pay_mode = 'live' then 'live' else 'test' end as mode,
             o.status as ostatus, o.paid_at, o.created_at,
             coalesce(t.intake, o.intake) as intake,
             (t.report is not null) as made, t.state, t.busy_at, t.n, t.missing, t.cands, t.made_at, t.released_at,
             coalesce(t.opened_at, o.opened_at) as opened_at, t.owner_note,
             (t.prev_report is not null) as has_prev, (t.intake is not null) as edited,
             (o.user_id is null) as gone                                     -- 탈퇴한 손님(신청서는 탈퇴 때 지워졌다)
        from public.orders o
        left join public.taekil_reports t on t.order_id = o.id and t.source = 'site'
       where o.product = 'taekil' and o.status in ('paid', 'canceled') and o.paid_at is not null
         and o.paid_at > now() - interval '2 years'
         and (p_id is null or o.id = p_id)
      union all
      select t.order_id, 'manual'::text, 'manual'::text,
             null::text, null::timestamptz, t.created_at,
             t.intake,
             (t.report is not null), t.state, t.busy_at, t.n, t.missing, t.cands, t.made_at, t.released_at,
             t.opened_at, t.owner_note,
             (t.prev_report is not null), true, false
        from public.taekil_reports t
       where t.source = 'manual' and (p_id is null or t.order_id = p_id)
    ) z
    cross join lateral (select public._taekil_src(z.intake) as src) s
$$;

-- 사장님이 줄 하나를 펼쳤을 때 — 손님이 볼 보고서 · 빠진 칸 · 신청서(원본과 고친 것) · 엔진판 · 만든 시각 · 토큰 · 걸린 시간(meta)
create or replace function public._taekil_admin_row(p_order text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ok', true, 'admin', true,
    'orderId', coalesce(t.order_id, o.id),
    'source', coalesce(t.source, 'site'),
    'mode', case when t.source = 'manual' then 'manual' when o.pay_mode = 'live' then 'live' else 'test' end,
    'view', public._taekil_aview(o.status, coalesce(t.intake, o.intake) is not null, t.report is not null, t.state, t.busy_at),
    'cstate', case when t.source = 'manual'
                   then public._taekil_cstate('paid', 'live', t.intake is not null, t.report is not null, t.state, t.busy_at, 0, true)
                   else public._taekil_cstate(o.status, o.pay_mode, coalesce(t.intake, o.intake) is not null, t.report is not null,
                          t.state, t.busy_at, t.n,
                          coalesce((select u.raw_app_meta_data ->> 'plan' from auth.users u where u.id = o.user_id), '') = 'super')
              end,
    'state', t.state, 'report', t.report, 'prevReport', t.prev_report, 'meta', t.meta,
    'required', coalesce(to_jsonb(t.required), '[]'::jsonb), 'missing', coalesce(to_jsonb(t.missing), '[]'::jsonb),
    'cands', t.cands, 'n', coalesce(t.n, 0), 'busyAt', t.busy_at, 'madeAt', t.made_at,
    'releasedAt', t.released_at, 'releasedBy', t.released_by, 'openedAt', coalesce(t.opened_at, o.opened_at),
    'note', t.owner_note,
    'intake', coalesce(t.intake, o.intake), 'intakeEdited', t.intake is not null,
    'intakeAt', coalesce(t.intake_at, o.intake_at), 'orderIntake', o.intake,
    'order', case when o.id is null then null else jsonb_build_object(
               'status', o.status, 'payMode', o.pay_mode, 'amount', o.amount, 'paidAt', o.paid_at,
               'createdAt', o.created_at, 'intakeAt', o.intake_at, 'openedAt', o.opened_at, 'gone', o.user_id is null) end,
    'createdAt', t.created_at, 'updatedAt', t.updated_at)
    from (select p_order as id) k
    left join public.orders o on o.id = k.id and o.product = 'taekil' and k.id not like 'M-%'
    left join public.taekil_reports t on t.order_id = k.id
   where o.id is not null or t.order_id is not null
$$;

-- ── 4. 비공개 서버 문 — 손님 토큰 + 서버 열쇠(p_server = LOVE_HOOK_SECRET, love_hook_ok 로 확인) ─────────
--   계약은 chaeksa-behavior-core/api/taekil-report.js 머리 주석과 같다.

-- 만들기를 잡는다. r: ok(새로 만든다 — 신청서 · 결제 모드를 함께 준다) · saved(이미 만든 것이 있다 — state)
--   · busy(6분 안에 만들던 중) · used_up(2번 다 씀 — 검수 계정은 예외) · not_paid · not_found · no_intake · login · forbidden
create or replace function public.taekil_take(p_order text, p_server text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
  chk text;
  o public.orders%rowtype;
  r public.taekil_reports%rowtype;
  v_intake jsonb;
  v_at timestamptz;
  v_mode text;
begin
  if not public.love_hook_ok(p_server) then return jsonb_build_object('r', 'forbidden'); end if;
  if uid is null then return jsonb_build_object('r', 'login'); end if;
  if p_order is null or length(p_order) > 100 then return jsonb_build_object('r', 'not_found'); end if;
  sup := public.ai_plan() = 'super';
  delete from public.taekil_reports where created_at < now() - interval '2 years';   -- 보실 수 있는 기간(결제일부터 2년)이 지난 줄을 치운다

  if p_order like 'M-%' then                                    -- 수기 줄(네이버폼 신청) — 검수 계정만
    if not sup then return jsonb_build_object('r', 'not_found'); end if;
    select * into r from public.taekil_reports where order_id = p_order and source = 'manual' for update;
    if not found then return jsonb_build_object('r', 'not_found'); end if;
    v_intake := r.intake;
    v_at := coalesce(r.intake_at, r.created_at);
    v_mode := 'manual';
  else                                                          -- 사이트 주문
    chk := public._taekil_order(p_order);
    if chk <> 'ok' then return jsonb_build_object('r', chk); end if;
    select * into o from public.orders where id = p_order;
    insert into public.taekil_reports (order_id, source, user_id) values (p_order, 'site', o.user_id)
    on conflict (order_id) do nothing;
    select * into r from public.taekil_reports where order_id = p_order and source = 'site' for update;
    if not found then return jsonb_build_object('r', 'not_found'); end if;
    v_intake := coalesce(r.intake, o.intake);                   -- 사장님이 고친 신청서가 있으면 그것
    v_at := case when r.intake is not null then coalesce(r.intake_at, now())
                 else coalesce(o.intake_at, o.paid_at, o.created_at) end;
    v_mode := case when o.pay_mode = 'live' then 'live' else 'test' end;
  end if;

  if r.report is not null then return jsonb_build_object('r', 'saved', 'state', r.state); end if;   -- 다시 만들기는 사장님 taekil_admin_redo 뒤에만
  if v_intake is null or jsonb_typeof(v_intake) <> 'object' then return jsonb_build_object('r', 'no_intake'); end if;
  if r.busy_at is not null and r.busy_at > now() - interval '6 minutes' then return jsonb_build_object('r', 'busy'); end if;
  if r.n >= 2 and not sup then return jsonb_build_object('r', 'used_up'); end if;   -- 처음 한 번 + 끊겼을 때 한 번(토큰을 지킨다)

  update public.taekil_reports
     set n = n + 1, busy_at = now(), state = 'making', updated_at = now()
   where order_id = p_order;
  return jsonb_build_object('r', 'ok', 'id', p_order, 'source', r.source, 'mode', v_mode,
                            'intake', v_intake, 'at', v_at, 'n', r.n + 1);
end $$;

-- 만든 보고서를 보관한다 — report 가 비었을 때만 한 번(다시 만들기는 사장님 taekil_admin_redo 가 비운 뒤).
--   보고서 + meta 600KB 이하. 상태: 빠진 것(p_missing + 여기서 다시 센 빈 칸)이 있으면 blocked,
--   스위치 '1' · 운영 결제 · 사이트 줄 · 권할 곳 1곳 이상이면 ready, 나머지는 held(사장님 「내보내기」를 기다림).
--   { ok:true, state } · { ok:false, reason: saved(+state) · too_big · bad · not_found · login · forbidden }
create or replace function public.taekil_save(p_order text, p_report jsonb, p_meta jsonb, p_required text[], p_missing text[],
                                              p_cands int, p_server text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
  r public.taekil_reports%rowtype;
  v_required text[];
  v_missing text[];
  v_live boolean := false;
  v_state text;
begin
  if not public.love_hook_ok(p_server) then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'login'); end if;
  if p_order is null or length(p_order) > 100 then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if p_report is null or jsonb_typeof(p_report) <> 'object'
     or (p_meta is not null and jsonb_typeof(p_meta) <> 'object') then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  if octet_length(p_report::text) + coalesce(octet_length(p_meta::text), 0) > 600 * 1024 then
    return jsonb_build_object('ok', false, 'reason', 'too_big');
  end if;
  sup := public.ai_plan() = 'super';
  select * into r from public.taekil_reports where order_id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if not sup and (r.source <> 'site' or r.user_id is distinct from uid) then   -- 사이트 줄은 임자 또는 검수 계정 · 수기 줄은 검수 계정만
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if r.report is not null then return jsonb_build_object('ok', false, 'reason', 'saved', 'state', r.state); end if;

  v_required := array(select distinct left(x, 40) from unnest(coalesce(p_required, '{}'::text[])) as x
                       where x ~ '^[a-z][a-z0-9_]{0,39}$');
  v_missing := array(select y from (
                       select distinct left(x, 200) as y
                         from unnest(coalesce(p_missing, '{}'::text[]) || public._taekil_missing(p_report, v_required)) as x
                        where x is not null and x <> '') q
                      order by y limit 300);
  if r.source = 'site' then
    select (o.status = 'paid' and o.pay_mode = 'live') into v_live from public.orders o where o.id = p_order;
  end if;
  v_state := case when cardinality(v_missing) > 0 then 'blocked'
                  when public._taekil_auto() and coalesce(v_live, false) and r.source = 'site' and coalesce(p_cands, 0) >= 1 then 'ready'
                  else 'held' end;

  update public.taekil_reports
     set report = p_report, meta = p_meta, required = v_required, missing = v_missing,
         cands = greatest(coalesce(p_cands, 0), 0), state = v_state, busy_at = null, made_at = now(),
         released_at = case when v_state = 'ready' then now() end, released_by = null, updated_at = now()
   where order_id = p_order;
  return jsonb_build_object('ok', true, 'state', v_state);
end $$;

-- 만들다 실패하면 「만드는 중」을 바로 푼다(6분 기다리지 않게). 보관된 게 없을 때만. 센 횟수(n)는 되돌리지 않는다 —
-- 손님은 두 번까지, 그 뒤는 사장님 목록에서 만든다(AI 토큰을 지킨다).
create or replace function public.taekil_release_busy(p_order text, p_server text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
begin
  if not public.love_hook_ok(p_server) then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'login'); end if;
  sup := public.ai_plan() = 'super';
  update public.taekil_reports
     set busy_at = null, updated_at = now()
   where order_id = p_order and report is null
     and (sup or (source = 'site' and user_id = uid));
  return jsonb_build_object('ok', true);
end $$;

-- ── 5. 손님 문 — 열쇠 없음 · 로그인한 본인(auth.uid()) ─────────────────────
-- 내 출산택일 주문들 — 본문 없이 상태만(위 머리 주석 「손님」). 결제일부터 2년 안 · 결제완료 또는 환불됨.
create or replace function public.my_taekil()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
begin
  if uid is null then return '[]'::jsonb; end if;
  sup := public.ai_plan() = 'super';
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', o.id, 'name', o.name, 'paidAt', o.paid_at,
             'range', left(public._taekil_src(coalesce(t.intake, o.intake)) ->> 'range', 80),
             'state', public._taekil_cstate(o.status, o.pay_mode, coalesce(t.intake, o.intake) is not null,
                                            t.report is not null, t.state, t.busy_at, t.n, sup),
             'openedAt', t.opened_at)
           order by o.paid_at desc)
      from public.orders o
      left join public.taekil_reports t on t.order_id = o.id and t.source = 'site'
     where o.user_id = uid and o.product = 'taekil' and o.status in ('paid', 'canceled')
       and o.paid_at is not null and o.paid_at > now() - interval '2 years'
  ), '[]'::jsonb);
end $$;

-- 보고서 한 벌 보기.
--   손님(또는 검수 계정의 「손님 눈으로 보기」 p_as_customer = true): { ok, orderId, state } — state 가 ready 일 때만 report 를 함께 준다.
--   검수 계정(p_as_customer = false): 사장님 몫 전부(_taekil_admin_row — report · meta · missing · 신청서까지).
--   처음 연 때는 머리 주석 「처음 열어 보신 때」대로 한 번만 적는다.
create or replace function public.taekil_view(p_order text, p_as_customer boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sup boolean;
  cust boolean := coalesce(p_as_customer, false);
  o public.orders%rowtype;
  r public.taekil_reports%rowtype;
  has_r boolean;
  in_time boolean;
  psup boolean;
  cs text;
  v_opened timestamptz;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'login'); end if;
  if p_order is null or length(p_order) > 100 then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  sup := public.ai_plan() = 'super';

  -- 수기 줄(네이버폼 신청) — 검수 계정만. 「손님 눈」 = 메일로 보낼 판(내보내기를 눌렀을 때만 ready)
  if p_order like 'M-%' then
    if not sup then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
    if not cust then
      return coalesce(public._taekil_admin_row(p_order), jsonb_build_object('ok', false, 'reason', 'not_found'));
    end if;
    select * into r from public.taekil_reports where order_id = p_order and source = 'manual';
    if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
    cs := public._taekil_cstate('paid', 'live', r.intake is not null, r.report is not null, r.state, r.busy_at, 0, true);
    if cs <> 'ready' then return jsonb_build_object('ok', true, 'orderId', p_order, 'state', cs); end if;
    return jsonb_build_object('ok', true, 'orderId', p_order, 'state', 'ready', 'report', r.report, 'madeAt', r.made_at);
  end if;

  -- 사이트 주문
  select * into o from public.orders where id = p_order and product = 'taekil';
  if not found or (not sup and o.user_id is distinct from uid) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');   -- 남의 주문은 있는지도 말하지 않는다
  end if;
  select * into r from public.taekil_reports where order_id = p_order and source = 'site';
  has_r := found;
  in_time := o.status = 'paid' and o.paid_at is not null and o.paid_at > now() - interval '2 years';
  -- 주문 임자 눈의 상태 — 임자가 검수 계정이면 시험 결제도 인정한다
  if o.user_id = uid then
    psup := sup;
  else
    psup := coalesce((select u.raw_app_meta_data ->> 'plan' from auth.users u where u.id = o.user_id), '') = 'super';
  end if;
  cs := public._taekil_cstate(o.status, o.pay_mode, coalesce(r.intake, o.intake) is not null,
                              has_r and r.report is not null, r.state, r.busy_at, r.n, psup);

  -- 처음 연 때 — 주문 임자가 · 미리보기가 아닌 길로 · 열린 보고서를 · 볼 수 있는 기간 안에 띄울 때 한 번
  v_opened := r.opened_at;
  if cs = 'ready' and in_time and not cust and o.user_id = uid then
    update public.taekil_reports set opened_at = coalesce(opened_at, now())
     where order_id = p_order returning opened_at into v_opened;
    update public.orders set opened_at = coalesce(opened_at, now()) where id = p_order;
  end if;

  if sup and not cust then
    return coalesce(public._taekil_admin_row(p_order), jsonb_build_object('ok', false, 'reason', 'not_found'));
  end if;

  -- 손님 눈
  if o.status not in ('paid', 'canceled') then return jsonb_build_object('ok', false, 'reason', 'not_paid'); end if;
  if o.status = 'paid' and not in_time then return jsonb_build_object('ok', false, 'reason', 'expired'); end if;
  if cs <> 'ready' then
    return jsonb_build_object('ok', true, 'orderId', p_order, 'state', cs, 'paidAt', o.paid_at);
  end if;
  return jsonb_build_object('ok', true, 'orderId', p_order, 'state', 'ready', 'paidAt', o.paid_at,
                            'report', r.report, 'madeAt', r.made_at, 'openedAt', v_opened);
end $$;

-- ── 6. 사장님 문 — 안에서 ai_plan() = 'super' 를 본다(JWT app_metadata, 위조 불가). 화면 판정은 편의일 뿐 ─────────
-- 목록 — 최근 순. p_filter: held · blocked · todo(no_intake 포함 — 결제됐는데 안 만듦) · making · ready · canceled · no_intake. 비우면 전부.
--   { ok, auto(스위치), released(지금까지 열린 사이트 보고서 수), counts{나누기: 수}, rows[줄] }
create or replace function public.taekil_admin_list(p_filter text default null, p_limit int default 200)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  lim int := least(greatest(coalesce(p_limit, 200), 1), 500);
  v_counts jsonb;
  v_rows jsonb;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select coalesce(jsonb_object_agg(q.v, q.c), '{}'::jsonb) into v_counts
    from (select x ->> 'view' as v, count(*) as c from public._taekil_list(null) as x group by 1) q;
  select coalesce(jsonb_agg(q.x order by (q.x ->> 'at')::timestamptz desc nulls last), '[]'::jsonb) into v_rows
    from (select x from public._taekil_list(null) as x
           where p_filter is null or x ->> 'view' = p_filter or (p_filter = 'todo' and x ->> 'view' = 'no_intake')
           order by (x ->> 'at')::timestamptz desc nulls last
           limit lim) q;
  return jsonb_build_object('ok', true, 'auto', public._taekil_auto(),
    'released', (select count(*) from public.taekil_reports where released_at is not null and source = 'site'),
    'counts', v_counts, 'rows', v_rows);
end $$;

-- 내보내기 — 검수 대기(held)이고 빠진 칸이 0 일 때만. 사이트 줄은 결제완료 주문만(환불된 것은 안 연다).
create or replace function public.taekil_admin_release(p_order text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.taekil_reports%rowtype;
  st text;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into r from public.taekil_reports where order_id = p_order for update;
  if not found or r.report is null then return jsonb_build_object('ok', false, 'reason', 'not_made'); end if;
  if r.state <> 'held' then return jsonb_build_object('ok', false, 'reason', 'not_held', 'state', r.state); end if;
  if cardinality(r.missing) > 0 or cardinality(public._taekil_missing(r.report, r.required)) > 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing');
  end if;
  if r.source = 'site' then
    select o.status into st from public.orders o where o.id = p_order;
    if st is distinct from 'paid' then return jsonb_build_object('ok', false, 'reason', 'not_paid', 'status', st); end if;
  end if;
  update public.taekil_reports
     set state = 'ready', released_at = now(), released_by = auth.uid(), updated_at = now()
   where order_id = p_order;
  return jsonb_build_object('ok', true, 'state', 'ready', 'row', (select x from public._taekil_list(p_order) as x limit 1));
end $$;

-- 다시 만들기 — 손님이 아직 열지 않았을 때만. 지금 판은 prev_report 로 옮겨 전후를 나란히 본다. 그다음 「만들기」(비공개 서버)를 부른다.
create or replace function public.taekil_admin_redo(p_order text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.taekil_reports%rowtype;
  op timestamptz;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into r from public.taekil_reports where order_id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  select o.opened_at into op from public.orders o where o.id = p_order;
  if r.opened_at is not null or op is not null then return jsonb_build_object('ok', false, 'reason', 'opened'); end if;
  if r.busy_at is not null and r.busy_at > now() - interval '6 minutes' then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  if r.report is null then return jsonb_build_object('ok', false, 'reason', 'not_made'); end if;
  update public.taekil_reports
     set prev_report = r.report, report = null, meta = null, required = '{}', missing = '{}', cands = null,
         state = 'making', made_at = null, released_at = null, released_by = null, busy_at = null, updated_at = now()
   where order_id = p_order;
  return jsonb_build_object('ok', true, 'row', (select x from public._taekil_list(p_order) as x limit 1));
end $$;

-- 신청서 고치기 — 손님이 잘못 적었을 때. 고친 값은 taekil_reports.intake 에 넣고 주문 줄(orders.intake)은 건드리지 않는다.
-- 고친 뒤 「다시 만들기」(이미 만들었으면) → 「만들기」.
create or replace function public.taekil_admin_intake(p_order text, p_intake jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  v_n int;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if p_intake is null or jsonb_typeof(p_intake) <> 'object' or length(p_intake::text) > 16000 then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  if p_order like 'M-%' then
    update public.taekil_reports set intake = p_intake, intake_at = now(), updated_at = now()
     where order_id = p_order and source = 'manual';
    get diagnostics v_n = row_count;
    if v_n = 0 then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  else
    select * into o from public.orders where id = p_order and product = 'taekil';
    if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
    insert into public.taekil_reports (order_id, source, user_id) values (p_order, 'site', o.user_id)
    on conflict (order_id) do nothing;
    update public.taekil_reports set intake = p_intake, intake_at = now(), updated_at = now()
     where order_id = p_order;
  end if;
  return jsonb_build_object('ok', true, 'row', (select x from public._taekil_list(p_order) as x limit 1));
end $$;

-- 대신 넣기 — 네이버폼으로 들어온 신청으로 수기 줄을 만든다. 돌려준 id('M-…')로 비공개 서버 { manualId } 를 부르면 같은 엔진 · 같은 누락 검사로 만든다.
create or replace function public.taekil_admin_manual(p_intake jsonb, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_id text;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if p_intake is null or jsonb_typeof(p_intake) <> 'object' or length(p_intake::text) > 16000 then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  v_id := 'M-' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDDHH24MISS')
          || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  insert into public.taekil_reports (order_id, source, user_id, intake, intake_at, owner_note)
  values (v_id, 'manual', null, p_intake, now(), nullif(left(btrim(coalesce(p_note, '')), 4000), ''));
  return jsonb_build_object('ok', true, 'id', v_id, 'row', (select x from public._taekil_list(v_id) as x limit 1));
end $$;

-- 메모 — 틀린 곳을 적어 둔다(메인이 문장 틀 · 프롬프트를 고칠 때 읽는다). 빈 글이면 지운다.
create or replace function public.taekil_admin_note(p_order text, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  v_n int;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if p_order is null or p_order not like 'M-%' then
    select * into o from public.orders where id = p_order and product = 'taekil';
    if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
    insert into public.taekil_reports (order_id, source, user_id) values (p_order, 'site', o.user_id)
    on conflict (order_id) do nothing;
  end if;
  update public.taekil_reports set owner_note = nullif(left(btrim(coalesce(p_note, '')), 4000), ''), updated_at = now()
   where order_id = p_order;
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'row', (select x from public._taekil_list(p_order) as x limit 1));
end $$;

-- 스위치 — p_on 이 true 면 '1'(바로 열기), false 면 '0'(처음 몇 건 확인), 비우면 읽기만.
create or replace function public.taekil_admin_auto(p_on boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  if p_on is not null then
    insert into public.app_flags (k, v) values ('taekil_auto_release', case when p_on then '1' else '0' end)
    on conflict (k) do update set v = excluded.v, updated_at = now();
  end if;
  return jsonb_build_object('ok', true, 'auto', public._taekil_auto(),
    'released', (select count(*) from public.taekil_reports where released_at is not null and source = 'site'));
end $$;

-- ── 7. 탈퇴 — 10-01(sql-launch-10-01 · migrate-33) 몸통 그대로 + 출산택일 보고서 줄 지우기 ─────────
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
  delete from public.taekil_reports where user_id = uid;       -- 출산택일 보고서 · 고친 신청서(10-02)
  delete from auth.users where id = uid;                       -- orders.user_id 는 migrate-25 로 null 이 된다
end $$;

-- ── 8. 권한 — 속 함수는 아무에게도 안 준다. 문은 로그인한 사람에게만(안에서 열쇠 · 본인 · super 를 본다) ─────────
revoke all on function public._taekil_src(jsonb)                                                         from public, anon, authenticated;
revoke all on function public._taekil_missing(jsonb, text[])                                             from public, anon, authenticated;
revoke all on function public._taekil_cstate(text, text, boolean, boolean, text, timestamptz, int, boolean) from public, anon, authenticated;
revoke all on function public._taekil_aview(text, boolean, boolean, text, timestamptz)                   from public, anon, authenticated;
revoke all on function public._taekil_auto()                                                             from public, anon, authenticated;
revoke all on function public._taekil_order(text)                                                        from public, anon, authenticated;
revoke all on function public._taekil_list(text)                                                         from public, anon, authenticated;
revoke all on function public._taekil_admin_row(text)                                                    from public, anon, authenticated;

revoke all on function public.taekil_take(text, text)                                      from public, anon;
revoke all on function public.taekil_save(text, jsonb, jsonb, text[], text[], int, text)  from public, anon;
revoke all on function public.taekil_release_busy(text, text)                              from public, anon;
revoke all on function public.my_taekil()                                                  from public, anon;
revoke all on function public.taekil_view(text, boolean)                                   from public, anon;
revoke all on function public.taekil_admin_list(text, int)                                 from public, anon;
revoke all on function public.taekil_admin_release(text)                                   from public, anon;
revoke all on function public.taekil_admin_redo(text)                                      from public, anon;
revoke all on function public.taekil_admin_intake(text, jsonb)                             from public, anon;
revoke all on function public.taekil_admin_manual(jsonb, text)                             from public, anon;
revoke all on function public.taekil_admin_note(text, text)                                from public, anon;
revoke all on function public.taekil_admin_auto(boolean)                                   from public, anon;
revoke all on function public.delete_me()                                                  from public, anon;

grant execute on function public.taekil_take(text, text)                                     to authenticated;
grant execute on function public.taekil_save(text, jsonb, jsonb, text[], text[], int, text) to authenticated;
grant execute on function public.taekil_release_busy(text, text)                             to authenticated;
grant execute on function public.my_taekil()                                                 to authenticated;
grant execute on function public.taekil_view(text, boolean)                                  to authenticated;
grant execute on function public.taekil_admin_list(text, int)                                to authenticated;
grant execute on function public.taekil_admin_release(text)                                  to authenticated;
grant execute on function public.taekil_admin_redo(text)                                     to authenticated;
grant execute on function public.taekil_admin_intake(text, jsonb)                            to authenticated;
grant execute on function public.taekil_admin_manual(jsonb, text)                            to authenticated;
grant execute on function public.taekil_admin_note(text, text)                               to authenticated;
grant execute on function public.taekil_admin_auto(boolean)                                  to authenticated;
grant execute on function public.delete_me()                                                 to authenticated;

-- 새 함수를 API 가 바로 알아보게(Supabase 가 저절로도 하지만 한 번 더)
notify pgrst, 'reload schema';

-- ── 확인 (Run 결과로 보인다) ──────────────────────────────────────
-- 첫 칸 {"r": "forbidden"} = 열쇠 없이는 막힘 · 둘째 칸 {"taekil_auto_release": "0"} = 처음 몇 건은 사장님 확인
select public.taekil_take('x') as "열쇠 없이 부르면 (forbidden 이어야 한다)",
       (select jsonb_object_agg(k, v) from public.app_flags) as "스위치 (처음 값 0)";
