/* 책사 앱 UI v1 */
(function () {
  'use strict';
  const E = ChaeksaEngine, f = E.fmt, C = ChaeksaCalendar, AI = ChaeksaAI;
  const $ = (id) => document.getElementById(id);
  const KEY = 'chaeksa.profile', PKEY = 'chaeksa.partners', HKEY = 'chaeksa.chat';
  const today = new Date();
  let profile = null, R = null;
  const elemClass = (i, isStem) => 'e-' + (isStem ? f.stemElem(i) : f.branchElem(i));
  const nim = () => profile.name === '당신' ? '당신' : profile.name + '님';
  const god = (stem) => E.TEN_GODS[E.tenGod(R.analysis.dayStem, stem)];

  const GOD_FLOW = {
    비견:'내 중심이 서는 때. 독립·자립·내 것 챙기기.', 겁재:'경쟁과 지출이 늘어나는 때. 동업·보증·큰 지출은 신중하게.',
    식신:'여유와 표현의 때. 즐기고 만들고 나누면 돌아옵니다.', 상관:'말과 재능이 튀는 때. 창작·홍보는 좋고, 윗사람과는 부드럽게.',
    편재:'기회와 움직임의 때. 나가고 만나고 시도하면 돈이 붙습니다.', 정재:'실속과 안정의 때. 차곡차곡 모으고 관리하면 남습니다.',
    편관:'압박과 단련의 때. 힘들지만 실력이 붙습니다. 건강 먼저.', 정관:'인정과 질서의 때. 승진·시험·계약·공식 관계에 유리.',
    편인:'생각이 깊어지는 때. 공부·연구·기획·혼자만의 시간.', 정인:'배우고 받는 때. 도움 주는 사람, 문서·자격·학업 운.',
  };

  // ───── 온보딩 ─────
  function readForm() {
    const noTime = $('noTime').checked;
    const p = { name: $('name').value.trim() || '당신', year: +$('y').value, month: +$('m').value, day: +$('d').value,
      hour: noTime ? null : ($('hh').value === '' ? null : +$('hh').value), minute: noTime ? 0 : +($('mi').value || 0),
      gender: $('g').value, solarCorrection: $('solar').checked };
    if (!p.year || !p.month || !p.day) { alert('생년월일을 입력해 주세요.'); return null; }
    if (p.year < 1900 || p.year > 2100 || p.month < 1 || p.month > 12 || p.day < 1 || p.day > 31) { alert('날짜를 다시 확인해 주세요.'); return null; }
    return p;
  }
  $('btnGo').onclick = () => { const p = readForm(); if (!p) return; localStorage.setItem(KEY, JSON.stringify(p)); start(p); };
  $('noTime').onchange = (e) => { $('hh').disabled = $('mi').disabled = e.target.checked; };

  // ───── 탭 ─────
  function go(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('hide', t.dataset.tab !== tab));
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.go === tab));
    window.scrollTo({ top: 0 });
    if (tab === 'chat') setTimeout(() => $('msgs').scrollTop = 1e9, 0);
  }
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => go(b.dataset.go));

  // ───── 시작 ─────
  function start(p) {
    if (!p.name) p.name = '당신';
    profile = p; R = E.calc(p);
    $('formCard').classList.add('hide'); $('app').classList.remove('hide'); $('nav').classList.remove('hide');
    $('subtitle').textContent = `${nim()}의 명리비서`;
    renderToday(); renderMe(); renderCal(); renderPartners(); renderChat();
    go('today');
  }

  // ───── 오늘 ─────
  function renderToday() {
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const du = E.currentDaeun(R, today);
    $('todayLabel').textContent = `오늘 브리핑 · ${today.getMonth() + 1}월 ${today.getDate()}일`;
    $('todayGanji').innerHTML = `<span>올해 <b>${f.pillar(tf.year)}</b></span><span>이달 <b>${f.pillar(tf.month)}</b></span><span>오늘 <b>${f.pillar(tf.day)}</b></span>` + (du ? `<span>대운 <b>${f.pillar(du)}</b></span>` : '');
    const b = ChaeksaBrief.today(R, tf, du, today);
    $('brief').innerHTML = b.paragraphs.map(t => `<p>${t}</p>`).join('') + `<div class="act">${b.action}</div>`;
    // 이번 주
    const wk = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const s = C.scoreDay(R, d.getFullYear(), d.getMonth() + 1, d.getDate(), 'all');
      wk.push(`<div class="wd ${i === 0 ? 'today' : ''}">${['일','월','화','수','목','금','토'][d.getDay()]} ${d.getDate()}<b>${f.pillar(s.tf.day)}</b>${s.god}<i class="g${s.grade}"></i></div>`);
    }
    $('week').innerHTML = wk.join('');
    // AI 브리핑
    loadAiBrief();
  }
  async function loadAiBrief() {
    const box = $('aiBrief'), cta = $('aiBriefCta');
    if (!AI.ready()) { box.innerHTML = ''; cta.classList.remove('hide'); return; }
    cta.classList.add('hide');
    box.className = 'brief loading'; box.textContent = '비서가 오늘을 읽는 중…';
    try { const t = await AI.dailyBrief(R, today); box.className = 'brief'; box.textContent = t; }
    catch (e) { box.className = 'brief'; box.innerHTML = `<span style="color:var(--ink3);font-size:14px">AI 브리핑을 가져오지 못했어요: ${e.message}</span>`; }
  }
  $('btnAiBrief').onclick = () => openSettings();

  // ───── 나 ─────
  function renderMe() {
    const a = R.analysis, du = E.currentDaeun(R, today);
    const order = [['hour','시주'],['day','일주'],['month','월주'],['year','연주']];
    $('pillars').innerHTML = order.map(([k, label]) => {
      const pl = R.pillars[k];
      if (!pl) return `<div class="pillar"><div class="t">${label}</div><div class="han" style="color:var(--ink3)">?</div><div class="ko">시간 모름</div></div>`;
      const g = a.gods[k];
      return `<div class="pillar ${k === 'day' ? 'day' : ''}"><div class="t">${label}</div>
        <div class="g">${g.stem ?? '<span style="color:var(--accent)">나</span>'}</div>
        <div class="han ${elemClass(pl.stem, true)}">${f.stem(pl.stem)}</div><div class="ko">${f.stemKo(pl.stem)} · ${f.stemElem(pl.stem)}</div>
        <div class="han ${elemClass(pl.branch, false)}" style="margin-top:4px">${f.branch(pl.branch)}</div><div class="ko">${f.branchKo(pl.branch)} · ${f.branchElem(pl.branch)}</div>
        <div class="g">${g.branch}</div><div class="hidden">${g.hidden.map(h => f.stem(h.stem)).join(' ')}</div></div>`;
    }).join('');
    const dm = ChaeksaBrief.dayMaster(a.dayStem);
    $('me').innerHTML = `<div class="big ${elemClass(a.dayStem, true)}">${f.stem(a.dayStem)}</div><p><b>${dm.name}</b> — ${dm.one}<br><span style="font-size:13px">${dm.desc}</span></p>`;
    const max = Math.max(...a.elemCount, 1), colors = ['var(--wood)','var(--fire)','var(--earth)','var(--metal)','var(--water)'];
    $('bars').innerHTML = E.ELEM.map((e, i) => `<div class="bar"><span>${e}</span><i><b style="width:${a.elemCount[i] / max * 100}%;background:${colors[i]}"></b></i><span>${a.elemCount[i]}</span></div>`).join('');
    $('tags').innerHTML = [`<span class="tag on">${a.strength}</span>`, `<span class="tag">${a.dominant} 기운이 강함</span>`, a.missing.length ? `<span class="tag">${a.missing.join('·')} 없음</span>` : `<span class="tag">오행 고루 갖춤</span>`, `<span class="tag">쓰면 좋은 기운: ${a.yongCandidates.join('·')}</span>`].join('');
    $('daeun').innerHTML = R.daeun.list.map(d => `<div class="du ${du && du.startAge === d.startAge ? 'now' : ''}"><div class="age">${d.startAge}세</div><div class="han ${elemClass(d.stem, true)}">${f.stem(d.stem)}</div><div class="han ${elemClass(d.branch, false)}">${f.branch(d.branch)}</div><div class="yr">${d.startYear}~</div></div>`).join('');
    $('daeunHint').textContent = `${R.daeun.forward ? '순행' : '역행'} · ${R.daeun.startAge}세부터 10년마다 바뀜` + (du ? ` · 지금은 ${f.pillar(du)} 대운 — ${god(du.stem)}: ${GOD_FLOW[god(du.stem)]}` : '');
    // 세운
    const ys = [];
    for (let i = 0; i < 2; i++) {
      const y = today.getFullYear() + i, tf = E.dateFortune(y, 6, 15);
      const g = god(tf.year.stem), rel = C.branchRel(R.pillars.day.branch, tf.year.branch);
      ys.push(`<div class="flow"><div class="gz ${elemClass(tf.year.stem, true)}">${f.pillar(tf.year)}<small>${y}년</small></div><p><b>${g}</b> · ${GOD_FLOW[g]}${rel ? ` <span style="color:var(--ink3)">(일지와 ${rel})</span>` : ''}</p></div>`);
    }
    $('yearly').innerHTML = ys.join('');
    // 월운
    const ms = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 15);
      const tf = E.dateFortune(d.getFullYear(), d.getMonth() + 1, 15);
      const g = god(tf.month.stem), rel = C.branchRel(R.pillars.day.branch, tf.month.branch);
      ms.push(`<div class="flow"><div class="gz ${elemClass(tf.month.stem, true)}">${f.pillar(tf.month)}<small>${d.getFullYear()}.${d.getMonth() + 1}</small></div><p><b>${g}</b> · ${GOD_FLOW[g]}${rel ? ` <span style="color:var(--ink3)">(${rel})</span>` : ''}</p></div>`);
    }
    $('monthly').innerHTML = ms.join('');
  }

  // ───── 달력 ─────
  let calY = today.getFullYear(), calM = today.getMonth() + 1, purpose = 'all', selDay = null;
  function renderCal() {
    $('purposes').innerHTML = Object.entries(C.PURPOSES).map(([k, v]) => `<button class="chip ${k === purpose ? 'on' : ''}" data-p="${k}">${v.label}</button>`).join('');
    $('purposes').querySelectorAll('.chip').forEach(b => b.onclick = () => { purpose = b.dataset.p; renderCal(); });
    $('calTitle').textContent = `${calY}년 ${calM}월`;
    const days = C.month(R, calY, calM, purpose);
    const first = new Date(calY, calM - 1, 1).getDay();
    const todayN = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    let html = ['일','월','화','수','목','금','토'].map(d => `<div class="h">${d}</div>`).join('');
    for (let i = 0; i < first; i++) html += '<div class="cd empty"></div>';
    for (const s of days) {
      const n = calY * 10000 + calM * 100 + s.d;
      html += `<div class="cd g${s.grade} ${n === todayN ? 'today' : ''} ${n < todayN ? 'past' : ''} ${selDay === s.d ? 'sel' : ''}" data-d="${s.d}">${s.d}<i class="g${s.grade}"></i></div>`;
    }
    $('calgrid').innerHTML = html;
    $('calgrid').querySelectorAll('.cd[data-d]').forEach(el => el.onclick = () => { selDay = +el.dataset.d; renderCal(); showDay(days[selDay - 1]); });
    // 베스트 3
    const best = days.filter(s => (calY * 10000 + calM * 100 + s.d) >= todayN).sort((a, b) => b.score - a.score).slice(0, 3);
    if (!selDay) $('dayDetail').innerHTML = `<h2>${C.PURPOSES[purpose].label} · 이달의 추천일</h2><div class="best">${best.map(s => `<div class="b"><b>${s.d}일</b> ${f.pillar(s.tf.day)} · ${s.god}<span>${C.GRADE_LABEL[s.grade]}</span></div>`).join('') || '<p class="hint">남은 날 중 추천일이 없어요. 다음 달을 보세요.</p>'}</div>`;
  }
  function showDay(s) {
    const g = ChaeksaBrief.GOD_TODAY[s.god];
    $('dayDetail').innerHTML = `<h2>${calM}월 ${s.d}일 · ${f.pillar(s.tf.day)}(${f.pillarKo(s.tf.day)})</h2>
      <div class="score"><b style="font-size:28px">${C.GRADE_LABEL[s.grade]}</b><span>${C.PURPOSES[purpose].label} 기준 · ${s.reasons.join(', ')}</span></div>
      <div class="brief"><p>${s.god}의 날. ${g.tone}</p><p style="color:var(--ink2)">${g.care}</p><div class="act">👉 ${g.act}</div></div>`;
  }
  $('calPrev').onclick = () => { calM--; if (calM < 1) { calM = 12; calY--; } selDay = null; renderCal(); };
  $('calNext').onclick = () => { calM++; if (calM > 12) { calM = 1; calY++; } selDay = null; renderCal(); };

  // ───── 궁합 ─────
  function partners() { try { return JSON.parse(localStorage.getItem(PKEY)) || []; } catch (e) { return []; } }
  function renderPartners() {
    const ps = partners();
    $('partners').innerHTML = ps.length ? ps.map((p, i) => `<div class="pl"><span>${p.name} <small>${p.year}.${p.month}.${p.day}</small></span><span><button data-i="${i}" class="see">보기</button><button data-i="${i}" class="del">지우기</button></span></div>`).join('') : '<p class="hint">아직 없어요. 위에서 한 사람 넣어보세요.</p>';
    $('partners').querySelectorAll('.see').forEach(b => b.onclick = () => showCompat(ps[+b.dataset.i]));
    $('partners').querySelectorAll('.del').forEach(b => b.onclick = () => { const a = partners(); a.splice(+b.dataset.i, 1); localStorage.setItem(PKEY, JSON.stringify(a)); renderPartners(); });
  }
  $('btnCompat').onclick = () => {
    const p = { name: $('cName').value.trim() || '상대', year: +$('cY').value, month: +$('cM').value, day: +$('cD').value, hour: $('cH').value === '' ? null : +$('cH').value, minute: +($('cMi').value || 0), gender: $('cG').value };
    if (!p.year || !p.month || !p.day) { alert('상대 생년월일을 입력해 주세요.'); return; }
    const ps = partners(); ps.unshift(p); localStorage.setItem(PKEY, JSON.stringify(ps.slice(0, 20))); renderPartners(); showCompat(p);
  };
  async function showCompat(p) {
    const you = E.calc(p), res = ChaeksaCompat.analyze(R, you);
    const box = $('compatResult'); box.classList.remove('hide');
    box.innerHTML = `<h2>${profile.name} ∞ ${p.name}</h2>
      <div class="score"><b>${res.score}</b><span>/ 100 · ${p.name}님은 내게 <b style="font-size:14px;color:var(--ink)">${res.godText}</b></span></div>
      <div class="pillars" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
        <div class="pillar"><div class="t">나</div><div class="han ${elemClass(R.pillars.day.stem, true)}">${f.pillar(R.pillars.day)}</div></div>
        <div class="pillar"><div class="t">${p.name}</div><div class="han ${elemClass(you.pillars.day.stem, true)}">${f.pillar(you.pillars.day)}</div></div></div>
      <div class="brief" style="font-size:15px"><p>${res.stemRel.text}</p>${res.branchRels.map(b => `<p>${b.text}</p>`).join('')}${res.notes.map(n => `<p style="color:var(--ink2)">${n}</p>`).join('')}</div>
      <div id="compatAi" class="brief" style="margin-top:14px;font-size:15px"></div>`;
    box.scrollIntoView({ behavior: 'smooth' });
    if (AI.ready()) {
      const ai = $('compatAi'); ai.className = 'brief loading'; ai.textContent = '비서가 두 사람을 읽는 중…';
      try { ai.textContent = await AI.compatText(R, you, res, today); ai.className = 'brief'; ai.style.borderTop = '1px solid var(--line)'; ai.style.paddingTop = '12px'; }
      catch (e) { ai.textContent = ''; }
    }
  }

  // ───── 비서 채팅 ─────
  let history = [];
  const SUGGEST = ['이번 주 흐름 어때?', '지금 대운에서 내가 집중할 건?', '이직 고민 중인데 시기가 어때?', '내 사주에서 제일 큰 강점은?', '요즘 사람 관계가 힘든데 왜 그럴까?'];
  function renderChat() {
    try { history = JSON.parse(localStorage.getItem(HKEY)) || []; } catch (e) { history = []; }
    const box = $('msgs');
    box.innerHTML = history.length ? history.map(m => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${esc(m.content)}</div>`).join('') : `<div class="msg a">안녕하세요, ${nim()}. 저는 ${nim()}의 사주를 전부 알고 있는 책사예요. 고민이든 궁금한 거든 편하게 물어보세요.</div>`;
    $('suggest').innerHTML = SUGGEST.map(s => `<button>${s}</button>`).join('');
    $('suggest').querySelectorAll('button').forEach(b => b.onclick = () => { $('q').value = b.textContent; ask(); });
    const ok = AI.ready();
    $('q').disabled = $('btnAsk').disabled = !ok;
    $('chatHint').innerHTML = ok ? '' : '설정에서 API 키를 넣으면 비서가 답합니다. <a href="#" id="openSet" style="color:var(--accent)">설정 열기</a>';
    const a = $('openSet'); if (a) a.onclick = (e) => { e.preventDefault(); openSettings(); };
    box.scrollTop = 1e9;
  }
  function esc(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  async function ask() {
    const q = $('q').value.trim(); if (!q) return;
    $('q').value = '';
    const box = $('msgs');
    box.insertAdjacentHTML('beforeend', `<div class="msg u">${esc(q)}</div><div class="msg t" id="typing">비서가 생각 중…</div>`); box.scrollTop = 1e9;
    $('btnAsk').disabled = true;
    try {
      const a = await AI.chat(R, today, history, q);
      history.push({ role: 'user', content: q }, { role: 'assistant', content: a });
      localStorage.setItem(HKEY, JSON.stringify(history.slice(-30)));
      $('typing').outerHTML = `<div class="msg a">${esc(a)}</div>`;
    } catch (e) { $('typing').outerHTML = `<div class="msg t">답을 가져오지 못했어요: ${esc(e.message)}</div>`; }
    $('btnAsk').disabled = false; box.scrollTop = 1e9;
  }
  $('btnAsk').onclick = ask;
  $('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(); });

  // ───── 설정 ─────
  function openSettings() { const s = AI.settings(); $('apiKey').value = s.apiKey || ''; $('model').value = s.model || 'claude-opus-5'; $('proxyUrl').value = s.proxyUrl || ''; $('settings').classList.remove('hide'); }
  $('btnSettings').onclick = openSettings;
  $('btnCloseSettings').onclick = () => $('settings').classList.add('hide');
  $('btnSaveSettings').onclick = () => {
    AI.saveSettings({ apiKey: $('apiKey').value.trim(), model: $('model').value, proxyUrl: $('proxyUrl').value.trim() });
    $('settings').classList.add('hide');
    if (R) { Object.keys(localStorage).filter(k => k.startsWith('chaeksa.brief.')).forEach(k => localStorage.removeItem(k)); loadAiBrief(); renderChat(); }
  };
  $('btnReset').onclick = () => { if (confirm('내 정보, 대화, 저장된 사람을 모두 지웁니다. 계속할까요?')) { [KEY, PKEY, HKEY].forEach(k => localStorage.removeItem(k)); Object.keys(localStorage).filter(k => k.startsWith('chaeksa.brief.')).forEach(k => localStorage.removeItem(k)); location.reload(); } };

  // ───── PWA ─────
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

  // ───── 시작 ─────
  const saved = localStorage.getItem(KEY);
  if (saved) { try { start(JSON.parse(saved)); } catch (e) { localStorage.removeItem(KEY); } }
})();
