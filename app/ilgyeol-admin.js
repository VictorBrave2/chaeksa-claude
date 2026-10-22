/* 「나는 뭐해 먹고 살까?」 — 사장님 목록(ilgyeol-admin.html · 10-22 사장님 「카카오페이로 판다」 · 「보고서 형식 말고 결제하면 바로 나오게」).
 * 출산택일 목록(taekil-admin.js)과 같은 상태 틀 — 결제된 주문마다 풀이 한 벌(server/migrate-39 ilgyeol_reports).
 *
 * 검수 계정(super)만 쓴다. 화면이 가리는 것은 편의일 뿐이고, 실제로 막는 것은 Supabase 함수 안의 ai_plan() = 'super' 다(ilgyeol_admin_*).
 * 여기는 함수를 부르고 받은 것을 그리기만 한다 — 결제 · 신청서 붙이기는 신청 쪽이, 만들기는 비공개 서버(/api/ilgyeol-report)가 한다.
 * 보통은 손님 화면이 결제 직후 만들기를 부르고 검사를 통과하면 바로 열린다(스위치 ilgyeol_auto_release '1'). 여기서 할 일은 걸린 것 처리 —
 *   막힘(blocked · 검사에 걸림) · 검수 대기(held · 스위치 꺼짐 · 조건 0) · 손님이 두 번 실패(todo 로 남음) · 다시 만들기(손님이 열기 전까지).
 * 「신청 JSON 복사」는 손 도구(비공개 tools/livelihood-manual.js → PDF)에 넣을 꼴 — 서버가 못 만들 때의 뒷길. 환불은 결제 완료 화면의 전액 취소 단추 또는 카카오페이 가맹점관리자.
 * 단추를 누르면 그 줄만 다시 그린다(메모 feedback-owner-tools-human-scale — 바꾼 하나 → 바뀐 것만).
 *
 * 서버 줄 하나(_ilgyeol_list) — { id, mode:'live'|'test', view, state, orderStatus, amount, paidAt, createdAt, at, intakeAt, who, intake, orderNote,
 *   missingN, missing[], cands, n, madeAt, releasedAt, openedAt, note, hasPrev, gone, 결론:{영원, 번역}, meta }
 *   view — todo(결제됐고 안 만듦) · no_intake · making · held · blocked · ready · canceled
 *   intake = 신청 쪽이 결제 전에 붙인 { v, product, person, agreedAt } · person = { name, year · month · day(양력), hour|null, minute|null, gender, place, placeName, 음력?: {y,m,d}, 윤달?, 시모름? }
 */
