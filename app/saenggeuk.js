/* 생극제화 표 — 여덟 글자가 서로 무엇을 하는가 (법전 33조, 2026-09-14)
 *
 * 사장님: 「정화한테 갑이 있으면 임수가 도움이 되는 것이고, 갑한테 임수가 있으면 경금이 도와주는 것이고.
 *          IF 로 들어가야 한다. 그렇게 짜 줘야 원국마다의 생극제화가 나뉘어진다.」
 *
 * 규칙은 하나다 — **극하는 두 글자 사이에 둘을 잇는 셋째 글자가 살아 있으면 극이 생으로 바뀐다(통관).**
 * 일간만이 아니라 여덟 글자 모든 쌍에 건다(30·31조). 셋째 글자가 둘이면 둘 다 없어져야 잃는다(32조).
 * 「살아 있다」 = 천간에 떠 있고, 뿌리가 있고(1조 stemPower > 0), 합거되지 않았다(3·28조).
 * 지장간은 뿌리로만 센다 — 셋째 글자 노릇은 못 한다(정한 것, 2026-09-14).
 *
 * 신강·신약은 여기 없다(29조). 「壬이 丁에 닿는가」가 표의 한 칸이다.
 *
 * 쓰는 법:  ChaeksaSaenggeuk.표(pillars, 운들, R)  →  { 글자, 쌍, 닿음, 통관, 제복, 끊김, 격 }
 *   pillars = R.pillars · 운들 = [{ stem, branch, name }] 대운·세운·월운·일운(지지도 넣으면 뿌리터에 든다, 27조) · R 을 주면 격 이름을 얹는다.
 * 살아 있다 = 힘 0.5 이상(09-14 「제 역할은 할 수 있으니까」). 길흉은 붙이지 않는다 — 관계만 말한다.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;
  if (!E) return;
  const ELEM_KO = E.ELEM;                       // ['목','화','토','금','수']
  const 생 = (a, b) => (a + 1) % 5 === b;       // a 가 b 를 생한다
  const 극 = (a, b) => (a + 2) % 5 === b;       // a 가 b 를 극한다

  /** 원국 천간 넷(일간 포함) + 운 천간을 「글자」로 세운다. 힘·합거를 붙인다. */
  function 글자들(pillars, 운천간들, 계절지지) {   // 계절지지 = 이달 지지(43조). 없으면 운들 속 이달, 그것도 없으면 원국 월지
    const 자리 = [['year', '연간', E.NATAL_WEIGHT.yearBranch], ['month', '월간', E.NATAL_WEIGHT.monthBranch],
                  ['day', '일간', E.NATAL_WEIGHT.dayBranch], ['hour', '시간', E.NATAL_WEIGHT.hourBranch]]
      .filter(([k]) => pillars[k]);
    // 뿌리터 = 원국 지지 + 운의 지지(27조 「운의 지지를 원국에 더해 다시 푼다」). 운 지지 무게는 1.0.
    const 뿌리터 = 자리.map(([k, , w]) => [pillars[k].branch, w])
      .concat((운천간들 || []).filter(u => u.branch != null).map(u => [u.branch, 1.0]));
    const out = 자리.map(([k, 이름]) => ({
      key: k, 이름, stem: pillars[k].stem, 글자: E.STEMS[pillars[k].stem], 오행: E.STEM_ELEM[pillars[k].stem],
      힘: k === 'day' ? null : Math.round(E.stemPower(pillars[k].stem, 뿌리터) * 100) / 100,
      일간: k === 'day', 운: false, 합거: null, 이력: [],   // 이력 = 어느 조문으로 상태가 바뀌었나(판정 모듈 B)
    }));
    // 43조 합화 — 합이 화하는 오행(갑기 토·을경 금·병신 수·정임 목·무계 화)이 **지금 계절(이달 지지)**을 얻으면 화한다(사장님 09-14 「가을이잖아」).
    // 화하면 묶이지 않는다 — 그 오행이 아니던 글자가 그 오행으로 바뀐다(乙이 금이 된다). 계절이 아니면 합이불화 = 합거.
    const 화오행of = (st) => [2, 3, 4, 0, 1][st % 5];
    const 이달 = (운천간들 || []).find(u => u.name === '이달' && u.branch != null);
    const 계절 = E.BRANCH_ELEM[계절지지 != null ? 계절지지 : (이달 ? 이달.branch : pillars.month.branch)];
    const 화stem = (g, 오행) => { for (let i = 0; i < 10; i++) if (E.STEM_ELEM[i] === 오행 && i % 2 === g.stem % 2) return i; return g.stem; };
    const 화하다 = (a, b, 조) => {
      const 오행 = 화오행of(a.stem);
      [a, b].forEach(g => {
        if (g.오행 === 오행) { g.이력.push({ 조, 말: E.STEMS[a.stem] + E.STEMS[b.stem] + ' 합화 ' + 오행자[오행] + ' — 제 오행 그대로' }); return; }
        g.화stem = 화stem(g, 오행); g.오행 = 오행; g.화 = 오행자[오행];
        if (!g.일간) g.힘 = Math.round(E.stemPower(g.화stem, 뿌리터) * 100) / 100;
        g.이력.push({ 조, 말: E.STEMS[a.stem] + E.STEMS[b.stem] + ' 합화 — ' + 오행자[오행] + '으로 화함(계절이 ' + 오행자[계절] + ')' });
      });
    };
    // 원국 합(연간-월간). 일간은 합거하지 않는다. 화하면 합거가 아니다.
    const nh = E.natalHap(pillars);
    Object.keys(nh).forEach(k => {
      const g = out.find(x => x.key === k), 짝 = out.find(x => x.key === nh[k]);
      if (!g || !짝) return;
      if (화오행of(g.stem) === 계절) { if (!g.화 && !짝.화) 화하다(g, 짝, '43조'); return; }
      g.합거 = '원국 ' + 짝.이름; g.이력.push({ 조: '3조', 말: '원국 ' + 짝.이름 + '과 합 — 합거' });
    });
    // 운 천간 — 하나씩 들어와 아직 안 묶인 원국 천간(일간 제외) 중 합하는 것을 묶는다(28조 두번법칙: 첫 번은 묶이고 둘째부터 뚫린다).
    (운천간들 || []).forEach(u => {
      // 뒤에 온 운 글자는 원국 글자뿐 아니라 앞서 온 운 글자도 묶는다 — 월운 辛이 세운 丙을 묶으면 구응이 사라진다(09-14 사장님).
      // **운끼리 먼저 묶이고 원국은 그 뒤다** — 「갑X 대운에 기X 세운이면 대운이랑 세운이 묶이는 거지 원국을 묶지 않지」(09-14). 앞 운이 여럿이면 가까운 층부터.
      // 37조 쟁합: 원국 안에서는 연간 → 월간 → 시간 순서로 묶인다(사장님 09-14). 운끼리는 가까운 층부터(28조). 운이 원국보다 먼저.
      const 원국차례 = { year: 0, month: 1, hour: 2 };
      const 후보 = out.filter(x => !x.일간 && !x.합거 && E.isHap(x.stem, u.stem))
        .sort((a, b) => (b.운 ? 1 : 0) - (a.운 ? 1 : 0)
          || (a.운 && b.운 ? out.indexOf(b) - out.indexOf(a) : 0)
          || (!a.운 && !b.운 ? (원국차례[a.key] - 원국차례[b.key]) : 0));
      // 합은 서로 묶는다 — 갑목을 묶은 기토는 그 합에 쓰여서 제 명령(임수를 잡는 일)을 못 한다(사장님 「기토 오면 임수가 닿는다」).
      let 묶은 = null, 화짝 = null;
      if (후보.length && 화오행of(u.stem) === 계절) { 화짝 = 후보[0]; }                       // 43조 — 계절을 얻은 합은 묶지 않고 화한다
      else if (후보.length) {
        후보[0].합거 = u.name || '운'; 묶은 = (후보[0].운 ? '' : '원국 ') + 후보[0].이름 + ' ' + 후보[0].글자;
        const 왜 = 후보.length > 1 ? (후보[0].운 ? '28조(운끼리 먼저, 가까운 층부터)' : '37조(연간→월간→시간)') : '28조';
        후보[0].이력.push({ 조: 왜, 말: (u.name || '운') + ' ' + E.STEMS[u.stem] + '이 묶음' + (후보.length > 1 ? ' — 쟁합 ' + 후보.map(x => x.이름).join('·') + ' 중 첫째' : '') });
      }
      const 새 = { key: 'un' + out.length, 이름: u.name || '운', stem: u.stem, 글자: E.STEMS[u.stem], 오행: E.STEM_ELEM[u.stem],
                 힘: u.힘 != null ? u.힘 : Math.round(E.stemPower(u.stem, 뿌리터) * 100) / 100,   // 사람 층(53조)은 제 원국의 힘을 가져온다
                 일간: false, 운: true, 합거: 묶은 ? 묶은 + '과 합' : null,
                 이력: 묶은 ? [{ 조: '28조', 말: 묶은 + '과 합에 쓰임 — 제 명령 없음' }] : [] };
      out.push(새);
      if (화짝) 화하다(화짝, 새, '43조');
    });
    // 「산다」 — 일간이거나, 힘 0.5 이상이고 합거 안 된 것(사장님 09-14 「살아있다를 0.5로 가자, 제 역할은 할 수 있으니까」. 연지·일지 장생 0.55·월지 목욕 1.0 까지 산다)
    // 50조 국 완성 충(사장님 09-14 「2026년 10월 8일 이후 오·술이니까 인일 또는 인시에 터진다」) — 쌓이는 합이 아니라 완성이 방아쇠.
    // 원국 국(申子辰)과 마주 보는 국(寅午戌)이 원국 지지 + 운 지지(층 누적)로 세 글자 다 모이고, 그중 하나라도 운에서 왔으면 국끼리 충이다.
    // 충당한 국에 뿌리 둔 천간은 그 국의 자리를 뿌리로 못 쓴다 → 힘을 국 자리 빼고 다시 잰다(대개 무근). 시에서만 채워지는 것은 하루 판정에 없다(「○시에 한 번 더」).
    try {
      const 마주 = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };   // 子午 丑未 寅申 卯酉 辰戌 巳亥
      const 원지 = 자리.map(([k]) => pillars[k].branch), 운지 = (운천간들 || []).filter(u => u.branch != null).map(u => u.branch);
      const 원국들 = E.samhapOf(자리.map(([k, , w]) => [pillars[k].branch, w]));
      원국들.forEach(국 => {
        const 반대 = 국.글자.map(b => 마주[b]);
        const 있음 = 반대.every(b => 원지.indexOf(b) >= 0 || 운지.indexOf(b) >= 0);
        const 운이채움 = 반대.some(b => 원지.indexOf(b) < 0 && 운지.indexOf(b) >= 0);
        if (!있음 || !운이채움) return;
        const 남은터 = 뿌리터.filter(([b]) => 국.글자.indexOf(b) < 0 && 반대.indexOf(b) < 0);   // 충당한 국 자리도, 치러 온 국 자리도 뿌리가 못 된다(戌의 관대로 壬이 서는 일이 없게)
        out.forEach(g => {
          if (g.일간 || g.오행 !== 국.elem) return;
          const 전 = g.힘; g.힘 = Math.round(E.stemPower(g.stem, 남은터, []) * 100) / 100;
          g.이력.push({ 조: '50조', 말: 국.글자.map(b => E.BRANCHES[b]).join('') + ' 국이 ' + 반대.map(b => E.BRANCHES[b]).join('') + ' 국에 충당 — 뿌리 잃음, 힘 ' + 전 + ' → ' + g.힘 });
        });
      });
    } catch (e) {}
    // 54조 운의 충(09-16) — 운 지지가 원국 지지를 충하면 그 자리가 **흔들린다**. 뿌리는 안 뽑는다 — 지지는 군사고 명령은 천간이다(41조).
    // 사장님 「酉만 오면 흔들리는 게 느껴지지만 버틴다, 辛酉가 와야 빡 친다 · 酉월 酉시(4 vs 1)여도 안 무너진다」→ 지지 합산으로 뽑는 규칙(적천수 旺者衝衰)을 버렸다.
    // 극은 천간이 36조로 낸다 — 같은 오행 천간이 얹히면 그 천간이 뿌리를 얻어 힘이 오르고, 그게 극·부목을 만든다(이미 stemPower 가 운 지지를 뿌리터에 넣어 잰다).
    // 합에 쓰인 자리는 충을 못 한다(6조). 표시만 남긴다 — 화면은 「흔들리는 날」로 읽는다.
    out.운충 = [];
    try {
      const 마주 = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };
      const 육합 = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
      const 지이름 = { year: '연지', month: '월지', day: '일지', hour: '시지' };
      const 원자리 = 자리.map(([k, , w]) => ({ k, 이름: 지이름[k], branch: pillars[k].branch, w }));
      const 합자리 = {};
      try { (E.branchRels(pillars).성립 || []).forEach(x => { if (x.종류 !== '충') (x.자리 || []).forEach(n => { 합자리[n] = true; }); }); } catch (e) {}
      (운천간들 || []).filter(u => u.branch != null).forEach(u => {
        // 운 지지가 원국 지지와 육합이면 합에 쓰인다 — 단 그 원국 지지가 이미 원국 안 합(삼합·육합)에 들었으면 못 잡는다(6조 「한 지지는 하나와만」, 삼합 > 육합).
        if (원자리.some(x => x.branch === 육합[u.branch] && !합자리[x.이름])) return;
        if ((E.samhapOf(뿌리터) || []).some(국 => 국.글자.indexOf(u.branch) >= 0)) return;            // 운 지지가 국에 들었음
        원자리.forEach(x => {
          if (마주[u.branch] !== x.branch) return;
          const 항 = { 운: u.name || '운', 운지: E.BRANCHES[u.branch], 자리: x.이름, 원지: E.BRANCHES[x.branch], 흔들림: true };
          if (합자리[x.이름]) { 항.흔들림 = false; 항.안섬 = '합에 쓰인 자리'; }
          // 그 자리에 뿌리 둔 천간(같은 오행 지장간 정기) — 화면이 「무엇이 흔들리나」를 말할 때 쓴다. 힘은 안 바꾼다.
          항.뿌리둔 = out.filter(g => !g.일간 && !g.운 && E.stemPower(g.화stem != null ? g.화stem : g.stem, [[x.branch, x.w]]) > 0).map(g => ({ key: g.key, 이름: g.이름, 글자: g.글자 }));
          out.운충.push(항);
        });
      });
    } catch (e) {}
    out.forEach(g => { g.산다 = g.일간 || (g.힘 >= 0.5 && !g.합거); if (!g.일간 && !g.합거 && g.힘 < 0.5) g.이력.push({ 조: '33조', 말: '힘 ' + g.힘 + ' (0~2.0) < 0.5 — 무근' }); });
    // 71조(09-24) 합거는 죽음이 아니라 변질 — 표시만 더한다. 「산다」(제 기능)는 그대로 false 다. 다른 코드가 산다를 읽으니 뜻을 바꾸지 않는다.
    out.forEach(g => { if (!g.일간 && g.합거) g.변질 = true; });
    return out;
  }

  /** 모든 쌍의 생극과 통관. */
  function 표(pillars, 운천간들, R, 계절지지) {
    const 글자 = 글자들(pillars, 운천간들, 계절지지);
    const ds = 글자.find(g => g.일간).stem;
    const 십신 = (g) => g.일간 ? '일간' : E.TEN_GODS[E.tenGod(ds, g.화stem != null ? g.화stem : g.stem)];   // 합화한 글자는 화한 오행의 십신
    글자.forEach(g => { g.십신 = 십신(g); });
    // 격(38·39조) — 원국 격도 취격() 한 법으로 낸다(운의 변격과 비대칭 금지). 상신은 격표(gyeokguk)에서.
    let 격 = null;
    try {
      const 나0 = 글자.find(g => g.일간);
      const 고른 = 취격(pillars, { 글자: 글자.filter(g => !g.운) }, 나0);
      if (고른.격) {
        let 상신 = null;
        try { const G = global.ChaeksaGyeok; if (R && G && G.judge) { const j = G.judge(R, 고른.격); 상신 = j && j.상신 || null; } } catch (e) {}
        격 = { 이름: 고른.격, 상신, 근거: 고른.근거 };
      }
    } catch (e) { 격 = null; }
    // 46조(초안, docs/36) — 궁(지지)을 표에 올린다. 지지는 치는 쪽이 되지 않고(명령은 천간, 15:743·806) 맞는 쪽·자리로만 선다.
    // 힘은 자리 무게(월 2.0·시 1.5·연·일 1.0)만 — 12운성은 천간이 받는 것(15:185). 궁은 늘 채워져 있어 「없다」가 없다(docs/30). 상태는 원국 안의 합·충(30:108).
    const 뿌리터원 = [['year', E.NATAL_WEIGHT.yearBranch], ['month', E.NATAL_WEIGHT.monthBranch], ['day', E.NATAL_WEIGHT.dayBranch], ['hour', E.NATAL_WEIGHT.hourBranch]]
      .filter(([k]) => pillars[k]).map(([k, w]) => [pillars[k].branch, w]);
    const 궁 = [];
    try {
      const 궁자리 = [['year', 'yearB', '연지', E.NATAL_WEIGHT.yearBranch], ['month', 'monthB', '월지', E.NATAL_WEIGHT.monthBranch],
                     ['day', 'dayB', '일지', E.NATAL_WEIGHT.dayBranch], ['hour', 'hourB', '시지', E.NATAL_WEIGHT.hourBranch]].filter(([k]) => pillars[k]);
      const rel = E.branchRels ? E.branchRels(pillars) : { 성립: [] };
      궁자리.forEach(([k, key, 이름, w]) => {
        const b = pillars[k].branch, 본기 = (E.HIDDEN[b] || [])[0];
        const g = { key, 이름, branch: b, 글자: E.BRANCHES[b], 오행: E.BRANCH_ELEM[b], stem: 본기, 십신: E.TEN_GODS[E.tenGod(ds, 본기)],
                    지지: true, 궁: true, 일간: false, 운: false, 산다: true, 힘: w, 합거: null, 합: [], 충: [], 이력: [] };
        (rel.성립 || []).forEach(x => { if (x.자리 && x.자리.indexOf(이름) >= 0) { if (x.종류 === '충') g.충.push(x.글자); else g.합.push(x.종류 + ' ' + x.글자); } });
        궁.push(g);
      });
    } catch (e) {}
    // 지장간(41조 군사) — 천간·궁에 대상 글자가 없을 때 당겨 온다(09-14 사장님 「지장간에서 땡겨오면 (지장간)으로 넣고」). 맞는 쪽으로만 선다.
    // 힘: 본기는 자리 무게 그대로, 중기·여기는 그 반 — 원문에 숫자가 없어 내가 정한 값(동결표 C절). 국에 먹힌 자리는 십신 노릇을 잃으므로(15:815) 국 자리의 지장간은 안 올린다.
    const 지장간 = [];
    try {
      const 국자리 = {}; (E.samhapOf(뿌리터원) || []).forEach(g => g.글자.forEach(b => { 국자리[b] = true; }));
      [['year', 'yearH', '연지', E.NATAL_WEIGHT.yearBranch], ['month', 'monthH', '월지', E.NATAL_WEIGHT.monthBranch],
       ['day', 'dayH', '일지', E.NATAL_WEIGHT.dayBranch], ['hour', 'hourH', '시지', E.NATAL_WEIGHT.hourBranch]].filter(([k]) => pillars[k]).forEach(([k, key, 이름, w]) => {
        const b = pillars[k].branch; if (국자리[b]) return;
        (E.HIDDEN[b] || []).forEach((h, idx) => {
          const st = typeof h === 'number' ? h : h[0];
          지장간.push({ key: key + idx, 이름: 이름 + ' 속', branch: b, stem: st, 글자: E.STEMS[st], 오행: E.STEM_ELEM[st], 십신: E.TEN_GODS[E.tenGod(ds, st)],
                       지지: true, 지장간: true, 본기: idx === 0, 일간: false, 운: false, 산다: true, 힘: idx === 0 ? w : Math.round(w * 50) / 100, 합거: null, 이력: [] });
        });
      });
    } catch (e) {}
    // 61조 — 원국 글자의 자리(연 0 · 월 1 · 일 2 · 시 3). 운 글자는 자리가 없다(null).
    const 자리 = (g) => { const k = String(g && g.key || ''); return k.indexOf('year') === 0 ? 0 : k.indexOf('month') === 0 ? 1 : k.indexOf('day') === 0 ? 2 : k.indexOf('hour') === 0 ? 3 : null; };
    const 붙음 = (c, b) => { const p = 자리(c), q = 자리(b); return p == null || q == null || Math.abs(p - q) <= 1; };
    const 쌍 = [];
    for (const a of 글자) for (const b of 글자.concat(궁, 지장간)) {
      if (a === b) continue;
      let 관계 = null;
      if (생(a.오행, b.오행)) 관계 = '생';
      else if (극(a.오행, b.오행)) 관계 = '극';
      if (!관계) continue;
      const row = { from: a, to: b, 관계, 셋째: [], 잡는: [], 통관: false, 제복: false, 막힘: false, 산다: a.산다 && b.산다 };
      if (관계 === '극') {
        // 셋째 글자(통관): a 가 생하고 b 를 생하는 오행 = (a+1)%5. 살아 있는 것만.
        const 다리 = (a.오행 + 1) % 5;
        // 일간은 주체라 방패(셋째·잡는 글자) 노릇을 안 한다(09-14 「임수가 정화에 묶여 있잖아」 — 일간 丁을 방패로 세운 것을 잡았다).
        const 다리들 = 글자.filter(c => c !== a && c !== b && !c.일간 && c.오행 === 다리 && c.산다);
        // 61조(09-17) 붙음 — 통관하는 글자는 맞는 글자 바로 옆에 붙어 있어야 선다. 적천수 通关 「年逢印绶，远隔不通」 · 清气 「官星贴日，印星远隔，日主先受官克，印星不能生化」.
        // 임철초 통관 실례 넷 가운데 둘(戊辰 乙卯 辛丑 丁酉 · 己巳 丁卯 辛卯 乙未)을 엔진이 「통관 선다」로 잘못 봤다 — 이 한 줄로 넷 다 맞고 사장님 명식(壬이 甲 옆)은 그대로 선다.
        // 운으로 온 글자는 자리가 없어 걸지 않는다 — 원문이 「岁运相逢，乃为通关」이라 했다. 폐기한 것은 자리의 **뜻**(연주=조상)이지 글자 사이의 **거리**가 아니다.
        row.셋째 = 다리들.filter(c => 붙음(c, b));
        row.셋째탈락 = 다리들.filter(c => !붙음(c, b)).map(c => ({ 글자: c, 사유: '떨어짐' }));
        // 36조 통관 — 치는 글자 힘이 셋째 글자들 힘 합산의 두 배를 넘으면 다리가 못 버틴다 = 부목(浮木)(사장님 09-14 「비 오면 컨디션이 최악, 부목이 된다고 느낀다」).
        // 사장님 원국 壬 2.45 vs 甲 1.24 = 1.98배라 통관, 壬子 대운처럼 수가 더해지면 끊긴다.
        // 잡는 글자(제복): a 를 극하는 살아 있는 글자 = 오행 (a+3)%5. 자평진전 「갑목이 무토를 잡아 임수에 못 닿는다」.
        const 잡이 = (a.오행 + 3) % 5;
        row.잡는 = 글자.filter(c => c !== a && c !== b && !c.일간 && c.오행 === 잡이 && c.산다);
        // 36조 제복 — 잡는 글자들의 힘 합산이 치는 글자의 두 배 이상이어야 제복이다(사장님 09-14 「제복을 그래서 3배에서 2배로 수정하라 했잖아」 · 「약한 고리의 법칙」).
        // 丙 1.4 혼자는 庚 0.82 를 못 잡고(1.7배), 丁 1.24 가 더해져 2.6배가 되며 잡는다 — 9월 7일 정유월부터 현금이 돈 것과 맞는다.
        // 통관은 셋째 글자가 살아 있으면 성립(아직 수치 없음 — 사장님 「이것도 수치화해야 하긴 해」, 사례 대기).
        const 잡는힘 = row.잡는.reduce((s, c) => s + (c.힘 || 0), 0);
        row.제복 = row.잡는.length > 0 && (a.힘 == null || a.힘 <= 0 || 잡는힘 >= 2 * a.힘);
        row.제복부족 = row.잡는.length > 0 && !row.제복;
        // 36조 ④ 깎기(사장님 09-14 「제복이 깎는 형태라면」 → 「네 제안으로 가자」) — 제복에 못 미친 잡는 글자도 치는 힘을 깎는다.
        // 유효힘 = 치는 힘 − 잡는 합산의 반. 이 남은 힘으로만 통관을 잰다(제복 성패는 위 2배 그대로). 궁통보감 「水泛木浮, 戊己 구제」가 여기로 들어온다 —
        // 토가 壬을 반 깎으면 甲이 받을 수 있게 된다. 반(0.5)은 「잡는 합산 = 치는 힘의 2배에서 0이 되는」 값이라 새 상수가 아니다.
        row.유효힘 = a.힘 == null ? null : Math.max(0, Math.round((a.힘 - 잡는힘 / 2) * 100) / 100);
        const 셋째힘 = row.셋째.reduce((s, c) => s + (c.힘 || 0), 0);
        row.통관 = row.셋째.length > 0 && (row.유효힘 == null || row.유효힘 <= 0 || row.유효힘 <= 2 * 셋째힘);
        row.부목 = row.셋째.length > 0 && !row.통관;
        // 맞는 쪽이 치는 쪽보다 두 배 이상 세면 못 친다(36조, 09-14 「3배는 너무 많이 준 듯, 2배까지 극 가능」, 09-14 「3배 이상 힘이 차이난다면 경금이 갑목을 치기 어려운 것도 맞지?」). 일간은 힘을 안 재니 뺀다.
        // 36조 2배 규칙 — 맞는 쪽은 같은 오행의 살아 있는 글자 힘을 합쳐 잰다(사장님 09-14 「화금으로 재가 둘이면 비겁 하나가 다 못 친다 — 맞는 말」).
        const b합 = 글자.filter(c => !c.일간 && c.산다 && c.오행 === b.오행).reduce((s, c) => s + (c.힘 || 0), 0) || b.힘;
        row.힘차이 = (!b.일간 && a.힘 != null && b.힘 != null && a.힘 > 0 && b합 >= 2 * a.힘);
        row.막힘 = row.통관 || row.제복 || row.힘차이;
      }
      쌍.push(row);
    }
    // 62조(09-17) 통관하는 글자가 제 몸을 못 지키면 통관이 안 선다 — 적천수 通关 「局内有印，被财星损坏」 · 실례 「又被旺木克土坏印… 此局内无可通之理」.
    // 기준은 새로 짓지 않는다 — 36조 그대로: 그 글자를 치는 산 글자가 있고 · 그 극이 안 막혀 있고 · 남은 힘이 있다(막힘에 두 배 규칙이 이미 들어 있다).
    // 한 글자가 빠지면 그 글자가 막던 극이 뚫려 다른 통관이 또 빠질 수 있어 가라앉을 때까지 돈다(천간 넷이라 세 번이면 끝난다).
    for (let 돌이 = 0; 돌이 < 3; 돌이++) {
      const 깨진 = 글자.filter(c => !c.일간 && c.산다 && 쌍.some(q => q.관계 === '극' && q.to === c && q.from.산다 && !q.from.일간 && !q.막힘 && (q.유효힘 == null || q.유효힘 > 0)));
      let 바뀜 = false;
      쌍.forEach(row => {
        if (row.관계 !== '극' || !row.셋째.length) return;
        const 남는 = row.셋째.filter(c => 깨진.indexOf(c) < 0);
        if (남는.length === row.셋째.length) return;
        row.셋째.filter(c => 깨진.indexOf(c) >= 0).forEach(c => row.셋째탈락.push({ 글자: c, 사유: '극당함' }));
        row.셋째 = 남는;
        const 셋째힘 = 남는.reduce((s, c) => s + (c.힘 || 0), 0);
        row.통관 = 남는.length > 0 && (row.유효힘 == null || row.유효힘 <= 0 || row.유효힘 <= 2 * 셋째힘);
        row.부목 = 남는.length > 0 && !row.통관;
        row.막힘 = row.통관 || row.제복 || row.힘차이;
        바뀜 = true;
      });
      if (!바뀜) break;
    }
    // 일간에게 닿는 것 — 극인데 통관 안 된 것 / 통관된 것 / 생하는 것
    const 나 = 글자.find(g => g.일간);
    const 닿음 = 쌍.filter(r => r.to === 나 && r.from.산다).map(r => ({
      글자: r.from.글자 + '(' + r.from.십신 + ')', 관계: r.관계,
      결과: r.관계 === '생' ? '도움' : (r.통관 ? '받음' : r.제복 ? '잡힘' : '닿음'),   // 일간은 힘차이를 안 본다
      셋째: r.셋째.map(c => c.글자 + '(' + c.십신 + ')'), 잡는: r.잡는.map(c => c.글자 + '(' + c.십신 + ')'),
      말: r.관계 === '생' ? r.from.글자 + '이 나를 생한다'
        : r.통관 ? r.from.글자 + '이 나를 극하지만 ' + r.셋째.map(c => c.글자).join('·') + '이 받아 넘긴다'
        : r.제복 ? r.from.글자 + '이 나를 극하지만 ' + r.잡는.map(c => c.글자).join('·') + '이 잡는다'
        : r.from.글자 + '이 나를 바로 친다',
    }));
    // 통관 목록 — 사람이 읽을 한 줄씩
    const 통관 = 쌍.filter(r => r.통관 && r.from.산다 && r.to.산다 && !r.to.지지).map(r =>
      r.from.글자 + '(' + r.from.십신 + ')→' + r.셋째.map(c => c.글자).join('·') + '→' + r.to.글자 + '(' + r.to.십신 + ')');
    // 제복 목록 — 극이 잡혀서 못 닿는 자리
    const 제복 = 쌍.filter(r => r.제복 && !r.통관 && r.from.산다 && r.to.산다 && !r.from.일간 && !r.to.지지).map(r =>   // 일간은 주체라 잡히지 않는다
      r.잡는.map(c => c.글자).join('·') + '이 ' + r.from.글자 + '(' + r.from.십신 + ')을 잡아 ' + r.to.글자 + '(' + r.to.십신 + ')에 못 닿는다');
    // 힘 차이로 못 치는 자리 — 사람이 읽을 한 줄씩
    const 힘차이 = 쌍.filter(r => r.힘차이 && !r.통관 && !r.제복 && r.from.산다 && r.to.산다 && !r.to.지지).map(r =>
      r.from.글자 + '(' + r.from.십신 + ')이 ' + r.to.글자 + '(' + r.to.십신 + ')을 치기엔 힘이 모자란다(' + r.from.힘 + ' 대 ' + r.to.힘 + ')');
    // 끊긴 생 — a 가 b 를 생하는데 a 를 막힘 없이 극하는 살아 있는 글자가 있다
    const 끊김 = 쌍.filter(r => r.관계 === '생' && r.from.산다 && r.to.산다 && !r.to.지지).filter(r =>
      쌍.some(q => q.관계 === '극' && q.to === r.from && q.from.산다 && !q.막힘)).map(r =>
      r.from.글자 + '→' + r.to.글자 + ' 생이 약하다(' + 쌍.filter(q => q.관계 === '극' && q.to === r.from && q.from.산다 && !q.막힘).map(q => q.from.글자).join('·') + '이 ' + r.from.글자 + '을 친다)');
    return { 글자, 궁, 지장간, 쌍, 닿음, 통관, 제복, 힘차이, 끊김, 격, 운충: 글자.운충 || [] };
  }

  /** 사람이 읽을 요약 — 한 줄씩. */
  function 줄(t) {
    const out = [];
    if (t.격) out.push('격: ' + t.격.이름 + '격' + (t.격.상신 ? ' · 상신 ' + t.격.상신 : ''));
    t.글자.forEach(g => { if (!g.일간) out.push(g.이름 + ' ' + g.글자 + '(' + g.십신 + ') 힘 ' + 힘말(g.힘) + (g.합거 ? ' · 합거(' + g.합거 + ')' : '') + (g.산다 ? '' : ' · 죽어 있음')); });
    t.닿음.forEach(x => out.push('일간: ' + x.말 + ' → ' + x.결과));
    t.통관.forEach(x => out.push('통관: ' + x));
    t.제복.forEach(x => out.push('제복: ' + x));
    (t.힘차이 || []).forEach(x => out.push('힘차이: ' + x));
    t.끊김.forEach(x => out.push('끊김: ' + x));
    return out;
  }

  // 글자 이름 「임수(壬)」(34조) 와 받침 조사 — 달력·이야기·원국 밴드가 같은 말을 쓴다.
  const 오행자 = ['목', '화', '토', '금', '수'];
  const 이름 = (stem) => E.STEMS_KO[stem] + 오행자[E.STEM_ELEM[stem]] + '(' + E.STEMS[stem] + ')';
  const 지이름 = (b) => E.BRANCHES_KO[b] + 오행자[E.BRANCH_ELEM[b]] + '(' + E.BRANCHES[b] + ')';   // 묘목(卯)
  const 받침 = (s) => { const t = String(s).replace(/\([^)]*\)\s*$/, ''); const c = t.slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && ((c - 0xAC00) % 28) !== 0; };
  const 조 = (s, 있, 없) => s + (받침(s) ? 있 : 없);
  const 이가 = (s) => 조(s, '이', '가'), 을를 = (s) => 조(s, '을', '를'), 은는 = (s) => 조(s, '은', '는'), 과와 = (s) => 조(s, '과', '와');
  const 묶어 = (arr) => arr.length === 1 ? arr[0] : arr.slice(0, -1).map(x => 과와(x)).join(' ') + ' ' + arr[arr.length - 1];

  /** 오늘 온 글자 하나가 내 표를 어떻게 건드리나 — 달력 점수와 이야기 「나는 …날」이 같이 쓴다. */
  // 앞운들 = 대운·올해·이달처럼 오늘보다 큰 층(28·32조 — 묶는 글자는 어느 층이든 센다). 오늘 글자는 그 위에 얹어 잰다.
  // 09-14 사장님 「난 지금 임수가 정화에 묶여 있잖아」 — 이달 丁이 壬을 묶은 상태를 하루 줄이 몰랐다.
  function 오늘길(result, stem, branch, 앞운들) {
    if (!result || !result.pillars) return null;
    const 앞 = (앞운들 || []).filter(u => u && u.stem != null);
    const 원 = 표(result.pillars, 앞, result);                       // 오늘 오기 전 상태(대운·올해·이달까지 얹은 것)
    const t = 표(result.pillars, 앞.concat([{ stem, branch, name: '오늘' }]), result);
    const 운 = t.글자.filter(g => g.운).slice(-1)[0], 나 = t.글자.find(g => g.일간);
    if (!운) return null;
    const r = t.쌍.find(x => x.from === 운 && x.to === 나);
    const 묶임 = t.글자.filter(g => !g.일간 && g !== 운 && g.합거 === '오늘');   // 원국이든 앞 층 운이든 오늘이 묶은 것
    const 전 = 원.닿음.filter(x => x.결과 === '받음' || x.결과 === '잡힘').map(x => x.글자);
    const 후 = t.닿음.filter(x => x.결과 === '받음' || x.결과 === '잡힘').map(x => x.글자);
    const 아직 = t.닿음.map(x => x.글자);
    const 끊 = 전.filter(x => !후.includes(x) && 아직.includes(x)).map(x => E.STEMS.indexOf(x.replace(/\(.*\)/, '')));
    const 결과 = !운.산다 ? '이름만' : r ? (r.관계 === '생' ? '도움' : r.통관 ? '받음' : r.제복 ? '잡힘' : '닿음') : '무관';
    // 운 글자가 원국의 다른 글자를 치거나 채우는 것 · 내가 운 글자를 내보내거나 쥐는 것 · 같은 오행 — 표에 다 있는데 말이 없던 자리(09-14 「표가 할 말이 왜 없는데?」)
    const 침 = 운.산다 ? t.쌍.filter(x => x.from === 운 && x.관계 === '극' && !x.to.일간 && x.to.산다) : [];
    const 채움 = 운.산다 ? t.쌍.filter(x => x.from === 운 && x.관계 === '생' && !x.to.일간 && x.to.산다) : [];
    const 내가 = t.쌍.find(x => x.from === 나 && x.to === 운);
    const 나감 = 내가 && 내가.관계 === '생' ? 운 : null, 쥠 = 내가 && 내가.관계 === '극' ? 운 : null;
    const 같음 = 운.오행 === 나.오행 ? 운 : null;
    return { 운, 결과, 셋째: r ? r.셋째 : [], 잡는: r ? r.잡는 : [], 묶임, 끊, 침, 채움, 나감, 쥠, 같음 };
  }
  /** 「나는 …날」 — 이야기 하루 줄의 내 쪽. 반드시 「…날」로 끝난다(뒤에 「(십신)이거든요」가 붙는다). 없으면 null. */
  function 오늘말(L) {
    if (!L || !L.운) return null;
    const N = (g) => 이름(g.stem);
    // 전문용어로(사장님 09-14 「싹다 생극제화 전문용어로 가」) — 극·생·통관·제복·합거·설기
    if (L.끊.length) return 이가(N(L.운)) + ' ' + 을를(묶어(L.묶임.map(N))) + ' 합거해서 ' + 이가(묶어(L.끊.map(s => 이름(s)))) + ' 나를 바로 극하는 날';
    if (L.묶임.length) return 이가(N(L.운)) + ' ' + 을를(묶어(L.묶임.map(N))) + ' 합거하는 날';
    if (L.결과 === '닿음') return 이가(N(L.운)) + ' 나를 바로 극하는 날';
    if (L.결과 === '받음') return 이가(N(L.운)) + ' 나를 극하는데 ' + 이가(묶어(L.셋째.map(N))) + ' 통관하는 날';
    if (L.결과 === '잡힘') return 이가(N(L.운)) + ' 나를 극하는데 ' + 이가(묶어(L.잡는.map(N))) + ' 제복하는 날';
    if (L.결과 === '도움') return 이가(N(L.운)) + ' 나를 생하는 날';
    if (L.침 && L.침.length) { const x = L.침[0];
      if (x.통관) return 이가(N(L.운)) + ' ' + 을를(N(x.to)) + ' 극하는데 ' + 이가(묶어(x.셋째.map(N))) + ' 통관하는 날';
      if (x.제복) return 이가(N(L.운)) + ' ' + 을를(N(x.to)) + ' 극하려는데 ' + 이가(묶어(x.잡는.map(N))) + ' 제복하는 날';
      return 이가(N(L.운)) + ' ' + 을를(N(x.to)) + ' 극하는 날'; }
    if (L.채움 && L.채움.length) return 이가(N(L.운)) + ' ' + 을를(N(L.채움[0].to)) + ' 생하는 날';
    if (L.같음) return '나와 같은 오행 ' + 이가(N(L.운)) + ' 하나 더 오는 날';
    if (L.나감) return '내가 ' + 을를(N(L.운)) + ' 생하는 날, 설기되는 날';
    if (L.쥠) return '내가 ' + 을를(N(L.운)) + ' 극하는 날';
    if (L.결과 === '이름만') return 이가(N(L.운)) + ' 오지만 무근인 날';
    return null;
  }

  /** 층마다 격을 다시 낸다(35조, 변격). 원격 이름은 gyeokguk/typecard 가 낸 것을 받는다.
   *  격의 주인 천간이 이 층에서 묶여 있으면 — 남은 살아 있는 천간(원국·운) 중 월지 지장간과 같은 오행으로 투간한 것이 격을 잡는다(본기>중기>여기).
   *  그런 명령자가 없고 격을 잡던 천간이 합거됐으면 월령 지장간의 같은 오행 · 다른 음양 글자가 발동한다(71조, 운 층만 — 발동of). 결과의 발동에 남긴다.
   *  새 주인을 막힘 없이 극하는 살아 있는 글자가 있으면 그 격은 깨진다. 길흉 말은 여기서 안 붙인다 — 「깨짐」 사실만. */
  function 층격(pillars, 운들, 원격, R, 계절지지) {
    if (!pillars || !원격) return null;
    운들 = 운들 || [];
    const t = 표(pillars, 운들, null, 계절지지);
    const 나 = t.글자.find(g => g.일간);
    // 이 층의 상태를 자평진전 격표에 그대로 넘긴다(사장님 「인수격이 경금 재성을 보았을 때를 보면 되잖아」) — 성패는 격표가 낸다.
    const 층 = { 합거: {}, 운: [], 글자: t.글자 };   // 글자: 격표가 천간을 이 표에서만 읽는다(40조, 따로 세지 않는다)
    t.글자.forEach(g => { if (!g.운 && !g.일간 && g.합거) 층.합거[g.key] = true; });
    const 운글자 = t.글자.filter(g => g.운);                       // 글자들() 이 운들 순서대로 밀어 넣는다
    운글자.forEach((g, i) => { if (g.산다) 층.운.push({ stem: g.stem, branch: 운들[i] ? 운들[i].branch : null, name: g.이름 }); });
    // 33조가 격표 위에 선다 — 격의 주인을 막힘 없이 극하는 살아 있는 글자가 있으면 격표가 뭐라 하든 깨진 것이다
    // (09-14 사장님: 정미 대운에 庚이 甲을 바로 치니 인수격이 재에 깨졌다. 격표의 힘 비교(인 1.24 > 재 0.82)로는 안 걸렸다).
    const 깨는것 = (주인) => 주인 ? t.쌍.filter(r => r.to === 주인 && r.관계 === '극' && r.from.산다 && !r.막힘 && !r.from.일간).map(r => r.from) : [];
    const 성패 = (격, 주인) => {
      let j = null;
      // 71조 — 발동한 지장간 글자는 이 층의 명령자다. 격표에도 살아 있는 글자로 넘긴다(표의 글자 목록은 안 건드린다).
      const 층j = 주인 && 주인.발동 ? Object.assign({}, 층, { 글자: 층.글자.concat([주인]) }) : 층;
      try { const Gk = global.ChaeksaGyeok; j = (R && Gk && Gk.judge && 격) ? Gk.judge(R, 격, 층j) : null; } catch (e) { j = null; }
      let 침 = 깨는것(주인);
      // 51조 상관패인(사장님 09-14 「2 동의」) — 상관격에서 뿌리 있는(0.5 이상) 인성이 상관을 극하는 것은 성격 조건(傷官佩印而傷官旺 印有根)이라 33조 일반 극으로 세지 않는다.
      // 그 인성이 재에 다치는지(재극인)는 격표 「패인인데 재가 드러난다」와 인성 쪽 33조가 따로 본다.
      if (격 === '상관' && 주인) 침 = 침.filter(c => !((c.십신 === '정인' || c.십신 === '편인') && c.힘 >= 0.5));
      // 71조 ④(09-24) — 인성을 가진 정관은 식상의 극을 받지 않는다(관 → 인 → 나, 인성이 식상을 먼저 막는다 · 31조와 같은 길).
      //   사장님 「인성을 가진 정관이라 경금식상의 극을 인정하지 못하겠는데?」. 범위는 사례 모양 — 발동한 정관일 때만.
      //   09-24 고침(사장님 「인성 힘 1 이 식상 힘 1.23 을 0.23 으로 깎으니 0.23 의 식상이 관성을 칠 수 없다고 해야 정리가 될듯」) —
      //   예외로 빼지 않고 셈으로: 식상 힘에서 그 식상을 극하는 살아 있는 인성 힘을 뺀다(남은 힘). 36조 ① 로 관 쪽 같은 오행 합산이 남은 힘의 두 배 이상이면 못 친다.
      if (격 === '정관' && 주인 && 주인.발동) {
        const 극하나 = (a, b) => (E.STEM_ELEM[a] + 2) % 5 === E.STEM_ELEM[b];      // a 가 b 를 극하나(오행)
        const 관합 = (주인.힘 || 0) + t.글자.filter(g => !g.일간 && g.산다 && E.STEM_ELEM[g.stem] === E.STEM_ELEM[주인.stem]).reduce((a, g) => a + (g.힘 || 0), 0);
        침 = 침.filter(c => {
          if (!(c.십신 === '식신' || c.십신 === '상관')) return true;
          const 깎 = t.글자.filter(g => !g.일간 && g.산다 && (g.십신 === '정인' || g.십신 === '편인') && 극하나(g.stem, c.stem)).reduce((a, g) => a + (g.힘 || 0), 0);
          const 남은 = Math.max(0, (c.힘 || 0) - 깎);
          c.남은힘 = Math.round(남은 * 100) / 100;
          return !(남은 <= 0 || 관합 >= 2 * 남은);
        });
      }
      if (침.length && (!j || j.판정 !== '깨졌다')) {
        const 십 = 주인.십신, 치는십 = 침[0].십신;
        const 말 = (십 === '정인' || 십 === '편인') && (치는십 === '정재' || 치는십 === '편재')
          ? 이가(이름(침[0].stem) + ' ' + 치는십) + ' 격신 ' + 을를(이름(주인.stem) + ' ' + 십) + ' 바로 극해요. 재극인이에요. 막아 줄 글자가 없어요'
          : 이가(이름(침[0].stem) + ' ' + 치는십) + ' 격신 ' + 을를(이름(주인.stem) + ' ' + 십) + ' 바로 극해요. 막아 줄 글자가 없어요';   // 화면(원국 탭)에 그대로 나가는 말 — 한자만 따로 쓰지 않는다
        j = Object.assign({}, j || {}, { 격, 판정: '깨졌다', ok: 0, 격표판정: j ? j.판정 : null, 근거: Object.assign({}, (j && j.근거) || {}, { 깨졌다: [말] }) });
      }
      return j;
    };
    // 39조 취격 — 원국이든 층이든 같은 순서로 낸다: ① 월지 낀 국 + 그 오행 투출 ② 월령 본기 투출 ③ 중기 ④ 여기 ⑤ 본기. 투출 = 같은 오행(38조), 살아 있는 것만.
    const 고른 = 취격(pillars, t, 나);
    let 주인 = 고른.주인, 지금격 = 고른.격, 근거 = 고른.근거, 발동 = null;
    // 71조(09-24) 합거는 변질 — 운 층에서만. 35조 명령자(취격 ①~④)가 없을 때, 격을 잡던 천간이 이 층에서 합거됐으면 월령 지장간의 같은 오행 · 다른 음양 글자가 발동해 격을 잡는다.
    if (!주인 && 운들.length) {
      let a = null;
      try { a = 발동of(pillars, 운들, t, 계절지지); } catch (e) { a = null; }
      if (a) {
        주인 = a.글자; 주인.발동 = true; 주인.묶인 = a.묶인; 지금격 = 주인.십신;
        발동 = { 글자: 주인.글자, stem: 주인.stem, key: 주인.key, 자리: '월령 지장간', 조: 71, 묶인: a.묶인 };
        근거 = '격의 주인 ' + a.묶인.글자 + ' 합거 — 월령 지장간 ' + 주인.글자 + ' 발동';
      }
    }
    const 변질 = !!(원격 && 지금격 && 지금격 !== 원격);
    const 묶인주인 = t.글자.find(g => !g.일간 && !g.운 && g.십신 === 원격 && !g.산다) || null;
    // 역학(09-24) — 길흉 딱지 대신 「무엇이 무엇으로 바뀌었나」. 71조 ⑤ 「살이 묶여 관이 맑아진다」는 걷었다(사장님: 격의 글자가 묶이면 관이 바뀐 것).
    const 변화 = [];
    if (발동) 변화.push({ 무엇: '격의 글자', 전: 발동.묶인.이름 + '(' + 발동.묶인.글자 + ') ' + (발동.묶인.십신 || ''), 후: 주인.이름 + '(' + 주인.글자 + ') ' + 주인.십신, 까닭: '합거 — 월령 속 글자가 대신 나섬(71조)' });
    else if (변질) 변화.push({ 무엇: '격', 전: 원격, 후: 지금격, 까닭: 근거 || '' });
    else if (!지금격 && 원격) 변화.push({ 무엇: '격', 전: 원격, 후: '잡는 글자 없음', 까닭: 근거 || '' });
    return { 원격, 지금격, 변질, 주인, 근거, 성패: 지금격 ? 성패(지금격, 주인) : null, 묶인주인, 발동, 변화 };
  }

  /** 71조(09-24) — 합거는 죽음이 아니라 변질이다. 층격이 이 층에서 명령자(35조)를 못 찾았을 때만 부른다.
   *  바로 아래 층(운들에서 마지막 하나를 뺀 층, 없으면 원국)에서 격을 잡던 글자를 보고:
   *   ① 천간이고 이 층에서 합거됐으면 → 원국 월지(월령) 지장간 가운데 그 글자와 같은 오행 · 다른 음양 글자가 발동한다(卯월 甲 → 乙).
   *   ② 이미 발동한 지장간 글자면 → 이 층에서도 그대로 간다. 천간이 아니라서 천간과의 합거를 안 받는다(「시간의 경금과 합거를 인정하지 않고 을목의 행방을 따진다」).
   *  합화(43조)는 합거가 아니라 손대지 않는다(열어 둠). 힘이 빠져 죽은 글자(무근 · 50조)도 71조가 아니다.
   *  월지가 원국 삼합국에 먹힌 자리면 그 지장간은 표(지장간 목록)에 없다 — 국은 명령을 잃은 군사(41조)라 발동하지 않는다.
   *  돌려주는 것: { 글자: 이 층 표(t.지장간)의 발동 글자, 묶인: { 글자, stem, key, 이름, 합거 } } 또는 null. */
  function 발동of(pillars, 운들, t, 계절지지) {
    if (!운들 || !운들.length) return null;
    if (!t.글자.some(g => !g.일간 && g.합거)) return null;   // 묶인 글자가 없으면 발동도 없다(아래 층의 발동도 묶인 글자를 남긴다)
    // 아래 층도 이 층과 같은 계절(43조 이달 지지)로 잰다. 계절을 안 받고 이달이 맨 위 층이면, 아래 층은 원국 월지로 재져 이 층에서 합화한 甲을 합거로 봤다(09-24 반박: 己巳 · 乙卯 · 戊戌 직접 호출에서 합화인데 乙 발동).
    if (계절지지 == null) { const 이달 = 운들.find(u => u && u.name === '이달' && u.branch != null); if (이달) 계절지지 = 이달.branch; }
    const 아래운 = 운들.slice(0, -1);
    const 아래t = 표(pillars, 아래운, null, 계절지지);
    const 아래고른 = 취격(pillars, 아래t, 아래t.글자.find(g => g.일간));
    if (!아래고른.주인) {
      const 아래발동 = 발동of(pillars, 아래운, 아래t, 계절지지);
      if (!아래발동) return null;
      const 뿌리 = t.글자.find(x => x.key === 아래발동.묶인.key);   // 처음 묶인 천간이 이 층에서도 합거여야 이어진다(합화면 71조를 안 건다 — 43조 열어 둠)
      if (!뿌리 || !뿌리.합거) return null;
      const g = (t.지장간 || []).find(x => x.key === 아래발동.글자.key);
      return g ? { 글자: g, 묶인: 아래발동.묶인 } : null;
    }
    const 전 = 아래고른.주인;
    const 지금 = t.글자.find(x => x.key === 전.key);
    if (!지금 || 지금.일간 || !지금.합거) return null;
    const st = 지금.화stem != null ? 지금.화stem : 지금.stem;
    const 지장 = (E.HIDDEN[pillars.month.branch] || []).map(h => (typeof h === 'number' ? h : h[0]));
    const i = 지장.findIndex(h => E.STEM_ELEM[h] === E.STEM_ELEM[st] && E.STEM_YANG[h] !== E.STEM_YANG[st]);
    // 범위는 사례의 모양까지(법전 머리) — 사례는 卯의 여기 甲이 묶이고 본기 乙이 발동. 발동 글자가 월령 본기(지장 맨 앞)일 때만 건다.
    // 본기 자신이 묶여 여기 · 중기가 나서는 꼴은 둘째 사례가 올 때까지 안 건다(09-24 회귀 반박 지적).
    if (i !== 0) return null;
    const g = (t.지장간 || []).find(x => x.key === 'monthH' + i);
    if (!g) return null;
    return { 글자: g, 묶인: { 글자: 지금.글자, stem: 지금.stem, key: 지금.key, 이름: 지금.이름, 합거: 지금.합거, 십신: 지금.십신 } };
  }

  /** 취격(39조). t = 표(), 나 = 일간 글자. 후보 순서대로 살아 있는 투출을 찾는다. */
  function 취격(pillars, t, 나) {
    const mb = pillars.month.branch;
    const 지장 = (E.HIDDEN[mb] || []).map(h => (typeof h === 'number' ? h : h[0]));
    const 산것 = (오행) => t.글자.find(g => !g.일간 && g.산다 && g.오행 === 오행 && g.오행 !== 나.오행);
    // ① 월지 낀 국 + 그 오행 투출 — 국을 지으면 국이 최우선(사장님 09-14 「국을 지으면 국이 최우선인 건 알지?」)
    let g = null;
    try {
      const 자리 = [['year', E.NATAL_WEIGHT.yearBranch], ['month', E.NATAL_WEIGHT.monthBranch], ['day', E.NATAL_WEIGHT.dayBranch], ['hour', E.NATAL_WEIGHT.hourBranch]]
        .filter(([k]) => pillars[k]).map(([k, w]) => [pillars[k].branch, w]);
      const 국 = (E.samhapOf(자리) || []).find(x => x.글자.indexOf(mb) >= 0);
      if (국 && 국.elem !== 나.오행) { g = 산것(국.elem); if (g) return { 격: g.십신, 주인: g, 근거: '월지가 낀 삼합국의 오행이 투출' }; }
    } catch (e) {}
    // ② 본기 투출
    const 본기오행 = E.STEM_ELEM[지장[0]];
    g = 본기오행 !== 나.오행 ? 산것(본기오행) : null;
    if (g) return { 격: g.십신, 주인: g, 근거: '월령 본기 ' + E.STEMS[지장[0]] + '의 오행이 투출' };
    // ③④ 중기·여기 투출
    for (let i = 1; i < 지장.length; i++) { const o = E.STEM_ELEM[지장[i]]; if (o === 나.오행) continue; g = 산것(o); if (g) return { 격: g.십신, 주인: g, 근거: (i === 1 ? '중기 ' : '여기 ') + E.STEMS[지장[i]] + '의 오행이 투출' }; }
    // ⑤ 아무것도 안 떴으면 본기(주인 없음 — 지장간이 격)
    if (본기오행 !== 나.오행) return { 격: E.TEN_GODS[E.tenGod(나.stem, 지장[0])], 주인: null, 근거: '투출이 없어 월령 본기' };
    return { 격: null, 주인: null, 근거: '격을 잡을 글자가 없다(본기가 일간과 같은 오행)' };
  }

  /** 눈금 — 수치는 늘 「값 (최소~최대)」로 낸다(사장님 09-14 「수치들의 최소 최대를 같이 적어주는 건 어떤데」). 문턱은 여기서 새로 정하지 않는다. */
  const 눈금 = {
    힘: { 최소: 0, 최대: 2.0, 최대국: 4.5, 문턱: { 산다: 0.5 }, 말: '뿌리 하나 0~2.0 · 국을 부리면 4.5까지 · 0.5부터 산다' },
    비율: { 최소: 0, 최대: null, 문턱: { 못침: 2 }, 말: '맞는 쪽 합산 ÷ 치는 쪽 · 2배부터 못 친다' },
  };
  const 힘말 = (v) => v == null ? '' : v + ' (0~2.0' + (v > 2.0 ? ', 국 4.5' : '') + ')';
  /** 71조 발동을 화면 말로 — 「천간의 갑목(甲)이 묶여 월령 속 을목(乙)이 대신 나서요. 정관격으로 봐요.」 격 = 층격() 결과(층.격). 발동이 없으면 null.
   *  opts.짧게 — 묶인 글자를 앞 문장이 이미 말했을 때 「월령 속 을목(乙)이 대신 나서요. 정관격으로 봐요.」 */
  function 발동말(격, opts) {
    if (!격 || !격.발동 || !격.지금격 || !격.발동.묶인) return null;
    const 앞 = opts && opts.짧게 ? '' : '천간의 ' + 이가(이름(격.발동.묶인.stem)) + ' 묶여 ';
    return 앞 + '월령 속 ' + 이가(이름(격.발동.stem)) + ' 대신 나서요. ' + 격.지금격 + '격으로 봐요.';
  }
  global.ChaeksaSaenggeuk = { 표, 줄, 글자들, 이름, 지이름, 이가, 을를, 은는, 묶어, 오늘길, 오늘말, 층격, 취격, 발동of, 발동말, 눈금, 힘말 };
})(window);
