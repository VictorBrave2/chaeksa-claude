// 상담 후보 시각마다 자미두수 명반에서 원문이 좋게 본 구절(길) · 조심하라고 한 구절(흉)을 뽑고, 센 말에 꼬리표를 단다.
// 10-14 사장님 「이 방식을 상담 스킬에 저장해」 → 「첫째는 사주 먼저니까 자미두수는 경고나 주목이라고 꼬리표를 달아줘 센 말이 뜨면」.
//   자미두수는 순위에 쓰지 않는다. 걸린 구절에 아래 센 말이 있으면 「주목」(크게 좋게) · 「경고」(크게 나쁘게) 꼬리표만 붙인다.
//   센 말 목록은 《자미두수전서》 원문에 실제로 여러 번 나오는 말에서 골랐다(10-14 원문 전체 셈: 夭 86 · 貧賤/下賤/孤貧 58 · 公卿/三公/將相 26 · 富貴雙全/大富/巨富 27 …).
// 길흉 표시는 비공개 서버 /api/myeongban 의 칸 · 궁줄 걸림 줄에 붙은 것 그대로(지어내지 않음). 같은 구절은 한 번만 센다.
//   node tools/consult_ziwei_lines.js <나갈.json> <곳 KR:성남> <M|F> 2027-01-14T10:39 2027-01-11T10:38 …
//   → [{ 시각, 명궁, 좋게, 조심, 주목:[구절…], 경고:[구절…], 길:[{궁,별,구절,뜻}], 흉:[…] }]
const fs = require('fs');
const 주목말 = ['富贵双全', '富貴雙全', '大富', '巨富', '大贵', '大貴', '贵不可言', '貴不可言', '富不可言', '位至三公', '三公', '公卿', '将相', '將相', '福寿双全', '福壽雙全', '终身获吉', '終身獲吉', '终身富贵', '一生富贵', '权贵非小', '權貴非小', '财官双美', '財官雙美', '腰金衣紫', '极聪明', '極聰明', '贵格', '貴格'];
const 경고말 = ['夭', '刑戮', '遭刑', '凶死', '横死', '橫死', '贫贱', '貧賤', '下贱', '下賤', '孤贫', '孤貧', '乞丐', '盗', '盜', '残疾', '殘疾', '破家', '绝嗣', '絕嗣', '极贫', '極貧', '克三妻', '全无子', '全無子', '娼'];
const 걸리나 = (s, 말들) => 말들.filter(w => s.includes(w));
const [out, place, g, ...when] = process.argv.slice(2);
(async () => {
  const rows = [];
  for (const w of when) {
    const [날, 때] = w.split('T'); const [y, mo, d] = 날.split('-').map(Number); const [h, m] = 때.split(':').map(Number);
    const r = await fetch('https://chaeksa-behavior-core.vercel.app/api/myeongban', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://chaeksa.kr' }, body: JSON.stringify({ year: y, month: mo, day: d, hour: h, minute: m, gender: g, place }) });
    const j = await r.json();
    const 길 = [], 흉 = [], 주목 = [], 경고 = [], seen = new Set();
    const add = (별, 궁, x) => {
      if (seen.has(x.id)) return; seen.add(x.id);
      const o = { 궁, 별, 구절: x.구절, 뜻: x.뜻 || '', 줄: x.줄 || '' };
      if (x.길흉 === '길') { 길.push(o); if (걸리나(x.구절, 주목말).length) 주목.push(o); }
      else if (x.길흉 === '흉') { 흉.push(o); if (걸리나(x.구절, 경고말).length) 경고.push(o); }
    };
    for (const [k, c] of Object.entries(j.칸 || {})) { const [별, 궁] = k.split('|'); (c.걸림 || []).forEach(x => add(별, 궁, x)); }
    for (const q of (j.명반 || {}).궁 || []) ((q.궁줄 || {}).걸림 || []).forEach(x => add('', q.이름, x));
    const 명 = ((j.명반 || {}).궁 || []).find(q => q.이름 === '命宮') || {};
    rows.push({ 시각: w, 명궁: (명.지지 || '') + ' ' + ((명.주성 || []).map(s => s.이름).join(' · ') || '빈 궁'), 좋게: 길.length, 조심: 흉.length, 주목, 경고, 길, 흉 });
  }
  fs.writeFileSync(out, JSON.stringify(rows, null, 1));
  for (const r of rows) {
    const 표 = [r.주목.length ? '주목 ' + r.주목.length : '', r.경고.length ? '경고 ' + r.경고.length : ''].filter(Boolean).join(' · ') || '꼬리표 없음';
    console.log(r.시각 + ' | 명궁 ' + r.명궁 + ' | 좋게 ' + r.좋게 + ' · 조심 ' + r.조심 + ' | ' + 표);
    r.주목.forEach(x => console.log('    주목 · ' + x.궁 + ' ' + x.별 + ' 「' + x.구절 + '」 ' + x.뜻));
    r.경고.forEach(x => console.log('    경고 · ' + x.궁 + ' ' + x.별 + ' 「' + x.구절 + '」 ' + x.뜻));
  }
})();
