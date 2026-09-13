/* 원국 — 홈의 맨 위 (2026-09-14 사장님 「원국을 메인으로 올리고, 원국을 풀어내는 힘으로 우리의 콘텐츠를 풀어나가는 게 맞아」)
 *
 * 생극제화 표(saenggeuk.js, 법전 33조)를 사람 말로 세운다. 판정키(닿음·통관·제복·끊김)는 화면에 안 낸다 —
 * 「바로 와요 / 받아서 넘겨줘요 / 막아 줘요 / 힘을 못 써요 / 묶여요」(09-14 사장님 「사람들이 아는 단어가 아닐텐데」).
 * 십신은 이름으로 부르고 그 자리에서 뜻을 푼다(27조). 길흉은 붙이지 않는다. 강약 이름은 없다(29조). 한자는 안 낸다.
 *
 * 순서 — ① 여덟 글자와 자리 ② 이 사주는 이렇게 돌아간다 ③ 짜임(격) ④ 오늘 온 글자 ⑤ 이달·올해 ⑥ 조심할 글자.
 * 시진은 없다(09-13 「시까지 넣으면 문제 발생 빈도가 매우 커진다」).
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, G = global.ChaeksaSaenggeuk;
  if (!E || !G) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const 오행자 = ['목', '화', '토', '금', '수'];
  const 이름 = (stem) => E.STEMS_KO[stem] + 오행자[E.STEM_ELEM[stem]];          // 임수 · 갑목
  const 지이름 = (b) => E.BRANCHES_KO[b];
  // 십신 뜻 — 처음 한 번 그 자리에서 푼다(27조). 저능아도 읽는 말(28조).
  const 뜻 = {
    비견: '나와 같은 힘', 겁재: '내 것을 나누는 힘', 식신: '내가 내놓는 힘', 상관: '내가 튀는 힘',
    편재: '내가 움직여 얻는 것', 정재: '내가 지키는 것', 편관: '나를 세게 누르는 것', 정관: '나를 누르는 것',
    편인: '나를 다른 데서 채우는 것', 정인: '나를 채우는 것', 일간: '나',
  };
  const 자리이름 = { year: '태어난 해', month: '태어난 달', day: '태어난 날', hour: '태어난 시' };
  // 받침 조사 — 「갑목이 / 임수가」. 마지막 글자가 한글이면 받침으로 가른다.
  const 받침 = (s) => { const c = String(s).slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && ((c - 0xAC00) % 28) !== 0; };
  const 조 = (s, 있, 없) => s + (받침(s) ? 있 : 없);
  const 이가 = (s) => 조(s, '이', '가'), 은는 = (s) => 조(s, '은', '는'), 을를 = (s) => 조(s, '을', '를'), 과와 = (s) => 조(s, '과', '와');
  const 묶어 = (arr, 마지막이가) => arr.length === 1 ? arr[0] : arr.slice(0, -1).map(x => 과와(x)).join(' ') + ' ' + arr[arr.length - 1];

  /** 운 천간들 — 대운·세운·월운·일운. 시운은 없다. */
  function 운들(R, today) {
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const du = E.currentDaeun(R, today);
    const out = [];
    if (du) out.push({ stem: du.stem, branch: du.branch, name: '대운' });
    out.push({ stem: tf.year.stem, branch: tf.year.branch, name: '올해' });
    out.push({ stem: tf.month.stem, branch: tf.month.branch, name: '이달' });
    out.push({ stem: tf.day.stem, branch: tf.day.branch, name: '오늘' });
    return { 운: out, tf, du };
  }

  // 「임수 정관은 …」 — 조사는 십신 이름에 붙는다. 뜻은 처음 한 번 뒤에 따로 한 문장(27조).
  const 십신말 = (g) => 이름(g.stem) + ' ' + g.십신;
  const 뜻문 = (g) => 뜻[g.십신] ? ' ' + 은는(g.십신) + ' ' + 뜻[g.십신] + '이에요.' : '';

  /** ② 이 사주는 이렇게 돌아간다 — 원국만으로 */
  function 돌아감(t) {
    const 나 = t.글자.find(g => g.일간);
    const 본 = {};
    const 첫 = (g) => 십신말(g);
    const 뜻한번 = (g) => { const k = g.십신; if (본[k]) return ''; 본[k] = 1; return 뜻문(g); };
    const 줄 = [];
    // 나에게 오는 것
    t.쌍.filter(r => r.to === 나 && r.from.산다 && !r.from.운).forEach(r => {
      if (r.관계 === '생') 줄.push(이가(첫(r.from)) + ' 나를 채워 줘요.' + 뜻한번(r.from));
      else if (r.통관) 줄.push(은는(첫(r.from)) + ' 나를 누르는 글자예요. 그런데 ' + 이가(묶어(r.셋째.map(c => 이름(c.stem)))) + ' 받아서 나한테 넘겨줘요. 누르는 게 채워 주는 걸로 바뀌어서 들어와요.' + 뜻한번(r.from));
      else if (r.제복) 줄.push(은는(첫(r.from)) + ' 나를 누르는 글자예요. 그런데 ' + 이가(묶어(r.잡는.map(c => 이름(c.stem)))) + ' 막아 줘요.' + 뜻한번(r.from));
      else 줄.push(이가(첫(r.from)) + ' 나한테 바로 와요. 사이에 받아 주는 글자가 없어요.' + 뜻한번(r.from));
    });
    // 나와 같은 힘 · 내가 내보내는 것 · 내가 쥐는 것 — 극이 없는 사주도 한 줄은 서야 한다
    t.글자.filter(g => !g.일간 && !g.운 && g.산다 && g.오행 === 나.오행).forEach(g => { 본[g.십신] = 1; 줄.push(은는(첫(g)) + ' 나와 같은 힘이에요. 같은 글자가 하나 더 서 있어요.'); });
    t.쌍.filter(r => r.from === 나 && r.to.산다 && !r.to.운).forEach(r => {
      if (r.관계 === '생') 줄.push('내 힘은 ' + 을를(첫(r.to)) + ' 만들어요. 내가 내놓는 자리예요.' + 뜻한번(r.to));
      else if (r.통관) 줄.push('나는 ' + 을를(첫(r.to)) + ' 쥐는 자리인데, ' + 이가(묶어(r.셋째.map(c => 이름(c.stem)))) + ' 사이에서 받아 줘요.' + 뜻한번(r.to));
      else 줄.push('나는 ' + 을를(첫(r.to)) + ' 쥐어요. 내가 다루는 자리예요.' + 뜻한번(r.to));
    });
    // 글자끼리 (일간 뺀 것) — 통관·제복·끊김
    t.쌍.filter(r => r.관계 === '극' && r.from.산다 && r.to.산다 && !r.from.일간 && !r.to.일간 && !r.from.운 && !r.to.운).forEach(r => {
      if (r.통관) 줄.push(은는(첫(r.from)) + ' ' + 을를(이름(r.to.stem)) + ' 치는 글자예요. 그런데 ' + 이가(묶어(r.셋째.map(c => 이름(c.stem)))) + ' 사이에서 받아 줘요. ' + 은는(이름(r.to.stem)) + ' 다치지 않아요.' + 뜻한번(r.from));
      else if (r.제복) 줄.push(이가(첫(r.from)) + ' ' + 을를(이름(r.to.stem)) + ' 치려는데 ' + 이가(묶어(r.잡는.map(c => 이름(c.stem)))) + ' 막아 줘요.' + 뜻한번(r.from));
      else 줄.push(이가(첫(r.from)) + ' ' + 을를(이름(r.to.stem)) + ' 쳐요. ' + 이가(이름(r.to.stem)) + ' 힘을 못 써요.' + 뜻한번(r.from));
    });
    // 걸린 글자 — 셋째·잡는 글자로 제일 많이 쓰인 원국 글자
    const 셈 = {};
    t.쌍.filter(r => r.관계 === '극' && r.from.산다 && r.to.산다).forEach(r => r.셋째.concat(r.잡는).forEach(c => { if (!c.운) 셈[c.key] = (셈[c.key] || 0) + (r.to.일간 ? 3 : 1); }));   // 나를 지키는 글자가 먼저
    const 걸린키 = Object.keys(셈).sort((a, b) => 셈[b] - 셈[a])[0];
    const 걸린 = 걸린키 ? t.글자.find(g => g.key === 걸린키) : null;
    return { 줄, 걸린 };
  }

  /** ④⑤ 운 글자 하나가 표를 어떻게 건드리나 — 원국 표와 운 하나를 넣은 표를 견준다 */
  function 운한줄(R, 원표, u, 이름표) {
    const t = G.표(R.pillars, [u], R);
    const g = t.글자.find(x => x.운);
    if (!g) return '';
    const 나 = t.글자.find(x => x.일간);
    const 말 = [이름표 + ' ' + 이가(십신말(g)) + ' 와요.' + 뜻문(g)];
    // 묶이는 원국 글자
    const 묶임 = t.글자.filter(x => !x.운 && !x.일간 && x.합거 && /운|올해|이달|오늘|대운/.test(x.합거) && !원표.글자.find(y => y.key === x.key && y.합거));
    if (묶임.length) 말.push(이가(묶어(묶임.map(x => 이름(x.stem)))) + ' 묶여요. 그동안 ' + 이가(묶어(묶임.map(x => 이름(x.stem)))) + ' 없는 거예요.');
    if (!g.산다 && !g.합거) 말.push('뿌리가 없어서 이름만 와요.');
    // 나에게 어떻게 오나
    const r = t.쌍.find(x => x.from === g && x.to === 나);
    if (r && g.산다) {
      if (r.관계 === '생') 말.push('나를 채워 주는 쪽이에요.');
      else if (r.통관) 말.push('나를 누르는 글자인데 ' + 이가(묶어(r.셋째.map(c => 이름(c.stem)))) + ' 받아서 넘겨줘요.');
      else if (r.제복) 말.push('나를 누르는 글자인데 ' + 이가(묶어(r.잡는.map(c => 이름(c.stem)))) + ' 막아 줘요.');
      else 말.push('나한테 바로 와요.');
    }
    // 원국 글자에게 무엇을 하나 — 치는 것만(받아 주는 글자 있으면 같이)
    t.쌍.filter(x => x.from === g && x.관계 === '극' && !x.to.일간 && x.to.산다 && g.산다).forEach(x => {
      if (x.통관) 말.push(을를(이름(x.to.stem)) + ' 치는 글자인데 ' + 이가(묶어(x.셋째.map(c => 이름(c.stem)))) + ' 받아 줘요.');
      else if (x.제복) 말.push(을를(이름(x.to.stem)) + ' 치려는데 ' + 이가(묶어(x.잡는.map(c => 이름(c.stem)))) + ' 막아 줘요.');
      else 말.push(을를(이름(x.to.stem)) + ' 쳐요.');
    });
    // 원국에서 서 있던 통관이 이 운으로 끊겼나
    const 전 = 원표.닿음.filter(x => x.결과 === '받음' || x.결과 === '잡힘').map(x => x.글자);
    const 후 = t.닿음.filter(x => (x.결과 === '받음' || x.결과 === '잡힘')).map(x => x.글자);
    const 아직산다 = t.닿음.map(x => x.글자);   // 이 운에서도 살아서 나한테 오는 것만 — 묶여 없어진 글자는 「바로 온다」고 하지 않는다
    const 끊 = 전.filter(x => !후.includes(x) && 아직산다.includes(x));
    if (끊.length) 말.push('그래서 ' + 이가(묶어(끊.map(x => x.replace(/\(.*\)/, '')).map(s => 이름(E.STEMS.indexOf(s))))) + ' 나한테 바로 와요.');
    return 말.join(' ');
  }

  /** ⑥ 조심할 글자 — 걸린 글자를 묶는 글자(합)와 치는 글자(극) */
  function 조심(걸린) {
    if (!걸린) return [];
    const out = [];
    const 합짝 = (걸린.stem + 5) % 10;
    out.push(이가(이름(합짝)) + ' 오면 ' + 이가(이름(걸린.stem)) + ' 묶여요.');
    const 치는오행 = (걸린.오행 + 3) % 5;
    const 치는 = E.STEMS.map((_, i) => i).filter(i => E.STEM_ELEM[i] === 치는오행).map(i => 이름(i));
    out.push(치는.map(x => 이가(x)).join(' 아니면 ') + ' 세게 오면 ' + 이가(이름(걸린.stem)) + ' 다쳐요.');
    return out;
  }

  function render(R, today, box) {
    if (!box || !R) return;
    const { 운, tf, du } = 운들(R, today);
    const 원표 = G.표(R.pillars, [], R);
    const p = R.pillars;
    // ① 글자와 자리
    // 명식 표 — 시·일·월·년 순서(오른쪽이 년), 위에 천간 십신, 천간, 지지, 아래에 지지 본기 십신(사장님 09-14 그림 그대로).
    const 자리 = ['hour', 'day', 'month', 'year'].filter(k => p[k]);
    const ds = p.day.stem;
    const 지십신 = (b) => { const h = E.HIDDEN[b]; const st = h && (typeof h[0] === 'number' ? h[0] : h[0][0]); return st == null ? '' : E.TEN_GODS[E.tenGod(ds, st)]; };
    const 칸 = (k, f) => 자리.map(k2 => '<div class="' + (k2 === 'day' ? 'me' : '') + '">' + f(k2) + '</div>').join('');
    const 글자칸 = '<div class="wg-row lab">' + 칸(null, k => ({ hour: '시', day: '일', month: '월', year: '년' })[k]) + '</div>'
      + '<div class="wg-row god">' + 칸(null, k => esc(k === 'day' ? '나' : 원표.글자.find(x => x.key === k).십신)) + '</div>'
      + '<div class="wg-row han">' + 칸(null, k => esc(E.STEMS[p[k].stem])) + '</div>'
      + '<div class="wg-row han">' + 칸(null, k => esc(E.BRANCHES[p[k].branch])) + '</div>'
      + '<div class="wg-row god">' + 칸(null, k => esc(지십신(p[k].branch))) + '</div>';
    // ② 돌아감
    const d = 돌아감(원표);
    const 걸린말 = d.걸린 ? '<p class="wg-key">그래서 이 사주는 <b>' + esc(이름(d.걸린.stem)) + '</b> 하나에 걸려 있어요. ' + esc(이가(이름(d.걸린.stem))) + ' 서 있으면 다 받아서 들어오고, 묶이면 바로 와요.</p>' : '';
    // ③ 격
    const 격 = 원표.격 ? '<p class="wg-gk"><b>' + esc(원표.격.이름) + '격</b> — 태어난 달이 정한 이 사주의 짜임이에요.' + (원표.격.상신 ? ' 이 짜임을 쓰게 해 주는 글자는 ' + esc(원표.격.상신) + '이에요.' : '') + '</p>' : '';
    // ④⑤ 운
    const 오늘 = 운.find(u => u.name === '오늘'), 이달 = 운.find(u => u.name === '이달'), 올해 = 운.find(u => u.name === '올해'), 대운 = 운.find(u => u.name === '대운');
    const 운줄 = [
      오늘 ? '<p class="wg-un now">' + esc(운한줄(R, 원표, 오늘, (today.getMonth() + 1) + '월 ' + today.getDate() + '일 오늘은')) + '</p>' : '',
      이달 ? '<p class="wg-un">' + esc(운한줄(R, 원표, 이달, '이달은')) + '</p>' : '',
      올해 ? '<p class="wg-un">' + esc(운한줄(R, 원표, 올해, today.getFullYear() + '년 올해는')) + '</p>' : '',
      대운 ? '<p class="wg-un">' + esc(운한줄(R, 원표, 대운, '지금 대운 ' + du.startAge + '~' + du.endAge + '세에는')) + '</p>' : '',
    ].join('');
    // ⑥ 조심
    const 조심줄 = 조심(d.걸린).map(s => '<li>' + esc(s) + '</li>').join('');
    // 변격 갈림 — 일간이 뿌리가 없고 국이 섰으면 판이 다르게 설 수 있다(규칙으로 안 잡는다, 사람이 본다)
    let 갈림 = '';
    try {
      const 뿌리터 = 자리.map(k => [p[k].branch, E.NATAL_WEIGHT[k + 'Branch']]);
      const 내힘 = E.stemPower(p.day.stem, 뿌리터);
      const 국 = E.samhapOf(뿌리터);
      if (내힘 < 0.5 && 국.length) 갈림 = '<p class="wg-fork">이 사주는 판이 다르게 설 수 있어요. 나를 받쳐 주는 뿌리가 없고 한 기운이 판을 덮고 있어서요. 이런 사주는 사람이 봐야 해요.</p>';
    } catch (e) {}

    // 밴드 — 글자 넷 + 걸린 글자 한 줄만 보이고, 부가 설명은 접어 둔다(사장님 「부가설명은 접어두고」).
    box.innerHTML =
      '<section class="wg" data-plain="1">'
      + '<div class="wg-head"><b>내 원국</b><span>여덟 글자가 서로 무엇을 하는지</span></div>'
      + '<div class="wg-table">' + 글자칸 + '</div>'
      + 걸린말 + 갈림
      + '<details class="wg-fold"><summary>이 사주는 이렇게 돌아가요</summary>'
      + '<div class="wg-body">' + d.줄.map(s => '<p>' + esc(s) + '</p>').join('') + '</div>' + 격
      + '<div class="wg-head sub"><b>지금 오는 글자</b></div>' + 운줄
      + (조심줄 ? '<div class="wg-head sub"><b>조심할 글자</b></div><ul class="wg-care">' + 조심줄 + '</ul>' : '')
      + '</details>'
      + '</section>';
    box.classList.remove('hide');
  }

  global.ChaeksaWongook = { render, 이름, 뜻 };
})(window);
