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

  function 사람목록() { return PP && PP.list ? PP.list().filter(function (p) { return p && p.birth && p.birth.year; }) : []; }
  // 이름 없이 넣은 사람(people.js 가 「이름 없음」으로 저장)은 표에선 이름을 비우고, 문장에선 고르기 칩과 같은 부름(「나」 · 관계)으로(11-04)
  function 표이름(p) { if (PP && PP.nameOf) return PP.nameOf(p); var n = p && p.name ? String(p.name).trim() : ''; return n && n !== '이름 없음' ? n : ''; }   // people.js nameOf(옛 대체 이름도 이름이 아니다, 11-04 v1621)
  function 부름(p) { return 표이름(p) || (PP && PP.relationOf ? PP.relationOf(p) : (p && p.isSelf ? '나' : (p && p.relation) || '그 사람')); }   // 고르기 칩과 같은 부름(people.js relationOf)
  function 나인가(p) { return PP && PP.relationOf ? PP.relationOf(p) === '나' : !!(p && p.isSelf); }   // 고르기 칩이 「나」라 부르는 사람(people.js relationOf)
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
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.시모름) throw new Error(j.error || 'x'); return j; }); })
      .then(function (r) { 그리기(r, a, b); })
      .catch(function () { $('out').innerHTML = ''; err.textContent = C.오류 || ''; });
  }
  function 명식표(r, a, b) {
    var M = C.명식 || {}, 머리들 = 나인가(b) && !나인가(a) ? [M.그, M.나] : [M.나, M.그];   // 11-04 표의 줄 머리(나 · 상대)는 사람을 따라간다 — 나를 「함께 볼 사람」 칸에 고르면 그 줄이 「나」(고르기 칩의 「나」와 같은 사람, v1621)
    var 줄 = function (머리, 이름, 기둥) { return '<tr><th>' + esc(머리 || '') + ' <small>' + esc(이름 || '') + '</small></th>' + 기둥.map(function (g) { return '<td>' + esc(g || '—') + '</td>'; }).join('') + '</tr>'; };
    return '<div class="card gh-ms"><table>' + 줄(머리들[0], 표이름(a), r.명식.나) + 줄(머리들[1], 표이름(b), r.명식.그) + '</table></div>';
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
  // 11-05 사장님 「나의 명식이 상대에게 좋은지 · 상대의 명식이 나에게 좋은지 … 나의 부족한 부분을 상대의 어떤 부분으로 채워준다 → 윈윈」 — 법전 53조 결론(원국끼리)을 거르개 표 위에(결정함 129 ~ 132).
  // 값은 서버 r.결론53(키 · 두 방향의 글자 · 십신 · 좋아진 칸 · 나빠진 칸 · %) · 글은 C.결론53(COPY-0039). 결론 이름이 비면 칸 전체를 안 그린다.
  function 결론53칸(r, a, b) {
    var k = r.결론53, K = C.결론53 || {}; if (!k || !K.이름) return '';
    var 키 = k.키 === '묶음' && k.묶은쪽 && K.이름['묶음' + k.묶은쪽] ? '묶음' + k.묶은쪽 : k.키;
    var 이름 = K.이름[키]; if (!이름) return '';
    var 누구 = { 나: 부름(a), 그: 부름(b) }, 칸이름 = K.칸이름 || {};
    var 칸들 = function (xs) { return (xs || []).map(function (g) { return 칸이름[g] || g; }).join(K.칸사이 || ', '); };
    var 방향줄 = function (x, 틀) {   // 틀 = K.나에게 / K.그사람에게 — { 둘다 · 보완만 · 하락만 · 없음 · 묶임 · 근거부족 }
      if (!x || !틀) return '';
      var 종류 = x.상태 === '근거 부족' ? '근거부족' : x.격묶임 ? '묶임' : x.보완.length && x.하락.length ? '둘다' : x.보완.length ? '보완만' : x.하락.length ? '하락만' : '없음';
      var t = 틀[종류]; if (!t) return '';
      return '<p class="gh-dir ' + 종류 + '">' + esc(채움(t, { 나: 누구.나, 그: 누구.그, 글자: x.글자 || '', 글자이름: x.글자이름 || '', 십신: x.십신 || '', 좋아지는칸: 칸들(x.보완), 나빠지는칸: 칸들(x.하락) })) + '</p>';
    };
    var 근거줄 = function (x, 받는) {   // 근거 접힘 — 엔진 값 그대로(글자 · 십신 · 갈래마다 전 → 후)
      if (!x || !x.사람말) return '';
      return '<p class="q">' + esc(받는 + ' ← ' + x.사람말) + '</p>' + (x.줄.length ? '<p class="why">' + x.줄.map(function (j) { return esc(j.갈래 + ' ' + j.전 + ' → ' + j.후 + (j.같은작용 ? ' (' + j.같은작용 + ')' : '')); }).join('<br>') + '</p>' : '')
        + (x.묶음.length ? '<p class="why">' + x.묶음.map(esc).join('<br>') + '</p>' : '');
    };
    var 근거 = K.근거머리 ? '<details class="fold"><summary>' + esc(K.근거머리) + '</summary>' + 칸('p', 'why', K.근거설명) + 근거줄(k.나에게, 누구.나) + 근거줄(k.그사람에게, 누구.그) + '</details>' : '';
    return '<div class="big gh-53" data-k="' + esc(k.키) + '">' + 칸('p', 'k', K.머리) + 칸('h2', 'gh-name', 이름) + 칸('p', '', (K.한줄 || {})[키])
      + 방향줄(k.나에게, K.나에게) + 방향줄(k.그사람에게, K.그사람에게)
      + (k['%'] != null && K.비율줄 ? 칸('small', '', 채움(K.비율줄, { '%': 쪽수(k['%']), 표본수: k.표본수 })) : '')
      + 근거 + 칸('p', 'todo', (K.할일 || {})[키]) + '</div>';
  }
  function 그리기(r, a, b) {
    var 걸린 = r.거르개.filter(function (f) { return f.걸림; }).sort(function (x, y) { return 드묾(x) - 드묾(y); });
    var 안 = r.거르개.filter(function (f) { return !f.걸림; });
    var 위 = 걸린[0], 위글 = 위 ? 글of(위) : null, R = C.결과 || {}, J = C.조합 || {};
    var 결과이름 = 위 ? 위글.결과이름 : R.없음이름, 결과한줄 = 위 ? 위글.한줄 : R.없음한줄;
    var h = 명식표(r, a, b) + 결론53칸(r, a, b)
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
