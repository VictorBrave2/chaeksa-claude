/* 책사 결제 — 브라우저 쪽 (토스페이먼츠 v2)
 *
 * 여기서 하는 일은 셋뿐이다.
 *   1) /api/pay 에 주문을 열어달라고 한다 (금액은 서버가 정한다 — 우리는 못 정한다)
 *   2) 토스 결제창을 띄운다
 *   3) 돌아온 자리(pay-done.html)에서 승인을 서버에 부탁한다
 *
 * **가격을 이 파일에 안 적는다.** 값은 서버의 products 표에서 받아온다.
 * 두 벌이 있으면 반드시 어긋난다 — 이 프로젝트에서 여러 번 겪은 실패다.
 *
 * 키가 아직 없으면(심사 전) ready:false 로 오고, 화면은 결제 버튼 대신
 * '준비 중 — 카카오로 문의' 를 보여준다. 키만 넣으면 그날로 열린다.
 */
(function (global) {
  'use strict';

  const API = 'https://chaeksa-claude.vercel.app/api/pay';
  const SDK = 'https://js.tosspayments.com/v2/standard';
  const BASE = 'https://chaeksa.kr';

  let _state = null;          // GET 결과 캐시. 한 화면에서 여러 번 그리므로 한 번만 받는다
  let _sdk = null;            // SDK 로드 약속

  /** 준비 상태와 상품표. 실패해도 던지지 않는다 — 결제가 안 되는 것이 화면이 죽을 이유는 아니다. */
  async function state(force) {
    if (_state && !force) return _state;
    try {
      const r = await fetch(API, { headers: { accept: 'application/json' } });
      _state = await r.json();
    } catch (e) {
      _state = { ok: false, ready: false, products: [], error: String(e && e.message || e) };
    }
    return _state;
  }

  const ready = async () => !!(await state()).ready;
  const products = async () => (await state()).products || [];
  const product = async (code) => (await products()).find((p) => p.code === code) || null;

  /** 토스 SDK 는 결제할 때만 필요하다. 앱 첫 화면을 2MB 로 무겁게 만들 이유가 없다. */
  function loadSdk() {
    if (_sdk) return _sdk;
    _sdk = new Promise((ok, no) => {
      if (global.TossPayments) return ok(global.TossPayments);
      const s = document.createElement('script');
      s.src = SDK;
      s.onload = () => (global.TossPayments ? ok(global.TossPayments) : no(new Error('SDK 없음')));
      s.onerror = () => no(new Error('결제 모듈을 불러오지 못했습니다'));
      document.head.appendChild(s);
    });
    return _sdk;
  }

  async function post(payload) {
    const C = global.ChaeksaCloud;
    const tok = C && C.token ? await C.token() : null;
    if (!tok) return { ok: false, reason: 'unauthenticated' };
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok },
      body: JSON.stringify(payload),
    });
    return await r.json().catch(() => ({ ok: false, reason: 'bad_response' }));
  }

  const REASON = {
    unauthenticated: '결제하시려면 먼저 로그인해 주세요.',
    not_ready: '결제 준비가 아직 끝나지 않았습니다. 메일로 문의해 주세요 — b01099991263@gmail.com',
    no_product: '없는 상품입니다.',
    too_many: '오늘 연 주문이 너무 많습니다. 내일 다시 시도해 주세요.',
    no_order: '주문을 찾지 못했습니다.',
    closed: '이미 처리가 끝난 주문입니다.',
    amount_mismatch: '금액이 맞지 않아 승인을 멈췄습니다. 결제되지 않았습니다.',
    db: '주문 정보를 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
    server: '서버에서 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.',
  };
  const say = (r) => REASON[r && r.reason] || (r && r.message) || '결제를 진행하지 못했습니다.';

  /**
   * 산다. 성공하면 결제창이 뜨고 이 페이지는 떠난다 — 그래서 돌아오는 값이 없다.
   * 막힌 경우에만 { ok:false, message } 로 돌아온다.
   */
  async function buy(code, note) {
    const st = await state();
    if (!st.ready) return { ok: false, message: REASON.not_ready };

    const opened = await post({ action: 'open', product: code, note: note || null });
    if (!opened || !opened.ok) return { ok: false, message: say(opened) };

    let Toss;
    try { Toss = await loadSdk(); } catch (e) { return { ok: false, message: e.message }; }

    // customerKey 는 사람마다 다르고 순서를 못 읽는 값이어야 한다. 계정 id 가 딱 맞다.
    let uid = null;
    try { const m = await global.ChaeksaCloud.me(); uid = m && m.id; } catch (_) {}

    const payment = Toss(st.clientKey).payment({
      customerKey: uid || Toss.ANONYMOUS,
    });

    try {
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: opened.amount },
        orderId: opened.orderId,
        orderName: opened.name,
        successUrl: BASE + '/pay-done.html',
        failUrl: BASE + '/pay-fail.html',
        card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false },
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 것도 여기로 온다. 실패로 기록만 하고 조용히 돌아간다.
      await post({ action: 'fail', orderId: opened.orderId,
                   code: (e && e.code) || 'CLOSED', message: (e && e.message) || '' }).catch(() => {});
      const closed = /취소|닫|CLOSE|CANCEL/i.test(String((e && (e.code + ' ' + e.message)) || ''));
      return { ok: false, closed, message: closed ? '' : ((e && e.message) || '결제창을 열지 못했습니다.') };
    }
    return { ok: true };
  }

  /** 착지 페이지에서 부른다. 여기가 끝나야 결제가 끝난 것이다. */
  async function confirm(q) {
    const out = await post({
      action: 'confirm',
      paymentKey: q.paymentKey,
      orderId: q.orderId,
      amount: parseInt(q.amount, 10),
    });
    if (!out || !out.ok) return { ok: false, message: say(out), code: out && out.code };
    return out;
  }

  async function markFailed(q) {
    return await post({ action: 'fail', orderId: q.orderId, code: q.code, message: q.message });
  }

  /** 내 주문 목록. 로그인 안 했으면 빈 배열. */
  async function mine() {
    const C = global.ChaeksaCloud;
    if (!C || !C.signedIn || !C.signedIn()) return [];
    try {
      const tok = await C.token();
      const cfg = global.CHAEKSA_SUPABASE;
      const r = await fetch(cfg.url + '/rest/v1/rpc/my_orders', {
        method: 'POST',
        headers: { apikey: cfg.anonKey, authorization: 'Bearer ' + tok,
                   'content-type': 'application/json' },
        body: '{}',
      });
      const j = await r.json();
      return Array.isArray(j) ? j : [];
    } catch (_) { return []; }
  }

  const won = (n) => Number(n || 0).toLocaleString('ko-KR') + '원';

  // ── 결제한 것을 판독한다 ──
  // 무료 화면이 렌더될 때 「이 사람이 이걸 샀는가」를 동기로 물을 수 있어야 한다.
  // 그래서 앱이 뜰 때 paidLoad() 로 한 번 받아 두고, paidFor() 는 그 캐시만 읽는다.
  // 캐시가 아직이면 null — 무료로 그려진다. 결제 직후에는 착지 페이지에서
  // 앱으로 돌아오며 새로 뜨므로 자연히 다시 받는다.
  //
  // 이건 화면 편의지 방어가 아니다 — 열리는 건 브라우저 계산 결과일 뿐이고,
  // 서버 비용이 걸린 것(AI)은 서버가 따로 강제한다. devtools 로 열어봐야
  // 자기 사주 계산을 자기가 보는 것이다.
  let _paidRows = null;
  async function paidLoad() {
    if (_paidRows) return _paidRows;
    const rows = await mine();
    _paidRows = rows.filter((r) => r.status === 'paid');
    return _paidRows;
  }
  function paidFor(code) {
    // 슈퍼계정(검수용)은 전부 열린다. 등급은 JWT 의 app_metadata 라 위조 불가 —
    // AI 한도를 풀 때와 같은 자리에서 읽는다. 검수자가 결제 없이 유료 화면을 본다.
    try {
      const U = global.ChaeksaUsage;
      if (U && U.plan && U.plan() === 'super') return { id: 'super', product: code, super: true };
    } catch (e) {}
    if (!_paidRows) return null;
    const now = new Date();
    for (const r of _paidRows) {
      // product 열이 정식이고, 옛 주문은 id 접두(ck_코드_)로도 읽힌다
      const c = r.product || (String(r.id || '').match(/^ck_([a-z]+)_/) || [])[1];
      if (c !== code) continue;
      const at = new Date(r.paidAt || r.at);
      if (isNaN(at)) continue;
      if (code === 'month') {
        // 이번 달 일운은 결제한 그 달만 — 달이 바뀌면 새로 사는 상품이다
        if (at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth()) return r;
      } else if (now - at < 366 * 864e5) {
        return r;   // 나머지는 1년 열람
      }
    }
    return null;
  }

  global.ChaeksaPay = { state, ready, products, product, buy, confirm, markFailed, mine, won, say, paidLoad, paidFor };
})(window);
