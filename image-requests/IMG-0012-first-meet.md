# IMG-0012 — 「첫 만남」 내 생년월일 입력 칸 머리 띠(밤 책상, 옛 앨범에서 떨어진 아기 사진)

| 칸 | 값 |
|---|---|
| 작업 ID | IMG-0012 |
| 상태 | 취소 |
| 요청한 날 | 2026-10-23 |
| 쓰임 | **사장님 결정 뒤에 그린다(INVENTORY-1023.md 「정할 것 1」).** 입구는 하나 — 모든 콘텐츠가 「첫 만남」(내 생년월일) → 「그 사람」을 거친다. 그런데 「첫 만남」 칸 머리 띠(style.css .fc-art)는 보랏빛 판타지 소녀(love-main.webp = saju-main 을 잘라 쓴 것 · 작은 판은 480×480 정사각)이고, 바로 다음 「그 사람」 칸 컷(jt-13-heart)은 밤 버스의 사람 — 같은 흐름 두 칸이 다른 세계다. 「태어난 날」을 떠올리는 그림 한 장. |
| 넣을 화면 | chaeksa.kr 홈 · 모든 입구의 「첫 만남」 입력 칸 머리 띠(200px 높이, 위쪽 22% 자리를 보임) · 파일 app/style.css(.fc-art url) · app/app.js 219줄(기본 표지 `art/love-main.webp`) |
| 비율 · 크기 | 세로 2:3 · 1024×1536 |
| 투명 배경 | 아니요 |
| 원본 올릴 곳 | image-requests/out/IMG-0012.png |
| 최종 경로(책사 쪽이 바꿔 둠) | app/art/first-meet.webp · 작은 판 app/art/first-meet-s.webp(360×540) — love-main.webp · love-main-s.webp 는 그 뒤 걷음 |
| 맞출 본보기 | app/art/jt-13-heart-f.webp(바로 다음 칸의 컷 — 같은 밤 · 같은 결) · app/art/story-sanggyeonrye.webp(그림체) |

## 프롬프트(전문 — 그대로 넣으세요)

```
Korean webtoon style, semi-realistic anime illustration, cinematic, soft film grain.
Vertical 2:3 (1024x1536). Palette: deep indigo and violet dusk, warm amber lamp light, small red camellia accent somewhere in frame. Seoul setting, subtle city bokeh through the window.
HER: Korean woman, late 20s, dark brown hair loosely tied, calm nostalgic face, cream knit.
Scene: HER at a desk by a window at night, opening an old family photo album; one small photograph has slipped out onto the desk — only a soft warm blur, no face detail, nothing printed on it. Desk lamp, a blank wall calendar behind her (empty grid, no numbers), a red camellia in a glass. Her face lit warm from the lamp.
Composition: her face and the album inside the upper 40% of the frame (the site shows only the top strip of this picture). Whole frame painted, no empty area.
No text, no letters, no logos, no watermark. Original characters, not based on any real person.
```

## 하지 말 것

- 글자 · 로고 · 워터마크(달력 숫자 · 사진 속 글자 없음)
- 실존 인물 · 남의 캐릭터 · 상표
- 사진 속 아기 얼굴을 또렷이 그리기(흐린 따뜻한 덩어리로만)

## 기록

- 2026-10-23 요청 — Claude Code(화면 담당). 삽화 재고(INVENTORY-1023.md) 12순위 · 사장님 결정 대기.
- 2026-10-23 취소 — 사장님 「현재 출산택일 · 정통궁합 · 웹툰궁합 표지로 쓰고 있는 삽화 스타일이 좋다」. 지금 표지 그대로 둔다. 만든 그림은 out/ 에 남김(다른 자리에 쓸 수 있음).
