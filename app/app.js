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
    renderToday(); renderMe(); renderCal(); renderPartners(); renderChat(); renderHome();
    if (window.ChaeksaConsult) { ChaeksaConsult.renderHome(); refreshConsultBadge(); }
    go('home');
  }

  // ───── 홈 — 타일과 가운데 만세력 ─────
  function renderHome() {
    const a = R.analysis;
    // 만세력 4기둥 (원국 탭과 같은 그리기, 지장간·십신은 줄여서)
    const order = [['hour','시주'],['day','일주'],['month','월주'],['year','연주']];
    $('hmPillars').innerHTML = order.map(([k, label]) => {
      const pl = R.pillars[k];
      if (!pl) return `<div class="pillar"><div class="t">${label}</div><div class="han" style="color:var(--ink3)">?</div><div class="ko">시간 모름</div></div>`;
      return `<div class="pillar ${k === 'day' ? 'day' : ''}"><div class="t">${label}</div>
        <div class="han ${elemClass(pl.stem, true)}">${f.stem(pl.stem)}</div><div class="ko">${f.stemKo(pl.stem)}</div>
        <div class="han ${elemClass(pl.branch, false)}" style="margin-top:4px">${f.branch(pl.branch)}</div><div class="ko">${f.branchKo(pl.branch)}</div></div>`;
    }).join('');
    const ec = a.elemCount, EL5 = ['목','화','토','금','수'];
    $('hmMeta').innerHTML = `<b>${nim()}</b> · ${f.stem(a.dayStem)} 일간 · <b>${a.strength}</b> ${a.strengthScore}
      · ${ec.map((n,i)=>`${EL5[i]}${n}`).join(' ')}${a.missing.length ? ` · 빈 오행 <b>${a.missing.join('·')}</b>` : ''}`;
    // 사람 전환 칩 — 만세력이 프로필을 갈아끼우는 자리다
    const P = People();
    const list = P ? P.list() : [];
    const act = P && P.active();
    $('hmPeople').innerHTML = list.map(x =>
      `<button data-pid="${x.id}" class="${act && x.id === act.id ? 'on' : ''}">${esc(x.name)}</button>`).join('')
      + `<button data-pid="__add">＋</button>`;
    $('hmPeople').querySelectorAll('button').forEach(b => b.onclick = () => {
      if (b.dataset.pid === '__add') { openPeople(); return; }
      P.setActive(b.dataset.pid);
      start(P.toProfile(P.active()));
    });
    // 타일 미리보기
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    $('tiTodayGz').textContent = f.pillar(tf.day);
    $('tiMeStr').textContent = ChaeksaBrief.MZ.STEM[a.dayStem].nick;
    $('tiMeStr').style.fontSize = '17px';
  }
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => go(b.dataset.open));

  // ───── 오늘 ─────
  function renderToday() {
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const du = E.currentDaeun(R, today);
    const WD = ['일','월','화','수','목','금','토'];
    $('todayLabel').textContent = `${today.getMonth() + 1}월 ${today.getDate()}일 ${WD[today.getDay()]}요일`;
    $('todayGanji').innerHTML = `<span>올해 <b>${f.pillar(tf.year)}</b></span><span>이달 <b>${f.pillar(tf.month)}</b></span><span>오늘 <b>${f.pillar(tf.day)}</b></span>` + (du ? `<span>대운 <b>${f.pillar(du)}</b></span>` : '');
    const b = ChaeksaBrief.today(R, tf, du, today);
    // 히어로 — 오늘의 간지와 주도하는 기운
    $('hdGanji').textContent = f.pillar(tf.day);
    $('hdGod').textContent = b.godDay || '―';
    // 오늘 할 하나 — 카드에서 꺼내 지시로 세운다
    $('actText').textContent = String(b.action || '').replace(/^\s*👉\s*/, '');
    // 흐름 읽기 — 근거만 남긴다
    $('brief').innerHTML = b.paragraphs.map(t => `<p>${t}</p>`).join('');
    renderCoord();
    renderHours();
    // 이번 주
    const wk = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const sc = C.scoreDay(R, d.getFullYear(), d.getMonth() + 1, d.getDate(), 'all');
      wk.push(`<div class="wd ${i === 0 ? 'today' : ''}">${WD[d.getDay()]} ${d.getDate()}<b>${f.pillar(sc.tf.day)}</b>${sc.god}<i class="g${sc.grade}"></i></div>`);
    }
    $('week').innerHTML = wk.join('');
    // AI 브리핑
    loadAiBrief();
  }

  // 오늘의 시간대 — 12시진 곡선. 用값을 막대 높이로, 십신을 사건 라벨로 바꾼다.
  let hoursData = null;
  function renderHours() {
    const box = $('hours'), card = $('hoursCard');
    if (!box || !window.ChaeksaChaeyong || !ChaeksaChaeyong.hourCurve) { if (card) card.classList.add('hide'); return; }
    let hc;
    try { hc = ChaeksaChaeyong.hourCurve(R, today); }
    catch (e) { card.classList.add('hide'); return; }
    if (!hc.rows.length) { card.classList.add('hide'); return; }
    card.classList.remove('hide');
    hoursData = hc;
    const MAX = 3;
    box.innerHTML = hc.rows.map((r, i) => {
      const h = Math.max(3, Math.round(Math.abs(r.value) / MAX * 34));
      const up = r.value >= 0;
      const cls = r.value > 0.3 ? 'up' : (r.value < -0.3 ? 'dn' : '');
      return `<button class="hr ${cls} ${i === hc.nowIndex ? 'now' : ''}" data-i="${i}"
        aria-label="${esc(r.range)}시 ${esc(r.jin)}시 ${esc(r.god)} ${esc(r.label)}">
        <span class="col"><span class="bar ${up ? 'u' : 'd'}" style="height:${h}px"></span></span>
        <span class="jin">${esc(r.jin)}</span></button>`;
    }).join('');
    $('hoursSub').textContent = hc.peak.value > 0.3
      ? `가장 센 때 ${hc.peak.jin}시 · 시계 ${hc.peak.clockRange}` : '오늘은 큰 기복이 없습니다';
    box.querySelectorAll('.hr').forEach(b => b.onclick = () => pickHour(+b.dataset.i));
    pickHour(hc.nowIndex >= 0 ? hc.nowIndex : hc.rows.indexOf(hc.peak));
  }
  function pickHour(i) {
    if (!hoursData || !hoursData.rows[i]) return;
    const r = hoursData.rows[i];
    $('hours').querySelectorAll('.hr').forEach(b => b.classList.toggle('sel', +b.dataset.i === i));
    const sgn = r.value > 0 ? '+' : '';
    $('hoursPick').innerHTML =
      `<span class="t">${esc(r.jin)}시 · 시계 ${esc(r.clockRange)}</span>`
      + `<span class="g">${esc(r.ganji)} ${esc(r.god)}</span>`
      + `<span class="g">${esc(r.sign)} ${sgn}${r.value}</span>`
      + `<span class="d">${esc(r.label)}</span>`;
  }

  // 진태양시 보정을 켠 것과 끈 것을 나란히 보여준다.
  // 시각 보정은 이 서비스가 다른 곳과 갈리는 지점이라, 묻기 전에 먼저 보여준다.
  function renderSolarCompare(profile) {
    const box = $('solarCmp'); if (!box) return;
    if (profile.noTime || profile.hour == null || profile.hour === '') { box.classList.add('hide'); return; }
    let on, off;
    try {
      on  = E.calc(Object.assign({}, profile, { solarCorrection: true,  tzOffset: null }));
      off = E.calc(Object.assign({}, profile, { solarCorrection: false, tzOffset: 9 }));
    } catch (e) { box.classList.add('hide'); return; }
    box.classList.remove('hide');
    const KEYS = ['year','month','day','hour'], NAMES = { year:'연주', month:'월주', day:'일주', hour:'시주' };
    const diff = KEYS.filter(k => f.pillar(on.pillars[k]) !== f.pillar(off.pillars[k]));
    const c = on.corrected;
    const clock = `${String(profile.hour).padStart(2,'0')}:${String(profile.minute || 0).padStart(2,'0')}`;
    const solar = `${String(c.hh).padStart(2,'0')}:${String(c.mm).padStart(2,'0')}`;
    if (!diff.length) {
      box.innerHTML = `<div class="sc-head"><b>시각 보정</b><span>시계 ${clock} → 실제 태양시 ${solar}</span></div>
        <p class="sc-same">이 생시는 보정을 넣어도 사주가 같습니다. 경계에서 멀리 있다는 뜻입니다.</p>`;
      return;
    }
    const reasons = [];
    const y = +profile.year, mo = +profile.month, d = +profile.day;
    const n = y * 10000 + mo * 100 + d;
    if ((y === 1987 && n >= 19870510 && n <= 19871011) || (y === 1988 && n >= 19880508 && n <= 19881009))
      reasons.push('서머타임 시행 중 (−1시간)');
    if (n >= 19540321 && n <= 19610809) reasons.push('당시 한국 표준시가 지금과 달랐음 (−30분)');
    const lon = profile.longitude;
    if (lon) reasons.push(`${plNameOf(profile)} 경도 보정 (−${Math.round((135 - lon) * 4)}분)`);
    box.innerHTML = `
      <div class="sc-head"><b>시각 보정으로 ${diff.map(k => NAMES[k]).join('·')}가 바뀝니다</b>
        <span>시계 ${clock} → 실제 태양시 ${solar}</span></div>
      <div class="sc-grid">
        <div class="sc-col off"><div class="t">보정 안 함</div>
          ${KEYS.map(k => `<span class="${diff.includes(k) ? 'hit' : ''}">${f.pillar(off.pillars[k])}</span>`).join('')}
          <div class="s">${off.analysis.strength}</div></div>
        <div class="sc-col on"><div class="t">진태양시 보정</div>
          ${KEYS.map(k => `<span class="${diff.includes(k) ? 'hit' : ''}">${f.pillar(on.pillars[k])}</span>`).join('')}
          <div class="s">${on.analysis.strength}</div></div>
      </div>
      ${reasons.length ? `<ul class="sc-why">${reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      ${off.analysis.strength !== on.analysis.strength
        ? `<p class="sc-note">일간의 강약 판정도 <b>${off.analysis.strength}</b>에서 <b>${on.analysis.strength}</b>로 달라집니다.</p>` : ''}
      <p class="hint">책사는 보정한 쪽으로 계산합니다. 바꾸시려면 위 이름 옆 ▾ → 고치기에서 끄실 수 있습니다.</p>`;
  }
  function plNameOf(p) { return p.placeName || '서울'; }

  // 통변좌표 — 6층 적층 체용이 내놓는 오늘의 좌표
  function renderCoord() {
    const box = $('coordBox'); if (!box) return;
    if (!window.ChaeksaChaeyong) { box.classList.add('hide'); return; }
    let cy;
    try { cy = ChaeksaChaeyong.stack(R, today); }
    catch (e) { box.classList.add('hide'); return; }
    const live = cy.layers.filter(l => l.level > 1 && typeof l.value === 'number');
    if (!live.length) { box.classList.add('hide'); return; }
    box.classList.remove('hide');
    const v = Math.round((live.reduce((a, l) => a + l.value, 0) / live.length) * 10) / 10;
    const sign = v > 0.3 ? '순(順)' : (v < -0.3 ? '역(逆)' : '평(平)');
    const pct = Math.min(50, Math.abs(v) / 3 * 50);
    const fill = v >= 0
      ? `left:50%;width:${pct}%`
      : `right:50%;width:${pct}%`;
    const chain = live.map(l => `${l.name} ${l.ganji}`).join(' · ');
    box.innerHTML = `
      <div class="c-row">
        <div class="k">오늘의 통변좌표</div>
        <div class="v">${v > 0 ? '+' : ''}${v.toFixed(1)}</div>
        <div class="s">${sign}</div>
      </div>
      <div class="gauge"><div class="mid"></div><div class="fill" style="${fill}"></div></div>
      <div class="scale"><div>역 −3</div><div>순 +3</div></div>
      <div class="chain">${esc(live.length + 1)}층 적층 · ${esc(chain)}</div>`;
  }

  async function loadAiBrief() {
    const box = $('aiBrief'), cta = $('aiBriefCta');
    const stale = $('hdGate'); if (stale) stale.remove();
    if (!AI.ready()) { heroFallback(); cta.classList.remove('hide'); return; }
    cta.classList.add('hide');
    box.className = 'hd-lede loading'; box.textContent = '비서가 오늘을 읽는 중…';
    try { const t = await AI.dailyBrief(R, today); box.className = 'hd-lede'; box.textContent = t; const c = $('hdFresh'); if (c) c.textContent = 'AI 비서'; collapseRuleCard(true); }
    catch (e) {
      box.className = 'hd-lede';
      if (e.blocked) {
        collapseRuleCard(false);                       // 규칙 브리핑을 펼쳐서 계속 쓸 수 있게 한다
        heroFallback();                                // 히어로에는 읽을 문장을 남긴다
        box.insertAdjacentHTML('afterend', `<div class="hd-gate" id="hdGate"><b>${esc(e.blocked.title)}</b><p>${esc(e.blocked.body)}</p>`
          + (e.blocked.cta ? `<button class="btn kakao" id="gateLogin"><span>💬</span>${esc(e.blocked.cta)}</button>` : '')
          + `</div>`);
        const g = $('gateLogin');
        if (g) g.onclick = () => { try { ChaeksaCloud.signInWith('kakao'); } catch (err) { openSettings(); } };
      } else {
        collapseRuleCard(false);
        heroFallback();
        // 저희 쪽 사정이면 사용자에게 실패를 떠넘기지 않는다
        const note = e.serverSide ? esc(e.message)
                                  : `AI 브리핑을 가져오지 못했어요 · ${esc(e.message)}`;
        box.insertAdjacentHTML('beforeend', `<span class="hd-note">${note}</span>`);
        if (e.detail) try { console.warn('[chaeksa] AI 오류 상세:', e.detail); } catch (_) {}
      }
    }
  }
  // AI를 못 쓸 때도 히어로는 비지 않는다 — 규칙 엔진의 첫 문장을 세운다
  function heroFallback() {
    const box = $('aiBrief');
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const b = ChaeksaBrief.today(R, tf, E.currentDaeun(R, today), today);
    box.className = 'hd-lede';
    box.textContent = (b.paragraphs && b.paragraphs[0]) ? String(b.paragraphs[0]).replace(/<[^>]+>/g, '') : '';
    const chip = $('hdFresh'); if (chip) chip.textContent = '규칙 엔진';
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
  // 한입 카드 — 원국 풀이를 다섯 장으로 분해한 것. 문장은 brief.js의 MZ 자산.
  function renderMzDeck() {
    const a = R.analysis, du = E.currentDaeun(R, today);
    const MZ = ChaeksaBrief.MZ;
    const EL5 = ['목','화','토','금','수'];
    const stem = MZ.STEM[a.dayStem];
    const st = MZ.STRENGTH[a.strength] || MZ.STRENGTH['중화'];
    const ec = a.elemCount, mx = Math.max(...ec, 1);
    const top = EL5[ec.indexOf(Math.max(...ec))];
    // 시즌 — 지금 대운이 몇 번째인지, 천간 십신으로 구간의 결을 잡는다
    let season = '';
    if (du) {
      const n = R.daeun.list.findIndex(x => x.stem === du.stem && x.branch === du.branch) + 1;
      const god = E.TEN_GODS[E.tenGod(a.dayStem, du.stem)];
      season = `<div class="mzcard"><div class="mk">지금 시즌</div>
        <div class="mb">인생 ${n}번째 시즌</div>
        <div class="ms">${du.startAge}~${du.endAge}세 · ${f.pillar(du)}<br><b>${god}</b> — ${MZ.SEASON[god] || ''}</div></div>`;
    }
    $('mzDeck').innerHTML = `
      <div class="mzcard"><div class="mk">나의 본캐</div>
        <div class="mb">${stem.nick}</div>
        <div class="ms">${f.stem(a.dayStem)} ${f.stemKo(a.dayStem)} 일간 · ${stem.one}</div>
        <div class="mtags">${stem.tags.map(t => `<span>${t}</span>`).join('')}</div></div>
      <div class="mzcard"><div class="mk">스탯창</div>
        ${EL5.map((el, i) => `<div class="stat"><b class="e-${el}">${el}</b>
          <div class="bar"><i class="f-${el}" style="width:${Math.round(ec[i] / mx * 100)}%"></i></div>
          <span class="n">${ec[i]}</span></div>`).join('')}
        <div class="ms" style="margin-top:2px">주력 스탯 <b>${top}</b>${a.missing.length ? ` · 히든퀘스트 <b>${a.missing.join('·')} 채우기</b>` : ' · 다 갖춘 밸런스'}</div></div>
      <div class="mzcard"><div class="mk">에너지 타입</div>
        <div class="mb">${st.nick} ${st.emoji}</div>
        <div class="ms">${st.desc}</div></div>
      <div class="mzcard"><div class="mk">부스터</div>
        <div class="mb">${a.yongCandidates.join(' · ')}</div>
        <div class="ms">나를 채워주는 기운이에요.<br>${a.yongCandidates.map(el => MZ.BOOST[el]).filter(Boolean).join('<br>')}</div></div>
      ${season}`;
  }

  // 사주 법정 — 죄목은 전부 계산에서 나온다. 문장은 brief.js의 ROAST 자산.
  function renderCourt() {
    const a = R.analysis, p2 = R.pillars;
    const list = ['year','month','day','hour'].filter(k => p2[k]);
    const br = list.map(k => p2[k].branch);
    const GRP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
    // 천간 + 지지 정기의 십신을 센다 (일간 자신 제외)
    const gods = [];
    list.forEach(k => {
      if (k !== 'day') gods.push(E.TEN_GODS[E.tenGod(a.dayStem, p2[k].stem)]);
      gods.push(E.TEN_GODS[E.tenGod(a.dayStem, E.HIDDEN[p2[k].branch][0])]);
    });
    const cnt = (g) => gods.filter(x => GRP[x] === g).length;
    const has = (n) => gods.includes(n);
    let chung = 0;
    for (let i = 0; i < br.length; i++) for (let j = i + 1; j < br.length; j++)
      if (((br[j] - br[i] + 12) % 12) === 6) chung++;
    const inSet = (set) => br.filter(b => set.includes(b)).length;
    const ec = a.elemCount;
    const de = E.STEM_ELEM[a.dayStem];
    const root = br.filter(b => E.HIDDEN[b].some(h => E.STEM_ELEM[h] === de)).length;
    let flow = 0;
    for (let st2 = 0; st2 < 5; st2++) { let n = 0; for (let i = 0; i < 5; i++) { if (ec[(st2 + i) % 5] > 0) n++; else break; } flow = Math.max(flow, n); }

    const hit = {
      재다신약: a.strength === '신약' && cnt('재성') >= 3,
      관살혼잡: has('정관') && has('편관'),
      상관견관: has('상관') && has('정관'),
      비겁과다: cnt('비겁') >= 3,
      인성과다: cnt('인성') >= 3,
      식상과다: cnt('식상') >= 3,
      도화: inSet([0,3,6,9]) >= 2,
      역마: inSet([2,5,8,11]) >= 2,
      화개: inSet([1,4,7,10]) >= 3,
      다충: chung >= 2,
      신강비겁: a.strength === '신강' && cnt('비겁') >= 2,
      신약무인성: a.strength === '신약' && cnt('인성') === 0,
      무화: ec[1] === 0, 무수: ec[4] === 0, 무토: ec[2] === 0, 무금: ec[3] === 0, 무목: ec[0] === 0,
    };
    const charges = ChaeksaBrief.ROAST.filter(r => hit[r.key]).slice(0, 4);
    const mercy = flow >= 5 ? '유통' : a.missing.length === 0 ? '구족' : root >= 3 ? '통근' : a.strength === '중화' ? '중화' : '기본';
    const mercyText = ChaeksaBrief.MERCY.find(m => m.key === mercy).text;
    const $v = $('verdict');
    if (!charges.length) {
      $v.innerHTML = `<div class="vh"><div class="no">판결</div><div class="tt">무혐의</div></div>
        <div class="vb"><div class="mercy">이 법정이 뒤져봤지만 잡아낼 죄목이 없습니다.
        이렇게 무난하게 균형 잡힌 사주가 오히려 드뭅니다. 석방.</div></div>`;
      return;
    }
    $v.innerHTML = `
      <div class="vh"><div class="no">사주법원 제${(a.dayStem + 1)}형사부 · 사건번호 ${R.solarYear}고단${f.pillar(p2.day)}</div>
        <div class="tt">${nimSafe()}의 원국에 대한 판결</div></div>
      <div class="vb">
        ${charges.map((c, i) => `<div class="chg"><div class="ct"><em>죄목 ${i + 1}</em>${c.title}</div><div class="cx">${c.text}</div></div>`).join('')}
        <div class="mercy"><b>양형 이유</b> — ${mercyText}</div>
        <div class="foot">선고: 종신형 (사주는 평생 유지됩니다) · 항소 불가 — 재발급이 안 됩니다<br>
        ※ 재미로 보는 과장 해석입니다. 진지한 풀이는 아래에 있습니다.</div>
      </div>`;
  }

  function renderMe() {
    const a = R.analysis, du = E.currentDaeun(R, today);
    renderMzDeck();
    $('btnVerdict').onclick = () => { renderCourt(); $('verdict').classList.remove('hide'); $('btnVerdict').textContent = '다시 봐도 유죄'; };
    $('verdict').classList.add('hide'); $('btnVerdict').textContent = '판결 받기';
    // 유형 카드 뽑기 — 첫 뽑기 때 표본을 만들고(몇 초, 그게 드럼롤이다) 캐시한다
    $('gachaWrap').classList.add('hide'); $('btnGacha').textContent = '카드 뽑기';
    $('btnGacha').onclick = () => {
      const T = window.ChaeksaTypecard; if (!T) return;
      $('btnGacha').disabled = true;
      $('gachaProg').classList.remove('hide');
      $('gachaProg').textContent = '전국 표본과 대조하는 중…';
      T.buildSample(
        (r) => { $('gachaProg').textContent = `전국 표본과 대조하는 중… ${Math.round(r * 100)}%`; },
        (sample) => {
          const c = T.mine(R, sample);
          $('gachaProg').classList.add('hide');
          $('gachaSvg').innerHTML = c.svg;
          // 애니메이션 재시작
          const fl = $('gachaFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = '';
          $('gachaWrap').classList.remove('hide');
          $('gachaNote').textContent = c.rar && c.rar.unique
            ? `표본 ${c.rar.n.toLocaleString()}명 중 이 유형은 당신뿐입니다 · ${c.tier}`
            : `등급 ${c.tier} · 같은 사주는 언제나 이 카드입니다`;
          $('btnGacha').disabled = false; $('btnGacha').textContent = '다시 뽑아도 이 카드';
          $('btnGachaShare').onclick = async () => {
            const b = $('btnGachaShare'); b.disabled = true; b.textContent = '만드는 중…';
            try {
              const shared = await window.ChaeksaTypecard.share(c.svg, `${c.gyeok.name}격_${c.tier || ''}`);
              b.textContent = shared ? '자랑 완료!' : '저장했어요';
            } catch (e) { b.textContent = '다시 시도'; }
            b.disabled = false;
            setTimeout(() => { b.textContent = '카드 자랑하기'; }, 2500);
          };
        });
    };
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
    renderSolarCompare(profile);
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
  // 원가는 '내 키'를 넣은 사람에게만 뜻이 있다. 책사 서버를 쓰는 사람에게는
  // 미터기가 되어 사용을 억누르고, 나중에 값을 매길 때 원가가 기준이 되어버린다.
  const TIER_NOTE = {
    quality:  '모든 답을 가장 깊이 읽는 모델로 만듭니다. 문장이 길고 근거를 자세히 답니다.',
    balanced: '매일 브리핑은 가볍게, 상담·대화는 중간, 원국 해석만 가장 깊이. <b>권장</b>',
    thrifty:  '짧고 빠르게 답합니다. 문장이 다소 단조로워질 수 있습니다.',
  };
  const TIER_COST = { quality: '브리핑 1회 약 28원', balanced: '브리핑 1회 약 5원', thrifty: '브리핑 1회 약 5원' };
  function renderTier() {
    const seg = $('tierSeg'); if (!seg) return;
    const st = AI.settings();
    const t = st.tier || 'balanced';
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tier === t));
    // 자기 키를 넣었다면 자기 돈이 나가므로 원가를 반드시 알려준다
    const own = !!st.apiKey;
    $('tierNote').innerHTML = (TIER_NOTE[t] || '')
      + (own ? ` <span style="color:var(--ink3)">내 키 사용 중 · ${TIER_COST[t]}</span>` : '');
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
    renderUsage(); const s = AI.settings(); $('apiKey').value = s.apiKey || ''; $('proxyUrl').value = s.proxyUrl || ''; $('settings').classList.remove('hide');
    // 키를 넣거나 지우면 원가 안내가 바로 따라온다
    $('apiKey').oninput = () => {
      const own = !!$('apiKey').value.trim();
      const note = $('tierNote'); if (!note) return;
      const t = (AI.settings().tier) || 'balanced';
      note.innerHTML = (TIER_NOTE[t] || '')
        + (own ? ` <span style="color:var(--ink3)">내 키 사용 중 · ${TIER_COST[t]}</span>` : '');
    };
  }
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
  $('btnReset').onclick = () => {
    if (!confirm('내 정보, 대화, 저장된 사람을 모두 지웁니다. 계속할까요?')) return;
    // 데이터는 전부 지우고, 데이터가 아닌 것만 남긴다.
    //   auth      로그인 세션 — "이 기기에서만 지우기"는 로그아웃이 아니다
    //   usage·usageLife  AI 한도 — 지우면 이 버튼이 한도 우회 수단이 된다
    //   theme·ai·trackAt 화면 취향, 프록시 설정, 방문 카운터 스로틀
    // 키 목록을 나열해서 지우면 새 키가 생길 때마다 여기서 또 빠뜨린다.
    // (예전 코드가 정확히 그 버그였다 — 사람 목록 키가 생긴 뒤에도 옛 키만 지웠다)
    const KEEP = ['chaeksa.auth', 'chaeksa.usage', 'chaeksa.usageLife', 'chaeksa.theme', 'chaeksa.ai', 'chaeksa.trackAt'];
    Object.keys(localStorage)
      .filter(k => k.startsWith('chaeksa.') && !KEEP.includes(k))
      .forEach(k => localStorage.removeItem(k));
    location.reload();
  };

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

  // ───── 아침 푸시 알림 ─────
  // 구독은 이 기기와 푸시 서비스 사이의 일이라 로그인이 필요 없다.
  // 서버(push_subs)에는 endpoint만 가고, 문구는 sw.js가 만든다.
  async function pushReg() { return navigator.serviceWorker.ready; }
  function pushKey() {
    const s = (window.CHAEKSA_VAPID || '').replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(s), c => c.charCodeAt(0));
  }
  async function pushRpc(fn, args) {
    const CFG = window.CHAEKSA_SUPABASE;
    await fetch(CFG.url + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: CFG.anonKey, 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
  }
  async function wirePush() {
    const btn = $('btnPush'), hint = $('pushHint'), row = $('pushRow');
    if (!btn) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      // 아이폰은 홈 화면에 추가한 뒤에만 알림이 된다 — 안내만 남긴다
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (ios && !window.matchMedia('(display-mode: standalone)').matches) {
        btn.style.display = 'none';
        if (hint) hint.textContent = '아이폰은 공유 버튼 → "홈 화면에 추가" 후에 아침 알림을 켤 수 있습니다.';
      } else if (row) row.style.display = 'none';
      return;
    }
    const paint = async () => {
      const sub = await (await pushReg()).pushManager.getSubscription();
      btn.textContent = sub ? '아침 알림 끄기' : '아침 알림 받기';
      return sub;
    };
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const reg = await pushReg();
        const cur = await reg.pushManager.getSubscription();
        if (cur) {
          await pushRpc('push_unsubscribe', { p_endpoint: cur.endpoint });
          await cur.unsubscribe();
          if (hint) hint.textContent = '알림을 껐습니다. 언제든 다시 켤 수 있습니다.';
        } else {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            if (hint) hint.textContent = '브라우저에서 알림이 차단되어 있습니다. 주소창의 자물쇠에서 허용으로 바꿔주세요.';
            return;
          }
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: pushKey() });
          const j = sub.toJSON();
          await pushRpc('push_subscribe', { p_endpoint: sub.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
          if (hint) hint.textContent = '내일 아침 7시 30분부터 알려드립니다.';
        }
      } catch (e) {
        if (hint) hint.textContent = '알림 설정에 실패했습니다: ' + e.message;
      } finally {
        btn.disabled = false;
        paint().catch(() => {});
      }
    };
    paint().catch(() => {});
  }
  wirePush();

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
