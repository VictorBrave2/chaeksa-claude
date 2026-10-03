/* 출산택일 신청서 읽개 — 「이렇게 읽었어요」 (10-02 설계서 ② · 2-2)
 *
 * 신청서 칸의 글(출산 예정 기간 · 태어날 지역 · 가족 생년월일시 · 수술 가능한 시간대 · 받아 둔 날짜 · 예정일)을 값으로 읽기만 한다.
 * **판정은 한 줄도 없다.** 음력을 양력으로 바꾸기 · 일주 · 명식은 엔진(비공개 서버 lib/taekil-engine.js)이 한다.
 * 화면(신청서 칸 밑 한 줄)과 서버가 이 파일 하나를 같이 쓴다 — 서버는 tools/sync-vendor.js 로 바이트 그대로 옮겨 vm 에 싣는다.
 *
 * 못 읽으면 지어내지 않는다.
 *  - 모르는 곳을 서울로 바꾸지 않는다(places.js resolve 의 조용한 서울 대체를 안 쓴다) — places 표에 정확히 있는 이름만 받는다.
 *  - 경기도 광주처럼 표의 이름(광주광역시)과 도가 어긋나면 받지 않는다 — 경도가 다르면 시주가 달라진다.
 *  - 가족 칸에 글이 있는데 날짜를 못 읽으면 막는다. 비워 두는 것은 괜찮다(가족은 부딪히는 곳을 거르는 체일 뿐이다).
 * 날짜 셈은 모두 UTC 달력으로 한다 — 서버 시간대(UTC · 서울 · 뉴욕)에 흔들리지 않게.
 * 화면 글은 「이렇게 읽었어요」 한 줄과 막힐 때의 까닭뿐이다(작가 검수 대상).
 */
