/* 썸 궁합 관점 — 법전 72조(09-24).
 * 한 사람을 둘로 읽는다: 일지 = 어떤 배우자를 바라는가 · 식상 = 상대를 어떻게 대하는가. 둘을 같은 것으로 치지 않는다.
 * 한 방향 = 내 일지 × 상대 식상(내가 원하는 것을 상대가 어떻게 주는가). 두 방향을 따로 잡아 원고를 고른다.
 * 식상 구성 31가지 = 없음 1 + 일간별(식신만 · 상관만 · 둘 다) 30. 원국 천간 + 지장간에 그 글자가 있나만 본다
 * (투출 · 개수 · 자리 · 강약 · 합충 · 운은 이 분류에서 가르지 않는다). 점수를 내지 않는다. */
(function (global) {
  const E = global.ChaeksaEngine;
  const 자리 = ['year', 'month', 'day', 'hour'];

  // 원국 여덟 글자 속 천간(일간 제외) + 지장간 전부
  function 있는천간(R) {
    const p = R.pillars, out = new Set();
    자리.forEach(k => {
      if (!p[k]) return;
      if (k !== 'day') out.add(p[k].stem);
      (E.HIDDEN[p[k].branch] || []).forEach(h => out.add(typeof h === 'number' ? h : h[0]));
    });
    return out;
  }
  function 식상(R) {
    const ds = R.pillars.day.stem, 있 = 있는천간(R);
    let 식신 = null, 상관 = null;
    for (let s = 0; s < 10; s++) {
      const g = E.TEN_GODS[E.tenGod(ds, s)];
      if (g === '식신') 식신 = s; else if (g === '상관') 상관 = s;
    }
    const 식 = 있.has(식신), 상 = 있.has(상관), S = E.STEMS;
    const 키 = !식 && !상 ? '없음' : 식 && 상 ? S[식신] + '식신+' + S[상관] + '상관' : 식 ? S[식신] + '식신' : S[상관] + '상관';
    return { 키, 식신: 식 ? S[식신] : null, 상관: 상 ? S[상관] : null };
  }
  function 일지지(R) { return E.BRANCHES[R.pillars.day.branch]; }
  // 72조 ⑤(09-24) 일지는 일간이 그 글자를 무엇으로 보느냐로 읽는다 — 일주 60. 丁에게 卯는 편인, 丙에게 午는 겁재.
  function 일주(R) { return E.STEMS[R.pillars.day.stem] + E.BRANCHES[R.pillars.day.branch]; }
  function 일지십신(R) { const h = (E.HIDDEN[R.pillars.day.branch] || [])[0], st = typeof h === 'number' ? h : h[0]; return E.TEN_GODS[E.tenGod(R.pillars.day.stem, st)]; }
  // 방향 = 받는 쪽의 일지 × 주는 쪽의 식상
  function 방향(받는R, 주는R) { const 식 = 식상(주는R); return { 일지: 일지지(받는R), 일주: 일주(받는R), 일지십신: 일지십신(받는R), 식상: 식.키, 키: 일주(받는R) + '×' + 식.키 }; }
  // 당신 = 나. 원고 열쇠 = 「내 일지 × 상대 식상 / 상대 일지 × 내 식상」
  function 짝(나R, 그R) {
    const 나쪽 = 방향(나R, 그R), 그쪽 = 방향(그R, 나R);
    return { 나쪽, 그쪽, 키: 나쪽.키 + ' / ' + 그쪽.키, 나식상: 식상(나R), 그식상: 식상(그R) };
  }
  const 질문 = [
    '상대는 내 어떤 점에 끌릴까요?',
    '나는 왜 이 사람에게 마음이 갈까요?',
    '내가 먼저 다가가도 괜찮을까요?',
    '연락할 때 무엇이 다를까요?',
    '첫 데이트는 어떻게 준비할까요?',
    '가까워질수록 무엇을 맞춰야 할까요?',
  ];
  // 행동이 들어가는 장만 반응을 묻는다(0 끌림 · 2 먼저 다가가기 · 3 연락 · 4 첫 데이트). 1 · 5 는 읽고 넘어간다.
  const 반응틀 = { 0: ['반가워했어요', '미지근했어요', '아직 답이 없어요', '아직 안 보냈어요'], 2: ['반가워했어요', '미지근했어요', '아직 답이 없어요', '아직 안 보냈어요'],
    3: ['반가워했어요', '미지근했어요', '아직 답이 없어요', '아직 안 보냈어요'], 4: ['좋았어요', '어색했어요', '아직 안 만났어요'] };
  const 반응물음 = { 0: '이 말을 건네 보셨나요? 상대 반응은 어땠어요?', 2: '먼저 다가가 보셨나요? 상대 반응은 어땠어요?', 3: '연락해 보셨나요? 상대 반응은 어땠어요?', 4: '만나 보셨나요? 어땠어요?' };
  // 연애 일지 — 이 기기에만 남긴다(서버로 안 보낸다). 열쇠는 두 방향 열쇠라 생일이 들어가지 않는다.
  const 일지키 = 'chaeksa.ssomLog';
  function 일지(열쇠) { try { return (JSON.parse(localStorage.getItem(일지키) || '{}')[열쇠]) || []; } catch (e) { return []; } }
  function 적기(열쇠, 장, 반응) {
    try { const all = JSON.parse(localStorage.getItem(일지키) || '{}'); (all[열쇠] = all[열쇠] || []).push({ 장, 반응, 때: new Date().toISOString().slice(0, 10) }); all[열쇠] = all[열쇠].slice(-30); localStorage.setItem(일지키, JSON.stringify(all)); } catch (e) {}
  }
  /* 4. 때(09-24 사장님 「26년 8월에 소개팅 → 그 달과 지금 두 사람의 일지 · 식상 상태」). 원국 → 대운 → 세운 → 월운.
   *  사실만 낸다: 식상 구성(운의 천간 · 지지 속 글자까지) · 식상 천간이 묶였나 · 일지가 운의 충을 받나 · 육합으로 묶이나.
   *  그 변화가 연애에서 무엇으로 드러나는지는 사장님 조문 대기(법전 72조 역학) — 뜻 문장은 여기서 안 만든다. */
  function 때상태(R, y, m) {
    const P = global.ChaeksaPanjeong, list = (R.daeun && R.daeun.list) || [];
    const 대 = list.filter(d => d.startYear <= y).pop();
    let 달 = null; try { 달 = E.calc({ year: y, month: m, day: 15, hour: 12, minute: 0, gender: 'M', longitude: 126.98 }).pillars.month; } catch (e) {}
    const 운들 = (대 ? [{ name: '대운', stem: 대.stem, branch: 대.branch }] : [])
      .concat([{ name: '세운', stem: ((y - 4) % 10 + 10) % 10, branch: ((y - 4) % 12 + 12) % 12 }])
      .concat(달 ? [{ name: '월운', stem: 달.stem, branch: 달.branch }] : []);
    const ds = R.pillars.day.stem, 신 = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const 원 = 식상(R);
    // 운이 들여온 식상 글자 — 어느 층에서 왔나
    const 온 = [];
    운들.forEach(u => {
      if (/식신|상관/.test(신(u.stem))) 온.push({ 층: u.name, 글자: E.STEMS[u.stem], 십신: 신(u.stem), 어디: '천간' });
      (E.HIDDEN[u.branch] || []).forEach(h => { const st = typeof h === 'number' ? h : h[0]; if (/식신|상관/.test(신(st))) 온.push({ 층: u.name, 글자: E.STEMS[st], 십신: 신(st), 어디: E.BRANCHES[u.branch] + ' 속' }); });
    });
    const 식있 = !!원.식신 || 온.some(x => x.십신 === '식신'), 상있 = !!원.상관 || 온.some(x => x.십신 === '상관');
    const 구성 = !식있 && !상있 ? '없음' : 식있 && 상있 ? '둘 다' : 식있 ? '식신만' : '상관만';
    let 층 = null; try { const L = P.판정(R, new Date(y, m - 1, 15), { 운들 }).층들; 층 = L[L.length - 1]; } catch (e) {}
    const 묶임 = 층 ? 층.표.글자.filter(g => !g.일간 && /식신|상관/.test(g.십신 || '') && g.합거).map(g => ({ 글자: g.글자, 십신: g.십신, 누가: g.합거 })) : [];
    const 일지 = E.BRANCHES[R.pillars.day.branch];
    const 충 = 층 ? (층.표.운충 || []).filter(v => v.자리 === '일지').map(v => ({ 층: v.운, 운지: v.운지, 흔들림: v.흔들림 })) : [];
    const 육합 = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
    const 합 = 운들.filter(u => 육합[u.branch] === R.pillars.day.branch).map(u => ({ 층: u.name, 운지: E.BRANCHES[u.branch] }));
    return { 해: y, 달: m, 운층: 운들, 운들: 운들.map(u => u.name + ' ' + E.STEMS[u.stem] + E.BRANCHES[u.branch]), 원구성: 원.키 === '없음' ? '없음' : 원.식신 && 원.상관 ? '둘 다' : 원.식신 ? '식신만' : '상관만', 구성, 온, 묶임, 일지, 충, 합 };
  }
  /* 72조 ⑥(09-25) 식상 = 나의 언행. 조각 = 식상 글자 × 식신/상관(20가지). 천간에 드러났으면 생색냄, 지장간에만 있으면 생색 안 냄.
   *  원국에서 합으로 묶인 식상 천간은 숨음으로 친다(E.natalHap). 돌려주는 것: [{ 글자, 십신, 드러남, 키: '戊상관' }] — 식신 먼저. */
  function 언행(R) {
    const p = R.pillars, ds = p.day.stem, 묶 = (() => { try { return E.natalHap(p) || {}; } catch (e) { return {}; } })();
    const 있 = 있는천간(R), out = [];
    for (let s = 0; s < 10; s++) {
      const g = E.TEN_GODS[E.tenGod(ds, s)];
      if ((g !== '식신' && g !== '상관') || !있.has(s)) continue;
      const 드러남 = 자리.some(k => k !== 'day' && p[k] && p[k].stem === s && !묶[k]);
      // 72조 ⑧(09-25) 시간에만 드러난 식상은 밖으로 나설지 의문 — 다른 식상과 겨루면 뒤로
      const 시간만 = 드러남 && !자리.some(k => k !== 'day' && k !== 'hour' && p[k] && p[k].stem === s && !묶[k]);
      out.push({ 글자: E.STEMS[s], 십신: g, 드러남, 시간만, 키: E.STEMS[s] + g });
    }
    return out.sort((a, b) => (a.시간만 - b.시간만) || ((a.십신 === '식신' ? 0 : 1) - (b.십신 === '식신' ? 0 : 1)));
  }
  /* 4. 때의 뜻(09-25 — 내 추론, 사장님 검수 대기). 층마다 하는 일이 다르다:
   *  대운(10년) = 바탕 — 일지와 반합 · 삼합이면 바라는 마음이 커지고, 육합이면 붙들리고, 충이면 열 해 동안 흔들린다.
   *  세운(1년) = 모양 — 일간이 그해 지지에서 건록 · 제왕이면 스스로 서는 해라 기대는 마음이 누그러진다.
   *  월운(한 달) = 밀려남 — 일지가 충을 받으면 바라는 마음이 「바뀌는」 게 아니라 치는 글자의 십신(현실 일 · 돈 등)에 「밀려난다」.
   *  언행(72조 ⑥) — 운의 천간으로 온 식상은 겉으로 드러나고(생색), 지지 속으로 온 식상은 속으로 더해진다. */
  const 국 = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]], 왕지 = [0, 3, 6, 9];
  const 충짝 = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };
  const 합짝 = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
  const 록왕 = { 0: [2, 3], 1: [3, 2], 2: [5, 6], 3: [6, 5], 4: [5, 6], 5: [6, 5], 6: [8, 9], 7: [9, 8], 8: [11, 0], 9: [0, 11] };   // 일간 → [건록, 제왕](음간 역행)
  function 지관계(일지, 운지) {
    if (충짝[운지] === 일지) return '충';
    if (국.some(g => g.indexOf(일지) >= 0 && g.indexOf(운지) >= 0 && 일지 !== 운지 && (왕지.indexOf(일지) >= 0 || 왕지.indexOf(운지) >= 0))) return '반합';
    if (합짝[운지] === 일지) return '육합';
    return null;
  }
  const 밀어내는것 = { 비견: '친구와 내 일', 겁재: '친구와 내 일', 식신: '하고 싶은 일', 상관: '하고 싶은 일', 정재: '일과 돈 문제', 편재: '일과 돈 문제', 정관: '일의 책임', 편관: '일의 책임', 정인: '집안 일과 생각할 거리', 편인: '집안 일과 생각할 거리' };
  /* 09-25 사장님 「내가 바라는 사람은 일지의 변질을, 내가 사랑하는 방식은 식상의 변질을 추론하면 된다」 — 71조(합거 = 변질)를 일지 · 식상에.
   *  일지가 운 지지와 육합으로 묶이면: 일지 본기가 물러나고 같은 기운의 다른 글자(지장간 속 · 음양만 다른 것)가 나선다 → 바라는 사람이 그 십신의 사람으로 바뀐다.
   *  원국 천간의 식상이 운 천간과 합으로 묶이면: 같은 기운의 다른 글자가 나선다(식신 ↔ 상관) → 좋아하는 방식이 바뀐다. */
  const 바라는사람 = { 비견: '친구처럼 나란히 걷는 사람', 겁재: '같이 신나 주는 사람', 식신: '곁에서 편하게 지내 주는 사람', 상관: '말이 잘 통하는 사람', 편재: '여기저기 같이 다녀 주는 사람', 정재: '꼼꼼하게 생활을 챙겨 주는 사람', 편관: '이끌어 주고 지켜 주는 사람', 정관: '반듯하고 약속을 지키는 사람', 편인: '말 안 해도 알아채 주는 사람', 정인: '따뜻하게 받아 주는 사람' };
  const 좋아하는법 = { 식신: '챙겨 주는 것', 상관: '방법을 먼저 내놓는 것' };
  function 일지변질(R) {
    const ds = R.pillars.day.stem, br = R.pillars.day.branch, 속 = (E.HIDDEN[br] || []).map(h => typeof h === 'number' ? h : h[0]);
    const 본 = 속[0], 나서는 = 속.slice(1).find(h => E.STEM_ELEM[h] === E.STEM_ELEM[본] && E.STEM_YANG[h] !== E.STEM_YANG[본]);
    const 신 = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    // 09-25 사장님: 子午卯酉는 같은 기운의 짝이 나선다 — 이상형이 일정하다. 나머지 여덟(丑寅辰巳未申戌亥)은 짝이 없어 중기가 나서고 기운이 바뀐다 —
    //   변질됐다 돌아왔다 하는 만남 · 이별 · 재회(법전 72조 ⑨). 전엔 여기서 null 이라 여덟 지지의 변질을 재지 않았다.
    const 후 = 나서는;   // 09-25 사장님 「변질될 수 있는 글자가 중기야?」 — 여덟 지지에서 무엇이 나서는지 정할 때까지 재지 않는다(중기는 근거 없이 내가 고른 것)
    return 후 == null ? null : { 전: 신(본), 후: 신(후), 전글자: E.STEMS[본], 후글자: E.STEMS[후], 기운바뀜: E.STEM_ELEM[후] !== E.STEM_ELEM[본] };
  }
  function 때풀이(R, y, m) {
    const t = 때상태(R, y, m), ds = R.pillars.day.stem, 일지 = R.pillars.day.branch;
    const 대 = ((R.daeun && R.daeun.list) || []).filter(d => d.startYear <= y).pop(), 몇년 = 대 ? 대.startYear + '~' + (대.startYear + 9) + '년' : '요즘 몇 년';
    const 달말 = (y === new Date().getFullYear() && m === new Date().getMonth() + 1) ? '이번 달은' : '그달은';
    const 층들 = t.운층 || [];
    const 바람 = [], 언 = [];
    const 변 = 일지변질(R);
    const 변질말 = (언제) => 변 ? 언제 + ' 끌리는 사람이 바뀌어요. 평소엔 「' + 바라는사람[변.전] + '」에게 끌리는데, 이때는 「' + 바라는사람[변.후] + '」에게 끌려요.' : null;
    const 붙듦 = 층들.some(u => u.name !== '월운' && /반합|육합/.test(지관계(일지, u.branch) || ''));
    층들.forEach(u => {
      const 관 = 지관계(일지, u.branch), 지 = E.BRANCHES_KO[u.branch] + '(' + E.BRANCHES[u.branch] + ')';
      if (u.name === '대운') {
        if (관 === '반합') 바람.push(몇년 + '은 짝에게 바라는 게 많아지는 때예요.');
        else if (관 === '육합') 바람.push(변질말(몇년 + '은') || 몇년 + '은 한번 마음 준 사람에게서 잘 안 흔들려요.');
        else if (관 === '충') 바람.push(몇년 + '은 원하는 사람이 자꾸 바뀌기 쉬워요.');
      } else if (u.name === '세운') {
        if ((록왕[ds] || []).indexOf(u.branch) >= 0) 바람.push(y + '년은 혼자서도 잘 버티는 해예요. 누군가에게 기대는 마음이 조금 줄어요.');
        if (관 === '육합') 바람.push(변질말(y + '년은') || y + '년은 연애하고 싶은 마음이 또렷해요.');
        else if (관 === '반합') 바람.push(y + '년은 연애하고 싶은 마음이 또렷해요.');
        else if (관 === '충') 바람.push(y + '년은 마음이 잘 흔들려요.');
      } else if (u.name === '월운') {
        if (관 === '충') { const h = (E.HIDDEN[u.branch] || [])[0], st = typeof h === 'number' ? h : h[0], 신 = E.TEN_GODS[E.tenGod(ds, st)];
          바람.push(달말 + ' ' + (밀어내는것[신] || '다른 일') + '에 마음이 밀려요. 연애 생각은 잠깐 뒤로 가요. 식은 게 아니라 바쁜 거예요.' + (붙듦 ? ' 크게 흔들리진 않아요.' : '')); }
        else if (관 === '육합') 바람.push(변질말(달말) || 달말 + ' 연애 생각이 많아져요.');
        else if (관 === '반합') 바람.push(달말 + ' 연애 생각이 많아져요.');
      }
    });
    const 조각 = global.ChaeksaSsomJuneun || {};
    const 원 = 언행(R);
    // 같은 글자 · 십신 · 드러남은 층을 묶어 한 줄로(대운 未 · 세운 午 속 己 식신)
    const 묶음 = {};
    t.온.forEach(x => { const 드 = x.어디 === '천간', k = x.글자 + x.십신 + (드 ? '+' : '');
      (묶음[k] = 묶음[k] || { 키: x.글자 + x.십신, 글자: x.글자, 십신: x.십신, 드러남: 드, 곳: [] }).곳.push(x.층 + (드 ? '' : ' ' + x.어디.replace(' 속', ''))); });
    Object.keys(묶음).forEach(k => { const x = 묶음[k], 제목 = 조각[x.키] ? 조각[x.키].제목 : (x.십신 === '식신' ? '챙기는 모습' : '방법을 내놓고 표현하는 모습');
      const 원것 = 원.find(v => v.키 === x.키), 새 = !원것 || (x.드러남 && !원것.드러남);   // 원국에 없거나, 숨어 있던 것이 겉으로 올라옴
      x.새 = 새; x.층 = x.곳.map(c => c.split(' ')[0]).filter((c, i, a) => a.indexOf(c) === i).join(' · ');
      const 무엇 = x.십신 === '식신' ? '챙겨 주는 모습' : '먼저 나서서 계획하고 말하는 모습', 언제 = x.층 === '월운' ? 달말.replace('은', '') : x.층 === '세운' ? y + '년' : 몇년;
      x.말 = 언제 + '에는 ' + 무엇 + '이 ' + (새 ? '새로 생겨요' : '평소보다 늘어요') + (x.드러남 ? ' (티 나게).' : ' (티 안 나게).');
      언.push(x); });
    // 식상 변질 — 원국 천간의 식상이 운 천간과 합으로 묶이면 같은 기운의 다른 글자가 나선다
    const p = R.pillars, 신 = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    ['year', 'month', 'hour'].forEach(k => { if (!p[k]) return; const g = p[k].stem, 십 = 신(g); if (십 !== '식신' && 십 !== '상관') return;
      층들.forEach(u => { if ((u.stem - g + 10) % 10 !== 5) return;
        const 나섬 = g ^ 1, 후 = 신(나섬), 언제 = u.name === '월운' ? 달말.replace('은', '') : u.name === '세운' ? y + '년' : 몇년;
        언.push({ 키: E.STEMS[나섬] + 후, 글자: E.STEMS[나섬], 십신: 후, 드러남: true, 새: true, 층: u.name, 변질: true,
          말: 언제 + '에는 좋아하는 방식이 바뀌어요. 평소엔 ' + 좋아하는법[십] + '으로 마음을 보이는데, 이때는 ' + 좋아하는법[후] + '으로 가요.' }); }); });
    return { t, 바람, 언 };
  }
  // 만난 때와 지금을 견준다 — 그때 있던 언행이 지금 빠졌으면 「그때 같은 모습은 기대하기 어려워요」(사장님 09-24 예)
  function 때견줌(R, 그때, 이제) {
    const 말 = [];
    const 빠짐 = x => x.언.filter(v => !이제.언.some(w => w.키 === v.키 && w.드러남 === v.드러남));
    const 새로 = 이제.언.filter(v => !그때.언.some(w => w.키 === v.키 && w.드러남 === v.드러남));
    const 쉬운 = (v) => (v.십신 === '식신' ? '챙겨 주는 모습' : '먼저 나서서 계획하는 모습');
    빠짐(그때).forEach(v => 말.push(v.새
      ? '그때 있던 ' + 쉬운(v) + '이 지금은 없어요. 그때 같은 모습은 기대하기 어려워요.'
      : '그때는 ' + 쉬운(v) + '이 평소보다 많았어요. 지금은 평소만큼이에요.'));
    새로.forEach(v => 말.push(v.새 ? '지금은 그때 없던 ' + 쉬운(v) + '이 있어요.' : '지금은 ' + 쉬운(v) + '이 그때보다 많아요.'));
    const 흔들 = (x) => x.바람.some(s => /밀려|흔들|바뀌기/.test(s));
    if (!흔들(그때) && 흔들(이제)) 말.push('그때보다 지금은 연애 생각이 뒤로 밀려 있어요.');
    else if (흔들(그때) && !흔들(이제)) 말.push('그때 흔들리던 마음이 지금은 돌아왔어요.');
    if (!말.length) 말.push('그때와 지금이 크게 다르지 않아요.');
    return 말;
  }
  // 닿음(3. 주고받음)의 열쇠 — 받는 쪽 일지 십신 × 주는 쪽 식상 구성
  const 구성말 = (x) => x.키 === '없음' ? '없음' : x.식신 && x.상관 ? '둘 다' : x.식신 ? '식신만' : '상관만';
  function 닿음키(받는R, 주는R) { return 일지십신(받는R) + '|' + 구성말(식상(주는R)); }
  global.ChaeksaSsom = { 언행, 때상태, 때풀이, 때견줌, 지관계, 일지변질, 바라는사람, 닿음키, 구성말, 식상, 일지: 일지지, 일주, 일지십신, 방향, 짝, 질문, 반응틀, 반응물음, 기록: 일지, 적기 };
})(window);
