// 오늘의 운세 견본 찍기 — 무작위 명식 × 날짜로 화면 위 세 줄(제목 · 때 줄 · 생각 줄)을 찍는다. 글을 고친 뒤 조합이 어긋나는지 눈으로 본다.
// 쓰기: node tools/today-sample.js [사람 수=20] [날 수=7] [시작 날짜=2026-11-01]
'use strict';
const fs = require('fs'), path = require('path'), A = path.join(__dirname, '../app');
globalThis.window = globalThis;
for (const f of ['astro.js', 'engine.js', 'sipseong.js', 'sipseong-byeonhwa.js', 'today-core.js', 'today-pieces.js']) eval(fs.readFileSync(path.join(A, f), 'utf8'));
const T = globalThis.ChaeksaToday, P = globalThis.ChaeksaTodayPieces, E = globalThis.ChaeksaEngine;
const N = +process.argv[2] || 20, D = +process.argv[3] || 7, [y0, m0, d0] = (process.argv[4] || '2026-11-01').split('-').map(Number);
let seed = 4242; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const 시각 = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
for (let p = 0; p < N; p++) {
  const 입력 = { year: 1955 + rnd(60), month: 1 + rnd(12), day: 1 + rnd(28), hour: rnd(24), minute: rnd(60), gender: rnd(2) ? 'F' : 'M', longitude: 127, tzOffset: 9 };
  const R = E.calc(입력);
  console.log('\n■ ' + 입력.year + '년생 ' + (입력.gender === 'F' ? '여' : '남'));
  for (let i = 0; i < D; i++) {
    const v = T.오늘(R, new Date(y0, m0 - 1, d0 + i)), 줄 = T.조립(v, P).칸[0].줄, g = k => (줄.find(x => x.자리 === k) || {}).글 || '';
    const 열 = [v.행동 && v.행동.열쇠, v.때 && v.때.일열쇠, v.때 && (v.때.자리말열쇠 || v.때.상대열쇠), v.생각 && v.생각.열쇠].filter(Boolean).join(' · ');
    console.log('  ' + v.날짜 + ' ' + v.요일 + ' ' + v.간지);
    console.log('    제목  ' + (g('결과.한줄') || '(없음 — 옛 첫 줄)'));
    if (v.때) console.log('    때    [' + g('때.이름') + ' ' + 시각(v.때.시작분) + '~' + 시각(v.때.끝분) + '] ' + g('때.한줄') + (g('이음.뒤') ? ' ' + g('이음.뒤') : ''));
    if (g('생각.한줄')) console.log('    생각  ' + g('생각.한줄') + (g('이음.앞') ? ' ' + g('이음.앞') : ''));
    console.log('    열쇠  ' + 열);
  }
}
