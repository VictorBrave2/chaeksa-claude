/* 책사 API 프록시 — Cloudflare Worker v1.1
 * 브라우저 → 이 워커 → Anthropic. API 키는 워커 환경변수(ANTHROPIC_API_KEY)에만 존재.
 *
 * 설정(Cloudflare 대시보드 > Workers > 워커 > Settings > Variables):
 *   ANTHROPIC_API_KEY  (Secret)  필수
 *   ALLOWED_ORIGIN     (Text)    예: https://chaeksa.kr   (비우면 모두 허용 — 테스트용)
 *   DAILY_LIMIT        (Text)    사용자(IP)당 하루 호출 상한. 기본 40
 *   RATE (KV 바인딩, 선택)       호출 제한 카운터 저장소. 없으면 제한 없이 동작
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN.split(',').map(s => s.trim()) : null;
    const originOk = !allowed || allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originOk ? (origin || '*') : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, anthropic-version, anthropic-beta',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('책사 API 프록시 동작 중', { status: 200, headers: cors });
    if (!originOk) return json({ error: { message: '허용되지 않은 출처' } }, 403, cors);

    // 호출 제한 (KV 있을 때만)
    if (env.RATE) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const day = new Date().toISOString().slice(0, 10);
      const key = `${day}:${ip}`;
      const n = parseInt((await env.RATE.get(key)) || '0', 10);
      const limit = parseInt(env.DAILY_LIMIT || '40', 10);
      if (n >= limit) return json({ error: { message: '오늘 비서 사용량을 다 썼어요. 내일 다시 만나요.' } }, 429, cors);
      await env.RATE.put(key, String(n + 1), { expirationTtl: 60 * 60 * 36 });
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: { message: 'Bad JSON' } }, 400, cors); }
    const ALLOWED_MODELS = new Set(['claude-opus-5', 'claude-sonnet-5']);
    if (!ALLOWED_MODELS.has(body.model)) body.model = 'claude-opus-5';
    body.max_tokens = Math.min(body.max_tokens || 800, 2200);  // 심층 상담 서술이 길어 상향

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': request.headers.get('anthropic-beta') || 'server-side-fallback-2026-07-01',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { ...cors, 'content-type': 'application/json' } });
  },
};
function json(obj, status, headers) { return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'content-type': 'application/json' } }); }
