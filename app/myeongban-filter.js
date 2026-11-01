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
  // COPY-0030: 기존 렌더러의 글만 바꾼다. 판정·필터 순서·수치·태그·속성은 보존한다.
  function everyday(value) {
    return String(value || '').replace(/\n/g, ' ')
      .replace(/문곡이 묘왕이면 문관과 무관 모두 맞다\./g, '사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일, 양쪽이 맞습니다. 문곡이 힘을 잘 발휘하는 자리에 있기 때문입니다.')
      .replace(/문관과 무관의 길/g, '사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일')
      .replace(/문관과 무관/g, '사무를 보는 일과 몸을 쓰거나 규율이 엄한 조직의 일')
      .replace(/문관으로/g, '사무를 보는 일로').replace(/무관으로/g, '몸을 쓰거나 규율이 엄한 조직의 일로')
      .replace(/문관/g, '사무를 보는 일').replace(/무관(?!하|한|해|심)/g, '몸을 쓰거나 규율이 엄한 조직의 일')
      .replace(/묘왕이면/g, '힘을 잘 발휘하는 자리에 있으면').replace(/묘왕/g, '힘을 잘 발휘하는 자리')
      .replace(/입묘하면/g, '힘을 가장 잘 발휘하는 자리에 있으면').replace(/입묘/g, '힘을 가장 잘 발휘하는 자리')
      .replace(/벼슬에 따른 수입\(녹\)/g, '조직에서 받는 정해진 봉급').replace(/벼슬의 수입/g, '조직에서 받는 봉급')
      .replace(/벼슬에서 얻는 수입/g, '조직에서 받는 봉급');
  }
  function editorialCopy(html, story) {
    const groups = (story.editorial?.groups || []).filter(g => g.filters?.length);
    const focus = groups.reduce((best, g) => !best || g.filters.length > best.filters.length ? g : best, null);
    const domains = {命宮:'타고난 바탕',財帛:'돈과 재물',官祿:'일과 책임',遷移:'바깥 활동과 인연',福德:'마음과 삶의 즐거움'};
    const domain = g => domains[g?.palace] || g?.filters?.[0]?.domain || '이 분야';
    const clause = s => everyday(R.sourceText ? R.sourceText(s) : s);
    const shown = s => esc(everyday(s));
    if (focus) {
      const lead = focus.filters[0], source = lead.sources?.[0];
      const title = everyday(source?.portrait || lead.title);
      // 큰 제목은 한 가지 특징, 바로 아래는 이미 확인된 배치의 이유.
      html = html.replace(/(<section class="zd-hero">[\s\S]*?<h2>)[\s\S]*?(<\/h2>)/, (match, a, b) => a + shown(domain(focus)) + (match.includes('<br>') ? '<br>' : ' — ') + shown(title) + b);
      const why = source?.evidence ? clause(window.ChaeksaZiweiCondition ? ChaeksaZiweiCondition(source.evidence) : source.evidence) : '';
      html = html.replace(/(<p class="zd-personal">)[\s\S]*?(<\/p>)/, (_, a, b) => a + shown(why ? '이렇게 읽은 배치: '+why : '아래에서 내게 해당하는 조건과 그 이유를 읽습니다.') + b);
      html = html.replace(/(<div class="zd-origin"><span>)[\s\S]*?(<\/span><p>)[\s\S]*?(<\/p>)/, (_, a, b, c) => a+'좋은 조건과 경계의 관계'+b+shown(focus.cautions?.length ? '이 분야에는 좋게 본 조건과 경계한 조건이 함께 있습니다. 각각 다른 배치에서 나온 뜻이므로 함께 읽습니다.' : '이 이름은 해당하는 고전 대목에서 읽었습니다. 성립 조건은 아래 근거에서 확인할 수 있습니다.')+c);
      const titles = [...new Set(focus.filters.map(f => everyday(f.title)))];
      const secondary = groups.find(g => g !== focus);
      const warnings = (focus.cautions || []).map(c => clause(c.뜻)).filter(Boolean);
      const summary = [
        domain(focus)+'에서는 「'+titles[0]+'」'+(titles[1]?'에 「'+titles[1]+'」의 조건이 더해집니다.':'의 조건이 확인됐습니다.'),
        secondary ? domain(secondary)+'에도 「'+everyday(secondary.filters[0].title)+'」의 조건이 있습니다.' : '',
        warnings.length ? '다만 같은 분야의 경계도 남습니다. '+warnings.slice(0,2).map(t=>'「'+t+'」').join(' ')+' 이 경계가 앞의 좋은 조건 때문에 없어지는 것은 아닙니다.' : '이 좋은 조건의 뜻은 위에서 확인한 배치와 적용 범위 안에서 읽습니다.'
      ].filter(Boolean).join(' ');
      html = html.replace(/(<section class="zd-ending">[\s\S]*?<h3>)[\s\S]*?(<\/h3><p>)[\s\S]*?(<\/p>)/, (_, a, b, c) => a+shown(domain(focus)+'의 강점과 제약 — '+everyday(lead.title))+b+esc(summary)+c);
    }
    // 접힌 근거의 원문·별·조건은 그대로, 바깥의 한국어만 오늘말로.
    let depth = 0;
    html = html.split(/(<[^>]+>)/g).map(part => {
      if (/^<details\b/i.test(part)) depth++;
      if (/^<\/details/i.test(part)) { depth--; return part; }
      return depth || part.startsWith('<') ? part : everyday(part);
    }).join('');
    html = html.replace(/(<div class="zd-step-rate"><span>)[^<]*(<\/span>)/g, '$1여기까지의 조건을 모두 갖춘 비교 명식$2');
    html = html.replace(/(<div class="zd-rate"><span>)[^<]*(<\/span>)/g, '$1이 조건들을 모두 갖춘 비교 명식$2');
    // 분야 제목은 전체 역할, 각 조건 제목은 그 사람에게 해당하는 구체적인 특징.
    let groupIndex = 0;
    html = html.replace(/(<section class="zd-group">[\s\S]*?<\/div><h3>)[\s\S]*?(<\/h3>)/g, (_, a, b) => {
      const g = groups[groupIndex++];
      if (!g) return _;
      return a + shown(domain(g)+'을 읽는 '+g.filters.length+'가지 조건') + b;
    });
    let noteIndex = 0;
    const warned = groups.filter(g => g.cautions?.length);
    html = html.replace(/(<p class="zd-read-note">)좋은 구절과 경계 구절은 각각 다른 조건에서 나왔습니다\. 한쪽이 다른 쪽을 없앤다고 계산한 결과는 아닙니다\.(<\/p>)/g, (_, a, b) => {
      const g = warned[noteIndex++];
      return a + shown(domain(g)+'에 나온 좋은 조건과 경계는 함께 적용됩니다. 한쪽을 이유로 다른 쪽을 지우지 않습니다.') + b;
    });

    return html;
  }

  function html(story) {
    if (!story || !Array.isArray(story.filters)) return '';
    if (story.editorial && window.ChaeksaZiweiEditorial) return editorialCopy(ChaeksaZiweiEditorial.html(story), story);
    story = window.ChaeksaZiweiEditorial?.present(story) || story;
    var filters = story.filters, stars = (story.mainStars || []).join(' · ');
    var h = '<article class="zf" aria-label="자미두수 · 당신에게 모인 좋은 조건">';
    h += '<div class="zf-hero"><p class="zf-kicker">자미두수전서에서 읽은 당신</p><h2>' + esc(story.heading) + '</h2>';
    if (stars) h += '<p class="zf-stars">나를 보는 자리의 별 <strong>' + esc(stars) + '</strong></p>';
    else h += '<p class="zf-stars">나를 보는 자리에는 중심이 되는 열네 별이 없어요. 다른 자리의 별을 함께 살펴봐요.</p>';
    h += '<p class="zf-intro">당신의 별 지도에서<br>옛 책이 좋다고 한 조건들을 찾았어요.</p>';
    h += '</div>';
    if (filters.length) {
      h += '<section class="zf-filters" aria-labelledby="zf-filter-heading"><div class="zf-section-head"><p class="zf-kicker">하나씩 겹쳐 볼수록</p><h3 id="zf-filter-heading">좋게 본 조건이<br>하나씩 모였어요.</h3><p>각 비율은 위에서부터 이 줄까지, 모든 조건을 함께 갖춘 명반의 비율이에요.</p></div><ol class="zf-stack">';
      filters.forEach(function (f, i) {
        var width = f.percent == null ? 0 : Math.min(100, Math.max(0, f.percent));
        h += '<li class="zf-step"><div class="zf-step-top"><span class="zf-number">' + String(i + 1).padStart(2, '0') + '</span><span class="zf-domain">' + esc(({命宮:'타고난 나',財帛:'돈과 재물',官祿:'일과 지위',遷移:'집 밖의 활동',福德:'마음과 삶의 즐거움'})[f.palace] || f.domain) + '</span><span class="zf-check" aria-label="해당">✓</span></div>';
        h += '<h4>' + esc((R.filterTitles || {})[f.key] || f.title) + '</h4>' + (f.name && f.key !== 'wealth-rank' && f.key !== 'honor-rank' ? '<p class="zf-name">' + esc(f.name) + '</p>' : '');
        h += '<div class="zf-rate"><span>' + (i ? '여기까지의 조건을 모두 갖춘 비교 명식' : '이 조건을 갖춘 비교 명식') + '</span><strong>' + rate(f.percent) + '</strong></div><div class="zf-track" aria-hidden="true"><i style="width:' + width.toFixed(5) + '%"></i></div>';
        h += '<details><summary>내게 해당하는 이유</summary>' + (f.sources || []).map(source).join('') + '</details></li>';
      });
      h += '</ol></section>';
    }
    h += '<section class="zf-conclusion"><p class="zf-kicker">당신에게 모인 좋은 조건</p><h3>' + esc(filters.length ? '내 명반에 함께 모인 조건' : '현재 확인된 좋은 조건이 없습니다.') + '</h3><p>' + esc(filters.length ? filters.map(f => everyday((R.filterTitles || {})[f.key] || f.title)).join(' · ')+'의 조건이 함께 확인됐습니다. 각 조건의 적용 범위와 다른 분야의 경계를 함께 읽습니다.' : '좋은 조건의 수만으로 명반 전체를 판단하지 않습니다. 아래의 열두 분야 풀이에서 강점과 경계를 함께 살펴보세요.') + '</p>';
    if (filters.length) h += '<div class="zf-total"><span>위 조건을 모두 갖춘 명반</span><strong>' + rate(story.percent) + '</strong><small>같은 기준으로 계산한 명반 중</small></div>';
    if (filters.length) h += '<p class="zf-closing">이것들이 옛 책이<br>당신을 좋게 본 이유예요.</p>';
    h += '</section><details class="zf-method"><summary>비율은 어떻게 계산했나요?</summary><p>같은 방법으로 계산한 여러 명반을 비교했어요. 첫 조건에 맞는 명반을 고른 뒤, 그 안에서 둘째 조건도 맞는 명반을 다시 골랐어요. 아래로 갈수록 앞의 조건들을 모두 갖춘 명반만 남아요.</p><p>' + esc(story.scheme) + ' · 총 ' + Number(story.sampleSize).toLocaleString('ko-KR') + '개.</p><p>이 숫자는 비교 자료에서 센 비율이에요. 실제 사람 몇 명 중 하나라는 뜻이나 능력 점수는 아니에요. 조건이 겹치면 다음 줄의 비율이 같을 수도 있어요. 비교 자료에서 같은 조합을 찾지 못하면 비율을 표시하지 않아요.</p><p>이 조건을 모두 갖춰야만 귀한 사람이라는 뜻은 아니에요.</p></details>';
    h += '<p class="zf-scope">여기에는 옛 책이 좋게 본 구절을 모았어요. 명반의 별이나 아래의 열두 분야 풀이에서는 좋고 나쁜 구절을 함께 읽을 수 있어요.</p></article>';
    return h.replace('</article>', '<p class="zd-today-link"><a href="today.html">오늘의 운세 — 오늘 달라지는 나는? →</a></p></article>');
  }
  window.ChaeksaZiweiFilter = { html: html };
})();
