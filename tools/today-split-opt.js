const fs=require('fs'),path=require('path'),A='C:/Users/LEE/Desktop/chaeksa-main-wt/app';
globalThis.window=globalThis;for(const f of ['engine.js','sipseong.js','sipseong-byeonhwa.js','today-core.js'])eval(fs.readFileSync(path.join(A,f),'utf8'));
const T=ChaeksaToday,E=ChaeksaEngine;let seed=777;const rnd=n=>{seed=(seed*1103515245+12345)%2147483648;return seed%n};
const N=1000,D=365;const 줄=(v,쪽)=>[v.첫줄,v.둘째줄].find(x=>x&&x.쪽===쪽);
const 상=x=>!x?'':x.상태==='이어짐'?'이어':x.처음?'처음':x.다시옴?'다시':'새로';
const 바=(v,쪽)=>{const b=v.바탕.find(x=>x.쪽===쪽);return b?b.무리:'-'};
const 조각={
 행동사건:v=>{const x=줄(v,'지지');return x?'지'+x.십신:'지-'},
 '행동사건×그쪽 이번 달 바탕':v=>{const x=줄(v,'지지');return (x?x.십신:'-')+바(v,'지지')},
 '행동사건×바탕×처음/다시/이어':v=>{const x=줄(v,'지지');return (x?x.십신+상(x):'-')+바(v,'지지')},
 생각말:v=>{const x=줄(v,'천간');return x?'천'+x.십신:'천-'},
 '생각말×바탕×처음/다시/이어':v=>{const x=줄(v,'천간');return (x?x.십신+상(x):'-')+바(v,'천간')},
};
const 하루={
 '가 행동사건 + 생각말 (지금 추천 120)':v=>조각.행동사건(v)+조각.생각말(v),
 '나 (행동사건×바탕) + 생각말':v=>조각['행동사건×그쪽 이번 달 바탕'](v)+조각.생각말(v),
 '다 (행동사건×바탕×처음) + (생각말×바탕×처음)':v=>조각['행동사건×바탕×처음/다시/이어'](v)+조각['생각말×바탕×처음/다시/이어'](v),
};
const 모두={...조각,...하루},이름=Object.keys(모두),쓸글=이름.map(()=>new Set()),간격=이름.map(()=>[]),한해=이름.map(()=>[]),본날=이름.map(()=>[]);
for(let p=0;p<N;p++){const R=E.calc({year:1960+rnd(50),month:1+rnd(12),day:1+rnd(28),hour:rnd(24),minute:rnd(60),gender:rnd(2)?'F':'M',longitude:127,tzOffset:9});
 const 마=이름.map(()=>new Map()),첫=이름.map(()=>new Map());
 for(let i=0;i<D;i++){const v=T.오늘(R,new Date(2026,10,1+i));이름.forEach((n,j)=>{const k=모두[n](v);쓸글[j].add(k);const m=마[j].get(k);if(m!=null&&i-m>1)간격[j].push(i-m);마[j].set(k,i)})}
 이름.forEach((n,j)=>한해[j].push(마[j].size));}
const 가=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?s[s.length>>1]:'-'};
이름.forEach((n,j)=>console.log(n.padEnd(40),'쓸 글',String(쓸글[j].size).padStart(5),'| 한 사람 1년 가짓수',String(가(한해[j])).padStart(4),'| 같은 하루 다시',String(가(간격[j])).padStart(4)+'일'));
