/* 무료 풀이 맨 아래 → 유료 「내게 맞는 일과 돈」(11-03 사장님 「홍보 작전 ㄱㄱ」 — 메인 몫 = 길 잇기).
 * 정통사주 · 정통자미두수를 끝까지 읽은 사람이 가장 가까운 손님이다. 세 관점 단추(to-three.js) 아래에 상품 칸 하나를 단다.
 * 글은 전부 장부(yaksok.js 「ilgyeol」 줄): 풀이끝말(칸 위 한 줄) · 이름 · 홈한줄 · 딱지({값}은 상품표) · 그림 · 견본. 메인은 글을 쓰지 않는다. 이름이 비면 그리지 않는다.
 * 주소에 ?from=<jeongtong|myeongban>-end 꼬리표 — 어느 풀이 끝에서 넘어왔는지 방문 통계(visits_stats sources)에 갈린다.
 * 사건: to_paid|<from>|ilgyeol · to_paid_sample|<from>|ilgyeol. */
(function (global) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 상품 = 'ilgyeol';
  function 칸(from) {
    var Y = global.ChaeksaYaksok; if (!Y || !from) return '';
    var r = (Y.줄 && Y.줄(상품)) || null, 이름 = Y.이름(상품);
    if (!r || !이름 || !r.탭) return '';
    var 꼬리 = 'from=' + encodeURIComponent(from + '-end');
    var 주소 = r.탭 + (r.탭.indexOf('?') < 0 ? '?' : '&') + 꼬리;
    var 견본 = r.견본 ? r.견본 + (r.견본.indexOf('?') < 0 ? '?' : '&') + 꼬리 : '';
    var 한줄 = Y.홈한줄 ? Y.홈한줄(상품) : '', 딱지 = Y.딱지html ? Y.딱지html(상품) : '';
    var 말 = r.풀이끝말 || '';   // 칸 위 한 줄(Codex — COPY-0032, 비면 건너뜀)
    return '<aside class="to-paid" data-from="' + esc(from) + '" aria-label="' + esc(이름) + '">'
      + (말 ? '<p class="to-paid-say">' + esc(말) + '</p>' : '')
      + '<a class="to-paid-card" href="' + esc(주소) + '" data-to-paid="' + esc(from) + '">'
      + (r.그림 ? '<img class="to-paid-img" src="' + esc(r.그림) + '" alt="" loading="lazy" decoding="async">' : '')
      + '<span class="to-paid-body"><strong class="to-paid-name">' + esc(이름) + '</strong>'
      + (한줄 ? '<span class="to-paid-line">' + esc(한줄) + '</span>' : '')
      + (딱지 ? '<span class="to-paid-tag">' + 딱지 + '</span>' : '') + '</span></a>'
      + (견본 ? '<a class="to-paid-sample" href="' + esc(견본) + '" data-to-paid-sample="' + esc(from) + '">보고서 견본 보기 →</a>' : '')
      + '</aside>';
  }
  function 달기(host, from) {
    if (!host || !host.querySelector || host.querySelector('.to-paid')) return;
    var h = 칸(from); if (!h) return;
    host.insertAdjacentHTML('beforeend', h);
    var box = host.querySelector('.to-paid');
    try { if (global.ChaeksaYaksok && global.ChaeksaYaksok.값채우기) global.ChaeksaYaksok.값채우기(box); } catch (e) {}
    var 셈 = function (이름) { return function () { try { if (global.ChaeksaTrack) global.ChaeksaTrack.event(이름 + '|' + from + '|' + 상품); } catch (e) {} }; };
    var a = box.querySelector('[data-to-paid]'), s = box.querySelector('[data-to-paid-sample]');
    if (a) a.addEventListener('click', 셈('to_paid'));
    if (s) s.addEventListener('click', 셈('to_paid_sample'));
  }
  global.ChaeksaToPaid = { 칸: 칸, 달기: 달기 };
})(typeof window !== 'undefined' ? window : globalThis);
