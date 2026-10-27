(async function(){
 'use strict';
 const host=document.getElementById('result'),root=document.getElementById('reading');
 try{
  const response=await fetch('story.json');
  if(!response.ok)throw Error('story unavailable');
  const data=await response.json();
  const view=ChaeksaJeongtongModelReading.applyModel(data.story);
  // Use the live result renderer; no alternate copy, filter selection or statistics.
  ChaeksaNameSeason.mount(host,view);
  ChaeksaJeongtongShare.attach(host,view);
  ChaeksaJeongtongEvidence.attach(root,data.input);
  root.querySelector('.jtp-brain-link').href='../../brain.html';
  attachLegacy(root,data.input);
  decorate(host);
 }catch(error){
  host.innerHTML='<p class="jtp-loading">견본을 불러오지 못했습니다. 새로고침해 주세요.</p>';
  console.error(error);
 }
 function figure(className,pose){
  const el=document.createElement('div');el.className='companion-inline '+className;el.setAttribute('aria-hidden','true');
  const art=document.createElement('div');art.className='guide-figure';art.dataset.pose=pose;el.append(art);return el;
 }
 function decorate(host){
  host.querySelector('.reader-hero>div').append(figure('hero-guide',0));
  host.querySelector('.filter-section-heading').append(figure('filter-guide',1));
  host.querySelector('.filter-conclusion').prepend(figure('conclusion-guide',2));
  const rail=document.querySelector('.companion-rail'),art=rail.querySelector('.guide-figure');
  const filters=[...host.querySelectorAll('.classic-filter')];
  const sections=[host.querySelector('.reader-hero'),host.querySelector('.portrait-detail'),...filters,host.querySelector('.filter-conclusion'),...host.querySelectorAll('.chapter:not(.filter-chapter)'),host.querySelector('.closing')].filter(Boolean);
  let pending=false,last=null;
  function update(){
   pending=false;const anchor=window.innerHeight*.37;
   let active=sections[0];for(const el of sections){if(el.getBoundingClientRect().top<=anchor)active=el;}
   if(active===last)return;last=active;
   filters.forEach(el=>el.classList.toggle('is-reading',el===active));
   const index=filters.indexOf(active),conclusion=active.classList.contains('filter-conclusion');
   const later=active.id==='jtp-my-evidence'||active.classList.contains('closing');
   art.dataset.pose=conclusion||later?'2':index>=0?'1':'0';
   rail.classList.toggle('is-closing',conclusion);rail.classList.toggle('is-evidence',later);
   rail.querySelector('.rail-position').textContent=index>=0?String(index+1).padStart(2,'0')+' / '+String(filters.length).padStart(2,'0'):conclusion?'모인 조건':'정통사주';
   const title=active.querySelector('h3,h2,h1');rail.querySelector('.rail-title').textContent=title?.textContent||viewTitle();
  }
  function viewTitle(){return host.querySelector('h1')?.textContent||'';}
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  host.addEventListener('toggle',schedule,true);
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.15});
  host.querySelectorAll('.companion-inline').forEach(el=>observer.observe(el));
  document.getElementById('guide-toggle').onclick=function(){
   const enabled=document.body.classList.toggle('companion-on');
   this.setAttribute('aria-pressed',String(enabled));this.textContent=enabled?'캐릭터 숨기기':'캐릭터 보기';schedule();
  };
  update();
 }
 function attachLegacy(root,input){
  const detail=document.createElement('details');detail.className='jtp-legacy';
  detail.innerHTML='<summary>돈·연애·일 등 자세한 풀이</summary><div class="jtp-legacy-content"></div>';root.append(detail);
  let loaded=false,loading=false;
  detail.addEventListener('toggle',async()=>{
   if(!detail.open||loaded||loading)return;loading=true;
   const box=detail.querySelector('div');box.textContent='자세한 풀이를 불러오고 있습니다.';
   try{
    const files=['places','astro','lunar','engine','sipseong','sipseong-byeonhwa','byeonhwa-jogak','byeonhwa','oryu','saenggeuk','gise','panjeong','seolmyeongseo','chaeyong','brief','typecard','gyeokguk','classic','gungtong-wonmun','ilju','yeongyeok','samyeong','gwanjeom','jeongtong-prose','jeongtong'];
    for(const file of files)await loadScript('../../'+file+'.js');
    ChaeksaJeongtong.그리기(box,input);loaded=true;
   }catch(error){box.textContent='자세한 풀이를 불러오지 못했습니다. 접었다 다시 펼쳐 주세요.';console.error(error);}
   finally{loading=false;}
  });
 }
 const scriptPromises=new Map();
 function loadScript(url){
  if(!scriptPromises.has(url))scriptPromises.set(url,new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();scriptPromises.delete(url);reject(Error(url));};document.head.append(script);
  }));
  return scriptPromises.get(url);
 }
})();
