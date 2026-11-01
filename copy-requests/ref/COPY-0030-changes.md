# COPY-0030 — 전후 문장과 확인 기록

상태: 제안됨 · 2026-11-02

기준 main: f5537254. 공개 문장 파일 네 개만 수정했습니다. 기존 응답으로 표시 문장을 조립하며 새 판정·필터·비율을 만들지 않습니다. 비공개 파일·삽화·배치는 수정하지 않았습니다.

## 주문 1~5 대응

| 항목 | 변경 | 파일 |
|---|---|---|
| 1 첫 화면 | 결론 바로 아래에 그 결론을 읽은 이유. 칭찬과 걸림을 별도 조건으로 연결 | jeongtong-distinct-reading.js / myeongban-filter.js |
| 2 세 층 | 전체 특징·분야 제목·조건 제목의 역할 구분. 동일한 큰 제목 반복 제거. 한자는 근거로 | jeongtong-story.js / myeongban-filter.js |
| 3 쉬운 말 | 문관·무관·묘왕·입묘의 뜻을 먼저. 기존 문장 사전 19칸 수정 | myeongban-prose.js / myeongban-filter.js |
| 4 비율 | ‘여기까지의 조건을 모두 갖춘 비교 명식’. 수치는 그대로 | jeongtong-story.js / myeongban-filter.js |
| 5 종합 | 사주는 힘의 구조·받침·걸림, 자미두수는 주된 분야·함께 나타난 조건·경계로 마무리 | jeongtong-distinct-reading.js / myeongban-filter.js |

## 대표 문장 전 → 후 · 까닭

| 전 | 후 | 까닭 |
|---|---|---|
| 이 강점을 받치는 조건 | 이 사주의 강점이 작동하는 조건 | 받침이 없는 명식에도 맞는 중립적 머리. 새 판정 갈래를 만들지 않음 |
| 첫 결론 뒤 다른 필터의 칭찬 문장 | 이유는 사주에 있습니다. {현재 판정의 설명} | 칭찬과 경고가 근거 없이 충돌하지 않음 |
| 같은 기전 설명을 걸림에서도 반복 | 격에 남은 흠 또는 깨진 조건이 좋은 조건 때문에 없어지지 않는다는 설명 | 제목·조건·걸림의 역할 분리 |
| 좋은 조건이 가장 많이 모인 분야는… | 이렇게 읽은 배치: {이미 확인한 조건} | 제목 선정 설명 대신 이용자에게 해당하는 이유 |
| 문곡이 묘왕이면 문관과 무관 모두 맞다. | 사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽이 맞습니다. 문곡이 힘을 잘 발휘하는 자리에 있기 때문입니다. | 낯선 말보다 뜻을 먼저 |
| 누적 조건 설명 없이 비율 강조 | 여기까지의 조건을 모두 갖춘 비교 명식 | 능력 점수·좋은 정도와 구분 |
| 같은 첫 결론의 반복 또는 모두에게 같은 맺음 | {중심 힘} → {작동 구조} → {함께 나타난 조건과 제약} | 조건들을 한 사람의 구성으로 읽음 |

조건 머리를 추후 별도로 나눈다면 Claude에게 제안하는 두 문장: ‘이 강점을 받치는 조건’ / ‘이 강점을 막는 조건’. 이번 PR은 분류 코드를 추가하지 않고 중립 머리로 썼습니다.

## 가상 명식 네 명의 첫 결론 · 마지막 결론

아래 생일은 주문서에 지정된 가상 입력입니다. 실제 고객 자료가 아닙니다. 각 네 명의 첫 제목과 마지막 제목이 모두 서로 다르고, 같은 사람의 정통사주·자미두수 결론도 다릅니다.

| 가상 입력 | 정통사주 처음 → 마지막 | 자미두수 처음 → 마지막 |
|---|---|---|
| 1994-03-15 10:00 여 | 재물이 맡은 일을 뒷받침합니다.<br>→ 사람과 기회로 넓히는 돈벌이 — 강점이 힘을 얻는 구성 | 바깥 활동과 인연 밖에서 사람의 도움을 받는 사람<br>→ 바깥 활동과 인연의 강점과 제약 — 밖에서 만나는 도움 |
| 1988-11-02 14:00 남 | 돈벌이가 필요한 배움과 도움을 해칩니다.<br>→ 배움과 도움 — 강점과 걸림을 함께 읽는 구성 | 마음과 삶의 즐거움 평온하게 복을 누리는 사람<br>→ 마음과 삶의 즐거움의 강점과 제약 — 평온하게 살아가는 배치 |
| 2001-07-21 06:00 여 | 돈을 벌어도 내 몫을 지키는 데 막힙니다.<br>→ 사람과 기회로 넓히는 돈벌이 — 강점과 걸림을 함께 읽는 구성 | 마음과 삶의 즐거움 도움을 주는 사람이 곁에 있는 사람<br>→ 마음과 삶의 즐거움의 강점과 제약 — 도움을 주는 사람이 곁에 있음 |
| 1979-01-09 22:00 남 | 생각이 실행을 막고 풀어 줄 힘도 없습니다.<br>→ 꾸준히 만드는 힘 — 강점과 걸림을 함께 읽는 구성 | 타고난 바탕 — 온 집안이 조직에서 받는 봉급을 누리는 사람<br>→ 타고난 바탕의 강점과 제약 — 함께 누리는 넉넉함 |

## 실제 마무리 문단

### 가상 1 · 정통사주

사람과 기회로 넓히는 돈벌이 — 강점이 힘을 얻는 구성

타고난 중심은 사람과 기회로 넓히는 돈벌이입니다. 이를 실제로 쓰는 구조는 다음과 같습니다. 맡은 일을 뒷받침할 재성이 있습니다. 여기에 「女命 官臨財地(榮夫)」의 조건도 겹칩니다. 그 뜻과 성립 범위는 위의 해당 구절까지 함께 읽습니다.

### 가상 1 · 자미두수

바깥 활동과 인연의 강점과 제약 — 밖에서 만나는 도움

바깥 활동과 인연에서는 「밖에서 만나는 도움」에 「밖에서 재물을 버는 길」의 조건이 더해집니다. 일과 책임에도 「재물과 지위를 함께 얻는 자리」의 조건이 있습니다. 다만 같은 분야의 경계도 남습니다. 「경양 · 타라 · 화성 · 영성 · 지공 · 지겁이 더하면 밖에서 편치 않다.」 이 경계가 앞의 좋은 조건 때문에 없어지는 것은 아닙니다.

### 가상 2 · 정통사주

배움과 도움 — 강점과 걸림을 함께 읽는 구성

타고난 중심은 배움과 도움입니다. 이를 실제로 쓰는 구조는 다음과 같습니다. 돈과 배움의 충돌을 막아 줄 힘이 없습니다. 여기에 「化物連綿 — 平生福德」의 조건도 겹칩니다. 이 대목을 좋게 읽어도 앞서 본 걸림까지 해결된 것은 아닙니다.

### 가상 2 · 자미두수

마음과 삶의 즐거움의 강점과 제약 — 평온하게 살아가는 배치

마음과 삶의 즐거움에서는 「평온하게 살아가는 배치」에 「기쁨과 복을 함께 본 자리」의 조건이 더해집니다. 일과 책임에도 「처음에는 작게, 나중에는 크게」의 조건이 있습니다. 다만 같은 분야의 경계도 남습니다. 「경양 · 타라 · 화성 · 영성 · 지공 · 지겁이 더해지면 걱정과 기쁨이 모두 있고 편안하지 않다.」 「태음이 힘을 잃은 자리(함지)에 있으면 반드시 흉하다.」 이 경계가 앞의 좋은 조건 때문에 없어지는 것은 아닙니다.

### 가상 3 · 정통사주

사람과 기회로 넓히는 돈벌이 — 강점과 걸림을 함께 읽는 구성

타고난 중심은 사람과 기회로 넓히는 돈벌이입니다. 이를 실제로 쓰는 구조는 다음과 같습니다. 재물을 해치는 경쟁을 막아 줄 힘이 없습니다. 여기에 「財會煞」의 조건도 겹칩니다. 이 대목을 좋게 읽어도 앞서 본 걸림까지 해결된 것은 아닙니다.

### 가상 3 · 자미두수

마음과 삶의 즐거움의 강점과 제약 — 도움을 주는 사람이 곁에 있음

마음과 삶의 즐거움에서는 「도움을 주는 사람이 곁에 있음」에 「뒤로 갈수록 편안한 삶」의 조건이 더해집니다. 다만 같은 분야의 경계도 남습니다. 「거문이 복덕궁에 있으면 몸이 고생하고 편안하지 않다.」 「경양 · 타라 · 화성 · 영성 · 지공 · 지겁이 더하면 평생 걱정이 많다.」 이 경계가 앞의 좋은 조건 때문에 없어지는 것은 아닙니다.

### 가상 4 · 정통사주

꾸준히 만드는 힘 — 강점과 걸림을 함께 읽는 구성

타고난 중심은 꾸준히 만드는 힘입니다. 이를 실제로 쓰는 구조는 다음과 같습니다. 생각이 실행을 막는 충돌을 풀 힘이 없습니다. 여기에 「사절위복」의 조건도 겹칩니다. 이 대목을 좋게 읽어도 앞서 본 걸림까지 해결된 것은 아닙니다.

### 가상 4 · 자미두수

타고난 바탕의 강점과 제약 — 함께 누리는 넉넉함

타고난 바탕에서는 「함께 누리는 넉넉함」의 조건이 확인됐습니다. 돈과 재물에도 「재물이 넉넉한 자리」의 조건이 있습니다. 다만 같은 분야의 경계도 남습니다. 「명궁에 해로운 별(악살)이 있고 별이 힘을 잃은 자리(함약)에 있으면, 10년 운(대한)과 한 해 운(소운)이 시작되기 전까지 탈이 많다. 키우기 어렵다. 부모를 잃거나 부모가 다치는 일을 겪는다(부모를 형극한다).」 「태어난 시각과 명궁의 음양이 어긋나면 뜻한 바를 이루는 일이 적다.」 이 경계가 앞의 좋은 조건 때문에 없어지는 것은 아닙니다.

