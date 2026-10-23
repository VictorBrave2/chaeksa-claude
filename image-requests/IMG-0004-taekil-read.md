# IMG-0004 — 출산택일 글 열세 편 공용 머리 그림(새벽 병원 창가, 갓 태어난 아기)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0004 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 이 화면이 하려던 말 | 왜 이 달에 태어나는 아이에겐 이 글자가 필요한가 · 왜 이 시각인가 — 한 달의 모든 날 · 모든 시각을 다 세어, 그중 몇 시각만 남긴다.(택일 글 11편 제목) |
| 그림이 보여 줄 것 | 한 달 달력(빈 칸) 위에 날마다 열두 알의 작은 구슬이 놓이고 그중 몇 알만 금빛으로 빛난다. 사람 얼굴 없이 임신한 엄마의 손만. 「전수로 세어 몇 시각만 남는다」가 보인다. |
| 쓰임 | 출산택일 「먼저 읽을 것」 글 열세 편(taekil-cesarean-date · taekil-one-day-time · taekil-son-or-daughter · taekil-first-child · taekil-how-to-choose · taekil-solar-time · taekil-verify · taekil-why-different · taekil-doctor-schedule · taekil-fate-vs-timing · taekil-lunar-december · taekil-price · taekil-sample)이 전부 글만이고 카톡 미리보기도 모두 같은 글자 카드(og.jpg)다. 열세 편이 나눠 쓰는 머리 그림 한 장 — 「아이가 태어나는 그 시각」. 미리보기 카드(cards/og/)도 이 그림으로 다시 찍는다(tools_sogae.py). |
| 넣을 화면 | chaeksa.kr/taekil-*.html 글 쪽 제목 아래 · 파일 app/taekil-*.html 열세 쪽(정본 생성기 tools_jeongbon.py 가 넣는 자리) |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0004.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/taekil-read.webp · 작은 판 app/art/taekil-read-s.webp |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 10-23 사장님 「일곱 장도 표지처럼 밝게」) — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색 |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). Bright morning desk by a sunny window, sheer white curtains, soft blue sky, cream and lilac room, a cup of tea, a small vase of pink flowers and one red camellia.
Scene, no faces: a large paper month calendar lies flat on the desk, seen from above at a slight angle. Its grid is completely blank (no numbers, no letters, no month name). Inside every day square sits a neat little column of twelve tiny pale beads, like pearls; in only a handful of squares one bead glows warm gold with a soft sparkle, the rest stay pale. A pregnant Korean woman is present only as two hands and forearms in a cream knit cardigan: one hand rests gently on the calendar, the other holds a pen above a glowing bead.
Composition: the calendar fills the middle of the frame, the hands come in from the lower right, flowers and the cup at the top edge. Whole frame painted, no empty area.
No text, no letters, no numbers, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(병원 이름표 · 차트 · 모니터 글자 없음)
- 실존 인물 · 남의 캐릭터 · 상표
- 의료 장비 · 수술 장면 · 피

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 삽화 재고(INVENTORY-1023.md) 4순위.
- 2026-10-23 다시 — 사장님 「일곱 장도 표지처럼 밝게 다시 그려」. 밤 · 새벽 프롬프트를 홈 표지(taekil-main · ssom-main) 화풍으로 바꿔 씀(장면은 그대로, 빛 · 색만). 첫 판 PNG 는 out/old/ 에.
- 2026-10-23 다시(콘텐츠에서) — 사장님 「컨텐츠를 이해하고 표지 삽화를 만드는 건지 의문」 → 「ㄱㄱ 넷 다시 그려」. 화면 첫 줄을 「이 화면이 하려던 말」로 적고 장면을 거기서만 꺼냄. 밝은 판(기능 · 모티프로 짠 것)은 out/old/IMG-0004-bright.png.
