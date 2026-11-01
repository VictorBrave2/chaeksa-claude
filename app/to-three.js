/* 정통 시리즈 맨 아래 → 세 관점(11-02 사장님 「정통사주 + 맨하단 3관점 연결 · 정통자미두수 + 맨하단 3관점 연결 · 정통타로 + 맨하단 3관점 연결」).
 * 정통사주 · 정통자미두수 · 정통타로가 각각 풀이를 끝내고, 맨 아래에서 세 관점 메뉴로 넘어간다. 넘어갈 때 다시 넣을 것 없음 —
 *   생년월일은 people.js 의 고른 사람 그대로 · 정통타로에서 뽑은 카드는 세 관점과 같은 저장(three.js 「chaeksa.three.v2.<사람>」)이라 그대로 보인다.
 * 글은 장부(yaksok.js 「three」 줄): 이름(단추 글) · 정통끝말(단추 위 한 줄 — Codex, 비면 건너뜀). 메인은 글을 쓰지 않는다. 이름이 비면 칸을 그리지 않는다.
 * 사건: to_three|<jeongtong|myeongban|tarot> — 정통 시리즈에서 세 관점으로 넘어간 수. */
(function (global) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  // 같은 쪽(index.html 탭)이면 #three · 따로 선 쪽(myeongban.html)이면 ./?go=three
  var 주소 = { jeongtong: '#three', tarot: '#three', myeongban: './?go=three' };
  function 칸(from) {
    var Y = global.ChaeksaYaksok; if (!Y || !주소[from]) return '';
    var 이름 = Y.이름('three'); if (!이름) return '';
    var r = (Y.줄 && Y.줄('three')) || {}, 말 = r.정통끝말 || '';
    return '<nav class="to-three" data-from="' + from + '" aria-label="' + esc(이름) + '">' + (말 ? '<p class="to-three-say">' + esc(말) + '</p>' : '')
      + '<a class="btn to-three-go" href="' + 주소[from] + '" data-to-three="' + from + '">' + esc(이름) + ' <span aria-hidden="true">→</span></a></nav>';
  }
  function 달기(host, from) {
    if (!host || !host.querySelector || host.querySelector('.to-three')) return;
    var h = 칸(from); if (!h) return;
    host.insertAdjacentHTML('beforeend', h);
    var a = host.querySelector('[data-to-three]');
    if (a) a.addEventListener('click', function () { try { if (global.ChaeksaTrack) global.ChaeksaTrack.event('to_three|' + from); } catch (e) {} });
  }
  global.ChaeksaToThree = { 칸: 칸, 달기: 달기 };
})(typeof window !== 'undefined' ? window : globalThis);
