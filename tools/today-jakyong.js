const fs=require('fs'),path=require('path'),A='C:/Users/LEE/Desktop/chaeksa-main-wt/app';
globalThis.window=globalThis;for(const f of ['engine.js','sipseong.js','sipseong-byeonhwa.js'])eval(fs.readFileSync(path.join(A,f),'utf8'));
const B=ChaeksaByeonhwa,E=ChaeksaEngine;let seed=777;const rnd=n=>{seed=(seed*1103515245+12345)%2147483648;return seed%n};
const N=+process.argv[2]||500,D=365;
// 하루 = 오늘(일운) 십성이 체(원국 · 대운 · 세운 · 월운)의 어느 층 어느 무리와 만나나 — 쪽(천간/지지)마다
function 하루(L,층있음){const r={};for(const 쪽 of ['천간','지지']){const 오늘=L.층.find(x=>x.이름==='일운')[쪽];const 체=[];
 for(const g of L.원국[쪽])체.push('원국'+g.무리);for(const x of L.층)if(x.이름!=='일운'&&x[쪽])체.push(x.이름+x[쪽].무리);
 r[쪽]={오늘:오늘.십신,체:층있음?[...new Set(체)].sort():[...new Set(체.map(s=>s.slice(-2)))].sort()}};return r}
const 안={
 '무리만(층 안 봄)':L=>{const h=하루(L,false);return ['천간','지지'].map(k=>h[k].오늘+'>'+h[k].체.join(',')).join('/')},
 '층까지(원국·대운·세운·월운)':L=>{const h=하루(L,true);return ['천간','지지'].map(k=>h[k].오늘+'>'+h[k].체.join(',')).join('/')},
};
const 이름=Object.keys(안),온=이름.map(()=>new Set()),한해=이름.map(()=>[]),짝=new Set();
for(let p=0;p<N;p++){const R=E.calc({year:1960+rnd(50),month:1+rnd(12),day:1+rnd(28),hour:rnd(24),minute:rnd(60),gender:rnd(2)?'F':'M',longitude:127,tzOffset:9});
 const 본=이름.map(()=>new Set());
 for(let i=0;i<D;i++){const L=B.층표(R,new Date(2026,10,1+i));이름.forEach((n,j)=>{const k=안[n](L);온[j].add(k);본[j].add(k)});
  const h=하루(L,true);for(const 쪽 of ['천간','지지'])for(const c of h[쪽].체)짝.add(쪽+'|'+h[쪽].오늘+'|'+c)}
 이름.forEach((n,j)=>한해[j].push(본[j].size))}
const 가=a=>{const s=a.slice().sort((x,y)=>x-y);return s[s.length>>1]};
이름.forEach((n,j)=>console.log(n.padEnd(26),'하루 가짓수(전체)',온[j].size,'| 한 사람 1년',가(한해[j])+'가지'));
console.log('써야 할 짝 글(쪽 × 오늘 십성 × 층 × 무리) 실제 나온 수:',짝.size);
