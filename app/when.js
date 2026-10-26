/* 내 운은 언제 풀릴까 — 서버의 원래 출생시각 결과를 차트로 표시한다. */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 판들 = [], 지금판 = 0, 올해 = 0, 요청번호 = 0;
  try { $('p').innerHTML = window.ChaeksaPlaces ? ChaeksaPlaces.options() : '<option value="KR:서울">서울</option>'; $('p').value = 'KR:서울'; } catch (e) {}
  $('y').max = String(new Date().getFullYear());
  function 그리기() {
    if (!판들[0]) return;
    $('out').innerHTML = window.ChaeksaWhenChart.render(판들[0], 올해);
  }
  $('out').addEventListener('click', async function (e) {
    var b = e.target.closest && e.target.closest('[data-wc-year]');
    if (b && 판들[0]) { window.ChaeksaWhenChart.select($('out'), 판들[0], b); return; }
    if (!(e.target.closest && e.target.closest('[data-share]'))) return;
    var url = 'https://chaeksa.kr/when.html', msg = $('shareMsg');
    try {
      var r = window.ChaeksaShare && ChaeksaShare.shareLink ? await ChaeksaShare.shareLink({ title: '내 운은 언제 풀릴까? — 책사', text: '앞으로 10년의 운을 차트로 살펴보세요. 무료예요.', url: url }) : '';
      if (msg) msg.textContent = r === 'copied' ? '주소를 복사했어요.' : r === '' ? '이 주소를 보내 주세요 — ' + url : '';
    } catch (err) { if (msg) msg.textContent = '이 주소를 보내 주세요 — ' + url; }
  });
  // 10-05 사장님 「이용자 정보 입력은 프로필로 가지고 와야지」 — 이 기기에 넣어 둔 사람(people.js)이 있으면 고르기만 하고 곧장 본다.
  //   처음 온 사람이 칸에 넣으면 「나」로 남겨, 다른 화면에서도 다시 넣지 않게 한다.
  var PP = window.ChaeksaPeople, 사람들 = [];
  function 칸채우기(b) {
    $('y').value = b.year || ''; $('m').value = b.month || ''; $('d').value = b.day || '';
    $('hh').value = b.hour == null ? '' : b.hour; $('mi').value = b.hour == null ? '' : (b.minute || 0);
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
    if (p.birth.hour == null) { $('out').innerHTML = ''; $('f').classList.remove('hide'); $('err').textContent = '선택한 사람의 태어난 시각이 비어 있어요. 시각을 넣으세요.'; $('hh').focus(); return; }
    $('f').classList.add('hide');
    보기({ year: p.birth.year, month: p.birth.month, day: p.birth.day, hour: p.birth.hour, minute: p.birth.minute || 0, gender: p.birth.gender === 'F' ? 'F' : 'M', place: p.birth.place || 'KR:서울' }, 처음);
  }
  try { if (PP) { PP.migrate(); 사람들 = PP.list().filter(function (p) { return p.birth && p.birth.year; }); } } catch (e) { 사람들 = []; }
  if (사람들.length) {
    var 나 = PP.self(), 먼저 = Math.max(0, 사람들.findIndex(function (p) { return 나 && p.id === 나.id; }));
    $('who').innerHTML = '<p class="who-h">저장한 생년월일로 봐요</p><div class="who">' + 사람들.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + esc(이름표(p)) + '</button>'; }).join('')
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
    // 시 · 분 숫자 칸(10-06 사장님 「시간 입력 바꿔 줘」) — 분은 비우면 0, 시는 0~23 · 분은 0~59 만
    var 시 = $('hh').value.trim(), 분 = $('mi').value.trim(), g = (document.querySelector('input[name=g]:checked') || {}).value || 'M';
    var body = { year: +$('y').value, month: +$('m').value, day: +$('d').value, hour: 시 === '' || +시 < 0 || +시 > 23 || +시 % 1 ? NaN : +시, minute: 분 === '' ? 0 : +분, gender: g, place: $('p').value };
    if (isNaN(body.minute) || body.minute < 0 || body.minute > 59 || body.minute % 1) { $('err').textContent = '분은 0부터 59까지 넣어 주세요.'; return; }
    if (!body.year || !body.month || !body.day || isNaN(body.hour)) { $('err').textContent = '태어난 날과 시각을 다 넣어 주세요.'; return; }
    남겨두기(body);
    보기(body);
  });
  async function 보기(body, 그대로) {
    var 번호 = ++요청번호;
    $('out').innerHTML = '';
    $('err').textContent = '운의 흐름을 계산하고 있어요…';
    try {
      var r = await fetch(API + '/api/when', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = await r.json();
      if (번호 !== 요청번호) return;
      if (!r.ok) { $('err').textContent = j.error || '계산하지 못했어요.'; return; }
      판들 = j.판들 || []; 올해 = j.올해; 지금판 = 0; $('err').textContent = '';
      if (!판들[0]) { $('err').textContent = '운의 흐름 자료를 받지 못했어요. 다시 눌러 주세요.'; return; }
      그리기(); if (!그대로) window.scrollTo(0, $('out').offsetTop - 10);
      try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('when_view'); } catch (e2) {}
    } catch (err) { if (번호 === 요청번호) $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  }
})();
