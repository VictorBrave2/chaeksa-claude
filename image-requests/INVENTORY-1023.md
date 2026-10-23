# 삽화 재고 (2026-10-23)

10-23 사장님 「그다음은 삽화 손보도록 하자」 — 사이트(app/) 의 그림을 전부 세고, 눈으로 보고, 고칠 차례를 전략(10-19 석 달 판: 네이버 → 출산택일 신청 → 입금) 순으로 적은 장부다. 그림은 만들지 않았고 코드도 건드리지 않았다. 요청 명세는 IMG-0001 ~ IMG-0012, 목록은 INDEX.md.

## 1. 숫자

| 센 것 | 수 | 풀이 |
|---|---|---|
| app/art 파일 | 435 | 큰 webp 184 · 작은 판(-s) 190 · PNG 원본 36 · 카톡 jpg 24(art/kakao) · .gitkeep 1 |
| 그림 밑이름(한 그림 = 큰 판 + 작은 판) | 190 | 표지 6 · 정통사주 jt 60(회 20 × 남녀 + 격 10 × 남녀) · 웹툰궁합 ss 36 · 이야기 story 88 |
| 코드가 부르는 그림(밑이름 기준) | 150 | 글자로 적힌 art/ 참조 48 곳 + 표로 만드는 참조(pair.js 47×2 · ssom.js 58 · ssom-vn.html jt 60 · home-cats.js 15 · love.js 11) |
| 없는 그림을 부르는 곳 | **0** | 글자 참조 48 · 미리보기(cards/og) 31 모두 파일 있음. 옛 코드의 `art/chaeksa-*.webp`(책사 얼굴) · `art/love-<상태>-<계절>.webp`(typecard)는 스위치가 꺼져 있어 부르지 않는다 |
| 아무 데서도 안 부르는 그림 | **40** | 전부 story-*. 옛 이야기 진열대(#wtHome, 늘 hide)만 썼던 것 — 아래 3절 목록 |
| 작은 판 없는 그림 | **0** | 다만 love-main-s.webp 만 480×480 정사각(다른 189장은 360×540) |
| 작은 판만 있는 그림 | 6 | story-diet · story-haircut · story-move · story-neighbor · story-post · story-start-habit(모두 안 쓰는 40 안) |
| 사이트에 올라가지만 안 쓰는 큰 파일 | 36 PNG · 67MB | ss-*.png 원본(웹툰궁합 36장). webp 둘은 26MB. jt 원본은 삽화원본/jt/(gitignore)에 두었는데 ss 원본은 app/art 에 남아 있다 |
| 미리보기(og) 그림 | 33 | cards/og/*.jpg 29(tools_sogae.py 가 만듦) + og.jpg(출산택일 글자 카드) + og-home-3.jpg(홈) + 안 쓰는 og-home-2.jpg · og.png |
| 그림이 한 장도 없는 쪽 | 24 | 출산택일 소개 · 신청 · 값 · 글 13편 · 결혼상대 신청 · 진로 소개 · 진로 신청 · 언제 나아지나 · 고지능 · 귀 · 옛 책 · 명반 · 내 사람들 · 읽을거리 · 소개 |

크기: 큰 판 178장 = 1024×1536(2:3), 표지 5장 = 1086×1448(3:4), love-main = 900×1200. 작은 판은 360×540.

## 2. 화면마다 — 무엇을 어디에 어떤 크기로

| 화면 | 자리 | 그림 | 크기 · 자르기 | 있나 |
|---|---|---|---|---|
| 홈 index.html | 메뉴판 그림 칸(home-cats.js, 폰 3열 115px, 1:1 네모로 위 25% 기준 자름) | 아이 taekil-main · 궁합 story-sanggyeonrye(결혼상대) · gunghap-main · ssom-main · 연애 love-cover · story-friend-to-lover · 일 jt-15-work-{g} · 나 jt-g-bigyeon-{g} · saju-main · jt-g-pyeonin-{g} · jt-g-jeonggwan-{g} · jt-g-siksin-{g} · jt-g-pyeongwan-{g} · 운 jt-19-return-{g} · 배움 jt-g-jeongin-{g} | 원본 + -s srcset | 있음 |
| 홈 | 「첫 만남」 내 생년월일 입력 띠(.fc-art 200px, 가운데 22%) | love-main.webp(= saju-main 을 잘라 쓴 보라 머리 소녀) | 900×1200, -s 480×480 | 있음(꼴 어긋남) |
| 홈 | 「그 사람」 입력 컷(#pfCut 300px, 위부터) | jt-13-heart-m / -f(성별 따라) | 1024×1536 | 있음 |
| 홈 | 미리보기 og | og-home-3.jpg(표지 다섯 띠) | 1200×630 | 있음 |
| 홈 | 옛 이야기 진열대 #wtHome(늘 hide) | story-<id>-s 88장 가운데 이야기 목록 것 | — | 안 보임 |
| 정통사주 jeongtong.html | 머리 .sg-cover | saju-main | 1086×1448 | 있음 |
| 정통사주 장면 보기 ssom-vn.html(jtVn) | 회 배경 20 × 남녀 + 격 배경(3 · 4 · 15회) 10 × 남녀 | jt-01-born ~ jt-20-where · jt-g-* | 1024×1536 원본 그대로 | 있음(60장 다) |
| 정통사주 결과 카드(ssom-card.js) | 카드 윗그림 190px | 회 컷 -s | 360×540 | 있음 |
| 정통사주 카톡 공유 | art/kakao/jt-g-*-{m,f}.jpg | 20장 | 800×1000 | 있음 |
| 정통궁합 gunghap-chongnon.html | 머리 .sg-cover | gunghap-main | 1086×1448 | 있음(안에는 그림 없음) |
| 웹툰궁합 ssom.html | 머리 .sg-cover | ssom-main | 1086×1448 | 있음 |
| 웹툰궁합 | 고르기 카드 여덟(ss.js 고름칸) | ss-give · ss-meet-blind · ss-sseom-5 · ss-early-1 · ss-steady-4 · ss-marry-1 · ss-shake-3 · ss-again-3 | -s | 있음 |
| 웹툰궁합 글 보기 | 화마다 컷(.ss-cut 4:3, 위 22%) | 총론 ss-me · ss-her · ss-give · ss-hold + 단계 곳그림 32(ss-meet-* 6 · ss-sseom-* 6 · ss-early-* 5 · ss-steady-* 4 · ss-marry-* 4 · ss-shake-* 3 · ss-again-* 3) | -s | 있음 |
| 웹툰궁합 장면 보기 | 배경 | 위 36 + 단계배경 story 14(blind-date · first-date · he-likes · contact · reply · second-meet · say-love · anniversary · trip · marry-talk · propose · fight · cold · ex-contact · get-back) | 원본 | 있음 |
| 웹툰궁합 결과 카드 · 카톡 | ss-give · ss-then-now(-s · kakao jpg) | — | 있음 |
| 출산택일 소개 taekil.html | **그림 0** — 제목 아래 CSS 모션 네 장면(taekil-why.js)뿐 | — | — | **빈 자리** |
| 출산택일 소개 | 미리보기 og | og.jpg(글자 카드 「출산택일 · 세 고전」) | 1200×630 | 있음 |
| 출산택일 신청 taekil-apply.html | **그림 0** · og cards/og/taekil-apply.jpg(taekil-main + 제목) | — | **빈 자리** |
| 출산택일 견본 taekil-sample.html | 명식 카드 PNG 넷(cards/sample-taekil/01~04.png) | 1200×1228 | 있음(삽화는 0) |
| 출산택일 값 taekil-price.html · 시뮬레이터 taekil-sim.html | 그림 0 · 카톡 kakao/taekil-main.jpg | — | **빈 자리** |
| 출산택일 글 13편 taekil-*.html | **그림 0** · og 전부 og.jpg | — | **빈 자리** |
| 출산택일 월별 자료 24쪽 | og = 그 달 명식 카드 cards/<달>/01.png | 1200×1372 | 있음(자료 그림이라 맞음) |
| 결혼상대 gyeolhon.html | 머리 story-sanggyeonrye(폰 100vw) + 답 셋 story-propose-s · story-marry-talk-s · story-gyeolhon-s · og cards/og/gyeolhon.jpg | 1024×1536 · 360×540 | 있음(좋음) |
| 결혼상대 신청 gyeolhon-apply.html | **그림 0** · og = og.jpg(출산택일 카드 — 어긋남) | — | **빈 자리** |
| 결혼상대 견본 gyeolhon-sample.html | story-marry-talk-s · og og.jpg | 360×540 | 있음 |
| 진로 ilgyeol.html · ilgyeol-apply.html | **그림 0** · og = og.jpg(어긋남) · 홈 칸은 jt-15-work-{g} 빌려 씀 | — | **빈 자리** |
| 연애 love.html(사랑할 때만 나오는 당신) | 머리 love-cover · 장 머리 10(story-maeum · ss-sseom-6 · story-first-touch · story-contact · story-jealous · story-fight · ss-shake-3 · ss-steady-1 · ss-again-3 · ss-steady-4) · 카톡 kakao/love-cover.jpg · og cards/og/love.jpg | 1086×1448 · 1024×1536 | 있음 |
| 사용설명서 pair.html(SSS급 그 사람) | 머리 story-friend-to-lover · 질문 47 × 남/여 배경(pair.js 장그림 — ss · story · jt 섞어 씀, 4:5 로 위 30% 기준 자름) · 장면 보기 같은 표 · og cards/og/pair.jpg | 1024×1536 | 있음 |
| 언제 나아지나 when.html | 그림 0 · 홈 칸 jt-19-return-{g} · og cards/og/when.jpg | — | 홈 칸만 |
| 고지능 brain.html | 그림 0 · 홈 칸 jt-g-pyeonin-{g} · og brain.jpg | — | 홈 칸만 |
| 귀 gwi.html | 그림 0 · 홈 칸 jt-g-jeonggwan-{g} · og gwi.jpg | — | 홈 칸만 |
| 옛 책 gyeokgi.html | 그림 0 · 홈 칸 jt-g-siksin-{g} · **og = gwi.jpg(「나는 귀한 사람일까요?」 제목 — 어긋남)** | — | 홈 칸만 |
| 명반 myeongban.html | 그림 0 · 홈 칸 jt-g-pyeongwan-{g} · og myeongban.jpg | — | 홈 칸만 |
| 내 사람들 saram.html | 그림 0 · 홈 칸 jt-g-bigyeon-{g} · **og = gwi.jpg(어긋남)** | — | 홈 칸만 |
| 읽을거리 read.html | 그림 0 · 홈 칸 jt-g-jeongin-{g} · og read.jpg(카드 안 그림 jt-g-jeongin-f) | — | 홈 칸만 |
| 소개 about.html · 용어 saju-glossary.html · 명식 myeongsik.html | 그림 0 · og 없음/og.jpg | — | — |
| 신살 글 4(baekho · dohwa · gwaegang · hongyeom) · 「왜」 글 12 · how-good | 본문 그림 0 · og cards/og/<쪽>.jpg(tools_sogae ART 표가 jt · ss 컷을 골라 얹음) | 1200×630 | 있음 |

## 3. 파일 쪽 — 안 쓰는 것 · 꼴이 어긋난 것

**안 쓰는 story 40(큰 판 + 작은 판, 지우지 않아도 되나 사이트에 올라간다 — 약 12MB):** story-again · story-ask-leave · story-ask-refund · story-block · story-boss-bad-news · story-boss-idea · story-client-price · story-coworker-fight · story-dad-talk · story-diet(-s만) · story-ex-birthday · story-ex-drink · story-exam · story-friend-hurt · story-gunghap · story-haircut(-s만) · story-his-friends · story-ibyeol · story-inlaw-talk · story-inlaw-visit · story-interview · story-jjak · story-junior-talk · story-kid-exam · story-live-together · story-mom-money · story-move(-s만) · story-move-out · story-neighbor(-s만) · story-open-shop · story-parents-visit · story-post(-s만) · story-quit-talk · story-raise · story-resign · story-return-stuff · story-sell-used · story-sibling-fight · story-someone-else · story-start-habit(-s만).
이 가운데 story-again · story-gunghap · story-jjak · story-ibyeol · story-interview 는 화풍 · 질이 좋아(밤 · 동백 · 서울) 뒤에 빈 자리(언제 나아지나 · 내 사람들 등)에 돌려 쓸 수 있다.

**사이트에 안 쓰는 그 밖의 것:** ss-*.png 36(67MB) · og-home-2.jpg(옛 한복 초상 넷) · og.png.
**꼴이 어긋난 것:** love-main-s.webp 480×480(정사각 — 나머지는 360×540) · 표지 5장 1086×1448(3:4 — 나머지는 2:3).

## 4. 눈으로 본 판단

**사이트 화풍(대다수 — jt 60 · ss 36 · 쓰는 story 48 = 약 144장):** 서울 밤(남산타워 · 한강 다리) · 인디고 보라 · 호박빛 램프 · 붉은 동백 한 송이 · 반사실 웹툰 선. 같은 두 사람(HIM · HER) · 같은 한 사람(ME-M · ME-F)이 벌마다 얼굴 · 옷이 이어진다. 폰 폭에서도 얼굴이 읽히고, 글자 티(가짜 문자 · 워터마크)는 본 것 가운데 없었다. jt · ss 는 아래 40%가 인디고로 비어 있는데(말풍선 자리) 홈 칸은 위 25% 기준 1:1 로 자르므로 칸에서는 티가 안 난다. **이 벌은 손볼 것이 없다.**

**어긋난 여섯(모두 09-30 GPT 그림 — 홈 첫 줄 표지):**

| 파일 | 쓰는 곳 | 문제 |
|---|---|---|
| taekil-main.webp | 홈 「아이」 첫 칸 · 신청 og · 카톡 · 홈 og 띠 | 대낮 파스텔 보라 — 사이트 밤 화풍과 다른 작품. 소재도 「네 살 아이와 퍼즐」이라 출산(임신 · 날 고르기 · 갓난아기)이 안 보인다. 다만 이 그림은 README 「맞출 본보기」에 사장님이 올린 것 — 따뜻한 쪽을 좋아하셨다는 뜻이라 **사장님 결정** |
| saju-main.webp · love-main.webp(같은 그림 자른 것) | 홈 「나」 칸 · 정통사주 머리 · 첫 만남 입력 띠 | 보라 긴 머리 판타지 소녀 + 마법 원 · 네 계절 — 흔한 AI 그림 느낌, 서울 · 사람 · 동백이 없음. 입력 띠에서는 바로 다음 칸(jt-13 밤 버스)과 세계가 다르다 |
| gunghap-main.webp | 홈 「궁합」 칸 · 정통궁합 머리 | 한복풍 판타지 남녀 · 달 · 붉은 실 — 뜻(둘을 잇는 실)은 맞으나 고대 의상이 사이트 세계(지금 서울) 밖 |
| ssom-main.webp | 홈 「궁합」 칸 · 웹툰궁합 머리 | 대낮 분홍 카페 남녀 — 예쁘지만 바로 밑 장면 그림 36장(밤)과 다른 작품 |
| love-cover.webp | 홈 「연애」 칸 · love.html 머리 · 카톡 | 대낮 웨딩 — 「연애할 때의 나」에 결혼식 그림이라 소재가 어긋남 + 화풍 다름 |
| og-home-3.jpg | 홈 카톡 · 네이버 미리보기 | 위 다섯을 띠로 붙인 것이라 다섯 화풍이 한 줄에 다 보인다 |

**그 밖에 눈에 걸린 것(작음):** 홈 「옛 책」 칸이 식신(요리) 컷 · 「내 사람들」이 비견(달리기) 컷 — 빌려 쓴 것이라 소재와 느슨하게만 맞는다(새 그림은 얼림 기간이라 요청 안 함). 결혼상대 넷(상견례 · 프러포즈 · 결혼 얘기 · 반지 상자)은 소재 · 화풍 다 좋다 — 기준으로 삼을 만하다.

## 5. 고칠 목록 — 전략 차례

| 차례 | 화면 · 자리 | 지금 | 문제 | 할 것 | 명세 |
|---|---|---|---|---|---|
| 1 | 출산택일 소개 taekil.html 머리(견본 · 값 쪽 머리도) | 없음 | 네이버에서 오는 첫 쪽에 그림 0 | 새벽 창가 달력에 동그라미 치는 부부 — 2:3, app/art/taekil-hero.webp | IMG-0001 |
| 2 | 출산택일 신청 taekil-apply.html 머리 컷 | 없음 | 웹툰식 입력(컷 + 말풍선) 규칙에 어긋남 | 병원 예약지 든 엄마, 아래 40% 비움 — app/art/taekil-apply.webp | IMG-0002 |
| 3 | 견본 taekil-sample.html 머리 · 소개 「보고서는 이렇게」 · pay-done | 명식 카드만 | 「받는 것」이 그림으로 없음 | 태블릿으로 보고서 읽는 부부 — app/art/taekil-report.webp | IMG-0003 |
| 4 | 출산택일 글 13편 머리 + 그 og 카드 | 없음 · og 전부 같은 글자 카드 | 글만 · 미리보기 구별 안 됨 | 새벽 병원 창가 갓난아기 — app/art/taekil-read.webp(og 는 tools_sogae 로 다시) | IMG-0004 |
| 5 | 결혼상대 신청 gyeolhon-apply.html 머리 컷 + og | 없음 · og 출산택일 카드 | 둘째 유료의 신청 쪽만 비어 있고 미리보기가 남의 것 | 서로 생년월일 불러 주는 둘, 아래 40% 비움 — app/art/gyeolhon-apply.webp | IMG-0005 |
| 6 · 7 | 진로 ilgyeol.html 머리 + 홈 「일」 칸(남녀) + og | jt-15 빌려 씀 · og 출산택일 카드 | 셋째 유료에 제 그림 없음 | 밤 갈림길 불 켜진 문들 — app/art/ilgyeol-f.webp · ilgyeol-m.webp | IMG-0006 · 0007 |
| 8 | 홈 「연애」 칸 · love.html · 카톡 | love-cover(대낮 웨딩) | 소재 · 화풍 어긋남 | 밤 카페 창가 유리에 비친 다른 얼굴 — love-cover.webp 바꿔 넣음 | IMG-0008(결정 뒤) |
| 9 | 홈 「나」 칸 · 정통사주 머리 | saju-main(보라 소녀) | 흔한 AI 그림 · 세계 밖 | 한강 밤길 네 계절 — saju-main.webp 바꿔 넣음 | IMG-0009(결정 뒤) |
| 10 | 홈 「궁합」 칸 · 정통궁합 머리 | gunghap-main(한복 판타지) | 세계 밖 | 밤 다리 등 맞댄 둘 · 붉은 실 — gunghap-main.webp 바꿔 넣음 | IMG-0010(결정 뒤) |
| 11 | 홈 「궁합」 칸 · 웹툰궁합 머리 | ssom-main(대낮 카페) | 장면 그림 36장과 다른 작품 | 밤 포장마차 — ssom-main.webp 바꿔 넣음(또는 ss-sseom-5 돌려 씀) | IMG-0011(결정 뒤) |
| 12 | 「첫 만남」 입력 띠(모든 입구) | love-main(보라 소녀 · -s 정사각) | 다음 칸과 세계 다름 · 작은 판 꼴 틀림 | 밤 책상 앨범의 아기 사진 — app/art/first-meet.webp, love-main 걷음 | IMG-0012(결정 뒤) |
| 13 | 홈 「아이」 칸 · 카톡 · 신청 og | taekil-main(대낮 퍼즐) | 화풍 · 소재 | 결정 1이 「통일」이면 IMG-0001 그림으로 바꿔 끼움(새 요청 없음) | — |
| 14 | 홈 og-home-3.jpg | 다섯 화풍 띠 | 8~13 뒤 저절로 | tools_sogae.py 가 다시 찍음 | — |
| 15 | 내 사람들 · 옛 책 og | gwi.jpg(귀 제목) | 공유하면 남의 제목 | tools_sogae.py ART 표엔 있는데 카드가 안 찍힘(쪽 머리가 og.jpg 가 아니라 건너뜀) — 손으로 og 줄을 비우고 다시 돌림(코드) | — |
| 16 | ss-*.png 36(67MB) | app/art 에 그대로 | 사이트 배포 용량 · 아무도 안 부름 | 삽화원본/ss/ 로 옮기고 gitignore(총괄 몫) | — |
| 17 | 언제 나아지나 · 고지능 · 귀 · 옛 책 · 명반 · 내 사람들 · 읽을거리 본문 | 그림 0(홈 칸만) | 얼림 기간(1월 31일까지 새 화면 · 콘텐츠 안 늘림) | 안 함. 굳이 하면 안 쓰는 story-again · story-jjak · story-interview 를 머리에 돌려 쓴다 | — |

## 6. 사장님이 정할 것

1. **홈 표지 다섯 + 첫 만남 띠를 밤 화풍으로 통일할까?** 사이트 그림 144장이 밤 · 인디고 · 동백인데 홈 첫 줄 다섯만 다섯 화풍이다. 통일하면 IMG-0008~0012 를 그리고 taekil-main 자리는 IMG-0001 로. 지금 그대로 두면 다섯 줄은 `취소`. (내 추천: 통일 — 홈 og 띠 한 장에 다섯 작품이 보이는 것이 첫인상을 흐린다.)
2. **출산택일 그림의 빛** — 밤(사이트 기본)인가, 새벽 · 아침(새 생명)인가. IMG-0001 · 0004 는 「그림체는 밤 벌 그대로, 빛만 새벽」으로 썼다(taekil-main 의 따뜻함을 잇되 세계는 같게). 밤으로 하라시면 프롬프트 한 줄만 바꾼다.
3. **진로 그림 남녀 두 벌(IMG-0006 · 0007)** 인가, 한 장인가. 홈 칸이 성별로 바꿔 끼우는 구조라 두 벌로 썼다.

## 7. 코드 쪽 남은 것(그림이 온 뒤 · 내 몫)

- 받은 PNG → webp(원본 크기) + `-s.webp`(360×540) → 최종 경로 → 화면에 잇기(taekil.html 머리 figure 새로 · taekil-apply/gyeolhon-apply 컷 + 말풍선 · ilgyeol.html 머리 · home-cats.js work 줄 · style.css .fc-art · app.js 219줄) → tools_bust.py FILES 는 JS 가 아니라 그림이므로 안 건드림 → `python tools_sogae.py`(og 카드 다시) → 화면 검사기 → 배포.
- 카톡 800×1000 판(art/kakao/)은 표지가 바뀌는 것(love-cover · taekil-main)만 다시 잘라 낸다.
- gyeolhon-apply · ilgyeol · ilgyeol-apply · saram · gyeokgi 의 og 줄은 그림과 상관없이 지금도 고칠 수 있다(제 카드로).
