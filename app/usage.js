/* 책사 사용량 관리 v2 — AI 원가가 매출을 넘지 못하게 막는 장치
 *
 * v1의 잘못된 설계를 바로잡은 것이다.
 *   v1: 무료 사용자에게 "매달" AI를 줬다 → 매출 0인 사용자에게 매달 원가가 나간다.
 *       무료 1,000명이면 월 수십만 원이 나가는데 들어오는 돈은 없다. 구조적으로 망한다.
 *   v2: 무료는 "평생 체험 횟수", 구독은 "매달 한도".
 *       무료 사용자 1인에게 드는 돈은 평생 약 160원으로 끝난다.
 *
 * 원칙
 *   1) 한계비용이 0인 것은 전부 무료·무제한. 만세력·원국·대운·택일·궁합 점수·규칙 브리핑은
 *      모두 기기에서 계산되므로 서버 비용이 0이다. 아껴봐야 남는 게 없다.
 *   2) AI를 부르는 것만 센다. AI 호출이 곧 원가다.
 *   3) 한도에 걸려도 서비스가 멈추지 않는다. 규칙 기반 결과로 계속 쓸 수 있다.
 *
 * 여기는 화면 쪽 방어선이다(저장소를 지우면 우회 가능). 최종 방어선은
 * 프록시의 사용자별 한도와 Anthropic 콘솔의 월 지출 한도다. docs/09_수익구조.md 참고.
 */
(function (global) {
  'use strict';
  const KEY_M = 'chaeksa.usage';        // 달마다 초기화 (구독자)
  const KEY_L = 'chaeksa.usageLife';    // 초기화 없음 (무료 체험)

  // 1회 예상 원가(원). 실측 토큰 + 프롬프트 캐싱 반영.
  const COST = { brief: 5.4, chat: 10.6, consult: 32.4, profile: 29.7, compat: 20.2, story: 950 };

  const PLANS = {
    // 비로그인: AI 없음. 계산 기능은 전부 열려 있다.
    guest: { label: '둘러보기', period: 'life', limits: { brief: 0, chat: 0, consult: 0, profile: 0, compat: 0, story: 0 } },
    // 무료: 평생 체험분. 소진되면 규칙 기반으로 계속 사용.
    // story 40 — 결제해도 등급은 free 로 남는다(등급을 올리려면 service_role 이 필요한데
    // 그 키는 쓰지 않기로 했다). 1년 열람 상품이 분기마다 다시 굽는 것을 감당하려면
    // 24 로는 열람 기간이 끝나기 전에 바닥난다. 서버(schema-9)와 같은 값이어야 한다.
    free: { label: '무료', period: 'life', limits: { brief: 5, chat: 5, consult: 1, profile: 1, compat: 1, story: 40 } },
    // 구독: 매달 초기화.
    member: { label: '구독', period: 'month', limits: { brief: 62, chat: 100, consult: 15, profile: 4, compat: 20, story: 60 } },
    // 슈퍼: 운영자 확인용. 서버(schema-9)의 ai_usage_limit 과 같은 값이어야 한다.
    // 켜는 곳은 여기가 아니라 JWT 의 app_metadata 다 — server/schema-9.sql 참고.
    super: { label: '책사', period: 'life', limits: { brief: 100000, chat: 100000, consult: 100000, profile: 100000, compat: 100000, story: 100000 } },
  };

  const month = () => new Date().toISOString().slice(0, 7);
  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };

  // 등급은 JWT payload 에서 직접 읽는다. session().user 는 me()를 불러야 채워지는데
  // 카카오 리다이렉트 직후에는 토큰만 있고 user 가 없다 — 그걸 읽으면 슈퍼계정도
  // 영원히 free 로 보인다(2026-08-29 실제로 그랬다). 토큰 안의 app_metadata 는
  // Supabase 가 서명해 넣은 값이라 그 자체가 정본이다.
  function jwtPlan(s) {
    try {
      const b = s.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const j = JSON.parse(atob(b));
      return (j.app_metadata && j.app_metadata.plan) || null;
    } catch (e) { return null; }
  }
  function plan() {
    const C = global.ChaeksaCloud;
    if (!C || !C.enabled()) return 'free';          // 서버 미설정(개발 중)에는 무료로 본다
    if (!C.signedIn()) return 'guest';
    try {
      const s = C.session();
      const p = jwtPlan(s) || (s && s.user && s.user.app_metadata && s.user.app_metadata.plan);
      if (p === 'member' || p === 'super') return p;
    } catch (e) {}
    return 'free';
  }
  const period = () => PLANS[plan()].period;

  function state() {
    if (period() === 'life') return jget(KEY_L, {});
    let u = jget(KEY_M, {});
    if (u.month !== month()) u = { month: month() };
    return u;
  }
  function save(u) {
    if (period() === 'life') localStorage.setItem(KEY_L, JSON.stringify(u));
    else { u.month = month(); localStorage.setItem(KEY_M, JSON.stringify(u)); }
  }

  const limit = (task) => PLANS[plan()].limits[task] || 0;
  const used = (task) => state()[task] || 0;
  const left = (task) => Math.max(0, limit(task) - used(task));
  const can = (task) => left(task) > 0;

  function record(task) {
    const u = state();
    u[task] = (u[task] || 0) + 1;
    save(u);
    return u[task];
  }

  /** 이번 기간에 이 사용자에게 든 대략적인 비용(원) — 진단용 */
  function cost() {
    const u = state();
    return Math.round(Object.keys(COST).reduce((s, k) => s + (u[k] || 0) * COST[k], 0));
  }

  const NAMES = { brief: '오늘 브리핑', chat: '비서와의 대화', consult: '심층 상담 서술', profile: '원국 해석', compat: '궁합 해설' };

  function blockedMessage(task) {
    const p = plan();
    if (p === 'guest') {
      return {
        title: '책사단의 글은 로그인하면 열립니다',
        body: '만세력·원국·대운·택일·궁합은 로그인 없이도 모두 쓰실 수 있습니다. AI가 쓴 브리핑과 상담은 카카오로 로그인하시면 바로 사용 가능합니다.',
        cta: '카카오로 로그인',
      };
    }
    if (p === 'free') {
      return {
        title: `${NAMES[task] || 'AI'} 체험을 다 쓰셨습니다`,
        body: '만세력·원국·대운·택일·궁합과 규칙 기반 브리핑은 계속 무제한으로 쓰실 수 있습니다. AI가 매일 써주는 글을 원하시면 구독을 준비 중입니다.',
        cta: null,
      };
    }
    return {
      title: `이번 달 ${NAMES[task] || 'AI'} 한도를 다 쓰셨습니다`,
      body: '규칙 기반 결과는 계속 쓰실 수 있고, 다음 달에 한도가 새로 열립니다.',
      cta: null,
    };
  }

  global.ChaeksaUsage = { PLANS, COST, NAMES, plan, period, limit, used, left, can, record, cost, blockedMessage, state };
})(window);
