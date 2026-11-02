'use strict';
// COPY-0032. Rebuild the authored canvas cards; no image-generation API.
// node tools/build-ilgyeol-promo.cjs <bundled node_modules>
const fs=require('fs'),path=require('path');
const ws=path.resolve(__dirname,'..'),modules=process.argv[2];
if(!modules)throw Error('Pass bundled node_modules directory.');
const {createCanvas,loadImage,GlobalFonts}=require(path.join(modules,'@napi-rs/canvas'));
const sharp=require(path.join(modules,'sharp')),Zip=require(path.join(modules,'jszip'));
for(const [file,family] of [['NotoSansKR-VF.ttf','Noto Sans KR'],['NotoSerifKR-VF.ttf','Noto Serif KR']]){
 const p=path.join(process.env.WINDIR||'C:/Windows','Fonts',file);if(fs.existsSync(p))GlobalFonts.registerFromPath(p,family);
}
const W=1080,H=1350,out=path.join(ws,'app/promos/ilgyeol');
const C={paper:'#f8f5ed',white:'#fffdf8',ink:'#2b261f',muted:'#756b5c',gold:'#88651f',line:'#d7cbb4',wash:'#eee5d4'};
const sampleURL='https://chaeksa.kr/ilgyeol-sample.html?from=promo-ilgyeol-post';
const sample='지어낸 사람으로 만든 견본';
const slides=[
 {title:'당신은 이런 일로\n먹고삽니다.',alt:'지어낸 사람으로 만든 견본. 역할과 약속이 정해진 판 안에서 이미 돌아가는 것을 맡아 챙기고 고쳐 가는 일이 이 견본의 결론입니다.',source:'시대가 바뀌어도 달라지지 않는 일의 조건'},
 {title:'이 조건으로 이어지는\n일의 예입니다.',alt:'지어낸 사람의 2026년 기준 직업 예. 공기업 현장 관리, 지점장, 구매·가맹 관리 담당, 외주 관리 PM, 공무원, 업무 자동화 대행. 직업 이름을 약속하는 상품이 아니라 맞는 일의 조건과 그 근거를 제공합니다.',source:'당신에게 어울리는 일 — 2026년 기준'},
 {title:'누가 돈을 주고,\n무엇으로 버는가.',alt:'지어낸 견본에서 돈을 주는 쪽은 나라·공공기관·회사·가게 주인·기업 고객입니다. 돈을 벌어 오는 수단은 직원·팀원·협력 업체·내 손·내 기술·기계·프로그램입니다.',source:'돈을 주는 쪽 / 돈을 물어다 주는 것 도식'},
 {title:'맞는 자리와\n부딪히는 자리.',alt:'지어낸 견본에서 역할과 책임이 정해지고 약속을 분명히 지키는 자리가 맞습니다. 납득하기 전에 움직이라 하거나 준비 없이 실행을 재촉하는 자리와는 부딪힙니다. 조건마다 근거를 확인할 수 있습니다.',source:'맞는 일의 조건 1 / 피해야 할 일의 조건 6'},
 {title:'2027~2036,\n해마다 일의 흐름.',alt:'지어낸 견본의 앞으로 10년 중 세 해. 2028년 막힘 0·풀림 1, 2029년 막힘 3·풀림 1, 2033년 막힘 3·풀림 2. 그해 막히는 곳과 풀리는 곳을 센 수이며 수익률이 아닙니다.',source:'일의 흐름 — 2027년부터 2036년까지 / 해마다 자세히 보기'},
 {title:'내 생년월일로\n일과 돈을 확인하세요.',alt:'내게 맞는 일과 돈 69,000원. 저장된 사람 한 명을 골라 결제하면 보통 1~2분 안에 화면에서 열립니다. 결제한 계정에 2년 보관. 처음 열기 전 또는 만들지 못했을 때 전액 환불, 연 뒤에는 결제 취소가 제한될 수 있습니다. 지어낸 사람의 전체 견본을 먼저 볼 수 있습니다.',source:'COPY-0032 가격 확인값 / yaksok.js ilgyeol 약속 장부'}
];
function font(c,size,serif=false,weight=400){c.font=weight+' '+size+'px '+(serif?'"Noto Serif KR","Batang",serif':'"Noto Sans KR","Malgun Gothic",sans-serif');}
function text(c,s,x,y,size=30,color=C.ink,serif=false,weight=400){font(c,size,serif,weight);c.fillStyle=color;c.fillText(s,x,y);}
function lines(c,s,width){const result=[];for(const p of s.split('\n')){let row='';for(const word of p.split(/\s+/)){if(c.measureText((row?row+' ':'')+word).width<=width){row+=(row?' ':'')+word;continue;}if(row)result.push(row);row='';for(const ch of word){if(row&&c.measureText(row+ch).width>width){result.push(row);row='';}row+=ch;}}result.push(row);}return result;}
function para(c,s,x,y,width,size=30,leading=48,color=C.ink,serif=false){font(c,size,serif);c.fillStyle=color;const rows=lines(c,s,width);rows.forEach((r,i)=>c.fillText(r,x,y+i*leading));return y+rows.length*leading;}
function line(c,x1,y1,x2,y2){c.strokeStyle=C.line;c.lineWidth=1.5;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function panel(c,x,y,w,h,fill=C.white){c.fillStyle=fill;c.fillRect(x,y,w,h);c.strokeStyle=C.line;c.lineWidth=1.5;c.strokeRect(x,y,w,h);}
function cover(c,img,x,y,w,h,focus=.18){const s=Math.max(w/img.width,h/img.height),dw=img.width*s,dh=img.height*s;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(img,x+(w-dw)/2,y+(h-dh)*focus,dw,dh);c.restore();}
function base(i){const canvas=createCanvas(W,H),c=canvas.getContext('2d');c.textBaseline='alphabetic';c.fillStyle=C.paper;c.fillRect(0,0,W,H);c.strokeStyle=C.line;c.strokeRect(32,32,W-64,H-64);text(c,'策',76,112,48,C.gold,true);text(c,'책사',145,109,30,C.ink,true);text(c,'내게 맞는 일과 돈',76,171,22,C.muted);text(c,String(i+1).padStart(2,'0')+' / 06',906,110,21,C.muted);line(c,76,204,1004,204);para(c,slides[i].title,76,309,940,64,100,C.ink,true);line(c,76,1238,1004,1238);text(c,'내게 맞는 일과 돈',76,1290,23,C.muted);text(c,'chaeksa.kr',856,1290,25,C.gold);text(c,sample,76,1190,23,C.muted);return {canvas,c};}
function card(i,img){const {canvas,c}=base(i);
 if(i===0){para(c,'역할과 약속이 정해진 판 안에서\n이미 돌아가는 것을 맡아\n챙기고 고쳐 가는 일.',76,495,928,34,55);cover(c,img,76,682,928,430);return canvas;}
 if(i===1){text(c,'2026년 기준 직업 예',76,495,27,C.gold);const jobs=['공기업 현장 관리 · 지점장','구매 · 가맹 관리 담당','외주 관리 PM · 공무원','업무 자동화 대행'];jobs.forEach((j,n)=>{const y=548+n*120;panel(c,76,y,928,96);text(c,String(n+1).padStart(2,'0'),108,y+61,26,C.gold,true);text(c,j,185,y+61,36,C.ink,true);});para(c,'직업 이름은 시대에 따라 달라져도,\n맞는 일의 조건은 달라지지 않습니다.',76,1093,928,28,44,C.muted);return canvas;}
 if(i===2){
  panel(c,76,490,928,178);text(c,'돈을 주는 쪽',112,542,26,C.gold);para(c,'나라 · 공공기관 · 회사\n가게 주인 · 기업 고객',112,595,854,34,48);
  text(c,'↓ 돈',482,720,29,C.gold);panel(c,347,751,386,98,C.wash);text(c,'나',519,814,42,C.ink,true);
  text(c,'↑ 돈을 벌어 오는 수단',361,912,29,C.gold);
  panel(c,76,946,928,190);text(c,'돈을 물어다 주는 것',112,997,26,C.gold);para(c,'직원 · 팀원 · 협력 업체\n내 손 · 내 기술 · 기계 · 프로그램',112,1051,854,32,47);return canvas;
 }
 if(i===3){panel(c,76,514,928,237);text(c,'맞는 자리',112,569,27,C.gold);para(c,'역할과 책임이 정해져 있고,\n약속을 분명히 지키는 자리.',112,634,854,36,58,C.ink,true);panel(c,76,788,928,237);text(c,'피할 자리',112,844,27,C.gold);para(c,'납득하기 전에 움직이라 하거나,\n준비 없이 실행을 재촉하는 자리.',112,909,854,36,58,C.ink,true);text(c,'조건마다 「근거 보기」에서 이유를 확인합니다.',76,1110,29,C.muted);return canvas;}
 if(i===4){para(c,'생각으로 깨닫는 것과 실제로 하게 되는 것,\n그해 판정과 막힘·풀림을 함께 봅니다.',76,510,928,31,51);panel(c,76,663,928,340);text(c,'견본의 연도',113,724,27,C.muted);text(c,'막힘',570,724,27,C.muted);text(c,'풀림',809,724,27,C.muted);line(c,113,751,967,751);[['2028','0','1'],['2029','3','1'],['2033','3','2']].forEach((r,n)=>{const y=815+n*76;text(c,r[0],113,y,35,C.ink,true);text(c,r[1],585,y,35,C.gold,true);text(c,r[2],824,y,35,C.gold,true);});text(c,'그해 막히는 곳과 풀리는 곳을 센 수입니다.',76,1072,28,C.muted);text(c,'표는 견본의 10년 중 세 해입니다.',76,1121,27,C.muted);return canvas;}
 text(c,'내게 맞는 일과 돈',76,508,29,C.muted);text(c,'69,000',76,619,100,C.gold,true);text(c,'원',472,617,44,C.gold,true);
 para(c,'저장된 사람 한 명을 고르고 결제하면\n보통 1~2분 안에 화면에서 열립니다.\n결제한 계정에 2년 동안 보관됩니다.',76,696,928,30,49);
 line(c,76,828,1004,828);para(c,'처음 열기 전에는 전액 환불. 만들지 못해도 전액 환불.\n연 뒤에는 결제 취소가 제한될 수 있습니다.',76,878,928,25,41,C.muted);
 para(c,'생년월일 · 태어난 시 · 태어난 곳 · 성별\n결제할 때 카카오 · 네이버 로그인',76,984,928,25,42,C.muted);
 text(c,'전체 견본부터 확인하세요.',76,1094,34,C.ink,true);text(c,'chaeksa.kr/ilgyeol-sample.html',76,1148,27,C.gold);return canvas;
}
function og(img){const canvas=createCanvas(1200,630),c=canvas.getContext('2d');const bg=c.createLinearGradient(0,0,0,630);bg.addColorStop(0,'#11102e');bg.addColorStop(1,'#262049');c.fillStyle=bg;c.fillRect(0,0,1200,630);cover(c,img,0,0,470,630,0);const fade=c.createLinearGradient(300,0,475,0);fade.addColorStop(0,'rgba(20,17,49,0)');fade.addColorStop(1,'rgba(20,17,49,1)');c.fillStyle=fade;c.fillRect(300,0,175,630);text(c,'일과 돈 · 공개 견본',520,203,28,'#e1c581',false,700);text(c,'내게 맞는 일과 돈',520,300,55,'#faf4e6',true,700);text(c,'지어낸 사람으로 먼저 읽어 보세요.',520,363,28,'#d5cce7');text(c,'맞는 일의 조건 · 돈 버는 방식 · 앞으로 10년',520,415,24,'#d5cce7');c.fillStyle='#c6a34e';c.fillRect(520,540,46,46);text(c,'策',529,575,32,'#17122e',true,700);text(c,'책사',583,575,32,'#faf4e6',true,700);text(c,'chaeksa.kr',662,575,25,'#c1b4d2');return canvas;}
async function main(){fs.mkdirSync(out,{recursive:true});const img=await loadImage(path.join(ws,'app/art/content-tarot-v2/body/jt-15-work-m.webp'));const zip=new Zip(),sheet=createCanvas(1080,940),s=sheet.getContext('2d');s.fillStyle='#e9e1d2';s.fillRect(0,0,1080,940);
 for(let i=0;i<6;i++){const n=String(i+1).padStart(2,'0'),canvas=card(i,img),png=canvas.toBuffer('image/png');fs.writeFileSync(path.join(out,n+'.png'),png);fs.writeFileSync(path.join(out,n+'.webp'),await sharp(png).webp({quality:88}).toBuffer());zip.file(n+'.png',png);s.drawImage(canvas,18+(i%3)*354,18+Math.floor(i/3)*460,336,420);}
 fs.writeFileSync(path.join(out,'overview.jpg'),await sharp(sheet.toBuffer('image/png')).jpeg({quality:92}).toBuffer());
 const manifest={created:'2026-11-03',width:W,height:H,slides,source:'https://chaeksa.kr/ilgyeol-sample.html',note:sample+' · 실제 고객 기록 없음 · 직업 이름은 2026년 예',links:{sample:sampleURL,introduction:'https://chaeksa.kr/ilgyeol.html?from=promo-ilgyeol-post',short:'https://chaeksa.kr/ilgyeol-sample.html?from=promo-ilgyeol-short'},illustration:'art/content-tarot-v2/body/jt-15-work-m.webp',method:'기존 책사 삽화와 편집 가능한 캔버스 원고로 제작. 새 삽화 생성 API 사용 없음.'};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');const caption=fs.readFileSync(path.join(out,'게시글.txt'),'utf8');zip.file('게시글.txt',caption);zip.file('읽어주세요.txt','책사 내게 맞는 일과 돈 소개 이미지 6장 · 1080×1350\r\n01~06 순서로 게시하세요. 이 결과는 지어낸 사람으로 만든 견본입니다.\r\n직업 이름은 2026년 기준 예이며 취업·수입을 보장하지 않습니다.\r\n전체 견본 '+sampleURL+'\r\n가격·제공 조건 확인일: 2026-11-03. 변경 시 홍보물도 함께 고치세요.\r\n');fs.writeFileSync(path.join(out,'chaeksa-ilgyeol-promo.zip'),await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}}));
 fs.writeFileSync(path.join(ws,'app/cards/og/ilgyeol-sample.jpg'),await sharp(og(img).toBuffer('image/png')).jpeg({quality:92}).toBuffer());
 const cards=slides.map((x,i)=>'<figure><img src="'+String(i+1).padStart(2,'0')+'.png" alt="'+x.alt+'"><figcaption>'+String(i+1).padStart(2,'0')+' · '+x.title.replace(/\n/g,' ')+'</figcaption></figure>').join('\n');
 fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>내게 맞는 일과 돈 — 홍보 6장</title><style>body{margin:0;background:#eee5d4;color:#2b261f;font:16px/1.7 sans-serif}main{max-width:1180px;margin:auto;padding:24px}h1{font-size:25px}a{color:#78551d}header{padding:0 12px 20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px}figure{margin:0}img{display:block;width:100%;height:auto}figcaption{padding:8px;font-size:14px}</style><main><header><h1>내게 맞는 일과 돈 · 홍보 6장</h1><p>'+sample+' · 직업 이름은 2026년 기준 예</p><p><a href="chaeksa-ilgyeol-promo.zip">6장과 게시글 받기</a> · <a href="'+sampleURL+'">전체 견본 보기</a></p></header><div class="grid">'+cards+'</div></main></html>');
 console.log('Created 6 PNG/WebP cards, manifest, overview, ZIP, review page and 1200x630 OG.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
