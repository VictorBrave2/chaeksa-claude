/* 책사 비망록 — 비서가 들고 다니는 수첩
 *
 * 카드는 사람을 데려오고, 이 수첩은 사람을 남긴다.
 * 점집과 비서의 차이는 기억이다. 지난달에 "9월이 좋다"고 해놓고 9월에 아무 말도
 * 안 하면 그건 비서가 아니다.
 *
 * 기록은 두 종류다. 이 구분이 핵심이다.
 *  · 한 번의 결정(event) — 이직·계약처럼 날을 잡는 일. 시기 판단이 답이다.
 *  · 계속되는 일(track)  — 허리·매출·아이 성적처럼 몇 달을 씨름하는 일.
 *    한 번 적고 끝나는 게 아니라 달마다 어땠는지 쌓아 **패턴**을 찾는다.
 *    "당신은 관성 달에 유독 힘들었다"는 남의 통설이 아니라 본인 기록에서 나온다.
 *    비서의 값어치는 여기서 나온다 — 이벤트는 한 줄 남고 끝나지만 이건 쌓인다.
 *
 * 하는 일 셋:
 *  ① 물어본 것과 **그때의 판단을 박제**한다 — 나중에 엔진을 고쳐도 그때 말은 그대로 남는다
 *  ② 그 달이 오면 먼저 꺼내 보여준다 (홈·오늘 탭에서 알린다)
 *  ③ 지나면 실제로 어땠는지 받아 적고, 엔진이 맞았는지 본인 눈으로 쌓이게 한다
 *
 * 전부 기기 안에 저장한다. AI를 쓰지 않으므로 원가가 없고, 시간이 갈수록 값이 커진다.
 */
