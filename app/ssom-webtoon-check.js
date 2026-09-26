/* 연애궁합 웹툰 원고 검사기(09-25 루프 엔지니어링 — docs/지적장부.md).
 * 검수 · 사장님이 눈으로 잡던 것 가운데 기계로 잡을 수 있는 것을 자동으로 잡는다. 한 번 받은 지적은 다음부터 저절로 잡히게.
 * 쓰는 곳: tests_ssom.html(명식 여러 쌍) · ssom-wongo-view.html(검수) · 작가 · 검수 에이전트가 내놓기 전에.
 * W.검사(a, b) → [{ 종류, 단계, 회, 말 }] — 빈 배열이면 통과. */
/* 09-27 사장님 「제한을 다 풀면」 — 말투 금지(비유 · 사주 말 · 판정키 · 얼버무림 · 금지 낱말 · 한자 · 코칭 · 길이 · 버릇)는 끔(false &&). 남는 것: 빈칸 · 조사 · 앞뒤 사실 · 되풀이 */
(function (global) {
  const W = global.ChaeksaSsomWebtoon; if (!W) return;
  const 금지 = /자리|문장|잣대|표지|이레|공략|사주는|원국|방식|제안|의견|배려/;                 // 메모 feedback-my-dialect-is-the-problem · 작가 규칙 4절
  const 사주말 = /(식신|상관|편인|정인|겁재|비견|편재|정재|편관|정관)(?![지데])|지장간|천간|배우자궁|일지|일간|십신|대운|세운/;   // 「하는 편인지」 같은 말은 빼고   // 해설 · 대사 본문엔 안 쓴다(단서 칸에만)
  const 한자 = /[一-鿿]/;
  const 조사틀림 = /당신[가를는와]|사람[가를는와](?![가-힣])/;
  const 코칭 = /하면 돼요|해 보세요|하세요[.!]|해야 해요|하는 게 좋아요/;
  function 검사(a, b) {
    const 걸림 = [], 방향말 = {}, 버릇 = { 근데: 0 };
    Object.keys(W.뼈대).forEach(k => {
      let w; try { w = W.조립(a, b, k, false, { 검수: true }); } catch (e) { 걸림.push({ 종류: '조립 오류', 단계: k, 회: 0, 말: e.message }); return; }
      (w || []).forEach((회, i) => {
        const 본 = new Set();
        회.forEach(([누, 말]) => {
          const 곳 = { 단계: k, 회: i + 1 };
          if (/쓰고 있어요|undefined|\{[가-힣]+\}/.test(말)) 걸림.push(Object.assign({ 종류: '빈칸 · 깨진 글자', 말 }, 곳));
          if (누 === '단서' || 누 === '근거') return;
          if (false && 금지.test(말)) 걸림.push(Object.assign({ 종류: '금지 낱말', 말 }, 곳));
          if (false && 한자.test(말)) 걸림.push(Object.assign({ 종류: '단서 밖 한자', 말 }, 곳));
          if (false && 사주말.test(말)) 걸림.push(Object.assign({ 종류: '해설 · 대사의 사주 말', 말 }, 곳));
          if (조사틀림.test(말)) 걸림.push(Object.assign({ 종류: '조사', 말 }, 곳));
          if (false && 누 === '인연' && 코칭.test(말)) 걸림.push(Object.assign({ 종류: '코칭 말투', 말 }, 곳));
          if (누 === '인연') { if (본.has(말)) 걸림.push(Object.assign({ 종류: '한 회 같은 해설 두 번', 말 }, 곳)); 본.add(말); 방향말[말] = (방향말[말] || 0) + 1; }
          버릇.근데 += (말.match(/근데/g) || []).length;
        });
        const 해설 = 회.filter(x => x[0] === '인연').length;
        if (false && 해설 > 6) 걸림.push({ 종류: '한 회 책사 해설 너무 김(' + 해설 + '줄)', 단계: k, 회: i + 1, 말: '' });
      });
    });
    Object.keys(방향말).forEach(말 => { if (방향말[말] > 1) 걸림.push({ 종류: '한 방향 같은 해설 되풀이(' + 방향말[말] + '번)', 단계: '', 회: 0, 말 }); });
    if (false && 버릇.근데 > 3) 걸림.push({ 종류: '버릇 말 「근데」 ' + 버릇.근데 + '번', 단계: '', 회: 0, 말: '' });
    return 걸림;
  }
  W.검사 = 검사;
})(window);
