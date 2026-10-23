/* 출산택일 「왜 해야 하나」 넘겨 보는 네 장면(taekil.html 맨 위 #twhy) — 10-13 사장님 「출산택일을 왜 해야 하고 어떤 도움을 줄 수 있는지를 모션그래픽으로」 → 「ㄱㄱ」.
 * 손가락으로 한 장씩 넘긴다(저절로 돌지 않음). 장면마다 처음 들어올 때 한 번 움직이고 멈춘다. 움직임 줄이기면 처음부터 멈춘 그림.
 * 장면 1 예는 엔진 값(2026-12-09 09시 · 11시, 서울): 丙午 庚子 丁巳 甲辰 / 丙午 庚子 丁巳 乙巳 — 시주만 바뀐다.
 * 글은 작가 원고 window.TAEKIL_WHY(taekil-why-copy.js, 비공개 data/taekil-why-scenes-1013.json). 끝 줄은 사장님 말 그대로. */
(function () {
  'use strict';
  var box = document.getElementById('twhy'); if (!box) return;
  var C = window.TAEKIL_WHY || {}, S = C.장면 || [];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 기둥 = function (gz, 바뀜) { return '<div class="tw-pil">' + gz.split(' ').map(function (g, i) { return '<span class="tw-gz' + (바뀜 && i === 3 ? ' tw-flip' : '') + '">' + esc(g) + '</span>'; }).join('') + '</div>'; };
  var 달력 = function (n, 남) { var h = '<div class="tw-cal">'; for (var i = 1; i <= n; i++) h += '<span class="tw-d' + (남.indexOf(i) >= 0 ? ' keep' : '') + '" style="--i:' + i + '">' + i + '</span>'; return h + '</div>'; };
  var 그림 = [
    function () { return '<div class="tw-two"><div><small>12월 9일 오전 9시</small>' + 기둥('丙午 庚子 丁巳 甲辰') + '</div><div><small>같은 날 오전 11시</small>' + 기둥('丙午 庚子 丁巳 乙巳', true) + '</div></div>'; },
    function () { return 달력(21, [3, 4, 5, 6, 7, 10, 11, 12, 13, 14]).replace('tw-cal', 'tw-cal pick'); },
    function () { return 달력(21, [5, 12]).replace('tw-cal', 'tw-cal sift') + '<p class="tw-ex">예시 — 남는 날은 사람마다 달라요</p>'; },
    function () { return '<div class="tw-rep"><p><b>12월 5일 오전 9시 ~ 10시</b><br><small>이 시각을 고른 이유 — 옛 책 세 권의 근거</small></p><p><b>12월 12일 오후 1시 ~ 2시</b><br><small>이 시각을 고른 이유 — 옛 책 세 권의 근거</small></p></div><p class="tw-ex">보고서 예시 — 부모님 두 분의 생년월일시와 출산 예정 기간으로 날짜와 시각을 계산해요</p>'; },
  ];
  var i = 0;
  function 그리기() {
    var s = S[i] || {}, 끝 = i === 그림.length - 1;
    box.innerHTML = '<div class="tw-in tw-s' + i + '"><p class="tw-k">' + (i + 1) + ' / ' + 그림.length + '</p>'
      + '<p class="tw-h">' + esc(s.머리 || '') + '</p><div class="tw-art">' + 그림[i]() + '</div><p class="tw-t">' + esc(s.글 || '') + '</p>'
      + (끝 && (s.끝줄 || C.끝줄) ? '<p class="tw-end">' + esc(s.끝줄 || C.끝줄) + '</p>' : '')
      + '<div class="tw-btns">' + (끝 ? '<button type="button" data-tw="0">' + esc(C.처음 || '다시 보기') + '</button><a class="tw-go" href="taekil-apply.html">' + esc(C.끝단추 || '날짜 받아 보기') + '</a>'
        : '<button type="button" class="tw-next" data-tw="' + (i + 1) + '">' + esc(C.다음 || '다음') + ' →</button>') + '</div></div>';
  }
  // 10-13 효과 재기 — 4장면까지 넘김(tw4) · 「날짜 받아 보기」 누름(twgo). track.js 하루 한 번 꼴.
  var 잰 = function (k) { try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event(k); } catch (e) {} };
  box.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.tw-go')) 잰('twgo'); var b = e.target.closest && e.target.closest('[data-tw]'); if (!b) return; i = +b.getAttribute('data-tw'); if (i === 그림.length - 1) 잰('tw4'); 그리기(); });
  그리기();
})();
