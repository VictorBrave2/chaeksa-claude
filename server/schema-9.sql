-- 책사 schema-9 : 슈퍼계정 (plan = 'super')
--
-- 왜 만들었나 — 유료 수준 콘텐츠를 운영자가 직접 확인할 자리가 없었다.
-- AI 한도는 서버(ai_usage_bump)가 JWT 의 app_metadata.plan 으로 강제하므로,
-- 운영자라고 해도 등급 없이는 무료 한도(평생 5회)에 그대로 걸린다.
--
-- 왜 app_metadata 인가 — Supabase 가 서명해서 JWT 에 실어 주는 값이라 위조가 안 된다.
-- user_metadata 는 사용자가 스스로 고칠 수 있으므로 등급을 거기 두면 뚫린다.
-- localStorage 플래그 따위는 논외다 — 지우고 쓰는 게 자유라 아무나 켠다.
--
-- 켜는 법 — service_role 키는 어디에도 두지 않기로 했으므로(api/chat.js 주석),
-- SQL Editor(postgres 권한)에서 직접 켠다. 맨 아래 '켜기' 절 참고.

-- ── 한도표: super 는 사실상 무제한 ─────────────────────────────
-- app/usage.js 의 PLANS 와 같은 값이어야 한다. 한쪽만 고치면 화면과 서버가 어긋난다.
create or replace function public.ai_usage_limit(p_plan text, p_task text)
returns integer language sql immutable as $$
  select case
    when p_plan = 'super' then 100000
    when p_plan = 'member' then
      case p_task when 'brief' then 62 when 'chat' then 100 when 'consult' then 15
                  when 'profile' then 4 when 'compat' then 20 when 'story' then 60 else 0 end
    else
      -- story 는 결제 콘텐츠의 서술이라 무료에도 여유를 둔다(캐시가 있어 실사용은 상품당 몇 번).
      case p_task when 'brief' then 5 when 'chat' then 5 when 'consult' then 1
                  when 'profile' then 1 when 'compat' then 1 when 'story' then 24 else 0 end
    end;
$$;

-- ── 등급 판독을 한 곳으로 모은다 ────────────────────────────────
-- schema-5 는 'member' 냐 아니냐 두 갈래만 봤다. 등급이 셋이 된 김에
-- 판독을 함수 하나로 모은다 — bump·refund·state 세 군데에 흩어 두면
-- 다음 등급을 붙일 때 반드시 한 군데를 빼먹는다.
create or replace function public.ai_plan()
returns text language sql stable as $$
  select case when auth.jwt() -> 'app_metadata' ->> 'plan' in ('member', 'super')
              then auth.jwt() -> 'app_metadata' ->> 'plan'
              else 'free' end;
$$;

create or replace function public.ai_period(p_plan text)
returns text language sql stable as $$
  -- member 만 달마다 초기화. free 는 평생 체험, super 는 셀 이유가 없다.
  select case when p_plan = 'member'
              then to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM')
              else 'life' end;
$$;

-- ── 올린다 (schema-5 의 것을 판독 함수 위에 다시 세운다) ─────────
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
  if v_uid is null then
    return json_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_task not in ('brief','chat','consult','profile','compat','story') then
    return json_build_object('ok', false, 'reason', 'bad_task');
  end if;

  v_plan   := public.ai_plan();
  v_period := public.ai_period(v_plan);
  v_limit  := public.ai_usage_limit(v_plan, p_task);

  insert into public.ai_usage as u (user_id, task, period, n)
  values (v_uid, p_task, v_period, 1)
  on conflict (user_id, task, period)
    do update set n = u.n + 1, updated_at = now()
  returning u.n into v_n;

  if v_n > v_limit then
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
  v_period := public.ai_period(public.ai_plan());
  update public.ai_usage set n = greatest(0, n - 1), updated_at = now()
   where user_id = v_uid and task = p_task and period = v_period;
  return json_build_object('ok', true);
end;
$$;

-- ── 지금 얼마나 썼나 ─────────────────────────────────────
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
  v_plan   := public.ai_plan();
  v_period := public.ai_period(v_plan);
  return json_build_object('ok', true, 'plan', v_plan, 'period', v_period,
    'used', coalesce((select json_object_agg(task, n) from public.ai_usage
                       where user_id = v_uid and period = v_period), '{}'::json));
end;
$$;

-- ai_plan / ai_period 는 auth.jwt() 만 읽는다 — 남의 것을 못 본다. 실행 권한만 정리.
revoke all on function public.ai_plan()          from public, anon;
revoke all on function public.ai_period(text)    from public, anon;
grant execute on function public.ai_plan()       to authenticated;
grant execute on function public.ai_period(text) to authenticated;

-- ════════════════════════════════════════════════════════════════
-- 켜기 — SQL Editor 에서 실행. 두 단계다.
--
-- 1) 내 계정을 찾는다 (카카오 로그인이라 이메일이 카카오 계정 것일 수 있다):
--
--    select id, email, raw_app_meta_data from auth.users order by created_at;
--
-- 2) 그 계정에 super 를 단다 (이메일이 맞으면 이대로, 아니면 where 를 id 로):
--
--    update auth.users
--       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--                               || '{"plan":"super"}'::jsonb
--     where email = 'b01099991263@gmail.com';
--
-- ⚠ JWT 는 발급될 때의 값을 담는다. 켠 뒤에는 **로그아웃했다가 다시 로그인**해야
--   새 등급이 실린 토큰을 받는다 (안 하면 최장 1시간 뒤 토큰 갱신 때 반영).
--
-- 끄기:
--    update auth.users
--       set raw_app_meta_data = raw_app_meta_data - 'plan'
--     where email = 'b01099991263@gmail.com';
-- ════════════════════════════════════════════════════════════════
