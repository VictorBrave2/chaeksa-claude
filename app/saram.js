/* 「내 사람들」(saram.html, 작업판 36) — 10-12 사장님 「내 사람들 ㄱㄱ」.
 * 넣어 둔 사람(people.js — 이 기기에만 저장, 서버로 보내지 않음)마다:
 *   그 사람은 나에게 = 내 일간 기준 그 사람 일간의 십성 · 나는 그 사람에게 = 그 사람 일간 기준 내 일간의 십성(engine.js tenGod).
 *   말은 십성 대응표(sipseong.js 뜻[십성].중심) 그대로. 무리(인성 · 비겁 · 식상 · 재성 · 관성)로 묶어 「나를 받쳐 주는 쪽」(인성)을 맨 앞에.
 * 판정 · 점수 없음. 무리 머리 말은 메인 초안 — 사장님 검수 대상. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var E = window.ChaeksaEngine, S = window.ChaeksaSipseong, PP = window.ChaeksaPeople;
  var 무리 = { 정인: '인성', 편인: '인성', 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 정재: '재성', 편재: '재성', 정관: '관성', 편관: '관성' };
  var 무리머리 = [
    ['인성', '나를 받쳐 주는 사람', '그 사람의 일간이 내 일간을 낳는 자리(인성)예요.'],
    ['비겁', '나와 나란히 선 사람', '그 사람의 일간이 내 일간과 같은 기운(비겁)이에요.'],
    ['식상', '내가 챙기고 내놓는 사람', '내 일간이 그 사람의 일간을 낳는 자리(식상)예요.'],
    ['재성', '내가 맡아 꾸려 가는 사람', '내 일간이 그 사람의 일간을 누르는 자리(재성)예요.'],
    ['관성', '나에게 기준을 세우는 사람', '그 사람의 일간이 내 일간을 누르는 자리(관성)예요.'],
  ];
  function 이름(p) { return (p.name && p.name !== '이름 없음' ? p.name : '') + (p.relation && p.relation !== '나' ? (p.name ? ' · ' : '') + p.relation : '') || '이름 없음'; }
  function 일간(p) { try { var R = E.calc(PP.toProfile(p)); return R.pillars.day.stem; } catch (e) { return null; } }
  function 십성(기준, 상대) { return E.TEN_GODS[E.tenGod(기준, 상대)]; }
  function 그리기() {
    var 나 = PP && PP.self(), 다른 = [];
    try { PP.migrate(); } catch (e) {}
    if (!나 || !나.birth || !나.birth.year) {
      $('me').innerHTML = '<div class="big"><p>먼저 <b>내 생년월일</b>을 넣어 주세요. 홈에서 내 사주를 한 번 보면 저절로 남아요.</p></div>';
      $('add').innerHTML = '<a class="btn" href="./">홈에서 내 생년월일 넣기</a>'; return;
    }
    var 내간 = 일간(나);
    다른 = PP.list().filter(function (p) { return p.id !== 나.id && p.birth && p.birth.year; });
    $('sub').textContent = '넣어 둔 사람마다, 그 사람이 나에게 어떤 사람인지와 내가 그 사람에게 어떤 사람인지를 태어난 날의 글자(일간)로 봐요. 생년월일은 이 휴대폰에만 있어요.';
    $('me').innerHTML = '<div class="ring"><span class="me">나 · ' + esc(E.STEMS[내간]) + '</span>' + 다른.map(function (p) { return '<span class="who-b" style="border:1px solid var(--line2);border-radius:999px;padding:8px 14px">' + esc(이름(p)) + '</span>'; }).join('') + '</div>';
    if (!다른.length) {
      $('out').innerHTML = '<div class="big"><p>아직 넣어 둔 사람이 없어요. <b>한 사람만</b> 넣어 보세요 — 엄마, 친구, 팀장 누구든요. 넣는 순간 그 사람이 나에게 어떤 사람인지 나와요.</p></div>';
    } else {
      var 칸 = {};
      다른.forEach(function (p) {
        var 그간 = 일간(p); if (그간 == null) return;
        var 가 = 십성(내간, 그간), 나는 = 십성(그간, 내간), m = 무리[가];
        (칸[m] = 칸[m] || []).push('<div class="card pp"><div class="y" style="font-size:var(--t4)">' + esc(이름(p)) + ' <small>' + esc(E.STEMS[그간]) + '</small></div>'
          + '<p>그 사람은 나에게 <b>' + esc(가) + '</b> — ' + esc((S.뜻[가] || {}).중심 || '') + '</p>'
          + '<p class="two">나는 그 사람에게 <b>' + esc(나는) + '</b> — ' + esc((S.뜻[나는] || {}).중심 || '') + '</p></div>');
      });
      $('out').innerHTML = 무리머리.filter(function (g) { return 칸[g[0]]; }).map(function (g) {
        return '<div class="grp"><p class="sec">' + esc(g[1]) + ' <small style="font-size:var(--t1);color:var(--ink3)">' + 칸[g[0]].length + '명</small></p><p class="why">' + esc(g[2]) + '</p>' + 칸[g[0]].join('') + '</div>';
      }).join('');
    }
    $('add').innerHTML = '<a class="btn ghost" href="./#addperson">사람 더 넣기</a> <span class="hint">넣고 나서 이 쪽으로 돌아오면 바로 보여요.</span>';
    try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('saram'); } catch (e) {}
  }
  그리기();
})();
