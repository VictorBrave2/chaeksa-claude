// 오늘의 운세 사건 빈도 — 엔진으로 잰다(10-28 사장님 「사건 빈도수를 측정하란 뜻이야」 · 「고객이 맞았어요 틀렸어요 하려고 재방문을 하냐고」).
//   node tools/today-freq.js [사람=1000] [날=365]
// 무작위 명식 × 2026-11-01 부터 하루하루 ChaeksaToday.오늘() 의 첫 줄(손님이 크게 읽는 문장)을 센다.
//   하루 몫     = 모든 사람 · 모든 날 가운데 이 문장이 첫 줄인 몫
//   1년에 받는 사람 = 1년 안에 한 번이라도 받는 사람 몫
//   한 사람 날수 = 받는 사람의 1년 날수(가운데값)
//   다시 오는 간격 = 같은 사람에게 다음에 다시 올 때까지 날수(가운데값, 이어 붙은 날은 한 번으로)
// 결과는 copy-requests/ref/today-freq.json 에도 남긴다(글 담당이 「얼마나 드문 날인가」를 볼 수 있게).
'use strict';
const fs = require('fs'), path = require('path'), A = path.join(__dirname, '../app');
globalThis.window = globalThis;
for (const f of ['engine.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js']) eval(fs.readFileSync(path.join(A, f), 'utf8'));
const T = globalThis.ChaeksaToday, E = globalThis.ChaeksaEngine;
const N = +process.argv[2] || 1000, D = +process.argv[3] || 365;
let seed = 777; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const 사람 = Array.from({ length: N }, () => E.calc({ year: 1960 + rnd(50), month: 1 + rnd(12), day: 1 + rnd(28), hour: rnd(24), minute: rnd(60), gender: rnd(2) ? 'F' : 'M', longitude: 127, tzOffset: 9 }));
const 가운데 = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const 묶음 = { 열쇠: {}, 십신: {} };   // 이름 → { 날: 0, 사람날: [], 간격: [] }
const 칸 = (m, k) => m[k] || (m[k] = { 날: 0, 사람날: [], 간격: [] });
let 조용날 = 0;
for (const R of 사람) {
  const 이번 = { 열쇠: {}, 십신: {} };   // 이름 → 날 번호들
  for (let i = 0; i < D; i++) {
    const v = T.오늘(R, new Date(2026, 10, 1 + i));
    if (v.조용) 조용날++;
    const 이름 = { 열쇠: v.조용 ? '조용' : v.첫줄.열쇠, 십신: v.조용 ? '조용' : v.첫줄.쪽 + '|' + v.첫줄.십신 };
    for (const g of ['열쇠', '십신']) { 칸(묶음[g], 이름[g]).날++; (이번[g][이름[g]] = 이번[g][이름[g]] || []).push(i); }
  }
  for (const g of ['열쇠', '십신']) for (const [k, 날들] of Object.entries(이번[g])) {
    const c = 칸(묶음[g], k); c.사람날.push(날들.length);
    let 앞 = null; for (const d of 날들) { if (앞 != null && d - 앞 > 1) c.간격.push(d - 앞); 앞 = d; }
  }
}
const 전체 = N * D, 결과 = {};
for (const g of ['십신', '열쇠']) {
  결과[g] = Object.entries(묶음[g]).map(([k, c]) => ({ 이름: k, 하루몫: +(c.날 / 전체 * 100).toFixed(2), 받는사람: +(c.사람날.length / N * 100).toFixed(1), 한사람날수: 가운데(c.사람날), 다시오는간격: 가운데(c.간격) })).sort((a, b) => b.하루몫 - a.하루몫);
  console.log('\n' + (g === '십신' ? '쪽 + 십신(대비 합침)' : '조각 열쇠(화면 문장 하나)') + ' — ' + N + '명 × ' + D + '일');
  console.log('  이름'.padEnd(24) + '하루 몫  1년에 받는 사람  한 사람 날수  다시 오는 간격');
  결과[g].forEach(r => console.log('  ' + r.이름.padEnd(22) + String(r.하루몫 + '%').padStart(7) + String(r.받는사람 + '%').padStart(14) + String(r.한사람날수 + '일').padStart(12) + String(r.다시오는간격 + '일').padStart(14)));
}
console.log('\n조용한 날 ' + (조용날 / 전체 * 100).toFixed(1) + '%');
fs.writeFileSync(path.join(__dirname, '../copy-requests/ref/today-freq.json'), JSON.stringify({ 잰날: '2026-11-01부터 ' + D + '일', 사람: N, 조용한날: +(조용날 / 전체 * 100).toFixed(1), ...결과 }, null, 1));
