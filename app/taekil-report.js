/* 출산택일 보고서 그리기 — taekil-report.html(손님 「내 보고서」) · taekil-admin.html(사장님 목록)이 같이 쓴다(10-02 설계서 ⑤).
 *
 * 보고서 본문(report)은 비공개 서버(/api/taekil-report)가 엔진 · 고르기 · 누락 검사를 거쳐 보관한 것 그대로다. 여기는 **그리기만** 한다 —
 * 판정 · 고르기 · 차례 · 문장 틀은 이 파일에 없다(공개 저장소에 두지 않는다). 칸 꼴은 비공개 lib/taekil-report.js 머리 주석과 같다:
 *   { v, order: [칸 id…], card: { place, g }, cards: [{ slot, label }], <칸 id>: { head, body: [노드…], items?, 접힘?, 셈? } }
 *   노드 k — p(글) · b(굵은 줄) · list · read(이렇게 읽었어요 한 칸) · card(명식 카드 자리) · han(원문 · 책사 한문 풀이 + 뜻) · pillars(명식 한자) · fold(접힘)
 *   모르는 노드 · 모르는 칸은 그리지 않는다. 글은 모두 이스케이프한다.
 * 접어 두는 것(설계서 ⑤): 「날짜별로 전부」 · 「어떻게 골랐나」(칸의 접힘) · 덩어리 속 대운 목록.
 * 명식 카드는 이 자리에서 그린다(myeongsik-card.js + 시뮬레이터 엔진 사슬) — 서버는 그림을 못 찍는다.
 * 결과 화면에 반응 단추(맞아요 · 아니에요)는 두지 않는다(10-02).
 */
