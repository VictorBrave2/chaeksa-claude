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
    return { 해: y, 달: m, 운들: 운들.map(u => u.name + ' ' + E.STEMS[u.stem] + E.BRANCHES[u.branch]), 원구성: 원.키 === '없음' ? '없음' : 원.식신 && 원.상관 ? '둘 다' : 원.식신 ? '식신만' : '상관만', 구성, 온, 묶임, 일지, 충, 합 };
  }
  // 닿음(3. 주고받음)의 열쇠 — 받는 쪽 일지 십신 × 주는 쪽 식상 구성
  const 구성말 = (x) => x.키 === '없음' ? '없음' : x.식신 && x.상관 ? '둘 다' : x.식신 ? '식신만' : '상관만';
  function 닿음키(받는R, 주는R) { return 일지십신(받는R) + '|' + 구성말(식상(주는R)); }
  global.ChaeksaSsom = { 때상태, 닿음키, 구성말, 식상, 일지: 일지지, 일주, 일지십신, 방향, 짝, 질문, 반응틀, 반응물음, 기록: 일지, 적기 };
})(window);
