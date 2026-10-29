// 「왜 내게만 이런 일이 일어날까?」 시험 — node tools/why-test.js
// 지키는 것: 사장님 말(이름 · 띠) 그대로 · 보통표 = 꼴 넷 × 일간 오행 다섯 × 행동 사건 55칸(0인 칸 = 구조로 안 나는 칸) · 엔진이 바뀌면 보통값 다시 재기 · 열두 해 창 · 높은 사건 조건(2배 · 3번 · 열 개) ·
//   다시 센 수와 같음 · 태어나기 전 날 빼기 · 국충 자리 = 원국 삼합국 · 화면에 이름 · 띠 · 사건 한 줄이 다 나오고 틀 찌꺼기 없음.
// 견본 명식은 지어낸 생일이다(사장님 · 손님 생일 아님).
'use strict';
const fs = require('fs'), path = require('path');
const APP = path.join(__dirname, '..', 'app');
globalThis.window = globalThis;
for (const f of ['astro.js', 'engine.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js', 'today-pieces.js', 'yaksok.js', 'why-core.js', 'why-pieces.js', 'why.js']) (0, eval)(fs.readFileSync(path.join(APP, f), 'utf8'));
const W = globalThis.ChaeksaWhy, P = globalThis.ChaeksaWhyPieces, TP = globalThis.ChaeksaTodayPieces, T = globalThis.ChaeksaToday, E = globalThis.ChaeksaEngine, BH = globalThis.ChaeksaByeonhwa, V = globalThis.ChaeksaWhyView;
let 통과 = 0, 실패 = 0;
const 봄 = (이름, ok, 덧) => { if (ok) { 통과++; console.log('  ✓ ' + 이름); } else { 실패++; console.log('  ✗ ' + 이름 + (덧 ? ' — ' + 덧 : '')); } };
const 날짜글 = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const 날수 = (a, b) => Math.round((b - a) / 86400000);

