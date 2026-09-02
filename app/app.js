/* 책사 앱 UI v1 */
(function () {
  'use strict';
  const E = ChaeksaEngine, f = E.fmt, C = ChaeksaCalendar, AI = ChaeksaAI;
  const $ = (id) => document.getElementById(id);
  const KEY = 'chaeksa.profile', PKEY = 'chaeksa.partners';
  const HK = () => 'chaeksa.chat.' + (profile && profile.id ? profile.id : 'solo');
  // let 이다 — 앱을 열어둔 채 날이 바뀔 수 있다. 오늘·달력 탭에 들어올 때 다시 읽는다.
  let today = new Date();
  let profile = null, R = null;
  const elemClass = (i, isStem) => 'e-' + (isStem ? f.stemElem(i) : f.branchElem(i));
  // 이름을 안 적으신 분은 「공주님」이다. 옛 프로필에 '공주님'이 저장돼 있을 수
  // 있어 둘 다 대체 이름으로 읽는다.
  // 옛 프로필에는 대체 이름이 '당신'으로 저장돼 있다. 둘 다 대체 이름으로 읽는다.
  // ※ 일괄 치환이 이 검사를 먹어 두 갈래가 똑같아진 적이 있다(2026-08-30) —
  //   그러면 옛 손님이 「당신님」으로 불린다. 여기 '당신'은 치환하면 안 된다.
  const nim = () => (profile.name === '공주님' || profile.name === '당신')
    ? '공주님' : profile.name + '님';
  const nimSafe = () => esc(nim());
  const god = (stem) => E.TEN_GODS[E.tenGod(R.analysis.dayStem, stem)];

  // 아주 가벼운 마크다운: **굵게**, 줄바꿈만 (LLM 서술 표시용)
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  // 받침 조사 — 표(讀)는 typecard 한 벌뿐이다. 여기서 또 만들면 반드시 어긋난다.
  // 한자 뒤에 「戊이」 「癸과」를 박아 두었던 자리가 실제로 있었다(3000판 18건).
  const 조 = (s, 있, 없) => {
    const T = window.ChaeksaTypecard;
    return (T && T.조) ? T.조(s, 있, 없) : 있;
  };
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
    const meta = $('metaTheme'); if (meta) meta.setAttribute('content', night ? '#161433' : '#f6f3f4');
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
  let pendingPick = null;    // 방금 추가한 사람 — 공범 선택칸에 미리 골라둔다

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
    $('pfRel').value = p ? p.relation : (P.list().length ? '그 사람' : '나');
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
    $('pfGUnknown').checked = !!b.genderUnknown;
    $('pfG').disabled = $('pfGUnknown').checked;
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
      gender: $('pfG').value, genderUnknown: $('pfGUnknown').checked, solarCorrection: true,
      calendar: pfCal,
      lunarInput: pfCal === 'lunar' ? { y: +$('pfY').value, m: +$('pfM').value, d: +$('pfD').value, leap: $('pfLeap').checked } : null,
    };
    if (pl) { birth.place = $('pfPlace').value; birth.placeName = pl.name; birth.longitude = pl.lon; birth.tzOffset = pl.tzOffset; }
    const rel = $('pfRel').value;
    const name = $('pfName').value.trim() || (rel === '나' ? '공주님' : '이름 없음');
    if (editingId) {
      P.update(editingId, { name, relation: rel, birth, isSelf: rel === '나' });
    } else {
      // 사람을 추가해도 보던 프로필은 그대로 둔다 — 첫 사람일 때만 people.js가 활성화한다
      pendingPick = P.add({ name, relation: rel, isSelf: rel === '나' || !P.list().length, birth });
    }
    $('personForm').classList.add('hide');
    $('peopleSheet').classList.add('hide');
    if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
    if (!R || (editingId && editingId === P.activeId())) start(P.toProfile(P.active()));
    else { renderPeopleBtn(); renderPartners(); renderHome(); }
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
    // 성별을 모르면 고를 수 없게 막는다 — 찍어놓고 아는 척하는 것보다 낫다
    $('pfGUnknown').onchange = (e) => { $('pfG').disabled = e.target.checked; };
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
  /** 첫 만남의 예. 열 사람이 자리에 앉는 것을 보여 드리고 물러난다.
   *  처음 사주를 넣으신 그 한 번만 뜬다. 아무 데나 누르면 바로 건너뛴다. */
  function 착석(끝나면) {
    let 닫힘 = false;
    const 닫기 = () => {
      if (닫힘) return; 닫힘 = true;
      try { document.removeEventListener('keydown', 키); } catch (e) {}
      if (막) { 막.classList.add('out'); setTimeout(() => { try { 막.remove(); } catch (e) {} }, 420); }
      try { 끝나면(); } catch (e) {}
    };
    let 막 = null;
    try {
      const 덜 = matchMedia('(prefers-reduced-motion: reduce)').matches;
      막 = document.createElement('div');
      막.className = 'seatin' + (덜 ? ' still' : '');
      막.innerHTML = '<div class="si-in">'
        + '<p class="si-k">책사단이 자리에 앉습니다</p>'
        + '<div class="si-row">'
        + 오늘의책사.map(([k, 이름], i) =>
            '<span class="si-m" style="animation-delay:' + (0.12 + i * 0.11).toFixed(2) + 's">'
            + '<span class="si-face"><img src="art/chaeksa-' + k + '.webp" alt="" '
            + 'onerror="this.remove()">'
            + '<span class="si-seal">' + esc(책사인장[이름] || 이름.slice(0, 1)) + '</span></span>'
            + '<span class="si-name">' + esc(이름of(이름)) + '</span></span>').join('')
        + '</div>'
        + '<p class="si-hail">' + esc(nim()) + ', 기다리고 있었습니다.</p>'
        + '<p class="si-skip">아무 데나 누르시면 넘어갑니다</p>'
        + '</div>';
      막.onclick = 닫기;
      document.body.appendChild(막);
    } catch (e) { 닫기(); return; }
    const 키 = () => 닫기();
    document.addEventListener('keydown', 키);
    // 붙잡지 않는다. 열 사람이 앉고 인사 한 줄이면 끝이다.
    setTimeout(닫기, matchMedia('(prefers-reduced-motion: reduce)').matches ? 1400 : 3400);
  }

  function readForm() {
    const noTime = $('noTime').checked;
    const sol = toSolar();
    if (!sol) { alert('생년월일을 입력해 주세요.'); return null; }
    if (sol.error) { alert(sol.error); return null; }
    const p = { name: $('name').value.trim() || '공주님', year: sol.y, month: sol.m, day: sol.d,
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
    // 첫 만남의 예 — 처음 사주를 넣으신 이 한 번만. 홈은 이미 뒤에 다 그려져 있다.
    try {
      if (!localStorage.getItem('chaeksa.seatin')) {
        localStorage.setItem('chaeksa.seatin', '1');
        착석(() => {});
      }
    } catch (e) {}
  };
  $('noTime').onchange = (e) => { $('hh').disabled = $('mi').disabled = e.target.checked; };

  // ───── 탭 ─────
  // 원국을 넣은 적이 있는가. 없으면 탭들이 담긴 #app 자체가 hide 라 탭만 켜도 안 보인다.
  const hasProfile = () => !!((People() && People().active()) || localStorage.getItem(KEY));

  // 결제 이력을 한 번이라도 제대로 받았는가. 못 받았으면 탭을 옮길 때마다 다시 묻는다.
  let 결제이력받음 = false;

  function go(tab) {
    // 원국 없는 방문자가 '← 홈'을 누르면 빈 홈이 아니라 안내 화면으로 돌아가야 한다
    if (tab === 'home' && !hasProfile()) { $('app').classList.add('hide'); showLanding(); return; }
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('hide', t.dataset.tab !== tab));
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.go === tab));
    window.scrollTo({ top: 0 });
    // 결제 이력 조회가 부팅 때 한 번 실패하면(네트워크·토큰 갱신) 그 세션 내내
    // 「산 게 없음」이었다 — 어제 2만원 낸 손님이 무료 화면을 보고 또 결제한다.
    // 탭을 옮길 때 조용히 다시 물어보고, 그제서야 산 게 나오면 이 탭을 다시 그린다.
    if (window.ChaeksaPay && !결제이력받음) {
      try {
        ChaeksaPay.paidLoad().then(rows => {
          if (!rows) return;                       // 또 실패했다. 다음 탭에서 다시.
          결제이력받음 = true;
          if (!rows.length) return;
          inyeonFor = null; lsFor = null; msFor = null; dohwaFor = null;
          // 조회가 늦게 돌아오는 사이 다른 화면으로 가 계실 수 있다.
          // 그때 go(tab) 을 부르면 보고 계신 화면을 끄고 도로 끌어온다.
          const el = document.querySelector('.tab[data-tab="' + tab + '"]');
          if (el && !el.classList.contains('hide')) go(tab);
        }).catch(() => {});
      } catch (e) {}
    }
    // 시각을 다시 읽는다. 「지금」 표시와 오늘 간지가 로드 시각에 얼어 있었다.
    if (tab === 'today' || tab === 'cal') {
      const 전날 = today.toDateString();
      today = new Date();
      if (tab === 'today') { try { renderToday(); } catch (e) {} }
      if (tab === 'cal') { try { renderCal(); } catch (e) {} }
      // 날이 바뀌었으면 홈도 다시 — 오늘의 책사와 얼빡이 날마다 도는 자리다.
      if (전날 !== today.toDateString()) { try { renderHome(); } catch (e) {} }
    }
    if (tab === 'nokpae') renderNokpae();
    if (tab === 'dohwa') renderDohwa();
    if (tab === 'ganmyeong') renderGanmyeong();
    if (tab === 'lovestory') renderLoveStory();
    if (tab === 'moneystory') renderMoneyStory();
    if (tab === 'inyeon') renderInyeon();
    if (tab === 'naepyeon') renderNaepyeon();
    if (tab === 'jichim') renderJichim();
    if (tab === 'jikcheop') renderJikcheop();
    if (tab === 'life') renderLife();
    if (tab === 'year') renderYear();
    if (tab === 'memo') renderMemo();
    if (tab === 'taekil') wireTaekil();
  }
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => go(b.dataset.go));

  // 주소 뒤 #탭이름 으로 바로 들어올 수 있게 한다. taekil.html 같은 바깥 페이지에서
  // '상담 신청하기'를 눌렀을 때 홈으로 떨어지면 버튼 문구와 어긋난다.
  // 없는 탭 이름이 오면 아무것도 안 한다 — 빈 화면을 띄우느니 홈이 낫다.
  // 사주 없이도 읽을 수 있는 탭. 나머지는 원국이 있어야 그려진다.
  const NO_PROFILE_TABS = ['taekil'];

  function goHash(booted) {
    const t = (location.hash || '').replace(/^#/, '');
    if (!t || !document.querySelector('.tab[data-tab="' + t + '"]')) return;
    // 검색으로 들어오는 사람은 프로필이 없다. taekil.html 의 '상담 신청하기'가
    // #taekil 로 보내는데 랜딩이 뜨면 버튼이 안 먹는 것과 같다.
    if (!booted && NO_PROFILE_TABS.indexOf(t) < 0) return;
    if (!booted) {
      // 탭은 #app 안에 있고 원국이 없으면 #app 이 hide 다. 랜딩을 접고 그 자리를 내준다.
      $('landing').classList.add('hide');
      $('formCard').classList.add('hide');
      $('app').classList.remove('hide');
    }
    go(t);
  }
  window.addEventListener('hashchange', () => goHash(!!(People() && People().active())));
  // 초기 호출은 파일 끝에서 한다. 여기서 부르면 go() 가 renderNokpae() 등을 타는데
  // 그 함수들이 쓰는 const 가 아직 선언 전이라 TDZ 오류가 난다.

  // ───── 시작 ─────
  function start(p) {
    if (!p.name) p.name = '공주님';
    profile = p; R = E.calc(p);
    $('landing').classList.add('hide'); $('formCard').classList.add('hide');
    $('btnSettings').classList.remove('hide');
    $('app').classList.remove('hide'); $('nav').classList.remove('hide');
    $('subtitle').textContent = `${nim()}의 책사단`;
    renderPeopleBtn();
    renderToday(); renderMe(); renderCal(); renderPartners(); renderHome();
    go('home');
  }

  // ───── 총평 — 로그인·입력 직후 제일 먼저 보는 카드 ─────
  // 순서가 전략이다: 총평(구조) → 결함 → 과거(본인이 검증) → 현재 → 미래는 결제.
  // 과거를 맞힌 잣대가 미래를 잰다는 사실을 화면에 적는다 — 스토리 틀 그대로.
  let chongFor = null;
  // ── 첫 화면 = 간명서 (2026-08-29 「문진 말고 특장점 창을 띄워야지」) ──
  // 간명서가 구워지는 약 1분 동안, 이 간명이 왜 다른지 다섯 장을 순차로 보여준다.
  // 문진은 뺐다 — 신뢰 각인은 사람을 시험하는 게 아니라 우리를 설명하는 걸로.
  function renderChong() {
    const el = $('chong'); if (!el) return;
    const T = window.ChaeksaTypecard;
    if (!T || !T.간명자료 || !profile) { el.classList.add('hide'); return; }
    const 캐시 = 간명캐시();
    const state = String(R) + '|' + !!캐시;
    if (chongFor === state) return;
    chongFor = state;
    el.classList.remove('hide');
    if (캐시) {
      el.innerHTML = `${장면()}<p class="hero-eyebrow">${esc(nim())}을 위한 첫 의논</p><div id="chongGm"></div>`;
      mountGanmyeong($('chongGm'), 'home');
      return;
    }
    // 자동 굽기 금지(2026-08-30 「켤 때마다 굽는데… 클릭으로 바꾸던가」) —
    // 앱을 여는 것만으로 돈이 나가면 안 된다. 버튼이 방아쇠다.
    // 기다리는 동안 보여주는 말. 예전에는 우리가 얼마나 엄정한지를 다섯 장에 걸쳐
    // 늘어놓았다 — 절기 시각, 원문 판본, 자기검증 서른 가지. 그건 만든 사람이
    // 자랑하고 싶은 것이지 공주님이 보러 온 것이 아니다(2026-08-31 「우린 여성향 사이트 그뿐」).
    // 기각 목록의 「명리 용어를 전문성의 증거로 전면에」가 정확히 이 자리였다.
    // 이제 **곧 듣게 될 이야기**를 미리 들려준다.
    const 특 = [
      ['자리에 앉는 중입니다', '법도를 보는 정율, 계절을 보는 온서, 인연을 맡은 연희 — 아홉이 둘러앉고 좌장 태윤이 끝을 맺습니다.'],
      ['먼저 공주님이 어떤 분인지', '타고난 것과 곁에서 보는 모습. 남들이 보는 공주님과 안에서 사시는 공주님이 다를 수도 있습니다.'],
      ['그리고 사랑을 두고', '어떤 사람에게 마음이 기우는지, 곁자리에 어떤 글자가 앉아 있는지. 지나온 해도 함께 짚습니다.'],
      ['갈리면 갈린 채로 올립니다', '열 사람이 같은 사주를 다른 잣대로 봅니다. 맞춰 놓으면 읽은 것이 아니라 달래 드린 것이 됩니다.'],
      ['겁주지 않습니다', '삼재니 대흉이니 하며 불안을 팔지 않습니다. 좋지 않은 자리도 어떻게 지나가면 되는지와 함께 아룁니다.'],
    ];
    el.innerHTML = `${장면()}<p class="hero-eyebrow">${esc(nim())}을 위한 첫 의논</p>
      <p class="pb-lede">열 사람의 책사가 공주님의 사주를 앞에 놓고 둘러앉습니다. 서로 다른 잣대를 들고 있어, 갈리는 자리에서는 갈린 채로 들려드립니다.</p>
      <button class="btn" id="chongBake">의논을 청하겠습니다 — 약 1~2분</button>
      <p class="hint">값을 받지 않는 의논은 한 번뿐입니다.</p>
      <div id="chongFeats"></div>
      <p class="hint hide" id="chongWait">둘러앉는 중…</p>`;
    $('chongBake').onclick = () => {
      $('chongBake').disabled = true;
      $('chongBake').textContent = '의논 중입니다 — 새로고침하지 마시고 잠시만요';
      $('chongWait').classList.remove('hide');
      간명예열();
      const box = $('chongFeats');
      box.insertAdjacentHTML('beforeend', '<p class="pb-lede" style="margin-top:12px">기다리시는 동안 — 이 간명이 다른 곳과 다른 다섯 가지입니다.</p>');
      특.forEach((f, i) => setTimeout(() => { if (!box || !box.isConnected) return;
        box.insertAdjacentHTML('beforeend', `<div class="nx-diag" style="margin-top:10px"><p class="nx-diag-k">${i + 1} · ${f[0]}</p><p>${f[1]}</p></div>`); }, i === 0 ? 0 : i * 6000));
      let sec = 0; const tick = setInterval(() => { const w = $('chongWait');
        if (!w || !w.isConnected) { clearInterval(tick); return; }
        sec += 5; w.textContent = '간명 중… ' + sec + '초'; }, 5000);
    };
  }
  window.renderChongSoon = () => { chongFor = null; renderChong(); };

  // ───── 홈 — 타일과 가운데 만세력 ─────
  function renderHome() {
    renderChong();
    const a = R.analysis;
    // 첫 마디 — 오늘 여기 들어온 사람에게 제일 먼저 할 말
    (function () {
      const M = window.ChaeksaMemo; if (!M || !M.standing || !$('standing')) return;
      const st = M.standing(R, today);
      if (!st) { $('standing').classList.add('hide'); return; }
      $('standing').classList.remove('hide');
      $('standing').className = 'card standing' + (st.눌림 ? ' down' : st.좋음 ? ' up' : '');
      $('stHead').textContent = st.head;
      $('stBody').textContent = st.body;
      $('stMeta').innerHTML = `<span>이달 <b>${esc(st.pillar)}</b></span>`
        + (st.daeun ? `<span>대운 <b>${esc(st.daeun)}</b></span>` : '')
        + `<span>${esc(st.grade)}</span>`;
      // 묻지 않아도 다가오는 것을 먼저 짚는다
      const ah = M.ahead ? M.ahead(R, today) : null;
      $('stAhead').classList.toggle('hide', !ah);
      if (ah) { $('stAheadHead').textContent = ah.head; $('stAheadText').textContent = ' ' + ah.text; }
    })();
    // 타일 미리보기 — 고정 문구는 남의 얘기로 읽힌다. 내 사주에서 나온 사실을 걸되
    // 결론은 감춰서 열어보게 만든다. 표본(1만 명)이 필요한 값은 여기서 쓰지 않는다 —
    // 홈이 표본 굽기를 기다리게 되면 첫 화면이 멈춘다.
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    $('tiTodayGz').textContent = f.pillar(tf.day);
    // ── 홈의 얼굴 (2026-08-30 「양산형 홈페이지 같잖아」) ──
    // 스무 개짜리 균일 타일 그리드는 앱 런처 문법이라 궁정이 되지 않는다.
    // 홈을 하루로 만든다: 오늘의 장면 → 첫 의논 → 오늘 나온 책사 하나.
    // 나머지 타일은 전부 서랍에 넣었다(index.html 의 details.fold).
    // 지어내지 않는다: 이름과 오늘의 간지, 엔진이 낸 값뿐이다.
    let 오늘차례 = 날번호() % 오늘의책사.length;
    let [키0, 이름0, 탭0, 말0] = 오늘의책사[오늘차례];
    let 행동0 = '', 비 = null;
    // 비서(docs/29 둘) — 오늘 이 사람에게 잰 값으로 한 사람이 말한다.
    // 위의 문 안내 문장은 값이 하나도 없을 때만 남는다(엔진이 못 재면 물러난다).
    try {
      비 = (window.ChaeksaDan && ChaeksaDan.오늘) ? ChaeksaDan.오늘(R, today) : null;
      if (비 && 비.말) {
        이름0 = 비.축; 키0 = 책사키[비.축] || 키0; 탭0 = 비.탭 || 탭0; 말0 = 비.말; 행동0 = 비.행동 || '';
        const i = 오늘의책사.findIndex(x => x[0] === 키0); if (i >= 0) 오늘차례 = i;
      }
    } catch (e) {}
    const sc = $('homeScene');
    if (sc) {
      sc.classList.remove('hide');
      // 맞이하는 말이 먼저다 — 사실 통보는 그 다음이다.
      // 「기다리고 있었습니다」는 연출이지 명리 주장이 아니다(판정은 엔진, 전달은 우리 몫).
      // 얼굴이 없으면 얼빡 자리를 비우고 인장만 세운다 — 빈 액자는 두지 않는다.
      sc.innerHTML =
        (window.CHAEKSA_ART
          ? (() => {
              // 얼빡도 날마다 얼굴을 바꾼다 — 변주(-2·-3)는 이미 그려져 있는데 여태
              // 안 쓰이고 있었다. 매일 같은 그림이면 내일 다시 올 이유가 하나 준다.
              // 변주가 없는 책사가 있으므로(궁위·인연·운로는 -3 이 없다) 못 찾으면
              // 대표 그림으로 한 번 물러난다. 빈 액자는 그 다음이다.
              // 그려진 벌만 아는 초상() 이 고른다 — 없는 -3 을 부르고 404 를 맞던 자리다.
              // 그림이 아예 없는 책사(소현)는 빈 문자열이 와서 얼빡을 안 세운다.
              const 파일0 = 초상(키0, 0);
              if (!파일0) return '';
              const 밑 = 얼굴파일(키0, (벌목록(키0)[0] || 1)) + '?v=' + window.CHAEKSA_ART;
              return '<img class="hs-face" alt="" data-base="' + 밑 + '"'
                + ' src="' + 파일0 + '?v=' + window.CHAEKSA_ART + '"'
                + ' onerror="var b=this.dataset.base;'
                + 'if(b){this.removeAttribute(\'data-base\');this.src=b;return;}'
                + 'this.closest(\'.home-scene\').classList.add(\'noface\');this.remove()">';
            })()
          : '')
        + '<div class="hs-veil"></div><div class="hs-body">'
        + '<p class="hs-hail">공주님, 기다리고 있었습니다.</p>'
        + '<p class="hs-name">' + esc(nim()) + '</p>'
        + '<p class="hs-day">오늘은 ' + esc(f.pillar(tf.day)) + '일 — '
        + esc(f.pillarKo(tf.day)) + ' · ' + esc(f.stemElem(tf.day.stem)) + '의 날입니다</p>'
        + '<p class="hs-who">' + esc(이름of(이름0)) + '</p>'
        + '<p class="hs-role">' + esc(직함of(이름0)) + ' · ' + esc(이름0) + '</p>'
        + '<button class="hs-say" type="button">'
        + '<span class="cs-txt">' + esc(말0)
        + (행동0 ? '<span style="display:block;margin-top:6px;opacity:.78;font-size:.92em">' + esc(행동0) + '</span>' : '')
        + '</span><span class="cs-go">▸</span></button>'
        + '<button class="hs-keep" type="button">이 한마디 간직하기</button></div>';
      // 그림 없는 책사가 오늘 차례면 얼빡 자리를 접는다 — 빈 액자를 두지 않는다.
      // (onerror 로 접는 길은 img 를 아예 안 세울 때는 안 지나간다)
      sc.classList.toggle('noface', !sc.querySelector('.hs-face'));
      const b0 = sc.querySelector('.hs-say'); if (b0) b0.onclick = () => go(탭0);
      // 보낼 만한 카드 — 원국 카드는 「내가 어떤 사람인가」의 증거고
      // 이 카드는 「나에게 해 준 말」이다. 남의 대화창에 걸리는 쪽은 뒤쪽이다.
      const bk = sc.querySelector('.hs-keep');
      if (bk) bk.onclick = async () => {
        bk.disabled = true; const 원 = bk.textContent; bk.textContent = '만드는 중…';
        try {
          // 제 캔버스를 그 자리에서 만든다. #shareCanvas 를 같이 쓰면 원국 공유가
          // shareReady 때문에 다시 안 그려서 한마디 카드를 원국이라며 내보낸다.
          const cv = document.createElement('canvas');
          await ChaeksaShare.drawSay(cv, {
            초상: (window.CHAEKSA_ART && 초상(키0, 0)) ? 초상(키0, 0) + '?v=' + window.CHAEKSA_ART : '',
            이름: 이름of(이름0), 직함: 직함of(이름0), 말: 말0,
            공주: nim(), 간지: f.pillar(tf.day) + '일',
          });
          const 이름칸 = nim().replace(/님$/, '');
          const 보냄 = await ChaeksaShare.share(cv, 이름칸, '한마디',
            이름of(이름0) + '이 아뢴 한마디 · chaeksa.kr');
          bk.textContent = 보냄 ? '보냈습니다' : '저장했습니다';
        } catch (e) { bk.textContent = '만들지 못했습니다'; }
        bk.disabled = false;
        setTimeout(() => { bk.textContent = 원; }, 2500);
      };
    }
    // ── 기억 (docs/29 넷) — 지난번 한 말을 들고 있다가 묻는다. 세지 않는다. ──
    // 사람 열쇠는 사람 목록의 id, 없으면 생년월일시·성별. 사람을 바꾸면 기억도 따로다.
    try {
      const M = window.ChaeksaMemo;
      const rm = $('remember');
      if (M && M.said && rm) {
        const P3 = People();
        const pid = (P3 && P3.active()) ? 'p:' + P3.active().id
          : 'b:' + [profile.year, profile.month, profile.day, profile.hour, profile.gender].join('-');
        if (비 && 비.말) M.said(pid, today, 비);
        const ask = M.toAsk(pid, today);
        if (ask) {
          const [yy, mm, dd] = ask.day.split('-').map(Number);
          rm.innerHTML =
            '<p class="hint" style="margin:0 0 6px">지난 ' + mm + '월 ' + dd + '일, '
            + esc(이름of(ask.축)) + '이 이렇게 말씀드렸습니다</p>'
            + '<p style="margin:0 0 10px;line-height:1.62">' + esc(ask.말) + '</p>'
            + '<p style="margin:0 0 8px;font-weight:700">맞으셨나요?</p>'
            + '<div style="display:flex;gap:8px">'
            + '<button class="btn small ghost" type="button" data-ans="yes" style="flex:1;margin:0">맞았어요</button>'
            + '<button class="btn small ghost" type="button" data-ans="no" style="flex:1;margin:0">아니었어요</button>'
            + '<button class="btn small ghost" type="button" data-ans="dunno" style="flex:1;margin:0">모르겠어요</button>'
            + '</div>'
            + '<p class="hint" style="margin:8px 0 0">점수로 세지 않습니다. 저희가 들고 있다가 다음 말에 씁니다.</p>';
          rm.classList.remove('hide');
          rm.querySelectorAll('[data-ans]').forEach(b => b.onclick = () => {
            M.answer(pid, ask.day, b.dataset.ans);
            rm.innerHTML = '<p style="margin:0;line-height:1.62">'
              + (b.dataset.ans === 'yes' ? '기억해 두겠습니다. 맞은 자리는 다음에 한 칸 더 내려가 보겠습니다.'
               : b.dataset.ans === 'no' ? '빗나간 것도 저희 몫입니다. 지우지 않고 그대로 두겠습니다.'
               : '그것도 답입니다. 티가 안 나는 날도 있습니다.') + '</p>';
            setTimeout(() => rm.classList.add('hide'), 2600);
          });
        } else {
          rm.classList.add('hide');
          // 답이 붙은 말이 있으면 맞이하는 말이 그것을 잇는다 — 기억하는 장면은 여기서 난다.
          const la = M.lastAnswered(pid);
          const hail = sc && sc.querySelector('.hs-hail');
          if (la && hail && la.답 !== 'dunno') {
            hail.textContent = la.답 === 'yes'
              ? '지난번 말씀이 맞았다 하셨지요. 오늘도 들고 있었습니다.'
              : '지난번은 빗나갔지요. 그것도 두고 왔습니다.';
          }
        }
      }
    } catch (e) {}
    // 책사단이 도열한다 — 대접의 핵심은 「나를 위해 여럿이 나와 있다」이다.
    // 겸사겸사 서랍에 숨은 화면들의 문이 되기도 한다: 열 사람이 곧 열 개의 문.
    const ev = $('todayEnvoy');
    if (ev) {
      const 오늘 = 오늘차례;
      const 줄 = 오늘의책사.map(([k, 이름], i) =>
        '<button class="cm' + (i === 오늘 ? ' on' : '') + '" type="button" data-i="' + i + '">'
        + '<span class="cm-face"><img src="art/chaeksa-' + k + '.webp" alt="" onerror="this.remove()">'
        + '<span class="cm-seal">' + esc(책사인장[이름] || 이름.slice(0, 1)) + '</span></span>'
        + '<span class="cm-name">' + esc(이름of(이름)) + '</span></button>').join('');
      // 회의 그림을 도열의 배경으로 깐다 — 「떼로 나와 있다」를 여기서 맡는다
      ev.innerHTML = '<section class="corps">'
        + '<div class="corps-bg"></div>'
        + '<p class="corps-k">책사단 열 사람이 나와 있습니다</p>'
        + '<div class="corps-row">' + 줄 + '</div>'
        + '</section>';
      회의장면(u => { const g = ev.querySelector('.corps-bg');
        if (g) { g.style.backgroundImage = 'url("' + u + '")'; g.classList.add('on'); } });
      // data-open 은 시작할 때 한 번만 묶인다 — 나중에 그린 것은 손으로 묶는다
      ev.querySelectorAll('.cm').forEach(b => {
        b.onclick = () => go(오늘의책사[+b.dataset.i][2]);
      });

    }
    $('tiMeStr').textContent = ChaeksaBrief.MZ.STEM[a.dayStem].nick;
    $('tiMeStr').style.fontSize = '17px';
    const T = window.ChaeksaTypecard;
    const set = (id, txt) => { const el = $(id); if (el && txt) el.textContent = txt; };
    // 유형 카드 — 표본을 이미 만들어 뒀으면 **내 등급을 타일에 미리 보여준다.**
    // 「789개 중 하나」는 남 얘기고, 「SSR · 만 개 중 한 개」는 내 얘기다.
    // 표본이 없으면(첫 방문) 기본 문구 그대로 두고, 뽑기 탭에서 만든다.
    if (T && T.cachedSample) try {
      const smp = T.cachedSample();
      if (smp) {
        const m = T.mine(R, smp);
        if (m && m.rar) {
          set('tiGachaBig', '牌 ' + m.rar.tier);
          set('tiGachaSub', m.rar.unique
            ? '사주 만 개를 지어 견주니 같은 카드가 하나도 없습니다'
            : '사주 만 개 가운데 ' + m.rar.count + '개 · ' + m.rar.pct + '%');
        }
      }
    } catch (e) {}
    const P2 = People();
    const others = P2 ? P2.list().filter(x => !P2.active() || x.id !== P2.active().id) : [];
    if (T) {
      try { const jc = T.jichim(R);
        set('tiJcBig', jc.채.map(k => k.오행).join('·'));
        set('tiJcSub', jc.깎[0][0] + ' 지치고 · ' + jc.채.map(k => k.말[0]).join('·') + '으로 채웁니다');
      } catch (e) {}
      try { const np = T.naepyeon(R, today);
        set('tiNpBig', np.결.map(k => k.오행).join('·'));
        // 「자라는 결의 사람」은 은유가 두 겹이라 문 앞에서 뜻이 안 선다. 표의 [3]을 쓴다.
        set('tiNpSub', np.결.map(k => k.사람).join(' · '));
      } catch (e) {}
      try {
        const iy = T.inyeon(R, today.getFullYear(), 10);
        if (iy.첫해) { set('tiInBig', iy.첫해.해 + '년'); set('tiInSub', iy.말 + ' · 열 해 중 가장 가까운 자리'); }
        else set('tiInSub', '앞으로 열 해는 조용한 구간입니다');
      } catch (e) {}
      // 이달 — 시간순 홈의 둘째 줄(docs/29 셋). standing 은 원국 탭의 첫 마디와 같은 값이다.
      try { const M = window.ChaeksaMemo, st = M && M.standing ? M.standing(R, today) : null;
        if (st) { set('tiMonthBig', st.grade);
          // 「5월부터」가 내년 5월이면 해를 붙인다 — 안 붙이면 지난 5월로 읽힌다.
          const 언제 = st.turn ? ((st.turn.y !== today.getFullYear() ? st.turn.y + '년 ' : '') + st.turn.m + '월부터 결이 바뀝니다') : '';
          // 달력을 산 달이면 서른 칸에서 풀리는 날을 그대로 건다 — 산 것이 홈에서 보여야 다시 연다.
          let 줄 = st.head + (언제 ? ' · ' + 언제 : '');
          try {
            if (window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('month') && T.myDays) {
              const v = T.myDays(R, today.getFullYear(), today.getMonth() + 1);
              // myDays 의 「좋은」이 달 안의 최고 띠(평균 3일)라 그대로 건다. 위 셋만 걸던 임시 처방은 걷었다.
              줄 = (v.좋은.length ? '풀리는 날 ' + v.좋은.map(r => r.일).join('·') + '일' : '크게 열리는 날이 없는 달') + ' · ' + st.head;
            }
          } catch (e) {}
          set('tiMonthSub', 줄); } } catch (e) {}
      try { const yf = T.yearFlow(R, today.getFullYear(), today);
        set('tiYearBig', yf.bestTxt);
        set('tiYearSub', yf.kind + ' — ' + (yf.남은표기 ? '남은 달 중 최고' : '올해 최고')); } catch (e) {}
      try { const lc = T.lifeCurve(R, today);
        set('tiLifeBig', lc.kind + '형'); set('tiLifeSub', (lc.지남 && lc.앞최고Txt)
          ? '앞으로 남은 구간 중 ' + lc.앞최고Txt + ' — 곡선으로 보기'
          : '최고 구간 ' + lc.peakTxt + ' — 곡선으로 보기'); } catch (e) {}
      // 배지에 「비겁축」 같은 십신 이름을 찍지 않는다 — 문 앞 간판은 읽히는 말이어야 한다.
      // 부제도 처방이 아니라 위치로(docs/27 아홉). 「맞는 일」은 우리가 정해 주지 않는다.
      // 홈 줄 이름이 「자리가 열리는 해」로 바뀌었다(docs/29 셋 — 시간순). 배지는 그 해, 부제는 위치.
      try { const c = T.career(R, null), y = T.영역해 ? T.영역해(R, today.getFullYear(), 10) : null;
        set('tiJikBig', (y && y.첫해) ? y.첫해.해 + '년' : c.name);
        set('tiJikSub', (y && y.첫해) ? y.말 + ' · ' + c.name + ' 쪽' : '사회 속 어디에 서 계신지'); } catch (e) {}
      try { const l = T.love(R, new Date(), null); // l.key 는 686 유형 코드다 — 앞 두 글자를 그냥 찍으면 공주님께는 「一心」 같은
        // 뜻 없는 내부 코드가 박힌다. 오른쪽 칸은 비워 두고 설명으로 말한다.
        set('tiDoBig', ''); set('tiDoSub', '배우자궁 ' + l.key.slice(2) + ' · 20유형 중 하나'); } catch (e) {}
      try { const w = T.wealth(R, new Date(), null); set('tiNokBig', w.raw.jae === 0 ? '무재' : (w.lines[0] || '').split(' —')[0]); set('tiNokSub', '몇 섬 그릇인지, 상위 몇 %인지'); } catch (e) {}
    }
    // 비망록 배너 — 꺼낼 것이 있으면 그걸 먼저 말한다
    (function () {
      const M = window.ChaeksaMemo; if (!M || !$('memoSub')) return;
      const pid = P2 && P2.active() ? P2.active().id : 'solo';
      const due = M.due(pid, today), next = M.upcoming(pid, today);
      const 미기록 = M.tracks(pid).filter(t => !M.loggedThisMonth(t, today));
      if (미기록.length) {
        $('memoBadge').textContent = '이번 달';
        $('memoTitle').textContent = 미기록[0].q;
        $('memoSub').textContent = '이번 달은 어떤지 눌러만 주세요' + (미기록.length > 1 ? ' (외 ' + (미기록.length - 1) + '건)' : '');
      } else if (due.length) {
        $('memoBadge').textContent = '꺼낼 것';
        $('memoTitle').textContent = due[0].q;
        $('memoSub').textContent = M.label(due[0].ym) + ' — 말씀하신 그때입니다' + (due.length > 1 ? ' (외 ' + (due.length - 1) + '건)' : '');
      } else if (next.length) {
        $('memoBadge').textContent = '비망록';
        $('memoTitle').textContent = next[0].q;
        $('memoSub').textContent = M.label(next[0].ym) + '에 다시 꺼내 드리겠습니다';
      } else {
        $('memoBadge').textContent = '비망록';
        $('memoTitle').textContent = '판단 기록장';
        $('memoSub').textContent = '물어본 것과 그때의 판단을 남겨두면, 그 달이 왔을 때 먼저 알려드립니다';
      }
    })();
    set('tiAccSub', !others.length ? '사람을 한 명 더 등록하면 열립니다'
      : others.length === 1 ? others[0].name + '님과 대조해 보기'
      : others[0].name + ' 외 ' + (others.length - 1) + '명과 대조 가능');
  }
  // data-scroll 이 있으면 탭을 연 뒤 그 자리로 내린다 — 홈 「이달의 나」가 오늘 탭의 달력(#myMonth)으로 간다.
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
    go(b.dataset.open);
    const id = b.dataset.scroll;
    // go() 가 맨 위로 올린 뒤 탭이 그려지는 데 한 박자 걸린다 — 60ms 에 smooth 로 보냈더니
    // 1초 뒤에도 10,000px 위에 있었다. 그려진 다음에 곧장 간다.
    if (id) setTimeout(() => { const el = $(id); if (el) el.scrollIntoView({ block: 'start', behavior: 'auto' }); }, 260);
  });

  // ───── 오늘 ─────
  function renderToday() {
    renderTodayMemo();
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
    mountSuper();
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
    renderMyMonth();
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
    // 「順 +1.2」는 읽어도 아무것도 남지 않는다. 사람 말을 앞에 세우고
    // 원래 표기는 잣대 줄로 내린다 — 지우지 않는다, 기준 공개가 이 서비스의 자산이다.
    const 결말 = r.value > 0.3 ? '나를 돕는 쪽' : (r.value < -0.3 ? '나를 누르는 쪽' : '한쪽으로 기울지 않음');
    $('hoursPick').innerHTML =
      `<span class="t">${esc(r.jin)}시 · 시계 ${esc(r.clockRange)}</span>`
      + `<span class="g">${esc(r.ganji)} ${esc(r.god)}</span>`
      + `<span class="g">${esc(결말)}</span>`
      + `<span class="d">${esc(r.label)}</span>`
      + `<span class="d" style="opacity:.62;font-size:11px">잣대 — 체용 ${esc(r.sign)} ${sgn}${r.value}</span>`;
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

  // ── 슈퍼계정 — 유료 수준 화면을 되단다 ──
  // 체용 카드·통변좌표는 무료 화면에서 걷어냈지만(2026-08-28) 함수와 엔진은 남겼고,
  // DOM 이 없으면 조용히 빠져나가게 되어 있다. 그러니 슈퍼계정이면 DOM 만
  // 다시 만들어주면 그대로 그려진다 — 렌더 코드를 두 벌 만들지 않는다.
  // 등급은 JWT 의 app_metadata.plan 에서 온다(Supabase 서명이라 위조 불가).
  // 켜는 법은 server/schema-9.sql. 화면 DOM 이야 누구나 devtools 로 만들 수 있지만
  // 그래봐야 자기 브라우저에서 계산 결과를 보는 것뿐이고, 돈이 걸린 AI 한도는
  // 서버(ai_usage_bump)가 따로 강제한다.
  function mountSuper() {
    try { if (!window.ChaeksaUsage || ChaeksaUsage.plan() !== 'super') return; } catch (e) { return; }
    if (!$('coordBox')) {
      const cta = $('aiBriefCta');
      if (cta) cta.insertAdjacentHTML('afterend', '<div class="coord" id="coordBox"></div>');
    }
    if (!$('chaeyongCard')) {
      const g = $('gyeokCard');
      if (g) g.insertAdjacentHTML('afterend', `<section class="card" id="chaeyongCard">
        <h2>6차원 적층 체용 <span style="font-size:11px;color:var(--ink3);font-weight:400">상담 전용 · 슈퍼계정에만 보입니다</span></h2>
        <p class="hint" style="margin:0 0 12px">원국 위에 대운·세운·월운·일운·시운을 한 층씩 얹으며, 그때마다 體(나)와 用(들어오는 기운)의 관계를 다시 판정합니다.</p>
        <div id="cyStack"></div>
        <p class="hint" id="cyTurn"></p>
      </section>`);
    }
  }

  // 통변좌표 — 6층 적층 체용이 내놓는 오늘의 좌표
  // 오늘의 통변좌표 — 무료 화면에서는 걷어냈다 (2026-08-28).
  // 「통변좌표」도 「6층 적층」도 일반인이 읽을 말이 아니다.
  // 함수와 엔진은 그대로 둔다. #coordBox 가 없으면 조용히 빠져나간다.
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
    // 앱을 여는 것만으로 원가가 나가면 안 된다. 오늘치가 이미 구워져 있으면 그대로 펴고,
    // 없으면 규칙 엔진의 문장을 세운 뒤 「청하기」를 내민다.
    // (dailyBrief 는 안에서 buildProfile 까지 부르므로 자동으로 두 번이 나갔다.)
    const 구운것 = AI.briefCached ? AI.briefCached(R, today) : null;
    if (!구운것 && !loadAiBrief.청함) {
      heroFallback();
      cta.classList.remove('hide');
      const bb = $('btnAiBrief');
      if (bb) {
        bb.textContent = '좌장에게 오늘을 묻기';
        bb.onclick = () => { loadAiBrief.청함 = true; loadAiBrief(); };
      }
      return;
    }
    cta.classList.add('hide');
    box.className = 'hd-lede loading'; box.textContent = '좌장이 오늘을 읽는 중…';
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
  // 무료 화면에서는 카드를 걷어냈다 (2026-08-28) — 體·用·적층은 일반인이 읽을 말이 아니다.
  // 함수와 엔진(chaeyong.js)은 그대로 둔다. 유료 상담에서 쓴다.
  // #cyStack 이 없으면 여기서 조용히 빠져나간다.
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
    // 총합은 '판이 어떤가'이고 촉발은 '지금 방아쇠가 당겨졌나'다. 둘은 다를 수 있다 —
    // 판은 눌려 있는데 오늘 이 시각에 터지는 경우가 그것이다.
    if (cy.triggerBy) {
      const 세다 = Math.abs(cy.trigger) >= 1.5;
      parts.push(`지금 방아쇠를 당기는 건 <b>${cy.triggerBy}</b>입니다`
        + (cy.trigger > 0 ? ` — 터지면 풀리는 쪽(${'+' + cy.trigger})` : ` — 터지면 눌리는 쪽(${cy.trigger})`)
        + (세다 ? '. 오늘 중 이 시간대를 특히 보세요.' : '.'));
    }
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
      <div class="mzcard"><div class="mk">타고난 바탕</div>
        <div class="mb">${stem.nick}</div>
        <div class="ms">${f.stem(a.dayStem)} ${f.stemKo(a.dayStem)} 일간 · ${stem.one}</div>
        <div class="mtags">${stem.tags.map(t => `<span>${t}</span>`).join('')}</div></div>
      <div class="mzcard"><div class="mk">다섯 기운</div>
        ${EL5.map((el, i) => `<div class="stat"><b class="e-${el}">${el}</b>
          <div class="bar"><i class="f-${el}" style="width:${Math.round(ec[i] / mx * 100)}%"></i></div>
          <span class="n">${ec[i]}</span></div>`).join('')}
        <div class="ms" style="margin-top:2px">가장 두터운 것 <b>${top}</b>${a.missing.length ? ` · 비어 있는 것 <b>${a.missing.join('·')} 채우기</b>` : ' · 다 갖춘 밸런스'}</div></div>
      <div class="mzcard"><div class="mk">기운의 결</div>
        <div class="mb">${st.nick}</div>
        <div class="ms">${st.desc}</div></div>
      <div class="mzcard"><div class="mk">나를 채우는 기운</div>
        <div class="mb">${a.yongCandidates.join(' · ')}</div>
        <div class="ms">이 기운이 오면 힘이 붙습니다.<br>${a.yongCandidates.map(el => MZ.BOOST[el]).filter(Boolean).join('<br>')}</div></div>
      ${season}`;
  }



  function renderMe() {
    const a = R.analysis, du = E.currentDaeun(R, today);
    renderMzDeck();
    // 오늘의 금지령 — 탭 열면 바로 그린다 (매일 콘텐츠는 문턱이 없어야 한다)
    (function renderBan() {
      const T = window.ChaeksaTypecard; if (!T || !T.banToday) return;
      const ban = T.banToday(R);
      $('banSvg').innerHTML = T.drawBan(profile.name || '공주님', ban);
      // 이모지 금지(기각 목록). v355 에서 다 걷었는데 이 한 자리가 남아 있었다.
      $('tiBanGz').textContent = ban.god;
      $('tiBanSub').textContent = ban.관계 ? `오늘은 ${ban.관계}까지 — 금지 ${ban.금지.length}개` : `오늘 금지 ${ban.금지.length}개`;
      $('btnBanShare').onclick = async () => {
        const b = $('btnBanShare'); b.disabled = true; b.textContent = '만드는 중…';
        try {
          const r = await T.share($('banSvg').innerHTML, `금지령_${ban.일진}`);
          b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
        } catch (e) { b.textContent = '다시 시도'; }
        b.disabled = false;
        setTimeout(() => { b.textContent = '금지령 자랑하기'; }, 2500);
      };
    })();

    // 유형 카드 뽑기 — 첫 뽑기 때 표본을 만들고(몇 초, 그게 드럼롤이다) 캐시한다
    $('gachaWrap').classList.add('hide'); $('btnGacha').textContent = '카드 뽑기';
    $('btnGacha').onclick = () => {
      const T = window.ChaeksaTypecard; if (!T) return;
      $('btnGacha').disabled = true;
      $('gachaProg').classList.remove('hide');
      $('gachaProg').textContent = '사주 만 개를 지어 견주는 중…';
      T.buildSample(
        (r) => { $('gachaProg').textContent = `사주 만 개를 지어 견주는 중… ${Math.round(r * 100)}%`; },
        (sample) => {
          const c = T.mine(R, sample);
          $('gachaProg').classList.add('hide');
          $('gachaSvg').innerHTML = c.svg;
          // 애니메이션 재시작
          const fl = $('gachaFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = '';
          $('gachaWrap').classList.remove('hide');
          $('gachaNote').textContent = c.rar && c.rar.unique
            ? `지어낸 사주 ${c.rar.n.toLocaleString()}개 가운데 이 유형은 공주님뿐입니다 · ${c.tier}`
            : `등급 ${c.tier} · 같은 사주는 언제나 이 카드입니다`;
          $('btnGacha').disabled = false; $('btnGacha').textContent = '다시 뽑아도 이 카드';
          // 두 번째 카드 — 지금 대운이 이 사주에 필요한 걸 갖고 왔는가
          $('seasonWrap').classList.add('hide'); $('btnSeason').classList.remove('hide');
          $('btnSeason').onclick = () => {
            const sn = window.ChaeksaTypecard.seasonNow(R);
            $('seasonSvg').innerHTML = window.ChaeksaTypecard.drawSeason(profile.name || '공주님', R, sn);
            const fl2 = $('seasonFlip'); fl2.style.animation = 'none'; void fl2.offsetWidth; fl2.style.animation = '';
            $('seasonWrap').classList.remove('hide');
            $('btnSeason').classList.add('hide');
            const 조합 = (c.tier === 'SSR' || c.tier === 'SR') && (sn.grade.name === '만개' || sn.grade.name === '순풍')
              ? ' — 희귀 유형에 시즌까지 왔습니다. 지금이 그 때입니다'
              : sn.grade.name === '만개' ? ' — 유형과 무관하게, 시즌은 지금이 최고입니다' : '';
            $('seasonNote').textContent = `타고난 카드 ${c.tier} × 지금 시즌 ${sn.grade.name}${조합}`;
            $('btnSeasonShare').onclick = async () => {
              const b = $('btnSeasonShare'); b.disabled = true; b.textContent = '만드는 중…';
              try {
                const r = await window.ChaeksaTypecard.share($('seasonSvg').innerHTML, `시즌_${sn.grade.name}`);
                b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
              } catch (e) { b.textContent = '다시 시도'; }
              b.disabled = false;
              setTimeout(() => { b.textContent = '시즌 자랑하기'; }, 2500);
            };
          };
          $('btnGachaShare').onclick = async () => {
            const b = $('btnGachaShare'); b.disabled = true; b.textContent = '만드는 중…';
            try {
              const r = await window.ChaeksaTypecard.share(c.svg, `${c.gyeok.name}격_${c.tier || ''}`);
              b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
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
      // 충은 안 적는다 — 제23조. branchRel 은 아직 '충'을 돌려주므로 여기서 거른다.
      const g = god(tf.year.stem), rel0 = C.branchRel(R.pillars.day.branch, tf.year.branch);
      const rel = rel0 === '충' ? null : rel0;
      ys.push(`<div class="flow"><div class="gz ${elemClass(tf.year.stem, true)}">${f.pillar(tf.year)}<small>${y}년</small></div><p><b>${g}</b> · ${GOD_FLOW[g]}${rel ? ` <span style="color:var(--ink3)">(일지와 ${rel})</span>` : ''}</p></div>`);
    }
    $('yearly').innerHTML = ys.join('');
    // 월운
    const ms = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 15);
      const tf = E.dateFortune(d.getFullYear(), d.getMonth() + 1, 15);
      const g = god(tf.month.stem), rel1 = C.branchRel(R.pillars.day.branch, tf.month.branch);
      const rel = rel1 === '충' ? null : rel1;   // 충 표기 없음 — 제23조
      ms.push(`<div class="flow"><div class="gz ${elemClass(tf.month.stem, true)}">${f.pillar(tf.month)}<small>${d.getFullYear()}.${d.getMonth() + 1}</small></div><p><b>${g}</b> · ${GOD_FLOW[g]}${rel ? ` <span style="color:var(--ink3)">(${rel})</span>` : ''}</p></div>`);
    }
    $('monthly').innerHTML = ms.join('');
    renderProfileCard();
    renderShareCard();
    renderGyeok();
    mountSuper();
    renderChaeyong();
  }

  // ───── 격국 성패 · 형충회합 · 갈림 (2026-08-28) ─────
  // 엔진이 내는 것을 무료 화면에 그대로 뿌린다.
  // 판정은 넷이고(자평진전 논용신성패구응), 상신을 같이 말한다.
  // 「갈림」은 판정이 사람 손에 넘어가는 자리다 — 숨기지 않고 알린다.
  function renderGyeok() {
    const box = $('gyeokBox'); if (!box) return;
    const card = box.closest('.card');
    const T = window.ChaeksaTypecard, Gk = window.ChaeksaGyeok;
    if (!T || !Gk) { if (card) card.classList.add('hide'); return; }
    let J; try { J = T.gyeok(R); } catch (e) { if (card) card.classList.add('hide'); return; }
    if (!J || !J.판정) { if (card) card.classList.add('hide'); return; }
    if (card) card.classList.remove('hide');

    // 색은 **성패**를 따른다 — 섰다·구제됐다가 성격, 띠었다·깨졌다가 패격이다.
    // 예전엔 판정 이름으로 갈라 띠었다(패격)를 중간색으로, 구제됐다(성격)도 중간색으로 칠했다.
    // 성패는 둘뿐이니 색도 둘이다. 그 안의 결(온전/가까스로/흠 하나/무너짐)은
    // LABEL 의 짧게·풀어서가 말한다 — 색으로 네 칸을 흉내 내면 패격이 성격처럼 보인다.
    const 성패 = (Gk.성패of ? Gk.성패of(J.판정) : '');
    const cls = 성패 === '성격' ? 'ok' : 성패 === '패격' ? 'no' : 'mid';
    // 화면에 쓰는 말은 gyeokguk.js 의 LABEL 한 곳에서만 정한다.
    const L = (Gk.LABEL || {})[J.판정] || { 짧게: J.판정, 풀어서: '' };
    const 근거말 = Gk.근거말 || {};
    const 한줄 = L.풀어서;

    const 근거줄 = [];
    // 조항은 판정키다 — 카드에도 공주님말을 낸다(gyeokguk.js 공주님말표).
    const 읽 = (t) => (Gk.공주님말of ? Gk.공주님말of(t) : t);
    const 붙 = (lb, arr) => { (arr || []).forEach(t => 근거줄.push(
      `<div><span class="lb">${esc(근거말[lb] || lb)}</span><span>${esc(읽(t))}</span></div>`)); };
    const g = J.근거 || {};
    if (J.판정 === '구제됐다') { 붙('깨졌다', g.깨졌다); 붙('구제', g.구제); }
    else { 붙('섰다', g.섰다); 붙('띠었다', g.띠었다); if (!(g.섰다 || []).length) 붙('깨졌다', g.깨졌다); }

    const w = J.잰것 || {};
    const 힘줄 = ['일간', '비겁', '식상', '재성', '관성', '인성']
      .filter(k => w[k] != null)
      .map(k => `${k} <b>${w[k].toFixed(2)}</b>`).join(' · ');

    // 지지의 형충회합 — 순서대로 해소한 결과
    let 관계 = '';
    try {
      const br = E.branchRels(R.pillars);
      const 성 = (br.성립 || []).map(v =>
        `<li>${esc(v.종류)} <b>${esc(v.글자)}</b> <span style="color:var(--ink3)">${esc((v.자리 || []).join('·'))}</span>${v.격지 ? ' <span style="color:var(--accent)">격지</span>' : ''}</li>`);
      const 보 = (br.보류 || []).map(v =>
        `<li class="off">${esc(v.종류)} ${esc(v.글자)} — ${esc(v.사유)}</li>`);
      if (성.length || 보.length) 관계 = `<div class="gk-rel">
        <p class="t">지지의 형충회합 — 삼합 &gt; 육합 &gt; 충 순서로 풀었습니다</p>
        <ul>${성.join('')}${보.join('')}</ul></div>`;
    } catch (e) {}

    // 갈림 — 판정이 사람 손에 넘어가는 자리
    let 갈림 = '';
    try {
      const fs = E.forks(R.pillars) || [];
      if (fs.length) 갈림 = `<div class="gk-fork">
        <p class="t">여기서 판정이 갈립니다</p>
        <p class="arm" style="margin:-4px 0 10px">명리가에 따라 다르게 보는 자리입니다.
          이 화면은 늘 보수적인 쪽으로 계산하고, 갈린다는 사실을 숨기지 않습니다.</p>
        ${fs.map(v => `<div class="it"><b>${esc(v.이름)}</b> — ${esc(v.사실)}<br>
          <span class="arm">이 화면의 판정 · ${esc(v.무료)}<br>
          ${esc(v.갈래)} ${esc(v.다른쪽)}</span></div>`).join('')}
        </div>`;
    } catch (e) {}

    // 격이 어디서 나왔는지 — 월지가 격을 정한다. 힘은 천간에서 오므로 축이 다르다.
    const mb = R.pillars.month.branch;
    const 국 = (E.samhapOf ? E.samhapOf([[R.pillars.year.branch, 1], [mb, 2],
      [R.pillars.day.branch, 1]].concat(R.pillars.hour ? [[R.pillars.hour.branch, 1.5]] : []))
      : []).filter(x => x.글자.indexOf(mb) >= 0)[0];
    // 한자 뒤의 조사는 우리말 읽기의 받침으로 고른다 — 「辰가」가 아니라 「辰이」다.
    const 받침 = (ko) => { const c = (ko || '').charCodeAt((ko || '').length - 1);
      return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
    const 이가 = (b) => 받침(f.branchKo(b)) ? '이' : '가';
    const 출처 = 국
      ? `태어난 달의 ${f.branch(mb)}(${f.branchKo(mb)})${이가(mb)} ${국.글자.map(b => f.branch(b)).join('')} ${E.ELEM[국.elem]} 기운으로 뭉쳤습니다. 그 뭉친 기운이 이 사주의 중심입니다`
      : `태어난 달의 ${f.branch(mb)}(${f.branchKo(mb)})에서 나온 것입니다`;

    box.innerHTML = `
      <div class="gk-head">
        <span class="nm">${esc(J.name)}격</span>
        <span class="vd ${cls}">${esc(L.짧게)}</span>
      </div>
      <p class="gk-sang" style="margin-bottom:8px">${esc(출처)}</p>
      <p class="gk-sang">${esc(한줄)}${J.상신 ? `<br>이 사주를 쓸 수 있게 해주는 것은 <b>${esc(J.상신)}</b>입니다` : ''}</p>
      ${근거줄.length || 힘줄 || 관계 ? `<button class="gk-more" id="gkMore">계산 근거 보기 ▸</button>` : ''}
      <div class="gk-detail hide" id="gkDetail">
      ${근거줄.length ? `<div class="gk-why">${근거줄.join('')}</div>` : ''}
      ${힘줄 ? `<p class="gk-force">천간이 지지에서 받은 힘 — ${힘줄}<br>
        <span style="color:var(--ink3)">0 은 그 십신이 천간에 안 떴거나 뿌리를 못 내렸다는 뜻입니다.
        격은 월지가 정하고 힘은 천간에서 오므로 둘이 어긋날 수 있습니다.</span></p>` : ''}
      ${관계}
      </div>
      ${갈림}`;

    const more = $('gkMore'), detail = $('gkDetail');
    if (more && detail) more.onclick = () => {
      const 열림 = !detail.classList.toggle('hide');
      more.textContent = 열림 ? '계산 근거 접기 ▾' : '계산 근거 보기 ▸';
    };
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
    if (!card) { card = document.createElement('section'); card.className = 'card'; card.id = 'aiProfile'; $('daeun').closest('.card').after(card); }
    const 머리 = '<h2>좌장이 읽는 원국</h2>';
    const cached = AI.getProfile(R);
    if (cached) { card.innerHTML = 머리 + `<div class="brief" style="font-size:15px">${mdLite(cached)}</div>`; return; }
    if (!AI.ready()) { card.innerHTML = 머리 + '<p class="hint">지금은 좌장을 부를 수 없습니다. 위 계산은 그대로 유효합니다.</p>'; return; }
    // **유료 상품이다**(products.wongook · migrate-15 · 2026-08-31 결재).
    //   판정을 가두는 것이 아니다 — 강약·용신·격국·대운은 위 카드에 **무료로 다 있다.**
    //   파는 것은 그것을 **알아듣게 엮는 일**이다(CLAUDE.md 넷 「판정 유료화 폐기」에 안 걸린다).
    //   무료로 두면 Opus + effort high 가 무료 화면에 붙는다 —
    //   memory 「원가 자물쇠」가 「돈이 타는 유일한 곳은 굽기」라 못박은 것을 어긴다.
    const 산분 = window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('wongook');
    if (!산분) {
      card.innerHTML = 머리
        + '<p class="hint">위 계산과 카드는 그대로 보십니다. 여기서는 좌장 태윤이 그 여덟 글자를 <b>한 편으로 엮어</b> 읽어 드립니다 — 무엇을 타고나셨고, 무엇이 채우고 무엇이 거슬리며, 사회 속 어디에 서 계신지. <b>한 번 읽으면 그대로 남습니다.</b></p>'
        + '<button class="btn" id="btnProfileBuy">원국 정독 열기</button>';
      const pb = card.querySelector('#btnProfileBuy');
      if (pb) pb.onclick = () => { try { ChaeksaPay.buy('wongook'); } catch (e) { go('me'); } };
      return;
    }
    // 산 뒤에도 **누르셔야 굽는다** — 화면을 여는 것만으로 원가가 나가면 안 된다.
    card.innerHTML = 머리
      + '<p class="hint">여덟 글자와 대운을 좌장 태윤이 한 번에 읽어 드립니다. 한 번 읽으면 그대로 남습니다.</p>'
      + '<button class="btn" id="btnProfileAsk">좌장에게 청하기</button>';
    const b = card.querySelector('#btnProfileAsk');
    if (!b) return;
    b.onclick = async () => {
      b.disabled = true;
      card.innerHTML = 머리 + '<div class="brief loading">좌장이 원국을 읽는 중… (한 번만 읽고 그대로 둡니다)</div>';
      try {
        const t = await AI.buildProfile(R, today);
        card.innerHTML = 머리 + `<div class="brief" style="font-size:15px">${mdLite(t)}</div>`;
        if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
      } catch (e) {
        // 원문 오류를 공주님께 보여 드리지 않는다. 무슨 말인지 알 수 없고 고칠 수도 없다.
        try { console.warn('원국 해석 실패:', e); } catch (e2) {}
        // e.blocked 는 불리언이 아니라 {title, body, cta} 객체다(usage.js blockedMessage).
        // 그걸 참/거짓으로만 읽고 「한도를 다 쓰셨습니다」를 찍고 있었다 —
        // 한 번도 안 쓴 손님에게 나가던 거짓말이다. 손님 몫 문구는 따로 들어 있다:
        // 「책사단의 글은 로그인하면 열립니다」 + 카카오 버튼.
        const b = e && e.blocked;
        const 한도 = !b && /한도|limit/i.test(String(e && e.message));
        card.innerHTML = 머리
          + (b
              ? '<p class="hint"><b>' + esc(b.title) + '</b><br>' + esc(b.body) + '</p>'
                + (b.cta ? '<button class="btn kakao" id="btnProfileLogin"><span>💬</span>' + esc(b.cta) + '</button>' : '')
              : '<p class="hint">' + (한도
                  ? 'AI 서술 한도를 다 쓰셨습니다 — 위 계산은 그대로 유효합니다.'
                  : '지금은 좌장을 부르지 못했습니다 — 위 계산은 그대로 유효합니다.') + '</p>'
                + (한도 ? '' : '<button class="btn" id="btnProfileRetry">다시 청하기</button>'));
        const gb = card.querySelector('#btnProfileLogin');
        if (gb) gb.onclick = () => { try { ChaeksaCloud.signInWith('kakao'); } catch (err) { openSettings(); } };
        const rb = card.querySelector('#btnProfileRetry');
        if (rb) rb.onclick = () => renderProfileCard();
      }
    };
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
    if (pendingPick && list.some(p => p.id === pendingPick)) $('cPick').value = pendingPick;
    pendingPick = null;
    $('btnCompat').disabled = !list.length;
  }
  $('btnCompat').onclick = () => {
    const P = People(), id = $('cPick').value;
    if (!id) return;
    const p = P.get(id); if (!p) return;
    showCompat(P.toProfile(p));
  };
  $('btnCompatAdd').onclick = () => openPersonForm(null);

  // 우리 둘 사이 — 카드 한 장이 결과의 전부다.
  // 머리는 「서로에게 무엇인가」. 상대 일간에서 나를 보면 십신이 뒤집힌다.
  function showCompat(you0) {
    const you = E.calc(you0), T = window.ChaeksaTypecard;
    const meName = profile.name || '나', youName = you0.name || '상대';
    const v = T.relation(R, you, meName, youName, today);
    const box = $('compatResult'); box.classList.remove('hide');
    // 「돈을 잘 버는지」의 답은 「상위 몇 %」다. 그건 표본이 있어야 나온다.
    // 없으면 조용히 지어두고 한 번만 다시 그린다 — 화면을 붙잡지 않는다.
    try {
      if (T.cachedSample && !T.cachedSample() && !showCompat.표본짓는중) {
        showCompat.표본짓는중 = true;
        T.buildSample(null, () => { try { showCompat(you0); } catch (e) {} });
      }
    } catch (e) {}
    // 「이 사람이 그 사람인가」 — 공주님이 생일을 넣는 이유가 정확히 이것이다.
    // 지위는 단정하지 않는다(사주에 없다). 두 원국이 맞물리는가만 말한다.
    const m0 = v.맞물림 || {};
    const 맞물림절 = (!m0.배우자성 && !m0.방글자) ? '' : `
      <div class="matchbox">
        <p class="mk">이 사람이 그 사람인가</p>
        ${m0.배우자성 ? `<p class="mb">${esc(youName)}님의 글자가 ${esc(meName)}님께
          <b>인연으로 오는 글자(${esc(m0.성이름)})</b>입니다.</p>` : ''}
        ${m0.방글자 ? `<p class="mb">${esc(meName)}님의 배우자 방에 앉은 글자
          <b>${esc(m0.방글자표기)}</b>와 같은 결입니다 — 방에 들어올 수 있는 사람입니다.</p>` : ''}
        <p class="ms">두 분이 어떤 사이인지는 사주에 적혀 있지 않습니다. 맞물리는가만 말씀드립니다.</p>
      </div>`;
    // 신살·조후 — 이 화면에서만 맞대어 본다. 엔진의 판정은 건드리지 않는다.
    const 결들 = (v.신살 || []).slice();
    if (v.온도) 결들.unshift({ 결: '조후', 말: v.온도.말 });
    if (v.채움) 결들.push({ 결: '채움', 말: v.채움.말 });
    // 원문 한 줄 + 해설 — 판정 옆에 조문을 두면 그것이 증거가 된다.
    // 원문은 뒤로 물러나 있고 읽는 것은 우리 말이다.
    const 신살절 = !결들.length ? '' : `
      <div class="signbox">${결들.map(x =>
        `<p class="sg"><b>${esc(x.결)}</b> ${esc(x.말)}</p>`
        + (x.원문 ? `<div class="wonmun"><q>${esc(x.원문)}</q>
            <cite>${esc(x.출전 || '')}</cite></div>` : '')).join('')}</div>`;
    // 「이 사람 쓸만한가」 — 관계보다 먼저 오는 물음이다.
    // 판정은 공주님 화면과 똑같은 함수로 냈다. 잣대가 다르면 견줄 수가 없다.
    const 사람절 = !(v.그사람 && v.그사람.length) ? '' : `
      <div class="manbox">
        <p class="mnk">${esc(youName)}님은 어떤 사람인가</p>
        ${v.그사람.map(x => `<div class="mn">
          <span class="mn-k">${esc(x.결)}</span>
          <span class="mn-v">${esc(x.이름)}${x.상위 ? ` · 상위 ${esc(x.상위)}%` : ''}</span>
          ${x.말 ? `<span class="mn-s">${esc(x.말)}</span>` : ''}
        </div>`).join('')}
        <p class="mns">공주님 화면과 같은 잣대로 잰 것입니다 — 그래야 견줄 수 있습니다.</p>
      </div>`;
    // 그 사람이 지금 지나는 운 — 관계의 뼈대 위에 「지금」을 얹는다
    const n = v.지금;
    const 지금절 = !n ? '' : `
      <div class="nowbox">
        <p class="nk">${esc(youName)}님은 지금</p>
        ${n.대운 ? `<p class="nb">${esc(n.대운.말[0])}</p>
          <p class="ns">${esc(n.대운.말[1])}</p>
          <p class="nm">${esc(n.대운.나이)} · ${esc(n.대운.간지)} 대운 — ${esc(n.대운.십신)}</p>` : ''}
        ${n.세운 ? `<p class="nm2">올해는 ${esc(n.세운.간지)} · ${esc(n.세운.십신)} — ${esc(n.세운.말[0])}</p>` : ''}
      </div>`;
    // 두 분 다 좋은 달 — 우리는 택일 엔진을 갖고 있다. 한쪽만 좋은 달은 좋은 달이 아니다.
    let 달절 = '', bmKeep = null;
    try {
      const bm = T.bothMonths(R, you, today, 12); bmKeep = bm;
      if (bm && bm.좋은달.length) 달절 = `
        <div class="bmbox">
          <p class="nk">두 분 다 좋은 달 — 앞으로 열두 달 중</p>
          ${bm.좋은달.map(m => `<div class="bm">
            <b>${m.연}년 ${m.월}월</b>
            <span class="gz">${esc(m.간지)}</span>
            <span class="rs">${esc([...new Set(m.이유)].slice(0,2).join(' · ') || '무난합니다')}</span>
          </div>`).join('')}
          ${(() => {
            // 첫 좋은 달 안에 실제로 며칠이 열리는지 — 개수만 낸다
            try {
              const g = bm.좋은달[0];
              const bd = T.bothDays(R, you, g.연, g.월);
              // 두 층이다(v532) — 두 분이 각자 최고인 날이 겹치면 그것(보석), 없으면 한 분 최고 + 상대 눌리지 않음.
              if (bd && bd.좋은날 > 0) return `<p class="bmdays">${g.연}년 ${g.월}월 안에
                <b>두 분이 각자 가장 좋은 날이 겹치는 날이 ${bd.좋은날}일</b> 있습니다 — 흔치 않습니다. 날짜와 시각은 아래에서</p>`;
              if (bd && bd.한쪽 > 0) return `<p class="bmdays">${g.연}년 ${g.월}월에 두 분이 같이 최고인 날은 없습니다.
                <b>한 분이 가장 좋고 다른 분이 눌리지 않는 날이 ${bd.한쪽}일</b> 있습니다 — 날짜와 시각은 아래에서</p>`;
            } catch (e) {}
            return '';
          })()}
          ${bm.나쁜달 && bm.나쁜달.점수 < 40 ? `<p class="bmno">${bm.나쁜달.연}년 ${bm.나쁜달.월}월은 둘 중 한 분이 눌립니다 — 큰 결정은 피하시는 편이 낫습니다</p>` : ''}
          <p class="bmft">결혼·상견례·여행처럼 <b>둘이 같이 정하는 날</b>에 쓰세요. 한 사람만 좋은 달은 뺐습니다.</p>
        </div>`;
    } catch (e) {}
    // 맺음이 제목이다 — 「이 사이는 ~한 사이입니다」가 이 화면의 답이다.
    box.innerHTML = `<h2>${esc(meName)} ∞ ${esc(youName)}</h2>
      <p class="rel-verdict">${esc(v.맺음)}</p>
      ${맞물림절}
      <div class="rel-two">
        <div><p class="rk">${esc(youName)}님은 ${esc(meName)}님에게</p>
          <p class="rb">${esc(v.나에게.말[0])}</p>
          <p class="rs">${esc(v.나에게.말[1])}</p></div>
        <div><p class="rk">${esc(meName)}님은 ${esc(youName)}님에게</p>
          <p class="rb">${esc(v.그에게.말[0])}</p>
          <p class="rs">${esc(v.그에게.말[1])}</p></div>
      </div>
      ${사람절}
      ${신살절}
      ${지금절}
      ${달절}
      ${(() => {
        const paid = window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('relation');
        if (paid && bmKeep && bmKeep.좋은달.length && T.coupleDates) {
          // 결제 열람 — 달을 재던 그 자로 날과 시진을 잰다. 날마다 왜 좋은지,
          // 시진은 이 지역 시계로 몇 시인지, 피할 날은 언제인지까지가 2만원이다.
          const lon = profile.longitude || 127.0;
          const plname = plNameOf(profile);
          const cw = T.coupleWhy ? T.coupleWhy(R, you, meName, youName) : null;
          return '<div class="paidbox"><p class="pb-k">결제 열람 — 날짜와 시각까지</p>'
            + (cw ? '<div class="nx-diag pbd"><p class="nx-diag-k">왜 두 분께는 날이 중요한가</p>' + cw.말.map(t => '<p>' + esc(t) + '</p>').join('') + '</div>' : '')
            + '<p class="pb-lede">두 분 <b>각자의 점수 중 낮은 쪽</b>으로 골랐습니다 — 한 분만 좋은 날은 좋은 날이 아니기 때문입니다. 시계 시각은 <b>' + esc(plname) + ' 기준 진태양시 보정</b>을 이미 반영한 값입니다.</p>'
            + bmKeep.좋은달.map(g => {
                let cd; try { cd = T.coupleDates(R, you, g.연, g.월, lon); } catch (e) { return ''; }
                const days = cd.좋은날;
                return '<p class="pb-h"><b>' + g.연 + '년 ' + g.월 + '월</b> — 두 분 다 좋은 날 ' + days.length + '일'
                  + (g.이유 && g.이유.length ? ' <span class="pb-god">' + esc([...new Set(g.이유)].slice(0, 2).join(' · ')) + '</span>' : '') + '</p>'
                  + (days.length
                     ? days.map(r => '<div class="pb-dd"><b>' + g.월 + '/' + r.일 + ' (' + r.요일 + ') ' + esc(r.간지) + '</b>'
                         + (r.이유 && r.이유.length ? '<p class="pb-why">◦ ' + esc([...new Set(r.이유)].join(' · ')) + '</p>' : '')
                         + (r.시진 ? '<p class="pb-why">◦ 그날 중에서도 — ' + esc(r.시진.join(' / ')) + '</p>' : '')
                         + '</div>').join('')
                     : '<p class="pb-d">이 달 안에는 두 분 다 좋은 날이 적습니다 — 다른 달을 보세요</p>')
                  + (cd.피할날.length ? '<p class="pb-avoid">피하실 날 — ' + cd.피할날.map(r => g.월 + '/' + r.일).join(' · ')
                      + ' <span class="pb-days-why">(' + esc(cd.피할날[0].이유[0] || '한 분이 눌리는 날') + ')</span></p>' : '');
              }).join('')
            + '<p class="pb-ft">잣대 공개 — 각자에게 필요한 오행이 오는가, 배우자 자리(일지)와 합·충이 되는가, 강약에 맞는 기운인가. 두 분의 점수 중 <b>낮은 쪽</b>이 그날의 점수입니다.</p>'
            + '<p class="pb-ft">결혼식처럼 되돌릴 수 없는 큰 날은 후보를 여럿 두고 보시는 편이 낫습니다 — 판정이 갈리는 자리가 있으면 원국 탭에 표시해 둡니다.</p></div>';
        }
        return nextStep('그 달의 며칠, 그리고 몇 시',
          '좋은 달과 그 안의 날 수까지',
          '결혼도 상견례도 결국 「며칠 몇 시」로 잡습니다. 그 날들이 언제인지, 어느 시각이 두 분께 열리는지를 진태양시 보정까지 넣어 보여드립니다.',
          (meName || '') + ' · ' + (youName || '') + ' 관계 상담 — 이번 달 흐름과 좋은 날짜를 보고 싶습니다', 'relation',
          T.coupleWhy ? T.coupleWhy(R, you, meName, youName).말 : null);
      })()}
      <div id="accWrap" class="cardwrap">
        <div id="accFlip" class="cardflip"><div id="accSvg" class="cardsvg">${T.drawRelation(meName, youName, v)}</div></div>
        <button class="btn small" id="btnAccShare">카드 저장·공유</button>
      </div>`;
    const fl = $('accFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
    $('btnAccShare').onclick = async () => {
      const b = $('btnAccShare'); b.disabled = true; b.textContent = '만드는 중…';
      try {
        const r = await T.share($('accSvg').innerHTML, '우리둘사이');
        b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
      } catch (e) { b.textContent = '다시 시도'; }
      b.disabled = false;
      setTimeout(() => { b.textContent = '카드 저장·공유'; }, 2500);
    };
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ───── 재물 그릇 — 녹패 ─────
  let nokpaeFor = null;   // 어느 사주로 그렸는지 — 프로필이 바뀌면 다시 그린다
  function renderNokpae() {
    const T = window.ChaeksaTypecard; if (!T || !$('nokpaeSvg')) return;
    if (nokpaeFor === R) return;
    $('nokpaeWrap').classList.add('hide'); $('nokpaeNote').textContent = '';
    $('nokpaeProg').classList.remove('hide');
    $('nokpaeProg').textContent = '호조 장부와 대조하는 중…';
    T.buildSample(
      (r) => { $('nokpaeProg').textContent = '호조 장부와 대조하는 중… ' + Math.round(r * 100) + '%'; },
      (sample) => {
        const w = T.wealth(R, today, sample);
        nokpaeFor = R;
        $('nokpaeProg').classList.add('hide');
        $('nokpaeSvg').innerHTML = T.drawNokpae(profile.name || '공주님', w);
        const fl = $('nokpaeFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
        $('nokpaeWrap').classList.remove('hide');
        $('nokpaeNote').textContent = '지어낸 사주 ' + w.n.toLocaleString() + '개 가운데 상위 ' + w.top + '% · ' + w.grade.name + ' — 같은 사주는 언제나 같은 녹패입니다';
        $('btnNokpaeShare').onclick = async () => {
          const b = $('btnNokpaeShare'); b.disabled = true; b.textContent = '만드는 중…';
          try {
            const r = await T.share($('nokpaeSvg').innerHTML, '녹패_' + w.grade.name);
            b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
          } catch (e) { b.textContent = '다시 시도'; }
          b.disabled = false;
          setTimeout(() => { b.textContent = '녹패 자랑하기'; }, 2500);
        };
      });
  }

  // ───── 택일 1:1 상담 문의 ─────
  // 카카오톡 채널. 채팅 주소(pf.kakao.com/_XXX/chat)든 채널 홈 주소(pf.kakao.com/_XXX)든
  // 채널 ID(_XXX)만 적든 다 받는다 — 관리자센터에서 어느 쪽을 복사해 올지 모른다.
  // 비워두면 카카오 버튼을 감추고 메일만 남긴다. 눌러도 아무 데도 안 가는 버튼을
  // 띄우느니 없는 게 낫다.
  // ───── 「그 다음」 — 해에서 달·날로 내려가는 자리 ─────
  // 무료는 「해」까지다. 달·날·시는 사람이 붙어서 봐야 하고, 그게 파는 것이다.
  // 답을 감추는 게 아니라 **해상도를 파는 것**이다 — 어디까지 무료인지 먼저 밝힌다.
  // 결제가 준비됐는지 — pay.html 로 보내는 버튼을 세울지 정한다.
  // 스크립트 평가 때 한 번 물어 캐시한다. 응답이 오기 전 렌더는 카카오만 보인다(무해).
  let payReady = false;
  if (window.ChaeksaPay) {
    // 이 왕복은 동기 렌더보다 늦게 온다 — 항상. 그래서 도착하면 「오늘」을 다시 그린다.
    // 안 그러면 아직 아무것도 안 산 손님에게 「이번 달 일운」 결제 버튼이 영영 안 뜬다
    // (오늘 탭은 go() 에 렌더 호출이 없어 탭을 눌러도 다시 안 그려진다).
    ChaeksaPay.state().then(s => {
      const 전 = payReady; payReady = !!(s && s.ready);
      if (payReady !== 전) { try { renderMyMonth(); } catch (e) {} }
    }).catch(() => {});
    // 결제 이력도 미리 받아 둔다 — 무료 카드가 그려질 때 동기로 물을 수 있게.
    // 뒤늦게 도착하면 캐시를 풀어 다음 탭 방문 때 유료 화면으로 다시 그려진다.
    ChaeksaPay.paidLoad().then(rows => {
      if (rows) 결제이력받음 = true;
      if (!rows || !rows.length) return;
      // dohwaFor 가 빠져 있었다 — 「인연 시기」를 산 손님이 앱을 켜고 바로 연애 탭을
      // 열면 그 탭만 결제 안내가 떠 있었다. 재방문자는 표본이 로컬에 있어 탭이
      // 주문 조회 왕복보다 먼저 그려진다.
      inyeonFor = null; lsFor = null; msFor = null; dohwaFor = null;
      try { renderMyMonth(); } catch (e) {}
    }).catch(() => {});
  }

  // ── 계산 원장 로딩 — 로딩 자체가 「기준 공개」다 ──
  // 추상적인 「…재는 중」이 아니라 실제 중간 결과를 한 줄씩 찍는다.
  // 노력의 가시화: 같은 결과라도 일하는 과정을 본 사람이 더 신뢰한다(카약의 항공사
  // 스캔). 우리는 흉내낼 필요가 없다 — 진짜 계산이니 원장을 그대로 보여주면 된다.
  // 줄도 숫자도 전부 실측이다. 지어낸 줄이 하나라도 섞이면 이 장치 전체가 거짓이 된다.
  // 달과 달 사이의 이음말 — 낱장 카드를 흐름으로 잇는다.
  // 명리가는 달을 따로 읽지 않는다: 「앞 달에 정리된 자리가 이 달에 채워진다」로 읽는다.
  // (이음말 표와 시진 묶기는 판단서(typecard.reading)로 이사했다 — 두 벌 금지)
  function paidReveal(box, 원장, make, after) {
    // 원장: { 머리:[문자열...], 달줄:[{말, 표}...], 꼬리:[문자열...], 검토수 }
    const esc2 = esc;
    box.innerHTML = '<div class="paidbox"><p class="pb-k">결제 열람 — 계산 중</p>'
      + '<div class="pb-ledger" aria-live="polite"></div>'
      + '<div class="pb-lgfoot"><span class="pb-lgcount"></span></div>'
      + '<div class="pb-loadbar"><i style="width:4%"></i></div></div>';
    const led = box.querySelector('.pb-ledger'), bar = box.querySelector('.pb-loadbar i');
    const cnt = box.querySelector('.pb-lgcount');
    const 줄들 = [];
    (원장.머리 || []).forEach(t => 줄들.push({ t, cls: 'h', ms: 700 }));
    (원장.달줄 || []).forEach(m => 줄들.push({ t: m.말, 표: m.표, cls: 'm', ms: 430 }));
    (원장.꼬리 || []).forEach(t => 줄들.push({ t, cls: 'h', ms: 750 }));
    const total = 줄들.length;
    let i = 0, seen = 0;
    const step = () => {
      if (i >= total) {
        bar.style.width = '100%';
        setTimeout(() => { box.innerHTML = make(); if (after) try { after(box); } catch (e) {} }, 420);
        return;
      }
      const L = 줄들[i];
      const div = document.createElement('div');
      div.className = 'pb-lg-line pb-lg-' + L.cls;
      div.innerHTML = (L.표 ? '<span class="pb-lg-mark">' + L.표 + '</span>' : '') + esc2(L.t);
      led.appendChild(div);
      // 원장은 위로 흘러간다 — 최근 여섯 줄만 또렷하게
      const lines = led.querySelectorAll('.pb-lg-line');
      if (lines.length > 6) lines[lines.length - 7].classList.add('dim');
      if (lines.length > 10) lines[lines.length - 11].remove();
      led.scrollTop = led.scrollHeight;
      if (L.cls === 'm') { seen++; }
      if (원장.검토수) cnt.textContent = '대조한 경우 ' + Math.round((i + 1) / total * 원장.검토수).toLocaleString('ko-KR') + '가지';
      bar.style.width = Math.round(4 + (i + 1) / total * 92) + '%';
      i++;
      setTimeout(step, L.ms);
    };
    setTimeout(step, 350);
  }

  function nextStep(제목, 무료로본것, 물음, 문의말, 상품, 진단) {
    const q = encodeURIComponent(문의말 || '');
    // 진단 — 엔진이 이 사람 원국에서 읽은 「왜 공주님께는 시기가 중요한가」.
    // 일반 문구는 아무도 안 산다. 자기 얘기라야 지갑이 열린다.
    const diag = (진단 && 진단.length)
      ? `<div class="nx-diag"><p class="nx-diag-k">공주님의 원국에서 읽은 것</p>${진단.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : '';
    // 다음 걸음은 결제 하나다. 결제가 아직이면 버튼을 안 세우고 「곧 열립니다」로 둔다 —
    // 눌러도 아무 데도 안 가는 버튼과, 궁정에 어울리지 않는 상담 창구를 둘 다 걷었다.
    const payBtn = (payReady && 상품)
      ? `<a class="btn nx-cta" href="pay.html?p=${상품}" style="background:var(--accent);color:#fff;border-color:var(--accent)">
          결제하고 바로 보기</a>` : '';
    return `<div class="nextbox">
      <p class="nx-k">${esc(제목)}</p>
      <p class="nx-free">여기까지가 무료입니다 — <b>${esc(무료로본것)}</b></p>
      ${diag}
      <p class="nx-q">${esc(물음)}</p>
      ${payBtn}
      <p class="nx-ft">${payBtn ? '결제하시면 이 자리에서 바로 열립니다 — 달과 날과 시각까지.'
                                : '달·날·시각은 곧 이 자리에서 열립니다.'}</p>
    </div>`;
  }

  // ── 책사의 말 — 유료 화면 끝에 AI 서술을 얹는다 ──
  // 사실(연표·점수·날짜)은 룰 엔진이 이미 표로 냈다. AI 의 일은 그 사실을
  // 조리 있게, 위로가 되게, 다음 걸음이 궁금해지게 잇는 것뿐이다.
  // 숫자는 프롬프트가 막는다(사실 밖 언급 금지) — 지어내면 위의 표와 어긋나 바로 들킨다.
  // 같은 사주·같은 달엔 캐시를 쓴다: 원가는 상품당 한 번 ~10원.
  // AI 가 안 되면(비로그인·한도·장애) 조용히 뺀다 — 규칙 화면만으로 완결이다.
  /** 열두 달을 통째로 보내면 재료가 1만 토큰을 넘어 시간 안에 못 끝난다.
   *  열리는 달만 온전히 주고, 조용한 달은 한 줄로 줄인다 — 어차피 「줄이는 것」이 이 글의 일이다. */
  function 달줄이기(달들) {
    if (!Array.isArray(달들)) return 달들;
    return 달들.map(m => (m && (m.열림 || m.상태 === 'open'))
      ? m
      : { 연: m.연, 월: m.월, 간지: m.간지, 결: m.결 || null, 조용: true });
  }

  async function aiNarrate(box, kind, facts) {
    try {
      if (!window.ChaeksaAI || !AI.ready()) return;
      const pb = box.querySelector('.paidbox'); if (!pb) return;
      // v2 — 책사단으로 판이 바뀌었다. 옛 단일 화자 글은 한 번 다시 쓴다.
      // v4 — 키를 두 군데 고쳤다(2026-08-30).
      //  ① 시주·성별이 빠져 있었다. 성별은 대운 순행/역행을 통째로 뒤집고 시주는
      //     여덟 글자를 바꾼다. 고치고 나면 위 표는 새 계산인데 아래 글은 옛 달을
      //     말했다. 같은 브라우저에 생일이 같은 사람이 둘 있으면 서로의 글을 봤다.
      //  ② 달마다 다시 구웠다. 1년 열람 상품인데 매달 두 편씩 = 24회. 무료 등급의
      //     평생 story 한도가 정확히 24라 열람 기간이 끝나기 전에 글이 영영 사라진다.
      //     원가도 회당 950원이라 2만원 상품에 22,800원이 들어간다. 분기로 늦춘다 —
      //     석 달에 한 번이면 원가 7,600원이고 글이 크게 낡지도 않는다.
      const i0 = (R && R.input) || {};
      const 분기 = today.getFullYear() + 'Q' + (Math.floor(today.getMonth() / 3) + 1);
      const key = 'chaeksa.storyai.v4.' + kind + '.'
        + f.pillar(R.pillars.year) + f.pillar(R.pillars.month) + f.pillar(R.pillars.day)
        + (R.pillars.hour ? f.pillar(R.pillars.hour) : '시모름')
        + '.' + (i0.gender || '?') + (profile && profile.genderUnknown ? 'u' : '')
        + '.' + 분기;
      let cached = null;
      try { cached = localStorage.getItem(key); } catch (e) {}
      const el = document.createElement('div');
      el.className = 'pb-ai';
      // 답은 맨 위다. 자리가 마련돼 있으면 거기에, 아니면 예전처럼 뒤에 붙인다.
      const slot = pb.querySelector('.pb-ai-slot');
      (slot || pb).appendChild(el);
      const draw = (t) => {
        el.innerHTML = '<p class="pb-ai-k">책사단이 이어 말합니다</p>'
          + 발언들(String(t).split(/[\r\n]+/).filter(Boolean));
      };
      if (cached) { draw(cached); return; }
      el.innerHTML = '<p class="pb-ai-k">책사단이 이어 말합니다</p><p class="pb-ai-load">위 계산을 놓고 책사단이 의논하는 중입니다 — 한 편의 풀이라 30초에서 1분쯤 걸립니다…</p>';
      if (facts && facts.열두달) facts = Object.assign({}, facts, { 열두달: 달줄이기(facts.열두달) });
      // 원국을 직접 보여준다 — 엔진 결론만 주면 LLM 이 조립공이 된다(2026-08-30 「다 열어봐」).
      // chartText 는 여덟 글자·일간·지장간·대운과 「직접 판단하라」는 지침을 함께 담는다.
      const 실을것 = Object.assign({}, facts);
      try { if (AI.chartText) 실을것.원국 = AI.chartText(R, today); } catch (e) {}
      const out = await AI.storyTell(kind, 실을것);
      try { localStorage.setItem(key, out); } catch (e) {}
      draw(out);
    } catch (e) {
      // 조용히 지우면 왜 안 나오는지 아무도 모른다(2026-08-30 「그대로인데?」).
      // 규칙 화면만으로도 완결이므로 크게 벌리지는 않되, 흔적은 남긴다.
      try { console.warn('책사단 서술 실패:', e); } catch (e2) {}
      const el = box.querySelector('.pb-ai');
      if (!el) return;
      // 「이 화면을 다시 열어 주세요」는 아무 일도 하지 않았다 — 유료 화면들은
      // lsFor/msFor/dohwaFor 캐시로 스스로를 막아, 탭을 나갔다 와도 다시 안 그린다.
      // 시키는 대로 해도 안 되면 손님에게는 그냥 고장이다. 버튼을 준다.
      // 위와 같은 병 — e.blocked 는 객체다. 손님에게 「한도를 다 쓰셨습니다」가 나가고
      // 있었고, 그 안에 들어 있던 카카오 버튼(cta)은 버려지고 있었다.
      const b = e && e.blocked;
      const 한도 = !b && /한도|limit/i.test(String(e && e.message));
      el.innerHTML = '<p class="pb-ai-k">책사단이 이어 말합니다</p>'
        + (b
            ? '<p class="pb-ai-load"><b>' + esc(b.title) + '</b><br>' + esc(b.body) + '</p>'
              + (b.cta ? '<button class="btn kakao" id="aiLogin"><span>💬</span>' + esc(b.cta) + '</button>' : '')
            : '<p class="pb-ai-load">' + (한도
                ? 'AI 서술 한도를 다 쓰셨습니다 — 위 계산은 그대로 유효합니다. 메일로 알려주시면 열어 드리겠습니다.'
                : '지금은 의논을 옮겨 적지 못했습니다 — 위 계산은 그대로 유효합니다.') + '</p>'
              + (한도 ? '' : '<button class="btn" id="aiRetry">다시 시도</button>'));
      const lg = el.querySelector('#aiLogin');
      if (lg) lg.onclick = () => { try { ChaeksaCloud.signInWith('kakao'); } catch (e4) { openSettings(); } };
      const rb = el.querySelector('#aiRetry');
      if (rb) rb.onclick = () => { rb.disabled = true; try { el.remove(); } catch (e3) {} aiNarrate(box, kind, facts); };
    }
  }

  // ── 이번 달 일운 달력 — 달마다 다시 사는 상품 ──
  // 무료는 오늘과 이번 주까지. 서른 날 전체는 결제한 그 달만 열린다.
  function renderMyMonth() {
    const T = window.ChaeksaTypecard;
    const wkEl = $('week'), wkCard = wkEl && wkEl.closest('.card');
    if (!T || !T.myDays || !wkCard || !R) return;
    let box = $('myMonth');
    if (!box) { wkCard.insertAdjacentHTML('afterend', '<section class="card" id="myMonth"></section>'); box = $('myMonth'); }
    const y = today.getFullYear(), m = today.getMonth() + 1;
    const paid = window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('month');
    if (!paid) {
      box.innerHTML = nextStep('이번 달 서른 날', '오늘과 이번 주까지',
        m + '월 한 달 전체 — 어느 날이 풀리고 어느 날을 조심할지는 일운까지 내려가야 보입니다. 달이 바뀌면 새 달을 새로 봅니다.',
        (profile.name || '') + '님 ' + m + '월 일운 — 좋은 날과 조심할 날을 보고 싶습니다', 'month',
        T.monthWhy ? T.monthWhy(R).말 : null);
      return;
    }
    const v = T.myDays(R, y, m);
    // 달력 한 장으로 끝내지 않는다 — 주 단위로 흐름을 말하고, 좋은 날과 조심할 날은
    // 왜 그런지까지 말한다. 1만원이면 읽을거리가 있어야 한다.
    const 주절 = v.주들.map(w => {
      const g = w.top.십신;
      return `<div class="pb-dd"><b>${w.시작}~${w.끝}일</b> <span class="pb-god">${w.평균 >= 60 ? '순한 주' : w.평균 <= 42 ? '무거운 주' : '보통 주'}</span>
        <p class="pb-why">◦ 가장 좋은 날은 <b>${w.top.일}일(${w.top.요일})</b> ${esc(w.top.간지)} · ${esc(g)} — ${esc(GOD_FLOW[g] || '')}</p>
        ${w.low.점수 <= 35 ? `<p class="pb-why">◦ ${w.low.일}일(${w.low.요일})은 눌립니다 — 큰 결정은 미루세요</p>` : ''}
      </div>`;
    }).join('');
    const 좋은절 = v.좋은.length
      ? v.좋은.map(r => `<p class="pb-why">◦ <b>${r.일}일(${r.요일})</b> ${esc(r.간지)} · ${esc(r.십신)}${r.이유.length ? ' — ' + esc(r.이유[0]) : ''}</p>`).join('')
      : '<p class="pb-why">◦ 크게 열리는 날이 없는 달입니다 — 무리해서 일을 벌이기보다 다음 달을 준비하는 달로 쓰세요</p>';
    const 조심절 = v.조심.length
      ? v.조심.map(r => `<p class="pb-why">◦ <b>${r.일}일(${r.요일})</b> ${esc(r.간지)}${r.이유.length ? ' — ' + esc(r.이유[0]) : ' — 기운이 눌리는 날입니다'}</p>`).join('')
      : '';
    // 다음 달 예고 — 달마다 다시 사는 상품의 고리
    let 예고 = '';
    try {
      const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
      const nv = T.myDays(R, ny, nm);
      예고 = `<p class="pb-ft">${nm}월에는 풀리는 날이 ${nv.좋은.length}일 있습니다 — 달이 바뀌면 새로 열어보세요.</p>`;
    } catch (e) {}
    const mw = T.monthWhy ? T.monthWhy(R) : null;
    box.innerHTML = `<h2>${m}월 일운 달력<span class="h2sub">결제 열람 · ${y}년</span></h2>
      ${mw ? `<div class="nx-diag pbd"><p class="nx-diag-k">왜 공주님께는 날의 서열인가</p>${mw.말.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      <div class="pb-grid">` + v.rows.map(r => {
        const cls = r.점수 >= 72 ? ' good' : (r.점수 <= 30 ? ' bad' : '');
        // 같은 달력의 다른 줄(docs/29 셋) — 그날 하늘에 온 글자가 돈·자리·인연 중 무엇인가.
        // 오늘의 비서(chaeksadan.오늘)와 같은 잣대다: 재성=돈 · 관성=자리 · 배우자성=연.
        const 무리 = { 편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성' }[r.십신] || '';
        const 여 = ((profile && profile.gender) || 'M') !== 'M';
        const 표 = 무리 === '재성' ? (여 ? '돈' : '돈·연') : 무리 === '관성' ? (여 ? '자리·연' : '자리') : '';
        return `<div class="pb-cell${cls}${r.일 === today.getDate() ? ' now' : ''}">
          <b>${r.일}</b><span>${esc(r.십신.slice(0, 2))}</span>${표 ? `<span style="display:block;font-size:9px;color:var(--accent)">${표}</span>` : ''}</div>`;
      }).join('') + `</div>
      <p class="hint" style="margin:6px 0 0">칸 아래 작은 글자 — 그날 하늘에 온 글자가 <b>돈</b>(재성)인지 <b>자리</b>(관성)인지 <b>연</b>(배우자성)인지. 홈의 오늘 한마디와 같은 잣대입니다.</p>
      <p class="pb-h"><b>주 단위로 읽으면</b></p>${주절}
      <p class="pb-h"><b>풀리는 날${v.좋은.length ? ' — ' + v.좋은.map(r => r.일).join('·') + '일' : ''}</b></p>${좋은절}
      ${조심절 ? `<p class="pb-h"><b>조심할 날 — ${v.조심.map(r => r.일).join('·')}일</b></p>${조심절}` : ''}
      <p class="pb-ft">잣대 공개 — 필요한 오행이 오는 날인가, 일지와 합·충이 되는 날인가, 강약에 맞는 기운인가. 같은 달 안에서의 서열입니다. 각 날의 시간대는 그날이 되면 「오늘의 시간대」가 12시진 곡선으로 그려드립니다.</p>
      ${예고}`;
  }

  // 2026-08-30 「카카오로 물어보기도 다 치우자」 — 비워두면 카카오 버튼이 스스로 숨고
  // 메일만 남는다(그렇게 만들어 두었다). 채널 아이디는 되살릴 때를 위해 주석으로 남긴다: '_jdqxaX'
  const KAKAO_CHANNEL = '';

  const KAKAO_CHAT = (() => {
    const v = String(KAKAO_CHANNEL || '').trim();
    if (!v) return '';
    if (v.indexOf('open.kakao.com') >= 0) return v;          // 오픈채팅은 그대로
    const id = (v.match(/_[A-Za-z0-9]+/) || [v])[0];
    return 'https://pf.kakao.com/' + id + '/chat';
  })();

  // 채널 홈. '채널 추가'와 '대화하기' 버튼이 이미 붙어 있는 페이지다.
  // 카카오 JS SDK로도 추가 버튼을 붙일 수 있지만 스크립트 2MB에 팝업 차단까지 얹힌다.
  // 링크 한 줄로 되는 일에 그걸 들일 이유가 없다.
  const KAKAO_HOME = KAKAO_CHAT.replace(/\/chat$/, '');

  // 빈 창을 열면 무엇을 써야 할지 몰라 닫는다. 메일은 본문을 채워서 열 수 있지만
  // 카카오는 미리 채워주는 수단이 없다. 그래서 양식을 클립보드에 넣고 채팅을 연다.
  const TAEK_FORM = [
    '출산택일 상담을 신청합니다.', '',
    '아버지 생년월일시 :', '어머니 생년월일시 :',
    '출생 예정지 (시·군) :', '수술 가능한 날짜 범위 :',
    '아이 성별 :', '첫째인지 :', '',
    '(양력/음력을 함께 적어주시면 좋습니다)',
  ].join('\n');

  function copyText(t) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t); return true;
      }
    } catch (e) { /* 아래로 흘린다 */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove(); return true;
    } catch (e) { return false; }
  }

  function flash(btn, msg) {
    const old = btn.innerHTML;
    btn.innerHTML = msg;
    setTimeout(() => { btn.innerHTML = old; }, 2600);
  }

  function wireTaekil() {
    const a = $('btnTaekMail'); if (!a || a.dataset.wired) return;
    a.dataset.wired = '1';
    a.href = 'mailto:b01099991263@gmail.com?subject='
      + encodeURIComponent('[책사] 출산택일 상담 문의')
      + '&body=' + encodeURIComponent(TAEK_FORM);

    const k = $('btnTaekKakao');
    if (!k || !KAKAO_CHAT) return;
    k.classList.remove('hide');
    if ($('taekKakaoNote')) $('taekKakaoNote').classList.remove('hide');
    // 카카오가 켜지면 그쪽이 주인공이다. 메일은 뒤로 물러난다 —
    // 반대로 카카오가 꺼져 있으면 메일이 유일한 문의 수단이라 주 버튼으로 남아야 한다.
    a.className = 'btn ghost small';
    a.textContent = '📧 메일이 편하시면';
    const ch = $('taekChannel'), cl = $('taekChannelLink');
    if (ch && cl && KAKAO_HOME !== KAKAO_CHAT) {
      cl.href = KAKAO_HOME;
      ch.classList.remove('hide');
    }
    k.onclick = () => {
      const ok = copyText(TAEK_FORM);
      // 창 열기는 클릭 제스처 안에서 해야 팝업 차단에 안 걸린다
      window.open(KAKAO_CHAT, '_blank', 'noopener');
      flash(k, ok ? '양식을 복사했습니다 — 채팅창에 붙여넣으세요'
                  : '채팅창을 열었습니다 — 위 양식을 적어 보내주세요');
    };
  }

  // 받침이 있으면 '이었습니다', 없으면 '였습니다'. 조사를 안 맞추면 기계가 쓴 티가 난다.
  function josa(word, withBatchim, without) {
    const c = String(word || '').trim().slice(-1).charCodeAt(0);
    const has = c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 !== 0 : false;
    return (word || '') + (has ? withBatchim : without);
  }

  // ───── 비망록 — 판단 기록장 ─────
  // 이 앱에서 유일하게 "시간이 지날수록 값이 커지는" 자리다.
  // 카드는 한 번 보고 끝나지만 여기 쌓인 기록은 비서가 먼저 말을 걸 근거가 된다.
  function memoPersonId() { const P = People(); const a = P && P.active(); return a ? a.id : 'solo'; }

  function memoRow(it, opts) {
    const M = window.ChaeksaMemo;
    const v = it.verdict;
    const 판단 = v ? `<span class="mm-grade">${esc(v.grade)}</span> <span class="mm-dim">${esc(v.pillar)}월 · ${v.score}점</span>` : '';
    let 결과 = '';
    if (it.outcome) {
      const o = M.OUTCOMES[it.outcome.result] || {};
      결과 = `<div class="mm-out"><b style="color:${o.col}">${o.mark} ${esc(o.label)}</b>${it.outcome.note ? ' — ' + esc(it.outcome.note) : ''}</div>`;
    } else if (opts && opts.ask) {
      결과 = `<div class="mm-ask">어떻게 되었습니까?
        <button class="chip" data-id="${it.id}" data-r="good">○ 좋았다</button>
        <button class="chip" data-id="${it.id}" data-r="soso">△ 그저 그랬다</button>
        <button class="chip" data-id="${it.id}" data-r="bad">✕ 아니었다</button></div>`;
    }
    return `<div class="mm">
      <div class="mm-head"><b>${esc(it.q)}</b><span class="mm-when">${M.label(it.ym)}</span></div>
      <div class="mm-v">${판단}</div>
      ${v && v.line ? `<div class="mm-line">${esc(v.line)}</div>` : ''}
      ${결과}
      <button class="mm-del" data-del="${it.id}" aria-label="지우기">지우기</button>
    </div>`;
  }

  let memoKind = 'track';   // 기본은 '계속되는 일' — 비서가 값어치를 내는 쪽이다

  function memoTrackRow(it) {
    const M = window.ChaeksaMemo;
    const logs = (it.logs || []).slice().reverse();
    const 이번달 = M.loggedThisMonth(it, today);
    const pat = M.pattern(it, R);
    const 기록 = logs.length
      ? `<div class="mm-logs">${logs.slice(0, 6).map(l => {
          const o = M.OUTCOMES[l.result] || {};
          return `<span class="mm-log" title="${esc(l.note || '')}"><b style="color:${o.col}">${o.mark}</b> ${M.label(l.ym).replace(/^\d+년 /, '')}</span>`;
        }).join('')}${logs.length > 6 ? `<span class="mm-log mm-dim">외 ${logs.length - 6}달</span>` : ''}</div>`
      : '<div class="mm-line">아직 기록이 없습니다.</div>';
    // 기록한 그 자리에서 드리는 말이 먼저다. 패턴은 그다음.
    const 마지막 = logs[0];
    const 응답 = 마지막 && 마지막.say
      ? `<div class="mm-say mm-${esc(마지막.say.tone)}">${esc(마지막.say.text)}</div>` : '';

    // 말할 수 있는 것만 말한다. 두세 달로 단정하면 그게 점집이다.
    let 패턴 = '';
    const 조각 = [];
    if (pat && pat.engine) {
      pat.engine.forEach(e => 조각.push(e.side === '좋다'
        ? `제가 <b>좋다</b>고 본 ${e.n}달 중 <b>${e.hit}달</b>이 실제로 괜찮으셨습니다`
        : `제가 <b>아니라</b>고 본 ${e.n}달 중 <b>${e.hit}달</b>이 실제로 그랬습니다`));
    }
    if (pat && pat.god) {
      if (pat.god.worst) 조각.push(`<b>${esc(pat.god.worst.g)}</b> 달이 유독 힘드셨습니다 (${pat.god.worst.n}달 중 ${pat.god.worst.bad}달)`);
      if (pat.god.best) 조각.push(`<b>${esc(pat.god.best.g)}</b> 달은 나으셨습니다 (${pat.god.best.n}달 중 ${pat.god.best.good}달)`);
    }
    if (조각.length) 패턴 = `<div class="mm-pat">${pat.n}달치로 보면 — ${조각.join('. ')}.</div>`;
    else if (pat && pat.need > 0 && !응답) 패턴 = `<div class="mm-pat mm-dim">${pat.need}달만 더 쌓이면 어떤 달이 힘든지도 말씀드릴 수 있습니다.</div>`;
    else if (logs.length >= 4) 패턴 = `<div class="mm-pat mm-dim">아직 한쪽으로 기울지 않았습니다. 더 지켜보겠습니다.</div>`;
    const 물음 = 이번달
      ? '<div class="mm-line mm-dim">이번 달은 기록하셨습니다. 다시 누르면 덮어씁니다.</div>'
      : '';
    return `<div class="mm">
      <div class="mm-head"><b>${esc(it.q)}</b><span class="mm-when">${logs.length}달째</span></div>
      ${기록}${응답}${패턴}${물음}
      <div class="mm-ask">이번 달은 어떻습니까?
        <button class="chip" data-tid="${it.id}" data-r="good">○ 괜찮다</button>
        <button class="chip" data-tid="${it.id}" data-r="soso">△ 그저 그렇다</button>
        <button class="chip" data-tid="${it.id}" data-r="bad">✕ 힘들다</button></div>
      <button class="mm-del" data-del="${it.id}" aria-label="지우기">지우기</button>
    </div>`;
  }

  /** 한 줄 받기. 브라우저 prompt 대신 우리 옷을 입은 칸으로 묻는다.
   *  취소하면 null 을 돌려준다 — 예전에는 취소를 '' 로 삼켜 그대로 기록했다. */
  function 한줄받기(질문, 도움) {
    return new Promise((resolve) => {
      const 막 = document.createElement('div');
      막.className = 'askline';
      막.innerHTML = '<div class="al-in">'
        + '<p class="al-q">' + esc(질문) + '</p>'
        + (도움 ? '<p class="al-h">' + esc(도움) + '</p>' : '')
        + '<input class="al-i" type="text" maxlength="120" placeholder="한 줄로 적어 주세요">'
        + '<div class="al-b"><button class="btn ghost small" data-x="0">그냥 두기</button>'
        + '<button class="btn small" data-x="1">남기기</button></div></div>';
      const 끝 = (v) => { try { 막.remove(); } catch (e) {} resolve(v); };
      막.onclick = (e) => { if (e.target === 막) 끝(null); };
      막.querySelector('[data-x="0"]').onclick = () => 끝(null);
      막.querySelector('[data-x="1"]').onclick = () => 끝(막.querySelector('.al-i').value.trim());
      막.querySelector('.al-i').onkeydown = (e) => {
        if (e.key === 'Enter') 끝(막.querySelector('.al-i').value.trim());
        if (e.key === 'Escape') 끝(null);
      };
      document.body.appendChild(막);
      setTimeout(() => { try { 막.querySelector('.al-i').focus(); } catch (e) {} }, 30);
    });
  }

  function renderMemo() {
    const M = window.ChaeksaMemo; if (!M || !$('memoQ')) return;
    const pid = memoPersonId();
    // 종류 고르기 — 무엇을 묻는지가 달라진다
    $('memoKind').querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', b.dataset.kind === memoKind);
      b.onclick = () => { memoKind = b.dataset.kind; renderMemo(); };
    });
    const 계속 = memoKind === 'track';
    $('memoQLabel').textContent = 계속 ? '무엇이 계속 마음에 걸립니까' : '무엇을 하려 하십니까';
    $('memoQ').placeholder = 계속 ? '예) 허리 통증 / 가게 매출 / 아이 성적 / 잠 못 드는 것'
                                  : '예) 이직 / 계약 / 이사 / 시험';
    $('memoWhen').classList.toggle('hide', 계속);
    $('memoKindNote').textContent = 계속
      ? '달마다 어땠는지 눌러 두시면, 어떤 달에 힘든지 제가 찾아 말씀드립니다.'
      : '그 달이 왔을 때 먼저 꺼내 드립니다.';
    $('btnMemoAdd').textContent = 계속 ? '이 일을 지켜본다' : '이 판단을 남긴다';

    // 계속되는 일 목록
    const tks = M.tracks(pid);
    $('memoTrackCard').classList.toggle('hide', !tks.length);
    $('memoTracks').innerHTML = tks.map(memoTrackRow).join('');
    $('memoTracks').querySelectorAll('button[data-tid]').forEach(b => b.onclick = async () => {
      const note = await 한줄받기('그때 어떠셨는지 한 줄로 남기시겠습니까?',
                                 '나중에 이 달이 다시 왔을 때 그대로 꺼내 드립니다.');
      if (note === null) return;          // 그냥 두기 — 기록하지 않는다
      M.log(b.dataset.tid, today.getFullYear(), today.getMonth() + 1, b.dataset.r, note, R);
      renderMemo(); renderHome(); renderToday();
    });
    $('memoTracks').querySelectorAll('button[data-del]').forEach(b => b.onclick = () => {
      if (!confirm('이 기록을 지웁니다. 계속할까요?')) return;
      M.remove(b.dataset.del); renderMemo(); renderHome(); renderToday();
    });
    // 연·월 고르기 — 이번 달부터 24개월
    if (!$('memoY').options.length) {
      const ys = [today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2];
      $('memoY').innerHTML = ys.map(y => `<option value="${y}">${y}년</option>`).join('');
      $('memoM').innerHTML = Array.from({ length: 12 }, (_, i) =>
        `<option value="${i + 1}"${i + 1 === today.getMonth() + 1 ? ' selected' : ''}>${i + 1}월</option>`).join('');
    }
    const peek = () => {
      const j = M.judge(R, +$('memoY').value, +$('memoM').value);
      $('memoPeek').innerHTML = j
        ? `그 달은 <b>${esc(j.pillar)}월 · ${esc(j.grade)}</b> (${j.score}점) — ${esc(j.line)}`
        : '';
    };
    $('memoY').onchange = peek; $('memoM').onchange = peek; peek();

    const due = M.due(pid, today), next = M.upcoming(pid, today);
    $('memoDueCard').classList.toggle('hide', !due.length);
    $('memoNextCard').classList.toggle('hide', !next.length);
    $('memoDue').innerHTML = due.map(it => memoRow(it, { ask: true })).join('');
    $('memoNext').innerHTML = next.map(it => memoRow(it, {})).join('');

    // 지난 것 중 결과가 적힌 것
    const done = M.list(pid).filter(x => x.outcome);
    if (done.length) {
      $('memoDueCard').classList.remove('hide');
      $('memoDue').innerHTML += `<div class="mm-sep">기록된 것</div>` + done.map(it => memoRow(it, {})).join('');
    }

    // 결과 버튼·삭제 배선
    $('memoDue').querySelectorAll('button[data-r]').forEach(b => b.onclick = async () => {
      const note = await 한줄받기('그때 어떠셨는지 한 줄로 남기시겠습니까?',
                                 '남겨 두시면 이 잣대가 맞았는지 함께 볼 수 있습니다.');
      if (note === null) return;          // 그냥 두기 — 기록하지 않는다
      M.setOutcome(b.dataset.id, b.dataset.r, note);
      renderMemo(); renderHome(); renderToday();
    });
    [$('memoDue'), $('memoNext')].forEach(box => box.querySelectorAll('button[data-del]').forEach(b => b.onclick = () => {
      if (!confirm('이 기록을 지웁니다. 계속할까요?')) return;
      M.remove(b.dataset.del); renderMemo(); renderHome(); renderToday();
    }));

    // 적중률
    const st = M.stats(pid);
    $('memoStatCard').classList.toggle('hide', st.total < 3);
    if (st.total >= 3) {
      const 줄 = [];
      if (st.좋다한것.n) 줄.push(`<p>엔진이 <b>좋다</b>고 한 ${st.좋다한것.n}건 중 <b>${st.좋다한것.맞음}건</b>이 실제로 좋았습니다.</p>`);
      if (st.아니라한것.n) 줄.push(`<p>엔진이 <b>아니라</b>고 한 ${st.아니라한것.n}건 중 <b>${st.아니라한것.맞음}건</b>이 실제로 그랬습니다.</p>`);
      $('memoStat').innerHTML = 줄.join('') || '<p>아직 판단이 갈릴 만한 기록이 없습니다.</p>';
    }
  }

  $('btnMemoAdd').onclick = () => {
    const M = window.ChaeksaMemo;
    const q = $('memoQ').value.trim();
    if (!q) { $('memoQ').focus(); return; }
    if (memoKind === 'track') M.track(memoPersonId(), q);
    else M.add(memoPersonId(), q, +$('memoY').value, +$('memoM').value, R);
    $('memoQ').value = '';
    renderMemo(); renderHome(); renderToday();
  };

  // 비서가 먼저 말을 거는 자리 — 오늘 탭 맨 위
  function renderTodayMemo() {
    const M = window.ChaeksaMemo, box = $('todayMemo'); if (!M || !box) return;
    const pid = memoPersonId();
    const due = M.due(pid, today);
    const 미기록 = M.tracks(pid).filter(t => !M.loggedThisMonth(t, today));
    box.classList.toggle('hide', !due.length && !미기록.length);
    if (!due.length && !미기록.length) return;
    if (!due.length) {
      // 계속 지켜보는 일 — 이번 달을 아직 안 적었다
      const t0 = 미기록[0];
      box.innerHTML = `<h2>記 · 지켜보고 있는 것</h2>
        <div class="brief" style="font-size:15px"><p><b>${esc(t0.q)}</b> — 이번 달은 어떻습니까?</p>
        <p style="color:var(--ink2)">${(t0.logs || []).length}달치가 쌓여 있습니다${미기록.length > 1 ? ` (외 ${미기록.length - 1}건)` : ''}.</p></div>
        <button class="btn ghost small" id="btnTodayMemoGo" style="margin-top:10px">비망록 열기</button>`;
      $('btnTodayMemoGo').onclick = () => go('memo');
      return;
    }
    const it = due[0];
    const 지남 = it.ym < (today.getFullYear() * 100 + today.getMonth() + 1);
    box.innerHTML = `<h2>記 · 말씀하신 것</h2>
      <div class="brief" style="font-size:15px"><p>${esc(it.q)} — <b>${M.label(it.ym)}</b>${지남 ? '이 지났습니다.' : '입니다.'}</p>
      ${it.verdict ? `<p style="color:var(--ink2)">그때 제 판단은 <b>${esc(josa(it.verdict.grade, '이었습니다', '였습니다'))}</b>. ${esc(it.verdict.line)}</p>` : ''}</div>
      <button class="btn ghost small" data-open="memo" style="margin-top:10px">비망록 열기</button>`;
    box.querySelector('[data-open]').onclick = () => go('memo');
  }


  // ───── 열두 달 흐름 — 세운도 ─────
  let yearPick = today.getFullYear();
  function renderYear() {
    const T = window.ChaeksaTypecard; if (!T || !$('yearSvg')) return;
    const ys = [today.getFullYear(), today.getFullYear() + 1];
    $('yearSeg').innerHTML = ys.map(y =>
      `<button data-y="${y}" class="${y === yearPick ? 'on' : ''}">${y}년</button>`).join('');
    $('yearSeg').querySelectorAll('button').forEach(b => b.onclick = () => { yearPick = +b.dataset.y; renderYear(); });
    const yf = T.yearFlow(R, yearPick, today);
    $('yearSvg').innerHTML = T.drawYearFlow(profile.name || '공주님', yf);
    const fl = $('yearFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
    $('yearWrap').classList.remove('hide');
    $('yearNote').textContent = yf.year + '년 ' + E.fmt.pillar(yf.yearPillar) + '년 · '
      + yf.kind + ' · ' + (yf.남은표기 ? '남은 달 중 최고 ' : '가장 좋은 달 ') + yf.bestTxt;
    $('btnYearShare').onclick = async () => {
      const b = $('btnYearShare'); b.disabled = true; b.textContent = '만드는 중…';
      try {
        const r = await T.share($('yearSvg').innerHTML, '세운도_' + yf.year);
        b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
      } catch (e) { b.textContent = '다시 시도'; }
      b.disabled = false;
      setTimeout(() => { b.textContent = '세운도 자랑하기'; }, 2500);
    };
  }

  // ───── 인생 곡선 — 대운도 ─────
  // 표본이 필요 없어 즉시 그린다. 곡선은 원국과 대운만으로 나온다.
  function renderLife() {
    const T = window.ChaeksaTypecard; if (!T || !$('lifeSvg')) return;
    if ($('gu-life')) $('gu-life').classList.toggle('hide', !profile.genderUnknown);
    const lc = T.lifeCurve(R, today);
    $('lifeSvg').innerHTML = T.drawLifeCurve(profile.name || '공주님', lc);
    const fl = $('lifeFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
    $('lifeWrap').classList.remove('hide');
    $('lifeNote').textContent = lc.kind + '형 · 최고 구간 ' + lc.peakTxt + ' · 대운은 열 해마다 바뀌고, 같은 사주는 언제나 같은 곡선입니다';
    $('btnLifeShare').onclick = async () => {
      const b = $('btnLifeShare'); b.disabled = true; b.textContent = '만드는 중…';
      try {
        const r = await T.share($('lifeSvg').innerHTML, '대운도_' + lc.peak.startAge + '세');
        b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
      } catch (e) { b.textContent = '다시 시도'; }
      b.disabled = false;
      setTimeout(() => { b.textContent = '대운도 자랑하기'; }, 2500);
    };
  }

  // ───── 천직 — 천직첩 ─────
  let jikFor = null;
  function renderJikcheop() {
  /** 官을 따라간 네 축을 펼친다(docs/27 영역관제).
   *  의논에서는 칸이 없어 뚜렷한 하나둘만 말한다 — **여기서는 넷을 다 편다.**
   *  계산은 typecard.영역축() 한 곳에 있다. 여기서는 그리기만 한다. */
  function 그림영역(R) {
    const T = window.ChaeksaTypecard, wrap = $('yeongList'), card = $('yeongCard');
    if (!T || !T.영역축 || !wrap || !card) return;
    let F = null; try { F = T.간명자료(R, new Date()); } catch (e) { return; }
    const 축 = T.영역축((F.자평진전 || {}).힘, (F.천직 || {}).축 || '', R);
    if (!축.length) { card.classList.add('hide'); return; }
    // 「관없음」의 제목은 갈래를 따라간다. 셋을 한 제목으로 부르면
    // 밀어내는 사람에게 「아직 안 나왔습니다」라고 말하게 된다(2026-09-01 조문).
    const 없음표 = { 밀어냄: '자리를 밀어내고 계십니다', 못받음: '받칠 것을 먼저 세우는 자리',
                     아직: '아직 자리가 안 나왔습니다' };
    const 이름표 = { 비겁: '자리와 나의 크기', 식상: '내놓는 것과 자리',
                     재성: '벌이와 자리', 인성: '자리가 돌려주는 것' };
    const 관계 = { 비겁: '官剋我', 식상: '食傷剋官', 재성: '財生官', 인성: '官生印', 관없음: '' };
    wrap.innerHTML = 축.map((a, i) => {
      // 관없음 줄에는 이 배지를 안 붙인다 — 본문이 이미 「자리가 겉에 없습니다」로 시작하고,
      // 「자리를 밀어내고 계십니다 · 겉으로는 안 나와 있어요」는 서로 어긋나 읽힌다.
      const 셈 = (a.살아있나 || a.이름 === '관없음') ? ''
        : '<span class="hint" style="font-size:11px"> · 겉으로는 안 나와 있어요</span>';
      const 표 = (i === 0 && a.이름 !== '관없음')
        ? '<span class="hint" style="font-size:11px;font-weight:700"> · 가장 뚜렷한 축</span>' : '';
      return '<div style="padding:11px 0;border-top:1px solid var(--line2)">'
        + '<div style="font-weight:700;font-size:13.5px">'
        + esc(a.이름 === '관없음' ? (없음표[a.갈] || 없음표.아직) : (이름표[a.이름] || a.이름))
        + (관계[a.이름] ? '<span class="hint" style="font-weight:400;font-size:11px"> ' + 관계[a.이름] + '</span>' : '')
        + 표 + 셈 + '</div>'
        + '<div style="margin-top:4px;line-height:1.62">' + esc(a.말) + '</div></div>';
    }).join('');
    card.classList.remove('hide');
    그림영역해(R);
  }

  // 자리가 열리는 해 — 官으로 잡은 열 해. 새 계산은 typecard.영역해 하나에 있다.
  // 화면에서 지키는 것 둘: 열림과 흔들림을 한 줄에 안 섞고(제24조),
  // 女命의 두 얼굴도 문장을 나눠 적는다(docs/28 다섯).
  function 그림영역해(R) {
    const T = window.ChaeksaTypecard, card = $('yeongYearCard'),
          bars = $('yeongYearBars'), list = $('yeongYearList');
    if (!T || !T.영역해 || !card || !bars || !list) return;
    let v = null; try { v = T.영역해(R, new Date().getFullYear(), 10); } catch (e) { return; }
    if (!v || !v.rows.length) { card.classList.add('hide'); return; }

    const 좋 = (v.좋은해 || []).map(g => g.해);
    bars.innerHTML = v.rows.map(r => {
      const h = Math.max(3, Math.round(r.점수 / 100 * 58));
      const on = 좋.indexOf(r.해) >= 0;
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">'
        + '<div style="width:100%;height:' + h + 'px;border-radius:3px;background:'
        + (on ? 'var(--accent,#b0567a)' : 'var(--line2,#e2cfc4)') + '"></div>'
        + '<div class="hint" style="font-size:10px' + (on ? ';font-weight:700' : '') + '">'
        + String(r.해).slice(2) + '</div></div>';
    }).join('');

    const 줄 = [];
    줄.push('<div style="padding:11px 0;border-top:1px solid var(--line2);font-weight:700">'
      + esc(v.말) + '</div>');
    (v.좋은해 || []).slice().sort((a, b) => a.해 - b.해).forEach(g => {
      줄.push('<div style="padding:9px 0;border-top:1px solid var(--line2)">'
        + '<div style="font-weight:700;font-size:13.5px">' + g.해 + '년'
        + '<span class="hint" style="font-weight:400;font-size:11px"> ' + esc(g.간지) + '</span></div>'
        + '<div style="margin-top:4px;line-height:1.62">' + esc(g.이유[0] || '') + '</div>'
        + (g.이유[1] ? '<div style="margin-top:2px;line-height:1.62">' + esc(g.이유[1]) + '</div>' : '')
        // 자리가 오는데 겉에 선 상관이 그것을 치는 해 — 열림을 지우지 않고 한 줄로 덧댄다
        + (g.견관 ? '<div class="hint" style="margin-top:4px;line-height:1.62">' + esc(g.견관) + '</div>' : '')
        + '</div>');
    });
    (v.흔들해 || []).forEach(r => {
      줄.push('<div style="padding:9px 0;border-top:1px solid var(--line2)">'
        + '<div style="font-weight:700;font-size:13.5px">' + r.해 + '년'
        + '<span class="hint" style="font-weight:400;font-size:11px"> ' + esc(r.간지)
        + ' · 자리가 흔들리는 해</span></div>'
        + '<div style="margin-top:4px;line-height:1.62">' + esc(r.흔들) + '</div></div>');
    });
    if ((v.겹침 || []).length) {
      // 「좋은 사람도 오고 자리도 열립니다」는 한 문장 두 주장이라 안 쓴다. 문장을 나눈다.
      줄.push('<div style="padding:11px 0;border-top:1px solid var(--line2)">'
        + '<div class="hint" style="line-height:1.62">'
        + esc(v.겹침.slice().sort((a, b) => a - b).join('년 · ') + '년은 인연 쪽에서도 같은 해로 잡힙니다. ')
        + '<b>다른 이야기입니다</b> — 관(官) 한 글자가 곁에 서는 사람이기도 하고 공주님이 설 자리이기도 해서, 같은 해가 두 번 잡히는 것뿐입니다.</div></div>');
    }
    list.innerHTML = 줄.join('');
    card.classList.remove('hide');
  }

    const T = window.ChaeksaTypecard; if (!T || !$('jikSvg')) return;
    if (jikFor === R) return;
    $('jikWrap').classList.add('hide'); $('jikNote').textContent = '';
    $('jikProg').classList.remove('hide');
    $('jikProg').textContent = '적성을 재는 중\u2026';
    T.buildSample(
      (r) => { $('jikProg').textContent = '적성을 재는 중\u2026 ' + Math.round(r * 100) + '%'; },
      (sample) => {
        const v = T.career(R, sample);
        jikFor = R;
        $('jikProg').classList.add('hide');
        $('jikSvg').innerHTML = T.drawJikcheop(profile.name || '공주님', v);
        const fl = $('jikFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
        $('jikWrap').classList.remove('hide');
        $('jikNote').textContent = v.key + ' \u00b7 ' + v.name + ' \u2014 지어낸 사주 ' + v.n.toLocaleString() + '개 중 같은 유형 ' + v.share + '%';
        그림영역(R);
        $('btnJikShare').onclick = async () => {
          const b = $('btnJikShare'); b.disabled = true; b.textContent = '만드는 중\u2026';
          try {
            const r = await T.share($('jikSvg').innerHTML, '천직첩_' + v.name);
            b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 \u2014 Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
          } catch (e) { b.textContent = '다시 시도'; }
          b.disabled = false;
          setTimeout(() => { b.textContent = '천직첩 자랑하기'; }, 2500);
        };
      });
  }

  // ───── 연애·인연 — 도화첩 ─────
  // ───── 지칠 때와 채울 때 ─────
  let jcFor = null;
  function renderJichim() {
    const T = window.ChaeksaTypecard; if (!T || !T.jichim || !$('jcSvg')) return;
    if (jcFor === R) return;
    const v = T.jichim(R); jcFor = R;
    $('jcSvg').innerHTML = T.drawJichim(profile.name || '공주님', v);
    const fl = $('jcFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
    { const nx = $('jcNext'); if (nx) nx.innerHTML = nextStep(
      '이번 달은 어느 쪽으로 새고 있을까요', '타고난 것까지',
      '무엇에 지치는지는 원국이 정합니다. 그런데 「지금」은 다릅니다 — 이번 달 어느 쪽으로 기울어 있고 언제 숨이 트이는지는 월운·일운까지 내려가야 보입니다.',
      (profile.name || '') + '님 상담 — 요즘 왜 이렇게 지치는지, 언제 풀리는지 보고 싶습니다',
      'month'); }        // 상품이 빠져 있어 벽만 서고 문이 없었다
    $('jcNote').textContent = '채우는 것은 ' + v.채.map(k => k.오행).join('·')
      + (v.빈.length ? ' · 평생 얇은 고리는 ' + v.빈.map(b => b.오행).join('·') : '') + '입니다.';
    $('btnJcShare').onclick = async () => {
      const b = $('btnJcShare'); b.disabled = true; b.textContent = '만드는 중…';
      try { const r = await T.share($('jcSvg').innerHTML, '지칠때와채울때');
        b.textContent = r === 'shared' ? '공유 완료!' : r === 'copied' ? '복사됐어요' : '다운로드 폴더에 저장했어요';
      } catch (e) { b.textContent = '다시 시도'; }
      b.disabled = false; setTimeout(() => { b.textContent = '카드 저장·공유'; }, 2500);
    };
  }

  // ───── 내 편이 되어주는 사람 ─────
  let npFor = null;
  function renderNaepyeon() {
    const T = window.ChaeksaTypecard; if (!T || !T.naepyeon || !$('npSvg')) return;
    if (npFor === R) return;
    const v = T.naepyeon(R, today);
    npFor = R;
    $('npSvg').innerHTML = T.drawNaepyeon(profile.name || '공주님', v);
    const fl = $('npFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
    { const nx = $('npNext'); if (nx) nx.innerHTML = nextStep(
      '지금 곁에 있는 사람은 어떤가요', '어떤 결이 힘이 되는지까지',
      '결은 원국이 정하지만, 실제로 곁에 있는 사람이 나에게 어떻게 작용하는지는 두 사주를 마주 놓아야 나옵니다. 이번 달 그 사람이 나에게 어느 쪽으로 오는지도요.',
      (profile.name || '') + '님 상담 — 지금 곁에 있는 사람이 저에게 어떤 사람인지 보고 싶습니다',
      'relation'); }     // 상품이 빠져 있어 벽만 서고 문이 없었다
    $('npNote').textContent = '채워야 할 기운은 ' + v.결.map(k => k.오행).join('·')
      + '입니다. 생일을 아시는 분이라면 일간이 '
      + v.결.map(k => k.일간.join('·')).join(' 또는 ') + '인지 보시면 됩니다.';
    $('btnNpShare').onclick = async () => {
      const b = $('btnNpShare'); b.disabled = true; b.textContent = '만드는 중…';
      try {
        const r = await T.share($('npSvg').innerHTML, '내편이되는사람');
        b.textContent = r === 'shared' ? '공유 완료!' : r === 'copied' ? '복사됐어요' : '다운로드 폴더에 저장했어요';
      } catch (e) { b.textContent = '다시 시도'; }
      b.disabled = false;
      setTimeout(() => { b.textContent = '카드 저장·공유'; }, 2500);
    };
  }

  // ───── 인연이 오는 해 ─────
  let inyeonFor = null;
  function renderInyeon() {
    const T = window.ChaeksaTypecard; if (!T || !T.inyeon || !$('inSvg')) return;
    if ($('gu-inyeon')) $('gu-inyeon').classList.toggle('hide', !profile.genderUnknown);
    if (inyeonFor === R) return;
    const v = T.inyeon(R, today.getFullYear(), 10);
    inyeonFor = R;
    $('inSvg').innerHTML = T.drawInyeon(profile.name || '공주님', v);
    const fl = $('inFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
    const inNext = $('inNext');
    const paidIn = window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('inyeon');
    if (inNext && v.첫해 && paidIn && T.inyeonMonths) {
      // 결제 열람 — 막대 열두 개로 끝내지 않는다. 달마다 서술하고,
      // 열리는 달은 날짜까지 내리고, 잣대를 공개한다. 이게 2만원의 생김새다.
      const y = v.첫해.해, im = T.inyeonMonths(R, y);
      const h = im.머리;
      const why = T.inyeonWhy ? T.inyeonWhy(R) : null;
      const 진단절 = why ? `<div class="nx-diag pbd"><p class="nx-diag-k">왜 공주님께는 이 답인가</p>${why.말.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : '';
      const 머리말 = 진단절 + `<p class="pb-lede">${y}년은 <b>${esc(h.세운간지)}</b>의 해 — ${esc(profile.name || '공주님')}님께는
        <b>${esc(h.세운십신)}</b>의 해입니다${h.대운간지 ? `, ${esc(h.대운간지)} 대운(${esc(h.대운십신)}) 위에 얹혀 옵니다` : ''}.
        아래는 이 해 열두 달을 <b>${esc(h.배우자이름)}(인연의 글자)</b>과 <b>배우자 자리(일지)의 합·충</b>으로 잰 것입니다.</p>`;
      const 달들 = im.rows.map(r => {
        const open = im.열림.indexOf(r.월) >= 0;
        const days = im.날들[r.월];
        return `<div class="pb-month${open ? ' open' : ''}">
          <div class="pb-row"><b>${r.월}월</b>
            <span class="gz2">${esc(r.간지)}</span>
            <div class="pb-bar"><i style="width:${r.점수}%"></i></div>
            <span class="pb-god">${esc(r.십신)}</span></div>
          ${r.이유.map(t => `<p class="pb-why">◦ ${esc(t)}</p>`).join('')}
          <p class="pb-say">${esc(r.결)}</p>
          ${open && days && days.length ? `<p class="pb-days">그중 날을 고르면 — ${days.map(d =>
            `<b>${r.월}/${d.일}(${d.요일})</b>`).join(' ')}<br><span class="pb-days-why">${esc(days[0].왜)} 등 같은 잣대로 고른 날들입니다</span></p>` : ''}
        </div>`;
      }).join('');
      inNext.innerHTML = `<div class="paidbox"><p class="pb-k">결제 열람 — ${y}년 열두 달</p>
        ${머리말}${달들}
        <p class="pb-ft"><b>${im.열림.length ? '열리는 달 — ' + im.열림.join('·') + '월' : '크게 열리는 달이 없는 해입니다 — 이럴 때는 다음 해 초입을 같이 보는 게 맞습니다'}</b>${im.조용 ? ' · ' + im.조용.월 + '월이 가장 조용합니다' : ''}</p>
        <p class="pb-ft">잣대 공개 — 해 카드와 같습니다: ${esc(h.배우자이름)}이 하늘에 오는가, 배우자 자리(일지)와 합·삼합·충이 되는가. 같은 해 안에서의 서열이라 다른 해와 점수를 비교하시면 안 됩니다. 대운은 성별로 순역이 갈립니다.</p>
        <p class="pb-ft">읽으시다 「내 사주는 판정이 갈린다」는 표시를 원국 탭에서 보셨다면, 그 갈림이 이 달 서열을 바꿀 수 있습니다 — 갈리는 자리는 원국 탭에 그대로 적어 두었습니다.</p></div>`;
        } else if (inNext && v.첫해) inNext.innerHTML = nextStep(
      '그 해, 어느 달일까요',
      v.첫해.해 + '년까지',
      v.첫해.해 + '년 열두 달 중 어느 달에 열리는지, 열리는 달의 날짜까지 같은 잣대로 내려가 보여드립니다.',
      (profile.name || '') + '님 인연 시기 상담 — ' + v.첫해.해 + '년 중 어느 달인지 보고 싶습니다', 'inyeon',
      T.inyeonWhy ? T.inyeonWhy(R).말 : null);
    $('inNote').textContent = v.말 + ' · 배우자성은 ' + v.배우자이름
      + '(' + (v.남 ? '남성 기준' : '여성 기준') + ')입니다. 이 순위는 열 해 안에서의 서열입니다.';
    $('btnInShare').onclick = async () => {
      const b = $('btnInShare'); b.disabled = true; b.textContent = '만드는 중…';
      try {
        const r = await T.share($('inSvg').innerHTML, '인연이오는해');
        b.textContent = r === 'shared' ? '공유 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
      } catch (e) { b.textContent = '다시 시도'; }
      b.disabled = false;
      setTimeout(() => { b.textContent = '카드 저장·공유'; }, 2500);
    };
  }

  // ── 너의 연애 스토리 — 과거를 맞히면 미래를 산다 ──
  // 무료: 과거 구간 찍기 + 현재 판. 유료(인연 시기 상품): 미래.
  // 과거와 미래가 같은 잣대라는 것이 이 화면의 값어치다 — 그래서 그 말을 화면에 적는다.
  let lsFor = null;
  // ── 간명서 — 번호 문항 통변 + 문항별 [맞다/애매/아니다] ──
  // 채팅 간명이 친구 채점 90%를 받았다. 그 형식(문항·채점·정직)이 제품이다.
  let gmFor = null;
  // 간명서는 무료다(2026-08-29 「첫화면에 바로 뿌려버려 — 무조건 신뢰를 얻어야 해」).
  // 신뢰를 파는 게 아니라 먼저 준다. 유료 선은 미래의 해상도(달·날·시)에만 남는다.
  // GM_VER: 간명 프롬프트 판 — 말투·형식을 고치면 올린다. 캐시가 새 판으로 한 번만 재굽기.
  // 오늘 나온 책사 — [초상 키, 이름, 데려갈 화면, 아뢰는 말]
  // 말은 권유지 판단이 아니다. 명리 주장은 각 화면이 제 계산으로 한다.
  // 초상이 아직 없을 때 얼굴 자리에 세울 인장
  const 책사인장 = { 자평진전: '格', 궁통보감: '候', 억부: '抑', 궁위: '宮',
                     인연: '緣', 재물: '財', 천직: '職', 운로: '運',
                     택일: '擇', 좌장: '策' };
  // 이름과 직함 — 「억부」는 학술 용어지 사람 이름이 아니다. 부를 이름을 주되
  // 축(고전 이름)은 직함으로 남긴다: 그것이 우리 신뢰 자산이라 버릴 수 없다.
  // AI 는 계속 축 이름으로 적고, 화면이 그릴 때만 이름으로 바꿔 세운다 —
  // 그래야 이미 구워진 의논도 판을 안 올리고 새 이름으로 열린다.
  const 책사이름 = {
    자평진전: ['정율', '법도를 보는'], 궁통보감: ['온서', '계절을 보는'],
    억부:     ['형준', '저울을 든'],   궁위:     ['성아', '자리를 읽는'],
    인연:     ['연희', '인연을 맡은'], 재물:     ['계상', '셈에 밝은'],
    천직:     ['장현', '일을 보는'],   운로:     ['소현', '멀리 보는'],
    택일:     ['검명', '때를 고르는'],   좌장:     ['태윤', '책사단을 이끄는'],
  };
  // 사람 이름으로 온 것도 축으로 되돌린다 — 보험이다.
  // AI 는 프롬프트대로 축 이름(〔택일〕)을 적고 화면이 사람 이름으로 바꿔 세운다.
  // 다만 언젠가 〔검명〕으로 적어 오면 얼굴이 안 붙는다(책사키에 사람 이름이 없다).
  // 그때 조용히 헐벗지 않도록 둘 다 받아 준다.
  const 사람에서축 = (() => {
    const m = {};
    Object.keys(책사이름).forEach(k => { m[책사이름[k][0]] = k; });
    return m;
  })();
  const 축으로 = (who) => (책사이름[who] ? who : (사람에서축[who] || who));
  const 이름of = (who) => { const 축 = 축으로(who); return (책사이름[축] || [축])[0]; };
  const 직함of = (who) => { const 축 = 축으로(who); return (책사이름[축] || ['', ''])[1] || ''; };
  const 오늘의책사 = [
    ['jwajang', '좌장', 'compat', '두 분 사이가 서로에게 무엇인지 읽어 드리겠습니다.'],
    ['inyeon', '인연', 'inyeon', '앞으로 열 해 가운데 어느 해에 기우는지 짚어 드리겠습니다.'],
    ['gungtong', '궁통보감', 'today', '오늘의 기운이 공주님께 추운지 더운지 봐 드리겠습니다.'],
    ['jaemul', '재물', 'nokpae', '공주님의 그릇이 몇 섬인지, 상위 몇 %인지 세어 드릴까요.'],
    ['eokbu', '억부', 'jichim', '무엇이 공주님을 깎고 무엇이 채우는지 짚어 드리겠습니다.'],
    ['unro', '운로', 'life', '언제가 두터워지고 언제가 담금질인지 곡선으로 펴 드릴까요.'],
    ['japyung', '자평진전', 'me', '격이 섰는지 무너졌는지, 원국을 펴 보여 드리겠습니다.'],
    ['cheonjik', '천직', 'jikcheop', '스물다섯 결 가운데 공주님이 어느 쪽인지 아뢰겠습니다.'],
    ['hyeopgi', '택일', 'cal', '좋은 날을 고르는 일은 제 몫입니다. 달력을 펴 보시겠습니까.'],
    ['gungwi', '궁위', 'dohwa', '곁자리에 앉은 글자가 누구를 가리키는지 보시겠습니까.'],
  ];
  // ── 발언자 표시 — 무료 의논과 유료 본문이 함께 쓴다 ──
  // 초상은 app/art/chaeksa-<키>.webp. 없으면 onerror 로 스스로 사라져 글자 칩만 남는다 —
  // 그림이 도착하는 순서대로 화면이 좋아진다.
  const 책사키 = { 자평진전: 'japyung', 궁통보감: 'gungtong', 억부: 'eokbu', 궁위: 'gungwi',
                   인연: 'inyeon', 재물: 'jaemul', 천직: 'cheonjik', 운로: 'unro',
                   택일: 'hyeopgi', 좌장: 'jwajang' };
  // 몇 벌 그려져 있는지는 config.js 가 안다 — 그림이 도착하면 거기 숫자만 올린다.
  // 스물일곱 장을 그려 놓고 열 장만 쓰고 있었다(2026-08-30). 열일곱 장이 놀았다.
  // 있는 벌의 목록. 숫자가 곧 파일 꼬리다(1 이면 꼬리 없음).
  // 중간이 빈 사람이 있어서(성아는 1·2·4) 개수가 아니라 목록으로 받는다.
  const 벌목록 = (k) => {
    const v = window.CHAEKSA_FACE_VAR && window.CHAEKSA_FACE_VAR[k];
    if (Array.isArray(v)) return v;
    const n = v || 0;                       // 옛 방식(숫자)도 받아 준다
    const a = []; for (let i = 1; i <= n; i++) a.push(i); return a;
  };
  const 얼굴파일 = (k, i) => 'art/chaeksa-' + k + (i > 1 ? '-' + i : '') + '.webp';
  /** 이 책사의 지금 얼굴.
   *  · 받아치는 발언이면 3벌(몸을 기울여 반박하는 얼굴)을 세운다 — 그림이 말을 거든다.
   *  · 아니면 나머지 벌을 (날 + 자리)로 돌린다. 한 편 안에서 정율이 세 번 말하면
   *    세 번 다른 얼굴이고, 내일 다시 열면 같은 글이라도 얼굴이 바뀌어 있다.
   *  난수가 아니라 결정이라 같은 날 같은 자리는 늘 같은 얼굴이다. */
  function 초상(k, 자리, 받아침) {
    const 벌 = 벌목록(k);
    if (!벌.length) return '';           // 그림이 없는 책사 — 인장만 세운다(소현)
    if (벌.length === 1) return 얼굴파일(k, 벌[0]);
    if (받아침 && 벌.indexOf(3) >= 0) return 얼굴파일(k, 3);
    const 평 = 벌.filter(i => i !== 3);   // 받아치는 얼굴은 평상시에 안 쓴다 — 아껴야 세진다
    if (!평.length) return 얼굴파일(k, 벌[0]);
    // 같은 책사의 발언은 자리가 고르게 벌어져 있다(①③⑤⑦). 그래서 자리에
    // 산술식을 씌우면 그 간격이 벌 수와 맞아떨어지는 순간 통째로 겹친다 —
    // 「자리 + 자리/2」는 3씩 뛰어서 벌이 셋일 때 네 발언이 다 같은 얼굴이었다.
    // 곱셈 해시로 흩는다(황금비 상수). 여전히 결정적이라 같은 날 같은 자리는 같은 얼굴.
    const 섞 = (n) => (Math.imul((n | 0) + 1, 2654435761) >>> 0);
    const 씨 = (섞(자리 || 0) + 날번호() * 2654435761) >>> 0;
    return 얼굴파일(k, 평[씨 % 평.length]);
  }
  /** 이 발언이 다른 책사를 걸고 넘어지는가 — 남의 이름이 본문에 나오면 받아침이다.
   *  조립기는 「온서께서 살길이라 하신 그 글자가…」처럼 사람 이름으로 인용한다.
   *  **축 이름으로는 안 찾는다** — 「인연」·「재물」·「천직」은 축 이름이자 일상 낱말이라
   *  온서가 인연을 입에 담기만 해도 받아친 것이 되어 버린다(오탐).
   *  다만 책 이름 둘은 인용 말고 나올 자리가 없어 같이 본다. */
  const 인용어 = (() => {
    const m = {};
    Object.keys(책사이름).forEach(축 => { m[축] = [책사이름[축][0]]; });
    m.자평진전.push('자평진전'); m.궁통보감.push('궁통보감');
    return m;
  })();
  function 받아치는가(본문, 화자) {
    const 나 = 축으로(화자);
    return Object.keys(인용어).some(축 =>
      축 !== 나 && 인용어[축].some(w => 본문.indexOf(w) >= 0));
  }
  const 얼굴 = (who) => {
    const k = 책사키[축으로(who)]; if (!k) return '';
    return '<img src="art/chaeksa-' + k + '.webp" alt="" onerror="this.remove()">';
  };
  const 발언자류 = /^([\u2460-\u2473])?\s*\u3014([^\u3015]{1,12})\u3015\s*/;
  /** 한 줄을 발언으로 그린다(발언자가 아니면 그냥 문단) */
  /** 얼빡 — 화자가 말을 시작할 때 얼굴이 크게 선다.
   *  22px 동그라미는 단추지 얼빡이 아니다(2026-08-30 「잘생긴애들이 얼빡으로 나와야지」).
   *  인장을 늘 뒤에 깔아 두므로 그림이 없거나 못 받아와도 빈 액자가 되지 않는다 —
   *  onerror 로 지우는 방식은 안 쓴다. */
  function 얼굴띠(who, 자리, 받아침) {
    const 축 = 축으로(who);
    const k = 책사키[축];
    const 인 = esc(책사인장[축] || String(who).slice(0, 1));
    // 변주가 못 오면 대표 그림으로 한 번 물러난다. 그것도 없으면 인장만 남는다 —
    // 인장을 늘 뒤에 깔아 두므로 빈 액자가 되지 않는다.
    // 그림이 아예 없는 책사(소현)는 초상()이 빈 문자열을 돌려준다 — img 를 안 세운다.
    const 파일 = k ? 초상(k, 자리, 받아침) : '';
    const 그림 = (파일 && window.CHAEKSA_ART)
      ? '<img class="say-face" alt="" data-base="' + 얼굴파일(k, (벌목록(k)[0] || 1)) + '?v=' + window.CHAEKSA_ART + '"'
        + ' src="' + 파일 + '?v=' + window.CHAEKSA_ART + '"'
        + ' onerror="var b=this.dataset.base;'
        + 'if(b){this.removeAttribute(\'data-base\');this.src=b;return;}this.remove()">'
      : '';
    return '<div class="say-head"><span class="say-seal">' + 인 + '</span>' + 그림
      + '<span class="say-id"><b>' + esc(이름of(who)) + '</b>'
      + '<span>' + esc(직함of(who)) + '</span></span></div>';
  }
  /** 한 줄. 새화자가 아니면(false) 얼굴 띠를 세우지 않는다. */
  function 발언줄(t, 새화자) {
    t = String(t).trim(); if (!t) return '';
    const m = t.match(발언자류);
    if (!m) return '<p>' + esc(t) + '</p>';
    // 발언 번호(①②③…)가 곧 자리다. 번호가 없는 줄(맺음말)은 0.
    const 자리 = m[1] ? m[1].charCodeAt(0) - 0x2460 : 0;
    const 본문 = t.slice(m[0].length);
    return (새화자 === false ? '' : 얼굴띠(m[2], 자리, 받아치는가(본문, m[2])))
      + '<p class="gm-say">' + (m[1] ? '<span class="gm-num">' + m[1] + '</span>' : '')
      + esc(본문) + '</p>';
  }
  /** 여러 줄. 같은 책사가 이어 말하면 얼굴을 다시 세우지 않는다 —
   *  안 그러면 무료 의논 스무 발언에 얼굴이 스무 번 나온다. */
  function 발언들(줄들) {
    let 앞 = null;
    return 줄들.map(function (t) {
      const m = String(t).trim().match(발언자류);
      const who = m ? m[2] : null;
      const 새 = !!who && who !== 앞;
      if (who) 앞 = who;
      return 발언줄(t, 새);
    }).join('');
  }
  // v13: 열 목소리 · 좌장의 맺음 · 분배 상한 · 벽 자르기 · 유령 인용 제거(2026-08-30).
  //      판을 안 올리면 이미 다녀가신 분은 옛 의논에 갇혀 오늘 한 일이 안 보인다.
  // v14 (2026-08-31) — 소현의 갈림 한 줄이 거짓이었다. 이미 조립된 의논에도 그 줄이
  // 굳어 있으므로 판을 올려 전부 다시 조립시킨다(조립은 공짜다).
  // 대가: LLM 으로 구워 둔 의논이 있는 분은 조립본으로 바뀐다. 개통 전이라 시험판뿐이다.
  // v15 (2026-08-31) — 채점을 들어냈다. 좌장의 맺음말이 채점을 청하고 있어서
  // 이미 조립된 의논에도 그 부탁이 굳어 있다. 판을 올려 다시 조립시킨다(공짜다).
  // v16 (2026-08-31) — 온서의 기신 문장이 바뀌었다. 감점과 무관한 오행을
  // 대던 것을 실제 원인 글자로 고쳤고, 보좌 빈 칸에서 문장이 사라지던 것도 풀었다.
  // v17 (2026-08-31) — 변주 고르는 법이 바뀌었다(자리별로 독립, 씨앗은 여덟 글자).
  // 이미 조립된 의논은 옛 방식으로 뽑힌 말이라 다시 짠다. 조립기라 공짜다.
  const GM_VER = 'v18';   // v18 — 영역관제(docs/27): 존재→위치 · 처방→서술 · 官 네 축
  // 키에 **성별과 분**이 빠져 있었다. 성별은 배우자성을 가르고(남=재성·여=관성)
  // 분은 시진 경계를 가르므로, 같은 연월일시라도 의논이 다르다.
  // 관문을 내린 뒤로 「이 생일 저 생일 넣어보기」가 기본 동작이 되므로
  // 이 구멍은 **남의 의논을 보여주는 구멍**이 된다. 옆의 story 키는 이미
  // 같은 이유로 성별을 넣고 있었다(app.js 의 chaeksa.storyai 키).
  const 간명키 = () => {
    const i = (R && R.input) || profile || {};
    return 'chaeksa.ganmyeong.' + GM_VER + '.'
      + [i.year, i.month, i.day, i.hour].join('.')
      + '.' + (i.minute || 0) + '.' + (i.gender || '?');
  };
  /** 현재 키의 캐시. 없으면 떠돌이(키 표기가 달라진 옛 캐시)를 주워 현재 키로 이관한다. */
  function 간명캐시() {
    const ck = 간명키();
    let t = localStorage.getItem(ck);
    if (!t) {
      // 이관은 **여덟 글자가 같을 때만** 한다.
      // 예전엔 「떠돌이가 하나면 가져온다」였는데, 그러면 남의 의논을 주워 온다 —
      // 관문을 내린 뒤로 한 기기에서 여러 생일을 넣어 보는 것이 기본이라
      // 떠돌이가 늘 생긴다. 의논 첫 줄에 사주 여덟 글자가 적혀 있으니 그걸 대조한다.
      const 떠돌이 = Object.keys(localStorage).filter(k => k.indexOf('chaeksa.ganmyeong.' + GM_VER + '.') === 0 && k.indexOf('.grade.') < 0 && k !== ck);
      let 내것 = null;
      try { 내것 = (window.ChaeksaTypecard && R) ? (ChaeksaTypecard.간명자료(R, today) || {}).사주 : null; } catch (e) {}
      if (내것) {
        떠돌이.some(k => {
          const v = localStorage.getItem(k) || '';
          if (v.indexOf(내것) !== 0) return false;      // 첫 줄이 내 사주로 시작해야 한다
          t = v;
          try { localStorage.setItem(ck, t); localStorage.removeItem(k);
            console.warn('간명 캐시 키 이관(사주 일치):', k, '→', ck); } catch (e) {}
          return true;
        });
      }
      if (!t && 떠돌이.length) { try { console.warn('떠돌이 캐시', 떠돌이.length, '개 — 사주가 달라 안 가져왔다. 현재 키:', ck); } catch (e) {} }
    }
    // 없으면 그 자리에서 조립한다 (chaeksadan.js). 원가 0원·지연 0초라 굽기를 기다릴 이유가 없다.
    // 이미 구워진 의논이 있는 분은 위에서 걸려 그대로 쓴다 — 아무도 제 것을 잃지 않는다.
    // 한 번 조립하면 저장한다 — 같은 사람에게 늘 같은 글이 나와야 한다.
    if (!t && R && window.ChaeksaDan) {
      try {
        t = ChaeksaDan.의논(R, today);
        if (t) localStorage.setItem(ck, t);
      } catch (e) { try { console.warn('의논 조립 실패:', e); } catch (e2) {} t = null; }
    }
    return t;
  }
  // ── 굽기와 기다림을 갈라놓는다 (2026-08-30 「토큰만 먹고 출력이 안 된다」) ──
  // 그날의 사고: 굽는 중이라는 응답을 받으면 20초 뒤 「같은 함수」를 다시 불렀다.
  // 그 함수는 프록시를 두드리는 함수라, 자물쇠가 3분 만에 풀리는 순간 새로 굽기 시작했다.
  // 죽은 굽기 → 자물쇠 → 폴링 → 자물쇠 만료 → 또 굽기. 3분마다 영원히 토큰만 탔다.
  // 이제 기다림은 서버 캐시를 「읽기만」 하고, 굽는 문은 간명예열() 하나뿐이다.
  const BAKING표식 = '§BAKING§';
  async function 간명서버읽기() {
    try {
      const C = window.ChaeksaCloud;
      if (!C || !C.api || !C.signedIn || !C.signedIn()) return null;
      const j = await C.api('/rest/v1/rpc/ganmyeong_get', {
        method: 'POST',
        body: JSON.stringify({ p_pk: 간명키().replace('chaeksa.ganmyeong.', '') }),
      });
      if (j && j.ok && j.hit && j.body && j.body.indexOf(BAKING표식) !== 0) return j.body;
    } catch (e) { try { console.warn('간명 캐시 조회 실패:', e); } catch (e2) {} }
    return null;
  }
  function 간명도착(t) {
    // 빈 응답을 캐시하면 화면이 영원히 빈 채로 「받았다」고 믿는다 — 실패로 다룬다.
    if (!t || String(t).length < 100) {
      간명예열.busy = false;
      간명말('의논이 비어서 돌아왔습니다 — [다시 시도]를 눌러 주세요.', true);
      return;
    }
    try { localStorage.setItem(간명키(), t); } catch (e) {}
    간명예열.busy = false; 간명예열.rounds = 0; 간명예열.fails = 0;
    chongFor = null;
    if (window.renderChongSoon) renderChongSoon();
    const g = $('gmBody'); if (g && g.isConnected) renderGanmyeong();
  }
  function 간명말(msg, 재시도) {
    const w = $('chongWait'); if (w) w.textContent = msg;
    const b = $('chongBake');
    if (재시도 && b) { b.disabled = false; b.textContent = '다시 시도'; }
    const g = $('gmBody');
    if (g && g.isConnected && !간명캐시()) {
      g.innerHTML = '<p class="hint">' + esc(msg) + '</p>'
        + (재시도 ? '<button class="btn" id="gmRetry">다시 시도</button>' : '');
      const r = $('gmRetry');
      if (r) r.onclick = () => { r.disabled = true; 간명예열.fails = 0; 간명예열(); };
    }
  }
  /** 굽는 중일 때의 기다림. 읽기만 하므로 공짜고, 절대 새로 굽지 않는다. */
  function 간명폴링() {
    간명예열.rounds = (간명예열.rounds || 0) + 1;
    if (간명예열.rounds > 25) {           // 5분
      간명예열.busy = false;
      간명말('의논이 예상보다 길어지고 있습니다 — 잠시 뒤 [다시 시도]를 눌러 주세요.', true);
      return;
    }
    간명서버읽기().then(t => {
      if (t) { 간명도착(t); return; }
      간명말('의논 중입니다 (' + (간명예열.rounds * 12) + '초). 이 화면을 벗어나셔도 계속됩니다.');
      setTimeout(간명폴링, 12000);
    });
  }
  function 간명예열() {
    // 이 앱에서 간명을 굽는 유일한 문. 다른 곳에서는 이것만 부른다.
    if (!R || !profile || !window.ChaeksaAI || !ChaeksaAI.ready || !ChaeksaAI.ready()) return;
    const ck = 간명키();
    if (localStorage.getItem(ck) || 간명예열.busy) return;
    간명예열.busy = true; 간명예열.rounds = 0;
    // 굽는 도중의 새로고침이 요청을 죽인다 — 「하도 새로고침하니까」(2026-08-30 실증).
    if (!간명예열.guard) {
      간명예열.guard = (e) => { if (간명예열.busy) { e.preventDefault(); e.returnValue = ''; } };
      window.addEventListener('beforeunload', 간명예열.guard);
    }
    // 굽기 전에 서버를 공짜로 한 번 본다 — 다른 기기나 끊긴 요청이 이미 구워 놨을 수 있다.
    간명서버읽기().then(있음 => {
      if (있음) { 간명도착(있음); return null; }
      return ChaeksaAI.ganmyeong(ChaeksaTypecard.간명자료(R, today), ck.replace('chaeksa.ganmyeong.', ''))
        .then(t => 간명도착(t))
        .catch(err => {
          if (err && err.baking) { 간명폴링(); return; }   // busy 유지 = 중복 굽기 차단
          간명예열.busy = false;
          const 원인 = (err && err.blocked && err.blocked.body) || (err && err.message) || String(err);
          try { console.warn('간명 실패:', err); } catch (e2) {}
          // 시간초과는 토큰을 이미 쓴 실패다 — 자동 재시도를 걸지 않는다. 손으로만 다시.
          const 자동 = !(err && (err.timeout || err.truncated || err.blocked)) && (간명예열.fails || 0) < 1;
          간명예열.fails = (간명예열.fails || 0) + 1;
          if (자동) {
            간명말('책사단을 부르지 못했습니다(' + 원인.slice(0, 90) + ') — 20초 뒤 한 번 더 시도합니다.');
            setTimeout(간명예열, 20000);
          } else 간명말('책사단을 부르지 못했습니다 — ' + 원인.slice(0, 120), true);
        });
    }).catch(() => { 간명예열.busy = false; });
  }
  async function renderGanmyeong() {
    const el = $('gmBody'); if (!el || !R || !profile) return;
    await mountGanmyeong(el, 'tab');
  }
  async function mountGanmyeong(el, whereTag) {
    const T = window.ChaeksaTypecard, AI = window.ChaeksaAI;
    const cacheKey = 간명키();
    let text = 간명캐시();
    if (!text) {
      el.innerHTML = '<p class="hint">책사단이 둘러앉았습니다 — 잰 것을 펴서 의논하는 중입니다 (약 1분). 이 화면을 벗어나셔도 의논은 계속됩니다.</p>';
      if (간명예열.busy) return;   // 이미 굽는 중 — 끝나면 다시 그려진다
      // 「로그인 상태를 확인해 주세요」라고 적혀 있었는데 AI.ready() 는 로그인과 무관하다
      // (기본 프록시가 있어 늘 참이다). 뜨더라도 엉뚱한 말이라 고쳤다.
      if (!AI || !AI.ready || !AI.ready()) { el.innerHTML = '<p class="hint">지금은 책사단을 부를 수 없습니다 — 설정에서 비서 연결을 확인해 주세요.</p>'; return; }
      // 여기까지 오는 일은 드물다 — 조립기가 원가 0으로 바로 써 주기 때문이다.
      // 조립기가 죽었을 때만 이 갈래가 산다.
      //
      // **손님은 굽지 못한다.** 서버가 401 로 막고 클라 한도도 0이라 돈은 안 새지만,
      // 여기서 간명예열() 을 부르면 실패만 하고 이상한 화면이 남는다. 사실대로 적는다.
      if (비로그인()) {
        el.innerHTML = '<p class="hint">책사단의 글은 <b>카카오로 남겨 두신 뒤에</b> 열립니다.'
          + ' 지금은 조립이 안 돼서 그렇습니다 — 잠시 뒤에 다시 열어 보셔도 됩니다.</p>';
        return;
      }
      // 서버에 구워진 것이 있으면 공짜로 가져온다.
      text = await 간명서버읽기();
      if (text) { try { localStorage.setItem(cacheKey, text); } catch (e2) {} }
      else {
        // **클릭 없이 굽지 않는다.** 앱을 여는 것만으로 돈이 나가면 안 된다 —
        // 바로 옆 renderChong 이 같은 이유로 버튼을 세워 두었는데 여기만 자동이었다.
        // #ganmyeong 해시로 들어오면 클릭 0회로 구워졌다.
        el.innerHTML = '<div class="nx-diag"><p>의논이 아직 없습니다.</p></div>'
          + '<button class="btn" id="gmBake" style="margin-top:12px">의논을 청하겠습니다 — 약 1~2분</button>';
        const bb = el.querySelector('#gmBake');
        if (bb) bb.onclick = () => {
          bb.disabled = true; bb.textContent = '의논 중입니다 — 새로고침하지 마시고 잠시만요';
          간명예열();
        };
        return;
      }
    }
    // ── 채점을 들어냈다 (2026-08-31) ──
    // 채점이 있던 이유는 둘이었다: ① 적중률 집계 ② 「누가 맞혔는지」.
    // 둘 다 오늘 지웠다(판정이 인기순으로 왜곡되고, 재 보지 않은 것을 재었다고
    // 말하게 되므로). 그러고 나니 남은 것은 —
    //   스무 발언을 읽히고, 예순 번 누르게 하고, 아무것도 안 돌려준다.
    // 공주님 쪽에 남는 것이 없으면 그건 일이지 재미가 아니다. 그래서 치웠다.
    // 문(유료·로그인)은 채점 뒤가 아니라 **다 읽은 자리**에 그대로 둔다.
    // 옛 채점 기록(chaeksa.ganmyeong.grade.*)은 지우지 않는다 — 남의 기기 것을
    // 우리가 청소할 이유가 없고, 안 읽으면 그만이다.
    // AI가 마크다운을 섞어도 화면엔 순수 글만 — 이미 구워진 캐시도 여기서 같이 씻긴다
    text = text.replace(/\*\*/g, '').replace(/^#{1,4} */gm, '').replace(/^ *-{3,} *$/gm, '').replace(/^ *[*•] +/gm, '');
    const parts = text.split(/(?=[①-⑳])/);
    // 좌장의 맺음은 발언이 아니다 — 스무 발언 뒤에 오는 회의의 끝이다.
    // 떼어내지 않으면 마지막 발언 카드에 끼어 「맞아요/아니에요」가 붙는다.
    let 맺음글 = '';
    if (parts.length > 1) {
      const 끝 = parts[parts.length - 1], k = 끝.indexOf('\n\n〔좌장〕');
      if (k >= 0) { 맺음글 = 끝.slice(k + 2).trim(); parts[parts.length - 1] = 끝.slice(0, k); }
    }
    // [절 제목] 줄은 문항 덩이에서 뽑아 제 칸(눈썹)으로 세운다 — 꼬리에 끼면 채점 칸이 어색하다
    const 절제목류 = t => t.charAt(0) === '[' && t.charAt(t.length - 1) === ']';
    // 발언 한 줄을 그리는 일은 전역 발언줄() 하나가 한다 — 여기서 따로 그리다가
    // 이름 바꾸기(축→책사 이름)가 무료 의논에만 안 먹은 적이 있다(2026-08-30).
    // 화자를 덩이 너머로 기억한다 — 같은 책사가 이어 말하면 얼굴을 다시 안 세운다.
    let 앞화자 = null;
    const 문단화 = (chunk, 뽑힌) => chunk.split('\n').map(t => {
      t = t.trim(); if (!t) return '';
      if (절제목류(t)) { 뽑힌.push(t.slice(1, -1)); 앞화자 = null; return ''; }
      const mm = t.match(발언자류), who = mm ? mm[2] : null;
      const 새 = !!who && who !== 앞화자;
      if (who) 앞화자 = who;
      return 발언줄(t, 새);
    }).join('');
    const 머리 = parts[0] || '';
    let 밀린 = [];
    const html = ['<div class="nx-diag">' + 문단화(머리, 밀린) + '</div>'];
    // 홈에서는 앞부분만 — 전문과 채점은 전용 탭이 한다.
    // 스무 발언을 홈에 다 펴면 첫 화면이 마흔여섯 화면이 된다(2026-08-30 실측 37,600px).
    const 홈맛보기 = (whereTag === 'home');
    const 보일수 = 홈맛보기 ? 5 : parts.length - 1;
    parts.slice(1, 1 + 보일수).forEach((chunk, i) => {
      const 이번 = [];
      const 본문 = 문단화(chunk, 이번);
      밀린.forEach(h => html.push('<p class="hero-eyebrow" style="margin:20px 4px 2px">' + esc(h) + '</p>'));
      밀린 = 이번;
      html.push('<div class="nx-diag" style="margin-top:10px">' + 본문 + '</div>');
    });
    const 전체문 = parts.length - 1;
    if (홈맛보기) {
      const 남은 = 전체문 - 보일수;
      if (남은 > 0) html.push('<button class="btn" id="gmMore">이어서 읽기 — 남은 '
        + 남은 + '개 발언</button>');
      el.innerHTML = html.join('');
      const mb = el.querySelector('#gmMore');
      if (mb) mb.onclick = () => go('ganmyeong');
      return;   // 맺음은 홈에서 보이지 않는다 — 다 읽으신 분께만 나오는 말이다
    }
    // 회의를 맺는 말. 채점 알약을 달지 않는다 — 좌장은 판정하지 않고 앉힌다.
    if (맺음글) html.push('<div class="nx-diag gm-close" style="margin-top:16px">' + 발언줄(맺음글) + '</div>');
    // 회의가 끝나면 문을 연다. 예전에는 **채점을 마쳐야** 이 문이 열렸는데,
    // 채점을 치웠으니 조건도 없앤다 — 다 읽은 사람에게 그냥 연다.
    html.push('<div class="nx-diag pbd" style="margin-top:16px">'
      + '<p class="nx-diag-k">다음 물음은 하나 — 「그래서 언제인가」</p>'
      + '<p>지나온 해를 짚은 그 잣대로, 앞으로 열두 달을 달·날·시각까지 재어 놓았습니다.</p>'
      + '<button class="btn" id="gmNextLove">공주님의 사랑 이야기 — 다음 장 열기</button>'
      + '<button class="btn" id="gmNextMoney" style="margin-top:8px">공주님의 재물 이야기 열기</button>'
      + '</div>');
    // 로그인은 여기서 청한다 — 의논을 다 읽은 사람에게는 잃을 것이 생겼다.
    // 없는 이득을 지어내지 않는다. 실제로 되는 것만 적는다.
    if (비로그인()) {
      html.push('<div class="nx-diag" style="margin-top:12px">'
        + '<p class="nx-diag-k">이걸 남겨 둘까요</p>'
        + '<p>지금 이 의논은 <b>이 기기에만</b> 있습니다. 브라우저를 정리하시면 사라집니다.'
        + ' 카카오로 남겨 두시면 폰을 바꾸셔도 그대로 열립니다.</p>'
        + '<button class="btn kakao" id="gmKeep"><span>💬</span>카카오로 남겨 두기</button></div>');
    }
    el.innerHTML = html.join('');
    const kp = el.querySelector('#gmKeep');
    if (kp) kp.onclick = () => { try { ChaeksaCloud.signInWith('kakao'); } catch (e) { openSettings(); } };
    const nl = el.querySelector('#gmNextLove'), nm = el.querySelector('#gmNextMoney');
    if (nl) nl.onclick = () => go('lovestory');
    if (nm) nm.onclick = () => go('moneystory');
  }

  function renderLoveStory() {
    const T = window.ChaeksaTypecard; if (!T || !T.loveStory || !$('lsBody') || !R || !profile) return;
    if ($('gu-lovestory')) $('gu-lovestory').classList.toggle('hide', !profile.genderUnknown);
    if (lsFor === R) return;
    const v = T.loveStory(R, today);
    if (!v) { $('lsBody').innerHTML = '<p class="hint">생년을 알아야 연표를 그립니다.</p>'; return; }
    lsFor = R;
    const nm = profile.name || '공주님';

    // 과거 — 연표. 맞는지는 본인이 안다. 그래서 단정 대신 「가능성」으로 말한다.
    const 과거절 = v.과거.length
      ? v.과거.map(g => `<div class="ls-item">
          <div class="pb-scene">${T.달그림 ? T.달그림('love', g.달 ? parseInt(g.달.말) || 4 : 4, 'open') : ''}</div>
          <div class="ls-when"><b>${g.시작 === g.끝 ? g.시작 + '년' : g.시작 + '~' + g.끝 + '년'}</b>
            <span>${g.시작나이 === g.끝나이 ? '만 ' + g.시작나이 + '살' : '만 ' + g.시작나이 + '~' + g.끝나이 + '살'} 무렵</span></div>
          <p class="ls-say">${esc(g.말)}</p>
          ${g.달 ? `<p class="ls-month">그중에서도 <b>${g.달.해}년 ${esc(g.달.말)}</b> 무렵이 짙습니다</p>` : ''}
          ${g.풀이 ? `<p class="ls-pul">${esc(g.풀이)}</p>` : ''}
          <p class="ls-why">◦ ${esc(g.이유.join(' · ') || '')}</p>
        </div>`).join('')
      : `<div class="ls-item"><p class="ls-say">지나온 해들 중에 크게 열린 구간이 안 보입니다 —
         연애가 늦는 사주가 아니라, <b>아직 파도가 안 온 사주</b>입니다. 이런 원국일수록 올 때 크게 옵니다.</p></div>`;
    const 흔들절 = v.흔들린해.length
      ? `<p class="ls-shake">그리고 ${v.흔들린해.map(h => h.해 + '년(만 ' + h.나이 + '살)').join(' · ')} 무렵은
         배우자 자리가 흔들린 해 — 정리나 다툼이 있었기 쉬운 자리입니다.</p>` : '';

    // 현재 — 찍는다. 틀릴 수 있음을 숨기지 않는다.
    const 현재상태 = v.현재.판 === '열림' ? 'open' : v.현재.판 === '흔들림' ? 'shake' : 'quiet';
    const 현재절 = `<div class="ls-now ls-${v.현재.판 === '열림' ? 'open' : v.현재.판 === '조용' ? 'quiet' : 'mid'}">
      <div class="pb-scene">${T.달그림 ? T.달그림('love', today.getMonth() + 1, 현재상태) : ''}</div>
      <p class="ls-now-k">그래서, 지금은</p>
      <p class="ls-now-say">${esc(v.현재.말)}</p>
      ${v.현재.이유.length ? `<p class="ls-why">◦ ${esc(v.현재.이유.join(' · '))}</p>` : ''}
    </div>`;

    $('lsBody').innerHTML = `<p class="ls-lede">${esc(nm)}님의 원국에서 <b>${esc(v.이름)}(인연의 글자)</b>과
      <b>배우자 자리(일지)</b>가 움직인 해를 만 ${v.시작나이}살부터 짚었습니다. 맞는지는 ${esc(nm)}님이 아십니다.</p>
      ${과거절}${흔들절}${현재절}
      <p class="ls-honest">잣대 공개 — ${esc(v.이름)}이 하늘에 오는가(뿌리까지), 일지와 합·삼합·충인가, 대운이 무엇을 데려오는가.
      단정이 아니라 「이 기준으로는」입니다. 틀렸다면 그것도 알려주세요 — 기준을 공개하는 이유입니다.</p>`;

    // 미래 — 여기부터 유료. 과거를 맞힌 그 잣대가 그대로 미래를 잰다.
    const paid = window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('inyeon');
    const box = $('lsNext');
    if (paid) {
      // 판단서 하나에서 원장·화면·AI 사실이 전부 나온다 — 어긋날 길이 없다.
      const rd = T.reading(R, 'love', today);
      paidReveal(box, rd.원장, () => {
        const 본문 = rd.달들.map(m => `<div class="pb-dd${m.열림 ? ' pb-open' : ''}">
            <div class="pb-scene">${T.달그림('love', m.월, m.상태)}</div>
            ${m.이음 ? `<p class="pb-link">${esc(m.이음)}</p>` : ''}
            <b>${m.연}년 ${m.월}월</b> <span class="gz2">${esc(m.간지)}</span>
            <div class="pb-bar pb-inbar"><i style="width:${Math.max(m.점수, 6)}%"></i></div>
            ${m.이유.length ? m.이유.map(t => `<p class="pb-why">◦ ${esc(t)}</p>`).join('')
              : `<p class="pb-why">◦ 인연의 글자가 크게 들지 않는 달 — 흐름은 평온합니다</p>`}
            ${m.지침
              ? `<p class="pb-say">${esc(m.지침)}</p>
                 ${m.조심날.length ? `<p class="pb-avoid">비켜 갈 날 — ${m.조심날.map(d2 => m.월 + '/' + d2.일).join(' · ')} <span class="pb-days-why">(배우자 자리를 치는 날 — 고백·상견례·담판 금지)</span></p>` : ''}`
              : `<p class="pb-say">${esc(m.결)}</p>
                 ${m.좋은날.length ? `<p class="pb-days">${m.상대 ? '그래도 이 달 안에서 나은 날 — ' : '날을 고르면 — '}${m.좋은날.map(d2 => `<b>${m.월}/${d2.일}(${d2.요일})</b>`).join(' ')}<br><span class="pb-days-why">${esc(m.좋은날[0].왜 || '이 달 안의 서열')}${m.좋은날.length > 1 ? ' 등' : ''}</span></p>` : ''}
                 ${m.시진무리.length ? `<p class="pb-days">그날 중에서도 — ${m.시진무리.map(g => `<b>${esc(g.시진)}</b>에 ${g.날들.join('·')}`).join(' / ')}</p>` : ''}
                 ${m.조심날.length ? `<p class="pb-avoid">조심할 날 — ${m.조심날.map(d2 => m.월 + '/' + d2.일).join(' · ')} <span class="pb-days-why">(배우자 자리를 치는 날 — 고백·상견례·담판은 피하세요)</span></p>` : ''}`}
          </div>`).join('');
        return `<div class="paidbox"><p class="pb-k">결제 열람 — 다가오는 열두 달</p>
          <p class="pb-lede">다음 달부터 열두 달, ${rd.검토수.toLocaleString('ko-KR')}가지 경우를 대조했습니다. ${rd.열린수
            ? `열리는 달이 <b>${rd.열린수}개</b> — 그 달들은 날짜와 시진까지 내렸습니다.`
            : '크게 열리는 달이 없는 열두 달입니다 — 그 안의 서열로 보세요.'}</p>
          <div class="pb-ai-slot"></div>
          ${rd.결론.length ? `<div class="pb-verdict"><p class="pb-k" style="margin-bottom:8px">책사의 판단 — 엔진이 이어 놓은 결론</p>${rd.결론.map(t => `<p class="pb-vd">◆ ${esc(t)}</p>`).join('')}</div>` : ''}
          <details class="fold pb-fold"><summary>열두 달 전부 보기 — 달마다 날짜와 시각까지</summary>${본문}</details>
          <p class="pb-ft">잣대 공개 — 과거 연표와 같습니다: 배우자성이 하늘에 오는가(뿌리까지), 배우자 자리(일지)와 합·삼합·충인가, 도화·일간합·조후까지.${rd.먼해.length ? ` 더 멀리는 <b>${rd.먼해.join('·')}년</b>이 크게 열리는 해입니다 — 가까워지면 다시 보세요.` : ''} 시각은 태어나신 곳의 경도로 진태양시까지 보정해 잽니다.</p></div>`;
      }, (bx) => aiNarrate(bx, 'love', {
        자료집: T.dossier ? T.dossier(R, today) : null,
        진단: rd.진단,
        결론: rd.결론,
        과거: rd.과거.map(g => ({ 구간: g.시작 + (g.끝 !== g.시작 ? '~' + g.끝 : '') + '년', 나이: '만 ' + g.시작나이 + '살무렵', 말: g.말, 절정달: g.달 ? g.달.해 + '년 ' + g.달.말 : null, 풀이: g.풀이 || null })),
        흔들린해: (rd.흔들린해 || []).map(h => h.해 + '년(만 ' + h.나이 + '살)'),
        현재: rd.현재.말,
        열두달: rd.열두달AI,
        먼해: rd.먼해,
      }));
    } else {
      box.innerHTML = nextStep('미래 — 언제 연애하게 되는가',
        '과거의 구간과 지금의 판까지',
        '과거를 짚은 그 잣대가 그대로 앞을 잽니다. 앞으로 여섯 해 중 어느 해가 열리는지, 그 해의 어느 달·어느 날인지까지 같은 자로 내려갑니다.',
        nm + '님 연애 시기 — 앞으로 언제 열리는지 보고 싶습니다', 'inyeon',
        T.inyeonWhy ? T.inyeonWhy(R).말 : null);
    }
  }

  // ── 너의 재물 스토리 — 연애 스토리와 같은 틀, 잣대만 돈 ──
  let msFor = null;
  function renderMoneyStory() {
    const T = window.ChaeksaTypecard; if (!T || !T.moneyStory || !$('msBody') || !R || !profile) return;
    if (msFor === R) return;
    const v = T.moneyStory(R, today);
    if (!v) { $('msBody').innerHTML = '<p class="hint">생년을 알아야 연표를 그립니다.</p>'; return; }
    msFor = R;
    const nm = profile.name || '공주님';

    const 과거절 = v.과거.length
      ? v.과거.map(g => `<div class="ls-item">
          <div class="pb-scene">${T.달그림 ? T.달그림('wealth', g.달 ? parseInt(g.달.말) || 9 : 9, 'open') : ''}</div>
          <div class="ls-when"><b>${g.시작 === g.끝 ? g.시작 + '년' : g.시작 + '~' + g.끝 + '년'}</b>
            <span>${g.시작나이 === g.끝나이 ? '만 ' + g.시작나이 + '살' : '만 ' + g.시작나이 + '~' + g.끝나이 + '살'} 무렵</span></div>
          <p class="ls-say">${esc(g.말)}</p>
          ${g.달 ? `<p class="ls-month">그중에서도 <b>${g.달.해}년 ${esc(g.달.말)}</b> 무렵이 짙습니다</p>` : ''}
          ${g.풀이 ? `<p class="ls-pul">${esc(g.풀이)}</p>` : ''}
          <p class="ls-why">◦ ${esc(g.이유.join(' · ') || '')}</p>
        </div>`).join('')
      : `<div class="ls-item"><p class="ls-say">지나온 해들 중에 크게 벌린 구간이 안 보입니다 —
         못 버는 사주가 아니라 <b>아직 재성의 파도가 안 온 사주</b>입니다. 이런 원국일수록 올 때 크게 옵니다.</p></div>`;
    const 샌절 = v.샌해.length
      ? `<p class="ls-shake">그리고 ${v.샌해.map(h => h.해 + '년(만 ' + h.나이 + '살)').join(' · ')} 무렵은
         나눠 갖는 손(겁재)가 온 해 — 지출이 커졌거나 돈이 샜기 쉬운 자리입니다.</p>` : '';

    const 현재상태2 = v.현재.판 === '들어옴' || v.현재.판 === '벌이' ? 'open' : v.현재.판 === '샘' ? 'leak' : 'quiet';
    const 현재절 = `<div class="ls-now ls-${v.현재.판 === '들어옴' ? 'open' : v.현재.판 === '조용' ? 'quiet' : 'mid'}">
      <div class="pb-scene">${T.달그림 ? T.달그림('wealth', today.getMonth() + 1, 현재상태2) : ''}</div>
      <p class="ls-now-k">그래서, 지금은</p>
      <p class="ls-now-say">${esc(v.현재.말)}</p>
      ${v.현재.이유.length ? `<p class="ls-why">◦ ${esc(v.현재.이유.join(' · '))}</p>` : ''}
    </div>`;

    $('msBody').innerHTML = `<p class="ls-lede">${esc(nm)}님의 원국에서 <b>재성(돈의 글자)</b>과
      <b>겁재(나눠 갖는 손)</b>가 움직인 해를 만 ${v.시작나이}살부터 짚었습니다. 맞는지는 통장이 압니다.</p>
      ${과거절}${샌절}${현재절}
      <p class="ls-honest">잣대 공개 — 재성이 하늘에 오는가(뿌리까지), 벌이를 만드는 식상인가, 나눠 가는 겁재인가,
      대운이 무엇을 데려오는가. ${v.강약 === '신약' ? '신약이라 재성 해의 가산을 줄여 계산했습니다(재다신약). ' : ''}단정이 아니라 「이 기준으로는」입니다. 틀렸다면 알려주세요 — 기준을 공개하는 이유입니다.</p>`;

    const paid = window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('wealth');
    const box = $('msNext');
    if (paid) {
      const rd = T.reading(R, 'wealth', today);
      paidReveal(box, rd.원장, () => {
        const 본문 = rd.달들.map(m => `<div class="pb-dd${m.열림 ? ' pb-open' : ''}${m.상태 === 'leak' ? ' pb-leak' : ''}">
            <div class="pb-scene">${T.달그림('wealth', m.월, m.상태)}</div>
            ${m.이음 ? `<p class="pb-link">${esc(m.이음)}</p>` : ''}
            <b>${m.연}년 ${m.월}월</b> <span class="gz2">${esc(m.간지)}</span> <span class="pb-god">${esc(m.십신 || '')}</span>
            <div class="pb-bar pb-inbar"><i style="width:${Math.max(m.점수, 6)}%${m.상태 === 'leak' ? ';background:#b4534f' : ''}"></i></div>
            ${m.이유.length ? m.이유.map(t => `<p class="pb-why">◦ ${esc(t)}</p>`).join('')
              : `<p class="pb-why">◦ 돈의 글자가 크게 들지 않는 달 — 흐름은 잔잔합니다</p>`}
            ${m.지침
              ? `<p class="pb-say">${esc(m.지침)}</p>
                 ${m.조심날.length ? `<p class="pb-avoid">비켜 갈 날 — ${m.조심날.map(d2 => m.월 + '/' + d2.일).join(' · ')} <span class="pb-days-why">(나눠 갖는 손이 겹치는 날)</span></p>` : ''}`
              : `<p class="pb-say">${esc(m.결)}</p>
                 ${m.좋은날.length ? `<p class="pb-days">${m.상대 ? '그래도 이 달 안에서 나은 날 — ' : '날을 고르면 — '}${m.좋은날.map(d2 => `<b>${m.월}/${d2.일}(${d2.요일})</b>`).join(' ')}<br><span class="pb-days-why">계약·오픈·큰 지출처럼 돈이 걸린 일을 두는 날</span></p>` : ''}
                 ${m.시진무리.length ? `<p class="pb-days">그날 중에서도 — ${m.시진무리.map(g => `<b>${esc(g.시진)}</b>에 ${g.날들.join('·')}`).join(' / ')}</p>` : ''}
                 ${m.조심날.length ? `<p class="pb-avoid">조심할 날 — ${m.조심날.map(d2 => m.월 + '/' + d2.일).join(' · ')} <span class="pb-days-why">(나눠 갖는 손의 날 — 동업 약속·보증·충동 지출을 피하세요)</span></p>` : ''}`}
          </div>`).join('');
        return `<div class="paidbox"><p class="pb-k">결제 열람 — 다가오는 열두 달</p>
          <div class="pb-ai-slot"></div>
          ${rd.결론.length ? `<div class="pb-verdict"><p class="pb-k" style="margin-bottom:8px">책사의 판단 — 엔진이 이어 놓은 결론</p>${rd.결론.map(t => `<p class="pb-vd">◆ ${esc(t)}</p>`).join('')}</div>` : ''}
          <p class="pb-lede">다음 달부터 열두 달, ${rd.검토수.toLocaleString('ko-KR')}가지 경우를 대조했습니다. ${rd.열린수
            ? `돈이 도는 달이 <b>${rd.열린수}개</b> — 날짜와 시진까지 내렸습니다.`
            : '크게 벌리는 달이 없는 열두 달입니다 — 그 안의 서열로 보세요.'}${rd.샘달들.length
            ? ` 붉은 표(${rd.샘달들.map(m => m + '월').join('·')})는 <b>새기 쉬운 달</b> — 동업·보증·큰 지출을 피하세요.` : ''}</p>
          <details class="fold pb-fold"><summary>열두 달 전부 보기 — 달마다 날짜와 시각까지</summary>${본문}</details>
          <p class="pb-ft">잣대 공개 — 과거 연표와 같습니다: 재성이 하늘에 오는가, 벌이를 만드는 식상인가, 나눠 가는 겁재인가, 조후까지.${rd.먼해.length ? ` 더 멀리는 <b>${rd.먼해.join('·')}년</b>이 크게 벌리는 해입니다 — 가까워지면 다시 보세요.` : ''} 되돌리기 어려운 계약 날은 후보를 여럿 두고 보세요 — 갈리는 자리는 원국 탭에 적어 두었습니다.</p></div>`;
      }, (bx) => aiNarrate(bx, 'wealth', {
        자료집: T.dossier ? T.dossier(R, today) : null,
        진단: rd.진단,
        결론: rd.결론,
        강약: rd.강약,
        과거: rd.과거.map(g => ({ 구간: g.시작 + (g.끝 !== g.시작 ? '~' + g.끝 : '') + '년', 나이: '만 ' + g.시작나이 + '살무렵', 말: g.말, 절정달: g.달 ? g.달.해 + '년 ' + g.달.말 : null, 풀이: g.풀이 || null })),
        샌해: (rd.샌해 || []).map(h => h.해 + '년(만 ' + h.나이 + '살)'),
        현재: rd.현재.말,
        열두달: rd.열두달AI,
        지킬해: (rd.지킬해 || []).map(r => r.해 + '년'),
        먼해: rd.먼해,
      }));
    } else {
      box.innerHTML = nextStep('미래 — 언제 벌리고 언제 지켜야 하는가',
        '과거의 구간과 지금의 판까지',
        '과거를 짚은 그 잣대가 그대로 앞을 잽니다. 앞으로 여섯 해 중 벌리는 해가 언제인지 — 그리고 그만큼 중요한, 새는 해가 언제인지까지.',
        nm + '님 재물 시기 — 앞으로 언제 벌리는지 보고 싶습니다', 'wealth',
        T.wealthWhy ? T.wealthWhy(R).말 : null);
    }
  }

  let dohwaFor = null;
  function renderDohwa() {
    const T = window.ChaeksaTypecard; if (!T || !$('dohwaSvg')) return;
    if ($('gu-dohwa')) $('gu-dohwa').classList.toggle('hide', !profile.genderUnknown);
    if (dohwaFor === R) return;
    $('dohwaWrap').classList.add('hide'); $('dohwaNote').textContent = '';
    $('dohwaProg').classList.remove('hide');
    $('dohwaProg').textContent = '인연의 결을 보는 중\u2026';
    T.buildSample(
      (r) => { $('dohwaProg').textContent = '인연의 결을 보는 중\u2026 ' + Math.round(r * 100) + '%'; },
      (sample) => {
        const v = T.love(R, today, sample);
        dohwaFor = R;
        $('dohwaProg').classList.add('hide');
        $('dohwaSvg').innerHTML = T.drawDohwa(profile.name || '공주님', v);
        const fl = $('dohwaFlip'); fl.style.animation = 'none'; void fl.offsetWidth; fl.style.animation = 'gflip .9s ease-out';
        $('dohwaWrap').classList.remove('hide');
        { const nx = $('dohwaNext');
          const paid = window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('inyeon');
          if (nx && paid && T.whoLovesMe) {
            // 유료 — 어떤 사람이 나를 사랑하는가. 뒤집기 한 번의 명리:
            // 나를 배우자감으로 보는 사람 = 내 배우자성 오행의 일간.
            const w = T.whoLovesMe(R);
            const 사람절 = (인, 라벨) => `<div class="pb-dd${인.합 ? ' pb-open' : ''}">
              <b>${esc(인.천간)}의 사람</b> <span class="pb-god">${esc(라벨)}</span>${인.합 ? ' <span class="pb-god">— 공주님과 합</span>' : ''}
              <p class="pb-say">${esc(인.인물)}</p>
              <p class="pb-why">◦ ${esc(인.다가옴)}</p>
              <p class="pb-why">◦ ${esc(인.위치)}</p>
              ${인.가로채임 ? `<p class="pb-avoid">${esc(인.가로채임)}</p>` : ''}
              ${인.합 ? `<p class="pb-say">그리고 이 글자는 공주님의 일간을 곧장 끌어당기는 합입니다 — 서로가 서로를 알아보는 짝이라, 만나면 빠르게 가까워집니다.</p>` : ''}
            </div>`;
            nx.innerHTML = `<div class="paidbox"><p class="pb-k">결제 열람 — 어떤 사람이 공주님을 사랑하는가</p>
              ${w.진사랑 ? `<div class="pb-verdict"><p class="pb-k" style="margin-bottom:8px">진정한 사랑 — 배우자 방에 앉은 글자</p>
                <p class="pb-vd">◆ 공주님의 배우자 방 ${esc(w.진사랑.궁)}에 앉아 있는 글자는 <b>${esc(w.진사랑.글자)}</b> — 진정한 사랑은 <b>${esc(w.진사랑.기운말)}을 짙게 지닌 사람</b>이기 쉽습니다.</p>
                <p class="pb-vd">◆ ${esc(w.진사랑.기운풀이)}</p>
                <p class="pb-vd">◆ ${esc(w.진사랑.인물)}</p>
                <p class="pb-vd">◆ 공주님에게는 ${esc(w.진사랑.십신)}의 자리 — ${esc(w.진사랑.십신뜻)}</p>
                ${w.진사랑.회전문
                  ? `<p class="pb-vd">◆ 다만 방에 앉은 ${esc(w.진사랑.글자)}${조(w.진사랑.글자, '이', '가')} 하늘에도 떠 있어 — ${esc(w.진사랑.방아쇠글자)}의 사람이 들어오려 하면 합해서 변질됩니다. <b>들어왔다 나가고, 나갔다 들어오는 회전문</b> — 인연이 자리를 못 잡던 구조적 이유입니다.</p>
                     ${w.진사랑.지킴글자 ? `<p class="pb-vd">◆ 이 회전문을 타지 않는 유일한 글자는 <b>${esc(w.진사랑.지킴글자)}</b> — 그 통로가 방을 끝내 지킵니다.</p>` : ''}
                     ${w.진사랑.해들.length && w.진사랑.대운겹 ? `<p class="pb-vd">◆ <b>${w.진사랑.해들[0]}년</b>은 대운 하늘에 이미 ${esc(w.진사랑.방아쇠글자)}${조(w.진사랑.방아쇠글자, '이', '가')} 떠 있어 세운만으로 두 번이 찹니다 — 해 전체가 방아쇠를 당기는 해입니다.</p>`
                       : w.진사랑.해들.length && w.진사랑.둘째달.length ? `<p class="pb-vd">◆ ${esc(w.진사랑.방아쇠글자)}${조(w.진사랑.방아쇠글자, '이', '가')} 굳이 들어온다면 두 번 겹쳐야 합니다 — <b>${w.진사랑.해들[0]}년 ${w.진사랑.둘째달.join('·')}월</b>에 첫 글자는 소모되고 둘째 글자가 방아쇠를 당깁니다.</p>` : ''}`
                  : `<p class="pb-vd">◆ 이 글자를 합으로 데려오는 방아쇠는 <b>${esc(w.진사랑.방아쇠글자)}</b>${w.진사랑.맞물림 ? ' — 공주님의 배우자성이기도 합니다. 궁과 성이 맞물린 사주라 이 사슬이 두 겹으로 조입니다' : ''}.${w.진사랑.해들.length ? ` <b>${w.진사랑.해들.join('·')}년</b>에 그 사람이 방으로 들어오기 쉽습니다.` : ''}</p>`}
              </div>` : ''}
              <p class="pb-lede">공주님을 배우자감으로 알아보는 사람의 글자는 원국이 정해 둡니다 —
              공주님의 배우자성 <b>${esc(w.오행)}</b>을 일간으로 타고난 사람입니다.
              <b>${esc(w.결이름)}</b>: ${esc(w.결설명)}</p>
              ${사람절(w.정, '반듯하게 오는 사람')}
              ${사람절(w.편, '강렬하게 오는 사람')}
              ${w.합별도 ? `<div class="pb-dd pb-open"><b>${esc(w.합간)}의 사람</b> <span class="pb-god">끌림의 글자</span>
                <p class="pb-why">◦ 배우자성 밖의 글자인데도 공주님의 일간을 곧장 끌어당기는 합입니다 — 조건으로는 설명이 안 되는데 자꾸 눈이 가는 사람이 있다면, 이 글자이기 쉽습니다.</p>
                <p class="pb-say">머리로 고르는 인연은 위의 두 글자에서, 마음이 먼저 가는 인연은 이 글자에서 오기 쉽습니다.</p>
              </div>` : ''}
              <p class="pb-h"><b>그들은 공주님의 무엇에 걸리는가</b></p>
              <p class="pb-why">◦ 공주님은 ${esc(w.매력.결)}의 사람 — ${esc(w.매력.설명)}</p>
              ${w.매력.도화 ? `<p class="pb-why">◦ 게다가 원국의 ${esc(w.매력.도화글자)}가 도화(桃花) — 가만히 있어도 눈에 띄는 쪽입니다. 다가오는 사람이 먼저 생기는 구조입니다.</p>` : `<p class="pb-why">◦ 도화는 없는 원국이라 첫눈에 쏟아지는 쪽보다, 겪을수록 좋아지는 쪽입니다 — 오래 보는 자리에서 사랑받습니다.</p>`}
              <p class="pb-h"><b>곁에 오래 남는 사람 — 배우자 방(${esc(w.배우자궁)})에 놓인 재료</b></p>
              ${w.곁.map(c => `<p class="pb-why">◦ ${esc(c.천간)} — ${esc(c.결)}의 사람이 이 방에 오래 머뭅니다</p>`).join('')}
              ${w.도착말.length ? `<p class="pb-h"><b>그 사랑이 공주님에게 도착하는 방식</b></p>${w.도착말.slice(0, 2).map(t => `<p class="pb-why">◦ ${esc(t)}</p>`).join('')}` : ''}
              <p class="pb-ft">잣대 공개 — 배우자성 오행의 일간(정·편은 음양으로), 일간합, 도화, 배우자궁 지장간. 전부 원국에서 나온 결정입니다. 「언제 오는가」는 인연이 오는 해·연애 스토리에 열려 있습니다.</p></div>`;
            aiNarrate(nx, 'whom', {
              자료집: T.dossier ? T.dossier(R, today) : null,
              나를사랑하는사람: { 오행: w.오행, 결: w.결이름 + ' — ' + w.결설명,
                정으로오는사람: w.정.천간 + ' — ' + w.정.인물 + ' ' + w.정.다가옴 + ' ' + w.정.위치,
                편으로오는사람: w.편.천간 + ' — ' + w.편.인물 + ' ' + w.편.다가옴 + ' ' + w.편.위치,
                합인글자: w.합간 + (w.합별도 ? ' — 배우자성 밖이지만 일간을 곧장 끌어당기는 끌림의 글자'
                                   : (w.합이정인가 ? ' (반듯하게 오는 쪽이 합)' : ' (강렬하게 오는 쪽이 합)')) },
              진정한사랑: w.진사랑 ? { 배우자방: w.진사랑.궁, 앉은글자: w.진사랑.글자,
                기운: w.진사랑.기운말 + ' — ' + w.진사랑.기운풀이, 인물: w.진사랑.인물, 나에게는: w.진사랑.십신 + ' — ' + w.진사랑.십신뜻,
                방아쇠: w.진사랑.방아쇠글자 + (w.진사랑.맞물림 ? ' (공주님의 배우자성이기도 — 궁과 성이 맞물림)' : ''),
                들어오는해: w.진사랑.해들 } : null,
              나의매력: w.매력, 곁에남는재료: w.곁, 도착방식: w.도착말,
            });
          } else if (nx) nx.innerHTML = nextStep(
            '어떤 사람이 공주님을 사랑하는지', '나는 어떤 사랑을 하는지까지',
            '공주님을 배우자감으로 알아보는 사람의 글자는 원국이 이미 정해 두었습니다 — 그리고 공주님을 곧장 끌어당기는 합의 글자도요. 그 사람들이 어떤 결이고, 어떻게 다가오고, 공주님의 무엇에 걸리는지까지 열립니다.',
            (profile.name || '') + '님 연애 상담 — 어떤 사람이 저를 사랑하게 되는지 보고 싶습니다', 'inyeon',
            T.inyeonWhy ? T.inyeonWhy(R).말 : null); }
        $('dohwaNote').textContent = v.key + ' \u00b7 ' + v.name + ' \u2014 지어낸 사주 ' + v.n.toLocaleString() + '개 중 같은 유형 ' + v.share + '%';
        $('btnDohwaShare').onclick = async () => {
          const b = $('btnDohwaShare'); b.disabled = true; b.textContent = '만드는 중\u2026';
          try {
            const r = await T.share($('dohwaSvg').innerHTML, '나의연애_' + v.name);
            b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 \u2014 Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
          } catch (e) { b.textContent = '다시 시도'; }
          b.disabled = false;
          setTimeout(() => { b.textContent = '카드 저장·공유'; }, 2500);
        };
      });
  }


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
    // chat·consult 는 v390 에서 지운 기능이다. 영원히 0 인 막대를 세워 두지 않는다.
    const rows = [['brief', '오늘 브리핑'], ['story', '책사단의 글'], ['profile', '좌장의 원국 해석']];
    box.innerHTML = `<p class="hint" style="margin:0 0 8px">이번 달 사용량 · 등급 <b>${U.PLANS[p].label}</b></p>`
      + rows.map(([k, name]) => {
          const lim = U.limit(k), use = U.used(k);
          const w = lim ? Math.min(100, use / lim * 100) : 0;
          return `<div class="ub"><span>${name}</span><i><b style="width:${w}%"></b></i><span>${use}/${lim || '—'}</span></div>`;
        }).join('')
      + `<p class="hint">${U.period() === 'life' ? '무료 체험분입니다(평생 기준).' : '매달 1일에 새로 열립니다.'}
         만세력·원국·대운·택일·공범 판결과 규칙 기반 브리핑은 <b>한도 없이</b> 쓰실 수 있습니다.</p>`;
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
    if (R) { Object.keys(localStorage).filter(k => k.startsWith('chaeksa.brief.') || k.startsWith('chaeksa.profile.ai.')).forEach(k => localStorage.removeItem(k)); loadAiBrief(); renderProfileCard(); }
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

  /** 오늘이 어느 계절인가 — 삽화 파일 이름에 쓴다 (달 기준, 삽화 대장과 같은 규칙) */
  function 계절이름() {
    return ['winter', 'winter', 'spring', 'spring', 'spring', 'summer',
            'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][today.getMonth()];
  }
  /** 오늘이 한 해의 몇 번째 날인가 — 장면 변주를 날마다 돌리는 데 쓴다 */
  function 날번호() {
    const t0 = new Date(today.getFullYear(), 0, 0);
    return Math.floor((today - t0) / 86400000);
  }
  /** 오늘 쓸 회의 장면. 있는 것 중 첫 번째를 골라 알려준다(없으면 부르지 않는다).
   *  변주(-2·-3)를 날마다 돌린다 — 매일 같은 그림이면 다시 올 이유가 하나 준다. */
  function 회의장면(고르면) {
    if (!window.CHAEKSA_ART) return;
    const s0 = 계절이름(), v = window.CHAEKSA_ART;
    // 계절마다 몇 벌인지는 config.js 가 안다. 없는 벌을 부르면 헛걸음이라 그만큼만 돈다.
    const n = (window.CHAEKSA_COUNCIL_VAR && window.CHAEKSA_COUNCIL_VAR[s0]) || 1;
    const i = 날번호() % n;
    const 벌 = i ? '-' + (i + 1) : '';
    // 예전엔 마지막 후보가 love-open 이었다. 그건 **판이 바뀌기 전** 그림이라
    // (서양 고딕 저택·낯선 남자 얼굴) 첫 화면에 스치기만 해도 세계가 어긋난다.
    // 회의 장면이 없으면 아무것도 안 건다 — 없는 것보다 어긋난 것이 나쁘다.
    const 후보 = ['art/council-' + s0 + 벌 + '.webp?v=' + v,
                  'art/council-' + s0 + '.webp?v=' + v];
    (function 다음(i) {
      if (i >= 후보.length) return;
      const im = new Image();
      im.onload = () => 고르면(후보[i]);
      im.onerror = () => 다음(i + 1);
      im.src = 후보[i];
    })(0);
  }
  /** 장면 한 컷 — 그림이 꺼져 있으면 아무것도 내놓지 않는다.
   *  자리만 먼저 잡아두고(옛 장면), 오늘의 회의 장면이 있으면 갈아 끼운다. */
  function 장면() {
    if (!window.CHAEKSA_ART) return '';
    const s0 = 계절이름(), v = window.CHAEKSA_ART;
    setTimeout(() => 회의장면(u => { const g = $('gmScene'); if (g) g.src = u; }), 0);
    return '<img class="gm-scene" id="gmScene" alt="" src="art/council-' + s0 + '.webp?v=' + v + '">';
  }
  // ───── 랜딩 ─────
  function showLanding() {
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    $('lpGanji').textContent = f.pillar(tf.day) + '일';
    $('lpGanjiKo').textContent = f.pillarKo(tf.day) + ' · ' + f.stemElem(tf.day.stem) + '의 날';
    // 첫 화면은 글이 아니라 장면이다 — 오늘의 계절에 맞는 삽화를 깐다.
    // 그림이 없으면 class 를 안 붙여 옛 글자 히어로로 돌아간다(안전한 되돌림).
    const hero = $('lpHero');
    if (hero && window.CHAEKSA_ART) {
      const s0 = 계절이름(), v = window.CHAEKSA_ART;
      // 첫 화면은 회의 장면이다. 예전엔 love-open 을 깔았다가 회의 장면으로 바꿔 끼웠는데,
      // 그 한 순간 판이 바뀌기 전 그림(서양 고딕 저택)이 스쳤다.
      hero.style.setProperty('--hero-art', 'url("art/council-' + s0 + '.webp?v=' + v + '")');
      hero.classList.add('scene');
      // 오늘의 회의 장면이 있으면 그쪽으로 바꾼다. 없으면 위 그림 그대로.
      회의장면(u => hero.style.setProperty('--hero-art', 'url("' + u + '")'));
    }
    // 랜딩에도 열 사람을 세운다. 홈과 같은 표에서 가져오므로 이름이 어긋나지 않는다.
    // 첫 화면에서 대접이 시작되어야 한다 — 들어와야 받는 대접은 늦다.
    const lc = $('lpCorps');
    if (lc) {
      lc.innerHTML = '<section class="corps"><div class="corps-row">'
        + 오늘의책사.map(([k, 이름]) =>
            '<span class="cm" style="cursor:default">'
            + '<span class="cm-face"><img src="art/chaeksa-' + k + '.webp" alt="" '
            + 'onerror="this.remove()">'
            + '<span class="cm-seal">' + esc(책사인장[이름] || 이름.slice(0, 1)) + '</span></span>'
            + '<span class="cm-name">' + esc(이름of(이름)) + '</span></span>').join('')
        + '</div></section>';
    }
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
  // ── 로그인 게이트 ── (2026-08-31 내림)
  //
  // 예전: 로그인 없이는 무료도 없다 (2026-08-29). 이유는 「비로그인은 결제로 안 이어진다」였다.
  // 그 판단은 검색 유입(1회성) 기준으로는 맞았다. 그런데 실측하고 보니 —
  //
  //   무료 의논은 원가가 0원이다(chaeksadan.js 조립기. LLM 을 안 부른다).
  //   **아낄 이유가 하나도 없는 것을 로그인 뒤에 숨겨 두고 있었다.**
  //   그리고 발견 유입이 하루 세 명인데 그 셋을 문 앞에서 돌려보내고 있었다.
  //
  // 이제 순서를 뒤집는다: 랜딩 → 생년월일 → 의논 전문 → 그 다음에 로그인을 청한다.
  // 의논을 다 읽고 채점까지 한 사람은 그때 **잃을 것이 생긴 사람**이다.
  //
  // 로그인이 정말 필요한 자리는 그대로 남는다 — 결제(pay.html 이 이미 잠근다),
  // 서버 저장·기기 이어받기, LLM 굽기(api/chat.js 가 401 로 막는다).
  //
  // **되돌리려면 아래 한 줄을 true 로.** 옛 흐름이 그대로 살아난다.
  const 관문먼저 = false;
  const 게이트켜짐 = () => !!(window.ChaeksaCloud && ChaeksaCloud.enabled());
  // 둘을 가른다. 섞으면 관문을 내리는 순간 「로그인 안 한 사람」을 못 찾는다.
  //   비로그인()  = 이 사람이 로그인을 안 했다        ← 로그인을 청하는 자리에 쓴다
  //   손님()      = 그래서 문 앞에서 막을 것인가      ← 부팅 분기에만 쓴다
  const 비로그인 = () => 게이트켜짐() && !ChaeksaCloud.signedIn();
  const 손님 = () => 관문먼저 && 비로그인();
  function enterOrLogin() {
    if (손님()) {
      try { ChaeksaCloud.signInWith('kakao'); } catch (e) { showForm(); }
      return;
    }
    showForm();
  }
  $('btnStart').onclick = enterOrLogin;
  $('btnStart2').onclick = enterOrLogin;
  // 관문이 서 있을 때만 「로그인하고…」로 덮어쓴다. 내려 놓고 이 문구가 남으면
  // 일어나지도 않을 로그인을 랜딩이 계속 약속한다.
  // (버튼 문구 대입은 index.html 과 바이트까지 같아 죽은 코드라 지웠다.)
  if (손님() && $('lpStartHint')) {
    $('lpStartHint').textContent = '로그인하고 생년월일시만 넣으면 1분 안에 간명서가 나옵니다.';
  }

  // ───── 외부 브리지 (consult.js에서 사용) ─────
  window.ChaeksaApp = {
    result: () => R,
    profile: () => profile,
    today: () => today,
  };

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
      // 등급을 같이 보여준다 — 슈퍼/구독이 실제로 붙었는지 화면에서 바로 확인할 수 있게.
      // (등급이 안 보이면 로그아웃→재로그인으로 새 토큰을 받아야 한다)
      let grade = '';
      try {
        const p = window.ChaeksaUsage && ChaeksaUsage.plan();
        if (p === 'super') grade = ' · 책사(전체 열람)';
        else if (p === 'member') grade = ' · 구독';
      } catch (e) {}
      $('cloudWho').textContent = (C.email() || '로그인됨') + grade;
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
  if (손님()) {
    // 로그인 전에는 무료도 열지 않는다 — 랜딩이 팔고, 카카오 원탭이 문이다.
    showLanding();
  } else {
    const act = People() ? People().active() : null;
    if (act) { start(People().toProfile(act)); booted = true; }
    else if (saved) { try { start(JSON.parse(saved)); booted = true; } catch (e) { localStorage.removeItem(KEY); } }
    if (!booted) {
      // 갈림은 로그인 여부가 아니라 **원국 유무**다. 관문을 내린 뒤로
      // 「로그인은 했고 사주만 없는 사람」이라는 갈래가 의미를 잃었다 —
      // 이제 로그인 안 한 사람도 여기로 온다. 원국이 없으면 랜딩부터 보여준다.
      showLanding();
    }
  }
  goHash(booted);         // #탭이름 으로 들어온 경우 그 탭을 연다
  // 서버에 저장된 게 있으면 가져온다 (없으면 조용히 넘어간다)
  if (window.ChaeksaCloud && ChaeksaCloud.signedIn()) cloudSync(false);
})();
