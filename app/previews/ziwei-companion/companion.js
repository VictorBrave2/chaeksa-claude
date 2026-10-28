(function(){
 'use strict';
 function scene(parent,nodes,kind,pose){
  if(!parent||!nodes.length)return;
  const stage=document.createElement('div');stage.className='guide-scene '+kind;
  const copy=document.createElement('div');copy.className='guide-scene-copy';
  parent.insertBefore(stage,nodes[0]);nodes.forEach(node=>copy.append(node));stage.append(copy);
  const art=document.createElement('div');art.className='guide-art';art.setAttribute('aria-hidden','true');
  const figure=document.createElement('div');figure.className='guide-figure';figure.dataset.pose=String(pose);art.append(figure);stage.append(art);
 }
 document.addEventListener('ziwei-preview-ready',()=>{
  const out=document.getElementById('out');
  const hero=out.querySelector('.zd-hero'),groups=[...out.querySelectorAll('.zd-group')],ending=out.querySelector('.zd-ending');
  if(!hero)return;
  scene(hero,[...hero.children].filter(el=>el.matches('.zd-kicker,h2,.zd-personal')),'guide-opening',0);
  const transition=groups[1];
  if(transition)scene(transition,[...transition.children].filter(el=>el.matches('.zd-group-head,h3')),'guide-transition',1);
  if(ending)scene(ending,[...ending.children].filter(el=>el.matches('.zd-kicker,h3')),'guide-closing',2);
  document.getElementById('guide-toggle').onclick=function(){
   const enabled=document.body.classList.toggle('companion-on');this.setAttribute('aria-pressed',String(enabled));this.textContent=enabled?'캐릭터 숨기기':'캐릭터 보기';
  };
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.2});
   out.querySelectorAll('.guide-scene').forEach(el=>observer.observe(el));
  }
  // A shared mobile preview link may land here before the fixed response renders.
  if(location.hash==='#zd-reading')document.getElementById('zd-reading').scrollIntoView();
 },{once:true});
})();
