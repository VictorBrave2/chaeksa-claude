/* 「옛 책은 내 명식을 반겼을까」(gyeokgi.html, 작업판 34 옛책격) — 그리기만 한다. 계산은 비공개 서버 /api/gyeokgi.
 * 10-11 사장님 「명식을 넣으면 ~에 해당합니다 ~에 해당합니다 식으로 필터에 걸러지는 느낌」 → 「3으로 바로 가」.
 * 서버가 주는 것: 해당(hit) · 시따라(시를 모를 때 어느 시면 해당) · 아깝게(조건 하나 모자람, 드문 것부터 다섯). 격마다 이름 · 책 · 원문 · 출처 · 근거 · p(6만 명 가운데 %).
 * 문장(뜻 · 짜임 · 쪽 글)은 작가 원고 gyeokgi-copy.js. 판정 없음. 입력 흐름은 gwi.js 와 같다(넣어 둔 사람 고르기 · 처음 넣은 생일은 「나」로).
 */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var C = window.GYEOKGI_COPY || {}, 쪽 = C._page || {}, 격글 = C.격 || {};
  var 셌다 = false;
  try { $('p').innerHTML = window.ChaeksaPlaces ? ChaeksaPlaces.options() : '<option value="KR:서울">서울</option>'; $('p').value = 'KR:서울'; } catch (e) {}
  if (쪽.제목) $('h1').textContent = 쪽.제목;
  $('sub').textContent = 쪽.한줄 || '삼명통회 · 연해자평 · 적천수가 이름 붙여 반긴 드문 격 362개에 내 명식을 하나씩 대 봐요.';
  $('hint').textContent = 쪽.입력안내 || '시를 모르면 비워 두세요. 열두 시를 다 넣어 보고, 시에 따라 갈리는 격은 따로 알려 드려요.';
  var 출처말 = function (s) { return String(s || '').replace(/ · (docs|jamidusu)\/\S+/g, ''); };
  function 칸(x, 머리) {
    var a = 격글[x.key] || {};
    return '<div class="card hit"><p class="pct">' + esc(머리) + (x.p == null ? '' : ' · 100명 가운데 ' + esc(x.p) + '명') + '</p>'
      + '<div class="y" style="font-size:var(--t4)">' + esc(x.이름) + '</div>'
      + (a.뜻 ? '<p>' + esc(a.뜻) + '</p>' : '')
      + (x.시 && x.시.length ? '<p class="why">태어난 시가 ' + esc(x.시.join(' · ')) + '시면 해당합니다.</p>' : '')
      + '<details class="fold"><summary>원문 · 짜임 보기</summary><p class="q" lang="zh-Hant">' + esc(x.원문) + '</p>'
      + (a.짜임 ? '<p class="why">' + esc(a.짜임) + '</p>' : '')
      + '<p class="why"><small>내 명식에서: ' + esc(x.근거) + '<br>' + esc(x.책) + ' · ' + esc(출처말(x.출처)) + '</small></p></details></div>';
  }
  function 그리기(j) {
    var h = '<p class="sec">' + esc(j.명식 || '') + '</p>';
    if (j.해당.length) {
      h += j.해당.map(function (x) { return 칸(x, x.이름 + '에 해당합니다'); }).join('');
    } else {
      h += '<div class="big"><p>' + esc(쪽.빈칸 || '드문 격 362개 가운데 딱 들어맞는 것은 없었어요. 아래에 아깝게 빗나간 격을 모았어요.') + '</p></div>';
    }
    if (j.시따라.length) h += '<p class="sec">태어난 시에 따라 해당하는 격</p>' + j.시따라.map(function (x) { return 칸(x, '시에 따라 해당'); }).join('');
    if (j.아깝게.length) h += '<p class="sec">' + esc(쪽.모자람머리 || '조건 하나가 모자라 아깝게 빗나간 격') + '</p>' + j.아깝게.map(function (x) { return 칸(x, '아깝게 빗나감'); }).join('');
    h += '<p class="note">옛 책이 적은 조건만 그대로 대 봤어요. 「많다 · 왕하다」처럼 옛 책이 재는 법을 정하지 않은 말이 든 격은 넣지 않았어요. 해당 비율은 1950~2009년생 6만 명에 대 본 값이에요.</p>';
    $('out').innerHTML = h;
  }
  var PP = window.ChaeksaPeople, 사람들 = [];
  function 칸채우기(b) {
    $('y').value = b.year || ''; $('m').value = b.month || ''; $('d').value = b.day || '';
    $('hh').value = b.hour == null ? '' : b.hour; $('mi').value = b.hour == null ? '' : (b.minute || 0);
    var r = document.querySelector('input[name=g][value=' + (b.gender === 'F' ? 'F' : 'M') + ']'); if (r) r.checked = true;
    if (b.place) { $('p').value = b.place; if ($('p').value !== b.place) $('p').value = 'KR:서울'; }
  }
  function 이름표(p) { var b = p.birth, 이름 = p.name && p.name !== '이름 없음' ? p.name : p.relation || '나'; return 이름 + ' · ' + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? ' (시 모름)' : ' ' + b.hour + '시'); }
  function 고르기(i) {
    var p = 사람들[i]; if (!p) return;
    Array.prototype.forEach.call(document.querySelectorAll('#who .who button[data-i]'), function (x) { x.classList.toggle('on', +x.getAttribute('data-i') === i); });
    칸채우기(p.birth);
    $('f').classList.add('hide');
    var 모름 = p.birth.hour == null;
    보기({ year: p.birth.year, month: p.birth.month, day: p.birth.day, hour: 모름 ? null : p.birth.hour, minute: 모름 ? null : (p.birth.minute || 0), gender: p.birth.gender === 'F' ? 'F' : 'M', place: p.birth.place || 'KR:서울' });
  }
  try { if (PP) { PP.migrate(); 사람들 = PP.list().filter(function (p) { return p.birth && p.birth.year; }); } } catch (e) { 사람들 = []; }
  if (사람들.length) {
    var 나 = PP.self(), 먼저 = Math.max(0, 사람들.findIndex(function (p) { return 나 && p.id === 나.id; }));
    $('who').innerHTML = '<p class="who-h">넣어 둔 생년월일로 볼게요</p><div class="who">' + 사람들.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + esc(이름표(p)) + '</button>'; }).join('') + '<button type="button" data-new="1">다른 생년월일 넣기</button></div>';
    $('who').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-new')) { Array.prototype.forEach.call(document.querySelectorAll('#who .who button'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); $('f').reset(); $('p').value = 'KR:서울'; $('f').classList.remove('hide'); $('out').innerHTML = ''; $('y').focus(); return; }
      고르기(+b.getAttribute('data-i'));
    });
    $('f').classList.add('hide');
    고르기(먼저);
  }
  // 처음 넣은 생년월일은 「나」로 남겨 둔다(when.js 와 같은 길) — 이미 「나」가 있으면 건드리지 않는다
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
    // 시 · 분 숫자 칸 — 시는 비우면 「시 모름」(서버가 열두 시를 다 넣어 본다), 넣으면 0~23 · 분은 0~59 만
    var 시 = $('hh').value.trim(), 분 = $('mi').value.trim(), g = (document.querySelector('input[name=g]:checked') || {}).value || 'M';
    var hour = 시 === '' ? null : (+시 < 0 || +시 > 23 || +시 % 1 || isNaN(+시) ? NaN : +시);
    var body = { year: +$('y').value, month: +$('m').value, day: +$('d').value, hour: hour, minute: hour == null ? null : (분 === '' ? 0 : +분), gender: g, place: $('p').value };
    if (isNaN(hour)) { $('err').textContent = '시는 0부터 23까지 넣어 주세요. 모르면 비워 두세요.'; return; }
    if (hour != null && (isNaN(body.minute) || body.minute < 0 || body.minute > 59 || body.minute % 1)) { $('err').textContent = '분은 0부터 59까지 넣어 주세요.'; return; }
    if (!body.year || !body.month || !body.day) { $('err').textContent = '태어난 날을 다 넣어 주세요.'; return; }
    남겨두기(body);
    보기(body);
  });
  async function 보기(body) {
    $('err').textContent = '옛 책 362개 격에 대 보고 있어요…';
    try {
      var r = await fetch(API + '/api/gyeokgi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = await r.json();
      if (!r.ok) { $('err').textContent = j.error || '계산하지 못했어요.'; return; }
      $('err').textContent = '';
      그리기(j);
      if (!셌다) { 셌다 = true; try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('gyeokgi'); } catch (e2) {} }
    } catch (err) { $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  }
})();
