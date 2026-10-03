/* 책사 결제 — 브라우저 쪽 (카카오페이 · 네이버페이 · 토스페이먼츠 v2)
 *
 * 여기서 하는 일은 셋뿐이다.
 *   1) /api/pay 에 주문을 열어달라고 한다 (금액은 서버가 정한다 — 우리는 못 정한다)
 *   2) 결제창으로 간다 — 카카오페이는 서버가 받아 준 주소로 페이지째 이동, 네이버페이는 네이버 SDK 가 결제창으로 데려가고,
 *      토스는 결제창을 띄운다
 *   3) 돌아온 자리(pay-done.html)에서 승인을 서버에 부탁한다
 *
 * 어느 결제사를 보일지는 서버가 정한다(GET 의 providers, Vercel PAY_PROVIDERS). 2026-10-01 부터 카카오페이가 먼저이고,
 * 네이버페이 · 토스 단추는 PAY_PROVIDERS 에 naver · toss 가 있고 키가 들어왔을 때만 나온다. 둘 이상이면 값 단추 위에
 * 「결제 수단」 칸(결제사칸)이 생기고, 손님이 고른 것으로 결제한다(10-03 사장님 「네이버 카카오 토스 테스트 API로 연결은 다 해두자」).
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
  // 이 파일이 몇 판인지(?v=). 결제가 막혔을 때 문구 뒤에 붙인다 — 캡처 한 장으로 「옛 화면이 떠 있던 것」과
  // 「새 코드의 문제」를 가른다(2026-09-11: 고친 뒤에도 같은 오류를 다시 받았는데 운영 코드로는 재현되지 않았다).
  // 10-02 개편 3묶음 — ?v= 는 이제 숫자 판이 아니라 파일 내용 지문(tools_bust.py)이라 영문 · 숫자를 다 읽는다.
  const 판 = ((document.currentScript && document.currentScript.src || '').match(/[?&]v=([0-9a-z]+)/) || [])[1] || '';

  // 상품 그림(결제 화면 pay.html 의 정사각 칸) · 상품 설명 · 결제하는 자리는 10-02 부터 상품 약속 장부(yaksok.js) 한 곳에 있다 —
  // 상품마다 서로 다른 그림 한 장(토스 심사 「같은 그림을 반복해 쓰면」 떨어뜨림, 2026-09-11). products 표에 상품을 새로 넣으면 장부에 한 줄.
  // 값 앞에 붙는 말. 값 자체는 products 표에만 있다 — 여기는 이름표뿐이다.
  // 「출시 기념가 9,900원」처럼만 쓴다. 줄 그은 정가는 보이지 않는다(10-01 사장님).
  const 값이름 = { love_full: '출시 기념가', love_pair: '출시 기념가' };
  const 결제사이름 = { kakao: '카카오페이', naver: '네이버페이', toss: '토스페이먼츠' };
  // 네이버페이 SDK — 문서: 「반드시 이 주소로 불러 쓴다(내려받아 두면 고친 것이 안 들어온다)」.
  const NAVER_SDK = 'https://nsp.pay.naver.com/sdk/js/naverpay.min.js';
  let _nsdk = null;

  let _state = null;          // GET 결과 캐시. 한 화면에서 여러 번 그리므로 한 번만 받는다
  let _stateWait = null;      // 받는 중인 약속 — 앱 부팅 · 홈 딱지 값 · 결제 상자가 거의 동시에 물어도 GET 은 한 번(10-02)
  let _sdk = null;            // SDK 로드 약속

  /** 준비 상태와 상품표. 실패해도 던지지 않는다 — 결제가 안 되는 것이 화면이 죽을 이유는 아니다. */
  async function state(force) {
    if (_state && !force) return _state;
    if (_stateWait && !force) return _stateWait;
    const 받기 = (async () => {
      try {
        const r = await fetch(API, { headers: { accept: 'application/json' } });
        _state = await r.json();
      } catch (e) {
        _state = { ok: false, ready: false, products: [], error: String(e && e.message || e) };
      }
      return _state;
    })();
    _stateWait = 받기;
    try { return await 받기; } finally { if (_stateWait === 받기) _stateWait = null; }
  }

  const ready = async () => !!(await state()).ready;
  const products = async () => (await state()).products || [];
  const product = async (code) => (await products()).find((p) => p.code === code) || null;
  /** 보일 결제사 [{id, mode, name}] — 서버가 정한 순서. 옛 서버(providers 없음)면 키가 있을 때 토스 하나. */
  /** 서버가 켠 결제사 전부(손님에게 숨기는 것 없이). buy 가 고른 결제사를 찾을 때 · 검수 계정 시험판(pay.html)이 쓴다 —
   *  시험 결제사를 손님이 골라도 서버(test_only)가 막는다. */
  const 모든결제사 = async () => {
    const st = await state();
    const pv = Array.isArray(st.providers) ? st.providers : (st.ready && st.clientKey ? [{ id: 'toss' }] : []);
    return pv.map((p) => ({ ...p, name: 결제사이름[p.id] || p.id }));
  };
  const providers = async () => {
    const st = await state();
    let pv = Array.isArray(st.providers) ? st.providers : (st.ready && st.clientKey ? [{ id: 'toss' }] : []);
    // 손님(검수 계정 아님 · 시험을 연 날 아님)에게는 눌러도 서버가 test_only 로 막는 시험 결제사를 늘어놓지 않는다(10-03).
    //   운영 결제사가 하나라도 있으면 → 운영 결제사만.  모두 시험이면 → 첫째(심사 중인 결제사, 지금 카카오페이) 하나만 — 곧열림 알림이 뜬다.
    // 검수 계정은 셋 다 본다(네이버 · 토스 시험 결제를 끝까지 시험하는 자리).
    if (!st.testOpen) {
      let 수퍼 = false;
      try { const U = global.ChaeksaUsage; 수퍼 = !!(U && (U.시험계정 ? U.시험계정() : (U.plan && U.plan() === 'super'))); } catch (e) {}   // 10-04 심사관 계정(review)도
      if (!수퍼) pv = pv.some((p) => p.mode === 'live') ? pv.filter((p) => p.mode === 'live') : pv.slice(0, 1);
    }
    return pv.map((p) => ({ ...p, name: 결제사이름[p.id] || p.id }));
  };

  /**
   * 손님이 지금 결제할 수 없나 — 갈림은 여기 하나(10-02). true 면 값 단추 대신 「곧 열려요」를 그린다.
   * 결제사가 모두 시험 모드(mode:'test')면 서버가 손님 주문을 막는다(api/pay.js kopen → test_only).
   * 서버가 여는 것은 검수 계정(super)과 시험을 손님에게 연 날(PAY_TEST_OPEN → GET 의 testOpen)뿐이다.
   * 그동안 손님은 [필수] 칸에 체크하고 단추를 누른 뒤에야 「아직 살 수 없습니다」를 봤다 — 그 헛걸음을 없앤다.
   * 운영 키가 들어와 mode 가 'live' 가 되면 저절로 false — 원래 단추가 돌아온다. 결제 상태를 못 받았으면(네트워크) false.
   */
  async function 곧열림() {
    const st = await state();
    if (!st || st.ok === false) return false;
    if (st.testOpen) return false;
    const pv = await providers();
    if (pv.some((p) => p.mode !== 'test')) return false;
    try { const U = global.ChaeksaUsage; if (U && (U.시험계정 ? U.시험계정() : (U.plan && U.plan() === 'super'))) return false; } catch (e) {}   // 사장님 · 심사관(review)은 시험 결제창까지
    return true;
  }
  /**
   * 값 단추 자리(wrap — 청약철회 안내 · [필수] 칸 · 값 단추 · 안내 줄을 감싼 칸) 맨 위에 「결제는 곧 열려요」 한 줄을 단다.
   * 연애 속의 나(love.js)와 사용설명서(pair.js)가 상자를 그린 뒤 부른다. 달았으면 true.
   * 10-02 에는 단추 자리를 통째로 이 말로 바꿨다. 10-03 카카오페이 가맹 심사 회신(「결제하기 버튼을 누르는 데까지 구현돼야 심사 가능」)에 맞춰
   * 단추는 그대로 두고 알림만 단다 — 누르면 서버가 test_only 로 돌려보내고 REASON.test_only 말이 뜬다. 운영 키가 들어오면 이 줄도 저절로 안 붙는다.
   */
  async function 곧열림자리(wrap) {
    결제사칸(wrap).catch(() => {});   // 결제사가 둘 이상이면 「결제 수단」 칸도 여기서 단다(love.js · pair.js 가 이 함수 하나만 부른다)
    let 곧 = false;
    try { 곧 = await 곧열림(); } catch (e) { 곧 = false; }
    if (!곧 || !wrap || !wrap.isConnected || wrap.querySelector('[data-soon]')) return false;
    wrap.insertAdjacentHTML('afterbegin', '<p data-soon style="margin:0 0 10px"><b>결제는 곧 열려요.</b> 지금은 카카오페이 가맹 심사 중이라 결제하기를 눌러도 결제창이 아직 열리지 않아요.</p>');
    return true;
  }

  /**
   * 결제 수단 고르기(10-03) — 결제사가 둘 이상이면 값 단추 바로 위에 「결제 수단」 칸을 단다. 고른 것은 wrap.dataset.pv.
   * 하나뿐이면 칸 없이 그 하나를 wrap.dataset.pv 에 적는다. 부르는 쪽은 buy(…, 고른결제사(wrap)).
   */
  async function 결제사칸(wrap) {
    if (!wrap || !wrap.isConnected || wrap.querySelector('[data-pvpick]')) return;
    let pv = [];
    try { pv = await providers(); } catch (e) { pv = []; }
    if (!wrap.isConnected || !pv.length || wrap.querySelector('[data-pvpick]')) return;
    if (!pv.some((p) => p.id === wrap.dataset.pv)) wrap.dataset.pv = pv[0].id;
    if (pv.length < 2) return;
    const 이름 = 'pv' + Math.random().toString(36).slice(2, 8);
    const 칸 = '<div data-pvpick role="radiogroup" aria-label="결제 수단" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px">'
      + '<span style="font-size:var(--t1);color:var(--ink2)">결제 수단</span>'
      + pv.map((p) => '<label style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid var(--line);border-radius:var(--r1);font-size:var(--t1);cursor:pointer">'
        // style.css 의 input{width:100%;padding…} 이 라디오에도 걸려 칸이 줄 폭을 다 먹는다(10-03 사장님 화면) — 직접 푼다.
        + '<input type="radio" name="' + 이름 + '" value="' + p.id + '"' + (p.id === wrap.dataset.pv ? ' checked' : '')
        + ' style="width:auto;margin:0;padding:0;flex:none;accent-color:var(--accent)">' + p.name + '</label>').join('')
      + '</div>';
    const 단추 = wrap.querySelector('button');
    if (단추) 단추.insertAdjacentHTML('beforebegin', 칸); else wrap.insertAdjacentHTML('beforeend', 칸);
    wrap.querySelectorAll('[data-pvpick] input').forEach((i) => i.addEventListener('change', () => { if (i.checked) wrap.dataset.pv = i.value; }));
  }
  /** 결제사칸에서 고른 결제사 id. 칸이 없으면 null(buy 가 서버가 준 첫째로 간다). */
  const 고른결제사 = (wrap) => (wrap && wrap.dataset && wrap.dataset.pv) || null;

  /** 네이버페이 SDK — 결제할 때만 부른다. 못 불러오면 다음에 다시 시도하게 약속을 버린다. */
  function loadNaver() {
    if (_nsdk) return _nsdk;
    _nsdk = new Promise((ok, no) => {
      if (global.Naver && global.Naver.Pay) return ok(global.Naver);
      const s = document.createElement('script');
      s.src = NAVER_SDK;
      s.onload = () => (global.Naver && global.Naver.Pay ? ok(global.Naver) : no(new Error('네이버페이 결제 모듈을 불러오지 못했습니다')));
      s.onerror = () => { _nsdk = null; no(new Error('네이버페이 결제 모듈을 불러오지 못했습니다')); };
      document.head.appendChild(s);
    });
    return _nsdk;
  }

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

  // 로그인없이: 카카오 승인 · 취소는 토큰 없이도 보낸다 — 카카오톡에서 결제하고 로그인 안 된 브라우저로
  // 돌아올 수 있다. 서버가 DB 에만 있는 tid · pg_token · 서버 열쇠로 확인한다(api/pay.js kconfirm).
  async function post(payload, 로그인없이) {
    const C = global.ChaeksaCloud;
    let tok = null;
    try { tok = C && C.token ? await C.token() : null; } catch (_) { tok = null; }
    if (!tok && !로그인없이) return { ok: false, reason: 'unauthenticated' };
    const headers = { 'content-type': 'application/json' };
    if (tok) headers.authorization = 'Bearer ' + tok;
    const r = await fetch(API, { method: 'POST', headers, body: JSON.stringify(payload) });
    return await r.json().catch(() => ({ ok: false, reason: 'bad_response' }));
  }

  const REASON = {
    unauthenticated: '결제하시려면 먼저 로그인해 주세요.',
    not_ready: '결제 준비가 아직 끝나지 않았습니다. 메일로 문의해 주세요 — dl4431@naver.com',
    no_product: '없는 상품입니다.',
    too_many: '오늘 연 주문이 너무 많습니다. 내일 다시 시도해 주세요.',
    no_order: '주문을 찾지 못했습니다.',
    closed: '이미 처리가 끝난 주문입니다.',
    amount_mismatch: '금액이 맞지 않아 승인을 멈췄습니다. 결제되지 않았습니다.',
    db: '주문 정보를 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
    server: '서버에서 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.',
    forbidden: '결제 준비가 아직 끝나지 않았습니다. 메일로 문의해 주세요 — dl4431@naver.com',
    bad_request: '결제 정보가 올바르지 않습니다. 처음부터 다시 결제해 주세요.',
    unverified: '결제 확인이 늦어지고 있습니다. 돈이 빠졌다면 문의해 주세요. 확인해서 열어 드립니다.',
    no_provider: '지금은 그 결제 수단을 쓸 수 없습니다.',
    test_only: '카카오페이 가맹 심사 중이라 아직 결제창이 열리지 않습니다. 심사가 끝나는 대로 열립니다.',
    // 10-02 출산택일 — 결제창을 열기 전에 신청서를 주문에 붙이지 못했다(api/pay.js kopen). 결제는 되지 않았다.
    no_intake: '신청서를 주문에 붙이지 못해 결제창을 열지 않았어요. 결제는 되지 않았어요. 칸을 확인하고 한 번 더 눌러 주세요.',
  };
  const say = (r) => REASON[r && r.reason] || (r && r.message) || '결제를 진행하지 못했습니다.';

  /**
   * 산다. 성공하면 결제창이 뜨고 이 페이지는 떠난다 — 그래서 돌아오는 값이 없다.
   * 막힌 경우에만 { ok:false, message } 로 돌아온다.
   * intake(10-02 출산택일) — 신청서(주문서.신청서() 꼴). 결제창을 열 때 서버가 그 주문에 붙인다(api/pay.js kopen → order_intake).
   * 붙으면 이 기기에 「이 주문에 신청서가 붙었다」를 적어 둔다(결제 뒤 화면이 자동 보고서 길로 간다).
   */
  async function buy(code, note, pv, intake) {
    // 「준비 안 됨」을 캐시에서 믿지 않는다. 키가 들어가기 전에 연 앱은 그 답을 들고 있어서,
    // 키가 들어온 뒤에도 새로고침 전까지 결제가 안 됐다(2026-09-11). 준비 안 됨이면 한 번 더 묻는다.
    let st = await state();
    if (!st.ready) st = await state(true);
    if (!st.ready) return { ok: false, message: REASON.not_ready };

    // 결제사를 고른다. 안 넘기면 서버가 준 첫째(지금은 카카오페이). 서버가 안 보이는 결제사는 부르지 않는다.
    // 고른 결제사가 있으면 서버가 켠 것 전부에서 찾는다(검수 계정 시험판은 화면에서 숨긴 시험 결제사도 고른다 — 서버가 다시 가린다).
    const 결제사 = pv ? await 모든결제사() : await providers();
    const 고른 = pv ? 결제사.find((p) => p.id === pv) : 결제사[0];
    if (!고른) return { ok: false, message: REASON.no_provider };

    if (고른.id === 'kakao') {
      // 서버가 주문을 열고(금액은 DB) 카카오 결제창 주소를 받아 온다. tid 는 서버 · DB 에만 있다.
      // 팝업을 쓰지 않고 페이지째 간다 — 토스와 같은 전체 이동이라 인앱 브라우저에서도 막히지 않는다.
      // 폰이면 모바일 주소(카카오톡이 열린다), 아니면 PC 주소(QR · 카카오톡 알림).
      const o = await post(Object.assign({ action: 'kopen', product: code, note: note || null }, intake ? { intake } : {}));
      if (!o || !o.ok) return { ok: false, message: say(o), reason: o && o.reason };
      if (intake && code === 'taekil') 붙음적기(o.orderId, intake);
      const 폰 = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      const 주소 = 폰 ? (o.mobile || o.pc) : (o.pc || o.mobile);
      if (!주소) return { ok: false, message: '카카오페이 결제창을 열지 못했습니다.' };
      global.location.href = 주소;
      return { ok: true };   // 페이지가 떠난다
    }

    if (고른.id === 'naver') {
      // 서버가 주문을 열고(금액은 DB) 결제창에 넘길 값을 준다. 결제창은 네이버 SDK 가 연다(openType 기본 page — 페이지째 이동).
      // 결제창의 금액은 브라우저가 들고 가지만, 돈은 승인(nconfirm) 때 빠지고 그때 서버가 네이버 응답의 금액 · 주문번호를 DB 와 맞춘다.
      const o = await post(Object.assign({ action: 'nopen', product: code, note: note || null }, intake ? { intake } : {}));
      if (!o || !o.ok) return { ok: false, message: say(o), reason: o && o.reason };
      if (intake && code === 'taekil') 붙음적기(o.orderId, intake);
      let N;
      try { N = await loadNaver(); } catch (e) {
        await post({ action: 'nfail', orderId: o.orderId, code: 'SDK', message: e.message }, true).catch(() => {});
        return { ok: false, message: e.message };
      }
      try {
        const oPay = N.Pay.create({ mode: o.naver.mode, clientId: o.naver.clientId, chainId: o.naver.chainId, payType: 'normal' });
        oPay.open({
          merchantPayKey: o.orderId, merchantUserKey: o.userKey, productName: o.name, productCount: 1,
          totalPayAmount: o.amount, taxScopeAmount: o.amount, taxExScopeAmount: 0, returnUrl: o.returnUrl,
          productItems: [{ categoryType: 'ETC', categoryId: 'ETC', uid: code, name: o.name, payReferrer: 'ETC', count: 1 }],
        });
      } catch (e) {
        await post({ action: 'nfail', orderId: o.orderId, code: 'SDK', message: String((e && e.message) || e) }, true).catch(() => {});
        return { ok: false, message: '네이버페이 결제창을 열지 못했습니다.' };
      }
      return { ok: true };   // 페이지가 떠난다
    }

    // ── 여기부터 토스 ──
    // 주문은 결제 직전에 연다 — 아래 두 갈래가 각자 부른다.
    // 출산택일 신청서(intake)는 주문을 연 바로 뒤 붙인다(카카오 kopen 과 같은 뜻 — 붙지 않으면 결제창을 열지 않는다).
    const 주문열기 = async () => {
      const o = await post({ action: 'open', product: code, note: note || null });
      if (!(o && o.ok && intake && code === 'taekil')) return o;
      const r = await 붙이기(o.orderId, intake);
      if (!(r && (r.ok || r.reason === 'already'))) return { ok: false, reason: 'no_intake' };
      붙음적기(o.orderId, intake);
      return o;
    };

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
    const 막힘 = async (e, orderId) => {
      if (orderId) await post({ action: 'fail', orderId,
                                code: (e && e.code) || 'CLOSED', message: (e && e.message) || '' }).catch(() => {});
      const closed = 닫힘(e);
      return { ok: false, closed, message: closed ? '' : ((e && e.message) || '결제창을 열지 못했습니다.') };
    };
    const 요청 = (o) => ({ orderId: o.orderId, orderName: o.name,
                           successUrl: BASE + '/pay-done.html', failUrl: BASE + '/pay-fail.html' });

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
      //
      // 주문은 **토스 창 안에서 「결제하기」를 누른 뒤에** 연다(2026-09-11). 창을 띄울 때 열었더니 창을 닫거나
      // 오류가 날 때마다 실패 주문이 한 줄씩 쌓여, 사장님이 테스트하는 사이 하루 한도(order_open 24시간 20건)에
      // 걸렸다 — 「오늘 연 주문이 너무 많습니다」. 창만 열었다 닫는 것은 주문이 아니다.
      // 창에 먼저 거는 금액은 상품표(state)의 값이다. 주문을 연 뒤 서버가 정한 금액과 다르면 setAmount 로 다시 맞춘다.
      // 어느 쪽이든 승인 때 order_check 가 DB 금액과 대조한다 — 여기 금액은 방어가 아니라 보여주는 값이다.
      const 상품 = (st.products || []).find((p) => p.code === code);
      if (!상품) return { ok: false, message: REASON.no_product };
      let win = null;
      const 치움 = () => Promise.resolve().then(() => win && win.destroy()).catch(() => {});
      try {
        const widgets = tp.widgets({ customerKey });
        await widgets.setAmount({ currency: 'KRW', value: 상품.amount });
        win = await widgets.renderPaymentWindow();
        return await new Promise((done) => {
          let 주문 = null, 누름 = false;
          win.on('paymentRequest', async () => {
            if (누름) return;   // 한 창에서 주문은 하나
            누름 = true;
            try {
              주문 = await 주문열기();
              if (!주문 || !주문.ok) { await 치움(); return done({ ok: false, message: say(주문) }); }
              if (주문.amount !== 상품.amount) await widgets.setAmount({ currency: 'KRW', value: 주문.amount });
              await widgets.requestPayment(요청(주문));
              done({ ok: true });   // 성공이면 페이지가 떠난다
            } catch (e) { await 치움(); done(await 막힘(e, 주문 && 주문.ok ? 주문.orderId : null)); }
          });
          // 창을 닫거나 그만두면 온다. 창은 한 번에 하나만 뜰 수 있어서 치워야 다음에 다시 연다.
          // 주문을 열기 전에 닫았으면 적을 것이 없다.
          win.on('cancel', async () => {
            await 치움();
            done(await 막힘({ code: 'CLOSED', message: '' }, 주문 && 주문.ok ? 주문.orderId : null));
          });
        });
      } catch (e) {
        await 치움();
        return 막힘(e, null);
      }
    }

    // API 개별 연동 키(ck)가 들어오면 예전 길 그대로 — 결제창(구버전), 카드.
    // 이 길은 창을 여는 순간 주문번호가 있어야 해서 먼저 연다.
    const opened = await 주문열기();
    if (!opened || !opened.ok) return { ok: false, message: say(opened) };
    try {
      await tp.payment({ customerKey }).requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: opened.amount },
        ...요청(opened),
        card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false },
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 것도 여기로 온다.
      return 막힘(e, opened.orderId);
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
    try { global.ChaeksaTrack && ChaeksaTrack.event && ChaeksaTrack.event('pay'); } catch (e) {}   // 깔때기 ④ 결제 단추 누름
    // 버튼 밑 안내(.nx-ft)는 덮지 않는다 — 제 자리를 따로 둔다.
    let 꼬리 = btn.nextElementSibling;
    if (!(꼬리 && 꼬리.classList.contains('pay-say'))) {
      꼬리 = document.createElement('p');
      꼬리.className = 'hint pay-say';
      btn.insertAdjacentElement('afterend', 꼬리);
    }
    // 청약철회 제한 동의(2026-09-22 점검 critic-2). 약관 9조는 「결제 화면에서 미리 안내하고 동의를 받는다」고 적었다.
    // 앱 결제 상자(app.js 결제상자)가 단추 위에 [필수] 칸을 두고 체크 전에는 단추를 잠근다 — 여기서 한 번 더 막는다.
    // 칸이 없는 화면에서 이 단추를 부르면 결제를 열지 않는다(동의 없이 결제되는 길을 남기지 않는다).
    const 동의칸 = document.querySelector('input[data-pay-agree="' + btn.id + '"]');
    if (!(동의칸 && 동의칸.checked)) {
      꼬리.textContent = '위 [필수] 칸에 체크해 주셔야 결제할 수 있어요.';
      if (동의칸) { try { 동의칸.focus(); } catch (e) {} }
      return { ok: false, reason: 'agree' };
    }
    const C = global.ChaeksaCloud;
    if (!(C && C.signedIn && C.signedIn())) {
      꼬리.innerHTML = '결제하시려면 먼저 로그인해 주세요 — 결제한 것을 그 계정에 매어 두어야 다른 기기에서도 열립니다. '
        + '<a href="#" class="pay-login"><b>카카오로 로그인 →</b></a>';
      const a = 꼬리.querySelector('.pay-login');
      if (a) a.onclick = (e) => {
        e.preventDefault();
        if (로그인) 로그인(); else if (C && C.로그인고르기) C.로그인고르기(); else if (C && C.signInWith) C.signInWith('kakao');
      };
      return { ok: false, reason: 'unauthenticated' };
    }
    const 원래 = btn.textContent;
    btn.dataset.label = 원래;   // 뒤로 가기로 되살아난 페이지에서 되돌릴 글(아래 pageshow)
    btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = '결제창을 여는 중…';
    꼬리.textContent = '';
    let r;
    try { r = await buy(code, note); } catch (e) { r = { ok: false, message: String((e && e.message) || e) }; }
    // 결제창으로 넘어가면 이 아래는 대개 안 돈다. 돌아왔다면 막힌 것이거나 창을 닫은 것이다.
    delete btn.dataset.busy; btn.disabled = false; btn.textContent = 원래;
    if (r && r.ok === false && !r.closed) 꼬리.textContent = (r.message || '결제창을 열지 못했습니다.') + (판 ? ' (화면 ' + 판 + ')' : '');
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

  /** 카카오페이 착지(pay-done.html?pv=kakao)에서 부른다. 로그인이 없어도 된다. 답의 모양은 confirm() 과 같다. */
  async function kconfirm(q) {
    const out = await post({ action: 'kconfirm', orderId: q.orderId, pgToken: q.pgToken }, true);
    if (!out || !out.ok) return { ok: false, message: say(out), code: out && out.code };
    return out;
  }

  /** 카카오페이 결제창에서 그만뒀거나 실패했을 때(pay-fail.html?pv=kakao). 서버가 카카오에 물어보고 닫는다. */
  async function kfail(q) {
    return await post({ action: 'kfail', orderId: q.orderId, why: q.why }, true);
  }

  /** 카카오페이 전액 환불 — 사장님(super) 계정만 된다(서버가 가린다). 다른 계정은 { ok:false, reason:'forbidden' }. */
  async function krefund(orderId) {
    return await post({ action: 'krefund', orderId });
  }

  /** 네이버페이 착지(pay-done.html?pv=naver … resultCode=Success&paymentId=…)에서 부른다. 로그인이 없어도 된다. 여기서 돈이 빠진다. */
  async function nconfirm(q) {
    const out = await post({ action: 'nconfirm', orderId: q.orderId, paymentId: q.paymentId }, true);
    if (!out || !out.ok) return { ok: false, message: say(out), code: out && out.code };
    return out;
  }
  /** 네이버페이 결제창에서 그만뒀거나 실패했을 때(resultCode 가 Success 가 아님) — 승인을 안 불렀으니 돈은 안 빠졌다. */
  async function nfail(q) {
    return await post({ action: 'nfail', orderId: q.orderId, code: q.code, message: q.message }, true);
  }
  /** 네이버페이 전액 환불 — 사장님(super) 계정만(서버가 가린다). */
  async function nrefund(orderId) {
    return await post({ action: 'nrefund', orderId });
  }

  /**
   * 출산택일 주문서를 그 주문에 붙인다(order_intake · server/migrate-23). 결제 뒤 pay-done 이 부른다.
   * 던지지 않는다 — 막히면 { ok:false, reason } 이고, 부르는 쪽이 「적은 그대로 메일로」로 물러난다.
   * 함수가 아직 없으면(migrate-23 전) 404 → reason 'missing'.
   */
  async function intake(orderId, data) {
    const C = global.ChaeksaCloud;
    try {
      const tok = C && C.token ? await C.token() : null;
      if (!tok) return { ok: false, reason: 'unauthenticated' };
      const cfg = global.CHAEKSA_SUPABASE;
      const r = await fetch(cfg.url + '/rest/v1/rpc/order_intake', {
        method: 'POST',
        headers: { apikey: cfg.anonKey, authorization: 'Bearer ' + tok,
                   'content-type': 'application/json' },
        body: JSON.stringify({ p_order: orderId, p_intake: data }),
      });
      if (!r.ok) return { ok: false, reason: r.status === 404 ? 'missing' : 'db' };
      const j = await r.json();
      return j && typeof j === 'object' ? j : { ok: false, reason: 'db' };
    } catch (_) {
      return { ok: false, reason: 'network' };
    }
  }

  // buy() 안에서는 인자 이름 intake 가 위 함수를 가린다 — 그 안에서는 이 이름으로 부른다.
  function 붙이기(orderId, data) { return intake(orderId, data); }
  /** kopen · open 에서 신청서가 그 주문에 붙었다 — 이 기기에 적어 둔다(결제 뒤 화면이 자동 보고서 길로 가는 표시). 초안은 결제가 끝난 뒤 지운다. */
  // auto 표시는 자동 보고서 길(켜는 날 CHAEKSA_TAEKIL_AUTO = 1 · 검수 계정)일 때만 단다 — 그 밖의 손님은 결제 뒤에도 지금 길(접수) 그대로.
  function 붙음적기(orderId, it) {
    const d = (it && it.원문) || it || {};
    let auto = global.CHAEKSA_TAEKIL_AUTO === 1;
    try { const U = global.ChaeksaUsage; if (U && U.plan && U.plan() === 'super') auto = true; } catch (_) {}
    try { localStorage.setItem('chaeksa.taekil.sent', JSON.stringify({ orderId, at: Date.now(), auto,
      data: { mail: d.mail, range: d.range, place: d.place, sex: d.sex, first: d.first } })); } catch (_) {}
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
  /** 화면에 적을 값 — 「출시 기념가 9,900원」 또는 「99,000원」. 상품 줄(products 표)을 받는다. */
  const 값 = (p) => (p && 값이름[p.code] ? 값이름[p.code] + ' ' : '') + won(p && p.amount);

  // ── 내 결제(10-02 개편 3묶음) ──
  // 주문번호는 결제 완료 화면(pay-done)에서 한 번만 보였고 다시 볼 곳이 없었다. 설정 창 「내 결제」(index.html #myPayList · app.js openSettings)가
  // 로그인한 본인 주문(my_orders — 행 수준 보안으로 본인 것만, 2년 안)을 줄마다 보인다: 상품 · 값 · 결제한 날 · 주문번호 · 언제까지 보나 · 환불 문의.
  // 상품 이름 · 보관(「N년 동안」) · 만드는 때는 상품 약속 장부(yaksok.js)에서 읽는다 — 장부에 없는 옛 상품은 주문에 적힌 이름만.
  // 결제를 끝내지 않은 것(open · failed)은 산 것이 아니라 뺀다. 환불한 것(canceled — 환불만 이 상태로 바뀐다, migrate-33)은 「환불했어요」로 남긴다.
  // 환불 문의 메일에는 주문번호 · 상품 · 결제한 날 · 값만 싣는다 — 생년월일 · 누구 것인지 가리는 표시(note)는 싣지 않는다.
  const 날짜글 = (d) => d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  /** my_orders 줄 → 화면 줄 [{id, 이름, 값, 날, 기간, 자리, 영수증, 메일, 환불됨}]. 지금(Date)은 시험용 — 없으면 지금. */
  function 내결제줄(rows, 지금) {
    const Y = global.ChaeksaYaksok, now = 지금 || new Date();
    return (Array.isArray(rows) ? rows : []).filter((r) => r && (r.status === 'paid' || r.status === 'canceled')).map((r) => {
      const id = String(r.id || '');
      const code = r.product || (id.match(/^ck_([a-z_]+?)_\d{14}_/) || [])[1] || '';
      const 줄 = (Y && Y.줄 && Y.줄(code)) || null;
      const 이름 = (줄 && 줄.상품이름) || r.name || code || '상품';
      const at = new Date(r.paidAt || r.at), 날 = isNaN(at) ? null : at;
      const 환불됨 = r.status === 'canceled';
      const 해 = 줄 && 줄.보관 ? Number((String(줄.보관).match(/(\d+)\s?년\s?동안/) || [])[1] || 0) : 0;
      let 기간 = '', 자리 = '';
      // 10-02 출산택일 — 보고서는 주문마다 「내 보고서」 쪽(taekil-report.html?o=)에서 본다. 장부 보관(결제일부터 2년)이 들어와도 이 주소를 지킨다
      // (장부 자리는 결제하는 자리 taekil-apply.html 이라 「보러 가기」로 쓰면 신청서로 간다). 기간이 끝나면 보고서 쪽도 닫힌다(my_taekil 2년).
      const 보고서자리 = code === 'taekil' && !환불됨 ? 'taekil-report.html?o=' + encodeURIComponent(id) : '';
      if (환불됨) 기간 = '환불했어요.';
      else if (해 && 날) {
        const 끝 = new Date(날.getTime()); 끝.setFullYear(끝.getFullYear() + 해);
        const 남은 = Math.ceil((끝 - now) / 864e5);
        if (남은 > 0) { 기간 = 날짜글(끝) + '까지 볼 수 있어요 · ' + 남은 + '일 남았어요.'; 자리 = 보고서자리 || 줄.자리 || ''; }
        else 기간 = '볼 수 있는 기간(결제한 날부터 ' + 해 + '년)이 끝났어요.';
      } else {
        자리 = 보고서자리;
        if (줄 && !줄.보관 && Y.만듦글) 기간 = Y.만듦글(code);   // 장부에 보관이 없는 상품 — 만드는 때 글
      }
      const 값글 = r.amount ? won(r.amount) : '';
      const 본문 = ['주문번호: ' + id, '상품: ' + 이름, '결제한 날: ' + (날 ? 날짜글(날) : '-'), '값: ' + (값글 || '-'), '',
        (환불됨 ? '궁금한 것을 아래에 적어 주세요.' : '환불을 원하시거나 결제에 대해 궁금한 것을 아래에 적어 주세요.'), ''];
      const 메일 = 'mailto:' + 문의메일 + '?subject=' + encodeURIComponent('[책사] ' + (환불됨 ? '결제 문의 ' : '환불 문의 ') + id)
        + '&body=' + encodeURIComponent(본문.join('\r\n'));
      return { id, 이름, 값: 값글, 날: 날 ? 날짜글(날) : '', 기간, 자리,
               영수증: /^https:\/\//.test(r.receipt || '') ? r.receipt : '', 메일, 환불됨 };
    });
  }
  /** box 에 내 결제 목록을 그린다. rows = mine() 결과(null 이면 「못 불러왔어요」 — 산 게 없다는 말과 가른다). */
  function 내결제그리기(box, rows, 지금) {
    if (!box) return;
    if (rows === null) {
      box.innerHTML = '<p class="hint" style="margin:0">결제 기록을 불러오지 못했어요. 인터넷 연결을 확인하고 설정을 다시 열어 주세요. '
        + '계속 안 되면 ' + 글(문의메일) + ' 으로 알려 주세요.</p>';
      return;
    }
    const 줄들 = 내결제줄(rows, 지금);
    if (!줄들.length) {
      box.innerHTML = '<p class="hint" style="margin:0">이 계정으로 결제한 것이 없어요. 다른 계정으로 결제하셨다면 그 계정으로 로그인해 주세요.</p>';
      return;
    }
    const 단추 = (href, 말, 새창) => '<a class="btn-ghost" style="text-decoration:none" href="' + 글(href) + '"'
      + (새창 ? ' target="_blank" rel="noopener"' : '') + '>' + 글(말) + '</a>';
    box.innerHTML = 줄들.map((x) => '<div class="my-pay-row" data-order="' + 글(x.id) + '" style="padding:10px 0;border-top:1px solid var(--line)">'
      + '<p style="margin:0;font-size:var(--t2);line-height:1.6;color:var(--ink)"><b>' + 글(x.이름) + '</b>' + (x.값 ? ' · ' + 글(x.값) : '') + '</p>'
      + '<p class="hint" style="margin:2px 0 0">' + (x.날 ? 글(x.날) + ' 결제 · ' : '') + '주문번호 <span style="user-select:all;word-break:break-all">' + 글(x.id) + '</span></p>'
      + (x.기간 ? '<p class="hint" style="margin:2px 0 0">' + 글(x.기간) + '</p>' : '')
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">'
      + (x.자리 ? 단추(x.자리, '보러 가기') : '') + (x.영수증 ? 단추(x.영수증, '영수증', true) : '')
      + 단추(x.메일, x.환불됨 ? '문의하기' : '환불 문의') + '</div></div>').join('')
      + '<p class="hint" style="margin:10px 0 0">「환불 문의」를 누르면 주문번호를 적어 둔 메일이 열려요(' + 글(문의메일) + '). '
      + '<a href="terms.html#refund" target="_blank" rel="noopener" style="color:var(--accent)">환불 규정</a></p>';
  }
  /** 설정 창 「내 결제」 — 열 때마다 my_orders 를 새로 읽는다(결제 직후 · 환불 뒤에도 맞게). 로그인 전이면 빈 목록. */
  async function 내결제(box) {
    if (!box) return;
    box.innerHTML = '<p class="hint" style="margin:0">결제 기록을 불러오는 중…</p>';
    내결제그리기(box, await mine());
  }

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
  // 결제창에서 뒤로 가기로 돌아오면 iOS 사파리·카카오톡·네이버 인앱은 페이지를 통째로 되살린다 —
  // 그러면 여는 중이던 단추가 「결제창을 여는 중…」에 멈춰 있다. 되살아난 페이지면 풀어 준다(2026-09-11 검토).
  global.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.querySelectorAll('[data-busy]').forEach((b) => {
      b.disabled = false; if (b.dataset.label) b.textContent = b.dataset.label; delete b.dataset.busy;
    });
  });

  // ── 출산택일 신청서 ─────────────────────────────────────────────
  // 신청 페이지(taekil-apply.html)와 결제 뒤 화면(pay-done.html)이 **같은 틀**을 쓴다 — 두 벌이면 어긋난다.
  // 칸은 택일상담 순서를 따른다: 기간·지역·성별·시간대 · 원하시는 방향 · 가족 생년월일시(10-02 바깥 신청 폼을 걷고 신청은 이 틀 하나).
  // 가족 정보는 거르는 체라 선택이다(없어도 보고서가 나온다). 어디서 받았는지는 묻지 않는다
  // (받아 둔 날짜는 적어 주시면 나란히 비교한다). 병원이 말한 날짜는 의학 판단이라 그 안에서만 본다.
  // 적는 동안 이 기기에 초안으로 둔다 — 카카오 로그인이나 결제창을 다녀와도 다시 쓰지 않게(2026-09-11
  // 사장님 「결제하러 가기가 너무 빡세고 어지러워」). 접수되면 지우고, 접수된 것은 주문번호로 기억한다.
  const 문의메일 = 'dl4431@naver.com';
  const 초안키 = 'chaeksa.taekil.draft', 보낸키 = 'chaeksa.taekil.sent';
  const 초안수명 = 3 * 24 * 3600 * 1000;   // 사흘 지난 초안은 스스로 붙이지 않는다(남의 기기·옛 신청일 수 있다)
  const 글 = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const 읽기 = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
  const 쓰기 = (k, v) => {
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
  };
  const 칸 = (id, 이름, 꼭, 예, 메일) => '<label for="' + id + '">' + 이름 + (꼭 ? ' <em>필수</em>' : '') + '</label>'
    + '<input id="' + id + '"' + (메일 ? ' type="email" autocomplete="email" inputmode="email"' : '')
    + ' maxlength="200" placeholder="' + 글(예) + '">';
  const 고르기 = (id, 이름, 갈래) => '<label>' + 이름 + '</label><div class="seg" id="' + id + '">'
    + 갈래.map((g) => '<button type="button" data-v="' + 글(g[0]) + '">' + 글(g[1]) + '</button>').join('') + '</div>';
  // 재물과 자리는 따로 묻는다 — 「재관」이라 해도 재물 쪽인지 관직 쪽인지에 따라 답이 갈린다(택일상담). 둘 다 재관 저울.
  const 앞세움 = [['무난', '두루 무난하게'], ['재물', '재물'], ['자리', '자리(직업·지위)'],
                 ['건강', '건강'], ['학업', '공부'], ['가족', '가족 화목']];
  const 성별 = [['남아', '남아'], ['여아', '여아'], ['모름', '아직 몰라요']];
  // 「이렇게 읽었어요」 한 줄 자리(10-02 설계서 2-2) — 칸 밑에 둔다. 읽개(taekil-read.js)가 있는 쪽에서만 채운다(주문서.읽기켜기).
  const 읽줄 = (k) => '<p class="tk-read" data-read="' + k + '" hidden></p>';
  // 칸 id → 신청서 열쇠(값() · 켜기 · 채우기가 같이 쓴다)
  const 칸짝 = { i_mail: 'mail', i_range: 'range', i_hosp: 'hospital', i_place: 'place', i_time: 'time',
                i_have: 'have', i_dad: 'father', i_mom: 'mother', i_sib: 'siblings', i_wish: 'wish', i_ask: 'ask' };
  let _사슬 = null;   // 시뮬레이터 엔진 사슬을 늦게 싣는 약속(신청서 미리 셈 · 보고서 명식 카드) — 한 번만
  const 주문서 = {
    /** 칸들만 돌려준다. 감싸는 form·제목·보내기 단추는 쓰는 쪽이 둔다(신청 페이지는 사이에 동의 칸이 있다). */
    틀() {
      // 10-02 자동 보고서 — 보고서는 「내 보고서」에서 연다. 메일은 확인 · 연락용이라 칸 이름도 그 말로.
      return 칸('i_mail', '연락받으실 메일 주소', true, 'name@example.com', true)
        + 칸('i_range', '출산 예정 기간', true, '예) 2026년 10월 3일 ~ 17일') + 읽줄('range') + 읽줄('due')
        + 칸('i_hosp', '병원이 말한 수술 가능 날짜', false, '예) 10월 8일 또는 10일 — 없으면 비워 두세요') + 읽줄('hospital')
        + '<p class="hint">날짜는 의사가 정합니다. 병원이 말한 범위 안에서만 봅니다.</p>'
        // 이미 받아 둔 택일을 교차검증하러 오는 분이 많다(택일상담 — 두 건 다 그 경로였다).
        // 묻지 않는 것은 「어디서」 받았는지다. 「무엇을」 받았는지는 적어 주시면 비교해 드린다.
        + 칸('i_have', '이미 받아 두신 날짜·시간', false, '있으면 — 예) 10월 8일 오전 10시') + 읽줄('have')
        + '<p class="hint">받으신 날짜가 틀렸다고 하지 않습니다. 저희 기준으로는 어떻게 나오는지 나란히 보여 드립니다.</p>'
        + 칸('i_place', '태어날 지역', true, '예) 경기도 성남 — 시·군까지면 됩니다') + 읽줄('place')
        + 고르기('i_sex', '아이 성별', 성별)
        + 칸('i_time', '수술 가능한 시간대', false, '예) 평일 09시 ~ 19시') + 읽줄('time')
        + '<div class="check"><input type="checkbox" id="i_weekend">'
        +   '<label for="i_weekend" style="margin:0">주말도 가능해요</label></div>'
        // 10-02 사장님 「앞세우신 ✗ → 원하시는 방향 ○」 — 칸 이름만 바꾼다. 고르는 보기는 그대로.
        + 고르기('i_first', '원하시는 방향', 앞세움)
        + 칸('i_dad', '아버지 생년월일시', false, '예) 1994년 12월 10일 오후 3시 10분 · 양력') + 읽줄('father')
        + 칸('i_mom', '어머니 생년월일시', false, '예) 1990년 2월 10일 오전 7시 30분 · 양력') + 읽줄('mother')
        + 칸('i_sib', '형제자매 생년월일', false, '있으면 — 예) 2023년 5월 2일 · 양력') + 읽줄('siblings')
        + '<p class="hint">가족 정보는 아이와 가족이 서로 부딪히는 날을 걸러 내는 데만 씁니다. 모르시면 비워 두셔도 보고서는 나옵니다.</p>'
        + '<label for="i_wish">바라는 점</label>'
        + '<textarea id="i_wish" maxlength="1500" placeholder="예) 자기 길이 뚜렷하고, 가족과 화목했으면"></textarea>'
        + '<label for="i_ask">궁금한 점</label>'
        + '<textarea id="i_ask" maxlength="1500"></textarea>'
        + 읽줄('count');
    },
    값(root) {
      const v = (id) => { const el = root.querySelector('#' + id); return el ? String(el.value || '').trim() : ''; };
      const s = (id) => { const el = root.querySelector('#' + id); return (el && el.dataset.v) || ''; };
      const w = root.querySelector('#i_weekend');
      return { mail: v('i_mail'), range: v('i_range'), hospital: v('i_hosp'), place: v('i_place'),
               sex: s('i_sex'), time: v('i_time'), weekend: !!(w && w.checked), first: s('i_first'),
               have: v('i_have'), father: v('i_dad'), mother: v('i_mom'), siblings: v('i_sib'),
               wish: v('i_wish'), ask: v('i_ask') };
    },
    빈칸(d) {
      const 빈 = [];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((d && d.mail) || '')) 빈.push('메일 주소');
      if (!(d && d.range)) 빈.push('출산 예정 기간');
      if (!(d && d.place)) 빈.push('태어날 지역');
      // 10-02 설계서 2-2 — 읽개가 실린 쪽이면 「못 읽은 것」도 막는다: 기간 · 곳을 못 읽음 · 기간이 31일을 넘음 · 지난 날짜 ·
      // 가족 칸에 글은 있는데 날짜를 못 읽음. 빈 칸은 위에서 이미 셌다(같은 칸을 두 번 적지 않는다).
      const 읽 = 주문서.읽기(d);
      if (읽) 읽.줄.forEach((z) => {
        if (!z.막힘 || ((z.칸 === 'range' || z.칸 === 'place') && !(d && d[z.칸]))) return;
        빈.push(z.이름 + '(' + z.말 + ')');
      });
      return 빈;
    },
    /** 읽개(taekil-read.js · places.js)가 실린 쪽이면 신청서를 읽은 값, 아니면 null. 판정은 없다 — 날짜 · 곳 · 시각 글을 값으로 읽기만. */
    읽기(d, 오늘) {
      const R = global.ChaeksaTaekilRead;
      if (!R || !R.읽기 || !global.ChaeksaPlaces) return null;
      try { return R.읽기(d || {}, 오늘 ? { 오늘 } : undefined); } catch (_) { return null; }
    },
    /** 주문에 붙일 신청서 — 적은 그대로(원문) + 「이렇게 읽었어요」 줄(읽은). 서버는 원문만 다시 읽는다(읽은 값은 사장님 확인용).
     *  order_intake 한도(8000자) 안으로 — 넘으면 읽은 줄을 뺀다. */
    신청서(d) {
      const 원문 = Object.assign({}, d || {});
      const 읽 = 주문서.읽기(원문);
      const out = { 원문 };
      if (읽) out.읽은 = { 판: 읽.판, 오늘: 읽.오늘, 줄: 읽.줄.map((z) => ({ 칸: z.칸, 말: String(z.말 || '').slice(0, 160), 막힘: !!z.막힘 })) };
      if (JSON.stringify(out).length > 7600) delete out.읽은;
      return out;
    },
    /** 칸마다 밑에 「이렇게 읽었어요」 한 줄을 단다(적을 때마다 다시 읽는다). 읽개가 없는 쪽이면 아무것도 안 한다.
     *  opt.셈 = (n) => … 이면 기간 · 곳이 읽힐 때 시뮬레이터 엔진으로 「두 고전에 걸리지 않는 시각」 수를 미리 센다(가족 · 병원 거르기 전).
     *  센 값은 root.dataset.cands 에도 남긴다(0 이면 결제를 막는 쪽이 읽는다). 엔진 사슬은 쪽의 template#tkChain 에서 늦게 싣는다. */
    읽기켜기(root, opt) {
      if (!root || !주문서.읽기({})) return;
      opt = opt || {};
      let 째깍 = null, 셈열쇠 = '', 셈차 = 0;
      const 줄칸 = (k) => root.querySelector('.tk-read[data-read="' + k + '"]');
      const 그리기 = () => {
        const d = 주문서.값(root), r = 주문서.읽기(d);
        if (!r) return;
        const 본칸 = {};
        r.줄.forEach((z) => { 본칸[z.칸] = z; });
        ['range', 'hospital', 'have', 'place', 'time', 'father', 'mother', 'siblings', 'due'].forEach((k) => {
          const el = 줄칸(k); if (!el) return;
          const z = 본칸[k], 적음 = k === 'due' ? !!z : !!String(d[k] || '').trim();
          el.hidden = !(z && 적음);
          if (el.hidden) return;
          el.textContent = '이렇게 읽었어요 — ' + z.말;
          el.classList.toggle('bad', !!z.막힘);
        });
        const 셈칸 = 줄칸('count');
        if (!셈칸 || !opt.셈) return;
        const 됨 = r.기간 && r.곳 && !r.줄.some((z) => (z.칸 === 'range' || z.칸 === 'place') && z.막힘);
        if (!됨) { 셈칸.hidden = true; 셈열쇠 = ''; delete root.dataset.cands; opt.셈(null); return; }
        const 열쇠 = r.기간.첫날 + '|' + r.기간.끝날 + '|' + r.곳.값;
        if (열쇠 === 셈열쇠) return;
        셈열쇠 = 열쇠; const 차 = ++셈차;
        셈칸.hidden = false; 셈칸.classList.remove('bad'); 셈칸.textContent = '이 기간을 미리 세는 중…';
        주문서.미리셈(r.기간, r.곳.값).then((n) => {
          if (차 !== 셈차) return;   // 그 사이 칸이 또 바뀌었다
          if (n == null) { 셈칸.hidden = true; delete root.dataset.cands; opt.셈(null); return; }
          root.dataset.cands = String(n);
          셈칸.classList.toggle('bad', n === 0);
          셈칸.textContent = n === 0
            ? '이 기간에는 두 고전에 걸리지 않는 시각이 없어요. 기간을 넓혀 주세요.'
            : '이 기간에 두 고전에 걸리지 않는 시각이 ' + n + '곳 있어요(가족 · 병원 시간으로 거르기 전).';
          opt.셈(n);
        });
      };
      const 곧 = () => { clearTimeout(째깍); 째깍 = setTimeout(그리기, 250); };
      root.addEventListener('input', 곧);
      root.addEventListener('change', 곧);
      root.addEventListener('click', (e) => { if (e.target && e.target.closest && e.target.closest('.seg button')) 곧(); });
      그리기();
    },
    /** 기간 안 모든 날 모든 시각에서 두 고전에 걸리지 않는 시각 수(시뮬레이터 엔진 ChaeksaTaekilSim.하루 그대로 — 판정은 엔진이 한다).
     *  성별은 이 셈에 쓰이지 않아 남아로 센다. 엔진을 못 실으면 null. */
    async 미리셈(기간, 곳값) {
      if (!(await 주문서.사슬싣기())) return null;
      try {
        const S = global.ChaeksaTaekilSim, 풀 = (s) => s.split('-').map(Number);
        const [y0, m0, d0] = 풀(기간.첫날), [y1, m1, d1] = 풀(기간.끝날);
        let n = 0;
        for (let t = Date.UTC(y0, m0 - 1, d0), 끝 = Date.UTC(y1, m1 - 1, d1); t <= 끝; t += 864e5) {
          const x = new Date(t);
          await new Promise((ok) => setTimeout(ok, 0));   // 하루씩 숨을 돌린다 — 긴 기간에 화면이 굳지 않게
          n += S.하루(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate(), 'M', 곳값).rows.filter((r) => r.본 && r.본.없음).length;
        }
        return n;
      } catch (_) { return null; }
    },
    /** 시뮬레이터 엔진 사슬(places → … → taekilsim)을 쪽의 template#tkChain 차례대로 늦게 싣는다. 이미 있으면 바로 true. */
    사슬싣기() {
      if (global.ChaeksaTaekilSim && global.ChaeksaTaekilSim.하루 && global.ChaeksaEngine) return Promise.resolve(true);
      if (_사슬) return _사슬;
      const t = document.getElementById('tkChain');
      if (!t || !t.content) return Promise.resolve(false);
      const 이름 = (s) => String(s || '').split('?')[0];
      const 있음 = new Set(Array.from(document.querySelectorAll('script[src]')).map((s) => 이름(s.getAttribute('src'))));
      const srcs = Array.from(t.content.querySelectorAll('script[src]')).map((s) => s.getAttribute('src')).filter((s) => !있음.has(이름(s)));
      _사슬 = srcs.reduce((p, src) => p.then(() => new Promise((ok, no) => {
        const s = document.createElement('script'); s.src = src; s.async = false;
        s.onload = ok; s.onerror = () => no(new Error(src)); document.head.appendChild(s);
      })), Promise.resolve()).then(() => !!(global.ChaeksaTaekilSim && global.ChaeksaTaekilSim.하루)).catch(() => { _사슬 = null; return false; });
      return _사슬;
    },
    /** 받은 신청서(원문)를 칸에 그대로 채운다 — 사장님 목록 「신청서 고치기 · 대신 넣기」. 초안은 건드리지 않는다. */
    채우기(root, d) {
      d = d || {};
      Object.keys(칸짝).forEach((id) => { const el = root.querySelector('#' + id); if (el) el.value = d[칸짝[id]] == null ? '' : String(d[칸짝[id]]); });
      const w = root.querySelector('#i_weekend'); if (w) w.checked = !!d.weekend;
      [['i_sex', 'sex'], ['i_first', 'first']].forEach(([id, 열쇠]) => {
        const box = root.querySelector('#' + id); if (!box) return;
        const 켬 = (v) => { box.dataset.v = v || ''; box.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)); };
        켬(d[열쇠] || '');
        if (!box.dataset.wiredFill) { box.dataset.wiredFill = '1'; box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => 켬(b.dataset.v))); }
      });
    },
    /** 초안을 칸에 채우고, 고르는 칸을 켜고, 적을 때마다 초안을 남긴다. */
    켜기(root) {
      const 채울 = 주문서.초안() || {};
      const 짝 = 칸짝;
      Object.keys(짝).forEach((id) => {
        const el = root.querySelector('#' + id);
        if (el && 채울[짝[id]]) el.value = 채울[짝[id]];
      });
      const w = root.querySelector('#i_weekend'); if (w) w.checked = !!채울.weekend;
      if (!채울.mail) {   // 로그인한 계정에 메일이 있으면 미리 채운다(카카오 로그인은 없을 수 있다)
        try {
          const C = global.ChaeksaCloud, em = C && typeof C.email === 'function' && C.email();
          const el = root.querySelector('#i_mail');
          if (el && em && /@/.test(em)) el.value = em;
        } catch (_) {}
      }
      // 동의는 칸이 아니라 값()에 없다 — 앞서 남긴 동의가 있으면 이어 붙인다(검토: 한 글자만 고쳐도 동의가 지워졌다).
      const 남김 = () => {
        const d = 주문서.값(root), 옛 = 주문서.초안();
        if (옛 && 옛.consent) d.consent = 옛.consent;
        쓰기(초안키, { data: d, at: Date.now() });
      };
      [['i_sex', 'sex'], ['i_first', 'first']].forEach(([id, 열쇠]) => {
        const box = root.querySelector('#' + id); if (!box) return;
        const 켬 = (v) => {
          box.dataset.v = v || '';
          box.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
        };
        켬(채울[열쇠]);
        box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { 켬(b.dataset.v); 남김(); }));
      });
      root.addEventListener('input', 남김);
      root.addEventListener('change', 남김);
    },
    초안() {
      const j = 읽기(초안키);
      // 지난 초안은 읽지 않을 뿐 아니라 지운다 — 「임시로」 둔다고 적어 두었다(개인정보처리방침).
      if (j && (!j.data || (Date.now() - (j.at || 0)) >= 초안수명)) { 쓰기(초안키, null); return null; }
      return j ? j.data : null;
    },
    초안지움: () => 쓰기(초안키, null),
    초안저장: (d) => 쓰기(초안키, { data: d, at: Date.now() }),
    /** 접수된 것을 주문번호로 기억한다 — 결제 뒤 화면을 새로고침해도 빈 양식이 아니라 「접수됐습니다」가 뜨게. */
    // 접수 확인 화면에 보일 요약만 30일 남긴다 — 가족 생년월일시 같은 것은 접수 뒤 기기에 두지 않는다(검토).
    보냄(orderId) {
      const j = 읽기(보낸키);
      if (j && Date.now() - (j.at || 0) > 30 * 24 * 3600 * 1000) { 쓰기(보낸키, null); return null; }
      return j && j.orderId === orderId ? j.data : null;
    },
    보냄기록: (orderId, d) => 쓰기(보낸키, { orderId, at: Date.now(),
      data: { mail: d.mail, range: d.range, place: d.place, sex: d.sex, first: d.first } }),
    최근보냄: () => 읽기(보낸키),
    /** 이 기기에서 결제창을 열 때 신청서가 이 주문에 붙었나(buy 의 intake — 10-02 자동 보고서 길). */
    자동붙음(orderId) { const j = 읽기(보낸키); return !!(j && j.auto && j.orderId === orderId && Date.now() - (j.at || 0) < 30 * 24 * 3600 * 1000); },
    /** 저장이 막힌 이유를 손님 말로. 영어 코드를 그대로 보이지 않는다. */
    이유(r) {
      return ({ unauthenticated: '로그인이 풀렸습니다 — 다시 로그인한 뒤 보내 주세요',
                network: '인터넷 연결이 끊겼습니다', missing: '저장소가 아직 준비되지 않았습니다',
                bad_request: '내용이 너무 깁니다 — 바라는 점·궁금한 점을 줄여 주세요',
                no_order: '이 주문을 찾지 못했습니다' })[r && r.reason] || '저장하는 데 문제가 생겼습니다';
    },
    // 신청서 내용 이용 동의 — 신청 페이지와 결제 뒤 화면이 같은 말을 쓴다. 건강과 이어진 내용이 있어 따로 받는다.
    동의문: '[필수] 건강과 이어진 정보(출산 예정 기간, 병원이 말한 수술 가능 날짜·시간대)와 가족의 생년월일시를 '
      + '출산택일 보고서를 만들어 드리는 데만 쓰는 것에 동의합니다. 동의하지 않으시면 보고서를 만들 수 없습니다. '
      + '(<a href="privacy.html" target="_blank" rel="noopener">개인정보처리방침</a>)',
    앞세움이름: (v) => (앞세움.find((g) => g[0] === v) || [])[1] || '',
    메일초안(orderId, d) {
      const 줄 = ['주문번호: ' + orderId, '받으실 메일: ' + d.mail, '출산 예정 기간: ' + d.range,
        '병원이 말한 날짜: ' + (d.hospital || '없음'), '이미 받아 둔 날짜: ' + (d.have || '-'),
        '태어날 지역: ' + d.place,
        '아이 성별: ' + (d.sex || '미정'),
        '수술 가능한 시간대: ' + (d.time || '-') + (d.weekend ? ' · 주말 가능' : ''),
        '원하시는 방향: ' + (주문서.앞세움이름(d.first) || '-'),
        '아버지: ' + (d.father || '-'), '어머니: ' + (d.mother || '-'), '형제자매: ' + (d.siblings || '-'),
        '바라는 점: ' + (d.wish || '-'), '궁금한 점: ' + (d.ask || '-')];
      return 'mailto:' + 문의메일 + '?subject=' + encodeURIComponent('[책사] 출산택일 신청서 ' + orderId)
        + '&body=' + encodeURIComponent(줄.join('\n'));
    },
    /** 신청서를 메일 글로(10-02 — 결제가 열리기 전 메일 신청 · 「신청서 내용 복사」). d 가 없으면 칸 이름만 남는다(손님이 채운다). */
    메일글(d) {
      d = d || {};
      const 값 = (v) => (v == null ? '' : String(v).trim());
      const 성 = (성별.find((g) => g[0] === d.sex) || [])[1] || '';
      return ['연락받으실 메일 주소: ' + 값(d.mail), '출산 예정 기간: ' + 값(d.range),
        '병원이 말한 수술 가능 날짜: ' + 값(d.hospital), '이미 받아 두신 날짜·시간: ' + 값(d.have),
        '태어날 지역(시·군): ' + 값(d.place), '아이 성별(남아 · 여아 · 아직 몰라요): ' + 성,
        '수술 가능한 시간대: ' + 값(d.time), '주말도 가능한지: ' + (d.weekend ? '가능해요' : ''),
        '원하시는 방향(두루 무난 · 재물 · 자리 · 건강 · 공부 · 가족 화목): ' + 주문서.앞세움이름(d.first),
        '아버지 생년월일시(양력/음력): ' + 값(d.father), '어머니 생년월일시(양력/음력): ' + 값(d.mother),
        '형제자매 생년월일: ' + 값(d.siblings), '바라는 점: ' + 값(d.wish), '궁금한 점: ' + 값(d.ask)].join('\n');
    },
    /** 메일로 신청하기(결제가 열리기 전) — 제목 「[책사] 출산택일 신청」 · 본문은 칸 이름만. */
    신청메일() {
      return 'mailto:' + 문의메일 + '?subject=' + encodeURIComponent('[책사] 출산택일 신청')
        + '&body=' + encodeURIComponent(주문서.메일글(null) + '\n');
    },
    문의메일,
  };

  // ── 출산택일 자동 보고서(10-02 설계서 ⑤) ─────────────────────────
  // 만들기는 비공개 서버(/api/taekil-report — 엔진 · 고르기 · AI 두 칸 · 누락 검사)가 하고, 보관 · 상태 · 보기는 Supabase 함수(server/migrate-36)로만 닿는다.
  // 보고서 표(taekil_reports)는 손님이 REST 로 읽지 못한다 — 손님은 taekil_view 로, 열렸을(ready) 때만 본문을 받는다.
  // 이 파일엔 판정 · 고르기 · 문장 틀이 없다. 상태 이름은 migrate-36 머리 주석 「손님」 그대로: todo · no_intake · making · checking · ready · canceled.
  const TK_API = 'https://chaeksa-behavior-core.vercel.app/api/taekil-report';
  async function 택일함수(name, args) {
    const C = global.ChaeksaCloud, cfg = global.CHAEKSA_SUPABASE;
    let tok = null;
    try { tok = C && C.token ? await C.token() : null; } catch (_) { tok = null; }
    if (!tok || !cfg) return { ok: false, reason: 'login' };
    try {
      const r = await fetch(cfg.url + '/rest/v1/rpc/' + name, {
        method: 'POST',
        headers: { apikey: cfg.anonKey, authorization: 'Bearer ' + tok, 'content-type': 'application/json' },
        body: JSON.stringify(args || {}),
      });
      if (r.status === 404) return { ok: false, reason: 'missing' };   // migrate-36 을 돌리기 전
      if (!r.ok) return { ok: false, reason: r.status === 401 || r.status === 403 ? 'login' : 'db' };
      return await r.json();
    } catch (_) { return { ok: false, reason: 'network' }; }
  }
  const taekil = {
    /** 내 출산택일 주문들 [{ id, name, paidAt, range, state, openedAt }] — 로그인 안 했으면 [], 못 물어봤으면 null. */
    async mine() {
      const C = global.ChaeksaCloud;
      if (!C || !C.signedIn || !C.signedIn()) return [];
      const j = await 택일함수('my_taekil', {});
      return Array.isArray(j) ? j : null;
    },
    /** 보고서 한 벌. 손님은 { ok, orderId, state, report? } — report 는 ready 일 때만. 검수 계정은 사장님 몫 전부(손님눈 = true 면 손님이 받을 것만). */
    view: (orderId, 손님눈) => 택일함수('taekil_view', { p_order: String(orderId || ''), p_as_customer: !!손님눈 }),
    /** 보고서를 만든다(비공개 서버 — 보통 1~2분). 'M-' 로 시작하는 id 는 수기 줄(검수 계정만). → { ok:true, state } | { ok:false, reason, message } */
    async make(id) {
      const C = global.ChaeksaCloud;
      let tok = null;
      try { tok = C && C.token ? await C.token() : null; } catch (_) { tok = null; }
      if (!tok) return { ok: false, reason: 'login', message: '로그인해 주세요.' };
      const body = /^M-/.test(String(id || '')) ? { manualId: String(id) } : { orderId: String(id || '') };
      try {
        const r = await fetch(TK_API, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify(body) });
        const j = await r.json().catch(() => ({}));
        if (r.ok) return { ok: true, state: j.state || 'held' };
        return { ok: false, status: r.status, reason: j.reason || '', message: j.error || '잠시 뒤 다시 해 주세요.' };
      } catch (_) {
        return { ok: false, reason: 'network', message: '연결이 끊겼어요. 잠시 뒤 다시 해 주세요.' };
      }
    },
    // 사장님 목록(taekil-admin.html) — 함수 안에서 검수 계정(ai_plan() = 'super')인지 본다. 화면이 가리는 것은 편의일 뿐이다.
    adminList: (filter) => 택일함수('taekil_admin_list', { p_filter: filter || null, p_limit: 200 }),
    adminRelease: (id) => 택일함수('taekil_admin_release', { p_order: id }),
    adminRedo: (id) => 택일함수('taekil_admin_redo', { p_order: id }),
    adminIntake: (id, it) => 택일함수('taekil_admin_intake', { p_order: id, p_intake: it }),
    adminManual: (it, note) => 택일함수('taekil_admin_manual', { p_intake: it, p_note: note || null }),
    adminNote: (id, note) => 택일함수('taekil_admin_note', { p_order: id, p_note: note || '' }),
    adminAuto: (on) => 택일함수('taekil_admin_auto', { p_on: on == null ? null : !!on }),
    /** 손님 눈의 상태 → 화면 한 줄(작가 검수 대상) */
    상태말: {
      todo: '결제가 확인됐어요. 이제 보고서를 만들어요.',
      no_intake: '결제는 됐는데 신청서가 아직 이 주문에 붙지 않았어요.',
      making: '여덟 글자를 연산하는 중이에요.',
      checking: '책사가 한 번 더 확인한 뒤 「내 보고서」에서 열어 드려요(보통 2~3일 안).',
      ready: '보고서가 열렸어요.',
      canceled: '환불된 주문이라 보고서가 닫혔어요.',
    },
    주소: (id) => 'taekil-report.html?o=' + encodeURIComponent(String(id || '')),
    사슬싣기: () => 주문서.사슬싣기(),
  };

  global.ChaeksaPay = { state, ready, products, product, providers, 모든결제사, 곧열림, 곧열림자리, 결제사칸, 고른결제사, buy, confirm, markFailed, kconfirm, kfail, krefund, nconfirm, nfail, nrefund, intake, mine, 내결제, 내결제그리기, won, 값, say, paidLoad, paidFor, paidForKey, 누르면, 판, 주문서, taekil };
})(window);
