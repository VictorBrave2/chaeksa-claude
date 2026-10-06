/* 「옛 책이 본 내 머리」 시제품 — 그리기만 한다. 계산은 비공개 서버 /api/brain(옛 책 총명 표지 · 적응력 렌즈 셋 · 남녀 각 12,932명 분포).
 * 10-06 사장님 「진짜냐 가짜냐가 아니라 먼저 당신이 고지능자인지 아닌지 우리가 제시하고 이용자가 맞아요 · 아니요 고르게」 · 「화면 시제품 ㄱㄱ」.
 * 물음 셋 — 옛 책(A) · 생각의 갈래(L1) · 생각의 흐름(L2). 버티는 힘(L3)은 10-06 사장님 「버티는 힘 삭제」로 걷었다.
 * 답은 /api/love-feedback 에 run 「brain-<서버가 준 열쇠>」 · id 로 남긴다(생일은 보내지 않는다).
 * 문장 틀은 brain-copy.js(작가 원고). 셋을 하나로 합치지 않는다(사장님 「결론을 합치지 말고 관점만 남겨」).
 */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var C = (window.BRAIN_COPY || {}).화면 || {};
  var 화 = function (k, 기본) { return C[k] || 기본; };
  var 틀 = function (t, v) { return String(t || '').replace(/\{([^{}]+)\}/g, function (_, n) { return v[n] == null ? '' : v[n]; }); };
  var 표 = '', 결과 = null;

  try { $('p').innerHTML = window.ChaeksaPlaces ? ChaeksaPlaces.options() : '<option value="KR:서울">서울</option>'; $('p').value = 'KR:서울'; } catch (e) {}
  if (C.h1) $('h1').textContent = C.h1;
  $('sub').textContent = 화('sub', '옛 책이 「머리 자체」를 말한 대목으로 내 명식을 봅니다. 다 보신 뒤 맞아요 · 아니에요를 눌러 주세요. 그 답이 쌓여 어느 쪽이 맞는지 가립니다.');

  function 남기기(id, v) {
    if (!표) return;
    try { fetch(API + '/api/love-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: 'brain-' + 표, id: id, value: v }) }); } catch (e) {}
  }
  var 단추 = function (id) { return '<div class="btns" data-id="' + id + '"><button data-v="yes">맞아요</button><button data-v="no">아니에요</button></div><p class="why" data-after="' + id + '"></p>'; };
  var 위치말 = function (p) { return p <= 2 ? 화('고지능', '옛 책 기준으로 고지능 쪽이에요.') : p <= 20 ? 화('높은편', '높은 편이에요.') : p <= 60 ? 화('가운데', '가운데쯤이에요.') : 화('낮은편', '낮은 편이에요.'); };
  var 성별말 = function (g) { return g === 'F' ? '여자' : '남자'; };
  function 표지칸(x) {
    return '<div class="card"><p class="q" lang="zh-Hant">' + esc(x.원문) + '</p><p>' + esc(x.뜻) + '</p><p class="why">' + esc(x.근거) + '<br><small>' + esc(String(x.출처 || '').replace(/ · (docs|jamidusu)\/\S+/g, '')) + '</small></p></div>';
  }
  function 그리기() {
    var R = 결과; if (!R) return;
    var 옛 = R.옛, 렌 = R.렌즈, h = '';
    // 첫 줄 — 옛 책 표지 개수와 같은 성별 가운데 위치
    h += '<div class="big"><p>' + esc(틀(화('첫줄', '옛 책이 꼽은 총명의 표지 {n}개 — 같은 {성별} 가운데 상위 {p}%'), { n: 옛.n, p: 옛.p, 성별: 성별말(R.성별) })) + '</p><p><b>' + esc(위치말(옛.p)) + '</b></p></div>';
    // A — 옛 책이 총명하다고 한 자리
    var 걸 = 옛.사주.concat(옛.자미);
    h += '<div class="sec">' + esc(화('A머리', '옛 책이 총명하다고 한 자리')) + '</div><p class="why">' + esc(화('A설명', '옛 책 가운데 공부가 아니라 머리 자체를 말한 대목만 골랐어요.')) + '</p>';
    h += 걸.length ? 걸.map(표지칸).join('') : '<div class="card"><p>' + esc(화('A없음', '옛 책이 꼽은 표지에 걸리는 자리가 없어요.')) + '</p></div>';
    var 안 = 옛.안걸린 || [];
    if (안.length) h += '<details class="fold"><summary>' + esc(틀(화('A나머지', '해당하지 않은 대목 {값}개 펼쳐 보기'), { 값: 안.length })) + '</summary>' + 안.map(표지칸).join('') + '</details>';
    h += '<p class="q2">' + esc(화('A물음', '옛 책 기준 결과가 나에게 맞나요?')) + '</p>' + 단추('A');
    // B — 렌즈 둘(갈래 · 흐름)
    var L = (C.렌즈 || {});
    var 렌즈칸 = function (key, id, 값, 값말, 기본이름, 기본설명) {
      var c = L[key] || {}, r = 렌[key];
      return '<div class="card"><div class="k">' + esc(c.이름 || 기본이름) + '</div><div class="y">' + esc(값말) + '</div><p>' + esc(c.설명 || 기본설명) + '</p>'
        + '<p class="why">' + esc(틀(c.위치 || '같은 {성별}끼리 견주면 상위 {p}%예요.', { p: r.p, 성별: 성별말(R.성별), 값: 값 })) + '</p>'
        + '<p class="q2">' + esc(화('B물음', '이 결과가 나에게 맞나요?')) + '</p>' + 단추(id) + '</div>';
    };
    h += '<div class="sec">' + esc(화('B머리', '생각하는 방식')) + '</div><p class="why">' + esc(화('B설명', '한 가지 일을 몇 갈래로 생각하는지, 하던 생각을 끝까지 이어 가는지 두 가지를 따로 셌어요.')) + '</p>';
    h += 렌즈칸('재료', 'L1', 렌.재료.값, 렌.재료.값 + '가지', '생각의 재료', '생각을 맡는 자리에 살아 있는 성질이 몇 가지인가 — 많을수록 여러 갈래로 생각해요.');
    h += 렌즈칸('흐름', 'L2', 렌.흐름.값, 렌.흐름.값 + '단', '흐름', '기운이 낳는 차례로 몇 단 이어지나 — 끊기지 않고 끝까지 이어 생각하는 힘이에요.');
    h += '<p class="note">' + esc(화('맺음', '이 결과는 옛 책의 관점이에요. 사람 머리를 재는 시험이 아니에요. 맞아요 · 아니에요는 생일 없이 저장돼요.')) + ' <small>(같은 ' + 성별말(R.성별) + ' ' + R.표본.toLocaleString() + '명 사주로 센 분포)</small></p>';
    h += '<div class="share-row"><button type="button" class="btn ghost small" data-share="1">' + esc(화('공유단추', '이 화면 친구에게 보내기')) + '</button><p class="why" id="shareMsg">' + esc(화('공유안내', '')) + '</p></div>';
    $('out').innerHTML = h;
  }
  document.addEventListener('click', async function (e) {
    // 공유 — 주소 하나만 보낸다(생일 · 결과는 싣지 않음). 「언제 나아지나」와 같은 길(share.js shareLink)
    var sh = e.target.closest && e.target.closest('[data-share]');
    if (sh) {
      var 주소 = 'https://chaeksa.kr/brain.html', 말 = $('shareMsg');
      var r = window.ChaeksaShare && ChaeksaShare.shareLink ? await ChaeksaShare.shareLink({ title: 화('공유_title', '옛 책으로 보면, 나는 고지능일까요 — 책사'), text: 화('공유_text', '옛 책이 총명하다고 한 대목으로 내 사주를 봐요. 무료예요.'), url: 주소 }) : '';
      if (말) 말.textContent = r === 'copied' ? '주소를 복사했어요. 카톡 대화창에 붙여 넣으세요.' : r === '' ? '이 주소를 보내 주세요 — ' + 주소 : '';
      try { if (r && r !== 'aborted' && window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('brain_share'); } catch (e2) {}
      return;
    }
    var b = e.target.closest && e.target.closest('.btns button'); if (!b) return;
    var box = b.parentNode, id = box.getAttribute('data-id'), v = b.getAttribute('data-v');
    남기기(id, v);
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (x) { x.classList.toggle('on', x === b); });
    var 뒤 = document.querySelector('[data-after="' + id + '"]');
    if (뒤) 뒤.textContent = v === 'yes' ? 화('고마움', '고마워요. 답이 쌓이면 어느 쪽이 맞는지 가려져요.') : 화('아니에요뒤', '알려 주셔서 고마워요. 아니라는 답도 똑같이 쓰여요.');
    try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('brain_vote'); } catch (e2) {}
  });
  // 넣어 둔 생년월일(people.js) — 「언제 나아지나」와 같은 길(10-05 사장님 「이용자 정보 입력은 프로필로」)
  var PP = window.ChaeksaPeople, 사람들 = [];
  function 칸채우기(b) {
    $('y').value = b.year || ''; $('m').value = b.month || ''; $('d').value = b.day || '';
    $('hh').value = b.hour == null ? '' : b.hour; $('mi').value = b.hour == null ? '' : (b.minute || 0);
    var r = document.querySelector('input[name=g][value=' + (b.gender === 'F' ? 'F' : 'M') + ']'); if (r) r.checked = true;
    if (b.place) { $('p').value = b.place; if ($('p').value !== b.place) $('p').value = 'KR:서울'; }
  }
  function 이름표(p) { var b = p.birth, 이름 = p.name && p.name !== '이름 없음' ? p.name : p.relation || '나'; return 이름 + ' · ' + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? '' : ' ' + b.hour + '시'); }
  function 고르기(i) {
    var p = 사람들[i]; if (!p) return;
    Array.prototype.forEach.call(document.querySelectorAll('#who .who button[data-i]'), function (x) { x.classList.toggle('on', +x.getAttribute('data-i') === i); });
    칸채우기(p.birth);
    if (p.birth.hour == null) { $('out').innerHTML = ''; $('f').classList.remove('hide'); $('err').textContent = '이 분은 태어난 시각이 없어요. 시각을 넣어 주세요.'; $('hh').focus(); return; }
    $('f').classList.add('hide');
    보기({ year: p.birth.year, month: p.birth.month, day: p.birth.day, hour: p.birth.hour, minute: p.birth.minute || 0, gender: p.birth.gender === 'F' ? 'F' : 'M', place: p.birth.place || 'KR:서울' });
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
  $('f').addEventListener('submit', function (e) {
    e.preventDefault();
    // 시 · 분 숫자 칸(10-06 사장님 「시간 입력 바꿔 줘」) — 분은 비우면 0, 시는 0~23 · 분은 0~59 만
    var 시 = $('hh').value.trim(), 분 = $('mi').value.trim(), g = (document.querySelector('input[name=g]:checked') || {}).value || 'M';
    var body = { year: +$('y').value, month: +$('m').value, day: +$('d').value, hour: 시 === '' || +시 < 0 || +시 > 23 || +시 % 1 ? NaN : +시, minute: 분 === '' ? 0 : +분, gender: g, place: $('p').value };
    if (isNaN(body.minute) || body.minute < 0 || body.minute > 59 || body.minute % 1) { $('err').textContent = '분은 0부터 59까지 넣어 주세요.'; return; }
    if (!body.year || !body.month || !body.day || isNaN(body.hour)) { $('err').textContent = '태어난 날과 시각을 다 넣어 주세요.'; return; }
    보기(body);
  });
  async function 보기(body) {
    $('err').textContent = '계산하고 있어요…';
    try {
      var r = await fetch(API + '/api/brain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = await r.json();
      if (!r.ok) { $('err').textContent = j.error || '계산하지 못했어요.'; return; }
      결과 = j; 표 = j.표 || ''; $('err').textContent = '';
      그리기();
      try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('brain_view'); } catch (e2) {}
    } catch (err) { $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  }
})();
