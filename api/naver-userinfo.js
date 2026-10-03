/* 네이버 로그인 — 사용자 정보 다리 (Vercel 서버리스, Node 런타임)
 *
 * 왜 있나(2026-10-03 사장님 「네이버로 로그인하기 만들자」):
 *   우리 로그인은 Supabase Auth 다. Supabase 는 네이버를 기본 지원하지 않지만, 「사용자 지정 OAuth 공급자(custom:naver)」로
 *   아무 OAuth2 공급자나 붙일 수 있다(인증 주소 · 토큰 주소 · 사용자 정보 주소 셋을 넣는다).
 *   그런데 네이버의 사용자 정보(https://openapi.naver.com/v1/nid/me)는 한 겹 안에 들어 있다 —
 *     { resultcode: '00', message: 'success', response: { id, email, nickname, name, profile_image, … } }
 *   Supabase 는 맨 바깥의 표준 이름(sub · email · name · picture)을 읽는다. 그래서 이 다리가 네이버에 대신 묻고 한 겹을 벗겨 돌려준다.
 *   (다른 길 — 우리 서버가 네이버 토큰을 받고 Supabase 관리자 열쇠로 사용자를 만드는 것 — 은 service_role 을 써야 해서 안 한다.)
 *
 * Supabase 대시보드 → Authentication → Providers → 사용자 지정 공급자(custom:naver)의 UserInfo URL 에 이 주소를 넣는다:
 *   https://chaeksa-claude.vercel.app/api/naver-userinfo
 * Supabase 가 네이버 접근 토큰을 Authorization: Bearer … 로 실어 부른다. 그 토큰을 네이버에 그대로 넘길 뿐이다 —
 * 비밀 키가 없고, 아무것도 저장하지 않고, 토큰 · 이메일을 기록에 남기지 않는다.
 *
 * 이메일 — 네이버는 사람이 동의하지 않으면 주지 않는다. 주면 email 에 싣되 email_verified 는 false 로 둔다:
 *   true 로 두면 같은 이메일의 카카오 계정에 저절로 이어 붙을 수 있는데, 네이버 계정의 연락 메일은 그 사람 것이라는 보증이 없다.
 *   그래서 네이버로 들어온 계정은 카카오 계정과 따로다(산 것도 따로 — 화면에 「다음에도 같은 방법으로」를 적는다).
 */
const NAVER_ME = 'https://openapi.naver.com/v1/nid/me';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const auth = String(req.headers.authorization || '');
  const m = auth.match(/^Bearer\s+([A-Za-z0-9._~+/=-]{10,2000})$/i);
  if (!m) return res.status(401).json({ error: 'no_token' });

  let r, j = {};
  try {
    r = await fetch(NAVER_ME, { headers: { authorization: 'Bearer ' + m[1] } });
    j = await r.json().catch(() => ({}));
  } catch (_) {
    return res.status(502).json({ error: 'naver_unreachable' });
  }
  const p = j && j.response;
  if (!r.ok || !j || j.resultcode !== '00' || !p || !p.id) {
    // 토큰이 틀렸거나 만료 — 네이버의 상태 그대로(401 등). 네이버가 준 말은 짧게만.
    return res.status(r.status && r.status !== 200 ? r.status : 401).json({ error: 'naver_rejected', message: String((j && j.message) || '').slice(0, 80) });
  }
  const id = String(p.id);
  const 이름 = p.nickname || p.name || null;
  return res.status(200).json({
    sub: id,
    id,
    email: p.email || undefined,
    email_verified: false,
    name: 이름 || undefined,
    nickname: p.nickname || undefined,
    preferred_username: p.nickname || undefined,
    picture: p.profile_image || undefined,
    provider: 'naver',
  });
};