(function (global) {
  'use strict';

  const 상한 = 31;                                   // 기간 상한(일) — 설계서 7 기본값(서버 300초 한도 안)
  const 요일 = '일월화수목금토';
  const 두 = (n) => (n < 10 ? '0' : '') + n;
  const iso = (y, m, d) => y + '-' + 두(m) + '-' + 두(d);
  const 풀어 = (s) => { const t = String(s).split('-').map(Number); return { y: t[0], m: t[1], d: t[2] }; };
  const 일번호 = (s) => { const a = 풀어(s); return Date.UTC(a.y, a.m - 1, a.d) / 864e5; };
  const 차 = (a, b) => 일번호(b) - 일번호(a);         // b − a (일)
  const 있는날 = (y, m, d) => {
    if (!(y >= 1900 && y <= 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return false;
    const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
  };
  const 요일말 = (s) => { const a = 풀어(s); return 요일[new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay()]; };
  const 받침 = (s) => { const t = String(s).replace(/\([^)]*\)\s*$/, '').trim(); if (!t) return false; const c = t.charCodeAt(t.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && ((c - 0xAC00) % 28) !== 0; };
  const 은는 = (s) => s + (받침(s) ? '은' : '는');

  /** 오늘(한국 날짜). 시험 · 서버는 opt.오늘 = 'YYYY-MM-DD' 로 박는다(같은 글은 언제 읽어도 같은 값). */
  function 오늘값(opt) {
    if (opt && /^\d{4}-\d{2}-\d{2}$/.test(String(opt.오늘 || ''))) return opt.오늘;
    const t = new Date(Date.now() + 9 * 3600e3);
    return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  }

  /** '2027-04-12' → '4월 12일(월)' · 해도=true 면 '2027년 4월 12일(월)' */
  function 날말(s, 해도) { const a = 풀어(s); return (해도 ? a.y + '년 ' : '') + a.m + '월 ' + a.d + '일(' + 요일말(s) + ')'; }

  /** 0시부터 센 분 → '오전 9시 30분' (옛 생성기 tools_sangdam_gen.py 때말 그대로) */
  function 때말(분) {
    const h = Math.floor(분 / 60), m = 분 % 60;
    let s;
    if (h === 0) s = '밤 12시';
    else if (h < 6) s = '새벽 ' + h + '시';
    else if (h < 12) s = '오전 ' + h + '시';
    else if (h === 12) s = '낮 12시';
    else if (h < 18) s = '오후 ' + (h - 12) + '시';
    else if (h < 21) s = '저녁 ' + (h - 12) + '시';
    else s = '밤 ' + (h - 12) + '시';
    return s + (m ? ' ' + m + '분' : '');
  }

  /** 글 다듬기 — 전각 숫자 · 물결 · 요일 괄호를 고른다. 뜻은 안 바꾼다. */
  function 고름(s) {
    return String(s == null ? '' : s)
      .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/[～∼〜–—―－]/g, '~').replace(/．/g, '.').replace(/／/g, '/').replace(/：/g, ':').replace(/（/g, '(').replace(/）/g, ')')
      .replace(/\(\s*[월화수목금토일]\s*(?:요일)?\s*\)/g, ' ')
      .replace(/[ \t 　]+/g, ' ').trim();
  }
  const 빈말 = /^(?:모름|모릅니다|모르겠어요|몰라요|없음|없어요|없습니다|해당\s*없음|미상|무|-+|x|X|\.)\s*[.!]?$/;

  /* ── 날짜 (기간 · 병원 날짜 · 받아 둔 날짜 · 예정일) — 해는 빠져도 된다 ── */
  const 날꼴 = /(\d{4})\s*[.\-\/]\s*(\d{1,2})\s*[.\-\/]\s*(\d{1,2})\.?|(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?|(\d{4})(\d{2})(\d{2})(?!\d)|(\d{1,2})\s*월\s*(\d{1,2})\s*일?|(\d{1,2})\s*[.\/]\s*(\d{1,2})(?![\d.:\/])|(\d{1,2})\s*일/g;
  function 날토큰(t) {
    const out = []; let m; 날꼴.lastIndex = 0;
    while ((m = 날꼴.exec(t))) {
      let y = null, mo = null, d = null, 낱날 = false;
      if (m[1]) { y = +m[1]; mo = +m[2]; d = +m[3]; }
      else if (m[4]) { y = +m[4]; mo = +m[5]; d = +m[6]; }
      else if (m[7]) { y = +m[7]; mo = +m[8]; d = +m[9]; }
      else if (m[10]) { mo = +m[10]; d = +m[11]; }
      else if (m[12]) { mo = +m[12]; d = +m[13]; }
      else { d = +m[14]; 낱날 = true; }
      out.push({ y, m: mo, d, 낱날, 앞: m.index, 뒤: m.index + m[0].length });
    }
    return out;
  }
  /** 해가 없는 날의 해 — 근처(기간 첫날)가 있으면 그 앞뒤 해 가운데 가장 가까운 해, 없으면 오늘부터 앞으로(한 달 전까지는 올해). */
  function 해찾기(m, d, 기준) {
    if (기준.근처) {
      const 가 = 풀어(기준.근처).y;
      let best = null;
      [가 - 1, 가, 가 + 1].forEach((y) => { if (!있는날(y, m, d)) return; const g = Math.abs(차(기준.근처, iso(y, m, d))); if (!best || g < best.g) best = { y, g }; });
      return best ? best.y : 가;
    }
    const 오 = 풀어(기준.오늘);
    const y = 오.y;
    return (있는날(y, m, d) && 차(기준.오늘, iso(y, m, d)) >= -31) ? y : y + 1;
  }
  function 날풀기(토큰, 기준) {
    const out = []; let 앞 = null;
    토큰.forEach((k) => {
      let y = k.y, m = k.m, d = k.d;
      const 해적음 = k.y != null;
      if (k.낱날) {
        const 바탕 = 앞 || (기준.근처 ? 풀어(기준.근처) : null);
        if (!바탕) return;
        y = 바탕.y; m = 바탕.m;
        if (앞 && d < 앞.d) { m += 1; if (m > 12) { m = 1; y += 1; } }      // 4월 28일 ~ 3일 → 5월 3일
      } else if (y == null) {
        if (앞) { y = 앞.y; if (m < 앞.m) y += 1; }                          // 12월 28일 ~ 1월 5일
        else y = 해찾기(m, d, 기준);
      }
      if (!있는날(y, m, d)) return;
      앞 = { y, m, d };
      out.push({ 날: iso(y, m, d), 해적음, 앞: k.앞, 뒤: k.뒤 });
    });
    return out;
  }
  // 날짜로 읽으면 안 되는 「일」 — 임신 주수(39주 5일) · 기간 길이(5일간) · 앞뒤 며칠(전후 3일)
  const 주수꼴 = /\d+\s*주(?:\s*\d+\s*일)?/g, 길이꼴 = /\d{1,2}\s*일\s*(?:간|동안|이내)/g;
  const 앞뒤꼴 = /(?:전후|앞뒤|±|\+-|\+\/-)\s*(\d{1,2})\s*일/;

  /** 예정일 — 「예정일 4월 20일」 「4월 20일이 예정일」. 글들 = [[칸, 글], …]. 처음 찾은 하나. */
  function 예정일찾기(글들, 기준) {
    for (const [칸, 글] of 글들) {
      const t = 고름(글); const i = t.indexOf('예정일'); if (i < 0) continue;
      const 뒤글 = t.slice(i + 3, i + 3 + 30), 뒤토 = 날풀기(날토큰(뒤글), 기준);
      if (뒤토.length && 뒤토[0].앞 <= 6) return { 날: 뒤토[0].날, 칸, 말: '예정일 ' + 날말(뒤토[0].날), 자리: [i, i + 3 + 뒤토[0].뒤] };
      const s = Math.max(0, i - 30), 앞토 = 날풀기(날토큰(t.slice(s, i)), 기준), k = 앞토[앞토.length - 1];
      if (k && (i - s) - k.뒤 <= 6) return { 날: k.날, 칸, 말: '예정일 ' + 날말(k.날), 자리: [s + k.앞, i + 3] };
    }
    return null;
  }

  /** 출산 예정 기간 → { 값: { 첫날, 끝날, 날수 } | null, 말, 막힘 } */
  function 기간(글, opt) {
    const 오늘 = 오늘값(opt);
    let t = 고름(글);
    if (!t) return { 값: null, 말: '적지 않았어요 — 예) 2027년 4월 12일 ~ 16일', 막힘: true };
    const 예 = 예정일찾기([['range', t]], { 오늘 });
    if (예) t = t.slice(0, 예.자리[0]) + ' ' + t.slice(예.자리[1]);   // 예정일은 기간이 아니다
    const 앞뒤 = t.match(앞뒤꼴);
    t = t.replace(주수꼴, ' ').replace(길이꼴, ' ').replace(앞뒤꼴, ' ');
    t = t.replace(/(^|[^\d])(\d{2})\s*년/g, (m, a, yy) => a + '20' + yy + '년');   // 27년 → 2027년(낳을 날은 앞날)
    t = t.replace(/(\d{4}\s*[.\/]\s*\d{1,2}\s*[.\/]\s*\d{1,2})\s*-\s*(\d{1,2})(?![\d.\/\-])/g, '$1 ~ $2일')   // 2027.4.12-16
      .replace(/~\s*(\d{1,2})(?![\d.\/\-:]|\s*[월일시])/g, '~ $1일');                                              // 2027-4-12~16
    const 날들 = 날풀기(날토큰(t), { 오늘 });
    if (!날들.length) return { 값: null, 말: '날짜를 읽지 못했어요 — 예) 2027년 4월 12일 ~ 16일', 막힘: true };
    let 첫날 = 날들[0].날, 끝날 = 날들[날들.length - 1].날;
    if (날들.length === 1 && 앞뒤) { const n = +앞뒤[1]; 끝날 = 더하기(첫날, n); 첫날 = 더하기(첫날, -n); }
    if (차(첫날, 끝날) < 0) return { 값: null, 말: '끝날이 첫날보다 앞이에요 — 날짜를 확인해 주세요', 막힘: true };
    const 날수 = 차(첫날, 끝날) + 1;
    const a = 풀어(첫날), b = 풀어(끝날);
    const 끝말 = a.y !== b.y ? 날말(끝날, true) : (a.m !== b.m ? 날말(끝날) : b.d + '일(' + 요일말(끝날) + ')');
    const 말 = 날말(첫날, true) + (날수 > 1 ? ' ~ ' + 끝말 : '') + ', ' + 날수 + '일';
    if (날수 > 상한) return { 값: { 첫날, 끝날, 날수 }, 말: 말 + ' — ' + 상한 + '일 안으로 줄여 주세요', 막힘: true };
    if (차(오늘, 끝날) < 0) return { 값: { 첫날, 끝날, 날수 }, 말: 말 + ' — 지난 날짜예요. 연도를 확인해 주세요', 막힘: true };
    return { 값: { 첫날, 끝날, 날수 }, 말, 막힘: false };
  }
  function 더하기(s, n) { const a = 풀어(s), t = new Date(Date.UTC(a.y, a.m - 1, a.d + n)); return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); }

  /* ── 시각 ── 「오후 3시 10분」 「15:10」 「밤 11시 반」 「자정」 */
  const 때꼴 = /(오전|오후|새벽|아침|낮|저녁|밤|AM|PM|am|pm)?\s*(\d{1,2})\s*(?::\s*(\d{2})|시\s*(?:(\d{1,2})\s*분|(반))?)|(자정|정오)/g;
  /** 꾸밈말 + 시 · 분 → 0시부터 센 분. 못 읽으면 null. */
  function 시로(꾸밈, h, mi) {
    if (!(h >= 0 && h <= 24 && mi >= 0 && mi <= 59)) return null;
    const k = String(꾸밈 || '').toLowerCase();
    if (k === '오후' || k === '저녁' || k === 'pm') { if (h < 12) h += 12; }
    else if (k === '밤') { if (h === 12) h = 0; else if (h >= 6 && h < 12) h += 12; }
    else if (k === '낮') { if (h <= 5) h += 12; }
    else if (k === '오전' || k === '새벽' || k === '아침' || k === 'am') { if (h === 12) h = 0; }
    if (h === 24) h = 0;
    if (h > 23) return null;
    return h * 60 + mi;
  }
  function 때토큰(t) {
    const out = []; let m; 때꼴.lastIndex = 0;
    while ((m = 때꼴.exec(t))) {
      if (m[6]) { out.push({ 꾸밈: '', h: m[6] === '자정' ? 0 : 12, mi: 0, 분: m[6] === '자정' ? 0 : 720, 앞: m.index, 뒤: m.index + m[0].length }); continue; }
      const h = +m[2], mi = m[3] != null ? +m[3] : (m[4] != null ? +m[4] : (m[5] ? 30 : 0));
      const 분 = 시로(m[1], h, mi);
      if (분 != null) out.push({ 꾸밈: m[1] || '', h, mi, 분, 앞: m.index, 뒤: m.index + m[0].length });
    }
    return out;
  }

  /** 수술 가능한 시간대 → { 값: { 시작, 끝(그 분은 안 듦), 평일만 } | null, 주말: true|false|null, 말, 못읽음 } */
  function 시간대(글) {
    const t = 고름(글);
    const 주말 = /주말\s*(?:도|에도|이나|은|에는)?\s*(?:가능|돼|되|괜찮|ok)/i.test(t) ? true
      : (/주말\s*(?:은|에는|도)?\s*(?:불가|안\s*돼|안\s*되|제외|어려|안\s*함)/.test(t) ? false : null);
    if (!t || 빈말.test(t)) return { 값: null, 주말, 말: '적지 않았어요 — 시간 제한 없이 봐요', 못읽음: false };
    if (/상관\s*없|무관|아무\s*때|언제든|제한\s*없/.test(t)) return { 값: null, 주말, 말: '시간 제한 없이 봐요', 못읽음: false };
    const 평일만 = /평일/.test(t) && 주말 !== true;
    let 시작 = null, 끝 = null;
    const 범위 = t.match(/(오전|오후|새벽|아침|낮|저녁|밤)?\s*(\d{1,2})(?:\s*:\s*(\d{2}))?\s*(?:시\s*(?:(\d{1,2})\s*분|(반))?)?\s*(?:~|-|부터|에서)\s*(오전|오후|새벽|아침|낮|저녁|밤)?\s*(\d{1,2})(?:\s*:\s*(\d{2}))?\s*(?:시\s*(?:(\d{1,2})\s*분|(반))?)?/);
    const 분값 = (h, a, b, c) => [+h, a != null ? +a : (b != null ? +b : (c ? 30 : 0))];
    if (범위) {
      const [h1, m1] = 분값(범위[2], 범위[3], 범위[4], 범위[5]), [h2, m2] = 분값(범위[7], 범위[8], 범위[9], 범위[10]);
      시작 = 시로(범위[1], h1, m1);
      const 뒤꾸밈 = 범위[6] || (/^(오후|저녁|밤)$/.test(범위[1] || '') ? 범위[1] : '');
      끝 = 뒤꾸밈 ? 시로(뒤꾸밈, h2, m2) : (h2 === 24 && m2 === 0 ? 1440 : 시로('', h2, m2));
      if (!뒤꾸밈 && 시작 != null && 끝 != null && 끝 <= 시작 && h2 < 12) 끝 += 720;   // 오전 9시 ~ 7시 → 저녁 7시
    } else {
      const k = 때토큰(t);
      if (k.length >= 2) { 시작 = k[0].분; 끝 = k[1].분; if (끝 <= 시작 && !k[1].꾸밈 && k[1].h < 12) 끝 += 720; }
      else if (k.length === 1 && /이후|부터|넘어|지나/.test(t.slice(k[0].뒤))) { 시작 = k[0].분; 끝 = 1440; }
      else if (k.length === 1 && /이전|까지|전에|전까지/.test(t.slice(k[0].뒤))) { 시작 = 0; 끝 = k[0].분; }
    }
    if (시작 == null || 끝 == null || !(끝 > 시작) || 끝 > 1440) return { 값: null, 주말, 말: '시간을 읽지 못했어요 — 시간 제한 없이 봐요. 예) 오전 9시 ~ 저녁 7시', 못읽음: true };
    return { 값: { 시작, 끝, 평일만 }, 주말, 말: 때말(시작) + ' ~ ' + 때말(끝) + (평일만 ? ' · 평일' : ''), 못읽음: false };
  }

  /** 날짜 여럿(병원이 말한 날짜) → { 값: ['YYYY-MM-DD'…], 말, 못읽음 } */
  function 날짜들(글, opt) {
    const 오늘 = 오늘값(opt), t = 고름(글);
    if (!t || 빈말.test(t)) return { 값: [], 말: '적지 않았어요', 못읽음: false };
    const 날 = 날풀기(날토큰(t.replace(주수꼴, ' ').replace(길이꼴, ' ')), { 오늘, 근처: opt && opt.근처 }).map((x) => x.날);
    const 값 = 날.filter((x, i) => 날.indexOf(x) === i);
    if (!값.length) return { 값: [], 말: '날짜를 읽지 못했어요 — 날짜 없이 봐요', 못읽음: true };
    return { 값, 말: 값.map((x) => 날말(x)).join(' · '), 못읽음: false };
  }

  /** 받아 둔 날짜 · 시간 → { 값: [{ 날, 분|null }], 말, 못읽음 } — 날짜마다 그 뒤에 오는 시각을 짝짓는다. */
  function 시각들(글, opt) {
    const 오늘 = 오늘값(opt), t = 고름(글);
    if (!t || 빈말.test(t)) return { 값: [], 말: '적지 않았어요', 못읽음: false };
    const 날 = 날풀기(날토큰(t), { 오늘, 근처: opt && opt.근처 });
    const 값 = 날.map((x, i) => {
      const 뒤글 = t.slice(x.뒤, i + 1 < 날.length ? 날[i + 1].앞 : t.length), k = 때토큰(뒤글)[0];
      return { 날: x.날, 분: k ? k.분 : null };
    });
    if (!값.length) return { 값: [], 말: '날짜를 읽지 못했어요', 못읽음: true };
    return { 값, 말: 값.map((x) => 날말(x.날) + (x.분 != null ? ' ' + 때말(x.분) : '(시각 없음)')).join(' · '), 못읽음: false };
  }

  /* ── 태어날 지역 ── places 표의 이름만. 도 · 나라 이름은 거른다. ── */
  const 도말 = { 경기도: '경기', 경기: '경기', 강원도: '강원', 강원특별자치도: '강원', 강원: '강원', 충청북도: '충북', 충북: '충북',
    충청남도: '충남', 충남: '충남', 전라북도: '전북', 전북특별자치도: '전북', 전북: '전북', 전라남도: '전남', 전남: '전남',
    경상북도: '경북', 경북: '경북', 경상남도: '경남', 경남: '경남', 제주특별자치도: '제주', 제주도: '제주' };
  const 시도 = { 서울: '서울', 부산: '부산', 인천: '인천', 대구: '대구', 대전: '대전', 광주: '광주', 울산: '울산', 세종: '세종',
    수원: '경기', 성남: '경기', 춘천: '강원', 강릉: '강원', 원주: '강원', 청주: '충북', 천안: '충남', 전주: '전북', 목포: '전남', 여수: '전남',
    안동: '경북', 포항: '경북', 창원: '경남', 진주: '경남', 제주: '제주', 서귀포: '제주' };
  const 나라 = /^(?:한국|대한민국|미국|일본|중국|대만|홍콩|싱가포르|필리핀|태국|베트남|인도네시아|인도|아랍에미리트|러시아|영국|프랑스|독일|이탈리아|캐나다|브라질|호주|뉴질랜드)$/;
  const 꼬리 = ['특별자치시', '특별자치도', '특별시', '광역시', '시', '군', '구', '읍', '면', '동'];
  function 표() {
    const PL = global.ChaeksaPlaces || {};
    return { 안: (PL.KOREA || []).map((c) => c[0]), 밖: (PL.ABROAD || []).map((c) => ({ 이름: c[0], tz: c[1] })) };
  }
  function 이름찾기(tok, T) {
    const 맞 = (s) => (T.안.indexOf(s) >= 0 ? { 이름: s, 해외: false } : (T.밖.find((c) => c.이름 === s) ? { 이름: s, 해외: true } : null));
    let f = 맞(tok); if (f) return f;
    for (const k of 꼬리) if (tok.length > k.length + 1 && tok.slice(-k.length) === k) { f = 맞(tok.slice(0, -k.length)); if (f) return f; }
    return null;
  }
  /** 태어날 지역 → { 값: 'KR:성남' | 'AB:뉴욕' | null, 이름, 해외, 말, 막힘 } */
  function 곳(글) {
    const t = 고름(글).replace(/[.,·()\/]+/g, ' ').trim();
    if (!t || 빈말.test(t)) return { 값: null, 말: '적지 않았어요 — 시 · 군 이름으로 적어 주세요', 막힘: true };
    const T = 표(); let 도 = null; const 찾음 = [];
    t.split(/\s+/).forEach((tok) => {
      if (도말[tok]) { 도 = 도말[tok]; return; }
      if (나라.test(tok)) return;
      const f = 이름찾기(tok, T); if (f && !찾음.some((x) => x.이름 === f.이름)) 찾음.push(f);
    });
    if (!찾음.length) {   // 띄어 쓰지 않은 글(경기도성남시) — 도 이름을 떼고 표의 이름이 하나만 들어 있으면 받는다
      let r = t.replace(/\s+/g, '');
      Object.keys(도말).sort((a, b) => b.length - a.length).forEach((w) => { if (r.indexOf(w) === 0) { 도 = 도 || 도말[w]; r = r.slice(w.length); } });
      T.안.concat(T.밖.map((c) => c.이름)).sort((a, b) => b.length - a.length).forEach((n) => {
        if (r.indexOf(n) >= 0) { r = r.split(n).join(' '); 찾음.push({ 이름: n, 해외: T.안.indexOf(n) < 0 }); }
      });
    }
    if (!찾음.length) return { 값: null, 말: (도 ? '시 · 군 이름까지 적어 주세요' : '목록에서 찾지 못했어요 — 시 · 군 이름으로 적어 주세요'), 막힘: true };
    if (찾음.length > 1) return { 값: null, 말: '지역이 둘 보여요(' + 찾음.map((x) => x.이름).join(' · ') + ') — 한 곳만 적어 주세요', 막힘: true };
    const f = 찾음[0];
    if (!f.해외 && 도 && 시도[f.이름] && 시도[f.이름] !== 도) return { 값: null, 말: 은는(도 + ' ' + f.이름) + ' 목록에 없어요 — 가까운 시 이름으로 적어 주세요', 막힘: true };
    if (f.해외) {
      const tz = T.밖.find((c) => c.이름 === f.이름).tz;
      return { 값: 'AB:' + f.이름, 이름: f.이름, 해외: true, 말: f.이름 + '(UTC' + (tz >= 0 ? '+' : '') + tz + ' 기준)', 막힘: false };
    }
    return { 값: 'KR:' + f.이름, 이름: f.이름, 해외: false, 말: f.이름, 막힘: false };
  }

  /* ── 가족 생년월일시 ── 해는 넷(1990) · 둘(90년) · 붙여 쓰기(19900210 · 900210). 음력 · 윤달 · 시 모름. ── */
  const 생꼴 = /(\d{4})\s*[.\-\/]\s*(\d{1,2})\s*[.\-\/]\s*(\d{1,2})\.?|(\d{4})\s*년\s*(윤\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일?|(\d{2})\s*년\s*(윤\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일?|(\d{2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2})(?![\d:])|(\d{4})(\d{2})(\d{2})(?!\d)|(\d{2})(\d{2})(\d{2})(?!\d)/g;
  const 가름 = /[,;\n]|\s\/\s|그리고|및/;
  const 음꼴 = /음력|\(\s*음\s*\)|(?:^|[^가-힣])음(?=[^가-힣]|$)/, 양꼴 = /양력|\(\s*양\s*\)|(?:^|[^가-힣])양(?=[^가-힣]|$)/;
  const 윤꼴 = /윤\s*달|\(\s*윤\s*\)|(?:^|[^가-힣])윤(?=[^가-힣]|$)/, 모름꼴 = /모름|모르|몰라|미상|기억/;
  const 시진꼴 = /(?:^|[^가-힣])([자축인묘진사오미신유술해])시/;
  /** 한 칸의 글 → { 적음, 목록: [{ y, m, d, 달력, 달력적음, 윤달, 시: {h, mi}|null, 시진, 말 }], 못읽음 } */
  function 생일들(글, opt) {
    const 오늘 = 오늘값(opt), 오 = 풀어(오늘), t = 고름(글);
    if (!t || 빈말.test(t)) return { 적음: false, 목록: [], 못읽음: false };
    const 토 = []; let m; 생꼴.lastIndex = 0;
    while ((m = 생꼴.exec(t))) {
      let y, mo, d, 윤 = false;
      if (m[1]) { y = +m[1]; mo = +m[2]; d = +m[3]; }
      else if (m[4]) { y = +m[4]; 윤 = !!m[5]; mo = +m[6]; d = +m[7]; }
      else if (m[8]) { y = +m[8]; 윤 = !!m[9]; mo = +m[10]; d = +m[11]; }
      else if (m[12]) { y = +m[12]; mo = +m[13]; d = +m[14]; }
      else if (m[15]) { y = +m[15]; mo = +m[16]; d = +m[17]; }
      else { y = +m[18]; mo = +m[19]; d = +m[20]; }
      if (y < 100) y += (y <= 오.y % 100 ? 2000 : 1900);
      토.push({ y, m: mo, d, 윤, 앞: m.index, 뒤: m.index + m[0].length });
    }
    const 목록 = [];
    토.forEach((k, i) => {
      let 뒤글 = t.slice(k.뒤, i + 1 < 토.length ? 토[i + 1].앞 : t.length);
      let 앞글 = t.slice(i ? 토[i - 1].뒤 : 0, k.앞);
      const 끊 = 뒤글.search(가름); if (끊 >= 0) 뒤글 = 뒤글.slice(0, 끊);
      const 앞끊 = 앞글.split(가름); 앞글 = 앞끊[앞끊.length - 1];
      const 뒤말 = 뒤글.replace(/\([^)]*\d[^)]*\)/g, ' '), 앞말 = 앞글.replace(/\([^)]*\d[^)]*\)/g, ' ');   // 괄호 속 다른 날짜(음력 11월 8일)의 말은 이 날짜 말이 아니다
      const 윤달 = k.윤 || 윤꼴.test(뒤말) || 윤꼴.test(앞말);
      const 음 = 윤달 || 음꼴.test(뒤말) || (!양꼴.test(뒤말) && 음꼴.test(앞말));
      const 달력적음 = 윤달 || 음꼴.test(뒤말) || 양꼴.test(뒤말) || 음꼴.test(앞말) || 양꼴.test(앞말);
      if (음 ? !(k.y >= 1900 && k.y <= 오.y && k.m >= 1 && k.m <= 12 && k.d >= 1 && k.d <= 30) : !(있는날(k.y, k.m, k.d) && 차(iso(k.y, k.m, k.d), 오늘) >= 0)) return;
      const 때 = 때토큰(뒤글)[0], 진 = !때 && 뒤글.match(시진꼴);
      const 시 = 때 ? { h: Math.floor(때.분 / 60), mi: 때.분 % 60 } : null;
      const 시말 = 시 ? 때말(때.분) : (진 ? 진[1] + '시(시각은 모름)' : '태어난 시 모름');
      const 달말 = 음 ? (윤달 ? '음력 윤달' : '음력') : (달력적음 ? '양력' : '양력(따로 적지 않아 양력으로 봤어요)');
      목록.push({ y: k.y, m: k.m, d: k.d, 달력: 음 ? '음력' : '양력', 달력적음, 윤달, 시, 시진: 진 ? 진[1] + '시' : null,
        말: k.y + '년 ' + k.m + '월 ' + k.d + '일 · ' + 달말 + ' · ' + 시말 });
    });
    if (!목록.length) return { 적음: true, 목록: [], 못읽음: true };
    return { 적음: true, 목록, 못읽음: false };
  }

  const 성별말 = { 남아: ['M', '남아'], 여아: ['F', '여아'], 모름: ['모름', '아직 몰라요'] };
  const 앞세움말 = { 무난: '두루 무난하게', 재물: '재물', 자리: '자리(직업·지위)', 건강: '건강', 학업: '공부', 가족: '가족 화목' };
  const 가족칸 = [['father', '아버님', '아버지 생년월일시'], ['mother', '어머님', '어머니 생년월일시'], ['siblings', '형제자매', '형제자매 생년월일']];

  /** 신청서 한 장(ChaeksaPay.주문서.값 꼴) → 읽은 값 전부 + 「이렇게 읽었어요」 줄 + 막힘.
   *  opt.오늘 = 'YYYY-MM-DD'(기본 한국 오늘). 가족 날짜는 음력이면 음력 그대로 둔다 — 바꾸는 것은 엔진 몫이다. */
  function 읽기(d, opt) {
    d = d || {}; const 오늘 = 오늘값(opt);
    const 줄 = [], 막힘 = [], 못읽음 = [];
    const 넣 = (칸, 이름, 말, 막, 못) => { 줄.push({ 칸, 이름, 말, 막힘: !!막 }); if (막) 막힘.push(이름 + ' — ' + 말); if (못 || 막) 못읽음.push(칸); };

    const 기 = 기간(d.range, { 오늘 }); 넣('range', '출산 예정 기간', 기.말, 기.막힘);
    const 근처 = 기.값 ? 기.값.첫날 : null, 기준 = { 오늘, 근처 };
    const 자리 = 곳(d.place); 넣('place', '태어날 지역', 자리.말, 자리.막힘);
    const 성 = 성별말[d.sex] || null;
    넣('sex', '아이 성별', 성 ? 성[1] : '고르지 않았어요 — 아직 모름으로 봐요');
    const 시 = 시간대(d.time); 넣('time', '수술 가능한 시간대', 시.말, false, 시.못읽음);
    const 주말 = !!d.weekend || 시.주말 === true;
    넣('weekend', '주말', 주말 ? '주말도 봐요' : '주말은 빼고 봐요');
    const 병글 = 고름(d.hospital), 병예 = 예정일찾기([['hospital', 병글]], 기준);   // 「예정일 4월 20일」은 병원이 말한 수술 날짜가 아니다
    const 병 = 날짜들(병예 ? 병글.slice(0, 병예.자리[0]) + ' ' + 병글.slice(병예.자리[1]) : 병글, 기준); 넣('hospital', '병원이 말한 날짜', 병.말, false, 병.못읽음);
    const 받 = 시각들(d.have, 기준); 넣('have', '이미 받아 두신 날짜·시간', 받.말, false, 받.못읽음);
    넣('first', '가장 앞세우고 싶은 것', 앞세움말[d.first] || '고르지 않았어요');
    const 가족 = [];
    가족칸.forEach(([칸, 호칭, 이름]) => {
      const g = 생일들(d[칸], { 오늘 });
      if (!g.적음) { 넣(칸, 이름, '적지 않았어요'); return; }
      if (g.못읽음) { 넣(칸, 이름, '날짜를 읽지 못했어요 — 예) 1990년 2월 10일 · 양력 · 오전 7시 30분', true); return; }
      let 목 = g.목록, 덧 = '';
      if (칸 !== 'siblings' && 목.length > 1) {   // 한 분에 날짜가 둘 — 양력이라고 적은 것, 없으면 음력이 아닌 것, 없으면 첫째
        const 고 = 목.find((x) => x.달력 === '양력' && x.달력적음) || 목.find((x) => x.달력 === '양력') || 목[0];
        목 = [고]; 덧 = ' (날짜가 둘 보여 이것으로 읽었어요)';
      }
      목.forEach((x, i) => 가족.push(Object.assign({ 칸, 호칭: 칸 === 'siblings' && 목.length > 1 ? 호칭 + ' ' + (i + 1) : 호칭 }, x)));
      넣(칸, 이름, 목.map((x) => x.말).join(' / ') + 덧);
    });
    const 예 = 예정일찾기([['range', d.range], ['wish', d.wish], ['ask', d.ask], ['hospital', d.hospital]], 기준);
    if (예) 줄.push({ 칸: 'due', 이름: '예정일', 말: 예.말, 막힘: false });
    // 바라는 점 · 궁금한 점에 적은 날짜 — 신청 기간 안의 날이면 「물어보신 날」로 같이 본다(10-04 첫 손님 「4월 23일 생각 중 · 시간이 고민」 —
    // 글로만 적어서 보고서가 그날을 따로 보지 않았다). 예정일 · 이미 받은 날과 겹치면 빼고, 기간 밖 날(가족 생일 등)은 버린다.
    const 글날 = [];
    if (기.값) [d.wish, d.ask].forEach((글) => 시각들(글, 기준).값.forEach((x) => {
      if (!x.날 || x.날 < 기.값.첫날 || x.날 > 기.값.끝날) return;
      if (예 && x.날 === 예.날 && x.분 == null) return;
      if (받.값.concat(글날).some((y) => y.날 === x.날 && (y.분 === x.분 || x.분 == null))) return;
      글날.push(x);
    }));
    if (글날.length) 줄.push({ 칸: 'askdate', 이름: '글에 적으신 날짜', 말: 글날.map((x) => 날말(x.날) + (x.분 != null ? ' ' + 때말(x.분) : '')).join(' · ') + ' — 이 날을 따로 봤어요', 막힘: false });
    return {
      판: '0.1', 오늘,
      기간: 기.값, 곳: 자리.값 ? { 값: 자리.값, 이름: 자리.이름, 해외: 자리.해외 } : null,
      성별: 성 ? 성[0] : '모름', 앞세움: 앞세움말[d.first] ? d.first : '',
      병원시간: 시.값, 주말, 병원날: 병.값, 물어본: 받.값.concat(글날), 예정일: 예 ? 예.날 : null,
      가족, 줄, 막힘, 못읽음,
    };
  }

  global.ChaeksaTaekilRead = { 읽기, 기간, 곳, 생일들, 시간대, 날짜들, 시각들, 예정일찾기, 날말, 때말, 상한 };
})(window);
