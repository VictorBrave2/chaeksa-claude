# 궁극의 책사 — 개인 명리비서

## 바로 열어보기
**https://chaeksa.kr** (라이브)
또는 `app/index.html` 더블클릭.

## 폴더 구조
- `docs/01_사업기획서.md` 사업 기획서 / `docs/02_배포가이드.md` 배포 / `docs/03_클라우드플레어_설정.md` AI 프록시 설정 / `docs/design-lab.html` 디자인 시안 비교
- `app/astro.js` — 태양 황경 천문 계산 (절기 시각, 분 단위 정확)
- `app/engine.js` — 만세력 엔진 (원국·대운·일진·십신·오행)
- `app/brief.js` — 규칙 기반 브리핑 / `calendar.js` 택일 / `compat.js` 궁합 / `ai.js` AI 비서
- `app/index.html` + `style.css` + `app.js` — 랜딩 + 5탭 앱 (오늘·달력·나·궁합·비서), PWA, 낮/밤 이중 테마
- `app/share.js` — 원국 공유 카드 (canvas 이미지) / `app/og.png` — 링크 미리보기 이미지
- `app/tongbyeon.js` — **통변 엔진**: 명리 구조 → 경쟁 가설·판별질문·실행과제·관측지표 + 조후·형충회합 보정 + Decision Lab
- `app/rules-wealth-love.js`, `app/rules-health-study-move.js` — **통변 규칙집** (6도메인 × 5십신그룹 × 강약 = 60세트). 명리 해석의 실체가 여기 있다. 학파가 갈리는 지점은 파일 상단 주석 참고
- `app/consult.js` — **심층 상담**: 가설 제시 → 되묻기 → Belief Revision → 기록 → 재방문 시 판단 수정
- `app/test.html` — 엔진 검증 페이지
- `server/worker.js` — 출시용 API 프록시 (Cloudflare Worker)

## 배포할 때
코드를 고친 뒤 반드시 실행 — 정적 파일에 `?v=N` 을 붙여 사용자 브라우저 캐시를 갱신한다.
```
python tools_bust.py --bump
```
그다음 커밋·푸시하면 GitHub Actions가 chaeksa.kr 로 자동 배포한다.

## 진행 상태
- [x] 0단계: 프로토타입 (2026-08-24)
- [x] 1단계(제작분): AI 브리핑·질문·궁합 해설, 택일 달력, 월운·세운, PWA (2026-08-24)
- [x] 웹 공개: https://chaeksa.kr (GitHub Pages, 자동 배포)
- [x] 디자인 v3: 낮 아침한지 / 밤 새벽인디고 이중 테마
- [x] 랜딩 화면, 링크 미리보기(og), 원국 공유 카드
- [x] v2.1 선택지 비교(Decision Lab) + 관측 지표 기록·추세 + 30일 재확인 알림
- [x] v2 심층 상담: 6D 스택, 경쟁 가설, 판별 질문, 판단 수정(Belief Revision), 상담 기록·재확인
- [ ] AI 프록시 (Cloudflare — `docs/03` 참고, 계정 필요)
- [ ] 회원가입(Supabase), 비공개 베타 50명
- [ ] 2단계: 구독 결제, 택일, PWA 알림
- [ ] 3단계: 앱스토어 출시
