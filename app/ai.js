/* 책사 AI 비서 모듈 v1 — Claude API
 * 계산은 엔진이, 해석만 AI가. 원국·대운·오늘 일진을 시스템 프롬프트로 고정 전달.
 * 프로토타입: 브라우저에서 직접 호출(키는 사용자 기기에만 저장). 출시 시엔 proxyUrl(서버)로 전환.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, f = E.fmt;
  const KEY = 'chaeksa.ai';

  function settings() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveSettings(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  function ready() { const s = settings(); return !!(s.apiKey || s.proxyUrl); }

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
    const text = await call(sys, [{ role: 'user', content: q }], { maxTokens: 1200, effort: 'high' });
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
    const body = {
      model: s.model || 'claude-opus-5',
      max_tokens: opts.maxTokens || 1024,
      system,
      messages,
      fallbacks: 'default',
      output_config: { effort: opts.effort || 'low' },
    };
    let url, headers = { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', 'anthropic-beta': 'server-side-fallback-2026-07-01' };
    if (s.proxyUrl) { url = s.proxyUrl; }
    else { url = 'https://api.anthropic.com/v1/messages'; headers['x-api-key'] = s.apiKey; headers['anthropic-dangerous-direct-browser-access'] = 'true'; }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error?.message || msg; } catch (e) {}
      throw new Error(msg);
    }
    const j = await res.json();
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

  // 오늘 브리핑 (날짜별 캐시)
  async function dailyBrief(r, today) {
    const ck = `chaeksa.brief.${today.toDateString()}.${r.input.year}${r.input.month}${r.input.day}${r.input.hour}`;
    const cached = localStorage.getItem(ck);
    if (cached) return cached;
    await buildProfile(r, today);
    const raw = await call(systemPrompt(r, today), [{ role: 'user', content: '오늘 브리핑. 본보기와 같은 길이(250자 이내)·말투. 한자는 첫 문장 괄호 한 곳만. 마지막 줄은 "오늘 할 행동 하나:"로 시작.' }], { maxTokens: 600 });
    const text = dehanja(raw);
    localStorage.setItem(ck, text);
    return text;
  }

  // 대화
  async function chat(r, today, history, question) {
    await buildProfile(r, today);
    const msgs = [...history.slice(-10), { role: 'user', content: question }];
    return dehanja(await call(systemPrompt(r, today), msgs, { maxTokens: 800 }));
  }

  // 궁합 해설
  async function compatText(me, you, ruleResult, today) {
    const sys = systemPrompt(me, today) + `\n\n## 상대방의 사주\n${chartText(you, today)}\n\n## 규칙 엔진이 계산한 관계\n${JSON.stringify({ score: ruleResult.score, 일간관계: ruleResult.stemRel.key, 일지관계: ruleResult.branchRels.map(b => b.key), 상대는내게: ruleResult.god, 메모: ruleResult.notes })}`;
    return call(sys, [{ role: 'user', content: '이 두 사람의 관계를 읽어주세요. 끌리는 점, 부딪히는 점, 오래 가려면 어떻게 하면 되는지. 5문장 이내.' }], { maxTokens: 700 });
  }

  global.ChaeksaAI = { dehanja, settings, saveSettings, ready, dailyBrief, chat, compatText, systemPrompt, chartText, buildProfile, getProfile, profileKey };
})(window);
