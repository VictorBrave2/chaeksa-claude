# COPY-0001 — 유료 콘텐츠 손님 글 검수 · 고침

| 칸 | 값 |
|---|---|
| 작업 ID | COPY-0001 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-22 |
| 가지 | copy/COPY-0001 |

## 무엇을 보나

사장님이 「일단 유료 콘텐츠부터」라고 해서 10-22에 책사 쪽 작가가 기준 다섯으로 한 번 다시 썼습니다(커밋 a2d9990e). 그 판을 **다른 눈으로 검수하고 고쳐** 주세요. 사장님은 「작가가 미숙하다」고 봤습니다 — 예: 명반 밝기 말 「제자리 못 얻음」(이것은 DES-0001에서 따로 봅니다).

| 화면 | 주소 | 고쳐도 되는 파일 |
|---|---|---|
| 출산택일 소개 | https://chaeksa.kr/taekil.html | `app/taekil.html` |
| 출산택일 값 · 까닭 | https://chaeksa.kr/taekil-price.html | `app/taekil-price.html` |
| 출산택일 신청 | https://chaeksa.kr/taekil-apply.html | `app/taekil-apply.html` |
| 결혼상대 점검 소개 · 신청 | https://chaeksa.kr/gyeolhon.html · gyeolhon-apply.html | `app/gyeolhon.html` · `app/gyeolhon-apply.html` · `app/gyeolhon-apply.js`(손님 글만) |
| 나는 뭐해 먹고 살까? 소개 · 신청 | https://chaeksa.kr/ilgyeol.html · ilgyeol-apply.html | `app/ilgyeol.html` · `app/ilgyeol-apply.html` · `app/ilgyeol-apply.js`(손님 글만) |
| 사랑할 때만 나오는 당신 · 사용설명서 소개 | https://chaeksa.kr/love.html · pair.html | `app/love.js` · `app/pair.js`(손님 글만 — `love.html` · `pair.html`은 장부에서 만들어지는 쪽이라 직접 고치지 않음) |
| 값을 받는 것 · 결제 완료 | https://chaeksa.kr/pay.html | `app/pay.html` · `app/pay-done.html` |
| 상품 약속 장부(위 쪽들이 읽는 글) | — | `app/yaksok.js`(글 칸만 — README 「건드리면 안 되는 것」) |

## 비공개 원고 — 안만 PR 설명에

아래 견본은 비공개 원고로 만들어진 쪽입니다. **파일은 고치지 말고**, 고칠 줄과 고칠 말을 PR 설명에 「견본 쪽 · 칸 · 전 → 후」로 적어 주세요. 책사 쪽이 비공개 원고에 옮깁니다.

- 출산택일 보고서 견본 https://chaeksa.kr/taekil-sample.html (「궁금하다고 하신 것」 · 「정리」 · 「자미두수로 본 권하는 곳」)
- 결혼상대 점검 보고서 견본 https://chaeksa.kr/gyeolhon-sample.html

## 이 요청만의 것

- 출산택일 쪽 독자는 아이를 낳을 부모님입니다 — 「당신」으로 부르지 않습니다.
- 「사랑할 때만 나오는 당신」 쪽에는 「무료」라는 낱말을 쓰지 않습니다(사장님 10-02).
- 사용설명서 상품 이름은 늘 「SSS급 그 사람 사용설명서」입니다.

## 기록

- 2026-10-22 요청 — Claude Code(사장님 「작가 검수 및 수정도 맡기고 싶은데」)
