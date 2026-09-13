-- 2026-09-14 토스 심사 점검 — 상품 이름·설명을 지금 화면과 맞춘다(시진·일운 달력 말 삭제). 값은 안 바꾼다.
-- 「이번 달」은 이야기 30일과 달력 30일을 함께 연다(app.js paidFor('month')).
update public.products set name = '이번 달 30일 — 이야기·달력', blurb = '고른 이야기의 이번 달 30일과 달력이 바로 열립니다. 달이 바뀌면 새로 보는 상품입니다' where code = 'month';
-- 홈에서 갈 길이 없는 상품은 심사에서 「제공 확인 불가」가 된다. 길을 다시 내기 전까지 내린다.
update public.products set active = false where code in ('inyeon', 'wealth');
-- 확인: select code, name, amount, active from public.products order by sort;
