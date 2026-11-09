/* SSS급 궁합 분석 견본 쪽 — 지어낸 두 사람 결과 한 벌을 그린다. 글은 sss-gunghap-copy.js(Codex). */
(function () {
  'use strict';
  var C = window.ChaeksaSssCopy || {}, 쪽 = C.쪽 || {}, r = window.ChaeksaSssSample, $ = function (id) { return document.getElementById(id); };
  if (쪽.제목) { $('h1').textContent = 쪽.제목; document.title = 쪽.제목 + ' 견본 · 책사'; }
  if (쪽.위표시) $('eyebrow').textContent = 쪽.위표시;
  if (쪽.소개) $('sub').textContent = 쪽.소개;
  if (쪽.견본표시) { $('mark').textContent = 쪽.견본표시; $('mark').classList.remove('hide'); }
  // 견본에서도 결제 화면과 같은 상품표의 값을 쓴다. 값을 못 받아도 신청으로 가는 길은 남긴다.
  if (window.ChaeksaPay && ChaeksaPay.state && ChaeksaPay.won) {
    ChaeksaPay.state().then(function (st) {
      var p = (st.products || []).filter(function (x) { return x.code === 'sss'; })[0];
      if (!p || !isFinite(Number(p.amount)) || Number(p.amount) <= 0) return;
      document.querySelectorAll('[data-price="sss"]').forEach(function (el) { el.textContent = ChaeksaPay.won(p.amount); });
      document.querySelectorAll('[data-sample-price-row]').forEach(function (el) { el.hidden = false; });
    }).catch(function () {});
  }
  if (!r || !window.ChaeksaSss) return;
  var 이름 = { 나: r.견본.나, 그: r.견본.그 }, 머 = C.머리 || {};
  if (r.명식) {
    var td = function (a) { return a.map(function (x) { return '<td>' + (x || '') + '</td>'; }).join(''); };
    $('ms').innerHTML = '<div class="card sss-ms"><table><tr><th></th><th>시</th><th>일</th><th>월</th><th>년</th></tr>'
      + '<tr><th>' + 이름.나 + '</th>' + td(r.명식.나) + '</tr><tr><th>' + 이름.그 + '</th>' + td(r.명식.그) + '</tr></table></div>';
  }
  window.ChaeksaSss.그리기($('out'), r, 이름);
  try { window.ChaeksaTrack && window.ChaeksaTrack.event('sss_gh_sample'); } catch (e) {}
})();
