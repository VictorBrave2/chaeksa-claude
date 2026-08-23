/* 책사 API 프록시 — Cloudflare Worker
 * 역할: 브라우저 → 이 워커 → Anthropic. API 키는 워커 환경변수(ANTHROPIC_API_KEY)에만 존재.
 * 배포: Cloudflare 대시보드 > Workers > 새 워커 > 이 코드 붙여넣기 > Settings > Variables 에 ANTHROPIC_API_KEY 추가.
 * 앱 설정의 "프록시 서버 주소"에 https://<워커주소>/v1/messages 입력.
 * 출시 전 TODO: 회원 토큰 검증(Supabase JWT), 사용자별 일일 호출 제한, 허용 도메인 제한.
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, anthropic-version, anthropic-beta, authorization',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

    let body;
    try { body = await request.json(); } catch { return new Response('Bad JSON', { status: 400, headers: cors }); }
    // 안전장치: 모델·토큰 상한 고정
    const ALLOWED = new Set(['claude-opus-5', 'claude-sonnet-5']);
    if (!ALLOWED.has(body.model)) body.model = 'claude-opus-5';
    body.max_tokens = Math.min(body.max_tokens || 800, 1500);

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