## 문장 사전 19칸: 전 → 후

열쇠는 그대로 두고 값만 바꿨습니다. 잘됨·오래가지 못함·해침 등의 방향과 세기는 유지했습니다. 까닭은 전문용어를 사회적 기능이나 별이 힘을 발휘하는 자리로 풀어 쓰기입니다.

| 열쇠 | 전 | 후 |
|---|---|---|
| 글과 행정을 맡는 관리(문관)와 군사 일을 맡는 관리(무관) 모두에 필요한 능력이 있어요. | 글과 행정을 맡는 문관과 군사를 맡는 무관, 두 자리에 모두 필요한 재능이 있어요. | 사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽에 필요한 재능이 있어요. |
| 군인처럼 무기와 규율을 다루는 자리(무관)로 힘 있는 자리에 오르지만 오래가지 않아요. | 군사를 맡는 무관으로 높은 지위와 권한을 얻어요. 다만 오래가지는 않아요. | 몸을 쓰거나 규율이 엄한 조직에서 일하며 높은 지위와 권한을 얻어요. 다만 오래가지는 않아요. |
| 글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 이름이 나요. | 글과 행정을 맡는 문관이나 군사를 맡는 무관, 어느 쪽으로도 이름을 알려요. | 사무를 보는 일이나 몸을 쓰거나 규율이 엄한 조직의 일, 어느 쪽으로도 이름을 알려요. |
| 군인처럼 무기와 규율을 다루는 자리(무관)로는 힘 있는 자리에 오르고, 글과 행정으로 일하는 자리(문관)로는 오래가지 않아요. | 군사를 맡는 무관으로는 높은 지위와 권한을 얻어요. 글과 행정으로 일하는 문관으로는 오래가지 않아요. | 몸을 쓰거나 규율이 엄한 조직의 일에서는 높은 지위와 권한을 얻어요. 사무를 보는 일에서는 오래가지 못해요. |
| 아랫사람과 동료가 힘이 되지 못하고, 있어도 오래가지 않아요. 가장 밝은 자리(입묘)라면 늦은 나이에야 모아요. | 아랫사람과 동료가 당신을 배신하고 원망해요. 도움이 되지 못하고, 곁에 있어도 오래 머물지 않아요. 별이 가장 빛나는 자리인 입묘라면, 늦은 나이가 되어서야 아랫사람을 구해요. | 아랫사람과 동료가 당신을 배신하고 원망해요. 도움이 되지 못하고, 곁에 있어도 오래 머물지 않아요. 별이 힘을 가장 잘 발휘하는 자리라면, 늦은 나이가 되어서야 아랫사람을 구해요. |
| 글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 다 좋아요. 돈과 높은 자리(벼슬)도 다 좋아요. 자손도 높은 자리(벼슬)에 올라요. | 글과 행정을 맡는 문관으로도, 군사를 맡는 무관으로도 잘돼요. 재물과 벼슬을 함께 얻고, 자손도 벼슬에 올라요. | 사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽에서 잘돼요. 재물과 높은 지위를 함께 얻고, 자손도 높은 지위에 올라요. |
| 글과 행정을 맡는 관리(문관)와 군사 일을 맡는 관리(무관) 모두에 필요한 능력이 있어요. 군인처럼 무기와 규율을 다루는 일(무관)에서 가장 크게 일어서고, 글과 행정으로 하는 일(문관)은 이롭지 않아요. | 글과 행정을 맡는 문관과 군사를 맡는 무관, 양쪽에 재능이 있어요. 다만 무관으로 가장 크게 일어서고, 문관으로 일하는 것은 이롭지 않아요. | 사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽에 재능이 있어요. 다만 크게 일어서는 쪽은 몸을 쓰거나 규율이 엄한 조직의 일이에요. 사무를 보는 일은 이롭지 않아요. |
| 돈이 넉넉한 자리예요. 별이 밝은 자리면 돈과 높은 자리인 벼슬이 으뜸가요. | 재물이 넉넉해요. 별이 힘을 잘 쓰는 자리인 입묘에 있으면, 재물과 지위가 아주 높아요. | 재물이 넉넉해요. 별이 힘을 가장 잘 발휘하는 자리에 있으면, 재물과 지위가 아주 높아요. |
| 군인처럼 무기와 규율을 다루는 자리(무관)로 큰 권한을 쥐어요. | 군사 일을 맡는 관리인 무관이 되어 큰 권한을 쥐어요. | 몸을 쓰거나 규율이 엄한 조직에서 일하며 큰 권한을 쥐어요. |
| 군인처럼 무기와 규율을 다루는 자리(무관)로 높이 올라요. | 군사 일을 맡는 관리인 무관이 되어 높은 지위에 올라요. | 몸을 쓰거나 규율이 엄한 조직에서 일하며 높은 지위에 올라요. |
| 바르게 처신해요. 글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 다 좋아요. | 바르게 처신해요. 글과 행정을 맡는 문관도, 군사 일을 맡는 무관도 모두 좋아요. | 바르게 처신해요. 사무를 보는 일도, 몸을 쓰거나 규율이 엄한 조직의 일도 모두 좋아요. |
| 글과 행정으로 일하는 자리(문관)든 군인처럼 무기와 규율을 다루는 자리(무관)든 다 맞아요. | 글과 행정을 맡는 관리인 문관도, 군사를 맡는 관리인 무관도 잘 맞아요. | 사무를 보는 일도, 몸을 쓰거나 규율이 엄한 조직의 일도 잘 맞아요. |
| 군인처럼 무기와 규율을 다루는 자리(무관)로 우뚝 서고, 높은 자리(벼슬)가 없는 보통 사람도 복이 피어요. | 군사를 맡는 관리인 무관으로 두각을 드러내요. 벼슬이 없는 보통 사람도 복을 누려요. | 몸을 쓰거나 규율이 엄한 조직의 일에서 두각을 드러내요. 관직이 없는 보통 사람도 복을 누려요. |
| 글과 행정으로 일하는 자리(문관)든 군인처럼 무기와 규율을 다루는 자리(무관)든 힘 있는 자리에 오르고, 그 힘이 작지 않아요. | 글과 행정을 맡는 문관이든, 군사를 맡는 무관이든 높은 지위와 큰 권한을 얻어요. | 사무를 보는 일이나 몸을 쓰거나 규율이 엄한 조직의 일을 맡아 높은 지위와 큰 권한을 얻어요. |
| 군인처럼 무기와 규율을 다루는 자리(무관)로 우뚝 서고 그 힘이 작지 않지만, 글과 행정으로 일하는 자리(문관)는 맞지 않아요. | 군사를 맡는 관리인 무관으로 두각을 드러내고, 높은 지위와 큰 권한을 얻어요. 글과 행정을 맡는 문관은 맞지 않아요. | 몸을 쓰거나 규율이 엄한 조직의 일에서 두각을 드러내고, 높은 지위와 큰 권한을 얻어요. 사무를 보는 일은 맞지 않아요. |
| 글과 행정으로 일하는 자리(문관)로는 오래가지 않고, 실무를 맡는 하급 자리가 가장 좋아요. | 글과 행정을 맡는 문관으로는 오래가지 못해요. 실무를 맡는 하급 관리가 가장 좋아요. | 사무를 보는 일에서는 오래가지 못해요. 실무를 맡는 하급 자리가 가장 좋아요. |
| 형제를 잃거나 형제에게 해가 가고, 밝은 자리면 형제가 하나예요. | 형제를 잃거나 서로 해를 끼쳐요. 별이 밝은 자리인 입묘에 있으면 형제가 한 명이에요. | 형제를 잃거나 서로 해를 끼쳐요. 별이 힘을 가장 잘 발휘하는 자리에 있으면 형제가 한 명이에요. |
| 군인처럼 무기와 규율을 다루는 자리(무관)가 맞고, 글과 행정으로 일하는 자리(문관)와는 맞지 않아요. | 군사를 맡는 관리인 무관이 맞아요. 글과 행정을 맡는 문관은 맞지 않아요. | 몸을 쓰거나 규율이 엄한 조직의 일이 맞아요. 사무를 보는 일은 맞지 않아요. |
| 군인처럼 무기와 규율을 다루는 자리(무관)가 가장 이로워요. | 군사를 맡는 관리인 무관이 가장 유리해요. | 몸을 쓰거나 규율이 엄한 조직의 일이 가장 유리해요. |

## 확인 결과와 한계

- 수정한 JavaScript 네 파일: node --check 통과. 실제 렌더러를 VM에서 로딩하고 가상 네 명 × 두 화면을 생성했습니다.
- 네 명 × 두 화면: HTML 태그·속성 전체, blockquote 원문, 표시 비율 목록이 변경 전과 동일. 정통사주 필터 key·count·percent·quote·evidence 동일.
- 위 여덟 화면의 펼치기 전 제목·문단: 25자 초과 완전 중복 0. 자미두수의 묘왕·문관·무관·입묘 0. ‘당신은 귀한 사람입니다.’ 단독 결론 0. 짧은 공통 머리·접힘 안내까지 모두 다른 문장이라는 뜻은 아닙니다.
- python tools_check.py: 막힘 0, 확인 69(화면 금지말 47).
- hwamyeon-scan --n 40: 정통사주 HARD 0, 내 명반 HARD 0. 전체 HARD 24이며 **전체 통과는 아닙니다**.
- 변경 전 f5537254의 app 파일로 같은 검사 실행: 동일한 정통타로 HARD 24. 오류 항목 전체를 전후 대조하여 동일함을 확인했습니다. ‘타로 점 하나여야 하는데 3개’, ‘세 점 셈·24달 표가 보여요’ 각 12건입니다. 기존 ‘URL is not defined’ 로딩 경고도 양쪽에 같습니다. 이 PR에서 타로 뼈대나 검사기를 수정하지 않았습니다.
- 마지막 종합의 자미두수 경계는 주된 분야의 앞 두 항목을 요약에 싣고, 나머지는 기존 본문에 그대로 둡니다. 서버 조건·필터·순서는 바꾸지 않습니다.
- 화면 글 조립은 허용 파일 myeongban-filter.js에서 기존 editorial 렌더 결과의 텍스트만 바꿉니다. 태그 구조에 의존하므로 합칠 때 최신 렌더러에서도 같은지 확인해야 합니다.
- 이 기록은 문장·출력 대조입니다. 새 PC·모바일 브라우저 시각 검수나 라이브 배포는 하지 않았습니다.

