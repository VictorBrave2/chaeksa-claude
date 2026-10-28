/* 오늘의 운세 — 뼈대(메인 몫, 10-28 사장님 「네가 뼈대 시작해야지」). 손님 문장은 한 줄도 없다 — 문장은 조각표(today-pieces.js, Codex COPY-0020).
 * 재료는 십성 변화 엔진(sipseong-byeonhwa.js) 하나. 생극제화 · 격 · 강약 · 합충 · 신살로 오늘을 말하지 않는다(CLAUDE.md 「엔진이 먼저다」).
 *
 * 갈림(사람을 가르는 것) — 축 둘, 곱하지 않고 줄마다 하나의 조각 열쇠:
 *   새로 옴 줄: 「새로|쪽|십신|원국대비」 = 쪽 2(천간 생각 · 지지 몸) × 십신 10 × 원국대비 3(겉 · 속 · 없음) = 60
 *   이어짐 줄:  「이어|지지|십신|원국대비」 = 30   (원국대비를 빼면 같은 날 열 갈래뿐 — tools/daily-measure.js 10 → 76)
 *   이번 달 바탕: 「바탕|쪽|무리」 = 10 · 오늘 쉬는 흐름: 「빠짐|쪽|무리」 = 10 · 공통: 「조용」 · 「저녁」
 * 첫 줄 차례: 처음 > 다시 옴 > 이어짐, 같으면 지지(몸 · 행동 = 일어나는 일) 먼저. 조용한 날 = 변동폭 0~1.
 * 기록은 이 브라우저 안(localStorage chaeksa.diary.v1)만 — 서버로 보내지 않는다. */
