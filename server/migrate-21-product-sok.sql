-- migrate-21 · 상품 속궁합 (2026-09-05, 제31조) — migrate-17 뒤에.
insert into public.products (code, name, amount, active) values
  ('sok', '우리 둘, 속궁합은요?', 9900, true)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, active = true;
