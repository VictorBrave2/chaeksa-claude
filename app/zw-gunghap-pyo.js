/* 정통 자미두수 궁합 — 결과표 그리기(11-03 사장님 「자미두수 궁합 ㄱㄱ」 · 정통 사주 궁합 gunghap-pyo.js 와 같은 꼴).
 * 계산은 비공개 /api/zw-gh-pyo(《紫微斗數全書》 妻妾 거르개 7 · 무작위 짝 20,000의 %). 이 파일은 고르기 · 부르기 · 그리기만, 글은 zw-gunghap-pyo-copy.js 에서만.
 * 맨 위 결과 = 걸린 거르개 가운데 % 가 가장 낮은 것의 결과이름. 하나도 안 걸리면 결과.없음이름.
 * 사건: zw_gh_pyo(결과 그림) · zw_gh_pyo_end(맨 아래까지 봄). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app/api/zw-gh-pyo';
  var C = global.ChaeksaZwGhPyoCopy || {}, PP = global.ChaeksaPeople;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 칸 = function (태그, cls, 글) { return 글 ? '<' + 태그 + (cls ? ' class="' + cls + '"' : '') + '>' + esc(글) + '</' + 태그 + '>' : ''; };
  var 채움 = function (t, v) { return String(t || '').replace(/\{([^}]+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var 쪽수 = function (p) { return (p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : String(Math.round(p))).replace(/\.0+$/, '') + '%'; };
  var 셈 = function (이름) { try { if (global.ChaeksaTrack) global.ChaeksaTrack.event(이름); } catch (e) {} };
  var 글of = function (f) { return (C.거르개 || {})[f.id] || {}; };

  function 사람목록() { return PP && PP.list ? PP.list().filter(function (p) { return p && p.birth && p.birth.year; }) : []; }
  // 이름 없이 넣은 사람(people.js 가 「이름 없음」으로 저장)은 표에선 이름을 비우고, 문장에선 고르기 칩과 같은 부름(「나」 · 관계)으로(11-04)
  function 표이름(p) { if (PP && PP.nameOf) return PP.nameOf(p); var n = p && p.name ? String(p.name).trim() : ''; return n && n !== '이름 없음' ? n : ''; }   // people.js nameOf(옛 대체 이름도 이름이 아니다, 11-04 v1621)
  function 부름(p) { return 표이름(p) || (PP && PP.relationOf ? PP.relationOf(p) : (p && p.isSelf ? '나' : (p && p.relation) || '그 사람')); }   // 고르기 칩과 같은 부름(people.js relationOf)
  function 나인가(p) { return PP && PP.relationOf ? PP.relationOf(p) === '나' : !!(p && p.isSelf); }   // 고르기 칩이 「나」라 부르는 사람(people.js relationOf)
  // 11-04 표의 줄 머리(나 · 상대)는 사람을 따라간다 — 나를 「함께 볼 사람」 칸에 고르면(칸 바꿈 · 다른 궁합 쪽에서 넘어온 고름) 그 줄이 「나」, 첫 칸 사람이 「상대」.
  //   고르기 칩 · 문장이 「나」라 부르는 사람과 표의 「나」 줄이 늘 같은 사람이게(v1621). 둘 다 「나」거나 아무도 「나」가 아니면 칸 차례대로.
  function 줄머리(a, b) { var M = C.명반 || {}; return 나인가(b) && !나인가(a) ? [M.그, M.나] : [M.나, M.그]; }
  // 11-04 사장님 「사람추가하라고하네 문제있네」 — 두 사람 고르기 · 더하기 · 고치기를 이 쪽 안에서(pair-pick.js · 세 궁합 쪽 같이 씀). 고른 id 는 #na · #geu.
  function 고르기그림() {
    var G = C.고르기 || {};
    if (!global.ChaeksaPairPick) { $('pick').innerHTML = 칸('p', 'sub', G.사람없음); return; }
    global.ChaeksaPairPick.그리기($('pick'), { 나: G.나, 그: G.그, 단추: G.단추, 도움: G.도움, 없음: G.사람없음, 보기: 부르기 });
  }
  function 입력(p) {
    var b = (p && p.birth) || {}, o = { year: b.year, month: b.month, day: b.day, hour: b.hour, minute: b.minute || 0, gender: b.gender, place: b.place };
    if (b.longitude != null) o.longitude = b.longitude;
    if (b.tzOffset != null) o.tzOffset = b.tzOffset;
    return o;
  }
  function 부르기() {
    var 목록 = 사람목록(), G = C.고르기 || {};
    var a = 목록.find(function (p) { return p.id === $('na').value; }), b = 목록.find(function (p) { return p.id === $('geu').value; });
    var err = $('err'); err.textContent = '';
    if (!a || !b || a.id === b.id) { err.textContent = G.같은사람 || ''; return; }
    var 나 = 입력(a), 그 = 입력(b);
    if (나.hour == null || 그.hour == null || 나.hour === '' || 그.hour === '') { err.textContent = G.시모름 || ''; return; }
    if (!/^[MF]$/.test(나.gender || '') || !/^[MF]$/.test(그.gender || '')) { err.textContent = G.성별모름 || ''; return; }
    $('out').innerHTML = 칸('p', 'sub', C.부르는중);
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ 나: 나, 그: 그 }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.거르개) throw new Error(j.error || 'x'); return j; }); })
      .then(function (r) { 그리기(r, a, b); })
      .catch(function () { $('out').innerHTML = ''; err.textContent = C.오류 || ''; });
  }
  function 명반표(r, a, b) {   // 두 사람의 부처궁 · 명궁 주성(별 이름은 서버 한글 이름 + 한자)
    var M = C.명반 || {}, 머리들 = 줄머리(a, b);
    var 별 = function (말, 한) { return (말 || []).length ? 말.map(function (x, i) { return esc(x) + ' <small>' + esc((한 || [])[i] || '') + '</small>'; }).join(' · ') : esc(M.빈궁 || '—'); };
    var 줄 = function (머리, 이름, q) { return '<tr><th>' + esc(머리 || '') + ' <small>' + esc(이름 || '') + '</small></th><td>' + 별(q.부처말, q.부처) + '</td><td>' + 별(q.명궁말, q.명궁) + '</td></tr>'; };
    return '<div class="card gh-ms"><table><tr><th></th><th>' + esc(M.부처궁 || '') + '</th><th>' + esc(M.명궁 || '') + '</th></tr>'
      + 줄(머리들[0], 표이름(a), r.명반.나) + 줄(머리들[1], 표이름(b), r.명반.그) + '</table></div>';
  }
  function 거르개칸(f, 걸림, a, b) {
    var g = 글of(f), 근 = C.근거 || {};
    var 가 = 부름(a), 을 = 부름(b), 줄이름 = 줄머리(a, b);
    if (가 === 을) { 가 = 줄이름[0] || 가; 을 = 줄이름[1] || 을; }   // 11-04 두 사람 부름이 같으면(이름 없는 「그 사람」 둘 · 같은 이름) 같은 화면 명반 표의 줄 머리(나 · 상대)로 — 누가 누군지 갈리게
    var 이름of = function (누구) { return 누구 === '나' ? 가 : 을; };
    var 원문 = (f.원문줄 || []).length ? '<details class="fold"><summary>' + esc(근.원문머리 || f.출처) + '</summary>'
      + f.원문줄.map(function (x) { return 칸('p', 'why', 채움(근.원문누구, { 누구: 이름of(x.누구) })) + '<p class="q">' + esc(x.구절) + '</p>'; }).join('')
      + (f.옮김 ? 칸('p', 'why', 근.옮김머리) : '') + '</details>' : '';
    var 같은별 = (f.같은별 || []).map(function (x) {
      return 칸('p', 'why', 채움(근.같은별줄, { 누구: 이름of(x.누구), 그: 이름of(x.누구 === '나' ? '그' : '나'), 별: (x.별말 || x.별).join(' · ') }));
    }).join('');
    var 방법 = /^Z부처명궁/.test(f.id);
    return '<div class="card gh-f' + (걸림 ? ' on' : '') + '" data-f="' + esc(f.id) + '">'
      + '<p class="k">' + esc(f.출처) + ' ' + 칸('span', 'gh-tag', 방법 ? 근.방법표시 : 근.고전표시) + '</p>'
      + '<p class="y">' + esc(g.이름 || '') + ' <small>' + 쪽수(f['%']) + '</small></p>'
      + (걸림 ? 칸('p', '', g.한줄) + 같은별 + (방법 && f.옮김 ? 칸('p', 'why', 근.옮김머리) : '') + 원문 : '') + '</div>';
  }
  function 그리기(r, a, b) {
    var 걸린 = r.거르개.filter(function (f) { return f.걸림; }).sort(function (x, y) { return x['%'] - y['%']; });
    var 안 = r.거르개.filter(function (f) { return !f.걸림; });
    var 위 = 걸린[0], 위글 = 위 ? 글of(위) : null, R = C.결과 || {}, J = C.조합 || {};
    var 결과이름 = 위 ? 위글.결과이름 : R.없음이름, 결과한줄 = 위 ? 위글.한줄 : R.없음한줄;
    var h = 명반표(r, a, b)
      + '<div class="big gh-top">' + 칸('p', 'k', R.머리) + 칸('h2', 'gh-name', 결과이름) + 칸('p', '', 결과한줄)
      + 칸('small', '', 채움(J.줄, { '%': 쪽수(r.조합['%']), 해당수: r.조합.해당수, 표본수: r.조합.표본수 })) + '</div>'
      + 칸('h3', 'sec', C.걸린머리) + 걸린.map(function (f) { return 거르개칸(f, true, a, b); }).join('')
      + (안.length ? '<details class="fold"><summary>' + esc(C.안걸린머리 || '') + '</summary>' + 안.map(function (f) { return 거르개칸(f, false, a, b); }).join('') + '</details>' : '')
      + 칸('p', 'sub', C.끝말) + '<div id="gh-end"></div>';
    $('out').innerHTML = h;
    셈('zw_gh_pyo');
    try { if (global.ChaeksaToPaid) global.ChaeksaToPaid.달기($('out'), 'zw-gh-pyo'); } catch (e) {}
    try {
      if ('IntersectionObserver' in global) {
        var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { 셈('zw_gh_pyo_end'); io.disconnect(); } });
        io.observe($('gh-end'));
      }
    } catch (e) {}
  }
  function 시작() {
    var 쪽 = C.쪽 || {};
    if (쪽.제목) { $('h1').textContent = 쪽.제목; document.title = 쪽.제목 + ' · 책사'; }
    $('sub').textContent = 쪽.소개 || '';
    $('eyebrow').textContent = 쪽.위표시 || '';
    고르기그림();
  }
  global.ChaeksaZwGhPyo = { 그리기: 그리기, 거르개칸: 거르개칸 };
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작); else 시작(); }
})(typeof window !== 'undefined' ? window : globalThis);
