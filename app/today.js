/* COPY-0020 — view only; calculations belong to ChaeksaToday. */
(function (global) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText = s => { const a=s.split('-'); return Number(a[1])+'월 '+Number(a[2])+'일'; };
  const dayKey = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const meaning = k => { const S=global.ChaeksaSipseong, m=S&&S.뜻&&S.뜻[k]; return m?m.중심:''; };
  const clockText = m => { m=((m%1440)+1440)%1440; const h=Math.floor(m/60), mm=m%60; return (h<12?'오전 ':'오후 ')+(h%12||12)+'시'+(mm?' '+mm+'분':''); };
  // 10-29 사장님 「시간도 크게 — 사건이 발생했을 때 제목과 시간을 떠올리게」: 시간은 제목 바로 아래 크게, 같은 오전/오후면 뒤쪽은 줄인다.
  const clockRange = (a, b) => { const t1 = clockText(a), t2 = clockText(b); return t1.slice(0, 2) === t2.slice(0, 2) ? t1 + ' ~ ' + t2.slice(3) : t1 + ' ~ ' + t2; };
  const objP = w => { const c=w.charCodeAt(w.length-1)-0xAC00; return c>=0&&c<=11171&&c%28 ? '을' : '를'; };
  const natal = {겉:'타고난 사주에 드러나 있는 성향이 오늘 다시 더해집니다.',속:'타고난 사주 안에 있던 성향이 오늘 겉으로 드러납니다.',없음:'오늘 새로 들어오는 성향입니다. 평생의 성격을 뜻하지 않습니다.'};
  // IMG-0033~0062: display-only associations to existing text keys; no fortune calculation.
  const eventScenes={
    "결과|국충|비겁": "departure",
    "결과|충|비겁": "departure",
    "끌림|비겁|식상": "departure",
    "끌림|비겁|재성": "departure",
    "끌림|비겁|관성": "departure",
    "끌림|비겁|인성": "departure",
    "생각|극함|비겁": "departure",
    "결과|국충|식상": "work",
    "결과|국충|관성": "work",
    "결과|형|관성": "work",
    "결과|생받음|재성": "work",
    "끌림|식상|관성": "work",
    "끌림|관성|식상": "work",
    "생각|합|식상": "work",
    "생각|합|관성": "work",
    "생각|생받음|재성": "work",
    "결과|국충|인성": "reschedule",
    "결과|충|식상": "reschedule",
    "결과|충|관성": "reschedule",
    "생각|극받음|관성": "reschedule",
    "결과|충|재성": "expense",
    "결과|극함|재성": "expense",
    "결과|극함|인성": "expense",
    "결과|극받음|재성": "money-check",
    "결과|생함|관성": "expense",
    "끌림|재성|비겁": "expense",
    "끌림|재성|식상": "expense",
    "끌림|재성|인성": "expense",
    "끌림|인성|재성": "expense",
    "생각|극함|재성": "expense",
    "생각|극함|인성": "money-check",
    "생각|생함|관성": "expense",
    "결과|충|인성": "documents",
    "끌림|관성|인성": "documents",
    "끌림|인성|관성": "documents",
    "결과|형|비겁": "argument",
    "결과|형|식상": "argument",
    "결과|형|인성": "contact",
    "결과|생함|식상": "teamwork",
    "생각|생함|식상": "firm",
    "결과|극함|비겁": "firm",
    "결과|극함|관성": "firm",
    "결과|극받음|식상": "firm",
    "생각|극함|관성": "firm",
    "생각|극받음|식상": "firm",
    "결과|극함|식상": "quiet",
    "결과|극받음|관성": "reschedule",
    "결과|극받음|인성": "quiet",
    "생각|극함|식상": "quiet",
    "생각|극받음|인성": "quiet",
    "결과|생받음|비겁": "teamwork",
    "끌림|식상|비겁": "teamwork",
    "끌림|관성|비겁": "teamwork",
    "생각|합|비겁": "teamwork",
    "생각|생받음|비겁": "teamwork",
    "결과|생받음|식상": "reward",
    "결과|생함|재성": "reward",
    "끌림|식상|재성": "reward",
    "생각|생받음|식상": "reward",
    "생각|생함|재성": "reward",
    "결과|생받음|관성": "support",
    "결과|생받음|인성": "support",
    "결과|생함|비겁": "support",
    "끌림|인성|비겁": "support",
    "생각|합|인성": "support",
    "생각|생받음|관성": "support",
    "생각|생받음|인성": "support",
    "생각|생함|비겁": "support",
    "결과|생함|인성": "learning",
    "끌림|식상|인성": "learning",
    "끌림|인성|식상": "learning",
    "생각|생함|인성": "learning",
    "끌림|재성|관성": "agreement",
    "생각|합|재성": "agreement",
    "결과|국충|재성": "money-check",
    "결과|형|재성": "money-check",
    "결과|극받음|비겁": "money-check",
    "끌림|관성|재성": "money-check",
    "생각|극받음|비겁": "money-check",
    "생각|극받음|재성": "money-check"
  };
  const eventDimensions={"contact-m":[1254,1254],"contact-f":[1254,1254],"firm-m":[1254,1254],"firm-f":[1254,1254],"argument-m":[1254,1254],"argument-f":[1254,1254],"reschedule-m":[1254,1254],"reschedule-f":[1254,1254],"departure-m":[1254,1254],"departure-f":[1254,1254],"expense-m":[1254,1254],"expense-f":[1254,1254],"reward-m":[1254,1254],"reward-f":[1254,1254],"money-check-m":[1254,1254],"money-check-f":[1254,1254],"agreement-m":[1254,1254],"agreement-f":[1254,1254],"teamwork-m":[1254,1254],"teamwork-f":[1254,1254],"support-m":[1254,1254],"support-f":[1254,1254],"work-m":[1254,1254],"work-f":[1254,1254],"documents-m":[1254,1254],"documents-f":[1254,1254],"learning-m":[1254,1254],"learning-f":[1254,1254],"quiet-m":[1254,1254],"quiet-f":[1254,1254]};
  function mount(root, options) {
    if (!root) return;
    const opt=options||{}, T=global.ChaeksaToday, P=global.ChaeksaTodayPieces, people=opt.people||global.ChaeksaPeople;
    const clock=opt.clock||(()=>new Date()), track=opt.track||global.ChaeksaTrack;
    if (!T||!P||!people||!global.ChaeksaEngine) { root.innerHTML='<div class="today-empty"><h1>오늘의 운세를 불러오지 못했어요.</h1><p>잠시 뒤 새로고침해 주세요.</p><a href="./">홈으로</a></div>'; return; }
    let selected='', current=null, tracked=false;
    try { people.migrate(); selected=people.activeId(); } catch(e) {}
    function event(name) { try { if(track)track.event(name); } catch(e) {} }
    function render() {
      if(!tracked){event('today');tracked=true;}
      const list=people.list();
      const person=list.find(p=>p.id===selected)||list.find(p=>p.isSelf)||list[0];
      if(!person){root.innerHTML='<section class="today-empty"><p class="today-kicker">사주로 읽는 오늘</p><h1>오늘의 운세</h1><p>생년월일을 저장하면<br>오늘 달라지는 생각과 행동을 읽어 드립니다.</p><a class="today-primary" href="./#form">생년월일 입력하기 →</a></section>';return;}
      selected=person.id;
      let v,week,month,yv;
      try {
        const R=global.ChaeksaEngine.calc(people.toProfile(person)), now=clock();
        v=T.오늘(R,now); week=T.이번주(R,now); month=T.이번달(R,now);
        // 10-29 사장님 「어제의 예고 만들어줘」 → 「어제 바라본 오늘 · 맨위에 두는건 컨텐츠의 컨셉에 어긋나 아래로」 — 오늘 읽을거리 아래, 가까운 변화 앞(맞았냐고 묻지 않는다)
        try{ yv=T.오늘(R,new Date(now.getFullYear(),now.getMonth(),now.getDate()-1),{이음:false}); }catch(e){ yv=null; }
      } catch(e) {root.innerHTML='<section class="today-empty"><h1>생년월일을 확인해 주세요.</h1><p>저장된 정보로 오늘의 운세를 불러오지 못했어요.</p><a class="today-primary" href="./">홈에서 정보 확인하기</a></section>';return;}
      current=v;
      const assembled=T.조립(v,P), lines=assembled.칸[0].줄;
      const text=slot=>(lines.find(x=>x.자리===slot)||{}).글||'';
      const group=slot=>lines.filter(x=>x.자리===slot).map(x=>'<p>'+esc(x.글)+'</p>').join('');
      const guide=(name,width,height,sizes,lazy)=>'<img data-today-guide src="art/today-guides/'+name+'.webp" srcset="art/today-guides/'+name+'-s.webp 480w, art/today-guides/'+name+'.webp '+width+'w" sizes="'+sizes+'" width="'+width+'" height="'+height+'" alt="" decoding="async"'+(lazy?' loading="lazy"':'')+'>';
      // The displayed text key selects the scene; date only alternates the narrator.
      const narrator=Number(v.날짜.replace(/-/g,''))%2?'m':'f';
      const eventGuide=(slot,sex,sizes,lazy)=>{
        const line=lines.find(x=>x.자리===slot), scene=line&&line.글&&eventScenes[line.열쇠];
        const fallback=sex==='m'?'forecast-m-v1':'thought-f-v1';
        if(!scene)return guide(fallback,1254,1254,sizes,lazy);
        const id=scene+'-'+sex, size=eventDimensions[id], base='art/today-events/'+id+'-v1';
        return '<img data-today-guide data-today-event="'+scene+'" data-guide-fallback="'+fallback+'" src="'+base+'.webp" srcset="'+base+'-s.webp 480w, '+base+'.webp '+size[0]+'w" sizes="'+sizes+'" width="'+size[0]+'" height="'+size[1]+'" alt="" decoding="async"'+(lazy?' loading="lazy"':'')+'>';
      };
      const first=v.첫줄, quietTitle=text('조용.한줄');
      const yLines=yv?T.조립(yv,P).칸[0].줄:[], yText=(yLines.find(x=>x.자리==='결과.한줄')||yLines.find(x=>x.자리==='첫줄.한줄')||{}).글||'';
      const yBox=yText?'<p class="today-yesterday"><span>어제 바라본 오늘</span>'+esc(yText)+(yv.때?' <small>'+clockRange(yv.때.시작분,yv.때.끝분)+'</small>':'')+'</p>':'';
      root.innerHTML='<div class="today-person"><label for="today-person">누구의 하루를 볼까요?</label><select id="today-person">'+list.map(p=>'<option value="'+esc(p.id)+'"'+(p.id===selected?' selected':'')+'>'+esc(p.name||'이름 없음')+'</option>').join('')+'</select></div>'
        +'<div class="today-refresh" hidden><span>새로운 하루가 시작됐어요.</span><button type="button" id="today-refresh">오늘 운세 보기</button></div>'
        +'<article id="today-result"><section class="today-hero"><div class="today-hero-copy"><p class="today-kicker">오늘의 운세 · 사주로 읽는 오늘</p><time datetime="'+v.날짜+'"><span class="today-person-name">'+esc(person.name||'당신')+'</span>'+dateText(v.날짜)+' '+esc(v.요일)+'요일</time><h1>'+esc(text('결과.한줄')||(v.조용?quietTitle:(text('첫줄.사건')||text('첫줄.한줄'))))+'</h1>'+(v.때&&text('때.한줄')?'<p class="today-clock"><span>'+esc(text('때.이름'))+'</span>'+clockRange(v.때.시작분,v.때.끝분)+'</p>'+'<p class="today-hero-foot today-when">'+esc(text('때.한줄'))+(text('이음.뒤')?' '+esc(text('이음.뒤')):'')+'</p>':'')+(v.조용&&!text('결과.한줄')?'<p class="today-quiet-copy">'+esc(text('첫줄.한줄'))+'</p>':'')+(text('결과.한줄')?'':'<p class="today-hero-foot">'+(v.조용?'큰 변화보다 익숙한 흐름이 이어집니다.':first.쪽==='천간'?'오늘은 생각의 변화부터 읽어 보세요.':'오늘은 행동의 변화부터 읽어 보세요.')+'</p>')+'</div>'+eventGuide('결과.한줄',narrator,'(max-width: 800px) 128px, 240px',false)+'</section>'
        // 10-29 사장님 「구조가 뒤죽박죽인데 교통정리」 — 차례: 오늘 일어나는 일(제목 · 시간 · 누구와) → 생각 → 오늘 이렇게 해 보세요 → 왜(접힘: 누구 · 태도 · 둘째 흐름 · 바탕 · 근거) → 어제 바라본 오늘 → 이번 주. 목차 칩은 뺐다.
        +'<section id="today-reading"><div class="today-guided-reading">'+eventGuide('생각.한줄',narrator==='m'?'f':'m','(max-width: 800px) 180px, 210px',true)+'<div class="today-guided-copy">'
        +(text('생각.한줄')?'<div class="today-second today-think-row"><span>생각에서는</span><p>'+esc(text('생각.한줄'))+(text('이음.앞')?' '+esc(text('이음.앞')):'')+'</p></div>':'')
        +'<aside class="today-action"><h2>오늘 이렇게 해 보세요</h2><p>'+esc(text('첫줄.행동'))+'</p></aside>'
        +'</div></div><details class="today-basis"><summary>왜 내게 이런 하루일까요?</summary>'
        +'<p class="today-basis-label">오늘 마주하는 관계와 일</p><p class="today-actor">'+esc(text('때.상대')||text('첫줄.누구'))+'</p><p>'+esc(text('첫줄.일'))+'</p>'
        +(v.둘째줄?'<p class="today-basis-label">'+(v.둘째줄.쪽==='천간'?'생각에서는':'행동에서는')+'</p><p>'+esc(text('둘째줄.사건')||text('둘째줄.한줄'))+'</p>':'')
        +(group('바탕.한줄')?'<p class="today-basis-label">이번 달까지 이어진 바탕</p>'+group('바탕.한줄'):'')
        +'<p>'+esc(first.쪽==='천간'?'오늘 생각에 들어오는 십성은 ':'오늘 행동에 들어오는 십성은 ')+esc(first.십신)+'입니다. '+esc(meaning(first.십신))+objP(meaning(first.십신)||'을')+' 뜻합니다.</p><p>'+esc(first.상태==='이어짐'?'이번 달까지의 흐름이 오늘도 이어집니다.':natal[first.원국대비])+'</p>'+(v.빠짐.length?'<p>오늘 잠시 쉬어 가는 흐름</p>'+group('빠짐.한줄'):'')+'<p>태어난 날의 사주와 오늘의 날짜를 비교한 풀이입니다.</p></details></section>'
        +yBox+'<section id="today-week" class="today-section"><div class="today-week-intro"><div><p class="today-kicker">오늘부터 일곱 날</p><h2>내일은 무엇이 달라질까?</h2><p class="today-section-intro">‘힘을 쓸 날’은 생각과 행동의 변화가 가장 큰 날입니다. 운이 가장 좋은 날이라는 뜻은 아닙니다.</p></div>'+guide('week-pair-v1',1536,1024,'(max-width: 800px) 300px, 320px',true)+'</div><ol class="today-week">'+week.날들.map((d,i)=>{
          const strong=week.힘쓸날.includes(d.날짜), p=P[d.첫줄.열쇠], 띠=d.띠&&P[d.띠.열쇠]&&P[d.띠.열쇠][d.띠.필드];
          return '<li class="today-day'+(strong?' is-strong':'')+(d.조용?' is-quiet':'')+'"><div><time datetime="'+d.날짜+'">'+(i===0?'오늘':dateText(d.날짜))+'</time><span class="today-tag">'+(strong?'힘을 쓸 날':d.조용?'이어지는 하루':esc(d.요일)+'요일')+'</span></div><p>'+esc(띠||p.주한줄)+'</p></li>';
        }).join('')+'</ol>'+(month.달바뀜?'<div class="today-month"><p class="today-kicker">다음 흐름의 시작</p><h3>'+dateText(month.달바뀜.날짜)+'부터</h3>'+month.달바뀜.바탕.map(b=>'<p>'+esc(P[b.열쇠].한줄)+'</p>').join('')+'</div>':'')+'</section>'
        +'<section class="today-links"><h2>하루 너머의 나를 읽고 싶다면</h2><a href="when.html"><span>내 운은 언제 풀릴까? →</span><small>앞으로 10년의 흐름</small></a><a href="./#jeongtong"><span>정통사주 →</span><small>타고난 나의 모습</small></a><a href="myeongban.html"><span>정통자미두수 →</span><small>명반으로 읽는 나</small></a></section><p class="today-end" id="today-end">오늘의 운세 · 책사</p></article>';
      root.querySelectorAll('.today-subnav a').forEach(a=>{a.setAttribute('href',global.location.pathname+a.getAttribute('href'));});
      root.querySelectorAll('img[data-today-guide]').forEach(img=>{img.onerror=function(){const fallback=this.dataset.guideFallback;if(fallback){delete this.dataset.guideFallback;this.removeAttribute('srcset');this.src='art/today-guides/'+fallback+'.webp';}else{this.hidden=true;}};});
      root.querySelector('#today-person').onchange=e=>{selected=e.target.value;try{people.setActive(selected);}catch(err){}render();};
      root.querySelector('#today-refresh').onclick=render;
      try{if(track)track.watchEnd(root,'today_end');}catch(e){}
    }
    render();
    function checkDay(){const notice=root.querySelector('.today-refresh');if(current&&notice)notice.hidden=dayKey(clock())===current.날짜;}
    global.addEventListener('focus',checkDay);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkDay();});
    return {render};
  }
  global.ChaeksaTodayView={mount};
  mount(document.getElementById('today-app'));
})(window);
