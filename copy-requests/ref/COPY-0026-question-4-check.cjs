/* COPY-0026 묶음 ④: 936칸 완전성 · 원고표 동일성 · 범위 보존 검사. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const run = src => {const c={};vm.runInNewContext(src,c);return JSON.parse(JSON.stringify(c.ChaeksaThreePieces));};
const current = run(read('app/three-pieces.js'));
const topics = ['parent','home','move'];
const kinds = ['물음카드뜻','물음카드말'];
const source = read('copy-requests/ref/COPY-0026-question-cards.md');
const faces = new Map();
for(const row of source.split('## §3')[0].split(/\r?\n/)){
 const a=row.split('|').map(s=>s.trim()),m=/^`([MWCSP]\d{2})\.(바로|거꾸로)`$/.exec(a[1]||'');
 if(m)faces.set(m[1]+'.'+m[2],{id:m[1],dir:m[2],quote:a[3]});
}
assert.equal(faces.size,156);
let count=0,docs=0;
for(const q of topics){
 const doc=read(`copy-requests/ref/COPY-0026-question-${q}.md`), rows=new Map();
 for(const line of doc.split(/\r?\n/)){
  const a=line.split('|').map(s=>s.trim()),m=/^`([MWCSP]\d{2}\.(?:바로|거꾸로))`/.exec(a[1]||'');
  if(m){assert(!rows.has(m[1]),'duplicate doc row '+q+m[1]);rows.set(m[1],a);}
 }
 assert.equal(rows.size,156,q+' manuscript rows');
 for(const k of kinds){
  const t=current.세점.펼침[k][q];assert.equal(Object.keys(t).length,78,q+k);
  for(const [face,{id,dir,quote}] of faces){
   assert.deepEqual(Object.keys(t[id]).sort(),['거꾸로','바로'].sort());
   const v=t[id][dir],label=`${q}.${k}.${face}`;
   assert.equal(typeof v,'string',label+' gender branches forbidden');assert(v.trim(),label+' empty');assert(!/[{}]/.test(v),label+' placeholders');
   assert(!/(좋은|나쁜|유리한|불리한|길흉|대길|대흉)/.test(v),label+' judgment');
   assert.equal(v,rows.get(face)[k===kinds[0]?2:3],label+' manuscript mismatch');
   assert(rows.get(face)[4].includes(quote),label+' missing source quote/line');
   assert(rows.get(face)[5].length>20,label+' missing rationale');
   if(k===kinds[1]){assert(v.length>=3&&v.length<=24,label+' phrase length');assert(!/(덜한|더한|덜 심한|더 심한)/.test(v),label+' dangling comparison');assert(!/[.!?]$/.test(v),label+' phrase punctuation');}
   count++;
  }
 }
 const n=[...rows.values()].filter(a=>a[4].startsWith('§3 ')).length;assert.equal(n,{parent:6,home:11,move:5}[q],q+' priority rows');
 docs+=rows.size;
 console.log(`${q}: 뜻 156, 말 156, 문서 156행 일치, §3 ${n}면 출처 확인`);
}
assert(current.세점.펼침.물음카드뜻.home.C06.거꾸로.includes('상속'));
assert(current.세점.펼침.물음카드뜻.home.C06.거꾸로.includes('미래'));
const base=process.argv[2]||cp.execFileSync('git',['merge-base','HEAD','origin/main'],{cwd:root,encoding:'utf8'}).trim();
const baseline=run(cp.execFileSync('git',['show',`${base}:app/three-pieces.js`],{cwd:root,encoding:'utf8'}));
for(const k of kinds)for(const q of topics){delete current.세점.펼침[k][q];delete baseline.세점.펼침[k][q];}
assert.deepEqual(current,baseline,'existing text/other sections changed');
for(const f of ['app/three-pieces.js',...topics.map(q=>`copy-requests/ref/COPY-0026-question-${q}.md`)])assert(!/(?<!\r)\n/.test(read(f)),f+' bare LF');
console.log(`PASS: ${count}/936 fields, ${docs}/468 rows, all existing values unchanged vs ${base.slice(0,12)}, CRLF preserved`);
