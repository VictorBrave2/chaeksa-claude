/* 책사 API 프록시 — Vercel 서버리스 함수 (Node 런타임)
 *
 * 왜 Vercel인가:
 *   Anthropic API는 Cloudflare 네트워크에서 오는 요청을 간헐적으로 403 "Request not allowed"로
 *   차단한다(Workers·AI Gateway 공통, 널리 보고된 문제). 재시도·헤더로 회피 불가.
 *   Vercel의 Node 런타임은 AWS에서 실행되므로 이 차단에 걸리지 않는다.
 *   ※ Edge Runtime은 Cloudflare 위에서 돌므로 절대 쓰지 말 것.
 *
 * 결제 확인 (2026-09-12, server/migrate-26):
 *   LLM 은 유료 콘텐츠에만 쓴다(사장님 결정). 모든 호출에 Supabase 로그인 토큰을 요구하고,
 *   서버 함수 llm_gate 가 **이 사람의 결제된 주문**과 그 주문의 이번 달 남은 횟수를 본다.
 *   토큰이 가짜면 auth.uid()가 안 나와서 그 자체로 걸러진다. 확인을 못 하면 막는다.
 *   손님이 받은 게 없으면(실패·시간초과·잘림·거절) llm_refund 로 횟수를 되돌린다.
 *   예전 등급 한도(ai_usage_bump, schema-9)는 더 부르지 않는다 — 무료 등급의 LLM 은 0 이다.
 *
 * 환경변수 (Vercel > Project > Settings > Environment Variables):
 *   ANTHROPIC_API_KEY   필수
 *   PAY_HOOK_SECRET     필수 — api/pay.js 와 같은 서버 열쇠(migrate-23). 결제 확인 함수(llm_gate·refund·log)를
 *                       이 프록시만 부르게 한다. 없으면 유료 LLM 이 전부 막힌다(확인 못 하면 막는 쪽).
 *   ALLOWED_ORIGIN      예: https://chaeksa.kr  (쉼표로 여러 개, 비우면 모두 허용)
 *   DAILY_LIMIT         인스턴스당 IP 하루 호출 상한. 기본 40 (토큰 도난 시의 겉껍데기 방어)
 *   TOSS_SECRET_KEY     api/pay.js 의 것. 여기서는 앞머리(test_/live_)만 본다 — 운영 키면 운영 주문만 연다.
 *   SUPABASE_URL_OVERRIDE / SUPABASE_ANON_OVERRIDE — 평소엔 불필요(공개값이라 코드에
 *     기본값 있음). 프로젝트 이전 때만 쓴다. 예전 이름 SUPABASE_URL·SUPABASE_ANON_KEY는
 *     깨진 값이 남은 전례가 있어 일부러 읽지 않는다. service_role 키는 어디에도 절대 금지.
 *
 * 호출 주소: https://<프로젝트>.vercel.app/api/chat
 */
