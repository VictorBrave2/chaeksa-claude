/* 「내 사람들」(saram.html, 작업판 36) — 10-12 사장님 「내 사람들 ㄱㄱ」 → 「십성대응표론 재미없잖아」 → 「관계 삭제하고 웹툰궁합 계산 가져오면 안 되나?」
 *   → 「72조를 사람 사이로 넓혀도 된다 · ㄱㄱ」(10-12 사장님 결정: 일지 = 내가 사람에게 바라는 것, 연애에 한정하지 않음).
 * 넣어 둔 사람(people.js — 이 기기에만, 서버로 안 보냄)마다 웹툰궁합 계산 그대로(ChaeksaSsomScore.재기 — 법전 72조 두 방향 · 네 단계, 73조 으뜸):
 *   나쪽.준다 = 그 사람이 내가 바라는 것을 준다 · 그쪽.준다 = 내가 그 사람이 바라는 것을 준다. 바라는 것 = 일지 본기 십신(대응표 뜻.중심으로 풀이).
 * 엄마 · 친구 · 팀장 같은 관계 구분은 쓰지 않는다. 단계 이름 · 한 줄은 메인 초안(사장님 검수 대상).
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var E = window.ChaeksaEngine, S = window.ChaeksaSipseong, PP = window.ChaeksaPeople, SC = window.ChaeksaSsomScore, SS = window.ChaeksaSsom;
  var 단계말 = {
    4: ['서로 주고받는 사람', '내가 바라는 것을 그 사람이 주고, 그 사람이 바라는 것을 내가 줘요.'],
    3: ['한쪽이 주는 사람', '한쪽은 바라는 것을 받고, 다른 쪽은 아직 받지 못해요. 그래도 깎이지는 않아요.'],
    2: ['한쪽은 주고 한쪽은 깎는 사람', '한쪽은 바라는 것을 받지만, 다른 쪽은 바라는 것이 오히려 깎여요.'],
    1: ['아직 주고받지 못하는 사람', '서로 바라는 것이 엇갈려, 맞춰 가야 하는 사이예요.'],
  };
  function 이름(p) { return (p.name && p.name !== '이름 없음' ? p.name : '') || p.relation || '이름 없음'; }
  function 명식(p) { try { return E.calc(PP.toProfile(p)); } catch (e) { return null; } }
  function 바람(R) { try { var k = SS.일지십신(R); return k ? k + ' — ' + ((S.뜻[k] || {}).중심 || '') : ''; } catch (e) { return ''; } }
  function 그리기() {
    try { PP.migrate(); } catch (e) {}
    var 나 = PP && PP.self();
    if (!나 || !나.birth || !나.birth.year) {
      $('me').innerHTML = '<div class="big"><p>먼저 <b>내 생년월일</b>을 넣어 주세요. 홈에서 내 사주를 한 번 보면 저절로 남아요.</p></div>';
      $('add').innerHTML = '<a class="btn" href="./">홈에서 내 생년월일 넣기</a>'; return;
    }
    var 나R = 명식(나), 다른 = PP.list().filter(function (p) { return p.id !== 나.id && p.birth && p.birth.year; });
    $('sub').textContent = '옛 책은 태어난 날의 땅 글자(일지)에 내가 사람에게 바라는 것이 있다고 봐요. 넣어 둔 사람마다, 그 사람이 내가 바라는 것을 주는지와 내가 그 사람이 바라는 것을 주는지를 봐요. 생년월일은 이 휴대폰에만 있어요.';
    var 내바람 = 바람(나R);
    var 칸 = {}, 서로 = 0, 으뜸들 = [];
    다른.forEach(function (p) {
      var R = 명식(p); if (!R || !나R) return;
      var r = SC.재기(나R, R), u = SC.으뜸(나R, R); if (r.단계 === 4) 서로++;
      if (u && u.기운) 으뜸들.push(이름(p));
      (칸[r.단계] = 칸[r.단계] || []).push('<div class="card pp"><div class="y" style="font-size:var(--t4)">' + esc(이름(p)) + (u && u.기운 ? ' <small style="color:var(--accent)">으뜸</small>' : '') + '</div>'
        + '<p>' + (r.나쪽.준다 ? '<b>그 사람은 내가 바라는 것을 줘요.</b>' : r.나쪽.깎는다 ? '그 사람의 언행은 내가 바라는 것을 오히려 깎아요.' : '그 사람은 내가 바라는 것을 아직 주지 않아요.') + '</p>'
        + '<p>' + (r.그쪽.준다 ? '<b>나는 그 사람이 바라는 것을 줘요.</b>' : r.그쪽.깎는다 ? '내 언행은 그 사람이 바라는 것을 오히려 깎아요.' : '나는 그 사람이 바라는 것을 아직 주지 않아요.') + '</p>'
        + '<p class="two">그 사람이 바라는 것: ' + esc(바람(R)) + '</p></div>');
    });
    $('me').innerHTML = '<div class="ring"><span class="me">나</span>' + 다른.map(function (p) { return '<span style="border:1px solid var(--line2);border-radius:999px;padding:8px 14px">' + esc(이름(p)) + '</span>'; }).join('') + '</div>'
      + (내바람 ? '<p class="why">내가 사람에게 바라는 것: <b>' + esc(내바람) + '</b></p>' : '');
    if (!다른.length) {
      $('out').innerHTML = '<div class="big"><p>아직 넣어 둔 사람이 없어요. <b>한 사람만</b> 넣어 보세요. 넣는 순간 그 사람과 내가 서로 바라는 것을 주고받는지 나와요.</p></div>';
    } else {
      $('out').innerHTML = '<div class="big"><p>넣어 둔 <b>' + 다른.length + '명</b> 가운데 서로 주고받는 사람은 <b>' + 서로 + '명</b>이에요.'
        + (으뜸들.length ? ' 그 가운데 ' + esc(으뜸들.join(' · ')) + '은(는) 옛 책이 가장 잘 맞물린다고 본 짜임(으뜸)이에요.' : '') + '</p></div>'
        + [4, 3, 2, 1].filter(function (k) { return 칸[k]; }).map(function (k) {
          return '<div class="grp"><p class="sec">' + esc(단계말[k][0]) + ' <small style="font-size:var(--t1);color:var(--ink3)">' + 칸[k].length + '명</small></p><p class="why">' + esc(단계말[k][1]) + '</p>' + 칸[k].join('') + '</div>';
        }).join('');
    }
    $('add').innerHTML = '<a class="btn ghost" href="./#addperson">사람 더 넣기</a> <span class="hint">넣고 나서 이 쪽으로 돌아오면 바로 보여요.</span>';
    try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('saram'); } catch (e) {}
  }
  그리기();
})();
