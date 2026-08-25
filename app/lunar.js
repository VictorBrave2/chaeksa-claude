/* 책사 음력 모듈 v1 — 한국 음력(KASI 기준 규칙)을 천문 계산으로 직접 구한다.
 *
 * 규칙
 *  1) 삭(합삭) 순간이 든 날(KST)이 그 달의 초하루다.
 *  2) 동지(태양황경 270°)가 든 달이 음력 11월이다.
 *  3) 11월에서 다음 11월까지 13개월이면 윤달이 있다.
 *     그중 중기(황경이 30의 배수)가 들지 않은 첫 달이 윤달이며, 앞 달의 번호를 따른다. (무중치윤법)
 *
 * 삭 시각은 Meeus 49장 알고리즘(오차 수 분). 자정 경계에 삭이 걸리는 드문 경우를 빼면
 * 날짜 판정에 충분하다.
 */
(function (global) {
  'use strict';
  const A = () => global.ChaeksaAstro;   // 지연 참조 (로드 순서 무관)
  const D2R = Math.PI / 180;
  const sin = (deg) => Math.sin(deg * D2R);
  const KST = 9 / 24;

  // ───── 율리우스일 ↔ 그레고리력 ─────
  function jdFromDate(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const a = Math.floor(y / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }
  function dateFromJD(jd) {
    const z = Math.floor(jd + 0.5);
    let a = z;
    if (z >= 2299161) { const al = Math.floor((z - 1867216.25) / 36524.25); a = z + 1 + al - Math.floor(al / 4); }
    const b = a + 1524, c = Math.floor((b - 122.1) / 365.25), d = Math.floor(365.25 * c), e = Math.floor((b - d) / 30.6001);
    const day = b - d - Math.floor(30.6001 * e);
    const month = e < 14 ? e - 1 : e - 13;
    const year = month > 2 ? c - 4716 : c - 4715;
    return { y: year, m: month, d: day };
  }
  /** KST 기준 그 날의 0시에 해당하는 JD(정수부 기준 날짜 번호) */
  const kstDayNumber = (jdUT) => Math.floor(jdUT + KST + 0.5);

  // ───── 삭(New Moon) — Meeus 49 ─────
  function newMoonJDE(k) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
    const E = 1 - 0.002516 * T - 0.0000074 * T2;
    const M = 2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3;
    const M1 = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
    const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
    const O = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;

    jde += -0.40720 * sin(M1)
      + 0.17241 * E * sin(M)
      + 0.01608 * sin(2 * M1)
      + 0.01039 * sin(2 * F)
      + 0.00739 * E * sin(M1 - M)
      - 0.00514 * E * sin(M1 + M)
      + 0.00208 * E * E * sin(2 * M)
      - 0.00111 * sin(M1 - 2 * F)
      - 0.00057 * sin(M1 + 2 * F)
      + 0.00056 * E * sin(2 * M1 + M)
      - 0.00042 * sin(3 * M1)
      + 0.00042 * E * sin(M + 2 * F)
      + 0.00038 * E * sin(M - 2 * F)
      - 0.00024 * E * sin(2 * M1 - M)
      - 0.00017 * sin(O)
      - 0.00007 * sin(M1 + 2 * M)
      + 0.00004 * sin(2 * M1 - 2 * F)
      + 0.00004 * sin(3 * M)
      + 0.00003 * sin(M1 + M - 2 * F)
      + 0.00003 * sin(2 * M1 + 2 * F)
      - 0.00003 * sin(M1 + M + 2 * F)
      + 0.00003 * sin(M1 - M + 2 * F)
      - 0.00002 * sin(M1 - M - 2 * F)
      - 0.00002 * sin(3 * M1 + M)
      + 0.00002 * sin(4 * M1);

    const A1 = 299.77 + 0.107408 * k - 0.009173 * T2;
    const AA = [
      [0.000325, A1], [0.000165, 251.88 + 0.016321 * k], [0.000164, 251.83 + 26.651886 * k],
      [0.000126, 349.42 + 36.412478 * k], [0.000110, 84.66 + 18.206239 * k], [0.000062, 141.74 + 53.303771 * k],
      [0.000060, 207.14 + 2.453732 * k], [0.000056, 154.84 + 7.306860 * k], [0.000047, 34.52 + 27.261239 * k],
      [0.000042, 207.19 + 0.121824 * k], [0.000040, 291.34 + 1.844379 * k], [0.000037, 161.72 + 24.198154 * k],
      [0.000035, 239.56 + 25.513099 * k], [0.000023, 331.55 + 3.592518 * k],
    ];
    for (const [c, ang] of AA) jde += c * sin(ang);
    return jde;
  }
  /** 삭의 세계시 JD */
  function newMoonUT(k) {
    const jde = newMoonJDE(k);
    const year = 2000 + (jde - 2451545) / 365.25;
    return jde - A().deltaT(year) / 86400;
  }

  // ───── 태양 황경이 target이 되는 시각 (세계시 JD) ─────
  function solarTermUT(targetLon, jdGuess) {
    let lo = jdGuess - 20, hi = jdGuess + 20;
    const diff = (jd) => { let d = A().apparentSunLongitude(jd) - targetLon; return ((d + 180) % 360 + 360) % 360 - 180; };
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (diff(mid) < 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  /** 그 해 동지(270°)의 KST 일자번호 */
  function winterSolsticeDay(year) {
    const guess = jdFromDate(year, 12, 21);
    return kstDayNumber(solarTermUT(270, guess));
  }

  // ───── 음력 달 테이블 만들기 ─────
  const cache = {};
  /** year(양력) 기준으로 그 해를 포함하는 음력 달 목록을 만든다 */
  function buildMonths(year) {
    if (cache[year]) return cache[year];
    const ws0 = winterSolsticeDay(year - 1);   // 전년 동지 → 음력 11월
    const ws1 = winterSolsticeDay(year);       // 올해 동지 → 다음 음력 11월

    // 동지 전후의 삭을 모두 구한다
    const kStart = Math.floor((ws0 - 2451550.09766) / 29.530588861) - 2;
    const news = [];
    for (let i = 0; i < 20; i++) {
      const day = kstDayNumber(newMoonUT(kStart + i));
      if (!news.length || day > news[news.length - 1]) news.push(day);
      if (day > ws1 + 40) break;
    }
    // 동지가 든 달의 시작(삭) 찾기
    let s0 = 0;
    for (let i = 0; i < news.length - 1; i++) if (news[i] <= ws0 && ws0 < news[i + 1]) { s0 = i; break; }
    let s1 = s0;
    for (let i = s0; i < news.length - 1; i++) if (news[i] <= ws1 && ws1 < news[i + 1]) { s1 = i; break; }

    const count = s1 - s0;                       // 11월 → 다음 11월 사이 달 수 (12 또는 13)
    const hasLeap = count === 13;

    // 각 달에 중기가 들어 있는지 확인
    const hasMajorTerm = (startDay, endDay) => {
      // 해당 구간에 황경 30의 배수가 되는 시각이 있는가
      for (let lon = 0; lon < 360; lon += 30) {
        const approx = jdFromDate(year - 1, 12, 21) + ((lon - 270 + 360) % 360) / 360 * 365.25;
        for (const g of [approx - 365.25, approx, approx + 365.25]) {
          const t = kstDayNumber(solarTermUT(lon, g));
          if (t >= startDay && t < endDay) return true;
        }
      }
      return false;
    };

    const months = [];
    let leapUsed = false;
    for (let i = s0; i < news.length - 1; i++) {
      const start = news[i], end = news[i + 1];
      const idx = i - s0;                        // 0 = 11월
      let leap = false;
      if (hasLeap && !leapUsed && idx > 0 && idx <= 13 && !hasMajorTerm(start, end)) { leap = true; leapUsed = true; }
      months.push({ start, end, idx, leap });
    }
    // 번호 매기기: 11월부터 시작, 윤달은 앞 달 번호를 따른다
    let num = 11, ly = year - 1, prevNum = null, prevYear = null;
    for (const mo of months) {
      if (mo.leap) {   // 윤달은 '앞 달'의 번호와 연도를 그대로 따른다
        mo.month = prevNum == null ? num : prevNum;
        mo.lunarYear = prevYear == null ? ly : prevYear;
        mo.isLeap = true;
        continue;
      }
      mo.month = num; mo.isLeap = false; mo.lunarYear = ly;
      prevNum = num; prevYear = ly;
      num++;
      if (num > 12) { num = 1; ly += 1; }
    }
    cache[year] = months;
    return months;
  }

  function monthsAround(year) {
    return [].concat(buildMonths(year), buildMonths(year + 1));
  }

  // ───── 양력 → 음력 ─────
  function solarToLunar(y, m, d) {
    const day = jdFromDate(y, m, d) + 0.5;   // 그 날의 KST 일자번호와 맞추기
    const dayNum = Math.floor(jdFromDate(y, m, d) + KST + 0.5);
    void day;
    for (const mo of monthsAround(y - 1)) {
      if (dayNum >= mo.start && dayNum < mo.end) {
        return { year: mo.lunarYear, month: mo.month, day: dayNum - mo.start + 1, leap: mo.isLeap };
      }
    }
    return null;
  }

  // ───── 음력 → 양력 ─────
  function lunarToSolar(ly, lm, ld, leap) {
    for (const yr of [ly - 1, ly, ly + 1]) {
      for (const mo of buildMonths(yr)) {
        if (mo.lunarYear === ly && mo.month === lm && !!mo.isLeap === !!leap) {
          const len = mo.end - mo.start;
          if (ld < 1 || ld > len) return { error: `그 달은 ${len}일까지 있습니다.` };
          return dateFromJD(mo.start - 0.5 - KST + 0.5 + (ld - 1));
        }
      }
    }
    return { error: leap ? `${ly}년에는 윤${lm}월이 없습니다.` : '해당 음력 날짜를 찾지 못했습니다.' };
  }

  /** 그 해에 있는 윤달 번호 (없으면 null) */
  function leapMonthOf(ly) {
    for (const yr of [ly, ly + 1]) {
      for (const mo of buildMonths(yr)) if (mo.lunarYear === ly && mo.isLeap) return mo.month;
    }
    return null;
  }
  /** 음력 한 달의 크기 (29 또는 30) */
  function lunarMonthLength(ly, lm, leap) {
    for (const yr of [ly, ly + 1]) {
      for (const mo of buildMonths(yr)) {
        if (mo.lunarYear === ly && mo.month === lm && !!mo.isLeap === !!leap) return mo.end - mo.start;
      }
    }
    return null;
  }

  global.ChaeksaLunar = { solarToLunar, lunarToSolar, leapMonthOf, lunarMonthLength, newMoonUT, winterSolsticeDay };
})(window);
