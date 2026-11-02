/* 「내게 맞는 일과 돈」 웹판 명식 카드 — 서버 조각의 [data-mwk] 값(글자 · 십성 이름)으로 타로 카드 네 장(myeongsik-card.js 원국표 mwk-)과 대운 띠를 그린다.
 * 결과 쪽(ilgyeol-report.html)과 견본 쪽(ilgyeol-sample.html)이 같이 쓴다. 판정 없음 — 그리기만. engine.js · myeongsik-card.js 뒤에 싣는다. */
(function (global) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function 그리기(host) {
    var E = global.ChaeksaEngine, MC = global.ChaeksaMyeongsikCard, el = host && host.querySelector('[data-mwk]');
    if (!el || !E || !MC || !MC.원국표) return false;
    try {
      var v = JSON.parse(el.getAttribute('data-mwk') || '{}'), 기 = v.기둥 || {}, P = {}, gods = {};
      ['hour', 'day', 'month', 'year'].forEach(function (k) {
        var p = 기[k]; if (!p) { P[k] = null; return; }
        var s = E.STEMS.indexOf(p.간), b = E.BRANCHES.indexOf(p.지);
        P[k] = s < 0 || b < 0 ? null : { stem: s, branch: b };
        gods[k] = { stem: k === 'day' ? '일간' : (p.간십성 || ''), branch: p.지십성 || '' };
      });
      var h = MC.원국표({ pillars: P, analysis: { gods: gods } }, { pre: 'mwk-' });
      var 대 = (v.대운 || []).map(function (d) { return '<span class="' + (d.지금 ? 'now' : '') + '">' + esc(d.간지 + ' ' + d.시작해 + '~') + '</span>'; }).join('');
      if (h) { el.innerHTML = h + (대 ? '<div class="igw-du">' + 대 + '</div>' : ''); return true; }
    } catch (e) {}
    return false;
  }
  global.ChaeksaIgCards = { 그리기: 그리기 };
  function 저절로() { var w = document.getElementById('igWeb'); if (w) 그리기(w); }
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 저절로); else 저절로(); }
})(typeof window !== 'undefined' ? window : globalThis);
