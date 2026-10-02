/* 도착지 맞추기 — 글이 약속한 것과 홈 첫 화면이 하는 말을 맞춘다 (2026-09-17 처음 · 10-02 지금 홈에 맞춰 다시 씀).
 *
 * 유입은 거의 다 네이버 블로그 · 사이트 글이다. 글 끝 링크에는 ?from= 꼬리표가 붙어 온다(blog-m12 · site-why …).
 * 꼬리표가 없으면 아무것도 안 한다 — 처음 온 손님은 지금 홈 그대로(연애 칸이 맨 앞).
 * 있으면 **온 길의 분류 칸을 맨 앞에 세우고, 첫 줄(홈 소개 h1)을 글의 말로 바꾼다**:
 *   출산택일 글(blog/site-m12 · gt12 · taekil … · taekil-* · yt) → 「아이」 칸이 맨 앞 · 「표에서 고른 날짜, 세 고전은 어떻게 보나」.
 *       칸을 누르면 출산택일 탭이 생년월일 없이 바로 열리고, 그 안 시뮬레이터(taekilsim.js 첫날)가 주소 · 이 탭에 남긴 꼬리표를 보고 글의 그 달로 연다.
 *   「왜」 글 · 신살 글(why · ohaeng · chung … · gwaegang · baekho) → 「나」(정통사주) 칸이 맨 앞 · 「글에서 본 그것, 내 사주로 확인해 보세요」.
 *   도화 · 홍염 · 그 남자 돈 글 → 「연애」 칸이 맨 앞(첫 줄은 그대로 — 연애 콘텐츠는 결제 전엔 예시만이라 「확인해 보세요」라고 약속하지 않는다).
 *   속궁합 글(sok) → 「궁합」 칸이 맨 앞(첫 줄 그대로).
 *   친구가 보낸 카드 링크(card-…)는 여기서 다루지 않는다 — app.js 입력준비가 「친구가 보낸 …」 띠를 단다.
 * 칸 차례는 home-cats.js 앞바꾸기 하나로 바꾼다(「무엇이 궁금하세요?」 물음 칸도 같이 그 갈래부터 펼친다).
 * 새 화면을 짓지 않는다 — 있는 칸의 차례와 첫 줄 말만 바꾼다. 꼬리표는 이 탭(sessionStorage)에 남겨 다른 화면에 갔다 와도 같다.
 *
 * 10-02 옛 코드(#lpBaby · #lpMe 문을 옮기던 것)는 걷었다 — 09-25 첫 화면을 그림 칸으로 바꾼 뒤 그 칸들이 없어 아무 일도 안 하고 있었다.
 */
(function () {
  'use strict';
  var tag = '';
  try { tag = new URLSearchParams(location.search).get('from') || ''; } catch (e) {}
  try { if (tag) sessionStorage.setItem('chaeksa.from', tag); else tag = sessionStorage.getItem('chaeksa.from') || ''; } catch (e) {}
  if (!tag) return;

  // 꼬리표 → 맨 앞 분류(bunya.js 큰분야 키)와 첫 줄. 첫 줄이 null 이면 홈 소개 그대로.
  var 길 = null;
  if (/^(blog|site)-(m\d|gt\d|taekil|solar|dec-fix|verify|choose|cesarean|price|doctor|c\d)/.test(tag) || /^taekil/.test(tag) || /^yt(-|$)/.test(tag)) {
    var mm = /-(?:m|gt)(\d{1,2})$/.exec(tag), 달 = mm && +mm[1] >= 1 && +mm[1] <= 12 ? +mm[1] + '월 ' : '';
    길 = { 앞: ['child'], 첫줄: '표에서 고른 ' + 달 + '날짜,<br>세 고전은 어떻게 보나' };
  } else if (/^(blog|site|naver)-(why|ohaeng|hoesa|chung|root|good|byeongo|ai3|how-good|gwaegang|baekho)/.test(tag) || /^why-/.test(tag)) {
    길 = { 앞: ['me'], 첫줄: '글에서 본 그것,<br>내 사주로 확인해 보세요' };
  } else if (/^(blog|site|naver)-(dohwa|hongyeom)/.test(tag) || tag === 'don') {
    길 = { 앞: ['love'], 첫줄: null };
  } else if (tag === 'sok') {
    길 = { 앞: ['match'], 첫줄: null };
  }
  if (!길) return;

  // 칸 차례 — 이 파일은 맨 끝에 불려서 홈 칸 자리([data-home-cats])가 이미 있다. 지금 바꿔 두면 처음 그릴 때부터 그 차례로 선다
  // (홈 첫 그림을 연애 표지로 먼저 받았다가 바꾸지 않게).
  try { if (window.ChaeksaHomeCats && window.ChaeksaHomeCats.앞바꾸기) window.ChaeksaHomeCats.앞바꾸기(길.앞); } catch (e) {}

  function 첫줄() {
    if (!길.첫줄) return;
    var h = document.querySelector('#landing .home-intro .hi-t');
    if (h) h.innerHTML = 길.첫줄;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 첫줄); else 첫줄();
})();
