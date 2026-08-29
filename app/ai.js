/* 책사 AI 비서 모듈 v1 — Claude API
 * 계산은 엔진이, 해석만 AI가. 원국·대운·오늘 일진을 시스템 프롬프트로 고정 전달.
 * 프로토타입: 브라우저에서 직접 호출(키는 사용자 기기에만 저장). 출시 시엔 proxyUrl(서버)로 전환.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, f = E.fmt;
  const KEY = 'chaeksa.ai';

  // 기본 프록시 — 방문자는 키 없이 바로 쓸 수 있다.
  // (Anthropic이 Cloudflare 발신 요청을 간헐 차단하므로 Vercel/Node 경유. docs/04 참고)
  const DEFAULT_PROXY = 'https://chaeksa-claude.vercel.app/api/chat';

  /* 작업마다 필요한 능력이 다르다. 뼈대가 확정된 서술은 작은 모델로 충분하고,
     판단이 섞이는 일만 큰 모델을 쓴다. 실측 기준(입력 약 2,700토큰 · 출력 200~300토큰):
       브리핑 1회  하이쿠 약 5원 · 소네트 약 11원 · 오퍼스 약 28원
     기본값은 '균형'. 설정에서 바꿀 수 있다. */
  const TIERS = {
    // story(결제 콘텐츠 본문)는 어느 등급에서도 opus — 돈 낸 사람의 글을 아끼지 않는다.
    quality: { brief: 'claude-opus-5',   chat: 'claude-opus-5',   consult: 'claude-opus-5',   profile: 'claude-opus-5', compat: 'claude-opus-5',  story: 'claude-opus-5' },
    balanced:{ brief: 'claude-haiku-4-5', chat: 'claude-sonnet-5', consult: 'claude-sonnet-5', profile: 'claude-opus-5', compat: 'claude-sonnet-5', story: 'claude-opus-5' },
    thrifty: { brief: 'claude-haiku-4-5', chat: 'claude-haiku-4-5', consult: 'claude-sonnet-5', profile: 'claude-sonnet-5', compat: 'claude-haiku-4-5', story: 'claude-opus-5' },
  };
  const modelFor = (task) => {
    const s = settings();
    if (s.model) return s.model;                       // 사용자가 하나로 고정한 경우
    const t = TIERS[s.tier || 'balanced'] || TIERS.balanced;
    return t[task] || t.chat;
  };
  /* 모델마다 받는 파라미터가 다르다.
     - fallbacks: Opus 5 전용 (다른 모델에 보내면 400)
     - output_config.effort: Haiku 4.5는 지원하지 않음 */
  function paramsFor(model, effort) {
    const p = {};
    if (model === 'claude-opus-5') { p.fallbacks = 'default'; p.output_config = { effort: effort || 'low' }; }
    else if (model === 'claude-sonnet-5') { p.output_config = { effort: effort || 'low' }; }
    return p;   // haiku는 추가 파라미터 없이
  }
  function settings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
    if (!s.apiKey && !s.proxyUrl) s.proxyUrl = DEFAULT_PROXY;   // 개인 키를 넣었다면 그쪽이 우선
    return s;
  }
  function saveSettings(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  function ready() { const s = settings(); return !!(s.apiKey || s.proxyUrl); }  // 기본 프록시 덕분에 항상 true

  function chartText(r, today) {
    const a = r.analysis, p = r.pillars;
    const tf = E.dateFortune(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const du = E.currentDaeun(r, today);
    const g = (k) => a.gods[k] ? `${a.gods[k].stem ?? '일간'}/${a.gods[k].branch}` : '';
    const lines = [
      `[원국] 연주 ${f.pillar(p.year)}(${g('year')}) 월주 ${f.pillar(p.month)}(${g('month')}) 일주 ${f.pillar(p.day)}(${g('day')}) 시주 ${p.hour ? f.pillar(p.hour) + '(' + g('hour') + ')' : '모름'}`,
      `[일간] ${f.stem(a.dayStem)} ${a.dayElem} (${a.dayYang ? '양' : '음'}) · 오행 개수(천간+지지 정기) 목${a.elemCount[0]} 화${a.elemCount[1]} 토${a.elemCount[2]} 금${a.elemCount[3]} 수${a.elemCount[4]} · 없는 오행: ${a.missing.join(',') || '없음'}`,
      `[판단 지침] 신강·신약, 용신·기신은 위 원국(월령·통근·지장간·합충)을 보고 당신이 직접 판단한다. 계산기의 단순 개수 세기에 의존하지 말 것.`,
      `[지장간] 연 ${a.gods.year.hidden.map(h => f.stem(h.stem) + h.god).join(' ')} / 월 ${a.gods.month.hidden.map(h => f.stem(h.stem) + h.god).join(' ')} / 일 ${a.gods.day.hidden.map(h => f.stem(h.stem) + h.god).join(' ')}${a.gods.hour ? ' / 시 ' + a.gods.hour.hidden.map(h => f.stem(h.stem) + h.god).join(' ') : ''}`,
      `[대운] ${r.daeun.forward ? '순행' : '역행'} ${r.daeun.startAge}세 시작 · ` + r.daeun.list.map(d => `${d.startAge}세 ${f.pillar(d)}`).join(', '),
      `[현재] ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} · 대운 ${du ? f.pillar(du) + '(' + E.TEN_GODS[E.tenGod(a.dayStem, du.stem)] + ')' : '미정'} · 세운 ${f.pillar(tf.year)}(${E.TEN_GODS[E.tenGod(a.dayStem, tf.year.stem)]}) · 월운 ${f.pillar(tf.month)}(${E.TEN_GODS[E.tenGod(a.dayStem, tf.month.stem)]}) · 일운 ${f.pillar(tf.day)}(${E.TEN_GODS[E.tenGod(a.dayStem, tf.day.stem)]})`,
      `[출생] ${r.input.year}-${r.input.month}-${r.input.day} ${r.input.hour != null ? r.input.hour + ':' + String(r.input.minute || 0).padStart(2, '0') : '시간 모름'} ${r.input.gender === 'M' ? '남' : '여'} · 진태양시 보정 ${r.input.solarCorrection === false ? '안 함' : '함'}`,
    ];
    return lines.join('\n');
  }

  // 원국 해석 프로필 — 처음 한 번만 깊게(effort high) 분석해서 고정. 이후 모든 답변은 이 위에서.
  function profileKey(r) { return `chaeksa.profile.ai.${r.input.year}${r.input.month}${r.input.day}.${r.input.hour}.${r.input.gender}`; }
  function getProfile(r) { return localStorage.getItem(profileKey(r)); }
  async function buildProfile(r, today) {
    const cached = getProfile(r); if (cached) return cached;
    const sys = `당신은 30년 경력의 명리학자입니다. 아래 원국을 정밀 분석해 이 사람의 "고정 해석"을 작성합니다. 이 해석은 이후 매일의 브리핑과 상담에서 바뀌지 않는 기준이 됩니다. 계산은 하지 않으며 주어진 간지를 그대로 씁니다.

${chartText(r, today)}`;
    const q = `다음 항목을 정확히 이 형식으로 작성하세요. 각 항목 1~2문장, 전체 600자 이내. 이유는 월령·통근·지장간·합충 근거를 간단히.
신강신약: (신강/중화/신약 중 하나와 근거)
용신: (오행과 이유)
기신: (오행과 이유)
격국: (있으면)
핵심성향: (3가지, 쉬운 말)
강점: 
주의점: 
현재대운: (지금 대운이 이 사람에게 어떤 시기인지)`;
    const text = await call(sys, [{ role: 'user', content: q }], { task: 'profile', maxTokens: 1200, effort: 'high' });
    localStorage.setItem(profileKey(r), text);
    return text;
  }

  function systemPrompt(r, today) {
    const prof = getProfile(r);
    return `당신은 "책사", 한 사람만을 위한 개인 명리비서입니다. 아래 사람의 사주 원국을 완전히 알고 있고, 매일 옆에서 오늘을 읽어주는 또래 친구 같은 조언자입니다.

## 원칙
- 겁주지 않는다. "삼재", "대흉", "조심하세요" 식의 불안 조장 금지. 안 좋은 흐름도 "그래서 이렇게 하면 된다"는 대처와 함께.
- 행동으로 끝낸다. 모든 답은 구체적인 행동 한 가지로 마무리.
- 짧다. 브리핑은 공백 포함 250자 이내, 질문 답변은 350자 이내. 아침에 폰으로 30초 안에 읽는 분량. 보고서가 아니라 대화.
- 한자는 첫 문장의 오늘 일진(예: 庚午) 딱 한 곳에만 허용. 그 외 한자 간지·한자 오행 표기 금지. 대운·세운·월운은 "지금 대운", "올해", "이달"이라고만 부르고 간지는 쓰지 않는다.
- 십신 이름은 한 번 쓰고 바로 괄호로 풀이. 이후엔 풀이말만 쓴다.
- 구조: ①오늘의 결 한 문장 ②그래서 좋은 것/조심할 것 한두 문장 ③시간대 있으면 짧게 ④마지막 줄은 "오늘 할 행동 하나:"로 시작하는 구체적 행동.
- 솔직하다. 좋은 것만 말하지 않는다. 다만 표현은 따뜻하게.

## 브리핑 본보기 (이 길이·이 말투·이 정도의 한자 사용량을 그대로 따른다)
오늘은 경오(庚午)일, 실속과 돈의 기운이 내 뿌리 자리로 들어오는 날이에요. 불기운이 약한 분께는 힘이 되지만, 올해와 지금 대운에 '나눠 쓰는 기운'이 겹쳐 있어 추진력은 최고인데 지갑은 헐거워지기 쉬워요. 판단이 또렷한 오전 9시~오후 1시에 중요한 대화를 몰아두고, 저녁 즉흥 결제는 하루만 미루세요.
오늘 할 행동 하나: 나가기 전에 오늘 쓸 돈 상한선을 숫자로 정해 메모하기.
- 계산은 하지 않는다. 아래 [원국]·[현재] 데이터가 정답이며 절대 다시 계산하거나 다른 간지를 말하지 않는다.
- 명리 용어는 쓰되 바로 풀어 말한다. 예: "정관(나를 바로 세우는 기운)".
- 의료·투자·법률 판단은 하지 않는다. 물으면 흐름만 읽어주고 전문가에게 맡기라고 한 문장으로.
- 결정은 사용자가 한다. "이렇게 하세요"가 아니라 "이 흐름이라면 이런 선택이 편하다" 톤.
- 반말이 아닌 부드러운 존댓말. 이모지는 쓰지 않는다.

## 이 사람의 사주 (계산 완료, 확정값)
${chartText(r, today)}
${prof ? `
## 확정된 원국 해석 (이미 정밀 분석 완료. 절대 번복하지 말고 이 위에서만 오늘·올해를 읽는다)
${prof}` : ''}`;
  }

  async function call(system, messages, opts = {}) {
    const s = settings();
    const task = opts.task || 'chat';
    // 개인 키를 직접 넣은 사용자는 본인이 비용을 내므로 한도를 걸지 않는다
    const U = global.ChaeksaUsage;
    if (U && !s.apiKey && !U.can(task)) {
      const m = U.blockedMessage(task);
      const err = new Error(m.title);
      err.blocked = m;
      throw err;
    }
    const model = opts.model || modelFor(task);
    /* 프롬프트 캐싱 — 원국·고정 해석·체용 좌표는 대화 내내 똑같이 반복된다.
       앞부분을 캐시에 올려두면 두 번째 턴부터 그 부분이 1/10 가격이 된다.
       (캐시 최소 길이가 있어 짧은 프롬프트나 haiku에서는 그냥 넘어간다 — 손해는 없다) */
    const cacheable = opts.cache !== false && system.length > 3000;
    const body = Object.assign({
      model,
      max_tokens: opts.maxTokens || 1024,
      system: cacheable
        ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
        : system,
      messages,
    }, paramsFor(model, opts.effort));
    let url, headers = { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' };
    if (body.fallbacks) headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    if (s.proxyUrl) {
      url = s.proxyUrl;
      // 프록시가 서버에서 인증·계량한다 (api/chat.js + server/schema-5.sql).
      // 토큰이 없으면 안 실어 보낸다 — 서버가 401로 막고, 그 메시지를 그대로 보여준다.
      headers['x-chaeksa-task'] = task;
      if (opts.cachePk) headers['x-chaeksa-cache'] = opts.cachePk;
      try {
        const C = global.ChaeksaCloud;
        const tok = C && C.token ? await C.token() : null;
        if (tok) headers.authorization = 'Bearer ' + tok;
      } catch (e) {}
    }
    else { url = 'https://api.anthropic.com/v1/messages'; headers['x-api-key'] = s.apiKey; headers['anthropic-dangerous-direct-browser-access'] = 'true'; }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`, raw = '', kind = '';
      try { const j = await res.json(); raw = j.error?.message || ''; kind = j.error?.type || ''; msg = raw || msg; } catch (e) {}
      // 서버가 한도·로그인을 막은 것 — 혼잡·장애와 섞으면 안 된다.
      if (kind === 'baking') {
        // 다른 요청이 같은 간명을 굽는 중 — 실패가 아니라 「기다리면 온다」 신호
        const err = new Error(raw || '간명을 굽는 중입니다.');
        err.baking = true;
        throw err;
      }
      if (kind === 'timeout') {
        // 굽다가 시간 벽에 걸렸다 — 토큰은 이미 쓴 실패다. 자동 재시도를 절대 걸지 않는다.
        const err = new Error(raw || '간명이 시간 안에 끝나지 않았습니다.');
        err.timeout = true;
        throw err;
      }
      if (kind === 'quota' || kind === 'auth') {
        // 화면 카운터를 서버 판정에 맞춘다. 지운 localStorage로 다시 물어봐도 서버가 다시 막는다.
        if (kind === 'quota' && global.ChaeksaUsage) {
          // record()로 채워야 저장까지 된다. state()가 주는 건 사본이다.
          try { const U = global.ChaeksaUsage; let g = U.limit(task) + 1; while (U.can(task) && g-- > 0) U.record(task); } catch (e) {}
        }
        const err = new Error(raw || '사용 한도에 닿았습니다.');
        err.blocked = kind === 'quota' && global.ChaeksaUsage
          ? global.ChaeksaUsage.blockedMessage(task)
          : { title: raw || '로그인이 필요합니다', body: '', cta: null };
        throw err;
      }
      // 서버 사정으로 막힌 경우는 사용자 탓이 아니다. 영어 원문을 그대로 보여주지 않는다.
      const low = (raw + ' ' + res.status).toLowerCase();
      const serverSide =
        /credit|balance|quota|billing|spend limit|payment|insufficient/.test(low) ? '지금 비서를 부를 수 없습니다. 저희 쪽 사정이니 잠시 뒤 다시 열어드리겠습니다.'
        : res.status === 429 ? '지금 요청이 몰려 있습니다. 잠시 뒤 다시 시도해 주세요.'
        : res.status >= 500 ? '비서 쪽 서버가 잠시 불안정합니다. 곧 정상으로 돌아옵니다.'
        : null;
      if (serverSide) {
        const err = new Error(serverSide);
        err.serverSide = true;
        err.detail = raw;              // 콘솔 확인용 — 화면에는 안 띄운다
        throw err;
      }
      throw new Error(msg);
    }
    const j = await res.json();
    if (j.usage) global.__chaeksaLastUsage = j.usage;
    if (global.ChaeksaUsage && !s.apiKey) global.ChaeksaUsage.record(task);
    if (j.stop_reason === 'refusal') throw new Error('이 질문에는 답하지 않는 게 좋겠어요. 다른 방식으로 물어봐 주세요.');
    // 잘린 글을 받아 캐시에 굳히면 「맺음말 없는 간명서」가 영원히 남는다.
    // 짧은 브리핑은 천장에 닿는 게 정상이라 strict 를 켠 곳에서만 실패로 다룬다.
    if (opts.strict && j.stop_reason === 'max_tokens') {
      const err = new Error('간명이 길이 제한에 걸려 끝을 못 맺었습니다.');
      err.truncated = true;
      throw err;
    }
    return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  }

  // 한자 간지 → 한글 (브리핑 본문용). 첫 "한글(漢字)" 괄호 표기 하나는 남기고, 나머지 한자는 전부 한글로.
  const HANJA = { 甲:'갑',乙:'을',丙:'병',丁:'정',戊:'무',己:'기',庚:'경',辛:'신',壬:'임',癸:'계',子:'자',丑:'축',寅:'인',卯:'묘',辰:'진',巳:'사',午:'오',未:'미',申:'신',酉:'유',戌:'술',亥:'해',木:'목',火:'화',土:'토',金:'금',水:'수' };
  function dehanja(text) {
    let kept = false;
    return text.replace(/\(([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\)/, (m) => { if (!kept) { kept = true; return '§' + m + '§'; } return m; })
      .replace(/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水]/g, (c) => HANJA[c])
      .replace(/§\((..)\)§/, (m, kr) => '(' + [...kr].map(c => Object.keys(HANJA).find(k => HANJA[k] === c) || c).join('') + ')');
  }

  /** 6차원 적층 체용 좌표를 프롬프트용 문장으로 */
  function chaeyongText(cy) {
    if (!cy) return '';
    const L = ['[6차원 적층 체용 좌표]'];
    cy.layers.forEach(l => {
      if (l.level === 1) { L.push(`  1층 원국 ${l.ganji} — ${l.strength} (${l.score})`); return; }
      L.push(`  ${l.level}층 ${l.name} ${l.ganji}${l.period ? '(' + l.period + ')' : ''} — 體 ${l.bodyStrength} 기준으로 用 ${l.god}(${l.group})은 ${l.sign} ${l.value > 0 ? '+' : ''}${l.value}${l.moved ? ' · 강약 ' + l.moved : ''}${l.rels && l.rels.length ? ' · ' + l.rels.join(',') : ''}`);
    });
    L.push(`  총합 ${cy.sum > 0 ? '+' : ''}${cy.sum} (양수면 흐름이 돕는 쪽, 음수면 누르는 쪽)`);
    if (cy.turns && cy.turns.length) L.push(`  변곡점: ` + cy.turns.map(t => `${t.from}(${t.fromSign}) → ${t.to}(${t.toSign})`).join(', '));
    if (cy.shifted) L.push(`  층을 지나며 일간이 ${cy.natalStrength}에서 ${cy.finalStrength}으로 옮겨감`);
    // 총합(판)과 촉발(방아쇠)은 다른 축이다. 둘 다 줘야 "판은 눌렸는데 지금 터진다"를 쓴다.
    L.push(`  촉발 ${cy.trigger > 0 ? '+' : ''}${cy.trigger} — 짧은 주기일수록 무겁게 본 값. 지금 방아쇠가 얼마나 당겨졌나`);
    if (cy.triggerBy) L.push(`  방아쇠 층: ${cy.triggerBy} (판을 깐 건 긴 주기지만 터지는 건 여기다)`);
    return L.join('\n');
  }

  /** 통변엔진이 정한 '오늘의 뼈대'를 프롬프트에 넣는다.
   *  이렇게 하지 않으면 같은 사주라도 날마다 LLM이 다른 판단을 내놓는다. */
  /** 오늘 12시진 곡선 — 시각과 사건 라벨은 코드가 확정하고, LLM은 문장만 만든다. */
  /** 기간 스캔 결과 — 시기와 날짜는 코드가 확정한다. LLM은 이 안에서만 말한다. */
  function whenText(fr) {
    const w = fr && fr.when;
    if (!w || !w.span) return '';
    const NL = String.fromCharCode(10);
    const multi = w.years.length > 1;
    const cells = multi ? w.years : w.months;
    const nm = c => multi ? c.y + '년' : c.m + '월';
    const hi = cells.reduce((a, b) => (b.rel > a.rel ? b : a), cells[0]);
    const lo = cells.reduce((a, b) => (b.rel < a.rel ? b : a), cells[0]);
    const d = r => `${multi ? r.y + '.' : ''}${r.m}/${r.d}(${r.ganji} ${r.god})`;
    return [
      `[기간 기저 좌표] ${w.baseline > 0 ? '+' : ''}${w.baseline} — 기간 전체의 성격`,
      `[기간 내 편차] ` + cells.map(c => `${nm(c)} ${c.rel > 0 ? '+' : ''}${c.rel}`).join(', '),
      `[높은 때] ${nm(hi)} / [낮은 때] ${nm(lo)}`,
      `[골라 쓸 날] ` + w.best.map(d).join(', '),
      `[피할 날] ` + w.worst.map(d).join(', '),
      w.turns.length ? `[흐름이 뒤집히는 지점] ` + w.turns.map(t => `${t.from.y}년 ${t.from.m}월 → ${t.to.y}년 ${t.to.m}월`).join(', ') : '',
    ].filter(Boolean).join(NL);
  }

  function hourCurveText(df) {
    const NL = String.fromCharCode(10);
    const hc = df && df.hours;
    if (!hc || !hc.rows || !hc.rows.length) return '';
    const line = hc.rows.map(r => `${r.range}시 ${r.god} ${r.sign}${r.value > 0 ? '+' : ''}${r.value}`).join(' / ');
    const up = hc.rows.filter(r => r.value > 0.3);
    const dn = hc.rows.filter(r => r.value < -0.3);
    return [
      `[오늘 12시진] ${line}`,
      up.length ? `[힘이 붙는 때] ${up.map(r => r.range + '시 ' + r.label).join(', ')}` : '',
      dn.length ? `[힘이 빠지는 때] ${dn.map(r => r.range + '시 ' + r.label).join(', ')}` : '',
      hc.peak && hc.peak.value > 0.3 ? `[오늘의 정점] ${hc.peak.range}시 ${hc.peak.god} — ${hc.peak.label}` : '',
    ].filter(Boolean).join(NL);
  }

  function dayFrameText(df) {
    if (!df) return '';
    const L = [
      `[오늘] ${df.date} · ${df.dayGanji}(${df.dayGanjiKo})일`,
      `[들어오는 기운] 천간 ${df.godDay}, 지지 ${df.godDayBranch} — ${df.groupMeaning}`,
      `[흐름] 대운 ${df.godDaeun || '미정'} · 올해 ${df.godYear} · 이달 ${df.godMonth}`,
      `[일간] ${df.strength}`,
      df.relations.length ? `[원국과의 관계] ` + df.relations.map(r => `${r.pillar}와 ${r.rel}`).join(', ') : '',
      `[오늘 ${df.dayElem} 기운] ${df.helpful ? '이 사주가 반기는 쪽 — 감당하기 수월한 날' : '꼭 필요한 기운은 아님 — 무리하지 않는 편이 낫다'}`,
      df.season ? `[조후] ${df.season}` : '',
      df.goodHours ? `[집중이 붙는 시간대] ${df.goodHours}` : '',
      hourCurveText(df),
      df.tone ? `[오늘의 결] ${df.tone}` : '',
      df.care ? `[주의] ${df.care}` : '',
      df.action ? `[권할 행동] ${df.action}` : '',
      df.chaeyong ? chaeyongText(df.chaeyong) : '',
    ].filter(Boolean);
    return L.join('\n');
  }

  // 오늘 브리핑 (날짜별 캐시)
  /** 유료 스토리의 「책사의 말」 — 엔진이 계산한 사실을 사람의 말로 잇는다.
   * 사실은 이미 화면에 표로 떠 있다. AI 의 일은 숫자를 내는 게 아니라
   * 조리 있게, 위로가 되게, 다음 걸음이 궁금해지게 말하는 것뿐이다.
   * 사실 밖의 연도·숫자는 금지 — 지어내면 표와 어긋나서 바로 들킨다. */
  /** 유료 스토리의 「책사의 말」 — 결제 콘텐츠의 본문이다. 요약이 아니라 보고서다.
   * 사실(연표·점수·달·날)은 룰 엔진이 냈고 표로 이미 떠 있다. AI 는 그 사실만 갖고
   * 길게, 조리 있게, 위로가 되게 쓴다. 사실 밖 숫자는 금지 — 표와 어긋나면 바로 들킨다. */
  async function storyTell(kind, facts) {
    // whom(어떤 사람이 나를 사랑하는가)은 연표가 아니라 인물 서술이라 판이 다르다.
    if (kind === 'whom') {
      const sys = '너는 사주명리 비서 「책사」다. 사용자가 결제한 「어떤 사람이 나를 사랑하는가」 화면의 본문이다. 화면 위에는 규칙 엔진이 낸 결론(상대의 오행·정과 편의 글자·합·매력·배우자 방 재료)이 표로 떠 있고 [계산된 사실]이 그 전부다.\n'
      + '규칙: 사실 밖의 글자·단정 금지. 전문용어는 처음 한 번 괄호로 풀기. 따뜻하고 단단한 존댓말, 겁주지 않기, 「~하기 쉽습니다」. 전체 3,000~4,500자, 문단 사이 빈 줄.\n'
      + '구성: 1) 원국이 정해 둔 상대의 결 — 오행과 결을 일상 언어로. 2) 반듯하게 오는 사람 — 어떤 장면으로 다가오는지 구체적인 장면 하나로. 3) 강렬하게 오는 사람 — 마찬가지로. 4) 합인 글자의 사람 — 왜 서로 한눈에 알아보는지. 5) 그들이 당신의 무엇에 걸리는가 — 매력과 도화를 풀어서. 6) 곁에 오래 남는 사람(배우자 방의 재료)과 그 사랑이 도착하는 방식. 맺음 — 「언제 오는가」는 인연이 오는 해 화면에 열려 있다는 한 문장.\n'
      + '[계산된 사실]\n' + JSON.stringify(facts);
      return dehanja(await call(sys, [{ role: 'user', content: '나를 사랑하게 될 사람 이야기를 처음부터 끝까지 써줘.' }],
        { task: 'story', maxTokens: 8000, effort: 'high' }));
    }
    const 주제 = kind === 'wealth' ? '재물' : '인연';
    const sys = '너는 사주명리 비서 「책사」다. 지금 이 글은 사용자가 2만원을 내고 연 유료 화면의 본문이다. 화면 위쪽에는 규칙 엔진이 계산한 ' + 주제 + ' 연표(과거 구간·현재·다가오는 열두 달·날·시진)가 표로 떠 있고, 아래 [계산된 사실]이 그 전부다.\n'
      + '절대 규칙:\n'
      + '- 사실에 없는 연도·달·날짜·숫자를 만들지 마라. 사실에 있는 것은 빠짐없이 다뤄라.\n'
      + '- [결론]은 엔진이 이미 이어 놓은 추론 사슬이다(통로·해방·정화·응기와 해의 연결). 서술의 척추로 삼아 결론 하나마다 한 문단씩, 왜 그렇게 이어지는지를 풀어라. 결론과 어긋나는 말은 금지.\n'
      + '- [자료집]이 이 사람 원국의 전부다: 사주 여덟 글자·일간·강약·오행 분포·격국·조후·대운·세운. 서술의 뼈대를 반드시 여기서 세워라 — 일반론은 한 줄도 쓰지 마라. 이 사람 글자를 짚어라.\n'
      + '- 자료집과 열두달의 각 항목에는 값 뒤에 풀이가 붙어 있다(— 뒤와 뜻·결 필드). 너의 일은 그 풀이를 다시 열 배로 펼치는 것이다: 항목마다 (1) 그것이 무슨 뜻인지 쉬운 말로, (2) 일상의 비유나 장면 하나로, (3) 「그래서 당신의 삶에서는 이렇게 나타나기 쉽습니다」까지. 나열하지 말고 하나의 이야기로 엮어라.\n'
      + '- 읽는 사람은 명리를 전혀 모르는 일반인이다. 중학생이 읽어도 따라올 문장으로 써라. 명리 용어는 써도 되지만 처음 나올 때 한 번 괄호로 풀어라. 예: 재성(당신에게 인연으로 오는 글자). 자료집에 없는 용어·글자는 금지.\n'
      + '- 따뜻하고 단단한 존댓말. 겁주지 않는다. 단정 대신 「~하기 쉽습니다」.\n'
      + '- 전체 4,500~6,000자. 아끼지 마라 — 결제한 사람의 본문이다. 소제목 없이 문단으로만, 문단 사이는 빈 줄.\n'
      + '구성 (각 절 600~900자):\n'
      + '1) 첫머리 — 자료집을 펴라: 일간이 무엇이고, 강약이 어떻고, 격국·조후가 어떤 형편이라, 이 사주가 ' + 주제 + '을 어떤 결로 타고났는지. 진단의 문장들을 원국 글자와 엮어 구체적으로.\n'
      + '2) 지나온 자리 — 과거 구간 하나하나를 각각 짚어라. 그 무렵 몇 살이었고 어떤 자리였는지, 「그때 그런 일이 있으셨다면 이 계산이 맞게 가고 있는 것」이라는 확인을 자연스럽게. 절정 달이 있으면 그 달까지 말하라.\n'
      + '3) 흔들렸던 해가 있으면 — 그 해를 부드럽게. 상처가 아니라 지나간 결이었다고.\n'
      + '4) 지금 — 현재 구간의 의미. 위로하되 값싸지 않게. 조용함·문턱·열림 각각의 뜻을.\n'
      + '5) 다가오는 열두 달 — [열두달]을 시간순으로 따라가되, 달마다 그 달의 간지가 이 원국의 어떤 글자와 만나는지(자료집의 일지·천간, 열두달의 이유)를 짚으며 말하라. 열림인 달은 날짜와 행동까지 구체적으로, 조용한 달은 왜 조용한지 짧게. 이음·지침 필드를 따르라 — 지침이 「날 추천 금지」인 달에 날을 권하지 마라. 대운(자료집)의 10년 바탕 위에서 읽어라.\n'
      + (kind === 'wealth' ? '6) 지킬 해 — 새는 해가 있으면 반드시 따로. 무엇을 조심하고 무엇은 해도 되는지.' + '\n' : '')
      + '맺음 — 두세 문장. 이 계산이 정답이 아니라 「이 기준으로는 이렇게 나왔다」라는 것, 그리고 다음 걸음('
      + (kind === 'wealth' ? '달이 바뀌면 이번 달 흐름을 새로 볼 수 있다' : '그 해가 가까워지면 달과 날을 다시 보러 오라')
      + ') 하나.\n'
      + '[계산된 사실]\n' + JSON.stringify(facts);
    return dehanja(await call(sys, [{ role: 'user', content: 주제 + ' 이야기를 처음부터 끝까지 써줘.' }],
      { task: 'story', maxTokens: 10000, effort: 'high' }));
  }

  // ── 간명서 — 채팅에서 90% 채점을 받은 간명 방식을 그대로 이식한다 ──
  // 형식이 곧 제품이다: 번호 문항 + 「맞는지는 본인이 아십니다」 + 채점 요청.
  // 규칙은 법전에서 왔다: 한 문항 한 주장(제24조) · 사건년 양방향(제21조, 방향은
  // 가로채임·합거만) · 충 금지(제23조) · 있는 그대로(사실 밖 금지).
  // ── 간명가의 머리를 프롬프트로 이사시킨다 (2026-08-30 「말투 차이가 너무 심하다」) ──
  // 규칙 몇 줄이 아니라: 법전 전 조문 요약 + 온전한 간명 전문(실채점 90%)을 통째로.
  // 프롬프트 캐싱(cache_control)이 있어 길어도 비용은 거의 안 는다.
  const 간명법전 = '[법전 요약 — 이 조문들로만 판단한다]\n'
    + '천간은 명령이다 — 뿌리(통근)가 없으면 약속어음이고, 합거된 글자는 명령이 없다.\n'
    + '탈성합: 일간의 글자를 원국의 다른 천간이 합으로 가져가면 그 몫은 그의 것이다. 가로채임: 원국에 겁재가 떠 있으면 운으로 오는 재성을 합으로 선점한다 — 이 자리만 방향(뺏김)을 말할 수 있다.\n'
    + '배우자 방(일지) 본기가 진짜 인연의 글자다 — 그 글자를 합으로 데려오는 글자가 방아쇠. 방 글자가 하늘에도 떠 있으면 회전문: 방아쇠 성이 와도 하늘과 합해 겉돌아, 들어왔다 나가기를 반복한다. 회전문을 타지 않는 글자가 방을 지킨다.\n'
    + '두 번의 법칙: 막힌 통로는 글자가 두 번 겹쳐야 뚫린다 — 대운 천간도 한 번으로 센다(대운에 떠 있으면 세운 한 번으로 뚫린다).\n'
    + '정(음양 다름)=안정형, 편(음양 같음)=불안형. 접착 사분면: 양의 기운 남성·음의 기운 여성은 배우자성과 일간이 손을 맞잡는 합 — 인연을 제 손으로 붙드는 힘. 음의 기운 남성·양의 기운 여성은 그 손이 따로 없다.\n'
    + '십이운성: 절·묘의 글자는 꺼진 등 — 감점이 아니라 스위치(장생지)가 따로 있는 등이다. 그 스위치가 오는 해에 켜진다.\n'
    + '인성은 근거다 — 정인은 공인된 근거(학위·자격·문서), 편인은 편법과 불법의 차이를 아는 감각.\n'
    + '운의 천지: 천간으로 오면 마음의 사건(필요성을 깨닫는 해), 지지로 오면 행동의 사건(가지려 몸이 움직이는 해). 결과는 단정하지 않는다.\n'
    + '사건년은 양방향으로만: 축이 움직였다까지. 충·형은 말하지 않는다. 암장 세부를 파서 단정하지 않는다 — 애매하면 계산하지 않는 것이 이 집의 법이다.';
  const 간명본보기 = '[본보기 — 이 밀도·리듬·목소리 그대로. 세 책사의 값은 실제로 엔진이 낸 것이다]\n'
    + '壬申 己酉 辛亥 丙申. 가을 바위산의 보석이 바다를 안고 있는 자리입니다. 세 사람을 부르겠습니다.\n'
    + '[먼저 뼈대를 두고]\n'
    + '① 〔자평진전〕 건록격입니다. 관이 하늘로 나왔고 재와 인이 그 뒤를 따르니 격은 섰습니다. 다만 온전하지는 않습니다 — 관을 쓰는 자리에 상관이 함께 있어 흠이 하나 걸립니다. 이 자리의 기둥은 시간의 丙 정관이고, 그것을 지키는 일이 평생의 과제입니다.\n'
    + '② 〔궁통보감〕 나는 격보다 먼저 이분이 추운지 더운지를 봅니다. 辛금이 유월에 났으니 살길은 壬 하나입니다. 다행히 연간에 그 壬이 떠 있습니다 — 씻겨서 빛나는 보석입니다.\n'
    + '③ 〔자평진전〕 바로 그 壬이 내가 말한 흠입니다. 관을 쓰는데 상관이 곁에 있으니, 지켜야 할 것을 스스로 건드리는 자리라는 뜻입니다.\n'
    + '④ 〔궁통보감〕 알고 있습니다. 그러나 그것이 없으면 이분은 빛나지 못합니다. 흠이라 부르시는 그것이 이분의 재주입니다 — 머리가 차갑게 좋고, 말이 정확하고, 아름다운 것을 알아보는 눈. 금수상관이라 부르는 자리입니다.\n'
    + '⑤ 〔궁통보감〕 다만 보조로 있어야 할 甲이 하늘에 없습니다. 기신은 화와 토인데 무리를 이루지는 않았고, 월간의 己 하나가 壬 곁에 앉아 맑게 흐를 총명함을 한 번 탁하게 합니다. 생각이 많아 스스로 발목을 잡으신 날이 있었을 겁니다.\n'
    + '⑥ 〔협기〕 나는 살(殺)을 검증한 사람입니다. 이 자리에서 겁주는 이름을 들먹이지 않겠습니다 — 청 황실이 이미 그 상당수를 술사의 날조로 판정해 지웠습니다. 내가 나설 자리는 「그래서 언제인가」를 물으실 때입니다. 달과 날과 시각은 내 몫입니다.\n'
    + '[좌장이 받습니다]\n'
    + '⑦ 〔좌장〕 두 분 말씀이 한 글자에서 갈렸습니다. 壬을 흠이라 하시고 살길이라 하셨는데, 저는 둘 다 맞다고 봅니다. 이분은 재주로 먹고살면서 그 재주 때문에 자리를 잃어 보신 분입니다.\n'
    + '⑧ 〔좌장〕 보석 辛입니다. 깔끔하고 예리하고 자기 관리가 철저합니다. 대충을 못 견디시고, 말수는 적은데 한 번 나오면 정확해서 가끔 칼이 됩니다.\n'
    + '⑨ 〔좌장〕 재성인 목이 원국에 하나도 없습니다. 무재라 부르는 자리인데, 못 버는 자리가 아니라 운이 데려다주는 자리입니다. 버는 길은 상관생재 — 기술과 실력이 그대로 돈이 되는 길입니다.\n'
    + '⑩ 〔좌장〕 2022년부터 2025년까지가 벌이의 띠였습니다. 이 사이 수입이 눈에 띄게 늘었다면, 이 잣대가 맞게 가고 있는 것입니다.\n'
    + '[사랑을 두고]\n'
    + '⑪ 〔좌장〕 당신은 음(陰)의 기운을 타고난 남성입니다. 인연의 글자와 당신의 글자가 손을 맞잡는 합이 아닙니다. 온 인연이 오래 머물지 않던 데엔 이런 자리의 이유가 있었습니다.\n'
    + '⑫ 〔좌장〕 그런데 방은 좋습니다. 배우자 방인 亥에서 甲이 장생을 얻습니다 — 사람을 살려 내보내는 방입니다. 방은 준비되어 있는데 문이 막힌 집, 이 자리의 사랑을 한 줄로 하면 그렇습니다.\n'
    + '⑬ 〔궁통보감〕 잠깐 보태겠습니다. 하늘에 없다고 아까 말씀드린 甲이 바로 그 글자입니다. 이분에게 甲은 보조 용신이자 배우자 방을 살리는 글자입니다 — 없는 것이 하나인데 걸린 것이 둘입니다.\n'
    + '⑭ 〔좌장〕 방에 앉은 壬이 하늘에도 떠 있어 회전문이 됩니다. 丁의 사람은 들어왔다 나가기를 되풀이합니다. 이 회전문을 타지 않는 유일한 글자가 乙입니다 — 부드럽고 사교적이며 어디서든 타고 오르는 생활력의 사람이, 이 방을 끝내 지킵니다.\n'
    + '⑮ 〔좌장〕 2015년, 온전한 통로인 乙이 하늘에 온 해입니다. 인연의 축이 크게 돌았기 쉽습니다. 무엇이 잡혔고 무엇을 놓으셨는지는 당신이 아시겠지요.\n'
    + '[정리합니다]\n'
    + '⑯ 〔좌장〕 정공법은 乙의 사람입니다. 그리고 크게는 甲寅 대운, 2034년부터입니다 — 없던 재성이 뿌리째 들어오고, 궁통보감께서 없다 하신 甲이 그때 옵니다. 결혼이 늦느냐 물으신다면, 늦는 것이 아니라 본론이 그쪽에 놓여 있다고 답하겠습니다.';
  async function ganmyeong(facts, cachePk) {
    const sys = '너는 「책사단」의 기록자다. 한 사람이 봐 드리는 것이 아니라, 책사 넷이 이분의 사주를 앞에 놓고 둘러앉아 의논한다. 너는 그 의논을 그대로 받아 적는다.\n'
      + '[책사단]\n'
      + '〔자평진전〕 격과 성패를 보는 원칙주의자. 격이 섰는가 무너졌는가, 무엇이 받치고(상신) 무엇이 걸리는가. 단호하고 말이 짧다. 재료의 「자평진전」 꾸러미에서만 말한다.\n'
      + '〔궁통보감〕 계절과 온도를 보는 사람. 격보다 먼저 이 사람이 추운지 더운지, 살자면 어느 글자가 있어야 하는지를 본다. 몸의 말을 쓴다. 재료의 「궁통보감」 꾸러미에서만 말한다.\n'
      + '〔협기〕 청 황실의 살(殺) 검증관. 겁주는 신살을 물리치는 것이 소임이고, 「그래서 언제인가」(달·날·시각)는 자기 몫이라 예고한다. 원국을 두고는 한 번만 말한다.\n'
      + '〔좌장〕 이 집의 잣대(아래 법전)를 든 사람. 성격·재물·사랑·지나온 해를 짚고, 갈린 말을 받아 정리한다. 발언의 절반 이상은 좌장이다.\n'
      + '[의논의 규칙]\n'
      + '- 각 책사는 제 꾸러미 밖의 것을 말하지 않는다. 자평진전이 조후를 논하거나 궁통보감이 격을 판정하면 안 된다.\n'
      + '- 최소 두 번은 서로 받아쳐라. 앞사람의 말을 인용해 반박하거나 보태라 — 그것이 이 의논의 값어치다.\n'
      + '- 갈리면 갈린다고 적어라. 억지로 하나로 합치지 마라. 좌장은 갈린 채로 두고 「둘 다 맞다」고 말할 수 있다.\n'
      + '- 발언마다 맨 앞에 〔이름〕을 붙여라. 이름은 자평진전·궁통보감·협기·좌장 넷뿐이다.\n'
      + '- 모든 발언은 반드시 번호로 시작한다: 「① 〔자평진전〕 …」 꼴. 번호 없는 발언은 앞사람 말에 붙어버려 채점이 엉킨다. 한 사람이 이어 말하더라도 새 번호를 단다.\n'
      + '- 재료에 그 책사의 꾸러미가 비어 있으면 그 책사는 부르지 마라.\n'
      + '이분은 발언마다 맞아요/글쎄요/아니에요로 답하신다. 그러니 한 발언에 주장 하나다.\n'
      + '절대 규칙:\n'
      + '- [계산된 사실] 밖의 연도·글자·숫자를 만들지 마라. 사실에 있는 것에서만 말하라.\n'
      + '- 한 문항 한 주장: 문항 하나에 해 하나·주장 하나만. 묶으면 채점이 흐려진다.\n'
      + '- 사건년은 양방향으로: 「만났든 헤어졌든, 벌었든 잃었든 — 그 축이 움직였다」까지만. 방향을 단정할 수 있는 건 사실에 방향이 적힌 자리뿐이다.\n'
      + '- 충·형이라는 말을 쓰지 마라. 사실 꾸러미에 없다.\n'
      + '- 성격·직업은 글자와 십신에서 끌어내되 「~기 쉽습니다」로. 삶의 장면을 지어내지 마라.\n'
      + '- 규칙을 문장으로 되뇌지 마라: 「방향은 단정하지 않습니다」 「~까지만 말씀드립니다」 같은 메타 발언 금지. 규칙은 지키되 입 밖에 내지 않는 것이 실력이다. 양방향은 이렇게 녹여라 — 「그 해, 자리의 축이 크게 돌았습니다. 무엇이 잡혔고 무엇을 놓으셨는지는 당신이 아시겠지요.」\n'
      + '- 시간 기준: [계산된 사실]의 「오늘」이 유일한 현재다. 다른 해를 「올해」라 부르지 마라. 오늘보다 앞의 해는 전부 지나온 해로, 뒤의 해는 다가올 해로 말하라. 나이(만 몇 살)는 아예 쓰지 마라 — 해는 연도로만 짚어라(「2015년」). 운의 해를 말할 때(모든 십성 공통): 천간으로 온 글자는 마음의 사건 — 그것의 필요성을 깨닫는 해로, 지지로 온 글자는 행동의 사건 — 그것을 가지려 몸이 움직이는 해로 말하라. 결과(합격·성사·득실)는 단정하지 마라. 인성은 근거다 — 정인은 공인된 근거(학위·자격·문서), 편인은 편법과 불법의 차이를 아는 감각. \n'
      + '- 괄호 나열(입학·취업·이직·혼담 식)로 때우지 마라 — 자연스러운 문장으로 풀어라. 문장 길이에 리듬을 주어라: 짧은 단정 뒤에 긴 풀이.\n'
      + '- 말투: 넷 다 존댓말을 쓰되 결이 다르다 — 자평진전은 짧고 단호하게, 궁통보감은 몸과 계절의 말로, 협기는 무뚝뚝하고 짧게, 좌장은 따뜻하고 유려하게. 상투적 위로 금지, 보고서체·상담봇체 금지.\n'
      + '- 호칭은 「당신」. 성별·나이·직업을 단정해 부르지 마라.\n'
      + '- 겁주지 마라. 좋지 않은 자리도 그대로 재되, 무엇이 어렵고 그것이 어떤 모양으로 나타나는지까지 적어라. 「그러니 조심하십시오」 같은 협박은 금지.\n'
      + '- 아첨하지 마라. 잰 것을 좋게 바꿔 적는 것이 이 집에서 가장 큰 잘못이다. 냉정한 것은 계산이고 따뜻한 것은 말투다 — 말투를 따뜻하게 하되 판정을 따뜻하게 만들지 마라.\n'
      + '- 머리글은 두 줄이다: 사주 여덟 글자와 그 자리의 그림 한 줄, 그리고 「세 사람을 부르겠습니다」류의 한 줄. 그 뒤로 바로 발언이 시작된다. 인사·서론 금지.\n'
      + '- 지정 용어만 써라(새 말 만들지 마라): 하늘(천간)·땅(지지)·방(일지/배우자궁)·글자·일간(나의 글자)·대운(10년의 무대)·세운(그 해). 첫 등장에만 괄호 원어. 「음간·양간」 대신 「음(陰)/양(陽)의 기운을 타고난」, 「접착」 대신 「손을 맞잡다·제 손으로 붙들다」. 「하늘줄」 같은 즉석 조어 금지. 「의식」 「무의식」 「에너지」 같은 심리·기공 어휘 금지 — 심리적 함의는 풀이 문장으로만: 「하늘에 뜬 글자는 겉으로 드러나 남들 눈에도 보입니다」처럼.\n'
      + '- 읽는 사람은 명리를 모른다. 용어는 처음 한 번 괄호로 풀어라. 따뜻하고 단단한 존댓말. 겁주지 않는다.\n'
      + '마크다운 금지: 별표(**)·샵(#)·대시 구분선·글머리표를 절대 쓰지 마라. 순수 문장과 ① 번호, [대괄호 절 제목]만.\n'
      + '형식: 장면 제목은 [먼저 뼈대를 두고] [좌장이 받습니다] [사랑을 두고] [정리합니다] 순서로, 대괄호째 제 줄에 놓아라(필요하면 비슷한 결로 바꿔도 된다). 발언은 ①②③…로 전체 14~18개. 각 2~4문장.\n'
      + '맺음: 좌장이 의논을 닫는 한 단락(번호 없이). 「저희가 바르게 읽었는지는 당신이 아십니다. 발언마다 답을 남겨 주시면 누가 맞고 누가 빗나갔는지 그대로 남기겠습니다.」의 뜻으로.\n'
      + 간명법전 + '\n\n'
      + 간명본보기 + '\n\n'
      + '위 본보기의 밀도·리듬·목소리와 「받아치는 방식」을 그대로 가져오되, 내용은 오직 아래 [계산된 사실]에서만 가져와라. 본보기의 글자·연도를 베끼면 안 된다.\n'
      + '[계산된 사실]\n' + JSON.stringify(facts);
    // effort 가 굽는 시간을 정한다. medium 으로 내렸더니 「얇다」는 판정을 받아 high 로 되돌렸다
    // (2026-08-30). max_tokens 는 천장일 뿐 목표가 아니라서, 낮추면 시간이 주는 게 아니라
    // 글이 잘린다(사고 토큰도 이 천장을 함께 쓴다) — 7000 을 넉넉히 남긴다.
    // 시간 방어는 프록시의 BAKE_LIMIT_MS(110초)가 한다. 벽에 걸려도 자물쇠를 풀고 깨끗이 실패한다.
    // dehanja 금지 — 간명서는 글자가 주인공이라 辛(신)·子(자)를 살려야 한다.
    // dehanja를 태우면 辛(신)→신(신)이 된다 (2026-08-30 실물 제보).
    return await call(sys, [{ role: 'user', content: '간명서를 처음부터 끝까지 써줘.' }],
      { task: 'story', maxTokens: 7000, effort: 'high', strict: true, cachePk });
  }

  async function dailyBrief(r, today) {
    const ck = `chaeksa.brief.${today.toDateString()}.${r.input.year}${r.input.month}${r.input.day}${r.input.hour}`;
    const cached = localStorage.getItem(ck);
    if (cached) return cached;
    await buildProfile(r, today);
    const df = global.ChaeksaTongbyeon ? global.ChaeksaTongbyeon.dayFrame(r, today) : null;
    const sys = systemPrompt(r, today) + (df ? `

## 오늘의 뼈대 (통변엔진이 확정한 값 — 이 안에서만 쓴다)
${dayFrameText(df)}

지켜야 할 것
- 위 [오늘의 결]·[주의]·[권할 행동]의 방향을 벗어나지 않는다. 표현은 자유롭게 다듬되 판단을 바꾸지 않는다.
- 십신 이름은 위에 적힌 것만 쓴다. 새로 계산하지 않는다.
- 시간대를 말할 때는 반드시 [오늘 12시진]에 적힌 시각만 쓴다. 시각을 새로 지어내지 않는다.
- 브리핑 안에 구체적인 시각을 최소 한 번은 넣는다. [오늘의 정점]이 있으면 그 시각을 우선 쓴다.
- [6차원 적층 체용 좌표]가 있으면 그 판정을 따른다. 특히 부호가 뒤집히는 층이 있으면 그것을 오늘 이야기의 축으로 삼는다.` : '');
    const raw = await call(sys, [{ role: 'user', content: '오늘 브리핑. 본보기와 같은 길이(250자 이내)·말투. 한자는 첫 문장 괄호 한 곳만. 마지막 줄은 "오늘 할 행동 하나:"로 시작.' }], { task: 'brief', maxTokens: 600 });
    const text = dehanja(raw);
    localStorage.setItem(ck, text);
    return text;
  }

  // 대화
  async function chat(r, today, history, question) {
    await buildProfile(r, today);
    const df = global.ChaeksaTongbyeon ? global.ChaeksaTongbyeon.dayFrame(r, today) : null;
    const sys = systemPrompt(r, today) + (df ? `

## 오늘의 뼈대 (통변엔진이 확정한 값)
${dayFrameText(df)}
오늘에 대해 말할 때는 이 값을 따른다. 간지·십신을 새로 계산하지 않는다.` : '');
    const msgs = [...history.slice(-10), { role: 'user', content: question }];
    return dehanja(await call(sys, msgs, { task: 'chat', maxTokens: 800 }));
  }

  // 심층 상담 서술 — 구조(frame)를 벗어나지 못하게 묶는다
  async function deepNarrate(r, today, fr, rev, prev, dec) {
    const top = rev.ranked[0], second = rev.ranked[1];
    const ansText = fr.questions.map(q => `- ${q.q} → ${({y:'예',n:'아니오','?':'모르겠음'})[fr.answers[q.id]] || '무응답'}`).join('\n');
    const structure = [
      `[상담 주제] ${fr.domain.label} · ${fr.target.label}`,
      fr.target.missNote ? `[알림] ${fr.target.missNote} 이 사실을 첫 문장에서 반드시 밝히고 시작한다.` : '',
      `[질문] ${fr.question}`,
      `[구조] ` + fr.layers.map(l => `${l.level} ${l.ganji}(${l.note})`).join(' / '),
      fr.chaeyong ? chaeyongText(fr.chaeyong) : '',
      `[들어오는 기운] 천간 ${fr.godStem}, 지지 ${fr.godBranch} (${fr.group}) · 일간 ${fr.strength}`,
      whenText(fr),
      fr.modifiers.length ? `[관계 보정] ` + fr.modifiers.map(m => m.text).join(' ') : '',
      `[1순위 가설 ${Math.round(top.p*100)}%] ${top.title}
  근거: ${top.basis}
  현실신호: ${top.signs.join(' / ')}`,
      `[2순위 가설 ${Math.round(second.p*100)}%] ${second.title}
  근거: ${second.basis}`,
      `[사용자 답변]
${ansText}`,
      fr.toldText ? `[사용자가 직접 쓴 상황]
${fr.toldText}` : '',
      rev.flipped ? `[판단 변경] 처음 1순위였던 "${fr.hypotheses.find(h=>h.id===rev.priorTopId).title}"에서 "${top.title}"로 순위를 바꿈` : `[판단 유지] 처음 판단과 같은 방향`,
      `[실행 과제] ${top.action}`,
      `[관측 지표] ${top.metric}`,
      prev ? `[이전 상담] ${prev.createdAt}에 "${prev.topTitle}"를 1순위로 보았음` : '',
      prev && prev.logs && prev.logs.length ? `[기록된 지표] ${prev.metric}: ` + prev.logs.map(l => `${l.date} ${l.value}`).join(' → ') : '',
      dec ? `[선택지 비교] ` + dec.options.map((o, i) => `${'ABC'[i]}. ${o.label} (${o.score}점) — 적합: ${o.when} / 위험: ${o.risk}`).join(' | ') + ` · 미확인 ${dec.unknown}개, 변동요인 ${dec.volatility}개${dec.turning ? ', ' + dec.turning : ''}` : '',
    ].filter(Boolean).join('\n');

    const sys = systemPrompt(r, today) + `

## 지금은 심층 상담 서술 모드입니다
아래 [구조]는 계산 엔진과 통변 규칙이 이미 확정한 결과입니다. 당신의 역할은 이 구조를 상담하듯 자연스럽게 풀어 쓰는 것입니다.

절대 규칙
- 주어진 가설 외에 새로운 가설을 만들지 않는다. 순위와 확률도 주어진 것을 따른다.
- 간지·십신은 [구조]에 있는 것만 쓴다. 새로 계산하거나 추측하지 않는다.
- 확정적으로 단정하지 않는다. "~할 가능성이 보입니다", "저는 ~쪽에 무게를 두겠습니다" 같은 어조.
- 사용자의 답변을 반드시 인용해 판단 근거로 삼는다.
- 판단이 바뀌었다면 왜 바뀌었는지 분명히 말한다. 바뀌지 않았다면 그대로 유지한다고 말한다.
- 마지막은 실행 과제와 관측 지표로 끝낸다.
- [선택지 비교]가 주어지면 어느 것을 먼저 검토할지 한 문단으로 말한다. 점수와 순서는 주어진 것을 따르고 임의로 바꾸지 않는다.
- [기록된 지표]가 있으면 그 숫자의 흐름을 반드시 근거로 인용한다.
- [사용자가 직접 쓴 상황]이 있으면 그 표현을 한 번은 그대로 인용한다. 사람은 자기 말이 들렸는지로 신뢰를 판단한다.
- [6차원 적층 체용 좌표]가 주어지면, 順/逆이 뒤집히는 층(변곡점)을 반드시 짚는다. 좌표의 부호와 값을 임의로 바꾸지 않는다.
- 체용은 "지금 무엇이 體이고 무엇이 用인가"를 말하는 것이다. 층 이름(원국·대운·세운·월운·일운·시운)을 그대로 쓴다.
- [골라 쓸 날]·[피할 날]이 주어지면 **반드시 구체적인 날짜를 짚는다.** 좋은 날 최소 2개, 피할 날 최소 1개를 월·일로 말한다.
- 시기와 날짜는 [기간 내 편차]·[높은 때]·[낮은 때]·[골라 쓸 날]·[피할 날]에 적힌 것만 쓴다. **날짜를 새로 지어내지 않는다.**
- [기간 기저 좌표]와 [기간 내 편차]는 다른 것이다. 편차가 높은 달은 "그 기간 안에서 상대적으로 높다"는 뜻이지 절대적으로 좋다는 뜻이 아니다. 이 구분을 흐리지 않는다.

분량과 형식
- 700~1000자. 문단 사이는 빈 줄로 구분.
- 소제목을 2~3개 쓴다. 소제목은 그 자체로 문장이 되게 쓴다.
- 목록이 필요하면 '·'로 시작하는 짧은 줄로.
- 한자는 쓰지 않는다.

${structure}`;
    const raw = await call(sys, [{ role:'user', content:'위 구조를 바탕으로 상담해 주세요. 인사 없이 바로 본론부터.' }], { task: 'consult', maxTokens: 2000, effort: 'medium' });
    return dehanja(raw);
  }

  /** 사용자가 자유롭게 쓴 상황 설명을 판별 질문의 답(예/아니오/모르겠음)으로 옮긴다.
   *  질문에 갇히지 않고 말로 설명할 수 있게 하되, 판단은 여전히 규칙이 한다. */
  async function mapAnswers(fr, text) {
    const list = fr.questions.map((q, i) => `${i + 1}. [${q.id}] ${q.q}`).join(String.fromCharCode(10));
    const sys = `당신은 사람이 자유롭게 쓴 이야기에서, 아래 질문들에 대한 답을 찾아내는 역할입니다.

질문 목록
${list}

규칙
- 글에서 그 질문의 답이 분명히 읽히면 "y"(그렇다) 또는 "n"(아니다)
- 언급이 없거나 애매하면 반드시 "?" — 추측하지 마세요. 잘못 넣는 것보다 모른다고 하는 편이 낫습니다.
- 오직 JSON만 출력합니다. 설명 금지.

출력 형식
{"질문id":"y"|"n"|"?", ...}`;
    const raw = await call(sys, [{ role: 'user', content: text }], { task: 'brief', model: 'claude-haiku-4-5', maxTokens: 300, cache: false });
    let out = {};
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      out = m ? JSON.parse(m[0]) : {};
    } catch (e) { out = {}; }
    const valid = {};
    fr.questions.forEach(q => {
      const v = out[q.id];
      valid[q.id] = (v === 'y' || v === 'n') ? v : '?';
    });
    return valid;
  }

  // 궁합 해설
  async function compatText(me, you, ruleResult, today) {
    const sys = systemPrompt(me, today) + `\n\n## 상대방의 사주\n${chartText(you, today)}\n\n## 규칙 엔진이 계산한 관계\n${JSON.stringify({ score: ruleResult.score, 일간관계: ruleResult.stemRel.key, 일지관계: ruleResult.branchRels.map(b => b.key), 상대는내게: ruleResult.god, 메모: ruleResult.notes })}`;
    return call(sys, [{ role: 'user', content: '이 두 사람의 관계를 읽어주세요. 끌리는 점, 부딪히는 점, 오래 가려면 어떻게 하면 되는지. 5문장 이내.' }], { task: 'compat', maxTokens: 700 });
  }

  global.ChaeksaAI = { dehanja, deepNarrate, storyTell, ganmyeong, mapAnswers, TIERS, modelFor, settings, saveSettings, ready, dailyBrief, chat, compatText, systemPrompt, chartText, buildProfile, getProfile, profileKey };
})(window);
