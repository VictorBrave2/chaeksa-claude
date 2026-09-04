-- migrate-17 · my_orders 가 note 를 함께 돌려준다 (2026-09-04 사장님 「개별로 받아야지」)
--
-- 「이 남자, 나한테 돈을 쓸까요?」는 한 남자에 한 번 판다. 앱은 주문을 열 때 note 에
-- 'geunamja:<그 남자 생년월일시>' 를 적어 두고, 열 때는 그 note 가 같은 paid 주문만 인정한다.
-- 그러려면 my_orders 가 note 를 내려줘야 한다. 함수 본문만 바꾼다 — 되돌리려면 schema-8 의 my_orders 로 다시 만들면 된다.
-- 비밀은 없다. Supabase SQL 편집기에서 그대로 실행.

create or replace function public.my_orders()
returns json language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then return '[]'::json; end if;
  return coalesce((
    select json_agg(json_build_object(
             'id', id, 'product', product, 'name', name, 'amount', amount, 'status', status,
             'receipt', receipt_url, 'at', created_at, 'paidAt', paid_at, 'note', note) order by created_at desc)
    from public.orders
   where user_id = auth.uid() and created_at > now() - interval '2 years'
  ), '[]'::json);
end $fn$;

-- 상품 한 줄 (아직 없으면). 값은 여기서만 정한다 — 앱은 서버 표를 읽는다.
insert into public.products (code, name, amount, active)
values ('geunamja', '이 남자, 나한테 돈을 쓸까요?', 9900, true)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, active = true;
