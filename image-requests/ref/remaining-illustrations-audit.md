# 남은 모바일·본문 삽화 소비처 조사

읽기 전용 조사 · 2026-11-01 · 기준 체크아웃 HEAD `e67ebc4d`. 코드·이미지 수정, 생성, 테스트, 배포 없이 파일과 호출 경로만 읽었다. 공개 서버의 배포 시각이나 로그인 뒤 서버 응답은 확인하지 않았다. 아래 ‘현재’는 이 체크아웃에서 고객 화면으로 이어지는 정적 호출 경로가 있다는 뜻이다.

## 수량 기준

- 한 장은 고유 원본 장면이다. `-s.webp`와 Kakao JPG는 같은 장면의 파생 파일로 별도 장수에 넣지 않았다. 사용칸은 같은 그림을 다시 쓰면 각각 센다.
- 요청한 소비처의 **고유 원본 101장**. 이 중 love·pair·ssom의 합집합은 **83장**이다.
- 별도 정통사주 장면 보기의 jt 계열은 **60장**(20화×남녀 40 + 격10×남녀 20). 그중 7장은 이미 pair에 포함된다. 둘을 합친 원본은 **154장**이다. 정통사주 담당 범위와 겹치므로 중복 제작하지 않는다.
- 전체 art 루트의 story 원본 82장 중 본 조사 공개 소비처에서 41장 사용, 현재 단계표보다 뒤에서만 쓰이는 fallback 5장, 옛 이야기 흐름에만 남은 후보 36장. ss 원본 36장은 모두 현재 사용한다. jt 원본 60장도 별도 장면 보기로 도달할 수 있어 전부 legacy로 볼 수 없다.
- 별도로 출산택일 보고서 안내의 `promos/taekil-report/01~06.webp` **6개**는 문구·가격·견본이 들어간 홍보 슬라이드다. 위 삽화 장수에 넣지 않았다.
- 조사 당시에는 기존 인물 얼굴 유지 요청이었다. 이후 2026-11-01 사용자가 얼굴 기준을 수정해, 새 삽화는 승인된 타로 P14 남성·P13 여성 얼굴과 화풍으로 통일한다. 기존 파일은 장면·감정 확인용이며 현재 얼굴 기준이 아니다.

## 소비 파일별 장수와 살아 있는 경로

| 소비처 | 사용칸 / 고유 원본 | 현재 경로와 조건 |
|---|---:|---|
| love.js | 본문10 + 표지1 = 11 | index.html:809 로드 → app.js:684. 서버 장 이름이 표에 있을 때만 삽화. 알 수 없는 장은 그림 없이 글. 표지는 미리보기·결과·공유에 재사용. |
| pair.js | 질문47×상대성별2=94칸 / 75장 + 별도 표지1 = 76장 | index.html:810 → app.js:685. 그림키는 서버 c.bg가 있으면 우선, 없으면 q01~q47 표. 상대 F면 둘째, 나머지는 첫째. 표지와 알 수 없는 장면 fallback은 story-friend-to-lover. |
| ssom.js | 총론4 + 단계31 = 35장 | index.html:859 → app.js:1077. 글 보기 -s.webp, 장면 보기 원본. 단계 선택8칸은 이35장 안에서 다시 사용. |
| ssom-card.js 연애 카드 | 조건2 / 2장 | 사이=으뜸이면 ss-then-now, 아니면 ss-give. ssom 35장에 새로 보태는 것은 ss-then-now 1장. 화면·저장·Kakao에 재사용. |
| ssom-vn.html | ssom35 및 pair75+fallback 전달, jt60 | ssom.js:160~184·pair.js:69~76에서 실제 이동. 정통사주는 bunya.js jt.h* → home-ask.js:51 → app.js:2189. 번호3·4·15는 격이 알려지면 같은 격 그림을 세 번 사용. |
| gunghap-chongnon.js / gunghap-1cheung.js | 본문 0 | 현재 렌더러에 img/art 경로 없음. gunghap-chongnon.html:64·home-cats.js:19의 gunghap-main 표지1은 현재 사용. |
| ilgyeol.html | 성별2 / 2장 | ilgyeol-{m,f}.webp, M이면 m·그 밖에는 f, noscript f. 홈도 같은 그림. |
| ilgyeol-apply.html / -apply.js | 0 | 신청 화면에 본문 삽화 없음. |
| ilgyeol-report.html | 공개 소비 코드에 고정 삽화 0 | 서버 rep.html을 iframe.srcdoc에 표시(:191). 비공개 보고서 안쪽 자산 수는 이 공개 저장소로 확정할 수 없다. |
| gyeolhon.html | 4장 | 소개 hero story-sanggyeonrye + 결론 같이/맞춰/다시 각1. |
| gyeolhon-apply.html | 1장 | gyeolhon-apply. |
| gyeolhon-sample.html | 1장 | story-marry-talk-s. 이미 소개의 ‘맞춰’와 같은 원본. |
| home-cats.js 해당 범위 | 9슬롯 / 10장 | love·pair·taekil·gyeolhon·chongnon·ssom·saram·read 각1, ilgyeol 남녀2. 위 본문·소개와 합집합 처리. |
| saram.html / saram.js | 본문 0 | 사람 수·관계 표와 텍스트. 홈의 saram-cover 1은 별도 현재 표지. |
| read.html | 본문 0 | 읽을거리 링크 목록. 목록에 직접 연결된 글의 본문 art 이미지도 0(바닥글의 상품 링크 제외). 홈의 read-cover 1은 현재 표지. |
| taekil 관련 HTML 43개 | 아래 파일별 표 | 고유 art 원본6 + 홈 taekil-main1 = 7장. 별도 홍보 슬라이드6. |

