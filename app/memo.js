/* 책사 비망록 — 비서가 들고 다니는 수첩
 *
 * 카드는 사람을 데려오고, 이 수첩은 사람을 남긴다.
 * 점집과 비서의 차이는 기억이다. 지난달에 "9월이 좋다"고 해놓고 9월에 아무 말도
 * 안 하면 그건 비서가 아니다.
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

  function list(personId) {
    return load().filter(x => x.personId === personId)
      .sort((a, b) => a.ym - b.ym);
  }

  function add(personId, q, y, m, R) {
    const arr = load();
    const item = {
      id: 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      personId, q: String(q).slice(0, 60), ym: ym(y, m),
      verdict: judge(R, y, m), outcome: null,
      createdAt: new Date().toISOString(),
    };
    arr.push(item);
    save(arr);
    return item;
  }

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

  const label = (n) => Math.floor(n / 100) + '년 ' + (n % 100) + '월';

  global.ChaeksaMemo = { list, add, setOutcome, remove, due, upcoming, stats, judge, label, OUTCOMES, ym };
})(window);