console.log('1. 사장님 말 · 표');
봄('이름 = 「왜 내게만 이런 일이 일어날까?」(10-29 사장님)', P.이름 === '왜 내게만 이런 일이 일어날까?', P.이름);
봄('띠 = 「★★★ 사건 발생 빈도가 높습니다 ★★★」(10-29 사장님)', P.띠 === '★★★ 사건 발생 빈도가 높습니다 ★★★', P.띠);
봄('숫자 표기 칸은 자리를 지킨다({해} · {n} · {횟수} · {날})', /\{해\}/.test(P.횟수) && /\{n\}/.test(P.횟수) && /\{횟수\}/.test(P.보통) && /\{n\}/.test(P.배) && /\{날\}/.test(P.다음));
봄('근거 접힘 이름 = 사이트 공통 「근거 보기」', P.근거 === '근거 보기', P.근거);
const 행동열쇠 = T.열쇠들().filter(k => /^(결과|끌림)\|/.test(k));
const { 엔진지문, 꼴들, 오행들, 기본사람, 표지문 } = require('./why-base.js'), 지문 = 엔진지문(APP);
봄('보통표 = 명식 꼴 넷 × 일간 오행 다섯(결정함 38)', JSON.stringify(Object.keys(W.보통표).sort()) === JSON.stringify(꼴들.slice().sort()) && 꼴들.every(c => JSON.stringify(Object.keys(W.보통표[c] || {}).sort()) === JSON.stringify(오행들.slice().sort())), Object.keys(W.보통표).join(','));
const 빠진 = [], 남는 = [];
꼴들.forEach(c => 오행들.forEach(o => { const t = (W.보통표[c] || {})[o] || {}; 행동열쇠.forEach(k => { if (!(k in t) || !(t[k] >= 0)) 빠진.push(c + '|' + o + ':' + k); }); Object.keys(t).forEach(k => { if (행동열쇠.indexOf(k) < 0) 남는.push(c + '|' + o + ':' + k); }); }));
봄('꼴 × 오행마다 행동 사건 열쇠 전부(' + 행동열쇠.length + '칸)', !빠진.length && !남는.length, '빠짐 ' + 빠진.slice(0, 5).join(',') + ' · 남음 ' + 남는.slice(0, 5).join(','));
{
  // 구조로 안 나는 칸 — 끌림은 합 짝(육합 · 같은 삼합 두 글자)의 무리 짝만 서고, 국충은 국 오행(申子辰 水 · 亥卯未 木 · 寅午戌 火 · 巳酉丑 金 — 土 국은 없다)의 무리만 선다.
  //   시각 알고 대운 있는 꼴(날이 가장 많음)에서 「0인 칸 = 구조로 안 나는 칸」이어야 한다 — 표본이 모자라 생긴 0 이 있으면 사람 수를 늘린다.
  const 지들 = E.BRANCHES, 무리5 = ['비겁', '식상', '재성', '관성', '인성'], 국들 = ['申子辰', '亥卯未', '寅午戌', '巳酉丑'];
  const 무리of = (xi, g) => 무리5[(E.BRANCH_ELEM[지들.indexOf(g)] - xi + 5) % 5];
  const 짝인가 = (a, b) => a !== b && ((지들.indexOf(a) + 지들.indexOf(b)) % 12 === 1 || 국들.some(q => q.indexOf(a) >= 0 && q.indexOf(b) >= 0));
  const 어긋 = [];
  오행들.forEach((o, xi) => {
    const 될 = new Set();
    지들.forEach(a => 지들.forEach(b => { if (짝인가(a, b)) 될.add('끌림|' + 무리of(xi, b) + '|' + 무리of(xi, a)); }));
    국들.forEach(q => 될.add('결과|국충|' + 무리of(xi, q[1])));
    행동열쇠.forEach(k => {
      const 구조 = /^끌림\||^결과\|국충\|/.test(k) ? 될.has(k) : true, 값 = W.보통표['시|대운'][o][k];
      if ((값 > 0) !== 구조) 어긋.push(o + ' ' + k + ' ' + 값 + (구조 ? '(설 수 있는데 0)' : '(못 서는데 0 아님)'));
    });
  });
  봄('시각 알고 대운 있는 꼴 — 0인 칸 = 구조로 안 나는 칸(끌림 · 국충만)', !어긋.length, 어긋.slice(0, 6).join(' · '));
}
봄('사건 열쇠마다 오늘의 운세 한 줄(today-pieces)이 있다', 행동열쇠.every(k => TP[k] && TP[k].한줄), 행동열쇠.filter(k => !(TP[k] && TP[k].한줄)).join(','));
봄('보통판 = 무작위 ' + 기본사람.toLocaleString('en-US') + '명 × 열두 해(2020-10-29 부터) · 꼴마다 센 날이 백만 날 넘음', W.보통판.사람 === 기본사람 && W.보통판.해 === 12 && W.보통판.시작 === '2020-10-29' && 꼴들.every(c => 오행들.reduce((s, o) => s + ((W.보통판.날[c] || {})[o] || 0), 0) > 1e6), JSON.stringify(W.보통판));
봄('엔진 지문 = 보통값을 잰 엔진(다르면 node tools/why-base.js --write)', 지문 === W.보통판.엔진, W.보통판.엔진 + ' → 지금 ' + 지문);
봄('표 지문 = 보통표 그대로(손으로 고치지 않음 · 화면 기기 기억 열쇠에 들어감)', W.보통판.표 === 표지문(W.보통표), W.보통판.표 + ' → 지금 ' + 표지문(W.보통표));
{
  // 손님 글(Codex)에 적힌 사람 수 = 보통값을 잰 사람 수 — 10-30 보통값을 6,000 → 12,000 으로 바꿨을 때 근거말의 「6,000명」이 틀린 채 남을 뻔했다.
  const 적힌 = [...String(P.근거말 || '').matchAll(/([0-9][0-9,]*)\s*명/g)].map(m => +m[1].replace(/,/g, ''));
  봄('근거말에 적힌 사람 수 = 보통값 사람 수(' + W.보통판.사람.toLocaleString('en-US') + '명)', 적힌.every(n => n === W.보통판.사람), 적힌.join(','));
}

