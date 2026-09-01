/* 책사 유형 카드 — 세 고전 축(격국×성패×강약×조후칸)으로 뽑는 나의 카드
 *
 * 686장을 그려두는 게 아니라, 시각 부품을 조합해 기기에서 즉석 생성한다.
 *   일간 10(중심 글자·오행색) × 월지 12(계절 문양) × 격 10(인장) ×
 *   성/파 2(테두리) × 강약 3(바탕 톤) — 부품 ~37개가 686+장을 만든다.
 * 이미지 파일 0장, 생성 비용 0원, 같은 사주는 언제나 같은 카드.
 *
 * 희귀도: 계산으로 지은 사주 10,000개를 기기에서 한 번 돌려 분포를 만들고 캐시한다.
 *         사람 표본이 아니다 — 29~31일생이 없고 전원 서울 30분생이라, 화면에서
 *         「전국 표본」이라 부르면 재 본 적 없는 것을 재었다고 말하는 것이 된다.
 * 표가 엔진 버전과 어긋날 일이 없고, 계산하는 몇 초가 그대로 뽑기 연출이 된다.
 * 등급은 가챠 문법: SSR(≤0.2%) SR(≤0.7%) R(≤2%) N(나머지).
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;
  const GRP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
  const G = (ds, s) => E.TEN_GODS[E.tenGod(ds, s)];

  // ── 격 판정 (자평진전 간이 규칙 — 상담 스킬과 같은 판) ──
  /** 격 **이름**만 정한다. 성패는 gyeokguk.js 가 원문 조항으로 낸다.
   *  예전에는 여기서 이름과 성패를 같이 냈는데, 성패 조건이 원문의 반쪽이었다. */
  function gyeokName(R) {
    const p = R.pillars, ds = p.day.stem, cheon = [], all = [];
    ['year','month','day','hour'].forEach(k => {
      if (!p[k]) return;
      if (k !== 'day') { cheon.push(G(ds, p[k].stem)); all.push(G(ds, p[k].stem)); }
      E.HIDDEN[p[k].branch].forEach(h => all.push(G(ds, h)));
    });
    // ── 삼합국이 서면 격을 국으로 잡는다 (자평진전) ──
    // 「진월 정화일간이 운에서 신금이나 자수가 오면 삼합을 이루고 성격이다」 —
    // 맑아진다는 것이고 곧 化 다. 그러면 월지 辰 은 상관(土)이 아니라 관성(水)이다.
    // 국을 이룬 지지는 국에 흡수되므로 그 지장간도 국의 천간 하나로 본다.
    // 그러지 않으면 辰중 戊(상관)가 남아 정관격이 파격으로 잡힌다.
    const W0 = E.NATAL_WEIGHT;
    const 자리0 = [[p.year.branch, W0.yearBranch], [p.month.branch, W0.monthBranch],
                   [p.day.branch, W0.dayBranch]];
    if (p.hour) 자리0.push([p.hour.branch, W0.hourBranch]);
    const 월국 = E.samhapOf(자리0).find(g => g.글자.indexOf(p.month.branch) >= 0) || null;
    let 국천간 = null;
    if (월국) {
      // 국의 오행 천간 중 원국 천간에 투출한 것으로 정/편을 가른다. 없으면 왕지의 본기.
      const 후보 = [0,1,2,3,4,5,6,7,8,9].filter(st => E.STEM_ELEM[st] === 월국.elem);
      국천간 = 후보.find(st => ['year','month','hour'].some(k => p[k] && p[k].stem === st));
      if (국천간 == null) 국천간 = E.HIDDEN[월국.왕지][0];
      // 국에 먹힌 지지들의 지장간을 국의 천간 하나로 갈아끼운다
      const 먹힌 = {}; 월국.글자.forEach(b => { 먹힌[b] = 1; });
      const all2 = [];
      ['year','month','day','hour'].forEach(k => {
        if (!p[k]) return;
        if (k !== 'day') all2.push(G(ds, p[k].stem));
        if (먹힌[p[k].branch]) all2.push(G(ds, 국천간));
        else E.HIDDEN[p[k].branch].forEach(h => all2.push(G(ds, h)));
      });
      all.length = 0; Array.prototype.push.apply(all, all2);
    }

    const hid = 월국 ? [국천간] : E.HIDDEN[p.month.branch];
    const mg = G(ds, hid[0]);
    const has = n => all.includes(n), hasG = g => all.some(x => GRP[x] === g);
    const cnt = g => all.filter(x => GRP[x] === g).length, tu = n => cheon.includes(n);
    if (GRP[mg] === '비겁') {
      // 양인격은 양간이 왕지(자오묘유) 겁재월에 났을 때만이다: 甲卯·丙午·庚酉·壬子.
      // 음간의 겁재월과 토 일간의 축미월은 양인이 아니라 건록(월겁)으로 본다.
      // 실측에서 양인격의 48%가 음간으로 잘못 잡히고 있었다.
      const yang = E.STEM_YANG[ds] === 1;
      const wang = [0, 3, 6, 9].includes(p.month.branch);
      return (mg === '겁재' && yang && wang) ? '양인' : '건록';
    }
    let gs = null;
    for (const h of hid) {                       // 투출한 지장간 우선, 비겁은 격이 아니다
      if (GRP[G(ds, h)] === '비겁') continue;
      if (['year','month','hour'].some(k => p[k] && p[k].stem === h)) { gs = h; break; }
    }
    if (gs == null) { for (const h of hid) { if (GRP[G(ds, h)] !== '비겁') { gs = h; break; } } }
    if (gs == null) gs = hid[0];
    const gek = G(ds, gs);
    return gek === '비견' ? '건록' : gek === '겁재' ? '양인' : gek;
  }

  /** 격 이름 + 자평진전 성패. 성패는 gyeokguk.js 한 곳에서만 낸다. */
  /** 카드에 새기는 판정 말 — 화면과 같은 말표(gyeokguk.js LABEL)를 쓴다.
   *  공유되는 물건이라 여기가 옛말로 남으면 화면과 어긋난다. */
  function 판정말(J) {
    const L = (global.ChaeksaGyeok && global.ChaeksaGyeok.LABEL) || {};
    return (L[J && J.판정] && L[J.판정].짧게) || (J && J.ok ? '온전' : '무너짐');
  }

  function gyeok(R) {
    const name = gyeokName(R);
    const Gk = global.ChaeksaGyeok;
    if (!Gk) return { name: name, ok: 0, 판정: '미상' };
    const J = Gk.judge(R, name);
    return { name: name, ok: J.ok, 판정: J.판정, 상신: J.상신, 근거: J.근거, 잰것: J.잰것 };
  }

  const keyOf = (R, J) => `${J.name}|${J.ok}|${R.analysis.strength}|${R.pillars.day.stem}|${R.pillars.month.branch}`;

  // ── 희귀도 표본 — 계산으로 지은 사주 10,000개(사람 표본이 아니다).
  //    d = 1 + (i*1299709) % 28 이라 29~31일생이 없고 전원 서울 30분생이다.
  //    그러므로 화면에서 「전국 표본」이라 부르면 안 된다(2026-08-30). 결정적 생성.
  // ── 원래 주석: 절기표가 캐시되어 데스크톱 0.2초, 폰도 몇 초다 ──
  // 등급선은 표본에서 '사람 백분위'로 긋는다. 유형 크기(pct) 기준으로 그었더니
  // 꼬리가 길어 40%가 SSR을 받는 사고가 있었다 — 등급은 사람 기준이어야 한다.
  const CACHE_KEY = 'chaeksa.typeSample.v9';   // v9: SSR 문턱 되살림 (v8: 천직 유형 분포 동승)
  const N_SAMPLE = 10000;
  /** 이미 만들어 둔 표본이 있으면 돌려준다. 없으면 null.
   *  홈에서 새로 만들지 않는다 — 만 명을 돌리는 것이라 느리다. */
  function cachedSample() {
    try { const hit = JSON.parse(localStorage.getItem(CACHE_KEY)); return (hit && hit.n) ? hit : null; }
    catch (e) { return null; }
  }

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
        // 3% 안에 드는 층이 하나도 없으면 th[0] 이 0 으로 남아 SSR 이 영영 안 나온다
        // (2026-08-30 실측: SSR 유형 0개). SSR 은 「제일 드문 층」이라는 뜻이므로
        // 그럴 때는 가장 작은 층을 SSR 로 삼는다.
        if (!th[0] && cs.length) th[0] = cs[0];
        const out = { seen, n, th, types: Object.keys(seen).length, wh, lt, jt };
        try { ['v4','v5','v6','v7','v8'].forEach(k => localStorage.removeItem('chaeksa.typeSample.' + k)); } catch (e) {}
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
  <text x="180" y="432" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="16" font-weight="700" fill="#33291c">${J.name}격 ${판정말(J)} · ${a.strength} · ${stemCh}${E.fmt.branch(p.month.branch)}</text>
  <text x="180" y="452" text-anchor="middle" font-size="12" fill="#6b6254">${rar ? `지어낸 사주 ${rar.n.toLocaleString()}개 중 ${rar.count}개` : ''}</text>
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
  <text x="180" y="340" text-anchor="middle" font-size="13" fill="#8a7a58" letter-spacing="2">${esc(pj.gyeok.name)}격 ${esc(판정말(pj.gyeok))}의 명(命)이라</text>
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

  /** 0~100 눈금(대운·달 점수)을 등급으로. SEASON_GRADE 의 min 은 0~2 눈금이라
   *  그대로 나눠 쓰면 최고 등급이 영영 안 걸린다(2026-08-30 실측: 상한 93).
   *  400개 사주 실측 분포로 잡은 문턱이다 — 85+ 약 3% · 65+ 약 12% · 40+ 약 33%. */
  const GRADE100 = [85, 65, 40, 20];
  function 등급100(v) {
    for (let i = 0; i < GRADE100.length; i++) if (v >= GRADE100[i]) return SEASON_GRADE[i];
    return SEASON_GRADE[4];
  }

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
    // 충 판정을 뺀다 — 제23조. 금지령에 충 문구가 없으므로 붙일 것도 없다.
    if (myBr === todayBr) 관계 = '복음';
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
      // 두 줄까지만 담기는 칸이다. 넘치면 말줄임을 붙인다 —
      // 없으면 문장 한가운데서 잘린 카드가 그대로 나가고 아무도 모른다.
      const 전부 = foldTxt(t, 238, 13);
      const ls = 전부.slice(0, 2);
      if (전부.length > 2 && ls.length === 2 && ls[1] && typeof ls[1][0] === 'string') {
        ls[1] = [ls[1][0].replace(/.$/, '') + '…'].concat(ls[1].slice(1));
      }
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

  // ── 인연이 오는 해 ──
  // 2026-08-28 새로 만들었다. 여성향 검색어 1위권인데 지금까지 없었다.
  //
  // 통설을 그대로 쓴다 — **여성은 관성, 남성은 재성**이 배우자성이다.
  // 그 글자가 하늘(세운 천간)에 오는 해, 배우자 자리(일지)와 지지가 합하는 해를 센다.
  // 대운은 십 년을 통째로 물들이므로 따로 얹는다.
  //
  // 단정하지 않는다. 「이 해에 결혼합니다」가 아니라 「사람이 들어오기 쉬운 해」다.
  // 이미 곁에 있는 사람과 깊어지는 해일 수도 있다 — 그렇게 말한다.
  function inyeon(R, fromYear, n) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds], db = p.day.branch;
    const W = E.NATAL_WEIGHT;
    const 남 = ((R.input && R.input.gender) || 'M') === 'M';
    const 배우자오행 = 남 ? (de + 2) % 5 : (de + 3) % 5;   // 남=재성 · 여=관성
    const 배우자이름 = 남 ? '재성' : '관성';

    const 자리 = [[p.year.branch, W.yearBranch], [p.month.branch, W.monthBranch],
                  [p.day.branch, W.dayBranch]];
    if (p.hour) 자리.push([p.hour.branch, W.hourBranch]);

    const YUKHAP = { 0:1, 1:0, 2:11, 11:2, 3:10, 10:3, 4:9, 9:4, 5:8, 8:5, 6:7, 7:6 };
    const SAM = [[8,0,4], [11,3,7], [2,6,10], [5,9,1]];
    const 충 = (a, b) => ((b - a + 12) % 12) === 6;

    const rows = [];
    for (let i = 0; i < (n || 10); i++) {
      const y = fromYear + i;
      const tf = E.dateFortune(y, 6, 15);
      const du = E.currentDaeun(R, new Date(y, 5, 15));
      let s = 0; const 이유 = [];

      // 하늘에 배우자성이 오는가 — 뜬 것과 뿌리 내린 것은 다르다
      if (E.STEM_ELEM[tf.year.stem] === 배우자오행) {
        const 힘 = E.stemPower(tf.year.stem, 자리.concat([[tf.year.branch, 1.0]]));
        s += 28 + Math.min(22, Math.round(힘 * 12));
        이유.push(힘 > 0.8 ? '인연의 글자가 뿌리까지 내리고 옵니다'
                           : '인연의 글자가 하늘에 뜹니다');
      }
      // 배우자 자리가 어떻게 되는가
      const yb = tf.year.branch;
      if (YUKHAP[db] === yb) { s += 26; 이유.push('배우자 자리와 육합 — 곁이 채워지는 해입니다'); }
      else if (SAM.some(g => g.indexOf(db) >= 0 && g.indexOf(yb) >= 0 && db !== yb)) {
        s += 20; 이유.push('배우자 자리와 삼합 — 같이 굴러가는 해입니다');
      }
      // 충 배제(제23조, 2026-08-29): 「흉한 글자가 충당하면 흉함이 적고 길한 글자가
      // 충당하면 흉함이 생긴다 — 경우의 수가 많아 그냥 배제한다. 충일 수도 아닐 수도 있다」
      // 대운은 십 년을 물들인다
      if (du && E.STEM_ELEM[du.stem] === 배우자오행) { s += 16; 이유.push('지금 대운 자체가 인연 쪽으로 기울어 있습니다'); }
      if (du && (YUKHAP[db] === du.branch)) { s += 10; 이유.push('대운의 자리도 배우자 자리와 합입니다'); }

      rows.push({ 해: y, 간지: E.fmt.pillar(tf.year), 점수: s, 이유: 이유, gz: tf.year });
    }

    // 0~100으로 편다 — 이 기간 안에서의 서열이지 절대값이 아니다
    const raw = rows.map(r => r.점수), hi = Math.max.apply(null, raw), lo = Math.min.apply(null, raw);
    rows.forEach(r => { r.점수 = hi === lo ? 50 : Math.round((r.점수 - lo) / (hi - lo) * 100); });

    const 좋은해 = rows.slice().sort((a, b) => b.점수 - a.점수).filter(r => r.이유.length).slice(0, 3);
    const 첫해 = 좋은해.length ? 좋은해.slice().sort((a, b) => a.해 - b.해)[0] : null;

    let 말;
    if (!첫해) 말 = '앞으로 십 년 안에는 크게 움직이는 자리가 안 보입니다. 조용히 가는 구간입니다';
    else if (첫해.해 === fromYear) 말 = '올해가 그 자리입니다';
    else 말 = 첫해.해 + '년이 가장 가깝습니다';

    return { 배우자이름, 남, rows, 좋은해, 첫해, 말 };
  }

  /** 인연이 오는 해 카드. 막대 열 개와 가장 가까운 해 한 줄. */
  function drawInyeon(name, v) {
    const es = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const wrap = (t, n) => {
      const out = []; let cur = '';
      String(t).split(' ').forEach(w => {
        if ((cur + ' ' + w).trim().length <= (n || 24)) cur = (cur + ' ' + w).trim();
        else { out.push(cur); cur = w; }
      });
      if (cur) out.push(cur);
      return out.slice(0, 3);
    };
    const rows = v.rows.slice(0, 10);
    const w = 26, gap = 4, x0 = 46, base = 372, maxH = 118;
    let bars = '';
    rows.forEach((r, i) => {
      const h = Math.max(4, Math.round(r.점수 / 100 * maxH));
      const x = x0 + i * (w + gap);
      const on = v.좋은해.some(g => g.해 === r.해);
      bars += '<rect x="' + x + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '" rx="4" fill="'
        + (on ? '#c2708c' : '#e2cfc4') + '"/>';
      bars += '<text x="' + (x + w / 2) + '" y="' + (base + 15) + '" text-anchor="middle" font-size="9.5" fill="'
        + (on ? '#8a4a60' : '#a89486') + '">' + String(r.해).slice(2) + '</text>';
    });
    const 첫 = v.첫해;
    const 이유줄 = 첫 ? wrap(첫.이유[0] || '', 26) : [];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">'
      + '<defs><linearGradient id="iy" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#fdf6f2"/><stop offset="1" stop-color="#f3e2dc"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="16" fill="url(#iy)"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="11" fill="none" stroke="#dcc4bb" stroke-width="1"/>'
      + '<text x="180" y="52" text-anchor="middle" font-size="11.5" fill="#a5877a" letter-spacing="4">인연이 오는 해</text>'
      + '<text x="180" y="86" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="19" font-weight="700" fill="#4a3226">'
      + es(name) + '님</text>'
      + (첫
        ? '<text x="180" y="126" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="34" font-weight="900" fill="#b0567a">'
          + 첫.해 + '</text>'
          + '<text x="180" y="150" text-anchor="middle" font-size="12.5" fill="#8a6a5c">' + es(첫.간지) + ' · 가장 가까운 해</text>'
        : '<text x="180" y="136" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="17" fill="#8a6a5c">조용히 가는 십 년입니다</text>')
      + 이유줄.map((l, i) => '<text x="180" y="' + (182 + i * 19) + '" text-anchor="middle" font-size="12.5" fill="#6a5448">' + es(l) + '</text>').join('')
      + '<text x="46" y="248" font-size="11" fill="#a5877a">앞으로 열 해 — 막대가 높을수록 인연 쪽으로 기웁니다</text>'
      + bars
      + '<line x1="46" y1="' + (base + 26) + '" x2="314" y2="' + (base + 26) + '" stroke="#e6d2c8"/>'
      + (v.좋은해.length
        ? v.좋은해.slice().sort((a, b) => a.해 - b.해).map((g, i) =>
            '<text x="46" y="' + (426 + i * 22) + '" font-size="12.5" fill="#7a5a48">'
            + g.해 + '년 ' + es(g.간지) + '</text>'
            + '<text x="112" y="' + (426 + i * 22) + '" font-size="11.5" fill="#9a7f70">'
            + es(wrap(g.이유[0] || '', 30)[0] || '') + '</text>').join('')
        : '')
      + '<text x="180" y="512" text-anchor="middle" font-size="11" fill="#a5877a">이 순위는 이 십 년 안에서의 서열입니다</text>'
      + '<text x="180" y="530" text-anchor="middle" font-size="11" fill="#a5877a">이미 곁에 있는 사람과 깊어지는 해일 수도 있습니다</text>'
      + '<text x="180" y="548" text-anchor="middle" font-size="10" fill="#c4ada0" letter-spacing="2">chaeksa.kr</text>'
      + '</svg>';
  }

  // ── 우리 둘 사이 ──
  // 2026-08-28 「공범 판결」을 걷어내고 다시 썼다.
  // 죄목·참작·선고로 짜여 있었는데(만나면 사건이 터짐죄 · 합동 소란죄 · 온기 독점죄)
  // 심판의 은유라 여성향과 정면으로 어긋난다. 우리는 사주명리 학원이 아니다.
  //
  // 핵심은 **서로에게 무엇인가**다. 상대의 일간에서 나를 보면 십신이 뒤집힌다 —
  // 「그 사람에게 공주님은 정재」와 「공주님에게 그 사람은 편관」은 다른 이야기다.
  // 이 뒤집기가 이 화면이 파는 것이고, 계산은 이미 있는 것으로 공짜다.
  // ── 그 사람은 지금 ──
  // 「우리 둘 사이」가 관계의 뼈대라면, 이것은 **지금 그 사람이 어디에 서 있는가**다.
  // 같은 사람이라도 지나는 운에 따라 다르게 군다 — 그걸 말해주는 자리다.
  //
  // 상대의 대운·세운 십신으로 그가 지금 무엇에 마음을 두고 있는지 읽는다.
  // 점치는 게 아니라 「지금 이 사람의 관심이 어느 쪽에 가 있다」를 말한다.
  const NOW_WORD = {
    비겁: ['제 사람들 쪽에 가 있습니다', '친구·동료와 어울리는 데 마음이 쏠려 있습니다. 둘만의 시간을 내기 어려울 수 있습니다'],
    식상: ['하고 싶은 걸 하고 싶은 때입니다', '표현하고 만들어 내보이는 데 힘이 갑니다. 말이 많아지고 새 일을 벌이기 쉽습니다'],
    재성: ['현실을 챙기는 때입니다', '돈·일·눈앞의 것에 마음이 가 있습니다. 바쁘고, 연락이 뜸해질 수 있습니다'],
    관성: ['자리를 잡고 싶은 때입니다', '책임과 안정 쪽으로 기울어 있습니다. 관계를 정리하거나 매듭짓고 싶어 합니다'],
    인성: ['안으로 들어가는 때입니다', '생각이 많고 배우거나 쉬고 싶어 합니다. 곁을 내주기까지 시간이 걸립니다'],
  };
  const GRP5 = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상',
                 편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };

  /** 상대가 지금 지나는 운을 읽는다. Ryou = 상대 사주, when = 기준 시각 */
  function nowOf(Ryou, when) {
    const ds = Ryou.pillars.day.stem;
    const 신 = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const du = E.currentDaeun(Ryou, when || new Date());
    const tf = E.dateFortune((when || new Date()).getFullYear(),
                             (when || new Date()).getMonth() + 1,
                             (when || new Date()).getDate());
    const 대 = du ? GRP5[신(du.stem)] : null;
    const 세 = GRP5[신(tf.year.stem)];
    return {
      대운: du ? { 간지: E.fmt.pillar(du), 십신: 신(du.stem), 결: 대,
                   나이: du.startAge + '~' + du.endAge + '세', 말: NOW_WORD[대] } : null,
      세운: { 간지: E.fmt.pillar(tf.year), 십신: 신(tf.year.stem), 결: 세, 말: NOW_WORD[세] },
    };
  }

  // ── 두 분 다 좋은 달 ──
  // 우리는 택일 엔진을 갖고 있는데 궁합 화면에서 안 쓰고 있었다.
  // 결혼·상견례·여행 날짜를 잡는 자리는 「둘 다 좋은 달」이지 한쪽만 좋은 달이 아니다.
  //
  // **최저 점수로 고른다.** 한 사람만 높고 다른 사람이 낮으면 좋은 달이 아니다 —
  // 세 고전을 나란히 볼 때 최저 기준으로 정렬하는 것과 같은 원칙이다.
  function monthScoreFor(R, tf) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds], db = p.day.branch;
    const a = R.analysis || E.strengthOf(p);
    const YUKHAP = { 0:1, 1:0, 2:11, 11:2, 3:10, 10:3, 4:9, 9:4, 5:8, 8:5, 6:7, 7:6 };
    const SAM = [[8,0,4], [11,3,7], [2,6,10], [5,9,1]];
    let s = 50; const 이유 = [];

    // 이 사람이 필요로 하는 오행이 하늘에 오는가
    const 용 = (R.analysis && R.analysis.yongCandidates) || [];
    const el = E.ELEM[E.STEM_ELEM[tf.month.stem]];
    if (용.indexOf(el) >= 0) { s += 28; 이유.push('필요한 ' + el + ' 기운이 옵니다'); }

    // 배우자 자리(일지)가 어떻게 되는가 — 두 사람 사이를 보는 자리이므로 일지를 본다
    const mb = tf.month.branch;
    if (YUKHAP[db] === mb) { s += 22; 이유.push('배우자 자리와 합입니다'); }
    else if (SAM.some(g => g.indexOf(db) >= 0 && g.indexOf(mb) >= 0 && db !== mb)) {
      s += 16; 이유.push('배우자 자리와 삼합입니다');
    }   // 충 배제 — 제23조

    // 강약에 맞는 쪽인가 — 신약이면 인성·비겁, 신강이면 식상·재성·관성
    const g = E.TEN_GODS[E.tenGod(ds, tf.month.stem)];
    const grp = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성',
                  정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' }[g];
    const 약 = a.strength === '신약';
    if (약 && (grp === '인성' || grp === '비겁')) { s += 12; 이유.push('받쳐주는 기운입니다'); }
    if (!약 && (grp === '식상' || grp === '재성')) { s += 12; 이유.push('밖으로 풀리는 기운입니다'); }
    if (약 && grp === '관성') { s -= 14; 이유.push('눌리는 달입니다'); }
    return { s: Math.max(0, Math.min(100, s)), 이유 };
  }

  /** 그 달 안에서 두 사람 다 좋은 **날**이 며칠인가.
   *  날짜는 안 돌려준다 — 개수만 낸다. 날짜와 시각은 사람이 붙어서 보는 자리다.
   *  「2월에 두 분 다 좋은 날이 4일 있습니다」까지가 무료고, 그 다음이 상담이다. */
  function bothDays(Rme, Ryou, year, month) {
    let 좋 = 0, 전체 = 0, 최고 = 0;
    const last = new Date(year, month, 0).getDate();
    for (let d = 1; d <= last; d++) {
      let tf; try { tf = E.dateFortune(year, month, d); } catch (e) { continue; }
      전체++;
      // 달을 재던 것과 같은 자로 날을 잰다 — 월주 자리에 일주를 넣는다
      const day = { month: tf.day };
      const A = monthScoreFor(Rme, day), B = monthScoreFor(Ryou, day);
      const m = Math.min(A.s, B.s);
      if (m > 최고) 최고 = m;
      if (m >= 70) 좋++;
    }
    return { 좋은날: 좋, 전체, 최고 };
  }

  /** 앞으로 n개월 중 두 사람 다 좋은 달. 최저 점수로 고른다. */
  function bothMonths(Rme, Ryou, from, n) {
    const rows = [];
    const base = from || new Date();
    for (let i = 0; i < (n || 12); i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 15);
      const tf = E.dateFortune(d.getFullYear(), d.getMonth() + 1, 15);
      const A = monthScoreFor(Rme, tf), B = monthScoreFor(Ryou, tf);
      rows.push({
        연: d.getFullYear(), 월: d.getMonth() + 1, 간지: E.fmt.pillar(tf.month),
        a: A.s, b: B.s, 점수: Math.min(A.s, B.s),
        이유: [].concat(A.이유.slice(0, 1), B.이유.slice(0, 1)),
      });
    }
    const 좋은달 = rows.slice().sort((x, y) => y.점수 - x.점수).slice(0, 3)
      .sort((x, y) => (x.연 - y.연) || (x.월 - y.월));
    const 나쁜달 = rows.slice().sort((x, y) => x.점수 - y.점수)[0];
    return { rows, 좋은달, 나쁜달 };
  }

  // ── 유료 해상도 — 결제한 사람에게만 그려지는 계산 ──
  // 무료가 멈춘 자리에서 같은 자로 한 단계 내려간다. 새 잣대를 만들지 않는다 —
  // 해를 재던 inyeon 의 잣대로 달을 재고, 달을 재던 monthScoreFor 의 잣대로
  // 날과 시진을 잰다. 잣대가 두 벌이면 무료와 유료가 서로 다른 말을 한다.
  //
  // 그리고 **숫자만 주지 않는다.** 2만원을 낸 사람에게 막대 열두 개는 모욕이다.
  // 달마다 무슨 일이 일어나고 무엇을 하면 되는지까지 말해야 보고서다.

  // 그 달의 하늘이 나에게 무엇으로 오는가 — 만남의 자리에서 읽는 열 가지 결
  const INYEON_GOD = {
    비견: '또래가 모이는 달입니다. 모임에 얼굴을 내밀면 자연스럽게 이어집니다',
    겁재: '사람은 많은데 경쟁도 붙는 달입니다. 여럿이 겨루는 자리보다 소개받는 자리가 낫습니다',
    식신: '표현이 부드러워지는 달입니다. 편하게 웃게 되는 자리에서 인연이 붙습니다',
    상관: '말이 튀는 달입니다. 매력은 사는데 말로 어긋나기도 쉽습니다 — 들어주는 쪽으로',
    편재: '움직임이 많은 달입니다. 나가야 만납니다 — 여행이든 외출이든 밖이 기회입니다',
    정재: '차분히 실속을 보는 달입니다. 오래 볼 사람인지 가리기에 좋습니다',
    편관: '긴장이 붙는 달입니다. 마음이 급해지기 쉬우니 큰 결정은 천천히 하세요',
    정관: '격식 있는 자리가 열리는 달입니다. 소개·상견례 같은 공식 자리에 좋습니다',
    편인: '생각이 안으로 도는 달입니다. 억지로 나가기보다 나를 정비하는 편이 낫습니다',
    정인: '보살핌을 받는 달입니다. 어른의 소개, 오래 아는 사람의 다리가 힘을 씁니다',
  };
  const YUKHAP12 = { 0:1, 1:0, 2:11, 11:2, 3:10, 10:3, 4:9, 9:4, 5:8, 8:5, 6:7, 7:6 };
  const SAM12 = [[8,0,4], [11,3,7], [2,6,10], [5,9,1]];
  const 충12 = (a, b) => ((b - a + 12) % 12) === 6;

  /** 인연 시기 — 그 해 열두 달 + 열리는 달의 날짜. inyeon 과 같은 잣대를 내린다. */
  function inyeonMonths(R, year) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds], db = p.day.branch;
    const 남 = ((R.input && R.input.gender) || 'M') === 'M';
    const 배우자오행 = 남 ? (de + 2) % 5 : (de + 3) % 5;
    const 배우자이름 = 남 ? '재성' : '관성';

    // 머리말 재료 — 그 해가 어떤 맥락 위에 있는가
    const yf = E.dateFortune(year, 6, 15);
    const du = E.currentDaeun(R, new Date(year, 5, 15));
    const 머리 = {
      해: year, 세운간지: E.fmt.pillar(yf.year), 세운십신: E.TEN_GODS[E.tenGod(ds, yf.year.stem)],
      대운간지: du ? E.fmt.pillar(du) : null, 대운십신: du ? E.TEN_GODS[E.tenGod(ds, du.stem)] : null,
      배우자이름,
    };

    const rows = [];
    for (let m = 1; m <= 12; m++) {
      let tf; try { tf = E.dateFortune(year, m, 15); } catch (e) { continue; }
      let sc = 30; const 이유 = [];
      const 십신 = E.TEN_GODS[E.tenGod(ds, tf.month.stem)];
      if (E.STEM_ELEM[tf.month.stem] === 배우자오행) {
        sc += 28; 이유.push(배우자이름 + '이 달의 하늘에 옵니다 — 인연의 글자입니다');
      }
      const mb = tf.month.branch;
      if (YUKHAP12[db] === mb) { sc += 26; 이유.push('배우자 자리와 합 — 곁이 채워지는 달입니다'); }
      else if (SAM12.some(g => g.indexOf(db) >= 0 && g.indexOf(mb) >= 0 && db !== mb)) {
        sc += 20; 이유.push('배우자 자리와 삼합 — 같이 움직이게 되는 달입니다');
      }   // 충 배제 — 제23조
      rows.push({ 월: m, 간지: E.fmt.pillar(tf.month), 점수: Math.max(0, Math.min(100, sc)),
                  십신, 결: INYEON_GOD[십신] || '', 이유 });
    }
    const 열림 = rows.filter(r => r.점수 >= 56).map(r => r.월);
    const 조용 = rows.slice().sort((a, b) => a.점수 - b.점수)[0];

    // 열리는 달은 날짜까지 내려간다 — 같은 잣대를 날에 또 한 번
    const 날들 = {};
    열림.slice(0, 3).forEach(m => { 날들[m] = inyeonDays(R, year, m).좋은; });
    return { 머리, rows, 열림, 조용, 날들 };
  }

  // ── 달 삽화 — 웹툰의 컷처럼, 달마다 그 달의 상태를 그린다 ──
  // AI 이미지가 아니라 파라메트릭 SVG 다: 결정적(같은 달 같은 그림)·0원·한지 그림체.
  // 계절이 배경을 정하고 상태가 소재를 정한다.
  //   연애  open 꽃가지와 나비 · shake 바람과 흩날리는 잎 · quiet 달과 물결
  //   재물  open 항아리와 엽전 · leak 기울어 새는 항아리 · quiet 밭고랑과 새싹
  function 달그림(kind, 월, 상태) {
    const 계절 = (월 >= 3 && 월 <= 5) ? 0 : (월 >= 6 && 월 <= 8) ? 1 : (월 >= 9 && 월 <= 11) ? 2 : 3;
    // 변주 — 같은 화면에 「조용한 봄」이 석 달 걸리면 같은 그림이 세 번 나온다. 그게 빈약함의
    // 실체라, 조합당 몇 벌(CHAEKSA_ART_VAR)을 두고 월로 골라 한 화면 안 중복을 없앤다.
    // 난수가 아니라 월 결정이라 같은 달은 늘 같은 컷이다. 1벌이면 종전과 동일.
    const 벌 = (global.CHAEKSA_ART_VAR && global.CHAEKSA_ART_VAR[kind]) || 1;
    const 변주 = 벌 > 1 ? (월 % 벌) + 1 : 1;
    const 꼬리 = 변주 > 1 ? '-' + 변주 : '';
    // 일러스트가 준비되면 이미지를 쓴다 — app/art/ 에 24장(연애 3상태×4계절 + 재물 3상태×4계절).
    // 경우의 수가 유한하니 실시간 생성이 아니라 사전 생성이 맞다: 원가 0·지연 0·그림체 일관.
    // 파일이 들어오고 config.js 의 CHAEKSA_ART 가 켜져야 이미지로 바뀐다. 그전엔 SVG.
    // 'love' | 'wealth' | 'all' | 0 — 들어온 종류만 켠다 (연애 12장 먼저 도착, 2026-08-29)
    if (global.CHAEKSA_ART && (global.CHAEKSA_ART === 'all' || global.CHAEKSA_ART === kind)) {
      const SEASON = ['spring', 'summer', 'autumn', 'winter'][계절];
      // lazy 금지 — 원장 공개로 늦게 붙는 카드에서 깨어나지 않는다(시연에서 실측). 장당 ~80KB라 eager로 충분.
      // 그림이 3:1 규격이므로 그 비율 그대로 편다 — 높이 고정(74px)은 얼굴을 잘랐다(2026-08-29).
      // 비율이 다른 장(2:1 등)만 cover로 맞추되, 얼굴이 있는 위쪽을 남긴다(object-position 상단 치우침).
      return '<img src="art/' + kind + '-' + 상태 + '-' + SEASON + 꼬리 + '.webp?v=' + global.CHAEKSA_ART
        + '" alt="" style="width:100%;aspect-ratio:3/1;object-fit:cover;object-position:50% 30%;display:block;border-radius:9px">';
    }
    const P = [
      { s1: '#f7e8ec', s2: '#fdf6ee', hill: '#d9b8c4', ac: '#c96f85', ink: '#8a6470' },   // 봄
      { s1: '#e3eef0', s2: '#f3f8f2', hill: '#9dbfae', ac: '#4e8d7c', ink: '#5c7a6e' },   // 여름
      { s1: '#f4e4d3', s2: '#faf1e4', hill: '#c99a6a', ac: '#b3562e', ink: '#8a6a4e' },   // 가을
      { s1: '#e4e8f0', s2: '#f2f4f8', hill: '#a8b4c8', ac: '#6a7a96', ink: '#68748a' },   // 겨울
    ][계절];
    const id = 'sc' + kind.charAt(0) + 월 + 상태.charAt(0);
    let art = '';
    if (kind === 'love') {
      if (상태 === 'open') {
        art = '<path d="M20 78 Q80 60 150 64 Q200 66 250 52" fill="none" stroke="' + P.ink + '" stroke-width="2.4" opacity=".7"/>'
          + [ [60,64],[95,60],[130,62],[168,63],[205,58],[238,54] ].map((c,i) =>
              '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + (i % 2 ? 5 : 6.4) + '" fill="' + P.ac + '" opacity=".85"/>'
            + '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="1.8" fill="#fff" opacity=".9"/>').join('')
          + '<g opacity=".8"><circle cx="288" cy="34" r="4" fill="' + P.ac + '"/><circle cx="295" cy="30" r="4" fill="' + P.ac + '" opacity=".7"/></g>'
          + '<g opacity=".6"><circle cx="315" cy="52" r="3.2" fill="' + P.ac + '"/><circle cx="321" cy="49" r="3.2" fill="' + P.ac + '" opacity=".7"/></g>'
          + '<circle cx="322" cy="20" r="10" fill="#f3d9a0" opacity=".8"/>';
      } else if (상태 === 'shake') {
        art = [ [30,30],[10,52],[50,70] ].map(o =>
            '<path d="M' + o[0] + ' ' + o[1] + ' q 60 -8 120 4" fill="none" stroke="' + P.ink + '" stroke-width="1.6" opacity=".45"/>').join('')
          + [ [190,34],[228,50],[262,28],[300,58],[250,70] ].map(o =>
            '<ellipse cx="' + o[0] + '" cy="' + o[1] + '" rx="4.6" ry="2.6" fill="' + P.ac + '" opacity=".7" transform="rotate(' + ((o[0] * 7) % 70 - 35) + ' ' + o[0] + ' ' + o[1] + ')"/>').join('');
      } else {
        art = '<circle cx="300" cy="26" r="13" fill="#f0e6c8" opacity=".95"/><circle cx="306" cy="22" r="11" fill="' + P.s1 + '"/>'
          + [ 66, 74, 82 ].map((y,i) =>
            '<path d="M' + (30 + i * 12) + ' ' + y + ' q 40 -6 80 0 t 80 0 t 80 0" fill="none" stroke="' + P.ink + '" stroke-width="1.4" opacity="' + (0.5 - i * 0.12) + '"/>').join('');
      }
    } else {
      if (상태 === 'open') {
        art = '<path d="M150 42 q -26 4 -26 24 q 0 18 26 18 q 26 0 26 -18 q 0 -20 -26 -24" fill="#a8795a" opacity=".9"/>'
          + '<ellipse cx="150" cy="42" rx="15" ry="5" fill="#8a5f45"/>'
          + [ [208,72],[224,72],[216,60] ].map(c =>
              '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="9" fill="#d9b56a" stroke="#b3925a" stroke-width="1.4"/>'
            + '<rect x="' + (c[0] - 3) + '" y="' + (c[1] - 3) + '" width="6" height="6" fill="' + P.s2 + '"/>').join('')
          + '<path d="M266 78 q 6 -30 2 -46 m 2 46 q 10 -26 18 -34" fill="none" stroke="#b99b4e" stroke-width="2.2" opacity=".85"/>'
          + [ [268,36],[274,42],[282,44],[286,50] ].map(c => '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="3.4" ry="1.8" fill="#d9b56a"/>').join('');
      } else if (상태 === 'leak') {
        art = '<g transform="rotate(14 150 60)"><path d="M150 38 q -26 4 -26 24 q 0 18 26 18 q 26 0 26 -18 q 0 -20 -26 -24" fill="#a8795a" opacity=".9"/>'
          + '<ellipse cx="150" cy="38" rx="15" ry="5" fill="#8a5f45"/>'
          + '<path d="M138 62 l 10 12" stroke="#6e4a34" stroke-width="1.6" opacity=".8"/></g>'
          + [ [178,76],[190,84],[200,78] ].map(c => '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="2.6" ry="3.6" fill="#7ea4c4" opacity=".8"/>').join('')
          + [ [232,80],[252,74],[272,82] ].map(c =>
              '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="7.4" fill="#d9b56a" stroke="#b3925a" stroke-width="1.2" opacity=".7"/>'
            + '<rect x="' + (c[0] - 2.5) + '" y="' + (c[1] - 2.5) + '" width="5" height="5" fill="' + P.s2 + '"/>').join('');
      } else {
        art = [ 64, 74, 84 ].map((y,i) =>
            '<path d="M20 ' + y + ' q 80 ' + (6 - i * 2) + ' 160 0 t 160 0" fill="none" stroke="' + P.ink + '" stroke-width="1.6" opacity="' + (0.42 - i * 0.1) + '"/>').join('')
          + [ [120,58],[230,54] ].map(c =>
              '<path d="M' + c[0] + ' ' + (c[1] + 14) + ' l 0 -12" stroke="#5c8a5c" stroke-width="2"/>'
            + '<ellipse cx="' + (c[0] - 4) + '" cy="' + c[1] + '" rx="4.6" ry="2.6" fill="#79a879" transform="rotate(-28 ' + (c[0] - 4) + ' ' + c[1] + ')"/>'
            + '<ellipse cx="' + (c[0] + 4) + '" cy="' + c[1] + '" rx="4.6" ry="2.6" fill="#79a879" transform="rotate(28 ' + (c[0] + 4) + ' ' + c[1] + ')"/>').join('');
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" preserveAspectRatio="xMidYMid slice" style="width:100%;height:74px;display:block;border-radius:9px">'
      + '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="' + P.s1 + '"/><stop offset="1" stop-color="' + P.s2 + '"/></linearGradient></defs>'
      + '<rect width="360" height="96" fill="url(#' + id + ')"/>'
      + '<path d="M0 84 Q 90 66 180 78 T 360 74 L 360 96 L 0 96 Z" fill="' + P.hill + '" opacity=".38"/>'
      + art
      + '<text x="348" y="90" text-anchor="end" font-size="9" fill="' + P.ink + '" opacity=".55">' + 월 + '月</text>'
      + '</svg>';
  }

  const HOUR12_KO = ['子 23~01시', '丑 01~03시', '寅 03~05시', '卯 05~07시', '辰 07~09시', '巳 09~11시',
                     '午 11~13시', '未 13~15시', '申 15~17시', '酉 17~19시', '戌 19~21시', '亥 21~23시'];
  /** 그날의 12시진을 시두법으로 세우고, 채점 함수로 상위 둘을 고른다.
   *  시계 변환은 안 한다(지역 보정 23~34분) — 시진까지만 말하고 분 단위는 상담 몫. */
  function 좋은시진(dayStem, score, tf) {
    const best = [];
    for (let hb = 0; hb < 12; hb++) {
      const hs = ((dayStem % 5) * 2 + hb) % 10;
      best.push([hb, score(hs, hb)]);
    }
    best.sort((a, b) => b[1] - a[1]);
    // 새벽 시진(子丑寅)도 거르지 않는다. 한 번 활동 시간대로 걸렀다가 사용자에게
    // 배웠다(2026-08-30): 「새벽에 눈맞을 수도 있지, 밤늦게 술마시다 다음날
    // 넘어갈 수도 있는 거고」. 택일자료의 원칙 그대로다 — 주간·야간을 함부로
    // 자르지 말 것. 그게 가능한 사람에게 최선을 감추는 건 자료가 아니다.
    return best.slice(0, 2).filter(x => x[1] > 0)
      .map(x => HOUR12_KO[x[0]]);
  }

  /** 인연 — 한 달 안의 날들. 좋은 날을 낸다.
   *  크게 열린 날이 없는 달에도 그 안의 서열은 있다 — 상대 상위를 준다(상대:true).
   *  조심 은 늘 빈 배열이다: 제23조로 충 감점을 걷은 뒤 sc 가 음수가 될 길이 없다.
   *  없는 근거로 경고를 지어내지 않는 것이 맞으므로 그대로 둔다 — 채우려 하지 말 것. */
  function inyeonDays(R, year, m) {
    const p = R.pillars, de = E.STEM_ELEM[p.day.stem], db = p.day.branch;
    const 남 = ((R.input && R.input.gender) || 'M') === 'M';
    const 배우자오행 = 남 ? (de + 2) % 5 : (de + 3) % 5;
    const 배우자이름 = 남 ? '재성' : '관성';
    const last = new Date(year, m, 0).getDate(), all = [];
    for (let d = 1; d <= last; d++) {
      let tf; try { tf = E.dateFortune(year, m, d); } catch (e) { continue; }
      let sc = 0; const why = [];
      if (E.STEM_ELEM[tf.day.stem] === 배우자오행) { sc += 3; why.push(배우자이름 + '의 날'); }
      const dbb = tf.day.branch;
      if (YUKHAP12[db] === dbb) { sc += 3; why.push('배우자 자리와 합'); }
      else if (SAM12.some(g => g.indexOf(db) >= 0 && g.indexOf(dbb) >= 0 && db !== dbb)) { sc += 2; why.push('배우자 자리와 삼합'); }
      // 충 배제 — 제23조
      all.push({ 일: d, 요일: '일월화수목금토'[new Date(year, m - 1, d).getDay()],
                 간지: E.fmt.pillar(tf.day), 왜: why.join(' · '), sc });
    }
    let 좋은 = all.filter(x => x.sc >= 3).slice(0, 8);
    let 상대 = false;
    if (!좋은.length) {
      상대 = true;
      좋은 = all.filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 4)
               .sort((a, b) => a.일 - b.일);
    }
    // 좋은 날은 시진까지 — 그날의 하늘(시간)에 배우자성이 오는 시, 일지와 합하는 시
    좋은.forEach(x => {
      let tf; try { tf = E.dateFortune(year, m, x.일); } catch (e) { return; }
      x.시진 = 좋은시진(tf.day.stem, (hs, hb) => {
        let v = 0;
        if (E.STEM_ELEM[hs] === 배우자오행) v += 3;
        if (YUKHAP12[db] === hb) v += 3;
        else if (SAM12.some(g => g.indexOf(db) >= 0 && g.indexOf(hb) >= 0 && db !== hb)) v += 2;
        return v;
      }, tf);
    });
    const 조심 = all.filter(x => x.sc <= -3).slice(0, 4);
    return { 좋은, 조심, 상대 };
  }

  /** 두 사람 — 그 달의 날짜 전부 + 좋은 날의 시진과 시계 창. bothDays 와 같은 자다.
   *  lon 을 주면 시진을 그 지역의 시계 시각으로 바꿔 준다 (진태양시 보정). */
  function coupleDates(Rme, Ryou, year, month, lon) {
    const last = new Date(year, month, 0).getDate();
    const rows = [];
    for (let d = 1; d <= last; d++) {
      let tf; try { tf = E.dateFortune(year, month, d); } catch (e) { continue; }
      const day = { month: tf.day };
      const A = monthScoreFor(Rme, day), B = monthScoreFor(Ryou, day);
      rows.push({ 일: d, 요일: '일월화수목금토'[new Date(year, month - 1, d).getDay()],
                  간지: E.fmt.pillar(tf.day), 점수: Math.min(A.s, B.s),
                  이유: [].concat(A.이유.slice(0, 1), B.이유.slice(0, 1)) });
    }
    const 좋은날 = rows.filter(r => r.점수 >= 70);
    const 피할날 = rows.filter(r => r.점수 <= 32).slice(0, 5);

    // 좋은 날의 시진 — 시두법으로 12시진을 세우고 같은 자로 잰다.
    // 시계 창: 시진은 진태양시 기준이라, 시계로는 지역 보정만큼 밀린다 (서울 약 32분).
    const HB_KO = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const two = (n) => (n < 10 ? '0' : '') + n;
    좋은날.slice(0, 6).forEach(r => {
      let tf; try { tf = E.dateFortune(year, month, r.일); } catch (e) { return; }
      const dstem = tf.day.stem, best = [];
      for (let hb = 0; hb < 12; hb++) {
        const hs = ((dstem % 5) * 2 + hb) % 10;
        const hp = { month: { stem: hs, branch: hb } };
        best.push([hb, Math.min(monthScoreFor(Rme, hp).s, monthScoreFor(Ryou, hp).s)]);
      }
      best.sort((a, b) => b[1] - a[1]);
      // 시계 창으로 바꾼다 — solar = clock + offset 이므로 clock = solar − offset
      const off = lon ? Math.round(-E.solarOffsetMin(year, month, r.일, lon)) : 0;
      r.시진 = best.slice(0, 2).map(x => {
        const hb = x[0], s0 = (23 + hb * 2) % 24;
        const c0 = (s0 * 60 + off + 1440) % 1440, c1 = (c0 + 120) % 1440;
        const w = two(Math.floor(c0 / 60)) + ':' + two(c0 % 60) + '~' + two(Math.floor(c1 / 60)) + ':' + two(c1 % 60);
        return HB_KO[hb] + '시 ' + (lon ? '시계 ' + w : '');
      });
    });
    return { rows, 좋은날, 피할날 };
  }

  /** 이번 달 풀이 — 한 사람의 일운 한 달. 달마다 다시 사는 상품이다. */
  function myDays(R, year, month) {
    const last = new Date(year, month, 0).getDate();
    const rows = [];
    for (let d = 1; d <= last; d++) {
      let tf; try { tf = E.dateFortune(year, month, d); } catch (e) { continue; }
      const A = monthScoreFor(R, { month: tf.day });
      const g = E.TEN_GODS[E.tenGod(R.pillars.day.stem, tf.day.stem)];
      rows.push({ 일: d, 요일: '일월화수목금토'[new Date(year, month - 1, d).getDay()],
                  간지: E.fmt.pillar(tf.day), 십신: g, 점수: A.s, 이유: A.이유 });
    }
    const 좋은 = rows.filter(r => r.점수 >= 72);
    const 조심 = rows.filter(r => r.점수 <= 30);
    // 주 단위 흐름 — 일주일씩 끊어 가장 큰 결을 하나씩 말한다
    const 주들 = [];
    for (let w = 0; w * 7 < rows.length; w++) {
      const part = rows.slice(w * 7, w * 7 + 7);
      if (!part.length) break;
      const avg = part.reduce((a, r) => a + r.점수, 0) / part.length;
      const top = part.slice().sort((a, b) => b.점수 - a.점수)[0];
      const low = part.slice().sort((a, b) => a.점수 - b.점수)[0];
      주들.push({ 시작: part[0].일, 끝: part[part.length - 1].일, 평균: Math.round(avg), top, low });
    }
    return { rows, 좋은, 조심, 주들 };
  }

  // ── 너의 연애 스토리 — 과거를 맞히면 미래를 산다 ──
  //
  // 무료: 과거(연애했을 가능성이 높은 구간을 찍는다) + 현재(연애 중인지 아닌지).
  // 유료: 미래(언제 할 가능성이 높은지). 과거가 맞아야 미래에 지갑이 열린다 —
  // 그래서 과거와 미래를 **같은 잣대**로 잰다. 과거를 맞힌 그 자가 미래를 재는 자다.
  //
  // 잣대는 인연 잣대 그대로: 배우자성(남 재성·여 관성)이 하늘에 오는가(뿌리까지),
  // 배우자 자리(일지)와 합·삼합·충이 되는가. 대운은 10년 바탕으로 얹는다.
  // 정직성: 단정하지 않는다 — 「가능성이 높습니다」까지만. 기준을 밝힌다.

  // 정복한 층을 스토리 잣대에 접속하기 위한 메모 — 사주당 한 번만 계산한다.
  function 조후글자(R) {
    if (R.__joNeed !== undefined) return R.__joNeed;
    let n = null;
    try { const g = global.ChaeksaClassic && global.ChaeksaClassic.gungtong(R); if (g && g.need) n = g.need; } catch (e) {}
    R.__joNeed = n; return n;
  }
  function 인연상태(R) {
    if (R.__inSt !== undefined) return R.__inSt;
    let st = null;
    try { st = inyeonWhy(R).상태; } catch (e) {}
    R.__inSt = st; return st;
  }

  function 연애해점수(R, y, 오행, 이름) {
    const p = R.pillars, db = p.day.branch, ds = p.day.stem;
    const W = E.NATAL_WEIGHT;
    const 자리 = [[p.year.branch, W.yearBranch], [p.month.branch, W.monthBranch],
                  [p.day.branch, W.dayBranch]];
    if (p.hour) 자리.push([p.hour.branch, W.hourBranch]);
    let tf, du;
    try { tf = E.dateFortune(y, 6, 15); du = E.currentDaeun(R, new Date(y, 5, 15)); }
    catch (e) { return null; }
    let sc = 20; const 이유 = []; let 충맞음 = false;
    // 세부 — 문장 조립기가 쓸 실제 글자들. 라벨만 남기면 말이 무뎌진다.
    const 세부 = { 간지: E.fmt.pillar(tf.year), 세간: tf.year.stem, 세지: tf.year.branch,
                   성투: false, 힘: 0, 관계: null, 대운성: false, 대운간지: du ? E.fmt.pillar(du) : null };
    if (E.STEM_ELEM[tf.year.stem] === 오행) {
      const 힘 = E.stemPower(tf.year.stem, 자리.concat([[tf.year.branch, 1.0]]));
      sc += 26 + Math.min(16, Math.round(힘 * 10));
      세부.성투 = true; 세부.힘 = 힘;
      이유.push(힘 > 0.8 ? 이름 + '이 뿌리까지 내리고 온 해' : 이름 + '이 하늘에 뜬 해');
    }
    const yb = tf.year.branch;
    if (YUKHAP12[db] === yb) { sc += 24; 세부.관계 = '육합'; 이유.push('배우자 자리와 합'); }
    else if (SAM12.some(g => g.indexOf(db) >= 0 && g.indexOf(yb) >= 0 && db !== yb)) {
      sc += 18; 세부.관계 = '삼합'; 이유.push('배우자 자리와 삼합');
    }   // 충 배제 — 제23조 (충맞음은 늘 false — 매듭·흔들림 서사도 같이 잠들었다)
    if (du) {
      if (E.STEM_ELEM[du.stem] === 오행) { sc += 12; 세부.대운성 = true; 이유.push('대운 자체가 ' + 이름 + '을 데려오는 10년'); }
      if (YUKHAP12[db] === du.branch) sc += 8;
    }
    // ── 정복한 층 접속 — 여기부터가 자평진전·궁통보감을 정복한 값어치다 ──
    // ① 암장: 하늘이 아니라 땅으로 오는 인연. 세운 지지의 지장간에 배우자성이 들면
    //    소리 없이 가까워지는 해다. 천간 투출만 보면 이 해들을 통째로 놓친다.
    if ((E.HIDDEN[yb] || []).some(st => E.STEM_ELEM[st] === 오행)) {
      sc += 10; 세부.암장 = true; 이유.push(이름 + '이 그해 지지 속으로 숨어 드는 해');
    }
    // ② 도화: 일지·연지 삼합국의 도화지가 세운으로 오는 해 — 눈에 띄고 끌리는 해.
    if (DOHWA[db] === yb || DOHWA[p.year.branch] === yb) {
      sc += 10; 세부.도화 = true; 이유.push('도화가 드는 해');
    }
    // ③ 일간합: 세운 천간이 일간을 곧장 끌어당기는 합 — 머리보다 마음이 먼저 움직인다.
    if (E.isHap(ds, tf.year.stem)) {
      sc += 10; 세부.일간합 = true; 이유.push('그해 하늘이 일간을 끌어당기는 합');
    }
    // ④ 조후: 궁통보감의 계절 약이 세운 천간으로 오는 해 — 삶이 전반적으로 풀리며 인연도 함께.
    const jo = 조후글자(R);
    if (jo && E.STEMS[tf.year.stem] === jo) {
      sc += 8; 세부.조후 = true; 이유.push('계절의 약(' + jo + ')' + 조(jo,'이','가') + ' 오는 해');
    }
    // ⑤ 합거 보정: 원국 배우자성이 묶인 사주는, 세운이 그 글자를 하늘로 직접
    //    데려오는 해의 의미가 남들보다 크다 (v200에서 배운 규칙 — 묶임과 무관하게
    //    새 글자가 명령한다).
    if (세부.성투 && 인연상태(R) === '합거') {
      sc += 8; 세부.합거해방 = true; 이유.push('묶인 원국 대신 하늘이 직접 데려오는 해');
    }
    // 제20조-운: 방에서 절·묘인 성 글자의 장생·제왕지가 세운 지지로 오는 해 —
    // 꺼진 등이 켜지는 자리. 평소 해는 깎지 않는다(B안 — 낙인이 아니라 시계).
    for (const st20 of [오행 * 2, 오행 * 2 + 1]) {
      const 궁u = E.unseong(st20, db);
      if (궁u !== '절' && 궁u !== '묘') continue;
      const 운u = E.unseong(st20, yb);
      if (운u === '장생' || 운u === '제왕') {
        sc += 8; 세부.등켜짐 = { 성: st20, 지: yb, 단계: 운u };
        이유.push('방에서 꺼져 있던 ' + E.STEMS[st20] + '의 등이 켜지는 자리(' + E.BRANCHES[yb] + ' ' + 운u + ')');
        break;
      }
    }
    // ⑥ 탈성합(인연법 65·66) — 「애매해서 계산을 안 하던」 자리를 계산으로.
    //    내 원국에 투출한 배우자성을 세운 천간이 합으로 데려가는 해:
    //    丁일간의 辛 편재를 丙(겁재)가 丙辛합으로 가져가고, 丁녀의 壬 정관은
    //    丁(비견 — 같은 글자의 여자)이 합으로 데려간다. 글자 메커니즘이라 결정적이다.
    const 투출성 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : [])
      .filter(st => E.STEM_ELEM[st] === 오행);
    const 뺏는짝 = 투출성.find(st => E.isHap(st, tf.year.stem));
    if (뺏는짝 !== undefined && E.STEM_ELEM[tf.year.stem] !== 오행) {
      sc -= 16; 세부.뺏김 = { 성: 뺏는짝, 손: tf.year.stem };
      이유.push('세운 ' + E.STEMS[tf.year.stem] + 조(E.STEMS[tf.year.stem],'이','가') + ' 공주님의 ' + 이름 + ' ' + E.STEMS[뺏는짝] + 조(E.STEMS[뺏는짝],'을','를') + ' 합으로 데려가는 해 — 삼각·이탈 조심');
    }
    // ⑥-역 가로채임 — 운이 데려온 배우자성을 원국 글자가 합으로 선점한다.
    // 丙이 뜬 丁일간 남명: 辛(편재) 운이 올 때마다 丙辛합으로 丙이 먼저 채간다.
    // 「오긴 오는데 내 것이 안 된다」 — 이 구조가 연애를 힘들게 하던 뿌리다.
    if (세부.성투) {
      const 채는손 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : [])
        .find(st => E.isHap(st, tf.year.stem) && E.STEM_ELEM[st] !== 오행);
      if (채는손 !== undefined) {
        sc -= 22; 세부.가로채임 = { 손: 채는손, 성: tf.year.stem };
        이유.push('운이 데려온 ' + E.STEMS[tf.year.stem] + 조(E.STEMS[tf.year.stem],'을','를') + ' 원국의 ' + E.STEMS[채는손] + 조(E.STEMS[채는손],'이','가') + ' 합으로 먼저 채가는 해 — 오긴 오는데 내 것이 되기 어렵다');
      }
    }
    // 십신 상극의 해(65·66) — 여명 식상은 관을 치고, 남명 비겁은 재를 나눈다.
    const 남2 = 이름 === '재성';
    const 세십신 = E.TEN_GODS[E.tenGod(ds, tf.year.stem)];
    if (!남2 && (세십신 === '상관' || 세십신 === '식신') && 투출성.length) {
      sc -= (세십신 === '상관' ? 14 : 8); 세부.견관 = true;
      이유.push('남편성을 치는 ' + 세십신 + '의 해 — 말이 관계를 다치게 하기 쉬운 자리');
    }
    if (남2 && 세십신 === '겁재' && 투출성.length && !세부.뺏김) {
      sc -= 10; 세부.탈재 = true;
      이유.push('연인을 나눠 갖자는 손(겁재)의 해 — 곁을 소홀히 하면 비는 자리');
    }
    // 삼합 완성(인연법 54) — 대운지+세운지+일지가 삼합 한 벌을 이루는 해. 큰 응기.
    if (du) {
      const 셋 = [db, yb, du.branch];
      if (new Set(셋).size === 3 && SAM12.some(g => 셋.every(b => g.indexOf(b) >= 0))) {
        sc += 20; 세부.삼합완성 = true;
        이유.push('대운·세운이 배우자 자리와 삼합을 완성하는 해 — 큰 응기');
      }
    }
    // 관살혼잡의 정화(인연법 64) — 정·편이 둘 다 떠서 혼잡한 원국이,
    //    세운의 합거로 하나가 걷히는 해(거관유살·거살유관). 여명 혼인 응기.
    if (투출성.length >= 2) {
      const 걷힘 = 투출성.find(st => E.isHap(st, tf.year.stem) && E.STEM_ELEM[tf.year.stem] !== 오행);
      if (걷힘 !== undefined) {
        const 남는것 = 투출성.find(st => st !== 걷힘);
        sc += 14; 세부.혼잡정화 = { 걷힘, 남음: 남는것 };
        이유.push('겹쳐 있던 ' + 이름 + ' 중 ' + E.STEMS[걷힘] + 조(E.STEMS[걷힘],'이','가') + ' 걷히고 ' + E.STEMS[남는것] + 조(E.STEMS[남는것],'이','가') + ' 남는 해 — 어지럽던 인연이 맑아지는 자리');
      }
    }
    // 대운 층의 경고(50·52·53) — 무대 자체가 다치는 10년은 세운 가산을 눌러 말한다.
    if (du) {
      const 대십신 = E.TEN_GODS[E.tenGod(ds, du.stem)];
      if (세부.대운성) {
        const 묶임 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : [])
          .find(st => E.isHap(st, du.stem));
        if (묶임 !== undefined) {
          sc -= 8; 세부.대운묶임 = 묶임;
          이유.push('다만 그 대운이 원국 ' + E.STEMS[묶임] + '과 합으로 묶여 무대가 반감되는 10년');
        }
      }
      if (!남2 && (대십신 === '상관' || 대십신 === '식신')) {
        sc -= 8; 세부.대운견관 = true;
        이유.push('남편성을 치는 기운이 바탕에 깔린 10년 — 관계는 말을 아끼는 지혜가 필요');
      }
      if (남2 && (대십신 === '겁재' || 대십신 === '비견')) {
        sc -= (대십신 === '겁재' ? 8 : 5); 세부.대운탈재 = true;
        이유.push('연인을 나누자는 손이 배경에 있는 10년 — 곁을 지키는 것이 일');
      }
    }
    return { 해: y, 점수: Math.max(0, Math.min(100, sc)), 이유, 충: 충맞음 || !!세부.뺏김, 세부 };
  }

  // 글자를 사람 말로 — 「辛(신)」 「卯(묘)」. 조사는 우리말 읽기의 받침으로 고른다.
  const 간말 = (st) => E.STEMS[st] + '(' + E.STEMS_KO[st] + ')';
  const 지말 = (b) => E.BRANCHES[b] + '(' + E.BRANCHES_KO[b] + ')';
  const 이가 = (ko) => ((ko.charCodeAt(ko.length - 1) - 0xAC00) % 28) ? '이' : '가';
  const 을를 = (ko) => ((ko.charCodeAt(ko.length - 1) - 0xAC00) % 28) ? '을' : '를';
  // 한자 간지를 그대로 받아 조사를 가른다 — 「庚寅은 / 甲子는」, 「癸가 / 辛이」.
  // 800판을 재 보니 한자 뒤 조사가 거의 전부 '이'로 박혀 있었다(2026-08-31).
  const 讀 = { 甲:'갑', 乙:'을', 丙:'병', 丁:'정', 戊:'무', 己:'기', 庚:'경', 辛:'신', 壬:'임', 癸:'계',
               子:'자', 丑:'축', 寅:'인', 卯:'묘', 辰:'진', 巳:'사', 午:'오',
               未:'미', 申:'신', 酉:'유', 戌:'술', 亥:'해' };
  function 조(s, 있, 없) {
    const 끝 = String(s || '').slice(-1);
    const c = (讀[끝] || 끝).charCodeAt(0) - 0xAC00;
    if (c < 0 || c > 11171) return 있;          // 모르면 원래대로 둔다
    return (c % 28) !== 0 ? 있 : 없;
  }

  /** 연애 구간 서술 — 그 해의 실제 글자로 문장을 짠다. 해마다 문장이 다르다. */
  function 연애서술(d, db, 이름) {
    const 문 = [];
    if (d.성투) {
      문.push('그해(' + d.간지 + ') 하늘에 공주님의 인연 글자 ' + 간말(d.세간) + 이가(E.STEMS_KO[d.세간]) + ' 떠올랐습니다'
        + (d.힘 > 0.8 ? ' — 뿌리까지 내려 힘이 실린 채로, 스치는 호감이 아니라 이어질 힘이 있는 만남으로 옵니다.'
                       : ' — 인연이 눈앞에 모습을 드러내는 해입니다.'));
    }
    if (d.관계 === '육합') 문.push('그리고 그해의 ' + 지말(d.세지) + 이가(E.BRANCHES_KO[d.세지]) + ' 공주님의 배우자 자리 ' + 지말(db) + 을를(E.BRANCHES_KO[db]) + ' 끌어안는 합이었습니다 — 마음이 기울고 곁을 내주게 되는 해입니다.');
    else if (d.관계 === '삼합') 문.push('그해의 ' + 지말(d.세지) + '는 공주님의 배우자 자리 ' + 지말(db) + '와 삼합으로 맞물립니다 — 같이 다니고 같이 겪으며 가까워지는 해입니다.');
    // 관계에는 육합·삼합만 들어간다(981·983줄) — 충 가지는 제23조 뒤로 죽은 코드였다.
    if (d.암장) 문.push('그해는 하늘이 아니라 땅으로도 왔습니다 — ' + 지말(d.세지) + ' 속에 인연의 글자가 숨어 들어, 소문 없이 가까워지는 종류의 해입니다.');
    if (d.도화) 문.push('게다가 그해의 ' + 지말(d.세지) + '는 공주님의 도화(桃花) 자리 — 가만히 있어도 눈에 띄고, 끌리는 해입니다.');
    if (d.일간합) 문.push('무엇보다 그해의 하늘 ' + 간말(d.세간) + 이가(E.STEMS_KO[d.세간]) + ' 공주님의 일간을 곧장 끌어당기는 합이라, 머리보다 마음이 먼저 움직입니다.');
    if (d.조후) 문.push('그리고 그 글자는 공주님 사주가 계절적으로 목말라 하던 약이기도 해서, 삶 전체가 풀리며 인연도 함께 열립니다.');
    if (d.합거해방) 문.push('원국의 인연 글자는 합으로 묶여 있지만, 이런 해는 하늘이 새 글자를 직접 데려옵니다 — 묶임과 무관하게 움직이는 해입니다.');
    if (d.뺏김) 문.push('조심할 해였습니다 — 그해의 ' + 간말(d.뺏김.손) + 이가(E.STEMS_KO[d.뺏김.손]) + ' 공주님의 ' + 간말(d.뺏김.성) + '을 합으로 데려가는 해라, 곁의 인연이 흔들리거나 셋이 되기 쉬웠습니다.');
    if (d.등켜짐) 문.push('그리고 그해의 ' + 지말(d.등켜짐.지) + '는 공주님의 방에서 꺼져 있던 ' + 간말(d.등켜짐.성) + '의 ' + d.등켜짐.단계 + '지 — 평소 숨죽여 있던 인연의 등이 켜진 해였습니다.');
    if (d.가로채임) 문.push('아깝게 스친 해였습니다 — 운이 인연의 글자 ' + 간말(d.가로채임.성) + 을를(E.STEMS_KO[d.가로채임.성]) + ' 데려왔는데, 공주님 원국의 ' + 간말(d.가로채임.손) + 이가(E.STEMS_KO[d.가로채임.손]) + ' 합으로 먼저 채갔습니다. 좋은 사람이 지나갔는데 이상하게 이어지지 않았다면, 이 구조입니다.');
    if (d.삼합완성) 문.push('무엇보다 대운과 그해의 지지가 공주님의 배우자 자리와 삼합 한 벌을 완성했습니다 — 고전이 꼽는 큰 응기의 해입니다.');
    if (d.혼잡정화) 문.push('겹쳐 있던 인연의 글자 중 ' + 간말(d.혼잡정화.걷힘) + 이가(E.STEMS_KO[d.혼잡정화.걷힘]) + ' 걷히고 ' + 간말(d.혼잡정화.남음) + '만 남는 해 — 어지럽던 것이 하나로 정리되는, 매듭짓기 좋은 때였습니다.');
    if (d.견관) 문.push('다만 그해는 남편성을 치는 기운이 함께 왔습니다 — 말끝이 관계를 긁기 쉬운 해였습니다.');
    if (d.탈재) 문.push('그리고 나눠 갖자는 손이 함께 온 해라, 곁을 소홀히 하면 비기 쉬운 자리였습니다.');
    if (d.대운성) 문.push('이 모든 것이 ' + (d.대운간지 ? d.대운간지 + ' ' : '') + '대운 — 10년 바탕이 인연을 밀어주는 시기 위에서 일어났습니다. 우연이 아니라 흐름이었다는 뜻입니다.');
    return 문.join(' ');
  }

  // 한 해 안에서 절정 달 무리를 찾는다 — 최고 달을 잡고, 점수가 크게 안 꺾이는
  // 이웃 달로 넓힌다. 「그 해 무렵」보다 「그 해 4~5월 무렵」이 백 배 세다.
  function 절정달(점수들) {   // [{월,점수}...] 12개
    if (!점수들.length) return null;
    let best = 점수들[0];
    점수들.forEach(r => { if (r.점수 > best.점수) best = r; });
    if (best.점수 < 56) return null;
    const idx = 점수들.indexOf(best);
    let a = idx, b = idx;
    while (a > 0 && 점수들[a - 1].점수 >= best.점수 - 8 && 점수들[a - 1].점수 >= 56) a--;
    while (b < 점수들.length - 1 && 점수들[b + 1].점수 >= best.점수 - 8 && 점수들[b + 1].점수 >= 56) b++;
    const 시작 = 점수들[a].월, 끝 = 점수들[b].월;
    return { 시작, 끝, 말: 시작 === 끝 ? 시작 + '월' : 시작 + '~' + 끝 + '월' };
  }

  function loveStory(R, now) {
    const birthY = R.input && R.input.year;
    if (!birthY) return null;
    const de = E.STEM_ELEM[R.pillars.day.stem];
    const 남 = ((R.input && R.input.gender) || 'M') === 'M';
    const 오행 = 남 ? (de + 2) % 5 : (de + 3) % 5;
    const 이름 = 남 ? '재성' : '관성';
    const nowY = (now || new Date()).getFullYear();

    // ── 과거: 만 17세부터 작년까지 ──
    const from = birthY + 17;
    const 과거 = [];
    for (let y = from; y < nowY; y++) {
      const r = 연애해점수(R, y, 오행, 이름);
      if (r) { r.나이 = y - birthY; 과거.push(r); }
    }
    // 이어진 좋은 해를 구간으로 묶는다 — 연애는 해 하나로 끝나지 않는다
    const 구간들 = [];
    let cur = null;
    과거.forEach(r => {
      if (r.점수 >= 56) {
        if (cur && r.해 === cur.끝 + 1) { cur.끝 = r.해; cur.끝나이 = r.나이; if (r.점수 > cur.최고) { cur.최고 = r.점수; cur.최고해 = r.해; cur.이유 = r.이유; cur.최고세부 = r.세부; } }
        else { cur = { 시작: r.해, 끝: r.해, 시작나이: r.나이, 끝나이: r.나이, 최고: r.점수, 최고해: r.해, 이유: r.이유, 최고세부: r.세부 }; 구간들.push(cur); }
      } else cur = null;
    });
    구간들.forEach(g => {
      g.말 = g.최고 >= 76 ? '이 무렵 연애했을 가능성이 높습니다'
           : g.최고 >= 64 ? '이 무렵 누군가 있었거나, 시작될 뻔한 때입니다'
           : '만남이 스쳐 갔기 쉬운 때입니다';
      // 풀이(10층) — 절정 해의 실제 글자로 조립한다. 해마다 문장이 다르다.
      if (g.최고세부) g.풀이 = 연애서술(g.최고세부, R.pillars.day.branch, 이름);
      // 절정 해의 달까지 내려간다 — 같은 잣대(inyeonMonths)로
      try {
        const im = inyeonMonths(R, g.최고해);
        const pk = 절정달(im.rows.map(r => ({ 월: r.월, 점수: r.점수 })));
        if (pk) g.달 = { 해: g.최고해, 말: pk.말 };
      } catch (e) {}
      // 매듭(충 기반)은 제23조로 배제 — 충의 진짜 간법을 배우면 그때 다시 세운다
    });
    const 찍은과거 = 구간들.slice().sort((a, b) => b.최고 - a.최고).slice(0, 3)
      .sort((a, b) => a.시작 - b.시작);
    const 흔들린해 = [];   // 충 배제 — 제23조

    // ── 현재 — 상태는 누적이다. 해 점수는 사건이고, 사건을 이어야 상태가 나온다 ──
    // 사람의 연애는 해마다 리셋되지 않는다: 열린 해에 시작된 관계는 매듭(충) 신호가
    // 없는 한 조용한 해에도 이어진다. 그래서 마지막 사건에서 상태를 도출하고,
    // 명리가의 화법대로 두 갈래(연애 중이시라면 / 혼자시라면)로 말한다.
    const 올해 = 연애해점수(R, nowY, 오행, 이름);
    const 마지막열림 = 과거.filter(r => r.점수 >= 64).slice(-1)[0] || null;
    const 마지막매듭 = null;   // 충 배제 — 제23조. 매듭 신호 없이 이어짐/조용으로만 잇는다
    let 현재;
    if (올해.점수 >= 70) {
      현재 = { 판: '열림', 말: '지금은 인연의 문이 열려 있는 구간입니다. 연애 중이시라면 관계가 한 걸음 깊어지는 때이고, 혼자시라면 — 이 기준으로는 혼자 계실 이유가 없는 해입니다. 올해 안의 만남을 흘려보내지 마세요.' };
    } else if (마지막열림 && !마지막매듭 && nowY - 마지막열림.해 <= 2) {
      현재 = { 판: '이어짐', 말: 마지막열림.해 + '년(만 ' + 마지막열림.나이 + '살) 무렵 열린 인연의 기운이, 그 뒤로 매듭 신호 없이 이어져 오고 있습니다. 연애 중이시라면 그때 시작되었거나 깊어진 관계일 가능성이 높고 — 지금의 조용함은 식은 게 아니라 자리를 잡은 것입니다. 혼자시라면 그 무렵의 만남이 스쳐 간 것이니, 다음 열림을 미리 보아 두세요.' };
    } else if (마지막매듭 && nowY - 마지막매듭.해 <= 2) {
      현재 = { 판: '공백', 말: 마지막매듭.해 + '년(만 ' + 마지막매듭.나이 + '살)의 흔들림에서 한 매듭이 지어졌기 쉽습니다. 지금은 그 뒤의 공백 — 비어 있는 게 아니라 비워 둔 시간입니다. 이 기준으로는 혼자 계실 가능성이 높고, 그래서 다음 열림이 언제인지가 중요합니다.' };
    } else if (올해.점수 >= 56) {
      현재 = { 판: '문턱', 말: '지금은 문턱의 구간입니다. 연애 중일 수도, 시작 직전일 수도 있는 때 — 어느 쪽이든 올해 안에 방향이 정해지기 쉽습니다.' };
    } else if (올해.충) {
      현재 = { 판: '흔들림', 말: '지금은 배우자 자리가 흔들리는 구간입니다. 연애 중이시라면 삐걱거리기 쉬운 해이니 큰 결정은 미루시고, 최근에 정리가 있었다 해도 이 기준으로는 이상하지 않습니다.' };
    } else {
      현재 = { 판: '조용', 말: '지금은 인연의 기운이 조용한 구간입니다. 최근 몇 해에 열림도 매듭도 뚜렷하지 않아, 혼자 계실 가능성이 높습니다 — 다만 조용한 것은 멈춘 것이 아니라 다음 파도 전의 바다입니다.' };
    }
    현재.점수 = 올해.점수; 현재.이유 = 올해.이유;
    // 해는 큰 물이고 달은 지금 발 딛는 물결이다 — 해만 보고 「조용」이라 하면
    // 이번 달이 열린 사람에게 틀린 말을 하게 된다. 이번 달로 보정한다.
    try {
      const nowM = (now || new Date()).getMonth() + 1;
      const 이달 = inyeonMonths(R, nowY).rows[nowM - 1];
      if (이달 && 이달.점수 >= 56 && (현재.판 === '조용' || 현재.판 === '흔들림')) {
        현재.판 = '문턱';
        현재.말 = '해 전체로는 조용한 구간인데, 바로 이번 달(' + 이달.간지 + ')' + 조(이달.간지,'은','는') + ' 다릅니다 — '
          + (이달.이유[0] || '작게 열려 있는 달') + '. 큰 물은 잔잔해도 지금 발밑의 물결은 움직이고 있습니다. 이번 달 안의 일은 흘려보내지 마세요.';
        현재.이유 = 이달.이유;
      } else if (이달 && 이달.점수 <= 30 && 현재.판 === '열림') {
        현재.말 += ' 다만 바로 이번 달(' + 이달.간지 + ')' + 조(이달.간지,'은','는') + ' 눌리는 달이라, 서두르기보다 다음 달을 기다리는 편이 낫습니다.';
      }
    } catch (e) {}

    // ── 미래 (유료에서 보여줄 것) ──
    const 미래 = [];
    for (let y = nowY + 1; y <= nowY + 6; y++) {
      const r = 연애해점수(R, y, 오행, 이름);
      if (r) { r.나이 = y - birthY; 미래.push(r); }
    }
    const 첫열림 = 미래.filter(r => r.점수 >= 56)[0] || 미래.slice().sort((a, b) => b.점수 - a.점수)[0];

    return { 이름, 남, 과거: 찍은과거, 흔들린해, 현재, 미래, 첫열림, 시작나이: 17 };
  }

  // ── 너의 재물 스토리 — 연애 스토리와 같은 틀, 잣대만 돈으로 ──
  //
  // 무료: 과거(들어왔던 구간·샜던 해) + 현재(모이는지 새는지).
  // 유료: 미래(언제 벌리고 언제 지켜야 하는가).
  //
  // 잣대 — 지어내지 않는다. 재성(일간이 극하는 오행) = 돈의 글자, 남녀 무관.
  //   벌리는 해   재성이 하늘에 뜨는 해(뿌리 보너스) · 식상 해(벌이를 만드는 결)
  //   새는 해     겁재 해(나눠 갖는 손) · 비견 해
  //   재다신약    신약이 재성 해를 만나면 「돈은 오는데 쥐기 버겁다」 — 가산을 줄이고 말로 밝힌다
  //   대운        재성 대운 = 버는 10년 바탕 · 겁재 대운 = 지키는 10년

  function 재물해점수(R, y) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds];
    const 재오행 = (de + 2) % 5;
    const a = R.analysis || E.strengthOf(p);
    const 신약 = a.strength === '신약';
    const W = E.NATAL_WEIGHT;
    const 자리 = [[p.year.branch, W.yearBranch], [p.month.branch, W.monthBranch],
                  [p.day.branch, W.dayBranch]];
    if (p.hour) 자리.push([p.hour.branch, W.hourBranch]);
    let tf, du;
    try { tf = E.dateFortune(y, 6, 15); du = E.currentDaeun(R, new Date(y, 5, 15)); }
    catch (e) { return null; }

    let sc = 30; const 이유 = []; let 샘 = false;
    const 세부 = { 간지: E.fmt.pillar(tf.year), 세간: tf.year.stem, 세지: tf.year.branch,
                   십신: null, 힘: 0, 신약: 신약, 뿌리: false, 대운성: false, 대운간지: du ? E.fmt.pillar(du) : null };
    const g = E.TEN_GODS[E.tenGod(ds, tf.year.stem)];
    세부.십신 = g;
    if (g === '편재' || g === '정재') {
      const 힘 = E.stemPower(tf.year.stem, 자리.concat([[tf.year.branch, 1.0]]));
      let add = 26 + Math.min(14, Math.round(힘 * 10));
      세부.힘 = 힘;
      if (신약) { add = Math.round(add * 0.7); 이유.push('재성이 온 해 — 다만 신약이라 들어와도 바쁘고 버거운 모양입니다'); }
      else 이유.push(힘 > 0.8 ? '재성이 뿌리까지 내리고 온 해 — 크게 들어옵니다' : '재성이 하늘에 뜬 해');
      sc += add;
    } else if (g === '식신' || g === '상관') {
      sc += 14; 이유.push('벌이를 만드는 기운(식상)이 온 해 — 일이 돈이 되는 길목');
    } else if (g === '겁재') {
      sc -= 20; 샘 = true; 이유.push('나눠 갖는 손(겁재)가 온 해 — 동업·보증·큰 지출이 새기 쉽습니다');
    } else if (g === '비견') {
      sc -= 8; 이유.push('내 몫을 지켜야 하는 해');
    }
    if (E.BRANCH_ELEM[tf.year.branch] === 재오행) { sc += 10; 세부.뿌리 = true; 이유.push('돈의 뿌리가 지지로 들어온 해'); }
    if (du) {
      const dg = E.TEN_GODS[E.tenGod(ds, du.stem)];
      if (dg === '편재' || dg === '정재') { sc += 10; 세부.대운성 = true; 이유.push('대운 자체가 재물을 데려오는 10년'); }
      else if (dg === '겁재') { sc -= 10; 이유.push('대운이 지키는 쪽인 10년'); }
      else if (dg === '식신' || dg === '상관') sc += 6;
    }
    // ── 정복한 층 접속 ──
    if ((E.HIDDEN[tf.year.branch] || []).some(st => E.STEM_ELEM[st] === 재오행)) {
      sc += 8; 세부.암장 = true; 이유.push('재성이 그해 지지 속으로 숨어 드는 해');
    }
    if (E.STEM_YANG[ds] === 1 && E.isHap(ds, tf.year.stem)) {
      // 양간의 일간합 상대는 정재 — 일간이 돈을 제 손으로 끌어당기는 해
      sc += 8; 세부.일간합 = true; 이유.push('일간이 재성을 끌어당기는 합의 해');
    }
    const jo = 조후글자(R);
    if (jo && E.STEMS[tf.year.stem] === jo) {
      sc += 8; 세부.조후 = true; 이유.push('계절의 약(' + jo + ')' + 조(jo,'이','가') + ' 오는 해');
    }
    // 탈재합 — 丁일간의 辛 재성을 丙(겁재)가 丙辛합으로 데려간다. 돈이든 여자든.
    // 겁재 세운의 감점과 별개로, 원국 재성 글자가 실제로 합거되는 해는 더 무겁다.
    const 투출재 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : [])
      .filter(st => E.STEM_ELEM[st] === 재오행);
    const 뺏긴재 = 투출재.find(st => E.isHap(st, tf.year.stem));
    if (뺏긴재 !== undefined && E.STEM_ELEM[tf.year.stem] !== 재오행) {
      sc -= 16; 샘 = true; 세부.뺏김 = { 성: 뺏긴재, 손: tf.year.stem };
      이유.push('세운 ' + E.STEMS[tf.year.stem] + 조(E.STEMS[tf.year.stem],'이','가') + ' 공주님의 재성 ' + E.STEMS[뺏긴재] + 조(E.STEMS[뺏긴재],'을','를') + ' 합으로 데려가는 해 — 동업·보증·빌려주기 금물');
    }
    // 역방향 가로채임 — 운이 데려온 재성을 원국 글자가 합으로 선점 (丙 투출 丁일간의 辛 운)
    if (g === '편재' || g === '정재') {
      const 채는손 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : [])
        .find(st => E.isHap(st, tf.year.stem) && E.STEM_ELEM[st] !== 재오행);
      if (채는손 !== undefined) {
        sc -= 20; 세부.가로채임 = { 손: 채는손, 성: tf.year.stem };
        이유.push('운이 데려온 재성 ' + E.STEMS[tf.year.stem] + 조(E.STEMS[tf.year.stem],'을','를') + ' 원국의 ' + E.STEMS[채는손] + 조(E.STEMS[채는손],'이','가') + ' 합으로 먼저 채가는 해 — 벌이가 와도 내 몫이 줄기 쉽다');
      }
    }
    // 대운 층의 경고 — 재성 대운이 원국과 합으로 묶이면 무대 반감.
    if (du && 세부.대운성) {
      const 묶임 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : [])
        .find(st => E.isHap(st, du.stem));
      if (묶임 !== undefined) {
        sc -= 8; 세부.대운묶임 = 묶임;
        이유.push('다만 그 대운이 원국 ' + E.STEMS[묶임] + '과 합으로 묶여 무대가 반감되는 10년');
      }
    }
    return { 해: y, 점수: Math.max(0, Math.min(100, sc)), 이유, 샘, 세부 };
  }

  /** 재물 구간 서술 — 그 해의 실제 글자로. */
  function 재물서술(d) {
    const 문 = [];
    if (d.십신 === '편재' || d.십신 === '정재') {
      문.push('그해(' + d.간지 + ') 하늘에 공주님의 돈 글자 ' + 간말(d.세간) + 이가(E.STEMS_KO[d.세간]) + ' 떠올랐습니다'
        + (d.힘 > 0.8 ? ' — 뿌리까지 내려, 스쳐 가는 돈이 아니라 쥐어지는 돈이 오는 해입니다.'
                       : ' — 벌이의 기회가 눈에 보이게 나타나는 해입니다.'));
      if (d.신약) 문.push('다만 공주님은 힘이 밖에서 채워지는 사주라, 들어온 만큼 몸이 바쁘고 버거움도 같이 왔기 쉽습니다.');
    } else if (d.십신 === '식신' || d.십신 === '상관') {
      문.push('그해는 ' + 간말(d.세간) + ' — 공주님이 만들어내는 기운의 해였습니다. 일이 돈이 되는 길목이 놓여, 이때 벌인 판이 뒤의 밑천이 됩니다.');
    }
    if (d.뿌리) 문.push('게다가 그해의 ' + 지말(d.세지) + '로 돈의 뿌리가 지지까지 들어와, 바닥이 받쳐 준 해였습니다.');
    if (d.암장) 문.push('그해는 땅으로도 왔습니다 — ' + 지말(d.세지) + ' 속에 돈의 글자가 숨어 들어, 겉으론 조용한데 통장은 움직이는 종류의 해입니다.');
    if (d.일간합) 문.push('그해의 하늘 ' + 간말(d.세간) + 이가(E.STEMS_KO[d.세간]) + ' 공주님의 일간과 합 — 돈이 굴러오는 게 아니라 공주님 손이 먼저 뻗는 해입니다.');
    if (d.조후) 문.push('그 글자는 공주님 사주가 계절적으로 목말라 하던 약이기도 해서, 일이 전반적으로 풀리며 벌이도 함께 열립니다.');
    if (d.뺏김) 문.push('조심할 해였습니다 — 그해의 ' + 간말(d.뺏김.손) + 이가(E.STEMS_KO[d.뺏김.손]) + ' 공주님의 재성 ' + 간말(d.뺏김.성) + '을 합으로 데려가는 자리라, 돈이든 사람이든 나눠 가자는 손이 닿기 쉬웠습니다.');
    if (d.가로채임) 문.push('벌이가 오다 만 해였습니다 — 운이 재성 ' + 간말(d.가로채임.성) + 을를(E.STEMS_KO[d.가로채임.성]) + ' 데려왔는데 원국의 ' + 간말(d.가로채임.손) + 이가(E.STEMS_KO[d.가로채임.손]) + ' 먼저 채갔습니다. 일은 되는데 정산이 야박했다면 이 구조입니다.');
    if (d.대운성) 문.push('이 모든 것이 ' + (d.대운간지 ? d.대운간지 + ' ' : '') + '대운 — 10년 바탕이 재물을 밀어주는 시기 위에서 일어났습니다.');
    if (d.대운묶임) 문.push('다만 그 대운은 원국 ' + 간말(d.대운묶임) + '과 합으로 묶여 힘이 반감된 무대였습니다.');
    return 문.join(' ');
  }

  function 재물월점수(R, y, m) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds];
    const 재오행 = (de + 2) % 5;
    let tf; try { tf = E.dateFortune(y, m, 15); } catch (e) { return null; }
    let sc = 30; const 이유 = [];
    const g = E.TEN_GODS[E.tenGod(ds, tf.month.stem)];
    if (g === '편재' || g === '정재') { sc += 26; 이유.push('재성이 달의 하늘에 옵니다 — 돈이 도는 달'); }
    else if (g === '식신' || g === '상관') { sc += 14; 이유.push('벌이를 만드는 기운(식상) — 일을 벌이면 돈이 되는 달'); }
    else if (g === '겁재') { sc -= 20; 이유.push('나눠 갖는 손(겁재) — 지출·동업 조심'); }
    else if (g === '비견') { sc -= 8; 이유.push('내 몫을 지키는 달'); }
    if (E.BRANCH_ELEM[tf.month.branch] === 재오행) { sc += 10; 이유.push('돈의 뿌리가 지지로 들어옵니다'); }
    return { 월: m, 간지: E.fmt.pillar(tf.month), 십신: g, 점수: Math.max(0, Math.min(100, sc)), 이유 };
  }

  /** 재물 — 한 달 안의 날들. 돈이 도는 날과 새기 쉬운 날을 같이 낸다. */
  function 재물날들(R, y, m) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds];
    const 재오행 = (de + 2) % 5;
    const last = new Date(y, m, 0).getDate(), all = [];
    for (let d = 1; d <= last; d++) {
      let tf; try { tf = E.dateFortune(y, m, d); } catch (e) { continue; }
      let sc = 0; const why = [];
      const g = E.TEN_GODS[E.tenGod(ds, tf.day.stem)];
      if (g === '편재' || g === '정재') { sc += 3; why.push('재성의 날'); }
      else if (g === '식신' || g === '상관') { sc += 2; why.push('벌이의 날'); }
      else if (g === '겁재') { sc -= 3; why.push('나눠 갖는 손의 날'); }
      if (E.BRANCH_ELEM[tf.day.branch] === 재오행) { sc += 2; why.push('돈의 뿌리'); }
      all.push({ 일: d, 요일: '일월화수목금토'[new Date(y, m - 1, d).getDay()],
                 간지: E.fmt.pillar(tf.day), 왜: why.join(' · '), sc });
    }
    let 좋은 = all.filter(x => x.sc >= 3).slice(0, 8);
    let 상대 = false;
    if (!좋은.length) {
      상대 = true;
      좋은 = all.filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 4)
               .sort((a, b) => a.일 - b.일);
    }
    // 좋은 날은 시진까지 — 계약서에 도장 찍는 시간을 고르는 자리다
    좋은.forEach(x => {
      let tf; try { tf = E.dateFortune(y, m, x.일); } catch (e) { return; }
      x.시진 = 좋은시진(tf.day.stem, (hs, hb) => {
        let v = 0;
        const g = E.TEN_GODS[E.tenGod(ds, hs)];
        if (g === '편재' || g === '정재') v += 3;
        else if (g === '식신' || g === '상관') v += 2;
        else if (g === '겁재') v -= 3;
        if (E.BRANCH_ELEM[hb] === 재오행) v += 2;
        return v;
      }, tf);
    });
    const 조심 = all.filter(x => x.sc <= -3).slice(0, 4);
    return { 좋은, 조심, 상대 };
  }

  function moneyStory(R, now) {
    const birthY = R.input && R.input.year;
    if (!birthY) return null;
    const nowY = (now || new Date()).getFullYear();
    const a = R.analysis || E.strengthOf(R.pillars);

    // 과거 — 만 20살부터 (돈은 연애보다 늦게 시작한다)
    const 과거 = [];
    for (let y = birthY + 20; y < nowY; y++) {
      const r = 재물해점수(R, y);
      if (r) { r.나이 = y - birthY; 과거.push(r); }
    }
    const 구간들 = [];
    let cur = null;
    과거.forEach(r => {
      if (r.점수 >= 56) {
        if (cur && r.해 === cur.끝 + 1) { cur.끝 = r.해; cur.끝나이 = r.나이; if (r.점수 > cur.최고) { cur.최고 = r.점수; cur.최고해 = r.해; cur.이유 = r.이유; cur.최고세부 = r.세부; } }
        else { cur = { 시작: r.해, 끝: r.해, 시작나이: r.나이, 끝나이: r.나이, 최고: r.점수, 최고해: r.해, 이유: r.이유, 최고세부: r.세부 }; 구간들.push(cur); }
      } else cur = null;
    });
    구간들.forEach(g => {
      g.말 = g.최고 >= 76 ? '이 무렵 돈이 눈에 띄게 들어왔을 가능성이 높습니다'
           : g.최고 >= 64 ? '이 무렵 벌이가 늘었거나, 돈 되는 일이 열렸기 쉽습니다'
           : '이 무렵은 돈이 돌기 시작한 때입니다';
      if (g.최고세부) g.풀이 = 재물서술(g.최고세부);
      const 매듭 = 과거.find(r => r.해 > g.끝 && r.해 - g.끝 <= 3 && r.샘);
      if (매듭) {
        g.매듭 = { 해: 매듭.해, 나이: 매듭.나이 };
        g.풀이 = (g.풀이 || '') + ' 그리고 이 무렵 벌어들인 것은 ' + 매듭.해 + '년(만 ' + 매듭.나이
          + '살) 나눠 갖는 손이 오면서 일부 새어 나갔기 쉽습니다.';
      }
      // 절정 해의 달까지 — 재물 월 잣대로
      try {
        const rows = [];
        for (let m = 1; m <= 12; m++) { const r = 재물월점수(R, g.최고해, m); if (r) rows.push(r); }
        const pk = 절정달(rows);
        if (pk) g.달 = { 해: g.최고해, 말: pk.말 };
      } catch (e) {}
    });
    const 찍은과거 = 구간들.slice().sort((x, y2) => y2.최고 - x.최고).slice(0, 3)
      .sort((x, y2) => x.시작 - y2.시작);
    const 샌해 = 과거.filter(r => r.샘 && r.점수 <= 40).map(r => ({ 해: r.해, 나이: r.나이 })).slice(-3);

    // 현재
    const 올해 = 재물해점수(R, nowY);
    const 마지막벌림 = 과거.filter(r => r.점수 >= 64).slice(-1)[0] || null;
    const 마지막샘 = 마지막벌림
      ? (과거.filter(r => r.해 > 마지막벌림.해 && r.샘).slice(-1)[0] || null) : null;
    let 현재;
    if (올해.샘) 현재 = { 판: '샘', 말: '지금은 새기 쉬운 구간입니다. 들어오는 게 없어서가 아니라 — 나가는 손이 같이 와 있습니다. 이런 해에는 지키는 것이 버는 것입니다. 동업·보증·큰 지출은 해를 넘겨서 하세요.' };
    else if (올해.점수 >= 70) 현재 = { 판: '들어옴', 말: '지금은 들어오는 구간입니다. 벌이를 벌일 때고, 이런 해의 기회는 미루면 그냥 지나갑니다.' };
    else if (마지막벌림 && !마지막샘 && nowY - 마지막벌림.해 <= 2) {
      현재 = { 판: '이어짐', 말: 마지막벌림.해 + '년(만 ' + 마지막벌림.나이 + '살) 무렵 벌린 판의 기운이 아직 이어지고 있습니다. 그때 놓은 것이 지금의 벌이를 받치고 있을 가능성이 높습니다 — 새 판을 벌이기보다 그 판을 단단히 하는 쪽이 남는 구간입니다.' };
    } else if (마지막샘 && nowY - 마지막샘.해 <= 2) {
      현재 = { 판: '공백', 말: 마지막샘.해 + '년(만 ' + 마지막샘.나이 + '살) 무렵 한 차례 새어 나간 뒤입니다. 회복의 구간이니 조급해하지 마세요 — 조용히 다시 쌓는 시간이고, 다음 벌리는 해가 언제인지가 그래서 중요합니다.' };
    } else if (올해.점수 >= 56) 현재 = { 판: '벌이', 말: '지금은 벌이가 만들어지는 구간입니다. 큰돈이 꽂히는 해라기보다, 일이 돈이 되는 길이 놓이는 해 — 여기서 깐 판이 다음 재성 해에 돈이 됩니다.' };
    else 현재 = { 판: '조용', 말: '지금은 재물 기운이 조용한 구간입니다. 무리해서 벌이를 벌이기보다 쌓고 배우는 쪽이 남습니다 — 조용한 해에 쌓은 것이 열리는 해에 밑천이 됩니다.' };
    현재.점수 = 올해.점수; 현재.이유 = 올해.이유;
    try {
      const nowM = (now || new Date()).getMonth() + 1;
      const 이달 = 재물월점수(R, nowY, nowM);
      if (이달 && 이달.점수 >= 56 && 현재.판 === '조용') {
        현재.판 = '벌이';
        현재.말 = '해 전체로는 잔잔한 구간인데, 바로 이번 달(' + 이달.간지 + ')' + 조(이달.간지,'은','는') + ' 다릅니다 — '
          + (이달.이유[0] || '돈이 도는 달') + '. 이번 달 안의 기회는 해 핑계로 흘려보내지 마세요.';
        현재.이유 = 이달.이유;
      }
    } catch (e) {}

    // 미래
    const 미래 = [];
    for (let y = nowY + 1; y <= nowY + 6; y++) {
      const r = 재물해점수(R, y);
      if (r) { r.나이 = y - birthY; 미래.push(r); }
    }
    const 첫열림 = 미래.filter(r => r.점수 >= 56)[0] || 미래.slice().sort((x, y2) => y2.점수 - x.점수)[0];
    const 지킬해 = 미래.filter(r => r.샘);
    if (첫열림) {
      try {
        const rows = [];
        for (let m = 1; m <= 12; m++) { const r = 재물월점수(R, 첫열림.해, m); if (r) rows.push(r); }
        const pk = 절정달(rows);
        if (pk) 첫열림.달 = pk.말;
      } catch (e) {}
    }

    return { 강약: a.strength, 과거: 찍은과거, 샌해, 현재, 미래, 첫열림, 지킬해, 시작나이: 20 };
  }

  /** 재물 미래 드릴 — 열리는 해의 열두 달과, 열린 달의 날들. */
  function wealthDrill(R, year) {
    const rows = [];
    for (let m = 1; m <= 12; m++) { const r = 재물월점수(R, year, m); if (r) rows.push(r); }
    const 열림 = rows.filter(r => r.점수 >= 56).map(r => r.월);
    const 날들 = {};
    열림.slice(0, 3).forEach(m => { 날들[m] = 재물날들(R, year, m).좋은; });
    const 조용 = rows.slice().sort((a, b) => a.점수 - b.점수)[0];
    return { rows, 열림, 날들, 조용 };
  }

  /** 재물 진단 — 재성이 원국에서 어떤 형편인가. 「왜 시기인가」의 근거. */
  function wealthWhy(R) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds], db = p.day.branch;
    const W = E.NATAL_WEIGHT;
    const 재오행 = (de + 2) % 5;
    const slots = [['year', p.year.stem], ['month', p.month.stem]];
    if (p.hour) slots.push(['hour', p.hour.stem]);
    const 투 = slots.filter(x => E.STEM_ELEM[x[1]] === 재오행);
    const 겁재투 = slots.some(x => E.TEN_GODS[E.tenGod(ds, x[1])] === '겁재');
    const 자리 = [[p.year.branch, W.yearBranch], [p.month.branch, W.monthBranch],
                  [p.day.branch, W.dayBranch]];
    if (p.hour) 자리.push([p.hour.branch, W.hourBranch]);
    const branches = [p.year.branch, p.month.branch, db].concat(p.hour ? [p.hour.branch] : []);
    const 암 = branches.some(b => (E.HIDDEN[b] || []).some(st => E.STEM_ELEM[st] === 재오행));
    const 합거 = E.natalHap(p);

    let 말;
    if (투.length) {
      const k = 투[0][0], st = 투[0][1];
      if (합거[k]) {
        말 = ['돈의 글자(재성)이 원국에 떠 있는데, 다른 글자와 합으로 묶여 있습니다.',
              '내 돈인데 내 마음대로 안 되는 형국입니다 — 벌어도 어딘가에 걸려 있기 쉽습니다.',
              '이 묶임을 흔드는 운이 오는 해에 풀립니다. 그래서 공주님께는 「언제」가 액수보다 먼저입니다.'];
      } else if (E.stemPower(st, 자리) === 0) {
        말 = ['돈의 글자(재성)이 하늘에 떠 있는데, 뿌리가 없습니다.',
              '뿌리 없는 재물은 스쳐 지나갑니다 — 들어온 것 같은데 남지 않았던 이유가 여기 있습니다.',
              '이 글자에 뿌리가 들어오는 해 — 그때가 쥐는 해입니다. 그 해를 알아야 합니다.'];
      } else {
        말 = ['돈의 글자(재성)이 하늘에 떠서 뿌리까지 내리고 있습니다. 버는 힘은 갖춘 사주입니다.',
              '이런 사주의 물음은 「버느냐」가 아니라 「언제 크게 벌리고 언제 지키느냐」입니다.',
              '벌리는 해와 새는 해가 갈리는 지점을 미리 아는 것 — 그것이 이 사주의 요령입니다.'];
      }
    } else if (암) {
      // 암장 해석문(「티가 안 난다」류)은 뺐다(2026-08-29 결재: 「그럴 수도 있고 아닐
      // 수도 있어. 암장까지 따지면 끝도 없다」). 잰 사실과 「언제」만 말한다 — 제22조.
      말 = ['돈의 글자(재성)이 하늘에는 없고 지지 속에 숨어 있습니다.',
            '이 글자가 하늘에 뜨는 해에 벌립니다. 그 해를 놓치지 않는 것이 이 사주의 전부입니다.'];
    } else {
      말 = ['원국에 돈의 글자(재성)이 없습니다. 결핍이 아닙니다 — 운이 벌이를 데려오는 구조라는 뜻입니다.',
            '평소에는 잔잔하다가, 재성이 운에서 들어오는 해에 몰아서 벌립니다. 그때 벌어 둔 것이 다음 파도까지의 양식입니다.',
            '그래서 이 사주는 「언제」가 사실상 전부입니다.'];
    }
    if (겁재투) 말.push('한 가지 더 — 나눠 갖는 손(겁재)가 원국 하늘에 떠 있습니다. 벌리는 해에는 그 손도 같이 옵니다. 새는 해를 아는 것이 버는 해를 아는 것만큼 중요합니다.');
    return { 말 };
  }

  // ── 서술 자료집 — LLM에게 원국 전부를 넘긴다 ──
  //
  // 「책사의 말」이 애매했던 원인: 엔진이 넘기던 것이 「4월 · 재성이 옵니다」 같은
  // 라벨 조각뿐이라, LLM이 원국도 대운도 격국도 모른 채 살을 붙였다.
  // 엔진은 그보다 백 배를 안다 — 사주 여덟 글자, 강약 수치, 오행 분포, 빈 오행,
  // 격국 성패, 조후 용신, 대운 맥락. 전부 묶어서 넘기면 서술이 뿌리를 갖는다.
  // 여기 있는 값은 전부 엔진 실측이다 — LLM은 이 밖을 말할 수 없다.
  // 십신 하나하나의 뜻과 삶에서의 생김새 — 엔진의 1을 10으로 펼치는 표.
  // 화면(GOD_FLOW)보다 길게 쓴다: LLM이 이걸 100으로 펼칠 재료다.
  /** 십신 사전에서 뜻풀이까지만 떼어 온다. 뒤 문장은 돈·일 상황 경고라
   *  사랑처럼 다른 자리에 그대로 옮기면 겁주기가 된다(2026-08-30). */
  function 뜻머리(t) {
    const p = String(t || '').split('. ');
    return p.slice(0, 2).join('. ').replace(/\.?$/, '.');
  }

  /** 「공주님은 양의 기운을 타고난 남성입니다」 — 성별을 안 알려주신 분께는
   *  단정하면 안 되는 말이다(배너로는 모른다고 해 놓고 본문이 단정했다).
   *  기운은 일간에서 잰 사실이라 그대로 두고, 성별만 뗀다. */
  function 기운말(R, 남, 양) {
    const 모름 = !!(R && R.input && R.input.genderUnknown);
    const 기 = 양 ? '양(陽)' : '음(陰)';
    if (모름) return '공주님은 ' + 기 + '의 기운을 타고나셨습니다';
    return '공주님은 ' + 기 + '의 기운을 타고난 ' + (남 ? '남성' : '여성') + '입니다';
  }

  const GOD_MEANING = {
    비견: '나와 같은 기운. 자존심·독립·또래를 뜻한다. 이 기운의 시기는 내 것을 세우는 때라, 연애나 동업에서는 내 몫 주장이 세져 부딪히기 쉽고, 혼자 힘으로 뭔가를 이루고 싶어진다',
    겁재: '나와 같은 오행의 다른 얼굴. 경쟁·지출·나눠 가짐을 뜻한다. 사람은 모이는데 돈이 새고, 같은 것을 놓고 겨루게 되기 쉽다. 동업·보증·큰 지출을 조심해야 하는 기운이다',
    식신: '내가 낳는 기운. 표현·여유·의식주·즐거움을 뜻한다. 즐기면서 하면 돌아오는 쪽이라, 만남에서는 편안한 웃음이 되고 돈에서는 일이 밥이 되는 길목이 된다',
    상관: '튀는 표현. 재능·말·파격을 뜻한다. 매력과 끼가 살아나지만 말이 앞서 윗사람·격식과 부딪히기 쉽다. 보여주는 일에는 좋고, 참아야 하는 일에는 나쁘다',
    편재: '움직이는 재물. 기회·활동·유통을 뜻한다. 앉아서 오는 게 아니라 나가야 잡히는 돈이고, 남성에게는 인연의 글자이기도 하다. 발이 넓어지고 판이 커지는 기운',
    정재: '차곡차곡 모으는 재물. 실속·관리·성실을 뜻한다. 지키는 돈이고 오래 보는 인연이다. 화려하진 않아도 남는 것이 있는 기운',
    편관: '나를 강하게 누르는 힘. 시련·단련·권위를 뜻한다. 감당하면 실력과 자리가 되고, 못 감당하면 압박과 소모가 된다. 여성에게는 강한 남성의 글자이기도 하다',
    정관: '나를 반듯하게 누르는 힘. 질서·직장·명예를 뜻한다. 인정받는 자리·공식적인 관계에 좋고, 여성에게는 남편의 글자다',
    편인: '제 방식의 근거. 비스듬한 배움 — 정문 아닌 옆문을 알되 편법과 불법의 차이를 아는 감각이다. 직관·궁리·혼자만의 시간. 안으로 파고드는 기운이라 공부·기획에는 좋고, 밖으로 벌이는 일에는 발이 무거워진다',
    정인: '공인된 근거. 바른 배움과 보살핌 — 학위·자격·문서·어른의 도움처럼 제도가 인정하는 받침을 뜻한다. 받는 쪽이라 기댈 곳이 생기고, 소개나 추천 같은 다리가 힘을 쓴다',
  };
  const 강약뜻 = {
    신약: '일간을 돕는 기운이 적다는 뜻. 모자란 게 아니라 밖에서 채워지는 구조다 — 좋은 사람과 좋은 때를 만나면 남보다 크게 가고, 혼자 소모전을 하면 빨리 지친다. 그래서 이 사주는 「때」를 아는 것이 힘의 절반이다',
    신강: '일간을 돕는 기운이 많다는 뜻. 힘이 안에 고이는 구조라, 내보낼 곳(일·표현·활동)이 있어야 풀리고 웅크리면 답답해진다',
    중화: '치우침이 적다는 뜻. 운이 좋으면 좋은 대로, 눌리면 눌리는 대로 운을 비교적 그대로 탄다. 그래서 달력이 곧 지침이 된다',
  };

  function dossier(R, when) {
    const p = R.pillars, a = R.analysis || E.strengthOf(p), ds = p.day.stem;
    const 신 = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const gz = (x) => E.fmt.pillar(x);
    const d = {};
    d.사주 = [gz(p.year), gz(p.month), gz(p.day)].concat(p.hour ? [gz(p.hour)] : []).join(' ');
    d.일간 = E.STEMS[ds] + '(' + E.STEMS_KO[ds] + ') · ' + E.ELEM[E.STEM_ELEM[ds]] + ' 일간 — 이 사람 자신을 나타내는 글자';
    d.강약 = a.strength + (a.strengthScore != null ? ' ' + a.strengthScore : '')
      + (a.gotMonth ? ' · 득령(태어난 계절이 나를 돕는다)' : ' · 실령(태어난 계절이 나를 돕지 않아, 힘을 계절 밖에서 얻어야 한다)')
      + ' — ' + (강약뜻[a.strength] || '');
    d.오행분포 = E.ELEM.map((e, i) => e + (a.elemCount ? a.elemCount[i] : '?')).join(' ')
      + ' — 여덟 글자가 어떤 재료로 이루어졌는가';
    if (a.missing && a.missing.length) d.빈오행 = a.missing.join('·')
      + ' — 원국에 아예 없는 재료. 평생 얇은 고리라, 이 기운이 운에서 들어오는 때가 유난히 크게 느껴진다';
    if (a.yongCandidates && a.yongCandidates.length) d.채워야할오행 = a.yongCandidates.join('·')
      + ' — 이 기운이 오는 때에 힘이 돌고, 이 기운을 가진 사람이 곁에 오면 편해진다';
    const 노릇 = (st, 자리말) => {
      const g = 신(st);
      return g + ' ' + E.STEMS[st] + ' — ' + 자리말 + '. ' + (GOD_MEANING[g] || '');
    };
    d.천간의노릇 = {
      연간: 노릇(p.year.stem, '이른 시기·집안·바깥에서 크게 보이는 자리'),
      월간: 노릇(p.month.stem, '청년기·사회생활의 자리, 가장 힘있는 자리'),
    };
    if (p.hour) d.천간의노릇.시간 = 노릇(p.hour.stem, '말년·내밀한 자리, 그리고 늘 곁에 두는 것');
    d.배우자자리 = '일지 ' + E.BRANCHES[p.day.branch] + '(' + E.BRANCHES_KO[p.day.branch]
      + ') — 배우자가 앉는 자리이자 내 속마음의 방. 운의 글자가 이 자리와 합하면 곁이 채워지고, 치면 흔들린다';
    try {
      const J = gyeok(R);
      if (J && J.격) {
        const L = global.ChaeksaGyeok && global.ChaeksaGyeok.LABEL && global.ChaeksaGyeok.LABEL[J.판정];
        d.격국 = { 격: J.격, 판정: (L && L.짧게) || J.판정 };
        if (J.상신) d.격국.상신 = J.상신;
      }
    } catch (e) {}
    try {
      const g = global.ChaeksaClassic && global.ChaeksaClassic.gungtong(R);
      if (g && g.need) d.조후 = { 계절의약: g.need + (g.aux ? ' · 보좌 ' + g.aux : ''),
        형편: g.hasMain ? '주용신이 하늘에 떠 있음 — 계절이 필요로 하는 것을 갖춤'
             : (g.hasAux ? '보좌만 떠 있음' : '하늘에 없음 — 운에서 채워야 함') };
    } catch (e) {}
    try {
      const du = E.currentDaeun(R, when || new Date());
      if (du) {
        const g = 신(du.stem);
        d.대운 = { 간지: gz(du), 십신: g,
          구간: (du.startAge != null ? du.startAge + '~' + du.endAge + '세' : ''),
          뜻: '대운은 10년 단위의 큰 바탕이다. 지금 이 사람은 ' + g + '의 10년 위에 서 있다 — ' + (GOD_MEANING[g] || '') };
      }
    } catch (e) {}
    try {
      const y = (when || new Date()).getFullYear();
      const tf = E.dateFortune(y, 6, 15);
      const sg = 신(tf.year.stem);
      d.올해세운 = y + '년 ' + gz(tf.year) + ' — ' + sg + '의 해. ' + (GOD_MEANING[sg] || '');
    } catch (e) {}
    try {
      const 합 = E.natalHap(p);
      if (합 && Object.keys(합).length) d.합거 = '원국 천간합으로 명령을 잃은 자리 있음(' + Object.keys(합).join('·') + ')';
    } catch (e) {}
    return d;
  }

  // ── 어떤 사람이 나를 사랑하는가 — 뒤집기 한 번의 명리 ──
  //
  // 나를 배우자감으로 보는 사람 = 내 배우자성 오행을 일간으로 타고난 사람.
  // (여자를 재성으로 보는 남자 = 그녀의 관성 오행 일간 — 서로가 서로의 배우자성)
  // 그 오행의 두 천간 중 음양이 다른 쪽은 정(반듯하게 오래), 같은 쪽은 편(강렬하게).
  // 그리고 그중 한 글자는 반드시 내 일간과 합 — 서로 끌어당기는 짝이다.
  // 전부 원국에서 나오는 결정 — 지어낸 것 없음.
  // 천간 열 개의 인물상 — 오행 다섯으로 뭉개면 乙 사람과 甲 사람이 같은 사람이 된다.
  // 물상은 고전에서 합의된 영역이다(甲=큰나무, 乙=덩굴과 화초, 丙=태양…).
  const STEM_PERSON = {
    0: '큰 나무처럼 곧게 서는 사람입니다. 맏이 기질에 자존심이 세고, 굽히느니 부러지는 쪽 — 듬직한데 융통성은 아쉬울 수 있습니다.',
    1: '덩굴과 화초의 사람입니다. 부드럽고 사교적이며 어디서든 타고 오르는 생활력 — 유연한 대신 기댈 곳을 늘 찾습니다.',
    2: '태양의 사람입니다. 밝고 화끈하고 숨기는 게 없어 어디서나 눈에 띕니다 — 뒤끝은 없는데 감정 기복이 큽니다.',
    3: '촛불과 달빛의 사람입니다. 섬세하고 따뜻하며 한 사람을 오래 비추는 정 — 겉은 조용한데 속은 뜨겁습니다.',
    4: '산의 사람입니다. 묵직하고 신용을 지키며 좀처럼 안 움직입니다 — 믿음직한 대신 답답할 만큼 느릴 수 있습니다.',
    5: '밭의 사람입니다. 포용하고 길러내는 결로, 곁을 살뜰히 챙깁니다 — 다 받아주다 속병이 드는 쪽이기도 합니다.',
    6: '무쇠와 바위의 사람입니다. 맺고 끊음이 분명하고 의리로 움직입니다 — 강직한 대신 말이 칼이 되기도 합니다.',
    7: '보석과 바늘의 사람입니다. 예리하고 감각 있고 자기 관리가 철저합니다 — 세련된 대신 예민합니다.',
    8: '바다와 강의 사람입니다. 스케일이 크고 지혜롭고 잘 흘러갑니다 — 자유로운 대신 잡아두기 어렵습니다.',
    9: '이슬비와 샘물의 사람입니다. 여리고 총명하고 스며드는 정 — 조용히 깊어지는 대신 속을 잘 안 보입니다.',
  };

  /** 정(일간과 음양 다름)=안정형 · 편(같음)=불안형. 한 곳에서만 정한다 —
   *  다른 자리에 「안정형」을 박아 두었다가 같은 글자를 두 이름으로 부른 적이 있다. */
  function 형말(R, st) {
    try {
      const ds = R.pillars.day.stem;
      return (global.ChaeksaEngine.STEM_YANG[st] === global.ChaeksaEngine.STEM_YANG[ds])
        ? '불안형' : '안정형';
    } catch (e) { return ''; }
  }

  const 다가옴_정 = '요즘 말로 안정형의 끌림입니다 — 예의를 갖춰 천천히 다가옵니다. 오래 지켜보다가 확신이 서면 움직이는 쪽이라, 시작은 느려도 한번 곁에 서면 잘 안 떠납니다.';
  const 다가옴_편 = '요즘 말로 불안형의 끌림입니다 — 훅 들어옵니다. 재거나 돌려 말하지 않고, 강렬하게 끌리는 대로 움직이는 쪽이라 시작이 극적입니다. 설레는 만큼 온도 조절은 공주님 몫입니다.';

  function whoLovesMe(R) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds], db = p.day.branch;
    const 남 = ((R.input && R.input.gender) || 'M') === 'M';
    const 오행 = 남 ? (de + 2) % 5 : (de + 3) % 5;   // 그 사람의 일간 오행 = 내 배우자성 오행
    const 양간 = 오행 * 2, 음간 = 오행 * 2 + 1;
    const 내양 = E.STEM_YANG[ds] === 1;
    // 음양이 다르면 정(정관/정재 관계), 같으면 편
    const 정간 = 내양 ? 음간 : 양간;
    const 편간 = 내양 ? 양간 : 음간;
    const 합간 = (ds + 5) % 10;                       // 내 일간을 합으로 끌어당기는 글자
    const w = ELEM_PERSON[E.ELEM[오행]] || ['', '', []];

    // 그 글자가 내 원국 어디에 있는가 — 만나는 방식이 여기서 갈린다.
    const 자리이름 = { year: '연간(이른 시기·집안 쪽)', month: '월간(사회생활 자리)', hour: '시간(늘 곁에 두는 자리)' };
    const 지들0 = [p.year.branch, p.month.branch, db].concat(p.hour ? [p.hour.branch] : []);
    const 위치문 = (st) => {
      const 투 = [['year', p.year.stem], ['month', p.month.stem]].concat(p.hour ? [['hour', p.hour.stem]] : [])
        .find(x => x[1] === st);
      if (투) return '이 글자는 이미 공주님 원국 ' + 자리이름[투[0]] + '에 떠 있습니다 — 이런 사람이 벌써 삶에 들어와 있거나, 유난히 자주 만나집니다.';
      const 숨 = 지들0.find(b => (E.HIDDEN[b] || []).indexOf(st) >= 0);
      if (숨 !== undefined) return '이 글자는 공주님 지지 ' + E.BRANCHES[숨] + '(' + E.BRANCHES_KO[숨] + ') 속에 숨어 있습니다 — 가까운 곳에 이미 있는데 아직 알아보지 못했기 쉽습니다.';
      return '이 글자는 공주님 원국에 없습니다 — 운이 데려오는 사람입니다. 이 글자가 하늘에 뜨는 해에 만나기 쉽고, 그 해는 연애 스토리의 「열리는 해」와 같은 잣대로 짚습니다.';
    };
    const 원국간0 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : []);
    const 사람 = (st, 종류) => {
      const 채는손 = 원국간0.find(o => E.isHap(o, st) && E.STEM_ELEM[o] !== 오행);
      return {
        천간: E.STEMS[st] + '(' + E.STEMS_KO[st] + ')',
        종류,
        인물: STEM_PERSON[st] || '',
        다가옴: 종류 === '정' ? 다가옴_정 : 다가옴_편,
        위치: 위치문(st),
        합: st === 합간,
        가로채임: 채는손 !== undefined
          ? '다만 이 글자로 오는 인연은 공주님 원국의 ' + E.STEMS[채는손] + '(' + E.STEMS_KO[채는손] + ')' + 이가(E.STEMS_KO[채는손]) + ' 합으로 먼저 채가기 쉽습니다 — 스치기 쉬운 통로라, 이 사람일수록 빨리 잡아야 합니다.'
          : null,
      };
    };

    // 내 매력 — 그들이 나의 무엇에 걸리는가: 내 일간의 결 + 도화
    const 지들 = [p.year.branch, p.month.branch, db].concat(p.hour ? [p.hour.branch] : []);
    const 도화지 = [DOHWA[p.year.branch], DOHWA[db]];
    const 도화맞은 = 지들.filter(b => 도화지.indexOf(b) >= 0);
    const 도화 = 도화맞은.length > 0;
    const 도화글자 = 도화맞은.map(b => E.BRANCHES[b] + '(' + E.BRANCHES_KO[b] + ')').join('·');
    const 나의결 = ELEM_PERSON[E.ELEM[de]] || ['', ''];

    // 곁에 남는 재료 — 배우자궁(일지) 지장간: 그 방에 이미 놓인 글자들
    const 곁 = (E.HIDDEN[db] || []).map(st => ({
      천간: E.STEMS[st] + '(' + E.STEMS_KO[st] + ')',
      결: (ELEM_PERSON[E.ELEM[E.STEM_ELEM[st]]] || [''])[0],
    }));

    let 도착 = null;
    try { 도착 = inyeonWhy(R); } catch (e) {}

    // ── 진정한 사랑 — 다단 추론 ──
    // 배우자궁에 앉은 글자(지장간 본기)가 배우자의 일간이다. 그 글자를 합으로
    // 데려오는 방아쇠 천간이 하늘에 오는 해, 그 일간의 사람이 방으로 들어온다.
    // 丁卯: 궁본기 乙 → 방아쇠 庚(乙庚합) → 庚은 丁의 정재이기도 — 궁과 성이
    // 맞물린 사주라 이 사슬이 두 겹으로 조인다.
    let 진사랑 = null;
    try {
      const 궁본기 = (E.HIDDEN[db] || [])[0];
      if (궁본기 != null) {
        const 방아쇠 = (궁본기 + 5) % 10;
        const 방아쇠가성 = E.STEM_ELEM[방아쇠] === 오행;
        const 궁십신 = E.TEN_GODS[E.tenGod(ds, 궁본기)];
        const nowY = new Date().getFullYear();
        const 해들 = [];
        for (let y = nowY; y <= nowY + 8 && 해들.length < 3; y++) {
          try { if (E.dateFortune(y, 6, 15).year.stem === 방아쇠) 해들.push(y); } catch (e) {}
        }
        // 「乙목 일간」이 아니라 「乙목 기운」이다(사용자 교정 2026-08-30) —
        // 일간이 대표일 뿐, 丁壬이 합해 목으로 기우는 구조처럼 일간이 아니어도
        // 그 기운을 짙게 품는 사주가 있다. 化오행 합쌍은 다섯으로 정해져 있으니
        // (甲己토·乙庚금·丙辛수·丁壬목·戊癸화) 어느 쌍이 이 기운을 품는지 지목한다.
        // ※ 합화를 길흉 판정에 쓰는 게 아니라(엔진 원칙: 합화 제외) 기운의 결을
        //   말로 여는 것이다 — 판정이 아니라 서술.
        const e0 = E.STEM_ELEM[궁본기];
        const k = (e0 + 3) % 5;
        // 제16조 (회전문) — 합의 두 얼굴. 궁 글자가 지장간에만 있으면 방아쇠 성이
        // 올 때 명암합으로 방이 끌어당긴다(吉). 궁 글자가 천간에도 투출해 있으면
        // 방아쇠 성이 천간합으로 변질된다 — 들어왔다 나가는 회전문. 이때 진정한
        // 사랑은 회전문을 타지 않는 온전 통로 글자에서 온다. (승인대기 Q: 안정형
        // 글자의 구조 해법과 두 번 법칙의 시점 해법, 둘 다인가)
        const 궁투출 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : []).indexOf(궁본기) >= 0;
        let 지킴글자 = null;
        if (궁투출) {
          지킴글자 = [오행 * 2, 오행 * 2 + 1].find(st2 =>
            ![p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : []).some(o => E.isHap(o, st2) && E.STEM_ELEM[o] !== 오행));
        }
        const 둘째 = 궁투출 && 해들.length ? 두번충족(R, 해들[0], 방아쇠) : { 겹: false, 달들: [] };
        진사랑 = {
          회전문: 궁투출,
          대운겹: 둘째.겹,
          지킴글자: 지킴글자 != null ? E.STEMS[지킴글자] + '(' + E.STEMS_KO[지킴글자] + ')' : null,
          둘째달: 둘째.달들,
          궁: E.BRANCHES[db] + '(' + E.BRANCHES_KO[db] + ')',
          글자: E.STEMS[궁본기] + '(' + E.STEMS_KO[궁본기] + ')',
          기운말: E.STEMS[궁본기] + E.ELEM[e0] + '의 기운',
          기운풀이: '가장 또렷한 것은 ' + E.STEMS[궁본기] + ' 일간의 사람이지만, 일간이 아니어도 이 기운이 짙은 사주가 있습니다 — 이를테면 '
            + E.STEMS[k] + '(' + E.STEMS_KO[k] + ')과 ' + E.STEMS[k + 5] + '(' + E.STEMS_KO[k + 5]
            + ')을 나란히 가져 합으로 ' + E.ELEM[e0] + '의 기운에 기운 구조도 같습니다.',
          인물: STEM_PERSON[궁본기] || '',
          // 사전의 앞 두 마디(무엇인가 + 무엇을 뜻하는가)까지만 쓴다.
          // 뒤에 붙은 상황 경고는 돈·일 이야기라, 사랑 자리에 오면 겁주기가 된다.
          십신: 궁십신, 십신뜻: 뜻머리(GOD_MEANING[궁십신]),
          방아쇠글자: E.STEMS[방아쇠] + '(' + E.STEMS_KO[방아쇠] + ')',
          맞물림: 방아쇠가성,
          해들,
        };
      }
    } catch (e) {}

    return {
      진사랑,
      오행: E.ELEM[오행], 결이름: w[0], 결설명: w[1],
      정: 사람(정간, '정'), 편: 사람(편간, '편'),
      합간: E.STEMS[합간] + '(' + E.STEMS_KO[합간] + ')',
      // 합이 배우자성과 겹치는 건 음간 여자·양간 남자뿐이다(합 쌍 = 양간과 그 정재).
      // 양간 여자·음간 남자의 합 글자는 배우자성 밖 — 별도의 「끌림」으로 말해야 정직하다.
      합별도: 합간 !== 정간 && 합간 !== 편간,
      합이정인가: 합간 === 정간,
      매력: { 결: 나의결[0], 설명: 나의결[1], 도화, 도화글자: 도화 ? 도화글자 : null },
      곁, 도착상태: 도착 && 도착.상태, 도착말: 도착 ? 도착.말 : [],
      배우자궁: E.BRANCHES[db] + '(' + E.BRANCHES_KO[db] + ')',
    };
  }

  // ── 판단서(reading) — 병목의 근원을 자르는 층 ──
  //
  // 이번에 겪은 병목 아홉 개(낱장 상태·월-일 모순·달-달 단절·화면과 AI 사실의
  // 어긋남…)의 뿌리는 하나였다: 화면마다 계산기에서 조각을 직접 뽑아 조립했고,
  // 「한 사람에 대한 하나의 판단」이 어디에도 없었다. 조각이 n개면 어긋날 자리는
  // n²개라, 어긋남을 쌍마다 기워야 했다.
  //
  // 그래서 이 층이 있다. 사주당 한 번, 통독해서 판단서를 만든다 — 상태의 누적,
  // 달 사이의 이음, 위 층이 아래 층을 다스리는 규율까지 **여기서** 정해진다.
  // 화면과 AI 는 판단서의 조각을 그릴 뿐, 스스로 판단하지 않는다.
  // 두 번 조립이 사라지므로 화면과 AI 가 어긋날 길 자체가 없다.

  const 이음_연애 = {
    'shake>open': '앞 달의 흔들림으로 비워진 곁이 이 달에 채워집니다 — 정리 뒤에 오는 만남이라 더 단단합니다.',
    'open>shake': '앞 달에 가까워졌을수록 이 달은 말을 아끼세요 — 채워진 곁이 흔들리는 순서로 옵니다.',
    'quiet>open': '조용히 고여 있던 기운이 이 달에 열립니다 — 준비하고 있던 사람에게 먼저 옵니다.',
    'open>open': '앞 달의 흐름이 그대로 이어집니다 — 시작된 것이 깊어지는 달입니다.',
    'shake>quiet': '흔들림이 지나가고 가라앉는 달입니다 — 애쓰지 않아도 됩니다.',
    'open>quiet': '앞 달에 시작된 것이 있다면, 이 달은 그것을 익히는 시간입니다.',
  };
  const 이음_재물 = {
    'leak>open': '앞 달에 새어 나간 것을 이 달의 벌이가 메웁니다.',
    'open>leak': '앞 달에 벌어들인 것에 이 달 나누자는 손이 붙습니다 — 번 것을 지키는 달로 쓰세요.',
    'open>open': '벌이의 흐름이 이어집니다 — 판을 키워도 받쳐 주는 연속입니다.',
    'quiet>open': '고요히 준비된 것이 이 달에 돈이 되기 시작합니다.',
    'leak>quiet': '샜던 자리가 아물어 가는 달입니다 — 조급해하지 마세요.',
    'open>quiet': '앞 달의 벌이를 정리해 앉히는 달입니다.',
  };
  function 시진묶음글(좋은, 월) {
    const 무리 = {};
    좋은.forEach(d => {
      if (!d.시진 || !d.시진.length) return;
      const k = d.시진.join('·');
      (무리[k] = 무리[k] || []).push(월 + '/' + d.일);
    });
    return Object.keys(무리).map(k => ({ 시진: k, 날들: 무리[k] }));
  }

  // ── 결론 사슬 — 웹사이트와 채팅의 격차를 닫는 층 ──
  //
  // 채팅의 내가 매번 손으로 잇던 추론(「乙이 庚을 채간다 → 辛 통로가 온전하다 →
  // 辛이 오는 해는 2031 → 그 해가 진짜다」)을 엔진이 직접 계산해 문장으로 내놓는다.
  // LLM에게 원자(낱 사실)만 주면 사슬을 스스로 만들다 흐려진다 — 사슬째 준다.
  /** 그 해가 올해면 남은 달수를 덧붙인다. 지나간 해를 앞일처럼 말하지 않기 위해서다.
   *  절기가 아니라 달력 기준이다 — 「남은 달」은 공주님이 달력으로 세시는 값이라야 한다. */
  function 올해면(해목록, now) {
    const y = now.getFullYear();
    if ((해목록 || []).indexOf(y) < 0) return '';
    // getMonth() 는 0~11 이라 12 - getMonth() 는 늘 1 이상이었다 — 방어가 한 번도
    // 안 돌았다. 12월이면 남은 달이 없다고 말해야 한다(2026-08-30).
    const 남 = 11 - now.getMonth();
    if (남 <= 0) return ' 그 해가 바로 올해인데, 이제 한 달이 채 남지 않았습니다.';
    return ' 그 해가 바로 올해입니다 — ' + 남 + '달 남았습니다.';
  }

  function 인연결론(R, now) {
    now = now || new Date();
    const nowY = now.getFullYear();
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds], db = p.day.branch;
    const 남 = ((R.input && R.input.gender) || 'M') === 'M';
    const 오행 = 남 ? (de + 2) % 5 : (de + 3) % 5;
    const 이름 = 남 ? '재성' : '관성';
    const 원국간 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : []);
    const 문 = [];

    // 앞으로 8년을 미리 재 둔다 — 결론은 해와 이어져야 결론이다
    const rows = [];
    for (let y = nowY; y <= nowY + 8; y++) {
      try { const r = 연애해점수(R, y, 오행, 이름); if (r) rows.push(r); } catch (e) {}
    }
    const 해들 = (pred) => rows.filter(pred).map(r => r.해);

    // 1) 통로 결론 — 온전한 글자와 막힌 글자, 각각이 오는 해까지
    [오행 * 2, 오행 * 2 + 1].forEach(st => {
      const 손 = 원국간.find(o => E.isHap(o, st) && E.STEM_ELEM[o] !== 오행);
      const 그글자해 = 해들(r => r.세부 && r.세부.세간 === st);
      // 정(음양 다름)=안정형, 편(음양 같음)=불안형 — 요즘 말로 붙여야 읽힌다 (사용자 교정)
      const 형 = (E.STEM_YANG[st] === E.STEM_YANG[ds]) ? '불안형' : '안정형';
      if (손 !== undefined) {
        if (그글자해.length) {
          const 둘째 = 두번충족(R, 그글자해[0], st);
          문.push('막힌 통로 — ' + E.STEMS[st] + '(' + E.STEMS_KO[st] + '·' + 형 + ')으로 오는 인연은 원국의 '
            + E.STEMS[손] + '(' + E.STEMS_KO[손] + ')' + 이가(E.STEMS_KO[손]) + ' 합으로 먼저 채갑니다. 그 글자가 오는 '
            + 그글자해.join('·') + '년은 스치기 쉬운 해입니다'
            + (둘째.겹 ? ' — 다만 ' + 그글자해[0] + '년은 대운 하늘에 이미 ' + E.STEMS[st]
              + 조(E.STEMS[st], '이', '가') + ' 떠 있어, 세운의 ' + E.STEMS[st] + '만으로 두 번이 찹니다. 첫 글자는 소모되고 둘째 글자가 들어오는, 해 전체가 뚫리는 해입니다.'
            : 둘째.달들.length ? ' — 다만 두 번 겹치면 뚫립니다. ' + 그글자해[0] + '년의 ' + 둘째.달들.join('·')
              + '월은 월간에 ' + E.STEMS[st] + 조(E.STEMS[st],'이','가') + ' 한 번 더 떠서, 첫 글자는 소모되고 둘째 글자가 들어옵니다.' : '.'));
        }
      } else if (그글자해.length) {
        문.push('온전한 통로 — ' + E.STEMS[st] + '(' + E.STEMS_KO[st] + '·' + 형 + ')으로 오는 인연은 아무도 채가지 못합니다. 그 글자가 하늘에 오는 '
          + 그글자해.join('·') + '년이 공주님의 진짜 해입니다.'
          + 올해면(그글자해, now));
      }
    });
    // 2) 합거 해방 결론
    const 해방해 = 해들(r => r.세부 && r.세부.합거해방);
    if (해방해.length) 문.push('묶임이 풀리는 해 — 원국의 ' + 이름 + '은 합으로 묶여 있지만, '
      + 해방해.join('·') + '년에는 하늘이 새 글자를 직접 데려옵니다. 묶임과 무관하게 움직이는 해입니다.');
    // 3) 혼잡 정화 결론
    const 정화 = rows.find(r => r.세부 && r.세부.혼잡정화);
    if (정화) 문.push('맑아지는 해 — 겹쳐 있던 ' + 이름 + ' 중 ' + E.STEMS[정화.세부.혼잡정화.걷힘]
      + '이 걷히고 ' + E.STEMS[정화.세부.혼잡정화.남음] + '만 남는 ' + 정화.해 + '년이 매듭짓기 좋은 때입니다.');
    // 4) 삼합 완성 결론 — 가장 큰 응기
    const 삼합해 = 해들(r => r.세부 && r.세부.삼합완성);
    if (삼합해.length) 문.push('가장 큰 응기 — ' + 삼합해.join('·') + '년에는 대운과 세운이 공주님의 배우자 자리('
      + E.BRANCHES[db] + ')' + 조(E.BRANCHES[db], '과', '와') + ' 삼합 한 벌을 완성합니다. 고전이 꼽는 혼인의 해입니다.');
    // 4.5) 진정한 사랑 결론 — 배우자궁에 앉은 글자와 그를 데려오는 방아쇠
    try {
      const 궁본기 = (E.HIDDEN[db] || [])[0];
      if (궁본기 != null) {
        const 방아쇠 = (궁본기 + 5) % 10;
        const 방아쇠해 = [];
        for (let y = nowY; y <= nowY + 8 && 방아쇠해.length < 2; y++) {
          try { if (E.dateFortune(y, 6, 15).year.stem === 방아쇠) 방아쇠해.push(y); } catch (e) {}
        }
        const 맞물림 = E.STEM_ELEM[방아쇠] === 오행;
        const e0 = E.STEM_ELEM[궁본기], k0 = (e0 + 3) % 5;
        const 궁투출 = 원국간.indexOf(궁본기) >= 0;
        if (!궁투출) {
          문.push('배우자 방의 결론 — 공주님의 배우자 자리 ' + E.BRANCHES[db] + '에 앉은 글자는 '
            + E.STEMS[궁본기] + '(' + E.STEMS_KO[궁본기] + '). 진정한 사랑은 ' + E.STEMS[궁본기]
            + E.ELEM[e0] + '의 기운을 짙게 지닌 사람이기 쉽습니다 — ' + E.STEMS[궁본기]
            + ' 일간이 대표지만, ' + E.STEMS[k0] + '·' + E.STEMS[k0 + 5] + 조(E.STEMS[k0 + 5],'을','를') + ' 나란히 가져 합으로 '
            + E.ELEM[e0] + '에 기운 사주도 같습니다. 그 글자를 합으로 데려오는 방아쇠는 '
            + E.STEMS[방아쇠] + (맞물림 ? ' — 공주님의 ' + 이름 + '이기도 해서 궁과 성이 맞물린 사주입니다' : '')
            + (방아쇠해.length ? '. ' + 방아쇠해.join('·') + '년에 그 사람이 방으로 들어오기 쉽습니다.' : '.'));
        } else {
          // 회전문(제16조) — 궁 글자가 천간에도 떠서, 방아쇠 성이 오면 천간합으로 변질된다
          const 지킴 = [오행 * 2, 오행 * 2 + 1].find(st2 =>
            !원국간.some(o => E.isHap(o, st2) && E.STEM_ELEM[o] !== 오행));
          const 둘째 = 방아쇠해.length ? 두번충족(R, 방아쇠해[0], 방아쇠) : { 겹: false, 달들: [] };
          문.push('배우자 방의 결론 — 방에 앉은 ' + E.STEMS[궁본기] + '(' + E.STEMS_KO[궁본기]
            + ')' + 조(E.STEMS_KO[궁본기], '이', '가') + ' 하늘에도 떠 있는 사주입니다. 그래서 ' + E.STEMS[방아쇠] + '(' + E.STEMS_KO[방아쇠]
            + ')의 사람이 방에 들어오려 하면 하늘의 ' + E.STEMS[궁본기]
            + 조(E.STEMS[궁본기], '과', '와') + ' 합해 변질됩니다 — 들어왔다 나가고, 나갔다 들어오는 회전문. 인연이 자리를 못 잡던 구조적 이유입니다.'
            + (지킴 != null ? ' 이 회전문을 타지 않는 유일한 글자는 ' + E.STEMS[지킴] + '(' + E.STEMS_KO[지킴]
              + '·' + 형말(R, 지킴) + ') — 그 통로가 방을 끝내 지킵니다.' : '')
            + (방아쇠해.length && 둘째.겹 ? ' 그리고 ' + 방아쇠해[0] + '년은 대운 하늘에 이미 ' + E.STEMS[방아쇠]
              + 조(E.STEMS[방아쇠], '이', '가') + ' 떠 있어 세운만으로 두 번이 찹니다 — 해 전체가 방아쇠를 당기는 해입니다.'
            : 방아쇠해.length && 둘째.달들.length ? ' 그리고 ' + E.STEMS[방아쇠] + 조(E.STEMS[방아쇠],'이','가') + ' 굳이 들어온다면 두 번 겹쳐야 합니다. '
              + 방아쇠해[0] + '년 중에서도 월간에 ' + E.STEMS[방아쇠] + 조(E.STEMS[방아쇠],'이','가') + ' 한 번 더 뜨는 달이 ' + 둘째.달들.join('·')
              + '월입니다. 첫 글자는 원국이 합으로 소모하고, 둘째 글자가 방아쇠를 당깁니다.' : ''));
        }
      }
    } catch (e) {}
    // 4.7) 꺼진 등의 결론 (제20조 B안) — 궁에서 절·묘인 성의 스위치를 짚는다
    try {
      const 내양3 = E.STEM_YANG[ds] === 1;
      for (const st20 of [내양3 ? 오행 * 2 + 1 : 오행 * 2, 내양3 ? 오행 * 2 : 오행 * 2 + 1]) {
        const 궁u = E.unseong(st20, db);
        if (궁u !== '절' && 궁u !== '묘') continue;
        let jb = null; for (let b = 0; b < 12; b++) if (E.unseong(st20, b) === '장생') { jb = b; break; }
        if (jb == null) continue;
        const 켜지는해 = [];
        for (let y = nowY; y <= nowY + 8 && 켜지는해.length < 2; y++) {
          try { if (E.dateFortune(y, 6, 15).year.branch === jb) 켜지는해.push(y); } catch (e) {}
        }
        let 대운글 = '';
        try {
          const du2 = E.currentDaeun(R, now);
          if (du2 && du2.branch === jb) 대운글 = ' 지금 대운의 땅이 바로 ' + E.BRANCHES[jb] + ' — 등이 켜져 있는 10년 위에 계십니다.';
        } catch (e) {}
        문.push('꺼진 등의 결론 — ' + E.STEMS[st20] + '(' + E.STEMS_KO[st20] + ')' + 조(E.STEMS_KO[st20], '은', '는') + ' 배우자 방 ' + E.BRANCHES[db]
          + '에서 ' + 궁u + '. 쓸 만한 사람이 오래 머물지 않는다고 느끼셨다면 맞게 느끼신 것이고, 스위치는 '
          + E.BRANCHES[jb] + '(장생지)입니다.' + 대운글
          + (켜지는해.length ? ' 세운으로는 ' + 켜지는해.join('·') + '년에 땅으로 옵니다.' : ''));
        break;
      }
    } catch (e) {}
    // (궁충 숨구멍은 제23조 충 배제로 걷어냈다)
    return 문;
  }

  /** 재물 결론 — 같은 사슬을 돈으로. */
  function 재물결론(R, now) {
    now = now || new Date();
    const nowY = now.getFullYear();
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds];
    const 재오행 = (de + 2) % 5;
    const 원국간 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : []);
    const 문 = [];
    const rows = [];
    for (let y = nowY; y <= nowY + 8; y++) {
      try { const r = 재물해점수(R, y); if (r) rows.push(r); } catch (e) {}
    }
    [재오행 * 2, 재오행 * 2 + 1].forEach(st => {
      const 손 = 원국간.find(o => E.isHap(o, st) && E.STEM_ELEM[o] !== 재오행);
      const 그글자해 = rows.filter(r => r.세부 && r.세부.세간 === st).map(r => r.해);
      if (손 !== undefined) {
        if (그글자해.length) 문.push('막힌 통로 — ' + E.STEMS[st] + '(' + E.STEMS_KO[st] + ')으로 오는 돈은 원국의 '
          + E.STEMS[손] + '(' + E.STEMS_KO[손] + ')' + 이가(E.STEMS_KO[손]) + ' 합으로 먼저 채갑니다. ' + 그글자해.join('·')
          + '년의 벌이는 정산이 야박하기 쉬우니 계약서를 두껍게 쓰세요.');
      } else if (그글자해.length) {
        문.push('온전한 통로 — ' + E.STEMS[st] + '(' + E.STEMS_KO[st] + ')으로 오는 돈은 온전히 공주님 몫입니다. '
          + 그글자해.join('·') + '년이 벌리는 해입니다.');
      }
    });
    const 뺏김해 = rows.filter(r => r.세부 && (r.세부.뺏김 || r.세부.가로채임)).map(r => r.해);
    if (뺏김해.length) 문.push('지킬 해 — ' + 뺏김해.join('·') + '년에는 합의 손이 재성에 닿습니다. 동업·보증·빌려주기는 이 해들을 비켜 가세요.');
    return 문;
  }

  /** 두 번의 법칙(제17조) — 그 해 안에서 월간에 같은 글자가 한 번 더 뜨는 달.
   *  막힌 통로는 글자가 두 번 겹쳐야 뚫린다: 첫 글자는 원국 손이 합으로 소모하고,
   *  둘째 글자가 방아쇠를 당긴다. */
  function 두번달(y, st) {
    const out = [];
    for (let m = 1; m <= 12; m++) {
      try { if (E.dateFortune(y, m, 15).month.stem === st) out.push(m); } catch (e) {}
    }
    return out;
  }
  /** 제17조 개정(Q6 결재 2026-08-29): 대운 천간도 두 번 법칙의 「한 번」으로 센다.
   *  대운 하늘에 그 글자가 이미 떠 있으면, 세운의 글자만으로 두 번이 차서
   *  해 전체가 뚫리는 해가 된다 — 실전: 간명 #3의 2034 甲寅대운+甲세운. */
  function 두번충족(R, y, st) {
    let 겹 = false;
    try { const du = E.currentDaeun(R, new Date(y, 5, 15)); 겹 = !!(du && du.stem === st); } catch (e) {}
    return { 겹, 달들: 두번달(y, st) };
  }

  /** 간명서 재료 — 엔진이 잰 것 전부를 한 꾸러미로. AI는 이 밖을 말하지 못한다. */
  function 간명자료(R, now) {
    now = now || new Date();
    const L = reading(R, 'love', now), M = reading(R, 'money', now);
    const ms = 모습(R, now);
    let fc = null; try { fc = 첫확인(R, now); } catch (e) {}
    const 요약달 = rd => (rd.달들 || []).filter(m => m.열림).map(m => ({
      연: m.연, 월: m.월, 간지: m.간지, 이유: m.이유, 결: m.결,
      좋은날: (m.좋은날 || []).slice(0, 4).map(d => m.월 + '/' + d.일 + '(' + d.요일 + ')' + (d.왜 ? ' — ' + d.왜 : '')) }));
    const a = R.analysis;
    return {
      오늘: now.getFullYear() + '년 ' + (now.getMonth() + 1) + '월 ' + now.getDate() + '일',
      올해: now.getFullYear() + '년',
      사주: L.사주줄, 일간: E.STEMS[R.pillars.day.stem], 강약: a.strength + ' ' + a.strengthScore,
      오행분포: a.elemCount, 빈오행: a.missing,
      대운: (R.daeun && R.daeun.list || []).slice(0, 6).map(d => E.fmt.pillar(d) + ' 만' + d.startAge + '~' + d.endAge),
      겉속: ms.격차, 시기모습: { 과거: ms.과거, 현재: ms.현재 },
      인연진단: L.진단, 인연결론: L.결론, 재물진단: M.진단, 재물결론: M.결론,
      과거연대기: fc ? fc.연대기 : [],
      연애과거구간: (L.과거 || []).map(g => ({ 구간: g.시작 + '~' + g.끝, 나이: g.시작나이 + '~' + g.끝나이, 말: g.말, 이유: g.이유, 달: g.달 || null })),
      연애현재: L.현재, 재물현재: M.현재, 지킬해: M.지킬해, 샌해: M.샌해,
      열리는달_인연: 요약달(L), 열리는달_재물: 요약달(M),
      // ── 세 고전의 축 — 책사단이 각자 제 근거로 말하려면 각자의 계산이 있어야 한다 ──
      // 셋은 서로 다른 것을 보므로 실제로 갈린다(자평-적천 상관 −0.18).
      // 갈리는 것이 결함이 아니라 콘텐츠다 — 어디서 갈리는지가 곧 기준 공개다.
      자평진전: 자평재료(R),
      궁통보감: 조후재료(R),
      억부: 억부재료(R),
      천직: 천직재료(R),
      운로: 운로재료(R, now),
      궁위한방: (function () { try { return 첫확인(R, now).한방 || null; } catch (e) { return null; } })(),
    };
  }

  /** 억부의 축 — 무엇이 이 사람을 깎고 무엇이 채우는가 */
  function 억부재료(R) {
    try {
      const j = jichim(R); if (!j) return null;
      return {
        강약: j.강약,
        깎는것: (j.깎 || []).map(k => ({ 때: k[0], 풀이: k[1], 십신: k[2] })),
        채우는것: (j.채 || []).map(k => ({ 오행: k.오행, 말: k.말[0], 풀이: k.말[1] })),
        빈오행: (j.빈 || []).map(k => k.오행),
      };
    } catch (e) { return null; }
  }

  /** 천직의 축 — 타고난 결이 어느 쪽인가 (25유형) */
  function 천직재료(R) {
    try {
      const c = career(R, null); if (!c) return null;
      return { 축: c.group, 유형: c.name, 풀이: c.note || null,
               일들: String(c.jobs || '').slice(0, 90), 근거: (c.lines || []).slice(0, 3) };
    } catch (e) { return null; }
  }

  /** 운로의 축 — 대운이라는 무대가 어떻게 흘러가는가 */
  function 운로재료(R, now) {
    try {
      const l = lifeCurve(R, now); if (!l) return null;
      // 지금칸·최고칸을 함께 낸다. 「지남」만으로는 앞뒤를 못 가린다 —
      // curIdx 가 -1 이면(첫 대운 전이거나 마지막 대운도 지난 분) 지남도 false 라
      // 아홉 칸을 다 지난 분에게 「봉우리는 아직 앞입니다」가 나갔다(2026-08-31).
      // 봉우리가 정말 앞에 있는지는 최고칸 > 지금칸 으로만 말할 수 있다.
      return { 결: l.kind, 풀이: l.kindNote || null, 최고구간: l.peakTxt || null,
               지남: !!l.지남, 앞최고구간: l.앞최고Txt || null,
               지금칸: typeof l.curIdx === 'number' ? l.curIdx : -1,
               최고칸: typeof l.hi === 'number' ? l.hi : -1,
               근거: (l.lines || []).slice(0, 3) };
    } catch (e) { return null; }
  }

  /** 자평진전의 축 — 격이 섰는가 무너졌는가, 무엇이 받치고 무엇이 걸리는가 */
  function 자평재료(R) {
    try {
      const G = global.ChaeksaGyeok; if (!G) return null;
      const j = G.judge(R); if (!j || j.판정 === '미상') return null;
      const L = G.LABEL[j.판정] || {};
      return {
        격: j.격, 판정: j.판정, 판정말: L.짧게 || null, 풀이: L.풀어서 || null,
        상신: j.상신 || null,
        갖춤: j.근거.섰다 || [], 걸림: j.근거.띠었다 || [],
        받침: j.근거.구제 || [], 무너짐: j.근거.깨졌다 || [],
        힘: j.잰것 || null,
      };
    } catch (e) { return null; }
  }

  /** 궁통보감의 축 — 이 사람이 추운가 더운가, 무슨 글자가 있어야 사는가 */
  function 조후재료(R) {
    try {
      const C = global.ChaeksaClassic; if (!C || !C.gungtong) return null;
      const g = C.gungtong(R); if (!g) return null;
      return {
        필요한글자: g.need, 보조글자: g.aux || null, 하늘에뜬글자: g.cheon || null,
        주용신있나: !!g.hasMain, 보조있나: !!g.hasAux,
        기신: g.기신, 기신무리: !!g.기신무리, 기신글자: g.기신글자 || '', 사유: g.사유 || null,
      };
    } catch (e) { return null; }
  }

  /** kind: 'love' | 'wealth'. 사주 하나에 대한 단일 판단서. */
  function reading(R, kind, now) {
    now = now || new Date();
    const love = kind === 'love';
    const v = love ? loveStory(R, now) : moneyStory(R, now);
    if (!v) return null;
    const why = love ? inyeonWhy(R) : wealthWhy(R);
    const p = R.pillars;
    const 사주줄 = [p.year, p.month, p.day].concat(p.hour ? [p.hour] : []).map(x => E.fmt.pillar(x)).join(' ');

    // ── 다가오는 열두 달 — 상태·이음·규율까지 여기서 확정 ──
    const y0 = now.getFullYear(), mIdx = now.getMonth();
    const 연캐시 = {};
    const 달들 = [];
    for (let i = 1; i <= 12; i++) {
      const d = new Date(y0, mIdx + i, 1), yy = d.getFullYear(), mm = d.getMonth() + 1;
      if (!(yy in 연캐시)) {
        try { 연캐시[yy] = love ? inyeonMonths(R, yy) : wealthDrill(R, yy); }
        catch (e) { 연캐시[yy] = null; }
      }
      const r = 연캐시[yy] && 연캐시[yy].rows[mm - 1];
      if (!r) continue;
      let dd = { 좋은: [], 조심: [], 상대: false };
      try { dd = (love ? inyeonDays(R, yy, mm) : 재물날들(R, yy, mm)) || dd; } catch (e) {}
      const 상태 = r.점수 >= 56 ? 'open'
        : (love ? (r.이유.some(t => t.indexOf('흔들') >= 0) ? 'shake' : 'quiet')
                : (r.십신 === '겁재' ? 'leak' : 'quiet'));
      달들.push({ 연: yy, 월: mm, 간지: r.간지, 점수: r.점수, 십신: r.십신 || null,
                  이유: r.이유, 결: love ? r.결 : (GOD_MEANING[r.십신] || ''),
                  상태, 열림: 상태 === 'open',
                  좋은날: dd.좋은, 조심날: dd.조심, 상대: dd.상대,
                  시진무리: 상태 === 'open' ? 시진묶음글(dd.좋은, mm) : [] });
    }
    // 이음 — 달과 달을 잇는다
    const 표 = love ? 이음_연애 : 이음_재물;
    달들.forEach((m, i) => { if (i > 0) m.이음 = 표[달들[i - 1].상태 + '>' + m.상태] || null; });
    // 규율 — 위 층이 아래 층을 다스린다. 흔들/새는 달엔 날을 권하지 않는다.
    달들.forEach(m => {
      if (m.상태 === 'shake') {
        m.지침 = '이 달은 새 만남의 날을 고르는 달이 아닙니다 — 어긋난 것을 정리하고 마음을 정돈하는 데 쓰면 오히려 남는 달입니다. 피할 수 없는 약속이 있다면 비켜 갈 날만은 피하세요.';
        m.좋은날 = []; m.시진무리 = [];
      } else if (m.상태 === 'leak') {
        m.지침 = '이 달은 돈 걸린 날을 고르는 달이 아니라 지키는 달입니다 — 계약·동업·큰 지출은 다음 달로 미루는 것이 최선입니다.';
        m.좋은날 = []; m.시진무리 = [];
      }
    });
    // 검토수 — 원장과 화면 머리가 같은 숫자를 쓴다
    let 좋은합 = 0, 총일 = 0;
    달들.forEach(m => {
      총일 += new Date(m.연, m.월, 0).getDate();
      좋은합 += m.좋은날.filter(x => x.sc >= 3).length;
    });
    const 검토수 = 12 + 총일 + 좋은합 * 12;
    const 먼해 = (v.미래 || []).filter(r => r.점수 >= 70 && (love || !r.샘)).map(r => r.해);

    // ── 원장(로딩에 재생할 실제 계산 흔적)도 판단서가 만든다 ──
    const 남 = ((R.input && R.input.gender) || 'M') === 'M';
    const 원장 = {
      검토수,
      머리: love ? [
        '원국을 폅니다 — ' + 사주줄,
        '인연의 글자: ' + (남 ? '재성' : '관성') + ' · 배우자 자리: ' + E.BRANCHES[p.day.branch],
        '잣대를 겁니다 — 투출·통근·합거·도화·조후, 과거 연표를 짚은 그 자 그대로',
      ] : [
        '원국을 폅니다 — ' + 사주줄,
        '돈의 글자: 재성 · 새는 손: 겁재' + (v.강약 === '신약' ? ' · 신약이라 재성 가산을 줄여 잽니다' : ''),
        '잣대를 겁니다 — 재성 투출·식상·겁재·조후, 과거 연표를 짚은 그 자 그대로',
      ],
      달줄: 달들.map(m => ({
        표: m.상태 === 'open' ? '◉' : (m.상태 === 'shake' ? '△' : (m.상태 === 'leak' ? '✕' : '―')),
        말: m.연 + '.' + m.월 + ' ' + m.간지 + ' — ' + (m.이유[0] || (love ? '조용' : '잔잔')),
      })),
      꼬리: [
        총일 + '일을 하루씩 검토 — ' + (love ? '좋은 날 ' : '돈이 도는 날 ') + 좋은합 + ' · 조심할 날 ' + 달들.reduce((a, m) => a + m.조심날.length, 0),
        '시두법으로 좋은 날의 12시진 대조 — ' + (좋은합 * 12) + '개',
        '합 ' + 검토수.toLocaleString('ko-KR') + '가지 경우를 대조했습니다 — ' + (love ? '두루마리를 폅니다' : '장부를 폅니다'),
      ],
    };

    // ── AI 에게 줄 조각 — 화면과 같은 원천이라 어긋날 길이 없다 ──
    const 열두달AI = 달들.map(m => {
      const o = { 때: m.연 + '년 ' + m.월 + '월 ' + m.간지, 이유: m.이유, 결: m.결, 열림: m.열림 };
      if (m.이음) o.이음 = m.이음;
      if (m.지침) {
        o.지침 = m.지침 + ' 날 추천 금지.';
        if (m.조심날.length) o.비켜갈날 = m.조심날.map(x => m.월 + '/' + x.일);
      } else {
        if (m.좋은날.length) o[m.상대 ? '그달에서나은날' : '좋은날'] = m.좋은날.map(x => m.월 + '/' + x.일 + '(' + x.요일 + ')');
        if (m.조심날.length) o.조심할날 = m.조심날.map(x => m.월 + '/' + x.일);
      }
      return o;
    });

    let 결론 = [];
    try { 결론 = love ? 인연결론(R, now) : 재물결론(R, now); } catch (e) {}

    return { kind, 사주줄, 진단: why.말, 결론, 과거: v.과거, 흔들린해: v.흔들린해 || null,
             샌해: v.샌해 || null, 지킬해: v.지킬해 || null, 강약: v.강약 || null,
             현재: v.현재, 달들, 먼해, 검토수, 원장, 열두달AI,
             열린수: 달들.filter(m => m.열림).length,
             샘달들: 달들.filter(m => m.상태 === 'leak').map(m => m.월) };
  }

  // ── 모습 — 총평의 시기별 층. 있는 그대로만 말한다 ──
  //
  // 교정(2026-08-29): 「있는 그대로 얘기를 해 — 이것 또한 네가 지어내는 행위야」.
  // 처음엔 십신마다 「반장·모범생」 「아르바이트 병행」 같은 삶의 장면을 지어 붙였다.
  // 그건 엔진이 잰 게 아니라 내가 만든 콜드리딩이다. 화면 문장은 두 가지로만 조립한다:
  //   ① 엔진이 잰 사실 — 어느 글자가 어느 자리에 왔는가
  //   ② 승인된 사전 — GOD_MEANING (그 글자가 뜻하는 것)
  // 삶의 장면으로 옮기는 건 읽는 본인의 몫이다. 그래서 맞았을 때 신뢰가 선다.
  function 모습(R, now) {
    now = now || new Date();
    const p = R.pillars, ds = p.day.stem;
    const 나이 = now.getFullYear() - R.input.year;   // 만 근사 — 대운 구간 고르기엔 충분
    const 신 = st => E.TEN_GODS[E.tenGod(ds, st)];
    const 뜻 = (g, n) => (GOD_MEANING[g] || '').split('. ').slice(0, n).join('. ');
    // 겉 — 사회 자리(월주)의 하늘 글자. 속 — 일지 본기. 잰 사실 그대로.
    const 겉십 = 신(p.month.stem);
    const 속본 = E.HIDDEN[p.day.branch][0], 속십 = 신(속본);
    const 격차 = { 겉글자: E.STEMS[p.month.stem], 겉십신: 겉십, 겉뜻: 뜻(겉십, 1),
                   속글자: E.STEMS[속본], 속십신: 속십, 속뜻: 뜻(속십, 1),
                   다름: 겉십 !== 속십 };
    const list = (R.daeun && R.daeun.list) || [];
    const 지난 = list.filter(du => du.endAge < 나이).slice(-2);
    const 지금 = list.find(du => 나이 >= du.startAge && 나이 <= du.endAge) || null;
    const 짓기 = du => {
      const 천십 = 신(du.stem);
      const 지본 = E.HIDDEN[du.branch][0], 지십 = 신(지본);
      return { 구간: '만 ' + du.startAge + '~' + du.endAge + '살',
               간지: E.fmt.pillar(du),
               하늘: { 글자: E.STEMS[du.stem], 십신: 천십, 뜻: 뜻(천십, 2) },
               바탕: { 글자: E.BRANCHES[du.branch] + ' 속 ' + E.STEMS[지본], 십신: 지십, 뜻: 뜻(지십, 1) } };
    };
    return { 격차, 과거: 지난.map(짓기), 현재: 지금 ? 짓기(지금) : null };
  }

  // ── 첫확인 — 입력 직후 첫 3초에 던지는 한 방 ──
  //
  // 순서 설계(2026-08-29 사용자 확정): 랜딩→로그인→입력까지는 그대로,
  // 그 다음은 총평 벽이 아니라 「과거의 가장 센 한 해」를 질문 하나로 던진다.
  // 본인 손으로 [맞습니다]를 누르는 순간 자기설득이 걸린다.
  // (「우리는 적중률이 쌓인다」라 적었었다 — 2026-08-30, 집계를 안 하기로 해 지웠다.
  //  누르는 값어치는 공주님 쪽에 있지 우리 쪽에 있지 않다.)
  //
  // 서술 규칙 — 사건년 양방향(2026-08-29 교정 「헤어질 수도 만날 수도, 벌 수도
  // 잃을 수도 — 변질되는 자리」): 글자의 움직임은 「어느 축이 언제 움직였나」까지만
  // 확정한다. 방향은 법이 주는 경우(가로채임=뺏김, 합거=잃음)에만 말한다.
  function 첫확인(R, now) {
    now = now || new Date();
    const p = R.pillars, ds = p.day.stem, db = p.day.branch;
    const 태어난해 = R.input.year, 올해 = now.getFullYear();
    const 나이 = y => y - 태어난해;
    const 궁본기 = E.HIDDEN[db][0];
    const 겁재간 = (ds % 2 === 0) ? ds + 1 : ds - 1;   // 같은 오행 다른 극성
    const 겁재떠 = ['year', 'month', 'hour'].some(k => p[k] && p[k].stem === 겁재간);
    const 재오행 = (E.STEM_ELEM[ds] + 2) % 5;
    const 사건들 = [];
    for (let y = 태어난해 + 17; y < 올해; y++) {
      let tf; try { tf = E.dateFortune(y, 6, 15); } catch (e) { continue; }
      const ys = tf.year.stem, yb = tf.year.branch, a = 나이(y);
      // 궁충 사건은 제23조로 배제 — 「솔로인데 충당하면 뭐가 달라지지?」 관측 대상이
      // 사주에 없어 단정 불가. 충의 간법을 배우면 그때 되살린다.
      // ② 궁 본기 투출 — 궁 속에만 있던 글자가 하늘로 나온 해
      if (ys === 궁본기) {
        const 합됨 = ['year', 'month', 'hour'].some(k => p[k] && ((p[k].stem + 5) % 10 === ys || (ys + 5) % 10 === p[k].stem));
        사건들.push({ 해: y, 나이: a, 점수: 합됨 ? 9 : 8, 축: '관계',
          문장: '인연의 축이 크게 돌지 않았습니까 — 시작이었든, 굳었든, 틀어졌든.',
          근거: '배우자 방에만 있던 글자 ' + 간말(ys) + 이가(E.STEMS_KO[ys]) + ' 이 해 겉으로 드러났습니다' + (합됨 ? ' — 그리고 공주님 원국의 글자가 바로 합으로 잡았습니다' : '') + '.' });
      }
      // ③ 가로채임 — 방향을 말할 수 있는 유일한 자리 (법이 방향을 준다)
      if (겁재떠 && (ys + 5) % 10 === 겁재간 && E.STEM_ELEM[ys] === 재오행)
        사건들.push({ 해: y, 나이: a, 점수: 9, 축: '재물',
          문장: '다 잡은 줄 알았던 것이 옆으로 새지 않았습니까 — 마음이든 돈이든.',
          근거: '돈의 글자 ' + 간말(ys) + 이가(E.STEMS_KO[ys]) + ' 온 해인데, 원국에 떠 있는 ' + 간말(겁재간) + '(겁재)가 먼저 합으로 데려갔습니다. 여기만은 방향이 글자에 적혀 있습니다 — 내 몫이 남에게 가는 해였습니다.' });
      // ④ 시주 복음 — 태어난 시의 간지가 그대로 돌아온 해
      if (p.hour && ys === p.hour.stem && yb === p.hour.branch)
        사건들.push({ 해: y, 나이: a, 점수: 7, 축: '자리',
          문장: '유난히 조용하지 않은 해 아니었습니까 — 들어왔든 나갔든.',
          근거: '태어난 시의 두 글자(' + E.STEMS[ys] + E.BRANCHES[yb] + ')' + 조(E.BRANCHES[yb],'이','가') + ' 이 해 그대로 다시 왔습니다.' });
      // ⑤-1 정관 일간합 — 소속·책임의 축이 몸에 직접 닿은 해 (잡혔든 놓았든)
      if (((ys + 5) % 10 === ds || (ds + 5) % 10 === ys) && E.TEN_GODS[E.tenGod(ds, ys)] === '정관')
        사건들.push({ 해: y, 나이: a, 점수: 8, 축: '자리',
          문장: '소속이나 책임이 크게 움직이지 않았습니까 — 잡혔든(이직·승진·혼담), 놓았든(퇴사·정리).',
          근거: '소속의 글자 ' + E.STEMS[ys] + '(정관)이 이 해 공주님 일간과 직접 합했습니다. 방향은 단정하지 않습니다.' });
      // ⑤ 재성 투출 + 지지 뿌리 — 재의 축 전체가 움직인 해
      if (E.STEM_ELEM[ys] === 재오행 && E.BRANCH_ELEM[yb] === 재오행)
        사건들.push({ 해: y, 나이: a, 점수: 6, 축: '재물',
          문장: '돈이나 인연 쪽이 크게 움직이지 않았습니까 — 만났든 헤어졌든, 벌었든 잃었든.',
          근거: '돈의 글자 ' + 간말(ys) + 이가(E.STEMS_KO[ys]) + ' 뿌리(' + E.BRANCHES[yb] + ')까지 갖추고 온 해입니다. 늘었는지 나갔는지는 공주님이 아십니다.' });
    }
    if (!사건들.length) return null;
    // 질문들 — 축당 가장 센 하나씩, 센 순서로 최대 3문. 총알이 하나면 빗나갈 때
    // 회복이 없다. 셋 중 둘이면 「용하다」가 되고, 셋 다 빗나가면 그것대로 정직하게 간다.
    const 축별 = {};
    사건들.forEach(e => { const k = e.축 || '기타';
      if (!축별[k] || 축별[k].점수 < e.점수 || (축별[k].점수 === e.점수 && 축별[k].해 < e.해)) 축별[k] = e; });
    const 질문들 = Object.values(축별).sort((a, b) => b.점수 - a.점수 || b.해 - a.해).slice(0, 3);
    const 한방 = 질문들[0];
    // 연대기: 해 순서, 한 해 하나(최고점만), 최대 6개
    const by = {};
    사건들.forEach(e => { if (!by[e.해] || by[e.해].점수 < e.점수) by[e.해] = e; });
    const 연대기 = Object.values(by).sort((a, b) => a.해 - b.해).slice(-6);
    return { 한방, 질문들, 연대기 };
  }

  // ── 왜 공주님은 결제해야 하는가 — 엔진의 근거로 만드는 그 사람만의 이유 ──
  //
  // 해상도(달·날·시)는 상품의 겉모양이고, 지갑이 열리는 건 「내 사주가 이런 구조라서
  // 시기가 전부다」라는 **자기만의 이유**를 봤을 때다. 그 이유를 지어내지 않는다 —
  // 엔진이 이미 재 놓은 것(투출·합거·통근·암장·격국 성패·강약)에서 꺼낸다.
  // 관통 원칙 그대로: 천간은 명령, 뿌리 없으면 0, 합거는 명령 없음.
  //
  // 톤: 겁주지 않는다. 「없다」는 결핍이 아니라 「운이 데려오는 구조」다.
  // 모든 진단이 「그래서 언제인지가 중요하다」로 닫혀야 결제의 의미가 선다.

  /** 인연 — 배우자성이 원국에서 어떤 형편인가. 이것이 「왜 시기인가」의 근거다. */
  function inyeonWhy(R) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds], db = p.day.branch;
    const W = E.NATAL_WEIGHT;
    const 남 = ((R.input && R.input.gender) || 'M') === 'M';
    const 오행 = 남 ? (de + 2) % 5 : (de + 3) % 5;
    const 이름 = 남 ? '재성' : '관성';
    const 글자 = '인연의 글자(' + 이름 + ')';

    const slots = [['year', p.year.stem], ['month', p.month.stem]];
    if (p.hour) slots.push(['hour', p.hour.stem]);
    const 투 = slots.filter(x => E.STEM_ELEM[x[1]] === 오행);

    const 자리 = [[p.year.branch, W.yearBranch], [p.month.branch, W.monthBranch],
                  [p.day.branch, W.dayBranch]];
    if (p.hour) 자리.push([p.hour.branch, W.hourBranch]);
    const branches = [p.year.branch, p.month.branch, db].concat(p.hour ? [p.hour.branch] : []);
    const 암 = branches.some(b => (E.HIDDEN[b] || []).some(st => E.STEM_ELEM[st] === 오행));
    // 원국 궁충 언급은 제23조로 배제 (「원국이 충이면 남자가 못 들어오나?」)
    const 합거 = E.natalHap(p);

    let 상태, 말;
    if (투.length) {
      const k = 투[0][0], st = 투[0][1];
      if (합거[k]) {
        상태 = '합거';
        말 = [글자 + 조(이름,'이','가') + ' 원국 하늘에 떠 있는데, 다른 글자와 합으로 묶여 있습니다.',
              '묶인 글자는 제 노릇을 못 합니다 — 인연이 곁을 지나가도 내 것으로 매듭이 잘 안 지어지는 형국입니다.',
              '이건 흠이 아니라 시계입니다. 이 묶임을 흔드는 운이 오는 해에 몰아서 움직입니다. 그래서 공주님께는 「언제」가 남들보다 훨씬 무겁습니다.'];
      } else if (E.stemPower(st, 자리) === 0) {
        상태 = '무근';
        말 = [글자 + 조(이름,'은','는') + ' 하늘에 떠 있는데, 지지에 뿌리가 없습니다.',
              '뿌리 없는 글자는 시작은 만들어도 오래 잇지 못합니다 — 만남은 있는데 매듭이 안 지어졌던 이유가 여기 있습니다.',
              '이 글자에 뿌리가 되어 주는 운이 들어오는 해 — 그때가 진짜입니다. 그래서 해와 달을 골라야 합니다.'];
      } else {
        상태 = '유근';
        말 = [글자 + 조(이름,'이','가') + ' 하늘에 떠서 뿌리까지 내리고 있습니다. 인연의 힘 자체는 갖춘 사주입니다.',
              '이런 사주의 물음은 「오느냐」가 아니라 「어느 것을 잡아 언제 매듭짓느냐」입니다.',
              '글자가 겹치거나 배우자 자리가 움직이는 해에 갈림길이 옵니다 — 그 해와 달을 미리 아는 것이 이 사주의 요령입니다.'];
      }
    } else if (암) {
      상태 = '암장';
      말 = [글자 + 조(이름,'이','가') + ' 하늘에는 없고 지지 속에 숨어 있습니다.',
            '숨은 글자는 밖으로 드러나질 않아서, 좋은 사람이 곁에 있어도 잘 안 보이고 잘 안 잡힙니다.',
            '이 글자가 하늘에 뜨는 해 — 그때 비로소 보이고 잡힙니다. 그래서 공주님께는 「언제」를 아는 것이 곧 「누구」를 아는 것입니다.'];
    } else {
      상태 = '무';
      말 = ['원국에 ' + 글자 + 조(이름,'이','가') + ' 없습니다. 결핍이 아닙니다 — 운이 데려오는 구조라는 뜻입니다.',
            '평소에는 조용하다가, 그 글자가 운에서 들어오는 해에 몰아서 옵니다. 놓치면 다음 파도까지 다시 조용합니다.',
            '그래서 이 사주는 「언제」가 사실상 전부입니다.'];
    }

    // ── 제19조 접착제 이론 (승인 2026-08-30) — 사분면 구조가 진단의 머리에 선다 ──
    // 접착제 내장: 음간 여성(정관과 일간합)·양간 남성(정재와 일간합) — 붙드는 힘을
    // 타고남. 단 비견이 곁에 있으면 같은 상대와 쟁합(양간 남성들이 무리지어
    // 헌팅 가는 구조가 이것이다 — 같은 글자는 같은 상대와 합한다).
    // 접착제 없음: 양간 여성(정관→식신·편관→겁재)·음간 남성(정재→편인·편재→겁재)
    // — 채가는 손이 통로마다 예약, 회전문·두 번 법칙이 상시 작동.
    // 유도·전수 검증: 열 일간 예외 0 (docs/19_법전.md 제19조).
    {
      const 양 = E.STEM_YANG[ds] === 1;
      const 접착 = (남 && 양) || (!남 && !양);
      const 사분면 = [];
      if (접착) {
        const 합상대 = (ds + 5) % 10;
        사분면.push('먼저 구조 하나 — ' + 기운말(R, 남, 남) + '. '
          + (남 ? '아내의 글자 ' : '남편의 글자 ') + E.STEMS[합상대] + '(' + E.STEMS_KO[합상대]
          + ')' + 조(E.STEMS_KO[합상대], '이', '가') + ' 오면 공주님의 일간이 먼저 손을 내밀어 맞잡습니다 — 인연을 제 손으로 붙드는 힘을 타고난 쪽입니다.');
        const 비견투출 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : []).indexOf(ds) >= 0;
        // 조언 꼬리(「모임에서 시작된 인연일수록 빨리 매듭지으세요」)는 뺐다(2026-08-29
        // 결재: 「그럴 수도 있고 아닐 수도 있어」). 제19조가 주는 사실까지만 말한다.
        if (비견투출) 사분면.push('다만 원국에 나와 같은 글자(비견)이 떠 있습니다 — 같은 글자는 같은 상대와 합합니다. 친구와 같은 사람 앞에 서게 되는 쟁합의 그림입니다.');
      } else {
        const 내양 = 양;
        const 정간2 = 내양 ? 오행 * 2 + 1 : 오행 * 2;
        const 편간2 = 내양 ? 오행 * 2 : 오행 * 2 + 1;
        const 손정 = (정간2 + 5) % 10, 손편 = (편간2 + 5) % 10;
        const 신 = (st) => E.TEN_GODS[E.tenGod(ds, st)];
        사분면.push('먼저 구조 하나 — ' + 기운말(R, 남, !남) + '. '
          + 이름 + '의 글자와 일간이 손을 맞잡는 합이 아닌 사주 — 인연이 와도 붙드는 손이 따로 없는 쪽입니다. 게다가 '
          + E.STEMS[정간2] + '(안정형)은 ' + E.STEMS[손정] + '(' + 신(손정) + ')' + 조(신(손정), '이', '가') + ', '
          + E.STEMS[편간2] + '(불안형)은 ' + E.STEMS[손편] + '(' + 신(손편)
          + ')' + 조(신(손편), '이', '가') + ' 채가는 손으로 미리 정해져 있습니다 — 인연이 오래 머물기 어렵던 구조적 이유입니다. 그래서 공주님께는 회전문을 피하는 글자와, 두 번 겹치는 때를 아는 것이 남보다 중요합니다.');
      }
      말 = 사분면.concat(말);
    }
    // 가로채임 구조 — 운으로 오는 배우자성을 원국 글자가 합으로 선점하는 사주.
    // 丙이 뜬 丁일간 남명은 辛(편재) 운이 올 때마다 丙辛합으로 뺏긴다 — 연애가
    // 힘들었던 구조적 이유. 다만 丙은 庚(정재)을 못 채가므로, 어느 글자의 인연이
    // 온전한지까지 갈라 말할 수 있다. 이것이 이 진단의 값어치다.
    {
      const 원국간 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : []);
      const 성글자들 = [오행 * 2, 오행 * 2 + 1];
      const 막힘 = [], 온전 = [];
      성글자들.forEach(st => {
        const 손 = 원국간.find(o => E.isHap(o, st) && E.STEM_ELEM[o] !== 오행);
        if (손 !== undefined) 막힘.push({ 성: st, 손 });
        else 온전.push(st);
      });
      if (막힘.length) {
        const m = 막힘[0];
        말.push('그리고 무거운 것 하나 — 원국에 ' + E.STEMS[m.손] + '(' + E.STEMS_KO[m.손] + ')' + 이가(E.STEMS_KO[m.손]) + ' 떠 있어, '
          + E.STEMS[m.성] + '(' + E.STEMS_KO[m.성] + ')으로 오는 인연은 그 글자가 합으로 먼저 채갑니다. 좋은 사람이 와도 이상하게 내 것이 안 되던 이유가 여기 있습니다.'
          + (온전.length ? ' 대신 ' + 온전.map(st => E.STEMS[st] + '(' + E.STEMS_KO[st] + ')').join('·') + '으로 오는 인연은 온전히 공주님 몫입니다 — 그 글자의 해를 잡아야 합니다.'
                          : ' 두 글자가 모두 막혀 있어, 하늘보다 땅(지지)으로 스며드는 인연이 공주님의 길입니다.'));
      }
    }
    // ── 제20조 배우자성의 십이운성 (승인 2026-08-30 · B안) ──
    // 궁에서 절·묘인 성은 감점이 아니라 시계다. 「쓸 만한 사람이 안 온다」는
    // 본인의 체감을 맞다고 인정하고(적중), 켜지는 스위치(장생지)를 짚는다(희망).
    // 두 글자(정·편) 다 잰다 (Q9 확정).
    try {
      const 장생지 = (st) => { for (let b = 0; b < 12; b++) if (E.unseong(st, b) === '장생') return b; return null; };
      const 내양2 = E.STEM_YANG[ds] === 1;
      const 정간3 = 내양2 ? 오행 * 2 + 1 : 오행 * 2;
      const 편간3 = 내양2 ? 오행 * 2 : 오행 * 2 + 1;
      const 줄 = [];
      let 꺼진 = null;
      [[정간3, '안정형'], [편간3, '불안형']].forEach(x => {
        const st = x[0], u = E.unseong(st, db);
        if ((u === '절' || u === '묘') && !꺼진) 꺼진 = { st, u };
        줄.push(E.STEMS[st] + '(' + x[1] + ')·' + u);
      });
      말.push('배우자 방(' + E.BRANCHES[db] + ')에서의 생명력 — ' + 줄.join(' / ') + '.');
      if (꺼진) {
        const jb = 장생지(꺼진.st);
        말.push(E.STEMS[꺼진.st] + '(' + E.STEMS_KO[꺼진.st] + ')은 공주님의 방에서 ' + 꺼진.u
          + ' — 꺼져 있는 등입니다. 쓸 만한 사람이 오래 머물지 않는다고 느껴 오셨다면, 맞게 느끼신 겁니다. 다만 결함이 아니라 스위치가 따로 있는 등입니다'
          + (jb != null ? ' — ' + E.BRANCHES[jb] + '(' + E.BRANCHES_KO[jb] + ')가 땅으로 오는 해와 대운에 이 등이 켜집니다.' : '.'));
      }
    } catch (e) {}
    return { 상태, 이름, 말 };
  }

  /** 두 사람 — 이 조합이 왜 날을 골라야 하는가. 십신 관계와 일지 관계에서 꺼낸다. */
  function coupleWhy(Rme, Ryou, nameA, nameB) {
    const dsA = Rme.pillars.day.stem, dsB = Ryou.pillars.day.stem;
    const dbA = Rme.pillars.day.branch, dbB = Ryou.pillars.day.branch;
    const GRP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성',
                  정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
    const g안 = GRP[E.TEN_GODS[E.tenGod(dsA, dsB)]];   // 나에게 상대는
    const g밖 = GRP[E.TEN_GODS[E.tenGod(dsB, dsA)]];   // 상대에게 나는
    const 말 = [];
    const 긴장 = g안 === '관성' || g밖 === '관성';
    const 소모 = g안 === '비겁' && g밖 === '비겁';
    if (긴장) 말.push('두 분은 한쪽이 한쪽을 누르는 힘이 섞여 있습니다. 나쁜 조합이 아니라 팽팽한 조합입니다 — 다만 기운이 눌리는 날에 만나면 그 팽팽함이 다툼으로 나옵니다. 그래서 이 조합은 날이 절반입니다.');
    else if (소모) 말.push('두 분은 같은 것을 놓고 나란히 서는 사이입니다. 편한 대신, 둘 다 지친 날에는 서로 기댈 데가 없어집니다. 둘 다 차 있는 날을 고르는 것이 요령입니다.');
    else 말.push('두 분은 한쪽이 한쪽을 살리는 힘이 있습니다. 바탕은 순한 조합이라, 좋은 날을 고르면 그 순함이 그대로 삽니다.');
    const rel = ((dbB - dbA + 12) % 12);
    const YUKHAP = { 0:1, 1:0, 2:11, 11:2, 3:10, 10:3, 4:9, 9:4, 5:8, 8:5, 6:7, 7:6 };
    if (YUKHAP[dbA] === dbB) 말.push('배우자 자리끼리는 합입니다 — 바탕이 붙어 있어 웬만한 날은 무난하게 흘러갑니다. 큰 날만 제대로 고르면 됩니다.');
    // 배우자 자리끼리의 충 서술을 걷었다 — 제23조가 「궁합(relation) 충 서술 전부」를
    // 이름으로 지목한 자리다. 겁준 자리에서 바로 결제를 권하는 화면이기도 했다.
    return { 말 };
  }

  /** 이번 달 — 이 사주가 왜 날을 골라야 하는가. 강약과 격국 성패에서 꺼낸다. */
  function monthWhy(R) {
    const a = R.analysis || E.strengthOf(R.pillars);
    const 말 = [];
    if (a.strength === '신약') 말.push('공주님 사주는 쓸 수 있는 힘이 정해져 있는 쪽입니다. 아무 날에나 벌이면 새고, 받쳐주는 날에 몰아치면 남습니다 — 그래서 날의 서열이 남들보다 값집니다.');
    else if (a.strength === '신강') 말.push('공주님 사주는 힘이 안에 고이는 쪽입니다. 내보낼 곳이 있는 날에 움직여야 풀리고, 고이는 날에 웅크리면 답답해집니다 — 그 날들을 갈라 드립니다.');
    else 말.push('공주님 사주는 치우침이 적어 그날 오는 기운을 그대로 탑니다 — 좋은 날은 좋게, 눌리는 날은 눌리게 옵니다. 그래서 달력이 곧 지침입니다.');
    try {
      const J = gyeok(R);
      if (J && (J.판정 === '깨졌다' || J.판정 === '구제됐다'))
        말.push('격국으로는 받쳐주는 글자가 아쉬운 사주라, 운이 받쳐주는 날을 디디는 것이 더 중요합니다. 그 날들을 표시해 뒀습니다.');
    } catch (e) {}
    return { 말 };
  }

  // ── 내 편이 되어주는 사람 ──
  // 계산은 용신 하나로 끝난다. 내가 필요로 하는 오행을 **일간으로 쓰는 사람**이
  // 곁에 있으면 그 기운이 채워진다. 「어떤 사람을 곁에 두면 좋은가」는
  // 여성향에서 오래 읽히는 주제인데 우리는 용신을 이미 내고 있었다.
  //
  // 겁주지 않는다. 「이 사람을 피하세요」가 아니라 「지금은 이런 결이 힘이 됩니다」다.
  // 사람은 오행 하나로 정해지지 않는다 — 그것도 화면에 적는다.
  // 넷째 칸은 「그 사람을 한 마디로 부르는 말」이다. 「자라는 결의 사람」처럼
  // 은유를 겹쳐 쓰면 문 앞 간판에서 뜻이 흐려진다 — 표를 두 벌 두지 않으려고
  // 여기에 같이 둔다(카드 본문은 [0], 배지·부제는 [3]).
  const ELEM_PERSON = {
    목: ['자라는 결', '먼저 벌이고 밀고 나가는 쪽입니다. 계획을 세우고 사람을 모읍니다',
         ['甲', '乙'], '밀어주는 사람'],
    화: ['밝히는 결', '드러내고 표현하는 쪽입니다. 곁에 있으면 분위기가 환해집니다',
         ['丙', '丁'], '환하게 해주는 사람'],
    토: ['받쳐주는 결', '중재하고 품는 쪽입니다. 흔들릴 때 자리를 지켜 줍니다',
         ['戊', '己'], '받쳐주는 사람'],
    금: ['정리하는 결', '끊고 맺는 쪽입니다. 어지러운 것을 갈라 세워 줍니다',
         ['庚', '辛'], '정리해주는 사람'],
    수: ['흐르게 하는 결', '궁리하고 이어주는 쪽입니다. 막힌 데를 돌아가게 합니다',
         ['壬', '癸'], '이어주는 사람'],
  };
  const GOD_LEAN = {
    비겁: '나란히 서서 같이 밀어주는 사이가 됩니다',
    식상: '내 말을 꺼내게 해주는 사이가 됩니다',
    재성: '현실을 챙겨 주는 사이가 됩니다',
    관성: '기댈 곳을 만들어 주는 사이가 됩니다',
    인성: '감싸주고 채워 주는 사이가 됩니다',
  };

  function naepyeon(R, when) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds];
    const a = R.analysis || E.strengthOf(p);
    const GRP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성',
                  정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
    const 용 = (a.yongCandidates || []).slice(0, 2);

    const 결 = 용.map(el => {
      const w = ELEM_PERSON[el] || ['―', '', []];
      // 그 오행을 일간으로 쓰는 사람은 나에게 무슨 십신인가
      const st = ['목','화','토','금','수'].indexOf(el) * 2;   // 양간
      const g = E.TEN_GODS[E.tenGod(ds, st)];
      return { 오행: el, 이름: w[0], 설명: w[1], 일간: w[2], 사람: w[3] || w[0],
               십신: g, 기울기: GOD_LEAN[GRP[g]] || '' };
    });

    // 지금 대운이 무엇을 데려오고 있는가 — 곁에 둘 사람도 때에 따라 다르다
    const du = E.currentDaeun(R, when || new Date());
    let 지금 = null;
    if (du) {
      const g = E.TEN_GODS[E.tenGod(ds, du.stem)];
      const grp = GRP[g];
      const 부족 = (a.missing || []);
      지금 = {
        간지: E.fmt.pillar(du), 십신: g, 결: grp,
        말: grp === '관성' ? '지금은 눌리는 때를 지나고 있습니다. 받쳐주는 사람이 특히 크게 옵니다'
          : grp === '재성' ? '지금은 밖으로 나가는 때입니다. 챙겨주는 사람보다 같이 뛰는 사람이 맞습니다'
          : grp === '인성' ? '지금은 안으로 들어가는 때입니다. 재촉하지 않는 사람이 편합니다'
          : grp === '식상' ? '지금은 풀어내는 때입니다. 들어주는 사람이 힘이 됩니다'
          : '지금은 사람이 모이는 때입니다. 곁이 넓어지기 쉽습니다',
        빈오행: 부족,
      };
    }
    return { 결, 지금, 강약: a.strength };
  }

  function drawNaepyeon(name, v) {
    const es = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const wrap = (t, n) => {
      const out = []; let cur = '';
      String(t).split(' ').forEach(w => {
        if ((cur + ' ' + w).trim().length <= (n || 24)) cur = (cur + ' ' + w).trim();
        else { out.push(cur); cur = w; }
      });
      if (cur) out.push(cur);
      return out.slice(0, 2);
    };
    let y = 176, body = '';
    v.결.forEach((k) => {
      body += '<text x="44" y="' + y + '" font-family="Noto Serif KR,serif" font-size="17" font-weight="700" fill="#3f5a44">'
        + es(k.이름) + ' <tspan font-size="12" font-weight="400" fill="#7d9484">' + es(k.오행)
        + ' · ' + es(k.일간.join('·')) + ' 일간</tspan></text>';
      y += 22;
      wrap(k.설명, 27).forEach(l => { body += '<text x="44" y="' + y + '" font-size="12.5" fill="#4c5a4e">' + es(l) + '</text>'; y += 18; });
      body += '<text x="44" y="' + y + '" font-size="12" fill="#7d9484">나에게는 ' + es(k.십신) + ' — ' + es(wrap(k.기울기, 30)[0] || '') + '</text>';
      y += 30;
    });
    const 지 = v.지금 ? wrap(v.지금.말, 27) : [];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">'
      + '<defs><linearGradient id="np" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#f4f8f3"/><stop offset="1" stop-color="#e2ece2"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="16" fill="url(#np)"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="11" fill="none" stroke="#c7d8c7" stroke-width="1"/>'
      + '<text x="180" y="52" text-anchor="middle" font-size="11.5" fill="#7d9484" letter-spacing="4">내 편이 되어주는 사람</text>'
      + '<text x="180" y="86" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="19" font-weight="700" fill="#2f4a36">'
      + es(name) + '님에게 힘이 되는 사람</text>'
      + '<line x1="44" y1="112" x2="316" y2="112" stroke="#cfdccf"/>'
      + '<text x="44" y="140" font-size="12" fill="#7d9484">지금 채워야 할 것 — '
      + es(v.결.map(k => k.오행).join(' · ')) + ' · ' + es(v.강약) + '</text>'
      + body
      + (지.length
        ? '<line x1="44" y1="' + Math.max(y, 420) + '" x2="316" y2="' + Math.max(y, 420) + '" stroke="#cfdccf"/>'
          + '<text x="44" y="' + (Math.max(y, 420) + 26) + '" font-size="11.5" fill="#7d9484">지금 대운 ' + es(v.지금.간지) + ' · ' + es(v.지금.십신) + '</text>'
          + 지.map((l, i) => '<text x="44" y="' + (Math.max(y, 420) + 48 + i * 18) + '" font-size="12.5" fill="#4c5a4e">' + es(l) + '</text>').join('')
        : '')
      + '<text x="180" y="516" text-anchor="middle" font-size="11" fill="#7d9484">사람은 오행 하나로 정해지지 않습니다</text>'
      + '<text x="180" y="532" text-anchor="middle" font-size="11" fill="#7d9484">피할 사람을 고르라는 계산이 아닙니다</text>'
      + '<text x="180" y="548" text-anchor="middle" font-size="10" fill="#a8bda8" letter-spacing="2">chaeksa.kr</text>'
      + '</svg>';
  }

  // ── 지칠 때와 채울 때 ──
  // 「나는 왜 이렇게 지칠까」는 여성향에서 크게 읽히는데 우리는 강약·용신·빈오행으로
  // 이미 답을 갖고 있었다. 겁주지 않는다 — 무엇이 나를 깎는지 말하고,
  // 반드시 무엇으로 채우는지를 같이 말한다. 깎는 말만 하고 끝내지 않는다.
  const DRAIN = {
    신약: [
      ['책임이 몰릴 때', '해내야 할 일이 겹치면 남보다 빨리 바닥납니다. 맡기 전에 한 번 덜어내세요', '관성'],
      ['챙길 것이 많을 때', '돈·살림·사람을 동시에 붙들면 손이 떨립니다. 순서를 정하면 견딜 만해집니다', '재성'],
    ],
    신강: [
      ['받기만 할 때', '보살핌만 받고 있으면 오히려 답답해집니다. 내보낼 곳이 있어야 풀립니다', '인성'],
      ['나눠야 할 때', '같은 것을 놓고 겨루게 되면 소모가 큽니다. 내 몫을 먼저 그어두세요', '비겁'],
    ],
    중화: [
      ['한쪽으로 오래 기울 때', '어느 쪽으로든 오래 치우치면 지칩니다. 원래 균형으로 버티는 쪽입니다', '치우침'],
    ],
  };
  const FILL = {
    목: ['새로 시작하는 것', '계획을 세우고 뭔가를 벌이면 힘이 돕니다. 화분 하나, 산책 한 번도 됩니다'],
    화: ['드러내는 것', '말하고 보여주면 풀립니다. 밝은 자리, 사람 만나는 자리가 약입니다'],
    토: ['자리를 지키는 것', '규칙적인 일과와 익숙한 자리가 힘이 됩니다. 정리하면 마음도 정리됩니다'],
    금: ['끊고 정리하는 것', '안 쓰는 것을 버리면 숨이 트입니다. 결정을 미루지 않는 쪽이 편합니다'],
    수: ['쉬고 궁리하는 것', '혼자 있는 시간, 그리고 물 가까운 곳에서 회복됩니다. 읽고 생각하는 데서 채워집니다'],
  };

  function jichim(R) {
    const a = R.analysis || E.strengthOf(R.pillars);
    const 깎 = DRAIN[a.strength] || DRAIN['중화'];
    const 채 = (a.yongCandidates || []).slice(0, 2).map(el => ({ 오행: el, 말: FILL[el] || ['―', ''] }));
    const 빈 = (a.missing || []).map(el => ({ 오행: el, 말: FILL[el] || ['―', ''] }));
    return { 강약: a.강약 || a.strength, 깎, 채, 빈 };
  }

  function drawJichim(name, v) {
    const es = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const wrap = (t, n) => {
      const out = []; let cur = '';
      String(t).split(' ').forEach(w => {
        if ((cur + ' ' + w).trim().length <= (n || 27)) cur = (cur + ' ' + w).trim();
        else { out.push(cur); cur = w; }
      });
      if (cur) out.push(cur);
      return out.slice(0, 2);
    };
    let y = 158, body = '';
    body += '<text x="44" y="' + y + '" font-size="11.5" fill="#9a8090" letter-spacing="2">이럴 때 지칩니다</text>'; y += 26;
    v.깎.forEach(d => {
      body += '<text x="44" y="' + y + '" font-family="Noto Serif KR,serif" font-size="15.5" font-weight="700" fill="#5a3a4a">' + es(d[0]) + '</text>'; y += 20;
      wrap(d[1]).forEach(l => { body += '<text x="44" y="' + y + '" font-size="12.5" fill="#6a5460">' + es(l) + '</text>'; y += 17; });
      y += 10;
    });
    y += 8;
    body += '<line x1="44" y1="' + y + '" x2="316" y2="' + y + '" stroke="#e2d2da"/>'; y += 28;
    body += '<text x="44" y="' + y + '" font-size="11.5" fill="#7d9484" letter-spacing="2">이것으로 채웁니다</text>'; y += 26;
    v.채.forEach(k => {
      body += '<text x="44" y="' + y + '" font-family="Noto Serif KR,serif" font-size="15.5" font-weight="700" fill="#2f4a36">'
        + es(k.말[0]) + ' <tspan font-size="11.5" font-weight="400" fill="#7d9484">' + es(k.오행) + '</tspan></text>'; y += 20;
      wrap(k.말[1]).forEach(l => { body += '<text x="44" y="' + y + '" font-size="12.5" fill="#4c5a4e">' + es(l) + '</text>'; y += 17; });
      y += 10;
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">'
      + '<defs><linearGradient id="jc" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#fbf5f7"/><stop offset="1" stop-color="#eff2ec"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="16" fill="url(#jc)"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="11" fill="none" stroke="#dccdd4" stroke-width="1"/>'
      + '<text x="180" y="52" text-anchor="middle" font-size="11.5" fill="#9a8090" letter-spacing="4">지칠 때와 채울 때</text>'
      + '<text x="180" y="86" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="19" font-weight="700" fill="#4a3240">'
      + es(name) + '님</text>'
      + '<text x="180" y="112" text-anchor="middle" font-size="12" fill="#9a8090">' + es(v.강약) + ' · 기운이 도는 때와 새는 때</text>'
      + body
      + (v.빈.length
        ? '<text x="44" y="500" font-size="11.5" fill="#9a8090">평생 얇은 고리 — ' + es(v.빈.map(b => b.오행).join('·'))
          + ' : ' + es(v.빈.map(b => b.말[0]).join(' · ')) + '</text>' : '')
      + '<text x="180" y="528" text-anchor="middle" font-size="11" fill="#9a8090">지치는 것은 약해서가 아니라 결이 그렇기 때문입니다</text>'
      + '<text x="180" y="546" text-anchor="middle" font-size="10" fill="#c0aab4" letter-spacing="2">chaeksa.kr</text>'
      + '</svg>';
  }

  const REL_WORD = {
    비견: ['나란히 선 사람', '편한데, 같은 것을 원할 때는 겨루게 됩니다'],
    겁재: ['같은 것을 바라보는 사람', '가까울수록 나눠야 합니다. 안 그러면 뺏기는 기분이 듭니다'],
    식신: ['마음이 놓이는 사람', '곁에 있으면 말이 술술 나오고, 나답게 있어도 됩니다'],
    상관: ['나를 자꾸 말하게 만드는 사람', '재미있습니다. 다만 오래 붙어 있으면 지치기도 합니다'],
    편재: ['손에 쥐고 싶어지는 사람', '설레는데 붙잡기는 어렵습니다. 쥐려 할수록 빠져나갑니다'],
    정재: ['아끼고 지키고 싶은 사람', '곁에 두면 안심이 됩니다. 오래 가는 쪽입니다'],
    편관: ['긴장하게 만드는 사람', '눈을 못 떼는데 편하지는 않습니다. 끌림과 부담이 같이 옵니다'],
    정관: ['기대게 되는 사람', '반듯해서 믿음이 갑니다. 답답할 때도 있지만 흔들리지 않습니다'],
    편인: ['생각이 많아지게 하는 사람', '깊이 들어가게 됩니다. 가끔 답답하고, 가끔 위로가 됩니다'],
    정인: ['나를 감싸주는 사람', '곁에 있으면 어리광이 나옵니다. 기대도 되는 사람입니다'],
  };

  function relation(Rme, Ryou, nameA, nameB, when) {
    const dsA = Rme.pillars.day.stem, dsB = Ryou.pillars.day.stem;
    const dbA = Rme.pillars.day.branch, dbB = Ryou.pillars.day.branch;
    const 신 = (from, to) => E.TEN_GODS[E.tenGod(from, to)];
    // 이름이 이미 「공주님」으로 끝나면 님을 또 붙이지 않는다 —
    // 이름을 안 적으신 분의 대체 이름이 「공주님」이라 흔하게 난다(2026-08-30).
    const 님 = (n) => (String(n).slice(-1) === '님' ? String(n) : String(n) + '님');

    // 서로에게 무엇인가 — 이 화면의 머리다
    const g1 = 신(dsA, dsB), g2 = 신(dsB, dsA);
    const 나에게 = { 십신: g1, 말: REL_WORD[g1] || ['―', ''] };
    const 그에게 = { 십신: g2, 말: REL_WORD[g2] || ['―', ''] };

    const YUKHAP = { 0:1, 1:0, 2:11, 11:2, 3:10, 10:3, 4:9, 9:4, 5:8, 8:5, 6:7, 7:6 };
    const SAM = [[8,0,4], [11,3,7], [2,6,10], [5,9,1]];
    const 충 = (a, b) => ((b - a + 12) % 12) === 6;

    // ── 이 사람이 「그 사람」인가 (2026-08-30) ──────────────
    // 혼자 볼 때는 이미 「진정한 사랑은 乙목의 결을 지닌 사람」이라고 말해 주면서,
    // 정작 그 사람 생일을 넣었을 때는 맞춰보지 않았다. 공주님이 생일을 넣는 이유가
    // 정확히 그것이다 — 「그래서 이 사람이 그 사람인가?」
    // 지위는 단정하지 않는다. 두 원국 사이에 흐르는 힘만 말한다.
    const 남A = ((Rme.input && Rme.input.gender) || 'M') === 'M';
    const deA = E.STEM_ELEM[dsA];
    const 배우자오행A = 남A ? (deA + 2) % 5 : (deA + 3) % 5;   // 남=재성 · 여=관성
    const 그글자오행 = E.STEM_ELEM[dsB];
    const 궁본기 = E.HIDDEN && E.HIDDEN[dbA] ? E.HIDDEN[dbA][0] : null;   // 배우자 방의 본기
    const 맞물림 = {
      배우자성: 그글자오행 === 배우자오행A,
      방글자: 궁본기 != null && E.STEM_ELEM[궁본기] === 그글자오행,
      성이름: 남A ? '재성' : '관성',
      방글자표기: 궁본기 != null ? E.STEMS[궁본기] + '(' + E.STEMS_KO[궁본기] + ')' : null,
    };

    // ── 신살 대조 — 이 화면에서만 쓴다(엔진 판정은 안 건드린다) ──
    const 신살 = [];
    {
      const pA = Rme.pillars, pB = Ryou.pillars;
      const 도A = [DOHWA[pA.year.branch], DOHWA[dbA]];
      const 도B = [DOHWA[pB.year.branch], DOHWA[dbB]];
      // 도화는 생왕/사절로 정반대다 — 원문 그대로 가른다.
      //   『三命通會』 論咸池: 如生旺則美容儀 / 如死絶落魄不檢 (docs/23)
      // 판정은 원문대로 하고, 화면 말은 우리가 짓는다. 조문은 판정의 근거이지
      // 화면의 문장이 아니다 — 원문의 「奸邪淫鄙」를 그대로 옮길 수는 없다.
      const 왕한자리 = { 장생: 1, 관대: 1, 건록: 1, 제왕: 1 };
      const 꺼진자리 = { 사: 1, 묘: 1, 절: 1, 쇠: 1, 병: 1 };
      // 원문을 곁에 둔다 — 판정마다 다른 구절이라야 증거가 된다.
      const 출전 = '『三命通會』 卷二 「論咸池」';
      const 도화말 = (주, 손, br, ds) => {
        let 층 = '', 원 = '一名敗神，一名桃花煞';
        try {
          const u = E.unseong(ds, br);
          if (왕한자리[u]) {
            층 = ' 그 자리가 왕해서, 사람이 모이고 그만큼 곁이 시끄러워지기도 합니다';
            원 = '如生旺則美容儀，躭酒色，踈財好歡';
          } else if (꺼진자리[u]) {
            층 = ' 다만 그 글자가 꺼져 있어, 끌어당기는 힘이 본인을 흔들기도 합니다';
            원 = '如死絶落魄不檢，言行狡詐';
          }
        } catch (e) {}
        return { 말: 님(손) + '이 ' + 님(주) + '의 도화 글자에 앉아 있습니다 — 유난히 눈에 띄는 쪽입니다.' + 층,
                 원문: 원, 출전: 출전 };
      };
      if (도A.indexOf(dbB) >= 0) { const x = 도화말(nameA, nameB, dbB, dsA); 신살.push({ 결: '도화', 말: x.말, 원문: x.원문, 출전: x.출전 }); }
      if (도B.indexOf(dbA) >= 0) { const x = 도화말(nameB, nameA, dbA, dsB); 신살.push({ 결: '도화', 말: x.말, 원문: x.원문, 출전: x.출전 }); }
      // 홍염 — 결(訣)의 첫 줄이 이 살의 뜻이다: 多情多欲少人知
      // 「정이 많고 바라는 것이 많은데 남들은 잘 모른다」. 뒷줄(眾人妻·作路妓)은 안 쓴다.
      // 甲乙은 결이 「午申」 둘인데 표에 午만 있었다 — 申을 함께 본다(docs/23).
      const 홍염지 = (ds) => (ds === 0 || ds === 1) ? [HONGYEOM[ds], 8] : [HONGYEOM[ds]];
      const 홍출전 = '홍염살 구결 (통용 판본 — 출전 미확정)';
      if (홍염지(dsA).indexOf(dbB) >= 0) 신살.push({ 결: '홍염',
        말: 님(nameB) + '의 글자가 ' + 님(nameA) + '의 홍염입니다 — 정이 많고 바라는 것도 많은데, 겉으로는 잘 안 드러나는 쪽입니다',
        원문: '多情多欲少人知', 출전: 홍출전 });
      if (홍염지(dsB).indexOf(dbA) >= 0) 신살.push({ 결: '홍염',
        말: 님(nameA) + '의 글자가 ' + 님(nameB) + '의 홍염입니다 — 그쪽이 속으로 많이 담아 두는 편입니다',
        원문: '多情多欲少人知', 출전: 홍출전 });
      if ((CHEONEUL[dsA] || []).indexOf(dbB) >= 0) 신살.push({ 결: '귀인', 말: 님(nameB) + '이 ' + 님(nameA) + '에게 천을귀인에 해당합니다 — 어려울 때 도움이 되는 쪽입니다' });
      if ((CHEONEUL[dsB] || []).indexOf(dbA) >= 0) 신살.push({ 결: '귀인', 말: 님(nameA) + '이 ' + 님(nameB) + '에게 천을귀인에 해당합니다 — 그쪽이 기대는 쪽입니다' });
      const 공A = gongmang(dsA, dbA);
      if (공A.indexOf(dbB) >= 0) 신살.push({ 결: '공망', 말: 님(nameB) + '의 글자가 ' + 님(nameA) + '의 공망에 듭니다 — 곁에 있어도 손에 안 잡히는 느낌이 들기 쉽습니다' });

      // 암합(명암합) — 겉으로는 안 보이는데 속으로 물린다.
      // 한쪽의 일간이 다른 쪽 일지의 지장간과 합하는 자리다.
      const 속A = (E.HIDDEN && E.HIDDEN[dbA]) || [], 속B = (E.HIDDEN && E.HIDDEN[dbB]) || [];
      if (속B.some(h => E.isHap(dsA, h))) {
        신살.push({ 결: '암합', 말: 님(nameA) + '의 글자가 ' + 님(nameB) + '의 숨은 글자와 몰래 물립니다 — 겉으로 드러나지 않는데 마음이 가는 쪽입니다' });
      }
      if (속A.some(h => E.isHap(dsB, h))) {
        신살.push({ 결: '암합', 말: 님(nameB) + '의 글자가 ' + 님(nameA) + '의 숨은 글자와 몰래 물립니다 — 그쪽이 티 안 내고 끌리는 편입니다' });
      }
    }

    // ── 조후 — 그 사람이 내 더위·추위를 풀어 주는가 ──────────
    // 채움(강약)과는 다른 축이다. 강약은 힘의 문제고 조후는 온도의 문제다.
    // 온서가 「뼈대보다 먼저 온도를 본다」고 하는 그 자리를 두 사람에게 맞대어 본다.
    let 온도 = null;
    try {
      const C = global.ChaeksaClassic;
      const gA = C && C.gungtong ? C.gungtong(Rme) : null;
      if (gA && gA.need) {
        const 필요 = gA.need;
        const 가짐 = [dsB, ...(E.HIDDEN[dbB] || [])].some(st => E.STEMS[st] === 필요)
          || E.STEM_ELEM[dsB] === E.STEM_ELEM[E.STEMS.indexOf(필요)];
        if (가짐) {
          온도 = { 종류: '풀어줌', 글자: 필요,
            말:님(nameB) + '이 ' + 님(nameA) + '께 필요한 글자 ' + 필요 + '의 기운을 지니고 있습니다 — '
              + '곁에 있으면 계절이 풀리는 쪽입니다' };
        } else if (gA.기신 && gA.기신 !== '없음'
                   && String(gA.기신).indexOf(E.ELEM[E.STEM_ELEM[dsB]]) >= 0) {
          온도 = { 종류: '거스름', 글자: gA.기신,
            말:님(nameB) + '의 기운은 ' + 님(nameA) + '께 거슬리는 쪽(' + gA.기신 + ')입니다 — '
              + '나쁜 사람이라는 뜻이 아니라, 오래 붙어 있으면 공주님이 더워지거나 추워집니다' };
        }
      }
    } catch (e) {}

    const 끌림 = [], 부딪힘 = [];

    // 일간이 합이면 서로 끌린다 (甲己 乙庚 丙辛 丁壬 戊癸)
    if ((dsA - dsB + 10) % 10 === 5) 끌림.push('두 사람의 일간이 서로 합입니다. 처음부터 끌리는 사이입니다');

    // 일지 — 배우자궁끼리의 관계
    if (YUKHAP[dbA] === dbB) 끌림.push('배우자 자리끼리 육합입니다. 붙어 있으면 둘 다 편안해집니다');
    else if (SAM.some(g => g.indexOf(dbA) >= 0 && g.indexOf(dbB) >= 0 && dbA !== dbB))
      끌림.push('배우자 자리끼리 삼합입니다. 같은 방향을 보고 굴러갑니다');
    // 충 배제 — 제23조

    // 지지 전체가 얼마나 부딪히나
    const brA = ['year','month','day','hour'].filter(k => Rme.pillars[k]).map(k => Rme.pillars[k].branch);
    const brB = ['year','month','day','hour'].filter(k => Ryou.pillars[k]).map(k => Ryou.pillars[k].branch);
    // 지지 충 세기도 제23조로 배제

    if (dsA === dsB && dbA === dbB) 부딪힘.push('일주가 같습니다. 잘 통하는 만큼 약점도 똑같습니다');

    // 서로 채워주는 것 — 궁통보감 조후용신
    const C = global.ChaeksaClassic;
    let 채움 = null;
    if (C) {
      const needA = C.gungtong(Rme).need, needB = C.gungtong(Ryou).need;
      const stems = (R) => ['year','month','day','hour'].filter(k => R.pillars[k])
        .map(k => E.fmt.stem(R.pillars[k].stem));
      const B가A를 = stems(Ryou).indexOf(needA) >= 0;
      const A가B를 = stems(Rme).indexOf(needB) >= 0;
      if (B가A를 && A가B를) 채움 = { 종류: '서로', 말: '서로에게 필요한 글자를 하나씩 갖고 있습니다. 같이 있으면 둘 다 숨이 트입니다' };
      else if (B가A를) 채움 = { 종류: '받음', 말: 님(nameB) + '이 ' + 님(nameA) + '에게 필요한 것을 갖고 있습니다. 곁에 있으면 편해지는 쪽은 ' + 님(nameA) + '입니다' };
      else if (A가B를) 채움 = { 종류: '줌', 말: 님(nameA) + '이 ' + 님(nameB) + '에게 필요한 것을 갖고 있습니다. 기대는 쪽은 ' + 님(nameB) + '입니다' };
    }

    // ── 맺음 — 「이 사이는 ~한 사이입니다」 (2026-08-30 다시 씀) ──
    // 예전에는 끌림·부딪힘이 있냐 없냐로만 네 갈래였다. 이 화면에서 가장 값진 재료인
    // 비대칭(나에게 ↔ 그에게)과 채움의 방향이 맺음에 하나도 안 들어갔다 —
    // 진열만 하고 「이 사이가 무엇인지」는 아무도 말해 주지 않았다.
    //
    // 지위는 단정하지 않는다. 연인인지 짝사랑인지 헤어진 사이인지는 사주에 없다.
    // 말하는 것은 두 원국 사이에 흐르는 힘뿐이고, 그 힘은 어느 사이에서도 똑같이 흐른다.
    // 맞았는지는 공주님이 아신다 — 무료 의논과 같은 구조다.
    const 끄는십신 = { 편관: 1, 편재: 1, 상관: 1, 편인: 1 };   // 눈을 못 떼게 하는 쪽
    const 품는십신 = { 정재: 1, 정관: 1, 정인: 1, 식신: 1 };   // 곁에 두고 지키는 쪽
    const 겨루는십신 = { 비견: 1, 겁재: 1 };                    // 나란히 서는 쪽
    const 맺음줄 = [];
    if (겨루는십신[g1] && 겨루는십신[g2]) {
      맺음줄.push('이 사이는 나란히 서는 쪽입니다 — 편한 만큼 같은 것을 원할 때 겨루게 됩니다');
    } else if (끄는십신[g1] && 품는십신[g2]) {
      맺음줄.push('이 사이는 ' + 님(nameA) + '이 끌리고 ' + 님(nameB) + '이 지키는 쪽입니다');
    } else if (품는십신[g1] && 끄는십신[g2]) {
      맺음줄.push('이 사이는 ' + 님(nameB) + '이 끌리고 ' + 님(nameA) + '이 지키는 쪽입니다');
    } else if (끄는십신[g1] && 끄는십신[g2]) {
      맺음줄.push('이 사이는 둘 다 서로에게서 눈을 못 떼는 쪽입니다 — 편안하지는 않습니다');
    } else if (품는십신[g1] && 품는십신[g2]) {
      맺음줄.push('이 사이는 둘 다 상대를 곁에 두고 싶어 하는 쪽입니다 — 잔잔하고 오래갑니다');
    } else if (겨루는십신[g1]) {
      맺음줄.push('이 사이는 ' + 님(nameA) + '께는 나란히 선 사람이고 ' + 님(nameB) + '께는 다르게 옵니다');
    } else if (겨루는십신[g2]) {
      맺음줄.push('이 사이는 ' + 님(nameB) + '께는 나란히 선 사람이고 ' + 님(nameA) + '께는 다르게 옵니다');
    }
    if (채움 && 채움.종류 === '서로') 맺음줄.push('그리고 서로 숨을 트여 줍니다');
    else if (채움 && 채움.종류 === '받음') 맺음줄.push('숨이 트이는 쪽은 ' + 님(nameA) + '입니다');
    else if (채움 && 채움.종류 === '줌') 맺음줄.push('내주는 쪽은 ' + 님(nameA) + '입니다');
    // 온도는 힘과 다른 축이다 — 곁에 있으면 계절이 풀리는가, 더 더워지는가
    if (온도 && 온도.종류 === '풀어줌') 맺음줄.push('곁에 있으면 계절이 풀립니다');
    else if (온도 && 온도.종류 === '거스름') 맺음줄.push('다만 오래 붙어 있으면 온도가 한쪽으로 기웁니다');
    if (끌림.length && 부딪힘.length) 맺음줄.push('끌리는 만큼 부딪히는데, 그 둘이 같은 이유에서 나옵니다');
    else if (끌림.length) 맺음줄.push('붙어 있을수록 편해집니다');
    else if (부딪힘.length) 맺음줄.push('가만두면 어긋납니다 — 서로 다르다는 것을 먼저 인정해야 갑니다');
    if (!맺음줄.length) 맺음줄.push('크게 끌리지도 부딪히지도 않습니다. 편안한 대신 잔잔합니다');
    const 맺음 = 맺음줄.join('. ') + '.';

    // ── 그 사람은 어떤 사람인가 (2026-08-30) ───────────────
    // 「이 사람 쓸만한가」가 이 화면의 물음이다. 그런데 여태 관계만 보고
    // 그 사람 자체는 한 번도 안 봤다 — 재는 코드는 이미 다 있는데
    // 공주님한테만 돌리고 그 사람한테는 안 돌렸다.
    // 판정은 공주님 것과 똑같은 함수로 낸다. 잣대가 다르면 견줄 수가 없다.
    const 그사람 = [];
    try {
      const w = wealth(Ryou, when, cachedSample && cachedSample());
      if (w && w.grade) 그사람.push({ 결: '돈', 이름: w.grade.name,
        말: (w.lines && w.lines[0]) || '', 상위: w.top });
    } catch (e) {}
    try {
      const c = career(Ryou, null);
      if (c && c.name) 그사람.push({ 결: '일', 이름: c.name,
        말: (c.note || '') + (c.jobs ? ' — ' + c.jobs : '') });
    } catch (e) {}
    try {
      const j = jichim(Ryou);
      if (j) 그사람.push({ 결: '몸', 이름: j.강약,
        말: (j.빈 && j.빈.length ? '평생 얇은 고리는 ' + j.빈.map(x => x.오행).join('·') + '. ' : '')
          + (j.채 && j.채.length ? '채우는 것은 ' + j.채.map(x => x.오행).join('·') + '입니다.' : '') });
    } catch (e) {}
    try {
      // name 은 문자열이고 note 가 설명이다. 배열로 착각해 첫 글자만 자른 적이 있다.
      const l = love(Ryou, when, null);
      if (l && l.name) 그사람.push({ 결: '사랑', 이름: l.name, 말: l.note || '' });
    } catch (e) {}
    try {
      const g = gyeok(Ryou);
      if (g && g.name) 그사람.push({ 결: '뼈대', 이름: g.name + '격',
        말: g.판정 === '섰다' ? '뼈대가 선 사주입니다'
          : g.판정 === '깨졌다' ? '뼈대가 흔들린 데가 있습니다 — 반듯한 길보다 제 길로 가는 쪽입니다'
          : '' });
    } catch (e) {}

    // 그 사람이 지금 어디에 서 있는가 — 같은 사람도 지나는 운에 따라 다르게 군다
    let 지금 = null;
    try { 지금 = nowOf(Ryou, when); } catch (e) {}
    return { 나에게, 그에게, 끌림, 부딪힘, 채움, 온도, 맺음, 지금, 맞물림, 신살, 그사람, nameA, nameB };
  }

  /** 우리 둘 사이 카드. 판결문이 아니라 한 장의 편지처럼 짠다. */
  function drawRelation(nameA, nameB, v) {
    const es = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const wrap = (t, n) => {
      const out = []; let cur = '';
      String(t).split(' ').forEach(w => {
        if ((cur + ' ' + w).trim().length <= (n || 26)) cur = (cur + ' ' + w).trim();
        else { out.push(cur); cur = w; }
      });
      if (cur) out.push(cur);
      return out.slice(0, 3);
    };
    let y = 232, body = '';
    const 줄 = (mark, col, txt, tcol) => {
      const ls = wrap(txt);
      body += '<text x="42" y="' + y + '" font-size="13" fill="' + col + '">' + mark + '</text>';
      ls.forEach((l, i) => {
        body += '<text x="66" y="' + (y + i * 19) + '" font-size="12.5" fill="' + (tcol || '#4a3f33') + '">' + es(l) + '</text>';
      });
      y += ls.length * 19 + 12;
    };
    v.끌림.forEach(t => 줄('♡', '#b0567a', t));
    v.부딪힘.forEach(t => 줄('沖', '#a06a2a', t));   // 이모지 금지 — 인장 한자를 쓴다
    if (v.채움) 줄('✦', '#3f7a5a', v.채움.말);

    const 맺 = wrap(v.맺음, 24);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 560" style="max-width:100%;display:block">'
      + '<defs><linearGradient id="rl" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#fbf4ee"/><stop offset="1" stop-color="#f2e4dd"/></linearGradient></defs>'
      + '<rect width="360" height="560" rx="16" fill="url(#rl)"/>'
      + '<rect x="14" y="14" width="332" height="532" rx="11" fill="none" stroke="#d9c3b8" stroke-width="1"/>'
      + '<text x="180" y="52" text-anchor="middle" font-size="11.5" fill="#a08878" letter-spacing="4">우리 둘 사이</text>'
      + '<text x="180" y="84" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="19" font-weight="700" fill="#4a3226">'
      + es(nameA) + ' <tspan fill="#b0567a">∞</tspan> ' + es(nameB) + '</text>'
      + '<line x1="42" y1="104" x2="318" y2="104" stroke="#e0cec4"/>'
      // 서로에게 무엇인가 — 이 카드의 머리
      + '<text x="42" y="132" font-size="11.5" fill="#a08878">' + es(nameA) + '님에게 ' + es(nameB) + '님은</text>'
      + '<text x="42" y="156" font-family="Noto Serif KR,serif" font-size="16" font-weight="700" fill="#4a3226">'
      + es(v.나에게.말[0]) + ' <tspan font-size="12" font-weight="400" fill="#9a8474">' + es(v.나에게.십신) + '</tspan></text>'
      + '<text x="42" y="186" font-size="11.5" fill="#a08878">' + es(nameB) + '님에게 ' + es(nameA) + '님은</text>'
      + '<text x="42" y="210" font-family="Noto Serif KR,serif" font-size="16" font-weight="700" fill="#4a3226">'
      + es(v.그에게.말[0]) + ' <tspan font-size="12" font-weight="400" fill="#9a8474">' + es(v.그에게.십신) + '</tspan></text>'
      + body
      + '<line x1="42" y1="470" x2="318" y2="470" stroke="#e0cec4"/>'
      + 맺.map((l, i) => '<text x="180" y="' + (498 + i * 20) + '" text-anchor="middle" font-family="Noto Serif KR,serif"'
          + ' font-size="13.5" fill="#7a5a48">' + es(l) + '</text>').join('')
      + '<text x="180" y="544" text-anchor="middle" font-size="10" fill="#bda898" letter-spacing="2">chaeksa.kr</text>'
      + '</svg>';
  }

  // ── 재물 그릇 — 녹패(祿牌) ──
  // 점수(0~100) = 재성 세력(40) + 식상 통로(14) + 담는 힘(25) + 재고(6) − 군겁쟁재(15) − 재다신약(15).
  // 등급은 점수가 아니라 지어낸 사주 1만 개 속 자리로 긋는다 — 유형 카드와 같은 원칙.
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
    '一心定': ['한 사람만', '정한 사람 하나면 된다 — 흔들 일이 별로 없다'],
    '一心合': ['운명 신봉자', '인연이 끌려온다. 첫눈에가 실제로 일어나는 쪽'],
    '一心動': ['진심인데 파란만장', '마음은 하나인데 상황이 자꾸 흔든다'],
    '一心空': ['짝사랑 장인', '깊게 두는데 곁이 비어 있다. 표현이 숙제'],
    '自由定': ['썸의 기술자', '거리 조절이 재능. 급할 게 없어서 더 끌린다'],
    '自由合': ['인기 관리자', '들어오는 인연이 많다. 고르는 게 일'],
    '自由動': ['불꽃 연애가', '뜨겁게 붙고 빠르게 움직인다. 잔잔함과는 거리'],
    '自由空': ['혼자가 편한', '연애를 못 하는 게 아니라 안 하는 쪽에 가깝다'],
    '多情定': ['다 챙기는 사람', '정이 넓은데 자리는 지킨다. 오해만 조심'],
    '多情合': ['모두의 최애', '어디 가도 인연이 붙는다. 정리가 관건'],
    '多情動': ['드라마 주인공', '사건이 끊이지 않는다. 본인 탓만은 아니다'],
    '多情空': ['많은데 허한', '사람은 많은데 채워지는 곳은 따로 있다'],
    '暗緣定': ['조용한 인연', '요란하지 않게 이어진다. 겉으로 드러나지 않을 뿐'],
    '暗緣合': ['티 안 나게 잘 풀리는', '숨은 인연이 제때 자리를 잡는다'],
    '暗緣動': ['숨은 인연에 파도', '조용한 자리인데 사건은 붙는다'],
    '暗緣空': ['늦게 드러나는', '곁이 늦게 채워진다. 서두를수록 손해'],
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
      : t.B === '合' ? '배우자궁 합 ' + t.hap + '개 — 끌어당기는 힘을 타고났다'
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
    const l3 = '얇은 쪽은 ' + low + ' — ' + ({
      비겁: '뚝심은 사람으로 메운다', 식상: '표현·산출은 훈련해야 는다',
      재성: '받아낼 돈은 남에게 안 맡긴다', 관성: '규칙과 마감은 장치로 걸어둔다',
      인성: '기초 공부는 미루면 발목 잡는다' }[low]);
    // **처방이 아니라 서술이다**(docs/27 아홉). 직업은 이용자가 정한다.
    const l4 = '이런 자리가 보이는 곳 — ' + row[2];
    return { key: ax.key, name: row[0], note: row[1], jobs: row[2], group: ax.group, elem: ax.elem,
             share, n: sample && sample.n ? sample.n : 0, lines: [l1, l2, l3, l4] };
  }


  /** 영역 네 축 — 官과 나머지 넷의 관계(docs/27 영역관제).
   *
   *  **여기가 한 곳이다.** 조립기(chaeksadan)와 職 탭이 각자 갖고 있으면 반드시 어긋난다
   *  (enginecheck 머리글: 「공식을 두 벌 두면 반드시 어긋난다」).
   *
   *  십신은 다섯이고 그중 하나가 官이니 **넷이면 빠짐도 겹침도 없다.**
   *  새 상수는 없다 — 기울기는 두 힘의 비다(docs/13 「輕重은 비교로만」).
   *
   *  힘은 **천간 투출** 기준이다. 영역은 드러난 자리를 말하므로 투출로 읽는 것이 맞다.
   *  다만 천직의 주력 축은 지장간까지 세므로 기준이 다르다 — 주력이라 한 축은
   *  「겉에 없음」으로 말하지 않는다(3,000명 중 25명이 모순을 받았다).
   */
  /** 원국 겉에 상관이 서 있는가 · 강약은 무엇인가 — 「官이 없다」를 가르는 재료.
   *  R 이 없으면 예전대로 뭉뚱그린 답이 나간다(호출부가 안 넘겨도 안 깨진다).
   *
   *  **뿌리는 안 묻는다**(2026-09-01 결재). stemPower 가 십이운성 기반이라
   *  네 지지 중 하나만 절·태가 아니면 뿌리로 세고, 그래서 3000명에서
   *  「투출했는데 무근인 상관」이 **0명**이었다. 갈리지 않는 조건이다.
   *  통근 잣대를 다시 세우면 억부·격국·조후가 다 움직이므로 손대지 않기로 했다. */
  function 무관재료(R) {
    try {
      const p = R.pillars, ds = p.day.stem;
      const 겉 = ['year', 'month', 'hour'].filter(k => p[k]).map(k => p[k].stem);
      return {
        상관투출: 겉.some(st => E.TEN_GODS[E.tenGod(ds, st)] === '상관'),
        강약: (R.analysis || E.strengthOf(p)).strength,
      };
    } catch (e) { return null; }
  }

  function 영역축(힘, 주력, R) {
    if (!힘) return [];
    const 관 = 힘.관성 || 0, 재 = 힘.재성 || 0, 식 = 힘.식상 || 0,
          인 = 힘.인성 || 0, 겁 = 힘.비겁 || 0;
    if (관 <= 0) {
      // ── 「官이 없다」는 한 판정이 아니라 셋이다 (2026-09-01 사용자 조문) ──
      //
      //   원국은 **존재의 목록이 아니라 드러남의 지도**다. 「官이 없다」는
      //   「그 사람에게 官이 없다」가 아니라 「官이 겉으로 안 나왔다」다.
      //   사람이 사회 속에 있는 한 官과의 관계는 반드시 있다.
      //
      //   그리고 **십신은 대상 없이도 성질을 갖는다.** 상관은 官을 치는 글자다.
      //   칠 官이 원국에 없어도 그 성질은 그대로 있고, 官이 오는 순간 친다.
      //   그러므로 상관이 선 사주는 「자리가 없는 사람」이 아니라
      //   **「자리를 밀어내는 사람」**이다 — 정반대의 판정이다.
      //
      //   여기 오기 전에는 셋을 하나로 뭉개고 전부 수동태로 말했다
      //   (「때가 데려다주는 쪽」). 무관 1524명 중 195명(12.8%)이 정반대로 읽혔다.
      const 무 = 무관재료(R) || {};
      const 갈 = 무.상관투출 && 무.강약 !== '신약' ? '밀어냄'
               : 무.강약 === '신약' ? '못받음' : '아직';
      const 말 =
        갈 === '밀어냄'
          ? '맡겨진 자리가 겉에 없습니다. 다만 비어 있는 것이 아니라 밀어내고 계세요 — 겉에 선 상관이 자리를 치는 글자입니다. 남이 정해 준 판에 들어가면 답답해지고, 판을 직접 만들 때 힘이 붙는 쪽이에요.'
        : 갈 === '못받음'
          ? '맡겨진 자리가 겉에 없습니다. 지금은 자리를 늘리는 쪽보다 그것을 받칠 것을 먼저 세우는 자리예요 — 기운이 약한 쪽이라, 자리가 오면 받칠 것이 함께 있어야 합니다.'
        : 식 > 0 && 재 > 0
          ? '맡겨진 자리는 아직 없는데 만들어 내는 힘이 있습니다 — 내놓은 것이 돈이 되고, 그 돈이 자리가 되는 쪽이에요.'
        : 재 > 0
          ? '자리보다 벌이가 먼저 붙는 쪽입니다. 밑천이 자리를 데려옵니다.'
          : '자리도 밑천도 아직 겉으로 안 나와 있습니다. 없다는 뜻이 아니라 때가 데려다주는 쪽이라, 그 해를 아는 것이 남보다 중요합니다.';
      return [{ 이름: '관없음', 기울기: 1, 살아있나: false, 갈: 갈, 말: 말 }];
    }
    const 축 = [];
    const 재기 = (이름, 상대, 왼, 오른, 없을때) => {
      if (상대 > 0) {
        축.push({ 이름, 상대, 기울기: Math.abs(관 - 상대) / Math.max(관, 상대),
                  살아있나: true, 말: 상대 >= 관 ? 왼 : 오른 });
      } else if (없을때 && 이름 !== 주력) {
        축.push({ 이름, 상대: 0, 기울기: 0.28, 살아있나: false, 말: 없을때 });
      }
    };
    // 네 축이 연달아 나오는 화면이라 **끝맺음을 겹치지 않게 돌린다.**
    // 열한 줄이 전부 「~쪽이에요/자리예요」로 끝나 판당 4.08회였다(3000판 실측).
    // 「쪽」을 뗀다고 판정이 세지는 것은 아니다 — 이 문장들은 존재가 아니라 관계를
    // 말하므로 그대로 반증 가능하다(docs/27 아홉). 「쪽」은 확신의 완충이지
    // 반증 가능성의 장치가 아니다. 그래서 몇 줄만 남기고 나머지는 곧게 편다.
    재기('비겁', 겁,   // 官剋我 — 자리와 나의 크기
      '맡은 것보다 공주님이 더 큽니다. 자리가 공주님을 다 못 담는 쪽이에요.',
      '맡은 것이 공주님보다 무겁습니다. 감당하는 데 힘이 실립니다.');
    재기('식상', 식,   // 食傷剋官 — 내놓는 것과 자리의 마찰
      '내놓는 힘이 자리보다 셉니다. 말과 재주가 앞설수록 자리가 흔들립니다.',
      '내놓는 것이 자리를 흔들지는 않습니다. 자리 안에서 가는 편이에요.',
      '내놓는 힘이 겉으로는 안 나와 있습니다. 자리를 흔들 것이 밖에 없습니다.');
    재기('재성', 재,   // 財生官 — 돈과 자리의 연동
      '버는 것이 그대로 자리를 키웁니다. 돈과 자리가 같이 갑니다.',
      '자리는 섰는데 그것을 키울 밑천이 얇습니다. 자리가 먼저고 벌이가 뒤에 옵니다.',
      '자리는 있는데 그것을 키울 밑천이 겉에 안 나와 있습니다. 자리와 벌이가 따로 노는 쪽이에요.');
    재기('인성', 인,   // 官生印 — 자리가 나에게 돌려주는가
      '맡은 것이 공주님 안에 쌓입니다. 경력이 되고 명분이 됩니다.',
      '맡은 것이 쌓이기는 하는데 자리가 더 무겁습니다. 받는 것보다 내는 것이 많은 편이에요.',
      '받쳐 줄 것이 겉으로는 안 나와 있습니다. 맡은 것이 밖으로 나가고 안에는 덜 쌓입니다.');
    축.sort((a, b) => b.기울기 - a.기울기);
    return 축;
  }

  // ── 자리가 열리는 해 (docs/28 넷 1순위 · docs/27 여섯) ──
  //
  // 財는 「열리는 해·달」을 잡는데 官으로 해를 잡는 계산이 하나도 없었다(실측 0건).
  // 인연 해가 女命에서만 官을 잡고 있었고, 그것도 **배우자성 한 얼굴로만** 읽었다.
  // 官은 두 얼굴이다 — 곁에 서는 사람이기도 하고, 공주님이 설 자리이기도 하다.
  // 그래서 男女 가리지 않고 官으로만 다시 잰다.
  //
  // 새 상수를 만들지 않는다(docs/28 다섯). 인연 해와 **같은 저울**을 官 쪽으로 돌려 쓴다 —
  // 하늘 28+뿌리 · 대운 16. 땅 20과 財生官 12는 인연의 육합 26·삼합 20 자리를 대신한다
  // (배우자궁 합은 자리의 이야기가 아니므로 가져오지 않는다).
  //
  // 열림과 닫힘을 한 점수에 섞지 않는다(제24조). 막대는 **열림만** 재고,
  // 傷官見官은 따로 「흔들리는 해」로 적는다. 인수가 투출해 있으면 구제된다(docs/16 정관격 구제).
  function 영역해(R, fromYear, n) {
    const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds];
    const W = E.NATAL_WEIGHT;
    const 관오행 = (de + 3) % 5, 재오행 = (de + 2) % 5;
    const 여명 = ((R.input && R.input.gender) || 'M') !== 'M';

    const 자리 = [[p.year.branch, W.yearBranch], [p.month.branch, W.monthBranch],
                  [p.day.branch, W.dayBranch]];
    if (p.hour) 자리.push([p.hour.branch, W.hourBranch]);

    // 원국이 이미 겉에 가진 것 — 흔들림 판정에만 쓴다(일간은 뺀다)
    const 십 = (st) => E.TEN_GODS[E.tenGod(ds, st)];
    const 겉 = [p.year.stem, p.month.stem].concat(p.hour ? [p.hour.stem] : []);
    const 정관있다 = 겉.some(st => 십(st) === '정관');
    const 인수있다 = 겉.some(st => 십(st) === '정인' || 십(st) === '편인');
    // 상관은 官을 치는 글자다 — **칠 官이 원국에 없어도 성질은 그대로다.**
    // 그래서 운에서 官이 오는 해에 비로소 부딪힌다(2026-09-01 결재).
    // 원문은 원국 격을 두고 傷官見官을 말하지만 평주는 행운도 격을 성패한다고 본다.
    // 뿌리는 안 묻는다 — 3000명에서 「투출했는데 무근인 상관」이 0명이었다.
    const 상관있다 = 겉.some(st => 십(st) === '상관');

    const rows = [];
    for (let i = 0; i < (n || 10); i++) {
      const y = fromYear + i;
      let tf; try { tf = E.dateFortune(y, 6, 15); } catch (e) { continue; }
      const du = E.currentDaeun(R, new Date(y, 5, 15));
      let s = 0; const 이유 = [];

      // 자리의 글자가 하늘에 오는가.
      // 통근은 **점수에만** 넣고 문장으로는 안 가른다. 처음엔 「뿌리까지 내리고 옵니다 /
      // 하늘에만 뜹니다」로 갈랐는데, 3000명 6000건에서 무근이 **0건**이었다.
      // 지지 넷에 지장간까지 있으면 한 오행이 어디에도 안 걸리는 일이 거의 없다.
      // 안 갈리는 가지를 문장으로 두면 재지 않은 것을 잰 것처럼 말하게 된다.
      // (금을 0.4 쯤에 새로 그으면 갈리기는 하나, 그건 새 상수다 — docs/28 다섯에서 막았다.)
      let 官옴 = false;
      if (E.STEM_ELEM[tf.year.stem] === 관오행) {
        官옴 = true;
        s += 28 + Math.min(22, Math.round(E.stemPower(tf.year.stem, 자리) * 22));
        이유.push('자리의 글자가 하늘로 옵니다 — 겉으로 드러나는 자리입니다');
      }
      // 땅으로 오는 것은 겉에 티가 덜 난다 — 그래도 실질이다
      const 본기 = (E.HIDDEN[tf.year.branch] || [])[0];
      if (본기 != null && E.STEM_ELEM[본기] === 관오행) {
        官옴 = true;
        s += 20; 이유.push('자리의 글자가 땅으로 옵니다 — 티는 덜 나도 실질이 옵니다');
      }
      // 財生官 — 밑천이 자리를 밀어 올린다(영역축의 재성 축과 같은 관계식이다)
      if (E.STEM_ELEM[tf.year.stem] === 재오행) {
        s += 12; 이유.push('벌이 쪽 글자가 옵니다 — 밑천이 자리를 밀어 올리는 해입니다');
      }
      // 대운은 십 년을 물들인다
      if (du && E.STEM_ELEM[du.stem] === 관오행) {
        s += 16; 이유.push('지금 대운 자체가 자리 쪽으로 기울어 있습니다');
      }

      // 傷官見官 — 점수에 안 섞는다. 겁주지 않는다: 「무너진다」가 아니라 「건드린다」다.
      let 흔들 = null;
      if (십(tf.year.stem) === '상관' && 정관있다) {
        흔들 = 인수있다
          ? '내놓는 것이 자리를 건드리는 해입니다 — 다만 받쳐 주는 것이 있어 크게는 안 갑니다'
          : '내놓는 것이 자리를 건드리는 해입니다 — 말과 재주가 앞설수록 자리가 흔들립니다';
      }
      // 자리가 오는데 내가 그것을 치는 해 — 열림을 지우지 않는다. 문이 열리되
      // 그대로 들어가지지 않는 것이지, 안 열리는 것이 아니다. 그래서 점수는 안 깎고
      // 그 해 안에 한 줄을 더 붙인다(제24조 — 한 문장 두 주장 금지, 문장을 나눈다).
      const 견관 = (官옴 && 상관있다)
        ? (인수있다
            ? '다만 그대로는 안 받는 쪽이에요 — 겉에 선 상관이 그 자리를 칩니다. 받쳐 주는 것이 있어 크게는 안 갑니다.'
            : '다만 그대로는 안 받는 쪽이에요 — 겉에 선 상관이 그 자리를 칩니다. 주어진 모양대로보다 모양을 고쳐서 받게 되는 쪽입니다.')
        : null;
      rows.push({ 해: y, 간지: E.fmt.pillar(tf.year), 점수: s, 이유, 흔들, 견관, 官옴, gz: tf.year });
    }
    if (!rows.length) return { rows: [], 좋은해: [], 첫해: null, 흔들해: [], 겹침: [], 여명,
                               말: '해를 재지 못했습니다' };

    // 0~100 으로 편다 — 이 십 년 안에서의 서열이지 절대값이 아니다
    const raw = rows.map(r => r.점수), hi = Math.max.apply(null, raw), lo = Math.min.apply(null, raw);
    rows.forEach(r => { r.점수 = hi === lo ? 50 : Math.round((r.점수 - lo) / (hi - lo) * 100); });

    // **官이 세운으로 와야 「자리가 열리는 해」다.** 財生官(+12)이나 대운(+16)만으로도
    // 이유가 붙는 바람에 처음엔 3000명 전원이 늘 세 해를 받았고, 「벌이 쪽 글자가 옵니다」
    // 하나로 첫해가 잡히기까지 했다. 財는 밀어 주는 것이지 자리 자체가 아니고,
    // 대운은 십 년을 고르게 물들이므로 해를 가르지 못한다. 둘 다 순위 재료로만 남긴다.
    const 좋은해 = rows.filter(r => r.官옴).sort((a, b) => b.점수 - a.점수).slice(0, 3);
    const 첫해 = 좋은해.length ? 좋은해.slice().sort((a, b) => a.해 - b.해)[0] : null;
    const 흔들해 = rows.filter(r => r.흔들);

    // 女命의 官은 두 얼굴이다(docs/27 여섯). 같은 해가 양쪽에 걸리면 그것을 적되
    // **두 얼굴을 한 문장에 섞지 않는다**(docs/28 다섯) — 겹친 해만 넘기고 말은 화면에서 나눈다.
    let 겹침 = [];
    if (여명 && 좋은해.length) {
      try {
        const iy = inyeon(R, fromYear, n || 10);
        const 인 = (iy.좋은해 || []).map(g => g.해);
        겹침 = 좋은해.map(g => g.해).filter(y => 인.indexOf(y) >= 0);
      } catch (e) {}
    }

    const 말 = !첫해 ? '앞으로 십 년 안에는 관(官)의 글자가 세운으로 오지 않습니다. 자리가 새로 열리기보다 있는 자리를 다지는 구간이에요'
      : 첫해.해 === fromYear ? '올해가 그 해입니다'
      : 첫해.해 + '년이 가장 가깝습니다';

    return { rows, 좋은해, 첫해, 흔들해, 겹침, 여명, 말 };
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
    // 대운지지 충 감점을 걷었다 — 제23조가 「걷어낸 곳」에 이름으로 적어 둔 자리다.
    if (db + b === 13 || db + b === 1) v += 8;         // 육합
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
    // 동점이면 나중 것을 잡는다(>=). 앞엣것이 이기면 지금과 똑같이 높은데도
    // 「그건 지나갔습니다」가 된다(2026-08-30 실측: 18~27세 85 · 지금 85).
    list.forEach((x, i) => { if (x.v >= list[hi].v) hi = i; if (x.v < list[lo].v) lo = i; });
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
    const gradeOf = 등급100;
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
    // 최고 구간이 과거면 '공주님 전성기는 지났다'로 읽힌다. 앞에 남은 것을 함께 짚는다.
    // 「앞으로 남은 구간 중 최고」는 여기서 한 번만 센다. 두 군데서 각각 세다가
    // 범위가 갈려(하나는 지금 대운 포함, 하나는 제외) 홈 타일과 본문이 다른 십 년을
    // 가리킨 적이 있다(2026-08-30). 「앞으로 남은」이므로 지나가는 중인 지금은 뺀다.
    let 앞hi = -1;
    if (curIdx >= 0 && hi < curIdx) {
      for (let i = curIdx + 1; i < n; i++) if (앞hi < 0 || list[i].v > list[앞hi].v) 앞hi = i;
    }
    if (curIdx >= 0 && hi < curIdx) {
      const ah = 앞hi;
      if (ah >= 0) lines.push('앞으로 남은 구간 중에는 ' + list[ah].d.startAge + '~' + list[ah].d.endAge + '세가 가장 높습니다');
      else lines.push('가장 낮은 구간은 ' + list[lo].d.startAge + '~' + list[lo].d.endAge + '세였습니다');
    } else {
      lines.push('가장 높은 구간은 ' + list[hi].d.startAge + '~' + list[hi].d.endAge + '세, 가장 낮은 구간은 ' + list[lo].d.startAge + '~' + list[lo].d.endAge + '세');
    }
    lines.push('곡선은 대운이 내 사주에 필요한 것을 갖고 오는가로 잽니다');
    // 최고 구간이 이미 지났는가. 지났다면 앞으로 남은 구간 중 가장 높은 곳도 함께 낸다 —
    // 화면이 앞세울 것은 지나간 봉우리가 아니라 남은 봉우리다(값은 그대로 둔다).
    const 지남 = curIdx >= 0 && hi < curIdx;   // 앞hi 는 위에서 한 번만 셌다
    const 칸 = (d) => d.startAge + '~' + d.endAge + '세';
    return { list, hi, lo, curIdx, headIdx: hi, kind, kindNote: CURVE_KIND[kind],
             peak: list[hi].d, low: list[lo].d, lines, 지남,
             앞최고: 앞hi >= 0 ? list[앞hi].d : null,
             앞최고Txt: 앞hi >= 0 ? 칸(list[앞hi].d) : null,
             peakTxt: 칸(list[hi].d) };
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
    // 충 감점 없음 — 제23조. 열두 달 순서가 배제한 잣대로 뒤집히면 안 된다.
    if (db + b === 13 || db + b === 1) v += 8;
    else if (SAMHAP_L.some(gp => gp.indexOf(db) >= 0 && gp.indexOf(b) >= 0 && db !== b)) v += 6;
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  const YEAR_KIND = {
    '상승하는 해': '뒤로 갈수록 열립니다',
    '전반이 밝은 해': '앞쪽에 기회가 몰려 있습니다',
    '한여름 같은 해': '가운데가 가장 뜨겁습니다',
    '기복이 큰 해': '달마다 기운이 달라집니다',
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
    const gradeOf = 등급100;
    const 올해 = now.getFullYear() === year;
    // 지금 달은 달력이 아니라 절기로 고른다 — 이 화면이 스스로 「입절일이 경계」라고
    // 적어 두고도 now.getMonth() 로 잘랐다. 9월 3일이면 명리로는 아직 신월인데
    // 달력으로는 9월이라, 시작도 안 한 유월 칸이 「지난 달」로 빠졌다.
    let curIdx = -1;
    if (올해) {
      try {
        const tm = E.dateFortune(now.getFullYear(), now.getMonth() + 1, now.getDate()).month;
        curIdx = months.findIndex(x => x.pl.stem === tm.stem && x.pl.branch === tm.branch);
      } catch (e) {}
      if (curIdx < 0) curIdx = now.getMonth();          // 못 찾으면 달력으로 물러난다
    }
    const curM = 올해 && months[curIdx] ? months[curIdx].m : 0;
    // 남은 달 중 최고 — 지난 달을 최고라고 알려주면 쓸 데가 없다
    let nextHi = -1;
    months.forEach((x, i) => { if (올해 && i > curIdx && (nextHi < 0 || x.v > months[nextHi].v)) nextHi = i; });
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
    극출: ['내가 다잡는 사이', '내가 기준을 세우는 쪽입니다. 옳은 말이라도 세게 나가면 아이가 닫힙니다.'],
    극입: ['나를 긴장시키는 아이', '아이가 내 약한 곳을 정확히 건드립니다. 나를 자라게 하는 쪽으로 씁니다.'],
    비화: ['거울 같은 사이', '기운이 같아 말이 잘 통하는데, 같은 이유로 같은 실수를 합니다.'],
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
        : '내 자녀궁 ' + E.fmt.pillar(hp) + ' — 부딪힘도 끌림도 없는 담백한 사이';
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

  global.ChaeksaTypecard = { SEASON_GRADE, 등급100, mine, buildSample, cachedSample, gyeok, gyeokName, share, pastjob, drawGyoji, seasonNow, drawSeason, banToday, drawBan, relation, drawRelation, nowOf, bothMonths, bothDays, inyeonMonths, inyeonDays, coupleDates, myDays, 달그림: 달그림, inyeonWhy, coupleWhy, monthWhy, dossier, 모습: 모습, 첫확인: 첫확인, 간명자료: 간명자료, GOD_MEANING, reading, whoLovesMe, 인연결론: 인연결론, 재물결론: 재물결론, loveStory, moneyStory, wealthWhy, wealthDrill, 재물날들: 재물날들, naepyeon, drawNaepyeon, jichim, drawJichim, inyeon, drawInyeon, wealth, drawNokpae, love, drawDohwa, career, drawJikcheop, lifeCurve, drawLifeCurve, yearFlow, drawYearFlow, childCard, drawChild, 영역축, 영역해, 조 };
})(window);
