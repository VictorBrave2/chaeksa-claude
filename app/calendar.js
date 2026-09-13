/* 책사 달력 — 날마다 판정 하나(docs/34 다리). 점수표(십신 가중치·합·오늘길 ±1.5)는 2026-09-14 걷었다(사장님 「진행해」 — 내가 지어 넣은 값이었다). */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;

  // 달력 칩 → 갈래(44조). 가중치 표는 없다 — 갈래가 1순위 글자를 정하고, 그 글자의 오늘 결과가 등급이다.
  const PURPOSES = {
    all:   { label: '전체',      갈래: '나' },
    love:  { label: '만남·고백', 갈래: '관계' },
    deal:  { label: '계약·서류', 갈래: '직장' },
    exam:  { label: '면접·시험', 갈래: '학습' },
    start: { label: '개업·시작', 갈래: '재물' },
  };
  const 칸등급 = { 좋음: 2, 보통: 1, 조심: 0 };
  const GRADE_LABEL = ['조심', '보통', '좋음', '좋음'];

  function scoreDay(result, y, m, d, purposeKey) {
    const P = global.ChaeksaPanjeong;
    const 갈래 = (PURPOSES[purposeKey] || PURPOSES.all).갈래;
    const tf = E.dateFortune(y, m, d);
    const god = E.TEN_GODS[E.tenGod(result.pillars.day.stem, tf.day.stem)];
    const 여자 = ((result.input && result.input.gender) || 'M') !== 'M';
    let r = null;
    try { r = P ? P.이야기결과(result, 갈래, new Date(y, m - 1, d), { 여자 }) : null; } catch (e) { r = null; }
    const grade = r ? 칸등급[r.칸] : 1;
    return { y, m, d, tf, god, score: grade, grade, reasons: [r ? r.이유 : '판정을 못 냈어요.'], 결과: r ? r.결과.키 : null };
  }

  function month(result, y, m, purposeKey) {
    const days = new Date(y, m, 0).getDate();
    const out = [];
    for (let d = 1; d <= days; d++) out.push(scoreDay(result, y, m, d, purposeKey));
    return out;
  }

  global.ChaeksaCalendar = { PURPOSES, scoreDay, month, GRADE_LABEL };
})(window);
