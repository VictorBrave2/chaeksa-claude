# IMG-0066 — 「세 관점이 모인 한 점」 홈 표지 · 남

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0066 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-30 |
| 이 화면이 하려던 말 | 앞으로 두 해, 사주 · 자미두수 · 타로 세 관점이 함께 가리키는 나의 한 점(때와 자리 하나) — 손님이 할 일은 카드 한 장 |
| 그림이 보여 줄 것 | 일곱 장의 뒤집힌 카드 가운데 한 장을 막 집으려는 순간 — 20대 후반 남성이 밝은 창가 탁자에서 손끝을 한 장 위에 멈추고 「이거다」 하는 설렘. 그 카드 위 공중에서 가는 빛줄기 셋이 한 점으로 모여 작게 빛난다(세 관점 → 한 점) |
| 쓰임 | 홈 「나를 알아보기」 칸 · 전체 보기 목록 · 세 관점 탭 맨 위(표지). 프로필 성별이 남자면 이 그림. 여자 판은 IMG-0065 |
| 넣을 화면 | chaeksa.kr 홈(three 칸) — 연결은 메인이 한다(app/home-cats.js three 칸 그림 · 작은 · 크기) |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0066.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/three-cover-m.webp · 작은 판 app/art/three-cover-m-s.webp(가로 360) |
| 맞출 본보기 | app/art/why-cover-m.webp(「왜 내게만」 표지 — 같은 줄 옆 칸) · app/art/today-cover-v2.webp · app/art/taekil-main.webp |

## 프롬프트(전문 — 그대로 넣으세요)

```
Use case: illustration-story. Production homepage cover illustration for the Korean service Chaeksa. Portrait 2:3, 1024x1536, opaque full-frame background. It sits in the same homepage row as the existing bright covers (a man at a sunny breakfast table; a man settling the bill after a meal with friends), so match that bright premium Korean romance-webtoon look.
Scene: a bright, airy window-side table in warm late-morning daylight. Seven plain face-down cards are fanned in a gentle arc on a soft linen cloth. An attractive adult Korean man in his late twenties, seen from the waist up, leans slightly forward; one hand hovers just above a single card in the middle of the arc, fingertips about to touch it - the moment right before he picks it. His face is toward the viewer with clearly OPEN eyes, a small curious, hopeful smile, "this one". Just above the chosen card, three very thin soft ribbons of light (warm gold, pale lilac, soft sky blue) drift in from three different directions and meet in one tiny glowing point - delicate and quiet, not magical fireworks.
Composition: his face, the hovering hand and the meeting point of light clustered in the central upper two-thirds so it reads as a small homepage thumbnail; the card arc sits just below the chest, not at the very bottom. Full shoulders within the canvas. One natural relaxed hand with simple correct fingers hovering; the other hand rests on the table edge. Exactly two hands. No pointing.
Style: premium Korean romance webtoon illustration, crisp detailed linework, clear hair strands and eyes, soft dimensional cel shading, high-key pastel palette (cream white, lilac, blush pink, soft sky blue, warm peach), bright daylight, clean edges. Not photoreal, not flat vector, not a UI screenshot. No night scene, no dark indigo, no dark lower gradient, no heavy sparkle particles.
The card backs are plain soft cream with a simple thin border - no symbols, no pictures, no text. No other props: no phone, no clock, no calendar, no charts, no crystal ball, no candles, no Chinese characters.
No text, letters, numbers, logos, watermarks. Original character, not based on any real person.
Wardrobe: soft knit crew-neck in cream or light sky blue with a light casual jacket; natural proportions. No suit, no tie.
```

## 하지 말 것

- 글자 · 숫자 · 로고 · 워터마크(카드 뒷면도 무늬 없이)
- 수정구슬 · 촛불 · 별자리판 · 한자 · 달력 · 시계 · 표 — 점집 소품이나 답을 설명하는 그림은 입구가 아니다(10-23)
- 카드 앞면(그림 카드) — 무슨 카드인지 보이면 안 된다(뽑기 전의 순간)
- 어두운 밤 장면 · 신비주의 보라 어둠 · 무서운 분위기 — 홈 표지 줄이 밝다
- 손이 셋 · 손가락 꼬임 · 카드를 가리키는 손짓

## 기록

- 2026-10-30 요청 — Claude Code(사장님 「할일 ㄱㄱ」 — 컨셉 1판 12절 「문장 · 그림 — Codex 주문」). 글 주문은 COPY-0024. 같은 장면의 여자 판은 IMG-0065. 그림이 오기 전까지 홈 칸을 달지 않는다(탭은 chaeksa.kr/#three).
