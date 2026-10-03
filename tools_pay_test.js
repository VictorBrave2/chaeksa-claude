// 결제 서버(api/pay.js) 시험 — 진짜 Supabase · 결제사를 부르지 않는다. fetch 를 가짜로 바꿔 주문 표를 메모리에 둔다.
// 10-03 네이버페이 nopen · nconfirm · nfail · nrefund 와 토스 시험 키 문(test_only)을 붙이며 만들었다.
//   node tools_pay_test.js      → 끝에 「통과 N · 실패 0」
'use strict';
const path = require('path');

let 통과 = 0, 실패 = 0;
const 봄 = (이름, 참, 더) => { if (참) 통과++; else { 실패++; console.log('  ✗', 이름, 더 !== undefined ? JSON.stringify(더) : ''); } };

// ── 가짜 세계 ─────────────────────────────────────────────
const 주문 = new Map();          // id → 주문 줄
let 순번 = 0, 네이버답 = [], 네이버부름 = [];
const SUPER = 'tok-super', GUEST = 'tok-guest';
const 토큰 = (sub) => 'x.' + Buffer.from(JSON.stringify({ sub })).toString('base64url') + '.y';
const 사람 = { [토큰('u-super')]: 'super', [토큰('u-guest')]: 'guest' };
const T_SUPER = 토큰('u-super'), T_GUEST = 토큰('u-guest'), T_REVIEW = 토큰('u-review');   // 10-04 결제사 심사관 계정(app_metadata.plan = 'review')
const 등급 = { [T_REVIEW]: 'review' };
const 상품 = { taekil: { name: '출산택일 보고서', amount: 99000 }, love_full: { name: '전체판', amount: 9900 } };
const HOOK = 'hook-secret';

function rpc(name, a, auth) {
  const uid = (() => { try { return JSON.parse(Buffer.from(auth.split('.')[1], 'base64url').toString()).sub; } catch (_) { return null; } })();
  const 열쇠 = a.p_server === HOOK;
  const o = a.p_order ? 주문.get(a.p_order) : null;
  switch (name) {
    case 'ai_plan': return 사람[auth] || 'guest';
    case 'order_open': {
      const p = 상품[a.p_product]; if (!p) return { ok: false, reason: 'no_product' };
      const id = `ck_${a.p_product}_20261003120000_${String(++순번).padStart(8, '0')}`;
      주문.set(id, { id, user_id: uid, product: a.p_product, name: p.name, amount: p.amount, status: 'open', provider: 'toss', pg_tid: null, pg_aid: null });
      return { ok: true, orderId: id, amount: p.amount, name: p.name };
    }
    case 'order_intake': return { ok: true };
    case 'order_failed': if (o && o.user_id === uid && o.status === 'open' && o.provider === 'toss') { o.status = 'failed'; o.fail_code = a.p_code; } return { ok: true };
    case 'order_pg_ready':
      if (!열쇠) return { ok: false, reason: 'forbidden' };
      if (!['kakao', 'naver'].includes(a.p_provider)) return { ok: false, reason: 'bad_request' };
      if (o && o.user_id === uid && o.status === 'open' && !o.pg_tid) { o.provider = a.p_provider; o.pg_tid = a.p_tid; return { ok: true }; }
      return { ok: false, reason: 'no_order' };
    case 'order_pg_get':
      if (!열쇠) return { ok: false, reason: 'forbidden' };
      if (!o) return { ok: false, reason: 'no_order' };
      return { ok: true, status: o.status, amount: o.amount, name: o.name, product: o.product, provider: o.provider, tid: o.pg_tid, aid: o.pg_aid, user_id: o.user_id, pay_mode: o.pay_mode || null, fail_code: o.fail_code || null };
    case 'order_pg_paid':
      if (!열쇠) return { ok: false, reason: 'forbidden' };
      if (o && ['kakao', 'naver'].includes(o.provider) && o.pg_tid === a.p_tid && (['open', 'paid'].includes(o.status) || (o.status === 'failed' && !/^AMOUNT_MISMATCH/.test(o.fail_code || '')))) {
        o.status = 'paid'; o.pg_aid = o.pg_aid || a.p_aid; o.method = a.p_method; o.pay_mode = o.pay_mode || a.p_mode; return { ok: true };
      }
      return { ok: false, reason: 'no_order' };
    case 'order_pg_failed':
      if (!열쇠) return { ok: false, reason: 'forbidden' };
      if (o && ['kakao', 'naver'].includes(o.provider) && o.status === 'open') { o.status = 'failed'; o.fail_code = a.p_code; }
      return { ok: true };
    case 'order_pg_note':
      if (!열쇠) return { ok: false, reason: 'forbidden' };
      if (o && o.pg_tid === a.p_tid && ['open', 'failed'].includes(o.status)) { o.fail_code = a.p_code; o.note = a.p_message; return { ok: true }; }
      return { ok: false };
    case 'order_pg_canceled':
      if (!열쇠) return { ok: false, reason: 'forbidden' };
      if (o && o.pg_tid === a.p_tid && o.status === 'paid') { o.status = 'canceled'; return { ok: true }; }
      return { ok: false, reason: 'no_order' };
    case 'order_check': return o ? { ok: true, amount: o.amount, name: o.name, already: o.status === 'paid' } : { ok: false, reason: 'no_order' };
    default: return { ok: false, reason: 'unknown_rpc:' + name };
  }
}

