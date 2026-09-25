/* 연애궁합 3초 결과 — 점수 · 누가 더 끌리나(09-25 사장님 「대중이 원하는 건 순위 나열」 · 「3초 결과」 · 「일단 무료로 다 풀고」).
 * 한 축만 잰다(삼체가 되지 않게): 받는 쪽이 바라는 것(일지 본기) × 주는 쪽이 대하는 법(앞선 식상 글자, 없으면 일간 그대로).
 * 두 글자의 오행 관계로 한 방향을 매긴다. 같은 글자 > 같은 기운 > 주는 쪽이 생해 줌 > 받는 쪽이 눌러 둠 > 받는 쪽이 생해 줘야 함 > 주는 쪽이 극함.
 * 두 사람 일지가 육합이면 더하고 충이면 뺀다. 점수표(아래 점)는 내 추론 — 사장님 검수 대기. 한 곳에서만 고친다.
 * 끌림: 바라는 게 더 채워지는 쪽이 더 끌린다. 문장은 ChaeksaSsomScoreMal(작가 원고). */
(function (global) {
  const E = global.ChaeksaEngine, S = global.ChaeksaSsom;
  const 점 = { 같은글자: 96, 같은기운: 88, 채워줌: 80, 눌러둠: 64, 채워줘야: 58, 엇갈림: 46 };
  const 일지더 = { 육합: 6, 충: -8 };
  const 본기 = (R) => { const h = (E.HIDDEN[R.pillars.day.branch] || [])[0]; return typeof h === 'number' ? h : h[0]; };
  const 주는글자 = (R) => { const 언 = (S.언행(R) || [])[0]; return 언 ? E.STEMS.indexOf(언.글자) : R.pillars.day.stem; };
  function 관계(받, 주) {   // 받 = 받는 쪽 일지 본기, 주 = 주는 쪽 글자
    if (받 === 주) return '같은글자';
    const a = E.STEM_ELEM[주], b = E.STEM_ELEM[받];
    if (a === b) return '같은기운';
    if ((a + 1) % 5 === b) return '채워줌';
    if ((b + 1) % 5 === a) return '채워줘야';
    if ((b + 2) % 5 === a) return '눌러둠';
    return '엇갈림';
  }
  function 방향(받는R, 주는R) { const k = 관계(본기(받는R), 주는글자(주는R)); return { 관계: k, 점: 점[k] }; }
  function 재기(나R, 그R) {
    const 나쪽 = 방향(나R, 그R), 그쪽 = 방향(그R, 나R);
    const 지 = S.지관계(나R.pillars.day.branch, 그R.pillars.day.branch), 더 = 일지더[지] || 0;
    const 점수 = Math.max(0, Math.min(100, Math.round((나쪽.점 + 그쪽.점) / 2 + 더)));
    const 끌림 = 나쪽.점 === 그쪽.점 ? '비슷' : 나쪽.점 > 그쪽.점 ? '당신' : '그 사람';
    return { 점수, 나쪽, 그쪽, 일지: 지 === '반합' ? null : 지, 끌림 };
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function 카드(나R, 그R) {
    const r = 재기(나R, 그R), 말 = global.ChaeksaSsomScoreMal || {}, 한 = (k) => (말.관계 && 말.관계[k]) || '';
    const 끌 = (말.끌림 || {})[r.끌림] || '';
    const 줄 = (누, d) => 한(d.관계) ? '<p><b>' + 누 + '</b> ' + esc(한(d.관계)) + '</p>' : '';
    return '<div class="card ss-score"><p class="ss-score-n"><b>' + r.점수 + '</b>점</p>'
      + (끌 ? '<p class="ss-lead">' + esc(끌) + '</p>' : '')
      + 줄('당신이 바라는 것 →', r.나쪽) + 줄('그 사람이 바라는 것 →', r.그쪽)
      + (r.일지 && 말.일지 && 말.일지[r.일지] ? '<p>' + esc(말.일지[r.일지]) + '</p>' : '')
      + '</div>';
  }
  global.ChaeksaSsomScore = { 재기, 카드, 관계, 점 };
})(window);
