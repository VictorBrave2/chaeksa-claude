(function(){
 'use strict';
 function figure(className,pose){
  const el=document.createElement('div');el.className='companion-inline '+className;el.setAttribute('aria-hidden','true');
  const art=document.createElement('div');art.className='guide-figure';art.dataset.pose=String(pose);el.append(art);return el;
 }
 document.addEventListener('ziwei-preview-ready',()=>{
  const out=document.getElementById('out'),chart=out.querySelector('.mb');if(!chart)return;
  chart.querySelector('.mb-center').prepend(figure('chart-guide',1));
  out.querySelector('.zd-section-heading')?.append(figure('filter-guide',0));
  out.querySelector('.zd-ending')?.prepend(figure('ending-guide',2));
  const rail=document.querySelector('.companion-rail'),art=rail.querySelector('.guide-figure');
  const groups=[...out.querySelectorAll('.zd-group')];
  const sections=[chart,out.querySelector('.zd-hero'),...groups,out.querySelector('.zd-ending'),out.querySelector('.mb-original')].filter(Boolean);
  let pending=false,last=null;
  function update(){
   pending=false;const anchor=window.innerHeight*.38;
   let active=sections[0];for(const section of sections){if(section.getBoundingClientRect().top<=anchor)active=section;}
   if(active===last)return;last=active;
   groups.forEach(group=>group.classList.toggle('is-reading',group===active));
   const index=groups.indexOf(active),ending=active.classList.contains('zd-ending');
   art.dataset.pose=ending?'2':active===chart?'1':'0';
   rail.classList.toggle('is-closing',ending);rail.classList.toggle('is-secondary',active.classList.contains('mb-original'));
   rail.querySelector('.rail-position').textContent=index>=0?active.querySelector('.zd-group-head>span').textContent:'정통자미두수';
   const heading=active.querySelector('h2,h3');rail.querySelector('.rail-title').textContent=active===chart?'나의 명반':heading?.textContent||'열두 분야 전체 풀이';
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  out.addEventListener('toggle',schedule,true);
  document.getElementById('guide-toggle').onclick=function(){const enabled=document.body.classList.toggle('companion-on');this.setAttribute('aria-pressed',String(enabled));this.textContent=enabled?'캐릭터 숨기기':'캐릭터 보기';schedule();};
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.15});
  out.querySelectorAll('.companion-inline').forEach(el=>observer.observe(el));
  // The existing sheet owns its text, history and buttons. Add only decorative art.
  const sheet=document.getElementById('shBody');
  new MutationObserver(()=>{
   if(!sheet.querySelector('.sh-t')||sheet.querySelector('.sheet-guide'))return;
   const portrait=figure('sheet-guide',1);portrait.classList.add('is-visible');
   const back=sheet.querySelector('.sh-prev');if(back)back.after(portrait);else sheet.prepend(portrait);
  }).observe(sheet,{childList:true});
  update();
 },{once:true});
})();
