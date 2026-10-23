# IMG-0016 — 홈 「나는 고지능일까」 칸 표지 · 여자

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0016 |
| 상태 | 적용됨 |
| 요청한 날 | 2026-10-23 |
| 이 화면이 하려던 말 | 당신은 고지능일까요? 옛 책이 「총명하다」고 꼽은 대목 34개 가운데 몇 개에 해당하는지, 같은 성별에서 얼마나 드문지.(brain.html 첫 줄) |
| 그림이 보여 줄 것 | 보는 사람 자신: 햇살 드는 책상에서 펜을 입술에 대고 「나는?」 하며 장난스럽게 눈썹을 올려 나를 본다. 앞에는 펼친 옛 책(빈 쪽). 남녀 두 벌. |
| 쓰임 | 홈 「나는 고지능일까」 칸이 본문 컷(밤 그림)을 빌려 쓰고 있어 누르고 싶은 표지가 없다(10-23 사장님 「클릭하고 싶게 만드는 표지여야 한다」 · 「안 바뀌었는데」). 홈 칸 · 카톡 미리보기(og) 표지 한 장. |
| 넣을 화면 | chaeksa.kr 홈 「나는 고지능일까」 칸(app/home-cats.js brain 줄) · og 카드(tools_sogae.py ART brain) |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0016.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/brain-cover-f.webp · 작은 판 app/art/brain-cover-f-s.webp(360×540) |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색) · IMG-0006(같은 ME-F) · IMG-0007(같은 ME-M) |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). A bright sunlit desk by a window, sheer white curtains, soft blue sky, pink flowers and one red camellia in a small vase.
ME-F: Korean woman, late 20s, dark brown hair loosely tied, calm expressive eyes, cream knit top, lilac skirt, small red scarf.
Scene: ME-F sits at the desk, an old thread-bound book lying open in front (its pages completely blank), one pen tip resting playfully at the lips, looking straight at the viewer with one eyebrow slightly raised, a bright curious half-smile, as if asking "am I?". Petals drift in the sunlight.
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
- 2026-10-23 적용 — app/art/brain-cover-f.webp(+ -s) · home-cats.js · og 카드(v1417).
