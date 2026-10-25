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
    4: ['서로 주고받는 사람', '서로 바라는 것을 주고받아요. 당신이 바라는 것을 그 사람이 주고, 그 사람이 바라는 것을 당신이 줘요.'],
    3: ['한쪽만 주는 사람', '한쪽만 상대가 바라는 것을 줘요. 한쪽은 바라는 것을 받고, 다른 쪽은 바라는 것을 받지 못해요. 바라는 것과 반대되는 말과 행동을 하지는 않아요.'],
    2: ['한쪽은 주고 한쪽은 거스르는 사람', '한쪽은 상대가 바라는 것을 주고, 다른 쪽은 상대가 바라는 것과 반대로 말하고 행동해요.'],
    1: ['서로 주고받지 못하는 사람', '서로 바라는 것이 엇갈려요. 맞춰 가야 하는 사이예요. 각 카드의 「바라는 사람」에 적힌 것을 그 사람에게 일부러 해 주세요.'],
  };
  function 이름(p) { return (p.name && p.name !== '이름 없음' ? p.name : '') || p.relation || '이름 없음'; }
  function 명식(p) { try { return E.calc(PP.toProfile(p)); } catch (e) { return null; } }
  function 바람(R) { try { var k = SS.일지십신(R), 말 = 바람말(k).replace(/^이 사람은 원래 /, '').replace(/이 사람은 /g, '').replace('곁에 두고 싶어 해요', '곁에 두고 싶어요').replace(/^자기 말을/, '당신의 말을').replace('자기 마음', '당신의 마음').replace(/^자기를/, '당신을'); return 말 ? { 말: 말, 십신: k } : null; } catch (e) { return null; } }
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
  var 띠이름 = { 子: '쥐', 丑: '소', 寅: '범', 卯: '토끼', 辰: '용', 巳: '뱀', 午: '말', 未: '양', 申: '원숭이', 酉: '닭', 戌: '개', 亥: '돼지' };
  function 달라짐(R) {
    var v = null; try { v = SS.일지변질(R); } catch (e) {}
    if (!v || !v.짝) return '';
    var 올해 = new Date().getFullYear(), b = E.BRANCHES.indexOf(v.짝), 띠 = (띠이름[v.짝] || v.짝) + '띠', 말 = 바람말(v.후).replace(/^이 사람은 원래 /, ''), 세 = null;
    for (var y = 올해; y < 올해 + 12; y++) if ((((y - 4) % 12) + 12) % 12 === b) { 세 = y; break; }
    if (세 == null) return '';
    // 72조 ⑦ 대운 = 열 해 · ⑨ 그 운이 지나면 돌아온다 — 짝 글자가 대운으로 오면 그 열 해 동안 바뀌어 있다.
    //   지금 걸친 대운이거나 다음 짝 해(세운) 이듬해까지 시작하는 대운이면 대운 줄, 아니면 세운 한 해 줄
    var 대 = ((R.daeun && R.daeun.list) || []).filter(function (d) { return d.branch === b && d.startYear + 9 >= 올해 && d.startYear <= 세 + 1; })[0];
    if (대) {
      var 끝 = 대.startYear + 9, 돌 = 끝 + 1, 덧 = '';
      // 대운이 끝난 이듬해가 짝 해(세운)면 그해까지 바뀐 채로 이어진다(72조 ⑨)
      if ((((돌 - 4) % 12) + 12) % 12 === b) { 덧 = ' ' + 돌 + '년(' + 띠 + ' 해)까지 한 해 더 이어지고,'; 돌 += 1; }
      // 짝 해(세운)가 대운 바로 앞 해면 그해부터 이어서 바뀌어 있다
      if (세 < 대.startYear) return 세 + '년(' + 띠 + ' 해)부터 ' + 끝 + '년까지 바라는 것이 바뀌어요. ' + 말 + ' ' + 대.startYear + '년부터는 열 해 동안 이어지는 운(대운)에 ' + 띠 + ' 글자가 들어와요.' + 덧 + ' ' + 돌 + '년부터 원래대로 돌아와요.';
      return 대.startYear + '~' + 끝 + '년에는 바라는 것이 바뀌어요. 열 해 동안 이어지는 운(대운)에 ' + 띠 + ' 글자가 들어와요. ' + 말 + 덧 + ' ' + 돌 + '년부터 원래대로 돌아와요.';
    }
    return 세 + '년(' + 띠 + ' 해)에는 바라는 것이 바뀌어요. ' + 말 + ' 그해가 지나면 원래대로 돌아와요.';
  }
  function 카드(p, R, r, u) {
    var 주고 = r.나쪽.준다 && r.그쪽.준다 ? '서로 바라는 것을 주고받아요.' : r.나쪽.준다 ? '그 사람만 당신이 바라는 것을 주고, 당신은 그 사람이 바라는 것을 못 줘요. 그 사람에게는 위 「바라는 사람」에 적힌 것을 일부러 해 주세요.' : r.그쪽.준다 ? '당신만 그 사람이 바라는 것을 주고, 그 사람은 당신이 바라는 것을 못 줘요.' : '서로 바라는 것이 엇갈려요. 그 사람에게는 위 「바라는 사람」에 적힌 것을 일부러 해 주세요.';
    if (r.나쪽.깎는다) 주고 += ' 그 사람은 당신이 바라는 것과 반대로 말하고 행동해요.';
    if (r.그쪽.깎는다) 주고 += ' 당신은 그 사람이 바라는 것과 반대로 말하고 행동해요.';
    var 줄 = function (머리, 말) { return 말 ? '<p class="ln"><b>' + esc(머리) + '</b> ' + esc(말) + '</p>' : ''; };
    return '<div class="card pp"><div class="y" style="font-size:var(--t4)">' + esc(이름(p)) + (u && u.기운 ? ' <small style="color:var(--accent)">서로 바라는 것을 살려 주는 사이(으뜸)</small>' : '') + '</div>'
      + 줄('말과 행동', 언행말(R)) + 줄('바라는 사람', 바람말(SS.일지십신(R))) + 줄('당신과는', 주고) + 줄('달라지는 때', 달라짐(R)) + '</div>';
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
    try { np = PP.add({ name: ($('nn').value || '').trim() || '새로 만난 사람', relation: '친구', birth: { year: y, month: m, day: d, hour: null, minute: null, gender: g, calendar: 'solar', place: 'KR:서울', longitude: 126.98, tzOffset: 9 } }); } catch (e2) { $('nerr').textContent = '저장하지 못했어요. 다시 넣어 주세요.'; return; }
    방금 = np && np.id ? np.id : (typeof np === 'string' ? np : null); 그리기(); try { $('out').scrollIntoView({ block: 'start' }); } catch (e3) {}
  });
  function 그리기() {
    try { PP.migrate(); } catch (e) {}
    var 나 = PP && PP.self();
    if (!나 || !나.birth || !나.birth.year) {
      $('me').innerHTML = '<div class="big"><p>먼저 <b>당신의 생년월일</b>을 넣어 주세요. 홈에서 당신의 사주를 한 번 보면 자동으로 저장돼요.</p></div>';
      $('add').innerHTML = '<a class="btn" href="./">홈에서 당신의 생년월일 넣기</a>'; return;
    }
    var 나R = 명식(나), 다른 = PP.list().filter(function (p) { return p.id !== 나.id && p.birth && p.birth.year; });
    $('sub').textContent = '태어난 날의 아래 글자(일지)로 당신이 사람에게 바라는 것을 봐요. 저장한 사람마다, 당신과 그 사람이 서로 바라는 것을 주는지 보여 줘요. 생년월일은 이 기기에만 저장돼요.';
    var 내바람 = 바람(나R);
    var 칸 = {}, 서로 = 0, 으뜸들 = [];
    다른.forEach(function (p) {
      var R = 명식(p); if (!R || !나R) return;
      var r = SC.재기(나R, R), u = SC.으뜸(나R, R); if (r.단계 === 4) 서로++;
      if (u && u.기운) 으뜸들.push(이름(p));
      (칸[r.단계] = 칸[r.단계] || []).push(카드(p, R, r, u));
    });
    $('me').innerHTML = 넣기칸() + '<div class="ring"><span class="me">당신</span>' + 다른.map(function (p) { return '<span style="border:1px solid var(--line2);border-radius:999px;padding:8px 14px">' + esc(이름(p)) + '</span>'; }).join('') + '</div>'
      + (내바람 ? '<p class="why">당신이 사람에게 바라는 것: <b>' + esc(내바람.말) + '</b> <small>(' + esc(내바람.십신) + ')</small></p>' : '');
    if (!다른.length) {
      $('out').innerHTML = '<div class="big"><p>아직 저장한 사람이 없어요. <b>한 사람만</b> 넣어 보세요. 당신과 그 사람이 서로 바라는 것을 주고받는지 나와요.</p></div>';
    } else {
      var 맨위 = '';
      if (방금) { var bp = PP.get(방금), bR = bp && 명식(bp); if (bR) 맨위 = '<p class="sec">방금 넣은 사람</p>' + 카드(bp, bR, SC.재기(나R, bR), SC.으뜸(나R, bR)); }
      // 10-24 사장님 「같은 꼴로」 — 물음(쪽 제목) → 결론(몇 명 가운데 몇 명 · 으뜸) → 「근거 보기」 접힘(단계별 사람 카드)
      var 제목 = (document.querySelector('h1') || {}).textContent || '나와 잘 맞는 사람';
      $('out').innerHTML = 맨위 + '<section class="card jt-ch"><div class="jt-head"><h2>' + esc(String(제목).trim()) + '</h2></div><div class="jt-answer"><p>넣어 둔 <b>' + 다른.length + '명</b> 가운데 서로 바라는 것을 주고받는 사람은 <b>' + 서로 + '명</b>이에요.'
        + (으뜸들.length ? ' 그 가운데 ' + esc(으뜸들.join(' · ')) + ' 님과는 타고난 바탕부터 서로 바라는 것을 살려 주는 사이예요(으뜸).' : '') + '</p></div>'
        + '<details class="jt-ev" open><summary>근거 보기</summary>'
        + [4, 3, 2, 1].filter(function (k) { return 칸[k]; }).map(function (k) {
          return '<div class="grp"><p class="sec">' + esc(단계말[k][0]) + ' <small style="font-size:var(--t1);color:var(--ink3)">' + 칸[k].length + '명</small></p><p class="why">' + esc(단계말[k][1]) + '</p>' + 칸[k].join('') + '</div>';
        }).join('') + '</details></section>';
    }
    $('add').innerHTML = '';
    try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('saram'); } catch (e) {}
  }
  그리기();
})();
