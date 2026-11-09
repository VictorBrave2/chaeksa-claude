/* SSS급 궁합 분석 신청 쪽(11-03 · sss · 29,700원 · 결정함 117) — 결혼 전 궁합 점검 신청 쪽(gyeolhon-apply.js)을 본떴다. 그리기 · 신청서 꾸리기 · 결제창 열기만 한다.
 *   나 · 함께 보는 사람(people.js 저장된 사람 · 서로 다른 사람 · 둘 다 태어난 시각 있어야) → 동의 두 칸 → 로그인 → 결제 수단 → 「결제하기」
 *   = ChaeksaPay.buy('sss', null, 결제사, 신청서) → 카카오페이 → pay-done.html → 3초 뒤 sss-report.html?o=(비공개 서버가 계산해 바로 띄움 — 「나는 뭐해 먹고 살까?」와 같은 길).
 * 신청서(intake) 꼴 — { v: 1, product: 'sss', 나: 사람, 그: 사람, agreedAt } · 사람 = gyeolhon-apply.js 사람꼴(시모름은 받지 않는다 — 계산이 시주를 쓴다).
 * 글 — 신청 · 로그인 · 결제 안내는 Codex COPY-0037. 두 사람 머리는 sss-gunghap-copy.js(COPY-0036), 같은 사람 선택 오류는 gunghap-pyo-copy.js(COPY-0033)를 쓴다.
 * 생년월일은 주소(URL)에 싣지 않는다. 비밀 없음. 판정 코드 없음.
 */
