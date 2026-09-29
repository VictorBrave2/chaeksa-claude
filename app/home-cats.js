/* 홈 = 분류 칸 — 09-30 사장님 「홈구성을 분류 → 연애 → 썸네일 삽화 터치하면 컨텐츠 입장 · 분류마다 하나씩 · 없는 컨텐츠라도 준비중으로 넣고 칸부터 · 모바일 전용」 · 「2줄 말고 한줄로 · 썸네일 작게 · 만화표지처럼 글씨를 그림 안에」.
 * 분류 이름 · 차례는 bunya.js 큰분야 표에서 읽는다(연애 먼저). 이 파일은 분류마다 어느 콘텐츠를 여는지와 썸네일만 안다.
 * 콘텐츠가 생기면 아래 칸 표에 한 줄 — 없으면 그 분류는 「준비중」. 누르면 들어가기(저장된 사람이 없으면 입구를 거쳐 그 탭). */
(function (global) {
  'use strict';
  // 분류 키 → 여는 콘텐츠(하나씩. 궁합만 있던 두 콘텐츠를 둘 다 둔다). 그림 {g} = f · m · 초점 = 얼굴이 보이는 세로 위치(%)
  var 칸 = {
    love: [{ 이름: '사랑할 때만 나오는 당신', 탭: 'love', 그림: 'art/love-cover-s.webp', 초점: 15 }],
    child: [{ 이름: '출산택일', 탭: 'taekil', 그림: 'art/taekil-main-s.webp', 초점: 25 }],
    match: [{ 이름: '정통궁합', 탭: 'chongnon', 그림: 'art/gunghap-main-s.webp', 초점: 15 }, { 이름: '웹툰궁합', 탭: 'ssom', 그림: 'art/ssom-main-s.webp', 초점: 22 }],
    me: [{ 이름: '정통사주', 탭: 'jeongtong', 그림: 'art/saju-main-s.webp', 초점: 13 }],
    time: [{ 이름: '이번 주엔 무엇이 바뀌나', 탭: 'home', 곳: 'bhCard', 그림: 'art/jt-18-ten-years-{g}-s.webp' }],
    learn: [{ 이름: '읽을거리', 주소: 'read.html', 그림: 'art/jt-g-jeongin-{g}-s.webp' }],
  };
  var 앞 = ['love'];   // 맨 앞에 설 분류

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 성별() { try { var p = JSON.parse(localStorage.getItem('chaeksa.profile') || 'null'); return p && p.gender === 'M' ? 'm' : 'f'; } catch (e) { return 'f'; } }

  function 그리기(el) {
    if (!el || !global.ChaeksaBunya) return;
    var 큰 = global.ChaeksaBunya.큰분야.slice();
    큰.sort(function (a, b) { var x = 앞.indexOf(a.키), y = 앞.indexOf(b.키); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
    var g = 성별(), html = '';
    큰.forEach(function (b) {
      var 목록 = 칸[b.키] || [null];
      목록.forEach(function (c, i) {
        if (!c) {
          html += '<div class="cat soon"><span class="k">' + esc(b.이름) + '</span><span class="n">준비중</span></div>';
          return;
        }
        // 만화 표지처럼 — 그림 위에 분류 딱지와 제목(09-30 사장님 「삽화안에 글씨를 넣고싶은데 만화표지처럼」)
        html += '<a class="cat" href="' + esc(c.주소 || '#') + '" data-cat="' + esc(b.키) + '" data-i="' + i + '">'
          + '<img src="' + esc(c.그림.replace('{g}', g)) + '" alt="" loading="lazy" style="object-position:center ' + (c.초점 == null ? 15 : c.초점) + '%">'
          + '<span class="k">' + esc(b.이름) + '</span><span class="n">' + esc(c.이름) + '</span></a>';   // 그림을 칸 가득 선명하게, 초점(%) = 얼굴 높이(09-30 「면상이 다 잘리잖니」 · 「흐릿하고 빈공간이 너무 많지않아?」)
      });
    });
    el.innerHTML = '<div class="cats">' + html + '</div>';
    el.querySelectorAll('a.cat').forEach(function (a) {
      var c = 칸[a.getAttribute('data-cat')][+a.getAttribute('data-i')];
      if (c.주소) return;
      a.onclick = function (e) {
        e.preventDefault();
        if (typeof global.책사들어가기 === 'function') global.책사들어가기(c.탭);
        if (c.곳) setTimeout(function () { var t = document.getElementById(c.곳); if (t && !t.classList.contains('hide')) t.scrollIntoView({ behavior: 'smooth' }); }, 350);
      };
    });
  }

  function 모두() { document.querySelectorAll('[data-home-cats]').forEach(그리기); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 모두); else 모두();
  global.ChaeksaHomeCats = { 그리기: 그리기, 모두: 모두 };
})(typeof window !== 'undefined' ? window : globalThis);
