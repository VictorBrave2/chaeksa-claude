/* SSS급 궁합 분석 결과 쪽(sss-report.html) — 로그인 → sss_view → 상태대로. todo 면 만들기(비공개 서버 · 몇 초) → 다시 읽기 → 그리기(sss-gunghap.js).
 * 상태 글은 ilgyeol-report.html 것을 그대로 쓴다(새로 쓰지 않음). 생년월일은 받지도 그리지도 않는다 — 보관된 report 에는 명식 여덟 글자와 부를 이름만 있다. */
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
  if (!G || !G.view) { 그림(상자('풀이를 불러오지 못했어요', ['새로고침해 주세요. 계속 안 되면 ' + 문의 + ' 으로 알려 주세요.'])); return; }
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
    그림(상자('로그인하면 풀이가 열려요', [글 || '결제한 계정(카카오 또는 네이버)으로 로그인해 주세요. 풀이는 그 계정에 보관돼요.'],
      '<button type="button" class="btn kakao" id="go"><span class="seal">話</span>로그인하기</button>'));
    $('go').onclick = 로그인하러;
  }
  if (!꼴.test(o)) { 그림(상자('주문번호가 없어요', ['홈 설정 「내 결제」의 「보러 가기」로 들어와 주세요.'])); return; }
  if (!로그인됨()) { 로그인화면(); return; }

  var 만들었음 = false, 기다림 = null, 시작 = Date.now(), 한도 = 10 * 60 * 1000, 그렸음 = false;
  function 기다리기() {
    clearTimeout(기다림);
    if (Date.now() - 시작 > 한도) { 그림(상자('오래 걸리고 있어요', ['잠시 뒤 다시 봐 주세요. 계속 안 되면 ' + 문의 + ' 으로 주문번호를 알려 주세요' + 내결제 + '.'])); return; }
    기다림 = setTimeout(function () { 불러오기(true); }, 4000);
  }
  function 만들기() {
    if (만들었음) { 기다리기(); return; }
    만들었음 = true;
    그림('<p class="hint">' + esc(G.상태말.making) + '</p>');
    G.make(o).then(function (r) {
      if (r && r.ok) { clearTimeout(기다림); 불러오기(true); return; }
      if (r && r.reason === 'busy') { 기다리기(); return; }
      if (r && r.reason === 'login') { 로그인화면('로그인이 풀렸어요. 다시 로그인하면 이어서 만들어요.'); return; }
      clearTimeout(기다림);
      그림(상자('풀이를 만들지 못했어요', [(r && r.message) || '잠시 뒤 다시 해 주세요.', '결제 내역은 유지돼요. 계속 안 되면 ' + 문의 + ' 으로 주문번호를 알려 주세요' + 내결제 + '.'],
        '<button type="button" class="btn ghost" id="again">다시 해 보기</button>'));
      $('again').onclick = function () { 만들었음 = false; 불러오기(); };
    });
    기다리기();
  }
  function 풀이그리기(r, 머리글) {
    clearTimeout(기다림);
    if (그렸음) return;
    그렸음 = true;
    var rep = r.report || {}, res = rep.결과, 이름 = rep.이름 || { 나: '나', 그: '그 사람' };
    $('sub').textContent = (rep.만든날 ? rep.만든날 + ' 만듦 · ' : '') + '이 계정에 2년 동안 남아요';
    if (!res || !res.칸 || !window.ChaeksaSss) { 그림((머리글 || '') + 상자('풀이를 불러오지 못했어요', ['잠시 뒤 새로고침해 주세요. 계속 안 되면 ' + 문의 + ' 으로 주문번호를 알려 주세요' + 내결제 + '.'])); return; }
    if (res.명식) {
      var td = function (a) { return (a || []).map(function (x) { return '<td>' + esc(x || '') + '</td>'; }).join(''); };
      $('ms').innerHTML = '<div class="card sss-ms"><table><tr><th></th><th>시</th><th>일</th><th>월</th><th>년</th></tr>'
        + '<tr><th>' + esc(이름.나) + '</th>' + td(res.명식.나) + '</tr><tr><th>' + esc(이름.그) + '</th>' + td(res.명식.그) + '</tr></table></div>';
    }
    out.innerHTML = (머리글 || '') + '<div id="sssBody"></div>';
    window.ChaeksaSss.그리기($('sssBody'), res, 이름);
    try { window.ChaeksaTrack && window.ChaeksaTrack.event('sss_gh_report'); } catch (e) {}
  }
  function 불러오기(조용히) {
    if (!조용히) 그림('<p class="hint">불러오는 중…</p>');
    G.view(o, 손님눈).then(function (r) {
      clearTimeout(기다림);
      if (그렸음) return;
      if (!r || r.ok === false) {
        var 까닭 = r && r.reason;
        if (까닭 === 'login') { 로그인화면('로그인이 풀렸어요. 다시 로그인해 주세요.'); return; }
        if (까닭 === 'not_found') { 그림(상자('이 주문을 찾지 못했어요', ['결제한 계정(카카오 또는 네이버)으로 로그인했는지 확인해 주세요.'])); return; }
        if (까닭 === 'expired') { 그림(상자('볼 수 있는 기간이 끝났어요', ['결제한 날부터 2년이 지났어요.'])); return; }
        if (까닭 === 'not_paid') { 그림(상자('결제가 확인되지 않은 주문이에요', ['결제가 끝난 주문만 볼 수 있어요.'])); return; }
        if (조용히 && (까닭 === 'network' || 까닭 === 'db')) { 기다리기(); return; }
        그림(상자('풀이를 불러오지 못했어요', ['잠시 뒤 새로고침해 주세요. 계속 안 되면 ' + 문의 + ' 으로 주문번호를 알려 주세요' + 내결제 + '.']));
        return;
      }
      if (r.admin) {   // 검수 계정 — 손님에게 열렸는지와 상관없이 보여 주고 손님 상태를 위에 적는다
        var 띠 = '<div class="tkr-banner">검수 계정으로 보는 중 — 표 상태 ' + esc(r.view || '-') + ' · 손님 눈 ' + esc(r.cstate || '-')
          + (r.missing && r.missing.length ? ' · 걸린 것 ' + r.missing.length + '(' + esc(r.missing.join(' / ')) + ')' : '')
          + ' · <a href="?o=' + encodeURIComponent(o) + '&amp;as=customer">손님 눈으로 보기</a></div>';
        if (r.report) { 풀이그리기(r, 띠); return; }
        if (r.view === 'making') { 그림(띠); 기다리기(); return; }
        if (r.view === 'todo') { 만들기(); return; }
        그림(띠 + 상자('아직 만든 풀이가 없어요', ['상태 ' + (r.view || '-')]));
        return;
      }
      var st = r.state;
      if (st === 'ready' && r.report) { 풀이그리기(r); return; }
      if (st === 'todo') { 만들기(); return; }
      if (st === 'making') { 그림('<p class="hint">' + esc(G.상태말.making) + '</p>'); 기다리기(); return; }
      if (st === 'no_intake') { 그림(상자('이 주문에 신청서가 등록되지 않았어요', ['아래 「메일로 알리기」로 ' + 문의 + ' 에 알려 주세요. 주문번호는 자동으로 들어가요. 확인 후 이어서 만들어요.'], '<a class="btn ghost" href="mailto:' + 문의 + '?subject=' + encodeURIComponent('[책사] SSS급 궁합 분석 ' + o) + '">메일로 알리기</a>')); return; }
      if (st === 'canceled') { 그림(상자('환불된 주문이에요', [G.상태말.canceled])); return; }
      그림(상자('책사가 한 번 더 확인하고 있어요', [G.상태말.checking]));
    });
  }
  불러오기();
})();
