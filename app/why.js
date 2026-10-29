/* 「왜 내게만 이런 일이 일어날까?」 화면 — 값은 why-core.js(ChaeksaWhy), 글은 why-pieces.js(이름 · 띠 · 숫자 표기) · today-pieces.js(사건 한 줄, Codex). 메인은 글을 쓰지 않는다.
 * 꼴(10-29 사장님 「이름 · ★★★ 사건 발생 빈도가 높습니다 ★★★ · 빈도 높은 사건들 목록 나열」 + 10-23 블록 꼴 「물음 → 결론 → 근거 접힘, 끝에 할 일」):
 *   카드 하나 = 물음(이름) → 결론(띠 + 사건 목록: 사건 한 줄 · 배수 · 나와 보통 사람의 횟수 · 다음 날) → 근거 보기(접힘: 센 날 · 사건마다 닿은 원국 자리) → 오늘의 운세로.
 *   첫 층(접힘 밖)엔 사주 낱말 · 한자 · 괄호를 두지 않는다 — 원국 자리 이름표(「년주 申(정재)」 — 엔진 자리 이름 · 십신)는 접힘 안에만.
 * 셈은 열두 해(약 4,400날)라 폰에서 한 번에 세면 1초 가까이 멎는다 — 이름을 먼저 그리고 400날씩 나눠 센 뒤 목록을 그린다(10-29 검토).
 *   같은 사람 · 같은 날은 다시 세지 않는다(페이지 안 기억 + 이 기기 localStorage 「chaeksa.why.…」 — 보통값 엔진 지문이 바뀌면 버림).
 * 사람 고르는 칸은 이 화면 안에서만 바꾼다(머리 줄 사람 칩 · 다른 탭의 사람은 그대로 — 오늘의 운세처럼 전역을 바꾸면 머리 칩이 옛 사람으로 남았다).
 * 빈 글 칸은 건너뛴다. 높은 사건이 하나도 없으면 띠 없이 배수 큰 셋. 앞으로 태어날 아이는 이름(+ 빈말 칸)만. */
