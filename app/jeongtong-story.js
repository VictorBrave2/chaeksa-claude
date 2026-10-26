/* 정통사주 — 서버가 고른 개인별 고전 조건과 누적 비율을 표시한다. */
(function (root) {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stateText = value => value === '섰다' ? '성격' : value;
  const pct = n => n == null ? '표본 없음' : n > 0 && n < .01 ? '＜0.01%' : Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + '%';
  const axisTitles = { 격: '사주의 기본 구성 · 격', 성패: '구성이 성립했는지 · 성패', 조후: '태어난 계절에 필요한 것 · 조후', 기세: '글자의 힘이 이어지는 모습 · 기세', 강약: '나를 나타내는 글자의 강약' };
  const books = { '三命通會': '삼명통회', '子平眞詮': '자평진전', '淵海子平': '연해자평', '窮通寶鑑': '궁통보감', '滴天髓': '적천수', '엔진': '책사 계산' };
  const filterRate = value => value == null ? '비율 미산정' : Number(value).toLocaleString('ko-KR', { maximumFractionDigits: value < .01 ? 4 : value < .1 ? 3 : 2 }) + '%';
  function filterStack(m) {
    const story = m.filterStory;
    if (!story?.filters?.length) return '<section class="chapter filter-chapter" id="jtp-my-shape"><p class="empty">이 명식의 좋은 조건을 모으고 있습니다.</p></section>';
    const rows = story.filters;
    const card = (f,i) => `<li class="classic-filter" style="--depth:${Math.min(i,5)}"><span class="filter-number">${String(i+1).padStart(2,'0')}</span><article class="filter-paper"><div class="filter-reading"><div><p class="filter-name">${esc(f.name)}${f.classical&&f.classical!==f.name?' · <span lang="zh">'+esc(f.classical)+'</span>':''}</p><h3>${esc(f.title)}</h3>${f.subline?'<p class="filter-subline">'+esc(f.subline)+'</p>':''}</div><div class="filter-rate"><span>${i===0?'첫 조건':'여기까지 누적'}</span><strong class="${f.percent==null?'unmeasured':''}">${filterRate(f.percent)}</strong></div></div><details class="filter-source"><summary>왜 내 조건인가요?</summary><p>${esc(f.line)}</p>${f.detail?'<p>'+esc(f.detail)+'</p>':''}<p><b>내 사주에서 확인한 조건</b><br>${esc(f.evidence)}</p>${f.readingScope?'<p class="source-scope">'+esc(f.readingScope)+'</p>':''}<details><summary>${esc(f.book)} · 고전 원문과 출처</summary>${f.quote?'<blockquote lang="zh">'+esc(f.quote)+'</blockquote>':''}<p>${esc(f.source)}</p></details><p class="source-scope">${esc(f.scope)}</p></details></article></li>`;
    return `<section class="chapter filter-chapter" id="jtp-my-shape" aria-labelledby="jtp-filter-title"><div class="filter-section-heading"><div><p class="chapter-label">一 · 내 사주에 해당하는 조건</p><h2 id="jtp-filter-title">좋은 조건이 하나씩 겹칩니다.</h2></div><p class="filter-column-label">여기까지 모두 갖춘<br>비교 사주의 비율</p></div><ol class="classic-filters">${rows.slice(0,5).map(card).join('')}</ol>${rows.length>5?`<details class="filter-rest"><summary>나머지 ${rows.length-5}가지 조건도 읽기</summary><ol class="classic-filters" start="6">${rows.slice(5).map((f,i)=>card(f,i+5)).join('')}</ol></details>`:''}<div class="filter-conclusion"><span class="conclusion-seal">貴</span><p class="conclusion-kicker">전체 ${rows.length}가지 좋은 조건이 겹쳤습니다.</p><h2>${esc(story.conclusion)}</h2><div class="conclusion-ratio"><strong>${filterRate(story.percent)}</strong><span>전체 ${rows.length}가지 조건을 모두 갖춘 비교 사주</span></div><a href="#jtp-rarity-evidence" data-rarity-source>무엇과 비교한 비율인가요?</a></div></section>`;
  }

  function filterEvidence(m) {
    const story=m.filterStory;
    if(!story)return '';
    return `<p>${esc(story.basis)}</p><p>비교한 사주: ${Number(story.sampleSize).toLocaleString('ko-KR')}개 · ${esc(story.scheme||'')}</p><ol class="filter-counts">${story.filters.map(f=>`<li><b>${esc(f.name)}</b><span>${Number(f.count).toLocaleString('ko-KR')}개 · ${filterRate(f.percent)}</span></li>`).join('')}</ol><p>비교한 사주에 같은 조건이 함께 나온 사례가 없으면 비율을 매기지 않습니다.</p><p>${esc(story.scope)}</p>`;
  }

  function mount(host, m) {
    host.classList.add("jtp-story"); host.id="jtp-top";
    const l = m.lens, id = m.identity, r = m.original;
    const next = m.months[0], birth = m.input, place = String(birth.place || 'KR:서울').split(':').slice(1).join(':');
    const words = id.title.split(' '), first = words.shift();
    const title = esc(first) + '<br><em>' + esc(words.join(' ')) + '.</em>';
    const quote = l.quote ? `<p class="quote" lang="zh">${esc(l.quote)}</p>` : '';
    const observed = l.observation ? `<p>개인 견본에서 연결한 관찰: ‘${esc(l.observation)}’.</p>` : '';
    const checks = l.checks.map(c => `<div class="check ${c.state === true ? '' : 'wait'}"><p class="check-label">${esc(c.title)}</p><p class="check-value">${esc(c.value)}</p><p class="check-state">${c.state === true ? '태어난 사주에 있음' : c.state === false ? '앞으로의 운에서 확인' : '앞으로 오는 글자 확인'}</p></div>`).join('');
    const tokens = m.wood ? [['寅', '인목'], ['卯', '묘목'], ['未', '미토'], ['亥', '해수']].map(x => `<span class="branch-token"><b>${x[0]}</b><small>${x[1]}</small></span>`).join('') : l.need ? `<span class="branch-token"><b>${esc(l.need)}</b><small>필요한 글자</small></span>` : '';
    const names = (r.옛이름 || []).filter(n => n.key !== 'SM06B-061').map(n => `<p><b>${esc(n.고전이름)}</b> · ${esc(books[n.책] || n.책)}<br><span lang="zh">${esc(n.원문)}</span></p>`).join('');
    const experience = l.experience;
    const conditionDetails = `<div class="condition-bridge"><div class="condition-side"><small>태어난 사주에 있는 것</small><p>${esc(l.have)}</p><span>태어난 사주의 여덟 글자에서 확인했습니다.</span></div><span class="bridge-arrow" aria-hidden="true">→</span><div class="condition-side next"><small>운에서 살펴볼 글자</small><p>${esc(l.need || '각 시기의 흐름')}</p><span>해·달·날·시간에 같은 글자가 들어오는지 찾습니다.</span></div></div><div class="branch-row">${tokens}</div>`;
    const conditionSection = experience
      ? `<section class="chapter" id="jtp-my-condition" aria-labelledby="jtp-condition-heading"><p class="chapter-label">三 · 생각과 행동의 변화</p><h2 id="jtp-condition-heading">${esc(experience.title)}<br><em>${esc(experience.emphasis)}</em></h2><div class="experience-grid"><article class="experience-card"><p class="experience-label">생각</p><h3>${esc(experience.thought)}</h3></article><article class="experience-card"><p class="experience-label">행동</p><h3>${esc(experience.action)}</h3></article></div><details class="condition-evidence"><summary>이 변화를 읽은 글자와 조건</summary>${conditionDetails}<p class="interpretation-note">${esc(experience.basis)}</p></details></section>`
      : `<section class="chapter" id="jtp-my-condition" aria-labelledby="jtp-condition-heading"><p class="chapter-label">三 · 앞으로 살펴볼 조건</p><h2 id="jtp-condition-heading">타고난 사주를 읽고,<br><em>앞으로의 변화를 살펴봅니다.</em></h2><p class="chapter-lead">${esc(l.explanation)}</p>${conditionDetails}<p class="condition-caption">태어난 사주의 글자와,<br>앞으로 들어오는 글자를 함께 봅니다.</p></section>`;
    host.innerHTML = `
      <div class="chapter-nav"><nav class="links" aria-label="정통사주 목차"><a href="#jtp-my-shape">좋은 조건</a><a href="#jtp-my-condition">나를 돕는 조건</a><a href="#jtp-my-time">앞으로의 흐름</a></nav><p class="birth">${esc(birth.year + '.' + birth.month + '.' + birth.day)}<br>${esc(String(birth.hour).padStart(2, '0') + ':' + String(birth.minute || 0).padStart(2, '0') + ' · ' + place)}</p></div>
      <section class="hero filter-hero reader-hero" aria-labelledby="jtp-my-title"><div><p class="eyebrow">옛 책으로 읽는 당신</p><h1 id="jtp-my-title">${esc(id.title)}</h1><p class="hero-line">${esc(id.line)}</p><div class="name-origin">${esc(id.name)}<span lang="zh">${esc(id.hanja)}</span></div><a class="reader-go" href="#jtp-my-shape">나에게 해당하는 ${m.filterStory?.filters?.length||0}가지 조건 <span>↓</span></a></div></section>
      ${filterStack(m)}
      <section class="chapter" id="jtp-my-potential" aria-labelledby="jtp-name-heading"><p class="chapter-label">二 · 타고난 사주와 앞으로의 조건</p><h2 id="jtp-name-heading">태어난 사주에 있는 것과,<br><em>앞으로 살펴볼 조건.</em></h2><article class="name-panel"><div class="panel-top"><span class="book-label">${esc(m.wood ? '삼명통회 · 합화성국' : '타고난 바탕과 운')}</span><span class="state-pill">${esc(l.tag)}</span></div><h3 class="classical-name">${esc(l.title)}</h3><p class="classical-hanja" lang="zh">${esc(l.hanja)}</p><p class="name-sentence">${esc(l.line)}</p><details><summary>쉬운 풀이와 내 조건, 원문 보기</summary><p>${esc(id.basis)} 위의 짧은 이름은 책사가 뜻을 풀어 붙인 표현입니다.</p>${observed}<ul>${l.checks.map(c => `<li><b>${esc(c.value)}</b> — ${esc(c.detail)}</li>`).join('')}</ul>${l.note ? `<p>${esc(l.note)}</p>` : ''}<p>${esc(l.limits)}</p>${quote}${l.url ? `<p><a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.source)} 원문 ↗</a>${l.source2 ? ` · <a href="${esc(l.source2)}" target="_blank" rel="noreferrer">합화성국 원문 ↗</a>` : ''}</p>` : `<p>${esc(l.source)}</p>`}</details></article><div class="check-row">${checks}</div></section>
      ${conditionSection}
      <section class="chapter" id="jtp-my-time" aria-labelledby="jtp-time-heading"><div class="time-heading"><div><p class="chapter-label">四 · 앞으로의 흐름</p><h2 id="jtp-time-heading">${experience ? '이 변화와 연결해 볼<br><em>해와 달, 날과 시간.</em>' : '살펴볼 글자가 들어오는<br><em>해와 달, 날과 시간.</em>'}</h2></div><p class="asof">${esc(m.asof)} 기준</p></div><div class="scale-tabs" role="tablist" aria-label="운을 살펴볼 기간"><button type="button" role="tab" id="jtp-tab-large" aria-controls="jtp-time-panel" aria-selected="false" tabindex="-1" data-scale="large">10년 운</button><button type="button" role="tab" id="jtp-tab-years" aria-controls="jtp-time-panel" aria-selected="false" tabindex="-1" data-scale="years">해마다</button><button type="button" role="tab" id="jtp-tab-months" aria-controls="jtp-time-panel" aria-selected="true" data-scale="months">달마다</button><button type="button" role="tab" id="jtp-tab-days" aria-controls="jtp-time-panel" aria-selected="false" tabindex="-1" data-scale="days">날마다</button><button type="button" role="tab" id="jtp-tab-hours" aria-controls="jtp-time-panel" aria-selected="false" tabindex="-1" data-scale="hours">시간마다</button></div><div id="jtp-time-panel" role="tabpanel" aria-labelledby="jtp-tab-months" tabindex="0"><p class="scope-line" id="jtp-scope-line"></p><div class="window-grid" id="jtp-windows"></div></div><p class="time-note" id="jtp-time-note"></p></section>
      <section class="chapter" id="jtp-my-evidence"><p class="chapter-label">五 · 더 깊이 읽기</p><h2>이름을 붙인 이유와,<br><em>계산한 근거를 살펴보세요.</em></h2><div class="evidence-list"><details class="evidence"><summary>내 사주 여덟 글자와 풀이 기준</summary><div class="evidence-inner"><p>${esc(id.basis)}</p><p>시 · 일 · 월 · 년<br><b lang="zh">${esc(r.명식)}</b></p><div class="axis-list">${m.axes.map(a => `<div><h3>${esc(axisTitles[a.id] || a.id)} · ${esc(stateText(a.값))}</h3><p>${esc(a.고전이름 || '')}<br>${esc(books[a.책] || a.책)}</p>${a.근거?.length ? `<p>${esc(a.근거.join(' / '))}</p>` : ''}</div>`).join('')}</div></div></details><details class="evidence"><summary>해·달·날·시간을 계산한 기준</summary><div class="evidence-inner"><p>${esc(m.dateNote)}</p><p>${esc(l.limits)}</p><p>날짜 목록의 두 글자는 그날 낮 12시 기준입니다. 태어난 곳에 따른 시각 보정과 밤의 날짜 교체 기준 때문에, 같은 양력 날짜여도 밤에는 다른 날짜의 두 글자로 계산될 수 있습니다.</p></div></details><details class="evidence" id="jtp-rarity-evidence"><summary>비율을 계산한 방법과 비교 자료</summary><div class="evidence-inner">${filterEvidence(m)}</div></details>${names ? `<details class="evidence"><summary>같은 사주에 해당하는 다른 고전 구절</summary><div class="evidence-inner">${names}</div></details>` : ''}</div></section>
      <div class="closing"><span class="mark">策</span><p>당신에게는 이름이 있고,<br><em>그 이름을 살아갈 시간이 있습니다.</em></p><a href="#jtp-top">내 좋은 조건으로 돌아가기 ↑</a></div>`;
    host.querySelector('[data-rarity-source]')?.addEventListener('click', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const evidence = host.querySelector('#jtp-rarity-evidence');
      evidence.open = true;
      evidence.scrollIntoView({ block: 'start' });
      evidence.querySelector('summary').focus({ preventScroll: true });
    });
    const panel = host.querySelector('#jtp-time-panel'), windows = host.querySelector('#jtp-windows');
    const scope = {
      large: '대운은 10년마다 바뀌는 운입니다. 해·달·날·시간의 글자 목록과 별도로 계산한 결과입니다.',
      years: '내 사주에서 살펴볼 글자와 같은 글자가 들어오는 해입니다.',
      months: '가까운 달부터 보여 줍니다. 사주에서 한 달은 양력 1일이 아닌, 절기가 바뀌는 시각에 시작합니다.',
      days: '가까운 날짜부터 보여 줍니다. 각 날짜의 두 글자는 그날 낮 12시 기준입니다.',
      hours: '하루 안에서도 시간마다 글자가 달라집니다. 아래 시작과 끝 시각은 표시한 지역의 시계 기준입니다.'
    };
    const labels = { years: ['가장 가까운 해', '조건이 맞는 해'], months: ['가장 가까운 달', '조건이 맞는 달'], days: ['가장 가까운 날', '조건이 맞는 날'], hours: ['다가오는 시간', '그다음 시간'] };
    function setScale(scale) {
      const tabs = [...host.querySelectorAll('[data-scale]')];
      tabs.forEach(b => { const active = b.dataset.scale === scale; b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'jtp-tab-' + scale);
      host.querySelector('#jtp-scope-line').textContent = scope[scale];
      host.querySelector('#jtp-time-note').textContent = scale === 'large' ? '10년 단위의 흐름과 해·달·날·시간의 변화를 함께 읽습니다.' : experience ? '날짜는 같은 글자가 오는지 계산해 찾았습니다. 생각과 행동이 달라진다는 설명은 그 날짜와 연결해 읽은 해석입니다.' : m.wood ? '각각의 운에 亥 · 卯 · 未 · 寅 가운데 하나가 들어오는 구간입니다.' : '각각의 운에 필요한 글자가 들어오는 구간입니다.';
      if (scale === 'large') {
        const first = Math.max(0, Math.min(m.currentPeriod - 1, m.periods.length - 3));
        windows.innerHTML = m.periods.slice(first, first + 3).map(p => `<article class="window"><p class="window-label">${p.current ? '지금의 큰 흐름' : p.end < Number(m.asof.slice(0, 4)) ? '지나온 큰 흐름' : '다가올 큰 흐름'}</p><h3 class="window-title">${esc(p.name)}</h3><p class="age">${esc(p.title)} · ${esc(p.ageStart + '–' + p.ageEnd)}세</p><p class="window-ganji"><b lang="zh">${esc(p.ganji)}</b><span>${esc(p.type || '미확인')}격</span></p><p class="window-line">${esc(p.line)}</p><details><summary>이 시기를 읽은 분류</summary><p>사주의 기본 구성인 격: ${esc(p.type || '판정 자료 없음')}<br>그 구성이 성립했는지 보는 성패: ${esc(stateText(p.state) || '판정 자료 없음')}</p><p>위의 짧은 이름은 이 시기의 격 풀이를 바탕으로 책사가 붙였습니다.</p></details></article>`).join('') || '<p class="empty">이 명식의 대운 자료를 아직 받지 못했습니다.</p>';
      } else {
        const list = m[scale] || [];
        windows.innerHTML = list.map((w, i) => `<article class="window"><p class="window-label">${esc(w.start.slice(0, 4))} · ${w.current ? '지금 이어지는 조건' : i === 0 ? labels[scale][0] : labels[scale][1]}</p><h3 class="window-title">${esc(w.title)}</h3><p class="window-ganji"><b lang="zh">${esc(w.ganji)}</b><span>${esc(w.matched)}의 조건</span></p><p class="window-line">${esc(w.line)}</p><details><summary>날짜와 조건 보기</summary><p>${esc(w.start)}${w.end ? '<br>→ ' + esc(w.end) + ' 직전' : ''}</p><p>${esc(w.boundary)}</p></details></article>`).join('') || '<p class="empty">지금 계산한 기간 안에는 조건과 맞는 날짜가 없습니다. 10년 운을 함께 살펴보세요.</p>';
      }
    }
    const tabs = [...host.querySelectorAll('[data-scale]')];
    tabs.forEach((b, i) => {
      b.onclick = () => setScale(b.dataset.scale);
      b.onkeydown = e => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); tabs[n].focus(); setScale(tabs[n].dataset.scale); }
      };
    });
    host.querySelectorAll('a[href^="#jtp-"]').forEach(a=>a.addEventListener('click',e=>{
      if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      const href=a.getAttribute('href'),target=href==='#'+host.id?host:host.querySelector(href);
      if(target){e.preventDefault();e.stopPropagation();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
    }));
    setScale(m.months.length ? 'months' : 'large');
  }
  root.ChaeksaNameSeason = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
