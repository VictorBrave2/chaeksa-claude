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
| IMG-0029 | 오늘의 운세 — 아침 알림과 시계 | 취소(IMG-0077 · 현대 소품 제외) | IMG-0029-today-home.md | 삽화원본/today-cover-v1.png(로컬) | app/art/today-cover-v1.webp |
| IMG-0030 | 오늘의 예고를 전하는 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0030-today-guide.md | 삽화원본/today-forecast-m-v1.png(로컬) | app/art/today-guides/forecast-m-v1.webp |
| IMG-0031 | 생각과 행동을 설명하는 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0031-today-guide.md | 삽화원본/today-thought-f-v1.png(로컬) | app/art/today-guides/thought-f-v1.webp |
| IMG-0032 | 다음 일주일을 함께 살펴보는 두 사람 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0032-today-guide.md | 삽화원본/today-week-pair-v1.png(로컬) | app/art/today-guides/week-pair-v1.webp |
| IMG-0033 | 연락·재확인 · 남신 | 취소(IMG-0063 · 현대 소품 제외) | IMG-0033-today-contact-m.md | 삽화원본/today-events/contact-m-v1.png(로컬) | app/art/today-events/contact-m-v1.webp |
| IMG-0034 | 연락·재확인 · 여신 | 취소(IMG-0064 · 현대 소품 제외) | IMG-0034-today-contact-f.md | 삽화원본/today-events/contact-f-v1.png(로컬) | app/art/today-events/contact-f-v1.webp |
| IMG-0035 | 단호한 대화 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0035-today-firm-m.md | 삽화원본/today-events/firm-m-v1.png(로컬) | app/art/today-events/firm-m-v1.webp |
| IMG-0036 | 단호한 대화 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0036-today-firm-f.md | 삽화원본/today-events/firm-f-v1.png(로컬) | app/art/today-events/firm-f-v1.webp |
| IMG-0037 | 말다툼·오해 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0037-today-argument-m.md | 삽화원본/today-events/argument-m-v1.png(로컬) | app/art/today-events/argument-m-v1.webp |
| IMG-0038 | 말다툼·오해 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0038-today-argument-f.md | 삽화원본/today-events/argument-f-v1.png(로컬) | app/art/today-events/argument-f-v1.webp |
| IMG-0039 | 계획·시간 변경 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0039-today-reschedule-m.md | 삽화원본/today-events/reschedule-m-v1.png(로컬) | app/art/today-events/reschedule-m-v1.webp |
| IMG-0040 | 계획·시간 변경 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0040-today-reschedule-f.md | 삽화원본/today-events/reschedule-f-v1.png(로컬) | app/art/today-events/reschedule-f-v1.webp |
| IMG-0041 | 자리 이탈 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0041-today-departure-m.md | 삽화원본/today-events/departure-m-v1.png(로컬) | app/art/today-events/departure-m-v1.webp |
| IMG-0042 | 자리 이탈 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0042-today-departure-f.md | 삽화원본/today-events/departure-f-v1.png(로컬) | app/art/today-events/departure-f-v1.webp |
| IMG-0043 | 돈을 씀 · 남신 | 취소(IMG-0065 · 현대 소품 제외) | IMG-0043-today-expense-m.md | 삽화원본/today-events/expense-m-v1.png(로컬) | app/art/today-events/expense-m-v1.webp |
| IMG-0044 | 돈을 씀 · 여신 | 취소(IMG-0066 · 현대 소품 제외) | IMG-0044-today-expense-f.md | 삽화원본/today-events/expense-f-v1.png(로컬) | app/art/today-events/expense-f-v1.webp |
| IMG-0045 | 대가·보상 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0045-today-reward-m.md | 삽화원본/today-events/reward-m-v1.png(로컬) | app/art/today-events/reward-m-v1.webp |
| IMG-0046 | 대가·보상 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0046-today-reward-f.md | 삽화원본/today-events/reward-f-v1.png(로컬) | app/art/today-events/reward-f-v1.webp |
| IMG-0047 | 금액 확인·차질 · 남신 | 취소(IMG-0067 · 현대 소품 제외) | IMG-0047-today-money-check-m.md | 삽화원본/today-events/money-check-m-v1.png(로컬) | app/art/today-events/money-check-m-v1.webp |
| IMG-0048 | 금액 확인·차질 · 여신 | 취소(IMG-0068 · 현대 소품 제외) | IMG-0048-today-money-check-f.md | 삽화원본/today-events/money-check-f-v1.png(로컬) | app/art/today-events/money-check-f-v1.webp |
| IMG-0049 | 돈·거래 약속 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0049-today-agreement-m.md | 삽화원본/today-events/agreement-m-v1.png(로컬) | app/art/today-events/agreement-m-v1.webp |
| IMG-0050 | 돈·거래 약속 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0050-today-agreement-f.md | 삽화원본/today-events/agreement-f-v1.png(로컬) | app/art/today-events/agreement-f-v1.webp |
| IMG-0051 | 함께하기·분담 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0051-today-teamwork-m.md | 삽화원본/today-events/teamwork-m-v1.png(로컬) | app/art/today-events/teamwork-m-v1.webp |
| IMG-0052 | 함께하기·분담 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0052-today-teamwork-f.md | 삽화원본/today-events/teamwork-f-v1.png(로컬) | app/art/today-events/teamwork-f-v1.webp |
| IMG-0053 | 도움을 주고받음 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0053-today-support-m.md | 삽화원본/today-events/support-m-v1.png(로컬) | app/art/today-events/support-m-v1.webp |
| IMG-0054 | 도움을 주고받음 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0054-today-support-f.md | 삽화원본/today-events/support-f-v1.png(로컬) | app/art/today-events/support-f-v1.webp |
| IMG-0055 | 업무·재작업 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0055-today-work-m.md | 삽화원본/today-events/work-m-v1.png(로컬) | app/art/today-events/work-m-v1.webp |
| IMG-0056 | 업무·재작업 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0056-today-work-f.md | 삽화원본/today-events/work-f-v1.png(로컬) | app/art/today-events/work-f-v1.webp |
| IMG-0057 | 서류 확인·제출 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0057-today-documents-m.md | 삽화원본/today-events/documents-m-v1.png(로컬) | app/art/today-events/documents-m-v1.webp |
| IMG-0058 | 서류 확인·제출 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0058-today-documents-f.md | 삽화원본/today-events/documents-f-v1.png(로컬) | app/art/today-events/documents-f-v1.webp |
| IMG-0059 | 배움·방법 변경 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0059-today-learning-m.md | 삽화원본/today-events/learning-m-v1.png(로컬) | app/art/today-events/learning-m-v1.webp |
| IMG-0060 | 배움·방법 변경 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0060-today-learning-f.md | 삽화원본/today-events/learning-f-v1.png(로컬) | app/art/today-events/learning-f-v1.webp |
| IMG-0061 | 멈춤·말을 아낌 · 남신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0061-today-quiet-m.md | 삽화원본/today-events/quiet-m-v1.png(로컬) | app/art/today-events/quiet-m-v1.webp |
| IMG-0062 | 멈춤·말을 아낌 · 여신 | 적용됨(a4ef62ec · v1508 공개 배포 · 실제 화면 확인) | IMG-0062-today-quiet-f.md | 삽화원본/today-events/quiet-f-v1.png(로컬) | app/art/today-events/quiet-f-v1.webp |
| IMG-0063 | 「왜 내게만」 홈 표지 · 여(다시 식사값을 치름 — 「또 나야?」) | 생성됨 | IMG-0063-why-cover-f.md | image-requests/out/IMG-0063.png | app/art/why-cover-f.webp |
| IMG-0064 | 「왜 내게만」 홈 표지 · 남(같은 장면) | 생성됨 | IMG-0064-why-cover-m.md | image-requests/out/IMG-0064.png | app/art/why-cover-m.webp |
| IMG-0065 | 「세 관점이 모인 한 점」 홈 표지 · 여(뒤집힌 카드 일곱 중 한 장을 집으려는 순간 · 빛줄기 셋이 한 점으로) | 요청 | IMG-0065-three-eyes-cover-f.md | image-requests/out/IMG-0065.png | app/art/three-cover-f.webp |
| IMG-0066 | 「세 관점이 모인 한 점」 홈 표지 · 남(같은 장면) | 요청 | IMG-0066-three-eyes-cover-m.md | image-requests/out/IMG-0066.png | app/art/three-cover-m.webp |
| IMG-0067 | 금액 확인·차질 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0067-today-money-check-m-timeless.md | 삽화원본/today-events/money-check-m-v2.png(로컬) | app/art/today-events/money-check-m-v2.webp |
| IMG-0068 | 금액 확인·차질 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0068-today-money-check-f-timeless.md | 삽화원본/today-events/money-check-f-v2.png(로컬) | app/art/today-events/money-check-f-v2.webp |
| IMG-0069 | 계획 취소 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0069-today-cancellation-m-timeless.md | 삽화원본/today-events/cancellation-m-v1.png(로컬) | app/art/today-events/cancellation-m-v1.webp |
| IMG-0070 | 계획 취소 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0070-today-cancellation-f-timeless.md | 삽화원본/today-events/cancellation-f-v1.png(로컬) | app/art/today-events/cancellation-f-v1.webp |
| IMG-0071 | 거절·허락받지 못함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0071-today-refusal-m-timeless.md | 삽화원본/today-events/refusal-m-v1.png(로컬) | app/art/today-events/refusal-m-v1.webp |
| IMG-0072 | 거절·허락받지 못함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0072-today-refusal-f-timeless.md | 삽화원본/today-events/refusal-f-v1.png(로컬) | app/art/today-events/refusal-f-v1.webp |
| IMG-0073 | 일을 마무리함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0073-today-completion-m-timeless.md | 삽화원본/today-events/completion-m-v1.png(로컬) | app/art/today-events/completion-m-v1.webp |
| IMG-0074 | 일을 마무리함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0074-today-completion-f-timeless.md | 삽화원본/today-events/completion-f-v1.png(로컬) | app/art/today-events/completion-f-v1.webp |
| IMG-0075 | 도움을 나눔 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0075-today-sharing-m-timeless.md | 삽화원본/today-events/sharing-m-v1.png(로컬) | app/art/today-events/sharing-m-v1.webp |
| IMG-0076 | 도움을 나눔 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0076-today-sharing-f-timeless.md | 삽화원본/today-events/sharing-f-v1.png(로컬) | app/art/today-events/sharing-f-v1.webp |
| IMG-0077 | 오늘의 운세 홈 표지 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0077-today-cover-v2-timeless.md | 삽화원본/today-cover-v2.png(로컬) | app/art/today-cover-v2.webp |
| IMG-0078 | 집안일로 돌아감 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0078-today-homeward-m.md | 삽화원본/today-events/homeward-m-v1.png(로컬) | app/art/today-events/homeward-m-v1.webp |
| IMG-0079 | 집안일로 돌아감 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0079-today-homeward-f.md | 삽화원본/today-events/homeward-f-v1.png(로컬) | app/art/today-events/homeward-f-v1.webp |
| IMG-0080 | 밥을 사거나 대접함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0080-today-hosting-m.md | 삽화원본/today-events/hosting-m-v1.png(로컬) | app/art/today-events/hosting-m-v1.webp |
| IMG-0081 | 밥을 사거나 대접함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0081-today-hosting-f.md | 삽화원본/today-events/hosting-f-v1.png(로컬) | app/art/today-events/hosting-f-v1.webp |
| IMG-0082 | 일한 대가로 돈을 받음 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0082-today-payday-m.md | 삽화원본/today-events/payday-m-v1.png(로컬) | app/art/today-events/payday-m-v1.webp |
| IMG-0083 | 일한 대가로 돈을 받음 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0083-today-payday-f.md | 삽화원본/today-events/payday-f-v1.png(로컬) | app/art/today-events/payday-f-v1.webp |
| IMG-0084 | 만든 것을 팔기로 함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0084-today-selling-m.md | 삽화원본/today-events/selling-m-v1.png(로컬) | app/art/today-events/selling-m-v1.webp |
| IMG-0085 | 만든 것을 팔기로 함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0085-today-selling-f.md | 삽화원본/today-events/selling-f-v1.png(로컬) | app/art/today-events/selling-f-v1.webp |
| IMG-0086 | 도움을 부탁함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0086-today-ask-help-m.md | 삽화원본/today-events/ask-help-m-v1.png(로컬) | app/art/today-events/ask-help-m-v1.webp |
| IMG-0087 | 도움을 부탁함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0087-today-ask-help-f.md | 삽화원본/today-events/ask-help-f-v1.png(로컬) | app/art/today-events/ask-help-f-v1.webp |
| IMG-0088 | 도움에 고마움을 전함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0088-today-gratitude-m.md | 삽화원본/today-events/gratitude-m-v1.png(로컬) | app/art/today-events/gratitude-m-v1.webp |
| IMG-0089 | 도움에 고마움을 전함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0089-today-gratitude-f.md | 삽화원본/today-events/gratitude-f-v1.png(로컬) | app/art/today-events/gratitude-f-v1.webp |
| IMG-0090 | 서류를 제출함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0090-today-submission-m.md | 삽화원본/today-events/submission-m-v1.png(로컬) | app/art/today-events/submission-m-v1.webp |
| IMG-0091 | 서류를 제출함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0091-today-submission-f.md | 삽화원본/today-events/submission-f-v1.png(로컬) | app/art/today-events/submission-f-v1.webp |
| IMG-0092 | 빠진 서류를 찾음 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0092-today-missing-paper-m.md | 삽화원본/today-events/missing-paper-m-v1.png(로컬) | app/art/today-events/missing-paper-m-v1.webp |
| IMG-0093 | 빠진 서류를 찾음 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0093-today-missing-paper-f.md | 삽화원본/today-events/missing-paper-f-v1.png(로컬) | app/art/today-events/missing-paper-f-v1.webp |
| IMG-0094 | 오해를 풀어 설명함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0094-today-explanation-m.md | 삽화원본/today-events/explanation-m-v1.png(로컬) | app/art/today-events/explanation-m-v1.webp |
| IMG-0095 | 오해를 풀어 설명함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0095-today-explanation-f.md | 삽화원본/today-events/explanation-f-v1.png(로컬) | app/art/today-events/explanation-f-v1.webp |
| IMG-0096 | 내 몫을 지킴 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0096-today-protect-share-m.md | 삽화원본/today-events/protect-share-m-v1.png(로컬) | app/art/today-events/protect-share-m-v1.webp |
| IMG-0097 | 내 몫을 지킴 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0097-today-protect-share-f.md | 삽화원본/today-events/protect-share-f-v1.png(로컬) | app/art/today-events/protect-share-f-v1.webp |
| IMG-0098 | 끝낸 일을 다시 함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0098-today-restart-m.md | 삽화원본/today-events/restart-m-v1.png(로컬) | app/art/today-events/restart-m-v1.webp |
| IMG-0099 | 끝낸 일을 다시 함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0099-today-restart-f.md | 삽화원본/today-events/restart-f-v1.png(로컬) | app/art/today-events/restart-f-v1.webp |
| IMG-0100 | 배운 것을 직접 만듦 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0100-today-craft-m.md | 삽화원본/today-events/craft-m-v1.png(로컬) | app/art/today-events/craft-m-v1.webp |
| IMG-0101 | 배운 것을 직접 만듦 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0101-today-craft-f.md | 삽화원본/today-events/craft-f-v1.png(로컬) | app/art/today-events/craft-f-v1.webp |
| IMG-0102 | 모임이 흩어짐 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0102-today-disband-m.md | 삽화원본/today-events/disband-m-v1.png(로컬) | app/art/today-events/disband-m-v1.webp |
| IMG-0103 | 모임이 흩어짐 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0103-today-disband-f.md | 삽화원본/today-events/disband-f-v1.png(로컬) | app/art/today-events/disband-f-v1.webp |
| IMG-0104 | 사람과 거리 두기 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0104-today-distance-m.md | 삽화원본/today-events/distance-m-v1.png(로컬) | app/art/today-events/distance-m-v1.webp |
| IMG-0105 | 사람과 거리 두기 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0105-today-distance-f.md | 삽화원본/today-events/distance-f-v1.png(로컬) | app/art/today-events/distance-f-v1.webp |
| IMG-0106 | 맡을 일이 늘어남 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0106-today-workload-m.md | 삽화원본/today-events/workload-m-v1.png(로컬) | app/art/today-events/workload-m-v1.webp |
| IMG-0107 | 맡을 일이 늘어남 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0107-today-workload-f.md | 삽화원본/today-events/workload-f-v1.png(로컬) | app/art/today-events/workload-f-v1.webp |
| IMG-0108 | 맡은 일이 바뀜 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0108-today-reassignment-m.md | 삽화원본/today-events/reassignment-m-v1.png(로컬) | app/art/today-events/reassignment-m-v1.webp |
| IMG-0109 | 맡은 일이 바뀜 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0109-today-reassignment-f.md | 삽화원본/today-events/reassignment-f-v1.png(로컬) | app/art/today-events/reassignment-f-v1.webp |
| IMG-0110 | 배우는 데 돈을 씀 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0110-today-tuition-m.md | 삽화원본/today-events/tuition-m-v1.png(로컬) | app/art/today-events/tuition-m-v1.webp |
| IMG-0111 | 배우는 데 돈을 씀 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0111-today-tuition-f.md | 삽화원본/today-events/tuition-f-v1.png(로컬) | app/art/today-events/tuition-f-v1.webp |
| IMG-0112 | 하고 싶던 일에 지출 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0112-today-self-reward-m.md | 삽화원본/today-events/self-reward-m-v1.png(로컬) | app/art/today-events/self-reward-m-v1.webp |
| IMG-0113 | 하고 싶던 일에 지출 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0113-today-self-reward-f.md | 삽화원본/today-events/self-reward-f-v1.png(로컬) | app/art/today-events/self-reward-f-v1.webp |
| IMG-0114 | 도움에 대가를 건넴 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0114-today-repay-m.md | 삽화원본/today-events/repay-m-v1.png(로컬) | app/art/today-events/repay-m-v1.webp |
| IMG-0115 | 도움에 대가를 건넴 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0115-today-repay-f.md | 삽화원본/today-events/repay-f-v1.png(로컬) | app/art/today-events/repay-f-v1.webp |
| IMG-0116 | 들어올 돈이 끊김 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0116-today-income-stop-m.md | 삽화원본/today-events/income-stop-m-v1.png(로컬) | app/art/today-events/income-stop-m-v1.webp |
| IMG-0117 | 들어올 돈이 끊김 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0117-today-income-stop-f.md | 삽화원본/today-events/income-stop-f-v1.png(로컬) | app/art/today-events/income-stop-f-v1.webp |
| IMG-0118 | 비용부터 정함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0118-today-budget-m.md | 삽화원본/today-events/budget-m-v1.png(로컬) | app/art/today-events/budget-m-v1.webp |
| IMG-0119 | 비용부터 정함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0119-today-budget-f.md | 삽화원본/today-events/budget-f-v1.png(로컬) | app/art/today-events/budget-f-v1.webp |
| IMG-0120 | 내 이야기를 많이 함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0120-today-storytelling-m.md | 삽화원본/today-events/storytelling-m-v1.png(로컬) | app/art/today-events/storytelling-m-v1.webp |
| IMG-0121 | 내 이야기를 많이 함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0121-today-storytelling-f.md | 삽화원본/today-events/storytelling-f-v1.png(로컬) | app/art/today-events/storytelling-f-v1.webp |
| IMG-0122 | 내 편이 되어 줌 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0122-today-ally-m.md | 삽화원본/today-events/ally-m-v1.png(로컬) | app/art/today-events/ally-m-v1.webp |
| IMG-0123 | 내 편이 되어 줌 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0123-today-ally-f.md | 삽화원본/today-events/ally-f-v1.png(로컬) | app/art/today-events/ally-f-v1.webp |
| IMG-0124 | 맡은 일을 나눔 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0124-today-delegation-m.md | 삽화원본/today-events/delegation-m-v1.png(로컬) | app/art/today-events/delegation-m-v1.webp |
| IMG-0125 | 맡은 일을 나눔 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0125-today-delegation-f.md | 삽화원본/today-events/delegation-f-v1.png(로컬) | app/art/today-events/delegation-f-v1.webp |
| IMG-0126 | 허락받지 못함 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0126-today-permission-denied-m.md | 삽화원본/today-events/permission-denied-m-v1.png(로컬) | app/art/today-events/permission-denied-m-v1.webp |
| IMG-0127 | 허락받지 못함 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0127-today-permission-denied-f.md | 삽화원본/today-events/permission-denied-f-v1.png(로컬) | app/art/today-events/permission-denied-f-v1.webp |
| IMG-0128 | 조언으로 방법을 바꿈 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0128-today-change-method-m.md | 삽화원본/today-events/change-method-m-v1.png(로컬) | app/art/today-events/change-method-m-v1.webp |
| IMG-0129 | 조언으로 방법을 바꿈 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0129-today-change-method-f.md | 삽화원본/today-events/change-method-f-v1.png(로컬) | app/art/today-events/change-method-f-v1.webp |
| IMG-0130 | 정해진 시간에 마무리 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0130-today-deadline-m.md | 삽화원본/today-events/deadline-m-v1.png(로컬) | app/art/today-events/deadline-m-v1.webp |
| IMG-0131 | 정해진 시간에 마무리 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0131-today-deadline-f.md | 삽화원본/today-events/deadline-f-v1.png(로컬) | app/art/today-events/deadline-f-v1.webp |
| IMG-0132 | 충고를 듣고 말을 멈춤 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0132-today-hold-tongue-m.md | 삽화원본/today-events/hold-tongue-m-v1.png(로컬) | app/art/today-events/hold-tongue-m-v1.webp |
| IMG-0133 | 충고를 듣고 말을 멈춤 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0133-today-hold-tongue-f.md | 삽화원본/today-events/hold-tongue-f-v1.png(로컬) | app/art/today-events/hold-tongue-f-v1.webp |
| IMG-0134 | 연락·재확인 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0134-today-contact-m-timeless.md | 삽화원본/today-events/contact-m-v2.png(로컬) | app/art/today-events/contact-m-v2.webp |
| IMG-0135 | 연락·재확인 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0135-today-contact-f-timeless.md | 삽화원본/today-events/contact-f-v2.png(로컬) | app/art/today-events/contact-f-v2.webp |
| IMG-0136 | 돈을 씀 · 남신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0136-today-expense-m-timeless.md | 삽화원본/today-events/expense-m-v2.png(로컬) | app/art/today-events/expense-m-v2.webp |
| IMG-0137 | 돈을 씀 · 여신 | 적용됨(v1519 공개 배포 · 10-30 main 합침) | IMG-0137-today-expense-f-timeless.md | 삽화원본/today-events/expense-f-v2.png(로컬) | app/art/today-events/expense-f-v2.webp |
