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
  function 카드(머, h) {
    if (!h) return '';
    return '<div class="card"><div class="k">' + esc(머) + '</div><div class="y">' + h.y + '년 <small>' + h.나이 + '세</small></div><p>' + esc(h.말) + '</p></div>';
  }
  function 그리기() {
    var P = 판들[지금판]; if (!P) return;
    var 띠 = '<div class="strip">' + P.띠.map(function (h) { return '<div class="cell' + (h.y === 올해 ? ' now' : '') + '" style="background:' + 색[h.등급] + '" title="' + h.y + ' ' + h.등급 + '"><span>' + String(h.y).slice(2) + '</span></div>'; }).join('') + '</div>'
      + '<div class="legend">' + ['힘듦', '버팀', '나아짐', '좋음'].map(function (k) { return '<span><i style="background:' + 색[k] + '"></i>' + k + '</span>'; }).join('') + '</div>';
    // 10-05 사장님 「나아짐 두 번 나오는 것 고쳐」 — 지금이 이미 나아짐 · 좋음이면 「나아지는 해」를 또 말하지 않는다
    var 벌써 = !!(P.지금 && (P.지금.등급 === '나아짐' || P.지금.등급 === '좋음'));
    var 한줄 = '<b>지금 ' + esc(P.지금 ? P.지금.등급 : '') + '</b>'
      + (!벌써 && P.숨통 && !(P.최고 && P.최고.y === P.숨통.y) ? ' → <b>' + P.숨통.y + '년 나아짐</b>' : '')
      + (P.최고 ? ' → <b>' + P.최고.y + '년 좋음</b>' : '');
    var h = '';
    if (지금판 > 0 && P.때) h += '<div class="redo">태어난 시각이 조금 다를 수 있어요. <b>' + esc(P.말) + '(' + P.때.month + '월 ' + P.때.day + '일 ' + P.때.hour + '시 ' + P.때.minute + '분)</b>으로 다시 맞춰 봤어요.</div>';
    h += '<div class="sec">한눈에 — 해마다 좋다 · 나쁘다</div><div class="card">' + 띠 + '<p style="margin-top:10px;font-size:15px">' + 한줄 + '</p></div>';
    h += '<div class="sec">지나온 해 — 맞나요?</div>';
    h += 카드('가장 힘들었을 해', P.바닥) + (P.바닥 ? '<div class="btns" data-id="b' + 지금판 + '"><button data-v="yes">맞아요</button><button data-v="no">아니에요</button></div>' : '');
    h += 카드('일이 잘 풀렸을 해', P.맑음) + (P.맑음 ? '<div class="btns" data-id="c' + 지금판 + '"><button data-v="yes">맞아요</button><button data-v="no">아니에요</button></div>' : '');
    h += '<div class="sec">그래서, 언제 나아지나</div><div class="big">';
    if (벌써) h += '<p><b>' + 올해 + '년</b>, 이미 막힘보다 풀림이 많은 해입니다.</p>';
    else if (P.바닥) h += '<p>지금은 <b>' + P.바닥.y + '년</b>에 닿았던 바닥을 지나는 중입니다.</p>';
    if (!벌써 && P.숨통 && !(P.최고 && P.최고.y === P.숨통.y)) h += '<p><b>' + P.숨통.y + '년</b>, 처음으로 막힘보다 풀림이 많아집니다.<small>왜 그때? — ' + esc(P.숨통.왜) + '</small></p>';
    if (P.최고) h += '<p><b>' + P.최고.y + '년</b>, 앞으로 가장 좋은 해입니다.' + (P.최고왜 ? '<small>왜 그때? — ' + esc(P.최고왜) + '</small>' : '') + '</p>';
    if (P.할일) h += '<p>지금 할 일 — <b>' + esc(P.할일) + '</b></p>';
    if (!벌써 && !P.숨통 && !P.최고) h += '<p>앞으로 10년 안에 막힘이 확 줄어드는 해가 뚜렷하지 않습니다. 해마다 표에서 가장 덜 막히는 해를 보세요.</p>';
    h += '</div>';
    if (P.조심) h += '<div class="sec">조심할 해</div><div class="card"><div class="k">막힘이 가장 몰리는 해</div><div class="y">' + P.조심.y + '년 <small>' + P.조심.나이 + '세</small></div><p>' + esc(P.조심.말) + (P.조심.할일.length ? '<br><b>' + P.조심.할일.map(esc).join('<br>') + '</b>' : '') + '</p></div>';
    var 칩 = function (k) { return '<span class="chip c-' + k + '">' + k + '</span>'; };
    h += '<div class="sec">해마다 — 사주 · 자미두수 · 결론</div><div class="card tw"><table class="t3"><thead><tr><th>해</th><th>사주</th><th>자미두수</th><th>결론</th></tr></thead><tbody>'
      + (P.해들 || []).map(function (x) { return '<tr class="' + (x.y === 올해 ? 'now' : x.y < 올해 ? 'past' : '') + '"><td>' + x.y + '<br><small>' + x.나이 + '세</small></td><td>' + x.사주.map(esc).join('<br>') + (x.대운바뀜 ? '<br><small>10년 운 바뀜</small>' : '') + '</td><td>'
        + (x.풀.length ? '<span class="g">+' + x.풀.map(esc).join(' +') + '</span>' : '') + (x.풀.length && x.막.length ? '<br>' : '') + (x.막.length ? '<span class="b">−' + x.막.map(esc).join(' −') + '</span>' : '') + (!x.풀.length && !x.막.length ? '—' : '')
        + '</td><td>' + 칩(x.등급) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<div class="sec">앞으로 24달 — 사주 · 자미두수 · 결론</div><div class="card tw"><table class="t3"><thead><tr><th>달</th><th>사주</th><th>자미두수</th><th>결론</th></tr></thead><tbody>'
      + (P.달들 || []).map(function (a, i) { return '<tr><td>' + (i === 0 || a.m === 1 ? a.y + '<br>' : '') + a.m + '월</td><td>' + a.사주.map(esc).join('<br>') + '</td><td>' + esc(a.자리) + ' 자리'
        + (a.좋은.length ? '<br><span class="g">' + a.좋은.map(esc).join(' · ') + '</span>' : '') + (a.나쁜.length ? '<br><span class="b">' + a.나쁜.map(esc).join(' · ') + '</span>' : '')
        + '</td><td>' + 칩(a.등급) + (a.몸돈 ? '<br><small>몸 · 돈 함께</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<p class="note">계산 — 자미두수 해마다 운(《紫微斗數全書》 卷三)과 사주 십성 변화로 셉니다. 「맞아요 · 아니에요」는 계산을 다듬는 데만 씁니다(생일은 저장하지 않아요).</p>';
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
      var h = '<div class="bd"><span class="live">● 실시간</span><h2>' + (d.people ? '지금까지 ' + d.people + '명이 지나온 해를 맞춰 봤어요' : '아직 맞춰 본 사람이 없어요 — 첫 번째로 맞춰 보세요') + '</h2>';
      if (d.people) h += 줄('b') + 줄('c');
      if (d.reviews && d.reviews.length) h += '<ul>' + d.reviews.map(function (x) { return '<li>「' + esc(x.text) + '」<small>' + (x.y ? x.y + '년' + (x.age != null ? '(' + x.age + '세)' : '') + ' · ' : '') + 칸이름[x.kind] + ' 맞아요 · ' + 몇전(x.at) + '</small></li>'; }).join('') + '</ul>';
      $('board').innerHTML = h + '</div>';
    } catch (e) {}
  }
  현황판(); setInterval(function () { if (!document.hidden) 현황판(); }, 30000);
  function 후기칸(box) {
    if (!판섬) return;
    if (box.nextElementSibling && box.nextElementSibling.classList.contains('rv')) return;
    var d = document.createElement('form'); d.className = 'rv';
    d.innerHTML = '<input maxlength="80" placeholder="그해 무슨 일이 있었나요? 한 줄 후기(선택)"><button type="submit">남기기</button>';
    box.parentNode.insertBefore(d, box.nextSibling);
    d.addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = box.getAttribute('data-id'), k = id.charAt(0), P = 판들[+id.slice(1)] || {}, h = k === 'b' ? P.바닥 : P.맑음, t = d.querySelector('input').value.trim();
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
    var b = e.target.closest && e.target.closest('.btns button'); if (!b) return;
    var box = b.parentNode, v = b.getAttribute('data-v');
    남기기(box.getAttribute('data-id'), v);
    if (v === 'yes') { b.classList.add('on'); 후기칸(box); return; }
    if (판들.length > 1) { 지금판 = (지금판 + 1) % 판들.length; 그리기(); window.scrollTo(0, $('out').offsetTop - 10); }
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
      판들 = j.판들 || []; 표 = j.표 || ''; 올해 = j.올해; 지금판 = 0; $('err').textContent = '';
      그리기(); if (!그대로) window.scrollTo(0, $('out').offsetTop - 10);
      try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('when_view'); } catch (e2) {}
    } catch (err) { $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  }
})();
