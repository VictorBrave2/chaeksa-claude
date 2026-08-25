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
  const PKEY = 'chaeksa.profile', CKEY = 'chaeksa.consults';
  const SKEY = 'chaeksa.sync';                    // 마지막 동기화 시각

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
  async function sendMagicLink(addr) {
    if (!enabled()) throw new Error('서버 동기화가 아직 설정되지 않았습니다.');
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
  function signOut() { clearSession(); localStorage.removeItem(SKEY); }

  /** 카카오·구글 등 소셜 로그인 — Supabase가 대신 처리하고 토큰을 주소에 붙여 돌려보낸다.
   *  네이버는 Supabase가 지원하지 않아 넣지 않았다. */
  function signInWith(provider) {
    if (!enabled()) throw new Error('서버 동기화가 아직 설정되지 않았습니다.');
    const back = encodeURIComponent(location.origin + location.pathname);
    location.href = CFG.url + '/auth/v1/authorize?provider=' + provider + '&redirect_to=' + back;
  }

  /** 매직링크로 돌아왔을 때 주소에 붙은 토큰을 받아 저장 */
  function captureRedirect() {
    if (!location.hash || location.hash.indexOf('access_token=') < 0) return false;
    const p = new URLSearchParams(location.hash.slice(1));
    const s = {
      access_token: p.get('access_token'),
      refresh_token: p.get('refresh_token'),
      expires_in: parseInt(p.get('expires_in') || '3600', 10),
      token_type: p.get('token_type'),
    };
    saveSession(s);
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  }

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
      const localAt = localStorage.getItem(SKEY) || '';
      const remoteAt = remote.updated_at || '';
      const hasLocal = !!localStorage.getItem(PKEY);
      if (remote.birth && Object.keys(remote.birth).length && (!hasLocal || remoteAt > localAt)) {
        const b = Object.assign({}, remote.birth, remote.name ? { name: remote.name } : {});
        jset(PKEY, b);
        if (remote.ai_profile) {
          const k = `chaeksa.profile.ai.${b.year}${b.month}${b.day}.${b.hour}.${b.gender}`;
          localStorage.setItem(k, remote.ai_profile);
        }
        changed = true;
      }
    }

    // 상담: id 기준 병합, updated_at이 최신인 쪽을 남긴다
    const cs = await api('/rest/v1/consults?select=*&order=updated_at.desc');
    if (Array.isArray(cs)) {
      const local = jget(CKEY, []);
      const byId = {};
      local.forEach(c => { byId[c.id] = c; });
      let merged = false;
      cs.forEach(r => {
        const cur = byId[r.id];
        const remoteRec = {
          id: r.id, question: r.question, createdAt: r.created_at,
          domainKey: r.domain_key, domainLabel: r.domain_label, targetLabel: r.target_label,
          topId: r.top_id, topTitle: r.top_title, topP: r.top_p,
          action: r.action, metric: r.metric,
          first: r.first_answer || {}, checkins: r.checkins || [], logs: r.logs || [],
          _at: r.updated_at,
        };
        if (!cur || (r.updated_at || '') > (cur._at || '')) { byId[r.id] = remoteRec; merged = true; }
      });
      if (merged) {
        const list = Object.values(byId).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        jset(CKEY, list);
        changed = true;
      }
    }
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

    const list = jget(CKEY, []);
    if (list.length) {
      await api('/rest/v1/consults?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(list.map(c => ({
          id: c.id, user_id: uid, question: c.question,
          domain_key: c.domainKey || null, domain_label: c.domainLabel || null, target_label: c.targetLabel || null,
          top_id: c.topId || null, top_title: c.topTitle || null, top_p: c.topP || null,
          action: c.action || null, metric: c.metric || null,
          first_answer: c.first || {}, checkins: c.checkins || [], logs: c.logs || [],
          created_at: c.createdAt || new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        }))),
      });
    }
    localStorage.setItem(SKEY, new Date().toISOString());
    return true;
  }

  let timer = null;
  function pushSoon() {                       // 저장이 잦으므로 묶어서 보낸다
    if (!signedIn()) return;
    clearTimeout(timer);
    timer = setTimeout(() => push().catch(() => {}), 1500);
  }

  global.ChaeksaCloud = {
    enabled, signedIn, email, sendMagicLink, signInWith, signOut, captureRedirect, me,
    pull, push, pushSoon, session,
  };
})(window);
