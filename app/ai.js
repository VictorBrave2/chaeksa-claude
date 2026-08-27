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
    quality: { brief: 'claude-opus-5',   chat: 'claude-opus-5',   consult: 'claude-opus-5',   profile: 'claude-opus-5', compat: 'claude-opus-5' },
    balanced:{ brief: 'claude-haiku-4-5', chat: 'claude-sonnet-5', consult: 'claude-sonnet-5', profile: 'claude-opus-5', compat: 'claude-sonnet-5' },
    thrifty: { brief: 'claude-haiku-4-5', chat: 'claude-haiku-4-5', consult: 'claude-sonnet-5', profile: 'claude-sonnet-5', compat: 'claude-haiku-4-5' },
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

  global.ChaeksaAI = { dehanja, deepNarrate, mapAnswers, TIERS, modelFor, settings, saveSettings, ready, dailyBrief, chat, compatText, systemPrompt, chartText, buildProfile, getProfile, profileKey };
})(window);
