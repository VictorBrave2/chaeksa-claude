/* 책사 앱 UI v1 */
(function () {
  'use strict';
  const E = ChaeksaEngine, f = E.fmt, AI = ChaeksaAI;
  const $ = (id) => document.getElementById(id);
  const KEY = 'chaeksa.profile', PKEY = 'chaeksa.partners';
  const HK = () => 'chaeksa.chat.' + (profile && profile.id ? profile.id : 'solo');
  // let 이다 — 앱을 열어둔 채 날이 바뀔 수 있다. 오늘·달력 탭에 들어올 때 다시 읽는다.
  let today = new Date();
  let profile = null, R = null;
  const elemClass = (i, isStem) => 'e-' + (isStem ? f.stemElem(i) : f.branchElem(i));
  // 호칭을 걷었다(2026-09-10 사장님 「공주,도련님 삭제. 통변 과정에서 자꾸 꼬이네」 · docs/40).
  // 예전엔 글에 「공주님」을 박아 두고 남자 명식이면 화면에서 「도련님」으로 바꿔치기했다.
  // 그 바꿔치기가 아래 fix() 의 DOM 훑기 안에 있어서, 한 문장이 화면에 서기까지
  // 문자열 치환을 두 번 거쳤다. 애초에 안 박으면 치환기가 필요 없다.
  //
  // 옛 프로필에는 '공주님'·'도련님'·'당신'이 이름으로 **저장돼 있다**. 그대로 두면
  // 카드에 「공주님님」이 찍힌다(실제로 그랬다). 전부 빈 이름으로 읽는다.
  const 대체이름 = ['공주님', '도련님', '당신', '이름 없음'];
  /** 사람 이름을 화면에 낼 값으로 고른다. 옛 대체 이름은 빈 값으로 읽는다.
   *  사람 목록(ChaeksaPeople)에도 '공주님'이 저장돼 있어 이 문을 꼭 지나야 한다. */
  const 사람이름 = (n) => {
    const s = String(n == null ? '' : n).trim();
    return (!s || 대체이름.indexOf(s) >= 0) ? '' : s;
  };
  const 이름값 = () => 사람이름(profile && profile.name);
  const nim = () => { const n = 이름값(); return n ? n + '님' : ''; };
  (function () {
    // 같은 문에서 십신·격 이름도 걷는다(2026-09-04 「보이지 않는 심장」) — textContent 로 찍히는 자리까지 전부.
    // 글 노드만 본다. 입력칸·스크립트는 글 노드가 아니라 안 건드린다.
    const 십신자 = /정관|편관|칠살|관살|관성|정재|편재|재성|정인|편인|인수|인성|식신|상관|식상|비견|겁재|비겁|양인|건록|[가-힣]격[이은을의에]/;
    const fix = (n) => {
      if (n.nodeType !== 3) return;
      // 여기 있던 공주님↔도련님 교체 두 줄을 걷었다(2026-09-10). 이제 이 문은
      // 십신 낱말만 정리한다 — 화면에 서기까지 치환을 한 번만 거친다.
      if (십신자.test(n.nodeValue) && window.ChaeksaDan && ChaeksaDan.공주님말) {
        const p = n.parentNode; if (p && /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) return;
        // 십신을 이름으로 부르고 그 자리에서 뜻을 푸는 칸(data-plain)은 건드리지 않는다(2026-09-12 사장님).
        // 이 문이 그 칸까지 바꿔치기하면 「천간에 정관이」가 도로 「자리가」로 돌아간다.
        if (n.parentElement && n.parentElement.closest('[data-plain]')) return;
        const v = ChaeksaDan.공주님말(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v;
      }
      // 「잣대 공개 —」 꼬리말은 기준 공개 시절의 것 — 심장은 보이지 않는다(2026-09-04). 그 문단을 숨긴다.
      if (/^\s*잣대 공개 —/.test(n.nodeValue) && n.parentElement) n.parentElement.hidden = true;
    };
    const walk = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) fix(n); };
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'characterData') fix(m.target);
        m.addedNodes.forEach(a => { if (a.nodeType === 3) fix(a); else if (a.nodeType === 1) walk(a); });
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    // window.호칭갱신 은 걷었다 — 되돌릴 호칭이 없어졌다(2026-09-10).
  })();
  const nimSafe = () => esc(nim());
  // 이름을 안 적으신 분은 nim() 이 빈 문자열이다. 그대로 이으면 「의 책사단」
  // 「을 위한 첫 의논」처럼 조사만 남는다. 부르는 자리마다 갈래를 준비한다.
  const 부름 = (뒤, 없을때) => { const n = nim(); return n ? esc(n) + 뒤 : 없을때; };
  const god = (stem) => E.TEN_GODS[E.tenGod(R.analysis.dayStem, stem)];

  // 아주 가벼운 마크다운: **굵게**, 줄바꿈만 (LLM 서술 표시용)
  // 화면으로 나가는 마지막 문 — 십신·격 이름을 공주님말로 바꾼 뒤 이스케이프한다(2026-09-04 「보이지 않는 심장」).
  const 공말 = (s) => (window.ChaeksaDan && ChaeksaDan.공주님말) ? ChaeksaDan.공주님말(s) : s;
  const esc = (s) => 공말(String(s == null ? '' : s)).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  // 십신을 이름 그대로 내는 자리(이야기 화면 · 오늘 한마디)는 이걸로 — esc() 는 공주님말을 거쳐서 「상관」이 「튀는 재주」로 바뀐다.
  // 2026-09-12 이야기 화면에서 「튀는 재주 오는 날 = 말이 세게 나가요」가 나가고서야 알았다. 화면 감시자 면제(data-plain)만으로는 안 된다.
  const escP = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
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

  // 엮임 종류 이름은 화면에 안 낸다 — 무엇이 일어났는지만 남긴다(공주님 원칙)
  const 강약말 = (s) => ({ 신강: '힘이 센 쪽', 중화: '고른 쪽', 신약: '힘이 약한 쪽' })[String(s || '').split(' ')[0]] || s;
  const 엮임말 = (k) => k ? ({ 육합: '붙음', 삼합: '한 덩어리', 반합: '반쯤 묶임', 복음: '같은 글자 겹침', 충: '부딪힘' }[k] || k) : k;
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


  function renderPeopleBtn() {
    const btn = $('btnPerson'); if (!btn || !People()) return;
    const p = People().active();
    btn.classList.toggle('hide', !p);
    if (p) $('personName').textContent = 사람이름(p.name) || '나';
  }

  // 09-25 사람 고르기 · 고치기 폼이 같이 쓴다(wirePeople 안에 두면 openPeople 이 못 본다)
  function 사람지우기(id) {
    const P = People(), p = P.get(id);
    if (!p) return;
    if (!confirm(`${p.name} 님의 사주와 관련 기록을 지웁니다. 계속할까요?`)) return;
    const 지운사람 = p.id;
    P.remove(id);
    $('personForm').classList.add('hide'); $('peopleSheet').classList.add('hide');
    // 로그인돼 있으면 서버에서도 지운다 — 안 그러면 다음에 앱을 열 때 되살아난다(2026-09-22 점검). 실패해도 앱은 그대로 간다.
    if (window.ChaeksaCloud) {
      try { if (ChaeksaCloud.removePerson) ChaeksaCloud.removePerson(지운사람).catch(() => {}); } catch (e) {}
      ChaeksaCloud.pushSoon();
    }
    start(P.toProfile(P.active()));
  }
  function openPeople() {
    const P = People(); if (!P) return;
    const cur = P.activeId();
    $('peopleList').innerHTML = P.list().map(p => `
      <div class="pr ${p.id === cur ? 'on' : ''}" data-id="${p.id}">
        <button class="pr-main" data-id="${p.id}" data-a="pick">
          <b>${esc(사람이름(p.name) || '나')}</b>
          <span>${esc(p.relation)}${p.isSelf ? '' : ''} · ${p.birth.year}.${p.birth.month}.${p.birth.day}${p.birth.hour == null ? ' (시간 모름)' : ''}</span>
        </button>
        <button class="btn-ghost" data-id="${p.id}" data-a="edit" aria-label="수정">고치기</button>
        ${P.list().length > 1 ? `<button class="btn-ghost pr-del" data-id="${p.id}" data-a="del" aria-label="지우기">지우기</button>` : ''}
      </div>`).join('') || '<p class="hint">아직 등록된 사람이 없습니다.</p>';
    // 09-25 사장님 「프로필 선택에 고치기도 좋지만 삭제도 필요함」 — 줄마다 지우기. 마지막 한 사람은 못 지운다(고치기 폼과 같은 규칙).
    $('peopleList').querySelectorAll('button').forEach(b => b.onclick = () => {
      if (b.dataset.a === 'pick') { P.setActive(b.dataset.id); $('peopleSheet').classList.add('hide'); start(P.toProfile(P.active())); }
      else if (b.dataset.a === 'del') 사람지우기(b.dataset.id);
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
    $('pfG').value = b.gender || (profile && profile.gender === 'M' ? 'F' : 'M');   // 09-25 새 사람은 내 반대 성별이 기본
    try { 컷바꾸기('pfG', 'pfCut', { M: 'story-jigeum', F: 'story-sns' }); } catch (e) {}
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
    const name = $('pfName').value.trim() || (rel === '나' ? '' : '이름 없음');
    if (editingId) {
      P.update(editingId, { name, relation: rel, birth, isSelf: rel === '나' });
    } else {
      // 사람을 추가해도 보던 프로필은 그대로 둔다 — 첫 사람일 때만 people.js가 활성화한다
      pendingPick = P.add({ name, relation: rel, isSelf: rel === '나' || !P.list().length, birth });
      try { window.ChaeksaTrack && ChaeksaTrack.event && ChaeksaTrack.event('profile'); } catch (e) {}   // 깔때기 ② 생년월일 넣음
    }
    $('personForm').classList.add('hide');
    $('peopleSheet').classList.add('hide');
    if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
    const 새 = pendingPick;   // renderPartners 가 비우기 전에 붙잡는다
    if (!R || (editingId && editingId === P.activeId())) start(P.toProfile(P.active()));
    else { renderPeopleBtn(); renderPartners(); renderHome(); }
    // 상담 장이 열려 있으면 고르기도 바로 갱신한다(2026-09-04 밤 점검 「입력했는데 안 된다」).
    try { renderGeunamja(); renderMaeum(); renderGunghap(); renderSheet();
      ['gnPick', 'mmPick', 'ghPick', 'shPick'].forEach(id => { const e = $(id); if (e && 새 && [...e.options].some(o => o.value === 새)) e.value = 새; });
    } catch (e) {}
    try {
      // 이야기 화면에서 「+ 추가」로 넣은 사람은 곧 그 질문의 그 사람이다 — 방금 넣고 또 고르게 하지 않는다.
      // 첫 사람일 때는 고르는 칸(stWho)이 아직 없고 「그 사람 추가」 단추만 있다. 예전엔 stWho 를 조건으로 봐서
      // 첫 사람을 넣어도 화면이 그대로였다(2026-09-22 점검). 두 경우 다 있는 단추(btnStAdd)로 본다 — 혼자 보는 이야기에는 없다.
      if (새 && $('btnStAdd') && document.querySelector('.tab[data-tab="story"]:not(.hide)')) { window.현재그사람 = 새; renderStory(); }
    } catch (e) {}
    try {
      // 궁합총론 탭에서 넣은 사람은 곧 그 사람이다 — 첫 사람이어도 바로 그린다. 고친 사람이면 새 생년월일로 다시 그린다.
      if (document.querySelector('.tab[data-tab="chongnon"]:not(.hide)')) { if (새) 궁합고르기(새); renderChongnon(); }
      if (document.querySelector('.tab[data-tab="ssom"]:not(.hide)')) { if (새) 궁합고르기(새); renderSsom(); }
    } catch (e) {}
  }

  function wirePeople() {
    if (!People()) return;
    $('btnPerson').onclick = openPeople;
    $('btnClosePeople').onclick = () => $('peopleSheet').classList.add('hide');
    $('btnAddPerson').onclick = () => openPersonForm(null);
    $('pfCancel').onclick = () => $('personForm').classList.add('hide');
    $('pfSave').onclick = savePerson;
    $('pfDelete').onclick = () => 사람지우기(editingId);
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

  // 첫 방문 착석 연출(열 사람이 자리에 앉는 것)은 2026-09-12 사장님 「열책사 어쩌고 다 지우자」로 걷었다.

  function readForm() {
    const noTime = $('noTime').checked;
    const sol = toSolar();
    if (!sol) { alert('생년월일을 입력해 주세요.'); return null; }
    if (sol.error) { alert(sol.error); return null; }
    const p = { name: $('name').value.trim(), year: sol.y, month: sol.m, day: sol.d,
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
    try { 도착(); } catch (e) {}   // 09-25 첫 화면에서 고른 탭으로
  };
  $('noTime').onchange = (e) => { $('hh').disabled = $('mi').disabled = e.target.checked; };

  // ───── 탭 ─────
  // 원국을 넣은 적이 있는가. 없으면 탭들이 담긴 #app 자체가 hide 라 탭만 켜도 안 보인다.
  const hasProfile = () => !!((People() && People().active()) || localStorage.getItem(KEY));

  // 결제 이력을 한 번이라도 제대로 받았는가. 못 받았으면 탭을 옮길 때마다 다시 묻는다.
  let 결제이력받음 = false;

  // 궁합총론 탭(chongnon) — 고른 그 사람 · 마지막으로 그린 두 사람 · 13장 링크로 건너갈 때 넘길 그 사람.
  // go() 가 읽으니 go() 보다 위에 둔다(아래에 두면 부팅 때 TDZ 로 죽는다).
  const 궁합고름키 = 'chaeksa.chongnonWho';
  let 궁합그사람 = (() => { try { return localStorage.getItem(궁합고름키) || null; } catch (e) { return null; } })();
  let 궁합그린것 = '', 궁합넘김 = null;

  // 홈은 보던 자리를 기억한다 (2026-09-12 사장님 「콘텐츠 들어갔다가 뒤로가면 스크롤 다시
  // 내려야하는게 너무 불편해」). 표지를 눌러 들어갔다 「← 홈」 으로 돌아오면 그 표지 앞에 선다.
  // **홈 하나만** 기억한다 — 다른 화면은 사람이나 장이 바뀌면 길이도 바뀌어서 옛 자리가 엉뚱한 데다.
  let 홈자리 = 0;
  const 지금자리 = () => window.scrollY || document.documentElement.scrollTop || 0;
  const 열린탭 = () => { const el = document.querySelector('.tab:not(.hide)'); return el ? el.dataset.tab : ''; };

  // 09-25 사장님 「콘텐츠 들어가면 홈으로 빠져나갈 길이 위아래 있어야」 — 화면 규격: 홈이 아닌 탭은 맨 위 · 맨 아래에 「← 홈」. 코드가 보장한다(탭마다 손으로 안 넣는다).
  function 홈길(tab) {
    if (tab === 'home') return;
    const el = document.querySelector('.tab[data-tab="' + tab + '"]'); if (!el) return;
    const 만들기 = (pos) => { const b = document.createElement('button'); b.className = 'btn ghost small backhome backhome-' + pos; b.dataset.open = 'home'; b.textContent = '← 홈'; b.onclick = () => go('home'); return b; };
    if (!el.querySelector(':scope > .backhome-top')) { const t = el.querySelector(':scope > .backhome'); if (t) t.classList.add('backhome-top'); else el.insertAdjacentElement('afterbegin', 만들기('top')); }
    if (!el.querySelector(':scope > .backhome-bottom')) el.insertAdjacentElement('beforeend', 만들기('bottom'));
  }
  function go(tab) {
    // 떠나기 전에 자리를 적어 둔다. 그리기 전에 해야 한다 — 그린 뒤엔 이미 0 으로 튕겨 있다.
    // 홈에서 아래 「홈」을 다시 누르는 것은 「맨 위로」라는 뜻이다. 그때만 자리를 잊는다.
    if (열린탭() === 'home') 홈자리 = (tab === 'home') ? 0 : 지금자리();
    // 유형 카드(789 유형·SSR 등급·시즌 카드)는 2026-09-04 삭제 — 「무슨 말인지도 모르더라」. 옛 링크는 홈으로.
    if (tab === 'gacha' || tab === 'today') tab = 'home';   // 오늘 탭은 2026-09-13 에 걷었다 — 옛 링크는 홈으로
    홈길(tab);
    // 원국 없는 방문자가 '← 홈'을 누르면 빈 홈이 아니라 안내 화면으로 돌아가야 한다
    if (tab === 'home' && !hasProfile()) { $('app').classList.add('hide'); showLanding(); return; }
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('hide', t.dataset.tab !== tab));
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.go === tab));
    // 탭 위의 열 책사 한마디(renderChorus)는 2026-09-12 사장님 「열책사 어쩌고 다 지우자」로 걷었다.
    if (tab !== 'home') 본표시(tab); else { try { renderWtHome(); } catch (e) {} }   // 홈으로 돌아오면 「최근 본」이 바로 찍힌다
    // 자리 잡기 — 홈이면 보던 데로, 아니면 맨 위로.
    // 그림이 늦게 서면 그만큼 짧아진 문서에 맞춰 브라우저가 잘라 버린다. 한 박자씩 두 번 더 민다.
    if (tab === 'home' && 홈자리 > 0) {
      const 되돌리기 = () => window.scrollTo({ top: 홈자리 });
      되돌리기();
      requestAnimationFrame(되돌리기);
      setTimeout(되돌리기, 140);
    } else window.scrollTo({ top: 0 });
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
    // 달력 탭은 2026-09-17 에 걷었다(사장님 「달력 삭제 — 설득력없음」). 날 점수(calendar.js)도 같이 나갔다.
    if (tab === 'geunamja') renderGeunamja();
    if (tab === 'maeum') renderMaeum();
    if (tab === 'jeongtong') { try { const b = $('jtOut'); if (b && window.ChaeksaJeongtong && profile) window.ChaeksaJeongtong.그리기(b, profile); } catch (e) {} }
    if (tab === 'ssom') { try { renderSsom(); } catch (e) { try { console.warn('연애궁합 탭:', e); } catch (x) {} } }
    if (tab === 'chongnon') { try { renderChongnon(); } catch (e) { try { console.warn('궁합총론 탭:', e); } catch (x) {} } }
    if (tab === 'gunghap') renderGunghap();
    if (tab === 'sheet') renderSheet();
    if (tab === 'story') renderStory();
    if (tab === 'memo') renderMemo();
    if (tab === 'taekil') wireTaekil();
    // 궁합총론 13장 링크로 건너왔으면 거기서 보던 그 사람을 이 장에서도 골라 둔다 — 첫 사람으로 바뀌어 있으면 엉뚱한 사람을 보게 된다.
    if (궁합넘김) {
      const id = 궁합넘김; 궁합넘김 = null;
      try { const e = 고르는칸[tab] ? $(고르는칸[tab]) : null; if (e && [...e.options].some(o => o.value === id)) { e.value = id; if (e.onchange) e.onchange(); } } catch (e) {}
    }
  }
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => go(b.dataset.go));

  // 주소 뒤 #탭이름 으로 바로 들어올 수 있게 한다. taekil.html 같은 바깥 페이지에서
  // '상담 신청하기'를 눌렀을 때 홈으로 떨어지면 버튼 문구와 어긋난다.
  // 없는 탭 이름이 오면 아무것도 안 한다 — 빈 화면을 띄우느니 홈이 낫다.
  // 사주 없이도 읽을 수 있는 탭. 나머지는 원국이 있어야 그려진다.
  const NO_PROFILE_TABS = ['taekil'];

  function goHash(booted) {
    let t = (location.hash || '').replace(/^#/, '');
    // #sheet-ibyeol 꼴 — 결제 화면(pay.html)이 사람마다 사는 장을 그 장으로 곧장 보낸다(2026-09-12)
    const 장m = /^sheet-([a-z]+)$/.exec(t); if (장m) { window.현재장 = 장m[1]; t = 'sheet'; }
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
    // 이름이 없으면 없는 대로 둔다. 대신 부르는 자리마다 이름 없는 갈래를 준비해 뒀다.
    profile = p; R = E.calc(p);
    $('landing').classList.add('hide'); $('formCard').classList.add('hide');
    $('btnSettings').classList.remove('hide');
    $('app').classList.remove('hide'); $('nav').classList.remove('hide');
    $('subtitle').textContent = nim() ? `${nim()}의 책사단` : '나의 책사단';
    renderPeopleBtn();
    renderToday(); try { renderMe(); } catch (e) {} renderPartners(); renderHome();   // 09-25 원국 탭(me) 걷음 — 홈 안의 원국만
    try { renderWtHome(); } catch (e) { try { console.warn('홈 목록 실패:', e); } catch (e2) {} }
    go('home');
  }

  // ───── 총평 — 로그인·입력 직후 제일 먼저 보는 카드 ─────
  // 순서가 전략이다: 총평(구조) → 결함 → 과거(본인이 검증) → 현재 → 미래는 결제.
  // 과거를 맞힌 잣대가 미래를 잰다는 사실을 화면에 적는다 — 스토리 틀 그대로.
  // ── 첫 화면 = 간명서 (2026-08-29 「문진 말고 특장점 창을 띄워야지」) ──
  // 첫 의논 맛보기(renderChong · #chong)를 여기서 걷었다 (2026-09-12 이야기 서점 전략 — 홈은 표지만 세운다).
  // 의논 전문은 의논 화면(renderGanmyeong)이 그대로 그린다. 홈에서는 전체 목록 → 「나를 두고 열 사람이」로 간다.

  // ───── 홈 — 타일과 가운데 만세력 ─────
  function renderHome() {
    // 첫 의논(#chong)은 홈에서 걷었다(2026-09-12 이야기 서점 전략). 의논 화면(ganmyeong)은 전체 목록에서 연다.
    const a = R.analysis;
    // 첫 마디(standing)·「지금 어디에 계신지」는 2026-09-14 원국 탭 개편으로 걷었다.
    // 「타일 미리보기」는 옛 서고(#shelves)의 배지·부제를 채우던 코드였다.
    // 서고를 지웠으므로(2026-09-09) 여기서 세던 것도 걷었다 — 홈은 renderWtHome 하나가 그린다.
    // tf 는 아래 홈 장면(hs-day)과 나눔 문구가 그대로 쓴다.
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    // ── 홈의 얼굴 (2026-08-30 「양산형 홈페이지 같잖아」) ──
    // 스무 개짜리 균일 타일 그리드는 앱 런처 문법이라 궁정이 되지 않는다.
    // 홈을 하루로 만든다: 오늘의 장면 → 첫 의논 → 오늘 나온 책사 하나.
    // 나머지 타일은 전부 서랍에 넣었다(index.html 의 details.fold).
    // 지어내지 않는다: 이름과 오늘의 간지, 엔진이 낸 값뿐이다.
    // 차례는 도열 칸에서 오늘 나온 이를 밝히는 데 쓰였다. 도열을 걷어서(2026-09-12) 자리만 고른다.
    let [키0, 이름0, 탭0, 말0] = 오늘의책사[날번호() % 오늘의책사.length];
    let 행동0 = '', 비 = null;
    // 비서(docs/29 둘) — 오늘 이 사람에게 잰 값으로 한 사람이 말한다.
    // 위의 문 안내 문장은 값이 하나도 없을 때만 남는다(엔진이 못 재면 물러난다).
    try {
      비 = (window.ChaeksaDan && ChaeksaDan.오늘) ? ChaeksaDan.오늘(R, today) : null;
      if (비 && 비.말) {
        이름0 = 비.축; 키0 = 책사키[비.축] || 키0; 탭0 = 비.탭 || 탭0; 말0 = 비.말; 행동0 = 비.행동 || '';
      }
    } catch (e) {}
    const sc = $('homeScene');
    if (sc) {
      sc.classList.remove('hide');
      // 맞이하는 말이 먼저다 — 사실 통보는 그 다음이다.
      // 「기다리고 있었습니다」는 연출이지 명리 주장이 아니다(판정은 엔진, 전달은 우리 몫).
      // 얼굴이 없으면 얼빡 자리를 비우고 인장만 세운다 — 빈 액자는 두지 않는다.
      // 책사 얼굴·이름·직함은 걷었다(2026-09-12 「열책사 어쩌고 다 지우자」). 오늘 한마디 문장만 남긴다.
      sc.innerHTML =
        '<div class="hs-veil"></div><div class="hs-body">'
        + '<p class="hs-hail">오늘</p>'
        + '<p class="hs-name">' + esc(nim()) + '</p>'
        + '<p class="hs-day">' + esc(f.pillarKo(tf.day)) + ' · ' + esc(f.stemElem(tf.day.stem)) + '의 날이에요</p>'
        + '<button class="hs-say" type="button">'
        + '<span class="cs-txt">' + escP(말0)
        + (행동0 ? '<span style="display:block;margin-top:6px;opacity:.78;font-size:.92em">' + escP(행동0) + '</span>' : '')
        + '</span><span class="cs-go">' + (탭이름(탭0) ? esc(탭이름(탭0)) + ' ' : '') + '▸</span></button>'
        + '<button class="hs-keep" type="button">이 한마디 간직하기</button></div>';
      sc.classList.add('noface');   // 얼굴 자리를 접는다 — 얼굴을 안 세우니 늘 접힌다
      const b0 = sc.querySelector('.hs-say'); if (b0) b0.onclick = () => go(탭0);
      // ── 어제와 오늘이 이어진다 (2026-09-04 1단계 「내일 다시 열 이유」) ──
      // 오늘의 한마디를 날짜별로 남겨 두고, 어제 것이 있으면 그 아래 세운다. 온 날도 센다(기기 안에서만).
      try {
        const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const 오늘키 = ymd(today), 어제 = new Date(today); 어제.setDate(today.getDate() - 1); const 어제키 = ymd(어제);
        const 일기 = JSON.parse(localStorage.getItem('chaeksa.daily') || '{}');
        const 날들 = JSON.parse(localStorage.getItem('chaeksa.days') || '[]');
        const 다시 = 날들.length > 0 && !날들.includes(오늘키);
        if (!날들.includes(오늘키)) { 날들.push(오늘키); localStorage.setItem('chaeksa.days', JSON.stringify(날들.slice(-60))); }
        일기[오늘키] = { 이름: 이름0, 말: 말0 };
        Object.keys(일기).sort().slice(0, -14).forEach(k => delete 일기[k]);
        localStorage.setItem('chaeksa.daily', JSON.stringify(일기));
        const hail = sc.querySelector('.hs-hail');
        if (hail && (다시 || 날들.length > 1)) hail.textContent = '오늘도 오셨습니다.';
        const y = 일기[어제키];
        if (y && y.말 && y.말 !== 말0) {
          const box = document.createElement('div'); box.className = 'hs-yday';
          box.innerHTML = '<span class="k">어제 · ' + esc(이름of(y.이름)) + '</span><p>' + esc(y.말) + '</p>';
          sc.querySelector('.hs-body').insertBefore(box, sc.querySelector('.hs-keep'));
        }
      } catch (e) {}
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
            // 말을 건네는 컷(say-<키>.webp)이 있으면 그것을, 없으면 초상을 쓴다 — config.js CHAEKSA_SAY_ART
            초상: (window.CHAEKSA_SAY_ART || []).includes(키0) ? 'art/say-' + 키0 + '.webp?v=' + (window.CHAEKSA_ART || 1)
              : (window.CHAEKSA_ART && 초상(키0, 0)) ? 초상(키0, 0) + '?v=' + window.CHAEKSA_ART : '',
            이름: 이름of(이름0), 직함: 직함of(이름0), 말: 말0,
            본인: nim(), 간지: f.pillar(tf.day) + '일',
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
    // 책사단 도열(#todayEnvoy)이 여기 있었다. 2026-09-12 사장님 「이동경로가 꼬이네」로 걷었다.
    // 열 얼굴이 곧 열 개의 문이었는데, 그 열 곳 가운데 일곱이 09-04 에 사장님이 홈에서 빼신 화면이다
    // (index.html 176줄 — year·inyeon·jikcheop·dohwa·lovestory·gacha·gwangye).
    // 홈 목록은 「뺀다」 하고 도열은 「들어간다」 하니, 한 화면 안에서 두 길이 서로 어긋났다.
    // 화면과 탭 코드는 살아 있다 — 주소(#jikcheop)와 그날 한마디 단추(위 hs-say)로 열린다.
    // 랜딩의 열 사람 도열(#lpCorps)도 2026-09-12 밤에 걷었다(「열책사 어쩌고 다 지우자」).
    // 서고(#shelves)의 배지·부제 열둘을 채우던 자리였다. 서고를 지웠다(2026-09-09 「홈 하나로 정리」).
    // T.jichim · T.naepyeon · T.inyeon · T.yearFlow · T.lifeCurve · T.career · T.관계지도 ·
    // T.love · T.wealth · T.cachedSample 을 홈을 그릴 때마다 돌려서 안 보이는 칸에 쓰고 있었다.
    // 그 화면들이 필요로 하면 그 탭이 열릴 때 제가 돈다. 홈에서는 안 돈다.
    // 홈의 비망록 배너를 걷었다(2026-09-10). #memoBadge · #memoTitle · #memoSub 가
    // index.html 에 **한 번도 없었다** — 첫 줄의 `if (!$('memoSub')) return;` 에 걸려
    // 늘 그냥 돌아 나왔다. 오류가 안 나니 아무도 몰랐다. tools_check 4번이 잡았다.
    // 비망록은 2026-08-31 에 서고에서 내린 물건이라(「공주님께 숙제를 시킨다」) 되살리지 않는다.
    // 화면은 #memo 로 그대로 열린다.
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
  function renderToday() { try { renderTodayMemo(); } catch (e) {} }   // 오늘 탭을 걷었다(2026-09-13). 비망록 알림만 남긴다(상자가 없으면 스스로 빠진다).

  // 오늘의 시간대 — 12시진 곡선. 用값을 막대 높이로, 십신을 사건 라벨로 바꾼다.
  // 오늘의 시간대(renderHours·pickHour)는 오늘 탭과 함께 걷었다(2026-09-13). 시운은 판정 단위에서 뺀다 — 시진까지 내리면 틀릴 자리가 12배다.

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
        <p class="sc-same">이 시각은 보정을 넣어도 사주가 같아요. 경계에서 멀어요.</p>`;
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
      <div class="sc-head"><b>시각 보정을 넣으면 ${diff.map(k => NAMES[k]).join('·')}가 바뀌어요</b>
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
      const cta = $('aiBrief');
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


  // loadAiBrief(「좌장에게 오늘을 묻기」 LLM 브리핑)는 2026-09-13 에 지웠다 — 사장님 「다 삭제해」. 히어로는 규칙 문장만 선다.
  function loadAiBrief() { heroFallback(); }
  // AI를 못 쓸 때도 히어로는 비지 않는다 — 규칙 엔진의 첫 문장을 세운다
  function heroFallback() {}   // 오늘 탭을 걷었다(2026-09-13 사장님 「근거도 없고 이해도 어려워」) — 히어로가 없다.

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
    // 총합은 '원국이 어떤가'이고 촉발은 '지금 방아쇠가 당겨졌나'다. 둘은 다를 수 있다 —
    // 원국은 눌려 있는데 오늘 이 시각에 터지는 경우가 그것이다.
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
  function renderMzDeck() {}   // 2026-09-14 뺐다 — 원국은 홈 맨 위(wongook.js).



  function renderMe() {
    const a = R.analysis, du = E.currentDaeun(R, today);
    // 한입 카드(renderMzDeck)·오행 막대·태그는 2026-09-14 에 뺐다 — 원국은 홈 맨 위(wongook.js)에서 생극제화 표로 읽는다.

    // 유형 카드 뽑기 — 첫 뽑기 때 표본을 만들고(몇 초, 그게 드럼롤이다) 캐시한다
    $('gachaWrap').classList.add('hide'); $('btnGacha').textContent = '카드 뽑기';
    if ($('btnGacha')) $('btnGacha').onclick = () => {
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
            ? `지어낸 사주 ${c.rar.n.toLocaleString()}개 가운데 이 유형은 나뿐입니다 · ${c.tier}`
            : `등급 ${c.tier} · 같은 사주는 언제나 이 카드입니다`;
          $('btnGacha').disabled = false; $('btnGacha').textContent = '다시 뽑아도 이 카드';
          // 두 번째 카드 — 지금 대운이 이 사주에 필요한 걸 갖고 왔는가
          $('seasonWrap').classList.add('hide'); $('btnSeason').classList.remove('hide');
          if ($('btnSeason')) $('btnSeason').onclick = () => {
            const sn = window.ChaeksaTypecard.seasonNow(R);
            $('seasonSvg').innerHTML = window.ChaeksaTypecard.drawSeason(이름값(), R, sn);
            const fl2 = $('seasonFlip'); fl2.style.animation = 'none'; void fl2.offsetWidth; fl2.style.animation = '';
            $('seasonWrap').classList.remove('hide');
            $('btnSeason').classList.add('hide');
            const 조합 = (c.tier === 'SSR' || c.tier === 'SR') && (sn.grade.name === '만개' || sn.grade.name === '순풍')
              ? ' — 희귀 유형에 시즌까지 왔습니다. 지금이 그 때입니다'
              : sn.grade.name === '만개' ? ' — 유형과 무관하게, 시즌은 지금이 최고입니다' : '';
            $('seasonNote').textContent = `타고난 카드 ${c.tier} × 지금 시즌 ${sn.grade.name}${조합}`;
            if ($('btnSeasonShare')) $('btnSeasonShare').onclick = async () => {
              const b = $('btnSeasonShare'); b.disabled = true; b.textContent = '만드는 중…';
              try {
                const r = await window.ChaeksaTypecard.share($('seasonSvg').innerHTML, `시즌_${sn.grade.name}`);
                b.textContent = r === 'shared' ? '자랑 완료!' : r === 'copied' ? '복사됐어요 — Ctrl+V로 붙여넣기' : '다운로드 폴더에 저장했어요';
              } catch (e) { b.textContent = '다시 시도'; }
              b.disabled = false;
              setTimeout(() => { b.textContent = '시즌 자랑하기'; }, 2500);
            };
          };
          if ($('btnGachaShare')) $('btnGachaShare').onclick = async () => {
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
    // 명식 카드·일간 감성문은 wongook.js(#wgFull)로 옮겼다(2026-09-14).
    const max = Math.max(...a.elemCount, 1), colors = ['var(--wood)','var(--fire)','var(--earth)','var(--metal)','var(--water)'];
    $('daeun').innerHTML = R.daeun.list.map(d => `<div class="du ${du && du.startAge === d.startAge ? 'now' : ''}"><div class="age">${d.startAge}세</div><div class="han ${elemClass(d.stem, true)}">${f.stem(d.stem)}</div><div class="han ${elemClass(d.branch, false)}">${f.branch(d.branch)}</div><div class="yr">${d.startYear}~</div></div>`).join('');
    const plName = profile.placeName || '서울';
    const bornNote = $('bornNote');
    // 시간 모름이면 엔진이 낮 12시로 셈해 날짜만 쓴다 — 그 12시를 「실제 태양시」로 내보내면 없는 시각을 지어낸 셈이다(2026-09-22 점검).
    if (bornNote) bornNote.innerHTML = !R.pillars.hour
      ? '태어난 시간을 몰라 시주는 비워 뒀어요. 나머지 여섯 글자로 봐요.'
      : `${plName}에서 태어난 걸로 봐요. 진태양시 보정은 ${profile.solarCorrection === false ? '안 넣었어요' : '넣었어요'}. 실제 태양시로는 <b>${R.corrected.y}.${R.corrected.m}.${R.corrected.d} ${String(R.corrected.hh).padStart(2,'0')}:${String(R.corrected.mm).padStart(2,'0')}</b>이에요.`;
    renderSolarCompare(profile);
    $('daeunHint').textContent = `${R.daeun.startAge}살부터 10년마다 바뀌어요.` + (du ? ` 지금은 ${f.pillarKo(du)}(${f.pillar(du)}) 대운이에요. 이 대운이 내 글자를 어떻게 건드리는지는 위 「지금 오는 글자」에 있어요.` : '');
    // 「올해와 내년」「앞으로 12개월」은 걷었다(2026-09-14) — 옛 십신 흐름말(GOD_FLOW)이었다. 올해·이달은 wongook 의 「지금 오는 글자」가 표로 읽는다.
    try { if (window.ChaeksaWongook) ChaeksaWongook.render(R, today, $('wgFull'), { full: true }); } catch (e) { try { console.warn('원국 탭 실패:', e); } catch (e2) {} }
    // 설명서(58·59조) — 원국 아래에 펼친 판으로. 사람마다 따로 기록하므로 pid 를 준다.
    try { if (window.ChaeksaSeolmyeong) ChaeksaSeolmyeong.render(R, today, $('smFull'), { full: true, pid: (function(){ try { const q = People(); return (q && q.activeId()) || 'me'; } catch (e) { return 'me'; } })() }); } catch (e) { try { console.warn('설명서 탭 실패:', e); } catch (e2) {} }
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
    // 격은 판정엔진 원국 층의 성패(층.성패)에서 읽는다(63조 문 하나 · 09-23 「층격이 나의 관점이긴해」) — typecard 를 직접 부르지 않는다.
    // (#gyeokBox 는 지금 어느 화면에도 없다. 되살릴 때 정통사주 3장 · 원국 탭과 같은 격이 나오게 둔다.)
    const P = window.ChaeksaPanjeong, Gk = window.ChaeksaGyeok;
    if (!P || !Gk) { if (card) card.classList.add('hide'); return; }
    let J; try { const s = P.판정(R, today, { 운들: [] }).층들[0].성패; J = s ? { name: s.격, 판정: s.판정, 상신: s.상신, 근거: s.근거 || {}, 잰것: {} } : null; } catch (e) { if (card) card.classList.add('hide'); return; }
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
      // 강약 점수가 갈리는 자리(「신약 0.37 / 중화 0.42」)는 법전 29조로 화면에서 뺀다 — 격이 갈리는 자리만 남긴다(2026-09-13).
      const fs = (E.forks(R.pillars) || []).filter(v => !/신강|신약|중화/.test(String(v.무료) + String(v.다른쪽)));
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
  if ($('btnShare')) $('btnShare').onclick = async () => {
    await renderShareCard();
    try { await ChaeksaShare.share($('shareCanvas'), profile.name); } catch (e) {}
  };
  if ($('btnSaveImg')) $('btnSaveImg').onclick = async () => {
    await renderShareCard();
    ChaeksaShare.save($('shareCanvas'), profile.name);
  };
  // renderProfileCard(「좌장이 읽는 원국」 Opus 정독)는 2026-09-13 에 지웠다 — 사장님 「다 삭제해」. wongook 상품은 팔지 않는다.
  async function renderProfileCard() { const c = $('aiProfile'); if (c) c.remove(); }


  // ───── 이 남자, 나한테 돈을 쓸까요? (docs/31 · 9,900원 첫 장) ─────
  // 물음 열 개. 1·2·6은 미리보기, 나머지는 결제(geunamja) 뒤에. 값은 geunamja.js, 말도 거기.
  function renderGeunamja() {
    const P = People(); const G = window.ChaeksaGeunamja; if (!P || !G || !$('gnPick')) return;
    const me = P.active();
    const list = P.list().filter(p => !me || p.id !== me.id);
    $('gnPick').innerHTML = list.length
      ? list.map(p => `<option value="${p.id}">${esc(사람이름(p.name) || '나')} · ${esc(p.relation)}</option>`).join('')
      : '<option value="">등록된 사람이 없습니다</option>';
    $('btnGn').disabled = !list.length;
    if ($('btnGnAdd')) $('btnGnAdd').onclick = () => openPersonForm(null);
    // 역산(32조) — 「먼저 달라진 것」은 사람마다 기억한다
    const 채움 = () => { const p = P.get($('gnPick').value); if ($('gnSeen')) $('gnSeen').value = (p && p.관찰) || ''; };
    if ($('gnPick')) $('gnPick').onchange = 채움; 채움();
    if ($('btnGn')) $('btnGn').onclick = () => {
      const p0 = P.get($('gnPick').value); if (!p0) return;
      if ($('gnSeen')) P.update(p0.id, { 관찰: $('gnSeen').value });
      const p = P.get(p0.id);
      const met = parseInt($('gnMet').value, 10) || null;
      showGeunamja(P.toProfile(p), p.name, met);
    };
  }
  // ───── 카드 줄 (2026-09-04 밤 사장님 「나에 대한 건 카드식, 그에 대한 건 섬세하게 문장+카드로」) ─────
  // 그 사람 장: 위에 카드 한 줄(한눈에) + 아래 문장. 나 장: 카드만, 문장은 접어 둔다.
  function 카드줄(Q, 미리, 다열림, 접기) {
    // 그 사람 장(접기 아님): 열린 비밀만 요약 카드로, 잠긴 것은 본문에서 한 번만(2026-09-04 밤 점검 「카드가 읽기를 지연」).
    const 골 = 접기 ? Q.map((q, i) => i) : Q.map((q, i) => i).filter(i => 다열림 || 미리.has(i)).slice(0, 3);
    if (!골.length) return '';
    return '<p class="gn-cards-k">한눈에</p><div class="gn-cards">' + 골.map((i) => { const q = Q[i];
      const 열림 = 다열림 || 미리.has(i);
      // 카드 제목은 물음이다 — 「비밀 3」만 적으면 무슨 답인지 모른 채 읽는다(2026-09-08 외부 감수 1번)
      const 머리 = q.구간 ? esc(q.구간) + ' · ' : '';
      return '<div class="gn-cd' + (열림 ? '' : ' locked') + '"><span class="k">' + 머리 + '비밀 ' + (i + 1) + '</span>'
        + '<i class="gn-cq">' + esc(q.물음) + '</i>'
        + '<b>' + (열림 ? esc(q.답) : '결제하면 열려요') + '</b>'
        + (접기 && 열림 && q.왜 ? '<details><summary>왜 그런지</summary><p>' + esc(q.왜) + '</p></details>' : '')
        + '</div>';
    }).join('') + '</div>';
  }

  function showGeunamja(you0, youName, met) {
    const G = window.ChaeksaGeunamja; const box = $('gnResult'); if (!box) return;
    let Rm; try { Rm = E.calc(you0); } catch (e) { box.innerHTML = '<p class="hint">계산하지 못했습니다.</p>'; box.classList.remove('hide'); return; }
    // 역산 — 공주님 쪽 「먼저 달라진 것」이 바뀌었을 수 있으니 내 사주도 다시 계산한다
    let Rf = R; try { const P0 = People(), me = P0 && P0.active(); if (me) Rf = E.calc(P0.toProfile(me)); } catch (e) {}
    let v, f; try { v = G.값(Rm, Rf, met, today, youName); f = G.문장(v, today); } catch (e) { box.innerHTML = '<p class="hint">이 사주로는 답을 만들지 못했습니다.</p>'; box.classList.remove('hide'); return; }
    // 한 남자에 한 번 — 열쇠는 그 남자의 생년월일시. 다른 남자는 새로 산다(사장님 「개별로 받아야지」).
    const 열쇠 = 'geunamja:' + [you0.year, you0.month, you0.day, you0.hour == null ? 'x' : you0.hour, you0.minute == null ? 'x' : you0.minute].join('-');
    const paid = (window.ChaeksaPay && ChaeksaPay.paidForKey && ChaeksaPay.paidForKey('geunamja', 열쇠)) || null;
    const 미리 = new Set([0, 1, 5]);
    const 다 = paid || 표무료();   // 표가 무료가 되면 산 사람이 아니어도 열 가지가 다 열린다
    const 절 = f.Q.map((q, i) => {
      const 열림 = 다 || 미리.has(i);
      return `<div class="gn-q${열림 ? '' : ' locked'}"><p class="gn-k"><i>비밀 ${i + 1}</i> ${esc(q.물음)}</p>`
        + (열림 ? `<p class="gn-a">${esc(q.답)}</p><p class="gn-w">${esc(q.왜)}</p>` : `<p class="gn-a dim">결제하면 열리는 비밀이에요.</p>`)
        + '</div>';
    }).join('');
    const 결제 = paid ? '' : 결제상자('btnGnBuy', youName, '그래서 이 사람이 나한테 도움이 되는 사람인지는 나머지 일곱 가지 비밀에서 봅니다.');
    box.innerHTML = `<h2>이 남자, 나한테 돈을 쓸까요?</h2>
      <p class="hint">${esc(youName)} · ${met ? '만난 해 ' + met + '년 · ' : ''}${today.getFullYear()}년 ${today.getMonth() + 1}월 기준</p>
      ${카드줄(f.Q, 미리, 다, false)}
      ${절}
      ${한편자리(paid, youName)}
      ${다 ? `<div class="gn-card"><p class="k">간직하기 카드</p>${f.카드.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      ${결제}`;
    box.classList.remove('hide');
    한편붙이기(box, 'geunamja', { 제목: '이 남자, 나한테 돈을 쓸까요?', 부제: '그래서 이 사람이 나한테 도움이 되는 사람인지' }, f, met, you0.관찰, 열쇠, youName);
    const bb = box.querySelector('#btnGnBuy');
    if (bb) bb.onclick = () => 결제누름(bb, 'geunamja', 열쇠);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** 결제 버튼에서 로그인이 필요할 때. 앱의 다른 로그인 자리와 같은 꼴(카카오 → 안 되면 설정 창).
   *  로그인하고 돌아오면 이 장과 고른 사람으로 다시 온다(2026-09-22 점검 — 예전엔 홈에 떨어져서 사려던 장을 다시 찾아야 했다).
   *  돌아오는 쪽은 파일 끝 「시작」이 chaeksa.return 을 읽는다. */
  const 고르는칸 = { geunamja: 'gnPick', maeum: 'mmPick', gunghap: 'ghPick', sheet: 'shPick' };
  let 복귀고름 = null;    // 로그인하러 떠나기 전에 골라 둔 사람 [칸 id, 사람 id] — 탭을 그린 뒤 다시 고른다
  let 복귀대기 = false;   // 첫 동기화가 start() 로 홈에 돌려놓으면 한 번 더 그 장으로 간다
  function 복귀고르기() {
    if (!복귀고름) return;
    try {
      const [칸, 사람] = 복귀고름;
      const e = Object.values(고르는칸).indexOf(칸) >= 0 ? $(칸) : null;
      if (e && [...e.options].some(o => o.value === 사람)) { e.value = 사람; if (e.onchange) e.onchange(); }
    } catch (e) {}
  }
  function 결제로그인() {
    try {
      const t = 열린탭();
      const 해시 = t === 'sheet' ? '#sheet-' + (window.현재장 || 'gyeolhon') : (t && t !== 'home' ? '#' + t : '');
      const 칸 = 고르는칸[t], 사람 = 칸 && $(칸) ? $(칸).value : '';
      localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, hash: 해시, pick: 사람 ? [칸, 사람] : null, at: Date.now() }));
    } catch (e) {}
    try { ChaeksaCloud.signInWith('kakao'); }
    catch (e) { try { localStorage.removeItem('chaeksa.return'); } catch (x) {} openSettings(); }
  }
  /** 앱 안 결제 단추. 이 기기에서 시작하지 않은 로그인(cloud.js hold)이면 결제 전에 어느 계정인지 한 번 묻는다(2026-09-22) —
   *  남이 보낸 링크로 로그인된 채 결제하면 산 것이 그 계정에 매인다. 동의 칸·로그인 확인은 pay.js 누르면() 이 그대로 한다
   *  (동의 전이면 누르면() 이 먼저 막으니 그때는 묻지 않는다). 값·상품·결제수단은 건드리지 않는다. */
  function 결제누름(bb, code, 열쇠) {
    try {
      const C = window.ChaeksaCloud;
      const 동의 = document.querySelector('input[data-pay-agree="' + bb.id + '"]');
      if (C && C.signedIn() && C.uploadHold && C.uploadHold() && 동의 && 동의.checked && !bb.dataset.busy) {
        const em = C.email();
        if (!confirm((em ? em + ' ' : '지금 로그인한 ') + '계정으로 결제할까요?\n\n이 기기에서 시작한 로그인이 아니라서 한 번 여쭤봐요. 결제한 것은 이 계정에서 열려요.')) return null;
      }
    } catch (e) {}
    return ChaeksaPay.누르면(bb, code, 열쇠, 결제로그인);
  }

  // ───── 그 사람, 나한테 마음이 있을까요? (둘째 장 · maeum.js) ─────
  function renderMaeum() {
    const P = People(); const G = window.ChaeksaMaeum; if (!P || !G || !$('mmPick')) return;
    const me = P.active();
    const list = P.list().filter(p => !me || p.id !== me.id);
    $('mmPick').innerHTML = list.length
      ? list.map(p => `<option value="${p.id}">${esc(사람이름(p.name) || '나')} · ${esc(p.relation)}</option>`).join('')
      : '<option value="">등록된 사람이 없습니다</option>';
    $('btnMm').disabled = !list.length;
    if ($('btnMmAdd')) $('btnMmAdd').onclick = () => openPersonForm(null);
    // 역산(32조) — 「먼저 달라진 것」은 사람마다 기억한다
    const 채움 = () => { const p = P.get($('mmPick').value); if ($('mmSeen')) $('mmSeen').value = (p && p.관찰) || ''; };
    if ($('mmPick')) $('mmPick').onchange = 채움; 채움();
    if ($('btnMm')) $('btnMm').onclick = () => {
      const p0 = P.get($('mmPick').value); if (!p0) return;
      if ($('mmSeen')) P.update(p0.id, { 관찰: $('mmSeen').value });
      const p = P.get(p0.id);
      const met = parseInt($('mmMet').value, 10) || null;
      showMaeum(P.toProfile(p), p.name, met);
    };
  }
  function showMaeum(you0, youName, met) {
    const G = window.ChaeksaMaeum; const box = $('mmResult'); if (!box) return;
    let Rm; try { Rm = E.calc(you0); } catch (e) { box.innerHTML = '<p class="hint">계산하지 못했습니다.</p>'; box.classList.remove('hide'); return; }
    // 역산 — 공주님 쪽 「먼저 달라진 것」이 바뀌었을 수 있으니 내 사주도 다시 계산한다
    let Rf = R; try { const P0 = People(), me = P0 && P0.active(); if (me) Rf = E.calc(P0.toProfile(me)); } catch (e) {}
    let v, f; try { v = G.값(Rm, Rf, met, today, youName); f = G.문장(v, today, youName); } catch (e) { box.innerHTML = '<p class="hint">이 사주로는 답을 만들지 못했습니다.</p>'; box.classList.remove('hide'); return; }
    const 열쇠 = 'maeum:' + [you0.year, you0.month, you0.day, you0.hour == null ? 'x' : you0.hour, you0.minute == null ? 'x' : you0.minute].join('-');
    const paid = (window.ChaeksaPay && ChaeksaPay.paidForKey && ChaeksaPay.paidForKey('maeum', 열쇠)) || null;
    const 미리 = new Set([0, 1, 3]);
    const 다 = paid || 표무료();
    const 절 = f.Q.map((q, i) => {
      const 열림 = 다 || 미리.has(i);
      return `<div class="gn-q${열림 ? '' : ' locked'}"><p class="gn-k"><i>비밀 ${i + 1}</i> ${esc(q.물음)}</p>`
        + (열림 ? `<p class="gn-a">${esc(q.답)}</p><p class="gn-w">${esc(q.왜)}</p>` : `<p class="gn-a dim">결제하면 열리는 비밀이에요.</p>`)
        + '</div>';
    }).join('');
    const 결제 = paid ? '' : 결제상자('btnMmBuy', youName, '그래서 이 사람이 나한테 좋은 사람인지는 나머지 일곱 가지 비밀에서 봅니다.');
    const 관찰말 = { 여자: '나한테 다가옴', 돈: '돈 씀씀이', 말: '말·표현', 자리: '일·자리', 없음: '달라진 것 없음' }[you0.관찰] || '';
    box.innerHTML = `<h2>그 사람, 나한테 마음이 있을까요?</h2>
      <p class="hint">${esc(youName)} · ${met ? '만난 해 ' + met + '년 · ' : ''}${관찰말 ? '먼저 달라진 것 ' + 관찰말 + ' · ' : ''}${today.getFullYear()}년 ${today.getMonth() + 1}월 기준</p>
      ${카드줄(f.Q, 미리, 다, false)}
      ${절}
      ${한편자리(paid, youName)}
      ${다 ? `<div class="gn-card"><p class="k">간직하기 카드</p>${f.카드.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      ${결제}`;
    box.classList.remove('hide');
    한편붙이기(box, 'maeum', { 제목: '그 사람, 나한테 마음이 있을까요?', 부제: '그래서 이 사람이 나한테 좋은 사람인지' }, f, met, you0.관찰, 열쇠, youName);
    const bb = box.querySelector('#btnMmBuy');
    if (bb) bb.onclick = () => 결제누름(bb, 'maeum', 열쇠);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ───── 궁합총론 탭 (2026-09-23 사장님 「아래탭에 넣어」) ─────
  // 나는 지금 보는 원국(profile), 그 사람은 넣어 둔 사람 가운데 고른다. 명리는 gunghap-gwanjeom.js, 그리기는 gunghap-chongnon.js.
  // 그 사람은 손님이 고른다 — 목록 첫 사람으로 멋대로 열지 않는다(09-13 이야기 탭과 같은 규칙). 한 번 고르면 기억한다.
  // 방금 넣은 사람은 곧 그 사람이다 — savePerson 이 골라 두고 여기를 다시 부른다
  // (이야기 탭이 첫 사람을 넣어도 화면이 그대로였던 실수를 되풀이하지 않는다, 2026-09-22 점검).
  /** 앱에 넣어 둔 사람 → 궁합총론 입력 꼴(gunghap-chongnon.html 폼이 넘기는 꼴). 시간 모름은 hour null, 성별 모름은 gender null.
   *  보정(solarCorrection)·경도는 그대로 넘긴다 — 원국 탭과 같은 여덟 글자가 나와야 한다. */
  function 궁합입력(p) {
    const 모름 = !!p.noTime || p.hour == null || p.hour === '';
    return {
      year: +p.year, month: +p.month, day: +p.day,
      hour: 모름 ? null : +p.hour, minute: 모름 ? 0 : +(p.minute || 0),
      gender: p.genderUnknown ? null : (p.gender === 'F' || p.gender === 'M' ? p.gender : null),
      longitude: p.longitude, tzOffset: p.tzOffset, solarCorrection: p.solarCorrection,
    };
  }
  function 궁합고르기(id) {
    궁합그사람 = id || null;
    try { if (궁합그사람) localStorage.setItem(궁합고름키, 궁합그사람); else localStorage.removeItem(궁합고름키); } catch (e) {}
  }
  function renderChongnon() {
    const P = People(), GC = window.ChaeksaGunghapChongnon;
    const out = $('gcTabOut'), sel = $('gcPick'), wrap = $('gcPickWrap'), none = $('gcNone'), add = $('btnGcAdd');
    if (!out || !sel) return;
    const 비우기 = () => { out.innerHTML = ''; 궁합그린것 = ''; };
    const 안내 = (말, 단추, 누르면) => {
      wrap.classList.add('hide'); none.textContent = 말; none.classList.remove('hide');
      add.textContent = 단추; add.classList.remove('ghost'); add.onclick = 누르면; 비우기();
    };
    // 내 원국이 없으면 두 분을 놓을 수 없다. (원국이 없으면 아래 탭이 안 보이지만, 주소로 들어오는 길을 막아 둔다.)
    if (!profile || !R) { 안내('내 생년월일부터 넣어 주세요. 내 원국이 있어야 두 분을 나란히 놓아요.', '내 생년월일 넣기', () => go('home')); return; }
    if (!P || !GC) { 안내('지금은 궁합총론을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.', '다시 열기', () => renderChongnon()); return; }
    const me = P.active(), list = P.list().filter(p => !me || p.id !== me.id);
    if (!list.length) { 안내('그 사람 생년월일을 먼저 넣어 주세요. 넣으면 바로 두 분을 나란히 놓아요.', '그 사람 생년월일 넣기', () => openPersonForm(null)); return; }
    none.classList.add('hide'); wrap.classList.remove('hide');
    add.textContent = '그 사람 생년월일 넣기'; add.classList.add('ghost'); add.onclick = () => openPersonForm(null);
    const 고름 = list.some(p => p.id === 궁합그사람) ? 궁합그사람 : '';
    sel.innerHTML = (고름 ? '' : '<option value="">누구와 볼까요?</option>')
      + list.map(p => `<option value="${p.id}">${esc(사람이름(p.name) || '그 사람')} · ${esc(p.relation)}</option>`).join('');
    sel.value = 고름;
    sel.onchange = () => { 궁합고르기(sel.value); renderChongnon(); };
    if (!고름) { 비우기(); return; }
    const 그 = P.get(고름), 나입력 = 궁합입력(profile), 그입력 = 궁합입력(P.toProfile(그));
    // 같은 두 사람을 이미 그려 뒀으면 그대로 둔다 — 탭을 오갈 때마다 다시 그리면 펼쳐 둔 장이 닫힌다.
    const 열쇠 = JSON.stringify([나입력, 고름, 그입력]);
    if (열쇠 === 궁합그린것 && out.firstChild) return;
    GC.그리기(out, 나입력, 그입력);
    궁합그린것 = 열쇠;
    // 13장 — 다른 장으로 건너갈 때 보던 그 사람을 넘긴다. 주소가 index.html 이어도 쪽을 다시 읽지 않게 해시만 바꾼다.
    out.querySelectorAll('.gc-links a').forEach(a => a.addEventListener('click', (e) => {
      const h = a.getAttribute('href') || '', i = h.indexOf('#'); if (i < 0) return;
      e.preventDefault(); 궁합넘김 = 고름;
      const 해시 = h.slice(i);
      if (location.hash === 해시) goHash(true); else location.hash = 해시;
    }));
  }

  // ───── 연애궁합 탭 (2026-09-24, 법전 72조) ─────
  // 그 사람 고르기는 궁합총론과 같은 기억(궁합그사람)을 쓴다 — 두 탭에서 같은 사람을 보게.
  function renderSsom() {
    const P = People(), SP = window.ChaeksaSsomPage;
    const out = $('ssTabOut'), sel = $('ssPick'), wrap = $('ssPickWrap'), none = $('ssNone'), add = $('btnSsAdd');
    if (!out || !sel) return;
    const 안내 = (말, 단추, 누르면) => {
      wrap.classList.add('hide'); none.textContent = 말; none.classList.remove('hide');
      add.textContent = 단추; add.classList.remove('ghost'); add.onclick = 누르면; out.innerHTML = '';
    };
    if (!profile || !R) { 안내('내 생년월일부터 넣어 주세요.', '내 생년월일 넣기', () => go('home')); return; }
    if (!P || !SP) { 안내('지금은 연애궁합을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.', '다시 열기', () => renderSsom()); return; }
    const me = P.active(), list = P.list().filter(p => !me || p.id !== me.id);
    if (!list.length) { 안내('그 사람 생년월일을 먼저 넣어 주세요.', '그 사람 생년월일 넣기', () => openPersonForm(null)); return; }
    none.classList.add('hide'); wrap.classList.remove('hide');
    add.textContent = '그 사람 생년월일 넣기'; add.classList.add('ghost'); add.onclick = () => openPersonForm(null);
    const 고름 = list.some(p => p.id === 궁합그사람) ? 궁합그사람 : '';
    sel.innerHTML = (고름 ? '' : '<option value="">누구와 볼까요?</option>')
      + list.map(p => `<option value="${p.id}">${esc(사람이름(p.name) || '그 사람')} · ${esc(p.relation)}</option>`).join('');
    sel.value = 고름;
    sel.onchange = () => { 궁합고르기(sel.value); renderSsom(); };
    // 09-25 사장님 「상대 프로필 선택이 너무 98년도 윈도우 같아」 — select 는 숨기고 사람 칩으로 고른다
    sel.classList.add('ss-sel-hidden');
    let 칩 = wrap.querySelector('.ss-who'); if (!칩) { 칩 = document.createElement('div'); 칩.className = 'ss-who'; 칩.setAttribute('role', 'radiogroup'); wrap.appendChild(칩); }
    칩.innerHTML = list.map(p => '<button type="button" role="radio" aria-checked="' + (p.id === 고름) + '" class="ss-wh' + (p.id === 고름 ? ' on' : '') + '" data-id="' + p.id + '"><b>' + esc(사람이름(p.name) || '그 사람') + '</b><small>' + esc(p.relation) + '</small></button>').join('')
      + '<button type="button" class="ss-wh ss-wh-add" id="ssWhoAdd">＋ 다른 사람</button>';
    칩.querySelectorAll('.ss-wh[data-id]').forEach(b => b.onclick = () => { if (sel.value === b.dataset.id) return; sel.value = b.dataset.id; sel.onchange(); });
    const 더 = 칩.querySelector('#ssWhoAdd'); if (더) 더.onclick = () => openPersonForm(null);
    add.classList.add('hide');   // 아래 「그 사람 생년월일 넣기」는 칩의 「＋ 다른 사람」이 대신한다
    const more = $('ssMore'), met = $('ssMet');
    if (!고름) { out.innerHTML = ''; if (more) more.classList.add('hide'); return; }
    // 처음 만난 달 — 그 사람마다 이 기기에 기억한다(연 · 월만, 서버로 안 보낸다)
    const 만난키 = 'chaeksa.ssomMet.' + 고름;
    if (more) more.classList.remove('hide');
    if (met) { try { met.value = localStorage.getItem(만난키) || ''; } catch (e) {} met.onchange = () => { try { localStorage.setItem(만난키, met.value || ''); } catch (e) {} renderSsom(); }; }
    const mv = ((met && met.value) || '').split('-').map(Number);
    const st = $('ssStage');
    if (st && SP.단계카드 && !st.dataset.cards) { SP.단계카드(st); st.dataset.cards = '1'; }
    if (st) { try { st.value = localStorage.getItem('chaeksa.ssomStage.' + 고름) || '둘'; if (!st.value) st.value = '둘'; if (st._그리) st._그리(); } catch (e) {} st.onchange = () => { try { localStorage.setItem('chaeksa.ssomStage.' + 고름, st.value); } catch (e) {} renderSsom(); }; }
    SP.그리기(out, 궁합입력(profile), 궁합입력(P.toProfile(P.get(고름))), { 만난: mv[0] ? { y: mv[0], m: mv[1] } : null, 단계: (st && st.value) || '썸' });
    // 09-25 사장님 「웹툰궁합 시작하기로 수정하고 위로 올려줘」 — 시작 단추를 사람 칩 바로 아래(단계 카드 위)로
    try { const vt = out.querySelector('#ssVnTop'); if (vt) { let 자리 = $('ssStart'); if (!자리) { 자리 = document.createElement('div'); 자리.id = 'ssStart'; wrap.insertAdjacentElement('afterend', 자리); } 자리.innerHTML = ''; 자리.appendChild(vt); vt.style.margin = '4px 0 14px'; } } catch (e) {}
  }

  // ───── 우리 둘, 잘 맞아요? (셋째 장 · gunghap.js) ─────
  function renderGunghap() {
    const P = People(); const G = window.ChaeksaGunghap; if (!P || !G || !$('ghPick')) return;
    const me = P.active();
    const list = P.list().filter(p => !me || p.id !== me.id);
    $('ghPick').innerHTML = list.length
      ? list.map(p => `<option value="${p.id}">${esc(사람이름(p.name) || '나')} · ${esc(p.relation)}</option>`).join('')
      : '<option value="">등록된 사람이 없습니다</option>';
    $('btnGh').disabled = !list.length;
    $('btnGhAdd').onclick = () => openPersonForm(null);
    // 역산(32조) — 「먼저 달라진 것」은 사람마다 기억한다
    const 채움 = () => { const p = P.get($('ghPick').value); if ($('ghSeen')) $('ghSeen').value = (p && p.관찰) || '';
      const me = P.active(); if ($('ghSeen2')) $('ghSeen2').value = (me && me.관찰) || ''; };
    $('ghPick').onchange = 채움; 채움();
    $('btnGh').onclick = () => {
      const p0 = P.get($('ghPick').value); if (!p0) return;
      if ($('ghSeen')) P.update(p0.id, { 관찰: $('ghSeen').value });
      const me0 = P.active(); if (me0 && $('ghSeen2')) P.update(me0.id, { 관찰: $('ghSeen2').value });
      const p = P.get(p0.id);
      const met = parseInt($('ghMet').value, 10) || null;
      showGunghap(P.toProfile(p), p.name, met);
    };
  }
  function showGunghap(you0, youName, met) {
    const G = window.ChaeksaGunghap; const box = $('ghResult'); if (!box) return;
    let Rm; try { Rm = E.calc(you0); } catch (e) { box.innerHTML = '<p class="hint">계산하지 못했습니다.</p>'; box.classList.remove('hide'); return; }
    // 역산 — 공주님 쪽 「먼저 달라진 것」이 바뀌었을 수 있으니 내 사주도 다시 계산한다
    let Rf = R; try { const P0 = People(), me = P0 && P0.active(); if (me) Rf = E.calc(P0.toProfile(me)); } catch (e) {}
    let v, f; try { v = G.값(Rm, Rf, met, today, youName); f = G.문장(v, today, youName); } catch (e) { box.innerHTML = '<p class="hint">이 사주로는 답을 만들지 못했습니다.</p>'; box.classList.remove('hide'); return; }
    const 열쇠 = 'gunghap:' + [you0.year, you0.month, you0.day, you0.hour == null ? 'x' : you0.hour, you0.minute == null ? 'x' : you0.minute].join('-');
    const paid = (window.ChaeksaPay && ChaeksaPay.paidForKey && ChaeksaPay.paidForKey('gunghap', 열쇠)) || null;
    const 미리 = new Set([0, 4, 8]);
    const 다 = paid || 표무료();
    let 앞구간 = '';
    const 절 = f.Q.map((q, i) => {
      const 열림 = 다 || 미리.has(i);
      const 머리 = q.구간 && q.구간 !== 앞구간 ? `<p class="gn-sec">${esc(q.구간)}</p>` : ''; 앞구간 = q.구간 || 앞구간;
      return 머리 + `<div class="gn-q${열림 ? '' : ' locked'}"><p class="gn-k"><i>비밀 ${i + 1}</i> ${esc(q.물음)}</p>`
        + (열림 ? `<p class="gn-a">${esc(q.답)}</p><p class="gn-w">${esc(q.왜)}</p>` : `<p class="gn-a dim">결제하면 열리는 비밀이에요.</p>`)
        + '</div>';
    }).join('');
    const 결제 = paid ? '' : 결제상자('btnGhBuy', youName, '네 층(그 사람 → 나 · 나 → 그 사람 · 원래 둘 · 지금 둘)을 다 보고 가도 되는지는 나머지 일곱 가지 비밀에서 봅니다.');
    // 53조 궁합 — 판정 하나(사람을 맨 바깥 층으로 얹은 차이). 무료. 전문용어 칸이라 data-plain·escP.
    let 판정띠 = '';
    try {
      const P = window.ChaeksaPanjeong;
      if (P && P.궁합) {
        const Q = window.ChaeksaQuestions;
        const 둘 = Q && Q.둘사이질문 ? Q.둘사이질문(Rf, Rm, today) : null;
        const g = 둘 ? 둘.궁합 : P.궁합(Rf, Rm, today);
        const 남은 = (x) => Object.keys(x.남은 || {}).map(k => '<span class="gh-cell s' + (x.남은[k].칸 === '좋음' ? 2 : x.남은[k].칸 === '조심' ? 0 : 1) + '">' + escP(k) + '</span>').join('');
        // 질문 생성기를 탄 꼴 — 질문 → 답(판정 이유) → 결론·할 것(둘 사이 × 칸). 「우리 둘」 장은 그 질문들을 그리는 자리다.
        const 질문줄 = (둘 && 둘.질문들.length)
          ? 둘.질문들.map(q => '<div class="gh-q s' + (q.칸 === '좋음' ? 2 : q.칸 === '조심' ? 0 : 1) + '"><b>' + escP(q.질문) + '</b><span>' + escP(q.답) + '</span></div>').join('')
          : '<p class="gh-line"><b>바뀌는 것 없음</b> 그 사람을 얹어도 내 판정이 그대로예요.</p>';
        const 그쪽줄 = g.그사람에게.줄.map(j => '<p class="gh-line ' + (j.방향 === '보완' ? 'up' : 'down') + '"><b>' + escP(j.갈래) + ' · ' + escP(j.방향) + '</b> ' + escP(j.말) + '</p>').join('') || '<p class="gh-line"><b>바뀌는 것 없음</b> 그 사람 판정이 그대로예요.</p>';
        const 머리셋 = 둘 ? 둘.머리.map(q => '<div class="gh-q s' + (q.칸 === '좋음' ? 2 : q.칸 === '조심' ? 0 : 1) + '"><b>' + escP(q.질문) + '</b><span>' + escP(q.답) + '</span></div>').join('') : '';
        const 되돌림 = 둘 && 둘.실험 && 둘.실험.줄.length ? '<details class="wg-fold"><summary>되돌아오는 것 (실험)</summary><p class="hint">내가 먼저 얹히면 ' + escP(youName) + '의 격신이 ' + escP(둘.실험.사람말) + '로 바뀌고, 그것이 다시 내게 와요.</p>' + 둘.실험.줄.map(j => '<p class="gh-line ' + (j.방향 === '보완' ? 'up' : 'down') + '"><b>' + escP(j.갈래) + ' · ' + escP(j.방향) + '</b> ' + escP(j.말) + '</p>').join('') + '</details>' : '';
        판정띠 = '<section class="wg gh-pan" data-plain="1"><div class="wg-head"><b>두 사람을 놓고 본 판정</b><span>' + escP(둘 ? 둘.결론문 : P.궁합결론(g)) + '</span></div>'
          + '<p class="wg-gk top">나에게 ' + escP(youName) + '은(는) <b>' + escP(g.나에게.사람말 || '안 나왔어요') + '</b>이고, ' + escP(youName) + '에게 나는 <b>' + escP(g.그사람에게.사람말 || '안 나왔어요') + '</b>이에요. 사람의 글자는 그 사람의 격신이에요.</p>'
          + 머리셋
          + (둘 ? '<p class="gh-verdict"><em>' + escP(둘.결론) + '</em> ' + escP(둘.할것) + '</p>' : '')
          + '<details class="wg-fold"><summary>갈래마다 보기</summary>'
          + '<div class="wg-head sub"><b>' + escP(youName) + '이(가) 나에게</b></div>' + 질문줄 + '<div class="gh-cells">' + 남은(g.나에게) + '</div>'
          + '<div class="wg-head sub"><b>내가 ' + escP(youName) + '에게</b></div>' + 그쪽줄 + '<div class="gh-cells">' + 남은(g.그사람에게) + '</div></details>'
          + 되돌림
          + '</section>';
      }
    } catch (e) { try { console.warn('궁합 판정 실패:', e); } catch (e2) {} }
    box.innerHTML = `<h2>우리 둘, 잘 맞아요?</h2>
      <p class="hint">${esc(youName)} · ${met ? '만난 해 ' + met + '년 · ' : ''}${today.getFullYear()}년 ${today.getMonth() + 1}월 기준</p>
      ${판정띠}
      ${카드줄(f.Q, 미리, 다, false)}
      ${절}
      ${한편자리(paid, youName)}
      ${다 ? `<div class="gn-card"><p class="k">간직하기 카드</p>${f.카드.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      ${결제}`;
    box.classList.remove('hide');
    한편붙이기(box, 'gunghap', { 제목: '우리 둘, 잘 맞아요?', 부제: '그래서 이 사람이랑 가도 되는지' }, f, met, you0.관찰, 열쇠, youName);
    const bb = box.querySelector('#btnGhBuy');
    if (bb) bb.onclick = () => 결제누름(bb, 'gunghap', 열쇠);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ───── 비밀 열 가지 — 공통 틀 (sheets.js: 결혼·이별·지금·짝) ─────
  function renderSheet() {
    const S = window.ChaeksaSheets; const P = People(); if (!S || !P || !$('shPick')) return;
    const 장 = S.찾기(window.현재장 || 'gyeolhon'); if (!장) return;
    $('shTitle').textContent = 장.제목;
    $('shHint').innerHTML = 장.둘 ? '그 사람의 생년월일시와 두 분이 만난 해만 있으면 됩니다. 비밀 열 가지를 엽니다 — <b>' + esc(장.부제) + '</b>까지.' : '내 사주만으로 봅니다. 비밀 열 가지를 엽니다 — <b>' + esc(장.부제) + '</b>까지.';
    $('shPickWrap').classList.toggle('hide', !장.둘); $('btnShAdd').classList.toggle('hide', !장.둘);
    if ($('shSoloWrap')) $('shSoloWrap').classList.toggle('hide', !!장.둘);
    const me = P.active(); const list = P.list().filter(p => !me || p.id !== me.id);
    $('shPick').innerHTML = list.length ? list.map(p => `<option value="${p.id}">${esc(사람이름(p.name) || '나')} · ${esc(p.relation)}</option>`).join('') : '<option value="">등록된 사람이 없습니다</option>';
    $('btnSh').disabled = 장.둘 && !list.length;
    $('btnShAdd').onclick = () => openPersonForm(null);
    $('shResult').classList.add('hide');
    // 역산(32조) — 사람마다 「먼저 달라진 것」을 기억한다. 고르는 사람이 바뀌면 그 사람 것으로 채운다
    const 채움 = () => { const p = P.get($('shPick').value); if ($('shSeen')) $('shSeen').value = (p && p.관찰) || '';
      if ($('shSeenMe')) $('shSeenMe').value = (me && me.관찰) || ''; };
    $('shPick').onchange = 채움; 채움();
    $('btnSh').onclick = () => {
      if (장.둘) {
        const p0 = P.get($('shPick').value); if (!p0) return;
        if ($('shSeen')) P.update(p0.id, { 관찰: $('shSeen').value });
        const p = P.get(p0.id);
        showSheet(장, P.toProfile(p), p.name, parseInt($('shMet').value, 10) || null);
      }
      else {   // 혼자 보는 장(짝)은 공주님 자신의 「먼저 달라진 것」을 쓴다
        const me0 = P.active(); if (me0 && $('shSeenMe')) P.update(me0.id, { 관찰: $('shSeenMe').value });
        showSheet(장, null, '', null);
      }
    };
  }
  function showSheet(장, you0, youName, met) {
    const S = window.ChaeksaSheets; const box = $('shResult'); if (!box) return;
    let Rm = null; if (장.둘) { try { Rm = E.calc(you0); } catch (e) { box.innerHTML = '<p class="hint">계산하지 못했습니다.</p>'; box.classList.remove('hide'); return; } }
    // 공주님 쪽 관찰(역산)이 엔진까지 가려면 방금 저장한 값으로 다시 계산해야 한다
    let Rf = R; try { const P0 = People(), me = P0 && P0.active(); if (me) Rf = E.calc(P0.toProfile(me)); } catch (e) {}
    let v, f; try { v = 장.둘 ? 장.값(Rm, Rf, met, today, youName) : 장.값(Rf, null, met, today); f = 장.둘 ? 장.문장(v, today, youName) : 장.문장(v, today); }
    catch (e) { try { console.warn('sheet', 장.code, e); } catch (x) {} box.innerHTML = '<p class="hint">이 사주로는 답을 만들지 못했습니다.</p>'; box.classList.remove('hide'); return; }
    const 열쇠 = 장.code + ':' + (장.둘 ? [you0.year, you0.month, you0.day, you0.hour == null ? 'x' : you0.hour, you0.minute == null ? 'x' : you0.minute].join('-') : 'me');
    const paid = (window.ChaeksaPay && ChaeksaPay.paidForKey && ChaeksaPay.paidForKey(장.code, 열쇠)) || null;
    const 미리 = new Set(장.무료);
    const 다 = paid || 표무료();
    let 앞구간 = '';
    const 절 = f.Q.map((q, i) => {
      const 열림 = 다 || 미리.has(i);
      const 머리 = q.구간 && q.구간 !== 앞구간 ? `<p class="gn-sec">${esc(q.구간)}</p>` : ''; 앞구간 = q.구간 || 앞구간;
      return 머리 + `<div class="gn-q${열림 ? '' : ' locked'}"><p class="gn-k"><i>비밀 ${i + 1}</i> ${esc(q.물음)}</p>`
        + (열림 ? `<p class="gn-a">${esc(q.답)}</p><p class="gn-w">${esc(q.왜)}</p>` : `<p class="gn-a dim">결제하면 열리는 비밀이에요.</p>`) + '</div>';
    }).join('');
    const 이름표 = 장.둘 ? youName : '내 사주';
    const 결제 = paid ? '' : 결제상자('btnShBuy', 이름표, esc(장.부제) + '는 나머지 일곱 가지 비밀에서 봅니다.', 장.둘 ? youName : '올 사람');
    box.innerHTML = `<h2>${esc(장.제목)}</h2>
      <p class="hint">${장.둘 ? esc(youName) + ' · ' : ''}${met ? '만난 해 ' + met + '년 · ' : ''}${today.getFullYear()}년 ${today.getMonth() + 1}월 기준</p>
      ${카드줄(f.Q, 미리, 다, !장.둘)}
      ${장.둘 ? 절 : ''}
      ${한편자리(paid, 장.둘 ? youName : '올 사람')}
      ${다 ? `<div class="gn-card"><p class="k">간직하기 카드</p>${f.카드.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      ${결제}`;
    box.classList.remove('hide');
    한편붙이기(box, 장.code, 장, f, met, 장.둘 && you0 ? you0.관찰 : null, 열쇠, 장.둘 ? youName : '올 사람');
    const bb = box.querySelector('#btnShBuy');
    if (bb) bb.onclick = () => 결제누름(bb, 장.code, 열쇠);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ───── 궁합 ─────
  // 「그 사람과 나는」(compat) 화면은 2026-09-17 옛것 치우기로 걷었다. 방금 추가한 사람 표시만 비운다.
  function renderPartners() { pendingPick = null; }


  // ───── 재물 그릇 — 녹패 ─────
  let nokpaeFor = null;   // 어느 사주로 그렸는지 — 프로필이 바뀌면 다시 그린다

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
      // 결제 상자의 [필수] 칸을 이 답보다 먼저 체크했으면 단추가 잠긴 채 남는다 — 지금 상태로 맞춘다(2026-09-22 검토).
      try { document.querySelectorAll('input[data-pay-agree]').forEach(c => { const b = document.getElementById(c.getAttribute('data-pay-agree')); if (b && !b.dataset.busy) b.disabled = !(payReady && c.checked); }); } catch (e) {}
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





  // ───── 표는 무료, 한 편이 유료 (2026-09-12 사장님 「문장표를 무료콘텐츠로, LLM을 유료 콘텐츠로」) ─────
  // 스위치 하나(config CHAEKSA_SHEET_LLM)가 둘을 같이 뒤집는다. 따로 두면 표만 공짜가 되고 팔 것이 없는 날이 생긴다.
  //   꺼짐 = 예전 그대로. 세 가지 답만 무료, 나머지 일곱과 열 책사는 9,900원.
  //   켜짐 = 열 가지 답·열 책사·간직하기 카드가 전부 무료. 돈 받는 것은 「한 편」 하나뿐이다.
  function 표무료() { return !!window.CHAEKSA_SHEET_LLM; }
  /** 결제 상자 — 무엇을 파는지가 위 스위치에 달렸다. 단추 id 는 장마다 달라 받아 쓴다. */
  function 결제상자(id, 이름표, 예전안내, 한편이름) {
    try { window.ChaeksaTrack && ChaeksaTrack.event && ChaeksaTrack.event('sheet'); } catch (e) {}   // 깔때기 ③ 유료 장(결제 단추 보이는 화면) 엶
    const 무료 = 표무료();
    // 한 편의 이름표는 「올 사람」처럼 표 이름표와 다를 때가 있다(짝 장). 산 뒤에 뜨는 상자와 같은 말을 써야 한다.
    const 편 = esc(한편이름 || 이름표);
    const 머리 = 무료 ? 편 + ' 한 편' : '세 가지 비밀은 여기까지';
    const 몸 = 무료 ? '위 열 가지 답은 전부 열려 있어요. 그 답들이 한 사람 안에서 어떻게 맞물리는지를 책사가 한 편으로 엮어 드립니다.' : 예전안내;
    const 단추 = 무료 ? '9,900원 · ' + 편 + ' 한 편 받기' : '9,900원 · ' + esc(이름표) + ' 한 장 열기';
    const 꼬리 = payReady
      ? (무료 ? '결제하시면 이 자리에서 바로 청하실 수 있어요.' : '결제하면 바로 열립니다.')
      : '온라인 결제는 준비 중이에요. 열리는 대로 이 자리에서 바로 열립니다.';
    // 청약철회 안내와 [필수] 동의(2026-09-22 점검). 약관 9조(terms.html#refund)와 같은 말이다 —
    // 콘텐츠는 열람이 시작되면 제공이 시작된 것이고, 그 뒤에는 청약철회가 제한될 수 있다. 체크 전에는 단추가 잠긴다
    // (아래 결제동의 · pay.js 누르면 이 한 번 더 막는다).
    const 동의 = '<div class="pb-refund" style="margin:14px 0 10px;text-align:left">'
      + '<p style="margin:0 0 6px;font-size:12.5px;line-height:1.7;color:var(--ink2)">결제하면 바로 열리는 디지털 콘텐츠입니다. '
      + '열람이 시작되면 청약철회(결제 후 7일 안 취소)가 제한될 수 있고, 열람 전에는 전액 환불됩니다.</p>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.7;color:var(--ink);cursor:pointer">'
      + '<input type="checkbox" data-pay-agree="' + id + '" style="margin-top:4px;flex:none">'
      + '<span><b>[필수]</b> 위 내용을 확인했고 동의합니다. (<a href="terms.html#refund" target="_blank" rel="noopener">환불 규정</a>)</span>'
      + '</label></div>';
    return '<div class="paidbox"><p class="pb-k">' + 머리 + '</p>'
      + '<p>' + 몸 + '</p>'
      + 동의
      + '<button class="btn nx-cta" id="' + id + '" type="button" disabled'
      + ' style="background:var(--accent);color:#fff;border-color:var(--accent)">' + 단추 + '</button>'
      + '<p class="nx-ft">' + 꼬리 + '</p></div>';
  }
  // 결제 상자의 [필수] 동의 칸 — 체크해야 단추가 풀린다. 상자는 장마다 새로 그려지므로 문서 한 곳에서 받는다.
  document.addEventListener('change', (e) => {
    const c = e.target; if (!c || !c.matches || !c.matches('input[data-pay-agree]')) return;
    const b = document.getElementById(c.getAttribute('data-pay-agree'));
    if (b && !b.dataset.busy) b.disabled = !(payReady && c.checked);
  });

  // ───── 「그 사람 한 편」 — 장마다 결제 뒤 LLM 이 쓰는 한 편 (2026-09-12 사장님 결정 3단계) ─────
  // 산 사람에게만(paidForKey), 그리고 스위치(config CHAEKSA_SHEET_LLM)가 꺼져 있으면 super 계정만 본다(시험).
  // 누르셔야 굽는다 — 화면을 여는 것만으로 원가가 나가면 안 된다. 서버에 이미 쓴 것은 공짜로 먼저 읽는다.
  // 굽는 중(409)이면 서버 캐시를 「읽기만」 하며 기다린다. 시간초과·잘림·검사 탈락은 자동으로 다시 굽지 않는다.
  const 한편판 = 'v1';   // 틀(ai.js 한편틀)을 고치면 올린다 — 옛 한 편 대신 새로 쓴다
  function 한편보임(paid) {
    if (!paid || !window.ChaeksaAI || !ChaeksaAI.sheetPiece) return false;
    if (window.CHAEKSA_SHEET_LLM) return true;
    try { return !!(window.ChaeksaUsage && ChaeksaUsage.plan() === 'super'); } catch (e) { return false; }
  }
  function 한편자리(paid, 이름표) {
    return 한편보임(paid)
      ? `<div class="paidbox pb-piece"><p class="pb-k">${esc(이름표)} 한 편</p><p class="pb-lede">위 열 가지 답을 책사가 한 사람의 이야기로 엮어 드립니다. 판정은 위 답 그대로이고, 한 번 쓰면 이달 안에는 그대로 남습니다.</p><div class="pb-ai-slot"></div></div>`
      : '';
  }
  // 「먼저 달라진 것」은 공주님이 직접 적어 둔 관찰이다. 판정이 아니라 알아보는 장면으로만 쓴다.
  const 관찰말표 = { 여자: '다른 사람에게 눈이 가는 모습이 먼저 보였다', 돈: '돈 쓰는 모습이 먼저 달라졌다', 말: '말과 표현이 먼저 늘었다', 자리: '맡은 일이 먼저 늘고 친구들과 멀어졌다' };
  const 관찰말표나 = { 재: '돈이나 사람이 먼저 들어왔다', 식: '말과 표현이 먼저 늘었다', 관: '맡은 일이 먼저 늘었다' };
  // 엔진이 부제를 안 주는 세 장 — 홈 표지의 물음을 그대로 쓴다(설계 facts_spec: 한 곳에서만 채운다)
  const 한편부제 = { geunamja: '그래서 나한테 도움이 되나요?', maeum: '그래서 나한테 좋은 사람인가요?', gunghap: '그래서 이 사람이랑 가도 되나요?' };
  const 요일말 = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  // 숫자 날짜는 LLM 에게 안 보낸다 — 표를 베낀 것처럼 읽히고, 화면 위 표에 이미 있다.
  const 날치우기 = (s) => String(s || '').replace(/\s*\(\d{1,2}\/\d{1,2}\)/g, '');
  /** 표 문장을 그대로 보내면 금지어에 걸리는 자리가 있다. 보내는 사본만 고친다(화면은 그대로). */
  function 한편씻기(s) {
    return 날치우기(s)
      .replace(/원국에/g, '타고난 데에').replace(/원국/g, '타고난 것')
      .replace(/짝 자리는/g, '짝은').replace(/짝 자리/g, '짝')   // 「짝 자리는」을 먼저 — 안 그러면 「짝는」이 된다
      .replace(/인연의 기운이/g, '인연이').replace(/대운\(10년\)은/g, '요 몇 해는')
      .replace(/붙는 자리예요/g, '붙는 사이예요').replace(/보는 자리가/g, '보는 데가')
      .replace(/편인(?=[데지가])/g, '쪽인')
      .replace(/제일/g, '무엇보다').replace(/가장 /g, '')
      .replace(/선을 그어 보세요/g, '나눠 보세요');
  }
  function 한편자료(장, code, f, met, 관찰) {
    const m = today.getMonth() + 1, 올 = today.getFullYear();
    const 앞해 = [], 뒤해 = [];
    const 문항 = f.Q.map((q, i) => {
      const 답0 = String(q.답 || '');
      const 갈 = 답0.indexOf(' — ');
      let 때 = 갈 > 0 && 갈 <= 40 ? 답0.slice(0, 갈).trim() : '';
      const 답 = 갈 > 0 && 갈 <= 40 ? 답0.slice(갈 + 3).trim() : 답0;
      (때.match(/\d{4}(?=년)/g) || []).forEach(y => 앞해.push(+y));
      if (/^\d+살부터/.test(때)) 때 = '';                      // 나이는 화면에 안 낸다(역산이 드러난다)
      else if (met && 때 === met + '년') 때 = '처음 만난 그해';
      else if (/^\d{4}년$/.test(때)) 때 = '';                   // 먼 해는 「쓸 수 있는 해」로만 간다
      let 왜 = String(q.왜 || '');
      const h = 왜.indexOf(' 확인할 것:'); if (h > 0) 왜 = 왜.slice(0, h);
      (왜.match(/\d{4}(?=년)/g) || []).forEach(y => 뒤해.push(+y));
      let 할일 = '';
      const t = 왜.match(/(?:^|(?<=[.!?] ))오늘은 [^.!?]*[.!?]/);
      if (t) { 할일 = t[0].trim(); 왜 = (왜.slice(0, t.index) + 왜.slice(t.index + t[0].length)).replace(/\s{2,}/g, ' ').trim(); }
      const 칸 = { n: i + 1 };
      if (q.구간) 칸.구간 = q.구간;
      if (때) 칸.때 = 한편씻기(때);
      칸.물음 = 한편씻기(q.물음); 칸.답 = 한편씻기(답); 칸.왜 = 한편씻기(왜);
      return { 칸, 할일: 할일 ? 한편씻기(할일) : '' };
    });
    // 쓸 수 있는 해: 올해보다 뒤인 것만, 답 앞머리에 붙은 해를 먼저. 달: 답·왜에 나온 달 + 이달·다음 달(합집합이 없으면 짝 편의 「9월」이 막힌다)
    const 해목록 = [...new Set([...앞해, ...뒤해])].filter(y => y > 올);
    const 달숫자 = (문항.map(x => x.칸.답 + ' ' + x.칸.왜 + ' ' + (x.칸.때 || '')).join('\n').match(/\d{1,2}(?=월)/g) || []).map(Number);
    const 달목록 = [...new Set([...달숫자, m, m % 12 + 1])].map(x => x + '월');
    const 날목록 = [...new Set(f.Q.map(q => String(q.답 || '')).join(' ').match(/(내일|모레|[일월화수목금토]요일)/g) || [])];
    return {
      편: { 제목: 장.제목, 부제: 장.부제 || 한편부제[code] || '' },
      때: { 오늘: m + '월 ' + today.getDate() + '일 ' + 요일말[today.getDay()], 이달: m + '월', '다음 달': (m % 12 + 1) + '월' },
      '쓸 수 있는 해': 해목록,
      '쓸 수 있는 달': 달목록,
      '쓸 수 있는 날': 날목록,
      '먼저 달라진 것': (code === 'jjak' ? 관찰말표나 : 관찰말표)[관찰] || null,
      문항: 문항.map(x => x.칸),
      '오늘 할 일 후보': 문항.filter(x => x.할일).map(x => ({ n: x.칸.n, '할 일': x.할일 })),
    };
  }
  // 글 → 줄. 마크다운이 섞여도 화면엔 순수 글만(간명과 같은 씻기).
  function 한편줄(t) {
    return String(t).replace(/\*\*/g, '').replace(/^#{1,4} */gm, '').replace(/^ *[*•-] +/gm, '')
      .split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
  }
  function 한편붙이기(box, code, 장, f, met, 관찰, 열쇠, 이름표) {
    const pb = box.querySelector('.pb-piece'); const slot = pb && pb.querySelector('.pb-ai-slot'); if (!slot) return;
    // 표에서 온 답이어야 판정이 잠긴다 — 표키 없는 칸(코드가 쓴 기본 문장)이 하나라도 있으면 한 편을 열지 않는다.
    const 빈칸 = f.Q.map((q, i) => (q && q.표키) ? 0 : i + 1).filter(Boolean);
    if (빈칸.length) {
      try { console.warn('한 편 안 엶 — 표키 없는 칸:', code, 빈칸.join(',')); } catch (e) {}
      // 운영자에게는 왜 안 열렸는지 보인다 — 조용히 사라지면 「버튼이 없다」로만 보인다. 손님 화면에서는 그냥 없다.
      let 수퍼 = false; try { 수퍼 = !!(window.ChaeksaUsage && ChaeksaUsage.plan() === 'super'); } catch (e) {}
      if (수퍼) slot.innerHTML = '<div class="pb-ai"><p class="pb-ai-load">표에서 온 답이 아닌 칸이 있어 한 편을 열지 않았습니다 — '
        + esc(빈칸.join('·')) + '번. 이 줄은 운영자에게만 보입니다.</p></div>';
      else pb.remove();
      return;
    }
    // 열쇠: 결제 열쇠(그 사람) + 내 사주 + 먼저 달라진 것 + 달. 위 표의 답이 달마다 바뀌므로 한 편도 달마다 새로 쓴다
    // (한 주문으로 한 달 세 번까지는 서버가 센다).
    const 나 = (R && R.input) || {};
    const key = ['chaeksa.piece', 한편판, 열쇠, [나.year, 나.month, 나.day, 나.hour, 나.minute, 나.gender].join('-'), 관찰 || '',
      today.getFullYear() + '-' + (today.getMonth() + 1)].join('.');
    let 흩 = 0x811c9dc5;
    for (let i = 0; i < key.length; i++) { 흩 ^= key.charCodeAt(i); 흩 = Math.imul(흩, 16777619); }
    const pk = 'pc.' + code + '.' + (흩 >>> 0).toString(36) + '.' + key.length.toString(36);   // 헤더라 ASCII 만, 40자 안
    const 그리기 = (raw) => {
      // 첫 줄 대괄호 제목은 떼어 따로 세운다 — 안 떼면 대괄호가 그대로 찍힌다.
      const p = (window.ChaeksaAI && ChaeksaAI.pieceParts) ? ChaeksaAI.pieceParts(raw) : { 제목: '', 본문: raw };
      slot.innerHTML = '<div class="pb-ai"><p class="pb-ai-k">열 가지를 한 편으로 풀었어요</p>'
        + (p.제목 ? '<p class="pb-ai-t">' + esc(p.제목) + '</p>' : '')
        + 발언들(한편줄(p.본문))
        + '<p class="pb-ft">엔진이 낸 결과를 생성형 AI가 말로 옮겼습니다. 판정은 위 답 그대로입니다.</p></div>';
    };
    const 알림 = (말, 단추) => {
      slot.innerHTML = '<div class="pb-ai">' + (말 ? '<p class="pb-ai-load">' + esc(말) + '</p>' : '')
        + (단추 ? '<button class="btn nx-cta" type="button" style="background:var(--accent);color:#fff;border-color:var(--accent)">' + esc(이름표) + ' 한 편 청하기</button>' : '') + '</div>';
      const b = slot.querySelector('button'); if (b) b.onclick = () => { b.disabled = true; 굽기(); };
    };
    const 서버읽기 = async () => {
      try {
        if (!window.ChaeksaCloud || !ChaeksaCloud.api || !ChaeksaCloud.signedIn || !ChaeksaCloud.signedIn()) return null;
        const j = await ChaeksaCloud.api('/rest/v1/rpc/ganmyeong_get', { method: 'POST', body: JSON.stringify({ p_pk: pk }) });
        return (j && j.ok && j.hit && j.body) || null;   // 굽는 중 표식이면 그대로 돌려준다 — 부르는 쪽이 가른다
      } catch (e) { return null; }
    };
    const 굽기 = async () => {
      알림('책사가 위 열 가지 답을 한 사람의 이야기로 엮는 중입니다 — 1분 안팎 걸립니다. 화면을 벗어나셔도 끝까지 씁니다.', false);
      try {
        const r = await ChaeksaAI.sheetPiece(code, 한편자료(장, code, f, met, 관찰), { note: 열쇠, cachePk: pk });
        try { localStorage.setItem(key, r.raw); } catch (e) {}
        if (r.warn && r.warn.length) { try { console.info('한 편 경고:', code, r.warn); } catch (e) {} }
        그리기(r.raw);
      } catch (e) {
        try { console.warn('한 편 실패:', code, e); } catch (e2) {}
        if (e && e.baking) {
          알림('앞서 청하신 한 편을 아직 쓰는 중입니다 — 끝나는 대로 여기 펴 드립니다…', false);
          for (let 회 = 0; 회 < 18; 회++) {           // 10초씩 3분 — 프록시 자물쇠와 같은 길이. 새로 굽지 않는다
            await new Promise(r => setTimeout(r, 10000));
            if (!slot.isConnected) return;
            const t = await 서버읽기();
            if (t && t.indexOf(BAKING표식) !== 0) { try { localStorage.setItem(key, t); } catch (e6) {} 그리기(t); return; }
            if (!t) break;   // 자물쇠가 풀렸는데 글이 없다 = 그 굽기가 실패했다. 아래 단추로 — 손으로만 다시
          }
        }
        const b = e && e.blocked;
        if (b) { 알림((b.title || '지금은 쓸 수 없습니다.') + (b.body ? ' ' + b.body : ''), false); return; }
        // 운영자에게는 까닭을 붙인다 — 「지금은 못 썼습니다」만으로는 결제인지 검사인지 서버인지 알 수가 없다.
        let 까닭 = '';
        try {
          if (window.ChaeksaUsage && ChaeksaUsage.plan() === 'super') {
            까닭 = ' (운영자에게만: ' + String((e && (e.detail || e.message)) || e).slice(0, 200)
              + ((e && e.block && e.block.length) ? ' · ' + e.block.join(',') : '') + ')';
          }
        } catch (x) {}
        알림((e && e.gate ? '이번 글이 검사를 넘지 못해 드리지 않았습니다. 사용 횟수는 되돌려 놓았으니 다시 청해 주세요.'
          : e && (e.timeout || e.truncated) ? '이번에는 끝까지 쓰지 못했습니다. 사용 횟수는 되돌려 놓았으니 다시 청해 주세요.'
          : '지금은 한 편을 쓰지 못했습니다. 잠시 뒤 다시 청해 주세요.') + 까닭, true);
      }
    };
    let 있던 = null; try { 있던 = localStorage.getItem(key); } catch (e) {}
    if (있던) { 그리기(있던); return; }
    알림('', true);
    // 다른 기기에서 이미 쓴 한 편이 서버에 있으면 공짜로 편다(읽기만)
    서버읽기().then(t => {
      if (t && t.indexOf(BAKING표식) !== 0 && slot.isConnected) { try { localStorage.setItem(key, t); } catch (e) {} 그리기(t); }
    });
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
    // 「이번 달 일운 달력」 상품은 2026-09-14 삭제(사장님) — 결제 권유를 걷고, 이미 산 분만 그대로 연다.
    const paid = window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('month');
    if (!paid) { box.innerHTML = ''; box.classList.add('hide'); return; }
    const v = T.myDays(R, y, m);
    // 좋은 날 배점(monthScoreFor)은 2026-09-04 폐지 — 점수·좋은 날·조심할 날·주 단위 평균을 걷고,
    // 서른 칸에는 그날 하늘에 온 글자(십신 · 돈/자리/연)만 남긴다. 아래 주절·좋은절·조심절·예고는 비운다.
    const 폐지 = true;
    const 주절 = 폐지 ? '' : v.주들.map(w => {
      const g = w.top.십신;
      return `<div class="pb-dd"><b>${w.시작}~${w.끝}일</b> <span class="pb-god">${w.평균 >= 60 ? '순한 주' : w.평균 <= 42 ? '무거운 주' : '보통 주'}</span>
        <p class="pb-why">◦ 가장 좋은 날은 <b>${w.top.일}일(${w.top.요일})</b> ${esc(w.top.간지)} · ${esc(g)} — ${esc(GOD_FLOW[g] || '')}</p>
        ${w.low.점수 <= 35 ? `<p class="pb-why">◦ ${w.low.일}일(${w.low.요일})은 눌립니다 — 큰 결정은 미루세요</p>` : ''}
      </div>`;
    }).join('');
    const 좋은절 = 폐지 ? '' : v.좋은.length
      ? v.좋은.map(r => `<p class="pb-why">◦ <b>${r.일}일(${r.요일})</b> ${esc(r.간지)} · ${esc(r.십신)}${r.이유.length ? ' — ' + esc(r.이유[0]) : ''}</p>`).join('')
      : '<p class="pb-why">◦ 크게 열리는 날이 없는 달입니다 — 무리해서 일을 벌이기보다 다음 달을 준비하는 달로 쓰세요</p>';
    const 조심절 = 폐지 ? '' : v.조심.length
      ? v.조심.map(r => `<p class="pb-why">◦ <b>${r.일}일(${r.요일})</b> ${esc(r.간지)}${r.이유.length ? ' — ' + esc(r.이유[0]) : ' — 기운이 눌리는 날입니다'}</p>`).join('')
      : '';
    // 다음 달 예고 — 달마다 다시 사는 상품의 고리
    let 예고 = '';   // 「다음 달 풀리는 날 N일」 예고도 배점 폐지로 걷었다
    const mw = T.monthWhy ? T.monthWhy(R) : null;
    box.innerHTML = `<h2>${m}월 일운 달력<span class="h2sub">결제 열람 · ${y}년</span></h2>
      ${mw ? `<div class="nx-diag pbd"><p class="nx-diag-k">왜 나에게는 날의 서열인가</p>${mw.말.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      <div class="pb-grid">` + v.rows.map(r => {
        const cls = '';   // 점수 색칠(good/bad)은 배점 폐지로 안 한다
        // 같은 달력의 다른 줄(docs/29 셋) — 그날 하늘에 온 글자가 돈·자리·인연 중 무엇인가.
        // 오늘의 비서(chaeksadan.오늘)와 같은 잣대다: 재성=돈 · 관성=자리 · 배우자성=연.
        const 무리 = { 편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성' }[r.십신] || '';
        const 여 = ((profile && profile.gender) || 'M') !== 'M';
        const 표 = 무리 === '재성' ? (여 ? '돈' : '돈·연') : 무리 === '관성' ? (여 ? '자리·연' : '자리') : '';
        return `<div class="pb-cell${cls}${r.일 === today.getDate() ? ' now' : ''}">
          <b>${r.일}</b><span>${esc(r.십신.slice(0, 2))}</span>${표 ? `<span style="display:block;font-size:9px;color:var(--accent)">${표}</span>` : ''}</div>`;
      }).join('') + `</div>
      <p class="hint" style="margin:6px 0 0">칸 아래 작은 글자 — 그날 천간에 온 것이 <b>돈</b>인지 <b>자리</b>인지 <b>인연</b>인지. 홈의 오늘 한마디와 같은 기준입니다.</p>
      ${주절}${좋은절}${조심절}
      <p class="pb-ft">잣대 공개 — 그날 천간에 온 글자가 나에게 무슨 십신인가, 그것뿐입니다. 좋은 날·조심할 날의 점수는 매기지 않습니다(2026-09-04). 각 날의 시간대는 그날이 되면 「오늘의 시간대」가 12시진 곡선으로 그려드립니다.</p>
      ${예고}`;
  }

  // 2026-08-30 「카카오로 물어보기도 다 치우자」 — 비워두면 카카오 버튼이 스스로 숨고
  // 메일만 남는다(그렇게 만들어 두었다). 채널 아이디는 되살릴 때를 위해 주석으로 남긴다: '_jdqxaX'
  const KAKAO_CHANNEL = '';
  // 택일 신청서(네이버폼). 여기가 주 창구다 — 2026-09-10 까지 이 탭의 유일한 창구가
  // mailto: 하나였는데, 모바일에서 메일 앱이 안 잡히면 눌러도 아무 일이 안 난다.
  // 블로그에서 오는 사람은 거의 모바일이라 사실상 창구가 없었던 셈이다.
  // 비우면 메일이 다시 주 버튼으로 올라간다.
  const TAEK_FORM_URL = 'https://naver.me/FdqTMrhq';

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
    // 값은 products 표 한 곳에만 있다(docs/17). 화면 글자는 표에서 받아 채운다 —
    // 적어 두면 표를 바꿀 때 어긋나고, 결제 금액과 다르면 토스 심사에서 걸린다.
    if (window.ChaeksaPay && ChaeksaPay.product) ChaeksaPay.product('taekil').then(p => {
      if (p) document.querySelectorAll('[data-price="taekil"]').forEach(el => { el.textContent = ChaeksaPay.won(p.amount); });
    }).catch(() => {});
    a.href = 'mailto:b01099991263@gmail.com?subject='
      + encodeURIComponent('[책사] 출산택일 상담 문의')
      + '&body=' + encodeURIComponent(TAEK_FORM);

    // 신청서가 주 버튼이다(화면에 그렇게 적혀 있다). 주소가 비어 있을 때만
    // 메일을 도로 올린다 — 그때는 메일이 유일한 창구라 작게 두면 안 된다.
    const f = $('btnTaekForm');
    if (f) {
      if (TAEK_FORM_URL) { f.href = TAEK_FORM_URL; }
      else {
        f.classList.add('hide');
        if ($('taekFormNote')) $('taekFormNote').classList.add('hide');
        a.className = 'btn';
        a.innerHTML = '<span class="seal">書</span> 상담 문의하기';
      }
    }

    const k = $('btnTaekKakao');
    if (!k || !KAKAO_CHAT) return;
    k.classList.remove('hide');
    if ($('taekKakaoNote')) $('taekKakaoNote').classList.remove('hide');
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
    if ($('memoY')) $('memoY').onchange = peek; $('memoM').onchange = peek; peek();

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
                                 '남겨 두시면 이 기준이 맞았는지 함께 볼 수 있습니다.');
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

  if ($('btnMemoAdd')) $('btnMemoAdd').onclick = () => {
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
      if ($('btnTodayMemoGo')) $('btnTodayMemoGo').onclick = () => go('memo');
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



  // ───── 천직 — 천직첩 ─────
  let jikFor = null;

  // ───── 연애·인연 — 도화첩 ─────
  // ───── 關 · 관계지도 (docs/30) ─────
  // 지도는 궁위 배치다 — 가운데가 공주님, 위가 연주(초년) · 왼쪽 월주(자람) · 오른쪽 시주(말년) · 아래 일지(배우자).
  // 사람은 제 글자가 선 궁 쪽에 앉는다. 겉은 진하게, 속은 점선, 없음은 흐리게, 묶임은 사슬 표시.
  let gwFor = null;

  // ───── 지칠 때와 채울 때 ─────
  let jcFor = null;

  // ───── 내 편이 되어주는 사람 ─────
  let npFor = null;

  // ───── 인연이 오는 해 ─────
  let inyeonFor = null;

  // ── 너의 연애 스토리 — 과거를 맞히면 미래를 산다 ──
  // 무료: 과거 구간 찍기 + 현재 판. 유료(인연 시기 상품): 미래.
  // 과거와 미래가 같은 잣대라는 것이 이 화면의 값어치다 — 그래서 그 말을 화면에 적는다.
  let lsFor = null;
  // ── 간명서 — 번호 문항 통변 + 문항별 [맞다/애매/아니다] ──
  // 채팅 간명이 친구 채점 90%를 받았다. 그 형식(문항·채점·정직)이 제품이다.
  let gmFor = null;
  // 간명서는 무료다(2026-08-29 「첫화면에 바로 뿌려버려 — 무조건 신뢰를 얻어야 해」).
  // 신뢰를 파는 게 아니라 먼저 준다. 유료 선은 미래의 해상도(달·날·시)에만 남는다.
  // GM_VER: 간명 프롬프트 판 — 말투·형식을 고치면 올린다. 캐시가 새 원국으로 한 번만 재굽기.
  // 오늘 나온 책사 — [초상 키, 이름, 데려갈 화면, 아뢰는 말]
  // 말은 권유지 판단이 아니다. 명리 주장은 각 화면이 제 계산으로 한다.
  // 초상이 아직 없을 때 얼굴 자리에 세울 인장
  const 책사인장 = { 자평진전: '格', 궁통보감: '候', 억부: '抑', 궁위: '宮',
                     인연: '緣', 재물: '財', 천직: '職', 운로: '運',
                     택일: '擇', 좌장: '策' };
  // 이름과 직함 — 「억부」는 학술 용어지 사람 이름이 아니다. 부를 이름을 주되
  // 축(고전 이름)은 직함으로 남긴다: 그것이 우리 신뢰 자산이라 버릴 수 없다.
  // AI 는 계속 축 이름으로 적고, 화면이 그릴 때만 이름으로 바꿔 세운다 —
  // 그래야 이미 구워진 의논도 원국을 안 올리고 새 이름으로 열린다.
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
    ['gungtong', '궁통보감', 'today', '오늘의 기운이 추운지 더운지 봐 드리겠습니다.'],
    ['jaemul', '재물', 'nokpae', '돈이 어떤 모양으로 들어오는지, 어디로 새는지 짚어 드릴까요.'],
    ['eokbu', '억부', 'jichim', '무엇이 깎고 무엇이 채우는지 짚어 드리겠습니다.'],
    ['unro', '운로', 'life', '언제가 두터워지고 언제가 담금질인지 곡선으로 펴 드릴까요.'],
    ['japyung', '자평진전', 'me', '격이 성격인지 파격인지, 원국을 펴 보여 드리겠습니다.'],
    ['cheonjik', '천직', 'jikcheop', '스물다섯 결 가운데 어느 쪽인지 아뢰겠습니다.'],
    ['gungwi', '궁위', 'dohwa', '곁자리에 앉은 글자가 누구를 가리키는지 보시겠습니까.'],
  ];
  // ── 발언자 표시 — 무료 의논과 유료 본문이 함께 쓴다 ──
  // 초상은 app/art/chaeksa-<키>.webp. 없으면 onerror 로 스스로 사라져 글자 칩만 남는다 —
  // 그림이 도착하는 순서대로 화면이 좋아진다.
  const 책사키 = { 자평진전: 'japyung', 궁통보감: 'gungtong', 억부: 'eokbu', 궁위: 'gungwi',
                   인연: 'inyeon', 재물: 'jaemul', 천직: 'cheonjik', 운로: 'unro',
                   택일: 'hyeopgi', 좌장: 'jwajang' };
  /** 그림 열쇠(inyeon)로 인장 한 글자를 찾는다. 그림이 없을 때 빈 액자를 두지 않기 위한 것이다. */
  const 인장of = (k) => { const 축 = Object.keys(책사키).find(a => 책사키[a] === k); return (축 && 책사인장[축]) || '策'; };
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
    if (!벌.length) return '';           // 그림이 한 벌도 없으면 인장만 세운다
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
  // \u2460~\u2473(①~⑳) 에 \u3251~(㉑~) 를 더했다 — 조립기의 「자리를 두고 — 여러 눈으로」 넷(2026-09-03).
  const 발언자류 = /^([\u2460-\u2473\u3251-\u325F])?\s*\u3014([^\u3015]{1,12})\u3015\s*/;
  const 번호자리 = (ch) => { const c = ch.charCodeAt(0); return c >= 0x3251 ? 21 + (c - 0x3251) : c - 0x2460; };
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
    // 그림이 한 벌도 없으면 초상()이 빈 문자열을 돌려준다 — img 를 안 세운다.
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
  // 탭 위의 열 책사 한마디(renderChorus · 육안HTML · 열눈HTML)는 2026-09-12 사장님 「열책사 어쩌고 다 지우자」로 걷었다.
  // 열눈전체()는 홈 전체 목록의 한 줄 소개에 아직 쓴다(chaeksadan.js 쪽은 그대로).
  // ── 홈 — 웹툰 목록처럼 (2026-09-04 사장님 「네이버 웹툰 메인처럼」) ──
  // 표지마다 얼굴, 제목은 그 사람 값으로 쓴 한 줄(약속), 시간순 탭, 오늘·최근 본 배지.
  // 제목은 지어내지 않는다 — 열눈의 첫 마디 첫 문장. 값이 없는 콘텐츠는 분류 제목 그대로.
  // 인기순·적중순은 없다(안 하기로 한 것). 순서는 시간순이다.
  const 홈목록 = [
    // 칸 이름은 명리 과목이 아니라 공주님의 물음이다(2026-09-04 홈 점검).
    // 올해 나는·인연은 언제 오나·일은 언제 풀리나 — 다음 해를 말하는 칸이라 홈에서 뺌(docs/31 「무료는 다음 주, 유료는 다음 달, 다음 해는 안 판다」). 탭 코드는 남긴다.
    // 곁의 사람들(gwangye)·나는 어떻게 사랑하나(dohwa)는 법 없는 칸 — 홈에서 뺌(2026-09-04 「법 있는 것으로만」). 탭 코드는 남긴다.
    // 인생 곡선(life)은 09-04 에 같은 이유로 뺐다가 되돌렸다(2026-09-09) — 상태차 181칸이 붙어
    // 법이 생겼다. 합계 보존으로 나올 수 있는 칸만 남긴 표라 「법 있는 것으로만」을 통과한다.
    // 그리고 서고를 지우면 이 화면은 주소로만 열리는 화면이 된다.
    { tab: 'me',        묶음: '나',   이름: '나는 어떤 사람인가',   기본: 'japyung' },
    // 어떤 사람이 오나(lovestory) — 「내 배우자성을 일간으로 타고난 사람」 읽기 전체가 09-04 삭제 대상. 홈에서 뺌.
    { tab: 'geunamja',  묶음: '우리', 이름: '이 남자, 나한테 돈을 쓸까요?', 기본: 'jaemul', 말: '그래서 나한테 도움이 되나요?' },
  ];
  // 어느 화면을 언제 봤는지 적어 둔다. 「최근 본」 배지를 짓게 되면 이 값을 쓴다.
  // 열쇠를 chaeksa.seen 에서 chaeksa.본것 으로 옮겼다(2026-09-12) — track.js 가 첫 방문 판별에
  // 같은 이름을 쓰고 있었다. 한쪽은 '1' 을 적고 한쪽은 객체를 적어서, 한 열쇠에 주인이 둘이었다.
  function 본표시(tab) { try { const s = JSON.parse(localStorage.getItem('chaeksa.본것') || '{}'); s[tab] = Date.now(); localStorage.setItem('chaeksa.본것', JSON.stringify(s)); } catch (e) {} }
  // 일일 리포트(일일리포트 · 리포트HTML)를 여기서 걷었다 (2026-09-12). 홈의 오늘 리포트 카드와 이레의 오늘 칸이 쓰던 것인데
  // 둘 다 걷혀서 부르는 곳이 없어졌다. 「엮임」(원국 얽힘이 오늘 글자로 어떻게 달라지나) 계산이 여기 있었다 —
  // 살릴 일이 생기면 git 에서 꺼낸다(2f24d4d 이전). 엔진 E.branchRels 는 그대로 있다.
  // 세는 말 — 「나를 두고 열 가지」처럼 개수를 한글로 적는다. 숫자를 적으면 목록표처럼 읽힌다.
  const 한글수 = (n) => ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'][n] || String(n);
  /** 그 탭이 화면에서 무엇이라 불리는지. 홈의 오늘 한마디가 어디로 가는지 적는 데 쓴다.
   *  이름표를 새로 만들지 않는다 — 화면에 이미 선 제목을 읽는다. 두 벌이 되면 반드시 어긋난다.
   *  제목 앞의 인장 한 글자(「緣 · 」)는 뗀다. 화면에 한자를 안 쓴다(CLAUDE.md). */
  function 탭이름(tab) {
    if (!tab) return '';
    try {
      const el = document.querySelector('[data-tab="' + tab + '"] h2, [data-tab="' + tab + '"] h3');
      const t = el ? String(el.textContent || '').trim().replace(/^\S+\s*·\s*/, '') : '';
      if (t) return t.length > 14 ? t.slice(0, 13) + '…' : t;
    } catch (e) {}
    const h = 홈목록.find(x => x.tab === tab && !x.scroll);
    return h ? h.이름 : '';
  }
  // ───── 이야기 화면 — 질문 하나, 답은 날짜로 (2026-09-12 사장님 「1컨텐츠+1질문+1삽화, 무료 7일 유료 30일」) ─────
  // 7일은 무료. 30일은 「이번 달 30일」 상품(month) 하나로 모든 이야기가 열린다 — 이야기마다 따로 팔지 않는다.
  // 말투는 사장님 말투(짧게 · A = B · 존댓말). 십신 이름은 그대로 부른다(법전 27조) — 이 탭은 data-plain 이다.
  function renderStory() {
    const S = window.ChaeksaStories, box = $('stResult'), P = People(); if (!S || !box || !R || !P) return;
    // 갈래로 열었으면(홈 갈래 카드) 그 갈래의 이야기들이 상황 칩이다 — 판정은 같고 말만 다르니 한 화면에서 고른다(docs/37).
    const Q = window.ChaeksaQuestions;
    const 갈래 = window.현재갈래 && Q && Q.갈래들.find(g => g.키 === window.현재갈래);
    const 질문 = window.현재질문;   // 격자 질문 콘텐츠(docs/41) — 제목은 격자 문장, 답은 판정, 결론·할 것은 갈래 × 칸
    let subs = 갈래 && S.갈래of ? S.목록.filter(x => S.갈래of(x) === 갈래.키) : [];
    let st, 썸, 칩 = '', 오늘답 = '';
    if (질문 && 갈래) {
      const 뜻 = { 합거: '그 글자가 이름만 있고 뿌리가 없다', 무근: '그 글자가 이름만 있고 뿌리가 없다', 극닿음: '치는 글자가 바로 닿는다', 극통관: '치는 글자가 있는데 사이 글자가 받아 넘겨 안 다친다', 극제복: '치는 글자를 다른 글자가 잡아 준다', 극힘차이: '치는 글자가 두 배 넘게 약해 못 친다', 생받음: '운 글자가 그 글자를 생한다', 극없음: '아무도 건드리지 않는다', 궁충: '그 자리가 원국에서 충이다', '기신 제복': '격신을 치는 글자가 잡혔다', '기신 방치': '격신을 치는 글자를 아무도 안 잡는다' };
      const 첫편 = subs[0];
      st = { id: 'q-' + 갈래.키 + '-' + (질문.결과 || 'day'), 질문: 질문.질문, 갈래: 갈래.키, k: (첫편 && 첫편.k) || 'inyeon', 사이: (첫편 && 첫편.사이) || 갈래.이름,
             소개: 질문.결과 ? (뜻[질문.결과] || 질문.결과) + ' — 그런 날인지를 날마다 봐요.' : '이 자리를 맡은 글자가 오늘 어떤지로 날을 골라요.',
             혼자: !갈래.짝, 결론: 갈래.결론, 할것: 갈래.할것, 마무리: '', 묶음: { 좋음: '좋은 날', 조심: '조심할 날', 짝: null } };
      썸 = 첫편 ? 'art/story-' + 첫편.id + '.webp' : '';
      const qs = Q.격자().filter(q => q.갈래 === 갈래.키);
      칩 = '<div class="wt-chips st-sit">' + qs.map(q => '<button type="button" data-q="' + escP(q.결과 || '') + '"' + ((q.결과 || '') === (질문.결과 || '') ? ' class="on"' : '') + '>' + escP(q.질문.replace(/\?$/, '')) + '</button>').join('') + '</div>';
      // 오늘 이 질문의 답 — 상태 묻기면 오늘 결과가 이 칸인가
      if (질문.결과) { try { const P = window.ChaeksaPanjeong; const r = P.이야기결과(R, 갈래.키, today, { 여자: ((profile && profile.gender) || 'M') !== 'M' });
        const 예 = r.결과.키 === 질문.결과;
        오늘답 = '<div class="qa-today s' + (예 ? (r.칸 === '좋음' ? 2 : r.칸 === '조심' ? 0 : 1) : 1) + '"><b>' + (예 ? '오늘은 그래요.' : '오늘은 아니에요.') + '</b><span>' + escP(r.이유) + '</span></div>'; } catch (e) {} }
      subs = [];
    } else {
      st = S.찾기(window.현재이야기) || S.목록[0]; if (!st) return;
      if (subs.length && subs.indexOf(st) < 0) { st = subs[0]; window.현재이야기 = st.id; }
      썸 = 'art/story-' + st.id + '.webp';
      칩 = subs.length > 1 ? '<div class="wt-chips st-sit">' + subs.map(x => '<button type="button" data-st="' + x.id + '"' + (x.id === st.id ? ' class="on"' : '') + '>' + escP(x.질문.replace(/\?$/, '')) + '</button>').join('') + '</div>' : '';
    }
    const 머리 = '<div class="st-cover">' + (썸 ? '<img alt="" src="' + 썸 + '?v=' + (window.CHAEKSA_ART || 1) + '" onerror="this.remove()">' : '') + '<b>' + escP(질문 ? 질문.질문 : (갈래 ? 갈래.날고르기 : st.질문)) + '</b></div>'
      + (갈래 ? '<p class="hint" style="margin:8px 0 6px">' + (질문 ? '같은 갈래의 다른 질문' : '어떤 상황이에요? 판정은 같고, 말이 달라요.') + '</p>' + 칩 : '')
      + 오늘답
      + '<p class="hint" style="margin:8px 0 12px">' + escP(st.소개) + '</p>';
    if (!box.dataset.sit) { box.dataset.sit = '1'; box.addEventListener('click', (e) => {
      const b = e.target.closest('.st-sit button'); if (!b) return;
      if (b.dataset.q != null) { const Q2 = window.ChaeksaQuestions; const q = Q2.격자().find(x => x.갈래 === window.현재갈래 && (x.결과 || '') === b.dataset.q); if (q) window.현재질문 = { 갈래: q.갈래, 결과: q.결과, 질문: q.질문 }; }
      else { window.현재질문 = null; window.현재이야기 = b.dataset.st; }
      renderStory(); }); }
    // 혼자 보는 이야기(st.혼자) — 그 사람이 없다. 그래도 「열어야 열린다」(09-13 사장님 「이미 열려 있으니 신뢰도가 떨어지네」): 단추 하나.
    if (st.혼자) {
      if (window.현재그사람 !== '나') {
        box.innerHTML = 머리 + '<div class="st-pick"><p>내 사주만으로 봐요. 그 사람은 필요 없어요.</p><button class="btn ghost small" id="btnStOpen" type="button">7일 열기</button></div>';
        if ($('btnStOpen')) $('btnStOpen').onclick = () => { window.현재그사람 = '나'; renderStory(); };
        return;
      }
      renderStoryBody(box, 머리, st, null, '');
      return;
    }
    // 그 사람 고르기 — 두 사람 사주를 다 봐야 답이 된다. 기존 장(shPick)과 같은 목록이다.
    const me = P.active(); const list = P.list().filter(p => !me || p.id !== me.id);
    if (!list.length) {
      box.innerHTML = 머리 + '<div class="st-pick"><p>그 사람 생년월일을 먼저 넣어 주세요. 그래야 두 사람을 놓고 봐요.</p><button class="btn" id="btnStAdd" type="button">그 사람 추가</button></div>';
      if ($('btnStAdd')) $('btnStAdd').onclick = () => openPersonForm(null);
      return;
    }
    // 그 사람은 손님이 고른다 — 목록 첫 사람으로 멋대로 열지 않는다(09-13 사장님 「그 사람이 정해지지 않았는데 답변이 열려 있다」).
    // 안 골랐으면 고르는 칸만 서고 7일은 닫혀 있다.
    const 고름 = !!(window.현재그사람 && list.some(q => q.id === window.현재그사람));
    // 네이티브 select 는 브라우저가 네모로 그린다(09-13 사장님 「너무 네모네모하게 나오는데」) — 목록을 직접 그린다.
    const 이름표 = (q) => esc(사람이름(q.name) || '그 사람') + '<small>' + esc(q.relation || '') + '</small>';
    const 고르기 = (p) => '<div class="st-pick"><label>그 사람</label>'
      + '<div class="st-who"><button type="button" class="st-who-b' + (p ? '' : ' empty') + '" id="stWho" aria-haspopup="listbox" aria-expanded="false">'
      + (p ? 이름표(p) : '누구 얘기예요?') + '<i class="chev"></i></button>'
      + '<div class="st-menu hide" id="stMenu" role="listbox">'
      + list.map(q => '<button type="button" role="option" data-id="' + q.id + '"' + (p && q.id === p.id ? ' class="on"' : '') + '>' + 이름표(q) + '</button>').join('')
      + '</div></div>'
      + '<button class="btn ghost small" id="btnStAdd" type="button">+ 추가</button></div>';
    const 고르기연결 = () => {
      const b = $('stWho'), m = $('stMenu'); if (!b || !m) return;
      const 닫기 = () => { m.classList.add('hide'); b.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', 바깥); };
      const 바깥 = (e) => { if (!m.contains(e.target) && e.target !== b && !b.contains(e.target)) 닫기(); };
      b.onclick = () => { const 열림 = !m.classList.contains('hide'); if (열림) return 닫기(); m.classList.remove('hide'); b.setAttribute('aria-expanded', 'true'); setTimeout(() => document.addEventListener('click', 바깥), 0); };
      m.querySelectorAll('button').forEach(x => x.onclick = () => { window.현재그사람 = x.dataset.id; renderStory(); });
    };
    if (!고름) {
      box.innerHTML = 머리 + 고르기(null) + '<p class="hint" style="margin:0 0 18px">그 사람을 고르면 오늘부터 7일이 바로 열려요. 목록에 없으면 「+ 추가」로 생년월일을 넣어 주세요.</p>';
      고르기연결();
      if ($('btnStAdd')) $('btnStAdd').onclick = () => openPersonForm(null);
      return;
    }
    const p = P.get(window.현재그사람);
    let Rm; try { Rm = E.calc(P.toProfile(p)); } catch (e) { box.innerHTML = 머리 + '<p class="hint">그 사람 사주를 계산하지 못했어요.</p>'; return; }
    renderStoryBody(box, 머리, st, Rm, 고르기(p));
    고르기연결();
    if ($('btnStAdd')) $('btnStAdd').onclick = () => openPersonForm(null);
  }
  /** 이야기 본문 — 7일(무료) + 30일(이번 달 결제). 두 사람이면 Rm, 혼자면 null. 고르기칸은 위에 붙일 HTML. */
  function renderStoryBody(box, 머리, st, Rm, 고르기칸) {
    const S = window.ChaeksaStories;
    const 주 = S.일주일(R, Rm, st, today);
    const paid = !!(window.ChaeksaPay && ChaeksaPay.paidFor && ChaeksaPay.paidFor('month'));
    // 하루 한 줄 = 결론 / 그 사람 쪽 + 내 쪽 / 할 것
    // 등급 이름은 s0~s3 — g0~g3 은 달력이 칸 전체를 초록·카키로 칠하는 이름이라 줄에 새어 들어왔다(2026-09-12 사장님 「색상분배 이거 맞아??」).
    const 줄 = (x, 오늘, 머리말) => '<li class="st-day s' + x.등급 + (오늘 ? ' today' : '') + '">'
      + '<b>' + (머리말 || (오늘 ? '오늘' : x.요일)) + '<small>' + x.날 + '일</small></b>'
      + '<i>' + x.표 + '</i><span><em>' + escP(x.결론) + '</em><br><span class="why">' + escP(x.이유) + '</span><br><span class="do">' + escP(x.할것) + '</span></span></li>';
    // 바뀐 날만 말한다(09-14 사장님 「1 ㄱㄱ」) — 결과가 같은 날은 한 줄로 묶는다. 조문대로면 이레 중 바뀌는 날은 하루 이틀이고, 같은 문장을 닷새 되풀이하면 대충 만든 것으로 읽힌다.
    // 이유 글은 오늘 줄만 「오늘」, 다른 줄은 「그날」로 읽는다(stories.js 하루). 그 말만 다른 날까지 갈라 세면 첫날이 늘 따로 떨어진다 — 빼고 견준다(09-22 검토).
    const 날말뺌 = (t) => String(t || '').replace(/오늘|그날/g, '');
    const 같다 = (a, b) => a.결과 === b.결과 && a.그결과 === b.그결과 && a.등급 === b.등급 && 날말뺌(a.이유) === 날말뺌(b.이유);
    const 묶음들 = []; 주.forEach(x => { const l = 묶음들[묶음들.length - 1]; if (l && 같다(l.첫, x)) l.날들.push(x); else 묶음들.push({ 첫: x, 날들: [x] }); });
    const 이레줄 = 묶음들.map((m, mi) => {
      const 첫 = m.첫, 끝 = m.날들[m.날들.length - 1], 오늘 = mi === 0;
      if (m.날들.length === 1) return 줄(첫, 오늘);
      const 머리말 = (오늘 ? '오늘' : 첫.요일) + '~' + 끝.요일;
      return 줄(Object.assign({}, 첫, { 날: 첫.날 + '~' + 끝.날 }), 오늘, 머리말).replace('</em><br>', '</em> <small class="same">' + m.날들.length + '일 같아요</small><br>');
    }).join('');
    let h = 머리 + 고르기칸
      + '<p class="mnk">오늘부터 7일 · 무료' + (묶음들.length < 주.length ? ' · 바뀌는 날 ' + (묶음들.length - 1) + '번' : '') + '</p><ul class="st-days">' + 이레줄 + '</ul>'
      + '<p class="st-best">' + escP(S.그래서(st, 주)) + '</p>';
    if (paid) {
      const 달 = S.이번달(R, Rm, st, today);
      const g = S.묶음(st, 달);
      const 묶 = (제목, arr) => arr.length ? '<p class="mnk" style="margin-top:16px">' + escP(제목) + '</p><ul class="st-days">' + arr.map(x => 줄(x, false)).join('') + '</ul>' : '';
      h += '<p class="mnk" style="margin-top:22px">이번 달 30일</p>'
        + '<ul class="st-days mini">' + 달.map(x => '<li class="st-day s' + x.등급 + '"><b>' + x.요일 + '<small>' + x.날 + '일</small></b><i>' + x.표 + '</i><span><em>' + escP(x.결론) + '</em></span></li>').join('') + '</ul>'
        + 묶(st.묶음.좋음 + ' 셋', g.좋음) + 묶(st.묶음.조심 + ' 셋', g.조심) + (st.묶음.짝 ? 묶(st.묶음.짝, g.짝) : '');
    }
    // 30일 결제 권유는 2026-09-14 상품 삭제와 함께 걷었다 — 이야기는 오늘부터 7일 무료가 전부다.
    box.innerHTML = h;
  }

  function renderWtHome() {
    const box = $('wtHome'); if (!box || !R) return;
    // 원국이 메인 — 홈 맨 위(2026-09-14). 표는 saenggeuk.js, 말은 wongook.js.
    try { if (window.ChaeksaWongook) ChaeksaWongook.render(R, today, $('wgMain')); } catch (e) { try { console.warn('원국 실패:', e); } catch (e2) {} }
    // 설명서(58·59조) — 홈에서는 장면 한 줄만 보이고 나머지는 접어 둔다.
    try { if (window.ChaeksaSeolmyeong) ChaeksaSeolmyeong.render(R, today, $('smMain'), { pid: (function(){ try { const q = People(); return (q && q.activeId()) || 'me'; } catch (e) { return 'me'; } })() }); } catch (e) { try { console.warn('설명서 실패:', e); } catch (e2) {} }
    // 오늘 나에게 필요한 질문(사장님 09-14 이름) — 질문 격자 62문 중 오늘 이 사람의 판정에 걸리는 것만. 답은 판정 이유 그대로.
    try {
      const Q = window.ChaeksaQuestions, qb = $('qToday');
      if (Q && qb) {
        const 여자 = ((profile && profile.gender) || (R.input && R.input.gender) || 'M') !== 'M';
        const qs = Q.오늘질문(R, today, { 여자 }).filter(q => q.질문);
        if (qs.length) {
          qb.innerHTML = '<section class="wg qt" data-plain="1"><div class="wg-head"><b>오늘 나에게 필요한 질문</b><span>' + escP(today.getMonth() + 1) + '월 ' + escP(today.getDate()) + '일</span></div>'
            + qs.map(q => '<button type="button" class="qt-q s' + (q.칸 === '좋음' ? 2 : q.칸 === '조심' ? 0 : 1) + '" data-g="' + escP(q.갈래) + '"><b>' + escP(q.질문) + '</b><span>' + escP(q.답) + '</span><small>' + escP(q.갈래이름) + '</small></button>').join('')
            + '</section>';
          qb.classList.remove('hide');
          qb.querySelectorAll('.qt-q').forEach(b => { b.onclick = () => { const S = window.ChaeksaStories; const st = S && S.목록.find(x => S.갈래of(x) === b.dataset.g); if (!st) return; 본표시('gl-' + b.dataset.g); window.현재이야기 = st.id; window.현재그사람 = null; window.현재갈래 = b.dataset.g; go('story'); }; });
        } else qb.classList.add('hide');
      }
    } catch (e) { try { console.warn('오늘 질문 실패:', e); } catch (e2) {} }
    let 전체 = {};
    // 안 돌린다 — 첫 절이 그 탭의 물음이다. 그리고 같은 문장이 두 표지에 서지 않게 앞 표지가 쓴 문장은 건너뛴다.
    try { 전체 = (window.ChaeksaDan && ChaeksaDan.열눈전체) ? (ChaeksaDan.열눈전체(R, today, false) || {}) : {}; } catch (e) { 전체 = {}; }
    const 문장 = (t) => { const s = (String(t || '').split(/(?<=[.!?])\s+/)[0] || '').trim(); return s.length > 64 ? s.slice(0, 62) + '…' : s; };
    const 쓴 = {};
    const 타일 = 홈목록.map((h, i) => {
      const 묶 = 전체[h.말탭 || h.tab] || [];
      let 첫 = null, 말 = '';
      outer: for (const g of 묶) for (const b of g.본문들) { const s = 문장(b); if (s && !쓴[s]) { 첫 = g; 말 = s; 쓴[s] = 1; break outer; } }
      if (!첫 && 묶[0]) { 첫 = 묶[0]; 말 = 문장(묶[0].본문들[0]); }
      let k = 첫 ? (책사키[첫.축] || h.기본) : h.기본;
      // 오늘 자리는 오늘 값으로 — 뼈대 문장(「정관격입니다」)은 오늘의 제목이 아니다
      if (h.tab === 'today' && !h.scroll) {
        try { const 비 = ChaeksaDan.오늘 ? ChaeksaDan.오늘(R, today) : null; if (비 && 비.말) { 말 = 문장(비.말); k = 책사키[비.축] || k; } } catch (e) {}
      } else if (h.tab === 'ban') {
        try { const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate()); 말 = '오늘 조심할 것 하나'; } catch (e) {}
      } else if (h.key === 'myMonth') {
        // 예전엔 숨은 서고의 #tiMonthSub 글자를 읽어 왔다 — 홈이 홈의 다른 반쪽에 기대고 있었다.
        // 서고를 지우면서 값을 여기서 바로 센다(2026-09-09).
        try { const MM = window.ChaeksaMemo, st = MM && MM.standing ? MM.standing(R, today) : null;
          if (st) {
            // 「5월부터」가 내년 5월이면 해를 붙인다 — 안 붙이면 지난 5월로 읽힌다.
            const 언제 = st.turn ? ((st.turn.y !== today.getFullYear() ? st.turn.y + '년 ' : '') + st.turn.m + '월부터 결이 바뀝니다') : '';
            말 = st.head + (언제 ? ' · ' + 언제 : '') || 말;   // 등급 이름(담금질…)은 안 낸다
          } } catch (e) {}
      }
      if (!말) 말 = h.말 || '';
      const n = 묶.reduce((s, g) => s + g.본문들.length, 0);
      const 파일 = (k && window.CHAEKSA_ART) ? 초상(k, i + 80, false) : '';
      const 인 = 첫 ? (책사인장[첫.축] || '策') : '策';
      // 「최근 본」 배지 값(seen)을 2026-09-12 에 걷었다 — 칸마다 만들어 붙였는데 그리는 쪽에서 한 번도 안 읽었다.
      return Object.assign({}, h, { k, 말, n, 파일, 인, id: h.key || h.tab });
    });
    // ── 이야기 서점 (2026-09-12 사장님 확정 전략) ──
    // 「웹툰처럼 고르고 → 내 이야기라서 읽고 → 다음이 궁금해서 결제하고 → 다른 이야기도 찾아보는 서비스」.
    // 이야기 하나는 물음 하나다(사장님 「한개의 콘텐츠에 한개의 질문」). 지금은 여덟 장의 머리 물음을 이야기로 세운다.
    // 원국 정독(나)은 그 사람 이야기가 아니라 진열대에서 뺐다 — 아래 내비 「원국」으로 간다.
    // 오늘·이레·첫 의논은 홈에서 걷었다. 오늘은 「오늘」 탭에, 의논은 전체 목록에.
    // 짝을 아직 안 적으신 분께는 칸마다 적지 않고 진열대 머리에 한 번만 적는다.
    const 짝있음 = (() => { try { const P0 = People(); return !!(P0 && P0.others && P0.others().length); } catch (e) { return true; } })();
    const 띠기본 = 표무료() ? '열 가지 무료' : '셋 무료';
    const 이야기 = [
      { id: 'maeum', tab: 'maeum', k: 'inyeon', 사이: '썸', 제목: '그 사람, 나한테 마음이 있을까요?', 소개: '그래서 나한테 좋은 사람인가요?', 띠: 띠기본, 값: '9,900원' },
      { id: 'jjak', tab: 'sheet', sheet: 'jjak', k: 'inyeon', 사이: '썸', 제목: '내 짝은 언제 와요?', 소개: '그래서 지금 뭘 하면 되나요?', 띠: 띠기본, 값: '9,900원' },
      { id: 'jigeum', tab: 'sheet', sheet: 'jigeum', k: 'gungtong', 사이: '연애 중', 제목: '그 사람 지금 무슨 생각해요?', 소개: '그래서 지금 나는 어떻게 하면 되나요?', 띠: 띠기본, 값: '9,900원' },
      { id: 'gunghap', tab: 'gunghap', k: 'gungwi', 사이: '연애 중', 제목: '우리 둘, 잘 맞아요?', 소개: '그래서 이 사람이랑 가도 되나요?', 띠: 띠기본, 값: '9,900원' },
      { id: 'sok', tab: 'sheet', sheet: 'sok', k: 'inyeon', 사이: '연애 중', 제목: '우리 둘, 속궁합은요?', 소개: '누가 더 뜨겁고, 정이 어디로 가는지', 띠: 띠기본, 값: '9,900원' },
      { id: 'ibyeol', tab: 'sheet', sheet: 'ibyeol', k: 'inyeon', 사이: '재회', 제목: '헤어질까요, 계속 갈까요?', 소개: '그래서 어떻게 하면 되나요?', 띠: 띠기본, 값: '9,900원' },
      { id: 'gyeolhon', tab: 'sheet', sheet: 'gyeolhon', k: 'gungwi', 사이: '결혼', 제목: '그 사람, 결혼 생각 있을까요?', 소개: '그래서 이 사람과 결혼해도 되나요?', 띠: 띠기본, 값: '9,900원' },
      { id: 'geunamja', tab: 'geunamja', k: 'jaemul', 사이: '돈과 생활', 제목: '이 남자, 나한테 돈을 쓸까요?', 소개: '그래서 나한테 도움이 되나요?', 띠: 띠기본, 값: '9,900원' },
    ];
    // 여덟 장도 콘텐츠마다 한 장(art/story-<id>-s.webp)을 쓴다 — 책사 얼굴은 2026-09-12 밤에 다 지웠다. 없으면 글자 표지.
    이야기.forEach(f => { if (!f.썸) f.썸 = 'art/story-' + f.id + '-s.webp'; });
    // 새 이야기(질문 하나 + 썸네일 하나, 7일 무료 · 30일 유료)를 앞에 세운다 — stories.js 에 한 줄 더하면 진열대에 선다.
    // 갈래 카드(docs/37) — 판정은 갈래 8개인데 제목을 74개로 늘렸던 것을 접는다(09-14 사장님 「같은 답을 다른 제목으로」). 세부 상황은 이야기 화면 안의 칩.
    try {
      const S = window.ChaeksaStories, Q = window.ChaeksaQuestions;
      if (S && S.목록 && Q && Q.갈래들 && S.갈래of) {
        const 갈래카드 = Q.갈래들.map(g => {
          const subs = S.목록.filter(st => S.갈래of(st) === g.키);
          if (!subs.length) return null;
          const 사이들 = subs.map(st => st.사이).filter((x, i, a) => a.indexOf(x) === i);
          return { id: 'gl-' + g.키, tab: 'story', 갈래: g.키, story: subs[0].id, k: subs[0].k, 사이: 사이들[0], 사이들,
                   제목: g.날고르기, 소개: g.이름 + ' · 상황 ' + subs.length + '가지', 띠: '무료', 값: '오늘부터 7일', 썸: 'art/story-' + subs[0].id + '-s.webp' };
        }).filter(Boolean);
        이야기.push(...갈래카드);   // 9,900원 여덟 장이 앞, 무료 갈래 카드가 뒤(사장님 09-14 「9900원 결제 애들 상위로」)
      }
    } catch (e) {}
    const 사이들 = ['전체', '썸', '연애 중', '재회', '결혼', '이별', '가족', '돈과 생활', '친구·직장'];
    // 「이번 달 30일 전체 보기」 타일은 오늘 탭과 함께 걷었다(2026-09-13) — 30일은 이야기 화면 안에서 연다.
    // 표지 — 책사 얼굴에 제목을 얹는다(2026-09-12). 같은 책사를 쓰는 칸끼리 같은 날 같은 그림이 안 겹치게 벌을 나눈다.
    // 큰 표지(진열대)는 아래에 짧은 소개 + 무료 첫 장까지, 작은 표지(격자)는 값만.
    const 표지 = (f, i, 큰, 번호) => {
      const 벌 = 벌목록(f.k);
      const 앞선같은책사 = 이야기.slice(0, i).filter(x => x.k === f.k).length;
      const 파일 = (window.CHAEKSA_ART && 벌.length) ? 얼굴파일(f.k, 벌[(날번호() + 앞선같은책사) % 벌.length]) : '';
      // 새 이야기는 제 썸네일(art/story-*.webp)이 먼저다. 없으면 책사 얼굴로 물러난다.
      // 그림은 보이는 것만 받는다(loading=lazy). 진열대 셋은 첫 화면이라 바로 받고, 격자는 내려올 때 받는다.
      // 백 장이 되면 한 번에 10MB 다. 첫 화면에 필요한 건 열 장 안팎이다(2026-09-12 사장님 「삽화 10개 넘어가서 렉이걸려?」).
      const 받기 = 큰 ? '' : ' loading="lazy" decoding="async"';
      const 그림 = f.썸 ? '<img alt="" src="' + f.썸 + '?v=' + (window.CHAEKSA_ART || 1) + '"' + 받기 + ' onerror="this.remove()">' : '';
      return '<button class="wt-cd" data-fi="' + i + '" data-s="' + esc((f.사이들 || [f.사이]).join('|')) + '" type="button">'
        + '<span class="cd-img">'
        + (파일 ? '<img alt="" src="' + 파일 + '?v=' + window.CHAEKSA_ART + '"' + 받기 + ' onerror="this.remove()">' : '') + 그림
        + '<span class="cd-seal">' + esc(인장of(f.k)) + '</span>'
        + (번호 ? '<span class="cd-num">' + 번호 + '</span>' : '')
        + (f.띠 ? '<span class="cd-tag">' + esc(f.띠) + '</span>' : '')
        + '<b class="cd-t">' + esc(f.제목) + '</b></span>'
        + (큰 ? '<span class="cd-s">' + esc(f.소개) + '</span><span class="cd-free">' + esc(f.띠 + ' · ' + f.값) + '</span>'
              : '<span class="cd-s">' + esc(f.값) + '</span>')
        + '</button>';
    };
    // ① 지금 마음에 걸리는 이야기 — 셋. 무엇이 많이 읽히는지 잰 값이 아직 없어서 날마다 돌린다.
    const 시작 = 날번호() % 이야기.length;
    const 걸리는 = [0, 1, 2].map(j => 이야기[(시작 + j) % 이야기.length]);
    const 위 = '<div class="wt-head"><b>지금 마음에 걸리는 이야기</b><span>' + (짝있음 ? '' : '그 사람 생년월일만 있으면 바로 열려요') + '</span></div>'
      + '<div class="wt-hero">' + 걸리는.map((f, j) => 표지(f, 이야기.indexOf(f), true, j + 1)).join('') + '</div>';
    // ② 어떤 사이가 궁금하세요 + ③ 표지 목록(모바일 3열). 주제별 진열대는 한 사이에 이야기가 셋을 넘으면 세운다 — 지금은 여덟이라 한 격자.
    let h = '<div class="wt-head"><b>어떤 사이가 궁금하세요?</b></div>'
      + '<div class="wt-chips">' + 사이들.map((s, i) => '<button type="button" data-s="' + esc(s) + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(s) + '</button>').join('') + '</div>'
      + '<div class="wt-grid">' + 이야기.map((f, i) => 표지(f, i, false)).join('') + '</div>';
      // 「열다섯 + 더 보기」는 09-13 렉의 진짜 원인(바탕 fixed · 막대 흐림)을 잡은 뒤 걷었다 — 사장님 「접어둔 거 펼쳐줘」. 격자는 다 편다.
    // ④ 전체 목록 — 모든 콘텐츠를 여기서 찾을 수 있게(전략). 이야기 여덟 · 이달 · 무료로 보는 것.
    let 접힘 = {}; try { 접힘 = JSON.parse(localStorage.getItem('chaeksa.fold') || '{}'); } catch (e) {}
    const 무료 = 타일.filter(t => t.tab !== 'geunamja');
    h += '<details class="wt-fold"' + (접힘.all ? ' open' : '') + ' data-fold="all"><summary><b>전체 목록</b>'
      + '<span>이야기 ' + 한글수(이야기.length) + (무료.length ? ' · 무료로 보는 것 ' + 한글수(무료.length) + ' 가지' : '') + '</span></summary>'
      + '<ul class="wt-free">'
      + 이야기.map((f, i) => '<li><button data-fi="' + i + '"><b>' + esc(f.제목) + '</b><span>' + esc(f.사이 + ' · ' + f.값) + '</span></button></li>').join('')
      + 무료.map((t) => '<li><button data-i="' + 타일.indexOf(t) + '"><b>' + esc(t.이름) + '</b>' + (t.말 ? '<span>' + esc(t.말) + '</span>' : '') + '</button></li>').join('')
      + '</ul></details>';
    const top = $('wtTop');
    // 줄기 콘텐츠(docs/41) — 격자 99문. 질문 하나가 콘텐츠 하나. 기존 진열대는 심사 끝날 때까지 그대로 두고 그 아래 세운다.
    try {
      const Q = window.ChaeksaQuestions;
      if (Q && Q.격자) {
        const 전체격자 = Q.격자();
        const 이름표 = { 관계: '썸 · 연애 중 · 재회', 배우자: '결혼', 이별: '이별', 재물: '돈과 생활', 친구: '친구', 직장: '직장', 학습: '시험 · 공부', 가족: '가족', '둘 사이': '우리 둘' };
        const 갈래순 = ['관계', '배우자', '이별', '재물', '친구', '직장', '학습', '가족', '둘 사이'];
        h += '<div class="wt-head" style="margin-top:26px"><b>질문으로 보기</b><span>규칙에서 나온 질문 ' + 전체격자.length + '개</span></div>'
          + '<div class="qg" data-plain="1">' + 갈래순.map(g => {
            const qs = 전체격자.filter(q => q.갈래 === g);
            if (!qs.length) return '';
            return '<details class="qg-g"><summary><b>' + escP(이름표[g] || g) + '</b><span>' + qs.length + '</span></summary><div class="qg-list">'
              + qs.map(q => '<button type="button" class="qg-q' + (q.꼴 === '날 고르기' ? ' day' : '') + '" data-g="' + escP(g) + '" data-k="' + escP(q.결과 || '') + '">' + escP(q.질문) + '</button>').join('')
              + '</div></details>';
          }).join('') + '</div>';
      }
    } catch (e) { try { console.warn('격자 목록 실패:', e); } catch (e2) {} }
    // 출산택일 문 — 지금 돈이 되는 상품인데 홈에는 푸터 링크뿐이었다(2026-09-15 「출산택일의 최적화부터」).
    // 새 상품이 아니라 있는 상품(#taekil 탭)으로 가는 길이라 심사 중 수정 불가 항목(상품 카테고리)에 안 걸린다.
    h += '<div class="wt-head" style="margin-top:26px"><b>출산택일 보고서</b><span>병원에서 받은 날짜, 근거로 검토</span></div>'
      + '<a class="wt-taekil" href="#taekil"><b>후보 기간 전체를 시진 단위로 계산해요.</b><span>부모님 사주와 부딪히는 자리를 거르고, 담당 선생님 수술 시간에 잡히는 자리만 남겨 보고서로 드려요. 시계 몇 시에 잡아야 하는지까지.</span><em><i data-price="taekil">99,000원</i> · 신청하기 →</em></a>';
    if (top) { top.innerHTML = 위; top.classList.remove('hide'); }
    box.innerHTML = h; box.classList.remove('hide');
    const 열기 = (t) => { 본표시(t.id); if (t.sheet) window.현재장 = t.sheet; if (t.story) { window.현재이야기 = t.story; window.현재그사람 = null; window.현재갈래 = t.갈래 || null; window.현재질문 = null; } go(t.tab); if (t.scroll) setTimeout(() => { const el = $(t.scroll); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 260); };
    [top, box].forEach(el => { if (el) el.querySelectorAll('[data-fi]').forEach(b => { b.onclick = () => 열기(이야기[+b.dataset.fi]); }); });
    box.querySelectorAll('.wt-free button[data-i]').forEach(b => { b.onclick = () => 열기(타일[+b.dataset.i]); });
    box.querySelectorAll('.qg-q').forEach(b => { b.onclick = () => {
      const g = b.dataset.g, k = b.dataset.k || null;
      if (g === '둘 사이') { 본표시('gunghap'); go('gunghap'); return; }
      window.현재질문 = { 갈래: g, 결과: k, 질문: b.textContent }; window.현재갈래 = g; window.현재이야기 = null; window.현재그사람 = null;
      본표시('q-' + g + '-' + (k || 'day')); go('story');
    }; });
    // 사이 칩 — 격자를 거른다. 진열대 셋은 안 거른다(지금 마음에 걸리는 것은 사이를 안 탄다).
    box.querySelectorAll('.wt-chips button').forEach(b => { b.onclick = () => {
      box.querySelectorAll('.wt-chips button').forEach(x => x.classList.toggle('on', x === b));
      const s = b.dataset.s;
      box.querySelectorAll('.wt-grid .wt-cd').forEach(c => { c.hidden = !(s === '전체' || c.dataset.s.split('|').indexOf(s) >= 0); });
    }; });
    // 접기 여닫음을 기기에 남긴다.
    box.querySelectorAll('details.wt-fold').forEach(d => { d.ontoggle = () => {
      try { 접힘[d.dataset.fold] = d.open ? 1 : 0; localStorage.setItem('chaeksa.fold', JSON.stringify(접힘)); } catch (e) {}
    }; });
  }
  /** 한 줄. 새화자가 아니면(false) 얼굴 띠를 세우지 않는다. */
  function 발언줄(t, 새화자) {
    t = String(t).trim(); if (!t) return '';
    const m = t.match(발언자류);
    if (!m) return '<p>' + esc(t) + '</p>';
    // 발언 번호(①②③…)가 곧 자리다. 번호가 없는 줄(맺음말)은 0.
    const 자리 = m[1] ? 번호자리(m[1]) : 0;
    // 층 꼬리 ⟪원전|잣대|통설⟫ 는 떼기만 한다. 화면에는 안 나간다(판정키).
    // 서버에 구워 둔 옛 글에 이 꼬리가 들어 있어서, 떼는 일은 계속 해야 한다.
    let 본문 = t.slice(m[0].length);
    const tm = 본문.match(/\s*⟪(원전|잣대|통설)⟫\s*$/); if (tm) 본문 = 본문.slice(0, tm.index);
    return (새화자 === false ? '' : 얼굴띠(m[2], 자리, 받아치는가(본문, m[2])))
      // 번호는 자리(얼굴 변주·맺음 분리)에만 쓰고 화면에는 안 찍는다(2026-09-03 「멘트 칠 때 앞에 번호가 필요한가」).
      // 층별 말끝 바꿔치기는 2026-09-12 에 걷었다 — 문장은 쓴 대로 나간다.
      + '<p class="gm-say">' + esc(본문) + '</p>';
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
  //      원국을 안 올리면 이미 다녀가신 분은 옛 의논에 갇혀 오늘 한 일이 안 보인다.
  // v14 (2026-08-31) — 소현의 갈림 한 줄이 거짓이었다. 이미 조립된 의논에도 그 줄이
  // 굳어 있으므로 원국을 올려 전부 다시 조립시킨다(조립은 공짜다).
  // 대가: LLM 으로 구워 둔 의논이 있는 분은 조립본으로 바뀐다. 개통 전이라 시험판뿐이다.
  // v15 (2026-08-31) — 채점을 들어냈다. 좌장의 맺음말이 채점을 청하고 있어서
  // 이미 조립된 의논에도 그 부탁이 굳어 있다. 원국을 올려 다시 조립시킨다(공짜다).
  // v16 (2026-08-31) — 온서의 기신 문장이 바뀌었다. 감점과 무관한 오행을
  // 대던 것을 실제 원인 글자로 고쳤고, 보좌 빈 칸에서 문장이 사라지던 것도 풀었다.
  // v17 (2026-08-31) — 변주 고르는 법이 바뀌었다(자리별로 독립, 씨앗은 여덟 글자).
  // 이미 조립된 의논은 옛 방식으로 뽑힌 말이라 다시 짠다. 조립기라 공짜다.
  // v19 — 호칭을 걷었다(2026-09-10 · docs/40). 이걸 안 올리면 이미 저장된 의논에
  //       「공주님」이 그대로 남아 화면에 다시 뜬다. 실제로 그랬다.
  const GM_VER = 'v19';   // v18 — 영역관제(docs/27): 존재→위치 · 처방→서술 · 官 네 축
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
    // 조립기 문장은 원국이 바뀌면 다시 짓는다(원가 0). 구운 간명(LLM)은 ⟪층⟫ 꼬리가 없어 여기 안 걸린다 — 아무도 제 것을 잃지 않는다.
    // 2026-09-04 저녁 D2: 정율·온서·형준을 GPT 결로 다시 씀. 옛 조립 문장을 쥔 기기가 그대로 보여 주던 자리.
    const 조립표식 = '⟦조립 D2⟧';
    if (t && t.indexOf('⟪') >= 0 && t.indexOf(조립표식) < 0) t = null;
    if (!t && R && window.ChaeksaDan) {
      try {
        t = ChaeksaDan.의논(R, today);
        if (t) { localStorage.setItem(ck, t + '\n' + 조립표식); t = t; }
      } catch (e) { try { console.warn('의논 조립 실패:', e); } catch (e2) {} t = null; }
    }
    return t ? t.replace('\n' + 조립표식, '') : t;
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
    // 의논 화면(#gmBody · renderGanmyeong)은 2026-09-17 옛것 치우기로 걷었다 — 들어가는 길이 없던 탭이다.
  }
  function 간명말(msg, 재시도) {
    // 홈의 첫 의논 카드(#chongWait·#chongBake)는 걷었다(2026-09-12). 이제 의논 화면(#gmBody)에만 말한다.
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
        // 무료 화면에서는 LLM 을 굽지 않는다(2026-09-12) — 조립을 한 번 더 펴 볼 뿐이다(원가 0).
        el.innerHTML = '<div class="nx-diag"><p>의논을 펴지 못했습니다.</p></div>'
          + '<button class="btn" id="gmBake" style="margin-top:12px">의논 다시 펴기</button>';
        const bb = el.querySelector('#gmBake');
        if (bb) bb.onclick = () => { bb.disabled = true; mountGanmyeong(el, whereTag); };
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
    const parts = text.split(/(?=[①-⑳㉑-㉔])/);
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
    if (홈맛보기) {
      // 「이어서 읽기」 단추를 여기서 안 세운다(2026-09-12). 맛보기는 150px 로 잘려 있어서
      // 이 단추가 잘린 안쪽에 묻혀 있었고, 바깥의 「열 사람의 의논 다 읽기」와 가는 곳이 같았다.
      // 같은 자리로 가는 단추가 둘이면 그게 곧 꼬인 길이다. 바깥 것 하나만 남긴다.
      el.innerHTML = html.join('');
      return;   // 맺음은 홈에서 보이지 않는다 — 다 읽으신 분께만 나오는 말이다
    }
    // 회의를 맺는 말. 채점 알약을 달지 않는다 — 좌장은 판정하지 않고 앉힌다.
    if (맺음글) html.push('<div class="nx-diag gm-close" style="margin-top:16px">' + 발언줄(맺음글) + '</div>');
    // 「다음 물음은 하나 — 그래서 언제인가」 상자는 뺐다(2026-09-04 밤 사장님 「책사단 의논에서 이거 삭제」). 다음 해·언제는 안 판다.
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
  }


  // ── 너의 재물 스토리 — 연애 스토리와 같은 틀, 잣대만 돈 ──
  let msFor = null;

  let dohwaFor = null;


  // ───── 설정 ─────
  // 「비서가 답하는 방식」(깊게·균형·간결하게) 칸은 2026-09-13 에 뺐다(사장님 「빼버려」) —
  // 무료 의논이 LLM 을 안 쓰게 된 뒤로 하는 일이 없고, 유료는 설정과 상관없이 opus 다(ai.js modelFor).
  // 저장된 tier 값은 그대로 두고 안 읽는다.
  // 사용량 상자(오늘 브리핑·책사단의 글·좌장의 원국 해석)는 2026-09-13 에 뺐다 — 사장님 「다 삭제해」. 그 셋을 부르는 문 자체를 지웠다.
  function openSettings() {
    renderCloud();
    const s = AI.settings(); $('apiKey').value = s.apiKey || ''; $('proxyUrl').value = s.proxyUrl || ''; $('settings').classList.remove('hide');
  }
  $('btnSettings').onclick = openSettings;
  // 상단 「로그인」 — 설정 안에 묻혀 있던 로그인을 밖으로(2026-09-15 사장님 「설정에서 로그인을 밖으로 빼줘」).
  // 설정 창을 열고 로그인 칸으로 내려가 이메일 접이를 편다. 로그인돼 있으면 단추는 숨는다(renderCloud).
  const bl = $('btnLogin');
  if (bl) bl.onclick = () => {
    openSettings();
    const box = $('cloudOut'); if (!box) return;
    const fold = box.querySelector('details.mailfold'); if (fold) fold.open = true;
    setTimeout(() => { try { box.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {} }, 50);
  };
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
    // 계절마다 몇 벌인지는 config.js 가 안다. 적힌 게 없으면 그 계절 그림은 없는 것이다 — 부르지 않는다
    // (2026-09-22 — 지운 그림을 「없으면 1벌」로 쳐서 첫 화면마다 404 가 났다).
    const n = (window.CHAEKSA_COUNCIL_VAR && window.CHAEKSA_COUNCIL_VAR[s0]) || 0;
    if (!n) return;
    const i = 날번호() % n;
    const 벌 = i ? '-' + (i + 1) : '';
    // 예전엔 마지막 후보가 love-open 이었다. 그건 **원국이 바뀌기 전** 그림이라
    // (서양 고딕 저택·낯선 남자 얼굴) 첫 화면에 스치기만 해도 세계가 어긋난다.
    // 회의 장면이 없으면 아무것도 안 건다 — 없는 것보다 어긋난 것이 나쁘다.
    const 후보 = ['art/council-' + s0 + 벌 + '.webp?v=' + v];
    if (벌) 후보.push('art/council-' + s0 + '.webp?v=' + v);
    (function 다음(i) {
      if (i >= 후보.length) return;
      const im = new Image();
      im.onload = () => 고르면(후보[i]);
      im.onerror = () => 다음(i + 1);
      im.src = 후보[i];
    })(0);
  }
  // 장면()(첫 의논 카드 위의 회의 그림 한 컷)은 renderChong 과 함께 걷었다(2026-09-12). 회의장면()은 랜딩이 그대로 쓴다.
  // ───── 랜딩 ─────
  function showLanding() {
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    if ($('lpGanji')) $('lpGanji').textContent = f.pillar(tf.day) + '일';   // 09-25 오늘 간지 칸은 첫 화면에서 걷음
    if ($('lpGanjiKo')) $('lpGanjiKo').textContent = f.pillarKo(tf.day) + ' · ' + f.stemElem(tf.day.stem) + '의 날';
    // 첫 화면은 글이 아니라 장면이다 — 오늘의 계절에 맞는 삽화를 깐다.
    // 그림이 없으면 class 를 안 붙여 옛 글자 히어로로 돌아간다(안전한 되돌림).
    // 2026-09-22 — 예전엔 그림이 있는지 보기 전에 scene 부터 붙여서, 그림을 지운 뒤로 첫 화면이 그림 빠진 남색 상자였다.
    // 이제 그림을 **실제로 받은 뒤에만** 장면을 깐다. 그 전까지는 글자 첫 화면이다.
    const hero = $('lpHero');
    if (hero && window.CHAEKSA_ART && !hero.querySelector('.lp-cuts')) {
      회의장면(u => { hero.style.setProperty('--hero-art', 'url("' + u + '")'); hero.classList.add('scene'); });
    }
    // 랜딩의 열 사람 도열(#lpCorps)은 2026-09-12 걷었다.
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
  // 09-25 사장님 「본인 프로필 저장 + 상대 프로필 저장으로 가자, 입구가 여러 개가 되잖아」 —
  // 첫 화면의 궁합 · 정통사주 · 컷씬 칸은 모두 같은 입구(첫 만남 → 그 사람)로 들어와 그 탭으로 간다. ssom.html 따로 폼 없음.
  const 가는곳키 = 'chaeksa.goto';
  function 들어가기(tab) {
    try { sessionStorage.setItem(가는곳키, tab); } catch (e) {}
    if (hasProfile() && profile) { 도착(); return; }
    enterOrLogin();
  }
  function 도착() {
    let tab = null; try { tab = sessionStorage.getItem(가는곳키); sessionStorage.removeItem(가는곳키); } catch (e) {}
    if (!tab || !document.querySelector('.tab[data-tab="' + tab + '"]')) return;
    go(tab);
    // 그 사람이 아직 없으면 바로 그 사람 폼을 연다(궁합 둘)
    if ((tab === 'ssom' || tab === 'chongnon') && People()) { const me = People().active(); if (!People().list().some(p => !me || p.id !== me.id)) setTimeout(() => openPersonForm(null), 250); }
  }
  window.책사들어가기 = 들어가기;
  if ($('btnGunghap')) $('btnGunghap').onclick = () => 들어가기('ssom');
  if ($('btnJeongtong')) $('btnJeongtong').onclick = () => 들어가기('jeongtong');
  document.querySelectorAll('.lp-scene a[data-go]').forEach(a => a.onclick = (e) => { e.preventDefault(); 들어가기(a.dataset.go); });
  try { const g = new URLSearchParams(location.search).get('go'); if (g) { sessionStorage.setItem(가는곳키, g); if (hasProfile() && profile) 도착(); else showForm(); } } catch (e) {}
  // 입력 컷 — 성별을 고르면 그림이 바뀐다(나: ss-me · ss-her / 그 사람: story-jigeum · story-sns)
  const 컷바꾸기 = (sel, cut, 그림) => { const g = $(sel), c = $(cut); if (!g || !c) return; const im = c.querySelector('img'), 새 = 'art/' + (그림[g.value] || 그림.F) + '-s.webp'; if (im.getAttribute('src') !== 새) { im.style.opacity = 0; setTimeout(() => { im.src = 새; im.style.opacity = 1; }, 150); } };
  if ($('g')) { $('g').addEventListener('change', () => 컷바꾸기('g', 'fcCut', { M: 'ss-me', F: 'ss-her' })); 컷바꾸기('g', 'fcCut', { M: 'ss-me', F: 'ss-her' }); }
  if ($('pfG')) $('pfG').addEventListener('change', () => 컷바꾸기('pfG', 'pfCut', { M: 'story-jigeum', F: 'story-sns' }));
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
  // 「아니요」를 누른 로그인(cloud.js hold 'no')을 설정 창과 묻는 창에서 같은 말로 적는다.
  const 안주고받음 = '이 계정과 이 기기는 서로 주고받지 않아요(로그아웃하면 풀려요).';
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
    if ($('btnLogin')) $('btnLogin').classList.toggle('hide', inn);
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
      const 보류 = C.uploadHold ? C.uploadHold() : null;
      $('cloudWhen').textContent = (at && !보류 ? ' · 마지막 동기화 ' + new Date(at).toLocaleString('ko-KR') : '')
        + (보류 === 'no' ? ' · ' + 안주고받음 : 보류 === 'ask' ? ' · 이 계정에 저장할지 아직 안 골랐어요. 「지금 동기화」를 누르면 다시 여쭤봐요.' : '');
    }
  }
  // ── 이 기기 사주를 이 계정에 저장할까 (2026-09-22 둘째 묶음 · 셋째에 고침) ──
  // 이 기기에서 시작하지 않은 로그인(메일 링크를 메일 앱 안 브라우저에서 연 경우 등)은 cloud.js 가 토큰은 받되 hold 'ask' 를 단다.
  // 동기화 전에 여기서 묻는다 — 이 기기가 비어 있어도 묻는다(비어 있다고 풀면 뒤에 넣는 생년월일이 그 계정으로 올라간다).
  // 저장하기 → 예전처럼 동기화(받고 올림). 아니요 → 로그인만 남기고 이 계정과 이 기기는 서로 주고받지 않는다(받지도 올리지도 않음).
  // 묻기 전에 원국·사람을 저장하면 cloud.js pushSoon 이 이 창을 부른다(onAskUpload).
  function 올릴지묻기(showMsg) {
    const C = Cloud(); if (!C) return;
    let m = $('uploadAsk');
    if (!m) {
      m = document.createElement('div');
      m.className = 'modal'; m.id = 'uploadAsk';
      m.style.zIndex = '12';
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'uaTitle');
      m.innerHTML = `<div class="sheet">
        <h3 id="uaTitle">이 계정에 저장할까요?</h3>
        <p class="hint" style="margin:0 0 8px">로그인한 계정 — <b id="uaWho">확인하는 중…</b></p>
        <p class="hint" style="margin:0 0 8px" id="uaWhat"></p>
        <p class="hint" style="margin:0 0 8px">이 기기에서 시작한 로그인이 아니라서 한 번 여쭤봐요. 내 계정이 맞으면 저장하세요.
          이 계정에 있던 사주도 이 기기로 받아 와요.</p>
        <p class="hint" style="margin:0 0 14px">내 계정이 아니면 「아니요」를 누르세요. 로그인은 그대로 두지만, ${안주고받음}</p>
        <button class="btn" id="uaYes">저장하기</button>
        <button class="btn ghost" id="uaNo">아니요</button>
      </div>`;
      document.body.appendChild(m);
    }
    // 이 기기에 있는 사람 이름을 보여 준다 — 내 것인지 알아보게. 다섯까지만 적고 나머지는 「외 N명」.
    const l = C.localStuff ? C.localStuff() : { 이름: [], 사람: 0 };
    const 이름 = (l.이름 && l.이름.length) ? l.이름 : [l.원국이름 || (l.원국 ? '내 원국' : '')].filter(Boolean);
    const 남은 = Math.max(0, Math.max(l.사람 || 0, 이름.length) - 5);
    $('uaWhat').innerHTML = (l.원국 || l.사람)
      ? '이 기기에 있는 사주 — <b>' + esc(이름.slice(0, 5).join(' · ') || '사주') + '</b>' + (남은 ? ' 외 ' + 남은 + '명' : '') + '. 저장하면 이 계정에 올라가요.'
      : '이 기기에는 아직 넣은 사주가 없어요. 저장하면 앞으로 넣는 사주가 이 계정에 저장돼요.';
    const 누구 = () => {
      const em = C.email();
      $('uaWho').textContent = em || '이메일이 없는 계정(카카오 등)';
      $('uaTitle').textContent = em ? em + ' 계정에 저장할까요?' : '이 계정에 저장할까요?';
    };
    if (C.email()) 누구();
    else C.me().then(누구).catch(() => { $('uaWho').textContent = '확인하지 못했어요'; });
    const 답 = (yes) => {
      C.answerUpload(yes);
      m.classList.add('hide');
      if (yes) { cloudSync(!!showMsg); return; }   // 설정의 「지금 동기화」에서 왔으면 끝난 뒤 한 줄을 띄운다
      // 아니요 — 받지도 올리지도 않는다. 여기서 cloudSync 를 다시 부르면 「지금 동기화」 길에서 이 창이 또 뜬다.
      복귀대기 = false;
      renderCloud();
      if (showMsg) cloudMsg(안주고받음, true);
    };
    if ($('uaYes')) $('uaYes').onclick = () => 답(true);
    if ($('uaNo')) $('uaNo').onclick = () => 답(false);
    m.classList.remove('hide');
  }
  async function cloudSync(showMsg) {
    const C = Cloud(); if (!C || !C.signedIn()) return;
    // 묻기 전에는 받지도 올리지도 않는다. 「저장하기」를 받으면 여기로 다시 온다(복귀대기는 그때 쓴다).
    // 「아니요」를 누른 계정 — 앱을 열 때는 조용히 넘어가고, 설정의 「지금 동기화」를 누르면 다시 물어 마음을 바꿀 수 있게 한다.
    const 보류 = C.uploadHold ? C.uploadHold() : null;
    if ((C.mustAskUpload && C.mustAskUpload()) || (보류 === 'no' && showMsg)) {
      if (showMsg) cloudMsg('');
      올릴지묻기(showMsg);
      return;
    }
    if (보류) { 복귀대기 = false; renderCloud(); return; }
    try {
      if (showMsg) cloudMsg('동기화 중…');
      const r = await C.pull();   // 서버 것과 병합 (더 최신인 쪽이 남는다)
      await C.push();             // 병합 결과를 다시 올린다
      renderCloud();
      if (showMsg) cloudMsg('동기화했습니다.', true);
      if (r.changed) {
        const saved = localStorage.getItem(KEY);
        if (saved) { try { start(JSON.parse(saved)); } catch (e) {} }
        // start() 는 홈으로 간다 — 결제하려다 로그인하고 막 돌아온 손님은 그 장으로 한 번 더 보낸다.
        if (복귀대기) { try { goHash(true); 복귀고르기(); } catch (e) {} }
      }
    } catch (e) { if (showMsg) cloudMsg('동기화 실패: ' + e.message); }
    복귀대기 = false;
  }
  function wireCloud() {
    const C = Cloud(); if (!C || !C.enabled()) { renderCloud(); return; }
    // 이 기기에서 시작하지 않은 로그인인데 아직 안 물었으면, 원국·사람을 처음 저장하는 순간(pushSoon) 묻는다.
    if (C.onAskUpload) C.onAskUpload(() => 올릴지묻기(false));
    const bk = $('btnKakao'), bg = null /* 구글 로그인 삭제(2026-09-15 사장님) */, bm = $('btnMail'),
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
    // 비밀번호 로그인 — 심사관 테스트 계정용(2026-09-15, 토스 FAQ 10). 위 이메일 칸 + 비밀번호 칸.
    const bpw = $('btnPw');
    if (bpw) bpw.onclick = async () => {
      const v = $('loginEmail').value.trim(), pw = $('loginPw').value;
      if (!v) { $('loginEmail').focus(); return; }
      if (!pw) { $('loginPw').focus(); return; }
      cloudMsg('로그인 중…');
      try { await C.signInWithPassword(v, pw); location.reload(); }
      catch (e) { cloudMsg(e.message); }
    };
    if (bs) bs.onclick = () => cloudSync(true);
    if (bo) bo.onclick = () => { C.signOut(); renderCloud(); cloudMsg('로그아웃했습니다.'); };
    const bp = $('btnPurge');
    if (bp) bp.onclick = async () => {
      if (!confirm('서버에 저장된 원국·등록하신 사람들 정보와 계정을 모두 지웁니다.\n되돌릴 수 없습니다. 계속할까요?')) return;
      if (!confirm('정말 삭제하시겠습니까? 마지막 확인입니다.')) return;
      cloudMsg('삭제 중…');
      // 09-22 이 기기에서 시작하지 않은 로그인(hold)이면 이 기기 사주는 그 계정에 올라간 적이 없다 — 계정만 지우고 기기 것은 둔다
      const 보류중 = C.uploadHold ? C.uploadHold() : null;
      try {
        await C.deleteAccount();
        if (보류중) { C.signOut(); alert('그 계정을 지웠습니다. 이 기기에 넣어 둔 사주는 그대로 두었습니다.'); location.href = location.pathname; return; }
        [KEY, PKEY, 'chaeksa.consults'].forEach(k => localStorage.removeItem(k));
        Object.keys(localStorage).filter(k => k.startsWith('chaeksa.')).forEach(k => localStorage.removeItem(k));
        alert('모두 삭제했습니다.');
        location.href = location.pathname;
      } catch (e) { cloudMsg('삭제 실패: ' + e.message); }
    };
    renderCloud();
  }

  // 아침 푸시 알림은 2026-09-14 걷었다 — 오늘 탭이 없으니 알릴 것이 없다(사장님). 서버 크론(api/push.js)·VAPID 키·설정 줄도 함께.

  // ───── PWA ─────
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

  // ───── 시작 ─────
  // 로그인 후 돌아온 경우 토큰을 먼저 받아둔다
  if (window.ChaeksaCloud && ChaeksaCloud.enabled()) {
    const came = ChaeksaCloud.captureRedirect();
    if (came) ChaeksaCloud.me().catch(() => {});
    // 출산택일 신청 페이지에서 로그인하러 떠난 손님이 여기(첫 화면)로 떨어졌으면 제자리로 돌려보낸다.
    // Supabase 는 허용 목록에 없는 복귀 주소를 받으면 사이트 첫 주소로 보낸다 — 그러면 신청하던 사람이
    // 앱 첫 화면에서 길을 잃는다(2026-09-11). 같은 사이트의 짧은 .html 경로만, 10분 안의 것만 따른다
    // (오래 남은 표시가 나중의 딴 로그인을 끌고 가지 않게 — 신청 페이지는 열릴 때마다 표시를 지운다).
    // 9,900원 장의 결제 단추에서 로그인하러 떠난 손님은 해시(#sheet-ibyeol · #maeum 꼴)를 남긴다 — 그 장으로 돌려보낸다
    // (2026-09-22 점검). 해시는 앱의 탭 이름 꼴만 따른다.
    if (came) {
      try {
        const 돌아갈 = JSON.parse(localStorage.getItem('chaeksa.return') || 'null');
        localStorage.removeItem('chaeksa.return');
        const 새것 = !!돌아갈 && Date.now() - (돌아갈.at || 0) < 10 * 60 * 1000;
        const 해시 = 새것 && /^#[a-z][\w-]*$/.test(돌아갈.hash || '') ? 돌아갈.hash : '';
        if (새것 && /^\/[\w.-]+\.html$/.test(돌아갈.path || '') && 돌아갈.path !== location.pathname) {
          location.replace(돌아갈.path + 해시);
        } else if (해시) {
          history.replaceState(null, '', location.pathname + location.search + 해시);   // 아래 goHash 가 이 장을 연다
          if (Array.isArray(돌아갈.pick)) 복귀고름 = 돌아갈.pick;
          복귀대기 = true;
        }
      } catch (e) {}
    }
  }
  wireCloud();
  // 로그인이 안 됐으면 조용히 두지 않는다 — 로그인 창을 열고 까닭을 적는다(2026-09-22 점검).
  //  · 토큰 값이 비어 받지 못했을 때(cloud.js refusedLogin). 이 기기에서 시작하지 않은 로그인은 이제 받는다 — 올릴지는 따로 묻는다(올릴지묻기).
  //  · Supabase 가 #error=…&error_code=… 을 붙여 돌려보냈을 때 — 메일 링크가 만료됐거나 이미 쓴 링크, 카카오에서 취소 등.
  try {
    const 오류 = (function () {
      const 있나 = (s) => /(^|&)error(_code)?=/.test(s);
      const h = (location.hash || '').replace(/^#/, ''), s = (location.search || '').replace(/^\?/, '');
      const 곳 = 있나(h) ? h : 있나(s) ? s : null;
      if (곳 == null) return null;
      const q = new URLSearchParams(곳);
      return { code: q.get('error_code') || '', err: q.get('error') || '', 해시: 곳 === h };
    })();
    if (오류) {
      // 오류 꼬리는 주소에서 치운다 — 해시면 아래 goHash 가 탭 이름으로 읽지 않게
      history.replaceState(null, '', location.pathname + (오류.해시 ? location.search : location.hash));
      openSettings();
      cloudMsg(오류.code === 'otp_expired'
        ? '메일 로그인 링크가 만료됐거나 이미 쓴 링크예요. 여기서 링크를 다시 받아 주세요.'
        : '로그인을 마치지 못했어요. 여기서 다시 로그인해 주세요.');
    } else if (window.ChaeksaCloud && ChaeksaCloud.refusedLogin && ChaeksaCloud.refusedLogin()) {
      openSettings();
      cloudMsg('로그인을 마치지 못했어요. 여기서 다시 로그인해 주세요.');
    }
  } catch (e) {}

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
  복귀고르기();           // 결제하려다 로그인하러 떠났으면 그때 고른 사람을 다시 고른다
  // 서버에 저장된 게 있으면 가져온다 (없으면 조용히 넘어간다)
  if (window.ChaeksaCloud && ChaeksaCloud.signedIn()) cloudSync(false);
})();
