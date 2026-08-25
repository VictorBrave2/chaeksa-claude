/* 책사 API 프록시 — Vercel 서버리스 함수 (Node 런타임)
 *
 * 왜 Vercel인가:
 *   Anthropic API는 Cloudflare 네트워크에서 오는 요청을 간헐적으로 403 "Request not allowed"로
 *   차단한다(Workers·AI Gateway 공통, 널리 보고된 문제). 재시도·헤더로 회피 불가.
 *   Vercel의 Node 런타임은 AWS에서 실행되므로 이 차단에 걸리지 않는다.
 *   ※ Edge Runtime은 Cloudflare 위에서 돌므로 절대 쓰지 말 것.
 *
 * 환경변수 (Vercel > Project > Settings > Environment Variables):
 *   ANTHROPIC_API_KEY   필수
 *   ALLOWED_ORIGIN      예: https://chaeksa.kr  (쉼표로 여러 개, 비우면 모두 허용)
 *   DAILY_LIMIT         인스턴스당 IP 하루 호출 상한. 기본 40
 *
 * 호출 주소: https://<프로젝트>.vercel.app/api/chat
 */
const UPSTREAM = 'https://api.anthropic.com/v1/messages';
const ALLOWED_MODELS = new Set(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5']);
const MAX_TOKENS = 2200;

// 간이 호출 제한(인스턴스 메모리). 재시작 시 초기화되므로 최종 방어선은
// Anthropic 콘솔의 지출 한도로 둔다.
const hits = new Map();
function overLimit(ip, limit) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}:${ip}`;
  const n = (hits.get(key) || 0) + 1;
  hits.set(key, n);
  if (hits.size > 5000) hits.clear();
  return n > limit;
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  const allowed = process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',').map((s) => s.trim())
    : null;
  const originOk = !allowed || allowed.includes(origin);

  res.setHeader('Access-Control-Allow-Origin', originOk ? origin || '*' : 'null');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, anthropic-version, anthropic-beta');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const k = process.env.ANTHROPIC_API_KEY || '';
    return res.status(200).json({
      ok: true, runtime: 'vercel-node',
      hasKey: !!k, keyLen: k.length, keyPrefix: k.slice(0, 12),
      allowedOrigin: process.env.ALLOWED_ORIGIN || null,
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
    res.status(upstream.status);
    res.setHeader('content-type', 'application/json');
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ type: 'error', error: { type: 'network', message: '비서에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.' } });
  }
};
