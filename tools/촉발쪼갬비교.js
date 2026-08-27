/* 촉발 무게 — 현재(층 단위) vs 쪼갬(천간/지지) 비교 실험. 커밋 대상 아님. */
(() => {
const E = window.ChaeksaEngine, CY = window.ChaeksaChaeyong;
const GROUP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성', 정재:'재성',
                편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
const T = CY.TRIGGER;                       // 현재: 층당 하나
const Ts = {}, Tb = {};                     // 쪼갬: 천간 1 : 지지 2 로 나눈다 (합은 같게)
Object.keys(T).forEach(k => { Ts[k] = T[k] / 3; Tb[k] = T[k] * 2 / 3; });

function split(R, S) {
  const a = R.analysis, ds = a.dayStem;
  let num = 0, den = 0, top = null;
  const parts = [];
  S.layers.filter(l => l.level > 1 && typeof l.value === 'number' && T[l.name]).forEach(l => {
    // 간지 문자열에서 지지를 꺼낸다
    const br = E.BRANCHES.indexOf((l.ganji || '').charAt(1));
    if (br < 0) return;
    const ex = l.extras || {};
    // 천간 판정 — 십신만. 지지 관계(충·합·복음)는 빼고 본다.
    const vS = CY.judge(l.bodyStrength, l.group,
      { yong: ex.yong, missing: ex.missing, chung: false, hap: false, bokeum: false });
    // 지지 판정 — 지지 정기의 십신 + 지지 관계
    const 지지십신 = E.TEN_GODS[E.tenGod(ds, E.HIDDEN[br][0])];
    const 지지오행 = E.ELEM[E.BRANCH_ELEM[br]];
    const vB = CY.judge(l.bodyStrength, GROUP[지지십신], {
      yong: a.yongCandidates.includes(지지오행),
      missing: a.missing.includes(지지오행),
      chung: ex.chung, hap: ex.hap, bokeum: ex.bokeum });
    const pull = vS * Ts[l.name] + vB * Tb[l.name];
    num += pull; den += Ts[l.name] + Tb[l.name];
    if (!top || Math.abs(pull) > Math.abs(top.pull)) top = { name: l.name, pull };
    parts.push({ 층: l.name, 간지: l.ganji, 천간판정: vS, 지지판정: vB,
                 당김: Math.round(pull * 100) / 100, 합쳐진현재값: l.value });
  });
  if (!den) return null;
  return { trigger: Math.round((num / den) * 10) / 10,
           triggerBy: top && Math.abs(top.pull) >= 1 ? top.name : null, parts };
}

let n = 0, 부호뒤집힘 = 0, 방아쇠다름 = 0, 차이합 = 0, 최대차 = null;
const 사례 = [];
for (let i = 0; i < 400; i++) {
  const y = 1960 + (i * 7919) % 60, m = 1 + (i * 104729) % 12,
        d = 1 + (i * 1299709) % 28, hh = (i * 15485863) % 24;
  let R, S, X;
  try {
    R = E.calc({ year: y, month: m, day: d, hour: hh, minute: 30, gender: i % 2 ? 'F' : 'M',
      place: 'KR:서울', longitude: 126.98, tzOffset: null, solarCorrection: true });
    S = CY.stack(R, new Date(Date.UTC(2027, i % 12, 1 + (i % 27), 3 + (i % 20))));
    X = split(R, S);
  } catch (e) { continue; }
  if (!X) continue;
  n++;
  const diff = X.trigger - S.trigger;
  차이합 += Math.abs(diff);
  if ((S.trigger > 0.3 && X.trigger < -0.3) || (S.trigger < -0.3 && X.trigger > 0.3)) 부호뒤집힘++;
  if ((S.triggerBy || '-') !== (X.triggerBy || '-')) 방아쇠다름++;
  if (!최대차 || Math.abs(diff) > Math.abs(최대차.diff))
    최대차 = { diff: Math.round(diff * 100) / 100, 현재: S.trigger, 쪼갬: X.trigger };
  // 천간과 지지가 서로 다른 방향인 층 — 지금 방식이 뭉개는 자리
  X.parts.forEach(p => {
    if (사례.length < 4 && p.천간판정 > 0.5 && p.지지판정 < -0.5)
      사례.push(`${p.층} ${p.간지} : 천간 +${p.천간판정} / 지지 ${p.지지판정} → 현재는 ${p.합쳐진현재값} 하나로 뭉갬`);
  });
}
return JSON.stringify({
  표본: n,
  평균차이: Math.round(차이합 / n * 1000) / 1000,
  촉발_부호가_뒤집힌_경우: `${부호뒤집힘}건 (${Math.round(부호뒤집힘 / n * 1000) / 10}%)`,
  방아쇠_층이_달라진_경우: `${방아쇠다름}건 (${Math.round(방아쇠다름 / n * 1000) / 10}%)`,
  최대차이: 최대차,
  천간과_지지가_반대인_층_사례: 사례,
}, null, 1);
})()