## 변경 줄 전체와 까닭

아래 diff의 삭제 줄이 ‘전’, 추가 줄이 ‘후’입니다. 문장뿐 아니라 기존 값으로 문장을 조립하는 부분도 함께 공개합니다.

### jeongtong-distinct-reading.js

까닭: 첫 결론의 이유와 칭찬·걸림 관계를 구분하고 끝에서 기존 기전을 종합합니다.

```diff
diff --git a/app/jeongtong-distinct-reading.js b/app/jeongtong-distinct-reading.js
index a1590532..abe90e2e 100644
--- a/app/jeongtong-distinct-reading.js
+++ b/app/jeongtong-distinct-reading.js
@@ -129,5 +129,5 @@
     const identity={...m.identity};
     if(portrait){identity.title=portrait[0];identity.line=explanation ? explanation[1] : typeLines[type] || identity.line;identity.name=portrait[2];identity.hanja=String(signature.lead.classical||'').split(/[（(]/)[0];identity.basis='《'+signature.lead.book+'》의 '+signature.lead.name+' 대목을 풀어 책사가 붙인 이름입니다. '+portrait[1];}
-    else if(explanation){identity.title=explanation[1];identity.line=signature ? signature.lead.title : typeLines[type] || identity.line;}
+    else if(explanation){identity.title=explanation[1];identity.line=typeLines[type] || identity.line;}
     const condition=explanation ? {title:explanation[3],text:explanation[2],basis:reasons.join(' / ')} : {title:state?.값==='깨졌다'?'강점을 해치는 조건이 함께 있습니다.':'타고난 성향과 성립 조건을 함께 봅니다.',text:typeLines[type]||'판정에 나온 조건을 아래에서 살펴보세요.',basis:reasons.join(' / ')};
     let caution=state?.값==='띠었다' ? {title:'강점과 함께 남은 흠이 있습니다.',text:explanation?.[2]||reasons.join(' / '),basis:reasons.join(' / '),source:'자평진전'} : null;
@@ -137,6 +137,23 @@
     }
     if(state?.값==='깨졌다') caution={title:'타고난 강점이 그대로 힘을 쓰지는 못합니다.',text:explanation ? explanation[2] : '격을 이루는 조건이 깨진 것으로 판정됐습니다.',basis:reasons.join(' / '),source:'자평진전'};
-    const conclusion=explanation ? explanation[1] : condition.title;
-    const conclusionDetail=[condition.text,...matched.slice(1).map(row=>row[2])].filter((x,i,a)=>x&&a.indexOf(x)===i).join(' ');
+    // COPY-0030: 같은 판정 재료를 첫 결론·이유·종합에서 서로 다른 역할로 읽는다.
+    const focusWords={정관:'맡은 책임',편관:'거센 요구에 맞서는 힘',정재:'꾸준한 수입과 살림',편재:'사람과 기회로 넓히는 돈벌이',정인:'배움과 도움',편인:'깊이 파고드는 공부',식신:'꾸준히 만드는 힘',상관:'표현과 재주',건록:'스스로 해내는 힘',양인:'경쟁에 맞서는 힘'};
+    const focus=focusWords[type]||'타고난 성향';
+    const oldPraise=portrait?.[1]||signature?.lead.title;
+    if(explanation){
+      identity.line='이유는 사주에 있습니다. '+explanation[2];
+      if(portrait) identity.line=(state?.값==='깨졌다'||state?.값==='띠었다'?'이 이름만으로 강점이 온전히 작동한다고 보지는 않습니다. ':'')+identity.line;
+    }else identity.line=typeLines[type]||'아래에서 해당하는 조건과 그 이유를 함께 읽습니다.';
+    // 조건별 칭찬은 해당 필터에서 읽고, 여기서는 격의 작동 조건과 구분한다.
+    condition.text=oldPraise?'옛 책이 좋게 본 개별 조건과, '+focus+'의 작동 조건을 함께 봅니다. 좋은 대목 하나가 다른 걸림을 없애지는 않습니다.':'이 사주의 중심은 '+focus+'입니다. 아래의 구성 풀이에서 그 힘을 받치거나 막는 글자를 확인할 수 있습니다.';
+    if(caution) caution={...caution,text:state?.값==='깨졌다'?'좋게 본 다른 조건이 있어도, 이 사주의 격을 이루는 조건은 깨진 것으로 판정됐습니다. 강점을 쓰는 바탕에 걸림이 남아 있습니다.':state?.값==='띠었다'?'격에 남은 흠을 함께 읽어야 합니다. 좋은 조건의 수가 많아도 이 흠이 없어지는 것은 아닙니다.':caution.text};
+    const conclusion=focus+' — '+(caution?'강점과 걸림을 함께 읽는 구성':'강점이 힘을 얻는 구성');
+    const conclusionDetail=[
+      '타고난 중심은 '+focus+'입니다.',
+      explanation?'이를 실제로 쓰는 구조는 다음과 같습니다. '+explanation[3]:condition.title,
+      signature?'여기에 「'+signature.lead.name+'」의 조건도 겹칩니다. '+(state?.값==='깨졌다'||state?.값==='띠었다'?'이 대목을 좋게 읽어도 앞서 본 걸림까지 해결된 것은 아닙니다.':'그 뜻과 성립 범위는 위의 해당 구절까지 함께 읽습니다.'):'',
+      ...matched.slice(1).map(row=>row[2]),
+      season?.blocked?'계절에 필요한 기운과 함께 잡힌 경계 조건도 이 구조의 제약으로 남습니다.':''
+    ].filter(Boolean).join(' ');
     return {...m,identity,distinct:{signature:signature ? {name:portrait?.[2]||signature.lead.name,line:portrait?.[1]||signature.lead.title,book:signature.lead.book,key:signature.lead.key} : null,condition,caution,unmappedReasons:reasons.filter(reason=>!reason.includes('깨는 조항이 없다')&&!exactMechanisms.some(row=>row[0]===reason)&&!mechanisms.some(row=>row[0].test(reason)))},filterStory:{...m.filterStory,filters,readingGroups:groups,conclusion,conclusionDetail}};
   }
```

### jeongtong-story.js

까닭: 본문 제목 중복, 한자 노출 위치, 비율 설명, 공통 맺음을 수정합니다.

