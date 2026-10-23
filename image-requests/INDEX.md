# 삽화 요청 목록

새 요청을 쓰기 전에 이 표에서 같은 쓰임 · 같은 최종 경로가 있는지 먼저 봅니다. 상태는 `요청` · `생성됨` · `적용됨` · `취소` 넷뿐입니다.

10-23 삽화 재고와 고칠 차례는 `INVENTORY-1023.md`. IMG-0001~0007 은 10-23 적용 → 같은 날 사장님 「일곱 장도 표지처럼 밝게 다시 그려」로 홈 표지 화풍(밝은 대낮 · 파스텔)으로 다시 그려 끼움(첫 판 PNG 는 `out/old/`, 화면 확인 그림 `ref/IMG-after-*.png` 는 첫 판). 같은 날 사장님 「컨텐츠를 이해하고 표지 삽화를 만드는 건지 의문」 · 「클릭하고 싶게 만드는 표지여야 한다」 → 명세에 「이 화면이 하려던 말」 · 「그림이 보여 줄 것」 줄을 넣고 0001 · 0004 · 0006 · 0007 을 콘텐츠에서 꺼낸 장면으로 다시(v1416). IMG-0008~0012 는 그림이 `out/` 에 와 있지만 **취소** — 10-23 사장님 「현재 출산택일 · 정통궁합 · 웹툰궁합 표지로 쓰고 있는 삽화 스타일이 좋다」. 홈 표지 다섯(taekil-main · gunghap-main · ssom-main · love-main · saju-main)과 첫 만남 띠는 그대로 두고, 앞으로 표지를 새로 그릴 땐 그 셋을 맞출 본보기로 쓴다(README 「화풍」). 원본은 out/ 에 남겨 둔다.

| 작업 ID | 그림 | 상태 | 명세 | 원본 | 최종 경로 |
|---|---|---|---|---|---|
| IMG-0001 | 출산택일 소개 머리 그림 — 새벽 창가, 달력에 동그라미 치는 부부 | 적용됨(taekil.html · taekil-price.html 머리) · 10-23 밝게 다시(사장님 「일곱 장도 표지처럼 밝게」, 첫 판은 out/old/) · 10-23 콘텐츠에서 다시 — 병원 쪽지를 받아 든 순간(시계 판 · 손 셋 판은 old/) | IMG-0001-taekil-hero.md | out/IMG-0001.png | app/art/taekil-hero.webp |
| IMG-0002 | 출산택일 신청서 머리 컷 — 병원 예약지를 든 엄마(말풍선 자리 비움) | 적용됨(taekil-apply.html 컷 + 말풍선) · 10-23 밝게 다시(사장님 「일곱 장도 표지처럼 밝게」, 첫 판은 out/old/) · 아래 40% 비움 없앰(사장님 「아래를 비워 두는 이유는?」 — 입력 컷은 그림 위 55% 만 보여 비워도 안 보임) | IMG-0002-taekil-apply.md | out/IMG-0002.png | app/art/taekil-apply.webp |
| IMG-0003 | 보고서를 함께 읽는 부부 — 견본 쪽 · 「보고서는 이렇게」 · 결제 끝 | 적용됨(taekil-sample.html 머리 · taekil.html 「보고서는 이렇게 만듭니다」 · pay-done.html 출산택일 · 견본 og) · 10-23 밝게 다시(사장님 「일곱 장도 표지처럼 밝게」, 첫 판은 out/old/) | IMG-0003-taekil-report.md | out/IMG-0003.png | app/art/taekil-report.webp |
| IMG-0004 | 출산택일 글 열세 편 공용 머리 — 새벽 병원 창가, 갓 태어난 아기 | 적용됨(tools_jeongbon.py 머리 figure — taekil-* 질문 글 11편 + og 카드 cards/og/taekil-*.jpg) · 10-23 밝게 다시(사장님 「일곱 장도 표지처럼 밝게」, 첫 판은 out/old/) · 10-23 콘텐츠에서 다시 — 빈 달력 칸마다 구슬 열두 알, 몇 알만 금빛(모든 날 모든 시각) | IMG-0004-taekil-read.md | out/IMG-0004.png | app/art/taekil-read.webp |
| IMG-0005 | 결혼상대 점검 신청서 머리 컷 — 서로 생년월일을 불러 주는 둘(말풍선 자리 비움) | 적용됨(gyeolhon-apply.html 컷 + 말풍선 · og 카드) · 10-23 밝게 다시(사장님 「일곱 장도 표지처럼 밝게」, 첫 판은 out/old/) · 아래 40% 비움 없앰(사장님 「아래를 비워 두는 이유는?」 — 입력 컷은 그림 위 55% 만 보여 비워도 안 보임) | IMG-0005-gyeolhon-apply.md | out/IMG-0005.png | app/art/gyeolhon-apply.webp |
| IMG-0006 | 「나는 뭐해 먹고 살까?」 표지 · 여자 — 밤 갈림길, 불 켜진 문들 | 적용됨(ilgyeol.html 머리 · 홈 「일」 칸 · ilgyeol · ilgyeol-apply og 카드) · 10-23 밝게 다시(사장님 「일곱 장도 표지처럼 밝게」, 첫 판은 out/old/) · 10-23 콘텐츠에서 다시 — 같은 여자 두 번: 복잡한 사무실에서 지침 · 조용한 창가에서 환함(조건) | IMG-0006-ilgyeol-f.md | out/IMG-0006.png | app/art/ilgyeol-f.webp |
| IMG-0007 | 「나는 뭐해 먹고 살까?」 표지 · 남자 — 같은 갈림길 | 적용됨(ilgyeol.html 머리 · 홈 「일」 칸 — 남자 프로필) · 10-23 밝게 다시(사장님 「일곱 장도 표지처럼 밝게」, 첫 판은 out/old/) · 10-23 콘텐츠에서 다시 — 같은 남자 두 번(조건) | IMG-0007-ilgyeol-m.md | out/IMG-0007.png | app/art/ilgyeol-m.webp |
| IMG-0008 | 「사랑할 때만 나오는 당신」 표지 다시 — 밤 카페 창가, 유리에 비친 다른 얼굴(표지 통일 안 함) | 취소(10-23 사장님 — 지금 표지 그대로) | IMG-0008-love-cover.md | out/IMG-0008.png | app/art/love-cover.webp |
| IMG-0009 | 정통사주 표지 다시 — 한강 밤길, 네 계절을 지나는 한 사람(표지 통일 안 함) | 취소(10-23 사장님 — 지금 표지 그대로) | IMG-0009-saju-main.md | out/IMG-0009.png | app/art/saju-main.webp |
| IMG-0010 | 정통궁합 표지 다시 — 밤 다리 위 등 맞댄 둘, 붉은 실(표지 통일 안 함) | 취소(10-23 사장님 — 지금 표지 그대로) | IMG-0010-gunghap-main.md | out/IMG-0010.png | app/art/gunghap-main.webp |
| IMG-0011 | 웹툰궁합 표지 다시 — 밤 포장마차(표지 통일 안 함) | 취소(10-23 사장님 — 지금 표지 그대로) | IMG-0011-ssom-main.md | out/IMG-0011.png | app/art/ssom-main.webp |
| IMG-0012 | 「첫 만남」 입력 칸 머리 띠 — 밤 책상, 앨범에서 떨어진 아기 사진(표지 통일 안 함) | 취소(10-23 사장님 — 지금 표지 그대로) | IMG-0012-first-meet.md | out/IMG-0012.png | app/art/first-meet.webp |
