/* 문장표 조립기 (2026-09-05 사장님 「20문항 × 경우의 수만큼 문장을 만들어 조합, 내가 검수」→「전수 진행」)
 *
 * 값 → 문장 사이의 병목을 표로 뺀다. 문항마다 축(엔진 값)의 조합 전부에 문장이 미리 씌어 있고(docs/33_문장표_*.md → app/mun/*.js),
 * 여기서는 키를 만들어 칸을 찾기만 한다. 표가 없는 문항은 지금 코드의 문장이 그대로 나간다 → 문항 하나씩 갈아 끼울 수 있다.
 * 축 설계는 docs/34. 키 표기: 'A1-B겉뿌-C한-D옴' 처럼 축 글자 + 등급.
 */
(function (global) {
  'use strict';
  const M = global.ChaeksaMun = global.ChaeksaMun || { 표: {} };

  /** 30조 상태 → 등급 글자 */
  M.상태 = (st) => st === '겉·뿌리' ? '겉뿌' : st === '겉·무근' ? '겉무' : (st === '속' || st === '속·먹힘') ? '속' : '없';
  /** 순위(1,2,3+,0=없음) */
  M.순위 = (n) => n === 1 ? '1' : n === 2 ? '2' : n >= 3 ? '3' : '없';
  /** 어느 운에라도 무리 g 가 오나 — {하늘,땅} 꼴들을 받는다 */
  M.운옴 = (g, ...운들) => 운들.some(u => u && (u.하늘 === g || u.땅 === g));

  /** 표 칸 찾기 — 없으면 null */
  M.칸 = (code, q, key) => { const t = M.표[code + ':' + q]; return (t && t[key]) || null; };

  /** Q[q-1] 을 표 칸으로 덮는다. 칸이 없으면 그대로 두고 false */
  M.덮기 = (code, q, Q, key) => {
    const c = M.칸(code, q, key); const item = Q && Q[q - 1];
    if (!c || !item) return false;
    item.답 = c.답; item.왜 = c.왜; item.표키 = key; return true;
  };

  /** 어느 문항에 표가 있나 — 점검용 */
  M.있는표 = () => Object.keys(M.표).map(k => k + '(' + Object.keys(M.표[k]).length + ')');
})(window);