## love.js — 장 이름과 원본

| 조건(서버 장 이름) | 원본 |
|---|---|
| 마음에 드는 사람이 생겼을 때 | `art/story-maeum.webp` |
| 썸을 탈 때 | `art/ss-sseom-6.webp` |
| 연애가 시작됐을 때 | `art/story-first-touch.webp` |
| 연락과 애정표현 | `art/story-contact.webp` |
| 질투와 신뢰 | `art/story-jealous.webp` |
| 싸웠을 때 | `art/story-fight.webp` |
| 관계가 흔들릴 때 | `art/ss-shake-3.webp` |
| 권태가 왔을 때 | `art/ss-steady-1.webp` |
| 이별과 재회 | `art/ss-again-3.webp` |
| 오래 함께할 때 | `art/ss-steady-4.webp` |
| 표지·공유 | `art/love-cover.webp` |

## pair.js — 47질문 × 상대 성별

질문 문장 자체는 비공개 서버가 전달한다. 여기서는 공개 코드의 정확한 질문 ID와 선택 조건을 기록한다. 각 키는 `art/<키>.webp`이며 원본을 사용한다. 남녀 동일 그림은 q04·q14·q17·q19·q25·q26·q28·q43, 8질문이다. 94칸을 75장으로 쓰므로 표 안 중복 슬롯은 19개다.

| 질문 | 상대 M 또는 F 이외 | 상대 F |
|---|---|---|
| q01 | story-ask-favor | ss-her |
| q02 | story-he-likes | story-office-crush |
| q03 | ss-give | ss-meet-party |
| q04 | ss-meet-app | ss-meet-app |
| q05 | ss-sseom-4 | story-reply |
| q06 | ss-sseom-3 | story-confess |
| q07 | story-meet-friends | story-friend-money |
| q08 | story-contact | ss-early-2 |
| q09 | ss-early-1 | jt-16-alone-together-f |
| q10 | story-long-distance | jt-06-steady-f |
| q11 | story-biz-partner | story-drunk-text |
| q12 | jt-12-money-year-m | ss-her |
| q13 | jt-14-in-love-m | story-blind-date |
| q14 | story-money | story-money |
| q15 | story-big-buy | jt-11-money-stay-f |
| q16 | jt-11-money-stay-m | story-lend |
| q17 | story-say-love | story-say-love |
| q18 | story-anniversary | story-gift |
| q19 | story-first-touch | story-first-touch |
| q20 | ss-steady-4 | ss-sseom-2 |
| q21 | jt-16-alone-together-m | story-sok |
| q22 | story-cold | story-hurt |
| q23 | story-geunamja | ss-then-now |
| q24 | ss-shake-3 | ss-early-4 |
| q25 | ss-steady-2 | ss-steady-2 |
| q26 | ss-early-3 | ss-early-3 |
| q27 | ss-shake-2 | ss-shake-1 |
| q28 | story-fight | story-fight |
| q29 | story-maeum | story-hold |
| q30 | story-ask-favor | story-apology-text |
| q31 | story-jealous | ss-meet-club |
| q32 | ss-me | ss-again-2 |
| q33 | ss-meet-office | ss-meet-run |
| q34 | ss-meet-party | story-jealous |
| q35 | story-maeum | story-sns |
| q36 | ss-marry-3 | story-geunamja |
| q37 | ss-steady-1 | ss-steady-3 |
| q38 | ss-then-now | story-breakup |
| q39 | ss-again-1 | story-get-back |
| q40 | story-he-likes | ss-meet-blind |
| q41 | ss-marry-1 | ss-marry-3 |
| q42 | story-marry-talk | story-kid-talk |
| q43 | ss-marry-2 | ss-marry-2 |
| q44 | story-contract | story-spouse-money |
| q45 | ss-steady-3 | ss-early-5 |
| q46 | ss-me | story-friend-drift |
| q47 | story-sanggyeonrye | story-parents-talk |

