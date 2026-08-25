/* 책사 앱 UI v1 */
(function () {
  'use strict';
  const E = ChaeksaEngine, f = E.fmt, C = ChaeksaCalendar, AI = ChaeksaAI;
  const $ = (id) => document.getElementById(id);
  const KEY = 'chaeksa.profile', PKEY = 'chaeksa.partners';
  const HK = () => 'chaeksa.chat.' + (profile && profile.id ? profile.id : 'solo');
  const today = new Date();
  let profile = null, R = null;
  const elemClass = (i, isStem) => 'e-' + (isStem ? f.stemElem(i) : f.branchElem(i));
  const nim = () => profile.name === '당신' ? '당신' : profile.name + '님';
  const nimSafe = () => esc(nim());
  const god = (stem) => E.TEN_GODS[E.tenGod(R.analysis.dayStem, stem)];

  // 아주 가벼운 마크다운: **굵게**, 줄바꿈만 (LLM 서술 표시용)
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const mdLite = (t) => String(t)
    .replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]))
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^#{1,3}\s*(.+)$/gm, '<b>$1</b>')
    .replace(new RegExp(String.fromCharCode(10), 'g'), '<br>');

  const GOD_FLOW = {
    비견:'내 중심이 서는 때. 독립·자립·내 것 챙기기.', 겁재:'경쟁과 지출이 늘어나는 때. 동업·보증·큰 지출은 신중하게.',
    식신:'여유와 표현의 때. 즐기고 만들고 나누면 돌아옵니다.', 상관:'말과 재능이 튀는 때. 창작·홍보는 좋고, 윗사람과는 부드럽게.',
    편재:'기회와 움직임의 때. 나가고 만나고 시도하면 돈이 붙습니다.', 정재:'실속과 안정의 때. 차곡차곡 모으고 관리하면 남습니다.',
    편관:'압박과 단련의 때. 힘들지만 실력이 붙습니다. 건강 먼저.', 정관:'인정과 질서의 때. 승진·시험·계약·공식 관계에 유리.',
    편인:'생각이 깊어지는 때. 공부·연구·기획·혼자만의 시간.', 정인:'배우고 받는 때. 도움 주는 사람, 문서·자격·학업 운.',
  };

  // ───── 테마: 하루의 리듬 ─────
  const TKEY = 'chaeksa.theme';
  const themeMode = () => localStorage.getItem(TKEY) || 'auto';
  const isNightHour = (d) => { const h = d.getHours(); return h < 6 || h >= 18; };
  function applyTheme() {
    const mode = themeMode();
    const night = mode === 'night' || (mode === 'auto' && isNightHour(new Date()));
    document.documentElement.setAttribute('data-theme', night ? 'night' : 'day');
    const btn = $('btnTheme'); if (btn) { btn.textContent = night ? '☾' : '☀'; btn.title = night ? '밤 · 새벽 (눌러서 낮으로)' : '낮 · 한지 (눌러서 밤으로)'; }
    const meta = $('metaTheme'); if (meta) meta.setAttribute('content', night ? '#141829' : '#f7f2e8');
    const seg = $('themeSeg'); if (seg) seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === mode));
  }
  function setTheme(mode) { localStorage.setItem(TKEY, mode); applyTheme(); }
  applyTheme();
  setInterval(applyTheme, 10 * 60 * 1000);   // 열어둔 채 해가 지면 알아서 바뀜
  $('btnTheme').onclick = () => {
    const night = document.documentElement.getAttribute('data-theme') === 'night';
    setTheme(night ? 'day' : 'night');
  };
  $('themeSeg').querySelectorAll('button').forEach(b => b.onclick = () => setTheme(b.dataset.t));

  // ───── 사람들 ─────
  const People = () => window.ChaeksaPeople;
  let editingId = null;      // 수정 중인 사람. null이면 새로 추가

  function personLabel(p) { return p.isSelf ? p.name : `${p.name} · ${p.relation}`; }

  function renderPeopleBtn() {
    const btn = $('btnPerson'); if (!btn || !People()) return;
    const p = People().active();
    btn.classList.toggle('hide', !p);
    if (p) $('personName').textContent = p.name;
  }

  function openPeople() {
    const P = People(); if (!P) return;
    const cur = P.activeId();
    $('peopleList').innerHTML = P.list().map(p => `
      <div class="pr ${p.id === cur ? 'on' : ''}" data-id="${p.id}">
        <button class="pr-main" data-id="${p.id}" data-a="pick">
          <b>${esc(p.name)}</b>
          <span>${esc(p.relation)}${p.isSelf ? '' : ''} · ${p.birth.year}.${p.birth.month}.${p.birth.day}${p.birth.hour == null ? ' (시간 모름)' : ''}</span>
        </button>
        <button class="btn-ghost" data-id="${p.id}" data-a="edit" aria-label="수정">고치기</button>
      </div>`).join('') || '<p class="hint">아직 등록된 사람이 없습니다.</p>';
    $('peopleList').querySelectorAll('button').forEach(b => b.onclick = () => {
      if (b.dataset.a === 'pick') { P.setActive(b.dataset.id); $('peopleSheet').classList.add('hide'); start(P.toProfile(P.active())); }
      else openPersonForm(b.dataset.id);
    });
    $('peopleSheet').classList.remove('hide');
  }

  function openPersonForm(id) {
    const P = People(); if (!P) return;
    editingId = id || null;
    const p = id ? P.get(id) : null;
    $('pfTitle').textContent = p ? '사람 정보 고치기' : '사람 추가';
    $('pfRel').innerHTML = P.RELATIONS.map(r => `<option value="${r}">${r}</option>`).join('');
    if ($('pfPlace') && window.ChaeksaPlaces) $('pfPlace').innerHTML = ChaeksaPlaces.options();
    const b = p ? p.birth : {};
    $('pfName').value = p ? p.name : '';
    $('pfRel').value = p ? p.relation : (P.list().length ? '친구' : '나');
    pfCal = b.calendar === 'lunar' ? 'lunar' : 'solar';
    setPfCal(pfCal);
    if (pfCal === 'lunar' && b.lunarInput) {
      $('pfY').value = b.lunarInput.y; $('pfM').value = b.lunarInput.m; $('pfD').value = b.lunarInput.d;
      $('pfLeap').checked = !!b.lunarInput.leap;
    } else {
      $('pfY').value = b.year || ''; $('pfM').value = b.month || ''; $('pfD').value = b.day || '';
      $('pfLeap').checked = false;
    }
    $('pfH').value = b.hour == null ? '' : b.hour;
    $('pfMi').value = b.minute == null ? '' : b.minute;
    $('pfNoTime').checked = b.hour == null && !!p;
    $('pfH').disabled = $('pfMi').disabled = $('pfNoTime').checked;
    $('pfG').value = b.gender || 'M';
    if ($('pfPlace')) $('pfPlace').value = b.place || 'KR:서울';
    $('pfDelete').classList.toggle('hide', !p || P.list().length <= 1);
    $('personForm').classList.remove('hide');
    updatePfConv();
  }

  let pfCal = 'solar';
  function setPfCal(mode) {
    pfCal = mode;
    $('pfCalSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.cal === mode));
    if (mode === 'solar') { $('pfLeap').checked = false; $('pfLeapWrap').classList.add('hide'); }
    updatePfConv();
  }
  function pfToSolar() {
    const y = +$('pfY').value, m = +$('pfM').value, d = +$('pfD').value;
    if (!y || !m || !d) return null;
    if (pfCal === 'solar') return { y, m, d };
    if (!window.ChaeksaLunar) return null;
    const r = ChaeksaLunar.lunarToSolar(y, m, d, $('pfLeap').checked);
    return r && !r.error ? r : { error: (r && r.error) || '변환할 수 없는 날짜입니다.' };
  }
  function updatePfConv() {
    const note = $('pfConv'); if (!note) return;
    const y = +$('pfY').value, m = +$('pfM').value, d = +$('pfD').value;
    if (!y || !m || !d || !window.ChaeksaLunar) { note.classList.add('hide'); return; }
    if (pfCal === 'lunar') {
      const leapM = ChaeksaLunar.leapMonthOf(y);
      $('pfLeapWrap').classList.toggle('hide', leapM !== m);
      if (leapM !== m) $('pfLeap').checked = false;
      const r = pfToSolar();
      if (!r) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = r.error ? `<b style="color:var(--g0-ink)">${esc(r.error)}</b>`
        : `음력 ${y}.${m}.${d}${$('pfLeap').checked ? ' (윤달)' : ''} → 양력 <b>${r.y}년 ${r.m}월 ${r.d}일</b>`;
    } else {
      const l = ChaeksaLunar.solarToLunar(y, m, d);
      if (!l) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = `양력 ${y}.${m}.${d} → 음력 <b>${l.year}년 ${l.leap ? '윤' : ''}${l.month}월 ${l.day}일</b>`;
    }
  }

  function savePerson() {
    const P = People();
    const sol = pfToSolar();
    if (!sol) { alert('생년월일을 입력해 주세요.'); return; }
    if (sol.error) { alert(sol.error); return; }
    const noTime = $('pfNoTime').checked;
    const pl = window.ChaeksaPlaces ? ChaeksaPlaces.resolve($('pfPlace') ? $('pfPlace').value : '') : null;
    const birth = {
      year: sol.y, month: sol.m, day: sol.d,
      hour: noTime ? null : ($('pfH').value === '' ? null : +$('pfH').value),
      minute: noTime ? 0 : +($('pfMi').value || 0),
      gender: $('pfG').value, solarCorrection: true,
      calendar: pfCal,
      lunarInput: pfCal === 'lunar' ? { y: +$('pfY').value, m: +$('pfM').value, d: +$('pfD').value, leap: $('pfLeap').checked } : null,
    };
    if (pl) { birth.place = $('pfPlace').value; birth.placeName = pl.name; birth.longitude = pl.lon; birth.tzOffset = pl.tzOffset; }
    const rel = $('pfRel').value;
    const name = $('pfName').value.trim() || (rel === '나' ? '나' : '이름 없음');
    if (editingId) {
      P.update(editingId, { name, relation: rel, birth, isSelf: rel === '나' });
    } else {
      const id = P.add({ name, relation: rel, isSelf: rel === '나' || !P.list().length, birth });
      P.setActive(id);
    }
    $('personForm').classList.add('hide');
    $('peopleSheet').classList.add('hide');
    if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
    start(P.toProfile(P.active()));
  }

  function wirePeople() {
    if (!People()) return;
    $('btnPerson').onclick = openPeople;
    $('btnClosePeople').onclick = () => $('peopleSheet').classList.add('hide');
    $('btnAddPerson').onclick = () => openPersonForm(null);
    $('pfCancel').onclick = () => $('personForm').classList.add('hide');
    $('pfSave').onclick = savePerson;
    $('pfDelete').onclick = () => {
      const P = People(), p = P.get(editingId);
      if (!p) return;
      if (!confirm(`${p.name} 님의 사주와 관련 기록을 지웁니다. 계속할까요?`)) return;
      P.remove(editingId);
      $('personForm').classList.add('hide'); $('peopleSheet').classList.add('hide');
      if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
      start(P.toProfile(P.active()));
    };
    $('pfCalSeg').querySelectorAll('button').forEach(b => b.onclick = () => setPfCal(b.dataset.cal));
    ['pfY', 'pfM', 'pfD'].forEach(id => $(id).addEventListener('input', updatePfConv));
    $('pfLeap').addEventListener('change', updatePfConv);
    $('pfNoTime').onchange = (e) => { $('pfH').disabled = $('pfMi').disabled = e.target.checked; };
  }

  // ───── 출생지 ─────
  function initPlace() {
    const sel = $('place'); if (!sel || !window.ChaeksaPlaces) return;
    sel.innerHTML = ChaeksaPlaces.options();
    sel.value = 'KR:서울';
    sel.onchange = updatePlaceNote;
    updatePlaceNote();
  }
  function updatePlaceNote() {
    const sel = $('place'), note = $('placeNote');
    if (!sel || !note || !window.ChaeksaPlaces) return;
    const p = ChaeksaPlaces.resolve(sel.value);
    if (p.tzOffset == null) {
      const diff = Math.round((p.lon - 135) * 4);
      note.classList.remove('hide');
      note.innerHTML = `${p.name} 기준 진태양시는 시계보다 <b>${Math.abs(diff)}분 ${diff < 0 ? '늦습니다' : '빠릅니다'}</b>. 태어난 시간이 시(時) 경계에 가까우면 이 차이로 시주가 바뀝니다.`;
    } else {
      note.classList.remove('hide');
      note.innerHTML = `${p.name}의 표준시(UTC${p.tzOffset >= 0 ? '+' : ''}${p.tzOffset})로 계산합니다. <b>그 시기에 서머타임이 있었다면</b> 태어난 시각에서 1시간을 빼고 입력해 주세요.`;
    }
  }

  // ───── 양력 / 음력 입력 ─────
  let calMode = 'solar';
  function setCal(mode) {
    calMode = mode;
    $('calSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.cal === mode));
    $('leapWrap').classList.toggle('hide', mode !== 'lunar');
    if (mode === 'solar') { $('isLeap').checked = false; }
    updateConv();
  }
  $('calSeg').querySelectorAll('button').forEach(b => b.onclick = () => setCal(b.dataset.cal));
  ['y', 'm', 'd', 'isLeap'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', updateConv); });
  $('isLeap').addEventListener('change', updateConv);

  /** 입력값을 양력으로 바꾼다. 음력이면 변환, 실패하면 null */
  function toSolar() {
    const y = +$('y').value, m = +$('m').value, d = +$('d').value;
    if (!y || !m || !d) return null;
    if (calMode === 'solar') return { y, m, d };
    if (!window.ChaeksaLunar) return null;
    const r = ChaeksaLunar.lunarToSolar(y, m, d, $('isLeap').checked);
    return r && !r.error ? r : { error: r && r.error ? r.error : '변환할 수 없는 날짜입니다.' };
  }
  function updateConv() {
    const note = $('convNote');
    const y = +$('y').value, m = +$('m').value, d = +$('d').value;
    if (!y || !m || !d) { note.classList.add('hide'); return; }
    if (calMode === 'lunar') {
      const leapM = window.ChaeksaLunar ? ChaeksaLunar.leapMonthOf(y) : null;
      $('leapWrap').classList.toggle('hide', leapM !== m);
      if (leapM !== m) $('isLeap').checked = false;
      const r = toSolar();
      if (!r) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = r.error
        ? `<b style="color:var(--g0-ink)">${r.error}</b>`
        : `음력 ${y}.${m}.${d}${$('isLeap').checked ? ' (윤달)' : ''} → 양력 <b>${r.y}년 ${r.m}월 ${r.d}일</b>`;
    } else {
      if (!window.ChaeksaLunar) { note.classList.add('hide'); return; }
      const l = ChaeksaLunar.solarToLunar(y, m, d);
      if (!l) { note.classList.add('hide'); return; }
      note.classList.remove('hide');
      note.innerHTML = `양력 ${y}.${m}.${d} → 음력 <b>${l.year}년 ${l.leap ? '윤' : ''}${l.month}월 ${l.day}일</b>`;
    }
  }

  // ───── 온보딩 ─────
  function readForm() {
    const noTime = $('noTime').checked;
    const sol = toSolar();
    if (!sol) { alert('생년월일을 입력해 주세요.'); return null; }
    if (sol.error) { alert(sol.error); return null; }
    const p = { name: $('name').value.trim() || '당신', year: sol.y, month: sol.m, day: sol.d,
      calendar: calMode, lunarInput: calMode === 'lunar' ? { y: +$('y').value, m: +$('m').value, d: +$('d').value, leap: $('isLeap').checked } : null,
      hour: noTime ? null : ($('hh').value === '' ? null : +$('hh').value), minute: noTime ? 0 : +($('mi').value || 0),
      gender: $('g').value, solarCorrection: $('solar').checked };
    const pl = window.ChaeksaPlaces ? ChaeksaPlaces.resolve($('place').value) : null;
    if (pl) { p.place = $('place').value; p.placeName = pl.name; p.longitude = pl.lon; p.tzOffset = pl.tzOffset; }
    if (!p.year || !p.month || !p.day) { alert('생년월일을 입력해 주세요.'); return null; }
    if (p.year < 1900 || p.year > 2100 || p.month < 1 || p.month > 12 || p.day < 1 || p.day > 31) { alert('날짜를 다시 확인해 주세요.'); return null; }
    return p;
  }
  $('btnGo').onclick = () => {
    const p = readForm(); if (!p) return;
    localStorage.setItem(KEY, JSON.stringify(p));
    localStorage.setItem('chaeksa.profileAt', new Date().toISOString());
    if (People()) {
      const id = People().add({ name: p.name, relation: '나', isSelf: true, birth: p });
      People().setActive(id);
      start(People().toProfile(People().active()));
    } else start(p);
    if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
  };
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
    $('landing').classList.add('hide'); $('formCard').classList.add('hide');
    $('btnSettings').classList.remove('hide');
    $('app').classList.remove('hide'); $('nav').classList.remove('hide');
    $('subtitle').textContent = `${nim()}의 명리비서`;
    renderPeopleBtn();
    renderToday(); renderMe(); renderCal(); renderPartners(); renderChat();
    if (window.ChaeksaConsult) { ChaeksaConsult.renderHome(); refreshConsultBadge(); }
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
    try { const t = await AI.dailyBrief(R, today); box.className = 'brief'; box.textContent = t; collapseRuleCard(true); }
    catch (e) {
      box.className = 'brief';
      if (e.blocked) {
        collapseRuleCard(false);                       // 규칙 브리핑을 펼쳐서 계속 쓸 수 있게 한다
        box.innerHTML = `<div class="gate"><b>${esc(e.blocked.title)}</b><p>${esc(e.blocked.body)}</p>`
          + (e.blocked.cta ? `<button class="btn kakao" id="gateLogin"><span>💬</span>${esc(e.blocked.cta)}</button>` : '')
          + `</div>`;
        const g = $('gateLogin');
        if (g) g.onclick = () => { try { ChaeksaCloud.signInWith('kakao'); } catch (err) { openSettings(); } };
      } else {
        box.innerHTML = `<span style="color:var(--ink3);font-size:14px">AI 브리핑을 가져오지 못했어요: ${esc(e.message)}</span>`;
      }
    }
  }
  $('btnAiBrief').onclick = () => openSettings();
  function collapseRuleCard(on) {
    const card = $('brief').closest('.card'), h = card.querySelector('h2');
    if (!on) { $('brief').classList.remove('hide'); h.textContent = '흐름 읽기'; h.onclick = null; return; }
    $('brief').classList.add('hide'); h.textContent = '계산 근거 보기 ▸'; h.style.cursor = 'pointer';
    h.onclick = () => { const open = $('brief').classList.toggle('hide'); h.textContent = open ? '계산 근거 보기 ▸' : '계산 근거 ▾'; };
  }

  // ───── 6차원 적층 체용 ─────
  function renderChaeyong() {
    const box = $('cyStack'); if (!box || !window.ChaeksaChaeyong) return;
    const cy = ChaeksaChaeyong.stack(R, today);
    box.innerHTML = cy.layers.map(l => {
      const cls = l.value > 0.3 ? 'up' : (l.value < -0.3 ? 'dn' : 'mid');
      const w = Math.min(100, Math.abs(l.value) / 3 * 100);
      return `<div class="cy ${l.level === 1 ? 'base' : cls}">
        <div class="cy-h"><span class="cy-lv">${l.level}</span><b>${esc(l.name)}</b>
          <span class="gz">${esc(l.ganji)}</span>
          ${l.god ? `<span class="cy-god">${esc(l.god)}</span>` : ''}
          <span class="cy-sign ${cls}">${esc(l.sign)}${l.level > 1 ? (l.value > 0 ? ' +' : ' ') + l.value : ''}</span></div>
        ${l.level > 1 ? `<div class="cy-bar"><i style="width:${w}%"></i></div>` : ''}
        <p>${esc(l.note || '')}</p>
      </div>`;
    }).join('');
    const t = $('cyTurn');
    const parts = [`총합 <b>${cy.sum > 0 ? '+' : ''}${cy.sum}</b> — ${cy.sum > 1 ? '전체적으로 흐름이 돕는 쪽' : (cy.sum < -1 ? '전체적으로 눌리는 쪽' : '한쪽으로 기울지 않은 상태')}입니다.`];
    if (cy.turns.length) parts.push(`흐름이 뒤집히는 지점: <b>${cy.turns.map(x => `${x.from} → ${x.to}`).join(', ')}</b>. 이 층에서 체감이 달라집니다.`);
    if (cy.shifted) parts.push(`층을 지나며 일간이 <b>${cy.natalStrength} → ${cy.finalStrength}</b>으로 옮겨갑니다.`);
    t.innerHTML = parts.join(' ');
  }

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
    const plName = profile.placeName || '서울';
    const bornNote = $('bornNote');
    if (bornNote) bornNote.innerHTML = `${plName} 출생 기준 · 진태양시 보정 ${profile.solarCorrection === false ? '안 함' : '함'} · 보정된 시각 <b>${R.corrected.y}.${R.corrected.m}.${R.corrected.d} ${String(R.corrected.hh).padStart(2,'0')}:${String(R.corrected.mm).padStart(2,'0')}</b>`;
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
    renderProfileCard();
    renderShareCard();
    renderChaeyong();
  }
  let shareReady = false;
  async function renderShareCard() {
    if (shareReady) return;
    try { await ChaeksaShare.draw($('shareCanvas'), R, nim()); shareReady = true; }
    catch (e) { $('shareCanvas').closest('.card').classList.add('hide'); }
  }
  $('btnShare').onclick = async () => {
    await renderShareCard();
    try { await ChaeksaShare.share($('shareCanvas'), profile.name); } catch (e) {}
  };
  $('btnSaveImg').onclick = async () => {
    await renderShareCard();
    ChaeksaShare.save($('shareCanvas'), profile.name);
  };
  async function renderProfileCard() {
    let card = $('aiProfile');
    if (!card) { card = document.createElement('section'); card.className = 'card'; card.id = 'aiProfile'; $('daeun').closest('.card').before(card); }
    const cached = AI.getProfile(R);
    if (cached) { card.innerHTML = `<h2>비서의 원국 해석 (고정)</h2><div class="brief" style="font-size:15px">${mdLite(cached)}</div>`; return; }
    if (!AI.ready()) { card.innerHTML = `<h2>비서의 원국 해석</h2><p class="hint">AI 비서를 연결하면 원국을 한 번 정밀 분석해 고정 기준으로 씁니다.</p>`; return; }
    card.innerHTML = `<h2>비서의 원국 해석</h2><div class="brief loading">원국을 정밀 분석하는 중… (처음 한 번만, 30초쯤)</div>`;
    try { const t = await AI.buildProfile(R, today); card.innerHTML = `<h2>비서의 원국 해석 (고정)</h2><div class="brief" style="font-size:15px">${mdLite(t)}</div>`; }
    catch (e) { card.innerHTML = `<h2>비서의 원국 해석</h2><p class="hint">분석 실패: ${e.message}</p>`; }
    if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
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
  function renderPartners() {
    const P = People(); if (!P || !$('cPick')) return;
    const me = P.active();
    if ($('compatMe')) $('compatMe').textContent = me ? me.name : '';
    const list = P.list().filter(p => !me || p.id !== me.id);
    $('cPick').innerHTML = list.length
      ? list.map(p => `<option value="${p.id}">${esc(p.name)} · ${esc(p.relation)}</option>`).join('')
      : '<option value="">등록된 사람이 없습니다</option>';
    $('btnCompat').disabled = !list.length;
  }
  $('btnCompat').onclick = () => {
    const P = People(), id = $('cPick').value;
    if (!id) return;
    const p = P.get(id); if (!p) return;
    showCompat(P.toProfile(p));
  };
  $('btnCompatAdd').onclick = () => openPersonForm(null);

  async function showCompat(you0) {
    const you = E.calc(you0), res = ChaeksaCompat.analyze(R, you);
    const meName = esc(profile.name), youName = esc(you0.name || '상대');
    const box = $('compatResult'); box.classList.remove('hide');
    box.innerHTML = `<h2>${meName} \u221e ${youName}</h2>
      <div class="score"><b>${res.score}</b><span>/ 100 · ${youName}님은 내게 <b style="font-size:14px;color:var(--ink)">${res.godText}</b></span></div>
      <div class="pillars" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
        <div class="pillar"><div class="t">${meName}</div><div class="han ${elemClass(R.pillars.day.stem, true)}">${f.pillar(R.pillars.day)}</div></div>
        <div class="pillar"><div class="t">${youName}</div><div class="han ${elemClass(you.pillars.day.stem, true)}">${f.pillar(you.pillars.day)}</div></div></div>
      <div class="brief" style="font-size:15px"><p>${esc(res.stemRel.text)}</p>${res.branchRels.map(b => `<p>${esc(b.text)}</p>`).join('')}${res.notes.map(n => `<p style="color:var(--ink2)">${esc(n)}</p>`).join('')}</div>
      <div id="compatAi" class="brief" style="margin-top:14px;font-size:15px"></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (AI.ready()) {
      const ai = $('compatAi');
      ai.className = 'brief loading'; ai.textContent = '비서가 두 사람을 읽는 중…';
      try {
        ai.textContent = await AI.compatText(R, you, res, today);
        ai.className = 'brief'; ai.style.borderTop = '1px solid var(--line)'; ai.style.paddingTop = '12px';
      } catch (e) { ai.textContent = ''; }
    }
  }

  // ───── 비서 채팅 ─────
  let history = [];
  const SUGGEST = ['이번 주 흐름 어때?', '지금 대운에서 내가 집중할 건?', '이직 고민 중인데 시기가 어때?', '내 사주에서 제일 큰 강점은?', '요즘 사람 관계가 힘든데 왜 그럴까?'];
  function renderChat() {
    try { history = JSON.parse(localStorage.getItem(HK())) || []; } catch (e) { history = []; }
    const box = $('msgs');
    box.innerHTML = history.length ? history.map(m => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${esc(m.content)}</div>`).join('') : `<div class="msg a">안녕하세요, ${nimSafe()}. 저는 ${nimSafe()}의 사주를 전부 알고 있는 책사예요. 고민이든 궁금한 거든 편하게 물어보세요.</div>`;
    $('suggest').innerHTML = SUGGEST.map(s => `<button>${s}</button>`).join('');
    $('suggest').querySelectorAll('button').forEach(b => b.onclick = () => { $('q').value = b.textContent; ask(); });
    const ok = AI.ready();
    $('q').disabled = $('btnAsk').disabled = !ok;
    $('chatHint').innerHTML = ok ? '' : '설정에서 API 키를 넣으면 비서가 답합니다. <a href="#" id="openSet" style="color:var(--accent)">설정 열기</a>';
    const a = $('openSet'); if (a) a.onclick = (e) => { e.preventDefault(); openSettings(); };
    box.scrollTop = 1e9;
  }
  // esc 는 위(15행)에 정의되어 있다 — 채팅 표시에도 같은 것을 쓴다
  async function ask() {
    const q = $('q').value.trim(); if (!q) return;
    $('q').value = '';
    const box = $('msgs');
    box.insertAdjacentHTML('beforeend', `<div class="msg u">${esc(q)}</div><div class="msg t" id="typing">비서가 생각 중…</div>`); box.scrollTop = 1e9;
    $('btnAsk').disabled = true;
    try {
      const a = await AI.chat(R, today, history, q);
      history.push({ role: 'user', content: q }, { role: 'assistant', content: a });
      localStorage.setItem(HK(), JSON.stringify(history.slice(-30)));
      $('typing').outerHTML = `<div class="msg a">${esc(a)}</div>`;
    } catch (e) { $('typing').outerHTML = `<div class="msg t">답을 가져오지 못했어요: ${esc(e.message)}</div>`; }
    $('btnAsk').disabled = false; box.scrollTop = 1e9;
  }
  $('btnAsk').onclick = ask;
  $('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(); });

  // ───── 설정 ─────
  const TIER_NOTE = {
    quality:  '모든 답을 가장 좋은 모델로 만듭니다. 브리핑 1회에 약 28원.',
    balanced: '매일 브리핑은 가벼운 모델, 상담·대화는 중간 모델, 원국 해석만 가장 좋은 모델로. 브리핑 1회에 약 5원. <b>권장</b>',
    thrifty:  '대부분을 가벼운 모델로. 문장이 다소 단조로워질 수 있습니다.',
  };
  function renderTier() {
    const seg = $('tierSeg'); if (!seg) return;
    const t = (AI.settings().tier) || 'balanced';
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tier === t));
    $('tierNote').innerHTML = TIER_NOTE[t] || '';
  }
  function renderUsage() {
    const box = $('usageBox'); if (!box || !window.ChaeksaUsage) return;
    const U = ChaeksaUsage, p = U.plan();
    const rows = [['brief', '오늘 브리핑'], ['chat', '비서와 대화'], ['consult', '심층 상담'], ['profile', '원국 해석'], ['compat', '궁합 해설']];
    box.innerHTML = `<p class="hint" style="margin:0 0 8px">이번 달 사용량 · 등급 <b>${U.PLANS[p].label}</b></p>`
      + rows.map(([k, name]) => {
          const lim = U.limit(k), use = U.used(k);
          const w = lim ? Math.min(100, use / lim * 100) : 0;
          return `<div class="ub"><span>${name}</span><i><b style="width:${w}%"></b></i><span>${use}/${lim || '—'}</span></div>`;
        }).join('')
      + `<p class="hint">${U.period() === 'life' ? '무료 체험분입니다(평생 기준).' : '매달 1일에 새로 열립니다.'}
         만세력·원국·대운·택일·궁합 점수와 규칙 기반 브리핑은 <b>한도 없이</b> 쓰실 수 있습니다.</p>`;
  }
  function openSettings() {
    renderCloud();
    renderTier();
    renderUsage(); const s = AI.settings(); $('apiKey').value = s.apiKey || ''; $('proxyUrl').value = s.proxyUrl || ''; $('settings').classList.remove('hide'); }
  $('btnSettings').onclick = openSettings;
  if ($('tierSeg')) $('tierSeg').querySelectorAll('button').forEach(b => b.onclick = () => {
    const s = AI.settings();
    AI.saveSettings(Object.assign({}, s, { tier: b.dataset.tier, model: '' }));
    renderTier();
    Object.keys(localStorage).filter(k => k.startsWith('chaeksa.brief.')).forEach(k => localStorage.removeItem(k));
  });
  $('btnCloseSettings').onclick = () => $('settings').classList.add('hide');
  $('btnSaveSettings').onclick = () => {
    const cur = AI.settings();
    AI.saveSettings({ apiKey: $('apiKey').value.trim(), tier: cur.tier || 'balanced', proxyUrl: $('proxyUrl').value.trim() });
    $('settings').classList.add('hide');
    if (R) { Object.keys(localStorage).filter(k => k.startsWith('chaeksa.brief.') || k.startsWith('chaeksa.profile.ai.')).forEach(k => localStorage.removeItem(k)); loadAiBrief(); renderChat(); renderProfileCard(); }
  };
  $('btnReset').onclick = () => { if (confirm('내 정보, 대화, 저장된 사람을 모두 지웁니다. 계속할까요?')) { [KEY, PKEY].forEach(k => localStorage.removeItem(k)); Object.keys(localStorage).filter(k => k.startsWith('chaeksa.brief.') || k.startsWith('chaeksa.profile.ai.')).forEach(k => localStorage.removeItem(k)); location.reload(); } };

  // ───── 랜딩 ─────
  function showLanding() {
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    $('lpGanji').textContent = f.pillar(tf.day) + '일';
    $('lpGanjiKo').textContent = f.pillarKo(tf.day) + ' · ' + f.stemElem(tf.day.stem) + '의 날';
    $('formCard').classList.add('hide');
    $('landing').classList.remove('hide');
    $('btnSettings').classList.add('hide');
  }
  function showForm() {
    $('landing').classList.add('hide');
    $('formCard').classList.remove('hide');
    $('btnSettings').classList.remove('hide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('btnStart').onclick = showForm;
  $('btnStart2').onclick = showForm;

  // ───── 외부 브리지 (consult.js에서 사용) ─────
  window.ChaeksaApp = {
    result: () => R,
    profile: () => profile,
    today: () => today,
    refreshConsultBadge,
  };
  function refreshConsultBadge() {
    const dot = $('consultDot');
    if (!dot || !window.ChaeksaConsult) return;
    dot.classList.toggle('hide', ChaeksaConsult.openCount() === 0);
  }

  // ───── 서버 동기화 ─────
  const Cloud = () => window.ChaeksaCloud;
  function cloudMsg(t, ok) {
    const el = $('cloudMsg'); if (!el) return;
    el.classList.toggle('hide', !t); el.innerHTML = t || '';
    el.style.color = ok ? 'var(--accent)' : 'var(--ink3)';
  }
  function renderCloud() {
    const C = Cloud(); if (!C || !$('cloudBox')) return;
    if (!C.enabled()) {
      $('cloudBox').innerHTML = '<label style="margin-top:0">기기 간 동기화</label><p class="hint">아직 준비 중입니다. 지금은 이 기기에만 저장됩니다.</p>';
      return;
    }
    const inn = C.signedIn();
    $('cloudOut').classList.toggle('hide', inn);
    $('cloudIn').classList.toggle('hide', !inn);
    const pb = $('btnPurge'), pn = $('purgeNote');
    if (pb) pb.classList.toggle('hide', !inn);
    if (pn) pn.classList.toggle('hide', !inn);
    if (inn) {
      $('cloudWho').textContent = C.email() || '로그인됨';
      const at = localStorage.getItem('chaeksa.sync');
      $('cloudWhen').textContent = at ? ' · 마지막 동기화 ' + new Date(at).toLocaleString('ko-KR') : '';
    }
  }
  async function cloudSync(showMsg) {
    const C = Cloud(); if (!C || !C.signedIn()) return;
    try {
      if (showMsg) cloudMsg('동기화 중…');
      const r = await C.pull();   // 서버 것과 병합 (더 최신인 쪽이 남는다)
      await C.push();             // 병합 결과를 다시 올린다
      renderCloud();
      if (showMsg) cloudMsg('동기화했습니다.', true);
      if (r.changed) {
        const saved = localStorage.getItem(KEY);
        if (saved) { try { start(JSON.parse(saved)); } catch (e) {} }
      }
    } catch (e) { if (showMsg) cloudMsg('동기화 실패: ' + e.message); }
  }
  function wireCloud() {
    const C = Cloud(); if (!C || !C.enabled()) { renderCloud(); return; }
    const bk = $('btnKakao'), bg = $('btnGoogle'), bm = $('btnMail'),
          bs = $('btnSyncNow'), bo = $('btnLogout');
    if (bk) bk.onclick = () => { try { C.signInWith('kakao'); } catch (e) { cloudMsg(e.message); } };
    if (bg) bg.onclick = () => { try { C.signInWith('google'); } catch (e) { cloudMsg(e.message); } };
    if (bm) bm.onclick = async () => {
      const v = $('loginEmail').value.trim();
      if (!v) { $('loginEmail').focus(); return; }
      cloudMsg('메일 보내는 중…');
      try { await C.sendMagicLink(v); cloudMsg('메일을 보냈습니다. 링크를 눌러주세요.', true); }
      catch (e) { cloudMsg(e.message); }
    };
    if (bs) bs.onclick = () => cloudSync(true);
    if (bo) bo.onclick = () => { C.signOut(); renderCloud(); cloudMsg('로그아웃했습니다.'); };
    const bp = $('btnPurge');
    if (bp) bp.onclick = async () => {
      if (!confirm('서버에 저장된 원국·상담 기록과 계정을 모두 지웁니다.\n되돌릴 수 없습니다. 계속할까요?')) return;
      if (!confirm('정말 삭제하시겠습니까? 마지막 확인입니다.')) return;
      cloudMsg('삭제 중…');
      try {
        await C.deleteAccount();
        [KEY, PKEY, 'chaeksa.consults'].forEach(k => localStorage.removeItem(k));
        Object.keys(localStorage).filter(k => k.startsWith('chaeksa.')).forEach(k => localStorage.removeItem(k));
        alert('모두 삭제했습니다.');
        location.href = location.pathname;
      } catch (e) { cloudMsg('삭제 실패: ' + e.message); }
    };
    renderCloud();
  }

  // ───── PWA ─────
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

  // ───── 시작 ─────
  // 로그인 후 돌아온 경우 토큰을 먼저 받아둔다
  if (window.ChaeksaCloud && ChaeksaCloud.enabled()) {
    const came = ChaeksaCloud.captureRedirect();
    if (came) ChaeksaCloud.me().catch(() => {});
  }
  wireCloud();

  initPlace();
  wirePeople();
  if (People()) People().migrate();
  const saved = localStorage.getItem(KEY);
  if (saved) { try { const sp = JSON.parse(saved); if (sp.place && $('place')) { $('place').value = sp.place; updatePlaceNote(); } } catch (e) {} }
  let booted = false;
  const act = People() ? People().active() : null;
  if (act) { start(People().toProfile(act)); booted = true; }
  else if (saved) { try { start(JSON.parse(saved)); booted = true; } catch (e) { localStorage.removeItem(KEY); } }
  if (!booted) showLanding();
  // 서버에 저장된 게 있으면 가져온다 (없으면 조용히 넘어간다)
  if (window.ChaeksaCloud && ChaeksaCloud.signedIn()) cloudSync(false);
})();
