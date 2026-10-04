/* 홈 = 분류 칸 — 09-30 사장님 「홈구성을 분류 → 연애 → 썸네일 삽화 터치하면 컨텐츠 입장 · 분류마다 하나씩 · 없는 컨텐츠라도 준비중으로 넣고 칸부터 · 모바일 전용」.
 * 10-02 개편 2묶음 「홈 첫 화면 다시 짜기」 — 폰 첫 화면에 그림 한 장과 다음 그림 윗부분만 보였고, 「준비중」 11줄이 가게가 반쯤 빈 인상을 줬다.
 *   ① 그림 칸은 2열 · 높이를 같게(3:4). 폰 첫 화면에 네 칸이 보인다. 칸마다 한줄(무엇을 보나)과 딱지(무엇이 무료 · 얼마).
 *   ② 그림 칸이 없는 분류(일 · 돈 · 건강 · 사람 사이 …)는 「물음 칸」 — 누르면 답이 있는 콘텐츠의 그 장으로 곧장 간다.
 *      물음 글은 분야 표(bunya.js) 대표 물음(답 칸이 없으면 그 분류에서 답 칸이 걸린 첫 물음), 갈 장은 그 물음의 칸 값(jt.cN → 정통사주 N장).
 *   ③ 아직 콘텐츠가 없는 분류는 맨 아래 한 줄 「곧 열려요」로 접는다.
 * 분류 이름 · 차례 · 물음은 bunya.js, 칸 이름 · 한줄 · 딱지는 상품 약속 장부(yaksok.js)에서 읽는다. 이 파일은 분류마다 어느 콘텐츠 · 그림 · 자리를 여는지만 안다.
 * 콘텐츠가 생기면 아래 칸 표에 한 줄 — 그러면 「곧 열려요」에서 저절로 빠진다. 누르면 들어가기(저장된 사람이 없으면 입구를 거쳐 그 탭). */