비결제 소개 예시는 pair.js:237에서 q08/M, 즉 story-contact를 쓴다. `c.bg`로 서버가 준 별도 그림은 이 로컬 유한 목록 밖일 수 있으므로 실제 응답 확인 전에는 75장이 서버 전체를 보장한다고 말할 수 없다.

## ssom — 36장과 장면 조건

| 단계·자리 | 장면 | 원본 키 |
|---|---|---|
| 총론1 | 내 끌림과 행동 | ss-me |
| 총론2 | 상대 끌림과 행동 | ss-her |
| 총론3 | 서로 원하는 것 주고받기 | ss-give |
| 총론4 | 안고 갈 것·맞출 것 | ss-hold |
| 시작전 1 | 소개팅 | ss-meet-blind |
| 시작전 2 | 데이팅 앱 | ss-meet-app |
| 시작전 3 | 친구 모임 | ss-meet-party |
| 시작전 4 | 회사 | ss-meet-office |
| 시작전 5 | 취미 모임 | ss-meet-run |
| 시작전 6 | 학교·대외활동 | ss-meet-club |
| 썸 1 | 그 사람이 내게 끌리는 점 | ss-sseom-1 |
| 썸 2 | 내가 그 사람에게 끌리는 까닭 | ss-sseom-2 |
| 썸 3 | 먼저 다가가기 | ss-sseom-3 |
| 썸 4 | 연락 방식 | ss-sseom-4 |
| 썸 5 | 첫 데이트 | ss-sseom-5 |
| 썸 6 | 가까워지며 맞출 것 | ss-sseom-6 |
| 초반 1 | 사귄 뒤 달라짐 | ss-early-1 |
| 초반 2 | 연락 빈도 | ss-early-2 |
| 초반 3 | 첫 다툼 | ss-early-3 |
| 초반 4 | 내 서운함 말하기 | ss-early-4 |
| 초반 5 | 상대의 서운함 | ss-early-5 |
| 안정기 1 | 설렘이 줄어듦 | ss-steady-1 |
| 안정기 2 | 같은 다툼 반복 | ss-steady-2 |
| 안정기 3 | 서로 바라는 것의 어긋남 | ss-steady-3 |
| 안정기 4 | 오래 갈 수 있는지 | ss-steady-4 |
| 결혼 1 | 결혼해도 되는지 | ss-marry-1 |
| 결혼 2 | 같이 살 때 부딪힘 | ss-marry-2 |
| 결혼 3 | 결혼 이야기 꺼내기 | ss-marry-3 |
| 결혼 4 | 집안일과 역할 | ss-marry-4 |
| 흔들림 1 | 만남 지속·헤어짐 고민 | ss-shake-1 |
| 흔들림 2 | 견디지 못하는 까닭 | ss-shake-2 |
| 흔들림 3 | 더 노력할 곳 | ss-shake-3 |
| 재회 1 | 헤어진 까닭 | ss-again-1 |
| 재회 2 | 다시 연락 | ss-again-2 |
| 재회 3 | 다시 만나 바꿀 것 | ss-again-3 |
| 공유카드 | 사이=으뜸일 때; 그 밖에는 ss-give | ss-then-now |

단계 선택 썸네일 8개: 둘=ss-give · 시작전=ss-meet-blind · 썸=ss-sseom-5 · 초반=ss-early-1 · 안정기=ss-steady-4 · 결혼=ss-marry-1 · 흔들림=ss-shake-3 · 재회=ss-again-3. 새 원본을 늘리지 않고 위 장면을 재사용한다.

## 출산택일 — 43개 HTML 전수

원본만 세며 srcset의 -s는 같은 장면이다. `0`은 이 HTML의 art 삽화가 없다는 뜻이다. 보고서 안내 홍보 슬라이드와 서버 보고서 내부는 별도로 적었다.

