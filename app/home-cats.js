/* DES-0007 — 홈에는 목적별 입구 네 칸, #all에는 기존 콘텐츠 전체.
 * 이름·가격은 상품 약속 장부, 입력·결과는 기존 책사들어가기 경로를 쓴다.
 * 표지·묶음·장길 API는 다른 화면에서도 사용하므로 유지한다. */
(function (global) {
  'use strict';
  // 분류 키 → 그림 칸(콘텐츠). 그림 {g} = f · m. 크기 = 원본 [가로, 세로].
  // 작은 = 폰용 작은 판(가로 360). srcset 으로 화면 선명도에 맞춰 브라우저가 고르고, 선명한 폰(3배 화면)은 원본을 그대로 받는다.
  // 원본은 지우지 않는다(09-30 사장님 「삽화 화질을 줄이지 않았으면」 — 작은 판이 칸 폭보다 작아지면 원본으로 넘어간다).
  // 사용설명서는 연애 칸 — 그 사람 한 명이 연애 단계마다 어떻게 할지라서(두 사람을 맞대는 궁합 칸이 아니다). 연애 두 상품이 첫 줄에 나란히 선다.
  var 칸 = {
    // 10-23 사장님 「클릭하고 싶게 만드는 표지여야 한다」 · 「안 바뀌었는데」 — 빌려 쓰던 밤 컷 아홉 칸을 제 표지(IMG-0013~0026, 콘텐츠 첫 줄에서 꺼낸 밝은 그림)로
    love: [{ 키: 'love', 탭: 'love', 그림: 'art/love-cover.webp', 작은: 'art/love-cover-s.webp', 크기: [1086, 1448] },
      { 키: 'pair', 탭: 'pair', 그림: 'art/pair-cover.webp', 작은: 'art/pair-cover-s.webp', 크기: [1024, 1536] }],
    child: [{ 키: 'taekil', 탭: 'taekil', 주소: 'taekil.html?from=home', 그림: 'art/taekil-main.webp', 작은: 'art/taekil-main-s.webp', 크기: [1086, 1448] }],
    // 10-07 「결혼상대 점검」(gyeolhon.html, 사장님 10-07 확정 유료) — 궁합 칸 맨 앞. 그림은 소개 쪽 머리와 같은 상견례 컷(성별 없음)
    // 창 = 아래 줄 「궁합」 고르기 창(app.js 고르기창)에서 이름 아래 한 줄(10-10 작가 「궁합창」 — 창의 다른 두 줄처럼 무엇을 보는지 적은 꼴). 홈 칸은 장부 홈한줄(물음 꼴) 그대로.
    //   장부(yaksok.js)에 두지 않은 까닭 — pay.html · pay-done · pay-fail 이 장부를 싣는다. 결제 심사 동안 그 쪽 ?v= 가 바뀌지 않게 여기 둔다(심사 뒤 장부 칸으로 옮긴다).
    match: [{ 키: 'gyeolhon', 주소: 'gyeolhon.html', 창: '그 사람과 함께 살아도 되는지, 결혼식을 피해야 할 해까지', 그림: 'art/gyeolhon-cover.webp', 작은: 'art/gyeolhon-cover-s.webp', 크기: [1024, 1536] },
      { 키: 'chongnon', 탭: 'chongnon', 그림: 'art/gunghap-main.webp', 작은: 'art/gunghap-main-s.webp', 크기: [1086, 1448] },
      { 키: 'ssom', 탭: 'ssom', 그림: 'art/ssom-main.webp', 작은: 'art/ssom-main-s.webp', 크기: [1086, 1448] }],
    me: [// 10-12 「내 사람들」(saram.html, 작업판 36) — 사장님 「내 사람들 ㄱㄱ」. 그림은 비견 칸(나란히 선 사람들)
      { 키: 'saram', 주소: 'saram.html', 그림: 'art/saram-cover.webp', 작은: 'art/saram-cover-s.webp', 크기: [1024, 1536] },
      { 키: 'jeongtong', 탭: 'jeongtong', 그림: 'art/saju-main.webp', 작은: 'art/saju-main-s.webp', 크기: [1086, 1448] },
      // 10-06 「옛 책이 본 내 머리」(brain.html) — 사장님 「썸네일 달고 컨텐츠로 배포」. 그림은 편인 칸(혼천의를 짜 맞추는 사람 — 머리 자체)
      { 키: 'brain', 주소: 'brain.html', 그림: 'art/brain-cover-{g}.webp', 작은: 'art/brain-cover-{g}-s.webp', 크기: [1024, 1536] },
      // 10-10 「나는 귀한 사람일까」(gwi.html, 작업판 귀-1) — 사장님 「귀 새 뜻으로 쓰고」. 그림은 정관 칸(맡은 자리와 책임 — 옛 책이 귀의 조건으로 본 글자)
      { 키: 'gwi', 주소: 'gwi.html', 그림: 'art/gwi-cover-{g}.webp', 작은: 'art/gwi-cover-{g}-s.webp', 크기: [1024, 1536] },
      // 10-10 「내 명반에는 무엇이 적혀 있을까」(myeongban.html, 작업판 자미-1) — 사장님 「자미두수 명판을 두고 글자를 누르면 해석」. 그림은 편관 칸(화면에 둥근 판을 띄워 놓고 들여다보는 컷 — 명반을 짚어 읽는 꼴)
      // 10-11 「옛 책은 내 명식을 반겼을까」(gyeokgi.html, 작업판 34 옛책격) — 사장님 「명식을 넣으면 ~에 해당합니다 식으로」 → 「3으로 바로 가」. 그림은 식신 칸(아직 홈에서 안 쓴 그림)
      { 키: 'gyeokgi', 주소: 'gyeokgi.html', 그림: 'art/gyeokgi-cover-{g}.webp', 작은: 'art/gyeokgi-cover-{g}-s.webp', 크기: [1024, 1536] },
      { 키: 'myeongban', 주소: 'myeongban.html', 그림: 'art/myeongban-cover-{g}.webp', 작은: 'art/myeongban-cover-{g}-s.webp', 크기: [1024, 1536] }],
    // 10-05 「언제 나아지나」(when.html) — 사장님 「무료로 공개해」. 운 분류 첫 칸(지금 힘든 사람이 가장 먼저 묻는 것)
    time: [{ 키: 'when', 주소: 'when.html', 그림: 'art/when-cover-{g}.webp', 작은: 'art/when-cover-{g}-s.webp', 크기: [1024, 1536] }],  // 10-12 「이번 주엔 무엇이 바뀌나」 뺌 — 사장님 「삭제하자 재미가 없네」,
    learn: [{ 키: 'read', 주소: 'read.html', 그림: 'art/read-cover.webp', 작은: 'art/read-cover-s.webp', 크기: [1024, 1536] }],
    // 10-22 「나는 뭐해 먹고 살까?」(ilgyeol.html, 진로 보고서 · 유료) — 사장님 「홈에 넣어」. 일과 자리 분류.
    // 10-23 제 그림(IMG-0006 · 0007 밤 갈림길 불 켜진 문들, 남녀 두 벌 — 소개 쪽 머리와 같은 그림). 전에는 정통사주 15장(일) 컷을 빌려 썼다.
    work: [{ 키: 'ilgyeol', 주소: 'ilgyeol.html', 그림: 'art/ilgyeol-{g}.webp', 작은: 'art/ilgyeol-{g}-s.webp', 크기: [1024, 1536] }],
  };
  // 10-22 사장님 「유료 콘텐츠들 상단으로」 — 메뉴판 맨 앞은 값을 받는 다섯(이 차례), 그 뒤는 분류 차례 그대로.
  var 유료차례 = ['taekil', 'gyeolhon', 'ilgyeol', 'love', 'pair'];
  function 순위(키) { var i = 유료차례.indexOf(키); return i < 0 ? 99 : i; }
  // 그림 칸 폭 — .wrap(최대 520 · 양옆 18) 안의 3열(사이 8) · 넓으면 4열. index.html 머리의 첫 표지 미리 부르기(preload imagesizes)와 같아야 한다.
  var 칸폭 = '(min-width:520px) 236px, calc((100vw - 48px)/2)';
  // 정통사주 장으로 가지 않는 물음 칸 — 결혼은 웹툰궁합 「결혼을 생각할 때」 단계(곳 「단계:결혼」 → app.js 도착이 단계를 미리 골라 둔다),
  // 날 고르기는 출산택일(지금 날을 고르는 콘텐츠는 출산택일뿐이라 글에 그대로 밝힌다).
  var 길 = {
    marry: { 키: 'ssom', 탭: 'ssom', 곳: '단계:결혼', 글: '결혼을 생각할 때 우리 둘은?' },
    day: { 키: 'taekil', 탭: 'taekil', 주소: 'taekil.html?from=home', 글: '출산 가능한 범위에서 가장 좋은 날과 시간을 골라 드려요' },
  };
  // 맨 앞에 설 분류(landing.js 가 온 길에 따라 바꿀 수 있다 — 앞바꾸기).
  // 10-04 전략 — 아이(출산택일)가 첫 칸. 블로그 · 검색으로 오는 사람 대부분이 출산택일을 찾아오고, 첫 매출도 출산택일에서 낸다.
  // 10-07 결혼상대 점검이 서면서 궁합이 둘째 — 보고서로 파는 둘(출산택일 · 결혼상대 점검)이 첫 줄에 나란히, 그 뒤 연애. 물음 칩 차례(home-ask.js 갈래차례)는 그대로.
  var 앞 = ['child', 'match', 'love'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 성별() { try { var p = JSON.parse(localStorage.getItem('chaeksa.profile') || 'null'); return p && p.gender === 'M' ? 'm' : 'f'; } catch (e) { return 'f'; } }

  // 분류 → 정통사주 장 — 대표 물음부터, 그 분류의 물음 차례로 「칸」(답하는 칸)에 jt.cN 이 걸린 첫 물음. 곁(닿기만 하는 칸)은 보지 않는다.
  // 목차 표에 그 칸이 「열림」으로 있어야 한다(없는 장으로 보내지 않는다).
  function 장길(b) {
    var B = global.ChaeksaBunya, 분야 = B.분야 || [], 목차 = B.목차 || [], 대표 = b.대표 || [], 물음들 = [];
    분야.forEach(function (f) { if (f.키 === 대표[0] && f.물음 && f.물음[대표[1] - 1]) 물음들.push(f.물음[대표[1] - 1]); });
    분야.forEach(function (f) { if (f.큰 === b.키) (f.물음 || []).forEach(function (q) { 물음들.push(q); }); });
    for (var i = 0; i < 물음들.length; i++) {
      var 칸들 = 물음들[i].칸 || [];
      for (var j = 0; j < 칸들.length; j++) {
        var m = /^jt\.c(\d+)$/.exec(칸들[j]), id = 칸들[j];
        if (m && 목차.some(function (r) { return r.칸 === id && r.상태 === '열림'; })) return { 키: 'jeongtong', 탭: 'jeongtong', 곳: 'jtCh' + m[1], 장: +m[1], 글: 물음들[i].글 };
      }
    }
    return null;
  }

  var 그림판 = 'v1470';   // tools_bust.py --bump 가 서비스워커 판과 같이 올린다
  function 그림칸(b, c, i, 차례, g, Y) {
    // 그림은 그림만(10-23 사장님) — 그림 아래에 이름(.n) · 한줄(.s) · 딱지(.t: 무엇이 무료 · 얼마 — 값은 상품표에서 채운다). 분류 딱지는 안 그린다.
    var 이름 = c.표시명 || (Y && Y.이름(c.키)) || b.이름, 한줄 = c.설명 || (Y && Y.홈한줄 ? Y.홈한줄(c.키) : ''), 딱지 = Y ? Y.딱지html(c.키) : '';
    var 원본 = c.그림.replace('{g}', g) + '?' + 그림판, 작은 = c.작은 ? c.작은.replace('{g}', g) + '?' + 그림판 : '';   // 10-24 그림 꼬리(판) — 같은 이름으로 바뀐 그림을 캐시가 물고 있지 않게(tools_bust --bump 가 올림)
    var 주소 = c.주소 || (c.탭 && c.탭 !== 'home' ? './?go=' + c.탭 : '#');
    // 첫 줄 둘은 바로 받고(첫 칸은 먼저), 그 아래는 화면에 다가오면 받는다.
    var 받기 = 차례 === 0 ? ' fetchpriority="high"' : 차례 < 4 ? '' : ' loading="lazy"';
    return '<a class="cat" href="' + esc(주소) + '" data-cat="' + esc(b.키) + '" data-i="' + i + '" data-key="' + esc(c.키) + '"'
      + (c.주소 ? '' : ' data-tab="' + esc(c.탭) + '"' + (c.곳 ? ' data-spot="' + esc(c.곳) + '"' : '')) + '>'
      + '<span class="pic"><img src="' + esc(원본) + '"' + (작은 ? ' srcset="' + esc(작은) + ' 360w, ' + esc(원본) + ' ' + c.크기[0] + 'w" sizes="' + (c.목록 ? '76px' : 칸폭) + '"' : '')
      + ' alt="" width="' + c.크기[0] + '" height="' + c.크기[1] + '" decoding="async"' + 받기 + '>'
      + '</span><span class="n">' + esc(이름) + '</span>'   // 10-23 사장님 「나 · 아이 · 궁합 · 일과 자리 글씨들 때문에 삽화가 잘 안 보여」 — 분류 딱지(.k) 안 그리고, 제목은 그림 밖 아래로
      + (한줄 ? '<span class="s">' + esc(한줄) + '</span>' : '')
      + (딱지 ? '<span class="t">' + 딱지 + '</span>' : '') + '</a>';
  }

  function 물음칸(b, w, Y) {
    // 딱지 = 가는 콘텐츠 이름(정통사주면 몇 장) · 그 콘텐츠의 장부 딱지 — 「정통사주 제7장 · 무료」 · 「웹툰궁합 · 무료」.
    var 어디 = ((Y && Y.이름(w.키)) || '') + (w.장 ? ' 제' + w.장 + '장' : ''), 딱지 = Y ? Y.딱지html(w.키) : '';
    return '<a class="cat-q" href="' + esc('./?go=' + w.탭) + '" data-cat="' + esc(b.키) + '" data-to="' + esc(w.키) + '" data-tab="' + esc(w.탭) + '"' + (w.곳 ? ' data-spot="' + esc(w.곳) + '"' : '') + '>'
      + '<span class="k">' + esc(b.이름) + '</span><span class="n">' + esc(w.글) + '</span>'
      + '<span class="t">' + esc(어디) + (어디 && 딱지 ? ' · ' : '') + 딱지 + '</span></a>';
  }

  function 길달기(el) {
    el.querySelectorAll('a[data-tab]').forEach(function (a) {
      a.onclick = function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button > 0 || typeof global.책사들어가기 !== 'function') return;
        e.preventDefault();
        global.책사들어가기(a.getAttribute('data-tab'), a.getAttribute('data-spot') || undefined);
      };
    });
  }

  function 찾기(키) {
    var out;
    Object.keys(칸).some(function (분류) { return 칸[분류].some(function (c) { if (c.키 !== 키) return false; out = { b: { 키: 분류 }, c: c }; return true; }); });
    return out;
  }
  // 홈은 목적 네 개, 전체 보기는 기존 상품 표 전부. 계산·가격·입력 경로는 기존 것을 쓴다.
  function 그리기(el) {
    if (!el) return;
    var Y = global.ChaeksaYaksok, g = 성별();
    var 입구 = [
      ['taekil', '아기 태어날 날과 시간', '가능한 범위에서 가장 좋은 시간을 골라 드려요'],
      ['chongnon', '우리 둘, 잘 맞을까?', '두 사람의 잘 맞는 점과 부딪히는 점'],
      ['jeongtong', '내 일과 돈', '돈 버는 방식부터 살펴보세요', 'jtCh7'],
      ['when', '언제 나아질까?', '힘든 때와 풀리는 때를 살펴보세요']
    ];
    el.innerHTML = '<section class="home-paths" aria-label="목적별 바로가기"><h2>바로 보고 싶은 이야기</h2><div class="cats home-doors">' + 입구.map(function (r, i) {
      var x = 찾기(r[0]);
      return 그림칸(x.b, Object.assign({}, x.c, { 표시명: r[1], 설명: r[2], 곳: r[3] }), i, i, g, Y);
    }).join('') + '</div><a class="home-all-link" href="#all">전체 보기 <span aria-hidden="true">→</span></a></section>';
    if (Y) Y.값채우기(el);
    길달기(el);
  }
  function 전체그리기(el) {
    var Y = global.ChaeksaYaksok, g = 성별(), n = 4;
    var 묶음들 = [
      ['아기 태어날 날과 시간', ['taekil']],
      ['연애와 궁합', ['chongnon', 'ssom', 'gyeolhon', 'love', 'pair', 'saram']],
      ['일과 돈', ['ilgyeol']],
      ['나를 알아보기', ['jeongtong', 'when', 'brain', 'gwi', 'gyeokgi', 'myeongban']],
      ['읽을거리', ['read']]
    ];
    el.innerHTML = 묶음들.map(function (r, group) {
      return '<section class="catalog-group" aria-labelledby="catalog-title-' + group + '"><h2 id="catalog-title-' + group + '">' + esc(r[0]) + '</h2><div class="catalog-list">' + r[1].map(function (키, i) {
        var x = 찾기(키);
        return 그림칸(x.b, Object.assign({}, x.c, { 목록: true }), i, n++, g, Y);
      }).join('') + '</div></section>';
    }).join('');
    if (Y) Y.값채우기(el);
    길달기(el);
  }

  /** 콘텐츠 키 또는 탭 이름 → 그 칸 표지 그림(원본 · 화질 그대로). 생년월일 입력창 맨 위 그림이 쓴다 — 홈에서 누른 그 그림이 입력창에도 뜬다(10-02). 없으면 null. */
  function 표지(키) {
    var 찾음 = null;
    Object.keys(칸).forEach(function (b) { 칸[b].forEach(function (c) { if (!찾음 && (c.키 === 키 || (c.탭 && c.탭 === 키))) 찾음 = c; }); });
    return 찾음 ? 찾음.그림.replace('{g}', 성별()) : null;
  }

  /** 분류 키(love · match …) → 그 분류의 그림 칸 [{키, 탭, 주소}] — 홈 칸과 같은 차례. 아래 줄 「연애」 · 「궁합」 고르기 창(app.js 고르기창)이 쓴다(10-02).
   *  칸 표가 바뀌면 고르기 창도 같이 바뀐다(한 사실은 한 곳). 그림 칸이 없는 분류면 빈 배열. */
  function 묶음(b) { return (칸[b] || []).map(function (c) { return { 키: c.키, 탭: c.탭 || null, 주소: c.주소 || null, 창: c.창 || null }; }); }

  function 모두() { document.querySelectorAll('[data-home-cats]').forEach(그리기); document.querySelectorAll('[data-home-catalog]').forEach(전체그리기); }
  /** 맨 앞에 설 분류를 바꾸고 다시 그린다 — 블로그 꼬리표로 온 손님(landing.js)에게 온 길의 칸을 앞에.
   *  「무엇이 궁금하세요?」(home-ask.js)도 같은 분류의 물음을 먼저 펼친다 — 부르는 쪽은 이것 하나만 부르면 된다. */
  function 앞바꾸기(키들) { 앞 = (키들 || []).slice(); 모두(); try { if (global.ChaeksaHomeAsk) global.ChaeksaHomeAsk.앞바꾸기(키들); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 모두); else 모두();
  global.ChaeksaHomeCats = { 그리기: 그리기, 모두: 모두, 앞바꾸기: 앞바꾸기, 장길: 장길, 표지: 표지, 묶음: 묶음 };
})(typeof window !== 'undefined' ? window : globalThis);
