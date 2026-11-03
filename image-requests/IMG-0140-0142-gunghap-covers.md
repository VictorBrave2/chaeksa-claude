# IMG-0140 ~ 0142 — 홈 「궁합」 줄 표지 셋(정통 자미두수 궁합 · 정통 타로 궁합 · SSS급 궁합 분석)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0140 · IMG-0141 · IMG-0142 |
| 상태 | 요청 |
| 요청한 날 | 2026-11-03 |
| 왜 | 11-03 홈에 「궁합」 줄이 섰다(v1613 · 나를 알아보기 바로 아래). 그런데 정통 자미두수 궁합 · 정통 타로 궁합이 바로 위 「나를 알아보기」의 정통자미두수 · 정통타로 표지를 빌려 쓴다 — 같은 그림이 위아래로 서서 손님이 둘을 같은 것으로 본다. SSS급 궁합 분석은 시험 결제 뒤 이 줄 넷째 칸으로 들어가는데 제 표지가 없다. |
| 쓰임 | 홈 「궁합」 줄 · 전체 보기 「연애와 궁합」 목록(작은 그림 76px) |
| 넣을 화면 | chaeksa.kr 홈 · 파일 `app/home-cats.js` 칸 표 — zwghpyo · tarotghpyo 칸(지금은 `art/menu-guides-v1/myeongban.webp` · `tarot.webp`를 빌려 씀)과 새 sss 칸의 그림 · 작은 두 값만 바꿈(메인이 합칠 때) |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0140/ · IMG-0141/ · IMG-0142/ |
| 맞출 본보기 | 얼굴 · 그림체 = 홈 표지 `app/art/menu-guides-v1/*.webp` — 기록 `image-requests/ref/menu-guides-v1/README.md` · `prompts.json`(basePrompt 그대로: 남신 · 여신 얼굴 · 2:3 · 글자 없음 · 밝은 대낮). 같은 줄 첫 칸 정통 사주 궁합 표지(`app/art/content-tarot-v2/gunghap-cover.webp`, 두 사람)는 그대로 둔다 — 셋이 그 옆에 서도 어색하지 않게 같은 밝기 · 같은 색 온도. |

## 세 장

### IMG-0140 정통 자미두수 궁합

- 이 화면이 하려던 말: 두 사람의 명반을 겹쳐, 서로의 부부 자리 · 나이 · 해로 표시가 맞물리는지 본다(홈 한 줄 「두 사람의 별을 함께 읽다」).
- 그림이 보여 줄 것: 남신과 여신이 어깨를 나란히(가슴 위). 둘 사이 아래쪽에 놋쇠 천구환 하나, 그 안의 별 두 개가 금빛 실 한 가닥으로 이어져 있다. 둘 다 이어진 별을 내려다보며 살짝 웃는다.
- 위 「정통자미두수」(여신 혼자 · 천구환)와 한눈에 갈리는 곳: 두 사람 · 이어진 두 별.
- 최종 경로: `app/art/menu-guides-v1/zwgh.webp`(1024×1536) · `app/art/menu-guides-v1/zwgh-s.webp`(360×540)

### IMG-0141 정통 타로 궁합

- 이 화면이 하려던 말: 연애 물음 하나로 열 장을 펼쳐, 이번 달 두 사람 사이가 어디로 가는지 본다(홈 한 줄 「이번 달, 두 사람의 연애」).
- 그림이 보여 줄 것: 작은 둥근 탁자를 사이에 두고 마주 앉은 두 사람(가슴 위 · 둘 다 얼굴이 보이게 보는 쪽으로 반쯤 돌림). 탁자 위에 열 장이 켈틱 십자로 펼쳐져 있고, 여신이 마지막 한 장을 막 뒤집고 남신이 그 카드를 본다.
- 위 「정통타로」(남신 혼자 · 펼친 판)와 한눈에 갈리는 곳: 두 사람 · 마주 앉음 · 여신이 뒤집는 손.
- 최종 경로: `app/art/menu-guides-v1/tarotgh.webp` · `app/art/menu-guides-v1/tarotgh-s.webp`

### IMG-0142 SSS급 궁합 분석(유료 29,700원)

