/* 판정 모듈 — 입력 하나에 A→H 를 차례로 돌려 결과 하나를 낸다 (2026-09-14, 사장님 「판정모듈+조문으로 올인원」)
 *
 * 규칙은 법전(docs/19)에 있고, 계산기는 engine·saenggeuk·gyeokguk 에 있다. 여기는 **순서와 기록**만 맡는다.
 *   A 입력·시간축   engine.calc / dateFortune / currentDaeun (여기서는 받기만)
 *   B 글자 개체     saenggeuk.글자들 (힘·합거·이력)
 *   C·D·E 관계     saenggeuk.표 (생극·통관·제복·힘차이·합거, 28·33·36·37조)
 *   F 취격         saenggeuk.취격 (38·39조)
 *   G 층 재계산     대운 → 올해 → 이달 → 오늘, 앞 층 위에 얹어서(28조). 시운은 없다.
 *   H 결과 범주     구조 유지 / 손상 우세 / 구제됨 / 구제 약화 / 손상 재발 / 재구제 / 구조 전환 / 규칙 보완 필요
 * 길흉 말·통변은 여기 없다. 화면(wongook·calendar·stories)이 이 결과를 읽어 말을 붙인다.
 *
 * 쓰는 법: ChaeksaPanjeong.판정(R, today) → { 층들:[{이름, 간지, 앞운들, 표, 격, 범주, 근거, 이력}], 오늘 }
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, G = global.ChaeksaSaenggeuk;
  if (!E || !G) return;

  const 범주표 = {
    유지: '구조 유지', 손상: '손상 우세', 구제: '구제됨', 약화: '구제 약화', 재발: '손상 재발', 재구제: '재구제', 전환: '구조 전환', 미정: '규칙 보완 필요',
  };

  /** 이 층에서 격의 주인을 막힘 없이 극하는 글자(손상)와, 그 극을 막는 글자(구응)를 표에서 읽는다. */
  function 병과약(t, 주인) {
    if (!주인) return { 손상: [], 구응: [] };
    // 층격()은 제 표를 따로 만드니 객체가 다르다 — 자리(key)로 맞춘다
    const 같다 = (g) => g.key === 주인.key;
    const 손상 = t.쌍.filter(r => 같다(r.to) && r.관계 === '극' && r.from.산다 && !r.막힘 && !r.from.일간).map(r => r.from);
    const 막힌 = t.쌍.filter(r => 같다(r.to) && r.관계 === '극' && r.from.산다 && r.막힘 && !r.from.일간);
    const 구응 = [];
    막힌.forEach(r => { r.셋째.concat(r.잡는).forEach(c => { if (구응.indexOf(c) < 0) 구응.push(c); }); });
    return { 손상, 구응, 막힌극: 막힌.map(r => r.from) };
  }

  /** H — 앞 층과 견주어 범주를 정한다(40조).
   *  유지: 격신을 극하는 산 글자 없음 · 손상: 막힘 없는 극 · 구제됨: 극이 있으나 막힘 · 구제 약화: 막던 글자가 죽고 다른 글자가 대신 막음
   *  손상 재발: 막던 글자가 죽어 극이 뚫림 · 재구제: 재발 뒤 다시 막힘 · 구조 전환: 격이 바뀜 · 규칙 보완 필요: 격을 못 잡음 */
  function 범주(앞, 지금) {
    if (!지금.격 || !지금.격.지금격) return { 범주: 범주표.미정, 근거: '격을 잡을 글자가 없다' };
    if (앞 && 앞.격 && 앞.격.지금격 && 지금.격.지금격 !== 앞.격.지금격) return { 범주: 범주표.전환, 근거: 앞.격.지금격 + '격 → ' + 지금.격.지금격 + '격 (' + (지금.격.근거 || '') + ')' };
    const p = 병과약(지금.표, 지금.격.주인);
    const q = 앞 ? 병과약(앞.표, 앞.격 && 앞.격.주인) : { 손상: [], 구응: [] };
    const 이름 = (g) => G.이름(g.stem) + ' ' + g.십신;   // 34조 「임수(壬) 정관」
    const 같은 = (a, b) => a.stem === b.stem && a.이름 === b.이름;
    // 앞 층에서 막아 주던 글자 중 이 층에서 죽은 것
    const 잃은 = q.구응.filter(c => !지금.표.글자.find(g => 같은(g, c) && g.산다));
    if (p.손상.length) {
      if (잃은.length) return { 범주: 범주표.재발, 근거: 잃은.map(이름).join('·') + '이 합거되어 구응이 사라짐 → ' + p.손상.map(이름).join('·') + '이 격신을 바로 극함' };
      return { 범주: 범주표.손상, 근거: p.손상.map(이름).join('·') + '이 격신 ' + 이름(지금.격.주인) + '을 극함, 구응 없음' };
    }
    if (p.막힌극 && p.막힌극.length) {
      const 새구응 = p.구응.filter(c => !q.구응.find(x => 같은(x, c)));
      const 막음 = p.구응.map(이름).join('·') + '이 ' + p.막힌극.map(이름).join('·') + '을 막음';
      if (잃은.length) return { 범주: 범주표.약화, 근거: 잃은.map(이름).join('·') + '이 합거되고 ' + p.구응.map(이름).join('·') + '이 대신 막음 (구응 약화, 사장님 확인 09-14)' };
      if (앞 && 앞.범주 === 범주표.재발) return { 범주: 범주표.재구제, 근거: 막음 };
      return { 범주: 범주표.구제, 근거: 막음 };
    }
    return { 범주: 범주표.유지, 근거: '격신을 극하는 살아 있는 글자가 없음' };
  }

  /** G — 층을 차례로 쌓는다. */
  function 판정(R, today, opts) {
    today = today || new Date();
    const 운들 = [];
    if (opts && opts.운들) opts.운들.forEach(u => 운들.push(u));   // 시험 페이지 — 층을 직접 준다
    else {
      const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
      let du = null; try { du = E.currentDaeun(R, today); } catch (e) { du = null; }
      if (du) 운들.push({ stem: du.stem, branch: du.branch, name: '대운' });
      운들.push({ stem: tf.year.stem, branch: tf.year.branch, name: '올해' });
      운들.push({ stem: tf.month.stem, branch: tf.month.branch, name: '이달' });
      운들.push({ stem: tf.day.stem, branch: tf.day.branch, name: '오늘' });
    }

    const 원표 = G.표(R.pillars, [], R);
    const 원격이름 = 원표.격 ? 원표.격.이름 : null;
    const 층들 = [];
    let 앞운 = [], 앞 = null;
    // 원국 층
    {
      const 격 = 원격이름 ? G.층격(R.pillars, [], 원격이름, R) : null;
      const 층 = { 이름: '원국', 간지: null, 앞운들: [], 표: 원표, 격 };
      Object.assign(층, 범주(null, 층));
      층.이력 = 원표.글자.map(g => ({ 글자: g.이름 + ' ' + g.글자, 이력: g.이력 }));
      층들.push(층); 앞 = 층;
    }
    for (const u of 운들) {
      const 앞운들 = 앞운.slice();
      const 표 = G.표(R.pillars, 앞운들.concat([u]), R);
      const 격 = 원격이름 ? G.층격(R.pillars, 앞운들.concat([u]), 원격이름, R) : null;
      const 층 = { 이름: u.name, 간지: E.STEMS[u.stem] + (u.branch != null ? E.BRANCHES[u.branch] : ''), 운: u, 앞운들, 표, 격 };
      Object.assign(층, 범주(앞, 층));
      층.이력 = 표.글자.map(g => ({ 글자: g.이름 + ' ' + g.글자, 이력: g.이력 }));
      층들.push(층); 앞 = 층; 앞운.push(u);
    }
    return { 층들, 오늘: 층들[층들.length - 1], 원격: 원격이름 };
  }

  /** 사람이 읽을 요약 — 층마다 한 줄. 시험 페이지가 쓴다. */
  function 요약(p) {
    return p.층들.map(층 => {
      const 격 = 층.격 ? (층.격.지금격 ? 층.격.지금격 + '격' : '격 없음') + (층.격.성패 ? '(' + ((global.ChaeksaGyeok && global.ChaeksaGyeok.전문 || {})[층.격.성패.판정] || 층.격.성패.판정) + ')' : '') : '';
      return 층.이름 + (층.간지 ? ' ' + 층.간지 : '') + ' · ' + 격 + ' · ' + 층.범주 + ' — ' + 층.근거;
    });
  }

  global.ChaeksaPanjeong = { 판정, 요약, 범주표 };
})(window);
