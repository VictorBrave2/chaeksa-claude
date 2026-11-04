/* 두 사람 고르기 — 정통 사주 궁합 · 정통 자미두수 궁합 · 정통 타로 궁합이 같이 쓴다(11-04).
 * 사장님 「사람추가하라고하네 문제있네」 — 그 전엔 넣어 둔 사람이 둘 미만이면 「사람 추가하기」 링크(./?go=people)뿐이었는데 그런 탭이 없어 홈으로 떨어졌다.
 *   게다가 세 쪽이 사람을 p.year 로 읽어(people.js 는 p.birth.year) 사람이 몇 있어도 늘 「먼저 저장해 주세요」였다 — 세 쪽 사람목록 · 입력도 함께 고침.
 * 이제 이 쪽에서 고르고 · 더하고 · 고친다. 꼴은 SSS 신청(sss-apply.js)의 사람 칩 + 사람 창 그대로, 창의 칸과 말은 홈 사람 추가 창(index.html personForm)과 같다.
 *   저장소가 같은 people.js 라 여기서 넣은 사람은 사이트 어디서나 보인다.
 * 쓰는 법: ChaeksaPairPick.그리기(상자, { 나, 그, 단추, 도움, 없음, 보기 })
 *   나 · 그 = 두 칸 이름 · 단추 = 보기 단추 글 · 도움 = 단추 아래 한 줄 · 없음 = 넣어 둔 사람이 둘 미만일 때 맨 위 한 줄 · 보기 = 단추를 누르면 부를 함수.
 *   고른 두 사람의 id 는 숨은 칸 #na · #geu 에 둔다 — 쪽의 부르기()가 전처럼 그 값을 읽는다.
 *   글은 모두 이미 화면에 있던 말(쪽 글 칸 · 홈 사람 창 · SSS 신청 창)이다 — 여기서 새 손님 글을 짓지 않는다. */
