/* 도착지 맞추기 — 글이 약속한 것과 홈 첫 화면이 하는 말을 맞춘다 (2026-09-17).
 *
 * 실측(funnel_stats·visits_stats, 09-17): 유입의 거의 전부가 네이버 블로그인데, 들어온 사람 가운데 생년월일을 넣는 사람이 열에 하나가 안 됐다.
 * 출산택일 글은 「위 날짜와 시각을 chaeksa.kr 에 넣으면 사주가 그대로 나옵니다. 표와 같게 나오는지 확인해 보세요」라고 약속하는데,
 * 홈은 「그 사람 때문에 궁금해진 모든 이야기 · 내 생년월일 넣기」였다. 아기 날짜를 확인하러 온 사람한테 연애 얘기를 하고 본인 생일을 달라고 한 것이다.
 * 넣어도 원국은 연애 카드 밑에 묻혀 있었다.
 *
 * 하는 일: from 꼬리표로 어느 글에서 왔는지 알아보고 ① 첫 화면의 말 ② 입력 칸의 말 ③ 넣은 뒤 도착 위치만 바꾼다.
 * 새 화면을 짓지 않는다. 꼬리표가 없으면 아무것도 안 한다.
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
  var 말 = {
    택일: {
      h1: '표에서 고른 날짜,<br>사주로 확인해 보세요',
      lead: '날짜를 고르면 그날 열두 시진마다 세 고전이 각자 본 것을 보여 드려요.<br><b>회원가입 없이 무료</b>예요.',
      cta: '날짜 넣어 보기', hint: '날짜만 있으면 돼요',
      eyebrow: '출산택일 확인', h3: '날짜와 시각만 주세요.',
      sub: '글의 표에 나온 날짜·시각을 그대로 넣으세요.<br>같은 사주가 나오는지 바로 보여 드려요.',
      name: '예: 우리 아기', year: '2026', 도착: 'wgMain',
      쪽지: '<b>글의 표와 같은 네 기둥인지 확인해 보세요.</b><br>시각은 시계 시각 그대로 넣으시면 돼요. 진태양시 보정은 저희가 해요.<br><a href="taekil.html">출산택일 안내로 돌아가기</a> · <a href="taekil-apply.html?from=landing">보고서 신청</a>',
    },
    왜: {
      h1: '글에서 본 그것,<br>내 사주로 확인해 보세요',
      lead: '생년월일시를 넣으면 내 격과 다섯 칸이 바로 나와요.<br><b>회원가입 없이 무료</b>예요.',
      cta: '내 생년월일 넣기', hint: '생년월일시만 있으면 돼요',
      eyebrow: '내 사주로 확인', h3: '생년월일시만 주세요.',
      sub: '넣으시면 내 격과 다섯 칸부터 보여 드려요.',
      name: null, year: null, 도착: 'smMain', 쪽지: null,
    },
  }[모드];

  function 바꾸기() {
    var hero = $('lpHero');
    if (hero) {
      var h1 = hero.querySelector('h1'), lead = hero.querySelector('.lp-lead');
      if (h1) h1.innerHTML = 말.h1;
      if (lead) lead.innerHTML = 말.lead;
    }
    if ($('btnStart')) $('btnStart').textContent = 말.cta;
    if ($('lpStartHint')) $('lpStartHint').textContent = 말.hint;
    var form = $('formCard');
    if (form) {
      var eb = form.querySelector('.hero-eyebrow'), h3 = form.querySelector('.hero h3'), sub = form.querySelector('.hero-sub');
      if (eb) eb.textContent = 말.eyebrow;
      if (h3) h3.textContent = 말.h3;
      if (sub) sub.innerHTML = 말.sub;
    }
    // 택일 글에서 온 사람은 큰 단추가 이미 시뮬레이터로 간다 — 둘째 문(#lpBaby)을 겹쳐 보일 까닭이 없다.
    if (모드 === '택일' && $('lpBaby')) $('lpBaby').classList.add('hide');
    if (말.name && $('name')) $('name').placeholder = 말.name;
    if (말.year && $('y')) $('y').placeholder = 말.year;
  }

  // 넣은 뒤 — 글이 약속한 것이 있는 데로 데려간다. 이 방문에서 직접 넣었을 때 한 번만.
  function 도착걸기() {
    var go = $('btnGo'); if (!go) return;
    go.addEventListener('click', function () {
      var 끝 = Date.now() + 8000;
      (function 기다리기() {
        var el = $(말.도착);
        if (el && !el.classList.contains('hide') && el.offsetParent !== null) {
          if (말.쪽지 && !$('lpNote')) {
            var n = document.createElement('div');
            n.id = 'lpNote'; n.className = 'card'; n.setAttribute('data-plain', '1');
            n.innerHTML = '<p style="margin:0;font-size:14px;line-height:1.8">' + 말.쪽지 + '</p>';
            el.parentNode.insertBefore(n, el);
          }
          var 대상 = $('lpNote') || el;
          setTimeout(function () { try { 대상.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { 대상.scrollIntoView(); } }, 250);
          return;
        }
        if (Date.now() < 끝) setTimeout(기다리기, 200);
      })();
    });
  }

  // 택일 글에서 온 사람은 「내 생년월일」을 넣을 까닭이 없다 — 시뮬레이터로 바로 보낸다(09-17). 사주를 저장하지 않아도 열린다.
  function 시뮬레이터로() {
    ['btnStart', 'btnStart2'].forEach(function (id) {
      var b = $(id); if (!b) return;
      b.onclick = function () { location.href = 'taekil-sim.html?from=' + encodeURIComponent(tag); };
    });
  }

  function 시작() { 바꾸기(); if (모드 === '택일') 시뮬레이터로(); else 도착걸기(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작); else 시작();
})();
