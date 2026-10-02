/* 출산택일 보고서 — 사장님 목록(taekil-admin.html · 10-02 설계서 「3) 사장님 흐름」).
 *
 * 검수 계정(super)만 쓴다. 화면이 가리는 것은 편의일 뿐이고, 실제로 막는 것은 Supabase 함수 안의 ai_plan() = 'super' 다(server/migrate-36).
 * 여기는 함수를 부르고 받은 것을 그리기만 한다 — 판정 · 고르기 · 누락 검사 · 문장 틀은 비공개 서버에 있다.
 * 단추를 누르면 그 줄만 다시 그린다(메모 feedback-owner-tools-human-scale — 바꾼 하나 → 바뀐 것만).
 *
 *   맨 위 스위치 — 처음 몇 건 확인(app_flags.taekil_auto_release '0', 기본) ↔ 바로 열기('1', 사장님 말이 있을 때만)
 *   나누기 — 검수 대기 · 막힘 · 결제됐는데 안 만듦 · 만드는 중 · 열림 · 환불
 *   줄 — 결제일 · 기간 · 지역 · 성별 · 결제 모드(운영 · 시험 · 수기) · 상태 · 빠진 칸 수 · 손님이 처음 연 때
 *   줄을 누르면 — 단추 · 빠진 칸 · 신청서 원문과 「이렇게 읽었어요」 · 엔진판 · 만든 시각 · 토큰 · 걸린 시간 · 차례 비교 · 손님이 볼 보고서(앞 판과 나란히)
 *   단추 — 만들기 · 내보내기 · 다시 만들기 · 신청서 고치기 · 메일 쓰기 · 메일용 글 복사 · 메모 · 손님 눈으로 보기 / 대신 넣기(네이버폼 신청 → 수기 줄)
 */
