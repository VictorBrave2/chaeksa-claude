/* 책사 앱 UI v1 */
(function () {
  'use strict';
  // AI 는 window. 로 읽는다(10-02 멈춤 안전장치) — ai.js 하나를 못 받으면 예전엔 이 줄에서 앱 전체가 섰다.
  // 지금 ai.js 를 쓰는 곳은 걷은 기능과 개발용 설정 칸뿐이라, 없으면 그 칸만 비고 나머지는 그대로 돈다.
  // 10-02 개편 3묶음 — ai.js 는 이제 처음에 받지 않는다(탭별 꾸러미 ai · sheet · gunghap). 그래서 부를 때마다 읽는다(AI()).
  const E = ChaeksaEngine, f = E.fmt, AI = () => window.ChaeksaAI || null;
  const $ = (id) => document.getElementById(id);
  const KEY = 'chaeksa.profile', PKEY = 'chaeksa.partners';
  // let 이다 — 앱을 열어둔 채 날이 바뀔 수 있다. 오늘·달력 탭에 들어올 때 다시 읽는다.
  let today = new Date();
  let profile = null, R = null;
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

  // 화면으로 나가는 마지막 문 — 십신·격 이름을 공주님말로 바꾼 뒤 이스케이프한다(2026-09-04 「보이지 않는 심장」).
  const 공말 = (s) => (window.ChaeksaDan && ChaeksaDan.공주님말) ? ChaeksaDan.공주님말(s) : s;
  const esc = (s) => 공말(String(s == null ? '' : s)).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  // 십신을 이름 그대로 내는 자리(이야기 화면 · 오늘 한마디)는 이걸로 — esc() 는 공주님말을 거쳐서 「상관」이 「튀는 재주」로 바뀐다.
  // 2026-09-12 이야기 화면에서 「튀는 재주 오는 날 = 말이 세게 나가요」가 나가고서야 알았다. 화면 감시자 면제(data-plain)만으로는 안 된다.
  const escP = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));


  // ───── 테마: 하루의 리듬 ─────
  // 10-02 index.html 머리 스크립트가 같은 규칙으로 처음 화면부터 낮/밤을 정해 둔다(밤에 흰 화면이 번쩍이던 것). 규칙을 바꾸면 둘을 같이.
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


  // 이름 없이 넣은 사람을 부르는 말 — 「나」는 「나」로 넣은 사람뿐, 그 밖은 관계(그 사람 · 연인 …). 10-02 전에는 이름 없는 그 사람도 「나」로 불렀다.
  const 이름없을때 = (p) => (p && !p.isSelf && p.relation && p.relation !== '나') ? p.relation : '나';
  function renderPeopleBtn() {
    const btn = $('btnPerson'); if (!btn || !People()) return;
    const p = People().active();
    btn.classList.toggle('hide', !p);
    if (p) $('personName').textContent = 사람이름(p.name) || 이름없을때(p);
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
          <b>${esc(사람이름(p.name) || 이름없을때(p))}</b>
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

  // ───── 사람 칸을 무엇을 하러 여나(10-02 생년월일은 필요한 만큼만) ─────
  // 콘텐츠로 들어오다 이 칸이 뜨면, 맨 위에 그 콘텐츠 이름과 필요한 것(상품 약속 장부 필요 칸)을 띄우고 말풍선 · 저장 단추 말을 맞춘다.
  //   누구 'them' = 그 사람 생년월일(사용설명서 · 궁합) · 'me' = 내 생년월일(그 사람만 넣어 둔 손님이 내 것이 필요한 콘텐츠로 갈 때).
  //   길이 있으면(들어가기가 연 것) 관계 칸은 숨기고, 저장하면 고른 탭으로 간다(도착). 길 없이 열면(궁합 탭의 「그 사람 넣기」 등) 저장 뒤 지금처럼 그 탭이 다시 그린다.
  let 사람폼길 = null, 사람폼누구 = null;
  const 사람폼처음 = {};
  function 사람폼모양(m) {
    const say = $('pfSay'), why = $('pfWhy'), rel = $('pfRelWrap'), agree = $('pfAgree'), save = $('pfSave'), nm = $('pfName');
    if (사람폼처음.say == null) { 사람폼처음.say = say ? say.textContent : ''; 사람폼처음.save = save ? save.textContent : '저장'; 사람폼처음.ph = nm ? nm.placeholder : ''; }
    사람폼길 = null; 사람폼누구 = m ? m.누구 : null;
    if (say) say.textContent = (m && m.말) || 사람폼처음.say;
    if (why) {
      why.classList.toggle('hide', !(m && m.이름));
      if (m && m.이름) { $('pfWhyN').textContent = m.이름; $('pfWhyS').textContent = m.필요 ? '필요한 것 — ' + m.필요 : ''; }
    }
    if (rel) rel.classList.toggle('hide', !!(m && m.길));
    if (agree) agree.classList.toggle('hide', 사람폼누구 === 'me');   // 「그 사람 동의를 받고」는 내 생년월일에는 맞지 않는다
    if (save) save.textContent = (m && m.단추) || 사람폼처음.save;
    if (nm) nm.placeholder = 사람폼누구 === 'me' ? '예: 지수' : 사람폼처음.ph;
  }
  // 누구 · 탭 · 길(true = 저장하면 그 탭으로) — 사람 목록(people.js)이 없으면 false(부르는 쪽이 옛 길로 간다).
  function 사람폼열기(누구, tab, 길) {
    if (!People()) return false;
    const Y = window.ChaeksaYaksok, 머리 = Y && Y.입력머리 ? Y.입력머리(tab) : null, 말 = Y && Y.입력단추 ? Y.입력단추(tab) : null;
    // 그 사람 칸의 「필요한 것」 — 장부 필요가 그 사람 것으로 시작하면(사용설명서) 그대로, 두 사람 콘텐츠(궁합)면 지금 넣는 그 사람 것만.
    const 필요 = !머리 ? '' : 누구 === 'me' ? 머리.필요 : /^그 사람/.test(머리.필요 || '') ? 머리.필요 : '그 사람 생년월일시';
    openPersonForm(null, {
      누구, 길: !!길, 이름: 머리 && 머리.이름, 필요, 표지: 누구 === 'me' && window.ChaeksaHomeCats && ChaeksaHomeCats.표지 ? ChaeksaHomeCats.표지(tab) : null,
      말: 누구 === 'me' ? '내 생년월일시를 넣어 주세요. 이건 내 것으로 만들어요.' : '그 사람은 언제 태어났어요? 그 사람 생년월일시 하나면 돼요.',
      // 저장 단추 — 장부 입력단추(사용설명서 「저장하고 사용설명서 보기」 · 연애 「저장하고 예시 보기」). 「다음 — 그 사람 …」은 이 칸에 맞지 않아 「저장하고 보기」.
      단추: (길 && 말 && !/^다음/.test(말)) ? 말 : '저장하고 보기',
    });
    사람폼길 = 길 ? { 누구, tab } : null;
    return true;
  }
  // 길을 들고 연 칸을 그만둘 때(취소 · 폰 「뒤로」) — 들고 있던 갈 곳도 내려놓는다(입력접기와 같은 까닭).
  function 사람폼그만() {
    if (!사람폼길) return;
    사람폼길 = null;
    try { sessionStorage.removeItem('chaeksa.goto'); sessionStorage.removeItem('chaeksa.gotoSpot'); } catch (e) {}
  }

  function openPersonForm(id, 모양) {
    const P = People(); if (!P) return;
    editingId = id || null;
    const p = id ? P.get(id) : null, 나칸 = !!(모양 && 모양.누구 === 'me');
    $('pfTitle').textContent = p ? '사람 정보 고치기' : '사람 추가';
    $('pfRel').innerHTML = P.RELATIONS.map(r => `<option value="${r}">${r}</option>`).join('');
    if ($('pfPlace') && window.ChaeksaPlaces) $('pfPlace').innerHTML = ChaeksaPlaces.options();
    const b = p ? p.birth : {};
    $('pfName').value = p ? p.name : '';
    // 10-02 누구 것인지 정해서 열면(사람폼열기) 관계도 그대로 — 처음 넣는 사람이라고 「나」로 두지 않는다(people.js add 머리말)
    $('pfRel').value = p ? p.relation : 모양 ? (나칸 ? '나' : '그 사람') : (P.list().length ? '그 사람' : '나');
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
    // 09-25 새 사람은 내 반대 성별이 기본. 10-02 내 생년월일 칸(나칸)은 첫 입력 칸(#g)처럼 여성이 먼저 — 지금 보는 사람이 그 사람이라 반대로 두면 틀린다.
    $('pfG').value = b.gender || (나칸 ? 'F' : (profile && profile.gender === 'M' ? 'F' : 'M'));
    if (나칸) { const im = $('pfCut') && $('pfCut').querySelector('img'); if (im) { im.style.opacity = 1; im.src = 모양.표지 || 'art/love-main.webp'; } }   // 내 칸 그림 = 고른 콘텐츠 표지(원본)
    else { try { 컷바꾸기('pfG', 'pfCut', { M: 'jt-13-heart-m', F: 'jt-13-heart-f' }); } catch (e) {} }
    $('pfGUnknown').checked = !!b.genderUnknown;
    $('pfG').disabled = $('pfGUnknown').checked;
    if ($('pfPlace')) $('pfPlace').value = b.place || 'KR:서울';
    // 10-02 태어난 곳은 접어 둔다(「더 정확하게(선택)」). 서울이 아닌 사람을 고칠 때만 펼쳐서 보여 준다.
    if ($('pfMore') && $('pfPlace')) $('pfMore').open = !!$('pfPlace').value && $('pfPlace').value !== 'KR:서울';
    $('pfDelete').classList.toggle('hide', !p || P.list().length <= 1);
    사람폼모양(모양 || null);
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
    return r && !r.error ? r : { error: (r && r.error) || '이 음력 날짜는 양력으로 바꿀 수 없어요. 다시 확인해 주세요.' };
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
    if (!sol) { alert('생년월일을 넣어 주세요.'); return; }
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
      // 10-02 「나」는 관계가 「나」일 때만 — 전에는 첫 사람이면 무조건 「나」라, 사용설명서에 그 사람부터 넣으면 그 사람이 「나」가 됐다.
      pendingPick = P.add({ name, relation: rel, isSelf: rel === '나', birth });
      try { window.ChaeksaTrack && ChaeksaTrack.event && ChaeksaTrack.event('profile'); } catch (e) {}   // 깔때기 ② 생년월일 넣음
    }
    const 길 = 사람폼길; 사람폼길 = null;   // 10-02 콘텐츠로 들어오다 연 칸(사람폼열기)
    $('personForm').classList.add('hide');
    $('peopleSheet').classList.add('hide');
    if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
    const 새 = pendingPick;   // renderPartners 가 비우기 전에 붙잡는다
    // 10-02 그 사람만 넣어 두었던 손님이 내 생년월일을 넣었으면 이제 나를 보는 사람으로 세운다. 사용설명서로 넣은 그 사람은 사용설명서가 고를 사람으로.
    if (길 && 새) {
      if (길.누구 === 'me') P.setActive(새);
      else if (길.tab === 'pair') { try { localStorage.setItem('chaeksa.pair.pick', JSON.stringify(새)); } catch (e) {} }
    }
    if (!R || (길 && 길.누구 === 'me') || (editingId && editingId === P.activeId())) start(P.toProfile(P.active()));
    else { renderPeopleBtn(); renderPartners(); renderHome(); }
    // 상담 장이 열려 있으면 고르기도 바로 갱신한다(2026-09-04 밤 점검 「입력했는데 안 된다」).
    // (이 남자 · 그 사람 마음 · 이야기 탭은 09-26 걷었다 — 그 탭들을 다시 그리던 줄은 10-02 개편 3묶음에서 지웠다)
    try { renderGunghap(); renderSheet();
      ['ghPick', 'shPick'].forEach(id => { const e = $(id); if (e && 새 && [...e.options].some(o => o.value === 새)) e.value = 새; });
    } catch (e) {}
    try {
      // 궁합총론 탭에서 넣은 사람은 곧 그 사람이다 — 첫 사람이어도 바로 그린다. 고친 사람이면 새 생년월일로 다시 그린다.
      if (document.querySelector('.tab[data-tab="chongnon"]:not(.hide)')) { if (새) 궁합고르기(새); renderChongnon(); }
      if (document.querySelector('.tab[data-tab="ssom"]:not(.hide)')) { if (새) 궁합고르기(새); renderSsom(); }
      // 행동양식 궁합 탭에서 넣은 사람은 곧 그 사람이다(10-01)
      if (document.querySelector('.tab[data-tab="pair"]:not(.hide)') && window.ChaeksaPairView) { if (새) { try { localStorage.setItem('chaeksa.pair.pick', JSON.stringify(새)); } catch (x) {} } ChaeksaPairView.그리기($('pairBox'), profile); }
    } catch (e) {}
    // 10-02 콘텐츠로 들어오다 연 칸이면 저장한 뒤 그 탭으로 간다(들어가기가 적어 둔 갈 곳 — 도착)
    if (길) { try { 도착(); } catch (e) {} }
  }

  function wirePeople() {
    if (!People()) return;
    $('btnPerson').onclick = openPeople;
    $('btnClosePeople').onclick = () => $('peopleSheet').classList.add('hide');
    $('btnAddPerson').onclick = () => openPersonForm(null);
    $('pfCancel').onclick = () => { $('personForm').classList.add('hide'); 사람폼그만(); };
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
      note.innerHTML = `사주는 시계가 아니라 해를 기준으로 봐요. ${p.name}에서는 해 시각이 시계보다 <b>${Math.abs(diff)}분 ${diff < 0 ? '늦어요' : '빨라요'}</b>. 그래서 1시 · 3시 · 5시처럼 홀수 시 정각 가까이 태어났다면 사주가 달라질 수 있어요.`;
    } else {
      note.classList.remove('hide');
      note.innerHTML = `${p.name} 시계(UTC${p.tzOffset >= 0 ? '+' : ''}${p.tzOffset})로 계산해요. <b>태어난 때 서머타임 중이었다면</b> 태어난 시각에서 1시간을 빼고 넣어 주세요.`;
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
    return r && !r.error ? r : { error: r && r.error ? r.error : '이 음력 날짜는 양력으로 바꿀 수 없어요. 다시 확인해 주세요.' };
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
    if (!sol) { alert('생년월일을 넣어 주세요.'); return null; }
    if (sol.error) { alert(sol.error); return null; }
    const p = { name: $('name').value.trim(), year: sol.y, month: sol.m, day: sol.d,
      calendar: calMode, lunarInput: calMode === 'lunar' ? { y: +$('y').value, m: +$('m').value, d: +$('d').value, leap: $('isLeap').checked } : null,
      hour: noTime ? null : ($('hh').value === '' ? null : +$('hh').value), minute: noTime ? 0 : +($('mi').value || 0),
      gender: $('g').value, solarCorrection: $('solar').checked };
    const pl = window.ChaeksaPlaces ? ChaeksaPlaces.resolve($('place').value) : null;
    if (pl) { p.place = $('place').value; p.placeName = pl.name; p.longitude = pl.lon; p.tzOffset = pl.tzOffset; }
    if (!p.year || !p.month || !p.day) { alert('생년월일을 넣어 주세요.'); return null; }
    if (p.year < 1900 || p.year > 2100 || p.month < 1 || p.month > 12 || p.day < 1 || p.day > 31) { alert('날짜를 다시 확인해 주세요.'); return null; }
    return p;
  }
  $('btnGo').onclick = () => {
    const p = readForm(); if (!p) return;
    localStorage.setItem(KEY, JSON.stringify(p));
    localStorage.setItem('chaeksa.profileAt', new Date().toISOString());
    // 10-02 화면마다 주소 — 입력 칸 주소(#form)를 갈 곳 주소로 바꿔 쓴다(새로 쌓지 않는다). 저장한 뒤 「뒤로」를 눌러도 입력 칸이 다시 뜨지 않는다.
    const 전방식 = 주소방식; 주소방식 = 'replace';
    try {
      if (People()) {
        const id = People().add({ name: p.name, relation: '나', isSelf: true, birth: p });
        People().setActive(id);
        start(People().toProfile(People().active()));
      } else start(p);
      if (window.ChaeksaCloud) ChaeksaCloud.pushSoon();
      try { 도착(); } catch (e) {}   // 09-25 첫 화면에서 고른 탭으로
    } finally { 주소방식 = 전방식; }
    // 갈 곳 없이 홈에 섰고 입력 칸이 처음 화면 위에 쌓인 것이었으면 한 칸 되돌린다 — 「뒤로」 한 번에 같은 홈이 또 나오지 않게.
    try { const s = history.state; if (주소켜짐 && 보인주소 === '' && s && s.책사 && s.앞 === '') history.back(); } catch (e) {}
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
  // 출산택일 탭 맨 위 두 문(10-02) — 지금 연 칸을 이 탭(sessionStorage)에 적어 두는 이름 · 처음 여는 칸을 정했나 · 다른 곳에서 「보고서 신청」으로 들어올 때 열 칸.
  // go() 가 택일문달기()를 부르니 go() 보다 위에 둔다(TDZ). 칸 규칙은 아래 택일문달기 옆 주석.
  const 택일칸키 = 'chaeksa.tkDoor';
  let 택일칸정함 = false, 택일원함 = null;

  // 홈은 보던 자리를 기억한다 (2026-09-12 사장님 「콘텐츠 들어갔다가 뒤로가면 스크롤 다시
  // 내려야하는게 너무 불편해」). 표지를 눌러 들어갔다 「← 홈」 으로 돌아오면 그 표지 앞에 선다.
  // **홈 하나만** 기억한다 — 다른 화면은 사람이나 장이 바뀌면 길이도 바뀌어서 옛 자리가 엉뚱한 데다.
  let 홈자리 = 0;
  const 지금자리 = () => window.scrollY || document.documentElement.scrollTop || 0;
  const 열린탭 = () => { const el = document.querySelector('.tab:not(.hide)'); return el ? el.dataset.tab : ''; };

  // ───── 화면마다 주소 (10-02) ─────
  // 전에는 탭을 옮겨도 주소가 그대로라, 폰 「뒤로」를 누르면 사이트를 나가 네이버 블로그로 돌아갔다. 보던 화면 주소를 카톡에 보낼 수도 없었다.
  // 이제 화면을 열 때마다 주소 끝에 #탭이름 을 남긴다(홈 · 첫 화면은 꼬리 없음, 입력 칸은 #form). 「뒤로」 · 「앞으로」는 주소따라가기()가 그 화면을 다시 연다.
  //  · 주소방식 — push(한 칸 쌓는다 · 보통) · replace(지금 칸을 바꿔 쓴다 · 입력 칸에서 저장할 때) · none(주소를 안 건드린다 · 「뒤로」를 따라 열 때, 서버에서 받아 다시 그릴 때).
  //  · 부팅 중(주소켜짐 false)에는 주소를 안 건드린다 — 결제 복귀(#sheet-…) · 로그인 복귀 해시를 파일 끝 goHash 가 읽어야 한다. 다 선 뒤 주소시작()이 켠다.
  //  · 쌓을 때 상태(history.state)에 앞 화면(앞)을 적는다. 「← 홈」 · 아래 메뉴 · 로고가 바로 앞 화면으로 가는 것이면 새로 쌓지 않고 한 칸 되돌린다(돌아가기) — 홈 ↔ 탭을 오갈수록 「뒤로」가 길어지지 않게.
  let 주소켜짐 = false, 주소방식 = 'push', 보인주소 = null;
  // 주소 꼬리 → 화면 이름. '' = 홈(사람이 없으면 첫 화면) · 'form' = 입력 칸 · 그 밖은 탭 이름. 모르는 꼬리(#jtCh3 같은 칸 이동 · 로그인 꼬리)는 null.
  function 경로(hash) {
    let t = String(hash || '').replace(/^#/, '');
    if (/^sheet-[a-z]+$/.test(t)) t = 'sheet';
    if (!t || t === 'home' || t === 'gacha' || t === 'today') return '';
    if (t === 'form') return 'form';
    return /^[a-z][\w-]*$/.test(t) && document.querySelector('.tab[data-tab="' + t + '"]') ? t : null;
  }
  function 주소(r) {
    const 바닥 = location.pathname + location.search;
    if (!r) return 바닥;
    if (r === 'sheet' && window.현재장) return 바닥 + '#sheet-' + window.현재장;
    return 바닥 + '#' + r;
  }
  const 앞칸 = () => (history.state && history.state.책사) ? history.state.앞 : null;
  function 주소남기기(r) {
    if (r == null || r === 보인주소) return;
    const 앞 = 보인주소; 보인주소 = r;
    if (!주소켜짐 || 주소방식 === 'none') return;
    try {
      if (주소방식 === 'replace') history.replaceState({ 책사: 1, 앞: 앞칸() }, '', 주소(r));
      else history.pushState({ 책사: 1, 앞: 앞 }, '', 주소(r));
    } catch (e) {}
  }
  function 주소없이(fn) { const 전 = 주소방식; 주소방식 = 'none'; try { fn(); } finally { 주소방식 = 전; } }
  // 주소가 보이는 화면과 다르면 지금 칸을 바꿔 쓴다(새로 쌓지 않는다).
  function 주소맞추기() {
    if (!주소켜짐 || 보인주소 == null || 경로(location.hash) === 보인주소) return;
    try { history.replaceState({ 책사: 1, 앞: 앞칸() }, '', 주소(보인주소)); } catch (e) {}
  }
  // 사람이 누른 「← 홈」 · 아래 메뉴 · 로고 · 입력 칸 「← 홈」. 가려는 화면이 바로 앞 칸이면 한 칸 되돌린다(새로 쌓지 않는다).
  function 돌아가기(tab) {
    const r = 경로('#' + tab);
    if (주소켜짐 && 주소방식 === 'push' && r != null && r !== 보인주소 && 앞칸() === r) {
      주소없이(() => go(tab));
      try { history.back(); } catch (e) {}   // 돌아온 칸은 이미 보이는 화면이라 주소따라가기가 아무것도 안 한다
      return;
    }
    go(tab);
  }
  // 로고 · 입력 칸 「← 홈」 — 넣어 둔 사람이 있으면 홈, 없으면 첫 화면. 입력 칸을 그만두면 들고 있던 갈 곳도 내려놓는다.
  function 처음으로() {
    if (보인주소 === 'form') 입력접기();
    돌아가기('home');
    if (!hasProfile()) window.scrollTo({ top: 0 });
  }

  // ───── 탭별 꾸러미 (10-02 개편 3묶음 「빠르기」) ─────
  // 전에는 첫 화면이 스크립트 73개(압축 약 1.2MB)를 한꺼번에 받았다. 첫 화면 · 홈이 쓰는 것은 그 가운데 일부다.
  // 이제 index.html 의 <script> 줄은 첫 화면 · 입력 칸 · 홈 · 아래 메뉴 · 결제 · 로그인이 쓰는 것만 받고, 나머지는 index.html 맨 아래
  // <template id="kkureomi"> 에 적어 두었다가(template 안의 스크립트는 받지도 돌지도 않는다) 탭을 열 때 받는다. 표는 그 template 하나다.
  //  · 줄마다 data-for = 그 파일이 필요한 탭 이름들. 탭을 열면 그 이름이 적힌 줄만, 적힌 차례대로 받는다
  //    (async=false — 먼저 받아진 파일이 있어도 적힌 차례대로 돈다. 차례는 옛 index.html 차례 그대로 · 엔진 순서 그대로).
  //  · template 의 data-all 탭(sheet · gunghap)은 줄을 다 받는다. home · ai 는 탭이 아니라 꾸러미 이름이다(아래 홈꾸러미 · 설정 창 개발용 칸).
  //  · 한 번 받은 파일은 다시 받지 않는다(다른 탭 꾸러미와 겹치는 파일도). 받다가 하나라도 실패하면 그 탭에 오류 상자(oryu.js) —
  //    「다시 하기」는 새로 고침이다. 앞서 돈 파일이 못 받은 파일을 빈 채로 물고 있을 수 있어서, 그 파일만 다시 받아서는 낫지 않는다.
  //  · 판정 · 그리기 재료(판정 · 격 · 조후 · 인생 곡선 · 설명서 · 궁합 13장 · 웹툰 · 택일)가 다 실은 옛 차례와 글자 하나까지 같은지
  //    꾸러미마다 따로 재 보고 나눴다(10-02, node 가짜 화면 · 지어낸 사람 셋).
  const 꾸러미틀 = document.getElementById('kkureomi');
  const 꾸러미모두 = ((꾸러미틀 && 꾸러미틀.getAttribute('data-all')) || '').split(/\s+/).filter(Boolean);
  const 꾸러미줄 = (() => {
    const 안 = 꾸러미틀 && 꾸러미틀.content;
    if (!안 || !안.querySelectorAll) return [];
    return Array.from(안.querySelectorAll('script[src]')).map(s => ({ src: s.getAttribute('src'), 탭: (s.getAttribute('data-for') || '').split(/\s+/).filter(Boolean) }));
  })();
  const 받은파일 = {};            // src → 받는 약속. 실패하면 지운다
  const 다받은파일 = new Set();    // 다 받아 돈 파일
  // 처음 <script> 줄로 이미 받은 파일은 받은 것으로 친다 — template 에 겹쳐 적어도 두 번 돌지 않게
  document.querySelectorAll('script[src]').forEach(s => { const a = s.getAttribute('src'); if (a) 다받은파일.add(a); });
  function 꾸러미파일(이름) { return 꾸러미줄.filter(r => 꾸러미모두.indexOf(이름) >= 0 || r.탭.indexOf(이름) >= 0).map(r => r.src); }
  function 꾸러미왔나(이름) { return 꾸러미파일(이름).every(src => 다받은파일.has(src)); }
  function 꾸러미받는중(이름) { return 꾸러미파일(이름).some(src => !!받은파일[src] && !다받은파일.has(src)); }
  function 파일받기(src) {
    if (다받은파일.has(src)) return Promise.resolve();
    if (받은파일[src]) return 받은파일[src];
    return (받은파일[src] = new Promise((됨, 안됨) => {
      const s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = () => { 다받은파일.add(src); 됨(); };
      s.onerror = () => { delete 받은파일[src]; s.remove(); 안됨(new Error('못 받음 ' + src)); };
      document.body.appendChild(s);
    }));
  }
  function 꾸러미받기(이름) { return Promise.all(꾸러미파일(이름).map(파일받기)); }
  // 탭 파일이 오는 동안 — 탭 맨 위(← 홈 아래)에 「불러오는 중」 한 줄. 다 오면 그 탭을 그린다(그 사이 다른 화면으로 갔으면 안 그린다 — 탭차례).
  let 탭차례 = 0;
  function 꾸러미기다림(tab, 차례) {
    const el = document.querySelector('.tab[data-tab="' + tab + '"]'); if (!el) return;
    const 자리 = (n) => { const 위 = el.querySelector(':scope > .backhome-top'); if (위) 위.insertAdjacentElement('afterend', n); else el.insertAdjacentElement('afterbegin', n); };
    el.querySelectorAll(':scope > .kk-err').forEach(x => x.remove());
    let 알림 = el.querySelector(':scope > .kk-wait');
    if (!알림) { 알림 = document.createElement('p'); 알림.className = 'hint kk-wait'; 알림.setAttribute('role', 'status'); 알림.textContent = '화면을 불러오는 중이에요…'; 자리(알림); }
    꾸러미받기(tab).then(() => {
      알림.remove();
      if (차례 === 탭차례 && 열린탭() === tab) 탭그리기(tab);
    }, () => {
      알림.remove();
      if (차례 !== 탭차례 || 열린탭() !== tab) return;
      const box = document.createElement('div'); box.className = 'kk-err'; 자리(box);
      // 화면 이름 — 장부 이름(연애 · 사용설명서 · 정통사주 …), 없으면 그 탭 제목(비밀 열 가지 · 우리 둘, 잘 맞아요?)
      let 이름 = ''; try { const Y = window.ChaeksaYaksok, h = el.querySelector('h2'); 이름 = (Y && Y.이름 && Y.이름(tab)) || (h ? h.textContent.trim() : ''); } catch (e) {}
      if (!못불러옴(box, 이름 || '책사', () => location.reload())) box.innerHTML = '<p class="hint">지금은 이 화면을 불러오지 못했어요. 새로 고침을 눌러 주세요.</p>';
    });
  }
  // 홈 — 넣어 둔 사람이 있을 때 홈 아래 「설명서」(seolmyeongseo.js)와 인생 곡선(typecard.js)이 판정 엔진을 쓴다. 홈을 먼저 그린 뒤 받아서 그 둘만 마저 그린다.
  // 그 사이 이번 주 띠는 오늘 한 줄만 보이고, 받으면 인생 곡선 한 줄이 붙는다. 이번 주 카드는 다시 그리지 않는다(펼쳐 본 날이 닫히지 않게).
  let 홈주 = null;   // renderHome 이 이번 주 카드를 그리고 받은 값 — 이번주띠가 쓴다
  function 홈꾸러미() {
    if (!R || 꾸러미왔나('home')) return;
    꾸러미받기('home').then(() => {
      if (!R) return;
      try { 이번주띠(홈주, 인생곡선()); } catch (e) { try { console.warn('인생 곡선 실패:', e); } catch (e2) {} }
      try { renderWtHome(); } catch (e) { try { console.warn('홈 목록 실패:', e); } catch (e2) {} }
    }, () => {});
  }
  // 이 꾸러미 표를 시험 쪽(tests_kkureomi.html)이 읽는다.
  window.ChaeksaKkureomi = { 파일: 꾸러미파일, 왔나: 꾸러미왔나, 받기: 꾸러미받기 };

  // 09-25 사장님 「콘텐츠 들어가면 홈으로 빠져나갈 길이 위아래 있어야」 — 화면 규격: 홈이 아닌 탭은 맨 위 · 맨 아래에 「← 홈」. 코드가 보장한다(탭마다 손으로 안 넣는다).
  function 홈길(tab) {
    if (tab === 'home') return;
    const el = document.querySelector('.tab[data-tab="' + tab + '"]'); if (!el) return;
    const 만들기 = (pos) => { const b = document.createElement('button'); b.className = 'btn ghost small backhome backhome-' + pos; b.dataset.open = 'home'; b.textContent = '← 홈'; b.onclick = () => 돌아가기('home'); return b; };
    if (!el.querySelector(':scope > .backhome-top')) { const t = el.querySelector(':scope > .backhome'); if (t) t.classList.add('backhome-top'); else el.insertAdjacentElement('afterbegin', 만들기('top')); }
    if (!el.querySelector(':scope > .backhome-bottom')) el.insertAdjacentElement('beforeend', 만들기('bottom'));
  }
  function go(tab) {
    const 차례 = ++탭차례;   // 10-02 탭별 꾸러미 — 파일이 늦게 오는 사이 다른 화면으로 갔으면 늦게 온 쪽은 그리지 않는다(꾸러미기다림)
    // 떠나기 전에 자리를 적어 둔다. 그리기 전에 해야 한다 — 그린 뒤엔 이미 0 으로 튕겨 있다.
    // 홈에서 아래 「홈」을 다시 누르는 것은 「맨 위로」라는 뜻이다. 그때만 자리를 잊는다.
    if (열린탭() === 'home') 홈자리 = (tab === 'home') ? 0 : 지금자리();
    // 유형 카드(789 유형·SSR 등급·시즌 카드)는 2026-09-04 삭제 — 「무슨 말인지도 모르더라」. 옛 링크는 홈으로.
    if (tab === 'gacha' || tab === 'today') tab = 'home';   // 오늘 탭은 2026-09-13 에 걷었다 — 옛 링크는 홈으로
    주소남기기(경로('#' + tab));   // 10-02 화면마다 주소(위 「화면마다 주소」)
    홈길(tab);
    // 원국 없는 방문자가 '← 홈'을 누르면 빈 홈이 아니라 안내 화면으로 돌아가야 한다
    if (tab === 'home' && !hasProfile()) { $('app').classList.add('hide'); showLanding(); return; }
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('hide', t.dataset.tab !== tab));
    if (tab === 'taekil') 택일문달기();   // 10-02 맨 위 두 문 — 탭 파일(꾸러미)을 기다리기 전에 칸부터 정한다
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.pick ? 분류탭(b.dataset.pick, b.dataset.go).indexOf(tab) >= 0 : b.dataset.go === tab));
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
    // 10-02 개편 3묶음 「빠르기」 — 그 탭 파일(탭별 꾸러미)이 아직 안 왔으면 받은 뒤에 그린다(아래 「탭별 꾸러미」).
    // 홈은 기다리지 않는다 — 홈은 처음 받은 파일로 다 그려지고, 아래 「설명서」 · 인생 곡선만 홈꾸러미가 뒤에서 받아 마저 그린다.
    if (tab === 'home') 홈꾸러미();
    else if (!꾸러미왔나(tab)) { 꾸러미기다림(tab, 차례); return; }
    탭그리기(tab);
  }
  // 탭 안을 그린다 — go() 가 그 탭 파일이 다 온 뒤에 부른다(파일이 늦게 오면 꾸러미기다림이 받은 뒤 부른다).
  function 탭그리기(tab) {
    // 시각을 다시 읽는다. 「지금」 표시와 오늘 간지가 로드 시각에 얼어 있었다.
    // 달력 탭은 2026-09-17 에 걷었다(사장님 「달력 삭제 — 설득력없음」). 날 점수(calendar.js)도 같이 나갔다.
    if (tab === 'jeongtong') { try { const b = $('jtOut'); if (b && window.ChaeksaJeongtong && profile) window.ChaeksaJeongtong.그리기(b, profile); } catch (e) {} }
    // 09-26 정통사주 한 줄 카드(docs/87 4절) — 시작 단추 위. 카드는 ssom-card.js 가 그린다
    if (tab === 'jeongtong' && $('jtStart') && profile && window.ChaeksaSsomCard) { try { const old = $('jtCard'); if (old) old.remove(); const R = ChaeksaEngine.calc(profile), html = window.ChaeksaSsomCard.정통카드(R); if (html) { $('jtStart').insertAdjacentHTML('beforebegin', html); window.ChaeksaSsomCard.정통붙이기($('jtStart').parentElement, R, profile.name || ''); } } catch (e) {} }
    if (tab === 'jeongtong' && $('jtStart')) $('jtStart').onclick = () => { if (!profile) return; try { sessionStorage.setItem('chaeksa.jtVn', JSON.stringify({ a: 궁합입력(profile) })); } catch (e) {} location.href = 'ssom-vn.html'; };   // 09-26 정통사주 웹툰 시작
    if (tab === 'love') { try { if (window.ChaeksaLoveView) ChaeksaLoveView.그리기($('loveBox'), profile); } catch (e) { try { console.warn('연애 속의 나 탭:', e); } catch (x) {} } }
    if (tab === 'pair') { try { if (window.ChaeksaPairView) ChaeksaPairView.그리기($('pairBox'), profile); } catch (e) { try { console.warn('행동양식 궁합 탭:', e); } catch (x) {} } }   // 10-01 pair.js
    if (tab === 'ssom') { try { renderSsom(); } catch (e) { try { console.warn('연애궁합 탭:', e); } catch (x) {} } }
    if (tab === 'chongnon') { try { renderChongnon(); } catch (e) { try { console.warn('궁합총론 탭:', e); } catch (x) {} } }
    if (tab === 'gunghap') renderGunghap();
    if (tab === 'sheet') renderSheet();
    if (tab === 'taekil') { wireTaekil(); 택일내보고서(); }
    // 궁합총론 13장 링크로 건너왔으면 거기서 보던 그 사람을 이 장에서도 골라 둔다 — 첫 사람으로 바뀌어 있으면 엉뚱한 사람을 보게 된다.
    if (궁합넘김) {
      const id = 궁합넘김; 궁합넘김 = null;
      try { const e = 고르는칸[tab] ? $(고르는칸[tab]) : null; if (e && [...e.options].some(o => o.value === id)) { e.value = id; if (e.onchange) e.onchange(); } } catch (e) {}
    }
  }
  // 10-02 아래 줄 다섯 칸 — 홈 · 내 사주 · 출산택일은 곧장 그 탭, 연애 · 궁합(data-pick)은 고르기 창. 창을 못 그리면 data-go 탭으로 곧장.
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => { if (b.dataset.pick && 고르기창(b.dataset.pick)) return; 돌아가기(b.dataset.go); });
  // ───── 아래 줄 고르기 창(10-02) — 연애 · 궁합을 누르면 그 분류의 콘텐츠를 한 줄씩 견주어 고른다 ─────
  // 무엇이 있나 · 차례 = 홈 분류 칸(home-cats.js 칸 표 → ChaeksaHomeCats.묶음). 창 머리 = 분야 표 큰분야 이름 · 머리(bunya.js).
  // 줄마다 이름 · 무엇을 보나(홈한줄) · 딱지(무엇이 무료 · 얼마 — 값은 상품표에서) = 상품 약속 장부(yaksok.js). 글을 여기 손으로 적지 않는다.
  // 고르면 들어가기() — 홈 칸을 누른 것과 같은 길(그 사람이 아직 없으면 그 사람 칸부터).
  // go() 가 먼저 부를 수 있어 함수 선언으로 둔다(끌어올려진다). 홈 칸 표를 못 읽으면 data-go 탭 하나.
  function 분류탭(분류, 기본) {
    try { const HC = window.ChaeksaHomeCats; if (HC && HC.묶음) { const t = HC.묶음(분류).map(c => c.탭).filter(Boolean); if (t.length) return t; } } catch (e) {}
    return 기본 ? [기본] : [];
  }
  function 고르기창(분류) {
    const HC = window.ChaeksaHomeCats, Y = window.ChaeksaYaksok, B = window.ChaeksaBunya, m = $('navPick'), list = $('navPickList');
    if (!m || !list || !HC || !HC.묶음 || !Y) return false;
    const 칸들 = HC.묶음(분류).filter(c => c.탭 && document.querySelector('.tab[data-tab="' + c.탭 + '"]'));
    if (!칸들.length) return false;
    const 큰 = ((B && B.큰분야) || []).find(x => x.키 === 분류) || {}, 지금 = 열린탭();
    $('navPickT').textContent = 큰.이름 || '';
    $('navPickS').textContent = 큰.머리 || '';
    $('navPickS').classList.toggle('hide', !큰.머리);
    list.innerHTML = 칸들.map(c => {
      const 이름 = Y.이름(c.키), 한줄 = Y.홈한줄 ? Y.홈한줄(c.키) : Y.한줄(c.키), 딱지 = Y.딱지html(c.키);
      return '<button type="button" class="np-row' + (c.탭 === 지금 ? ' on' : '') + '" data-tab="' + escP(c.탭) + '"' + (c.탭 === 지금 ? ' aria-current="page"' : '') + '>'
        + '<b>' + escP(이름) + '</b>' + (한줄 ? '<span class="np-s">' + escP(한줄) + '</span>' : '') + (딱지 ? '<span class="np-t">' + 딱지 + '</span>' : '') + '</button>';
    }).join('');
    try { Y.값채우기(list); } catch (e) {}
    list.querySelectorAll('.np-row').forEach(b => b.onclick = () => { m.classList.add('hide'); 들어가기(b.dataset.tab); });
    m.classList.remove('hide');
    return true;
  }
  if ($('navPick')) {
    $('navPick').onclick = (e) => { if (e.target === $('navPick')) $('navPick').classList.add('hide'); };
    $('btnNavPickClose').onclick = () => $('navPick').classList.add('hide');
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('navPick').classList.contains('hide')) $('navPick').classList.add('hide'); });
  }
  // 10-02 로고를 누르면 처음으로(전에는 눌러도 아무 일이 없었다). index.html 의 로고는 ./ 로 가는 링크라 스크립트가 없어도 첫 화면으로 간다.
  document.querySelectorAll('header .logo').forEach(a => a.addEventListener('click', (e) => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); 처음으로(); }));   // 새 탭으로 열기(Ctrl · ⌘)는 링크 그대로

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
  // 「뒤로」 · 「앞으로」 · #탭 링크 — 주소가 가리키는 화면을 연다. 이미 그 화면이면 아무것도 안 한다(popstate 와 hashchange 가 같이 와도 한 번만).
  function 주소따라가기() {
    if (!주소켜짐) return;
    const r = 경로(location.hash);
    if (r == null || r === 보인주소) return;
    // 떠 있는 창(사람 고르기 · 그 사람 넣기 · 로그인 · 설정)은 닫는다 — 화면만 바뀌고 창이 그 위에 남지 않게.
    ['peopleSheet', 'personForm', 'loginSheet', 'settings', 'navPick'].forEach(id => { const m = $(id); if (m) m.classList.add('hide'); });
    사람폼그만();
    const 입력에서 = 보인주소 === 'form';
    주소없이(() => {
      if (r === '') { if (입력에서) 입력접기(); go('home'); }
      else if (r === 'form') { if (hasProfile() && profile) go('home'); else showForm(); }
      else goHash(!!(People() && People().active()));
    });
    주소맞추기();
  }
  window.addEventListener('popstate', 주소따라가기);
  window.addEventListener('hashchange', 주소따라가기);
  // 부팅이 끝나면(파일 끝 「시작」) 켠다. 주소가 보이는 화면과 같으면(그냥 · 결제 복귀 · 로그인 복귀) 그대로 두고,
  // ?go= · 받은 #탭 주소로 곧장 다른 화면에 섰으면 밑에 처음 화면 한 칸을 깔아 「뒤로」가 사이트 밖이 아니라 처음 화면으로 오게 한다.
  function 주소시작() {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}   // 자리는 go() 가 잡는다(홈은 보던 자리, 탭은 맨 위) — 브라우저가 따로 되감으면 둘이 다툰다
    주소켜짐 = true;
    if (보인주소 == null) return;
    const 지금 = 경로(location.hash), 바닥 = location.pathname + location.search;
    try {
      if (지금 === 보인주소 && 보인주소 !== 'form') history.replaceState({ 책사: 1, 앞: null }, '', location.href);   // 입력 칸(#form)으로 곧장 왔으면 아래 갈래 — 밑에 처음 화면을 깐다
      else if (보인주소 === '') history.replaceState({ 책사: 1, 앞: null }, '', 바닥);
      else { history.replaceState({ 책사: 1, 앞: null }, '', 바닥); history.pushState({ 책사: 1, 앞: '' }, '', 주소(보인주소)); }
    } catch (e) {}
  }
  // 초기 호출은 파일 끝에서 한다. 여기서 부르면 go() 가 renderNokpae() 등을 타는데
  // 그 함수들이 쓰는 const 가 아직 선언 전이라 TDZ 오류가 난다.

  // ───── 시작 ─────
  function start(p) {
    // 이름이 없으면 없는 대로 둔다. 대신 부르는 자리마다 이름 없는 갈래를 준비해 뒀다.
    profile = p; R = E.calc(p);
    $('landing').classList.add('hide'); $('formCard').classList.add('hide');
    $('btnSettings').classList.remove('hide');
    $('app').classList.remove('hide'); $('nav').classList.remove('hide');
    // 10-02 「책사단」은 걷은 말이다. 처음 온 손님은 index.html 의 소개 한 줄(연애 · 궁합 · 출산택일)을 보고, 저장한 뒤에는 「○○님의 책사」.
    $('subtitle').textContent = nim() ? `${nim()}의 책사` : '나의 책사';
    renderPeopleBtn();
    renderPartners(); renderHome();   // 09-25 원국 탭(me) 걷음 — 홈 안의 원국만
    try { renderWtHome(); } catch (e) { try { console.warn('홈 목록 실패:', e); } catch (e2) {} }
    go('home');
  }

  // ───── 총평 — 로그인·입력 직후 제일 먼저 보는 카드 ─────
  // 순서가 전략이다: 총평(구조) → 결함 → 과거(본인이 검증) → 현재 → 미래는 결제.
  // 과거를 맞힌 잣대가 미래를 잰다는 사실을 화면에 적는다 — 스토리 틀 그대로.
  // ── 첫 화면 = 간명서 (2026-08-29 「문진 말고 특장점 창을 띄워야지」) ──
  // 첫 의논 맛보기(renderChong · #chong)를 여기서 걷었다 (2026-09-12 이야기 서점 전략 — 홈은 표지만 세운다).
  // 의논 전문은 의논 화면(renderGanmyeong)이 그대로 그린다. 홈에서는 전체 목록 → 「나를 두고 열 사람이」로 간다.

  // ───── 인생 곡선(大運圖) — 홈 맨 아래 카드 ─────
  // 09-30 사장님 「몰라.. 사람들은 지어낸 점수를 좋아하나봐 홈 맨 하단에 만들어줘」 — 09-17 에 지운 옛 유형 카드를 그대로 되살림.
  // 점수는 typecard.lifeCurve 옛 기준 그대로(강약 부합 · 조후 · 일지 합) — 법전 · 십성 변화 엔진 판정이 아니다. 사장님이 알고 고른 것.
  function 인생곡선() {
    const T = window.ChaeksaTypecard, box = $('lcCard');
    if (!box) return;
    if (!T || !T.drawLifeCurve || !R || !R.daeun || !R.daeun.list || !R.daeun.list.length) { box.classList.add('hide'); return null; }
    const lc = T.lifeCurve(R, today);
    box.innerHTML = '<h2>인생 곡선</h2>'
      + '<p class="hint" style="margin:0 0 4px">열 해마다 바뀌는 대운 아홉 칸을 곡선으로 그렸어요. 대운이 내 사주에 필요한 것을 가져오는지로 점수를 매겼어요.</p>'
      + (profile && profile.genderUnknown ? '<p class="hint" style="margin:6px 0 0">성별을 모른다고 하셔서 남성 기준으로 그렸어요. 대운은 성별에 따라 도는 방향이 달라요.</p>' : '')
      + '<div class="cardwrap"><div class="cardflip"><div class="cardsvg" id="lcSvg">' + T.drawLifeCurve(이름값(), lc) + '</div></div>'
      + '<button class="btn small" id="btnLcShare" style="margin-top:12px">이 그림 저장 · 보내기</button><p class="hint" id="lcShareSay" style="margin:8px 0 0;text-align:center"></p></div>'
      + '<p class="hint" style="margin-top:10px;text-align:center">' + esc(lc.kind + '형 · 가장 높은 구간 ' + lc.peakTxt) + ' · 같은 사주는 언제나 같은 곡선이에요</p>';
    box.classList.remove('hide');
    // 10-02 개편 2묶음 「공유 카드 넓히기」 — 전에는 링크 없이 그림만 갔다. 받은 사람이 들어올 주소(꼬리표 card-curve)를 같이 보낸다.
    // 폰 공유는 글에 주소를 싣고 클립보드에도 넣는다(typecard.js share). 주소는 화면에도 적어 둔다 — 카톡이 글을 버렸을 때 붙여 넣게.
    const 곡선주소 = 'https://chaeksa.kr/?from=card-curve';
    $('btnLcShare').onclick = async () => {
      const b = $('btnLcShare'), say = $('lcShareSay'); b.disabled = true; b.textContent = '만드는 중…';
      try { window.ChaeksaTrack && ChaeksaTrack.event && ChaeksaTrack.event('share-curve'); } catch (e) {}
      try {
        const r = await T.share($('lcSvg').innerHTML, '대운도_' + lc.peak.startAge + '세', 곡선주소);
        b.textContent = r === 'shared' ? '보냈어요' : r === 'copied' ? '복사됐어요 — 붙여 넣으세요' : '사진으로 저장했어요';
        if (say) say.innerHTML = '받는 사람도 자기 곡선을 볼 수 있게 이 주소를 같이 보내 주세요<br><b style="user-select:all;overflow-wrap:anywhere">' + esc(곡선주소) + '</b>';
      } catch (e) { b.textContent = '다시 눌러 주세요'; }
      b.disabled = false;
      setTimeout(() => { b.textContent = '이 그림 저장 · 보내기'; }, 2500);
    };
    return lc;   // 10-02 홈 맨 위 이번 주 띠(이번주띠)가 지금 구간 한 줄을 쓴다
  }

  // ───── 이번 주 띠 — 홈 맨 위(10-02 개편 2묶음 「다시 온 손님 홈」) ─────
  // 넣어 둔 사람이 다시 오면 맨 위에서 오늘 한 줄과 인생 곡선의 지금 구간을 본다(전에는 그림 칸 아래 4,500px 밑이라 다시 와도 안 보였다).
  // 누르면 펼쳐 이번 주 카드(bhCard) · 인생 곡선(lcCard)이 그 자리에 선다(index.html #wkBand). 펼침은 이 기기에 기억한다(다음에 와도 그대로).
  // 글은 여기서 짓지 않는다 — 오늘 한 줄 = 이번 주 카드가 오늘 칸 맨 위에 내는 그 줄(byeonhwa.js 사람말 → 세계실단, 카드를 그린 같은 S),
  // 지금 구간 = 인생 곡선 카드 글 첫 줄(typecard.js lifeCurve lines[0])의 첫 문장. 둘 다 없으면 띠를 숨긴다.
  const 띠열림키 = 'chaeksa.wkOpen';
  function 이번주띠(S, lc) {
    const box = $('wkBand'), sum = $('wkSum'), V = window.ChaeksaByeonhwaView;
    if (!box || !sum) return;
    let 오늘줄 = '';
    try {
      const 날들 = (S && S.주 && S.주.날들) || [], i = 날들.findIndex(x => x.날짜 === S.오늘);
      if (V && V.사람말 && V.체덧 && V.세계실단 && i >= 0) 오늘줄 = V.세계실단(V.사람말(날들[i], V.체덧(S, i))) || '';
    } catch (e) { 오늘줄 = ''; }
    const 곡선첫 = lc && lc.lines && lc.lines[0] ? String(lc.lines[0]) : '';
    const 곡선줄 = ((/^(.*?)[.!?](\s|$)/.exec(곡선첫) || [null, 곡선첫])[1] || '').trim();
    if (!오늘줄 && !곡선줄) { box.classList.add('hide'); sum.innerHTML = ''; return; }
    sum.innerHTML = '<span class="wk-h"><b>' + escP((nim() ? nim() + '의' : '나의') + ' 이번 주') + '</b><i class="wk-tg"></i></span>'
      // 오늘 한 줄은 「10월 2일 금요일은 …」처럼 제 날짜로 시작한다(byeonhwa-jogak.js 세계틀 · 요즘그대로.날) — 머리표에는 「오늘」만.
      + (오늘줄 ? '<span class="wk-day">오늘</span><span class="wk-s">' + escP(오늘줄) + '</span>' : '')
      + (곡선줄 ? '<span class="wk-l"><b>인생 곡선</b>' + escP(곡선줄) + '</span>' : '');
    const 표 = () => { const t = sum.querySelector('.wk-tg'); if (t) t.textContent = box.open ? '접기 ▴' : '펼쳐 보기 ▾'; };
    if (!box.dataset.wired) {
      box.dataset.wired = '1';
      try { if (localStorage.getItem(띠열림키) === '1') box.open = true; } catch (e) {}
      box.addEventListener('toggle', () => { 표(); try { localStorage.setItem(띠열림키, box.open ? '1' : '0'); } catch (e) {} });
    }
    표();
    box.classList.remove('hide');
  }

  // ───── 홈 — 타일과 가운데 만세력 ─────
  function renderHome() {
    // 09-27 이번 주엔 무엇이 바뀌나 — 홈 카드(byeonhwa.js, 10-02 맨 위 이번 주 띠 안 · 펼치면 보인다). 그 사람은 정통궁합 · 웹툰궁합이 고른 사람(궁합그사람)과 같다
    let 주S = null, 곡선 = null;
    try { if (window.ChaeksaByeonhwaView && $('bhCard')) 주S = ChaeksaByeonhwaView.그리기($('bhCard'), profile, (() => { try { const P0 = People(), me = P0 && P0.active(), g = P0 && 궁합그사람 ? P0.get(궁합그사람) : null; return g && (!me || g.id !== me.id) ? P0.toProfile(g) : null; } catch (e) { return null; } })()); } catch (e) { try { console.warn('이번 주 실패:', e); } catch (e2) {} }
    홈주 = 주S;   // 10-02 홈꾸러미가 판정 엔진을 받은 뒤 인생 곡선을 붙일 때 쓴다(인생 곡선 · typecard.js 는 탭별 꾸러미 home 에 있다 — 오기 전에는 곡선 없이 띠만)
    try { 곡선 = 인생곡선(); } catch (e) { try { console.warn('인생 곡선 실패:', e); } catch (e2) {} }
    try { 이번주띠(주S, 곡선); } catch (e) { try { console.warn('이번 주 띠 실패:', e); } catch (e2) {} }
    // 홈 장면(#homeScene · 오늘 한마디)과 기억 물음(#remember)은 화면에서 걷은 뒤에도 코드가 남아 홈을 그릴 때마다 헛돌았다 — 10-02 개편 3묶음에서 지웠다.
  }
  // data-scroll 이 있으면 탭을 연 뒤 그 자리로 내린다 — 홈 「이달의 나」가 오늘 탭의 달력(#myMonth)으로 간다.
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
    돌아가기(b.dataset.open);
    const id = b.dataset.scroll;
    // go() 가 맨 위로 올린 뒤 탭이 그려지는 데 한 박자 걸린다 — 60ms 에 smooth 로 보냈더니
    // 1초 뒤에도 10,000px 위에 있었다. 그려진 다음에 곧장 간다.
    if (id) setTimeout(() => { const el = $(id); if (el) el.scrollIntoView({ block: 'start', behavior: 'auto' }); }, 260);
  });

  // 원국 공유 카드(renderShareCard · #btnShare · #btnSaveImg → share.js draw)는 10-02 개편 2묶음에서 걷었다 — 부르는 단추가 화면에 없었다.
  // 오늘 탭 · 시각 보정 견줌(#solarCmp) · 슈퍼계정 체용 카드 · 격 카드(#gyeokBox) · 원국 정독(#aiProfile)은 화면에서 걷은 뒤 코드만 남아 있던 것을 10-02 개편 3묶음에서 지웠다.


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


  /** 결제 버튼에서 로그인이 필요할 때. 앱의 다른 로그인 자리와 같은 꼴(카카오 → 안 되면 설정 창).
   *  로그인하고 돌아오면 이 장과 고른 사람으로 다시 온다(2026-09-22 점검 — 예전엔 홈에 떨어져서 사려던 장을 다시 찾아야 했다).
   *  돌아오는 쪽은 파일 끝 「시작」이 chaeksa.return 을 읽는다. */
  const 고르는칸 = { geunamja: 'gnPick', maeum: 'mmPick', gunghap: 'ghPick', sheet: 'shPick', pair: 'pairPick' };
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
  // 09-25 사장님 「상대 프로필 선택이 너무 98년도 윈도우 같아」 · 09-26 「규격으로 맞추기」(docs/79 4절) — 그 사람 고르기는 select 를 숨기고 사람 칩으로. 웹툰궁합 · 정통궁합이 같이 쓴다.
  function 사람칩(wrap, sel, list, 고름, add) {
    sel.classList.add('ss-sel-hidden');
    let 칩 = wrap.querySelector('.ss-who'); if (!칩) { 칩 = document.createElement('div'); 칩.className = 'ss-who'; 칩.setAttribute('role', 'radiogroup'); wrap.appendChild(칩); }
    칩.innerHTML = list.map(p => '<button type="button" role="radio" aria-checked="' + (p.id === 고름) + '" class="ss-wh' + (p.id === 고름 ? ' on' : '') + '" data-id="' + p.id + '"><b>' + esc(사람이름(p.name) || '그 사람') + '</b><small>' + esc(p.relation) + '</small></button>').join('')
      + '<button type="button" class="ss-wh ss-wh-add">＋ 다른 사람</button>';
    칩.querySelectorAll('.ss-wh[data-id]').forEach(b => b.onclick = () => { if (sel.value === b.dataset.id) return; sel.value = b.dataset.id; sel.onchange(); });
    칩.querySelector('.ss-wh-add').onclick = () => openPersonForm(null);
    if (add) add.classList.add('hide');   // 아래 「그 사람 생년월일 넣기」는 칩의 「＋ 다른 사람」이 대신한다
  }
  // 10-02 화면 파일(정통궁합 · 웹툰궁합)을 못 받았을 때 — 공용 오류 상자(oryu.js): 무엇이 안 됐는지 · 다시 하기 · 문의하기(메일에 화면 이름).
  // 오류 상자 파일도 없으면 false — 예전 안내 한 줄로.
  function 못불러옴(out, 화면, 다시, 숨길) {
    const O = window.ChaeksaOryu; if (!O || !out) return false;
    (숨길 || []).forEach(x => { if (x) x.classList.add('hide'); });
    O.그리기(out, { 무엇: '지금은 「' + 화면 + '」 화면을 불러오지 못했어요', 까닭: '인터넷이 잠깐 끊겼거나, 화면 파일을 받다가 멈췄을 수 있어요.', 화면 }, 다시);
    return true;
  }
  function renderChongnon() {
    const P = People(), GC = window.ChaeksaGunghapChongnon;
    const out = $('gcTabOut'), sel = $('gcPick'), wrap = $('gcPickWrap'), none = $('gcNone'), add = $('btnGcAdd');
    if (!out || !sel) return;
    const 비우기 = () => { out.innerHTML = ''; 궁합그린것 = ''; };
    const 안내 = (말, 단추, 누르면) => {
      wrap.classList.add('hide'); none.textContent = 말; none.classList.remove('hide');
      add.textContent = 단추; add.classList.remove('ghost', 'hide'); add.onclick = 누르면; 비우기();
    };
    // 내 원국이 없으면 두 분을 놓을 수 없다. (원국이 없으면 아래 탭이 안 보이지만, 주소로 들어오는 길을 막아 둔다.)
    if (!profile || !R) { 안내('내 생년월일부터 넣어 주세요. 내 원국이 있어야 두 분을 나란히 놓아요.', '내 생년월일 넣기', () => go('home')); return; }
    if (P && !GC && 꾸러미받는중('chongnon')) return;   // 10-02 정통궁합 파일(탭별 꾸러미)이 아직 오는 중 — 다 오면 go() 가 다시 그린다
    if (!P || !GC) { 궁합그린것 = ''; if (!못불러옴(out, '정통궁합', renderChongnon, [wrap, none, add, $('gcStart')])) 안내('지금은 정통궁합을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.', '다시 열기', () => renderChongnon()); return; }
    const me = P.active(), list = P.list().filter(p => !me || p.id !== me.id);
    if (!list.length) { 안내('그 사람 생년월일을 먼저 넣어 주세요. 넣으면 바로 두 분을 나란히 놓아요.', '그 사람 생년월일 넣기', () => openPersonForm(null)); return; }
    none.classList.add('hide'); wrap.classList.remove('hide');
    add.textContent = '그 사람 생년월일 넣기'; add.classList.add('ghost'); add.onclick = () => openPersonForm(null);
    const 고름 = list.some(p => p.id === 궁합그사람) ? 궁합그사람 : '';
    sel.innerHTML = (고름 ? '' : '<option value="">누구와 볼까요?</option>')
      + list.map(p => `<option value="${p.id}">${esc(사람이름(p.name) || '그 사람')} · ${esc(p.relation)}</option>`).join('');
    sel.value = 고름;
    sel.onchange = () => { 궁합고르기(sel.value); renderChongnon(); };
    사람칩(wrap, sel, list, 고름, add);
    const 시작 = $('gcStart'); if (시작) { 시작.classList.toggle('hide', !고름); 시작.onclick = () => { const t = out.querySelector('h2, h3, details, .card') || out; try { t.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { t.scrollIntoView(); } }; }
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
      add.textContent = 단추; add.classList.remove('ghost', 'hide'); add.onclick = 누르면; out.innerHTML = '';
    };
    if (!profile || !R) { 안내('내 생년월일부터 넣어 주세요.', '내 생년월일 넣기', () => go('home')); return; }
    if (P && !SP && 꾸러미받는중('ssom')) return;   // 10-02 웹툰궁합 파일(탭별 꾸러미)이 아직 오는 중 — 다 오면 go() 가 다시 그린다
    if (!P || !SP) { if (!못불러옴(out, '웹툰궁합', renderSsom, [wrap, none, add, $('ssMore')])) 안내('지금은 웹툰궁합을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.', '다시 열기', () => renderSsom()); return; }
    const me = P.active(), list = P.list().filter(p => !me || p.id !== me.id);
    if (!list.length) { 안내('그 사람 생년월일을 먼저 넣어 주세요.', '그 사람 생년월일 넣기', () => openPersonForm(null)); return; }
    none.classList.add('hide'); wrap.classList.remove('hide');
    add.textContent = '그 사람 생년월일 넣기'; add.classList.add('ghost'); add.onclick = () => openPersonForm(null);
    const 고름 = list.some(p => p.id === 궁합그사람) ? 궁합그사람 : '';
    sel.innerHTML = (고름 ? '' : '<option value="">누구와 볼까요?</option>')
      + list.map(p => `<option value="${p.id}">${esc(사람이름(p.name) || '그 사람')} · ${esc(p.relation)}</option>`).join('');
    sel.value = 고름;
    sel.onchange = () => { 궁합고르기(sel.value); renderSsom(); };
    사람칩(wrap, sel, list, 고름, add);
    const more = $('ssMore'), met = $('ssMet');
    if (!고름) { out.innerHTML = ''; if (more) more.classList.add('hide'); return; }
    // 처음 만난 달 — 그 사람마다 이 기기에 기억한다(연 · 월만, 서버로 안 보낸다)
    const 만난키 = 'chaeksa.ssomMet.' + 고름;
    if (more) more.classList.remove('hide');
    if (met) { try { met.value = localStorage.getItem(만난키) || ''; } catch (e) {} met.onchange = () => { try { localStorage.setItem(만난키, met.value || ''); } catch (e) {} renderSsom(); }; }
    const mv = ((met && met.value) || '').split('-').map(Number);
    const st = $('ssStage');
    if (st && SP.단계카드 && !st.dataset.cards) { SP.단계카드(st); st.dataset.cards = '1'; }
    // 10-02 홈 물음 칸(「결혼을 생각할 때」)에서 왔으면 그 단계를 이 사람의 단계로 한 번 골라 둔다(도착 → 다음단계키).
    if (st) { try { const 다음 = sessionStorage.getItem('chaeksa.ssomStageNext'); if (다음) { sessionStorage.removeItem('chaeksa.ssomStageNext'); if (Array.from(st.options).some(o => o.value === 다음)) localStorage.setItem('chaeksa.ssomStage.' + 고름, 다음); } } catch (e) {} }
    if (st) { try { st.value = localStorage.getItem('chaeksa.ssomStage.' + 고름) || '둘'; if (!st.value) st.value = '둘'; if (st._그리) st._그리(); } catch (e) {} st.onchange = () => { try { localStorage.setItem('chaeksa.ssomStage.' + 고름, st.value); } catch (e) {} renderSsom(); }; }
    SP.그리기(out, 궁합입력(profile), 궁합입력(P.toProfile(P.get(고름))), { 만난: mv[0] ? { y: mv[0], m: mv[1] } : null, 단계: (st && st.value) || '썸' });
    // 09-25 사장님 「웹툰궁합 시작하기로 수정하고 위로 올려줘」 — 시작 단추를 사람 칩 바로 아래(단계 카드 위)로
    try { const vt = out.querySelector('#ssVnTop'); if (vt) { let 자리 = $('ssStart'); if (!자리) { 자리 = document.createElement('div'); 자리.id = 'ssStart'; wrap.insertAdjacentElement('afterend', 자리); } 자리.innerHTML = '';
      const cd = out.querySelector('#ssCard'); if (cd) 자리.appendChild(cd);   // 09-26 3초 결과 · 공유 카드를 맨 위(docs/87)
      자리.appendChild(vt); vt.style.margin = '4px 0 14px'; } } catch (e) {}
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
    // 이 왕복은 동기 렌더보다 늦게 온다 — 항상. (도착하면 다시 그리던 「이번 달 일운 달력」은 상품 · 칸을 걷어 10-02 개편 3묶음에서 지웠다.)
    ChaeksaPay.state().then(s => {
      payReady = !!(s && s.ready);
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
      + '<p style="margin:0 0 6px;font-size:var(--t1);line-height:1.7;color:var(--ink2)">결제하면 바로 열리는 디지털 콘텐츠입니다. '
      + '열람이 시작되면 청약철회(결제 후 7일 안 취소)가 제한될 수 있고, 열람 전에는 전액 환불됩니다.</p>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;font-size:var(--t1);line-height:1.7;color:var(--ink);cursor:pointer">'
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


  // 2026-08-30 「카카오로 물어보기도 다 치우자」 — 비워두면 카카오 버튼이 스스로 숨고
  // 메일만 남는다(그렇게 만들어 두었다). 10-02 사장님 「카톡책사 삭제」 — 책사 카카오톡 채널은 쓰지 않는다.
  const KAKAO_CHANNEL = '';
  // 택일 신청은 사이트 신청서(taekil-apply.html) 하나다(10-02 네이버폼 걷음 — 바깥 신청 폼 주소 · 갈래를 걷었다).
  // 2026-09-10 까지 이 탭의 유일한 창구가 mailto: 하나였다 — 모바일에서 메일 앱이 안 잡히면 눌러도 아무 일이 안 나서
  // 블로그에서 오는 사람(거의 모바일)에게는 사실상 창구가 없었다. 그래서 신청 단추는 사이트 신청서이고 메일은 곁길이다.

  const KAKAO_CHAT = (() => {
    const v = String(KAKAO_CHANNEL || '').trim();
    if (!v) return '';
    if (v.indexOf('open.kakao.com') >= 0) return v;          // 오픈채팅은 그대로
    const id = (v.match(/_[A-Za-z0-9]+/) || [v])[0];
    return 'https://pf.kakao.com/' + id + '/chat';
  })();


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

  // ───── 출산택일 탭 맨 위 두 문(10-02 사장님 「출산택일 메뉴를 최상단 보고서 신청과 시뮬레이터로 나누고」) ─────
  // 「← 홈」 바로 밑 문 둘(index.html .tk-doors — 보고서 신청 · 시뮬레이터). 누르면 아래 칸(data-tk-pane)만 바뀐다 — 쪽을 옮기지 않고 주소도 #taekil 그대로.
  // 처음 여는 칸 — 이 쪽을 연 뒤 탭을 처음 켤 때 한 번만 정한다(그 뒤로는 손님이 고른 칸 그대로):
  //   ① 지금 주소에 d=YYYY-MM-DD 나 월별 글 꼬리표(from=…-m12 · …-gt12)가 있으면 시뮬레이터 — taekilsim.js 첫날()과 같은 꼴이고, 시뮬레이터가 그 날 · 그 달로 연다
  //   ② 이 탭(sessionStorage)에서 마지막에 연 칸
  //   ③ 이 탭에 남은 글 꼬리표(landing.js 가 남긴 chaeksa.from)가 월별 글이면 시뮬레이터 — 시뮬레이터도 이 꼬리표로 그 달을 연다
  //   ④ 그 밖은 보고서 신청
  // 「보고서 신청」으로 들어오는 길(홈 출산택일 줄 「신청하기 →」)은 택일원함 = 'report' 로 칸을 정해 두고 온다.
  // 시뮬레이터 끝 신청 단추(taekilsim.js 다리)는 탭 안이면 data-tk-door="report" 를 달고 나온다 — 여기서 받아 보고서 칸으로 바꾸고 맨 위로 올린다.
  function 택일첫칸() {
    const 달글 = (t) => { const m = /-(?:m|gt)(\d{1,2})$/.exec(t || ''); return !!m && +m[1] >= 1 && +m[1] <= 12; };
    try { const q = new URLSearchParams(location.search); if (/^\d{4}-\d{2}-\d{2}$/.test(q.get('d') || '') || 달글(q.get('from'))) return 'sim'; } catch (e) {}
    let 앞 = '', 꼬리 = '';
    try { 앞 = sessionStorage.getItem(택일칸키) || ''; 꼬리 = sessionStorage.getItem('chaeksa.from') || ''; } catch (e) {}
    if (앞 === 'sim' || 앞 === 'report') return 앞;
    return 달글(꼬리) ? 'sim' : 'report';
  }
  function 택일문열기(칸) {
    const el = document.querySelector('.tab[data-tab="taekil"]'); if (!el) return;
    칸 = 칸 === 'sim' ? 'sim' : 'report';
    el.querySelectorAll('.tk-door').forEach(b => { const 이것 = b.dataset.tkDoor === 칸; b.classList.toggle('on', 이것); b.setAttribute('aria-pressed', 이것 ? 'true' : 'false'); });
    el.querySelectorAll('[data-tk-pane]').forEach(p => p.classList.toggle('hide', p.dataset.tkPane !== 칸));
    try { sessionStorage.setItem(택일칸키, 칸); } catch (e) {}
  }
  function 택일문달기() {
    const el = document.querySelector('.tab[data-tab="taekil"]'); if (!el) return;
    if (!el.dataset.tkWired) {
      el.dataset.tkWired = '1';
      el.addEventListener('click', (e) => {
        const d = e.target && e.target.closest ? e.target.closest('[data-tk-door]') : null;
        if (!d || !el.contains(d)) return;
        const 문 = d.classList.contains('tk-door');
        if (!문 && (e.ctrlKey || e.metaKey || e.shiftKey)) return;   // 새 창으로 열기는 단추에 적힌 주소 그대로
        e.preventDefault();
        택일문열기(d.dataset.tkDoor);
        if (!문) window.scrollTo({ top: 0 });   // 시뮬레이터 끝에서 눌렀으면 맨 위(문 · 보고서 칸 첫머리)로
      });
    }
    const 칸 = 택일원함 || (택일칸정함 ? null : 택일첫칸());
    택일원함 = null; 택일칸정함 = true;
    if (칸) 택일문열기(칸);
  }

  // ───── 출산택일 「내 보고서」(10-02 설계서 ⑤ · 2-5) ─────
  // 보고서 신청 칸 맨 위(index.html #tkMine). 로그인했고 출산택일 주문이 있는 계정에만 보인다 — 상태는 my_taekil(server/migrate-36, 본문 없이 상태만).
  // 줄을 누르면 그 주문의 보고서 쪽(taekil-report.html?o=)으로 간다. 결제됐는데 아직 안 만든 주문이면 그 쪽이 만들기를 부른다(창을 닫았다 와도 이어진다).
  // 검수 계정(super)에게는 사장님 목록 · 사이트 신청서(시험 결제) 길을 함께 단다. 탭을 열 때마다 새로 읽는다(만드는 중 → 열림이 바로 보이게).
  function 택일내보고서() {
    const box = $('tkMine'), T = window.ChaeksaPay && ChaeksaPay.taekil;
    if (!box || !T) return;
    let 수퍼 = false;
    try { 수퍼 = !!(window.ChaeksaUsage && ChaeksaUsage.plan() === 'super'); } catch (e) { 수퍼 = false; }
    const 딱지 = { todo: '만들기 →', no_intake: '신청서 붙이기 →', making: '만드는 중', checking: '확인 중', ready: '보고서 열기 →', canceled: '환불됨' };
    const 날 = (s) => { const d = new Date(s); return isNaN(d) ? '' : d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 결제'; };
    T.mine().then(rows => {
      const xs = Array.isArray(rows) ? rows : [];
      if (!xs.length && !수퍼) { box.classList.add('hide'); box.innerHTML = ''; return; }
      box.innerHTML = '<div class="tk-mine"><h3>내 보고서</h3>'
        + (xs.length ? xs.map(x => '<a class="tk-mine-row" href="' + escP(T.주소(x.id)) + '"><span><b>' + escP(x.range || '출산택일 보고서') + '</b>'
            + '<span>' + escP([날(x.paidAt), T.상태말[x.state] || ''].filter(Boolean).join(' · ')) + '</span></span><i>' + escP(딱지[x.state] || '보기 →') + '</i></a>').join('')
          : '<p class="hint" style="margin:0">이 계정으로 결제한 출산택일 보고서가 없어요.</p>')
        + (수퍼 ? '<p class="hint" style="margin:10px 0 0">검수 계정 — <a href="taekil-admin.html">사장님 목록 →</a> · <a href="taekil-apply.html">사이트 신청서로 시험하기 →</a></p>' : '')
        + '</div>';
      box.classList.remove('hide');
    }).catch(() => {});
  }

  function wireTaekil() {
    const a = $('btnTaekMail'); if (!a || a.dataset.wired) return;
    a.dataset.wired = '1';
    // 값은 products 표 한 곳에만 있다(docs/17). 화면 글자는 표에서 받아 채운다 —
    // 적어 두면 표를 바꿀 때 어긋나고, 결제 금액과 다르면 토스 심사에서 걸린다.
    if (window.ChaeksaPay && ChaeksaPay.product) ChaeksaPay.product('taekil').then(p => {
      if (p) document.querySelectorAll('[data-price="taekil"]').forEach(el => { el.textContent = ChaeksaPay.won(p.amount); });
    }).catch(() => {});
    // 메일 신청 — 신청서와 같은 칸 이름(pay.js 주문서.신청메일, 제목 「[책사] 출산택일 신청」 · 본문은 칸 이름만). 결제 모듈이 없으면 옛 양식.
    const 주문서 = window.ChaeksaPay && ChaeksaPay.주문서;
    a.href = 주문서 && 주문서.신청메일 ? 주문서.신청메일()
      : 'mailto:dl4431@naver.com?subject=' + encodeURIComponent('[책사] 출산택일 신청') + '&body=' + encodeURIComponent(TAEK_FORM);
    // 신청 단추(#btnTaekGo)는 사이트 신청서(taekil-apply.html)로 간다 — 주소 · 세 걸음 글은 index.html 정적 글 그대로(10-02 네이버폼 걷음).

    const k = $('btnTaekKakao');
    if (!k || !KAKAO_CHAT) return;
    k.classList.remove('hide');
    if ($('taekKakaoNote')) $('taekKakaoNote').classList.remove('hide');
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

  // 비망록(memo 탭 · 오늘 탭 알림 #todayMemo · 적는 칸 #memoQ)은 탭을 걷은 뒤 코드만 남아 있던 것을 10-02 개편 3묶음에서 지웠다. 기록 모듈 memo.js 는 그대로다.



  // ───── 인연이 오는 해 ─────
  let inyeonFor = null;

  // ── 너의 연애 스토리 — 과거를 맞히면 미래를 산다 ──
  // 무료: 과거 구간 찍기 + 현재 판. 유료(인연 시기 상품): 미래.
  // 과거와 미래가 같은 잣대라는 것이 이 화면의 값어치다 — 그래서 그 말을 화면에 적는다.
  let lsFor = null;
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
    택일:     ['검명', '때를 고르는'],   좌장:     ['태윤', '의논을 모으는'],
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
    box.querySelectorAll('.wt-taekil').forEach(a => a.addEventListener('click', () => { 택일원함 = 'report'; }));   // 10-02 「신청하기 →」는 택일 탭의 보고서 신청 칸으로
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
  // 서버 캐시의 「굽는 중」 자리표 — 유료 한 편 읽기(위 서버읽기)는 이 표시로 시작하는 글을 버린다.
  const BAKING표식 = '§BAKING§';
  // 의논(간명서) 굽기 · 기다림 · 그리기(간명예열 · mountGanmyeong · #gmBody)는 들어가는 화면이 없어 10-02 개편 3묶음에서 지웠다. 무료 화면은 LLM 을 부르지 않는다.


  // ── 너의 재물 스토리 — 연애 스토리와 같은 틀, 잣대만 돈 ──
  let msFor = null;

  let dohwaFor = null;


  // ───── 설정 ─────
  // 「비서가 답하는 방식」(깊게·균형·간결하게) 칸은 2026-09-13 에 뺐다(사장님 「빼버려」) —
  // 무료 의논이 LLM 을 안 쓰게 된 뒤로 하는 일이 없고, 유료는 설정과 상관없이 opus 다(ai.js modelFor).
  // 저장된 tier 값은 그대로 두고 안 읽는다.
  // 사용량 상자(오늘 브리핑·책사단의 글·좌장의 원국 해석)는 2026-09-13 에 뺐다 — 사장님 「다 삭제해」. 그 셋을 부르는 문 자체를 지웠다.
  // 10-02 개발용 칸(내 API 키 · 프록시 주소 · 저장 단추, index.html .devonly)은 주소에 ?dev=1 이 있을 때만 보인다.
  // 손님에게는 쓸 일이 없고, 남이 알려 준 프록시 주소를 넣으면 사주 정보가 엉뚱한 곳으로 갈 수 있다.
  const 개발자화면 = (() => { try { return new URLSearchParams(location.search).get('dev') === '1'; } catch (e) { return false; } })();
  function openSettings() {
    renderCloud();
    // 10-02 개편 3묶음 「내 결제」 — 로그인했으면 열 때마다 내 주문을 새로 읽어 줄마다 보인다(pay.js 내결제 · index.html #myPayList, #cloudIn 안).
    try {
      const C0 = window.ChaeksaCloud, P0 = window.ChaeksaPay;
      if (C0 && C0.enabled && C0.enabled() && C0.signedIn() && P0 && P0.내결제) P0.내결제($('myPayList'));
    } catch (e) {}
    document.querySelectorAll('#settings .devonly').forEach(el => el.classList.toggle('hide', !개발자화면));
    // 개발용 칸 값은 ai.js 가 읽는다. ai.js 는 탭별 꾸러미 ai 에 있어서, ?dev=1 로 설정을 열 때 아직 없으면 받은 뒤 채운다.
    const 칸채우기 = () => { const A = AI(), s = (A && A.settings) ? A.settings() : {}; $('apiKey').value = s.apiKey || ''; $('proxyUrl').value = s.proxyUrl || ''; };
    칸채우기(); $('settings').classList.remove('hide');
    if (개발자화면 && !AI()) 꾸러미받기('ai').then(칸채우기, () => {});
  }
  $('btnSettings').onclick = openSettings;
  // 상단 「로그인」 — 카카오 단추 하나만 있는 작은 창(10-02). 예전에는 설정 창을 열어 개발용 칸 · 비밀번호 칸이 먼저 보였다.
  // 이메일 로그인(메일 링크 · 심사 계정 비밀번호)은 「이메일 계정이 있어요」 → 설정 창의 이메일 칸으로 그대로 이어진다.
  // 로그인돼 있으면 단추는 숨는다(renderCloud).
  const closeLogin = () => { const m = $('loginSheet'); if (m) m.classList.add('hide'); };
  function 이메일로그인열기() {
    closeLogin(); openSettings();
    const box = $('cloudOut'); if (!box) return;
    const fold = box.querySelector('details.mailfold'); if (fold) fold.open = true;
    setTimeout(() => { try { box.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {} }, 50);
  }
  const bl = $('btnLogin');
  if (bl) bl.onclick = () => { const m = $('loginSheet'); if (m) m.classList.remove('hide'); else 이메일로그인열기(); };
  if ($('loginSheet')) $('loginSheet').onclick = (e) => { if (e.target === $('loginSheet')) closeLogin(); };
  if ($('btnCloseLogin')) $('btnCloseLogin').onclick = closeLogin;
  if ($('lnMailLogin')) $('lnMailLogin').onclick = (e) => { e.preventDefault(); 이메일로그인열기(); };
  if ($('btnKakaoLogin')) $('btnKakaoLogin').onclick = () => {
    const C = window.ChaeksaCloud;
    if (!C || !C.enabled || !C.enabled()) { closeLogin(); openSettings(); return; }   // 서버 준비 전 — 설정 창이 「아직 준비 중」을 말한다
    try { C.signInWith('kakao'); } catch (e) { closeLogin(); openSettings(); cloudMsg(e.message); }
  };
  $('btnCloseSettings').onclick = () => $('settings').classList.add('hide');
  $('btnSaveSettings').onclick = () => {
    const A = AI();
    if (!A || !A.settings) { $('settings').classList.add('hide'); return; }   // ai.js 를 못 받았으면 저장할 것이 없다
    const cur = A.settings();
    A.saveSettings({ apiKey: $('apiKey').value.trim(), tier: cur.tier || 'balanced', proxyUrl: $('proxyUrl').value.trim() });
    $('settings').classList.add('hide');
    if (R) { Object.keys(localStorage).filter(k => k.startsWith('chaeksa.brief.') || k.startsWith('chaeksa.profile.ai.')).forEach(k => localStorage.removeItem(k)); }
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

  /** 오늘이 한 해의 몇 번째 날인가 — 장면 변주를 날마다 돌리는 데 쓴다 */
  function 날번호() {
    const t0 = new Date(today.getFullYear(), 0, 0);
    return Math.floor((today - t0) / 86400000);
  }
  // ───── 랜딩 ─────
  function showLanding() {
    // 오늘 간지 칸(#lpGanji)과 계절 회의 그림(회의장면 · config.js CHAEKSA_COUNCIL_VAR)은 화면에서 걷은 뒤 코드만 남아 있던 것을 10-02 개편 3묶음에서 지웠다.
    // 랜딩의 열 사람 도열(#lpCorps)은 2026-09-12 걷었다.
    $('formCard').classList.add('hide');
    $('landing').classList.remove('hide');
    $('btnSettings').classList.add('hide');
    주소남기기('');   // 10-02 첫 화면 주소는 꼬리 없음
  }
  function showForm() {
    주소남기기('form');   // 10-02 입력 칸은 #form — 폰 「뒤로」가 앞 화면으로 간다
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
  $('btnStart').onclick = () => { 입력준비(null); enterOrLogin(); };   // 10-02 고른 콘텐츠 없이 — 입력 칸 맨 위는 처음 모양(「내 생년월일시」)
  $('btnStart2').onclick = enterOrLogin;
  // 09-25 사장님 「본인 프로필 저장 + 상대 프로필 저장으로 가자, 입구가 여러 개가 되잖아」 —
  // 첫 화면의 궁합 · 정통사주 · 컷씬 칸은 모두 같은 입구(첫 만남 → 그 사람)로 들어와 그 탭으로 간다. ssom.html 따로 폼 없음.
  // 10-02 곳 — 탭 안의 한 칸(홈의 「이번 주」 bhCard 등). 입력을 거쳐 오면 시간이 흐르니 탭과 함께 적어 두었다가 도착한 뒤 그 칸으로 내려간다.
  const 가는곳키 = 'chaeksa.goto', 가는칸키 = 'chaeksa.gotoSpot', 다음단계키 = 'chaeksa.ssomStageNext';
  // 사주 없이 읽는 탭(NO_PROFILE_TABS — 출산택일)은 생년월일을 묻지 않고 바로 연다(10-02 — 부모 본인 생년월일은 받을 까닭이 없다).
  // 원국이 없으면 탭이 든 #app 이 숨어 있다. 첫 화면 · 입력 칸을 접고 자리를 내준다(goHash 와 같은 일).
  function 바로열기(tab) {
    if (!profile) { $('landing').classList.add('hide'); $('formCard').classList.add('hide'); $('app').classList.remove('hide'); }
    go(tab);
  }
  // 10-02 생년월일은 필요한 만큼만 — 사용설명서는 그 사람 생년월일 하나만 쓴다. 내 입력 칸을 거치지 않고 그 사람 칸(사람 추가 창)부터 연다.
  const 그사람만탭 = ['pair'];
  // 「나」로 넣은 사람이 있는가. 사람 목록(people.js)이 없으면 옛 한 사람 저장(chaeksa.profile) = 나.
  const 나있음 = () => { const P = People(); return !P || !P.hasSelf || P.hasSelf(); };
  function 들어가기(tab, 곳) {
    if (NO_PROFILE_TABS.indexOf(tab) >= 0) { 바로열기(tab); return; }
    try { sessionStorage.setItem(가는곳키, tab); if (곳) sessionStorage.setItem(가는칸키, 곳); else sessionStorage.removeItem(가는칸키); } catch (e) {}
    const 그사람만 = 그사람만탭.indexOf(tab) >= 0;
    if (hasProfile() && profile) {
      // 그 사람만 넣어 둔 손님(사용설명서로 먼저 온 사람)이 내 것이 필요한 콘텐츠로 가면 — 그 사람 것으로 그리지 않고 내 생년월일부터 받는다.
      // (연애 속의 나를 결제하면 그 사람 것이 만들어지는 일이 없게)
      if (!그사람만 && !나있음() && 사람폼열기('me', tab, true)) return;
      도착(); return;
    }
    // 10-02 탭별 꾸러미 — 생년월일을 넣는 동안 그 탭 파일을 미리 받아 둔다(저장하고 나면 바로 열리게). 받지 못해도 그 탭을 열 때 다시 받는다.
    try { 꾸러미받기(tab).catch(() => {}); } catch (e) {}
    if (그사람만 && 사람폼열기('them', tab, true)) return;
    입력준비(tab);
    enterOrLogin();
  }
  // 10-02 입력 칸을 들어온 콘텐츠에 맞춘다 — 단추 말(상품 약속 장부 입력단추 칸: 「저장하고 예시 보기」 · 「다음 — 그 사람 생년월일」 …),
  // 맨 위 그림(홈에서 누른 그 칸 표지 · 원본) · 콘텐츠 이름 · 필요한 것(장부 필요 칸), 친구가 보낸 카드 링크(?from=card-…)로 왔으면 그 띠.
  // tab 이 없거나 장부에 없으면(장부를 못 받았어도) 처음 모양(「내 생년월일시」 · 「내 사주 보기」) 그대로.
  function 입력준비(tab) {
    const Y = window.ChaeksaYaksok, b = $('btnGo');
    if (b) { if (!b.dataset.base) b.dataset.base = b.textContent; b.textContent = (tab && Y && Y.입력단추(tab)) || b.dataset.base; }
    const 머리 = tab && Y && Y.입력머리 ? Y.입력머리(tab) : null, n = $('fcWhatN'), s = $('fcWhatS'), art = $('fcArt'), 띠 = $('fcFrom');
    if (n && s) {
      if (n.dataset.base == null) { n.dataset.base = n.textContent; s.dataset.base = s.textContent; }
      n.textContent = (머리 && 머리.이름) || n.dataset.base;
      s.textContent = 머리 && 머리.필요 ? '필요한 것 — ' + 머리.필요 : s.dataset.base;
    }
    const 표지 = 머리 && window.ChaeksaHomeCats && ChaeksaHomeCats.표지 ? ChaeksaHomeCats.표지(tab) : null;
    if (art) art.style.backgroundImage = 표지 ? 'url("' + 표지 + '")' : '';
    if (띠) {
      // 카드 링크는 ?go=탭&from=card-… 뿐이다(ssom-card.js) — 보낸 사람 이름 · 생일은 주소에 없어서 「친구」라고만 쓴다.
      let from = ''; try { from = new URLSearchParams(location.search).get('from') || ''; } catch (e) {}
      const 카드 = !!(머리 && 머리.이름 && /^card-[a-z]+$/.test(from));
      띠.classList.toggle('hide', !카드);
      띠.innerHTML = 카드 ? '친구가 보낸 <b>「' + escP(머리.이름) + '」</b>' + josa(머리.이름, '이에요', '예요').slice(머리.이름.length) + '. 내 생년월일시를 넣으면 나도 바로 볼 수 있어요.' : '';
    }
  }
  // 10-02 입력 칸을 그만두고 나갈 때(「← 홈」 · 로고 · 폰 「뒤로」) — 들고 있던 갈 곳과 단추 말 · 맨 위 모양을 내려놓는다.
  // 안 그러면 나중에 「내 생년월일 저장해 두기」로 들어와 저장해도 그때 고른 콘텐츠로 끌려간다.
  function 입력접기() {
    try { sessionStorage.removeItem(가는곳키); sessionStorage.removeItem(가는칸키); } catch (e) {}
    입력준비(null);
  }
  if ($('btnFormBack')) $('btnFormBack').onclick = 처음으로;
  function 도착() {
    let tab = null, 곳 = null;
    try { tab = sessionStorage.getItem(가는곳키); 곳 = sessionStorage.getItem(가는칸키); sessionStorage.removeItem(가는곳키); sessionStorage.removeItem(가는칸키); } catch (e) {}
    if (!tab || !document.querySelector('.tab[data-tab="' + tab + '"]')) return;
    // 10-02 홈 물음 칸 「결혼」 — 곳 「단계:결혼」 = 웹툰궁합의 그 단계를 미리 골라 둔다(renderSsom 이 그 사람을 고를 때 한 번 쓴다). 내려갈 칸은 단계 고르기.
    if (곳 && 곳.indexOf('단계:') === 0) { try { sessionStorage.setItem(다음단계키, 곳.slice(3)); } catch (e) {} 곳 = 'ssMore'; }
    if (곳) 홈자리 = 0;   // 보던 자리로 되감지 않는다 — 그 칸으로 간다
    go(tab);
    // 10-02 「무엇이 궁금하세요?」 칩(home-ask.js) — 곳 「회:N」 = 답이 정통사주 웹툰 N화에 있는 물음. 탭을 연 뒤 그 화부터 장면 보기로 간다(시작 단추와 같은 길 · ssom-vn.html ?h=N).
    const 회m = 곳 && /^회:(\d+)$/.exec(곳);
    if (회m) { if (tab === 'jeongtong' && profile) { try { sessionStorage.setItem('chaeksa.jtVn', JSON.stringify({ a: 궁합입력(profile) })); } catch (e) {} location.href = 'ssom-vn.html?h=' + 회m[1]; } return; }
    // 10-02 접힌 장(<details>) 안의 칸이면 펼친 채 내려간다 — 홈 물음 칸 「돈 · 일 · 건강 · 사람 사이」 → 정통사주 N장(jtChN, 「근거 보기」 안의 접힌 장).
    // 탭 내용은 go() 뒤에 그려지기도 한다(정통사주 장은 그린 뒤에야 생김) — 칸이 생길 때까지 0.2초마다 4초 동안 찾는다.
    // 10-02 탭별 꾸러미 — 그 탭 파일이 아직 오는 중이면 다 온 뒤부터 센다(느린 망에서 4초를 파일 받는 데 다 쓰지 않게). 홈 칸(이번 주 등)은 기다리지 않는다.
    if (곳) { let n = 0; const 찾기 = () => { const t = $(곳); if (!t || t.classList.contains('hide') || !t.offsetParent && t.tagName !== 'DETAILS') { if (++n < 20) setTimeout(찾기, 200); return; }
      for (let d = t; d; d = d.parentElement) if (d.tagName === 'DETAILS') d.open = true; setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }; (tab === 'home' ? Promise.resolve() : 꾸러미받기(tab).catch(() => {})).then(() => setTimeout(찾기, 0)); }
    // 그 사람이 아직 없으면 바로 그 사람 폼을 연다(궁합 둘)
    // 10-02 사용설명서는 「나」 아닌 사람이 하나라도 있으면 된다(그 사람만 넣어 둔 손님은 그 사람이 보는 사람이다). 궁합 둘은 보는 사람 말고 한 사람 더.
    if ((tab === 'ssom' || tab === 'chongnon' || tab === 'pair') && People()) {
      const me = People().active(), l = People().list();
      const 있음 = tab === 'pair' ? l.some(p => !p.isSelf) : l.some(p => !me || p.id !== me.id);
      if (!있음) setTimeout(() => 사람폼열기('them', tab, false), 250);
    }
  }
  window.책사들어가기 = 들어가기;
  window.책사사람추가 = () => { if (!사람폼열기('them', 'pair', false)) openPersonForm(null); };   // 그 사람 사용설명서(pair.js) — 아직 아무도 없을 때 「그 사람 생년월일 넣기」
  window.책사궁합고르기 = 궁합고르기;   // 10-02 사용설명서 끝 칸(pair.js 끝칸) → 웹툰궁합 · 정통궁합을 같은 그 사람으로
  window.책사사람칩 = 사람칩;   // 그 사람 사용설명서(pair.js)도 정통궁합 · 웹툰궁합과 같은 사람 칩(docs/79 4절)
  if ($('btnGunghap')) $('btnGunghap').onclick = () => 들어가기('ssom');
  if ($('btnJeongtong')) $('btnJeongtong').onclick = () => 들어가기('jeongtong');
  // 09-30 연애 속의 나 — 첫 화면 · 홈 맨 위 카드. 저장된 사람이 있으면 바로 탭, 없으면 입구(첫 만남)를 거쳐 탭으로.
  document.querySelectorAll('[data-love]').forEach(a => a.onclick = (e) => { e.preventDefault(); 들어가기('love'); });
  // 네 컷 그림(.lp-scene)의 칸 누르기는 10-02 그림과 함께 걷었다 — 첫 화면 · 홈은 분류 칸(home-cats.js)이 들어가기()를 부른다.
  // ?go=탭 처리는 파일 끝 「시작」으로 옮겼다(10-02). 여기서 하면 뒤의 showLanding · start 가 덮어써 홈 목록이 떴다.
  // 입력 컷 — 성별을 고르면 그림이 바뀐다(나: ss-me · ss-her / 그 사람: story-jigeum · story-sns)
  // 09-26 큰 판(1024) — 작은 판은 폼 폭에서 흐렸다. (주석을 줄 가운데 넣어 뒤가 잘렸던 것 고침 — feedback-edit-closing-quote 같은 종류)
  const 컷바꾸기 = (sel, cut, 그림) => { const g = $(sel), c = $(cut); if (!g || !c) return; const im = c.querySelector('img'), 새 = 'art/' + (그림[g.value] || 그림.F) + '.webp'; if (im.getAttribute('src') !== 새) { im.style.opacity = 0; setTimeout(() => { im.src = 새; im.style.opacity = 1; }, 150); } };
  // 첫 만남 입력 칸의 컷(#fcCut)은 10-02 걷었다(맨 위 그림 .fc-art 가 대신한다). 그 사람 칸(#pfCut)만 성별로 바뀐다.
  if ($('pfG')) $('pfG').addEventListener('change', () => { if (사람폼누구 !== 'me') 컷바꾸기('pfG', 'pfCut', { M: 'jt-13-heart-m', F: 'jt-13-heart-f' }); });   // 10-02 내 칸은 콘텐츠 표지 그대로

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
        // 09-26 사장님 「이름 넣을 때 일정 시간 지나면 홈으로 돌아가진다」 — 부팅 뒤 몇 초 만에 서버 병합이 끝나면 start()가 홈으로 보냈다.
        // 첫 만남 · 그 사람 폼을 열어 두었거나 입력 칸에 커서가 있으면 화면을 건드리지 않는다(다음 부팅 때 반영).
        const 입력중 = !$('formCard').classList.contains('hide') || !$('personForm').classList.contains('hide') || (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName));
        const saved = localStorage.getItem(KEY);
        const 다시그림 = !!saved && !입력중;
        // 10-02 화면마다 주소 — 다시 그리는 동안 주소를 안 건드린다. start() 가 홈으로 보내도 주소(#탭)는 보던 장 그대로라,
        // 바로 goHash 로 그 장에 돌아온다(전에는 서버 병합이 끝나면 보던 장에서 홈으로 튕겼다). 결제하려다 로그인하고 막 돌아온 손님도 이 길.
        주소없이(() => {
          if (다시그림) { try { start(JSON.parse(saved)); } catch (e) {} }
          else if (입력중) { renderPeopleBtn(); }
          if (다시그림 || 복귀대기) { try { goHash(true); } catch (e) {} }
          if (복귀대기) { try { 복귀고르기(); } catch (e) {} }
        });
        주소맞추기();
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
  // 10-02 넣어 둔 사람이 없는데 #탭 주소로 왔으면(카톡으로 받은 주소 등) ?go= 처럼 입력 칸을 거쳐 그 탭으로. #form 이면 입력 칸.
  if (!booted) { try { const r = 경로(location.hash); if (r === 'form') showForm(); else if (r && NO_PROFILE_TABS.indexOf(r) < 0) 들어가기(r); } catch (e) {} }
  // ?go=탭 — love.html · jeongtong.html · ssom.html · gunghap-chongnon.html 이 보낸 손님은 그 탭으로 곧장 간다.
  // 사람이 있으면 그 탭, 없으면 입력 칸(넣고 나면 그 탭). 출산택일은 입력 없이 바로.
  // 맨 끝에서 한다 — 앞에서 하면 위의 showLanding · start 가 덮어써 홈 목록이 떴다(10-02).
  // 해시(#탭)로 이미 장이 열렸으면(결제 · 로그인 복귀) 그쪽이 먼저다.
  try {
    const g = new URLSearchParams(location.search).get('go');
    const 해시탭 = (location.hash || '').replace(/^#/, '').replace(/^sheet-[a-z]+$/, 'sheet');
    const 있는탭 = (t) => !!t && /^[a-z][\w-]*$/.test(t) && !!document.querySelector('.tab[data-tab="' + t + '"]');
    if (있는탭(g) && !있는탭(해시탭)) {
      // 새로고침해도 또 끌려가지 않게 주소에서 go 만 뗀다(from 같은 다른 꼬리는 그대로).
      try { const q = new URLSearchParams(location.search); q.delete('go'); const s = q.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {}
      들어가기(g);
    }
  } catch (e) {}
  복귀고르기();           // 결제하려다 로그인하러 떠났으면 그때 고른 사람을 다시 고른다
  주소시작();             // 10-02 여기서부터 화면을 옮길 때마다 주소가 따라간다(위 「화면마다 주소」)
  // 서버에 저장된 게 있으면 가져온다 (없으면 조용히 넘어간다)
  if (window.ChaeksaCloud && ChaeksaCloud.signedIn()) cloudSync(false);
  // 여기까지 오면 앱이 다 섰다 — index.html 머리의 오류 문지기가 이 표시를 보고 「새로 고침」 띠를 띄울지 정한다(10-02).
  // 첫 화면 표시(data-boot)를 뗀다 — 여기서부터는 위에서 app.js 가 정한 화면이 그대로 보인다(10-02 첫 화면 깜빡임 막기, index.html 머리 · style.css).
  document.documentElement.removeAttribute('data-boot');
  window.ChaeksaReady = true;
})();
