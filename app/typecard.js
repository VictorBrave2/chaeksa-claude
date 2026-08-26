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
  const CACHE_KEY = 'chaeksa.typeSample.v4';   // v4: 강약에 득령 가산 0.6 반영
  const N_SAMPLE = 10000;
  function buildSample(onTick, done) {
    try {
      const hit = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (hit && hit.n >= N_SAMPLE && hit.th) return done(hit);
    } catch (e) {}
    const seen = {}; let i = 0, n = 0;
    (function chunk() {
      const end = Math.min(i + 250, N_SAMPLE);
      for (; i < end; i++) {
        const y = 1930 + (i * 7919) % 81, m = 1 + (i * 104729) % 12,
              d = 1 + (i * 1299709) % 28, hh = (i * 15485863) % 24;
        try {
          const R = E.calc({ year: y, month: m, day: d, hour: hh, minute: 30, gender: i % 2 ? 'M' : 'F',
                             place: 'KR:서울', longitude: 126.98, tzOffset: null, solarCorrection: true });
          seen[keyOf(R, gyeok(R))] = (seen[keyOf(R, gyeok(R))] || 0) + 1; n++;
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
        const out = { seen, n, th, types: Object.keys(seen).length };
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
    <text x="26" y="38" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="32" font-weight="900" fill="#fdf3e7">${SEAL[J.name] || '?'}</text></g>
  <text x="322" y="62" text-anchor="end" font-family="'Noto Serif KR',serif" font-size="15" fill="#4a4238" letter-spacing="4">${J.name}격 ${J.ok ? '成' : '破'}</text>
  <text x="322" y="84" text-anchor="end" font-size="12" fill="#7d7566" letter-spacing="3">${a.strength}</text>
  <text x="180" y="316" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="150" font-weight="900" fill="${ELCOL[de]}">${stemCh}</text>
  <text x="180" y="360" text-anchor="middle" font-size="15" fill="#5c5546" letter-spacing="2">${stemKo} 일간 · ${E.fmt.branchKo(p.month.branch)}월생</text>
  <rect x="46" y="410" width="268" height="52" rx="10" fill="#ffffff" opacity=".55"/>
  <text x="180" y="432" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="16" font-weight="700" fill="#33291c">${J.name}격 ${J.ok ? '성격' : '파격'} · ${a.strength} · ${stemCh}${E.fmt.branch(p.month.branch)}</text>
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
  <text x="180" y="86" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="44" font-weight="900" fill="#6d4f21" letter-spacing="18">敎 旨</text>
  <text x="180" y="130" text-anchor="middle" font-size="13" fill="#7a6a4a" letter-spacing="4">전생 직업 증명서</text>
  <text x="180" y="196" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="20" fill="#4a3a20">${esc(name)}의 전생은</text>
  <text x="180" y="248" text-anchor="middle" font-size="15" fill="#7a6a4a">${esc(pj.rank)}</text>
  <text x="180" y="300" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="30" font-weight="900" fill="#33291c">${esc(pj.job)}</text>
  <text x="180" y="340" text-anchor="middle" font-size="13" fill="#8a7a58" letter-spacing="2">${esc(pj.gyeok.name)}격 ${pj.gyeok.ok ? '성격' : '파격'}의 명(命)이라</text>
  <text x="180" y="404" text-anchor="middle" font-size="13.5" fill="#5c4c2e">${esc(l1)}</text>
  <text x="180" y="426" text-anchor="middle" font-size="13.5" fill="#5c4c2e">${esc(l2)}</text>
  <g transform="translate(256,440)"><rect width="62" height="62" rx="8" fill="#b23a2a" opacity=".92"/>
    <text x="31" y="28" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="20" font-weight="900" fill="#fdf3e7">前生</text>
    <text x="31" y="50" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="20" font-weight="900" fill="#fdf3e7">職所</text></g>
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
    <text x="26" y="38" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="30" font-weight="900" fill="#fff">運</text></g>
  <text x="322" y="70" text-anchor="end" font-size="13" fill="#7d7566" letter-spacing="3">두 번째 카드</text>
  <text x="180" y="170" text-anchor="middle" font-size="15" fill="#6b6254">${esc2(name)}의 지금 시즌은</text>
  <text x="180" y="270" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="86" font-weight="900" fill="${g.col}">${g.name}</text>
  <text x="180" y="330" text-anchor="middle" font-size="14" fill="#5c5546" letter-spacing="1">${duTxt}</text>
  <text x="180" y="400" text-anchor="middle" font-size="13.5" fill="#5c4c2e">${esc2(l1)}</text>
  <text x="180" y="422" text-anchor="middle" font-size="13.5" fill="#5c4c2e">${esc2(l2)}</text>
  <text x="180" y="480" text-anchor="middle" font-size="12" fill="#8a7a58">대운이 바뀌면 이 카드도 바뀝니다</text>
  <text x="180" y="536" text-anchor="middle" font-size="10.5" fill="#8a8171" letter-spacing="2">策 · chaeksa.kr · 원국과 대운으로 계산된 시즌</text>
</svg>`;
  }

  global.ChaeksaTypecard = { mine, buildSample, gyeok, share, pastjob, drawGyoji, seasonNow, drawSeason };
})(window);
