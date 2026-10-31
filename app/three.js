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
 * 10-31 세 점의 길흉(아래 「세점」 — 결정함 64 ~ 69): 물음 하나 · 카드 한 장 → 타로 · 사주 · 자미 점마다 길흉. Codex 글(세점.물음말)이 오면 이쪽이 켜지고, 그 전엔 옛 판(한 점)을 그린다. ?keys 면 세 점 뼈대. */
(function (global) {
  'use strict';
  const API = 'https://chaeksa-behavior-core.vercel.app/api/three-eyes';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 값 뒤(닫는 따옴표 너머까지) 조사를 값의 받침에 맞춘다 — 「‘{자리}’와」 → 「‘돈과 재산’과」. 사이트 공통 약속 {값|와} 도 받는다(today-core 붙이기와 같은 일).
  const 받침of = s => { const t = String(s).replace(/[^가-힣]+$/, ''); if (!t) return -1; const c = t.charCodeAt(t.length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? c % 28 : -1; };
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
  function 카드칸(r, 글, P) {
    const c = r.카드, 이름 = (P.카드이름 && P.카드이름[c.id]) || c.이름, 그림 = 카드그림(c.id, c.놓임 === '거꾸로');
    return '<div class="three-drawn">' + (글('뽑은카드') ? '<p class="three-drawn-k">' + esc(글('뽑은카드')) + '</p>' : '')
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
  // 물음 하나를 고르고 카드 한 장 → 같은 /api/three-eyes 에 물음을 실어 부른다(비공개 lib/three-points.js): 타로 점(창 24달) · 사주 점(달) · 자미 점(달), 점마다 길흉.
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
    if (k === '타로') { const 창 = 달말(r.창.첫달) + ' ~ ' + 달말(r.창.끝달); return 글('세점.때.타로', { 창 }) || 창; }
    if (!z.달) return '';
    const 때 = 때말(z.때.시작, z.때.끝);
    return 글('세점.때.' + k, { 달: 달말(z.달), 때 }) || 때;
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
  function 세점근거칸(r, 글) {
    const c = r.카드, 원 = r.원문 || {}, 타 = r.점.타로, 사 = r.점.사주, 자 = r.점.자미, 왜 = 키 => 글(키) ? '<p class="three-why2">' + esc(글(키)) + '</p>' : '';
    let h = '<details class="jt-ev three-basis"><summary>' + esc(글('근거')) + '</summary>';
    // 타로 — 붙인 웨이트 낱말(그 물음을 직접 말할 때) · 카드 원문 · 창 원문(901줄)
    h += '<section class="three-eye"><h3>' + esc(점이름of(글, '타로')) + '</h3>' + 왜('세점.왜.타로.' + (타.직접 ? '직접' : '전체'))
      + (타.붙임.length ? '<ul class="three-keys" lang="en">' + 타.붙임.map(x => '<li lang="en">' + esc(x.낱말) + ' <small>(Part III ' + esc(x.줄) + (x.절 ? ' ' + esc(x.절) : '') + ')</small></li>').join('') + '</ul>' : '')
      + '<blockquote class="three-src" lang="en">' + esc(c.원문) + '</blockquote>'
      + '<p class="three-ref" lang="en">Waite, The Pictorial Key to the Tarot · Part III ' + esc(c.줄) + (c.절 === '§4' ? ' §4' : '') + ' · ' + esc(c.이름en) + '</p>'
      + (원.창 ? '<blockquote class="three-src" lang="en">' + esc(원.창.글) + '</blockquote><p class="three-ref" lang="en">' + esc(원.창.줄) + '</p>' : '') + '</section>';
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

  function 세점mount(root, opt, P, 글) {
    const people = opt.people || global.ChaeksaPeople, clock = opt.clock || (() => new Date()), track = 'track' in opt ? opt.track : global.ChaeksaTrack;
    const 부름 = opt.부름 || (body => global.fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(res => res.json().then(j => ({ ok: res.ok, j }), () => ({ ok: false, j: { 코드: '계산' } }))));
    const 사건 = name => { try { if (track) track.event(name); } catch (e) {} };
    const 머리 = '<div class="jt-head"><h1 class="three-title">' + esc(글('세점.이름')) + '</h1></div>' + (글('세점.물음') ? '<p class="three-q">' + esc(글('세점.물음')) + '</p>' : '');
    const 판 = (안) => '<section class="card jt-ch three-card">' + 머리 + (안 || '') + '</section>';
    if (!people) { root.innerHTML = 판(); return; }
    let selected = '', 차례 = 0, 고른 = 물음차례.includes(opt.물음) ? opt.물음 : '';
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
        if (s) { s.onchange = e => { selected = e.target.value; 고른 = ''; render(true); }; if (포커스) try { s.focus(); } catch (e) {} }
        const 넣기 = root.querySelector('[data-three-person-edit]');
        if (넣기) 넣기.onclick = () => { try { const b = global.document.getElementById('btnPerson'); if (b) b.click(); } catch (e) {} };
        const 모두 = sel => (root.querySelectorAll ? Array.from(root.querySelectorAll(sel)) : []);
        모두('[data-three-q]').forEach(b => { b.onclick = () => 고름(b.getAttribute('data-three-q')); });
        모두('[data-three-card]').forEach(b => { b.onclick = () => 뽑음(+b.getAttribute('data-three-card')); });
        const 다시 = root.querySelector('[data-three-retry]');
        if (다시) 다시.onclick = () => { const s3 = 판3 && 판3[고른]; if (s3 && s3.카드) 부르기(고른, s3.카드); };
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
        const 창 = 창말of(지금), 값 = { 창: 달말(창.첫) + ' ~ ' + 달말(창.끝), 물음: 글('세점.물음말.' + 고른) };
        return '<div class="three-deck">' + (글('세점.창말', 값) ? '<p class="three-window">' + esc(글('세점.창말', 값)) + '</p>' : '')
          + (글('세점.뽑기말', 값) ? '<p class="three-pick">' + esc(글('세점.뽑기말', 값)) + '</p>' : '')
          + '<div class="three-backs">' + 덱.map((x, i) => '<button type="button" class="three-back" data-three-card="' + i + '" aria-label="' + esc(글('카드읽기', { n: i + 1 }) || (i + 1)) + '">' + 뒷면그림 + '</button>').join('') + '</div></div>';
      }
      function 그리기() {
        if (내차례 !== 차례) return;
        const 상태 = 상태of(), s = 고른 ? 판3[고른] : null, r = s && s.응답;
        let 안 = 물음칸(), 뒤 = '';
        if (상태 === '그대로') {
          안 += 카드칸(r, 글, P) + 세점결론칸(r, 글) + 세점근거칸(r, 글) + 세점할일칸(r, 글)
            + (글('세점.다음카드', { 날: 날말(r.다음카드) }) ? '<p class="three-next">' + esc(글('세점.다음카드', { 날: 날말(r.다음카드) })) + '</p>' : '');
          const Y = global.ChaeksaYaksok, 오늘이름 = (Y && Y.이름 && Y.이름('today')) || '';
          if (글('끝말') || 오늘이름) 뒤 = '<div class="three-end">' + (글('끝말') ? '<p>' + esc(글('끝말')) + '</p>' : '') + (오늘이름 ? '<a href="#today">' + esc(오늘이름) + ' <span aria-hidden="true">→</span></a>' : '') + '</div>';
        } else if (상태 === '새카드') 안 += 덱칸();
        else if (상태 === '다시부름') 안 += '<div class="three-need"><p>' + esc(글('오류.연결')) + '</p><button type="button" class="btn ghost small" data-three-retry>' + esc(글('다시') || '↻') + '</button></div>';
        root.innerHTML = 고르기 + 판(안) + 뒤;
        달기();
        try { if (r && 상태 === '그대로' && track && track.watchEnd) track.watchEnd(root, 'three3_end'); } catch (e) {}
      }
      function 고름(k) {
        if (!물음차례.includes(k)) return;
        고른 = k; 판3._마지막 = k; 둠(키, 판3);
        사건('three3_q|' + k);
        if (상태of() === '다시부름') { 부르기(k, 판3[k].카드); return; }
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
  global.ChaeksaThreeView = { mount, 때말, 날말, 달말, 창말of, 카드들, 섞은일곱, 물음차례, 세점켜짐, 채움 };   // 달말 · 채움 — 화면 글 검사기가 글 조각 전부를 보기 값으로 채워 본다(10-31)
})(typeof window !== 'undefined' ? window : globalThis);
