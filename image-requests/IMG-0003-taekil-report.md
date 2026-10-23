# IMG-0003 — 보고서를 함께 읽는 부부(견본 쪽 · 「보고서는 이렇게 만듭니다」 · 결제 끝 쪽)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0003 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 쓰임 | 「신청하면 무엇을 받나」를 보여 주는 그림. 견본 보고서 쪽(taekil-sample.html) 머리, 소개 쪽 「보고서는 이렇게 만듭니다」 절 옆, 결제 끝 쪽(pay-done.html) 출산택일 칸. 지금은 명식 카드(글자 표)만 있어 손님이 「받는 것」을 그림으로 떠올릴 자리가 없다. |
| 넣을 화면 | chaeksa.kr/taekil-sample.html 머리 · taekil.html 「보고서는 이렇게 만듭니다」 절 · pay-done.html · 파일 app/taekil-sample.html · app/taekil.html · app/pay-done.html |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0003.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/taekil-report.webp · 작은 판 app/art/taekil-report-s.webp |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 10-23 사장님 「일곱 장도 표지처럼 밝게」) — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색 |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). Bright afternoon living room, big window with sheer white curtains and soft blue sky, cream sofa, lilac cushions, a vase of pink flowers and one red camellia on the side table.
MOM: Korean woman, early 30s, long dark brown hair loosely tied, visibly pregnant (about eight months), cream knit cardigan over a soft lilac dress, warm smile.
DAD: Korean man, early 30s, short dark hair, gentle smiling eyes, light blue knit.
Scene: MOM and DAD on the sofa reading one tablet together. On the tablet screen only a soft grid of glowing pastel colored squares (an abstract chart, no letters, no numbers). DAD points at one square; MOM smiles with a hand on her belly. A light blanket over their knees.
Composition: both faces and the tablet inside the upper 60% of the frame. Whole frame painted, no empty area.
No text, no letters, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(태블릿 화면에 글자 · 숫자 · 한자를 그리지 않는다)
- 실존 인물 · 남의 캐릭터 · 상표
- 종이 보고서에 글씨 — 화면은 색 네모만

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 삽화 재고(INVENTORY-1023.md) 3순위.
- 2026-10-23 다시 — 사장님 「일곱 장도 표지처럼 밝게 다시 그려」. 밤 · 새벽 프롬프트를 홈 표지(taekil-main · ssom-main) 화풍으로 바꿔 씀(장면은 그대로, 빛 · 색만). 첫 판 PNG 는 out/old/ 에.
