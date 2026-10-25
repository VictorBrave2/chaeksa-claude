'use strict';
// node tools/build-promo-assets.cjs <bundled node_modules> [private jt-pyo API path]
// Public output contains only authored product copy and fictional examples.
const fs=require('fs'),path=require('path');
const ws=path.resolve(__dirname,'..'),modules=process.argv[2];
if(!modules)throw new Error('Pass the bundled node_modules directory.');
const {createCanvas,loadImage}=require(path.join(modules,'@napi-rs/canvas'));
const sharp=require(path.join(modules,'sharp')),Zip=require(path.join(modules,'jszip'));
const art=require(path.join(ws,'app/promo-art.js'));
const target=path.join(ws,'app/promos/taekil-report'),jtTarget=path.join(ws,'app/promos/jeongtong');
const write=(file,data)=>fs.writeFileSync(file,data);
async function main(){
 fs.mkdirSync(target,{recursive:true});fs.mkdirSync(jtTarget,{recursive:true});
 const images={offer:await loadImage(path.join(ws,'app/art/taekil-advisor-offer-v1.webp'))};
 const zip=new Zip(),sheet=createCanvas(1080,940),s=sheet.getContext('2d');s.fillStyle='#e9e1d2';s.fillRect(0,0,1080,940);
 for(let i=0;i<art.slides.length;i++){
  const canvas=createCanvas(art.W,art.H);art.drawTaekil(canvas,i,images);const png=canvas.toBuffer('image/png'),n=String(i+1).padStart(2,'0');
  write(path.join(target,n+'.png'),png);write(path.join(target,n+'.webp'),await sharp(png).webp({quality:88}).toBuffer());
  zip.file(n+'.png',png);s.drawImage(canvas,18+(i%3)*354,18+Math.floor(i/3)*460,336,420);
 }
 const allCopy=fs.readFileSync(path.join(ws,'copy-requests/COPY-0018-promotion-captions.md'),'utf8');
 const captions=allCopy.slice(allCopy.indexOf('## 출산택일'),allCopy.indexOf('## 정통사주')).trim()+'\n';
 const jtCopy=allCopy.slice(allCopy.indexOf('## 정통사주'),allCopy.indexOf('## 게시 파일')).trim()+'\n';
 write(path.join(target,'게시글.txt'),captions);zip.file('게시글.txt',captions);zip.file('읽어주세요.txt','책사 출산택일 소개 이미지 6장 · 1080×1350\r\n01~06 순서로 게시하세요. 날짜는 가상 가족 견본입니다.\r\n전체 견본 https://chaeksa.kr/taekil-sample.html?from=promo-taekil-post\r\n가격·제공 조건: 2026-10-26 제작 시점. 변경 시 이미지도 다시 제작하세요.\r\n');
 write(path.join(target,'chaeksa-taekil-promo.zip'),await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}}));
 write(path.join(target,'overview.jpg'),await sharp(sheet.toBuffer('image/png')).jpeg({quality:90}).toBuffer());
 const og=createCanvas(1200,630),g=og.getContext('2d');g.fillStyle='#f8f5ed';g.fillRect(0,0,1200,630);g.drawImage(images.offer,650,0,945,630);g.fillStyle='#f8f5ed';g.fillRect(0,0,650,630);g.fillStyle='#88651f';g.font='400 26px "Noto Sans KR"';g.fillText('책사 · 출산택일 보고서',60,94);g.fillStyle='#2b261f';g.font='400 56px "Noto Serif KR"';['아이를 만날','가장 좋은','날과 시간.'].forEach((t,i)=>g.fillText(t,60,228+i*88));g.font='400 24px "Noto Sans KR"';g.fillStyle='#756b5c';g.fillText('첫 추천과 선정 이유 · 전체 견본 공개',60,548);
 write(path.join(ws,'app/cards/og/taekil-report-guide.jpg'),await sharp(og.toBuffer('image/png')).jpeg({quality:90}).toBuffer());
 const fixtures=JSON.parse(fs.readFileSync(path.join(ws,'design-requests/ref/DES-0009-data.json'),'utf8'));
 const api=process.argv[3]?require(path.resolve(process.argv[3])):null,jtZip=new Zip();
 for(let i=0;i<fixtures.length;i++){
  const view=api?api.응답(fixtures[i].input).story:fixtures[i];
  const canvas=createCanvas(art.W,art.H);art.drawResult(canvas,view);const png=canvas.toBuffer('image/png'),name='sample-'+String(i+1).padStart(2,'0')+'.png';
  write(path.join(jtTarget,name),png);jtZip.file(name,png);
 }
 jtZip.file('읽어주세요.txt','지어낸 네 명의 결과 공유 카드 예시입니다. 실제 고객 정보는 없습니다.\r\n개인별 카드는 정통사주 결과에서 직접 만듭니다.\r\nhttps://chaeksa.kr/?go=jeongtong&from=promo-jt-post\r\n');
 jtZip.file('게시글.txt',jtCopy);write(path.join(jtTarget,'게시글.txt'),jtCopy);
 write(path.join(jtTarget,'chaeksa-jeongtong-examples.zip'),await jtZip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
 write(path.join(target,'manifest.json'),JSON.stringify({created:'2026-10-26',width:art.W,height:art.H,slides:art.slides,source:'https://chaeksa.kr/taekil-sample.html',note:'가상 가족 견본 · 실제 고객 기록 없음'},null,2)+'\n');
 console.log('Created 6 taekil slides, captions, ZIP, overview, and 4 fictional result cards.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
