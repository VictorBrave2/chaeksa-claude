/* 책사 택일 모듈 v1 — 날짜별 점수 (규칙 기반, 결정론적) */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;

  const PURPOSES = {
    all:   { label:'전체',     w:{ 정인:2, 정관:2, 정재:2, 식신:2, 편재:1, 편인:0, 비견:0, 상관:-1, 겁재:-2, 편관:-2 } },
    deal:  { label:'계약·서류', w:{ 정관:3, 정재:3, 정인:2, 식신:1, 편재:0, 편인:0, 비견:0, 상관:-3, 겁재:-3, 편관:-1 } },
    exam:  { label:'면접·시험', w:{ 정관:3, 정인:3, 편인:1, 식신:1, 정재:1, 편재:0, 비견:0, 상관:-2, 겁재:-1, 편관:-1 } },
    move:  { label:'이사·이동', w:{ 식신:2, 편재:2, 편인:1, 정재:1, 정인:1, 정관:1, 비견:0, 상관:0, 겁재:-2, 편관:-2 } },
    start: { label:'개업·시작', w:{ 편재:3, 식신:3, 정재:2, 정관:1, 정인:1, 편인:0, 비견:0, 상관:0, 겁재:-3, 편관:-2 } },
    trip:  { label:'여행·휴식', w:{ 식신:3, 편재:2, 편인:1, 정인:1, 정재:0, 정관:0, 비견:0, 상관:0, 겁재:-1, 편관:-2 } },
    love:  { label:'만남·고백', w:{ 식신:2, 정재:2, 정관:2, 정인:1, 편재:1, 편인:0, 비견:0, 상관:-1, 겁재:-2, 편관:-1 }, hap:3 },
  };
  const STEM_HAP = { 0:5, 5:0, 1:6, 6:1, 2:7, 7:2, 3:8, 8:3, 4:9, 9:4 };
  const YUKHAP = { 0:1, 1:0, 2:11, 11:2, 3:10, 10:3, 4:9, 9:4, 5:8, 8:5, 6:7, 7:6 };
  const SAMHAP = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];

  function branchRel(mine, other) {
    if (mine === other) return '복음';
    if ((other - mine + 12) % 12 === 6) return '충';
    if (YUKHAP[mine] === other) return '합';
    if (SAMHAP.some(g => g.includes(mine) && g.includes(other))) return '삼합';
    return null;
  }

  function scoreDay(result, y, m, d, purposeKey) {
    // 이름(문자열)이면 표에서 찾고, 객체면 그대로 쓴다 — stories.js 가 기준을 직접 넘길 수 있게(2026-09-12)
    const P = (purposeKey && typeof purposeKey === 'object') ? purposeKey : (PURPOSES[purposeKey] || PURPOSES.all);
    const a = result.analysis, ds = a.dayStem;
    const tf = E.dateFortune(y, m, d);
    const god = E.TEN_GODS[E.tenGod(ds, tf.day.stem)];
    let s = P.w[god] ?? 0;
    const reasons = [god];
    const rel = branchRel(result.pillars.day.branch, tf.day.branch);
    // 충 감점 없음 — 제23조. 택일은 통변이라 배제 범위 안이다.
    if (rel === '합') { s += P.hap ?? 2; reasons.push('내 자리와 맞물림(일지 합)'); }
    else if (rel === '삼합') { s += 1; reasons.push('내 자리와 한편(삼합)'); }
    else if (rel === '복음') { s -= 1; reasons.push('내 글자가 겹침(복음)'); }
    if (STEM_HAP[ds] === tf.day.stem) { s += 1; reasons.push('하늘 글자가 나와 맞물림(천간합)'); }
    // 용신 오행 +1.5 는 29조로 걷었다(강약에서 나온 값). 대신 오늘 온 글자가 내 생극제화 표를 어떻게 건드리나(33조):
    // 받아 넘겨지거나 채워 주면 +1.5, 바로 닿으면 −1.5, 방패가 묶여 뚫리면 −1.5 더. 크기 1.5 는 옛 용신 항과 같은 눈금(우리가 정한 값).
    let 길 = null;
    try {
      const G = global.ChaeksaSaenggeuk;
      // 대운·올해·이달을 먼저 얹는다 — 이달 丁이 壬을 묶어 두면 오늘 줄도 그걸 안다(28조).
      const du = E.currentDaeun(result, new Date(y, m - 1, d));
      const 앞 = [du ? { stem: du.stem, branch: du.branch, name: '대운' } : null,
                  { stem: tf.year.stem, branch: tf.year.branch, name: '올해' },
                  { stem: tf.month.stem, branch: tf.month.branch, name: '이달' }];
      길 = (G && G.오늘길) ? G.오늘길(result, tf.day.stem, tf.day.branch, 앞) : null;
      if (길) {
        if (길.결과 === '받음' || 길.결과 === '도움') { s += 1.5; reasons.push('오늘 글자가 나를 채움'); }
        else if (길.결과 === '닿음') { s -= 1.5; reasons.push('오늘 글자가 나한테 바로 닿음'); }
        if (길.끊.length) { s -= 1.5; reasons.push('방패가 묶임'); }
      }
    } catch (e) { 길 = null; }
    // 월 단위 흐름도 약간 반영
    const godM = E.TEN_GODS[E.tenGod(ds, tf.month.stem)];
    s += (P.w[godM] ?? 0) * 0.3;
    const grade = s >= 5 ? 3 : s >= 2 ? 2 : s >= -1 ? 1 : 0; // 3 최고, 0 피함
    return { y, m, d, tf, god, rel, score: Math.round(s * 10) / 10, grade, reasons, 길 };
  }

  function month(result, y, m, purposeKey) {
    const days = new Date(y, m, 0).getDate();
    const out = [];
    for (let d = 1; d <= days; d++) out.push(scoreDay(result, y, m, d, purposeKey));
    return out;
  }

  const GRADE_LABEL = ['피하기', '보통', '좋음', '아주 좋음'];
  global.ChaeksaCalendar = { PURPOSES, scoreDay, month, branchRel, GRADE_LABEL };
})(window);
