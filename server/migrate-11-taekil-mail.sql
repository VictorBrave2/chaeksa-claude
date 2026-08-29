-- 택일 상품 문구를 바로잡는다 (2026-08-30)
--
-- products 는 schema-8 에서 on conflict do nothing 으로 심었으므로,
-- 이미 심어진 행은 그 파일을 다시 돌려도 안 바뀐다. 여기서 명시적으로 고친다.
--
-- 왜  ─ 카카오 문의를 걷어냈는데 상품 설명만 「카카오로 드립니다」로 남아 있었다.
--       결제 화면에 뜨는 문구라, 돈을 받으면서 없는 통로를 약속하는 셈이었다.
--       이름의 「1:1 상담」도 걷었다 — 상담 창구가 아니라 보고서를 파는 것이다.
--
-- 어디서 ─ Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

update public.products
   set name  = '출산택일 보고서',
       blurb = '기간 전체를 12시진 전수 계산한 보고서를 사람이 만들어 메일로 드립니다'
 where code = 'taekil';

select code, name, amount, blurb from public.products order by sort;