(function (global) {
  'use strict';
  var PP = global.ChaeksaPeople, PL = global.ChaeksaPlaces;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 고름 = { first: '', second: '' }, 설정 = {}, 상자 = null, 편집 = null, 편집슬롯 = 'first', cal = 'solar', 연단추 = null;

  function 목록() { try { return PP ? PP.list().filter(function (p) { return p && p.birth && p.birth.year; }) : []; } catch (e) { return []; } }
  function 사람(id) { try { var p = id && PP ? PP.get(id) : null; return p && p.birth && p.birth.year ? p : null; } catch (e) { return null; } }
  function 이름(p) { var n = p && p.name ? String(p.name).trim() : ''; return n && n !== '이름 없음' ? n : ''; }
  function 곳이름(b) { if (b.placeName) return b.placeName; try { return PL ? PL.resolve(b.place).name : '서울'; } catch (e) { return '서울'; } }
  function 생일말(b) {   // SSS 신청 쪽과 같은 꼴
    var 시 = b.hour == null || b.hour === '' ? '시간 모름' : (+b.hour) + '시 ' + (+(b.minute || 0)) + '분';
    var 날 = b.calendar === 'lunar' && b.lunarInput
      ? '음력 ' + b.lunarInput.y + '.' + b.lunarInput.m + '.' + b.lunarInput.d + (b.lunarInput.leap ? '(윤달)' : '') + ' (양력 ' + b.year + '.' + b.month + '.' + b.day + ')'
      : '양력 ' + b.year + '.' + b.month + '.' + b.day;
    var 성 = b.gender === 'F' ? '여' : b.gender === 'M' ? '남' : '성별 없음';
    return 날 + ' · ' + 시 + ' · ' + 성 + ' · ' + 곳이름(b);
  }

  // 처음 고름 — 「나」가 첫 칸(10-05 「나」 먼저). 함께 볼 사람은 손님이 고른다 — 목록 첫 사람으로 멋대로 두지 않는다(09-13 이야기 탭 · 09-23 궁합총론 · SSS 신청과 같은 규칙).
  // 한 번 고른 두 사람은 이 기기에 기억한다(세 궁합 쪽이 같이 씀) — 다시 오면 그대로. 방금 넣은 사람은 곧 그 칸의 사람.
  var 기억키 = 'chaeksa.pairPick';
  function 기억읽기() { try { var j = JSON.parse(localStorage.getItem(기억키) || 'null'); return j && typeof j === 'object' ? j : {}; } catch (e) { return {}; } }
  function 기억쓰기() { try { localStorage.setItem(기억키, JSON.stringify({ first: 고름.first || '', second: 고름.second || '' })); } catch (e) {} }
  function 기본고름() {
    var m = 기억읽기();
    if (!사람(고름.first)) {
      var me = PP && PP.hasSelf && PP.hasSelf() ? PP.self() : null;
      고름.first = 사람(m.first) ? m.first : (me && 사람(me.id) && me.id !== 고름.second ? me.id : '');   // 손님이 「나」를 둘째 칸으로 옮겼으면 첫 칸에 되돌려 놓지 않는다
    }
    if (!사람(고름.second)) 고름.second = 사람(m.second) && m.second !== 고름.first ? m.second : '';
    if (고름.second && 고름.second === 고름.first) 고름.second = '';
  }
  // 두 칸 모두 모든 사람을 보인다 — 다른 칸에 있는 사람을 고르면 두 칸이 서로 바뀐다(타로 궁합은 「같은 순서」가 뜻이 있어 바꿀 길이 있어야 한다).
  function 고르기(slot, id) {
    var 딴 = slot === 'first' ? 'second' : 'first';
    if (고름[딴] === id) 고름[딴] = 고름[slot] || '';
    고름[slot] = id;
    if (고름[딴] === 고름[slot]) 고름[딴] = '';
    기억쓰기();
  }
  function 칩(slot) {
    var id = 고름[slot], p = 사람(id);
    var h = '<div class="ss-who" role="radiogroup" aria-label="' + esc(slot === 'first' ? 설정.나 : 설정.그) + '">' + 목록().map(function (x) {
      var n = 이름(x), b = x.birth;
      return '<button type="button" role="radio" aria-checked="' + (x.id === id) + '" class="ss-wh' + (x.id === id ? ' on' : '') + '" data-pick="' + esc(x.id) + '">'
        + '<b>' + esc(n || (x.isSelf ? '나' : x.relation || '그 사람')) + '</b><small>' + esc(n ? (x.relation || '') : b.year + '.' + b.month + '.' + b.day) + '</small></button>';
    }).join('') + '<button type="button" class="ss-wh ss-wh-add" data-add="' + slot + '">＋ 사람 추가</button></div>';
    if (p) h += '<p class="picked">' + esc(생일말(p.birth)) + ' <button type="button" class="lnk" data-edit="' + esc(p.id) + '">고치기</button></p>';
    return h;
  }
  function 그림() {
    if (!상자) return;
    기본고름();
    상자.innerHTML = '<form id="f" class="card pk" novalidate>' + (목록().length < 2 && 설정.없음 ? '<p class="pk-none">' + esc(설정.없음) + '</p>' : '')
      + '<p class="pk-h">' + esc(설정.나 || '') + '</p><div data-slot="first">' + 칩('first') + '</div>'
      + '<p class="pk-h">' + esc(설정.그 || '') + '</p><div data-slot="second">' + 칩('second') + '</div>'
      + '<input type="hidden" id="na" value="' + esc(고름.first) + '"><input type="hidden" id="geu" value="' + esc(고름.second) + '">'
      + '<button class="go" type="submit">' + esc(설정.단추 || '→') + '</button>' + (설정.도움 ? '<p class="why">' + esc(설정.도움) + '</p>' : '') + '</form>';
    $('f').addEventListener('submit', function (e) { e.preventDefault(); if (typeof 설정.보기 === 'function') 설정.보기(); });
  }
  function 바뀜() { 그림(); var err = $('err'); if (err) err.textContent = ''; }
  function 눌림(e) {
    var b = e.target.closest && e.target.closest('button'); if (!b || !상자.contains(b)) return;
    if (b.getAttribute('data-pick')) {
      var w = b.closest('[data-slot]'); if (!w) return;
      var slot = w.getAttribute('data-slot'), id = b.getAttribute('data-pick');
      고르기(slot, id); 바뀜();
      // 칸을 새로 그려도 누른 단추에 초점을 돌려 둔다(키보드로 고르는 손님)
      try { Array.prototype.some.call(상자.querySelectorAll('[data-slot="' + slot + '"] [data-pick]'), function (x) { if (x.getAttribute('data-pick') === id) { x.focus(); return true; } return false; }); } catch (e2) {}
      return;
    }
    if (b.getAttribute('data-add')) { 창열기(null, b.getAttribute('data-add'), b); return; }
    if (b.getAttribute('data-edit')) { var w2 = b.closest('[data-slot]'); 창열기(b.getAttribute('data-edit'), w2 ? w2.getAttribute('data-slot') : 'first', b); }
  }

  // ── 사람 추가 · 고치기 창 — 홈 사람 추가 창과 같은 칸 · 같은 말(index.html personForm). 처음 한 번 body 끝에 만든다 ──
  function 창만들기() {
    if ($('pkSheet')) return;
    var d = document.createElement('div');
    d.className = 'modal hide'; d.id = 'pkSheet';
    d.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pkTitle">'
      + '<h3 id="pkTitle">사람 추가</h3>'
      + '<label for="pkName">뭐라고 부를까요</label><input id="pkName" type="text" maxlength="20" placeholder="이름 또는 「그 사람」" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" lang="ko">'
      + '<input type="hidden" id="pkRel">'   // 11-04 사장님 「사람 추가에서 나와의 관계는 없어도 될 것 같아」 — 관계는 칸 자리로 정한 숨은 값
      + '<label>생년월일</label><div class="seg" id="pkCalSeg"><button type="button" data-cal="solar" class="on">양력</button><button type="button" data-cal="lunar">음력</button></div>'
      + '<div class="row"><input id="pkY" type="number" aria-label="태어난 해" placeholder="태어난 해" inputmode="numeric"><input id="pkM" type="number" aria-label="월" placeholder="월" inputmode="numeric"><input id="pkD" type="number" aria-label="일" placeholder="일" inputmode="numeric"></div>'
      + '<div class="check hide" id="pkLeapWrap"><input type="checkbox" id="pkLeap"><label for="pkLeap" style="margin:0">윤달이에요</label></div>'
      + '<p class="conv hide" id="pkConv"></p>'
      + '<label>태어난 시간</label><div class="row"><input id="pkH" type="number" aria-label="태어난 시" placeholder="시 (0~23)" min="0" max="23" inputmode="numeric"><input id="pkMi" type="number" aria-label="태어난 분" placeholder="분" min="0" max="59" inputmode="numeric"></div>'
      + '<div class="check"><input type="checkbox" id="pkNoTime"><label for="pkNoTime" style="margin:0">시간을 몰라요</label></div>'
      + '<label for="pkG">성별</label><select id="pkG"><option value="M">남성</option><option value="F">여성</option></select>'
      + '<details class="fc-more" id="pkMore"><summary>더 정확하게(선택) — 태어난 곳</summary><p class="hint">펼치지 않으면 서울에서 태어난 것으로 계산해요.</p>'
      + '<label for="pkPlace">태어난 곳</label><select id="pkPlace"></select></details>'
      + '<p class="hint">다른 사람의 생년월일은 <b>그 사람 동의를 받고</b> 넣어 주세요.</p>'
      + '<p class="hint" id="pkMsg" role="alert" style="color:var(--g0-ink)"></p>'
      + '<button type="button" class="btn" id="pkSave">저장</button><button type="button" class="btn ghost" id="pkCancel">취소</button></div>';
    document.body.appendChild(d);
    $('pkSave').addEventListener('click', 저장);
    $('pkCancel').addEventListener('click', 창닫기);
    // 바깥(어두운 곳)을 눌렀을 때만 닫는다 — 칸 안에서 끌다가 바깥에서 손을 떼면 닫히지 않게(쓰던 것이 날아간다)
    var 누른곳 = null;
    d.addEventListener('mousedown', function (e) { 누른곳 = e.target; });
    d.addEventListener('click', function (e) { var 밖 = e.target === d && 누른곳 === d; 누른곳 = null; if (밖) 창닫기(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !d.classList.contains('hide')) 창닫기(); });
    Array.prototype.forEach.call($('pkCalSeg').querySelectorAll('button'), function (b) { b.addEventListener('click', function () { 달력(b.getAttribute('data-cal')); }); });
    ['pkY', 'pkM', 'pkD'].forEach(function (id) { $(id).addEventListener('input', 바꿈표); });
    $('pkLeap').addEventListener('change', 바꿈표);
    $('pkNoTime').addEventListener('change', 시간칸);
  }
  function 시간칸() { var off = $('pkNoTime').checked; $('pkH').disabled = $('pkMi').disabled = off; if (off) { $('pkH').value = ''; $('pkMi').value = ''; } }
  function 달력(mode) {
    cal = mode;
    Array.prototype.forEach.call($('pkCalSeg').querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-cal') === mode); });
    if (mode === 'solar') { $('pkLeap').checked = false; $('pkLeapWrap').classList.add('hide'); }
    바꿈표();
  }
  function 있는날(y, m, d) { var t = new Date(Date.UTC(y, m - 1, d)); return y >= 1900 && y <= 2100 && t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; }   // 해는 첫 입력 칸과 같은 1900 ~ 2100
  function 양력() {
    var y = +$('pkY').value, m = +$('pkM').value, d = +$('pkD').value;
    if (!y || !m || !d) return null;
    if (cal === 'solar') return 있는날(y, m, d) ? { y: y, m: m, d: d } : { error: '날짜를 다시 확인해 주세요.' };   // 4월 31일 · 13월 · 두 자리 해
    if (!global.ChaeksaLunar) return { error: '음력 날짜를 양력으로 바꾸는 기능을 불러오지 못했어요. 새로고침해 주세요.' };
    var r = global.ChaeksaLunar.lunarToSolar(y, m, d, $('pkLeap').checked);
    if (r && !r.error && !있는날(r.y, r.m, r.d)) return { error: '날짜를 다시 확인해 주세요.' };   // 음력도 바꾼 양력이 1900 ~ 2100년일 때만(두 자리 해 막음)
    return r && !r.error ? r : { error: (r && r.error) || '이 음력 날짜는 양력으로 바꿀 수 없어요. 다시 확인해 주세요.' };
  }
  function 바꿈표() {
    var note = $('pkConv'), y = +$('pkY').value, m = +$('pkM').value, d = +$('pkD').value, L = global.ChaeksaLunar;
    if (!y || !m || !d || !L) { note.classList.add('hide'); return; }
    if (cal === 'lunar') {
      var leapM = L.leapMonthOf(y);
      $('pkLeapWrap').classList.toggle('hide', leapM !== m);
      if (leapM !== m) $('pkLeap').checked = false;
      var r = 양력(); if (!r) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = r.error ? '<b style="color:var(--g0-ink)">' + esc(r.error) + '</b>' : '음력 ' + y + '.' + m + '.' + d + ($('pkLeap').checked ? ' (윤달)' : '') + ' → 양력 <b>' + r.y + '년 ' + r.m + '월 ' + r.d + '일</b>';
    } else {
      var s = 양력(), l = s && !s.error && L.solarToLunar(y, m, d); if (!l) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = '양력 ' + y + '.' + m + '.' + d + ' → 음력 <b>' + l.year + '년 ' + (l.leap ? '윤' : '') + l.month + '월 ' + l.day + '일</b>';
    }
  }
  function 창열기(id, slot, 단추) {
    if (!PP) return;
    창만들기();
    연단추 = 단추 || null;
    편집 = id || null; 편집슬롯 = slot === 'second' ? 'second' : 'first';
    var p = 편집 ? 사람(편집) : null, b = p ? p.birth : {};
    $('pkTitle').textContent = p ? '사람 정보 고치기' : '사람 추가';
    $('pkRel').value = p ? PP.relationOf(p) : (편집슬롯 === 'first' ? (PP.hasSelf() ? '기타' : '나') : '그 사람');
    try { $('pkPlace').innerHTML = PL ? PL.options() : '<option value="KR:서울">서울</option>'; } catch (e) { $('pkPlace').innerHTML = '<option value="KR:서울">서울</option>'; }
    $('pkName').value = p ? 이름(p) : '';
    cal = b.calendar === 'lunar' ? 'lunar' : 'solar';
    Array.prototype.forEach.call($('pkCalSeg').querySelectorAll('button'), function (x) { x.classList.toggle('on', x.getAttribute('data-cal') === cal); });
    if (cal === 'lunar' && b.lunarInput) { $('pkY').value = b.lunarInput.y; $('pkM').value = b.lunarInput.m; $('pkD').value = b.lunarInput.d; $('pkLeap').checked = !!b.lunarInput.leap; }
    else { $('pkY').value = b.year || ''; $('pkM').value = b.month || ''; $('pkD').value = b.day || ''; $('pkLeap').checked = false; }
    $('pkLeapWrap').classList.add('hide');
    $('pkNoTime').checked = !!p && (b.hour == null || b.hour === '');
    $('pkH').disabled = $('pkMi').disabled = $('pkNoTime').checked;
    $('pkH').value = b.hour == null || b.hour === '' ? '' : b.hour; $('pkMi').value = b.hour == null || b.hour === '' ? '' : (b.minute == null ? 0 : b.minute);
    // 성별 기본 — 첫 칸(본인)은 여성 먼저(홈 첫 칸 · SSS 신청과 같게), 둘째 칸은 첫 칸 사람의 반대
    var 첫 = 사람(고름.first);
    $('pkG').value = b.gender === 'F' || b.gender === 'M' ? b.gender : (편집슬롯 === 'second' && 첫 && 첫.birth.gender ? (첫.birth.gender === 'F' ? 'M' : 'F') : 'F');
    $('pkPlace').value = b.place || 'KR:서울'; if (!$('pkPlace').value) $('pkPlace').value = 'KR:서울';
    $('pkMore').open = !!(b.place && b.place !== 'KR:서울');   // 홈 창과 같이 — 서울이 아닌 사람을 고칠 때만 펼쳐 둔다
    $('pkMsg').textContent = '';
    $('pkSheet').classList.remove('hide');
    바꿈표();
    try { $('pkName').focus(); } catch (e) {}
  }
  function 창닫기() {
    var s = $('pkSheet'); if (s) s.classList.add('hide');
    편집 = null;
    try { if (연단추 && document.body.contains(연단추)) 연단추.focus(); } catch (e) {}
    연단추 = null;
  }
  function 저장() {
    var 알림 = function (t) { $('pkMsg').textContent = t; };
    var rel = $('pkRel').value, name = $('pkName').value.trim();
    if (!name && rel !== '나') { 알림('결과에서 부를 이름을 적어 주세요'); $('pkName').focus(); return; }
    var sol = 양력();
    if (!sol) { 알림('생년월일을 넣어 주세요.'); return; }
    if (sol.error) { 알림(sol.error); return; }
    var noTime = $('pkNoTime').checked, 시 = $('pkH').value.trim(), 분 = $('pkMi').value.trim();
    if (!noTime) {
      if (시 === '' || +시 < 0 || +시 > 23 || +시 % 1) { 알림('태어난 시를 0부터 23까지 입력해 주세요.'); $('pkH').focus(); return; }
      if (분 !== '' && (+분 < 0 || +분 > 59 || +분 % 1)) { 알림('분은 0부터 59까지 넣어 주세요.'); $('pkMi').focus(); return; }
    }
    var 곳 = $('pkPlace').value || 'KR:서울', pl = null; try { pl = PL ? PL.resolve(곳) : null; } catch (e) {}
    var birth = {
      year: sol.y, month: sol.m, day: sol.d,
      hour: noTime ? null : +시, minute: noTime ? 0 : (분 === '' ? 0 : +분),
      gender: $('pkG').value === 'F' ? 'F' : 'M', genderUnknown: false, solarCorrection: true,
      calendar: cal, lunarInput: cal === 'lunar' ? { y: +$('pkY').value, m: +$('pkM').value, d: +$('pkD').value, leap: $('pkLeap').checked } : null,
      place: 곳
    };
    if (pl) { birth.placeName = pl.name; birth.longitude = pl.lon; birth.tzOffset = pl.tzOffset; }
    var id;
    try {
      if (편집) { PP.update(편집, { name: name, relation: rel, birth: birth, isSelf: rel === '나' }); id = 편집; }
      else id = PP.add({ name: name, relation: rel, isSelf: rel === '나', birth: birth });   // 깔때기 ② profile 은 people.js add 가 찍는다
    } catch (e) { 알림('저장하지 못했어요. 브라우저의 저장 공간을 확인해 주세요.'); return; }
    if (!id) { 알림('저장하지 못했어요. 브라우저의 저장 공간을 확인해 주세요.'); return; }
    고르기(편집슬롯, id);
    연단추 = null; 창닫기(); 바뀜();
    try { var 다음 = 상자.querySelector('.go'); if (다음 && 고름.first && 고름.second) 다음.focus(); } catch (e) {}
  }

  function 그리기(box, opt) {
    if (!box) return;
    if (PP && PP.migrate) { try { PP.migrate(); } catch (e) {} }   // 옛 단일 프로필(chaeksa.profile)만 있던 손님도 「나」로
    설정 = opt || {};
    if (상자 !== box) { 상자 = box; 상자.addEventListener('click', 눌림); }
    그림();
  }
  // 「뒤로」로 돌아온 쪽(뒤로 가기 캐시)은 다른 곳에서 바뀐 사람을 모른다 — 다시 그린다
  global.addEventListener('pageshow', function (e) { if (e.persisted && 상자) 바뀜(); });
  global.ChaeksaPairPick = { 그리기: 그리기, 고른: function () { return { first: 고름.first, second: 고름.second }; } };
})(window);
