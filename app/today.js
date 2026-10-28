/* 오늘의 운세 쪽(today.html) — 뼈대 화면(10-28). 값은 ChaeksaToday(today-core.js), 글은 조각표(today-pieces.js)에서만.
 * 조각 글이 빈 칸은 손님 화면에서 건너뛴다. 주소에 ?keys 를 붙이면 칸마다 조각 열쇠를 보여 준다(검수용). */
(function () {
  'use strict';
  var T = window.ChaeksaToday, E = window.ChaeksaEngine, PP = window.ChaeksaPeople, 표 = window.ChaeksaTodayPieces || {};
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var 열쇠보기 = /[?&]keys\b/.test(location.search);
  var 글 = function (k, f) { return (표[k] && 표[k][f]) || ''; };
  var 줄 = function (k, f, cls) {
    var t = 글(k, f);
    if (!t && !열쇠보기) return '';
    return '<p class="' + (cls || '') + '">' + (t ? esc(t) : '') + (열쇠보기 ? ' <code class="key">' + esc(k + '.' + f) + '</code>' : '') + '</p>';
  };
  var 날말 = function (s) { var p = s.split('-'); return (+p[1]) + '월 ' + (+p[2]) + '일'; };
  var 요일말 = function (v) { return v.요일 + '요일'; };
  function 오늘사람() {
    try { if (PP && PP.migrate) PP.migrate(); } catch (e) {}
    var all = (PP && PP.list && PP.list()) || [];
    var p = (PP && PP.active && PP.active()) || all[0] || null;
    return { p: p, all: all };
  }
  var 사람 = null, R = null;

  function 고르개(all) {
    if (all.length < 2) { $('who').innerHTML = ''; return; }
    $('who').innerHTML = '<div class="who">' + all.map(function (p) {
      return '<button type="button" data-id="' + esc(p.id) + '"' + (사람 && p.id === 사람.id ? ' class="on"' : '') + '>' + esc(p.name || p.relation || '이름 없음') + '</button>';
    }).join('') + '</div>';
  }

  function 그리기() {
    var 지금 = new Date();
    var v = T.오늘(R, 지금), 주 = T.이번주(R, 지금), 달 = T.이번달(R, 지금);
    var 판 = T.조립(v, 표);
    var h = '';
    // 오늘
    h += '<section class="sec-today" id="todayBox"><p class="when">' + 날말(v.날짜) + ' ' + 요일말(v) + '</p>';
    var 첫 = v.첫줄.열쇠;
    h += 줄(첫, '한줄', 'lead') + 줄(첫, '누구', 'who-line') + 줄(첫, '일', 'what-line') + 줄(첫, '행동', 'do-line');
    if (v.둘째줄) h += 줄(v.둘째줄.열쇠, '한줄', 'second');
    if (v.조용) h += 줄('조용', '한줄', 'quiet');
    v.바탕.forEach(function (b) { h += 줄(b.열쇠, '한줄', 'base'); });
    v.빠짐.forEach(function (b) { h += 줄(b.열쇠, '한줄', 'gone'); });
    h += '</section>';
    // 이번 주
    var 주줄 = 주.날들.map(function (x) {
      var t = 글(x.첫줄.열쇠, '주한줄');
      if (!t && !열쇠보기) return '';
      var 힘 = 주.힘쓸날.indexOf(x.날짜) >= 0;
      return '<li' + (힘 ? ' class="peak"' : '') + '><b>' + 날말(x.날짜) + ' ' + x.요일 + '</b> ' + esc(t) + (열쇠보기 ? ' <code class="key">' + esc(x.첫줄.열쇠 + '.주한줄') + (힘 ? ' · 힘쓸날' : '') + (x.조용 ? ' · 조용' : '') + '</code>' : '') + '</li>';
    }).join('');
    if (주줄) h += '<section class="sec-week"><h2>이번 주</h2><ul class="days">' + 주줄 + '</ul></section>';
    // 이번 달
    if (달.달바뀜) {
      var 달글 = 달.달바뀜.바탕.map(function (b) { return 줄(b.열쇠, '한줄', 'base'); }).join('');
      if (달글) h += '<section class="sec-month"><h2>' + 날말(달.달바뀜.날짜) + '부터</h2>' + 달글 + '</section>';
    }
    // 저녁 기록
    var 하루 = T.기록().하루(사람.id, v.날짜) || {};
    var 답말 = { 비슷: 글('저녁', '비슷') || '비슷했어요', 다름: 글('저녁', '다름') || '달랐어요', 없음: 글('저녁', '없음') || '특별한 일 없었어요' };
    h += '<section class="sec-note"><h2>' + esc(글('저녁', '물음') || '오늘 실제로는 어땠나요?') + '</h2><div class="answers">'
      + ['비슷', '다름', '없음'].map(function (k) { return '<button type="button" data-a="' + k + '"' + (하루.답 === k ? ' class="on"' : '') + '>' + esc(답말[k]) + '</button>'; }).join('')
      + '</div><textarea id="memo" maxlength="200" rows="2" aria-label="메모">' + esc(하루.메모 || '') + '</textarea><p class="saved" id="saved" role="status" aria-live="polite"></p></section>';
    // 이번 달의 나
    var 달기록 = T.기록().달(사람.id, v.날짜.slice(0, 7)).filter(function (x) { return x.예고; });
    if (달기록.length) {
      h += '<section class="sec-diary"><h2>이번 달의 나</h2><ul class="diary">' + 달기록.map(function (x) {
        return '<li><b>' + 날말(x.날짜) + '</b> ' + esc(글(x.예고.첫줄, '한줄')) + (x.답 ? ' <span class="ans">' + esc(답말[x.답]) + '</span>' : '') + (x.메모 ? '<small>' + esc(x.메모) + '</small>' : '') + '</li>';
      }).join('') + '</ul></section>';
    }
    $('out').innerHTML = h;
    T.기록().예고(사람.id, v);
    try { if (window.ChaeksaTrack) { ChaeksaTrack.event('today'); ChaeksaTrack.watchEnd && ChaeksaTrack.watchEnd($('out'), 'today_end'); } } catch (e) {}
    if (열쇠보기) console.log('[오늘의 운세] 빈 조각', 판.빈);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#who button[data-id]');
    if (b) { try { PP.setActive(b.getAttribute('data-id')); } catch (e2) {} 시작(); return; }
    var a = e.target.closest && e.target.closest('.answers button[data-a]');
    if (a && 사람) {
      var 날 = T.오늘(R, new Date()).날짜, ok = T.기록().답(사람.id, 날, a.getAttribute('data-a'), ($('memo') || {}).value);
      Array.prototype.forEach.call(document.querySelectorAll('.answers button'), function (x) { x.classList.toggle('on', x === a); });
      $('saved').textContent = ok ? '남겼어요.' : '이 창에서는 기록을 남길 수 없어요.';
      if (ok) { try { window.ChaeksaTrack && ChaeksaTrack.event('today_note'); } catch (e3) {} }
    }
  });

  document.addEventListener('change', function (e) {
    if (!e.target || e.target.id !== 'memo' || !사람) return;
    var 날 = T.오늘(R, new Date()).날짜, h = T.기록().하루(사람.id, 날);
    if (h && h.답) $('saved').textContent = T.기록().답(사람.id, 날, h.답, e.target.value) ? '남겼어요.' : '이 창에서는 기록을 남길 수 없어요.';
  });

  function 시작() {
    var s = 오늘사람();
    사람 = s.p;
    if (!사람) { $('none').hidden = false; $('out').innerHTML = ''; $('who').innerHTML = ''; return; }
    $('none').hidden = true;
    R = E.calc(PP.toProfile(사람));
    고르개(s.all);
    그리기();
  }
  시작();
})();
