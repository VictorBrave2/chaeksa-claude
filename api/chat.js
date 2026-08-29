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
 *   ANTHROPIC_API_KEY   필수 — 여기 있어야 할 유일한 비밀
 *   ALLOWED_ORIGIN      예: https://chaeksa.kr  (쉼표로 여러 개, 비우면 모두 허용)
 *   DAILY_LIMIT         인스턴스당 IP 하루 호출 상한. 기본 40 (토큰 도난 시의 겉껍데기 방어)
 *   SUPABASE_URL_OVERRIDE / SUPABASE_ANON_OVERRIDE — 평소엔 불필요(공개값이라 코드에
 *     기본값 있음). 프로젝트 이전 때만 쓴다. 예전 이름 SUPABASE_URL·SUPABASE_ANON_KEY는
 *     깨진 값이 남은 전례가 있어 일부러 읽지 않는다. service_role 키는 어디에도 절대 금지.
 *
 * 호출 주소: https://<프로젝트>.vercel.app/api/chat
 */
const UPSTREAM = 'https://api.anthropic.com/v1/messages';
const ALLOWED_MODELS = new Set(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5']);
const ALLOWED_TASKS = new Set(['brief', 'chat', 'consult', 'profile', 'compat', 'story']);
const MAX_TOKENS = 2200;
// story(유료 스토리 서술)만 길게 허용한다. 2만원짜리 결제 콘텐츠의 본문이라
// 400자 요약이 아니라 3천 자 보고서가 맞다. 원가 ~80원 - 상품가의 0.4%.
const MAX_TOKENS_STORY = 12000;
// 굽기를 우리 손으로 끊는 시각. Vercel 함수 상한(vercel.json 120초)보다 짧아야
// 자물쇠를 풀고 계량을 되돌릴 기회가 남는다 — 상한에 걸려 죽으면 그 기회가 없다.
const BAKE_LIMIT_MS = 110000;

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

// 환경변수에 붙여넣기하다 이물질이 섞인 전례가 두 번 있다 —
// ALLOWED_ORIGIN의 탭, 그리고 SUPABASE 키에 눈에 안 보이는 유니코드 문자
// (probe가 "ByteString ... index 8" 오류로 잡아냈다). 헤더 값에 그런 문자가 있으면
// fetch가 던지고, 그게 '장애 시 통과'로 오판되어 강제가 조용히 무력화된다.
// URL과 JWT는 어차피 ASCII만 유효하므로, 인쇄 가능한 ASCII 외는 전부 벗겨낸다.
const clean = (v) => (v || '').replace(/[^!-~]/g, '');
const env = (k) => clean(process.env[k]).replace(/\/+$/, '');

// Supabase 주소와 anon 키는 비밀이 아니다 — app/config.js로 모든 방문자의
// 브라우저에 이미 내려가는 공개값이다. 그런데 이걸 환경변수로 받게 했더니
// 붙여넣기 과정에서 값이 깨져 강제가 통째로 무력화되는 사고가 났다(probe가 잡음).
// 공개값은 코드에 둔다. 환경변수는 있으면 덮어쓰는 용도로만 남긴다.
// Vercel에 남아야 할 비밀은 ANTHROPIC_API_KEY 하나뿐이다.
const SB_URL_DEFAULT = 'https://dedgzremezveiwhosqjj.supabase.co';
const SB_ANON_DEFAULT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZGd6cmVtZXp2ZWl3aG9zcWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODQyNzcsImV4cCI6MjEwMzE2MDI3N30.ek3yy6tZuYLydS6f1yiLrXIUGSJCeiNLPN5bExas-TA';
// 기존 SUPABASE_URL·SUPABASE_ANON_KEY 환경변수는 깨진 채 남아 있을 수 있으므로
// '일부러 무시'한다. 나중에 프로젝트를 옮길 때는 _OVERRIDE 이름으로만 덮어쓴다.
const sbUrl = () => env('SUPABASE_URL_OVERRIDE') || SB_URL_DEFAULT;
const sbAnon = () => clean(process.env.SUPABASE_ANON_OVERRIDE) || SB_ANON_DEFAULT;

/** Supabase RPC — 사용자 토큰으로 부른다. 반환: 함수의 json 또는 { ok:false, reason } */
async function rpc(name, args, userToken) {
  const url = sbUrl();
  const anon = sbAnon();
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
    // 헤더에 못 들어가는 문자 = 설정이 깨진 것. 장애가 아니므로 통과시키지 않는다.
    if (/ByteString|invalid header|Invalid value/i.test(String(e && e.message))) {
      return { ok: false, reason: 'unauthenticated' };
    }
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
  res.setHeader('Access-Control-Allow-Headers', 'content-type, anthropic-version, anthropic-beta, authorization, x-chaeksa-task, x-chaeksa-cache');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const k = process.env.ANTHROPIC_API_KEY || '';
    const enforced = true;
    // 프록시 → Supabase가 실제로 닿는지. 토큰 없이 부르면 '권한 거부'가 정상 응답이다.
    let probe;
    {
      try {
        const pr = await fetch(`${sbUrl()}/rest/v1/rpc/ai_usage_state`, {
          method: 'POST',
          headers: { apikey: sbAnon(), 'content-type': 'application/json' },
          body: '{}',
        });
        const pj = await pr.json().catch(() => ({}));
        probe = pr.status === 401 && String(pj.message || '').includes('permission denied')
          ? 'ok'                                   // 익명 거부 = 함수 존재 + 연결 정상
          : `unexpected ${pr.status} ${String(pj.message || pj.code || '').slice(0, 60)}`;
      } catch (e) {
        probe = 'unreachable: ' + String(e.message || e).slice(0, 80);
      }
    }
    return res.status(200).json({
      ok: true, runtime: 'vercel-node',
      hasKey: !!k,   // 키 길이·앞자리는 노출하지 않는다 (2026-08-30 보안 점검)
      allowedOrigin: process.env.ALLOWED_ORIGIN || null,
      usageEnforced: enforced,
      // 굽기 상한 — Vercel 함수 상한(120초)보다 짧아야 우리가 뒷정리를 할 수 있다.
      // 여기 보이는 값이 실제로 도는 판이다(배포가 반영됐는지 이 줄로 확인한다).
      bakeLimitMs: BAKE_LIMIT_MS,
      supabaseProbe: probe,
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
  const task = ALLOWED_TASKS.has(req.headers['x-chaeksa-task']) ? req.headers['x-chaeksa-task'] : 'chat';
  if (!ALLOWED_MODELS.has(body.model)) body.model = 'claude-opus-5';
  body.max_tokens = Math.min(body.max_tokens || 800, task === 'story' ? MAX_TOKENS_STORY : MAX_TOKENS);

  // ── 사용자 확인 + 계량 ──────────────────────────────────
  const auth = req.headers.authorization || '';
  const userToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const enforcing = true;   // 기본값이 코드에 있으므로 항상 강제한다

  // 간명서 서버 캐시 (schema-10) — 같은 사주는 두 번 굽지 않는다. bump 전에 본다:
  // 캐시 적중은 과금도 계량도 없다. 「굽는 중 새로고침」으로 죽은 요청의 결과도
  // 아래 put 이 저장하므로(클라이언트가 떠나도 함수는 끝까지 돈다) 토큰이 녹지 않는다.
  const cachePk = String(req.headers['x-chaeksa-cache'] || '').slice(0, 40);
  const BAKING = '§BAKING§';   // 자물쇠 표식 + 시각
  if (cachePk && userToken) {
    const hit = await rpc('ganmyeong_get', { p_pk: cachePk }, userToken);
    if (hit && hit.ok && hit.hit && hit.body) {
      if (hit.body.indexOf(BAKING) === 0) {
        // 다른 요청이 굽는 중 — 3분 안이면 새로 굽지 않는다(토큰이 녹는 유일한 길목).
        const ts = parseInt(hit.body.slice(BAKING.length), 10) || 0;
        if (Date.now() - ts < 180000) {
          return res.status(409).json({ type: 'error', error: { type: 'baking', message: '간명을 굽는 중입니다 — 잠시 뒤 자동으로 열립니다.' } });
        }
        // 3분이 지난 자물쇠는 죽은 굽기 — 지나가서 새로 굽는다
      } else {
        return res.status(200).json({ content: [{ type: 'text', text: hit.body }], cached: true });
      }
    }
    // 자물쇠를 먼저 건다 — 이 뒤로 오는 같은 사주 요청은 409로 기다린다
    await rpc('ganmyeong_put', { p_pk: cachePk, p_body: BAKING + Date.now() }, userToken).catch(() => {});
  }

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

  // 실패한 굽기가 자물쇠를 3분간 물고 있으면, 기다리는 쪽은 영영 못 받고
  // 자물쇠가 풀리는 순간 또 굽는다 — 토큰만 타는 고리다(2026-08-30).
  // 실패를 확인한 자리에서 자물쇠를 직접 푼다. 빈 몸통 = 캐시 없음.
  const 자물쇠풀기 = async () => {
    if (cachePk && userToken) await rpc('ganmyeong_put', { p_pk: cachePk, p_body: '' }, userToken);
  };

  // Vercel 함수 상한(120초)에 걸려 죽으면 뒷정리를 할 기회 자체가 없다.
  // 그 전에 우리가 끊어야 자물쇠도 풀고 계량도 되돌린다.
  const ac = new AbortController();
  const killer = setTimeout(() => ac.abort(), BAKE_LIMIT_MS);
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
      signal: ac.signal,
    });
    const text = await upstream.text();
    clearTimeout(killer);
    if (upstream.ok && cachePk && userToken) {
      // 성공한 간명은 서버에 저장 — 반드시 await: 응답을 먼저 보내면 Vercel이
      // 함수를 얼려 저장이 증발한다(2026-08-30 「pc에도 굽고 모바일에도 굽는다」의 원인).
      let 저장됨 = false;
      try {
        const j = JSON.parse(text);
        const body = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
        // 천장에 닿아 끝을 못 맺은 글은 저장하지 않는다 — 캐시에 굳으면 영원히 잘린 채 열린다.
        const 잘림 = j.stop_reason === 'max_tokens';
        if (body && !잘림) { await rpc('ganmyeong_put', { p_pk: cachePk, p_body: body }, userToken); 저장됨 = true; }
      } catch (e) {}
      // 200인데 본문이 비었다(사고량이 max_tokens를 다 먹은 경우). 저장할 게 없으면
      // 자물쇠라도 풀어야 한다 — 안 그러면 3분간 아무도 못 굽고 아무도 못 받는다.
      if (!저장됨) await 자물쇠풀기();
    }
    if (!upstream.ok) {
      // 사용자는 아무것도 못 받았다. 자물쇠를 풀고 센 것을 되돌린다.
      // 되돌리기도 반드시 await — 응답 뒤에는 함수가 얼어 증발한다.
      await 자물쇠풀기();
      if (enforcing && userToken) await rpc('ai_usage_refund', { p_task: task }, userToken);
    }
    res.status(upstream.status);
    res.setHeader('content-type', 'application/json');
    return res.send(text);
  } catch (e) {
    clearTimeout(killer);
    const 시간초과 = !!(e && (e.name === 'AbortError' || /abort/i.test(String(e.message || ''))));
    await 자물쇠풀기();
    if (enforcing && userToken) await rpc('ai_usage_refund', { p_task: task }, userToken);
    if (시간초과) {
      return res.status(504).json({ type: 'error', error: { type: 'timeout', message: '간명이 시간 안에 끝나지 않았습니다. 다시 눌러 주세요 — 사용 횟수는 되돌려 놓았습니다.' } });
    }
    return res.status(502).json({ type: 'error', error: { type: 'network', message: '비서에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.' } });
  }
};
