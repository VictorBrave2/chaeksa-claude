/* 「나는 뭐해 먹고 살까?」 진로 보고서 — 사장님 목록(ilgyeol-admin.html · 10-22 사장님 결정 「카카오페이로 판다」). 출산택일 목록(taekil-admin.js)을 본떠 결제 주문 목록 꼴로.
 *
 * 검수 계정(super)만 쓴다. 화면이 가리는 것은 편의일 뿐이고, 실제로 막는 것은 Supabase 함수 안의 ai_plan() = 'super' 다(server/migrate-39 ilgyeol_admin_list).
 * 여기는 함수를 부르고 받은 것을 그리기만 한다 — 결제 · 신청서 붙이기는 신청 쪽(ilgyeol-apply.js → ChaeksaPay.buy → api/pay.js → order_intake)이 이미 했다.
 * 보고서는 메인이 비공개 tools/livelihood-manual.js 로 만든다 — 「신청 JSON 복사」가 그 도구의 신청.json 꼴을 낸다(접수번호 = 주문번호). 이름 · 연락처는 넣지 않는다.
 * 환불은 여기서 하지 않는다 — 결제 완료 화면(pay-done.html)의 사장님 전액 취소 단추 또는 카카오페이 가맹점관리자.
 * 「보냄 표시」는 이 기기 localStorage 에만 남는다(서버 함수 없음 — migrate-39 에 보냄 열이 없다). 다른 기기 · 다른 브라우저에서는 안 보인다.
 * 단추를 누르면 그 줄만 다시 그린다(메모 feedback-owner-tools-human-scale — 바꾼 하나 → 바뀐 것만).
 *
 *   나누기 — 전부 · 결제됨(안 보냄) · 보냄 표시 · 환불
 *   줄 — 상태 · 주문번호 · 결제일 · 모드(운영 · 시험) · 금액 · 보고서를 받을 분 이름 · 보냄 표시한 때
 *   줄을 펼치면 — 사람(생년월일시 · 음력이면 음력도 · 성별 · 태어난 곳) · 메일 · 지금 하는 일 · 결제 모드 · 금액 · 결제일 · 신청서 붙은 때 · 주문 메모
 *   단추 — 신청 JSON 복사 · 메일 쓰기 · 보냄 표시(다시 누르면 지움)
 *
 * 서버 줄 하나(migrate-39 ilgyeol_admin_list) — { id, status: 'paid'|'canceled', mode: 'live'|'test', amount, paidAt, createdAt, intakeAt, intake, note }
 *   intake = 신청 쪽(ilgyeol-apply.js 신청서())이 결제 전에 붙인 신청서 { v, product, person, email, note, agreedAt }
 *     person = { name, year · month · day(늘 양력), hour|null, minute|null, gender: 'M'|'F', place, placeName, 음력?: {y, m, d}, 윤달?: true, 시모름?: true } — longitude · tzOffset 은 없다(place 로 다시 푼다)
 */
