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
  // 지장간 — 정기가 맨 앞이다(코드가 [0]을 정기로 쓴다). 나머지는 중기·여기.
  //
  // 2026-08-28 개정: 왕지(子卯午酉)의 여기를 살리고, 亥의 여기 戊도 인정했다.
  // 첫 커밋 이후 172번 커밋되는 동안 왕지를 정기 하나로만 두고 있었고, 근거가 없었다.
  // 정기점검도 통과시켰다 — 검사가 '표가 안 깨졌나'만 보고 내용을 안 봤기 때문이다.
  //
  // 통근에는 영향이 없다. 통근은 천간 일치가 아니라 오행 일치로 보는데,
  // 子에 壬을 더해도 水로 같고 卯에 甲, 酉에 庚, 午에 丙도 각각 같은 오행이다.
  // 바뀌는 것은 십신 집계와 격국이다 — 지장간을 전부 펼쳐 세기 때문이다.
  // 예: 甲 일간 午지가 예전엔 「상관·정재」뿐이었는데 이제 丙(식신)이 함께 잡힌다.
  const HIDDEN = [
    [9,8],      // 子: 癸 壬
    [5,9,7],    // 丑: 己 癸 辛
    [0,2,4],    // 寅: 甲 丙 戊
    [1,0],      // 卯: 乙 甲
    [4,1,9],    // 辰: 戊 乙 癸
    [2,6,4],    // 巳: 丙 庚 戊
    [3,5,2],    // 午: 丁 己 丙
    [5,3,1],    // 未: 己 丁 乙
    [6,8,4],    // 申: 庚 壬 戊
    [7,6],      // 酉: 辛 庚
    [4,7,3],    // 戌: 戊 辛 丁
    [8,0,4],    // 亥: 壬 甲 戊
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
    // 진태양시 = 경도 보정 + 균시차.
    //   경도: 135°E 표준자오선 대비 (lon-135)*4분 (서울 -32분, 연중 고정)
    //   균시차: 겉보기 태양시-평균 태양시. -14분(2월)~+16분(11월 초) (astro.js)
    // 예전에는 경도만 반영했다 — 그건 지방 '평균'태양시지 진태양시가 아니다.
    const eotMin = (p.solarCorrection === false || !global.ChaeksaAstro) ? 0
      : global.ChaeksaAstro.equationOfTime(jdUTC);
    let jdLocal = jdUTC + lonDeg / 360 + eotMin / 1440;
    if (p.solarCorrection === false) jdLocal = jdUTC + off / 24;  // 보정 끄면 출생지 표준시 그대로
    const localClock = utcFromJD(jdLocal);        // 보정된 출생 시각(연월일시분)

    // 연주: 입춘 기준. 절기 시각과 출생 시각을 UTC끼리 직접 비교한다 —
    // 균시차가 들어온 뒤로는 지방시 축에 절기를 옮기면 축이 섞인다.
    let year = localClock.y;
    let terms = solarTermsOfYear(year);
    if (jdUTC < terms[0].jd) { year -= 1; terms = solarTermsOfYear(year); }
    const yearStem = ((year - 4) % 10 + 10) % 10;
    const yearBranch = ((year - 4) % 12 + 12) % 12;

    // 월주: 절기 기준 (역시 UTC끼리)
    let monthIdx = 0; // 0=寅
    for (let i = 0; i < 12; i++) { if (jdUTC >= terms[i].jd) monthIdx = i; }
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
    // 절입까지의 일수 — 물리적 간격이므로 UTC끼리 잰다 (축 보정 불필요)
    let daysToTerm;
    if (forward) {
      let next = null;
      for (const t of terms) { if (t.jd > jdUTC) { next = t.jd; break; } }
      if (next == null) next = solarTermsOfYear(year + 1)[0].jd;
      daysToTerm = next - jdUTC;
    } else {
      let prev = null;
      for (const t of terms) { if (t.jd <= jdUTC) prev = t.jd; }
      if (prev == null) prev = solarTermsOfYear(year - 1)[11].jd;
      daysToTerm = jdUTC - prev;
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
      eot: Math.round(eotMin * 10) / 10,                                   // 균시차(분)
      solarOffsetMin: p.solarCorrection === false ? 0
        : Math.round(((lonDeg - 135) * 4 + eotMin) * 10) / 10,             // 총 보정(분, 시계→태양)
      solarYear: year,
      pillars,
      daeun: { forward, startAge: daeunStart, rawDays: daysToTerm, list: daeun },
      analysis: analyze(pillars),
    };
  }

  // ───────── 세력 판정 공용 (분석엔진·체용엔진이 같이 쓴다) ─────────
  /** 원국 자리 가중치 — 월령을 가장 무겁게, 일간 자신은 주체라 제외한다 */
  // 자리 가중 — 2026-08-28 개정. 근거를 세 조건으로 묶어 자유도를 없앴다.
  //
  //   1) 원국 : 운 = 55 : 45   일생을 따질 때의 비율. 원국이 정말 좋으면
  //                            운이 안 좋아도 반은 된다는 뜻이다.
  //   2) 월지 2.0             왕상휴수사. 계절이 오행의 왕쇠를 정한다. 원전이 지지한다.
  //   3) 시지 1.5             월지에서 받은 기운을 자식(시주)에게 0.5 내려준다.
  //                            시지는 '그날 하루의 계절'이라 연지와 동률일 자리가 아니었다.
  //
  // 이 셋을 걸면 나머지 자리의 합이 결정되고, 어떻게 나누든 신강 28~31 · 중화 16~18 ·
  // 신약 52~56 으로 수렴한다(표본 600 실측). 지어낼 여지가 없다.
  //
  // 남은 자리를 0.96 으로 두면 55.0:45.0 이 딱 떨어지지만 그건 나눗셈에서 나온 숫자다.
  // 1.00 으로 두면 55.2:44.8 로 반올림해도 55:45 이면서 자리들이 0.5 씩 내려가는
  // 계단이 된다 — 2.0 → 1.5 → 1.0. '0.5 내려준다'가 한 번이 아니라 규칙이 된다.
  // 두 값의 실측 차이는 신강 30.2% 대 31.0% 로 없는 것이나 같다. 규칙 쪽을 택했다.
  // 천간 셋은 손대지 않았다 — 바꾸는 자리를 줄여야 나중에 무엇이 무엇을 움직였는지 되짚는다.
  //
  // 예전 일지 1.5 는 근거가 없었다. 좌하(딛고 선 자리)도 배우자궁도 근거가 못 된다 —
  // 배우자궁은 배우자의 모습을 보는 자리지 내 세력이 아니다. 그 1.5 를 근거 있는
  // 시지로 넘기고, 일지는 연지와 동률로 내렸다.
  // 천간 자리 가중은 없앴다 — 천간의 힘은 통근에서 나온다(아래 strengthOf 참조).
  const NATAL_WEIGHT = { yearBranch: 1.0, monthBranch: 2.0, dayBranch: 1.0, hourBranch: 1.5 };
  /** 오행 하나가 일간에게 도움(비겁·인성)이면 +1, 소모(식상·재성·관성)면 -1 */
  function siding(dayElemIdx, elemIdx) {
    if (elemIdx === dayElemIdx) return 1;                        // 비겁
    if ((dayElemIdx - elemIdx + 5) % 5 === 1) return 1;          // 인성 (elem이 일간을 生)
    return -1;
  }
  // ───────── 십이운성 (十二運星) ─────────
  // 일간이 각 지지에서 겪는 열두 단계. 양간은 장생지에서 순행, 음간은 역행한다.
  // 음양동생동사(음간도 양간과 같이 보는 판본)가 아니라 역행판을 쓴다 — 사용자 판정.
  const UNSEONG = ['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'];
  const JANGSAENG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];   // 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯

  /** 천간 st 가 지지 br 에서 몇 단계인가 */
  function unseong(st, br) {
    const base = JANGSAENG[st];
    return UNSEONG[STEM_YANG[st] === 1 ? (br - base + 12) % 12 : (base - br + 12) % 12];
  }

  /** 그 지지에 st 의 뿌리(같은 오행)가 암장되어 있는가 */
  function rooted(st, br) {
    return HIDDEN[br].some(h => STEM_ELEM[h] === STEM_ELEM[st]);
  }

  /** 십이운성 세기. 묘(墓)만 통근 여부로 갈린다 — 아래 설명 참조. */
  function power(st, br) {
    const u = unseong(st, br);
    if (u === '묘') return rooted(st, br) ? UNSEONG_POWER.묘고 : UNSEONG_POWER.묘;
    return UNSEONG_POWER[u];
  }

  // 단계별 세기. 삶의 곡선을 따라간다 — 오르는 길은 느리고 내리는 길은 가파르다.
  //
  //   제왕이 정점이고 혼자 솟는다. 건록·관대가 그 아래.
  //   쇠는 제왕 직후라 아직 힘이 남아 장생보다 위다.
  //   목욕은 「도움이 필요한 상태」지 강한 게 아니다 — 환경에 크게 휘둘린다.
  //   양은 아직 길러지는 중이라 목욕보다 아래.
  //   묘가 가장 낮다. 절은 태를 낳는 자리라 바닥은 아니되, 그 힘을 수치로 넣지는 않았다.
  //
  // 궁통보감 120칸에서 계절을 걷어내고 뽑은 순서(건록·제왕·관대 위, 묘·절·태 아래,
  // 목욕 낮음)와 골격이 맞는다. 다만 그 표는 조후 처방이라 사(死)를 강하다고 오독하는
  // 자리가 있어 값 자체는 쓰지 않았다.
  //
  // 묘(墓)는 한 칸이 아니라 두 칸이다. 자평진전 「論十干得時不旺失時不弱」 —
  //   「양간에게 1묘고지는 천간의 1비견보다 뿌리가 강하다. 을이 술을 만나거나
  //    정이 축을 만나는 경우처럼 술중에는 암장된 목이 없고 축에는 암장된 화가 없다.」
  //
  // 실제로 갈린다. 양간의 묘지에는 제 오행이 암장되어 있고 음간의 묘지에는 없다.
  //   甲未[己丁乙] 乙 있음 · 丙戌[戊辛丁] 丁 있음 · 庚丑[己癸辛] 辛 있음 · 壬辰[戊乙癸] 癸 있음
  //   乙戌[戊辛丁] 목 없음 · 丁丑[己癸辛] 화 없음 · 辛辰[戊乙癸] 금 없음 · 癸未[己丁乙] 수 없음
  //
  // 갇힌 것과 없는 것은 다르다. 뿌리가 있으면 0.20(1비견보다 크다), 없으면 0.
  const UNSEONG_POWER = {
    제왕: 1.00, 건록: .82, 관대: .70, 쇠: .62, 장생: .55, 목욕: .50,
    양: .30, 병: .20, 묘고: .20, 태: .15, 사: .08, 절: .05, 묘: 0,
  };

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
        합거: false,   // 아래에서 채운다
        branch: TEN_GODS[tenGod(ds, HIDDEN[pl.branch][0])],   // 지지는 정기 기준
        hidden: HIDDEN[pl.branch].map(h => ({ stem: h, god: TEN_GODS[tenGod(ds, h)] })),
      };
    }
    const de = STEM_ELEM[ds];
    // 강약은 strengthOf 한 곳에서만 낸다. 검사(enginecheck)도 같은 함수를 부른다.
    const { strengthScore, strength, gotMonth, 합거 } = strengthOf(pillars);
    const missing = ELEM.filter((_, i) => elemCount[i] === 0);
    const dominant = ELEM[elemCount.indexOf(Math.max(...elemCount))];
    // 용신 후보(간이) — 라벨 셋을 셋으로 가른다.
    //
    // 예전에는 「신약이 아니면」으로 묶어 중화가 신강과 같은 처방을 받았다.
    // 어느 쪽으로도 안 치우쳤다고 판정해놓고 덜어내라고 한 셈이라 앞뒤가 안 맞았고,
    // 0.449 와 0.451 이 정반대 처방을 받는 벼랑도 거기서 생겼다.
    //
    // 중화는 억부로 처방할 것이 없다. 도울 필요도 덜어낼 필요도 없으니
    // 남는 문제는 「없는 것」이다. 빠진 오행은 강약과 무관하게 평생 약한 고리가 된다.
    // 월별 택일 자료가 '빈 오행 없음'을 만점 조건으로 쓰면서 정작 여기서는
    // 그 값을 안 쓰고 있었다.
    const yong =
      strength === '신약' ? [ELEM[(de + 4) % 5], ELEM[de]] :
      strength === '신강' ? [ELEM[(de + 1) % 5], ELEM[(de + 2) % 5], ELEM[(de + 3) % 5]] :
      // 중화 — 빠진 오행을 채운다. 다 갖췄으면 가장 적은 것을 본다.
      (missing.length ? missing.slice() : [ELEM[elemCount.indexOf(Math.min.apply(null, elemCount))]]);
    // 합거된 자리를 십신에 표시한다 — 그 명령은 지금 없는 것이다.
    Object.keys(합거).forEach(k => { if (gods[k]) gods[k].합거 = true; });
    const 지지관계 = branchRels(pillars);
    return { dayStem: ds, dayElem: ELEM[de], dayYang: STEM_YANG[ds] === 1, elemCount, gods, strength, strengthScore, gotMonth, missing, dominant, yongCandidates: yong, 합거, 지지관계 };
  }

  // ───────── 삼합국(三合局) ─────────
  // 申子辰 수국 · 亥卯未 목국 · 寅午戌 화국 · 巳酉丑 금국.
  //
  // 국이 서면 세 지지가 하나의 덩어리가 된다. 그러면 그 오행의 천간은
  // 지지 하나가 아니라 **국 전체에게 명령을 내린다.**
  //   「임수는 자수에서 제왕으로 받은 게 아니라 신자진 삼합에게 내린 명령이다」
  //
  // 이것은 「명령은 나눠 받는 게 아니라 한 번 제대로 전달되면 된다」는 원칙과
  // 어긋나지 않는다. 나눠 받는 것이 아니라 **하나가 세 자리만큼 크게 받는 것**이다.
  //
  // 완전한 국은 **화(化)한다** — 자평진전. 辰월 丁 일간이 운에서 申 이나 子 를
  // 만나 수국을 이루면 성격(成格)이라고 못박아 두었다. 맑아진다는 것이고, 곧 化 다.
  //
  // **국이 서면 그 셋이 함께 하나의 명령을 받는다.** 그뿐이다.
  //
  //   금이 수로 **바뀌는 것이 아니다.** 申 은 여전히 금이고 庚 의 뿌리다.
  //   辰 도 여전히 토다. 오행 개수는 안 바뀐다. **재성을 잃지 않는다.**
  //   申·辰·子 가 **수라는 명령을 함께 받을 뿐**이다.
  //
  // 그러니 化 의 효과는 하나다 — **壬 이 국 전체에 명령을 내린다.**
  // 천간은 명령이고 지지는 받는 자인데(C1), 국은 그 받는 자가 셋이 뭉친 것이다.
  //
  // 세기는 각 자리 제 것이다. 왕지로 둔갑시키지 않는다.
  // 「申 이 수가 된다」가 아니라 「申 이 수 명령을 받는다」이기 때문이다.
  //
  // 격(格)만은 국을 따른다 — 자평진전이 「삼합을 이루고 성격」이라 못박은 자리다.
  // 격은 「이 자리가 무슨 명령을 받는가」로 잡는 것이라 국이 곧 격이 된다.
  //
  // 반합(왕지 포함 둘)은 아직 넣지 않는다. 표본의 33% 에 걸리는데
  // 「절반이면 얼마」를 우리가 지어내야 하기 때문이다.
  const SAMHAP = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];
  const SAMHAP_ELEM = [4, 0, 1, 3];   // 水 木 火 金

  /** 자리 목록 [[지지, 자리무게], ...] 에서 완전 삼합국을 찾는다.
   *  같은 글자가 여러 자리에 있으면 그 자리들을 다 담는다(운이 겹쳐 얹히는 경우). */
  function samhapOf(자리) {
    const out = [];
    SAMHAP.forEach((g, gi) => {
      const 있 = 자리.filter(([b]) => g.indexOf(b) >= 0);
      const 글자 = {};
      있.forEach(([b]) => { 글자[b] = 1; });
      if (Object.keys(글자).length !== 3) return;
      out.push({ elem: SAMHAP_ELEM[gi], 왕지: g[1], 글자: g.slice(), 자리: 있,
                 무게: 있.reduce((a, [, w]) => a + w, 0) });
    });
    return out;
  }

  /** 化 한 지지 → 그 국의 왕지. 완전한 국을 이룬 세 지지는 왕지처럼 작동한다. */
  function hwaOf(자리, 국) {
    const m = {};
    (국 || samhapOf(자리)).forEach(g => { g.글자.forEach(b => { m[b] = g; }); });
    return m;
  }

  /** 천간의 힘 — 통근한 자리 하나, 또는 그 천간이 부리는 국 전체. 센 쪽을 쓴다.
   *
   *  국을 부리는 천간은 그 자리들을 **하나로 묶어** 쓴다 — 세기는 각자 제 것이다.
   *  국이 섰다고 남의 뿌리를 뺏지는 않는다. 申 은 수 명령을 받으면서도 여전히
   *  금이고 庚 의 뿌리다. 한 지지가 두 몫을 하는 것이 이상한 일이 아니다 —
   *  지장간이 원래 그렇게 생겼다. */
  function stemPower(st, 자리, 국) {
    let best = Math.max.apply(null, 자리.map(([b, w]) => w * power(st, b)));
    (국 || samhapOf(자리)).forEach(g => {
      if (STEM_ELEM[st] !== g.elem) return;    // 국의 오행과 같은 천간만 국을 부린다
      const v = g.자리.reduce((acc, [b, w]) => acc + w * power(st, b), 0);
      if (v > best) best = v;
    });
    return best;
  }

  // ───────── 천간합(合去) ─────────
  // 甲己 · 乙庚 · 丙辛 · 丁壬 · 戊癸. 다섯 쌍이고 언제나 5칸 떨어져 있다.
  //
  // 합화(合化)는 보지 않는다. 오행이 통째로 바뀌어 계산은 크게 흔들리는데
  // 정작 나오는 길흉은 별로 안 움직인다 — 값어치보다 위험이 크다.
  //
  // 합거(合去)는 다르다. 천간은 명령이고 지지는 받는 자인데, 합에 묶인 천간은
  // 명령을 못 낸다. 그 자리는 비고, 그 사람은 그동안 자기 명령이 아니라
  // 운(해·달·날)의 천간이 주는 명령을 받는다.
  // 그래서 계수가 없다. 깎는 게 아니라 없는 것이라 0이다.
  //
  // 일간은 합거하지 않는다. 주체는 남에게 끌려가지 않는다.
  const isHap = (a, b) => (a - b + 10) % 10 === 5;

  /** 원국 천간끼리의 합거. 일간은 빼고, 붙어 있는 연간-월간만 본다.
   *  월간-시간은 일간을 사이에 둔 격합(隔合)이라 여기서는 세지 않는다.
   *
   *  쟁합(같은 천간이 둘이면 합이 안 된다)은 넣지 않는다. 시간을 합 상대로는
   *  안 세면서 방해자로만 세는 것이 앞뒤가 안 맞았다 — 참여 못 하면 방해도 못 한다. */
  function natalHap(pillars) {
    const out = {};
    if (isHap(pillars.year.stem, pillars.month.stem)) { out.year = 'month'; out.month = 'year'; }
    return out;
  }

  // ───────── 형충회합 — 순서대로 푼다 ─────────
  // 규칙이 없어서 안 닫힌 게 아니라 **적용 순서가 없어서** 안 닫혔다.
  // 순서를 정하면 그 자리에서 결정론이 된다.
  //
  //   삼합 > 육합 > 충 > 형      — 2026-08-28 사장님 판정
  //
  // 형은 안 본다(B1). 그래서 우리에게 남는 순서는 삼합 > 반합 > 육합 > 충 이다.
  // 반합이 육합보다 위인 것은 사장님 예시가 정해준다 —
  //   「년지 유금 월지 묘목 일지 술토라서 묘술합으로 묘유충이 일어나지 않았으나
  //     시지 오화가 있어서 오술삼합으로 묘유충이 성립된다」
  // 午戌 반합이 卯戌 육합을 이겨야 이 문장이 성립한다.
  //
  // **소진된다.** 한 지지는 하나와만 결합한다 — 戌 이 午 에게 가면 卯 를 놓는다.
  // 이것은 통근과 층위가 다르다. 申 이 수국에 들어도 庚 의 뿌리인 것은
  // **천간이 지지에서 받는 것**이라 소진이 없고, 지지끼리의 결합은 배타적이다.
  //
  // **합이 충을 막는다(貪合忘冲).** 합에 쓰인 자리는 충을 못 한다.
  //
  // 방합(삼회 寅卯辰 …)은 아직 안 넣는다. 삼합과의 우열을 안 정했다.
  const YUKHAP = { 0:1, 1:0, 2:11, 11:2, 3:10, 10:3, 4:9, 9:4, 5:8, 8:5, 6:7, 7:6 };
  const SEAT_KO = ['연지', '월지', '일지', '시지'];

  /** 형충회합을 순서대로 해소한다.
   *  @param 자리 [[지지, 자리이름], ...]  원국 넷 + (운이 있으면 그 지지)
   *  @return { 성립:[...], 보류:[...] }   보류는 「왜 성립 못 했는가」까지 남긴다
   */
  function resolveBranches(자리) {
    const 쓴 = {}, 성립 = [], 보류 = [];
    const 첫자리 = (b) => { for (let i = 0; i < 자리.length; i++) if (자리[i][0] === b) return i; return -1; };
    const 후보 = [];
    // 완전 삼합 (3자)
    SAMHAP.forEach(g => {
      const 자 = g.map(첫자리);
      if (자.every(i => i >= 0)) 후보.push({ 급: 3, 이름: '삼합', 자리들: 자, 글자: g.map(b => BRANCHES[b]).join('') });
    });
    // 반합 — 왕지 + 하나
    SAMHAP.forEach(g => {
      const 왕 = 첫자리(g[1]);
      if (왕 < 0) return;
      [g[0], g[2]].forEach(b => {
        const j = 첫자리(b);
        if (j >= 0) 후보.push({ 급: 2, 이름: '반합', 자리들: [왕, j], 글자: BRANCHES[g[1]] + BRANCHES[b] });
      });
    });
    // 육합
    for (let i = 0; i < 자리.length; i++) for (let j = i + 1; j < 자리.length; j++)
      if (YUKHAP[자리[i][0]] === 자리[j][0])
        후보.push({ 급: 1, 이름: '육합', 자리들: [i, j], 글자: BRANCHES[자리[i][0]] + BRANCHES[자리[j][0]] });

    후보.sort((x, y) => y.급 - x.급);
    후보.forEach(c => {
      if (c.자리들.some(i => 쓴[i])) {
        보류.push({ 종류: c.이름, 글자: c.글자, 사유: '이미 쓰인 자리라 성립 못 함' });
        return;
      }
      c.자리들.forEach(i => { 쓴[i] = 1; });
      성립.push({ 종류: c.이름, 글자: c.글자, 자리: c.자리들.map(i => 자리[i][1]),
                  격지: c.자리들.some(i => 자리[i][1] === '월지') });
    });
    // 충 — 합에 안 쓰인 자리끼리만 (貪合忘冲)
    for (let i = 0; i < 자리.length; i++) for (let j = i + 1; j < 자리.length; j++) {
      const a = 자리[i][0], b = 자리[j][0];
      if ((b - a + 12) % 12 !== 6) continue;
      const 글자 = BRANCHES[a] + BRANCHES[b];
      if (쓴[i] || 쓴[j])
        보류.push({ 종류: '충', 글자,
                    사유: `${자리[쓴[i] ? i : j][1]}가 합에 묶여 못 함 (貪合忘冲)` });
      else
        성립.push({ 종류: '충', 글자, 자리: [자리[i][1], 자리[j][1]],
                    격지: 자리[i][1] === '월지' || 자리[j][1] === '월지' });
    }
    return { 성립, 보류 };
  }

  /** 원국 지지의 형충회합. 순서대로 해소한 결과를 낸다. */
  function branchRels(pillars, 추가) {
    const 자리 = [[pillars.year.branch, '연지'], [pillars.month.branch, '월지'],
                  [pillars.day.branch, '일지']];
    if (pillars.hour) 자리.push([pillars.hour.branch, '시지']);
    (추가 || []).forEach(v => 자리.push(v));
    return resolveBranches(자리);
  }

  // ───────── 판정이 갈리는 자리 ─────────
  // 여기서부터는 계산이 아니라 판정이다. 판본이 갈리고, 어느 쪽을 잡느냐로
  // 결과가 크게 달라진다. 기계가 정할 수 없는 자리다.
  //
  // 무료 엔진은 **가장 보수적인 쪽**으로 계산한다(반합 안 봄, 격합 안 봄).
  // 그러나 갈린다는 사실을 숨기지 않는다 — 숨기면 무료가 조용히 틀린 답을 준다.
  // 「이 사주는 여기서 갈립니다」까지가 무료고, 「그래서 어느 쪽입니다」가 유료다.
  //
  // 완전 삼합의 化 는 여기 없다 — 자평진전이 못박아 둔 자리라 판정이 끝났다(C6).
  const BANHAP_W = 0.6;   // 반합을 국으로 볼 때의 임시 계수. 근거 없음 — 갈래 보여주기용

  /** 이 사주에서 판정이 갈리는 자리들. 기준은 본 계산(strengthOf)과 같다. */
  function forks(pillars) {
    const W = NATAL_WEIGHT, ds = pillars.day.stem, de = STEM_ELEM[ds];
    const 자리 = [
      [pillars.year.branch,  W.yearBranch],
      [pillars.month.branch, W.monthBranch],
      [pillars.day.branch,   W.dayBranch],
    ];
    if (pillars.hour) 자리.push([pillars.hour.branch, W.hourBranch]);

    // 갈래별 강약을 내는 국소 계산기 (본 계산을 건드리지 않는다)
    const 점수 = (opt) => {
      opt = opt || {};
      const 국 = samhapOf(자리);
      const 반 = [];
      if (opt.반합) SAMHAP.forEach((g, gi) => {
        const 있 = 자리.filter(([b]) => g.indexOf(b) >= 0);
        const 종류 = {}; 있.forEach(([b]) => { 종류[b] = 1; });
        if (Object.keys(종류).length === 2 && 종류[g[1]])
          반.push({ elem: SAMHAP_ELEM[gi], 왕지: g[1], 무게: 있.reduce((a, [, w]) => a + w, 0) });
      });
      const 힘 = (st) => {
        let best = stemPower(st, 자리, 국);
        반.forEach(g => {
          if (STEM_ELEM[st] !== g.elem) return;
          const v = g.무게 * power(st, g.왕지) * BANHAP_W;
          if (v > best) best = v;
        });
        return best;
      };
      const 합거 = natalHap(pillars);
      if (opt.격합 && pillars.hour && isHap(pillars.month.stem, pillars.hour.stem)
          && !합거.month && !합거.hour) { 합거.month = 'hour'; 합거.hour = 'month'; }
      const 명령 = (k, st) => (합거[k] ? 0 : 힘(st));
      const stems = [[STEM_ELEM[pillars.year.stem], 명령('year', pillars.year.stem)],
                     [STEM_ELEM[pillars.month.stem], 명령('month', pillars.month.stem)]];
      if (pillars.hour) stems.push([STEM_ELEM[pillars.hour.stem], 명령('hour', pillars.hour.stem)]);
      let sup = 0, tot = 0;
      stems.forEach(([el, w]) => { tot += w; if (siding(de, el) > 0) sup += w; });
      자리.forEach(([b, w]) => { tot += w; sup += w * power(ds, b); });
      const got = BRANCH_ELEM[pillars.month.branch] === de || BRANCH_ELEM[pillars.month.branch] === (de + 4) % 5;
      if (got) { sup += 0.6; tot += 0.6; }
      const v = tot ? Math.round((sup / tot) * 100) / 100 : 0.5;
      return { score: v, label: STRENGTH_LABEL(v) };
    };

    const 기준 = 점수();
    const out = [];
    const 재다 = (이름, 사실, 갈래, opt) => {
      const b = 점수(opt);
      if (b.score === 기준.score) return;
      out.push({ 이름, 사실, 무료: `${기준.label} ${기준.score}`, 갈래, 다른쪽: `${b.label} ${b.score}` });
    };

    // 1. 반합을 국으로 볼 것인가
    SAMHAP.forEach((g, gi) => {
      const 종류 = {}; 자리.forEach(([b]) => { if (g.indexOf(b) >= 0) 종류[b] = 1; });
      const ks = Object.keys(종류);
      if (ks.length !== 2 || !종류[g[1]]) return;
      재다('반합',
        `${ks.map(b => BRANCHES[+b]).join('')} — ${ELEM[SAMHAP_ELEM[gi]]}국의 왕지를 낀 둘`,
        '반합도 국으로 세면', { 반합: true });
    });
    // 2. 격합 — 일간을 사이에 둔 월간-시간의 합
    if (pillars.hour && isHap(pillars.month.stem, pillars.hour.stem)) {
      재다('격합',
        `월간 ${STEMS[pillars.month.stem]} 과 시간 ${STEMS[pillars.hour.stem]} 이 합이다 (일간을 사이에 둔다)`,
        '격합도 합거로 세면', { 격합: true });
    }
    // ── 아래 둘은 점수로 재지 않는다. **감지하고 알리기만 한다.** ──
    //
    // 부분만 넣으면 안 되는 것들이 있다. 충을 넣으면 방합이 물려 오고,
    // 삼합을 넣으면 충이 물려 온다. 반쪽으로 박으면 안 넣느니만 못하다.
    // 그래서 판정은 사람에게 넘기고, 엔진은 「여기가 그 자리다」만 말한다.

    // 3. 격지가 충을 맞았는가
    const 격충 = branchRels(pillars).성립.filter(r => r.격지 && r.종류 === '충');
    격충.forEach(r => out.push({
      이름: '격지 충', 사실: `${r.자리.join(' ↔ ')} ${r.글자} 충 — 격을 잡는 월지가 맞고 있다`,
      무료: '충을 격 판정에 안 쓴다',
      갈래: '충으로 격이 깨진다고 보면 · 형까지 보면 이 충이 무력해질 수도',
      다른쪽: '격 판정이 뒤집힐 수 있다',
    }));

    // 4. 변격 — 월지가 국에 들어 격이 월지 정기가 아니라 국으로 잡힌다
    const 월국 = samhapOf(자리).filter(g => g.글자.indexOf(pillars.month.branch) >= 0)[0];
    if (월국) {
      const 정기십신 = TEN_GODS[tenGod(ds, HIDDEN[pillars.month.branch][0])];
      // 국의 십신은 **typecard.gyeok 과 같은 규칙**으로 낸다 —
      // 국 오행 천간 중 원국에 투출한 것으로 정/편을 가르고, 없으면 왕지의 본기.
      // 여기서 왕지 본기만 쓰면 gyeok 은 정관격, forks 는 편관격이 되어 두 벌이 어긋난다.
      let 국천간 = null;
      for (let st = 0; st < 10; st++) {
        if (STEM_ELEM[st] !== 월국.elem) continue;
        if (['year', 'month', 'hour'].some(k => pillars[k] && pillars[k].stem === st)) { 국천간 = st; break; }
      }
      if (국천간 == null) 국천간 = HIDDEN[월국.왕지][0];
      const 국십신 = TEN_GODS[tenGod(ds, 국천간)];
      if (정기십신 !== 국십신) out.push({
        이름: '변격',
        // 한자 뒤의 조사는 우리말 읽기의 받침으로 고른다 — 「辰가」가 아니라 「辰이」다.
        사실: (() => {
          const ko = BRANCHES_KO[pillars.month.branch] || '';
          const c = ko.charCodeAt(ko.length - 1);
          const 받침 = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
          return `월지 ${BRANCHES[pillars.month.branch]}(${ko})${받침 ? '이' : '가'} `
            + `${월국.글자.map(b => BRANCHES[b]).join('')} ${ELEM[월국.elem]}국에 들었다`;
        })(),
        무료: `국으로 잡는다 — ${국십신}격 (자평진전)`,
        갈래: '국을 안 보고 월지 정기로 잡으면',
        다른쪽: `${정기십신}격 — 다른 사주가 된다`,
      });
    }
    return out;
  }

  /** 기둥만으로 강약을 낸다. analyze() 와 검사(enginecheck)가 **같은 이 함수**를 쓴다.
   *  예전에는 검사가 공식을 베껴 갖고 있어서, 엔진을 고쳐도 검사는 제 사본만 재고 있었다. */
  function strengthOf(pillars) {
    const ds = pillars.day.stem, de = STEM_ELEM[ds], W = NATAL_WEIGHT;
    const month = pillars.month.branch;
    const gotMonth = BRANCH_ELEM[month] === de || BRANCH_ELEM[month] === (de + 4) % 5;

    // ── 천간의 힘은 통근에서 나온다 ──
    // 천간은 명령이고 지지는 그 명령을 받는 자다. 받을 지지가 없으면
    // 전달되지 않은 명령이라 있으나 마나다. 뿌리 없는 칠살은 으르렁대기만 하고
    // 못 문다 — 뿌리 얻은 칠살이라야 진짜로 친다.
    //
    // 그러니 천간에 고정 무게를 주면 안 된다. 예전에는 연간 .5 월간 .8 시간 .5 를
    // 박아두고 거기에 전달도를 곱했는데, 그 셋은 근거 없는 숫자였다.
    //
    //   천간의 힘 = 통근한 지지의 자리 무게 × 그 지지에서의 십이운성 세기
    //
    // 명령은 한 번 제대로 전달되면 되는 것이지 여러 곳에서 나눠 받는 게 아니다.
    // 그래서 가장 세게 받은 자리 하나로 본다. 어느 지지가 받았는지가 무게를 정하므로
    // 월지가 받은 명령이 연지가 받은 것보다 무겁다.
    //
    // 천간이 놓인 자리(연·월·시)는 힘에 관여하지 않는다. 뜬 것은 어디 떠 있어도 뜬 것이다.
    const 지지자리 = [
      [pillars.year.branch,  W.yearBranch],
      [pillars.month.branch, W.monthBranch],
      [pillars.day.branch,   W.dayBranch],
    ];
    if (pillars.hour) 지지자리.push([pillars.hour.branch, W.hourBranch]);
    const 국 = samhapOf(지지자리);
    const 천간힘 = (st) => stemPower(st, 지지자리, 국);

    // 합거된 천간은 명령을 못 낸다 — 깎는 것이 아니라 0이다.
    const 합거 = natalHap(pillars);
    const 명령 = (key, st) => (합거[key] ? 0 : 천간힘(st));

    const stems = [
      [STEM_ELEM[pillars.year.stem],  명령('year',  pillars.year.stem)],
      [STEM_ELEM[pillars.month.stem], 명령('month', pillars.month.stem)],
    ];
    // 지지는 십이운성으로 본다. 예전에는 지지 오행이 일간을 돕느냐만 보아
    // 寅(건록)과 卯(제왕)를, 亥(장생)와 子(목욕)를 똑같이 세었다.
    // 궁통보감이 寅월 甲에겐 丙을, 卯월 甲에겐 庚을 쓰라고 정반대로 처방하는데도.
    const branches = 지지자리;
    if (pillars.hour) stems.push([STEM_ELEM[pillars.hour.stem], 명령('hour', pillars.hour.stem)]);
    // 일간이 지지에서 받는 것은 십이운성이라 化 와 무관하다 — 축이 다르다.
    // 申 이 수로 化 해도 丁 에게 申 은 여전히 목욕이다. 化 는 소속을 바꾸지 자리를 안 바꾼다.
    let sup = 0, tot = 0;
    for (const [elem, w] of stems) { tot += w; if (siding(de, elem) > 0) sup += w; }
    for (const [br, w] of branches) { tot += w; sup += w * power(ds, br); }
    // 왕상휴수사 — 득령이면 가산 0.6 (비대칭: 실령을 더 깎지는 않는다).
    // 본기 방식에서 득령의 무게가 월지 한 자리(2.0)뿐이라 건록·양인격의 21%가
    // 신약으로 떨어졌다. 가산 후 10%로, 앵커 7사례와 실령 사주 판정은 전부 보존.
    if (gotMonth) { sup += 0.6; tot += 0.6; }
    const score = tot ? Math.round((sup / tot) * 100) / 100 : 0.5;
    return { strengthScore: score, strength: STRENGTH_LABEL(score), gotMonth, 합거 };
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

  /** 그 날짜의 총 진태양시 보정(분) = (경도-135)*4 + 균시차. 한국 정오 기준.
   *  시계 시각 + 이 값 = 태양시. (서울 11월 말 약 -19분, 2월 중순 약 -46분) */
  function solarOffsetMin(y, m, d, lonDeg) {
    const lon = lonDeg == null ? 127.0 : lonDeg;
    const jd = jdFromUTC(y, m, d, 3, 0);   // 한국 정오 = UTC 03시
    const eot = global.ChaeksaAstro ? global.ChaeksaAstro.equationOfTime(jd) : 0;
    return Math.round(((lon - 135) * 4 + eot) * 10) / 10;
  }

  global.ChaeksaEngine = { calc, dateFortune, currentDaeun, tenGod, fmt, solarOffsetMin, NATAL_WEIGHT, siding, STRENGTH_LABEL, strengthOf, isHap, natalHap, samhapOf, stemPower, hwaOf, forks, branchRels, resolveBranches, unseong, power, UNSEONG, UNSEONG_POWER, STEMS, BRANCHES, ELEM, STEM_ELEM, BRANCH_ELEM, STEM_YANG, TEN_GODS, HIDDEN, STEMS_KO, BRANCHES_KO };
})(typeof window !== 'undefined' ? window : globalThis);
