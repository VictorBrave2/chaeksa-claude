// 상담 후보 시각마다 자미두수 명반에서 원문이 좋게 본 구절(길) · 조심하라고 한 구절(흉)을 뽑는다 — 10-14 사장님 「이 방식을 상담 스킬에 저장해」.
// 길흉 표시는 비공개 서버 /api/myeongban 의 칸 · 궁줄 걸림 줄에 붙은 것 그대로(지어내지 않음). 같은 구절은 한 번만 센다.
//   node tools/consult_ziwei_lines.js <나갈.json> <곳 KR:성남> <M|F> 2027-01-14T10:39 2027-01-11T10:38 …
//   → [{ 시각, 명궁, 좋게, 조심, 길:[{궁,별,구절,뜻}], 흉:[…] }] · 화면에 조심 적은 순으로 찍는다
const fs = require('fs');
const [out, place, g, ...when] = process.argv.slice(2);
(async () => {
  const rows = [];
  for (const w of when) {
    const [날, 때] = w.split('T'); const [y, mo, d] = 날.split('-').map(Number); const [h, m] = 때.split(':').map(Number);
    const r = await fetch('https://chaeksa-behavior-core.vercel.app/api/myeongban', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://chaeksa.kr' }, body: JSON.stringify({ year: y, month: mo, day: d, hour: h, minute: m, gender: g, place }) });
    const j = await r.json();
    const 길 = [], 흉 = [], seen = new Set();
    const add = (별, 궁, x) => { if (seen.has(x.id)) return; seen.add(x.id); const o = { 궁, 별, 구절: x.구절, 뜻: x.뜻 || '', 줄: x.줄 || '' }; if (x.길흉 === '길') 길.push(o); else if (x.길흉 === '흉') 흉.push(o); };
    for (const [k, c] of Object.entries(j.칸 || {})) { const [별, 궁] = k.split('|'); (c.걸림 || []).forEach(x => add(별, 궁, x)); }
    for (const q of (j.명반 || {}).궁 || []) ((q.궁줄 || {}).걸림 || []).forEach(x => add('', q.이름, x));
    const 명 = ((j.명반 || {}).궁 || []).find(q => q.이름 === '命宮') || {};
    rows.push({ 시각: w, 명궁: (명.지지 || '') + ' ' + ((명.주성 || []).map(s => s.이름).join(' · ') || '빈 궁'), 좋게: 길.length, 조심: 흉.length, 길, 흉 });
  }
  fs.writeFileSync(out, JSON.stringify(rows, null, 1));
  [...rows].sort((a, b) => a.조심 - b.조심 || b.좋게 - a.좋게).forEach((r, i) => console.log((i + 1) + '등 ' + r.시각 + ' | 명궁 ' + r.명궁 + ' | 좋게 ' + r.좋게 + ' · 조심 ' + r.조심));
})();
