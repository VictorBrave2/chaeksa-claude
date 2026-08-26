/* 책사 유형 카드 — 세 고전 축(격국×성패×강약×조후칸)으로 뽑는 나의 카드
 *
 * 686장을 그려두는 게 아니라, 시각 부품을 조합해 기기에서 즉석 생성한다.
 *   일간 10(중심 글자·오행색) × 월지 12(계절 문양) × 격 10(인장) ×
 *   성/파 2(테두리) × 강약 3(바탕 톤) — 부품 ~37개가 686+장을 만든다.
 * 이미지 파일 0장, 생성 비용 0원, 같은 사주는 언제나 같은 카드.
 *
 * 희귀도: 결정적 표본 1,500명을 기기에서 한 번 돌려 분포를 만들고 캐시한다.
 * 표가 엔진 버전과 어긋날 일이 없고, 계산하는 몇 초가 그대로 뽑기 연출이 된다.
 * 등급은 가챠 문법: SSR(≤0.2%) SR(≤0.7%) R(≤2%) N(나머지).
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;
  const GRP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
  const G = (ds, s) => E.TEN_GODS[E.tenGod(ds, s)];

  // ── 격 판정 (자평진전 간이 규칙 — 상담 스킬과 같은 판) ──
  function gyeok(R) {
    const p = R.pillars, ds = p.day.stem, cheon = [], all = [];
    ['year','month','day','hour'].forEach(k => {
      if (!p[k]) return;
      if (k !== 'day') { cheon.push(G(ds, p[k].stem)); all.push(G(ds, p[k].stem)); }
      E.HIDDEN[p[k].branch].forEach(h => all.push(G(ds, h)));
    });
    const hid = E.HIDDEN[p.month.branch];
    const mg = G(ds, hid[0]);
    const has = n => all.includes(n), hasG = g => all.some(x => GRP[x] === g);
    const cnt = g => all.filter(x => GRP[x] === g).length, tu = n => cheon.includes(n);
    if (GRP[mg] === '비겁') {
      const nm = mg === '비견' ? '건록' : '양인';
      const ok = tu('정관') || tu('편관') || tu('정재') || tu('편재') || tu('식신') || tu('상관');
      return { name: nm, ok: ok ? 1 : 0 };
    }
    let gs = null;
    for (const h of hid) {                       // 투출한 지장간 우선, 비겁은 격이 아니다
      if (GRP[G(ds, h)] === '비겁') continue;
      if (['year','month','hour'].some(k => p[k] && p[k].stem === h)) { gs = h; break; }
    }
    if (gs == null) { for (const h of hid) { if (GRP[G(ds, h)] !== '비겁') { gs = h; break; } } }
    if (gs == null) gs = hid[0];
    const gek = G(ds, gs), grp = GRP[gek];
    let ok = 0;
    if (gek === '정관') ok = !has('상관') && !has('편관') && (hasG('재성') || hasG('인성')) ? 1 : 0;
    else if (grp === '재성') ok = cnt('비겁') < 3 && (hasG('식상') || hasG('관성')) ? 1 : 0;
    else if (gek === '정인') ok = !tu('정재') && !tu('편재') && hasG('관성') ? 1 : 0;
    else if (gek === '식신') ok = !has('편인') && (hasG('재성') || has('편관')) ? 1 : 0;
    else if (gek === '편관') ok = (has('식신') || hasG('인성')) ? 1 : 0;
    else if (gek === '상관') ok = !has('정관') && (hasG('재성') || hasG('인성')) ? 1 : 0;
    else ok = !has('식신') && hasG('재성') ? 1 : 0;
    return { name: gek === '비견' ? '건록' : gek === '겁재' ? '양인' : gek, ok };
  }

  const keyOf = (R, J) => `${J.name}|${J.ok}|${R.analysis.strength}|${R.pillars.day.stem}|${R.pillars.month.branch}`;

  // ── 희귀도 표본 — 결정적 1,500명. 조각내서 돌려 화면이 안 멈추게 한다 ──
  const CACHE_KEY = 'chaeksa.typeSample.v1';
  function buildSample(onTick, done) {
    try {
      const hit = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (hit && hit.n >= 1500) return done(hit);
    } catch (e) {}
    const seen = {}; let i = 0, n = 0;
    (function chunk() {
      const end = Math.min(i + 100, 1500);
      for (; i < end; i++) {
        const y = 1940 + (i * 7919) % 71, m = 1 + (i * 104729) % 12,
              d = 1 + (i * 1299709) % 28, hh = (i * 15485863) % 24;
        try {
          const R = E.calc({ year: y, month: m, day: d, hour: hh, minute: 30, gender: i % 2 ? 'M' : 'F',
                             place: 'KR:서울', longitude: 126.98, tzOffset: null, solarCorrection: true });
          seen[keyOf(R, gyeok(R))] = (seen[keyOf(R, gyeok(R))] || 0) + 1; n++;
        } catch (e) {}
      }
      if (onTick) onTick(i / 1500);
      if (i < 1500) setTimeout(chunk, 0);
      else {
        const out = { seen, n, types: Object.keys(seen).length };
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(out)); } catch (e) {}
        done(out);
      }
    })();
  }

  // ── 카드 그리기 — 부품 조합 ──
  const SEAL = { 정관:'官', 편관:'殺', 정재:'財', 편재:'才', 정인:'印', 편인:'梟', 식신:'食', 상관:'傷', 건록:'祿', 양인:'刃' };
  const ELCOL = ['#3e7d4f', '#c04a35', '#a3762c', '#7d838f', '#3a6ea5'];
  const TONE = { 신강: ['#f7ead2', '#f0dcb4'], 중화: ['#f6f2e9', '#ece5d4'], 신약: ['#eef1f3', '#e0e7ec'] };
  const SEASON = { // 월지 → 계절 문양 path (모서리 장식)
    봄:  { col:'#3e7d4f', path:'M0 8 Q4 0 8 6 Q10 -2 14 4' },                 // 새순
    여름:{ col:'#c04a35', path:'M7 12 Q0 6 6 0 Q7 4 9 2 Q14 7 7 12' },        // 불꽃
    가을:{ col:'#a08a4f', path:'M7 0 L13 7 L7 14 L1 7 Z' },                   // 금강석
    겨울:{ col:'#3a6ea5', path:'M0 4 Q3 0 7 4 Q11 8 14 4 M0 10 Q3 6 7 10 Q11 14 14 10' }, // 물결
  };
  const seasonOf = (b) => [2,3,4].includes(b) ? '봄' : [5,6,7].includes(b) ? '여름' : [8,9,10].includes(b) ? '가을' : '겨울';
  const TIER = (pct) => pct <= 0.2 ? ['SSR', '#b98a2f'] : pct <= 0.7 ? ['SR', '#7a4fa3'] : pct <= 2 ? ['R', '#3a6ea5'] : ['N', '#8a8578'];

  function draw(R, J, rar) {
    const a = R.analysis, p = R.pillars;
    const de = E.STEM_ELEM[a.dayStem];
    const tone = TONE[a.strength] || TONE['중화'];
    const frame = J.ok
      ? '<rect x="10" y="10" width="340" height="540" rx="14" fill="none" stroke="#b98a2f" stroke-width="2.5"/><rect x="16" y="16" width="328" height="528" rx="10" fill="none" stroke="#b98a2f" stroke-width="1" opacity=".55"/>'
      : '<rect x="10" y="10" width="340" height="540" rx="14" fill="none" stroke="#4a4238" stroke-width="2" stroke-dasharray="9 5"/>';
    const se = SEASON[seasonOf(p.month.branch)];
    const corner = (x, y, r) => `<g transform="translate(${x},${y}) rotate(${r})" stroke="${se.col}" stroke-width="1.6" fill="none" opacity=".8"><path d="${se.path}"/></g>`;
    const [tier, tcol] = rar ? TIER(rar.pct) : ['?', '#8a8578'];
    const stemCh = E.fmt.stem(a.dayStem), stemKo = E.fmt.stemKo(a.dayStem);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${tone[0]}"/><stop offset="1" stop-color="${tone[1]}"/></linearGradient></defs>
  <rect width="360" height="560" rx="20" fill="url(#bg)"/>
  ${frame}
  ${corner(26, 26, 0)}${corner(334, 26, 90)}${corner(334, 534, 180)}${corner(26, 534, 270)}
  <g transform="translate(38,44)"><rect width="52" height="52" rx="8" fill="#b23a2a"/>
    <text x="26" y="38" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="32" font-weight="900" fill="#fdf3e7">${SEAL[J.name] || '?'}</text></g>
  <text x="322" y="62" text-anchor="end" font-family="'Noto Serif KR',serif" font-size="15" fill="#4a4238" letter-spacing="4">${J.name}격 ${J.ok ? '成' : '破'}</text>
  <text x="322" y="84" text-anchor="end" font-size="12" fill="#7d7566" letter-spacing="3">${a.strength}</text>
  <text x="180" y="316" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="150" font-weight="900" fill="${ELCOL[de]}">${stemCh}</text>
  <text x="180" y="360" text-anchor="middle" font-size="15" fill="#5c5546" letter-spacing="2">${stemKo} 일간 · ${E.fmt.branchKo(p.month.branch)}월생</text>
  <rect x="46" y="410" width="268" height="52" rx="10" fill="#ffffff" opacity=".55"/>
  <text x="180" y="432" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="16" font-weight="700" fill="#33291c">${J.name}격 ${J.ok ? '성격' : '파격'} · ${a.strength} · ${stemCh}${E.fmt.branch(p.month.branch)}</text>
  <text x="180" y="452" text-anchor="middle" font-size="12" fill="#6b6254">${rar ? `표본 ${rar.n.toLocaleString()}명 중 ${rar.count}명 · ${rar.pct}%` : ''}</text>
  <g transform="translate(140,478)"><rect width="80" height="30" rx="15" fill="${tcol}"/>
    <text x="40" y="21" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" letter-spacing="2">${tier}</text></g>
  <text x="180" y="536" text-anchor="middle" font-size="10.5" fill="#8a8171" letter-spacing="2">策 · chaeksa.kr · 세 고전 축으로 계산된 카드</text>
</svg>`;
  }

  /** 내 카드 정보 + SVG. 희귀도 표본이 없으면 rar 없이도 그려진다. */
  function mine(R, sample) {
    const J = gyeok(R);
    let rar = null;
    if (sample) {
      const c = sample.seen[keyOf(R, J)] || 0;
      rar = { count: c || 1, n: sample.n, pct: Math.round(Math.max(c, 1) / sample.n * 1000) / 10, unique: c <= 1 };
    }
    return { key: keyOf(R, J), gyeok: J, rar, svg: draw(R, J, rar), tier: rar ? TIER(rar.pct)[0] : null };
  }

  global.ChaeksaTypecard = { mine, buildSample, gyeok };
})(window);
