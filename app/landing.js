/* 도착지 맞추기 — 글이 약속한 것과 홈 첫 화면이 하는 말을 맞춘다 (2026-09-17 · 09-18 문 차례에 맞춰 다시 씀).
 *
 * 랜딩의 문은 한살이 차례로 서 있다 — 아이(#lpBaby, 출산택일 시뮬레이터) → 연애·나(#lpMe, 내 생년월일).
 * 꼬리표가 없으면 아무것도 안 한다. 있으면 **온 길에 맞는 문을 앞에 두고 말을 맞춘다**:
 *   출산택일 글에서 옴 → 아이 문은 이미 맨 위다. 시뮬레이터가 그 달로 열리게 꼬리표만 실어 보낸다.
 *   「왜」 글에서 옴   → 나 문을 맨 위로 올리고 「글에서 본 그것, 내 사주로」로 말을 바꾼다. 넣은 뒤엔 설명서 앞에 내려 준다.
 *
 * 실측(09-17): 유입의 거의 전부가 네이버 블로그인데 첫 방문 61명에 생년월일을 넣은 사람이 넷이었다.
 * 출산택일 글은 「넣으면 확인된다」고 약속하는데 홈은 연애 얘기만 하고 있었다.
 * 새 화면을 짓지 않는다 — 있는 문의 차례와 말만 바꾼다.
 */
(function () {
  'use strict';
  var tag = '';
  try { tag = new URLSearchParams(location.search).get('from') || ''; } catch (e) {}
  try { if (tag) sessionStorage.setItem('chaeksa.from', tag); else tag = sessionStorage.getItem('chaeksa.from') || ''; } catch (e) {}
  if (!tag) return;

  var 모드 = null;
  if (/^(blog|site)-(m\d+|taekil|solar|dec-fix|verify|choose|cesarean|price|doctor)/.test(tag) || /^taekil/.test(tag)) 모드 = '택일';
  else if (/^(blog|site)-(why|ohaeng|hoesa|chung|root|good|byeongo)/.test(tag)) 모드 = '왜';
  if (!모드) return;

  var $ = function (id) { return document.getElementById(id); };

  function 택일() {
    // 아이 문이 이미 맨 위다. 어느 글에서 왔는지만 실어 보낸다 — 시뮬레이터가 blog-m12 를 보고 12월로 연다.
    var b = $('btnBaby'); if (b) b.setAttribute('href', 'taekil-sim.html?from=' + encodeURIComponent(tag));
    var h = $('lpBaby') && $('lpBaby').querySelector('h1'); if (h) h.innerHTML = '표에서 고른 날짜,<br>세 고전은 어떻게 보나';
  }

  function 왜() {
    var me = $('lpMe'), baby = $('lpBaby');
    if (me && baby && baby.parentNode) {
      baby.parentNode.insertBefore(me, baby);                 // 나 문을 맨 위로
      me.classList.remove('lp-door2'); baby.classList.add('lp-door2');
      var bh = baby.querySelector('h1'); if (bh) { var h2 = document.createElement('h2'); h2.innerHTML = bh.innerHTML; bh.parentNode.replaceChild(h2, bh); }
      var bb = $('btnBaby'); if (bb) bb.classList.add('ghost');
      var bs = $('btnStart'); if (bs) bs.classList.remove('ghost');
    }
    var mh = $('lpMeH');
    if (mh) { var h1 = document.createElement('h1'); h1.id = 'lpMeH'; h1.innerHTML = '글에서 본 그것,<br>내 사주로 확인해 보세요'; mh.parentNode.replaceChild(h1, mh); }
    if ($('lpMeLead')) $('lpMeLead').innerHTML = '생년월일시를 넣으면 내 격과 다섯 칸이 바로 나와요.<br><b>회원가입 없이 무료</b>예요.';
    var eb = me && me.querySelector('.lp-eyebrow'); if (eb) eb.textContent = '나';
    var form = $('formCard');
    if (form) {
      var e1 = form.querySelector('.hero-eyebrow'), e2 = form.querySelector('.hero h3'), e3 = form.querySelector('.hero-sub');
      if (e1) e1.textContent = '내 사주로 확인';
      if (e2) e2.textContent = '생년월일시만 주세요.';
      if (e3) e3.innerHTML = '넣으시면 내 격과 다섯 칸부터 보여 드려요.';
    }
    // 넣은 뒤 — 글이 약속한 설명서 앞에 내려 준다. 이 방문에서 직접 넣었을 때 한 번만.
    var go = $('btnGo'); if (!go) return;
    go.addEventListener('click', function () {
      var 끝 = Date.now() + 8000;
      (function 기다리기() {
        var el = $('smMain');
        if (el && !el.classList.contains('hide') && el.offsetParent !== null) {
          setTimeout(function () { try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); } }, 250);
          return;
        }
        if (Date.now() < 끝) setTimeout(기다리기, 200);
      })();
    });
  }

  function 시작() { if (모드 === '택일') 택일(); else 왜(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작); else 시작();
})();
