/* 운 흐름의 표시. 서버가 내린 등급을 높이로 옮긴다. 새 점수·길흉 계산은 하지 않는다. */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var level = { 좋음: 0, 나아짐: 1, 버팀: 2, 힘듦: 3 };
  var names = { 길: '좋음', 흉: '나쁨', 평: '보통', 변화: '전환' };
  function name(k) { return names[k] || '판단 없음'; }
  function chip(k) { return '<span class="wc-chip wc-' + (Object.prototype.hasOwnProperty.call(names, k) ? k : '평') + '">' + esc(name(k)) + '</span>'; }
  // 서버의 현상 문장을 결론부터 읽는다. 길흉·연도·분야는 여기서 새로 정하지 않는다.
  function object(s) { var c = s.charCodeAt(s.length - 1); return s + (c >= 44032 && c <= 55203 && (c - 44032) % 28 ? '을' : '를'); }
  function subject(s) { var c = s.charCodeAt(s.length - 1); return s + (c >= 44032 && c <= 55203 && (c - 44032) % 28 ? '이' : '가'); }
  function sentence(s) {
    s = String(s || '').trim(); if (!s) return '';
    var endings = [['더 좋은 성과를 내는 일','더 좋은 성과를 냅니다.'],['외부 활동은 적게 하는 일','외부 활동은 적습니다.'],['탈 없이 지내는 일','탈 없이 지냅니다.'],['어려움을 겪는 일','어려움을 겪습니다.'],['손해를 보는 일','손해를 봅니다.'],['다시 탈이 나는 일','다시 문제가 생깁니다.'],['탈이 나는 일','문제가 생깁니다.'],['다시 풀리는 일','다시 풀립니다.'],['해결하는 일','해결합니다.'],['시간을 쓰는 일','시간을 씁니다.'],['하던 대로 지내는 일','하던 대로 지냅니다.'],['문제가 풀리는 일','문제가 풀립니다.'],['이름이 알려지고 사람들이 나를 찾는 일','이름이 알려지고 사람들이 나를 찾습니다.'],['들어오는 돈이 늘어나는 일','들어오는 돈이 늘어납니다.'],['일이 잘 풀리고 맡을 자리나 직책이 생기는 일','일이 잘 풀리고 맡을 자리나 직책이 생깁니다.'],['걱정이 줄어 마음이 편해지는 일','걱정이 줄어 마음이 편해집니다.'],['혼자 감당하는 일','혼자 감당합니다.'],['쉬어야 하는 일','쉬어야 합니다.'],['사이가 틀어지는 일','사이가 틀어집니다.'],['기회를 살펴보는 일','기회를 살펴봅니다.'],['돈 될 일을 살펴보는 일','돈 될 일을 살펴봅니다.'],['일을 맡아 해내는 일','일을 맡아 해냅니다.'],['도움을 청하는 일','도움을 청합니다.'],['꾸준히 이어 가는 일','꾸준히 이어 갑니다.'],['표현하는 일','표현합니다.'],['챙기는 일','챙깁니다.'],['해 나가는 일','해 나갑니다.'],['공부하는 일','공부합니다.'],['움직이는 일','움직입니다.'],['어울리는 일','어울립니다.']];
    for (var i = 0; i < endings.length; i++) { var a = endings[i][0]; if (s.slice(-a.length) === a) return s.slice(0, -a.length) + endings[i][1]; }
    if (/손해 보는 일$/.test(s)) return s.replace(/손해 보는 일$/, '손해를 봅니다.');
    return /[.!?。]$/.test(s) ? s : s + '.';
  }
  function sajuText(h) {
    var s = String(h.사현상 || h.사왜 || '').trim(), m;
    if (!s) return '이 해의 상세 풀이를 받지 못했습니다.';
    m = s.match(/^(.*?) 때문에 문제가 생겨도 (.*?) 덕분에 (.*?)에서 탈 없이 지내는 일$/);
    if (m) return object(m[3]) + ' 지킵니다. ' + m[1] + ' 때문에 문제가 생겨도 ' + subject(m[2].replace(/의 도움$/, '')) + ' 해결을 돕습니다.';
    m = s.match(/^문제를 막아 주던 힘이 약해져 (.*?) 때문에 (.*?)에서 어려움을 겪는 일$/);
    if (m) return m[2] + '에서 어려움을 겪습니다. ' + m[1] + ' 때문에 생기는 문제를 막아 주던 도움이 약해집니다.';
    m = s.match(/^(.*?) 때문에 (.*?)에서 해결되지 않던 문제가 (.*?) 덕분에 다시 풀리는 일$/);
    if (m) return m[2] + '에서 막혔던 일이 다시 풀립니다. ' + m[3] + ' 덕분에 ' + m[1] + ' 때문에 생긴 문제를 해결합니다.';
    m = s.match(/^(.*?)보다 (.*?)에 더 관심을 두고 시간을 쓰는 일$/);
    if (m) return m[2] + '에 집중합니다. ' + m[1] + '보다 여기에 더 많은 시간을 씁니다.';
    m = s.match(/^(.*?)에서 크게 달라지는 것 없이, (.*)$/);
    if (m) return m[1] + '에서는 큰 변화가 없습니다. ' + sentence(m[2]);
    if (s === '배우고 준비하는 데 시간을 많이 쓰고 외부 활동은 적게 하는 일') return '배움과 준비에 시간이 많이 듭니다. 실제로 밖에서 활동하는 일은 적습니다.';
    return sentence(s);
  }
  function ziweiText(h) { return String(h.자사건 || '').split(', ').filter(Boolean).map(sentence).join(' '); }
  function firstSentence(s) { return String(s).split('. ')[0].replace(/\.$/, '') + '.'; }
  function runOf(years) {
    var run = [], ended = false;
    years.forEach(function (h) {
      if (ended) return;
      if (h.사판 === '길' && h.자판 === '길') {
        if (run.length && h.y !== run[run.length - 1].y + 1) { ended = true; return; }
        run.push(h);
      } else if (run.length) ended = true;
    });
    return run;
  }
  function description(h) {
    return '<div class="wc-reading"><div><span class="wc-kind">사주로 보면</span>' + chip(h.사판) + '<p>' + esc(sajuText(h)) + '</p></div>'
      + '<div><span class="wc-kind">자미두수로 보면</span>' + chip(h.자판) + '<p>' + esc(ziweiText(h) || '구체적으로 어떤 일이 생기는지는 이 해의 풀이에 나와 있지 않습니다.') + '</p></div></div>';
  }
  function selected(h) {
    var same = h.사판 === '길' && h.자판 === '길' ? '운이 풀리는 해입니다.' : h.사판 === '흉' && h.자판 === '흉' ? '고비를 겪는 해입니다.' : (h.사판 === '길' && h.자판 === '흉') || (h.사판 === '흉' && h.자판 === '길') ? '좋은 운과 어려운 운이 함께 있습니다.' : h.사판 === '변화' ? '힘을 쏟는 일이 달라집니다.' : h.자판 === '길' ? '자미두수로는 운이 좋은 해입니다.' : h.사판 === '길' ? '사주로는 운이 좋은 해입니다.' : h.사판 === '흉' || h.자판 === '흉' ? '어려운 일이 무엇인지 짚어볼 해입니다.' : '큰 변화보다 하던 일을 이어가는 해입니다.';
    return '<div class="wc-selected-head"><h3>' + h.y + '<small>년</small></h3><span>' + esc(same) + '</span></div>' + (h.대운바뀜 ? '<p class="wc-turn">10년 운이 바뀌는 해</p>' : '') + description(h);
  }
  function render(P, now) {
    var all = (P.해들 || []).filter(function (h) { return Number.isInteger(h.y); }).sort(function (a, b) { return a.y - b.y; });
    var years = all.filter(function (h) { return h.y >= now && h.y <= now + 10 && Object.prototype.hasOwnProperty.call(level, h.등급); });
    if (!years.length) return '<p class="why">운의 흐름 자료를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>';
    var run = runOf(years), first = run[0] || years.find(function (z) { return z.자판 === '길'; }) || years.find(function (z) { return z.사판 === '길'; }) || years[0];
    var heading = run.length ? '사주와 자미두수로 본 나의 운' : first.자판 === '길' ? '자미두수로 본 나의 운' : first.사판 === '길' ? '사주로 본 나의 운' : '앞으로 10년의 운';
    var headline = run.length ? first.y + '년' + (run.length > 1 ? '부터' : '에') + '<br>운이 풀립니다.' : first.자판 === '길' || first.사판 === '길' ? first.y + '년에<br>좋은 운이 들어옵니다.' : '크게 풀리는 해보다<br>고비를 살펴야 합니다.';
    var sub = run.length > 1 ? run[run.length - 1].y + '년까지 좋은 운이 이어집니다.' : run.length ? '사주와 자미두수 모두 이 해를 좋게 봅니다.' : first.자판 === '길' ? '사주에서는 ' + firstSentence(sajuText(first)) : first.사판 === '길' ? '자미두수에서는 ' + (ziweiText(first) || '이 해를 ' + first.등급 + '으로 봅니다.') : '앞으로 10년에는 두 풀이 모두 뚜렷한 길운을 잡지 못했습니다. 해마다 겪는 일은 다릅니다.';
    var current = years.find(function (z) { return z.y === now; }), warning = years.find(function (z) { return z.y < first.y && z.사판 === '흉' && z.자판 === '흉'; });
    var direct = (first.자판 === '길' ? ziweiText(first) : '') || (first.사판 === '길' ? firstSentence(sajuText(first)) : '');
    var answers = '<div class="wc-answers">' + (current && current.y !== first.y ? '<div><span>지금은</span><p>' + esc(firstSentence(sajuText(current))) + '</p></div>' : '') + (direct ? '<div><span>' + first.y + '년에는</span><p>' + esc(direct) + '</p></div>' : '') + (warning ? '<div class="wc-caution"><span>그전에 ' + warning.y + '년</span><p>' + esc(firstSentence(sajuText(warning))) + '</p></div>' : '') + '</div>';
    var x = function (i) { return 96 + i * 608 / Math.max(1, years.length - 1); }, y = function (h) { return 52 + level[h.등급] * 56; };
    var path = years.map(function (h, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(h); }).join(' ');
    var svg = '<svg viewBox="0 0 760 278" role="img" aria-label="' + esc(years.map(function (h) { return h.y + '년 ' + h.등급; }).join(', ')) + '"><title>자미두수로 본 연도별 운의 높낮이</title>';
    if (run.length) { var start = years.indexOf(run[0]), end = years.indexOf(run[run.length - 1]); svg += '<rect x="' + (x(start) - 18) + '" y="30" width="' + (x(end) - x(start) + 36) + '" height="206" rx="6" class="wc-band"/>'; }
    ['좋음', '나아짐', '버팀', '힘듦'].forEach(function (s, i) { svg += '<text x="9" y="' + (58 + i * 56) + '" class="wc-axis">' + s + '</text><line x1="80" y1="' + (52 + i * 56) + '" x2="728" y2="' + (52 + i * 56) + '" class="wc-grid"/>'; });
    svg += '<path d="' + path + ' L' + x(years.length - 1) + ' 236 L96 236 Z" class="wc-area"/><path d="' + path + '" class="wc-line"/>';
    years.forEach(function (h, i) { svg += '<circle cx="' + x(i) + '" cy="' + y(h) + '" r="5" class="wc-point' + (h.등급 === '힘듦' ? ' wc-low' : '') + '"/><text x="' + x(i) + '" y="260" text-anchor="middle" class="wc-tick' + (i % 2 ? ' wc-odd' : '') + '">' + h.y + '</text>'; });
    svg += '<circle id="wc-focus" cx="' + x(years.indexOf(first)) + '" cy="' + y(first) + '" r="13" class="wc-focus"/></svg>';
    var h = '<section class="wc-intro"><p class="eyebrow">' + heading + '</p><h2>' + headline + '</h2><p>' + esc(sub) + '</p>' + answers + '</section><section class="wc-chart card" aria-label="운의 흐름 차트"><div class="wc-caption"><b>언제 오르고, 언제 내려갈까</b><span>자미두수 · 앞으로 10년</span></div>' + svg
      + '<div class="wc-caption wc-compare"><b>같은 해, 사주는?</b><span>연도를 눌러 보세요</span></div><div class="wc-years">'
      + years.map(function (z, i) { return '<button type="button" data-wc-year="' + z.y + '" data-wc-x="' + x(i) + '" data-wc-y="' + y(z) + '" aria-label="' + z.y + '년 사주 ' + esc(name(z.사판)) + ' 풀이" aria-pressed="' + (z.y === first.y) + '"><b>' + z.y + '</b>' + chip(z.사판) + '</button>'; }).join('')
      + '</div><details class="wc-chart-help"><summary>차트 읽는 법</summary><p class="wc-note">높이는 자미두수의 네 등급입니다. 사주 판단은 아래에 따로 표시했습니다. 연결선은 연도별 흐름이며 월별 변화나 점수가 아닙니다.</p></details></section><section class="card wc-selected" id="wc-selected" aria-live="polite" aria-atomic="true">' + selected(first) + '</section>';
    h += '<details class="more wc-details"><summary>해마다 자세히 보기 · 지난 해 포함</summary>' + all.map(function (z) { return '<article class="yr"><div class="yr-h"><b>' + z.y + '년</b><small>' + (z.y === now ? ' · 올해' : z.y < now ? ' · 지난 해' : '') + (z.대운바뀜 ? ' · 10년 운 바뀜' : '') + '</small></div>' + description(z) + '</article>'; }).join('') + '</details>';
    h += '<details class="more wc-details"><summary>앞으로 24개월 자세히 보기</summary><p class="why">그해의 판단과 그달 운을 더한 판단을 함께 봅니다. 사주는 입춘, 자미두수는 음력 설을 기준으로 해가 바뀝니다.</p>' + (P.달들 || []).map(function (m) {
      var monthText = ((window.WHEN_READING_MONTHS || {})[m.곳] || {})[m.등급];
      return '<article class="yr"><div class="yr-h"><b>' + esc(m.y) + '년 ' + esc(m.m) + '월</b></div><div class="wc-reading"><div><span class="wc-kind">사주</span><small>그해 </small>' + chip(m.사년판) + ' <small>이달 </small>' + chip(m.사판) + '<p>' + esc(sajuText(m)) + '</p></div><div><span class="wc-kind">자미두수</span><small>그해 </small>' + chip(m.자년판) + ' <small>이달 </small>' + chip(m.자판) + '<p>' + esc(monthText || (m.자리 ? m.자리 + '에 관한 달입니다.' : '이달의 상세 풀이를 받지 못했습니다.')) + '</p></div></div></article>';
    }).join('') + '</details><p class="wc-note">해마다 들어오는 운을 현재 계산 기준으로 읽었습니다. 두 판단이 다르면 각각의 결과를 그대로 보여드립니다.</p><div class="share-row"><button type="button" class="btn ghost small" data-share="1">이 화면 친구에게 보내기</button><p id="shareMsg" class="why"></p></div>';
    return h;
  }
  function select(root, P, button) {
    var h = (P.해들 || []).find(function (z) { return z.y === Number(button.getAttribute('data-wc-year')); }); if (!h) return;
    Array.prototype.forEach.call(root.querySelectorAll('[data-wc-year]'), function (b) { b.setAttribute('aria-pressed', String(b === button)); });
    root.querySelector('#wc-selected').innerHTML = selected(h);
    var ring = root.querySelector('#wc-focus'); ring.setAttribute('cx', button.getAttribute('data-wc-x')); ring.setAttribute('cy', button.getAttribute('data-wc-y'));
  }
  window.ChaeksaWhenChart = { render: render, select: select };
})();
