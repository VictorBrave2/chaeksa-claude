/* 결혼상대 점검 신청 쪽 — 그리기 · 보내기만 한다. 검사 · 저장 · 입금 계좌는 비공개 서버(/api/gyeolhon-apply)에 있다(이 쪽에 계좌 · 판정 코드 없음).
 * 10-07 사장님 「네이버폼으로 받지말고 웹사이트에서 바로 받으면 안되나?」 · 「바로보이는 쪽 ㄱㄱ」 — 접수 화면에 입금 계좌를 바로(서버 응답으로만 받는다).
 * 글은 비공개 core data/gyeolhon-apply-copy-v1.json(작가)에서 그대로 옮겼다 — 아래 T. 토큰 {접수번호} {은행} {계좌번호} {예금주} {입금자} {메일} {문의메일} {날}.
 * 두 사람은 사이트 공통 저장된 사람(people.js)에서 고른다(10-05 사장님 「이용자 정보 입력은 프로필로 가지고 와야지」) — 사람 칩은 app.js 사람칩과 같은 꼴(ss-who · ss-wh).
 *   「사람 추가」 창은 홈의 사람 추가 창과 같은 칸(양력 · 음력 · 윤달 · 시간 모름 · 성별 · 태어난 곳) — 시 · 분은 숫자 칸 둘(10-06 「시간 입력 바꿔 줘」).
 * 생년월일은 주소(URL)에 싣지 않는다 — POST 본문으로만. 로그인 없음. 접수한 것은 이 기기 localStorage 에 30일(접수 번호 · 때 · 요약).
 * 보내는 꼴(api/gyeolhon-apply.js): { kind:'self'|'parent', first, second, email, contact, payer, note, agreed:true, hp:'' }
 *   사람 = { name, year, month, day(양력), hour|null, minute, gender, calendar, lunarInput|null, place, placeName, longitude, tzOffset }
 * 받는 꼴: 200 { ok, code, dup, at?, bank:{은행,번호,예금주}|null } · 400 { error }(1층 말) · 503 { error }
 */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app/api/gyeolhon-apply';
  var 문의메일 = 'dl4431@naver.com';
  var 보관키 = 'chaeksa.gyeolhon.applied', 보관일 = 30;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 채움 = function (s, v) { return String(s == null ? '' : s).replace(/\{([^{}]+)\}/g, function (_, n) { return v && v[n] != null ? v[n] : ''; }); };

  // ── 글(작가 원고 gyeolhon-apply-copy-v1 — 고치지 않고 옮김) ──
  var T = {
    손님갈래: { 머리: '누가 신청하시나요?', 본인: '결혼할 본인이에요', 부모: '자녀의 결혼 상대를 보려는 부모예요' },
    첫째: { 본인: '첫째 분 — 결혼할 본인', 부모: '첫째 분 — 결혼할 자녀',
      도움: '저장된 사람에서 고르세요. 아직 없으면 「사람 추가」로 넣어요 — 태어난 시를 모르면 「시간 모름」, 음력이면 음력 · 윤달 그대로 넣을 수 있어요. 보고서에서는 여기 적힌 이름으로 불러요.' },
    둘째: { 머리: '둘째 분 — 결혼 상대', 도움: '첫째 분과 같은 방법으로 저장된 사람에서 고르거나 「사람 추가」로 넣어요. 첫째 분과 다른 사람이어야 해요.' },
    접수: {
      제목: '접수됐어요 — 이제 입금만 하시면 돼요',
      번호말: '접수 번호 {접수번호}',
      입금: ['{은행} {계좌번호} (예금주 {예금주})', '49,000원',
        '입금하실 분 이름은 {입금자} — 통장에 이 이름으로 찍히게 넣어 주세요. 다른 이름으로 넣으셨으면 아래 메일로 접수 번호와 함께 알려 주세요.'],
      다음: ['입금이 확인되면 엔진이 두 분을 계산하고 책사가 한 번 더 확인해요. 보통 2~3일 안에 {메일} 로 보고서(PDF)를 보내 드려요.',
        '궁금한 것은 {문의메일} 로 접수 번호와 함께 보내 주세요.',
        '이 화면은 따로 메일로 보내 드리지 않아요. 접수 번호와 계좌를 찍어 두세요.'],
      복사단추: '계좌 복사'
    },
    오류: {
      사람없음: '첫째 분 · 둘째 분을 고르거나 넣어 주세요',
      같은사람: '첫째 분과 둘째 분이 같은 사람이에요 — 다른 사람을 골라 주세요',
      메일: '보고서를 받으실 메일 주소를 다시 봐 주세요 — @ 가 들어간 주소여야 해요',
      연락처: '연락처를 적어 주세요 — 카카오톡 아이디나 전화번호',
      입금자: '입금하실 분 이름을 적어 주세요',
      동의: '개인정보 동의에 표시해 주세요 — 동의가 없으면 보고서를 만들 수 없어요',
      서버: '잠시 뒤 다시 해 주세요 — 안 되면 {문의메일} 로 알려 주세요',
      이미: '같은 두 분의 신청이 {날} 에 접수되어 있어요 — 다시 넣지 않아도 돼요'
    },
    이미접수: '이 기기에서 {날} 에 접수한 신청이 있어요 — 접수 번호 {접수번호}'
  };
  // 원고에 없는 말(화면 담당이 보탬 — 작가 검수 대상): 계좌가 서버에 아직 없을 때 · 보내는 중 · 복사 결과 · 이름 없는 사람 · 접수 화면 다시 보기
  var 말덧 = {
    계좌없음: '입금 계좌는 적어 주신 연락처로 알려 드려요.',
    보내는중: '접수하고 있어요…',
    복사됨: '복사했어요. 은행 앱에 붙여 넣으세요.',
    복사실패: '복사하지 못했어요. 위 계좌를 옮겨 적어 주세요.',
    이름칸: '보고서에서 부를 이름',
    이름없음: '보고서에서 부를 이름을 적어 주세요',
    다시보기: '접수 화면 다시 보기'
  };

  var PP = window.ChaeksaPeople, PL = window.ChaeksaPlaces;
  try { if (PP) PP.migrate(); } catch (e) {}
  var form = $('apply'), send = $('send'), msg = $('msg');
  var kind = 'self', 고름 = { first: '', second: '' }, busy = false;
  var 칸 = { first: 'firstWrap', second: 'secondWrap' };

  function 목록() { try { return PP ? PP.list().filter(function (p) { return p && p.birth && p.birth.year; }) : []; } catch (e) { return []; } }
  function 사람(id) { try { return id && PP ? PP.get(id) : null; } catch (e) { return null; } }
  function 이름(p) { var n = p && p.name ? String(p.name).trim() : ''; return n && n !== '이름 없음' ? n : ''; }
  function 날말(iso) { var d = iso ? new Date(iso) : new Date(); if (isNaN(d.getTime())) d = new Date(); return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
  function 곳이름(b) { if (b.placeName) return b.placeName; try { return PL ? PL.resolve(b.place).name : '서울'; } catch (e) { return '서울'; } }
  function 생일말(b) {
    var 시 = b.hour == null || b.hour === '' ? '시간 모름' : (+b.hour) + '시 ' + (+(b.minute || 0)) + '분';
    var 날 = b.calendar === 'lunar' && b.lunarInput
      ? '음력 ' + b.lunarInput.y + '.' + b.lunarInput.m + '.' + b.lunarInput.d + (b.lunarInput.leap ? '(윤달)' : '') + ' (양력 ' + b.year + '.' + b.month + '.' + b.day + ')'
      : '양력 ' + b.year + '.' + b.month + '.' + b.day;
    var 성 = b.gender === 'F' ? '여' : b.gender === 'M' ? '남' : '성별 없음';
    return 날 + ' · ' + 시 + ' · ' + 성 + ' · ' + 곳이름(b);
  }
  function 말(t, bad) { msg.textContent = t || ''; msg.className = 'msg' + (bad ? ' bad' : ''); }

  // ── 사람 칩(첫째 · 둘째) ──
  function 칩(slot) {
    var wrap = $(칸[slot]); if (!wrap) return;
    var 빼기 = slot === 'second' ? 고름.first : 고름.second;   // 한쪽에서 고른 사람은 다른 쪽 목록에서 뺀다
    var list = 목록().filter(function (p) { return p.id !== 빼기; });
    if (고름[slot] && !list.some(function (p) { return p.id === 고름[slot]; })) 고름[slot] = '';
    var id = 고름[slot], p = 사람(id);
    var h = '<div class="ss-who" role="radiogroup">' + list.map(function (x) {
      var n = 이름(x), b = x.birth;
      return '<button type="button" role="radio" aria-checked="' + (x.id === id) + '" class="ss-wh' + (x.id === id ? ' on' : '') + '" data-pick="' + esc(x.id) + '">'
        + '<b>' + esc(n || (x.isSelf ? '나' : x.relation || '그 사람')) + '</b><small>' + esc(n ? (x.relation || '') : b.year + '.' + b.month + '.' + b.day) + '</small></button>';
    }).join('') + '<button type="button" class="ss-wh ss-wh-add" data-add="' + slot + '">＋ 사람 추가</button></div>';
    if (p) {
      h += '<p class="picked">' + esc(생일말(p.birth)) + ' <button type="button" class="lnk" data-edit="' + esc(p.id) + '">고치기</button></p>';
      if (!이름(p)) h += '<label for="' + slot + 'Name">' + esc(말덧.이름칸) + '</label><input id="' + slot + 'Name" type="text" maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ko">';
    }
    wrap.innerHTML = h;
  }
  function 둘다() { 칩('first'); 칩('second'); }
  function 갈래그리기() {
    $('firstHead').textContent = T.첫째[kind === 'parent' ? '부모' : '본인'];
    Array.prototype.forEach.call(form.querySelectorAll('.kind label'), function (l) { var r = l.querySelector('input'); l.classList.toggle('on', !!r && r.value === kind); });
  }
  // 본인 손님이면 「나」가 첫째 분(10-05 「나」 먼저). 둘째 분은 손님이 고른다 — 목록 첫 사람으로 멋대로 두지 않는다(app.js 09-13 규칙).
  function 기본고름() {
    if (!PP) return;
    var f = 사람(고름.first);
    if (kind === 'self') { if (!f && PP.hasSelf()) { var me = PP.self(); if (me) 고름.first = me.id; } }
    else if (f && f.isSelf) 고름.first = '';   // 부모 손님 — 「나」를 자녀 자리에 두지 않는다
    if (고름.second && 고름.second === 고름.first) 고름.second = '';
  }
  form.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.getAttribute('data-pick')) { var w = b.closest('[data-slot]'); if (w) { 고름[w.getAttribute('data-slot')] = b.getAttribute('data-pick'); 둘다(); } return; }
    if (b.getAttribute('data-add')) { var 슬 = b.getAttribute('data-add'); 사람창열기(null, 슬); return; }
    if (b.getAttribute('data-edit')) { var w2 = b.closest('[data-slot]'); 사람창열기(b.getAttribute('data-edit'), w2 ? w2.getAttribute('data-slot') : 'first'); return; }
  });
  Array.prototype.forEach.call(form.querySelectorAll('input[name=kind]'), function (r) {
    r.addEventListener('change', function () { kind = r.value === 'parent' ? 'parent' : 'self'; 갈래그리기(); 기본고름(); 둘다(); });
  });

  // ── 사람 추가 · 고치기 창(홈의 사람 추가 창과 같은 칸 — 이 쪽에서 저장하면 사이트 어디서나 같은 사람) ──
  var 편집 = null, 편집슬롯 = 'first', cal = 'solar';
  function 시간칸() { var off = $('gaNoTime').checked; $('gaH').disabled = $('gaMi').disabled = off; if (off) { $('gaH').value = ''; $('gaMi').value = ''; } }
  function 달력(mode) {
    cal = mode;
    Array.prototype.forEach.call($('gaCalSeg').querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-cal') === mode); });
    if (mode === 'solar') { $('gaLeap').checked = false; $('gaLeapWrap').classList.add('hide'); }
    바꿈표();
  }
  function 양력() {
    var y = +$('gaY').value, m = +$('gaM').value, d = +$('gaD').value;
    if (!y || !m || !d) return null;
    if (cal === 'solar') return { y: y, m: m, d: d };
    if (!window.ChaeksaLunar) return { error: '음력을 양력으로 바꾸는 파일을 불러오지 못했어요. 새로고침해 주세요.' };
    var r = ChaeksaLunar.lunarToSolar(y, m, d, $('gaLeap').checked);
    return r && !r.error ? r : { error: (r && r.error) || '이 음력 날짜는 양력으로 바꿀 수 없어요. 다시 확인해 주세요.' };
  }
  function 바꿈표() {
    var note = $('gaConv'), y = +$('gaY').value, m = +$('gaM').value, d = +$('gaD').value;
    if (!y || !m || !d || !window.ChaeksaLunar) { note.classList.add('hide'); return; }
    if (cal === 'lunar') {
      var leapM = ChaeksaLunar.leapMonthOf(y);
      $('gaLeapWrap').classList.toggle('hide', leapM !== m);
      if (leapM !== m) $('gaLeap').checked = false;
      var r = 양력(); if (!r) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = r.error ? '<b style="color:var(--g0-ink)">' + esc(r.error) + '</b>' : '음력 ' + y + '.' + m + '.' + d + ($('gaLeap').checked ? ' (윤달)' : '') + ' → 양력 <b>' + r.y + '년 ' + r.m + '월 ' + r.d + '일</b>';
    } else {
      var l = ChaeksaLunar.solarToLunar(y, m, d); if (!l) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = '양력 ' + y + '.' + m + '.' + d + ' → 음력 <b>' + l.year + '년 ' + (l.leap ? '윤' : '') + l.month + '월 ' + l.day + '일</b>';
    }
  }
  function 사람창열기(id, slot) {
    if (!PP) return;
    편집 = id || null; 편집슬롯 = slot === 'second' ? 'second' : 'first';
    var p = 편집 ? 사람(편집) : null, b = p ? p.birth : {};
    $('gaTitle').textContent = p ? '사람 정보 고치기' : '사람 추가';
    $('gaRel').innerHTML = PP.RELATIONS.map(function (r) { return '<option value="' + esc(r) + '">' + esc(r) + '</option>'; }).join('');
    $('gaRel').value = p ? p.relation : (편집슬롯 === 'first' ? (kind === 'parent' ? '자녀' : (PP.hasSelf() ? '기타' : '나')) : (kind === 'parent' ? '기타' : '그 사람'));
    try { $('gaPlace').innerHTML = PL ? PL.options() : '<option value="KR:서울">서울</option>'; } catch (e) {}
    $('gaName').value = p ? 이름(p) : '';
    cal = b.calendar === 'lunar' ? 'lunar' : 'solar';
    Array.prototype.forEach.call($('gaCalSeg').querySelectorAll('button'), function (x) { x.classList.toggle('on', x.getAttribute('data-cal') === cal); });
    if (cal === 'lunar' && b.lunarInput) { $('gaY').value = b.lunarInput.y; $('gaM').value = b.lunarInput.m; $('gaD').value = b.lunarInput.d; $('gaLeap').checked = !!b.lunarInput.leap; }
    else { $('gaY').value = b.year || ''; $('gaM').value = b.month || ''; $('gaD').value = b.day || ''; $('gaLeap').checked = false; }
    $('gaNoTime').checked = !!p && (b.hour == null || b.hour === '');
    $('gaH').disabled = $('gaMi').disabled = $('gaNoTime').checked;
    $('gaH').value = b.hour == null || b.hour === '' ? '' : b.hour; $('gaMi').value = b.hour == null || b.hour === '' ? '' : (b.minute == null ? 0 : b.minute);
    // 성별 기본 — 첫째 분(본인)은 여성 먼저(홈 첫 칸과 같게), 둘째 분은 첫째 분의 반대
    var 첫 = 사람(고름.first);
    $('gaG').value = b.gender === 'F' || b.gender === 'M' ? b.gender : (편집슬롯 === 'second' && 첫 && 첫.birth.gender ? (첫.birth.gender === 'F' ? 'M' : 'F') : 'F');
    $('gaPlace').value = b.place || 'KR:서울'; if (!$('gaPlace').value) $('gaPlace').value = 'KR:서울';
    $('gaMsg').textContent = '';
    $('gaSheet').classList.remove('hide');
    바꿈표();
    try { $('gaName').focus(); } catch (e) {}
  }
  function 사람창닫기() { $('gaSheet').classList.add('hide'); 편집 = null; }
  function 사람저장() {
    var say = function (t) { $('gaMsg').textContent = t; };
    var name = $('gaName').value.trim();
    if (!name) { say(말덧.이름없음 + '.'); $('gaName').focus(); return; }
    var sol = 양력();
    if (!sol) { say('생년월일을 넣어 주세요.'); return; }
    if (sol.error) { say(sol.error); return; }
    var noTime = $('gaNoTime').checked, 시 = $('gaH').value.trim(), 분 = $('gaMi').value.trim();
    if (!noTime) {
      if (시 === '' || +시 < 0 || +시 > 23 || +시 % 1) { say('태어난 시는 0부터 23까지 넣어 주세요. 모르면 「시간 모름」에 표시해 주세요.'); return; }
      if (분 !== '' && (+분 < 0 || +분 > 59 || +분 % 1)) { say('분은 0부터 59까지 넣어 주세요.'); return; }
    }
    var 곳 = $('gaPlace').value || 'KR:서울', pl = null; try { pl = PL ? PL.resolve(곳) : null; } catch (e) {}
    var birth = {
      year: sol.y, month: sol.m, day: sol.d,
      hour: noTime ? null : +시, minute: noTime ? 0 : (분 === '' ? 0 : +분),
      gender: $('gaG').value === 'F' ? 'F' : 'M', genderUnknown: false, solarCorrection: true,
      calendar: cal, lunarInput: cal === 'lunar' ? { y: +$('gaY').value, m: +$('gaM').value, d: +$('gaD').value, leap: $('gaLeap').checked } : null,
      place: 곳
    };
    if (pl) { birth.placeName = pl.name; birth.longitude = pl.lon; birth.tzOffset = pl.tzOffset; }
    var rel = $('gaRel').value, id;
    try {
      if (편집) { PP.update(편집, { name: name, relation: rel, birth: birth, isSelf: rel === '나' }); id = 편집; }
      else { id = PP.add({ name: name, relation: rel, isSelf: rel === '나', birth: birth }); try { window.ChaeksaTrack && ChaeksaTrack.event && ChaeksaTrack.event('profile'); } catch (e) {} }
    } catch (e) { say('저장하지 못했어요. 브라우저의 저장 공간을 확인해 주세요.'); return; }
    고름[편집슬롯] = id;
    if (고름.first && 고름.first === 고름.second) 고름[편집슬롯 === 'first' ? 'second' : 'first'] = '';
    사람창닫기(); 둘다();
  }
  $('gaSave').addEventListener('click', 사람저장);
  $('gaCancel').addEventListener('click', 사람창닫기);
  $('gaSheet').addEventListener('click', function (e) { if (e.target === $('gaSheet')) 사람창닫기(); });
  Array.prototype.forEach.call($('gaCalSeg').querySelectorAll('button'), function (b) { b.addEventListener('click', function () { 달력(b.getAttribute('data-cal')); }); });
  ['gaY', 'gaM', 'gaD'].forEach(function (id) { $(id).addEventListener('input', 바꿈표); });
  $('gaLeap').addEventListener('change', 바꿈표);
  $('gaNoTime').addEventListener('change', 시간칸);

  // ── 보내기 ──
  function 사람꼴(p, 이름덮) {
    var b = p.birth, pl = null; try { pl = PL ? PL.resolve(b.place || 'KR:서울') : null; } catch (e) {}
    var 시모름 = b.hour == null || b.hour === '';
    return {
      name: 이름덮 || 이름(p),
      year: +b.year, month: +b.month, day: +b.day,
      hour: 시모름 ? null : +b.hour, minute: 시모름 ? null : +(b.minute || 0),
      gender: b.gender === 'F' ? 'F' : b.gender === 'M' ? 'M' : null,
      calendar: b.calendar === 'lunar' ? 'lunar' : 'solar',
      lunarInput: b.calendar === 'lunar' && b.lunarInput ? { y: +b.lunarInput.y, m: +b.lunarInput.m, d: +b.lunarInput.d, leap: !!b.lunarInput.leap } : null,
      place: b.place || 'KR:서울',
      placeName: b.placeName || (pl ? pl.name : '서울'),
      longitude: typeof b.longitude === 'number' ? b.longitude : (pl ? pl.lon : 126.98),
      tzOffset: b.tzOffset == null ? (pl && pl.tzOffset != null ? pl.tzOffset : null) : b.tzOffset
    };
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var f = 사람(고름.first), s = 사람(고름.second);
    if (!f || !s) { 말(T.오류.사람없음, true); return; }
    if (f.id === s.id) { 말(T.오류.같은사람, true); return; }
    var fn = 이름(f) || ($('firstName') ? $('firstName').value.trim() : ''), sn = 이름(s) || ($('secondName') ? $('secondName').value.trim() : '');
    if (!fn || !sn) { 말(말덧.이름없음, true); return; }
    var email = $('email').value.trim(), contact = $('contact').value.trim(), payer = $('payer').value.trim(), note = $('note').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { 말(T.오류.메일, true); $('email').focus(); return; }
    if (contact.length < 2) { 말(T.오류.연락처, true); $('contact').focus(); return; }
    if (payer.length < 2) { 말(T.오류.입금자, true); $('payer').focus(); return; }
    if (!$('agree').checked) { 말(T.오류.동의, true); return; }
    // 이름이 없던 사람은 적은 이름을 저장해 둔다 — 사이트 어디서나 그 이름
    try { if (!이름(f)) PP.update(f.id, { name: fn }); if (!이름(s)) PP.update(s.id, { name: sn }); } catch (x) {}
    var body = { kind: kind, first: 사람꼴(f, fn), second: 사람꼴(s, sn), email: email, contact: contact, payer: payer, note: note, agreed: true, hp: ($('hp') && $('hp').value) || '' };
    busy = true; send.disabled = true; 말(말덧.보내는중);
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { st: r.status, j: j || {} }; }); })
      .then(function (x) {
        busy = false; send.disabled = false;
        if (x.st === 200 && x.j.ok && x.j.code) { 접수(x.j, { 메일: email, 입금자: payer, 첫째: fn, 둘째: sn }); return; }
        말(x.j.error ? x.j.error : 채움(T.오류.서버, { 문의메일: 문의메일 }), true);
      })
      .catch(function () { busy = false; send.disabled = false; 말(채움(T.오류.서버, { 문의메일: 문의메일 }), true); });
  });

  // ── 접수 화면(같은 쪽에서 바꿔 그림) ──
  function 옛복사(t) {
    try { var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.parentNode.removeChild(ta); return !!ok; } catch (e) { return false; }
  }
  function 복사(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return 옛복사(t); }); } catch (e) {}
    return Promise.resolve(옛복사(t));
  }
  function 접수(j, v) {
    var 기록 = { code: String(j.code), at: j.at || new Date().toISOString(), 요약: { kind: kind, 첫째: v.첫째, 둘째: v.둘째, 메일: v.메일, 입금자: v.입금자, bank: j.bank || null } };
    try { localStorage.setItem(보관키, JSON.stringify(기록)); } catch (e) {}
    try { if (!j.dup && window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('gyeolhon_apply'); } catch (e) {}
    접수그리기(기록, !!j.dup);
  }
  function 접수그리기(기록, 이미) {
    var b = 기록.요약.bank || null, 메일 = 기록.요약.메일 || '';
    var v = { 접수번호: 기록.code, 은행: b && b.은행, 계좌번호: b && b.번호, 예금주: b && b.예금주, 입금자: 기록.요약.입금자, 메일: 메일, 문의메일: 문의메일, 날: 날말(기록.at) };
    var h = '';
    if (이미) h += '<p class="band">' + esc(채움(T.오류.이미, v)) + '</p>';
    h += '<h2>' + esc(T.접수.제목) + '</h2><p class="code">' + esc(채움(T.접수.번호말, v)) + '</p>';
    h += '<div class="pay"><p class="bank">' + esc(b ? 채움(T.접수.입금[0], v) : 말덧.계좌없음) + '</p>'
      + '<p class="won">' + esc(T.접수.입금[1]) + '</p><p>' + esc(채움(T.접수.입금[2], v)) + '</p>'
      + (b ? '<button type="button" class="btn ghost small" id="copyBank">' + esc(T.접수.복사단추) + '</button><p class="hint" id="copySay"></p>' : '') + '</div>';
    h += '<ul class="next">' + T.접수.다음.map(function (s) { return '<li>' + esc(채움(s, v)) + '</li>'; }).join('') + '</ul>';
    h += '<p class="links"><a href="gyeolhon.html">← 결혼상대 점검 소개</a> · <a href="./">책사 처음으로</a></p>';
    $('done').innerHTML = h; $('done').hidden = false; form.hidden = true; $('already').hidden = true;
    try { window.scrollTo(0, 0); } catch (e) {}
    if (b) $('copyBank').addEventListener('click', function () {
      복사(b.은행 + ' ' + b.번호).then(function (ok) { $('copySay').textContent = ok ? 말덧.복사됨 : 말덧.복사실패; });
    });
  }
  // 이 기기에서 30일 안에 접수한 것이 있으면 맨 위 띠로 — 같은 두 분을 또 넣지 않게
  (function () {
    var 기록 = null; try { 기록 = JSON.parse(localStorage.getItem(보관키)); } catch (e) {}
    if (!기록 || !기록.code || !기록.요약 || !(Date.now() - Date.parse(기록.at) < 보관일 * 864e5)) { try { localStorage.removeItem(보관키); } catch (e) {} return; }
    var el = $('already'); if (!el) return;
    el.hidden = false;
    el.innerHTML = '<p>' + esc(채움(T.이미접수, { 날: 날말(기록.at), 접수번호: 기록.code })) + '</p><button type="button" class="btn ghost small" id="showDone">' + esc(말덧.다시보기) + '</button>';
    $('showDone').addEventListener('click', function () { 접수그리기(기록, false); });
  })();

  갈래그리기(); 기본고름(); 둘다();
})();
