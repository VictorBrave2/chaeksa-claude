/* 정통사주 — 화면 (2026-09-20 사장님 「정통사주 콘텐츠 만들어보자」)
 *
 *   판정엔진(panjeong.js)  +  평생 관점(gwanjeom.js)  =  이 화면          (법전 63조)
 *
 * 이 파일에는 명리가 없다. 생년월일을 받아 엔진을 한 번 부르고, 관점이 내준 말을 장(章)마다 카드로 그린다.
 * 장을 잇지 않고 끊어 둔다 — 세 고전은 서로 다른 것을 보고, 한 글로 이으면 이음매가 어눌해진다.
 * LLM 을 부르지 않는다. 전부 미리 써 둔 칸을 엔진 값으로 골라 내는 것이다.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, P = global.ChaeksaPanjeong, W = global.ChaeksaGwanjeom, PL = global.ChaeksaPlaces, G = global.ChaeksaSaenggeuk;
  if (!E || !P || !W) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const 오행말 = ['목', '화', '토', '금', '수'];
  // 역학(09-24) — 성패 넷은 자평진전이 매긴 말이다. 우리 판정이 아니라 「옛 책은 이렇게 봤다」로 옮긴다. 길흉은 시대 · 환경이 정한다.
  const 성패뜻 = { 섰다: ['성격', '격이 이루어졌다는 말이에요.'], 구제됐다: ['구응', '격을 해치는 글자가 있지만 다른 글자가 구해 준다는 말이에요.'], 띠었다: ['기신 있음', '격은 이루어졌는데 꺼리는 글자가 같이 있다는 말이에요.'], 깨졌다: ['파격', '격을 이루는 글자가 다쳐 격이 이루어지지 못했다는 말이에요.'] };

  // 09-27 장마다 첫 줄 = 1층 답 한 줄. 엔진이 이미 본 값에서만 고른다(지어내지 않는다). 근거는 그 아래 그대로 둔다.
  const 기운이름 = ['나무', '불', '흙', '쇠', '물'];
  const 격사람 = { 정관: '맡은 일을 정해진 대로 반듯하게 해내는 사람이에요.', 편관: '급하고 무거운 일이 몰아쳐도 버티며 밀고 나가는 사람이에요.', 정재: '번 것을 꼬박꼬박 챙기고 틀린 걸 잡아내는 사람이에요.', 편재: '밖으로 돌며 일을 크게 벌려 굴리는 사람이에요.', 정인: '배운 것으로 남을 도와주는 사람이에요.', 편인: '남들이 안 건드리는 걸 혼자 파고드는 사람이에요.', 식신: '없던 걸 만들어 내는 사람이에요.', 상관: '틀린 건 틀렸다고 먼저 말하는 사람이에요.', 비견: '남에게 기대지 않고 제 힘으로 해 나가는 사람이에요.', 겁재: '옆 사람과 겨루면서 크는 사람이에요.' };
  const 격일 = { 정관: '틀이 있는 일, 그 안을 반듯하게 채우는 일이 맞아요.', 편관: '급하고 무거운 일이 맞아요. 눌릴수록 힘이 나요.', 정재: '매일 같은 일, 꼬박꼬박 쌓이는 일이 맞아요.', 편재: '밖에서 크게 벌리는 일이 맞아요. 움직일수록 힘이 나요.', 정인: '배우고 가르치는 일, 남을 도와주는 일이 맞아요.', 편인: '아무도 안 건드리는 걸 혼자 파고드는 일이 맞아요.', 식신: '없던 걸 만들어 내는 일이 맞아요.', 상관: '틀을 깨고 새로 말하는 일이 맞아요.', 비견: '옆 사람과 나란히 하는 일이 맞아요.', 겁재: '겨룰 상대가 있는 일이 맞아요.' };
  const 격키 = (g) => ({ 건록: '비견', 양인: '겁재', 월겁: '겁재', 월비: '비견' }[g] || String(g || '').replace(/격$/, ''));
  const 십삶 = { 정관: '맡은 일과 책임', 편관: '무겁고 급한 일', 정재: '꼬박꼬박 버는 돈과 살림', 편재: '크게 벌이는 돈과 바깥일', 정인: '배움과 자격', 편인: '남들이 안 하는 공부', 식신: '무언가 만들어 내는 일', 상관: '하고 싶은 말과 새로운 시도', 비견: '제 힘으로 하는 일', 겁재: '경쟁과 동료' };
  const 바람 = { 편인: '말 안 해도 알아채 주는 사람', 겁재: '기대는 사이보다 나란히 뛰는 사람', 비견: '친구처럼 나란히 걷는 사람', 식신: '곁에 있으면 편해지는 사람', 상관: '말이 잘 통하는 사람', 편재: '여기저기 같이 다녀 주는 사람', 정재: '꼼꼼하게 생활을 챙겨 주는 사람', 편관: '이끌어 주고 지켜 주는 사람', 정관: '반듯하고 약속을 지키는 사람', 정인: '따뜻하게 받아 주는 사람' };
  const 살뜻 = { 역마: '자리를 자주 옮기고 멀리 다닌다', 함지: '사람을 끄는 매력이 있고 술과 이성에 빠지기 쉽다', 화개: '욕심이 적고 혼자 깊이 파고드는 대신 외롭고 돈과는 멀다', 겁살: '머리가 빠른 대신 밖에서 뭔가를 빼앗기기 쉽다', 망신: '셈이 밝은 대신 안에서 새어 나가는 게 있다', 양인: '기운이 넘쳐서 성질이 급하다', 괴강: '결단이 빠르고 권한을 쥔다', 공망: '그 자리가 비어서 나쁜 것은 풀리고 좋은 것은 흩어진다',
    천을귀인: '이름이 일찍 나고 자리가 쉽게 오른다', 천덕: '나쁜 일을 만나도 저절로 풀린다', 월덕: '나쁜 일을 만나도 저절로 풀린다', 학당: '공부와 시험에 재주가 있다', 금여: '성품이 부드럽고 몸가짐이 온화하다', 록: '몸이 튼튼하고 돈이 넉넉하다' };
  const 철이름 = ['겨울', '겨울', '봄', '봄', '봄', '여름', '여름', '여름', '가을', '가을', '가을', '겨울'];
  const 자리삶 = { 연지: '어린 시절과 집안', 월지: '사회생활', 일지: '나 자신과 배우자', 시지: '자식과 나이 든 뒤' };
  const 몸 = ['간', '심장', '위와 비장', '폐', '신장'];
  const 받 = (w) => { const c = String(w).slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 > 0; };
  const 이가 = (w) => w + (받(w) ? '이' : '가'), 을를 = (w) => w + (받(w) ? '을' : '를'), 과와 = (w) => w + (받(w) ? '과' : '와');
  const 답칸 = (t) => t ? '<p class="jt-answer">' + esc(t) + '</p>' : '';
  // 이름이 여럿이면 뜻이 같은 것끼리 묶는다(천덕 · 월덕).
  const 뜻줄 = (이름들) => { const 묶 = []; 이름들.forEach(n => { const 뜻 = 살뜻[n]; if (!뜻) return; const x = 묶.find(m => m.뜻 === 뜻); if (x) x.이름.push(n); else 묶.push({ 뜻, 이름: [n] }); }); return 묶.map(m => '옛 책은 ' + 이가(m.이름.join(' · ')) + ' 있으면 ' + m.뜻 + '고 봤어요.').join(' '); };

  function 명식표(R) {
    const Pp = R.pillars, gods = (R.analysis && R.analysis.gods) || {}, 순 = ['hour', 'day', 'month', 'year'], 머리 = { hour: '시', day: '일', month: '월', year: '연' };
    const 칸 = (k, 줄) => {
      const p = Pp[k];
      // 태어난 시간을 모르면 시주(p 가 null)는 칸만 두고 비운다. 글자를 지어 넣지 않는다.
      if (!p) return 줄 === 'gan' || 줄 === 'ji' ? '<td class="jt-' + 줄 + '" style="color:var(--ink3)">&nbsp;<small>모름</small></td>' : '<td class="jt-god"></td>';
      if (줄 === 'top') return '<td class="jt-god">' + (k === 'day' ? '나' : esc((gods[k] || {}).stem || '')) + '</td>';
      if (줄 === 'gan') return '<td class="jt-gan e' + E.STEM_ELEM[p.stem] + (k === 'day' ? ' jt-me' : '') + '">' + E.STEMS[p.stem] + '<small>' + E.STEMS_KO[p.stem] + 오행말[E.STEM_ELEM[p.stem]] + '</small></td>';
      if (줄 === 'ji') return '<td class="jt-ji e' + E.BRANCH_ELEM[p.branch] + '">' + E.BRANCHES[p.branch] + '<small>' + E.BRANCHES_KO[p.branch] + 오행말[E.BRANCH_ELEM[p.branch]] + '</small></td>';
      return '<td class="jt-god">' + esc((gods[k] || {}).branch || '') + '</td>';
    };
    const 줄 = (종류) => '<tr>' + 순.map(k => 칸(k, 종류)).join('') + '</tr>';
    return '<table class="jt-table"><tr>' + 순.map(k => '<th>' + 머리[k] + '</th>').join('') + '</tr>' + 줄('top') + 줄('gan') + 줄('ji') + 줄('bot') + '</table>';
  }

  // 장은 접이식이다 — 목차에서 누르면 그 장이 열리며 내려간다. 1장만 처음부터 열어 둔다.
  const 장목록 = [];
  const 장 = (번호, 제목, 부제, 속) => {
    장목록.push([번호, 제목]);
    return '<details class="card jt-ch" id="jtCh' + 번호 + '"' + (번호 === 1 ? ' open' : '') + '><summary><span class="jt-no">제 ' + 번호 + '장</span><h2>' + esc(제목) + '</h2>' + (부제 ? '<p class="jt-sub">' + esc(부제) + '</p>' : '') + '</summary>' + 속 + '</details>';
  };
  const 목차 = () => '<nav class="card jt-toc"><div class="jt-no">목차</div>' + 장목록.map(([n, t]) => '<a href="#jtCh' + n + '" data-ch="' + n + '"><b>' + n + '</b>' + esc(t) + '</a>').join('') + '</nav>';
  const 문단 = (arr) => arr.map(t => '<p>' + esc(t) + '</p>').join('');

  function 그리기(box, input) {
    let R; try { R = E.calc(input); } catch (e) { box.innerHTML = '<p class="hint">이 생년월일은 계산하지 못했어요.</p>'; return; }
    const today = new Date(), 판 = P.판정(R, today, { 운들: [] }), 본 = W.읽기(W.평생, 판, R), 층 = 판.층들[0];
    const 눈 = {}; 본.눈들.forEach(n => { 눈[n.고전] = n; });
    const WM = global.ChaeksaGungtongWonmun || { 구절: {}, 계절: {} };
    const 일간 = E.STEMS[R.pillars.day.stem], 월지 = E.BRANCHES[R.pillars.month.branch];
    const 일간받침 = [0, 3].indexOf(E.STEM_ELEM[R.pillars.day.stem]) >= 0;   // 갑목 · 경금처럼 목 · 금으로 끝나면 받침이 있다(경금으로 · 경금이에요)
    const out = []; 장목록.length = 0;

    // 목차는 열세 장이다(사장님 09-20 「왜 1~13까지 펼치지 않는 것인지」). 아직 못 지은 장도 자리를 펴 두고, 무엇으로 지을지를 적는다.
    const 준비 = (말) => '<p class="jt-yet">' + esc(말) + '</p>';
    // 태어난 시간을 모르면 R.pillars.hour 가 null 이다. 시주는 비우고 나머지 여섯 글자로 그린다.
    // 장마다 따로 감싼다 — 한 장이 죽어도 나머지 장은 나온다(전에는 한 장이 죽으면 열세 장이 다 안 나왔다).
    const 시없음 = !R.pillars.hour, 있는자리 = ['year', 'month', 'day', 'hour'].filter(k => R.pillars[k]), 온수 = 시없음 ? '여섯' : '여덟';
    const 못그림 = 시없음 ? '태어난 시간을 알아야 이 장을 볼 수 있어요. 시간 없이 보는 법은 준비하고 있어요.' : '이 장을 지금 그리지 못했어요. 잠시 뒤에 다시 열어 주세요.';
    const 안전 = (번호, 제목, 부제, 짓기, 답짓기) => {
      let 답 = ''; try { 답 = 답짓기 ? 답짓기() : ''; } catch (e) { 답 = ''; }
      let 속; try { 속 = 답칸(답) + 짓기(); } catch (e) { 속 = 준비(못그림); if (global.console) console.warn('정통사주 ' + 번호 + '장', e); }
      out.push(장(번호, 제목, 부제, 속));
    };
    const 기 = 층.기세, 적 = 눈['적천수'];
    // 눈에 보이는 여덟 글자를 그대로 센다(천간 넷 + 지지 넷, 시를 모르면 여섯). 기세의 「무리」는 뿌리 없는 천간을 빼서 합이 여덟이 안 된다.
    const 센 = [0, 0, 0, 0, 0]; 있는자리.forEach(k => { 센[E.STEM_ELEM[R.pillars[k].stem]]++; 센[E.BRANCH_ELEM[R.pillars[k].branch]]++; });
    const 오행줄 = '<div class="jt-oh">' + 센.map((n, o) => '<span class="e' + o + '"><b>' + 오행말[o] + '</b>' + n + '자</span>').join('') + '</div>';

    // 1장 — 사주팔자 · 오행 · 흐름(적천수)
    const 일오 = E.STEM_ELEM[R.pillars.day.stem], 일지신 = ((R.analysis && R.analysis.gods || {}).day || {}).branch;
    const 답1 = () => { if (!기 || !기.으뜸) return ''; const 센 = 기.으뜸.오행;
      return '당신 사주에서 가장 힘이 센 건 ' + 기운이름[센] + ' 기운이에요. ' + (센 === 일오 ? '바로 당신을 뜻하는 기운이에요.' : '당신을 뜻하는 ' + 기운이름[일오] + ' 기운은 ' + (기.나 && 기.나.뿌리 ? '받쳐 주는 글자가 있어서 제 힘으로 서 있어요.' : '받쳐 주는 글자가 없어서 혼자 서 있어요.')); };
    안전(1, '나의 사주팔자', (시없음 ? '여섯' : '여덟') + ' 글자 가운데 어떤 기운이 가장 센가', () =>
      명식표(R) + 문단(['붉은 테를 두른 글자가 나예요. ' + G.이름(R.pillars.day.stem) + (일간받침 ? '으로' : '로') + ' 태어났어요.', '글자 위아래의 작은 말은 그 글자가 나에게 무엇인지를 부르는 이름이에요. 3장에서 하나씩 풀어 드려요.'].concat(시없음 ? ['태어난 시간을 몰라서 시주(맨 왼쪽 두 글자)는 비워 뒀어요.'] : []))
      + (오행줄 ? '<h3>오행이 몇 글자씩 있나</h3>' + 오행줄 + (시없음 ? 준비('시주를 뺀 여섯 글자로 셌어요.') : '') : '')
      + (적 ? '<h3>기운이 어디로 흐르나 — 적천수</h3>' + 문단(적.풀이) : ''), 답1);

    // 2장 — 일주 · 계절이 찾는 글자(궁통보감)
    // 일주 칸 = 발밑 글자의 십신(왜) + 통설(ilju.js · 세 곳 이상 같게 말한 것만) + 십이운성(삼명통회). 통설은 고전이 아니라고 밝힌다.
    // 09-24 사장님 「통설로 콘텐츠를 만들면 재미없지」 — 웹 통설(ilju.js · docs/57)은 출처가 콘텐츠 농장이라 걷었다. 원문 · 계산만 낸다.
    const 일주 = 일간 + E.BRANCHES[R.pillars.day.branch], 통 = {}, 발밑 = ((R.analysis && R.analysis.gods || {}).day || {}).branch;
    let 일운 = null; try { 일운 = global.ChaeksaSamyeong ? global.ChaeksaSamyeong.십이운성(R)[2] : null; } catch (e) {}
    const 철 = WM.계절[월지], 구 = WM.구절[일간 + 월지], 궁 = 눈['궁통보감'];
    const 답2 = () => { const j = 층.조후; if (!j || !j.need) return ''; const 필요 = 기운이름[E.STEM_ELEM[E.STEMS.indexOf(j.need)]], 넘침 = { 목: '나무', 화: '불', 토: '흙', 금: '쇠', 수: '물' }[j.기신];
      return 철이름[R.pillars.month.branch] + '에 태어난 당신에게 가장 필요한 건 ' + 필요 + ' 기운이에요. '
        + (j.hasMain ? (j.감점 > 0 ? '사주에 있기는 한데, ' + (넘침 ? 넘침 + ' 기운이 너무 많아서 ' : '') + '옛 책이 조심하라고 한 사주예요.' : '사주에 이미 있어서 좋은 상태예요.')
          : (j.hasAux ? '사주에는 없고 돕는 기운만 있어요. 없는 기운은 운으로 와요.' : '사주에는 없어요. 없는 기운은 운으로 와요.')); };
    안전(2, '태어난 날과 계절', '어느 계절에 태어났고, 그 계절에 나에게 무엇이 필요한가', () => {
      const 일주칸 = 문단([
        G.이름(R.pillars.day.stem) + ([0, 3].indexOf(E.STEM_ELEM[R.pillars.day.stem]) >= 0 ? '으로' : '로') + ' 태어나 ' + G.지이름(R.pillars.day.branch) + ' 위에 앉았어요.' + (발밑 ? ' 내 발밑의 이 글자는 나에게 ' + 발밑 + (W.십신뜻[발밑] ? '(' + W.십신뜻[발밑] + ')' : '') + '이에요. 나와 한 기둥을 이루는, 나에게 가장 가까운 글자예요.' : ''),
      ].concat([통.장점, 통.일, 통.단점].filter(Boolean))
        .concat(일운 ? ['내가 선 이 글자에서 나는 십이운성으로 ' + 일운.단계 + '(' + 일운.한자 + ')' + ((일운.단계.charCodeAt(일운.단계.length - 1) - 0xAC00) % 28 > 0 ? '이에요. ' : '예요. ') + 일운.뜻] : []))
        + ((통.장점 || 통.일 || 통.단점) ? '<p class="jt-yet">「~다고들 해요」로 적은 줄은 고전에 있는 글이 아니라 요즘 명리가들이 두루 하는 말을 모은 거예요. 여러 곳이 같게 말하는 것만 실었어요.</p>' : '');
      return '<h3>나의 일주 — ' + esc(E.STEMS_KO[R.pillars.day.stem] + E.BRANCHES_KO[R.pillars.day.branch] + '(' + 일주 + ')') + '</h3>' + 일주칸
        + '<h3>계절이 나에게 찾는 글자 — 궁통보감</h3>'
        + (철 ? 문단([철[0] + '에 태어났어요. ' + 철[1], 철[2].replace('열 아이', '열 천간').replace('많은 아이에게', '많은 천간에게').replace('아이마다', '천간마다')]) : '')
        + (궁 ? 문단(궁.풀이) : '')
        + (구 ? '<blockquote class="jt-q"><p>원문 「' + esc(구[0]) + '」</p><p>' + esc(구[1]) + '</p></blockquote>' : '')
        + 문단(['원국에 없는 글자는 없는 것이 아니라 운으로 와요. 언제 오는지는 11장에 적었어요.']);
    }, 답2);

    // 3장 — 십성 · 격(자평진전)
    const s = 층.성패 || {}, 뜻 = 성패뜻[s.판정], gods = (R.analysis && R.analysis.gods) || {}, 자리말 = { year: '연', month: '월', day: '일', hour: '시' };
    const 남수 = 시없음 ? '다섯' : '일곱';
    const 답3 = () => { if (!s.격) return '이 사주는 한 가지 모습으로 잡기 어려워요.'; const 사람 = 격사람[격키(s.격)]; if (!사람) return '';
      const 상태 = { 섰다: '좋은', 구제됐다: '좋은', 띠었다: '나쁜', 깨졌다: '나쁜' }[s.판정];
      return '당신은 ' + 사람 + (상태 ? ' 지금 이 기운은 ' + 상태 + ' 상태예요.' : ''); };
    안전(3, '나를 둘러싼 ' + 남수 + ' 글자 — 십성', 남수 + ' 글자가 나에게 무엇이고, 그래서 나는 어떤 사람인가', () => {
      const 십줄 = []; 있는자리.forEach(k => { const g = gods[k] || {}; if (k !== 'day' && g.stem) 십줄.push(자리말[k] + '간 — ' + g.stem + (W.십신뜻[g.stem] ? '(' + W.십신뜻[g.stem] + ')' : '')); if (g.branch) 십줄.push(자리말[k] + '지 — ' + g.branch + (W.십신뜻[g.branch] ? '(' + W.십신뜻[g.branch] + ')' : '')); });
      return '<ul class="jt-li">' + 십줄.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>'
        + '<h3>나의 격, 나의 역할 — 자평진전</h3>'
        + (s.격 ? 문단(['태어난 달에서 ' + s.격 + '격을 잡아요.' + (뜻 ? ' 자평진전은 이 짜임을 「' + 뜻[0] + '」으로 보았어요 — ' + 뜻[1] + ' 옛 책의 길흉이라, 요즘 삶에서는 다르게 드러날 수 있어요.' : '')]) : 문단(['이 ' + (시없음 ? '여섯' : '여덟') + ' 글자로는 격을 하나로 잡기 어려워요.']))
        + '<div id="jtSeol"></div>';
    }, 답3);

    // 4 · 5 · 6장 — 삼명통회(samyeong.js · docs/56). 책이 한 말을 옮길 뿐, 길흉을 매기지 않는다.
    const SM = global.ChaeksaSamyeong;
    const 원문칸 = (어디, 원문) => '<blockquote class="jt-q"><p>삼명통회 ' + esc(어디) + '</p><p>「' + esc(원문) + '」</p></blockquote>';
    const 살칸 = (x) => '<div class="jt-du"><div class="jt-du-h"><b>' + esc(x.이름) + '</b><span>' + esc(x.글[0]) + '</span></div>' + 문단(x.줄.concat([x.글[3]])) + 원문칸(x.글[1], x.글[2]) + '</div>';
    if (SM) {
      const 답4 = () => { const 순 = ['제왕', '건록', '관대', '장생'], 운 = SM.십이운성(R).filter(u => 순.indexOf(u.단계) >= 0).sort((a, b) => 순.indexOf(a.단계) - 순.indexOf(b.단계));
        if (!운.length) return (시없음 ? '세' : '네') + ' 자리 모두 당신 힘이 약하거나 아직 자라는 단계예요. 옛 책은 힘이 약하다고 곧 나쁘다 하지 않았어요.';
        return '당신 힘이 가장 센 곳은 ' + (자리삶[운[0].자리] || 운[0].자리) + ' 쪽이에요.'; };
      안전(4, '자리마다 내 힘 — 십이운성', '어린 시절 · 사회생활 · 나와 배우자' + (시없음 ? '' : ' · 자식') + ' 자리에서 내 힘이 얼마나 되나', () => {
        const 운 = SM.십이운성(R);
        return 문단(['내 글자는 ' + G.이름(R.pillars.day.stem) + (일간받침 ? '이에요' : '예요') + '. 이 글자를 지지 ' + (시없음 ? '세' : '네') + ' 글자에 하나씩 대 보면, 자리마다 사람의 한살이 열두 단계 가운데 하나가 나와요. 삼명통회는 만물이 도는 것이 사람이 나고 죽는 것과 닮았다고 했어요.'])
          + 운.map(u => '<div class="jt-du"><div class="jt-du-h"><b>' + esc(u.자리 + ' ' + u.지지) + '</b><span>' + esc(u.단계 + '(' + u.한자 + ')') + '</span></div>' + 문단([u.뜻]) + '</div>').join('')
          + (시없음 ? '<div class="jt-du"><div class="jt-du-h"><b>시지</b><span>모름</span></div>' + 문단(['시간을 모르면 이 칸은 비워요.']) + '</div>' : '')
          + 원문칸('卷二 論五行旺相休囚死並寄生十二宫', SM.운성맺음[0]) + 문단([SM.운성맺음[1]]);
      }, 답4);
      const 이름모음 = (arr) => arr.map(x => x.이름).filter((n, i, a) => a.indexOf(n) === i);
      const 답5 = () => { const n = 이름모음(SM.신살(R)); return n.length ? '당신 사주에는 ' + 이가(n.join(' · ')) + ' 있어요. ' + 뜻줄(n) : '옛 책이 꼽은 여덟 가지 살 가운데 당신 사주에 있는 건 없어요.'; };
      const 답6 = () => { const n = 이름모음(SM.귀인(R)); return n.length ? '당신 사주에는 ' + 이가(n.join(' · ')) + ' 있어요. ' + 뜻줄(n) : '옛 책이 꼽은 여섯 가지 귀인 가운데 당신 사주에 있는 건 없어요. 귀인은 운으로도 와요.'; };
      안전(5, '신살', '역마 · 함지(도화) · 화개 · 겁살 · 망신 · 양인 · 괴강 · 공망 — 옛 책이 꼽은 여덟 가지 가운데 나에게 있는 것', () => {
        const 살 = SM.신살(R);
        return 문단(['삼명통회가 찾는 법 그대로 찾았어요. 역마 · 함지 · 화개 · 겁살 · 망신은 책대로 태어난 해에서 찾아요. 요즘 흔히 쓰는 표와 다를 수 있어요. 책에 없는 살(백호대살 등)은 싣지 않았어요.'].concat(시없음 ? ['태어난 시간을 몰라서 시지에 있는 살은 찾지 않았어요. 시지는 비워 뒀어요.'] : []))
          + (살.length ? 살.map(살칸).join('') : 문단(['여덟 가지 가운데 이 ' + 온수 + ' 글자에 있는 것은 없어요.']));
      }, 답5);
      안전(6, '귀인', '천을귀인 · 천덕 · 월덕 · 학당 · 록 · 금여 — 옛 책이 도움으로 본 여섯 가지 가운데 나에게 있는 것', () => {
        const 귀 = SM.귀인(R);
        return 문단(['이것도 삼명통회가 찾는 법 그대로예요. 책은 귀인이 있어도 그 자리가 힘이 없거나, 충을 맞거나, 공망에 들면 없는 것과 같다고 했어요.'].concat(시없음 ? ['태어난 시간을 몰라서 시주에 있는 귀인은 찾지 않았어요. 시주는 비워 뒀어요.'] : []))
          + (귀.length ? 귀.map(살칸).join('') : 문단(['여섯 가지 가운데 이 ' + 온수 + ' 글자에 있는 것은 없어요. 귀인은 운으로도 와요.']));
      }, 답6);
    }
    // 7 ~ 10장 — 영역(yeongyeok.js). 고전 원문(docs/59)을 앞에, 통설(docs/58)은 「~다고들 해요」로 뒤에.
    const YY = global.ChaeksaYeongyeok;
    // 통설 줄(「~다고들 해요」 · 「~는 말이 많아요」)은 걷는다(09-24). 원문 · 계산 줄만 남고, 남는 게 없는 칸은 안 그린다.
    const 통설말 = /고들 해요|는 말이 많아요|말도 있어요|따라다녀요|요즘 명리가들|두루 하는 말/;
    const 걸러 = (칸들) => 칸들.map(x => Object.assign({}, x, { 줄: (x.줄 || []).filter(t => !통설말.test(t)) })).filter(x => x.줄.length || x.원문);
    const 영칸 = (x) => '<div class="jt-du"><div class="jt-du-h"><b>' + esc(x.제목) + '</b></div>' + 문단(x.줄) + (x.원문 ? '<blockquote class="jt-q"><p>' + esc(x.원문[0]) + '</p><p>「' + esc(x.원문[1]) + '」</p></blockquote>' : '') + '</div>';
    const 통설주 = '<p class="jt-yet">「많다」는 나 말고 ' + (시없음 ? '다섯 글자 가운데 셋 이상일 때예요. 태어난 시간을 몰라서 시주 두 글자를 뺀 여섯 글자로 셌어요.' : '일곱 글자 가운데 셋 이상일 때예요.') + '</p>';
    if (YY) {
      const 일 = YY.일곱(R), 센다 = (이름들) => 일.filter(x => 이름들.indexOf(x.신) >= 0).length, 여자 = input.gender === 'F';
      const 답7 = () => { const 정 = 센다(['정재']), 편 = 센다(['편재']), 식 = 센다(['식신', '상관']);
        if (!정 && !편) return '당신 사주에는 돈을 뜻하는 글자가 겉으로 없어요. 그 글자가 들어오는 해는 11 · 12장에 적었어요.';
        return '돈을 뜻하는 글자가 ' + (정 + 편) + '개 있어요. ' + (정 && 편 ? '꼬박꼬박 버는 돈과 기회로 버는 돈이 같이 있어요.' : 정 ? '꼬박꼬박 들어와 쌓이는 돈이에요.' : '기회를 잡아 한 번에 버는 돈이에요.') + (식 ? ' 잘하는 걸 해서 돈으로 바꾸는 사람이에요.' : ''); };
      const 답8 = () => { const 짝 = 여자 ? '남편' : '아내', n = 센다(여자 ? ['정관', '편관'] : ['정재', '편재']);
        return (바람[일지신] ? '당신은 ' + 바람[일지신] + '한테 끌려요. ' : '') + (n ? '사주에 ' + 을를(짝) + ' 뜻하는 글자가 ' + n + '개 있어요.' : '사주에 ' + 을를(짝) + ' 뜻하는 글자는 겉으로 없어요. 그 글자가 들어오는 해는 11 · 12장에 적었어요.'); };
      const 답10 = () => { const 친다 = (일오 + 3) % 5, n = 센[친다];
        return '옛 책은 당신을 뜻하는 글자를 ' + 과와(몸[일오]) + ' 짝지었어요. ' + (n >= 3 ? '이 글자를 누르는 ' + 기운이름[친다] + ' 기운이 ' + n + '개로 많아서, ' + 몸[일오] + ' 쪽을 살피라고 했어요.' : '이 글자를 누르는 ' + 기운이름[친다] + ' 기운은 ' + n + '개예요.'); };
      안전(7, '재물운', '돈을 뜻하는 글자가 있나, 어떤 돈인가', () => 걸러(YY.재물(R)).map(영칸).join('') + 통설주, 답7);
      안전(8, '연애 · 결혼운', '어떤 사람에게 끌리나, 짝을 뜻하는 글자가 있나', () => 걸러(YY.연애(R, input.gender === 'F' ? 'F' : 'M')).map(영칸).join('') + 통설주, 답8);
      안전(9, '직업운', '나에게 맞는 일', () => 걸러(YY.직업(R, s.격, null, s.상신)).map(영칸).join('') + 통설주, () => s.격 && 격일[격키(s.격)] ? '당신에게는 ' + 격일[격키(s.격)] : '');
      안전(10, '건강운', '옛 책이 내 글자와 짝지은 몸', () => 걸러(YY.건강(R)).map(영칸).join(''), 답10);
    }

    // 대운 한 칸이 길다 — 앞 세 줄만 보이고 나머지는 접는다. 지금 대운은 펴 둔다.
    const 접어 = (줄, 편) => 줄.length <= 3 || 편 ? 문단(줄) : 문단(줄.slice(0, 3)) + '<details class="jt-more"><summary>이 10년에 만나는 글자 ' + (줄.length - 3) + '줄 더 보기</summary>' + 문단(줄.slice(3)) + '</details>';
    // 11장 — 대운
    const 올해 = today.getFullYear();
    const 시주빈말 = 시없음 ? 문단(['태어난 시간을 몰라서 운의 글자가 시주와 부딪히거나 짝을 짓는 것은 보지 않았어요. 시지(자식 자리)는 비워 뒀어요.']) : '';
    const ds = R.pillars.day.stem, db = R.pillars.day.branch, 대목록 = (R.daeun && R.daeun.list) || [];
    const 본십 = (br) => { const h = (E.HIDDEN[br] || [])[0]; return E.TEN_GODS[E.tenGod(ds, typeof h === 'number' ? h : h[0])]; };
    const 마음몸 = (st, br) => { const 하 = E.TEN_GODS[E.tenGod(ds, st)], 땅 = 본십(br); return 하 === 땅 ? '마음도 몸도 ' + 십삶[하] + ' 쪽으로 가요.' : 십삶[하] + '에 마음이 가고, 몸은 ' + 십삶[땅] + ' 쪽으로 움직여요.'; };
    const 닿음 = (br, 때) => (br - db + 12) % 12 === 6 ? ' 태어난 날의 글자와 부딪히는 ' + 때 + (받(때) ? '이라서' : '라서') + ', 나와 배우자 쪽 일이 크게 움직여요.' : ([1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2][br] === db ? ' 태어난 날의 글자와 붙는 ' + 때 + (받(때) ? '이라서' : '라서') + ', 나와 배우자 쪽 일이 묶이거나 새로 생겨요.' : '');
    const 답11 = () => { const d = 대목록.filter(x => x.startYear <= 올해).pop(); if (!d) return 대목록[0] ? 대목록[0].startYear + '년에 첫 10년 운이 시작돼요.' : '';
      return '지금 10년(' + d.startYear + '년부터)은 ' + 마음몸(d.stem, d.branch) + 닿음(d.branch, '10년'); };
    const 답12 = () => { const st = ((올해 - 4) % 10 + 10) % 10, br = ((올해 - 4) % 12 + 12) % 12, 바뀜 = 대목록.find(x => x.startYear > 올해 && x.startYear < 올해 + 5);
      return '올해(' + 올해 + '년)는 ' + 마음몸(st, br) + 닿음(br, '해') + (바뀜 ? ' ' + 바뀜.startYear + '년에 10년 운이 바뀌어요.' : ''); };
    // 09-27 사장님 「대운칸 삭제하자 꼬이는 것 같아」 — 10년마다의 목록(천간 · 지지 두 줄씩 되풀이)은 걷고 첫 줄(지금 10년) 답만 둔다
    안전(11, '10년마다 바뀌는 운 — 대운', '10년마다 마음이 가는 곳과 몸이 움직이는 곳이 바뀌어요.', () => 시주빈말, 답11);

    안전(12, '앞으로 다섯 해', '해마다 마음이 가는 곳과 몸이 움직이는 곳. 그해의 대운 위에 얹어서 읽었어요.', () => {
      const 세 = W.세운 ? W.세운(R, 올해, 5, input.gender === 'F' ? 'F' : 'M') : [];
      return 시주빈말 + 세.map((d, i) => '<div class="jt-du' + (i === 0 ? ' now' : '') + '"><div class="jt-du-h"><b>' + d.해 + '년</b><span>' + esc(d.간지) + (d.대운 ? ' · ' + esc(d.대운) + ' 대운 안' : '') + '</span>' + (i === 0 ? '<i>올해</i>' : '') + '</div>' + 문단(d.줄) + '</div>').join('');
    }, 답12);
    out.push(장(13, '질문과 답', '', 준비('준비하고 있어요.')));

    box.innerHTML = 목차() + out.join('');
    box.querySelectorAll('.jt-toc a').forEach(a => a.addEventListener('click', () => { const d = box.querySelector('#jtCh' + a.dataset.ch); if (d) d.open = true; }));
    try { const S = global.ChaeksaSeolmyeong, b = box.querySelector('#jtSeol'); if (S && b) S.render(R, today, b, {}); } catch (e) {}
  }

  function 세우기() {
    const box = document.getElementById('jtOut'), f = document.getElementById('jtForm'); if (!box || !f) return;
    const q = (id) => document.getElementById(id);
    if (PL) q('jtPlace').innerHTML = PL.options();
    // 앱에 이미 넣어 둔 생년월일이 있으면 그대로 쓴다
    let p = null; try { p = JSON.parse(localStorage.getItem('chaeksa.profile') || 'null'); } catch (e) {}
    if (p && p.year) {
      q('jtDate').value = p.year + '-' + String(p.month).padStart(2, '0') + '-' + String(p.day).padStart(2, '0');
      if (!p.noTime && p.hour != null && p.hour !== '') q('jtTime').value = String(p.hour).padStart(2, '0') + ':' + String(p.minute || 0).padStart(2, '0');
      else if (q('jtNoTime')) q('jtNoTime').checked = true;   // 앱에서 「시간을 몰라요」로 넣은 사람 — 낮 12시로 풀지 않는다
      q('jtG').value = p.gender === 'F' ? 'F' : 'M';
    }
    // 「시간을 몰라요」 — 체크하면 시각 칸을 잠그고 hour 를 null 로 넘긴다(시주는 비운다)
    const 모름 = () => !!(q('jtNoTime') && q('jtNoTime').checked);
    const 잠금 = () => { q('jtTime').disabled = 모름(); };
    if (q('jtNoTime')) { q('jtNoTime').addEventListener('change', 잠금); 잠금(); }
    f.onsubmit = (e) => {
      e.preventDefault();
      const [y, m, d] = (q('jtDate').value || '').split('-').map(Number), [hh, mi] = (q('jtTime').value || '12:00').split(':').map(Number);
      if (!y || !m || !d) return;
      const 곳 = PL ? PL.resolve(q('jtPlace').value) : { lon: 126.98, tzOffset: null };
      그리기(box, { year: y, month: m, day: d, hour: 모름() ? null : hh, minute: 모름() ? 0 : (mi || 0), gender: q('jtG').value, longitude: 곳.lon, tzOffset: 곳.tzOffset });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 세우기); else 세우기();
  global.ChaeksaJeongtong = { 그리기 };
})(window);
