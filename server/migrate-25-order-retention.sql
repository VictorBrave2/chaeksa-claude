-- migrate-25 · 거래 기록은 법대로 남기고, 신청서는 덮어쓰지 않는다 (2026-09-11)
--
-- ■ 왜 (2026-09-11 신청 페이지 검토에서 확인된 두 가지)
--   1) 탈퇴(delete_me)하면 auth.users 가 지워지고, orders 가 on delete cascade 라 결제 기록까지 통째로 사라졌다.
--      전자상거래법(제6조·시행령 제6조)은 계약·청약철회·대금결제·재화 공급 기록 5년, 소비자 불만·분쟁 처리 기록 3년
--      보존을 요구한다. → 주문 줄은 남기되 사람과의 연결(user_id)은 끊고, 신청서(intake)·메모(note)는 지운다.
--   2) order_intake 가 늘 덮어써서, 다른 기기에서 빈 양식을 보내면 앞서 적은 신청서가 지워질 수 있었다.
--      → 이미 신청서가 붙은 주문에는 'already' 로 답하고 덮어쓰지 않는다. 고칠 것은 메일로 받는다(화면이 그렇게 안내한다).
--
-- ■ 순서: 이 파일 전체를 Supabase SQL Editor 에서 Run. 비밀 없음. 여러 번 돌려도 안전하다.
--   (「destructive operation」 경고가 뜨면 옛 제약을 바꾸는 줄 때문이다 — Run query)

-- ── 1. 주문과 계정의 연결: 지우지 않고 끊는다 ──────────────────────
alter table public.orders alter column user_id drop not null;
alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- ── 2. 탈퇴: 신청서·메모를 먼저 지우고 계정을 지운다(거래 기록 줄은 남는다) ─────
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
  delete from auth.users where id = uid;                       -- orders.user_id 는 위 1 로 null 이 된다
end $$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;

-- ── 3. 신청서는 한 주문에 한 번만 붙는다 ────────────────────────────
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
   where id = p_order and user_id = auth.uid() and product = 'taekil' and status in ('open', 'paid');
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

-- 확인 — 'n' 이면 탈퇴해도 주문 줄은 남는다(set null)
select conname, confdeltype from pg_constraint where conname = 'orders_user_id_fkey';
