/* 출산택일 보고서 그리기 — taekil-report.html(손님 「내 보고서」) · taekil-admin.html(사장님 목록)이 같이 쓴다(10-02 설계서 ⑤).
 *
 * 보고서 본문(report)은 비공개 서버(/api/taekil-report)가 엔진 · 고르기 · 누락 검사를 거쳐 보관한 것 그대로다. 여기는 **그리기만** 한다 —
 * 판정 · 고르기 · 차례 · 문장 틀은 이 파일에 없다(공개 저장소에 두지 않는다). 칸 꼴은 비공개 lib/taekil-report.js 머리 주석과 같다:
 *   { v, order: [칸 id…], card: { place, g }, cards: [{ slot, label }], <칸 id>: { head, body: [노드…], items?, 접힘?, 셈? } }
 *   노드 k — p(글) · b(굵은 줄) · list · read(이렇게 읽었어요 한 칸) · card(명식 카드 자리) · han(원문 · 책사 한문 풀이 + 뜻) · pillars(명식 한자) · fold(접힘) · mb(자미두수 명반 — 10-22)
 *   p · b 의 작게(글) · list 의 작게(items 와 같은 길이의 배열) — 원문 · 책 이름 · 근거(한자)를 줄 끝 작은 글자로(10-22 사장님 「우리문장~ (원문 작게)」)
 *   모르는 노드 · 모르는 칸은 그리지 않는다. 글은 모두 이스케이프한다.
 * 접어 두는 것(설계서 ⑤): 「날짜별로 전부」 · 「어떻게 골랐나」(칸의 접힘) · 덩어리 속 대운 목록.
 * 명식 카드는 이 자리에서 그린다(myeongsik-card.js + 시뮬레이터 엔진 사슬) — 서버는 그림을 못 찍는다.
 * 결과 화면에 반응 단추(맞아요 · 아니에요)는 두지 않는다(10-02).
 * 근거는 부록으로(10-05 사장님 「부록으로 보내는 게 맞다 — PDF도 소책자도」): 원문(han) · 명식 한자(pillars) · AI 근거 목록(part 'AI근거')은
 * 본문 자리에 「원문 · 근거 → 부록 N」 한 줄만 남기고 보고서 끝 「부록 — 원문과 근거」에 번호 차례로 모은다. 본문이 끊기지 않게.
 */
