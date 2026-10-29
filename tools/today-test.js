// 오늘의 운세 뼈대 시험(10-28). 쓰기: node tools/today-test.js [--strict]
//   --strict : 조각표 빈 글도 실패로(Codex COPY-0020 끝 기준). 없으면 빈 글 수만 알린다.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), A = path.join(__dirname, '../app');
globalThis.window = globalThis;
for (const f of ['astro.js', 'engine.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js', 'today-pieces.js']) eval(fs.readFileSync(path.join(A, f), 'utf8'));
const T = globalThis.ChaeksaToday, E = globalThis.ChaeksaEngine, P = globalThis.ChaeksaTodayPieces;
const strict = process.argv.includes('--strict');
let 실패 = 0, 통과 = 0;
const ok = (c, m) => { if (c) 통과++; else { 실패++; console.log('  ✗ ' + m); } };

// 1. 뼈대 지문 — 칸 차례 · 자리 · 조각 열쇠. 바꾸려면 사장님 결정 → 여기 지문 갱신.
const B = globalThis.ChaeksaByeonhwa;
const 지문 = crypto.createHash('sha256').update(JSON.stringify([T.뼈대, T.오늘필드, T.열쇠들()])).digest('hex').slice(0, 16);
const 동결 = 'f53232afaf712fe1';   // 10-29 사장님 「추천대로 시 국충만 넣어」 — 때말 새벽(丑 · 寅) 네 칸 (그 전 f60f962998920cbb 「나이 성별 시간 환경 등을 나열하고 변수에 맞는 문장」 · c7e2e0bc30df9fd7 「저녁 기록 칸을 빼고 시운 층을 더해」 · 10-28 첫 뼈대 4d089cbdf3b7a8fa)
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

// 6. 때(시운) — 시진 경계가 엔진 calc 의 시주와 맞고, 조용하지 않은 날은 늘 때가 있고, 열쇠가 조각표에 있다
const 경계틀림 = [];
for (let k = 0; k < 365; k += 7) { const t = new Date(2026, 0, 1 + k), y = t.getFullYear(), m = t.getMonth() + 1, d = t.getDate();
  const 시 = B.시운(사람[0], new Date(y, m - 1, d));
  for (const x of 시) for (const 분 of [x.시작분, x.끝분]) {
    const r = E.calc({ year: y, month: m, day: d, hour: Math.floor(분 / 60), minute: 분 % 60, gender: 'M', longitude: 127, tzOffset: 9 });
    if (E.STEMS[r.pillars.hour.stem] + E.BRANCHES[r.pillars.hour.branch] !== x.간지) 경계틀림.push(y + '-' + m + '-' + d + ' ' + 분 + '분 ' + x.간지);
  }
}
ok(경계틀림.length === 0, '시진 경계가 엔진 시주와 다름 ' + 경계틀림.slice(0, 3).join(' · '));
let 때없음 = 0, 때열쇠없음 = 0;
for (const R of 사람.slice(0, 200)) for (let i = 0; i < 30; i++) { const v = T.오늘(R, new Date(2026, 10, 1 + i)); if ((!v.조용 || v.작용) && !v.때) 때없음++; if (v.때 && [v.때.때말열쇠, v.때.상대열쇠, v.때.일열쇠].some(k => !P[k])) 때열쇠없음++; }
ok(때없음 === 0 && 때열쇠없음 === 0, '때 없음 ' + 때없음 + ' · 조각표에 없는 때 ' + 때열쇠없음);

