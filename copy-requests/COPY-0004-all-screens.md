# COPY-0004 — 손님이 읽는 글 전부를 astra 가 한 바퀴(화면마다)

| 칸 | 값 |
|---|---|
| 작업 ID | COPY-0004 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 가지 | codex/COPY-0004-<묶음> |

## 왜

사장님 10-23 「일반인하고 화면 열어서 같이 읽는데도 힘들다」 · 「문장이 어색하니까 문장 작성을 astra 한테 시켜 봐」 · 「ㄱㄱ」. 지금까지 astra 는 검수에서 걸린 줄만 고쳤고, 나머지 문장은 그대로였다. 이번엔 **손님이 읽는 글 전부**를 화면마다 한 바퀴 다시 쓴다. 검수 목록 없이, 파일 안의 손님 글을 한 줄씩 읽고 기준에 어긋나면 고친다.

## 글의 기준(사장님 말 그대로)

1. 일반인이 · 알아먹게 · 있는 그대로 · 가감없이 · 단호하게. 사주를 모르는 20~30대가 되묻지 않고 한 번에 알아듣는 말.
2. 우리 말 문장이 먼저, 사주 낱말 · 한자 · 책 이름은 그 뒤 괄호. 사주 낱말을 쓰면 바로 뒤에 뜻. 괄호가 한 문장에 둘 넘게 겹치면 문장을 나누거나 낱말을 뜻으로 바꾼다.
3. 흐리는 말 금지(수 있어요 · 편이에요 · 쪽이에요 · 기 쉬워요 · 짐작 · 아마 · 듯해요). 법 · 사실의 가능성만 그대로.
4. 한 칸은 「상태 → 겪을 일 → 할 일」. 할 일은 화면에 이미 있는 근거에서만.
5. 읽는 사람은 「당신」, 상대는 「그 사람」, 출산택일은 「아이」 · 「부모님」. 성별을 짐작하지 않는다(배우자 · 짝). 센 판결은 순하게 바꾸지 않는다.
6. 짧게. 한 문장에 판결 하나. 겹말 · 되풀이 · 「~해 드려요」 남발을 걷는다.

## 건드리면 안 되는 것(README 와 같음 + 이번 것)

- 계산 · 판정 낱말(으뜸 · 차선책 · 흠 · 깨진 격 등) · 옛 책 원문 · 숫자 · 값 · 날짜 · 시간.
- 코드 — id · class · data- · 변수 · JSON 열쇠 · `{자리표}` · `{?이름:안|안}` 갈래 · 조건식. JS 는 따옴표 안 손님 글만. 코드가 뒤에 조사 · 「고 봤어요」 등을 붙이는 문장(「~다」로 끝나는 표)은 꼴을 지킨다.
- 만들어지는 쪽(love.html · pair.html · ssom.html · gunghap-chongnon.html · jeongtong.html · taekil.html 글 목록 · taekil-20NN-* · taekil-* 글 · why-* 글) — 이번 요청에 없다. `*-copy.js` 는 고쳐도 된다.
- 「실제로 만든 결과에서 옮겼어요」 예시 줄 · 홈 물음 글(bunya.js 물음) · 약관 · 개인정보처리방침 · 바닥글 · 걷은 약속 · 상품 장부 못 박은 칸.
- 시험 쪽 기대값은 화면 글이 바뀌어 어긋날 때만 같은 뜻으로 맞추고 보고서에 적는다.

## 끝났다고 볼 기준

- 묶음의 모든 파일을 끝까지 읽었다(보고서에 파일마다 「읽은 줄 수 · 고친 곳 수」).
- node --check 통과 · CRLF 그대로 · 묶음 시험 쪽(아래) headless Chrome 에서 실패 0 · CODEX_REPORT.md 에 파일:줄 · 전 → 후(큰 묶음은 같은 꼴은 묶어서) · 망설인 줄은 「판단 필요」.

## 묶음 jeongtong — 정통사주 탭 · 13장 · 웹툰 · 설명서

- 고쳐도 되는 파일: `app/jeongtong.js` · `app/samyeong.js` · `app/yeongyeok.js` · `app/gwanjeom.js`(십신뜻 등 낱말 표 — 정통궁합도 같이 씀) · `app/jt-webtoon.js` · `app/jt-webtoon-2.js` · `app/seolmyeongseo.js` · `app/brief.js` · `app/maeum.js` · `app/geunamja.js` · `app/typecard.js` · `app/tongbyeon.js` · `app/wongook.js`(index.html 이 싣고 정통사주 탭에 보이는 글만)
- 시험: `app/tests_jt.html` · `app/tests_seolmyeongseo.html` · `app/tests_panjeong.html`

