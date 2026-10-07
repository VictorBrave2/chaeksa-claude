/* 결혼상대 점검 신청 — 사장님 목록(gyeolhon-admin.html · 10-07 작업판 결혼-1 「신청 길 바꿈」).
 *
 * 검수 계정(super)만 쓴다. 화면이 가리는 것은 편의일 뿐이고, 실제로 막는 것은 Supabase 함수 안의 ai_plan() = 'super' 다(비공개 core sql-gyeolhon-apply.sql).
 * 여기는 함수를 부르고 받은 것을 그리기만 한다 — 검사 · 저장 · 입금 계좌는 비공개 서버(api/gyeolhon-apply.js)에 있다.
 * 보고서는 메인이 비공개 tools/gyeolhon-manual.js 로 만든다 — 「신청 JSON 복사」가 그 도구의 신청.json 꼴을 낸다.
 * 단추를 누르면 그 줄만 다시 그린다(메모 feedback-owner-tools-human-scale — 바꾼 하나 → 바뀐 것만).
 *
 *   나누기 — 전부 · 접수 · 입금 확인 · 보냄 · 취소
 *   줄 — 접수일 · 접수 번호 · 손님 갈래(본인 · 부모) · 두 사람 이름 · 상태
 *   줄을 펼치면 — 두 사람 생년월일시(음력이면 음력도) · 성별 · 태어난 곳 · 메일 · 연락처 · 입금자 · 알아 둘 것 · 동의 시각 · 메모
 *   단추 — 입금 확인 · 보냄 · 취소 · 접수로 되돌리기 · 메모 저장 · 신청 JSON 복사 · 메일 쓰기 · 지우기(손님이 지워 달라고 할 때)
 */
