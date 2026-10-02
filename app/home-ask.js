/* 「무엇이 궁금하세요?」 — 홈 소개 줄 바로 아래. 손님 말투 물음을 누르면 답이 있는 장으로 곧장 간다(10-02 개편 2묶음).
 * 분야 표(bunya.js)에는 손님 말투 물음이 313개 있고, 그중 66개는 답하는 칸(「칸」)이 걸려 있다(일 › 맞는 일 물음 → 정통사주 9장 등).
 * 손님이 상품 이름(정통궁합 · 웹툰궁합)을 몰라도 자기 물음을 눌러 답에 닿게 한다.
 *
 *   갈래   큰 분야 가운데 답이 걸린 물음이 있는 것. 이름 · 물음 글은 bunya.js 그대로 — 이 파일에는 물음 글을 적지 않는다.
 *          차례는 아래 「갈래차례」(연애 · 궁합 · 나 · 일 · 돈 · 때 · 아이가 먼저), 표에 새 큰 분야가 생기면 끝에 저절로 붙는다.
 *          답이 걸린 물음이 아직 없는 큰 분야(결혼 · 집안 · 시험 · 이사 …)는 맨 끝 「그 밖에」 한 갈래에 모은다(받고 싶어요만).
 *          그 분야 물음에 칸이 걸리면 저절로 제 갈래가 선다 — 표 한 줄로 늘어난다.
 *   칩     답이 걸린 물음. 갈래마다 넷까지 보이고 나머지는 「더 보기」. 큰 분야 대표 물음이 답이 걸린 것이면 맨 앞.
 *          누르면 그 물음의 칸 가운데 맨 앞의 열린 칸으로 간다(칸 차례 = 분야 표에 적은 차례). 칸 → 길은 칸길() 한 곳.
 *          앱 안 탭이면 들어가기(탭, 곳) — 곳은 app.js 도착() 이 읽는다:
 *            jtChN · gcChN  정통사주 · 정통궁합 N장을 펼쳐 내려간다
 *            단계:…        웹툰궁합 그 단계를 미리 골라 둔다(ssStage 값 — 둘 · 시작전 · 썸 · 초반 · 안정기 · 결혼 · 흔들림 · 재회)
 *            회:N          정통사주 웹툰 N화부터 장면 보기(답이 웹툰 회에 있는 물음)
 *            bhCard · jtCard · jtSeol · ssStart  그 칸으로 내려간다
 *          바깥 글(목차 표 「주소」 — 신살 · 「왜」 글 · 택일 글)이면 그 쪽으로.
 *   단계   연애 갈래 맨 위 — 지금 두 사람이 어디쯤인지 고르면 웹툰궁합 그 단계로 간다.
 *   받고 싶어요  답이 아직 없는 물음(빈칸 · 닿기만 하는 칸)은 맨 끝 접힘 안에. 누르면 track.js 사건 want:<분야키>.<몇째> 한 줄만 남긴다
 *          (방문 번호 · 이름 · 생년월일 없이 — 물음 번호만. 이 기기에서 물음마다 한 번).
 *          결과를 정해 달라는 물음(방향 — 「올해 연애할 수 있어요?」)은 넣지 않는다. 그 답은 만들지 않을 것이라(64조) 눌러 받아도 약속을 못 지킨다.
 * 명리 판정은 여기서 하지 않는다 — 표에 적힌 칸으로 길만 잇는다. */
