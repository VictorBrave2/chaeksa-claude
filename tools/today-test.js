// 오늘의 운세 뼈대 시험(10-28). 쓰기: node tools/today-test.js [--strict]
//   --strict : 조각표 빈 글도 실패로(Codex COPY-0020 끝 기준). 없으면 빈 글 수만 알린다.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), A = path.join(__dirname, '../app');
globalThis.window = globalThis;
for (const f of ['engine.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js', 'today-pieces.js']) eval(fs.readFileSync(path.join(A, f), 'utf8'));
const T = globalThis.ChaeksaToday, E = globalThis.ChaeksaEngine, P = globalThis.ChaeksaTodayPieces;
const strict = process.argv.includes('--strict');
let 실패 = 0, 통과 = 0;
const ok = (c, m) => { if (c) 통과++; else { 실패++; console.log('  ✗ ' + m); } };

// 1. 뼈대 지문 — 칸 차례 · 자리 · 조각 열쇠. 바꾸려면 사장님 결정 → 여기 지문 갱신.
const 지문 = crypto.createHash('sha256').update(JSON.stringify([T.뼈대, T.오늘필드, T.열쇠들()])).digest('hex').slice(0, 16);
const 동결 = '4d089cbdf3b7a8fa';   // 10-28 첫 뼈대
ok(지문 === 동결 || 동결 === 'a', '뼈대 지문이 바뀜: ' + 지문 + ' (동결 ' + 동결 + ')');
if (동결 === 'a') console.log('  · 뼈대 지문(처음):', 지문);

// 2. 조각표 = 열쇠 전부, 필드 전부
const 열 = T.열쇠들();
ok(Object.keys(P).length === 열.length && 열.every(k => P[k]), '조각표 열쇠가 뼈대와 다름 — node tools/today-gen.js');

// 3. 무작위 1,000명 × 60일 — 깨지지 않고, 나오는 열쇠는 전부 조각표에, 같은 날 첫 줄 갈래
let seed = 777; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const 사람 = Array.from({ length: 1000 }, () => E.calc({ year: 1960 + rnd(50), month: 1 + rnd(12), day: 1 + rnd(28), hour: rnd(24), minute: rnd(60), gender: rnd(2) ? 'F' : 'M', longitude: 127, tzOffset: 9 }));
const 빈 = new Set(); let 깨짐 = 0, 조용 = 0, 날 = 0;
for (const R of 사람.slice(0, 300)) for (let i = 0; i < 60; i++) {
  try {
    const v = T.오늘(R, new Date(2026, 10, 1 + i)); 날++; if (v.조용) 조용++;
    for (const k of [v.첫줄.열쇠, v.둘째줄 && v.둘째줄.열쇠, ...v.바탕.map(b => b.열쇠), ...v.빠짐.map(b => b.열쇠), v.조용 && '조용'].filter(Boolean)) if (!P[k]) { 깨짐++; console.log('  조각표에 없는 열쇠', k); }
    T.조립(v, P).빈.forEach(x => 빈.add(x));
  } catch (e) { 깨짐++; if (깨짐 < 3) console.log('  ', e.message); }
}
ok(깨짐 === 0, '오늘() · 조립() 깨짐 ' + 깨짐);
ok(조용 / 날 > 0.05 && 조용 / 날 < 0.3, '조용한 날 비율이 이상함 ' + (조용 / 날 * 100).toFixed(1) + '%');
// 같은 날 첫 줄 하나는 일간 10 × 원국대비 3 = 30갈래가 끝이다. 첫 줄 + 둘째 줄을 함께 보면 사람마다 더 갈린다.
const 첫 = new Set(), 둘 = new Set();
사람.forEach(R => { const v = T.오늘(R, new Date(2026, 10, 1)); 첫.add(v.첫줄.열쇠); 둘.add(v.첫줄.열쇠 + '+' + (v.둘째줄 ? v.둘째줄.열쇠 : '-')); });
ok(첫.size >= 25, '같은 날 첫 줄 갈래가 ' + 첫.size + ' — 원국대비가 빠졌나');
console.log('  · 같은 날(2026-11-01) 1,000명: 첫 줄 ' + 첫.size + '갈래 · 첫 줄 + 둘째 줄 ' + 둘.size + '갈래');

// 4. 시간 모름도 선다
let 시모름 = true; try { T.오늘(E.calc({ year: 1990, month: 5, day: 17, hour: null, minute: null, gender: 'F', longitude: 127, tzOffset: 9 }), new Date(2026, 10, 1)); } catch (e) { 시모름 = false; }
ok(시모름, '태어난 시각을 모르는 사람에서 깨짐');

// 5. 이번주 · 이번달
const R0 = 사람[0], 주 = T.이번주(R0, new Date(2026, 10, 1)), 달 = T.이번달(R0, new Date(2026, 10, 1));
ok(주.날들.length === 7 && 주.힘쓸날.every(d => 주.날들.some(x => x.날짜 === d)), '이번주 일곱 날 · 힘쓸날');
ok(달.달바뀜 && /^2026-1[12]-/.test(달.달바뀜.날짜), '이번달 바탕 바뀌는 날(11월 초 기준 12월 입절 무렵)');

// 6. 기록 — 저장 · 다시 읽기 · 사람마다 따로 · 못 쓰는 저장소
const mem = { d: {}, getItem(k) { return this.d[k] || null; }, setItem(k, v) { this.d[k] = String(v); } };
const L = T.기록(mem), v1 = T.오늘(R0, new Date(2026, 10, 1));
ok(L.예고('p1', v1) && L.답('p1', v1.날짜, '다름', 'x'.repeat(300)), '기록 쓰기');
const h = T.기록(mem).하루('p1', v1.날짜);
ok(h && h.예고.첫줄 === v1.첫줄.열쇠 && h.답 === '다름' && h.메모.length === 200, '기록 다시 읽기 · 메모 200자');
ok(T.기록(mem).하루('p2', v1.날짜) === null, '다른 사람 기록이 섞임');
ok(!L.답('p1', v1.날짜, '맞았어요'), '정해진 답 셋 밖을 받음');
ok(T.기록(mem).달('p1', '2026-11').length === 1, '이번 달의 나');
const 고장 = { getItem() { throw new Error('막힘'); }, setItem() { throw new Error('막힘'); } };
let 안깨짐 = true; try { const B = T.기록(고장); B.예고('p1', v1); B.답('p1', v1.날짜, '비슷'); B.달('p1', '2026-11'); } catch (e) { 안깨짐 = false; }
ok(안깨짐, '저장 못 하는 창에서 깨짐');

// 7. 조각표 빈 글
const 전체빈 = [];
for (const k of 열) for (const f of Object.keys(P[k])) if (!P[k][f]) 전체빈.push(k + '.' + f);
if (strict) ok(전체빈.length === 0, '빈 글 ' + 전체빈.length + '칸');
console.log(`통과 ${통과} · 실패 ${실패} · 조각표 빈 글 ${전체빈.length}칸 / 화면에 나온 빈 자리 ${빈.size}가지` + (strict ? '' : ' (빈 글은 --strict 에서만 실패)'));
process.exit(실패 ? 1 : 0);
