/* 그 사람 사용설명서 — 앱 탭(data-tab="pair", 10-02 새 판 v0.3). 홈 「궁합」 칸에서 들어온다.
 * 넣는 것은 그 사람 생년월일시 하나(10-02 사장님 「그 사람만」) — 넣어 둔 사람 가운데 고른다(정통궁합과 같은 사람 칩 · 「+ 사람 추가」).
 * 계산 · 글은 비공개 서버(/api/manual)가 한다 — 이 파일엔 판정 · 표 · 문턱이 없다. 서버가 보낸 글만 그린다.
 * 무료 = 가장 궁금할 질문 세 개(연락 · 애정 표현 · 서운함)의 맞히기 한 줄(토큰 0). 전체(열두 단계 · 장마다 맞히기 · 왜 · 나에게 비치는 모습)는
 * 출시 기념가 19,900원(love_pair). 결제 열쇠는 서버가 준 값만 쓴다(그 사람 생일로 만든 알아볼 수 없는 값 — 주문에 생일이 남지 않는다).
 * 생일은 주소에 싣지 않는다(POST 본문). 받은 전체 결과는 이 기기에 남기고, 서버 보관본으로 폰 · PC 어디서든 같은 결과.
 * 화면 글은 작가가 쓴 것(아래 글 표) — 고칠 땐 글 표 한 곳만. 「당신」은 쓰지 않는다(10-02 사장님).
 * 다만 상품 약속(미리 보는 것 · 만드는 시간 · 결제하면 받는 것 · 보관 · 환불)은 상품 약속 장부(yaksok.js pair 줄) 한 곳이다 — pay.html 과 같은 말. */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var 동의키 = 'chaeksa.manualConsent', 결과키 = 'chaeksa.manual.', 고른키 = 'chaeksa.pair.pick';
  var 표지그림 = ['art/story-friend-to-lover.webp', [1024, 1536], '#e0dedf', '#100d0e'];   // 10-02 사장님 「적절한 삽화로 재배치」 — 이어폰을 나눠 끼고 그 사람을 몰래 바라보는 장면(짝짓기 일꾼 추천)
  // 질문마다 배경 삽화(10-02 사장님 「웹툰 + 미연시 · 질문에 어울리는 삽화」) — 질문 id: [그 사람이 남자일 때, 여자일 때](art/ 이름, .webp 뺌).
  // 그림 보기 일꾼 8명이 삽화 162장에 장면 설명을 달고, 짝짓기 일꾼이 질문 47개에 골랐다(10-02). 바꾸려면 이 표 한 줄만.
  var 장그림 = {
    q01: ['story-ask-favor', 'ss-her'],
    q02: ['story-he-likes', 'story-office-crush'],
    q03: ['ss-give', 'ss-meet-party'],
    q04: ['ss-meet-app', 'ss-meet-app'],
    q05: ['ss-sseom-4', 'story-reply'],
    q06: ['ss-sseom-3', 'story-confess'],
    q07: ['story-meet-friends', 'story-friend-money'],
    q08: ['story-contact', 'ss-early-2'],
    q09: ['ss-early-1', 'jt-16-alone-together-f'],
    q10: ['story-long-distance', 'jt-06-steady-f'],
    q11: ['story-biz-partner', 'story-drunk-text'],
    q12: ['jt-12-money-year-m', 'ss-her'],
    q13: ['jt-14-in-love-m', 'story-blind-date'],
    q14: ['story-money', 'story-money'],
    q15: ['story-big-buy', 'jt-11-money-stay-f'],
    q16: ['jt-11-money-stay-m', 'story-lend'],
    q17: ['story-say-love', 'story-say-love'],
    q18: ['story-anniversary', 'story-gift'],
    q19: ['story-first-touch', 'story-first-touch'],
    q20: ['ss-steady-4', 'ss-sseom-2'],
    q21: ['jt-16-alone-together-m', 'story-sok'],
    q22: ['story-cold', 'story-hurt'],
    q23: ['story-geunamja', 'ss-then-now'],
    q24: ['ss-shake-3', 'ss-early-4'],
    q25: ['ss-steady-2', 'ss-steady-2'],
    q26: ['ss-early-3', 'ss-early-3'],
    q27: ['ss-shake-2', 'ss-shake-1'],
    q28: ['story-fight', 'story-fight'],
    q29: ['story-maeum', 'story-hold'],
    q30: ['story-ask-favor', 'story-apology-text'],
    q31: ['story-jealous', 'ss-meet-club'],
    q32: ['ss-me', 'ss-again-2'],
    q33: ['ss-meet-office', 'ss-meet-run'],
    q34: ['ss-meet-party', 'story-jealous'],
    q35: ['story-maeum', 'story-sns'],
    q36: ['ss-marry-3', 'story-geunamja'],
    q37: ['ss-steady-1', 'ss-steady-3'],
    q38: ['ss-then-now', 'story-breakup'],
    q39: ['ss-again-1', 'story-get-back'],
    q40: ['story-he-likes', 'ss-meet-blind'],
    q41: ['ss-marry-1', 'ss-marry-3'],
    q42: ['story-marry-talk', 'story-kid-talk'],
    q43: ['ss-marry-2', 'ss-marry-2'],
    q44: ['story-contract', 'story-spouse-money'],
    q45: ['ss-steady-3', 'ss-early-5'],
    q46: ['ss-me', 'story-friend-drift'],
    q47: ['story-sanggyeonrye', 'story-parents-talk']
  };
  function 그림키(c, 성) { if (c.bg) return c.bg; var p = 장그림[c.id]; return p ? p[성 === 'F' ? 1 : 0] : null; }
  function 삽화(키) {
    return 키 ? '<img src="art/' + esc(키) + '.webp" alt="" loading="lazy" decoding="async" style="display:block;width:100%;aspect-ratio:4/5;object-fit:cover;object-position:50% 30%;border-radius:var(--r2);margin:0 0 12px">' : '';
  }
  // 장면으로 보기(미연시, ssom-vn.html?m=1) — 받은 글을 그대로 넘긴다(주소에 싣지 않고 이 탭 sessionStorage 로만).
  function 장면으로(장들, 그이름, 성) {
    try {
      sessionStorage.setItem('chaeksa.manualVn', JSON.stringify({ name: 그이름, chapters: 장들.map(function (c) {
        return { id: c.id, stage: c.stage, question: c.question, kind: c.kind, sure: c.sure, t: c.t || c.line, a: c.a || '', s: c.s || '', bg: 그림키(c, 성) || 'story-friend-to-lover' };
      }) }));
    } catch (e) {}
    location.href = 'ssom-vn.html?m=1';
  }

  // ── 화면 글(작가 chaeksa-writer, 10-02) ──
  // 예시 장(example) = 사장님 명식으로 실제로 나온 장 그대로(10-02 견본 2판 q08, 생년월일은 안 드러냄).
  var 글 = {
    "cover_sub": "태어날 때 봉인된 그 사람의 연애 버릇",
    "intro": [
      {
        "head": "연애하며 하나하나 물어봐야 했던 것들",
        "body": "연락은 얼마나 자주 할지, 서운하면 말할지 삼킬지, 다투고 나면 먼저 연락해 올지. 연애를 하다 보면 그 사람에게 하나하나 묻고 싶은 게 생겨요. 그런데 대놓고 묻기는 어렵고, 대부분은 겪어 보고 나서야 알게 돼요.\n\n그 사이에 오해가 쌓이고, 같은 일로 몇 번씩 부딪혀요. 그 사람 사용설명서는 그 사람의 생년월일시로 이 물음들의 답을 미리 가늠해서, 이런 시행착오를 줄이려고 만들었어요."
      },
      {
        "head": "열두 단계, 장마다 세 가지",
        "body": "썸에서 시작해 고백과 시작 · 연락 · 데이트와 돈 · 애정 표현 · 서운함과 다툼 · 화해 · 질투와 믿음 · 권태 · 이별과 재회 · 결혼과 미래 · 가족과 친구까지, 연애를 열두 단계로 나눴어요.\n\n단계마다 「그 사람은 ~할까?」 하고 묻는 장이 있고, 한 장에 세 가지를 적어 드려요.\n그 사람이 그 순간 어떻게 할지 한 줄\n왜 그렇게 하는지\n그 행동이 나에게 어떻게 비칠 수 있는지"
      },
      {
        "head": "책사가 실제로 만든 한 장",
        "body": "어느 한 사람의 생년월일시를 넣어 책사가 실제로 만든 장을, 고치지 않고 그대로 옮겼어요.\n\n결제하면 이런 장을 열두 단계에 걸쳐 받아요."
      },
      {
        "head": "SSS급 행동심리추론 알고리즘",
        "body": "책사가 직접 만든 고유의 알고리즘으로, 생년월일시만 가지고 그 사람의 행동심리를 추론해요.\n\n나올 수 있는 사주팔자 518,400가지를 하나도 빼지 않고 전부 셌어요. 그 사람이 보통 사람들과 어디가 다른지 알아보려고요. 그리고 연애와 행동을 다룬 심리학 연구에서 고른 심리 개념 25가지로, 장마다 어떤 마음이 그 사람을 움직이는지 따져요.\n\n같은 생년월일시를 넣으면 언제 넣어도 판단은 늘 같아요.\n\n모든 장을 똑같이 자신 있게 말하지 않아요. 장마다 「뚜렷함 · 그런 편 · 두 마음 · 정해지지 않음」 표시를 붙여서, 어디까지 믿어도 되는지 함께 알려 드려요."
      },
      {
        "head": "이렇게 열려요",
        "body": "그 사람의 생년월일시만 있으면 돼요.",
        "yaksok": true
      }
    ],
    "example": {
      "question": "그 사람은 연인에게 하루에도 자주 연락할까?",
      "sure": "lean",
      "t": "할 말이 있을 때만 연락하는 편이에요",
      "a": "가까운 사이에도 자기 영역을 지키고, 그 순간의 당김을 한 번 누르는 힘이 커서 할 말이 있을 때 연락해요. 남는 시간을 연인과 보내고 싶은 마음도 있지만, 까닭이 있어야 움직이는 마음이 높아 필요할 때만 연락하는 쪽으로 기울어요.",
      "s": "연인의 영역을 존중하는 태도가 상대에게는 사랑하지 않는다고 비춰질 수 있어요."
    },
    "disclaimer": "심리검사가 아니라, 생년월일시로 그 사람의 행동을 가늠하는 책사의 추론이에요. 다 맞지는 않아도, 미리 짐작하고 만나면 같은 일로 덜 부딪혀요.",
    "consent": "그 사람의 생년월일시를 계산 서버로 보내는 데 동의해요. 생년월일은 저장하지 않고 알아볼 수 없게 바꾼 값만 남으며, AI 에는 생년월일이 가지 않아요.",
    "go_button": "무료로 질문 3개 먼저 풀기",
    "login_line": "카카오로 로그인하면 질문 3개가 바로 풀려요. 로그인하고 돌아오면 이 화면으로 다시 와요.",
    "preview_head": "먼저 풀린 질문 3개",
    "preview_note": "왜 그런지와 나에게 비치는 모습은 결제하면 열려요.",
    "pay_head": "아직 봉인된 장 {n}개",
    "pay_button": "{price} 결제하고 봉인 풀기",
    "making": "그 사람의 봉인을 푸는 중이에요. {시간} 걸려요. 이 화면을 그대로 두세요.",
    "done": "다 됐어요. 모두 {n}장이에요.",
    "result_head": "{name} 사용설명서",
    "result_lead": "장마다 붙은 표시는 그 사람 안에서 그 마음이 얼마나 분명한지를 알려 줘요.\n뚜렷함 — 이쪽 마음이 분명해서, 이렇게 할 가능성이 커요.\n그런 편 — 대체로 이쪽으로 기울어요.\n두 마음 — 두 마음이 함께 있어서, 이렇게 할 수도 있고 저렇게 할 수도 있어요.\n정해지지 않음 — 이 질문에는 정해진 쪽이 없어서, 상황에 맞게 행동할 거예요.",
    "badges": {
      "sharp": "뚜렷함",
      "lean": "그런 편",
      "mixed": "두 마음",
      "weak": "정해지지 않음"
    },
    "why_label": "왜",
    "seen_label": "나에게 비치는 모습"
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 문단(s) { return String(s || '').split(/\n\s*\n/).filter(Boolean).map(function (p) { return '<p style="margin:0 0 8px">' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function 읽기(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function 쓰기(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function 지우기(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function 생일(p) {
    var h = p.hour == null || p.hour === '' ? null : +p.hour;
    return { year: +p.year, month: +p.month, day: +p.day, hour: h, minute: h == null ? null : +(p.minute || 0), gender: p.gender === 'F' ? 'F' : 'M',
      longitude: p.longitude == null ? null : +p.longitude, tzOffset: p.tzOffset == null ? null : +p.tzOffset };
  }
  function 표(b) { return [b.year, b.month, b.day, b.hour, b.minute, b.gender, b.longitude, b.tzOffset].join('|'); }
  function 이름(p) { var n = p && p.name ? String(p.name) : ''; return n && n !== '이름 없음' ? n : '그 사람'; }
  // 로그인 표(토큰)를 실어 보낸다 — 서버는 로그인한 사람만 받는다. 실패하면 서버 본문(결제 열쇠 등)을 오류에 붙여 둔다.
  function post(path, body) {
    var C = global.ChaeksaCloud;
    return Promise.resolve(C && C.token ? C.token() : null).catch(function () { return null; }).then(function (t) {
      var h = { 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t;
      return fetch(API + path, { method: 'POST', headers: h, body: JSON.stringify(body) })
        .catch(function () { throw new Error('연결이 끊겼어요. 잠시 뒤 다시 해 주세요.'); });
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.error || '잠시 뒤 다시 해 주세요.'); er.status = r.status; er.body = j; throw er; } return j; }); });
  }
  function 로그인하러(pick) {
    try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, hash: '#pair', pick: pick ? ['pairPick', pick] : null, at: Date.now() })); } catch (e) {}
    // 10-03 네이버가 켜졌으면 고르기(cloud.js 로그인고르기)
    try { const C = global.ChaeksaCloud; if (C.로그인고르기) C.로그인고르기(); else C.signInWith('kakao'); return true; } catch (e) { 지우기('chaeksa.return'); return false; }
  }

  // 단계(또는 맛보기) 하나를 글 머리 띠로 — 그림은 장마다 삽화가 맡는다. love.js 가 없으면 글 머리로.
  function 무그림() { var LV = global.ChaeksaLoveView; return (LV && LV.기본그림) || [null, null, '#efe9ec', '#221f45']; }
  function 띠들(묶음들) {   // [{머리, 그림, html}] → 이어지는 바탕 띠
    var LV = global.ChaeksaLoveView;
    if (!LV || !LV.장머리) return 묶음들.map(function (m) { return '<h3 class="doc-h">' + esc(m.머리) + '</h3>' + m.html; }).join('');
    return '<div class="lv-flow">' + 묶음들.map(function (m, i) {
      return '<div class="lv-ch" style="' + LV.띠(m.그림, 묶음들[i + 1] ? 묶음들[i + 1].그림 : null) + '">' + LV.장머리(m.그림, m.머리, '', false) + m.html + '</div>';
    }).join('') + '</div>';
  }

  // 장마다 뚜렷함 표시(10-02 사장님) — 서버가 정한 kind · sure 만 옮긴다.
  function 표시키(c) { return c.kind === 'side' ? (c.sure === 'sharp' ? 'sharp' : 'lean') : (c.kind === 'weak' ? 'weak' : 'mixed'); }
  function 표시(c) {
    var k = 표시키(c), 색 = k === 'sharp' ? 'var(--seal, #8c2f23)' : 'var(--ink2, #6a645c)';
    return '<span style="display:inline-block;font-size:var(--t1);font-weight:700;line-height:1.6;padding:0 9px;border-radius:var(--r3);border:1px solid ' + 색 + ';color:' + 색 + '">' + esc(글.badges[k]) + '</span>';
  }
  // 한 장 — 질문 · 표시 · 맞히기 · (왜 · 나에게 비치는 모습)
  function 장(c, 끝, 성) {
    return '<section class="card"' + (c.id ? ' id="mn-' + esc(c.id) + '"' : '') + '>' + 삽화(그림키(c, 성)) + '<p class="hint" style="margin:0 0 6px">' + esc(c.question) + '</p>'
      + '<p style="margin:0 0 6px">' + 표시(c) + '</p><p class="lv-t">' + esc(c.t || c.line) + '</p>'
      + (c.a ? '<p class="hint" style="margin:10px 0 2px"><b>' + esc(글.why_label) + '</b></p><p style="margin:0">' + esc(c.a) + '</p>' : '')
      + (c.s ? '<p class="hint" style="margin:10px 0 2px"><b>' + esc(글.seen_label) + '</b></p><p style="margin:0">' + esc(c.s) + '</p>' : '')
      + (끝 || '') + '</section>';
  }

  function 화면이름() { var Y = global.ChaeksaYaksok; return (Y && Y.이름('pair')) || 'SSS급 그 사람 사용설명서'; }   // 문의 메일 제목에 싣는 화면 이름

  // 다 읽은 뒤 갈 곳(10-02) — 전에는 「← 홈」뿐이었다. 그 사람을 읽었으니 이번엔 내 차례(사랑할 때만 나오는 당신) + 같은 그 사람과 나란히 보는 궁합 둘.
  // 이름 · 한 줄 · 딱지는 상품 약속 장부(yaksok.js)에서 — 사랑할 때만 나오는 당신 딱지는 「예시 보기 · 값」(무료라고 쓰지 않는다, 10-02 사장님).
  function 끝칸() {
    var Y = global.ChaeksaYaksok;
    var 이름 = (Y && Y.이름('love')) || '사랑할 때만 나오는 당신', 한줄 = Y ? Y.홈한줄('love') : '', 딱지 = Y ? Y.딱지html('love') : '';
    var 궁합 = ['ssom', 'chongnon'].map(function (k) {
      var n = Y && Y.이름(k); if (!n) return '';
      var t = Y.딱지글(k);
      return '<a href="#' + k + '" data-pair-next="' + k + '">' + esc(n) + '</a>' + (t ? ' (' + esc(t) + ')' : '');
    }).filter(Boolean).join(' · ');
    return '<section class="card lv-next"><p class="lv-t">그 사람 앞에서 나는 어떤가</p>'
      + '<p class="hint" style="margin:0 0 10px">그 사람을 읽었으니 이번엔 내 차례예요. 「' + esc(이름) + '」' + (한줄 ? ' — ' + esc(한줄) + '.' : '') + '</p>'
      + '<button class="btn" type="button" data-pair-next="love" style="width:100%">연애할 때 나는 어떤지 보기' + (딱지 ? ' — ' + 딱지 : '') + '</button>'
      + (궁합 ? '<p class="hint" style="margin:12px 0 0">그 사람과 나를 나란히 놓고 보기 — ' + 궁합 + '</p>' : '')
      + '</section>';
  }
  // 끝칸 단추 · 링크 — 앱 안이면 그 탭으로(내 생년월일이 없으면 app.js 들어가기가 먼저 받는다). 궁합 둘은 같은 그 사람을 골라 둔다.
  function 끝칸잇기(box, 그id) {
    var Y = global.ChaeksaYaksok; if (Y && Y.값채우기) Y.값채우기(box);
    Array.prototype.forEach.call(box.querySelectorAll('[data-pair-next]'), function (a) {
      a.onclick = function (e) {
        var k = a.getAttribute('data-pair-next');
        e.preventDefault();
        if (k !== 'love' && 그id && typeof global.책사궁합고르기 === 'function') global.책사궁합고르기(그id);
        if (typeof global.책사들어가기 === 'function') global.책사들어가기(k); else location.hash = '#' + k;
      };
    });
  }

  // 상품 약속 장부(yaksok.js pair 줄) — 미리 보는 것 · 만드는 때와 시간 · 결제하면 받는 것 · 보관 · 환불은 장부 한 곳에서 읽는다(10-02).
  // pay.html 「무엇을 사나」와 같은 말이 된다. 여기(글 표)에 다시 적지 않는다.
  function 약() { var Y = global.ChaeksaYaksok; return (Y && Y.줄('pair')) || {}; }
  function 값채우기(root) { var Y = global.ChaeksaYaksok; if (Y) Y.값채우기(root); }
  // 「이렇게 열려요」 칸 — 작가 첫 문장(글 표 body) 뒤에 장부의 미리 · 값 · 보관 · 환불. 값 자리는 상품표(products)에서 채운다.
  function 열림칸(s) {
    var Y = global.ChaeksaYaksok, r = 약();
    return 문단(s.body) + 문단(r.미리)
      + '<p style="margin:0 0 8px">나머지 장과, 장마다 왜 그런지 · 나에게 비치는 모습은 결제하면 열려요' + (Y ? Y.값자리('love_pair', '(', ')') : '') + '.</p>'
      + 문단(r.보관 ? r.보관 + '.' : '') + 문단(r.환불);
  }

  // 소개(작가 다섯 칸) — 3번 칸 뒤에 예시 장 한 장. 다섯째 칸(yaksok)은 장부에서 읽는다. 넣은 뒤 값채우기(그 칸)를 부른다.
  function 소개() {
    var html = '';
    (글.intro || []).forEach(function (s, i) {
      if (s.yaksok) { html += '<section class="card"><h3 class="doc-h">' + esc(s.head) + '</h3>' + 열림칸(s) + '</section>'; return; }
      var 문들 = String(s.body || '').split(/\n\s*\n/), 뒤 = i === 2 && 문들.length > 1 ? 문들.pop() : '';   // 3번 칸: 마지막 문단은 예시 장 뒤에(작가 메모)
      html += '<section class="card"><h3 class="doc-h">' + esc(s.head) + '</h3>' + 문단(문들.join('\n\n')) + '</section>';
      if (i === 2) html += 장({ question: 글.example.question, kind: 'side', sure: 글.example.sure, t: 글.example.t, a: 글.example.a, s: 글.example.s, bg: 그림키({ id: 'q08' }, 'M') }) + (뒤 ? '<section class="card">' + 문단(뒤) + '</section>' : '');
    });
    return html + (글.disclaimer ? '<p class="hint" style="margin:0 0 12px;text-align:center">' + esc(글.disclaimer) + '</p>' : '');
  }

  // 전체 결과 — 열두 단계 차례(서버가 보낸 차례 그대로) · 장마다 표시. 반응 단추(맞아요 / 아니에요)는 넣지 않는다(10-02 사장님).
  function 전체(box, 저장, 키, 그이름, 성, 그id) {
    var 장들 = 저장.chapters || [], 수 = { sharp: 0, lean: 0, mixed: 0, weak: 0 };
    장들.forEach(function (c) { 수[표시키(c)]++; });
    var LV = global.ChaeksaLoveView;   // 이름은 표지에 한 번만(docs/79) — 표지가 있으면 카드 머리는 뺀다
    var html = '<section class="card">' + (LV && LV.그림 ? '' : '<h3 class="doc-h">' + esc(글.result_head.replace('{name}', 그이름)) + '</h3>')
      + '<p style="margin:0 0 8px">' + ['sharp', 'lean', 'mixed', 'weak'].filter(function (k) { return 수[k]; }).map(function (k) { return esc(글.badges[k]) + ' ' + 수[k]; }).join(' · ') + '</p>'
      + '<button class="btn" id="mnVn" type="button" style="width:100%;margin:0 0 12px">장면으로 보기</button>'
      + '<p class="hint" style="margin:0">' + esc(글.result_lead).replace(/\n/g, '<br>') + '</p></section>';
    var 묶음들 = [];
    장들.forEach(function (c) {
      var 끝 = 묶음들[묶음들.length - 1];
      if (!끝 || 끝.머리 !== c.stage) { 끝 = { 머리: c.stage, 그림: 무그림(), html: '' }; 묶음들.push(끝); }
      끝.html += 장(c, '', 성);
    });
    box.innerHTML = html + 띠들(묶음들) + 끝칸();   // 맨 끝 — 다 읽은 뒤 갈 곳(10-02)
    var vn = box.querySelector('#mnVn'); if (vn) vn.onclick = function () { 장면으로(장들, 그이름, 성); };
    끝칸잇기(box, 그id);
    var 표지n = document.getElementById('prCoverN'), 표지k = document.getElementById('prCoverK');
    if (표지n) {
      표지n.textContent = 글.result_head.replace('{name}', 그이름); if (표지k) 표지k.textContent = '사용설명서';
      var 표지s = document.getElementById('prCoverS'); if (표지s) { 표지s.remove(); if (표지n.parentNode) 표지n.parentNode.classList.remove('has-s'); }
    }
  }

  // 맛보기 — 서버가 준 무료 세 질문의 맞히기 한 줄(왜 · 비춰짐 없음).
  function 맛보기(box, pv, 그이름, 성) {
    var 카드들 = (pv.cards || []).map(function (c) { return 장(c, '', 성); }).join('');
    box.innerHTML = 카드들 ? 띠들([{ 머리: 글.preview_head, 그림: 무그림(), html: 카드들 + '<p class="hint" style="margin:0 0 10px">' + esc(글.preview_note) + '</p>'
      + '<button class="btn ghost" id="mnVnFree" type="button" style="width:100%;margin:0 0 12px">이 3개를 장면으로 보기</button>' }]) : '';
    var vn = box.querySelector('#mnVnFree'); if (vn) vn.onclick = function () { 장면으로(pv.cards || [], 그이름, 성); };
  }

  // 결제 상자 — 값은 서버 상품표(products · love_pair)에서 받아 단추에 적는다(pay.js 원칙: 값은 한 곳, 줄 그은 정가 없음).
  // 청약철회 안내와 [필수] 동의는 연애 속의 나 잠금상자와 같은 말 — 체크 전에는 결제를 열지 않는다.
  function 결제상자(box, 열쇠, 남은, pick) {
    var Y = global.ChaeksaYaksok, 만듦 = Y ? Y.만듦글('pair') : '', 받는것 = Y ? Y.받는것목록('pair') : [];   // 장부 pair 줄
    box.innerHTML = '<section class="card"><h3 class="doc-h">' + esc(글.pay_head.replace('{n}', 남은 > 0 ? 남은 : '')) + '</h3>'
      + (만듦 ? '<p style="margin:0 0 10px">' + esc(만듦) + '</p>' : '')
      + '<p style="margin:0 0 4px"><b>결제하면 받는 것</b></p><ul style="margin:0 0 10px;padding-left:20px;line-height:1.7">'
      + 받는것.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
      + '<div id="prBuyWrap"><p style="margin:0 0 6px;font-size:var(--t1);line-height:1.7;color:var(--ink2)">결제하면 바로 열리는 디지털 콘텐츠입니다. '
      + '열람이 시작되면 청약철회(결제 후 7일 안 취소)가 제한될 수 있고, 열람 전에는 전액 환불됩니다.</p>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;font-size:var(--t1);line-height:1.7;color:var(--ink);cursor:pointer;margin:0 0 10px">'
      + '<input type="checkbox" id="prAgree" style="margin-top:4px;width:auto;flex:none">'
      + '<span><b>[필수]</b> 위 내용을 확인했고 동의합니다. (<a href="terms.html#refund" target="_blank" rel="noopener">환불 규정</a>)</span></label>'
      + '<button class="btn" id="prBuy" type="button" style="width:100%">' + esc(글.pay_button.replace('{price}', '출시 기념가 19,900원')) + '</button>'
      + '<p class="hint" id="prPaySay" style="margin:8px 0 0"></p><div id="prPayErr"></div></div>'
      // 10-02 개편 3묶음 — 결제 전에 누가 만들고 어떻게 계산하는지 확인하는 길(새 탭이라 보던 맛보기는 그대로)
      + '<p class="hint" style="margin:10px 0 0;text-align:center"><a href="about.html" target="_blank" rel="noopener" style="color:var(--ink3)">누가 만들고 어떻게 계산하나요? — 책사 소개 →</a></p></section>';
    var btn = box.querySelector('#prBuy'), say = box.querySelector('#prPaySay'), 막힘칸 = box.querySelector('#prPayErr'), P = global.ChaeksaPay;
    if (P && P.product) P.product('love_pair').then(function (p) {
      if (!btn.isConnected || btn.dataset.busy) return;
      if (p && p.amount) btn.textContent = 글.pay_button.replace('{price}', P.값 ? P.값(p) : '출시 기념가 ' + P.won(p.amount));
      else { btn.disabled = true; say.textContent = '온라인 결제는 준비 중이에요. 열리는 대로 이 자리에서 바로 열 수 있어요.'; }
    }).catch(function () {});
    btn.onclick = function () {
      if (btn.dataset.busy) return;
      var ok = box.querySelector('#prAgree');
      if (!ok || !ok.checked) { say.textContent = '위 [필수] 칸에 체크해 주셔야 결제할 수 있어요.'; return; }
      막힘칸.innerHTML = '';
      var C = global.ChaeksaCloud; P = global.ChaeksaPay;
      if (!P || !P.buy) { say.textContent = '결제 화면을 불러오지 못했어요. 새로고침해 주세요.'; return; }
      if (!열쇠) { say.textContent = '처음부터 다시 해 주세요.'; return; }
      쓰기(고른키, pick);   // 결제하고 돌아오면 같은 사람으로
      if (!(C && C.signedIn && C.signedIn())) { if (!로그인하러(pick)) say.textContent = '로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.'; return; }
      try { global.ChaeksaTrack && global.ChaeksaTrack.event && global.ChaeksaTrack.event('pay'); } catch (e) {}
      var 원래 = btn.textContent;
      btn.dataset.label = 원래; btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = '결제창을 여는 중…'; say.textContent = '';
      Promise.resolve().then(function () { return P.buy('love_pair', 열쇠, (P.고른결제사 && P.고른결제사(box.querySelector('#prBuyWrap'))) || 'kakao'); })   // 10-03 결제 수단 칸
        .catch(function (e) { return { ok: false, message: String((e && e.message) || e) }; })
        .then(function (r) {
          delete btn.dataset.busy; btn.disabled = false; btn.textContent = 원래;
          if (r && r.ok === false && !r.closed) {   // 10-02 공용 오류 상자(oryu.js) — 그 파일이 없으면 예전처럼 한 줄
            var O = global.ChaeksaOryu, 말 = r.message || '결제창을 열지 못했어요.';
            if (O) { say.textContent = ''; O.결제(막힘칸, 말, 화면이름(), function () { btn.click(); }); } else say.textContent = 말;
          }
        });
    };
    // 결제가 아직 시험 모드면(손님은 살 수 없다) 값 단추 위에 「결제는 곧 열려요」 한 줄을 단다(10-03 카카오페이 심사 — 단추는 그대로). 갈림은 pay.js 곧열림 하나.
    if (P && P.곧열림자리) P.곧열림자리(box.querySelector('#prBuyWrap'));
  }

  // profile(내 생일)은 받기만 한다 — 이 상품은 그 사람 생일 하나만 쓴다(10-02). 목록은 넣어 둔 사람 전부(다른 사람이 앞, 나는 맨 뒤 「· 나」).
  // 「나」는 「나」로 넣은 사람(isSelf)이다 — 보는 사람(active)이 아니다. 내 생일 없이 그 사람부터 넣은 손님(app.js 들어가기 → 그 사람 칸)은
  // 그 사람이 보는 사람이 되지만 「나」는 아니다(10-02 people.js — 전에는 첫 사람이면 「나」로 잡혀 그 사람 옆에 「· 나」가 붙었다).
  function 그리기(el, profile) {
    if (!el) return;
    var PP = global.ChaeksaPeople;
    if (!PP) {   // 사람 목록(people.js)을 못 받았다 — 공용 오류 상자(다시 하기 · 문의하기), 그 파일도 없으면 한 줄
      el.innerHTML = '<section class="card"><h2>SSS급 그 사람 사용설명서</h2><div id="pairErr"><p class="hint">잠시 뒤 다시 열어 주세요.</p></div></section>';
      if (global.ChaeksaOryu) global.ChaeksaOryu.그리기(el.querySelector('#pairErr'), { 무엇: '지금은 이 화면을 열지 못했어요', 까닭: '인터넷이 잠깐 끊겼거나, 화면 파일을 받다가 멈췄을 수 있어요.', 화면: 화면이름() }, function () { 그리기(el, profile); });
      return;
    }
    var 나 = PP.list().filter(function (p) { return p.isSelf; })[0], meId = 나 ? 나.id : null;
    var 목록 = PP.list().filter(function (p) { return p.id !== meId; }).concat(나 ? [나] : []);
    var 고른 = 읽기(고른키); if (!목록.some(function (p) { return p.id === 고른; })) 고른 = 목록.length ? 목록[0].id : null;
    var LV = global.ChaeksaLoveView;
    // 10-01 규격(docs/79) — 이름은 표지에 한 번만. 그 사람 고르기 = 정통궁합 · 웹툰궁합과 같은 사람 칩(app.js 사람칩, select 는 숨김).
    el.innerHTML = (LV && LV.그림 ? '<div class="lv-cover has-s">' + LV.그림(표지그림, true) + '<span class="k" id="prCoverK">연애</span><span class="n" id="prCoverN">SSS급 그 사람 사용설명서</span><span class="s" id="prCoverS">' + esc(글.cover_sub) + '</span></div>' : '')
      + '<div id="pairIntro"></div>'
      + '<section class="card">' + (LV && LV.그림 ? '' : '<h2>SSS급 그 사람 사용설명서</h2>')
      + (목록.length
        ? '<div id="pairPickWrap" style="margin:0 0 10px"><label for="pairPick" class="hint" style="display:block;margin:0 0 4px">그 사람</label><select id="pairPick">'
          + 목록.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === 고른 ? ' selected' : '') + '>' + esc(이름(p)) + (p.id === meId ? ' · 나' : p.relation ? ' · ' + esc(p.relation) : '') + '</option>'; }).join('')
          + '</select></div>'
        : '<button class="btn" id="pairAdd" type="button" style="width:100%;margin:0 0 10px">그 사람 생년월일 넣기</button>')
      + '<div id="pairHead"></div><p class="hint" id="pairSt" style="margin:8px 0 0"></p><div id="pairErr"></div></section>'
      + '<div id="pairOut"></div><div id="pairPay"></div>';
    if (!목록.length) {
      el.querySelector('#pairIntro').innerHTML = 소개(); 값채우기(el.querySelector('#pairIntro'));
      el.querySelector('#pairAdd').onclick = function () { if (typeof global.책사사람추가 === 'function') global.책사사람추가(); };
      return;
    }
    var pick = el.querySelector('#pairPick');
    pick.onchange = function () { 쓰기(고른키, pick.value); 그리기(el, profile); };
    if (typeof global.책사사람칩 === 'function') global.책사사람칩(el.querySelector('#pairPickWrap'), pick, 목록, 고른, null);
    쓰기(고른키, 고른);
    보기(el, PP.get(고른));
  }

  function 보기(el, 그사람) {
    var intro = el.querySelector('#pairIntro'), head = el.querySelector('#pairHead'), st = el.querySelector('#pairSt'), out = el.querySelector('#pairOut'), pay = el.querySelector('#pairPay'), 막힘칸 = el.querySelector('#pairErr');
    var ob = 생일(global.ChaeksaPeople.toProfile(그사람)), 그이름 = 이름(그사람), 성 = ob.gender === 'F' ? 'F' : 'M';
    var 키 = 결과키 + 표(ob), 대기키 = 키 + '.wait', 저장 = 읽기(키);
    var timer = null, t0 = null;
    function 알림(msg, err) { clearInterval(timer); st.textContent = msg || ''; st.style.color = err ? 'var(--seal, #8c2f23)' : ''; }
    function 초(msg) { t0 = t0 || +읽기(대기키) || Date.now(); 알림(msg); var f = function () { st.textContent = msg + ' (' + Math.max(0, Math.round((Date.now() - t0) / 1000)) + '초)'; }; f(); timer = setInterval(f, 1000); }
    // 막혔을 때(10-02) — 공용 오류 상자(oryu.js): 무엇이 안 됐는지 · 돈 · 다시 하기 · 문의하기(메일에 화면 이름). 그 파일이 없으면 예전처럼 한 줄.
    function 막힘(o, 다시) {
      var O = global.ChaeksaOryu;
      if (!O || !막힘칸) { 알림(o.까닭 || o.무엇, true); return; }
      알림(''); o.화면 = 화면이름();
      O.그리기(막힘칸, o, typeof 다시 === 'function' ? function () { 막힘칸.innerHTML = ''; 다시(); } : null);
    }
    if (저장 && Array.isArray(저장.chapters)) { 전체(out, 저장, 키, 그이름, 성, 그사람.id); return; }   // 이 기기에 받은 전체 — 다시 부르지 않는다
    intro.innerHTML = 소개(); 값채우기(intro);

    var C = global.ChaeksaCloud;
    if (!C || !C.enabled() || !C.signedIn()) {
      head.innerHTML = '<p class="hint" style="margin:0 0 10px">' + esc(글.login_line) + '</p>'
        + '<button class="btn kakao" id="prKakao" style="width:100%"><span>💬</span>카카오로 로그인</button>';
      head.querySelector('#prKakao').onclick = function () { if (!로그인하러(그사람.id)) 알림('로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.', true); };
      return;
    }
    var 본문 = { other: ob, consent: true };
    // 전체 받기 — 산 뒤에만. 이미 만든 것은 서버가 꺼내 주고, 없으면 새로 쓴다(3분쯤 — 10-02 사장님 「설명서3분으로 설명」). 다른 기기에서 만드는 중이면 10초마다 확인.
    function 만들기() {
      if (!읽기(대기키)) 쓰기(대기키, Date.now());
      초(글.making.replace('{시간}', 약().시간 || '조금'));   // 만드는 시간은 장부 pair 줄(약관 9절과 같은 말 — 10-02 사장님 「설명서3분으로 설명」)
      post('/api/manual', 본문).then(function (r) {
        지우기(대기키);
        if (!out.isConnected) return;
        저장 = { runId: r.runId, version: r.version, chapters: r.chapters || [] };
        쓰기(키, 저장); pay.innerHTML = ''; head.innerHTML = ''; intro.innerHTML = '';
        알림(r.saved ? '이 카카오 계정으로 만든 결과를 불러왔어요.' : 글.done.replace('{n}', 저장.chapters.length));
        전체(out, 저장, 키, 그이름, 성, 그사람.id);
      }, function (e) {
        if (!out.isConnected) return;
        if (e.status === 409 && Date.now() - (+읽기(대기키) || Date.now()) < 10 * 60 * 1000) { setTimeout(만들기, 10000); return; }
        지우기(대기키); t0 = null;
        if (e.status === 402) { 알림(e.message, true); 결제상자(pay, e.body && e.body.payKey, 0, 그사람.id); return; }
        // 산 사람만 여기 온다(열기에서 paid) — 결제한 것은 그대로 · 다시 하기 = 다시 만들기(이미 만든 것은 서버가 꺼내 준다)
        막힘({ 무엇: '그 사람 사용설명서를 다 만들지 못했어요', 까닭: e.message, 돈: '남음', 코드: e.status ? 'HTTP ' + e.status : '' }, 만들기);
      });
    }
    function 열기() {
      알림('그 사람의 여덟 글자를 읽는 중이에요…');
      post('/api/manual', Object.assign({ preview: true }, 본문)).then(function (r) {
        if (!out.isConnected) return;
        head.innerHTML = '';
        알림('');
        if (r.preview) 맛보기(out, r.preview, 그이름, 성);
        if (r.paid) { pay.innerHTML = ''; 만들기(); return; }   // 산 사람 — 보관된 것이 있으면 꺼내 오고, 없으면 지금 쓴다
        var pv = r.preview || {};
        결제상자(pay, r.payKey, Math.max(0, (pv.count || 0) - (pv.cards || []).length), 그사람.id);
      }, function (e) { if (out.isConnected) 막힘({ 무엇: '그 사람 사용설명서를 열지 못했어요', 까닭: e.message, 코드: e.status ? 'HTTP ' + e.status : '' }, 열기); });
    }
    if (읽기(동의키) === true) { 열기(); return; }
    head.innerHTML = '<label class="hint" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 10px"><input type="checkbox" id="prOk1" style="margin-top:5px;width:auto;flex:0 0 auto"><span>' + esc(글.consent) + ' <a href="privacy.html">개인정보 처리방침</a></span></label>'
      + '<button class="btn" id="prGo" style="width:100%">' + esc(글.go_button) + '</button>';
    head.querySelector('#prGo').onclick = function () {
      if (!head.querySelector('#prOk1').checked) return 알림('안내에 동의해 주세요.', true);
      쓰기(동의키, true); 열기();
    };
  }

  global.ChaeksaPairView = { 그리기: 그리기, 결제상자: 결제상자 };   // 결제상자는 약속 장부 시험(tests_yaksok.html)이 그려 본다
})(typeof window !== 'undefined' ? window : globalThis);