// 6b. 변수 — 나이 · 성별 · 요일이 문장을 가르고, 어떤 나이 · 성별에서도 때 한 줄이 빈 채로 나오지 않는다
ok(T.붙이기('{상대|와} 어울리게 됩니다.', '이성') === '이성과 어울리게 됩니다.' && T.붙이기('{상대|와} 어울립니다.', '친구') === '친구와 어울립니다.' && T.붙이기('{상대|를} 챙깁니다.', '아이') === '아이를 챙깁니다.', '조사 붙이기');
const 사례 = { 때: { 때말열쇠: '때말|주말|亥', 상대열쇠: '상대|재성|남|20|사적', 일열쇠: '일|재성|남|사적밤' }, 첫줄: { 열쇠: '새로|지지|정재|없음' }, 바탕: [], 빠짐: [] };
const 사례줄 = (T.조립(사례, P).칸[0].줄.find(x => x.자리 === '때.한줄') || {}).글;
ok(사례줄 === '오늘 밤, 이성과 어울리게 됩니다.', '20대 남 · 주말 밤 · 재성 = 「오늘 밤, 이성과 어울리게 됩니다.」 — 나온 것: ' + 사례줄);
let 때빈 = 0; const 갈래 = new Set();
for (let i = 0; i < 400; i++) {
  const R = E.calc({ year: 1950 + (i * 7) % 63, month: 1 + i % 12, day: 1 + (i * 3) % 28, hour: (i * 5) % 24, minute: 0, gender: i % 2 ? 'F' : 'M', longitude: 127, tzOffset: 9 });
  for (let k = 0; k < 14; k++) { const v = T.오늘(R, new Date(2026, 10, 1 + k)); if (!v.때) continue; const 줄 = T.조립(v, P).칸[0].줄.find(x => x.자리 === '때.한줄'); if (줄 && 줄.글) 갈래.add(줄.글); else if (strict || (P[v.때.때말열쇠] || {}).이름) 때빈++; }   // 새벽(丑 · 寅) 때말이 아직 빈 글이면 --strict 에서만
}
ok(때빈 === 0, '때 한 줄이 빈 채로 나옴 ' + 때빈);
console.log('  · 때 한 줄 갈래(400명 × 14일): ' + 갈래.size);

// 6c. 생각(천간) → 행동(지지) — 10-29 사장님 사례: 壬申 甲辰 丁卯 庚子(법전 39조에 이미 적힌 명식, 생일은 안 씀) · 대운 丁未 · 세운 丙午 · 월운 壬辰.
//   4/29 癸酉 「떠나는 게 맞다고 생각」 = 천간 극함|비겁 · 4/30 甲戌 「떠남」 = 지지 합(午戌 반합)|비겁. 같은 무리(비겁)로 이어진다.
const 층판 = (일운, 월운) => {
  const ds = E.STEMS.indexOf('丁'), 칸 = (st) => { const n = E.tenGod(ds, st); return { 십신: E.TEN_GODS[n], 무리: ['비겁', '식상', '재성', '관성', '인성'][Math.floor(n / 2)] }; };
  const 천 = c => Object.assign({ 글자: c }, 칸(E.STEMS.indexOf(c))), 지 = c => Object.assign({ 글자: c }, 칸(E.HIDDEN[E.BRANCHES.indexOf(c)][0]));
  const 운 = [['대운', '丁未'], ['세운', '丙午'], ['월운', 월운 || '壬辰'], ['일운', 일운]].map(([이름, g]) => ({ 이름, 천간: 천(g[0]), 지지: 지(g[1]) }));
  return { 일간: '丁', 원국: { 천간: ['壬', '甲', '庚'].map(천), 지지: ['申', '辰', '卯', '子'].map(지) }, 층: 운 };
};
const 생29 = T.한쪽작용(층판('癸酉'), '천간'), 행30 = T.한쪽작용(층판('甲戌'), '지지');
ok(생29 && 생29.방식 === '극함' && 생29.대상무리 === '비겁', '4/29 생각 = 극함|비겁 — 나온 것 ' + (생29 && 생29.열쇠));
ok(행30 && 행30.방식 === '합' && 행30.대상무리 === '비겁', '4/30 행동 = 합|비겁(午戌) — 나온 것 ' + (행30 && 행30.열쇠));
ok(행30 && 행30.열쇠 === '끌림|비겁|식상', '4/30 행동 = 끌림|비겁|식상(친구가 하고 싶은 일 하러 떠남) — 나온 것 ' + (행30 && 행30.열쇠));
ok(T.이어지나(생29, 행30) && !T.이어지나({ 방식: '생함', 대상무리: '비겁' }, { 방식: '충', 대상무리: '비겁' }), '이음 짝 — 극함 생각 → 합 행동은 잇고, 생함 생각 → 충 행동은 안 잇는다');
const 자오 = T.한쪽작용(층판('丙子', '戊戌'), '지지');
ok(자오 && 자오.대상무리 === '재성' && 자오.주자리 === '년주', '10/29 丙子 子申 반합 — 닿은 자리 년주(집안 어른) — 나온 것 ' + (자오 && 자오.주자리));
ok(자오 && 자오.방식 !== '충', '10/29 丙子 — 子는 申子辰에 묶여 午와 충이 안 된다(법전 6조) — 나온 것 ' + (자오 && 자오.열쇠));
let 앞있음 = 0, 뒤있음 = 0, 날수 = 0;
for (const R of 사람.slice(0, 60)) for (let i = 0; i < 14; i++) { const v = T.오늘(R, new Date(2026, 10, 1 + i)); 날수++; if (v.이음.앞) 앞있음++; if (v.이음.뒤) 뒤있음++; }
console.log('  · 이음: 생각이 7일 안에 행동으로 ' + (앞있음 / 날수 * 100).toFixed(0) + '% · 행동 앞에 생각이 있던 날 ' + (뒤있음 / 날수 * 100).toFixed(0) + '%');