(function (global) {
  'use strict';

  /** 칸 차례 — report.order 가 없을 때만 쓴다(옛 판 대비). 정본은 비공개 서버의 칸차례다. */
  const 차례 = ['greet', 'readback', 'steps', 'verdict', 'lenses', 'asked', 'block', 'ask', 'summary', 'excluded', 'others', 'method', 'alldays', 'clock', 'close', 'receipt'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const 칸이름 = (id) => /^[a-z][a-z0-9_]{0,39}$/.test(String(id || ''));
  const 글들 = (xs) => (Array.isArray(xs) ? xs : []).filter((x) => typeof x === 'string' || typeof x === 'number');

  const 작게 = (s) => (s != null && String(s).trim() ? ' <small class="tkr-won">(' + esc(s) + ')</small>' : '');
  /** 자미두수 명반 4×4 — 이름표는 서버가 한글로 만들어 보낸다(lib/myeongban-ko). 여기는 자리만 놓는다 */
  function 명반(n) {
    const 칸들 = Array.isArray(n.칸) ? n.칸 : [], 자리 = Array.isArray(n.자리) ? n.자리 : ['巳', '午', '未', '申', '辰', null, '酉', '卯', '戌', '寅', '丑', '子', '亥'];
    const 칸 = (지) => {
      const c = 칸들.find((x) => x && x.지 === 지);
      if (!c) return '<div class="tkr-mb-c"></div>';
      const 별 = (s) => '<span class="tkr-mb-s">' + esc(s.이름) + (s.화 ? '<b>' + esc(s.화) + '</b>' : '') + (s.밝기 ? '<i>' + esc(s.밝기) + '</i>' : '') + '</span>';   // 별마다 한 줄 · 밝기는 그 아래(10-22 폰에서 끊김)
      return '<div class="tkr-mb-c' + (c.나 ? ' tkr-mb-me' : '') + '"><div class="tkr-mb-h"><span>' + esc(c.궁) + (c.몸 ? ' · 신궁' : '') + '</span><em>' + esc(c.쉬운) + '</em><small>' + esc(c.지말) + '</small></div>'
        + '<div class="tkr-mb-m">' + ((c.주성 || []).length ? c.주성.map(별).join('') : '<span class="tkr-mb-e">중심 별 없음</span>') + '</div>'
        + ((c.보조 || []).length ? '<div class="tkr-mb-a">' + c.보조.map((s) => esc(s.이름) + (s.화 ? '<b>' + esc(s.화) + '</b>' : '')).join(' · ') + '</div>' : '')
        + (c.대한 ? '<div class="tkr-mb-d">' + esc(c.대한) + '</div>' : '') + '</div>';
    };
    const 가운데 = '<div class="tkr-mb-ctr">' + (Array.isArray(n.가운데) ? n.가운데 : []).map((t, i) => (i ? '<p>' : '<p class="tkr-mb-t">') + esc(t) + '</p>').join('') + '</div>';
    return '<figure class="tkr-mb">' + (n.머리 ? '<figcaption class="tkr-b">' + esc(n.머리) + '</figcaption>' : '')
      + '<div class="tkr-mb-g">' + 자리.map((지) => (지 ? 칸(지) : 가운데)).join('') + '</div>'
      + (n.풀이 ? '<p class="tkr-mb-cap">' + esc(n.풀이) + 작게(n.작게) + '</p>' : '') + '</figure>';
  }
  /** 노드 하나 → html */
  function 노드(n, rep) {
    if (!n || typeof n !== 'object') return '';
    switch (n.k) {
      case 'p': return '<p>' + esc(n.t) + 작게(n.작게) + '</p>';
      case 'b': return '<p class="tkr-b">' + esc(n.t) + 작게(n.작게) + '</p>';
      case 'list': { const 작 = Array.isArray(n.작게) ? n.작게 : []; return '<ul class="tkr-ul">' + (Array.isArray(n.items) ? n.items : []).map((t, i) => (typeof t === 'string' || typeof t === 'number') ? '<li>' + esc(t) + 작게(작[i]) + '</li>' : '').join('') + '</ul>'; }
      case 'mb': return 명반(n);
      case 'read': return '<div class="tkr-read' + (n.못읽음 ? ' bad' : '') + '"><span class="tkr-read-k">' + esc(n.이름) + '</span><span class="tkr-read-v">' + esc(n.말) + '</span></div>';
      case 'card': {
        const i = Number(n.i), c = Number.isInteger(i) && rep && Array.isArray(rep.cards) ? rep.cards[i] : null;
        return '<div class="tkr-cardslot" data-card="' + (Number.isInteger(i) ? i : -1) + '"><p class="tkr-cardwait">사주 여덟 글자 카드(명식) — ' + esc(c ? c.label : '') + '</p></div>';
      }
      case 'han': return '<figure class="tkr-han"><figcaption>' + esc(n.고전) + ' · ' + esc(n.꼴) + '</figcaption>'
        + '<p class="tkr-han-t" lang="zh-Hant">' + esc(n.글) + '</p><p class="tkr-han-m">' + esc(n.뜻) + '</p></figure>';
      case 'pillars': return '<div class="tkr-pil"><p class="tkr-pil-h" lang="zh-Hant">' + esc(n.한자) + '</p><p>' + esc(n.읽기) + '</p>'
        + ((Array.isArray(n.글자) && n.글자.length) ? '<details class="tkr-fold"><summary>글자마다 뜻 보기</summary><ul class="tkr-ul">'
          + n.글자.map((x) => '<li>' + esc(x && x.말) + '</li>').join('') + '</ul></details>' : '') + '</div>';
      case 'rarity': {   // 10-24 사장님 「얼마나 좋고 얼마나 귀한 자리인지 보여 줘야」 — 피라미드 · 백분위 · 빈도(모양 · 글은 astra DES-0003, 수는 조립기가 넣는다)
        const 층 = (Array.isArray(n.층) ? n.층 : []).map((L, i) => '<li' + (L.나 ? ' class="tkr-rarity-top"' : '') + '>' + (L.나 ? '<span class="tkr-rarity-marker">' + esc(n.표시 || '이 아이의 자리') + '</span>' : '')
          + '<strong class="tkr-rarity-name">' + esc(L.이름) + '</strong><span class="tkr-rarity-count">' + esc(L.수) + '자리 · <b>' + esc(L.비율) + '</b></span>'
          + (L.상세 ? '<span class="tkr-rarity-detail">' + esc(L.상세) + '</span>' : '') + '</li>').join('');
        return '<section class="tkr-rarity"><p class="tkr-rarity-result"><strong>' + esc(n.결론앞) + ' <span>' + esc(n.결론강조) + '</span></strong></p>'
          + '<figure class="tkr-rarity-figure"><ol class="tkr-rarity-layers">' + 층 + '</ol>' + (n.캡션 ? '<figcaption>' + esc(n.캡션) + '</figcaption>' : '') + '</figure>'
          + (n.빈도 ? '<p class="tkr-rarity-frequency">' + esc(n.빈도) + '</p>' : '')
          + (Array.isArray(n.노트) ? n.노트.map(t => '<p class="tkr-rarity-note">' + esc(t) + '</p>').join('') : '') + '</section>';
      }
      case 'fold': return '<details class="tkr-fold"><summary>' + esc(n.head) + '</summary>' + 몸(n.body, rep, n.head) + '</details>';
      default: return '';
    }
  }
  /** 근거 노드인가 — 부록으로 보낼 것 */
  const 근거인가 = (n) => !!n && (n.k === 'han' || n.k === 'pillars' || (n.k === 'list' && n.part === 'AI근거'));
  let 부록 = null;   // 그리기 한 번 동안만 쓰는 부록 모음 [{ 곳, html }]
  /** 노드 목록 → html. 덩어리 속 대운(part '대운')은 첫 줄만 펴 두고 나머지(목록)를 접는다. 이어진 근거 노드는 한 번호로 부록에 보낸다. */
  function 몸(body, rep, 곳) {
    const xs = Array.isArray(body) ? body : [];
    let out = '';
    for (let i = 0; i < xs.length; i++) {
      const n = xs[i];
      if (부록 && 근거인가(n)) {
        let h = 노드(n, rep);
        while (i + 1 < xs.length && 근거인가(xs[i + 1])) h += 노드(xs[++i], rep);
        부록.push({ 곳: 곳 || '', html: h });
        out += rep && rep.layout === 'decision-1'
          ? '<p class="tkr-ref"><a href="#" data-tkr-appendix="' + 부록.length + '">원문 · 근거 → 부록 ' + 부록.length + '</a></p>'
          : '<p class="tkr-ref">원문 · 근거 → 부록 ' + 부록.length + '</p>';
        continue;
      }
      if (n && n.part === '대운') {
        out += 노드(n, rep);
        const 묶음 = [];
        while (i + 1 < xs.length && xs[i + 1] && xs[i + 1].part === '대운') 묶음.push(xs[++i]);
        if (묶음.length) out += '<details class="tkr-fold"><summary>운의 변화(대운) 펼쳐 보기</summary>' + 묶음.map((m) => 노드(m, rep)).join('') + '</details>';
        continue;
      }
      out += 노드(n, rep);
    }
    return out;
  }
  /** 칸 하나 → html */
  function 칸(id, s, rep) {
    if (!s || typeof s !== 'object') return '';
    let 속 = 몸(s.body, rep, s.head);
    if (Array.isArray(s.items)) 속 += s.items.map((it) => '<article class="tkr-item"' + (it && it.번호 != null ? ' data-no="' + esc(it.번호) + '"' : '') + '>'
      + (it && it.head ? '<h3>' + esc(it.head) + '</h3>' : '') + 몸(it && it.body, rep, it && it.head) + '</article>').join('');
    if (s.접힘) return '<details class="tkr-sec tkr-foldsec" data-sec="' + esc(id) + '"><summary class="tkr-h">' + esc(s.head || '') + '</summary>' + 속 + '</details>';
    return '<section class="tkr-sec" data-sec="' + esc(id) + '">' + (s.head ? '<h2 class="tkr-h">' + esc(s.head) + '</h2>' : '') + 속 + '</section>';
  }
  /** decision-1만 사용하는 표시 구조. 노드와 문장은 복사하거나 다시 계산하지 않는다. */
  const 상세부분 = new Set(['사주', '명식', '궁통', '자평', '적천수', '가족', '대운', '관점', 'AI근거']);
  const 접을칸 = new Set(['readback', 'steps', 'rarity', 'lenses', 'asked', 'ask', 'ziwei', 'crosscheck', 'excluded', 'others', 'method', 'alldays']);
  const 후보부분 = (it) => {
    const xs = Array.isArray(it && it.body) ? it.body : [];
    return {
      cards: xs.filter(n => n && n.k === 'card'),
      main: xs.filter(n => n && n.k !== 'card' && !상세부분.has(n.part)),
      detail: xs.filter(n => n && n.k !== 'card' && 상세부분.has(n.part))
    };
  };
  function 결정후보(it, rep) {
    if (!it || typeof it !== 'object') return '';
    const parts = 후보부분(it);
    return '<article class="tkr-item tkr-decision-item"' + (it.번호 != null ? ' data-no="' + esc(it.번호) + '"' : '') + '>'
      + (it.head ? '<h3>' + esc(it.head) + '</h3>' : '')
      + 몸(parts.cards, rep, it.head) + '<div class="tkr-decision-main">' + 몸(parts.main, rep, it.head) + '</div>'
      + (parts.detail.length ? '<details class="tkr-fold tkr-decision-detail"><summary>상세 풀이</summary><div class="tkr-detail-body">' + 몸(parts.detail, rep, it.head) + '</div></details>' : '')
      + '</article>';
  }
  function 결정첫줄(n) {
    const chunks = String(n.t == null ? '' : n.t).split(' · ');
    const value = chunks.length >= 3
      ? '<span class="tkr-choice-label">' + esc(chunks[0]) + '</span><strong>' + esc(chunks[1]) + '</strong><span class="tkr-choice-clock">' + esc(chunks[2]) + '</span>'
        + (chunks.length > 3 ? '<span class="tkr-choice-tag">' + chunks.slice(3).map(esc).join(' · ') + '</span>' : '')
      : '<strong>' + esc(n.t) + '</strong>';
    return '<div class="tkr-primary-date">' + value + 작게(n.작게) + '</div>';
  }
  function 결정비교(body, rep, head) {
    let content = '', group = [], candidate = false;
    const flush = () => {
      if (!group.length) return;
      const html = 몸(group, rep, head);
      content += candidate ? '<article class="tkr-compare-card">' + html + '</article>' : html;
      group = [];
    };
    body.forEach(node => {
      if (node && node.k === 'b' && /^\d+번 · /.test(String(node.t || ''))) {
        flush(); candidate = true;
      }
      group.push(node);
    });
    flush(); return content;
  }
  function 결정칸(id, section, rep) {
    if (!section || typeof section !== 'object') return '';
    const body = Array.isArray(section.body) ? section.body : [];
    let content;
    if (id === 'verdict') {
      const first = body.findIndex(n => n && n.k === 'b');
      content = first < 0 ? 몸(body, rep, section.head)
        : 몸(body.slice(0, first), rep, section.head) + 결정첫줄(body[first]) + 몸(body.slice(first + 1), rep, section.head);
    } else if (id === 'summary') content = 결정비교(body, rep, section.head);
    else content = 몸(body, rep, section.head);
    if (Array.isArray(section.items)) content += section.items.map(it => id === 'block' ? 결정후보(it, rep)
      : '<article class="tkr-item"' + (it && it.번호 != null ? ' data-no="' + esc(it.번호) + '"' : '') + '>' + (it && it.head ? '<h3>' + esc(it.head) + '</h3>' : '') + 몸(it && it.body, rep, it && it.head) + '</article>').join('');
    const classes = 'tkr-sec' + (id === 'verdict' ? ' tkr-decision-verdict' : id === 'summary' ? ' tkr-decision-comparison' : '');
    if (section.접힘 || 접을칸.has(id)) return '<details class="' + classes + ' tkr-foldsec" data-sec="' + esc(id) + '"><summary class="tkr-h">' + esc(id === 'crosscheck' ? '상세 자미두수 대조' : section.head || '') + '</summary><div class="tkr-section-body">' + (id === 'crosscheck' && section.head ? '<p class="tkr-b">' + esc(section.head) + '</p>' : '') + content + '</div></details>';
    return '<section class="' + classes + '" data-sec="' + esc(id) + '">' + (section.head ? '<h2 class="tkr-h">' + esc(section.head) + '</h2>' : '') + content + '</section>';
  }
  function 결정그리기(rep, order) {
    부록 = [];
    const end = order.filter(id => id === 'close' || id === 'receipt'), main = order.filter(id => !end.includes(id));
    const content = main.map(id => 결정칸(id, rep[id], rep)).join(''), closing = end.map(id => 결정칸(id, rep[id], rep)).join('');
    const appendix = 부록; 부록 = null;
    const sources = appendix.length ? '<details class="tkr-sec tkr-appx tkr-foldsec" data-sec="appendix"><summary class="tkr-h">부록 — 원문과 근거 · ' + appendix.length + '개</summary><div class="tkr-appendix-body">'
      + appendix.map((x, i) => '<div class="tkr-appx-i" data-appendix="' + (i + 1) + '" tabindex="-1"><p class="tkr-appx-h">부록 ' + (i + 1) + (x.곳 ? ' · ' + esc(x.곳) : '') + '</p>' + x.html + '</div>').join('') + '</div></details>' : '';
    return '<div class="tkr tkr-decision">' + content + sources + closing + '</div>';
  }
  // details를 CSS로만 보이게 하지 않는다. 인쇄 직전에 실제로 열고 끝나면 이전 상태로 돌린다.
  let 인쇄전접힘 = null;
  function 인쇄펼침() {
    if (인쇄전접힘 || typeof document === 'undefined') return;
    인쇄전접힘 = Array.from(document.querySelectorAll('.tkr-decision details')).filter(el => !el.open);
    인쇄전접힘.forEach(el => { el.open = true; });
  }
  function 인쇄복원() {
    if (!인쇄전접힘) return;
    인쇄전접힘.forEach(el => { if (el.isConnected) el.open = false; }); 인쇄전접힘 = null;
  }
  if (global.addEventListener) {
    global.addEventListener('beforeprint', 인쇄펼침);
    global.addEventListener('afterprint', 인쇄복원);
    if (global.matchMedia) {
      const media = global.matchMedia('print');
      const change = event => { if (event.matches) 인쇄펼침(); else 인쇄복원(); };
      if (media.addEventListener) media.addEventListener('change', change);
      else if (media.addListener) media.addListener(change);
    }
  }
  if (typeof document !== 'undefined') document.addEventListener('click', event => {
    const link = event.target && event.target.closest ? event.target.closest('.tkr-decision [data-tkr-appendix]') : null;
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const root = link.closest('.tkr-decision'), target = root.querySelector('[data-appendix="' + link.dataset.tkrAppendix + '"]');
    if (!target) return;
    event.preventDefault();
    let parent = target.parentElement;
    while (parent && parent !== root) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
    target.scrollIntoView({ block: 'start' }); target.focus({ preventScroll: true });
  });

  /** 보고서 한 벌 → html(카드 자리는 비어 있다 — 카드채우기로 채운다) */
  function 그리기(rep) {
    if (!rep || typeof rep !== 'object') return '';
    const order = (Array.isArray(rep.order) && rep.order.length ? rep.order : 차례).filter(칸이름);
    if (rep.layout === 'decision-1') return 결정그리기(rep, order);
    부록 = [];
    const 끝 = order.filter((id) => id === 'close' || id === 'receipt'), 앞 = order.filter((id) => !끝.includes(id));
    const 본문 = 앞.map((id) => 칸(id, rep[id], rep)).join(''), 맺 = 끝.map((id) => 칸(id, rep[id], rep)).join('');
    const 모음 = 부록; 부록 = null;
    const 부록칸 = 모음.length ? '<section class="tkr-sec tkr-appx" data-sec="appendix"><h2 class="tkr-h">부록 — 원문과 근거</h2>'
      + 모음.map((x, i) => '<div class="tkr-appx-i"><p class="tkr-appx-h">부록 ' + (i + 1) + (x.곳 ? ' · ' + esc(x.곳) : '') + '</p>' + x.html + '</div>').join('') + '</section>' : '';
    return '<div class="tkr">' + 본문 + 부록칸 + 맺 + '</div>';
  }

  /** 명식 카드 자리를 채운다 — 시뮬레이터 엔진 사슬을 늦게 싣고(쪽의 template#tkChain) myeongsik-card.js 로 그린다. 못 그리면 이름표만 남긴다. */
  async function 카드채우기(root, rep) {
    const 자리 = root ? Array.from(root.querySelectorAll('[data-card]')) : [];
    if (!자리.length) return 0;
    const T = global.ChaeksaPay && global.ChaeksaPay.taekil, MC = global.ChaeksaMyeongsikCard;
    let 실림 = false;
    try { 실림 = !!(T && T.사슬싣기 && await T.사슬싣기()); } catch (e) { 실림 = false; }
    if (MC && MC.꾸밈) MC.꾸밈('msc-');
    let n = 0;
    자리.forEach((el) => {
      const c = (rep && Array.isArray(rep.cards) ? rep.cards : [])[Number(el.dataset.card)];
      let h = null;
      if (실림 && MC && c) { try { h = MC.html({ slot: c.slot, label: c.label, place: rep.card && rep.card.place, g: rep.card && rep.card.g, pre: 'msc-', availableWindow: c.availableWindow }); } catch (e) { h = null; } }
      if (h) { el.innerHTML = h; n++; } else el.innerHTML = '<p class="tkr-cardwait">사주 여덟 글자 카드(명식)를 불러오지 못했어요' + (c ? ' — ' + esc(c.label) : '') + '. 새로고침해 주세요.</p>';
    });
    return n;
  }

  /** 보고서 한 벌 → 메일에 붙일 글(사장님 목록 「메일용 글 복사」 — 메일 · 전화로 받은 수기 줄). 카드는 그림이라 이름표만 남는다. */
  function 글로(rep) {
    if (!rep || typeof rep !== 'object') return '';
    const 줄 = [], decision = rep.layout === 'decision-1', appendix = [];
    const 노드글 = (n) => {
      if (!n || typeof n !== 'object') return;
      const 끝 = (s) => (s != null && String(s).trim() ? ' (' + s + ')' : '');
      if (n.k === 'p' || n.k === 'b') 줄.push(String(n.t || '') + 끝(n.작게));
      else if (n.k === 'list') (Array.isArray(n.items) ? n.items : []).forEach((t, i) => { if (typeof t === 'string' || typeof t === 'number') 줄.push('· ' + t + 끝(Array.isArray(n.작게) ? n.작게[i] : '')); });
      else if (n.k === 'mb') { if (n.머리) 줄.push(String(n.머리)); (n.가운데 || []).forEach((t) => 줄.push('  ' + t));
        (n.칸 || []).forEach((c) => 줄.push('· ' + c.궁 + (c.쉬운 ? '(' + c.쉬운 + ')' : '') + ' — ' + ((c.주성 || []).map((s) => s.이름 + (s.밝기 ? ' ' + s.밝기 : '') + (s.화 ? ' ' + s.화 : '')).join(' · ') || '중심 별 없음')
          + ((c.보조 || []).length ? ' / ' + c.보조.map((s) => s.이름 + (s.화 ? ' ' + s.화 : '')).join(' · ') : '') + (c.대한 ? ' · ' + c.대한 : ''))); }
      else if (n.k === 'read') 줄.push('· ' + n.이름 + ' — ' + n.말);
      else if (n.k === 'card') { const c = (rep.cards || [])[Number(n.i)]; 줄.push('(사주 여덟 글자 카드(명식)' + (c ? ' — ' + c.label : '') + ')'); }
      else if (n.k === 'han') { 줄.push(n.고전 + ' ' + n.꼴 + ' — ' + n.글); 줄.push('  ' + n.뜻); }
      else if (n.k === 'pillars') { 줄.push(String(n.한자 || '')); 줄.push(String(n.읽기 || '')); (n.글자 || []).forEach((x) => 줄.push('· ' + (x && x.말))); }
      else if (n.k === 'fold') { 줄.push(String(n.head || '')); if (decision) 본문글(n.body, n.head); else (n.body || []).forEach(노드글); }
      else if (decision && n.k === 'rarity') {
        줄.push(String(n.결론앞 || '') + ' ' + String(n.결론강조 || ''));
        (Array.isArray(n.층) ? n.층 : []).forEach(x => { 줄.push('· ' + (x.나 ? (n.표시 || '이 아이의 자리') + ' — ' : '') + String(x.이름 || '') + ' ' + String(x.수 == null ? '' : x.수) + '자리 · ' + String(x.비율 || '')); if (x.상세) 줄.push(String(x.상세)); });
        if (n.캡션) 줄.push(String(n.캡션)); if (n.빈도) 줄.push(String(n.빈도)); (n.노트 || []).forEach(x => 줄.push(String(x)));
      }
    };
    const 본문글 = (body, where) => {
      const xs = Array.isArray(body) ? body : [];
      for (let i = 0; i < xs.length; i++) {
        if (decision && 근거인가(xs[i])) {
          const group = [xs[i]];
          while (i + 1 < xs.length && 근거인가(xs[i + 1])) group.push(xs[++i]);
          appendix.push({ where, body: group }); 줄.push('원문 · 근거 → 부록 ' + appendix.length);
        } else 노드글(xs[i]);
      }
    };
    const order = (Array.isArray(rep.order) && rep.order.length ? rep.order : 차례).filter(칸이름);
    const 칸글 = (id) => {
      const section = rep[id]; if (!section || typeof section !== 'object') return;
      if (줄.length) 줄.push('');
      if (section.head) 줄.push('[' + section.head + ']');
      본문글(section.body, section.head);
      (Array.isArray(section.items) ? section.items : []).forEach(it => {
        if (!it || typeof it !== 'object') return;
        줄.push(''); if (it.head) 줄.push(String(it.head));
        if (decision && id === 'block') {
          const parts = 후보부분(it);
          본문글(parts.cards, it.head); 본문글(parts.main, it.head);
          if (parts.detail.length) { 줄.push('[상세 풀이 — ' + String(it.head || '') + ']'); 본문글(parts.detail, it.head); }
        } else 본문글(it.body, it.head);
      });
    };
    if (decision) {
      줄.push('읽는 순서 — 추천 날짜와 시간 → 후보 비교 → 후보별 알아 둘 것 → 병원에 전할 시간.');
      줄.push('후보별 사주와 고전 설명은 「상세 풀이」에서, 한자 원문과 뜻은 맨 뒤 「부록 — 원문과 근거」에서 찾을 수 있습니다.');
      const end = order.filter(id => id === 'close' || id === 'receipt');
      order.filter(id => !end.includes(id)).forEach(칸글);
      if (appendix.length) {
        줄.push('', '[부록 — 원문과 근거]');
        appendix.forEach((item, i) => { 줄.push('', '부록 ' + (i + 1) + (item.where ? ' · ' + item.where : '')); item.body.forEach(노드글); });
      }
      end.forEach(칸글);
    } else order.forEach(칸글);
    return 줄.join('\n');
  }

  /** 보고서 한 벌 → 네이버 블로그 업로드용 본문 html(10-04 사장님 「네이버블로그 업로드용 하나 · 고객 전달용 보고서 하나」).
   *  옛 상담 답글 붙여넣기 틀(marketing/cards/상담-…/붙여넣기.html)의 #doc 꼴. 개인정보 빼기(09-25 「블로그에도 게시 — 개인정보는 드러나지 않게」):
   *  「이렇게 읽었어요」 · 「궁금하다고 하신 것」(손님 사연) · 결제 칸 · 「그 밖에」 · 「날짜별로 전부」 · 관점 칸은 싣지 않고, 목록의 「원하시는 방향」 줄 · 명식 한자 줄(카드 그림이 대신)도 뺀다.
   *  그림(i, card) → 그림 주소(chaeksa.kr/cards/…) 또는 null — null 이면 「[그림 N]」 자리 줄을 둔다(사장님이 받은 그림을 그 자리에 놓는다). */
  const 블로그칸 = ['greet', 'steps', 'verdict', 'asked', 'block', 'summary', 'method', 'clock', 'close'];
  function 블로그글(rep, 그림) {
    if (!rep || typeof rep !== 'object') return '';
    const 번 = (i) => String(i + 1).padStart(2, '0');
    const 노드 = (n) => {
      if (!n || typeof n !== 'object') return '';
      if (n.k === 'p') return '<p>' + esc(n.t) + 작게(n.작게) + '</p>';
      if (n.k === 'b') return '<p><b>' + esc(n.t) + '</b>' + 작게(n.작게) + '</p>';
      if (n.k === 'list') { const xs = 글들(n.items).filter((t) => !/^원하시는 방향/.test(String(t))); return xs.length ? '<p>' + xs.map(esc).join('<br>') + '</p>' : ''; }
      if (n.k === 'han') return '<blockquote><p>' + esc(n.고전 + ' ' + n.꼴 + ' — ' + n.글) + '<br>' + esc(n.뜻) + '</p></blockquote>';
      if (n.k === 'fold') return (n.head ? '<p><b>' + esc(n.head) + '</b></p>' : '') + (Array.isArray(n.body) ? n.body : []).map(노드).join('');
      if (n.k === 'card') {
        const i = Number(n.i), c = (Array.isArray(rep.cards) ? rep.cards : [])[i]; if (!c) return '';
        const 주소 = typeof 그림 === 'function' ? 그림(i, c) : null;
        return 주소 ? '<p class="card-img"><img src="' + esc(주소) + '" alt="' + esc(c.label) + ' 사주 여덟 글자(명식)" style="max-width:100%;height:auto"></p>'
          : '<p class="blog-pic">[그림 ' + (i + 1) + ' — ' + esc(c.label) + ' · ' + 번(i) + '.png 를 여기에]</p>';
      }
      return '';   // read · pillars · 모르는 노드는 싣지 않는다
    };
    const 칸 = (id) => {
      const s = rep[id]; if (!s || typeof s !== 'object') return '';
      let h = (s.head ? '<h3>' + esc(s.head) + '</h3>' : '') + (Array.isArray(s.body) ? s.body : []).map(노드).join('');
      (Array.isArray(s.items) ? s.items : []).forEach((it) => { h += '<hr>' + (it && it.head ? '<h3>' + esc(it.head) + '</h3>' : '') + ((it && it.body) || []).map(노드).join(''); });
      return h;
    };
    const order = (Array.isArray(rep.order) && rep.order.length ? rep.order : 차례).filter((id) => 블로그칸.includes(id));
    return order.map(칸).filter(Boolean).join('<hr>');
  }

  global.ChaeksaTaekilReport = { 차례, 그리기, 카드채우기, 글로, 블로그글, 블로그칸, esc };
})(window);
