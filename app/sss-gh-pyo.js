/* SSS급 궁합 측정 — 11-09 사장님 「궁합3개 합쳐서SSS급 궁합 측정으로 가야지」(앞 말 「타로가 컨텐츠성이 강하네」 · 「이용자들이 미치게하는 부분이 없다」).
 * 정통 사주 궁합(gunghap-pyo.js) · 정통 자미두수 궁합(zw-gunghap-pyo.js) · 정통 타로 궁합(tarot-gunghap-pyo.js) 세 모듈을 한 화면에서 돌린다 — 이 파일은 차례와 상자만.
 * 흐름: 두 사람 고르기 → 현재 상황 고르기 → 카드 열 장 고르기 → 한 장씩 뒤집기(여기까지 타로 모듈 그대로) → 열째를 열면 결과: 세 면 요약(사주 · 자미두수 · 타로 한 줄씩) + 면마다 탭.
 *   사주 · 자미두수 계산은 카드를 고르는 동안 미리 불러 숨은 칸에 그려 둔다(결과는 열째 카드 뒤에 한 번에 — 측정은 의식 하나로).
 * 계산 · 글은 세 모듈 그대로(새 규칙 0 · 새 문장 0). 이 파일의 글(ChaeksaSssGhPyoCopy · COPY-0047)이 비면 세 모듈의 글로 대신한다.
 * 사건: sss_gh_start(측정 시작) · sss_gh_pyo(세 면 결과) · 세 모듈의 사건(gh_pyo · zw_gh_pyo · tarot_gh_pyo …)은 그대로 센다. */