console.log('2. 견본 명식(지어낸 생일)');
const 지금 = new Date(2026, 9, 29), 창시작 = new Date(2020, 9, 29), 창끝 = new Date(2032, 9, 29);
const 견본 = [
  { year: 1985, month: 3, day: 14, hour: 9, minute: 30, gender: 'F', longitude: 127, tzOffset: 9 },
  { year: 1972, month: 11, day: 2, hour: 22, minute: 5, gender: 'M', longitude: 127, tzOffset: 9 },
  { year: 2001, month: 7, day: 27, hour: null, minute: null, gender: 'F', longitude: 127, tzOffset: 9 },   // 시각 모름 — 원국 지지 셋
];
const 결과들 = [];
견본.forEach((b, j) => {
  const t0 = Date.now(), R = E.calc(b), v = W.잼(R, 지금), ms = Date.now() - t0;
  결과들.push([R, v]);
  const 라 = '견본 ' + (j + 1);
  봄(라 + ' — 창 = 2020-10-29 ~ 2032-10-28(' + 날수(창시작, 창끝) + '일)', v.창.시작 === '2020-10-29' && v.창.끝 === '2032-10-28' && v.창.날 === 날수(창시작, 창끝), JSON.stringify(v.창));
  봄(라 + ' — 높은 사건 1 ~ 10개, 모두 2배 · 3번 이상', v.높은.length >= 1 && v.높은.length <= W.최대 && v.높은.every(x => x.배 >= W.문턱 && x.번 >= W.최소), v.높은.length + '개');
  봄(라 + ' — 배수 큰 것부터', v.높은.every((x, i) => !i || v.높은[i - 1].배 >= x.배));
  봄(라 + ' — 배 = (번 ÷ 해) ÷ 보통', v.모두.every(x => Math.abs(x.배 - (x.번 / v.창.해) / x.보통) < 1e-9));
  {
    // 보통 = 센 날의 꼴만큼 섞은 「꼴 × 제 일간 오행」 표 값(꼴 날 수로 가중 평균)
    const 오 = W.오행of(R), 섞음 = k => Object.keys(v.창.꼴).reduce((s, c) => s + v.창.꼴[c] * W.보통표[c][오][k], 0) / v.창.날;
    const 시꼴 = R.pillars.hour ? '시' : '시모름';
    봄(라 + ' — 보통 = 제 꼴(' + Object.keys(v.창.꼴).join(' · ') + ') × 제 일간 오행(' + 오 + ') 표의 날 가중 평균', v.창.오행 === 오 && Object.keys(v.창.꼴).every(c => c.indexOf(시꼴 + '|') === 0) && v.모두.every(x => Math.abs(x.보통 - 섞음(x.열쇠)) < 1e-9));
  }
  봄(라 + ' — 자리는 원국 기둥 · 지지 글자, 다음은 오늘 뒤', v.모두.every(x => x.자리.every(z => W.기둥.indexOf(z.기둥) >= 0 && E.BRANCHES.indexOf(z.글자) >= 0 && z.십신) && (!x.다음 || x.다음 >= v.오늘)));
  봄(라 + ' — 한 사람 열두 해 셈 ' + ms + 'ms(1.5초 안)', ms < 1500);
});
{
  // 다시 세기 — 창 안 날마다 하루작용 행동 열쇠를 따로 센다
  const [R, v] = 결과들[0], 셈 = {};
  for (let d = 창시작; d < 창끝; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) { const a = T.하루작용(R, d).행동; if (a) 셈[a.열쇠] = (셈[a.열쇠] || 0) + 1; }
  봄('견본 1 — 다시 센 수와 같다(' + Object.keys(셈).length + '칸)', Object.keys(셈).length === v.모두.length && v.모두.every(x => 셈[x.열쇠] === x.번));
  // 다음 = 오늘부터 처음 그 열쇠가 오는 날
  const x = v.높은[0]; let 첫 = null;
  for (let d = new Date(지금); d < 창끝 && !첫; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) { const a = T.하루작용(R, d).행동; if (a && a.열쇠 === x.열쇠) 첫 = 날짜글(d); }
  봄('견본 1 — 첫째 사건 다음 날 = 오늘부터 처음 오는 날(' + 첫 + ')', x.다음 === 첫);
  // 다음 날의 오늘의 운세 제목 = 그 사건 한 줄
  const 그날 = new Date(+첫.slice(0, 4), +첫.slice(5, 7) - 1, +첫.slice(8, 10)), 줄 = T.조립(T.오늘(R, 그날), TP).칸[0].줄, 제목 = (줄.find(z => z.자리 === '결과.한줄') || {}).글;
  봄('견본 1 — 그날 오늘의 운세 제목 = 이 사건 한 줄', 제목 === TP[x.열쇠].한줄, 제목);
}
{
  // 태어나기 전 날은 뺀다
  const b = { year: 2024, month: 3, day: 1, hour: 10, minute: 0, gender: 'M', longitude: 127, tzOffset: 9 }, v = W.잼(E.calc(b), 지금);
  봄('2024-03-01 생 — 창은 이튿날부터(' + v.창.시작 + ' · ' + v.창.날 + '일)', v.창.시작 === '2024-03-02' && v.창.날 === 날수(new Date(2024, 2, 2), 창끝));
  봄('2024-03-01 생 — 첫 대운 전 날은 「대운없음」 꼴로 센다(' + JSON.stringify(v.창.꼴) + ')', (v.창.꼴['시|대운없음'] || 0) > 0 && (v.창.꼴['시|대운없음'] || 0) + (v.창.꼴['시|대운'] || 0) === v.창.날);
}
{
  // 치우침 — 시각 모르는 무작위 명식 · 시각 아는 무작위 명식 각 150명: 방식마다 (센 날 합 ÷ 기대 합)이 1 근처(0.75 ~ 1.33). 한 표로 견주던 판은 시각 모름의 충이 두 배쯤이었다.
  //   10-29 엔진 6조 고침 뒤 60명 판에서 생함(하루 1% 남짓)이 0.75로 걸렸다 — 300명 두 씨앗은 0.87 ~ 1.13 이라 치우침이 아니라 표본이 작았던 것. 150명으로 늘림.
  let s = 7;
  const rnd = n => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * n); };
  const 몇명 = 150, 오합 = {}, 오기 = {};
  for (const 시 of [true, false]) {
    const 합 = {}, 기 = {};
    for (let i = 0; i < 몇명; i++) {
      const b = { year: 1950 + rnd(70), month: 1 + rnd(12), day: 1 + rnd(28), hour: 시 ? rnd(24) : null, minute: 시 ? rnd(60) : null, gender: rnd(2) ? 'F' : 'M', longitude: 127, tzOffset: 9 };
      const v = W.잼(E.calc(b), 지금), 방 = k => (k.startsWith('끌림') ? '끌림' : k.split('|')[1]), 오 = v.창.오행;
      v.모두.forEach(x => { 합[방(x.열쇠)] = (합[방(x.열쇠)] || 0) + x.번; if (방(x.열쇠) === '끌림') 오합[오] = (오합[오] || 0) + x.번; });
      // 기대는 겪지 않은 열쇠(0번)까지 전부 — 센 날의 꼴 × 그 꼴 · 제 일간 오행 표 값
      행동열쇠.forEach(k => { const e = Object.keys(v.창.꼴).reduce((s2, c) => s2 + v.창.꼴[c] * W.보통표[c][오][k] / 365.2425, 0); 기[방(k)] = (기[방(k)] || 0) + e; if (방(k) === '끌림') 오기[오] = (오기[오] || 0) + e; });
    }
    // 충 · 국충은 몇 안 되는 명식에 몰려(대부분 0번) 이 표본으로는 못 잰다 — 천 명 단위로 따로 잼(비공개 기록)
    const 비 = Object.keys(합).filter(m => m !== '국충' && m !== '충').map(m => [m, 합[m] / 기[m]]);
    봄('치우침 없음 — 시각 ' + (시 ? '아는' : '모르는') + ' ' + 몇명 + '명, 방식마다 실제 ÷ 기대 ' + 비.map(([m, r]) => m + ' ' + r.toFixed(2)).join(' · '), 비.every(([, r]) => r > 0.75 && r < 1.33));
  }
  // 오행 쏠림 — 꼴만 견주던 판은 끌림이 오행마다 크게 어긋났다(끌림|인성|식상은 木 · 水 일간 0명인데 걸린 사람의 27%). 같은 오행끼리 견주면 1 근처여야 한다.
  const 오비 = W.오행들.filter(o => 오기[o] > 0).map(o => [o, 오합[o] / 오기[o]]);
  봄('오행 쏠림 없음(결정함 38) — 오행마다 끌림 실제 ÷ 기대 ' + 오비.map(([o, r]) => o + ' ' + r.toFixed(2)).join(' · '), 오비.length === 5 && 오비.every(([, r]) => r > 0.8 && r < 1.25));
}
{
  // 국충 — 원국에 삼합국이 선 명식을 찾아(시진마다 걸음) 국충 자리 = 그 국 글자의 원국 자리
  const 국들 = ['申子辰', '亥卯未', '寅午戌', '巳酉丑'];
  let 찾음 = null;
  for (let n = 0; n < 4000 && !찾음; n++) {
    const d = new Date(1980, 0, 1 + n * 7), b = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: (n * 5) % 24, minute: 10, gender: n % 2 ? 'F' : 'M', longitude: 127, tzOffset: 9 };
    const R = E.calc(b), 지 = BH.층표(R, 지금).원국.지지.map(g => g.글자), 국 = 국들.find(g => [...g].every(c => 지.indexOf(c) >= 0));
    if (!국) continue;
    const v = W.잼(R, 지금), x = v.모두.find(y => /^결과\|국충\|/.test(y.열쇠));
    if (x) 찾음 = { 지, 국, x };
  }
  봄('국충 명식 — 국충 자리 = 원국 삼합국 글자 자리', !!찾음 && 찾음.x.자리.length >= 3 && 찾음.x.자리.every(z => 찾음.국.indexOf(z.글자) >= 0), 찾음 ? 찾음.국 + ' · ' + 찾음.x.자리.map(z => z.기둥 + z.글자).join(' ') : '못 찾음');
}

