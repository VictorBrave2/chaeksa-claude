/* 궁극의 책사 — 만세력 엔진 v1.0
 * 순수 계산. AI 없음. 입력: 생년월일시(KST 기준 시계 시간) → 출력: 원국·대운·오늘 일진.
 */
(function (global) {
  'use strict';

  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const STEMS_KO = ['갑','을','병','정','무','기','경','신','임','계'];
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const BRANCHES_KO = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
  const BRANCH_ANIMAL = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
  const ELEM = ['목','화','토','금','수'];
  const STEM_ELEM = [0,0,1,1,2,2,3,3,4,4];          // 甲乙木 丙丁火 戊己土 庚辛金 壬癸水
  const STEM_YANG = [1,0,1,0,1,0,1,0,1,0];
  const BRANCH_ELEM = [4,2,0,0,2,1,1,2,3,3,2,4];     // 子水 丑土 寅木 卯木 辰土 巳火 午火 未土 申金 酉金 戌土 亥水
  const BRANCH_YANG = [1,0,1,0,1,0,1,0,1,0,1,0];
  // 지장간 (정기 맨 앞)
  const HIDDEN = [
    [9],        // 子: 癸
    [5,9,7],    // 丑: 己 癸 辛
    [0,2,4],    // 寅: 甲 丙 戊
    [1],        // 卯: 乙
    [4,1,9],    // 辰: 戊 乙 癸
    [2,6,4],    // 巳: 丙 庚 戊
    [3,5],      // 午: 丁 己
    [5,3,1],    // 未: 己 丁 乙
    [6,8,4],    // 申: 庚 壬 戊
    [7],        // 酉: 辛
    [4,7,3],    // 戌: 戊 辛 丁
    [8,0],      // 亥: 壬 甲
  ];
  const SOLAR_TERMS = ['입춘','경칩','청명','입하','망종','소서','입추','백로','한로','입동','대설','소한']; // 절(節)만, 寅월부터
  const TEN_GODS = ['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'];

  // ───────── 날짜 유틸 ─────────
  function jdFromUTC(y, m, d, hh, mm) {
    // 그레고리력 → 율리우스일(소수)
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    const jd0 = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    return jd0 + (hh + mm / 60) / 24;
  }
  function utcFromJD(jd) {
    const Z = Math.floor(jd + 0.5), F = jd + 0.5 - Z;
    let A = Z;
    if (Z >= 2299161) { const a = Math.floor((Z - 1867216.25) / 36524.25); A = Z + 1 + a - Math.floor(a / 4); }
    const B = A + 1524, C = Math.floor((B - 122.1) / 365.25), D = Math.floor(365.25 * C), E = Math.floor((B - D) / 30.6001);
    const day = B - D - Math.floor(30.6001 * E);
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;
    let totalMin = Math.round(F * 24 * 60);
    if (totalMin >= 1440) totalMin = 1439; // 자정 넘김 방지(반올림)
    return { y: year, m: month, d: day, hh: Math.floor(totalMin / 60), mm: totalMin % 60 };
  }

  // 한국 표준시 오프셋(시간). 역사적 UTC+8:30 구간과 1987~88 서머타임 반영.
  function kstOffsetHours(y, m, d, hh) {
    const n = y * 10000 + m * 100 + d;
    if (n >= 19080401 && n <= 19111231) return 8.5;
    if (n >= 19540321 && n <= 19610809) return 8.5;
    // 서머타임(일광절약시간) 1987.5.10 02:00 ~ 10.11 03:00, 1988.5.8 02:00 ~ 10.9 03:00
    if ((y === 1987 && n >= 19870510 && n <= 19871011) || (y === 1988 && n >= 19880508 && n <= 19881009)) {
      if (n === 19870510 && hh < 2) return 9; if (n === 19871011 && hh >= 3) return 9;
      if (n === 19880508 && hh < 2) return 9; if (n === 19881009 && hh >= 3) return 9;
      return 10;
    }
    return 9;
  }

  // ───────── 태양 황경: astro.js(VSOP87, 분 단위 정확) 우선, 없으면 Meeus 간이식 ─────────
  function sunLongitude(jd) {
    if (global.ChaeksaAstro) return global.ChaeksaAstro.apparentSunLongitude(jd);
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
            + 0.000289 * Math.sin(3 * M);
    const omega = (125.04 - 1934.136 * T) * Math.PI / 180;
    let lon = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
    lon = ((lon % 360) + 360) % 360;
    return lon;
  }
  // jd 부근에서 황경이 target(도)이 되는 시각을 찾는다 (이분법)
  function findTermJD(targetLon, jdGuess) {
    let lo = jdGuess - 20, hi = jdGuess + 20;
    const diff = (jd) => { let d = sunLongitude(jd) - targetLon; d = ((d + 180) % 360 + 360) % 360 - 180; return d; };
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (diff(mid) < 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  // 특정 연도의 12절(입춘~소한) UTC JD 목록. 입춘(315°)은 그 해 2월, 소한(285°)은 다음 해 1월.
  const _termCache = new Map();
  function solarTermsOfYear(year) {
    const hit = _termCache.get(year);
    if (hit) return hit;
    const out = _solarTermsOfYear(year);
    _termCache.set(year, out);
    return out;
  }
  function _solarTermsOfYear(year) {
    const out = [];
    for (let i = 0; i < 12; i++) {
      const lon = (315 + 30 * i) % 360;
      // 대략적인 날짜 추정: 입춘 2/4 기준 + 30.44일씩
      const guess = jdFromUTC(year, 2, 4, 0, 0) + i * 30.44;
      out.push({ name: SOLAR_TERMS[i], lon, jd: findTermJD(lon, guess), monthBranch: (2 + i) % 12 });
    }
    return out;
  }

  // ───────── 핵심: 사주 계산 ─────────
  /**
   * @param {Object} p
   * @param {number} p.year,p.month,p.day  양력 생년월일
   * @param {number} p.hour,p.minute        시계 시간(KST). 시간 모르면 hour=null
   * @param {'M'|'F'} p.gender
   * @param {number} [p.longitude=127.0]    출생지 경도(진태양시 보정용). 서울 126.98
   * @param {boolean} [p.solarCorrection=true]
   */
  function calc(p) {
    // 연·월·일은 반드시 숫자여야 한다. 문자열이 섞여 들어오면(다른 기기에서 동기화된
    // 옛 기록 등) kstOffsetHours 의 엄격 비교가 조용히 빗나가 서머타임 보정이 빠진다.
    p = Object.assign({}, p, {
      year: Number(p.year), month: Number(p.month), day: Number(p.day),
      longitude: p.longitude == null || p.longitude === '' ? null : Number(p.longitude),
      tzOffset: p.tzOffset == null || p.tzOffset === '' ? null : Number(p.tzOffset),
    });
    if (!Number.isFinite(p.year) || !Number.isFinite(p.month) || !Number.isFinite(p.day))
      throw new Error('생년월일이 올바르지 않습니다.');
    const lonDeg = p.longitude == null ? 127.0 : p.longitude;
    const hourKnown = p.hour != null && p.hour !== '';
    const hh = hourKnown ? Number(p.hour) : 12, mm = hourKnown ? Number(p.minute || 0) : 0;

    // 해외 출생이면 그 나라 표준시를, 한국이면 역사적 표준시(8:30 구간·서머타임)를 쓴다
    const off = (p.tzOffset != null && p.tzOffset !== '')
      ? Number(p.tzOffset)
      : kstOffsetHours(p.year, p.month, p.day, hh);
    // 시계시간 → UTC JD
    let jdUTC = jdFromUTC(p.year, p.month, p.day, hh, mm) - off / 24;
    // 진태양시(지방 평균태양시) 보정: 경도 기준. 135°E 표준자오선 대비 (lon-135)*4분
    let jdLocal = jdUTC + lonDeg / 360;          // 지방 평균태양시
    if (p.solarCorrection === false) jdLocal = jdUTC + off / 24;  // 보정 끄면 출생지 표준시 그대로
    const localClock = utcFromJD(jdLocal);        // 보정된 출생 시각(연월일시분)

    // 연주: 입춘 기준
    let year = localClock.y;
    let terms = solarTermsOfYear(year);
    const ipchunLocal = terms[0].jd + (p.solarCorrection === false ? off / 24 : lonDeg / 360);
    if (jdLocal < ipchunLocal) { year -= 1; terms = solarTermsOfYear(year); }
    const yearStem = ((year - 4) % 10 + 10) % 10;
    const yearBranch = ((year - 4) % 12 + 12) % 12;

    // 월주: 절기 기준
    const shift = p.solarCorrection === false ? off / 24 : lonDeg / 360;
    let monthIdx = 0; // 0=寅
    for (let i = 0; i < 12; i++) { if (jdLocal >= terms[i].jd + shift) monthIdx = i; }
    const monthBranch = (2 + monthIdx) % 12;
    const monthStem = ((yearStem % 5) * 2 + 2 + monthIdx) % 10;

    // 일주: 23시 이후는 다음날로(야자시 → 익일 자시 처리)
    let dayJD = Math.floor(jdLocal + 0.5); // 해당 날짜의 JDN (정오 기준)
    // 시주는 '표시되는 시각'과 같은 기준으로 잡는다.
    // 분 아래를 살려두면 태양시 08:59.95 가 화면에 09:00 으로 찍히면서
    // 표시는 巳시인데 계산은 辰시가 되는 모순이 생긴다.
    // 출생 시각은 어차피 분 단위로 기록되므로 초 단위 정밀도는 허상이다.
    const localHour = localClock.hh + localClock.mm / 60;
    if (hourKnown && localHour >= 23) dayJD += 1;
    const dayIdx = ((dayJD + 49) % 60 + 60) % 60;
    const dayStem = dayIdx % 10, dayBranch = dayIdx % 12;

    // 시주
    let hourStem = null, hourBranch = null;
    if (hourKnown) {
      hourBranch = Math.floor(((localHour + 1) % 24) / 2);
      hourStem = ((dayStem % 5) * 2 + hourBranch) % 10;
    }

    const pillars = {
      year: { stem: yearStem, branch: yearBranch },
      month: { stem: monthStem, branch: monthBranch },
      day: { stem: dayStem, branch: dayBranch },
      hour: hourKnown ? { stem: hourStem, branch: hourBranch } : null,
    };

    // 대운
    const yangYear = STEM_YANG[yearStem] === 1;
    const forward = (yangYear && p.gender === 'M') || (!yangYear && p.gender === 'F');
    let daysToTerm;
    if (forward) {
      // 다음 절
      let next = null;
      for (const t of terms) { if (t.jd + shift > jdLocal) { next = t.jd + shift; break; } }
      if (next == null) next = solarTermsOfYear(year + 1)[0].jd + shift;
      daysToTerm = next - jdLocal;
    } else {
      let prev = null;
      for (const t of terms) { if (t.jd + shift <= jdLocal) prev = t.jd + shift; }
      if (prev == null) prev = solarTermsOfYear(year - 1)[11].jd + shift;
      daysToTerm = jdLocal - prev;
    }
    const daeunYears = Math.floor(daysToTerm / 3);
    const daeunMonths = Math.round(((daysToTerm / 3) % 1) * 12);
    const daeunStart = Math.max(1, daeunYears + (daeunMonths >= 6 ? 1 : 0)); // 관행상 반올림
    const daeun = [];
    for (let i = 1; i <= 9; i++) {
      const s = ((monthStem + (forward ? i : -i)) % 10 + 10) % 10;
      const b = ((monthBranch + (forward ? i : -i)) % 12 + 12) % 12;
      const startAge = daeunStart + (i - 1) * 10;
      daeun.push({ stem: s, branch: b, startAge, startYear: year + startAge, endAge: startAge + 9 });
    }

    return {
      input: p,
      corrected: localClock,
      solarYear: year,
      pillars,
      daeun: { forward, startAge: daeunStart, rawDays: daysToTerm, list: daeun },
      analysis: analyze(pillars),
    };
  }

  // ───────── 세력 판정 공용 (분석엔진·체용엔진이 같이 쓴다) ─────────
  /** 원국 자리 가중치 — 월령을 가장 무겁게, 일간 자신은 주체라 제외한다 */
  const NATAL_WEIGHT = { yearStem: .5, yearBranch: .8, monthStem: .8, monthBranch: 2.0, dayBranch: 1.5, hourStem: .5, hourBranch: .8 };
  /** 오행 하나가 일간에게 도움(비겁·인성)이면 +1, 소모(식상·재성·관성)면 -1 */
  function siding(dayElemIdx, elemIdx) {
    if (elemIdx === dayElemIdx) return 1;                        // 비겁
    if ((dayElemIdx - elemIdx + 5) % 5 === 1) return 1;          // 인성 (elem이 일간을 生)
    return -1;
  }
  /** 강약 경계 — 이 프로젝트 전체에서 이 함수 하나만 쓴다 */
  const STRENGTH_LABEL = (score) => score >= .55 ? '신강' : (score >= .45 ? '중화' : '신약');

  // ───────── 분석: 십신, 오행 분포 ─────────
  function tenGod(dayStem, otherStem) {
    const de = STEM_ELEM[dayStem], oe = STEM_ELEM[otherStem];
    const same = STEM_YANG[dayStem] === STEM_YANG[otherStem];
    const rel = ((oe - de) % 5 + 5) % 5; // 0 비겁 1 식상 2 재성 3 관성 4 인성
    return rel * 2 + (same ? 0 : 1);
  }
  function analyze(pillars) {
    const ds = pillars.day.stem;
    const elemCount = [0,0,0,0,0];
    const list = ['year','month','day','hour'].filter(k => pillars[k]);
    const gods = {};
    for (const k of list) {
      const pl = pillars[k];
      elemCount[STEM_ELEM[pl.stem]] += 1;
      elemCount[BRANCH_ELEM[pl.branch]] += 1;
      gods[k] = {
        stem: k === 'day' ? null : TEN_GODS[tenGod(ds, pl.stem)],
        branch: TEN_GODS[tenGod(ds, HIDDEN[pl.branch][0])],   // 지지는 정기 기준
        hidden: HIDDEN[pl.branch].map(h => ({ stem: h, god: TEN_GODS[tenGod(ds, h)] })),
      };
    }
    // 신강/신약: 자리 가중 세력 판정 (일간 자신은 주체이므로 세력에서 제외한다)
    // 체용엔진(chaeyong.js)이 층을 쌓을 때 쓰는 것과 같은 공식·같은 경계를 쓴다.
    const month = pillars.month.branch;
    const de = STEM_ELEM[ds];
    const gotMonth = BRANCH_ELEM[month] === de || BRANCH_ELEM[month] === (de + 4) % 5;
    const W = NATAL_WEIGHT;
    const seats = [
      [STEM_ELEM[pillars.year.stem],    W.yearStem],
      [BRANCH_ELEM[pillars.year.branch], W.yearBranch],
      [STEM_ELEM[pillars.month.stem],   W.monthStem],
      [BRANCH_ELEM[pillars.month.branch], W.monthBranch],
      [BRANCH_ELEM[pillars.day.branch], W.dayBranch],
    ];
    if (pillars.hour) {
      seats.push([STEM_ELEM[pillars.hour.stem], W.hourStem]);
      seats.push([BRANCH_ELEM[pillars.hour.branch], W.hourBranch]);
    }
    let sup = 0, tot = 0;
    for (const [elem, w] of seats) { tot += w; if (siding(de, elem) > 0) sup += w; }
    const strengthScore = tot ? Math.round((sup / tot) * 100) / 100 : 0.5;
    const strength = STRENGTH_LABEL(strengthScore);
    const missing = ELEM.filter((_, i) => elemCount[i] === 0);
    const dominant = ELEM[elemCount.indexOf(Math.max(...elemCount))];
    // 용신 후보(간이): 신강이면 식상·재·관 중 많은 것 설기, 신약이면 인·비
    const yong = strength === '신약' ? [ELEM[(de + 4) % 5], ELEM[de]] : [ELEM[(de + 1) % 5], ELEM[(de + 2) % 5], ELEM[(de + 3) % 5]];
    return { dayStem: ds, dayElem: ELEM[de], dayYang: STEM_YANG[ds] === 1, elemCount, gods, strength, strengthScore, gotMonth, missing, dominant, yongCandidates: yong };
  }

  // ───────── 오늘/특정 날짜의 운 ─────────
  const _dfCache = new Map();
  function dateFortune(y, m, d) {
    const k = y * 10000 + m * 100 + d;
    const hit = _dfCache.get(k);
    if (hit) return hit;
    const r = calc({ year: y, month: m, day: d, hour: 12, minute: 0, gender: 'M', solarCorrection: false });
    const out = { year: r.pillars.year, month: r.pillars.month, day: r.pillars.day };
    if (_dfCache.size > 20000) _dfCache.clear();
    _dfCache.set(k, out);
    return out;
  }
  function currentDaeun(result, onDate) {
    const age = onDate.getFullYear() - result.solarYear; // 세는 나이 근사 (만 나이 아님)
    return result.daeun.list.find(du => age >= du.startAge && age <= du.endAge) || null;
  }

  // ───────── 표기 ─────────
  const fmt = {
    stem: (i) => STEMS[i], branch: (i) => BRANCHES[i],
    stemKo: (i) => STEMS_KO[i], branchKo: (i) => BRANCHES_KO[i],
    pillar: (p) => p ? STEMS[p.stem] + BRANCHES[p.branch] : '―',
    pillarKo: (p) => p ? STEMS_KO[p.stem] + BRANCHES_KO[p.branch] : '―',
    stemElem: (i) => ELEM[STEM_ELEM[i]], branchElem: (i) => ELEM[BRANCH_ELEM[i]],
    animal: (i) => BRANCH_ANIMAL[i],
    termsOfYear: (y) => solarTermsOfYear(y).map(t => ({ name: t.name, ...utcFromJD(t.jd + 9 / 24) })),
  };

  global.ChaeksaEngine = { calc, dateFortune, currentDaeun, tenGod, fmt, NATAL_WEIGHT, siding, STRENGTH_LABEL, STEMS, BRANCHES, ELEM, STEM_ELEM, BRANCH_ELEM, STEM_YANG, TEN_GODS, HIDDEN, STEMS_KO, BRANCHES_KO };
})(typeof window !== 'undefined' ? window : globalThis);
