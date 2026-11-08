/* 사용법 칸 조립기(11-08 사장님 「각 컨텐츠 마다 설명이 붙어야하지 않겠어?」 · 「사용법이라고 해야겠네」).
 * 쪽 · 탭의 자리표 <div data-sayongbeop="열쇠"></div> 에 「사용법」 접이 칸을 그린다. 글은 sayongbeop-copy.js(Codex · COPY-0046)에서만 — 줄이 비면 자리표를 숨긴다(빈 칸 · 틀 글자 0).
 * 접고 펴는 것은 열쇠마다 기억한다(localStorage chaeksa.sayongbeop.fold) — 한 번 접은 손님에게 매번 다시 펴지 않는다. 처음은 펼침(사장님 「설명이 부족」 — 접혀 있으면 못 본다). */
(function (global) {
  'use strict';
  var KEY = 'chaeksa.sayongbeop.fold';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 접힘표() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function 접힘저장(k, v) { try { var t = 접힘표(); if (v) t[k] = 1; else delete t[k]; localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) { /* 저장 못 해도 칸은 그린다 */ } }
  function 줄들(x) { var a = x == null ? [] : Array.isArray(x) ? x : [x]; return a.map(function (s) { return String(s == null ? '' : s).trim(); }).filter(Boolean); }
  function 그리기(root) {
    var C = global.ChaeksaSayongbeopCopy || {}, 표 = C.표 || {}, 공 = C.공통 || {};
    var els = (root || document).querySelectorAll('[data-sayongbeop]'), 접 = 접힘표();
    for (var i = 0; i < els.length; i++) {
      var el = els[i], k = el.getAttribute('data-sayongbeop') || '', g = 표[k] || {}, 줄 = 줄들(g.줄);
      if (!줄.length) { el.hidden = true; el.innerHTML = ''; continue; }
      var 머리 = (g.머리 || 공.머리 || '사용법'), 열림 = !접[k];
      el.innerHTML = '<details class="sayongbeop"' + (열림 ? ' open' : '') + ' data-sb-key="' + esc(k) + '"><summary>' + esc(머리) + '</summary><div class="sb-body">'
        + 줄.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></details>';
      el.hidden = false;
      el.firstChild.addEventListener('toggle', function (e) { 접힘저장(e.target.getAttribute('data-sb-key'), !e.target.open); });
    }
  }
  global.ChaeksaSayongbeop = { 그리기: 그리기 };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { 그리기(); }); else 그리기();
})(typeof window !== 'undefined' ? window : this);