console.log('3. 숫자 표기');
봄('잣대 — 보통 사람 값이 3.5 이상 1년 · 0.35 이상 10년 · 그 아래 100년', [V.잣대(13.7), V.잣대(4.9), V.잣대(1.29), V.잣대(0.38), V.잣대(0.021)].join('|') === '1|1|10|10|100');
const 셈말들 = [V.셈말(56.2, 1), V.셈말(7.2, 10), V.셈말(1.29, 10), V.셈말(0.5, 100), V.셈말(0.021, 100), V.셈말(0.004, 100)].join('|');
봄('셈말 — 같은 해 수로 「{해}년에 {n}번」, 0번이면 해를 늘림', 셈말들 === '1년에 56번|10년에 72번|10년에 13번|100년에 50번|100년에 2번|1000년에 4번', 셈말들);
봄('배 — 10 아래는 소수 한 자리, 10부터는 정수', [V.배수(3.64), V.배수(2), V.배수(25.7)].join('|') === '3.6|2|26');
{
  // 한 항목의 두 수(나 · 보통 사람)를 견준 값이 배수와 크게 어긋나지 않는다 — 견본 셋의 높은 사건 전부
  const 어긋 = [];
  결과들.forEach(([, v]) => v.높은.forEach(x => { const h = V.잣대(x.보통), a = Math.round(x.해마다 * h), b = Math.round(x.보통 * h); if (Math.abs((a / b) / x.배 - 1) > 0.3) 어긋.push(x.열쇠 + ' ' + a + '/' + b + ' vs ' + x.배.toFixed(2)); }));
  봄('적힌 두 수의 비 ≈ 배수(30% 안)', !어긋.length, 어긋.join(' · '));
}