- 이 화면이 하려던 말: 첫인상부터 속궁합까지, 두 사람을 24가지 질문으로 읽는다(장부 한 줄 「서로 끌리는 이유부터 자꾸 다투는 지점까지. 두 사람의 연애를 24가지 질문으로 읽어요.」).
- 그림이 보여 줄 것: 두 사람이 가까이 서서(가슴 위) 보는 쪽을 본다 — 남신이 여신 어깨 뒤로 반걸음. 둘 뒤로 크고 둥근 금빛 바퀴가 머리를 감싼다(24칸으로 고르게 나뉨 · 칸마다 다른 보석 빛 · 기호 · 글자 · 숫자 없음). 값을 받는 칸이라 다른 둘보다 한 단계 화려하게(금 · 보석 색) — 그러나 같은 대낮.
- 소품 자리가 basePrompt(52~70%)와 다르다: 바퀴는 두 머리 뒤. 76px에서 「두 사람 + 둥근 금빛 바퀴」가 보이면 된다.
- 최종 경로: `app/art/menu-guides-v1/sssgh.webp` · `app/art/menu-guides-v1/sssgh-s.webp`

## 두 사람 구도(basePrompt 의 한 사람 구도 대신)

- 두 얼굴 모두 위쪽 22~42% 안에 크게. 소품은 52~70%(SSS만 머리 뒤). 얼굴 둘과 소품이 가운데 70% 폭 안 — 76px 작은 그림과 가로로 자른 홈 칸(3:2) 둘 다에서 「두 사람 + 무엇」이 보이게.
- 둘 다 눈을 뜨고, 손은 작은 것을 집지 않는다(손가락 꼬임 막기 · basePrompt 그대로).

## 영어 프롬프트(prompts.json basePrompt 뒤에 붙인다)

IMG-0140:

```
Scene: BOTH identities together, the MALE and the FEMALE, chest-up, shoulder to shoulder on a sunlit observatory terrace with soft sky and distant mountains. The female wears a deep sapphire gown with fine gold embroidery, the male an ivory and emerald high-collar coat. Between them in the lower center (52-70% of image height) floats ONE large antique brass armillary sphere; inside it two small bright stars are joined by a single thin glowing golden thread. Both look down at the joined stars with a gentle pleased smile, eyes clearly open. Hands rest lightly on the outer ring or stay out of frame; no fingers pinching small parts. Both faces large within 22-42% of image height, centered within the central 70% width.
```

IMG-0141:

```
Scene: the MALE and the FEMALE seated across a small round wooden table in a bright garden pavilion, chest-up, bodies turned three-quarter toward the viewer so both faces are large and clearly visible (22-42% of image height). On the table (52-70% height) ten tarot-sized cards lie in a Celtic cross layout: two crossed cards in the center, four around them, and a vertical column of four on the right. Card faces only softly patterned, no readable pictures, no text. The female is turning over the top card of the column with an open palm beneath it; the male leans slightly forward, watching that card with curious anticipation, eyes open. Warm daylight, rose and teal clothing accents.
```

IMG-0142:

```
Scene: the MALE and the FEMALE standing close together, chest-up, facing the viewer; the male half a step behind her shoulder, both with a confident warm subtle smile, eyes open. Behind them a huge circular golden wheel divided into 24 equal segments frames both heads like a faceted halo; each segment glows softly in a slightly different jewel tone (ruby, sapphire, emerald, amber). No symbols, no numbers, no letters on the wheel. Grand bright palace hall, rich gold and jewel colors: this is the premium cover, more luxurious than its neighbors but still warm daylight. Both faces large within 22-42% of image height, centered within the central 70% width, with the wheel rim visible around them.
```

## 하지 말 것

- 글자 · 숫자 · 로고 · 워터마크 · 카드 이름 · 바퀴 칸의 기호
- 카드 테두리로 그림 전체를 두르기(basePrompt 「NOT a tarot card」)
- 실존 타로 덱 그림 베끼기 — 카드 앞면은 흐리게 · 무늬만
- 휴대폰 · 시계 · 전자 화면
- 노출(basePrompt 그대로) · 「속궁합」을 그림으로 그리기 — 홈 첫 화면이다
- 위 「나를 알아보기」 표지와 같은 장면 · 같은 소품 배치

## 끝났다고 볼 기준

- 76px 작은 그림에서도 얼굴 둘과 소품이 알아보임.
- 홈 「궁합」 줄을 찍은 사진(폰 375) 한 장 — `image-requests/out/IMG-0140/home-row.png`. 정통 사주 궁합 표지와 나란히 서서 어색하지 않음.

## 기록

- 2026-11-03 요청 — Claude Code(사장님 「메뉴 갈무리 다시 해달라했는데 피씨환경이라그런가? 안바꼈네」 → 다시 온 손님 홈도 새 메뉴판 · 홈 「궁합」 줄 v1613. 같은 그림이 위아래로 서는 것을 막으려고)