(function (global) {
  'use strict';
  const P = global.ChaeksaPay, T = P && P.taekil, F = P && P.주문서, V = global.ChaeksaTaekilReport;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (id) => document.getElementById(id);
  const 두 = (n) => (n < 10 ? '0' : '') + n;
  const 이름 = { held: '검수 대기', blocked: '막힘', todo: '결제됐는데 안 만듦', no_intake: '신청서 없음', making: '만드는 중', ready: '열림', canceled: '환불' };
  const 나누기 = [['', '전부'], ['held', '검수 대기'], ['blocked', '막힘(빠진 칸)'], ['todo', '결제됐는데 안 만듦'], ['making', '만드는 중'], ['ready', '열림'], ['canceled', '환불']];
  const 모드 = { live: '운영', test: '시험', manual: '수기' };
  const 칸이름 = { mail: '메일', range: '출산 예정 기간', hospital: '병원이 말한 날짜', have: '받아 둔 날짜 · 시간', place: '태어날 지역', sex: '아이 성별',
    time: '수술 가능한 시간대', weekend: '주말', first: '원하시는 방향', father: '아버지', mother: '어머니', siblings: '형제자매', wish: '바라는 점', ask: '궁금한 점' };
  const 문의 = 'dl4431@naver.com';
  let 지금 = '', 줄들 = [], 스위치 = { auto: false, released: 0 };
  const 펼침 = new Set();

  const 날 = (s) => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + 두(d.getHours()) + ':' + 두(d.getMinutes()); };
  const 한국날 = (s) => { const t = s ? Date.parse(s) : NaN; const d = new Date((Number.isFinite(t) ? t : Date.now()) + 9 * 3600e3); return d.getUTCFullYear() + '-' + 두(d.getUTCMonth() + 1) + '-' + 두(d.getUTCDate()); };
  const 원문 = (it) => (it && typeof it === 'object' ? (it.원문 || it.raw || it.data || it) : null);
  const 칸id = (id) => String(id || '').replace(/[^A-Za-z0-9_-]/g, '');
  const 이유말 = (r) => ({ forbidden: '검수 계정만 할 수 있어요', login: '로그인이 끝났어요 — 다시 로그인해 주세요', missing: 'migrate-36 SQL 을 아직 Run 하지 않았어요',
    not_made: '아직 만든 보고서가 없어요', not_held: '검수 대기 상태가 아니에요', opened: '손님이 이미 열어 봐서 다시 만들 수 없어요', busy: '지금 만드는 중이에요',
    not_paid: '결제완료 주문이 아니에요', not_found: '줄을 찾지 못했어요', bad: '신청서 꼴이 맞지 않아요', network: '인터넷 연결이 끊겼어요', db: '저장소에서 문제가 생겼어요' })[r && r.reason]
    || (r && r.message) || '되지 않았어요';

  /* ── 맨 위 ─────────────────────────────────────────────── */
  function 스위치그리기() {
    const box = $('admSwitch'); if (!box) return;
    box.innerHTML = 스위치.auto
      ? '<p><b>바로 열기: 켜짐</b> — 빠진 칸이 없는 운영 결제 보고서는 만들자마자 손님에게 열려요(시험 결제 · 수기 · 권할 곳 0곳은 빼고). 지금까지 연 보고서 ' + 스위치.released + '건.</p>'
        + '<button type="button" class="btn ghost small" id="admAuto">처음 몇 건 확인으로 되돌리기</button>'
      : '<p><b>처음 몇 건 확인: 켜짐</b> — 「내보내기」를 눌러야 손님에게 열려요. 지금까지 내보낸 보고서 ' + 스위치.released + '건.</p>'
        + '<button type="button" class="btn ghost small" id="admAuto">바로 열기로 바꾸기</button>';
    $('admAuto').onclick = () => {
      const 켤 = !스위치.auto;
      if (!confirm(켤 ? '바로 열기로 바꿀까요?\n\n빠진 칸이 없는 운영 결제 보고서는 사장님 확인 없이 손님에게 바로 열려요.' : '처음 몇 건 확인으로 되돌릴까요?\n\n새로 만든 보고서는 「내보내기」를 눌러야 열려요.')) return;
      T.adminAuto(켤).then((r) => {
        if (r && r.ok) { 스위치 = { auto: !!r.auto, released: r.released || 0 }; 스위치그리기(); }
        else alert(이유말(r));
      });
    };
  }
  function 수세기() {
    const c = {};
    줄들.forEach((x) => { const v = x.view === 'no_intake' ? 'todo' : x.view; c[v] = (c[v] || 0) + 1; });
    return c;
  }
  function 나누기그리기() {
    const box = $('admFilters'); if (!box) return;
    const c = 수세기();
    box.innerHTML = 나누기.map(([k, 말]) => '<button type="button" data-f="' + k + '" class="' + (k === 지금 ? 'on' : '') + '">' + esc(말) + ' ' + (k ? (c[k] || 0) : 줄들.length) + '</button>').join('');
    box.querySelectorAll('button').forEach((b) => { b.onclick = () => { 지금 = b.dataset.f; 나누기그리기(); 목록그리기(); }; });
  }

  /* ── 줄 ───────────────────────────────────────────────── */
  function 줄요약(x) {
    const 성 = { 남아: '남아', 여아: '여아', 모름: '성별 모름' }[x.sex] || (x.sex ? x.sex : '성별 안 적음');
    return '<span class="adm-st st-' + esc(x.view) + '">' + esc(이름[x.view] || x.view || '-') + '</span>'
      + '<b>' + esc(x.range || '(기간 안 적음)') + '</b>'
      + '<span class="adm-meta">' + esc([x.place || '(지역 안 적음)', 성, 모드[x.mode] || x.mode, (x.source === 'manual' ? '넣은 때 ' : '결제 ') + (날(x.paidAt || x.createdAt) || '-'),
        '빠진 칸 ' + (x.missingN || 0), x.cands != null ? '권할 곳 ' + x.cands : '', x.openedAt ? '손님이 처음 연 때 ' + 날(x.openedAt) : '손님이 아직 안 열어 봄',
        x.note ? '메모 있음' : '', x.gone ? '탈퇴한 손님' : ''].filter(Boolean).join(' · ')) + '</span>';
  }
  function 줄html(x) {
    const id = 칸id(x.id), 열림 = 펼침.has(x.id);
    return '<div class="adm-row" data-id="' + esc(id) + '"><button type="button" class="adm-sum" aria-expanded="' + 열림 + '">' + 줄요약(x) + '</button>'
      + '<div class="adm-detail"' + (열림 ? '' : ' hidden') + '></div></div>';
  }
  function 보이는줄() { return 줄들.filter((x) => !지금 || x.view === 지금 || (지금 === 'todo' && x.view === 'no_intake')); }
  function 목록그리기() {
    const box = $('admRows'); if (!box) return;
    const xs = 보이는줄();
    box.innerHTML = xs.length ? xs.map(줄html).join('') : '<p class="hint">이 나누기에는 줄이 없어요.</p>';
    xs.forEach((x) => 줄달기(x.id));
  }
  function 줄칸(id) { return document.querySelector('.adm-row[data-id="' + 칸id(id) + '"]'); }
  function 줄달기(id) {
    const el = 줄칸(id); if (!el) return;
    el.querySelector('.adm-sum').onclick = () => {
      if (펼침.has(id)) { 펼침.delete(id); el.querySelector('.adm-detail').hidden = true; el.querySelector('.adm-sum').setAttribute('aria-expanded', 'false'); return; }
      펼침.add(id); el.querySelector('.adm-sum').setAttribute('aria-expanded', 'true');
      자세히(id);
    };
    if (펼침.has(id)) 자세히(id);
  }
  /** 받은 사장님 몫(taekil_view) → 목록 줄 꼴(_taekil_list 와 같은 열쇠) */
  function 줄로(a) {
    const s = 원문(a.intake) || {}, o = a.order || {};
    return { id: a.orderId, source: a.source, mode: a.mode, view: a.view, state: a.state, orderStatus: o.status || null,
      paidAt: o.paidAt || null, createdAt: a.createdAt || o.createdAt || null, at: o.paidAt || a.createdAt || null,
      range: String(s.range || '').slice(0, 80), place: String(s.place || '').slice(0, 40), sex: String(s.sex || '').slice(0, 10),
      missingN: (a.missing || []).length, cands: a.cands, n: a.n || 0, madeAt: a.madeAt, releasedAt: a.releasedAt, openedAt: a.openedAt,
      note: String(a.note || '').slice(0, 200), hasPrev: !!a.prevReport, intakeEdited: !!a.intakeEdited, gone: !!o.gone };
  }
  /** 그 줄 하나만 다시 읽어 다시 그린다 */
  function 줄새로(id, 말) {
    return T.view(id, false).then((a) => {
      if (!(a && a.ok !== false && a.admin)) { 알림(id, 이유말(a), true); return; }
      const x = 줄로(a), i = 줄들.findIndex((y) => y.id === id);
      if (i >= 0) 줄들[i] = x; else 줄들.unshift(x);
      const el = 줄칸(id);
      if (el) { const 새 = document.createElement('div'); 새.innerHTML = 줄html(x); el.replaceWith(새.firstChild); 줄달기(id); }
      else 목록그리기();
      나누기그리기();
      if (펼침.has(id)) 자세히그리기(id, a, 말);
    });
  }
  function 알림(id, 말, 나쁨) {
    const el = 줄칸(id), m = el && el.querySelector('.adm-msg');
    if (m) { m.textContent = 말 || ''; m.classList.toggle('bad', !!나쁨); }
    else if (말) alert(말);
  }

  /* ── 줄을 펼치면 ───────────────────────────────────────── */
  function 자세히(id) {
    const el = 줄칸(id); if (!el) return;
    const d = el.querySelector('.adm-detail');
    d.hidden = false; d.innerHTML = '<p class="hint">불러오는 중…</p>';
    T.view(id, false).then((a) => {
      if (!(a && a.ok !== false && a.admin)) { d.innerHTML = '<p class="adm-msg bad">' + esc(이유말(a)) + '</p>'; return; }
      자세히그리기(id, a);
    });
  }
  function 기록줄(a) {
    const m = a.meta || {}, 판 = m.엔진판 || {}, ms = m.ms || {};
    const 토큰 = (Array.isArray(m.usage) ? m.usage : []).reduce((s, u) => ({ in: s.in + ((u && u.in) || 0), out: s.out + ((u && u.out) || 0) }), { in: 0, out: 0 });
    return [
      '엔진판 — ' + (판.commit ? String(판.commit).slice(0, 7) : '-') + (판.사슬 ? ' · 사슬 ' + 판.사슬 : '') + (판.dirty ? ' · 커밋 안 된 엔진(dirty)' : ''),
      '만든 시각 — ' + (날(a.madeAt) || '-') + ' · 만들기 잡은 횟수 ' + (a.n || 0) + (a.releasedAt ? ' · 연 때 ' + 날(a.releasedAt) + (a.releasedBy ? '(내보내기)' : '(바로 열기)') : ''),
      '토큰 — 들어감 ' + 토큰.in + ' · 나옴 ' + 토큰.out + ' · AI ' + (m.ai || '-') + (m.ai_걸림 && m.ai_걸림.length ? '(걸림 ' + m.ai_걸림.length + ')' : ''),
      '걸린 시간 — 전체 ' + (ms.전체 != null ? (ms.전체 / 1000).toFixed(1) + '초' : '-') + ' · 엔진 ' + (ms.엔진 != null ? (ms.엔진 / 1000).toFixed(1) + '초' : '-') + ' · AI ' + (ms.ai != null ? (ms.ai / 1000).toFixed(1) + '초' : '-'),
      '판 — 조립기 ' + (m.v || '-') + ' · 프롬프트 ' + (m.prompt || '-') + ' · 모델 ' + (m.model || '-') + ' · 읽개 ' + (m.읽개 || '-') + ' · 고르기 ' + ((m.pick && m.pick.판) || '-') + ' · 차례 ' + ((m.pick && m.pick.차례) || '-'),
    ];
  }
  function 차례비교(a) {
    const c = a.meta && a.meta.차례; if (!c || typeof c !== 'object') return '';
    const 말 = (k) => (Array.isArray(c[k]) ? c[k] : []).map((s, i) => (i + 1) + '. ' + String(s).replace(/^\d{4}-0?(\d+)-0?(\d+)T/, '$1/$2 ')).join('<br>');
    const 들 = ['A', 'B', 'C'].filter((k) => Array.isArray(c[k]));
    if (!들.length) return '';
    return '<details class="tkr-fold"><summary>차례 비교(검수용) — 지금 쓴 차례 ' + esc(c.쓴것 || '-') + '</summary><div class="adm-cols">'
      + 들.map((k) => '<div><b>' + esc(k) + '</b><p class="hint">' + 말(k) + '</p></div>').join('') + '</div></details>';
  }
  function 신청서칸(a) {
    const s = 원문(a.intake);
    if (!s) return '<p class="hint">신청서가 아직 없어요.</p>';
    const 줄 = Object.keys(칸이름).map((k) => {
      const v = k === 'weekend' ? (s[k] ? '주말도 가능' : '') : (k === 'first' ? (F.앞세움이름(s[k]) || '') : String(s[k] == null ? '' : s[k]));
      return v ? '<div class="tkr-read"><span class="tkr-read-k">' + esc(칸이름[k]) + '</span><span class="tkr-read-v">' + esc(v) + '</span></div>' : '';
    }).join('');
    const 읽 = F.읽기(s, 한국날(a.intakeAt));
    const 읽줄 = 읽 ? 읽.줄.map((z) => '<div class="tkr-read' + (z.막힘 ? ' bad' : '') + '"><span class="tkr-read-k">' + esc(z.칸 === 'first' ? '원하시는 방향' : z.이름) + '</span><span class="tkr-read-v">' + esc(z.말) + '</span></div>').join('') : '<p class="hint">읽개를 싣지 못했어요.</p>';
    return '<h4>신청서 원문' + (a.intakeEdited ? ' — 사장님이 고친 것(주문 원본은 그대로)' : '') + '</h4>' + 줄
      + '<h4>이렇게 읽었어요(신청서를 받은 날 ' + esc(한국날(a.intakeAt)) + ' 기준)</h4>' + 읽줄
      + (a.intakeEdited && a.orderIntake ? '<details class="tkr-fold"><summary>주문에 붙은 원본 보기</summary><pre class="adm-pre">' + esc(JSON.stringify(원문(a.orderIntake), null, 1)) + '</pre></details>' : '');
  }
  function 자세히그리기(id, a, 말) {
    const el = 줄칸(id); if (!el) return;
    const d = el.querySelector('.adm-detail');
    const s = 원문(a.intake) || {};
    const 만듦 = !!a.report, 열어봄 = !!a.openedAt, 환불 = a.view === 'canceled';
    const 단추 = [];
    const 단 = (k, 글, 됨) => 단추.push('<button type="button" class="btn ghost small" data-act="' + k + '"' + (됨 ? '' : ' disabled') + '>' + esc(글) + '</button>');
    단('make', '만들기', !만듦 && !환불 && a.view !== 'making' && !!a.intake);
    단('release', '내보내기', a.view === 'held' && !(a.missing || []).length);
    단('redo', '다시 만들기', 만듦 && !열어봄 && !환불 && a.view !== 'making');
    단('intake', '신청서 고치기', !환불);
    단('mail', '메일 쓰기', !!(s.mail && /@/.test(s.mail)));
    단('copy', '메일용 글 복사', 만듦);
    단('note', '메모', true);
    const 손님눈 = '<a class="btn ghost small" href="taekil-report.html?o=' + encodeURIComponent(id) + '&amp;as=customer" target="_blank" rel="noopener">손님 눈으로 보기</a>';
    const 빠진 = (a.missing || []), 문제 = ((a.meta && a.meta.문제) || []).slice(0, 20);
    d.innerHTML = '<div class="adm-acts">' + 단추.join('') + 손님눈 + '</div>'
      + '<p class="adm-msg" role="status">' + esc(말 || '') + '</p>'
      + '<div class="adm-box" data-pane hidden></div>'
      + '<p class="hint">손님 눈 상태 — ' + esc(a.cstate || '-') + (a.note ? ' · 메모: ' + esc(a.note) : '') + '</p>'
      + (빠진.length ? '<h4>빠진 칸 ' + 빠진.length + '</h4><ul class="tkr-ul">' + 빠진.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'
        + (문제.length ? '<details class="tkr-fold"><summary>누락 검사가 본 것 ' + 문제.length + '</summary><pre class="adm-pre">' + esc(JSON.stringify(문제, null, 1)) + '</pre></details>' : '')
        : (만듦 ? '<p class="hint">빠진 칸 없음</p>' : ''))
      + 신청서칸(a)
      + (a.meta ? '<h4>기록</h4><ul class="tkr-ul">' + 기록줄(a).map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' + 차례비교(a)
        + (a.meta.ai_input ? '<details class="tkr-fold"><summary>AI 에 보낸 글 보기(가족 생년월일 · 메일 · 병원 이름이 없어야 해요)</summary><pre class="adm-pre">' + esc(a.meta.ai_input) + '</pre></details>' : '') : '')
      + (만듦 ? '<h4>손님이 볼 보고서</h4>' + (a.prevReport
        ? '<div class="adm-cols adm-two"><div><p class="hint">앞 판(다시 만들기 전)</p><div data-rep="prev">' + V.그리기(a.prevReport) + '</div></div><div><p class="hint">지금 판</p><div data-rep="now">' + V.그리기(a.report) + '</div></div></div>'
        : '<div data-rep="now">' + V.그리기(a.report) + '</div>')
        : (a.prevReport ? '<details class="tkr-fold"><summary>앞 판 보기(다시 만들기 전)</summary><div data-rep="prev">' + V.그리기(a.prevReport) + '</div></details>' : ''));
    const 판 = d.querySelector('[data-rep="now"]'), 앞 = d.querySelector('[data-rep="prev"]');
    if (판) V.카드채우기(판, a.report);
    if (앞) V.카드채우기(앞, a.prevReport);
    d.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => 누름(id, b.dataset.act, a, b); });
  }

  /* ── 단추 ─────────────────────────────────────────────── */
  function 만들기(id, b) {
    if (b) b.disabled = true;
    알림(id, '만드는 중이에요 — 보통 1~2분 걸려요. 이 창을 닫아도 서버는 이어서 만들어요.');
    return T.make(id).then((r) => 줄새로(id, r && r.ok ? '만들었어요 — 상태 ' + (이름[r.state] || r.state) : '만들지 못했어요: ' + ((r && r.message) || '')));
  }
  function 누름(id, act, a, b) {
    const s = 원문(a.intake) || {};
    if (act === 'make') { 만들기(id, b); return; }
    if (act === 'release') {
      if (!confirm('이 보고서를 손님에게 열까요?\n\n열린 뒤 손님이 한 번 띄우면 다시 만들 수 없어요.')) return;
      b.disabled = true;
      T.adminRelease(id).then((r) => 줄새로(id, r && r.ok ? '내보냈어요 — 손님 「내 보고서」에서 열려요.' : '내보내지 못했어요: ' + 이유말(r)));
      return;
    }
    if (act === 'redo') {
      if (!confirm('지금 판을 「앞 판」으로 옮기고 새로 만들까요?\n\nAI 를 한 번 더 불러요.')) return;
      b.disabled = true;
      T.adminRedo(id).then((r) => { if (r && r.ok) return 만들기(id); 알림(id, '다시 만들지 못했어요: ' + 이유말(r), true); b.disabled = false; });
      return;
    }
    if (act === 'mail') {
      const 주소 = 'https://chaeksa.kr/' + T.주소(id);
      const 본문 = a.source === 'manual'
        ? ['안녕하세요, 책사입니다.', '', '신청하신 출산택일 보고서를 보내 드려요. 아래에 붙여 드려요.', '', '문의 — ' + 문의]
        : ['안녕하세요, 책사입니다.', '', '신청하신 출산택일 보고서가 준비됐어요.', '결제하신 카카오 계정으로 로그인하면 아래 주소에서 보실 수 있어요.', 주소, '', '출산택일 탭 「내 보고서」에서도 열려요.', '', '문의 — ' + 문의];
      location.href = 'mailto:' + encodeURIComponent(s.mail).replace(/%40/g, '@') + '?subject=' + encodeURIComponent('[책사] 출산택일 보고서') + '&body=' + encodeURIComponent(본문.join('\r\n'));
      return;
    }
    if (act === 'copy') {
      const 글 = V.글로(a.report);
      const 됨 = () => 알림(id, '메일용 글을 복사했어요. 명식 카드는 그림이라 따로 붙여 주세요(「손님 눈으로 보기」에서 갈무리).');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(글).then(됨, () => 손복사(id, 글));
      else 손복사(id, 글);
      return;
    }
    if (act === 'note') { 메모칸(id, a); return; }
    if (act === 'intake') { 고치기칸(id, a); }
  }
  function 판칸(id) { const el = 줄칸(id); const p = el && el.querySelector('[data-pane]'); if (p) p.hidden = false; return p; }
  function 손복사(id, 글) {
    const p = 판칸(id); if (!p) return;
    p.innerHTML = '<p class="hint">복사가 막혀서 아래에 펼쳤어요 — 전부 골라 복사해 주세요.</p><textarea class="adm-copy" readonly></textarea>';
    const t = p.querySelector('textarea'); t.value = 글; t.focus(); t.select();
  }
  function 메모칸(id, a) {
    const p = 판칸(id); if (!p) return;
    p.innerHTML = '<label class="hint">틀린 곳 · 고칠 곳을 적어 두면 문장 틀 · 프롬프트를 고칠 때 읽어요(비우고 저장하면 지워요).</label>'
      + '<textarea class="adm-note" maxlength="4000"></textarea><button type="button" class="btn small">메모 저장</button>';
    const t = p.querySelector('textarea'); t.value = a.note || '';
    p.querySelector('button').onclick = () => T.adminNote(id, t.value).then((r) => 줄새로(id, r && r.ok ? '메모를 저장했어요.' : '저장하지 못했어요: ' + 이유말(r)));
  }
  /** 신청서 칸을 그 자리에 펼친다 — 손님 신청서와 같은 칸 · 같은 「이렇게 읽었어요」. */
  function 신청서틀(p, 채울, 단추글, 메모) {
    p.innerHTML = '<form class="intake" novalidate>' + F.틀()
      + (메모 ? '<label for="admManNote">메모(사장님만 봐요 — 네이버폼 접수 번호 등)</label><textarea id="admManNote" maxlength="4000"></textarea>' : '')
      + '<button type="submit" class="send">' + esc(단추글) + '</button><p class="msg"></p></form>';
    const f = p.querySelector('form');
    F.채우기(f, 채울 || {});
    F.읽기켜기(f);
    return f;
  }
  function 막힘말(d) {
    const r = F.읽기(d); if (!r) return [];
    return r.줄.filter((z) => z.막힘).map((z) => z.이름 + ' — ' + z.말);
  }
  function 고치기칸(id, a) {
    const p = 판칸(id); if (!p) return;
    const 옛 = 원문(a.intake) || {};
    const f = 신청서틀(p, 옛, '고친 신청서 저장');
    f.onsubmit = (e) => {
      e.preventDefault();
      const d = F.값(f), 막 = 막힘말(d), msg = f.querySelector('.msg');
      if (막.length && !confirm('아직 못 읽는 칸이 있어요.\n\n' + 막.join('\n') + '\n\n그래도 저장할까요? (만들면 「막힘」으로 남아요)')) return;
      if (옛.consent) d.consent = 옛.consent;
      msg.textContent = '저장하는 중…';
      T.adminIntake(id, F.신청서(d)).then((r) => 줄새로(id, r && r.ok
        ? '신청서를 고쳤어요(주문 원본은 그대로). ' + (a.report ? '「다시 만들기」를 눌러 새로 만들어 주세요.' : '「만들기」를 눌러 주세요.')
        : '저장하지 못했어요: ' + 이유말(r)));
    };
  }
  function 대신넣기() {
    const p = $('admManualBox'); if (!p) return;
    if (!p.hidden) { p.hidden = true; return; }
    p.hidden = false;
    const f = 신청서틀(p, {}, '수기 줄 만들고 보고서 만들기', true);
    p.insertAdjacentHTML('afterbegin', '<p class="hint">네이버폼으로 들어온 신청을 같은 칸에 옮겨 적어요. 같은 엔진 · 같은 누락 검사로 만들고, 손님에게는 열리지 않아요 — 확인한 뒤 「메일용 글 복사」로 메일에 붙여요.</p>');
    f.onsubmit = (e) => {
      e.preventDefault();
      const d = F.값(f), 막 = 막힘말(d), msg = f.querySelector('.msg');
      if (!d.range || !d.place) { msg.textContent = '출산 예정 기간과 태어날 지역은 꼭 적어 주세요.'; return; }
      if (막.length && !confirm('아직 못 읽는 칸이 있어요.\n\n' + 막.join('\n') + '\n\n그래도 넣을까요? (만들면 「막힘」으로 남아요)')) return;
      const it = F.신청서(d); it.출처 = 'naverform';
      msg.textContent = '수기 줄을 만드는 중…';
      T.adminManual(it, (f.querySelector('#admManNote') || {}).value || '').then((r) => {
        if (!(r && r.ok && r.id)) { msg.textContent = '넣지 못했어요: ' + 이유말(r); return; }
        p.hidden = true; p.innerHTML = '';
        if (r.row) 줄들.unshift(r.row);
        펼침.add(r.id); 지금 = ''; 나누기그리기(); 목록그리기();
        만들기(r.id);
      });
    };
  }

  /* ── 시작 ─────────────────────────────────────────────── */
  function 목록() {
    const box = $('admRows'); if (box) box.innerHTML = '<p class="hint">불러오는 중…</p>';
    return T.adminList(null).then((r) => {
      if (!(r && r.ok)) { if (box) box.innerHTML = '<p class="adm-msg bad">' + esc(이유말(r)) + '</p>'; return; }
      스위치 = { auto: !!r.auto, released: r.released || 0 };
      줄들 = Array.isArray(r.rows) ? r.rows : [];
      스위치그리기(); 나누기그리기(); 목록그리기();
    });
  }
  function 시작() {
    const gate = $('admGate'), C = global.ChaeksaCloud;
    if (!T || !F || !V) { if (gate) gate.innerHTML = '<p class="adm-msg bad">화면 파일을 불러오지 못했어요. 새로고침해 주세요.</p>'; return; }
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
    $('admManual').onclick = 대신넣기;
    목록();
  }

  global.ChaeksaTaekilAdmin = { 시작, 줄로 };
})(window);
