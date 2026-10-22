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
    3: ['한쪽이 주는 사람', '한쪽은 바라는 것을 받고, 다른 쪽은 바라는 것을 받지 못해요. 그래도 반대로 가지는 않아요.'],
    2: ['한쪽은 주고 한쪽은 거스르는 사람', '한쪽은 바라는 것을 받지만, 다른 쪽은 바라는 것과 반대되는 말과 행동을 받아요.'],
    1: ['서로 주고받지 못하는 사람', '서로 바라는 것이 엇갈려, 맞춰 가야 하는 사이예요. 각 카드의 「바라는 사람」에 적힌 것을 그 사람에게 일부러 해 주세요.'],
  };
  function 이름(p) { return (p.name && p.name !== '이름 없음' ? p.name : '') || p.relation || '이름 없음'; }
  function 명식(p) { try { return E.calc(PP.toProfile(p)); } catch (e) { return null; } }
  function 바람(R) { try { var k = SS.일지십신(R); return k ? k + ' — ' + ((S.뜻[k] || {}).중심 || '') : ''; } catch (e) { return ''; } }
  // 10-12 사장님 「이 컨텐츠의 목적은 새로 만난 사람에 대해 한눈에 알아보기」 · 「이 사람은 원래 이래로 가」 — 카드 한 장 네 줄, 모두 시 없이.
  //   ① 언행 = 앞선 식상(식신 · 상관 · 없음) × 일간 오행 ② 바람 = 일지 본기 십신 ③ 나와 주고받나 = 72조 두 방향 ④ 언제 달라지나 = 72조 ⑨ 일지변질(짝 지지가 오는 해).
  //   문장은 작가 원고 saram-copy.js(비공개 data/saram-card-copy-1012.json).
  var 방금 = null;
  var C = window.SARAM_COPY || { 언행: {}, 바람: {} }, 오행 = ['木', '火', '土', '金', '水'];
  function 언행말(R) {
    var a = (SS.언행(R) || [])[0], k = a && (a.십신 === '식신' || a.십신 === '상관') ? a.십신 : '없음';
    return C.언행[k + '|' + 오행[E.STEM_ELEM[R.pillars.day.stem]]] || '';
  }
  function 바람말(십신) { return C.바람[십신] || ''; }
  function 달라짐(R) {
    var v = null; try { v = SS.일지변질(R); } catch (e) {}
    if (!v || !v.짝) return '';
    var 올해 = new Date().getFullYear(), b = E.BRANCHES.indexOf(v.짝);
    for (var y = 올해; y < 올해 + 12; y++) if ((((y - 4) % 12) + 12) % 12 === b) return y + '년(' + v.짝 + '년)엔 바라는 것이 바뀌어요 — ' + 바람말(v.후);
    return '';
  }
  function 카드(p, R, r, u) {
    var 주고 = r.나쪽.준다 && r.그쪽.준다 ? '서로 바라는 것을 주고받아요.' : r.나쪽.준다 ? '이 사람은 내가 바라는 것을 줘요. 나는 이 사람이 바라는 것을 못 줘요. 이 사람에게는 위 「바라는 사람」에 적힌 것을 일부러 해 주세요.' : r.그쪽.준다 ? '나는 이 사람이 바라는 것을 줘요. 이 사람은 내가 바라는 것을 못 줘요.' : '서로 바라는 것이 엇갈려요. 이 사람에게는 위 「바라는 사람」에 적힌 것을 일부러 해 주세요.';
    if (r.나쪽.깎는다) 주고 += ' 이 사람의 말과 행동은 내가 바라는 것과 반대로 가요.';
    if (r.그쪽.깎는다) 주고 += ' 내 말과 행동은 이 사람이 바라는 것과 반대로 가요.';
    var 줄 = function (머리, 말) { return 말 ? '<p class="ln"><b>' + esc(머리) + '</b> ' + esc(말) + '</p>' : ''; };
    return '<div class="card pp"><div class="y" style="font-size:var(--t4)">' + esc(이름(p)) + (u && u.기운 ? ' <small style="color:var(--accent)">서로 바라는 것을 살려 주는 사이(으뜸)</small>' : '') + '</div>'
      + 줄('말과 행동', 언행말(R)) + 줄('바라는 사람', 바람말(SS.일지십신(R))) + 줄('나와는', 주고) + 줄('달라지는 때', 달라짐(R)) + '</div>';
  }
  // 새로 만난 사람 넣기 — 이름 · 생년월일만(시 없이). 이 기기에만 저장(people.js).
  function 넣기칸() {
    return '<form id="nf" class="card"><p class="sec" style="margin-top:0">새로 만난 사람</p><div class="row"><input id="nn" placeholder="이름 (예: 김대리)" maxlength="20"></div>'
      + '<div class="row" style="margin-top:8px"><input id="ny" type="number" inputmode="numeric" placeholder="1995" min="1920" max="2025"><input id="nm" type="number" inputmode="numeric" placeholder="월" min="1" max="12"><input id="nd" type="number" inputmode="numeric" placeholder="일" min="1" max="31"></div>'
      + '<div class="seg" style="margin-top:8px"><label><input type="radio" name="ng" value="M" checked><span>남</span></label><label><input type="radio" name="ng" value="F"><span>여</span></label></div>'
      + '<button class="go" type="submit">한눈에 보기</button><p class="err" id="nerr"></p></form>';
  }
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'nf') return; e.preventDefault();
    var y = +$('ny').value, m = +$('nm').value, d = +$('nd').value, g = (document.querySelector('input[name=ng]:checked') || {}).value || 'M';
    if (!y || !m || !d) { $('nerr').textContent = '생년월일을 다 넣어 주세요.'; return; }
    var np = null;
    try { np = PP.add({ name: ($('nn').value || '').trim() || '새로 만난 사람', relation: '친구', birth: { year: y, month: m, day: d, hour: null, minute: null, gender: g, calendar: 'solar', place: 'KR:서울', longitude: 126.98, tzOffset: 9 } }); } catch (e2) { $('nerr').textContent = '넣지 못했어요.'; return; }
    방금 = np && np.id ? np.id : (typeof np === 'string' ? np : null); 그리기(); try { $('out').scrollIntoView({ block: 'start' }); } catch (e3) {}
  });
  function 그리기() {
    try { PP.migrate(); } catch (e) {}
    var 나 = PP && PP.self();
    if (!나 || !나.birth || !나.birth.year) {
      $('me').innerHTML = '<div class="big"><p>먼저 <b>내 생년월일</b>을 넣어 주세요. 홈에서 내 사주를 한 번 보면 저절로 남아요.</p></div>';
      $('add').innerHTML = '<a class="btn" href="./">홈에서 내 생년월일 넣기</a>'; return;
    }
    var 나R = 명식(나), 다른 = PP.list().filter(function (p) { return p.id !== 나.id && p.birth && p.birth.year; });
    $('sub').textContent = '태어난 날의 글자(일지)에는 내가 사람에게 바라는 것이 들어 있어요. 넣어 둔 사람마다, 그 사람이 내가 바라는 것을 주는지와 내가 그 사람이 바라는 것을 주는지를 봐요. 생년월일은 이 휴대폰에만 있어요.';
    var 내바람 = 바람(나R);
    var 칸 = {}, 서로 = 0, 으뜸들 = [];
    다른.forEach(function (p) {
      var R = 명식(p); if (!R || !나R) return;
      var r = SC.재기(나R, R), u = SC.으뜸(나R, R); if (r.단계 === 4) 서로++;
      if (u && u.기운) 으뜸들.push(이름(p));
      (칸[r.단계] = 칸[r.단계] || []).push(카드(p, R, r, u));
    });
    $('me').innerHTML = 넣기칸() + '<div class="ring"><span class="me">나</span>' + 다른.map(function (p) { return '<span style="border:1px solid var(--line2);border-radius:999px;padding:8px 14px">' + esc(이름(p)) + '</span>'; }).join('') + '</div>'
      + (내바람 ? '<p class="why">내가 사람에게 바라는 것: <b>' + esc(내바람) + '</b></p>' : '');
    if (!다른.length) {
      $('out').innerHTML = '<div class="big"><p>아직 넣어 둔 사람이 없어요. <b>한 사람만</b> 넣어 보세요. 넣는 순간 그 사람과 내가 서로 바라는 것을 주고받는지 나와요.</p></div>';
    } else {
      var 맨위 = '';
      if (방금) { var bp = PP.get(방금), bR = bp && 명식(bp); if (bR) 맨위 = '<p class="sec">방금 넣은 사람</p>' + 카드(bp, bR, SC.재기(나R, bR), SC.으뜸(나R, bR)); }
      $('out').innerHTML = 맨위 + '<div class="big"><p>넣어 둔 <b>' + 다른.length + '명</b> 가운데 서로 주고받는 사람은 <b>' + 서로 + '명</b>이에요.'
        + (으뜸들.length ? ' 그 가운데 ' + esc(으뜸들.join(' · ')) + ' 님과는 타고난 바탕부터 서로가 서로의 바라는 것을 살려 주는 사이예요(으뜸).' : '') + '</p></div>'
        + [4, 3, 2, 1].filter(function (k) { return 칸[k]; }).map(function (k) {
          return '<div class="grp"><p class="sec">' + esc(단계말[k][0]) + ' <small style="font-size:var(--t1);color:var(--ink3)">' + 칸[k].length + '명</small></p><p class="why">' + esc(단계말[k][1]) + '</p>' + 칸[k].join('') + '</div>';
        }).join('');
    }
    $('add').innerHTML = '';
    try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('saram'); } catch (e) {}
  }
  그리기();
})();
