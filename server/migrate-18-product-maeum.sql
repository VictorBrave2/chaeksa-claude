-- migrate-18 · 상품 한 줄: 그 사람, 나한테 마음이 있을까요? (2026-09-04 사장님 「10개 싹 다 진행」)
-- migrate-17 을 먼저 돌렸어야 한다(my_orders 가 note 를 내려줘야 사람별 열쇠가 산다). 비밀 없음.
insert into public.products (code, name, amount, active)
values ('maeum', '그 사람, 나한테 마음이 있을까요?', 9900, true)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, active = true;
