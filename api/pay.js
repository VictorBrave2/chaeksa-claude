/* 책사 결제 — 토스페이먼츠 승인 (Vercel 서버리스, Node 런타임)
 *
 * 왜 서버가 필요한가:
 *   결제창이 닫혔다고 돈이 들어온 게 아니다. **승인(confirm)** 을 서버가 비밀키로
 *   불러야 결제가 끝난다. GitHub Pages 는 정적이라 이걸 못 한다.
 *   그래서 이미 있는 Vercel(api/chat.js 가 사는 곳)에 한 자리 더 붙인다.
 *
 * 흐름
 *   1) open     브라우저 → 여기 → Supabase order_open  (금액을 DB 가 정한다)
 *   2) 결제창    브라우저 → 토스 (orderId, amount)
 *   3) confirm  브라우저 → 여기 → order_check 로 **금액 대조** → 토스 승인 → order_paid
 *   4) fail     브라우저 → 여기 → order_failed
 *
 * 금액 위변조
 *   2)의 amount 는 브라우저가 들고 있으므로 얼마든 고칠 수 있다. 3)에서 토스가 돌려주는
 *   amount 도 결국 2)에서 온 값이다. 그래서 **DB 의 orders.amount 와 대조**한다.
 *   이 대조 하나가 방어 전부다. 지우면 100원으로 3만원짜리를 산다.
 *
 * 환경변수 (Vercel > Project > Settings > Environment Variables)
 *   TOSS_SECRET_KEY   필수. 여기 있어야 할 유일한 비밀. 절대 브라우저로 안 내려간다
 *   TOSS_CLIENT_KEY   공개값. GET 으로 브라우저에 내려준다 —
 *                     비밀키와 짝이므로 한 곳(여기)에 같이 둬야 어긋나지 않는다
 *   ALLOWED_ORIGIN    예: https://chaeksa.kr
 *   둘 중 하나라도 비면 ready:false 로 답하고, 화면은 '준비 중'을 보여준다.
 *
 * 호출 주소: https://<프로젝트>.vercel.app/api/pay
 */
const TOSS_CONFIRM = 'https://api.tosspayments.com/v1/payments/confirm';

// 환경변수에 눈에 안 보이는 문자가 섞여 헤더 조립이 통째로 죽은 전례가 두 번 있다
// (api/chat.js 주석 참고). URL·키·JWT 는 어차피 ASCII 만 유효하다.
const clean = (v) => (v || '').replace(/[^!-~]/g, '');
const env = (k) => clean(process.env[k]);

const SB_URL = 'https://dedgzremezveiwhosqjj.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZGd6cmVtZXp2ZWl3aG9zcWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODQyNzcsImV4cCI6MjEwMzE2MDI3N30.ek3yy6tZuYLydS6f1yiLrXIUGSJCeiNLPN5bExas-TA';
const sbUrl = () => (env('SUPABASE_URL_OVERRIDE') || SB_URL).replace(/\/+$/, '');
const sbAnon = () => env('SUPABASE_ANON_OVERRIDE') || SB_ANON;

/** Supabase RPC — 사용자 토큰으로 부른다. 토큰이 가짜면 auth.uid() 가 안 나와 그 자체로 걸린다. */
async function rpc(name, args, userToken) {
  const res = await fetch(`${sbUrl()}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: sbAnon(),
      authorization: `Bearer ${userToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args || {}),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthenticated' };
    return { ok: false, reason: 'db', status: res.status };
  }
  return await res.json();
}

/* 결제는 돈이 오가므로 '장애 시 통과'가 없다. api/chat.js 는 Supabase 가 죽으면
 * 사용자를 막지 않고 통과시키지만(우리 장애를 사용자 장애로 만들지 않으려고),
 * 여기서는 반대다 — 확인 못 하면 승인하지 않는다. */

