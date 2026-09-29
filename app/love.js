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
  function post(path, body) {
    return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || '잠시 뒤 다시 해 주세요.'); return j; }); });
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
      + '<p class="hint" style="margin:0 0 10px">' + 이름 + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? ' (시간 모름)' : ' ' + b.hour + ':' + String(b.minute).padStart(2, '0')) + ' 기준으로, 당신에게 해당할 연애 행동 질문만 골라 답해 드려요. 지금은 무료예요.</p>'
      + '<div id="lvHead"></div><p class="hint" id="lvSt" style="margin:8px 0 0"></p></section>'
      + '<p class="hint" id="lvAbout" style="margin:0 0 6px"' + (저장 ? '' : ' hidden') + '>답은 태어난 날에서 계산한 행동 경향이라 틀릴 수 있어요. 질문마다 「맞아요 / 아니에요」를 눌러 주시면 더 정확하게 고쳐 나갑니다.</p>'
      + '<div id="lvList"></div>';
    var head = el.querySelector('#lvHead'), st = el.querySelector('#lvSt'), list = el.querySelector('#lvList'), about = el.querySelector('#lvAbout');
    if (저장 && 저장.items && 저장.items.every(function (it) { return it.a; })) { 목록(list, 저장, 키); return; }
    var 동의 = 읽기(동의키) === true;
    head.innerHTML = (동의 ? '' : '<label class="hint" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 10px"><input type="checkbox" id="lvOk" style="margin-top:5px;width:auto;flex:0 0 auto"><span>생년월일시와 「맞아요 / 아니에요」 응답을 이 콘텐츠를 고치는 데 쓰는 것에 동의해요. 이름·연락처는 보내지 않아요. <a href="privacy.html">개인정보 처리방침</a></span></label>')
      + '<button class="btn" id="lvGo" style="width:100%">내 연애 질문 받기</button>';
    var timer = null;
    function 알림(msg, err) { clearInterval(timer); st.textContent = msg; st.style.color = err ? 'var(--seal, #8c2f23)' : ''; }
    function 초(msg) { var s = 0; 알림(msg); timer = setInterval(function () { s += 1; st.textContent = msg + ' (' + s + '초)'; }, 1000); }
    el.querySelector('#lvGo').onclick = function () {
      if (!동의) { var ok = el.querySelector('#lvOk'); if (!ok || !ok.checked) return 알림('안내에 동의해 주세요.', true); 동의 = true; 쓰기(동의키, true); }
      var btn = el.querySelector('#lvGo'); btn.disabled = true;
      초('당신에게 맞는 질문을 고르는 중이에요. 1분 남짓 걸려요.');
      post('/api/love-questions', { consent: true, birth: b }).then(function (r) {
        저장 = { runId: r.runId, items: r.items.map(function (it) { return { id: it.id, section: it.section, q: it.q, a: '' }; }), fb: {} };
        쓰기(키, 저장); about.hidden = false; 목록(list, 저장, 키);
        초('질문 ' + r.items.length + '개를 골랐어요. 답을 쓰는 중이에요. 1분 남짓 더 걸려요.');
        return post('/api/love-answers', { runId: r.runId, birth: b, items: r.items });
      }).then(function (r) {
        var A = {}; r.items.forEach(function (it) { A[it.id] = it.a; });
        저장.items.forEach(function (it) { it.a = A[it.id] || '답을 쓰지 못했어요.'; });
        쓰기(키, 저장); head.innerHTML = ''; 알림('다 됐어요. 질문마다 실제 나와 맞는지 눌러 주세요.'); 목록(list, 저장, 키);
      }).catch(function (e) { 알림(e.message, true); btn.disabled = false; });
    };
  }

  global.ChaeksaLoveView = { 그리기: 그리기 };
})(typeof window !== 'undefined' ? window : globalThis);
