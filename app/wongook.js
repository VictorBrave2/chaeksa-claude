/* 원국 — 홈의 맨 위 (2026-09-14 사장님 「원국을 메인으로 올리고, 원국을 풀어내는 힘으로 우리의 콘텐츠를 풀어나가는 게 맞아」)
 *
 * 생극제화 표(saenggeuk.js, 법전 33조)를 세운다. 말은 **생극제화 전문용어 그대로** — 극·생·통관·제복·합거·설기·성격·파격·재극인·구응·변격·격신·상신·무근
 * (09-14 사장님 「싹다 생극제화 전문용어로 가」. 처음엔 풀어 썼는데 「누르는」 같은 말이 뜻을 흐렸다). 용어 풀이는 블로그 글(marketing/붙여넣기-생극제화용어.html)이 맡는다.
 * 십신은 이름으로 부르고 그 자리에서 뜻을 푼다(27조). 길흉은 붙이지 않는다. 강약 이름은 없다(29조). 한자는 안 낸다.
 * 09-22: 판정 말 합거 · 격신 · 변격은 화면에 「묶여요 · 격을 잡은 글자 · 격이 바뀌어요」로 낸다(09-16 「판정 모듈이 낸 근거 문장은 그대로 못 낸다」).
 *   성패 넷(성격 · 기신 · 구응 · 파격)은 그대로. 판정 비교 문자열(x.합거 · j.판정)은 안 바꾼다 — 화면 말만.
 * 시간을 모르면 여섯 글자로 읽는다 — 머리말 글자 수를 실제대로, 「속에만 있는 글자」는 비운다(시의 천간에 그 십신이 있을 수 있다).
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
  const 이름 = (stem) => E.STEMS_KO[stem] + 오행자[E.STEM_ELEM[stem]] + '(' + E.STEMS[stem] + ')';   // 임수(壬) · 갑목(甲) — 사장님 09-14 「임수(임한자) 식으로 붙여줘야 알아먹을듯」
  const 지이름 = (b) => E.BRANCHES_KO[b];
  // 십신 뜻 — 처음 한 번 그 자리에서 푼다(27조). 저능아도 읽는 말(28조).
  const 뜻 = {
    비견: '나와 같은 힘', 겁재: '내 것을 나누는 힘', 식신: '내가 내놓는 힘', 상관: '내가 튀는 힘',
    편재: '내가 움직여 얻는 것', 정재: '내가 지키는 것', 편관: '나를 세게 극하는 것', 정관: '나를 극하는 것',
    편인: '나를 다른 데서 채우는 것', 정인: '나를 채우는 것', 일간: '나',
  };
  const 자리이름 = { year: '태어난 해', month: '태어난 달', day: '태어난 날', hour: '태어난 시' };
  // 받침 조사 — 「갑목이 / 임수가」. 마지막 글자가 한글이면 받침으로 가른다.
  const 받침 = (s) => { const t = String(s).replace(/\([^)]*\)\s*$/, ''); const c = t.slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && ((c - 0xAC00) % 28) !== 0; };   // 「임수(壬)가」 — 조사는 괄호 앞 글자로
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
      if (r.관계 === '생') 줄.push(이가(첫(r.from)) + ' 나를 생해요.' + 뜻한번(r.from));
      else if (r.통관) 줄.push(이가(첫(r.from)) + ' 나를 극해요. 그런데 ' + 이가(묶어(r.셋째.map(c => 이름(c.stem)))) + ' 통관해요. 극이 생으로 바뀌어 들어와요.' + 뜻한번(r.from));
      else if (r.제복) 줄.push(이가(첫(r.from)) + ' 나를 극해요. 그런데 ' + 이가(묶어(r.잡는.map(c => 이름(c.stem)))) + ' ' + 을를(이름(r.from.stem)) + ' 제복해요.' + 뜻한번(r.from));
      else 줄.push(이가(첫(r.from)) + ' 나를 바로 극해요. 통관도 제복도 없어요.' + 뜻한번(r.from));
    });
    // 나와 같은 힘 · 내가 내보내는 것 · 내가 쥐는 것 — 극이 없는 사주도 한 줄은 서야 한다
    t.글자.filter(g => !g.일간 && !g.운 && g.산다 && g.오행 === 나.오행).forEach(g => { 본[g.십신] = 1; 줄.push(은는(첫(g)) + ' 나와 같은 오행이에요. 비겁이 하나 더 힘이 있어요.'); });
    t.쌍.filter(r => r.from === 나 && r.to.산다 && !r.to.운 && !r.to.지지).forEach(r => {
      if (r.관계 === '생') 줄.push('나는 ' + 을를(첫(r.to)) + ' 생해요. 설기예요.' + 뜻한번(r.to));
      else if (r.통관) 줄.push('나는 ' + 을를(첫(r.to)) + ' 극하는데, ' + 이가(묶어(r.셋째.map(c => 이름(c.stem)))) + ' 통관해요.' + 뜻한번(r.to));
      else 줄.push('나는 ' + 을를(첫(r.to)) + ' 극해요.' + 뜻한번(r.to));
    });
    // 글자끼리 (일간 뺀 것) — 통관·제복·끊김
    t.쌍.filter(r => r.관계 === '극' && r.from.산다 && r.to.산다 && !r.from.일간 && !r.to.일간 && !r.from.운 && !r.to.운 && !r.to.지지).forEach(r => {
      if (r.힘차이 && !r.통관 && !r.제복) { 줄.push(이가(첫(r.from)) + ' ' + 을를(이름(r.to.stem)) + ' 극하려 하지만 힘이 두 배 넘게 모자라요. 극이 안 돼요.' + 뜻한번(r.from)); return; }
      if (r.통관) 줄.push(이가(첫(r.from)) + ' ' + 을를(이름(r.to.stem)) + ' 극해요. 그런데 ' + 이가(묶어(r.셋째.map(c => 이름(c.stem)))) + ' 통관해요. ' + 은는(이름(r.to.stem)) + ' 안 다쳐요.' + 뜻한번(r.from));
      else if (r.제복) 줄.push(이가(첫(r.from)) + ' ' + 을를(이름(r.to.stem)) + ' 극하려는데 ' + 이가(묶어(r.잡는.map(c => 이름(c.stem)))) + ' ' + 을를(이름(r.from.stem)) + ' 제복해요.' + 뜻한번(r.from));
      else 줄.push(이가(첫(r.from)) + ' ' + 을를(이름(r.to.stem)) + ' 극해요. ' + 이가(이름(r.to.stem)) + ' 힘을 못 써요.' + 뜻한번(r.from));
    });
    // 걸린 글자 — 셋째·잡는 글자로 제일 많이 쓰인 원국 글자
    const 셈 = {};
    t.쌍.filter(r => r.관계 === '극' && r.from.산다 && r.to.산다 && !r.to.지지).forEach(r => r.셋째.concat(r.잡는).forEach(c => { if (!c.운) 셈[c.key] = (셈[c.key] || 0) + (r.to.일간 ? 3 : 1); }));   // 나를 지키는 글자가 먼저
    const 걸린키 = Object.keys(셈).sort((a, b) => 셈[b] - 셈[a])[0];
    const 걸린 = 걸린키 ? t.글자.find(g => g.key === 걸린키) : null;
    return { 줄, 걸린 };
  }

  /** 판정 말(합거 · 격신)은 화면에 그대로 안 낸다(09-22) — 「묶여요 · 격을 잡은 글자」. 성패 넷(성격 · 기신 · 구응 · 파격)은 그대로 둔다.
   *  판정 모듈 · 격표가 낸 기록을 화면에 옮길 때만 쓴다 — 판정 비교 문자열에는 안 쓴다. */
  const 쉬운말 = (s) => String(s)
    .replace(/합거되어 /g, '묶여서 ').replace(/합거되고 /g, '묶이고 ').replace(/합거된다/g, '묶인다')
    .replace(/격신을 /g, '격을 잡은 글자를 ').replace(/격신 /g, '격을 잡은 ');

  /** 판정 근거(panjeong.js 범주의 기록)를 화면 말로 옮긴다. 판정은 그대로다.
   *  기록에는 숫자(「남은 힘 0.6 (인 0.6 − 재 유효 0)」) · 조 번호(「(36조)」) · 「~함」 끝이 섞여 있다 — 59조 「판정 값(숫자 · 조 번호)은 화면에 안 낸다」.
   *  숫자가 남으면 근거를 통째로 뺀다(범주 이름만 낸다). */
  function 근거말(s) {
    s = String(s || '').replace(/\s*\(\d+조\)/g, '').trim();
    if (/^남은 힘/.test(s)) s = s.split(' — ').slice(1).join(' — ');                                       // 57조 인수격 — 숫자 칸을 뗀다
    s = s.replace(/^(\S+격) → (\S+격)(?: \(.*\))?$/, (m, a, b) => 이가(a) + ' ' + 조(b, '으로', '로') + ' 바뀌어요')   // 구조 전환 — 취격 근거(한자)는 위 변격 줄이 말한다
      .replace(/ 사라짐 → /, ' 사라져요. 그래서 ')
      .replace(/ 극함, 구응 없음$/, ' 극해요. 구응이 없어요')
      .replace(/격신 힘이 (.+?)[을를] 두 배 넘게 눌러 못 침$/, (m, y) => '격을 잡은 글자가 ' + y + '보다 두 배 넘게 세서, ' + 이가(y) + ' 못 쳐요')
      .replace(/(없음|없다)$/, '없어요').replace(/깎음$/, '깎아요').replace(/부숨$/, '부숴요').replace(/극함$/, '극해요').replace(/막음$/, '막아요');
    s = 쉬운말(s);
    return /\d/.test(s) ? '' : s;
  }

  /** ④⑤ 운 글자 하나가 표를 어떻게 건드리나 — 원국 표와 운 하나를 넣은 표를 견준다 */
  function 운한줄(R, 원표0, u, 이름표, 앞운들, 층, 앞층, 원국메움) {
    const 앞 = (앞운들 || []).filter(x => x && x.stem != null);
    // 40조 — 판정 모듈이 낸 층을 그대로 읽는다. 없으면(옛 호출) 여기서 표를 만든다.
    const 원표 = 앞층 ? 앞층.표 : (앞.length ? G.표(R.pillars, 앞, R) : 원표0);
    const t = 층 ? 층.표 : G.표(R.pillars, 앞.concat([u]), R);
    const g = t.글자.filter(x => x.운).slice(-1)[0];
    if (!g) return '';
    const 나 = t.글자.find(x => x.일간);
    // 묶이는 원국 글자 — 묶이면 그 층은 「변질되었어요」로 시작한다(사장님 09-14 「정미 대운이라 임수가 묶여요, 사주의 흐름이 변질되었어요로 시작해야」).
    const 묶임 = t.글자.filter(x => !x.일간 && x !== g && x.합거 === (u.name || '운'));   // 원국 글자든 앞 층 운 글자든 이 층이 묶은 것
    const 말 = [];
    // 71조(09-24) 합거는 죽음이 아니라 변질 — 「관이 합거되었다 해서 관이 없어졌다가 아니라 변질되었다가 맞지」. 「없는 거예요」 대신 제 노릇(기능)을 못 한다고 말한다.
    if (묶임.length) 말.push(이름표 + ' ' + 이가(묶어(묶임.map(x => 이름(x.stem)))) + ' 묶여요. 사주의 흐름이 변질되었어요. 그동안 ' + 이가(묶어(묶임.map(x => 이름(x.stem)))) + ' 제 노릇을 못 해요.');
    else 말.push(이름표 + ' ' + 이가(십신말(g)) + ' 와요.' + 뜻문(g));
    // 변격(35조) — 이 층에서 격의 주인이 묶였으면 누가 격을 잡는지, 그 주인이 깨지는지.
    try {
      const 원격 = 원표0.격 && 원표0.격.이름;
      const 앞격 = 앞층 ? 앞층.격 : (원격 && G.층격 ? G.층격(R.pillars, 앞, 원격, R) : null);               // 이 층 오기 전
      const 지금 = 층 ? 층.격 : (원격 && G.층격 ? G.층격(R.pillars, 앞.concat([u]), 원격, R) : null);    // 이 층까지
      const 판 = (x) => x && x.성패 ? x.성패.판정 + '|' + x.지금격 : '';
      if (지금 && 지금.변질 && !(앞격 && 앞격.변질 && 앞격.지금격 === 지금.지금격)) {
        // 71조 — 격을 잡던 천간이 묶여 월령 속 글자가 대신 나섰으면 그 말로. 묶인 글자를 윗줄이 이미 말했으면 「묶여」를 되풀이하지 않는다.
        const 발동 = G.발동말 ? G.발동말(지금, { 짧게: !!(지금.발동 && 묶임.some(x => x.key === 지금.발동.묶인.key)) }) : null;
        if (발동) 말.push(발동);
        else if (지금.지금격) 말.push(원격 + '격이 ' + 지금.지금격 + '격으로 바뀌어요.' + (지금.주인 ? ' 이제 ' + 이가(이름(지금.주인.stem)) + ' 격을 잡아요.' : ''));   // 주인 없이 지장간 본기로 잡힌 격이면 주인이 null 이다
        else 말.push(원격 + '격을 잡던 글자가 묶였어요. 대신 잡을 글자가 없어요.');
      }
      // 성패가 이 층에서 바뀌면 격표(자평진전)의 근거를 그대로 말한다. 인성이 깨지면 25조 「근거」 말을 붙인다.
      if (지금 && 지금.성패 && 판(지금) !== 판(앞격)) {
        const j = 지금.성패, 근 = j.근거 || {};
        // 격표 조항은 판정키다(「식신이 살을 띠었는데 재가 없다」「…(42조)」) — 화면에는 홈 격 카드와 같은 공주님말표(gyeokguk.js)로 옮겨 낸다(09-16 「판정 근거 문장은 그대로 못 낸다」).
        const Gk = global.ChaeksaGyeok;
        const 첫근거 = (arr) => (arr && arr.length) ? 쉬운말(String(Gk && Gk.공주님말of ? Gk.공주님말of(arr[0]) : arr[0]).replace(/\s*\(\d+조\)/g, '').replace(/\.$/, '')) + '.' : '';
        if (j.판정 === '깨졌다') {
          말.push('파격이에요. ' + 첫근거(근.깨졌다));
          if ((지금.지금격 === '정인' || 지금.지금격 === '편인') && 지금.주인) 말.push(이름(지금.주인.stem) + ' 인성은 나를 이루는 근거예요. 그 근거가 박살 나요.');
        } else if (j.판정 === '띠었다') 말.push('성격인데 기신이 붙어요. ' + 첫근거(근.띠었다));
        else if (j.판정 === '구제됐다') 말.push('기신이 있는데 구응이 있어요. ' + 첫근거(근.구제));
        else if (j.판정 === '섰다') 말.push(지금.지금격 + '격이 성격이에요. ' + 첫근거(근.섰다));   // 「서요/섰다 → 성격」(사장님 09-14)
      }
    } catch (e) { try { console.warn('변격 줄 실패:', e); } catch (e2) {} }
    if (!g.산다 && !g.합거) 말.push('무근이라 이름만 와요.');
    // 나에게 어떻게 오나
    const r = t.쌍.find(x => x.from === g && x.to === 나);
    if (r && g.산다) {
      if (r.관계 === '생') 말.push('나를 생해요.');
      else if (r.통관) 말.push('나를 극하는데 ' + 이가(묶어(r.셋째.map(c => 이름(c.stem)))) + ' 통관해요.');
      else if (r.제복) 말.push('나를 극하는데 ' + 이가(묶어(r.잡는.map(c => 이름(c.stem)))) + ' 제복해요.');
      else 말.push('나를 바로 극해요.');
    }
    // 원국 글자에게 무엇을 하나 — 치는 것만(받아 주는 글자 있으면 같이)
    t.쌍.filter(x => x.from === g && x.관계 === '극' && !x.to.일간 && !x.to.지지 && x.to.산다 && g.산다).forEach(x => {
      if (x.힘차이 && !x.통관 && !x.제복) { 말.push(을를(이름(x.to.stem)) + ' 극하려 하지만 힘이 두 배 넘게 모자라요.'); return; }
      if (x.통관) 말.push(을를(이름(x.to.stem)) + ' 극하는데 ' + 이가(묶어(x.셋째.map(c => 이름(c.stem)))) + ' 통관해요.');
      else if (x.제복) 말.push(을를(이름(x.to.stem)) + ' 극하려는데 ' + 이가(묶어(x.잡는.map(c => 이름(c.stem)))) + ' 제복해요.');
      else 말.push(을를(이름(x.to.stem)) + ' 극해요.');
    });
    // 원국에서 서 있던 통관이 이 운으로 끊겼나
    const 전 = 원표.닿음.filter(x => x.결과 === '받음' || x.결과 === '잡힘').map(x => x.글자);
    const 후 = t.닿음.filter(x => (x.결과 === '받음' || x.결과 === '잡힘')).map(x => x.글자);
    const 아직산다 = t.닿음.map(x => x.글자);   // 이 운에서도 살아서 나한테 오는 것만 — 묶여 없어진 글자는 「바로 온다」고 하지 않는다
    const 끊 = 전.filter(x => !후.includes(x) && 아직산다.includes(x));
    if (끊.length) 말.push('그래서 ' + 이가(묶어(끊.map(x => x.replace(/\(.*\)/, '')).map(s => 이름(E.STEMS.indexOf(s))))) + ' 나를 바로 극해요.');
    // 40조 결과 범주 — 층마다 하나. 「규칙 보완 필요」도 그대로 낸다. 근거는 숫자 · 조 번호를 걷고 말끝만 옮긴다(근거말).
    // 다만 원국 격을 층격이 못 잡아 엔진이 격표 이름(건록 · 양인)으로 메운 사람은 운 층마다 「규칙 보완 필요 — 격을 잡을 글자가 없어요」가 된다.
    // 맨 윗줄이 이미 그 격을 말했으니 층마다 되풀이하지 않는다(gwanjeom.js 대운 · 세운과 같게, 09-23 격 출처를 층격 하나로 합칠 때).
    if (층 && 층.범주 && !(원국메움 && 층.범주 === '규칙 보완 필요')) { const 근 = 근거말(층.근거); 말.push('판정은 「' + 층.범주 + '」' + (근 ? ' — ' + 근 : '') + '.'); }
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
    out.push(치는.map(x => 이가(x)).join(' 아니면 ') + ' 세게 오면 ' + 을를(이름(걸린.stem)) + ' 극해요.');
    return out;
  }

  function render(R, today, box, opts) {
    if (!box || !R) return;
    const full = !!(opts && opts.full);   // 원국 탭 = 펼친 판(2026-09-14). 홈 밴드는 접힌 판.
    const { 운, tf, du } = 운들(R, today);
    const 원표 = G.표(R.pillars, [], R);
    const p = R.pillars;
    // ① 글자와 자리
    // 명식 카드 — 원국 탭의 .pillars/.pillar 카드를 그대로(사장님 09-14 「원국에서 쓰는 이게 예쁜데 이걸 가져오면 되는 것 아니야?」).
    // 십신은 이름으로(27조) — 이 밴드는 data-plain 이라 바꿔치기 문을 안 지난다.
    const ds = p.day.stem, f = E.fmt;
    const ec = (i, isStem) => 'e-' + (isStem ? f.stemElem(i) : f.branchElem(i));
    const 십 = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const 지장 = (b) => (E.HIDDEN[b] || []).map(h => (typeof h === 'number' ? h : h[0]));
    const 글자칸 = [['hour', '시주'], ['day', '일주'], ['month', '월주'], ['year', '연주']].map(([k, label]) => {
      const pl = p[k];
      if (!pl) return '<div class="pillar"><div class="t">' + label + '</div><div class="han" style="color:var(--ink3)">?</div><div class="ko">시간 모름</div></div>';
      const hid = 지장(pl.branch);
      return '<div class="pillar' + (k === 'day' ? ' day' : '') + '"><div class="t">' + label + '</div>'
        + '<div class="g">' + (k === 'day' ? '<span style="color:var(--accent)">나</span>' : esc(십(pl.stem))) + '</div>'
        + '<div class="han ' + ec(pl.stem, true) + '">' + f.stem(pl.stem) + '</div><div class="ko">' + f.stemKo(pl.stem) + ' · ' + f.stemElem(pl.stem) + '</div>'
        + '<div class="han ' + ec(pl.branch, false) + '" style="margin-top:4px">' + f.branch(pl.branch) + '</div><div class="ko">' + f.branchKo(pl.branch) + ' · ' + f.branchElem(pl.branch) + '</div>'
        + '<div class="g">' + esc(hid.length ? 십(hid[0]) : '') + '</div><div class="hidden">' + hid.map(h => f.stem(h)).join(' ') + '</div></div>';
    }).join('');
    // ② 돌아감
    const d = 돌아감(원표);
    const 걸린말 = d.걸린 ? '<p class="wg-key">그래서 이 사주는 <b>' + esc(이름(d.걸린.stem)) + '</b> 하나에 걸려 있어요. ' + esc(이가(이름(d.걸린.stem))) + ' 힘이 있으면 통관·제복이 서고, 묶이면 극이 바로 들어와요.</p>' : '';
    // ③ 격 — 판정엔진 원국 층의 성패(층.성패)를 읽는다(63조 문 하나 · 09-23 「층격이 나의 관점이긴해」). 정통사주 3장 · 택일 격 눈과 같은 출처다.
    // 운은 안 얹는다 — 타고난 격이다. 층격이 격을 못 잡아 격표 이름(건록 · 양인)으로 메운 사람은 근거를 그대로 밝힌다.
    let 원성패 = null;
    try { const P0 = global.ChaeksaPanjeong; if (P0) 원성패 = P0.판정(R, today, { 운들: [] }).층들[0].성패 || null; } catch (e) { 원성패 = null; }
    const 격이름 = 원성패 ? 원성패.격 : (원표.격 && 원표.격.이름);
    const 상신 = 원성패 ? 원성패.상신 : (원표.격 && 원표.격.상신);
    const 격근거0 = 원성패 && 원성패.출처 === 'typecard' ? '월령 본기가 일간과 같은 오행' : (원표.격 && 원표.격.근거 || '월지가 정한 격');
    // 취격 근거(「여기 乙의 오행이 투출」)의 맨 한자는 이름(「을목(乙)」)으로 바꿔 낸다 — 한자만 따로 내지 않는다(머리 주석).
    const 격근거 = String(격근거0).replace(/[甲乙丙丁戊己庚辛壬癸]/g, (c) => 이름(E.STEMS.indexOf(c)));
    const 격 = 격이름 ? '<p class="wg-gk top"><b>' + esc(격이름) + '격</b> — ' + esc(조(격근거, '이에요', '예요')) + '.' + (상신 ? ' 상신은 ' + esc(상신) + '이에요.' : '') + '</p>' : '';
    // ④⑤ 운
    const 오늘 = 운.find(u => u.name === '오늘'), 이달 = 운.find(u => u.name === '이달'), 올해 = 운.find(u => u.name === '올해'), 대운 = 운.find(u => u.name === '대운');
    // 큰 층부터 — 대운 → 올해 → 이달 → 오늘(사장님 09-14). 머리말은 간지 「정미(丁未) 대운이라」.
    const 간지 = (u) => E.STEMS_KO[u.stem] + E.BRANCHES_KO[u.branch] + '(' + E.STEMS[u.stem] + E.BRANCHES[u.branch] + ')';
    // 40조 — 판정 모듈이 층을 한 번 내고, 밴드는 그 결과만 읽는다.
    let 판 = null;
    try { const P = global.ChaeksaPanjeong; if (P) 판 = P.판정(R, today, { 운들: 운.filter(u => u && u.stem != null) }); } catch (e) { try { console.warn('판정 실패:', e); } catch (e2) {} 판 = null; }
    const 층of = (name) => 판 ? 판.층들.find(l => l.이름 === name) : null;
    const 앞of = (name) => { if (!판) return null; const i = 판.층들.findIndex(l => l.이름 === name); return i > 0 ? 판.층들[i - 1] : null; };
    const 원국메움 = !!(원성패 && 원성패.출처 === 'typecard');   // 맨 윗줄 격을 격표 이름으로 메운 사람 — 운 층의 「규칙 보완 필요」를 되풀이하지 않는다
    const 운줄 = [
      대운 ? '<p class="wg-un">' + esc(운한줄(R, 원표, 대운, 간지(대운) + ' 대운, 이 10년 동안', [], 층of('대운'), 앞of('대운'), 원국메움)) + '</p>' : '',
      올해 ? '<p class="wg-un">' + esc(운한줄(R, 원표, 올해, 간지(올해) + ' 올해, 이 한 해', [대운], 층of('올해'), 앞of('올해'), 원국메움)) + '</p>' : '',
      이달 ? '<p class="wg-un">' + esc(운한줄(R, 원표, 이달, 간지(이달) + ' 이달, 이 한 달', [대운, 올해], 층of('이달'), 앞of('이달'), 원국메움)) + '</p>' : '',
      오늘 ? '<p class="wg-un now">' + esc(운한줄(R, 원표, 오늘, 간지(오늘) + ' 오늘이라', [대운, 올해, 이달], 층of('오늘'), 앞of('오늘'), 원국메움)) + '</p>' : '',
    ].join('');
    // ⑥ 조심
    const 조심줄 = 조심(d.걸린).map(s => '<li>' + esc(s) + '</li>').join('');
    // 변격 갈림 — 일간이 뿌리가 없고 국이 섰으면 판이 다르게 설 수 있다(규칙으로 안 잡는다, 사람이 본다)
    let 갈림 = '';
    try {
      const 뿌리터 = 자리.map(k => [p[k].branch, E.NATAL_WEIGHT[k + 'Branch']]);
      const 내힘 = E.stemPower(p.day.stem, 뿌리터);
      const 국 = E.samhapOf(뿌리터);
      if (내힘 < 0.5 && 국.length) 갈림 = '<p class="wg-fork">이 사주는 종격일 수 있어요. 일간이 무근이고 삼합국이 판을 덮고 있어서요. 이런 사주는 사람이 봐야 해요.</p>';
    } catch (e) {}

    // 밴드 — 글자 넷 + 걸린 글자 한 줄만 보이고, 부가 설명은 접어 둔다(사장님 「부가설명은 접어두고」).
    // 47조 — 지장간은 그 지지의 시진에만 명령이 나온다. 천간에 없는 십신이 지장간에만 있으면 「이 글자는 ○시에만 나와요」(사장님 09-14).
    let 속글자 = '';
    if (!p.hour) 속글자 = '<div class="wg-head sub"><b>속에만 있는 글자</b></div><div class="wg-body"><p>시간을 모르면 비워요. 태어난 시의 글자를 몰라서, 어떤 글자가 속에만 있는지 알 수 없어요.</p></div>';
    else try {
      const 시각 = ['밤 11시~새벽 1시', '새벽 1~3시', '새벽 3~5시', '새벽 5~7시', '아침 7~9시', '오전 9~11시', '낮 11시~1시', '오후 1~3시', '오후 3~5시', '오후 5~7시', '저녁 7~9시', '밤 9~11시'];
      const 천간십신 = {}; 원표.글자.forEach(g => { if (!g.일간 && g.산다) 천간십신[g.십신] = 1; });
      const 본 = {};
      const 줄들 = (원표.지장간 || []).filter(g => !천간십신[g.십신] && !본[g.십신] && (본[g.십신] = 1))
        .map(g => 은는(이름(g.stem) + ' ' + g.십신 + '(지장간)') + ' ' + E.BRANCHES_KO[g.branch] + '(' + E.BRANCHES[g.branch] + ')시에만 나와요. ' + 시각[g.branch] + '예요.');
      if (줄들.length) 속글자 = '<div class="wg-head sub"><b>속에만 있는 글자</b></div><div class="wg-body">' + 줄들.map(s => '<p>' + esc(s) + '</p>').join('') + '</div>';
    } catch (e) { 속글자 = ''; }
    const 속 = '<div class="wg-body">' + d.줄.map(s => '<p>' + esc(s) + '</p>').join('') + '</div>'
      + 속글자
      + '<div class="wg-head sub"><b>지금 오는 글자</b></div>' + 운줄
      + (조심줄 ? '<div class="wg-head sub"><b>조심할 글자</b></div><ul class="wg-care">' + 조심줄 + '</ul>' : '');
    box.innerHTML =
      '<section class="wg' + (full ? ' full' : '') + '" data-plain="1">'
      + '<div class="wg-head"><b>' + (full ? '나의 사주 원국' : '내 원국') + '</b><span>' + (p.hour ? '여덟' : '여섯') + ' 글자가 서로 무엇을 하는지</span></div>'
      + 격                                                     // 격 얘기가 맨 위(사장님 09-14 「정관격 얘기를 맨 위로 올리라고」)
      + '<div class="pillars wg-pillars">' + 글자칸 + '</div>'
      + 걸린말 + 갈림
      + (full ? '<div class="wg-head sub"><b>이 사주는 이렇게 돌아가요</b></div>' + 속
              : '<details class="wg-fold"><summary>이 사주는 이렇게 돌아가요</summary>' + 속 + '</details>')
      + '</section>';
    box.classList.remove('hide');
  }

  global.ChaeksaWongook = { render, 이름, 뜻 };
})(window);
