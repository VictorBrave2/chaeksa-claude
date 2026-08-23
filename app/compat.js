/* 책사 궁합 모듈 v1 — 두 원국의 관계 (규칙 기반) */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;
  const STEM_HAP = { 0:5, 5:0, 1:6, 6:1, 2:7, 7:2, 3:8, 8:3, 4:9, 9:4 };
  const YUKHAP = { 0:1, 1:0, 2:11, 11:2, 3:10, 10:3, 4:9, 9:4, 5:8, 8:5, 6:7, 7:6 };
  const SAMHAP = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
  const HYEONG = [[2,5,8],[1,10,7],[0,3]]; // 寅巳申, 丑戌未, 子卯 (+자형)
  const SELF_HYEONG = [4,6,9,11];
  const HAE = { 0:7, 7:0, 1:6, 6:1, 2:5, 5:2, 3:4, 4:3, 8:11, 11:8, 9:10, 10:9 };
  const PA = { 0:9, 9:0, 1:4, 4:1, 2:11, 11:2, 3:6, 6:3, 5:8, 8:5, 7:10, 10:7 };

  function stemRel(a, b) {
    if (STEM_HAP[a] === b) return { key:'합', s:3, text:'두 사람의 일간이 합(合)을 이룹니다. 처음부터 끌리고 서로를 보완하는 조합입니다.' };
    const ea = E.STEM_ELEM[a], eb = E.STEM_ELEM[b];
    if (ea === eb) return { key:'비화', s:1, text:'같은 기운의 일간. 말이 잘 통하고 편하지만, 같은 단점을 나눠 갖기도 합니다.' };
    if ((eb - ea + 5) % 5 === 1) return { key:'내가생', s:2, text:'내가 상대를 살리는(生) 관계. 내가 더 많이 주게 되고, 상대는 나를 통해 커집니다.' };
    if ((ea - eb + 5) % 5 === 1) return { key:'상대가생', s:2, text:'상대가 나를 살리는(生) 관계. 상대에게 받는 게 많고, 나는 그 안에서 안정됩니다.' };
    if ((eb - ea + 5) % 5 === 2) return { key:'내가극', s:0, text:'내가 상대를 다루는(剋) 관계. 주도권은 내게 있지만, 상대가 답답해하지 않게 여백이 필요합니다.' };
    return { key:'상대가극', s:-1, text:'상대가 나를 다루는(剋) 관계. 상대가 리드하고 나는 맞춰가는 쪽. 존중받는 느낌이 있으면 오래 갑니다.' };
  }
  function branchRel(a, b) {
    const out = [];
    if (a === b) out.push({ key:'동일', s:1, text:'일지가 같아 생활 리듬과 취향이 닮았습니다.' });
    if (YUKHAP[a] === b) out.push({ key:'육합', s:3, text:'일지 육합. 함께 있으면 편안하고 오래 붙어 있는 조합입니다.' });
    if (SAMHAP.some(g => g.includes(a) && g.includes(b)) && a !== b) out.push({ key:'삼합', s:2, text:'일지 삼합. 같은 목표를 향해 힘을 모으기 좋습니다.' });
    if ((b - a + 12) % 12 === 6) out.push({ key:'충', s:-3, text:'일지 충. 자극과 변화가 많고 다툼도 잦을 수 있습니다. 거리를 적절히 두면 오히려 서로를 성장시킵니다.' });
    if (HYEONG.some(g => g.includes(a) && g.includes(b) && a !== b) || (a === b && SELF_HYEONG.includes(a))) out.push({ key:'형', s:-2, text:'일지 형. 서로 바로잡으려는 마음이 상처가 되기 쉬워요. 지적보다 질문으로 대화하세요.' });
    if (HAE[a] === b) out.push({ key:'해', s:-1, text:'일지 해. 사소한 오해가 쌓이기 쉬우니 바로바로 풀어야 합니다.' });
    if (PA[a] === b) out.push({ key:'파', s:-1, text:'일지 파. 약속과 계획이 틀어지는 일이 잦을 수 있습니다. 느슨한 약속이 답입니다.' });
    return out;
  }

  function analyze(me, you) {
    const sr = stemRel(me.pillars.day.stem, you.pillars.day.stem);
    const br = branchRel(me.pillars.day.branch, you.pillars.day.branch);
    let s = sr.s + br.reduce((t, r) => t + r.s, 0);
    const notes = [];
    // 오행 보완
    const fill = me.analysis.missing.filter(e => you.analysis.elemCount[E.ELEM.indexOf(e)] > 0);
    if (fill.length) { s += fill.length; notes.push(`내게 없는 ${fill.join('·')} 기운을 상대가 채워줍니다.`); }
    const fill2 = you.analysis.missing.filter(e => me.analysis.elemCount[E.ELEM.indexOf(e)] > 0);
    if (fill2.length) { s += fill2.length * 0.5; notes.push(`상대에게 없는 ${fill2.join('·')} 기운을 내가 채워줍니다.`); }
    // 용신
    const yourElem = E.ELEM[E.STEM_ELEM[you.pillars.day.stem]];
    if (me.analysis.yongCandidates.includes(yourElem)) { s += 2; notes.push(`상대의 ${yourElem} 기운은 내 사주가 반기는 기운입니다.`); }
    const myElem = E.ELEM[E.STEM_ELEM[me.pillars.day.stem]];
    if (you.analysis.yongCandidates.includes(myElem)) { s += 1; notes.push(`내 ${myElem} 기운은 상대에게 힘이 됩니다.`); }
    // 상대 일간이 내게 어떤 십신인가
    const god = E.TEN_GODS[E.tenGod(me.pillars.day.stem, you.pillars.day.stem)];
    const GOD_TXT = { 비견:'동료·친구 같은 사람', 겁재:'경쟁자이자 자극제', 식신:'나를 즐겁게 하는 사람', 상관:'나를 표현하게 만드는 사람', 편재:'활력과 기회를 주는 사람', 정재:'안정과 실속을 주는 사람', 편관:'나를 긴장시키고 단련하는 사람', 정관:'나를 바로 세우는 사람', 편인:'생각을 깊게 만드는 사람', 정인:'나를 돌봐주는 사람' };
    const pct = Math.max(20, Math.min(98, Math.round(60 + s * 5)));
    return { score: pct, stemRel: sr, branchRels: br, notes, god, godText: GOD_TXT[god] };
  }

  global.ChaeksaCompat = { analyze };
})(window);
