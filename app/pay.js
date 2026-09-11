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
  // 이 파일이 몇 판인지(?v=). 결제가 막혔을 때 문구 뒤에 붙인다 — 캡처 한 장으로 「옛 화면이 떠 있던 것」과
  // 「새 코드의 문제」를 가른다(2026-09-11: 고친 뒤에도 같은 오류를 다시 받았는데 운영 코드로는 재현되지 않았다).
  const 판 = ((document.currentScript && document.currentScript.src || '').match(/[?&]v=(\d+)/) || [])[1] || '';

  // 상품 그림 — 상품마다 **서로 다른 그림 한 장**. 토스 심사가 「상품 이미지가 없거나
  // 같은 그림을 반복해 쓰면」 떨어뜨린다(2026-09-11 전자계약 심사 안내).
  // 결제 화면(pay.html)만 쓴다. 칸은 **정사각**이다 — 정사각 그림을 정사각 칸에 넣으면 잘릴 데가 없다.
  // 2026-09-11 오전에는 여기 연애 장면(love-*)을 3:1 로 넣었는데, 그 벌은 판이 바뀌기 전 그림(서양 저택·
  // 낯선 남자)이라 앱에서 이미 꺼 둔 것이었다(config.js CHAEKSA_ART). 그림 111장을 눈으로 다 보고
  // (워크플로 감사 · 심판 둘 같은 결론) 지금 세계의 책사 그림으로 바꿨다 — 홈 표지와 같은 책사가 같은 질문에 나온다.
  // 연희의 네 장은 붉은 실을 든 모습이 서로 달라 네 질문을 나눠 맡는다.
  // 값이 [파일, 위치] 면 정사각이 아닌 그림이라 얼굴이 보이게 object-position 을 준다(그려 보고 고른 값).
  // products 표에 상품을 새로 넣으면 여기에도 한 줄 넣어야 한다 — 빠지면 그림 없는 상품이 된다.
  const 그림 = {
    maeum: 'art/chaeksa-inyeon-2.webp',     // 연희 — 붉은 실이 화면 밖 누군가에게 이어진다
    gunghap: 'art/chaeksa-gungwi-2.webp',   // 성아 — 별자리 판에 두 사람을 겹쳐 본다
    sok: 'art/chaeksa-inyeon.webp',         // 연희 — 가장 가까운 얼굴, 팽팽한 실
    gyeolhon: 'art/chaeksa-gungwi-4.webp',  // 성아 — 차분한 반신, 판의 호
    ibyeol: 'art/chaeksa-inyeon-4.webp',    // 연희 — 고개를 돌렸고 실이 느슨하다
    jigeum: 'art/chaeksa-gungtong.webp',    // 온서 — 막 말하려는 얼굴
    jjak: 'art/chaeksa-inyeon-3.webp',      // 연희 — 새끼손가락에 묶인 실
    geunamja: 'art/chaeksa-jaemul.webp',    // 계상(jaemul-4 는 서양 프록코트라 뺐다)
    relation: ['art/say-gungwi.webp', '70% 50%'],        // 성아 — 달 아래 발코니(성아 셋이 서로 다르게)
    wealth: ['art/wealth-open-winter.webp', '70% 50%'],  // 재물 화면과 같은 벌 중 밤빛인 한 장
    inyeon: ['art/say-inyeon.webp', '75% 50%'],          // 연희 — 인연 첫머리, 말을 건네는 모습
    month: 'art/chaeksa-unro-2.webp',       // 소현 — 별자리 판을 들고 웃는다
    taekil: 'art/chaeksa-hyeopgi-5.webp',   // 검명 — 인장과 빈 종이, 사람이 봉해 보내는 보고서
    wongook: 'art/chaeksa-jwajang.webp',    // 태윤(좌장) — migrate-15 가 돌아 상품이 생기면 쓰인다
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

    // 주문은 결제 직전에 연다 — 아래 두 갈래가 각자 부른다.
    const 주문열기 = () => post({ action: 'open', product: code, note: note || null });

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
  // ── 출산택일 신청서 ─────────────────────────────────────────────
  // 신청 페이지(taekil-apply.html)와 결제 뒤 화면(pay-done.html)이 **같은 틀**을 쓴다 — 두 벌이면 어긋난다.
  // 칸은 네이버폼 택일 신청서와 택일상담 순서를 따른다: 기간·지역·성별·시간대 · 무엇을 앞세우나 · 가족 생년월일시.
  // 가족 정보는 거르는 체라 선택이다(없어도 보고서가 나온다). 다른 곳에서 받은 택일은 묻지 않는다.
  // 병원이 말한 날짜는 의학 판단이라 그 안에서만 본다.
  // 적는 동안 이 기기에 초안으로 둔다 — 카카오 로그인이나 결제창을 다녀와도 다시 쓰지 않게(2026-09-11
  // 사장님 「결제하러 가기가 너무 빡세고 어지러워」). 접수되면 지우고, 접수된 것은 주문번호로 기억한다.
  const 문의메일 = 'b01099991263@gmail.com';
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
    + ' placeholder="' + 글(예) + '">';
  const 고르기 = (id, 이름, 갈래) => '<label>' + 이름 + '</label><div class="seg" id="' + id + '">'
    + 갈래.map((g) => '<button type="button" data-v="' + 글(g[0]) + '">' + 글(g[1]) + '</button>').join('') + '</div>';
  const 앞세움 = [['무난', '두루 무난하게'], ['재관', '재물·자리'], ['건강', '건강'], ['학업', '공부'], ['가족', '가족 화목']];
  const 성별 = [['남아', '남아'], ['여아', '여아'], ['모름', '아직 몰라요']];
  const 주문서 = {
    /** 칸들만 돌려준다. 감싸는 form·제목·보내기 단추는 쓰는 쪽이 둔다(신청 페이지는 사이에 동의 칸이 있다). */
    틀() {
      return 칸('i_mail', '결과를 받으실 메일 주소', true, 'name@example.com', true)
        + 칸('i_range', '출산 예정 기간', true, '예) 2026년 10월 3일 ~ 17일')
        + 칸('i_hosp', '병원이 말한 수술 가능 날짜', false, '예) 10월 8일 또는 10일 — 없으면 비워 두세요')
        // 이미 받아 둔 택일을 교차검증하러 오는 분이 많다(택일상담 — 두 건 다 그 경로였다).
        // 묻지 않는 것은 「어디서」 받았는지다. 「무엇을」 받았는지는 적어 주시면 비교해 드린다.
        + 칸('i_have', '이미 받아 두신 날짜·시간', false, '있으면 — 예) 10월 8일 오전 10시')
        + '<p class="hint">어디서 받으셨는지는 적지 않으셔도 됩니다. 틀렸다고 하지 않고, 왜 그렇게 나오는지 함께 보여 드립니다.</p>'
        + 칸('i_place', '태어날 지역', true, '예) 경기도 성남 — 시·군까지면 됩니다')
        + 고르기('i_sex', '아이 성별', 성별)
        + 칸('i_time', '수술 가능한 시간대', false, '예) 평일 09시 ~ 19시')
        + '<div class="check"><input type="checkbox" id="i_weekend">'
        +   '<label for="i_weekend" style="margin:0">주말도 가능해요</label></div>'
        + 고르기('i_first', '가장 앞세우고 싶은 것', 앞세움)
        + 칸('i_dad', '아버지 생년월일시', false, '예) 1994년 12월 10일 오후 3시 10분 · 양력')
        + 칸('i_mom', '어머니 생년월일시', false, '예) 1990년 2월 10일 오전 7시 30분 · 양력')
        + 칸('i_sib', '형제자매 생년월일', false, '있으면 — 예) 2023년 5월 2일 · 양력')
        + '<p class="hint">가족 정보는 아이와 가족이 서로 부딪히는 날을 걸러 내는 데만 씁니다. 모르시면 비워 두셔도 보고서는 나옵니다.</p>'
        + '<label for="i_wish">바라는 점</label>'
        + '<textarea id="i_wish" placeholder="예) 자기 길이 뚜렷하고, 가족과 화목했으면"></textarea>'
        + '<label for="i_ask">궁금한 점</label>'
        + '<textarea id="i_ask"></textarea>';
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
      return 빈;
    },
    /** 초안을 칸에 채우고, 고르는 칸을 켜고, 적을 때마다 초안을 남긴다. */
    켜기(root) {
      const 채울 = 주문서.초안() || {};
      const 짝 = { i_mail: 'mail', i_range: 'range', i_hosp: 'hospital', i_place: 'place', i_time: 'time',
                  i_have: 'have', i_dad: 'father', i_mom: 'mother', i_sib: 'siblings', i_wish: 'wish', i_ask: 'ask' };
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
      const 남김 = () => 쓰기(초안키, { data: 주문서.값(root), at: Date.now() });
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
      return j && j.data && (Date.now() - (j.at || 0)) < 초안수명 ? j.data : null;
    },
    초안지움: () => 쓰기(초안키, null),
    초안저장: (d) => 쓰기(초안키, { data: d, at: Date.now() }),
    /** 접수된 것을 주문번호로 기억한다 — 결제 뒤 화면을 새로고침해도 빈 양식이 아니라 「접수됐습니다」가 뜨게. */
    보냄(orderId) { const j = 읽기(보낸키); return j && j.orderId === orderId ? j.data : null; },
    보냄기록: (orderId, d) => 쓰기(보낸키, { orderId, data: d, at: Date.now() }),
    앞세움이름: (v) => (앞세움.find((g) => g[0] === v) || [])[1] || '',
    메일초안(orderId, d) {
      const 줄 = ['주문번호: ' + orderId, '받으실 메일: ' + d.mail, '출산 예정 기간: ' + d.range,
        '병원이 말한 날짜: ' + (d.hospital || '없음'), '이미 받아 둔 날짜: ' + (d.have || '-'),
        '태어날 지역: ' + d.place,
        '아이 성별: ' + (d.sex || '미정'),
        '수술 가능한 시간대: ' + (d.time || '-') + (d.weekend ? ' · 주말 가능' : ''),
        '가장 앞세우고 싶은 것: ' + (주문서.앞세움이름(d.first) || '-'),
        '아버지: ' + (d.father || '-'), '어머니: ' + (d.mother || '-'), '형제자매: ' + (d.siblings || '-'),
        '바라는 점: ' + (d.wish || '-'), '궁금한 점: ' + (d.ask || '-')];
      return 'mailto:' + 문의메일 + '?subject=' + encodeURIComponent('[책사] 출산택일 신청서 ' + orderId)
        + '&body=' + encodeURIComponent(줄.join('\n'));
    },
    문의메일,
  };

  global.ChaeksaPay = { state, ready, products, product, buy, confirm, markFailed, intake, mine, won, say, paidLoad, paidFor, paidForKey, 그림, 누르면, 판, 주문서 };
})(window);
