/* COPY-0026 묶음 ④ 수정: 지정표·전체 전후 기록·범위·직접 뜻 검사. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=s=>{const c={};vm.runInNewContext(s,c);return JSON.parse(JSON.stringify(c.ChaeksaThreePieces));};
const base=process.argv[2]||cp.execFileSync('git',['merge-base','HEAD','origin/main'],{cwd:root,encoding:'utf8'}).trim();
const before=load(cp.execFileSync('git',['show',`${base}:app/three-pieces.js`],{cwd:root,encoding:'utf8'}));const after=load(read('app/three-pieces.js'));
const get=(o,key)=>key.split('.').reduce((a,k)=>a[k],o.세점.펼침);
const designated=new Map(),log=new Map(),changes=new Map();
for(const line of read('copy-requests/ref/COPY-0026-question-fix3.md').split(/\r?\n/)){
 const a=line.split('|').map(s=>s.trim()),m=/^`(물음카드(?:뜻|말)\.(?:parent|home|move)\.[MWCSP]\d{2}\.(?:바로|거꾸로))`$/.exec(a[1]||'');if(m)designated.set(m[1],a);
}
for(const line of read('copy-requests/ref/COPY-0026-question-4-fix.md').split(/\r?\n/)){
 const a=line.split('|').map(s=>s.trim()),m=/^`(물음카드(?:뜻|말)\.(?:parent|home|move)\.[MWCSP]\d{2}\.(?:바로|거꾸로))`$/.exec(a[1]||'');if(m){assert(!log.has(m[1]));log.set(m[1],a);}
}
assert.equal(designated.size,177);
for(const q of ['parent','home','move']){
 let n=0,specified=0;
 for(const kind of ['물음카드뜻','물음카드말'])for(const [id,face]of Object.entries(after.세점.펼침[kind][q]))for(const [dir,v]of Object.entries(face)){
  const key=`${kind}.${q}.${id}.${dir}`;assert.equal(typeof v,'string');assert(!v.includes('상징'),key+' indirect meaning');assert(!/[{}]/.test(v));if(kind==='물음카드말')assert(v.length>=3&&v.length<=24,key+' length');
  if(v!==get(before,key)){n++;changes.set(key,v);assert(log.has(key),key+' missing change log');assert.equal(log.get(key)[2],get(before,key),key+' before');assert.equal(log.get(key)[3],v,key+' after');assert(log.get(key)[5].length>15,key+' reason');}
  if(designated.has(key)){specified++;assert.notEqual(v,get(before,key),key+' specified unchanged');}
 }
 assert.equal(specified,{parent:55,home:64,move:58}[q]);console.log(`${q}: 지정 ${specified}, 추가 ${n-specified}, 합계 ${n}, 상징 0`);
}
assert.equal(changes.size,log.size,'unrecorded/no-op rows');
for(const q of ['parent','home','move'])for(const k of ['물음카드뜻','물음카드말']){delete before.세점.펼침[k][q];delete after.세점.펼침[k][q];}
assert.deepEqual(after,before,'unrelated values changed');
cp.execFileSync(process.execPath,[path.join(__dirname,'COPY-0026-question-4-check.cjs'),base],{cwd:root,stdio:'inherit'});
console.log(`PASS: 지정 177칸 누락 0, 변경 ${changes.size}칸 전후 일치, 나머지 값 불변`);
