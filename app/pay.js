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

  // 상품 그림 — 상품마다 **서로 다른 그림 한 장**. 토스 심사가 「상품 이미지가 없거나
  // 같은 그림을 반복해 쓰면」 떨어뜨린다(2026-09-11 전자계약 심사 안내).
  // 결제 화면(pay.html)이 쓴다. 가로 3:1 장면이라 결제 화면의 넓은 칸에 맞는다.
  // 앱 홈 카드는 칸이 정사각이라 책사 얼굴을 쓴다(2026-09-11 — 여기 장면을 넣었다가 사람이 잘렸다).
  // art/love-shake-summer.webp 는 love-open-summer.webp 와 바이트까지 같은 파일이라 안 쓴다.
  // products 표에 상품을 새로 넣으면 여기에도 한 줄 넣어야 한다 — 빠지면 그림 없는 상품이 된다.
  const 그림 = {
    maeum: 'art/love-open-spring.webp',    gunghap: 'art/love-open-summer.webp',
    sok: 'art/love-open-winter.webp',      gyeolhon: 'art/love-quiet-autumn.webp',
    ibyeol: 'art/love-shake-winter.webp',  jigeum: 'art/love-quiet-spring.webp',
    jjak: 'art/love-quiet-winter.webp',    relation: 'art/love-open-autumn.webp',
    geunamja: 'art/wealth-open-autumn.webp', wealth: 'art/wealth-open-spring.webp',
    inyeon: 'art/chaeksa-inyeon.webp',     month: 'art/chaeksa-unro.webp',
    taekil: 'art/chaeksa-hyeopgi.webp',
  };

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
    // 「준비 안 됨」을 캐시에서 믿지 않는다. 키가 들어가기 전에 연 앱은 그 답을 들고 있어서,
    // 키가 들어온 뒤에도 새로고침 전까지 결제가 안 됐다(2026-09-11). 준비 안 됨이면 한 번 더 묻는다.
    let st = await state();
    if (!st.ready) st = await state(true);
    if (!st.ready) return { ok: false, message: REASON.not_ready };

    const opened = await post({ action: 'open', product: code, note: note || null });
    if (!opened || !opened.ok) return { ok: false, message: say(opened) };

    let Toss;
    try { Toss = await loadSdk(); } catch (e) { return { ok: false, message: e.message }; }

    // customerKey 는 사람마다 다르고 순서를 못 읽는 값이어야 한다. 계정 id 가 딱 맞다.
    // (widgets() 는 2~50자에 - _ = . @ 가 하나는 있어야 한다 — 계정 id 는 36자 UUID 라 '-' 가 있다)
    let uid = null;
    try { const m = await global.ChaeksaCloud.me(); uid = m && m.id; } catch (_) {}
    const customerKey = uid || Toss.ANONYMOUS;
    const tp = Toss(st.clientKey);

    // 막히거나 닫혔을 때. 실패로 기록만 하고 조용히 돌아간다 — 닫은 것은 사람의 뜻이지 오류가 아니다.
    const 닫힘 = (e) => /취소|닫|CLOSE|CANCEL/i.test(String((e && (e.code + ' ' + e.message)) || ''));
    const 막힘 = async (e) => {
      await post({ action: 'fail', orderId: opened.orderId,
                   code: (e && e.code) || 'CLOSED', message: (e && e.message) || '' }).catch(() => {});
      const closed = 닫힘(e);
      return { ok: false, closed, message: closed ? '' : ((e && e.message) || '결제창을 열지 못했습니다.') };
    };
    const 요청 = { orderId: opened.orderId, orderName: opened.name,
                   successUrl: BASE + '/pay-done.html', failUrl: BASE + '/pay-fail.html' };

    // 키 종류가 문을 정한다(2026-09-11). 사장님 화면에 「API 개별 연동 키의 클라이언트 키로 SDK를
    // 연동해주세요. 주문서형, 결제창형 연동 키는 지원하지 않습니다」가 떴다 — 이 파일이 payment() 하나만
    // 부르는데 들어온 키가 gck 였다. 토스 문서(sdk/v2/js/environment · api-keys · error-codes 대조):
    //   gck = 주문서형·결제창형 연동 키 → widgets()   지금 우리 키이자 토스의 현행 상품
    //   ck  = API 개별 연동 키          → payment()   결제창(구버전). 새 연동엔 권하지 않는다
    // 바꿔 부르면 토스가 거절한다(NOT_SUPPORTED_WIDGET_KEY / NOT_SUPPORTED_API_INDIVIDUAL_KEY).
    // 승인(api/pay.js)은 두 갈래가 같다 — 짝이 되는 시크릿 키(gsk / sk)만 맞으면 된다.
    if (/_gck_/.test(String(st.clientKey))) {
      // 결제창형 결제: 우리 버튼을 누르면 토스 창이 페이지 위에 뜬다. 담을 칸(div)이 필요 없다.
      // 순서는 문서 그대로 — setAmount → renderPaymentWindow → 'paymentRequest' 안에서 requestPayment.
      // widgets 의 requestPayment 에는 amount·method 가 없다. 금액은 setAmount 로만 넘긴다.
      // variantKey 는 안 넘긴다 → 상점 기본 UI. 우리 test_gck 로 뜨는 것을 운영에서 확인했다(2026-09-11).
      let win = null;
      const 치움 = () => Promise.resolve().then(() => win && win.destroy()).catch(() => {});
      try {
        const widgets = tp.widgets({ customerKey });
        await widgets.setAmount({ currency: 'KRW', value: opened.amount });
        win = await widgets.renderPaymentWindow();
        return await new Promise((done) => {
          win.on('paymentRequest', async () => {
            try { await widgets.requestPayment(요청); done({ ok: true }); }   // 성공이면 페이지가 떠난다
            catch (e) { await 치움(); done(await 막힘(e)); }
          });
          // 창을 닫거나 그만두면 온다. 창은 한 번에 하나만 뜰 수 있어서 치워야 다음에 다시 연다.
          win.on('cancel', async () => { await 치움(); done(await 막힘({ code: 'CLOSED', message: '' })); });
        });
      } catch (e) {
        await 치움();
        return 막힘(e);
      }
    }

    // API 개별 연동 키(ck)가 들어오면 예전 길 그대로 — 결제창(구버전), 카드.
    try {
      await tp.payment({ customerKey }).requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: opened.amount },
        ...요청,
        card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false },
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 것도 여기로 온다.
      return 막힘(e);
    }
    return { ok: true };
  }

  /**
   * 앱 안 결제 버튼을 눌렀을 때. buy() 의 답을 **버리지 않는다**(2026-09-11).
   *
   * 예전엔 버튼 다섯이 `try { buy(...) } catch {}` 로 buy() 를 부르고 답을 버렸다.
   * buy() 는 비동기라 막히면 던지지 않고 { ok:false, message } 를 돌려주는데, 그걸 아무도
   * 안 받아서 로그인이 안 됐거나 막히면 **화면에 아무 일도 안 일어났다** — 사장님 「결제 터치해도
   * 창이 안 뜨네」. 운영에서 로그인 없이 눌러 보니 buy() 는 「먼저 로그인해 주세요」를 돌려주고 있었다.
   *
   * 그래서: 로그인이 안 됐으면 **주문을 열기 전에** 로그인부터 청하고, 막히면 그 이유를 버튼 아래 적는다.
   * 로그인 여는 법은 화면마다 달라서 부르는 쪽이 넘긴다(앱은 카카오 → 안 되면 설정 창).
   */
  async function 누르면(btn, code, note, 로그인) {
    if (!btn || btn.dataset.busy) return null;
    // 버튼 밑 안내(.nx-ft)는 덮지 않는다 — 제 자리를 따로 둔다.
    let 꼬리 = btn.nextElementSibling;
    if (!(꼬리 && 꼬리.classList.contains('pay-say'))) {
      꼬리 = document.createElement('p');
      꼬리.className = 'hint pay-say';
      btn.insertAdjacentElement('afterend', 꼬리);
    }
    const C = global.ChaeksaCloud;
    if (!(C && C.signedIn && C.signedIn())) {
      꼬리.innerHTML = '결제하시려면 먼저 로그인해 주세요 — 결제한 것을 그 계정에 매어 두어야 다른 기기에서도 열립니다. '
        + '<a href="#" class="pay-login"><b>카카오로 로그인 →</b></a>';
      const a = 꼬리.querySelector('.pay-login');
      if (a) a.onclick = (e) => {
        e.preventDefault();
        if (로그인) 로그인(); else if (C && C.signInWith) C.signInWith('kakao');
      };
      return { ok: false, reason: 'unauthenticated' };
    }
    const 원래 = btn.textContent;
    btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = '결제창을 여는 중…';
    꼬리.textContent = '';
    let r;
    try { r = await buy(code, note); } catch (e) { r = { ok: false, message: String((e && e.message) || e) }; }
    // 결제창으로 넘어가면 이 아래는 대개 안 돈다. 돌아왔다면 막힌 것이거나 창을 닫은 것이다.
    delete btn.dataset.busy; btn.disabled = false; btn.textContent = 원래;
    if (r && r.ok === false && !r.closed) 꼬리.textContent = r.message || '결제창을 열지 못했습니다.';
    return r;
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
      if (!Array.isArray(j)) throw new Error('bad_rows');
      return j;
    } catch (_) {
      // 실패를 빈 배열로 뭉개면 「못 물어봤다」와 「산 게 없다」가 구분이 안 된다.
      // 그러면 어제 2만원 낸 손님이 무료 화면을 보고 한 번 더 결제한다.
      return null;
    }
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
  let _paidRows = null, _paidWait = null;
  async function paidLoad() {
    if (_paidRows) return _paidRows;
    // 부팅 때 두 곳에서 거의 동시에 부른다(모듈 평가 · go('home')).
    // 합쳐 두지 않으면 켤 때마다 토큰 갱신 + my_orders 가 두 벌씩 나간다.
    if (_paidWait) return _paidWait;
    _paidWait = (async () => {
      try { return await 실제조회(); } finally { _paidWait = null; }
    })();
    return _paidWait;
  }
  async function 실제조회() {
    const rows = await mine();
    // 못 물어본 것(null)은 캐시하지 않는다 — 캐시하면 그 세션 내내 「산 게 없음」이다.
    // 비로그인은 빈 배열이라 정상적으로 캐시된다.
    if (rows === null) return null;
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

  /** 사람마다 따로 파는 상품(이 남자 한 장) — 주문 note 가 열쇠와 같은 paid 주문만 인정한다(2026-09-04 「개별로 받아야지」).
   *  my_orders 가 note 를 아직 안 내려주면(migrate-17 전) 그 상품의 paid 주문 하나로 연다 — 낸 사람이 못 보는 것보다 낫다. */
  function paidForKey(code, key) {
    try { const U = global.ChaeksaUsage; if (U && U.plan && U.plan() === 'super') return { id: 'super', product: code, super: true }; } catch (e) {}
    if (!_paidRows) return null;
    const rows = _paidRows.filter((r) => (r.product || (String(r.id || '').match(/^ck_([a-z]+)_/) || [])[1]) === code);
    if (!rows.length) return null;
    const hasNote = rows.some((r) => r.note !== undefined);
    if (!hasNote) return rows[0];
    return rows.find((r) => r.note === key) || null;
  }
  global.ChaeksaPay = { state, ready, products, product, buy, confirm, markFailed, mine, won, say, paidLoad, paidFor, paidForKey, 그림, 누르면 };
})(window);