(function (global) {
  'use strict';

  /** 칸 차례 — report.order 가 없을 때만 쓴다(옛 판 대비). 정본은 비공개 서버의 칸차례다. */
  const 차례 = ['greet', 'readback', 'verdict', 'lenses', 'asked', 'block', 'ask', 'summary', 'excluded', 'others', 'method', 'alldays', 'clock', 'close', 'receipt'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const 칸이름 = (id) => /^[a-z][a-z0-9_]{0,39}$/.test(String(id || ''));
  const 글들 = (xs) => (Array.isArray(xs) ? xs : []).filter((x) => typeof x === 'string' || typeof x === 'number');

  /** 노드 하나 → html */
  function 노드(n, rep) {
    if (!n || typeof n !== 'object') return '';
    switch (n.k) {
      case 'p': return '<p>' + esc(n.t) + '</p>';
      case 'b': return '<p class="tkr-b">' + esc(n.t) + '</p>';
      case 'list': return '<ul class="tkr-ul">' + 글들(n.items).map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>';
      case 'read': return '<div class="tkr-read' + (n.못읽음 ? ' bad' : '') + '"><span class="tkr-read-k">' + esc(n.이름) + '</span><span class="tkr-read-v">' + esc(n.말) + '</span></div>';
      case 'card': {
        const i = Number(n.i), c = Number.isInteger(i) && rep && Array.isArray(rep.cards) ? rep.cards[i] : null;
        return '<div class="tkr-cardslot" data-card="' + (Number.isInteger(i) ? i : -1) + '"><p class="tkr-cardwait">명식 카드 — ' + esc(c ? c.label : '') + '</p></div>';
      }
      case 'han': return '<figure class="tkr-han"><figcaption>' + esc(n.고전) + ' · ' + esc(n.꼴) + '</figcaption>'
        + '<p class="tkr-han-t" lang="zh-Hant">' + esc(n.글) + '</p><p class="tkr-han-m">' + esc(n.뜻) + '</p></figure>';
      case 'pillars': return '<div class="tkr-pil"><p class="tkr-pil-h" lang="zh-Hant">' + esc(n.한자) + '</p><p>' + esc(n.읽기) + '</p>'
        + ((Array.isArray(n.글자) && n.글자.length) ? '<details class="tkr-fold"><summary>글자마다 뜻 보기</summary><ul class="tkr-ul">'
          + n.글자.map((x) => '<li>' + esc(x && x.말) + '</li>').join('') + '</ul></details>' : '') + '</div>';
      case 'fold': return '<details class="tkr-fold"><summary>' + esc(n.head) + '</summary>' + 몸(n.body, rep) + '</details>';
      default: return '';
    }
  }
  /** 노드 목록 → html. 덩어리 속 대운(part '대운')은 첫 줄만 펴 두고 나머지(목록)를 접는다. */
  function 몸(body, rep) {
    const xs = Array.isArray(body) ? body : [];
    let out = '';
    for (let i = 0; i < xs.length; i++) {
      const n = xs[i];
      if (n && n.part === '대운') {
        out += 노드(n, rep);
        const 묶음 = [];
        while (i + 1 < xs.length && xs[i + 1] && xs[i + 1].part === '대운') 묶음.push(xs[++i]);
        if (묶음.length) out += '<details class="tkr-fold"><summary>대운 목록 펼쳐 보기</summary>' + 묶음.map((m) => 노드(m, rep)).join('') + '</details>';
        continue;
      }
      out += 노드(n, rep);
    }
    return out;
  }
  /** 칸 하나 → html */
  function 칸(id, s, rep) {
    if (!s || typeof s !== 'object') return '';
    let 속 = 몸(s.body, rep);
    if (Array.isArray(s.items)) 속 += s.items.map((it) => '<article class="tkr-item"' + (it && it.번호 != null ? ' data-no="' + esc(it.번호) + '"' : '') + '>'
      + (it && it.head ? '<h3>' + esc(it.head) + '</h3>' : '') + 몸(it && it.body, rep) + '</article>').join('');
    if (s.접힘) return '<details class="tkr-sec tkr-foldsec" data-sec="' + esc(id) + '"><summary class="tkr-h">' + esc(s.head || '') + '</summary>' + 속 + '</details>';
    return '<section class="tkr-sec" data-sec="' + esc(id) + '">' + (s.head ? '<h2 class="tkr-h">' + esc(s.head) + '</h2>' : '') + 속 + '</section>';
  }
  /** 보고서 한 벌 → html(카드 자리는 비어 있다 — 카드채우기로 채운다) */
  function 그리기(rep) {
    if (!rep || typeof rep !== 'object') return '';
    const order = (Array.isArray(rep.order) && rep.order.length ? rep.order : 차례).filter(칸이름);
    return '<div class="tkr">' + order.map((id) => 칸(id, rep[id], rep)).join('') + '</div>';
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
      if (실림 && MC && c) { try { h = MC.html({ slot: c.slot, label: c.label, place: rep.card && rep.card.place, g: rep.card && rep.card.g, pre: 'msc-' }); } catch (e) { h = null; } }
      if (h) { el.innerHTML = h; n++; } else el.innerHTML = '<p class="tkr-cardwait">명식 카드를 그리지 못했어요' + (c ? ' — ' + esc(c.label) : '') + '. 새로고침하면 다시 그려요.</p>';
    });
    return n;
  }

  /** 보고서 한 벌 → 메일에 붙일 글(사장님 목록 「메일용 글 복사」 — 메일 · 전화로 받은 수기 줄). 카드는 그림이라 이름표만 남는다. */
  function 글로(rep) {
    if (!rep || typeof rep !== 'object') return '';
    const 줄 = [];
    const 노드글 = (n) => {
      if (!n || typeof n !== 'object') return;
      if (n.k === 'p' || n.k === 'b') 줄.push(String(n.t || ''));
      else if (n.k === 'list') 글들(n.items).forEach((t) => 줄.push('· ' + t));
      else if (n.k === 'read') 줄.push('· ' + n.이름 + ' — ' + n.말);
      else if (n.k === 'card') { const c = (rep.cards || [])[Number(n.i)]; 줄.push('(명식 카드' + (c ? ' — ' + c.label : '') + ')'); }
      else if (n.k === 'han') { 줄.push(n.고전 + ' ' + n.꼴 + ' — ' + n.글); 줄.push('  ' + n.뜻); }
      else if (n.k === 'pillars') { 줄.push(String(n.한자 || '')); 줄.push(String(n.읽기 || '')); (n.글자 || []).forEach((x) => 줄.push('· ' + (x && x.말))); }
      else if (n.k === 'fold') { 줄.push(String(n.head || '')); (n.body || []).forEach(노드글); }
    };
    const order = (Array.isArray(rep.order) && rep.order.length ? rep.order : 차례).filter(칸이름);
    order.forEach((id) => {
      const s = rep[id]; if (!s || typeof s !== 'object') return;
      if (줄.length) 줄.push('');
      if (s.head) 줄.push('[' + s.head + ']');
      (s.body || []).forEach(노드글);
      (Array.isArray(s.items) ? s.items : []).forEach((it) => { 줄.push(''); if (it && it.head) 줄.push(String(it.head)); ((it && it.body) || []).forEach(노드글); });
    });
    return 줄.join('\n');
  }

  /** 보고서 한 벌 → 네이버 블로그 업로드용 본문 html(10-04 사장님 「네이버블로그 업로드용 하나 · 고객 전달용 보고서 하나」).
   *  옛 상담 답글 붙여넣기 틀(marketing/cards/상담-…/붙여넣기.html)의 #doc 꼴. 개인정보 빼기(09-25 「블로그에도 게시 — 개인정보는 드러나지 않게」):
   *  「이렇게 읽었어요」 · 「궁금하다고 하신 것」(손님 사연) · 결제 칸 · 「그 밖에」 · 「날짜별로 전부」 · 관점 칸은 싣지 않고, 목록의 「원하시는 방향」 줄 · 명식 한자 줄(카드 그림이 대신)도 뺀다.
   *  그림(i, card) → 그림 주소(chaeksa.kr/cards/…) 또는 null — null 이면 「[그림 N]」 자리 줄을 둔다(사장님이 받은 그림을 그 자리에 놓는다). */
  const 블로그칸 = ['greet', 'verdict', 'asked', 'block', 'summary', 'excluded', 'method', 'clock', 'close'];
  function 블로그글(rep, 그림) {
    if (!rep || typeof rep !== 'object') return '';
    const 번 = (i) => String(i + 1).padStart(2, '0');
    const 노드 = (n) => {
      if (!n || typeof n !== 'object') return '';
      if (n.k === 'p') return '<p>' + esc(n.t) + '</p>';
      if (n.k === 'b') return '<p><b>' + esc(n.t) + '</b></p>';
      if (n.k === 'list') { const xs = 글들(n.items).filter((t) => !/^원하시는 방향/.test(String(t))); return xs.length ? '<p>' + xs.map(esc).join('<br>') + '</p>' : ''; }
      if (n.k === 'han') return '<blockquote><p>' + esc(n.고전 + ' ' + n.꼴 + ' — ' + n.글) + '<br>' + esc(n.뜻) + '</p></blockquote>';
      if (n.k === 'fold') return (n.head ? '<p><b>' + esc(n.head) + '</b></p>' : '') + (Array.isArray(n.body) ? n.body : []).map(노드).join('');
      if (n.k === 'card') {
        const i = Number(n.i), c = (Array.isArray(rep.cards) ? rep.cards : [])[i]; if (!c) return '';
        const 주소 = typeof 그림 === 'function' ? 그림(i, c) : null;
        return 주소 ? '<p class="card-img"><img src="' + esc(주소) + '" alt="' + esc(c.label) + ' 명식" style="max-width:100%;height:auto"></p>'
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