```diff
diff --git a/app/jeongtong-story.js b/app/jeongtong-story.js
index e2015baa..e10c5a06 100644
--- a/app/jeongtong-story.js
+++ b/app/jeongtong-story.js
@@ -11,9 +11,9 @@
     const story=m.filterStory, groups=story.readingGroups;
     const item=f=>`<article class="group-source"><h4>${esc(f.name)}${f.classical&&f.classical!==f.name?' · '+esc(f.classical):''}</h4><p>${esc(f.title)}</p><p>${esc(f.line)}</p>${f.subline?'<p>'+esc(f.subline)+'</p>':''}${f.detail?'<p>'+esc(f.detail)+'</p>':''}<p><b>내 사주에서 확인한 조건</b><br>${esc(f.evidence)}</p>${f.readingScope?'<p>'+esc(f.readingScope)+'</p>':''}<details><summary>${esc(f.book)} · 원문과 적용 범위</summary>${f.quote?'<blockquote lang="zh">'+esc(f.quote)+'</blockquote>':''}<p>${esc(f.source)}</p><p>${esc(f.scope)}</p></details></article>`;
-    return `<section class="chapter filter-chapter" id="jtp-my-shape"><div class="filter-section-heading"><div><p class="chapter-label">一 · 당신을 구체적으로 읽는 조건</p><h2>무엇으로 힘을 쓰고,<br>어디에서 남다른가</h2></div><p class="filter-column-label">앞선 조건까지 함께 갖춘<br>비교 사주의 비율</p></div><ol class="classic-filters">${groups.map((g,i)=>`<li class="classic-filter" style="--depth:${Math.min(i,5)}"><span class="filter-number">${String(i+1).padStart(2,'0')}</span><article class="filter-paper"><div class="filter-reading"><div><p class="filter-name">${esc(g.topic)} · ${g.members.length}개 조건</p><h3>${esc(g.lead.title)}</h3>${['structure','support','season'].includes(g.id)?'<p class="filter-line">'+esc(g.lead.line)+'</p>':'<p class="filter-line">'+esc(g.lead.book)+' · '+esc(g.lead.name)+'</p>'}${g.lead.subline?'<p class="filter-subline">'+esc(g.lead.subline)+'</p>':''}</div><div class="filter-rate"><span>${i===0?'이 조건들을 갖춘':'앞선 조건까지 누적'}</span><strong class="${g.percent==null?'unmeasured':''}">${filterRate(g.percent)}</strong></div></div><details class="filter-source"><summary>내 사주에 해당하는 ${g.members.length}개 조건과 근거</summary>${g.members.map(item).join('')}</details></article></li>`).join('')}</ol><div class="filter-conclusion"><p class="conclusion-kicker">${groups.length}갈래의 풀이 · ${story.filters.length}개 조건</p><h2>${esc(story.conclusion)}</h2><p>${esc(story.conclusionDetail)}</p><div class="conclusion-ratio"><strong>${filterRate(story.percent)}</strong><span>위 조건을 모두 갖춘 비교 사주</span></div><a href="#jtp-rarity-evidence" data-rarity-source>무엇과 비교한 비율인가요?</a></div></section>`;
+    return `<section class="chapter filter-chapter" id="jtp-my-shape"><div class="filter-section-heading"><div><p class="chapter-label">一 · 당신을 구체적으로 읽는 조건</p><h2>무엇으로 힘을 쓰고,<br>어디에서 남다른가</h2></div><p class="filter-column-label">앞선 조건까지 함께 갖춘<br>비교 사주의 비율</p></div><ol class="classic-filters">${groups.map((g,i)=>`<li class="classic-filter" style="--depth:${Math.min(i,5)}"><span class="filter-number">${String(i+1).padStart(2,'0')}</span><article class="filter-paper"><div class="filter-reading"><div><p class="filter-name">${esc(g.topic)} · ${g.members.length}개 조건</p><h3>${esc(g.lead.title===m.identity.title ? g.topic+'에서 확인한 구성' : g.lead.title)}</h3>${['structure','support','season'].includes(g.id)?'<p class="filter-line">'+esc(g.lead.line)+'</p>':'<p class="filter-line">'+esc(g.lead.book)+' · '+esc(g.lead.name)+'</p>'}${g.lead.subline?'<p class="filter-subline">'+esc(g.lead.subline)+'</p>':''}</div><div class="filter-rate"><span>${i===0?'이 조건들을 갖춘 비교 명식':'여기까지의 조건을 모두 갖춘 비교 명식'}</span><strong class="${g.percent==null?'unmeasured':''}">${filterRate(g.percent)}</strong></div></div><details class="filter-source"><summary>내 사주에 해당하는 ${g.members.length}개 조건과 근거</summary>${g.members.map(item).join('')}</details></article></li>`).join('')}</ol><div class="filter-conclusion"><p class="conclusion-kicker">${groups.length}갈래의 풀이 · ${story.filters.length}개 조건</p><h2>${esc(story.conclusion)}</h2><p>${esc(story.conclusionDetail)}</p><div class="conclusion-ratio"><strong>${filterRate(story.percent)}</strong><span>여기까지의 조건을 모두 갖춘 비교 명식</span></div><a href="#jtp-rarity-evidence" data-rarity-source>무엇과 비교한 비율인가요?</a></div></section>`;
   }
   function portraitDetail(m) {
     const p=m.distinct;if(!p)return '';
-    return `<section class="portrait-detail" aria-label="내 강점과 조건">${p.signature?`<div><p class="portrait-label">옛 책이 붙인 이름 · ${esc(p.signature.name)}</p><p class="portrait-quote">${esc(p.signature.line)}</p><small>《${esc(p.signature.book)}》의 대목을 풀어 읽었습니다.</small></div>`:''}<div><p class="portrait-label">이 강점을 받치는 조건</p><h2>${esc(p.condition.title)}</h2><p>${esc(p.condition.text)}</p><details><summary>이렇게 읽은 내 사주 근거</summary><p>${esc(p.condition.basis||m.identity.basis)}</p></details></div>${p.caution?`<div class="portrait-caution"><p class="portrait-label">함께 읽어야 할 걸림</p><h2>${esc(p.caution.title)}</h2><p>${esc(p.caution.text)}</p><details><summary>${esc(p.caution.source||'판정')}의 경계와 적용 범위</summary><p>${esc(p.caution.basis)}</p>${p.caution.classical?'<p>고전의 경계 조건입니다. 실제 수명이나 사건이 일어나는 시점을 계산한 결과는 아닙니다.</p>':''}</details></div>`:''}</section>`;
+    return `<section class="portrait-detail" aria-label="내 강점과 조건">${p.signature?`<div><p class="portrait-label">옛 책이 붙인 이름 · ${esc(p.signature.name)}</p><p class="portrait-quote">옛 책의 칭찬은 「${esc(p.signature.name)}」에 해당하는 대목입니다. 아래의 조건별 풀이에서 그 뜻과 적용 범위를 읽습니다.</p><small>《${esc(p.signature.book)}》의 대목을 풀어 읽었습니다.</small></div>`:''}<div><p class="portrait-label">이 사주의 강점이 작동하는 조건</p><h2>${esc(p.condition.title)}</h2><p>${esc(p.condition.text)}</p><details><summary>이렇게 읽은 내 사주 근거</summary><p>${esc(p.condition.basis||m.identity.basis)}</p></details></div>${p.caution?`<div class="portrait-caution"><p class="portrait-label">함께 읽어야 할 걸림</p><h2>${esc(p.caution.title)}</h2><p>${esc(p.caution.text)}</p><details><summary>${esc(p.caution.source||'판정')}의 경계와 적용 범위</summary><p>${esc(p.caution.basis)}</p>${p.caution.classical?'<p>고전의 경계 조건입니다. 실제 수명이나 사건이 일어나는 시점을 계산한 결과는 아닙니다.</p>':''}</details></div>`:''}</section>`;
   }
   function filterStack(m) {
@@ -22,5 +22,5 @@
     if (story.readingGroups?.length) return groupedFilters(m);
     const rows = story.filters;
-    const card = (f,i) => `<li class="classic-filter" style="--depth:${Math.min(i,5)}"><span class="filter-number">${String(i+1).padStart(2,'0')}</span><article class="filter-paper"><div class="filter-reading"><div><p class="filter-name">${esc(f.name)}${f.classical&&f.classical!==f.name?' · <span lang="zh">'+esc(f.classical)+'</span>':''}</p><h3>${esc(f.title)}</h3>${f.subline?'<p class="filter-subline">'+esc(f.subline)+'</p>':''}</div><div class="filter-rate"><span>${i===0?'첫 조건':'여기까지 누적'}</span><strong class="${f.percent==null?'unmeasured':''}">${filterRate(f.percent)}</strong></div></div><details class="filter-source"><summary>왜 내 조건인가요?</summary><p>${esc(f.line)}</p>${f.detail?'<p>'+esc(f.detail)+'</p>':''}<p><b>내 사주에서 확인한 조건</b><br>${esc(f.evidence)}</p>${f.readingScope?'<p class="source-scope">'+esc(f.readingScope)+'</p>':''}<details><summary>${esc(f.book)} · 고전 원문과 출처</summary>${f.quote?'<blockquote lang="zh">'+esc(f.quote)+'</blockquote>':''}<p>${esc(f.source)}</p></details><p class="source-scope">${esc(f.scope)}</p></details></article></li>`;
+    const card = (f,i) => `<li class="classic-filter" style="--depth:${Math.min(i,5)}"><span class="filter-number">${String(i+1).padStart(2,'0')}</span><article class="filter-paper"><div class="filter-reading"><div><p class="filter-name">${esc(f.name)}${f.classical&&f.classical!==f.name?' · <span lang="zh">'+esc(f.classical)+'</span>':''}</p><h3>${esc(f.title)}</h3>${f.subline?'<p class="filter-subline">'+esc(f.subline)+'</p>':''}</div><div class="filter-rate"><span>${i===0?'이 조건을 갖춘 비교 명식':'여기까지의 조건을 모두 갖춘 비교 명식'}</span><strong class="${f.percent==null?'unmeasured':''}">${filterRate(f.percent)}</strong></div></div><details class="filter-source"><summary>왜 내 조건인가요?</summary><p>${esc(f.line)}</p>${f.detail?'<p>'+esc(f.detail)+'</p>':''}<p><b>내 사주에서 확인한 조건</b><br>${esc(f.evidence)}</p>${f.readingScope?'<p class="source-scope">'+esc(f.readingScope)+'</p>':''}<details><summary>${esc(f.book)} · 고전 원문과 출처</summary>${f.quote?'<blockquote lang="zh">'+esc(f.quote)+'</blockquote>':''}<p>${esc(f.source)}</p></details><p class="source-scope">${esc(f.scope)}</p></details></article></li>`;
     return `<section class="chapter filter-chapter" id="jtp-my-shape" aria-labelledby="jtp-filter-title"><div class="filter-section-heading"><div><p class="chapter-label">一 · 내 사주에 해당하는 조건</p><h2 id="jtp-filter-title">좋은 조건이 하나씩 겹칩니다.</h2></div><p class="filter-column-label">여기까지 모두 갖춘<br>비교 사주의 비율</p></div><ol class="classic-filters">${rows.slice(0,5).map(card).join('')}</ol>${rows.length>5?`<details class="filter-rest"><summary>나머지 ${rows.length-5}가지 조건도 읽기</summary><ol class="classic-filters" start="6">${rows.slice(5).map((f,i)=>card(f,i+5)).join('')}</ol></details>`:''}<div class="filter-conclusion"><p class="conclusion-kicker">전체 ${rows.length}가지 좋은 조건이 겹쳤습니다.</p><h2>${esc(story.conclusion)}</h2><div class="conclusion-ratio"><strong>${filterRate(story.percent)}</strong><span>전체 ${rows.length}가지 조건을 모두 갖춘 비교 사주</span></div><a href="#jtp-rarity-evidence" data-rarity-source>무엇과 비교한 비율인가요?</a></div></section>`;
   }
@@ -50,12 +50,12 @@
     host.innerHTML = `
       <div class="chapter-nav"><nav class="links" aria-label="정통사주 목차"><a href="#jtp-my-shape">좋은 조건</a><a href="#jtp-my-condition">나를 돕는 조건</a><a href="#jtp-my-time">앞으로의 흐름</a></nav><p class="birth">${esc(birth.year + '.' + birth.month + '.' + birth.day)}<br>${esc(String(birth.hour).padStart(2, '0') + ':' + String(birth.minute || 0).padStart(2, '0') + ' · ' + place)}</p></div>
