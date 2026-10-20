-- migrate-38 · 2026-10-20 사장님 결제 알림(사장님 「출산택일 결제가 되면 우리가 알 수 있나?」 → 「ㄱㄱ」)
--
-- 결제가 승인되면(api/pay.js kconfirm · nconfirm) 사장님 휴대폰으로 웹 푸시 알림 하나를 보낸다.
-- 알림을 받을 휴대폰(웹 푸시 구독)은 app_flags 한 줄(k = 'owner_push_subs', v = JSON 배열, 최대 3대)에 둔다 — 새 표 없음.
--   owner_alert_sub(p_sub, p_clear)  사장님(super) 토큰으로만. 이 기기를 맨 앞에 넣는다(같은 주소는 하나로). p_clear 면 다 지우고 시작.
--   owner_alert_list(p_server)       결제 서버 열쇠(_pay_hook_ok)로만. 구독 목록을 돌려준다.
-- 손님은 app_flags 를 읽지도 쓰지도 못한다(migrate-36 — RLS 정책 없음 · revoke).
-- 다시 돌려도 된다(create or replace).

create or replace function public.owner_alert_sub(p_sub text default null, p_clear boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  cur jsonb;
  s   jsonb;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  cur := coalesce((select v::jsonb from public.app_flags where k = 'owner_push_subs'), '[]'::jsonb);
  if p_clear then cur := '[]'::jsonb; end if;
  if p_sub is not null then
    begin
      s := p_sub::jsonb;
    exception when others then
      return jsonb_build_object('ok', false, 'reason', 'bad');
    end;
    if coalesce(s->>'endpoint', '') !~ '^https://' or length(p_sub) > 2000 then
      return jsonb_build_object('ok', false, 'reason', 'bad');
    end if;
    cur := jsonb_build_array(jsonb_build_object('endpoint', s->>'endpoint', 'at', now()))
        || coalesce((select jsonb_agg(x) from jsonb_array_elements(cur) as x where x->>'endpoint' <> s->>'endpoint'), '[]'::jsonb);
    cur := coalesce((select jsonb_agg(x) from (select x from jsonb_array_elements(cur) with ordinality as t(x, i) where i <= 3) q), '[]'::jsonb);
  end if;
  if p_sub is not null or p_clear then
    insert into public.app_flags (k, v) values ('owner_push_subs', cur::text)
    on conflict (k) do update set v = excluded.v, updated_at = now();
  end if;
  return jsonb_build_object('ok', true, 'count', jsonb_array_length(cur));
end $$;

create or replace function public.owner_alert_list(p_server text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._pay_hook_ok(p_server) then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  return jsonb_build_object('ok', true,
    'subs', coalesce((select v::jsonb from public.app_flags where k = 'owner_push_subs'), '[]'::jsonb));
end $$;

revoke all on function public.owner_alert_sub(text, boolean) from public, anon;
grant execute on function public.owner_alert_sub(text, boolean) to authenticated;
revoke all on function public.owner_alert_list(text) from public;
grant execute on function public.owner_alert_list(text) to anon, authenticated;

-- 확인(사장님이 Run 한 뒤):
--   select public.owner_alert_list(null);   → {"ok": false, "reason": "forbidden"} 이면 맞다(열쇠 없이는 못 읽음)
