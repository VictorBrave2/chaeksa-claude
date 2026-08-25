/* 책사 API 프록시 — Vercel 서버리스 함수 (Node 런타임)
 *
 * 왜 Vercel인가:
 *   Anthropic API는 Cloudflare 네트워크에서 오는 요청을 간헐적으로 403 "Request not allowed"로
 *   차단한다(Workers·AI Gateway 공통, 널리 보고된 문제). 재시도·헤더로 회피 불가.
 *   Vercel의 Node 런타임은 AWS에서 실행되므로 이 차단에 걸리지 않는다.
 *   ※ Edge Runtime은 Cloudflare 위에서 돌므로 절대 쓰지 말 것.
 *
 * 사용량 강제 (v2에서 추가):
 *   화면의 localStorage 한도는 지우면 그만이라 방어가 아니었다.
 *   이제 모든 호출에 Supabase 로그인 토큰을 요구하고, 서버 함수 ai_usage_bump가
 *   토큰 검증과 한도 계량을 한 번에 한다 (server/schema-5.sql).
 *   토큰이 가짜면 auth.uid()가 안 나와서 그 자체로 걸러진다.
 *   Anthropic 호출이 실패하면 ai_usage_refund로 되돌린다 —
 *   무료 사용자의 '평생 1회' 상담이 네트워크 사정으로 날아가면 안 된다.
 *
 * 환경변수 (Vercel > Project > Settings > Environment Variables):
 *   ANTHROPIC_API_KEY   필수
 *   SUPABASE_URL        예: https://xxxx.supabase.co  (비우면 사용량 강제 없이 동작 — 과도기용)
 *   SUPABASE_ANON_KEY   공개 anon 키 (비밀 아님. service_role 키는 절대 여기 넣지 말 것)
 *   ALLOWED_ORIGIN      예: https://chaeksa.kr  (쉼표로 여러 개, 비우면 모두 허용)
 *   DAILY_LIMIT         인스턴스당 IP 하루 호출 상한. 기본 40 (토큰 도난 시의 겉껍데기 방어)
 *
 * 호출 주소: https://<프로젝트>.vercel.app/api/chat
 */
const UPSTREAM = 'https://api.anthropic.com/v1/messages';
const ALLOWED_MODELS = new Set(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5']);
const ALLOWED_TASKS = new Set(['brief', 'chat', 'consult', 'profile', 'compat']);
const MAX_TOKENS = 2200;

// 간이 IP 제한(인스턴스 메모리). 재시작마다 초기화되고 인스턴스마다 따로 세므로
// 이것만으로는 방어가 아니다. 진짜 방어는 ai_usage_bump, 최종 방어선은 Anthropic 콘솔 한도.
const hits = new Map();
function overLimit(ip, limit) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}:${ip}`;
  const n = (hits.get(key) || 0) + 1;
  hits.set(key, n);
  if (hits.size > 5000) hits.clear();
  return n > limit;
}

/** Supabase RPC — 사용자 토큰으로 부른다. 반환: 함수의 json 또는 { ok:false, reason } */
async function rpc(name, args, userToken) {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { ok: true, skipped: true };   // 미설정이면 통과 (과도기)
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: anon,
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(args || {}),
    });
    if (!res.ok) {
      // 401/403 = 토큰이 죽었거나 가짜. 그 외는 Supabase 장애 — 이때 사용자를 막으면
      // 우리 장애가 사용자 장애가 되므로 통과시킨다 (IP 상한과 콘솔 한도가 받친다).
      if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthenticated' };
      return { ok: true, degraded: true };
    }
    return await res.json();
  } catch (e) {
    return { ok: true, degraded: true };
  }
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  const allowed = process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',').map((s) => s.trim())
    : null;
  const originOk = !allowed || allowed.includes(origin);

  res.setHeader('Access-Control-Allow-Origin', originOk ? origin || '*' : 'null');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, anthropic-version, anthropic-beta, authorization, x-chaeksa-task');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const k = process.env.ANTHROPIC_API_KEY || '';
    return res.status(200).json({
      ok: true, runtime: 'vercel-node',
      hasKey: !!k, keyLen: k.length, keyPrefix: k.slice(0, 12),
      allowedOrigin: process.env.ALLOWED_ORIGIN || null,
      usageEnforced: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ type: 'error', error: { message: 'Method not allowed' } });
  if (!originOk) return res.status(403).json({ type: 'error', error: { message: '허용되지 않은 출처' } });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const limit = parseInt(process.env.DAILY_LIMIT || '40', 10);
  if (overLimit(ip, limit)) {
    return res.status(429).json({ type: 'error', error: { type: 'rate_limit', message: '오늘 비서 사용량을 다 썼어요. 내일 다시 만나요.' } });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ type: 'error', error: { message: 'Bad request' } });
  }
  if (!ALLOWED_MODELS.has(body.model)) body.model = 'claude-opus-5';
  body.max_tokens = Math.min(body.max_tokens || 800, MAX_TOKENS);

  // ── 사용자 확인 + 계량 ──────────────────────────────────
  const auth = req.headers.authorization || '';
  const userToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const task = ALLOWED_TASKS.has(req.headers['x-chaeksa-task']) ? req.headers['x-chaeksa-task'] : 'chat';
  const enforcing = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

  if (enforcing) {
    if (!userToken) {
      return res.status(401).json({ type: 'error', error: { type: 'auth', message: 'AI 비서는 로그인하면 열립니다. 로그인 후 다시 시도해 주세요.' } });
    }
    const gate = await rpc('ai_usage_bump', { p_task: task }, userToken);
    if (!gate.ok) {
      if (gate.reason === 'over_limit') {
        return res.status(429).json({ type: 'error', error: { type: 'quota', task, message: '이 기능의 사용 한도를 다 쓰셨습니다. 규칙 기반 결과는 계속 쓰실 수 있습니다.' } });
      }
      return res.status(401).json({ type: 'error', error: { type: 'auth', message: '로그인이 만료되었습니다. 새로고침 후 다시 로그인해 주세요.' } });
    }
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': req.headers['anthropic-beta'] || 'server-side-fallback-2026-07-01',
      },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    if (!upstream.ok && enforcing && userToken) {
      // 사용자는 아무것도 못 받았다. 센 것을 되돌린다.
      rpc('ai_usage_refund', { p_task: task }, userToken).catch(() => {});
    }
    res.status(upstream.status);
    res.setHeader('content-type', 'application/json');
    return res.send(text);
  } catch (e) {
    if (enforcing && userToken) rpc('ai_usage_refund', { p_task: task }, userToken).catch(() => {});
    return res.status(502).json({ type: 'error', error: { type: 'network', message: '비서에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.' } });
  }
};