// 6d. 10-29 Codex 남긴 과제 셋 — 떠나는 날 둘째 줄 · 누구 한 사람 · 이번 주 띠 되풀이
ok(T.떠나는일(행30) && !T.떠나는일({ 방식: '합', 대상무리: '재성' }), '떠나는 일 = 국충 · 충 · 같은 편이 끌려감(4/30 끌림|비겁)');
let 띠겹 = 0, 띠수 = 0, 누구다름 = 0;
for (const R of 사람.slice(0, 120)) for (const s0 of [0, 7, 14]) {
  const W = T.이번주(R, new Date(2026, 10, 1 + s0));
  for (let j = 1; j < 7; j++) { 띠수++; const a = W.날들[j - 1].띠, b = W.날들[j].띠; if (P[a.열쇠][a.필드] === P[b.열쇠][b.필드]) 띠겹++; }
  const v = T.오늘(R, new Date(2026, 10, 1 + s0)), 줄 = T.조립(v, P).칸[0].줄, 상 = 줄.find(x => x.자리 === '때.상대');
  if (v.때 && (!상 || !상.글)) 누구다름++;
}
ok(띠겹 === 0, '이번 주 띠 이틀 연속 같은 글 ' + 띠겹 + ' / ' + 띠수);
ok(누구다름 === 0, '때 줄이 있는데 누구(때.상대)가 비어 아래 「누구」가 다른 사람으로 나옴 ' + 누구다름);

// 6f. 법전 50조 국 완성 충 — 10-29 사장님 「추천대로 시 국충만 넣어」(결정함 33). 같은 운 안에서는 처음 다 모인 날 · 시에 한 번, 시에서만 채워지면 그 시진.
//     사장님 09-14 「2026년 10월 8일 이후에 오·술이니까 인일 또는 인시에 터진다」 — 원국 申子辰(壬申 甲辰 丁卯 庚子, 법전 39조 명식 · 생일은 안 씀) · 대운 丁未 · 세운 丙午.
const 기둥 = g => ({ stem: E.STEMS.indexOf(g[0]), branch: E.BRANCHES.indexOf(g[1]) });
const R50 = { pillars: { year: 기둥('壬申'), month: 기둥('甲辰'), day: 기둥('丁卯'), hour: 기둥('庚子') }, solarYear: 1992, daeun: { list: [Object.assign({ startAge: 30, endAge: 39 }, 기둥('丁未'))] }, input: { year: 1992, month: 1, day: 1, gender: 'M' } };
const 국날 = (y, m, d0, n) => { const a = []; for (let i = 0; i < n; i++) { const d = new Date(y, m - 1, d0 + i), h = T.하루작용(R50, d).행동; if (h && h.방식 === '국충') a.push({ 날: B.층표(R50, d).날짜, 시: h.시 && h.시.간지 }); } return a; };
const 술월 = 국날(2026, 10, 9, 30);   // 2026 戌월 = 10/9(정오 기준 한로 뒤) ~ 11/7
ok(술월.length === 1 && 술월[0].날 === '2026-10-09' && 술월[0].시 === '庚寅', '戌월 국충은 한 번 — 10/9 寅시(午 · 戌 위에 寅시가 채움) — 나온 것 ' + JSON.stringify(술월));
ok(!국날(2026, 10, 19, 1).length, '10/19 丙寅일은 같은 운에서 이미 터졌으므로 국충 아님(같은 운 안 한 번)');
const v50 = T.오늘(R50, new Date(2026, 9, 9));
ok(v50.작용 && v50.작용.열쇠 === '결과|국충|관성' && v50.때 && v50.때.간지 === '庚寅' && v50.때.때말열쇠 === '때말|평일|寅', '10/9 국충 관성 · 때 = 그 寅시(이날 ○시에 한 번) — 나온 것 ' + (v50.작용 && v50.작용.열쇠) + ' · ' + (v50.때 && v50.때.간지));
ok(!국날(2026, 11, 8, 30).length && !국날(2026, 9, 8, 30).length, '亥월 · 酉월(운에는 午 하나뿐)은 국충 없음 — 오늘과 시진이 두 글자를 함께 채우는 건 사례(「오·술이니까 인일 또는 인시」) 밖');
const R50경술 = Object.assign({}, R50, { daeun: { list: [Object.assign({ startAge: 30, endAge: 39 }, 기둥('庚戌'))] } });
const 경술 = []; for (let i = 0; i < 90; i++) { const d = new Date(2026, 8, 8 + i), h = T.하루작용(R50경술, d).행동; if (h && h.방식 === '국충') 경술.push(B.층표(R50경술, d).날짜 + (h.시 ? ' ' + h.시.간지 : '')); }
ok(경술.join(',') === '2026-09-08 戊寅,2026-10-09 庚寅,2026-11-08 庚寅', '대운 庚戌 + 세운 午면 운(월운)이 바뀔 때마다 한 번씩 — 50조 「경술 대운에 몰림」 — 나온 것 ' + 경술.join(','));

