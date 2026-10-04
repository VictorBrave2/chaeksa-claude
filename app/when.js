/* 「언제 나아지나」 화면 — 그리기만 한다. 계산은 비공개 서버 /api/when(lib/when.js), 여기엔 판정 · 규칙이 없다.
 * 받는 것: { 올해, 판들: [{ 말, 때, 띠: [{y, 등급}], 지금, 숨통{y, 등급, 왜}, 최고, 바닥{y, 나이, 말}, 맑음{y, 나이, 말} }] } — 판 셋 = 알려 준 시각 · 한 시진 앞 · 뒤.
 * 10-05 사장님 「무료로 공개해」 — 해마다 표 · 앞으로 24달 · 조심할 해와 할 일까지 전부 보여 준다.
 * 「아니에요」 → 다음 판으로 다시 맞춘다. 「맞아요 · 아니에요」는 /api/love-feedback 에 run 「when-…」 · id(b · c + 판 번호)로 남긴다(맞춤 비율 — 생일은 보내지 않는다).
 */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 색 = { 좋음: '#2f6b4f', 나아짐: '#8fb79d', 버팀: '#d9cdb8', 힘듦: '#b5412c' };
  var run = 'when-' + Math.random().toString(36).slice(2, 12);
  var 판들 = [], 지금판 = 0, 올해 = 0;

  try { $('p').innerHTML = window.ChaeksaPlaces ? ChaeksaPlaces.options() : '<option value="KR:서울">서울</option>'; $('p').value = 'KR:서울'; } catch (e) {}

  function 남기기(id, v) {
    try { fetch(API + '/api/love-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: run, id: id, value: v }) }); } catch (e) {}
  }
  function 카드(머, h) {
    if (!h) return '';
    return '<div class="card"><div class="k">' + esc(머) + '</div><div class="y">' + h.y + '년 <small>' + h.나이 + '세</small></div><p>' + esc(h.말) + '</p></div>';
  }
  function 그리기() {
    var P = 판들[지금판]; if (!P) return;
    var 띠 = '<div class="strip">' + P.띠.map(function (h) { return '<div class="cell' + (h.y === 올해 ? ' now' : '') + '" style="background:' + 색[h.등급] + '" title="' + h.y + ' ' + h.등급 + '"><span>' + String(h.y).slice(2) + '</span></div>'; }).join('') + '</div>'
      + '<div class="legend">' + ['힘듦', '버팀', '나아짐', '좋음'].map(function (k) { return '<span><i style="background:' + 색[k] + '"></i>' + k + '</span>'; }).join('') + '</div>';
    var 한줄 = '<b>지금 ' + esc(P.지금 ? P.지금.등급 : '') + '</b>'
      + (P.숨통 && !(P.최고 && P.최고.y === P.숨통.y) ? ' → <b>' + P.숨통.y + '년 나아짐</b>' : '')
      + (P.최고 ? ' → <b>' + P.최고.y + '년 좋음</b>' : '');
    var h = '';
    if (지금판 > 0 && P.때) h += '<div class="redo">태어난 시각이 조금 다를 수 있어요. <b>' + esc(P.말) + '(' + P.때.month + '월 ' + P.때.day + '일 ' + P.때.hour + '시 ' + P.때.minute + '분)</b>으로 다시 맞춰 봤어요.</div>';
    h += '<div class="sec">한눈에 — 해마다 좋다 · 나쁘다</div><div class="card">' + 띠 + '<p style="margin-top:10px;font-size:15px">' + 한줄 + '</p></div>';
    h += '<div class="sec">지나온 해 — 맞나요?</div>';
    h += 카드('가장 힘들었을 해', P.바닥) + (P.바닥 ? '<div class="btns" data-id="b' + 지금판 + '"><button data-v="yes">맞아요</button><button data-v="no">아니에요</button></div>' : '');
    h += 카드('일이 잘 풀렸을 해', P.맑음) + (P.맑음 ? '<div class="btns" data-id="c' + 지금판 + '"><button data-v="yes">맞아요</button><button data-v="no">아니에요</button></div>' : '');
    h += '<div class="sec">그래서, 언제 나아지나</div><div class="big">';
    if (P.바닥) h += '<p>지금은 <b>' + P.바닥.y + '년</b>에 닿았던 바닥을 지나는 중입니다.</p>';
    if (P.숨통 && !(P.최고 && P.최고.y === P.숨통.y)) h += '<p><b>' + P.숨통.y + '년</b>, 처음으로 막힘보다 풀림이 많아집니다.<small>왜 그때? — ' + esc(P.숨통.왜) + '</small></p>';
    if (P.최고) h += '<p><b>' + P.최고.y + '년</b>, 앞으로 가장 좋은 해입니다.' + (P.최고왜 ? '<small>왜 그때? — ' + esc(P.최고왜) + '</small>' : '') + '</p>';
    if (P.할일) h += '<p>지금 할 일 — <b>' + esc(P.할일) + '</b></p>';
    if (!P.숨통 && !P.최고) h += '<p>앞으로 10년 안에 막힘이 확 줄어드는 해가 뚜렷하지 않습니다. 해마다 표에서 가장 덜 막히는 해를 보세요.</p>';
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
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.btns button'); if (!b) return;
    var box = b.parentNode, v = b.getAttribute('data-v');
    남기기(box.getAttribute('data-id'), v);
    if (v === 'yes') { b.classList.add('on'); return; }
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
      판들 = j.판들 || []; 올해 = j.올해; 지금판 = 0; $('err').textContent = '';
      그리기(); if (!그대로) window.scrollTo(0, $('out').offsetTop - 10);
      try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('when_view'); } catch (e2) {}
    } catch (err) { $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  }
})();
