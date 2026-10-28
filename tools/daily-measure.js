// 「오늘의 나」 엔진 확인(10-28 · COPY-0020 끝 기준) — 십성 변화 엔진(app/sipseong-byeonhwa.js)만으로
// ① 하루마다 판이 바뀌나 ② 같은 날 사람마다 갈리나 ③ 변화가 약한 날이 얼마나 되나 ④ 오늘이 이번 달 바탕과 이어지나를 센다.
// 쓰기: node tools/daily-measure.js [사람 수=1000] [날 수=60] [기준일=2026-11-01]
'use strict';
const fs = require('fs'), path = require('path'), A = path.join(__dirname, '../app');
globalThis.window = globalThis;
for (const f of ['engine.js', 'sipseong.js', 'sipseong-byeonhwa.js']) eval(fs.readFileSync(path.join(A, f), 'utf8'));
const E = globalThis.ChaeksaEngine, B = globalThis.ChaeksaByeonhwa;
const N = +process.argv[2] || 1000, DAYS = +process.argv[3] || 60, [y, m, d] = (process.argv[4] || '2026-11-01').split('-').map(Number);
let seed = 777; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const people = Array.from({ length: N }, () => E.calc({ year: 1960 + rnd(50), month: 1 + rnd(12), day: 1 + rnd(28), hour: rnd(24), minute: rnd(60), gender: rnd(2) ? 'F' : 'M', longitude: 127, tzOffset: 9 }));
const 판 = W => W.용.천간.십신 + '/' + W.용.지지.십신 + '|' + W.용.천간.상태 + '·' + W.용.지지.상태 + '|원국:' + W.용.천간.원국대비 + '·' + W.용.지지.원국대비;
const pct = (a, b) => (a / b * 100).toFixed(1) + '%';
// ① ③ ④
const 폭 = {}; let 같은날 = 0, 새0 = 0, 이어 = 0, 줄 = 0, 칸 = 0; const 갈래 = [];
for (const R of people.slice(0, 200)) {
  let prev = null; const s = new Set();
  for (let i = 0; i < DAYS; i++) {
    const V = B.변화(B.층표(R, new Date(y, m - 1, d + i))), W = B.말(V), k = 판(W);
    s.add(k); if (k === prev) 같은날++; prev = k; 칸++;
    if (V.새로온수 === 0) 새0++; 폭[V.변동폭] = (폭[V.변동폭] || 0) + 1;
    for (const c of ['천간', '지지']) { 줄++; if (V.용[c].상태 === '이어짐') 이어++; }
  }
  갈래.push(s.size);
}
console.log(`① 하루마다: 한 사람 ${DAYS}일 동안 서로 다른 판 평균 ${(갈래.reduce((a, b) => a + b, 0) / 갈래.length).toFixed(1)}가지 · 어제와 같은 판 ${pct(같은날, 칸)}`);
console.log(`③ 약한 날: 새로 온 십성 0 ${pct(새0, 칸)} · 변동폭 분포 ` + Object.keys(폭).sort().map(k => k + ':' + pct(폭[k], 칸)).join(' '));
console.log(`④ 이어짐: 오늘 글자 줄 중 이번 달 바탕에서 이어짐 ${pct(이어, 줄)} · 새로 옴 ${pct(줄 - 이어, 줄)}`);
// ②
const day = new Date(y, m - 1, d), A1 = new Map(), A2 = new Map();
for (const R of people) { const W = B.말(B.변화(B.층표(R, day))); const k1 = W.용.천간.십신 + '/' + W.용.지지.십신, k2 = 판(W); A1.set(k1, (A1.get(k1) || 0) + 1); A2.set(k2, (A2.get(k2) || 0) + 1); }
const top = M => { const a = [...M].sort((p, q) => q[1] - p[1]); return a.length + '갈래 · 1위 ' + pct(a[0][1], N); };
console.log(`② 같은 날(${process.argv[4] || '2026-11-01'}) ${N}명: 오늘 십성만 ${top(A1)} · 원국에 그 십성이 있나(겉 · 속 · 없음)까지 ${top(A2)}`);
