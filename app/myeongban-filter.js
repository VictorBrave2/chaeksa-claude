/* Favorable 全書 clauses and their real cumulative cohort intersections. Renderer only. */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); };
  function rate(n) { if (n == null) return '비율 미산정'; if (n < 0.01) return '0.01% 미만'; return n.toFixed(2).replace(/\.00$/, '') + '%'; }
  function source(s) {
    var volume = /卷([一二三])/.exec(s.source || '');
    var url = 'https://zh.wikisource.org/zh-hant/' + encodeURIComponent('紫微斗數全書') + '/' + encodeURIComponent('卷' + (volume ? volume[1] : '二'));
    return '<div class="zf-source"><p class="zf-quote" lang="zh-Hant">' + esc(s.quote) + '</p><p>' + esc(s.meaning) + '</p><p class="zf-evidence"><b>내 명반에서 확인한 조건</b><br>' + esc(s.evidence) + '</p><a href="' + url + '" target="_blank" rel="noopener noreferrer">자미두수전서 · ' + esc(s.source) + ' ↗</a></div>';
  }
  function html(story) {
    if (!story || !Array.isArray(story.filters)) return '';
    var filters = story.filters, stars = (story.mainStars || []).join(' · ');
    var h = '<article class="zf" aria-label="자미두수 · 당신에게 모인 좋은 조건">';
    h += '<div class="zf-hero"><p class="zf-kicker">자미두수전서에서 읽은 당신</p><h2>당신에게 모인<br><em>좋은 별의 조건.</em></h2>';
    if (stars) h += '<p class="zf-stars">나를 보는 자리, 명궁의 별 <strong>' + esc(stars) + '</strong></p>';
    else h += '<p class="zf-stars">명궁에는 주성이 없습니다. 다른 자리의 별을 함께 읽습니다.</p>';
    h += '<p class="zf-intro">옛 책이 좋게 본 조건을<br>당신의 명반에서 하나씩 찾았습니다.</p>';
    if (filters.length) h += '<div class="zf-total"><span>아래 조건이 모두 모인 명반</span><strong>' + rate(story.percent) + '</strong><small>비교 명반 기준</small></div>';
    h += '</div>';
    if (filters.length) {
      h += '<section class="zf-filters" aria-labelledby="zf-filter-heading"><div class="zf-section-head"><p class="zf-kicker">하나씩 겹쳐 볼수록</p><h3 id="zf-filter-heading">이 조건들이<br>당신에게 함께 있습니다.</h3><p>숫자는 이 줄까지의 조건에 모두 해당하는 비율입니다.</p></div><ol class="zf-stack">';
      filters.forEach(function (f, i) {
        var width = f.percent == null ? 0 : Math.min(100, Math.max(0, f.percent));
        h += '<li class="zf-step"><div class="zf-step-top"><span class="zf-number">' + String(i + 1).padStart(2, '0') + '</span><span class="zf-domain">' + esc(f.domain) + '</span><span class="zf-check" aria-label="해당">✓</span></div>';
        h += '<h4>' + esc(f.title) + '</h4>' + (f.name ? '<p class="zf-name">' + esc(f.name) + '</p>' : '');
        h += '<div class="zf-rate"><span>' + (i ? '여기까지 함께 해당' : '이 조건에 해당') + '</span><strong>' + rate(f.percent) + '</strong></div><div class="zf-track" aria-hidden="true"><i style="width:' + width.toFixed(5) + '%"></i></div>';
        h += '<details><summary>왜 나에게 해당할까요?</summary>' + (f.sources || []).map(source).join('') + '</details></li>';
      });
      h += '</ol></section>';
    }
    h += '<section class="zf-conclusion"><p class="zf-kicker">당신에게 모인 자리들</p><h3>' + esc(story.conclusion) + '</h3><p>' + esc(story.summary) + '</p>';
    if (filters.length) h += '<p class="zf-closing">당신의 명반을 이루는<br>좋은 조건들을 기억해 두세요.</p>';
    h += '</section><details class="zf-method"><summary>비율은 어떻게 계산했나요?</summary><p>자미두수 명반을 같은 기준으로 계산한 비교 자료에서, 각 조건에 모두 해당하는 명반을 셌습니다. 앞선 조건을 통과한 명반 안에서 다음 조건을 다시 확인합니다. 각각의 비율을 곱하지 않습니다.</p><p>' + esc(story.scheme) + ' · 총 ' + Number(story.sampleSize).toLocaleString('ko-KR') + '개.</p><p>실제 인구 비율이나 능력 점수가 아닙니다. 조건이 겹치면 비율이 같을 수 있으며, 비교 자료에서 찾지 못한 조합은 비율 미산정으로 표시합니다.</p><p>이 조건을 모두 갖추어야만 귀한 사람이라는 뜻은 아닙니다.</p></details>';
    h += '<p class="zf-scope">' + esc(story.scope) + '</p><div class="zf-chart-heading"><p class="zf-kicker">더 가까이 들여다보기</p><h3>당신의 열두 자리</h3><p>명반을 펼친 뒤 궁이나 별을 누르면 그 자리에 적힌 이야기가 열립니다.</p></div></article>';
    return h;
  }
  window.ChaeksaZiweiFilter = { html: html };
})();
