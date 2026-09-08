/* 문장표 조립기 (2026-09-05 사장님 「20문항 × 경우의 수만큼 문장을 만들어 조합, 내가 검수」→「전수 진행」)
 *
 * 값 → 문장 사이의 병목을 표로 뺀다. 문항마다 축(엔진 값)의 조합 전부에 문장이 미리 씌어 있고(docs/33_문장표_*.md → app/mun/*.js),
 * 여기서는 키를 만들어 칸을 찾기만 한다. 표가 없는 문항은 지금 코드의 문장이 그대로 나간다 → 문항 하나씩 갈아 끼울 수 있다.
 * 축 설계는 docs/34. 키 표기: 'A1-B겉뿌-C한-D옴' 처럼 축 글자 + 등급.
 */
(function (global) {
  'use strict';
  const M = global.ChaeksaMun = global.ChaeksaMun || { 표: {} };

  /** 30조 상태 → 등급 글자 */
  M.상태 = (st) => st === '겉·뿌리' ? '겉뿌' : st === '겉·무근' ? '겉무' : (st === '속' || st === '속·먹힘') ? '속' : '없';
  /** 순위(1,2,3+,0=없음) */
  M.순위 = (n) => n === 1 ? '1' : n === 2 ? '2' : n >= 3 ? '3' : '없';
  /** 어느 운에라도 무리 g 가 오나 — {하늘,땅} 꼴들을 받는다 */
  M.운옴 = (g, ...운들) => 운들.some(u => u && (u.하늘 === g || u.땅 === g));

  /** 표 칸 찾기 — 없으면 null */
  M.칸 = (code, q, key) => { const t = M.표[code + ':' + q]; return (t && t[key]) || null; };

  /** Q[q-1] 을 표 칸으로 덮는다. 칸이 없으면 그대로 두고 false */
  M.덮기 = (code, q, Q, key) => {
    const c = M.칸(code, q, key); const item = Q && Q[q - 1];
    if (!c || !item) return false;
    item.답 = c.답; item.왜 = c.왜; item.표키 = key; return true;
  };

  /** 역산(법전 32조) — 지금 대운이 「나」의 기운에 닿게 하는 길과 공주님이 본 「먼저 달라진 것」.
   *  남자: 재성→재(여자·돈) · 식상→식(말) · 관성→관(자리). 여자: 관성→재 · 재성→식 · 인성→관.
   *  돌려주는 것 {엔진길, 이전길, 대운:{start,end}, 관찰} — 관찰은 Rm.input.관찰(여자·돈→재, 말→식, 자리→관, 없음→없, 없으면 '') */
  M.역산 = (Rm, now) => {
    const e = global.ChaeksaEngine; const out = { 엔진길: '없', 이전길: '없', 대운: null, 관찰: '' };
    try {
      const ds = Rm.pillars.day.stem, 남 = ((Rm.input && Rm.input.gender) || 'M') === 'M';
      const 무리표 = { 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성' };
      const 길표 = 남 ? { 재성: '재', 식상: '식', 관성: '관' } : { 관성: '재', 재성: '식', 인성: '관' };
      const 무리 = (st) => 무리표[e.TEN_GODS[e.tenGod(ds, st)]];
      const 길of = (pl) => { if (!pl) return '없'; return 길표[무리(pl.stem)] || 길표[무리((e.HIDDEN[pl.branch] || [])[0])] || '없'; };
      const cur = e.currentDaeun(Rm, now || new Date());
      if (cur) { const L = Rm.daeun.list, i = L.indexOf(cur); out.엔진길 = 길of(cur); out.이전길 = i > 0 ? 길of(L[i - 1]) : '없'; out.대운 = { start: cur.startAge, end: cur.endAge }; }
    } catch (x) {}
    const 원 = (Rm.input && Rm.input.관찰) || '';
    // 그 사람 쪽은 여자·돈·말·자리·없음으로 받고, 공주님 쪽은 재·식·관·없 코드로 바로 받는다
    out.관찰 = ['재', '식', '관', '없'].indexOf(원) >= 0 ? 원
      : 원 === '여자' || 원 === '돈' ? '재' : 원 === '말' ? '식' : 원 === '자리' ? '관' : 원 === '없음' ? '없' : '';
    return out;
  };
  /** 역산 표로 덮기 — 관찰이 있을 때만. 키 'A<원래>-E<엔진길>-S<관찰>'. 덮였고 길이 있으면 대운 나이를 답 앞에 붙인다 */
  M.역산덮기 = (code, q, Q, 원래, 역, 무접두) => {
    if (!역 || !역.관찰) return false;
    const ok = M.덮기(code, q, Q, 'A' + 원래 + '-E' + (역.엔진길 || '없') + '-S' + 역.관찰);
    // 해·달 숫자가 따로 앞에 붙는 문항은 대운 나이를 안 붙인다 — 접두가 둘이면 읽기 나쁘다
    if (ok && !무접두 && 역.대운 && 역.엔진길 !== '없') Q[q - 1].답 = 역.대운.start + '살부터 ' + 역.대운.end + '살까지 — ' + Q[q - 1].답;
    return ok;
  };

  /** 상태 x(해) — 그 해에 작동하는 대운·세운 네 글자(천간 둘 + 지지 본기 둘)를 다섯 무리로 센다.
   *  가중치를 두지 않는다. 개수만 센다 — 무게를 매기는 순간 그 숫자를 우리가 정하게 된다(docs/15 C절). */
  const 무리표 = { 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성' };
  M.무리들 = ['비겁', '식상', '재성', '관성', '인성'];
  M.판 = (R, 해) => {
    const e = global.ChaeksaEngine; const out = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
    try {
      const ds = R.pillars.day.stem;
      const du = e.currentDaeun(R, new Date(해, 6, 1)), tf = e.dateFortune(해, 7, 1);
      const 넣 = (st) => { if (st == null) return; const g = 무리표[e.TEN_GODS[e.tenGod(ds, st)]]; if (g) out[g]++; };
      [du && du.stem, du && (e.HIDDEN[du.branch] || [])[0], tf.year.stem, (e.HIDDEN[tf.year.branch] || [])[0]].forEach(넣);
      return { x: out, 대운: du ? e.fmt.pillar(du) : '', 세운: e.fmt.pillar(tf.year) };
    } catch (x) { return { x: out, 대운: '', 세운: '' }; }
  };
  /** 두 시점의 차 — 키 다섯 자리(비겁·식상·재성·관성·인성), `+` 늘고 `0` 그대로 `-` 줄고.
   *  과거를 물으면 판차(R, 올해, 그해)로 부른다 — 「지금은 이런데 그때는」이 되게. */
  M.판차 = (R, 기준해, 볼해) => {
    const a = M.판(R, 기준해), b = M.판(R, 볼해);
    return { 키: M.무리들.map(g => { const d = b.x[g] - a.x[g]; return d > 0 ? '+' : d < 0 ? '-' : '0'; }).join(''),
             기준: a, 볼: b, 델타: M.무리들.reduce((o, g) => (o[g] = b.x[g] - a.x[g], o), {}) };
  };
  /** 상태차 표(sangtae:1)에서 그 칸을 꺼낸다 */
  M.판칸 = (R, 기준해, 볼해) => {
    const d = M.판차(R, 기준해, 볼해); const t = M.표['sangtae:1'];
    return Object.assign(d, { 칸: (t && t[d.키]) || null });
  };

  /** 어느 문항에 표가 있나 — 점검용 */
  M.있는표 = () => Object.keys(M.표).map(k => k + '(' + Object.keys(M.표[k]).length + ')');
})(window);