-      <section class="hero filter-hero reader-hero" aria-labelledby="jtp-my-title"><div><p class="eyebrow">옛 책으로 읽는 당신</p><h1 id="jtp-my-title">${esc(id.title)}</h1><p class="hero-line">${esc(id.line)}</p><div class="name-origin">${esc(id.name)}<span lang="zh">${esc(id.hanja)}</span></div><a class="reader-go" href="#jtp-my-shape">${m.filterStory?.readingGroups?.length ? '나를 설명하는 '+m.filterStory.readingGroups.length+'가지 이야기' : '나에게 해당하는 '+(m.filterStory?.filters?.length||0)+'가지 조건'} <span>↓</span></a></div></section>
+      <section class="hero filter-hero reader-hero" aria-labelledby="jtp-my-title"><div><p class="eyebrow">옛 책으로 읽는 당신</p><h1 id="jtp-my-title">${esc(id.title)}</h1><p class="hero-line">${esc(id.line)}</p><div class="name-origin">옛 책의 이름 · ${esc(id.name)}<span lang="zh">${esc('')}</span></div><a class="reader-go" href="#jtp-my-shape">${m.filterStory?.readingGroups?.length ? '나를 설명하는 '+m.filterStory.readingGroups.length+'가지 이야기' : '나에게 해당하는 '+(m.filterStory?.filters?.length||0)+'가지 조건'} <span>↓</span></a></div></section>
       ${portraitDetail(m)}
       ${filterStack(m)}
-      <section class="chapter" id="jtp-my-potential" aria-labelledby="jtp-name-heading"><p class="chapter-label">二 · 타고난 사주와 앞으로의 조건</p><h2 id="jtp-name-heading">태어난 사주에 있는 것과,<br><em>앞으로 살펴볼 조건.</em></h2><article class="name-panel"><div class="panel-top"><span class="book-label">${esc(m.wood ? '삼명통회 · 합화성국' : '타고난 바탕과 운')}</span><span class="state-pill">${esc(l.tag)}</span></div><h3 class="classical-name">${esc(l.title)}</h3><p class="classical-hanja" lang="zh">${esc(l.hanja)}</p><p class="name-sentence">${esc(l.line)}</p><details><summary>쉬운 풀이와 내 조건, 원문 보기</summary><p>${esc(id.basis)} 위의 짧은 이름은 책사가 뜻을 풀어 붙인 표현입니다.</p>${observed}<ul>${l.checks.map(c => `<li><b>${esc(c.value)}</b> — ${esc(c.detail)}</li>`).join('')}</ul>${l.note ? `<p>${esc(l.note)}</p>` : ''}<p>${esc(l.limits)}</p>${quote}${l.url ? `<p><a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.source)} 원문 ↗</a>${l.source2 ? ` · <a href="${esc(l.source2)}" target="_blank" rel="noreferrer">합화성국 원문 ↗</a>` : ''}</p>` : `<p>${esc(l.source)}</p>`}</details></article><div class="check-row">${checks}</div></section>
+      <section class="chapter" id="jtp-my-potential" aria-labelledby="jtp-name-heading"><p class="chapter-label">二 · 타고난 사주와 앞으로의 조건</p><h2 id="jtp-name-heading">태어난 사주에 있는 것과,<br><em>앞으로 살펴볼 조건.</em></h2><article class="name-panel"><div class="panel-top"><span class="book-label">${esc(m.wood ? '삼명통회 · 합화성국' : '타고난 바탕과 운')}</span><span class="state-pill">${esc(l.tag)}</span></div><h3 class="classical-name">${esc(l.title)}</h3><p class="classical-hanja" lang="zh">${esc(l.hanja)}</p><p class="name-sentence">${esc(l.line)}</p><details><summary>쉬운 풀이와 내 조건, 원문 보기</summary><p>${esc(id.hanja)} · ${esc(id.basis)} 위의 짧은 이름은 책사가 뜻을 풀어 붙인 표현입니다.</p>${observed}<ul>${l.checks.map(c => `<li><b>${esc(c.value)}</b> — ${esc(c.detail)}</li>`).join('')}</ul>${l.note ? `<p>${esc(l.note)}</p>` : ''}<p>${esc(l.limits)}</p>${quote}${l.url ? `<p><a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.source)} 원문 ↗</a>${l.source2 ? ` · <a href="${esc(l.source2)}" target="_blank" rel="noreferrer">합화성국 원문 ↗</a>` : ''}</p>` : `<p>${esc(l.source)}</p>`}</details></article><div class="check-row">${checks}</div></section>
       ${conditionSection}
       <section class="chapter" id="jtp-my-time" aria-labelledby="jtp-time-heading"><div class="time-heading"><div><p class="chapter-label">四 · 앞으로의 흐름</p><h2 id="jtp-time-heading">${experience ? '이 변화와 연결해 볼<br><em>해와 달, 날과 시간.</em>' : '살펴볼 글자가 들어오는<br><em>해와 달, 날과 시간.</em>'}</h2></div><p class="asof">${esc(m.asof)} 기준</p></div><div class="scale-tabs" role="tablist" aria-label="운을 살펴볼 기간"><button type="button" role="tab" id="jtp-tab-large" aria-controls="jtp-time-panel" aria-selected="false" tabindex="-1" data-scale="large">10년 운</button><button type="button" role="tab" id="jtp-tab-years" aria-controls="jtp-time-panel" aria-selected="false" tabindex="-1" data-scale="years">해마다</button><button type="button" role="tab" id="jtp-tab-months" aria-controls="jtp-time-panel" aria-selected="true" data-scale="months">달마다</button><button type="button" role="tab" id="jtp-tab-days" aria-controls="jtp-time-panel" aria-selected="false" tabindex="-1" data-scale="days">날마다</button><button type="button" role="tab" id="jtp-tab-hours" aria-controls="jtp-time-panel" aria-selected="false" tabindex="-1" data-scale="hours">시간마다</button></div><div id="jtp-time-panel" role="tabpanel" aria-labelledby="jtp-tab-months" tabindex="0"><p class="scope-line" id="jtp-scope-line"></p><div class="window-grid" id="jtp-windows"></div></div><p class="time-note" id="jtp-time-note"></p></section>
       <section class="chapter" id="jtp-my-evidence"><p class="chapter-label">五 · 더 깊이 읽기</p><h2>이름을 붙인 이유와,<br><em>계산한 근거를 살펴보세요.</em></h2><div class="evidence-list"><details class="evidence"><summary>내 사주 여덟 글자와 풀이 기준</summary><div class="evidence-inner"><p>${esc(id.basis)}</p><p>시 · 일 · 월 · 년<br><b lang="zh">${esc(r.명식)}</b></p><div class="axis-list">${m.axes.map(a => `<div><h3>${esc(axisTitles[a.id] || a.id)} · ${esc(stateText(a.값))}</h3><p>${esc(a.고전이름 || '')}<br>${esc(books[a.책] || a.책)}</p>${a.근거?.length ? `<p>${esc(a.근거.join(' / '))}</p>` : ''}</div>`).join('')}</div></div></details><details class="evidence"><summary>해·달·날·시간을 계산한 기준</summary><div class="evidence-inner"><p>${esc(m.dateNote)}</p><p>${esc(l.limits)}</p><p>날짜 목록의 두 글자는 그날 낮 12시 기준입니다. 태어난 곳에 따른 시각 보정과 밤의 날짜 교체 기준 때문에, 같은 양력 날짜여도 밤에는 다른 날짜의 두 글자로 계산될 수 있습니다.</p></div></details><details class="evidence" id="jtp-rarity-evidence"><summary>비율을 계산한 방법과 비교 자료</summary><div class="evidence-inner">${filterEvidence(m)}</div></details>${names ? `<details class="evidence"><summary>같은 사주에 해당하는 다른 고전 구절</summary><div class="evidence-inner">${names}</div></details>` : ''}</div></section>
