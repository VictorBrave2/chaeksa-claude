/* 정통사주 개인화 — API 결과 표시, 요청 취소, 날짜별 캐시, 기존 전문 연결. */
(function(global){
'use strict';
const Old=global.ChaeksaJeongtong;
if(!Old||!Old.그리기)return;
const legacyDraw=Old.그리기;
const API='https://chaeksa-behavior-core.vercel.app/api/jt-pyo';
const cache=new Map(),pending=new WeakMap();
const companionArt=new URL('art/jeongtong-tarot-v1/',document.currentScript.src).href;
const mobileArt=new URL('art/content-tarot-v2/',document.currentScript.src).href;
let companionEnabled=true,companionObserver=null;
// 11-02 안내 인물은 손님 성별을 따른다(content-tarot-v2 얼굴 기준: 남 킹 · 여 퀸). 여자 그림(f/ · -f.webp)이 아직 없으면 지금 그림으로 돌아간다.
function companion(host,gender){
 const fem=gender==='F',fa=fem?'f/':'',fm=fem?'-f':'';
 if(companionObserver){companionObserver.disconnect();companionObserver=null;}
 const story=host.matches('.jtp-story')?host:host.querySelector('.jtp-story'),hero=host.querySelector('.reader-hero>div');
 if(!story||!hero)return;
 story.classList.add('jt-companion');story.classList.toggle('jt-companion-on',companionEnabled);
 function scene(parent,nodes,kind,pose){
  if(!parent||!nodes.length)return;
  const stage=document.createElement('div');stage.className='jt-guide-scene '+kind;
  const copy=document.createElement('div');copy.className='jt-guide-copy';parent.insertBefore(stage,nodes[0]);nodes.forEach(node=>copy.append(node));stage.append(copy);
  const art=document.createElement('div');art.className='jt-guide-art';art.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src=companionArt+fa+pose+'.png';image.alt='';image.width=1254;image.height=1254;image.loading=pose==='welcome'?'eager':'lazy';image.decoding='async';
  image.onerror=()=>{if(fem&&!image.dataset.back){image.dataset.back='1';const src=art.querySelector('source');if(src)src.srcset=mobileArt+'library-mobile.webp';image.src=companionArt+pose+'.png';return;}art.hidden=true;stage.classList.add('jt-guide-no-art');};
  if(pose==='welcome'){
   const picture=document.createElement('picture'),source=document.createElement('source');
   source.media='(max-width:1050px)';source.srcset=mobileArt+'library-mobile'+fm+'.webp';source.width=1024;source.height=1536;
   picture.append(source,image);art.append(picture);
  }else art.append(image);
  stage.append(art);
 }
 scene(hero,[...hero.children].filter(x=>x.matches('.eyebrow,h1,.hero-line,.name-origin,.reader-go')),'jt-guide-opening','welcome');
 const second=host.querySelectorAll('.classic-filter')[1]?.querySelector('.filter-reading');
 if(second){second.classList.add('jt-guide-filter');const copy=second.firstElementChild;scene(copy,[...copy.children].filter(x=>x.matches('.filter-name,h3')),'jt-guide-transition','reading');}
 const ending=host.querySelector('.filter-conclusion');
 if(ending)scene(ending,[...ending.children].filter(x=>x.matches('.conclusion-seal,p,h2')),'jt-guide-closing','closing');
 const page=host.closest('.jtp');
 if(page&&!page.querySelector('.jtp-mobile-ending')){
  const end=document.createElement('section');end.className='jtp-mobile-ending';end.setAttribute('aria-label','정통사주 마침');
  end.innerHTML='<p class="mobile-ending-label">정통사주 · 마침</p><figure><img src="'+mobileArt+'library-ending'+fm+'.webp" width="1024" height="1536" alt="" loading="lazy" decoding="async"></figure><p class="mobile-ending-title">이번 풀이는<br>여기까지입니다.</p><p>필요할 때 다시 펼쳐 보세요.</p><a href="./">홈으로</a>';
  {const ei=end.querySelector('img');ei.onerror=()=>{if(fem&&!ei.dataset.back){ei.dataset.back='1';ei.src=mobileArt+'library-ending.webp';return;}end.querySelector('figure').hidden=true;};}page.append(end);
 }
 const controls=document.createElement('div');controls.className='jt-guide-controls';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='jt-guide-toggle';
 function update(){story.classList.toggle('jt-companion-on',companionEnabled);page?.classList.toggle('jtp-mobile-art-on',companionEnabled);toggle.setAttribute('aria-pressed',String(companionEnabled));toggle.textContent=companionEnabled?'삽화 숨기기':'삽화 보기';}
 toggle.onclick=()=>{companionEnabled=!companionEnabled;update();};update();controls.append(toggle);hero.prepend(controls);
 if('IntersectionObserver' in window){companionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');companionObserver.unobserve(entry.target);}}),{threshold:.15});story.querySelectorAll('.jt-guide-scene').forEach(x=>companionObserver.observe(x));}
}
// 11-02 사장님 「정통사주 상단에 명식을 보여주고 분석을 시작해야 신뢰도가 있지 않을까?」 — 목차 줄 아래 · 첫 결론 위에 여덟 글자 표(myeongsik-card.js 원국표).
//   서버(jt-pyo)와 같은 공개 엔진 · 같은 입력(경도 · 시간대 · 진태양시 보정)으로 센다. 판정 없음.
function 원국(host,input){
 try{
  const E=global.ChaeksaEngine,C=global.ChaeksaMyeongsikCard;if(!E||!C||!C.원국표||host.querySelector('.jtp-wongook'))return;
  const p={year:input.year,month:input.month,day:input.day,hour:input.hour,minute:input.minute||0,gender:input.gender==='F'?'F':'M',longitude:input.longitude,tzOffset:input.tzOffset,solarCorrection:input.solarCorrection!==false};
  if(p.longitude==null&&global.ChaeksaPlaces&&input.place){const q=global.ChaeksaPlaces.resolve(input.place);if(q){p.longitude=q.lon;p.tzOffset=q.tzOffset;}}
  const h=C.원국표(E.calc(p),{pre:'msc-'});if(!h)return;
  C.꾸밈('msc-');
  const box=document.createElement('section');box.className='jtp-wongook';box.innerHTML=h;
  const hero=host.querySelector('.hero');if(hero)hero.before(box);else host.prepend(box);
 }catch(_){}
}
function resultView(host,r,input){
 if(!r.story?.filterStory||!global.ChaeksaNameSeason)throw new Error('story unavailable');
 const view=global.ChaeksaJeongtongModelReading?.applyModel(r.story)||r.story;
 global.ChaeksaNameSeason.mount(host,view);
 원국(host,input);
 global.ChaeksaJeongtongShare?.attach(host,view);
 global.ChaeksaJeongtongEvidence?.attach(host.parentElement,input);
 companion(host,input&&input.gender==='F'?'F':'M');
 global.ChaeksaToThree?.달기(host.closest('.jtp')||host,'jeongtong');   // 11-02 맨 아래 → 세 관점(to-three.js)
}
function oldContent(container,input){
 const d=document.createElement('details');d.className='jtp-legacy';
 d.innerHTML='<summary>돈·연애·일 등 자세한 풀이</summary><div class="jtp-legacy-content"></div>';
 container.appendChild(d);
 try{legacyDraw(d.querySelector('.jtp-legacy-content'),input);}catch(_){d.querySelector('.jtp-legacy-content').textContent='자세한 풀이를 지금 불러오지 못했어요.';}
 return d;
}
// 10-28 방향 지표 — 정통사주를 본 사람 · 끝까지 읽은 사람(화면은 그대로)
const 셈=box=>{try{global.ChaeksaTrack?.event('jeongtong');global.ChaeksaTrack?.watchEnd?.(box,'jeongtong_end');}catch(_){}};
function 그리기(box,input){
 const birth={year:input.year,month:input.month,day:input.day,hour:input.hour==null?null:input.hour,minute:input.minute||0,gender:input.gender==='F'?'F':'M',place:input.place,longitude:input.longitude,tzOffset:input.tzOffset,solarCorrection:input.solarCorrection!==false};
 const key=JSON.stringify(birth),today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}),previous=pending.get(box);
 if(previous?.key===key&&previous.date===today&&(previous.done||previous.loading))return;
 previous?.controller.abort();
 const controller=new AbortController(),request={key,date:today,controller,loading:true,done:false};pending.set(box,request);
 box.innerHTML='<div class="jtp"><div class="jtp-result"><div class="jtp-loading" role="status">나의 좋은 조건과 앞으로의 흐름을 불러오고 있습니다.</div></div></div>';
 const root=box.firstElementChild,host=root.querySelector('.jtp-result');
 oldContent(root,input);
 const fail=()=>{request.loading=false;host.innerHTML='<div class="jtp-empty" role="status">결과를 불러오지 못했어요.<p>잠시 뒤 다시 불러오거나, 아래에서 자세한 풀이를 읽어 보세요.</p><button type="button" class="jtp-retry">다시 불러오기</button></div>';host.querySelector('button').onclick=()=>{pending.delete(box);그리기(box,input);};};
 if(birth.hour==null){request.loading=false;request.done=true;host.innerHTML='<div class="jtp-empty">태어난 시간을 넣으면 나의 좋은 조건과 흐름을 볼 수 있어요.<p>시간을 몰라도 아래에서 태어난 해·달·날의 여섯 글자로 자세한 풀이를 읽을 수 있어요.</p><button type="button" class="jtp-retry">태어난 시간 추가하기</button></div>';host.querySelector('button').onclick=()=>global.책사내정보수정?.();global.ChaeksaJeongtongEvidence?.attach(root,input);return;}
 const cached=cache.get(key);
 if(cached?.date===today){request.loading=false;request.done=true;resultView(host,cached.data,input);셈(box);return;}
 const timeout=setTimeout(()=>controller.abort(),30000);
 fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(birth),signal:controller.signal}).then(async response=>{const r=await response.json();if(!response.ok||r.시모름||!Array.isArray(r.story?.filterStory?.filters))throw new Error('result unavailable');return r;}).then(r=>{
  if(pending.get(box)!==request)return;
  if(cache.size>12)cache.delete(cache.keys().next().value);
  cache.set(key,{date:today,data:r});request.loading=false;request.done=true;resultView(host,r,input);셈(box);
 }).catch(()=>{if(pending.get(box)===request)fail();}).finally(()=>clearTimeout(timeout));
}
global.ChaeksaJeongtong={그리기,전문그리기:legacyDraw};
})(typeof window!=='undefined'?window:globalThis);
