/* 개인별 공유 카드. 서버 업로드 없이 현재 결과의 안전한 표시 값만 캔버스에 그린다. */
(function(root){
'use strict';
const SHARE_LINK='https://chaeksa.kr/?go=jeongtong&from=card-jeongtong';
let active=null;
function close(){if(!active)return;const item=active;active=null;item.dialog.close();item.dialog.remove();item.opener?.focus();}
async function open(view,opener){
 close();const art=root.ChaeksaPromoArt;if(!art)return;
 const dialog=document.createElement('dialog');dialog.className='jtp-share-dialog';dialog.setAttribute('aria-labelledby','jtp-share-title');
 dialog.innerHTML='<div class="jtp-share-head"><div><p>나의 정통사주</p><h2 id="jtp-share-title">내 사주의 좋은 조건을 한 장에.</h2></div><button type="button" class="jtp-share-close" aria-label="공유 카드 닫기">×</button></div><p class="jtp-share-privacy">생년월일과 출생지는 카드에 담지 않습니다.</p><canvas role="img" aria-label="나의 대표 이름과 좋은 조건을 담은 공유 카드"></canvas><div class="jtp-share-actions"><button type="button" data-card-save disabled>이미지 저장</button><button type="button" data-card-send disabled>카드 공유</button><button type="button" data-card-link>링크 복사</button></div><p class="jtp-share-status" role="status" aria-live="polite">카드를 만들고 있습니다.</p>';
 document.body.appendChild(dialog);const item={dialog,opener};active=item;
 dialog.querySelector('.jtp-share-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
 const status=dialog.querySelector('[role="status"]'),canvas=dialog.querySelector('canvas');
 const linkButton=dialog.querySelector('[data-card-link]');
 linkButton.onclick=async()=>{const ok=await root.ChaeksaShare?.copyLink(SHARE_LINK);status.textContent=ok?'링크를 복사했습니다. 이 주소에는 내 결과가 없고, 받는 분이 자신의 생년월일을 넣어 시작합니다.':'복사할 주소: '+SHARE_LINK;};
 try{
  if(document.fonts){await Promise.race([Promise.allSettled([document.fonts.load('400 76px "Noto Serif KR"'),document.fonts.load('400 32px "Noto Sans KR"')]),new Promise(resolve=>setTimeout(resolve,2500))]);}
  if(active!==item)return;
  art.drawResult(canvas,view);
  const value=art.selectResult(view);canvas.setAttribute('aria-label',[value.title,value.name,...value.conditions.map(f=>f.title)].join('. '));
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('empty image');
  const file=new File([blob],'책사_나의이름.png',{type:'image/png'});
  const save=()=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);};
  const saveButton=dialog.querySelector('[data-card-save]'),sendButton=dialog.querySelector('[data-card-send]');
  saveButton.disabled=false;sendButton.disabled=false;
  saveButton.onclick=()=>{try{save();status.textContent='이미지 내려받기를 시작했습니다. 링크도 함께 보내 보세요.';root.ChaeksaTrack?.event('jt_card_save');}catch(_){status.textContent='이미지를 저장하지 못했습니다. 창을 닫고 다시 열어 주세요.';}};
  let canFiles=false;try{canFiles=!!(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]}));}catch(_){}
  sendButton.textContent=canFiles?'카드 공유':'서비스 링크 공유';
  sendButton.onclick=async()=>{
   try{
    if(canFiles){await navigator.share({files:[file],title:'책사 · '+value.title});status.textContent='카드를 공유했습니다. 링크 복사로 주소도 함께 보낼 수 있습니다.';root.ChaeksaTrack?.event('jt_card_share');}
    else if(navigator.share){await navigator.share({title:'옛 책이 나를 좋게 본 이유 · 책사',text:'내 사주에서 옛 책이 좋게 본 조건을 찾아보세요.',url:SHARE_LINK});status.textContent='서비스 링크를 공유했습니다. 이미지는 이미지 저장으로 받을 수 있습니다.';}
    else linkButton.click();
   }catch(e){status.textContent=e?.name==='AbortError'?'공유를 취소했습니다.':'공유 창을 열지 못했습니다. 이미지 저장이나 링크 복사를 이용해 주세요.';}
  };
  status.textContent=canFiles?'완성했습니다. 이미지로 저장하거나 공유해 보세요.':'이미지 저장 후 메시지나 게시글에 첨부할 수 있습니다.';
 }catch(_){if(active===item)status.textContent='카드를 만들지 못했습니다. 창을 닫고 다시 열어 주세요.';}
}
function attach(host,view){
 const anchor=host.querySelector('.filter-conclusion')||host.querySelector('.filter-hero');if(!anchor||host.querySelector('.jtp-share-entry'))return;
 const entry=document.createElement('div');entry.className='jtp-share-entry';entry.innerHTML='<p>내 사주의 좋은 조건을 간직해 보세요.</p><button type="button">내 결과 카드 만들기 <span aria-hidden="true">↗</span></button><small>나를 요약한 이름과 해당하는 좋은 조건을 한 장에 담습니다.</small>';
 anchor.appendChild(entry);entry.querySelector('button').onclick=e=>{root.ChaeksaTrack?.event('jt_card_open');open(view,e.currentTarget);};
 const intro=host.querySelector('.filter-intro');if(intro){const quick=document.createElement('button');quick.type='button';quick.className='jtp-share-quick';quick.textContent='내 결과 카드 ↗';quick.onclick=e=>open(view,e.currentTarget);intro.appendChild(quick);}
}
root.ChaeksaJeongtongShare={attach,open};
})(window);
