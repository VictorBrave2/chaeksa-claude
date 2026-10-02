/* 홈 = 분류 칸 — 09-30 사장님 「홈구성을 분류 → 연애 → 썸네일 삽화 터치하면 컨텐츠 입장 · 분류마다 하나씩 · 없는 컨텐츠라도 준비중으로 넣고 칸부터 · 모바일 전용」 · 「2줄 말고 한줄로 · 썸네일 작게 · 만화표지처럼 글씨를 그림 안에」.
 * 분류 이름 · 차례는 bunya.js 큰분야 표에서 읽는다(연애 먼저). 이 파일은 분류마다 어느 콘텐츠를 여는지와 썸네일만 안다.
 * 콘텐츠가 생기면 아래 칸 표에 한 줄 — 없으면 그 분류는 「준비중」. 누르면 들어가기(저장된 사람이 없으면 입구를 거쳐 그 탭). */
(function (global) {
  'use strict';
  // 분류 키 → 여는 콘텐츠(하나씩. 궁합만 있던 두 콘텐츠를 둘 다 둔다). 그림 {g} = f · m.
  // 09-30 사장님 「메뉴 한칸을 삽화 원본사이즈만큼으로 늘려주고 삽화 화질을 줄이지 않았으면해」 — 줄인 그림(-s) 대신 받은 원본 그대로, 칸 높이 = 그림 비율(안 자름). 크기 = [가로, 세로]
  var 칸 = {
    love: [{ 이름: '사랑할 때만 나오는 당신', 탭: 'love', 그림: 'art/love-cover.webp', 크기: [1086, 1448] }],
    child: [{ 이름: '출산택일', 탭: 'taekil', 그림: 'art/taekil-main.webp', 크기: [1086, 1448] }],
    match: [{ 이름: '정통궁합', 탭: 'chongnon', 그림: 'art/gunghap-main.webp', 크기: [1086, 1448] }, { 이름: '웹툰궁합', 탭: 'ssom', 그림: 'art/ssom-main.webp', 크기: [1086, 1448] }, { 이름: 'SSS급 그 사람 사용설명서', 탭: 'pair', 그림: 'art/story-friend-to-lover.webp', 크기: [1024, 1536] }],
    me: [{ 이름: '정통사주', 탭: 'jeongtong', 그림: 'art/saju-main.webp', 크기: [1086, 1448] }],
    time: [{ 이름: '이번 주엔 무엇이 바뀌나', 탭: 'home', 곳: 'bhCard', 그림: 'art/jt-18-ten-years-{g}.webp', 크기: [1024, 1536] }],
    learn: [{ 이름: '읽을거리', 주소: 'read.html', 그림: 'art/jt-g-jeongin-{g}.webp', 크기: [1024, 1536] }],
  };
  var 앞 = ['love'];   // 맨 앞에 설 분류

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 성별() { try { var p = JSON.parse(localStorage.getItem('chaeksa.profile') || 'null'); return p && p.gender === 'M' ? 'm' : 'f'; } catch (e) { return 'f'; } }

  function 그리기(el) {
    if (!el || !global.ChaeksaBunya) return;
    var 큰 = global.ChaeksaBunya.큰분야.slice();
    큰.sort(function (a, b) { var x = 앞.indexOf(a.키), y = 앞.indexOf(b.키); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
    var g = 성별(), html = '', 첫 = true;
    큰.forEach(function (b) {
      var 목록 = 칸[b.키] || [null];
      목록.forEach(function (c, i) {
        if (!c) {
          html += '<div class="cat soon"><span class="k">' + esc(b.이름) + '</span><span class="n">준비중</span></div>';
          return;
        }
        // 만화 표지처럼 — 그림 위에 분류 딱지와 제목(09-30 사장님 「삽화안에 글씨를 넣고싶은데 만화표지처럼」)
        html += '<a class="cat" href="' + esc(c.주소 || '#') + '" data-cat="' + esc(b.키) + '" data-i="' + i + '">'
          + '<img src="' + esc(c.그림.replace('{g}', g)) + '" alt="" width="' + c.크기[0] + '" height="' + c.크기[1] + '" decoding="async"' + (첫 ? '' : ' loading="lazy"') + '>'
          + '<span class="k">' + esc(b.이름) + '</span><span class="n">' + esc(c.이름) + '</span></a>';   // 그림 전체를 원본 비율 그대로(자르지 않음) — 칸이 그림만큼 길어진다
        첫 = false;
      });
    });
    el.innerHTML = '<div class="cats">' + html + '</div>';
    el.querySelectorAll('a.cat').forEach(function (a) {
      var c = 칸[a.getAttribute('data-cat')][+a.getAttribute('data-i')];
      if (c.주소) return;
      a.onclick = function (e) {
        e.preventDefault();
        // 곳(칸)도 같이 넘긴다 — 입력을 거쳐 오면 시간이 흐르니 app.js 도착() 이 그 탭을 연 뒤 그 칸으로 내려간다(10-02, 옛 350ms 타이머는 입력 중에 헛돌았다).
        if (typeof global.책사들어가기 === 'function') global.책사들어가기(c.탭, c.곳);
      };
    });
  }

  function 모두() { document.querySelectorAll('[data-home-cats]').forEach(그리기); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 모두); else 모두();
  global.ChaeksaHomeCats = { 그리기: 그리기, 모두: 모두 };
})(typeof window !== 'undefined' ? window : globalThis);
