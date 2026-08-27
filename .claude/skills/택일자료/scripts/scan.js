/* 택일 스캔 — chaeksa.kr 에서 javascript_tool 로 실행한다.
 *
 * 맨 아래 CONFIG 만 바꾸면 된다.
 * 결과는 그대로 읽고 판단하면 되도록 한국어 키로 돌려준다.
 *
 * 주의: Node 에서는 안 돈다. 명리 엔진이 브라우저 전역(window.ChaeksaEngine)에 있다.
 */
(() => {
const E = window.ChaeksaEngine;
if (!E) return { 오류: 'ChaeksaEngine 없음 — chaeksa.kr 이 열려 있는지 확인' };

const JIN = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const EL  = ['목','화','토','금','수'];
const DOW = ['일','월','화','수','목','금','토'];

const isChung = (a, b) => ((b - a + 12) % 12) === 6;
const YUKHAP = {0:1,1:0,2:11,11:2,3:10,10:3,4:9,9:4,5:8,8:5,6:7,7:6};
const SAMHAP = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
const rel = (a, b) =>
  a === b ? '복음'
  : isChung(a, b) ? '충'
  : YUKHAP[a] === b ? '육합'
  : SAMHAP.some(g => g.includes(a) && g.includes(b)) ? '삼합'
  : null;

const NM = ['연지','월지','일지','시지'];

/** 한 후보를 채점한다. 기준은 SKILL.md 에 적힌 그대로.
 *  100점 만점이지만 절대 점수가 아니라 같은 기간 안에서의 서열용이다. */
function score(R) {
  const p = R.pillars, a = R.analysis, ec = a.elemCount, ds = p.day.stem;
  const br = ['year','month','day','hour'].map(k => p[k].branch);

  let chung = [], hap = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const r = rel(br[i], br[j]);
    if (r === '충') chung.push(`${NM[i]}-${NM[j]}`);
    else if (r === '육합' || r === '삼합') hap.push(`${NM[i]}-${NM[j]} ${r}`);
  }

  // 유통 — 목→화→토→금→수→목 사슬에서 끊기지 않고 이어지는 최대 칸수
  let flow = 0;
  for (let s = 0; s < 5; s++) {
    let n = 0;
    for (let i = 0; i < 5; i++) { if (ec[(s + i) % 5] > 0) n++; else break; }
    flow = Math.max(flow, n);
  }

  // 통근 — 일간이 네 지지 중 몇 곳에 뿌리를 내렸나. '튼튼함'의 실체.
  const de = E.STEM_ELEM[ds];
  const root = br.filter(b => E.HIDDEN[b].some(h => E.STEM_ELEM[h] === de)).length;

  const missing = a.missing.length;
  const balance = Math.abs(a.strengthScore - 0.5);

  let s = 100;
  s -= missing * 13;              // 빈 오행 하나당
  s -= balance * 90;              // 중화에서 먼 만큼
  s -= chung.length * 11;
  s += Math.min(8, root * 3);     // 뿌리는 가점
  s += (flow - 3) * 4;            // 유통 3칸을 기준으로 가감
  // 조후 — 궁통보감 조후용신표(classic.js)로. 계절 근사를 표로 교체 (50→+10, 30→+2, 0→-10)
  const jh = window.ChaeksaClassic ? window.ChaeksaClassic.gungtong(R) : null;
  if (jh) s += ((jh.score - 25) / 25) * 10;
  if (a.gotMonth) s += 4;

  return {
    점수: Math.max(0, Math.round(s)),
    강약: a.strength, 강약값: a.strengthScore,
    오행: ec.map((n, i) => EL[i] + n).join(' '),
    없는오행: a.missing.join('·') || '없음',
    유통: flow + '/5', 통근: root,
    충: chung.join(', ') || '없음',
    합: hap.join(', ') || '없음',
  };
}

function run(CONFIG) {
  const { year, month, lon = 126.98, place = 'KR:서울', gender = 'M',
          parents = [], dayFrom = 8.5, dayTo = 17 } = CONFIG;
  const last = new Date(year, month, 0).getDate();
  const rows = [];

  for (let d = 1; d <= last; d++) {
    for (let hh = 0; hh < 24; hh += 2) {
      let R;
      try {
        R = E.calc({ year, month, day: d, hour: hh, minute: 30, gender,
                     place, longitude: lon, tzOffset: null, solarCorrection: true });
      } catch (e) { continue; }

      const v = score(R);
      const br = ['year','month','day','hour'].map(k => R.pillars[k].branch);
      const 부모관계 = parents.map(P => {
        const rs = br.map((b, i) => { const r = rel(P.branch, b); return r ? `${NM[i]}와 ${r}` : null; })
                     .filter(Boolean);
        return `${P.name} — ${rs.length ? rs.join(', ') : '특별한 관계 없음'}`;
      });

      const from = (hh + 23) % 24, to = (hh + 1) % 24;
      const c = R.corrected;
      // 주간 여부는 '시계 시각'으로 판정한다. 병원이 보는 건 태양시가 아니라 시계다.
      // E.calc 에 넘긴 hour/minute 이 이미 시계 시각이고(엔진이 안에서 태양시로 보정한다),
      // 후보의 시계 시각은 언제나 hh:30 이다. 여기서 보정폭을 또 더하면 이중 계산이 되어
      // 16:30 이 밤으로 밀리고, 정수 hh 로만 비교하면 08:30 이 밤으로 밀린다.
      const clock = hh * 60 + 30;
      const 주간 = clock >= dayFrom * 60 && clock <= dayTo * 60;
      rows.push({
        일: d, 요일: DOW[new Date(year, month - 1, d).getDay()],
        시진: JIN[Math.floor(((hh + 1) % 24) / 2)],
        시각: `${String(from).padStart(2,'0')}~${String(to).padStart(2,'0')}`,
        주간,
        원국: ['year','month','day','hour'].map(k => E.fmt.pillar(R.pillars[k])).join(' '),
        보정: `${String(hh).padStart(2,'0')}:30 → ${String(c.hh).padStart(2,'0')}:${String(c.mm).padStart(2,'0')}`,
        ...v, 부모관계,
        _hh: hh,
      });
    }
  }

  // 점수는 절대값이 아니라 이 기간 안의 서열이다. 0~100 으로 펴서 오해를 줄인다.
  const raw = rows.map(r => r.점수);
  const lo = Math.min(...raw), hi = Math.max(...raw);
  rows.forEach(r => { r.점수 = hi === lo ? 50 : Math.round((r.점수 - lo) / (hi - lo) * 100); });

  const f = r => `${month}/${r.일}(${r.요일}) ${r.시각}시 ${r.시진} ${r.주간?'[주]':'[야]'} ${r.원국}`
    + ` | ${r.점수}점 ${r.강약} · ${r.오행} · 유통${r.유통} 통근${r.통근} · 충 ${r.충}`;
  const by = rows.slice().sort((a, b) => b.점수 - a.점수 || a.일 - b.일 || a._hh - b._hh);

  // 시각 창 — 시계로 몇 시에 잡아야 그 시진이 되나
  // 경도+균시차. 한 달 안에서도 날짜마다 달라서 월 중간 기준으로 안내하고 그 사실을 밝힌다.
  const shift = Math.round(-E.solarOffsetMin(year, month, 15, lon));
  const 시각창 = [];
  for (let i = 0; i < 12; i++) {
    const from = (i * 2 + 23) % 24, to = (i * 2 + 1) % 24;
    const cf = (from * 60 + shift), ct = (to * 60 + shift);
    const fmt = m => `${String(Math.floor((m % 1440) / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
    시각창.push(`${JIN[i]}시 (태양시 ${String(from).padStart(2,'0')}~${String(to).padStart(2,'0')}) → 시계 ${fmt(cf)}~${fmt(ct)}`);
  }

  // 한 달 안에서 절기로 월주가 갈린다. 그것도 자정이 아니라 절입 '시각'에 갈린다.
  // dateFortune 은 시각을 안 받고 정오로 계산해서 경계일을 통째로 앞 절기에 넣어버리고,
  // rows 에서 읽으면 2시간 슬롯 해상도까지밖에 못 좁힌다. 그래서 절입 시각으로 직접 자른다.
  const hm = t => `${String(t.hh).padStart(2,'0')}:${String(t.mm).padStart(2,'0')}`;
  const gzAt = (d, hh, mm) => E.fmt.pillar(E.calc({
    year, month, day: d, hour: hh, minute: mm, gender,
    place, longitude: lon, tzOffset: null, solarCorrection: true }).pillars.month);
  // termsOfYear(Y)는 '입춘 기준' 한 주기다. 그래서 Y년 1월의 절기(소한)는 Y-1 주기에 들어 있고,
  // termsOfYear(Y)의 소한은 Y+1년 1월 것이다. 연도로 걸러내지 않으면 1월 자료에서
  // 이듬해 절기를 집는다 — 2027년 1월은 소한 1/5 23:10인데 2028년 1/6 04:55을 가져왔다.
  const cuts = [].concat(E.fmt.termsOfYear(year - 1) || [], E.fmt.termsOfYear(year) || [])
    .filter(t => t.y === year && t.m === month)
    .sort((a, b) => a.d - b.d || a.hh - b.hh || a.mm - b.mm);
  const pts = [{ d: 1, hh: 0, mm: 0, probe: [1, 12, 0], label: `${month}/1` }]
    .concat(cuts.map(t => ({ d: t.d, hh: t.hh, mm: t.mm,
                             probe: [t.d, t.hh, t.mm], label: `${month}/${t.d} ${hm(t)}` })));
  const at = p => p.d * 1440 + p.hh * 60 + p.mm;
  const ps = pts.filter((p, i) => !pts[i + 1] || at(pts[i + 1]) > at(p));   // 절입이 1일 0시면 앞 구간은 없다
  const seg = ps.map((p, i) =>
    `${p.label}~${ps[i + 1] ? ps[i + 1].label : `${month}/${last}`} ${gzAt(...p.probe)}월`);
  const 절기 = cuts.map(t => `${t.name} ${t.m}/${t.d} ${hm(t)}`);
  // 전 기간에 공통으로 걸린 충 — 날짜를 골라도 못 피하는 것
  const 공통충 = rows.length
    ? rows[0].충.split(', ').filter(c => c !== '없음' && rows.every(r => r.충.includes(c)))
    : [];

  return {
    기간: `${year}년 ${month}월 · ${place} (경도 ${lon})`,
    연주: E.fmt.pillar(E.dateFortune(year, month, 15).year),
    월주구간: seg,
    절기: 절기.length ? 절기 : '이 달에 절기 경계 없음',
    피할수없는충: 공통충.length ? 공통충 : '없음',
    후보수: rows.length,
    점수범위: [by[by.length-1].점수, by[0].점수],
    전체상위: by.slice(0, 8).map(f),
    주간상위: by.filter(r => r.주간).slice(0, 8).map(f),   // 주간은 5슬롯(08:30~16:30)뿐이라 6개면 16:30 으로만 찬다
    야간상위: by.filter(r => !r.주간).slice(0, 5).map(f),
    최하위: by.slice(-4).reverse().map(f),
    통근0: by.filter(r => r.통근 === 0).slice(0, 4).map(f),
    시각창: 시각창,
    보정폭: `${place} 기준 ${shift}분 (경도+균시차 · ${month}/15 기준, 날짜마다 1~2분 다름)`,
    _rows: rows,
  };
}

// ── 여기만 바꾸세요 ──────────────────────────────
// 결과를 window.__택일 에 올려둔다. javascript_tool 은 호출마다 스코프가 사라지므로,
// 상위 목록만 보고 끝낼 게 아니라면 이렇게 남겨두고 다음 호출에서 __택일._rows 를 훑는다.
window.__택일 = run({
  year: 2026,
  month: 10,
  lon: 126.98,          // 서울. 부산 129.08 · 목포 126.39 · 대구 128.60
  place: 'KR:서울',
  gender: 'M',          // 원국은 성별 무관. 대운 방향만 갈린다
  parents: [],          // 예: [{name:'아버지 갑인일주', branch:2}, {name:'어머니 신유일주', branch:9}]
                        // branch 는 지지 인덱스: 자0 축1 인2 묘3 진4 사5 오6 미7 신8 유9 술10 해11
  dayFrom: 8.5, dayTo: 17, // 시계 기준 08:30~17:00. 병원이 흔히 잡는 범위
});
// 요약만 돌려준다. 상세는 window.__택일._rows 에 있다.
return Object.assign({}, window.__택일, { _rows: `(${window.__택일._rows.length}개 — window.__택일._rows 참조)` });
})()