(function (global) {
  'use strict';
  var 갈래차례 = ['love', 'match', 'me', 'work', 'money', 'time', 'child', 'health', 'people', 'learn'];
  var 보임수 = 4;   // 갈래마다 먼저 보이는 칩 수 — 첫 화면에서 그림 칸을 밀어내지 않게
  // 웹툰궁합 단계 칸(ss.<단계>.N) → 고르는 칸(ssStage) 값. 값은 ssom.js 고름칸과 같다.
  var 단계값 = { meet: '시작전', some: '썸', early: '초반', steady: '안정기', wed: '결혼', shaky: '흔들림', again: '재회' };
  // 연애 갈래 맨 위 단계 칩 — 말은 손님 말, 값은 웹툰궁합 단계.
  var 단계칩 = [['썸 타는 중', '썸'], ['사귄 지 얼마 안 됨', '초반'], ['오래 만나는 중', '안정기'], ['흔들릴 때', '흔들림'], ['헤어진 뒤', '재회']];
  var 앞 = ['love'];   // 처음 열린 갈래(landing.js 가 온 길에 따라 home-cats 앞바꾸기로 같이 바꾼다)

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 표() { return global.ChaeksaBunya || null; }

  // 열린 칸 → 목차 줄. 콘텐츠도 열림 · 목차 줄도 열림이어야 한다(준비 · 빈칸 콘텐츠로 보내지 않는다 — 내 여덟 글자 · 무료 질문 칸).
  function 열린칸(B) {
    var 콘 = {}, m = {};
    (B.콘텐츠 || []).forEach(function (c) { if (c.상태 === '열림') 콘[c.키] = c; });
    (B.목차 || []).forEach(function (r) { if (r.상태 === '열림' && 콘[r.콘텐츠]) m[r.칸] = r; });
    return m;
  }

  /** 칸 id 하나 → 길 {탭, 곳?} 또는 {주소}. 못 가는 칸이면 null. */
  function 칸길(id, B, 열) {
    B = B || 표(); if (!B) return null;
    var r = (열 || 열린칸(B))[id], m;
    if (!r) return null;
    if (r.주소) return { 주소: r.주소 };
    if ((m = /^jt\.c(\d+)$/.exec(id))) return { 탭: 'jeongtong', 곳: 'jtCh' + m[1], 장: +m[1] };
    if ((m = /^jt\.h(\d+)$/.exec(id))) return { 탭: 'jeongtong', 곳: '회:' + m[1], 회: +m[1] };
    if (id === 'jt.card') return { 탭: 'jeongtong', 곳: 'jtCard' };
    if (id === 'seol') return { 탭: 'jeongtong', 곳: 'jtSeol' };   // 설명서는 정통사주 안(jeongtong.js #jtSeol)에 선다
    if ((m = /^gc\.c(\d+)$/.exec(id))) return { 탭: 'chongnon', 곳: 'gcCh' + m[1], 장: +m[1] };
    if (id === 'ss.card') return { 탭: 'ssom', 곳: 'ssStart' };   // 3초 카드 — 웹툰궁합 맨 위(app.js renderSsom 이 #ssStart 로 옮긴다)
    if (/^ss\.d\d+$/.test(id)) return { 탭: 'ssom', 곳: '단계:둘', 단계: '둘' };
    if ((m = /^ss\.([a-z]+)\.\d+$/.exec(id)) && 단계값[m[1]]) return { 탭: 'ssom', 곳: '단계:' + 단계값[m[1]], 단계: 단계값[m[1]] };
    if (/^wk\./.test(id)) return { 탭: 'home', 곳: 'bhCard' };   // 이번 주엔 무엇이 바뀌나 — 홈 안
    if (id === 'tk.sim') return { 탭: 'taekil' };
    return null;
  }

  /** 물음 하나 → {칸, 길}. 칸 차례대로 처음 갈 수 있는 칸. */
  function 물음길(q, B, 열) {
    var 칸들 = (q && q.칸) || [];
    for (var i = 0; i < 칸들.length; i++) { var w = 칸길(칸들[i], B, 열); if (w) return { 칸: 칸들[i], 길: w }; }
    return null;
  }

  /** 갈래 목록 — [{키, 이름, 칩: [{id, 글, 칸, 길}], 바람: [{id, 글}]}]. 칩이 하나도 없는 큰 분야(결혼 · 집안 · 시험 · 이사 …)는
   *  제 갈래를 세우지 않고 맨 끝 「그 밖에」 한 갈래에 모은다 — {키: 'etc', 칩: [], 묶음: [{이름, 바람}]}. 답은 없고 「받고 싶어요」만 있다. */
  function 갈래들(B) {
    B = B || 표(); if (!B) return [];
    var 열 = 열린칸(B), 큰 = (B.큰분야 || []).slice();
    큰.sort(function (a, b) { var x = 갈래차례.indexOf(a.키), y = 갈래차례.indexOf(b.키); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
    var out = [], 그밖 = [];
    큰.forEach(function (b) {
      var 칩 = [], 줄들 = [], 바람 = [], 대표 = b.대표 || [], 맨앞 = null;
      (B.분야 || []).forEach(function (f) {
        if (f.큰 !== b.키) return;
        var 줄 = [];
        (f.물음 || []).forEach(function (q, i) {
          var id = f.키 + '.' + (i + 1), w = 물음길(q, B, 열);
          if (w) { var c = { id: id, 글: q.글, 칸: w.칸, 길: w.길 }; if (f.키 === 대표[0] && i + 1 === 대표[1]) 맨앞 = c; else 줄.push(c); }
          else if (!q.방향) 바람.push({ id: id, 글: q.글 });
        });
        줄들.push(줄);
      });
      // 칩 차례 — 대표 물음, 그다음은 작은 분야를 번갈아 하나씩(먼저 보이는 넷이 한 분야로 몰리지 않게: 연애면 끌림 · 좋아할 때 · 썸 · 연애 중).
      if (맨앞) 칩.push(맨앞);
      for (var n = 0, 남음 = true; 남음; n++) { 남음 = false; 줄들.forEach(function (줄) { if (줄[n]) { 칩.push(줄[n]); 남음 = true; } }); }
      if (칩.length) out.push({ 키: b.키, 이름: b.이름, 칩: 칩, 바람: 바람 });
      else if (바람.length) 그밖.push({ 이름: b.이름, 바람: 바람 });
    });
    if (그밖.length) out.push({ 키: 'etc', 이름: '그 밖에', 칩: [], 바람: [], 묶음: 그밖 });
    return out;
  }

  function 길속성(w) {
    if (w.주소) return ' href="' + esc(w.주소 + '?from=site-ask') + '"';
    return ' href="' + esc('./?go=' + w.탭) + '" data-tab="' + esc(w.탭) + '"' + (w.곳 ? ' data-spot="' + esc(w.곳) + '"' : '');
  }
  function 누름(k) { try { return !!localStorage.getItem('chaeksa.want.' + k); } catch (e) { return false; } }
  var 바람말 = '눌린 수를 보고 만들 차례를 정해요. 물음 번호만 세고, 이름 · 생년월일은 보내지 않아요.';
  function 바람단추(w) { var 됨 = 누름(w.id); return '<button type="button" class="ask-w' + (됨 ? ' done' : '') + '" data-want="' + esc(w.id) + '"' + (됨 ? ' disabled' : '') + '>' + esc(w.글) + '<i>' + (됨 ? '눌렀어요' : '받고 싶어요') + '</i></button>'; }

  function 몸(g) {
    // 「그 밖에」 — 답이 걸린 물음이 아직 없는 분야들. 받고 싶은 물음만 고른다(펼친 채).
    if (g.묶음) return '<p class="ask-want-p">여기 물음은 아직 답을 만들지 않았어요. 받고 싶은 걸 눌러 주세요. ' + esc(바람말) + '</p>'
      + g.묶음.map(function (m) { return '<p class="ask-want-h">' + esc(m.이름) + '</p>' + m.바람.map(바람단추).join(''); }).join('');
    var h = '';
    if (g.키 === 'love') h += '<div class="ask-st-row"><span class="ask-st-l">우리 둘은 지금</span>'
      + 단계칩.map(function (s) { return '<a class="ask-st"' + 길속성({ 탭: 'ssom', 곳: '단계:' + s[1] }) + '>' + esc(s[0]) + '</a>'; }).join('') + '</div>';
    h += '<div class="ask-chips">' + g.칩.map(function (c, i) {
      return '<a class="ask-c' + (i >= 보임수 ? ' hide' : '') + '"' + 길속성(c.길) + ' data-q="' + esc(c.id) + '">' + esc(c.글) + '</a>';
    }).join('') + '</div>';
    if (g.칩.length > 보임수) h += '<button type="button" class="ask-more">물음 ' + (g.칩.length - 보임수) + '개 더 보기</button>';
    if (g.바람.length) h += '<details class="ask-want"><summary>아직 답이 없는 물음 ' + g.바람.length + '개 — 받고 싶은 걸 눌러 주세요</summary>'
      + '<p class="ask-want-p">' + esc(바람말) + '</p>' + g.바람.map(바람단추).join('') + '</details>';
    return h;
  }

  function 받고싶어(b) {
    var k = b.getAttribute('data-want'); if (!k) return;
    var 처음 = true;
    try { if (localStorage.getItem('chaeksa.want.' + k)) 처음 = false; else localStorage.setItem('chaeksa.want.' + k, '1'); } catch (e) {}
    // 물음 번호만 — 방문 번호를 붙이지 않는다(noVid). 이 기기에서 물음마다 한 번.
    if (처음) { try { if (global.ChaeksaTrack) global.ChaeksaTrack.event('want:' + k, { noVid: true }); } catch (e) {} }
    b.classList.add('done'); b.disabled = true;
    var i = b.querySelector('i'); if (i) i.textContent = '눌렀어요';
  }

  function 잇기(box) {
    box.querySelectorAll('a[data-tab]').forEach(function (a) {
      a.onclick = function (e) {
        if (typeof global.책사들어가기 !== 'function') return;   // 앱이 아직 안 섰으면 주소(./?go=…)대로 간다
        e.preventDefault();
        global.책사들어가기(a.getAttribute('data-tab'), a.getAttribute('data-spot') || undefined);
      };
    });
    var 더 = box.querySelector('.ask-more');
    if (더) 더.onclick = function () { box.querySelectorAll('.ask-c.hide').forEach(function (c) { c.classList.remove('hide'); }); 더.remove(); };
    box.querySelectorAll('.ask-w').forEach(function (b) { b.onclick = function () { 받고싶어(b); }; });
  }

  function 그리기(el) {
    if (!el) return;
    var gs = 갈래들(); if (!gs.length) { el.innerHTML = ''; return; }
    var 첫 = gs.filter(function (g) { return 앞.indexOf(g.키) >= 0; })[0] || gs[0];
    el.innerHTML = '<section class="hask" aria-label="무엇이 궁금하세요">'   /* 옛 .ask(입력 줄 · flex) 와 이름이 겹쳐 세로로 눌렸다 — 10-02 hask */
      + '<h2 class="ask-h">무엇이 궁금하세요?</h2>'
      + '<div class="ask-tabs" role="tablist">' + gs.map(function (g) {
        var on = g === 첫;
        return '<button type="button" role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + '" data-k="' + esc(g.키) + '">' + esc(g.이름) + '</button>';
      }).join('') + '</div><div class="ask-body" role="tabpanel"></div></section>';
    var body = el.querySelector('.ask-body');
    function 열기(g) {
      el.querySelectorAll('.ask-tabs button').forEach(function (b) { var on = b.getAttribute('data-k') === g.키; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      body.innerHTML = 몸(g); 잇기(body);
    }
    el.querySelectorAll('.ask-tabs button').forEach(function (b) {
      b.onclick = function () { var g = gs.filter(function (x) { return x.키 === b.getAttribute('data-k'); })[0]; if (g) 열기(g); };
    });
    열기(첫);
  }

  function 모두() { document.querySelectorAll('[data-home-ask]').forEach(그리기); }
  /** 처음 열릴 갈래를 바꾸고 다시 그린다 — home-cats 앞바꾸기가 같이 부른다(블로그 꼬리표로 온 손님에게 온 길의 갈래를). */
  function 앞바꾸기(키들) { 앞 = (키들 || []).slice(); 모두(); }
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 모두); else 모두(); }
  global.ChaeksaHomeAsk = { 그리기: 그리기, 모두: 모두, 앞바꾸기: 앞바꾸기, 갈래들: 갈래들, 물음길: 물음길, 칸길: 칸길, 단계칩: 단계칩 };
})(typeof window !== 'undefined' ? window : globalThis);
