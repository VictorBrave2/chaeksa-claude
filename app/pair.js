/* 그 사람 사용설명서 — 앱 탭(data-tab="pair", 10-02 새 판 v0.3). 홈 「궁합」 칸에서 들어온다.
 * 넣는 것은 그 사람 생년월일시 하나(10-02 사장님 「그 사람만」) — 넣어 둔 사람 가운데 고른다(정통궁합과 같은 사람 칩 · 「+ 사람 추가」).
 * 계산 · 글은 비공개 서버(/api/manual)가 한다 — 이 파일엔 판정 · 표 · 문턱이 없다. 서버가 보낸 글만 그린다.
 * 무료 = 가장 궁금할 질문 세 개(연락 · 애정 표현 · 서운함)의 맞히기 한 줄(토큰 0). 전체(열두 단계 · 장마다 맞히기 · 왜 · 나에게 비치는 모습)는
 * 출시 기념가 19,900원(love_pair). 결제 열쇠는 서버가 준 값만 쓴다(그 사람 생일로 만든 알아볼 수 없는 값 — 주문에 생일이 남지 않는다).
 * 생일은 주소에 싣지 않는다(POST 본문). 받은 전체 결과는 이 기기에 남기고, 서버 보관본으로 폰 · PC 어디서든 같은 결과.
 * 화면 글은 작가가 쓴 것(아래 글 표) — 고칠 땐 글 표 한 곳만. 「당신」은 쓰지 않는다(10-02 사장님). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var 동의키 = 'chaeksa.manualConsent', 결과키 = 'chaeksa.manual.', 고른키 = 'chaeksa.pair.pick';
  var 표지그림 = ['art/ss-marry-2.webp', [1024, 1536], '#e4e1e1', '#211a1a'];   // 10-01 사장님 「비오는 삽화말고 다른거」 — 그 사람을 읽는 장면(집 안, 종이를 펴 읽는 그)
  // 단계 머리 그림 — love.js 장 그림 표(ChaeksaLoveView.장그림)에서 맞는 장을 빌린다. 맞는 그림이 없는 단계는 글 머리만.
  var 단계그림 = { '썸': '썸을 탈 때', '고백과 시작': '연애가 시작됐을 때', '연락': '연락과 애정표현', '서운함과 다툼': '싸웠을 때', '화해': '관계가 흔들릴 때',
    '질투와 믿음': '질투와 신뢰', '권태': '권태가 왔을 때', '이별과 재회': '이별과 재회', '결혼과 미래': '오래 함께할 때' };

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
        "body": "그 사람의 생년월일시만 있으면 돼요.\n\n누구나 가장 궁금해할 질문 3개(연락 · 애정 표현 · 서운함)의 답을 먼저 무료로 보여 드려요.\n\n나머지 장과, 장마다 왜 그런지 · 나에게 비치는 모습은 출시 기념가 19,900원에 열려요.\n\n결제한 카카오 계정에 1년 동안 보관돼서, 폰에서도 PC에서도 다시 볼 수 있어요.\n\n결과를 만들지 못하면 전액 환불해 드려요."
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
    "pay_lead": "결제하면 그때 그 사람의 생년월일시로 새로 써 드려요(30초 남짓).",
    "pay_items": [
      "썸부터 가족과 친구까지, 연애 열두 단계의 남은 장이 모두 열려요",
      "장마다 그 사람이 어떻게 할지 한 줄, 왜 그런지, 나에게 어떻게 비칠 수 있는지를 적어 드려요",
      "무료로 본 질문 3개도 왜 그런지와 나에게 비치는 모습까지 열려요",
      "장마다 뚜렷함 표시가 붙어서, 어디까지 믿고 어디서 직접 물어볼지 가늠할 수 있어요",
      "결제한 카카오 계정에 1년 동안 보관돼서, 폰에서 열어도 PC에서 열어도 같은 결과가 나와요"
    ],
    "pay_button": "{price} 결제하고 봉인 풀기",
    "making": "그 사람의 봉인을 푸는 중이에요. 30초 남짓 걸려요. 이 화면을 그대로 두세요.",
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
    "seen_label": "나에게 비치는 모습",
    "feedback_line": "읽어 보고 그 사람과 맞으면 「맞아요」, 다르면 「아니에요」를 눌러 주세요. 모인 답으로 책사가 추론을 고쳐 나가요."
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
    try { global.ChaeksaCloud.signInWith('kakao'); return true; } catch (e) { 지우기('chaeksa.return'); return false; }
  }

  // 단계(또는 맛보기) 하나를 그림 머리가 달린 바탕 띠로 — love.js 가 없으면 글 머리로.
  function 그림of(단계) {
    var LV = global.ChaeksaLoveView, 표 = (LV && LV.장그림) || {}, k = 단계그림[단계];
    return (k && 표[k]) || (LV && LV.기본그림) || [null, null, '#efe9ec', '#221f45'];
  }
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
    return '<span style="display:inline-block;font-size:12px;font-weight:700;line-height:1.6;padding:0 9px;border-radius:99px;border:1px solid ' + 색 + ';color:' + 색 + '">' + esc(글.badges[k]) + '</span>';
  }
  // 한 장 — 질문 · 표시 · 맞히기 · (왜 · 나에게 비치는 모습)
  function 장(c, 끝) {
    return '<section class="card"' + (c.id ? ' id="mn-' + esc(c.id) + '"' : '') + '><p class="hint" style="margin:0 0 6px">' + esc(c.question) + '</p>'
      + '<p style="margin:0 0 6px">' + 표시(c) + '</p><p class="lv-t">' + esc(c.t || c.line) + '</p>'
      + (c.a ? '<p class="hint" style="margin:10px 0 2px"><b>' + esc(글.why_label) + '</b></p><p style="margin:0">' + esc(c.a) + '</p>' : '')
      + (c.s ? '<p class="hint" style="margin:10px 0 2px"><b>' + esc(글.seen_label) + '</b></p><p style="margin:0">' + esc(c.s) + '</p>' : '')
      + (끝 || '') + '</section>';
  }

  // 소개(작가 다섯 칸) — 3번 칸 뒤에 예시 장 한 장.
  function 소개() {
    var html = '';
    (글.intro || []).forEach(function (s, i) {
      var 문들 = String(s.body || '').split(/\n\s*\n/), 뒤 = i === 2 && 문들.length > 1 ? 문들.pop() : '';   // 3번 칸: 마지막 문단은 예시 장 뒤에(작가 메모)
      html += '<section class="card"><h3 class="doc-h">' + esc(s.head) + '</h3>' + 문단(문들.join('\n\n')) + '</section>';
      if (i === 2) html += 장({ question: 글.example.question, kind: 'side', sure: 글.example.sure, t: 글.example.t, a: 글.example.a, s: 글.example.s }) + (뒤 ? '<section class="card">' + 문단(뒤) + '</section>' : '');
    });
    return html + (글.disclaimer ? '<p class="hint" style="margin:0 0 12px;text-align:center">' + esc(글.disclaimer) + '</p>' : '');
  }

  // 전체 결과 — 열두 단계 차례(서버가 보낸 차례 그대로) · 장마다 표시 · 맞아요 / 아니에요.
  function 전체(box, 저장, 키, 그이름) {
    var 장들 = 저장.chapters || [], 수 = { sharp: 0, lean: 0, mixed: 0, weak: 0 };
    장들.forEach(function (c) { 수[표시키(c)]++; });
    var LV = global.ChaeksaLoveView;   // 이름은 표지에 한 번만(docs/79) — 표지가 있으면 카드 머리는 뺀다
    var html = '<section class="card">' + (LV && LV.그림 ? '' : '<h3 class="doc-h">' + esc(글.result_head.replace('{name}', 그이름)) + '</h3>')
      + '<p style="margin:0 0 8px">' + ['sharp', 'lean', 'mixed', 'weak'].filter(function (k) { return 수[k]; }).map(function (k) { return esc(글.badges[k]) + ' ' + 수[k]; }).join(' · ') + '</p>'
      + '<p class="hint" style="margin:0 0 6px">' + esc(글.result_lead).replace(/\n/g, '<br>') + '</p><p class="hint" style="margin:0">' + esc(글.feedback_line) + '</p></section>';
    var 묶음들 = [];
    장들.forEach(function (c) {
      var 끝 = 묶음들[묶음들.length - 1];
      if (!끝 || 끝.머리 !== c.stage) { 끝 = { 머리: c.stage, 그림: 그림of(c.stage), html: '' }; 묶음들.push(끝); }
      var v = (저장.fb || {})[c.id];
      끝.html += 장(c, '<p class="hint" style="margin:10px 0 0">실제 그 사람과 <button class="btn ghost small" data-id="' + esc(c.id) + '" data-v="yes"' + (v === 'yes' ? ' style="font-weight:700"' : '') + '>' + (v === 'yes' ? '✓ ' : '') + '맞아요</button> '
        + '<button class="btn ghost small" data-id="' + esc(c.id) + '" data-v="no"' + (v === 'no' ? ' style="font-weight:700"' : '') + '>' + (v === 'no' ? '✓ ' : '') + '아니에요</button></p>');
    });
    box.innerHTML = html + 띠들(묶음들);
    var 표지n = document.getElementById('prCoverN'), 표지k = document.getElementById('prCoverK');
    if (표지n) {
      표지n.textContent = 글.result_head.replace('{name}', 그이름); if (표지k) 표지k.textContent = '사용설명서';
      var 표지s = document.getElementById('prCoverS'); if (표지s) { 표지s.remove(); if (표지n.parentNode) 표지n.parentNode.classList.remove('has-s'); }
    }
    box.querySelectorAll('button[data-v]').forEach(function (b) {
      b.onclick = function () {
        저장.fb = 저장.fb || {}; 저장.fb[b.getAttribute('data-id')] = b.getAttribute('data-v'); 쓰기(키, 저장); 전체(box, 저장, 키, 그이름);
        post('/api/pair-feedback', { runId: 저장.runId, id: b.getAttribute('data-id'), value: b.getAttribute('data-v'), by: 'me' }).catch(function () {});
      };
    });
  }

  // 맛보기 — 서버가 준 무료 세 질문의 맞히기 한 줄(왜 · 비춰짐 없음).
  function 맛보기(box, pv) {
    var 카드들 = (pv.cards || []).map(function (c) { return 장(c); }).join('');
    box.innerHTML = 카드들 ? 띠들([{ 머리: 글.preview_head, 그림: 그림of('연락'), html: 카드들 + '<p class="hint" style="margin:0 0 12px">' + esc(글.preview_note) + '</p>' }]) : '';
  }

  // 결제 상자 — 값은 서버 상품표(products · love_pair)에서 받아 단추에 적는다(pay.js 원칙: 값은 한 곳, 줄 그은 정가 없음).
  // 청약철회 안내와 [필수] 동의는 연애 속의 나 잠금상자와 같은 말 — 체크 전에는 결제를 열지 않는다.
  function 결제상자(box, 열쇠, 남은, pick) {
    box.innerHTML = '<section class="card"><h3 class="doc-h">' + esc(글.pay_head.replace('{n}', 남은 > 0 ? 남은 : '')) + '</h3>'
      + '<p style="margin:0 0 10px">' + esc(글.pay_lead) + '</p>'
      + '<p style="margin:0 0 4px"><b>결제하면 받는 것</b></p><ul style="margin:0 0 10px;padding-left:20px;line-height:1.7">'
      + 글.pay_items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
      + '<p style="margin:0 0 6px;font-size:12.5px;line-height:1.7;color:var(--ink2)">결제하면 바로 열리는 디지털 콘텐츠입니다. '
      + '열람이 시작되면 청약철회(결제 후 7일 안 취소)가 제한될 수 있고, 열람 전에는 전액 환불됩니다.</p>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.7;color:var(--ink);cursor:pointer;margin:0 0 10px">'
      + '<input type="checkbox" id="prAgree" style="margin-top:4px;width:auto;flex:none">'
      + '<span><b>[필수]</b> 위 내용을 확인했고 동의합니다. (<a href="terms.html#refund" target="_blank" rel="noopener">환불 규정</a>)</span></label>'
      + '<button class="btn" id="prBuy" type="button" style="width:100%">' + esc(글.pay_button.replace('{price}', '출시 기념가 19,900원')) + '</button>'
      + '<p class="hint" id="prPaySay" style="margin:8px 0 0"></p></section>';
    var btn = box.querySelector('#prBuy'), say = box.querySelector('#prPaySay'), P = global.ChaeksaPay;
    if (P && P.product) P.product('love_pair').then(function (p) {
      if (!btn.isConnected || btn.dataset.busy) return;
      if (p && p.amount) btn.textContent = 글.pay_button.replace('{price}', P.값 ? P.값(p) : '출시 기념가 ' + P.won(p.amount));
      else { btn.disabled = true; say.textContent = '온라인 결제는 준비 중이에요. 열리는 대로 이 자리에서 바로 열 수 있어요.'; }
    }).catch(function () {});
    btn.onclick = function () {
      if (btn.dataset.busy) return;
      var ok = box.querySelector('#prAgree');
      if (!ok || !ok.checked) { say.textContent = '위 [필수] 칸에 체크해 주셔야 결제할 수 있어요.'; return; }
      var C = global.ChaeksaCloud; P = global.ChaeksaPay;
      if (!P || !P.buy) { say.textContent = '결제 화면을 불러오지 못했어요. 새로고침해 주세요.'; return; }
      if (!열쇠) { say.textContent = '처음부터 다시 해 주세요.'; return; }
      쓰기(고른키, pick);   // 결제하고 돌아오면 같은 사람으로
      if (!(C && C.signedIn && C.signedIn())) { if (!로그인하러(pick)) say.textContent = '로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.'; return; }
      try { global.ChaeksaTrack && global.ChaeksaTrack.event && global.ChaeksaTrack.event('pay'); } catch (e) {}
      var 원래 = btn.textContent;
      btn.dataset.label = 원래; btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = '결제창을 여는 중…'; say.textContent = '';
      Promise.resolve().then(function () { return P.buy('love_pair', 열쇠, 'kakao'); })
        .catch(function (e) { return { ok: false, message: String((e && e.message) || e) }; })
        .then(function (r) {
          delete btn.dataset.busy; btn.disabled = false; btn.textContent = 원래;
          if (r && r.ok === false && !r.closed) say.textContent = r.message || '결제창을 열지 못했어요.';
        });
    };
  }

  // profile(내 생일)은 받기만 한다 — 이 상품은 그 사람 생일 하나만 쓴다(10-02). 목록은 넣어 둔 사람 전부(다른 사람이 앞, 나는 맨 뒤 「· 나」).
  // 나를 빼면, 내 생일 없이 그 사람부터 넣은 손님은 그 사람이 「나」로 잡혀(people.js 첫 사람 = active) 고를 사람이 없어진다.
  function 그리기(el, profile) {
    if (!el) return;
    var PP = global.ChaeksaPeople;
    if (!PP) { el.innerHTML = '<section class="card"><h2>그 사람 사용설명서</h2><p class="hint">잠시 뒤 다시 열어 주세요.</p></section>'; return; }
    var meId = PP.activeId ? PP.activeId() : null, 목록 = PP.list().filter(function (p) { return p.id !== meId; }).concat(PP.list().filter(function (p) { return p.id === meId; }));
    var 고른 = 읽기(고른키); if (!목록.some(function (p) { return p.id === 고른; })) 고른 = 목록.length ? 목록[0].id : null;
    var LV = global.ChaeksaLoveView;
    // 10-01 규격(docs/79) — 이름은 표지에 한 번만. 그 사람 고르기 = 정통궁합 · 웹툰궁합과 같은 사람 칩(app.js 사람칩, select 는 숨김).
    el.innerHTML = (LV && LV.그림 ? '<div class="lv-cover has-s">' + LV.그림(표지그림, true) + '<span class="k" id="prCoverK">궁합</span><span class="n" id="prCoverN">그 사람 사용설명서</span><span class="s" id="prCoverS">' + esc(글.cover_sub) + '</span></div>' : '')
      + '<div id="pairIntro"></div>'
      + '<section class="card">' + (LV && LV.그림 ? '' : '<h2>그 사람 사용설명서</h2>')
      + (목록.length
        ? '<div id="pairPickWrap" style="margin:0 0 10px"><label for="pairPick" class="hint" style="display:block;margin:0 0 4px">그 사람</label><select id="pairPick">'
          + 목록.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === 고른 ? ' selected' : '') + '>' + esc(이름(p)) + (p.id === meId ? ' · 나' : p.relation ? ' · ' + esc(p.relation) : '') + '</option>'; }).join('')
          + '</select></div>'
        : '<button class="btn" id="pairAdd" type="button" style="width:100%;margin:0 0 10px">그 사람 생년월일 넣기</button>')
      + '<div id="pairHead"></div><p class="hint" id="pairSt" style="margin:8px 0 0"></p></section>'
      + '<div id="pairOut"></div><div id="pairPay"></div>';
    if (!목록.length) {
      el.querySelector('#pairIntro').innerHTML = 소개();
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
    var intro = el.querySelector('#pairIntro'), head = el.querySelector('#pairHead'), st = el.querySelector('#pairSt'), out = el.querySelector('#pairOut'), pay = el.querySelector('#pairPay');
    var ob = 생일(global.ChaeksaPeople.toProfile(그사람)), 그이름 = 이름(그사람);
    var 키 = 결과키 + 표(ob), 대기키 = 키 + '.wait', 저장 = 읽기(키);
    var timer = null, t0 = null;
    function 알림(msg, err) { clearInterval(timer); st.textContent = msg || ''; st.style.color = err ? 'var(--seal, #8c2f23)' : ''; }
    function 초(msg) { t0 = t0 || +읽기(대기키) || Date.now(); 알림(msg); var f = function () { st.textContent = msg + ' (' + Math.max(0, Math.round((Date.now() - t0) / 1000)) + '초)'; }; f(); timer = setInterval(f, 1000); }
    if (저장 && Array.isArray(저장.chapters)) { 전체(out, 저장, 키, 그이름); return; }   // 이 기기에 받은 전체 — 다시 부르지 않는다
    intro.innerHTML = 소개();

    var C = global.ChaeksaCloud;
    if (!C || !C.enabled() || !C.signedIn()) {
      head.innerHTML = '<p class="hint" style="margin:0 0 10px">' + esc(글.login_line) + '</p>'
        + '<button class="btn kakao" id="prKakao" style="width:100%"><span>💬</span>카카오로 로그인</button>';
      head.querySelector('#prKakao').onclick = function () { if (!로그인하러(그사람.id)) 알림('로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.', true); };
      return;
    }
    var 본문 = { other: ob, consent: true };
    // 전체 받기 — 산 뒤에만. 이미 만든 것은 서버가 꺼내 주고, 없으면 새로 쓴다(30초 남짓). 다른 기기에서 만드는 중이면 10초마다 확인.
    function 만들기() {
      if (!읽기(대기키)) 쓰기(대기키, Date.now());
      초(글.making);
      post('/api/manual', 본문).then(function (r) {
        지우기(대기키);
        if (!out.isConnected) return;
        저장 = { runId: r.runId, version: r.version, chapters: r.chapters || [], fb: {} };
        쓰기(키, 저장); pay.innerHTML = ''; head.innerHTML = ''; intro.innerHTML = '';
        알림(r.saved ? '이 카카오 계정으로 만든 결과를 불러왔어요.' : 글.done.replace('{n}', 저장.chapters.length));
        전체(out, 저장, 키, 그이름);
      }, function (e) {
        if (!out.isConnected) return;
        if (e.status === 409 && Date.now() - (+읽기(대기키) || Date.now()) < 10 * 60 * 1000) { setTimeout(만들기, 10000); return; }
        지우기(대기키); t0 = null;
        알림(e.message, true);
        if (e.status === 402) 결제상자(pay, e.body && e.body.payKey, 0, 그사람.id);
      });
    }
    function 열기() {
      알림('그 사람의 여덟 글자를 읽는 중이에요…');
      post('/api/manual', Object.assign({ preview: true }, 본문)).then(function (r) {
        if (!out.isConnected) return;
        head.innerHTML = '';
        알림('');
        if (r.preview) 맛보기(out, r.preview);
        if (r.paid) { pay.innerHTML = ''; 만들기(); return; }   // 산 사람 — 보관된 것이 있으면 꺼내 오고, 없으면 지금 쓴다
        var pv = r.preview || {};
        결제상자(pay, r.payKey, Math.max(0, (pv.count || 0) - (pv.cards || []).length), 그사람.id);
      }, function (e) { if (out.isConnected) 알림(e.message, true); });
    }
    if (읽기(동의키) === true) { 열기(); return; }
    head.innerHTML = '<label class="hint" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 10px"><input type="checkbox" id="prOk1" style="margin-top:5px;width:auto;flex:0 0 auto"><span>' + esc(글.consent) + ' <a href="privacy.html">개인정보 처리방침</a></span></label>'
      + '<button class="btn" id="prGo" style="width:100%">' + esc(글.go_button) + '</button>';
    head.querySelector('#prGo').onclick = function () {
      if (!head.querySelector('#prOk1').checked) return 알림('안내에 동의해 주세요.', true);
      쓰기(동의키, true); 열기();
    };
  }

  global.ChaeksaPairView = { 그리기: 그리기 };
})(typeof window !== 'undefined' ? window : globalThis);
