# IMG-0063 — 「왜 내게만 이런 일이 일어날까?」 홈 표지 · 여

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0063 |
| 상태 | 요청 |
| 요청한 날 | 2026-10-29 |
| 이 화면이 하려던 말 | 「왜 내게만 이런 일이 일어날까?」 → 「★★★ 사건 발생 빈도가 높습니다 ★★★」 — 나에게 유독 자주 일어나는 일이 있다(보통 사람의 몇 배). 목록 예: 「함께 먹은 밥값을 내가 냅니다」 · 「함께 쓰기로 한 돈을 내가 냅니다」 |
| 그림이 보여 줄 것 | 같은 일을 또 겪는 순간의 「또 나야?」 — 친구들과 밥을 먹고 나서 계산대 앞에서 또 자기 카드를 내미는 20대 후반 여성. 억울함이 아니라 웃픈 얼굴, 뒤로 먼저 나가는 친구들 |
| 쓰임 | 홈 「나를 알아보기」 칸 · 전체 보기 목록 · 생년월일 입력창 맨 위(표지). 프로필 성별이 여자(또는 없음)면 이 그림. 바로 옆 칸이 오늘의 운세 표지(아침 식탁의 여성) |
| 넣을 화면 | chaeksa.kr 홈(why 칸) — 연결은 메인이 한다(app/home-cats.js why 칸 그림 · 작은 · 크기) |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0063.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/why-cover-f.webp · 작은 판 app/art/why-cover-f-s.webp(가로 360) |
| 맞출 본보기 | app/art/today-cover-v1.webp(오늘의 운세 표지 — 같은 줄 옆 칸) · app/art/taekil-main.webp |

## 프롬프트(전문 — 그대로 넣으세요)

```
Use case: illustration-story. Asset type: production homepage cover illustration for a Korean saju service, portrait 2:3, 1024x1536, highest available resolution. Create one polished premium Korean romance-webtoon editorial illustration that sits naturally next to the existing bright cover of a woman at a sunny breakfast table with a phone and a clock.
Scene: an attractive adult Korean woman in her late twenties with expressive clearly OPEN eyes stands at the cashier counter of a cozy, warmly lit Korean restaurant after dinner with friends, holding out her own blank card to pay - once again. She glances toward the viewer with a wry, half-amused "me again?" look: eyebrows slightly raised, a small helpless smile, curious rather than upset. Behind her, softly blurred, two friends are already stepping out of the door, waving cheerfully. The narrative is "the same kind of thing keeps happening to me more than to anyone else" - relatable and a little funny, never sad or angry.
Composition: medium close; her face and the hand with the card clustered in the central upper two-thirds so the scene reads even as a narrow small thumbnail; full shoulders within the canvas, no chopped shoulders. One natural relaxed hand with simple, correct fingers holds the card; no pointing hand. Tasteful casual outfit (soft knit top, light jacket).
Style: beautiful crisp precise linework, detailed hair and eyes, restrained dimensional cel shading, clean high-resolution edges, warm golden evening light, clear distinct shapes, vivid but gentle colors. Cozy contemporary Korean interior softly simplified, no dark lower fade, no excessive decorative particles.
The card, receipt, menu and any screen are blank. Not a photograph, not a flat vector icon, not a UI screenshot. Opaque full-frame background.
No text, no letters, no numbers, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 숫자 · 로고 · 워터마크(카드 · 영수증 · 메뉴판도 빈 채로)
- 실존 인물 · 남의 캐릭터 · 상표(카드사 · 식당 간판 무늬 포함)
- 화나거나 슬픈 얼굴 · 억울함을 크게 보이는 장면 — 「웃픈」 정도. 낙인(늘 손해 보는 사람) 느낌 금지
- 시계 · 달력 · 표 · 사주 소품 · 한자 — 답을 설명하는 그림은 입구가 아니다(10-23)
- 어두운 밤 장면 · 아래로 깔리는 어두운 그라데이션 — 홈 표지 줄이 밝다

## 기록

- 2026-10-29 요청 — Claude Code(사장님 「codex 주문서 만들어줘」). 같은 장면의 남자 판은 IMG-0064. 그때까지 홈 칸은 오늘의 운세 안내 그림(forecast-m-v1)을 빌려 쓴다.
