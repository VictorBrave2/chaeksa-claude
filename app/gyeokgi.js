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
  $('sub').textContent = 쪽.한줄 || '옛 책 세 권이 이름 붙여 반긴 드문 짜임 362가지에 내 사주를 하나씩 대 봐요(삼명통회 · 연해자평 · 적천수).';
  $('hint').textContent = 쪽.입력안내 || '시를 모르면 비워 두세요. 열두 시를 다 넣어 보고, 시에 따라 갈리는 짜임은 따로 알려 드려요.';
  // 응답의 판정과 글자는 그대로 두고 표시 순서와 낱말만 바꾼다.
  function 명식말(명식, 성별) {
    var s = String(명식 || '').trim(), 기둥 = s.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g) || [];
    if (기둥.length !== 3 && 기둥.length !== 4) return s;
    var 성 = 성별 === 'F' ? '여자' : 성별 === 'M' ? '남자' : /(?:여|여자)$/.test(s) ? '여자' : /(?:남|남자)$/.test(s) ? '남자' : '';
    return '내 사주(시 · 일 · 월 · 년) — ' + (기둥.length === 3 ? '시 모름 · ' : '') + 기둥.slice().reverse().join(' ') + (성 ? ' · ' + 성 : '');
  }
  var 근거낱말 = {
    '정관': '맡은 역할과 지킬 기준으로 오는 책임(정관)', '편관': '강한 요구와 긴장으로 오는 책임(편관)',
    '정인': '배움(정인)', '편인': '배움(편인)',
    '정재': '쌓이는 돈(정재)', '편재': '움직이는 돈(편재)', '식신': '말과 재능(식신)', '상관': '말과 재능(상관)',
    '비견': '나와 같은 힘(비견)', '겁재': '내 몫을 나누는 힘(겁재)',
    '관성': '책임(관성)', '재성': '돈(재성)', '인성': '배움(인성)', '식상': '말과 재능(식상)', '비겁': '나와 나란한 힘(비겁)',
    '관': '책임(관)', '재': '돈(재)', '인': '배움(인)',
    '천간': '위 글자(천간)', '지지': '아래 글자(지지)', '일간': '나를 뜻하는 글자(일간)',
    '연간': '태어난 해의 위 글자(연간)', '월간': '태어난 달의 위 글자(월간)', '시간': '태어난 시의 위 글자(시간)',
    '연지': '태어난 해의 아래 글자(연지)', '월지': '태어난 달의 아래 글자(월지)', '일지': '태어난 날의 아래 글자(일지)', '시지': '태어난 시의 아래 글자(시지)',
    '본기': '가장 중심이 되는 기운(본기)', '지장간': '아래 글자 속에 든 위 글자(지장간)',
    '합거': '묶여 힘을 못 씀(합거)', '통관': '가운데 글자가 이어 줌(통관)', '제복': '다른 글자가 눌러 막음(제복)',
    '무근': '힘을 받쳐 주는 뿌리가 없음(무근)', '身旺': '나를 뜻하는 글자가 힘을 씀(身旺)',
    '無官': '위 글자에 책임이 없음(無官)', '無印': '위 글자에 배움이 없음(無印)', '藏': '위에는 없고 아래 글자 속에 있음(藏)',
    '失令': '태어난 달의 힘을 못 받음(失令)', '得令': '태어난 달의 힘을 받음(得令)', '被傷': '다른 글자에게 공격받음(被傷)',
    '清': '책임이 맑음(清)', '세운': '그해의 운(세운)', '대운': '큰 흐름의 운(대운)', '원국': '타고난 사주(원국)'
  };
  var 근거낱말식 = new RegExp('(^|[^가-힣一-鿿])(' + Object.keys(근거낱말).sort(function (a, b) { return b.length - a.length; }).join('|') + ')(?=$|[^가-힣一-鿿])', 'g');
  function 근거말(s) {
    return String(s || '').replace(/법전\s*\d+조\s*/g, '').replace(/그릇 (\d+(?: · \d+(?![\d\/]))*)/g, '꺼내 쓰는 것 $1가지')
      .replace(/뿌리 없음/g, '힘을 받쳐 주는 아래 글자 없음')
      .replace(/忌\s*[·/]\s*喜\s*는 못 잼/g, '옛 책의 꺼림 · 반김은 재지 않음')
      .replace(/忌\s*는 못 잼/g, '옛 책의 꺼림은 재지 않음').replace(/喜\s*는 못 잼/g, '옛 책의 반김은 재지 않음')
      .replace(/子시 기준/g, '자(子)시를 넣었을 때의 근거')
      .replace(/無印 아님/g, '배움을 뜻하는 위 글자가 있어 이 조건 아님').replace(/無官 아님/g, '책임을 뜻하는 위 글자가 있어 이 조건 아님')
      .replace(근거낱말식, function (_, 앞, 말) { return 앞 + 근거낱말[말]; })
      // 낱말 표는 뒤에 한글이 붙으면 안 바꾼다 — 「천간에 · 지지에」 꼴만 따로(이미 바꾼 「위 글자(천간)」 안은 건드리지 않는다).
      .replace(/(^|[^(가-힣])(천간|지지)([이은가는])(?![가-힣])/g, function (_, 앞, 말, 조) { return 앞 + (말 === '천간' ? '위 글자(천간)' : '아래 글자(지지)') + (조 === '이' || 조 === '가' ? '가' : '는'); }).replace(/(^|[^(가-힣])천간(?=[에의도])/g, '$1위 글자(천간)').replace(/(^|[^(가-힣])지지(?=[에의도])/g, '$1아래 글자(지지)');
  }
  var 출처말 = function (s) { return String(s || '').replace(/ · (docs|jamidusu)\/\S+/g, ''); };
  var 책말 = function (s) { return ({ '三命通會': '삼명통회', '淵海子平': '연해자평', '滴天髓闡微': '적천수천미' })[s] || s; };
  function 시말(s) {
    var 글자 = '子丑寅卯辰巳午未申酉戌亥', 소리 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    var i = 글자.indexOf(s); return i >= 0 && String(s).length === 1 ? 소리[i] + '(' + s + ')시' : s;
  }
  function 칸(x, 머리) {
    var a = 격글[x.key] || {};
    return '<div class="card hit"><p class="pct">' + esc(머리) + (x.p == null ? '' : ' · 100명 가운데 ' + esc(x.p) + '명') + '</p>'
      + '<div class="y" style="font-size:var(--t4)">' + esc(x.이름) + '</div>'
      + (a.뜻 ? '<p>' + esc(a.뜻) + '</p>' : '')
      + (x.시 && x.시.length ? '<p class="why">태어난 시가 ' + esc(x.시.map(시말).join(' · ')) + '이면 이 짜임에 들어요.</p>' : '')
      + '<details class="fold"><summary>원문 · 짜임 보기</summary><p class="q" lang="zh-Hant">' + esc(x.원문) + '</p>'
      + (a.짜임 ? '<p class="why">' + esc(a.짜임) + '</p>' : '')
      + '<p class="why"><small>' + (String(x.근거 || '').trim() ? '내 사주에서: ' + esc(근거말(x.근거)) + '<br>' : '') + esc(책말(x.책)) + ' · ' + esc(출처말(x.출처)) + '</small></p></details></div>';
  }
  function 그리기(j) {
    var h = '<p class="sec">' + esc(명식말(j.명식, j.성별)) + '</p>';
    if (j.해당.length) {
      h += j.해당.map(function (x) { return 칸(x, '내 사주에 있어요'); }).join('');
    } else {
      h += '<div class="big"><p>' + esc(쪽.빈칸 || '드문 짜임 362가지 가운데 내 사주에 꼭 맞는 짜임은 없어요.') + '</p></div>';
    }
    if (j.시따라.length) h += '<p class="sec">태어난 시에 따라 드는 짜임</p>' + j.시따라.map(function (x) { return 칸(x, '시에 따라 해당'); }).join('');
    if (j.아깝게.length) h += '<p class="sec">' + esc(쪽.모자람머리 || '조건이 맞지 않는 짜임') + '</p>' + (쪽.모자람안내 ? '<p class="why">' + esc(쪽.모자람안내) + '</p>' : '') + j.아깝게.map(function (x) { return 칸(x, '내 사주에 해당하지 않아요'); }).join('');
    h += '<p class="note">옛 책이 적은 조건만 그대로 대 봤어요. 「많다 · 세다(旺)」처럼 옛 책이 재는 법을 적지 않은 말이 든 짜임은 넣지 않았어요. 비율은 1950~2009년생 6만 명에 대 본 값이에요.</p>';
    if (쪽.낱말 && 쪽.낱말.length) h += '<details class="fold"><summary>낱말 풀이 펼쳐 보기</summary>' + 쪽.낱말.map(function (말) { return '<p class="why">' + esc(말) + '</p>'; }).join('') + '</details>';
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
    $('err').textContent = '옛 책 짜임 362가지에 대 보고 있어요…';
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
