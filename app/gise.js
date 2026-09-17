/* 기세(氣勢) — 원국에서 어느 기운이 세를 잡았나 (법전 66조 · 채록 docs/55 열둘, 2026-09-18)
 *
 * 사장님 09-18 「적천수 관점이란 것은 적어도 기세를 구분 지을 수 있어야 하는 것」 · 「원국의 기세를 논하자는 것이니까」 · 「강약을 써도 되지 않을까」
 *
 * 새 상수를 만들지 않는다. 재료는 엔진에 이미 있는 강약의 재료 그대로다 —
 *   천간의 힘 = E.stemPower(통근 · 국) · 지지의 힘 = 자리 무게 E.NATAL_WEIGHT · 국 = E.samhapOf.
 * 원문이 기세를 가르는 잣대 넷만 옮긴다(滴天髓闡微):
 *   月令 「气象得令者吉」                     → 당령(철을 얻은 기운)
 *   衰旺 「只要四柱有根」「干多不如根重」       → 뿌리 없는 하늘 글자는 세력으로 안 친다(順逆 실례 「天干枯木无根，置之不论」)
 *   衆寡 「强众而敌寡 … 强寡而敌众」「须分日主四柱两端而论」 → 무리(글자 수)와 세(힘)를 따로 내고, 아이 편과 맞은편으로 가른다
 *   順逆 「权在一人」「二人同心」「不可逆者，其气势而已矣」 → 선 기운이 하나면 일인, 서로 낳는 둘이면 동심
 * 길흉을 매기지 않는다(64 · 65조). 어떻게 되어 있는지만 낸다.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;
  if (!E) return;
  const 오행자 = ['목', '화', '토', '금', '수'];
  const 낳는다 = (a, b) => (a + 1) % 5 === b;
  const 둥 = (x) => Math.round(x * 100) / 100;

  function 기세(R) {
    const p = R && R.pillars; if (!p || !p.month || !p.day) return null;
    const 키 = ['year', 'month', 'day', 'hour'].filter(k => p[k]);
    const 터 = 키.map(k => [p[k].branch, E.NATAL_WEIGHT[k + 'Branch']]);
    const 국들 = E.samhapOf(터) || [];
    const 국오행 = {}; 국들.forEach(g => g.글자.forEach(b => { 국오행[b] = g.elem; }));   // 국에 든 자리는 국의 기운으로 센다
    const 칸 = [0, 1, 2, 3, 4].map(o => ({ 오행: o, 이름: 오행자[o], 무리: 0, 세: 0, 하늘: [], 땅: [], 뜬: [] }));
    키.forEach(k => {
      const st = p[k].stem, o = E.STEM_ELEM[st], 힘 = 둥(E.stemPower(st, 터, 국들));
      // 뿌리 = 지지 속에 같은 기운이 들어 있나(衰旺 「长生禄旺，根之重者也；墓库余气，根之轻者也」). 남의 국에 든 자리는 뿌리로 안 친다
      // (順逆 실례 癸酉 甲子 庚辰 甲申 — 辰 이 수국에 들자 「天干枯木无根，置之不论」).
      const 뿌리 = 키.some(j => { const b = p[j].branch; if (국오행[b] != null && 국오행[b] !== o) return false;
        return (E.HIDDEN[b] || []).some(h => E.STEM_ELEM[typeof h === 'number' ? h : h[0]] === o); });
      if (뿌리 && 힘 > 0) { 칸[o].하늘.push({ stem: st, 자리: k, 힘 }); 칸[o].무리++; 칸[o].세 += 힘; }
      else 칸[o].뜬.push({ stem: st, 자리: k });                                          // 뿌리 없이 뜬 글자 — 置之不论
      const b = p[k].branch, bo = 국오행[b] != null ? 국오행[b] : E.BRANCH_ELEM[b], w = E.NATAL_WEIGHT[k + 'Branch'];
      칸[bo].땅.push({ branch: b, 자리: k, 무게: w, 국: 국오행[b] != null }); 칸[bo].무리++; 칸[bo].세 += w;
    });
    칸.forEach(c => { c.세 = 둥(c.세); });
    const 당령 = E.BRANCH_ELEM[p.month.branch];
    const 선 = 칸.filter(c => c.무리 > 0).sort((a, b) => b.세 - a.세);
    const 나 = E.STEM_ELEM[p.day.stem];
    // 衆寡 — 편을 일간 기준으로 못 박지 않는다(원문은 「日主之党」에 식상을 넣기도 한다 — 戊辰 乙丑 戊戌 辛酉). 으뜸 기운과, 그것을 치는 기운만 마주 세운다.
    const 맞섬 = 선[0] ? 칸[(선[0].오행 + 3) % 5] : null;
    let 꼴 = '여럿', 꼴말 = '';
    if (선.length === 1) { 꼴 = '일인'; 꼴말 = 선[0].이름 + ' 한 기운이 다 잡았다(权在一人)'; }
    else if (선.length === 2 && (낳는다(선[0].오행, 선[1].오행) || 낳는다(선[1].오행, 선[0].오행))) {
      꼴 = '동심'; const [어, 자] = 낳는다(선[0].오행, 선[1].오행) ? [선[0], 선[1]] : [선[1], 선[0]];
      꼴말 = 어.이름 + ' · ' + 자.이름 + ' 두 기운이 서로 낳으며 한편이다(二人同心)';
    }
    return {
      당령: { 오행: 당령, 이름: 오행자[당령] }, 칸, 선, 으뜸: 선[0] || null, 으뜸이당령: !!(선[0] && 선[0].오행 === 당령),
      뜬: 칸.reduce((a, c) => a.concat(c.뜬), []), 꼴, 꼴말,
      나: { 오행: 나, 이름: 오행자[나], 뿌리: 칸[나].하늘.some(h => h.자리 === 'day') },
      맞섬: 맞섬 && 맞섬.무리 > 0 ? 맞섬 : null,      // 으뜸을 치는 기운이 뿌리 내리고 서 있나. 없으면 null(떠 있기만 하면 뜬 에 있다)
    };
  }

  global.ChaeksaGise = { 기세 };
})(window);