(function (global) {
  'use strict';
  const P = global.ChaeksaPay, G = P && P.gyeolhon;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (id) => document.getElementById(id);
  const 두 = (n) => (n < 10 ? '0' : '') + n;
  const 상태이름 = { received: '접수', paid: '입금 확인', sent: '보냄', canceled: '취소' };
  const 나누기 = [['', '전부'], ['received', '접수'], ['paid', '입금 확인'], ['sent', '보냄'], ['canceled', '취소']];
  const 갈래이름 = { self: '본인', parent: '부모' };
  const 문의 = 'dl4431@naver.com';
  const 이유말 = (r) => ({ forbidden: '검수 계정만 할 수 있어요', login: '로그인이 끝났어요 — 다시 로그인해 주세요', missing: 'sql-gyeolhon-apply.sql 을 아직 Run 하지 않았어요',
    not_found: '줄을 찾지 못했어요', bad: '상태 이름이 맞지 않아요', network: '인터넷 연결이 끊겼어요', db: '저장소에서 문제가 생겼어요' })[r && r.reason]
    || (r && r.message) || '되지 않았어요';
  let 지금 = '', 줄들 = [];
  const 펼침 = new Set();

  const 날 = (s) => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + 두(d.getHours()) + ':' + 두(d.getMinutes()); };
  const 사람 = (x, k) => (x && x.people && x.people[k] && typeof x.people[k] === 'object') ? x.people[k] : {};
  const 연락 = (x) => (x && x.contact && typeof x.contact === 'object') ? x.contact : {};
  const 성별 = (g) => (g === 'F' ? '여' : g === 'M' ? '남' : '성별 ?');
  const 시각 = (p) => (p.hour == null ? '시 모름' : 두(p.hour) + ':' + 두(p.minute || 0));
  const 생일 = (p) => {
    if (!p || p.year == null) return '(생년월일 없음)';
    let s = p.year + '-' + 두(p.month) + '-' + 두(p.day) + ' ' + 시각(p);
    if (p.calendar === 'lunar' && p.lunarInput) s += ' (음력으로 넣음: ' + p.lunarInput.y + '-' + 두(p.lunarInput.m) + '-' + 두(p.lunarInput.d) + (p.lunarInput.leap ? ' 윤달' : '') + ')';
    return s;
  };
  const 줄id = (id) => String(id == null ? '' : id).replace(/[^A-Za-z0-9_-]/g, '');

  /** 비공개 tools/gyeolhon-manual.js 의 신청.json 꼴 — { 나, 그, 손님 }. 이름 · 연락처는 넣지 않는다(도구도 버린다). placeName 은 사장님이 읽는 덤(도구는 안 읽는다). */
  function 신청꼴(x) {
    const 한사람 = (p) => {
      const o = {};
      if (p.calendar === 'lunar' && p.lunarInput) { o.year = p.lunarInput.y; o.month = p.lunarInput.m; o.day = p.lunarInput.d; o.음력 = true; o.윤달 = !!p.lunarInput.leap; }
      else { o.year = p.year; o.month = p.month; o.day = p.day; }
      o.hour = p.hour == null ? null : p.hour; o.minute = p.hour == null ? null : (p.minute || 0);
      o.gender = p.gender; o.place = p.place || null; o.placeName = p.placeName || '';
      return o;
    };
    return { 나: 한사람(사람(x, 'first')), 그: 한사람(사람(x, 'second')), 손님: x.kind === 'parent' ? '부모' : '본인' };
  }

  /* ── 나누기 ─────────────────────────────────────────────── */
  function 수세기() { const c = {}; 줄들.forEach((x) => { c[x.status] = (c[x.status] || 0) + 1; }); return c; }
  function 나누기그리기() {
    const box = $('admFilters'); if (!box) return;
    const c = 수세기();
    box.innerHTML = 나누기.map(([k, 말]) => '<button type="button" data-f="' + k + '" class="' + (k === 지금 ? 'on' : '') + '">' + esc(말) + ' ' + (k ? (c[k] || 0) : 줄들.length) + '</button>').join('');
    box.querySelectorAll('button').forEach((b) => { b.onclick = () => { 지금 = b.dataset.f; 나누기그리기(); 목록그리기(); }; });
  }

  /* ── 줄 ───────────────────────────────────────────────── */
  function 줄요약(x) {
    const a = 사람(x, 'first'), b = 사람(x, 'second');
    return '<span class="adm-st st-' + esc(x.status) + '">' + esc(상태이름[x.status] || x.status || '-') + '</span>'
      + '<b>' + esc(x.code || '-') + '</b>'
      + '<span class="adm-meta">' + esc([날(x.createdAt) ? '접수 ' + 날(x.createdAt) : '', 갈래이름[x.kind] || x.kind || '',
        (a.name || '?') + ' · ' + (b.name || '?'), x.paidAt ? '입금 확인 ' + 날(x.paidAt) : '', x.sentAt ? '보냄 ' + 날(x.sentAt) : '', x.memo ? '메모 있음' : ''].filter(Boolean).join(' · ')) + '</span>';
  }
  function 줄html(x) {
    const id = 줄id(x.id), 열림 = 펼침.has(id);
    return '<div class="adm-row" data-id="' + esc(id) + '"><button type="button" class="adm-sum" aria-expanded="' + 열림 + '">' + 줄요약(x) + '</button>'
      + '<div class="adm-detail"' + (열림 ? '' : ' hidden') + '></div></div>';
  }
  function 보이는줄() { return 줄들.filter((x) => !지금 || x.status === 지금); }
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
  /** 바뀐 줄 하나만 — 받은 row 로 그 자리를 다시 그린다 */
  function 줄새로(row, 말) {
    const id = 줄id(row.id), i = 줄들.findIndex((y) => 줄id(y.id) === id);
    if (i >= 0) 줄들[i] = row; else 줄들.unshift(row);
    const el = 줄칸(id);
    if (el) { const 새 = document.createElement('div'); 새.innerHTML = 줄html(row); el.replaceWith(새.firstChild); 줄달기(row); }
    else 목록그리기();
    나누기그리기();
    if (말) 알림(id, 말);
  }
  function 줄빼기(id, 말) {
    줄들 = 줄들.filter((y) => 줄id(y.id) !== 줄id(id));
    펼침.delete(줄id(id));
    목록그리기(); 나누기그리기();
    const box = $('admMsg'); if (box) { box.textContent = 말 || ''; box.classList.remove('bad'); }
  }
  function 알림(id, 말, 나쁨) {
    const el = 줄칸(id), m = el && el.querySelector('.adm-msg');
    if (m) { m.textContent = 말 || ''; m.classList.toggle('bad', !!나쁨); }
    else if (말) alert(말);
  }

  /* ── 줄을 펼치면 ───────────────────────────────────────── */
  function 사람칸(머리, p) {
    return '<div class="adm-person"><h4>' + esc(머리) + ' — ' + esc(p.name || '(이름 없음)') + '</h4>'
      + '<div class="adm-kv"><span>생년월일시</span><span>' + esc(생일(p)) + '</span></div>'
      + '<div class="adm-kv"><span>성별</span><span>' + esc(성별(p.gender)) + '</span></div>'
      + '<div class="adm-kv"><span>태어난 곳</span><span>' + esc((p.placeName || '(없음)') + (p.place ? ' · ' + p.place : '') + (typeof p.longitude === 'number' ? ' · 경도 ' + p.longitude : '')) + '</span></div></div>';
  }
  function 자세히그리기(x, 말) {
    const id = 줄id(x.id), el = 줄칸(id); if (!el) return;
    const d = el.querySelector('.adm-detail'); d.hidden = false;
    const c = 연락(x), 부모 = x.kind === 'parent';
    const 단추 = [];
    const 단 = (k, 글, 됨) => 단추.push('<button type="button" class="btn ghost small" data-act="' + k + '"' + (됨 ? '' : ' disabled') + '>' + esc(글) + '</button>');
    단('paid', '입금 확인', x.status === 'received');
    단('sent', '보냄', x.status === 'received' || x.status === 'paid');
    단('canceled', '취소', x.status !== 'canceled');
    단('received', '접수로 되돌리기', x.status !== 'received');
    단('note', '메모', true);
    단('copy', '신청 JSON 복사', true);
    단('mail', '메일 쓰기', !!(c.email && /@/.test(c.email)));
    단('delete', '지우기', true);
    d.innerHTML = '<div class="adm-acts">' + 단추.join('') + '</div>'
      + '<p class="adm-msg" role="status">' + esc(말 || '') + '</p>'
      + '<div class="adm-box" data-pane hidden></div>'
      + '<div class="adm-cols">' + 사람칸(부모 ? '첫째 분(자녀)' : '첫째 분(본인)', 사람(x, 'first')) + 사람칸('둘째 분(결혼 상대)', 사람(x, 'second')) + '</div>'
      + '<h4>연락과 입금</h4>'
      + '<div class="adm-kv"><span>메일(PDF 받을 곳)</span><span>' + esc(c.email || '-') + '</span></div>'
      + '<div class="adm-kv"><span>연락처</span><span>' + esc(c.contact || '-') + '</span></div>'
      + '<div class="adm-kv"><span>입금하실 분</span><span>' + esc(c.payer || '-') + '</span></div>'
      + '<div class="adm-kv"><span>알아 둘 것</span><span>' + esc(x.note || '(없음)') + '</span></div>'
      + '<div class="adm-kv"><span>동의</span><span>' + esc(날(x.agreedAt) || '-') + '</span></div>'
      + '<div class="adm-kv"><span>때</span><span>' + esc(['접수 ' + (날(x.createdAt) || '-'), x.paidAt ? '입금 확인 ' + 날(x.paidAt) : '', x.sentAt ? '보냄 ' + 날(x.sentAt) : ''].filter(Boolean).join(' · ')) + '</span></div>'
      + (x.memo ? '<h4>메모</h4><p class="adm-memo">' + esc(x.memo) + '</p>' : '');
    d.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => 누름(x, b.dataset.act, b); });
  }

  /* ── 단추 ─────────────────────────────────────────────── */
  function 상태바꾸기(x, status, b, 말) {
    if (b) b.disabled = true;
    return G.adminStatus(x.id, status, null).then((r) => {
      if (r && r.ok && r.row) 줄새로(r.row, 말);
      else { 알림(x.id, '바꾸지 못했어요: ' + 이유말(r), true); if (b) b.disabled = false; }
    });
  }
  function 누름(x, act, b) {
    const id = 줄id(x.id), c = 연락(x);
    if (act === 'paid') { 상태바꾸기(x, 'paid', b, '입금 확인으로 바꿨어요. 이제 「신청 JSON 복사」로 보고서를 만들어요.'); return; }
    if (act === 'sent') { 상태바꾸기(x, 'sent', b, '보냄으로 바꿨어요.'); return; }
    if (act === 'received') { 상태바꾸기(x, 'received', b, '접수로 되돌렸어요.'); return; }
    if (act === 'canceled') {
      if (!confirm('이 신청을 취소로 바꿀까요?\n\n줄은 남고 상태만 「취소」가 돼요. 지우려면 「지우기」를 눌러요.')) return;
      상태바꾸기(x, 'canceled', b, '취소로 바꿨어요.'); return;
    }
    if (act === 'delete') {
      if (!confirm('이 신청을 지울까요?\n\n두 사람 생년월일 · 연락처가 저장소에서 바로 사라지고 되돌릴 수 없어요. 손님이 지워 달라고 했을 때만 눌러요.')) return;
      b.disabled = true;
      G.adminDelete(x.id).then((r) => { if (r && r.ok) 줄빼기(id, '지웠어요 — ' + (x.code || '')); else { 알림(id, '지우지 못했어요: ' + 이유말(r), true); b.disabled = false; } });
      return;
    }
    if (act === 'copy') {
      const 글 = JSON.stringify(신청꼴(x), null, 1);
      const 됨 = () => 알림(id, '신청 JSON 을 복사했어요. 파일로 저장한 뒤 node tools/gyeolhon-manual.js <파일> ' + (x.code || '이름') + (x.kind === 'parent' ? ' --parent' : '') + ' 로 만들어요.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(글).then(됨, () => 손복사(id, 글));
      else 손복사(id, 글);
      return;
    }
    if (act === 'mail') {
      const 본문 = ['안녕하세요, 책사입니다.', '', '신청하신 결혼상대 점검 보고서를 보내 드려요(접수 번호 ' + (x.code || '') + '). PDF 를 붙여 드려요.', '', '문의 — ' + 문의];
      location.href = 'mailto:' + encodeURIComponent(c.email).replace(/%40/g, '@') + '?subject=' + encodeURIComponent('[책사] 결혼상대 점검 보고서') + '&body=' + encodeURIComponent(본문.join('\r\n'));
      return;
    }
    if (act === 'note') 메모칸(x);
  }
  function 판칸(id) { const el = 줄칸(id); const p = el && el.querySelector('[data-pane]'); if (p) p.hidden = false; return p; }
  function 손복사(id, 글) {
    const p = 판칸(id); if (!p) return;
    p.innerHTML = '<p class="hint">복사가 막혀서 아래에 펼쳤어요 — 전부 골라 복사해 주세요.</p><textarea class="adm-copy" readonly></textarea>';
    const t = p.querySelector('textarea'); t.value = 글; t.focus(); t.select();
  }
  function 메모칸(x) {
    const p = 판칸(x.id); if (!p) return;
    p.innerHTML = '<label class="hint">입금 맞춘 것 · 손님과 주고받은 것 · 틀린 곳을 적어 둬요(비우고 저장하면 지워요).</label>'
      + '<textarea class="adm-note" maxlength="4000"></textarea><button type="button" class="btn small">메모 저장</button>';
    const t = p.querySelector('textarea'); t.value = x.memo || '';
    p.querySelector('button').onclick = () => G.adminStatus(x.id, null, t.value).then((r) => {
      if (r && r.ok && r.row) 줄새로(r.row, '메모를 저장했어요.'); else 알림(x.id, '저장하지 못했어요: ' + 이유말(r), true);
    });
  }

  /* ── 시작 ─────────────────────────────────────────────── */
  function 목록() {
    const box = $('admRows'); if (box) box.innerHTML = '<p class="hint">불러오는 중…</p>';
    return G.adminList(null).then((r) => {
      if (!Array.isArray(r)) { if (box) box.innerHTML = '<p class="adm-msg bad">' + esc(이유말(r)) + '</p>'; return; }
      줄들 = r;
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

  global.ChaeksaGyeolhonAdmin = { 시작, 신청꼴 };
})(window);
