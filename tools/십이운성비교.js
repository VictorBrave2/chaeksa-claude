/* 십이운성 도입 vs 미도입 비교. 실험용 — 엔진을 바꾸지 않는다.
 *
 * 재는 것
 *   1) 120칸(일간10 × 지지12) 에서 현재 판정과 십이운성 판정이 어긋나는 칸
 *   2) 실제 사주 400개에서 강약 라벨이 얼마나 바뀌는가
 *
 * 판본 둘을 나란히 본다
 *   역행판 : 양간 순행 · 음간 역행 (통상)
 *   동생판 : 음양동생동사 — 음간도 양간과 같은 자리를 쓴다 (적천수 계열)
 */
(() => {
const E = window.ChaeksaEngine;
const 단계 = ['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'];
// 장생지 — 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯
const 장생 = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

/** 일간 ds 가 지지 b 에서 몇 단계인가 */
function unseong(ds, b, 동생) {
  const 양 = E.STEM_YANG[ds] === 1;
  // 동생판은 음간도 짝이 되는 양간의 자리를 그대로 쓴다 (乙→甲, 丁→丙, ...)
  const base = 동생 ? 장생[ds - (양 ? 0 : 1)] : 장생[ds];
  const 순행 = 동생 ? true : 양;
  const step = 순행 ? (b - base + 12) % 12 : (base - b + 12) % 12;
  return 단계[step];
}

// 12단계를 반으로 갈라 '도움/소모' 로 본다. 눈금을 새로 지어내지 않기 위해서다.
const 도움단계 = ['장생', '목욕', '관대', '건록', '제왕', '양'];
const 도움인가 = (s) => 도움단계.indexOf(s) >= 0;

// ── 1) 120칸 전수 대조 ──
function 칸대조(동생) {
  const 어긋 = [];
  for (let ds = 0; ds < 10; ds++) for (let b = 0; b < 12; b++) {
    const 현재 = E.siding(E.STEM_ELEM[ds], E.BRANCH_ELEM[b]) > 0;
    const s = unseong(ds, b, 동생);
    if (현재 !== 도움인가(s))
      어긋.push(`${E.STEMS[ds]}${E.BRANCHES[b]} ${s} — 현재 ${현재 ? '도움' : '소모'} / 운성 ${도움인가(s) ? '도움' : '소모'}`);
  }
  return 어긋;
}

// ── 2) 실제 사주에서 강약이 얼마나 바뀌나 ──
function 강약(R, 방식, 동생) {
  const p = R.pillars, ds = p.day.stem, de = E.STEM_ELEM[ds], W = E.NATAL_WEIGHT;
  const seats = [
    ['stem', p.year.stem, W.yearStem], ['branch', p.year.branch, W.yearBranch],
    ['stem', p.month.stem, W.monthStem], ['branch', p.month.branch, W.monthBranch],
    ['branch', p.day.branch, W.dayBranch],
  ];
  if (p.hour) { seats.push(['stem', p.hour.stem, W.hourStem]); seats.push(['branch', p.hour.branch, W.hourBranch]); }
  let sup = 0, tot = 0;
  seats.forEach(([kind, v, w]) => {
    tot += w;
    let 도움;
    if (kind === 'stem') 도움 = E.siding(de, E.STEM_ELEM[v]) > 0;         // 천간은 그대로
    else if (방식 === '현재') 도움 = E.siding(de, E.BRANCH_ELEM[v]) > 0;
    else 도움 = 도움인가(unseong(ds, v, 동생));                            // 지지만 운성으로
    if (도움) sup += w;
  });
  const got = E.BRANCH_ELEM[p.month.branch] === de || E.BRANCH_ELEM[p.month.branch] === (de + 4) % 5;
  if (got) { sup += 0.6; tot += 0.6; }
  const s = Math.round((sup / tot) * 100) / 100;
  return { s, label: E.STRENGTH_LABEL(s) };
}

const out = {};
[['역행판', false], ['동생판', true]].forEach(([이름, 동생]) => {
  const 어긋 = 칸대조(동생);
  let n = 0, 바뀜 = 0, 최대 = null;
  const 분포 = {};
  const 사례 = [];
  for (let i = 0; i < 400; i++) {
    const y = 1960 + (i * 7919) % 60, m = 1 + (i * 104729) % 12,
          d = 1 + (i * 1299709) % 28, hh = (i * 15485863) % 24;
    let R; try {
      R = E.calc({ year: y, month: m, day: d, hour: hh, minute: 30, gender: i % 2 ? 'F' : 'M',
        place: 'KR:서울', longitude: 126.98, tzOffset: null, solarCorrection: true });
    } catch (e) { continue; }
    n++;
    const a = 강약(R, '현재'), b = 강약(R, '운성', 동생);
    분포[b.label] = (분포[b.label] || 0) + 1;
    const diff = b.s - a.s;
    if (!최대 || Math.abs(diff) > Math.abs(최대.diff))
      최대 = { diff: Math.round(diff * 100) / 100, 현재: `${a.label} ${a.s}`, 운성: `${b.label} ${b.s}` };
    if (a.label !== b.label) {
      바뀜++;
      if (사례.length < 3) 사례.push(
        `${['year','month','day','hour'].map(k => E.fmt.pillar(R.pillars[k])).join(' ')} — 현재 ${a.label}(${a.s}) / 운성 ${b.label}(${b.s})`);
    }
  }
  out[이름] = {
    '120칸 중 어긋나는 칸': 어긋.length,
    '어긋나는 칸 일부': 어긋.slice(0, 6),
    '강약 라벨이 바뀌는 비율': `${바뀜}건 / ${n} (${Math.round(바뀜 / n * 1000) / 10}%)`,
    '운성판 분포': ['신강','중화','신약'].map(k => `${k} ${Math.round((분포[k] || 0) / n * 1000) / 10}%`).join(' · '),
    '점수 최대변동': 최대,
    사례: 사례,
  };
});

// 두 판본이 서로 다른 칸
const 판본차 = [];
for (let ds = 0; ds < 10; ds++) for (let b = 0; b < 12; b++) {
  const a = unseong(ds, b, false), c = unseong(ds, b, true);
  if (a !== c) 판본차.push(`${E.STEMS[ds]}${E.BRANCHES[b]} : 역행판 ${a} / 동생판 ${c}`);
}
out['두 판본이 다른 칸'] = { 개수: 판본차.length, 일부: 판본차.slice(0, 6) };
out['확인용 — 壬癸의 자리'] = ['壬子','壬亥','癸子','癸亥'].map(t => {
  const ds = E.STEMS.indexOf(t[0]), b = E.BRANCHES.indexOf(t[1]);
  return `${t} : 역행판 ${unseong(ds, b, false)} / 동생판 ${unseong(ds, b, true)}`;
});
return JSON.stringify(out, null, 1);
})()
