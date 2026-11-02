/* 정통 사주 궁합 — 결과표 그리기(11-03 사장님 「기존처럼 필터식으로 갈거야」 · 뼈대).
 * 계산은 비공개 /api/gh-pyo(거르개 11 · 무작위 짝 20,000의 %). 이 파일은 고르기 · 부르기 · 그리기만, 글은 gunghap-pyo-copy.js 에서만.
 * 맨 위 결과 = 걸린 거르개 가운데 % 가 가장 낮은 것(부부취회 · 군신경회는 이름 %)의 결과이름. 하나도 안 걸리면 결과.없음이름.
 * 사건: gh_pyo(결과 그림) · gh_pyo_end(맨 아래까지 봄). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app/api/gh-pyo';
  var C = global.ChaeksaGhPyoCopy || {}, PP = global.ChaeksaPeople;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 칸 = function (태그, cls, 글) { return 글 ? '<' + 태그 + (cls ? ' class="' + cls + '"' : '') + '>' + esc(글) + '</' + 태그 + '>' : ''; };
  var 채움 = function (t, v) { return String(t || '').replace(/\{([^}]+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var 쪽수 = function (p) { return (p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : String(Math.round(p))).replace(/\.0+$/, '') + '%'; };
  var 셈 = function (이름) { try { if (global.ChaeksaTrack) global.ChaeksaTrack.event(이름); } catch (e) {} };

  function 글of(f) {   // 거르개 하나의 글 — 취회는 이름(군신경회 · 부부취회)별 칸이 있으면 그것
    var g = (C.거르개 || {})[f.id] || {};
    if (f.id === 'S취회' && f.이름 && g[f.이름]) return Object.assign({}, g, g[f.이름]);
    return g;
  }
  function 드묾(f) { return f.이름 && f['이름%'] != null ? f['이름%'] : f['%']; }

  function 사람목록() { return PP && PP.list ? PP.list().filter(function (p) { return p && p.year; }) : []; }
  function 고르기그림() {
    var 목록 = 사람목록(), box = $('pick'), G = C.고르기 || {};
    if (목록.length < 2) {
      box.innerHTML = 칸('p', 'sub', G.사람없음) + (G.사람없음단추 ? '<a class="go" href="./?go=people">' + esc(G.사람없음단추) + '</a>' : '');
      return;
    }
    var opt = 목록.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name || '') + '</option>'; }).join('');
    var 나 = (PP.self && PP.self()) || 목록[0], 그 = 목록.find(function (p) { return p.id !== 나.id; });
    box.innerHTML = '<form id="f" class="card">' + 칸('label', '', G.나) + '<select id="na">' + opt + '</select>'
      + 칸('label', '', G.그) + '<select id="geu">' + opt + '</select>'
      + '<button class="go" type="submit">' + esc(G.단추 || '→') + '</button></form>';
    $('na').value = 나.id; if (그) $('geu').value = 그.id;
    $('f').addEventListener('submit', function (e) { e.preventDefault(); 부르기(); });
  }
  function 입력(p) {
    var b = PP.birthOf ? PP.birthOf(p) : p, o = { year: b.year, month: b.month, day: b.day, hour: b.hour, minute: b.minute || 0, gender: b.gender, place: b.place };
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
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.시모름) throw new Error(j.error || 'x'); return j; }); })
      .then(function (r) { 그리기(r, a, b); })
      .catch(function () { $('out').innerHTML = ''; err.textContent = C.오류 || ''; });
  }
  function 명식표(r, a, b) {
    var M = C.명식 || {};
    var 줄 = function (머리, 이름, 기둥) { return '<tr><th>' + esc(머리 || '') + ' <small>' + esc(이름 || '') + '</small></th>' + 기둥.map(function (g) { return '<td>' + esc(g || '—') + '</td>'; }).join('') + '</tr>'; };
    return '<div class="card gh-ms"><table>' + 줄(M.나, a.name, r.명식.나) + 줄(M.그, b.name, r.명식.그) + '</table></div>';
  }
  function 거르개칸(f, 걸림) {
    var g = 글of(f), 근 = C.근거 || {};
    var 원문 = (f.원문 || []).length ? '<details class="fold"><summary>' + esc(근.원문머리 || f.출처) + '</summary>'
      + f.원문.map(function (t) { return '<p class="q">' + esc(t) + '</p>'; }).join('')
      + ((f.반대원문 || []).length ? 칸('p', 'why', 근.반대원문머리) + f.반대원문.map(function (t) { return '<p class="q">' + esc(t) + '</p>'; }).join('') + 칸('p', 'why', g.반대한줄) : '')
      + (f.옮김 ? 칸('p', 'why', 근.옮김머리) : '') + '</details>' : '';
    return '<div class="card gh-f' + (걸림 ? ' on' : '') + '" data-f="' + esc(f.id) + '">'
      + '<p class="k">' + esc(f.출처) + ' ' + 칸('span', 'gh-tag', f.판정 ? 근.판정표시 : 근.고전표시) + '</p>'
      + '<p class="y">' + esc(g.이름 || '') + ' <small>' + 쪽수(드묾(f)) + '</small></p>'
      + (걸림 ? 칸('p', '', g.한줄) + 원문 : '') + '</div>';
  }
  function 그리기(r, a, b) {
    var 걸린 = r.거르개.filter(function (f) { return f.걸림; }).sort(function (x, y) { return 드묾(x) - 드묾(y); });
    var 안 = r.거르개.filter(function (f) { return !f.걸림; });
    var 위 = 걸린[0], 위글 = 위 ? 글of(위) : null, R = C.결과 || {}, J = C.조합 || {};
    var 결과이름 = 위 ? 위글.결과이름 : R.없음이름, 결과한줄 = 위 ? 위글.한줄 : R.없음한줄;
    var h = 명식표(r, a, b)
      + '<div class="big gh-top">' + 칸('p', 'k', R.머리) + 칸('h2', 'gh-name', 결과이름) + 칸('p', '', 결과한줄)
      + 칸('small', '', 채움(J.줄, { '%': 쪽수(r.조합['%']), 해당수: r.조합.해당수, 표본수: r.조합.표본수 })) + '</div>'
      + 칸('h3', 'sec', C.걸린머리) + 걸린.map(function (f) { return 거르개칸(f, true); }).join('')
      + (안.length ? '<details class="fold"><summary>' + esc(C.안걸린머리 || '') + '</summary>' + 안.map(function (f) { return 거르개칸(f, false); }).join('') + '</details>' : '')
      + 칸('p', 'sub', C.끝말) + '<div id="gh-end"></div>';
    $('out').innerHTML = h;
    셈('gh_pyo');
    try { if (global.ChaeksaToPaid) global.ChaeksaToPaid.달기($('out'), 'gh-pyo'); } catch (e) {}
    try {
      if ('IntersectionObserver' in global) {
        var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { 셈('gh_pyo_end'); io.disconnect(); } });
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
  global.ChaeksaGhPyo = { 그리기: 그리기, 거르개칸: 거르개칸 };
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작); else 시작(); }
})(typeof window !== 'undefined' ? window : globalThis);
