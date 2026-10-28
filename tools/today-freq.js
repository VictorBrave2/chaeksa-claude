// 오늘의 운세 사건 빈도 — 저녁 기록 답을 조각 열쇠마다 센다(10-28 사장님 「사건 빈도수를 측정하란 뜻이야」).
//   node tools/today-freq.js [일수=90]
// 읽는 법
//   일어남 = 비슷 ÷ (비슷 + 다름 + 없음). 열쇠마다 낸다.
//   바닥 = 모든 열쇠를 합친 일어남. 어떤 열쇠의 일어남이 바닥과 같으면 그 문장은 「누구에게나 그날 그만큼 일어나는 일」이다 —
//   예고가 맞힌 게 아니라 원래 그만큼 일어난다. 바닥보다 높아야 그 날 · 그 사람을 가려낸 것이다.
//   같은 십신끼리(대비 셋 합침) · 쪽끼리 묶은 줄도 낸다 — 열쇠 112개로 나누면 처음엔 표본이 모자란다.
// 서버 값은 공개 anon 열쇠로 today_note_stats(server/migrate-42) 만 부른다.
const fs = require('fs'), path = require('path');
const cfg = fs.readFileSync(path.join(__dirname, '..', 'app', 'config.js'), 'utf8');
const url = (cfg.match(/url:\s*'([^']+)'/) || [])[1], key = (cfg.match(/anonKey:\s*'([^']+)'/) || [])[1];
const days = +process.argv[2] || 90;
(async () => {
  const r = await fetch(url + '/rest/v1/rpc/today_note_stats', { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify({ days }) });
  if (!r.ok) { console.log('서버가 답하지 않음', r.status, (await r.text()).slice(0, 200), '\n→ server/migrate-42-today-note.sql 을 Supabase SQL 창에서 한 번 돌려야 한다.'); return; }
  const rows = await r.json();
  const 묶기 = (f) => { const m = {}; for (const x of rows) { const k = f(x); if (!k) continue; const o = m[k] || (m[k] = { 비슷: 0, 다름: 0, 없음: 0, 사람: 0 }); o[x.answer] = (o[x.answer] || 0) + x.n; o.사람 += x.people; } return m; };
  const 율 = (o) => { const t = o.비슷 + o.다름 + o.없음; return t ? o.비슷 / t : 0; };
  const 표 = (제목, m, 바닥) => {
    console.log('\n' + 제목);
    Object.entries(m).sort((a, b) => (b[1].비슷 + b[1].다름 + b[1].없음) - (a[1].비슷 + a[1].다름 + a[1].없음)).forEach(([k, o]) => {
      const t = o.비슷 + o.다름 + o.없음, p = 율(o);
      console.log('  ' + k.padEnd(22) + ' 답 ' + String(t).padStart(4) + ' · 비슷 ' + o.비슷 + ' 다름 ' + o.다름 + ' 없음 ' + o.없음 + ' · 일어남 ' + (p * 100).toFixed(0) + '%' + (바닥 != null && t >= 20 ? (p - 바닥 >= 0.1 ? '  ▲ 바닥보다 높음' : p - 바닥 <= -0.1 ? '  ▼ 바닥보다 낮음' : '  = 바닥과 같음') : (t < 20 ? '  (20 미만 — 아직 판단 안 함)' : '')));
    });
  };
  const 전체 = 묶기(() => '전체')['전체'];
  if (!전체) { console.log(days + '일 동안 저녁 기록이 아직 없다.'); return; }
  const 바닥 = 율(전체);
  console.log(days + '일 · 답 ' + (전체.비슷 + 전체.다름 + 전체.없음) + ' · 바닥(전체 일어남) ' + (바닥 * 100).toFixed(0) + '%');
  표('조용한 날 / 아닌 날', 묶기((x) => x.quiet ? '조용한 날' : '변화 있는 날'), 바닥);
  표('십신(쪽 · 대비 합침)', 묶기((x) => (x.key || '').split('|')[2]), 바닥);
  표('쪽 + 십신', 묶기((x) => { const a = (x.key || '').split('|'); return a[1] + '|' + a[2]; }), 바닥);
  표('조각 열쇠(화면 문장 하나)', 묶기((x) => x.key), 바닥);
})();