| 파일 | 장수 | 원본·유형 |
|---|---:|---|
| taekil-2026-09-gungtong.html | 0 | — |
| taekil-2026-09.html | 0 | — |
| taekil-2026-10-gungtong.html | 0 | — |
| taekil-2026-10.html | 0 | — |
| taekil-2026-11-gungtong.html | 0 | — |
| taekil-2026-11.html | 0 | — |
| taekil-2026-12-gungtong.html | 0 | — |
| taekil-2026-12.html | 0 | — |
| taekil-2027-01-gungtong.html | 0 | — |
| taekil-2027-01.html | 0 | — |
| taekil-2027-02-gungtong.html | 0 | — |
| taekil-2027-02.html | 0 | — |
| taekil-2027-03-gungtong.html | 0 | — |
| taekil-2027-03.html | 0 | — |
| taekil-2027-04-gungtong.html | 0 | — |
| taekil-2027-04.html | 0 | — |
| taekil-2027-05-gungtong.html | 0 | — |
| taekil-2027-05.html | 0 | — |
| taekil-2027-06-gungtong.html | 0 | — |
| taekil-2027-06.html | 0 | — |
| taekil-2027-07-gungtong.html | 0 | — |
| taekil-2027-07.html | 0 | — |
| taekil-2027-08-gungtong.html | 0 | — |
| taekil-2027-08.html | 0 | — |
| taekil-admin.html | 0 | — |
| taekil-apply.html | 1 | `taekil-apply` |
| taekil-cesarean-date.html | 1 | `taekil-read` |
| taekil-doctor-schedule.html | 1 | `taekil-read` |
| taekil-fate-vs-timing.html | 1 | `taekil-read` |
| taekil-first-child.html | 1 | `taekil-read` |
| taekil-how-to-choose.html | 1 | `taekil-read` |
| taekil-lunar-december.html | 1 | `taekil-read` |
| taekil-one-day-time.html | 1 | `taekil-read` |
| taekil-price.html | 1 | `taekil-hero` |
| taekil-report-guide.html | 0 | 홍보 슬라이드 promos/taekil-report/01~06.webp 6개(삽화 합계 제외) |
| taekil-report.html | 0 | 보고서 데이터 렌더러; 고정 art 경로 없음 |
| taekil-sample.html | 1 | `taekil-report` |
| taekil-sim.html | 0 | — |
| taekil-solar-time.html | 1 | `taekil-read` |
| taekil-son-or-daughter.html | 1 | `taekil-read` |
| taekil-verify.html | 1 | `taekil-read` |
| taekil-why-different.html | 1 | `taekil-read` |
| taekil.html | 2 | `taekil-advisor-offer-v1` · `taekil-advisor-review-v1` |

taekil-read 1장이 안내 글 11개에 반복된다. taekil.html의 advisor-offer-v1·advisor-review-v1은 최근 별도 장면 2장으로 이미 분리돼 있다.

## jt — 현재 우회 경로와 60원본

- `ssom-vn.html:78~84`에 20화 기본 컷 이름이 있고, 각 m/f 두 원본이다.
- 3·4·15화는 격10종이 알려지면 `jt-g-<격>-<m|f>`로 바뀐다. 격이 없으면 해당 기본 번호 컷을 쓴다.
- `home-ask.js`는 실제 열림 상태의 `bunya.js` 목차와 질문을 읽는다. jt.h13·h14·h18 등 질문이 현재 표에 있으므로 이 장면 보기를 단순한 죽은 파일로 분류할 수 없다.
- `ssom-card.js`의 정통 공유카드도 같은 격20원본을 참조하지만, 현재 jeongtong.js에서 정통카드/정통붙이기를 부르는 곳은 발견하지 못했다. **그 공유카드 기능만 미연결 후보**이며 원본20장이 죽은 것은 아니다.

| 화 | 기본 키(m/f 각1) | 조건 |
|---|---|---|
| 1 | jt-01-born-{m,f} | 해당 화 |
| 2 | jt-02-push-{m,f} | 해당 화 |
| 3 | jt-03-seat-{m,f} | 격 있으면 아래 격 컷으로 대체 |
| 4 | jt-04-good-bad-{m,f} | 격 있으면 아래 격 컷으로 대체 |
| 5 | jt-05-who-{m,f} | 해당 화 |
| 6 | jt-06-steady-{m,f} | 해당 화 |
| 7 | jt-07-shake-{m,f} | 해당 화 |
| 8 | jt-08-power-{m,f} | 해당 화 |
| 9 | jt-09-shadow-{m,f} | 해당 화 |
| 10 | jt-10-money-in-{m,f} | 해당 화 |
| 11 | jt-11-money-stay-{m,f} | 해당 화 |
| 12 | jt-12-money-year-{m,f} | 해당 화 |
| 13 | jt-13-heart-{m,f} | 해당 화 |
| 14 | jt-14-in-love-{m,f} | 해당 화 |
| 15 | jt-15-work-{m,f} | 격 있으면 아래 격 컷으로 대체 |
| 16 | jt-16-alone-together-{m,f} | 해당 화 |
| 17 | jt-17-work-year-{m,f} | 해당 화 |
| 18 | jt-18-ten-years-{m,f} | 해당 화 |
| 19 | jt-19-return-{m,f} | 해당 화 |
| 20 | jt-20-where-{m,f} | 해당 화 |

