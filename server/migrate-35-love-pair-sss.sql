-- 10-02 사장님 「제목이 그 사람 사용설명서가 아니라 SSS급 그 사람 사용설명서」 → 상품 이름 바꿈(코드 love_pair 그대로).
-- 결제 화면 · 카카오페이 결제창에 이 이름이 나온다. Supabase SQL Editor 에 붙여 넣고 Run. 여러 번 돌려도 된다.
update public.products
   set name  = 'SSS급 그 사람 사용설명서',
       blurb = '그 사람 생년월일시 하나로 연애 열두 단계마다 그 사람이 어떻게 할지 · 왜 · 나에게 어떻게 비칠지. 그 사람 한 명 것입니다.'
 where code = 'love_pair';
