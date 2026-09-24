/* 썸 궁합 관점 — 법전 72조(09-24).
 * 한 사람을 둘로 읽는다: 일지 = 어떤 배우자를 바라는가 · 식상 = 상대를 어떻게 대하는가. 둘을 같은 것으로 치지 않는다.
 * 한 방향 = 내 일지 × 상대 식상(내가 원하는 것을 상대가 어떻게 주는가). 두 방향을 따로 잡아 원고를 고른다.
 * 식상 구성 31가지 = 없음 1 + 일간별(식신만 · 상관만 · 둘 다) 30. 원국 천간 + 지장간에 그 글자가 있나만 본다
 * (투출 · 개수 · 자리 · 강약 · 합충 · 운은 이 분류에서 가르지 않는다). 점수를 내지 않는다. */
(function (global) {
  const E = global.ChaeksaEngine;
  const 자리 = ['year', 'month', 'day', 'hour'];

  // 원국 여덟 글자 속 천간(일간 제외) + 지장간 전부
  function 있는천간(R) {
    const p = R.pillars, out = new Set();
    자리.forEach(k => {
      if (!p[k]) return;
      if (k !== 'day') out.add(p[k].stem);
      (E.HIDDEN[p[k].branch] || []).forEach(h => out.add(typeof h === 'number' ? h : h[0]));
    });
    return out;
  }
  function 식상(R) {
    const ds = R.pillars.day.stem, 있 = 있는천간(R);
    let 식신 = null, 상관 = null;
    for (let s = 0; s < 10; s++) {
      const g = E.TEN_GODS[E.tenGod(ds, s)];
      if (g === '식신') 식신 = s; else if (g === '상관') 상관 = s;
    }
    const 식 = 있.has(식신), 상 = 있.has(상관), S = E.STEMS;
    const 키 = !식 && !상 ? '없음' : 식 && 상 ? S[식신] + '식신+' + S[상관] + '상관' : 식 ? S[식신] + '식신' : S[상관] + '상관';
    return { 키, 식신: 식 ? S[식신] : null, 상관: 상 ? S[상관] : null };
  }
  function 일지지(R) { return E.BRANCHES[R.pillars.day.branch]; }
  // 방향 = 받는 쪽의 일지 × 주는 쪽의 식상
  function 방향(받는R, 주는R) { const 식 = 식상(주는R); return { 일지: 일지지(받는R), 식상: 식.키, 키: 일지지(받는R) + '×' + 식.키 }; }
  // 당신 = 나. 원고 열쇠 = 「내 일지 × 상대 식상 / 상대 일지 × 내 식상」
  function 짝(나R, 그R) {
    const 나쪽 = 방향(나R, 그R), 그쪽 = 방향(그R, 나R);
    return { 나쪽, 그쪽, 키: 나쪽.키 + ' / ' + 그쪽.키, 나식상: 식상(나R), 그식상: 식상(그R) };
  }
  const 질문 = [
    '상대는 내 어떤 점에 끌릴까요?',
    '나는 왜 이 사람에게 마음이 갈까요?',
    '내가 먼저 다가가도 괜찮을까요?',
    '연락할 때 무엇이 다를까요?',
    '첫 데이트는 어떻게 준비할까요?',
    '가까워질수록 무엇을 맞춰야 할까요?',
  ];
  // 행동이 들어가는 장만 반응을 묻는다(0 끌림 · 2 먼저 다가가기 · 3 연락 · 4 첫 데이트). 1 · 5 는 읽고 넘어간다.
  const 반응틀 = { 0: ['반가워했어요', '미지근했어요', '아직 답이 없어요', '아직 안 보냈어요'], 2: ['반가워했어요', '미지근했어요', '아직 답이 없어요', '아직 안 보냈어요'],
    3: ['반가워했어요', '미지근했어요', '아직 답이 없어요', '아직 안 보냈어요'], 4: ['좋았어요', '어색했어요', '아직 안 만났어요'] };
  const 반응물음 = { 0: '이 말을 건네 보셨나요? 상대 반응은 어땠어요?', 2: '먼저 다가가 보셨나요? 상대 반응은 어땠어요?', 3: '연락해 보셨나요? 상대 반응은 어땠어요?', 4: '만나 보셨나요? 어땠어요?' };
  // 연애 일지 — 이 기기에만 남긴다(서버로 안 보낸다). 열쇠는 두 방향 열쇠라 생일이 들어가지 않는다.
  const 일지키 = 'chaeksa.ssomLog';
  function 일지(열쇠) { try { return (JSON.parse(localStorage.getItem(일지키) || '{}')[열쇠]) || []; } catch (e) { return []; } }
  function 적기(열쇠, 장, 반응) {
    try { const all = JSON.parse(localStorage.getItem(일지키) || '{}'); (all[열쇠] = all[열쇠] || []).push({ 장, 반응, 때: new Date().toISOString().slice(0, 10) }); all[열쇠] = all[열쇠].slice(-30); localStorage.setItem(일지키, JSON.stringify(all)); } catch (e) {}
  }
  global.ChaeksaSsom = { 식상, 일지: 일지지, 방향, 짝, 질문, 반응틀, 반응물음, 기록: 일지, 적기 };
})(window);