(function () {
  'use strict';
  var 상품 = 'sss', 문의메일 = 'dl4431@naver.com';
  var 초안키 = 'chaeksa.sss.draft', 초안수명 = 3 * 24 * 3600 * 1000, 동의키 = 'chaeksa.sss.agree';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 읽기 = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  var 쓰기 = function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var 채움 = function (s, v) { return String(s == null ? '' : s).replace(/\{([^{}]+)\}/g, function (_, n) { return v && v[n] != null ? v[n] : ''; }); };

  // ── 신청 글(COPY-0037). 두 사람 머리와 같은 사람 선택 오류는 기존 공통 글을 쓴다 ──
  var SC = (window.ChaeksaSssCopy || {}), GP = ((window.ChaeksaGhPyoCopy || {}).고르기 || {}), MH = SC.머리 || {};
  var T = {
    단추: { 여는중: '결제창을 여는 중…', 닫힘: '지금은 결제를 받을 수 없습니다', 결제: '결제하기', 결제값: ' 결제하기', 카카오: '카카오페이로 {값} 결제하기', 로그인: '로그인하고 결제하기' },
    오류: {
      모듈: '결제 기능을 불러오지 못했어요. 새로고침해 주세요.',
      닫힘: '지금은 결제를 받을 수 없습니다. 문의하실 곳 — ' + 문의메일,
      사람없음: '궁합을 볼 두 사람을 각각 골라 주세요.',
      같은사람: GP.같은사람 || '',
      시모름: '두 사람 모두 태어난 시각이 필요해요. 「고치기」에서 시각을 입력해 주세요.',
      동의: '개인정보 사용과 환불 규정, 두 항목에 동의해 주세요.',
      너무김: '신청 내용이 너무 길어요. 두 사람의 이름을 짧게 적어 주세요.',
      결제창: '결제창을 열지 못했습니다. 다시 결제하기를 눌러 주세요.'
    },
    로그인: {
      됨: '로그인됐어요. 고른 두 사람과 동의 항목을 확인한 뒤 결제해 주세요.',
      다시: ' 신청서 아래 로그인 단추를 다시 눌러 주세요.',
      만료: '로그인 링크가 만료됐거나 이미 쓴 링크예요.',
      안됨: '로그인이 되지 않았어요.',
      못마침: '로그인을 마치지 못했어요.',
      남의계정: '계정으로 결제할까요?\n\n이 기기에서 시작한 로그인이 아니라서 한 번 여쭤봐요. 주문은 이 계정에 남아요.'
    },
    이름없음: '결과에서 부를 이름을 적어 주세요',
    이름칸: '결과에서 부를 이름'
  };
  try { if ($('firstHead') && (MH.나 || GP.나)) $('firstHead').textContent = MH.나 || GP.나; if ($('secondHead') && (MH.그 || GP.그)) $('secondHead').textContent = MH.그 || GP.그; } catch (e) {}

  var PP = window.ChaeksaPeople, PL = window.ChaeksaPlaces;
  try { if (PP) PP.migrate(); } catch (e) {}
  var form = $('apply'), send = $('send'), msg = $('msg'), agreeData = $('agreeData'), agree = $('agree'), pvPick = $('pvPick');
  var 고름 = { first: '', second: '' }, busy = false, 열림 = true, 금액 = '';
  var 칸 = { first: 'firstWrap', second: 'secondWrap' };

  // 계기판 사건(track.js) — 결제 단추 · 메일 신청 단추. track.js 가 없거나 막혀도 신청은 그대로 된다.
  function 사건(n) { try { window.ChaeksaTrack && ChaeksaTrack.event && ChaeksaTrack.event(n); } catch (e) {} }
  function say(t, bad) {
    var 판 = window.ChaeksaPay && ChaeksaPay.판;
    msg.textContent = t ? t + (bad && 판 ? ' (화면 ' + 판 + ')' : '') : '';
    msg.className = 'msg' + (bad ? ' bad' : '');
  }
  var 로그인됨 = function () { return !!(window.ChaeksaCloud && ChaeksaCloud.signedIn && ChaeksaCloud.signedIn()); };
  // 이 기기에서 시작하지 않은 로그인(cloud.js hold — 남이 보낸 링크일 수 있다)인가. 그러면 메일 칸을 그 계정 메일로 채우지 않고, 결제 전에 어느 계정인지 한 번 묻는다.
  var 남의로그인 = function () { try { return 로그인됨() && !!(ChaeksaCloud.uploadHold && ChaeksaCloud.uploadHold()); } catch (e) { return false; } };

  // ── 로그인에서 돌아온 주소 꼬리(토큰 · 오류)는 맨 먼저 받고 치운다 — 주소에 남기지 않는다(ilgyeol-apply 와 같은 처리) ──
  var 막로그인 = false;
  try { 막로그인 = !!(window.ChaeksaCloud && ChaeksaCloud.captureRedirect && ChaeksaCloud.captureRedirect()); } catch (e) {}
  var 로그인오류 = (function () {
    var p = new URLSearchParams((location.hash || '').replace(/^#/, '') + '&' + (location.search || '').replace(/^\?/, ''));
    return p.get('error') ? { code: p.get('error_code') || '' } : null;
  })();
  function 로그인안내(t) { var el = $('loginMsg'); if (el) { el.textContent = t || ''; el.hidden = !t; } }
  if (로그인오류) {
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    로그인안내((로그인오류.code === 'otp_expired' ? T.로그인.만료 : T.로그인.안됨) + T.로그인.다시);
  } else {
    try { if (!막로그인 && window.ChaeksaCloud && ChaeksaCloud.refusedLogin && ChaeksaCloud.refusedLogin()) 로그인안내(T.로그인.못마침 + T.로그인.다시); } catch (e) {}
  }
  // 여기가 열렸으면 첫 화면이 대신 돌려보낼 일이 없다 — 복귀 표시를 지운다(남으면 나중의 딴 로그인을 끌고 온다).
  try { localStorage.removeItem('chaeksa.return'); } catch (e) {}

  // ── 사람 · 날짜 말 ──
  function 목록() { try { return PP ? PP.list().filter(function (p) { return p && p.birth && p.birth.year; }) : []; } catch (e) { return []; } }
  // 11-04 같은 이름이 목록에 둘 이상이면 칩 작은 줄을 관계 대신 생년월일로 — 「지은 / 그 사람」 둘이 똑같이 보이지 않게(v1625, 이름 없는 사람 칩과 같은 꼴). 셈은 온 목록으로 — 두 칸이 같게 부른다
  function 이름셈() { var c = {}; 목록().forEach(function (y) { var m = 이름(y); if (m) c[m] = (c[m] || 0) + 1; }); return c; }
  function 사람(id) { try { return id && PP ? PP.get(id) : null; } catch (e) { return null; } }
  function 이름(p) { if (PP && PP.nameOf) return PP.nameOf(p); var n = p && p.name ? String(p.name).trim() : ''; return n && n !== '이름 없음' ? n : ''; }   // 손님이 넣은 이름 — people.js nameOf(옛 대체 이름 공주님 · 도련님 · 당신도 이름이 아니다, 11-04 v1621)
  function 곳이름(b) { if (b.placeName) return b.placeName; try { return PL ? PL.resolve(b.place).name : '서울'; } catch (e) { return '서울'; } }
  function 생일말(b) {
    var 시 = b.hour == null || b.hour === '' ? '시간 모름' : (+b.hour) + '시 ' + (+(b.minute || 0)) + '분';
    var 날 = b.calendar === 'lunar' && b.lunarInput
      ? '음력 ' + b.lunarInput.y + '.' + b.lunarInput.m + '.' + b.lunarInput.d + (b.lunarInput.leap ? '(윤달)' : '') + ' (양력 ' + b.year + '.' + b.month + '.' + b.day + ')'
      : '양력 ' + b.year + '.' + b.month + '.' + b.day;
    var 성 = b.gender === 'F' ? '여' : b.gender === 'M' ? '남' : '성별 없음';
    return 날 + ' · ' + 시 + ' · ' + 성 + ' · ' + 곳이름(b);
  }

  // ── 초안(이 기기 · 사흘) — 고른 사람(id) 둘. 생년월일은 people.js 에 있다 ──
  function 초안() {
    var j = 읽기(초안키);
    if (j && (!j.data || Date.now() - (j.at || 0) >= 초안수명)) { 쓰기(초안키, null); return null; }
    return j ? j.data : null;
  }
  function 초안저장() {
    쓰기(초안키, { data: { first: 고름.first || '', second: 고름.second || '' }, at: Date.now() });
  }

  // ── 사람 칩(첫째 · 둘째) ──
  function 칩(slot) {
    var wrap = $(칸[slot]); if (!wrap) return;
    var 빼기 = slot === 'second' ? 고름.first : 고름.second;   // 한쪽에서 고른 사람은 다른 쪽 목록에서 뺀다
    var list = 목록().filter(function (p) { return p.id !== 빼기; });
    if (고름[slot] && !list.some(function (p) { return p.id === 고름[slot]; })) 고름[slot] = '';
    var id = 고름[slot], p = 사람(id), 셈 = 이름셈();
    var h = '<div class="ss-who" role="radiogroup">' + list.map(function (x) {
      var n = 이름(x), b = x.birth;
      return '<button type="button" role="radio" aria-checked="' + (x.id === id) + '" class="ss-wh' + (x.id === id ? ' on' : '') + '" data-pick="' + esc(x.id) + '">'
        + '<b>' + esc(n || PP.relationOf(x)) + '</b><small>' + esc(n && !(셈[n] > 1) ? (x.relation ? PP.relationOf(x) : '') : b.year + '.' + b.month + '.' + b.day) + '</small></button>';   // 부르는 말은 people.js relationOf 하나로
    }).join('') + '<button type="button" class="ss-wh ss-wh-add" data-add="' + slot + '">＋ 사람 추가</button></div>';
    if (p) {
      h += '<p class="picked">' + esc(생일말(p.birth)) + ' <button type="button" class="lnk" data-edit="' + esc(p.id) + '">고치기</button></p>';
      if (!이름(p)) h += '<label class="fq" for="' + slot + 'Name">' + esc(T.이름칸) + '</label><input id="' + slot + 'Name" type="text" maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ko">';
    }
    wrap.innerHTML = h;
  }
  function 시간모름안내() {
    var el = $('timeAlternative'); if (!el) return;
    el.hidden = ![고름.first, 고름.second].some(function (id) {
      var p = 사람(id);
      return p && p.birth && (p.birth.hour == null || p.birth.hour === '');
    });
  }
  function 둘다() { 칩('first'); 칩('second'); 시간모름안내(); }
  // 「나」가 첫 칸(10-05 「나」 먼저). 함께 보는 사람은 손님이 고른다 — 목록 첫 사람으로 멋대로 두지 않는다(app.js 09-13 규칙).
  function 기본고름() {
    if (!PP) return;
    if (!사람(고름.first) && PP.hasSelf()) { var me = PP.self(); if (me) 고름.first = me.id; }
    if (고름.second && 고름.second === 고름.first) 고름.second = '';
  }
  form.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.getAttribute('data-pick')) { var w = b.closest('[data-slot]'); if (w) { 고름[w.getAttribute('data-slot')] = b.getAttribute('data-pick'); 둘다(); 초안저장(); } return; }
    if (b.getAttribute('data-add')) { var 슬 = b.getAttribute('data-add'); 사람창열기(null, 슬); return; }
    if (b.getAttribute('data-edit')) { var w2 = b.closest('[data-slot]'); 사람창열기(b.getAttribute('data-edit'), w2 ? w2.getAttribute('data-slot') : 'first'); return; }
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
  function 있는날(y, m, d) { var t = new Date(Date.UTC(y, m - 1, d)); return y >= 1900 && y <= 2100 && t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; }   // 해는 첫 입력 칸과 같은 1900 ~ 2100
  function 양력() {
    var y = +$('gaY').value, m = +$('gaM').value, d = +$('gaD').value;
    if (!y || !m || !d) return null;
    if (cal === 'solar') return 있는날(y, m, d) ? { y: y, m: m, d: d } : { error: '날짜를 다시 확인해 주세요.' };   // 11-04 4월 31일 · 13월 · 두 자리 해
    if (!window.ChaeksaLunar) return { error: '음력 날짜를 양력으로 바꾸는 기능을 불러오지 못했어요. 새로고침해 주세요.' };
    var r = ChaeksaLunar.lunarToSolar(y, m, d, $('gaLeap').checked);
    if (r && !r.error && !있는날(r.y, r.m, r.d)) return { error: '날짜를 다시 확인해 주세요.' };   // 음력도 바꾼 양력이 1900 ~ 2100년일 때만(두 자리 해 막음)
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
      var s = 양력(), l = s && !s.error && ChaeksaLunar.solarToLunar(y, m, d); if (!l) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = '양력 ' + y + '.' + m + '.' + d + ' → 음력 <b>' + l.year + '년 ' + (l.leap ? '윤' : '') + l.month + '월 ' + l.day + '일</b>';
    }
  }
  function 사람창열기(id, slot) {
    if (!PP) return;
    편집 = id || null; 편집슬롯 = slot === 'second' ? 'second' : 'first';
    var p = 편집 ? 사람(편집) : null, b = p ? p.birth : {};
    $('gaTitle').textContent = p ? '사람 정보 고치기' : '사람 추가';
    $('gaRel').value = p ? PP.relationOf(p, 편집슬롯 === 'second' ? '그 사람' : '') : (편집슬롯 === 'first' ? (PP.hasSelf() ? '기타' : '나') : '그 사람');   // 둘째 분 칸에서 고친 옛 「나」는 「나」로 되살리지 않는다
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
    var 알림 = function (t) { $('gaMsg').textContent = t; };
    var name = $('gaName').value.trim();
    if (!name) { 알림(T.이름없음 + '.'); $('gaName').focus(); return; }
    var sol = 양력();
    if (!sol) { 알림('생년월일을 넣어 주세요.'); return; }
    if (sol.error) { 알림(sol.error); return; }
    var noTime = $('gaNoTime').checked, 시 = $('gaH').value.trim(), 분 = $('gaMi').value.trim();
    if (!noTime) {
      if (시 === '' || +시 < 0 || +시 > 23 || +시 % 1) { 알림('태어난 시를 0부터 23까지 입력해 주세요. 이 궁합 분석에는 두 사람의 태어난 시각이 모두 필요해요.'); return; }
      if (분 !== '' && (+분 < 0 || +분 > 59 || +분 % 1)) { 알림('분은 0부터 59까지 넣어 주세요.'); return; }
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
      else { id = PP.add({ name: name, relation: rel, isSelf: rel === '나', birth: birth }); 사건('profile'); }
    } catch (e) { 알림('저장하지 못했어요. 브라우저의 저장 공간을 확인해 주세요.'); return; }
    고름[편집슬롯] = id;
    if (고름.first && 고름.first === 고름.second) 고름[편집슬롯 === 'first' ? 'second' : 'first'] = '';
    사람창닫기(); 둘다(); 초안저장();
  }
  $('gaSave').addEventListener('click', 사람저장);
  $('gaCancel').addEventListener('click', 사람창닫기);
  $('gaSheet').addEventListener('click', function (e) { if (e.target === $('gaSheet')) 사람창닫기(); });
  Array.prototype.forEach.call($('gaCalSeg').querySelectorAll('button'), function (b) { b.addEventListener('click', function () { 달력(b.getAttribute('data-cal')); }); });
  ['gaY', 'gaM', 'gaD'].forEach(function (id) { $(id).addEventListener('input', 바꿈표); });
  $('gaLeap').addEventListener('change', 바꿈표);
  $('gaNoTime').addEventListener('change', 시간칸);

  // ── 신청서(intake) — 주문에 붙는 꼴. 머리 주석의 꼴 그대로. 생년월일은 양력으로, 음력 입력은 따로 적는다 ──
  function 사람꼴(p, pn) {
    var b = p.birth, 시모름 = b.hour == null || b.hour === '';
    var person = {
      name: pn,
      year: +b.year, month: +b.month, day: +b.day,
      hour: 시모름 ? null : +b.hour, minute: 시모름 ? null : +(b.minute || 0),
      gender: b.gender === 'F' ? 'F' : 'M',
      place: b.place || 'KR:서울', placeName: 곳이름(b)
    };
    if (b.calendar === 'lunar' && b.lunarInput) {
      person.음력 = { y: +b.lunarInput.y, m: +b.lunarInput.m, d: +b.lunarInput.d };
      if (b.lunarInput.leap) person.윤달 = true;
    }
    if (시모름) person.시모름 = true;
    return person;
  }
  function 신청서(f, fn, s, sn) {
    return { v: 1, product: 상품, 나: 사람꼴(f, fn), 그: 사람꼴(s, sn), agreedAt: new Date().toISOString() };
  }

  // ── 초안 채우기 · 적을 때마다 남기기 ──
  (function () {
    var 채울 = 초안() || {};
    if (채울.first && 사람(채울.first)) 고름.first = 채울.first;
    if (채울.second && 사람(채울.second) && 채울.second !== 고름.first) 고름.second = 채울.second;
    form.addEventListener('input', 초안저장);
    form.addEventListener('change', 초안저장);
  })();

  if (막로그인) {
    // 동의 체크는 초안에 없다 — 로그인하러 떠나기 전에 잠시 적어 둔 것을 되살린다.
    try {
      var a = sessionStorage.getItem(동의키) || '';
      sessionStorage.removeItem(동의키);
      if (a) { agreeData.checked = a.charAt(0) === '1'; agree.checked = a.charAt(1) === '1'; }
    } catch (e) {}
    say(T.로그인.됨);
    setTimeout(function () { try { send.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }, 400);
  }
  if (남의로그인() && !ChaeksaCloud.email()) { try { ChaeksaCloud.me().catch(function () {}); } catch (e) {} }   // 결제 전 묻는 말에 계정 메일을 적으려고

  // ── 단추 — 상태 하나로 글과 잠김을 정한다 ──
  function 단추() {
    send.disabled = busy || !열림;
    var 카카오 = !!(pvPick && pvPick.dataset && pvPick.dataset.pv === 'kakao');   // 10-22 사장님 「카카오페이 강조」 — 결제사가 카카오페이면 단추도 카카오페이 꼴
    send.textContent = busy ? T.단추.여는중
      : !열림 ? T.단추.닫힘
      : 로그인됨() ? (금액 ? (카카오 ? 채움(T.단추.카카오, { 값: 금액 }) : 금액 + T.단추.결제값) : T.단추.결제) : T.단추.로그인;
    send.classList.toggle('kakao', 카카오 && 열림);
    $('whyLogin').hidden = !열림 || 로그인됨();
  }
  if (pvPick) pvPick.addEventListener('change', 단추);   // 결제사 칸이 그려지거나 바뀌면 단추 말도 따라간다
  function 값자리(v) { document.querySelectorAll('[data-price="' + 상품 + '"]').forEach(function (el) { el.textContent = v; }); }

  // ── 결제 준비와 값은 서버의 상품표 한 곳에서 받는다. 준비가 안 됐거나 상품이 없으면 단추를 잠근다 ──
  if (!(window.ChaeksaPay && ChaeksaPay.buy && ChaeksaPay.state)) {
    열림 = false; 단추(); say(T.오류.모듈, true);
  } else {
    ChaeksaPay.state().then(function (st) {
      var p = (st.products || []).filter(function (x) { return x.code === 상품; })[0];
      if (!st.ready || !p) { 열림 = false; 단추(); say(T.오류.닫힘, true); return; }   // 값 자리는 「…」 그대로 — 값이 없다
      금액 = ChaeksaPay.won(p.amount); 값자리(금액);
      if (ChaeksaPay.결제사칸) ChaeksaPay.결제사칸(pvPick).catch(function () {});   // 결제 수단 칸(결제사가 둘 이상일 때만 그린다)
      return Promise.resolve(ChaeksaPay.곧열림 ? ChaeksaPay.곧열림() : false).catch(function () { return false; }).then(function (아직) {
        단추();
      });
    }).catch(function () {});
  }

  // ── 결제하기 ──
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy || !열림) return;
    사건('pay');   // 깔때기 ④ 결제 단추 누름 — 앱 안 단추(pay.js 누르면)와 같은 사건
    var f = 사람(고름.first), s = 사람(고름.second);
    if (!f || !s) { say(T.오류.사람없음, true); return; }
    if (f.id === s.id) { say(T.오류.같은사람, true); return; }
    var fn = 이름(f) || ($('firstName') ? $('firstName').value.trim() : ''), sn = 이름(s) || ($('secondName') ? $('secondName').value.trim() : '');
    if (!fn || !sn) { say(T.이름없음, true); return; }
    if (f.birth.hour == null || f.birth.hour === '' || s.birth.hour == null || s.birth.hour === '') { 시간모름안내(); say(T.오류.시모름, true); return; }   // 계산이 시주를 쓴다 — 서버도 막는다
    if (!agreeData.checked || !agree.checked) { say(T.오류.동의, true); return; }
    // 이름이 없던 사람은 적은 이름을 저장해 둔다 — 사이트 어디서나 그 이름
    try { if (!이름(f)) PP.update(f.id, { name: fn }); if (!이름(s)) PP.update(s.id, { name: sn }); } catch (x) {}
    초안저장();
    if (!로그인됨()) {
      // 적은 것(초안)과 동의 체크를 남겨 두고 로그인하러 간다 — 돌아오면 결제만 누르면 되게.
      try { sessionStorage.setItem(동의키, '11'); } catch (x) {}
      // 로그인 뒤 앱 첫 화면으로 떨어져도 여기로 돌려보내게 표시해 둔다(app.js 시작부가 읽는다).
      try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, at: Date.now() })); } catch (x) {}
      try { if (ChaeksaCloud.로그인고르기) ChaeksaCloud.로그인고르기(); else ChaeksaCloud.signInWith('kakao'); } catch (err) { say(String((err && err.message) || err), true); }
      return;
    }
    if (남의로그인()) {
      var em = ChaeksaCloud.email();
      if (!confirm((em ? em + ' ' : '지금 로그인한 ') + T.로그인.남의계정)) return;
    }
    var it = 신청서(f, fn, s, sn);
    if (JSON.stringify(it).length > 7600) { say(T.오류.너무김, true); return; }
    busy = true; 단추(); say('');
    // 신청서는 결제창을 열 때 서버가 그 주문에 붙인다(api/pay.js kopen → order_intake). 결제 뒤 화면(pay-done)이 sss-report.html로 이어 주고, 결과 화면에서 바로 계산해 보여 준다.
    ChaeksaPay.buy(상품, null, (ChaeksaPay.고른결제사 && ChaeksaPay.고른결제사(pvPick)) || null, it).then(function (r) {
      busy = false; 단추();
      if (r && r.ok === false && !r.closed) say(r.message || T.오류.결제창, true);
    }).catch(function (err) { busy = false; 단추(); say(String((err && err.message) || err), true); });
  });

  // 결제창에서 뒤로 가기로 돌아오면 페이지가 통째로 되살아나 단추가 「여는 중」에 멈출 수 있다 — 풀어 준다.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    busy = false; 단추();
    try { localStorage.removeItem('chaeksa.return'); } catch (x) {}
  });

  기본고름(); 둘다(); 단추();
})();