(function (global) {
  'use strict';
  var C = global.ChaeksaSssGhPyoCopy || {}, TC = global.ChaeksaTarotGhPyoCopy || {}, GC = global.ChaeksaGhPyoCopy || {}, ZC = global.ChaeksaZwGhPyoCopy || {};
  var 사주 = global.ChaeksaGhPyo, 자미 = global.ChaeksaZwGhPyo, 타로 = global.ChaeksaTarotGhPyo, PP = global.ChaeksaPeople;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 칸 = function (태그, cls, 글) { return 글 ? '<' + 태그 + (cls ? ' class="' + cls + '"' : '') + '>' + esc(글) + '</' + 태그 + '>' : ''; };
  var 셈 = function (이름) { try { if (global.ChaeksaTrack) global.ChaeksaTrack.event(이름); } catch (e) {} };
  var 면들 = ['saju', 'zw', 'tarot'], 모듈 = { saju: 사주, zw: 자미, tarot: 타로 };
  var 쪽제목 = { saju: (GC.쪽 || {}).제목, zw: (ZC.쪽 || {}).제목, tarot: (TC.쪽 || {}).제목 };
  function 면글(k) { var M = C.면 || {}; return M[k] || 쪽제목[k] || ''; }
  function 판(k) { return $('pane-' + k); }
  var 상태 = null;   // { a, b, r: { saju, zw, tarot }, 이야기, 약속, 끝 }

  function 사람목록() { return PP && PP.list ? PP.list().filter(function (p) { return p && p.birth && p.birth.year; }) : []; }
  function 고르기그림() {
    var G = TC.고르기 || {}, M = C.고르기 || {};
    if (!global.ChaeksaPairPick || !타로 || !사주 || !자미) { $('pick').innerHTML = 칸('p', 'sub', G.사람없음); return; }
    global.ChaeksaPairPick.그리기($('pick'), { 나: G.나, 그: G.그, 단추: M.단추 || G.단추, 도움: M.도움 || G.도움, 없음: G.사람없음, 보기: 측정 });
  }
  function 보이기(k) {   // 탭 하나만 펼친다(요약 칸의 면 줄을 눌러도 같은 길)
    면들.forEach(function (x) { var p = 판(x); if (p) p.hidden = x !== k; });
    var 탭 = $('tabs'); if (탭) Array.prototype.forEach.call(탭.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-face') === k); });
  }
  function 탭그림() {
    var 탭 = $('tabs'); if (!탭) return;
    탭.innerHTML = 면들.map(function (k) { return '<button type="button" data-face="' + k + '">' + esc(면글(k)) + '</button>'; }).join('');
  }
  function 요약그림() {
    var s = 상태; if (!s || !s.끝) return;
    var R = C.요약 || {}, a = s.a, b = s.b;
    var 줄 = function (k, 요) {
      var 머리 = '<span class="k">' + esc(면글(k)) + '</span>';
      if (!요) return '<div class="sss-face none" data-face="' + k + '">' + 머리 + 칸('span', 'l', R.없음) + '</div>';
      return '<button type="button" class="sss-face" data-face="' + k + '">' + 머리 + '<b class="gh-name">' + esc(요.이름 || '') + '</b>'
        + 칸('span', 'l', 요.한줄) + 칸('span', 'c', 요.결론) + '</button>';
    };
    var 타 = s.r.tarot ? 타로.요약(s.r.tarot) : null;
    if (타 && s.이야기 && s.이야기.결론) 타.결론 = s.이야기.결론;
    $('summary').innerHTML = 칸('p', 'k', R.머리)
      + 줄('saju', s.r.saju ? 사주.요약(s.r.saju, a, b) : null) + 줄('zw', s.r.zw ? 자미.요약(s.r.zw, a, b) : null) + 줄('tarot', 타)
      + 칸('p', 'why', R.탭안내) + 칸('p', 'why', R.끝말);
    $('summary').hidden = false;
  }
  function 끝남(r) {   // 타로 모듈이 열째 카드를 연 뒤(또는 이번 달 판을 바로 연 뒤) 부른다
    var s = 상태; if (!s) return;
    s.r.tarot = r;
    (s.약속 || Promise.resolve()).then(function () {
      if (상태 !== s) return;
      s.끝 = true;
      요약그림(); 탭그림(); $('tabs').hidden = false; 보이기('tarot');
      셈('sss_gh_pyo');
      try { var top = $('summary'); if (top && top.scrollIntoView) top.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {}
    });
  }
  function 이야기옴(st) { var s = 상태; if (!s) return; s.이야기 = st; 요약그림(); }
  function 측정() {
    var 목록 = 사람목록(), G = TC.고르기 || {};
    var a = 목록.find(function (p) { return p.id === $('na').value; }), b = 목록.find(function (p) { return p.id === $('geu').value; });
    var err = $('err'); err.textContent = '';
    // 세 모듈이 같은 검사를 하지만, 셋을 부르기 전에 한 번만 막는다(글은 정통 타로 궁합의 고르기 글)
    if (!a || !b || a.id === b.id) { err.textContent = G.같은사람 || ''; return; }
    var ah = a.birth.hour, bh = b.birth.hour;
    if (ah == null || bh == null || ah === '' || bh === '') { err.textContent = G.시모름 || ''; return; }
    if (!/^[MF]$/.test(a.birth.gender || '') || !/^[MF]$/.test(b.birth.gender || '')) { err.textContent = G.성별모름 || ''; return; }
    var s = 상태 = { a: a, b: b, r: {}, 이야기: null, 약속: null, 끝: false };
    $('result').hidden = false; $('summary').hidden = true; $('summary').innerHTML = ''; $('tabs').hidden = true;
    면들.forEach(function (k) { var p = 판(k); if (p) { p.innerHTML = ''; p.hidden = k !== 'tarot'; } });
    사주.상자({ out: 판('saju'), err: err, 유료없음: true });
    자미.상자({ out: 판('zw'), err: err, 유료없음: true });
    타로.상자({ out: 판('tarot'), err: err, 끝남: 끝남, 이야기: 이야기옴 });
    // 사주 · 자미두수는 카드를 고르는 동안 미리(숨은 칸에 그려 둔다) — 열째 카드 뒤 요약에 한 번에
    s.약속 = Promise.all([사주.부르기(a, b), 자미.부르기(a, b)]).then(function (rs) { if (상태 === s) { s.r.saju = rs[0]; s.r.zw = rs[1]; } });
    if (!타로.부르기(a, b)) { 상태 = null; $('result').hidden = true; return; }
    셈('sss_gh_start');
    try { var st = $('pane-tarot'); if (st && st.scrollIntoView) st.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {}
  }
  if (typeof document !== 'undefined') document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-face]') : null;
    if (!t || !상태 || !상태.끝) return;
    if (t.closest('#tabs') || t.closest('#summary')) 보이기(t.getAttribute('data-face'));
  });
  function 시작() {
    var 쪽 = C.쪽 || {};
    if (쪽.제목) { $('h1').textContent = 쪽.제목; document.title = 쪽.제목 + ' · 책사'; }
    $('sub').textContent = 쪽.소개 || '';
    $('eyebrow').textContent = 쪽.위표시 || '';
    고르기그림();
  }
  global.ChaeksaSssGhPyo = { 측정: 측정, 보이기: 보이기 };
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작); else 시작(); }
})(typeof window !== 'undefined' ? window : globalThis);