global.fetch = async (url, opt = {}) => {
  const res = (code, j) => ({ ok: code >= 200 && code < 300, status: code, json: async () => j });
  if (url.includes('/rest/v1/products')) return res(200, [{ code: 'taekil', name: '출산택일 보고서', amount: 99000 }]);
  const m = url.match(/\/rest\/v1\/rpc\/([a-z_]+)/);
  if (m) return res(200, rpc(m[1], JSON.parse(opt.body || '{}'), (opt.headers.authorization || '').replace(/^Bearer /, '')));
  if (url.endsWith('/auth/v1/user')) { const t = (opt.headers.authorization || '').replace(/^Bearer /, ''); return 등급[t] ? res(200, { app_metadata: { plan: 등급[t] } }) : res(200, { app_metadata: {} }); }
  if (url.includes('paygate.naver.com')) {
    const body = Object.fromEntries(new URLSearchParams(opt.body));
    네이버부름.push({ url, body, headers: opt.headers });
    const 답 = 네이버답.shift();
    if (!답) return res(500, {});
    if (답.net) throw new Error('net');
    return res(답.status || 200, typeof 답.j === 'function' ? 답.j(body) : 답.j);
  }
  return res(404, {});
};

// ── 환경 ─────────────────────────────────────────────
Object.assign(process.env, {
  PAY_PROVIDERS: 'kakao,naver,toss', PAY_HOOK_SECRET: HOOK, PAY_TEST_OPEN: '',
  KAKAOPAY_SECRET_KEY_DEV: 'DEVKEY', NAVERPAY_CLIENT_ID: 'nid', NAVERPAY_CLIENT_SECRET: 'nsecret', NAVERPAY_CHAIN_ID: 'nchain',
  NAVERPAY_MODE: '', TOSS_SECRET_KEY: 'test_gsk_x', TOSS_CLIENT_KEY: 'test_gck_x', TAEKIL_AUTO: '',
});
const handler = require(path.join(__dirname, 'api', 'pay.js'));

