# COPY-0026 — 타로를 웨이트 켈틱 펼침으로(「세점.펼침」 새 칸 34 · 「한 장」을 전제한 칸 다시 보기)

2026-10-31 사장님: 「타로카드 보는법 정석대로 ㄱㄱ」.
「내 물음에 답하는 세 점」(#three)의 타로 점이 「뒤집힌 일곱 장 가운데 한 장」에서 **웨이트 원문 Part III §7 「An Ancient Celtic Method of Divination」(665 ~ 740줄) 그대로**로 바뀐다. Part III 에는 한 장 뽑기 법이 없다(점치는 법은 §7 켈틱 · §8 마흔두 장 · §9 서른다섯 장뿐). §7 은 정해진 물음에 답을 얻기에 가장 알맞은 법이다(671) — 이 화면은 물음을 먼저 고른다.
계산 · 규칙 · 화면 모양은 메인 몫이다 — 비공개 서버(`/api/three-eyes` 에 「펼침: true」)가 나 카드 · 섞기 · 열 장 · 다시 펼침 · 궁정 카드를 내고, 화면 뼈대(`app/three.js` · `app/three.css`)가 아래 칸을 부른다. **Codex 는 손님이 읽는 글 칸만 채운다** — `app/three-pieces.js` `"세점"` 안 `"펼침"` 묶음(새 칸 34)과, 「한 장」을 전제한 칸 다시 보기.

상태: 적용됨 — 2026-10-31 · v1530. 새 34칸 + 기존 36칸. [문장 전후와 까닭](ref/COPY-0026-changes.md).

**켜지는 법**: 메인 스위치(뼈대 `app/three.js` 의 `펼침켜짐`)는 `세점.펼침` 의 **필수 칸 31이 모두 빈칸 아닌 글로 차야** 화면(#three)의 타로를 한 장에서 켈틱 펼침으로 바꾼다 — `나.Page` · `나.Knight` · `나.Queen` · `나.King` · `섞기` · `떼기` · `결과보기` · `자리.1 ~ 10` · `자리뜻.1 ~ 10` · `끝말` · `다시말` · `궁정말` · `끝카드`. 하나라도 비면 지금 한 장 판 그대로다(라이브에 반쯤 빈 펼침이 나가지 않게). **고를 칸 셋**(`기다림` · `판머리` · `다시보기`)은 비어도 켜짐을 막지 않고, 비면 그 줄만 조용히 빠진다. 그래도 **새 칸 34 전부와 아래 「다시 볼 칸」을 한 PR 로 함께** 채운다 — 필수 칸이 다 차는 순간 켜지므로, 다시 볼 칸이 늦으면 펼침 결과에 「뽑은 카드」 말이 남는다. 메인 뼈대가 main 에 들어간 뒤엔 주소 끝 `?keys`(`chaeksa.kr/?keys#three`)로 펼침 뼈대가 빈 칸 이름(〔세점.펼침.…〕)과 함께 보인다.

## 이 콘텐츠가 하는 일 (먼저 읽기)

- 손님이 할 일은 **누르기뿐**: 물음 하나 고르기 → 나를 나타내는 카드 보기 → 섞기 → 떼기 세 번 → 열 장이 놓임(다시 펼침이면 그 아래에서 새 나 카드로 섞기 · 떼기 세 번을 한 번 더 → 열 장) → 결과 보기 → 결과(세 점). 생년월일시 · 성별은 프로필에 이미 있다(묻지 않는다).
- 웨이트 차례 그대로(괄호 = 원문 줄 — 아래 「원문」 절):
  1. **나를 나타내는 카드(Significator · 671 · 673)** — 자기 일을 물으면 자기 모습에 맞는 카드를 고른다(671). 계급은 남녀 모두 만 40세부터 윗계급: 남자 만 40세 이상 = 나이트(Knight) · 만 39세 이하 = 킹(King) · 여자 만 40세 이상 = 퀸(Queen) · 만 39세 이하 = 페이지(Page). 671 원문은 남 「a man of forty years old and upward」 · 「any male who is under that age」, 여 「a woman who is over forty years」 · 「any female of less age」다 — 만 40세 몇 달 된 여자는 마흔 해를 넘겼고(「over forty years」) 「less age」(마흔보다 어림)가 아니므로 퀸으로 읽는다. 이 경계 읽기는 **우리 규칙(메인 추론)**이다. 나이는 서울 오늘 날짜로 센 만 나이(생일이 지났는지까지). 무늬는 펜타클 — 673 「펜타클 궁정 카드 = 아주 짙은 갈색이나 검은 머리 · 짙은 눈의 사람」을 손님 모두에게 적용한 **우리 규칙(메인 추론)**이다(머리 · 눈 빛 · 기질을 묻지 않는다). 그래서 나 카드는 넷 중 하나다: P11 펜타클 페이지(시종) · P12 펜타클 나이트(기사) · P13 펜타클 퀸(여왕) · P14 펜타클 킹(왕)(이름은 서버 카드 표 그대로). 앞면이 위로 놓이고(677) 길흉을 읽지 않는다.
  2. **섞고 세 번 떼기(677)** — 나 카드를 뺀 77장. 화면의 섞기 · 떼기 단추는 이 차례를 따르는 누름이다. 실제 섞음은 서버가 무작위로 한다(누름이 카드를 고르지 않는다).
  3. **열 자리(679 ~ 703)** — 맨 위 카드부터 1 ~ 10. 놓는 꼴은 웨이트 그림(712 「나 카드는 왼쪽을 본다」): 가운데 나 카드를 1이 덮고 2가 그 위에 가로로 걸침 · 3 위 · 4 아래 · 5 오른쪽(뒤 — 나 카드가 등진 쪽) · 6 왼쪽(앞 — 나 카드가 보는 쪽) · 십자 오른쪽 기둥에 7 ~ 10을 아래에서 위로.
  4. **놓임** — 장마다 바로 · 거꾸로 반반(우리 규칙 — §7 은 거꾸로를 말하지 않는다. 카드 뜻은 웨이트가 적은 바로 · 거꾸로 뜻 그대로).
  5. **타로 점의 길흉 = 열째 카드(703 「the final result」)** — 읽는 법은 지금 한 장과 같다(그 카드 그 방향의 웨이트 원문이 이 물음을 직접 말하면 그 낱말로, 아니면 카드 전체 뜻으로 — 우리 규칙 · 결정함 50). 1 ~ 9째도 자리마다 같은 법으로 길흉을 내어 보이지만 **길흉 셈에 넣지 않는다** — 원문에 열 장을 더하는 규칙이 없다(588 「자리에 따라 뜻이 바뀌지만 그 규범은 거의 없다」).
  6. **다시 펼침(706)** — 열째가 이 물음에 길흉 함께(섞임)로 읽히면, 그 열째를 새 나 카드로 놓고(처음 나 카드는 덱으로 돌아간다) 다시 섞고 세 번 떼어 열 장 → 새 열째가 결과. 새 열째도 섞임이면 섞임으로 끝난다. 「길흉 함께 = 원문의 애매함(dubious)」으로 읽은 것과 「한 번까지」는 우리 규칙이다(원문에 기준 · 횟수가 없다). 화면은 첫 판 아래에서 그 열째를 새 나 카드로 보이고 섞기 · 떼기 세 번을 한 번 더 누르게 한다 — 둘째 판도 서버가 이미 섞어 놓았다(누름이 카드를 고르지 않는다).
  7. **결과 카드가 궁정 카드(708)** — 결과를 정한 열째가 궁정 카드(페이지 · 나이트 · 퀸 · 킹)면 「이 일은 끝내 그 카드가 나타내는 사람 손에 들어가고, 끝은 주로 그에게 달렸다」를 덧붙인다. 길흉은 그 카드 방향 그대로다. 그 사람이 누구인지(나이 · 성별 · 관계)는 정하지 않는다 — 671을 거꾸로 써서 풀지 않는다(웨이트 §2 의 궁정 카드 뜻과 어긋난다). 이 말은 결과 카드 바로 아래 한 줄로 나간다. 그 카드의 웨이트 원문(§2)은 근거 접힘의 결과 카드 원문으로 이미 찍히므로 곁에 따로 찍지 않는다. 708 둘째 문장(그 궁정 카드를 나 카드로 새로 펼쳐 보기)은 이 화면에서 하지 않는다.
- 그 밖은 지금 그대로(COPY-0025): 창 24달 · 같은 물음은 같은 달에 다시 펼치지 않음(화면이 기억) · 사주 점 · 자미 점 · 셈(길 몇 · 흉 몇) · 같은달 · 근거 · 할 일. 세 점을 하나로 합치지 않는다(법전 64조).

### 화면 차례(메인 뼈대 — 칸이 서는 차례)

자리 · 모양은 뼈대가 정한다(뼈대가 main 에 들어가면 `?keys` 로 확인). 아래는 10-31 메인이 정한 뼈대 차례다 — 결과는 블록 꼴(물음 → 결론 → 근거 접힘, 끝에 할 일 — 판 그림 · 자리 목록을 결론 위에 두지 않는다). 뼈대가 바뀌면 메인이 이 절을 맞춘다. 칸 글은 놓인 자리와 상관없이 홀로 읽히게 쓴다.

- **② 펼친 순간은 처음 한 번만 보인다**(저장하지 않는 한때 화면). 새로 고침 · 다른 물음에 갔다 옴 · 다음 방문엔 ②를 건너뛰고 ③ 결과로 바로 간다. 펼친 순간에 물음 · 사람을 바꾸면 그 순간은 버린다(다시 열면 ③).
- 그래서 `끝말` · `다시말`은 ②와 ③ 근거 접힘 **두 곳**에 나오고, 손님이 ③ 근거 접힘에서 처음 읽을 수도 있다 — 두 곳 어디서든 홀로 읽히게. `결과보기`는 ②에만, `판머리`는 ③ 근거 접힘에만 있다.

```
[물음 열]                                          ← 세점.고르기 · 세점.물음말(그대로)
── ① 의식 — 물음을 고르면(펼치기 전) ──
〔세점.창말〕                                        ← 다시 볼 칸(그대로 보인다)
[나 카드 앞면] 펜타클 킹(왕) · King of Pentacles + [뒷면 더미]   ← 카드 그림 · 이름 · 영어 이름은 코드가 찍음(이름 = 맨 위 카드이름 칸, 비면 서버 카드 표 이름)
〔세점.펼침.나.King〕                                ← 계급마다 한 칸(Page · Knight · Queen · King)
[〔세점.펼침.섞기〕]                                   ← 단추
[〔세점.펼침.떼기〕]                                   ← 섞은 뒤 같은 단추가 바뀜 · {n} = 1 · 2 · 3 — 셋째를 누르면 답을 부른다
〔세점.펼침.기다림〕                                   ← 답을 기다리는 동안(고를 칸)
── ② 펼친 순간 — 답이 오면(처음 한 번만) ──
[첫 판 그림: 나 카드 + 열 장 — 차례로 나타남]           ← 그림과 자리 번호만(판머리 · 자리 이름 · 뜻은 ③ 근거 접힘에)
 ┌ 다시 펼침이 아니면
 │ 〔세점.펼침.끝말〕                                  ← {카드} {놓임} {길흉} — 결과를 정한 열째
 │ [〔세점.펼침.결과보기〕]                             ← 단추 — 누르면 ③ 맨 위(결과 카드)로
 └ 다시 펼침이면(약 21%)
   〔세점.펼침.다시말〕                                ← {카드} = 첫 판 열째 — 둘째 판은 아직 놓이지 않았다
   [〔세점.펼침.섞기〕]                                 ← 같은 단추 글 두 번째
   [새 나 카드 앞면 · 바로] 이름 · 영어 + [뒷면 더미]    ← 첫 판 열째(코드가 찍음 · 나.* 글 없음)
   [〔세점.펼침.떼기〕] {n} = 1 · 2 · 3                 ← 같은 단추 글 두 번째 · 기다림 없음(답은 이미 왔다)
   [둘째 판 그림 — 차례로 나타남]
   〔세점.펼침.끝말〕                                  ← 결과를 정한 열째(둘째 판)
   [〔세점.펼침.결과보기〕]
── ③ 결과 — 물음 → 결론 → 근거 접힘 → 할 일 ──
〔세점.펼침.끝카드〕 [결과 카드] 이름 · 영어 · 〔놓임말〕    ← 지금 「뽑은카드」 자리 · 결과를 정한 열째
〔세점.펼침.궁정말〕                                   ← 결과 카드가 궁정 카드일 때만 · 한 줄(원문은 근거 접힘에 이미 찍힘)
세 점 · 셈(그대로)                                     ← 세점.결론머리 · 점마다 때 · 길흉 · 일어남 · 셈 · 같은달
▸ 〔근거〕(접힘)
  타로 칸 〔세점.점이름.타로〕
    〔세점.펼침.판머리〕                                ← {물음}(고를 칸)
    [첫 판 그림 — 움직임 없음]
    [자리 목록 1 ~ 10] 번호 · 〔자리.n〕 · 길흉 낱말 / 카드 이름 · 영어 · 놓임 / 〔자리뜻.n〕
    ┌ 다시 펼쳤으면
    │ 〔세점.펼침.다시말〕                              ← {카드} = 첫 판 열째
    │ 〔세점.펼침.다시보기〕                            ← 둘째 판 위 작은 머리(고를 칸 · 접힘 이름표 아님)
    └ [둘째 판 그림] [자리 목록 1 ~ 10]
    〔세점.펼침.끝말〕                                  ← 결과를 정한 열째(다시 펼쳤으면 둘째 판의 열째)
    〔세점.왜.타로.직접 | 전체〕 · 붙임 낱말 · 결과 카드 원문(영어) · 창 원문   ← 그대로
  사주 칸 · 자미 칸 · 24달 표(그대로)
할 일(그대로)
〔세점.다음카드〕
```

### 꼭 지킬 것

1. **우리 규칙을 전통 · 원문의 말로 내세우지 않는다**(COPY-0025 10-31 대조 1 — 「전통 타로에서는」). 원문 그대로인 것: 나 카드 계급(671) · 펜타클 궁정 = 짙은 머리 · 눈(673) · 섞고 세 번 떼기(677) · 열 자리와 뜻(679 ~ 703) · 열째가 결과(703) · 애매하면 열째를 나 카드로 다시(706) · 열째가 궁정 카드면 그 사람 손에(708). 우리 규칙(메인 추론)인 것: 손님 모두를 펜타클로 봄 · 여자 나 카드 경계를 만 40세로 읽음(671 「over forty years」 · 「less age」) · 바로 · 거꾸로 반반 · 카드를 물음 쪽 길흉으로 읽는 법(결정함 50) · 「애매함 = 길흉 함께」 · 다시 펼침 한 번까지 · 1 ~ 9째를 더하지 않음 · 창 24달 · 판 배치를 712 그림으로 고정. 우리 규칙은 「웨이트는 · 원문은 · 전통 타로에서는」에 붙이지 않는다.
2. **열째만 길흉을 정한다는 것을 숨기지 않는다** — 결과는 열 장 가운데 열째 한 장이고, 나머지 아홉은 자리마다 보여 줄 뿐이다. 1 ~ 9째 길흉을 더하거나 다수결로 말하지 않는다(「대체로 좋다 · 길이 많다」 X). 둘째 자리(가로지름)에 좋은 카드가 와도 「걸림돌이 없다」로 한쪽만 단정하지 않는다(681은 두 갈래).
3. **자리 뜻은 원문 679 ~ 703 그대로** — 덧붙이거나 꾸미지 않는다. 다른 켈틱 크로스(요즘 책 · 사이트)의 자리 이름 · 차례(의식 · 무의식 · 잠재의식 · 조언 같은 것)를 섞지 않는다. 웹 통설 타로 뜻 금지 — 카드 뜻은 웨이트 원문만(코드가 근거에 찍는다).
4. **나 카드 무늬(펜타클)는 673을 손님에게 적용한 것이다** — 「웨이트가 한국 사람 · 당신을 펜타클로 정했다」 X. 673의 살빛 말(sallow or swarthy)은 옮기지 않는다(머리 · 눈으로 충분 · 거부감). 그림 생김으로 「당신을 닮은 카드」라고 하지 않는다 — 페이지 그림은 젊은 남자 꼴인데 만 39세 이하 여자 손님에게 나온다.
5. **나이는 숫자(만 나이)로** — 남녀 모두 만 40세부터 윗계급이다: 남자 만 40세 = 나이트 · 여자 만 40세 = 퀸(만 39세 이하는 남자 킹 · 여자 페이지). 671 원문은 남 「forty years old and upward」 · 여 「over forty years」 · 「any female of less age」다. 만 40세 몇 달 된 여자는 「over forty years」이고 「less age」(마흔보다 어림)가 아니므로 퀸 — 이 경계 읽기는 우리 규칙(메인 추론)이라 원문 · 웨이트의 말로 내세우지 않는다. 「마흔 넘은 · 중년 · 젊은 · 청년」처럼 경계가 흐린 말만으로 쓰지 않는다. 프로필엔 아기도 있다(출산택일 손님) — 같은 규칙으로 남자 아기 = 킹 · 여자 아기 = 페이지. 킹이 40세 아래 남자 · 나이트가 40세 이상 남자인 것은 671 글자 그대로다 — 「뒤바뀐 것 같다」는 말도, 고친 기준도 쓰지 않는다.
6. **섞기 · 떼기는 웨이트 차례(677)를 따르는 누름이다** — 다시 펼침의 둘째 섞기 · 떼기도 같다(706 「again shuffled and cut three times」 · 같은 단추 글이 두 번째로 쓰인다). 「당신 손으로 섞은 · 당신이 뗀 자리가 카드를 정한다」 X(섞음은 서버가 무작위로 한다). 「마음을 담아 섞으면 …」처럼 결과를 약속하는 말 X. 참고(§7 밖 · 919 · 921): 물음은 시작 전에 또렷이 정하고, 섞는 동안엔 마음을 되도록 비운다 — 「물음을 떠올리며 섞으세요」는 921과 어긋난다. 919의 「소리 내어 되풀이」는 손님에게 시키지 않는다(누르기뿐).
7. **다시 펼침** — 706 원문은 「마지막 카드가 애매해 결론을 끌어낼 수 없으면」이다. 「웨이트가 길흉이 섞이면 다시 하라고 했다」 X. 다시 펼친 결과를 「더 정확 · 더 확실」이라 하지 않는다(원문은 「더 자세한(more detailed)」). 「한 번까지」를 쓴다면 우리 규칙으로.
8. **결과 카드가 궁정 카드** — 「그 사람」을 나이 · 성별 · 가족 · 연인 · 상사로 정하지 않는다. 「다른 사람 · 남의 손」이라고도 쓰지 않는다(다시 펼침에선 처음 나 카드가 덱으로 돌아가 열째로 나올 수 있다). 궁정 카드라서 흉 · 불확실이라고 하지 않는다(길흉은 그 카드 방향 그대로). 「한 번 더 펼쳐 보세요」 X(이 화면은 708 둘째 문장을 하지 않고, 같은 물음은 같은 달에 다시 펼치지 않는다).
9. **큰 카드가 결과**(약 3할)여도 따로 말하는 칸은 없다 — 705 「sparks from heaven」을 길흉 · 무게 · 「운명적」으로 바꾸지 않는다. §5(같은 계급이 여러 장 · 592 ~ 655) · §8 · §9 도 쓰지 않는다 — 「같은 숫자 카드가 여러 장 나와서 …」 X.
10. **펼침 판 칸에 「한 장 · 고른 카드 · 뽑은 카드」를 쓰지 않는다** — 손님은 카드를 고르지 않는다.
11. **판 배치는 712 그림 고정**(6 앞 = 왼쪽 · 5 뒤 = 오른쪽)이라 덱 그림 인물이 보는 쪽과 다를 수 있다 — 자리 글에 「왼쪽 · 오른쪽 · 바라보는 쪽」을 쓰지 않는다. 여덟째 「His house」는 둘레(environment)라는 뜻이다 — 「집 · 땅 · 재산」 물음의 집과 헷갈리지 않게.
12. **COPY-0025 「꼭 지킬 것」 그대로** — 셋이 서로 확인 · 증명 · 맞혔다 X · 사주 점은 들어옴 · 나감을 정하지 않음(법전 21조) · 기준 다섯(일반인이 · 알아먹게 · 있는 그대로 · 가감없이 · 단호하게) · 「수 있어요 · 편이에요」 X · 첫 층에 한자 · 사주 낱말 X · 「…실단」 X. 손님에게 묻는 말(머리 빛 · 기질 · 나이 확인) X — 손님이 할 일은 누르기뿐.

### 숫자(메인 셈 10-31)

| 타로 점 | 길 | 흉 | 섞임(길흉 함께) |
|---|---|---|---|
| 한 장(지금) | 38.0% | 41.2% | 20.8% |
| 켈틱(열째 · 다시 펼침 한 번까지) | 45.9% | 49.8% | 4.3% |

- 카드 몫은 카드면을 모두 센 정확 셈이다(물음 10 × 성별 2 × 나 카드 2 = 40줄 평균 · 두 줄을 섞기 · 떼기 셋 · 다시 펼침까지 10만 번 시늉해 맞춰 봄 — 차 0.25%p 안). 나 카드(나이)는 몫을 바꾸지 않는다(성별 차이는 곁의 사람 물음에서만 조금).
- **다시 펼침 약 21%**(물음마다 18.8 ~ 22.7%) — 다섯에 하나 꼴로 열 장이 두 번 놓인다. 섞임은 물음마다 3.4 ~ 5.0%로 드물어진다(다시 펼친 열째도 섞임일 때만). 길 : 흉 비는 그대로(0.92) — 한 장의 섞임을 길 · 흉으로 거의 같은 비로 나눌 뿐이다.
- **결과 카드가 궁정 카드 약 20%**(20.1 ~ 21.2%) — 궁정말이 다섯에 하나 꼴로 나간다. **큰 카드 약 29 ~ 31%**(29.3 ~ 30.9% · 첫 펼침만이면 28.6% = 22/77).
- 길흉을 정하는 건 열째뿐 — 1 ~ 9째는 자리 읽기(근거).
- 세 점 셈(지어낸 2,000명 · 사주 · 자미 점은 엔진으로 잼 · 타로는 위 몫을 곱함): 셋 다 길 물음마다 3.3 ~ 5.6% → 3.9 ~ 6.8% · 셋 다 흉 1.3 ~ 2.1% → 1.6 ~ 2.6%. 여전히 드물다 — 셋은 서로 확인하지 않는다.

## 원문 — 웨이트 Part III §7

`docs/원문/Waite_The_Pictorial_Key_to_the_Tarot_Part3.txt` 의 줄 번호 · 글자 그대로. 메인 대조와 화면 근거 칸이 이 줄로 한다. 우리말로 옮길 땐 뜻만 — 빼거나 더하지 않는다.

> **671** This mode of divination is the most suitable for obtaining an answer to a definite question. The Diviner first selects a card to represent the person or matter about which inquiry is made. This card is called the Significator. Should he wish to ascertain something in connexion with himself he takes the one which corresponds to his personal description. A Knight should be chosen as the Significator if the subject of inquiry is a man of forty years old and upward; a King should be chosen for any male who is under that age; a Queen for a woman who is over forty years; and a Page for any female of less age.

> **673** The four Court Cards in Wands represent very fair people, with yellow or auburn hair, fair complexion and blue eyes. The Court Cards in Cups signify people with light brown or dull fair hair and grey or blue eyes. Those in Swords stand for people having hazel or grey eyes, dark brown hair and dull complexion. Lastly, the Court Cards in Pentacles are referred to persons with very dark brown or black hair, dark eyes and sallow or swarthy complexions. These allocations are subject, however, to the following reserve, which will prevent them being taken too conventionally. You can be guided on occasion by the known temperament of a person; one who is exceedingly dark may be very energetic, and would be better represented by a Sword card than a Pentacle. On the other hand, a very fair subject who is indolent and lethargic should be referred to Cups rather than to Wands.

> **677** Having selected the Significator, place it on the table, face upwards. Then shuffle and cut the rest of the pack three times, keeping the faces of the cards downwards.

> **679** Turn up the top or First Card of the pack; cover the Significator with it, and say: This covers him. This card gives the influence which is affecting the person or matter of inquiry generally, the atmosphere of it in which the other currents work.

> **681** Turn up the Second Card and lay it across the First, saying: This crosses him. It shews the nature of the obstacles in the matter. If it is a favourable card, the opposing forces will not be serious, or it may indicate that something good in itself will not be productive of good in the particular connexion.

> **683** Turn up the Third Card; place it above the Significator, and say: This crowns him. It represents (a) the Querent's aim or ideal in the matter; (b) the best that can be achieved under the circumstances, but that which has not yet been made actual.

> **685** Turn up the Fourth Card; place it below the Significator, and say: This is beneath him. It shews the foundation or basis of the matter, that which has already passed into actuality and which the Significator has made his own.

> **687** Turn up the Fifth Card; place it on the side of the Significator from which he is looking, and say: This is behind him. It gives the influence that is just passed, or is now passing away.

> **689** N.B.—If the Significator is a Trump or any small card that cannot be said to face either way, the Diviner must decide before beginning the operation which side he will take it as facing.

> **691** Turn up the Sixth Card; place it on the side that the Significator is facing, and say: This is before him. It shews the influence that is coming into action and will operate in the near future.

> **693** The cards are now disposed in the form of a cross, the Significator—covered by the First Card—being in the centre.

> **695** The next four cards are turned up in succession and placed one above the other in a line, on the right hand side of the cross.

> **697** The first of these, or the Seventh Card of the operation, signifies himself—that is, the Significator—whether person or thing—and shews its position or attitude in the circumstances.

> **699** The Eighth Card signifies his house, that is, his environment and the tendencies at work therein which have an effect on the matter—for instance, his position in life, the influence of immediate friends, and so forth.

> **701** The Ninth Card gives his hopes or fears in the matter.

> **703** The Tenth is what will come, the final result, the culmination which is brought about by the influences shewn by the other cards that have been turned up in the divination.

> **705** It is on this card that the Diviner should especially concentrate his intuitive faculties and his memory in respect of the official divinatory meanings attached thereto. It should embody whatsoever you may have divined from the other cards on the table, including the Significator itself and concerning him or it, not excepting such lights upon higher significance as might fall like sparks from heaven if the card which serves for the oracle, the card for reading, should happen to be a Trump Major.

> **706** The operation is now completed; but should it happen that the last card is of a dubious nature, from which no final decision can be drawn, or which does not appear to indicate the ultimate conclusion of the affair, it may be well to repeat the operation, taking in this case the Tenth Card as the Significator, instead of the one previously used. The pack must be again shuffled and cut three times and the first ten cards laid out as before. By this a more detailed account of "What will come" may be obtained.

> **708** If in any divination the Tenth Card should be a Court Card, it shews that the subject of the divination falls ultimately into the hands of a person represented by that card, and its end depends mainly on him. In this event also it is useful to take the Court Card in question as the Significator in a fresh operation, and discover what is the nature of his influence in the matter and to what issue he will bring it.

> **712** I here append a diagram of the cards as laid out in this mode of divination. The Significator is here facing to the left.

> **718 ~ 739**(그림의 이름) The Significator. · 1. What covers him. · 2. What crosses him. · 3. What crowns him. · 4. What is beneath him. · 5. What is behind him. · 6. What is before him. · 7. Himself. · 8. His house. · 9. His hopes or fears. · 10. What will come.

§7 밖 줄(참고 — 이 판의 규칙이 아니다):

> **588**(§4 끝) All meanings are largely independent of one another and all are reduced, accentuated or subject to modification and sometimes almost reversal by their place in a sequence. There is scarcely any canon of criticism in matters of this kind.

> **901**(§8 — 정한 물음이 없을 때의 법. 창 24달은 이 줄이 아니라 우리 규칙 · 결정함 67) This method is recommended when no definite question is asked—that is, when the Querent wishes to learn generally concerning the course of his life and destiny. If he wishes to know what may befall within a certain time, this time should be clearly specified before the cards are shuffled.

> **919 · 921**(Notes on the Practice of Divination) 1. Before beginning the operation, formulate your question definitely, and repeat it aloud. / 2. Make your mind as blank as possible while shuffling the cards.

## 칸 — `app/three-pieces.js` `"세점"` → `"펼침"` (새 칸 34 — 필수 31 · 고를 칸 3)

열쇠 꼴 — 메인 뼈대가 빈 칸으로 먼저 넣어 두었으면 그 칸을 채운다. 없으면 `"세점"` 맨 끝(`"다음카드"` 뒤)에 이 꼴로 더한다. 열쇠 이름은 바꾸지 않는다.

```js
"펼침": {
  "나": { "Page": "", "Knight": "", "Queen": "", "King": "" },
  "섞기": "",
  "떼기": "",
  "결과보기": "",
  "기다림": "",
  "판머리": "",
  "자리": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "10": "" },
  "자리뜻": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "10": "" },
  "끝말": "",
  "다시말": "",
  "다시보기": "",
  "궁정말": "",
  "끝카드": ""
}
```

값 자리는 `{중괄호}` — 말은 바꿔도 자리는 남긴다. 조사는 값 받침에 맞춰 붙는다(`{카드}가` → 「펜타클 킹(왕)이 · 완드 6이 · 바보가」 — 끝 괄호는 건너뛰고 그 앞말에, 끝 숫자는 한자음 받침으로). 값: `{카드}` = 카드 이름(지금은 서버 카드 표 이름 — 예: 「펜타클 나이트(기사)」 · 「심판」 · 「완드 6」. 맨 위 `카드이름` 칸이 차면 그 이름) — 바로 · 거꾸로는 들어 있지 않다 · `{놓임}` = `놓임말` 칸 글(「바로」 · 「거꾸로」) — **뒤에 「으로 · 로」를 붙이지 않는다**(「바로로 · 거꾸로로」가 된다 — 화면 검사기가 막는다. 「{놓임} 놓여」 꼴로) · `{길흉}` = `세점.길흉말` 칸 글(「길」 · 「흉」 · 「길흉 함께」) · `{물음}` = `세점.물음말` 칸 글(「돈」 · 「연애·결혼」 …) · `{n}` = 1 · 2 · 3. `{새카드}` 값은 없다(다시 펼친 열째는 `끝말`의 `{카드}`가 말한다). 코드가 찍는 것: 카드 그림 · 이름 · 영어 이름 · 놓임 · 자리 번호 · 자리마다 길흉 낱말(`세점.길흉말` 다시 씀) · 웨이트 원문 영어 · 줄 번호. `세점.펼침.끝말`은 맨 위 `끝말`(오늘의 운세로 잇는 줄)과, `세점.펼침.기다림`은 `세점.기다림`(한 장 판)과 다른 칸이다.

아래 표에서 「고를 칸」 셋(`기다림` · `판머리` · `다시보기`)은 비면 그 줄만 빠진다. 나머지 31칸은 **필수 칸** — 하나라도 비면 펼침이 켜지지 않는다(맨 위 「켜지는 법」). ① 의식 · ② 펼친 순간 · ③ 결과는 위 「화면 차례」의 묶음이다.

| 칸 | 어디에 · 값 | 원문 | 뜻(우리끼리 — 손님 문장 아님) | 길이 |
|---|---|---|---|---|
| `나.Page` | ① 의식 — 나 카드(P11 펜타클 페이지(시종)) 그림 · 이름 아래 한 줄 · 값 없음 · 첫 의식에만(다시 펼침의 새 나 카드엔 안 나온다) | 671 · 673 | 왜 이 카드가 당신인가: 자기 일을 물어서 자기 모습에 맞는 궁정 카드를 고름(671) · 만 39세 이하 여자 = 페이지(「a Page for any female of less age」 — 마흔보다 어린 여자) · 무늬 펜타클 = 머리 · 눈이 짙은 사람을 나타내는 궁정 카드(673 — 손님 모두에게 적용한 우리 규칙) · 이 카드는 당신 자리를 표시할 뿐 길흉을 읽지 않음 | 한두 문장 |
| `나.Knight` | 같은 자리(P12 펜타클 나이트(기사)) | 671 · 673 | 만 40세 이상 남자 = 나이트(「a man of forty years old and upward」) · 나머지 같음 | 한두 문장 |
| `나.Queen` | 같은 자리(P13 펜타클 퀸(여왕)) | 671 · 673 | 만 40세 이상 여자 = 퀸(「a Queen for a woman who is over forty years」 — 만 40세 몇 달 된 여자는 마흔 해를 넘겼고 「less age」가 아니다. 이 경계 읽기는 우리 규칙(메인 추론)) · 나머지 같음 | 한두 문장 |
| `나.King` | 같은 자리(P14 펜타클 킹(왕)) | 671 · 673 | 만 39세 이하 남자 = 킹(「a King should be chosen for any male who is under that age」) · 나머지 같음 | 한두 문장 |
| `섞기` | ① 의식 단추 — 값 없음. 다시 펼침이면 ② 펼친 순간의 둘째 의식에서 같은 글이 한 번 더 쓰인다 — 두 번째로 읽혀도 어색하지 않게 | 677 · 706 | 나 카드를 뺀 나머지 77장을 앞면이 아래로 가게 섞는다(다시 펼칠 때도 「again shuffled」 — 706) | 단추 글 — 짧게 |
| `떼기` | 섞은 뒤 같은 단추 — `{n}` = 이번 누름이 몇 번째 떼기인지(1 · 2 · 3). 첫 의식은 셋째를 누르면 답을 부르고, 둘째 의식(다시 펼침)은 셋째를 누르면 둘째 판이 놓인다 — 같은 글이 두 번째로 쓰인다 | 677 · 706 | 세 번 뗀다 | 단추 글 — 짧게 |
| `결과보기` | ② 펼친 순간 — 열 장이 다 놓인 판(다시 펼쳤으면 둘째 판) 아래 · `끝말` 아래 단추. 누르면 ③ 결과(맨 위 결과 카드)로 간다 · 값 없음 · 펼친 순간이 처음 한 번만이라 이 단추도 한 번만 보인다 | — | 열 장을 다 본 뒤 결과(세 점)로 넘어가는 누름 | 단추 글 — 짧게 |
| `기다림` · 고를 칸 | ① 셋째 떼기 뒤 답을 기다리는 동안(첫 의식만) — 값 없음 | 677 · 679 | 나 카드를 뺀 77장에서 열 장을 놓고 세 점(타로 · 사주 · 자미)을 재는 중. 「고른 카드」 X — 지금 `세점.기다림`(「고른 카드와 태어난 때를 바탕으로 …」)은 한 장 판에 남는다 | 한 문장 |
| `판머리` · 고를 칸 | ③ 근거 접힘 타로 칸 맨 앞(타로 점 이름 아래 · 첫 판 그림 위) — ② 펼친 순간엔 없다. `{물음}` | 671 · 712 | 이 물음으로 펼친 열 장(§7 은 정해진 물음에 답을 얻는 법 — 671 첫 문장). ③ 결과의 `세점.결론머리`(「{물음}, 세 점을 나란히 봅니다.」)와 말이 겹치지 않게 | 머리 — 짧게 |
| `자리.1` ~ `자리.10` | ③ 근거 접힘의 자리 목록(판 그림 아래) — 자리마다 이름. 번호는 코드가 찍으니 넣지 않는다. 다시 펼치면 둘째 판 목록에도 같은 칸. ② 펼친 순간의 판 그림엔 번호만 있고 이 글은 없다 | 718 ~ 739 · 679 ~ 703 | 아래 자리 표 | 짧게(이름표) |
| `자리뜻.1` ~ `자리뜻.10` | ③ 근거 접힘의 자리 목록 — 그 자리 카드 이름 아래 한 줄 | 679 ~ 703 | 아래 자리 표 — 원문 뜻만 | 한 문장 |
| `끝말` | 두 곳 — ② 펼친 순간: 판 그림(다시 펼쳤으면 둘째 판 그림) 아래 · `결과보기` 위 / ③ 근거 접힘 타로 칸: 자리 목록(다시 펼쳤으면 둘째 자리 목록) 아래 · `세점.왜.타로.*` 위. `{카드}` = 길흉을 정한 열째(다시 펼쳤으면 다시 펼친 열째) · `{놓임}` = 그 카드 놓임(「바로」 · 「거꾸로」 — 뒤에 「으로」 X · 「{놓임} 놓여」 꼴) · `{길흉}` = 그 카드가 이 물음에 읽힌 길흉(= 타로 점의 길흉) | 703 · 705 | 타로 점의 길흉은 열째 카드 하나로 정한다 — 열째는 「올 것 · 마지막 결과」(703). 나머지 아홉 장은 자리마다 보여 줄 뿐 길흉에 더하지 않는다(우리 규칙). 열째가 결과인 까닭은 이 칸이 말한다(아래 「다시 볼 칸」은 한 장 결과에도 나와 「열째」를 못 쓴다) | 한두 문장 |
| `다시말` | 다시 펼쳤을 때만 · 두 곳 — ② 펼친 순간: 첫 판 그림 아래 · 둘째 `섞기` 단추 위(둘째 판은 아직 놓이지 않았다) / ③ 근거 접힘 타로 칸: 첫 자리 목록 아래 · `다시보기` · 둘째 판 위. `{카드}` = 첫 판의 열째(이 물음에 길흉 함께로 읽혀 새 나 카드가 된 카드) — **값은 이것 하나**. 둘째 판의 결과(다시 펼친 열째 · 그 길흉)는 말하지 않는다(②에선 아직 나오지 않았다 — 결과는 `끝말`이 말한다). ②에선 이 글 바로 뒤에 `섞기` · `떼기` 단추 글이 두 번째로 나온다. 단추를 가리키는 말 X(③ 근거 접힘엔 단추가 없다) | 706 | 원문: 마지막 카드가 애매해 결론을 끌어낼 수 없으면, 그 열째를 나 카드로 삼아 다시 섞고 세 번 떼어 열 장을 놓는다 — 「올 것」을 더 자세히. 「길흉 함께 = 애매」 · 한 번까지 = 우리 규칙 | 한두 문장 |
| `다시보기` · 고를 칸 | 다시 펼쳤을 때만 — ③ 근거 접힘 타로 칸: `다시말` 아래 · 둘째 판(그림 + 자리 목록 — 결과를 정한 열째가 있는 판) 위 작은 머리 · 값 없음. 접힘 이름표가 아니다(근거 접힘 하나 안에 차례로 놓인다) | 706 | 다시 펼친 열 장 | 머리 — 짧게 |
| `궁정말` | 결과 카드가 궁정 카드일 때만 — ③ 결과 카드 칸 바로 아래 한 줄(세 점 위). `{카드}` = 그 궁정 카드. 그 카드의 웨이트 원문(§2)은 근거 접힘 타로 칸의 결과 카드 원문으로 이미 찍힌다 — 궁정말 곁에 따로 찍지 않는다 | 708 | 이 일은 끝내 그 카드가 나타내는 사람 손에 들어가고, 끝은 주로 그에게 달렸다. 그 사람이 누구인지는 정하지 않음 · 길흉은 그대로 | 한 문장 |
| `끝카드` | ③ 결과 맨 위 — 결과 카드 칸 머리(지금 `뽑은카드` 「내가 고른 카드」 자리 · 물음 열 바로 아래 · 세 점 위). `결과보기`를 누르면 여기로 온다 · 값 없음 | 703 | 결과를 정한 카드(열째 — 다시 펼쳤으면 다시 펼친 열째) | 머리 — 짧게 |

`나.*` 넷은 첫 의식에만 쓴다(다시 펼칠 때의 새 나 카드는 첫 판 열째라 나이 · 성별과 무관 — 앞면이 위로 · 바로 놓이고 이름은 코드가 찍는다 · 까닭은 `다시말`이 맡는다). `끝말`은 늘, `다시말` · `다시보기`는 약 21%, `궁정말`은 약 20% 나가고 함께 나올 수 있다(다시 펼친 결과가 궁정 카드) — 말이 겹치지 않게. 근거 접힘의 다시 펼친 판은 첫 판(그림 · 자리 목록) → `다시말` → `다시보기` → 둘째 판(그림 · 자리 목록) → `끝말` 차례다 — `다시말`은 첫 판의 열째, `끝말`은 결과를 정한 둘째 판의 열째를 말한다(어느 판의 열째인지 헷갈리지 않게). ② 펼친 순간은 처음 한 번만 보이므로 손님이 `다시말` · `끝말`을 ③ 근거 접힘에서 처음 읽을 수 있다 — 두 곳 어디서든 홀로 읽히게 쓴다.

### 자리 표 — `자리.n` · `자리뜻.n` 의 원문

him = 나 카드 = 손님(남녀 모두) — 성별 낱말 없이 쓴다.

| n | 그림 이름(줄) | 놓는 곳 | 뜻 원문(줄) | 우리끼리 뜻 |
|---|---|---|---|---|
| 1 | 1. What covers him.(720) | 나 카드를 덮음 | 「This card gives the influence which is affecting the person or matter of inquiry generally, the atmosphere of it in which the other currents work.」(679) | 이 일에 두루 미치는 기운 — 다른 흐름이 그 안에서 움직이는 바탕 공기 |
| 2 | 2. What crosses him.(723) | 1 위에 가로로 | 「It shews the nature of the obstacles in the matter.」 「If it is a favourable card, the opposing forces will not be serious, or it may indicate that something good in itself will not be productive of good in the particular connexion.」(681) | 걸림돌의 성질. 둘째 문장은 두 갈래(좋은 카드면 맞서는 힘이 대단치 않거나, 그 자체로 좋은 것이 이 일에선 좋은 열매를 맺지 못함) — 넣는다면 두 갈래 다 |
| 3 | 3. What crowns him.(725) | 나 카드 위 | 「It represents (a) the Querent's aim or ideal in the matter; (b) the best that can be achieved under the circumstances, but that which has not yet been made actual.」(683) | (a) 이 일에서 바라는 목표 · 이상 (b) 이 형편에서 이룰 수 있는 가장 좋은 것 — 아직 이루어지지 않은 것 |
| 4 | 4. What is beneath him.(727) | 나 카드 아래 | 「It shews the foundation or basis of the matter, that which has already passed into actuality and which the Significator has made his own.」(685) | 이 일의 바탕 — 이미 이루어져 제 것이 된 것 |
| 5 | 5. What is behind him.(729) | 오른쪽(나 카드가 등진 쪽) | 「It gives the influence that is just passed, or is now passing away.」(687) | 막 지나갔거나 지금 지나가는 기운 |
| 6 | 6. What is before him.(731) | 왼쪽(나 카드가 보는 쪽) | 「It shews the influence that is coming into action and will operate in the near future.」(691) | 움직이기 시작해 가까운 앞날에 작용할 기운 |
| 7 | 7. Himself.(733) | 기둥 맨 아래 | 「signifies himself—that is, the Significator—whether person or thing—and shews its position or attitude in the circumstances.」(697) | 나 자신 — 이 형편 속 나의 자리 · 태도 |
| 8 | 8. His house.(735) | 기둥 둘째 | 「signifies his house, that is, his environment and the tendencies at work therein which have an effect on the matter—for instance, his position in life, the influence of immediate friends, and so forth.」(699) | 나의 둘레 — 이 일에 닿는 환경과 그 안의 흐름(살림 처지 · 가까운 벗의 영향 등) |
| 9 | 9. His hopes or fears.(737) | 기둥 셋째 | 「The Ninth Card gives his hopes or fears in the matter.」(701) | 이 일에 대한 바람 또는 두려움 |
| 10 | 10. What will come.(739) | 기둥 맨 위 | 「The Tenth is what will come, the final result, the culmination which is brought about by the influences shewn by the other cards that have been turned up in the divination.」(703) | 올 것 — 마지막 결과. 다른 카드들이 보인 기운이 빚어 낸 끝 |

## 다시 볼 칸 — 「한 장」을 전제한 칸

열쇠 이름은 그대로. 줄은 10-31 main 의 `app/three-pieces.js`. 펼침 판이 켜진 뒤 이 칸들은 (가) 펼침 결과(③)와 (나) 켜지기 전 이번 달에 이미 한 장으로 본 손님의 한 장 결과(그 달이 끝날 때까지 그대로 다시 그려진다)에 **같이** 나온다 — 고칠 땐 「열째 · 뽑은 · 고른」 대신 「결과 카드(결과를 정한 카드)」처럼 둘 다에 맞는 말로 쓴다. 고친 글이 한 장 판에 먼저 나가지 않게 **펼침 칸과 한 PR 로** 낸다.

| 칸 | 줄 | 지금 글 | 펼침 판에서 |
|---|---|---|---|
| `세점.창말` | 109 | 「{창}, 앞으로 두 해의 {물음}을 봅니다.」 | 볼 것 — ① 의식(펼치기 전) 맨 위에 그대로 보인다. 카드 수를 말하지 않아 그대로 써도 된다. 창 24달은 우리 규칙(§7 은 기간을 말하지 않는다 · 901은 §8 줄) — 웨이트에 붙이지 않는다 |
| `세점.뽑기말` | 110 | 「{물음}을 생각하며 한 장 골라 주세요. 이 물음의 카드는 이번 달 동안 그대로입니다.」 | 그대로 — 펼침 판에선 부르지 않는다(한 장 판의 일곱 장 고르기 전용). 펼치기 전 안내는 `세점.펼침.나.*` · `섞기` · `떼기`가 맡는다 |
| `세점.기다림` | 111 | 「고른 카드와 태어난 때를 바탕으로 세 점을 펼치고 있습니다.」 | 그대로 — 펼침 판에선 `세점.펼침.기다림`이 대신한다(한 장 판 전용) |
| `뽑은카드`(맨 위 칸) | 19 | 「내가 고른 카드」 | 그대로 — 펼침 판에선 `세점.펼침.끝카드`가 대신한다(이번 달 한 장 결과 · 옛 판엔 그대로 나온다). `카드읽기`(일곱 장 고르기)도 펼침 판에선 부르지 않는다 |
| `세점.때.타로` | 119 | 「{창} · 두 해 전체」 | 볼 것 — 결과 카드도 달을 짚지 않는다. 그대로 써도 된다 |
| `세점.왜.타로.직접` | 561 | 「뽑은 카드의 방향에 해당하는 웨이트 원문에 이 물음을 가리키는 말이 있습니다. 그 말을 우선해 읽되, 덧뜻에만 나온 말이 카드의 본뜻과 엇갈리면 길흉 함께로 봅니다. 카드는 특정 달을 고르지 않고 앞으로 두 해 전체를 봅니다.」 | **고침** — 「뽑은 카드」 → 「결과 카드(결과를 정한 카드)」 — 펼침이면 열째(다시 펼쳤으면 다시 펼친 열째), 이번 달 한 장 결과면 그 한 장. 「열째」는 쓰지 않는다(열째가 결과인 까닭 703은 `세점.펼침.끝말`이 말한다 — 펼침 결과의 근거 접힘에선 그 `끝말` 바로 아래에 오니 말이 겹치지 않게) |
| `세점.왜.타로.전체` | 562 | 「뽑은 카드의 방향에 해당하는 웨이트 원문에 이 물음을 직접 가리키는 말이 없어, 카드 전체 뜻으로 길흉을 읽었습니다. 카드는 특정 달을 고르지 않고 앞으로 두 해 전체를 봅니다.」 | **고침** — 위와 같음 + COPY-0025 끝 절 3(성별로 갈리는 원문 — 「이 손님(성별)에게 해당하는 말이 없어」)을 같이 |
| `세점.왜.타로.덧뜻` | — | 없음 | 칸 없음 |
| `세점.일어남.<물음>.타로.<길 · 흉 · 섞임>` 30칸 | 137 ~ 139 · 158 ~ 160 · 179 ~ 181 · 200 ~ 202 · 221 ~ 223 · 242 ~ 244 · 263 ~ 265 · 284 ~ 286 · 305 ~ 307 · 326 ~ 328 | 「카드를 …로 읽습니다」 꼴 | 볼 것 — 그 카드 = 결과 카드(펼침의 열째 · 이번 달 한 장 결과의 그 한 장). 어느 카드인지 헷갈리면 「결과 카드」로 — 「열째 카드」는 쓰지 않는다(한 장 결과에도 나온다). 몸 · 마음 6칸(305 ~ 307 · 326 ~ 328)의 「전통 타로에서는」은 COPY-0025 끝 절 1 그대로 고친다(아직이면 이 PR 에서). 섞임은 드물어진다(약 4%) |
| `세점.다음카드` | 574 | 「이 물음의 새 카드는 {날}부터 고릅니다. 그날 보는 두 해의 시작과 끝도 각각 한 달씩 늦춰집니다. 다른 물음은 지금 골라도 됩니다.」 | **고침** — 「새 카드 … 고릅니다」 → 이 물음을 `{날}`부터 새로 펼친다(이번 달 한 장 결과에도 나오는데, 다음 달엔 그 손님도 펼침이라 맞다). 창이 한 달 늦춰지는 말 · 다른 물음은 지금 골라도 된다는 말은 그대로 |

그대로 두는 칸: `세점.할일.*.타로.*` 30칸(카드 수를 말하지 않는다) · `놓임말` · `카드이름` · `오류.*`.

## 알아 둘 것(우리끼리 — 사장님 검수 대상)

- 671의 킹 · 나이트 나이는 거꾸로 보이지만 글자 그대로 둔다.
- 여자 나 카드 경계는 남자와 같이 만 40세부터(퀸)다 — 671 「over forty years」 · 「any female of less age」를 만 나이로 읽은 메인 추론. 10-31 처음 주문의 「만 41세부터 퀸」은 정수 나이로 잘못 읽은 것이라 고쳤다.
- 페이지(P11) 그림은 젊은 남자 꼴(덱 그림 그대로)이다 — 만 39세 이하 여자 손님의 나 카드로 나온다. 그림을 바꿀지는 그림 주문 몫.
- 홈 표지(IMG-0065 · 0066 「뒤집힌 카드 일곱 중 한 장을 집으려는 순간」)는 한 장 꼴 그림이다 — 이 주문 밖.
- 창 24달의 근거로 쓰던 901줄은 §8(정한 물음이 없을 때의 법) 문장이다 — 창은 우리 규칙(결정함 67)으로 남는다.

## 끝나면

- 가지 `codex/COPY-0026` → PR. PR 설명에 칸마다 「전 → 후 · 까닭」(새 칸은 「빈 칸 → 글」), 망설인 칸은 「판단 필요」로.
- `node` 로 `app/three-pieces.js` 를 불러 깨지지 않는지(따옴표 · 쉼표)와 `세점.펼침` 34칸이 다 찼는지(적어도 필수 31칸) 본다.
- 메인이 뜻 대조(원문 줄 · 엔진) · 화면 글 검사기(펼침 결과 화면 — 「{틀}」 · 틀린 조사 · 「바로로 · 거꾸로로」 · 빈 칸) · 합치기 · 배포. 필수 칸 31이 다 차면 펼침 판이 켜진다(스위치) — 그 전엔 한 장 판 그대로.
- INDEX.md 상태를 「제안됨」으로.