(function (global) {
  'use strict';
  const P = global.ChaeksaPay, G = P && P.ilgyeol;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (id) => document.getElementById(id);
  const 두 = (n) => (n < 10 ? '0' : '') + n;
  const 상태이름 = { paid: '결제됨', sent: '보냄', canceled: '환불' };
  const 나누기 = [['', '전부'], ['paid', '결제됨(안 보냄)'], ['sent', '보냄 표시'], ['canceled', '환불']];
  const 모드이름 = { live: '운영', test: '시험' };
  const 문의 = 'dl4431@naver.com';
  const 보냄키 = 'chaeksa.ilgyeol.sent';   // { 주문번호: 표시한 때(ISO) } — 이 기기에만
  const 도구안내 = '복사한 JSON 을 파일로 저장해 node tools/livelihood-manual.js <파일> 로 돌리면 runs/livelihood/<주문번호>/보고서.pdf 가 나와요.';
  const 이유말 = (r) => ({ forbidden: '검수 계정만 할 수 있어요', login: '로그인이 끝났어요 — 다시 로그인해 주세요', missing: 'migrate-39 SQL 을 아직 Run 하지 않았어요',
    network: '인터넷 연결이 끊겼어요', db: '저장소에서 문제가 생겼어요' })[r && r.reason]
    || (r && r.message) || '되지 않았어요';
  let 지금 = '', 줄들 = [];
  const 펼침 = new Set();

  const 날 = (s) => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + 두(d.getHours()) + ':' + 두(d.getMinutes()); };
  const 원 = (n) => (P && P.won ? P.won(n) : Number(n || 0).toLocaleString('ko-KR') + '원');
  const 신청서 = (x) => (x && x.intake && typeof x.intake === 'object' && !Array.isArray(x.intake)) ? x.intake : {};
  const 사람 = (x) => { const p = 신청서(x).person; return p && typeof p === 'object' ? p : {}; };
  const 메일 = (x) => String(신청서(x).email || '').trim();
  const 적은것 = (x) => String(신청서(x).note || '').trim();
  const 성별 = (g) => (g === 'F' ? '여' : g === 'M' ? '남' : '성별 ?');
  const 시각 = (p) => (p.hour == null || p.시모름 ? '시 모름' : 두(p.hour) + ':' + 두(p.minute || 0));
  /** 신청서의 음력 입력 { y, m, d } — 신청 쪽 꼴(person.음력 · person.윤달). 없으면 null */
  const 음력입력 = (p) => (p && p.음력 && typeof p.음력 === 'object' && p.음력.y ? p.음력 : null);
  const 생일 = (p) => {
    if (!p || p.year == null) return '(생년월일 없음)';
    let s = p.year + '-' + 두(p.month) + '-' + 두(p.day) + ' ' + 시각(p);
    const l = 음력입력(p);
    if (l) s += ' (음력으로 넣음: ' + l.y + '-' + 두(l.m) + '-' + 두(l.d) + (p.윤달 ? ' 윤달' : '') + ')';
    return s;
  };
  const 줄id = (id) => String(id == null ? '' : id).replace(/[^A-Za-z0-9_-]/g, '');

  /* ── 보냄 표시(이 기기 localStorage 에만 — 서버 함수 없음) ───────────── */
  function 보냄표() { try { const o = JSON.parse(localStorage.getItem(보냄키) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
  function 보냄쓰기(id, on) {
    const o = 보냄표();
    if (on) o[id] = new Date().toISOString(); else delete o[id];
    try { localStorage.setItem(보냄키, JSON.stringify(o)); } catch (e) {}
  }
  const 보냄때 = (x) => (x && x.id ? 보냄표()[x.id] || '' : '');
  /** 나누기에 쓰는 눈 — 환불이면 canceled, 결제됐고 이 기기에서 보냄 표시했으면 sent, 아니면 paid */
  const 보기 = (x) => (x.status === 'canceled' ? 'canceled' : (보냄때(x) ? 'sent' : 'paid'));

  /** 비공개 tools/livelihood-manual.js 의 신청.json 꼴 — { 사람, 접수번호, 지금하는일 }. 접수번호 = 주문번호.
   *  이름 · 메일 · 연락처는 넣지 않는다(도구도 버린다). placeName 은 사장님이 읽는 덤. */
  function 신청꼴(x) {
    const p = 사람(x), o = {}, l = 음력입력(p);
    // 음력으로 넣은 사람이면 넣은 음력 날짜 그대로 + 음력 표시(도구가 양력으로 바꾼다). 아니면 신청서의 양력 날짜.
    if (l) { o.year = l.y; o.month = l.m; o.day = l.d; o.음력 = true; o.윤달 = !!p.윤달; }
    else { o.year = p.year; o.month = p.month; o.day = p.day; }
    o.hour = p.hour == null || p.시모름 ? null : p.hour; o.minute = o.hour == null ? null : (p.minute || 0);
    o.gender = p.gender; o.place = p.place || null; o.placeName = p.placeName || '';
    return { 사람: o, 접수번호: String(x.id || ''), 지금하는일: 적은것(x) };
  }

  /* ── 나누기 ─────────────────────────────────────────────── */
  function 수세기() { const c = {}; 줄들.forEach((x) => { const v = 보기(x); c[v] = (c[v] || 0) + 1; }); return c; }
  function 나누기그리기() {
    const box = $('admFilters'); if (!box) return;
    const c = 수세기();
    box.innerHTML = 나누기.map(([k, 말]) => '<button type="button" data-f="' + k + '" class="' + (k === 지금 ? 'on' : '') + '">' + esc(말) + ' ' + (k ? (c[k] || 0) : 줄들.length) + '</button>').join('');
    box.querySelectorAll('button').forEach((b) => { b.onclick = () => { 지금 = b.dataset.f; 나누기그리기(); 목록그리기(); }; });
  }

  /* ── 줄 ───────────────────────────────────────────────── */
  function 줄요약(x) {
    const p = 사람(x), v = 보기(x), 보 = 보냄때(x);
    return '<span class="adm-st st-' + esc(v) + '">' + esc(상태이름[v] || x.status || '-') + '</span>'
      + '<b>' + esc(x.id || '-') + '</b>'
      + '<span class="adm-meta">' + esc([x.paidAt ? '결제 ' + 날(x.paidAt) : (x.createdAt ? '주문 ' + 날(x.createdAt) : ''), 모드이름[x.mode] || x.mode || '모드 ?', x.amount != null ? 원(x.amount) : '',
        p.name || '(이름 없음)', 보 ? '보냄 표시 ' + 날(보) : '', !x.intake ? '신청서 없음' : '', 적은것(x) ? '적은 것 있음' : '', x.note ? '주문 메모 있음' : ''].filter(Boolean).join(' · ')) + '</span>';
  }
  function 줄html(x) {
    const id = 줄id(x.id), 열림 = 펼침.has(id);
    return '<div class="adm-row" data-id="' + esc(id) + '"><button type="button" class="adm-sum" aria-expanded="' + 열림 + '">' + 줄요약(x) + '</button>'
      + '<div class="adm-detail"' + (열림 ? '' : ' hidden') + '></div></div>';
  }
  function 보이는줄() { return 줄들.filter((x) => !지금 || 보기(x) === 지금); }
  function 목록그리기() {
    const box = $('admRows'); if (!box) return;
    const xs = 보이는줄();
    box.innerHTML = xs.length ? xs.map(줄html).join('') : '<p class="hint">이 나누기에는 줄이 없어요.</p>';
    xs.forEach((x) => 줄달기(x));
  }
  function 줄칸(id) { return document.querySelector('.adm-row[data-id="' + 줄id(id) + '"]'); }
  function 줄달기(x) {
    const id = 줄id(x.id), el = 줄칸(id); if (!el) return;
    el.querySelector('.adm-sum').onclick = () => {
      const d = el.querySelector('.adm-detail'), s = el.querySelector('.adm-sum');
      if (펼침.has(id)) { 펼침.delete(id); d.hidden = true; s.setAttribute('aria-expanded', 'false'); return; }
      펼침.add(id); s.setAttribute('aria-expanded', 'true'); 자세히그리기(x);
    };
    if (펼침.has(id)) 자세히그리기(x);
  }
  /** 바뀐 줄 하나만 — 그 자리를 다시 그린다(보냄 표시는 이 기기 값이라 서버에 다시 묻지 않는다) */
  function 줄새로(x, 말) {
    const id = 줄id(x.id), el = 줄칸(id);
    if (el) { const 새 = document.createElement('div'); 새.innerHTML = 줄html(x); el.replaceWith(새.firstChild); 줄달기(x); }
    else 목록그리기();
    나누기그리기();
    if (말) 알림(id, 말);
  }
  function 알림(id, 말, 나쁨) {
    const el = 줄칸(id), m = el && el.querySelector('.adm-msg');
    if (m) { m.textContent = 말 || ''; m.classList.toggle('bad', !!나쁨); }
    else if (말) alert(말);
  }

  /* ── 줄을 펼치면 ───────────────────────────────────────── */
  function 사람칸(p) {
    return '<div class="adm-person"><h4>보고서를 받을 분 — ' + esc(p.name || '(이름 없음)') + '</h4>'
      + '<div class="adm-kv"><span>생년월일시</span><span>' + esc(생일(p)) + '</span></div>'
      + '<div class="adm-kv"><span>성별</span><span>' + esc(성별(p.gender)) + '</span></div>'
      + '<div class="adm-kv"><span>태어난 곳</span><span>' + esc((p.placeName || '(없음)') + (p.place ? ' · ' + p.place : '') + (typeof p.longitude === 'number' ? ' · 경도 ' + p.longitude : '')) + '</span></div></div>';
  }
  function 자세히그리기(x, 말) {
    const id = 줄id(x.id), el = 줄칸(id); if (!el) return;
    const d = el.querySelector('.adm-detail'); d.hidden = false;
    const m = 메일(x), 보 = 보냄때(x), 환불 = x.status === 'canceled';
    const 단추 = [];
    const 단 = (k, 글, 됨) => 단추.push('<button type="button" class="btn ghost small" data-act="' + k + '"' + (됨 ? '' : ' disabled') + '>' + esc(글) + '</button>');
    단('copy', '신청 JSON 복사', !!x.intake);
    단('mail', '메일 쓰기', !!(m && /@/.test(m)));
    단('sent', 보 ? '보냄 표시 지우기' : '보냄 표시', !환불);
    d.innerHTML = '<div class="adm-acts">' + 단추.join('') + '</div>'
      + '<p class="adm-msg" role="status">' + esc(말 || '') + '</p>'
      + '<div class="adm-box" data-pane hidden></div>'
      + (x.intake ? '<div class="adm-cols">' + 사람칸(사람(x)) + '</div>' : '<p class="adm-msg bad">이 주문에는 신청서가 붙어 있지 않아요 — 손님에게 메일로 생년월일시 · 태어난 곳을 받아야 해요.</p>')
      + '<h4>연락과 결제</h4>'
      + '<div class="adm-kv"><span>메일(PDF 받을 곳)</span><span>' + esc(m || '-') + '</span></div>'
      + '<div class="adm-kv"><span>지금 하는 일 · 바라는 점</span><span>' + esc(적은것(x) || '(없음)') + '</span></div>'
      + '<div class="adm-kv"><span>결제</span><span>' + esc([상태이름[x.status] || x.status || '-', 모드이름[x.mode] || x.mode || '모드 ?', x.amount != null ? 원(x.amount) : ''].filter(Boolean).join(' · ')) + '</span></div>'
      + '<div class="adm-kv"><span>때</span><span>' + esc(['주문 ' + (날(x.createdAt) || '-'), x.paidAt ? '결제 ' + 날(x.paidAt) : '', x.intakeAt ? '신청서 붙음 ' + 날(x.intakeAt) : '', 보 ? '보냄 표시 ' + 날(보) + '(이 기기)' : ''].filter(Boolean).join(' · ')) + '</span></div>'
      + (x.note ? '<div class="adm-kv"><span>주문 메모</span><span>' + esc(x.note) + '</span></div>' : '')
      + '<p class="hint">' + esc(도구안내) + (환불 ? ' 환불된 주문이라 보고서를 만들지 않아요.' : '') + '</p>';
    d.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => 누름(x, b.dataset.act, b); });
  }

  /* ── 단추 ─────────────────────────────────────────────── */
  function 누름(x, act, b) {
    const id = 줄id(x.id), m = 메일(x);
    if (act === 'copy') {
      const 글 = JSON.stringify(신청꼴(x), null, 1);
      const 됨 = () => 알림(id, '신청 JSON 을 복사했어요. ' + 도구안내);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(글).then(됨, () => 손복사(id, 글));
      else 손복사(id, 글);
      return;
    }
    if (act === 'mail') {
      const 본문 = ['안녕하세요, 책사입니다.', '', '결제해 주신 「나는 뭐해 먹고 살까?」 보고서를 보내 드려요(주문번호 ' + (x.id || '') + '). PDF 를 붙여 드려요.', '', '문의 — ' + 문의];
      location.href = 'mailto:' + encodeURIComponent(m).replace(/%40/g, '@') + '?subject=' + encodeURIComponent('[책사] 나는 뭐해 먹고 살까? 보고서') + '&body=' + encodeURIComponent(본문.join('\r\n'));
      return;
    }
    if (act === 'sent') {
      const 켬 = !보냄때(x);
      if (!켬 && !confirm('이 줄의 보냄 표시를 지울까요?\n\n표시는 이 기기에만 남아 있던 것이에요.')) return;
      if (b) b.disabled = true;
      보냄쓰기(x.id, 켬);
      줄새로(x, 켬 ? '보냄으로 표시했어요 — 이 기기에만 남아요(다른 기기에서는 안 보여요).' : '보냄 표시를 지웠어요.');
    }
  }
  function 판칸(id) { const el = 줄칸(id); const p = el && el.querySelector('[data-pane]'); if (p) p.hidden = false; return p; }
  function 손복사(id, 글) {
    const p = 판칸(id); if (!p) return;
    p.innerHTML = '<p class="hint">복사가 막혀서 아래에 펼쳤어요 — 전부 골라 복사해 주세요.</p><textarea class="adm-copy" readonly></textarea>';
    const t = p.querySelector('textarea'); t.value = 글; t.focus(); t.select();
  }

  /* ── 시작 ─────────────────────────────────────────────── */
  function 목록() {
    const box = $('admRows'); if (box) box.innerHTML = '<p class="hint">불러오는 중…</p>';
    return G.adminList(200).then((r) => {
      if (!(r && r.ok && Array.isArray(r.rows))) { if (box) box.innerHTML = '<p class="adm-msg bad">' + esc(이유말(r)) + '</p>'; return; }
      줄들 = r.rows;
      나누기그리기(); 목록그리기();
    });
  }
  function 시작() {
    const gate = $('admGate'), C = global.ChaeksaCloud;
    if (!G) { if (gate) gate.innerHTML = '<p class="adm-msg bad">화면 파일을 불러오지 못했어요. 새로고침해 주세요.</p>'; return; }
    let 됨 = false; try { 됨 = !!(C && C.signedIn && C.signedIn()); } catch (e) { 됨 = false; }
    if (!됨) {
      gate.innerHTML = '<p>검수 계정으로 로그인해 주세요.</p><button type="button" class="btn kakao" id="admLogin"><span class="seal">話</span>카카오로 로그인</button>';
      $('admLogin').onclick = () => {
        try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, at: Date.now() })); } catch (e) {}
        try { C.signInWith('kakao'); } catch (e) { alert(String((e && e.message) || e)); }
      };
      return;
    }
    let 판 = ''; try { 판 = global.ChaeksaUsage ? global.ChaeksaUsage.plan() : ''; } catch (e) { 판 = ''; }
    if (판 !== 'super') { gate.innerHTML = '<p>검수 계정만 열 수 있어요.</p>'; return; }
    gate.innerHTML = '';
    $('admMain').hidden = false;
    $('admReload').onclick = 목록;
    목록();
  }

  global.ChaeksaIlgyeolAdmin = { 시작, 신청꼴, 보기 };
})(window);
