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
  const 성패뜻 = { 섰다: ['성격', '격이 이루어졌어요.'], 구제됐다: ['구응', '격을 해치는 글자가 있지만 다른 글자가 구해 줘요.'], 띠었다: ['기신 있음', '격은 이루어졌는데 꺼리는 글자가 같이 있어요.'], 깨졌다: ['파격', '격을 이루는 글자가 다쳐서 격이 깨졌어요.'] };

  function 명식표(R) {
    const Pp = R.pillars, gods = (R.analysis && R.analysis.gods) || {}, 순 = ['hour', 'day', 'month', 'year'], 머리 = { hour: '시', day: '일', month: '월', year: '연' };
    const 칸 = (k, 줄) => {
      const p = Pp[k];
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
    const out = []; 장목록.length = 0;

    // 목차는 열세 장이다(사장님 09-20 「왜 1~13까지 펼치지 않는 것인지」). 아직 못 지은 장도 자리를 펴 두고, 무엇으로 지을지를 적는다.
    const 준비 = (말) => '<p class="jt-yet">' + esc(말) + '</p>';
    const 기 = 층.기세, 적 = 눈['적천수'];
    // 눈에 보이는 여덟 글자를 그대로 센다(하늘 넷 + 땅 넷). 기세의 「무리」는 뿌리 없는 천간을 빼서 합이 여덟이 안 된다.
    const 센 = [0, 0, 0, 0, 0]; ['year', 'month', 'day', 'hour'].forEach(k => { 센[E.STEM_ELEM[R.pillars[k].stem]]++; 센[E.BRANCH_ELEM[R.pillars[k].branch]]++; });
    const 오행줄 = '<div class="jt-oh">' + 센.map((n, o) => '<span class="e' + o + '"><b>' + 오행말[o] + '</b>' + n + '자</span>').join('') + '</div>';

    // 1장 — 사주팔자 · 오행 · 흐름(적천수)
    out.push(장(1, '나의 사주팔자', '여덟 글자와 오행, 기운이 흐르는 길',
      명식표(R) + 문단(['붉은 테를 두른 글자가 나예요. ' + G.이름(R.pillars.day.stem) + '로 태어났어요.', '글자 위아래의 작은 말은 그 글자가 나에게 무엇인지를 부르는 이름이에요. 3장에서 하나씩 풀어 드려요.'])
      + (오행줄 ? '<h3>오행이 몇 글자씩 있나</h3>' + 오행줄 : '')
      + (적 ? '<h3>기운이 어디로 흐르나 — 적천수</h3>' + 문단(적.풀이) : '')));

    // 2장 — 일주 · 계절이 찾는 글자(궁통보감)
    // 일주 칸 = 발밑 글자의 십신(왜) + 통설(ilju.js · 세 곳 이상 같게 말한 것만) + 십이운성(삼명통회). 통설은 고전이 아니라고 밝힌다.
    const 일주 = 일간 + E.BRANCHES[R.pillars.day.branch], 통 = (global.ChaeksaIlju || {})[일주] || {}, 발밑 = ((R.analysis && R.analysis.gods || {}).day || {}).branch;
    const 일운 = global.ChaeksaSamyeong ? global.ChaeksaSamyeong.십이운성(R)[2] : null;
    const 일주칸 = 문단([
      G.이름(R.pillars.day.stem) + ([0, 3].indexOf(E.STEM_ELEM[R.pillars.day.stem]) >= 0 ? '으로' : '로') + ' 태어나 ' + G.지이름(R.pillars.day.branch) + ' 위에 앉았어요.' + (발밑 ? ' 내 발밑의 이 글자는 나에게 ' + 발밑 + (W.십신뜻[발밑] ? '(' + W.십신뜻[발밑] + ')' : '') + '이에요. 나와 한 기둥을 이루는, 나에게 가장 가까운 글자예요.' : ''),
    ].concat([통.장점, 통.일, 통.단점].filter(Boolean))
      .concat(일운 ? ['내가 선 이 글자에서 나는 십이운성으로 ' + 일운.단계 + '(' + 일운.한자 + ')' + ((일운.단계.charCodeAt(일운.단계.length - 1) - 0xAC00) % 28 > 0 ? '이에요. ' : '예요. ') + 일운.뜻] : []))
      + ((통.장점 || 통.일 || 통.단점) ? '<p class="jt-yet">「~다고들 해요」로 적은 줄은 고전에 있는 글이 아니라 요즘 명리가들이 두루 하는 말을 모은 거예요. 여러 곳이 같게 말하는 것만 실었어요.</p>' : '');
    const 철 = WM.계절[월지], 구 = WM.구절[일간 + 월지], 궁 = 눈['궁통보감'];
    out.push(장(2, '일주와 계절', '내가 어떤 글자로, 어느 계절에 태어났나',
      '<h3>나의 일주 — ' + esc(E.STEMS_KO[R.pillars.day.stem] + E.BRANCHES_KO[R.pillars.day.branch] + '(' + 일주 + ')') + '</h3>' + 일주칸
      + '<h3>계절이 나에게 찾는 글자 — 궁통보감</h3>'
      + (철 ? 문단([철[0] + '에 태어났어요. ' + 철[1], 철[2].replace('열 아이', '열 천간').replace('많은 아이에게', '많은 천간에게').replace('아이마다', '천간마다')]) : '')
      + (궁 ? 문단(궁.풀이) : '')
      + (구 ? '<blockquote class="jt-q"><p>원문 「' + esc(구[0]) + '」</p><p>' + esc(구[1]) + '</p></blockquote>' : '')
      + 문단(['원국에 없는 글자는 없는 것이 아니라 운으로 와요. 언제 오는지는 11장에 적었어요.'])));

    // 3장 — 십성 · 격(자평진전)
    const s = 층.성패 || {}, 뜻 = 성패뜻[s.판정], gods = (R.analysis && R.analysis.gods) || {}, 자리말 = { year: '연', month: '월', day: '일', hour: '시' };
    const 십줄 = []; ['year', 'month', 'day', 'hour'].forEach(k => { const g = gods[k] || {}; if (k !== 'day' && g.stem) 십줄.push(자리말[k] + ' 하늘 — ' + g.stem + (W.십신뜻[g.stem] ? '(' + W.십신뜻[g.stem] + ')' : '')); if (g.branch) 십줄.push(자리말[k] + ' 땅 — ' + g.branch + (W.십신뜻[g.branch] ? '(' + W.십신뜻[g.branch] + ')' : '')); });
    out.push(장(3, '십성 — 나를 둘러싼 일곱 글자', '나머지 일곱 글자가 나에게 무엇인가, 그리고 그 짜임(자평진전)',
      '<ul class="jt-li">' + 십줄.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>'
      + '<h3>나의 격, 나의 역할 — 자평진전</h3>'
      + (s.격 ? 문단(['태어난 달에서 ' + s.격 + '격을 잡아요.' + (뜻 ? ' 지금 모습은 「' + 뜻[0] + '」 — ' + 뜻[1] : '')]) : 문단(['이 여덟 글자로는 격을 하나로 잡기 어려워요.']))
      + '<div id="jtSeol"></div>'));

    // 4 · 5 · 6장 — 삼명통회(samyeong.js · docs/56). 책이 한 말을 옮길 뿐, 길흉을 매기지 않는다.
    const SM = global.ChaeksaSamyeong;
    const 원문칸 = (어디, 원문) => '<blockquote class="jt-q"><p>삼명통회 ' + esc(어디) + '</p><p>「' + esc(원문) + '」</p></blockquote>';
    const 살칸 = (x) => '<div class="jt-du"><div class="jt-du-h"><b>' + esc(x.이름) + '</b><span>' + esc(x.글[0]) + '</span></div>' + 문단(x.줄.concat([x.글[3]])) + 원문칸(x.글[1], x.글[2]) + '</div>';
    if (SM) {
      const 운 = SM.십이운성(R);
      out.push(장(4, '십이운성', '내가 네 자리에서 각각 얼마나 힘이 있나',
        문단(['내 글자는 ' + G.이름(R.pillars.day.stem) + '예요. 이 글자를 땅의 네 글자에 하나씩 대 보면, 자리마다 사람의 한살이 열두 단계 가운데 하나가 나와요. 삼명통회는 만물이 도는 것이 사람이 나고 죽는 것과 닮았다고 했어요.'])
        + 운.map(u => '<div class="jt-du"><div class="jt-du-h"><b>' + esc(u.자리 + ' ' + u.지지) + '</b><span>' + esc(u.단계 + '(' + u.한자 + ')') + '</span></div>' + 문단([u.뜻]) + '</div>').join('')
        + 원문칸('卷二 論五行旺相休囚死並寄生十二宫', SM.운성맺음[0]) + 문단([SM.운성맺음[1]])));
      const 살 = SM.신살(R), 귀 = SM.귀인(R);
      out.push(장(5, '신살', '역마 · 함지(도화) · 화개 · 겁살 · 망신 · 양인 · 괴강 · 공망 가운데 나에게 있는 것',
        문단(['삼명통회가 찾는 법 그대로 찾았어요. 역마 · 함지 · 화개 · 겁살 · 망신은 책대로 태어난 해에서 찾아요. 요즘 흔히 쓰는 표와 다를 수 있어요. 책에 없는 살(백호대살 등)은 싣지 않았어요.'])
        + (살.length ? 살.map(살칸).join('') : 문단(['여덟 가지 가운데 이 여덟 글자에 있는 것은 없어요.']))));
      out.push(장(6, '귀인', '천을귀인 · 천덕 · 월덕 · 학당 · 록 · 금여 가운데 나에게 있는 것',
        문단(['이것도 삼명통회가 찾는 법 그대로예요. 책은 귀인이 있어도 그 자리가 힘이 없거나, 충을 맞거나, 공망에 들면 없는 것과 같다고 했어요.'])
        + (귀.length ? 귀.map(살칸).join('') : 문단(['여섯 가지 가운데 이 여덟 글자에 있는 것은 없어요. 귀인은 운으로도 와요.']))));
    }
    out.push(장(7, '재물운', '', 준비('준비하고 있어요.')));
    out.push(장(8, '연애 · 결혼운', '', 준비('준비하고 있어요.')));
    out.push(장(9, '직업운', '', 준비('준비하고 있어요.')));
    out.push(장(10, '건강운', '', 준비('준비하고 있어요.')));

    // 11장 — 대운
    const 올해 = today.getFullYear(), 대 = W.대운(R); 대.forEach((d, i) => { d.지금 = 올해 >= d.시작해 && (!대[i + 1] || 올해 < 대[i + 1].시작해); });
    out.push(장(11, '열 해씩 오는 운 — 대운', '열 해마다 하늘과 땅에 글자가 하나씩 와요. 하늘로 오면 생각이, 땅으로 오면 몸이 움직여요.',
      대.map(d => '<div class="jt-du' + (d.지금 ? ' now' : '') + '"><div class="jt-du-h"><b>' + d.시작나이 + ' ~ ' + d.끝나이 + '세</b><span>' + esc(d.간지) + ' · ' + d.시작해 + '년부터</span>' + (d.지금 ? '<i>지금</i>' : '') + '</div>' + 문단(d.줄) + '</div>').join('')));

    const 세 = W.세운 ? W.세운(R, 올해, 5) : [];
    out.push(장(12, '앞으로 다섯 해', '해마다 하늘과 땅에 글자가 하나씩 와요. 그해의 대운 위에 얹어서 읽었어요.',
      세.map((d, i) => '<div class="jt-du' + (i === 0 ? ' now' : '') + '"><div class="jt-du-h"><b>' + d.해 + '년</b><span>' + esc(d.간지) + (d.대운 ? ' · ' + esc(d.대운) + ' 대운 안' : '') + '</span>' + (i === 0 ? '<i>올해</i>' : '') + '</div>' + 문단(d.줄) + '</div>').join('')));
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
      if (p.hour != null) q('jtTime').value = String(p.hour).padStart(2, '0') + ':' + String(p.minute || 0).padStart(2, '0');
      q('jtG').value = p.gender === 'F' ? 'F' : 'M';
    }
    f.onsubmit = (e) => {
      e.preventDefault();
      const [y, m, d] = (q('jtDate').value || '').split('-').map(Number), [hh, mi] = (q('jtTime').value || '12:00').split(':').map(Number);
      if (!y || !m || !d) return;
      const 곳 = PL ? PL.resolve(q('jtPlace').value) : { lon: 126.98, tzOffset: null };
      그리기(box, { year: y, month: m, day: d, hour: hh, minute: mi || 0, gender: q('jtG').value, longitude: 곳.lon, tzOffset: 곳.tzOffset });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 세우기); else 세우기();
  global.ChaeksaJeongtong = { 그리기 };
})(window);
