/* 책사 서버 동기화 v1 — Supabase (SDK 없이 REST 직접 호출)
 *
 * 로그인은 이메일 매직링크만 쓴다. 비밀번호를 아예 만들지 않으므로
 * 비밀번호가 새어나갈 일이 없다.
 *
 * 저장되는 것: 원국 입력값, 이름, 비서의 고정 원국 해석, 심층 상담 기록(가설·판단·관측 지표)
 * 저장되지 않는 것: 채팅 대화, 브리핑 캐시(매일 새로 만들므로 옮길 이유가 없다)
 */
(function (global) {
  'use strict';
  const CFG = global.CHAEKSA_SUPABASE || {};     // { url, anonKey }  ← config.js에서 주입
  const AKEY = 'chaeksa.auth';
  const PKEY = 'chaeksa.profile', CKEY = 'chaeksa.consults', PEOPLE = 'chaeksa.people';
  const SKEY = 'chaeksa.sync';                    // 마지막 동기화 시각
  const PAT  = 'chaeksa.profileAt';               // 이 기기에서 원국을 마지막으로 고친 시각
  const GONE = 'chaeksa.people.gone';             // 이 기기에서 지웠는데 서버에서 아직 못 지운 사람 id
  const ts = (v) => { const t = Date.parse(v || ''); return isNaN(t) ? 0 : t; };

  const enabled = () => !!(CFG.url && CFG.anonKey);
  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const jset = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ───────── 세션 ─────────
  const session = () => jget(AKEY, null);
  function saveSession(s) {
    if (!s || !s.access_token) return;
    s.expires_at = s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600));
    jset(AKEY, s);
  }
  function clearSession() { localStorage.removeItem(AKEY); }
  const signedIn = () => !!(session() && session().access_token);
  const email = () => (session() && session().user && session().user.email) || null;

  async function api(path, opts = {}) {
    const s = await freshSession();
    const headers = Object.assign({
      apikey: CFG.anonKey,
      'content-type': 'application/json',
    }, opts.headers || {});
    if (s && s.access_token) headers.Authorization = 'Bearer ' + s.access_token;
    const res = await fetch(CFG.url + path, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try { const j = await res.json(); msg = j.msg || j.message || j.error_description || j.error || msg; } catch (e) {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  /** 만료 5분 전이면 갱신 */
  async function freshSession() {
    const s = session();
    if (!s) return null;
    const now = Math.floor(Date.now() / 1000);
    if (s.expires_at && s.expires_at - now > 300) return s;
    if (!s.refresh_token) return s;
    try {
      const res = await fetch(CFG.url + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: CFG.anonKey, 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: s.refresh_token }),
      });
      if (!res.ok) { clearSession(); return null; }
      const j = await res.json();
      saveSession(j);
      return j;
    } catch (e) { return s; }
  }

  // ───────── 로그인 / 로그아웃 ─────────
  // 「이 기기에서 로그인을 시작했다」는 표시(2026-09-22 점검 critic-9).
  // 주소 뒤 #access_token=… 은 누가 만든 토큰인지 알 수 없다 — 남이 자기 토큰을 붙인 링크를 보내면,
  // 받는 순간 이 기기의 사주와 사람 목록이 그 사람 계정으로 올라간다. 그래서 로그인하러 떠날 때 무작위 값과 시각을
  // 적어 두고, 돌아온 토큰은 그 표시가 있을 때만 받는다. Supabase 의 옛 방식(implicit)은 우리 값을 되돌려 주지 않아서
  // 값끼리 맞춰 보지는 못한다 — 표시가 있는가 + 시간 안인가로 본다. 카카오는 10분, 메일 링크는 링크 수명(1시간)까지.
  const LOGIN = 'chaeksa.login';
  const 로그인한도 = { oauth: 10 * 60 * 1000, email: 60 * 60 * 1000 };
  function 로그인표시(kind) {
    try {
      let n = String(Math.random()).slice(2) + Date.now();
      try { const a = new Uint8Array(16); crypto.getRandomValues(a); n = Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(''); } catch (_) {}
      jset(LOGIN, { n, at: Date.now(), kind });
    } catch (e) {}
  }
  let 로그인거절 = false;   // 표시 없이 온 토큰을 버렸다 — 앱이 「다시 로그인해 주세요」를 띄운다
  async function sendMagicLink(addr) {
    if (!enabled()) throw new Error('서버 동기화가 아직 설정되지 않았습니다.');
    로그인표시('email');
    // REST에서는 복귀 주소를 쿼리스트링 redirect_to 로 넘긴다 (SDK의 emailRedirectTo와 같은 것)
    const back = encodeURIComponent(location.origin + location.pathname);
    const res = await fetch(CFG.url + '/auth/v1/otp?redirect_to=' + back, {
      method: 'POST',
      headers: { apikey: CFG.anonKey, 'content-type': 'application/json' },
      body: JSON.stringify({ email: addr, create_user: true }),
    });
    if (!res.ok) {
      let msg = '메일을 보내지 못했습니다.';
      try { const j = await res.json(); msg = j.msg || j.message || msg; } catch (e) {}
      throw new Error(msg);
    }
    return true;
  }
  /** 이메일 + 비밀번호 로그인(2026-09-15). 토스 카드사 심사관은 카카오·매직링크로는 들어올 수 없어서
   *  「심사관이 확인할 수 있는 테스트 계정(아이디/비밀번호)」이 필요하다(토스 FAQ 10). 계정은 사장님이
   *  Supabase 대시보드(Authentication → Add user, 비밀번호 지정)에서 만든다 — 여기서는 만들지 않는다. */
  async function signInWithPassword(addr, pw) {
    if (!enabled()) throw new Error('서버 동기화가 아직 설정되지 않았습니다.');
    const res = await fetch(CFG.url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: CFG.anonKey, 'content-type': 'application/json' },
      body: JSON.stringify({ email: addr, password: pw }),
    });
    if (!res.ok) {
      let msg = '로그인하지 못했습니다.';
      try { const j = await res.json(); msg = j.msg || j.error_description || j.message || msg; } catch (e) {}
      throw new Error(msg);
    }
    saveSession(await res.json());
    return true;
  }
  // 출산택일 신청서 초안·접수 요약·로그인 복귀 표시 — 로그아웃·탈퇴 때 이 기기에 남기지 않는다(2026-09-11 검토).
  const 신청지움 = () => {
    try { ['chaeksa.taekil.draft', 'chaeksa.taekil.sent', 'chaeksa.return'].forEach((k) => localStorage.removeItem(k)); } catch (_) {}
  };
  function signOut() { clearSession(); localStorage.removeItem(SKEY); 신청지움(); }

  /** 카카오·구글 등 소셜 로그인 — Supabase가 대신 처리하고 토큰을 주소에 붙여 돌려보낸다.
   *  네이버는 Supabase가 지원하지 않아 넣지 않았다. */
  function signInWith(provider) {
    if (!enabled()) throw new Error('서버 동기화가 아직 설정되지 않았습니다.');
    const back = encodeURIComponent(location.origin + location.pathname);
    로그인표시('oauth');
    location.href = CFG.url + '/auth/v1/authorize?provider=' + provider + '&redirect_to=' + back;
  }

  /** 로그인(카카오·매직링크)에서 돌아왔을 때 주소에 붙은 토큰을 받아 저장.
   *  이 기기에서 시작한 로그인일 때만 받는다(위 로그인표시). 아니면 토큰을 버리고 주소만 치운다. */
  function captureRedirect() {
    if (!location.hash || location.hash.indexOf('access_token=') < 0) return false;
    const p = new URLSearchParams(location.hash.slice(1));
    const 표시 = jget(LOGIN, null);
    try { localStorage.removeItem(LOGIN); } catch (_) {}
    // 받든 버리든 토큰은 주소에 남기지 않는다(뒤로 가기·공유·방문 기록에 실려 나간다).
    history.replaceState(null, '', location.pathname + location.search);
    const 한도 = 로그인한도[(표시 && 표시.kind) || 'oauth'] || 로그인한도.oauth;
    const 지남 = 표시 && typeof 표시.at === 'number' ? Date.now() - 표시.at : NaN;
    if (!(지남 > -60 * 1000 && 지남 < 한도)) { 로그인거절 = true; return false; }
    const s = {
      access_token: p.get('access_token'),
      refresh_token: p.get('refresh_token'),
      expires_in: parseInt(p.get('expires_in') || '3600', 10),
      token_type: p.get('token_type'),
    };
    saveSession(s);
    return true;
  }
  /** 방금 captureRedirect 가 표시 없는 토큰을 버렸는가 */
  const refusedLogin = () => 로그인거절;

  async function me() {
    const j = await api('/auth/v1/user');
    const s = session(); if (s) { s.user = j; jset(AKEY, s); }
    return j;
  }

  // ───────── 동기화 ─────────
  /** 서버 → 로컬. 서버가 더 최신이면 로컬을 덮어쓴다. */
  async function pull() {
    if (!enabled() || !signedIn()) return { changed: false };
    let changed = false;

    const rows = await api('/rest/v1/profiles?select=*');
    const remote = rows && rows[0];
    if (remote) {
      const localAt = ts(localStorage.getItem(PAT));      // 이 기기의 마지막 수정 시각
      const remoteAt = ts(remote.updated_at);
      const hasLocal = !!localStorage.getItem(PKEY);
      if (remote.birth && Object.keys(remote.birth).length && (!hasLocal || remoteAt > localAt)) {
        const b = Object.assign({}, remote.birth, remote.name ? { name: remote.name } : {});
        jset(PKEY, b);
        localStorage.setItem(PAT, remote.updated_at || new Date().toISOString());
        if (remote.ai_profile) {
          const k = `chaeksa.profile.ai.${b.year}${b.month}${b.day}.${b.hour}.${b.gender}`;
          localStorage.setItem(k, remote.ai_profile);
        }
        changed = true;
      }
    }

    // 사람들: id 기준 병합 (로컬에 더 최근 수정이 있으면 로컬이 이긴다)
    // 이 기기에서 지운 사람은 서버에서 먼저 지우고, 못 지웠으면 되살리지 않는다(아래 removePerson).
    await flushGone().catch(() => {});
    try {
      const ps = await api('/rest/v1/people?select=*&order=updated_at.desc');
      if (Array.isArray(ps)) {
        const local = jget(PEOPLE, []);
        const byId = {};
        local.forEach(x => { byId[x.id] = x; });
        const gone = jget(GONE, []);
        let merged = false;
        ps.forEach(r => {
          if (gone.indexOf(r.id) >= 0) return;
          const cur = byId[r.id];
          if (!cur || ts(r.updated_at) > ts(cur._at)) {
            byId[r.id] = {
              id: r.id, name: r.name, relation: r.relation || '기타', isSelf: !!r.is_self,
              birth: r.birth || {}, createdAt: r.created_at, _at: r.updated_at,
            };
            if (r.ai_profile) {
              const b = r.birth || {};
              localStorage.setItem(`chaeksa.profile.ai.${b.year}${b.month}${b.day}.${b.hour}.${b.gender}`, r.ai_profile);
            }
            merged = true;
          }
        });
        if (merged) { jset(PEOPLE, Object.values(byId)); changed = true; }
      }
    } catch (e) { /* people 표가 아직 없으면 조용히 넘어간다 */ }

    // 상담내역 내려받기도 함께 지웠다. consults 표는
    // server/migrate-14-consults-drop.sql 이 지운다.
    localStorage.setItem(SKEY, new Date().toISOString());
    return { changed };
  }

  /** 로컬 → 서버 */
  async function push() {
    if (!enabled() || !signedIn()) return false;
    const s = await freshSession();
    const uid = s && s.user && s.user.id ? s.user.id : (await me()).id;

    const p = jget(PKEY, null);
    if (p) {
      const aiKey = `chaeksa.profile.ai.${p.year}${p.month}${p.day}.${p.hour}.${p.gender}`;
      await api('/rest/v1/profiles?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify([{
          id: uid, name: p.name || null, birth: p,
          ai_profile: localStorage.getItem(aiKey) || null,
          updated_at: new Date().toISOString(),
        }]),
      });
    }

    await flushGone().catch(() => {});   // 못 지운 사람이 남아 있으면 이때 다시 지운다
    const people = jget(PEOPLE, []);
    if (people.length) {
      try {
        await api('/rest/v1/people?on_conflict=id', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify(people.map(x => {
            const b = x.birth || {};
            return {
              id: x.id, user_id: uid, name: x.name, relation: x.relation || null,
              is_self: !!x.isSelf, birth: b,
              ai_profile: localStorage.getItem(`chaeksa.profile.ai.${b.year}${b.month}${b.day}.${b.hour}.${b.gender}`) || null,
              created_at: x.createdAt || new Date().toISOString().slice(0, 10),
              updated_at: new Date().toISOString(),
            };
          })),
        });
      } catch (e) { /* people 표가 아직 없으면 넘어간다 */ }
    }

    // 상담내역 밀어올리기를 지웠다(2026-08-31). 심층 상담은 v390 에 없앤 기능인데
    // 동기화만 남아 매 세션 개인 데이터를 실어 나르고 있었다.
    // 채점 때와 같다 — 읽는 코드가 없으면 모을 이유도 없다.
    const now = new Date().toISOString();
    if (people.length) { people.forEach(x => { x._at = now; }); jset(PEOPLE, people); }
    if (p) localStorage.setItem(PAT, now);
    localStorage.setItem(SKEY, now);
    return true;
  }

  // ───────── 한 사람 지우기 (2026-09-22 점검 critic-3) ─────────
  // 예전엔 이 기기에서만 지웠다. push 는 남은 사람만 올리고, 다음에 앱을 열면 pull 이 「서버에는 있고 여기엔 없는 사람」을
  // 도로 넣었다 — 지운 사람이 되살아나고, 그 사람 생년월일도 서버에 그대로 남았다.
  // 이제 서버 people 행도 지운다(RLS 가 본인 행만 허용 — server/schema-3.sql). 못 지웠으면(오프라인·로그아웃)
  // 이 기기에 id 를 적어 두고(GONE) 다음 동기화 때 다시 지운다. 그 사이 pull 은 그 사람을 되살리지 않는다.
  async function flushGone() {
    if (!enabled() || !signedIn()) return false;
    const gone = jget(GONE, []);
    if (!Array.isArray(gone) || !gone.length) return true;
    const left = [];
    for (const id of gone) {
      try {
        await api('/rest/v1/people?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
        // 토큰 갱신이 막혀 세션이 지워졌으면 이 요청은 익명으로 나갔다 — RLS 가 0줄을 지우고도 204 를 준다. 지운 걸로 치지 않는다.
        if (!signedIn()) left.push(id);
      } catch (e) { left.push(id); }
    }
    if (left.length) jset(GONE, left); else localStorage.removeItem(GONE);
    return !left.length;
  }
  /** 이 기기에서 지운 사람을 서버에서도 지운다. 실패해도 던지지 않는다(앱은 그대로 간다). */
  async function removePerson(id) {
    if (!id) return false;
    try {
      const gone = jget(GONE, []);
      const 목록 = Array.isArray(gone) ? gone : [];
      if (목록.indexOf(id) < 0) { 목록.push(id); jset(GONE, 목록); }
      return await flushGone();
    } catch (e) { return false; }
  }

  /** 서버에 저장된 내 데이터와 계정 자체를 지운다 (server/schema-2.sql의 delete_me) */
  async function deleteAccount() {
    if (!enabled() || !signedIn()) throw new Error('로그인 상태가 아닙니다.');
    await api('/rest/v1/rpc/delete_me', { method: 'POST', body: '{}' });
    clearSession();
    localStorage.removeItem(SKEY);
    localStorage.removeItem(PAT);
    localStorage.removeItem(GONE);
    신청지움();
    return true;
  }

  let timer = null;
  function pushSoon() {                       // 저장이 잦으므로 묶어서 보낸다
    if (!signedIn()) return;
    clearTimeout(timer);
    timer = setTimeout(() => push().catch(() => {}), 1500);
  }

  /** AI 프록시에 실어 보낼 토큰. 만료 직전이면 갱신해서 준다. */
  async function token() {
    const s = await freshSession();
    return (s && s.access_token) || null;
  }

  global.ChaeksaCloud = {
    enabled, signedIn, email, sendMagicLink, signInWithPassword, signInWith, signOut, deleteAccount, captureRedirect, refusedLogin, me, api,
    pull, push, pushSoon, removePerson, session, token,
  };
})(window);
