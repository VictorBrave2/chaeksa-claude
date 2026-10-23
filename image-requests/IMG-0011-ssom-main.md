# IMG-0011 — 웹툰궁합 표지 다시(밤 포장마차, 음식 대신 그 사람을 보는 눈)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0011 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 쓰임 | **사장님 결정 뒤에 그린다(INVENTORY-1023.md 「정할 것 1」).** 지금 표지(ssom-main.webp)는 대낮 분홍 카페의 남녀 — 밝고 예쁘지만 웹툰궁합 장면 그림 36장(ss-*, 밤 · 인디고 · 동백)과 나란히 서면 다른 작품처럼 보인다. 새로 그리지 않고 있는 장면 그림(ss-sseom-5 · ss-give)을 표지로 돌려 쓰는 길도 있다 — 다만 장면 그림은 아래 40%가 비어 있어 표지로는 아래가 허전하다. |
| 넣을 화면 | chaeksa.kr 홈 「궁합」 칸(home-cats.js ssom 줄) · ssom.html 머리(.sg-cover) · 파일 app/home-cats.js · app/ssom.html |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0011.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/ssom-main.webp(바꿔 넣음) · 작은 판 app/art/ssom-main-s.webp |
| 맞출 본보기 | app/art/ss-sseom-5.webp(같은 두 사람 · 같은 포장마차 분위기 — 다만 아래까지 다 그린다) · app/art/story-propose.webp(그림체) |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean webtoon style, semi-realistic anime illustration, cinematic, soft film grain.
Vertical 2:3 (1024x1536). Palette: deep indigo and violet dusk, warm amber lamp light, small red camellia accent somewhere in frame. Seoul setting, subtle city bokeh.
HIM: Korean man, early 30s, short dark tousled hair, calm gentle eyes, white shirt, dark coat.
HER: Korean woman, late 20s, dark brown hair in a loose bun, bright expressive face, black coat with a red scarf, cream knit inside.
Scene: HIM and HER at a glowing street food stall at night. HER laughs and points at something sizzling on the grill; HIM is not looking at the food — he watches her with a faint smile. Steam, hanging bulbs, a red camellia bush at the edge of the stall.
Composition: both faces inside the upper 60% of the frame (the site crops a square from the top for thumbnails). This is a cover, not a scene: paint the whole frame down to the bottom edge — no empty fade.
No text, no letters, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(포장마차 차림표 · 간판 글자 없음)
- 실존 인물 · 남의 캐릭터 · 상표
- 아래 40% 비우기(장면 그림과 달리 표지는 끝까지 그린다)

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 삽화 재고(INVENTORY-1023.md) 11순위 · 사장님 결정 대기.
