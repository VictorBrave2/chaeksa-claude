/* SSS급 궁합 분석 결과 쪽(sss-report.html) — 로그인 → sss_view → 상태대로. todo 면 만들기(비공개 서버 · 몇 초) → 다시 읽기 → 그리기(sss-gunghap.js).
 * 상태 글은 Codex COPY-0037. 만드는 중 · 확인 중 · 환불 상태는 pay.js의 SSS 전용 글을 쓴다. 생년월일은 받지도 그리지도 않는다 — 보관된 report 에는 명식 여덟 글자와 부를 이름만 있다. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var out = $('out'), P = window.ChaeksaPay, G = P && P.sss, Cl = window.ChaeksaCloud, CP = window.ChaeksaSssCopy || {}, 쪽 = CP.쪽 || {};
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var 문의 = 'dl4431@naver.com', 내결제 = '(주문번호는 홈 설정 「내 결제」에 있어요)';
  if (쪽.제목) { $('h1').textContent = 쪽.제목; document.title = '내 ' + 쪽.제목 + ' · 책사'; }
  if (쪽.위표시) $('eyebrow').textContent = 쪽.위표시;
  function 그림(html) { out.innerHTML = html; }
  function 상자(머리, 글들, 아래) {
    return '<div class="tkr-state"><h2>' + esc(머리) + '</h2>' + (글들 || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + (아래 || '') + '</div>';
  }
  if (!G || !G.view) { 그림(상자('궁합 분석 결과를 불러오지 못했어요', ['새로고침해 주세요. 계속 안 되면 ' + 문의 + ' 으로 알려 주세요.'])); return; }
  try { if (Cl && Cl.captureRedirect) Cl.captureRedirect(); } catch (e) {}
  try { localStorage.removeItem('chaeksa.return'); } catch (e) {}
  var q = new URLSearchParams(location.search), o = q.get('o') || '', 키 = 'chaeksa.sssReport', 꼴 = /^[A-Za-z0-9_-]{6,100}$/;
  if (!o) {
    try {
      var j = JSON.parse(localStorage.getItem(키) || 'null');
      if (j && Date.now() - (j.at || 0) < 30 * 60 * 1000 && 꼴.test(j.o || '')) { o = j.o; history.replaceState(null, '', location.pathname + '?o=' + encodeURIComponent(o)); }
    } catch (e) {}
  }
  try { localStorage.removeItem(키); } catch (e) {}
  var 손님눈 = q.get('as') === 'customer';
  function 로그인됨() { try { return !!(Cl && Cl.signedIn && Cl.signedIn()); } catch (e) { return false; } }
  function 로그인하러() {
    try { localStorage.setItem(키, JSON.stringify({ o: o, at: Date.now() })); } catch (e) {}
    try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, at: Date.now() })); } catch (e) {}
    try { if (Cl.로그인고르기) Cl.로그인고르기(); else Cl.signInWith('kakao'); } catch (e) { 그림(상자('로그인을 열지 못했어요', [String((e && e.message) || e)])); }
  }
  function 로그인화면(글) {
    그림(상자('결제한 계정으로 로그인해 주세요', [글 || '두 사람의 궁합 분석 결과는 결제한 계정에 보관돼요. 결제할 때 쓴 카카오 또는 네이버 계정으로 로그인해 주세요.'],
      '<button type="button" class="btn kakao" id="go"><span class="seal">話</span>로그인하기</button>'));
    $('go').onclick = 로그인하러;
  }
  if (!꼴.test(o)) { 그림(상자('주문번호가 없어요', ['홈 「설정」 → 「내 결제」에서 SSS급 궁합 분석 주문의 「보러 가기」를 눌러 주세요.'])); return; }
  if (!로그인됨()) { 로그인화면(); return; }

  var 만들었음 = false, 기다림 = null, 시작 = Date.now(), 한도 = 10 * 60 * 1000, 그렸음 = false;
  function 기다리기() {
    clearTimeout(기다림);
    if (Date.now() - 시작 > 한도) { 그림(상자('궁합 분석이 평소보다 오래 걸리고 있어요', ['잠시 뒤 다시 봐 주세요. 계속 안 되면 ' + 문의 + ' 으로 주문번호를 알려 주세요' + 내결제 + '.'])); return; }
    기다림 = setTimeout(function () { 불러오기(true); }, 4000);
  }
  // 11-03 사장님 「3만원 결제했는데 드르륵 열리면 좀 아쉽지 않겠어?」 — 처음 열 때만 의식: 섞기 → 부채꼴 77장에서 열 장 고르기(정통타로와 같은 길 · 고른 자리 = 몸의 고름)
  //   → 만드는 중(고른 열 장 + 단계 글이 차례로) → 열림(두 명식 글자가 한 자씩 · 열 장이 차례로 뒤집힘 · 24칸이 스크롤마다 떠오름).
  //   글은 Codex 칸(ChaeksaSssCopy.열기 — COPY-0038)만. 비면 기호(⇄ · n / 10)와 데이터(글자 · 카드 그림)만 남는다.
  var 열기 = CP.열기 || {}, 그림길 = 'art/tarot/chaeksa-v1/', 그림id = /^(?:M(?:0\d|1\d|2[01])|[WCSP](?:0[1-9]|1[0-4]))$/;
  var 줄p = function (t, cls) { return t ? '<p class="' + (cls || 'sss-rite-say') + '">' + esc(t) + '</p>' : ''; };
  var 채 = function (t, v) { return t && window.ChaeksaSss && window.ChaeksaSss.채움 ? window.ChaeksaSss.채움(t, v || {}) : ''; };
  var 덜움직임 = (function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  var 처음연다 = false, 의 = null;
  function 떨림(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
  function 칸들(n) { var h = '<div class="sss-slots" aria-hidden="true">'; for (var i = 1; i <= 10; i++) h += '<span class="sss-slot' + (i <= n ? ' is-on' + (i === n ? ' is-arrive' : '') : i === n + 1 ? ' is-next' : '') + '"></span>'; return h + '</div>'; }
  function 부채(고름) {
    var h = '<div class="sss-fan' + (고름.length === 0 ? ' is-spread' : '') + '" data-fan>';
    for (var i = 0; i < 77; i++) {
      if (고름.indexOf(i) >= 0) continue;
      h += '<button type="button" class="sss-fan-card" data-pick="' + i + '" style="--a:' + (-50 + 100 * i / 76).toFixed(2) + ';--k:' + i + '" aria-label="' + esc(채(열기.카드읽기, { n: String(고름.length + 1) }) || (고름.length + 1) + ' / 10') + '"></button>';
    }
    return h + '</div>';
  }
  function 의식그리기() {
    if (!의.섞음) {
      그림('<div class="sss-rite">' + 줄p(채(열기.처음, {})) + '<div class="sss-pile" data-pile aria-hidden="true"><span></span><span></span><span></span></div>'
        + '<button type="button" class="btn sss-rite-btn" id="shuffle">' + esc(열기.섞기 || '⇄') + '</button></div>');
      $('shuffle').onclick = 섞기; var 더미 = out.querySelector('[data-pile]'); if (더미) 더미.onclick = 섞기;
      return;
    }
    var n = 의.고름.length;
    그림('<div class="sss-rite">' + 칸들(n) + 줄p(채(열기.고르기, { n: String(Math.min(n + 1, 10)) }))
      + '<p class="sss-count"><b>' + n + '</b> / 10</p>' + 부채(의.고름) + '</div>');
    out.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { 고르기(+b.getAttribute('data-pick')); }; });
  }
  function 섞기() {
    if (의.섞음) return;
    의.섞음 = true; 떨림(18);
    var 더미 = out.querySelector('[data-pile]');
    if (더미 && !덜움직임) { 더미.classList.add('is-shuffle'); setTimeout(의식그리기, 900); } else 의식그리기();
  }
  function 고르기(i) {
    if (!(i >= 0 && i <= 76) || 의.고름.indexOf(i) >= 0 || 의.고름.length >= 10) return;
    var y = window.scrollY;
    의.고름.push(i); 떨림(8);
    if (의.고름.length >= 10) { 부르기(의.고름.slice()); return; }
    의식그리기(); window.scrollTo(0, y);
  }
  // 만드는 중 — 고른 열 장이 숨 쉬고 단계 글(열기.단계 — 글 배열)이 차례로 켜진다. 서버가 빨라도 단계를 다 보여 준 뒤 연다(단계 수 × 0.9초 · 최소 1.8초).
  function 만드는중(뒤) {
    var 단계 = (Array.isArray(열기.단계) ? 열기.단계 : []).map(function (t) { return 채(t, {}); }).filter(Boolean);
    그림('<div class="sss-rite is-making">' + 칸들(10) + (단계.length ? '<ol class="sss-steps">' + 단계.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' : 줄p(G.상태말.making, 'hint')) + '</div>');
    var li = out.querySelectorAll('.sss-steps li'), k = 0, 끝 = Date.now() + (덜움직임 ? 0 : Math.max(2, 단계.length) * 900);
    (function 다음() { if (k < li.length) { if (k) li[k - 1].classList.add('is-done'); li[k].classList.add('is-on'); k++; setTimeout(다음, 900); } })();
    return function () { setTimeout(뒤, Math.max(0, 끝 - Date.now())); };
  }
  function 부르기(고름) {
    만들었음 = true; 처음연다 = true;
    var 다음 = 만드는중(function () { clearTimeout(기다림); 불러오기(true); });
    G.make(o, 고름).then(function (r) {
      if (r && r.ok) { 다음(); return; }
      if (r && r.reason === 'busy') { 기다리기(); return; }
      if (r && r.reason === 'login') { 로그인화면('로그인이 풀렸어요. 결제한 계정으로 다시 로그인하면 궁합 분석을 이어서 진행해요.'); return; }
      clearTimeout(기다림);
      그림(상자('궁합 분석을 마치지 못했어요', [(r && r.message) || '잠시 뒤 다시 해 주세요.', '결제 내역은 유지돼요. 계속 안 되면 ' + 문의 + ' 으로 주문번호를 알려 주세요' + 내결제 + '.'],
        '<button type="button" class="btn ghost" id="again">다시 해 보기</button>'));
      $('again').onclick = function () { 부르기(고름); };
    });
  }
  function 만들기() {
    if (만들었음) { 기다리기(); return; }
    if (!의) 의 = { 섞음: false, 고름: [] };
    의식그리기();
  }
  // 24칸 — 처음 열 때만 카드가 다 뒤집힌 뒤 위에서부터 차례로 떠오른다(앞 여섯 칸은 0.25초 간격 · 나머지는 여섯째와 함께). CSS 움직임만 — 끝나면 늘 보인다.
  function 펼치기(몸, 늦춤) {
    if (!몸 || !늦춤) return;
    몸.querySelectorAll('.sss-v').forEach(function (x, k) { x.classList.add('sss-rise'); x.style.setProperty('--r', (늦춤 + Math.min(k, 6) * 250) + 'ms'); });
  }
  function 풀이그리기(r, 머리글) {
    clearTimeout(기다림);
    if (그렸음) return;
    그렸음 = true;
    var rep = r.report || {}, res = rep.결과, 이름 = rep.이름 || { 나: '나', 그: '그 사람' };
    $('sub').textContent = (rep.만든날 ? rep.만든날 + ' 만듦 · ' : '') + '결제일부터 2년 동안 이 계정에 보관돼요';
    if (!res || !res.칸 || !window.ChaeksaSss) { 그림((머리글 || '') + 상자('궁합 분석 결과를 불러오지 못했어요', ['잠시 뒤 새로고침해 주세요. 계속 안 되면 ' + 문의 + ' 으로 주문번호를 알려 주세요' + 내결제 + '.'])); return; }
    var 열림 = 처음연다 && !덜움직임, 글자 = 0;
    if (res.명식) {
      var td = function (a) { return (a || []).map(function (x) { return '<td>' + (열림 ? String(x || '').split('').map(function (c) { return '<span class="sss-ch" style="--i:' + (글자++) + '">' + esc(c) + '</span>'; }).join('') : esc(x || '')) + '</td>'; }).join(''); };
      $('ms').innerHTML = '<div class="card sss-ms"><table><tr><th></th><th>시</th><th>일</th><th>월</th><th>년</th></tr>'
        + '<tr><th>' + esc(이름.나) + '</th>' + td(res.명식.나) + '</tr><tr><th>' + esc(이름.그) + '</th>' + td(res.명식.그) + '</tr></table></div>';
    }
    // 고른 열 장(V23 펼침) — 카드 그림 줄. 처음 열 때는 명식 글자 뒤에 차례로 뒤집힌다(--d 시작 · --k 차례).
    var 펼 = (((res.칸 || {}).V23 || {}).값 || {}).펼침, 장 = (펼 && 펼.자리) || [], 머카 = 채(열기.카드머리, 이름);
    var 띠 = 장.length ? '<div class="sss-cards' + (열림 ? ' is-open' : '') + '" style="--d:' + (글자 * 70 + 300) + 'ms">' + (머카 ? '<p class="sss-cards-head">' + esc(머카) + '</p>' : '') + '<div class="sss-cards-row">' + 장.map(function (x, i) {
      var 앞 = 그림id.test(String(x.id)) ? '<img src="' + 그림길 + x.id + '-s.webp?v=2" alt="' + esc(x.이름 || '') + '"' + (x.놓임 === '거꾸로' ? ' class="is-rev"' : '') + '>' : '';
      return '<span class="sss-card" style="--k:' + i + '"><span class="sss-card-face">' + 앞 + '</span><span class="sss-card-back"></span></span>';
    }).join('') + '</div></div>' : '';
    out.innerHTML = (머리글 || '') + 띠 + '<div id="sssBody"></div>';
    window.ChaeksaSss.그리기($('sssBody'), res, 이름);
    펼치기($('sssBody'), 열림 ? 글자 * 70 + 장.length * 180 + 900 : 0);
    try { window.ChaeksaTrack && window.ChaeksaTrack.event('sss_gh_report'); } catch (e) {}
  }
  function 불러오기(조용히) {
    if (!조용히) 그림('<p class="hint">두 사람의 궁합 분석을 불러오는 중…</p>');
    G.view(o, 손님눈).then(function (r) {
      clearTimeout(기다림);
      if (그렸음) return;
      if (!r || r.ok === false) {
        var 까닭 = r && r.reason;
        if (까닭 === 'login') { 로그인화면('로그인이 풀렸어요. 다시 로그인해 주세요.'); return; }
        if (까닭 === 'not_found') { 그림(상자('이 주문을 찾지 못했어요', ['결제한 계정(카카오 또는 네이버)으로 로그인했는지 확인해 주세요.'])); return; }
        if (까닭 === 'expired') { 그림(상자('결과를 열어 보는 기간이 끝났어요', ['이 주문은 결제한 날부터 2년이 지나 열람 기간이 끝났어요.'])); return; }
        if (까닭 === 'not_paid') { 그림(상자('결제가 확인되지 않은 주문이에요', ['궁합 분석 결과는 결제가 확인된 뒤 열려요.'])); return; }
        if (조용히 && (까닭 === 'network' || 까닭 === 'db')) { 기다리기(); return; }
        그림(상자('궁합 분석 결과를 불러오지 못했어요', ['잠시 뒤 새로고침해 주세요. 계속 안 되면 ' + 문의 + ' 으로 주문번호를 알려 주세요' + 내결제 + '.']));
        return;
      }
      if (r.admin) {   // 검수 계정 — 손님에게 열렸는지와 상관없이 보여 주고 손님 상태를 위에 적는다
        var 띠 = '<div class="tkr-banner">검수 계정으로 보는 중 — 표 상태 ' + esc(r.view || '-') + ' · 손님 눈 ' + esc(r.cstate || '-')
          + (r.missing && r.missing.length ? ' · 걸린 것 ' + r.missing.length + '(' + esc(r.missing.join(' / ')) + ')' : '')
          + ' · <a href="?o=' + encodeURIComponent(o) + '&amp;as=customer">손님 눈으로 보기</a></div>';
        if (r.report) { 풀이그리기(r, 띠); return; }
        if (r.view === 'making') { 그림(띠); 기다리기(); return; }
        if (r.view === 'todo') { 만들기(); return; }
        그림(띠 + 상자('아직 만든 궁합 분석 결과가 없어요', ['상태 ' + (r.view || '-')]));
        return;
      }
      var st = r.state;
      if (st === 'ready' && r.report) { 풀이그리기(r); return; }
      if (st === 'todo') { 만들기(); return; }
      if (st === 'making') { 그림('<p class="hint">' + esc(G.상태말.making) + '</p>'); 기다리기(); return; }
      if (st === 'no_intake') { 그림(상자('두 사람의 신청 정보를 찾지 못했어요', ['아래 「메일로 알리기」로 ' + 문의 + ' 에 알려 주세요. 주문번호는 자동으로 들어가요. 신청 정보를 확인한 뒤 궁합 분석을 이어서 진행해요.'], '<a class="btn ghost" href="mailto:' + 문의 + '?subject=' + encodeURIComponent('[책사] SSS급 궁합 분석 ' + o) + '">메일로 알리기</a>')); return; }
      if (st === 'canceled') { 그림(상자('환불된 주문이에요', [G.상태말.canceled])); return; }
      그림(상자('결과를 열기 전에 확인하고 있어요', [G.상태말.checking]));
    });
  }
  불러오기();
})();
