// COPY-0019: pass the local synthetic fixture cache from distinct-measure.js.
'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
require('./app/jeongtong-distinct-reading.js');
require('./app/myeongban-editorial.js');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const D=globalThis.ChaeksaJeongtongDistinct,Z=globalThis.ChaeksaZiweiEditorial;
const protectedFilter=f=>Object.fromEntries(Object.entries(f).filter(([k])=>!['title','line'].includes(k)));
let n=0;
for(const response of Object.values(data.jt)){
  const raw=response.story,before=JSON.stringify(raw),after=D.apply(raw);
  assert.equal(JSON.stringify(raw),before,'Saju input mutation');
  assert.deepEqual(after.axes,raw.axes,'Saju judgments/axis values');
  for(const key of ['percent','count','sampleSize','scheme','groups'])assert.deepEqual(after.filterStory[key],raw.filterStory[key],key);
  assert.deepEqual(after.filterStory.filters.map(protectedFilter),raw.filterStory.filters.map(protectedFilter),'Saju numerical/classical evidence');
  assert.equal(after.distinct.unmappedReasons.length,0,'Untranslated engine reason');
  assert(!/타고난 성향과 성립 조건|귀한 사람/.test(after.filterStory.conclusion));
  if(raw.axes.find(a=>a.id==='성패')?.값==='띠었다')assert(after.distinct.caution,'Flaw must remain visible');
  n++;
}
let z=0,zero=0;
for(const response of Object.values(data.mb)){
  const raw=response.filterStory,before=JSON.stringify(raw),after=Z.present(raw);
  assert.equal(JSON.stringify(raw),before,'Ziwei input mutation');
  for(const key of ['filters','percent','count','sampleSize','scheme'])assert.deepEqual(after[key],raw[key],key);
  const html=Z.html(raw),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  assert(html.includes(escape(after.conclusion)),'Measured conclusion must be rendered');
  assert(html.includes(escape(after.heading).replace(/\n/g,'<br>')),'Measured heading must be rendered');
  assert.deepEqual(Z.present(after),after,'Presentation is idempotent');
  if(!raw.filters.length)zero++;
  z++;
}
console.log(`PASS: ${n} Saju + ${z} Ziwei synthetic responses; protected values/quotes/order unchanged; ${zero} empty-filter cases rendered.`);
