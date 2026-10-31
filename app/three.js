/* 「세 관점이 모인 한 점」 화면(10-30 사장님 「세 관점으로 점을 찍는 컨텐츠 진행 ㄱㄱ」 · 「시를 무조건 넣도록 해」 · 「이 컨텐츠의 목적은 세 관점이 모인 하나의 점이야」).
 * 계산은 비공개 서버 /api/three-eyes(lib/three-eyes.js — 사주 · 자미두수 · 타로가 다음 달부터 24달 안 같은 달 · 같은 자리를 가리킨 칸 하나). 글은 three-pieces.js(Codex). 메인은 글을 쓰지 않는다.
 * 꼴(10-23 블록 꼴 「물음 → 결론 → 근거 접힘, 끝에 할 일」):
 *   이름 · 물음 → (카드 전) 창 · 뒤집힌 카드 일곱 → (카드 뒤) 뽑은 카드 → 결론(점: 때 · 자리) + 덧말 둘(방향 · 누구) 또는 점 없음(까닭 + 다음 카드 날)
 *   → 근거 보기(접힘: 타로 원문 · 자미두수 斗君 원문 · 사주 열쇠 · 24달 표 · 우연 몫) → 끝(점의 때가 오면 「있었나」 기록).
 * 한 달에 한 장(결정함 46): 뽑은 카드 · 응답은 이 기기 localStorage 「chaeksa.three.v1.<사람 열쇠>」에 둔다 — 점이 찍히면 그 때가 끝날 때까지 그대로,
 *   점이 없으면 다음 달 1일부터 새 카드. 응답을 다시 부르지 않는다(달이 바뀌면 창도 바뀌어 다른 답이 나오므로).
 * 카드는 화면이 뽑는다 — 78장을 crypto 무작위로 섞고 바로/거꾸로 반반, 일곱 장을 뒤집어 놓는다. 창(다음 달부터 24달)은 뽑기 전에 보인다(웨이트 Part III 901줄).
 * 시각 모르는 사람은 막는다(결정함 44). 사람 고르는 칸은 이 화면 안에서만 바꾼다(why.js 와 같은 까닭).
 * 주소 끝 ?keys — 빈 글 칸 자리에 열쇠 이름을 보인다(뼈대 확인 · Codex 용).
 * 10-31 세 점의 길흉(아래 「세점」 — 결정함 64 ~ 69): 물음 하나 · 카드 한 장 → 타로 · 사주 · 자미 점마다 길흉. Codex 글(세점.물음말)이 오면 이쪽이 켜지고, 그 전엔 옛 판(한 점)을 그린다. ?keys 면 세 점 뼈대.
 * 10-31 켈틱 펼침(아래 「펼침」 — 사장님 「타로카드 보는법 정석대로 ㄱㄱ」 · 웨이트 Part III §7): 카드 한 장 대신 나 카드 → 섞기 · 세 번 떼기 → 열 자리, 타로 점의 길흉 = 열째.
 * 10-31 타로 점의 때 = 이번 달(뽑은 날 ~ 그달 말일 · 결정함 82 — 사장님 「오늘 뽑은 카드가 2년간 유지되면 안될 것 같은데」). 사주 · 자미 점만 다음 달부터 24달.
 *   타로 때 · 왜는 새 칸 세점.때.타로달 · 세점.왜.타로달(Codex · COPY-0026 끝 절) — 비면 때는 달 이름 값만, 왜는 건너뛴다(「두 해」를 말하던 옛 칸은 읽지 않는다).
 *   Codex 글의 필수 칸(펼침필수 — 나 넷 · 섞기 · 떼기 · 결과보기 · 자리 · 자리뜻 열씩 · 끝말 · 다시말 · 궁정말 · 끝카드)이 다 차야 켜진다 — 그 전엔 위 한 장 판 그대로. ?keys 면 펼침 뼈대.
 * 10-31 고르기 · 뒤집기(결정함 83 — 사장님 「타로 카드 뽑는 게 재미가 없네」): 섞기 → 떼기 셋 → 부채꼴 77장에서 손님이 열 장을 고른다(고른 차례 = 자리 1 ~ 10 · 판에 날아가 놓임)
 *   → 서버가 섞고 뗀 덱의 그 자리 카드(몸의 고름) → 한 장씩 뒤집기(판을 눌러도 · 뒤집을 때마다 그 장의 자리 · 카드 · 놓임 · 길흉 읽기 칸) → 열째 뒤 끝말 + 결과보기.
 *   다시 펼침(706)은 고르지 않는다 — 다시 떼기 셋 뒤 책사가 놓은 열 장을 한 장씩 뒤집는다. 새 글 칸(비면 건너뜀): 세점.펼침.고르기 · 세점.펼침.뒤집기 · 세점.펼침.카드뜻.<id>.<놓임>.
 * 10-31 장 풀이(결정함 84 — 사장님 「카드뽑는게 재밌는데 / 내가 뽑은 카드가 어떤 영향을 끼치고 해석되는지를 알고싶은데 안나오는듯?」): 뒤집은 장마다
 *   자리 · 자리뜻 → 카드 · 놓임 → 길흉 → 카드뜻 → 영향(이 자리에서 이 카드 · 길흉이 그 물음에 무엇을 하나) → 왜(그 물음 길흉을 무엇으로 읽었나 — 엔진 v0.6 왜 = 직접 · 전체 · 엇갈림)
 *   + 원문 낱말 줄(웨이트 영어 그대로 · 줄 번호 — 직접이면 그 물음을 말한 낱말 · 전체면 카드 본뜻 낱말(엔진 뜻말) · 엇갈림이면 둘 다).
 *   결과: 판 + 열 장 풀이를 따로 접힘(jt-ev three-cards · 머리 = 판머리)으로 — 세 점 결론 바로 아래 · 근거 접힘 위(결정함 80 고침). 1 ~ 9째 길흉은 여전히 셈에 넣지 않는다(73).
 *   새 글 칸(Codex · 비면 건너뜀): 세점.펼침.영향.<1~10>.<길|흉|섞임>({카드} {물음} {놓임} — 10째는 그리지 않음 · 87) · 세점.펼침.왜.<직접|전체|엇갈림>({물음}) · 세점.펼침.읽는법({물음} — 첫 판 첫 장을 뒤집기 전에만 · 87 · 88).
 * 10-31 열 장 이야기(결정함 85 — 사장님 「가령 돈을 생각하며 카드를 뽑았을 때 / 1~9번째 뽑은 카드에 대한 스토리는 없단 것이 잖아」): 1 ~ 9째를 한 줄거리로 엮는다.
 *   근거 — 705 「It should embody whatsoever you may have divined from the other cards」 · 703 「brought about by the influences shewn by the other cards」.
 *   차례(메인 추론 — 웨이트 자리 줄의 때 낱말): 지나온 것 4(685 이미 내 것) · 5(687 막 지나감) → 지금 1(679 분위기) · 2(681 걸림) · 7(697 나) · 8(699 주변) · 9(701 바람 · 두려움)
 *   → 앞으로 6(691 가까운 앞날) · 3(683 이룰 최선 · 아직) → 끝 10(703). 줄 = 세점.펼침.이야기.<n>.<길|흉|섞임>({카드말} {카드} {물음} {놓임}) · 카드말 = 세점.펼침.카드말.<카드>.<놓임>
 *   · 막 머리 세점.펼침.이야기때.<지나온|지금|앞으로|끝> · 이야기머리({물음}). 판의 열 줄이 다 차야 그린다(반쯤 빈 이야기 없음 · ?keys 면 열쇠). 길흉은 줄 말투만 고른다 — 결론 셈은 열째 하나(73).
 *   자리: 펼친 순간 열째를 뒤집은 뒤(읽기 칸 아래 · 끝말 위) · 결과 열 장 접힘(판 그림 아래 · 자리 목록 위 · 다시 펼쳤으면 판마다).
 *   11-01 물음마다 카드 풀이(결정함 90 · 사장님 「질문마다 바뀌는 카드의 해석이 필요해 보이는데」): 세점.펼침.물음카드뜻 · 물음카드말.<물음>.<카드>.<놓임> — 그 물음의 156면이 다 차면
 *   그 물음에서만 카드뜻 · 카드말 대신 쓴다(읽기 칸 · 자리 목록 첫 줄 · 이야기 줄의 {카드말}). 자료표 copy-requests/ref/COPY-0026-question-cards.md(방향 없음 — 방향표는 비공개)
 * 10-31 더미 누름(결정함 86 — Codex PR #13 「카드 더미 직접 누름」에서 지금 흐름에 맞는 것만): 뒷면 더미를 눌러도 섞기 · 떼기(다시 떼기)가 된다 — 단추와 같은 일.
 * 10-31 배포 뒤 뜻 대조 고침(결정함 87 — v1536 검토에서 확인된 메인 몫 둘): 읽는법(「한 장씩 뒤집어 …」)은 펼친 순간 첫 장을 뒤집기 전에만 — 결과 열 장 접힘은 다 앞면이라 맞지 않아 뺐다.
 *   영향 줄은 1 ~ 9째만 — 10째는 바로 위 자리뜻.10(앞 영향이 모인 끝)과 끝말 · 다시말(길흉)이 이미 말해 한 자리에서 같은 말이 세 번이었다(주문서 영향 표 10행 탓).
 * 10-31 이야기 켜짐(결정함 88 — Codex PR #14 이야기 191칸 합침 · v1538 배포 뒤 검토): 열째를 뒤집은 뒤 부르는 칸 = 열째 풀이 칸(start · 끝말로 부르면 이야기 높이만큼 열째 풀이가 위로 밀림)
 *   · 읽는법은 첫 판에만(다시 펼친 둘째 판 앞엔 없음 — 「여기 하나뿐」). */
