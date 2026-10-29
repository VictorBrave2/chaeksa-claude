// 「왜 내게만 이런 일이 일어날까?」 보통값 — 무작위 명식 N명 × 열두 해(2020-10-29 부터)의 행동 사건 1년 평균을 「명식 꼴」마다 재서 app/why-core.js 보통표에 쓴다.
// 쓰기: node tools/why-base.js [--n 6000] [--workers 12] [--write]      (--write 없으면 표만 보여 준다)
// 명식 꼴 = 시각을 아나(시주가 있나) × 그날 대운 층이 있나(첫 대운 전 아이 · 대운 목록 끝을 지난 사람은 없다).
//   꼴마다 체의 지지 수가 달라(시주 · 대운 하나씩) 합에 묶이는 자리 수가 다르고, 그래서 충 · 생극이 나오는 비율이 다르다 —
//   시각 모르는 사람을 시각 아는 사람 표와 견주면 충이 두 배쯤 부풀었다(10-29 검토). 그래서 사람은 제 꼴의 보통과만 견준다.
// 사람은 태어난 해 1950 ~ 2031 고르게(아이 날이 첫 대운 전 칸을 채운다) · 한 사람을 시각 아는 판 · 모르는 판 둘로 센다 · 태어나기 전 날은 뺀다.
// 엔진 파일(아래 엔진파일)이 바뀌면 다시 돈다 — tools/why-test.js 가 엔진 지문이 다르면 실패로 알린다(today-test 는 알림만). 6,000명 · 12갈래에 1 ~ 2분.
// 명식은 씨앗 고정(mulberry32 20261029) — 같은 엔진이면 같은 표가 나온다.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const APP = path.join(__dirname, '..', 'app');
const 엔진파일 = ['astro.js', 'engine.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js'];
const 시작 = [2020, 9, 29], 해수 = 12, 한해 = 365.2425;
const 꼴들 = ['시|대운', '시|대운없음', '시모름|대운', '시모름|대운없음'];
function 엔진지문(app) {
  const h = crypto.createHash('sha1');
  엔진파일.forEach(f => h.update(fs.readFileSync(path.join(app || APP, f), 'utf8').replace(/\r\n/g, '\n')));
  return h.digest('hex').slice(0, 12);
}
module.exports = { 엔진지문, 엔진파일, 꼴들 };

if (!isMainThread) {
  globalThis.window = globalThis;
  엔진파일.forEach(f => (0, eval)(fs.readFileSync(path.join(workerData.app, f), 'utf8')));
  const T = globalThis.ChaeksaToday, E = globalThis.ChaeksaEngine;
  const s0 = new Date(시작[0], 시작[1], 시작[2]), s1 = new Date(시작[0] + 해수, 시작[1], 시작[2]);
  const 셈 = {}, 날 = {};
  꼴들.forEach(c => { 셈[c] = {}; 날[c] = 0; });
  for (const inp of workerData.사람) {
    const 생일 = new Date(inp.year, inp.month - 1, inp.day);
    for (const 판 of [inp, Object.assign({}, inp, { hour: null, minute: null })]) {
      const R = E.calc(판), 시 = R.pillars.hour ? '시' : '시모름';
      for (let d = s0; d < s1; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        if (d <= 생일) continue;
        const c = 시 + '|' + (E.currentDaeun(R, d) ? '대운' : '대운없음');
        날[c]++;
        const a = T.하루작용(R, d).행동;
        if (a) 셈[c][a.열쇠] = (셈[c][a.열쇠] || 0) + 1;
      }
    }
  }
  parentPort.postMessage({ 셈, 날 });
} else if (require.main === module) {
  const argv = process.argv.slice(2), 인자 = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] != null ? argv[i + 1] : d; };
  const N = +인자('n', 6000) || 6000, W = Math.max(1, +인자('workers', Math.max(1, Math.min(12, os.cpus().length - 2))) || 4), 쓰기 = argv.indexOf('--write') >= 0;
  let seed = 20261029;
  const rnd = n => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * n); };
  const 사람 = [];
  for (let p = 0; p < N; p++) 사람.push({ year: 1950 + rnd(82), month: 1 + rnd(12), day: 1 + rnd(28), hour: rnd(24), minute: rnd(60), gender: rnd(2) ? 'F' : 'M', longitude: 127, tzOffset: 9 });
  const t0 = Date.now(), 몫 = Math.ceil(N / W);
  Promise.all(Array.from({ length: W }, (_, i) => new Promise((ok, no) => {
    const w = new Worker(__filename, { workerData: { app: APP, 사람: 사람.slice(i * 몫, (i + 1) * 몫) } });
    w.on('message', ok); w.on('error', no);
  }))).then(rs => {
    const 셈 = {}, 날 = {};
    꼴들.forEach(c => { 셈[c] = {}; 날[c] = 0; });
    rs.forEach(r => 꼴들.forEach(c => { 날[c] += r.날[c]; Object.keys(r.셈[c]).forEach(k => { 셈[c][k] = (셈[c][k] || 0) + r.셈[c][k]; }); }));
    const 열쇠들 = [...new Set(꼴들.flatMap(c => Object.keys(셈[c])))].sort();
    const 표 = {};
    꼴들.forEach(c => { 표[c] = {}; 열쇠들.forEach(k => { 표[c][k] = 날[c] ? Math.round((셈[c][k] || 0) / 날[c] * 한해 * 1000) / 1000 : 0; }); });
    const 판 = { 사람: N, 시작: 시작[0] + '-' + String(시작[1] + 1).padStart(2, '0') + '-' + String(시작[2]).padStart(2, '0'), 해: 해수, 엔진: 엔진지문(), 날: 날 };
    console.log('보통값 — ' + N + '명(시각 아는 판 · 모르는 판) × ' + 해수 + '해 · 열쇠 ' + 열쇠들.length + ' · ' + ((Date.now() - t0) / 1000).toFixed(0) + '초 · 엔진 지문 ' + 판.엔진);
    console.log('  꼴마다 센 날: ' + 꼴들.map(c => c + ' ' + 날[c].toLocaleString('en-US')).join(' · '));
    열쇠들.forEach(k => console.log('  ' + k.padEnd(14) + 꼴들.map(c => String(표[c][k]).padStart(8)).join('')));
    if (!쓰기) { console.log('(--write 를 붙이면 app/why-core.js 에 씁니다)'); return; }
    const F = path.join(APP, 'why-core.js'), 원문 = fs.readFileSync(F, 'utf8'), crlf = 원문.indexOf('\r\n') >= 0, t = 원문.replace(/\r\n/g, '\n');
    const 앞 = t.indexOf('// ── 보통 시작'), 뒤 = t.indexOf('  // ── 보통 끝');
    if (앞 < 0 || 뒤 < 0) throw new Error('why-core.js 에 보통 시작 · 끝 표시가 없어요');
    const 줄끝 = t.indexOf('\n', 앞) + 1;
    const 새 = t.slice(0, 줄끝) + '  const 보통판 = ' + JSON.stringify(판) + ';\n  const 보통표 = ' + JSON.stringify(표) + ';   // 꼴 → 열쇠 → 1년 평균(날)\n' + t.slice(뒤);
    fs.writeFileSync(F, crlf ? 새.replace(/\n/g, '\r\n') : 새);
    console.log('썼어요 → ' + F);
  }).catch(e => { console.error(e); process.exit(1); });
}
