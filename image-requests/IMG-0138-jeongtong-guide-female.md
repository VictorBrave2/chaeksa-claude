# IMG-0138 — 정통사주 안내 인물 여자판 다섯 장

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0138 |
| 상태 | 요청 |
| 요청한 날 | 2026-11-02 |
| 이 화면이 하려던 말 | 정통사주 결과 — 「나를 설명하는 이야기」를 옛 책으로 읽어 준다 |
| 그림이 보여 줄 것 | 지금 남자 안내 인물(킹 얼굴)과 같은 장면 · 같은 구도를 여자 안내 인물(퀸 얼굴)로 |
| 쓰임 | 11-02 둘러보기: 여자 명식(女命)인데도 정통사주 결과 머리 · 중간 · 끝에 늘 같은 남자 인물이 나온다. 다른 메뉴(일과 돈 표지 · 정통사주 장면)는 이미 남녀를 나눈다. 화면은 손님이 여자면 아래 경로를 먼저 찾고, 없으면 지금 남자 그림으로 돌아가게 바꿔 두었다(app/jeongtong-pyo.js). |
| 넣을 화면 | chaeksa.kr/?go=jeongtong 결과 · 파일 app/jeongtong-pyo.js(companion) |
| 투명 배경 | 1 ~ 3번은 예(지금 그림이 RGBA) · 4 · 5번은 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0138/ |
| 맞출 본보기 | 아래 표의 지금 그림(같은 구도) · 얼굴 기준 app/tarot/chaeksa-v1/P13.webp(퀸) — app/art/content-tarot-v2/README.md 「얼굴 기준」 |

## 다섯 장

| # | 지금 그림(남) | 여자판 최종 경로 | 크기 |
|---|---|---|---|
| 1 | app/art/jeongtong-tarot-v1/welcome.png | app/art/jeongtong-tarot-v1/f/welcome.png | 1254×1254 투명 |
| 2 | app/art/jeongtong-tarot-v1/reading.png | app/art/jeongtong-tarot-v1/f/reading.png | 1254×1254 투명 |
| 3 | app/art/jeongtong-tarot-v1/closing.png | app/art/jeongtong-tarot-v1/f/closing.png | 1254×1254 투명 |
| 4 | app/art/content-tarot-v2/library-mobile.webp | app/art/content-tarot-v2/library-mobile-f.webp | 1024×1536 · 아래 절반은 지금처럼 비운 책상 |
| 5 | app/art/content-tarot-v2/library-ending.webp | app/art/content-tarot-v2/library-ending-f.webp | 1024×1536 |

프롬프트는 지금 그림의 기록(app/art/content-tarot-v2/prompt-manifest-mobile.json 「library」 · prompt-manifest-endings.json)을 바탕으로, 얼굴만 퀸(P13)으로 바꿔 Codex 가 쓴다. 옷 색 · 서재 · 책 · 손 · 시선 · 구도는 남자판과 같게. 자미두수 쪽 여자 인물(observatory-mobile.webp, 파란 천문 옷)과 헷갈리지 않게 정통사주는 지금 남자판처럼 초록 · 상아색 학자 옷.

## 하지 말 것

- 글자 · 로고 · 워터마크 · 숫자
- 실존 인물 · 남의 캐릭터
- 휴대폰 · 시계 · 전자 화면
- 구도를 바꾸거나 인물을 키우고 내리기(화면 글이 아래 절반에 겹친다)

## 기록

- 2026-11-02 요청 — Claude Code(사장님 「네 몫으로 고칠 것 세 개 진행해」)