async function 부름(method, body, tok) {
  let code = 0, out = null;
  const req = { method, headers: tok ? { authorization: 'Bearer ' + tok } : {}, body };
  const res = { setHeader() {}, status(c) { code = c; return this; }, json(j) { out = j; return this; }, end() { return this; } };
  await handler(req, res);
  return { code, j: out };
}
const 성공답 = (orderId, 금액, pid) => ({ j: { code: 'Success', body: { paymentId: pid, detail: { paymentId: pid, merchantPayKey: orderId, totalPayAmount: 금액, admissionState: 'SUCCESS', primaryPayMeans: 'CARD', taxScopeAmount: 금액, taxExScopeAmount: 0, npointPayAmount: 0, admissionYmdt: '20261003120500' } } } });

(async () => {
  // 1. 결제사 목록
  const g = await 부름('GET');
  봄('GET 결제사 셋 · 모두 시험', JSON.stringify(g.j.providers) === JSON.stringify([{ id: 'kakao', mode: 'test' }, { id: 'naver', mode: 'test' }, { id: 'toss', mode: 'test' }]), g.j.providers);

  // 2. 시험 모드 문 — 손님은 셋 다 막힌다
  for (const action of ['kopen', 'nopen', 'open']) {
    const r = await 부름('POST', { action, product: 'love_full' }, T_GUEST);
    봄(action + ' 손님 → test_only', r.code === 403 && r.j.reason === 'test_only', r);
  }
  // 토스 승인 뒷문: 손님이 order_open 을 직접 불러 만든 주문을 confirm 으로 「결제완료」 시도
  const 직접 = rpc('order_open', { p_product: 'love_full' }, T_GUEST);
  const tc = await 부름('POST', { action: 'confirm', orderId: 직접.orderId, paymentKey: 'pk', amount: 9900 }, T_GUEST);
  봄('토스 confirm 손님(시험 키) → test_only', tc.code === 403 && tc.j.reason === 'test_only', tc);

  // 2-1. 심사관 계정(review) — 시험 결제창은 열리고(카카오페이 · 토스 심사관이 메일 계정으로 결제창까지), 환불은 여전히 super 만
  const rv = await 부름('POST', { action: 'nopen', product: 'taekil', intake: { a: 1 } }, T_REVIEW);
  봄('nopen 심사관(review) → 200', rv.code === 200 && rv.j.ok, rv);
  const rvr = await 부름('POST', { action: 'nrefund', orderId: rv.j.orderId }, T_REVIEW);
  봄('nrefund 심사관(review) → forbidden', rvr.code === 403 && rvr.j.reason === 'forbidden', rvr);

  // 3. 네이버 nopen(검수 계정)
  const no = await 부름('POST', { action: 'nopen', product: 'taekil', intake: { a: 1 } }, T_SUPER);
  봄('nopen super → 200', no.code === 200 && no.j.ok, no);
  const oid = no.j.orderId;
  봄('nopen 돌아올 주소 · 결제창 값', /pay-done\.html\?pv=naver&orderId=/.test(no.j.returnUrl) && no.j.naver.mode === 'development' && no.j.naver.clientId === 'nid' && no.j.amount === 99000, no.j);
  봄('nopen 사용자 키는 계정 id 가 아니다', no.j.userKey && !no.j.userKey.includes('u-super') && no.j.userKey.length === 40);
  봄('nopen 주문 = naver · 자리표', 주문.get(oid).provider === 'naver' && 주문.get(oid).pg_tid === 'np_' + oid);
  봄('nopen 응답에 비밀 없음', !JSON.stringify(no.j).includes('nsecret'));

  // 4. 승인 성공
  네이버답.push(성공답(oid, 99000, 'NP0001'));
  const c1 = await 부름('POST', { action: 'nconfirm', orderId: oid, paymentId: 'NP0001' });
  봄('nconfirm 로그인 없이 성공', c1.code === 200 && c1.j.ok && c1.j.saved === true && c1.j.payMode === 'test', c1);
  봄('주문 paid · pg_aid = 결제번호', 주문.get(oid).status === 'paid' && 주문.get(oid).pg_aid === 'NP0001');
  const 부른것 = 네이버부름[네이버부름.length - 1];
  봄('승인 머리 · 본문 · 주소', 부른것.url === 'https://dev-pay.paygate.naver.com/naverpay-partner/naverpay/payments/v2.2/apply/payment'
    && 부른것.headers['X-Naver-Client-Secret'] === 'nsecret' && 부른것.headers['X-NaverPay-Chain-Id'] === 'nchain'
    && 부른것.headers['X-NaverPay-Idempotency-Key'] === 'ap_NP0001' && 부른것.body.paymentId === 'NP0001'
    && /x-www-form-urlencoded/.test(부른것.headers['content-type']), 부른것);
  // 새로고침 — 네이버를 다시 안 부른다
  const n0 = 네이버부름.length;
  const c2 = await 부름('POST', { action: 'nconfirm', orderId: oid, paymentId: 'NP0001' });
  봄('nconfirm 새로고침 → already, 다시 안 부름', c2.j.ok && c2.j.already && 네이버부름.length === n0, c2);
  const c3 = await 부름('POST', { action: 'nconfirm', orderId: oid, paymentId: 'NP9999' });
  봄('이미 낸 주문에 다른 결제번호 → closed', !c3.j.ok && c3.j.reason === 'closed', c3);

  // 5. 금액 어긋남 → 곧바로 취소
  const no2 = await 부름('POST', { action: 'nopen', product: 'love_full' }, T_SUPER);
  네이버답.push(성공답(no2.j.orderId, 100, 'NP0002'), { j: { code: 'Success', body: {} } });
  const m = await 부름('POST', { action: 'nconfirm', orderId: no2.j.orderId, paymentId: 'NP0002' });
  const cx = 네이버부름[네이버부름.length - 1];
  봄('금액 어긋남 → amount_mismatch · 취소 부름', m.j.reason === 'amount_mismatch' && /v1\/cancel$/.test(cx.url) && cx.body.cancelAmount === '100' && cx.body.cancelRequester === '2', { m, cx: cx.body });
  봄('금액 어긋남 주문 failed AMOUNT_MISMATCH', 주문.get(no2.j.orderId).status === 'failed' && /^AMOUNT_MISMATCH/.test(주문.get(no2.j.orderId).fail_code));
  // 주문번호가 다른 결제(남의 결제번호를 끼워 넣음)
  const no3 = await 부름('POST', { action: 'nopen', product: 'love_full' }, T_SUPER);
  네이버답.push(성공답('ck_other', 9900, 'NP0003'), { j: { code: 'Success', body: {} } });
  const m2 = await 부름('POST', { action: 'nconfirm', orderId: no3.j.orderId, paymentId: 'NP0003' });
  봄('주문번호 어긋남 → amount_mismatch', m2.j.reason === 'amount_mismatch' && 주문.get(no3.j.orderId).status === 'failed', m2);

  // 6. 확답 실패 / 모름
  const no4 = await 부름('POST', { action: 'nopen', product: 'love_full' }, T_SUPER);
  네이버답.push({ j: { code: 'AlreadyOnGoing', message: '진행 중' } });
  const p1 = await 부름('POST', { action: 'nconfirm', orderId: no4.j.orderId, paymentId: 'NP0004' });
  봄('AlreadyOnGoing → unverified · 주문 open', p1.code === 502 && p1.j.reason === 'unverified' && 주문.get(no4.j.orderId).status === 'open', p1);
  네이버답.push({ net: true });
  const p2 = await 부름('POST', { action: 'nconfirm', orderId: no4.j.orderId, paymentId: 'NP0004' });
  봄('네트워크 끊김 → unverified · 주문 open', p2.code === 502 && 주문.get(no4.j.orderId).status === 'open', p2);
  네이버답.push({ j: { code: 'TimeExpired', message: '시간 초과' } });
  const p3 = await 부름('POST', { action: 'nconfirm', orderId: no4.j.orderId, paymentId: 'NP0004' });
  봄('TimeExpired → 실패로 닫음', p3.j.reason === 'naver' && p3.j.code === 'TimeExpired' && 주문.get(no4.j.orderId).status === 'failed', p3);
  봄('결제번호 꼴이 이상하면 거절', (await 부름('POST', { action: 'nconfirm', orderId: oid, paymentId: 'a b<c' })).j.reason === 'bad_request');
  // 카카오 주문을 네이버 승인으로 열 수 없다
  const ko = await 부름('POST', { action: 'kopen', product: 'love_full' }, T_SUPER);
  봄('카카오 주문을 nconfirm → bad_request/closed', (await 부름('POST', { action: 'nconfirm', orderId: ko.j.orderId || 'none', paymentId: 'NP0005' })).j.ok === false);

  // 7. nfail
  const no5 = await 부름('POST', { action: 'nopen', product: 'love_full' }, T_SUPER);
  const f1 = await 부름('POST', { action: 'nfail', orderId: no5.j.orderId, code: 'UserCancel' });
  봄('nfail UserCancel → USER_CANCEL', f1.j.ok && 주문.get(no5.j.orderId).status === 'failed' && 주문.get(no5.j.orderId).fail_code === 'USER_CANCEL');
  const f2 = await 부름('POST', { action: 'nfail', orderId: oid, code: 'Fail' });
  봄('nfail 이 결제된 주문은 안 닫는다', f2.j.kept && 주문.get(oid).status === 'paid');

  // 8. 환불
  const r0 = await 부름('POST', { action: 'nrefund', orderId: oid }, T_GUEST);
  봄('nrefund 손님 → forbidden', r0.code === 403);
  네이버답.push({ j: { code: 'Success', body: {} } });
  const r1 = await 부름('POST', { action: 'nrefund', orderId: oid }, T_SUPER);
  const rx = 네이버부름[네이버부름.length - 1];
  봄('nrefund super → canceled', r1.j.ok && 주문.get(oid).status === 'canceled', r1);
  봄('환불 본문: 전액 · 남은 금액 0 대조 · 결제번호', rx.body.paymentId === 'NP0001' && rx.body.cancelAmount === '99000' && rx.body.doCompareRest === '1' && rx.body.expectedRestAmount === '0' && rx.body.taxScopeAmount === '99000', rx.body);

  // 9. 운영 모드 · PAY_TEST_OPEN
  process.env.NAVERPAY_MODE = 'production';
  const g2 = await 부름('GET');
  봄('운영 모드 → naver live', g2.j.providers.find((p) => p.id === 'naver').mode === 'live');
  const no6 = await 부름('POST', { action: 'nopen', product: 'love_full' }, T_GUEST);
  봄('운영 모드 손님 nopen → 200 · production', no6.code === 200 && no6.j.naver.mode === 'production', no6);
  네이버답.push(성공답(no6.j.orderId, 9900, 'NP0006'));
  await 부름('POST', { action: 'nconfirm', orderId: no6.j.orderId, paymentId: 'NP0006' });
  봄('운영 승인 주소', 네이버부름[네이버부름.length - 1].url.startsWith('https://pay.paygate.naver.com/') && 주문.get(no6.j.orderId).pay_mode === 'live');
  process.env.NAVERPAY_MODE = '';
  process.env.PAY_TEST_OPEN = '1';
  봄('PAY_TEST_OPEN=1 → 손님 nopen 열림', (await 부름('POST', { action: 'nopen', product: 'love_full' }, T_GUEST)).code === 200);
  process.env.PAY_TEST_OPEN = '';
  process.env.PAY_PROVIDERS = 'kakao';
  봄('PAY_PROVIDERS 에 naver 없으면 nopen not_ready', (await 부름('POST', { action: 'nopen', product: 'love_full' }, T_SUPER)).j.reason === 'not_ready');

  console.log(`통과 ${통과} · 실패 ${실패}`);
  process.exit(실패 ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
