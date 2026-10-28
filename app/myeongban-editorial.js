/* Personal readings from matched source clauses. No client-side fortune judgments. */
(function (root) {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names={命宮:'타고난 나',財帛:'돈과 재물',官祿:'일과 직책',遷移:'바깥 활동과 인연',福德:'마음과 삶의 즐거움'};
  const rate=n=>n==null?'비율 미산정':n<.01?'0.01% 미만':Number(n).toFixed(2).replace(/\.00$/,'')+'%';
  const read=s=>root.ChaeksaZiweiReading?.sourceText(s)||String(s||'');
  const condition=s=>root.ChaeksaZiweiCondition?.(s)||read(s);
  const short={
    'K2-0529':'사람의 도움으로 재물을 얻습니다.',
    'K1-부상':'온 집안이 벼슬에서 얻는 수입을 누립니다.',
    'K2-0369':'금과 옥을 쌓듯 재물을 모읍니다.',
    'K2-0832':'한가롭고 즐겁게 지냅니다.',
    'K2-0829':'복을 누리고 오래 산다고 했습니다.',
    'K2-0648':'작은 직책에서 큰 직책으로 올라갑니다.',
    'K2-0503':'지위 높은 사람의 도움으로 뜻을 이룹니다.'
  };
  const warnings={
    'K2-0510':'마음이 불안하고 먼 곳을 떠돈다고 했습니다.',
    'K1-칠살도로':'길에서 죽는다고 경계했습니다.',
    'K3-염살파천이':'바깥길에서 죽는다고 경계했습니다.',
    'K1-관부천이':'고향에서 먼 곳으로 귀양 간다고 했습니다.',
    'K1-화령천이':'먼 길을 다닐 때 외롭다고 했습니다.',
    'K1-제흉재백':'재물이 모였다가 흩어지기를 반복합니다.',
    'K1-복덕공겁':'바쁘게 돌아다녀도 힘을 쓰지 못합니다.',
    'K2-0674':'벼슬에서 물러나 직책을 내려놓습니다.',
    'K2-0713':'실속 없이 이름만 알려집니다.',
    'K2-0471':'밖에서 몸과 마음이 쉴 틈이 없습니다.',
    'K2-0528':'뜻을 이뤄도 아랫사람과 잘 지내지 못합니다.'
  };
  let targets=[],returnButton=null;
  function chartButton(t,label){
    if(!t)return '';
    const n=targets.push(t)-1;
    return '<button type="button" class="zd-chart-link" data-chart-target="'+n+'">'+esc(label||'명반에서 이 궁과 별 보기')+' ↗</button>';
  }
  function evidence(s){
    return '<details class="zd-evidence"><summary>내 배치와 고전 원문</summary><p>'+esc(condition(s.evidence||s.왜))+'</p><blockquote lang="zh-Hant">'+esc(s.quote||s.구절)+'</blockquote><small>'+esc(s.source)+'</small></details>';
  }
  function caution(x){
    return '<div class="zd-warning"><p class="zd-warning-title">'+esc(warnings[x.id]||read(x.뜻))+'</p><p class="zd-condition">'+esc(condition(x.왜))+'</p>'+evidence(x)+chartButton(x.targets,'이 경계의 별 보기')+'</div>';
  }
  // Summary selection does not reorder filters: each cumulative percentage stays with its original step.
  function present(story){
    if(!story?.filters)return story;
    const groups=story.editorial?.groups || [...new Set(story.filters.map(f=>f.palace))].map(palace=>({palace,filters:story.filters.filter(f=>f.palace===palace),cautions:[]}));
    const focus=groups.reduce((best,g)=>!best||g.filters.length>best.filters.length?g:best,null);
    if(!focus){
      const heading=(story.mainStars||[]).join(' · ') || '중심 별이 없는 명궁';
      return {...story,heading:heading+' — 다른 궁과 함께 읽는 나',conclusion:'이번 목록에서 좋은 조건이 확인된 분야는 없습니다.',summary:'명반의 궁과 별을 눌러 개별 풀이를 읽어 보세요.',editorial:story.editorial?{...story.editorial,title:heading+' — 다른 궁과 함께 읽는 나'}:undefined};
    }
    const lead=focus.filters[0], source=lead.sources?.[0];
    const domain=names[focus.palace]||lead.domain||focus.palace;
    const title=(source?.portrait||lead.title).replace(/\n/g,' ');
    const detail=focus.filters.find(f=>f!==lead&&f.title!==lead.title);
    const secondary=groups.find(g=>g!==focus);
    const heading=domain+' — '+title+(detail?'\n'+detail.title:'');
    const main=read(source?.meaning||lead.title);
    const extra=detail ? read(detail.sources?.[0]?.meaning||detail.title) : '';
    const conclusion=domain+' — '+lead.title+(detail?' · '+detail.title:'');
    const summary=[main,extra,secondary?(names[secondary.palace]||secondary.filters[0].domain)+'에서도 「'+secondary.filters[0].title+'」 조건이 함께 확인됐습니다.':'',focus.cautions?.length?'같은 분야에 경계할 조건도 있습니다. 앞에서 읽은 경계를 함께 적용해야 합니다.':''].filter((x,i,a)=>x&&a.indexOf(x)===i).join(' ');
    return {...story,heading,conclusion,summary,editorial:story.editorial?{...story.editorial,title:heading,source,line:'좋은 조건이 가장 많이 모인 분야는 '+domain+'입니다. '+(detail?'함께 해당하는 조건: '+detail.title+'.':'')}:undefined};
  }
  function html(story){
    story=present(story);
    const e=story.editorial;
    targets=[];returnButton=null;
    let h='<article class="zd" id="zd-reading"><section class="zd-hero"><p class="zd-kicker">옛 책으로 읽는 당신</p><h2>'+esc(e.title).replace(/\n/g,'<br>')+'</h2><p class="zd-personal">'+esc(e.line)+'</p>';
    if(e.source)h+='<div class="zd-origin"><span>이 이름을 붙인 근거</span><p>'+esc(read(e.source.meaning))+'</p>'+chartButton(e.source.targets)+evidence(e.source)+'</div><a class="zd-jump" href="#zd-filters">나를 설명하는 '+e.groups.length+'가지 이야기 ↓</a>';
    else h+='<p class="zd-personal">이 목록에서 고른 좋은 조건은 확인되지 않았습니다. 명반의 궁과 별을 누르면 내게 해당하는 나머지 풀이를 볼 수 있습니다.</p>';
    h+='</section>';
    if(!e.groups.length)return h+'<section class="zd-ending"><h3>'+esc(story.conclusion)+'</h3><p>'+esc(story.summary)+'</p></section></article>';
    h+='<section id="zd-filters"><div class="zd-section-heading"><p class="zd-kicker">당신의 명반에 실제로 있는 조건</p><h3>무엇으로 힘을 쓰고,<br>어디에서 걸리는가</h3></div>';
    e.groups.forEach((g,i)=>{
      h+='<section class="zd-group"><div class="zd-group-head"><span>'+String(i+1).padStart(2,'0')+' · '+esc(names[g.palace]||g.palace)+'</span><small>'+g.filters.length+'개 좋은 조건</small></div><h3>'+esc(g.title).replace(/\n/g,' ')+'</h3>';
      g.filters.forEach(f=>{
        h+='<div class="zd-good">';
        f.sources.forEach((s,j)=>{const title=short[s.id]||s.portrait.replace(/\n/g,' ');if(f!==g.filters[0]||j||title!==g.title.replace(/\n/g,' '))h+='<h4>'+esc(title)+'</h4>';h+='<p>'+esc(read(s.meaning))+'</p>'+chartButton(s.targets)+evidence(s);});
        h+='<div class="zd-step-rate"><span>'+(f.index===1?'이 좋은 조건을 갖춘 명반':'여기까지 좋은 조건을 모두 갖춘 명반')+'</span><strong>'+rate(f.percent)+'</strong></div></div>';
      });
      if(g.cautions.length){
        h+='<div class="zd-cautions"><p class="zd-warning-label">같은 분야에서 함께 읽을 경계</p>'+g.cautions.slice(0,2).map(caution).join('');
        if(g.cautions.length>2)h+='<details class="zd-more"><summary>함께 해당하는 다른 경계 '+(g.cautions.length-2)+'개</summary>'+g.cautions.slice(2).map(caution).join('')+'</details>';
        h+='<p class="zd-read-note">좋은 구절과 경계 구절은 각각 다른 조건에서 나왔습니다. 한쪽이 다른 쪽을 없앤다고 계산한 결과는 아닙니다.</p>';
        if(g.cautions.some(x=>/죽|수명/.test(x.뜻)))h+='<p class="zd-read-note">죽음에 관한 말은 고전의 경계입니다. 실제 수명이나 사고 시점을 계산한 결과는 아닙니다.</p>';
        h+='</div>';
      }
      h+='</section>';
    });
    h+='</section><section class="zd-ending"><p class="zd-kicker">내 명반의 특징</p><h3>'+esc(story.conclusion)+'</h3><p>'+esc(story.summary)+'</p><div class="zd-rate"><span>이 좋은 조건을 모두 갖춘 명반</span><strong>'+rate(story.percent)+'</strong></div><details class="zd-evidence"><summary>비율의 계산 기준</summary><p>'+esc(story.scheme)+' · '+Number(story.sampleSize).toLocaleString('ko-KR')+'개 비교 명반</p><p>좋은 조건의 표시 순서에 맞춰 실제 교집합을 다시 셌습니다. 한 조건에 비슷한 뜻의 원문이 여러 개 들어 있으면, 그중 하나 이상에 해당하는 명반을 셉니다. 본문에는 그중 내게 실제 해당한 원문만 나옵니다.</p><p>경계 구절은 이 비율에 포함하지 않습니다. 실제 인구 비율이나 능력 점수가 아닙니다. 비교 자료에서 같은 조합을 찾지 못하면 비율 미산정으로 표시합니다.</p><p>고전 구절의 뜻을 풀어 붙인 제목입니다. 이 제목 하나가 명반 전체를 대신하지 않습니다.</p></details></section></article>';
    return h;
  }
  if(typeof document!=='undefined') document.addEventListener('click',function(event){
    const button=event.target.closest('[data-chart-target]');
    if(!button)return;
    const t=targets[Number(button.dataset.chartTarget)],chart=document.getElementById('mb');
    if(!t||!chart)return;
    const cell=Array.from(chart.querySelectorAll('.mb-cell')).find(x=>x.dataset.g===t.palace);
    if(!cell)return;
    returnButton=button;
    chart.querySelectorAll('.is-proof,.is-proof-star').forEach(x=>x.classList.remove('is-proof','is-proof-star'));
    cell.classList.add('is-proof');
    chart.querySelectorAll('[data-cell]').forEach(x=>{if(t.cells.includes(x.dataset.cell))x.classList.add('is-proof-star');});
    let status=document.getElementById('chart-proof-status');
    if(!status){status=document.createElement('div');status.id='chart-proof-status';status.className='chart-proof-status';status.setAttribute('role','status');chart.after(status);}
    status.replaceChildren();
    const label=document.createElement('span');
    label.textContent=(names[t.palace]||t.palace)+' — 이 풀이의 근거가 된 궁'+(t.cells.length?'과 별을 표시했습니다.':'을 표시했습니다.');
    const back=document.createElement('button');back.type='button';back.textContent='풀이로 돌아가기';
    back.onclick=()=>{if(returnButton?.isConnected){returnButton.scrollIntoView({block:'center'});returnButton.focus({preventScroll:true});}};
    status.append(label,back);chart.scrollIntoView({block:'start'});back.focus({preventScroll:true});
  });
  root.ChaeksaZiweiEditorial={html,present};
})(typeof window!=='undefined'?window:globalThis);
