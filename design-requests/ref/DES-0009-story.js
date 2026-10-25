(function (root) {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stateText = value => value === '섰다' ? '성격' : value;
  const pct = n => n == null ? '표본 없음' : n > 0 && n < .01 ? '＜0.01%' : Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + '%';
  const books = { '三命通會': '삼명통회', '子平眞詮': '자평진전', '淵海子平': '연해자평', '窮通寶鑑': '궁통보감', '滴天髓': '적천수', '엔진': '책사 계산' };
  const filterRate = value => value == null ? '비율 미산정' : Number(value).toLocaleString('ko-KR', { maximumFractionDigits: value < .01 ? 4 : value < .1 ? 3 : 2 }) + '%';
  function filterStack(m) {
    const story = m.filterStory;
    if (!story?.filters?.length) return '<section class="chapter filter-chapter" id="my-shape"><p class="empty">이 명식의 좋은 조건을 모으고 있습니다.</p></section>';
    const rows = story.filters;
    return `<section class="chapter filter-chapter" id="my-shape" aria-labelledby="filter-title"><div class="filter-section-heading"><div><p class="chapter-label">一 · 옛 책이 좋게 본 조건</p><h2 id="filter-title">하나씩 겹쳐 볼수록,<br><em>당신의 귀함이 보입니다.</em></h2></div><p class="filter-column-label">여기까지 모두 갖춘<br>누적 비율</p></div><ol class="classic-filters">${rows.map((f,i)=>`<li class="classic-filter" style="--depth:${Math.min(i,5)}"><span class="filter-number">${String(i+1).padStart(2,'0')}</span><article class="filter-paper"><div class="filter-top"><span class="filter-book">${esc(f.book)}</span><span class="filter-check">해당 ✓</span></div><div class="filter-reading"><div><h3>${esc(f.title)}</h3><p class="filter-name">${esc(f.name)}${f.classical&&f.classical!==f.name?' · <span lang="zh">'+esc(f.classical)+'</span>':''}</p><p class="filter-line">${esc(f.line)}</p></div><div class="filter-rate"><span>${i===0?'첫 조건':'누적'}</span><strong class="${f.percent==null?'unmeasured':''}">${filterRate(f.percent)}</strong></div></div><details class="filter-source"><summary>고전 원문과 내 조건</summary>${f.quote?'<blockquote lang="zh">'+esc(f.quote)+'</blockquote>':''}<p><b>내 명식에서 확인한 조건</b><br>${esc(f.evidence)}</p><p>${esc(f.source)}</p><p class="source-scope">${esc(f.scope)}</p></details></article></li>`).join('')}</ol><div class="filter-conclusion"><span class="conclusion-seal">貴</span><p class="conclusion-kicker">${rows.length}가지 좋은 조건이 겹쳤습니다.</p><h2>${esc(story.conclusion)}</h2><p>옛 책이 좋게 본 이유가,<br>당신의 명식 안에 겹쳐 있습니다.</p><div class="conclusion-ratio"><strong>${filterRate(story.percent)}</strong><span>같은 조건이 모두 겹친 명식</span></div><a href="#rarity-evidence" data-rarity-source>비교 명식 기준 · 산출 기준 보기</a></div></section>`;
  }
  function filterEvidence(m) {
    const story=m.filterStory;
    if(!story)return '';
    return `<p>${esc(story.basis)}</p><p>비교 명식: ${Number(story.sampleSize).toLocaleString('ko-KR')}개 · ${esc(story.scheme||'')}</p><ol class="filter-counts">${story.filters.map(f=>`<li><b>${esc(f.name)}</b><span>${Number(f.count).toLocaleString('ko-KR')}개 · ${filterRate(f.percent)}</span></li>`).join('')}</ol><p>비교 자료에서 함께 관측하지 못한 조합은 비율 미산정으로 표시합니다.</p><p>${esc(story.scope)}</p>`;
  }

  function mount(host, m) {
    const l = m.lens, id = m.identity, r = m.original;
    const next = m.months[0], birth = m.input, place = String(birth.place || 'KR:서울').split(':').slice(1).join(':');
    const words = id.title.split(' '), first = words.shift();
    const title = esc(first) + '<br><em>' + esc(words.join(' ')) + '.</em>';
    const quote = l.quote ? `<p class="quote" lang="zh">${esc(l.quote)}</p>` : '';
    const observed = l.observation ? `<p>개인 견본에서 연결한 관찰: ‘${esc(l.observation)}’.</p>` : '';
    const checks = l.checks.map(c => `<div class="check ${c.state === true ? '' : 'wait'}"><p class="check-label">${esc(c.title)}</p><p class="check-value">${esc(c.value)}</p><p class="check-state">${c.state === true ? '타고난 바탕에 있음' : c.state === false ? '운에서 살펴볼 조건' : '운의 글자 확인'}</p></div>`).join('');
    const tokens = m.wood ? [['寅', '인목'], ['卯', '묘목'], ['未', '미토'], ['亥', '해수']].map(x => `<span class="branch-token"><b>${x[0]}</b><small>${x[1]}</small></span>`).join('') : l.need ? `<span class="branch-token"><b>${esc(l.need)}</b><small>필요한 글자</small></span>` : '';
    const names = (r.옛이름 || []).filter(n => n.key !== 'SM06B-061').map(n => `<p><b>${esc(n.고전이름)}</b> · ${esc(books[n.책] || n.책)}<br><span lang="zh">${esc(n.원문)}</span></p>`).join('');
    const experience = l.experience;
    const conditionDetails = `<div class="condition-bridge"><div class="condition-side"><small>이미 가진 바탕</small><p>${esc(l.have)}</p><span>태어난 명식에서 읽은 글자입니다.</span></div><span class="bridge-arrow" aria-hidden="true">→</span><div class="condition-side next"><small>운에서 살펴볼 글자</small><p>${esc(l.need || '각 시기의 흐름')}</p><span>해·달·날·시간에서 이 글자의 도래를 찾습니다.</span></div></div><div class="branch-row">${tokens}</div>`;
    const conditionSection = experience
      ? `<section class="chapter" id="my-condition" aria-labelledby="condition-heading"><p class="chapter-label">三 · 생각과 행동의 변화</p><h2 id="condition-heading">${esc(experience.title)}<br><em>${esc(experience.emphasis)}</em></h2><div class="experience-grid"><article class="experience-card"><p class="experience-label">생각</p><h3>${esc(experience.thought)}</h3></article><article class="experience-card"><p class="experience-label">행동</p><h3>${esc(experience.action)}</h3></article></div><details class="condition-evidence"><summary>이 변화를 읽은 글자와 조건</summary>${conditionDetails}<p class="interpretation-note">${esc(experience.basis)}</p></details></section>`
      : `<section class="chapter" id="my-condition" aria-labelledby="condition-heading"><p class="chapter-label">三 · 무엇이 나를 깨우는가</p><h2 id="condition-heading">내 안의 가능성에,<br><em>새로운 기운이 더해집니다.</em></h2><p class="chapter-lead">${esc(l.explanation)}</p>${conditionDetails}<p class="condition-caption">타고난 바탕에서 시작해,<br>운에서 무엇이 더해지는지 이어 봅니다.</p></section>`;
    host.innerHTML = `
      <div class="chapter-nav"><nav class="links" aria-label="정통사주 목차"><a href="#my-shape">좋은 조건</a><a href="#my-condition">생각과 행동</a><a href="#my-time">앞으로의 흐름</a></nav><p class="birth">${esc(birth.year + '.' + birth.month + '.' + birth.day)}<br>${esc(String(birth.hour).padStart(2, '0') + ':' + String(birth.minute || 0).padStart(2, '0') + ' · ' + place)}</p></div>
      <section class="hero filter-hero" aria-labelledby="my-title"><div><p class="eyebrow">옛 책으로 읽는 당신</p><h1 id="my-title">옛 책이<br><em>당신을 좋게 본 이유.</em></h1><p class="hero-line">당신에게 해당하는 좋은 대목을<br>하나씩 겹쳐 보았습니다.</p><div class="name-origin">${esc(id.title)} <span>${esc(id.name)}</span><span lang="zh">${esc(id.hanja)}</span></div></div><div class="filter-intro"><span class="filter-intro-count">${m.filterStory?.filters?.length||0}</span><span>가지 좋은 조건</span><p>${m.filterStory?.books?.length||0}권의 옛 책에서<br>당신의 글자를 찾았습니다.</p><a href="#my-shape">하나씩 읽어 보기 ↓</a></div></section>
      ${filterStack(m)}
      <section class="chapter" id="my-potential" aria-labelledby="name-heading"><p class="chapter-label">二 · 운에서 이어질 가능성</p><h2 id="name-heading">아직 펼치지 않은 이름도,<br><em>당신 안에 남아 있습니다.</em></h2><article class="name-panel"><div class="panel-top"><span class="book-label">${esc(m.wood ? '삼명통회 · 합화성국' : '타고난 바탕과 운')}</span><span class="state-pill">${esc(l.tag)}</span></div><h3 class="classical-name">${esc(l.title)}</h3><p class="classical-hanja" lang="zh">${esc(l.hanja)}</p><p class="name-sentence">${esc(l.line)}</p><details><summary>이 이름과 조건을 읽은 근거</summary><p>${esc(id.basis)} 문장형 이름은 책사가 풀어 붙인 표현입니다.</p>${quote}${observed}<ul>${l.checks.map(c => `<li><b>${esc(c.value)}</b> — ${esc(c.detail)}</li>`).join('')}</ul>${l.note ? `<p>${esc(l.note)}</p>` : ''}<p>${esc(l.limits)}</p>${l.url ? `<p><a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.source)} 원문 ↗</a>${l.source2 ? ` · <a href="${esc(l.source2)}" target="_blank" rel="noreferrer">합화성국 원문 ↗</a>` : ''}</p>` : `<p>${esc(l.source)}</p>`}</details></article><div class="check-row">${checks}</div></section>
      ${conditionSection}
      <section class="chapter" id="my-time" aria-labelledby="time-heading"><div class="time-heading"><div><p class="chapter-label">四 · 앞으로의 흐름</p><h2 id="time-heading">${experience ? '이 변화와 연결해 볼<br><em>해와 달, 날과 시간.</em>' : '필요한 기운이 들어오는<br><em>해와 달, 날과 시간.</em>'}</h2></div><p class="asof">${esc(m.asof)} 기준</p></div><div class="scale-tabs" role="tablist" aria-label="시간 규모"><button type="button" role="tab" id="tab-large" aria-controls="time-panel" aria-selected="false" tabindex="-1" data-scale="large">큰 흐름</button><button type="button" role="tab" id="tab-years" aria-controls="time-panel" aria-selected="false" tabindex="-1" data-scale="years">해</button><button type="button" role="tab" id="tab-months" aria-controls="time-panel" aria-selected="true" data-scale="months">달</button><button type="button" role="tab" id="tab-days" aria-controls="time-panel" aria-selected="false" tabindex="-1" data-scale="days">날</button><button type="button" role="tab" id="tab-hours" aria-controls="time-panel" aria-selected="false" tabindex="-1" data-scale="hours">시</button></div><div id="time-panel" role="tabpanel" aria-labelledby="tab-months" tabindex="0"><p class="scope-line" id="scope-line"></p><div class="window-grid" id="windows"></div></div><p class="time-note" id="time-note"></p></section>
      <section class="chapter" id="my-evidence"><p class="chapter-label">五 · 더 깊이 읽기</p><h2>짧은 이름 뒤에,<br><em>당신의 글자가 있습니다.</em></h2><div class="evidence-list"><details class="evidence"><summary>나의 이름과 타고난 글자</summary><div class="evidence-inner"><p>${esc(id.basis)}</p><p>시 · 일 · 월 · 년<br><b lang="zh">${esc(r.명식)}</b></p><div class="axis-list">${m.axes.map(a => `<div><h3>${esc(a.id)} · ${esc(stateText(a.값))}</h3><p>${esc(a.고전이름 || '')}<br>${esc(books[a.책] || a.책)}</p>${a.근거?.length ? `<p>${esc(a.근거.join(' / '))}</p>` : ''}</div>`).join('')}</div></div></details><details class="evidence"><summary>간지와 날짜를 찾은 기준</summary><div class="evidence-inner"><p>${esc(m.dateNote)}</p><p>${esc(l.limits)}</p><p>날 목록의 간지는 표시일 정오 기준입니다. 시각 보정과 자시의 날짜 교체 때문에 같은 양력 날짜라도 밤에는 일주가 달라질 수 있습니다.</p></div></details><details class="evidence" id="rarity-evidence"><summary>비율 산출 기준과 표본</summary><div class="evidence-inner">${filterEvidence(m)}</div></details>${names ? `<details class="evidence"><summary>함께 읽을 고전 대목</summary><div class="evidence-inner">${names}</div></details>` : ''}</div></section>
      <div class="closing"><span class="mark">策</span><p>당신에게는 이름이 있고,<br><em>그 이름을 살아갈 시간이 있습니다.</em></p><a href="#top">나의 이름으로 돌아가기 ↑</a></div>`;
    host.querySelector('[data-rarity-source]')?.addEventListener('click', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const evidence = host.querySelector('#rarity-evidence');
      evidence.open = true;
      evidence.scrollIntoView({ block: 'start' });
      evidence.querySelector('summary').focus({ preventScroll: true });
    });
    const panel = host.querySelector('#time-panel'), windows = host.querySelector('#windows');
    const scope = {
      large: '대운은 10년 단위의 큰 흐름입니다. 아래의 해·달·날·시와 따로 계산한 기존 대운 결과입니다.',
      years: '나의 조건과 맞는 글자가 들어오는 해를 모았습니다.',
      months: '가까운 달부터 살펴봅니다. 달의 시작은 양력 1일이 아니라 절기가 바뀌는 시각입니다.',
      days: '가까운 날짜부터 모았습니다. 각 날짜의 간지는 정오 기준입니다.',
      hours: '같은 날 안에서도 글자가 달라집니다. 아래는 표시한 지역의 시계로 바꾼 구간입니다.'
    };
    const labels = { years: ['가장 가까운 해', '조건이 맞는 해'], months: ['가장 가까운 달', '조건이 맞는 달'], days: ['가장 가까운 날', '조건이 맞는 날'], hours: ['다가오는 시간', '그다음 시간'] };
    function setScale(scale) {
      const tabs = [...host.querySelectorAll('[data-scale]')];
      tabs.forEach(b => { const active = b.dataset.scale === scale; b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'tab-' + scale);
      host.querySelector('#scope-line').textContent = scope[scale];
      host.querySelector('#time-note').textContent = scale === 'large' ? '10년 단위의 흐름과 해·달·날·시간의 변화를 함께 읽습니다.' : experience ? '날짜는 글자의 일치로 찾았으며, 생각과 행동의 문장은 그에 연결한 해석입니다.' : m.wood ? '각각의 운에서 목을 돕는 글자가 더해집니다.' : '각각의 운에서 필요한 글자가 더해집니다.';
      if (scale === 'large') {
        const first = Math.max(0, Math.min(m.currentPeriod - 1, m.periods.length - 3));
        windows.innerHTML = m.periods.slice(first, first + 3).map(p => `<article class="window"><p class="window-label">${p.current ? '지금의 큰 흐름' : p.end < Number(m.asof.slice(0, 4)) ? '지나온 큰 흐름' : '다가올 큰 흐름'}</p><h3 class="window-title">${esc(p.name)}</h3><p class="age">${esc(p.title)} · ${esc(p.ageStart + '–' + p.ageEnd)}세</p><p class="window-ganji"><b lang="zh">${esc(p.ganji)}</b><span>${esc(p.type || '미확인')}격</span></p><p class="window-line">${esc(p.line)}</p><details><summary>이 시기의 기존 판정</summary><p>격: ${esc(p.type || '판정 자료 없음')}<br>짜임의 상태: ${esc(stateText(p.state) || '판정 자료 없음')}</p><p>문장형 이름은 기존 격 풀이를 바탕으로 붙였습니다.</p></details></article>`).join('') || '<p class="empty">이 명식의 대운 자료를 아직 받지 못했습니다.</p>';
      } else {
        const list = m[scale] || [];
        windows.innerHTML = list.map((w, i) => `<article class="window"><p class="window-label">${esc(w.start.slice(0, 4))} · ${w.current ? '지금 이어지는 조건' : i === 0 ? labels[scale][0] : labels[scale][1]}</p><h3 class="window-title">${esc(w.title)}</h3><p class="window-ganji"><b lang="zh">${esc(w.ganji)}</b><span>${esc(w.matched)}의 조건</span></p><p class="window-line">${esc(w.line)}</p><details><summary>날짜와 조건 보기</summary><p>${esc(w.start)}${w.end ? '<br>→ ' + esc(w.end) + ' 직전' : ''}</p><p>${esc(w.boundary)}</p></details></article>`).join('') || '<p class="empty">현재 계산 범위에는 조건과 맞는 날짜가 없습니다. 큰 흐름을 함께 읽어 보세요.</p>';
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
    setScale(m.months.length ? 'months' : 'large');
  }
  root.ChaeksaNameSeason = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
