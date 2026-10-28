/* Favorable 全書 clauses and their real cumulative cohort intersections. Renderer only. */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); };
  function rate(n) { if (n == null) return '아직 비율을 구하지 못했어요'; if (n < 0.01) return '0.01% 미만'; return n.toFixed(2).replace(/\.00$/, '') + '%'; }
  var R = window.ChaeksaZiweiReading || {};
  function source(s) {
    var volume = /卷([一二三])/.exec(s.source || '');
    var url = 'https://zh.wikisource.org/zh-hant/' + encodeURIComponent('紫微斗數全書') + '/' + encodeURIComponent('卷' + (volume ? volume[1] : '二'));
    var condition = window.ChaeksaZiweiCondition ? ChaeksaZiweiCondition(s.evidence) : '';
    return '<div class="zf-source"><p>' + esc(R.sourceText ? R.sourceText(s.meaning) : s.meaning) + '</p><p class="zf-evidence"><b>내게 해당하는 조건</b><br>' + esc(condition || (R.sourceText ? R.sourceText(s.evidence) : s.evidence)) + '</p><details class="zf-original"><summary>고전 원문과 출처</summary><p class="zf-quote" lang="zh-Hant">' + esc(s.quote) + '</p><p class="zf-evidence">계산에서 확인한 조건: ' + esc(String(s.evidence == null ? '' : s.evidence).replace(/명궁\(명궁 /g, '명궁(')) + '</p><a href="' + url + '" target="_blank" rel="noopener noreferrer">자미두수전서 · ' + esc(s.source) + ' ↗</a></details></div>';
  }
  function html(story) {
    if (!story || !Array.isArray(story.filters)) return '';
    if (story.editorial && window.ChaeksaZiweiEditorial) return ChaeksaZiweiEditorial.html(story);
    var filters = story.filters, stars = (story.mainStars || []).join(' · ');
    var h = '<article class="zf" aria-label="자미두수 · 당신에게 모인 좋은 조건">';
    h += '<div class="zf-hero"><p class="zf-kicker">자미두수전서에서 읽은 당신</p><h2>옛 책이 좋게 본<br><em>당신의 모습.</em></h2>';
    if (stars) h += '<p class="zf-stars">나를 보는 자리의 별 <strong>' + esc(stars) + '</strong></p>';
    else h += '<p class="zf-stars">나를 보는 자리에는 중심이 되는 열네 별이 없어요. 다른 자리의 별을 함께 살펴봐요.</p>';
    h += '<p class="zf-intro">당신의 별 지도에서<br>옛 책이 좋다고 한 조건들을 찾았어요.</p>';
    if (filters.length) h += '<div class="zf-total"><span>아래 조건을 모두 갖춘 명반</span><strong>' + rate(story.percent) + '</strong><small>같은 기준으로 계산한 명반 중</small></div>';
    h += '</div>';
    if (filters.length) {
      h += '<section class="zf-filters" aria-labelledby="zf-filter-heading"><div class="zf-section-head"><p class="zf-kicker">하나씩 겹쳐 볼수록</p><h3 id="zf-filter-heading">좋게 본 조건이<br>하나씩 모였어요.</h3><p>각 비율은 위에서부터 이 줄까지, 모든 조건을 함께 갖춘 명반의 비율이에요.</p></div><ol class="zf-stack">';
      filters.forEach(function (f, i) {
        var width = f.percent == null ? 0 : Math.min(100, Math.max(0, f.percent));
        h += '<li class="zf-step"><div class="zf-step-top"><span class="zf-number">' + String(i + 1).padStart(2, '0') + '</span><span class="zf-domain">' + esc(({命宮:'타고난 나',財帛:'돈과 재물',官祿:'일과 지위',遷移:'집 밖의 활동',福德:'마음과 삶의 즐거움'})[f.palace] || f.domain) + '</span><span class="zf-check" aria-label="해당">✓</span></div>';
        h += '<h4>' + esc((R.filterTitles || {})[f.key] || f.title) + '</h4>' + (f.name && f.key !== 'wealth-rank' && f.key !== 'honor-rank' ? '<p class="zf-name">' + esc(f.name) + '</p>' : '');
        h += '<div class="zf-rate"><span>' + (i ? '여기까지 모두 갖춘 비율' : '이 조건을 갖춘 비율') + '</span><strong>' + rate(f.percent) + '</strong></div><div class="zf-track" aria-hidden="true"><i style="width:' + width.toFixed(5) + '%"></i></div>';
        h += '<details><summary>내게 해당하는 이유</summary>' + (f.sources || []).map(source).join('') + '</details></li>';
      });
      h += '</ol></section>';
    }
    h += '<section class="zf-conclusion"><p class="zf-kicker">당신에게 모인 좋은 조건</p><h3>' + esc(story.conclusion) + '</h3><p>' + esc(filters.length ? '옛 책이 좋게 본 조건 ' + filters.length + '가지가 당신의 명반에 함께 있어요.' : '이 목록에서 고른 좋은 조건은 확인되지 않았어요. 명반의 별을 눌러 나머지 풀이를 살펴보세요.') + '</p>';
    if (filters.length) h += '<p class="zf-closing">이것들이 옛 책이<br>당신을 좋게 본 이유예요.</p>';
    h += '</section><details class="zf-method"><summary>비율은 어떻게 계산했나요?</summary><p>같은 방법으로 계산한 여러 명반을 비교했어요. 첫 조건에 맞는 명반을 고른 뒤, 그 안에서 둘째 조건도 맞는 명반을 다시 골랐어요. 아래로 갈수록 앞의 조건들을 모두 갖춘 명반만 남아요.</p><p>' + esc(story.scheme) + ' · 총 ' + Number(story.sampleSize).toLocaleString('ko-KR') + '개.</p><p>이 숫자는 비교 자료에서 센 비율이에요. 실제 사람 몇 명 중 하나라는 뜻이나 능력 점수는 아니에요. 조건이 겹치면 다음 줄의 비율이 같을 수도 있어요. 비교 자료에서 같은 조합을 찾지 못하면 비율을 표시하지 않아요.</p><p>이 조건을 모두 갖춰야만 귀한 사람이라는 뜻은 아니에요.</p></details>';
    h += '<p class="zf-scope">여기에는 옛 책이 좋게 본 구절을 모았어요. 명반의 별이나 아래의 열두 분야 풀이에서는 좋고 나쁜 구절을 함께 읽을 수 있어요.</p></article>';
    return h.replace('</article>', '<p class="zd-today-link"><a href="today.html">오늘의 운세 — 오늘 달라지는 나는? →</a></p></article>');
  }
  window.ChaeksaZiweiFilter = { html: html };
})();
