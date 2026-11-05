-- migrate-43 · 상품 이름을 장부(app/yaksok.js 상품이름)와 같게 (2026-11-05 상세점검 docs/140 · 결정함 127)
--
-- 홈 · 소개 · 신청서는 장부 이름인데 카카오페이 결제창 · 영수증 · 결제 완료 쪽은 이 표의 name 을 쓴다 — 한 상품이 두 이름으로 보였다.
-- 출산택일(taekil)은 이미 같다. 지우는 행 없음. 두 번 돌려도 안전.

update public.products set name = '연애할 때의 나'       where code = 'love_full';
update public.products set name = '연애할 때의 그 사람'  where code = 'love_pair';
update public.products set name = '결혼 전 궁합 점검'    where code = 'gyeolhon';
update public.products set name = '내게 맞는 일과 돈'    where code = 'ilgyeol';

-- 확인
--   select code, name, amount from public.products order by code;
