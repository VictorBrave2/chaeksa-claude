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
window.CHAEKSA_ART = 'all';    // 48장 전량 도착(2026-08-30) — 연애 12×3벌 + 재물 12
window.CHAEKSA_ART_VAR = { love: 3, wealth: 1 };   // 연애는 3벌 로테이션 — 한 화면 안 같은 그림 반복 없음
