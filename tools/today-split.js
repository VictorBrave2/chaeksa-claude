// 오늘의 운세 — 엔진이 하루를 몇 가지로 쪼갤 수 있나(10-28 사장님 「쪼갤수 있는만큼만 쪼개봐」). node tools/today-split.js
const fs=require('fs'),path=require('path'),A='C:/Users/LEE/Desktop/chaeksa-main-wt/app';
globalThis.window=globalThis;for(const f of ['engine.js','sipseong.js','sipseong-byeonhwa.js','today-core.js'])eval(fs.readFileSync(path.join(A,f),'utf8'));
const T=ChaeksaToday,E=ChaeksaEngine;let seed=777;const rnd=n=>{seed=(seed*1103515245+12345)%2147483648;return seed%n};
const N=1000,D=365;
const 줄=(v,쪽)=>[v.첫줄,v.둘째줄].find(x=>x&&x.쪽===쪽);
const 상=x=>x.상태==='이어짐'?'이어':x.처음?'처음':x.다시옴?'다시':'새로';
const 층={
 '1 행동(지지) 십신':v=>{const x=줄(v,'지지');return x?x.십신:'-'},
 '2 + 생각(천간) 십신':v=>{const a=줄(v,'천간'),b=줄(v,'지지');return (a?a.십신:'-')+'/'+(b?b.십신:'-')},
 '3 + 타고난 사주에 있나(겉·속·없음)':v=>{const a=줄(v,'천간'),b=줄(v,'지지');return (a?a.십신+a.원국대비:'-')+'/'+(b?b.십신+b.원국대비:'-')},
 '4 + 처음·다시 옴·이어짐':v=>{const a=줄(v,'천간'),b=줄(v,'지지');return (a?a.십신+a.원국대비+상(a):'-')+'/'+(b?b.십신+b.원국대비+상(b):'-')},
 '5 + 이번 달 바탕':v=>{const a=줄(v,'천간'),b=줄(v,'지지');return (a?a.십신+a.원국대비+상(a):'-')+'/'+(b?b.십신+b.원국대비+상(b):'-')+'|'+v.바탕.map(x=>x.쪽+x.무리).join(',')},
 '6 + 오늘 쉬는 흐름':v=>{const a=줄(v,'천간'),b=줄(v,'지지');return (a?a.십신+a.원국대비+상(a):'-')+'/'+(b?b.십신+b.원국대비+상(b):'-')+'|'+v.바탕.map(x=>x.쪽+x.무리).join(',')+'|'+v.빠짐.map(x=>x.쪽+x.무리).join(',')},
};
const 이름=Object.keys(층),모두=이름.map(()=>new Map()),간격=이름.map(()=>[]),가짓수사람=이름.map(()=>[]);
for(let p=0;p<N;p++){const R=E.calc({year:1960+rnd(50),month:1+rnd(12),day:1+rnd(28),hour:rnd(24),minute:rnd(60),gender:rnd(2)?'F':'M',longitude:127,tzOffset:9});
 const 마지막=이름.map(()=>new Map());
 for(let i=0;i<D;i++){const v=T.오늘(R,new Date(2026,10,1+i));이름.forEach((n,j)=>{const k=층[n](v);모두[j].set(k,(모두[j].get(k)||0)+1);const m=마지막[j].get(k);if(m!=null&&i-m>1)간격[j].push(i-m);마지막[j].set(k,i)})}
 이름.forEach((n,j)=>가짓수사람[j].push(마지막[j].size));}
const 가=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?s[s.length>>1]:'-'};
이름.forEach((n,j)=>{const c=[...모두[j].values()].sort((a,b)=>b-a),t=N*D;console.log(n.padEnd(30),'가짓수',String(모두[j].size).padStart(6),'| 한 사람 1년에 만나는 가짓수',String(가(가짓수사람[j])).padStart(4),'| 같은 것 다시 오는 간격',String(가(간격[j])).padStart(4)+'일','| 가장 흔한 것',(c[0]/t*100).toFixed(1)+'%')});
