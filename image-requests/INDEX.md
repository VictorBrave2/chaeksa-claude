# 삽화 요청 목록

새 요청을 쓰기 전에 이 표에서 같은 쓰임 · 같은 최종 경로가 있는지 먼저 봅니다. 상태는 `요청` · `생성됨` · `적용됨` · `취소` 넷뿐입니다.

10-23 삽화 재고와 고칠 차례는 `INVENTORY-1023.md`. IMG-0001~0007 은 10-23 적용 → 같은 날 사장님 「일곱 장도 표지처럼 밝게 다시 그려」로 홈 표지 화풍(밝은 대낮 · 파스텔)으로 다시 그려 끼움(첫 판 PNG 는 `out/old/`, 화면 확인 그림 `ref/IMG-after-*.png` 는 첫 판). 같은 날 사장님 「컨텐츠를 이해하고 표지 삽화를 만드는 건지 의문」 · 「클릭하고 싶게 만드는 표지여야 한다」 → 명세에 「이 화면이 하려던 말」 · 「그림이 보여 줄 것」 줄을 넣고 0001 · 0004 · 0006 · 0007 을 콘텐츠에서 꺼낸 장면으로 다시(v1416). 이어서 사장님 「안 바뀌었는데」(홈 화면) → 홈 칸 아홉(본문 밤 컷을 빌려 쓰던 SSS급 · 결혼상대 · 새로 만난 그 사람 · 고지능 · 귀 · 옛 책 · 명반 · 언제 · 읽을거리)에 제 표지 IMG-0013~0026 을 그려 끼움(v1417). 홈에서 그대로 둔 것: 출산택일 · 정통궁합 · 웹툰궁합 · 연애 · 정통사주 표지(사장님이 좋다 한 화풍). IMG-0008~0012 는 그림이 `out/` 에 와 있지만 **취소** — 10-23 사장님 「현재 출산택일 · 정통궁합 · 웹툰궁합 표지로 쓰고 있는 삽화 스타일이 좋다」. 홈 표지 다섯(taekil-main · gunghap-main · ssom-main · love-main · saju-main)과 첫 만남 띠는 그대로 두고, 앞으로 표지를 새로 그릴 땐 그 셋을 맞출 본보기로 쓴다(README 「화풍」). 원본은 out/ 에 남겨 둔다.

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
| IMG-0013 | 홈 「SSS급 그 사람 사용설명서」 표지 — 보는 여자의 눈으로: 앞자리에 앉은 그 남자가 폰을 들고 나를 보며 웃는다 | 적용됨(홈 「SSS급 그 사람 사용설명서」 칸 · og) | IMG-0013-pair.md | out/IMG-0013.png | app/art/pair-cover.webp |
| IMG-0014 | 홈 「결혼상대 점검」 표지 — 밝은 봄길을 걷다 한 걸음 앞서 웃는 남자를, 여자가 옆에서 「이 사람과 결혼해도 될까」 하는 얼굴로 바라본다 | 적용됨(홈 「결혼상대 점검」 칸 · og) | IMG-0014-gyeolhon.md | out/IMG-0014.png | app/art/gyeolhon-cover.webp |
| IMG-0015 | 홈 「새로 만난 그 사람」 표지 — 보는 사람의 눈으로: 밝은 첫 만남 자리에서 새 사람(남자)이 빈 명함을 내밀며 웃는다 | 적용됨(홈 「새로 만난 그 사람」 칸 · og) | IMG-0015-saram.md | out/IMG-0015.png | app/art/saram-cover.webp |
| IMG-0016 | 홈 「나는 고지능일까」 표지 · 여자 — 보는 사람 자신: 햇살 드는 책상에서 펜을 입술에 대고 「나는?」 하며 장난스럽게 눈썹을 올려 나를 본다 | 적용됨(홈 「나는 고지능일까」 칸 · og) | IMG-0016-brain-f.md | out/IMG-0016.png | app/art/brain-cover-f.webp |
| IMG-0017 | 홈 「나는 고지능일까」 표지 · 남자 — 보는 사람 자신: 햇살 드는 책상에서 펜을 입술에 대고 「나는?」 하며 장난스럽게 눈썹을 올려 나를 본다 | 적용됨(홈 「나는 고지능일까」 칸 · og) | IMG-0017-brain-m.md | out/IMG-0017.png | app/art/brain-cover-m.webp |
| IMG-0018 | 홈 「나는 귀한 사람일까」 표지 · 여자 — 보는 사람 자신: 햇살 드는 방에서 일어서서 여럿 앞에 말하고, 앉은 사람들이 돌아본다 | 적용됨(홈 「나는 귀한 사람일까」 칸 · og) | IMG-0018-gwi-f.md | out/IMG-0018.png | app/art/gwi-cover-f.webp |
| IMG-0019 | 홈 「나는 귀한 사람일까」 표지 · 남자 — 보는 사람 자신: 햇살 드는 방에서 일어서서 여럿 앞에 말하고, 앉은 사람들이 돌아본다 | 적용됨(홈 「나는 귀한 사람일까」 칸 · og) | IMG-0019-gwi-m.md | out/IMG-0019.png | app/art/gwi-cover-m.webp |
| IMG-0020 | 홈 「옛 책은 내 명식을 반겼을까」 표지 · 여자 — 보는 사람 자신: 햇살 드는 옛 책방에서 펼친 옛 책(빈 쪽)을 들고 「반겼을까?」 하는 기대 어린 얼굴로 고개를 든다 | 적용됨(홈 「옛 책은 내 명식을 반겼을까」 칸 · og) | IMG-0020-gyeokgi-f.md | out/IMG-0020.png | app/art/gyeokgi-cover-f.webp |
| IMG-0021 | 홈 「옛 책은 내 명식을 반겼을까」 표지 · 남자 — 보는 사람 자신: 햇살 드는 옛 책방에서 펼친 옛 책(빈 쪽)을 들고 「반겼을까?」 하는 기대 어린 얼굴로 고개를 든다 | 적용됨(홈 「옛 책은 내 명식을 반겼을까」 칸 · og) | IMG-0021-gyeokgi-m.md | out/IMG-0021.png | app/art/gyeokgi-cover-m.webp |
| IMG-0022 | 홈 「내 명반에는 무엇이 적혀 있을까」 표지 · 여자 — 보는 사람 자신: 밝은 탁자 위 큰 네모 표(열두 칸, 빈 칸)에 손가락을 짚고 「여기엔 뭐가 적혀 있을까」 하는 호기심 어린 얼굴 | 적용됨(홈 「내 명반에는 무엇이 적혀 있을까」 칸 · og) | IMG-0022-myeongban-f.md | out/IMG-0022.png | app/art/myeongban-cover-f.webp |
| IMG-0023 | 홈 「내 명반에는 무엇이 적혀 있을까」 표지 · 남자 — 보는 사람 자신: 밝은 탁자 위 큰 네모 표(열두 칸, 빈 칸)에 손가락을 짚고 「여기엔 뭐가 적혀 있을까」 하는 호기심 어린 얼굴 | 적용됨(홈 「내 명반에는 무엇이 적혀 있을까」 칸 · og) | IMG-0023-myeongban-m.md | out/IMG-0023.png | app/art/myeongban-cover-m.webp |
| IMG-0024 | 홈 「언제 나아지나」 표지 · 여자 — 보는 사람 자신: 비 갠 창가, 구름이 갈라지며 첫 햇살이 얼굴에 닿는 순간 고개를 든다 | 적용됨(홈 「언제 나아지나」 칸 · og) | IMG-0024-when-f.md | out/IMG-0024.png | app/art/when-cover-f.webp |
| IMG-0025 | 홈 「언제 나아지나」 표지 · 남자 — 보는 사람 자신: 비 갠 창가, 구름이 갈라지며 첫 햇살이 얼굴에 닿는 순간 고개를 든다 | 적용됨(홈 「언제 나아지나」 칸 · og) | IMG-0025-when-m.md | out/IMG-0025.png | app/art/when-cover-m.webp |
| IMG-0026 | 홈 「읽을거리」 표지 — 햇살 드는 창가 자리에 웅크려 앉아 옛 책을 읽다가 「아, 그래서였구나」 하는 얼굴 | 적용됨(홈 「읽을거리」 칸 · og) | IMG-0026-read.md | out/IMG-0026.png | app/art/read-cover.webp |
| IMG-0027 | 출산택일 소개 — 추천서를 건네는 책사 | 적용됨(3e17fb9c · 실제 화면 확인) | IMG-0027-taekil-advisor-offer.md | 삽화원본/taekil-advisor-offer-v1.png(로컬) | app/art/taekil-advisor-offer-v1.webp |
| IMG-0028 | 출산택일 제작 설명 — 근거를 확인하는 같은 책사 | 적용됨(3e17fb9c · 실제 화면 확인) | IMG-0028-taekil-advisor-review.md | 삽화원본/taekil-advisor-review-v1.png(로컬) | app/art/taekil-advisor-review-v1.webp |
| IMG-0029 | 오늘의 운세 — 아침 알림과 시계 | 생성·연결 완료, 통합 대기 | IMG-0029-today-home.md | 삽화원본/today-cover-v1.png(로컬) | app/art/today-cover-v1.webp |
