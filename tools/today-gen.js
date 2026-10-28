// 오늘의 운세 조각표 빈 틀 + 작가용 재료표를 만든다(10-28 뼈대). 이미 쓴 글은 지우지 않는다 — 빈 열쇠만 더한다.
// 쓰기: node tools/today-gen.js
//   → app/today-pieces.js            (Codex 가 글을 채우는 곳. 열쇠 · 필드 이름은 바꾸지 않는다)
//   → copy-requests/ref/COPY-0020-pieces-ref.json (열쇠마다 재료: 십성 뜻 · 원국대비 뜻 · 1,000명 × 60일 등장 비율)
'use strict';
const fs = require('fs'), path = require('path'), A = path.join(__dirname, '../app');
globalThis.window = globalThis;
for (const f of ['engine.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js']) eval(fs.readFileSync(path.join(A, f), 'utf8'));
const T = globalThis.ChaeksaToday, E = globalThis.ChaeksaEngine, 뜻 = globalThis.ChaeksaSipseong.뜻;
const PF = path.join(A, 'today-pieces.js');
let 있던 = {};
if (fs.existsSync(PF)) { const g = {}; new Function('window', fs.readFileSync(PF, 'utf8'))(g); 있던 = g.ChaeksaTodayPieces || {}; }
const 필드of = (k) => /^(새로|이어)\|/.test(k) ? T.오늘필드 : k === '저녁' ? ['물음', '비슷', '다름', '없음'] : ['한줄'];
const 표 = {};
for (const k of T.열쇠들()) { 표[k] = {}; for (const f of 필드of(k)) 표[k][f] = (있던[k] && typeof 있던[k][f] === 'string') ? 있던[k][f] : ''; }
const 남은 = Object.keys(있던).filter(k => !표[k]);
if (남은.length) { console.error('조각표에 뼈대에 없는 열쇠가 있습니다(지우지 않음, 손으로 보세요):', 남은.join(', ')); process.exit(1); }
const 머리 = '/* 오늘의 운세 조각표 — 손님이 읽는 글은 여기만(Codex COPY-0020). 열쇠 · 필드 이름은 바꾸지 않는다. 빈 글은 화면에서 건너뛴다.\n'
  + ' * 열쇠마다 재료: copy-requests/ref/COPY-0020-pieces-ref.json · 빈 틀 다시 만들기: node tools/today-gen.js(쓴 글은 남는다) · 시험: node tools/today-test.js */\n';
fs.writeFileSync(PF, (머리 + '(function (global) {\n  global.ChaeksaTodayPieces = ' + JSON.stringify(표, null, 2).replace(/\n/g, '\n  ') + ';\n})(typeof window !== \'undefined\' ? window : globalThis);\n').replace(/\r?\n/g, '\r\n'));

// 재료표 — 등장 비율(무작위 1,000명 × 60일, 2026-11-01부터)
let seed = 777; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const 셈 = {}; let 날수 = 0;
for (let p = 0; p < 1000; p++) {
  const R = E.calc({ year: 1960 + rnd(50), month: 1 + rnd(12), day: 1 + rnd(28), hour: rnd(24), minute: rnd(60), gender: rnd(2) ? 'F' : 'M', longitude: 127, tzOffset: 9 });
  for (let i = 0; i < 60; i += 1) {
    const v = T.오늘(R, new Date(2026, 10, 1 + i)); 날수++;
    const 더 = k => { 셈[k] = (셈[k] || 0) + 1; };
    더(v.첫줄.열쇠); if (v.둘째줄) 더(v.둘째줄.열쇠); if (v.조용) 더('조용'); v.바탕.forEach(b => 더(b.열쇠)); v.빠짐.forEach(b => 더(b.열쇠));
  }
}
const 대비뜻 = { 겉: '타고난 사주의 천간(겉)에 같은 십성이 있다 — 이미 드러나 쓰던 힘이 오늘 한 번 더', 속: '타고난 사주의 지지 속에만 있다 — 숨어 있던 힘이 오늘 밖으로', 없음: '타고난 사주에 없다 — 타고나지 않은 것이 오늘 잠깐 들어온다' };
const ref = { 설명: '열쇠마다 글 쓸 재료. 「등장」 = 무작위 1,000명 × 60일에서 그 열쇠가 화면에 나온 날의 비율(%). 쪽: 천간 = 생각(깨달음) · 지지 = 몸(행동 · 일어나는 일). 상태: 새로 = 오늘 새로 들어옴(중심 · 두드러짐 · 부딪힘 셋 다 재료) · 이어 = 이번 달 바탕에서 이어짐(중심만). 바탕 = 이번 달까지 이어 온 흐름 · 빠짐 = 이어지던 흐름이 오늘 쉰다.', 열쇠: {} };
for (const k of Object.keys(표)) {
  const p = k.split('|'), r = { 필드: Object.keys(표[k]), 등장: +((셈[k] || 0) / 날수 * 100).toFixed(2) };
  if (p[0] === '새로' || p[0] === '이어') { r.쪽 = p[1] + '(' + T.쪽말[p[1]] + ')'; r.십신 = p[2]; Object.assign(r, 뜻[p[2]]); if (p[0] === '이어') { delete r.두드러짐; delete r.부딪힘; } if (p[3]) r.원국대비 = p[3] + ' — ' + 대비뜻[p[3]]; }
  if (p[0] === '바탕' || p[0] === '빠짐') { r.쪽 = p[1] + '(' + T.쪽말[p[1]] + ')'; r.무리 = p[2]; r.무리십성 = T.십신들.filter((s, i) => T.무리들[Math.floor(i / 2)] === p[2]).map(s => s + ': ' + 뜻[s].중심); }
  ref.열쇠[k] = r;
}
const RF = path.join(__dirname, '../copy-requests/ref/COPY-0020-pieces-ref.json');
fs.mkdirSync(path.dirname(RF), { recursive: true });
fs.writeFileSync(RF, JSON.stringify(ref, null, 2).replace(/\n/g, '\r\n'));
const 안나옴 = Object.keys(표).filter(k => k !== '저녁' && !셈[k]);
console.log('조각 열쇠', Object.keys(표).length, '· 쓴 글 남김', Object.keys(있던).length, '· 1,000명 × 60일에 한 번도 안 나온 열쇠', 안나옴.length, 안나옴.join(' '));
