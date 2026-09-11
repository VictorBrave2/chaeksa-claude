-- migrate-24 · 9,900원 여덟 상품의 한 줄 설명 (2026-09-11) — 선택. 비밀 없음. 여러 번 돌려도 안전하다.
--
-- 결제 화면에서 이 여덟 장은 제목과 값만 있고 설명 칸이 비어 있었다(products.blurb 가 NULL —
-- migrate-18~21 이 blurb 없이 넣었다). 토스 심사하는 사람도, 손님도 「이걸 사면 무엇이 열리는지」를
-- 한 줄로 봐야 한다. 홈 표지의 부제(app.js 유료 목록)와 같은 말로 채운다. 값(amount)은 건드리지 않는다.
-- 「한 사람에 한 번」 — 두 사람 장은 그 사람(생년월일시)마다 따로 산다(2026-09-04 사장님 「개별로 받아야지」).
-- 내 짝(jjak)은 나에 대한 장이라 한 번이면 된다.

update public.products set blurb = '그래서 나한테 좋은 사람인지까지 봅니다. 비밀 열 가지 중 셋은 무료, 결제하면 나머지 일곱이 바로 열립니다 — 한 사람에 한 번' where code = 'maeum';
update public.products set blurb = '그래서 이 사람이랑 가도 되는지까지 봅니다. 비밀 열 가지 중 셋은 무료, 결제하면 나머지 일곱이 바로 열립니다 — 한 사람에 한 번' where code = 'gunghap';
update public.products set blurb = '누가 더 뜨겁고 정이 어디로 가는지까지 봅니다. 비밀 열 가지 중 셋은 무료, 결제하면 나머지 일곱이 바로 열립니다 — 한 사람에 한 번' where code = 'sok';
update public.products set blurb = '그래서 이 사람과 결혼해도 되는지까지 봅니다. 비밀 열 가지 중 셋은 무료, 결제하면 나머지 일곱이 바로 열립니다 — 한 사람에 한 번' where code = 'gyeolhon';
update public.products set blurb = '그래서 어떻게 하면 되는지까지 봅니다. 비밀 열 가지 중 셋은 무료, 결제하면 나머지 일곱이 바로 열립니다 — 한 사람에 한 번' where code = 'ibyeol';
update public.products set blurb = '그래서 지금 나는 어떻게 하면 되는지까지 봅니다. 비밀 열 가지 중 셋은 무료, 결제하면 나머지 일곱이 바로 열립니다 — 한 사람에 한 번' where code = 'jigeum';
update public.products set blurb = '그래서 나한테 도움이 되는 사람인지까지 봅니다. 비밀 열 가지 중 셋은 무료, 결제하면 나머지 일곱이 바로 열립니다 — 한 사람에 한 번' where code = 'geunamja';
update public.products set blurb = '그래서 지금 뭘 하면 되는지까지 봅니다. 비밀 열 가지 중 셋은 무료, 결제하면 나머지 일곱이 바로 열립니다' where code = 'jjak';

-- 확인
select code, name, amount, blurb from public.products order by sort, code;
