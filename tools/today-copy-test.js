// COPY-0020: copy completeness, actual 1,000 x 60 coverage, and review fixtures.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');global.window=global;
for(const f of ['astro','engine','sipseong','sipseong-byeonhwa','today-core','today-pieces'])eval(fs.readFileSync(path.join(root,'app',f+'.js'),'utf8'));
const T=ChaeksaToday,P=ChaeksaTodayPieces;
assert.equal(Object.keys(P).length,112);assert.equal(Object.values(P).flatMap(Object.values).length,475);
for(const [key,p] of Object.entries(P))for(const [field,text] of Object.entries(p)){assert(text.trim(),key+'.'+field);assert(!/수 있|편이|십성 변화 엔진|실단|법전|변동폭/.test(text),key+'.'+field+': '+text);}
let seed=777;const rnd=n=>{seed=(seed*1103515245+12345)%2147483648;return seed%n};
let count=0,quiet=0;const distinct=new Set();
for(let n=0;n<1000;n++){
 const R=ChaeksaEngine.calc({year:1960+rnd(50),month:1+rnd(12),day:1+rnd(28),hour:n%20===0?null:rnd(24),minute:rnd(60),gender:rnd(2)?'F':'M',longitude:127,tzOffset:9});
 for(let d=0;d<60;d++){
  const v=T.오늘(R,new Date(2026,10,1+d)),a=T.조립(v,P);assert.equal(a.빈.length,0);assert(P[v.첫줄.열쇠].주한줄);count++;if(v.조용)quiet++;if(d===0)distinct.add(P[v.첫줄.열쇠].한줄);
 }
}
const cases=[{id:'fiction-a',name:'가상 인물 A',birth:{year:1994,month:3,day:14,hour:9,minute:10,gender:'F',longitude:127,tzOffset:9}},{id:'fiction-b',name:'가상 인물 B',birth:{year:1987,month:8,day:22,hour:16,minute:30,gender:'M',longitude:127,tzOffset:9}},{id:'fiction-c',name:'가상 인물 C · 시각 모름',birth:{year:2001,month:12,day:5,hour:null,minute:null,gender:'F',longitude:127,tzOffset:9}}];
const examples=[];
for(const p of cases)for(const date of ['2026-11-01','2026-11-02','2026-11-09']){
 const v=T.오늘(ChaeksaEngine.calc(p.birth),new Date(date+'T12:00:00')),copy=P[v.첫줄.열쇠];examples.push({name:p.name,birth:p.birth,date,quiet:v.조용,key:v.첫줄.열쇠,copy});
}
assert(examples.some(x=>x.quiet));assert.equal(new Set(examples.filter(x=>x.date==='2026-11-01').map(x=>x.copy.한줄)).size,3);
console.log(JSON.stringify({count,quiet,firstLines:distinct.size,keys:112,fields:475,missing:0,forbidden:0,examples},null,2));
