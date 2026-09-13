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
  function 글자들(pillars, 운천간들) {
    const 자리 = [['year', '연간', E.NATAL_WEIGHT.yearBranch], ['month', '월간', E.NATAL_WEIGHT.monthBranch],
                  ['day', '일간', E.NATAL_WEIGHT.dayBranch], ['hour', '시간', E.NATAL_WEIGHT.hourBranch]]
      .filter(([k]) => pillars[k]);
    // 뿌리터 = 원국 지지 + 운의 지지(27조 「운의 지지를 원국에 더해 다시 푼다」). 운 지지 무게는 1.0.
    const 뿌리터 = 자리.map(([k, , w]) => [pillars[k].branch, w])
      .concat((운천간들 || []).filter(u => u.branch != null).map(u => [u.branch, 1.0]));
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
                 힘: Math.round(E.stemPower(u.stem, 뿌리터) * 100) / 100,
                 일간: false, 운: true, 합거: 묶은 ? '원국 ' + 묶은 + '과 합' : null });
    });
    // 「산다」 — 일간이거나, 힘 0.5 이상이고 합거 안 된 것(사장님 09-14 「살아있다를 0.5로 가자, 제 역할은 할 수 있으니까」. 연지·일지 장생 0.55·월지 목욕 1.0 까지 산다)
    out.forEach(g => { g.산다 = g.일간 || (g.힘 >= 0.5 && !g.합거); });
    return out;
  }

  /** 모든 쌍의 생극과 통관. */
  function 표(pillars, 운천간들, R) {
    const 글자 = 글자들(pillars, 운천간들);
    // 격의 주인(31조) — 격 판정은 gyeokguk 이 이미 낸다. 이름만 얹는다. 길흉은 붙이지 않는다(사장님 「길흉을 따지지 마」).
    let 격 = null;
    try { const G = global.ChaeksaGyeok; if (R && G && G.judge) { const j = G.judge(R); 격 = j && j.격 ? { 이름: j.격, 상신: j.상신 || null } : null; } } catch (e) { 격 = null; }
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
        // 일간은 주체라 방패(셋째·잡는 글자) 노릇을 안 한다(09-14 「임수가 정화에 묶여 있잖아」 — 일간 丁을 방패로 세운 것을 잡았다).
        row.셋째 = 글자.filter(c => c !== a && c !== b && !c.일간 && c.오행 === 다리 && c.산다);
        row.통관 = row.셋째.length > 0;
        // 잡는 글자(제복): a 를 극하는 살아 있는 글자 = 오행 (a+3)%5. 자평진전 「갑목이 무토를 잡아 임수에 못 닿는다」.
        const 잡이 = (a.오행 + 3) % 5;
        row.잡는 = 글자.filter(c => c !== a && c !== b && !c.일간 && c.오행 === 잡이 && c.산다);
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
    return { 글자, 쌍, 닿음, 통관, 제복, 끊김, 격 };
  }

  /** 사람이 읽을 요약 — 한 줄씩. */
  function 줄(t) {
    const out = [];
    if (t.격) out.push('격: ' + t.격.이름 + '격' + (t.격.상신 ? ' · 상신 ' + t.격.상신 : ''));
    t.글자.forEach(g => { if (!g.일간) out.push(g.이름 + ' ' + g.글자 + '(' + g.십신 + ') 힘 ' + g.힘 + (g.합거 ? ' · 합거(' + g.합거 + ')' : '') + (g.산다 ? '' : ' · 죽어 있음')); });
    t.닿음.forEach(x => out.push('일간: ' + x.말 + ' → ' + x.결과));
    t.통관.forEach(x => out.push('통관: ' + x));
    t.제복.forEach(x => out.push('제복: ' + x));
    t.끊김.forEach(x => out.push('끊김: ' + x));
    return out;
  }

  // 글자 이름 「임수(壬)」(34조) 와 받침 조사 — 달력·이야기·원국 밴드가 같은 말을 쓴다.
  const 오행자 = ['목', '화', '토', '금', '수'];
  const 이름 = (stem) => E.STEMS_KO[stem] + 오행자[E.STEM_ELEM[stem]] + '(' + E.STEMS[stem] + ')';
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
    const 묶임 = t.글자.filter(g => !g.운 && !g.일간 && g.합거 === '오늘');
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
    if (L.끊.length) return 이가(N(L.운)) + ' ' + 을를(묶어(L.묶임.map(N))) + ' 묶어서 ' + 이가(묶어(L.끊.map(s => 이름(s)))) + ' 나한테 바로 오는 날';
    if (L.묶임.length) return 이가(N(L.운)) + ' ' + 을를(묶어(L.묶임.map(N))) + ' 묶는 날';
    if (L.결과 === '닿음') return 이가(N(L.운)) + ' 나한테 바로 오는 날';
    if (L.결과 === '받음') return 이가(N(L.운)) + ' 오는데 ' + 이가(묶어(L.셋째.map(N))) + ' 받아 넘겨 주는 날';
    if (L.결과 === '잡힘') return 이가(N(L.운)) + ' 오는데 ' + 이가(묶어(L.잡는.map(N))) + ' 막아 주는 날';
    if (L.결과 === '도움') return 이가(N(L.운)) + ' 나를 채워 주는 날';
    if (L.침 && L.침.length) { const x = L.침[0];
      if (x.통관) return 이가(N(L.운)) + ' ' + 을를(N(x.to)) + ' 치는데 ' + 이가(묶어(x.셋째.map(N))) + ' 받아 주는 날';
      if (x.제복) return 이가(N(L.운)) + ' ' + 을를(N(x.to)) + ' 치려는데 ' + 이가(묶어(x.잡는.map(N))) + ' 막아 주는 날';
      return 이가(N(L.운)) + ' ' + 을를(N(x.to)) + ' 치는 날'; }
    if (L.채움 && L.채움.length) return 이가(N(L.운)) + ' ' + 을를(N(L.채움[0].to)) + ' 채워 주는 날';
    if (L.같음) return '나와 같은 ' + 이가(N(L.운)) + ' 하나 더 오는 날';
    if (L.나감) return '내 힘이 ' + N(L.운) + '(으)로 나가는 날'.replace('(으)로', 받침(N(L.운).replace(/\(.*\)/, '')) ? '으로' : '로');
    if (L.쥠) return '내가 ' + 을를(N(L.운)) + ' 쥐는 날';
    if (L.결과 === '이름만') return 이가(N(L.운)) + ' 오지만 힘이 없는 날';
    return null;
  }

  /** 층마다 격을 다시 낸다(35조, 변격). 원격 이름은 gyeokguk/typecard 가 낸 것을 받는다.
   *  격의 주인 천간이 이 층에서 묶여 있으면 — 남은 살아 있는 천간(원국·운) 중 월지 지장간과 같은 오행으로 투간한 것이 격을 잡는다(본기>중기>여기).
   *  새 주인을 막힘 없이 극하는 살아 있는 글자가 있으면 그 격은 깨진다. 길흉 말은 여기서 안 붙인다 — 「깨짐」 사실만. */
  function 층격(pillars, 운들, 원격, R) {
    if (!pillars || !원격) return null;
    운들 = 운들 || [];
    const t = 표(pillars, 운들);
    const 나 = t.글자.find(g => g.일간);
    // 이 층의 상태를 자평진전 격표에 그대로 넘긴다(사장님 「인수격이 경금 재성을 보았을 때를 보면 되잖아」) — 성패는 격표가 낸다.
    const 층 = { 합거: {}, 운: [] };
    t.글자.forEach(g => { if (!g.운 && !g.일간 && g.합거) 층.합거[g.key] = true; });
    const 운글자 = t.글자.filter(g => g.운);                       // 글자들() 이 운들 순서대로 밀어 넣는다
    운글자.forEach((g, i) => { if (g.산다) 층.운.push({ stem: g.stem, branch: 운들[i] ? 운들[i].branch : null, name: g.이름 }); });
    // 33조가 격표 위에 선다 — 격의 주인을 막힘 없이 극하는 살아 있는 글자가 있으면 격표가 뭐라 하든 깨진 것이다
    // (09-14 사장님: 정미 대운에 庚이 甲을 바로 치니 인수격이 재에 깨졌다. 격표의 힘 비교(인 1.24 > 재 0.82)로는 안 걸렸다).
    const 깨는것 = (주인) => 주인 ? t.쌍.filter(r => r.to === 주인 && r.관계 === '극' && r.from.산다 && !r.막힘 && !r.from.일간).map(r => r.from) : [];
    const 성패 = (격, 주인) => {
      let j = null;
      try { const Gk = global.ChaeksaGyeok; j = (R && Gk && Gk.judge && 격) ? Gk.judge(R, 격, 층) : null; } catch (e) { j = null; }
      const 침 = 깨는것(주인);
      if (침.length && (!j || j.판정 !== '깨졌다')) {
        const 십 = 주인.십신, 치는십 = 침[0].십신;
        const 말 = (십 === '정인' || 십 === '편인') && (치는십 === '정재' || 치는십 === '편재')
          ? '재가 인을 친다 — 재극인(' + E.STEMS[침[0].stem] + '이 ' + E.STEMS[주인.stem] + '을 바로 친다, 받아 줄 글자가 없다)'
          : E.STEMS[침[0].stem] + '이 격의 주인 ' + E.STEMS[주인.stem] + '을 바로 친다 — 받아 줄 글자가 없다';
        j = Object.assign({}, j || {}, { 격, 판정: '깨졌다', ok: 0, 격표판정: j ? j.판정 : null, 근거: Object.assign({}, (j && j.근거) || {}, { 깨졌다: [말] }) });
      }
      return j;
    };
    const 주인들 = t.글자.filter(g => !g.일간 && !g.운 && g.십신 === 원격);
    if (!주인들.length) return { 원격, 지금격: 원격, 변질: false, 주인: null, 성패: 성패(원격, null) };
    const 산주인 = 주인들.find(g => g.산다);
    if (산주인) return { 원격, 지금격: 원격, 변질: false, 주인: 산주인, 성패: 성패(원격, 산주인) };
    // 주인이 다 묶였다 — 월지 지장간 오행 순서로 후보를 찾는다
    const 지장 = (E.HIDDEN[pillars.month.branch] || []).map(h => E.STEM_ELEM[typeof h === 'number' ? h : h[0]]);
    let 새 = null;
    for (const 오행 of 지장) { 새 = t.글자.find(g => !g.일간 && g.산다 && g.오행 === 오행 && g.오행 !== 나.오행); if (새) break; }
    if (!새) return { 원격, 지금격: null, 변질: true, 주인: null, 성패: null, 묶인주인: 주인들[0] };
    return { 원격, 지금격: 새.십신, 변질: true, 주인: 새, 성패: 성패(새.십신, 새), 묶인주인: 주인들[0] };
  }

  global.ChaeksaSaenggeuk = { 표, 줄, 글자들, 이름, 이가, 을를, 은는, 묶어, 오늘길, 오늘말, 층격 };
})(window);
