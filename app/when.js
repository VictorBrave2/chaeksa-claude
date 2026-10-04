/* 「언제 나아지나」 화면 — 그리기만 한다. 계산은 비공개 서버 /api/when(lib/when.js), 여기엔 판정 · 규칙이 없다.
 * 받는 것: { 올해, 판들: [{ 말, 때, 띠: [{y, 등급}], 지금, 숨통{y, 등급, 왜}, 최고, 바닥{y, 나이, 말}, 맑음{y, 나이, 말} }] } — 판 셋 = 알려 준 시각 · 한 시진 앞 · 뒤.
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
    if (P.최고) h += '<p><b>' + P.최고.y + '년</b>, 앞으로 가장 좋은 해입니다.</p>';
    if (!P.숨통 && !P.최고) h += '<p>앞으로 10년 안에 막힘이 확 줄어드는 해가 뚜렷하지 않습니다. 해마다 표에서 가장 덜 막히는 해를 보세요.</p>';
    h += '</div>';
    h += '<div class="lock"><b>더 보기(곧 열려요)</b><br>· 해마다 — 사주 · 자미두수 · 결론을 나란히<br>· 앞으로 24달 — 달마다 좋음 · 보통 · 조심<br>· 조심할 해와 그해 하지 말 일</div>';
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
  $('f').addEventListener('submit', async function (e) {
    e.preventDefault();
    var t = $('t').value.split(':'), g = (document.querySelector('input[name=g]:checked') || {}).value || 'M';
    var body = { year: +$('y').value, month: +$('m').value, day: +$('d').value, hour: +t[0], minute: +(t[1] || 0), gender: g, place: $('p').value };
    if (!body.year || !body.month || !body.day || isNaN(body.hour)) { $('err').textContent = '태어난 날과 시각을 다 넣어 주세요.'; return; }
    $('err').textContent = '계산하고 있어요…';
    try {
      var r = await fetch(API + '/api/when', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = await r.json();
      if (!r.ok) { $('err').textContent = j.error || '계산하지 못했어요.'; return; }
      판들 = j.판들 || []; 올해 = j.올해; 지금판 = 0; $('err').textContent = '';
      그리기(); window.scrollTo(0, $('out').offsetTop - 10);
      try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('when_view'); } catch (e2) {}
    } catch (err) { $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  });
})();
