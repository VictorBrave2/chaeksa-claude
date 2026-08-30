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
window.CHAEKSA_VAPID = 'BOnkk9JIqSpMRYLSm3MewtToERQ6BnFDJNiNYffkpe2u7ce_hHAqrg2bAM_5XhuOTQ9_R3PSWhVkth7WJ5gfuEg';

/* 스토리 삽화 스위치 — app/art/ 에 24장이 들어오면 숫자(버전)를 넣어 켠다.
 * 꺼져 있으면(0) 파라메트릭 SVG 컷이 나온다. marketing/삽화-프롬프트.md 참고. */
// 2026-08-30 — 연애 삽화 36장을 껐다.
//   책사단으로 판이 바뀌기 전에 뽑은 그림이라 세계가 다르다:
//   서양 고딕 저택에 낯선 남자 얼굴. 공주님의 지난 사랑 이야기 옆에
//   모르는 남자 얼굴이 서 있는 것도 어색하다.
//   재물 12장은 한지 수채(벼·항아리)라 우리 세계와 맞아 그대로 둔다.
//   책사단 세계의 연애 삽화가 도착하면 'all' 로 되돌린다(프롬프트: marketing/삽화-연희-복붙.html).
//   끄면 파라메트릭 SVG 컷으로 돌아간다 — 빈 자리가 되지 않는다.
window.CHAEKSA_ART = 'wealth';
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
 * 소현(unro)이 빈 것은 실수가 아니다 — 2026-08-31 「할배 삭제」.
 * 흰 수염 노인으로 그려져 있던 것을 내렸다. 새 인물이 도착하기 전까지
 * 소현은 인장(運)만으로 선다. 빈 액자는 안 뜬다. */
window.CHAEKSA_FACE_VAR = {
  japyung: [1, 2, 3, 4], gungtong: [1, 2, 3, 4], eokbu: [1, 2, 3],
  gungwi: [1, 2, 4], inyeon: [1, 2, 3, 4], jaemul: [1, 2, 3, 4],
  cheonjik: [1, 2, 3, 4], unro: [], hyeopgi: [1, 2, 3, 4, 5], jwajang: [1, 2, 3],
};

/* 회의 장면(council-<계절>[-벌].webp)이 계절마다 몇 벌인가.
 * 봄 1 · 여름 1 · 가을 2 · 겨울 2 가 지금 전부다. */
window.CHAEKSA_COUNCIL_VAR = { spring: 1, summer: 1, autumn: 2, winter: 2 };
