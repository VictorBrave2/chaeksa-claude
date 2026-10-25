/* 책사 홍보 이미지 — 브라우저와 제작 도구가 같은 캔버스 원고를 쓴다. 고객 정보는 그리지 않는다. */
(function(root){
'use strict';
const W=1080,H=1350;
const C={paper:'#f8f5ed',white:'#fffdf8',ink:'#2b261f',muted:'#756b5c',gold:'#88651f',line:'#d7cbb4',wash:'#eee5d4'};
const SERIF='"Noto Serif KR","Batang",serif',SANS='"Noto Sans KR","Malgun Gothic",sans-serif';
function font(ctx,size,serif=false,weight=400){ctx.font=weight+' '+size+'px '+(serif?SERIF:SANS);}
function text(ctx,s,x,y,size=30,color=C.ink,serif=false,weight=400){font(ctx,size,serif,weight);ctx.fillStyle=color;ctx.fillText(String(s),x,y);}
function line(ctx,x1,y1,x2,y2,color=C.line){ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function wrapLines(ctx,value,maxWidth){
 const lines=[];
 for(const part of String(value||'').split('\n')){
  let current='';
  for(const word of part.split(/\s+/)){
   if(!word)continue;
   if(ctx.measureText((current?current+' ':'')+word).width<=maxWidth){current+=(current?' ':'')+word;continue;}
   if(current){lines.push(current);current='';}
   for(const ch of word){if(current&&ctx.measureText(current+ch).width>maxWidth){lines.push(current);current='';}current+=ch;}
  }
  lines.push(current);
 }
 return lines;
}
function paragraph(ctx,value,x,y,maxWidth,size=30,leading=49,color=C.ink,serif=false,maxLines=Infinity){
 font(ctx,size,serif);ctx.fillStyle=color;const lines=wrapLines(ctx,value,maxWidth),shown=lines.slice(0,maxLines);
 if(lines.length>maxLines){let tail=shown[shown.length-1];while(tail&&ctx.measureText(tail+'…').width>maxWidth)tail=tail.slice(0,-1);shown[shown.length-1]=tail+'…';}
 shown.forEach((s,i)=>ctx.fillText(s,x,y+i*leading));return y+shown.length*leading;
}
function fitText(ctx,value,width,start=70,min=38,serif=true,maxLines=2){
 let size=start;while(size>min){font(ctx,size,serif);if(wrapLines(ctx,value,width).length<=maxLines)break;size-=2;}return size;
}
function base(canvas,label,page){
 canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');ctx.textBaseline='alphabetic';
 ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);ctx.strokeStyle=C.line;ctx.lineWidth=1.5;ctx.strokeRect(32,32,W-64,H-64);
 text(ctx,'策',76,112,48,C.gold,true);text(ctx,'책사',145,109,30,C.ink,true);text(ctx,label,76,171,22,C.muted);
 line(ctx,76,204,1004,204);if(page)text(ctx,page,906,110,21,C.muted);
 return ctx;
}
function footer(ctx,left='출산택일 보고서',right='chaeksa.kr'){
 line(ctx,76,1238,1004,1238);text(ctx,left,76,1290,23,C.muted);font(ctx,25);ctx.fillStyle=C.gold;ctx.textAlign='right';ctx.fillText(right,1004,1290);ctx.textAlign='left';
}
function panel(ctx,x,y,w,h,fill=C.white){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);ctx.strokeStyle=C.line;ctx.strokeRect(x,y,w,h);}
function coverImage(ctx,image,x,y,w,h){
 if(!image)return;const scale=Math.max(w/image.width,h/image.height),dw=image.width*scale,dh=image.height*scale;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+(w-dw)/2,y+(h-dh)*.28,dw,dh);ctx.restore();
}
function sampleTag(ctx,y=1186){text(ctx,'가상 가족 견본 · 2027년 4월 · 서울 · 남아',76,y,22,C.muted);}
const slides=[
 {title:'아이를 만날\n가장 좋은\n날과 시간.',alt:'출산 가능한 범위 안에서 가장 좋은 날과 시간을 골라 드리는 책사 출산택일 보고서.'},
 {title:'첫 추천부터,\n이유까지 받습니다.',alt:'가상 가족 견본의 첫 추천은 2027년 4월 12일 오전 7시 33분부터 9시 32분. 추천 이유와 다음 후보를 보고서에 적습니다.'},
 {title:'왜 이 시간을\n먼저 권할까요?',alt:'계절에 필요한 글자와 돕는 글자를 함께 갖춘 첫 추천. 다른 후보와의 차이와 함께 살핀 아쉬운 점도 설명합니다.'},
 {title:'첫 추천이 어렵다면,\n다음 후보도 있습니다.',alt:'가상 가족 견본의 다음 후보는 4월 13일 05:33부터 07:32, 4월 16일 13:32부터 15:31. 첫 추천과 다른 점도 함께 제공합니다.'},
 {title:'병원에 전할\n시계 시각까지.',alt:'출생지와 시각 보정을 반영해 병원에서 쓰는 시계 시각으로 안내합니다. 가상 가족 견본의 시간은 4월 12일 07:33부터 09:32입니다.'},
 {title:'그날을 고를 이유가\n분명해집니다.',alt:'출산택일 보고서 99,000원, 보통 2~3일. 처음 열기 전 전액 환불. 공개된 가상 가족의 보고서 견본을 먼저 읽어 보세요.'}
];
function drawTaekil(canvas,index,images={}){
 const ctx=base(canvas,'출산택일 보고서',String(index+1).padStart(2,'0')+' / 06');
 if(index===0){
  paragraph(ctx,slides[0].title,76,305,900,76,112,C.ink,true);
  text(ctx,'의사가 정해 준 출산 가능 범위 안에서,',79,614,29,C.muted);
  text(ctx,'책사가 가장 좋은 날과 시간을 골라 드립니다.',79,664,29,C.muted);
  coverImage(ctx,images.offer,76,726,928,448);
  footer(ctx,'가장 추천하는 시간과 그 이유');return canvas;
 }
 paragraph(ctx,slides[index].title,76,309,940,64,100,C.ink,true);
 if(index===1){
  panel(ctx,104,565,900,496,C.wash);panel(ctx,90,550,900,496);panel(ctx,76,535,900,496);
  text(ctx,'책사의 첫 추천',115,596,24,C.gold);text(ctx,'2027년 4월 12일',115,694,49,C.ink,true);
  text(ctx,'오전 7:33–9:32',115,786,58,C.gold,true);line(ctx,115,829,934,829);
  paragraph(ctx,'이 시간을 먼저 권하는 이유와\n다른 후보와의 차이를 함께 적습니다.',115,892,790,31,54,C.ink);
  sampleTag(ctx);footer(ctx);return canvas;
 }
 if(index===2){
  const rows=[['01','필요한 글자를 갖췄습니다.','태어난 계절에 필요한 글자와\n돕는 글자가 함께 있습니다.'],['02','다른 후보와 비교했습니다.','첫 추천을 앞에 권하는 이유를\n같은 기준으로 설명합니다.'],['03','아쉬운 점도 함께 읽습니다.','추천과 함께 살핀 흠도 적어\n선택의 근거를 남깁니다.']];
  rows.forEach((r,i)=>{const y=538+i*199;line(ctx,76,y-34,1004,y-34);text(ctx,r[0],76,y+17,28,C.gold,true);text(ctx,r[1],157,y+17,38,C.ink,true);paragraph(ctx,r[2],157,y+75,810,28,45,C.muted);});
  sampleTag(ctx);footer(ctx);return canvas;
 }
 if(index===3){
  [['다음 후보 02','4월 13일','오전 5:33–7:32'],['다음 후보 03','4월 16일','오후 1:32–3:31']].forEach((r,i)=>{const y=540+i*262;panel(ctx,76,y,928,224);text(ctx,r[0],112,y+48,22,C.gold);text(ctx,r[1],112,y+121,44,C.ink,true);text(ctx,r[2],449,y+121,43,C.gold,true);});
  text(ctx,'첫 추천과 다른 점도 함께 받습니다.',76,1133,30,C.muted);sampleTag(ctx);footer(ctx);return canvas;
 }
 if(index===4){
  panel(ctx,76,542,928,338);text(ctx,'병원에 전달할 시간 · 4월 12일',114,607,25,C.muted);
  text(ctx,'07:33',114,742,88,C.gold,true);text(ctx,'—',495,729,52,C.muted,true);text(ctx,'09:32',657,742,88,C.gold,true);text(ctx,'오전 · 병원에서 쓰는 시계 시각',114,825,26,C.muted);
  paragraph(ctx,'출생지와 시각 보정을 반영한 뒤,\n병원에 전달할 시계 시각으로 안내합니다.',76,965,928,31,56,C.ink);
  paragraph(ctx,'담당 의사와 정한 출산 가능 범위 안에서 선택합니다.',76,1118,928,25,42,C.muted);sampleTag(ctx);footer(ctx);return canvas;
 }
 text(ctx,'출산택일 보고서 한 벌',76,570,30,C.muted);text(ctx,'99,000',76,689,105,C.gold,true);text(ctx,'원',526,687,46,C.gold,true);
 text(ctx,'보통 2~3일 · 처음 열어 보기 전 전액 환불',76,765,27,C.muted);
 line(ctx,76,832,1004,832);text(ctx,'보고서 견본부터 읽어 보세요.',76,934,43,C.ink,true);
 text(ctx,'chaeksa.kr/taekil-sample.html',76,1006,29,C.gold);
 paragraph(ctx,'아이를 만날 가장 좋은 날과 시간,\n책사에게 맡기세요.',76,1094,928,29,49,C.muted);
 footer(ctx,'책사 · 출산택일');return canvas;
}
function selectResult(m){
 const all=Array.isArray(m?.filterStory?.filters)?m.filterStory.filters:[],keys=new Set(),picked=[];
 // The card adds no interpretation. Prefer distinct conditions beside the identity already shown.
 for(const f of [...all.filter(f=>!String(f.key).startsWith('type:')), ...all]){
  const signature=String(f.title||'').trim();if(!signature||keys.has(signature))continue;
  if(String(f.key).startsWith('type:')&&picked.length)continue;
  keys.add(signature);picked.push({title:signature,name:String(f.name||''),book:String(f.book||'')});if(picked.length===3)break;
 }
 return {title:String(m?.identity?.title||'나의 사주에 담긴 이름'),name:String(m?.identity?.name||''),hanja:String(m?.identity?.hanja||''),line:String(m?.identity?.line||''),conditions:picked,count:all.length};
}
function drawResult(canvas,m){
 const v=selectResult(m),ctx=base(canvas,'옛 책이 나를 좋게 본 이유');
 text(ctx,'나에게도, 이런 이름이 있습니다.',76,281,29,C.muted);
 const titleSize=fitText(ctx,v.title,900,76,46,true,2);
 const end=paragraph(ctx,v.title,76,350,900,titleSize,titleSize*1.48,C.ink,true,2);
 text(ctx,[v.name,v.hanja].filter(Boolean).join(' · '),79,Math.max(502,end+12),29,C.gold,true);
 const start=600,rowH=151;
 if(v.conditions.length){
  v.conditions.forEach((f,i)=>{const y=start+i*rowH,indent=i*10;panel(ctx,76+indent,y,928-indent,rowH-14);text(ctx,String(i+1).padStart(2,'0'),105+indent,y+49,24,C.gold,true);text(ctx,f.book,169+indent,y+43,20,C.muted);const size=fitText(ctx,f.title,778-indent,32,23,true,2);paragraph(ctx,f.title,169+indent,y+80,778-indent,size,size*1.35,C.ink,true,2);});
  text(ctx,'나에게 겹친 '+v.count+'가지 좋은 조건 중에서',76,1114,25,C.muted);
 }else paragraph(ctx,v.line,76,670,900,36,66,C.ink,true,3);
 text(ctx,'당신의 이름도 찾아보세요.',76,1182,33,C.gold,true);
 footer(ctx,'정통사주 · 무료로 내 이름 찾기','chaeksa.kr');return canvas;
}
root.ChaeksaPromoArt={drawTaekil,drawResult,selectResult,slides,W,H};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ChaeksaPromoArt;
})(typeof window!=='undefined'?window:globalThis);
