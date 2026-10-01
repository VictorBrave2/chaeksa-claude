/* 연애 속의 나 — 앱 탭(data-tab="love"). 09-30 사장님 「프로필 연동해야지 머하노 아예 다른창을 만들어놨네」 — 저장된 사람(profile)으로 바로 돈다. 생일을 다시 묻지 않는다.
 * 계산 · 질문 · 답은 비공개 서버가 한다(이 파일엔 판정 · 가중치 없음). 이 파일은 보여 주고 「맞아요 / 아니에요」만 보낸다.
 * 같은 사람 결과는 이 기기에 남겨 두고 다시 열면 그대로 보여 준다(다시 부르지 않음). 생일은 주소에 싣지 않는다(POST 본문).
 * 10-01 사장님 「유료」 — 전체판 출시 기념가 9,900원. 질문은 전부, 답은 맛보기만 서버가 보낸다(잠긴 답은 이 기기에 오지도 않는다).
 * 결제는 ChaeksaPay.buy('love_full', 결제열쇠, 'kakao') — 결제열쇠는 서버만 만든다('love_full:' + 32자 조각, 생일이 주문에 안 남는다).
 * 이 파일은 생일로 열쇠를 만들지 않는다 — 서버가 준 값이 없으면 단추를 잠그고 서버에 묻는다(peek). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var 동의키 = 'chaeksa.loveConsent', 결과키 = 'chaeksa.love.';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 읽기(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function 쓰기(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function 생일(p) {
    var h = p.hour == null || p.hour === '' ? null : +p.hour;
    return { year: +p.year, month: +p.month, day: +p.day, hour: h, minute: h == null ? null : +(p.minute || 0), gender: p.gender === 'F' ? 'F' : 'M',
      longitude: p.longitude == null ? null : +p.longitude, tzOffset: p.tzOffset == null ? null : +p.tzOffset };
  }
  function 표(b) { return [b.year, b.month, b.day, b.hour, b.minute, b.gender, b.longitude, b.tzOffset].join('|'); }
  // 결제 열쇠 — 서버(비공개 lib/love.js payKey)가 낸 값만 쓴다. 옛 꼴(생일이 적힌 열쇠)이 이 기기에 남아 있으면 버리고 다시 묻는다.
  function 올바른열쇠(k) { return typeof k === 'string' && /^love_full:[0-9a-f]{32}$/.test(k) ? k : null; }
  // 샀나 · 결제 열쇠를 서버에 묻는다(peek — 만들지도 세지도 않는다). 한 화면에서 여러 곳이 물어도 한 번만 부른다.
  var 묻는중 = {};
  function 샀나묻기(b) {
    var k = 표(b);
    if (!묻는중[k]) 묻는중[k] = post('/api/love-questions', { peek: true, birth: b }).then(
      function (r) { delete 묻는중[k]; return r; }, function (e) { delete 묻는중[k]; throw e; });
    return 묻는중[k];
  }
  // 로그인 표(토큰)를 실어 보낸다 — 서버는 카카오로 로그인한 사람만 질문 · 답을 만든다(09-30 사장님)
  function post(path, body) {
    var C = global.ChaeksaCloud;
    return Promise.resolve(C && C.token ? C.token() : null).catch(function () { return null; }).then(function (t) {
      var h = { 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t;
      return fetch(API + path, { method: 'POST', headers: h, body: JSON.stringify(body) })
        .catch(function () { throw new Error('연결이 끊겼어요. 잠시 뒤 다시 해 주세요.'); });   // 끊김 · 시간 초과도 우리말로
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.error || '잠시 뒤 다시 해 주세요.'); er.status = r.status; throw er; } return j; }); });
  }

  function 목록(box, 저장, 키) {
    var html = '', sec = null;
    저장.items.forEach(function (it) {
      if (it.section !== sec) { sec = it.section; html += '<h3 class="doc-h">' + esc(sec) + '</h3>'; }
      if (it.locked) { html += '<section class="card" style="opacity:.75"><p style="margin:0 0 6px"><b>' + esc(it.q) + '</b></p><p class="hint" style="margin:0">🔒 이 답은 전체판에서 열려요.</p></section>'; return; }
      var 답 = it.a ?'<p style="margin:0">' + esc(it.a) + '</p>' : '<p class="hint" style="margin:0">답을 쓰는 중이에요…</p>';
      var fb = '';
      if (it.a) {
        var v = (저장.fb || {})[it.id];
        fb = '<p class="hint" style="margin:10px 0 0">실제 나와 <button class="btn ghost small" data-id="' + esc(it.id) + '" data-v="yes"' + (v === 'yes' ? ' style="font-weight:700"' : '') + '>' + (v === 'yes' ? '✓ ' : '') + '맞아요</button> <button class="btn ghost small" data-id="' + esc(it.id) + '" data-v="no"' + (v === 'no' ? ' style="font-weight:700"' : '') + '>' + (v === 'no' ? '✓ ' : '') + '아니에요</button></p>';
      }
      html += '<section class="card"><p style="margin:0 0 6px"><b>' + esc(it.q) + '</b></p>' + 답 + fb + '</section>';
    });
    box.innerHTML = html;
    box.querySelectorAll('button[data-v]').forEach(function (b) {
      b.onclick = function () {
        저장.fb = 저장.fb || {}; 저장.fb[b.getAttribute('data-id')] = b.getAttribute('data-v'); 쓰기(키, 저장); 목록(box, 저장, 키);
        post('/api/love-feedback', { runId: 저장.runId, id: b.getAttribute('data-id'), value: b.getAttribute('data-v') }).catch(function () {});
      };
    });
  }

  // 전체판 결제 상자(10-01) — 잠긴 답이 있을 때만. 값은 서버 상품표(products · love_full)에서 받아 단추에 적는다(pay.js 원칙: 값은 한 곳).
  // 청약철회 안내와 [필수] 동의는 앱 결제 상자(app.js 결제상자)와 같은 말 — 체크 전에는 결제를 열지 않는다.
  // 다 내고 돌아오면(pay-done → #love) 이 탭이 다시 그려지고, 아래 산것확인이 서버에 물어 전체를 받아 온다.
  function 잠금상자(box, 저장, b) {
    var 잠긴 = (저장.items || []).filter(function (it) { return it.locked; }).length;
    if (!잠긴) { box.innerHTML = ''; return; }
    var 열쇠 = 올바른열쇠(저장.payKey), 열린 = 저장.items.length - 잠긴;
    box.innerHTML = '<section class="card"><h3 class="doc-h">나머지 답 ' + 잠긴 + '개</h3>'
      + '<p style="margin:0 0 10px">질문 ' + 저장.items.length + '개 가운데 앞 ' + 열린 + '개의 답을 먼저 보여 드렸어요. 나머지 답도 이미 다 써 두었고, 전체판을 열면 이 자리에서 바로 보여요.</p>'
      + '<p style="margin:0 0 6px;font-size:12.5px;line-height:1.7;color:var(--ink2)">결제하면 바로 열리는 디지털 콘텐츠입니다. '
      + '열람이 시작되면 청약철회(결제 후 7일 안 취소)가 제한될 수 있고, 열람 전에는 전액 환불됩니다.</p>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.7;color:var(--ink);cursor:pointer;margin:0 0 10px">'
      + '<input type="checkbox" id="lvAgree" style="margin-top:4px;width:auto;flex:none">'
      + '<span><b>[필수]</b> 위 내용을 확인했고 동의합니다. (<a href="terms.html#refund" target="_blank" rel="noopener">환불 규정</a>)</span></label>'
      + '<button class="btn" id="lvBuy" type="button" style="width:100%">출시 기념가 9,900원으로 전부 보기</button>'
      + '<p class="hint" id="lvPaySay" style="margin:8px 0 0"></p></section>';
    var btn = box.querySelector('#lvBuy'), say = box.querySelector('#lvPaySay'), P = global.ChaeksaPay;
    // 서버가 준 결제 열쇠가 없으면 단추를 잠그고 서버에 묻는다. 로그인 전이면 단추는 그대로 두고(누르면 로그인), 돌아와서 묻는다.
    var C1 = global.ChaeksaCloud;
    if (!열쇠 && C1 && C1.enabled && C1.enabled() && C1.signedIn && C1.signedIn()) {
      btn.disabled = true; say.textContent = '결제를 준비하는 중이에요…';
      샀나묻기(b).then(function (r) {
        if (!btn.isConnected) return;   // 다른 곳(산것확인 · 채우기)이 이미 다시 그렸다
        var k = 올바른열쇠(r && r.payKey);
        if (!k) { say.textContent = '결제를 준비하지 못했어요. 새로고침해 주세요.'; return; }
        저장.payKey = k; 쓰기(결과키 + 표(b), 저장); 잠금상자(box, 저장, b);
      }).catch(function () { if (btn.isConnected) say.textContent = '결제를 준비하지 못했어요. 새로고침해 주세요.'; });
    }
    // 단추의 값은 상품표 값으로 다시 적는다. 상품이 내려가 있으면(active 아님) 단추를 잠근다.
    if (P && P.product) P.product('love_full').then(function (p) {
      if (!btn.isConnected || btn.dataset.busy) return;
      if (p && p.amount) btn.textContent = (P.값 ? P.값(p) : '출시 기념가 ' + P.won(p.amount)) + '으로 전부 보기';   // pay.js 값 = 「출시 기념가 9,900원」
      else { btn.disabled = true; say.textContent = '온라인 결제는 준비 중이에요. 열리는 대로 이 자리에서 바로 열 수 있어요.'; }
    }).catch(function () {});
    btn.onclick = function () {
      if (btn.dataset.busy) return;
      var ok = box.querySelector('#lvAgree');
      if (!ok || !ok.checked) { say.textContent = '위 [필수] 칸에 체크해 주셔야 결제할 수 있어요.'; return; }
      var C = global.ChaeksaCloud; P = global.ChaeksaPay;
      if (!P || !P.buy) { say.textContent = '결제 화면을 불러오지 못했어요. 새로고침해 주세요.'; return; }
      if (!(C && C.signedIn && C.signedIn())) {   // 산 것을 그 카카오 계정에 매어 두어야 다른 기기에서도 열린다
        try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, hash: '#love', pick: null, at: Date.now() })); } catch (e) {}
        try { C.signInWith('kakao'); } catch (e) { try { localStorage.removeItem('chaeksa.return'); } catch (x) {} say.textContent = '로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.'; }
        return;
      }
      if (!열쇠) { say.textContent = '결제를 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.'; return; }   // 서버 열쇠 없이는 결제를 열지 않는다
      try { global.ChaeksaTrack && global.ChaeksaTrack.event && global.ChaeksaTrack.event('pay'); } catch (e) {}   // 깔때기 ④ 결제 단추 누름
      var 원래 = btn.textContent;
      btn.dataset.label = 원래; btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = '결제창을 여는 중…'; say.textContent = '';
      // 결제창으로 넘어가면 이 아래는 대개 안 돈다. 돌아왔다면 막힌 것이거나 창을 닫은 것이다(pay.js 누르면과 같은 처리).
      Promise.resolve().then(function () { return P.buy('love_full', 열쇠, 'kakao'); })
        .catch(function (e) { return { ok: false, message: String((e && e.message) || e) }; })
        .then(function (r) {
          delete btn.dataset.busy; btn.disabled = false; btn.textContent = 원래;
          if (r && r.ok === false && !r.closed) say.textContent = r.message || '결제창을 열지 못했어요.';
        });
    };
  }

  function 그리기(el, profile) {
    if (!el) return;
    if (!profile || !profile.year) {
      el.innerHTML = '<section class="card"><h2>사랑할 때만 나오는 당신</h2><p class="hint">내 생년월일시를 먼저 저장해 주세요.</p></section>';
      return;
    }
    var b = 생일(profile), 키 = 결과키 + 표(b), 저장 = 읽기(키);
    var 이름 = profile.name ? esc(profile.name) + ' · ' : '';
    el.innerHTML = '<section class="card"><h2>사랑할 때만 나오는 당신</h2>'
      + '<p class="hint" style="margin:0 0 10px">' + 이름 + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? ' (시간 모름)' : ' ' + b.hour + ':' + String(b.minute).padStart(2, '0')) + ' 기준으로, 당신에게 해당할 연애 행동 질문만 골라 답해 드려요. 질문은 전부 보여 드리고, 답은 앞 몇 개를 먼저 보여 드려요. 나머지 답은 전체판(출시 기념가)에서 열려요. 카카오 계정 하나에 한 사람 한 번 만들 수 있어요. 만든 결과는 폰 · PC 어디서 열어도 같아요.</p>'
      + '<div id="lvHead"></div><p class="hint" id="lvSt" style="margin:8px 0 0"></p></section>'
      + '<p class="hint" id="lvAbout" style="margin:0 0 6px"' + (저장 ? '' : ' hidden') + '>답은 태어난 날에서 계산한 행동 경향이라 틀릴 수 있어요. 질문마다 「맞아요 / 아니에요」를 눌러 주시면 더 정확하게 고쳐 나갑니다.</p>'
      + '<div id="lvList"></div><div id="lvPay"></div>';
    var head = el.querySelector('#lvHead'), st = el.querySelector('#lvSt'), list = el.querySelector('#lvList'), about = el.querySelector('#lvAbout'), pay = el.querySelector('#lvPay');
    var timer = null, t0 = null, 기다리는중 = false, 대기키 = 키 + '.wait';
    var 기다림말 = '만드는 중이에요. 다 되면 여기에 바로 떠요. 이 화면을 그대로 두세요.';
    function 알림(msg, err) { clearInterval(timer); st.textContent = msg; st.style.color = err ? 'var(--seal, #8c2f23)' : ''; }
    // 받은 답을 질문에 붙인다. paid === false 면 서버가 맛보기만 보낸 것 — 안 온 답은 잠금 칸이 된다(옛 서버 답에는 paid 가 없다 → 전부 연 것).
    function 채우기(답들, msg, paid, payKey) {
      var A = {}; (답들 || []).forEach(function (it) { A[it.id] = it.a; });
      저장.items.forEach(function (it) {
        if (Object.prototype.hasOwnProperty.call(A, it.id)) { it.a = A[it.id] || '답을 쓰지 못했어요.'; it.locked = false; }
        else if (paid === false) { it.a = ''; it.locked = true; }
        else { it.a = '답을 쓰지 못했어요.'; it.locked = false; }
      });
      저장.paid = paid !== false; if (올바른열쇠(payKey)) 저장.payKey = payKey;
      var 잠긴 = 저장.items.filter(function (it) { return it.locked; }).length;
      쓰기(키, 저장); head.innerHTML = '';
      알림((msg || '다 됐어요. 질문마다 실제 나와 맞는지 눌러 주세요.') + (잠긴 ? ' 나머지 답 ' + 잠긴 + '개는 맨 아래 전체판에서 열 수 있어요.' : ''));
      목록(list, 저장, 키); 잠금상자(pay, 저장, b);
    }
    // 잠긴 채로 이 기기에 남아 있으면 — 결제하고 돌아왔거나 다른 기기에서 샀을 수 있다. 서버에 샀는지만 묻고(peek, 만들지도 세지도 않음),
    // 샀으면 보관된 전체를 받아 온다(새로 쓰지 않는다 — 원가 0).
    function 산것확인() {
      var C0 = global.ChaeksaCloud;
      if (!C0 || !C0.enabled() || !C0.signedIn()) return;
      샀나묻기(b).then(function (r) {
        var k = 올바른열쇠(r && r.payKey);
        if (k && k !== 저장.payKey) { 저장.payKey = k; 쓰기(키, 저장); }   // 옛 꼴 열쇠를 서버 열쇠로 바꿔 둔다(단추는 잠금상자가 다시 그린다)
        if (!r || r.paid !== true || !list.isConnected) return;
        알림('전체판을 여는 중이에요…');
        return post('/api/love-questions', { consent: true, birth: b }).then(function (r2) {
          if (!list.isConnected || !r2 || !Array.isArray(r2.answers)) return;
          if (r2.runId !== 저장.runId) 저장 = { runId: r2.runId, sig: r2.sig, payKey: 올바른열쇠(r2.payKey) || 저장.payKey, items: r2.items.map(function (it) { return { id: it.id, section: it.section, q: it.q, a: '' }; }), fb: 저장.fb || {} };
          채우기(r2.answers, '전체판이 열렸어요. 질문마다 실제 나와 맞는지 눌러 주세요.', r2.paid, r2.payKey);
        });
      }).catch(function () { if (list.isConnected) 알림(''); });
    }
    if (저장 && 저장.items && 저장.items.every(function (it) { return it.a || it.locked; })) {
      목록(list, 저장, 키); 잠금상자(pay, 저장, b);
      if (저장.items.some(function (it) { return it.locked; })) 산것확인();
      return;
    }
    // 09-30 사장님 「카카오로그인 해야만 열리는건 맞지?」 — 새로 만드는 건 로그인한 사람만(이미 받은 결과는 로그인 없이도 보인다)
    var C = global.ChaeksaCloud;
    if (!C || !C.enabled() || !C.signedIn()) {
      head.innerHTML = '<p class="hint" style="margin:0 0 10px">카카오로 로그인하면 열려요. 로그인하고 돌아오면 이 화면으로 다시 와요.</p>'
        + '<button class="btn kakao" id="lvKakao" style="width:100%"><span>💬</span>카카오로 로그인</button>';
      el.querySelector('#lvKakao').onclick = function () {
        try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, hash: '#love', pick: null, at: Date.now() })); } catch (e) {}
        try { C.signInWith('kakao'); } catch (e) { try { localStorage.removeItem('chaeksa.return'); } catch (x) {} st.textContent = '로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.'; }
      };
      return;
    }
    // 질문은 받았는데 답이 덜 왔으면(끊김) 답만 다시 받는다 — 질문부터 다시 하면 한 번 더 쓴 것이 된다(한 사람 · 횟수 제한 09-30)
    var 덜됨 = !!(저장 && 저장.items && 저장.items.length && 저장.runId && 저장.sig);
    if (덜됨) { about.hidden = false; 목록(list, 저장, 키); }
    var 동의 = 읽기(동의키) === true;
    head.innerHTML = (동의 ? '' : '<label class="hint" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 10px"><input type="checkbox" id="lvOk" style="margin-top:5px;width:auto;flex:0 0 auto"><span>생년월일시와 「맞아요 / 아니에요」 응답을 이 콘텐츠를 고치는 데 쓰는 것에 동의해요. 이름·연락처는 보내지 않아요. <a href="privacy.html">개인정보 처리방침</a></span></label>')
      + '<button class="btn" id="lvGo" style="width:100%">' + (덜됨 ? '답 마저 받기' : '내 연애 질문 받기') + '</button>';
    // 걸린 시간은 처음 누른 때부터 센다(새로고침 · 기다림 확인을 거쳐도 이어서)
    function 초(msg) { if (기다리는중) msg = 기다림말; t0 = t0 || +읽기(대기키) || Date.now(); 알림(msg); var f = function () { st.textContent = msg + ' (' + Math.max(0, Math.round((Date.now() - t0) / 1000)) + '초)'; }; f(); timer = setInterval(f, 1000); }
    function 지우기(k) { try { localStorage.removeItem(k); } catch (e) {} }
    function 답받기(msg) {
      초(msg);
      return post('/api/love-answers', { runId: 저장.runId, birth: b, sig: 저장.sig, items: 저장.items.map(function (it) { return { id: it.id, section: it.section, q: it.q }; }) }).then(function (r) {
        채우기(r.items, r.saved ? '이 카카오 계정으로 받은 답을 불러왔어요. 질문마다 실제 나와 맞는지 눌러 주세요.' : null, r.paid, r.payKey);
      });
    }
    // 09-30 사장님 「자동뜨게해」 — 이 계정으로 지금 만드는 중이면(새로고침 · 다른 기기) 새로 만들지 않고 10초마다 확인해서 다 되면 바로 띄운다.
    // 확인은 서버에 묻기만 한다(보관된 게 있으면 꺼내 주고, 아직이면 「만드는 중」) — 토큰 안 듦. 누른 표시(대기키)가 있으면 화면을 다시 열어도 이어서 기다린다.
    function 시작() {
      var btn = el.querySelector('#lvGo'); if (!btn || !btn.isConnected) return;
      btn.disabled = true;
      if (!읽기(대기키)) 쓰기(대기키, Date.now());
      var 일 = 덜됨 ? 답받기('답을 쓰는 중이에요. 1분 남짓 걸려요.') : (초('당신에게 맞는 질문을 고르는 중이에요. 1분 남짓 걸려요.'), post('/api/love-questions', { consent: true, birth: b }).then(function (r) {
        저장 = { runId: r.runId, sig: r.sig, payKey: 올바른열쇠(r.payKey), items: r.items.map(function (it) { return { id: it.id, section: it.section, q: it.q, a: '' }; }), fb: {} };
        쓰기(키, 저장); 덜됨 = true; about.hidden = false; 목록(list, 저장, 키);
        // 이 카카오 계정으로 이미 만든 결과(다른 기기 포함)면 새로 만들지 않고 그대로 꺼내 온다(09-30)
        // 잠긴 사람은 맛보기만 오므로 빈 배열일 수도 있다 — 배열이면 보관된 답이 있다는 뜻이다(10-01)
        if (r.saved && Array.isArray(r.answers) && (r.answers.length || r.paid === false)) return 채우기(r.answers, '이 카카오 계정으로 만든 결과를 불러왔어요. 질문마다 실제 나와 맞는지 눌러 주세요.', r.paid, r.payKey);
        return 답받기(r.saved ? '이 카카오 계정으로 만든 질문을 불러왔어요. 답을 쓰는 중이에요. 1분 남짓 걸려요.' : '질문 ' + r.items.length + '개를 골랐어요. 답을 쓰는 중이에요. 1분 남짓 더 걸려요.');
      }));
      일.then(function () { 지우기(대기키); 기다리는중 = false; t0 = null; }, function (e) {
        if (!btn.isConnected) return;   // 다른 화면으로 갔으면 그만(다시 열면 이어서)
        if (e.status === 409 && Date.now() - (+읽기(대기키) || Date.now()) < 10 * 60 * 1000) { 기다리는중 = true; 초(기다림말); setTimeout(시작, 10000); return; }
        지우기(대기키); 기다리는중 = false; t0 = null;
        알림(e.message, true); btn.disabled = false;
        if (덜됨 && e.status === 400) { 덜됨 = false; 저장 = null; 지우기(키); list.innerHTML = ''; }   // 이 기기 것이 서버와 안 맞으면 처음부터
        btn.textContent = 덜됨 ? '답 마저 받기' : '내 연애 질문 받기';
      });
    }
    el.querySelector('#lvGo').onclick = function () {
      if (!동의) { var ok = el.querySelector('#lvOk'); if (!ok || !ok.checked) return 알림('안내에 동의해 주세요.', true); 동의 = true; 쓰기(동의키, true); }
      시작();
    };
    // 누르고 기다리던 중에 새로고침했거나 화면을 다시 열었으면 알아서 이어 간다(10분 안)
    var 누른때 = +읽기(대기키);
    if (동의 && 누른때 && Date.now() - 누른때 < 10 * 60 * 1000) 시작(); else if (누른때) 지우기(대기키);
  }

  global.ChaeksaLoveView = { 그리기: 그리기 };
})(typeof window !== 'undefined' ? window : globalThis);
