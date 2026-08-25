/* 책사 설정 — 공개되어도 안전한 값만 둔다.
 * anon key는 공개용 키이며, 실제 보호는 데이터베이스의 행 수준 보안(RLS)이 한다.
 * 값이 비어 있으면 서버 동기화 기능이 조용히 꺼지고 앱은 이 기기에만 저장한다.
 */
window.CHAEKSA_SUPABASE = {
  url: '',        // 예: https://xxxxxxxx.supabase.co
  anonKey: '',    // Supabase > Project Settings > API > anon public
};
