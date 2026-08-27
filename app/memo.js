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
    const G = T.SEASON_GRADE || [];
    const g = G.find(x => mon.v / 50 >= x.min) || G[G.length - 1] || { name: '보합', line: '' };
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
                   verdict: judge(R, y, m), at: new Date().toISOString().slice(0, 10) });
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
    const good = done.filter(x => x.verdict.score >= 75);
    const bad = done.filter(x => x.verdict.score < 50);
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
    const 좋다 = logs.filter(l => l.verdict && l.verdict.score >= 75);
    const 아니다 = logs.filter(l => l.verdict && l.verdict.score < 50);
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

  const label = (n) => Math.floor(n / 100) + '년 ' + (n % 100) + '월';

  global.ChaeksaMemo = { list, add, setOutcome, remove, due, upcoming, stats, judge, label, OUTCOMES, ym,
                         track, tracks, log, loggedThisMonth, pattern };
})(window);
