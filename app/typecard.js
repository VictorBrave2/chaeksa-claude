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
      // 양인격은 양간이 왕지(자오묘유) 겁재월에 났을 때만이다: 甲卯·丙午·庚酉·壬子.
      // 음간의 겁재월과 토 일간의 축미월은 양인이 아니라 건록(월겁)으로 본다.
      // 실측에서 양인격의 48%가 음간으로 잘못 잡히고 있었다.
      const yang = E.STEM_YANG[ds] === 1;
      const wang = [0, 3, 6, 9].includes(p.month.branch);
      const nm = (mg === '겁재' && yang && wang) ? '양인' : '건록';
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

  // ── 희귀도 표본 — 결정적 10,000명. 절기표가 캐시되어 데스크톱 0.2초, 폰도 몇 초다 ──
  // 등급선은 표본에서 '사람 백분위'로 긋는다. 유형 크기(pct) 기준으로 그었더니
  // 꼬리가 길어 40%가 SSR을 받는 사고가 있었다 — 등급은 사람 기준이어야 한다.
  const CACHE_KEY = 'chaeksa.typeSample.v8';   // v8: 천직 유형 분포 동승 (v7: 연애 暗緣 축)
  const N_SAMPLE = 10000;
  function buildSample(onTick, done) {
    try {
      const hit = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (hit && hit.n >= N_SAMPLE && hit.th && hit.wh && hit.lt && hit.jt) return done(hit);
    } catch (e) {}
    const seen = {}, wh = {}, lt = {}, jt = {}; let i = 0, n = 0;
    (function chunk() {
      const end = Math.min(i + 250, N_SAMPLE);
      for (; i < end; i++) {
        const y = 1930 + (i * 7919) % 81, m = 1 + (i * 104729) % 12,
              d = 1 + (i * 1299709) % 28, hh = (i * 15485863) % 24;
        try {
          const R = E.calc({ year: y, month: m, day: d, hour: hh, minute: 30, gender: i % 2 ? 'M' : 'F',
                             place: 'KR:서울', longitude: 126.98, tzOffset: null, solarCorrection: true });
          seen[keyOf(R, gyeok(R))] = (seen[keyOf(R, gyeok(R))] || 0) + 1;
          const ws = wealthScore(R).score; wh[ws] = (wh[ws] || 0) + 1;
          const lk = loveType(R).key; lt[lk] = (lt[lk] || 0) + 1;
          const jk = careerAxis(R).key; jt[jk] = (jt[jk] || 0) + 1; n++;
        } catch (e) {}
      }
      if (onTick) onTick(i / N_SAMPLE);
      if (i < N_SAMPLE) setTimeout(chunk, 0);
      else {
        // 등급선: SSR = 희귀한 순으로 사람 3%까지의 유형 크기, SR = 15%, R = 50%
        const byC = {};
        Object.values(seen).forEach(c => { byC[c] = (byC[c] || 0) + c; });
        const cs = Object.keys(byC).map(Number).sort((a, b) => a - b);
        const th = [0, 0, 0]; let cum = 0;
        cs.forEach(c => {
          cum += byC[c];
          if (cum / n <= 0.03) th[0] = c;
          if (cum / n <= 0.15) th[1] = c;
          if (cum / n <= 0.50) th[2] = c;
        });
        const out = { seen, n, th, types: Object.keys(seen).length, wh, lt, jt };
        try { ['v4','v5','v6','v7'].forEach(k => localStorage.removeItem('chaeksa.typeSample.' + k)); } catch (e) {}
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
  const TIER_COL = { SSR: '#b98a2f', SR: '#7a4fa3', R: '#3a6ea5', N: '#8a8578' };
  const tierOf = (count, th) => !th ? 'N' : count <= th[0] ? 'SSR' : count <= th[1] ? 'SR' : count <= th[2] ? 'R' : 'N';

  function draw(R, J, rar) {
    const a = R.analysis, p = R.pillars;
    // 고전 채점(조후 50 + 격국 50) — classic.js가 있으면 카드에 찍는다.
    let cs = null;
    try { cs = global.ChaeksaClassic ? global.ChaeksaClassic.score(R) : null; } catch (e) {}
    const csLine = cs
      ? '<text x="180" y="522" text-anchor="middle" font-size="12.5" font-weight="600" fill="#5c4c2e">고전 채점 ' + cs.총점 + '점 <tspan font-weight="400" fill="#8a7a58">· 조후 ' + cs.조후.score + ' + 격국 ' + cs.격국.score + '</tspan></text>'
      : '';
    const de = E.STEM_ELEM[a.dayStem];
    const tone = TONE[a.strength] || TONE['중화'];
    const frame = J.ok
      ? '<rect x="10" y="10" width="340" height="540" rx="14" fill="none" stroke="#b98a2f" stroke-width="2.5"/><rect x="16" y="16" width="328" height="528" rx="10" fill="none" stroke="#b98a2f" stroke-width="1" opacity=".55"/>'
      : '<rect x="10" y="10" width="340" height="540" rx="14" fill="none" stroke="#4a4238" stroke-width="2" stroke-dasharray="9 5"/>';
    const se = SEASON[seasonOf(p.month.branch)];
    const corner = (x, y, r) => `<g transform="translate(${x},${y}) rotate(${r})" stroke="${se.col}" stroke-width="1.6" fill="none" opacity=".8"><path d="${se.path}"/></g>`;
    const tier = rar ? rar.tier : '?', tcol = rar ? TIER_COL[rar.tier] : '#8a8578';
    const stemCh = E.fmt.stem(a.dayStem), stemKo = E.fmt.stemKo(a.dayStem);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${tone[0]}"/><stop offset="1" stop-color="${tone[1]}"/></linearGradient></defs>
  <rect width="360" height="560" rx="20" fill="url(#bg)"/>
  ${frame}
  ${corner(26, 26, 0)}${corner(334, 26, 90)}${corner(334, 534, 180)}${corner(26, 534, 270)}
  <g transform="translate(38,44)"><rect width="52" height="52" rx="8" fill="#b23a2a"/>
    <text x="26" y="38" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="32" font-weight="900" fill="#fdf3e7">${SEAL[J.name] || '?'}</text></g>
  <text x="322" y="62" text-anchor="end" font-family="Noto Serif KR,serif" font-size="15" fill="#4a4238" letter-spacing="4">${J.name}격 ${J.ok ? '成' : '破'}</text>
  <text x="322" y="84" text-anchor="end" font-size="12" fill="#7d7566" letter-spacing="3">${a.strength}</text>
  <text x="180" y="316" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="150" font-weight="900" fill="${ELCOL[de]}">${stemCh}</text>
  <text x="180" y="360" text-anchor="middle" font-size="15" fill="#5c5546" letter-spacing="2">${stemKo} 일간 · ${E.fmt.branchKo(p.month.branch)}월생</text>
  <rect x="46" y="410" width="268" height="52" rx="10" fill="#ffffff" opacity=".55"/>
  <text x="180" y="432" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="16" font-weight="700" fill="#33291c">${J.name}격 ${J.ok ? '성격' : '파격'} · ${a.strength} · ${stemCh}${E.fmt.branch(p.month.branch)}</text>
  <text x="180" y="452" text-anchor="middle" font-size="12" fill="#6b6254">${rar ? `표본 ${rar.n.toLocaleString()}명 중 ${rar.count}명` : ''}</text>
  <g transform="translate(140,478)"><rect width="80" height="30" rx="15" fill="${tcol}"/>
    <text x="40" y="21" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" letter-spacing="2">${tier}</text></g>
  ${csLine}
  <text x="180" y="542" text-anchor="middle" font-size="10.5" fill="#8a8171" letter-spacing="2">策 · chaeksa.kr · 궁통보감 원문 대조 채점</text>
</svg>`;
  }

  /** 내 카드 정보 + SVG. 희귀도 표본이 없으면 rar 없이도 그려진다.
   *  등급은 언제나 현재 기준의 계산값이다 — 발급 시점 유지 같은 예외를 두지 않는다. */
  try { localStorage.removeItem('chaeksa.cardIssued'); } catch (e) {}   // 초판 제도 흔적 청소
  function mine(R, sample) {
    const J = gyeok(R);
    const key = keyOf(R, J);
    let rar = null;
    if (sample) {
      const c = Math.max(sample.seen[key] || 0, 1);
      rar = { count: c, n: sample.n, pct: Math.round(c / sample.n * 1000) / 10,
              unique: c <= 1, tier: tierOf(c, sample.th) };
    }
    return { key, gyeok: J, rar, svg: draw(R, J, rar), tier: rar ? rar.tier : null };
  }

  /** SVG 문자열 → PNG blob. 카드 비율 2배(720×1120)로 굽는다. */
  function toPng(svgStr) {
    // 파이어폭스는 width/height 속성 없는 SVG(viewBox만)를 캔버스에 그리면
    // 빈 이미지가 된다. 변환 직전에 크기를 박아 넣는다.
    if (!/<svg[^>]*\swidth=/.test(svgStr)) {
      svgStr = svgStr.replace('<svg ', '<svg width="720" height="1120" ');
    }
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 720; c.height = 1120;
        c.getContext('2d').drawImage(img, 0, 0, 720, 1120);
        URL.revokeObjectURL(url);
        c.toBlob((b) => b ? res(b) : rej(new Error('png 변환 실패')), 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('svg 로드 실패')); };
      img.src = url;
    });
  }
  /** 카드 내보내기. 반환: 'shared' | 'copied' | 'saved'.
   *  모바일은 공유 시트가 자연스럽고, PC는 윈도우 공유 시트가 어중간해서
   *  아예 건너뛰고 클립보드 복사로 간다 — 카톡·메모장에 Ctrl+V면 끝이다. */
  async function share(svgStr, label) {
    const blob = await toPng(svgStr);
    const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (mobile && navigator.canShare) {
      const file = new File([blob], `책사_카드_${label}.png`, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: '내 사주 카드', text: `${label} · chaeksa.kr` }); return 'shared'; } catch (e) {}
      }
    }
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); return 'copied'; } catch (e) {}
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `책사_카드_${label}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return 'saved';
  }

  // ── 전생 직업 교지(敎旨) — 격국×일간오행 = 50직업, 강약이 직급 ──
  function pastjob(R) {
    const B = global.ChaeksaBrief.PASTJOB;
    const J = gyeok(R);
    const de = E.STEM_ELEM[R.analysis.dayStem];
    const job = (B.JOB[J.name] || B.JOB['건록'])[de];
    const rank = B.RANK[R.analysis.strength] || B.RANK['중화'];
    const drip = B.DRIP[J.name] || '';
    return { job, rank, drip, gyeok: J };
  }
  function drawGyoji(name, pj) {
    const esc = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    // 드립을 두 줄로 접는다 (교지 폭에 맞게)
    const words = pj.drip.split(' ');
    let l1 = '', l2 = '';
    words.forEach(w => { if (l1.length < 16) l1 += (l1 ? ' ' : '') + w; else l2 += (l2 ? ' ' : '') + w; });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">
  <defs><linearGradient id="gj" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f8f0dc"/><stop offset="1" stop-color="#eddfbe"/></linearGradient></defs>
  <rect width="360" height="560" rx="16" fill="url(#gj)"/>
  <rect x="12" y="12" width="336" height="536" rx="10" fill="none" stroke="#8a6a34" stroke-width="2.5"/>
  <rect x="20" y="20" width="320" height="520" rx="6" fill="none" stroke="#8a6a34" stroke-width="1" opacity=".5"/>
  <text x="180" y="86" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="44" font-weight="900" fill="#6d4f21" letter-spacing="18">敎 旨</text>
  <text x="180" y="130" text-anchor="middle" font-size="13" fill="#7a6a4a" letter-spacing="4">전생 직업 증명서</text>
  <text x="180" y="196" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="20" fill="#4a3a20">${esc(name)}의 전생은</text>
  <text x="180" y="248" text-anchor="middle" font-size="15" fill="#7a6a4a">${esc(pj.rank)}</text>
  <text x="180" y="300" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="30" font-weight="900" fill="#33291c">${esc(pj.job)}</text>
  <text x="180" y="340" text-anchor="middle" font-size="13" fill="#8a7a58" letter-spacing="2">${esc(pj.gyeok.name)}격 ${pj.gyeok.ok ? '성격' : '파격'}의 명(命)이라</text>
  <text x="180" y="404" text-anchor="middle" font-size="13.5" fill="#5c4c2e">${esc(l1)}</text>
  <text x="180" y="426" text-anchor="middle" font-size="13.5" fill="#5c4c2e">${esc(l2)}</text>
  <g transform="translate(256,440)"><rect width="62" height="62" rx="8" fill="#b23a2a" opacity=".92"/>
    <text x="31" y="28" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="20" font-weight="900" fill="#fdf3e7">前生</text>
    <text x="31" y="50" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="20" font-weight="900" fill="#fdf3e7">職所</text></g>
  <text x="180" y="536" text-anchor="middle" font-size="10.5" fill="#8a7a58" letter-spacing="2">策 · chaeksa.kr · 격국과 일간으로 계산된 전생</text>
</svg>`;
  }

  // ── 두 번째 카드: 지금 시즌 — 현재 대운이 이 사주에 필요한 걸 갖고 왔는가 ──
  // 판정은 상담 스킬의 대운 채점과 같은 규칙이다. 대운이 바뀌면 이 카드도 바뀐다.
  const SEASON_GRADE = [
    { min: 2.0, name: '만개', col: '#b98a2f', line: '필요한 기운이 정확히 들어와 있는 시즌. 벌인 일이 힘을 받습니다.' },
    { min: 1.5, name: '순풍', col: '#3e7d4f', line: '바람이 등 뒤에서 붑니다. 하던 일을 넓히기 좋은 시즌.' },
    { min: 1.0, name: '보합', col: '#7d838f', line: '크게 밀어주지도 막지도 않는 시즌. 내 페이스가 답입니다.' },
    { min: 0.5, name: '담금질', col: '#7a4fa3', line: '결이 다른 기운이 들어온 시즌. 단련되는 중이라 낭비는 아닙니다.' },
    { min: 0.0, name: '월동', col: '#3a6ea5', line: '비축의 시즌. 씨앗을 고르는 때이지 심는 때가 아닙니다.' },
  ];
  function seasonNow(R, when) {
    when = when || new Date();
    const du = E.currentDaeun(R, when);
    if (!du) return { grade: { name: '포석', col: '#8a8578', line: '아직 첫 대운 전 — 판을 짜는 중입니다.' }, du: null };
    const a = R.analysis, de = E.STEM_ELEM[a.dayStem], ec = a.elemCount;
    let sc = 0;
    [E.STEM_ELEM[du.stem], E.BRANCH_ELEM[du.branch]].forEach(e => {
      const sup = E.siding(de, e) > 0;
      sc += a.strengthScore < 0.45 ? (sup ? 1 : 0)
          : a.strengthScore > 0.55 ? (sup ? 0 : 1)
          : ec[e] <= 1 ? 1 : ec[e] >= 3 ? 0 : 0.5;
    });
    const grade = SEASON_GRADE.find(g => sc >= g.min) || SEASON_GRADE[4];
    return { grade, du, score: sc };
  }
  function drawSeason(name, R, sn) {
    const esc2 = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const g = sn.grade;
    const duTxt = sn.du ? `${E.fmt.pillar(sn.du)} 대운 · ${sn.du.startAge}~${sn.du.endAge}세` : '첫 대운 전';
    // 한 줄을 카드 폭에 맞게 접는다
    const words = g.line.split(' '); let l1 = '', l2 = '';
    words.forEach(w => { if (l1.length < 15) l1 += (l1 ? ' ' : '') + w; else l2 += (l2 ? ' ' : '') + w; });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">
  <defs><linearGradient id="sn" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f6f2e9"/><stop offset="1" stop-color="#e9e2d0"/></linearGradient></defs>
  <rect width="360" height="560" rx="20" fill="url(#sn)"/>
  <rect x="10" y="10" width="340" height="540" rx="14" fill="none" stroke="${g.col}" stroke-width="2.5"/>
  <g transform="translate(38,44)"><rect width="52" height="52" rx="8" fill="${g.col}"/>
    <text x="26" y="38" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="30" font-weight="900" fill="#fff">運</text></g>
  <text x="322" y="70" text-anchor="end" font-size="13" fill="#7d7566" letter-spacing="3">두 번째 카드</text>
  <text x="180" y="170" text-anchor="middle" font-size="15" fill="#6b6254">${esc2(name)}의 지금 시즌은</text>
  <text x="180" y="270" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="86" font-weight="900" fill="${g.col}">${g.name}</text>
  <text x="180" y="330" text-anchor="middle" font-size="14" fill="#5c5546" letter-spacing="1">${duTxt}</text>
  <text x="180" y="400" text-anchor="middle" font-size="13.5" fill="#5c4c2e">${esc2(l1)}</text>
  <text x="180" y="422" text-anchor="middle" font-size="13.5" fill="#5c4c2e">${esc2(l2)}</text>
  <text x="180" y="480" text-anchor="middle" font-size="12" fill="#8a7a58">대운이 바뀌면 이 카드도 바뀝니다</text>
  <text x="180" y="536" text-anchor="middle" font-size="10.5" fill="#8a8171" letter-spacing="2">策 · chaeksa.kr · 원국과 대운으로 계산된 시즌</text>
</svg>`;
  }

  // ── 오늘의 금지령 — 오늘 일진 십신 + 일지 관계(충·복음)로 정한다. 매일 바뀐다 ──
  function banToday(R, when) {
    when = when || new Date();
    const B = global.ChaeksaBrief;
    const tf = E.dateFortune(when.getFullYear(), when.getMonth() + 1, when.getDate());
    const god = E.TEN_GODS[E.tenGod(R.analysis.dayStem, tf.day.stem)];
    const base = B.BANLIST[god] || B.BANLIST['비견'];
    const 금지 = base.금지.slice();
    const myBr = R.pillars.day.branch, todayBr = tf.day.branch;
    let 관계 = null;
    if (myBr === todayBr) 관계 = '복음';
    else if (((todayBr - myBr + 12) % 12) === 6) 관계 = '충';
    if (관계) 금지.push(B.BAN_EXTRA[관계]);
    return { god, 관계, 금지, 허가: base.허가, 일진: E.fmt.pillar(tf.day) };
  }
  function drawBan(name, ban, when) {
    when = when || new Date();
    const esc3 = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const dateTxt = (when.getMonth() + 1) + '월 ' + when.getDate() + '일 · ' + ban.일진 + '일 (' + ban.god + ')';
    // x=82에서 오른쪽 여백(320)까지 238px. 13px 글자면 18자.
    let by = 250;
    const items = ban.금지.map((t) => {
      const ls = foldTxt(t, 238, 13).slice(0, 2);
      const g = '<text x="52" y="' + by + '" font-size="15" fill="#8a3020" font-weight="700">禁</text>'
        + ls.map((L, j) => '<text x="82" y="' + (by + j * 19) + '" font-size="13" fill="#4a3a28">' + esc3(L[0]) + '</text>').join('');
      by += (ls.length - 1) * 19 + 40;
      return g;
    }).join('');
    const okY = by + 8;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">'
      + '<defs><linearGradient id="bn" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#f7efdb"/><stop offset="1" stop-color="#eee0c2"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="16" fill="url(#bn)"/>'
      + '<rect x="12" y="12" width="336" height="536" rx="10" fill="none" stroke="#7a5a28" stroke-width="2.5"/>'
      + '<text x="180" y="88" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="46" font-weight="900" fill="#5c421c" letter-spacing="16">禁 令</text>'
      + '<text x="180" y="126" text-anchor="middle" font-size="13" fill="#7a6a48" letter-spacing="3">오늘의 금지령</text>'
      + '<text x="180" y="172" text-anchor="middle" font-size="14" fill="#5c4c2e">' + esc3(name) + ' 앞 · ' + esc3(dateTxt) + '</text>'
      + '<line x1="40" y1="200" x2="320" y2="200" stroke="#c9b285" stroke-width="1.5"/>'
      + items
      + '<line x1="40" y1="' + okY + '" x2="320" y2="' + okY + '" stroke="#c9b285" stroke-width="1.5" stroke-dasharray="5 4"/>'
      + '<text x="52" y="' + (okY + 40) + '" font-size="15" fill="#2f6b3a" font-weight="700">許</text>'
      + foldTxt(ban.허가, 238, 13).slice(0, 2).map((L, j) =>
          '<text x="82" y="' + (okY + 40 + j * 19) + '" font-size="13" fill="#33502e">' + esc3(L[0]) + '</text>').join('')
      + '<g transform="translate(276,452)"><rect width="52" height="52" rx="8" fill="#b23a2a" opacity=".92"/>'
      + '<text x="26" y="34" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="22" font-weight="900" fill="#fdf3e7">策</text></g>'
      + '<text x="180" y="536" text-anchor="middle" font-size="10.5" fill="#8a7a58" letter-spacing="2">chaeksa.kr · 오늘 일진으로 계산 · 내일이면 바뀝니다</text>'
      + '</svg>';
  }

  // ── 공범 판결 — 두 사람의 관계 축(충·합·복음) + 조후 상보(궁통보감 표) ──
  // 조후 상보가 이 판결의 심장이다: 내 조후용신(원문 120칸)을 상대 천간이 갖고 있는가.
  function accomplice(Rme, Ryou, nameA, nameB) {
    const brA = ['year','month','day','hour'].filter(k=>Rme.pillars[k]).map(k=>Rme.pillars[k].branch);
    const brB = ['year','month','day','hour'].filter(k=>Ryou.pillars[k]).map(k=>Ryou.pillars[k].branch);
    const dA = Rme.pillars.day.branch, dB = Ryou.pillars.day.branch;
    const YUKHAP = {0:1,1:0,2:11,11:2,3:10,10:3,4:9,9:4,5:8,8:5,6:7,7:6};
    const SAM = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
    const chung = (a,b)=>((b-a+12)%12)===6;
    const 죄목 = [], 참작 = [];
    if (chung(dA,dB)) 죄목.push('만나면 사건이 터짐죄 — 두 일지가 정면 충. 지루할 틈은 없음');
    let crossChung = 0;
    brA.forEach(a=>brB.forEach(b=>{ if(chung(a,b)) crossChung++; }));
    if (crossChung >= 3) 죄목.push('합동 소란죄 — 지지 곳곳이 부딪힘(' + crossChung + '건). 일정이 자주 바뀜');
    if (Rme.pillars.day.stem === Ryou.pillars.day.stem && dA === dB)
      죄목.push('동일 수법 반복죄 — 일주가 같아 장단점까지 복제됨');
    if (YUKHAP[dA] === dB) 참작.push('두 일지가 육합 — 붙어 있으면 서로 안정됨');
    else if (SAM.some(g=>g.includes(dA)&&g.includes(dB)&&dA!==dB)) 참작.push('두 일지가 삼합 — 같은 팀으로 굴러감');
    // 조후 상보 (궁통보감 표)
    const C = global.ChaeksaClassic;
    let 조후 = null;
    if (C) {
      const needA = C.gungtong(Rme).need, needB = C.gungtong(Ryou).need;
      const stems = (R) => ['year','month','day','hour'].filter(k=>R.pillars[k]).map(k=>E.fmt.stem(R.pillars[k].stem));
      const BhasA = stems(Ryou).includes(needA);   // 상대가 내 용신을 가짐
      const AhasB = stems(Rme).includes(needB);
      if (BhasA && AhasB) {
        조후 = '상호';
        참작.push('서로의 조후용신을 갖고 있음 — ' + nameA + '의 용신 ' + needA + '는 ' + nameB + '에게, ' + nameB + '의 용신 ' + needB + '는 ' + nameA + '에게 있음');
      } else if (BhasA || AhasB) {
        조후 = '일방';
        const 부양자 = BhasA ? nameB : nameA, 수혜자 = BhasA ? nameA : nameB, 글자 = BhasA ? needA : needB;
        죄목.push('온기 독점죄 — ' + 수혜자 + '의 용신 ' + 글자 + ', ' + 부양자 + ' 혼자 대주는 중. 고마운 줄 알 것');
      }
    }
    const 선고 = 죄목.length && 참작.length ? '공범 관계 인정. 다만 정상을 참작하여 형량은 평생 동행으로 한다'
      : 죄목.length ? '공범 관계 인정. 형량: 평생 동행 (집행유예 없음)'
      : 참작.length ? '무혐의. 오히려 공생 관계로 표창을 검토한다'
      : '혐의 없음. 다만 서류상 남남처럼 심심할 수 있음';
    return { 죄목, 참작, 조후, 선고 };
  }
  function drawAccomplice(nameA, nameB, v) {
    const esc4 = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const wrap = (t) => {   // 카드 폭에 맞게 두 줄까지 접기
      const out = []; let cur = '';
      t.split(' ').forEach(w => { if ((cur + ' ' + w).trim().length <= 24) cur = (cur + ' ' + w).trim(); else { out.push(cur); cur = w; } });
      if (cur) out.push(cur);
      return out.slice(0, 2);
    };
    // 선고는 판결문의 맺음이라 자리가 고정이다. 죄목·참작은 그 위 띠(202~388) 안에서
    // 세로 가운데에 앉힌다. 위에서부터 흘리면 죄목이 적을 때 아래가 통째로 빈다.
    const blocks = v.죄목.map(t => ({ mark: '罪', col: '#8a3020', txt: '#4a3a28', ls: wrap(t) }))
      .concat(v.참작.map(t => ({ mark: '恕', col: '#2f6b3a', txt: '#33502e', ls: wrap(t) })));
    const blockH = blocks.reduce((h, b) => h + b.ls.length * 20 + 14, 0) - 14;
    let y = Math.max(218, Math.round(202 + (186 - blockH) / 2));
    let body = '';
    // 죄목도 참작도 없으면 가운데가 통째로 빈다. 빈 판결문 대신 무혐의를 새긴다.
    if (!blocks.length) {
      body += '<text x="180" y="286" text-anchor="middle" font-family="Noto Serif KR,serif"'
        + ' font-size="44" font-weight="900" fill="#8a7a58" letter-spacing="8" opacity=".85">無嫌疑</text>'
        + '<text x="180" y="322" text-anchor="middle" font-size="13" fill="#7a6a48">조사 결과, 걸리는 것이 없습니다</text>';
    }
    blocks.forEach(b => {
      body += '<text x="46" y="' + y + '" font-size="14" fill="' + b.col + '" font-weight="700">' + b.mark + '</text>';
      b.ls.forEach((l, i) => { body += '<text x="74" y="' + (y + i*20) + '" font-size="13" fill="' + b.txt + '">' + esc4(l) + '</text>'; });
      y += b.ls.length * 20 + 14;
    });
    const 선고줄 = wrap(v.선고);
    y = 396;   // 선고 자리 고정
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">'
      + '<defs><linearGradient id="ac" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#f6efe0"/><stop offset="1" stop-color="#e9dec6"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="16" fill="url(#ac)"/>'
      + '<rect x="12" y="12" width="336" height="536" rx="10" fill="none" stroke="#5c4a30" stroke-width="2.5"/>'
      + '<text x="180" y="82" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="38" font-weight="900" fill="#4a3820" letter-spacing="8">共犯判決</text>'
      + '<text x="180" y="118" text-anchor="middle" font-size="12.5" fill="#7a6a48" letter-spacing="3">사주법원 궁합 전담부</text>'
      + '<text x="180" y="158" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="17" font-weight="700" fill="#33291c">' + esc4(nameA) + ' · ' + esc4(nameB) + '</text>'
      + '<line x1="40" y1="184" x2="320" y2="184" stroke="#c9b285" stroke-width="1.5"/>'
      + body
      + '<line x1="40" y1="' + (y+4) + '" x2="320" y2="' + (y+4) + '" stroke="#c9b285" stroke-width="1.5" stroke-dasharray="5 4"/>'
      + 선고줄.map((l,i)=>'<text x="180" y="' + (y+34+i*21) + '" text-anchor="middle" font-size="13.5" font-weight="700" fill="#4a3820">' + esc4(l) + '</text>').join('')
      + '<g transform="translate(276,452)"><rect width="52" height="52" rx="8" fill="#b23a2a" opacity=".92"/>'
      + '<text x="26" y="34" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="22" font-weight="900" fill="#fdf3e7">策</text></g>'
      + '<text x="180" y="536" text-anchor="middle" font-size="10.5" fill="#8a7a58" letter-spacing="2">chaeksa.kr · 궁통보감 원문 조후표로 계산한 상보</text>'
      + '</svg>';
  }

  // ── 재물 그릇 — 녹패(祿牌) ──
  // 점수(0~100) = 재성 세력(40) + 식상 통로(14) + 담는 힘(25) + 재고(6) − 군겁쟁재(15) − 재다신약(15).
  // 등급은 점수가 아니라 표본 1만 명 속 '사람 백분위'로 긋는다 — 유형 카드와 같은 원칙.
  function wealthScore(R) {
    const a = R.analysis, ds = a.dayStem, p = R.pillars;
    const god = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const isJae = (g) => g === '정재' || g === '편재';
    const isSik = (g) => g === '식신' || g === '상관';
    const isBi = (g) => g === '비견' || g === '겁재';
    let jae = 0, sik = 0, bi = 0, jeong = 0, pyeon = 0, hidJae = 0, sikStem = 0;
    for (const k of ['year', 'month', 'hour']) {          // 일간 자신은 제외
      const pl = p[k]; if (!pl) continue;
      const g = god(pl.stem);
      if (isJae(g)) { jae += 8; if (g === '정재') jeong++; else pyeon++; }
      if (isSik(g)) { sik++; sikStem++; }
      if (isBi(g)) bi++;
    }
    for (const k of ['year', 'month', 'day', 'hour']) {
      const pl = p[k]; if (!pl) continue;
      E.HIDDEN[pl.branch].forEach((h, i) => {
        const g = god(h);
        if (i === 0) {                                     // 정기 — 월지가 가장 무겁다
          if (isJae(g)) { jae += k === 'month' ? 14 : 7; if (g === '정재') jeong++; else pyeon++; }
          if (isSik(g)) sik++;
          if (isBi(g)) bi++;
        } else if (isJae(g)) { jae += 3; if (g === '정재') jeong++; else pyeon++; hidJae++; }
      });
    }
    jae = Math.min(40, jae);
    const tongro = jae > 0 && sik > 0 ? 14 : sik > 0 ? 5 : 0;
    const him = a.strength === '중화' ? 25 : a.strength === '신강' ? 22 : 10;
    const wEl = (E.STEM_ELEM[ds] + 2) % 5;                 // 재 = 일간이 극하는 오행
    // 고지(庫地) — 사고(四庫)뿐이다. 목未 화戌 금丑 수辰.
    // 토는 고지가 없다. 예전에 토를 辰으로 넣어 수와 겹쳐뒀는데 근거 없는 값이었다.
    // 그래서 재성이 토인 갑·을 일간은 이 가점을 못 받는다 — 그게 맞다.
    const GOJI = [7, 10, null, 1, 4];
    const gojiB = GOJI[wEl];
    const gotgan = gojiB !== null && ['year', 'month', 'day', 'hour'].some(k => p[k] && p[k].branch === gojiB) ? 6 : 0;
    const gungeop = bi >= 3 && jae > 0 ? -15 : 0;          // 군겁쟁재
    const jaeda = jae >= 25 && a.strength === '신약' ? -15 : 0; // 재다신약
    return { score: Math.max(0, Math.min(100, jae + tongro + him + gotgan + gungeop + jaeda)),
             jae, sik, bi, jeong, pyeon, hidJae, sikStem, tongro, gotgan, gungeop, jaeda };
  }

  const NOKGRADE = [
    [2, '만석꾼', '萬石', '그릇이 곳간째로 온 팔자 — 관건은 관리다'],
    [10, '천석꾼', '千石', '쌓는 족족 담긴다 — 큰물에서 놀 것'],
    [30, '백석꾼', '百石', '먹고살 걱정 없는 그릇 — 불리는 건 전략'],
    [60, '쉰섬지기', '五十石', '그릇은 평범, 손은 부지런 — 구멍만 막으면 는다'],
    [100, '자수성가', '自手', '물려받을 곳간 없음 — 내가 만든 건 전부 내 것'],
  ];

  function wealth(R, todayD, sample) {
    const w = wealthScore(R), ds = R.analysis.dayStem;
    const god = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const isJae = (g) => g === '정재' || g === '편재';
    // 백분위 — 동점은 위로 친다(상위 %가 후해지지 않게)
    let below = 0, n = 0;
    if (sample && sample.wh) for (const k in sample.wh) { if (+k < w.score) below += sample.wh[k]; n += sample.wh[k]; }
    const top = n ? Math.max(1, Math.ceil((1 - below / n) * 100)) : null;
    const grade = NOKGRADE.find(g => (top == null ? 100 : top) <= g[0]) || NOKGRADE[4];
    const l1 = w.jae === 0 ? '무재팔자 — 돈보다 실력이 먼저 오는 순서'
      : w.jeong + w.pyeon === w.hidJae ? '암장 재성 — 숨은 돈, 티 안 나게 쌓인다'
      : w.jeong > w.pyeon ? '정재형 — 또박또박 쌓이는 돈이 힘'
      : w.pyeon > w.jeong ? '편재형 — 크게 들고 크게 도는 돈'
      : '양손잡이 — 모을 줄도 굴릴 줄도 안다';
    const l2 = w.jae === 0 ? (w.sik > 0 ? '재능만 가동 — 돈은 명예·사람으로 환전' : '통로 미개설 — 돈은 목돈으로 움직인다')
      : w.sikStem > 0 ? '식상생재 — 일할수록 돈이 되는 라인'
      : w.sik > 0 ? '반자동 라인 — 몸이 움직여야 돈이 따라온다'
      : '통로 미개설 — 돈은 목돈으로 움직인다';
    const l3 = w.gungeop < 0 ? '군겁쟁재 — 동업·보증·빌려주기 금지'
      : w.jaeda < 0 ? '재다신약 — 돈이 나보다 크다, 체력 먼저'
      : w.gotgan ? '재고(財庫) — 쌓이면 안 새는 곳간 보유'
      : '구멍 없음 — 새는 건 팔자 아닌 습관';
    // 대운 시작 전(아기·아이)도 빈칸으로 두지 않는다 — 출산택일 고객이 보는 자리다
    let l4 = '대운 시작 전 — 그릇은 이미 정해졌고, 쓰는 건 이제부터';
    const du = E.currentDaeun(R, todayD), list = R.daeun.list;
    const duJae = (d) => isJae(god(d.stem)) || isJae(god(E.HIDDEN[d.branch][0]));
    const isSik2 = (g) => g === '식신' || g === '상관';
    const duSik = (d) => isSik2(god(d.stem)) || isSik2(god(E.HIDDEN[d.branch][0]));
    if (du && duJae(du)) l4 = '지금 대운에 재성 재실 — 버는 10년';
    else if (du && w.jae > 0 && duSik(du)) l4 = '지금 대운 식상 — 재성으로 흘러드는 10년';
    else if (du) {
      const i0 = list.findIndex(d => d.startAge === du.startAge);
      const nx = list.slice(i0 + 1).find(duJae);
      l4 = nx && nx.startAge < 70 ? nx.startAge + '세 대운부터 돈길 개통'
        : '대운은 조용함 — 돈길은 해마다 세운으로 잡는다';
    }
    return { score: w.score, top, n, grade: { name: grade[1], han: grade[2], note: grade[3] },
             lines: [l1, l2, l3, l4].filter(Boolean), raw: w };
  }


  // ── 연애·인연 — 도화첩(桃花帖) ──
  // 축 둘로 유형을 가른다: 배우자성(남=재성·여=관성)의 정/편 구성 × 배우자궁(일지)의 상태.
  // 신살(도화·홍염·천을귀인)은 유형을 바꾸지 않고 배지로만 붙인다 — 재미는 주되 판정은 흔들지 않는다.
  const DOHWA = { 8: 9, 0: 9, 4: 9, 11: 0, 3: 0, 7: 0, 2: 3, 6: 3, 10: 3, 5: 6, 9: 6, 1: 6 }; // 삼합국 → 도화지
  const HONGYEOM = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8];        // 일간별 홍염살 지지
  const CHEONEUL = [[1,7],[0,8],[11,9],[11,9],[1,7],[0,8],[1,7],[6,2],[3,5],[3,5]]; // 천을귀인
  const gongmang = (st, br) => {                            // 일주 순중공망
    const n = ((st * 6 - br * 5) % 60 + 60) % 60, sun = Math.floor(n / 10);
    return [(10 + sun * 10) % 12, (11 + sun * 10) % 12];
  };
  const SAMHAP_G = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
  const isChung = (a, b) => (a - b + 12) % 12 === 6;
  const isYukhap = (a, b) => a + b === 13 || a + b === 1;
  const isSamhap = (a, b) => a !== b && SAMHAP_G.some(g => g.indexOf(a) >= 0 && g.indexOf(b) >= 0);

  const LOVE_NAME = {
    '一心定': ['한 사람만', '정한 자리에 정한 사람 — 흔들 일이 별로 없다'],
    '一心合': ['운명 신봉자', '인연이 끌려온다. 첫눈에가 실제로 일어나는 쪽'],
    '一心動': ['진심인데 파란만장', '마음은 하나인데 상황이 자꾸 흔든다'],
    '一心空': ['짝사랑 장인', '깊게 두는데 자리가 비어 있다. 표현이 숙제'],
    '自由定': ['썸의 기술자', '거리 조절이 재능. 급할 게 없어서 더 끌린다'],
    '自由合': ['인기 관리자', '들어오는 인연이 많다. 고르는 게 일'],
    '自由動': ['불꽃 연애가', '뜨겁게 붙고 빠르게 움직인다. 잔잔함과는 거리'],
    '自由空': ['혼자가 편한', '연애를 못 하는 게 아니라 안 하는 쪽에 가깝다'],
    '多情定': ['다 챙기는 사람', '정이 넓은데 자리는 지킨다. 오해만 조심'],
    '多情合': ['모두의 최애', '어디 가도 인연이 붙는다. 정리가 관건'],
    '多情動': ['드라마 주인공', '사건이 끊이지 않는다. 본인 탓만은 아니다'],
    '多情空': ['많은데 허한', '사람은 많은데 채워지는 자리가 따로 있다'],
    '暗緣定': ['조용한 인연', '요란하지 않게 이어진다. 겉으로 드러나지 않을 뿐'],
    '暗緣合': ['티 안 나게 잘 풀리는', '숨은 인연이 제때 자리를 잡는다'],
    '暗緣動': ['숨은 인연에 파도', '조용한 자리인데 사건은 붙는다'],
    '暗緣空': ['늦게 드러나는', '자리가 늦게 채워진다. 서두를수록 손해'],
    '無緣定': ['때를 기다리는', '지금은 조용. 인연은 대운을 타고 온다'],
    '無緣合': ['늦게 트이는', '이르지 않을 뿐, 오면 제대로 온다'],
    '無緣動': ['연애보다 일', '에너지가 다른 데 쓰인다. 그게 나쁜 것도 아니다'],
    '無緣空': ['자급자족형', '혼자로 완성되는 쪽. 인연은 선택이지 필수가 아니다'],
  };

  function loveType(R) {
    const a = R.analysis, ds = a.dayStem, p = R.pillars;
    const male = (R.input && R.input.gender) !== 'F';
    const god = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const jeongG = male ? '정재' : '정관', pyeonG = male ? '편재' : '편관';
    let jeong = 0, pyeon = 0, hid = 0;
    for (const k of ['year', 'month', 'hour']) {
      const pl = p[k]; if (!pl) continue;
      const g = god(pl.stem);
      if (g === jeongG) jeong++; else if (g === pyeonG) pyeon++;
    }
    for (const k of ['year', 'month', 'day', 'hour']) {
      const pl = p[k]; if (!pl) continue;
      E.HIDDEN[pl.branch].forEach((h, i) => {
        const g = god(h);
        if (g !== jeongG && g !== pyeonG) return;
        if (i === 0) { if (g === jeongG) jeong++; else pyeon++; } else hid++;
      });
    }
    // 지장간에만 있는 배우자성은 '없음'이 아니라 숨은 것이다(暗緣).
    // 이걸 無緣으로 뭉치면 배우자 있는 사람에게 '혼자로 완성되는 쪽'이라 말하게 된다.
    const A = jeong > 0 && pyeon > 0 ? '多情' : jeong > 0 ? '一心' : pyeon > 0 ? '自由'
      : hid > 0 ? '暗緣' : '無緣';
    // 배우자궁 — 공망 > 충 > 합 > 안정
    // 배우자궁 공망은 반드시 년주 기준으로 본다.
    // 일지는 제 일주의 순(旬) 안에 있어 자기 기준으로는 결코 공망이 될 수 없다.
    const db = p.day.branch, gm = gongmang(p.year.stem, p.year.branch);
    const others = ['year', 'month', 'hour'].map(k => p[k] && p[k].branch).filter(b => b != null);
    const chung = others.filter(b => isChung(db, b)).length;
    const hap = others.filter(b => isYukhap(db, b) || isSamhap(db, b)).length;
    const B = gm.indexOf(db) >= 0 ? '空' : chung ? '動' : hap ? '合' : '定';
    // 신살 배지
    const all = ['year', 'month', 'day', 'hour'].map(k => p[k] && p[k].branch).filter(b => b != null);
    const dohwaB = [DOHWA[p.year.branch], DOHWA[db]];
    const badges = [];
    if (all.some(b => dohwaB.indexOf(b) >= 0)) badges.push('도화');
    if (all.indexOf(HONGYEOM[ds]) >= 0) badges.push('홍염');
    if (all.some(b => CHEONEUL[ds].indexOf(b) >= 0)) badges.push('귀인');
    return { key: A + B, A, B, jeong, pyeon, hid, chung, hap, badges, male, gmBranch: gm.indexOf(db) >= 0 };
  }

  function love(R, todayD, sample) {
    const t = loveType(R), nm = LOVE_NAME[t.key] || ['미분류', ''];
    let share = null;
    if (sample && sample.lt && sample.n) share = Math.max(1, Math.round((sample.lt[t.key] || 0) / sample.n * 100));
    const 상대 = t.male ? '재성' : '관성';
    const l1 = t.A === '暗緣' ? '지장간에만 ' + 상대 + ' — 겉으로 안 드러날 뿐, 인연은 있다'
      : t.A === '無緣' ? '사주에 ' + 상대 + ' 없음 — 인연은 내가 만들어 부르는 쪽'
      : t.A === '多情' ? '정(正)과 편(偏)이 함께 — 진지함과 설렘을 둘 다 원한다'
      : t.A === '一心' ? '정(正)만 ' + t.jeong + '개 — 한 번 정하면 오래 간다'
      : '편(偏)만 ' + t.pyeon + '개 — 규칙보다 끌림이 먼저다';
    const l2 = t.B === '空' ? '배우자궁 공망 — 자리가 비어 있다. 늦을수록 안정된다'
      : t.B === '動' ? '배우자궁 충 ' + t.chung + '개 — 인연에 사건이 붙는다'
      : t.B === '合' ? '배우자궁 합 ' + t.hap + '개 — 끌어당기는 자리를 타고났다'
      : '배우자궁 무탈 — 조용하고 단단한 자리';
    const l3 = t.badges.length
      ? t.badges.join('·') + ' 보유 — ' + (t.badges.indexOf('도화') >= 0 ? '가만히 있어도 눈에 띈다'
          : t.badges.indexOf('홍염') >= 0 ? '은근한 끌림이 오래 남는다' : '결정적일 때 사람이 돕는다')
      : '신살 없음 — 매력은 타고나는 게 아니라 쌓는 것';
    // 인연 시기 — 배우자성 대운
    const ds = R.analysis.dayStem, godS = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const want = t.male ? ['정재', '편재'] : ['정관', '편관'];
    const duLove = (d) => want.indexOf(godS(d.stem)) >= 0 || want.indexOf(godS(E.HIDDEN[d.branch][0])) >= 0;
    const du = E.currentDaeun(R, todayD), list = R.daeun.list;
    let l4 = '대운 시작 전 — 인연 이야기는 아직 이르다';
    if (du && duLove(du)) l4 = '지금 대운에 ' + 상대 + ' — 인연이 열려 있는 10년';
    else if (du) {
      const i0 = list.findIndex(d => d.startAge === du.startAge);
      const nx = list.slice(i0 + 1).find(duLove);
      l4 = nx && nx.startAge < 70 ? nx.startAge + '세 대운에 ' + 상대 + ' — 그때 크게 트인다'
        : '대운은 조용함 — 인연은 해마다 세운으로 온다';
    }
    return { key: t.key, name: nm[0], note: nm[1], badges: t.badges, share,
             n: sample && sample.n ? sample.n : 0, lines: [l1, l2, l3, l4] };
  }


  // ── 천직 — 천직첩(天職帖) ──
  // 축 둘: 십신 세력의 최강 그룹 x 오행 분포의 최강. 전생 직업소(격국 x 일간오행)와
  // 축이 겹치지 않아 두 카드가 같은 답을 내지 않는다.
  const SIP_GROUP = { 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상',
                      정재: '재성', 편재: '재성', 정관: '관성', 편관: '관성',
                      정인: '인성', 편인: '인성' };
  const GROUPS = ['비겁', '식상', '재성', '관성', '인성'];

  function careerAxis(R) {
    const ds = R.analysis.dayStem, p = R.pillars;
    const god = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const sc = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
    for (const k of ['year', 'month', 'hour']) {            // 일간 자신은 축에서 뺀다
      const pl = p[k]; if (!pl) continue;
      sc[SIP_GROUP[god(pl.stem)]] += k === 'month' ? 10 : 8;
    }
    for (const k of ['year', 'month', 'day', 'hour']) {
      const pl = p[k]; if (!pl) continue;
      E.HIDDEN[pl.branch].forEach((h, i) => {
        sc[SIP_GROUP[god(h)]] += i === 0 ? (k === 'month' ? 14 : 7) : 3;
      });
    }
    // 동점이면 월지 정기가 속한 그룹을 우선한다 — 월령이 축의 주인이다
    const mg = SIP_GROUP[god(E.HIDDEN[p.month.branch][0])];
    let top = GROUPS[0];
    GROUPS.forEach(g => { if (sc[g] > sc[top] || (sc[g] === sc[top] && g === mg)) top = g; });
    const ec = R.analysis.elemCount, EL = ['목', '화', '토', '금', '수'];
    let ei = 0;
    ec.forEach((v, i) => { if (v > ec[ei]) ei = i; });
    return { key: top + '·' + EL[ei], group: top, elem: EL[ei], sc, elemCount: ec };
  }

  function career(R, sample) {
    const ax = careerAxis(R), C = global.ChaeksaBrief.CAREER;
    const row = (C[ax.group] || C['비겁'])[ax.elem] || ['미분류', '', ''];
    let share = null;
    if (sample && sample.jt && sample.n) share = Math.max(1, Math.round((sample.jt[ax.key] || 0) / sample.n * 100));
    const strong = R.analysis.strength;
    const l1 = strong === '신강' ? '신강 — 내 판을 직접 굴릴 때 힘이 난다'
      : strong === '신약' ? '신약 — 좋은 조직·좋은 사람 옆에서 몇 배가 된다'
      : '중화 — 조직도 독립도 되는 쪽, 선택지가 넓다';
    const l2 = '주력은 ' + ax.group + ' — ' + ({
      비겁: '내 손으로 밀어붙이는 힘', 식상: '만들어 내보이는 힘',
      재성: '값을 매기고 거둬들이는 힘', 관성: '질서를 세우고 지키는 힘',
      인성: '쌓고 읽어내는 힘' }[ax.group]);
    // 가장 약한 축 = 보완할 자리
    let low = GROUPS[0];
    GROUPS.forEach(g => { if (ax.sc[g] < ax.sc[low]) low = g; });
    const l3 = '얇은 축은 ' + low + ' — ' + ({
      비겁: '뚝심은 사람으로 메운다', 식상: '표현·산출은 훈련해야 는다',
      재성: '받아낼 돈은 남에게 안 맡긴다', 관성: '규칙과 마감은 장치로 걸어둔다',
      인성: '기초 공부는 미루면 발목 잡는다' }[low]);
    const l4 = '어울리는 일 — ' + row[2];
    return { key: ax.key, name: row[0], note: row[1], jobs: row[2], group: ax.group, elem: ax.elem,
             share, n: sample && sample.n ? sample.n : 0, lines: [l1, l2, l3, l4] };
  }


  // ── 감정첩 3종 공통 판 ──
  // 녹패·도화첩·천직첩이 각자 좌표를 쓰다가 줄이 하단 문구 아래로 밀려나거나
  // 왼쪽 선이 어긋났다. 세로 위치를 한 곳에서 정하고 셋이 같은 판을 쓴다.
  // 세로 위치는 위에서부터 흘려 잡는다. 고정 좌표를 쓰던 때는 배지가 없는 카드에
  // 70px가 텅 비고, 배지가 있는 카드는 유형 표기와 2px 겹쳤다.
  const FR = {
    title: 78, sub: 100, name: 124, rule: 140,   // 머리
    key: 172,                                    // 유형표기(선택)
    bodyBottom: 452,               // 본문 띠 — 도장(462~)에 닿지 않는다
    lineH: 17, itemGap: 7, bodyX: 40, bodyW: 278, bodySize: 11.5,
    sealX: 274, sealY: 462, sealW: 46,
    foot: 534,
  };
  const escF = (x) => String(x).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 폭에 맞춰 접기. maxPx = 쓸 수 있는 가로 폭, size = 폰트 크기(한글 한 글자 ≈ 크기).
  // 반환은 [줄, 첫조각인가] 쌍 — 이어지는 줄에 글머리표를 붙이지 않기 위해서다.
  function foldTxt(t, maxPx, size, lead) {
    const max = Math.max(6, Math.floor(maxPx / size) - (lead || 0));
    const src = String(t);
    if (src.length <= max) return [[src, true]];
    // 구분자는 줄 끝에도 줄 머리에도 오면 안 된다.
    //  · 는 앞말에만 붙이면 이번엔 줄 끝에 '·'가 남는다(원래 증상 그대로).
    //    'A · B · C'를 통째로 한 덩어리로 묶어 항상 안쪽에 오게 한다.
    //  — 는 뒷말에 붙인다. '것 —'로 줄이 끝나는 것을 막는다.
    const raw = src.split(' ');
    const w = [];
    for (let i = 0; i < raw.length; i++) {
      const x = raw[i];
      if (x === '·' && w.length && i + 1 < raw.length) {
        w[w.length - 1] += ' · ' + raw[++i];
      } else if (x === '—' && i + 1 < raw.length) {
        w.push('— ' + raw[++i]);
      } else w.push(x);
    }
    // 낱말 배열로 다룬다. 문자열로 두고 다시 쪼개면 '태양 ·'처럼 묶어둔 덩어리가
    // 풀려서 가운뎃점이 다음 줄 머리로 떨어진다 — 새 항목처럼 보인다.
    const out = []; let cur = [], first = true;
    const len = (arr) => arr.join(' ').length;
    for (let i = 0; i < w.length; i++) {
      if (cur.length && len(cur.concat([w[i]])) > max) {
        const last = cur[cur.length - 1];
        // 줄 끝이 두 글자 이하면 다음 줄로 내린다 — '… 몇 / 배가 된다'를 막는다.
        if (cur.length > 1 && last.length <= 2 && (last + ' ' + w[i]).length <= max) {
          out.push([cur.slice(0, -1).join(' '), first]);
          cur = [last, w[i]];
        } else {
          out.push([cur.join(' '), first]);
          cur = [w[i]];
        }
        first = false;
      } else cur.push(w[i]);
    }
    if (cur.length) out.push([cur.join(' '), first]);
    return out;
  }

  // 본문 맞추기 — 글자 크기·줄간격·항목간격을 한 벌로 묶어 위에서부터 시도한다.
  // 예전엔 넘치면 줄을 버렸는데, 그 바람에 '사람이 돕'처럼 말이 잘려 사라졌다.
  // 내용을 버리는 대신 촘촘한 조판으로 내려간다.
  const FITS = [[11.5, 17, 7], [11, 15.5, 6], [10.5, 14, 5], [10, 13, 4]];
  function fitBody(lines, col, top) {
    const avail = FR.bodyBottom - top;
    let pick = FITS[FITS.length - 1], rows = null;
    for (const f of FITS) {
      const r = [];
      lines.forEach(l => foldTxt(l, FR.bodyW, f[0], 2).forEach(L => r.push(L)));
      const h = (r.length - 1) * f[1] + (lines.length - 1) * f[2];
      if (h <= avail) { pick = f; rows = r; break; }
    }
    if (!rows) {
      rows = [];
      lines.forEach(l => foldTxt(l, FR.bodyW, pick[0], 2).forEach(L => rows.push(L)));
    }
    let y = top, svg = '';
    rows.forEach((L, i) => {
      if (L[1] && i) y += pick[2];
      svg += '<text x="' + (L[1] ? FR.bodyX : FR.bodyX + 11) + '" y="' + y + '" font-size="' + pick[0] + '" fill="' + col + '">'
        + escF((L[1] ? '· ' : '') + L[0]) + '</text>';
      y += pick[1];
    });
    return svg;
  }

  // c = { grad:[3색], ink, ink2, ink3, line, bigCol, sealCol, seal }
  function drawFrame(c, d) {
    const F = 'Noto Serif KR,serif';
    const t = (y, size, col, txt, weight, ls) => txt ? '<text x="180" y="' + y + '" text-anchor="middle" font-size="' + size
      + '" fill="' + col + '"' + (weight ? ' font-weight="' + weight + '"' : '')
      + (ls ? ' letter-spacing="' + ls + '"' : '') + '>' + escF(txt) + '</text>' : '';
    // 결과 블록 흐름: 큰글씨 → 한 줄 설명 → (배지) → 희귀도 → 점선
    const bigY = d.key ? 218 : 206;
    const noteY = bigY + 28;
    const hasBadge = !!(d.badges && d.badges.length);
    const badgeTop = noteY + 14;                 // rect 상단
    const rareY = hasBadge ? badgeTop + 44 : noteY + 26;
    const dashY = rareY + 16;
    const badges = (d.badges || []).map((b, i) => {
      const w = 54, gap = 8, total = d.badges.length * w + (d.badges.length - 1) * gap;
      return '<g transform="translate(' + Math.round(180 - total / 2 + i * (w + gap)) + ',' + badgeTop + ')">'
        + '<rect width="' + w + '" height="24" rx="12" fill="' + (c.badgeBg || c.sealCol) + '" opacity=".9"/>'
        + '<text x="27" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">' + escF(b) + '</text></g>';
    }).join('');
    return '<svg viewBox="0 0 360 560" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;display:block" font-family="' + F + '">'
      + '<defs><linearGradient id="' + c.id + '" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0" stop-color="' + c.grad[0] + '"/><stop offset=".55" stop-color="' + c.grad[1] + '"/>'
      + '<stop offset="1" stop-color="' + c.grad[2] + '"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="26" fill="url(#' + c.id + ')"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="18" fill="none" stroke="' + c.line + '" stroke-width="1.5" opacity=".7"/>'
      + (c.deco || '')
      + t(FR.title, 34, c.ink, d.title, 900, 12)
      + t(FR.sub, 11.5, c.ink3, d.sub, null, 4)
      + t(FR.name, 13, c.ink2, d.name, 700)
      + '<line x1="42" y1="' + FR.rule + '" x2="318" y2="' + FR.rule + '" stroke="' + c.line + '" stroke-width="1" opacity=".55"/>'
      + t(FR.key, 13.5, c.ink3, d.key, 700, 5)
      + t(bigY, 33, c.bigCol, d.big, 900)
      + t(noteY, 12, c.ink2, d.note)
      + badges
      + t(rareY, 12.5, c.ink, d.rare, 700)
      + '<line x1="42" y1="' + dashY + '" x2="318" y2="' + dashY + '" stroke="' + c.line + '" stroke-width="1" stroke-dasharray="5 4" opacity=".55"/>'
      + fitBody(d.lines, c.ink2, dashY + 22)
      + '<g transform="translate(' + FR.sealX + ',' + FR.sealY + ')">'
      + '<rect width="' + FR.sealW + '" height="' + FR.sealW + '" rx="8" fill="#b23a2a" opacity=".92"/>'
      + '<text x="' + (FR.sealW / 2) + '" y="' + (FR.sealW / 2 + 8) + '" text-anchor="middle" font-family="' + F
      + '" font-size="19" font-weight="900" fill="#fdf3e7">' + c.seal + '</text></g>'
      + t(FR.foot, 10.5, c.ink3, d.foot, null, 1)
      + '</svg>';
  }

  function drawNokpae(name, w) {
    return drawFrame({
      id: 'nkw', grad: ['#7a5a38', '#6b4d2f', '#5d4228'], line: '#c9a86a',
      ink: '#f3e3c0', ink2: '#e2d0ab', ink3: '#c9b08a', bigCol: '#e9c877', sealCol: '#b23a2a', seal: '戶曹',
      deco: '<path d="M30 118 Q180 108 330 122 M30 300 Q180 292 330 302" stroke="#54391f" stroke-width="1" fill="none" opacity=".45"/>'
        + '<circle cx="180" cy="44" r="9" fill="#3d2a16"/><circle cx="180" cy="44" r="9" fill="none" stroke="#c9a86a" stroke-width="1.4"/>'
        + '<path d="M172 38 Q180 18 188 38" stroke="#b23a2a" stroke-width="4" fill="none" stroke-linecap="round"/>',
    }, {
      title: '祿牌', sub: '호조 재물 그릇 감정서', name: name,
      key: '재물 점수 ' + w.score, big: w.grade.han,
      note: w.grade.note,
      // 상위 %는 위쪽 절반일 때만 앞세운다. 아래쪽 사람에게 등수를 큰 글씨로
      // 박으면 그건 재미가 아니라 한 대 더 때리는 것이다(점수는 아래에 그대로 남는다).
      rare: w.grade.name + (w.top != null && w.top <= 50 ? ' · 상위 ' + w.top + '%' : ''),
      lines: w.lines, foot: 'chaeksa.kr · 재성 세력·유통·구멍으로 계산',
    });
  }

  function drawDohwa(name, v) {
    const petal = (x, y, r, o) => '<g transform="translate(' + x + ',' + y + ') rotate(' + r + ')" opacity="' + o + '">'
      + '<path d="M0 0 Q7 -9 0 -18 Q-7 -9 0 0" fill="#e4a0b4"/></g>';
    return drawFrame({
      id: 'dhw', grad: ['#fbeef1', '#f6e2e8', '#efd4dd'], line: '#c9647f',
      ink: '#8e3b56', ink2: '#6b3348', ink3: '#a6607a', bigCol: '#8e3b56',
      sealCol: '#c9647f', badgeBg: '#c9647f', seal: '緣',
      deco: petal(56, 60, 20, .5) + petal(312, 108, -35, .4) + petal(40, 486, 15, .3) + petal(322, 512, -20, .4),
    }, {
      title: '桃花帖', sub: '연애·인연 감정첩', name: name,
      key: v.key, badges: v.badges, big: v.name, note: v.note,
      rare: v.share == null ? '' : '같은 유형 ' + v.share + '%',
      lines: v.lines, foot: 'chaeksa.kr · 배우자궁·배우자성·신살로 감정',
    });
  }

  function drawJikcheop(name, v) {
    return drawFrame({
      id: 'jkw', grad: ['#1f4b47', '#1a413e', '#153634'], line: '#7fb3a8',
      ink: '#e8f3ef', ink2: '#d0e3de', ink3: '#9fc9c0', bigCol: '#eddc9a', sealCol: '#b23a2a', seal: '職',
      deco: '<path d="M30 118 H330 M30 300 H330" stroke="#7fb3a8" stroke-width="1" fill="none" opacity=".3"/>',
    }, {
      title: '天職帖', sub: '적성 감정첩', name: name,
      key: v.key, big: v.name, note: v.note,
      rare: v.share == null ? '' : '같은 유형 ' + v.share + '%',
      lines: v.lines, foot: 'chaeksa.kr · 십신 세력 × 오행 분포로 감정',
    });
  }

  // ── 인생 곡선 — 대운도(大運圖) ──
  // 대운 아홉 칸을 같은 잣대로 채점해 곡선으로 그린다. 뼈대는 시즌 카드(seasonNow)와
  // 같은 강약 판정이다 — 두 카드가 서로 다른 말을 하면 그게 결함이다.
  // 여기에 조후(궁통보감 용신 오행)와 일지 충·합을 얹는다.
  const SAMHAP_L = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
  function daeunScore(R, du) {
    const a = R.analysis, de = E.STEM_ELEM[a.dayStem], ec = a.elemCount;
    let sc = 0;
    [E.STEM_ELEM[du.stem], E.BRANCH_ELEM[du.branch]].forEach(e => {
      const sup = E.siding(de, e) > 0;
      sc += a.strengthScore < 0.45 ? (sup ? 1 : 0)
          : a.strengthScore > 0.55 ? (sup ? 0 : 1)
          : ec[e] <= 1 ? 1 : ec[e] >= 3 ? 0 : 0.5;
    });
    let v = sc * 30;                                   // 강약 부합 0~60
    // 조후 — 궁통보감 용신 오행이 대운에 들어오는가
    const C = global.ChaeksaClassic;
    if (C && C.gungtong) {
      try {
        const g = C.gungtong(R);
        const elOf = (ch) => E.STEM_ELEM[E.STEMS.indexOf(ch)];
        const duEl = [E.STEM_ELEM[du.stem], E.BRANCH_ELEM[du.branch]];
        if (g.need && duEl.indexOf(elOf(g.need)) >= 0) v += 25;
        else if (g.aux && g.aux.some(x => duEl.indexOf(elOf(x)) >= 0)) v += 12;
      } catch (e) {}
    }
    // 일지(배우자·나의 자리)와의 관계
    const db = R.pillars.day.branch, b = du.branch;
    if ((db - b + 12) % 12 === 6) v -= 12;             // 충
    else if (db + b === 13 || db + b === 1) v += 8;    // 육합
    else if (SAMHAP_L.some(gp => gp.indexOf(db) >= 0 && gp.indexOf(b) >= 0 && db !== b)) v += 6;
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  // 곡선의 생김새로 유형을 낸다. '앞으로의 최고 구간'을 머리에 세웠더니 남은 인생
  // 전체에서 찾느라 스물이든 마흔이든 죄다 칠팔십 대가 나왔다 — 맞는 답이지만
  // 아무 쓸모가 없다. 나이 대신 모양을 말하고, 당장 쓸 정보는 본문에 둔다.
  const CURVE_KIND = {
    대기만성: '뒤로 갈수록 두터워지는 곡선',
    초년집중: '이른 나이에 크게 열린 곡선',
    중년절정: '가운데가 솟은 곡선',
    파도: '오르내림이 큰 곡선',
    완만: '큰 기복 없이 이어지는 곡선',
  };
  function lifeCurve(R, todayD) {
    const list = R.daeun.list.map(d => ({ d, v: daeunScore(R, d) }));
    const cur = E.currentDaeun(R, todayD || new Date());
    const curIdx = cur ? list.findIndex(x => x.d.startAge === cur.startAge) : -1;
    let hi = 0, lo = 0;
    list.forEach((x, i) => { if (x.v > list[hi].v) hi = i; if (x.v < list[lo].v) lo = i; });
    const vs = list.map(x => x.v), n = vs.length;
    const avg = (arr) => arr.reduce((p, c) => p + c, 0) / (arr.length || 1);
    const early = avg(vs.slice(0, Math.ceil(n / 3)));
    const mid = avg(vs.slice(Math.ceil(n / 3), Math.ceil(n * 2 / 3)));
    const late = avg(vs.slice(Math.ceil(n * 2 / 3)));
    const range = list[hi].v - list[lo].v;
    // 폭이 좁으면 방향을 말할 게 없다. 기존 '평탄/완만' 두 갈래는 하나도 안 걸려 합쳤다.
    const kind = range <= 25 ? '완만'
      : late - early >= 10 ? '대기만성'
      : early - late >= 10 ? '초년집중'
      : mid - Math.max(early, late) >= 8 ? '중년절정'
      : '파도';
    const gradeOf = (v) => (SEASON_GRADE.find(g => v / 50 >= g.min) || SEASON_GRADE[4]);
    const nxt = curIdx >= 0 && curIdx + 1 < n ? list[curIdx + 1] : null;
    const lines = [];
    if (curIdx >= 0) {
      const g = gradeOf(list[curIdx].v);
      lines.push('지금은 ' + list[curIdx].d.startAge + '세 대운 ' + E.fmt.pillar(list[curIdx].d) + ' — ' + g.name + '. ' + g.line);
    } else {
      lines.push('아직 첫 대운 전 — 곡선은 ' + list[0].d.startAge + '세부터 시작합니다');
    }
    if (nxt) {
      const g2 = gradeOf(nxt.v), 방향 = nxt.v > list[curIdx].v + 8 ? '올라갑니다' : nxt.v < list[curIdx].v - 8 ? '내려갑니다' : '비슷하게 갑니다';
      lines.push('다음 10년(' + nxt.d.startAge + '세~)은 ' + g2.name + ' — 지금보다 ' + 방향);
    } else if (curIdx >= 0) {
      lines.push('마지막 대운 구간입니다 — 곡선은 여기서 마무리됩니다');
    } else {
      lines.push('첫 대운 ' + list[0].d.startAge + '세부터 열 해마다 판이 바뀝니다');
    }
    // 최고 구간이 과거면 '당신 전성기는 지났다'로 읽힌다. 앞에 남은 것을 함께 짚는다.
    if (curIdx >= 0 && hi < curIdx) {
      let ah = -1;
      for (let i = curIdx + 1; i < n; i++) if (ah < 0 || list[i].v > list[ah].v) ah = i;
      if (ah >= 0) lines.push('앞으로 남은 구간 중에는 ' + list[ah].d.startAge + '~' + list[ah].d.endAge + '세가 가장 높습니다');
      else lines.push('가장 낮은 구간은 ' + list[lo].d.startAge + '~' + list[lo].d.endAge + '세였습니다');
    } else {
      lines.push('가장 높은 구간은 ' + list[hi].d.startAge + '~' + list[hi].d.endAge + '세, 가장 낮은 구간은 ' + list[lo].d.startAge + '~' + list[lo].d.endAge + '세');
    }
    lines.push('곡선은 대운이 내 사주에 필요한 것을 갖고 오는가로 잽니다');
    return { list, hi, lo, curIdx, headIdx: hi, kind, kindNote: CURVE_KIND[kind],
             peak: list[hi].d, low: list[lo].d, lines,
             peakTxt: list[hi].d.startAge + '~' + list[hi].d.endAge + '세' };
  }

  function drawLifeCurve(name, lc) {
    const F = 'Noto Serif KR,serif';
    const X0 = 46, X1 = 314, Y0 = 236, Y1 = 356;      // 그래프 자리
    const n = lc.list.length;
    const px = (i) => X0 + (X1 - X0) * (n === 1 ? 0.5 : i / (n - 1));
    const py = (v) => Y1 - (Y1 - Y0) * (v / 100);
    const pts = lc.list.map((x, i) => px(i) + ',' + py(x.v)).join(' ');
    const area = 'M' + px(0) + ',' + Y1 + ' L' + lc.list.map((x, i) => px(i) + ',' + py(x.v)).join(' L') + ' L' + px(n - 1) + ',' + Y1 + ' Z';
    const dots = lc.list.map((x, i) => {
      const isCur = i === lc.curIdx, isHi = i === lc.headIdx;
      return '<circle cx="' + px(i) + '" cy="' + py(x.v) + '" r="' + (isCur ? 5.5 : isHi ? 4.5 : 2.8) + '" '
        + 'fill="' + (isCur ? '#b23a2a' : isHi ? '#c8a24a' : '#8a7a58') + '"/>';
    }).join('');
    const labels = lc.list.map((x, i) => (i % 2 === 0 || i === lc.headIdx)
      ? '<text x="' + px(i) + '" y="' + (Y1 + 15) + '" text-anchor="middle" font-size="9" fill="#8a7a58">' + x.d.startAge + '</text>' : '').join('');
    const hiLab = '<text x="' + px(lc.headIdx) + '" y="' + (py(lc.list[lc.headIdx].v) - 11) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#8a6a1e">' + '최고' + '</text>';
    const curLab = lc.curIdx >= 0 ? '<text x="' + px(lc.curIdx) + '" y="' + (py(lc.list[lc.curIdx].v) + 18) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#b23a2a">지금</text>' : '';
    let by = 392, body = '';
    lc.lines.forEach((l) => {
      const ls = foldTxt(l, 274, 11.5, 2);
      ls.forEach((L, j) => {
        body += '<text x="' + (L[1] ? 42 : 53) + '" y="' + (by + j * 16) + '" font-size="11.5" fill="#4a3a28">'
          + escF((L[1] ? '· ' : '') + L[0]) + '</text>';
      });
      by += (ls.length - 1) * 16 + 21;
    });
    return '<svg viewBox="0 0 360 560" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;display:block" font-family="' + F + '">'
      + '<defs><linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#f8f2e4"/><stop offset="1" stop-color="#ece1c9"/></linearGradient>'
      + '<linearGradient id="lca" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#c8a24a" stop-opacity=".45"/><stop offset="1" stop-color="#c8a24a" stop-opacity="0"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="26" fill="url(#lcg)"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="18" fill="none" stroke="#a98a52" stroke-width="1.5" opacity=".7"/>'
      + '<text x="180" y="78" text-anchor="middle" font-size="34" font-weight="900" fill="#5c421c" letter-spacing="12">大運圖</text>'
      + '<text x="180" y="100" text-anchor="middle" font-size="11.5" fill="#8a7a58" letter-spacing="4">인생 흐름도</text>'
      + '<text x="180" y="124" text-anchor="middle" font-size="13" fill="#5c4c2e" font-weight="700">' + escF(name) + '</text>'
      + '<line x1="42" y1="140" x2="318" y2="140" stroke="#a98a52" stroke-width="1" opacity=".55"/>'
      + '<text x="180" y="170" text-anchor="middle" font-size="30" font-weight="900" fill="#8a6a1e">' + escF(lc.kind + '형') + '</text>'
      + '<text x="180" y="192" text-anchor="middle" font-size="11.5" fill="#8a7a58">' + escF(lc.kindNote) + '</text>'
      + '<text x="180" y="214" text-anchor="middle" font-size="12" fill="#5c4c2e" font-weight="700">최고 구간 ' + escF(lc.peakTxt) + '</text>'
      + '<line x1="' + X0 + '" y1="' + Y1 + '" x2="' + X1 + '" y2="' + Y1 + '" stroke="#c9b285" stroke-width="1"/>'
      + '<path d="' + area + '" fill="url(#lca)"/>'
      + '<polyline points="' + pts + '" fill="none" stroke="#8a6a1e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
      + dots + labels + hiLab + curLab
      + '<text x="' + X1 + '" y="' + (Y1 + 15) + '" text-anchor="end" font-size="9" fill="#a08a5f">세</text>'
      + body
      + '<g transform="translate(274,462)"><rect width="46" height="46" rx="8" fill="#b23a2a" opacity=".92"/>'
      + '<text x="23" y="31" text-anchor="middle" font-family="' + F + '" font-size="19" font-weight="900" fill="#fdf3e7">運</text></g>'
      + '<text x="180" y="534" text-anchor="middle" font-size="10.5" fill="#8a7a58" letter-spacing="1">chaeksa.kr · 대운 아홉 칸을 같은 잣대로 채점</text>'
      + '</svg>';
  }

  // ── 열두 달 흐름 — 세운도(歲運圖) ──
  // 시간 축의 구멍을 메운다: 하루(오늘의 흐름) → **한 해** → 십 년(인생 곡선).
  // 채점 잣대는 대운도·시즌과 같다. 축만 다르지 자가 다르면 카드끼리 싸운다.
  const MONTH_MID = [0, 20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];  // 절기 안쪽 날짜
  function pillarScore(R, pl) {
    const a = R.analysis, de = E.STEM_ELEM[a.dayStem], ec = a.elemCount;
    let sc = 0;
    [E.STEM_ELEM[pl.stem], E.BRANCH_ELEM[pl.branch]].forEach(e => {
      const sup = E.siding(de, e) > 0;
      sc += a.strengthScore < 0.45 ? (sup ? 1 : 0)
          : a.strengthScore > 0.55 ? (sup ? 0 : 1)
          : ec[e] <= 1 ? 1 : ec[e] >= 3 ? 0 : 0.5;
    });
    let v = sc * 30;
    const C = global.ChaeksaClassic;
    if (C && C.gungtong) {
      try {
        const g = C.gungtong(R);
        const elOf = (ch) => E.STEM_ELEM[E.STEMS.indexOf(ch)];
        const el = [E.STEM_ELEM[pl.stem], E.BRANCH_ELEM[pl.branch]];
        if (g.need && el.indexOf(elOf(g.need)) >= 0) v += 25;
        else if (g.aux && g.aux.some(x => el.indexOf(elOf(x)) >= 0)) v += 12;
      } catch (e) {}
    }
    const db = R.pillars.day.branch, b = pl.branch;
    if ((db - b + 12) % 12 === 6) v -= 12;
    else if (db + b === 13 || db + b === 1) v += 8;
    else if (SAMHAP_L.some(gp => gp.indexOf(db) >= 0 && gp.indexOf(b) >= 0 && db !== b)) v += 6;
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  const YEAR_KIND = {
    '상승하는 해': '뒤로 갈수록 열립니다',
    '전반이 밝은 해': '앞쪽에 기회가 몰려 있습니다',
    '한여름 같은 해': '가운데가 가장 뜨겁습니다',
    '기복이 큰 해': '달마다 결이 달라집니다',
    '잔잔한 해': '큰 파도 없이 갑니다',
  };
  function yearFlow(R, year, todayD) {
    const now = todayD || new Date();
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const tf = E.dateFortune(year, m, MONTH_MID[m]);
      months.push({ m, pl: tf.month, v: pillarScore(R, tf.month) });
    }
    const yp = E.dateFortune(year, 6, 21).year;          // 연주(입춘 이후로 안전한 날짜)
    const yv = pillarScore(R, yp);
    let hi = 0, lo = 0;
    months.forEach((x, i) => { if (x.v > months[hi].v) hi = i; if (x.v < months[lo].v) lo = i; });
    const vs = months.map(x => x.v);
    const avg = (arr) => arr.reduce((p, c) => p + c, 0) / (arr.length || 1);
    const q1 = avg(vs.slice(0, 4)), q2 = avg(vs.slice(4, 8)), q3 = avg(vs.slice(8));
    const range = months[hi].v - months[lo].v;
    // 실측: 열두 달 진폭은 최소 30 · 중앙 76. 22로 끊으면 한 명도 안 걸린다(35 → 1.5%).
    const kind = range <= 35 ? '잔잔한 해'
      : q3 - q1 >= 10 ? '상승하는 해'
      : q1 - q3 >= 10 ? '전반이 밝은 해'
      : q2 - Math.max(q1, q3) >= 8 ? '한여름 같은 해' : '기복이 큰 해';
    const gradeOf = (v) => (SEASON_GRADE.find(g => v / 50 >= g.min) || SEASON_GRADE[4]);
    const 올해 = now.getFullYear() === year;
    const curM = 올해 ? now.getMonth() + 1 : 0;
    // 남은 달 중 최고 — 지난 달을 최고라고 알려주면 쓸 데가 없다
    let nextHi = -1;
    months.forEach((x, i) => { if (x.m > curM && (nextHi < 0 || x.v > months[nextHi].v)) nextHi = i; });
    const lines = [];
    lines.push(year + '년은 ' + E.fmt.pillar(yp) + '년 — ' + gradeOf(yv).name + '. ' + gradeOf(yv).line);
    if (올해 && nextHi >= 0) lines.push('남은 달 중 가장 좋은 때는 ' + months[nextHi].m + '월 — ' + gradeOf(months[nextHi].v).name);
    else if (올해) lines.push('올해 가장 좋았던 달은 ' + months[hi].m + '월이었습니다');
    else lines.push('가장 좋은 달은 ' + months[hi].m + '월 — ' + gradeOf(months[hi].v).name);
    lines.push('가장 눌리는 달은 ' + months[lo].m + '월 — 큰 결정은 앞뒤 달로 옮기면 편합니다');
    lines.push('달의 기운은 절기로 나눕니다. 달력 1일이 아니라 입절일이 경계입니다');
    const 남은표기 = 올해 && nextHi >= 0;
    return { year, months, hi, lo, curM, nextHi, 올해, 남은표기, kind, kindNote: YEAR_KIND[kind],
             yearPillar: yp, yearScore: yv, lines,
             bestTxt: (남은표기 ? months[nextHi].m : months[hi].m) + '월' };
  }

  function drawYearFlow(name, yf) {
    const F = 'Noto Serif KR,serif';
    const X0 = 42, X1 = 318, Y0 = 244, Y1 = 350;
    const bw = (X1 - X0) / 12;
    const bars = yf.months.map((x, i) => {
      const h = Math.max(3, (Y1 - Y0) * (x.v / 100));
      const bx = X0 + i * bw + 2, by = Y1 - h;
      const isHi = i === yf.hi, isNext = yf.남은표기 && i === yf.nextHi, isCur = x.m === yf.curM;
      const col = isNext ? '#2f6b4f' : isHi ? '#8a6a1e' : isCur ? '#b23a2a' : '#b9a575';
      return '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + (bw - 4).toFixed(1)
        + '" height="' + h.toFixed(1) + '" rx="2.5" fill="' + col + '" opacity="' + (isNext || isHi || isCur ? '.95' : '.55') + '"/>';
    }).join('');
    const labels = yf.months.map((x, i) => {
      const cx = X0 + i * bw + bw / 2;
      const on = x.m === yf.curM || (yf.남은표기 && i === yf.nextHi) || i === yf.hi;
      return '<text x="' + cx.toFixed(1) + '" y="' + (Y1 + 14) + '" text-anchor="middle" font-size="9.5" '
        + 'fill="' + (on ? '#4a3a28' : '#a08a5f') + '"' + (on ? ' font-weight="700"' : '') + '>' + x.m + '</text>';
    }).join('');
    const mark = yf.남은표기
      ? '<text x="' + (X0 + yf.nextHi * bw + bw / 2).toFixed(1) + '" y="' + (Y1 - (Y1 - Y0) * (yf.months[yf.nextHi].v / 100) - 7).toFixed(1)
        + '" text-anchor="middle" font-size="10" font-weight="700" fill="#2f6b4f">여기</text>' : '';
    let by2 = 386, body = '';
    yf.lines.forEach((l) => {
      const ls = foldTxt(l, 274, 11.5, 2);
      ls.forEach((L, j) => {
        body += '<text x="' + (L[1] ? 42 : 53) + '" y="' + (by2 + j * 16) + '" font-size="11.5" fill="#3f3a30">'
          + escF((L[1] ? '· ' : '') + L[0]) + '</text>';
      });
      by2 += (ls.length - 1) * 16 + 21;
    });
    return '<svg viewBox="0 0 360 560" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;display:block" font-family="' + F + '">'
      + '<defs><linearGradient id="yfg" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#eef2ea"/><stop offset="1" stop-color="#dde5d9"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="26" fill="url(#yfg)"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="18" fill="none" stroke="#7d9478" stroke-width="1.5" opacity=".7"/>'
      + '<text x="180" y="78" text-anchor="middle" font-size="34" font-weight="900" fill="#33452f" letter-spacing="12">歲運圖</text>'
      + '<text x="180" y="100" text-anchor="middle" font-size="11.5" fill="#6b7a66" letter-spacing="4">' + yf.year + '년 열두 달 흐름</text>'
      + '<text x="180" y="124" text-anchor="middle" font-size="13" fill="#3f4d3b" font-weight="700">' + escF(name) + '</text>'
      + '<line x1="42" y1="140" x2="318" y2="140" stroke="#7d9478" stroke-width="1" opacity=".55"/>'
      + '<text x="180" y="172" text-anchor="middle" font-size="27" font-weight="900" fill="#33452f">' + escF(yf.kind) + '</text>'
      + '<text x="180" y="194" text-anchor="middle" font-size="11.5" fill="#6b7a66">' + escF(yf.kindNote) + '</text>'
      + '<text x="180" y="218" text-anchor="middle" font-size="12" fill="#2f6b4f" font-weight="700">'
      + escF((yf.남은표기 ? '남은 달 중 최고는 ' : '가장 좋은 달은 ') + yf.bestTxt) + '</text>'
      + '<line x1="' + X0 + '" y1="' + Y1 + '" x2="' + X1 + '" y2="' + Y1 + '" stroke="#b9c4b5" stroke-width="1"/>'
      + bars + labels + mark
      + '<text x="' + X1 + '" y="' + (Y1 + 14) + '" text-anchor="end" font-size="9" fill="#a0ae9c">월</text>'
      + body
      + '<g transform="translate(274,462)"><rect width="46" height="46" rx="8" fill="#b23a2a" opacity=".92"/>'
      + '<text x="23" y="31" text-anchor="middle" font-family="' + F + '" font-size="19" font-weight="900" fill="#fdf3e7">歲</text></g>'
      + '<text x="180" y="534" text-anchor="middle" font-size="10.5" fill="#6b7a66" letter-spacing="1">chaeksa.kr · 절기로 나눈 열두 달을 같은 잣대로</text>'
      + '</svg>';
  }

  // ── 우리 아이 — 육아첩(育兒帖) ──
  // 블로그로 들어오는 사람이 곧 예비 부모다. 아이를 놓고 보는 자리가 없어 만든다.
  // 축 둘: 부모 일간과 아이 일간의 오행 관계(생·극·비화) + 아이에게 무엇을 채워줄까(조후).
  const KID_REL = {
    생출: ['기꺼이 내주는 사이', '내 기운이 아이 쪽으로 흐릅니다. 주는 게 자연스러운 대신, 내가 비지 않게 챙겨야 합니다.'],
    생입: ['나를 채워주는 아이', '아이가 나를 밀어 올립니다. 이 아이 덕에 내가 풀리는 일이 자주 생깁니다.'],
    극출: ['내가 다잡는 사이', '내가 기준을 세우는 자리입니다. 옳은 말이라도 세게 나가면 아이가 닫힙니다.'],
    극입: ['나를 긴장시키는 아이', '아이가 내 약한 곳을 정확히 건드립니다. 나를 자라게 하는 쪽으로 씁니다.'],
    비화: ['거울 같은 사이', '결이 같아 말이 잘 통하는데, 같은 이유로 같은 실수를 합니다.'],
    // 천간합(甲己·乙庚·丙辛·丁壬·戊癸)은 극 관계인데도 서로를 묶는다.
    // 극으로만 말하면 반쪽이라 따로 뺀다.
    간합: ['묶여 있는 사이', '극인데 합입니다. 부딪히면서도 결국 서로를 놓지 못하는 배치입니다.'],
  };
  // 조후용신 오행 → 부모가 채워줄 것
  const KID_NEED = [
    ['자라게 두는 것', '새로 시작할 자유와 넓은 마당. 가지치기는 나중에 해도 늦지 않습니다'],
    ['밝게 하는 것', '칭찬과 무대. 잘한 걸 남 앞에서 말해주면 눈에 띄게 달라집니다'],
    ['붙잡아 주는 것', '규칙과 되풀이되는 하루. 예측되는 일상이 이 아이의 바닥을 만듭니다'],
    ['다듬는 것', '분명한 기준과 끝맺는 훈련. 시작만 하고 두는 걸 가장 조심합니다'],
    ['흐르게 하는 것', '쉼과 혼자 있는 시간. 빈틈없이 채우면 오히려 멈춰 섭니다'],
  ];
  const GUNG = { year: '조상·초년', month: '부모·자라는 동안', day: '자기 자신', hour: '자녀·말년' };

  function childCard(Rp, Rc) {
    const B = global.ChaeksaBrief;
    const pe = E.STEM_ELEM[Rp.analysis.dayStem], ce = E.STEM_ELEM[Rc.analysis.dayStem];
    const ps = Rp.analysis.dayStem, cs = Rc.analysis.dayStem;
    const rel = (ps - cs + 10) % 10 === 5 ? '간합'
      : pe === ce ? '비화'
      : (pe + 1) % 5 === ce ? '생출'
      : (ce + 1) % 5 === pe ? '생입'
      : (pe + 2) % 5 === ce ? '극출' : '극입';
    const [relName, relNote] = KID_REL[rel];
    // 아이에게 채워줄 것 — 궁통보감 조후용신의 오행
    let needIdx = -1, needCh = '';
    const C = global.ChaeksaClassic;
    if (C && C.gungtong) {
      try {
        const g = C.gungtong(Rc);
        needCh = g.need || '';
        if (needCh) needIdx = E.STEM_ELEM[E.STEMS.indexOf(needCh)];
      } catch (e) {}
    }
    const kidNick = B && B.MZ ? B.MZ.STEM[Rc.analysis.dayStem].nick : '';
    // 자녀궁 = 부모의 시주. 없으면(시간 모름) 그 말을 그대로 한다.
    const hp = Rp.pillars.hour;
    let 궁 = '시간을 모르면 자녀궁은 비워둡니다 — 아이 쪽만 봅니다';
    if (hp) {
      const db = Rc.pillars.day.branch, hb = hp.branch;
      궁 = (hb - db + 12) % 12 === 6 ? '내 자녀궁과 아이 일지가 충 — 부딪히는 만큼 오래 남는 사이'
        : (hb + db === 13 || hb + db === 1) ? '내 자녀궁과 아이 일지가 합 — 붙어 있는 게 편한 사이'
        : '내 자녀궁 ' + E.fmt.pillar(hp) + ' — 부딪힘도 끌림도 없는 담백한 자리';
    }
    const lines = [
      '아이는 ' + E.fmt.stem(Rc.analysis.dayStem) + ' 일간 · ' + kidNick + (Rc.analysis.strength ? ' · ' + Rc.analysis.strength : ''),
      relNote,
      needIdx >= 0 ? '채워줄 것은 ' + KID_NEED[needIdx][0] + ' — ' + KID_NEED[needIdx][1]
                   : '조후를 읽지 못했습니다 — 태어난 시간을 넣으면 정확해집니다',
      궁,
    ];
    return { rel, name: relName, note: relNote.split('.')[0],
             key: E.fmt.stem(Rc.analysis.dayStem) + ' 일간',
             need: needIdx >= 0 ? KID_NEED[needIdx][0] : '', kidNick, lines };
  }

  function drawChild(parentName, kidName, v) {
    return drawFrame({
      id: 'kdw', grad: ['#f2f7fb', '#e8f0f7', '#dde8f2'], line: '#7d9bb5',
      ink: '#2f4a5e', ink2: '#3f5568', ink3: '#6d8aa0', bigCol: '#2f4a5e', sealCol: '#b23a2a', seal: '育',
      deco: '<path d="M30 118 Q180 110 330 120 M30 300 Q180 294 330 302" stroke="#7d9bb5" stroke-width="1" fill="none" opacity=".4"/>',
    }, {
      title: '育兒帖', sub: '우리 아이 설명서',
      name: parentName + ' → ' + kidName,
      key: v.key, big: v.name, note: v.note,
      rare: v.need ? '채워줄 것 · ' + v.need : '',
      lines: v.lines, foot: 'chaeksa.kr · 부모·아이 일간 관계와 조후로 봅니다',
    });
  }

  global.ChaeksaTypecard = { SEASON_GRADE, mine, buildSample, gyeok, share, pastjob, drawGyoji, seasonNow, drawSeason, banToday, drawBan, accomplice, drawAccomplice, wealth, drawNokpae, love, drawDohwa, career, drawJikcheop, lifeCurve, drawLifeCurve, yearFlow, drawYearFlow, childCard, drawChild };
})(window);