const UPSTREAM = 'https://api.anthropic.com/v1/messages';
const ALLOWED_MODELS = new Set(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5']);
// 2026-09-12 사장님 결정 「LLM 은 유료 콘텐츠에」 — 이 프록시는 결제된 주문이 있는 작업만 부른다
// (server/migrate-26 llm_gate). 무료 작업(brief·chat·consult·compat)은 더는 받지 않고,
// 모르는 작업을 'chat' 으로 바꿔 받던 것도 걷었다. sheet = 장마다 LLM 한 편 · story = 인연·재물 · profile = 원국 정독.
const ALLOWED_TASKS = new Set(['sheet', 'story', 'profile']);
// 작업마다 출력 천장. profile 은 앱이 4000 을 청하는데 예전엔 2200 으로 깎여 잘릴 수 있었다.
const TASK_MAX = { sheet: 8000, story: 12000, profile: 4000 };
// 요청 몸통 상한 — 예전엔 입력 크기를 안 봐서 원가가 입력으로 샐 수 있었다.
const MAX_BODY_CHARS = 80000;
// 굽기를 우리 손으로 끊는 시각. Vercel 함수 상한(vercel.json 120초)보다 짧아야
// 자물쇠를 풀고 계량을 되돌릴 기회가 남는다 — 상한에 걸려 죽으면 그 기회가 없다.
const BAKE_LIMIT_MS = 110000;

// 간이 IP 제한(인스턴스 메모리). 재시작마다 초기화되고 인스턴스마다 따로 세므로
// 이것만으로는 방어가 아니다. 진짜 방어는 llm_gate(결제된 주문), 최종 방어선은 Anthropic 콘솔 한도.
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
// 이 함수가 쓰는 비밀은 ANTHROPIC_API_KEY 와 결제 확인용 PAY_HOOK_SECRET 둘이다.
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
  res.setHeader('Access-Control-Allow-Headers', 'content-type, anthropic-version, anthropic-beta, authorization, x-chaeksa-task, x-chaeksa-cache, x-chaeksa-product, x-chaeksa-note');
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
    // 유료 LLM 문(migrate-26 llm_gate)이 DB 에 있는가 — 익명 거부면 함수가 있다는 뜻이다(없으면 404).
    let gateProbe;
    try {
      const gr = await fetch(`${sbUrl()}/rest/v1/rpc/llm_gate`, {
        method: 'POST',
        headers: { apikey: sbAnon(), 'content-type': 'application/json' },
        body: JSON.stringify({ p_task: 'sheet', p_product: 'maeum', p_note: 'probe' }),
      });
      const gj = await gr.json().catch(() => ({}));
      gateProbe = gr.status === 401 && String(gj.message || '').includes('permission denied')
        ? 'ok'
        : `missing ${gr.status} ${String(gj.message || gj.code || '').slice(0, 60)}`;
    } catch (e) {
      gateProbe = 'unreachable: ' + String(e.message || e).slice(0, 80);
    }
    return res.status(200).json({
      ok: true, runtime: 'vercel-node', tasks: [...ALLOWED_TASKS], gateProbe,
      // 결제 키가 시험인지 운영인지만(키 값은 안 낸다) — 운영이면 운영 주문만 LLM 을 연다.
      payMode: env('TOSS_SECRET_KEY') ? (/^live_/.test(env('TOSS_SECRET_KEY')) ? 'live' : 'test') : 'none',
      hookSet: !!env('PAY_HOOK_SECRET'),   // 결제 확인 열쇠가 들어 있는가(값은 안 낸다)
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
  const task = String(req.headers['x-chaeksa-task'] || '');
  if (!ALLOWED_TASKS.has(task)) {
    return res.status(400).json({ type: 'error', error: { type: 'paid', message: '이 기능은 결제한 콘텐츠에서만 열립니다.' } });
  }
  // 앱이 보내는 모양만 넘긴다(ai.js call()·paramsFor) — system 은 글이나 글 조각, messages 는 user/assistant 의 글.
  // 그림·문서 조각(url 을 주면 Anthropic 이 가져와 수십만 토큰을 청구한다)·tools(웹검색 같은 서버 도구)·stream 은
  // 원가가 max_tokens 로 묶이지 않거나 뒷정리를 깨뜨린다 — 결제한 손님이라도 못 넘긴다(2026-09-12 검토).
  {
    const 조각 = (b, 캐시) => (b && b.type === 'text' && typeof b.text === 'string')
      ? Object.assign({ type: 'text', text: b.text }, 캐시 && b.cache_control ? { cache_control: { type: 'ephemeral' } } : {})
      : null;
    let system;
    if (typeof body.system === 'string') system = body.system;
    else if (Array.isArray(body.system)) system = body.system.map(b => 조각(b, true));
    else if (body.system != null) system = [null];
    const messages = body.messages.map(m => {
      if (!m || (m.role !== 'user' && m.role !== 'assistant')) return null;
      if (typeof m.content === 'string') return { role: m.role, content: m.content };
      if (!Array.isArray(m.content)) return null;
      const c = m.content.map(b => 조각(b, false));
      return c.includes(null) ? null : { role: m.role, content: c };
    });
    if (!messages.length || messages.includes(null) || (Array.isArray(system) && system.includes(null))) {
      return res.status(400).json({ type: 'error', error: { type: 'paid', message: '요청 모양이 맞지 않습니다.' } });
    }
    // 천장은 앱이 청한 값을 따르되 3000 아래로는 못 내린다 — 1 같은 값으로 일부러 잘리게 하는 길을 막는다.
    // 앱이 맞춰 둔 천장(whom 4000 · love/wealth 7000 · profile 4000)은 그대로 둔다. 작업 상한까지 올려 버리면
    // 끝을 못 맺던 글이 110초 벽까지 굽다가 시간초과로 끝나 원가만 더 탄다(2026-09-12 재검토).
    const 천장 = Math.min(Math.max(parseInt(body.max_tokens, 10) || TASK_MAX[task], 3000), TASK_MAX[task]);
    const 넘길 = { model: ALLOWED_MODELS.has(body.model) ? body.model : 'claude-opus-5', max_tokens: 천장, messages };
    if (system !== undefined) 넘길.system = system;
    const 노력 = body.output_config && body.output_config.effort;
    if (['low', 'medium', 'high'].includes(노력)) 넘길.output_config = { effort: 노력 };
    if (body.fallbacks === 'default') 넘길.fallbacks = 'default';
    body = 넘길;
  }
  if (JSON.stringify(body).length > MAX_BODY_CHARS) {
    return res.status(413).json({ type: 'error', error: { type: 'paid', message: '요청이 너무 큽니다.' } });
  }
  // 무엇을 산 주문으로 부르나 — 브라우저가 알려 주지만 믿지 않는다. llm_gate 가 DB 의 결제된 주문과 맞춘다.
  const product = String(req.headers['x-chaeksa-product'] || '').replace(/[^a-z]/g, '').slice(0, 20);
  const note = String(req.headers['x-chaeksa-note'] || '').slice(0, 60);

  // ── 사용자 확인 ──────────────────────────────────────
  const auth = req.headers.authorization || '';
  const userToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!userToken) {
    return res.status(401).json({ type: 'error', error: { type: 'auth', message: 'AI 비서는 로그인하면 열립니다. 로그인 후 다시 시도해 주세요.' } });
  }

  // 서버 캐시 (schema-10) — 같은 것은 두 번 굽지 않는다. 적중은 과금도 계량도 없다(이 사람이 이미 받은 글이다).
  // 「굽는 중 새로고침」으로 죽은 요청의 결과도 아래 put 이 저장하므로(클라이언트가 떠나도 함수는 끝까지 돈다) 토큰이 녹지 않는다.
  const cachePk = String(req.headers['x-chaeksa-cache'] || '').slice(0, 40);
  const BAKING = '§BAKING§';   // 자물쇠 표식 + 시각
  if (cachePk) {
    const hit = await rpc('ganmyeong_get', { p_pk: cachePk }, userToken);
    if (hit && hit.ok && hit.hit && hit.body) {
      if (hit.body.indexOf(BAKING) === 0) {
        // 다른 요청이 굽는 중 — 3분 안이면 새로 굽지 않는다(토큰이 녹는 유일한 길목).
        const ts = parseInt(hit.body.slice(BAKING.length), 10) || 0;
        if (Date.now() - ts < 180000) {
          return res.status(409).json({ type: 'error', error: { type: 'baking', message: '굽는 중입니다 — 잠시 뒤 자동으로 열립니다.' } });
        }
        // 3분이 지난 자물쇠는 죽은 굽기 — 지나가서 새로 굽는다
      } else {
        return res.status(200).json({ content: [{ type: 'text', text: hit.body }], cached: true });
      }
    }
  }

  // ── 결제 확인 (migrate-26 llm_gate) ─────────────────────
  // 이 사람에게 이 상품의 결제된 운영 주문이 있는가, 이번 달 그 주문의 횟수가 남았는가.
  // **확인을 못 하면 막는다.** 예전 등급 한도(ai_usage_bump)는 Supabase 가 흔들리면 통과시켰는데
  // (rpc() 의 degraded), 유료 문에서 그러면 결제 확인이 통째로 꺼진다. 함수가 없을 때 오는 404 도 같은 갈래다.
  // 운영 키(live_)로 도는 동안은 운영 주문만 연다. 시험 키로 도는 동안(토스 심사 기간)은 시험 결제 주문도 열되
  // DB 가 모두 합쳐 하루 30번으로 묶는다 — 심사하는 쪽이 결제 뒤 글이 나오는지 볼 수 있어야 한다.
  const 운영키 = /^live_/.test(env('TOSS_SECRET_KEY'));
  const 서버열쇠 = env('PAY_HOOK_SECRET') || null;   // 결제 확인 함수를 이 프록시만 부르게 하는 열쇠(api/pay.js 와 같은 것)
  const gate = await rpc('llm_gate', { p_task: task, p_product: product, p_note: note || null, p_live_only: 운영키, p_server: 서버열쇠 }, userToken);
  if (!gate || gate.degraded || !gate.ok) {
    const why = (gate && gate.reason) || 'unverified';
    if ((gate && gate.degraded) || why === 'forbidden' || why === 'unverified') {
      // 확인을 못 한 것이지 안 산 것이 아니다 — 앱이 「다시 시도」를 그리게 'paid' 가 아닌 갈래로 보낸다.
      return res.status(503).json({ type: 'error', error: { type: 'unverified', message: '결제 확인이 잠시 안 됩니다. 잠시 뒤 다시 눌러 주세요.' } });
    }
    if (why === 'unauthenticated') {
      return res.status(401).json({ type: 'error', error: { type: 'auth', message: '로그인이 만료되었습니다. 새로고침 후 다시 로그인해 주세요.' } });
    }
    if (why === 'over_cap') {
      return res.status(429).json({ type: 'error', error: { type: 'cap', message: '이 주문으로 이번 달에 청할 수 있는 횟수를 다 쓰셨습니다. 다음 달에 다시 열립니다.' } });
    }
    if (why === 'test_busy') {
      return res.status(429).json({ type: 'error', error: { type: 'cap', message: '시험 결제로 여는 글이 오늘 몰려 잠시 닫혀 있습니다. 내일 다시 열립니다.' } });
    }
    if (why === 'test_order') {
      return res.status(403).json({ type: 'error', error: { type: 'paid', message: '시험 결제로 산 주문이라 열리지 않습니다.' } });
    }
    return res.status(403).json({ type: 'error', error: { type: 'paid', message: '결제한 뒤에 열립니다.' } });
  }
  const useId = gate.use || null, useKey = gate.key || null;   // 열쇠는 손님에게 돌려주지 않는다(되돌리기·기록 전용)
  // 손님이 받은 게 없으면 횟수를 되돌린다(기록은 남긴다). 반드시 await — 응답 뒤에는 함수가 얼어 증발한다.
  const 되돌리기 = async () => { if (useId) await rpc('llm_refund', { p_use: useId, p_key: useKey, p_server: 서버열쇠 }, userToken).catch(() => {}); };

  // 자물쇠는 결제 확인을 지난 뒤에 건다 — 막힌 요청이 자물쇠를 3분 물고 있으면 안 된다.
  // 이 뒤로 오는 같은 요청은 409로 기다린다.
  if (cachePk) await rpc('ganmyeong_put', { p_pk: cachePk, p_body: BAKING + Date.now() }, userToken).catch(() => {});

  // 실패한 굽기가 자물쇠를 3분간 물고 있으면, 기다리는 쪽은 영영 못 받고
  // 자물쇠가 풀리는 순간 또 굽는다 — 토큰만 타는 고리다(2026-08-30).
  // 실패를 확인한 자리에서 자물쇠를 직접 푼다. 빈 몸통 = 캐시 없음.
  const 자물쇠풀기 = async () => {
    if (cachePk && userToken) await rpc('ganmyeong_put', { p_pk: cachePk, p_body: '' }, userToken);
  };

  // Vercel 함수 상한(120초)에 걸려 죽으면 뒷정리를 할 기회 자체가 없다.
  // 그 전에 우리가 끊어야 자물쇠도 풀고 계량도 되돌린다.
  const t0 = Date.now();
  const ac = new AbortController();
  const killer = setTimeout(() => ac.abort(), BAKE_LIMIT_MS);
  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        // 손님이 보낸 beta 는 믿지 않는다 — 비싼 기능(긴 문맥 등)을 켜는 문이 된다.
        'anthropic-beta': 'server-side-fallback-2026-07-01',
      },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    const text = await upstream.text();
    clearTimeout(killer);
    let j = null;
    try { j = JSON.parse(text); } catch (e) {}
    const stop = j && j.stop_reason;
    // 200 이어도 끝을 못 맺었거나(max_tokens) 거절했으면(refusal) 손님은 받은 게 없다 — 횟수를 되돌린다.
    const 못씀 = !upstream.ok || stop === 'max_tokens' || stop === 'refusal';
    if (upstream.ok && cachePk) {
      // 성공한 글은 서버에 저장 — 반드시 await: 응답을 먼저 보내면 Vercel이
      // 함수를 얼려 저장이 증발한다(2026-08-30 「pc에도 굽고 모바일에도 굽는다」의 원인).
      let 저장됨 = false;
      try {
        const out = ((j && j.content) || []).filter(c => c.type === 'text').map(c => c.text).join('');
        // 천장에 닿아 끝을 못 맺은 글은 저장하지 않는다 — 캐시에 굳으면 영원히 잘린 채 열린다.
        if (out && !못씀) { await rpc('ganmyeong_put', { p_pk: cachePk, p_body: out }, userToken); 저장됨 = true; }
      } catch (e) {}
      // 저장할 게 없으면 자물쇠라도 풀어야 한다 — 안 그러면 3분간 아무도 못 굽고 아무도 못 받는다.
      if (!저장됨) await 자물쇠풀기();
    }
    if (!upstream.ok) await 자물쇠풀기();
    // 원가를 처음으로 잰다 — 호출마다 토큰·시간·끝난 이유(llm_uses). 되돌린 호출도 토큰은 적는다.
    const u = (j && j.usage) || {};
    if (useId) {
      await rpc('llm_log', {
        p_use: useId, p_key: useKey, p_server: 서버열쇠, p_model: (j && j.model) || body.model,
        p_in: u.input_tokens || null, p_out: u.output_tokens || null,
        p_cr: u.cache_read_input_tokens || null, p_cw: u.cache_creation_input_tokens || null,
        p_ms: Date.now() - t0, p_stop: stop || String(upstream.status),
      }, userToken).catch(() => {});
    }
    if (못씀) await 되돌리기();
    if (못씀 && upstream.ok) {
      // 끝을 못 맺었거나 거절한 글은 넘기지 않는다. 되돌린 호출이 글까지 가져가면 한 주문으로 끝없이 부른다(2026-09-12 검토).
      // 앱(ai.js strict)도 이런 글은 실패로 버렸다 — 잃는 것이 없다.
      const 거절 = stop === 'refusal';
      return res.status(502).json({ type: 'error', error: { type: 거절 ? 'refusal' : 'truncated',
        message: 거절 ? '이 요청에는 답하지 않았습니다.' : '글이 길이 제한에 걸려 끝을 못 맺었습니다. 다시 눌러 주세요 — 사용 횟수는 되돌려 놓았습니다.' } });
    }
    res.status(upstream.status);
    res.setHeader('content-type', 'application/json');
    return res.send(text);
  } catch (e) {
    clearTimeout(killer);
    const 시간초과 = !!(e && (e.name === 'AbortError' || /abort/i.test(String(e.message || ''))));
    await 자물쇠풀기();
    await 되돌리기();
    // 가장 비싸게 실패한 호출(110초 굽고 끊긴 것)도 기록에 남긴다 — 토큰 수는 모르지만 끝난 이유와 시간은 안다.
    if (useId) {
      await rpc('llm_log', { p_use: useId, p_key: useKey, p_server: 서버열쇠, p_model: body.model,
        p_ms: Date.now() - t0, p_stop: 시간초과 ? 'timeout' : 'network' }, userToken).catch(() => {});
    }
    if (시간초과) {
      return res.status(504).json({ type: 'error', error: { type: 'timeout', message: '글이 시간 안에 끝나지 않았습니다. 다시 눌러 주세요 — 사용 횟수는 되돌려 놓았습니다.' } });
    }
    return res.status(502).json({ type: 'error', error: { type: 'network', message: '비서에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.' } });
  }
};
