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
      `[일간] ${f.stem(a.dayStem)} ${a.dayElem} (${a.dayYang ? '양' : '음'}) · ${a.strength} · 오행 목${a.elemCount[0]} 화${a.elemCount[1]} 토${a.elemCount[2]} 금${a.elemCount[3]} 수${a.elemCount[4]} · 없는 오행: ${a.missing.join(',') || '없음'} · 용신 후보: ${a.yongCandidates.join(',')}`,
      `[지장간] 연 ${a.gods.year.hidden.map(h => f.stem(h.stem) + h.god).join(' ')} / 월 ${a.gods.month.hidden.map(h => f.stem(h.stem) + h.god).join(' ')} / 일 ${a.gods.day.hidden.map(h => f.stem(h.stem) + h.god).join(' ')}${a.gods.hour ? ' / 시 ' + a.gods.hour.hidden.map(h => f.stem(h.stem) + h.god).join(' ') : ''}`,
      `[대운] ${r.daeun.forward ? '순행' : '역행'} ${r.daeun.startAge}세 시작 · ` + r.daeun.list.map(d => `${d.startAge}세 ${f.pillar(d)}`).join(', '),
      `[현재] ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} · 대운 ${du ? f.pillar(du) + '(' + E.TEN_GODS[E.tenGod(a.dayStem, du.stem)] + ')' : '미정'} · 세운 ${f.pillar(tf.year)}(${E.TEN_GODS[E.tenGod(a.dayStem, tf.year.stem)]}) · 월운 ${f.pillar(tf.month)}(${E.TEN_GODS[E.tenGod(a.dayStem, tf.month.stem)]}) · 일운 ${f.pillar(tf.day)}(${E.TEN_GODS[E.tenGod(a.dayStem, tf.day.stem)]})`,
      `[출생] ${r.input.year}-${r.input.month}-${r.input.day} ${r.input.hour != null ? r.input.hour + ':' + String(r.input.minute || 0).padStart(2, '0') : '시간 모름'} ${r.input.gender === 'M' ? '남' : '여'} · 진태양시 보정 ${r.input.solarCorrection === false ? '안 함' : '함'}`,
    ];
    return lines.join('\n');
  }

  function systemPrompt(r, today) {
    return `당신은 "책사", 한 사람만을 위한 개인 명리비서입니다. 아래 사람의 사주 원국을 완전히 알고 있고, 매일 옆에서 오늘을 읽어주는 또래 친구 같은 조언자입니다.

## 원칙
- 겁주지 않는다. "삼재", "대흉", "조심하세요" 식의 불안 조장 금지. 안 좋은 흐름도 "그래서 이렇게 하면 된다"는 대처와 함께.
- 행동으로 끝낸다. 모든 답은 구체적인 행동 한 가지로 마무리.
- 짧다. 브리핑은 3~4문장, 질문 답변은 5문장 이내. 보고서가 아니라 대화.
- 솔직하다. 좋은 것만 말하지 않는다. 다만 표현은 따뜻하게.
- 계산은 하지 않는다. 아래 [원국]·[현재] 데이터가 정답이며 절대 다시 계산하거나 다른 간지를 말하지 않는다.
- 명리 용어는 쓰되 바로 풀어 말한다. 예: "정관(나를 바로 세우는 기운)".
- 의료·투자·법률 판단은 하지 않는다. 물으면 흐름만 읽어주고 전문가에게 맡기라고 한 문장으로.
- 결정은 사용자가 한다. "이렇게 하세요"가 아니라 "이 흐름이라면 이런 선택이 편하다" 톤.
- 반말이 아닌 부드러운 존댓말. 이모지는 쓰지 않는다.

## 이 사람의 사주 (계산 완료, 확정값)
${chartText(r, today)}`;
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

  // 오늘 브리핑 (날짜별 캐시)
  async function dailyBrief(r, today) {
    const ck = `chaeksa.brief.${today.toDateString()}.${r.input.year}${r.input.month}${r.input.day}${r.input.hour}`;
    const cached = localStorage.getItem(ck);
    if (cached) return cached;
    const text = await call(systemPrompt(r, today), [{ role: 'user', content: '오늘 브리핑을 해주세요. 오늘 일운이 내 원국과 어떻게 만나는지, 좋은 시간대나 주의할 점, 그리고 오늘 할 행동 하나. 3~4문장. 첫 문장은 인사 없이 바로 본론.' }], { maxTokens: 600 });
    localStorage.setItem(ck, text);
    return text;
  }

  // 대화
  async function chat(r, today, history, question) {
    const msgs = [...history.slice(-10), { role: 'user', content: question }];
    return call(systemPrompt(r, today), msgs, { maxTokens: 800 });
  }

  // 궁합 해설
  async function compatText(me, you, ruleResult, today) {
    const sys = systemPrompt(me, today) + `\n\n## 상대방의 사주\n${chartText(you, today)}\n\n## 규칙 엔진이 계산한 관계\n${JSON.stringify({ score: ruleResult.score, 일간관계: ruleResult.stemRel.key, 일지관계: ruleResult.branchRels.map(b => b.key), 상대는내게: ruleResult.god, 메모: ruleResult.notes })}`;
    return call(sys, [{ role: 'user', content: '이 두 사람의 관계를 읽어주세요. 끌리는 점, 부딪히는 점, 오래 가려면 어떻게 하면 되는지. 5문장 이내.' }], { maxTokens: 700 });
  }

  global.ChaeksaAI = { settings, saveSettings, ready, dailyBrief, chat, compatText, systemPrompt, chartText };
})(window);