(function (global) {
  'use strict';
  const 쪽들 = ['천간', '지지'];
  const 쪽말 = { 천간: '생각', 지지: '몸' };
  const 십신들 = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
  const 무리들 = ['비겁', '식상', '재성', '관성', '인성'];
  const 대비들 = ['겉', '속', '없음'];
  const 조용한폭 = 1;
  const 두자리 = (n) => (n < 10 ? '0' : '') + n;
  const 날짜글 = (d) => d.getFullYear() + '-' + 두자리(d.getMonth() + 1) + '-' + 두자리(d.getDate());
  const BH = () => global.ChaeksaByeonhwa;

  // 뼈대 — 화면 칸 차례와 칸마다 꽂는 조각 자리. 구조를 바꾸려면 사장님 결정 → tools/today-test.js 지문 갱신.
  const 뼈대 = Object.freeze([
    { 칸: '오늘', 줄: ['첫줄.한줄', '첫줄.누구', '첫줄.일', '첫줄.행동', '둘째줄.한줄', '조용.한줄', '바탕.한줄', '빠짐.한줄'] },
    { 칸: '이번주', 줄: ['날.주한줄', '힘쓸날'] },
    { 칸: '이번달', 줄: ['달바뀜.바탕.한줄'] },
    { 칸: '저녁', 줄: ['저녁.물음', '저녁.답'] },
  ]);
  const 오늘필드 = ['한줄', '누구', '일', '행동', '주한줄'];

  // 조각 열쇠 전부(조각표 빈 틀 · 시험이 쓴다)
  function 열쇠들() {
    const a = [];
    쪽들.forEach(쪽 => 십신들.forEach(십 => 대비들.forEach(대 => a.push('새로|' + 쪽 + '|' + 십 + '|' + 대))));
    십신들.forEach(십 => 대비들.forEach(대 => a.push('이어|지지|' + 십 + '|' + 대)));   // 이어짐 줄이 첫 줄이 되는 건 둘 다 이어질 때뿐이고, 그때는 지지가 먼저 — 「이어|천간」은 화면에 안 나온다
    쪽들.forEach(쪽 => 무리들.forEach(무 => { a.push('바탕|' + 쪽 + '|' + 무); a.push('빠짐|' + 쪽 + '|' + 무); }));
    a.push('조용', '저녁');
    return a;
  }
  const 줄열쇠 = (쪽, e) => (e.상태 === '이어짐' ? '이어|' : '새로|') + 쪽 + '|' + e.십신 + '|' + e.원국대비;
  const 무게 = (e) => e.처음 ? 3 : e.다시옴 ? 2 : 1;

  // 오늘(R, date) — 한 사람 하루의 값 묶음. 문장 없음.
  function 오늘(R, date) {
    const d = date || new Date();
    const V = BH().변화(BH().층표(R, d));
    const 줄들 = 쪽들.map(쪽 => {
      const e = V.용[쪽];
      return {
        쪽, 쪽말: 쪽말[쪽], 글자: e.글자, 십신: e.십신, 무리: e.무리, 상태: e.상태, 처음: !!e.처음, 다시옴: !!e.다시옴,
        원국대비: e.원국대비, 층수: e.층수, 열쇠: 줄열쇠(쪽, e),
        빠짐: e.빠짐 ? { 무리: e.빠짐.무리, 층수: e.빠짐.층수, 열쇠: '빠짐|' + 쪽 + '|' + e.빠짐.무리 } : null,
      };
    });
    const 차례 = 줄들.slice().sort((a, b) => 무게(b) - 무게(a) || (a.쪽 === '지지' ? -1 : 1));
    const 조용 = V.변동폭 <= 조용한폭;
    return {
      날짜: V.날짜, 요일: V.요일, 간지: V.용.간지, 변동폭: V.변동폭, 새로온수: V.새로온수, 조용,
      첫줄: 차례[0], 둘째줄: 차례[1].상태 === '새로 옴' ? 차례[1] : null,
      바탕: 쪽들.map(쪽 => ({ 쪽, 무리: V.체[쪽].무리, 층수: V.체[쪽].층수, 열쇠: '바탕|' + 쪽 + '|' + V.체[쪽].무리 })),
      빠짐: 줄들.filter(x => x.빠짐).map(x => Object.assign({ 쪽: x.쪽 }, x.빠짐)),
      월운: V.체.간지.월운, 대운: V.체.간지.대운,
      재료: Object.fromEntries(줄들.map(x => [x.쪽, 재료of(x.십신)])),
    };
  }
  function 재료of(십) { const t = ((global.ChaeksaSipseong || {}).뜻 || {})[십]; return t ? { 중심: t.중심, 두드러짐: t.두드러짐, 부딪힘: t.부딪힘 } : null; }

  // 이번주(R, date) — 오늘부터 일곱 날. 힘쓸날 = 변동폭이 가장 큰 날 전부(고르지 않는다 — 사장님 09-27).
  function 이번주(R, date) {
    const d0 = date || new Date();
    const 날들 = [];
    for (let i = 0; i < 7; i++) 날들.push(오늘(R, new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i)));
    const 큰 = Math.max.apply(null, 날들.map(x => x.변동폭));
    return { 날들, 힘쓸날: 날들.filter(x => x.변동폭 === 큰 && !x.조용).map(x => x.날짜) };
  }

  // 이번달(R, date) — 지금 바탕과, 앞으로 40일 안에 바탕(월운)이 바뀌는 첫날과 그때의 바탕.
  function 이번달(R, date) {
    const d0 = date || new Date();
    const 지금 = 오늘(R, d0);
    for (let i = 1; i <= 40; i++) {
      const x = 오늘(R, new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i));
      if (x.월운 !== 지금.월운) return { 바탕: 지금.바탕, 월운: 지금.월운, 달바뀜: { 날짜: x.날짜, 월운: x.월운, 바탕: x.바탕, 대운바뀜: x.대운 !== 지금.대운 } };
    }
    return { 바탕: 지금.바탕, 월운: 지금.월운, 달바뀜: null };
  }

  // 기록 — 이 브라우저 안만. 저장소를 넘겨받아 시험에서 바꿔 끼운다. 못 쓰면 조용히 넘어간다.
  const 기록열쇠 = 'chaeksa.diary.v1';
  const 답들 = ['비슷', '다름', '없음'];
  function 기록(store) {
    const S = store || (function () { try { return global.localStorage; } catch (e) { return null; } })();
    const 읽 = () => { try { return JSON.parse((S && S.getItem(기록열쇠)) || '{}') || {}; } catch (e) { return {}; } };
    const 씀 = (o) => { try { if (S) S.setItem(기록열쇠, JSON.stringify(o)); return !!S; } catch (e) { return false; } };
    const 칸 = (o, id, 날) => { o[id] = o[id] || {}; o[id][날] = o[id][날] || {}; return o[id][날]; };
    return {
      // 예고는 그날 처음 연 값만 남긴다(뒤에 엔진이 바뀌어도 그날 본 것이 남게)
      예고(id, v) {
        if (!id || !v) return false;
        const o = 읽(), c = 칸(o, id, v.날짜);
        if (c.예고) return true;
        c.예고 = { 간지: v.간지, 변동폭: v.변동폭, 조용: v.조용, 첫줄: v.첫줄.열쇠, 둘째줄: v.둘째줄 ? v.둘째줄.열쇠 : null };
        return 씀(o);
      },
      답(id, 날짜, 답, 메모) {
        if (!id || 답들.indexOf(답) < 0) return false;
        const o = 읽(), c = 칸(o, id, 날짜);
        c.답 = 답; c.메모 = String(메모 || '').slice(0, 200); c.at = new Date().toISOString();
        return 씀(o);
      },
      하루(id, 날짜) { const o = 읽(); return (o[id] && o[id][날짜]) || null; },
      // 이번 달의 나 — 날짜 차례로 예고와 답을 나란히. 맞힌 비율은 내지 않는다.
      달(id, 년월) { const o = 읽()[id] || {}; return Object.keys(o).filter(k => k.slice(0, 7) === 년월).sort().map(k => Object.assign({ 날짜: k }, o[k])); },
    };
  }

  // 조립(값, 조각표) — 뼈대 자리에 조각을 꽂는다. 손님 화면은 빈 조각을 건너뛰고, 시험은 빈 목록을 본다.
  function 조립(v, 표) {
    표 = 표 || global.ChaeksaTodayPieces || {};
    const 빈 = [];
    const 꺼냄 = (열, 필드) => { const t = 표[열] && 표[열][필드]; if (!t) 빈.push(열 + '.' + 필드); return t || ''; };
    const 오늘칸 = [];
    ['한줄', '누구', '일', '행동'].forEach(f => 오늘칸.push({ 자리: '첫줄.' + f, 열쇠: v.첫줄.열쇠, 글: 꺼냄(v.첫줄.열쇠, f) }));
    if (v.둘째줄) 오늘칸.push({ 자리: '둘째줄.한줄', 열쇠: v.둘째줄.열쇠, 글: 꺼냄(v.둘째줄.열쇠, '한줄') });
    if (v.조용) 오늘칸.push({ 자리: '조용.한줄', 열쇠: '조용', 글: 꺼냄('조용', '한줄') });
    v.바탕.forEach(b => 오늘칸.push({ 자리: '바탕.한줄', 열쇠: b.열쇠, 글: 꺼냄(b.열쇠, '한줄') }));
    v.빠짐.forEach(b => 오늘칸.push({ 자리: '빠짐.한줄', 열쇠: b.열쇠, 글: 꺼냄(b.열쇠, '한줄') }));
    return { 칸: [{ 칸: '오늘', 줄: 오늘칸.filter(x => x.글) }], 빈 };
  }

  global.ChaeksaToday = { 뼈대, 오늘필드, 열쇠들, 오늘, 이번주, 이번달, 기록, 조립, 십신들, 무리들, 대비들, 쪽말, 조용한폭 };
})(typeof window !== 'undefined' ? window : globalThis);
