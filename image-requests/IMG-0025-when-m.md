# IMG-0025 — 홈 「언제 나아지나」 칸 표지 · 남자

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0025 |
| 상태 | 적용됨 |
| 요청한 날 | 2026-10-23 |
| 이 화면이 하려던 말 | 언제 나아지나 — 지금 힘든 시기가 언제 끝나나요? 지나온 해를 먼저 맞혀 보고, 앞으로 나아지는 해와 가장 좋은 해를 알려 줘요.(when.html 첫 줄) |
| 그림이 보여 줄 것 | 보는 사람 자신: 비 갠 창가, 구름이 갈라지며 첫 햇살이 얼굴에 닿는 순간 고개를 든다. 힘든 때가 끝나려는 장면. 밝은 파스텔(어두운 비 아님). 남녀 두 벌. |
| 쓰임 | 홈 「언제 나아지나」 칸이 본문 컷(밤 그림)을 빌려 쓰고 있어 누르고 싶은 표지가 없다(10-23 사장님 「클릭하고 싶게 만드는 표지여야 한다」 · 「안 바뀌었는데」). 홈 칸 · 카톡 미리보기(og) 표지 한 장. |
| 넣을 화면 | chaeksa.kr 홈 「언제 나아지나」 칸(app/home-cats.js when 줄) · og 카드(tools_sogae.py ART when) |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0025.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/when-cover-m.webp · 작은 판 app/art/when-cover-m-s.webp(360×540) |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색) · IMG-0006(같은 ME-F) · IMG-0007(같은 ME-M) |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). A bright window seat just after rain: raindrops still on the glass, soft pastel clouds parting outside, a wide beam of warm sunlight breaking through onto the room, petals and a red camellia on the sill.
ME-M: Korean man, late 20s, short dark hair, calm expressive eyes, white shirt, light blue cardigan, light trousers.
Scene: ME-M sits by the window with knees drawn up and a cup of tea, and lifts the face into the new sunlight with eyes half closed and a small relieved smile, as if the hard time is finally ending. The whole picture is bright and hopeful, not grey.
Composition: the face(s) in the upper third of the frame. Whole frame painted, no empty area.
No text, no letters, no numbers, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 숫자 · 로고 · 워터마크(책 · 표 · 명함 · 폰 화면에도)
- 실존 인물 · 남의 캐릭터 · 상표
- 밤 · 어두운 남색 · 무거운 그림자(홈 표지 다섯과 결이 같아야 한다)
- 답이나 방법을 설명하는 그림(표 · 시계 · 달력을 주인공으로) — 보는 사람이 자기를 알아보는 「순간」을 그린다

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 사장님 「클릭하고 싶게 만드는 표지여야 한다 이말이지」 → 홈 화면 「안 바뀌었는데」. 홈 칸 아홉(빌려 쓴 밤 컷)을 콘텐츠 첫 줄에서 꺼낸 밝은 표지로.
- 2026-10-23 적용 — app/art/when-cover-m.webp(+ -s) · home-cats.js · og 카드(v1417).
