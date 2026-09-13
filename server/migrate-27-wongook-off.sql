-- migrate-27 · 원국 정독(wongook) 상품을 내린다 — 2026-09-13 사장님 「오늘 브리핑·책사단의 글·좌장의 원국 해석 다 삭제해」.
-- 화면에서 「좌장이 읽는 원국」 카드를 지웠으므로(app.js v786) 팔면 받을 것이 없는 상품이 된다.
-- active=false 면 결제 목록(api/pay.js)과 서버 결제 확인(schema-8 llm_gate)에서 같이 빠진다. 지우지 않는다 — 산 사람의 주문 기록이 이 code 를 가리킨다.
--
-- Supabase SQL Editor 에서 그대로 실행. 되돌리려면 true 로.

update public.products set active = false where code = 'wongook';

-- 확인
-- select code, name, amount, active from public.products order by sort;