(function (global) {
  'use strict';
  const P = global.ChaeksaPay, G = P && P.ilgyeol;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (id) => document.getElementById(id);
  const 두 = (n) => (n < 10 ? '0' : '') + n;
  const 이름 = { todo: '안 만듦', no_intake: '신청서 없음', making: '만드는 중', held: '검수 대기', blocked: '막힘', ready: '열림', canceled: '환불' };
  const 나누기 = [['', '전부'], ['todo', '안 만듦'], ['making', '만드는 중'], ['held', '검수 대기'], ['blocked', '막힘'], ['ready', '열림'], ['canceled', '환불']];
  const 모드이름 = { live: '운영', test: '시험' };
  const 이유말 = (r) => ({ forbidden: '검수 계정만 할 수 있어요', login: '로그인이 끝났어요 — 다시 로그인해 주세요', missing: 'migrate-39 SQL 을 아직 Run 하지 않았어요(새 판)',
    network: '인터넷 연결이 끊겼어요', db: '저장소에서 문제가 생겼어요', not_made: '아직 만든 풀이가 없어요', not_held: '검수 대기 상태가 아니에요', opened: '손님이 이미 열어 봤어요 — 다시 만들 수 없어요',
    busy: '지금 만드는 중이에요', not_paid: '결제완료 주문이 아니에요', not_found: '줄을 찾지 못했어요' })[r && r.reason]
    || (r && r.message) || '되지 않았어요';
  let 지금 = '', 줄들 = [], 스위치 = null;
  const 펼침 = new Set();

  const 날 = (s) => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + 두(d.getHours()) + ':' + 두(d.getMinutes()); };
  const 원 = (n) => (P && P.won ? P.won(n) : Number(n || 0).toLocaleString('ko-KR') + '원');
  const 신청서 = (x) => (x && x.intake && typeof x.intake === 'object' && !Array.isArray(x.intake)) ? x.intake : {};
  const 사람 = (x) => { const p = 신청서(x).person; return p && typeof p === 'object' ? p : {}; };
  const 성별 = (g) => (g === 'F' ? '여' : g === 'M' ? '남' : '성별 ?');
  const 시각 = (p) => (p.hour == null || p.시모름 ? '시 모름' : 두(p.hour) + ':' + 두(p.minute || 0));
  const 음력입력 = (p) => (p && p.음력 && typeof p.음력 === 'object' && p.음력.y ? p.음력 : null);
  const 생일 = (p) => {
    if (!p || p.year == null) return '(생년월일 없음)';
    let s = p.year + '-' + 두(p.month) + '-' + 두(p.day) + ' ' + 시각(p);
    const l = 음력입력(p);
    if (l) s += ' (음력으로 넣음: ' + l.y + '-' + 두(l.m) + '-' + 두(l.d) + (p.윤달 ? ' 윤달' : '') + ')';
    return s;
  };
  const 줄id = (id) => String(id == null ? '' : id).replace(/[^A-Za-z0-9_-]/g, '');

  /** 비공개 tools/livelihood-manual.js 의 신청.json 꼴 — { 사람, 접수번호 }. 이름은 넣지 않는다(도구도 버린다). */
  function 신청꼴(x) {
    const p = 사람(x), o = {}, l = 음력입력(p);
    if (l) { o.year = l.y; o.month = l.m; o.day = l.d; o.음력 = true; o.윤달 = !!p.윤달; }
    else { o.year = p.year; o.month = p.month; o.day = p.day; }
    o.hour = p.hour == null || p.시모름 ? null : p.hour; o.minute = o.hour == null ? null : (p.minute || 0);
    o.gender = p.gender; o.place = p.place || null; o.placeName = p.placeName || '';
    return { 사람: o, 접수번호: String(x.id || '') };
  }

  /* ── 나누기 · 스위치 ─────────────────────────────────── */
  function 수세기() { const c = {}; 줄들.forEach((x) => { c[x.view] = (c[x.view] || 0) + 1; }); return c; }
  function 나누기그리기() {
    const box = $('admFilters'); if (!box) return;
    const c = 수세기();
    box.innerHTML = 나누기.map(([k, 말]) => '<button type="button" data-f="' + k + '" class="' + (k === 지금 ? 'on' : '') + '">' + esc(말) + ' ' + (k ? (c[k] || 0) : 줄들.length) + '</button>').join('');
    box.querySelectorAll('button').forEach((b) => { b.onclick = () => { 지금 = b.dataset.f; 나누기그리기(); 목록그리기(); }; });
  }
  function 스위치그리기() {
    const b = $('admAuto'); if (!b) return;
    if (스위치 == null) { b.hidden = true; return; }
    b.hidden = false;
    b.textContent = '결제하면 바로 열기: ' + (스위치 ? '켜짐 (누르면 끔 — 사장님 확인 뒤 열림)' : '꺼짐 (누르면 켬 — 검사 통과하면 바로 열림)');
    b.onclick = () => {
      const 켤 = !스위치;
      if (!confirm(켤 ? '검사를 통과한 운영 결제 풀이를 손님에게 바로 열까요?' : '이제부터 만든 풀이는 사장님이 「내보내기」를 눌러야 열리게 할까요?\n\n이미 열린 것은 그대로예요.')) return;
      b.disabled = true;
      G.adminAuto(켤).then((r) => { b.disabled = false; if (r && r.ok) { 스위치 = !!r.auto; 스위치그리기(); 알림표시('스위치: ' + (스위치 ? '켜짐' : '꺼짐')); } else 알림표시('바꾸지 못했어요: ' + 이유말(r), true); });
    };
  }
  function 알림표시(말, 나쁨) { const m = $('admMsg'); if (m) { m.textContent = 말 || ''; m.classList.toggle('bad', !!나쁨); } }

  /* ── 줄 ───────────────────────────────────────────── */
  function 줄요약(x) {
    const p = 사람(x), v = x.view || '-';
    return '<span class="adm-st st-' + esc(v) + '">' + esc(이름[v] || v) + '</span>'
      + '<b>' + esc(x.id || '-') + '</b>'
      + '<span class="adm-meta">' + esc([x.paidAt ? '결제 ' + 날(x.paidAt) : (x.createdAt ? '주문 ' + 날(x.createdAt) : ''), 모드이름[x.mode] || x.mode || '모드 ?', x.amount != null ? 원(x.amount) : '',
        x.who || p.name || '(이름 없음)', x.missingN ? '걸린 것 ' + x.missingN : '', x.cands != null ? '조건 ' + x.cands : '', x.n ? '만들기 ' + x.n + '번' : '',
        x.openedAt ? '손님 열어 봄 ' + 날(x.openedAt) : (x.releasedAt ? '열림 ' + 날(x.releasedAt) : ''), x.gone ? '탈퇴한 손님' : '', x.note ? '메모 있음' : ''].filter(Boolean).join(' · ')) + '</span>';
  }
  function 줄html(x) {
    const id = 줄id(x.id), 열림 = 펼침.has(id);
    return '<div class="adm-row" data-id="' + esc(id) + '"><button type="button" class="adm-sum" aria-expanded="' + 열림 + '">' + 줄요약(x) + '</button>'
      + '<div class="adm-detail"' + (열림 ? '' : ' hidden') + '></div></div>';
  }
  function 보이는줄() { return 줄들.filter((x) => !지금 || x.view === 지금 || (지금 === 'todo' && x.view === 'no_intake')); }
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
  /** 바뀐 줄 하나만 — 서버가 돌려준 row 가 있으면 그것으로, 없으면 목록을 다시 읽어 그 줄만 갈아 끼운다 */
  function 줄새로(id, 말, row) {
    const 끼움 = (x) => {
      const i = 줄들.findIndex((y) => y.id === x.id); if (i >= 0) 줄들[i] = x; else 줄들.unshift(x);
      const el = 줄칸(id);
      if (el) { const 새 = document.createElement('div'); 새.innerHTML = 줄html(x); el.replaceWith(새.firstChild); 줄달기(x); } else 목록그리기();
      나누기그리기();
      if (말) 알림(id, 말);
    };
    if (row) { 끼움(row); return Promise.resolve(); }
    return G.adminList(null).then((r) => {
      const x = r && r.ok && Array.isArray(r.rows) ? r.rows.find((y) => 줄id(y.id) === 줄id(id)) : null;
      if (x) 끼움(x); else if (말) 알림(id, 말);
    });
  }
  function 알림(id, 말, 나쁨) {
    const el = 줄칸(id), m = el && el.querySelector('.adm-msg');
    if (m) { m.textContent = 말 || ''; m.classList.toggle('bad', !!나쁨); }
    else if (말) alert(말);
  }

  /* ── 줄을 펼치면 ─────────────────────────────────────── */
  function 사람칸(p) {
    return '<div class="adm-person"><h4>풀이를 볼 분 — ' + esc(p.name || '(이름 없음)') + '</h4>'
      + '<div class="adm-kv"><span>생년월일시</span><span>' + esc(생일(p)) + '</span></div>'
      + '<div class="adm-kv"><span>성별</span><span>' + esc(성별(p.gender)) + '</span></div>'
      + '<div class="adm-kv"><span>태어난 곳</span><span>' + esc((p.placeName || '(없음)') + (p.place ? ' · ' + p.place : '')) + '</span></div></div>';
  }
  function 자세히그리기(x, 말) {
    const id = 줄id(x.id), el = 줄칸(id); if (!el) return;
    const d = el.querySelector('.adm-detail'); d.hidden = false;
    const v = x.view, 환불 = v === 'canceled', 만듦 = v === 'held' || v === 'blocked' || v === 'ready';
    const 단추 = [];
    const 단 = (k, 글, 됨) => 단추.push('<button type="button" class="btn ghost small" data-act="' + k + '"' + (됨 ? '' : ' disabled') + '>' + esc(글) + '</button>');
    단추.push('<a class="btn ghost small" href="' + esc(G.주소(x.id)) + '" target="_blank" rel="noopener">보기(사장님 몫)</a>');
    단추.push('<a class="btn ghost small" href="' + esc(G.주소(x.id)) + '&amp;as=customer" target="_blank" rel="noopener">손님 눈으로 보기</a>');
    단('make', v === 'making' ? '만드는 중…' : '만들기', (v === 'todo') && !환불);
    단('release', '내보내기(손님에게 열기)', v === 'held' && !x.missingN && !환불);
    단('redo', '다시 만들기', 만듦 && !x.openedAt && !환불);
    단('copy', '신청 JSON 복사(손 도구용)', !!x.intake);
    d.innerHTML = '<div class="adm-acts">' + 단추.join('') + '</div>'
      + '<p class="adm-msg" role="status">' + esc(말 || '') + '</p>'
      + '<div class="adm-box" data-pane hidden></div>'
      + (x.결론 && (x.결론.영원 || x.결론.번역) ? '<h4>결론 두 줄</h4><p class="adm-memo">' + esc(x.결론.영원 || '') + '\n' + esc(x.결론.번역 || '') + '</p>' : '')
      + (x.missingN ? '<h4>걸린 것</h4><p class="adm-msg bad">' + esc((x.missing || []).join('\n')) + '</p>' : '')
      + (x.intake ? '<div class="adm-cols">' + 사람칸(사람(x)) + '</div>' : '<p class="adm-msg bad">이 주문에는 신청서가 붙어 있지 않아요 — 손님에게 메일로 생년월일시 · 태어난 곳을 받아야 해요.</p>')
      + '<h4>결제와 상태</h4>'
      + '<div class="adm-kv"><span>결제</span><span>' + esc([x.orderStatus === 'canceled' ? '환불' : '결제됨', 모드이름[x.mode] || x.mode || '모드 ?', x.amount != null ? 원(x.amount) : ''].filter(Boolean).join(' · ')) + '</span></div>'
      + '<div class="adm-kv"><span>때</span><span>' + esc(['주문 ' + (날(x.createdAt) || '-'), x.paidAt ? '결제 ' + 날(x.paidAt) : '', x.intakeAt ? '신청서 붙음 ' + 날(x.intakeAt) : '', x.madeAt ? '만듦 ' + 날(x.madeAt) : '', x.releasedAt ? '열림 ' + 날(x.releasedAt) : '', x.openedAt ? '손님 열어 봄 ' + 날(x.openedAt) : ''].filter(Boolean).join(' · ')) + '</span></div>'
      + '<div class="adm-kv"><span>표 상태</span><span>' + esc([이름[v] || v, x.state ? '(state ' + x.state + ')' : '', x.cands != null ? '조건 ' + x.cands : '', '만들기 ' + (x.n || 0) + '번', x.hasPrev ? '앞 판 있음' : ''].filter(Boolean).join(' · ')) + '</span></div>'
      + (x.meta ? '<div class="adm-kv"><span>속 몫</span><span>' + esc([x.meta.모델 || '', x.meta.걸린ms ? Math.round(x.meta.걸린ms / 1000) + '초' : '', x.meta.사용량 && x.meta.사용량.본문 ? '본문 토큰 ' + (x.meta.사용량.본문.in || 0) + '/' + (x.meta.사용량.본문.out || 0) : '', (x.meta.주의 || []).join(' / ')].filter(Boolean).join(' · ')) + '</span></div>' : '')
      + (x.orderNote ? '<div class="adm-kv"><span>주문 메모</span><span>' + esc(x.orderNote) + '</span></div>' : '')
      + '<h4>메모(틀린 곳)</h4><div class="adm-box"><textarea data-note rows="3">' + esc(x.note || '') + '</textarea><button type="button" class="btn ghost small" data-act="note">메모 저장</button></div>'
      + (환불 ? '<p class="hint">환불된 주문이라 풀이를 만들지 않아요.</p>' : '');
    d.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => 누름(x, b.dataset.act, b); });
  }

  /* ── 단추 ─────────────────────────────────────────── */
  function 만들기(x, b) {
    const id = 줄id(x.id);
    if (b) b.disabled = true;
    알림(id, '만드는 중이에요 — 보통 1~2분 걸려요. 이 창을 닫아도 서버는 이어서 만들어요.');
    return G.make(x.id).then((r) => 줄새로(id, r && r.ok ? '만들었어요 — 상태 ' + (이름[r.state] || r.state) : '만들지 못했어요: ' + ((r && r.message) || '') + (r && r.reason ? ' (' + r.reason + ')' : '')));
  }
  function 누름(x, act, b) {
    const id = 줄id(x.id);
    if (act === 'make') { 만들기(x, b); return; }
    if (act === 'release') {
      if (!confirm('이 풀이를 손님에게 열까요?\n\n열린 뒤 손님이 한 번 띄우면 다시 만들 수 없어요.')) return;
      b.disabled = true;
      G.adminRelease(x.id).then((r) => 줄새로(id, r && r.ok ? '열었어요 — 손님 결과 쪽에서 열려요.' : '열지 못했어요: ' + 이유말(r), r && r.ok ? r.row : null));
      return;
    }
    if (act === 'redo') {
      if (!confirm('지금 판을 「앞 판」으로 옮기고 새로 만들까요?\n\nAI 를 한 번 더 불러요(토큰).')) return;
      b.disabled = true;
      G.adminRedo(x.id).then((r) => { if (r && r.ok) return 줄새로(id, null, r.row).then(() => 만들기(줄들.find((y) => y.id === x.id) || x)); 알림(id, '다시 만들지 못했어요: ' + 이유말(r), true); b.disabled = false; });
      return;
    }
    if (act === 'note') {
      const el = 줄칸(id), t = el && el.querySelector('[data-note]');
      G.adminNote(x.id, t ? t.value : '').then((r) => 줄새로(id, r && r.ok ? '메모를 저장했어요.' : '저장하지 못했어요: ' + 이유말(r), r && r.ok ? r.row : null));
      return;
    }
    if (act === 'copy') {
      const 글 = JSON.stringify(신청꼴(x), null, 1);
      const 됨 = () => 알림(id, '신청 JSON 을 복사했어요. 파일로 저장해 node tools/livelihood-manual.js <파일> 로 돌리면 PDF 가 나와요(서버가 못 만들 때의 뒷길).');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(글).then(됨, () => 손복사(id, 글));
      else 손복사(id, 글);
    }
  }
  function 손복사(id, 글) {
    const el = 줄칸(id), p = el && el.querySelector('[data-pane]'); if (!p) return;
    p.hidden = false;
    p.innerHTML = '<p class="hint">복사가 막혀서 아래에 펼쳤어요 — 전부 골라 복사해 주세요.</p><textarea class="adm-copy" readonly></textarea>';
    const t = p.querySelector('textarea'); t.value = 글; t.focus(); t.select();
  }

  /* ── 시작 ─────────────────────────────────────────── */
  function 목록() {
    const box = $('admRows'); if (box) box.innerHTML = '<p class="hint">불러오는 중…</p>';
    return G.adminList(null).then((r) => {
      if (!(r && r.ok && Array.isArray(r.rows))) { if (box) box.innerHTML = '<p class="adm-msg bad">' + esc(이유말(r)) + '</p>'; return; }
      줄들 = r.rows; 스위치 = typeof r.auto === 'boolean' ? r.auto : null;
      스위치그리기(); 나누기그리기(); 목록그리기();
      알림표시(r.released != null ? '지금까지 열린 풀이 ' + r.released + '벌' : '');
    });
  }
  function 시작() {
    const gate = $('admGate'), C = global.ChaeksaCloud;
    if (!G || !G.adminList) { if (gate) gate.innerHTML = '<p class="adm-msg bad">화면 파일을 불러오지 못했어요. 새로고침해 주세요.</p>'; return; }
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

  global.ChaeksaIlgyeolAdmin = { 시작, 신청꼴 };
})(window);
