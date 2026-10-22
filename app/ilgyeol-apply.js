/* 「나는 뭐해 먹고 살까?」 신청 쪽 — 카카오페이 결제(10-22 사장님 결정 · 계좌이체 손 신청이 아니라). 그리기 · 신청서 꾸리기 · 결제창 열기만 한다.
 * 흐름은 출산택일 신청 쪽(taekil-apply.html)과 같다:
 *   사람 한 명(people.js 저장된 사람) → 동의 두 칸 → 로그인(카카오 · 네이버, ChaeksaCloud) → 결제 수단(ChaeksaPay.결제사칸)
 *   → 「결제하기」 = ChaeksaPay.buy('ilgyeol', null, 고른 결제사, 신청서) → 카카오페이 → pay-done.html → 3초 뒤 ilgyeol-report.html(비공개 서버가 만들어 바로 띄움 · 10-22 사장님 「결제하면 바로」).
 * 신청서는 결제창을 열 때 서버가 그 주문에 붙인다(api/pay.js kopen → order_intake — 신청서가 없으면 주문을 열지 않는다).
 *   그래서 이 쪽에는 접수 화면 · 접수 번호 · 입금 계좌 · 연락처 · 입금자 칸이 없다. 결제 뒤는 pay-done 이 맡는다.
 * 값(원)은 코드에 없다 — 서버 상품표(/api/pay products, code ilgyeol)의 amount 를 data-price 자리와 단추에 붙인다. 상품이 없으면 단추를 잠근다.
 * 신청서(intake) 꼴 — 8,000자 안쪽(서버 한도):
 *   { v: 1, product: 'ilgyeol',
 *     person: { name, year, month, day(양력), hour|null, minute|null, gender: 'M'|'F', place, placeName, 음력?: {y, m, d}, 윤달?: true, 시모름?: true },
 *     agreedAt }   — 메일 · 적은 글 칸은 10-22 걷었다(결제하면 바로 화면에 뜨니 받을 메일이 없다). 이름은 풀이에 안 들어간다(이 기기 목록용)
 * 초안은 이 기기 localStorage('chaeksa.ilgyeol.draft') 에 사흘 — 고른 사람(id)만(생년월일은 people.js 에 이미 있다).
 *   로그인하러 떠났다 돌아오면 그대로 채운다. 동의 체크는 sessionStorage 에 잠시(출산택일 신청 쪽과 같은 방식).
 * 사람 칩은 app.js 사람칩과 같은 꼴(ss-who · ss-wh). 「사람 추가」 창은 홈의 사람 추가 창과 같은 칸 — 시 · 분은 숫자 칸 둘(10-06 「시간 입력 바꿔 줘」).
 * 생년월일은 주소(URL)에 싣지 않는다. 비밀(키 · 계좌) 없음. 판정 코드 없음.
 */
