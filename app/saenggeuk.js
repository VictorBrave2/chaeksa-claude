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
 * 쓰는 법:  ChaeksaSaenggeuk.표(pillars, 운천간들)  →  { 글자, 쌍, 닿음, 통관 }
 *   pillars  = R.pillars (engine calc 결과의 그것)
 *   운천간들 = [{ stem, name }] — 대운·세운·월운·일운 천간. 없으면 원국만.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;
  if (!E) return;
  const ELEM_KO = E.ELEM;                       // ['목','화','토','금','수']
  const 생 = (a, b) => (a + 1) % 5 === b;       // a 가 b 를 생한다
  const 극 = (a, b) => (a + 2) % 5 === b;       // a 가 b 를 극한다

  /** 원국 천간 넷(일간 포함) + 운 천간을 「글자」로 세운다. 힘·합거를 붙인다. */
  function 글자들(pillars, 운천간들) {
    const 자리 = [['year', '연간', E.NATAL_WEIGHT.yearBranch], ['month', '월간', E.NATAL_WEIGHT.monthBranch],
                  ['day', '일간', E.NATAL_WEIGHT.dayBranch], ['hour', '시간', E.NATAL_WEIGHT.hourBranch]]
      .filter(([k]) => pillars[k]);
    const 뿌리터 = 자리.map(([k, , w]) => [pillars[k].branch, w]);
    const out = 자리.map(([k, 이름]) => ({
      key: k, 이름, stem: pillars[k].stem, 글자: E.STEMS[pillars[k].stem], 오행: E.STEM_ELEM[pillars[k].stem],
      힘: k === 'day' ? null : Math.round(E.stemPower(pillars[k].stem, 뿌리터) * 100) / 100,
      일간: k === 'day', 운: false, 합거: null,
    }));
    // 원국 합거(연간-월간). 일간은 합거하지 않는다.
    const nh = E.natalHap(pillars);
    Object.keys(nh).forEach(k => { const g = out.find(x => x.key === k); if (g) g.합거 = '원국 ' + (out.find(x => x.key === nh[k]) || {}).이름; });
    // 운 천간 — 하나씩 들어와 아직 안 묶인 원국 천간(일간 제외) 중 합하는 것을 묶는다(28조 두번법칙: 첫 번은 묶이고 둘째부터 뚫린다).
    (운천간들 || []).forEach(u => {
      const 후보 = out.filter(x => !x.일간 && !x.운 && !x.합거 && E.isHap(x.stem, u.stem));
      // 합은 서로 묶는다 — 갑목을 묶은 기토는 그 합에 쓰여서 제 명령(임수를 잡는 일)을 못 한다(사장님 「기토 오면 임수가 닿는다」).
      let 묶은 = null;
      if (후보.length) { 후보[0].합거 = u.name || '운'; 묶은 = 후보[0].이름 + ' ' + 후보[0].글자; }
      out.push({ key: 'un' + out.length, 이름: u.name || '운', stem: u.stem, 글자: E.STEMS[u.stem], 오행: E.STEM_ELEM[u.stem],
                 힘: Math.round(E.stemPower(u.stem, 뿌리터.concat(u.branch != null ? [[u.branch, 1.0]] : [])) * 100) / 100,
                 일간: false, 운: true, 합거: 묶은 ? '원국 ' + 묶은 + '과 합' : null });
    });
    // 「산다」 — 일간이거나, 뿌리 있고 합거 안 된 것
    out.forEach(g => { g.산다 = g.일간 || (g.힘 > 0 && !g.합거); });
    return out;
  }

  /** 모든 쌍의 생극과 통관. */
  function 표(pillars, 운천간들) {
    const 글자 = 글자들(pillars, 운천간들);
    const ds = 글자.find(g => g.일간).stem;
    const 십신 = (g) => g.일간 ? '일간' : E.TEN_GODS[E.tenGod(ds, g.stem)];
    글자.forEach(g => { g.십신 = 십신(g); });
    const 쌍 = [];
    for (const a of 글자) for (const b of 글자) {
      if (a === b) continue;
      let 관계 = null;
      if (생(a.오행, b.오행)) 관계 = '생';
      else if (극(a.오행, b.오행)) 관계 = '극';
      if (!관계) continue;
      const row = { from: a, to: b, 관계, 셋째: [], 잡는: [], 통관: false, 제복: false, 막힘: false, 산다: a.산다 && b.산다 };
      if (관계 === '극') {
        // 셋째 글자(통관): a 가 생하고 b 를 생하는 오행 = (a+1)%5. 살아 있는 것만.
        const 다리 = (a.오행 + 1) % 5;
        row.셋째 = 글자.filter(c => c !== a && c !== b && c.오행 === 다리 && c.산다);
        row.통관 = row.셋째.length > 0;
        // 잡는 글자(제복): a 를 극하는 살아 있는 글자 = 오행 (a+3)%5. 자평진전 「갑목이 무토를 잡아 임수에 못 닿는다」.
        const 잡이 = (a.오행 + 3) % 5;
        row.잡는 = 글자.filter(c => c !== a && c !== b && c.오행 === 잡이 && c.산다);
        row.제복 = row.잡는.length > 0;
        row.막힘 = row.통관 || row.제복;
      }
      쌍.push(row);
    }
    // 일간에게 닿는 것 — 극인데 통관 안 된 것 / 통관된 것 / 생하는 것
    const 나 = 글자.find(g => g.일간);
    const 닿음 = 쌍.filter(r => r.to === 나 && r.from.산다).map(r => ({
      글자: r.from.글자 + '(' + r.from.십신 + ')', 관계: r.관계,
      결과: r.관계 === '생' ? '도움' : (r.통관 ? '받음' : r.제복 ? '잡힘' : '닿음'),
      셋째: r.셋째.map(c => c.글자 + '(' + c.십신 + ')'), 잡는: r.잡는.map(c => c.글자 + '(' + c.십신 + ')'),
      말: r.관계 === '생' ? r.from.글자 + '이 나를 생한다'
        : r.통관 ? r.from.글자 + '이 나를 극하지만 ' + r.셋째.map(c => c.글자).join('·') + '이 받아 넘긴다'
        : r.제복 ? r.from.글자 + '이 나를 극하지만 ' + r.잡는.map(c => c.글자).join('·') + '이 잡는다'
        : r.from.글자 + '이 나를 바로 친다',
    }));
    // 통관 목록 — 사람이 읽을 한 줄씩
    const 통관 = 쌍.filter(r => r.통관 && r.from.산다 && r.to.산다).map(r =>
      r.from.글자 + '(' + r.from.십신 + ')→' + r.셋째.map(c => c.글자).join('·') + '→' + r.to.글자 + '(' + r.to.십신 + ')');
    // 제복 목록 — 극이 잡혀서 못 닿는 자리
    const 제복 = 쌍.filter(r => r.제복 && !r.통관 && r.from.산다 && r.to.산다 && !r.from.일간).map(r =>   // 일간은 주체라 잡히지 않는다
      r.잡는.map(c => c.글자).join('·') + '이 ' + r.from.글자 + '(' + r.from.십신 + ')을 잡아 ' + r.to.글자 + '(' + r.to.십신 + ')에 못 닿는다');
    // 끊긴 생 — a 가 b 를 생하는데 a 를 막힘 없이 극하는 살아 있는 글자가 있다
    const 끊김 = 쌍.filter(r => r.관계 === '생' && r.from.산다 && r.to.산다).filter(r =>
      쌍.some(q => q.관계 === '극' && q.to === r.from && q.from.산다 && !q.막힘)).map(r =>
      r.from.글자 + '→' + r.to.글자 + ' 생이 약하다(' + 쌍.filter(q => q.관계 === '극' && q.to === r.from && q.from.산다 && !q.막힘).map(q => q.from.글자).join('·') + '이 ' + r.from.글자 + '을 친다)');
    return { 글자, 쌍, 닿음, 통관, 제복, 끊김 };
  }

  /** 사람이 읽을 요약 — 한 줄씩. */
  function 줄(t) {
    const out = [];
    t.글자.forEach(g => { if (!g.일간) out.push(g.이름 + ' ' + g.글자 + '(' + g.십신 + ') 힘 ' + g.힘 + (g.합거 ? ' · 합거(' + g.합거 + ')' : '') + (g.산다 ? '' : ' · 죽어 있음')); });
    t.닿음.forEach(x => out.push('일간: ' + x.말 + ' → ' + x.결과));
    t.통관.forEach(x => out.push('통관: ' + x));
    t.제복.forEach(x => out.push('제복: ' + x));
    t.끊김.forEach(x => out.push('끊김: ' + x));
    return out;
  }

  global.ChaeksaSaenggeuk = { 표, 줄, 글자들 };
})(window);
