/* 책사 사용량 관리 v1 — AI 원가가 매출을 넘지 못하게 막는 장치
 *
 * 원칙
 *   1) 한계비용이 0인 것은 전부 무료로 준다.
 *      만세력·원국·대운·세운·월운·택일·궁합 점수·규칙 브리핑은 모두 기기에서 계산된다.
 *      서버 비용이 0이므로 아낄 이유가 없다.
 *   2) AI를 부르는 것만 한도를 둔다. AI 호출이 곧 원가다.
 *   3) 한도에 걸려도 서비스가 멈추지 않는다. 규칙 기반 결과로 계속 쓸 수 있다.
 *
 * 여기의 한도는 화면 쪽 방어선이다. 최종 방어선은 프록시(서버)의 사용자별 한도와
 * Anthropic 콘솔의 월 지출 한도다. docs/09_수익구조.md 참고.
 */
(function (global) {
  'use strict';
  const KEY = 'chaeksa.usage';

  // 1회 예상 원가(원). 실측 토큰 기준.
  const COST = { brief: 5.4, chat: 18.8, consult: 32.4, profile: 29.7, compat: 18.8 };

  const PLANS = {
    guest:  { label: '둘러보기', brief: 0,  chat: 0,   consult: 0,  profile: 0, compat: 0 },
    free:   { label: '무료',     brief: 12, chat: 10,  consult: 3,  profile: 2, compat: 5 },
    member: { label: '구독',     brief: 62, chat: 200, consult: 30, profile: 8, compat: 60 },
  };

  const month = () => new Date().toISOString().slice(0, 7);

  function state() {
    let u;
    try { u = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { u = {}; }
    if (u.month !== month()) u = { month: month(), brief: 0, chat: 0, consult: 0, profile: 0, compat: 0 };
    return u;
  }
  const save = (u) => localStorage.setItem(KEY, JSON.stringify(u));

  /** 지금 등급. 로그인해야 AI를 쓸 수 있다 — 익명 무제한은 원가가 새는 구멍이다. */
  function plan() {
    const C = global.ChaeksaCloud;
    if (!C || !C.enabled()) return 'free';        // 서버 미설정 상태(개발 중)에서는 무료 등급
    if (!C.signedIn()) return 'guest';
    try {
      const s = C.session();
      if (s && s.user && s.user.app_metadata && s.user.app_metadata.plan === 'member') return 'member';
    } catch (e) {}
    return 'free';
  }

  function limit(task) { return PLANS[plan()][task] || 0; }
  function used(task) { return state()[task] || 0; }
  function left(task) { return Math.max(0, limit(task) - used(task)); }
  function can(task) { return left(task) > 0; }

  function record(task) {
    const u = state();
    u[task] = (u[task] || 0) + 1;
    save(u);
    return u[task];
  }

  /** 이번 달 이 사용자에게 든 대략적인 비용(원) — 화면에 보여주지 않고 진단용 */
  function monthCost() {
    const u = state();
    return Object.keys(COST).reduce((s, k) => s + (u[k] || 0) * COST[k], 0);
  }

  /** 한도에 걸렸을 때 화면에 띄울 안내 */
  function blockedMessage(task) {
    const p = plan();
    if (p === 'guest') {
      return { title: 'AI 비서는 로그인하면 열립니다',
               body: '만세력·원국·대운·택일·궁합은 로그인 없이도 모두 쓰실 수 있습니다. AI가 쓴 브리핑과 상담은 카카오로 로그인하시면 바로 사용 가능합니다.',
               cta: '카카오로 로그인' };
    }
    const names = { brief: '오늘 브리핑', chat: '비서와의 대화', consult: '심층 상담 서술', profile: '원국 해석', compat: '궁합 해설' };
    return { title: `이번 달 ${names[task] || 'AI'} 사용량을 다 쓰셨습니다`,
             body: '만세력·원국·택일·궁합과 규칙 기반 브리핑은 계속 무제한으로 쓰실 수 있습니다. AI가 쓴 글이 더 필요하시면 다음 달에 다시 열립니다.',
             cta: null };
  }

  global.ChaeksaUsage = { PLANS, COST, plan, limit, used, left, can, record, monthCost, blockedMessage, state };
})(window);