(function (global) {
  'use strict';

  const KEY = 'chaeksa.memo';
  const OUTCOMES = {
    good: { label: '좋았다', mark: '○', col: 'var(--g5-ink, #2f6b4f)' },
    soso: { label: '그저 그랬다', mark: '△', col: 'var(--ink2)' },
    bad: { label: '아니었다', mark: '✕', col: 'var(--g0-ink, #b23a2a)' },
  };

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const save = (arr) => { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {} };
  const ym = (y, m) => y * 100 + m;
  const nowYm = (d) => ym(d.getFullYear(), d.getMonth() + 1);

  /** 기록 당시의 판단을 계산한다. 세운도와 같은 잣대를 쓴다 —
   *  두 화면이 같은 달을 두고 다른 말을 하면 그게 결함이다. */
  function judge(R, y, m) {
    const T = global.ChaeksaTypecard;
    if (!T || !T.yearFlow) return null;
    const yf = T.yearFlow(R, y, new Date(y, m - 1, 15));
    const mon = yf.months[m - 1];
    if (!mon) return null;
    // 등급 문턱은 typecard 한 곳에서만 정한다 — 여기서 따로 나누다 「만개」가 죽었다.
    const G = T.SEASON_GRADE || [];
    const g = (T.등급100 ? T.등급100(mon.v) : null) || G[G.length - 1] || { name: '보합', line: '' };
    return {
      score: mon.v,
      grade: g.name,
      line: g.line,
      pillar: global.ChaeksaEngine.fmt.pillar(mon.pl),
      yearPillar: global.ChaeksaEngine.fmt.pillar(yf.yearPillar),
      at: new Date().toISOString().slice(0, 10),
    };
  }

  /** 한 번의 결정만 — 계속되는 일은 tracks()로 따로 본다 */
  function list(personId) {
    return load().filter(x => x.personId === personId && x.kind !== 'track')
      .sort((a, b) => a.ym - b.ym);
  }

  function newId() {
    return 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }

  /** 한 번의 결정 — 날을 잡는 일 */
  function add(personId, q, y, m, R) {
    const arr = load();
    const item = {
      id: newId(), kind: 'event',
      personId, q: String(q).slice(0, 60), ym: ym(y, m),
      verdict: judge(R, y, m), outcome: null,
      createdAt: new Date().toISOString(),
    };
    arr.push(item);
    save(arr);
    return item;
  }

  /** 계속되는 일 — 주제만 등록하고 달마다 기록을 쌓는다 */
  function track(personId, q) {
    const arr = load();
    const item = {
      id: newId(), kind: 'track',
      personId, q: String(q).slice(0, 60), logs: [],
      createdAt: new Date().toISOString(),
    };
    arr.push(item);
    save(arr);
    return item;
  }

  /** 그 달의 기록을 남긴다(같은 달이면 덮어쓴다) */
  function log(id, y, m, result, note, R) {
    const arr = load(), it = arr.find(x => x.id === id);
    if (!it || it.kind !== 'track') return null;
    const key = ym(y, m);
    it.logs = (it.logs || []).filter(l => l.ym !== key);
    it.logs.push({ ym: key, result, note: String(note || '').slice(0, 120),
                   verdict: judge(R, y, m), say: respond(y, m, result, R),
                   at: new Date().toISOString().slice(0, 10) });
    it.logs.sort((a, b) => a.ym - b.ym);
    save(arr);
    return it;
  }

  const tracks = (personId) => load().filter(x => x.personId === personId && x.kind === 'track');
  const loggedThisMonth = (it, today) => {
    const cur = nowYm(today || new Date());
    return (it.logs || []).some(l => l.ym === cur);
  };

  function setOutcome(id, result, note) {
    const arr = load(), it = arr.find(x => x.id === id);
    if (!it) return null;
    it.outcome = OUTCOMES[result]
      ? { result, note: String(note || '').slice(0, 120), at: new Date().toISOString().slice(0, 10) }
      : null;
    save(arr);
    return it;
  }

  function remove(id) { save(load().filter(x => x.id !== id)); }

  /** 지금이 그 달이거나 이미 지났는데 결과가 안 적힌 것 — 비서가 먼저 말을 걸 자리 */
  function due(personId, today) {
    const cur = nowYm(today || new Date());
    return list(personId).filter(x => x.ym <= cur && !x.outcome);
  }

  /** 아직 오지 않은 것 */
  function upcoming(personId, today) {
    const cur = nowYm(today || new Date());
    return list(personId).filter(x => x.ym > cur);
  }

  /** 엔진이 맞았는가 — 본인 데이터로만 센다.
   *  '좋다'고 한 것(만개·순풍)과 '아니다'라고 한 것(월동·담금질)을 나눠 결과를 본다. */
  function stats(personId) {
    const done = list(personId).filter(x => x.outcome && x.verdict);
    const good = done.filter(x => x.verdict.score >= 65);
    const bad = done.filter(x => x.verdict.score < 40);
    const hit = (arr, want) => arr.filter(x => x.outcome.result === want).length;
    return {
      total: done.length,
      좋다한것: { n: good.length, 맞음: hit(good, 'good') },
      아니라한것: { n: bad.length, 맞음: hit(bad, 'bad') + hit(bad, 'soso') },
    };
  }

  /** 쌓인 기록에서 무엇을 말할 수 있는가. 남의 통설이 아니라 본인 데이터다.
   *
   *  축 둘을 쓰고, 말할 수 있게 되는 시점이 다르다.
   *   ① 엔진 축 — 엔진이 좋다고 한 달에 실제로 괜찮았는가. 넉 달이면 말이 된다.
   *      이게 주축이다. 사용자가 궁금한 건 '이 앱이 맞나'이고, 그 답이 여기 있다.
   *   ② 십신 축 — '관성 달에 힘들다' 같은 결. 월간은 10개월 주기라 한 축이
   *      두 번 오려면 1년 가까이 걸린다. 그전에 말하면 지어내는 것이다.
   */
  const GRP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상',
                편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
  function pattern(it, R) {
    const E = global.ChaeksaEngine;
    const logs = (it.logs || []).filter(l => l.result);
    if (!E || logs.length < 4) return { n: logs.length, need: 4 - logs.length, engine: null, god: null };

    // ① 엔진 축
    const 좋다 = logs.filter(l => l.verdict && l.verdict.score >= 65);
    const 아니다 = logs.filter(l => l.verdict && l.verdict.score < 40);
    const cnt = (arr, r) => arr.filter(l => l.result === r).length;
    const engine = [];
    if (좋다.length >= 2) engine.push({ side: '좋다', n: 좋다.length, hit: cnt(좋다, 'good') });
    if (아니다.length >= 2) engine.push({ side: '아니다', n: 아니다.length, hit: cnt(아니다, 'bad') + cnt(아니다, 'soso') });

    // ② 십신 축
    const by = {};
    logs.forEach(l => {
      const y = Math.floor(l.ym / 100), m = l.ym % 100;
      const g = GRP[E.TEN_GODS[E.tenGod(R.analysis.dayStem, E.dateFortune(y, m, 20).month.stem)]];
      by[g] = by[g] || { n: 0, bad: 0, good: 0 };
      by[g].n++;
      if (l.result === 'bad') by[g].bad++;
      if (l.result === 'good') by[g].good++;
    });
    let worst = null, best = null;
    Object.keys(by).forEach(g => {
      const b = by[g];
      if (b.n >= 2 && b.bad >= 2 && b.bad / b.n >= 0.6) if (!worst || b.bad > by[worst].bad) worst = g;
      if (b.n >= 2 && b.good >= 2 && b.good / b.n >= 0.6) if (!best || b.good > by[best].good) best = g;
    });
    const god = (worst || best)
      ? { worst: worst ? Object.assign({ g: worst }, by[worst]) : null,
          best: best ? Object.assign({ g: best }, by[best]) : null }
      : null;
    return { n: logs.length, need: 0, engine: engine.length ? engine : null, god };
  }

  /** 기록한 그 자리에서 곧바로 드리는 말.
   *
   *  패턴은 넉 달이 있어야 하지만 **다음 달 이야기는 지금 할 수 있다** —
   *  그건 이 사람의 기록이 아니라 엔진이 이미 아는 것이기 때문이다.
   *  힘들다고 누른 사람에게 "3달 더 모으세요"라고 답하면 그건 비서가 아니다.
   *  다만 거짓 위로는 하지 않는다. 계속 눌리는 구간이면 언제 풀리는지를 찾아 준다.
   */
  function respond(y, m, result, R) {
    const cur = judge(R, y, m);
    if (!cur) return null;
    const nx = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
    const next = judge(R, nx.y, nx.m);
    // 기준은 절대 점수가 아니라 **지금보다 나은가**이다.
    // 절대선(75점)으로 잡았더니 점수대가 낮은 사주는 1년 내내 '힘을 아끼세요'만
    // 나왔다. 그건 위로가 아니라 절망이다. 사람이 알고 싶은 건 '언제 지금보다
    // 나아지나'이지 '언제 만개하나'가 아니다.
    let relief = null;
    for (let i = 1; i <= 24; i++) {
      const t = m + i, yy = y + Math.floor((t - 1) / 12), mm = ((t - 1) % 12) + 1;
      const j = judge(R, yy, mm);
      if (j && j.score >= cur.score + 15) { relief = { y: yy, m: mm, j, away: i }; break; }
    }
    const 나쁨 = (j) => j && j.score <= cur.score - 12;
    const 좋음 = (j) => j && j.score >= cur.score + 12;

    if (result === 'bad') {
      // 엔진이 좋게 봤는데 힘들었다 — 틀린 걸 인정하는 게 신뢰를 만든다.
      // 여기는 '이번 달 자체가 좋은 판정이었나'를 묻는 자리라 상대 비교가 아니라
      // 등급으로 본다. 상대식(cur >= cur+12)으로 쓰면 언제나 거짓이 된다.
      if (cur.grade === '만개' || cur.grade === '순풍') return { tone: 'miss',
        text: '제가 이번 달을 ' + cur.grade + '으로 봤는데 힘드셨군요. 제 판단이 놓친 자리가 있습니다. 이런 기록이 쌓일수록 제가 정확해집니다.' };
      if (좋음(next)) return { tone: 'up',
        text: '이번 달은 저도 눌린다고 봤습니다. 다음 ' + nx.m + '월은 ' + next.grade + '이라 숨이 트입니다. 큰 결정은 그때로 미루셔도 됩니다.' };
      if (relief) return { tone: 'wait',
        text: '이번 달도 다음 달도 쉽지 않습니다. 다만 ' + relief.m + '월부터 결이 바뀝니다('
            + relief.j.grade + '). ' + relief.away + '달 남았습니다 — 그때까지는 버티는 게 일입니다.' };
      return { tone: 'hold',
        // 「두 배로 돌아온다」는 재 본 적 없는 양이고 겁주기다. 뗐다(2026-08-30).
        text: '지금은 힘을 아끼실 때입니다. 크게 벌이기보다 '
            + '지키는 것만으로 충분하고, 이 구간이 영영 가지는 않습니다.' };
    }
    if (result === 'good') {
      if (좋음(next)) return { tone: 'keep',
        text: '다행입니다. 다음 ' + nx.m + '월도 ' + next.grade + '이라 이어집니다. 벌일 일이 있으면 지금입니다.' };
      if (나쁨(next)) return { tone: 'prep',
        text: '좋으셨다니 다행입니다. 다만 다음 ' + nx.m + '월은 결이 달라집니다(' + next.grade + '). 해둘 것이 있으면 이달 안에 마치시는 게 낫습니다.' };
      return { tone: 'keep', text: '다행입니다. 다음 ' + nx.m + '월도 이 정도는 갑니다.' };
    }
    // 그저 그렇다
    if (좋음(next)) return { tone: 'up',
      text: '다음 ' + nx.m + '월은 ' + next.grade + '입니다. 지금 고르고 계신 것이 있다면 그때 손대셔도 늦지 않습니다.' };
    if (나쁨(next)) return { tone: 'prep',
      text: '다음 ' + nx.m + '월은 조금 더 눌립니다(' + next.grade + '). 이번 달에 정리해둘 것을 정리해두시면 편합니다.' };
    return { tone: 'flat', text: '다음 ' + nx.m + '월도 비슷합니다. 페이스를 지키시는 게 답입니다.' };
  }

  /** 첫 화면 맨 위에 놓을 한 마디.
   *
   *  사주가 잘 풀리는 사람은 여기 안 온다. 세상을 즐기기 바쁘다.
   *  들어오는 사람은 뜻대로 안 흘러가서 이유를 찾으러 온 사람이다.
   *  그 사람에게 '686개 유형 중 한 장 뽑기'가 첫 마디여서는 안 된다.
   *
   *  말할 것은 셋: ①지금 어떤 구간인지 ②그게 당신 탓이 아니라는 것 ③언제 바뀌는지.
   *  좋은 구간이면 굳이 위로하지 않는다 — 그때는 밀라고 말한다.
   */
  function standing(R, today) {
    const T = global.ChaeksaTypecard, E = global.ChaeksaEngine;
    if (!T || !T.yearFlow) return null;
    const y = today.getFullYear(), m = today.getMonth() + 1;
    const cur = judge(R, y, m);
    if (!cur) return null;
    const du = E.currentDaeun(R, today);
    // 지금보다 나아지는 첫 달 (스물넉 달까지 본다)
    let turn = null;
    for (let i = 1; i <= 24; i++) {
      const t = m + i, yy = y + Math.floor((t - 1) / 12), mm = ((t - 1) % 12) + 1;
      const j = judge(R, yy, mm);
      if (j && j.score >= cur.score + 15) { turn = { y: yy, m: mm, j, away: i }; break; }
    }
    // 등급 문턱(typecard 등급100: 85/65/40/20)과 같은 축을 쓴다.
    // 예전 75/50 은 옛 v/50 눈금의 잔재라, 같은 달을 두고 등급은 「순풍」인데
    // 여기서는 「좋지 않음」으로 세는 모순이 났다(2026-08-30).
    const 눌림 = cur.score < 40;
    const 좋음 = cur.score >= 65;
    let head, body;
    if (좋음) {
      head = '지금은 밀어야 할 때입니다';
      body = '이번 달은 ' + cur.grade + '입니다. 미뤄둔 일이 있으면 지금 꺼내세요. 이런 달은 자주 오지 않습니다.';
    } else if (눌림) {
      head = '지금은 눌리는 구간입니다';
      body = '이번 달은 ' + cur.grade + '입니다. 애써도 더디게 가는 때가 있고, 지금이 그렇습니다. '
           + (turn ? turn.m + '월부터 결이 바뀝니다 — ' + turn.away + '달 남았습니다.'
                   : '이 구간이 영영 가지는 않습니다.');
    } else {
      head = '지금은 고르게 갑니다';
      body = '이번 달은 ' + cur.grade + '입니다. 크게 밀어주지도 막지도 않으니 내 페이스가 답입니다.'
           + (turn ? ' ' + turn.m + '월부터는 좀 더 열립니다.' : '');
    }
    return { head, body, grade: cur.grade, score: cur.score, 눌림, 좋음,
             pillar: cur.pillar, daeun: du ? E.fmt.pillar(du) : null, turn };
  }

  /** 적지 않은 것도 미리 짚는다.
   *
   *  비망록은 사용자가 적은 것만 챙긴다. 그건 반쪽이다. 진짜 비서라면
   *  묻지 않아도 다가오는 것을 먼저 말해야 한다 — 특히 대운 교체처럼
   *  십 년에 한 번 오면서 판을 통째로 바꾸는 자리는.
   *
   *  가까운 것부터 하나만 고른다. 여러 개를 늘어놓으면 아무것도 안 남는다.
   */
  function ahead(R, today) {
    const E = global.ChaeksaEngine, T = global.ChaeksaTypecard;
    if (!E || !T || !T.lifeCurve) return null;
    const y = today.getFullYear(), m = today.getMonth() + 1;
    const lc = T.lifeCurve(R, today);
    const list = R.daeun.list;

    // ① 대운 교체 — 십 년에 한 번. 3년 안이면 이것부터 말한다.
    if (lc.curIdx >= 0 && lc.curIdx + 1 < list.length) {
      const nx = list[lc.curIdx + 1];
      const 해 = R.solarYear + nx.startAge;
      const 남음 = 해 - y;
      if (남음 >= 0 && 남음 <= 3) {
        const 지금v = lc.list[lc.curIdx].v, 다음v = lc.list[lc.curIdx + 1].v;
        const 방향 = 다음v >= 지금v + 12 ? '열리는 쪽입니다'
                   : 다음v <= 지금v - 12 ? '조여지는 쪽입니다' : '결이 크게 달라집니다';
        return { kind: '대운',
          head: 남음 === 0 ? '올해 대운이 바뀝니다' : 해 + '년에 대운이 바뀝니다',
          text: E.fmt.pillar(nx) + ' 대운으로 넘어갑니다(' + nx.startAge + '세부터). '
              + '십 년에 한 번 판이 통째로 바뀌는 자리이고, ' + 방향 + '. '
              + (남음 === 0 ? '올해 안에 자리를 잡아두시면 편합니다.' : 남음 + '년 남았습니다.') };
      }
    }
    // ② 해가 바뀌며 크게 달라지는가
    const 올 = judge(R, y, m), 내 = judge(R, y + 1, m);
    if (올 && 내 && Math.abs(내.score - 올.score) >= 20) {
      const 오름 = 내.score > 올.score;
      return { kind: '세운',
        head: (y + 1) + '년은 올해와 결이 다릅니다',
        text: '같은 달을 놓고 보면 ' + (오름 ? '눈에 띄게 열립니다' : '지금보다 조여집니다') + '. '
            + (오름 ? '올해 벌여둔 일이 내년에 힘을 받습니다.' : '올해 안에 마무리 지을 것을 정리해 두시면 편합니다.') };
    }
    // ③ 앞으로 여섯 달 안의 고비 — 가장 낮은 달
    let low = null;
    for (let i = 1; i <= 6; i++) {
      const t = m + i, yy = y + Math.floor((t - 1) / 12), mm = ((t - 1) % 12) + 1;
      const j = judge(R, yy, mm);
      if (j && (!low || j.score < low.j.score)) low = { yy, mm, j };
    }
    if (low && 올 && low.j.score <= 올.score - 15) {
      return { kind: '월운', head: low.mm + '월이 이번 반년의 고비입니다',
        text: low.j.pillar + '월 · ' + low.j.grade + '. 큰 결정을 그 달에 몰지 않으시면 됩니다.' };
    }
    return null;
  }

  const label = (n) => Math.floor(n / 100) + '년 ' + (n % 100) + '월';

  global.ChaeksaMemo = { list, add, setOutcome, remove, due, upcoming, stats, judge, label, OUTCOMES, ym,
                         track, tracks, log, loggedThisMonth, pattern, respond, standing, ahead };
})(window);
