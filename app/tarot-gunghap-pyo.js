/* 정통 타로 궁합 — 결과표 그리기(11-03 사장님 「타로 궁합 ㄱㄱ」 · gunghap-pyo.js · zw-gunghap-pyo.js 와 같은 꼴).
 * 계산은 비공개 /api/tarot-gh-pyo — 나의 켈틱 한 판(물음 연애 · 정통타로 그대로) + 상대의 사람 카드 + 거르개 9 · 무작위 40,000판의 %.
 * 한 짝(나 · 그)은 한 달에 한 판 — 이 기기에 그달 판을 기억해 다시 열면 같은 판(정통타로의 「이번 달」과 같음 · 결정함 82).
 * 글은 tarot-gunghap-pyo-copy.js · 자리 이름 · 카드 연애 풀이는 three-pieces.js(이미 있는 Codex 글) — 이 파일은 고르기 · 부르기 · 그리기만.
 * 사건: tarot_gh_pyo(새 판) · tarot_gh_pyo_again(기억한 판) · tarot_gh_pyo_end(맨 아래까지 봄). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app/api/tarot-gh-pyo';
  var C = global.ChaeksaTarotGhPyoCopy || {}, PP = global.ChaeksaPeople, TPc = global.ChaeksaThreePieces || {};
  var 펼침글 = (TPc.세점 && TPc.세점.펼침) || {};
  var 기억열쇠 = 'chaeksa.tarotgh';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 칸 = function (태그, cls, 글) { return 글 ? '<' + 태그 + (cls ? ' class="' + cls + '"' : '') + '>' + esc(글) + '</' + 태그 + '>' : ''; };
  var 채움 = function (t, v) { return String(t || '').replace(/\{([^}]+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var 쪽수 = function (p) { return (p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : String(Math.round(p))).replace(/\.0+$/, '') + '%'; };
  var 셈 = function (이름) { try { if (global.ChaeksaTrack) global.ChaeksaTrack.event(이름); } catch (e) {} };
  var 글of = function (f) { return (C.거르개 || {})[f.id] || {}; };
  var 그림id = /^(?:M(?:0\d|1\d|2[01])|[WCSP](?:0[1-9]|1[0-4]))$/;
  function 서울달() { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7); } catch (e) { return ''; } }
  function 기억읽기() { try { return JSON.parse(localStorage.getItem(기억열쇠) || '{}') || {}; } catch (e) { return {}; } }
  function 기억쓰기(k, r) {   // 그달 판만 남긴다(지난 달 판은 지운다)
    try { var m = 기억읽기(), 달 = 서울달(), n = {}; Object.keys(m).forEach(function (x) { if (m[x] && m[x].때 && m[x].때.달 === 달) n[x] = m[x]; }); n[k] = r; localStorage.setItem(기억열쇠, JSON.stringify(n)); } catch (e) {}
  }

  function 사람목록() { return PP && PP.list ? PP.list().filter(function (p) { return p && p.birth && p.birth.year; }) : []; }
  // 이름 없이 넣은 사람(people.js 가 「이름 없음」으로 저장)은 표에선 이름을 비우고, 문장에선 고르기 칩과 같은 부름(「나」 · 관계)으로(11-04)
  function 표이름(p) { if (PP && PP.nameOf) return PP.nameOf(p); var n = p && p.name ? String(p.name).trim() : ''; return n && n !== '이름 없음' ? n : ''; }   // people.js nameOf(옛 대체 이름도 이름이 아니다, 11-04 v1621)
  function 부름(p) { return 표이름(p) || (PP && PP.relationOf ? PP.relationOf(p) : (p && p.isSelf ? '나' : (p && p.relation) || '그 사람')); }   // 고르기 칩과 같은 부름(people.js relationOf)
  function 그부름(b) { var n = 부름(b); return n === '나' ? '상대' : n; }   // 11-04 이 쪽의 「나」는 첫 칸(묻는 사람) — 나를 둘째 칸에 고르면 이 쪽 글이 쓰는 「상대」로 부른다(v1622 · 표가 없어 줄 머리를 바꿀 수 없다)
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
    var 열쇠 = a.id + '|' + b.id + '|' + JSON.stringify([나, 그]), 있던 = 기억읽기()[열쇠];   // 11-04 고치기로 생년월일을 바꾸면 이번 달 판도 새로(사람 id 는 그대로라)
    if (있던 && 있던.때 && 있던.때.달 === 서울달() && 있던.거르개) { 그리기(있던, a, b, true); return; }
    $('out').innerHTML = 칸('p', 'sub', C.부르는중);
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ 나: 나, 그: 그 }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.거르개) throw new Error(j.코드 || 'x'); return j; }); })
      .then(function (r) { 기억쓰기(열쇠, r); 그리기(r, a, b, false); })
      .catch(function () { $('out').innerHTML = ''; err.textContent = C.오류 || ''; });
  }
  function 연애풀이(x, g) {   // three-pieces 세점.펼침.물음카드뜻.love.<카드>.<놓임> — 글 하나 또는 { M, F }
    var t = 펼침글.물음카드뜻 && 펼침글.물음카드뜻.love, 면 = t && t[x.id] && t[x.id][x.놓임];
    return typeof 면 === 'string' ? 면 : 면 && typeof 면 === 'object' ? (면[g] || '') : '';
  }
  function 판그림(r, b) {
    var P = C.판 || {}, 등 = P.등급 || {}, 자리이름 = 펼침글.자리 || {}, g = r.성별 && r.성별[0];
    var 판 = r.펼침.다시 ? r.펼침.다시.자리 : r.펼침.자리;
    return 칸('h3', 'sec', P.머리) + (r.펼침.다시 ? 칸('p', 'why', P.다시줄) : '') + '<div class="tg-grid">' + 판.map(function (x) {
      var 그것 = x.id === r.그카드.id && !r.그카드.같은카드;
      var 그림 = 그림id.test(x.id) ? '<img class="' + (x.놓임 === '거꾸로' ? 'rev' : '') + '" src="art/tarot/chaeksa-v1/' + x.id + '-s.webp?v=2" alt="" loading="lazy" decoding="async">' : '';
      return '<div class="tg-c' + (그것 ? ' him' : '') + '">' + 그림 + 칸('p', 'n', x.n + '. ' + (자리이름[x.n] || ''))
        + 칸('p', 'y', x.이름) + 칸('p', 'g', [x.놓임 === '거꾸로' ? P.거꾸로 : '', 등[x.등급] || '', 그것 ? 채움(P.상대표시, { 그: 그부름(b) }) : ''].filter(Boolean).join(' · '))
        + 칸('p', 'm', 연애풀이(x, g)) + '</div>';
    }).join('') + '</div>';
  }
  function 그카드줄(r, b) {
    var K = C.그카드 || {}, 자리이름 = 펼침글.자리 || {}, k = r.그카드;
    if (k.같은카드) return 칸('p', 'why', K.같은카드);
    return 칸('p', '', 채움(K.줄, { 그: 그부름(b), 카드: k.이름 || '' }))
      + (k.자리 ? 칸('p', 'why', 채움(K.나온자리, { 자리: k.자리 + '. ' + (자리이름[k.자리] || '') })) : 칸('p', 'why', K.안나옴));
  }
  function 거르개칸(f, 걸림) {
    var g = 글of(f), 근 = C.근거 || {};
    var 원문 = (f.원문 || []).length ? '<details class="fold"><summary>' + esc(근.원문머리 || f.출처) + '</summary>'
      + f.원문.map(function (t) { return '<p class="q">' + esc(t) + '</p>'; }).join('') + 칸('p', 'why', f.출처 + (f.줄 ? ' · ' + f.줄 : ''))
      + (f.옮김 ? 칸('p', 'why', 근.옮김머리) : '') + '</details>' : '';
    return '<div class="card gh-f' + (걸림 ? ' on' : '') + '" data-f="' + esc(f.id) + '">'
      + '<p class="k">' + 칸('span', 'gh-tag', f.옮김 ? 근.방법표시 : 근.고전표시) + '</p>'
      + '<p class="y">' + esc(g.이름 || '') + ' <small>' + 쪽수(f['%']) + '</small></p>'
      + (걸림 ? 칸('p', '', g.한줄) + 원문 : '') + '</div>';
  }
  function 그리기(r, a, b, 다시) {
    var 걸린 = r.거르개.filter(function (f) { return f.걸림; }).sort(function (x, y) { return x['%'] - y['%']; });
    var 안 = r.거르개.filter(function (f) { return !f.걸림; });
    var 위 = 걸린[0], 위글 = 위 ? 글of(위) : null, R = C.결과 || {}, J = C.조합 || {}, M = C.이번달 || {};
    var 끝 = r.때 && r.때.끝 ? (+r.때.끝.slice(5, 7)) + '월 ' + (+r.때.끝.slice(8, 10)) + '일' : '';
    var h = (다시 ? 칸('p', 'why', M.다시보기) : '')
      + '<div class="big gh-top">' + 칸('p', 'k', R.머리) + 칸('h2', 'gh-name', 위 ? 위글.결과이름 : R.없음이름) + 칸('p', '', 위 ? 위글.한줄 : R.없음한줄)
      + 칸('small', '', 채움(J.줄, { '%': 쪽수(r.조합['%']), 해당수: r.조합.해당수, 표본수: r.조합.표본수 })) + 칸('small', '', 채움(M.줄, { 끝: 끝 })) + '</div>'
      + '<div class="card">' + 그카드줄(r, b) + '</div>'
      + 판그림(r, b)
      + 칸('h3', 'sec', C.걸린머리) + 걸린.map(function (f) { return 거르개칸(f, true); }).join('')
      + (안.length ? '<details class="fold"><summary>' + esc(C.안걸린머리 || '') + '</summary>' + 안.map(function (f) { return 거르개칸(f, false); }).join('') + '</details>' : '')
      + 칸('p', 'sub', C.끝말) + '<div id="gh-end"></div>';
    $('out').innerHTML = h;
    셈(다시 ? 'tarot_gh_pyo_again' : 'tarot_gh_pyo');
    try {
      if ('IntersectionObserver' in global) {
        var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { 셈('tarot_gh_pyo_end'); io.disconnect(); } });
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
  global.ChaeksaTarotGhPyo = { 그리기: 그리기, 거르개칸: 거르개칸 };
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작); else 시작(); }
})(typeof window !== 'undefined' ? window : globalThis);
