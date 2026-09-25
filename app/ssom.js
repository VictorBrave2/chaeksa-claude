/* 썸 궁합 화면 — 명리는 ssom-gwanjeom.js(72조), 글은 ssom-wongo.js. 이 파일은 그리기만 한다. */
(function (global) {
  const E = global.ChaeksaEngine, S = global.ChaeksaSsom, W = global.ChaeksaSsomWongo || {}, PL = global.ChaeksaPlaces;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const 줄 = (t) => {
    const 굵 = (x) => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    return t.indexOf('> ') === 0 ? '<p class="ss-say">' + 굵(t.slice(2)) + '</p>' : '<p>' + 굵(t) + '</p>';
  };
  const 식상말 = (x) => x.키 === '없음' ? '식신 · 상관이 둘 다 없어요' : [x.식신 && E.STEMS_KO[E.STEMS.indexOf(x.식신)] + '(' + x.식신 + ') 식신', x.상관 && E.STEMS_KO[E.STEMS.indexOf(x.상관)] + '(' + x.상관 + ') 상관'].filter(Boolean).join(' · ') + (x.식신 && x.상관 ? '이 함께 있어요' : '만 있어요');
  const 지말 = (b) => E.BRANCHES_KO[E.BRANCHES.indexOf(b)] + '(' + b + ')';

  // 흐름(09-24 사장님 전략): 1 나를 알고 · 2 그 사람을 알고 · 3 우리 둘의 주고받음 · 4 때 · 5 안고 갈 것, 맞춰 갈 것.
  // opts.만난 = { y, m } — 언제 만났나(소개팅 · 첫 연락 · 사귄 달). 없으면 4 칸은 넣는 법만 알려 준다.
  const G이름 = (g) => E.STEMS_KO[E.STEMS.indexOf(g)] + '(' + g + ')';
  const 곳그림 = { 시작전: [['ss-meet-blind'], ['ss-meet-app'], ['ss-meet-party'], ['ss-meet-office'], ['ss-meet-run'], ['ss-meet-club']], 썸: [['ss-sseom-1'], ['ss-sseom-2'], ['ss-sseom-3'], ['ss-sseom-4'], ['ss-sseom-5'], ['ss-sseom-6']], 초반: [['ss-early-1'], ['ss-early-2'], ['ss-early-3'], ['ss-early-4'], ['ss-early-5']], 안정기: [['ss-steady-1'], ['ss-steady-2'], ['ss-steady-3'], ['ss-steady-4']], 결혼: [['ss-marry-1'], ['ss-marry-2'], ['ss-marry-3'], ['ss-marry-4']], 흔들림: [['ss-shake-1'], ['ss-shake-2'], ['ss-shake-3']], 재회: [['ss-again-1'], ['ss-again-2'], ['ss-again-3']] };   // 09-25 연애궁합 전용 삽화 36장(docs/74)
  // 09-25 작업판 21 — 두 사람 이야기 1 · 2 · 3 · 5도 뼈대 + 조각 조립(ssom-webtoon-3.js)이 있으면 그걸로
  // 09-25 사장님 「실제 달력은 아직 쓰지 말자」: 단계 이야기에는 만난 달을 넘기지 않는다(날짜가 안 붙음). 조립기의 달력 코드는 남겨 둠.
  const 달력끔 = (opts) => Object.assign({}, opts || {}, { 만난: null });
  const 같은성별 = (a, b) => !!(a && b && a.gender && b.gender && a.gender === b.gender);
  function 둘로(대화, 나R, 그R, opts) {
    let 둘 = null; try { 둘 = global.ChaeksaSsomWebtoon && global.ChaeksaSsomWebtoon.뼈대.둘 ? global.ChaeksaSsomWebtoon.조립(나R, 그R, '둘', false, opts) : null; } catch (e) {}
    return 둘 ? Object.assign({}, 대화 || {}, { 나알기: 둘[0], 그알기: 둘[1], 주고받음: 둘[2], 맞춤: 둘[3], 때여는말: (대화 && 대화.때여는말) || [] }) : 대화;
  }
  function 그리기(box, a, b, opts) {
    opts = opts || {};
    // 09-25 사장님 「입력도 막아줘」: 연애궁합 웹툰은 남녀 두 사람 이야기로만 만든다 — 같은 성별이면 그리지 않는다
    if (같은성별(a, b)) { box.innerHTML = '<div class="card"><p>연애궁합은 남녀 두 사람의 이야기로 만들어져 있어요. 성별을 다시 확인해 주세요.</p></div>'; return; }
    let 나R, 그R; try { 나R = E.calc(a); 그R = E.calc(b); } catch (e) { box.innerHTML = '<p class="hint">이 생년월일은 계산하지 못했어요.</p>'; return; }
    const z = S.짝(나R, 그R), 원고 = W[z.키];
    const 바람 = global.ChaeksaSsomBaram || {}, 줌 = global.ChaeksaSsomJuneun || {}, 닿 = global.ChaeksaSsomDaeum || {}, 맞 = (global.ChaeksaSsomMatchum || {})[z.키];
    // 09-25 사장님 「텍스트는 좋은데 안 읽어진다」 — 굵은 첫 줄 · 첫 대사 · 굵은 끝 줄만 먼저 보이고 나머지는 「더 읽기」로 접는다.
    const 한줄 = (t, j, n) => { let h = 줄(t);
      if (j === 0 && /^\*\*/.test(t)) h = h.replace('<p>', '<p class="ss-lead">');
      else if (j === n - 1 && /^\*\*/.test(t)) h = h.replace('<p>', '<p class="ss-end">');
      return h; };
    const 칸 = (글) => {
      if (글.length <= 3) return 글.map((t, j) => 한줄(t, j, 글.length)).join('');
      const 보임 = new Set();
      보임.add(0);   // 첫 줄은 늘 보인다(굵지 않아도)
      const 대 = 글.findIndex(t => t.indexOf('> ') === 0); if (대 >= 0) 보임.add(대);
      if (/^\*\*/.test(글[글.length - 1])) 보임.add(글.length - 1);
      const 앞 = 글.map((t, j) => 보임.has(j) ? 한줄(t, j, 글.length) : '').join('');
      const 뒤 = 글.map((t, j) => 보임.has(j) ? '' : 한줄(t, j, 글.length)).join('');
      return 앞 + (뒤 ? '<details class="ss-more"><summary>더 읽기</summary>' + 뒤 + '</details>' : '');
    };
    const 바꿔 = (글, 표) => 글.map(t => Object.keys(표).reduce((x, k) => x.split(k).join(표[k]), t));
    // 맨 위 — 쉬운 두 줄 먼저, 사주 말은 「근거 보기」 안으로(09-25 「표현이 어렵다」)
    const 제목of = (R) => { const b = 바람[S.일주(R)], 말들 = S.언행(R).map(x => 줌[x.키] && 줌[x.키].사람말).filter(Boolean);
      const 하는 = 말들.length > 1 ? 말들.slice(0, -1).map(t => t.replace(/는$/, '고')).join(' ') + ' ' + 말들[말들.length - 1] : 말들[0] || '';
      return [b ? b.제목 : '', 하는]; };
    const 나제 = 제목of(나R), 그제 = 제목of(그R);
    const 소개 = (누, 제) => !제[0] && !제[1] ? '' : '<p><b>' + 누 + '</b>은 ' + (제[0] ? '「' + esc(제[0]) + '」을 바라고' : '') + (제[0] && 제[1] ? ', ' : '') + (제[1] ? esc(제[1]) + ' 사람이에요.' : (제[0] ? '요.' : '')) + '</p>';
    const 근거 = '<div class="card">'   /* 09-25 3초 결과 카드는 화면에서 내림(사장님 「순위 정하다가 산으로 가버렸어」) — 엔진 ssom-score.js 는 남겨 둠 */ + '' + 소개('당신', 나제) + 소개('그 사람', 그제) + '<button type="button" class="btn" id="ssVnTop" style="width:100%;margin:8px 0 6px">웹툰궁합 시작하기</button>'
      + '<details class="ss-more"><summary>근거 보기</summary><p class="ss-why">나는 ' + esc(z.나쪽.일주) + ' 일주, 일지 ' + 지말(z.나쪽.일지) + '는 나에게 ' + esc(z.나쪽.일지십신) + '이고, 식상은 ' + esc(식상말(z.나식상)) + '.<br>그 사람은 ' + esc(z.그쪽.일주) + ' 일주, 일지 ' + 지말(z.그쪽.일지) + '는 그 사람에게 ' + esc(z.그쪽.일지십신) + '이고, 식상은 ' + esc(식상말(z.그식상)) + '.<br>일지는 어떤 사람을 바라는지, 식상은 상대를 어떻게 대하는지예요. 장면과 대사는 이해를 돕는 예시예요.</p></details></div>';
    let 대화 = (global.ChaeksaSsomDaehwa || {})[z.키]; 대화 = 둘로(대화, 나R, 그R, opts);   // 책사 대화(09-25 A) — 있으면 1 · 2 · 3 · 5 칸을 대화로
    // 09-25 작업판 21 — 뼈대 + 조각 조립(ssom-webtoon.js)이 있는 회는 그걸, 없으면 손글씨 원고를
    const 웹 = (() => { try { return global.ChaeksaSsomWebtoon ? global.ChaeksaSsomWebtoon.조립(나R, 그R, '썸', false, 달력끔(opts)) : null; } catch (e) { return null; } })();
    const 썸글 = (i) => (웹 && 웹[i]) || (대화 && 대화.썸 && 대화.썸[i]);
    const 대화칸 = (번, 머리, arr, 열림) => '<details class="ss-q card ss-baram"' + (열림 ? ' open' : '') + '><summary>' + 번 + '. ' + 머리 + '</summary>'
      + 대화html(arr) + '</details>';
    // 대화 원고([[화자, 말] …])면 이름표 달린 대화로, 예전 원고(줄 배열)면 칸()으로 — 작업판 1(09-25)
    // 09-25 스토리 줄(작업판 17): '장면' = 지문 · '당신' · '상대' = 두 사람 대사 · '단서' = 추론의 단서
    const 대화html = (arr) => arr.map(([누가, 말], i) => { const m = esc(말).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      if (누가 === '장면') return '<p class="ss-scene">' + m + '</p>';
      if (누가 === '근거') return '<p class="ss-geungeo">왜 이렇게 흘러갔을까</p>';
      if (누가 === '단서') { const 앞 = i > 0 && arr[i - 1][0] === '단서', 뒤 = i + 1 < arr.length && arr[i + 1][0] === '단서';   // 이어진 단서 줄은 한 상자로
        return (앞 ? '' : '<p class="ss-dan"><b>추론의 단서</b>') + '<br>' + m + (뒤 ? '' : '</p>'); }
      if (누가 === '당신' || 누가 === '상대') return '<p class="ss-talk"><b class="t-' + (누가 === '당신' ? 'you' : 'them') + '">' + 누가 + '</b>' + m + '</p>';
      return '<p class="ss-talk"><b class="t-' + (누가 === '인연' ? 'iy' : 'jw') + '">책사</b>' + m + '</p>'; }).join('');
    const 칸2 = (x) => Array.isArray(x) && Array.isArray(x[0]) ? 대화html(x) : 칸(x || []);
    const 웹단 = {}, 웹칸 = (단) => { if (!(단 in 웹단)) { try { 웹단[단] = global.ChaeksaSsomWebtoon ? global.ChaeksaSsomWebtoon.조립(나R, 그R, 단, false, 달력끔(opts)) : null; } catch (e) { 웹단[단] = null; } } return 웹단[단]; };
    const 대단 = (단, i) => (웹칸(단) && 웹칸(단)[i]) || (대화 && 대화.단계 && 대화.단계[단] && 대화.단계[단][i]);   // 작업판 21 — 조립 원고가 먼저
    // 1 · 2 — 바라는 사랑(일주) + 주는 사랑(식상)
    const 알기칸 = (번, R, 주, 머리) => {
      const 일주 = S.일주(R), 언 = S.언행(R), 바 = 바람[일주], 누가 = 주 === '당신' ? '내가' : '그 사람이';
      // 주는 사랑 = 언행 조각(식신 → 상관) + 생색 한 줄(72조 ⑥)
      const 생 = global.ChaeksaSsomSaengsaek || {}, 조각 = 언.map(x => 줌[x.키]);
      const 주는 = !언.length ? { 제목: '언행으로는 단서가 적어요', 줄: 생.없음 || [] }
        : 조각.every(Boolean) ? { 제목: 조각.map(x => x.제목).join(' · '), 줄: [].concat(...조각.map(x => x.줄), (언.some(x => x.드러남) ? 생.드러남 : 생.숨음) || []) } : null;
      const 속 = '<h4 class="ss-sub">' + 누가 + ' 바라는 사람</h4>' + (바 ? '<p class="ss-lead">' + esc(바.제목) + '</p>' + 칸(바꿔(바.줄, { '{주}': 주 })) : '<p class="ss-why">' + esc(일주) + ' 일주의 글은 쓰고 있어요.</p>')
        + '<h4 class="ss-sub">' + 누가 + ' 마음을 보이는 법</h4>' + (주는 ? '<p class="ss-lead">' + esc(주는.제목) + '</p>' + 칸(바꿔(주는.줄, { '{주}': 주 })) : '<p class="ss-why">이 식상 구성의 글은 쓰고 있어요.</p>');
      return '<details class="ss-q card ss-baram"' + (번 === 1 ? ' open' : '') + '><summary>' + 번 + '. ' + 머리 + '</summary>' + 속 + '</details>';
    };
    // 3 — 주고받음: 두 방향 닿음
    const 닿칸 = (받R, 줌R, 받, 주는이) => { const k = S.닿음키(받R, 줌R), d = 닿[k];
      const 머리 = (받 === '당신' ? '내가 바라는 것' : '그 사람이 바라는 것') + ' ← ' + (주는이 === '당신' ? '내가 주는 것' : '그 사람이 주는 것');
      return '<div class="ss-daeum"><p class="ss-ask">' + esc(머리) + (d ? ' — <b>' + esc(d.말) + '</b>' : '') + '</p>' + (d ? 칸(바꿔(d.줄, { '{받}': 받, '{줌}': 주는이 })) : '<p class="ss-why">이 짝(' + esc(k) + ')의 글은 쓰고 있어요.</p>') + '</div>'; };
    const 주고받음 = '<details class="ss-q card"><summary>3. 우리는 서로 원하는 걸 주고 있을까요?</summary>' + 닿칸(나R, 그R, '당신', '그 사람') + 닿칸(그R, 나R, '그 사람', '당신') + '</details>';
    // 4 — 때: 만난 달과 지금. 사실만 — 뜻은 사장님 조문 대기
    const 지금 = new Date();
    const 상태말 = (t, 주) => {
      const 온 = t.온.filter((x, i, arr) => arr.findIndex(y => y.글자 === x.글자 && y.층 === x.층) === i);
      const 있말 = { '없음': '식신도 상관도 없어요', '식신만': '식신만 있어요', '상관만': '상관만 있어요', '둘 다': '식신과 상관이 둘 다 있어요' };
      const 식줄 = t.원구성 === t.구성 ? '식상은 타고난 그대로 ' + 있말[t.구성] + '.'
        : '식상은 타고나기로 ' + 있말[t.원구성].replace(/어요$/, '는데') + ', 이때는 ' + 온.map(x => x.층 + '의 ' + G이름(x.글자) + ' ' + x.십신).join(' · ') + '이 들어와 ' + 있말[t.구성] + '.';
      const 묶줄 = t.묶임.length ? ' 천간의 ' + t.묶임.map(x => G이름(x.글자) + ' ' + x.십신).join(' · ') + '이 운에 묶여 제 노릇을 못 해요.' : '';
      const 지줄 = t.충.length ? '일지 ' + 지말(t.일지) + '는 ' + t.충.map(x => x.층 + ' ' + 지말(x.운지)).join(' · ') + '와 부딪혀 흔들리는 때예요.'
        : t.합.length ? '일지 ' + 지말(t.일지) + '는 ' + t.합.map(x => x.층 + ' ' + 지말(x.운지)).join(' · ') + '와 합으로 묶이는 때예요.' : '일지 ' + 지말(t.일지) + '는 운에 흔들리지 않아요.';
      return '<p><b>' + esc(주) + '</b> — ' + esc(식줄 + 묶줄 + ' ' + 지줄) + '</p>'; };
    let 때칸;
    if (opts.만난 && opts.만난.y && opts.만난.m) {
      // 층별 풀이(대운 = 바탕 · 세운 = 모양 · 월운 = 밀려남, 언행은 드러남/속으로) — ssom-gwanjeom 때풀이 · 때견줌
      const 풀 = (R, y, m) => S.때풀이(R, y, m), 지y = 지금.getFullYear(), 지m = 지금.getMonth() + 1;
      const 사람칸 = (x, 주) => '<p><b>' + esc(주) + '</b></p>' + (x.바람.length ? x.바람 : ['바라는 마음은 운에 흔들리지 않고 타고난 그대로예요.']).map(t => '<p>' + esc(t) + '</p>').join('')
        + (x.언.length ? x.언.map(v => '<p>' + esc(v.말) + '</p>').join('') : '<p>언행은 타고난 그대로예요.</p>');
      const 그때 = [풀(나R, opts.만난.y, opts.만난.m), 풀(그R, opts.만난.y, opts.만난.m)], 이제 = [풀(나R, 지y, 지m), 풀(그R, 지y, 지m)];
      // 표 먼저(그때 / 지금 짧은 말), 풀이는 「자세히」로 접는다(09-25 「안 읽어진다」)
      const 짧게 = (x) => {
        const 말 = [];
        x.바람.forEach(t => { const 대상 = (t.match(/마음이 (.+?)에 밀려/) || [])[1];
          const 바쁜 = (t.match(/(?:달은|그달은) (.+?)에 마음이 밀려요/) || [])[1];
          const m = 바쁜 ? 바쁜 + '로 바쁨' : /끌리는 사람이 바뀌어요/.test(t) ? '끌리는 사람이 바뀜' : /바라는 게 많아/.test(t) ? '바라는 게 많은 때' : /잘 안 흔들/.test(t) ? '마음이 한결같은 때' : /혼자서도/.test(t) ? '혼자서도 잘 버팀' : /바뀌기|흔들/.test(t) ? '마음이 흔들림' : /또렷|많아져/.test(t) ? '연애 생각 많음' : null; if (m) 말.push(m); });
        x.언.forEach(v => 말.push(v.변질 ? '좋아하는 방식이 바뀜' : v.십신 === '식신' ? '챙겨 주는 모습' : '먼저 나서는 모습'));
        const 한번 = 말.filter((m, i) => 말.indexOf(m) === i); 말.length = 0; 한번.forEach(m => 말.push(m));
        return 말.length ? 말.map(m => '<li>' + esc(m) + '</li>').join('') : '<li>타고난 그대로</li>';
      };
      const 표 = '<table class="ss-tbl"><tr><th></th><th>만난 때<br><small>' + opts.만난.y + '.' + opts.만난.m + '</small></th><th>지금<br><small>' + 지y + '.' + 지m + '</small></th></tr>'
        + [['당신', 0], ['그 사람', 1]].map(([n, i]) => '<tr><th>' + n + '</th><td><ul>' + 짧게(그때[i]) + '</ul></td><td><ul>' + 짧게(이제[i]) + '</ul></td></tr>').join('') + '</table>';
      // 한 줄 견줌 — 표의 짧은 말에서 빠진 것 · 생긴 것만
      const 목록 = (x) => (짧게(x).match(/<li>(.*?)<\/li>/g) || []).map(t => t.replace(/<\/?li>/g, ''));
      const 한견줌 = (a, b) => { const 빠 = 목록(a).filter(t => 목록(b).indexOf(t) < 0), 생 = 목록(b).filter(t => 목록(a).indexOf(t) < 0);
        if (!빠.length && !생.length) return '그때와 지금이 같아요.';
        return [빠.length ? '줄어든 것: ' + 빠.join(', ') : '', 생.length ? '새로 생긴 것: ' + 생.join(', ') : ''].filter(Boolean).join('<br>'); };
      const 견줌 = [['당신', 0], ['그 사람', 1]].map(([n, i]) => '<p class="ss-lead"><b>' + n + '</b><br>' + 한견줌(그때[i], 이제[i]) + '</p>').join('');
      const 긴견줌 = [['당신', 0, 나R], ['그 사람', 1, 그R]].map(([n, i, R]) => '<p><b>' + n + '</b> — ' + esc(S.때견줌(R, 그때[i], 이제[i]).join(' ')) + '</p>').join('');
      때칸 = 견줌 + 표 + '<details class="ss-more"><summary>자세히</summary>' + '<h4 class="ss-sub">그때와 지금</h4>' + 긴견줌
        + '<h4 class="ss-sub">만난 때 — ' + opts.만난.y + '년 ' + opts.만난.m + '월</h4>' + 사람칸(그때[0], '당신') + 사람칸(그때[1], '그 사람')
        + '<h4 class="ss-sub">지금 — ' + 지y + '년 ' + 지m + '월</h4>' + 사람칸(이제[0], '당신') + 사람칸(이제[1], '그 사람') + '</details>';
    } else 때칸 = '<p class="ss-why">두 분이 처음 만난 달을 넣으면, 그때와 지금 두 분의 식상과 일지가 어떻게 달라졌는지 보여 드려요.</p>';
    let 때 = '<details class="ss-q card"' + (opts.만난 ? ' open' : '') + '><summary>4. 처음 만났을 때와 지금, 뭐가 달라졌을까요?</summary>' + 때칸 + '</details>';
    if (대화 && 대화.때회) 때 = 대화칸(4, '처음 만났을 때와 지금, 뭐가 달라졌을까요?', 대화.때회, !!opts.만난);   // 작업판 21 — 4화도 뼈대
    // 5 — 안고 갈 것, 맞춰 갈 것
    const 끝 = '<details class="ss-q card"><summary>4. 그냥 안고 갈 것, 맞춰 볼 것은 뭘까요?</summary>' + (맞
      ? '<h4 class="ss-sub">안고 갈 것 — 쉽게 안 바뀌어요</h4>' + 맞.안고.map(t => '<p>' + esc(t) + '</p>').join('') + '<h4 class="ss-sub">맞춰 갈 것 — 말 한마디, 방식 하나로 달라져요</h4>' + 맞.맞춰.map(t => '<p>' + esc(t) + '</p>').join('') + '<p class="ss-why">안고 갈지, 못 안고 갈지는 두 분이 정해요.</p>'
      : '<p class="ss-why">두 분 조합의 글은 쓰고 있어요.</p>') + '</details>';
    // 지금 단계의 질문 여섯
    const 반응원고 = (global.ChaeksaSsomBanung || {})[z.키] || {};
    // 09-25 사장님 「우리 포지션은 두 사람에 대한 소설을 써 주는 것 — 반응 글은 삭제」: 반응 묻기 · 기록 칸을 끔
    const 반응칸 = () => '';
    const 기록 = S.기록(z.키), 끝기록 = 기록[기록.length - 1];
    const 이어 = '';
    const 단계표 = (global.ChaeksaSsomDangye || {}), 단계 = opts.단계 || '썸', 단계칸 = (단계표.단계 || []).find(x => x.키 === 단계);
    if (단계 !== '썸' && 단계칸) {
      const 글들 = ((단계표.원고 || {})[z.키] || {})[단계];
      const 단질 = '<h3 class="ss-part">지금 단계의 질문 — ' + esc(단계칸.이름) + '</h3><button type="button" class="btn" id="ssVnStage" style="width:100%;margin:0 0 10px">이 단계를 장면으로 보기</button>' + ((글들 || 대단(단계, 0))
        ? 단계칸.질문.map((q, i) => '<details class="ss-q card"><summary>' + esc(q) + '</summary>' + 칸2(대단(단계, i) || 글들[i] || ['이 질문의 글은 쓰고 있어요.']) + '</details>').join('')
        : '<div class="card"><p>이 단계에서 두 분 조합의 글은 아직 쓰고 있어요.</p><p class="ss-why">질문: ' + esc(단계칸.질문.join(' · ')) + '</p></div>');
      if (단계 === '시작전') 때 = '';   // 아직 안 만났으니 「처음 만났을 때와 지금」은 없다
      box.innerHTML = 근거 + 알기칸(1, 나R, '당신', '나는 어떤 사람에게 끌리고, 어떻게 좋아할까요?') + 알기칸(2, 그R, '그 사람', '그 사람은 어떤 사람에게 끌리고, 어떻게 좋아할까요?') + 주고받음 + 끝 + 단질;
      if (대화) box.innerHTML = 근거 + 대화칸(1, '나는 어떤 사람에게 끌리고, 어떻게 좋아할까요?', 대화.나알기, true) + 대화칸(2, '그 사람은 어떤 사람에게 끌리고, 어떻게 좋아할까요?', 대화.그알기) + 대화칸(3, '우리는 서로 원하는 걸 주고 있을까요?', 대화.주고받음) + 대화칸(4, '그냥 안고 갈 것, 맞춰 볼 것은 뭘까요?', 대화.맞춤) + 단질;
      const vt = box.querySelector('#ssVnTop'); if (vt) vt.onclick = () => { try { sessionStorage.setItem('chaeksa.ssomVn', JSON.stringify({ a, b, opts })); } catch (e) {} location.href = 'ssom-vn.html'; };
      const vs = box.querySelector('#ssVnStage'); if (vs) vs.onclick = () => { try { sessionStorage.setItem('chaeksa.ssomVn', JSON.stringify({ a, b, opts })); } catch (e) {} location.href = 'ssom-vn.html?at=stage'; };
      컷넣기(box, 단계);
      return;
    }
    const 질문들 = (원고 || (대화 && 대화.썸))
      ? '<h3 class="ss-part">지금 단계의 질문 — 막 썸을 시작했어요</h3>' + 이어 + '<button type="button" class="btn" id="ssVn" style="width:100%;margin:6px 0 4px">장면으로 보기 — 책사가 한 장씩 들려 드려요</button>'
        + S.질문.map((q, i) => '<details class="ss-q card"' + ((끝기록 && 끝기록.장 === i) ? ' open' : '') + ' data-i="' + i + '"><summary>' + esc(q) + '</summary>' + 칸2(썸글(i) || 원고[i] || []) + 반응칸(i) + '</details>').join('')
      : '<h3 class="ss-part">지금 단계의 질문</h3><div class="card"><p>두 분 조합의 질문 글은 아직 쓰고 있어요.</p></div>';
    box.innerHTML = 대화 ? 근거 + 대화칸(1, '나는 어떤 사람에게 끌리고, 어떻게 좋아할까요?', 대화.나알기, true) + 대화칸(2, '그 사람은 어떤 사람에게 끌리고, 어떻게 좋아할까요?', 대화.그알기) + 대화칸(3, '우리는 서로 원하는 걸 주고 있을까요?', 대화.주고받음) + 대화칸(4, '그냥 안고 갈 것, 맞춰 볼 것은 뭘까요?', 대화.맞춤) + 질문들
      : 근거 + 알기칸(1, 나R, '당신', '나는 어떤 사람에게 끌리고, 어떻게 좋아할까요?') + 알기칸(2, 그R, '그 사람', '그 사람은 어떤 사람에게 끌리고, 어떻게 좋아할까요?') + 주고받음 + 끝 + 질문들;
    const 보이기 = (i, r, 적) => {
      const d = box.querySelector('details[data-i="' + i + '"]'); if (!d) return;
      d.querySelectorAll('.ss-r').forEach(x => x.classList.toggle('on', x.dataset.r === r));
      const 글 = ((대화 && 대화.반응 && 대화.반응[i]) || 반응원고[i] || {})[r];
      d.querySelector('.ss-next').innerHTML = 글 ? 칸2(글) : '<p class="ss-why">이 반응에 이어지는 글은 쓰고 있어요.</p>';
      if (적) S.적기(z.키, i, r);
    };
    box.querySelectorAll('.ss-r').forEach(b => b.onclick = () => 보이기(+b.dataset.q, b.dataset.r, true));

    const vn = box.querySelector('#ssVn');
    const 장면열기 = () => { try { sessionStorage.setItem('chaeksa.ssomVn', JSON.stringify({ a, b, opts })); } catch (e) {} location.href = 'ssom-vn.html'; };
    if (vn) vn.onclick = 장면열기;
    const vn2 = box.querySelector('#ssVnTop'); if (vn2) vn2.onclick = 장면열기;
    const vn3 = box.querySelector('#ssVnStage'); if (vn3) vn3.onclick = () => { try { sessionStorage.setItem('chaeksa.ssomVn', JSON.stringify({ a, b, opts })); } catch (e) {} location.href = 'ssom-vn.html?at=stage'; };
    컷넣기(box, 단계);
  }

  /* 09-25 개인화 웹툰(작업판 19): 글 보기도 화마다 컷(그림)을 머리에 달고, 모든 화를 펼쳐 세로로 잇는다. 접기는 「근거 보기」 · 「더 읽기」에만. */
  const 총론그림 = ['ss-me', 'ss-her', 'ss-give', 'ss-hold'];   // 09-25 v2: 4화 뺌
  function 컷넣기(box, 단계) {
    // '둘'이면 단계 부분을, 단계면 1~5를 뺀다
    box.querySelectorAll('details.ss-q').forEach(d => { const 앞 = /^[1-5]\. /.test((d.querySelector('summary') || {}).textContent || ''); if (단계 === '둘' ? !앞 : 앞) d.remove(); });
    if (단계 === '둘') box.querySelectorAll('h3.ss-part, #ssVn, #ssVnStage, .ss-log').forEach(x => x.remove());
    let k = 0; const 곳 = 곳그림[단계] || [];
    box.querySelectorAll('details.ss-q').forEach(d => {
      const sm = d.querySelector('summary'); if (!sm) return;
      const 번 = /^([1-4])\. /.exec(sm.textContent), 그림 = 번 ? 총론그림[+번[1] - 1] : (곳[k++] || [])[0];
      if (그림 && !d.querySelector('.ss-cut')) sm.insertAdjacentHTML('afterend', '<img class="ss-cut" src="art/' + 그림 + '-s.webp" alt="" loading="lazy">');
      d.open = true;
    });
  }

  function 세우기() {
    const box = document.getElementById('gcOut'), f = document.getElementById('gcForm');
    if (!box || !f) return;
    const q = (id) => document.getElementById(id);
    ['gcPlaceA', 'gcPlaceB'].forEach(id => { if (PL && q(id)) q(id).innerHTML = PL.options(); });
    if (q('gcStage')) { 단계카드(q('gcStage')); q('gcStage').value = '둘'; q('gcStage')._그리(); q('gcStage').addEventListener('change', () => { if (box.innerHTML) f.requestSubmit ? f.requestSubmit() : f.onsubmit(new Event('submit')); }); }
    let p = null; try { p = JSON.parse(localStorage.getItem('chaeksa.profile') || 'null'); } catch (e) {}
    if (p && p.year) {
      q('gcDateA').value = p.year + '-' + String(p.month).padStart(2, '0') + '-' + String(p.day).padStart(2, '0');
      if (!p.noTime && p.hour != null && p.hour !== '') q('gcTimeA').value = String(p.hour).padStart(2, '0') + ':' + String(p.minute || 0).padStart(2, '0');
      q('gcGA').value = p.gender === 'M' ? 'M' : 'F';
    }
    // 09-25 「입력부터 웹툰식으로」 — 성별을 고르면 컷 그림이 그 사람으로 바뀐다(당신 컷은 당신 성별, 그 사람 컷은 그 사람 성별)
    // 09-25 사장님 「같은 사진이 들어가면 섭섭한데」 — 자리마다 다른 컷(나 남 ss-me · 나 여 ss-her · 그 사람 남 story-jigeum · 그 사람 여 story-sns), 한쪽 성별을 고르면 맞은편은 반대로
    const 컷그림 = { A: { M: 'ss-me', F: 'ss-her' }, B: { M: 'story-jigeum', F: 'story-sns' } };
    const 컷바꾸기 = () => ['A', 'B'].forEach(n => { const g = q('gcG' + n), c = q('gcCut' + n); if (!g || !c) return; const im = c.querySelector('img'), 새 = 'art/' + (컷그림[n][g.value] || 컷그림[n].F) + '-s.webp'; if (im.getAttribute('src') !== 새) { im.style.opacity = 0; setTimeout(() => { im.src = 새; im.style.opacity = 1; }, 150); } });
    ['A', 'B'].forEach(n => { const g = q('gcG' + n); if (g) g.addEventListener('change', () => { const o = q('gcG' + (n === 'A' ? 'B' : 'A')); if (o && g.value && o.value === g.value) o.value = g.value === 'M' ? 'F' : 'M'; 컷바꾸기(); }); }); 컷바꾸기();
    const 잠금 = (n) => { const c = q('gcNoTime' + n); if (c) q('gcTime' + n).disabled = c.checked; };
    ['A', 'B'].forEach(n => { const c = q('gcNoTime' + n); if (c) { c.addEventListener('change', () => 잠금(n)); 잠금(n); } });
    // 09-25 첫 화면은 생년월일 · 성별만 — 시각은 「모름」이 기본. 「태어난 시각 · 곳」을 펼치면 시각을 넣는 것으로 본다.
    ['A', 'B'].forEach(n => { const c = q('gcNoTime' + n), d = c && c.closest('details'); if (d) d.addEventListener('toggle', () => { if (d.open && c.checked) { c.checked = false; 잠금(n); } }); });
    const 읽기 = (n) => {
      const [y, m, d] = (q('gcDate' + n).value || '').split('-').map(Number);
      const [hh, mi] = (q('gcTime' + n).value || '12:00').split(':').map(Number);
      if (!y || !m || !d) return null;
      const 모름 = !!(q('gcNoTime' + n) && q('gcNoTime' + n).checked);
      const 곳 = PL ? PL.resolve(q('gcPlace' + n).value) : { lon: 126.98, tzOffset: null };
      return { year: y, month: m, day: d, hour: 모름 ? null : hh, minute: 모름 ? 0 : (mi || 0), gender: q('gcG' + n).value || null, longitude: 곳.lon, tzOffset: 곳.tzOffset };
    };
    f.onsubmit = (e) => {
      e.preventDefault();
      const a = 읽기('A'), b = 읽기('B');
      if (!a || !b) return;
      const mv = (q('gcMet') && q('gcMet').value || '').split('-').map(Number);
      그리기(box, a, b, { 만난: mv[0] ? { y: mv[0], m: mv[1] } : null, 단계: (q('gcStage') && q('gcStage').value) || '썸' });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    // 장면 보기에서 돌아오면(뒤로 가기 포함) 이 탭에서 보던 두 사람을 다시 그린다 — 같은 탭 sessionStorage만, 주소엔 안 실음
    try { const v = JSON.parse(sessionStorage.getItem('chaeksa.ssomVn') || 'null'); if (v && v.a && v.b) { 그리기(box, v.a, v.b, v.opts || {}); if (v.opts && v.opts.단계 && q('gcStage')) q('gcStage').value = v.opts.단계; } } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 세우기); else 세우기();
  /* 장면 보기(미연시)용 대본 — 글 보기와 같은 원고 · 같은 풀이를 장(章) 목록으로 낸다(09-25 사장님 「미연시로 변환」).
   *  장 = { 제목, 배경: [art 이름 …], 줄: [{ 누가, 말 }], 반응: { 장, 틀, 물음 } | null }. 누가 = 책사 · 당신 · 상대 · 예시. */
  function 대본(a, b, opts) {
    opts = opts || {};
    if (같은성별(a, b)) return { 키: '', 단계: '', 장들: [], 총론수: 0 };
    const 나R = E.calc(a), 그R = E.calc(b), z = S.짝(나R, 그R);
    const 바람 = global.ChaeksaSsomBaram || {}, 줌 = global.ChaeksaSsomJuneun || {}, 닿 = global.ChaeksaSsomDaeum || {}, 생 = global.ChaeksaSsomSaengsaek || {};
    const 원고 = (global.ChaeksaSsomWongo || {})[z.키], 반응원고 = (global.ChaeksaSsomBanung || {})[z.키] || {}, 맞 = (global.ChaeksaSsomMatchum || {})[z.키];
    const 단계표 = global.ChaeksaSsomDangye || {};
    const 웹 = (() => { try { return global.ChaeksaSsomWebtoon ? global.ChaeksaSsomWebtoon.조립(나R, 그R, '썸', false, 달력끔(opts)) : null; } catch (e) { return null; } })();
    const 바꿔 = (t, 표) => Object.keys(표).reduce((x, k) => x.split(k).join(표[k]), t);
    const 줄로 = (글, 표) => (글 || []).map(t0 => { const t = 바꿔(t0, 표 || {});
      if (t.indexOf('> ') !== 0) return { 누가: '책사', 말: t };
      let 말 = t.slice(2), 누가 = '예시'; const m = 말.match(/^(당신|상대):\s*/); if (m) { 누가 = m[1]; 말 = 말.slice(m[0].length); }
      return { 누가, 말 }; });
    const 알기 = (R, 주) => { const 일주 = S.일주(R), 언 = S.언행(R), 바 = 바람[일주], 조각 = 언.map(x => 줌[x.키]).filter(Boolean);
      const 줄들 = [];
      줄들.push({ 누가: '책사', 말: (주 === '당신' ? '먼저 당신이 바라는 사람이에요.' : '이번엔 그 사람이 바라는 사람이에요.') });
      if (바) 줄로(바.줄, { '{주}': 주 }).forEach(x => 줄들.push(x)); else 줄들.push({ 누가: '책사', 말: 일주 + ' 일주의 글은 쓰고 있어요.' });
      줄들.push({ 누가: '책사', 말: (주 === '당신' ? '당신이 마음을 보이는 법은요.' : '그 사람이 마음을 보이는 법은요.') });
      if (!언.length) 줄로(생.없음, { '{주}': 주 }).forEach(x => 줄들.push(x));
      else { 조각.forEach(c => 줄로(c.줄, { '{주}': 주 }).forEach(x => 줄들.push(x))); 줄로(언.some(x => x.드러남) ? 생.드러남 : 생.숨음, { '{주}': 주 }).forEach(x => 줄들.push(x)); }
      return 줄들; };
    const 장들 = []; let 대화 = (global.ChaeksaSsomDaehwa || {})[z.키]; 대화 = 둘로(대화, 나R, 그R, opts); const 웹단계 = (() => { try { return global.ChaeksaSsomWebtoon && opts.단계 ? global.ChaeksaSsomWebtoon.조립(나R, 그R, opts.단계, true, 달력끔(opts)) : null; } catch (e) { return null; } })(); const 단조 = (i) => (웹단계 && 웹단계[i]) || (대화 && 대화.단계 && 대화.단계[opts.단계] && 대화.단계[opts.단계][i]); const 썸글 = (i) => (웹 && 웹[i]) || (대화 && 대화.썸 && 대화.썸[i]);
    // 책사 개인 이름(인연 · 좌장 · 택일 …)은 화면에 안 낸다(09-25 사장님 「혼란을 줄 수 있다고 쓰지 말자고 했는데」) — 모두 「책사」, 색으로만 번갈아
    const 대화줄 = (arr) => arr.filter(x => x[0] !== '단서' && x[0] !== '근거').map(([누가, 말, 주인]) => 누가 === '장면' ? { 누가: '장면', 말, 주인 } : 누가 === '당신' || 누가 === '상대' ? { 누가, 말 } : 누가 === '단서' ? { 누가: '추론의 단서', 말 } : { 누가: '책사', 말, 쪽: 누가 === '인연' ? 0 : 1 });
    장들.push({ 제목: '나는 어떤 사람에게 끌리고, 어떻게 좋아할까요?', 배경: ['ss-me'], 줄: 대화 ? 대화줄(대화.나알기) : 알기(나R, '당신') });
    장들.push({ 제목: '그 사람은 어떤 사람에게 끌리고, 어떻게 좋아할까요?', 배경: ['ss-her'], 줄: 대화 ? 대화줄(대화.그알기) : 알기(그R, '그 사람') });
    const 닿줄 = []; [[나R, 그R, '당신', '그 사람', '당신이 바라는 것과 그 사람이 주는 것'], [그R, 나R, '그 사람', '당신', '그 사람이 바라는 것과 당신이 주는 것']].forEach(([받R, 줌R, 받, 주는이, 머리]) => {
      const d = 닿[S.닿음키(받R, 줌R)];
      닿줄.push({ 누가: '책사', 말: 머리 + (d ? '은 — **' + d.말 + '**.' : '은 아직 쓰고 있어요.') });
      if (d) 줄로(d.줄, { '{받}': 받, '{줌}': 주는이 }).forEach(x => 닿줄.push(x)); });
    장들.push({ 제목: '우리는 서로 원하는 걸 주고 있을까요?', 배경: ['ss-give'], 줄: 대화 ? 대화줄(대화.주고받음) : 닿줄 });
    const 때줄 = [];
    if (대화 && 대화.때회) 대화줄(대화.때회).forEach(x => 때줄.push(x));
    if (대화 && 대화.때회) {} else if (opts.만난 && opts.만난.y) {
      const 지 = new Date(), 그때 = [S.때풀이(나R, opts.만난.y, opts.만난.m), S.때풀이(그R, opts.만난.y, opts.만난.m)], 이제 = [S.때풀이(나R, 지.getFullYear(), 지.getMonth() + 1), S.때풀이(그R, 지.getFullYear(), 지.getMonth() + 1)];
      const 말꾼 = '책사';
      if (대화) 대화줄(대화.때여는말).forEach(x => 때줄.push(x));
      때줄.push({ 누가: 말꾼, 말: opts.만난.y + '년 ' + opts.만난.m + '월. 지금이랑 견줘 볼게요.' });
      [['당신', 0, 나R], ['그 사람', 1, 그R]].forEach(([n, i, R]) => { 때줄.push({ 누가: 말꾼, 말: '**' + n + '**은요.' });
        이제[i].바람.forEach(t => 때줄.push({ 누가: 말꾼, 말: t }));
        S.때견줌(R, 그때[i], 이제[i]).forEach(t => 때줄.push({ 누가: 말꾼, 말: t })); });
    } else 때줄.push({ 누가: '책사', 말: '두 분이 처음 만난 달을 넣으면, 그때와 지금이 어떻게 달라졌는지 들려 드려요.' });
    // 09-25 v2(사장님 「4화를 제외하는 방안」): 「처음 만났을 때와 지금」 장은 넣지 않는다 — 때의 변질은 안정기 3 · 흔들림 1 사건이 한다
    const 맞줄 = 맞 ? [{ 누가: '책사', 말: '**안고 갈 것**이에요. 쉽게 안 바뀌어요.' }].concat(맞.안고.map(t => ({ 누가: '책사', 말: t })), [{ 누가: '책사', 말: '**맞춰 갈 것**이에요. 말 한마디로 달라져요.' }], 맞.맞춰.map(t => ({ 누가: '책사', 말: t })), [{ 누가: '책사', 말: '안고 갈지, 못 안고 갈지는 두 분이 정해요.' }])
      : [{ 누가: '책사', 말: '두 분 조합의 글은 쓰고 있어요.' }];
    장들.push({ 제목: '그냥 안고 갈 것, 맞춰 볼 것은 뭘까요?', 배경: ['ss-hold'], 줄: 대화 ? 대화줄(대화.맞춤) : 맞줄 });
    // 지금 단계의 질문
    const 단계 = opts.단계 || '썸', 칸 = (단계표.단계 || []).find(x => x.키 === 단계);
    // 시작 전은 곳마다 배경(09-25): 소개팅 · 앱 · 친구 모임 · 회사 · 취미 · 대외활동
    const 곳배경 = 곳그림;
    const 단계배경 = { 시작전: ['story-blind-date', 'story-first-date'], 썸: ['story-he-likes', 'story-contact', 'story-reply', 'story-first-date'], 초반: ['story-second-meet', 'story-say-love'], 안정기: ['story-anniversary', 'story-trip'], 결혼: ['story-marry-talk', 'story-propose'], 흔들림: ['story-fight', 'story-cold'], 재회: ['story-ex-contact', 'story-get-back'] };
    const 배경 = 단계배경[단계] || ['story-still'];
    if (단계 === '썸') ((원고 || (대화 && 대화.썸)) ? S.질문 : []).forEach((q, i) => 장들.push({ 제목: q, 배경: (곳배경.썸 && 곳배경.썸[i]) || [배경[i % 배경.length]], 줄: 썸글(i) ? 대화줄(썸글(i)) : 줄로(원고[i]), 반응: null }));
    else if (칸) { const 글들 = ((단계표.원고 || {})[z.키] || {})[단계] || [];
      칸.질문.forEach((q, i) => 장들.push({ 제목: q, 배경: (곳배경[단계] && 곳배경[단계][i]) || [배경[i % 배경.length]], 줄: 단조(i) ? 대화줄(단조(i)) : 글들[i] ? 줄로(글들[i]) : [{ 누가: '책사', 말: '이 질문의 글은 쓰고 있어요.' }] })); }
    // 09-25 사장님 「1~5를 따로 빼서 선택칸에」: '둘' = 두 사람 이야기(1~5)만, 단계를 고르면 그 단계 이야기만
    const 앞수 = 4;
    if (단계 === '둘') return { 키: z.키, 단계: '두 사람 이야기', 장들: 장들.slice(0, 앞수), 총론수: 앞수 };
    return { 키: z.키, 단계: 칸 ? 칸.이름 : 단계, 장들: 장들.slice(앞수), 총론수: 0 };
  }
  /* 09-25 사장님 「콘텐츠 선택칸 디자인 수정」: 기본 select 는 숨기고 그림 카드로 고른다. select 값 · change 는 그대로 쓴다. */
  const 고름칸 = [
    ['둘', '두 사람 이야기', '우리는 어떤 두 사람일까', 'ss-give'], ['시작전', '시작 전', '첫인상 · 만나는 곳 여섯', 'ss-meet-blind'],
    ['썸', '썸', '막 알아 가는 중', 'ss-sseom-5'], ['초반', '연애 초반', '사귄 지 6개월까지', 'ss-early-1'],
    ['안정기', '안정기', '6개월에서 2년', 'ss-steady-4'], ['결혼', '결혼', '결혼을 생각할 때', 'ss-marry-1'],
    ['흔들림', '흔들릴 때', '권태 · 이별 고민', 'ss-shake-3'], ['재회', '재회', '헤어진 뒤', 'ss-again-3']];
  function 단계카드(sel) {
    if (!sel) return;
    sel.innerHTML = 고름칸.map(([v, 이름, 말]) => '<option value="' + v + '">' + 이름 + ' — ' + 말 + '</option>').join('');
    sel.classList.add('ss-sel-hidden');
    let box = (sel.closest('label') || sel).parentNode.querySelector('.ss-pick');
    if (!box) { box = document.createElement('div'); box.className = 'ss-pick'; box.setAttribute('role', 'radiogroup'); (sel.closest('label') || sel).insertAdjacentElement('afterend', box); }
    const 그리 = () => { box.innerHTML = 고름칸.map(([v, 이름, 말, 그림]) => '<button type="button" role="radio" aria-checked="' + (sel.value === v) + '" class="ss-pk' + (sel.value === v ? ' on' : '') + '" data-v="' + v + '"><img src="art/' + 그림 + '-s.webp" alt="" loading="lazy"><b>' + 이름 + '</b><small>' + 말 + '</small></button>').join('');
      box.querySelectorAll('.ss-pk').forEach(b => b.onclick = () => { if (sel.value === b.dataset.v) return; sel.value = b.dataset.v; 그리(); sel.dispatchEvent(new Event('change', { bubbles: true })); }); };
    그리(); sel.addEventListener('change', 그리); sel._그리 = 그리;
  }

  global.ChaeksaSsomPage = { 그리기, 대본, 단계카드 };
})(window);
