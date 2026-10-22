-- migrate-40 · 2026-10-22 「나는 뭐해 먹고 살까?」 — 검수 계정 자기 주문은 열어 본 뒤에도 「다시 만들기」 허용
--
-- ■ 사장님이 하실 일 (한 번)
--   이 파일 전체를 복사해 Supabase → SQL Editor 에 붙여 넣고 Run. 결과 한 칸 {"ok": false, "reason": "forbidden"} 이면 됩니다(로그인 없이는 막힘).
--   여러 번 돌려도 안전합니다.
--
-- ■ 왜
--   풀이 틀이 쉬운 판(v0.2)으로 바뀌어, 사장님이 10-22 시험 결제로 받아 이미 열어 본 풀이도 새 판으로 다시 보시려면 「다시 만들기」가 필요합니다.
--   손님 주문은 그대로(손님이 열어 본 뒤에는 다시 만들지 않음 — 청약철회 기준). 주문 임자가 검수 계정(super)일 때만 예외입니다.

create or replace function public.ilgyeol_admin_redo(p_order text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.ilgyeol_reports%rowtype;
  op timestamptz;
  own_super boolean;
begin
  if public.ai_plan() is distinct from 'super' then return jsonb_build_object('ok', false, 'reason', 'forbidden'); end if;
  select * into r from public.ilgyeol_reports where order_id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  select o.opened_at into op from public.orders o where o.id = p_order;
  own_super := public._ilgyeol_owner_super(r.user_id);   -- 주문 임자가 검수 계정이면(시험 결제) 열어 봤어도 다시 만든다
  if (r.opened_at is not null or op is not null) and not own_super then return jsonb_build_object('ok', false, 'reason', 'opened'); end if;
  if r.busy_at is not null and r.busy_at > now() - interval '6 minutes' then return jsonb_build_object('ok', false, 'reason', 'busy'); end if;
  if r.report is null then return jsonb_build_object('ok', false, 'reason', 'not_made'); end if;
  update public.ilgyeol_reports
     set prev_report = r.report, report = null, meta = null, missing = '{}', cands = null,
         state = 'making', made_at = null, released_at = null, released_by = null, busy_at = null,
         opened_at = case when own_super then null else opened_at end, updated_at = now()
   where order_id = p_order;
  if own_super then update public.orders set opened_at = null where id = p_order; end if;   -- 검수 계정 자기 주문 — 처음 연 때도 되돌린다
  return jsonb_build_object('ok', true, 'row', (select x from public._ilgyeol_list(p_order) as x limit 1));
end $$;
revoke all on function public.ilgyeol_admin_redo(text) from public, anon;
grant execute on function public.ilgyeol_admin_redo(text) to authenticated;
notify pgrst, 'reload schema';

select public.ilgyeol_admin_redo('x') as "로그인 없이 부르면(forbidden)";