-      <div class="closing"><span class="mark">策</span><p>당신에게는 이름이 있고,<br><em>그 이름을 살아갈 시간이 있습니다.</em></p><a href="today.html">오늘의 운세 — 오늘 달라지는 나는? →</a><br><a href="#jtp-top">내 좋은 조건으로 돌아가기 ↑</a></div>`;
+      <div class="closing"><span class="mark">策</span><p>타고난 구성과 걸림을 함께 읽었습니다.<br><em>앞으로의 흐름도 이 바탕에서 살펴보세요.</em></p><a href="today.html">오늘의 운세 — 오늘 달라지는 나는? →</a><br><a href="#jtp-top">내 좋은 조건으로 돌아가기 ↑</a></div>`;
     host.querySelector('[data-rarity-source]')?.addEventListener('click', e => {
       if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
```

### myeongban-filter.js

까닭: 기존 응답의 분야·조건·경계로 첫 설명과 끝 종합을 만들고, 근거 밖 전문용어를 쉽게 풉니다.

```diff
diff --git a/app/myeongban-filter.js b/app/myeongban-filter.js
index e539f874..04900c3b 100644
--- a/app/myeongban-filter.js
+++ b/app/myeongban-filter.js
@@ -11,7 +11,71 @@
     return '<div class="zf-source"><p>' + esc(R.sourceText ? R.sourceText(s.meaning) : s.meaning) + '</p><p class="zf-evidence"><b>내게 해당하는 조건</b><br>' + esc(condition || (R.sourceText ? R.sourceText(s.evidence) : s.evidence)) + '</p><details class="zf-original"><summary>고전 원문과 출처</summary><p class="zf-quote" lang="zh-Hant">' + esc(s.quote) + '</p><p class="zf-evidence">계산에서 확인한 조건: ' + esc(String(s.evidence == null ? '' : s.evidence).replace(/명궁\(명궁 /g, '명궁(')) + '</p><a href="' + url + '" target="_blank" rel="noopener noreferrer">자미두수전서 · ' + esc(s.source) + ' ↗</a></details></div>';
   }
+  // COPY-0030: 기존 렌더러의 글만 바꾼다. 판정·필터 순서·수치·태그·속성은 보존한다.
+  function everyday(value) {
+    return String(value || '').replace(/\n/g, ' ')
+      .replace(/문곡이 묘왕이면 문관과 무관 모두 맞다\./g, '사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽이 맞습니다. 문곡이 힘을 잘 발휘하는 자리에 있기 때문입니다.')
+      .replace(/문관과 무관의 길/g, '사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일')
+      .replace(/문관과 무관/g, '사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일')
+      .replace(/문관으로/g, '사무를 보는 일로').replace(/무관으로/g, '몸을 쓰거나 규율이 엄한 조직의 일로')
+      .replace(/문관/g, '사무를 보는 일').replace(/무관(?!하|한|해|심)/g, '몸을 쓰거나 규율이 엄한 조직의 일')
+      .replace(/묘왕이면/g, '힘을 잘 발휘하는 자리에 있으면').replace(/묘왕/g, '힘을 잘 발휘하는 자리')
+      .replace(/입묘하면/g, '힘을 가장 잘 발휘하는 자리에 있으면').replace(/입묘/g, '힘을 가장 잘 발휘하는 자리')
+      .replace(/벼슬에 따른 수입\(녹\)/g, '조직에서 받는 정해진 봉급').replace(/벼슬의 수입/g, '조직에서 받는 봉급')
+      .replace(/벼슬에서 얻는 수입/g, '조직에서 받는 봉급');
+  }
+  function editorialCopy(html, story) {
+    const groups = (story.editorial?.groups || []).filter(g => g.filters?.length);
+    const focus = groups.reduce((best, g) => !best || g.filters.length > best.filters.length ? g : best, null);
+    const domains = {命宮:'타고난 바탕',財帛:'돈과 재물',官祿:'일과 책임',遷移:'바깥 활동과 인연',福德:'마음과 삶의 즐거움'};
+    const domain = g => domains[g?.palace] || g?.filters?.[0]?.domain || '이 분야';
+    const clause = s => everyday(R.sourceText ? R.sourceText(s) : s);
+    const shown = s => esc(everyday(s));
+    if (focus) {
+      const lead = focus.filters[0], source = lead.sources?.[0];
+      const title = everyday(source?.portrait || lead.title);
+      // 큰 제목은 한 가지 특징, 바로 아래는 이미 확인된 배치의 이유.
+      html = html.replace(/(<section class="zd-hero">[\s\S]*?<h2>)[\s\S]*?(<\/h2>)/, (match, a, b) => a + shown(domain(focus)) + (match.includes('<br>') ? '<br>' : ' — ') + shown(title) + b);
+      const why = source?.evidence ? clause(window.ChaeksaZiweiCondition ? ChaeksaZiweiCondition(source.evidence) : source.evidence) : '';
+      html = html.replace(/(<p class="zd-personal">)[\s\S]*?(<\/p>)/, (_, a, b) => a + shown(why ? '이렇게 읽은 배치: '+why : '아래에서 내게 해당하는 조건과 그 이유를 읽습니다.') + b);
+      html = html.replace(/(<div class="zd-origin"><span>)[\s\S]*?(<\/span><p>)[\s\S]*?(<\/p>)/, (_, a, b, c) => a+'좋은 조건과 경계의 관계'+b+shown(focus.cautions?.length ? '이 분야에는 좋게 본 조건과 경계한 조건이 함께 있습니다. 각각 다른 배치에서 나온 뜻이므로 함께 읽습니다.' : '이 이름은 해당하는 고전 대목에서 읽었습니다. 성립 조건은 아래 근거에서 확인할 수 있습니다.')+c);
+      const titles = [...new Set(focus.filters.map(f => everyday(f.title)))];
+      const secondary = groups.find(g => g !== focus);
+      const warnings = (focus.cautions || []).map(c => clause(c.뜻)).filter(Boolean);
+      const summary = [
+        domain(focus)+'에서는 「'+titles[0]+'」'+(titles[1]?'에 「'+titles[1]+'」의 조건이 더해집니다.':'의 조건이 확인됐습니다.'),
+        secondary ? domain(secondary)+'에도 「'+everyday(secondary.filters[0].title)+'」의 조건이 있습니다.' : '',
+        warnings.length ? '다만 같은 분야의 경계도 남습니다. '+warnings.slice(0,2).map(t=>'「'+t+'」').join(' ')+' 이 경계가 앞의 좋은 조건 때문에 없어지는 것은 아닙니다.' : '이 좋은 조건의 뜻은 위에서 확인한 배치와 적용 범위 안에서 읽습니다.'
+      ].filter(Boolean).join(' ');
+      html = html.replace(/(<section class="zd-ending">[\s\S]*?<h3>)[\s\S]*?(<\/h3><p>)[\s\S]*?(<\/p>)/, (_, a, b, c) => a+shown(domain(focus)+'의 강점과 제약 — '+everyday(lead.title))+b+esc(summary)+c);
+    }
+    // 접힌 근거의 원문·별·조건은 그대로, 바깥의 한국어만 오늘말로.
+    let depth = 0;
+    html = html.split(/(<[^>]+>)/g).map(part => {
+      if (/^<details\b/i.test(part)) depth++;
+      if (/^<\/details/i.test(part)) { depth--; return part; }
+      return depth || part.startsWith('<') ? part : everyday(part);
+    }).join('');
+    html = html.replace(/(<div class="zd-step-rate"><span>)[^<]*(<\/span>)/g, '$1여기까지의 조건을 모두 갖춘 비교 명식$2');
+    html = html.replace(/(<div class="zd-rate"><span>)[^<]*(<\/span>)/g, '$1이 조건들을 모두 갖춘 비교 명식$2');
+    // 분야 제목은 전체 역할, 각 조건 제목은 그 사람에게 해당하는 구체적인 특징.
+    let groupIndex = 0;
+    html = html.replace(/(<section class="zd-group">[\s\S]*?<\/div><h3>)[\s\S]*?(<\/h3>)/g, (_, a, b) => {
+      const g = groups[groupIndex++];
+      if (!g) return _;
+      return a + shown(domain(g)+'을 읽는 '+g.filters.length+'가지 조건') + b;
+    });
+    let noteIndex = 0;
+    const warned = groups.filter(g => g.cautions?.length);
+    html = html.replace(/(<p class="zd-read-note">)좋은 구절과 경계 구절은 각각 다른 조건에서 나왔습니다\. 한쪽이 다른 쪽을 없앤다고 계산한 결과는 아닙니다\.(<\/p>)/g, (_, a, b) => {
+      const g = warned[noteIndex++];
+      return a + shown(domain(g)+'에 나온 좋은 조건과 경계는 함께 적용됩니다. 한쪽을 이유로 다른 쪽을 지우지 않습니다.') + b;
+    });
+
+    return html;
+  }
+
   function html(story) {
     if (!story || !Array.isArray(story.filters)) return '';
-    if (story.editorial && window.ChaeksaZiweiEditorial) return ChaeksaZiweiEditorial.html(story);
+    if (story.editorial && window.ChaeksaZiweiEditorial) return editorialCopy(ChaeksaZiweiEditorial.html(story), story);
     story = window.ChaeksaZiweiEditorial?.present(story) || story;
     var filters = story.filters, stars = (story.mainStars || []).join(' · ');
@@ -28,10 +92,10 @@
         h += '<li class="zf-step"><div class="zf-step-top"><span class="zf-number">' + String(i + 1).padStart(2, '0') + '</span><span class="zf-domain">' + esc(({命宮:'타고난 나',財帛:'돈과 재물',官祿:'일과 지위',遷移:'집 밖의 활동',福德:'마음과 삶의 즐거움'})[f.palace] || f.domain) + '</span><span class="zf-check" aria-label="해당">✓</span></div>';
         h += '<h4>' + esc((R.filterTitles || {})[f.key] || f.title) + '</h4>' + (f.name && f.key !== 'wealth-rank' && f.key !== 'honor-rank' ? '<p class="zf-name">' + esc(f.name) + '</p>' : '');
-        h += '<div class="zf-rate"><span>' + (i ? '여기까지 모두 갖춘 비율' : '이 조건을 갖춘 비율') + '</span><strong>' + rate(f.percent) + '</strong></div><div class="zf-track" aria-hidden="true"><i style="width:' + width.toFixed(5) + '%"></i></div>';
+        h += '<div class="zf-rate"><span>' + (i ? '여기까지의 조건을 모두 갖춘 비교 명식' : '이 조건을 갖춘 비교 명식') + '</span><strong>' + rate(f.percent) + '</strong></div><div class="zf-track" aria-hidden="true"><i style="width:' + width.toFixed(5) + '%"></i></div>';
         h += '<details><summary>내게 해당하는 이유</summary>' + (f.sources || []).map(source).join('') + '</details></li>';
       });
       h += '</ol></section>';
     }
-    h += '<section class="zf-conclusion"><p class="zf-kicker">당신에게 모인 좋은 조건</p><h3>' + esc(story.conclusion) + '</h3><p>' + esc(story.summary) + '</p>';
+    h += '<section class="zf-conclusion"><p class="zf-kicker">당신에게 모인 좋은 조건</p><h3>' + esc(filters.length ? '내 명반에 함께 모인 조건' : '현재 확인된 좋은 조건이 없습니다.') + '</h3><p>' + esc(filters.length ? filters.map(f => everyday((R.filterTitles || {})[f.key] || f.title)).join(' · ')+'의 조건이 함께 확인됐습니다. 각 조건의 적용 범위와 다른 분야의 경계를 함께 읽습니다.' : '좋은 조건의 수만으로 명반 전체를 판단하지 않습니다. 아래의 열두 분야 풀이에서 강점과 경계를 함께 살펴보세요.') + '</p>';
     if (filters.length) h += '<div class="zf-total"><span>위 조건을 모두 갖춘 명반</span><strong>' + rate(story.percent) + '</strong><small>같은 기준으로 계산한 명반 중</small></div>';
     if (filters.length) h += '<p class="zf-closing">이것들이 옛 책이<br>당신을 좋게 본 이유예요.</p>';
