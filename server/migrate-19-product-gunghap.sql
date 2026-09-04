-- migrate-19 · 상품 한 줄: 우리 둘, 잘 맞아요? (2026-09-04) — migrate-17 뒤에. 비밀 없음.
insert into public.products (code, name, amount, active)
values ('gunghap', '우리 둘, 잘 맞아요?', 9900, true)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, active = true;
