/* 책사 결제 — 카카오페이 · 네이버페이 · 토스페이먼츠 승인 (Vercel 서버리스, Node 런타임)
 *
 * 왜 서버가 필요한가:
 *   결제창이 닫혔다고 돈이 들어온 게 아니다. **승인** 을 서버가 비밀키로
 *   불러야 결제가 끝난다. GitHub Pages 는 정적이라 이걸 못 한다.
 *   그래서 이미 있는 Vercel(api/chat.js 가 사는 곳)에 한 자리 더 붙인다.
 *
 * 흐름 — 카카오페이 (2026-10-01, 설계 chaeksa-behavior-core/design/kakaopay-10-01.md)
 *   1) kopen     브라우저 → 여기 → order_open(금액은 DB) → 카카오 ready(금액 = DB 값) → order_pg_ready(tid 는 DB 에만)
 *                → 결제창 주소(pc · mobile)만 돌려준다. 브라우저는 통째로 그 주소로 간다(팝업 없음)
 *   2) 결제창    카카오 → approval_url(pay-done.html?pv=kakao&orderId=…&pg_token=…) / cancel_url · fail_url(pay-fail.html)
 *   3) kconfirm  pay-done → 여기 → order_pg_get(tid · 금액) → 카카오 approve → 금액 대조 → order_pg_paid
 *                (실패로 닫힌 카카오 주문이면 카카오 주문 조회가 SUCCESS_PAYMENT · 금액 일치일 때 결제완료로 되살린다)
 *   4) kfail     pay-fail → 여기 → **언제나** 카카오 주문 조회 → 「끝났고 안 빠졌다」(KP_DEAD)일 때만 order_pg_failed
 *   5) krefund   사장님(super) 전용 → 카카오 cancel(전액) → order_pg_canceled
 *   시험 모드(dev 키 · TC CID)면 kopen 은 super 계정 또는 PAY_TEST_OPEN=1 일 때만 열린다.
 *
 * 흐름 — 네이버페이 (2026-10-03, 사장님이 붙여 준 문서: 결제창 호출 · 단건 결제 승인 · 단건 결제 취소. server/migrate-37)
 *   1) nopen     브라우저 → 여기 → order_open(금액은 DB) → order_pg_ready(provider naver · pg_tid 자리표 np_주문번호)
 *                → 결제창에 넘길 값(clientId · chainId · 금액 · 돌아올 주소 · 사용자 키)을 돌려준다.
 *                네이버페이는 결제창을 브라우저 SDK(Naver.Pay.open)가 연다 — 금액을 브라우저가 들고 가므로 승인 때 DB 와 꼭 맞춘다.
 *   2) 결제창    네이버 → 돌아올 주소(pay-done.html?pv=naver&orderId=…)에 resultCode · paymentId 를 붙여 돌려보낸다.
 *                **돈은 아직 안 빠졌다** — 우리 서버가 승인(apply)을 불러야 빠진다. resultCode 가 Success 가 아니면 nfail.
 *   3) nconfirm  pay-done → 여기 → order_pg_get → 네이버 apply(paymentId) → 응답의 merchantPayKey = 주문번호 · totalPayAmount = DB 금액
 *                대조 → order_pg_paid(pg_aid = 네이버 결제번호). 어긋나면 곧바로 전액 취소. 멱등 열쇠는 결제번호마다 하나(새로고침 · 재시도에 같은 답).
 *   4) nfail     결제창에서 그만뒀거나 실패 — 승인을 안 불렀으니 돈은 안 빠졌다. 열린 네이버 주문만 닫는다.
 *   5) nrefund   사장님(super) 전용 → 네이버 cancel(전액, 남은 금액 0 대조) → order_pg_canceled
 *   시험 모드(NAVERPAY_MODE 가 production 이 아니면)는 카카오와 같이 super 계정 또는 PAY_TEST_OPEN=1 일 때만 열린다.
 *
 * 흐름 — 토스(PAY_PROVIDERS 에 toss 가 있을 때만 열린다 — confirm 도 마찬가지)
 *   open → 토스 결제창 → confirm(order_check 로 **금액 대조** → 토스 승인 → order_paid) / fail(order_failed)
 *   10-03 시험 키(test_…)면 open · confirm 도 super 계정 또는 PAY_TEST_OPEN=1 일 때만 — 카카오 kopen 과 같은 문.
 *   (전에는 토스 쪽에 이 문이 없어서, 토스를 시험 키로 켜면 누구나 가짜 카드로 유료 본문을 열 수 있었다.)
 *
 * 금액 위변조
 *   토스: 결제창의 amount 는 브라우저가 들고 있으므로 **DB 의 orders.amount 와 대조**한다.
 *   카카오: ready 를 서버가 DB 금액으로 부르고 tid 는 브라우저로 안 내려간다 — 브라우저가 금액을 바꿀 자리가 없다.
 *           그래도 승인 응답의 금액을 DB 와 한 번 더 맞춘다. 다르면 곧바로 결제를 취소한다.
 *
 * 환경변수 (Vercel > Project > Settings > Environment Variables) — 값은 여기 적지 않는다
 *   PAY_PROVIDERS           보일 결제사, 쉼표로. 비우면 kakao. 토스 심사 뒤 「kakao,toss」
 *   KAKAOPAY_SECRET_KEY_DEV 카카오페이 개발자센터 앱의 Secret key(dev). 시험 CID(TC0ONETIME)로 돈이 안 빠진다
 *   KAKAOPAY_SECRET_KEY     운영 Secret key  ┐ 둘 다 있으면 운영이 이긴다(dev 키는 안 쓴다)
 *   KAKAOPAY_CID            운영 CID          ┘ TC 로 시작하면 시험으로 적는다
 *   PAY_RETURN_BASE         결제 뒤 돌아올 곳. 비우면 https://chaeksa.kr (로컬 시험 때만 http://localhost:8791)
 *   PAY_HOOK_SECRET         서버 열쇠(migrate-23). 이게 있어야 결제완료를 적는다
 *   PAY_TEST_OPEN           1 이면 시험 모드 카카오 결제를 아무나 열 수 있다(비우면 super 계정만)
 *   TAEKIL_AUTO             1 이면 출산택일 kopen 에 신청서(body.intake)가 꼭 있어야 한다(자동 보고서를 켜는 날 — 화면 config.js CHAEKSA_TAEKIL_AUTO 와 같이)
 *   TOSS_SECRET_KEY · TOSS_CLIENT_KEY   토스(비밀 · 공개 짝). test_ 로 시작하면 시험
 *   NAVERPAY_CLIENT_ID · NAVERPAY_CLIENT_SECRET · NAVERPAY_CHAIN_ID   네이버페이 센터가 준 값(셋 다 있어야 켜진다)
 *   NAVERPAY_MODE           production 이면 운영, 그 밖(비움)은 개발(시험 — 돈이 안 빠진다)
 *   NAVERPAY_API_BASE       (보통 비움) API 주소를 바꿔야 할 때만. 비우면 개발 dev-pay.paygate.naver.com · 운영 pay.paygate.naver.com
 *   ALLOWED_ORIGIN          예: https://chaeksa.kr
 *   service_role 키는 쓰지 않는다. 쓰는 것은 anon · 사용자 JWT · 서버 열쇠 셋뿐이다.
 *
 * 호출 주소: https://<프로젝트>.vercel.app/api/pay
 */
