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
 *   Codex 글의 필수 칸(펼침필수 — 나 넷 · 섞기 · 떼기 · 결과보기 · 자리 · 자리뜻 열씩 · 끝말 · 다시말 · 궁정말 · 끝카드)이 다 차야 켜진다 — 그 전엔 위 한 장 판 그대로. ?keys 면 펼침 뼈대. */
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
      const z = r.점[k], 갈래 = 갈래of(r, k), 길흉 = 갈래 === '문없음' ? 글('세점.사주없음') : 글('세점.길흉말.' + z.길흉), 일 = 글('세점.일어남.' + r.물음 + '.' + k + '.' + 갈래);
      return '<li class="three-pt" data-gh="' + esc(z.길흉) + '"><div class="three-pt-head"><span class="three-pt-name">' + esc(점이름of(글, k)) + '</span>'
        + '<span class="three-pt-when">' + esc(점때(r, k, 글)) + '</span>' + (길흉 ? '<b class="three-pt-gh">' + esc(길흉) + '</b>' : '') + '</div>'
        + (일 ? '<p class="three-pt-what">' + esc(일) + '</p>' : '') + '</li>';
    }).join('');
    const 셈 = 글('세점.셈', { 길: r.셈.길, 흉: r.셈.흉 }), 같은 = r.같은달 ? 글('세점.같은달', { 달: 달말(r.점.사주.달) }) : '';
    return '<div class="jt-answer three-answer">' + (글('세점.결론머리', { 물음 }) ? '<p class="three-kicker">' + esc(글('세점.결론머리', { 물음 })) + '</p>' : '')
      + '<ul class="three-pts">' + 줄 + '</ul>' + (셈 ? '<p class="three-tally">' + esc(셈) + '</p>' : '') + (같은 ? '<p class="three-same">' + esc(같은) + '</p>' : '') + '</div>';
  }
  function 세점근거칸(r, 글, 펼) {   // 펼 — 켈틱 펼침 근거(펼근거 · D2 — 타로 칸 h3 바로 다음). 한 장 응답 · 꺼짐이면 '' (글자 하나 다르지 않게)
    const c = r.카드, 원 = r.원문 || {}, 타 = r.점.타로, 사 = r.점.사주, 자 = r.점.자미, 왜 = 키 => 글(키) ? '<p class="three-why2">' + esc(글(키)) + '</p>' : '';
    let h = '<details class="jt-ev three-basis"><summary>' + esc(글('근거')) + '</summary>';
    // 타로 — (펼침이면 맨 앞에 판 · 자리 목록 · 끝말) · 붙인 웨이트 낱말(그 물음을 직접 말할 때) · 카드 원문 · 창 원문(901줄 — 한 장 응답만)
    //   켈틱 펼침엔 901줄을 싣지 않는다 — §8(마흔두 장 · 정한 물음이 없을 때의 법) 줄이라 §7 판의 원문 근거가 아니다(결정함 77 「근거에서 걷는다」 · 10-31 배포 뒤 뜻 대조). 한 장 응답은 글자 그대로.
    h += '<section class="three-eye"><h3>' + esc(점이름of(글, '타로')) + '</h3>' + (펼 || '') + 왜('세점.왜.타로달.' + (타.직접 ? '직접' : '전체'))
      + (타.붙임.length ? '<ul class="three-keys" lang="en">' + 타.붙임.map(x => '<li lang="en">' + esc(x.낱말) + ' <small>(Part III ' + esc(x.줄) + (x.절 ? ' ' + esc(x.절) : '') + ')</small></li>').join('') + '</ul>' : '')
      + '<blockquote class="three-src" lang="en">' + esc(c.원문) + '</blockquote>'
      + '<p class="three-ref" lang="en">Waite, The Pictorial Key to the Tarot · Part III ' + esc(c.줄) + (c.절 === '§4' ? ' §4' : '') + ' · ' + esc(c.이름en) + '</p>'
      + (원.창 && !펼 ? '<blockquote class="three-src" lang="en">' + esc(원.창.글) + '</blockquote><p class="three-ref" lang="en">' + esc(원.창.줄) + '</p>' : '') + '</section>';
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
  function 끝말of(r, 글, P) {
    const f = r.펼침, 끝장 = 끝장of(r), 끝길흉 = (f.끝 && f.끝.길흉) || (r.점 && r.점.타로 && r.점.타로.길흉) || '';
    return 글('세점.펼침.끝말', { 카드: 카드이름of(끝장, P), 놓임: 글('놓임말.' + (끝장 && 끝장.놓임)), 길흉: 글('세점.길흉말.' + 끝길흉) });
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
  function 판그림(나, 자리, 끝n, 움직임) {
    const 늦게 = 움직임 ? '' : ' loading="lazy"';
    const 그림 = (id, cls) => 그림id.test(String(id)) ? '<img class="three-sp-img' + cls + '" src="' + 그림길 + id + '-s.webp?v=2" alt=""' + 늦게 + ' decoding="async">' : '<span class="three-sp-img three-sp-none' + cls + '"></span>';
    const 칸 = n => { const x = 장of(자리, n);
      return '<div class="three-sp three-sp-' + n + (n === 끝n ? ' is-end' : '') + '" style="--i:' + n + '">' + (움직임 ? '<div class="three-sp-flip">' : '') + 그림(x && x.id, (n === 2 ? ' is-cross' : '') + (x && x.놓임 === '거꾸로' ? ' is-rev' : '')) + (움직임 ? '<img class="three-sp-back' + (n === 2 ? ' is-cross' : '') + '" src="' + 그림길 + 'back-s.webp" alt=""></div>' : '') + '<span class="three-sp-n">' + n + '</span></div>'; };
    return '<div class="three-sp-wrap"><div class="three-sp-board' + (움직임 ? ' is-anim' : '') + (나 && 오른쪽보는.has(String(나.id)) ? ' is-face-right' : '') + '" aria-hidden="true"><div class="three-sp-mid"><div class="three-sp three-sp-sig" style="--i:0">' + 그림(나 && 나.id, '') + '</div>' + 칸(1) + 칸(2) + '</div>'
      + 자리수.slice(2).map(n => 칸(n)).join('') + '</div></div>';
  }
  // 자리 목록 — 자리마다 이름 · 그 물음 길흉말 · 카드 이름 · 놓임 · 자리 뜻(있으면). 1 ~ 9째 길흉은 보여 주기만(셈은 열째 하나).
  function 자리목록(자리, 글, P, 끝n) {
    return '<ol class="three-sp-list">' + 자리수.map(n => {
      const x = 장of(자리, n); if (!x) return '';
      const 이름 = 글('세점.펼침.자리.' + n), 뜻 = 글('세점.펼침.자리뜻.' + n), gh = 글('세점.길흉말.' + x.길흉), 놓 = 글('놓임말.' + x.놓임);
      return '<li class="three-sp-row' + (n === 끝n ? ' is-end' : '') + '" data-gh="' + esc(x.길흉 || '') + '"><span class="three-sp-no" aria-hidden="true">' + n + '</span><div class="three-sp-txt">'
        + ((이름 || gh) ? '<p class="three-sp-pos">' + (이름 ? '<b>' + esc(이름) + '</b>' : '') + (이름 && gh ? ' ' : '') + (gh ? '<span class="three-sp-gh">' + esc(gh) + '</span>' : '') + '</p>' : '')
        + '<p class="three-sp-card">' + esc(카드이름of(x, P)) + (x.이름en ? ' <small lang="en">' + esc(x.이름en) + '</small>' : '') + (놓 ? ' <span class="three-sp-or">' + esc(놓) + '</span>' : '') + '</p>'
        + (뜻 ? '<p class="three-sp-mean">' + esc(뜻) + '</p>' : '') + '</div></li>';
    }).join('') + '</ol>';
  }
  // 의식 꼴 — 처음 의식(나 = 화면이 센 나 · 나 글) · 다시 의식(나 = 첫 판 열째 · 글 없음 — D3 「새 나 카드 + 뒷면 더미 + 떼기 단추」)이 같은 꼴(three-rite). 나 카드는 늘 바로(앞면) · 뒷면 더미 셋.
  // 카드 사이를 직접 누르는 의식. 누른 위치는 연출에만 쓰고 서버의 카드·순서·길흉은 그대로 사용한다.
  function 의식틀(위, 나, 나이름, 왜말, 움직임, 단추, 의, 글) {
    의 = 의 || { 뗀: -1 };
    const 펼침 = 의.뗀 >= 0 || 움직임 === 'shuffle', 바쁨 = !!움직임;
    const 위치 = Number.isInteger(의.위치) ? 의.위치 : 6;
    const 안내 = 글('세점.펼침.' + (바쁨 ? (움직임 === 'shuffle' ? '섞는중' : '나누는중') : 펼침 ? '손길' : '준비'));
    const 카드말 = n => 펼침 ? 글('세점.펼침.나눌곳', { n: n + 1 }) : 글('세점.펼침.섞기');
    const 카드 = Array.from({ length: 13 }, (_, i) => '<button type="button" class="three-fan-card" data-three-deck-touch="' + i
      + '" style="--fan-i:' + (i - 6) + ';--fan-abs:' + Math.abs(i - 6) + ';--fan-z:' + i + ';--cut-side:' + (i < 위치 ? -1 : 1)
      + '" aria-label="' + esc(카드말(i)) + '"' + (바쁨 || (!펼침 && i !== 6) ? ' disabled' : '')
      + (!펼침 && i !== 6 ? ' aria-hidden="true"' : '') + '><img src="' + 그림길 + 'back.webp" alt="" decoding="async" draggable="false"></button>').join('');
    const 진행 = Math.max(0, Math.min(3, 의.뗀));
    return '<div class="three-rite" data-three-rite aria-busy="' + 바쁨 + '">' + (위 || '') + '<div class="three-rite-row">'
      + (나 ? '<figure class="three-sig">' + (그림id.test(String(나.id)) ? '<img class="three-sig-img" src="' + 그림길 + 나.id + '-s.webp?v=2" alt="" decoding="async">' : '')
        + '<figcaption>' + (나이름 ? '<b>' + esc(나이름) + '</b>' + (나.이름en ? '<small lang="en">' + esc(나.이름en) + '</small>' : '') : '<b lang="en">' + esc(나.이름en || '') + '</b>') + '</figcaption></figure>' : '')
      + '</div>'
      + (안내 ? '<p class="three-rite-hint" role="status">' + esc(안내) + '</p>' : '')
      + '<div class="three-ritual-table"><div class="three-fan ' + (펼침 ? 'is-open' : 'is-closed') + (움직임 ? ' is-' + 움직임 : '') + '">' + 카드 + '</div></div>'
      + '<div class="three-cut-progress" aria-label="' + esc(글('세점.펼침.나눔수', { n: 진행 })) + '">' + [1, 2, 3].map(n => '<span' + (n <= 진행 ? ' class="is-done"' : '') + ' aria-hidden="true">' + n + '</span>').join('') + '</div>'
      + (단추 ? 단추.replace('<button ', '<button ' + (바쁨 ? 'disabled ' : '')) : '')
      + (왜말 ? '<p class="three-sig-why">' + esc(왜말) + '</p>' : '') + '</div>';
  }
  const 떼기단추of = (글, 속성, n) => '<button type="button" class="btn three-rite-btn" ' + 속성 + '>' + esc(글('세점.펼침.떼기', { n }) || n + ' / 3') + '</button>';
  // 펼친 순간(D3 — 저장 안 함) — 셋째 떼기 뒤 처음 보는 판. 결과(카드칸 · 세 점)는 결과보기를 누른 뒤에.
  //   첫판: 판 그림(차례로 놓임) → 다시가 아니면 끝말 + 결과보기 · 다시면 다시말({카드} = 첫 판 열째) + 섞기
  //   다시의식: 새 나(첫 판 열째 — 늘 바로 · 앞면) + 뒷면 더미 + 떼기 1 · 2 · 3(처음 의식과 같은 꼴 · 같은 글 조각) — 화면에서만(서버가 이미 둘째 판을 냈다 · 누름이 카드를 정하지 않는다)
  //     나 글 자리는 비운다 — 다시말은 바로 앞 첫판 화면에서 읽었다(D3 · COPY-0026 화면 차례 「나.* 글 없음」 · 다시말은 ② 첫판 · ③ 근거 두 곳)
  //   둘판: 둘째 판 그림(차례로 놓임) → 끝말 + 결과보기
  function 펼친칸(r, 글, P, 순) {
    const f = r.펼침, 둘 = 다시됨(f), 단계 = 둘 ? 순.단계 : '첫판';
    if (단계 === '다시의식') return 의식틀('', f.다시.나, 카드이름of(f.다시.나, P), '', 순.움직임, 떼기단추of(글, 'data-three-again-cut', Math.max(0, 순.뗀) + 1), 순, 글);
    const 둘판 = 단계 === '둘판', 다시앞 = 둘 && !둘판, 줄 = 다시앞 ? 다시말of(r, 글, P) : 끝말of(r, 글, P);
    const 단추 = 다시앞
      ? '<button type="button" class="btn three-rite-btn" data-three-again-shuffle>' + esc(글('세점.펼침.섞기') || '⇄') + '</button>'
      : '<button type="button" class="btn three-rite-btn" data-three-reveal-go>' + esc(글('세점.펼침.결과보기') || '↓') + '</button>';
    return '<div class="three-reveal" data-three-reveal>' + 판그림(둘판 ? f.다시.나 : f.나, 둘판 ? f.다시.자리 : f.자리, 다시앞 ? 0 : 10, true)
      + '<div class="three-reveal-foot">' + (줄 ? '<p class="three-reveal-line">' + esc(줄) + '</p>' : '') + 단추 + '</div></div>';
  }
  // 결과(D2) — 궁정 열째(708)면 카드칸 바로 아래 한 줄. 원문은 근거 타로 칸에 이미 찍히는 열째 원문(c.원문)과 같아 따로 찍지 않는다.
  function 궁정줄(r, 글, P) {
    if (!r.펼침.궁정끝) return '';
    const t = 글('세점.펼침.궁정말', { 카드: 카드이름of(끝장of(r), P) });
    return t ? '<p class="three-sp-court">' + esc(t) + '</p>' : '';
  }
  // 근거 안 펼침(D2 — 세점근거칸 타로 칸 h3 바로 다음): 판머리 · 첫 판 그림(움직임 없음) · 첫 자리 목록 · [다시: 다시말 · 다시보기 · 둘째 판 그림 · 둘째 자리 목록] · 끝말.
  //   다시 판을 따로 접지 않는다(근거 접힘 하나 안에 차례로). 열째 강조는 길흉을 정한 판에만. 판 · 자리 목록은 결론 위에 두지 않는다.
  function 펼근거(r, 글, P) {
    const f = r.펼침, 둘 = 다시됨(f), 끝n = 둘 ? 0 : 10, 머리 = 글('세점.펼침.판머리', { 물음: 글('세점.물음말.' + r.물음) });
    let h = '<div class="three-spread">' + (머리 ? '<p class="three-sp-head">' + esc(머리) + '</p>' : '') + 판그림(f.나, f.자리, 끝n, false) + 자리목록(f.자리, 글, P, 끝n);
    if (둘) {
      const 다시말 = 다시말of(r, 글, P), 보기 = 글('세점.펼침.다시보기');
      h += (다시말 ? '<p class="three-sp-again">' + esc(다시말) + '</p>' : '') + (보기 ? '<p class="three-sp-head">' + esc(보기) + '</p>' : '')
        + 판그림(f.다시.나, f.다시.자리, 10, false) + 자리목록(f.다시.자리, 글, P, 10);
    }
    const 끝말 = 끝말of(r, 글, P);
    return h + (끝말 ? '<p class="three-sp-endline">' + esc(끝말) + '</p>' : '') + '</div>';
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
    let 펼친 = null;   // 펼친 순간(D3 — 저장 안 함): { k: 사람|물음|달, 단계: '첫판' | '다시의식' | '둘판', 뗀, 움직임 }. 물음 · 사람을 바꾸면 버린다.
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
          if (섞) 섞.onclick = () => 섞음();
          if (뗌단추) 뗌단추.onclick = () => 뗌(6);
          if (다섞) 다섞.onclick = 다시섞음;
          if (다뗌) 다뗌.onclick = () => 다시뗌(6);
          모두('[data-three-deck-touch]').forEach(b => { b.onclick = () => {
            if (b.disabled) return;
            const i = +b.getAttribute('data-three-deck-touch');
            if (펼친 && 펼친.k === 순간k() && 펼친.단계 === '다시의식') 다시뗌(i);
            else if (의식of().뗀 < 0) 섞음();
            else 뗌(i);
          }; });
          if (결과) 결과.onclick = 결과봄;
          if (새로) 새로.onclick = () => { if (고른) 펼쳐부르기(고른, 순간켬); };
          const 스 = 스크롤할; 스크롤할 = null;
          if (포커스할) { const el = root.querySelector(포커스할); 포커스할 = ''; if (el) try { el.focus(스 ? { preventScroll: true } : undefined); } catch (e) {} }
          // D6 — 화면 안으로(움직임 줄이기면 바로). 가짜 문서(시험 · 검사기)엔 없으면 조용히 넘어간다.
          if (스) { const el = root.querySelector(스.sel); if (el && typeof el.scrollIntoView === 'function') try { el.scrollIntoView({ behavior: 움직임줄임() ? 'auto' : 'smooth', block: 스.block }); } catch (e) {} }
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
      function 의식칸() {
        const 창 = 창말of(지금), 값 = { 창: 달말(창.첫) + ' ~ ' + 달말(창.끝), 물음: 글('세점.물음말.' + 고른), 달: 달말(이번달) };   // 달 = 카드가 말하는 이번 달(결정함 82)
        const 나 = 시그of(prof, 서울날of(clock())), 의 = 의식of();   // 그릴 때마다 시계를 다시 읽는다 — 의식 중에 날이 바뀌어도 서버가 셀 나와 같게(만 40세 생일 자정)
        const 단추 = 의.뗀 < 0
          ? '<button type="button" class="btn three-rite-btn" data-three-shuffle>' + esc(글('세점.펼침.섞기') || '⇄') + '</button>'
          : 떼기단추of(글, 'data-three-cut', 의.뗀 + 1);
        return 의식틀(글('세점.창말', 값) ? '<p class="three-window">' + esc(글('세점.창말', 값)) + '</p>' : '', 나, 카드이름of(나, P), 나 ? 글('세점.펼침.나.' + 나.계급) : '', 의.움직임, 단추, 의, 글);
      }
      // 모든 동작은 끝난 뒤 다음 단계로 진행한다. 질문·사람·화면이 바뀌면 늦은 완료 콜백은 버린다.
      function 손동작(의, 종류, 위치, 마침) {
        if (의.움직임) return;
        const k = 순간k();
        의.위치 = Number.isInteger(위치) ? 위치 : 6;
        if (움직임줄임()) { 마침(); return; }
        의.움직임 = 종류;
        그리기();
        global.setTimeout(() => {
          if (내차례 !== 차례 || k !== 순간k() || (의 !== 의식 && 의 !== 펼친) || root.isConnected === false) return;
          의.움직임 = '';
          마침();
        }, 종류 === 'shuffle' ? 1050 : 640);
      }
      function 섞음() {
        const 의 = 의식of(); if (의.뗀 >= 0 || 의.움직임) return;
        손동작(의, 'shuffle', 6, () => { 의.뗀 = 0; 포커스할 = '[data-three-deck-touch="6"]'; 그리기(); });
      }
      function 뗌(위치) {
        const 의 = 의식of(); if (의.뗀 < 0 || !고른 || 의.움직임) return;
        손동작(의, 'cut', 위치, () => {
          의.뗀++;
          if (의.뗀 >= 3) { 의식 = null; 펼쳐부르기(고른, 순간켬); return; }
          포커스할 = '[data-three-deck-touch="' + 의.위치 + '"]'; 그리기();
        });
      }
      // 다시 펼침도 같은 세 번 나누기. 이미 받은 둘째 판을 보여 주며 결과를 다시 뽑지 않는다.
      function 다시섞음() {
        if (!펼친 || 펼친.k !== 순간k() || 펼친.단계 !== '첫판') return;
        Object.assign(펼친, { 단계: '다시의식', 뗀: -1, 움직임: '' });
        사건('three3_again|' + 고른);
        스크롤할 = { sel: '[data-three-rite]', block: 'nearest' };
        손동작(펼친, 'shuffle', 6, () => { 펼친.뗀 = 0; 포커스할 = '[data-three-deck-touch="6"]'; 그리기(); });
      }
      function 다시뗌(위치) {
        if (!펼친 || 펼친.k !== 순간k() || 펼친.단계 !== '다시의식' || 펼친.뗀 < 0 || 펼친.움직임) return;
        손동작(펼친, 'cut', 위치, () => {
          펼친.뗀++;
          if (펼친.뗀 >= 3) { Object.assign(펼친, { 단계: '둘판', 움직임: '' }); 포커스할 = ''; 스크롤할 = { sel: '[data-three-reveal]', block: 'start' }; 그리기(); return; }
          포커스할 = '[data-three-deck-touch="' + 펼친.위치 + '"]'; 그리기();
        });
      }
      function 결과봄() { 펼친 = null; 포커스할 = '.three-drawn'; 스크롤할 = { sel: '.three-drawn', block: 'start' }; 그리기(); }
      // 펼침 부름 — 몸 + 「펼침: true」(카드 없음). 받은 뒤에만 둔다(부르기 전엔 카드가 없다) — 못 받으면 오류 + 새로 펼침 단추.
      function 펼쳐부르기(q, 순간) {   // 순간 — 받으면 펼친 순간(D3)부터(의식 · 새로 펼침 단추). opt.펼침(시험 · 검사기)이면 바로 결과
        root.innerHTML = 고르기 + 판(물음칸() + '<div class="three-turn-wait" aria-hidden="true"><img src="' + 그림길 + 'back.webp" alt=""></div>' + (글('세점.펼침.기다림') ? '<p class="three-q">' + esc(글('세점.펼침.기다림')) + '</p>' : ''));
        사건('three3_spread|' + q);
        const 받음 = res => {
          if (내차례 !== 차례) return;
          const j = res && res.ok ? res.j : null;
          if (j && j.점 && j.점.타로 && j.물음 === q && j.카드 && j.셈 && j.펼침 && Array.isArray(j.펼침.자리)) {
            판3[q] = { 달: 이번달, 펼침: true, 응답: j }; 둠(키, 판3);   // 같은 달 같은 물음은 이 펼침을 다시 그린다 — 펼친 순간 전에 바로 둔다
            사건('three3_res|' + q + '|' + j.셈.길 + '-' + j.셈.흉);
            if (q !== 고른) return;
            if (순간) {   // 펼친 순간(D3) — 결과보기를 누를 때까지(이 화면에만 · 저장 안 함) · D6 펼친 판을 화면 안으로
              펼친 = { k: 순간k(), 단계: '첫판', 뗀: -1, 움직임: '' };
              포커스할 = ''; 스크롤할 = { sel: '[data-three-reveal]', block: 'start' };
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
        try { p = 부름(Object.assign(몸(q), { 펼침: true })); } catch (e) { 받음({ ok: false, j: { 코드: '연결' } }); return; }
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
          // 결과(D2): 카드칸(펼침이면 머리 = 길흉을 정한 열째) · 궁정말 → 세 점 결론 → 근거 접힘(펼침이면 타로 칸 맨 앞에 판 · 자리 목록 · 끝말) → 할 일 → 다음 카드
          안 += (펼 ? 카드칸(r, 글, P, 글('세점.펼침.끝카드'), ' tabindex="-1"') + 궁정줄(r, 글, P) : 카드칸(r, 글, P)) + 세점결론칸(r, 글) + 세점근거칸(r, 글, 펼 ? 펼근거(r, 글, P) : '') + 세점할일칸(r, 글)
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
        if (k === 고른 && ((의식 && 의식.움직임) || (펼친 && 펼친.움직임))) return;
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
  global.ChaeksaThreeView = { mount, 때말, 날말, 달말, 창말of, 카드들, 섞은일곱, 물음차례, 세점켜짐, 채움, 펼침켜짐, 펼침필수, 시그of, 서울날of, 자리수 };   // 달말 · 채움 — 화면 글 검사기가 글 조각 전부를 보기 값으로 채워 본다(10-31) · 펼침켜짐 · 펼침필수 · 시그of — 펼침 시험 · 검사기
})(typeof window !== 'undefined' ? window : globalThis);
