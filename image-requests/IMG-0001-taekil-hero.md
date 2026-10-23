# IMG-0001 — 출산택일 소개 쪽 머리 그림(새벽 창가, 달력에 동그라미)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0001 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 이 화면이 하려던 말 | 출산 날짜는 의사가 정합니다. 의사가 주신 범위 안에서, 사주의 달이 바뀌는 순간(절기)을 날짜가 아니라 분 단위 시각으로 계산해 고릅니다.(taekil.html 첫 줄) |
| 그림이 보여 줄 것 | 병원에서 날짜 범위 쪽지를 받아 든 순간의 산모 — 「이 중에 언제?」 하는 얼굴. 보는 산모가 「이거 나네」 하고 누르게. 시계 · 달력 없음(방법은 글자가 약속한다). 엄마 주인공, 아빠 옆. |
| 쓰임 | 네이버에서 출산택일을 찾아 들어온 손님이 맨 먼저 보는 쪽(taekil.html)에 그림이 한 장도 없다. 제목 아래 머리 그림 한 장 — 「이 쪽이 무엇을 하는 곳인지」를 글보다 먼저 보여 준다. 견본 쪽(taekil-sample.html) · 값 쪽(taekil-price.html) 머리에도 같은 그림을 쓴다. 사장님이 홈 표지 통일을 고르면 홈 「아이」 칸(app/art/taekil-main.webp 자리)도 이 그림으로 바꾼다. |
| 넣을 화면 | chaeksa.kr/taekil.html 제목 아래 · 파일 app/taekil.html(머리 그림 figure 새로 넣음, gyeolhon.html 머리와 같은 꼴) · taekil-sample.html · taekil-price.html |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0001.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/taekil-hero.webp · 작은 판 app/art/taekil-hero-s.webp(360×540) |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 10-23 사장님 「일곱 장도 표지처럼 밝게」) — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색 |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). Bright morning at a kitchen table by a large window with sheer white curtains, soft blue sky with peach clouds, cream-and-lilac room, a small vase of lilac and one red camellia, a cup of tea.
MOM: Korean woman, early 30s, long dark brown hair loosely tied, visibly pregnant (about eight months), cream knit cardigan over a soft lilac dress. She is the main figure, facing the viewer.
DAD: Korean man, early 30s, short dark hair, light blue knit, beside her, leaning in to look at the same paper with a gentle, slightly puzzled smile.
Scene: MOM has just come home from the hospital. She holds up a single plain white hospital paper in her RIGHT hand only (completely blank, nothing written or printed on it) and looks at it with a hopeful but unsure expression, lips slightly parted, as if asking "which one?". Her LEFT hand rests on her belly. MOM has exactly two hands and both are accounted for: right hand on the paper, left hand on the belly. DAD's hands are away from the paper (one at his chin). Her phone lies face down on the table. There is NO clock and NO calendar in the picture.
Composition: both faces in the upper third of the frame, the paper in the middle of the frame, the table and flowers below. Whole frame painted, no empty area.
No text, no letters, no numbers, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(달력 · 시계에 숫자도 넣지 않는다)
- 실존 인물 · 남의 캐릭터 · 상표
- 병원 장비 · 의사 · 수술 장면(이 쪽은 「날을 고르는 집 안 장면」이다)
- 아기 얼굴(아직 태어나기 전 — 배를 감싼 손으로만)

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 10-23 사장님 「그다음은 삽화 손보도록 하자」 — 삽화 재고(INVENTORY-1023.md) 1순위.
- 2026-10-23 사장님 「현재 출산택일 · 정통궁합 · 웹툰궁합 표지로 쓰고 있는 삽화 스타일이 좋다」 — 홈 「아이」 칸(taekil-main)은 그대로. 이 그림은 taekil · taekil-price 머리에만 쓴다.
- 2026-10-23 다시 — 사장님 「일곱 장도 표지처럼 밝게 다시 그려」. 밤 · 새벽 프롬프트를 홈 표지(taekil-main · ssom-main) 화풍으로 바꿔 씀(장면은 그대로, 빛 · 색만). 첫 판 PNG 는 out/old/ 에.
- 2026-10-23 다시(콘텐츠에서) — 사장님 「컨텐츠를 이해하고 표지 삽화를 만드는 건지 의문」 → 「ㄱㄱ 넷 다시 그려」. 화면 첫 줄을 「이 화면이 하려던 말」로 적고 장면을 거기서만 꺼냄. 밝은 판(기능 · 모티프로 짠 것)은 out/old/IMG-0001-bright.png.
- 2026-10-23 다시(누르고 싶게) — 사장님 「클릭하고 싶게 만드는 표지여야 한다」. 시계를 가리키는 판은 방법을 설명하는 그림이라 out/old/IMG-0001-clock.png 로 비켜 두고, 「병원 쪽지를 받아 든 순간」으로 다시.
