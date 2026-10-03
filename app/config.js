/* 책사 설정 — 공개되어도 안전한 값만 둔다.
 * anon key는 브라우저에 노출되는 것을 전제로 만들어진 공개 키다.
 * 실제 보호는 데이터베이스의 행 수준 보안(RLS)이 한다 — server/schema.sql 참고.
 * (검증 완료: 로그인 없이 쓰기 시도 시 401 "violates row-level security policy")
 */
window.CHAEKSA_SUPABASE = {
  url: 'https://dedgzremezveiwhosqjj.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZGd6cmVtZXp2ZWl3aG9zcWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODQyNzcsImV4cCI6MjEwMzE2MDI3N30.ek3yy6tZuYLydS6f1yiLrXIUGSJCeiNLPN5bExas-TA',
};

/* 아침 푸시 알림의 VAPID 공개키 — 비밀 아님. 짝이 되는 비밀키는 Vercel에만 있다. */

/* 스토리 삽화 스위치 — app/art/ 에 24장이 들어오면 숫자(버전)를 넣어 켠다.
 * 꺼져 있으면(0) 파라메트릭 SVG 컷이 나온다. marketing/삽화-프롬프트.md 참고. */
// 2026-08-30 — 연애 삽화 36장을 껐다.
//   책사단으로 판이 바뀌기 전에 뽑은 그림이라 세계가 다르다:
//   서양 고딕 저택에 낯선 남자 얼굴. 공주님의 지난 사랑 이야기 옆에
//   모르는 남자 얼굴이 서 있는 것도 어색하다.
//   재물 12장은 한지 수채(벼·항아리)라 우리 세계와 맞아 그대로 둔다.
//   책사단 세계의 연애 삽화가 도착하면 'all' 로 되돌린다(프롬프트: marketing/삽화-연희-복붙.html).
//   끄면 파라메트릭 SVG 컷으로 돌아간다 — 빈 자리가 되지 않는다.
// 2026-09-12 밤 — 그림 110장을 전부 지웠다(사장님 「웹툰식 삽화로 가고싶은데 기존 삽화 전체 삭제하고 새로 뽑자」).
//   책사 초상·말 건네는 컷·회의 장면·연애·재물 장면 다. 꺼 둔다('') — 얼굴은 안 세우고, 장면은 SVG 컷으로, 랜딩은 글자 히어로로.
//   새 그림은 콘텐츠마다 한 장(art/story-<id>.webp)이고 이 스위치와 상관없이 있으면 뜬다.
window.CHAEKSA_ART = '20260913d';   // 09-12 밤 이야기 표지 11장 도착 — 값이 곧 캐시 버전
// 돌아온 사람 세기 (docs/29 여덟). server/migrate-16 을 Supabase 에서 돌린 **뒤에** 1 로.
// 먼저 켜면 모르는 열이라며 방문 기록 전체가 거절된다.
// 출산택일 신청 창구 — 바깥 신청 폼 주소였다. 10-02 사장님 「네이버폼 어쩌고 없애야할듯」(10-02 네이버폼 걷음) — 비워 두고, 읽던 곳
// (택일 탭 · taekil.html · taekil-apply.html · taekil-sample.html · 시뮬레이터 끝 · 장부 신청글)의 바깥 폼 갈래도 걷었다. 신청은 사이트 신청서 하나다.
// 되살리지 않는다 — 다시 바깥 폼을 쓰려면 화면 글 · 약관 · 처리방침부터 같이 고친다(tools_check.py 7 · tests_yaksok.html 이 「걷은 약속」으로 막는다).
window.CHAEKSA_TAEKIL_INTAKE_URL = '';
// 출산택일 자동 보고서(10-02 설계서 ⑤ · ⑥ 「켜는 날」) — 1: 신청서(taekil-apply.html) → 결제 → 엔진이 만들고 → 책사가 확인(app_flags.taekil_auto_release '0' 동안은
// 사장님 목록에서 「내보내기」를 눌러야 열림) → 손님 「내 보고서」. 읽는 곳: pay-done.html 자동길 · pay.js 붙음적기 · taekil-apply.html.
// 카카오페이 운영 키가 들어오기 전(결제사가 모두 시험 모드)에는 일반 손님에게 결제 단추와 함께 「결제는 곧 열려요」 + 메일 신청을 보인다(10-03 심사 회신에 맞춰 단추는 그대로) —
// 갈림은 pay.js 곧열림 한 곳(검수 계정과 운영 키가 들어온 날은 저절로 결제 단추). 서버(Vercel 공개 프록시) TAEKIL_AUTO=1 은 사장님 몫.
window.CHAEKSA_TAEKIL_AUTO = 1;
// 네이버 로그인(10-03) — 0 이면 손님에게 안 보인다(주소에 ?naverlogin=1 을 단 탭에서만 보여 사장님이 먼저 시험). 1 이면 모두에게.
// 켜기 전에: Supabase 사용자 지정 공급자 custom:naver · 네이버 개발자센터 앱(콜백 = Supabase 콜백 주소) · 시험 로그인 한 번 ·
// 개인정보처리방침에 네이버 로그인 항목 · 장부(yaksok.js)의 「카카오 로그인」 말 · 네이버 로그인 검수(모두에게 열려면).
window.CHAEKSA_NAVER_LOGIN = 0;
// 카카오 링크 공유(09-26 사장님 「사진이랑 링크를 같이」) — 카카오 디벨로퍼스 > 앱 > 앱 키 > **JavaScript 키**(공개돼도 되는 키, 도메인으로 막힌다).
// 플랫폼 > Web 에 https://chaeksa.kr 이 등록돼 있어야 한다. 비어 있으면 브라우저 공유(그림만 + 링크 클립보드)로 돌아간다.
window.CHAEKSA_KAKAO_JS_KEY = 'a31b2496dcc8d26fb0ea9f5fe0e8ff0a';
window.CHAEKSA_TRACK_VID = 1;   // migrate-16 이 돌아 vid 열이 있다(visits_stats 가 people 을 낸다). 0 이면 돌아온 사람·깔때기가 전부 0 으로 찍힌다(2026-09-15).
// 유료 LLM 「한 편」(2026-09-12 사장님 결정 「문장표는 무료 · LLM 은 유료」 3단계 — app.js 한편붙이기).
// 0 이면 super 계정만 본다(시험). 1 이면 그 장을 산 사람 모두에게 「한 편 청하기」가 선다.
// 켜기 전에 super 로 여덟 장을 굽어 읽어 볼 것 — 판정이 위 표와 어긋나거나 금지어가 새면 켜지 않는다.
window.CHAEKSA_SHEET_LLM = 0;
window.CHAEKSA_ART_VAR = { love: 3, wealth: 1 };   // 연애 3벌은 그림이 돌아오면 그대로 쓴다