console.log('4. 화면(가짜 상자에 그려 봄)');
const [R0, v0] = 결과들[0];
const 사람 = [{ id: 'me', name: '나', isSelf: true, birth: 견본[0] }, { id: 'p1', name: '친구', isSelf: false, birth: 견본[1] }];
const people = { migrate() {}, activeId: () => 'me', list: () => 사람, setActive() {}, toProfile: p => Object.assign({}, p.birth) };
const 상자 = { innerHTML: '' };
V.mount(상자, { people, clock: () => 지금, track: null, 바로: true });
const h = 상자.innerHTML;
봄('이름 · 띠가 나온다', h.indexOf(P.이름) >= 0 && h.indexOf(P.띠) >= 0);
봄('높은 사건 한 줄이 차례대로 다 나온다(' + v0.높은.length + '줄)', v0.높은.every((x, i) => h.indexOf(TP[x.열쇠].한줄) >= 0 && (!i || h.indexOf(TP[x.열쇠].한줄) > h.indexOf(TP[v0.높은[i - 1].열쇠].한줄))));
봄('틀 찌꺼기 · 빈 값 없음({ } · undefined · NaN · null)', !/\{[^{}]*\}|undefined|NaN|\bnull\b/.test(h), (h.match(/\{[^{}]*\}|undefined|NaN|\bnull\b/) || [])[0]);
봄('사람이 둘 이상이면 고르는 칸', /<select id="why-person"/.test(h) && h.indexOf('친구') >= 0);
봄('끝 — 오늘의 운세로 가는 길(장부 이름)', h.indexOf('href="#today"') >= 0 && h.indexOf(globalThis.ChaeksaYaksok.이름('today')) >= 0);
봄('손님 화면에 엔진 낱말 · 열쇠 없음(결과| · 끌림| · 국충 · 하루작용)', !/>[^<]*(결과\||끌림\||국충|하루작용)[^<]*</.test(h));
{
  // 블록 꼴(10-23): 물음 → 결론 → 근거 접힘. 첫 층(접힘 밖)엔 한자 · 괄호가 없고, 원국 자리는 「근거 보기」 안에만.
  const 접힘 = (h.match(/<details class="jt-ev why-basis">[\s\S]*?<\/details>/) || [''])[0], 밖 = h.replace(접힘, '').replace(/<[^>]+>/g, ' ');
  봄('근거 보기 접힘이 있고 그 안에 원국 자리 · 센 날', !!접힘 && 접힘.indexOf('<summary>' + P.근거 + '</summary>') >= 0 && /(년주|월주|일지|시주) [子丑寅卯辰巳午未申酉戌亥]\(/.test(접힘) && 접힘.indexOf('2020-10-29 ~ 2032-10-28') >= 0);
  봄('첫 층(접힘 밖)에 한자 · 괄호 없음', !/[一-鿿()]/.test(밖), (밖.match(/.{0,12}[一-鿿()].{0,12}/) || [])[0]);
  봄('공통 블록 꼴 클래스(card jt-ch · jt-head · jt-answer · jt-ev)', /class="card jt-ch why-card"/.test(h) && /class="jt-head"/.test(h) && /class="jt-answer why-band"/.test(h) && /class="jt-ev why-basis"/.test(h));
  // 근거 번호 = 목록 번호(사건마다 같은 번호)
  const 번호 = [...접힘.matchAll(/<li value="(\d+)">/g)].map(m => +m[1]);
  봄('근거 줄 번호가 목록 번호와 맞다', 번호.length > 0 && 번호.every(n => v0.높은[n - 1] && v0.높은[n - 1].자리.length > 0), 번호.join(','));
}

(async () => {
  console.log('5. 나눠 세기 · 이 기기에 두기 · 앞으로 태어날 아이');
  const 가짜저장 = {};
  globalThis.localStorage = { getItem: k => (k in 가짜저장 ? 가짜저장[k] : null), setItem: (k, s) => { 가짜저장[k] = String(s); }, removeItem: k => { delete 가짜저장[k]; } };
  const 한사람 = (birth) => { const 들 = [{ id: 'x', name: '나', isSelf: true, birth }]; return { migrate() {}, activeId: () => 'x', list: () => 들, setActive() {}, toProfile: p => Object.assign({}, p.birth) }; };
  const 상자2 = { innerHTML: '', setAttribute() {}, removeAttribute() {} };
  V.mount(상자2, { people: 한사람(견본[2]), clock: () => 지금, track: null });
  봄('바로 없이 그리면 처음엔 회색 줄만(글 · 목록 없음)', /class="why-wait"/.test(상자2.innerHTML) && !/why-item/.test(상자2.innerHTML) && 상자2.innerHTML.indexOf(P.이름) >= 0);
  for (let i = 0; i < 600 && !/why-list/.test(상자2.innerHTML); i++) await new Promise(r => setTimeout(r, 5));
  const 한번에 = W.잼(E.calc(견본[2]), 지금);
  봄('다 세면 목록 — 한 번에 센 것과 같은 사건 · 같은 차례', /why-list/.test(상자2.innerHTML) && 한번에.높은.every((x, i) => 상자2.innerHTML.indexOf(TP[x.열쇠].한줄) >= 0 && (!i || 상자2.innerHTML.indexOf(TP[x.열쇠].한줄) > 상자2.innerHTML.indexOf(TP[한번에.높은[i - 1].열쇠].한줄))));
  봄('그날 결과를 이 기기에 둔다(chaeksa.why.…)', Object.keys(가짜저장).some(k => k.indexOf('chaeksa.why.') === 0));
  (0, eval)(fs.readFileSync(path.join(APP, 'why.js'), 'utf8'));   // 새 페이지처럼(페이지 안 기억 없음)
  const 상자3 = { innerHTML: '', setAttribute() {}, removeAttribute() {} };
  globalThis.ChaeksaWhyView.mount(상자3, { people: 한사람(견본[2]), clock: () => 지금, track: null });
  봄('다시 열면 둔 결과로 바로 그린다(회색 줄 없이)', /why-list/.test(상자3.innerHTML) && !/why-wait/.test(상자3.innerHTML));
  const 다음날 = new Date(2026, 9, 30), 상자5 = { innerHTML: '', setAttribute() {}, removeAttribute() {} };
  globalThis.ChaeksaWhyView.mount(상자5, { people: 한사람(견본[2]), clock: () => 다음날, track: null });
  봄('날이 바뀌면 다시 센다(둔 결과는 그날 것만)', /why-wait/.test(상자5.innerHTML));
  const 상자4 = { innerHTML: '' };
  globalThis.ChaeksaWhyView.mount(상자4, { people: 한사람({ year: 2027, month: 5, day: 1, hour: 9, minute: 0, gender: 'F', longitude: 127, tzOffset: 9 }), clock: () => 지금, track: null, 바로: true });
  봄('앞으로 태어날 아이 — 이름만(띠 · 목록 없음)', 상자4.innerHTML.indexOf(P.이름) >= 0 && !/why-band|why-list|why-wait/.test(상자4.innerHTML));
  console.log('\n통과 ' + 통과 + ' · 실패 ' + 실패);
  process.exit(실패 ? 1 : 0);
})();
