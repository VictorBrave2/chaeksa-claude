# IMG-0019 — 홈 「나는 귀한 사람일까」 칸 표지 · 남자

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0019 |
| 상태 | 적용됨 |
| 요청한 날 | 2026-10-23 |
| 이 화면이 하려던 말 | 나는 귀한 사람일까요? 옛 책이 귀하다고 꼽은 짜임 일곱 가운데 몇 개가 있는지 · 지금의 귀는 자신과 핏줄의 몫을 넘어 모두가 잘 살도록 말하고 행동하는 것.(gwi.html 첫 줄) |
| 그림이 보여 줄 것 | 보는 사람 자신: 햇살 드는 방에서 일어서서 여럿 앞에 말하고, 앉은 사람들이 돌아본다. 「모두가 잘 살도록 말하고 행동하는」 순간. 남녀 두 벌. |
| 쓰임 | 홈 「나는 귀한 사람일까」 칸이 본문 컷(밤 그림)을 빌려 쓰고 있어 누르고 싶은 표지가 없다(10-23 사장님 「클릭하고 싶게 만드는 표지여야 한다」 · 「안 바뀌었는데」). 홈 칸 · 카톡 미리보기(og) 표지 한 장. |
| 넣을 화면 | chaeksa.kr 홈 「나는 귀한 사람일까」 칸(app/home-cats.js gwi 줄) · og 카드(tools_sogae.py ART gwi) |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0019.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/gwi-cover-m.webp · 작은 판 app/art/gwi-cover-m-s.webp(360×540) |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색) · IMG-0006(같은 ME-F) · IMG-0007(같은 ME-M) |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). A bright sunlit community room with tall windows, soft blue sky, a few potted plants, one red camellia on a side table.
ME-M: Korean man, late 20s, short dark hair, calm expressive eyes, blush pink collarless cardigan over an ivory top, cream trousers.
Scene: ME-M stands up among several seated people and speaks with open hands and a calm, warm, steady face; the seated people (soft, out of focus) turn toward ME-M and listen. Warm light falls on ME-M's face. Nothing on the walls, no boards, no papers.
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
- 2026-10-23 적용 — app/art/gwi-cover-m.webp(+ -s) · home-cats.js · og 카드(v1417).