```

### myeongban-prose.js

까닭: 전문용어를 풀되 기존 문장의 강도와 적용 조건을 보존합니다.

```diff
diff --git a/app/myeongban-prose.js b/app/myeongban-prose.js
index 5c558c61..0865ea0a 100644
--- a/app/myeongban-prose.js
+++ b/app/myeongban-prose.js
@@ -82,13 +82,13 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "아랫사람과 동료가 거세고, 당신을 속여요.": "성품이 거센 아랫사람과 동료가 당신을 속여요. 집안 재물도 많이 훔쳐요.",
   "힘 있는 자리에 오르고, 이름과 돈을 다 얻어요.": "힘 있는 높은 자리에 올라, 명성과 재물을 모두 얻어요.",
-  "글과 행정을 맡는 관리(문관)와 군사 일을 맡는 관리(무관) 모두에 필요한 능력이 있어요.": "글과 행정을 맡는 문관과 군사를 맡는 무관, 두 자리에 모두 필요한 재능이 있어요.",
+  "글과 행정을 맡는 관리(문관)와 군사 일을 맡는 관리(무관) 모두에 필요한 능력이 있어요.": "사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽에 필요한 재능이 있어요.",
   "높은 자리에 올라 이름이 드러나요.": "높은 지위에 올라 이름이 알려져요.",
   "돈을 맡아 다루는 자리에 앉아요.": "재물을 맡아 다루는 관리가 돼요.",
   "이름을 얻거나 자리에 오르는 데 당신의 몫이 없어요.": "이름을 떨치거나 벼슬에 오를 운이 없어요.",
-  "군인처럼 무기와 규율을 다루는 자리(무관)로 힘 있는 자리에 오르지만 오래가지 않아요.": "군사를 맡는 무관으로 높은 지위와 권한을 얻어요. 다만 오래가지는 않아요.",
-  "글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 이름이 나요.": "글과 행정을 맡는 문관이나 군사를 맡는 무관, 어느 쪽으로도 이름을 알려요.",
+  "군인처럼 무기와 규율을 다루는 자리(무관)로 힘 있는 자리에 오르지만 오래가지 않아요.": "몸을 쓰거나 규율이 엄한 조직에서 일하며 높은 지위와 권한을 얻어요. 다만 오래가지는 않아요.",
+  "글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 이름이 나요.": "사무를 보는 일이나 몸을 쓰거나 규율이 엄한 조직의 일, 어느 쪽으로도 이름을 알려요.",
   "뜻이 높고 자존심이 세요.": "거만하고, 갑자기 일이 무너져요. 높은 지위에 올라 이름을 알리기는 어려워요.",
   "북적이는 곳에서 실무를 맡는 하급 자리에 발을 붙이고 나아가요.": "사람이 북적이는 곳에서 하급 관리로 자리를 잡고 나아가요.",
-  "군인처럼 무기와 규율을 다루는 자리(무관)로는 힘 있는 자리에 오르고, 글과 행정으로 일하는 자리(문관)로는 오래가지 않아요.": "군사를 맡는 무관으로는 높은 지위와 권한을 얻어요. 글과 행정으로 일하는 문관으로는 오래가지 않아요.",
+  "군인처럼 무기와 규율을 다루는 자리(무관)로는 힘 있는 자리에 오르고, 글과 행정으로 일하는 자리(문관)로는 오래가지 않아요.": "몸을 쓰거나 규율이 엄한 조직의 일에서는 높은 지위와 권한을 얻어요. 사무를 보는 일에서는 오래가지 못해요.",
   "맡은 자리에서 물러나는 일이 있어요.": "맡고 있던 벼슬에서 물러나는 일이 있어요.",
   "힘이 드러나고 이름이 빛나요.": "권한을 얻고 이름을 떨쳐 높은 지위에 올라요.",
@@ -154,8 +154,8 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "집 밖에서 편치 않아요.": "집 밖에서는 마음이 편하지 않아요.",
   "지공 · 지겁 두 별은 반드시 돈을 잃게 하고, 오래 이어지는 운(대한)이나 그해의 운(소운)에서 만나면 반드시 흉해요.": "지공·지겁은 반드시 돈을 잃게 하는 별이에요. 10년 운인 대한이나 한 해 운인 소운에서 만나면 반드시 흉한 일을 겪어요.",
-  "아랫사람과 동료가 힘이 되지 못하고, 있어도 오래가지 않아요. 가장 밝은 자리(입묘)라면 늦은 나이에야 모아요.": "아랫사람과 동료가 당신을 배신하고 원망해요. 도움이 되지 못하고, 곁에 있어도 오래 머물지 않아요. 별이 가장 빛나는 자리인 입묘라면, 늦은 나이가 되어서야 아랫사람을 구해요.",
+  "아랫사람과 동료가 힘이 되지 못하고, 있어도 오래가지 않아요. 가장 밝은 자리(입묘)라면 늦은 나이에야 모아요.": "아랫사람과 동료가 당신을 배신하고 원망해요. 도움이 되지 못하고, 곁에 있어도 오래 머물지 않아요. 별이 힘을 가장 잘 발휘하는 자리라면, 늦은 나이가 되어서야 아랫사람을 구해요.",
   "화권 · 화록이 아랫사람 자리에 있으면 높은 자리(벼슬)에 올라서도 바쁘게 뛰어다녀요.": "아랫사람을 보는 칸에 화권·화록이 있으면, 높은 벼슬에 올라도 바쁘게 뛰어다녀요.",
-  "글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 다 좋아요. 돈과 높은 자리(벼슬)도 다 좋아요. 자손도 높은 자리(벼슬)에 올라요.": "글과 행정을 맡는 문관으로도, 군사를 맡는 무관으로도 잘돼요. 재물과 벼슬을 함께 얻고, 자손도 벼슬에 올라요.",
-  "글과 행정을 맡는 관리(문관)와 군사 일을 맡는 관리(무관) 모두에 필요한 능력이 있어요. 군인처럼 무기와 규율을 다루는 일(무관)에서 가장 크게 일어서고, 글과 행정으로 하는 일(문관)은 이롭지 않아요.": "글과 행정을 맡는 문관과 군사를 맡는 무관, 양쪽에 재능이 있어요. 다만 무관으로 가장 크게 일어서고, 문관으로 일하는 것은 이롭지 않아요.",
+  "글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 다 좋아요. 돈과 높은 자리(벼슬)도 다 좋아요. 자손도 높은 자리(벼슬)에 올라요.": "사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽에서 잘돼요. 재물과 높은 지위를 함께 얻고, 자손도 높은 지위에 올라요.",
+  "글과 행정을 맡는 관리(문관)와 군사 일을 맡는 관리(무관) 모두에 필요한 능력이 있어요. 군인처럼 무기와 규율을 다루는 일(무관)에서 가장 크게 일어서고, 글과 행정으로 하는 일(문관)은 이롭지 않아요.": "사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽에 재능이 있어요. 다만 크게 일어서는 쪽은 몸을 쓰거나 규율이 엄한 조직의 일이에요. 사무를 보는 일은 이롭지 않아요.",
   "일에서 이뤘다 무너졌다 하고, 자리에서 깎여 내려앉는 일(貶謫)이 있어요.": "일에서 성공했다가 무너지기를 되풀이해요. 벼슬이 낮아지거나 먼 곳으로 쫓겨나는 벌을 받아요.",
   "평범하고, 겉으로 이름만 있고 실속이 없어요.": "평범해요. 겉으로 이름만 알려지고 실속은 없어요.",
@@ -274,5 +274,5 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "기가 센 사람은 갑자기 무너져요.": "거만한 사람은 갑자기 재물을 잃어요.",
   "제 손으로 집안을 이루고, 기술이나 잡다한 일로 사는 사람이면 잘 풀려요.": "가진 것 없이 시작해 집안을 일으켜요. 여러 기술이나 잡일로 살아가는 사람에게 좋아요.",
-  "돈이 넉넉한 자리예요. 별이 밝은 자리면 돈과 높은 자리인 벼슬이 으뜸가요.": "재물이 넉넉해요. 별이 힘을 잘 쓰는 자리인 입묘에 있으면, 재물과 지위가 아주 높아요.",
+  "돈이 넉넉한 자리예요. 별이 밝은 자리면 돈과 높은 자리인 벼슬이 으뜸가요.": "재물이 넉넉해요. 별이 힘을 가장 잘 발휘하는 자리에 있으면, 재물과 지위가 아주 높아요.",
   "애써도 버는 돈이 많지 않아요. 하는 일을 바꿔야 집안을 이뤄요.": "애써도 버는 돈이 적어요. 하는 일을 바꿔야 집안을 일으켜요.",
   "겉으로 드러나지 않는 숨은 병이 있어요.": "겉으로 드러나지 않는 병이 있어요.",
@@ -305,10 +305,10 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "평범해요. 특별히 오르지도 내려가지도 않아요.": "평범해요.",
   "갑자기 무너지는 일이 있고, 이름을 드러내기 어려워요.": "거만하고 갑자기 실패해요. 높은 지위에 올라 이름을 알리기 어려워요.",
-  "군인처럼 무기와 규율을 다루는 자리(무관)로 큰 권한을 쥐어요.": "군사 일을 맡는 관리인 무관이 되어 큰 권한을 쥐어요.",
+  "군인처럼 무기와 규율을 다루는 자리(무관)로 큰 권한을 쥐어요.": "몸을 쓰거나 규율이 엄한 조직에서 일하며 큰 권한을 쥐어요.",
   "자리에서 올랐다 물러났다 하는 일이 있어요.": "벼슬에 나아갔다 물러났다 해요.",
   "일에서 받는 봉급(녹)이 천 섬으로, 보수가 아주 넉넉해요.": "봉급으로 곡식 천 종을 받아요. 종은 옛 곡식의 양 단위로, 봉급이 아주 넉넉하다는 말이에요.",
   "중심에서 멀리 떨어진 땅(변방)의 자리(벼슬)에서 일해요.": "나라의 중심에서 멀리 떨어진 변방에서 벼슬을 맡아요.",
   "우뚝 서서 높은 자리에 드러나요.": "두각을 나타내며 높은 지위에 올라 이름을 알려요.",