const READY = () => !!(env('TOSS_SECRET_KEY') && env('TOSS_CLIENT_KEY'));

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  const allowed = process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',').map((s) => s.trim())
    : null;
  const originOk = !allowed || allowed.includes(origin);

  res.setHeader('Access-Control-Allow-Origin', originOk ? origin || '*' : 'null');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── 상품표와 준비 상태 ──
  // 가격을 여기 안 적는다. products 표가 유일한 출처이고, 화면은 이걸 받아다 그린다.
  if (req.method === 'GET') {
    let products = [];
    let dbErr = null;
    try {
      const r = await fetch(
        `${sbUrl()}/rest/v1/products?select=code,name,amount,blurb,sort&active=is.true&order=sort.asc`,
        { headers: { apikey: sbAnon(), authorization: `Bearer ${sbAnon()}` } }
      );
      if (r.ok) products = await r.json();
      else dbErr = `products ${r.status}`;
    } catch (e) {
      dbErr = String((e && e.message) || e).slice(0, 80);
    }
    return res.status(200).json({
      ok: true,
      ready: READY(),                 // 키가 둘 다 있어야 결제 버튼이 뜬다
      clientKey: env('TOSS_CLIENT_KEY') || null,
      products,
      dbError: dbErr,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'method' });
  if (!originOk) return res.status(403).json({ ok: false, reason: 'origin' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ ok: false, reason: 'unauthenticated' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};
  const action = String(body.action || '');

  try {
    // ── 1. 주문을 연다 ──
    if (action === 'open') {
      if (!READY()) return res.status(503).json({ ok: false, reason: 'not_ready' });
      const out = await rpc('order_open', {
        p_product: String(body.product || ''),
        p_note: body.note ? String(body.note).slice(0, 500) : null,
      }, token);
      return res.status(out && out.ok ? 200 : 400).json(out);
    }

    // ── 4. 결제창에서 실패했다 ──
    if (action === 'fail') {
      const out = await rpc('order_failed', {
        p_order: String(body.orderId || ''),
        p_code: body.code ? String(body.code).slice(0, 60) : null,
        p_message: body.message ? String(body.message).slice(0, 300) : null,
      }, token);
      return res.status(200).json(out);
    }

    // ── 3. 승인 ──
    if (action === 'confirm') {
      const secret = env('TOSS_SECRET_KEY');
      if (!secret) return res.status(503).json({ ok: false, reason: 'not_ready' });

      const orderId = String(body.orderId || '');
      const paymentKey = String(body.paymentKey || '');
      const amount = parseInt(body.amount, 10);
      if (!orderId || !paymentKey || !(amount > 0)) {
        return res.status(400).json({ ok: false, reason: 'bad_request' });
      }

      // 여기가 방어의 전부다. 브라우저가 보낸 amount 를 믿지 않고 DB 와 맞춘다.
      const chk = await rpc('order_check', { p_order: orderId }, token);
      if (!chk || !chk.ok) return res.status(400).json(chk || { ok: false, reason: 'db' });
      if (chk.already) {
        // 착지 페이지를 새로고침한 경우. 이미 낸 것이므로 성공으로 답한다.
        return res.status(200).json({ ok: true, already: true, name: chk.name,
                                      amount: chk.amount, receipt: chk.receipt });
      }
      if (chk.amount !== amount) {
        return res.status(400).json({ ok: false, reason: 'amount_mismatch',
                                      expected: chk.amount });
      }

      const auth = 'Basic ' + Buffer.from(secret + ':').toString('base64');
      const tr = await fetch(TOSS_CONFIRM, {
        method: 'POST',
        headers: { authorization: auth, 'content-type': 'application/json',
                   // 같은 키로 두 번 부르면 토스가 한 번만 처리한다. 새로고침·재시도 방어.
                   'Idempotency-Key': orderId },
        body: JSON.stringify({ paymentKey, orderId, amount: chk.amount }),
      });
      const tj = await tr.json().catch(() => ({}));

      if (!tr.ok) {
        await rpc('order_failed', {
          p_order: orderId,
          p_code: String(tj.code || tr.status),
          p_message: String(tj.message || ''),
        }, token).catch(() => {});
        return res.status(400).json({ ok: false, reason: 'toss',
                                      code: tj.code || null, message: tj.message || '결제 승인에 실패했습니다' });
      }

      // 승인은 됐는데 우리 기록이 실패할 수 있다. 그때도 사용자에게는 성공이다 —
      // 돈은 이미 빠졌기 때문이다. 기록 실패는 응답에 남겨 나중에 맞춘다.
      // p_server 는 브라우저가 모르는 값이다. 이게 없으면 order_paid 가 거절한다 —
      // 로그인만으로 자기 주문을 「결제완료」로 만들 수 있던 구멍을 여기서 막는다.
      // (server/migrate-12-order-paid-lock.sql · Vercel 환경변수 PAY_HOOK_SECRET)
      const saved = await rpc('order_paid', {
        p_order: orderId,
        p_payment_key: paymentKey,
        p_method: tj.method || null,
        p_receipt: (tj.receipt && tj.receipt.url) || null,
        p_server: env('PAY_HOOK_SECRET') || null,
      }, token).catch(() => ({ ok: false, reason: 'save_failed' }));

      return res.status(200).json({
        ok: true,
        name: chk.name,
        amount: chk.amount,
        method: tj.method || null,
        approvedAt: tj.approvedAt || null,
        receipt: (tj.receipt && tj.receipt.url) || null,
        saveWarning: saved && saved.ok ? null : (saved && saved.reason) || 'save_failed',
      });
    }

    return res.status(400).json({ ok: false, reason: 'bad_action' });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: 'server',
                                  message: String((e && e.message) || e).slice(0, 120) });
  }
};
