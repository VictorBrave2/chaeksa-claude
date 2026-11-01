# COPY-0028 타로 열 장 — 함께 읽는 한 단락(55칸)

- 화면: 「내 물음에 답하는 세 점」 타로 켈틱 펼침(#three) — 열째 카드를 뒤집은 바로 뒤, 열째 풀이 아래.
- 정한 사람: 사장님 11-01 「마지막 종합해석은 10장의 융복합적인 해석을 바란건데 이게 맞는지」 → 「새로운전략대로 초안 ㄱㄱ」 → 「진행」.
- 가지: 최신 main 에서 `codex/COPY-0028` · 끝나면 INDEX 상태 「제안됨」 + PR.
- 쓰는 곳: `app/three-pieces.js` 의 `세점.펼침.융합` — 빈 문자열 55칸이 이미 놓여 있다(11-01 메인). 그 빈칸만 채우고 다른 칸 · 코드는 건드리지 않는다. 화면 코드(`app/three.js` 융합칸)는 main 에 이미 있다.
- 켜짐: 55칸이 다 차야 화면에 나온다(하나라도 비면 지금 화면 그대로). 확인은 `?keys` 로 열쇠 자리를 본다.

## 무엇을 하는 칸인가

지금은 열 장을 한 장씩 읽고, 열째 카드가 결론을 말한다. 이 단락은 **열 장을 한데 엮어** 읽는다. 웨이트는 열째 카드를 이렇게 적었다.

> 703 — The Tenth is what will come, the final result, the culmination which is brought about by the influences shewn by the other cards that have been turned up in the divination.
> 705 — It should embody whatsoever you may have divined from the other cards on the table, including the Significator itself …

셈은 서버가 한다. 화면은 서버가 고른 칸을 차례로 찍는다.

1. **머리** 한 줄
2. (다시 편 판이면) **다시판** 한 줄
3. **결론** 한 줄 — 열째 카드의 쪽(좋게 끝남 · 나쁘게 끝남) × 아홉 장이 열째와 같은 쪽인지 반대쪽인지(띠 셋)
4. **짝 다섯** — 마주 보는 자리 둘씩, 차례대로: 흐름(5 → 6) · 걸림(1 · 2) · 목표(3 · 4) · 마음(8 · 9) · 나(7 · 10)
5. 그 아래 지금의 「끝말」(그대로) · 열 장 이야기는 **이야기접힘** 이름으로 접힌다.

## 55칸

| 열쇠 | 수 | 끼우는 값 | 뜻 |
|---|---|---|---|
| `머리` | 1 | `{물음}` | 단락 머리(예: 열 장을 함께 읽으면) |
| `이야기접힘` | 1 | `{물음}` | 접힌 열 장 이야기의 이름 |
| `다시판` | 1 | — | 이 단락이 다시 편 둘째 판의 열 장으로 읽은 것임을 알리는 한 줄 |
| `결론.길.받침` · `결론.길.갈림` · `결론.길.맞섬` | 3 | `{물음}` `{같은}` `{반대}` | 열째가 좋은 쪽. 아래 띠 표 |
| `결론.흉.받침` · `결론.흉.갈림` · `결론.흉.맞섬` | 3 | 같음 | 열째가 나쁜 쪽 |
| `결론.섞임` | 1 | `{물음}` | 열째가 한쪽으로 정해지지 않음 — 결론을 내리지 않는다(706 「no final decision can be drawn」). 이때는 짝 줄이 나오지 않는다 |
| `짝.<짝>.<앞쪽>.<뒤쪽>` | 45 | `{앞}` `{뒤}` `{물음}` | 짝 다섯 × 앞 자리 쪽 셋 × 뒤 자리 쪽 셋 |

- `<짝>` = `흐름` · `걸림` · `목표` · `마음` · `나`
- `<앞쪽>` · `<뒤쪽>` = `길`(좋은 쪽) · `흉`(나쁜 쪽) · `섞임`(어느 쪽으로도 기울지 않음)
- `{같은}` · `{반대}` = 아홉 장 가운데 열째와 같은 쪽 · 반대쪽 장 수(숫자만 들어간다 — 「{같은}장」처럼 쓴다). 섞임 카드는 어느 쪽에도 세지 않는다.
- `{앞}` · `{뒤}` = 그 자리 카드의 그 물음 카드말(예: 「돈 문제의 고통과 슬픔」). 따옴표는 쓰는 사람이 「{앞}」처럼 붙인다. 카드 이름은 넣지 않는다.

### 결론 띠

| 띠 | 서버가 고르는 때 | 결론에 담을 것 |
|---|---|---|
| 받침 | 같은 쪽이 반대쪽보다 2장 이상 많다 | 끝(좋게 · 나쁘게)이 판 전체의 받침을 받는다 |
| 갈림 | 차이가 1장 이하 | 끝은 그쪽이지만 판이 둘로 갈려 있다 |
| 맞섬 | 반대쪽이 2장 이상 많다 | 끝은 그쪽이지만 가는 길에 반대 힘이 많다 |

**끝의 쪽은 띠가 뒤집지 않는다.** 결론.길.* 은 늘 좋게 끝난다, 결론.흉.* 은 늘 나쁘게 끝난다고 말한다(703 「the final result」). 띠는 그 결론의 세기와 길만 말한다. 대길 · 대흉의 「크게」는 끝말 · 대까닭이 이미 말하니 결론 칸에 쓰지 않는다.

### 짝 다섯 — 웨이트 자리 뜻(679 ~ 703)

| 짝 | 앞 자리 | 뒤 자리 | 읽을 것 |
|---|---|---|---|
| 흐름 | 5 This is behind him — the influence that is just passed, or is now passing away | 6 This is before him — the influence that is coming into action and will operate in the near future | 지나가는 영향에서 다가오는 영향으로 — 좋아지나 · 꺾이나 · 이어지나 · 아직 안 정해졌나 |
| 걸림 | 1 This covers him — the influence affecting the person or matter | 2 This crosses him — the nature of the obstacles. If it is a favourable card, the opposing forces will not be serious, or it may indicate that something good in itself will not be productive of good in the particular connexion | 지금 덮고 있는 것과 가로막는 것. 뒤가 길이면 원문 그대로 「맞서는 힘이 크지 않다」 쪽 |
| 목표 | 3 This crowns him — (a) the aim or ideal; (b) the best that can be achieved under the circumstances, but that which has not yet been made actual | 4 This is beneath him — the foundation, that which has already passed into actuality | 바탕이 목표를 받쳐 주나. 앞이 흉이면 (b) 쪽으로 — 「지금 그릴 수 있는 최선이 낮다」. 「그게 내 목표라고?」로 읽히지 않게 |
| 마음 | 8 his house — environment, the influence of immediate friends | 9 his hopes or fears | 주변과 내 마음이 같은 쪽인가 |
| 나 | 7 himself — his position or attitude in the circumstances | 10 what will come, the final result | 내가 결과와 같은 쪽에 서 있나 |

`짝.나.*.*` 의 뒤 쪽은 열째 쪽과 늘 같다(서버가 같은 판을 쓴다). `짝.나.*.섞임` 은 열째가 섞임일 때인데 그때는 짝 줄이 안 나오므로 화면에 안 나온다 — 그래도 빈칸이면 켜지지 않으니 채운다.

## 지킬 것

- 합니다체 · 사장님 기준 다섯(일반인이 · 알아먹게 · 있는 그대로 · 가감없이 · 단호하게). 「~수 있습니다」 「~편입니다」 「~듯합니다」 쓰지 않는다.
- 줄마다 한두 문장. 짝 줄은 「{앞}」 「{뒤}」를 둘 다 넣고, 둘이 이어지는 뜻(좋아진다 · 꺾인다 · 받쳐 준다 · 엇갈린다 …)을 단정해서 말한다. 카드말을 다시 풀어 쓰지 않는다.
- 같은 짝의 아홉 꼴이 서로 다른 말로 읽히게. 다섯 짝이 한 판에 이어 찍히므로 「~입니다. ~입니다.」 같은 틀이 다섯 번 되풀이되지 않게 짝마다 문장 꼴을 바꾼다.
- 할 일(「~하십시오」)은 넣지 않는다 — 결과 화면의 할 일 칸이 따로 있다.
- 쓰지 않는 말: 「운세」 「대박」 「조심하세요」 「점수」 「AI」 「GPT」 · 별표 · 대괄호.
- 어느 카드가 어느 쪽인지(카드 × 길흉)는 이 저장소에 적지 않는다. 칸은 쪽(길 · 흉 · 섞임)으로만 나뉜다.

## 끝나면

- `ref/COPY-0028-done.md` 에 55칸 전부(열쇠 · 글) 표로.
- 검사: `python -X utf8 tools_check.py` 막힘 0.
- INDEX 상태 「제안됨」 · PR.
