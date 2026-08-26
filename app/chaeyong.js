/* 책사 6차원 적층 체용(體用) 판정 v1
 *
 * 왜 필요한가
 *   지금까지는 원국·대운·세운·월운을 나란히 늘어놓기만 했다. 그러면 "언제 흐름이 뒤집히는지"를
 *   짚지 못한다. 체용은 층마다 다시 판정해야 한다 — 같은 편관이라도 신강일 때는 귀(貴)가 되고
 *   신약일 때는 살(殺)이 되기 때문이다.
 *
 * 적층 방식
 *   1층 원국                         體 = 원국,            用 = 없음(기준)
 *   2층 원국+대운                    體 = 원국,            用 = 대운
 *   3층 원국+대운+세운               體 = 원국+대운,       用 = 세운
 *   4층 +월운                        體 = 앞의 누적,       用 = 월운
 *   5층 +일운                        體 = 앞의 누적,       用 = 일운
 *   6층 +시운                        體 = 앞의 누적,       用 = 시운
 *   각 층에서 누적 세력으로 강약을 다시 재고, 그 강약 기준으로 用을 순(順)/역(逆)으로 판정한다.
 *
 * 검수가 필요한 전제 (학파에 따라 갈리는 부분)
 *   · 세력 가중치: 월지를 가장 무겁게(월령), 시간 단위가 짧아질수록 가볍게 둔다
 *   · 지지는 정기(본기)로만 계산한다 (지장간 전체를 쓰는 방식과 다름)
 *   · 신강일 때 관성은 順(貴), 신약일 때 관성은 逆(殺)로 본다
 *   · 충은 감점, 육합·삼합은 가점. 형·해·파는 이 판정에서는 쓰지 않는다
 *   이 전제를 바꾸려면 아래 WEIGHT / judge() 만 고치면 된다.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine;

  // 세력 가중치 — 월령을 가장 무겁게, 짧은 주기일수록 가볍게
  // 원국 가중치는 분석엔진과 같은 것을 쓴다 (두 곳이 다른 답을 내지 않게)
  const WEIGHT = {
    natal: E.NATAL_WEIGHT,
    대운:  { stem: .8, branch: 1.6 },
    세운:  { stem: .6, branch: 1.0 },
    월운:  { stem: .4, branch: .7 },
    일운:  { stem: .3, branch: .5 },
    시운:  { stem: .2, branch: .3 },
  };

  const YUKHAP = { 0:1,1:0,2:11,11:2,3:10,10:3,4:9,9:4,5:8,8:5,6:7,7:6 };
  const SAMHAP = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
  function branchRel(a, b) {
    if (a === b) return '복음';
    if ((b - a + 12) % 12 === 6) return '충';
    if (YUKHAP[a] === b) return '육합';
    if (SAMHAP.some(g => g.includes(a) && g.includes(b))) return '삼합';
    return null;
  }
  const GROUP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };

  const siding = E.siding;   // 분석엔진과 같은 판정을 쓴다

  /** 시운(時運) 간지 — 지금 시각 기준 */
  function hourPillarOf(dayStem, hour) {
    const branch = Math.floor(((hour + 1) % 24) / 2);
    const stem = ((dayStem % 5) * 2 + branch) % 10;
    return { stem, branch };
  }

  /** 누적 세력으로 강약 점수를 낸다 (1에 가까울수록 신강) */
  function strengthOf(items, dayElemIdx) {
    let support = 0, total = 0;
    items.forEach(it => {
      const s = siding(dayElemIdx, it.elem);
      total += it.w;
      if (s > 0) support += it.w;
    });
    return total ? support / total : .5;
  }
  const label = E.STRENGTH_LABEL;   // 강약 경계는 프로젝트 전체가 하나만 쓴다

  /** 그 층에서 用이 體에게 順인가 逆인가 (-3 ~ +3) */
  function judge(strengthLabel, group, extras) {
    let v;
    if (strengthLabel === '신약') {
      v = ({ 인성: 2, 비겁: 2, 식상: -1, 재성: -1.5, 관성: -2 })[group];
    } else if (strengthLabel === '신강') {
      v = ({ 식상: 1.5, 재성: 2, 관성: 1.5, 인성: -1.5, 비겁: -2 })[group];
    } else {
      // 중화 — 어느 쪽으로도 치우치지 않았으니 用의 성격이 그대로 드러난다.
      // 식상생재 흐름은 반기고, 인성·비겁이 더해지면 균형이 신강 쪽으로 깨진다.
      v = ({ 식상: 1, 재성: 1.5, 관성: .5, 인성: -.5, 비겁: -1 })[group];
    }
    if (extras.yong) v += 1;            // 이 사주가 필요로 하는 오행
    if (extras.missing) v += .5;        // 원국에 없던 오행이 채워짐
    if (extras.chung) v -= 1;           // 지지 충
    if (extras.hap) v += .5;            // 육합·삼합
    if (extras.bokeum) v -= .5;         // 복음
    return Math.max(-3, Math.min(3, Math.round(v * 10) / 10));
  }

  const SIGN = (v) => v > 0.3 ? '順' : (v < -0.3 ? '逆' : '平');

  /**
   * 6층 적층 체용 판정.
   * @param {Object} result  ChaeksaEngine.calc()의 결과
   * @param {Date}   when    기준 시각 (기본: 지금)
   * @param {Object} [opts]  { upto: 1~6 }  몇 층까지 볼지 (기본 6)
   */
  function stack(result, when, opts) {
    when = when || new Date();
    const upto = (opts && opts.upto) || 6;
    const a = result.analysis, ds = a.dayStem, p = result.pillars;
    const dayElem = E.STEM_ELEM[ds];
    const f = E.fmt;
    const godOf = (stem) => E.TEN_GODS[E.tenGod(ds, stem)];

    // 원국 세력 (일간 자신은 주체이므로 제외)
    const W = WEIGHT.natal;
    const items = [];
    const push = (elem, w) => items.push({ elem, w });
    push(E.STEM_ELEM[p.year.stem], W.yearStem);
    push(E.BRANCH_ELEM[p.year.branch], W.yearBranch);
    push(E.STEM_ELEM[p.month.stem], W.monthStem);
    push(E.BRANCH_ELEM[p.month.branch], W.monthBranch);
    push(E.BRANCH_ELEM[p.day.branch], W.dayBranch);
    if (p.hour) { push(E.STEM_ELEM[p.hour.stem], W.hourStem); push(E.BRANCH_ELEM[p.hour.branch], W.hourBranch); }

    const natalBranches = ['year','month','day','hour'].filter(k => p[k]).map(k => p[k].branch);
    const carriedBranches = natalBranches.slice();

    const layers = [];
    // 1층 — 원국 자체
    let score = strengthOf(items, dayElem);
    layers.push({
      level: 1, name: '원국', ganji: `${f.pillar(p.year)} ${f.pillar(p.month)} ${f.pillar(p.day)} ${p.hour ? f.pillar(p.hour) : '(시 모름)'}`,
      god: null, group: null, strength: label(score), score: Math.round(score * 100) / 100,
      value: 0, sign: '기준',
      note: `타고난 구조. 이 층이 體의 바탕이 된다. 월지 ${f.branch(p.month.branch)}${a.gotMonth ? ' 득령' : ' 실령'}.`,
    });

    // 2~6층 — 운이 하나씩 얹힌다
    const du = E.currentDaeun(result, when);
    const tf = E.dateFortune(when.getFullYear(), when.getMonth() + 1, when.getDate());
    const hourP = hourPillarOf(tf.day.stem, when.getHours());
    const seq = [
      { name: '대운', gz: du, w: WEIGHT.대운, period: du ? `${du.startYear}~${du.startYear + 9}` : null },
      { name: '세운', gz: tf.year, w: WEIGHT.세운, period: `${when.getFullYear()}년` },
      { name: '월운', gz: tf.month, w: WEIGHT.월운, period: `${when.getMonth() + 1}월` },
      { name: '일운', gz: tf.day, w: WEIGHT.일운, period: `${when.getMonth() + 1}/${when.getDate()}` },
      { name: '시운', gz: hourP, w: WEIGHT.시운, period: `${when.getHours()}시` },
    ];

    for (let i = 0; i < seq.length && i + 2 <= upto; i++) {
      const s = seq[i];
      if (!s.gz) { layers.push({ level: i + 2, name: s.name, ganji: '―', note: '대운 시작 전입니다.', value: 0, sign: '평', strength: layers[layers.length - 1].strength, score: layers[layers.length - 1].score }); continue; }
      // 體 = 지금까지 누적된 것 (用은 아직 넣지 않는다). 이 상태를 기준으로 用을 판정한다.
      const bodyScore = strengthOf(items, dayElem);
      const bodyLab = label(bodyScore);

      const god = godOf(s.gz.stem);
      const group = GROUP[god];
      const elemName = E.ELEM[E.STEM_ELEM[s.gz.stem]];
      // 체(누적된 지지)와 용(들어온 지지)의 관계
      const rels = [];
      carriedBranches.forEach(b => { const r = branchRel(b, s.gz.branch); if (r) rels.push(r); });
      const extras = {
        yong: a.yongCandidates.includes(elemName),
        missing: a.missing.includes(elemName),
        chung: rels.includes('충'),
        hap: rels.includes('육합') || rels.includes('삼합'),
        bokeum: rels.includes('복음'),
      };
      const value = judge(bodyLab, group, extras);

      // 판정이 끝났으니 이제 用을 體에 편입한다 (다음 층의 體가 된다)
      items.push({ elem: E.STEM_ELEM[s.gz.stem], w: s.w.stem });
      items.push({ elem: E.BRANCH_ELEM[s.gz.branch], w: s.w.branch });
      carriedBranches.push(s.gz.branch);
      score = strengthOf(items, dayElem);
      const afterLab = label(score);

      layers.push({
        level: i + 2, name: s.name, ganji: f.pillar(s.gz), ganjiKo: f.pillarKo(s.gz), period: s.period,
        god, group, elem: elemName,
        bodyStrength: bodyLab, bodyScore: Math.round(bodyScore * 100) / 100,
        strength: afterLab, score: Math.round(score * 100) / 100,
        moved: bodyLab !== afterLab ? `${bodyLab} → ${afterLab}` : null,
        value, sign: SIGN(value),
        rels: [...new Set(rels)],
        extras,
        note: buildNote(s.name, god, group, bodyLab, value, extras, rels, bodyLab !== afterLab ? afterLab : null),
      });
    }

    // 변곡점 — 부호가 바뀌는 층
    const turns = [];
    for (let i = 2; i < layers.length; i++) {
      const prev = layers[i - 1], cur = layers[i];
      if (prev.value == null || cur.value == null) continue;
      if ((prev.value > 0.3 && cur.value < -0.3) || (prev.value < -0.3 && cur.value > 0.3)) {
        turns.push({ from: prev.name, to: cur.name, fromSign: prev.sign, toSign: cur.sign });
      }
    }
    // 강약이 층을 지나며 바뀌었는가
    const shifted = layers.length > 1 && layers[0].strength !== layers[layers.length - 1].strength;

    return {
      layers,
      coord: layers.filter(l => l.level > 1).map(l => l.value),
      coordText: layers.map(l => l.level === 1 ? `원국(${l.strength})` : `${l.name} ${l.god || ''} ${l.sign}${l.value > 0 ? '+' : ''}${l.value}${l.moved ? ' [' + l.moved + ']' : ''}`).join(' → '),
      turns, shifted,
      finalStrength: layers[layers.length - 1].strength,
      natalStrength: layers[0].strength,
      sum: Math.round(layers.filter(l => l.level > 1).reduce((s, l) => s + (l.value || 0), 0) * 10) / 10,
    };
  }

  function buildNote(name, god, group, bodyLab, value, ex, rels, movedTo) {
    const dir = value > 0.3 ? '나를 돕는 쪽' : (value < -0.3 ? '나를 누르는 쪽' : '중립에 가까움');
    const parts = [`${bodyLab}인 상태에 ${name}으로 ${god}(${group})이 들어옵니다. ${dir}입니다.`];
    if (movedTo) parts.push(`이 기운이 얹히면서 일간은 ${bodyLab}에서 ${movedTo}으로 옮겨갑니다.`);
    if (ex.yong) parts.push('이 사주가 필요로 하는 기운이라 힘이 붙습니다.');
    if (ex.missing) parts.push('원국에 없던 기운이 채워집니다.');
    if (ex.chung) parts.push('누적된 지지와 부딪혀(충) 변동이 커집니다.');
    if (ex.hap) parts.push('누적된 지지와 합을 이뤄 일이 붙습니다.');
    if (ex.bokeum) parts.push('같은 글자가 겹쳐(복음) 감정이 크게 느껴질 수 있습니다.');
    void rels;
    return parts.join(' ');
  }

  // ───────── 기간 스캔 ─────────
  // 좌표는 아무 날짜에나 찍을 수 있다. 대운·세운을 물으면 그 기간을 날짜 단위로 훑어
  // 언제가 좋고 언제가 나쁜지를 확정한다. (LLM에게 시기를 지어내게 두지 않는다)
  const DAY_MS = 86400000;

  /** 하루의 좌표 — 대운·세운·월운·일운 네 층의 평균. 시운은 시각이 정해져야 의미가 있어 뺀다. */
  function dayCoord(result, when) {
    const st = stack(result, when);
    const live = st.layers.filter(l => l.level > 1 && l.name !== '시운' && typeof l.value === 'number');
    if (!live.length) return null;
    const v = live.reduce((a, l) => a + l.value, 0) / live.length;
    const dayL = st.layers.find(l => l.name === '일운');
    return {
      value: Math.round(v * 100) / 100,
      god: dayL ? dayL.god : null,
      ganji: dayL ? dayL.ganji : null,
      sign: SIGN(v),
    };
  }

  /** from~to 를 날짜 단위로 훑는다.
   *  @returns {{days, months, years, best, worst, turns, span}} */
  function periodScan(result, from, to, opts) {
    const topN = (opts && opts.topN) || 5;
    const a = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0, 0);
    const b = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 12, 0, 0, 0);
    const days = [];
    for (let t = a.getTime(); t <= b.getTime(); t += DAY_MS) {
      const d = new Date(t);
      const c = dayCoord(result, d);
      if (!c) continue;
      days.push({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(),
                  date: new Date(t), value: c.value, god: c.god, ganji: c.ganji, sign: c.sign });
    }
    if (!days.length) return { days: [], months: [], years: [], best: [], worst: [], turns: [], span: 0 };

    const bucket = (keyFn) => {
      const map = new Map();
      days.forEach(r => {
        const k = keyFn(r);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
      });
      return [...map.entries()].map(([k, rows]) => {
        const avg = rows.reduce((s, r) => s + r.value, 0) / rows.length;
        const bestRow = rows.reduce((x, r) => (r.value > x.value ? r : x), rows[0]);
        const worstRow = rows.reduce((x, r) => (r.value < x.value ? r : x), rows[0]);
        return { key: k, y: rows[0].y, m: rows[0].m, n: rows.length,
                 avg: Math.round(avg * 100) / 100, sign: SIGN(avg), best: bestRow, worst: worstRow };
      });
    };
    const months = bucket(r => r.y * 100 + r.m);
    const years  = bucket(r => r.y).map(o => ({ ...o, m: null }));

    // 대운·세운은 기간 내내 상수라 하루 편차를 눌러버린다.
    // 기저(baseline)와 편차(rel)를 나눠야 "이 기간 안에서 언제가 높은가"가 보인다.
    const baseline = Math.round((days.reduce((s2, r) => s2 + r.value, 0) / days.length) * 100) / 100;
    days.forEach(r => { r.rel = Math.round((r.value - baseline) * 100) / 100; });
    months.forEach(o => { o.rel = Math.round((o.avg - baseline) * 100) / 100; });
    years.forEach(o => { o.rel = Math.round((o.avg - baseline) * 100) / 100; });

    // 여러 달에 걸친 스캔은 달마다 하나씩만 뽑는다 (안 그러면 한 달에서 다 나온다).
    // 한 달짜리 스캔은 그 달 안에서 그냥 상위 N개를 뽑는다.
    const spread = months.length > 1;
    const pick = (rows, dir) => {
      const sorted = rows.slice().sort((x, y2) => dir * (y2.value - x.value) || (x.date - y2.date));
      const out = spread
        ? sorted.filter((r, i, arr) => arr.findIndex(o => o.y === r.y && o.m === r.m) === i)
        : sorted;
      return out.slice(0, topN);
    };
    // 부호가 바뀌는 달 — 흐름이 뒤집히는 시점
    const turns = [];
    for (let i = 1; i < months.length; i++) {
      const p0 = months[i - 1], c0 = months[i];
      if ((p0.rel > 0.3 && c0.rel < -0.3) || (p0.rel < -0.3 && c0.rel > 0.3)) {
        turns.push({ from: p0, to: c0, dir: c0.avg > p0.avg ? 'up' : 'down' });
      }
    }
    const best = pick(days, 1);
    const worst = pick(days, -1);

    // 화면이 분기하지 않도록 표시 단위를 여기서 정해 cells 로 내보낸다
    const gran = years.length > 1 ? 'year' : (months.length > 1 ? 'month' : 'day');
    const cells = gran === 'year' ? years.map(o => ({ ...o, label: String(o.y).slice(2), name: o.y + '년' }))
                : gran === 'month' ? months.map(o => ({ ...o, label: String(o.m), name: o.m + '월' }))
                : days.map(o => ({ ...o, label: (o.d % 5 === 0 || o.d === 1) ? String(o.d) : '',
                                   name: o.m + '월 ' + o.d + '일' }));
    return { granularity: gran, cells, days, months, years, best, worst, turns, baseline, spread, span: days.length };
  }

  // ───────── 오늘 12시진 곡선 ─────────
  // 같은 하루라도 시진마다 用이 달라진다. 시운 층까지 쌓은 판정을 12번 내서 하루의 모양을 만든다.
  const JIN = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
  const HOUR_LABEL = {
    順: { 비견:'사람과 힘을 합치기 좋은 때', 겁재:'밀어붙이는 힘이 붙는 때',
          식신:'말과 손이 잘 풀리는 때',     상관:'아이디어가 튀어나오는 때',
          편재:'돈과 실물이 움직이는 때',     정재:'실속이 남는 때',
          편관:'밀어붙여 돌파하는 때',       정관:'공식적인 일이 통하는 때',
          편인:'감이 트이는 때',            정인:'배우고 정리하기 좋은 때' },
    平: { 비견:'나란히 가는 때',            겁재:'힘이 팽팽한 때',
          식신:'잔잔히 굴러가는 때',        상관:'조용히 다듬는 때',
          편재:'오가는 것이 비등한 때',      정재:'유지되는 때',
          편관:'긴장이 유지되는 때',        정관:'형식대로 가는 때',
          편인:'생각이 도는 때',            정인:'쉬어가는 때' },
    逆: { 비견:'몫이 갈리기 쉬운 때',        겁재:'지출과 경쟁이 붙는 때',
          식신:'말이 헛도는 때',            상관:'말이 앞서 탈나기 쉬운 때',
          편재:'새는 돈이 생기는 때',        정재:'계산이 어긋나는 때',
          편관:'압박이 몰리는 때',          정관:'규칙에 걸리는 때',
          편인:'생각만 많아지는 때',        정인:'늘어지기 쉬운 때' },
  };

  /** 오늘 하루를 12시진으로 끊어 각 시진의 用을 판정한다.
   *  @returns {{rows:Array, peak:Object, low:Object, nowIndex:number}} */
  function hourCurve(result, when) {
    when = when || new Date();
    const base = new Date(when.getFullYear(), when.getMonth(), when.getDate());
    const rows = [];
    for (let h = 0; h < 24; h += 2) {
      const at = new Date(base.getTime()); at.setHours(h, 30, 0, 0);
      const L = stack(result, at).layers.find(l => l.name === '시운');
      if (!L) continue;
      const jin = JIN[Math.floor(((h + 1) % 24) / 2)];
      const from = (h + 23) % 24, to = (h + 1) % 24;
      rows.push({
        hour: h, jin, ganji: L.ganji, god: L.god, group: L.group,
        value: L.value, sign: L.sign,
        range: String(from).padStart(2, '0') + '~' + String(to).padStart(2, '0'),
        label: (HOUR_LABEL[L.sign] || {})[L.god] || '',
      });
    }
    if (!rows.length) return { rows: [], peak: null, low: null, nowIndex: -1 };
    const nowJin = Math.floor(((when.getHours() + 1) % 24) / 2);
    // 최고·최저가 동점이면(하루 평균 2.3개) 지금부터 가장 가까운 다가오는 시진을 고른다.
    // 첫 번째 것을 그냥 남기면 자·축·인시(한밤~새벽)로 쏠려서, 오후에 열어본 사람에게
    // "가장 센 때는 지나간 새벽"이라고 알려주게 된다. 같은 값이면 쓸 수 있는 쪽이 답이다.
    const near = (r) => (JIN.indexOf(r.jin) - nowJin + 12) % 12;
    const pickBy = (better) => {
      let bestV = rows[0].value;
      for (const r of rows) if (better(r.value, bestV)) bestV = r.value;
      return rows.filter(r => r.value === bestV).reduce((a, b) => (near(b) < near(a) ? b : a));
    };
    const peak = pickBy((x, y) => x > y);
    const low  = pickBy((x, y) => x < y);
    return { rows, peak, low, nowIndex: rows.findIndex(r => JIN.indexOf(r.jin) === nowJin) };
  }

  /** 하루를 12시진으로 훑는다. 일·시 단위 질문에 쓴다. periodScan 과 같은 모양으로 돌려준다. */
  function hourScan(result, when, opts) {
    const topN = (opts && opts.topN) || 5;
    const hc = hourCurve(result, when);
    if (!hc.rows.length) return { granularity:'hour', cells:[], days:[], months:[], years:[],
                                  best:[], worst:[], turns:[], baseline:0, spread:false, span:0 };
    const y = when.getFullYear(), m = when.getMonth() + 1, d = when.getDate();
    const rows = hc.rows.map(r => ({
      ...r, y, m, d, date: new Date(y, m - 1, d, r.hour, 30),
      label: r.jin, name: r.range + '시 ' + r.jin + '시',
      key: r.hour, avg: r.value,
    }));
    const baseline = Math.round((rows.reduce((s2, r) => s2 + r.value, 0) / rows.length) * 100) / 100;
    rows.forEach(r => { r.rel = Math.round((r.value - baseline) * 100) / 100; });
    const sorted = rows.slice().sort((a, b) => b.value - a.value || a.hour - b.hour);
    const turns = [];
    for (let i = 1; i < rows.length; i++) {
      const p0 = rows[i - 1], c0 = rows[i];
      if ((p0.rel > 0.3 && c0.rel < -0.3) || (p0.rel < -0.3 && c0.rel > 0.3))
        turns.push({ from: p0, to: c0, dir: c0.value > p0.value ? 'up' : 'down' });
    }
    return { granularity:'hour', cells: rows, days: rows, months: [], years: [],
             best: sorted.slice(0, topN), worst: sorted.slice(-topN).reverse(),
             turns, baseline, spread: false, span: rows.length };
  }

  global.ChaeksaChaeyong = { stack, hourCurve, hourScan, periodScan, dayCoord, WEIGHT, judge, strengthOf, hourPillarOf, HOUR_LABEL };
})(window);
