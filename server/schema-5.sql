-- 책사 schema-5 : AI 사용량을 서버에서 센다
--
-- 왜 필요한가
--   app/usage.js 는 localStorage 로 한도를 지킨다. 저장소를 지우면 그만이고,
--   프록시에 Origin 헤더만 맞춰 직접 호출하면 아예 거치지도 않는다.
--   지금까지의 방어선은 프록시 인스턴스 메모리의 IP 카운터 하나뿐인데,
--   Vercel 서버리스는 콜드 스타트마다 초기화되고 인스턴스마다 따로 센다.
--   즉 실질적으로 막고 있는 것이 없었다.
--
-- 어떻게 막는가
--   프록시가 '사용자의 토큰으로' 아래 함수를 부른다.
--   함수 안에서 auth.uid() 가 나온다는 것 자체가 토큰이 진짜라는 증명이고,
--   같은 호출에서 카운터를 원자적으로 올린다. 인증과 계량이 한 번에 끝난다.
--   → 프록시에 새로 넣을 비밀키가 없다. anon key 는 이미 공개된 값이다.
--
-- 사용자가 스스로 카운터를 되돌릴 수 없는 이유
--   ai_usage 테이블에 RLS 정책을 '하나도' 만들지 않는다(visits 와 같은 방식).
--   정책이 없으면 anon·authenticated 는 테이블에 직접 손댈 수 없다.
--   오직 security definer 함수만 통과하고, 그 함수는 올리기만 한다.

create table if not exists public.ai_usage (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  task       text        not null,
  period     text        not null,           -- 'life' (무료) 또는 'YYYY-MM' (구독)
  n          integer     not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, task, period)
);

alter table public.ai_usage enable row level security;
-- 정책을 만들지 않는다. 이것이 의도한 상태다.

-- ── 한도표 ──────────────────────────────────────────────
-- app/usage.js 의 PLANS 와 같은 값이어야 한다. 한쪽만 고치면 화면과 서버가 어긋난다.
create or replace function public.ai_usage_limit(p_plan text, p_task text)
returns integer language sql immutable as $$
  select case when p_plan = 'member' then
      case p_task when 'brief' then 62 when 'chat' then 100 when 'consult' then 15
                  when 'profile' then 4 when 'compat' then 20 else 0 end
    else
      case p_task when 'brief' then 5 when 'chat' then 5 when 'consult' then 1
                  when 'profile' then 1 when 'compat' then 1 else 0 end
    end;
$$;

-- ── 올린다 ──────────────────────────────────────────────
create or replace function public.ai_usage_bump(p_task text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_plan   text;
  v_period text;
  v_limit  integer;
  v_n      integer;
begin
  -- 토큰이 없거나 가짜면 여기서 끝난다. 프록시의 인증 검사가 곧 이것이다.
  if v_uid is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_task not in ('brief','chat','consult','profile','compat') then
    return json_build_object('ok', false, 'reason', 'bad_task');
  end if;

  -- 구독 여부는 JWT 의 app_metadata 에서 읽는다. Supabase 가 서명하므로 위조할 수 없다.
  v_plan := case when auth.jwt() -> 'app_metadata' ->> 'plan' = 'member' then 'member' else 'free' end;
  -- 무료는 '평생 체험'이라 기간이 없다. 매달 주면 매출 0인 사용자에게 매달 원가가 나간다.
  v_period := case when v_plan = 'member'
                   then to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM')
                   else 'life' end;
  v_limit := public.ai_usage_limit(v_plan, p_task);

  insert into public.ai_usage as u (user_id, task, period, n)
  values (v_uid, p_task, v_period, 1)
  on conflict (user_id, task, period)
    do update set n = u.n + 1, updated_at = now()
  returning u.n into v_n;

  if v_n > v_limit then
    -- 넘어선 만큼은 한도에 붙여 둔다. 그냥 두면 카운터가 계속 자라서
    -- 나중에 한도를 올려도 한참 동안 못 쓰게 된다.
    update public.ai_usage set n = v_limit
     where user_id = v_uid and task = p_task and period = v_period;
    return json_build_object('ok', false, 'reason', 'over_limit',
                             'plan', v_plan, 'task', p_task, 'used', v_limit, 'limit', v_limit);
  end if;

  return json_build_object('ok', true, 'plan', v_plan, 'period', v_period,
                           'task', p_task, 'used', v_n, 'limit', v_limit);
end;
$$;

-- ── 되돌린다 ────────────────────────────────────────────
-- 계량을 먼저 하고 Anthropic 을 부르므로, 그쪽이 실패하면 한 번을 손해 본다.
-- 무료 사용자의 '평생 1회'짜리 상담이 네트워크 사정으로 날아가면 안 된다.
create or replace function public.ai_usage_refund(p_task text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_period text;
begin
  if v_uid is null then return json_build_object('ok', false); end if;
  v_period := case when auth.jwt() -> 'app_metadata' ->> 'plan' = 'member'
                   then to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM') else 'life' end;
  update public.ai_usage set n = greatest(0, n - 1), updated_at = now()
   where user_id = v_uid and task = p_task and period = v_period;
  return json_build_object('ok', true);
end;
$$;

-- ── 지금 얼마나 썼나 (화면이 서버와 눈금을 맞출 때) ──────
create or replace function public.ai_usage_state()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan text;
  v_period text;
begin
  if v_uid is null then return json_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  v_plan := case when auth.jwt() -> 'app_metadata' ->> 'plan' = 'member' then 'member' else 'free' end;
  v_period := case when v_plan = 'member'
                   then to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM') else 'life' end;
  return json_build_object('ok', true, 'plan', v_plan, 'period', v_period,
    'used', coalesce((select json_object_agg(task, n) from public.ai_usage
                       where user_id = v_uid and period = v_period), '{}'::json));
end;
$$;

-- 실행 권한은 로그인한 사용자에게만. 익명은 부를 수 없다.
revoke all on function public.ai_usage_bump(text)   from public, anon;
revoke all on function public.ai_usage_refund(text) from public, anon;
revoke all on function public.ai_usage_state()      from public, anon;
grant execute on function public.ai_usage_bump(text)   to authenticated;
grant execute on function public.ai_usage_refund(text) to authenticated;
grant execute on function public.ai_usage_state()      to authenticated;

-- 확인
--   select public.ai_usage_state();                 -- 로그인 상태에서 실행
--   익명 키로 아래를 실행하면 권한 없음이 나와야 정상이다.
--   curl -X POST "$URL/rest/v1/rpc/ai_usage_bump" -H "apikey: $ANON" \
--        -H 'content-type: application/json' -d '{"p_task":"chat"}'