## 묶음 gunghap — 정통궁합(궁합총론) · 새 틀

- 고쳐도 되는 파일: `app/gunghap-chongnon.js` · `app/gunghap-gwanjeom.js` · `app/gunghap-1cheung.js` · `app/gunghap.js`
- 시험: `app/tests_panjeong.html` · `app/tests_bunya.html`

## 묶음 ssom — 웹툰궁합(썸) 화면 · 회차 · 카드 · 장면 보기

- 고쳐도 되는 파일: `app/ssom.js` · `app/ssom-webtoon.js` · `app/ssom-webtoon-2.js` · `app/ssom-webtoon-3.js` · `app/ssom-dangye.js` · `app/ssom-card.js` · `app/ssom-card-mal.js` · `app/ssom-score-mal.js` · `app/ssom-baram.js` · `app/ssom-daehwa.js` · `app/ssom-vn.html`(화면 글만) · `app/stories.js`(손님 글만)
- 시험: `app/tests_ssom.html` · `app/tests_kkureomi.html`

## 묶음 home — 홈 · 공통 틀 · 사람 넣기 · 결제 화면 · 안내 쪽

- 고쳐도 되는 파일: `app/index.html` · `app/app.js` · `app/home-cats.js` · `app/home-ask.js` · `app/people.js` · `app/pay.js` · `app/share.js` · `app/landing.js` · `app/404.html` · `app/pay-fail.html` · `app/bunya.js`(이름 · 한줄 · 「이걸 보면 알 수 있는 것」만 — **물음 글은 손님이 묻는 말 그대로 두고 고치지 않는다**)
- 시험: `app/tests_bunya.html` · `app/tests_yaksok.html` · `app/tests_byeonhwa.html`

## 묶음 when_brain — 언제 나아지나 · 나는 고지능일까

- 고쳐도 되는 파일: `app/when.js` · `app/when-copy.js` · `app/when.html` · `app/brain.js` · `app/brain-copy.js` · `app/brain.html`
- 시험: `app/tests_bunya.html`(홈 칩)

## 묶음 gwi_gyeokgi — 나는 귀한 사람일까 · 옛 책은 내 명식을 반겼을까

- 고쳐도 되는 파일: `app/gwi.js` · `app/gwi-copy.js` · `app/gwi.html` · `app/gyeokgi.js` · `app/gyeokgi-copy.js` · `app/gyeokgi.html`
- 시험: —(바뀐 화면을 headless Chrome 으로 열어 오류 0)

## 묶음 myeongban_saram — 내 명반 · 내 사람들 · 읽을거리 · 소개 · 용어 · 정확도 시험

- 고쳐도 되는 파일: `app/myeongban.js` · `app/myeongban-copy.js` · `app/myeongban.html` · `app/saram.js` · `app/saram-copy.js` · `app/saram.html` · `app/read.html` · `app/about.html` · `app/saju-glossary.html` · `app/saju-accuracy-test.html`
- 시험: —(headless Chrome 으로 열어 오류 0)

## 묶음 taekil — 출산택일 시뮬레이터 · 보고서 화면 · 명식 카드 · 「왜」 장면 · 신살 글

- 고쳐도 되는 파일: `app/taekil-sim.html` · `app/taekilsim.js` · `app/taekil-read.js` · `app/taekil-report.js` · `app/taekil-report.html` · `app/taekil-why.js` · `app/taekil-why-copy.js` · `app/myeongsik.html` · `app/myeongsik-card.js` · `app/ilgyeol-report.html` · `app/dohwa.html` · `app/hongyeom.html` · `app/baekho.html` · `app/gwaegang.html`
- 시험: `app/tests_taekilsim.html` · `app/tests_taekilread.html` · `app/tests_taekilreport.html`

## 기록

- 2026-10-23 요청 — Claude Code(사장님 「ㄱㄱ 그다음은 삽화 손보도록 하자」). 글 · why 글은 다음 요청(COPY-0005, marketing/붙여넣기 원본 → tools_jeongbon 재생성).
