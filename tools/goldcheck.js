/* 골드 케이스 채점기 — 「우리가 바깥과 맞나」를 잰다.
 *
 * enginecheck 와 다르다. enginecheck 는 코드가 표대로 도는지 보고,
 * 이것은 **문헌과 삶에 대조한다.** 규칙은 docs/26_골드케이스.md.
 *
 * 실행:  cp tools/goldcheck.js app/_gold.js
 *        cp tools/goldcases.json app/_gold.json
 *        (개발 서버 콘솔)
 *        await fetch('/_gold.js').then(r=>r.text()).then(s=>eval(s))
 *        rm app/_gold.js app/_gold.json
 *
 * 채점은 후하게 매기지 않는다 —
 *   · 사주(간지)가 다르면 그 케이스는 통째로 실패. 판정은 안 본다.
 *   · 판정 골드는 정확 일치만 맞음.
 *   · 사건 연도는 ±0 이 맞음. ±1 은 따로 센다(맞음으로 안 센다).
 *   · 맞은 것보다 **틀린 것을 먼저** 적는다.
 *
 * 미래 값(지킬해 — 앞으로 샐 해)은 아직 안 일어난 일이라 채점하지 않는다.
 */
(async function () {
  'use strict';
  const E = window.ChaeksaEngine, T = window.ChaeksaTypecard;
  if (!E || !T) return '엔진이 없다 — 페이지를 먼저 열어라';

  let cases;
  try { cases = await fetch('/_gold.json?x=' + Date.now()).then(r => r.json()); }
  catch (e) { return '_gold.json 을 못 읽었다: ' + e.message; }
  if (!Array.isArray(cases)) return '_gold.json 이 배열이 아니다';

  const out = [], say = (s) => out.push(s);
  const 셈 = { 케이스: 0, 사주틀림: 0, 판정: { 맞: 0, 틀: 0 }, 사건: { 맞: 0, 틀: 0, 근접: 0 } };
  const 틀린것 = [];
  const 적기 = (id, 항목, 참, 우리) => 틀린것.push([id, 항목, String(참), String(우리 || '없음')]);

  const 간지of = (R) => ['year', 'month', 'day', 'hour']
    .filter(k => R.pillars[k])
    .map(k => E.STEMS[R.pillars[k].stem] + E.BRANCHES[R.pillars[k].branch]).join(' ');

  /** 「50대」 「40대」 「52~61세」 → [시작, 끝] */
  function 구간of(s) {
    const t = String(s || '');
    const 대 = t.match(/(\d+)\s*대/);
    if (대) { const a = +대[1]; return [a, a + 9]; }
    const 범 = t.match(/(\d+)\s*[~\-–]\s*(\d+)/);
    if (범) return [+범[1], +범[2]];
    const 하 = t.match(/(\d+)/);
    if (하) return [+하[1], +하[1]];
    return null;
  }
  const 겹치나 = (a, b) => a && b && a[0] <= b[1] && b[0] <= a[1];

  /** 「甲戌 庚午 戊辰 己未」 → pillars. 고전 명조는 날짜가 없고 간지만 있다. */
  function 기둥of(s) {
    const p = String(s).trim().split(/\s+/), k = ['year', 'month', 'day', 'hour'], o = {};
    if (p.length < 3) return null;
    for (let i = 0; i < p.length && i < 4; i++) {
      const st = E.STEMS.indexOf(p[i][0]), br = E.BRANCHES.indexOf(p[i][1]);
      if (st < 0 || br < 0) return null;
      o[k[i]] = { stem: st, branch: br };
    }
    return o;
  }

  for (const c of cases) {
    const 간지만 = !c.입력 && c.간지;          // 고전 명조 — 날짜가 없다
    if (!c || (!c.입력 && !간지만)) continue;
    셈.케이스++;

    let R = null, F = null, 재 = null;

    if (간지만) {
      // ── 날짜 없이 기둥만으로 판정한다. 사건 골드는 대운이 없어 채점 못 한다.
      const P = 기둥of(c.간지);
      if (!P) { 셈.사주틀림++; 적기(c.id, '간지', c.간지, '읽지 못했다 — 「甲戌 庚午 戊辰 己未」 꼴로'); continue; }
      let a, gy, jo;
      try {
        a = E.strengthOf(P);
        gy = T.gyeok({ pillars: P, analysis: a });
        jo = window.ChaeksaClassic ? window.ChaeksaClassic.gungtong({ pillars: P, analysis: a }) : null;
      } catch (e) { 셈.사주틀림++; 적기(c.id, '판정 실패', e.message, ''); continue; }
      재 = { 격: gy && gy.name, 판정: gy && gy.판정, 상신: gy && gy.상신,
             강약: a && a.strength, 조후용신: jo && jo.need };
      if (c.연표) 적기(c.id, '연표', '있음', '간지만 있는 케이스는 사건을 못 잰다 — 생년월일시가 필요하다');
    } else {
      try {
        R = E.calc(Object.assign({ place: 'KR:서울', longitude: 126.98, tzOffset: null,
                                   solarCorrection: true }, c.입력));
        F = T.간명자료(R, new Date());
      } catch (e) { 적기(c.id, '계산 실패', e.message, ''); 셈.사주틀림++; continue; }

      // 사주가 문헌과 같은가. 여기서 어긋나면 나머지는 의미가 없다
      const 우리간지 = 간지of(R);
      if (c.간지 && c.간지.replace(/\s+/g, ' ').trim() !== 우리간지) {
        셈.사주틀림++;
        적기(c.id, '사주', c.간지, 우리간지 + '  ← 절기·진태양시부터 본다');
        continue;
      }
      재 = {
        격:       F.자평진전 && F.자평진전.격,
        판정:     F.자평진전 && F.자평진전.판정,
        상신:     F.자평진전 && F.자평진전.상신,
        강약:     F.억부 && F.억부.강약,
        조후용신: F.궁통보감 && F.궁통보감.필요한글자,
      };
    }

    // ── 1. 판정 골드 — 정확 일치만 맞음
    Object.keys(c.확정 || {}).forEach(k => {
      if (재[k] === undefined) { 적기(c.id, k, c.확정[k], '우리가 안 재는 항목'); return; }
      if (String(c.확정[k]) === String(재[k])) 셈.판정.맞++;
      else { 셈.판정.틀++; 적기(c.id, k, c.확정[k], 재[k]); }
    });

    // ── 2. 사건 골드. 간지만 있는 케이스는 대운·세운이 없어 못 잰다
    if (간지만) continue;
    const 연 = c.연표 || {};
    const 배열 = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

    // 우리가 짚은 해들. 과거연대기가 본체이고 궁위한방은 그중 최고점 하나다.
    const 연대 = F.과거연대기 || [];
    const 축해 = (축) => 연대.filter(r => !축 || r.축 === 축).map(r => r.해);
    const 연애해 = (F.연애과거구간 || [])
      .map(r => String(r.구간 || '').split('~')[0]).map(Number).filter(Boolean);

    function 해대조(이름, 참들, 우리들) {
      const B = [...new Set(우리들.map(Number).filter(Boolean))];
      배열(참들).map(Number).filter(Boolean).forEach(y => {
        if (B.indexOf(y) >= 0) { 셈.사건.맞++; return; }
        if (B.some(b => Math.abs(b - y) === 1)) {
          셈.사건.근접++; 적기(c.id, 이름 + ' ±1년', y, B.join(','));
        } else { 셈.사건.틀++; 적기(c.id, 이름, y, B.join(',')); }
      });
    }

    // 인연은 두 갈래로 짚는다 — 궁위 연대기(관계 축)와 연애 구간. 둘 중 하나만 맞아도 맞음
    해대조('인연움직인해', 연.인연움직인해, 축해('관계').concat(연애해));
    해대조('큰돈나간해', 연.큰돈나간해, (F.샌해 || []).map(x => x && x.해));
    해대조('조용하지않은해', 연.조용하지않은해, 축해(null));

    // 열리는 달 — 「2026-10」 꼴로 적는다. 그 달 하나만 맞음이다
    const 달목록 = (arr) => (arr || []).map(x => x && (x.연 + '-' + x.월));
    function 달대조(이름, 참들, 우리들) {
      const B = 우리들.filter(Boolean);
      배열(참들).forEach(m => {
        const s = String(m).replace(/\s/g, '').replace(/[.\/]/g, '-')
          .replace(/-0(\d)$/, '-$1');
        if (B.indexOf(s) >= 0) 셈.사건.맞++;
        else { 셈.사건.틀++; 적기(c.id, 이름, s, B.join(' ')); }
      });
    }
    달대조('인연 열린달', 연.인연열린달, 달목록(F.열리는달_인연));
    달대조('재물 열린달', 연.재물열린달, 달목록(F.열리는달_재물));

    // 직업 — 낱말 하나라도 걸리면 맞음
    if (연.직업 && F.천직) {
      const 우 = (F.천직.일들 || '') + ' ' + (F.천직.유형 || '') + ' ' + (F.천직.풀이 || '');
      const 맞 = String(연.직업).split(/[·,\s]+/).filter(Boolean).some(w => 우.indexOf(w) >= 0);
      if (맞) 셈.사건.맞++;
      else { 셈.사건.틀++; 적기(c.id, '직업', 연.직업, (F.천직.유형 || '') + ' / ' + (F.천직.일들 || '')); }
    }

    // 가장 두터웠던 십 년 — 구간이 겹치면 맞음(「50대」 vs 「52~61세」는 겹친다)
    if (연.가장두터웠던십년 && F.운로) {
      const a = 구간of(연.가장두터웠던십년), b = 구간of(F.운로.최고구간);
      if (겹치나(a, b)) 셈.사건.맞++;
      else { 셈.사건.틀++; 적기(c.id, '최고구간', 연.가장두터웠던십년, F.운로.최고구간); }
    }
  }

  // ── 보고. 틀린 것을 먼저 적는다
  say('골드 케이스 ' + 셈.케이스 + '건');
  say('');
  if (틀린것.length) {
    say('── 어긋난 것 ' + 틀린것.length + ' ──');
    틀린것.forEach(([id, 항목, 참, 우리]) =>
      say('  ' + id + '  ' + 항목 + '\n      문헌·삶: ' + 참 + '\n      우리:    ' + 우리));
  } else if (셈.케이스) say('── 어긋난 것 없음 ──');
  say('');
  say('사주가 문헌과 다른 케이스   ' + 셈.사주틀림);
  say('판정 골드  맞 ' + 셈.판정.맞 + ' · 틀 ' + 셈.판정.틀);
  say('사건 골드  맞 ' + 셈.사건.맞 + ' · 틀 ' + 셈.사건.틀 + ' · ±1년 ' + 셈.사건.근접 + ' (맞음 아님)');
  if (!셈.케이스) say('\n※ _gold.json 이 비어 있다. docs/26_골드케이스.md 의 모양대로 채워라.');
  say('');
  say('※ 이 숫자를 발행물에 쓰지 마라. 표본이 쌓이고 사장님이 결재하기 전까지는 내부용이다.');
  return out.join('\n');
})();