(function (global) {
  'use strict';
  const API = 'https://chaeksa-behavior-core.vercel.app/api/three-eyes';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 값 뒤(닫는 따옴표 너머까지) 조사를 값의 받침에 맞춘다 — 「‘{자리}’와」 → 「‘돈과 재산’과」. 사이트 공통 약속 {값|와} 도 받는다(today-core 붙이기와 같은 일).
  // 10-31 켈틱 펼침 {카드} — 끝 괄호 묶음은 앞말을 돕는 말이라 건너뛰고(조사는 괄호 앞말에: 「완드 페이지(시종)가」 — 화면 글 검사기 B 와 같은 약속),
  //   끝이 숫자면 한자음 받침(영 일 이 삼 사 오 육 칠 팔 구: 「완드 6이」 · 「컵 2가」 · 「펜타클 10으로」 — byeonhwa.js · jt-webtoon.js 받침과 같은 셈).
  const 숫자받침 = [21, 8, 0, 16, 0, 0, 1, 8, 8, 0];
  const 받침of = s => {
    const 원 = String(s), 앞 = 원.replace(/(?:\s*\([^()]*\))+\s*$/, '') || 원;   // 괄호뿐인 값은 그대로
    if (/[0-9]$/.test(앞)) return 숫자받침[+앞.slice(-1)];
    const t = 앞.replace(/[^가-힣]+$/, ''); if (!t) return -1; const c = t.charCodeAt(t.length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? c % 28 : -1;
  };
  const 조사짝 = { 와: ['과', '와'], 과: ['과', '와'], 을: ['을', '를'], 를: ['을', '를'], 은: ['은', '는'], 는: ['은', '는'], 이: ['이', '가'], 가: ['이', '가'] };
  const 조사맞춤 = (v, 조) => { const b = 받침of(v); if (b < 0) return 조; if (조 === '으로' || 조 === '로') return b === 0 || b === 8 ? '로' : '으로'; const 짝 = 조사짝[조]; return 짝 ? 짝[b ? 0 : 1] : 조; };
  const 채움 = (틀, 값) => String(틀 || '').replace(/\{([^{}|]+)(?:\|([^{}]*))?\}([’”」』)]*)((?:으로|로|와|과|을|를|은|는|이|가)(?=$|[\s.,!?:;]))?/g, (m, k, 붙, 닫, 뒤) => {
    if (!(k in 값)) return m;
    const v = String(값[k]);
    return v + (붙 ? 조사맞춤(v, 붙) : '') + (닫 || '') + (뒤 ? 조사맞춤(v, 뒤) : '');
  });
  const 열쇠보기 = () => { try { return /(?:^|[?&])keys(?:[=&]|$)/.test(String(global.location && global.location.search || '')); } catch (e) { return false; } };
  // 글(키, 값) — 조각에서 꺼내 값 자리를 채운다. 빈 칸이면 '' (?keys 면 〔키〕)
  function 글틀(P, 보기) {
    return (키, 값) => {
      let v = P;
      for (const k of 키.split('.')) v = v && typeof v === 'object' ? v[k] : undefined;
      if (typeof v === 'string' && v) return 값 ? 채움(v, 값) : v;
      return 보기 ? '〔' + 키 + '〕' : '';
    };
  }
  const 두 = n => String(n).padStart(2, '0');
  const 날글 = d => d.getFullYear() + '-' + 두(d.getMonth() + 1) + '-' + 두(d.getDate());
  const 날말 = s => { const a = String(s).split('-').map(Number); return a[0] + '년 ' + a[1] + '월 ' + a[2] + '일'; };
  const 때말 = (a, b) => {
    const x = String(a).split('-').map(Number), y = String(b).split('-').map(Number);
    return x[0] + '년 ' + x[1] + '월 ' + x[2] + '일 ~ ' + (y[0] !== x[0] ? y[0] + '년 ' : '') + (y[0] !== x[0] || y[1] !== x[1] ? y[1] + '월 ' : '') + y[2] + '일';
  };
  const 달말 = s => { const a = String(s).split('-').map(Number); return a[0] + '년 ' + a[1] + '월'; };
  function 해시(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  const 저장열쇠 = b => 'chaeksa.three.v1.' + 해시([b.year, b.month, b.day, b.hour, b.minute || 0, b.gender, b.place || '', b.longitude == null ? '' : b.longitude].join('|'));
  function 꺼냄(k) { try { return JSON.parse(global.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function 둠(k, v) { try { global.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // 78장 — 큰 비밀 M00 ~ M21 · 작은 비밀 W(완드) · C(컵) · S(소드) · P(펜타클) 01 ~ 14
  const 카드들 = (() => { const a = []; for (let i = 0; i <= 21; i++) a.push('M' + 두(i)); 'WCSP'.split('').forEach(s => { for (let i = 1; i <= 14; i++) a.push(s + 두(i)); }); return a; })();
  function 무작위(n) {   // 0 ~ n-1. crypto 가 없으면 Math.random(가짜 문서 · 옛 브라우저)
    try { const u = new Uint32Array(1); global.crypto.getRandomValues(u); return u[0] % n; } catch (e) { return Math.floor(Math.random() * n); }
  }
  function 섞은일곱() {
    const a = 카드들.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = 무작위(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a.slice(0, 7).map(id => ({ id, 놓임: 무작위(2) ? '거꾸로' : '바로' }));
  }
  // 창(다음 달부터 24달) — 서버 lib/three-eyes.js 창of 와 같은 셈(양력 달 이름표). 뽑기 전에 보인다.
  function 창말of(지금) {
    const y = 지금.getFullYear(), m = 지금.getMonth() + 1, 첫해 = m === 12 ? y + 1 : y, 첫달 = m === 12 ? 1 : m + 1;
    const 끝 = new Date(첫해, 첫달 - 1 + 23, 1);
    return { 첫: 첫해 + '-' + 두(첫달), 끝: 끝.getFullYear() + '-' + 두(끝.getMonth() + 1) };
  }

  // 타로 점의 때(결정함 82) — 서버 lib/three-points.js 타로달of 가 준 점.타로.때 { 달, 시작: 뽑은 날, 끝: 말일 }.
  //   옛 응답(v0.3까지)엔 달이 없다 — 저장된 응답은 뽑은 달에만 다시 그리므로 다음카드(다음 달 1일)의 앞 달이 뽑은 달(그달 1일 ~ 말일로 보인다).
  function 타로달of(r) {
    const t = (r.점 && r.점.타로 && r.점.타로.때) || {};
    if (t.달 && t.시작 && t.끝) return { 달: t.달, 시작: t.시작, 끝: t.끝 };
    const a = String(r.다음카드).split('-').map(Number), 달 = a[1] === 1 ? (a[0] - 1) + '-12' : a[0] + '-' + 두(a[1] - 1);
    return { 달, 시작: 달 + '-01', 끝: 달 + '-' + 두(new Date(a[0], a[1] - 1, 0).getDate()) };
  }

  // ── 카드 그림(10-31) — 코덱스 타로 덱 chaeksa-v1: 앞면 78 + 공통 뒷면(image-requests/tarot-deck-v1/HANDOFF.md).
  //    뽑힌 앞면 한 장만 불러온다. 다시 그린 다섯 장(M00 · M10 · W05 · C01 · S06) 때문에 앞면은 모두 ?v=2. 모르는 id 는 그림 없이 글만.
  const 그림길 = 'art/tarot/chaeksa-v1/', 그림id = /^(?:M(?:0\d|1\d|2[01])|[WCSP](?:0[1-9]|1[0-4]))$/;
  // 물음마다 카드 풀이(11-01 사장님 「질문마다 바뀌는 카드의 해석이 필요해 보이는데」 · 결정함 90) — 세점.펼침.물음카드뜻 · 물음카드말.<물음>.<카드>.<놓임>
  //   = 글 하나, 또는 웨이트가 남녀를 갈라 말한 칸(자료표 §3 · 10칸)은 { M, F } — 손님 성별은 나 카드(671 — P11 · P13 여 · P12 · P14 남)로 안다(서버가 같은 성별로 방향을 냈다).
  //   한 물음의 156면(78장 × 바로 · 거꾸로)이 다 차야 그 물음만 켠다 — 하나라도 비면 그 물음은 일반 카드뜻 · 카드말 그대로(반쯤 찬 물음 없음 · 꺼짐 길은 한 글자도 다르게 그리지 않는다).
  //   뜻 · 말은 따로 켠다. ?keys 면 늘 켜고 빈 칸에 그 열쇠를 보인다(Codex 자리 확인). 길흉은 이 글이 아니라 엔진(길흉 줄 · 영향 줄 · 이야기 줄 말투)이 말한다.
  const 물음칸 = Object.freeze(['물음카드뜻', '물음카드말']);
  const 성별of = 나 => { const id = String((나 && 나.id) || ''); return /^P1[13]$/.test(id) ? 'F' : /^P1[24]$/.test(id) ? 'M' : ''; };
  const 물음표of = (P, 종류, q) => { const t = P && P.세점 && P.세점.펼침 && P.세점.펼침[종류]; return t && typeof t === 'object' && q && t[q] && typeof t[q] === 'object' ? t[q] : null; };
  const 면참 = v => (typeof v === 'string' && !!v) || (!!v && typeof v === 'object' && typeof v.M === 'string' && !!v.M && typeof v.F === 'string' && !!v.F);
  const 물음켜짐 = (P, 종류, q) => { const t = 물음표of(P, 종류, q); return !!t && 카드들.every(id => !!t[id] && typeof t[id] === 'object' && 면참(t[id].바로) && 면참(t[id].거꾸로)); };
  // 한 판을 그리는 동안 물음 · 성별 · 켜짐을 한 번 센다 → { 뜻(x), 말(x) } — 꺼졌거나 비면 ''(부른 쪽이 일반 글로)
  function 물음맥of(r, P, 보기) {
    const q = r && r.물음, g = 성별of(r && r.펼침 && r.펼침.나);
    const 꺼냄 = 종 => {
      const t = (보기 || 물음켜짐(P, 종, q)) ? (물음표of(P, 종, q) || {}) : null;
      return x => {
        if (!t || !x) return '';
        const 면 = t[x.id] && typeof t[x.id] === 'object' ? t[x.id][x.놓임] : undefined, v = 면 && typeof 면 === 'object' ? (g ? 면[g] : undefined) : 면;
        if (typeof v === 'string' && v) return v;
        return 보기 ? '〔세점.펼침.' + 종 + '.' + q + '.' + x.id + '.' + x.놓임 + (면 && typeof 면 === 'object' ? '.' + (g || '?') : '') + '〕' : '';
      };
    };
    return { 뜻: 꺼냄('물음카드뜻'), 말: 꺼냄('물음카드말') };
  }
  const 뒷면그림 = '<img class="three-back-img" src="' + 그림길 + 'back-s.webp" alt="" decoding="async">';
  function 카드그림(id, 거꾸로) {
    if (!그림id.test(String(id))) return '';
    const 큰 = 그림길 + id + '.webp?v=2', 작은 = 그림길 + id + '-s.webp?v=2';
    return '<div class="three-card-media"><img class="three-card-img' + (거꾸로 ? ' is-rev' : '') + '" src="' + 큰 + '" srcset="' + 작은 + ' 320w, ' + 큰 + ' 960w"'
      + ' sizes="(max-width:420px) 36vw, 200px" alt="" decoding="async"></div>';
  }

  // ── 결과 그리기 ──
  function 카드칸(r, 글, P, 머리, 표) {   // 머리 — 펼침이면 글('세점.펼침.끝카드')(길흉을 정한 열째), 없으면 지금 그대로 「뽑은카드」 · 표 — 펼침 결과면 ' tabindex="-1"'(결과보기 뒤 초점 · D6)
    const c = r.카드, 이름 = (P.카드이름 && P.카드이름[c.id]) || c.이름, 그림 = 카드그림(c.id, c.놓임 === '거꾸로'), 머 = 머리 === undefined ? 글('뽑은카드') : 머리;
    return '<div class="three-drawn"' + (표 || '') + '>' + (머 ? '<p class="three-drawn-k">' + esc(머) + '</p>' : '')
      + '<div class="three-drawn-row' + (그림 ? ' has-art' : '') + '">' + 그림
      + '<div class="three-face' + (c.놓임 === '거꾸로' ? ' is-rev' : '') + '"><b>' + esc(이름) + '</b><small lang="en">' + esc(c.이름en) + '</small>'
      + (글('놓임말.' + c.놓임) ? '<span class="three-orient">' + esc(글('놓임말.' + c.놓임)) + '</span>' : '') + '</div></div></div>';
  }
  function 결론칸(r, 글) {
    if (r.점) {
      const z = r.점, 때 = 때말(z.때.시작, z.때.끝), 자리 = 글('자리말.' + z.자리);
      const 줄 = 글('결론', { 때, 자리 }) || (때 + (자리 ? ' · ' + 자리 : ''));
      const 방향 = 글('방향말.' + z.방향.표시, { 카드방향: 글('방향이름.' + z.방향.카드), 자미방향: 글('방향이름.' + z.방향.자미) });
      const 상대 = z.누구.map(x => 글('상대말.' + x.기둥)).filter(Boolean).join(' · ');
      const 누구 = 상대 ? (글('누구', { 상대 }) || 상대) : '';
      return '<div class="jt-answer three-answer">' + (글('결론머리') ? '<p class="three-kicker">' + esc(글('결론머리')) + '</p>' : '')
        + '<p class="three-point">' + esc(줄) + '</p></div>'
        + ((방향 || 누구) ? '<ul class="three-notes">' + (방향 ? '<li>' + (글('방향머리') ? '<b>' + esc(글('방향머리')) + '</b> ' : '') + esc(방향) + '</li>' : '')
          + (누구 ? '<li>' + (글('누구머리') ? '<b>' + esc(글('누구머리')) + '</b> ' : '') + esc(누구) + '</li>' : '') + '</ul>' : '');
    }
    return '<div class="jt-answer three-answer three-none">' + (글('점없음') ? '<p class="three-point">' + esc(글('점없음')) + '</p>' : '')
      + (글('까닭.' + r.까닭) ? '<p class="three-why">' + esc(글('까닭.' + r.까닭)) + '</p>' : '') + '</div>'
      + (글('다음카드', { 날: 날말(r.다음카드) }) ? '<p class="three-next">' + esc(글('다음카드', { 날: 날말(r.다음카드) })) + '</p>' : '');
  }
  function 근거칸(r, 글) {
    const c = r.카드, 원 = r.원문 || {};
    let h = '<details class="jt-ev three-basis"><summary>' + esc(글('근거')) + '</summary>';
    // 타로 — 웨이트 원문 그대로(영어) · 줄
    h += '<section class="three-eye">' + (글('근거타로') ? '<h3>' + esc(글('근거타로')) + '</h3>' : '')
      + '<blockquote class="three-src" lang="en">' + esc(c.원문) + '</blockquote>'
      + '<p class="three-ref" lang="en">Waite, The Pictorial Key to the Tarot · Part III ' + esc(c.줄) + (c.절 === '§4' ? ' §4' : '') + ' · ' + esc(c.이름en) + '</p>'   // 출처 줄은 통째로 영어 원문 표시(lang=en)
      + (원.창 ? '<blockquote class="three-src" lang="en">' + esc(원.창.글) + '</blockquote><p class="three-ref" lang="en">' + esc(원.창.줄) + '</p>' : '') + '</section>';
    if (r.점) {
      const z = r.점, 자 = z.자미, 사 = z.사주;
      // 자미두수 — 그달 斗君이 머무는 궁 · 그 궁의 斗君 줄 · 별
      h += '<section class="three-eye">' + (글('근거자미') ? '<h3>' + esc(글('근거자미')) + '</h3>' : '')
        + '<p class="three-han">' + esc(자.궁) + ' · ' + esc('음력 ' + 자.음력.연 + '년 ' + (자.음력.윤달 ? '윤' : '') + 자.음력.월 + '월')
        + (자.길.length ? ' · 吉 ' + esc(자.길.join(' ')) : '') + (자.흉.length ? ' · 凶 ' + esc(자.흉.join(' ')) : '') + '</p>'
        + (자.원문 ? '<blockquote class="three-src" lang="zh">' + esc(자.원문.글) + '</blockquote><p class="three-ref">《紫微斗數全書》 ' + esc(자.원문.줄) + '</p>' : '')
        + (원.두군 ? '<blockquote class="three-src" lang="zh">' + esc(원.두군.글) + '</blockquote><p class="three-ref">' + esc(원.두군.줄) + '</p>' : '')
        + (원.관사 ? '<blockquote class="three-src" lang="zh">' + esc(원.관사.글) + '</blockquote><p class="three-ref">' + esc(원.관사.줄) + '</p>' : '') + '</section>';
      // 사주 — 그달 월운이 체에 닿은 열쇠(합 · 충 · 형) · 닿은 기둥
      h += '<section class="three-eye">' + (글('근거사주') ? '<h3>' + esc(글('근거사주')) + '</h3>' : '')
        + '<p class="three-han">월운 ' + esc(사.월운) + ' · 세운 ' + esc(사.세운) + (사.대운 ? ' · 대운 ' + esc(사.대운) : '') + ' · ' + esc(때말(사.사주달.시작, 사.사주달.끝)) + '</p>'
        + '<ul class="three-keys">' + 사.열쇠.map(k => '<li>' + esc([k.글자, k.방식, k.닿은.map(d => d.기둥 + ' ' + d.글자).join(' · '), k.무리].join(' · ')) + '</li>').join('') + '</ul></section>';   // 엔진 이름표만(오는 글자 · 방식 · 닿은 기둥 · 무리)
    }
    // 24달 표 — 달마다 카드 자리를 자미 · 사주가 가리켰나(셋이 한 줄에 서면 점)
    const 이름 = k => 글('줄이름.' + k);
    h += '<section class="three-eye">' + (글('근거줄') ? '<h3>' + esc(글('근거줄')) + '</h3>' : '')
      + '<div class="three-grid-wrap"><table class="three-grid"><thead><tr><th></th><th>' + esc(이름('카드')) + '</th><th>' + esc(이름('자미')) + '</th><th>' + esc(이름('사주')) + '</th></tr></thead><tbody>'
      + r.줄.map(x => { const 카 = c.자리.length > 0;
        // 카드가 자리를 여럿 가리키면 자미 · 사주 칸에 그 자리 이름을 적는다 — 둘이 다른 자리를 가리킨 달이 ●●● 로 보여 「셋이 모였다」로 읽히지 않게(10-30 Codex 지적).
        const 칸 = (a) => a.length ? (c.자리.length > 1 ? '<td class="is-names">' + esc(a.join(', ')) + '</td>' : '<td>●</td>') : '<td>·</td>';
        // is-meet = 셋이 같은 자리에 모였지만 고르지 않은 달(방향이 다르거나 더 먼 달)
        return '<tr' + (x.점 ? ' class="is-point"' : x.카드자리와.셋.length ? ' class="is-meet"' : '') + '><th scope="row">' + esc(달말(x.달)) + '</th><td>' + (카 ? '●' : '·') + '</td>' + 칸(x.카드자리와.자미) + 칸(x.카드자리와.사주) + '</tr>'; }).join('')
      + '</tbody></table></div></section>';
    if (r.우연 && 글('우연말', { 점몫: r.우연.점몫, 남남몫: r.우연.남남몫, 사람: Number(r.우연.사람).toLocaleString('ko-KR') }))
      h += '<p class="three-chance">' + esc(글('우연말', { 점몫: r.우연.점몫, 남남몫: r.우연.남남몫, 사람: Number(r.우연.사람).toLocaleString('ko-KR') })) + '</p>';
    return h + '</details>';
  }
  function 기록칸(r, 글, 답) {
    const z = r.점, 물음 = 글('기록물음', { 때: 때말(z.때.시작, z.때.끝), 자리: 글('자리말.' + z.자리) });
    if (답) return 글('기록고마움') ? '<div class="three-record"><p>' + esc(글('기록고마움')) + '</p></div>' : '';
    if (!물음) return '';
    return '<div class="three-record"><p>' + esc(물음) + '</p><div class="three-record-btns">'
      + ['비슷', '다름', '없음'].map(k => '<button type="button" class="btn ghost small" data-three-note="' + k + '">' + esc(글('기록답.' + k) || k) + '</button>').join('') + '</div></div>';
  }

  // ── 10-31 세 점의 길흉(사장님 「3점의 길흉을 보자는 거야」 — 결정함 64 ~ 69) ──
  // 물음 하나를 고르고 카드 한 장 → 같은 /api/three-eyes 에 물음을 실어 부른다(비공개 lib/three-points.js): 타로 점(이번 달 · 결정함 82) · 사주 점(달) · 자미 점(달), 점마다 길흉.
  // 셋을 하나로 합치지 않는다 — 나란히 + 길 몇 · 흉 몇(결정함 68). 물음마다 한 장 · 같은 달 다시 뽑기 없음 · 다음 달 1일 새 카드(결정함 69).
  // 글은 three-pieces.js 「세점」(Codex · COPY-0025). 물음 이름이 아직 비었으면 옛 판(한 점)을 그린다 — 주소 끝 ?keys 면 이 뼈대를 보인다.
  // 꼴(일반인 틀 「물음 → 답 → 왜 → 할 일」): 물음 고르기 → 카드 → 세 점(때 · 길흉 · 무엇이 일어나나) + 길 몇 · 흉 몇 → 근거 접힘(점마다 왜 그 달 · 원문 · 24달 표) → 할 일.
  // 저장: 이 기기 localStorage 「chaeksa.three.v2.<사람 열쇠>」 = { _마지막: 물음, <물음>: { 달, 카드, 응답 } }.
  const 물음차례 = ['money', 'work', 'love', 'child', 'parent', 'people', 'move', 'home', 'body', 'mind'];
  const 점차례 = ['타로', '사주', '자미'];
  const 옛줄이름 = { 타로: '카드', 사주: '사주', 자미: '자미' };
  const 세점켜짐 = (P, 보기) => 보기 || !!(P.세점 && P.세점.물음말 && 물음차례.some(k => P.세점.물음말[k]));
  const 저장열쇠3 = b => 'chaeksa.three.v2.' + 해시([b.year, b.month, b.day, b.hour, b.minute || 0, b.gender, b.place || '', b.longitude == null ? '' : b.longitude].join('|'));
  const 점이름of = (글, k) => 글('세점.점이름.' + k) || 글('줄이름.' + 옛줄이름[k]);
  // 대길 · 대흉(11-01 결정함 95 · 엔진 v0.7) — 이름표는 등급(세점.길흉말.대길 · 대흉) · 색은 길흉(data-gh) 그대로 · 대이면 data-dae(three.css 테두리 칸).
  //   v0.7 전에 이 기기에 저장된 판은 등급이 없어 길흉 그대로 보인다(규칙을 화면에 베끼지 않는다 — 엔진이 정한 값만).
  const 등급말 = (글, x) => (x && x.등급 && 글('세점.길흉말.' + x.등급)) || 글('세점.길흉말.' + (x && x.길흉));
  const 대속 = x => (x && /^대/.test(x.등급 || '')) ? ' data-dae="' + esc(x.등급) + '"' : '';
  const 갈래of = (r, k) => (k === '사주' && r.점.사주.정함 === '문없음') ? '문없음' : r.점[k].길흉;   // 일어남 · 할일 칸의 끝 열쇠
  function 점때(r, k, 글) {
    const z = r.점[k];
    if (k === '타로') { const t = 타로달of(r), 달 = 달말(t.달); return 글('세점.때.타로달', { 달, 때: 때말(t.시작, t.끝) }) || 달; }   // 이번 달(결정함 82) — 옛 칸 「세점.때.타로」(두 해)는 읽지 않는다
    if (!z.달) return '';
    const 때 = 때말(z.때.시작, z.때.끝);
    // 자미 「그해」 = 斗君을 세는 음력 해(《全書》 卷二 1317 「斗君，正月初一日管事」) — 양력 달 이름과 해가 갈릴 수 있어 음력 값도 넘긴다(10-31 대조 · COPY-0025).
    const 음 = k === '자미' && z.음력 ? { 음력: '음력 ' + z.음력.연 + '년 ' + (z.음력.윤달 ? '윤' : '') + z.음력.월 + '월', 음력해: '음력 ' + z.음력.연 + '년' } : {};
    return 글('세점.때.' + k, Object.assign({ 달: 달말(z.달), 때 }, 음)) || 때;
  }
  function 세점결론칸(r, 글) {
    const 물음 = 글('세점.물음말.' + r.물음);
    const 줄 = 점차례.map(k => {
      const z = r.점[k], 갈래 = 갈래of(r, k), 길흉 = 갈래 === '문없음' ? 글('세점.사주없음') : 등급말(글, z), 일 = 글('세점.일어남.' + r.물음 + '.' + k + '.' + 갈래);
      return '<li class="three-pt" data-gh="' + esc(z.길흉) + '"' + 대속(z) + '><div class="three-pt-head"><span class="three-pt-name">' + esc(점이름of(글, k)) + '</span>'
        + '<span class="three-pt-when">' + esc(점때(r, k, 글)) + '</span>' + (길흉 ? '<b class="three-pt-gh">' + esc(길흉) + '</b>' : '') + '</div>'
        + (일 ? '<p class="three-pt-what">' + esc(일) + '</p>' : '') + '</li>';
    }).join('');
    const 셈 = 글('세점.셈', { 길: r.셈.길, 흉: r.셈.흉 }), 같은 = r.같은달 ? 글('세점.같은달', { 달: 달말(r.점.사주.달) }) : '';
    return '<div class="jt-answer three-answer">' + (글('세점.결론머리', { 물음 }) ? '<p class="three-kicker">' + esc(글('세점.결론머리', { 물음 })) + '</p>' : '')
      + '<ul class="three-pts">' + 줄 + '</ul>' + (셈 ? '<p class="three-tally">' + esc(셈) + '</p>' : '') + (같은 ? '<p class="three-same">' + esc(같은) + '</p>' : '') + '</div>';
  }
  function 세점근거칸(r, 글, 펼침임) {   // 펼침임 — 켈틱 펼침 결과(판 · 열 장 풀이는 바로 위 열장칸 · 결정함 84). 한 장 응답 · 꺼짐이면 false(글자 하나 다르지 않게)
    const c = r.카드, 원 = r.원문 || {}, 타 = r.점.타로, 사 = r.점.사주, 자 = r.점.자미, 왜 = 키 => 글(키) ? '<p class="three-why2">' + esc(글(키)) + '</p>' : '';
    let h = '<details class="jt-ev three-basis"><summary>' + esc(글('근거')) + '</summary>';
    // 타로 — 붙인 웨이트 낱말(그 물음을 직접 말할 때) · 카드 원문(펼침이면 길흉을 정한 열째) · 창 원문(901줄 — 한 장 응답만)
    //   켈틱 펼침엔 901줄을 싣지 않는다 — §8(마흔두 장 · 정한 물음이 없을 때의 법) 줄이라 §7 판의 원문 근거가 아니다(결정함 77 「근거에서 걷는다」 · 10-31 배포 뒤 뜻 대조). 한 장 응답은 글자 그대로.
    h += '<section class="three-eye"><h3>' + esc(점이름of(글, '타로')) + '</h3>' + 왜('세점.왜.타로달.' + (타.직접 ? '직접' : '전체'))
      + (타.붙임.length ? '<ul class="three-keys" lang="en">' + 타.붙임.map(x => '<li lang="en">' + esc(x.낱말) + ' <small>(Part III ' + esc(x.줄) + (x.절 ? ' ' + esc(x.절) : '') + ')</small></li>').join('') + '</ul>' : '')
      + '<blockquote class="three-src" lang="en">' + esc(c.원문) + '</blockquote>'
      + '<p class="three-ref" lang="en">Waite, The Pictorial Key to the Tarot · Part III ' + esc(c.줄) + (c.절 === '§4' ? ' §4' : '') + ' · ' + esc(c.이름en) + '</p>'
      + (원.창 && !펼침임 ? '<blockquote class="three-src" lang="en">' + esc(원.창.글) + '</blockquote><p class="three-ref" lang="en">' + esc(원.창.줄) + '</p>' : '') + '</section>';
    // 사주 — 그달 문을 연 열쇠(엔진 이름표) · 판정 층과 범주(법전 40 · 57조 이름)
    h += '<section class="three-eye"><h3>' + esc(점이름of(글, '사주')) + '</h3>' + 왜('세점.왜.사주.' + 사.정함);
    if (사.달) {
      h += '<p class="three-han">월운 ' + esc(사.월운) + ' · 세운 ' + esc(사.세운) + (사.대운 ? ' · 대운 ' + esc(사.대운) : '') + ' · ' + esc(때말(사.때.시작, 사.때.끝)) + '</p>'
        + (사.열쇠.length ? '<ul class="three-keys">' + 사.열쇠.map(k => '<li>' + esc([k.글자, k.방식, k.닿은.map(d => d.기둥 + ' ' + d.글자).join(' · '), k.무리].join(' · ')) + '</li>').join('') + '</ul>' : '')
        + (사.천간 ? '<ul class="three-keys"><li>' + esc([사.천간.글자, 사.천간.십신, 사.천간.무리].filter(Boolean).join(' · ')) + '</li></ul>' : '')
        + (사.판정 && 사.판정.범주 ? '<p class="three-han">' + esc(사.판정.층.map(x => x.이름 + ' ' + x.간지).join(' · ') + ' — ' + 사.판정.범주 + (사.판정.격 ? ' · ' + 사.판정.격 : '')) + '</p>' : '');
    }
    h += '</section>';
    // 자미 — 그달 斗君이 든 궁 · 별 · 그 궁의 斗君 줄 · 斗君 놓는 법
    h += '<section class="three-eye"><h3>' + esc(점이름of(글, '자미')) + '</h3>' + 왜('세점.왜.자미.' + 자.정함);
    if (자.달) {
      h += '<p class="three-han">' + esc(자.궁) + ' · ' + esc('음력 ' + 자.음력.연 + '년 ' + (자.음력.윤달 ? '윤' : '') + 자.음력.월 + '월') + ' · ' + esc(때말(자.때.시작, 자.때.끝))
        + (자.길.length ? ' · 吉 ' + esc(자.길.join(' ')) : '') + (자.흉.length ? ' · 凶 ' + esc(자.흉.join(' ')) : '') + '</p>'
        + (자.원문 ? '<blockquote class="three-src" lang="zh">' + esc(자.원문.글) + '</blockquote><p class="three-ref">《紫微斗數全書》 ' + esc(자.원문.줄) + '</p>' : '')
        + (원.두군 ? '<blockquote class="three-src" lang="zh">' + esc(원.두군.글) + '</blockquote><p class="three-ref">' + esc(원.두군.줄) + '</p>' : '');
    }
    h += '</section>';
    // 24달 표 — 달마다 사주 문이 열렸나(그달 판정) · 그 물음의 궁에 斗君이 들었나(그달 길흉). 고른 달은 진하게.
    const 칸 = (열림, v) => 열림 ? '<td data-gh="' + esc(v || '') + '">' + esc(글('세점.길흉말.' + v) || '●') + '</td>' : '<td>·</td>';
    h += '<section class="three-eye">' + (글('근거줄') ? '<h3>' + esc(글('근거줄')) + '</h3>' : '')
      + '<div class="three-grid-wrap"><table class="three-grid"><thead><tr><th></th><th>' + esc(점이름of(글, '사주')) + '</th><th>' + esc(점이름of(글, '자미')) + '</th></tr></thead><tbody>'
      + r.줄.map(x => '<tr' + (x.달 === 사.달 || x.달 === 자.달 ? ' class="is-point"' : '') + '><th scope="row">' + esc(달말(x.달)) + '</th>' + 칸(x.사주문, x.사주판) + 칸(x.자미궁, x.자미) + '</tr>').join('')
      + '</tbody></table></div></section>';
    return h + '</details>';
  }
  function 세점할일칸(r, 글) {
    const 줄 = 점차례.map(k => { const t = 글('세점.할일.' + r.물음 + '.' + k + '.' + 갈래of(r, k)); return t ? '<li><b>' + esc(점이름of(글, k)) + '</b> ' + esc(t) + '</li>' : ''; }).filter(Boolean);
    if (!줄.length) return '';
    return '<div class="three-do">' + (글('세점.할일머리') ? '<p class="three-kicker">' + esc(글('세점.할일머리')) + '</p>' : '') + '<ul>' + 줄.join('') + '</ul></div>';
  }

  // ── 10-31 켈틱 펼침(사장님 「타로카드 보는법 정석대로 ㄱㄱ」 — 웨이트 Part III §7 「An Ancient Celtic Method of Divination」 669 ~ 739) ──
  // 물음마다: 나 카드(Significator 671 · 673)를 앞면으로 → 섞기 · 세 번 떼기(677 — 손님 화면의 의식. 실제 섞음은 서버 crypto, 방향표가 비공개라 서버가 나눈다)
  //   → 서버가 나를 뺀 77장에서 열 자리(679 ~ 703)를 놓고 타로 점의 길흉 = 열째(703 「the final result」 · 705). 1 ~ 9째는 자리마다 보여 주기만(길흉 합산에 넣지 않음).
  //   열째가 그 물음에 흔들림이면 열째를 새 나로 다시 섞어 한 번 더(706 · 한 번까지 — 메인 추론). 마지막 열째가 궁정 카드면 「그 사람 손에」(708 — 알림만.
  //   671을 거꾸로 써서 그 사람을 나이 · 성별로 풀지 않는다).
  // 몸에 「펼침: true」(카드 없음) → 응답.펼침 = { 판, 나, 자리[10], 다시, 끝, 궁정끝 } · 응답.카드 = 길흉을 정한 열째. 저장 판3[물음] = { 달, 펼침: true, 응답 }(받은 뒤에만 · 받자마자).
  // 화면 차례(10-31 메인 D2 · D3):
  //   의식(나 카드 · 섞기 · 떼기 셋) → 부름 → 펼친 순간(저장 안 함 — 판이 차례로 놓임 → 끝말 + 결과보기. 다시 펼침이면 다시말 + 섞기 → 새 나로 떼기 셋 → 둘째 판 → 끝말 + 결과보기)
  //   → 결과(10-23 블록 꼴 「물음 → 결론 → 근거 접힘, 끝에 할 일」): 카드칸(길흉을 정한 열째) · 궁정말 → 세 점 결론 → 근거 접힘(타로 칸 맨 앞에 판 · 자리 목록 · 다시 판 · 끝말) → 할 일.
  //   저장된 펼침을 다시 열면(새로 고침 · 다른 물음 갔다 옴 · 다음 방문) 펼친 순간 없이 결과. opt.펼침 === true(화면 검사기 · 시험)는 의식 · 펼친 순간 없이 결과.
  // 켜짐 문(D4): 펼침필수 칸이 모두 빈칸 아닌 글이어야(또는 ?keys) — 하나라도 비면 한 장 판 그대로(라이브가 반쯤 빈 펼침을 보이지 않게 · 꺼짐 길은 한 글자도 다르게 그리지 않는다).
  //   고를 칸(기다림 · 판머리 · 다시보기)은 비면 그 줄만 건너뛴다.
  const 자리수 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const 펼침필수 = Object.freeze(['나.Page', '나.Knight', '나.Queen', '나.King', '섞기', '떼기', '결과보기']
    .concat(자리수.map(n => '자리.' + n), 자리수.map(n => '자리뜻.' + n), ['끝말', '다시말', '궁정말', '끝카드']).map(k => '세점.펼침.' + k));   // 시험 · 화면 검사기도 쓴다(ChaeksaThreeView.펼침필수)
  const 펼침켜짐 = (P, 보기) => 보기 || 펼침필수.every(키 => { let v = P; for (const k of 키.split('.')) v = v && typeof v === 'object' ? v[k] : undefined; return typeof v === 'string' && !!v; });
  // 나 카드(671 · 673) — 펜타클 궁정. 671 글자: 「A Knight should be chosen … if the subject of inquiry is a man of forty years old and upward; a King … for any male
  //   who is under that age; a Queen for a woman who is over forty years; and a Page for any female of less age」.
  //   남녀 모두 만 40세부터 윗계급(10-31 메인 추론 D1): 남 만 40 이상 Knight(P12) · 40 미만 King(P14) · 여 만 40 이상 Queen(P13) · 40 미만 Page(P11).
  //   까닭 — 마흔 해를 넘긴(만 40세 몇 달) 여자는 「over forty years」이고 「less age」(마흔보다 어림)가 아니다. 앞 판의 「여 만 41 이상」은 나이를 정수로 잘못 읽은 것이라 고쳤다.
  //   무늬 펜타클 = 673(아주 짙은 갈색 · 검은 머리 · 짙은 눈)을 손님에게 적용한 메인 추론. 만 나이 = 서울 오늘 기준(생일 지났나까지).
  //   의식 전에 보이려고 화면이 센다(양력 생년월일 — people.js toProfile 의 year · month · day 는 양력) — 결과는 서버가 센 나를 쓴다(서버 lib/three-points.js 나카드of 와 같은 셈).
  const 나카드 = { King: 'P14', Knight: 'P12', Queen: 'P13', Page: 'P11' };
  const 궁정en = { P11: 'Page of Pentacles', P12: 'Knight of Pentacles', P13: 'Queen of Pentacles', P14: 'King of Pentacles' };   // 웨이트 카드 이름(원문 영어 값)
  // 나 카드 이름(D7) — P.카드이름[id] 가 비면 서버 카드 표(lib/three-eyes-cards.json) 이름 그대로(값 — 결과 카드칸이 서버에서 받아 찍는 이름과 같은 글자)
  const 궁정이름 = { P11: '펜타클 페이지(시종)', P12: '펜타클 나이트(기사)', P13: '펜타클 퀸(여왕)', P14: '펜타클 킹(왕)' };
  function 서울날of(d) {
    try {
      const v = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d).forEach(p => { if (p.type === 'year' || p.type === 'month' || p.type === 'day') v[p.type] = +p.value; });
      if (v.year > 0 && v.month > 0 && v.day > 0) return { y: v.year, m: v.month, d: v.day };
    } catch (e) {}
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
  }
  function 시그of(b, 오늘) {
    const y = +(b && b.year), m = +(b && b.month), d = +(b && b.day);
    if (!(y > 0 && m > 0 && d > 0) || !오늘) return null;
    const 나이 = 오늘.y - y - (오늘.m < m || (오늘.m === m && 오늘.d < d) ? 1 : 0);
    const 계급 = b.gender === 'F' ? (나이 >= 40 ? 'Queen' : 'Page') : (나이 >= 40 ? 'Knight' : 'King'), id = 나카드[계급];
    return { id, 계급, 이름: 궁정이름[id], 이름en: 궁정en[id] };
  }
  const 카드이름of = (x, P) => (x && P.카드이름 && P.카드이름[x.id]) || (x && x.이름) || '';
  const 장of = (자리, n) => (Array.isArray(자리) ? 자리 : []).find((x, i) => x && (+x.n || i + 1) === n);
  const 다시됨 = f => !!(f.다시 && Array.isArray(f.다시.자리) && f.끝 && +f.끝.펼침 === 2);   // 둘째 펼침의 열째가 길흉을 정했나
  const 끝장of = r => (다시됨(r.펼침) ? 장of(r.펼침.다시.자리, 10) : 장of(r.펼침.자리, 10)) || r.카드;   // 길흉을 정한 열째
  // 끝말(703 · 705 · D5) — {카드} = 길흉을 정한 열째 · {놓임} = 놓임말 · {길흉} = 세점.길흉말(= 타로 점의 길흉)
  //   {길흉} 은 등급말(대길 · 대흉 — 결정함 95) · 대이면 끝에 대말 한 줄(Codex 칸 「세점.펼침.대말.대길 | 대흉」 · {카드} · 비면 건너뜀).
  function 끝말of(r, 글, P) {
    const f = r.펼침, 끝장 = 끝장of(r), 끝 = (f.끝 && f.끝.길흉) ? f.끝 : ((r.점 && r.점.타로) || {});
    const 말 = 글('세점.펼침.끝말', { 카드: 카드이름of(끝장, P), 놓임: 글('놓임말.' + (끝장 && 끝장.놓임)), 길흉: 등급말(글, 끝) });
    const 대 = /^대/.test(끝.등급 || '') ? 글('세점.펼침.대말.' + 끝.등급, { 카드: 카드이름of(끝장, P) }) : '';
    return 말 && 대 ? 말 + ' ' + 대 : 말;
  }
  // 다시말(706 · D5) — {카드} = 첫 판 열째(애매해서 새 나가 된 카드) 하나뿐. 둘째 판 열째는 넘기지 않는다(펼친 순간에 둘째 판 결과를 미리 말하지 않게).
  const 다시말of = (r, 글, P) => 글('세점.펼침.다시말', { 카드: 카드이름of(장of(r.펼침.자리, 10), P) });
  const 움직임줄임 = () => { try { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  // 펼침 그림 — 웨이트 712 그림 꼴: 가운데 나 · 1 덮음(679) · 2 가로질러(681 · 90도) · 3 위(683) · 4 아래(685)
  //   · 5 = 나 카드가 등진 쪽(687 「behind」) · 6 = 나 카드가 바라보는 쪽(691 「before」) · 십자 오른쪽 기둥 7 ~ 10(695 아래에서 위로). 칸 자리는 three.css 격자.
  //   기본은 712 그림(「The Significator is here facing to the left」) — 5 오른쪽 · 6 왼쪽. 나 카드 그림이 오른쪽을 보면 5 · 6 을 맞바꾼다(is-face-right).
  //   큰 카드 · 보는 쪽을 말할 수 없는 카드(정면 · 마주 봄 · 사람 없음)는 미리 정한 왼쪽(689 N.B.).
  //   카드마다 작은 그림(-s.webp) · 거꾸로는 그림만 180도(2는 90도 · 거꾸로면 270도) · 자리 번호. 읽을 글은 자리 목록 · 끝말이 맡는다(그림은 aria-hidden).
  //   움직임 — 펼친 순간에만 차례로 놓인다(is-anim · CSS animation-delay --i · 움직임 줄이기면 없음). 근거 안 판은 움직임 없음 · 그림은 접힘을 열 때 부른다(lazy).
  // 그림이 오른쪽을 보는 카드 — 덱 chaeksa-v1 작은 그림 56장을 둘이 따로 보고 갈린 다섯 장은 크게 봐서 정함(10-31). 덱 그림을 다시 그리면 이 표도 다시 본다.
  const 오른쪽보는 = new Set(['C08', 'C10', 'C11', 'C12', 'C13', 'P02', 'P08', 'P09', 'P11', 'P13', 'P14', 'S06', 'S07', 'S11', 'S13', 'W02', 'W03', 'W06', 'W07', 'W09', 'W10', 'W11', 'W12']);
  // 앞면 · 뒷면 작은 그림(판 칸). 늦게 — 근거 접힘 안 판(열 때 부름). 의식 · 고르기 · 뒤집기 판은 다시 그릴 때 깜박이지 않게 바로 그린다(decoding 기본).
  const 앞면img = (id, cls, 늦게) => 그림id.test(String(id)) ? '<img class="three-sp-img' + cls + '" src="' + 그림길 + id + '-s.webp?v=2" alt=""' + (늦게 ? ' loading="lazy" decoding="async"' : '') + '>' : '<span class="three-sp-img three-sp-none' + cls + '"></span>';
  const 뒷면img = cls => '<img class="three-sp-img three-sp-back' + cls + '" src="' + 그림길 + 'back-s.webp" alt="">';
  // 판 틀 — 가운데 나 + 열 칸. 칸(n) → { 안, cls }. 덧 = 판 class 덧붙임(is-anim · is-pick · is-flipping). 결과 · 근거 판 · 고르는 판 · 뒤집는 판이 같이 쓴다.
  function 판틀(나, 칸, 덧, 늦게) {
    const 한칸 = n => { const c = 칸(n) || {}; return '<div class="three-sp three-sp-' + n + (c.cls || '') + '" style="--i:' + n + '">' + (c.안 || '') + '<span class="three-sp-n">' + n + '</span></div>'; };
    return '<div class="three-sp-board' + (덧 || '') + (나 && 오른쪽보는.has(String(나.id)) ? ' is-face-right' : '') + '" aria-hidden="true"><div class="three-sp-mid"><div class="three-sp three-sp-sig" style="--i:0">' + 앞면img(나 && 나.id, '', 늦게) + '</div>'
      + 한칸(1) + 한칸(2) + '</div>' + 자리수.slice(2).map(한칸).join('') + '</div>';
  }
  function 판그림(나, 자리, 끝n, 움직임) {
    return '<div class="three-sp-wrap">' + 판틀(나, n => { const x = 장of(자리, n);
      return { cls: n === 끝n ? ' is-end' : '', 안: 앞면img(x && x.id, (n === 2 ? ' is-cross' : '') + (x && x.놓임 === '거꾸로' ? ' is-rev' : ''), !움직임) }; }, 움직임 ? ' is-anim' : '', !움직임) + '</div>';
  }
  // 고르는 판(결정함 83) — 고른 만큼 칸에 뒷면이 놓인다(고른 차례 = 자리 1 ~ 10). 다음 칸은 빈 틀이 깜박이고, 막 놓인 칸은 아래(부채꼴)에서 날아든다(is-arrive).
  function 고르는판(나, 수, 움직임) {
    return '<div class="three-sp-wrap">' + 판틀(나, n => n <= 수
      ? { cls: n === 수 && 움직임 === 'pick' ? ' is-arrive' : '', 안: 뒷면img(n === 2 ? ' is-cross' : '') }
      : { cls: ' is-empty' + (n === 수 + 1 ? ' is-next' : ''), 안: '<span class="three-sp-img three-sp-slot' + (n === 2 ? ' is-cross' : '') + '"></span>' }, ' is-pick') + '</div>';
  }
  // 뒤집는 판 — 연 장까지 앞면(막 뒤집은 칸은 뒷면이 접히고 앞면이 펴짐 · is-flip) · 나머지는 뒷면 · 다음 장이 깜박인다(is-next).
  //   판 어디를 눌러도 다음 장이 뒤집힌다(data-three-flipboard — 단추가 같은 일 · 판은 aria-hidden). 움직임 deal — 다시 펼침 판이 차례로 놓인다(is-anim).
  function 뒤집는판(나, 자리, 연, 움직임, 끝n) {
    const 판 = 판틀(나, n => {
      const x = 장of(자리, n), 가 = n === 2 ? ' is-cross' : '';
      if (n > 연) return { cls: n === 연 + 1 ? ' is-next' : '', 안: 뒷면img(가) };
      const 앞 = 앞면img(x && x.id, 가 + (x && x.놓임 === '거꾸로' ? ' is-rev' : '')), 막 = n === 연 && 움직임 === 'flip';
      return { cls: (n === 끝n ? ' is-end' : '') + (막 ? ' is-flip' : ''), 안: 막 ? '<span class="three-sp-face">' + 앞 + '</span><span class="three-sp-backface">' + 뒷면img(가) + '</span>' : 앞 };
    }, ' is-flipping' + (움직임 === 'deal' ? ' is-anim' : ''));
    return '<div class="three-sp-wrap"' + (연 < 10 ? ' data-three-flipboard' : '') + '>' + 판 + '</div>';
  }
  // 부채꼴(결정함 83) — 섞고 뗀 77장(나 카드를 뺀 덱)을 뒤집힌 채 -50 ~ 50도로 펼친다. 어느 장을 눌러도 된다(카드는 서버가 섞은 덱의 그 자리 · 확률은 맨 위 열 장과 같음).
  //   고른 장은 빠지고 그 자리가 빈다. 크기는 three.css(--fw 카드 폭 · --fr 돌림 반지름). 글은 단추 이름(카드읽기 {n})뿐.
  function 부채(고름, 글, 움직임) {
    const 집 = new Set(고름 || []);
    let h = '<div class="three-fan' + (움직임 === 'spread' ? ' is-spread' : '') + '" data-three-fan>';
    for (let i = 0; i < 77; i++) {
      if (집.has(i)) continue;
      h += '<button type="button" class="three-fan-card" data-three-pick="' + i + '" style="--a:' + (-50 + 100 * i / 76).toFixed(2) + ';--k:' + i + '" aria-label="' + esc(글('카드읽기', { n: i + 1 }) || String(i + 1)) + '"></button>';
    }
    return h + '</div>';
  }
  // 장 풀이 줄(결정함 84) — 카드뜻(그 카드 그 놓임) → 영향(자리 n × 그 장 길흉 · {카드} {물음} {놓임} · 1 ~ 9째만 — 87) → 왜(엔진 왜 — 직접 · 전체 · 엇갈림 · {물음}) → 원문 낱말 줄.
  //   글 칸은 Codex · 비면 그 줄만 건너뛴다. 원문 낱말 줄은 웨이트 영어 그대로(값) — 직접: 그 물음을 말한 낱말(붙임) · 전체: 카드 본뜻 낱말(뜻말) · 엇갈림: 둘 다(덧뜻 §4 낱말 + 본뜻 낱말).
  //   같은 줄 · 같은 절 낱말은 한 묶음(“…” · “…” (Part III 줄 [§4])). 옛 응답(v0.5 — 왜 · 뜻말 없음)은 직접이면 붙임만 · 아니면 줄 없음.
  const 낱말묶음 = 낱 => {
    const 무리 = [];
    낱.forEach(w => { const k = w.줄 + '|' + (w.절 || ''); let g = 무리.find(m => m.k === k); if (!g) 무리.push(g = { k, 줄: w.줄, 절: w.절, 말: [] }); if (w.말 && !g.말.includes(w.말)) g.말.push(w.말); });
    return 무리.filter(g => g.말.length).map(g => g.말.map(m => '“' + esc(m) + '”').join(' · ') + ' <small>(Part III ' + esc(g.줄) + (g.절 === '§4' ? ' §4' : '') + ')</small>').join(' · ');
  };
  function 풀이줄(x, n, 글, 물음, 카이름, 놓, 앞, 맥) {
    const 왜k = x.왜 || (x.직접 ? '직접' : '전체');
    const 카뜻 = (맥 && 맥.뜻(x)) || 글('세점.펼침.카드뜻.' + x.id + '.' + x.놓임);   // 그 물음 156면이 다 찼으면 물음카드뜻(결정함 90)
    const 영 = n === 10 ? '' : 글('세점.펼침.영향.' + n + '.' + x.길흉, { 카드: 카이름, 물음, 놓임: 놓 });   // 10째 = 자리뜻.10 · 끝말(다시말)이 말함(87)
    const 왜 = 글('세점.펼침.왜.' + 왜k, { 물음 });
    const 붙 = (x.붙임 || []).map(b => ({ 말: b.낱말, 줄: b.줄, 절: b.절 })), 본 = (x.뜻말 || []).map(m => ({ 말: m, 줄: x.줄, 절: x.절 }));
    const 원 = 낱말묶음(왜k === '직접' ? (붙.length ? 붙 : 본) : 왜k === '엇갈림' ? 붙.concat(본) : 본);
    return (카뜻 ? '<p class="' + 앞 + '-line">' + esc(카뜻) + '</p>' : '') + (영 ? '<p class="' + 앞 + '-eff">' + esc(영) + '</p>' : '')
      + (왜 ? '<p class="' + 앞 + '-why">' + esc(왜) + '</p>' : '') + (원 ? '<p class="' + 앞 + '-src" lang="en">' + 원 + '</p>' : '');
  }
  // 읽기 칸 — 막 뒤집은 장. 위: 그림 + 자리 번호 · 자리 이름 · 자리뜻 · 카드 이름 · 놓임 · 그 물음 길흉 / 아래: 장 풀이 줄(결정함 84). 색 띠는 길흉(three.css data-gh).
  function 읽기칸(x, n, 글, P, 끝, 새, 물음, 맥) {
    if (!x) return '';
    const 이름 = 글('세점.펼침.자리.' + n), 뜻 = 글('세점.펼침.자리뜻.' + n), gh = 등급말(글, x), 놓 = 글('놓임말.' + x.놓임), 카이름 = 카드이름of(x, P);
    const 그림 = 그림id.test(String(x.id)) ? '<div class="three-read-art"><img class="three-read-img' + (x.놓임 === '거꾸로' ? ' is-rev' : '') + '" src="' + 그림길 + x.id + '-s.webp?v=2" alt=""></div>' : '';
    const 풀이 = 풀이줄(x, n, 글, 물음, 카이름, 놓, 'three-read', 맥);
    return '<div class="three-read' + (끝 ? ' is-end' : '') + (새 ? ' is-in' : '') + '" data-gh="' + esc(x.길흉 || '') + '"' + 대속(x) + ' aria-live="polite"><div class="three-read-top">' + 그림
      + '<div class="three-read-txt"><p class="three-read-pos"><span class="three-sp-no" aria-hidden="true">' + n + '</span>' + (이름 ? '<b>' + esc(이름) + '</b>' : '') + '</p>'
      + (뜻 ? '<p class="three-read-mean">' + esc(뜻) + '</p>' : '')
      + '<p class="three-read-card"><b>' + esc(카이름) + '</b>' + (x.이름en ? ' <small lang="en">' + esc(x.이름en) + '</small>' : '') + (놓 ? ' <span class="three-sp-or">' + esc(놓) + '</span>' : '') + '</p>'
      + (gh ? '<p class="three-read-gh">' + esc(gh) + '</p>' : '') + '</div></div>'
      + (풀이 ? '<div class="three-read-body">' + 풀이 + '</div>' : '') + '</div>';
  }
  // 뒤집을 앞면을 미리 부른다(뒤집을 때 바로 보이게) — 브라우저에서만 · 실패는 조용히
  function 미리그림(f) {
    try {
      if (typeof global.Image !== 'function' || !f) return;
      [].concat(f.자리 || [], (f.다시 && f.다시.자리) || [], f.다시 ? [f.다시.나] : []).forEach(x => { if (x && 그림id.test(String(x.id))) { const im = new global.Image(); im.src = 그림길 + x.id + '-s.webp?v=2'; } });
    } catch (e) {}
  }
  // 손끝 떨림(고르기 · 뒤집기) — 움직임 줄이기면 없음 · 못 하는 기기는 조용히
  const 떨림 = p => { try { if (!움직임줄임() && global.navigator && typeof global.navigator.vibrate === 'function') global.navigator.vibrate(p); } catch (e) {} };
  // 자리 목록 — 자리마다 이름 · 그 물음 길흉말 → 자리뜻 → 카드 이름 · 놓임 → 장 풀이 줄(결정함 84). 1 ~ 9째 길흉은 보여 주기만(셈은 열째 하나 · 73).
  function 자리목록(자리, 글, P, 끝n, 물음, 맥) {
    return '<ol class="three-sp-list">' + 자리수.map(n => {
      const x = 장of(자리, n); if (!x) return '';
      const 이름 = 글('세점.펼침.자리.' + n), 뜻 = 글('세점.펼침.자리뜻.' + n), gh = 등급말(글, x), 놓 = 글('놓임말.' + x.놓임), 카이름 = 카드이름of(x, P);
      return '<li class="three-sp-row' + (n === 끝n ? ' is-end' : '') + '" data-gh="' + esc(x.길흉 || '') + '"' + 대속(x) + '><span class="three-sp-no" aria-hidden="true">' + n + '</span><div class="three-sp-txt">'
        + ((이름 || gh) ? '<p class="three-sp-pos">' + (이름 ? '<b>' + esc(이름) + '</b>' : '') + (이름 && gh ? ' ' : '') + (gh ? '<span class="three-sp-gh">' + esc(gh) + '</span>' : '') + '</p>' : '')
        + (뜻 ? '<p class="three-sp-mean">' + esc(뜻) + '</p>' : '')
        + '<p class="three-sp-card">' + esc(카이름) + (x.이름en ? ' <small lang="en">' + esc(x.이름en) + '</small>' : '') + (놓 ? ' <span class="three-sp-or">' + esc(놓) + '</span>' : '') + '</p>'
        + 풀이줄(x, n, 글, 물음, 카이름, 놓, 'three-sp', 맥) + '</div></li>';
    }).join('') + '</ol>';
  }
  // 열 장 이야기(결정함 85) — 웨이트 자리 줄의 때 차례로 판의 열 장을 엮는다. 줄 하나라도 비면 '' (반쯤 빈 이야기는 그리지 않는다).
  const 이야기차례 = Object.freeze([['지나온', [4, 5]], ['지금', [1, 2, 7, 8, 9]], ['앞으로', [6, 3]], ['끝', [10]]]);
  function 이야기칸(자리, 글, P, 물음, 맥) {
    const 막 = [];
    for (const [때, ns] of 이야기차례) {
      const 줄 = [];
      for (const n of ns) {
        const x = 장of(자리, n); if (!x) return '';
        const 말 = (맥 && 맥.말(x)) || 글('세점.펼침.카드말.' + x.id + '.' + x.놓임);   // 그 물음 156면이 다 찼으면 물음카드말(결정함 90)
        const t = 말 ? 글('세점.펼침.이야기.' + n + '.' + x.길흉, { 카드말: 말, 카드: 카드이름of(x, P), 물음, 놓임: 글('놓임말.' + x.놓임) }) : '';
        if (!t) return '';
        줄.push('<p class="three-story-beat" data-gh="' + esc(x.길흉 || '') + '"' + 대속(x) + '><span class="three-sp-no" aria-hidden="true">' + n + '</span><span class="three-story-txt">' + esc(t) + '</span></p>');
      }
      const 머 = 글('세점.펼침.이야기때.' + 때);
      막.push('<div class="three-story-act">' + (머 ? '<p class="three-story-when">' + esc(머) + '</p>' : '') + 줄.join('') + '</div>');
    }
    const 머리 = 글('세점.펼침.이야기머리', { 물음 });
    return '<div class="three-story">' + (머리 ? '<p class="three-story-head">' + esc(머리) + '</p>' : '') + 막.join('') + '</div>';
  }
  // 의식 꼴 — 처음 의식(나 = 화면이 센 나 · 나 글) · 다시 의식(나 = 첫 판 열째 · 글 없음 — D3 「새 나 카드 + 뒷면 더미 + 떼기 단추」)이 같은 꼴(three-rite). 나 카드는 늘 바로(앞면) · 뒷면 더미 셋.
  function 의식틀(위, 나, 나이름, 왜말, 움직임, 단추) {
    const 뒷 = [7.5, 6, 4.5, 3, 1.5, 0].map(o => '<img class="three-pile-img" src="' + 그림길 + 'back-s.webp" alt="" style="--o:' + o + '">').join('');   // 여섯 장 — 섞기는 둘로 갈라 엇갈려 모으고(riffle) · 떼기는 위 셋이 밑으로
    return '<div class="three-rite" data-three-rite>' + (위 || '') + '<div class="three-rite-row">'
      + (나 ? '<figure class="three-sig">' + (그림id.test(String(나.id)) ? '<img class="three-sig-img" src="' + 그림길 + 나.id + '-s.webp?v=2" alt="" decoding="async">' : '')
        + '<figcaption>' + (나이름 ? '<b>' + esc(나이름) + '</b>' + (나.이름en ? '<small lang="en">' + esc(나.이름en) + '</small>' : '') : '<b lang="en">' + esc(나.이름en || '') + '</b>') + '</figcaption></figure>' : '')
      + '<div class="three-pile' + (움직임 ? ' is-' + 움직임 : '') + '" data-three-pile aria-hidden="true">' + 뒷 + '</div></div>'
      + (왜말 ? '<p class="three-sig-why">' + esc(왜말) + '</p>' : '') + (단추 || '') + '</div>';
  }
  const 떼기단추of = (글, 속성, n) => '<button type="button" class="btn three-rite-btn" ' + 속성 + '>' + esc(글('세점.펼침.떼기', { n }) || n + ' / 3') + '</button>';
  // 펼친 순간(D3 — 저장 안 함) — 열째를 고른 뒤 받은 판. 결과(카드칸 · 세 점)는 결과보기를 누른 뒤에.
  //   첫판: 고른 열 장이 뒷면으로 놓인 판 → 한 장씩 뒤집기(1 → 10 · 단추 또는 판 누름 · 장마다 읽기 칸 — 결정함 83)
  //     → 열째까지 뒤집으면 다시가 아니면 끝말 + 결과보기 · 다시면 다시말({카드} = 첫 판 열째) + 섞기
  //   다시의식: 새 나(첫 판 열째 — 늘 바로 · 앞면) + 뒷면 더미 + 떼기 1 · 2 · 3(처음 의식과 같은 꼴 · 같은 글 조각) — 화면에서만(서버가 이미 둘째 판을 냈다 · 누름이 카드를 정하지 않는다)
  //     나 글 자리는 비운다 — 다시말은 바로 앞 첫판 화면에서 읽었다(D3 · COPY-0026 화면 차례 「나.* 글 없음」 · 다시말은 ② 첫판 · ③ 근거 두 곳)
  //   둘판: 책사가 놓은 열 장(차례로 놓임 · 고르지 않음 — 706) → 한 장씩 뒤집기 → 끝말 + 결과보기
  //   뒤집기 단추 글 = 세점.펼침.뒤집기({n} 다음 장 번호 · {자리} 그 자리 이름) · 비면 「n / 10」.
  function 펼친칸(r, 글, P, 순) {
    const f = r.펼침, 둘 = 다시됨(f), 단계 = 둘 ? 순.단계 : '첫판';
    if (단계 === '다시의식') return 의식틀('', f.다시.나, 카드이름of(f.다시.나, P), '', 순.움직임, 떼기단추of(글, 'data-three-again-cut', 순.뗀 + 1));
    const 둘판 = 단계 === '둘판', 나 = 둘판 ? f.다시.나 : f.나, 자리 = 둘판 ? f.다시.자리 : f.자리, 다시앞 = 둘 && !둘판, 끝n = 다시앞 ? 0 : 10;
    const 연 = Math.max(0, Math.min(10, +순.연 || 0)), 다음 = 연 + 1;
    let 발;
    if (연 < 10) {
      const 말 = 글('세점.펼침.뒤집기', { n: 다음, 자리: 글('세점.펼침.자리.' + 다음) });
      발 = '<div class="three-flip-foot"><button type="button" class="btn three-rite-btn" data-three-flip>' + esc(말 || 다음 + ' / 10') + '</button></div>';
    } else {
      const 줄 = 다시앞 ? 다시말of(r, 글, P) : 끝말of(r, 글, P);
      발 = '<div class="three-reveal-foot">' + (줄 ? '<p class="three-reveal-line">' + esc(줄) + '</p>' : '')
        + (다시앞 ? '<button type="button" class="btn three-rite-btn" data-three-again-shuffle>' + esc(글('세점.펼침.섞기') || '⇄') + '</button>'
          : '<button type="button" class="btn three-rite-btn" data-three-reveal-go>' + esc(글('세점.펼침.결과보기') || '↓') + '</button>') + '</div>';
    }
    const 물음 = 글('세점.물음말.' + r.물음), 법 = 연 === 0 && 단계 === '첫판' ? 글('세점.펼침.읽는법', { 물음 }) : '', 맥 = 물음맥of(r, P, 열쇠보기());   // 읽는법(결정함 84 · 87 · 88) — 첫 판 첫 장을 뒤집기 전에만 · 여기 하나(다시 펼친 둘째 판 앞엔 없음)
    return '<div class="three-reveal" data-three-reveal><div class="three-reveal-main">' + 뒤집는판(나, 자리, 연, 순.움직임, 끝n)
      + (연 > 0 ? 읽기칸(장of(자리, 연), 연, 글, P, 연 === 끝n, 순.움직임 === 'flip', 물음, 맥) : (법 ? '<p class="three-read-how">' + esc(법) + '</p>' : '')) + '</div>'
      + (연 === 10 ? 이야기칸(자리, 글, P, 물음, 맥) : '') + 발 + '</div>';   // 열 장 이야기(결정함 85) — 열째를 뒤집은 뒤 · 끝말 위
  }
  // 결과(D2) — 궁정 열째(708)면 카드칸 바로 아래 한 줄. 원문은 근거 타로 칸에 이미 찍히는 열째 원문(c.원문)과 같아 따로 찍지 않는다.
  function 궁정줄(r, 글, P) {
    if (!r.펼침.궁정끝) return '';
    const t = 글('세점.펼침.궁정말', { 카드: 카드이름of(끝장of(r), P) });
    return t ? '<p class="three-sp-court">' + esc(t) + '</p>' : '';
  }
  // 열 장 접힘(결정함 84 — 80 고침): 세 점 결론 바로 아래 · 근거 접힘 위. 머리 = 판머리({물음}) · 안: 첫 판 그림(움직임 없음) · [열 장 이야기(85)] · 첫 자리 목록(장 풀이 줄)
  //   · 읽는법은 없다(87 — 열 장이 다 앞면이라 「뒤집어 …」가 맞지 않음 · 펼친 순간 첫 장 전에만)
  //   · [다시: 다시말 · 다시보기 · 둘째 판 그림 · 둘째 자리 목록] · 끝말. 다시 판을 따로 접지 않는다. 열째 강조는 길흉을 정한 판에만. 판머리가 비면 머리는 자리 이름 1 ~ 10 차례(값).
  function 열장칸(r, 글, P) {
    const f = r.펼침, 둘 = 다시됨(f), 끝n = 둘 ? 0 : 10, 물음 = 글('세점.물음말.' + r.물음), 맥 = 물음맥of(r, P, 열쇠보기());
    const 머리 = 글('세점.펼침.판머리', { 물음 }) || 자리수.map(n => 글('세점.펼침.자리.' + n)).filter(Boolean).join(' · ');
    let h = '<details class="jt-ev three-cards"><summary>' + esc(머리) + '</summary><div class="three-spread">'
      + 판그림(f.나, f.자리, 끝n, false) + 이야기칸(f.자리, 글, P, 물음, 맥) + 자리목록(f.자리, 글, P, 끝n, 물음, 맥);
    if (둘) {
      const 다시말 = 다시말of(r, 글, P), 보기 = 글('세점.펼침.다시보기');
      h += (다시말 ? '<p class="three-sp-again">' + esc(다시말) + '</p>' : '') + (보기 ? '<p class="three-sp-head">' + esc(보기) + '</p>' : '')
        + 판그림(f.다시.나, f.다시.자리, 10, false) + 이야기칸(f.다시.자리, 글, P, 물음, 맥) + 자리목록(f.다시.자리, 글, P, 10, 물음, 맥);
    }
    const 끝말 = 끝말of(r, 글, P);
    return h + (끝말 ? '<p class="three-sp-endline">' + esc(끝말) + '</p>' : '') + '</div></details>';
  }

  function 세점mount(root, opt, P, 글) {
    const people = opt.people || global.ChaeksaPeople, clock = opt.clock || (() => new Date()), track = 'track' in opt ? opt.track : global.ChaeksaTrack;
    const 부름 = opt.부름 || (body => global.fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(res => res.json().then(j => ({ ok: res.ok, j }), () => ({ ok: false, j: { 코드: '계산' } }))));
    const 사건 = name => { try { if (track) track.event(name); } catch (e) {} };
    const 켜펼 = 펼침켜짐(P, 열쇠보기()), 순간켬 = opt.펼침 !== true;   // 10-31 켈틱 펼침 — 꺼져 있으면 아래는 한 장 판 그대로 · opt.펼침(화면 검사기 · 시험)이면 펼친 순간 없이 결과
    const 머리 = '<div class="jt-head"><h1 class="three-title">' + esc(글('세점.이름')) + '</h1></div>' + (글('세점.물음') ? '<p class="three-q">' + esc(글('세점.물음')) + '</p>' : '');
    const 판 = (안) => '<section class="card jt-ch three-card">' + 머리 + (안 || '') + '</section>';
    if (!people) { root.innerHTML = 판(); return; }
    let selected = '', 차례 = 0, 고른 = 물음차례.includes(opt.물음) ? opt.물음 : '';
    let 의식 = null, 포커스할 = '', 스크롤할 = null;   // 펼침 의식(섞기 · 떼기 — 이 화면에만, 저장 안 함) · 다시 그린 뒤 초점을 둘 단추 · 화면 안으로 부를 칸(D6 { sel, block })
    let 펼친 = null;   // 펼친 순간(D3 — 저장 안 함): { k: 사람|물음|달, 단계: '첫판' | '다시의식' | '둘판', 연(뒤집은 장 수), 뗀, 움직임 }. 물음 · 사람을 바꾸면 버린다.
    let 재고름 = null;   // 마지막으로 부른 고름 { k, 고름, 나 } — 못 받았을 때 새로 펼침 단추가 같은 열 장으로 다시 부른다
    // 화면 자리(10-31 사장님 「카드고르면 스크롤이 올라가네」 · 결정함 89) — 다시 그릴 때 그 칸이 화면 같은 높이에 남게 한다(눌린 부채 · 고른 열 장 판이 손끝 아래 그대로).
    //   열째를 고른 뒤 펼친 판은 고르던 판 자리 그대로 두고, 다 안 보일 때만(위 머리줄 · 아래 뒤집기 띠 · 네비에 가림) 가장 적게 움직인다 — 전엔 펼친 판 위끝을 늘 화면 위로 불렀다(D6 · 375 폰에서 110px 위로).
    //   가짜 문서(시험 · 검사기 — getBoundingClientRect · scrollBy 없음)에선 조용히 넘어간다.
    let 지킴 = null, 보일 = '';   // 지킴 { sel, top } — 다시 그린 뒤 그 칸을 이 화면 높이로 · 보일 — 다시 그린 뒤 그 칸이 다 보이게(가장 적게)
    // 11-01 배포 뒤 검토 고침 — 서버 답을 기다리는 사이 손님이 홈으로 가면 타로 탭이 숨는다(display:none · 상자 없음): 그땐 재지도 움직이지도 않는다(전엔 보이는 다른 화면이 84px 올라갔다).
    const 상자있음 = el => !!el && (typeof el.getClientRects !== 'function' || el.getClientRects().length > 0);
    const 화면위of = sel => { try { const el = root.querySelector && root.querySelector(sel); return el && typeof el.getBoundingClientRect === 'function' && 상자있음(el) ? { sel, top: el.getBoundingClientRect().top } : null; } catch (e) { return null; } };
    const 제자리 = 지 => {
      if (!지) return;
      try { const el = root.querySelector(지.sel); if (!el || typeof el.getBoundingClientRect !== 'function' || typeof global.scrollBy !== 'function' || !상자있음(el)) return; const d = el.getBoundingClientRect().top - 지.top; if (Math.abs(d) >= 1) global.scrollBy(0, d); } catch (e) {}
    };
    const 다보이게 = sel => {
      try {
        const el = root.querySelector(sel), 높 = +global.innerHeight || 0; if (!el || !높 || typeof el.getBoundingClientRect !== 'function' || typeof global.scrollBy !== 'function' || !상자있음(el)) return;
        // 아래 끝 = 뒤집기 띠가 붙을 자리(three.css sticky bottom: 78px + safe-area → 화면 높이 - bottom - 띠 높이) · 띠의 지금 위끝 · 네비의 실제 위끝 가운데 가장 위 - 6. 재서 쓴다(아이폰 홈 화면 앱은 safe-area 만큼 더 높다 · 전엔 84 · 92 고정).
        //   11-01 v1542 배포 뒤 검토 고침(v1543) — 기다리는 사이 위로 올렸거나 홈에 다녀오면 띠가 아직 안 붙어 펼친 판 위끝에 묶여 있다. 그 위끝만 재면 덜 움직여, 다 움직인 뒤 붙은 띠가 판 아래 줄(4 · 7째)을 가렸다(360×640 · 54 ~ 69px). 붙기 전이어도 붙을 자리로 센다.
        const 위끝of = x => (x && typeof x.getBoundingClientRect === 'function' && 상자있음(x)) ? x.getBoundingClientRect().top : 0;
        const 띠el = root.querySelector('.three-flip-foot'), 띠위 = 위끝of(띠el), 네비위 = 위끝of(global.document && typeof global.document.getElementById === 'function' ? global.document.getElementById('nav') : null);
        let 띠붙을위 = 0;
        if (띠위 > 0) { try { 띠붙을위 = 높 - (parseFloat(global.getComputedStyle(띠el).bottom) || 78) - 띠el.getBoundingClientRect().height; } catch (e) {} }
        const 네비바닥 = 네비위 > 0 ? 네비위 - 6 : 높 - 92, 바닥 = 띠위 > 0 ? Math.min(띠위 - 6, 띠붙을위 > 0 ? 띠붙을위 - 6 : 네비바닥, 네비바닥) : 네비바닥;   // 띠가 아직 제자리(붙기 전 · 화면 밖)여도 네비 위를 넘지 않게
        const 위 = 84, r = el.getBoundingClientRect();   // 위 84 = three.css scroll-margin(머리줄)
        let d = 0;
        if (r.top < 위) d = r.top - 위; else if (r.bottom > 바닥) d = Math.min(r.bottom - 바닥, r.top - 위);
        if (Math.abs(d) >= 1) global.scrollBy({ top: d, behavior: 움직임줄임() ? 'auto' : 'smooth' });
      } catch (e) {}
    };
    try { people.migrate(); selected = people.activeId(); } catch (e) {}
    사건('three3');
    function render(포커스) {
      const 내차례 = ++차례;
      let list = [];
      try { list = people.list() || []; } catch (e) {}
      const person = list.find(p => p.id === selected) || list.find(p => p.isSelf) || list[0];
      if (!person) { root.innerHTML = 판(); return; }
      selected = person.id;
      const 고르기 = list.length > 1 ? '<div class="three-person">' + (글('사람') ? '<label for="three-person">' + esc(글('사람')) + '</label>' : '')
        + '<select id="three-person"' + (글('사람') ? '' : ' aria-label="사람 바꾸기"') + '>' + list.map(p => '<option value="' + esc(p.id) + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.name || '') + '</option>').join('') + '</select></div>' : '';
      const prof = people.toProfile(person) || {}, 지금 = clock(), 오늘 = 날글(지금), 이번달 = 오늘.slice(0, 7);
      let 판3 = null, 덱 = null;
      const 달기 = () => {
        if (!root.querySelector) return;
        const s = root.querySelector('#three-person');
        if (s) { s.onchange = e => { selected = e.target.value; 고른 = ''; 펼친 = null; render(true); }; if (포커스) try { s.focus(); } catch (e) {} }
        const 넣기 = root.querySelector('[data-three-person-edit]');
        if (넣기) 넣기.onclick = () => { try { const b = global.document.getElementById('btnPerson'); if (b) b.click(); } catch (e) {} };
        const 모두 = sel => (root.querySelectorAll ? Array.from(root.querySelectorAll(sel)) : []);
        모두('[data-three-q]').forEach(b => { b.onclick = () => 고름(b.getAttribute('data-three-q')); });
        모두('[data-three-card]').forEach(b => { b.onclick = () => 뽑음(+b.getAttribute('data-three-card')); });
        const 다시 = root.querySelector('[data-three-retry]');
        if (다시) 다시.onclick = () => { const s3 = 판3 && 판3[고른]; if (s3 && s3.카드) 부르기(고른, s3.카드); };
        if (켜펼) {   // 펼침 — 섞기 · 떼기 단추 · 펼친 순간(다시 섞기 · 다시 떼기 · 결과보기) · 못 받았을 때 새로 펼침
          const 단추 = sel => root.querySelector(sel);
          const 섞 = 단추('[data-three-shuffle]'), 뗌단추 = 단추('[data-three-cut]'), 새로 = 단추('[data-three-spread-retry]');
          const 다섞 = 단추('[data-three-again-shuffle]'), 다뗌 = 단추('[data-three-again-cut]'), 결과 = 단추('[data-three-reveal-go]');
          const 부 = 단추('[data-three-fan]'), 뒤 = 단추('[data-three-flip]'), 판누름 = 단추('[data-three-flipboard]');
          // 부채꼴 — 누른 장(data-three-pick)을 고른다. 이벤트 없이 부르면(가짜 문서 · 시험 · 검사기) 남은 첫 장. 장 사이 빈 곳은 아무 일 없음.
          //   손가락(터치)은 누른 순간(pointerdown) 손끝 좌표(clientX · clientY — 실제 닿은 점) 바로 아래 장을 적어 두고 그 장을 고른다. 크롬은 손끝 넓이로 맞추는 탭 보정을
          //   click 뿐 아니라 pointerdown 대상(target)에도 해서, 대상으로 찾으면 겹친 옆 장(4 ~ 5장 오른쪽)이 잡힌다(v1535 배포 뒤 검토 — 좌표로 찾으니 9/9).
          //   적어 둔 장은 포인터가 낸 click(detail > 0)에만 · 1.5초 안 · 같은 부채꼴. 키보드 Enter(detail 0)는 포커스한 장 · 끌다 놓친 누름은 pointercancel 에서 지운다.
          let 눌림 = null;
          const 장of누름 = t => { const b = t && t.closest ? t.closest('[data-three-pick]') : null; return b && 부.contains && 부.contains(b) ? +b.getAttribute('data-three-pick') : null; };
          if (부) {
            부.onpointerdown = e => {
              눌림 = null;
              try {
                const d = global.document, 밑 = e && d && typeof d.elementFromPoint === 'function' ? d.elementFromPoint(e.clientX, e.clientY) : null;
                let i = 장of누름(밑); if (i == null) i = 장of누름(e && e.target);
                if (i != null) 눌림 = { i, t: Date.now() };
              } catch (er) {}
            };
            부.onpointercancel = () => { 눌림 = null; };
            부.onclick = e => {
              if (!e) { 집음(null); return; }
              const 앞 = 눌림; 눌림 = null;
              const i = 앞 && e.detail > 0 && Date.now() - 앞.t < 1500 ? 앞.i : 장of누름(e.target);
              if (i != null) 집음(i);
            };
          }
          if (뒤) 뒤.onclick = () => 뒤집음();
          if (판누름) 판누름.onclick = () => 뒤집음();
          if (섞) 섞.onclick = 섞음;
          if (뗌단추) 뗌단추.onclick = 뗌;
          if (다섞) 다섞.onclick = 다시섞음;
          if (다뗌) 다뗌.onclick = 다시뗌;
          const 더미 = 단추('[data-three-pile]');   // 결정함 86 — 더미를 눌러도 그 단계 단추와 같은 일(손이 더미에 닿는 맛 · 단추는 그대로)
          if (더미) 더미.onclick = () => { if (섞) 섞음(); else if (뗌단추) 뗌(); else if (다뗌) 다시뗌(); };
          if (결과) 결과.onclick = 결과봄;
          if (새로) 새로.onclick = () => { if (!고른) return; const 재 = 재고름 && 재고름.k === 순간k() ? 재고름 : null; 펼쳐부르기(고른, 순간켬, 재 && 재.고름, 재 && 재.나); };   // 고른 열 장 그대로 다시 부름
          const 스 = 스크롤할, 지 = 지킴, 보 = 보일; 스크롤할 = null; 지킴 = null; 보일 = '';
          제자리(지);   // 그 칸을 다시 그리기 전 화면 높이로(결정함 89)
          if (포커스할) { const el = root.querySelector(포커스할); 포커스할 = ''; if (el) try { el.focus({ preventScroll: true }); } catch (e) {} }   // 화면 옮김은 스크롤할만(판을 눌러 뒤집을 때 아래 단추로 튀지 않게)
          // D6 — 화면 안으로(움직임 줄이기면 바로). 가짜 문서(시험 · 검사기)엔 없으면 조용히 넘어간다.
          if (스) { const el = root.querySelector(스.sel); if (el && typeof el.scrollIntoView === 'function') try { el.scrollIntoView({ behavior: 움직임줄임() ? 'auto' : 'smooth', block: 스.block }); } catch (e) {} }
          if (보) 다보이게(보);
        }
      };
      if (prof.hour == null) {   // 결정함 44 — 시는 무조건
        root.innerHTML = 고르기 + 판('<div class="three-need"><p>' + esc(글('시각없음')) + '</p>' + (글('시각넣기') ? '<button type="button" class="btn ghost small" data-three-person-edit>' + esc(글('시각넣기')) + '</button>' : '') + '</div>');
        달기(); return;
      }
      const 키 = 저장열쇠3(prof);
      판3 = 꺼냄(키); if (!판3 || typeof 판3 !== 'object') 판3 = {};
      if (!고른 && 물음차례.includes(판3._마지막)) 고른 = 판3._마지막;
      const 몸 = (q, 카드) => ({ year: prof.year, month: prof.month, day: prof.day, hour: prof.hour, minute: prof.minute || 0, gender: prof.gender === 'F' ? 'F' : 'M', place: prof.place || 'KR:서울',
        longitude: typeof prof.longitude === 'number' ? prof.longitude : undefined, tzOffset: typeof prof.tzOffset === 'number' ? prof.tzOffset : undefined, 물음: q, 카드 });
      // 상태 — 물음(아직 안 고름) · 그대로(이번 달에 이 물음 카드를 뽑아 답을 받음) · 다시부름(뽑았는데 답을 못 받음) · 새카드
      const 상태of = () => { if (!고른) return '물음'; const s = 판3[고른]; if (s && s.달 === 이번달) return s.응답 ? '그대로' : '다시부름'; return '새카드'; };
      const 물음칸 = () => '<div class="three-qs-wrap">' + (글('세점.고르기') ? '<p class="three-pick">' + esc(글('세점.고르기')) + '</p>' : '')
        + '<div class="three-qs" role="group">' + 물음차례.map(k => { const s = 판3[k], 끝 = !!(s && s.달 === 이번달 && s.응답);
          return '<button type="button" class="three-q-btn' + (k === 고른 ? ' is-on' : '') + (끝 ? ' is-done' : '') + '" data-three-q="' + k + '" aria-pressed="' + (k === 고른 ? 'true' : 'false') + '">' + esc(글('세점.물음말.' + k)) + '</button>'; }).join('') + '</div></div>';
      function 덱칸() {
        덱 = 섞은일곱();
        const 창 = 창말of(지금), 값 = { 창: 달말(창.첫) + ' ~ ' + 달말(창.끝), 물음: 글('세점.물음말.' + 고른), 달: 달말(이번달) };   // 달 = 카드가 말하는 이번 달(결정함 82)
        return '<div class="three-deck">' + (글('세점.창말', 값) ? '<p class="three-window">' + esc(글('세점.창말', 값)) + '</p>' : '')
          + (글('세점.뽑기말', 값) ? '<p class="three-pick">' + esc(글('세점.뽑기말', 값)) + '</p>' : '')
          + '<div class="three-backs">' + 덱.map((x, i) => '<button type="button" class="three-back" data-three-card="' + i + '" aria-label="' + esc(글('카드읽기', { n: i + 1 }) || (i + 1)) + '">' + 뒷면그림 + '</button>').join('') + '</div></div>';
      }
      // 펼침 의식(켜짐 · 새카드 상태) — 나 카드 앞면(671 · 화면이 센 나 · 이름 D7) + 그 아래 나 글 → 덱(뒷면) · 섞기 → 떼기 세 번(677) → 서버 부름 → 펼친 순간(D3).
      //   의식은 이 화면에만 있다(저장 안 함 — 카드는 서버가 섞는다). 사람 · 물음 · 달이 바뀌면 처음부터. 단추 글이 비면 기호만(⇄ · n/3).
      const 순간k = () => selected + '|' + 고른 + '|' + 이번달;
      const 의식of = () => { const k = 순간k(); if (!의식 || 의식.k !== k) 의식 = { k, 뗀: -1, 움직임: '' }; return 의식; };
      const 창줄 = () => {
        const 창 = 창말of(지금), 값 = { 창: 달말(창.첫) + ' ~ ' + 달말(창.끝), 물음: 글('세점.물음말.' + 고른), 달: 달말(이번달) };   // 달 = 카드가 말하는 이번 달(결정함 82)
        return 글('세점.창말', 값) ? '<p class="three-window">' + esc(글('세점.창말', 값)) + '</p>' : '';
      };
      const 지금나 = () => 시그of(prof, 서울날of(clock()));   // 그릴 때마다 시계를 다시 읽는다 — 의식 중에 날이 바뀌어도 서버가 셀 나와 같게(만 40세 생일 자정)
      function 의식칸() {
        const 나 = 지금나(), 의 = 의식of();
        if (Array.isArray(의.고름)) return 고르기칸(나, 의);
        const 단추 = 의.뗀 < 0
          ? '<button type="button" class="btn three-rite-btn" data-three-shuffle>' + esc(글('세점.펼침.섞기') || '⇄') + '</button>'
          : 떼기단추of(글, 'data-three-cut', 의.뗀 + 1);
        return 의식틀(창줄(), 나, 카드이름of(나, P), 나 ? 글('세점.펼침.나.' + 나.계급) : '', 의.움직임, 단추);
      }
      // 고르기(결정함 83) — 판(고른 만큼 뒷면) · [고르기 글] · 다음 자리(번호 · 이름 · 고른 수) · 부채꼴. 열째를 고르면 곧장 부른다(고른 자리 열 = 몸의 고름).
      function 고르기칸(나, 의) {
        const 수 = 의.고름.length, 다음 = 수 + 1, 이름 = 글('세점.펼침.자리.' + 다음), 말 = 글('세점.펼침.고르기', { 물음: 글('세점.물음말.' + 고른) });
        return '<div class="three-rite three-picking" data-three-rite>' + 창줄() + 고르는판(나, 수, 의.움직임) + (말 ? '<p class="three-fan-say">' + esc(말) + '</p>' : '')
          + '<p class="three-fan-count" aria-live="polite"><span class="three-fan-no">' + 다음 + '</span>' + (이름 ? '<b>' + esc(이름) + '</b>' : '') + '<span class="three-fan-of">' + 수 + ' / 10</span></p>'
          + 부채(의.고름, 글, 의.움직임) + '</div>';
      }
      function 섞음() { const 의 = 의식of(); if (의.뗀 >= 0) return; 의.뗀 = 0; 의.움직임 = 'shuffle'; 포커스할 = '[data-three-cut]'; 떨림(18); 그리기(); }
      function 뗌() {
        const 의 = 의식of(); if (의.뗀 < 0 || 의.고름 || !고른) return;
        의.뗀++; 떨림(10);
        if (의.뗀 >= 3) { 의.고름 = []; 의.움직임 = 'spread'; 포커스할 = '[data-three-fan] button'; 스크롤할 = { sel: '[data-three-fan]', block: 'nearest' }; 그리기(); return; }   // 셋째 떼기 뒤 부채꼴(결정함 83)
        의.움직임 = 'cut'; 포커스할 = '[data-three-cut]'; 그리기();
      }
      function 집음(i) {
        const 의 = 의식of(); if (!Array.isArray(의.고름) || 의.고름.length >= 10 || !고른) return;
        if (i == null) { i = 0; while (의.고름.includes(i)) i++; }   // 누른 장 없이 불림(가짜 문서) — 남은 첫 장
        if (!(Number.isInteger(i) && i >= 0 && i <= 76) || 의.고름.includes(i)) return;
        의.고름.push(i); 의.움직임 = 'pick'; 떨림(8);
        if (의.고름.length >= 10) { const 고 = 의.고름.slice(); 의식 = null; 펼쳐부르기(고른, 순간켬, 고, 지금나()); return; }   // 열째 → 서버 부름 → 받으면 뒤집기(D3)
        지킴 = 화면위of('[data-three-fan]'); 포커스할 = '[data-three-fan] button'; 그리기();   // 부채는 손끝 아래 그대로(결정함 89)
      }
      // 뒤집기 — 다음 장 하나(1 → 10). 열째 뒤에는 끝말 + 결과보기(다시면 다시말 + 섞기)를 화면 안으로.
      function 뒤집음() {
        if (!펼친 || 펼친.k !== 순간k() || 펼친.단계 === '다시의식') return;
        const 연 = +펼친.연 || 0; if (연 >= 10) return;
        펼친.연 = 연 + 1; 펼친.움직임 = 'flip'; 떨림(펼친.연 === 10 ? [14, 50, 22] : 10);
        if (펼친.연 < 10) 포커스할 = '[data-three-flip]';
        else {
          const s3 = 판3[고른], f = s3 && s3.응답 && s3.응답.펼침;
          포커스할 = f && 다시됨(f) && 펼친.단계 === '첫판' ? '[data-three-again-shuffle]' : '[data-three-reveal-go]';
          스크롤할 = { sel: '.three-reveal .three-read', block: 'start' };   // 88 — 열째 풀이 칸을 화면 위로(이야기가 끝말 위에 붙어 끝말로 부르면 열째 풀이가 위로 밀려났다) · 이야기 · 끝말은 그 아래로 읽어 내려감
        }
        그리기();
      }
      // 펼친 순간(D3) — 다시 섞기(다시 의식 시작 · 사건 three3_again|물음) → 다시 떼기 셋 → 둘째 판 → 결과보기(D6 카드칸을 화면 안으로).
      //   누름은 카드를 정하지 않는다(서버가 이미 둘째 판을 냈다). 상태는 저장하지 않는다.
      function 다시섞음() {
        if (!펼친 || 펼친.k !== 순간k() || 펼친.단계 !== '첫판' || (+펼친.연 || 0) < 10) return;
        Object.assign(펼친, { 단계: '다시의식', 뗀: 0, 움직임: 'shuffle' }); 포커스할 = '[data-three-again-cut]'; 스크롤할 = { sel: '[data-three-rite]', block: 'nearest' }; 떨림(18);
        사건('three3_again|' + 고른);
        그리기();
      }
      function 다시뗌() {
        if (!펼친 || 펼친.k !== 순간k() || 펼친.단계 !== '다시의식') return;
        펼친.뗀++; 떨림(10);
        if (펼친.뗀 >= 3) { Object.assign(펼친, { 단계: '둘판', 연: 0, 움직임: 'deal' }); 포커스할 = '[data-three-flip]'; 스크롤할 = { sel: '[data-three-reveal]', block: 'start' }; 그리기(); return; }   // 책사가 놓은 둘째 판 → 뒤집기
        펼친.움직임 = 'cut'; 포커스할 = '[data-three-again-cut]'; 그리기();
      }
      function 결과봄() { 펼친 = null; 포커스할 = '.three-drawn'; 스크롤할 = { sel: '.three-drawn', block: 'start' }; 그리기(); }
      // 펼침 부름 — 몸 + 「펼침: true」(카드 없음) + 고름(고른 자리 열 · 결정함 83 — 없으면 서버가 맨 위 열 장). 받은 뒤에만 둔다(부르기 전엔 카드가 없다) — 못 받으면 오류 + 새로 펼침 단추.
      //   고름이 있으면 기다리는 동안 고른 열 장이 놓인 판을 그대로 둔다(나 = 화면이 센 나).
      function 펼쳐부르기(q, 순간, 고, 나) {   // 순간 — 받으면 펼친 순간(D3)부터(의식 · 새로 펼침 단추). opt.펼침(시험 · 검사기)이면 바로 결과
        재고름 = 고 ? { k: 순간k(), 고름: 고.slice(), 나 } : null;
        const 판자리 = 화면위of('[data-three-rite] .three-sp-board');   // 고르던 판(결정함 89) — 기다리는 동안에도 그 자리
        root.innerHTML = 고르기 + 판(물음칸() + (고 ? '<div class="three-rite three-picking" data-three-rite>' + 창줄() + 고르는판(나, 10, 'pick') + '</div>' : '')
          + '<div class="three-wait" aria-hidden="true"><span></span><span></span><span></span></div>' + (글('세점.펼침.기다림') ? '<p class="three-q">' + esc(글('세점.펼침.기다림')) + '</p>' : ''));
        제자리(판자리);
        사건('three3_spread|' + q);
        const 받음 = res => {
          if (내차례 !== 차례) return;
          const j = res && res.ok ? res.j : null;
          if (j && j.점 && j.점.타로 && j.물음 === q && j.카드 && j.셈 && j.펼침 && Array.isArray(j.펼침.자리)) {
            판3[q] = { 달: 이번달, 펼침: true, 응답: j }; 둠(키, 판3);   // 같은 달 같은 물음은 이 펼침을 다시 그린다 — 펼친 순간 전에 바로 둔다
            사건('three3_res|' + q + '|' + j.셈.길 + '-' + j.셈.흉);
            if (q !== 고른) return;
            if (순간) {   // 펼친 순간(D3) — 결과보기를 누를 때까지(이 화면에만 · 저장 안 함) · 뒤집기 단추에 초점 · D6 펼친 판을 화면 안으로
              펼친 = { k: 순간k(), 단계: '첫판', 연: 0, 뗀: -1, 움직임: '' };
              const 판자리 = 화면위of('[data-three-rite] .three-sp-board');   // 기다리던 판(고른 열 장)의 지금 화면 높이 — 펼친 판을 그 자리에(결정함 89)
              포커스할 = '[data-three-flip]'; 지킴 = 판자리 && { sel: '[data-three-reveal] .three-sp-board', top: 판자리.top }; 보일 = '[data-three-reveal] .three-sp-board';
              미리그림(j.펼침);
            }
            그리기();
            return;
          }
          if (q !== 고른) return;
          const 코드 = (res && res.j && res.j.코드) || '계산', 막힘 = 코드 === '태어나기전' || 코드 === '시각없음' || 코드 === '입력' || 코드 === '물음';   // 막힘 — 다시 불러도 같은 답
          root.innerHTML = 고르기 + 판(물음칸() + '<div class="three-need"><p>' + esc(글('오류.' + 코드) || 글('오류.계산')) + '</p>' + (막힘 ? '' : '<button type="button" class="btn ghost small" data-three-spread-retry>' + esc(글('다시') || '↻') + '</button>') + '</div>');
          달기();
        };
        let p;
        try { p = 부름(Object.assign(몸(q), { 펼침: true }, 고 ? { 고름: 고.slice() } : {})); } catch (e) { 받음({ ok: false, j: { 코드: '연결' } }); return; }
        if (p && typeof p.then === 'function') p.then(받음, () => 받음({ ok: false, j: { 코드: '연결' } })); else 받음(p);
      }
      function 그리기() {
        if (내차례 !== 차례) return;
        const 상태 = 상태of(), s = 고른 ? 판3[고른] : null, r = s && s.응답;
        const 펼 = 상태 === '그대로' && 켜펼 && r.펼침 && Array.isArray(r.펼침.자리);   // 펼침 응답(옛 한 장 응답은 한 장 결과 그대로)
        const 순 = 펼 && 펼친 && 펼친.k === 순간k() ? 펼친 : null;   // 펼친 순간(D3) — 결과보기를 누르기 전
        let 안 = 물음칸(), 뒤 = '';
        if (순) 안 += 펼친칸(r, 글, P, 순);
        else if (상태 === '그대로') {
          // 결과(D2 · 결정함 84): 카드칸(펼침이면 머리 = 길흉을 정한 열째) · 궁정말 → 세 점 결론 → [열 장 접힘(판 · 장 풀이 · 끝말)] → 근거 접힘 → 할 일 → 다음 카드
          안 += (펼 ? 카드칸(r, 글, P, 글('세점.펼침.끝카드'), ' tabindex="-1"') + 궁정줄(r, 글, P) : 카드칸(r, 글, P)) + 세점결론칸(r, 글) + (펼 ? 열장칸(r, 글, P) : '') + 세점근거칸(r, 글, !!펼) + 세점할일칸(r, 글)
            + (글('세점.다음카드', { 날: 날말(r.다음카드) }) ? '<p class="three-next">' + esc(글('세점.다음카드', { 날: 날말(r.다음카드) })) + '</p>' : '');
          const Y = global.ChaeksaYaksok, 오늘이름 = (Y && Y.이름 && Y.이름('today')) || '';
          if (글('끝말') || 오늘이름) 뒤 = '<div class="three-end">' + (글('끝말') ? '<p>' + esc(글('끝말')) + '</p>' : '') + (오늘이름 ? '<a href="#today">' + esc(오늘이름) + ' <span aria-hidden="true">→</span></a>' : '') + '</div>';
        } else if (상태 === '새카드') 안 += 켜펼 ? 의식칸() : 덱칸();
        else if (상태 === '다시부름') 안 += '<div class="three-need"><p>' + esc(글('오류.연결')) + '</p><button type="button" class="btn ghost small" data-three-retry>' + esc(글('다시') || '↻') + '</button></div>';
        root.innerHTML = 고르기 + 판(안) + 뒤;
        달기();
        try { if (r && 상태 === '그대로' && !순 && track && track.watchEnd) track.watchEnd(root, 'three3_end'); } catch (e) {}   // 끝까지 읽음은 결과에서만(펼친 순간 아님)
      }
      function 고름(k) {
        if (!물음차례.includes(k)) return;
        if (켜펼 && k !== 고른) { 의식 = null; 펼친 = null; }   // 펼침 의식 · 펼친 순간은 물음을 바꾸면 버린다(돌아오면 의식은 처음부터 · 받은 펼침은 결과로)
        고른 = k; 판3._마지막 = k; 둠(키, 판3);
        사건('three3_q|' + k);
        if (상태of() === '다시부름') { 부르기(k, 판3[k].카드); return; }
        if (켜펼 && 상태of() === '새카드') 스크롤할 = { sel: '[data-three-rite]', block: 'nearest' };   // D6 — 의식 칸을 화면 안으로
        그리기();
      }
      function 뽑음(i) {
        if (!덱 || !덱[i] || !고른) return;
        const 카드 = 덱[i];
        판3[고른] = { 달: 이번달, 카드 }; 둠(키, 판3);   // 뽑자마자 둔다 — 다시 열어도 같은 카드(물음마다 한 달에 한 장)
        사건('three3_draw|' + 고른);
        부르기(고른, 카드);
      }
      function 부르기(q, 카드) {
        root.innerHTML = 고르기 + 판(물음칸() + '<div class="three-wait" aria-hidden="true"><span></span><span></span><span></span></div>' + (글('세점.기다림') ? '<p class="three-q">' + esc(글('세점.기다림')) + '</p>' : ''));
        const 받음 = res => {
          if (내차례 !== 차례) return;
          if (res && res.ok && res.j && res.j.점 && res.j.점.타로 && res.j.물음 === q) {
            판3[q] = { 달: (판3[q] && 판3[q].달) || 이번달, 카드, 응답: res.j }; 둠(키, 판3);
            사건('three3_res|' + q + '|' + res.j.셈.길 + '-' + res.j.셈.흉);
            if (q === 고른) 그리기();
            return;
          }
          const 코드 = (res && res.j && res.j.코드) || '계산';
          if (코드 === '태어나기전' || 코드 === '시각없음' || 코드 === '입력' || 코드 === '물음') { delete 판3[q]; 둠(키, 판3); }   // 다시 불러도 같은 답 — 카드를 버린다
          root.innerHTML = 고르기 + 판(물음칸() + '<div class="three-need"><p>' + esc(글('오류.' + 코드) || 글('오류.계산')) + '</p>' + (판3[q] ? '<button type="button" class="btn ghost small" data-three-retry>' + esc(글('다시') || '↻') + '</button>' : '') + '</div>');
          달기();
        };
        let p;
        try { p = 부름(몸(q, 카드)); } catch (e) { 받음({ ok: false, j: { 코드: '연결' } }); return; }
        if (p && typeof p.then === 'function') p.then(받음, () => 받음({ ok: false, j: { 코드: '연결' } })); else 받음(p);
      }
      if (켜펼 && opt.펼침 === true && 고른 && 상태of() === '새카드') { 펼쳐부르기(고른, false); return; }   // 시험 · 화면 검사기 — 의식 · 펼친 순간을 건너뛰고 바로 결과(opt.부름 이 엔진을 부름)
      if (opt.카드 && 고른 && 상태of() === '새카드') { 판3[고른] = { 달: 이번달, 카드: opt.카드 }; 둠(키, 판3); 부르기(고른, opt.카드); return; }   // 시험 · 화면 검사기 — 이 물음에 이 카드를 뽑은 것으로
      if (상태of() === '다시부름') { 부르기(고른, 판3[고른].카드); return; }
      그리기();
    }
    render(false);
    return { render };
  }

  function mount(root, options) {
    if (!root) return;
    const opt = options || {}, P = global.ChaeksaThreePieces || {}, 글 = 글틀(P, 열쇠보기());
    if (세점켜짐(P, 열쇠보기())) return 세점mount(root, opt, P, 글);   // 10-31 세 점 — Codex 글이 오면 켜진다
    const people = opt.people || global.ChaeksaPeople, clock = opt.clock || (() => new Date()), track = 'track' in opt ? opt.track : global.ChaeksaTrack;
    const 부름 = opt.부름 || (body => global.fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(res => res.json().then(j => ({ ok: res.ok, j }), () => ({ ok: false, j: { 코드: '계산' } }))));
    const 사건 = name => { try { if (track) track.event(name); } catch (e) {} };
    const 머리 = '<div class="jt-head"><h1 class="three-title">' + esc(글('이름')) + '</h1></div>' + (글('물음') ? '<p class="three-q">' + esc(글('물음')) + '</p>' : '');
    const 판 = (안) => '<section class="card jt-ch three-card">' + 머리 + (안 || '') + '</section>';
    if (!people) { root.innerHTML = 판(); return; }
    let selected = '', 차례 = 0;
    try { people.migrate(); selected = people.activeId(); } catch (e) {}
    사건('three');
    function render(포커스) {
      const 내차례 = ++차례;
      let list = [];
      try { list = people.list() || []; } catch (e) {}
      const person = list.find(p => p.id === selected) || list.find(p => p.isSelf) || list[0];
      if (!person) { root.innerHTML = 판(); return; }
      selected = person.id;
      const 고르기 = list.length > 1 ? '<div class="three-person">' + (글('사람') ? '<label for="three-person">' + esc(글('사람')) + '</label>' : '')
        + '<select id="three-person"' + (글('사람') ? '' : ' aria-label="사람 바꾸기"') + '>' + list.map(p => '<option value="' + esc(p.id) + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.name || '') + '</option>').join('') + '</select></div>' : '';
      const 달기 = () => {
        if (!root.querySelector) return;
        const s = root.querySelector('#three-person');
        if (s) { s.onchange = e => { selected = e.target.value; render(true); }; if (포커스) try { s.focus(); } catch (e) {} }
        const 넣기 = root.querySelector('[data-three-person-edit]');
        if (넣기) 넣기.onclick = () => { try { const b = global.document.getElementById('btnPerson'); if (b) b.click(); } catch (e) {} };
        (root.querySelectorAll ? Array.from(root.querySelectorAll('[data-three-card]')) : []).forEach(b => { b.onclick = () => 뽑음(+b.getAttribute('data-three-card')); });
        (root.querySelectorAll ? Array.from(root.querySelectorAll('[data-three-note]')) : []).forEach(b => { b.onclick = () => 적음(b.getAttribute('data-three-note')); });
        const 다시 = root.querySelector('[data-three-retry]');
        if (다시) 다시.onclick = () => 부르기(저장 && 저장.카드);
      };
      const prof = people.toProfile(person) || {}, 지금 = clock(), 오늘 = 날글(지금), 이번달 = 오늘.slice(0, 7);
      if (prof.hour == null) {   // 결정함 44 — 시는 무조건
        root.innerHTML = 고르기 + 판('<div class="three-need"><p>' + esc(글('시각없음')) + '</p>' + (글('시각넣기') ? '<button type="button" class="btn ghost small" data-three-person-edit>' + esc(글('시각넣기')) + '</button>' : '') + '</div>');
        달기(); return;
      }
      const 키 = 저장열쇠(prof);
      let 저장 = 꺼냄(키), 덱 = null;
      const 몸 = 카드 => ({ year: prof.year, month: prof.month, day: prof.day, hour: prof.hour, minute: prof.minute || 0, gender: prof.gender === 'F' ? 'F' : 'M', place: prof.place || 'KR:서울',
        longitude: typeof prof.longitude === 'number' ? prof.longitude : undefined, tzOffset: typeof prof.tzOffset === 'number' ? prof.tzOffset : undefined, 카드 });
      // 상태 — 그대로(점의 때가 안 끝남 · 이번 달에 뽑은 점 없음) · 지남(점의 때가 끝남 — 기록 + 새 카드) · 다시부름(뽑았는데 응답 못 받음) · 새카드
      const 상태of = () => {
        if (저장 && 저장.응답) { const r = 저장.응답; if (r.점) return 오늘 <= r.점.때.끝 ? '그대로' : '지남'; return 저장.달 === 이번달 ? '그대로' : '새카드'; }
        if (저장 && 저장.카드 && 저장.달 === 이번달) return '다시부름';
        return '새카드';
      };
      function 덱칸() {
        덱 = 섞은일곱();
        const 창 = 창말of(지금);
        return '<div class="three-deck">' + (글('창말', { 창: 달말(창.첫) + ' ~ ' + 달말(창.끝) }) ? '<p class="three-window">' + esc(글('창말', { 창: 달말(창.첫) + ' ~ ' + 달말(창.끝) })) + '</p>' : '')
          + (글('뽑기말') ? '<p class="three-pick">' + esc(글('뽑기말')) + '</p>' : '')
          + '<div class="three-backs">' + 덱.map((x, i) => '<button type="button" class="three-back" data-three-card="' + i + '" aria-label="' + esc(글('카드읽기', { n: i + 1 }) || (i + 1)) + '">' + 뒷면그림 + '</button>').join('') + '</div></div>';
      }
      function 그리기() {
        if (내차례 !== 차례) return;
        const 상태 = 상태of(), r = 저장 && 저장.응답;
        let 안 = '';
        if (r && (상태 === '그대로' || 상태 === '지남')) {
          안 = 카드칸(r, 글, P) + 결론칸(r, 글) + 근거칸(r, 글);
          // 점이 있으면 그 때가 끝난 다음 날부터 새 카드(결정함 46) — 점이 없으면 결론칸의 「다음카드」 한 줄로 충분(같은 날짜를 두 번 쓰지 않음).
          if (상태 === '그대로' && r.점) {
            const 끝 = r.점.때.끝.split('-').map(Number), 새날 = 날글(new Date(끝[0], 끝[1] - 1, 끝[2] + 1));
            if (글('그대로', { 날: 날말(새날) })) 안 += '<p class="three-keep">' + esc(글('그대로', { 날: 날말(새날) })) + '</p>';
          }
        }
        let 뒤 = '';
        if (r && r.점 && 오늘 >= r.점.때.시작) 뒤 += 기록칸(r, 글, 저장.기록);
        if (상태 === '지남' || 상태 === '새카드') { if (상태 === '지남') 뒤 += 판(덱칸()); else 안 = 덱칸(); }
        if (상태 === '다시부름') 안 = '<div class="three-need"><p>' + esc(글('오류.연결')) + '</p><button type="button" class="btn ghost small" data-three-retry>' + esc(글('다시') || '↻') + '</button></div>';
        // 끝 — 오늘의 운세로 잇는 고리(「왜 내게만」과 같은 꼴 · 이름은 장부에서). 주소는 #today — ./#today 는 쪽을 새로 부른다.
        const Y = global.ChaeksaYaksok, 오늘이름 = (Y && Y.이름 && Y.이름('today')) || '';
        root.innerHTML = 고르기 + 판(안) + 뒤 + (r && (글('끝말') || 오늘이름) ? '<div class="three-end">' + (글('끝말') ? '<p>' + esc(글('끝말')) + '</p>' : '') + (오늘이름 ? '<a href="#today">' + esc(오늘이름) + ' <span aria-hidden="true">→</span></a>' : '') + '</div>' : '');
        달기();
        try { if (r && track && track.watchEnd) track.watchEnd(root, 'three_end'); } catch (e) {}
      }
      function 뽑음(i) {
        if (!덱 || !덱[i]) return;
        const 카드 = 덱[i];
        저장 = { 달: 이번달, 카드 };   // 뽑자마자 둔다 — 다시 열어도 같은 카드(한 달에 한 장)
        둠(키, 저장);
        사건('three_draw');
        부르기(카드);
      }
      function 부르기(카드) {
        if (!카드) { 저장 = null; 그리기(); return; }
        root.innerHTML = 고르기 + 판('<div class="three-wait" aria-hidden="true"><span></span><span></span><span></span></div>' + (글('기다림') ? '<p class="three-q">' + esc(글('기다림')) + '</p>' : ''));
        const 받음 = res => {
          if (내차례 !== 차례) return;
          if (res && res.ok && res.j && res.j.카드) { 저장 = { 달: 저장 && 저장.달 || 이번달, 카드, 응답: res.j }; 둠(키, 저장); 사건(res.j.점 ? 'three_point' : 'three_none'); 그리기(); return; }
          const 코드 = res && res.j && res.j.코드 || '계산';
          if (코드 === '태어나기전' || 코드 === '시각없음' || 코드 === '입력') { 저장 = null; 둠(키, null); }   // 다시 불러도 같은 답 — 카드를 버린다
          root.innerHTML = 고르기 + 판('<div class="three-need"><p>' + esc(글('오류.' + 코드) || 글('오류.계산')) + '</p>' + (저장 ? '<button type="button" class="btn ghost small" data-three-retry>' + esc(글('다시') || '↻') + '</button>' : '') + '</div>');
          달기();
        };
        let p;
        try { p = 부름(몸(카드)); } catch (e) { 받음({ ok: false, j: { 코드: '연결' } }); return; }
        if (p && typeof p.then === 'function') p.then(받음, () => 받음({ ok: false, j: { 코드: '연결' } })); else 받음(p);
      }
      function 적음(답) {
        if (!저장 || !저장.응답 || !저장.응답.점) return;
        저장.기록 = 답; 둠(키, 저장);
        사건('te|' + 저장.응답.점.자리 + '|' + 답);   // 저녁 기록과 같은 꼴(ev:te|자리|비슷 · 다름 · 없음) — 점의 때에 그 자리에 일이 있었나(법전 64조 「결과가 나와야 한다」)
        그리기();
      }
      if (opt.카드 && 상태of() === '새카드') { 저장 = { 달: 이번달, 카드: opt.카드 }; 둠(키, 저장); 부르기(opt.카드); return; }   // 시험 · 화면 검사기 — 이 카드를 뽑은 것으로
      if (상태of() === '다시부름') { 부르기(저장.카드); return; }
      그리기();
    }
    render(false);
    return { render };
  }
  global.ChaeksaThreeView = { mount, 때말, 날말, 달말, 창말of, 카드들, 섞은일곱, 물음차례, 세점켜짐, 채움, 펼침켜짐, 펼침필수, 시그of, 서울날of, 자리수, 물음칸, 물음켜짐, 물음맥of, 성별of };   // 달말 · 채움 — 화면 글 검사기가 글 조각 전부를 보기 값으로 채워 본다(10-31) · 펼침켜짐 · 펼침필수 · 시그of — 펼침 시험 · 검사기
})(typeof window !== 'undefined' ? window : globalThis);
