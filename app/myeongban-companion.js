/* Decorative scenes around the current user's existing editorial headings. */
(function(){
 'use strict';
 const poses=['notebook-reading-v3.png','notebook-explaining-v3.png','notebook-closing-v3.png'];
 let observer=null,enabled=true;
 function scene(parent,nodes,kind,pose){
  if(!parent||!nodes.length)return;
  const stage=document.createElement('div');stage.className='guide-scene '+kind;
  const copy=document.createElement('div');copy.className='guide-scene-copy';
  parent.insertBefore(stage,nodes[0]);nodes.forEach(node=>copy.append(node));stage.append(copy);
  const art=document.createElement('div');art.className='guide-art';art.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.className='guide-figure';image.src='art/ziwei-companion/'+poses[pose];
  image.alt='';image.width=1024;image.height=1536;image.loading='lazy';image.decoding='async';
  image.onerror=()=>{art.hidden=true;stage.classList.add('guide-no-art');};
  art.append(image);stage.append(art);
 }
 function mount(root){
  if(observer){observer.disconnect();observer=null;}
  const reading=root.querySelector('#zd-reading');
  if(!reading||reading.dataset.companionMounted)return;
  const hero=reading.querySelector('.zd-hero'),groups=[...reading.querySelectorAll('.zd-group')],ending=reading.querySelector('.zd-ending');
  if(!hero||!groups.length)return;
  reading.dataset.companionMounted='true';reading.classList.add('zd-companion');reading.classList.toggle('companion-on',enabled);
  scene(hero,[...hero.children].filter(el=>el.matches('.zd-kicker,h2,.zd-personal')),'guide-opening',0);
  const transition=groups[1];
  if(transition)scene(transition,[...transition.children].filter(el=>el.matches('.zd-group-head,h3')),'guide-transition',1);
  if(ending)scene(ending,[...ending.children].filter(el=>el.matches('.zd-kicker,h3')),'guide-closing',2);
  const controls=document.createElement('div');controls.className='zd-guide-controls';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='zd-guide-toggle';
  function update(){reading.classList.toggle('companion-on',enabled);toggle.setAttribute('aria-pressed',String(enabled));toggle.textContent=enabled?'삽화 숨기기':'삽화 보기';}
  toggle.onclick=()=>{enabled=!enabled;update();};update();controls.append(toggle);hero.prepend(controls);
  if('IntersectionObserver' in window){
   observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.15});
   reading.querySelectorAll('.guide-scene').forEach(el=>observer.observe(el));
  }
 }
 window.ChaeksaZiweiCompanion={mount};
})();
