-- migrate-22 · 출산택일 99,000원 (2026-09-11 사장님 「출산택일 유료 99000원으로 상품화해」) — migrate-17 뒤에.
--
-- 값은 이 표 한 곳에만 있다(docs/17). 결제 화면(pay.html)·앱 택일 탭·taekil.html 은
-- 전부 이 값을 GET /api/pay 로 받아 그린다. 화면에 따로 적지 않는다 — 두 벌은 반드시 어긋난다.
-- 되돌리려면 amount 만 다시 바꾸면 된다(주문 기록의 금액은 주문 때 값으로 남는다).

-- 설명(blurb)도 바로잡는다. 옛 설명은 「카카오로 드립니다」였는데 카카오 채널은 아직 안 열렸고,
-- 결제 화면·결제 완료 화면은 「메일로 보내드립니다」라고 적는다. 한 상품에 두 말이 있었다.
update public.products
   set amount = 99000,
       name   = '출산택일 보고서',
       blurb  = '후보 기간 전체를 모든 날 모든 시각으로 계산하고, 부모님과 부딪히는 자리를 거른 보고서를 사람이 만들어 메일로 드립니다',
       active = true
 where code = 'taekil';

-- 확인:
-- select code, name, amount, active from public.products where code = 'taekil';
