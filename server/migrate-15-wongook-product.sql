-- 책사 migrate-15 : 「원국 정독」을 상품으로 연다 (2026-08-31 결재)
--
-- 왜 —
--   「좌장이 읽는 원국」은 **무료 화면에 붙은 Opus 호출**이었다.
--   memory 「원가 자물쇠」에 「돈이 타는 유일한 곳은 굽기(ganmyeong)」라 적어 놓고
--   조문에 없는 두 번째 화구를 무료로 열어 두고 있었다.
--
--   판정을 가두는 것이 아니다(CLAUDE.md 넷 「판정 유료화 폐기」).
--   강약·용신·격국·대운은 **엔진이 계산해 무료 카드로 그대로 화면에 있다.**
--   파는 것은 그 판정들을 좌장이 한 문단으로 **엮은 서술**이다.
--
-- 값 —
--   10,000원. 다른 셋(인연·두 사람·재물)이 20,000원인데 이것을 반으로 둔 이유는,
--   **원국은 모든 것의 기준이라 첫 결제가 되기 쉽기 때문**이다. 문턱을 낮춘다.
--   이번 달 일운 달력과 같은 값이다.
--
-- 여러 번 실행해도 안전하다.

insert into public.products (code, name, amount, blurb, sort) values
  ('wongook', '원국 정독 — 좌장이 읽는 여덟 글자', 10000,
   '무료는 계산과 카드까지. 결제하면 좌장 태윤이 강약·용신·격국·대운을 한 편으로 엮어 읽어 드립니다. 한 번 읽으면 그대로 남습니다',
   25)
on conflict (code) do update
  set name = excluded.name,
      amount = excluded.amount,
      blurb = excluded.blurb,
      sort = excluded.sort;

-- 확인
--   select code, name, amount, sort from public.products order by sort;
