-- 10-01 사장님 「결제를 너무너무 하고싶게 만드는 신박한 제목」 → 두 사람 상품 이름 「그 사람 사용설명서」(코드 love_pair 그대로).
-- 결제 화면 · 카카오페이 결제창에 이 이름이 나온다. Supabase SQL Editor 에 붙여 넣고 Run. 여러 번 돌려도 된다.
update public.products
   set name  = '그 사람 사용설명서',
       blurb = '태어날 때 봉인된 그 사람의 연애 버릇 — 누가 먼저 움직이는지까지. 두 사람 한 쌍 것입니다.'
 where code = 'love_pair';
