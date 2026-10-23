# IMG-0002 — 출산택일 신청서 머리 컷(병원 예약지를 든 엄마, 말풍선 자리 비움)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0002 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-23 |
| 쓰임 | 출산택일 신청서(taekil-apply.html)가 글과 입력 칸뿐이다. 「입력 폼은 웹툰식(컷 + 말풍선)」(09-25 사장님) — 신청서 맨 위에 컷 한 장과 책사 말풍선(「병원이 말해 준 날짜 범위만 있으면 돼요」 같은 한 줄)을 둔다. 그림 아래 40%는 말풍선이 앉는 자리라 비워 둔다. |
| 넣을 화면 | chaeksa.kr/taekil-apply.html 제목 아래 컷(.gc-cut 꼴, 홈 「그 사람」 입력 컷과 같은 틀) · 파일 app/taekil-apply.html |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0002.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/taekil-apply.webp · 작은 판 app/art/taekil-apply-s.webp |
| 맞출 본보기 | app/art/taekil-main.webp · app/art/ssom-main.webp(홈 표지 — 10-23 사장님 「일곱 장도 표지처럼 밝게」) — 밝은 대낮 · 파스텔 · 꽃 · 맑은 채색 |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean romance webtoon cover illustration, glossy semi-realistic anime style, smooth luminous rendering, clean delicate linework, bright airy daylight, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), sparkling bloom highlights, a few drifting flower petals and small fresh flowers in frame, cheerful warm dreamy mood. Match the look of a bright sunlit Korean webtoon cover.
No film grain, no night scene, no dark indigo, no heavy shadows.
Vertical 2:3 (1024x1536). Bright late morning at a desk by a sunny window with sheer white curtains, soft blue sky outside, cream and lilac room, a small vase of pink flowers and one red camellia.
MOM: Korean woman, early 30s, long dark brown hair loosely tied, visibly pregnant (about eight months), cream knit cardigan over a soft pink dress, calm cheerful face.
Scene: MOM alone at the desk. In one hand a folded hospital appointment slip (a plain blank paper, nothing written on it), in the other her phone; she is deciding which days to type in. A closed maternity notebook on the desk.
Composition: MOM's face in the upper third of the frame, her hands and the desk below her; the lower part of the frame shows the desk, the notebook and flowers. Whole frame painted, no empty area.
Phone screen is soft light only, nothing written on it.
No text, no letters, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(예약지 · 폰 화면에 글자를 그리지 않는다 — 폰 화면은 빛만)
- 실존 인물 · 남의 캐릭터 · 상표
- 아래 40%에 물건 · 얼굴(말풍선 자리)

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 삽화 재고(INVENTORY-1023.md) 2순위.
- 2026-10-23 다시 — 사장님 「일곱 장도 표지처럼 밝게 다시 그려」. 밤 · 새벽 프롬프트를 홈 표지(taekil-main · ssom-main) 화풍으로 바꿔 씀(장면은 그대로, 빛 · 색만). 첫 판 PNG 는 out/old/ 에.
- 2026-10-23 다시(아래 비움 없앰) — 사장님 「아래를 비워 두는 이유는?」. 입력 컷 틀(.gc-cut 높이 300px · 위부터 보임)은 그림 위쪽 55% 만 보여 주고 말풍선은 그 안에 얹히므로 아래 40% 를 비워도 화면에 안 보인다. 온 틀을 다 그리게 바꿈. 비운 판은 out/old/IMG-0002-blank.png.
