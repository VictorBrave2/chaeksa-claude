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

/* 책사 초상이 몇 벌씩 그려져 있는가 — **그려진 만큼만 부른다.**
 * 없는 파일을 부르면 깨진 액자가 뜨고, 있는 걸 안 부르면 스물일곱 장 그려 놓고
 * 열 장만 쓰게 된다(2026-08-30 실제로 그러고 있었다).
 *
 * 벌마다 하는 일이 다르다 — 주문서(marketing/삽화-주문서-복붙.html)가 이 순서로 시킨다.
 *   1벌(대표)  정면. 이름을 세울 때·홈 얼빡
 *   2벌 -2     차분히 말하는 얼굴
 *   3벌 -3     몸을 기울여 **받아치는** 얼굴 — 다른 책사를 인용해 반박하는 발언에만 쓴다
 *   4벌 -4     듣는 얼굴 (아직 없음. 도착하면 숫자를 4로)
 *
 * 그림이 도착하면 **여기 숫자만 올리면** 화면이 알아서 쓴다. app.js 는 안 건드려도 된다. */
window.CHAEKSA_FACE_VAR = {
  japyung: 3, gungtong: 3, eokbu: 3, gungwi: 2, inyeon: 3,
  jaemul: 3, cheonjik: 3, unro: 1, hyeopgi: 3, jwajang: 3,
};

/* 회의 장면(council-<계절>[-벌].webp)이 계절마다 몇 벌인가.
 * 봄 1 · 여름 1 · 가을 2 · 겨울 2 가 지금 전부다. */
window.CHAEKSA_COUNCIL_VAR = { spring: 1, summer: 1, autumn: 2, winter: 2 };
