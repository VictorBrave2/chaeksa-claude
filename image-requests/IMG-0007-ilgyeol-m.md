# IMG-0007 — 「나는 뭐해 먹고 살까?」 표지 겸 머리 그림 · 남자(밤 갈림길, 불 켜진 문들)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0007 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 이 화면이 하려던 말 | 직업 이름을 찍어 주는 게 아니라, 어떤 조건의 일이 맞는지와 그 근거 — 시대가 바뀌어도 달라지지 않는 일의 조건.(ilgyeol.html 첫 줄) |
| 그림이 보여 줄 것 | IMG-0006 과 같은 두 조건, 같은 남자가 두 번. 프로필 성별이 남자인 손님에게 보인다. |
| 쓰임 | IMG-0006 의 남자 벌. 홈 「일」 칸은 손님 성별로 그림을 바꿔 끼운다(home-cats.js `{g}`). 같은 장소 · 같은 구도 · 같은 시각, 사람만 ME-M. |
| 넣을 화면 | chaeksa.kr 홈 「일」 칸(남자 프로필) · 파일 app/home-cats.js work 줄 |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0007.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/ilgyeol-m.webp · 작은 판 app/art/ilgyeol-m-s.webp |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 10-23 사장님 「일곱 장도 표지처럼 밝게」) — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색 |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). One illustration split into two halves by a soft vertical seam of light, like a before-and-after.
ME-M: Korean man, late 20s, short dark hair, soft sky-blue band-collar linen shirt, ivory chinos. The SAME man appears once in each half.
LEFT HALF: a crowded, noisy open office full of many people and desks packed together, phones and papers everywhere, pale grey-lilac light; ME-M sits squeezed in the middle, shoulders down, tired, looking away.
RIGHT HALF: a quiet, sunlit window seat with one clean desk, green plants, soft blue sky and drifting petals outside the window, one red camellia in a small vase; the same ME-M sits alone, back straight, eyes bright, absorbed in his work, warm light on his face.
Both halves are bright and pastel; the difference is crowded-and-tired versus quiet-and-alive, not light versus dark. No doors, no shop fronts, no signs, no job symbols.
Composition: both versions of his face in the upper third of the frame. Whole frame painted, no empty area.
No text, no letters, no numbers, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(간판 · 도로 표지 · 상호 없음)
- 실존 인물 · 남의 캐릭터 · 상표
- 정장 · 서류 가방 같은 「회사원」 상징 하나로 못 박기

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 삽화 재고(INVENTORY-1023.md) 7순위.
- 2026-10-23 다시 — 사장님 「일곱 장도 표지처럼 밝게 다시 그려」. 밤 · 새벽 프롬프트를 홈 표지(taekil-main · ssom-main) 화풍으로 바꿔 씀(장면은 그대로, 빛 · 색만). 첫 판 PNG 는 out/old/ 에.
- 2026-10-23 다시(콘텐츠에서) — 사장님 「컨텐츠를 이해하고 표지 삽화를 만드는 건지 의문」 → 「ㄱㄱ 넷 다시 그려」. 화면 첫 줄을 「이 화면이 하려던 말」로 적고 장면을 거기서만 꺼냄. 밝은 판(기능 · 모티프로 짠 것)은 out/old/IMG-0007-bright.png.
