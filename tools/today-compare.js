// 오늘의 운세 전후 비교 — COPY-0021 전(메인이 10-29 떠 둔 조각표)과 지금 조각표를 칸마다 · 화면마다 나란히.
// 쓰기: node tools/today-compare.js            → copy-requests/ref/COPY-0021-compare.html (사장님이 보는 한 장)
//       node tools/today-compare.js COPY-0022 [--snapshot]   (이름을 주면 그 주문의 전 · 비교 파일)
//       node tools/today-compare.js --snapshot → 지금 조각표를 「전」으로 떠 둔다(copy-requests/ref/COPY-0021-before.json)
'use strict';
const fs = require('fs'), path = require('path'), A = path.join(__dirname, '../app'), REF = path.join(__dirname, '../copy-requests/ref');
const 이름 = (process.argv.find(x => /^COPY-\d+$/.test(x)) || 'COPY-0021'), 전파일 = path.join(REF, 이름 + '-before.json');
const 읽기 = () => { const g = {}; new Function('window', fs.readFileSync(path.join(A, 'today-pieces.js'), 'utf8'))(g); return g.ChaeksaTodayPieces; };
if (process.argv.includes('--snapshot')) { fs.writeFileSync(전파일, JSON.stringify(읽기(), null, 2).replace(/\n/g, '\r\n')); console.log('전 떠 둠 →', path.relative(process.cwd(), 전파일)); process.exit(0); }
globalThis.window = globalThis;
for (const f of ['astro.js', 'engine.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js']) eval(fs.readFileSync(path.join(A, f), 'utf8'));
const T = globalThis.ChaeksaToday, E = globalThis.ChaeksaEngine, 전 = JSON.parse(fs.readFileSync(전파일, 'utf8')), 후 = 읽기();
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
// 1. 화면 견본 — 같은 사람 · 같은 날을 전 · 후 조각표로
let seed = 2910; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const 화면 = (v, P) => { const 줄 = T.조립(v, P).칸[0].줄, g = k => (줄.find(x => x.자리 === k) || {}).글 || ''; const 주 = (P[v.첫줄.열쇠] || {});
  return [['제목', g('결과.한줄') || g('첫줄.한줄')], ['둘째', [g('때.한줄'), g('이음.뒤')].join(' ').trim()], ['생각', [g('생각.한줄'), g('이음.앞')].join(' ').trim()], ['누구', g('첫줄.누구')], ['일', g('첫줄.일')], ['해 보세요', g('첫줄.행동')], ['이번 주 띠', 주.주한줄 || '']]; };
const 견본 = [];
for (let p = 0; p < 8; p++) {
  const 입력 = { year: 1960 + rnd(50), month: 1 + rnd(12), day: 1 + rnd(28), hour: rnd(24), minute: 0, gender: rnd(2) ? 'F' : 'M', longitude: 127, tzOffset: 9 };
  const v = T.오늘(E.calc(입력), new Date(2026, 10, 2 + p));
  견본.push({ 누구: 입력.year + '년생 ' + (입력.gender === 'F' ? '여' : '남') + ' · ' + v.날짜 + ' ' + v.간지, 전: 화면(v, 전), 후: 화면(v, 후) });
}
// 2. 칸마다 — 바뀐 칸만
const 바뀜 = [], 종 = {};
for (const k of Object.keys(후)) for (const f of Object.keys(후[k])) {
  const a = (전[k] || {})[f] || '', b = 후[k][f] || '', 무 = k.split('|')[0];
  종[무] = 종[무] || { 칸: 0, 바뀜: 0 }; 종[무].칸++;
  if (a !== b) { 종[무].바뀜++; 바뀜.push({ k, f, a, b }); }
}
const css = ':root{--bg:#f6f1e7;--fg:#2b2620;--sub:#7a6f60;--line:#ddd2bf;--acc:#8a3b2a;--card:#fffaf1;--old:#efe6d6}@media(prefers-color-scheme:dark){:root{--bg:#171a24;--fg:#ece6da;--sub:#a59c8c;--line:#343a4c;--acc:#e0a07c;--card:#1f2331;--old:#252a3a}}body{background:var(--bg);color:var(--fg);font:16px/1.65 "Noto Sans KR",system-ui,sans-serif;margin:0;padding:24px max(16px,env(safe-area-inset-left))}main{max-width:1100px;margin:auto}h1{font-size:24px;margin:0 0 4px}h2{font-size:19px;margin:32px 0 8px;color:var(--acc)}.sub{color:var(--sub);font-size:14px}.wrap{overflow-x:auto}table{border-collapse:collapse;background:var(--card);width:100%}th,td{border:1px solid var(--line);padding:7px 9px;vertical-align:top;font-size:14px;text-align:left}th{white-space:nowrap;font-weight:600}td.old{background:var(--old);color:var(--sub)}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;margin:12px 0}.card h3{margin:0 0 8px;font-size:15px}';
const html = '<!doctype html><html lang=ko><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>오늘의 운세 전후</title><style>' + css + '</style><main><h1>오늘의 운세 — 전 · 후</h1><p class=sub>' + 이름 + ' · 전 = 주문 직전 조각표 / 후 = 지금 조각표. 바뀐 칸 ' + 바뀜.length + '</p>'
  + '<h2>종류별 바뀐 칸</h2><div class=wrap><table><tr><th>종류</th><th>칸</th><th>바뀜</th></tr>' + Object.keys(종).map(k => '<tr><td>' + k + '</td><td>' + 종[k].칸 + '</td><td>' + 종[k].바뀜 + '</td></tr>').join('') + '</table></div>'
  + '<h2>같은 사람 · 같은 날 화면</h2>' + 견본.map(x => '<div class=card><h3>' + esc(x.누구) + '</h3><div class=wrap><table><tr><th></th><th>전</th><th>후</th></tr>' + x.전.map((r, i) => '<tr><th>' + r[0] + '</th><td class=old>' + esc(r[1]) + '</td><td>' + esc(x.후[i][1]) + '</td></tr>').join('') + '</table></div></div>').join('')
  + '<h2>바뀐 칸 전부</h2><div class=wrap><table><tr><th>열쇠 · 필드</th><th>전</th><th>후</th></tr>' + 바뀜.map(x => '<tr><th>' + esc(x.k) + '<br><span class=sub>' + esc(x.f) + '</span></th><td class=old>' + esc(x.a) + '</td><td>' + esc(x.b) + '</td></tr>').join('') + '</table></div></main>';
const OUT = path.join(REF, 이름 + '-compare.html');
fs.writeFileSync(OUT, html);
console.log('바뀐 칸', 바뀜.length, JSON.stringify(종), '→', path.relative(process.cwd(), OUT));
