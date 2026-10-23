# IMG-0001 — 출산택일 소개 쪽 머리 그림(새벽 창가, 달력에 동그라미)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0001 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 쓰임 | 네이버에서 출산택일을 찾아 들어온 손님이 맨 먼저 보는 쪽(taekil.html)에 그림이 한 장도 없다. 제목 아래 머리 그림 한 장 — 「이 쪽이 무엇을 하는 곳인지」를 글보다 먼저 보여 준다. 견본 쪽(taekil-sample.html) · 값 쪽(taekil-price.html) 머리에도 같은 그림을 쓴다. 사장님이 홈 표지 통일을 고르면 홈 「아이」 칸(app/art/taekil-main.webp 자리)도 이 그림으로 바꾼다. |
| 넣을 화면 | chaeksa.kr/taekil.html 제목 아래 · 파일 app/taekil.html(머리 그림 figure 새로 넣음, gyeolhon.html 머리와 같은 꼴) · taekil-sample.html · taekil-price.html |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0001.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/taekil-hero.webp · 작은 판 app/art/taekil-hero-s.webp(360×540) |
| 맞출 본보기 | app/art/story-sanggyeonrye.webp(선 · 채색) · app/art/taekil-main.webp(따뜻한 빛) — 둘의 가운데: 그림체는 상견례 컷, 빛은 새벽 |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean webtoon style, semi-realistic anime illustration, cinematic, soft film grain.
Vertical 2:3 (1024x1536). Palette: pre-dawn indigo sky outside a large window turning into warm peach-gold first light, warm amber lamp inside, small red camellia accent somewhere in frame. Seoul setting, subtle city bokeh far behind the window.
MOM: Korean woman, early 30s, long dark brown hair loosely tied, visibly pregnant (about eight months), cream knit cardigan over a soft dress, calm hopeful face.
DAD: Korean man, early 30s, short dark hair, gentle eyes, dark navy knit.
Scene: MOM and DAD sitting close at a kitchen table by the window before sunrise. A paper wall calendar lies flat on the table; DAD's hand draws a red circle around one day with a pen while MOM rests one hand on her belly and watches the sky brightening. A small round analog clock, a cup of warm tea, one red camellia in a glass.
Composition: both faces and the calendar inside the upper 60% of the frame (the site crops a square from the top for thumbnails). Whole frame painted, no empty area.
The calendar is a blank grid: no numbers, no letters, no month name. The clock face has no numbers.
No text, no letters, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(달력 · 시계에 숫자도 넣지 않는다)
- 실존 인물 · 남의 캐릭터 · 상표
- 병원 장비 · 의사 · 수술 장면(이 쪽은 「날을 고르는 집 안 장면」이다)
- 아기 얼굴(아직 태어나기 전 — 배를 감싼 손으로만)

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 10-23 사장님 「그다음은 삽화 손보도록 하자」 — 삽화 재고(INVENTORY-1023.md) 1순위.
- 2026-10-23 사장님 「현재 출산택일 · 정통궁합 · 웹툰궁합 표지로 쓰고 있는 삽화 스타일이 좋다」 — 홈 「아이」 칸(taekil-main)은 그대로. 이 그림은 taekil · taekil-price 머리에만 쓴다.
