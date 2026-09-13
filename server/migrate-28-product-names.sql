-- 2026-09-14 토스 심사 점검 — 사장님 「인연시기·재물시기 삭제, 일운달력 삭제」.
-- 값은 안 바꾼다. 주문 기록이 붙어 있으니 행은 지우지 않고 내린다(active=false). 이미 산 분은 그대로 열린다.
update public.products set active = false where code in ('inyeon', 'wealth', 'month');
-- 확인: select code, name, amount, active from public.products order by sort;