/* 책사 초상 — **있는 것만 적는다.** 목록의 숫자가 곧 파일 꼬리다.
 *   1 = chaeksa-<키>.webp   2 = -2   3 = -3   4 = -4 …
 * 숫자 하나(예전 방식)로 적으면 중간이 빈 사람을 못 그린다 —
 * 성아는 1·2·4 만 있고 3 이 없다. 그래서 개수가 아니라 목록으로 둔다.
 *
 * 벌마다 하는 일이 다르다 — 주문서(marketing/삽화-주문서-복붙.html)가 이 순서로 시킨다.
 *   1 대표   정면. 이름을 세울 때·홈 얼빡
 *   2        차분히 말하는 얼굴
 *   3        몸을 기울여 **받아치는** 얼굴 — 다른 책사를 반박하는 발언에만 쓴다
 *   4        듣는 얼굴
 *
 * 그림이 도착하면 **여기 숫자만 더하면** 화면이 알아서 쓴다. app.js 는 안 건드려도 된다.
 *
 * 아래 목록이 곧 app/art/ 에 있는 파일이다. 지금은 열 명 전부 네 벌 이상이라 빈 사람이 없다.
 * (「소현은 빈 칸」이라 적혀 있던 주석을 2026-09-12 에 걷었다 — 09-03 에 넷 다 도착했는데
 *  주석만 열흘 동안 남아 있었다. 코드를 읽는 사람이 없는 줄 알고 지나간다.) */
window.CHAEKSA_FACE_VAR = {};   // 2026-09-12 밤 — 초상 41장을 지웠다. 비어 있으면 얼굴 자리를 안 만든다.

/* 「이 한마디 간직하기」 컷 목록(CHAEKSA_SAY_ART)과 첫 화면 회의 장면 벌 수(CHAEKSA_COUNCIL_VAR)는
 * 둘 다 비어 있었고 읽는 코드(app.js 회의장면)도 10-02 개편 3묶음에서 지웠다. 되살리려면 그림과 코드를 같이 들인다. */

