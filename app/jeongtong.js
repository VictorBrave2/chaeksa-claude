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

    // 1장 — 여덟 글자
    out.push(장(1, '나의 여덟 글자', '태어난 해 · 달 · 날 · 시각이 글자 둘씩, 모두 여덟 글자가 돼요.',
      명식표(R) + 문단(['붉은 테를 두른 글자가 나예요. ' + G.이름(R.pillars.day.stem) + '로 태어났어요.', '글자 위아래의 작은 말은 그 글자가 나에게 무엇인지를 부르는 이름이에요. 뒤 장에서 하나씩 풀어 드려요.'])));

    // 2장 — 궁통보감
    const 철 = WM.계절[월지], 구 = WM.구절[일간 + 월지], 궁 = 눈['궁통보감'];
    out.push(장(2, '계절이 나에게 찾는 글자', '궁통보감 — 태어난 달의 계절로 읽는 책',
      (철 ? 문단([철[0] + '에 태어났어요. ' + 철[1], 철[2].replace('열 아이', '열 천간').replace('많은 아이에게', '많은 천간에게').replace('아이마다', '천간마다')]) : '')
      + (궁 ? 문단(궁.풀이) : '')
      + (구 ? '<blockquote class="jt-q"><p>원문 「' + esc(구[0]) + '」</p><p>' + esc(구[1]) + '</p></blockquote>' : '')
      + 문단(['원국에 없는 글자는 없는 것이 아니라 운으로 와요. 언제 오는지는 대운 장에 적었어요.'])));

    // 3장 — 자평진전
    const s = 층.성패 || {}, 뜻 = 성패뜻[s.판정];
    out.push(장(3, '나의 격, 나의 역할', '자평진전 — 글자의 짜임으로 읽는 책',
      (s.격 ? 문단(['태어난 달에서 ' + s.격 + '격을 잡아요.' + (뜻 ? ' 지금 모습은 「' + 뜻[0] + '」 — ' + 뜻[1] : '')]) : 문단(['이 여덟 글자로는 격을 하나로 잡기 어려워요.']))
      + '<div id="jtSeol"></div>'));

    // 4장 — 적천수
    const 적 = 눈['적천수'];
    out.push(장(4, '기운이 어디로 흐르나', '적천수 — 지금 어떻게 되어 있나를 읽는 책', 적 ? 문단(적.풀이) : ''));

    // 5장 — 대운
    const 올해 = today.getFullYear(), 대 = W.대운(R); 대.forEach((d, i) => { d.지금 = 올해 >= d.시작해 && (!대[i + 1] || 올해 < 대[i + 1].시작해); });
    out.push(장(5, '열 해씩 오는 운', '대운 — 열 해마다 하늘과 땅에 글자가 하나씩 와요. 하늘로 오면 생각이, 땅으로 오면 몸이 움직여요.',
      대.map(d => '<div class="jt-du' + (d.지금 ? ' now' : '') + '"><div class="jt-du-h"><b>' + d.시작나이 + ' ~ ' + d.끝나이 + '세</b><span>' + esc(d.간지) + ' · ' + d.시작해 + '년부터</span>' + (d.지금 ? '<i>지금</i>' : '') + '</div>' + 문단(d.줄) + '</div>').join('')));

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
