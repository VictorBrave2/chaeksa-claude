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
  const CACHE_KEY = 'chaeksa.typeSample.v7';   // v7: 연애 유형에 暗緣 축 추가 (v6: 연애 분포 동승)
  const N_SAMPLE = 10000;
  function buildSample(onTick, done) {
    try {
      const hit = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (hit && hit.n >= N_SAMPLE && hit.th && hit.wh && hit.lt) return done(hit);
    } catch (e) {}
    const seen = {}, wh = {}, lt = {}; let i = 0, n = 0;
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
          const lk = loveType(R).key; lt[lk] = (lt[lk] || 0) + 1; n++;
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
        const out = { seen, n, th, types: Object.keys(seen).length, wh, lt };
        try { ['v4','v5','v6'].forEach(k => localStorage.removeItem('chaeksa.typeSample.' + k)); } catch (e) {}
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
    const items = ban.금지.map((t, i) =>
      '<text x="52" y="' + (250 + i * 52) + '" font-size="15" fill="#8a3020" font-weight="700">禁</text>' +
      '<text x="82" y="' + (250 + i * 52) + '" font-size="14.5" fill="#4a3a28">' + esc3(t) + '</text>').join('');
    const okY = 250 + ban.금지.length * 52 + 14;
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
      + '<text x="82" y="' + (okY + 40) + '" font-size="14.5" fill="#33502e">' + esc3(ban.허가) + '</text>'
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
    let y = 218, body = '';
    v.죄목.forEach(t => { const ls = wrap(t);
      body += '<text x="46" y="' + y + '" font-size="14" fill="#8a3020" font-weight="700">罪</text>';
      ls.forEach((l,i)=>{ body += '<text x="74" y="' + (y + i*20) + '" font-size="13" fill="#4a3a28">' + esc4(l) + '</text>'; });
      y += ls.length*20 + 14; });
    v.참작.forEach(t => { const ls = wrap(t);
      body += '<text x="46" y="' + y + '" font-size="14" fill="#2f6b3a" font-weight="700">恕</text>';
      ls.forEach((l,i)=>{ body += '<text x="74" y="' + (y + i*20) + '" font-size="13" fill="#33502e">' + esc4(l) + '</text>'; });
      y += ls.length*20 + 14; });
    const 선고줄 = wrap(v.선고);
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
    const GOJI = [7, 10, 4, 1, 4];                         // 고지: 목未 화戌 토辰 금丑 수辰
    const gotgan = ['year', 'month', 'day', 'hour'].some(k => p[k] && p[k].branch === GOJI[wEl]) ? 6 : 0;
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

  function drawNokpae(name, w) {
    const F = 'Noto Serif KR,serif';
    const escN = (x) => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const top = w.top == null ? '' : ' · 상위 ' + w.top + '%';
    const body = w.lines.map((l, i) => '<text x="42" y="' + (356 + i * 29) + '" font-size="12.5" fill="#f0e2c6">' + escN('· ' + l) + '</text>').join('');
    return '<svg viewBox="0 0 360 560" xmlns="http://www.w3.org/2000/svg" font-family="' + F + '">'
      + '<defs><linearGradient id="nkw" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0" stop-color="#7a5a38"/><stop offset=".5" stop-color="#6b4d2f"/><stop offset="1" stop-color="#5d4228"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="26" fill="url(#nkw)"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="18" fill="none" stroke="#c9a86a" stroke-width="1.6" opacity=".85"/>'
      + '<path d="M30 120 Q180 108 330 122 M30 246 Q180 236 330 248 M30 466 Q180 456 330 468" stroke="#54391f" stroke-width="1" fill="none" opacity=".5"/>'
      + '<circle cx="180" cy="44" r="9" fill="#3d2a16"/><circle cx="180" cy="44" r="9" fill="none" stroke="#c9a86a" stroke-width="1.4"/>'
      + '<path d="M172 38 Q180 18 188 38" stroke="#b23a2a" stroke-width="4" fill="none" stroke-linecap="round"/>'
      + '<text x="180" y="99" text-anchor="middle" font-size="36" font-weight="900" fill="#f3e3c0" letter-spacing="14">祿牌</text>'
      + '<text x="180" y="123" text-anchor="middle" font-size="12" fill="#d9c194" letter-spacing="4">호조 재물 그릇 감정서</text>'
      + '<text x="180" y="153" text-anchor="middle" font-size="13.5" font-weight="700" fill="#f0e2c6">' + escN(name) + '</text>'
      + '<line x1="42" y1="171" x2="318" y2="171" stroke="#c9a86a" stroke-width="1.2" opacity=".7"/>'
      + '<text x="180" y="262" text-anchor="middle" font-size="72" font-weight="900" fill="#e9c877">' + w.grade.han + '</text>'
      + '<text x="180" y="296" text-anchor="middle" font-size="17" font-weight="800" fill="#f3e3c0">' + escN(w.grade.name + top) + '</text>'
      + '<text x="180" y="318" text-anchor="middle" font-size="11.5" fill="#d9c194">' + escN(w.grade.note) + '</text>'
      + '<line x1="42" y1="334" x2="318" y2="334" stroke="#c9a86a" stroke-width="1.2" stroke-dasharray="5 4" opacity=".7"/>'
      + body
      + '<g transform="translate(272,464)"><rect width="50" height="50" rx="8" fill="#b23a2a" opacity=".92"/>'
      + '<text x="25" y="33" text-anchor="middle" font-family="' + F + '" font-size="19" font-weight="900" fill="#fdf3e7">戶曹</text></g>'
      + '<text x="42" y="500" font-size="10.5" fill="#c9b08a">재물 점수 ' + w.score + (w.n ? ' · 표본 ' + w.n.toLocaleString() + '명 중앙값 40' : '') + '</text>'
      + '<text x="180" y="536" text-anchor="middle" font-size="10.5" fill="#b39a72" letter-spacing="2">chaeksa.kr \u00b7 재성 세력·유통·구멍으로 계산한 그릇</text>'
      + '</svg>';
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

  function drawDohwa(name, v) {
    const F = 'Noto Serif KR,serif';
    const escD = (x) => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const body = v.lines.map((l, i) => '<text x="42" y="' + (368 + i * 29) + '" font-size="12.5" fill="#5c3242">' + escD('· ' + l) + '</text>').join('');
    const bd = v.badges.map((b, i) => '<g transform="translate(' + (42 + i * 62) + ',196)">'
      + '<rect width="54" height="24" rx="12" fill="#c9647f" opacity=".9"/>'
      + '<text x="27" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="#fff6f8">' + b + '</text></g>').join('');
    // 꽃잎 장식
    const petal = (x, y, r, o) => '<g transform="translate(' + x + ',' + y + ') rotate(' + r + ')" opacity="' + o + '">'
      + '<path d="M0 0 Q7 -9 0 -18 Q-7 -9 0 0" fill="#e4a0b4"/></g>';
    return '<svg viewBox="0 0 360 560" xmlns="http://www.w3.org/2000/svg" font-family="' + F + '">'
      + '<defs><linearGradient id="dhw" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0" stop-color="#fbeef1"/><stop offset=".55" stop-color="#f6e2e8"/><stop offset="1" stop-color="#efd4dd"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="26" fill="url(#dhw)"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="18" fill="none" stroke="#c9647f" stroke-width="1.4" opacity=".55"/>'
      + petal(56, 84, 20, .5) + petal(312, 132, -35, .4) + petal(40, 470, 15, .35) + petal(322, 500, -20, .45)
      + '<text x="180" y="80" text-anchor="middle" font-size="34" font-weight="900" fill="#8e3b56" letter-spacing="12">桃花帖</text>'
      + '<text x="180" y="104" text-anchor="middle" font-size="12" fill="#a6607a" letter-spacing="4">연애·인연 감정첩</text>'
      + '<text x="180" y="134" text-anchor="middle" font-size="13.5" font-weight="700" fill="#6b2f45">' + escD(name) + '</text>'
      + '<line x1="42" y1="152" x2="318" y2="152" stroke="#c9647f" stroke-width="1" opacity=".5"/>'
      + '<text x="180" y="180" text-anchor="middle" font-size="15" font-weight="800" fill="#a6607a" letter-spacing="6">' + v.key + '</text>'
      + bd
      + '<text x="180" y="266" text-anchor="middle" font-size="27" font-weight="900" fill="#8e3b56">' + escD(v.name) + '</text>'
      + '<text x="180" y="296" text-anchor="middle" font-size="11.5" fill="#8a5468">' + escD(v.note) + '</text>'
      + (v.share != null ? '<text x="180" y="326" text-anchor="middle" font-size="12.5" font-weight="700" fill="#6b2f45">같은 유형 ' + v.share + '%</text>' : '')
      + '<line x1="42" y1="346" x2="318" y2="346" stroke="#c9647f" stroke-width="1" stroke-dasharray="5 4" opacity=".5"/>'
      + body
      + '<g transform="translate(272,464)"><rect width="50" height="50" rx="8" fill="#b23a2a" opacity=".9"/>'
      + '<text x="25" y="33" text-anchor="middle" font-family="' + F + '" font-size="21" font-weight="900" fill="#fdf3e7">緣</text></g>'
      + '<text x="42" y="500" font-size="10.5" fill="#a6607a">배우자궁·배우자성 + 신살(도화·홍염·귀인)로 감정' + (v.n ? ' · 표본 ' + v.n.toLocaleString() + '명' : '') + '</text>'
      + '<text x="180" y="536" text-anchor="middle" font-size="10.5" fill="#b3798c" letter-spacing="2">chaeksa.kr \u00b7 두 사람 사이는 공범 판결에서</text>'
      + '</svg>';
  }

  global.ChaeksaTypecard = { mine, buildSample, gyeok, share, pastjob, drawGyoji, seasonNow, drawSeason, banToday, drawBan, accomplice, drawAccomplice, wealth, drawNokpae, love, drawDohwa };
})(window);