격 컷 10×2: `jt-g-jeonggwan-{m,f}` · `jt-g-pyeongwan-{m,f}` · `jt-g-jeongjae-{m,f}` · `jt-g-pyeonjae-{m,f}` · `jt-g-jeongin-{m,f}` · `jt-g-pyeonin-{m,f}` · `jt-g-siksin-{m,f}` · `jt-g-sanggwan-{m,f}` · `jt-g-bigyeon-{m,f}` · `jt-g-geopjae-{m,f}`.

## Legacy·fallback 분리

### 현재 단계표에서 선택되지 않는 fallback 5원본

- `story-ex-contact`: ssom.js:256~260의 대체 배경. 현재 각 단계 질문 수와 전용 ss 그림 수가 일치해 정상 단계에서는 전용 그림이 먼저 선택됨.
- `story-first-date`: ssom.js:256~260의 대체 배경. 현재 각 단계 질문 수와 전용 ss 그림 수가 일치해 정상 단계에서는 전용 그림이 먼저 선택됨.
- `story-second-meet`: ssom.js:256~260의 대체 배경. 현재 각 단계 질문 수와 전용 ss 그림 수가 일치해 정상 단계에서는 전용 그림이 먼저 선택됨.
- `story-still`: ssom.js:256~260의 대체 배경. 현재 각 단계 질문 수와 전용 ss 그림 수가 일치해 정상 단계에서는 전용 그림이 먼저 선택됨.
- `story-trip`: ssom.js:256~260의 대체 배경. 현재 각 단계 질문 수와 전용 ss 그림 수가 일치해 정상 단계에서는 전용 그림이 먼저 선택됨.

나머지 단계 fallback의 story 그림은 pair·결혼 소개 등 다른 현재 소비처에서도 사용하므로 삭제 후보가 아니다.

### 옛 이야기 흐름에만 남은 원본 후보 36장

`index.html:291`은 옛 목록을 감췄다고 명시하며 wtHome은 hide(:317), stories.js는 template 안 data-for=""(:863)여서 어떤 현재 탭 꾸러미에도 배정되지 않는다. app.js:1845~1856의 story-<id> 동적 목록 생성 코드는 남아 있으나 고객에게 보이는 현재 목록은 아니다. 아래는 그 경로 외에 정확한 현재 그림 소비처를 찾지 못한 원본이다. 삭제는 별도 요청 없이 하지 않는다.

- `story-again`
- `story-ask-leave`
- `story-ask-refund`
- `story-block`
- `story-boss-bad-news`
- `story-boss-idea`
- `story-client-price`
- `story-coworker-fight`
- `story-dad-talk`
- `story-ex-birthday`
- `story-ex-drink`
- `story-exam`
- `story-friend-hurt`
- `story-gunghap`
- `story-his-friends`
- `story-ibyeol`
- `story-inlaw-talk`
- `story-inlaw-visit`
- `story-interview`
- `story-jigeum`
- `story-jjak`
- `story-junior-talk`
- `story-kid-exam`
- `story-live-together`
- `story-mom-money`
- `story-move-out`
- `story-open-shop`
- `story-parents`
- `story-parents-visit`
- `story-quit-talk`
- `story-raise`
- `story-resign`
- `story-return-stuff`
- `story-sell-used`
- `story-sibling-fight`
- `story-someone-else`

`story-jigeum`은 app.js:2218의 오래된 설명 주석에만 남고, 바로 아래 실제 상대 입력 그림은 jt-13-heart-m/f다. `story-parents`는 story-parents-talk의 부분문자열 검색에 걸리므로 별개 원본으로 구분했다. `jt-webtoon-proto.js`·jt-wongo-view.html·ssom-wongo-view.html·*-check.js는 작가/검수용이며 고객 본문 삽화 사용을 증명하지 않는다.

## 고유 원본 101장 — 모든 사용칸 대조

같은 원본을 덮어쓰기만 하면 아래 여러 장면에서 같은 그림이 계속 반복된다. 새 장면을 서로 다르게 만들려면 소비처·질문·성별 사용칸을 따로 연결해야 한다. 각 행의 원본은 장면·감정 확인용이다. 새 얼굴은 이후 확정된 P14 남성·P13 여성 기준을 따른다.