const TOSS_CONFIRM = 'https://api.tosspayments.com/v1/payments/confirm';

// ── 카카오페이 주소 · 머리 (여기 한 곳만 고치면 된다) ──────────────────────
// 확인한 것(2026-10-01): ready · approve 주소, 인증 머리 「SECRET_KEY {키}」, JSON 본문, 시험 CID TC0ONETIME,
//   approve 응답의 aid · tid · partner_order_id · payment_method_type(CARD/MONEY) · approved_at —
//   카카오페이 개발자 포럼 운영자 답변과 연동 글 둘(velog · until.blog)이 서로 맞는 것.
// **확인 못 한 것**(공식 문서 developers.kakaopay.com 은 자바스크립트로 그리는 쪽이라 기계로 못 읽었다):
//   cancel · order(주문 조회) 주소, 조회 응답의 status 값 이름, approve · 조회 응답의 amount{total} 모양,
//   approval_url 에 이미 ?가 있을 때 pg_token 을 &로 잇는지. 개발자센터 화면과 대조해 틀리면 아래만 고친다.
const KP_BASE = 'https://open-api.kakaopay.com/online/v1/payment/';
const KP_PATH = { ready: 'ready', approve: 'approve', cancel: 'cancel', order: 'order' };   // cancel · order 는 미확인
const KP_AUTH = (key) => 'SECRET_KEY ' + key;
const KP_TEST_CID = 'TC0ONETIME';
const KP_PAID = 'SUCCESS_PAYMENT';                                                         // 미확인
// 카카오가 「이 결제는 끝났고 돈은 안 빠졌다」고 말하는 상태(미확인). 여기 없는 이름이면 주문을 닫지 않는다 —
// 이름이 틀려도 주문이 open 으로 남을 뿐, 돈이 빠진 주문을 실패로 적는 일은 없다.
const KP_DEAD = ['QUIT_PAYMENT', 'FAIL_AUTH_PASSWORD', 'FAIL_PAYMENT'];
// 시간이 지났다는 것만으로는 주문을 닫지 않는다 — 늘 카카오에 묻는다(돈이 빠진 주문을 실패로 적는 길을 없앤다).

// ── 네이버페이 주소 · 머리 (여기 한 곳만 고치면 된다) ──────────────────────
// 확인한 것(2026-10-03, 사장님이 붙여 준 네이버페이 개발 문서): 승인 POST {도메인}/naverpay-partner/naverpay/payments/v2.2/apply/payment ·
//   취소 POST {도메인}/naverpay-partner/naverpay/payments/v1/cancel · 본문 x-www-form-urlencoded · 머리 X-Naver-Client-Id ·
//   X-Naver-Client-Secret · X-NaverPay-Chain-Id · X-NaverPay-Idempotency-Key · 개발 도메인 dev-pay.paygate.naver.com · 시간 60초 ·
//   응답 { code, message, body:{ paymentId, detail:{ merchantPayKey, totalPayAmount, admissionState, primaryPayMeans, … } } }.
// **확인 못 한 것**: 운영 도메인(pay.paygate.naver.com 으로 짐작 — 운영 키를 넣는 날 네이버페이 센터 안내와 대조, 다르면
//   NAVERPAY_API_BASE 로 바꾼다) · 멱등 열쇠의 글자 수 한도(64자 안으로 쓴다) · 서버 IP 등록이 필요한지.
const NP_BASE = { test: 'https://dev-pay.paygate.naver.com', live: 'https://pay.paygate.naver.com' };
const NP_PATH = { apply: '/naverpay-partner/naverpay/payments/v2.2/apply/payment', cancel: '/naverpay-partner/naverpay/payments/v1/cancel' };
const NP_TID = (orderId) => 'np_' + orderId;   // 주문을 열 때 pg_tid 에 적는 자리표(네이버 결제번호는 결제창 뒤에 생긴다)
// 승인 · 취소가 「아직 모른다」인 답 — 주문을 닫지 않고 다시 묻게 둔다.
const NP_PENDING = ['AlreadyOnGoing', 'MaintenanceOngoing', 'FaultCheckOngoing', 'AlreadyComplete', 'PreCancelNotComplete'];
const crypto = require('crypto');

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

// 서버 열쇠로만 여는 RPC(order_pg_get · order_pg_paid · order_pg_failed · order_pg_note · order_pg_canceled,
// server/migrate-33). **늘 anon 키로 부른다** — 사용자 토큰을 섞으면 만료 · 가짜 토큰 하나로 결제완료 기록이
// 401 로 막힌다. 열쇠(p_server)가 없으면 DB 가 forbidden 으로 막는다.
const srv = (name, args) =>
  rpc(name, { ...args, p_server: env('PAY_HOOK_SECRET') || null }, sbAnon());
// 서버 열쇠 + auth.uid() 가 둘 다 필요한 RPC(order_pg_ready) — 사용자 토큰으로 부른다.
const srvUser = (name, args, userToken) =>
  rpc(name, { ...args, p_server: env('PAY_HOOK_SECRET') || null }, userToken);

/** 이 토큰의 계정이 super(사장님 확인용) 인가. schema-9 ai_plan() 을 사용자 토큰으로 부른다. 모르면 false. */
async function isSuper(userToken) {
  if (!userToken) return false;
  const p = await rpc('ai_plan', {}, userToken).catch(() => null);
  return p === 'super';
}

/* 결제는 돈이 오가므로 '장애 시 통과'가 없다 — 확인 못 하면 승인하지 않는다.
 * api/chat.js 의 결제 확인(llm_gate, 2026-09-12)도 같은 쪽이다: 확인 못 하면 LLM 을 부르지 않는다. */

const READY = () => !!(env('TOSS_SECRET_KEY') && env('TOSS_CLIENT_KEY'));

/** 카카오페이 설정. 운영 키 + 운영 CID 가 둘 다 있으면 운영, 아니면 dev 키 + 시험 CID. 없으면 null. */
function kConf() {
  const key = env('KAKAOPAY_SECRET_KEY'), cid = env('KAKAOPAY_CID');
  if (key && cid) return { key, cid, mode: /^TC/.test(cid) ? 'test' : 'live' };
  const dev = env('KAKAOPAY_SECRET_KEY_DEV');
  if (dev) return { key: dev, cid: KP_TEST_CID, mode: 'test' };
  return null;
}

/** 네이버페이 설정. 셋(클라이언트 id · 비밀 · 체인 id)이 다 있어야 켜진다. NAVERPAY_MODE=production 이면 운영. */
function nConf() {
  const id = env('NAVERPAY_CLIENT_ID'), secret = env('NAVERPAY_CLIENT_SECRET'), chain = env('NAVERPAY_CHAIN_ID');
  if (!id || !secret || !chain) return null;
  const live = env('NAVERPAY_MODE') === 'production';
  return { id, secret, chain, mode: live ? 'live' : 'test', sdkMode: live ? 'production' : 'development',
           base: (env('NAVERPAY_API_BASE') || NP_BASE[live ? 'live' : 'test']).replace(/\/+$/, '') };
}
const tossMode = () => (/^live_/.test(env('TOSS_SECRET_KEY')) ? 'live' : 'test');