// 6e. 10-29 사건 그림(Codex PR 5 · IMG-0033~0062) — 제목(결과 · 끌림) · 생각 열쇠마다 장면이 붙고, 장면마다 남 · 여 그림이 있어야 한다.
//     빠지면 화면은 일반 안내 그림으로 조용히 넘어가 아무도 모른다 — 열쇠를 늘리면 app/today.js eventScenes 에도 장면을 붙일 것.
const 그림표 = JSON.parse((fs.readFileSync(path.join(A, 'today.js'), 'utf8').match(/const eventScenes=(\{[\s\S]*?\});/) || [0, '{}'])[1]);
const 그림열쇠 = 열.filter(k => /^(결과|끌림|생각)\|/.test(k)), 그림없음 = 그림열쇠.filter(k => !그림표[k]);
const 그림파일 = [...new Set(Object.values(그림표))].flatMap(s => ['m', 'f'].flatMap(g => ['today-events/' + s + '-' + g + '-v1.webp', 'today-events/' + s + '-' + g + '-v1-s.webp']))
  .concat(['forecast-m-v1', 'thought-f-v1', 'week-pair-v1'].flatMap(n => ['today-guides/' + n + '.webp', 'today-guides/' + n + '-s.webp']));
const 파일없음 = 그림파일.filter(f => !fs.existsSync(path.join(A, 'art', f)));
ok(그림열쇠.length >= 80 && 그림없음.length === 0, '장면 그림이 안 붙은 열쇠 ' + 그림없음.length + ' / ' + 그림열쇠.length + ' — app/today.js eventScenes: ' + 그림없음.slice(0, 5).join(' · '));
ok(파일없음.length === 0, '오늘의 운세 그림 파일 없음: ' + 파일없음.join(' · '));

// 7. 조각표 빈 글
const 전체빈 = [];
for (const k of 열) for (const f of Object.keys(P[k])) if (!P[k][f]) 전체빈.push(k + '.' + f);
if (strict) ok(전체빈.length === 0, '빈 글 ' + 전체빈.length + '칸');
// 10-29 「왜 내게만 이런 일이 일어날까?」는 이 엔진을 열두 해 센 보통값(why-core.js 보통표)과 견준다 — 엔진 파일이 바뀌면 보통값을 다시 잰다(실패로 막지는 않고 알린다).
try {
  const { 엔진지문 } = require('./why-base.js'), 판 = (fs.readFileSync(path.join(__dirname, '..', 'app', 'why-core.js'), 'utf8').match(/보통판 = (\{.*?\});/) || [])[1];
  const 잰 = 판 ? JSON.parse(판).엔진 : '', 지금 = 엔진지문();
  if (잰 !== 지금) console.log('  ! 알림: 엔진이 「왜 내게만」 보통값을 잰 뒤 바뀌었어요(' + 잰 + ' → ' + 지금 + ') — node tools/why-base.js --write 로 다시 재고 node tools/why-test.js');
} catch (e) { console.log('  ! 알림: 왜 내게만 보통값 지문을 못 봤어요 — ' + e.message); }
console.log(`통과 ${통과} · 실패 ${실패} · 조각표 빈 글 ${전체빈.length}칸 / 화면에 나온 빈 자리 ${빈.size}가지` + (strict ? '' : ' (빈 글은 --strict 에서만 실패)'));
process.exit(실패 ? 1 : 0);
