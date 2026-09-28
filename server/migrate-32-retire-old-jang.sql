-- 2026-09-28 사장님 「상품도 최신 동기화 해야지, 우리가 판매하는 게 9900원 옛날 상품이 아니잖아」
-- 옛 9,900원 장 여덟(09-25 화면 교통정리로 화면이 없어진 상품)을 결제 페이지에서 내린다.
-- 지우는 행 없음 — active 만 끈다. 이미 결제한 주문 기록은 그대로 남는다. 두 번 돌려도 안전.
-- 돌리는 곳: Supabase → SQL Editor. 확인: https://chaeksa-claude.vercel.app/api/pay 의 products 에 taekil 만 남는다.
update public.products
   set active = false
 where code in ('geunamja', 'maeum', 'gunghap', 'sok', 'gyeolhon', 'ibyeol', 'jigeum', 'jjak');
