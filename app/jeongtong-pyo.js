/* DES-0008 — 정통사주 결과표. 계산은 비공개 API, 이 파일은 표시만 한다. */
(function(global){
'use strict';
const Old=global.ChaeksaJeongtong;
if(!Old||!Old.그리기)return;
const legacyDraw=Old.그리기;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const API='https://chaeksa-behavior-core.vercel.app/api/jt-pyo';
const cache=new Map(), pending=new WeakMap();
const book={'三命通會':'삼명통회','淵海子平':'연해자평','子平眞詮':'자평진전','窮通寶鑑':'궁통보감','滴天髓':'적천수','엔진':'책사 계산'};
const typeNames={정재:'正財格',편재:'偏財格',정관:'正官格',편관:'七殺格',정인:'正印格',편인:'偏印格',식신:'食神格',상관:'傷官格',건록:'建祿格',양인:'陽刃格'};
const copy={정관:{lead:'규칙과 약속을 지키고<br>맡은 일을 책임지는 사람.',short:'규칙과 책임을 맡는 흐름입니다.'},편재:{lead:'일을 크게 벌이고<br>돈을 굴려서 불리는 사람.',short:'일과 돈을 크게 운영하는 흐름입니다.'},편인:{lead:'남들이 안 보는 것을<br>혼자 깊게 파고드는 사람.',short:'혼자 깊게 파고드는 흐름입니다.'},식신:{lead:'무언가를 만들어<br>주변 사람과 나누는 사람.',short:'만들고 나누는 흐름입니다.'},상관:{lead:'정해진 틀을 깨고<br>해야 할 말을 하는 사람.',short:'틀을 바꾸고 표현하는 흐름입니다.'},건록:{lead:'스스로 해내면서<br>옆 사람과 함께하는 사람.',short:'스스로 해내며 함께하는 흐름입니다.'},양인:{lead:'겨룰 상대가 있을 때<br>힘을 내는 사람.',short:'겨루며 힘을 내는 흐름입니다.'},정재:{lead:'돈을 꼬박꼬박 모으고<br>살림을 관리하는 사람.',short:'돈과 살림을 챙기는 흐름입니다.'},정인:{lead:'배우는 것을 좋아하고<br>남의 말을 받아들이는 사람.',short:'배우고 받아들이는 흐름입니다.'},편관:{lead:'압박을 버티고<br>끝내 해내는 사람.',short:'무거운 일을 버티는 흐름입니다.'}};
const stateName={'섰다':'성격 · 成格','깨졌다':'파격 · 敗格','구제됐다':'구응 · 救應','띠었다':'성중유패 · 成中有敗'};
const stateSentence={'섰다':'타고난 짜임이 갖춰져 있습니다.','깨졌다':'타고난 짜임을 해치는 요소가 있습니다.','구제됐다':'짜임을 해치는 요소를 막아 주는 힘이 있습니다.','띠었다':'갖춰진 짜임에 방해하는 요소가 있습니다.'};
const axisNames=['타고난 격','짜임의 상태','계절의 조건','기운의 모양','나의 강약'];
const readableName={
'SM06B-102':['포승','包承','맑고 귀하며, 복이 두텁다.'],
'YH-030':['인수천덕','印綬天德',''],
'SM05-040':['관성육합','官星六合',''],
'SMM1-010':['좌하자화','座下自化',''],
'SM06B-096':['사시승왕','四時乘旺',''],
'YH-095':['시상포태격','時上胞胎格',''],
'SM05-044':['진관','真官','귀하지 않으면 부유하다.'],
'SMM1-M036':['사간병일지','四干併一支 · 天乙貴人','공명을 일찍 이룬다고 적었습니다.'],
'SMM1-011':['좌하자화','座下自化 · 癸巳',''],
'SM06B-061':['정화견진','正化 見辰','생왕고의 도움을 받으면, 부귀와 공명이 천하에 가득하다.']
};
const pct=n=>n==null?'—':n>0&&n<0.01?'＜0.01':Number(n).toLocaleString('ko-KR',{maximumFractionDigits:2});
function axisValue(a){if(a.id==='성패')return (stateName[a.값]||a.값).split(' · ')[0];if(a.id==='기세')return a.판정==='비해당'?'여러 기운':a.고전이름||a.값;if(a.id==='조후')return {'돕는 글자만 뜸':'보조 글자 있음','둘 다 안 뜸':'필요 글자 없음','필요한 글자 뜸':'필요 글자 있음'}[a.값]||a.값;return a.값||'판정 불가'}
function emblem(axes,type,ratio,small=false){
 const cx=230,cy=225,outer=163,core=51,vals=axes.map(a=>a.판정==='해당'?a.돌기:0),point=(a,r)=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r],str=p=>p.map(v=>v.toFixed(2)).join(',');
 let pts=[],rays='',labels='',dots='',facets='';
 for(let i=0;i<5;i++){
  const a=-Math.PI/2+i*Math.PI*2/5,r=core+(outer-core)*Math.pow(Math.max(0,Math.min(1,vals[i])),.32),tip=point(a,r),valley=point(a+Math.PI/5,core),outerP=point(a,outer);
  pts.push(tip,valley);rays+='<line class="ray" x1="'+cx+'" y1="'+cy+'" x2="'+outerP[0]+'" y2="'+outerP[1]+'"/>';
  dots+='<circle class="vertex" cx="'+tip[0]+'" cy="'+tip[1]+'" r="2.5"/>';
  const label=point(a,197);labels+='<text class="axis-label" x="'+label[0]+'" y="'+(label[1]-6)+'">'+esc(axisNames[i])+'</text><text class="axis-value" x="'+label[0]+'" y="'+(label[1]+14)+'">'+esc(axisValue(axes[i]))+'</text>';
 }
 for(let i=0;i<pts.length;i++)facets+='<path class="facet" opacity="'+(i%2?.28:.7)+'" d="M '+cx+' '+cy+' L '+str(pts[i])+' L '+str(pts[(i+1)%pts.length])+' Z"/>';
 
 return '<svg class="shape" viewBox="0 0 460 465" role="img" aria-label="'+esc(type+'격. 다섯 판정의 희소성을 나타낸 도형')+'"><circle class="orbital" cx="230" cy="225" r="163"/><circle class="orbital" cx="230" cy="225" r="117" stroke-dasharray="2 7"/><circle class="orbital" cx="230" cy="225" r="69"/>'+rays+facets+'<polygon class="edge" points="'+pts.map(str).join(' ')+'"/>'+dots+'<circle cx="230" cy="225" r="42" fill="var(--bg)"/><text class="center" x="230" y="229">'+(ratio==null?'표본 없음':pct(ratio)+'%')+'</text><text class="center-sub" x="230" y="249">같은 짜임</text>'+(!small?labels:'')+'</svg>';
}
function nameCard(n){const named=readableName[n.key],title=named?.[0]||String(n.고전이름||'고전 이름').split('(')[0],hanja=named?.[1]||n.고전이름;return '<article class="name-card"><div class="name-top"><span class="name-book">'+esc(book[n.책]||n.책)+'</span><span class="name-percent">'+pct(n['%'])+'<small>%</small></span></div><h3 class="name-title">'+esc(title)+'</h3><p class="name-hanja">'+esc(hanja)+'</p>'+(named?.[2]?'<p class="name-quote">“'+esc(named[2])+'”</p>':'')+'<details><summary>고전 원문과 출처</summary><p lang="zh">'+esc(n.원문)+'</p><p>'+esc(String(n.출처||n.책||'').split(' · docs/')[0])+'</p><p>해당 조건: '+esc(n.고전이름)+'</p></details></article>'}
function mini(period){const a=typeNames[period.type]||'—',state=period.state==='깨졌다'?'var(--fire)':'var(--accent)';return '<svg class="period-small-shape" viewBox="0 0 112 90" role="img" aria-label="'+esc(period.type+'격 '+(stateName[period.state]||''))+'"><circle cx="56" cy="45" r="34" fill="none" stroke="var(--line2)"/><path d="M56 10 L67 32 L92 35 L74 53 L79 78 L56 66 L33 78 L38 53 L20 35 L45 32 Z" fill="var(--accent-soft)" stroke="'+state+'" stroke-width=".8"/><text x="56" y="49" text-anchor="middle" fill="'+state+'" font-family="var(--serif)" font-size="12">'+esc(a.replace('格',''))+'</text></svg>'}
function periodSentence(p,previous){if(!p.type||!p.state)return '이 시기의 판정은 아직 내리지 못했습니다.';if(p.state==='깨졌다')return '이 시기에는 짜임을 해치는 요소가 들어옵니다.';if(p.state==='구제됐다')return '해치는 요소를 막아 주는 힘이 들어옵니다.';if(p.state==='띠었다')return '짜임에 방해하는 요소가 함께 들어옵니다.';if(previous?.state==='깨졌다')return '이 시기에는 짜임이 다시 갖춰집니다.';if(previous&&previous.type!==p.type)return (copy[p.type]?.short||p.type+'격으로 읽는 시기입니다.');return '갖춰진 짜임이 이어집니다.'}

const template="\n<div class=\"intro\"><div class=\"eyebrow\">나의 정통사주</div><div class=\"intro-line\"><p>당신이라는 이름.</p><span class=\"birth\" id=\"jtp-birth\"></span></div></div>\n<section class=\"hero\" aria-labelledby=\"jtp-identity\"><div class=\"hero-copy\"><p class=\"hero-prefix\">당신은</p><h1 id=\"jtp-identity\"></h1><p class=\"hero-hanja\" id=\"jtp-identity-hanja\"></p><p class=\"hero-verdict\" id=\"jtp-verdict\"></p><span class=\"state-tag\"><span class=\"state-dot\"></span><span id=\"jtp-state\"></span></span></div><div class=\"hero-art\"><div id=\"jtp-emblem\"></div><p class=\"shape-note\">격 · 성패 · 조후 · 기세 · 강약</p><p class=\"shape-caption\">돌출된 길이는 각 특징의 드문 정도입니다.</p></div></section>\n<div class=\"rarity\"><div class=\"rarity-number\" id=\"jtp-rarity\"></div><div><p class=\"rarity-title\">네 조건이 같은 명식</p><p class=\"rarity-sub\"><span id=\"jtp-sample-size\"></span></p></div><button type=\"button\" class=\"source-toggle\" id=\"jtp-measure\" aria-label=\"비율과 도형의 기준 보기\" aria-expanded=\"false\" aria-controls=\"jtp-measure-detail\">i</button></div>\n<div class=\"measure-detail\" id=\"jtp-measure-detail\" hidden></div>\n<a class=\"reading-link\" href=\"#jtp-old-names\" data-jtp-scroll=\"old-names\">옛사람이 붙인 이름을 보세요 <span aria-hidden=\"true\">↓</span></a>\n<section class=\"chapter\" id=\"jtp-old-names\" aria-labelledby=\"jtp-old-title\"><p class=\"chapter-kicker\"><span>一</span> 옛사람이 붙인 이름</p><h2 id=\"jtp-old-title\">옛 책은 당신에게<br><em>이런 이름을 붙였습니다.</em></h2><div class=\"old-names\" id=\"jtp-names\"></div><details class=\"name-more\" id=\"jtp-name-more\"><summary id=\"jtp-name-more-summary\"></summary><div class=\"old-names\" id=\"jtp-other-names\"></div></details><p class=\"small-note\">각 비율은 그 이름의 조건에 해당한 명식의 비율입니다.</p></section>\n<section class=\"chapter\" id=\"jtp-story\" aria-labelledby=\"jtp-story-title\"><p class=\"chapter-kicker\"><span>二</span> 시간 속의 당신</p><h2 id=\"jtp-story-title\">타고난 나에게,<br><em>시간이 더해집니다.</em></h2><div class=\"timeline-summary\" id=\"jtp-story-summary\"></div><div class=\"timeline\" id=\"jtp-timeline\"></div><details class=\"all-periods\"><summary>다른 시기도 보기</summary><div id=\"jtp-periods\"></div></details><p class=\"small-note\"><span id=\"jtp-asof\"></span> · 대운은 10년 단위의 흐름입니다.</p></section>\n<section class=\"chapter\" id=\"jtp-evidence\"><p class=\"chapter-kicker\"><span>三</span> 나의 이름이 나온 근거</p><details class=\"evidence\"><summary>다섯 가지 판정과 고전 출처 보기</summary><div class=\"evidence-grid\" id=\"jtp-evidence-grid\"></div></details></section>\n<div class=\"closing\"><span class=\"closing-mark\">策</span><p id=\"jtp-closing\"></p><a href=\"#jeongtong\" data-jtp-scroll=\"identity\">나의 이름으로 돌아가기 ↑</a></div>\n";

function resultView(host,r,input){
 host.innerHTML=template;
 const $=id=>host.querySelector('#jtp-'+id), axes=r.축들||[], type=String((axes[0]||{}).값||'').replace(/격$/,''), state=(axes[1]||{}).값;
 $('identity').textContent=type?type+'격':'이름 판정 중';
 $('identity-hanja').textContent=typeNames[type]||(axes[0]||{}).고전이름||'';
 $('verdict').innerHTML=copy[type]?.lead||'이 사주의 이름은<br>아직 정하지 못했습니다.';
 $('state').textContent=stateSentence[state]||'이 짜임의 상태는 아직 판정하지 못했습니다.';
 const place=input.placeName||(input.place?input.place.split(':').slice(1).join(':'):'입력한 경도');
 $('birth').innerHTML=esc(input.year+'. '+String(input.month).padStart(2,'0')+'. '+String(input.day).padStart(2,'0'))+'<br>'+esc(String(input.hour).padStart(2,'0')+':'+String(input.minute||0).padStart(2,'0')+' · '+place);
 $('emblem').innerHTML=axes.length===5?emblem(axes,type,r.조합['%']):'';
 $('rarity').innerHTML=r.조합['%']==null?'<span>표본에서 찾지 못함</span>':pct(r.조합['%'])+'<span>%</span>';
 $('sample-size').textContent='계산한 '+Number(r.조합.표본수||60000).toLocaleString('ko-KR')+'개 기준';
 const cond=r.조합.조건들||[], count=r.조합.해당수;
 $('measure-detail').innerHTML='<b>이 비율에 들어간 네 조건</b><ol>'+cond.map(x=>'<li>'+esc(x.id+' · '+x.값)+' — '+Number(x.수).toLocaleString('ko-KR')+'개</li>').join('')+'</ol>'+(count>0?'<p>네 조건을 모두 만족한 명식: '+count+' / '+r.조합.표본수+'개</p>':'<p>이 조합은 비교 표본에서 찾지 못했습니다.</p>')+'<p>'+esc(r.기준)+'</p><p>도형의 다섯 자리는 격·성패·조후·기세·강약입니다. 돌출된 길이는 각 조건의 희소성을 나타냅니다. 가운데 비율은 격·성패·조후·기세가 같은 조합의 비율이며, 강약과 별도의 고전 이름은 포함하지 않습니다.</p><p>조후 조건은 필요한 글자의 유무를 셉니다.'+(r.조후상태?.걸림?' 이 명식에는 조후의 별도 걸림 조건도 있습니다.':'')+' 이 비율은 길흉을 합산한 등급이 아닙니다.</p>';
 $('measure').onclick=()=>{const open=$('measure').getAttribute('aria-expanded')==='true';$('measure').setAttribute('aria-expanded',String(!open));$('measure-detail').hidden=open;};
 const names=r.옛이름||[];
 $('names').innerHTML=names.length?names.slice(0,2).map(nameCard).join(''):'<p class="small-note">검토한 드문 고전 이름 가운데 이 명식에 해당하는 이름은 없습니다.</p>';
 $('other-names').innerHTML=names.slice(2).map(nameCard).join('');
 $('name-more').hidden=names.length<=2;
 $('name-more-summary').textContent='당신에게 붙은 이름 '+Math.max(0,names.length-2)+'개 더 보기';
 const periods=r.기간들||[],year=r.올해||new Date().getFullYear();
 const current=periods.findIndex(p=>p.start<=year&&p.end>=year);
 let center=current;
 if(center<0)center=periods.findIndex(p=>p.start>year);
 if(center<0)center=Math.max(0,periods.length-1);
 const now=periods[current];
 $('story-summary').innerHTML=now?'지금, '+now.start+'–'+now.end+'<span>'+esc((now.type?now.type+'격':'판정 불가')+' · '+(stateName[now.state]||'판정 불가'))+'</span>':periods.length?'계산한 대운의 흐름':'대운 정보를 아직 계산하지 못했습니다.';
 const first=Math.max(0,Math.min(center-1,periods.length-3)),shown=periods.slice(first,first+3);
 $('timeline').innerHTML=shown.map(p=>{const k=periods.indexOf(p),isNow=k===current,label=isNow?'지금의 나':p.end<year?'지나온 나':'다가올 나';return '<article class="period '+(isNow?'now':'')+'"><span class="period-label">'+label+'</span><span class="period-dot"></span><p class="period-years">'+p.start+'–'+p.end+'</p><span class="period-age">'+p.ageStart+'–'+p.ageEnd+'세 · '+esc(p.ganji)+'</span><h3 class="period-type">'+esc(p.type?p.type+'격':'판정 불가')+'</h3><div class="period-state">'+esc(stateName[p.state]||'판정 불가')+'</div>'+mini(p)+'<p class="period-sentence">'+esc(periodSentence(p,periods[k-1]))+'</p></article>';}).join('');
 $('periods').innerHTML=periods.map(p=>'<div class="history-row"><span>'+p.start+'–'+p.end+'</span><span>'+esc((p.type?p.type+'격':'판정 불가')+' · '+(stateName[p.state]||'판정 불가'))+'</span><small>'+p.ageStart+'–'+p.ageEnd+'세</small></div>').join('');
 $('asof').textContent=String(r.기준일||'').replace(/-/g,'.')+' 기준';
 $('evidence-grid').innerHTML='<div class="evidence-item"><b>계산한 명식</b><p>시 · 일 · 월 · 년 순서<br>'+esc(r.명식)+'</p><p>입력한 출생지와 시각 보정 설정을 적용했습니다.</p></div>'+axes.map((a,i)=>'<div class="evidence-item"><b>'+axisNames[i]+' · '+esc(axisValue(a))+'</b><p>'+esc(a.고전이름||a.값||'판정 불가')+'<br>'+esc(book[a.책]||a.책)+' · '+esc(a.판정)+(a['%']!=null?' · '+pct(a['%'])+'%':'')+'</p><p>'+esc(String(a.출처||'').split(' · docs/')[0])+'</p>'+(a.근거?.length?'<p>'+esc(a.근거.join(' / '))+'</p>':'')+'</div>').join('');
 $('closing').innerHTML='당신에게는<br>이런 이름이 있습니다.'+(type?'<br><span style="color:var(--accent)">'+esc(type+'격')+'</span>':'');
 host.querySelectorAll('[data-jtp-scroll]').forEach(a=>a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();$(a.dataset.jtpScroll)?.scrollIntoView({behavior:'smooth',block:'start'});});
}
function oldContent(container,input){
 const d=document.createElement('details');d.className='jtp-legacy';
 d.innerHTML='<summary>돈·연애·일 등 자세한 풀이</summary><div class="jtp-legacy-content"></div>';
 container.appendChild(d);
 try{legacyDraw(d.querySelector('.jtp-legacy-content'),input);}catch(_){d.querySelector('.jtp-legacy-content').textContent='자세한 풀이를 지금 불러오지 못했어요.';}
 return d;
}
function 그리기(box,input){
 const birth={year:input.year,month:input.month,day:input.day,hour:input.hour==null?null:input.hour,minute:input.minute||0,gender:input.gender==='F'?'F':'M',place:input.place,longitude:input.longitude,tzOffset:input.tzOffset,solarCorrection:input.solarCorrection!==false};
 const key=JSON.stringify(birth),today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}),previous=pending.get(box);
 if(previous?.key===key&&previous.date===today&&(previous.done||previous.loading))return;
 previous?.controller.abort();
 const controller=new AbortController(),request={key,date:today,controller,loading:true,done:false};pending.set(box,request);
 box.innerHTML='<div class="jtp"><div class="jtp-result"><div class="jtp-loading" role="status">당신의 이름과 흐름을 불러오고 있습니다.</div></div></div>';
 const root=box.firstElementChild,host=root.querySelector('.jtp-result');
 oldContent(root,input);
 const fail=()=>{request.loading=false;host.innerHTML='<div class="jtp-empty" role="status">결과를 불러오지 못했어요.<p>잠시 뒤 다시 불러오거나, 아래에서 자세한 풀이를 읽어 보세요.</p><button type="button" class="jtp-retry">다시 불러오기</button></div>';host.querySelector('button').onclick=()=>{pending.delete(box);그리기(box,input);};};
 if(birth.hour==null){request.loading=false;request.done=true;host.innerHTML='<div class="jtp-empty">태어난 시간을 넣으면 나의 이름과 도형을 볼 수 있어요.<p>시간을 몰라도 아래에서 여섯 글자로 보는 자세한 풀이를 읽을 수 있어요.</p><button type="button" class="jtp-retry">태어난 시간 추가하기</button></div>';host.querySelector('button').onclick=()=>global.책사내정보수정?.();return;}
 const cached=cache.get(key);
 if(cached?.date===today){request.loading=false;request.done=true;resultView(host,cached.data,input);return;}
 const timeout=setTimeout(()=>controller.abort(),30000);
 fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(birth),signal:controller.signal}).then(async response=>{const r=await response.json();if(!response.ok||r.시모름||!Array.isArray(r.축들))throw new Error('result unavailable');return r;}).then(r=>{
  if(pending.get(box)!==request)return;
  if(cache.size>12)cache.delete(cache.keys().next().value);
  cache.set(key,{date:today,data:r});request.loading=false;request.done=true;resultView(host,r,input);
 }).catch(()=>{if(pending.get(box)===request)fail();}).finally(()=>clearTimeout(timeout));
}
global.ChaeksaJeongtong={그리기,전문그리기:legacyDraw};
})(typeof window!=='undefined'?window:globalThis);
