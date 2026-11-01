/* Decorative scenes around the current user's existing editorial headings. */
(function(){
 'use strict';
 const mobileArt=new URL('art/content-tarot-v2/',document.currentScript.src).href;
 const guideArt=new URL('art/des-0022/ziwei-guide-v1.webp',document.currentScript.src).href;
 let observer=null,enabled=true;
 function scene(parent,nodes,kind,pose){
  if(!parent||!nodes.length)return;
  const stage=document.createElement('div');stage.className='guide-scene '+kind;
  const copy=document.createElement('div');copy.className='guide-scene-copy';
  parent.insertBefore(stage,nodes[0]);nodes.forEach(node=>copy.append(node));stage.append(copy);
  const art=document.createElement('div');art.className='guide-art';art.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.className='guide-figure';image.src=guideArt;
  image.alt='';image.width=1024;image.height=1536;image.loading=pose===0?'eager':'lazy';image.decoding='async';
  image.onerror=()=>{art.hidden=true;stage.classList.add('guide-no-art');};
  if(pose===0){
   const picture=document.createElement('picture'),source=document.createElement('source');
   source.media='(max-width:1050px)';source.srcset=mobileArt+'observatory-mobile.webp';source.width=1024;source.height=1536;
   picture.append(source,image);art.append(picture);
  }else art.append(image);
  stage.append(art);
 }
 function mount(root){
  if(observer){observer.disconnect();observer=null;}
  const reading=root.querySelector('#zd-reading');
  if(!reading||reading.dataset.companionMounted)return;
  const hero=reading.querySelector('.zd-hero'),groups=[...reading.querySelectorAll('.zd-group')],ending=reading.querySelector('.zd-ending');
  if(!hero)return;
  reading.dataset.companionMounted='true';reading.classList.add('zd-companion');reading.classList.toggle('companion-on',enabled);
  scene(hero,[...hero.children].filter(el=>el.matches('.zd-kicker,h2,.zd-personal,.zd-jump')),'guide-opening',0);
  const transition=groups[1];
  if(transition)scene(transition,[...transition.children].filter(el=>el.matches('.zd-group-head,h3')),'guide-transition',1);
  if(ending)scene(ending,[...ending.children].filter(el=>el.matches('p,h3')),'guide-closing',2);
  const end=document.createElement('section');end.className='zd-mobile-ending';end.setAttribute('aria-label','정통자미두수 마침');
  end.innerHTML='<p class="mobile-ending-label">정통자미두수 · 마침</p><figure><img src="'+mobileArt+'observatory-ending.webp" width="1024" height="1536" alt="" loading="lazy" decoding="async"></figure><p class="mobile-ending-title">이번 풀이는<br>여기까지입니다.</p><p>필요할 때 다시 펼쳐 보세요.</p><a href="./">홈으로</a>';
  end.querySelector('img').onerror=()=>{end.querySelector('figure').hidden=true;};root.append(end);
  const controls=document.createElement('div');controls.className='zd-guide-controls';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='zd-guide-toggle';
  function update(){reading.classList.toggle('companion-on',enabled);end.classList.toggle('is-art-visible',enabled);toggle.setAttribute('aria-pressed',String(enabled));toggle.textContent=enabled?'삽화 숨기기':'삽화 보기';}
  toggle.onclick=()=>{enabled=!enabled;update();};update();controls.append(toggle);hero.prepend(controls);
  if('IntersectionObserver' in window){
   observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.15});
   reading.querySelectorAll('.guide-scene').forEach(el=>observer.observe(el));
  }
 }
 window.ChaeksaZiweiCompanion={mount};
})();
