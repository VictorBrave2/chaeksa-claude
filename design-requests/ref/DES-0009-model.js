/* DES-0009 견본 자료 조립. 판정은 기존 결과표, 날짜는 주입받은 기존 역법에서 읽는다. */
(function (root) {
  'use strict';
  const identities = {
    정관: ['기준을 세우는 사람', '맡은 일에 기준을 세우고, 약속을 지키는 사람.', '正官格'],
    편관: ['압박을 힘으로 쓰는 사람', '무거운 요구를 받아도, 끝내 해내려는 사람.', '七殺格'],
    정재: ['차곡차곡 쌓는 사람', '작은 것을 모으고, 손에 들어온 것을 지키는 사람.', '正財格'],
    편재: ['큰 판을 펼치는 사람', '사람과 기회를 연결하고, 일을 넓혀 가는 사람.', '偏財格'],
    정인: ['배워서 깊어지는 사람', '듣고 배우며, 이해한 것을 자기 안에 쌓는 사람.', '正印格'],
    편인: ['남다른 답을 찾는 사람', '남들이 지나친 것을 붙들고, 자기만의 답을 찾는 사람.', '偏印格'],
    식신: ['만들어서 나누는 사람', '자기 손으로 무언가를 만들고, 주변과 나누는 사람.', '食神格'],
    상관: ['새로운 길을 내는 사람', '정해진 틀에 물음을 던지고, 자기 생각을 드러내는 사람.', '傷官格'],
    건록: ['제 힘으로 서는 사람', '스스로 해내며, 함께 설 자리를 만드는 사람.', '建祿格'],
    양인: ['승부 앞에 힘을 내는 사람', '겨룰 상대와 목표가 생기면, 힘을 모으는 사람.', '羊刃格']
  };
  const stemNames = { 甲: '갑목', 乙: '을목', 丙: '병화', 丁: '정화', 戊: '무토', 己: '기토', 庚: '경금', 辛: '신금', 壬: '임수', 癸: '계수' };
  const branchNames = { 子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해' };
  const CN = 'https://www.wenlinshe.com/tw/chapter/skqs_zibu/san-ming-tong-hui/juan-02.html';
  const CN6 = 'https://www.shidianguji.com/zh/book/SK1610/chapter/1kf5v7gfo2iwj';
  const KST = 9 * 60 * 60 * 1000;
  const pad = n => String(n).padStart(2, '0');
  const civil = date => {
    const d = new Date(date.getTime() + KST);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mm: d.getUTCMinutes() };
  };
  const stamp = p => Date.UTC(p.y, p.m - 1, p.d, (p.hh || 0) - 9, p.mm || 0);
  const dayText = p => `${p.y}.${pad(p.m)}.${pad(p.d)}`;
  const timeText = p => `${pad(p.hh)}:${pad(p.mm)}`;
  const ganji = (E, p) => E.STEMS[p.stem] + E.BRANCHES[p.branch];
  function make(fixture, E, now) {
    const r = fixture.result, input = fixture.input, axes = r.축들 || [];
    const type = String(axes.find(a => a.id === '격')?.값 || '').replace(/격$/, '');
    const pillars = String(r.명식 || '').split(/\s+/), ds = pillars[1]?.[0] || '';
    const original = identities[type];
    const identity = original ? { title: original[0], line: original[1], name: type + '격', hanja: original[2] }
      : { title: stemNames[ds] ? stemNames[ds] + '의 사람' : '나의 바탕을 읽는 이름', line: '태어난 날, 나를 나타내는 글자에서 시작합니다.', name: stemNames[ds] || '나의 일간', hanja: ds };
    const grounds = axes.find(a => a.id === '성패')?.근거 || [];
    if (type === '정관' && grounds.some(s => s.includes('관이 인으로 돌아'))) {
      identity.title = '배워서 길을 여는 사람';
      identity.line = '배운 것을 자기 기준으로 삼고, 맡은 일에 써내는 사람.';
      identity.basis = '정관격 · 관이 인으로 돌아 나에게 온다는 기존 판정에서 풀었습니다.';
    } else identity.basis = (identity.name || '일간') + '의 기존 풀이를 짧은 이름으로 풀었습니다.';

    const partner = ds === '丁' ? '壬' : ds === '壬' ? '丁' : '';
    const pairAt = partner ? pillars.filter((p, i) => i !== 1 && p[0] === partner) : [];
    const wood = pairAt.length > 0 && pillars.includes('甲辰');
    const need = r.조후상태?.필요 || (axes.find(a => a.id === '조후')?.고전이름 || '').match(/먼저 쓰는 글자\s*([甲乙丙丁戊己庚辛壬癸])/)?.[1];
    const wanted = wood ? ['亥', '卯', '未', '寅'] : [];
    const hasNeed = need ? pillars.some((p, i) => i !== 1 && p[0] === need) : false;
    const lens = wood ? {
      id: 'ding-ren-wood', title: '정화견진', hanja: '正化 見辰', tag: '운에서 이어질 가능성',
      line: fixture.observation ? '배운 것과 경험이 연결되고, 생각을 내 말로 풀어냅니다.' : '목의 기운이 더해지는 흐름을 읽습니다.',
      observation: fixture.observation || '',
      experience: fixture.observation ? {
        title: '생각이 이어지고,', emphasis: '표현이 분명해집니다.',
        thought: '복잡하던 생각이 정리되고, 문제의 핵심이 잡힙니다.',
        action: '이해한 내용을 말이나 글로 꺼내기 수월해집니다.',
        summary: '생각을 정리하고, 내 말로 풀어내는 흐름입니다.',
        basis: '생각의 연결은 사용자가 말한 「머리가 잘 돌아간다」라는 관찰에서, 자기 말로 정리한다는 행동은 기존 이름 풀이에서 확장한 원고 초안입니다. 고전의 직역이나 검증된 행동 예측은 아닙니다.'
      } : null,
      have: '丁과 壬, 그리고 甲辰', need: '亥 · 卯 · 未 · 寅',
      shortNeed: fixture.observation ? '생각의 정리와 표현' : '목을 돕는 글자',
      event: fixture.observation ? '생각을 정리하고, 내 말로 풀어내는 흐름입니다.' : '목을 돕는 조건이 더해집니다.',
      explanation: '태어날 때 갖추지 못한 조건도, 운에서 무엇이 더해지는지 이어서 읽습니다.',
      checks: [
        { title: '서로 만나는 두 글자', value: '丁 · 壬', state: true, detail: '일간과 합짝 글자가 함께 있습니다.' },
        { title: '원문이 반긴 글자', value: '甲辰', state: true, detail: '태어난 명식에 있습니다. 원문 권2가 반긴 甲辰시와는 자리를 구분합니다.' },
        { title: '원문이 든 달의 조건', value: '亥 · 卯 · 未 · 寅', state: wanted.includes(pillars[2]?.[1]), detail: '태어난 달은 ' + (pillars[2] || '미확인') + '입니다. 운의 도래가 출생 월을 바꾸지는 않습니다.' }
      ],
      source: '삼명통회 · 논십간화기 / 합화성국', url: CN,
      quote: '丁壬化木，非亥卯未月不化，其次正月亦化。',
      limits: '달의 조건을 운에 대어 보는 것은 이번 견본의 해석입니다. 한 조건의 도래를 합화 완성이나 능력 향상의 확정으로 판정하지 않습니다. 生旺·시의 조건·방해 요소는 별도로 살펴야 합니다.',
      source2: CN6, note: '‘정화견진’은 기존 목록의 대목 표제입니다. 원문이 독립된 격명으로 명명했다는 뜻은 아닙니다.'
    } : need ? {
      id: 'season-stem', title: '내 기운을 돕는 글자', hanja: need, tag: hasNeed ? '타고난 힘을 보태는 글자' : '운에서 더해지는 조건',
      line: '운에서 ' + stemNames[need] + ' 글자가 더해지는 해·달·날·시간을 찾습니다.', have: hasNeed ? '명식에 있는 글자: ' + need : '타고난 ' + identity.name,
      need, shortNeed: stemNames[need], event: '운의 천간에 ' + need + ' 글자가 들어옵니다.',
      explanation: '태어난 달과 일간에 필요한 글자를, 다가오는 운에서 찾아봅니다.',
      checks: [
        { title: '계절에 먼저 쓰는 글자', value: need, state: hasNeed, detail: hasNeed ? '명식의 천간에 이미 있습니다.' : '명식의 천간에는 없습니다.' },
        { title: '운에서 확인할 글자', value: need, state: null, detail: '운의 천간에서 같은 글자가 오는지 살펴봅니다.' }
      ],
      source: '궁통보감 · 기존 결과표의 조후 필요 글자', quote: '',
      limits: '필요 글자의 일치를 표시합니다. 합거·충극·다른 운의 작용을 합산한 종합 길흉은 아닙니다.', note: ''
    } : {
      id: 'unavailable', title: '시간이 더하는 이름', hanja: '', tag: '나의 큰 흐름',
      line: '타고난 바탕 위에 어떤 흐름이 더해지는지 봅니다.', have: identity.name, need: '', shortNeed: '큰 흐름', checks: [],
      explanation: '지금 계산할 수 있는 대운의 흐름을 이어서 봅니다.', source: '', quote: '', limits: '', note: ''
    };
    // 이 함수는 시간 글자의 일치만 확인한다. 원국 합화·성패를 다시 판정하지 않는다.
    const match = p => wood ? wanted.includes(E.BRANCHES[p.branch]) : Boolean(need && E.STEMS[p.stem] === need);
    const matchText = p => wood ? E.BRANCHES[p.branch] + '(' + branchNames[E.BRANCHES[p.branch]] + ')' : E.STEMS[p.stem] + '(' + stemNames[E.STEMS[p.stem]] + ')';
    const on = civil(now), atNoon = p => E.dateFortune(p.y, p.m, p.d);
    const calcAt = (p, usePlace = false) => E.calc({ year: p.y, month: p.m, day: p.d, hour: p.hh ?? 12, minute: p.mm || 0, gender: input.gender, longitude: usePlace ? fixture.longitude : 135, tzOffset: 9, solarCorrection: usePlace ? input.solarCorrection !== false : false });
    const years = [], months = [], days = [], hours = [];
    const terms = [];
    if (wood || need) {
      for (let y = on.y - 1; y <= on.y + 14; y++) {
        const ts = E.fmt.termsOfYear(y);
        if (y <= on.y + 2) ts.forEach(t => terms.push({ ...t, at: stamp(t) }));
        const p = atNoon({ y, m: 7, d: 1 }).year, end = E.fmt.termsOfYear(y + 1)[0];
        if (match(p) && stamp(end) > now.getTime()) years.push({ title: y + '년', ganji: ganji(E, p), matched: matchText(p), start: dayText(ts[0]), end: dayText(end), boundary: '입춘부터 다음 입춘 전까지', line: lens.event });
      }
      terms.sort((a, b) => a.at - b.at);
      for (let i = 0; i < terms.length - 1; i++) {
        const t = terms[i], end = terms[i + 1];
        if (end.at <= now.getTime() || months.length >= 4) continue;
        const p = calcAt(civil(new Date(t.at + Math.min(60 * 60 * 1000, (end.at - t.at) / 2)))).pillars.month;
        if (match(p)) months.push({ title: t.m + '월 ' + t.d + '일부터', ganji: ganji(E, p), matched: matchText(p), start: dayText(t) + ' ' + timeText(t), end: dayText(end) + ' ' + timeText(end), boundary: t.name + ' → ' + end.name, line: lens.event, current: t.at <= now.getTime() });
      }
      for (let i = 0; i < 90 && days.length < 6; i++) {
        const d = civil(new Date(stamp({ ...on, hh: 12, mm: 0 }) + i * 86400000)), p = atNoon(d).day;
        if (match(p)) days.push({ title: d.m + '월 ' + d.d + '일', ganji: ganji(E, p), matched: matchText(p), start: dayText(d), end: '', boundary: '표시일 정오의 일주 기준', line: lens.event });
      }
      // 시계 구간도 실제 역법의 시주를 찾아서 만든다. 경도·균시차는 기존 calc 설정 그대로.
      if (Number.isFinite(fixture.longitude)) {
        for (let day = 0; day < 3 && hours.length < 4; day++) {
          const d = civil(new Date(stamp({ ...on, hh: 0, mm: 0 }) + day * 86400000));
          const pAt = minute => calcAt({ ...d, hh: Math.floor(minute / 60), mm: minute % 60 }, true).pillars.hour;
          const same = (a, b) => a.stem === b.stem && a.branch === b.branch;
          let begin = 0, p = pAt(0);
          const finish = end => {
            if (match(p) && stamp({ ...d, hh: Math.floor(end / 60), mm: end % 60 }) > now.getTime() && hours.length < 4) {
              const t = { ...d, hh: Math.floor(begin / 60), mm: begin % 60 }, e = { ...d, hh: Math.floor(end / 60), mm: end % 60 };
              hours.push({ title: d.m + '월 ' + d.d + '일 ' + timeText(t), ganji: ganji(E, p), matched: matchText(p), start: dayText(d) + ' ' + timeText(t), end: dayText(civil(new Date(stamp(e)))) + ' ' + timeText(civil(new Date(stamp(e)))), boundary: (input.place || 'KR:서울').split(':').slice(1).join(':') + ' 시계 · 출생 정보와 같은 시각 보정', line: lens.event });
            }
          };
          for (let minute = 30; minute <= 1440; minute += 30) {
            const last = Math.min(minute, 1439), q = pAt(last);
            if (!same(p, q)) {
              let lo = begin, hi = last;
              while (lo + 1 < hi) { const mid = Math.floor((lo + hi) / 2); if (same(pAt(mid), p)) lo = mid; else hi = mid; }
              finish(hi); begin = hi; p = pAt(hi);
            }
            if (minute === 1440) finish(1440);
          }
        }
      }
    }
    const periods = (r.기간들 || fixture.periods || []).filter(p => p.ageStart < 80);
    const current = periods.findIndex(p => p.start <= on.y && p.end >= on.y);
    const large = periods.map(p => ({ ...p, current: p.start <= on.y && p.end >= on.y, title: p.start + '–' + p.end,
      line: identities[p.type]?.[1] || '이 시기의 이름은 아직 정하지 못했습니다.',
      name: identities[p.type]?.[0] || p.type || '판정 자료 없음' }));
    return { identity, lens, years: years.slice(0, 4), months, days, hours, periods: large,
      currentPeriod: current, axes, original: r, input, dayStem: ds, asof: dayText(on), wood,
      dateNote: '해는 입춘, 달은 절기, 날은 표시일 정오, 시는 표시 지역의 시계를 기준으로 찾았습니다. 원국과 대운·세운·월운·일운을 모두 합친 성립 판정은 아닙니다.' };
  }
  root.ChaeksaNameSeasonModel = { make };
})(typeof window !== 'undefined' ? window : globalThis);
