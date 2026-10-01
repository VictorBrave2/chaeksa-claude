/* 행동양식 궁합 — 앱 탭(data-tab="pair", 10-01). 홈 「궁합」 칸에서 들어온다.
 * 당신 = 저장된 사람(profile) 그대로(생일을 다시 묻지 않는다), 그 사람 = 넣어 둔 사람 가운데 고른다(정통궁합과 같은 목록 · 「+ 사람 추가」).
 * 계산 · 카드 글은 비공개 서버가 한다 — 이 파일엔 판정 · 표 · 문턱이 없다. 서버가 보낸 글만 그린다.
 * 맛보기(장면 수 한 줄 + 장면 2개)는 무료, 전체(맨 위 결론 「두 분은 이런 짝이에요」 + 장면 전부)는 출시 기념가 19,900원(love_pair). 결제 열쇠는 서버가 준 값만 쓴다
 * (두 사람 생일로 만든 알아볼 수 없는 값 — 주문에 생일이 남지 않는다). 결제는 ChaeksaPay.buy('love_pair', 열쇠, 'kakao').
 * 생일은 주소에 싣지 않는다(POST 본문). 받은 전체 결과는 이 기기에 남기고, 서버 보관본으로 폰 · PC 어디서든 같은 결과. */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var 동의키 = 'chaeksa.pairConsent', 결과키 = 'chaeksa.pair.', 고른키 = 'chaeksa.pair.pick', 누구키 = 'chaeksa.pair.by';
  var 묶음이름 = { clash: '부딪히는 곳', lead: '한쪽이 맡는 곳', same: '닮은 곳 · 서로 채우는 곳', fit: '닮은 곳 · 서로 채우는 곳' };
  var 묶음차례 = ['clash', 'lead', 'same', 'fit'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 읽기(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function 쓰기(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function 지우기(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function 생일(p) {
    var h = p.hour == null || p.hour === '' ? null : +p.hour;
    return { year: +p.year, month: +p.month, day: +p.day, hour: h, minute: h == null ? null : +(p.minute || 0), gender: p.gender === 'F' ? 'F' : 'M',
      longitude: p.longitude == null ? null : +p.longitude, tzOffset: p.tzOffset == null ? null : +p.tzOffset };
  }
  function 표(b) { return [b.year, b.month, b.day, b.hour, b.minute, b.gender, b.longitude, b.tzOffset].join('|'); }
  function 이름(p) { var n = p && p.name ? String(p.name) : ''; return n && n !== '이름 없음' ? n : '그 사람'; }
  // 로그인 표(토큰)를 실어 보낸다 — 서버는 로그인한 사람만 받는다. 실패하면 서버 본문(결제 열쇠 등)을 오류에 붙여 둔다.
  function post(path, body) {
    var C = global.ChaeksaCloud;
    return Promise.resolve(C && C.token ? C.token() : null).catch(function () { return null; }).then(function (t) {
      var h = { 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t;
      return fetch(API + path, { method: 'POST', headers: h, body: JSON.stringify(body) })
        .catch(function () { throw new Error('연결이 끊겼어요. 잠시 뒤 다시 해 주세요.'); });
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.error || '잠시 뒤 다시 해 주세요.'); er.status = r.status; er.body = j; throw er; } return j; }); });
  }
  function 로그인하러(pick) {
    try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, hash: '#pair', pick: pick ? ['pairPick', pick] : null, at: Date.now() })); } catch (e) {}
    try { global.ChaeksaCloud.signInWith('kakao'); return true; } catch (e) { 지우기('chaeksa.return'); return false; }
  }

  // 근거 두 줄 — 서버가 보낸 말 그대로(없으면 「뚜렷하지 않음」)
  function 근거(basis, 그이름) {
    var b = basis || {};
    return '<details style="margin:8px 0 0"><summary class="hint" style="cursor:pointer">왜 이렇게 나왔나</summary>'
      + '<p class="hint" style="margin:6px 0 0">당신 — ' + esc(b.me || '이 장면의 이 행동은 뚜렷하지 않아요') + '</p>'
      + '<p class="hint" style="margin:4px 0 0">' + esc(그이름) + ' — ' + esc(b.other || '이 장면의 이 행동은 뚜렷하지 않아요') + '</p></details>';
  }

  // 결론(10-01 사장님 「사주팔자 -> 행동양식 -> 언행추론 -> 이런 사람이다 까지 결론이 나야」) — 전체 결과 맨 위.
  // 한 줄 · 모습(서버 거르기를 통과한 만큼 — 셋이 목표지만 모자라면 있는 만큼만 그린다, 머리에 「세 가지」를 쓰지 않는다)(모습마다 그 모습이 보이는 장면 번호, 누르면 그 카드로) · 두 분이 해 볼 것. 결론 칸 전에 만든 결과는 옛 꼴(한 줄)로.
  function 결론(s, 번호) {
    if (!Array.isArray(s.points) || !s.points.length) {
      return '<section class="card"><h3 class="doc-h">두 분을 한 줄로</h3><p style="margin:0 0 8px"><b>' + esc(s.line || '') + '</b></p>'
        + [s.clash, s.lead, s.same].filter(Boolean).map(function (t) { return '<p style="margin:0 0 6px">' + esc(t) + '</p>'; }).join('') + '</section>';
    }
    var html = '<section class="card"><h3 class="doc-h">두 분은 이런 짝이에요</h3><p style="margin:0 0 10px"><b>' + esc(s.title || s.line || '') + '</b></p>';
    s.points.forEach(function (pt, i) {
      var 근거 = (pt.ids || []).filter(function (id) { return 번호[id]; })
        .map(function (id) { return '<a href="#" data-go="prc-' + esc(id) + '">' + 번호[id] + '번 장면</a>'; }).join(' · ');
      html += '<p style="margin:0 0 4px"><b>' + (i + 1) + '. ' + esc(pt.name) + '</b></p><p style="margin:0 0 4px">' + esc(pt.line) + '</p>'
        + (근거 ? '<p class="hint" style="margin:0 0 12px">이 장면에서 보여요: ' + 근거 + '</p>' : '<div style="height:8px"></div>');
    });
    if (s.todo) html += '<p style="margin:6px 0 4px"><b>그래서 두 분이 해 볼 것</b></p><p style="margin:0 0 8px">' + esc(s.todo) + '</p>';
    if (s.count) html += '<p class="hint" style="margin:8px 0 0">' + esc(s.count) + '</p>';
    return html + '</section>';
  }

  // 전체 결과 — 결론 → 부딪히는 곳 → 한쪽이 맡는 곳 → 닮은 곳 · 서로 채우는 곳. 카드마다 번호(결론이 가리키는 자리) · 맞아요 / 아니에요(누가 눌렀는지도).
  function 전체(box, 저장, 키, 그이름) {
    var s = 저장.summary || {}, by = 읽기(누구키) === 'other' ? 'other' : 'me';
    var 차례 = [], 번호 = {};
    묶음차례.forEach(function (g) { (저장.cards || []).forEach(function (c) { if (c.group === g) 차례.push(c); }); });
    차례.forEach(function (c, i) { 번호[c.id] = i + 1; });
    var html = 결론(s, 번호)
      + '<section class="card"><p class="hint" style="margin:0">태어난 날에서 계산한 행동 경향이라 틀릴 수 있어요. 장면마다 「맞아요 / 아니에요」를 눌러 주시면 더 정확하게 고쳐 나갑니다. 누르는 사람: '
      + '<button class="btn ghost small" data-by="me"' + (by === 'me' ? ' style="font-weight:700"' : '') + '>' + (by === 'me' ? '✓ ' : '') + '나</button> '
      + '<button class="btn ghost small" data-by="other"' + (by === 'other' ? ' style="font-weight:700"' : '') + '>' + (by === 'other' ? '✓ ' : '') + esc(그이름) + '</button></p></section>';
    var 쓴묶음 = {};
    차례.forEach(function (c) {
      var 머리 = 묶음이름[c.group];
      if (!쓴묶음[머리]) { 쓴묶음[머리] = 1; html += '<h3 class="doc-h">' + esc(머리) + '</h3>'; }
      var v = (저장.fb || {})[c.id];
      html += '<section class="card" id="prc-' + esc(c.id) + '"><p class="hint" style="margin:0 0 4px">' + 번호[c.id] + '번 장면 · ' + esc(c.section) + '</p><p style="margin:0 0 6px"><b>' + esc(c.q) + '</b></p>'
        + '<p style="margin:0">' + esc(c.a) + '</p>'
        + (c.try ? '<p style="margin:8px 0 0"><b>해볼 것</b> — ' + esc(c.try) + '</p>' : '')
        + 근거(c.basis, 그이름)
        + '<p class="hint" style="margin:10px 0 0">실제 두 분과 <button class="btn ghost small" data-id="' + esc(c.id) + '" data-v="yes"' + (v === 'yes' ? ' style="font-weight:700"' : '') + '>' + (v === 'yes' ? '✓ ' : '') + '맞아요</button> '
        + '<button class="btn ghost small" data-id="' + esc(c.id) + '" data-v="no"' + (v === 'no' ? ' style="font-weight:700"' : '') + '>' + (v === 'no' ? '✓ ' : '') + '아니에요</button></p></section>';
    });
    box.innerHTML = html;
    box.querySelectorAll('a[data-go]').forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();   // 주소의 #은 탭이 쓰므로 건드리지 않는다
        var t = document.getElementById(a.getAttribute('data-go'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
    box.querySelectorAll('button[data-by]').forEach(function (b) { b.onclick = function () { 쓰기(누구키, b.getAttribute('data-by')); 전체(box, 저장, 키, 그이름); }; });
    box.querySelectorAll('button[data-v]').forEach(function (b) {
      b.onclick = function () {
        저장.fb = 저장.fb || {}; 저장.fb[b.getAttribute('data-id')] = b.getAttribute('data-v'); 쓰기(키, 저장); 전체(box, 저장, 키, 그이름);
        post('/api/pair-feedback', { runId: 저장.runId, id: b.getAttribute('data-id'), value: b.getAttribute('data-v'), by: 읽기(누구키) === 'other' ? 'other' : 'me' }).catch(function () {});
      };
    });
  }

  // 맛보기 — 서버가 고른 장면 2개(누구인지까지)와 한 줄. 나머지는 전체에서.
  function 맛보기(box, pv, 그이름) {
    var html = '<section class="card"><h3 class="doc-h">맛보기</h3><p style="margin:0"><b>' + esc(pv.line) + '</b></p></section>';
    (pv.cards || []).forEach(function (c) {
      html += '<section class="card"><p class="hint" style="margin:0 0 4px">' + esc(묶음이름[c.group] || '') + ' · ' + esc(c.section) + '</p>'
        + '<p style="margin:0 0 6px"><b>「' + esc(c.situation) + '」 이 장면에서 먼저 그렇게 하는 쪽은 누구일까요?</b></p>'
        + '<p style="margin:0">' + esc(c.a) + '</p>' + 근거(c.basis, 그이름) + '</section>';
    });
    box.innerHTML = html;
  }

  // 전체 결제 상자 — 값은 서버 상품표(products · love_pair)에서 받아 단추에 적는다(pay.js 원칙: 값은 한 곳, 줄 그은 정가 없음).
  // 청약철회 안내와 [필수] 동의는 연애 속의 나 잠금상자와 같은 말 — 체크 전에는 결제를 열지 않는다.
  var 받는것 = ['두 분이 어떤 짝인지 결론과 세 가지 모습을 정리해 드려요',
    '무료로 본 2장 말고도 연애의 아홉 장면에서 장면 카드를 최대 30장까지 드려요',
    '카드마다 당신 · 그 사람 · 두 분 다 가운데 누가 먼저 그렇게 할지 콕 집고, 왜 그런지 적어 드려요',
    '부딪히는 곳과 한쪽이 맡는 곳 카드에는 두 분이 실제로 해 볼 행동을 한 줄씩 적어 드려요',
    '결제한 카카오 계정에 1년 동안 남아서, 폰에서 열어도 PC에서 열어도 같은 결과가 나와요'];
  function 결제상자(box, 열쇠, 남은, pick) {
    box.innerHTML = '<section class="card"><h3 class="doc-h">' + (남은 > 0 ? '나머지 장면 ' + 남은 + '개' : '전체 보기') + '</h3>'
      + '<p style="margin:0 0 10px">결제하면 그때 두 분 것을 새로 써 드려요(1분 남짓).</p>'
      + '<p style="margin:0 0 4px"><b>결제하면 받는 것</b></p><ul style="margin:0 0 10px;padding-left:20px;line-height:1.7">'
      + 받는것.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
      + '<p style="margin:0 0 6px;font-size:12.5px;line-height:1.7;color:var(--ink2)">결제하면 바로 열리는 디지털 콘텐츠입니다. '
      + '열람이 시작되면 청약철회(결제 후 7일 안 취소)가 제한될 수 있고, 열람 전에는 전액 환불됩니다.</p>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.7;color:var(--ink);cursor:pointer;margin:0 0 10px">'
      + '<input type="checkbox" id="prAgree" style="margin-top:4px;width:auto;flex:none">'
      + '<span><b>[필수]</b> 위 내용을 확인했고 동의합니다. (<a href="terms.html#refund" target="_blank" rel="noopener">환불 규정</a>)</span></label>'
      + '<button class="btn" id="prBuy" type="button" style="width:100%">출시 기념가 19,900원으로 전체 보기</button>'
      + '<p class="hint" id="prPaySay" style="margin:8px 0 0"></p></section>';
    var btn = box.querySelector('#prBuy'), say = box.querySelector('#prPaySay'), P = global.ChaeksaPay;
    if (P && P.product) P.product('love_pair').then(function (p) {
      if (!btn.isConnected || btn.dataset.busy) return;
      if (p && p.amount) btn.textContent = (P.값 ? P.값(p) : '출시 기념가 ' + P.won(p.amount)) + '으로 전체 보기';
      else { btn.disabled = true; say.textContent = '온라인 결제는 준비 중이에요. 열리는 대로 이 자리에서 바로 열 수 있어요.'; }
    }).catch(function () {});
    btn.onclick = function () {
      if (btn.dataset.busy) return;
      var ok = box.querySelector('#prAgree');
      if (!ok || !ok.checked) { say.textContent = '위 [필수] 칸에 체크해 주셔야 결제할 수 있어요.'; return; }
      var C = global.ChaeksaCloud; P = global.ChaeksaPay;
      if (!P || !P.buy) { say.textContent = '결제 화면을 불러오지 못했어요. 새로고침해 주세요.'; return; }
      if (!열쇠) { say.textContent = '처음부터 다시 해 주세요.'; return; }
      쓰기(고른키, pick);   // 결제하고 돌아오면 같은 사람으로
      if (!(C && C.signedIn && C.signedIn())) { if (!로그인하러(pick)) say.textContent = '로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.'; return; }
      try { global.ChaeksaTrack && global.ChaeksaTrack.event && global.ChaeksaTrack.event('pay'); } catch (e) {}
      var 원래 = btn.textContent;
      btn.dataset.label = 원래; btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = '결제창을 여는 중…'; say.textContent = '';
      Promise.resolve().then(function () { return P.buy('love_pair', 열쇠, 'kakao'); })
        .catch(function (e) { return { ok: false, message: String((e && e.message) || e) }; })
        .then(function (r) {
          delete btn.dataset.busy; btn.disabled = false; btn.textContent = 원래;
          if (r && r.ok === false && !r.closed) say.textContent = r.message || '결제창을 열지 못했어요.';
        });
    };
  }

  function 그리기(el, profile) {
    if (!el) return;
    var PP = global.ChaeksaPeople;
    if (!profile || !profile.year || !PP) {
      el.innerHTML = '<section class="card"><h2>행동양식 궁합</h2><p class="hint">내 생년월일시를 먼저 저장해 주세요.</p></section>';
      return;
    }
    var me = PP.active(), 목록 = PP.list().filter(function (p) { return !me || p.id !== me.id; });
    var 고른 = 읽기(고른키); if (!목록.some(function (p) { return p.id === 고른; })) 고른 = 목록.length ? 목록[0].id : null;
    el.innerHTML = '<section class="card"><h2>행동양식 궁합</h2>'
      + '<p class="hint" style="margin:0 0 10px">두 분의 태어난 날로 계산한 연애 행동 버릇을 맞대 봐요. 계산은 책사가 직접 만든 알고리즘으로 해요. 장면마다 「누가 먼저 그렇게 할까요?」를 묻고, 당신 · 그 사람 · 두 분 다 가운데 하나를 콕 집어 답해요. 장면 수 한 줄과 장면 2개는 먼저 보여 드리고, 두 분이 어떤 짝인지 결론과 나머지 장면은 출시 기념가로 열려요.</p>'
      + '<label for="pairPick" class="hint" style="display:block;margin:0 0 4px">그 사람</label>'
      + '<div style="display:flex;gap:8px;align-items:center;margin:0 0 10px"><select id="pairPick" style="flex:1;min-width:0">'
      + (목록.length ? 목록.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === 고른 ? ' selected' : '') + '>' + esc(이름(p)) + (p.relation ? ' · ' + esc(p.relation) : '') + '</option>'; }).join('') : '<option value="">등록된 사람이 없어요</option>')
      + '</select><button class="btn ghost small" id="pairAdd" type="button" style="flex:none">+ 사람 추가</button></div>'
      + '<div id="pairHead"></div><p class="hint" id="pairSt" style="margin:8px 0 0"></p></section>'
      + '<div id="pairOut"></div><div id="pairPay"></div>';
    var pick = el.querySelector('#pairPick');
    el.querySelector('#pairAdd').onclick = function () { if (typeof global.책사사람추가 === 'function') global.책사사람추가(); };
    pick.onchange = function () { 쓰기(고른키, pick.value); 그리기(el, profile); };
    if (!목록.length) { el.querySelector('#pairSt').textContent = '그 사람 생년월일을 먼저 넣어 주세요. 「+ 사람 추가」를 누르면 돼요.'; return; }
    쓰기(고른키, 고른);
    보기(el, profile, PP.get(고른));
  }

  function 보기(el, profile, 그사람) {
    var head = el.querySelector('#pairHead'), st = el.querySelector('#pairSt'), out = el.querySelector('#pairOut'), pay = el.querySelector('#pairPay');
    var mb = 생일(profile), ob = 생일(global.ChaeksaPeople.toProfile(그사람)), 그이름 = 이름(그사람);
    var 키 = 결과키 + 표(mb) + '>' + 표(ob), 대기키 = 키 + '.wait', 저장 = 읽기(키);
    var timer = null, t0 = null;
    function 알림(msg, err) { clearInterval(timer); st.textContent = msg || ''; st.style.color = err ? 'var(--seal, #8c2f23)' : ''; }
    function 초(msg) { t0 = t0 || +읽기(대기키) || Date.now(); 알림(msg); var f = function () { st.textContent = msg + ' (' + Math.max(0, Math.round((Date.now() - t0) / 1000)) + '초)'; }; f(); timer = setInterval(f, 1000); }
    if (저장 && Array.isArray(저장.cards)) { 전체(out, 저장, 키, 그이름); return; }   // 이 기기에 받은 전체 — 다시 부르지 않는다

    var C = global.ChaeksaCloud;
    if (!C || !C.enabled() || !C.signedIn()) {
      head.innerHTML = '<p class="hint" style="margin:0 0 10px">카카오로 로그인하면 열려요. 로그인하고 돌아오면 이 화면으로 다시 와요.</p>'
        + '<button class="btn kakao" id="prKakao" style="width:100%"><span>💬</span>카카오로 로그인</button>';
      head.querySelector('#prKakao').onclick = function () { if (!로그인하러(그사람.id)) 알림('로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.', true); };
      return;
    }
    var 본문 = { me: mb, other: ob, consent: true, otherNotice: true };
    // 전체 받기 — 산 뒤에만. 이미 만든 것은 서버가 꺼내 주고, 없으면 새로 쓴다(1분 남짓). 다른 기기에서 만드는 중이면 10초마다 확인.
    function 만들기() {
      if (!읽기(대기키)) 쓰기(대기키, Date.now());
      초('두 분 것을 쓰는 중이에요. 1분 남짓 걸려요. 이 화면을 그대로 두세요.');
      post('/api/pair-report', 본문).then(function (r) {
        지우기(대기키);
        if (!out.isConnected) return;
        저장 = { runId: r.runId, summary: r.summary, cards: r.cards || [], count: r.count, fb: {} };
        쓰기(키, 저장); pay.innerHTML = ''; head.innerHTML = '';
        알림(r.saved ? '이 카카오 계정으로 만든 결과를 불러왔어요.' : '다 됐어요. 장면 ' + 저장.cards.length + '개예요.');
        전체(out, 저장, 키, 그이름);
      }, function (e) {
        if (!out.isConnected) return;
        if (e.status === 409 && Date.now() - (+읽기(대기키) || Date.now()) < 10 * 60 * 1000) { setTimeout(만들기, 10000); return; }
        지우기(대기키); t0 = null;
        알림(e.message, true);
        if (e.status === 402) 결제상자(pay, e.body && e.body.payKey, 0, 그사람.id);
      });
    }
    function 열기() {
      알림('두 분을 맞대 보는 중이에요…');
      post('/api/pair-report', Object.assign({ preview: true }, 본문)).then(function (r) {
        if (!out.isConnected) return;
        head.innerHTML = '';
        알림('');
        if (r.preview) 맛보기(out, r.preview, 그이름);
        if (r.paid) { pay.innerHTML = ''; 만들기(); return; }   // 산 쌍 — 보관된 것이 있으면 꺼내 오고, 없으면 지금 쓴다
        결제상자(pay, r.payKey, Math.max(0, ((r.preview && r.preview.total) || 0) - ((r.preview && r.preview.cards) || []).length), 그사람.id);
      }, function (e) { if (out.isConnected) 알림(e.message, true); });
    }
    var 동의 = 읽기(동의키) === true;
    if (동의) { 열기(); return; }
    head.innerHTML = '<label class="hint" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 8px"><input type="checkbox" id="prOk1" style="margin-top:5px;width:auto;flex:0 0 auto"><span>두 사람의 생년월일시를 계산 서버로 보내요. 생년월일은 저장하지 않고 알아볼 수 없게 바꾼 값만 남아요. AI 에는 생년월일이 가지 않아요. <a href="privacy.html">개인정보 처리방침</a></span></label>'
      + '<label class="hint" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 10px"><input type="checkbox" id="prOk2" style="margin-top:5px;width:auto;flex:0 0 auto"><span>그 사람의 생년월일시를 넣는다는 걸 그 사람에게 알리고, 결과도 함께 보기를 권할게요.</span></label>'
      + '<button class="btn" id="prGo" style="width:100%">두 분 맛보기 보기</button>';
    head.querySelector('#prGo').onclick = function () {
      var a = head.querySelector('#prOk1'), b = head.querySelector('#prOk2');
      if (!a.checked || !b.checked) return 알림('안내 두 칸에 모두 동의해 주세요.', true);
      쓰기(동의키, true); 열기();
    };
  }

  global.ChaeksaPairView = { 그리기: 그리기 };
})(typeof window !== 'undefined' ? window : globalThis);
