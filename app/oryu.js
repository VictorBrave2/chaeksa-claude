/* 막혔을 때 한 칸 — 공용 오류 상자(10-02 개편 2묶음 「결제 뒤 · 결제 그만둠 · 오류 때 갈 길 만들기」).
 * 전에는 화면마다 「잠시 뒤 다시 해 주세요」 한 줄뿐이었다 — 무엇이 안 됐는지, 돈이 빠졌는지, 어디에 물어야 하는지 몰랐다.
 * 이제 모든 화면이 이 한 꼴을 같이 쓴다:
 *   무엇이 안 됐는지 → 왜 그럴 수 있는지(있으면) → (결제와 이어진 곳이면) 돈은 어떻게 됐는지 → [다시 하기] [문의하기]
 * 문의하기는 메일 앱을 연다. 제목 · 본문에 화면 이름 · 주문번호 · 안 된 것을 미리 채운다 — 생년월일 · 이름은 싣지 않는다(개인정보는 줄이는 쪽만).
 * 쓰는 곳: love.js · pair.js · jeongtong.js · app.js(정통궁합 · 웹툰궁합을 못 불러왔을 때) · pay-done.html · pay-fail.html(문의 메일).
 * 이 파일이 안 실린 쪽(약속 장부 시험 등)에서는 각 화면이 예전처럼 한 줄로 알린다 — 이 파일이 없다고 화면이 멈추지 않게.
 */
(function (global) {
  'use strict';
  var 메일 = 'dl4431@naver.com';   // 손님 문의 메일 — pay.js 주문서.문의메일 · 바닥글과 같은 주소
  // 돈 이야기 — 안빠짐: 결제창을 열기 전 · 결제 중에 막힘 / 남음: 결제한 뒤 만드는 중에 막힘(환불은 상품 약속 장부 「만들지 못해도 전액」과 같은 말)
  var 돈말 = {
    안빠짐: '결제되지 않았으니 돈은 빠지지 않았어요.',
    남음: '결제한 것은 이 카카오 계정에 그대로 남아 있어요. 다시 하기를 누르면 이어서 만들어요. 끝내 만들지 못하면 전액 돌려드려요.'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function 두(n) { return (n < 10 ? '0' : '') + n; }
  function 때() { var d = new Date(); return d.getFullYear() + '-' + 두(d.getMonth() + 1) + '-' + 두(d.getDate()) + ' ' + 두(d.getHours()) + ':' + 두(d.getMinutes()); }

  /** 문의 메일 주소(mailto:). o = {화면, 주문?, 무엇?, 코드?}. 생년월일 · 이름은 넣지 않는다. */
  function 메일주소(o) {
    o = o || {};
    var 화면 = String(o.화면 || '책사');
    var 제목 = '[책사] ' + 화면 + ' 문의' + (o.주문 ? ' ' + o.주문 : '');
    var 줄 = ['화면: ' + 화면, '주문번호: ' + (o.주문 || '없음')];
    if (o.무엇) 줄.push('안 된 것: ' + o.무엇);
    if (o.코드) 줄.push('코드: ' + String(o.코드).slice(0, 120));
    줄.push('때: ' + 때(), '', '무엇을 하다가 막혔는지 적어 주세요.', '');
    return 'mailto:' + 메일 + '?subject=' + encodeURIComponent(제목) + '&body=' + encodeURIComponent(줄.join('\r\n'));
  }

  /** 오류 상자 HTML. o = {무엇, 까닭?, 돈?: '안빠짐' | '남음', 더?: 덧붙일 한 줄, 화면, 주문?, 코드?, 다시?: 단추 말, 다시없음?: true}
   *  [다시 하기]는 data-oryu-retry 단추 — 넣은 뒤 잇기(root, 함수)로 잇는다(그리기는 같이 한다). */
  function html(o) {
    o = o || {};
    var 까닭 = o.까닭 && o.까닭 !== o.무엇 ? '<p>' + esc(o.까닭) + '</p>' : '';
    var 다시 = o.다시없음 ? '' : '<button type="button" class="btn small" data-oryu-retry>' + esc(o.다시 || '다시 하기') + '</button>';
    return '<div class="oryu" role="alert">'
      + '<p class="oryu-h">' + esc(o.무엇 || '지금은 이 화면을 열지 못했어요') + '</p>'
      + 까닭
      + (o.돈 && 돈말[o.돈] ? '<p>' + esc(돈말[o.돈]) + '</p>' : '')
      + (o.더 ? '<p>' + esc(o.더) + '</p>' : '')
      + '<div class="oryu-do">' + 다시 + '<a class="btn small ghost" href="' + esc(메일주소(o)) + '">문의하기</a></div>'
      + '<p class="hint">문의는 메일(' + 메일 + ')로 받아요. 화면 이름' + (o.주문 ? '과 주문번호를' : '을') + ' 미리 적어 두었어요.</p>'
      + '</div>';
  }

  /** root 안의 [다시 하기] 단추를 잇는다. 다시가 함수가 아니면 단추를 걷는다. 누르면 한 번만 돈다(두 번 눌러 두 번 부르지 않게). */
  function 잇기(root, 다시) {
    if (!root || !root.querySelectorAll) return;
    Array.prototype.forEach.call(root.querySelectorAll('[data-oryu-retry]'), function (b) {
      if (typeof 다시 !== 'function') { if (b.parentNode) b.parentNode.removeChild(b); return; }
      b.onclick = function () { if (b.disabled) return; b.disabled = true; 다시(); };
    });
  }

  /** box 에 오류 상자를 그리고 [다시 하기]를 잇는다. 다시 = 함수(없으면 단추 없이 문의하기만). */
  function 그리기(box, o, 다시) {
    if (!box) return;
    var 꼴 = {}; Object.keys(o || {}).forEach(function (k) { 꼴[k] = o[k]; });
    if (typeof 다시 !== 'function') 꼴.다시없음 = true;
    box.innerHTML = html(꼴);
    잇기(box, 다시);
  }

  /** 결제 단계에서 막혔을 때(결제창을 열기 전 · 결제 중) — 「돈은 빠지지 않았어요」. 자리를 비운 뒤 다시를 부른다. */
  function 결제(자리, 말, 화면, 다시) {
    그리기(자리, { 무엇: '결제를 시작하지 못했어요', 까닭: 말, 돈: '안빠짐', 화면: 화면 }, typeof 다시 === 'function' ? function () { 자리.innerHTML = ''; 다시(); } : null);
  }

  global.ChaeksaOryu = { html: html, 잇기: 잇기, 그리기: 그리기, 결제: 결제, 메일주소: 메일주소, 메일: 메일, 돈말: 돈말 };
})(typeof window !== 'undefined' ? window : globalThis);
