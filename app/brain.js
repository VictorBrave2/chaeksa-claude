/* 「나는 고지능일까」(brain.html) — 그리기만 한다. 계산은 비공개 서버 /api/brain(옛 책 총명 대목 34 · 생각 렌즈 둘 · 남녀 각 12,932명 분포).
 * 10-06 사장님 「먼저 제시하고 이용자가 맞아요 · 아니요 고르게」 → 「화면 시제품」 → 「컨텐츠로 배포」.
 * 같은 날 「콘텐츠 자체가 고지능을 가려낼 수 없다는 뜻이네?」 → 「ver1 추천대로 · ver2 내가 정해줄게 · 한 메뉴 안에 두 관점」:
 *   관점 1(옛 책 대목) — 「고지능이다 / 아니다」 · 높은 편 · 낮은 편 이름표를 걷고, 34개 가운데 몇 개 · 같은 성별에서 얼마나 드문지 · 원문만.
 *   관점 2 — 사장님 관법(10-06): 사주 ① 월간 인성 투간 + 힘(법전 33조) ② 연간 관성이 그 인성을 도움 — 0~2.
 *            자미두수 — 사장님이 보낸 글을 全書 원문과 대조해 남긴 14가지(+1 · -1). 생각 렌즈(갈래 · 흐름)는 화면에서 내림.
 * 답은 /api/love-feedback 에 run 「brain-<서버가 준 열쇠>」 · id 로 남긴다(생일은 보내지 않는다).
 *   id: A2 = 관점 1 물음(10-06 판정을 걷은 뒤 — 옛 물음 「A」는 판정이 맞나였으니 섞지 않는다) · V = 관점 2 사주 · Z = 관점 2 자미두수(옛 L1 · L2 는 렌즈 — 내림).
 * 문장 틀은 brain-copy.js(작가 원고). 관점을 하나로 합치지 않는다(사장님 「결론을 합치지 말고 관점만 남겨」).
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
  var 성별말 = function (g) { return g === 'F' ? '여자' : '남자'; };
  function 표지칸(x) {
    return '<div class="card"><p class="q" lang="zh-Hant">' + esc(x.원문) + '</p><p>' + esc(x.뜻) + '</p><p class="why">' + esc(x.근거) + '<br><small>' + esc(String(x.출처 || '').replace(/ · (docs|jamidusu)\/\S+/g, '')) + '</small></p></div>';
  }
  var 탭 = '1';
  function 그리기() {
    var R = 결과; if (!R) return;
    var 옛 = R.옛, 렌 = R.렌즈, 성 = 성별말(R.성별), h = '';
    h += '<div class="tabs" role="tablist">' + [['1', 화('탭1', '옛 책이 꼽은 대목')], ['2', 화('탭2', '책사가 보는 법')]].map(function (t) {
      return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (탭 === t[0]) + '" class="' + (탭 === t[0] ? 'on' : '') + '">' + esc(t[1]) + '</button>';
    }).join('') + '</div>';
    // 관점 1 — 옛 책 대목: 몇 개 · 얼마나 드문가 · 원문(판정 없음)
    var v = { n: 옛.n, p: 옛.p, q: 옛.q, 성별: 성 };
    var 첫 = 옛.n ? 틀(화('첫줄', '옛 책이 「총명하다」고 한 대목 34개 가운데 {n}개에 해당해요.'), v) : 틀(화('첫줄0', '옛 책이 「총명하다」고 한 대목 34개 가운데 해당하는 대목이 없어요.'), v);
    var 드 = !옛.n ? 틀(화('드묾0', '같은 {성별} 가운데 {q}%가 이렇게 하나도 해당하지 않아요.'), v)
      : 옛.p > 0 ? 틀(화('드묾', '같은 {성별} 가운데 {n}개 이상 해당하는 사람은 {p}%예요.'), v)
      : 틀(화('드묾없음', '같은 {성별} 표본 가운데 {n}개 넘게 해당하는 사람이 없을 만큼 드물어요.'), v);
    h += '<div data-pane="1"' + (탭 === '1' ? '' : ' class="hide"') + '>';
    h += '<div class="big"><p>' + esc(첫) + '</p><p><b>' + esc(드) + '</b></p></div>';
    var 걸 = 옛.사주.concat(옛.자미);
    h += '<div class="sec">' + esc(화('A머리', '옛 책이 총명하다고 한 대목')) + '</div><p class="why">' + esc(화('A설명', '옛 책 가운데 공부가 아니라 머리 자체를 말한 대목만 골랐어요.')) + '</p>';
    h += 걸.length ? 걸.map(표지칸).join('') : '<div class="card"><p>' + esc(화('A없음', '해당하는 대목이 없어요.')) + '</p></div>';
    var 안 = 옛.안걸린 || [];
    if (안.length) h += '<details class="fold"><summary>' + esc(틀(화('A나머지', '해당하지 않은 대목 {값}개 펼쳐 보기'), { 값: 안.length })) + '</summary>' + 안.map(표지칸).join('') + '</details>';
    h += '<p class="q2">' + esc(화('A물음', '이 대목들이 나를 잘 말하나요?')) + '</p>' + 단추('A2');
    h += '</div>';
    // 관점 2 — 사장님 관법(10-06): ① 월간 인성이 떴고 힘이 있다 +1 ② 연간 관성이 그 인성을 돕는다 +1. 근거 줄은 서버가 낸다.
    var V2 = (R.관점2 || {}).사주;
    h += '<div data-pane="2"' + (탭 === '2' ? '' : ' class="hide"') + '>';
    if (V2) {
      var w = { n: V2.점수, p: V2.p, q: V2.q, 성별: 성 };
      var V첫 = V2.점수 ? 틀(화('V첫줄', '두 가지 가운데 {n}가지가 맞아요.'), w) : 틀(화('V첫줄0', '두 가지 가운데 맞는 것이 없어요.'), w);
      var V드 = V2.점수 ? 틀(화('V드묾', '같은 {성별} 가운데 {n}가지 이상 맞는 사람은 {p}%예요.'), w) : 틀(화('V드묾0', '같은 {성별} 가운데 {q}%가 이래요.'), w);
      h += '<div class="big"><p>' + esc(V첫) + '</p><p><b>' + esc(V드) + '</b></p></div>';
      h += (화('V머리', '') ? '<div class="sec">' + esc(화('V머리', '')) + '</div>' : '') + '<p class="why">' + esc(화('V설명', '태어난 달의 천간과 태어난 해의 천간을 봐요.')) + '</p>';
      var 이름들 = { V1: ['V1이름', '태어난 달에 선 배우는 힘', 'V1맞음', 'V1아님'], V2: ['V2이름', '배우는 힘을 키워 주는 규칙과 책임', 'V2맞음', 'V2아님'] };
      h += (V2.항목 || []).map(function (x) {
        var k = 이름들[x.id] || [x.id, x.id, '', ''];
        return '<div class="card"><div class="k">' + (x.걸림 ? '맞음' : '아님') + '</div><div class="y" style="font-size:var(--t4)">' + esc(화(k[0], k[1])) + '</div>'
          + '<p>' + esc(화(x.걸림 ? k[2] : k[3], '')) + '</p><p class="why"><small>' + esc(x.근거) + '</small></p></div>';
      }).join('');
      h += '<p class="q2">' + esc(화('V물음', '이 결과가 실제 나와 맞나요?')) + '</p>' + 단추('V');
    }
    // 관점 2 · 자미두수 — 사장님이 보낸 글을 『자미두수전서』 원문과 대조해 남긴 14가지(+1 열하나 · -1 셋). 서버가 원문 · 뜻 · 근거를 낸다.
    var VZ = (R.관점2 || {}).자미;
    if (VZ) {
      var 더 = VZ.항목.filter(function (x) { return x.걸림 && x.plus > 0; }), 덜 = VZ.항목.filter(function (x) { return x.걸림 && x.plus < 0; }), 안2 = VZ.항목.filter(function (x) { return !x.걸림; });
      var z = { n: VZ.점수, p: VZ.p, q: VZ.q, 더: 더.length, 덜: 덜.length, 성별: 성 };
      h += '<div class="sec">' + esc(화('Z머리', '자미두수로 본 총명')) + '</div><p class="why">' + esc(화('Z설명', '옛 책 『자미두수전서』가 총명을 말한 대목 가운데 명반으로 셀 수 있는 것만 골랐어요. 총명을 깎는다고 한 대목도 함께 셌어요.')) + '</p>';
      var Z첫 = 더.length && 덜.length ? 틀(화('Z첫줄', '맞은 대목 {더}가지 · 깎는 대목 {덜}가지 — 합쳐 {n}점이에요.'), z)
        : 더.length ? 틀(화('Z첫줄더만', '맞은 대목 {더}가지 — {n}점이에요.'), z)
        : 덜.length ? 틀(화('Z첫줄덜만', '깎는 대목 {덜}가지 — {n}점이에요.'), z)
        : 틀(화('Z첫줄0', '맞은 대목도 깎는 대목도 없어요.'), z);
      var Z드 = VZ.점수 >= 1 ? 틀(화('Z드묾', '같은 {성별} 가운데 {n}점 이상인 사람은 {p}%예요.'), z) : 틀(화('Z드묾0', '같은 {성별} 가운데 {q}%가 이 점수예요.'), z);
      h += '<div class="big"><p>' + esc(Z첫) + '</p><p><b>' + esc(Z드) + '</b></p></div>';
      if (더.length) h += '<p class="q2">' + esc(화('Z맞음칸', '맞은 대목')) + '</p>' + 더.map(표지칸).join('');
      if (덜.length) h += '<p class="q2">' + esc(화('Z깎임칸', '깎는 대목')) + '</p>' + 덜.map(표지칸).join('');
      if (안2.length) h += '<details class="fold"><summary>' + esc(틀(화('Z나머지', '해당하지 않은 대목 {값}개 펼쳐 보기'), { 값: 안2.length })) + '</summary>' + 안2.map(표지칸).join('') + '</details>';
      h += '<p class="q2">' + esc(화('Z물음', '이 결과가 실제 나와 맞나요?')) + '</p>' + 단추('Z');
    }
    h += '</div>';
    h += '<p class="note">' + esc(화('맺음', '이 결과는 옛 책과 사주로 본 관점이에요. 머리를 재는 시험이 아니에요. 맞아요 · 아니에요는 생일 없이 저장돼요.')) + ' <small>(같은 ' + 성 + ' ' + R.표본.toLocaleString() + '명 사주로 센 분포)</small></p>';
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
    var tb = e.target.closest && e.target.closest('[data-tab]');
    if (tb) {
      탭 = tb.getAttribute('data-tab');
      Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (x) { var on = x === tb; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
      Array.prototype.forEach.call(document.querySelectorAll('[data-pane]'), function (x) { x.classList.toggle('hide', x.getAttribute('data-pane') !== 탭); });
      try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('brain_tab' + 탭); } catch (e3) {}
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
