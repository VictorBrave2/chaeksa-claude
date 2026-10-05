/* 「언제 나아지나」 화면 — 그리기만 한다. 계산은 비공개 서버 /api/when(lib/when.js), 여기엔 판정 · 규칙이 없다.
 * 받는 것: { 올해, 판들: [{ 말, 때, 띠: [{y, 등급}], 지금, 숨통{y, 등급, 왜}, 최고, 바닥{y, 나이, 말}, 맑음{y, 나이, 말} }] } — 판 셋 = 알려 준 시각 · 한 시진 앞 · 뒤.
 * 10-05 사장님 「무료로 공개해」 — 해마다 표 · 앞으로 24달 · 조심할 해와 할 일까지 전부 보여 준다.
 * 「아니에요」 → 다음 판으로 다시 맞춘다. 「맞아요 · 아니에요」는 /api/when-board 에 서버가 준 열쇠(표 — 생년월일에서 만든 되돌릴 수 없는 값)와 칸(b · c + 판 번호)으로 남긴다. 한 사람 = 생년월일 하나라 새로고침해 다시 눌러도 늘지 않는다(10-05 2판).
 */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 색 = { 좋음: 'var(--g3)', 나아짐: 'var(--g2)', 버팀: 'var(--g1)', 힘듦: 'var(--g0)' };   // 사이트 공통 등급 색(style.css)
  var 표 = '';   // /api/when 이 준 사람 열쇠
  var 판들 = [], 지금판 = 0, 올해 = 0;

  try { $('p').innerHTML = window.ChaeksaPlaces ? ChaeksaPlaces.options() : '<option value="KR:서울">서울</option>'; $('p').value = 'KR:서울'; } catch (e) {}

  function 남기기(id, v) {
    if (!표) return;
    try { fetch(API + '/api/when-board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: { t: 표, qid: id, value: v } }) }).then(function () { 현황판(); }, function () {}); } catch (e) {}
  }
  // 10-05 사장님 「지인들이 전혀 알아보지 못한다」(글 뜻 · 뭘 하는 화면인지) — 한 번에 다 쏟지 않고 한 걸음씩 연다.
  //   1단계 가장 힘들었을 해 맞추기 → 2단계 잘 풀렸을 해 → 3단계 답(언제 나아지나 · 할 일 · 조심할 해) → 접힌 「자세히」(띠 · 해마다 · 24달).
  //   아니에요(1단계) → 태어난 시각 두 시간 앞 · 뒤 판으로 다시 맞춤. 세 판 다 아니에요면 답은 보여 주되 시각 안내. 「건너뛰고 답 보기」로 언제든 3단계.
  //   문장 틀은 아래 T(작가 원고 when-copy.js) — 사건 말(그해 무슨 일)은 서버가 채운다.
  var T = window.WHEN_COPY || {};
  var 틀 = function (k, v) { return String((T.틀 || {})[k] || '').replace(/\{([^{}]+)\}/g, function (_, n) { return v[n] == null ? '' : v[n]; }); };
  var 화 = function (k, 기본) { return (T.화면 || {})[k] || 기본; };
  var 단계 = 1, 아니수 = 0, 답칸 = {};   // 답칸: b · c 에 누른 값
  var 단추 = function (id) { return '<div class="btns" data-id="' + id + '"><button data-v="yes">맞아요</button><button data-v="no">아니에요</button></div>'; };
  var 끝난칸 = function (h, v) { return '<div class="card done"><div class="k">' + (v === 'yes' ? '✓ 맞아요' : v === 'no' ? '아니에요' : '건너뜀') + '</div><p>' + h.y + '년(' + h.나이 + '세) — ' + esc(h.사건) + '</p></div>'; };
  function 그리기() {
    var P = 판들[지금판]; if (!P) return;
    if (단계 === 1 && !P.바닥) 단계 = 2;
    if (단계 === 2 && !P.맑음) 단계 = 3;
    var h = '', 벌써 = !!(P.지금 && (P.지금.등급 === '나아짐' || P.지금.등급 === '좋음'));
    if (지금판 > 0 && P.때) h += '<div class="redo">' + esc(화('다시맞춤', '태어난 시각이 조금 다를 수 있어요. {말}으로 다시 맞춰 봤어요.').replace('{말}', P.말)) + '</div>';
    h += '<div class="sec">' + esc(화('1단계머리', '먼저, 지나온 해가 맞는지 볼게요')) + '</div>';
    if (P.바닥) h += 단계 === 1 ? '<div class="card qa"><p class="q">' + esc(틀('바닥질문', P.바닥)) + '</p>' + 단추('b' + 지금판) + '</div>' : 끝난칸(P.바닥, 답칸.b);
    if (P.맑음 && 단계 >= 2) h += '<div class="sec">' + esc(화('2단계머리', '일이 잘 풀렸던 해도 맞나요?')) + '</div>';
    if (P.맑음 && 단계 >= 2) h += 단계 === 2 ? '<div class="card qa"><p class="q">' + esc(틀('맑음질문', P.맑음)) + '</p>' + 단추('c' + 지금판) + '</div>' : 끝난칸(P.맑음, 답칸.c);
    if (단계 < 3) { h += '<p class="skip"><a href="#" data-skip="1">' + esc(화('건너뛰기', '맞추기 건너뛰고 답 보기')) + '</a></p>'; $('out').innerHTML = h; return; }
    if (아니수 >= 판들.length) h += '<div class="redo">' + esc(화('다틀림', '세 번 다 맞지 않았어요. 태어난 시각을 정확히 아시면 더 잘 맞아요. 아래 답은 알려 주신 시각으로 셌어요.')) + '</div>';
    h += '<div class="sec">' + esc(화('3단계머리', '그래서, 언제 나아지나')) + '</div><div class="big">';
    if (벌써) h += '<p>' + esc(틀('벌써', { y: 올해 })) + '</p>';
    if (!벌써 && P.숨통 && !(P.최고 && P.최고.y === P.숨통.y)) h += '<p>' + esc(틀('숨통', { y: P.숨통.y, 나이: P.숨통.나이, 왜: P.숨통.왜 })) + '</p>';
    if (P.최고) h += '<p>' + esc(틀('최고', { y: P.최고.y, 나이: P.최고.나이, 사건: P.최고.사건 })) + '</p>';
    if (!벌써 && !P.숨통 && !P.최고) h += '<p>' + esc(틀('없음', {})) + '</p>';
    h += '</div>';
    if (P.할일) h += '<div class="sec">' + esc(화('할일머리', '지금 할 일')) + '</div><div class="card"><p><b>' + esc(P.할일) + '</b></p></div>';
    // 10-05 사장님 「자미두수에서 뾰족한 부분을 짚어 줄 순 없어?」 — 명반에서 가장 크게 흔들리는 곳(막힘별 · 흉별 둘 이상)과 터지는 해
    var V = T.뾰족 || {}, V틀 = function (k, v) { return String((V.틀 || {})[k] || '').replace(/\{([^{}]+)\}/g, function (_, n) { return v[n] == null ? '' : v[n]; }); };
    if (P.뾰족 && P.뾰족.length && V.자리) {
      h += '<div class="sec">' + esc((V.틀 || {}).머리 || '내 삶에서 가장 크게 흔들리는 곳') + '</div>';
      P.뾰족.forEach(function (x, i) {
        var 말 = V.자리[x.곳]; if (!말) return;
        var 해들 = x.지난.map(function (z) { return z.y + '년(' + z.나이 + '세)'; }).join(' · ');
        h += '<div class="card sharp"><p class="q">' + esc(V틀(i ? '둘째' : '첫줄', { 이름: 말.이름 })) + '</p><p>' + esc(말.뾰족) + '</p>'
          + '<p class="why">' + x.까닭.map(function (k) { return esc((V.까닭 || {})[k] || ''); }).join(' ') + '</p>'
          + (해들 ? '<p>' + esc(V틀('지난', { 해들: 해들, 터짐: 말.터짐 })) + (x.지난.some(function (z) { return z.나이 < 20; }) ? ' ' + esc(V틀('어릴때', {})) : '') + '</p>' : '')
          + '<p><b>' + esc(x.다음 ? V틀('다음', { y: x.다음.y, 나이: x.다음.나이, 터짐: 말.터짐 }) : V틀('없음', {})) + '</b></p></div>';
      });
    }
    if (P.조심) h += '<div class="sec">' + esc(화('조심머리', '조심할 해')) + '</div><div class="card"><p>' + esc(틀('조심', P.조심)) + (P.조심.할일.length ? '</p><p style="margin-top:8px"><b>' + P.조심.할일.map(esc).join('<br>') + '</b>' : '') + '</p></div>';
    var 띠 = '<div class="strip">' + P.띠.map(function (x) { return '<div class="cell' + (x.y === 올해 ? ' now' : '') + '" style="background:' + 색[x.등급] + '" title="' + x.y + ' ' + x.등급 + '"><span>' + String(x.y).slice(2) + '</span></div>'; }).join('') + '</div>'
      + '<div class="legend">' + ['힘듦', '버팀', '나아짐', '좋음'].map(function (k) { return '<span><i style="background:' + 색[k] + '"></i>' + k + '</span>'; }).join('') + '</div>';
    var 칩 = function (k) { return '<span class="chip c-' + k + '">' + k + '</span>'; };
    h += '<details class="more"><summary>' + esc(화('더보기', '해마다 · 달마다 자세히 보기')) + '</summary>';
    h += '<div class="card">' + 띠 + '</div>';
    if (P.바닥 && P.바닥.사주말) h += '<p class="why">' + P.바닥.y + '년 — ' + esc(P.바닥.사주말) + '</p>';
    if (P.맑음 && P.맑음.사주말) h += '<p class="why">' + P.맑음.y + '년 — ' + esc(P.맑음.사주말) + '</p>';
    // 10-05 사장님 「사주 길흉판단 · 자미두수 길흉판단이 들어가야」 → 「결론을 합치지 말고 관점만 남겨」 — 결론 칸 · 두 눈 같음 표시 없이 두 관점만 나란히
    var 판칩 = function (k) { return k && k !== '—' ? '<span class="chip p-' + k + '">' + k + '</span>' : '<span class="chip p-평">—</span>'; };
    var 자미칸 = function (풀, 막) { return (풀.length ? '<br><span class="g">+' + 풀.map(esc).join(' +') + '</span>' : '') + (막.length ? '<br><span class="b">−' + 막.map(esc).join(' −') + '</span>' : ''); };
    h += '<p class="why">' + esc(화('표설명', '사주와 자미두수가 그해 · 그달을 각각 길 · 평 · 흉으로 봅니다. 두 관점을 합치지 않고 나란히 둡니다.')) + '</p>';
    // 10-05 사장님 「여기서 짚어 줘야지 — 길흉 판단 + 뾰족한 사건」 — 해마다 한 덩어리: 사주 · 자미두수 판단과 그해 무슨 일, 크게 흔들리는 해는 그 자리 일까지
    var V2 = (T.뾰족 || {}).자리 || {};
    h += '<div class="yrs">' + (P.해들 || []).map(function (x) {
      var 흔 = (x.흔들림 || []).map(function (k) { var m = V2[k]; return m ? '<div class="yr-sharp">크게 흔들리는 해 — ' + esc(m.이름) + '<br><span>' + esc(m.터짐) + '</span></div>' : ''; }).join('');
      return '<div class="yr' + (x.y === 올해 ? ' now' : x.y < 올해 ? ' past' : '') + (흔 ? ' hot' : '') + '"><div class="yr-h"><b>' + x.y + '</b> <small>' + x.나이 + '세' + (x.y === 올해 ? ' · 올해' : '') + (x.대운바뀜 ? ' · 10년 운 바뀜' : '') + '</small></div>'
        + '<div class="yr-l"><span class="yr-k">사주</span>' + 판칩(x.사판) + (x.사왜 ? ' <small>' + esc(x.사왜) + '</small>' : '') + (x.사사건 ? '<div class="yr-e">그해 ' + esc(x.사사건) + '</div>' : '') + '</div>'
        + '<div class="yr-l"><span class="yr-k">자미두수</span>' + 판칩(x.자판) + (x.자사건 ? '<div class="yr-e">그해 ' + esc(x.자사건) + '</div>' : '') + '</div>'
        + 흔 + '</div>';
    }).join('') + '</div>';
    // 10-05 사장님 「24달도 같은 방식으로」 — 달마다 한 덩어리: 사주 판단 · 그달 일 / 자미두수 판단 · 움직이는 자리 · 그달 일 / 크게 흔들리는 자리가 움직이는 달
    var 달말 = T.달 || {};
    h += '<div class="sec">' + esc(화('달머리', '앞으로 24달')) + '</div><div class="yrs">' + (P.달들 || []).map(function (a, i) {
      var 자 = V2[a.곳] || {}, 일 = (달말[a.곳] || {})[a.등급] || '';
      var 흔 = a.흔들림 && 자.이름 ? '<div class="yr-sharp">크게 흔들리는 자리가 움직이는 달 — ' + esc(자.이름) + '</div>' : '';
      return '<div class="yr' + (i === 0 ? ' now' : '') + (흔 ? ' hot' : '') + '"><div class="yr-h"><b>' + a.y + '년 ' + a.m + '월</b>' + (i === 0 ? ' <small>이번 달</small>' : '') + '</div>'
        + '<div class="yr-l"><span class="yr-k">사주</span>' + 판칩(a.사판) + (a.사왜 ? ' <small>' + esc(a.사왜) + '</small>' : '') + (a.사사건 ? '<div class="yr-e">그달 ' + esc(a.사사건) + '</div>' : '') + '</div>'
        + '<div class="yr-l"><span class="yr-k">자미두수</span>' + 판칩(a.자판) + (자.이름 ? ' <small>' + esc(자.이름) + ' 쪽</small>' : '') + (일 ? '<div class="yr-e">그달 ' + esc(일) + '</div>' : '') + '</div>'
        + 흔 + '</div>';
    }).join('') + '</div>';
    h += '<p class="note">계산 — 자미두수 해마다 운(《紫微斗數全書》 卷三), 사주는 판정엔진이 그해 · 그달 운이 원국의 틀을 깨는지 · 막아 주는지 · 바꾸는지로 봅니다. 「맞아요 · 아니에요」는 계산을 다듬는 데만 씁니다(생일은 저장하지 않아요).</p></details>';
    $('out').innerHTML = h;
  }
  // 10-05 사장님 「맞아요를 실시간 현황판으로 — 리뷰 시스템」 「만든 나보다 이용자 리뷰를 더 믿는다」.
  //   들어오자마자 보이게 입력 칸 위에. 아니에요도 그대로 센다(맞아요만 고르면 거짓 현황판). 후기는 맞아요 누른 사람만 한 줄.
  var 몇전 = function (t) { var m = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 60000)); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.round(m / 60) + '시간 전' : Math.round(m / 1440) + '일 전'; };
  var 칸이름 = { b: '가장 힘들었을 해', c: '일이 잘 풀렸을 해' };
  var 판섬 = false;   // 서버에 후기 표가 서기 전(사장님 SQL 전)에는 후기 칸도 안 연다
  async function 현황판() {
    try {
      var r = await fetch(API + '/api/when-board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!r.ok) return;
      판섬 = true;
      var d = await r.json(), 줄 = function (k) { var x = d[k] || {}, 맞 = (x.first || 0) + (x.fixed || 0);
        return '<div class="row2"><span>' + 칸이름[k] + '</span><span><b>맞아요 ' + 맞 + '명</b>' + (x.fixed ? ' (시각 고쳐서 ' + x.fixed + ')' : '') + ' · 아니에요 ' + (x.miss || 0) + '명</span></div>'; };
      var h = '<div class="bd"><span class="live">● 실시간</span><h2>' + esc(d.people ? 화('현황판제목', '지금까지 {n}명이 지나온 해를 맞혀 봤어요').replace('{n}', d.people) : 화('현황판0', '아직 맞혀 본 사람이 없어요. 처음으로 맞혀 보세요.')) + '</h2>';
      if (d.people) h += 줄('b') + 줄('c');
      if (d.reviews && d.reviews.length) h += '<ul>' + d.reviews.map(function (x) { return '<li>「' + esc(x.text) + '」<small>' + (x.y ? x.y + '년' + (x.age != null ? '(' + x.age + '세)' : '') + ' · ' : '') + 칸이름[x.kind] + ' 맞아요 · ' + 몇전(x.at) + '</small></li>'; }).join('') + '</ul>';
      $('board').innerHTML = h + '</div>';
    } catch (e) {}
  }
  현황판(); setInterval(function () { if (!document.hidden) 현황판(); }, 30000);
  function 후기칸(box, id) {
    if (!판섬) return;
    var d = document.createElement('form'); d.className = 'rv';
    d.innerHTML = '<input maxlength="80" placeholder="' + esc(화('후기칸', '그해 무슨 일이 있었나요? 한 줄 후기(선택)')) + '"><button type="submit">남기기</button>';
    box.parentNode.insertBefore(d, box.nextSibling);
    d.addEventListener('submit', async function (e) {
      e.preventDefault();
      var k = id.charAt(0), P = 판들[+id.slice(1)] || {}, h = k === 'b' ? P.바닥 : P.맑음, t = d.querySelector('input').value.trim();
      if (t.length < 2) return;
      try {
        var r = await fetch(API + '/api/when-board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ review: { t: 표, kind: k, y: h ? h.y : null, age: h ? h.나이 : null, text: t } }) });
        var j = await r.json().catch(function () { return {}; });
        if (!r.ok) { alert(j.error || '남기지 못했어요.'); return; }
        d.outerHTML = '<div class="rv-ok">고마워요. 후기가 위 현황판에 올라갔어요.</div>'; 현황판();
      } catch (err) { alert('연결이 잠깐 끊겼어요.'); }
    });
  }
  document.addEventListener('click', function (e) {
    var sk = e.target.closest && e.target.closest('[data-skip]');
    if (sk) { e.preventDefault(); 단계 = 3; 그리기(); return; }
    var b = e.target.closest && e.target.closest('.btns button'); if (!b) return;
    var box = b.parentNode, id = box.getAttribute('data-id'), k = id.charAt(0), v = b.getAttribute('data-v');
    남기기(id, v); 답칸[k] = v;
    if (k === 'b' && v === 'no') {   // 가장 힘들었을 해가 아니면 → 시각을 고쳐 다시 맞춘다
      아니수++;
      if (아니수 < 판들.length) { 지금판 = (지금판 + 1) % 판들.length; 그리기(); return; }
      지금판 = 0; 단계 = 3; 그리기(); return;
    }
    단계 = k === 'b' ? 2 : 3;
    그리기();
    if (v === 'yes') { var 칸 = document.querySelectorAll('#out .card.done'); if (칸.length) 후기칸(칸[칸.length - 1], id); }
  });
  // 10-05 사장님 「이용자 정보 입력은 프로필로 가지고 와야지」 — 이 기기에 넣어 둔 사람(people.js)이 있으면 고르기만 하고 곧장 본다.
  //   처음 온 사람이 칸에 넣으면 「나」로 남겨, 다른 화면에서도 다시 넣지 않게 한다.
  var PP = window.ChaeksaPeople, 사람들 = [];
  function 칸채우기(b) {
    $('y').value = b.year || ''; $('m').value = b.month || ''; $('d').value = b.day || '';
    $('t').value = b.hour == null ? '' : String(b.hour).padStart(2, '0') + ':' + String(b.minute || 0).padStart(2, '0');
    var r = document.querySelector('input[name=g][value=' + (b.gender === 'F' ? 'F' : 'M') + ']'); if (r) r.checked = true;
    if (b.place) { $('p').value = b.place; if ($('p').value !== b.place) $('p').value = 'KR:서울'; }
  }
  function 이름표(p) {
    var b = p.birth, 이름 = p.name && p.name !== '이름 없음' ? p.name : p.relation || '나';
    return 이름 + ' · ' + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? '' : ' ' + b.hour + '시');
  }
  function 고르기(i, 처음) {
    var p = 사람들[i]; if (!p) return;
    Array.prototype.forEach.call(document.querySelectorAll('#who .who button[data-i]'), function (x) { x.classList.toggle('on', +x.getAttribute('data-i') === i); });
    칸채우기(p.birth);
    if (p.birth.hour == null) { $('out').innerHTML = ''; $('f').classList.remove('hide'); $('err').textContent = '이 분은 태어난 시각이 없어요. 시각을 넣어 주세요.'; $('t').focus(); return; }
    $('f').classList.add('hide');
    보기({ year: p.birth.year, month: p.birth.month, day: p.birth.day, hour: p.birth.hour, minute: p.birth.minute || 0, gender: p.birth.gender === 'F' ? 'F' : 'M', place: p.birth.place || 'KR:서울' }, 처음);
  }
  try { if (PP) { PP.migrate(); 사람들 = PP.list().filter(function (p) { return p.birth && p.birth.year; }); } } catch (e) { 사람들 = []; }
  if (사람들.length) {
    var 나 = PP.self(), 먼저 = Math.max(0, 사람들.findIndex(function (p) { return 나 && p.id === 나.id; }));
    $('who').innerHTML = '<p class="who-h">넣어 둔 생년월일로 볼게요</p><div class="who">' + 사람들.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + esc(이름표(p)) + '</button>'; }).join('')
      + '<button type="button" data-new="1">다른 생년월일 넣기</button></div>';
    $('who').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-new')) { Array.prototype.forEach.call(document.querySelectorAll('#who .who button'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); $('f').reset(); $('p').value = 'KR:서울'; $('f').classList.remove('hide'); $('out').innerHTML = ''; $('y').focus(); return; }
      고르기(+b.getAttribute('data-i'));
    });
    $('f').classList.add('hide');
    고르기(먼저, true);
  }
  function 남겨두기(body) {
    try {
      if (!PP || PP.hasSelf()) return;
      var pl = window.ChaeksaPlaces && ChaeksaPlaces.resolve ? ChaeksaPlaces.resolve(body.place) : null;
      var b = { year: body.year, month: body.month, day: body.day, hour: body.hour, minute: body.minute, gender: body.gender, calendar: 'solar', place: body.place };
      if (pl) { b.placeName = pl.name; b.longitude = pl.lon; b.tzOffset = pl.tzOffset; }
      PP.add({ name: '', relation: '나', isSelf: true, birth: b });
    } catch (e) {}
  }
  $('f').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = $('t').value.split(':'), g = (document.querySelector('input[name=g]:checked') || {}).value || 'M';
    var body = { year: +$('y').value, month: +$('m').value, day: +$('d').value, hour: t[0] === '' ? NaN : +t[0], minute: +(t[1] || 0), gender: g, place: $('p').value };
    if (!body.year || !body.month || !body.day || isNaN(body.hour)) { $('err').textContent = '태어난 날과 시각을 다 넣어 주세요.'; return; }
    남겨두기(body);
    보기(body);
  });
  async function 보기(body, 그대로) {
    $('err').textContent = '계산하고 있어요…';
    try {
      var r = await fetch(API + '/api/when', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = await r.json();
      if (!r.ok) { $('err').textContent = j.error || '계산하지 못했어요.'; return; }
      판들 = j.판들 || []; 표 = j.표 || ''; 올해 = j.올해; 지금판 = 0; 단계 = 1; 아니수 = 0; 답칸 = {}; $('err').textContent = '';
      그리기(); if (!그대로) window.scrollTo(0, $('out').offsetTop - 10);
      try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('when_view'); } catch (e2) {}
    } catch (err) { $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  }
})();
