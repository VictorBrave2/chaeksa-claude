/* SSS급 궁합 분석 — 그리기(11-03 · 사장님 궁합 네 줄 · 29,700원 · 결정함 117).
 * 값 · 갈래는 비공개 계산(lib/sss-gunghap.js)이 낸 결과 r 하나. 글은 sss-gunghap-copy.js(Codex COPY-0036)만 — 칸이 비면 그 줄은 안 그린다.
 * 견본 쪽(sss-gunghap-sample.html)은 지어낸 두 사람 결과(sss-gunghap-sample-data.js)를, 결제 뒤 결과 쪽은 비공개 API 결과를 이 함수 하나로 그린다.
 * 22칸 거르개 이름 · 한줄은 정통 사주 궁합 · 자미두수 궁합 글(gunghap-pyo-copy.js · zw-gunghap-pyo-copy.js)을 그대로 쓴다.
 */
(function (global) {
  'use strict';
  const C = () => global.ChaeksaSssCopy || {};
  const 받침 = (w) => { const s = String(w).replace(/\([^)]*\)/g, ''); for (let i = s.length - 1; i >= 0; i--) { const c = s.charCodeAt(i); if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 !== 0; } return false; };
  const 조 = { 은는: ['은', '는'], 이가: ['이', '가'], 을를: ['을', '를'], 과와: ['과', '와'], 의: ['의', '의'] };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // {누구} {누구은는} … {나} {나이가} … {해} 같은 자리 — 값이 없으면 빈칸이 아니라 그 줄을 버린다
  function 채움(틀, v) {
    if (!틀) return '';
    let 빠짐 = false;
    const out = String(틀).replace(/\{([가-힣]+?)(은는|이가|을를|과와|의)?\}/g, (m, k, j) => {
      const x = v[k];
      if (x == null || x === '') { 빠짐 = true; return ''; }
      return j ? (x === '나' && j === '이가' ? '내가' : x + 조[j][받침(x) ? 0 : 1]) : x;   // 11-04 「나」 + 이/가 는 「내가」 — 같은 이름 보고서가 기본 부름 「나」를 쓸 때 「나가」가 되지 않게(v1627)
    });
    return 빠짐 ? '' : out;
  }
  const 해말 = (a) => (a || []).join(', ');
  const 달말 = (a) => (a || []).map(x => x.m + '월').join(', ');
  const 줄 = (t, cls) => t ? '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(t) + '</p>' : '';

  function 사람줄(V, id, r, 누구, 쪽, 이름) {
    const c = r.칸[id], g = c.갈래[쪽], 값 = c.값 && c.값[쪽];
    const v = { 누구: 이름[쪽], 나: 이름.나, 그: 이름.그 };
    if (id === 'V15' || id === 'V17') { v.해 = (값 || [])[0]; v.해들 = 해말(값); }
    if (id === 'V16') { v.달 = 값 && 달말(값.달); if (값 && 값.변질) { v.전 = 값.변질.전; v.후 = 값.변질.후; } }
    if (id === 'V01') return (값 && 값.length ? 값 : ['빈궁']).map(s => 채움(V.갈래[s], v)).filter(Boolean).map(t => '<p><b>' + esc(이름[쪽]) + '</b> ' + esc(t) + '</p>').join('');
    const t = 채움(V.갈래[g], v);
    return t ? '<p><b>' + esc(이름[쪽]) + '</b> ' + esc(t) + '</p>' : '';
  }

  function 칸그림(id, r, 이름) {
    const V = (C().칸 || {})[id] || { 갈래: {} }, c = r.칸[id];
    if (!c) return '';
    const v = { 나: 이름.나, 그: 이름.그 };
    let 몸 = '';
    const 종 = { V01: '사람', V05: '사람', V06: '사람', V10: '사람', V12: '사람', V14: '사람', V15: '사람', V16: '사람', V17: '사람', V18: '원서', V19: '원서', V20: '원서' }[id] || '둘';
    if (종 === '사람') {
      몸 = 사람줄(V, id, r, null, '나', 이름) + 사람줄(V, id, r, null, '그', 이름);
    } else if (종 === '원서') {
      const 줄들 = (쪽) => { const x = c.값[쪽]; const a = Array.isArray(x) ? x : Object.keys(x || {}).reduce((s, k) => s.concat(x[k]), []); return a; };
      몸 = 줄(채움(V.갈래.머리, v));
      const 원머 = 채움((C().머리 || {}).원문, v);
      ['나', '그'].forEach(쪽 => {
        const a = 줄들(쪽);
        몸 += a.length ? '<p><b>' + esc(이름[쪽]) + '</b></p><ul class="sss-won">' + a.map(x => '<li>' + esc(x.뜻) + '</li>').join('') + '</ul>'
          + (원머 ? '<details class="fold"><summary>' + esc(원머) + '</summary><ul class="sss-won">' + a.map(x => '<li>' + esc(x.구절) + ' <small>' + esc(x.출처 || '') + '</small></li>').join('') + '</ul></details>' : '')
          : 줄(채움(V.갈래.줄없음, { 누구: 이름[쪽], 나: 이름.나, 그: 이름.그 }));
      });
    } else if (id === 'V22') {
      const GH = (global.ChaeksaGhPyoCopy || {}).거르개 || {}, ZW = (global.ChaeksaZwGhPyoCopy || {}).거르개 || {};
      const 걸 = (c.값.걸린 || []).map(x => GH[x.id]).concat((c.값.자미 || []).map(k => ZW[k])).filter(x => x && x.이름);
      몸 = 걸.length ? 줄(채움(V.갈래.머리, v)) + 걸.map(x => '<p><b>' + esc(x.이름) + '</b> ' + esc(x.한줄 || '') + '</p>').join('') : 줄(채움(V.갈래.없음, v));
    } else {
      if (id === 'V07') { v.나단계 = c.값.나; v.그단계 = c.값.그; }
      if (id === 'V23') v.끝 = c.값.때 && c.값.때.끝 ? +c.값.때.끝.slice(5, 7) + '월 ' + +c.값.때.끝.slice(8, 10) + '일' : '';
      몸 = 줄(채움(V.갈래[c.갈래], v));
      if (id === 'V03' || id === 'V04') {
        const 바람 = ((C().칸 || {}).V03 || {}).바람 || {}, 누 = id === 'V03' ? '나' : '그', 십 = id === 'V03' ? c.값.내바람 : c.값.그바람;
        몸 += 줄(채움(바람[십], { 누구: 이름[누], 나: 이름.나, 그: 이름.그 }), 'sss-sub');
      }
      if (id === 'V09' && c.값.일간합) 몸 += 줄(채움(V.갈래.일간합덧줄, v), 'sss-sub');
    }
    if (!몸) return '';
    const 머 = C().머리 || {};
    return '<section class="card sss-v" data-v="' + id + '">'
      + (채움(V.물음, v) ? '<p class="sss-q">' + esc(채움(V.물음, v)) + '</p>' : '')
      + 몸 + 줄(채움(V.할일, v), 'sss-do')
      + (채움(머.근거, v) && c.근거 ? '<details class="fold"><summary>' + esc(채움(머.근거, v)) + '</summary><p class="why">' + esc(c.근거) + '</p></details>' : '')
      + '</section>';
  }

  function 그리기(el, r, 이름) {
    if (!el || !r || !r.칸) return;
    const 목 = Object.keys(r.칸).sort();
    el.innerHTML = 목.map(id => 칸그림(id, r, 이름)).join('') + 줄(C().끝말, 'note');
  }
  global.ChaeksaSss = { 그리기, 채움 };
})(typeof window !== 'undefined' ? window : globalThis);
