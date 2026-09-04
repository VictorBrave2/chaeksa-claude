-- migrate-20 · 상품 넷: 결혼 · 이별 · 지금 · 짝 (2026-09-04 밤) — migrate-17 뒤에. 비밀 없음.
insert into public.products (code, name, amount, active) values
  ('gyeolhon', '그 사람, 결혼 생각 있을까요?', 9900, true),
  ('ibyeol',   '헤어질까요, 계속 갈까요?',   9900, true),
  ('jigeum',   '그 사람 지금 무슨 생각해요?', 9900, true),
  ('jjak',     '내 짝은 언제 와요?',         9900, true)
on conflict (code) do update set name = excluded.name, amount = excluded.amount, active = true;
