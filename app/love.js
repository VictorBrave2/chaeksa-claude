/* 연애 속의 나 — 앱 탭(data-tab="love"). 09-30 사장님 「프로필 연동해야지 머하노 아예 다른창을 만들어놨네」 — 저장된 사람(profile)으로 바로 돈다. 생일을 다시 묻지 않는다.
 * 계산 · 질문 · 답은 비공개 서버가 한다(이 파일엔 판정 · 가중치 없음). 이 파일은 보여 주고 「맞아요 / 아니에요」만 보낸다.
 * 같은 사람 결과는 이 기기에 남겨 두고 다시 열면 그대로 보여 준다(다시 부르지 않음). 생일은 주소에 싣지 않는다(POST 본문). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var 동의키 = 'chaeksa.loveConsent', 결과키 = 'chaeksa.love.';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 읽기(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function 쓰기(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function 생일(p) {
    var h = p.hour == null || p.hour === '' ? null : +p.hour;
    return { year: +p.year, month: +p.month, day: +p.day, hour: h, minute: h == null ? null : +(p.minute || 0), gender: p.gender === 'F' ? 'F' : 'M',
      longitude: p.longitude == null ? null : +p.longitude, tzOffset: p.tzOffset == null ? null : +p.tzOffset };
  }
  function 표(b) { return [b.year, b.month, b.day, b.hour, b.minute, b.gender, b.longitude, b.tzOffset].join('|'); }
  // 로그인 표(토큰)를 실어 보낸다 — 서버는 카카오로 로그인한 사람만 질문 · 답을 만든다(09-30 사장님)
  function post(path, body) {
    var C = global.ChaeksaCloud;
    return Promise.resolve(C && C.token ? C.token() : null).catch(function () { return null; }).then(function (t) {
      var h = { 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t;
      return fetch(API + path, { method: 'POST', headers: h, body: JSON.stringify(body) })
        .catch(function () { throw new Error('연결이 끊겼어요. 잠시 뒤 다시 해 주세요.'); });   // 끊김 · 시간 초과도 우리말로
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.error || '잠시 뒤 다시 해 주세요.'); er.status = r.status; throw er; } return j; }); });
  }

  function 목록(box, 저장, 키) {
    var html = '', sec = null;
    저장.items.forEach(function (it) {
      if (it.section !== sec) { sec = it.section; html += '<h3 class="doc-h">' + esc(sec) + '</h3>'; }
      var 답 = it.a ? '<p style="margin:0">' + esc(it.a) + '</p>' : '<p class="hint" style="margin:0">답을 쓰는 중이에요…</p>';
      var fb = '';
      if (it.a) {
        var v = (저장.fb || {})[it.id];
        fb = '<p class="hint" style="margin:10px 0 0">실제 나와 <button class="btn ghost small" data-id="' + esc(it.id) + '" data-v="yes"' + (v === 'yes' ? ' style="font-weight:700"' : '') + '>' + (v === 'yes' ? '✓ ' : '') + '맞아요</button> <button class="btn ghost small" data-id="' + esc(it.id) + '" data-v="no"' + (v === 'no' ? ' style="font-weight:700"' : '') + '>' + (v === 'no' ? '✓ ' : '') + '아니에요</button></p>';
      }
      html += '<section class="card"><p style="margin:0 0 6px"><b>' + esc(it.q) + '</b></p>' + 답 + fb + '</section>';
    });
    box.innerHTML = html;
    box.querySelectorAll('button[data-v]').forEach(function (b) {
      b.onclick = function () {
        저장.fb = 저장.fb || {}; 저장.fb[b.getAttribute('data-id')] = b.getAttribute('data-v'); 쓰기(키, 저장); 목록(box, 저장, 키);
        post('/api/love-feedback', { runId: 저장.runId, id: b.getAttribute('data-id'), value: b.getAttribute('data-v') }).catch(function () {});
      };
    });
  }

  function 그리기(el, profile) {
    if (!el) return;
    if (!profile || !profile.year) {
      el.innerHTML = '<section class="card"><h2>사랑할 때만 나오는 당신</h2><p class="hint">내 생년월일시를 먼저 저장해 주세요.</p></section>';
      return;
    }
    var b = 생일(profile), 키 = 결과키 + 표(b), 저장 = 읽기(키);
    var 이름 = profile.name ? esc(profile.name) + ' · ' : '';
    el.innerHTML = '<section class="card"><h2>사랑할 때만 나오는 당신</h2>'
      + '<p class="hint" style="margin:0 0 10px">' + 이름 + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? ' (시간 모름)' : ' ' + b.hour + ':' + String(b.minute).padStart(2, '0')) + ' 기준으로, 당신에게 해당할 연애 행동 질문만 골라 답해 드려요. 지금은 무료이고, 카카오 계정 하나에 한 사람 한 번 만들 수 있어요. 만든 결과는 폰 · PC 어디서 열어도 같아요.</p>'
      + '<div id="lvHead"></div><p class="hint" id="lvSt" style="margin:8px 0 0"></p></section>'
      + '<p class="hint" id="lvAbout" style="margin:0 0 6px"' + (저장 ? '' : ' hidden') + '>답은 태어난 날에서 계산한 행동 경향이라 틀릴 수 있어요. 질문마다 「맞아요 / 아니에요」를 눌러 주시면 더 정확하게 고쳐 나갑니다.</p>'
      + '<div id="lvList"></div>';
    var head = el.querySelector('#lvHead'), st = el.querySelector('#lvSt'), list = el.querySelector('#lvList'), about = el.querySelector('#lvAbout');
    if (저장 && 저장.items && 저장.items.every(function (it) { return it.a; })) { 목록(list, 저장, 키); return; }
    // 09-30 사장님 「카카오로그인 해야만 열리는건 맞지?」 — 새로 만드는 건 로그인한 사람만(이미 받은 결과는 로그인 없이도 보인다)
    var C = global.ChaeksaCloud;
    if (!C || !C.enabled() || !C.signedIn()) {
      head.innerHTML = '<p class="hint" style="margin:0 0 10px">카카오로 로그인하면 열려요. 로그인하고 돌아오면 이 화면으로 다시 와요.</p>'
        + '<button class="btn kakao" id="lvKakao" style="width:100%"><span>💬</span>카카오로 로그인</button>';
      el.querySelector('#lvKakao').onclick = function () {
        try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, hash: '#love', pick: null, at: Date.now() })); } catch (e) {}
        try { C.signInWith('kakao'); } catch (e) { try { localStorage.removeItem('chaeksa.return'); } catch (x) {} st.textContent = '로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.'; }
      };
      return;
    }
    // 질문은 받았는데 답이 덜 왔으면(끊김) 답만 다시 받는다 — 질문부터 다시 하면 한 번 더 쓴 것이 된다(한 사람 · 횟수 제한 09-30)
    var 덜됨 = !!(저장 && 저장.items && 저장.items.length && 저장.runId && 저장.sig);
    if (덜됨) { about.hidden = false; 목록(list, 저장, 키); }
    var 동의 = 읽기(동의키) === true;
    head.innerHTML = (동의 ? '' : '<label class="hint" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 10px"><input type="checkbox" id="lvOk" style="margin-top:5px;width:auto;flex:0 0 auto"><span>생년월일시와 「맞아요 / 아니에요」 응답을 이 콘텐츠를 고치는 데 쓰는 것에 동의해요. 이름·연락처는 보내지 않아요. <a href="privacy.html">개인정보 처리방침</a></span></label>')
      + '<button class="btn" id="lvGo" style="width:100%">' + (덜됨 ? '답 마저 받기' : '내 연애 질문 받기') + '</button>';
    var timer = null;
    function 알림(msg, err) { clearInterval(timer); st.textContent = msg; st.style.color = err ? 'var(--seal, #8c2f23)' : ''; }
    function 초(msg) { var s = 0; 알림(msg); timer = setInterval(function () { s += 1; st.textContent = msg + ' (' + s + '초)'; }, 1000); }
    function 채우기(답들, msg) {
      var A = {}; (답들 || []).forEach(function (it) { A[it.id] = it.a; });
      저장.items.forEach(function (it) { it.a = A[it.id] || '답을 쓰지 못했어요.'; });
      쓰기(키, 저장); head.innerHTML = ''; 알림(msg || '다 됐어요. 질문마다 실제 나와 맞는지 눌러 주세요.'); 목록(list, 저장, 키);
    }
    function 답받기(msg) {
      초(msg);
      return post('/api/love-answers', { runId: 저장.runId, birth: b, sig: 저장.sig, items: 저장.items.map(function (it) { return { id: it.id, section: it.section, q: it.q }; }) }).then(function (r) {
        채우기(r.items, r.saved ? '이 카카오 계정으로 받은 답을 불러왔어요. 질문마다 실제 나와 맞는지 눌러 주세요.' : null);
      });
    }
    el.querySelector('#lvGo').onclick = function () {
      if (!동의) { var ok = el.querySelector('#lvOk'); if (!ok || !ok.checked) return 알림('안내에 동의해 주세요.', true); 동의 = true; 쓰기(동의키, true); }
      var btn = el.querySelector('#lvGo'); btn.disabled = true;
      var 일 = 덜됨 ? 답받기('답을 쓰는 중이에요. 1분 남짓 걸려요.') : (초('당신에게 맞는 질문을 고르는 중이에요. 1분 남짓 걸려요.'), post('/api/love-questions', { consent: true, birth: b }).then(function (r) {
        저장 = { runId: r.runId, sig: r.sig, items: r.items.map(function (it) { return { id: it.id, section: it.section, q: it.q, a: '' }; }), fb: {} };
        쓰기(키, 저장); 덜됨 = true; about.hidden = false; 목록(list, 저장, 키);
        // 이 카카오 계정으로 이미 만든 결과(다른 기기 포함)면 새로 만들지 않고 그대로 꺼내 온다(09-30)
        if (r.saved && r.answers && r.answers.length) return 채우기(r.answers, '이 카카오 계정으로 만든 결과를 불러왔어요. 질문마다 실제 나와 맞는지 눌러 주세요.');
        return 답받기(r.saved ? '이 카카오 계정으로 만든 질문을 불러왔어요. 답을 쓰는 중이에요. 1분 남짓 걸려요.' : '질문 ' + r.items.length + '개를 골랐어요. 답을 쓰는 중이에요. 1분 남짓 더 걸려요.');
      }));
      일.catch(function (e) {
        알림(e.message, true); btn.disabled = false;
        if (덜됨 && e.status === 400) { 덜됨 = false; 저장 = null; try { localStorage.removeItem(키); } catch (x) {} list.innerHTML = ''; }   // 이 기기 것이 서버와 안 맞으면 처음부터
        btn.textContent = 덜됨 ? '답 마저 받기' : '내 연애 질문 받기';
      });
    };
  }

  global.ChaeksaLoveView = { 그리기: 그리기 };
})(typeof window !== 'undefined' ? window : globalThis);