/** 보일 결제사 — PAY_PROVIDERS 순서대로, 키가 들어온 것만. 비우면 카카오만(토스 · 네이버 단추는 숨는다). */
function providers() {
  const want = (process.env.PAY_PROVIDERS || 'kakao').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const out = [];
  for (const id of want) {
    if (out.some((p) => p.id === id)) continue;
    if (id === 'kakao') { const k = kConf(); if (k) out.push({ id: 'kakao', mode: k.mode }); }
    if (id === 'naver') { const n = nConf(); if (n) out.push({ id: 'naver', mode: n.mode }); }
    if (id === 'toss' && READY()) out.push({ id: 'toss', mode: tossMode() });
  }
  return out;
}
const tossOn = () => providers().some((p) => p.id === 'toss');

/** 시험 모드 결제를 이 사람에게 열지 않는가 — 돈이 안 빠진 「결제완료」로 유료 본문이 열리면 안 된다.
 *  super 계정(사장님 확인용)이거나 PAY_TEST_OPEN=1 이면 연다. 카카오 · 네이버 · 토스가 같은 문을 쓴다. */
async function 시험막힘(mode, token) {
  return mode === 'test' && env('PAY_TEST_OPEN') !== '1' && !(await isSuper(token));
}

/** 네이버페이 한 번 부르기. 던지지 않는다. 승인 · 취소는 오래 걸릴 수 있어(문서: 60초) 55초에서 끊는다 — 끊기면 { net:true }(모름). */
async function naver(path, params, idem) {
  const n = nConf();
  if (!n) return { net: false, ok: false, status: 0, j: {} };
  const ac = new AbortController();
  const 끊기 = setTimeout(() => ac.abort(), 55000);
  let r, j = {};
  try {
    r = await fetch(n.base + NP_PATH[path], {
      method: 'POST', signal: ac.signal,
      headers: { 'X-Naver-Client-Id': n.id, 'X-Naver-Client-Secret': n.secret, 'X-NaverPay-Chain-Id': n.chain,
                 'X-NaverPay-Idempotency-Key': String(idem).slice(0, 64),
                 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString(),
    });
    j = await r.json().catch(() => ({}));
  } catch (_) { return { net: true, ok: false, status: 0, j: {} }; }
  finally { clearTimeout(끊기); }
  return { net: false, ok: r.ok, status: r.status, j: j || {} };
}
const nCode = (j) => String((j && j.code) || '');
const nMsg = (j) => String((j && j.message) || '');

/** 주문을 열고(출산택일이면 신청서까지 붙여) 돌려준다 — 카카오 kopen 과 같은 몸통(네이버 nopen 이 쓴다). */
async function 주문열기(product, body, token) {
  const 신청서 = product === 'taekil' && body.intake && typeof body.intake === 'object' && !Array.isArray(body.intake) ? body.intake : null;
  if (product === 'taekil' && !신청서 && env('TAEKIL_AUTO') === '1') return { ok: false, status: 400, json: { ok: false, reason: 'no_intake' } };
  if (신청서 && JSON.stringify(신청서).length > 8000) return { ok: false, status: 400, json: { ok: false, reason: 'no_intake' } };
  const o = await rpc('order_open', { p_product: product, p_note: body.note ? String(body.note).slice(0, 500) : null }, token);
  if (!o || !o.ok) return { ok: false, status: 400, json: o || { ok: false, reason: 'db' } };
  if (신청서) {
    const it = await rpc('order_intake', { p_order: o.orderId, p_intake: 신청서 }, token).catch(() => ({ ok: false, reason: 'db' }));
    if (!(it && (it.ok || it.reason === 'already'))) {
      await rpc('order_failed', { p_order: o.orderId, p_code: 'NO_INTAKE',
                                  p_message: String((it && it.reason) || 'db').slice(0, 60) }, token).catch(() => {});
      return { ok: false, status: 400, json: { ok: false, reason: 'no_intake' } };
    }
  }
  return { ok: true, o };
}

/** 카카오페이 한 번 부르기. 던지지 않는다 — 네트워크가 끊기면 { net:true }. */
async function kakao(path, body) {
  const k = kConf();
  if (!k) return { net: false, ok: false, status: 0, j: {} };
  let r, j = {};
  try {
    r = await fetch(KP_BASE + KP_PATH[path], {
      method: 'POST',
      headers: { authorization: KP_AUTH(k.key), 'content-type': 'application/json' },
      body: JSON.stringify({ cid: k.cid, ...body }),
    });
    j = await r.json().catch(() => ({}));
  } catch (_) { return { net: true, ok: false, status: 0, j: {} }; }
  return { net: false, ok: r.ok, status: r.status, j: j || {} };
}
// 응답의 금액(amount.total). 모양이 다르면 null — 모르는 것은 「다르다」로 치지 않는다(아래 kconfirm 주석).
const kAmount = (j) => (j && j.amount && Number.isFinite(j.amount.total) ? j.amount.total : null);
const kErr = (j) => String((j && (j.error_message || j.msg || j.message)) || '');
const kCode = (j) => (j && j.error_code != null ? String(j.error_code) : null);

/** JWT 의 sub(계정 id). 이 토큰은 바로 앞의 order_open 이 Supabase 에서 검증했다. */
function jwtSub(token) {
  try { return JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8')).sub || null; }
  catch (_) { return null; }
}

const returnBase = () => (env('PAY_RETURN_BASE') || 'https://chaeksa.kr').replace(/\/+$/, '');

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
    const pv = providers();
    return res.status(200).json({
      ok: true,
      ready: pv.length > 0,                              // 결제사가 하나라도 있어야 결제 단추가 뜬다
      providers: pv,                                     // [{id:'kakao', mode:'test'}, …] — 이 순서로 단추를 그린다
      testOpen: env('PAY_TEST_OPEN') === '1',            // 시험 모드를 손님에게도 연 날 — 화면(pay.js 곧열림)이 값 단추를 그대로 둔다
      clientKey: tossOn() ? env('TOSS_CLIENT_KEY') || null : null,   // 토스를 안 보일 때는 내리지 않는다
      products,
      dbError: dbErr,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'method' });
  if (!originOk) return res.status(403).json({ ok: false, reason: 'origin' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};
  const action = String(body.action || '');

  // 10-03 「카카오페이가 잘 안되네」 — 막힌 POST 가 왜 막혔는지 서버에 남는 것이 없었다(Vercel 기록엔 400 숫자뿐).
  // 막힌 답마다 한 줄: 무엇을(action) · 상품 · 상태 · 이유 · 결제사 코드 · 결제사 말. 주문번호 · 토큰 · 생년월일 · 신청서는 남기지 않는다.
  {
    const 원상태 = res.status.bind(res), 원json = res.json.bind(res);
    let 코드 = 200;
    res.status = (c) => { 코드 = c; return 원상태(c); };
    res.json = (j) => {
      if (j && j.ok === false) {
        try { console.log('[pay막힘] ' + JSON.stringify({ action, product: body.product || null, status: 코드, reason: j.reason || null, pg: j.code || null, msg: String(j.message || '').slice(0, 120) })); } catch (_) {}
      } else {
        // 된 것도 한 줄 — 시험 결제를 단계마다 따라가려고(열림 → 승인 → 환불). 금액 · 시험/운영 · 이미 된 것인지만.
        try { console.log('[pay됨] ' + JSON.stringify({ action, product: body.product || (j && j.product) || null, status: 코드, amount: (j && j.amount) || null, mode: (j && j.payMode) || null, already: !!(j && j.already) })); } catch (_) {}
      }
      return 원json(j);
    };
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  // kconfirm · kfail 은 로그인 없이도 받는다 — 카카오톡에서 결제한 뒤 로그인 안 된 브라우저로 돌아올 수 있다.
  // 승인에 필요한 것은 (a) DB 에만 있는 tid (b) 결제한 사람만 받는 pg_token (c) 서버 열쇠라, 세션이 없어도 안전하다.
  // nconfirm · nfail 도 같다 — 승인에는 결제한 사람만 받는 paymentId 와 서버 열쇠가 필요하고, 응답의 주문번호 · 금액을 DB 와 맞춘다.
  const 로그인없이 = action === 'kconfirm' || action === 'kfail' || action === 'nconfirm' || action === 'nfail';
  if (!token && !로그인없이) return res.status(401).json({ ok: false, reason: 'unauthenticated' });

  try {
    // ════ 카카오페이 ════════════════════════════════════════════════

    // ── K1. 주문을 열고 카카오 결제창 주소를 받는다 ──
    if (action === 'kopen') {
      const k = kConf();
      if (!k || !providers().some((p) => p.id === 'kakao')) return res.status(503).json({ ok: false, reason: 'not_ready' });
      if (!env('PAY_HOOK_SECRET')) return res.status(503).json({ ok: false, reason: 'not_ready' });   // 열쇠 없이는 결제완료를 못 적는다
      // 시험 모드는 손님에게 열지 않는다 — 돈이 안 빠진 「결제완료」로 유료 본문이 열리면 안 된다.
      // super 계정(사장님 확인용)이거나 PAY_TEST_OPEN=1 일 때만 연다.
      if (k.mode === 'test' && env('PAY_TEST_OPEN') !== '1' && !(await isSuper(token))) {
        return res.status(403).json({ ok: false, reason: 'test_only' });
      }

      const product = String(body.product || '');
      // 출산택일 신청서(10-02 자동 보고서 설계서 2-2 · ⑤) — 화면이 「원문 + 읽은 값」을 body.intake 로 보낸다.
      // 결제창을 열기 **전에** 이 주문에 붙인다. 카카오톡에서 결제하고 로그인 안 된 브라우저로 돌아와도(kconfirm 은 로그인 없이 승인)
      // 신청서는 이미 주문에 있다. order_intake(migrate-25)는 열린(open) 주문도 받고 한 번만 붙인다(already).
      // TAEKIL_AUTO=1(자동 보고서를 켠 날)이면 택일 주문은 신청서가 꼭 있어야 연다 — 신청서 없는 결제를 만들지 않는다.
      const 신청서 = product === 'taekil' && body.intake && typeof body.intake === 'object' && !Array.isArray(body.intake) ? body.intake : null;
      if (product === 'taekil' && !신청서 && env('TAEKIL_AUTO') === '1') return res.status(400).json({ ok: false, reason: 'no_intake' });
      if (신청서 && JSON.stringify(신청서).length > 8000) return res.status(400).json({ ok: false, reason: 'no_intake' });
      const o = await rpc('order_open', {
        p_product: product,
        p_note: body.note ? String(body.note).slice(0, 500) : null,
      }, token);
      if (!o || !o.ok) return res.status(400).json(o || { ok: false, reason: 'db' });
      if (신청서) {
        const it = await rpc('order_intake', { p_order: o.orderId, p_intake: 신청서 }, token).catch(() => ({ ok: false, reason: 'db' }));
        if (!(it && (it.ok || it.reason === 'already'))) {
          // 붙이지 못했다 — 주문을 실패로 닫고(아직 결제사가 안 붙은 열린 주문이라 order_failed 가 닫는다) 결제창을 열지 않는다.
          await rpc('order_failed', { p_order: o.orderId, p_code: 'NO_INTAKE',
                                      p_message: String((it && it.reason) || 'db').slice(0, 60) }, token).catch(() => {});
          return res.status(400).json({ ok: false, reason: 'no_intake' });
        }
      }

      const uid = jwtSub(token);
      if (!uid) return res.status(401).json({ ok: false, reason: 'unauthenticated' });
      // 돌아올 주소에는 주문번호 · pv · why 만 싣는다. **생년월일 · 신청서는 절대 싣지 않는다.**
      const base = returnBase(), oid = encodeURIComponent(o.orderId);
      const kr = await kakao('ready', {
        partner_order_id: o.orderId,             // ck_<상품>_YYYYMMDDHHMMSS_xxxxxxxx — 100자 한도 안
        partner_user_id: uid,                    // approve 때 같은 값이어야 한다(DB orders.user_id 와 같다)
        item_name: String(o.name || '').slice(0, 100),
        item_code: product,
        quantity: 1,
        total_amount: o.amount,                  // DB 가 정한 값. 브라우저가 준 값이 아니다
        tax_free_amount: 0,                      // 부가세 포함가 — vat_amount 는 안 보낸다(카카오가 셈한다)
        approval_url: `${base}/pay-done.html?pv=kakao&orderId=${oid}`,
        cancel_url: `${base}/pay-fail.html?pv=kakao&why=cancel&orderId=${oid}`,
        fail_url: `${base}/pay-fail.html?pv=kakao&why=fail&orderId=${oid}`,
      });
      const tid = kr.ok && kr.j && kr.j.tid ? String(kr.j.tid) : '';
      if (!tid) {
        await rpc('order_failed', { p_order: o.orderId, p_code: 'KAKAO_READY',
                                    p_message: kErr(kr.j) || (kr.net ? 'NETWORK' : String(kr.status)) }, token).catch(() => {});
        return res.status(400).json({ ok: false, reason: 'kakao', code: kCode(kr.j),
                                      message: kErr(kr.j) || '카카오페이 결제창을 열지 못했습니다.' });
      }
      // tid 는 DB 에만 둔다. 이게 실패하면 승인할 길이 없으니 결제창을 열지 않는다(그 tid 는 저절로 죽는다).
      const put = await srvUser('order_pg_ready', { p_order: o.orderId, p_provider: 'kakao', p_tid: tid }, token)
        .catch(() => ({ ok: false, reason: 'db' }));
      if (!put || !put.ok) return res.status(400).json({ ok: false, reason: (put && put.reason) || 'db' });

      return res.status(200).json({
        ok: true, orderId: o.orderId, amount: o.amount, name: o.name,
        pc: kr.j.next_redirect_pc_url || null,
        mobile: kr.j.next_redirect_mobile_url || kr.j.next_redirect_pc_url || null,
      });
    }

    // ── K2. 승인 ──
    if (action === 'kconfirm') {
      const k = kConf();
      if (!k) return res.status(503).json({ ok: false, reason: 'not_ready' });
      const orderId = String(body.orderId || '').slice(0, 64);
      const pgToken = String(body.pgToken || '').slice(0, 200);
      if (!orderId || !pgToken) return res.status(400).json({ ok: false, reason: 'bad_request' });

      const o = await srv('order_pg_get', { p_order: orderId }).catch(() => ({ ok: false, reason: 'db' }));
      if (!o || !o.ok) return res.status(400).json(o || { ok: false, reason: 'db' });
      if (o.status === 'paid') {
        // 착지 페이지 새로고침. 이미 낸 것이므로 성공으로 답하고 카카오를 다시 부르지 않는다.
        return res.status(200).json({ ok: true, already: true, name: o.name, amount: o.amount, receipt: null,
                                      payMode: o.pay_mode || null });
      }
      if (o.provider !== 'kakao' || !o.tid) {
        return res.status(400).json(o.status === 'open' ? { ok: false, reason: 'bad_request' }
                                                        : { ok: false, reason: 'closed', status: o.status });
      }

      // 성공 경로 — 승인 응답이든 조회 응답이든 여기로 모인다.
      const 끝 = async (j) => {
        const saved = await srv('order_pg_paid', {
          p_order: orderId, p_tid: o.tid,
          p_aid: j.aid ? String(j.aid) : null,
          p_method: j.payment_method_type ? String(j.payment_method_type) : null,
          p_mode: k.mode,                          // 결제 순간에 시험/운영을 함께 적는다(migrate-26 pay_mode)
        }).catch(() => ({ ok: false, reason: 'save_failed' }));
        const ok = !!(saved && saved.ok);
        if (!ok) {
          // 돈은 빠졌는데 우리 기록이 안 됐다. 사장님이 찾아 맞출 수 있게 주문에 SAVE_FAILED 를 남긴다
          // (status 는 그대로 — 새로고침하면 approve 실패 → 주문 조회 SUCCESS_PAYMENT → 여기로 다시 와서 기록한다).
          await srv('order_pg_note', { p_order: orderId, p_tid: o.tid, p_code: 'SAVE_FAILED',
            p_message: `카카오 승인됨 · 기록 실패(${(saved && saved.reason) || 'save_failed'}) · aid ${j.aid || '-'}` })
            .catch(() => {});
        }
        return res.status(200).json({
          ok: true, saved: ok, name: o.name, amount: o.amount,
          payMode: o.pay_mode || k.mode,
          method: j.payment_method_type || null, approvedAt: j.approved_at || null, receipt: null,
          saveWarning: ok ? null : 'SAVE_FAILED',
        });
      };
      // 있어서는 안 되는 일: 돈이 빠졌는데 금액 · 주문이 다르다 → 곧바로 돌려주고 사람이 볼 자리로 남긴다.
      const 어긋남 = async (j, 금액) => {
        const c = await kakao('cancel', { tid: o.tid, cancel_amount: 금액, cancel_tax_free_amount: 0 });
        const code = c.ok ? 'AMOUNT_MISMATCH' : 'AMOUNT_MISMATCH_UNCANCELED';
        const msg = `카카오 ${금액} · 주문 ${o.amount}`;
        await srv('order_pg_failed', { p_order: orderId, p_code: code, p_message: msg }).catch(() => {});
        // 이미 failed 였던 주문(되살리기 경로)은 order_pg_failed 가 안 건드리므로 코드를 따로 적는다.
        await srv('order_pg_note', { p_order: orderId, p_tid: o.tid, p_code: code, p_message: msg }).catch(() => {});
        return res.status(400).json({ ok: false, reason: 'amount_mismatch', expected: o.amount });
      };
      // 금액 대조. ready 를 서버가 DB 금액으로 불렀고 tid 는 브라우저가 모르므로 금액은 구조로 이미 지켜진다.
      // 응답에서 금액을 못 읽으면(모양이 문서와 다르면) 「다르다」로 치지 않는다 — 치면 정상 결제를 전부 취소한다.
      const 맞나 = (j) => {
        const a = kAmount(j);
        if (a != null && a !== o.amount) return { bad: true, a };
        if (j.partner_order_id && String(j.partner_order_id) !== orderId) return { bad: true, a: a != null ? a : o.amount };
        if (j.tid && String(j.tid) !== o.tid) return { bad: true, a: a != null ? a : o.amount };
        return { bad: false };
      };
      const 조회 = async () => {
        const q = await kakao('order', { tid: o.tid });
        return { q, st: q.ok && q.j ? String(q.j.status || '') : '' };
      };
      const 답없음 = (q) => !q.ok && (q.net || q.status >= 500 || q.status === 0);
      const 늦음 = () => res.status(502).json({ ok: false, reason: 'unverified', code: null,
        message: '결제 확인이 늦어지고 있습니다. 돈이 빠졌다면 문의해 주세요. 확인해서 열어 드립니다.' });

      // 실패로 닫힌 카카오 주문 — 잘못 닫혔을 수 있다(kfail · 토스 fail 경로 · 옛 만료 닫기).
      // 카카오 주문 조회가 SUCCESS_PAYMENT 이고 금액이 맞으면 결제완료로 적는다. 금액 불일치로 닫은 주문은 되살리지 않는다.
      if (o.status === 'failed') {
        if (/^AMOUNT_MISMATCH/.test(String(o.fail_code || ''))) {
          return res.status(400).json({ ok: false, reason: 'closed', status: o.status });
        }
        const { q, st } = await 조회();
        if (st === KP_PAID) {
          const m = 맞나(q.j);
          return m.bad ? 어긋남(q.j, m.a) : 끝(q.j);
        }
        if (답없음(q)) return 늦음();
        return res.status(400).json({ ok: false, reason: 'closed', status: o.status });
      }
      if (o.status !== 'open') return res.status(400).json({ ok: false, reason: 'closed', status: o.status });

      const ar = await kakao('approve', {
        tid: o.tid, partner_order_id: orderId, partner_user_id: o.user_id, pg_token: pgToken,
      });
      if (ar.ok && ar.j && ar.j.aid) {
        const m = 맞나(ar.j);
        return m.bad ? 어긋남(ar.j, m.a) : 끝(ar.j);
      }

      // 승인 실패를 곧바로 「결제 실패」로 적지 않는다 — 이미 승인된 중복 호출(새로고침 · 재시도)이나
      // 응답 유실일 수 있다. 그걸 실패로 적으면 **돈은 빠졌는데 상품은 안 열린다.** 적기 전에 주문 조회로 묻는다.
      const { q, st } = await 조회();
      if (st === KP_PAID) {
        const m = 맞나(q.j);
        return m.bad ? 어긋남(q.j, m.a) : 끝(q.j);
      }
      // 승인도 조회도 답이 없다. 주문을 open 그대로 두고 확인 중이라고만 말한다.
      if (답없음(q)) return 늦음();
      if (!st || !KP_DEAD.includes(st)) {
        // 카카오가 끝났다고 말하지 않았다(모르는 상태 이름 · 조회 주소 미확인). 실패로 적지 않고 open 으로 둔다.
        return res.status(400).json({ ok: false, reason: 'kakao', code: kCode(ar.j),
                                      message: kErr(ar.j) || '결제 승인에 실패했습니다.' });
      }
      await srv('order_pg_failed', { p_order: orderId, p_code: kCode(ar.j) || st,
                                     p_message: kErr(ar.j) || st }).catch(() => {});
      return res.status(400).json({ ok: false, reason: 'kakao', code: kCode(ar.j) || st,
                                    message: kErr(ar.j) || '결제 승인에 실패했습니다.' });
    }

    // ── K3. 결제창에서 그만뒀다 / 실패했다 ──
    // 남의 주문번호를 알아도 결제된 · 결제 중인 주문은 닫을 수 없다 — **늘** 카카오에 묻고,
    // 「끝났고 안 빠졌다」(KP_DEAD)고 할 때만 닫는다. 시간이 지났다는 것만으로는 닫지 않는다.
    if (action === 'kfail') {
      const orderId = String(body.orderId || '').slice(0, 64);
      const why = body.why === 'cancel' ? 'USER_CANCEL' : 'KAKAO_FAIL';
      if (!orderId) return res.status(400).json({ ok: false, reason: 'bad_request' });
      const o = await srv('order_pg_get', { p_order: orderId }).catch(() => null);
      if (!o || !o.ok || o.status !== 'open' || o.provider !== 'kakao' || !o.tid) return res.status(200).json({ ok: true, kept: true });
      const q = await kakao('order', { tid: o.tid });
      const st = q.ok && q.j ? String(q.j.status || '') : '';
      if (!KP_DEAD.includes(st)) return res.status(200).json({ ok: true, kept: true });
      await srv('order_pg_failed', { p_order: orderId, p_code: why, p_message: st }).catch(() => {});
      return res.status(200).json({ ok: true });
    }

    // ── K4. 환불(사장님 전용) ──
    // super 계정 토큰만. 카카오에 전액 취소를 부르고, 된 뒤에만 주문을 canceled 로 적는다.
    // (카카오페이 가맹점 관리자 화면에서 직접 환불했으면 migrate-33 머리의 SQL 한 줄로 적는다.)
    if (action === 'krefund') {
      if (!(await isSuper(token))) return res.status(403).json({ ok: false, reason: 'forbidden' });
      const k = kConf();
      if (!k) return res.status(503).json({ ok: false, reason: 'not_ready' });
      const orderId = String(body.orderId || '').slice(0, 64);
      if (!orderId) return res.status(400).json({ ok: false, reason: 'bad_request' });
      const o = await srv('order_pg_get', { p_order: orderId }).catch(() => ({ ok: false, reason: 'db' }));
      if (!o || !o.ok) return res.status(400).json(o || { ok: false, reason: 'db' });
      if (o.provider !== 'kakao' || !o.tid) return res.status(400).json({ ok: false, reason: 'bad_request' });
      if (o.status !== 'paid') return res.status(400).json({ ok: false, reason: 'closed', status: o.status });
      const c = await kakao('cancel', { tid: o.tid, cancel_amount: o.amount, cancel_tax_free_amount: 0 });
      if (!c.ok) {
        return res.status(c.net ? 502 : 400).json({ ok: false, reason: 'kakao', code: kCode(c.j),
          message: kErr(c.j) || (c.net ? '카카오페이에 닿지 못했습니다.' : '환불에 실패했습니다.') });
      }
      const saved = await srv('order_pg_canceled', { p_order: orderId, p_tid: o.tid })
        .catch(() => ({ ok: false, reason: 'save_failed' }));
      return res.status(200).json({ ok: true, orderId, amount: o.amount, saved: !!(saved && saved.ok),
        // 돈은 돌려줬는데 기록이 안 됐으면 migrate-33 머리의 수동 SQL 로 적는다.
        saveWarning: saved && saved.ok ? null : (saved && saved.reason) || 'save_failed' });
    }

    // ════ 네이버페이 (PAY_PROVIDERS 에 naver 가 있고 키 셋이 들어왔을 때만) ═══════════

    // ── N1. 주문을 열고 결제창에 넘길 값을 준다 ──
    if (action === 'nopen') {
      const n = nConf();
      if (!n || !providers().some((p) => p.id === 'naver')) return res.status(503).json({ ok: false, reason: 'not_ready' });
      if (!env('PAY_HOOK_SECRET')) return res.status(503).json({ ok: false, reason: 'not_ready' });
      if (await 시험막힘(n.mode, token)) return res.status(403).json({ ok: false, reason: 'test_only' });
      const product = String(body.product || '');
      const op = await 주문열기(product, body, token);
      if (!op.ok) return res.status(op.status).json(op.json);
      const o = op.o;
      const uid = jwtSub(token);
      if (!uid) return res.status(401).json({ ok: false, reason: 'unauthenticated' });
      const put = await srvUser('order_pg_ready', { p_order: o.orderId, p_provider: 'naver', p_tid: NP_TID(o.orderId) }, token)
        .catch(() => ({ ok: false, reason: 'db' }));
      if (!put || !put.ok) return res.status(400).json({ ok: false, reason: (put && put.reason) || 'db' });
      // 돌아올 주소에는 주문번호 · pv 만 싣는다. **생년월일 · 신청서는 절대 싣지 않는다.**
      // 사용자 키 — 계정 id 를 그대로 주지 않는다(네이버 문서: 개인 식별 불가한 값). 서버 열쇠를 섞은 해시 앞 40자.
      return res.status(200).json({
        ok: true, orderId: o.orderId, amount: o.amount, name: o.name, product,
        naver: { clientId: n.id, chainId: n.chain, mode: n.sdkMode },
        userKey: crypto.createHash('sha256').update(uid + '|' + env('PAY_HOOK_SECRET')).digest('hex').slice(0, 40),
        returnUrl: `${returnBase()}/pay-done.html?pv=naver&orderId=${encodeURIComponent(o.orderId)}`,
      });
    }

    // ── N2. 승인 — 여기서 돈이 빠진다 ──
    if (action === 'nconfirm') {
      const n = nConf();
      if (!n) return res.status(503).json({ ok: false, reason: 'not_ready' });
      const orderId = String(body.orderId || '').slice(0, 64);
      const paymentId = String(body.paymentId || '').slice(0, 50);
      if (!orderId || !/^[A-Za-z0-9_-]{4,50}$/.test(paymentId)) return res.status(400).json({ ok: false, reason: 'bad_request' });
      const o = await srv('order_pg_get', { p_order: orderId }).catch(() => ({ ok: false, reason: 'db' }));
      if (!o || !o.ok) return res.status(400).json(o || { ok: false, reason: 'db' });
      if (o.status === 'paid') {
        // 착지 페이지 새로고침. 같은 결제번호면 성공으로 답하고 네이버를 다시 부르지 않는다.
        if (o.aid && o.aid !== paymentId) return res.status(400).json({ ok: false, reason: 'closed', status: o.status });
        return res.status(200).json({ ok: true, already: true, name: o.name, amount: o.amount, receipt: null, payMode: o.pay_mode || null });
      }
      if (o.provider !== 'naver' || o.tid !== NP_TID(orderId)) {
        return res.status(400).json(o.status === 'open' ? { ok: false, reason: 'bad_request' } : { ok: false, reason: 'closed', status: o.status });
      }
      if (o.status !== 'open') return res.status(400).json({ ok: false, reason: 'closed', status: o.status });
      const 늦음 = (msg) => res.status(502).json({ ok: false, reason: 'unverified', code: null,
        message: msg || '결제 확인이 늦어지고 있습니다. 잠시 뒤 이 화면을 새로고침해 주세요. 돈이 빠졌다면 문의해 주세요. 확인해서 열어 드립니다.' });

      const ar = await naver('apply', { paymentId }, 'ap_' + paymentId);
      if (ar.net || ar.status === 0 || ar.status >= 500) return 늦음();
      const code = nCode(ar.j), d = ar.j && ar.j.body && ar.j.body.detail;
      if (code === 'Success' && d) {
        const 금액 = Number(d.totalPayAmount);
        const 어긋남 = String(d.merchantPayKey || '') !== orderId || 금액 !== o.amount
          || (d.paymentId && String(d.paymentId) !== paymentId) || (d.admissionState && d.admissionState !== 'SUCCESS');
        if (어긋남) {
          // 있어서는 안 되는 일(브라우저가 금액 · 주문번호를 바꿨다) — 곧바로 전액 돌려주고 사람이 볼 자리로 남긴다.
          const c = await naver('cancel', { paymentId, cancelAmount: Number.isFinite(금액) ? 금액 : 0, cancelReason: 'AMOUNT_MISMATCH',
            cancelRequester: '2', taxScopeAmount: Number(d.taxScopeAmount) || 0, taxExScopeAmount: Number(d.taxExScopeAmount) || 0 }, 'cx_' + paymentId);
          const 돌려줌 = ['Success', 'CancelNotComplete', 'AlreadyCanceled'].includes(nCode(c.j));
          const fc = 돌려줌 ? 'AMOUNT_MISMATCH' : 'AMOUNT_MISMATCH_UNCANCELED', msg = `네이버 ${금액} · 주문 ${o.amount} · ${paymentId}`;
          await srv('order_pg_failed', { p_order: orderId, p_code: fc, p_message: msg }).catch(() => {});
          await srv('order_pg_note', { p_order: orderId, p_tid: o.tid, p_code: fc, p_message: msg }).catch(() => {});
          return res.status(400).json({ ok: false, reason: 'amount_mismatch', expected: o.amount });
        }
        const saved = await srv('order_pg_paid', {
          p_order: orderId, p_tid: o.tid, p_aid: paymentId,
          p_method: d.primaryPayMeans ? String(d.primaryPayMeans) : (Number(d.npointPayAmount) > 0 ? 'NPOINT' : null),
          p_mode: n.mode,
        }).catch(() => ({ ok: false, reason: 'save_failed' }));
        const ok = !!(saved && saved.ok);
        if (!ok) {
          // 돈은 빠졌는데 기록이 안 됐다. 새로고침하면 같은 멱등 열쇠로 같은 답이 와서 다시 적는다.
          await srv('order_pg_note', { p_order: orderId, p_tid: o.tid, p_code: 'SAVE_FAILED',
            p_message: `네이버 승인됨 · 기록 실패(${(saved && saved.reason) || 'save_failed'}) · ${paymentId}` }).catch(() => {});
        }
        return res.status(200).json({ ok: true, saved: ok, name: o.name, amount: o.amount, payMode: n.mode,
          method: d.primaryPayMeans || null, approvedAt: d.admissionYmdt || null, receipt: null,
          saveWarning: ok ? null : 'SAVE_FAILED' });
      }
      // 「아직 모른다」 — 진행 중 · 점검 · 이미 완료(다른 열쇠로 승인된 것)는 닫지 않는다. 이미 완료는 사장님이 볼 자리로 남긴다.
      if (!code || NP_PENDING.includes(code)) {
        if (code === 'AlreadyComplete') {
          await srv('order_pg_note', { p_order: orderId, p_tid: o.tid, p_code: 'NAVER_ALREADY_COMPLETE',
            p_message: `네이버 「이미 결제 완료」 · ${paymentId} — 네이버페이 센터에서 확인 후 맞출 것` }).catch(() => {});
        }
        return 늦음(code === 'MaintenanceOngoing' || code === 'FaultCheckOngoing'
          ? '네이버페이 점검 중이라 결제를 마치지 못했습니다. 돈은 빠지지 않았습니다. 잠시 뒤 다시 시도해 주세요.' : null);
      }
      // 네이버가 결제가 안 됐다고 확답했다(Fail · TimeExpired · OwnerAuthFail · 잔고 부족 등) — 돈은 안 빠졌다.
      await srv('order_pg_failed', { p_order: orderId, p_code: code, p_message: nMsg(ar.j) || code }).catch(() => {});
      return res.status(400).json({ ok: false, reason: 'naver', code, message: nMsg(ar.j) || '결제 승인에 실패했습니다.' });
    }

    // ── N3. 결제창에서 그만뒀다 / 실패했다 — 승인을 안 불렀으니 돈은 안 빠졌다. 열린 네이버 주문만 닫는다. ──
    if (action === 'nfail') {
      const orderId = String(body.orderId || '').slice(0, 64);
      if (!orderId) return res.status(400).json({ ok: false, reason: 'bad_request' });
      const o = await srv('order_pg_get', { p_order: orderId }).catch(() => null);
      if (!o || !o.ok || o.status !== 'open' || o.provider !== 'naver') return res.status(200).json({ ok: true, kept: true });
      const rc = String(body.code || '').replace(/[^A-Za-z]/g, '').slice(0, 40);
      await srv('order_pg_failed', { p_order: orderId, p_code: rc === 'UserCancel' ? 'USER_CANCEL' : ('NAVER_' + (rc || 'FAIL')),
                                     p_message: String(body.message || '').slice(0, 200) }).catch(() => {});
      return res.status(200).json({ ok: true });
    }

    // ── N4. 환불(사장님 전용) — 네이버 전액 취소가 된 뒤에만 주문을 canceled 로 적는다 ──
    if (action === 'nrefund') {
      if (!(await isSuper(token))) return res.status(403).json({ ok: false, reason: 'forbidden' });
      if (!nConf()) return res.status(503).json({ ok: false, reason: 'not_ready' });
      const orderId = String(body.orderId || '').slice(0, 64);
      if (!orderId) return res.status(400).json({ ok: false, reason: 'bad_request' });
      const o = await srv('order_pg_get', { p_order: orderId }).catch(() => ({ ok: false, reason: 'db' }));
      if (!o || !o.ok) return res.status(400).json(o || { ok: false, reason: 'db' });
      if (o.provider !== 'naver' || !o.aid) return res.status(400).json({ ok: false, reason: 'bad_request' });
      if (o.status !== 'paid') return res.status(400).json({ ok: false, reason: 'closed', status: o.status });
      const c = await naver('cancel', { paymentId: o.aid, cancelAmount: o.amount, cancelReason: '가맹점 환불',
        cancelRequester: '2', taxScopeAmount: o.amount, taxExScopeAmount: 0, doCompareRest: 1, expectedRestAmount: 0 }, 'cx_' + o.aid);
      const cc = nCode(c.j);
      if (!['Success', 'CancelNotComplete', 'AlreadyCanceled'].includes(cc)) {
        return res.status(c.net ? 502 : 400).json({ ok: false, reason: 'naver', code: cc || null,
          message: nMsg(c.j) || (c.net ? '네이버페이에 닿지 못했습니다.' : '환불에 실패했습니다.') });
      }
      const saved = await srv('order_pg_canceled', { p_order: orderId, p_tid: o.tid }).catch(() => ({ ok: false, reason: 'save_failed' }));
      return res.status(200).json({ ok: true, orderId, amount: o.amount, saved: !!(saved && saved.ok), code: cc,
        saveWarning: saved && saved.ok ? null : (saved && saved.reason) || 'save_failed' });
    }

    // ════ 토스페이먼츠 (PAY_PROVIDERS 에 toss 가 있을 때만) ═══════════════

    // ── 1. 주문을 연다 ──
    if (action === 'open') {
      if (!READY() || !tossOn()) return res.status(503).json({ ok: false, reason: 'not_ready' });
      if (await 시험막힘(tossMode(), token)) return res.status(403).json({ ok: false, reason: 'test_only' });
      const out = await rpc('order_open', {
        p_product: String(body.product || ''),
        p_note: body.note ? String(body.note).slice(0, 500) : null,
      }, token);
      return res.status(out && out.ok ? 200 : 400).json(out);
    }

    // ── 4. 결제창에서 실패했다 ──
    // 토스가 꺼져 있으면 받지 않는다(open · confirm 과 같은 문) — 카카오 주문을 토스 실패 길로 닫지 못하게.
    if (action === 'fail') {
      if (!READY() || !tossOn()) return res.status(503).json({ ok: false, reason: 'not_ready' });
      const out = await rpc('order_failed', {
        p_order: String(body.orderId || ''),
        p_code: body.code ? String(body.code).slice(0, 60) : null,
        p_message: body.message ? String(body.message).slice(0, 300) : null,
      }, token);
      return res.status(200).json(out);
    }

    // ── 3. 승인 ──
    // 토스가 꺼져 있으면(PAY_PROVIDERS 에 toss 가 없으면) 승인도 받지 않는다 — 남은 시험 키로 토스 시험 결제를
    // 만들어 카카오 · 연애 주문(order_check 는 결제사를 안 가린다)을 「결제완료」로 만드는 뒷문을 닫는다.
    if (action === 'confirm') {
      const secret = env('TOSS_SECRET_KEY');
      if (!secret || !tossOn()) return res.status(503).json({ ok: false, reason: 'not_ready' });
      // 10-03 시험 키면 승인도 super · PAY_TEST_OPEN 만 — order_open 은 브라우저가 직접 부를 수 있어(기본 결제사 toss)
      // open 만 막으면 직접 연 주문을 시험 카드로 「결제완료」로 만드는 뒷문이 남는다.
      if (await 시험막힘(tossMode(), token)) return res.status(403).json({ ok: false, reason: 'test_only' });

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
        // 첫 승인 때 결제 모드를 못 적었으면(migrate-26) 여기서 채운다 — 다만 **지금 키로 토스에 이 결제가 보일 때만**.
        // 시험 키와 운영 키는 서로의 결제를 못 본다. 그래서 시험 때 산 주문이 운영 전환 뒤 새로고침으로 「운영」이 되지 않는다.
        // order_mode 는 모드가 빈 결제완료 주문만 바꾸므로 이미 적힌 주문에는 아무 일도 없다. 무엇이 실패해도 응답은 그대로다.
        try {
          const r = await fetch('https://api.tosspayments.com/v1/payments/' + encodeURIComponent(paymentKey),
            { headers: { authorization: 'Basic ' + Buffer.from(secret + ':').toString('base64') } });
          const p = r.ok ? await r.json().catch(() => null) : null;
          if (p && p.status === 'DONE' && p.orderId === orderId) {
            await rpc('order_mode', { p_order: orderId, p_mode: /^live_/.test(secret) ? 'live' : 'test',
                                     p_server: env('PAY_HOOK_SECRET') || null }, token).catch(() => null);
          }
        } catch (_) {}
        return res.status(200).json({ ok: true, already: true, name: chk.name,
                                      amount: chk.amount, receipt: chk.receipt });
      }
      if (chk.amount !== amount) {
        return res.status(400).json({ ok: false, reason: 'amount_mismatch',
                                      expected: chk.amount });
      }

      const auth = 'Basic ' + Buffer.from(secret + ':').toString('base64');
      let tr = null, tj = {};
      try {
        tr = await fetch(TOSS_CONFIRM, {
          method: 'POST',
          headers: { authorization: auth, 'content-type': 'application/json',
                     // 같은 키로 두 번 부르면 토스가 한 번만 처리한다. 새로고침·재시도 방어.
                     'Idempotency-Key': orderId },
          body: JSON.stringify({ paymentKey, orderId, amount: chk.amount }),
        });
        tj = await tr.json().catch(() => ({}));
      } catch (_) { tr = null; }

      // 승인 실패를 곧바로 「결제 실패」로 적지 않는다(토스 LLM 안내서 §8, 2026-09-11 대조).
      // 응답이 유실되거나(시간초과·5xx) 토스 쪽에서는 이미 승인된 경우가 있다.
      // 그걸 실패로 적으면 **돈은 빠졌는데 상품은 안 열린다.** 적기 전에 결제 조회로 묻는다.
      // 조회 응답 필드(status·orderId·totalAmount)는 토스 API 문서에서 확인한 이름만 쓴다.
      if (!tr || !tr.ok) {
        const tossQuery = async () => {
          try {
            const r = await fetch('https://api.tosspayments.com/v1/payments/' +
                                  encodeURIComponent(paymentKey), { headers: { authorization: auth } });
            if (r.ok) return { known: true, p: await r.json().catch(() => null) };
            return { known: r.status >= 400 && r.status < 500, p: null };  // 4xx 는 확답, 5xx 는 모름
          } catch (_) { return { known: false, p: null }; }
        };
        const q = await tossQuery();
        const p = q.p;
        if (p && p.status === 'DONE' && p.orderId === orderId && p.totalAmount === chk.amount) {
          tj = p;   // 이미 승인된 결제다 — 아래 성공 경로로 그대로 흘려보낸다
        } else if (!q.known) {
          // 승인도 조회도 답이 없다. 이때 실패로 적으면 위의 사고가 난다.
          // 주문을 open 그대로 두고, 사용자에게는 확인 중이라고만 말한다.
          return res.status(502).json({ ok: false, reason: 'unverified', code: null,
            message: '결제 확인이 늦어지고 있습니다. 카드에서 돈이 빠졌다면 문의해 주세요. 확인해서 열어 드립니다.' });
        } else {
          // 토스가 승인 안 됐다고 답했다. 다만 DONE 인데 주문·금액이 다르면 손으로 볼 자리라 코드를 따로 남긴다.
          const mismatch = p && p.status === 'DONE';
          await rpc('order_failed', {
            p_order: orderId,
            p_code: mismatch ? 'DONE_MISMATCH' : String(tj.code || (tr ? tr.status : 'NETWORK')),
            p_message: String(tj.message || (p && p.status) || ''),
          }, token).catch(() => {});
          return res.status(400).json({ ok: false, reason: 'toss',
                                        code: tj.code || null, message: tj.message || '결제 승인에 실패했습니다' });
        }
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

      // 결제 모드(시험/운영)를 주문에 적는다 — 운영 키로 바뀐 뒤에는 운영 결제 주문만 유료 LLM 을 연다(migrate-26).
      // 토스 키는 test_… / live_… 로 시작한다. 함수가 아직 없어도(사장님 SQL 전) 결제 기록은 위에서 끝났으므로 여기 실패는 무시한다.
      // order_paid 의 답이 끊겨 실패로 보여도 DB 에는 들어갔을 수 있으니 결과와 상관없이 부른다(결제완료가 아닌
      // 주문이면 아무것도 안 바꾼다). 빠지면 운영 결제가 시험 주문으로 보여 LLM 을 못 연다 — 한 번만 더 부른다.
      {
        const 모드 = { p_order: orderId, p_mode: /^live_/.test(secret) ? 'live' : 'test', p_server: env('PAY_HOOK_SECRET') || null };
        const m1 = await rpc('order_mode', 모드, token).catch(() => null);
        if (!m1 || !m1.ok) await rpc('order_mode', 모드, token).catch(() => null);
      }

      return res.status(200).json({
        ok: true,
        name: chk.name,
        amount: chk.amount,
        method: tj.method || null,
        approvedAt: tj.approvedAt || null,
        receipt: (tj.receipt && tj.receipt.url) || null,
        payMode: /^live_/.test(secret) ? 'live' : 'test',
        saved: !!(saved && saved.ok),
        saveWarning: saved && saved.ok ? null : (saved && saved.reason) || 'save_failed',
      });
    }

    return res.status(400).json({ ok: false, reason: 'bad_action' });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: 'server',
                                  message: String((e && e.message) || e).slice(0, 120) });
  }
};