(function (global) {
  'use strict';
  // 분류 키 → 그림 칸(콘텐츠). 그림 {g} = f · m. 크기 = 원본 [가로, 세로].
  // 작은 = 폰용 작은 판(가로 360). srcset 으로 화면 선명도에 맞춰 브라우저가 고르고, 선명한 폰(3배 화면)은 원본을 그대로 받는다.
  // 원본은 지우지 않는다(09-30 사장님 「삽화 화질을 줄이지 않았으면」 — 작은 판이 칸 폭보다 작아지면 원본으로 넘어간다).
  // 사용설명서는 연애 칸 — 그 사람 한 명이 연애 단계마다 어떻게 할지라서(두 사람을 맞대는 궁합 칸이 아니다). 연애 두 상품이 첫 줄에 나란히 선다.
  var 칸 = {
    love: [{ 키: 'love', 탭: 'love', 그림: 'art/love-cover.webp', 작은: 'art/love-cover-s.webp', 크기: [1086, 1448] },
      { 키: 'pair', 탭: 'pair', 그림: 'art/story-friend-to-lover.webp', 작은: 'art/story-friend-to-lover-s.webp', 크기: [1024, 1536] }],
    child: [{ 키: 'taekil', 탭: 'taekil', 그림: 'art/taekil-main.webp', 작은: 'art/taekil-main-s.webp', 크기: [1086, 1448] }],
    match: [{ 키: 'chongnon', 탭: 'chongnon', 그림: 'art/gunghap-main.webp', 작은: 'art/gunghap-main-s.webp', 크기: [1086, 1448] },
      { 키: 'ssom', 탭: 'ssom', 그림: 'art/ssom-main.webp', 작은: 'art/ssom-main-s.webp', 크기: [1086, 1448] }],
    me: [{ 키: 'jeongtong', 탭: 'jeongtong', 그림: 'art/saju-main.webp', 작은: 'art/saju-main-s.webp', 크기: [1086, 1448] }],
    // 10-05 「언제 나아지나」(when.html) — 사장님 「무료로 공개해」. 운 분류 첫 칸(지금 힘든 사람이 가장 먼저 묻는 것)
    time: [{ 키: 'when', 주소: 'when.html', 그림: 'art/jt-19-return-{g}.webp', 작은: 'art/jt-19-return-{g}-s.webp', 크기: [1024, 1536] },
      { 키: 'week', 탭: 'home', 곳: 'bhCard', 그림: 'art/jt-18-ten-years-{g}.webp', 작은: 'art/jt-18-ten-years-{g}-s.webp', 크기: [1024, 1536] }],
    learn: [{ 키: 'read', 주소: 'read.html', 그림: 'art/jt-g-jeongin-{g}.webp', 작은: 'art/jt-g-jeongin-{g}-s.webp', 크기: [1024, 1536] }],
  };
  // 그림 칸 폭 — .wrap(최대 520 · 양옆 18) 안의 2열(사이 10). index.html 머리의 첫 표지 미리 부르기(preload imagesizes)와 같아야 한다.
  var 칸폭 = '(min-width:520px) 237px, calc(50vw - 23px)';
  // 정통사주 장으로 가지 않는 물음 칸 — 결혼은 웹툰궁합 「결혼을 생각할 때」 단계(곳 「단계:결혼」 → app.js 도착이 단계를 미리 골라 둔다),
  // 날 고르기는 출산택일(지금 날을 고르는 콘텐츠는 출산택일뿐이라 글에 그대로 밝힌다).
  var 길 = {
    marry: { 키: 'ssom', 탭: 'ssom', 곳: '단계:결혼', 글: '결혼을 생각할 때 우리 둘은?' },
    day: { 키: 'taekil', 탭: 'taekil', 글: '제왕절개 날짜 · 시각 고르기' },
  };
  // 맨 앞에 설 분류(landing.js 가 온 길에 따라 바꿀 수 있다 — 앞바꾸기).
  // 10-04 전략 — 아이(출산택일)가 첫 칸, 연애가 둘째. 블로그 · 검색으로 오는 사람 대부분이 출산택일을 찾아오고, 첫 매출도 출산택일에서 낸다.
  var 앞 = ['child', 'love'];

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

  function 그림칸(b, c, i, 차례, g, Y) {
    // 만화 표지처럼 — 그림 위에 분류 딱지(.k)와 이름(.n), 그림 아래에 한줄(.s)과 딱지(.t: 무엇이 무료 · 얼마 — 값은 상품표에서 채운다).
    var 이름 = (Y && Y.이름(c.키)) || b.이름, 한줄 = Y && Y.홈한줄 ? Y.홈한줄(c.키) : '', 딱지 = Y ? Y.딱지html(c.키) : '';
    var 원본 = c.그림.replace('{g}', g), 작은 = c.작은 ? c.작은.replace('{g}', g) : '';
    var 주소 = c.주소 || (c.탭 && c.탭 !== 'home' ? './?go=' + c.탭 : '#');
    // 첫 줄 둘은 바로 받고(첫 칸은 먼저), 그 아래는 화면에 다가오면 받는다.
    var 받기 = 차례 === 0 ? ' fetchpriority="high"' : 차례 < 4 ? '' : ' loading="lazy"';
    return '<a class="cat" href="' + esc(주소) + '" data-cat="' + esc(b.키) + '" data-i="' + i + '" data-key="' + esc(c.키) + '"'
      + (c.주소 ? '' : ' data-tab="' + esc(c.탭) + '"' + (c.곳 ? ' data-spot="' + esc(c.곳) + '"' : '')) + '>'
      + '<span class="pic"><img src="' + esc(원본) + '"' + (작은 ? ' srcset="' + esc(작은) + ' 360w, ' + esc(원본) + ' ' + c.크기[0] + 'w" sizes="' + 칸폭 + '"' : '')
      + ' alt="" width="' + c.크기[0] + '" height="' + c.크기[1] + '" decoding="async"' + 받기 + '>'
      + '<span class="k">' + esc(b.이름) + '</span><span class="n">' + esc(이름) + '</span></span>'
      + (한줄 ? '<span class="s">' + esc(한줄) + '</span>' : '')
      + (딱지 ? '<span class="t">' + 딱지 + '</span>' : '') + '</a>';
  }

  function 물음칸(b, w, Y) {
    // 딱지 = 가는 콘텐츠 이름(정통사주면 몇 장) · 그 콘텐츠의 장부 딱지 — 「정통사주 7장 · 무료」 · 「웹툰궁합 · 무료」.
    var 어디 = ((Y && Y.이름(w.키)) || '') + (w.장 ? ' ' + w.장 + '장' : ''), 딱지 = Y ? Y.딱지html(w.키) : '';
    return '<a class="cat-q" href="' + esc('./?go=' + w.탭) + '" data-cat="' + esc(b.키) + '" data-to="' + esc(w.키) + '" data-tab="' + esc(w.탭) + '"' + (w.곳 ? ' data-spot="' + esc(w.곳) + '"' : '') + '>'
      + '<span class="k">' + esc(b.이름) + '</span><span class="n">' + esc(w.글) + '</span>'
      + '<span class="t">' + esc(어디) + (어디 && 딱지 ? ' · ' : '') + 딱지 + '</span></a>';
  }

  function 그리기(el) {
    if (!el || !global.ChaeksaBunya) return;
    var 큰 = global.ChaeksaBunya.큰분야.slice();
    큰.sort(function (a, b) { var x = 앞.indexOf(a.키), y = 앞.indexOf(b.키); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
    var g = 성별(), Y = global.ChaeksaYaksok, 그림들 = '', 물음들 = '', 곧 = [], 차례 = 0;
    큰.forEach(function (b) {
      if (칸[b.키]) { 칸[b.키].forEach(function (c, i) { 그림들 += 그림칸(b, c, i, 차례++, g, Y); }); return; }
      var w = 길[b.키] || 장길(b);
      if (w) 물음들 += 물음칸(b, w, Y); else 곧.push(b.이름);
    });
    el.innerHTML = '<div class="cats">' + 그림들 + '</div>'
      + (물음들 ? '<p class="cats-h">이런 물음은 여기서 바로 답해요</p><div class="cats-q">' + 물음들 + '</div>' : '')
      // 10-04 전략 — 빈 선반(「곧 열려요 · …」)은 보이지 않는다. 손님 수가 적을 때 고를 것이 많으면 아무것도 안 고른다(곧 목록은 그리지 않고 버린다).
      + '';
    if (Y) Y.값채우기(el);
    el.querySelectorAll('a[data-tab]').forEach(function (a) {
      a.onclick = function (e) {
        if (typeof global.책사들어가기 !== 'function') return;   // 앱이 아직 안 섰으면 주소(./?go=…)대로 간다
        e.preventDefault();
        // 곳(칸)도 같이 넘긴다 — 입력을 거쳐 오면 시간이 흐르니 app.js 도착() 이 그 탭을 연 뒤 그 칸으로 내려간다(접힌 장이면 펼친다).
        global.책사들어가기(a.getAttribute('data-tab'), a.getAttribute('data-spot') || undefined);
      };
    });
  }

  /** 콘텐츠 키 또는 탭 이름 → 그 칸 표지 그림(원본 · 화질 그대로). 생년월일 입력창 맨 위 그림이 쓴다 — 홈에서 누른 그 그림이 입력창에도 뜬다(10-02). 없으면 null. */
  function 표지(키) {
    var 찾음 = null;
    Object.keys(칸).forEach(function (b) { 칸[b].forEach(function (c) { if (!찾음 && (c.키 === 키 || (c.탭 && c.탭 === 키))) 찾음 = c; }); });
    return 찾음 ? 찾음.그림.replace('{g}', 성별()) : null;
  }

  /** 분류 키(love · match …) → 그 분류의 그림 칸 [{키, 탭, 주소}] — 홈 칸과 같은 차례. 아래 줄 「연애」 · 「궁합」 고르기 창(app.js 고르기창)이 쓴다(10-02).
   *  칸 표가 바뀌면 고르기 창도 같이 바뀐다(한 사실은 한 곳). 그림 칸이 없는 분류면 빈 배열. */
  function 묶음(b) { return (칸[b] || []).map(function (c) { return { 키: c.키, 탭: c.탭 || null, 주소: c.주소 || null }; }); }

  function 모두() { document.querySelectorAll('[data-home-cats]').forEach(그리기); }
  /** 맨 앞에 설 분류를 바꾸고 다시 그린다 — 블로그 꼬리표로 온 손님(landing.js)에게 온 길의 칸을 앞에.
   *  「무엇이 궁금하세요?」(home-ask.js)도 같은 분류의 물음을 먼저 펼친다 — 부르는 쪽은 이것 하나만 부르면 된다. */
  function 앞바꾸기(키들) { 앞 = (키들 || []).slice(); 모두(); try { if (global.ChaeksaHomeAsk) global.ChaeksaHomeAsk.앞바꾸기(키들); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 모두); else 모두();
  global.ChaeksaHomeCats = { 그리기: 그리기, 모두: 모두, 앞바꾸기: 앞바꾸기, 장길: 장길, 표지: 표지, 묶음: 묶음 };
})(typeof window !== 'undefined' ? window : globalThis);
