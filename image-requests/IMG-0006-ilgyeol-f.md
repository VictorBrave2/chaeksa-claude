# IMG-0006 — 「나는 뭐해 먹고 살까?」 표지 겸 머리 그림 · 여자(밤 갈림길, 불 켜진 문들)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0006 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 이 화면이 하려던 말 | 직업 이름을 찍어 주는 게 아니라, 어떤 조건의 일이 맞는지와 그 근거 — 시대가 바뀌어도 달라지지 않는 일의 조건.(ilgyeol.html 첫 줄) |
| 그림이 보여 줄 것 | 같은 여자가 한 그림 안에 두 번: 왼쪽은 사람 많고 시끄러운 자리에서 시들고, 오른쪽은 조용한 창가에서 혼자 환하게 일한다. 직업 문이 아니라 「조건」. 보는 사람 자신이므로 여자(남자 판은 IMG-0007). |
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
Vertical 2:3 (1024x1536). One illustration split into two halves by a soft vertical seam of light, like a before-and-after.
ME-F: Korean woman, late 20s, dark brown hair loosely tied, cream knit top, lilac skirt, small red scarf. The SAME woman appears once in each half.
LEFT HALF: a crowded, noisy open office full of many people and desks packed together, phones and papers everywhere, pale grey-lilac light; ME-F sits squeezed in the middle, shoulders down, tired, looking away.
RIGHT HALF: a quiet, sunlit window seat with one clean desk, green plants, soft blue sky and drifting petals outside the window, one red camellia in a small vase; the same ME-F sits alone, back straight, eyes bright, absorbed in her work, warm light on her face.
Both halves are bright and pastel; the difference is crowded-and-tired versus quiet-and-alive, not light versus dark. No doors, no shop fronts, no signs, no job symbols.
Composition: both versions of her face in the upper third of the frame. Whole frame painted, no empty area.
No text, no letters, no numbers, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(간판 · 도로 표지 · 상호 없음)
- 실존 인물 · 남의 캐릭터 · 상표
- 정장 · 서류 가방 같은 「회사원」 상징 하나로 못 박기(아직 고르는 중)

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 삽화 재고(INVENTORY-1023.md) 6순위. 남자 벌 IMG-0007 과 같은 장소 · 같은 구도.
- 2026-10-23 다시 — 사장님 「일곱 장도 표지처럼 밝게 다시 그려」. 밤 · 새벽 프롬프트를 홈 표지(taekil-main · ssom-main) 화풍으로 바꿔 씀(장면은 그대로, 빛 · 색만). 첫 판 PNG 는 out/old/ 에.
- 2026-10-23 다시(콘텐츠에서) — 사장님 「컨텐츠를 이해하고 표지 삽화를 만드는 건지 의문」 → 「ㄱㄱ 넷 다시 그려」. 화면 첫 줄을 「이 화면이 하려던 말」로 적고 장면을 거기서만 꺼냄. 밝은 판(기능 · 모티프로 짠 것)은 out/old/IMG-0006-bright.png.