| 기존 원본 | 이 범위에서 사용하는 곳 |
|---|---|
| [gunghap-main](../../app/art/gunghap-main.webp) | 정통궁합 소개·홈 |
| [gyeolhon-apply](../../app/art/gyeolhon-apply.webp) | 결혼 점검 신청 |
| [gyeolhon-cover](../../app/art/gyeolhon-cover.webp) | 결혼 점검 홈 |
| [ilgyeol-f](../../app/art/ilgyeol-f.webp) | 일·돈 소개·홈: 여성/기본 |
| [ilgyeol-m](../../app/art/ilgyeol-m.webp) | 일·돈 소개·홈: 남성 |
| [jt-06-steady-f](../../app/art/jt-06-steady-f.webp) | pair q10 상대 F |
| [jt-11-money-stay-f](../../app/art/jt-11-money-stay-f.webp) | pair q15 상대 F |
| [jt-11-money-stay-m](../../app/art/jt-11-money-stay-m.webp) | pair q16 상대 M |
| [jt-12-money-year-m](../../app/art/jt-12-money-year-m.webp) | pair q12 상대 M |
| [jt-14-in-love-m](../../app/art/jt-14-in-love-m.webp) | pair q13 상대 M |
| [jt-16-alone-together-f](../../app/art/jt-16-alone-together-f.webp) | pair q09 상대 F |
| [jt-16-alone-together-m](../../app/art/jt-16-alone-together-m.webp) | pair q21 상대 M |
| [love-cover](../../app/art/love-cover.webp) | love 표지·공유·소개·홈 |
| [pair-cover](../../app/art/pair-cover.webp) | pair 소개·홈 |
| [read-cover](../../app/art/read-cover.webp) | 읽을거리 홈 표지 |
| [saram-cover](../../app/art/saram-cover.webp) | 사람 관계 홈 표지 |
| [ss-again-1](../../app/art/ss-again-1.webp) | pair q39 상대 M<br>ssom 재회 1: 헤어진 까닭 |
| [ss-again-2](../../app/art/ss-again-2.webp) | pair q32 상대 F<br>ssom 재회 2: 다시 연락 |
| [ss-again-3](../../app/art/ss-again-3.webp) | love 이별과 재회<br>ssom 재회 3: 다시 만나 바꿀 것<br>ssom 단계 선택 재회 |
| [ss-early-1](../../app/art/ss-early-1.webp) | pair q09 상대 M<br>ssom 초반 1: 사귄 뒤 달라짐<br>ssom 단계 선택 초반 |
| [ss-early-2](../../app/art/ss-early-2.webp) | pair q08 상대 F<br>ssom 초반 2: 연락 빈도 |
| [ss-early-3](../../app/art/ss-early-3.webp) | pair q26 상대 M<br>pair q26 상대 F<br>ssom 초반 3: 첫 다툼 |
| [ss-early-4](../../app/art/ss-early-4.webp) | pair q24 상대 F<br>ssom 초반 4: 내 서운함 말하기 |
| [ss-early-5](../../app/art/ss-early-5.webp) | pair q45 상대 F<br>ssom 초반 5: 상대의 서운함 |
| [ss-give](../../app/art/ss-give.webp) | pair q03 상대 M<br>ssom 서로 원하는 것 주고받기·일반 공유카드<br>ssom 단계 선택 둘 |
| [ss-her](../../app/art/ss-her.webp) | pair q01 상대 F<br>pair q12 상대 F<br>ssom 그 사람의 끌림과 좋아하는 행동 |
| [ss-hold](../../app/art/ss-hold.webp) | ssom 안고 갈 것과 맞출 것 |
| [ss-marry-1](../../app/art/ss-marry-1.webp) | pair q41 상대 M<br>ssom 결혼 1: 결혼해도 되는지<br>ssom 단계 선택 결혼 |
| [ss-marry-2](../../app/art/ss-marry-2.webp) | pair q43 상대 M<br>pair q43 상대 F<br>ssom 결혼 2: 같이 살 때 부딪힘 |
| [ss-marry-3](../../app/art/ss-marry-3.webp) | pair q36 상대 M<br>pair q41 상대 F<br>ssom 결혼 3: 결혼 이야기 꺼내기 |
| [ss-marry-4](../../app/art/ss-marry-4.webp) | ssom 결혼 4: 집안일과 역할 |
| [ss-me](../../app/art/ss-me.webp) | pair q32 상대 M<br>pair q46 상대 M<br>ssom 나의 끌림과 좋아하는 행동 |
| [ss-meet-app](../../app/art/ss-meet-app.webp) | pair q04 상대 M<br>pair q04 상대 F<br>ssom 시작전 2: 데이팅 앱 |
| [ss-meet-blind](../../app/art/ss-meet-blind.webp) | pair q40 상대 F<br>ssom 시작전 1: 소개팅<br>ssom 단계 선택 시작전 |
| [ss-meet-club](../../app/art/ss-meet-club.webp) | pair q31 상대 F<br>ssom 시작전 6: 학교·대외활동 |
| [ss-meet-office](../../app/art/ss-meet-office.webp) | pair q33 상대 M<br>ssom 시작전 4: 회사 |
| [ss-meet-party](../../app/art/ss-meet-party.webp) | pair q03 상대 F<br>pair q34 상대 M<br>ssom 시작전 3: 친구 모임 |
| [ss-meet-run](../../app/art/ss-meet-run.webp) | pair q33 상대 F<br>ssom 시작전 5: 취미 모임 |
| [ss-shake-1](../../app/art/ss-shake-1.webp) | pair q27 상대 F<br>ssom 흔들림 1: 만남 지속·헤어짐 고민 |
| [ss-shake-2](../../app/art/ss-shake-2.webp) | pair q27 상대 M<br>ssom 흔들림 2: 견디지 못하는 까닭 |
| [ss-shake-3](../../app/art/ss-shake-3.webp) | pair q24 상대 M<br>love 관계가 흔들릴 때<br>ssom 흔들림 3: 더 노력할 곳<br>ssom 단계 선택 흔들림 |
| [ss-sseom-1](../../app/art/ss-sseom-1.webp) | ssom 썸 1: 그 사람이 내게 끌리는 점 |
| [ss-sseom-2](../../app/art/ss-sseom-2.webp) | pair q20 상대 F<br>ssom 썸 2: 내가 그 사람에게 끌리는 까닭 |
| [ss-sseom-3](../../app/art/ss-sseom-3.webp) | pair q06 상대 M<br>ssom 썸 3: 먼저 다가가기 |
| [ss-sseom-4](../../app/art/ss-sseom-4.webp) | pair q05 상대 M<br>ssom 썸 4: 연락 방식 |
| [ss-sseom-5](../../app/art/ss-sseom-5.webp) | ssom 썸 5: 첫 데이트<br>ssom 단계 선택 썸 |
| [ss-sseom-6](../../app/art/ss-sseom-6.webp) | love 썸을 탈 때<br>ssom 썸 6: 가까워지며 맞출 것 |
| [ss-steady-1](../../app/art/ss-steady-1.webp) | pair q37 상대 M<br>love 권태가 왔을 때<br>ssom 안정기 1: 설렘이 줄어듦 |
| [ss-steady-2](../../app/art/ss-steady-2.webp) | pair q25 상대 M<br>pair q25 상대 F<br>ssom 안정기 2: 같은 다툼 반복 |
| [ss-steady-3](../../app/art/ss-steady-3.webp) | pair q37 상대 F<br>pair q45 상대 M<br>ssom 안정기 3: 서로 바라는 것의 어긋남 |
| [ss-steady-4](../../app/art/ss-steady-4.webp) | pair q20 상대 M<br>love 오래 함께할 때<br>ssom 안정기 4: 오래 갈 수 있는지<br>ssom 단계 선택 안정기 |
| [ss-then-now](../../app/art/ss-then-now.webp) | pair q23 상대 F<br>pair q38 상대 M<br>ssom 사이=으뜸 공유카드 |
| [ssom-main](../../app/art/ssom-main.webp) | 웹툰궁합 소개·홈 |
| [story-anniversary](../../app/art/story-anniversary.webp) | pair q18 상대 M |
| [story-apology-text](../../app/art/story-apology-text.webp) | pair q30 상대 F |
| [story-ask-favor](../../app/art/story-ask-favor.webp) | pair q01 상대 M<br>pair q30 상대 M |
| [story-big-buy](../../app/art/story-big-buy.webp) | pair q15 상대 M |
| [story-biz-partner](../../app/art/story-biz-partner.webp) | pair q11 상대 M |
| [story-blind-date](../../app/art/story-blind-date.webp) | pair q13 상대 F |
| [story-breakup](../../app/art/story-breakup.webp) | pair q38 상대 F |
| [story-cold](../../app/art/story-cold.webp) | pair q22 상대 M |
| [story-confess](../../app/art/story-confess.webp) | pair q06 상대 F |
| [story-contact](../../app/art/story-contact.webp) | pair q08 상대 M<br>love 연락과 애정표현 |
| [story-contract](../../app/art/story-contract.webp) | pair q44 상대 M |
| [story-drunk-text](../../app/art/story-drunk-text.webp) | pair q11 상대 F |
| [story-fight](../../app/art/story-fight.webp) | pair q28 상대 M<br>pair q28 상대 F<br>love 싸웠을 때 |
| [story-first-touch](../../app/art/story-first-touch.webp) | pair q19 상대 M<br>pair q19 상대 F<br>love 연애가 시작됐을 때 |
| [story-friend-drift](../../app/art/story-friend-drift.webp) | pair q46 상대 F |
| [story-friend-money](../../app/art/story-friend-money.webp) | pair q07 상대 F |
| [story-friend-to-lover](../../app/art/story-friend-to-lover.webp) | pair 표지·장면 보기 fallback |
| [story-get-back](../../app/art/story-get-back.webp) | pair q39 상대 F |
| [story-geunamja](../../app/art/story-geunamja.webp) | pair q23 상대 M<br>pair q36 상대 F |
| [story-gift](../../app/art/story-gift.webp) | pair q18 상대 F |
| [story-gyeolhon](../../app/art/story-gyeolhon.webp) | 결혼 점검 결론=다시 |
| [story-he-likes](../../app/art/story-he-likes.webp) | pair q02 상대 M<br>pair q40 상대 M |
| [story-hold](../../app/art/story-hold.webp) | pair q29 상대 F |
| [story-hurt](../../app/art/story-hurt.webp) | pair q22 상대 F |
| [story-jealous](../../app/art/story-jealous.webp) | pair q31 상대 M<br>pair q34 상대 F<br>love 질투와 신뢰 |
| [story-kid-talk](../../app/art/story-kid-talk.webp) | pair q42 상대 F |
| [story-lend](../../app/art/story-lend.webp) | pair q16 상대 F |
| [story-long-distance](../../app/art/story-long-distance.webp) | pair q10 상대 M |
| [story-maeum](../../app/art/story-maeum.webp) | pair q29 상대 M<br>pair q35 상대 M<br>love 마음에 드는 사람이 생겼을 때 |
| [story-marry-talk](../../app/art/story-marry-talk.webp) | pair q42 상대 M<br>결혼 점검 결론=맞춰·공개 견본 |
| [story-meet-friends](../../app/art/story-meet-friends.webp) | pair q07 상대 M |
| [story-money](../../app/art/story-money.webp) | pair q14 상대 M<br>pair q14 상대 F |
| [story-office-crush](../../app/art/story-office-crush.webp) | pair q02 상대 F |
| [story-parents-talk](../../app/art/story-parents-talk.webp) | pair q47 상대 F |
| [story-propose](../../app/art/story-propose.webp) | 결혼 점검 결론=같이 |
| [story-reply](../../app/art/story-reply.webp) | pair q05 상대 F |
| [story-sanggyeonrye](../../app/art/story-sanggyeonrye.webp) | pair q47 상대 M<br>결혼 점검 소개 hero |
| [story-say-love](../../app/art/story-say-love.webp) | pair q17 상대 M<br>pair q17 상대 F |
| [story-sns](../../app/art/story-sns.webp) | pair q35 상대 F |
| [story-sok](../../app/art/story-sok.webp) | pair q21 상대 F |
| [story-spouse-money](../../app/art/story-spouse-money.webp) | pair q44 상대 F |
| [taekil-advisor-offer-v1](../../app/art/taekil-advisor-offer-v1.webp) | taekil.html |
| [taekil-advisor-review-v1](../../app/art/taekil-advisor-review-v1.webp) | taekil.html |
| [taekil-apply](../../app/art/taekil-apply.webp) | taekil-apply.html |
| [taekil-hero](../../app/art/taekil-hero.webp) | taekil-price.html |
| [taekil-main](../../app/art/taekil-main.webp) | 출산택일 홈 표지·공유 |
| [taekil-read](../../app/art/taekil-read.webp) | taekil-cesarean-date.html<br>taekil-doctor-schedule.html<br>taekil-fate-vs-timing.html<br>taekil-first-child.html<br>taekil-how-to-choose.html<br>taekil-lunar-december.html<br>taekil-one-day-time.html<br>taekil-solar-time.html<br>taekil-son-or-daughter.html<br>taekil-verify.html<br>taekil-why-different.html |
| [taekil-report](../../app/art/taekil-report.webp) | taekil-sample.html |

## 한계와 제외

- 오늘·왜 사건 삽화와 타로 덱은 요청대로 제외했다. 메뉴 표지는 다른 담당과 합칠 때 중복을 빼야 한다.
- 비공개 ilgyeol/gyeolhon 보고서의 삽화·서버 c.bg는 공개 소스만으로 전체 수를 확정할 수 없다. 비공개 본문을 가져오거나 공개하지 않았다.
- 기존 얼굴·그림 내용은 생성 전에 각 기존 원본을 직접 보고 보존할 것. 파일명만 보고 등장인물 얼굴을 정하지 않는다.
- 새 문서 외 코드·이미지·가지·커밋 변경 없음. 테스트와 생성은 이 조사에서 하지 않았다.