(function (global) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const 채움 = (틀, 값) => String(틀 || '').replace(/\{([^{}]+)\}/g, (m, k) => (k in 값 ? 값[k] : m));
  // 잣대 — 한 항목의 두 수(나 · 보통 사람)를 같은 해 수로 적는다: 보통 사람 값 × 해 가 3.5 이상이 되는 가장 짧은 해(1 · 10 · 100년).
  //   반올림 오차가 한 수에 14% 안쪽이라 두 수를 견주면 배수와 어긋나지 않는다(「2.1배 · 1년에 한 번 · 보통 사람 1년에 한 번」 같은 어긋남을 막는다).
  const 잣대 = b => (b >= 3.5 ? 1 : b >= 0.35 ? 10 : 100);
  // 셈말(1년 평균, 해) — 「{해}년에 {n}번」. 0번으로 떨어지면 해를 늘린다(배수 낮은 줄에서만).
  function 셈말(r, 해, P) {
    P = P || global.ChaeksaWhyPieces || {};
    let h = 해 || 1;
    while (Math.round(r * h) < 1 && h < 1000) h *= 10;
    return 채움(P.횟수, { 해: h, n: Math.round(r * h) });
  }
  const 배수 = b => (b >= 10 ? String(Math.round(b)) : String(Math.round(b * 10) / 10));
  const 날말 = (s, 오늘) => { const a = s.split('-').map(Number); return (a[0] === +오늘.slice(0, 4) ? '' : a[0] + '년 ') + a[1] + '월 ' + a[2] + '일'; };
  const 자리말 = x => x.자리.map(z => z.기둥 + ' ' + z.글자 + '(' + z.십신 + ')').join(' · ');
  const 토막 = 들 => 들.filter(Boolean).map(t => '<span>' + esc(t) + '</span>').join(' · ');   // 「 · 」 사이는 줄을 바꾸지 않는다(날짜 · 횟수가 둘로 갈리지 않게)
  const 날글 = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function 해시(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  const 기억 = new Map();
  function 꺼냄(키, 날, 엔진) { try { const o = JSON.parse(global.localStorage.getItem('chaeksa.why.' + 키) || 'null'); return o && o.d === 날 && o.e === 엔진 ? o.v : null; } catch (e) { return null; } }
  function 둠(키, 날, 엔진, v) { try { global.localStorage.setItem('chaeksa.why.' + 키, JSON.stringify({ d: 날, e: 엔진, v })); } catch (e) {} }

  function 항목(x, v, P, TP) {
    const 글 = (TP[x.열쇠] || {}).한줄;
    if (!글) return '';
    const h = 잣대(x.보통);
    const 셈 = 토막([셈말(x.해마다, h, P), P.보통 ? 채움(P.보통, { 횟수: 셈말(x.보통, h, P) }) : '']);
    const 다음 = x.다음 && P.다음 ? 채움(P.다음, { 날: 날말(x.다음, v.오늘) }) : '';
    return '<li class="why-item" data-key="' + esc(x.열쇠) + '"><p class="why-ev">' + esc(글) + '</p>'
      + '<p class="why-n">' + (P.배 ? '<b>' + esc(채움(P.배, { n: 배수(x.배) })) + '</b> ' : '') + 셈 + '</p>'
      + (다음 ? '<p class="why-g">' + 토막([다음]) + '</p>' : '') + '</li>';
  }
  function 근거(목록, v, P, TP) {
    if (!P.근거) return '';
    const 줄 = 목록.map((x, i) => (x.자리.length && TP[x.열쇠] && TP[x.열쇠].한줄 ? '<li value="' + (i + 1) + '">' + 토막(x.자리.map(z => z.기둥 + ' ' + z.글자 + '(' + z.십신 + ')')) + '</li>' : '')).join('');
    return '<details class="jt-ev why-basis"><summary>' + esc(P.근거) + '</summary>' + (P.근거말 ? '<p class="why-basis-lead">' + esc(P.근거말) + '</p>' : '')
      + '<p class="why-span">' + 토막([v.창.시작 + ' ~ ' + v.창.끝, v.창.날.toLocaleString('ko-KR') + '일']) + '</p>'
      + (줄 ? '<ol class="why-basis-list">' + 줄 + '</ol>' : '') + '</details>';
  }

  function mount(root, options) {
    if (!root) return;
    const opt = options || {}, W = global.ChaeksaWhy, T = global.ChaeksaToday, E = global.ChaeksaEngine;
    const P = global.ChaeksaWhyPieces || {}, TP = global.ChaeksaTodayPieces || {}, Y = global.ChaeksaYaksok;
    const people = opt.people || global.ChaeksaPeople, clock = opt.clock || (() => new Date()), track = 'track' in opt ? opt.track : global.ChaeksaTrack;
    const 바로 = !!opt.바로;   // 시험 · 화면 검사기 — 나눠 세지 않고 한 번에 그린다
    const 머리 = '<div class="jt-head"><h1 class="why-title">' + esc(P.이름) + '</h1></div>';
    const 빈판 = (덧) => '<section class="card jt-ch why-card">' + 머리 + (덧 || '') + '</section>';
    if (!W || !T || !E || !people) { root.innerHTML = 빈판(); return; }
    let selected = '', 차례 = 0;
    try { people.migrate(); selected = people.activeId(); } catch (e) {}
    try { if (track) track.event('why'); } catch (e) {}
    function render(포커스) {
      const 내차례 = ++차례;
      let list = [];
      try { list = people.list() || []; } catch (e) {}
      const person = list.find(p => p.id === selected) || list.find(p => p.isSelf) || list[0];
      if (!person) { root.innerHTML = 빈판(); return; }
      selected = person.id;
      const 고르기 = list.length > 1 ? '<div class="why-person">' + (P.사람 ? '<label for="why-person">' + esc(P.사람) + '</label>' : '')
        + '<select id="why-person"' + (P.사람 ? '' : ' aria-label="사람 바꾸기"') + '>' + list.map(p => '<option value="' + esc(p.id) + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.name || '') + '</option>').join('') + '</select></div>' : '';   // 「사람 바꾸기」 = 머리 줄 사람 칩과 같은 이름(index.html #btnPerson)
      const 달기 = () => {
        const s = root.querySelector && root.querySelector('#why-person');
        if (!s) return;
        s.onchange = e => { selected = e.target.value; render(true); };
        if (포커스) try { s.focus(); } catch (e) {}
      };
      let prof, R, now, 키, 날, 엔진 = (W.보통판 && W.보통판.엔진) || '';
      try { now = clock(); prof = people.toProfile(person); 날 = 날글(now); 키 = 해시(JSON.stringify(prof)); R = E.calc(prof); } catch (e) { root.innerHTML = 고르기 + 빈판(); 달기(); return; }
      const 그리기 = (v) => {
        if (내차례 !== 차례) return;
        if (!v || v.태어나기전 || !v.모두.length) { root.innerHTML = 고르기 + 빈판(P.빈말 ? '<p class="why-lead">' + esc(P.빈말) + '</p>' : ''); 달기(); return; }
        const 목록 = v.높은.length ? v.높은 : v.모두.slice(0, 3);
        const 오늘이름 = (Y && Y.이름 && Y.이름('today')) || '';
        root.innerHTML = 고르기 + '<section class="card jt-ch why-card">' + 머리
          + (v.높은.length && P.띠 ? '<div class="jt-answer why-band"><p>' + esc(P.띠) + '</p></div>' : '')
          + (P.머리말 ? '<p class="why-lead">' + esc(P.머리말) + '</p>' : '')
          + '<ol class="why-list">' + 목록.map(x => 항목(x, v, P, TP)).join('') + '</ol>'
          + 근거(목록, v, P, TP) + '</section>'
          + (오늘이름 ? '<div class="why-next">' + (P.끝말 ? '<p>' + esc(P.끝말) + '</p>' : '') + '<a href="#today">' + esc(오늘이름) + ' →</a></div>' : '');   // nav 는 쓰지 않는다(style.css 가 nav 를 바닥에 붙인다) · 주소는 #today — ./#today 는 /index.html 에서 쪽을 새로 부른다(홈 화면 앱)
        달기();
        try { if (track && track.watchEnd) track.watchEnd(root, 'why_end'); } catch (e) {}
      };
      const 기억키 = 키 + '|' + 날 + '|' + 엔진;
      let v = 기억.get(기억키) || (바로 ? null : 꺼냄(키, 날, 엔진));
      if (v) { 기억.set(기억키, v); 그리기(v); return; }
      const 판 = W.셈판(R, now);
      const 끝나면 = () => { const r = 판.결과(); 기억.set(기억키, r); if (!바로) 둠(키, 날, 엔진, r); 그리기(r); };
      if (바로 || !판.날수) { while (!판.걸음(1e6)); 끝나면(); return; }
      root.innerHTML = 고르기 + 빈판('<div class="why-wait" aria-hidden="true"><span></span><span></span><span></span></div>');   // 세는 동안 — 글 없이 회색 줄만
      root.setAttribute && root.setAttribute('aria-busy', 'true');
      달기();
      const 한번 = () => {
        if (내차례 !== 차례) return;   // 그사이 사람을 바꿨으면 이 셈은 버린다
        if (판.걸음(400)) { root.removeAttribute && root.removeAttribute('aria-busy'); 끝나면(); } else setTimeout(한번, 0);
      };
      setTimeout(한번, 0);
    }
    render(false);
    return { render };
  }
  global.ChaeksaWhyView = { mount, 잣대, 셈말, 배수 };
})(typeof window !== 'undefined' ? window : globalThis);