-  "군인처럼 무기와 규율을 다루는 자리(무관)로 높이 올라요.": "군사 일을 맡는 관리인 무관이 되어 높은 지위에 올라요.",
+  "군인처럼 무기와 규율을 다루는 자리(무관)로 높이 올라요.": "몸을 쓰거나 규율이 엄한 조직에서 일하며 높은 지위에 올라요.",
   "당신의 손으로 마련하는 집과 땅이 있고, 나이 들어서 부유해져요.": "스스로 집과 땅을 마련하고, 나이 들어서 부유해져요.",
   "할아버지 · 아버지 대에서 내려오는 덕을 입어요 — 윗대가 마련해 둔 것이 당신에게 닿아요.": "할아버지가 마련해 둔 것의 혜택을 받아요.",
@@ -365,5 +365,5 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "아랫사람과 동료가 많고, 당신이 한 번 부르면 여럿이 바로 대답해요.": "아랫사람과 동료가 많아요. 당신이 한 번 부르면 모두 따라요.",
   "나쁜 별(악성)이 아랫사람과 동료를 보는 여덟째 자리(노복궁)에 오면 아랫사람과 동료의 도움이 없어요.": "아랫사람과 동료를 보는 노복궁은 여덟째 궁이에요. 여기에 나쁜 별이 오면 아랫사람과 동료의 도움을 받지 못해요.",
-  "바르게 처신해요. 글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 다 좋아요.": "바르게 처신해요. 글과 행정을 맡는 문관도, 군사 일을 맡는 무관도 모두 좋아요.",
+  "바르게 처신해요. 글과 행정을 맡는 관리(문관)든 군사 일을 맡는 관리(무관)든 다 좋아요.": "바르게 처신해요. 사무를 보는 일도, 몸을 쓰거나 규율이 엄한 조직의 일도 모두 좋아요.",
   "이름이 났다가 물러났다가를 되풀이해요.": "명성이 높아졌다 낮아졌다 해요.",
   "자리에서 쫓겨나 내려앉는 일이 있어요.": "벼슬에서 쫓겨나거나 직위가 낮아져요.",
@@ -505,6 +505,6 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "일에서 아주 높은 자리에 올라 제후 · 백작에 이르러요.": "아주 높은 벼슬에 올라 제후 · 백작의 작위를 받아요.",
   "힘 있고 높은 자리에 올라요.": "높은 지위에 올라 큰 권한을 가져요.",
-  "글과 행정으로 일하는 자리(문관)든 군인처럼 무기와 규율을 다루는 자리(무관)든 다 맞아요.": "글과 행정을 맡는 관리인 문관도, 군사를 맡는 관리인 무관도 잘 맞아요.",
-  "군인처럼 무기와 규율을 다루는 자리(무관)로 우뚝 서고, 높은 자리(벼슬)가 없는 보통 사람도 복이 피어요.": "군사를 맡는 관리인 무관으로 두각을 드러내요. 벼슬이 없는 보통 사람도 복을 누려요.",
+  "글과 행정으로 일하는 자리(문관)든 군인처럼 무기와 규율을 다루는 자리(무관)든 다 맞아요.": "사무를 보는 일도, 몸을 쓰거나 규율이 엄한 조직의 일도 잘 맞아요.",
+  "군인처럼 무기와 규율을 다루는 자리(무관)로 우뚝 서고, 높은 자리(벼슬)가 없는 보통 사람도 복이 피어요.": "몸을 쓰거나 규율이 엄한 조직의 일에서 두각을 드러내요. 관직이 없는 보통 사람도 복을 누려요.",
   "갑자기 크게 이름을 세워요.": "갑자기 큰 공을 세워 이름을 떨쳐요.",
   "일 때문에 갇혀 목과 손에 형틀을 차는 죄수가 돼요.": "일 때문에 목과 손발에 형틀을 찬 죄수가 돼요.",
@@ -512,10 +512,10 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "높은 자리에 많이 올라요.": "높은 지위에 올라요.",
   "높은 자리(벼슬)에 올라요.": "높은 벼슬인 삼품에 올라요.",
-  "글과 행정으로 일하는 자리(문관)든 군인처럼 무기와 규율을 다루는 자리(무관)든 힘 있는 자리에 오르고, 그 힘이 작지 않아요.": "글과 행정을 맡는 문관이든, 군사를 맡는 무관이든 높은 지위와 큰 권한을 얻어요.",
+  "글과 행정으로 일하는 자리(문관)든 군인처럼 무기와 규율을 다루는 자리(무관)든 힘 있는 자리에 오르고, 그 힘이 작지 않아요.": "사무를 보는 일이나 몸을 쓰거나 규율이 엄한 조직의 일을 맡아 높은 지위와 큰 권한을 얻어요.",
   "일에서 뉘우칠 일을 만나요.": "일에서 후회하거나 곤란해질 일을 겪어요.",
   "일에서 이뤘다 무너졌다를 되풀이해요.": "일에서 성공과 실패를 거듭해요.",
   "자리에서 깎여 내려앉는 일(贬谪)이 있어요.": "벼슬이 낮아지고 먼 곳으로 쫓겨나는 유배를 당해요.",
-  "군인처럼 무기와 규율을 다루는 자리(무관)로 우뚝 서고 그 힘이 작지 않지만, 글과 행정으로 일하는 자리(문관)는 맞지 않아요.": "군사를 맡는 관리인 무관으로 두각을 드러내고, 높은 지위와 큰 권한을 얻어요. 글과 행정을 맡는 문관은 맞지 않아요.",
-  "글과 행정으로 일하는 자리(문관)로는 오래가지 않고, 실무를 맡는 하급 자리가 가장 좋아요.": "글과 행정을 맡는 문관으로는 오래가지 못해요. 실무를 맡는 하급 관리가 가장 좋아요.",
+  "군인처럼 무기와 규율을 다루는 자리(무관)로 우뚝 서고 그 힘이 작지 않지만, 글과 행정으로 일하는 자리(문관)는 맞지 않아요.": "몸을 쓰거나 규율이 엄한 조직의 일에서 두각을 드러내고, 높은 지위와 큰 권한을 얻어요. 사무를 보는 일은 맞지 않아요.",
+  "글과 행정으로 일하는 자리(문관)로는 오래가지 않고, 실무를 맡는 하급 자리가 가장 좋아요.": "사무를 보는 일에서는 오래가지 못해요. 실무를 맡는 하급 자리가 가장 좋아요.",
   "물려받은 집과 땅은 지키지 못하고 떠나요.": "물려받은 집과 땅을 잃어요.",
   "논밭 · 땅이 있어요.": "논밭을 갖춘 농장이 있어요.",
@@ -553,5 +553,5 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "몸이 여위고 누렇게 뜨고 지쳐 많이 약하며, 남의 것을 훔치거나 몸을 팔아요.": "몸이 여위고 누렇게 뜨며, 가난하고 허약해요. 도둑질하거나 몸을 팔아요.",
   "부모나 가까운 식구를 잃거나 그들에게 해가 가는 일이 많아요.": "부모나 가까운 친척을 잃거나 그들이 해를 입는 일이 많아요.",
-  "형제를 잃거나 형제에게 해가 가고, 밝은 자리면 형제가 하나예요.": "형제를 잃거나 서로 해를 끼쳐요. 별이 밝은 자리인 입묘에 있으면 형제가 한 명이에요.",
+  "형제를 잃거나 형제에게 해가 가고, 밝은 자리면 형제가 하나예요.": "형제를 잃거나 서로 해를 끼쳐요. 별이 힘을 가장 잘 발휘하는 자리에 있으면 형제가 한 명이에요.",
   "형제가 없거나, 형제를 잃거나 형제에게 해가 가고 외로워요.": "형제를 잃고 외롭게 지내요.",
   "이 자리에 거친 별이 더해지는 것은 몹시 꺼려요. 무슨 일이 생기는지는 옛 책에 적혀 있지 않아요.": "이 궁에 해로운 별이 더해지는 것은 몹시 좋지 않다고 봤어요. 어떤 일이 생기는지는 이 구절에 적혀 있지 않아요.",
@@ -580,6 +580,6 @@ window.CHAEKSA_ZIWEI_PROSE = {
   "돈과 높은 자리(벼슬)가 다 좋아요.": "재물과 벼슬이 모두 좋아요.",
   "실무를 맡는 하급 자리에서 힘을 얻고 자리가 높아져요.": "실무를 맡는 하급 관리로 높은 지위와 권한을 얻어요.",
-  "군인처럼 무기와 규율을 다루는 자리(무관)가 맞고, 글과 행정으로 일하는 자리(문관)와는 맞지 않아요.": "군사를 맡는 관리인 무관이 맞아요. 글과 행정을 맡는 문관은 맞지 않아요.",
-  "군인처럼 무기와 규율을 다루는 자리(무관)가 가장 이로워요.": "군사를 맡는 관리인 무관이 가장 유리해요.",
+  "군인처럼 무기와 규율을 다루는 자리(무관)가 맞고, 글과 행정으로 일하는 자리(문관)와는 맞지 않아요.": "몸을 쓰거나 규율이 엄한 조직의 일이 맞아요. 사무를 보는 일은 맞지 않아요.",
+  "군인처럼 무기와 규율을 다루는 자리(무관)가 가장 이로워요.": "몸을 쓰거나 규율이 엄한 조직의 일이 가장 유리해요.",
   "일에서 좋아요.": "일과 벼슬에서 좋다고 본 배치예요.",
   "처음엔 없다가 뒤에 생겨요 — 집과 땅은 나중에 마련해요.": "처음에는 집과 땅이 없다가 나중에는 생겨요.",
```