(function () {
  'use strict';
  var 상품 = 'ilgyeol', 문의메일 = 'dl4431@naver.com';
  var 초안키 = 'chaeksa.ilgyeol.draft', 초안수명 = 3 * 24 * 3600 * 1000, 동의키 = 'chaeksa.ilgyeol.agree';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 읽기 = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  var 쓰기 = function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // ── 글(화면 담당이 출산택일 신청 쪽 말을 이 상품에 맞게 옮김 — 작가 검수 대상) ──
  var T = {
    단추: { 여는중: '결제창을 여는 중…', 닫힘: '지금은 결제를 받을 수 없습니다', 결제: '결제하기', 결제값: ' 결제하고 바로 보기', 카카오: '카카오페이로 {값} 결제하고 바로 보기', 로그인: '카카오로 로그인하고 계속하기' },
    오류: {
      모듈: '결제 기능을 불러오지 못했어요. 새로고침해 주세요.',
      닫힘: '지금은 결제를 받을 수 없습니다. 문의하실 곳 — ' + 문의메일,
      사람없음: '풀이를 볼 분을 고르거나 넣어 주세요',
      이름없음: '목록에 넣어 둘 이름을 적어 주세요(풀이에는 들어가지 않아요)',
      동의: '동의 두 가지에 체크해 주셔야 결제할 수 있어요',
      너무김: '신청서가 너무 길어요 — 사람 이름을 줄여 주세요',
      결제창: '결제창을 열지 못했습니다. 다시 결제하기를 눌러 주세요.'
    },
    로그인: {
      됨: '로그인됐어요. 동의를 확인하시고 결제하시면 돼요.',
      다시: ' 신청서 아래 로그인 단추를 다시 눌러 주세요.',
      만료: '로그인 링크가 만료됐거나 이미 쓴 링크예요.',
      안됨: '로그인이 되지 않았어요.',
      못마침: '로그인을 마치지 못했어요.',
      남의계정: '계정으로 결제할까요?\n\n이 기기에서 시작한 로그인이 아니라서 한 번 여쭤봐요. 주문은 이 계정에 남아요.'
    },
    이미: '최근 결제하신 「나는 뭐해 먹고 살까?」 주문이 있어요 (주문번호 {주문번호}). 다른 분을 보시는 게 아니면 다시 결제하지 않아도 돼요 — ',
    곧: {
      머리: '결제는 곧 열려요.',
      몸: '지금은 카카오페이 가맹 심사 중이라 결제하기를 눌러도 결제창이 아직 열리지 않아요. 열리기 전에는 메일({문의메일})로 신청하셔도 돼요 — 고르신 분의 생년월일시 · 성별 · 태어난 곳을 적어 주세요. 답장으로 이어서 안내해 드려요.',
      단추: '메일로 신청하기 →',
      제목: '[책사] 나는 뭐해 먹고 살까? 신청'
    },
    이름칸: '이 분을 부를 이름'
  };
  var 채움 = function (s, v) { return String(s == null ? '' : s).replace(/\{([^{}]+)\}/g, function (_, n) { return v && v[n] != null ? v[n] : ''; }); };

  var PP = window.ChaeksaPeople, PL = window.ChaeksaPlaces;
  try { if (PP) PP.migrate(); } catch (e) {}
  var form = $('apply'), send = $('send'), msg = $('msg'), agreeData = $('agreeData'), agree = $('agree'), pvPick = $('pvPick');
  var 고름 = '', busy = false, 열림 = true, 금액 = '';

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

  // ── 로그인에서 돌아온 주소 꼬리(토큰 · 오류)는 맨 먼저 받고 치운다 — 주소에 남기지 않는다(출산택일 신청 쪽과 같은 처리) ──
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
  function 사람(id) { try { return id && PP ? PP.get(id) : null; } catch (e) { return null; } }
  function 이름(p) { var n = p && p.name ? String(p.name).trim() : ''; return n && n !== '이름 없음' ? n : ''; }
  function 곳이름(b) { if (b.placeName) return b.placeName; try { return PL ? PL.resolve(b.place).name : '서울'; } catch (e) { return '서울'; } }
  function 생일말(b) {
    var 시 = b.hour == null || b.hour === '' ? '시간 모름' : (+b.hour) + '시 ' + (+(b.minute || 0)) + '분';
    var 날 = b.calendar === 'lunar' && b.lunarInput
      ? '음력 ' + b.lunarInput.y + '.' + b.lunarInput.m + '.' + b.lunarInput.d + (b.lunarInput.leap ? '(윤달)' : '') + ' (양력 ' + b.year + '.' + b.month + '.' + b.day + ')'
      : '양력 ' + b.year + '.' + b.month + '.' + b.day;
    var 성 = b.gender === 'F' ? '여' : b.gender === 'M' ? '남' : '성별 없음';
    return 날 + ' · ' + 시 + ' · ' + 성 + ' · ' + 곳이름(b);
  }

  // ── 초안(이 기기 · 사흘) — 고른 사람(id). 생년월일은 people.js 에 있다 ──
  function 초안() {
    var j = 읽기(초안키);
    if (j && (!j.data || Date.now() - (j.at || 0) >= 초안수명)) { 쓰기(초안키, null); return null; }
    return j ? j.data : null;
  }
  function 초안저장() { 쓰기(초안키, { data: { person: 고름 || '' }, at: Date.now() }); }

  // ── 사람 칩(한 분) ──
  function 칩() {
    var wrap = $('whoWrap'); if (!wrap) return;
    var list = 목록();
    if (고름 && !list.some(function (p) { return p.id === 고름; })) 고름 = '';
    var id = 고름, p = 사람(id);
    var h = '<div class="ss-who" role="radiogroup">' + list.map(function (x) {
      var n = 이름(x), b = x.birth;
      return '<button type="button" role="radio" aria-checked="' + (x.id === id) + '" class="ss-wh' + (x.id === id ? ' on' : '') + '" data-pick="' + esc(x.id) + '">'
        + '<b>' + esc(n || (x.isSelf ? '나' : x.relation || '그 사람')) + '</b><small>' + esc(n ? (x.relation || '') : b.year + '.' + b.month + '.' + b.day) + '</small></button>';
    }).join('') + '<button type="button" class="ss-wh ss-wh-add" data-add="who">＋ 사람 추가</button></div>';
    if (p) {
      h += '<p class="picked">' + esc(생일말(p.birth)) + ' <button type="button" class="lnk" data-edit="' + esc(p.id) + '">고치기</button></p>';
    }
    wrap.innerHTML = h;
  }
  // 「나」가 있으면 「나」를 먼저 골라 둔다(10-05 「나」 먼저). 없으면 손님이 고른다 — 목록 첫 사람으로 멋대로 두지 않는다(app.js 09-13 규칙).
  function 기본고름() {
    if (!PP || 고름) return;
    try { if (PP.hasSelf()) { var me = PP.self(); if (me) 고름 = me.id; } } catch (e) {}
  }
  form.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.getAttribute('data-pick')) { 고름 = b.getAttribute('data-pick'); 칩(); 초안저장(); return; }
    if (b.getAttribute('data-add')) { 사람창열기(null); return; }
    if (b.getAttribute('data-edit')) { 사람창열기(b.getAttribute('data-edit')); return; }
  });

  // ── 사람 추가 · 고치기 창(홈의 사람 추가 창과 같은 칸 — 이 쪽에서 저장하면 사이트 어디서나 같은 사람) ──
  var 편집 = null, cal = 'solar';
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
    if (!window.ChaeksaLunar) return { error: '음력 날짜를 양력으로 바꾸는 기능을 불러오지 못했어요. 새로고침해 주세요.' };
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
  function 사람창열기(id) {
    if (!PP) return;
    편집 = id || null;
    var p = 편집 ? 사람(편집) : null, b = p ? p.birth : {};
    $('gaTitle').textContent = p ? '사람 정보 고치기' : '사람 추가';
    $('gaRel').innerHTML = PP.RELATIONS.map(function (r) { return '<option value="' + esc(r) + '">' + esc(r) + '</option>'; }).join('');
    $('gaRel').value = p ? p.relation : (PP.hasSelf() ? '기타' : '나');
    try { $('gaPlace').innerHTML = PL ? PL.options() : '<option value="KR:서울">서울</option>'; } catch (e) {}
    $('gaName').value = p ? 이름(p) : '';
    cal = b.calendar === 'lunar' ? 'lunar' : 'solar';
    Array.prototype.forEach.call($('gaCalSeg').querySelectorAll('button'), function (x) { x.classList.toggle('on', x.getAttribute('data-cal') === cal); });
    if (cal === 'lunar' && b.lunarInput) { $('gaY').value = b.lunarInput.y; $('gaM').value = b.lunarInput.m; $('gaD').value = b.lunarInput.d; $('gaLeap').checked = !!b.lunarInput.leap; }
    else { $('gaY').value = b.year || ''; $('gaM').value = b.month || ''; $('gaD').value = b.day || ''; $('gaLeap').checked = false; }
    $('gaNoTime').checked = !!p && (b.hour == null || b.hour === '');
    $('gaH').disabled = $('gaMi').disabled = $('gaNoTime').checked;
    $('gaH').value = b.hour == null || b.hour === '' ? '' : b.hour; $('gaMi').value = b.hour == null || b.hour === '' ? '' : (b.minute == null ? 0 : b.minute);
    $('gaG').value = b.gender === 'F' || b.gender === 'M' ? b.gender : 'F';   // 성별 기본 — 홈 첫 칸과 같게 여성 먼저
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
    if (!name) { 알림(T.오류.이름없음 + '.'); $('gaName').focus(); return; }
    var sol = 양력();
    if (!sol) { 알림('생년월일을 넣어 주세요.'); return; }
    if (sol.error) { 알림(sol.error); return; }
    var noTime = $('gaNoTime').checked, 시 = $('gaH').value.trim(), 분 = $('gaMi').value.trim();
    if (!noTime) {
      if (시 === '' || +시 < 0 || +시 > 23 || +시 % 1) { 알림('태어난 시는 0부터 23까지 넣어 주세요. 모르면 「시간 모름」에 표시해 주세요.'); return; }
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
    고름 = id;
    사람창닫기(); 칩(); 초안저장();
  }
  $('gaSave').addEventListener('click', 사람저장);
  $('gaCancel').addEventListener('click', 사람창닫기);
  $('gaSheet').addEventListener('click', function (e) { if (e.target === $('gaSheet')) 사람창닫기(); });
  Array.prototype.forEach.call($('gaCalSeg').querySelectorAll('button'), function (b) { b.addEventListener('click', function () { 달력(b.getAttribute('data-cal')); }); });
  ['gaY', 'gaM', 'gaD'].forEach(function (id) { $(id).addEventListener('input', 바꿈표); });
  $('gaLeap').addEventListener('change', 바꿈표);
  $('gaNoTime').addEventListener('change', 시간칸);

  // ── 신청서(intake) — 주문에 붙는 꼴. 머리 주석의 꼴 그대로. 생년월일은 양력으로, 음력 입력은 따로 적는다 ──
  function 신청서(p, pn) {
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
    return { v: 1, product: 상품, person: person, agreedAt: new Date().toISOString() };
  }

  // ── 초안 채우기 · 적을 때마다 남기기 ──
  (function () {
    var 채울 = 초안() || {};
    if (채울.person && 사람(채울.person)) 고름 = 채울.person;
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
    // 방금 받은 토큰에는 계정 정보가 안 실려 있다 — 불러와 둔다(남의 로그인을 묻는 말에 계정 메일을 적는다).
    try { if (!(ChaeksaCloud.uploadHold && ChaeksaCloud.uploadHold())) ChaeksaCloud.me().catch(function () {}); } catch (e) {}
    say(T.로그인.됨);
    setTimeout(function () { try { send.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }, 400);
  }
  // 묻는 말에 계정 메일을 적으려고 계정 정보만 받아 둔다 — 메일 칸은 채우지 않는다.
  if (남의로그인() && !ChaeksaCloud.email()) { try { ChaeksaCloud.me().catch(function () {}); } catch (e) {} }

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

  // ── 결제가 아직 열리지 않았을 때(pay.js 곧열림 — 결제사가 모두 시험 모드인 손님) ──
  // 결제 단추 · 동의 두 칸은 그대로 두고(누르면 서버가 돌려보내 「심사 중」 말이 뜬다) 알림과 메일 신청을 덧붙인다. 운영 결제사가 있으면 저절로 안 뜬다.
  function 신청메일() {
    var p = 사람(고름), 줄 = ['풀이를 볼 분(이름 · 생년월일시 · 성별 · 태어난 곳): ' + (p ? (이름(p) ? 이름(p) + ' · ' : '') + 생일말(p.birth) : '')];
    return 'mailto:' + 문의메일 + '?subject=' + encodeURIComponent(T.곧.제목) + '&body=' + encodeURIComponent(줄.join('\n') + '\n');
  }
  function 곧열림그리기() {
    var box = $('soonPay');
    box.hidden = false;
    box.innerHTML = '<p style="margin:0 0 6px"><b>' + esc(T.곧.머리) + '</b></p>'
      + '<p style="margin:0 0 12px">' + esc(채움(T.곧.몸, { 문의메일: 문의메일 })) + '</p>'
      + '<a class="btn" id="soonMail" href="#" style="display:block;margin:0;text-align:center;text-decoration:none;color:var(--seal-ink)">' + esc(T.곧.단추) + '</a>';
    $('soonMail').addEventListener('click', function () { this.href = 신청메일(); 사건('applymail'); });   // 누르는 그때 적은 것으로
  }

  // ── 최근 결제한 주문이 있으면 알린다 — 같은 분을 또 결제하지 않게(신청서는 결제 전에 붙어 있어 따로 붙일 일은 없다) ──
  function 이미산것() {
    if (!로그인됨() || 남의로그인() || !ChaeksaPay.mine) return;
    ChaeksaPay.mine().then(function (rows) {
      if (!Array.isArray(rows)) return;
      var 두주 = Date.now() - 14 * 24 * 3600 * 1000;
      var o = rows.filter(function (r) { return r.product === 상품 && r.status === 'paid' && Date.parse(r.paidAt || r.at || 0) > 두주; })[0];
      if (!o) return;
      var box = $('already');
      box.hidden = false;
      box.innerHTML = esc(채움(T.이미, { 주문번호: o.id })) + '<a href="' + esc(ChaeksaPay.ilgyeol && ChaeksaPay.ilgyeol.주소 ? ChaeksaPay.ilgyeol.주소(o.id) : 'ilgyeol-report.html?o=' + encodeURIComponent(o.id)) + '">그 풀이 열기 →</a>';
    }).catch(function () {});
  }

  // ── 결제 준비와 값은 서버의 상품표 한 곳에서 받는다. 준비가 안 됐거나 상품이 없으면 단추를 잠근다 ──
  if (window.CHAEKSA_LLM_PAUSE) {   // 10-22 글쓰기 열쇠 잔액 0 — 풀이가 못 나가므로 잠시 받지 않는다(config.js CHAEKSA_LLM_PAUSE)
    열림 = false; T.단추.닫힘 = '지금은 잠시 받지 않아요'; 단추();
    say('풀이를 쓰는 기능을 손보는 동안 결제를 잠시 받지 않아요. 곧 다시 열려요 — 급하시면 ' + 문의메일 + ' 으로 알려 주세요.');
  } else if (!(window.ChaeksaPay && ChaeksaPay.buy && ChaeksaPay.state)) {
    열림 = false; 단추(); say(T.오류.모듈, true);
  } else {
    ChaeksaPay.state().then(function (st) {
      var p = (st.products || []).filter(function (x) { return x.code === 상품; })[0];
      if (!st.ready || !p) { 열림 = false; 단추(); say(T.오류.닫힘, true); return; }   // 값 자리는 「…」 그대로 — 값이 없다
      금액 = ChaeksaPay.won(p.amount); 값자리(금액);
      if (ChaeksaPay.결제사칸) ChaeksaPay.결제사칸(pvPick).catch(function () {});   // 결제 수단 칸(결제사가 둘 이상일 때만 그린다)
      return Promise.resolve(ChaeksaPay.곧열림 ? ChaeksaPay.곧열림() : false).catch(function () { return false; }).then(function (아직) {
        단추();
        if (아직) { 곧열림그리기(); return; }
        이미산것();
      });
    }).catch(function () {});
  }

  // ── 결제하기 ──
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy || !열림) return;
    사건('pay');   // 깔때기 ④ 결제 단추 누름 — 앱 안 단추(pay.js 누르면)와 같은 사건
    var p = 사람(고름);
    if (!p) { say(T.오류.사람없음, true); return; }
    var pn = 이름(p);   // 이름은 풀이에 들어가지 않는다 — 이 기기 사람 목록에서 알아보는 데만(없어도 된다)
    if (!agreeData.checked || !agree.checked) { say(T.오류.동의, true); return; }
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
    var it = 신청서(p, pn);
    if (JSON.stringify(it).length > 7600) { say(T.오류.너무김, true); return; }
    busy = true; 단추(); say('');
    // 신청서는 결제창을 열 때 서버가 그 주문에 붙인다(api/pay.js kopen → order_intake). 결제 뒤 화면(pay-done)이 3초 뒤 결과 쪽(ilgyeol-report.html)으로 데려간다.
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

  기본고름(); 칩(); 단추();
})();
