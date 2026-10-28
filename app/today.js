/* COPY-0020 — view only; calculations and diary belong to ChaeksaToday. */
(function (global) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText = s => { const a=s.split('-'); return Number(a[1])+'월 '+Number(a[2])+'일'; };
  const dayKey = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const names = {비견:'내 기준과 동등한 관계',겁재:'경쟁과 함께 나눌 몫',식신:'꾸준히 만들고 돌보는 일',상관:'다른 점을 짚고 개선하는 말',편재:'새 일에 쓰는 돈과 시간',정재:'비용과 약속의 꾸준한 관리',편관:'강한 요구와 빠른 대응',정관:'역할과 공식적인 약속',편인:'스스로 납득하는 배움',정인:'도움과 배움을 받아들이는 일'};
  const natal = {겉:'타고난 사주에 드러나 있는 성향이 오늘 다시 더해집니다.',속:'타고난 사주 안에 있던 성향이 오늘 겉으로 드러납니다.',없음:'오늘 새로 들어오는 성향입니다. 평생의 성격을 뜻하지 않습니다.'};
  function mount(root, options) {
    if (!root) return;
    const opt=options||{}, T=global.ChaeksaToday, P=global.ChaeksaTodayPieces, people=opt.people||global.ChaeksaPeople;
    const clock=opt.clock||(()=>new Date()), track=opt.track||global.ChaeksaTrack;
    if (!T||!P||!people||!global.ChaeksaEngine) { root.innerHTML='<div class="today-empty"><h1>오늘의 운세를 불러오지 못했어요.</h1><p>잠시 뒤 새로고침해 주세요.</p><a href="./">홈으로</a></div>'; return; }
    const diary=T.기록(opt.storage);
    let selected='', current=null, tracked=false;
    try { people.migrate(); selected=people.activeId(); } catch(e) {}
    function event(name) { try { if(track)track.event(name); } catch(e) {} }
    function history(id, month) {
      const rows=diary.달(id,month).slice().reverse();
      return rows.length ? '<ol class="today-log">'+rows.map(r=>{
        const piece=r.예고&&P[r.예고.첫줄];
        return '<li><time datetime="'+esc(r.날짜)+'">'+dateText(r.날짜)+'</time><strong>'+esc(P.저녁[r.답]||'아직 기록하지 않았어요')+'</strong><p>'+esc(piece?piece.한줄:'이날의 예고가 저장되지 않았어요.')+'</p>'+(r.메모?'<p class="today-log-memo">'+esc(r.메모)+'</p>':'')+'</li>';
      }).join('')+'</ol>' : '<p class="today-log-empty">오늘의 예고부터 여기에 쌓입니다.</p>';
    }
    function render() {
      if(!tracked){event('today');tracked=true;}
      const list=people.list();
      const person=list.find(p=>p.id===selected)||list.find(p=>p.isSelf)||list[0];
      if(!person){root.innerHTML='<section class="today-empty"><p class="today-kicker">사주로 읽는 오늘</p><h1>오늘의 운세</h1><p>생년월일을 저장하면<br>오늘 달라지는 생각과 행동을 읽어 드립니다.</p><a class="today-primary" href="./#form">생년월일 입력하기 →</a></section>';return;}
      selected=person.id;
      let v,week,month;
      try {
        const R=global.ChaeksaEngine.calc(people.toProfile(person)), now=clock();
        v=T.오늘(R,now); week=T.이번주(R,now); month=T.이번달(R,now);
      } catch(e) {root.innerHTML='<section class="today-empty"><h1>생년월일을 확인해 주세요.</h1><p>저장된 정보로 오늘의 운세를 불러오지 못했어요.</p><a class="today-primary" href="./">홈에서 정보 확인하기</a></section>';return;}
      current=v;
      const assembled=T.조립(v,P), lines=assembled.칸[0].줄;
      const text=slot=>(lines.find(x=>x.자리===slot)||{}).글||'';
      const group=slot=>lines.filter(x=>x.자리===slot).map(x=>'<p>'+esc(x.글)+'</p>').join('');
      const saved=diary.예고(selected,v), record=diary.하루(selected,v.날짜)||{};
      const art='art/ziwei-companion/reading-v4.png';
      const first=v.첫줄, quietTitle=text('조용.한줄');
      root.innerHTML='<div class="today-person"><label for="today-person">누구의 하루를 볼까요?</label><select id="today-person">'+list.map(p=>'<option value="'+esc(p.id)+'"'+(p.id===selected?' selected':'')+'>'+esc(p.name||'이름 없음')+'</option>').join('')+'</select></div>'
        +'<div class="today-refresh" hidden><span>새로운 하루가 시작됐어요.</span><button type="button" id="today-refresh">오늘 운세 보기</button></div>'
        +'<article id="today-result"><section class="today-hero"><div class="today-hero-copy"><p class="today-kicker">오늘의 운세 · 사주로 읽는 오늘</p><time datetime="'+v.날짜+'"><span class="today-person-name">'+esc(person.name||'당신')+'</span>'+dateText(v.날짜)+' '+esc(v.요일)+'요일</time><h1>'+esc(v.조용?quietTitle:text('첫줄.한줄'))+'</h1>'+(v.조용?'<p class="today-quiet-copy">'+esc(text('첫줄.한줄'))+'</p>':'')+'<p class="today-hero-foot">'+(v.조용?'큰 변화보다 익숙한 흐름이 이어집니다.':first.쪽==='천간'?'오늘은 생각의 변화부터 읽어 보세요.':'오늘은 행동의 변화부터 읽어 보세요.')+'</p></div><img src="'+art+'" width="1254" height="1254" alt="" decoding="async"></section>'
        +'<nav class="today-subnav" aria-label="오늘의 운세 목차"><a href="#today-reading">오늘의 핵심</a><a href="#today-week">가까운 변화</a><a href="#today-note">저녁 기록</a></nav>'
        +'<section id="today-reading"><div class="today-detail"><div class="today-event"><h2>오늘 마주하는 관계와 일</h2><p class="today-actor">'+esc(text('첫줄.누구'))+'</p><p>'+esc(text('첫줄.일'))+'</p></div><aside class="today-action"><h2>오늘 이렇게 해 보세요</h2><p>'+esc(text('첫줄.행동'))+'</p></aside></div>'
        +(v.둘째줄?'<div class="today-second"><span>'+(v.둘째줄.쪽==='천간'?'생각에서는':'행동에서는')+'</span><p>'+esc(text('둘째줄.한줄'))+'</p></div>':'')
        +'<details class="today-basis"><summary>왜 내게 이런 하루일까요?</summary><p>'+esc(first.쪽==='천간'?'오늘 생각에 들어오는 십성은 ':'오늘 행동에 들어오는 십성은 ')+esc(first.십신)+'입니다. '+esc(names[first.십신])+ '을 뜻합니다.</p><p>'+esc(first.상태==='이어짐'?'이번 달까지의 흐름이 오늘도 이어집니다.':natal[first.원국대비])+'</p><p>이번 달까지 이어진 바탕</p>'+group('바탕.한줄')+(v.빠짐.length?'<p>오늘 잠시 쉬어 가는 흐름</p>'+group('빠짐.한줄'):'')+'<p>태어난 날의 사주와 오늘의 날짜를 비교한 풀이입니다.</p></details></section>'
        +'<section id="today-week" class="today-section"><p class="today-kicker">오늘부터 일곱 날</p><h2>내일은 무엇이 달라질까?</h2><p class="today-section-intro">‘힘을 쓸 날’은 생각과 행동의 변화가 가장 큰 날입니다. 운이 가장 좋은 날이라는 뜻은 아닙니다.</p><ol class="today-week">'+week.날들.map((d,i)=>{
          const strong=week.힘쓸날.includes(d.날짜), p=P[d.첫줄.열쇠];
          return '<li class="today-day'+(strong?' is-strong':'')+(d.조용?' is-quiet':'')+'"><div><time datetime="'+d.날짜+'">'+(i===0?'오늘':dateText(d.날짜))+'</time><span class="today-tag">'+(strong?'힘을 쓸 날':d.조용?'이어지는 하루':esc(d.요일)+'요일')+'</span></div><p>'+esc(p.주한줄)+'</p></li>';
        }).join('')+'</ol>'+(month.달바뀜?'<div class="today-month"><p class="today-kicker">다음 흐름의 시작</p><h3>'+dateText(month.달바뀜.날짜)+'부터</h3>'+month.달바뀜.바탕.map(b=>'<p>'+esc(P[b.열쇠].한줄)+'</p>').join('')+'</div>':'')+'</section>'
        +'<section id="today-note" class="today-section"><p class="today-kicker">예고를 읽고, 하루를 돌아보고</p><h2>'+esc(P.저녁.물음)+'</h2><p class="today-section-intro">맞추려 하지 말고, 당신이 겪은 하루 그대로 남겨 주세요.</p><form id="today-note-form"><fieldset class="today-answer"><legend>오늘의 하루와 비교해 주세요</legend>'+['비슷','다름','없음'].map(k=>'<label><input type="radio" name="today-answer" value="'+k+'" required'+(record.답===k?' checked':'')+'><span>'+esc(P.저녁[k])+'</span></label>').join('')+'</fieldset><label class="today-memo-label" for="today-memo"><span>한 줄 메모 · 선택</span><span id="today-count">'+String(record.메모||'').length+'/200</span></label><textarea id="today-memo" maxlength="200" placeholder="기억하고 싶은 일이 있나요?">'+esc(record.메모||'')+'</textarea><div class="today-save-row"><button class="today-primary" type="submit">오늘 기록 저장</button><p class="today-status" id="today-status" role="status">'+(saved?(record.답?'저장한 기록을 불러왔어요.':''):'이 브라우저에서는 기록을 저장하지 못했어요.')+'</p></div></form><p class="today-storage-note">기록은 이 브라우저에만 남습니다. 서버로 보내지 않으며, 브라우저 데이터를 지우면 함께 사라집니다.</p></section>'
        +'<section class="today-section" aria-labelledby="today-history-heading"><h2 id="today-history-heading">이번 달의 나</h2><p class="today-section-intro">'+Number(v.날짜.slice(5,7))+'월, 읽었던 예고와 실제 하루를 나란히.</p><div id="today-history">'+history(selected,v.날짜.slice(0,7))+'</div></section>'
        +'<section class="today-links"><h2>하루 너머의 나를 읽고 싶다면</h2><a href="when.html"><span>내 운은 언제 풀릴까? →</span><small>앞으로 10년의 흐름</small></a><a href="./#jeongtong"><span>정통사주 →</span><small>타고난 나의 모습</small></a><a href="myeongban.html"><span>정통자미두수 →</span><small>명반으로 읽는 나</small></a></section><p class="today-end" id="today-end">오늘의 운세 · 책사</p></article>';
      root.querySelectorAll('.today-subnav a').forEach(a=>{a.setAttribute('href',global.location.pathname+a.getAttribute('href'));});
      root.querySelector('img').onerror=function(){this.hidden=true;};
      root.querySelector('#today-person').onchange=e=>{selected=e.target.value;try{people.setActive(selected);}catch(err){}render();};
      root.querySelector('#today-refresh').onclick=render;
      const memo=root.querySelector('#today-memo');
      memo.oninput=()=>{root.querySelector('#today-count').textContent=memo.value.length+'/200';};
      root.querySelector('#today-note-form').onsubmit=e=>{
        e.preventDefault();
        const answer=root.querySelector('input[name="today-answer"]:checked'); if(!answer)return;
        const ok=diary.답(selected,v.날짜,answer.value,memo.value);
        root.querySelector('#today-status').textContent=ok?'오늘의 기록을 저장했어요.':'기록을 저장하지 못했어요. 입력한 내용은 이 화면에 남겨 두었습니다.';
        if(ok){event('today_note');root.querySelector('#today-history').innerHTML=history(selected,v.날짜.slice(0,7));}
      };
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
