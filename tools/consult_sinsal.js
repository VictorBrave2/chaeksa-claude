// 상담 후보 시각마다 귀인 · 신살 이름을 꼬리표로 — 10-14 사장님 「순위 필터엔 넣지 말고 신살도 넣어 봐」.
// 계산은 비공개 core 의 정통사주 엔진(samyeong.js — 삼명통회 卷三 근거) 그대로. 순위에 쓰지 않는다.
//   node tools/consult_sinsal.js <나갈.json> <곳 KR:성남> <M|F> 2027-01-14T10:39 …
//   → [{ 시각, 귀인:[이름], 신살:[이름], 줄:{이름: 어디에 있나} }]
const fs = require('fs');
const BS = require('C:/Users/LEE/Desktop/chaeksa-behavior-core/lib/brain-saju.js');
const { SM } = BS.엔진();
const [out, place, g, ...when] = process.argv.slice(2);
const rows = when.map(w => {
  const [날, 때] = w.split('T'); const [y, mo, d] = 날.split('-').map(Number); const [h, m] = 때.split(':').map(Number);
  const R = BS.명식({ year: y, month: mo, day: d, hour: h, minute: m, gender: g, place });
  const 귀 = SM.귀인(R) || [], 살 = SM.신살(R) || [], 줄 = {};
  [...귀, ...살].forEach(x => { 줄[x.이름] = (x.줄 || []).join(' '); });
  return { 시각: w, 귀인: 귀.map(x => x.이름), 신살: 살.map(x => x.이름), 줄 };
});
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
rows.forEach(r => console.log(r.시각 + ' | 귀인 ' + (r.귀인.join(' · ') || '없음') + ' | 신살 ' + (r.신살.join(' · ') || '없음')));
