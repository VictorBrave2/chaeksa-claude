# IMG-0006 — 「나는 뭐해 먹고 살까?」 표지 겸 머리 그림 · 여자(밤 갈림길, 불 켜진 문들)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0006 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 쓰임 | 셋째 유료 상품(진로 보고서, ilgyeol.html)이 제 그림이 없다 — 홈 「일」 칸은 정통사주 15장 컷(jt-15-work, 책상에서 일하는 사람)을 빌려 쓰고, 소개 쪽 머리에는 그림이 없고, 미리보기는 출산택일 글자 카드(og.jpg)다. 「무슨 일로 먹고살까 — 고르는 사람」 그림 한 장. 홈 칸은 손님 성별로 바꿔 끼우므로 남자 벌은 IMG-0007. |
| 넣을 화면 | chaeksa.kr 홈 「일」 칸(home-cats.js work 줄 `art/ilgyeol-{g}.webp`) · ilgyeol.html 제목 아래 머리 그림 · 파일 app/home-cats.js · app/ilgyeol.html |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0006.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/ilgyeol-f.webp · 작은 판 app/art/ilgyeol-f-s.webp |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 10-23 사장님 「일곱 장도 표지처럼 밝게」) — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색 |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). Bright sunny afternoon on a quiet tree-lined Seoul street, blossoming trees with pink and white petals drifting, soft blue sky, pastel shopfronts.
ME-F: Korean woman, late 20s, dark brown hair loosely tied, calm thoughtful eyes, cream knit top, lilac skirt, small red scarf.
Scene: ME-F standing alone at a small crossroads, several open doorways around her, each a different warm pastel color: a bakery window with a pink awning, a glass office lobby, a small art studio with a yellow door, a shop with hanging paper lanterns. None of them has a sign. She holds her phone loosely at her side and looks up, deciding which way to go. A red camellia bush beside a lamp post.
Composition: ME-F and the nearest doorways inside the upper 60% of the frame (the site crops a square from the top for thumbnails). Whole frame painted, no empty area.
No text, no letters, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(간판 · 도로 표지 · 상호 없음)
- 실존 인물 · 남의 캐릭터 · 상표
- 정장 · 서류 가방 같은 「회사원」 상징 하나로 못 박기(아직 고르는 중)

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 삽화 재고(INVENTORY-1023.md) 6순위. 남자 벌 IMG-0007 과 같은 장소 · 같은 구도.
- 2026-10-23 다시 — 사장님 「일곱 장도 표지처럼 밝게 다시 그려」. 밤 · 새벽 프롬프트를 홈 표지(taekil-main · ssom-main) 화풍으로 바꿔 씀(장면은 그대로, 빛 · 색만). 첫 판 PNG 는 out/old/ 에.
