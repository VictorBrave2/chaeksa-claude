/* 연애 속의 나 — 앱 탭(data-tab="love"). 09-30 사장님 「프로필 연동해야지 머하노 아예 다른창을 만들어놨네」 — 저장된 사람(profile)으로 바로 돈다. 생일을 다시 묻지 않는다.
 * 계산 · 질문 · 답은 비공개 서버가 한다(이 파일엔 판정 · 가중치 없음). 이 파일은 보여 주기만 한다(반응 단추는 10-02 사장님 말로 걷음).
 * 같은 사람 결과는 이 기기에 남겨 두고 다시 열면 그대로 보여 준다(다시 부르지 않음). 생일은 주소에 싣지 않는다(POST 본문).
 * 10-01 사장님 「유료」 — 전체판 출시 기념가 9,900원. 10-02 「무료범위없이 예시만」 — 결제 전에는 지어낸 한 사람 예시뿐, 산 뒤에 만든다(서버도 안 산 사람에게는 쓰지도 보내지도 않는다).
 * 10-01 사장님 「더해서 예쁜 배경과 그림들이 이어졌으면」 — 표지 그림 → 장마다 장면 그림 + 「N장 · 장 이름」 + 그 장 한 줄, 장마다 그림에서 뽑은 옅은 바탕색이 다음 장으로 이어진다.
 *   글은 문답이 아니라 「~해요」 제목 + 풀어 쓴 글(서버 t · a). 1장이 끝나는 자리에 결제 상자, 맨 끝에 「SSS급 그 사람 사용설명서」로 가는 상자(#pair).
 * 결제는 ChaeksaPay.buy('love_full', 결제열쇠, 'kakao') — 결제열쇠는 서버만 만든다('love_full:' + 32자 조각, 생일이 주문에 안 남는다).
 * 이 파일은 생일로 열쇠를 만들지 않는다 — 서버가 준 값이 없으면 단추를 잠그고 서버에 묻는다(peek). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var 동의키 = 'chaeksa.loveConsent', 결과키 = 'chaeksa.love.';

  // ── 장 그림 표 — 그림을 바꾸려면 이 줄만 고친다. [그림, [가로, 세로], 낮 바탕색, 밤 바탕색]. {g} 를 쓰면 저장된 사람 성별(f · m) 그림.
  //    바탕색 = 그림 위쪽 60%에서 뽑은 가장 많은 색을 옅게(낮은 #f6f3f4 쪽, 밤은 #161433 쪽으로 84% 섞음 — python PIL, 10-01). 그림을 바꾸면 색도 다시 뽑는다.
  //    줄인 그림(-s)은 쓰지 않는다(09-30 사장님 「삽화 화질을 줄이지 않았으면」). 행동양식 궁합(pair.js)도 이 표를 쓴다.
  var 장그림 = {
    '마음에 드는 사람이 생겼을 때': ['art/story-maeum.webp', [1024, 1536], '#dfdeea', '#222248'],
    '썸을 탈 때': ['art/ss-sseom-6.webp', [1024, 1536], '#ebe0dd', '#2f253b'],
    '연애가 시작됐을 때': ['art/story-first-touch.webp', [1024, 1536], '#ebe1dd', '#2f263b'],
    '연락과 애정표현': ['art/story-contact.webp', [1024, 1536], '#ebe1dd', '#2f263b'],
    '질투와 신뢰': ['art/story-jealous.webp', [1024, 1536], '#ebdfdd', '#2f233b'],
    '싸웠을 때': ['art/story-fight.webp', [1024, 1536], '#ebdcde', '#2f213c'],
    '관계가 흔들릴 때': ['art/ss-shake-3.webp', [1024, 1536], '#ebdcea', '#2f2148'],
    '권태가 왔을 때': ['art/ss-steady-1.webp', [1024, 1536], '#ebe1dd', '#2f263b'],
    '이별과 재회': ['art/ss-again-3.webp', [1024, 1536], '#ebdfdd', '#2f243b'],
    '오래 함께할 때': ['art/ss-steady-4.webp', [1024, 1536], '#ebe0dd', '#2f253b']
  };
  var 표지그림 = ['art/love-cover.webp', [1086, 1448], '#f1e6d8', '#352b35'];
  var 기본그림 = [null, null, '#efe9ec', '#221f45'];   // 표에 없는 장 이름 — 그림 없이 글 머리만

  // 기다림 네 단계(10-01 사장님 승인 흐름) — 걸린 시간(초)으로 넘어간다. 서버 진행을 재는 것이 아니다.
  var 단계 = ['여덟 글자의 봉인을 여는 중', '봉인된 연애 버릇을 연산하는 중', '사랑할 때 나올 말과 행동을 해독하는 중', '해독한 것을 한 장에 새기는 중'], 단계때 = [0, 8, 20, 55];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function 읽기(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function 쓰기(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function 성별() { try { var p = JSON.parse(localStorage.getItem('chaeksa.profile') || 'null'); return p && p.gender === 'M' ? 'm' : 'f'; } catch (e) { return 'f'; } }   // home-cats.js 와 같다
  // 그림 한 장 — 가로 · 세로를 적어 자리를 미리 잡는다. 첫 그림만 바로, 나머지는 내려갈 때 받는다.
  function 그림(g, 첫) {
    return '<img src="' + esc(String(g[0]).replace('{g}', 성별())) + '" alt="" width="' + g[1][0] + '" height="' + g[1][1] + '" decoding="async"' + (첫 ? '' : ' loading="lazy"') + '>';
  }
  // 장 바탕 — 이 장 색에서 시작해 다음 장 색으로 끝난다(마지막 장은 쪽 바탕으로). 밤 색은 CSS 가 고른다(style.css 끝 .lv-ch).
  function 띠(지금, 다음) {
    return '--lt:' + 지금[2] + ';--dt:' + 지금[3] + ';--lt2:' + (다음 ? 다음[2] : 'var(--bg)') + ';--dt2:' + (다음 ? 다음[3] : 'var(--bg)');
  }
  // 장 머리 — 그림 전체(자르지 않음) 위 아래쪽 어두운 자리에 「N장 · 장 이름」과 그 장 한 줄.
  function 장머리(g, 제목, 한줄, 첫) {
    var 글 = '<span class="n">' + esc(제목) + '</span>' + (한줄 ? '<span class="s">' + esc(한줄) + '</span>' : '');
    if (!g[0]) return '<div class="lv-pic plain">' + 글 + '</div>';
    return '<figure class="lv-pic">' + 그림(g, 첫) + '<figcaption>' + 글 + '</figcaption></figure>';
  }
  function 생일(p) {
    var h = p.hour == null || p.hour === '' ? null : +p.hour;
    return { year: +p.year, month: +p.month, day: +p.day, hour: h, minute: h == null ? null : +(p.minute || 0), gender: p.gender === 'F' ? 'F' : 'M',
      longitude: p.longitude == null ? null : +p.longitude, tzOffset: p.tzOffset == null ? null : +p.tzOffset };
  }
  function 표(b) { return [b.year, b.month, b.day, b.hour, b.minute, b.gender, b.longitude, b.tzOffset].join('|'); }
  // 결제 열쇠 — 서버(비공개 lib/love.js payKey)가 낸 값만 쓴다. 옛 꼴(생일이 적힌 열쇠)이 이 기기에 남아 있으면 버리고 다시 묻는다.
  function 올바른열쇠(k) { return typeof k === 'string' && /^love_full:[0-9a-f]{32}$/.test(k) ? k : null; }
  // 샀나 · 결제 열쇠를 서버에 묻는다(peek — 만들지도 세지도 않는다). 한 화면에서 여러 곳이 물어도 한 번만 부른다.
  var 묻는중 = {};
  function 샀나묻기(b) {
    var k = 표(b);
    if (!묻는중[k]) 묻는중[k] = post('/api/love-questions', { peek: true, birth: b }).then(
      function (r) { delete 묻는중[k]; return r; }, function (e) { delete 묻는중[k]; throw e; });
    return 묻는중[k];
  }
  // 로그인 표(토큰)를 실어 보낸다 — 서버는 카카오로 로그인한 사람만 질문 · 답을 만든다(09-30 사장님)
  function post(path, body) {
    var C = global.ChaeksaCloud;
    return Promise.resolve(C && C.token ? C.token() : null).catch(function () { return null; }).then(function (t) {
      var h = { 'Content-Type': 'application/json' }; if (t) h.Authorization = 'Bearer ' + t;
      return fetch(API + path, { method: 'POST', headers: h, body: JSON.stringify(body) })
        .catch(function () { throw new Error('연결이 끊겼어요. 잠시 뒤 다시 해 주세요.'); });   // 끊김 · 시간 초과도 우리말로
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.error || '잠시 뒤 다시 해 주세요.'); er.status = r.status; throw er; } return j; }); });
  }

  // ── 글 꼴(10-01) — 제목 「~해요」 + 풀어 쓴 글. 새 답은 서버가 제목(t)을 주고 첫머리 「네, 그런 편이에요」를 떼어 보낸다.
  // 제목 없는 옛 답: 흔한 물음 끝을 「~해요」로 바꾸고, 첫 문장이 「네 · 대체로 그래요」 같은 대답이면 뗀다.
  // 답이 「아니요 · 꼭 그렇지는」으로 시작하면 질문 그대로 둔다(바꾸면 뜻이 뒤집힌다). 못 바꾸는 질문도 그대로 둔다(그때는 대답도 떼지 않는다).
  var 바꿀끝 = [[/편인가요\s*\?$/, '편이에요'], [/하나요\s*\?$/, '해요'], [/두나요\s*\?$/, '둬요'], [/루나요\s*\?$/, '뤄요'], [/보나요\s*\?$/, '봐요']];
  var 아니로시작 = /^(아니요|아뇨|아니에요|꼭\s*그렇지는|그렇지\s*않|딱히\s*그렇지)/;
  var 대답만 = /^((대체로|보통|꽤)\s*)?(그런\s*편이에요|그렇게\s*하는\s*편이에요|그렇게\s*해요|그래요|맞아요)\s*[.!]?$/;
  function 제목바꾸기(q) {
    var s = String(q || '').trim();
    if (/아니면/.test(s) || (s.match(/\?/g) || []).length !== 1) return null;   // 「~인가요, 아니면 ~인가요?」는 바꾸면 깨진다
    for (var i = 0; i < 바꿀끝.length; i++) if (바꿀끝[i][0].test(s)) return s.replace(바꿀끝[i][0], 바꿀끝[i][1]);
    return null;
  }
  function 첫머리떼기(a) {
    var s = String(a || '').trim(), m = s.match(/^[^.!?]*[.!?]+\s*/);
    if (!m) return s;
    var 첫 = m[0], 나머지 = s.slice(첫.length).trim(), 알맹이 = 첫.replace(/^(네|예)(\s*[,.!]|\s+(?=그))\s*/, '').trim();   // 「예를 들어」는 건드리지 않는다
    if (!알맹이 || 대답만.test(알맹이)) return 나머지 || s;   // 첫 문장이 대답뿐 — 통째로 뗀다(뒤가 남을 때만)
    if (알맹이 !== 첫.trim()) return (알맹이 + ' ' + 나머지).trim();   // 「네, 장소는 꼼꼼히 챙겨요.」 — 「네,」만 뗀다
    return s;
  }
  function 항목글(it) {
    var a = String(it.a || '').trim(), t = String(it.t || '').trim().replace(/[?？]+$/, '');
    if (t) return { 제목: t, 글: 첫머리떼기(a) };
    if (!a || a === '답을 쓰지 못했어요.' || 아니로시작.test(a)) return { 제목: it.q, 글: a };
    // 긍정 첫머리(네 · 그런 편이에요)를 실제로 뗐을 때만 질문을 「~해요」로 바꾼다 — 아니면 답의 방향을 몰라 거꾸로 읽힐 수 있다(10-01 검토)
    var 뗀 = 첫머리떼기(a);
    if (뗀 === a) return { 제목: it.q, 글: a };
    var 바꾼 = 제목바꾸기(it.q);
    if (!바꾼) return { 제목: it.q, 글: a };
    // 옛 답은 「네, 미리 정해 두는 편이에요.」처럼 첫 문장이 제목을 되풀이한다 — 짧은 「~편이에요.」 첫 문장은 뗀다(뒤가 남을 때만)
    var m = 뗀.match(/^[^.!?]{0,24}편이에요\s*[.!]\s*/);
    if (m && 뗀.slice(m[0].length).trim()) 뗀 = 뗀.slice(m[0].length).trim();
    return { 제목: 바꾼, 글: 뗀 };
  }
  // 질문을 장(섹션)으로 묶는다 — 장 번호는 이 사람에게 나온 장 차례(1장부터).
  function 장들(items) {
    var 차례 = [], 묶음 = {};
    (items || []).forEach(function (it) { if (!묶음[it.section]) { 묶음[it.section] = []; 차례.push(it.section); } 묶음[it.section].push(it); });
    return { 차례: 차례, 묶음: 묶음 };
  }

  // 장마다 그림 머리 → 글들 → (잠긴 글은 이 장에서 다루는 장면만) — 1장 끝에 결제 상자 자리(#lvPay).
  // 반응 단추(이건 나 같아요 / 나와 달라요)는 넣지 않는다(10-02 사장님 「맞아요 아니에요는 왜자꾸 넣는거야?」).
  function 목록(box, 저장, 키) {
    var 장 = 장들(저장.items), ch = (저장.portrait && 저장.portrait.chapters) || {}, html = '';
    장.차례.forEach(function (sec, i) {
      var g = 장그림[sec] || 기본그림, 다음 = 장.차례[i + 1] ? (장그림[장.차례[i + 1]] || 기본그림) : null, 잠긴 = [];
      html += '<div class="lv-ch" id="lvch-' + (i + 1) + '" style="' + 띠(g, 다음) + '">' + 장머리(g, (i + 1) + '장 · ' + sec, typeof ch[sec] === 'string' ? ch[sec] : '', false);
      장.묶음[sec].forEach(function (it) {
        if (it.locked) { 잠긴.push(it); return; }
        var 글 = 항목글(it);
        html += '<section class="card lv-item" id="lvq-' + esc(it.id) + '"><p class="lv-t">' + esc(글.제목) + '</p>'
          + (글.글 ? '<p class="lv-a">' + esc(글.글) + '</p>' : '<p class="hint" style="margin:0">글을 쓰는 중이에요…</p>')
          + '</section>';
      });
      if (잠긴.length) {
        html += '<section class="card lv-lock"><p class="lv-t">🔒 이 장의 글 ' + 잠긴.length + '개는 아직 봉인돼 있어요</p>'
          + '<p class="hint" style="margin:0 0 6px">이 장에서 다루는 장면</p><ul>'
          + 잠긴.map(function (it) { return '<li id="lvq-' + esc(it.id) + '">' + esc(it.q) + '</li>'; }).join('') + '</ul></section>';
      }
      if (i === 0) html += '<div id="lvPay"></div>';
      html += '</div>';
    });
    box.innerHTML = 장.차례.length ? '<div class="lv-flow">' + html + '</div>' : '';
  }

  // 결론(10-01 사장님 「사주팔자 -> 행동양식 -> 언행추론 -> 이런 사람이다 까지 결론이 나야」) — 장들 위.
  // 산 사람은 모습(서버가 셋을 다 거른 것만 보관한다) · 해 볼 것 · 조심할 것까지, 안 산 사람은 첫 줄만 온다(나머지는 서버가 안 보낸다).
  // 모습의 근거는 장으로 — 「2장 · 3장에서 보여요」, 누르면 그 장 그림으로 내려간다. 주소의 #은 탭이 쓰므로 건드리지 않는다.
  function 결론상자(box, 저장) {
    var p = 저장 && 저장.portrait;
    if (!p || !p.title) { box.innerHTML = ''; return; }
    var 장 = 장들(저장.items), 장번호 = {}, 자리 = {};
    장.차례.forEach(function (s, i) { 장번호[s] = i + 1; });
    (저장.items || []).forEach(function (it) { 자리[it.id] = 장번호[it.section]; });
    var html = '<section class="card lv-sum"><h3 class="doc-h">해독 결과</h3><p class="lv-title">' + esc(p.title) + '</p>';
    if (p.locked || !Array.isArray(p.traits)) {
      html += '<p class="hint" style="margin:0">🔒 연애할 때 당신의 세 가지 모습, 그래서 해 볼 것, 조심할 것은 <a href="#" data-go="lvPay">1장 끝의 봉인 풀기</a>에서 열려요.</p>';
    } else {
      p.traits.forEach(function (t, i) {
        var 본 = {}, ns = [];
        (t.qids || []).forEach(function (id) { var n = 자리[id]; if (n && !본[n]) { 본[n] = 1; ns.push(n); } });
        ns.sort(function (x, y) { return x - y; });
        var 근거 = ns.map(function (n) { return '<a href="#" data-go="lvch-' + n + '">' + n + '장</a>'; }).join(' · ');
        html += '<p class="lv-t" style="margin:0 0 4px">' + (i + 1) + '. ' + esc(t.name) + '</p><p style="margin:0 0 4px">' + esc(t.line) + '</p>'
          + (근거 ? '<p class="hint" style="margin:0 0 12px">' + 근거 + '에서 보여요</p>' : '<div style="height:8px"></div>');
      });
      if (p.todo) html += '<p class="lv-t" style="margin:6px 0 4px">그래서 연애할 때 이렇게 해 보세요</p><p style="margin:0 0 12px">' + esc(p.todo) + '</p>';
      if (p.watch) html += '<p class="lv-t" style="margin:0 0 4px">조심할 것</p><p style="margin:0">' + esc(p.watch) + '</p>';
    }
    box.innerHTML = html + '</section>';
    box.querySelectorAll('a[data-go]').forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        var t = document.getElementById(a.getAttribute('data-go'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
  }

  // 맨 끝 — SSS급 그 사람 사용설명서(#pair)로 가는 상자. 10-02 지금 판(그 사람 생년월일시 하나 · 열두 단계 · 질문 3개 무료)에 맞춘 말 — 옛 판(장면마다 맞대 보기)은 걷었다.
  function 끝상자(box, 저장) {
    if (!저장 || !저장.items || !저장.items.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<section class="card lv-next"><p class="lv-t">SSS급 그 사람 사용설명서</p>'
      + '<p class="hint" style="margin:0 0 10px">이번엔 그 사람 차례예요. 그 사람 생년월일시 하나로, 썸부터 가족과 친구까지 연애 열두 단계에서 그 사람이 어떻게 할지, 왜 그런지, 나에게 어떻게 비칠지 알려 드려요. 질문 3개는 무료예요.</p>'
      + '<button class="btn" type="button" id="lvPair" style="width:100%">그 사람 사용설명서 보기 — 질문 3개 무료</button></section>';
    box.querySelector('#lvPair').onclick = function () {
      if (typeof global.책사들어가기 === 'function') global.책사들어가기('pair'); else location.hash = '#pair';
    };
  }

  // 결제 전 예시(10-02 사장님 「무료범위없이 예시만」) — 손님 본인 답은 결제 전에 하나도 내주지 않는다.
  // 대신 지어낸 한 사람(실제 손님 · 사장님 아님)의 생년월일로 책사가 실제로 만든 결과에서 결론 한 줄 · 모습 하나 · 글 셋을 그대로 옮겼다(비공개 core tools/love-sample.js).
  var 예시자료 = {
    "title": "연애할 때 이 사람은 연락 · 돈 · 약속을 먼저 분명히 정하고, 정한 대로 지켜지는지 끝까지 챙기는 사람이에요",
    "trait": {
      "name": "관계도 규칙으로 정해 둬요",
      "line": "연락 횟수, 이성 친구와 만나는 선, 하지 말아야 할 일까지 먼저 항목으로 꺼내 정해요. 애매한 부분이 남아 있으면 마음이 편하지 않아서예요."
    },
    "items": [
      {
        "section": "마음에 드는 사람이 생겼을 때",
        "t": "소개팅 전 시간·장소·비용까지 미리 정해 둬요",
        "a": "소개팅이 잡히면 만날 시간과 장소를 먼저 정하고, 밥값을 어떻게 나눌지도 미리 생각해 두는 편이에요. 상대가 시간을 정하지 않고 미루면 몇 시, 어디가 좋을지 구체적인 후보를 먼저 보내 정리하는 쪽으로 기울기 쉬워요. 정해진 뒤에는 예약과 가는 길까지 확인해 두고, 당일에 바꾸는 일은 되도록 만들지 않아요. 애매한 상태로 두는 것보다 미리 분명히 해 두어야 마음이 놓이는 경향이 커서 그래요."
      },
      {
        "section": "연락과 애정표현",
        "t": "바쁜 날에도 한 줄이라도 보내서 약속한 연락 횟수를 채워요",
        "a": "하루 몇 번 연락하기로 정했다면, 바쁜 날에도 짧게라도 그 횟수를 채우는 편이에요. 회의 사이나 이동 중에 한 줄이라도 보내서 약속한 수를 맞춰요. 정말 못 할 상황이면 미리 늦어진다고 알려 두는 쪽을 택해요. 정한 약속을 실제로 챙기는 힘이 강해서, 횟수를 어기는 것 자체가 마음에 걸리는 편이에요."
      },
      {
        "section": "싸웠을 때",
        "t": "같은 싸움이 반복되면 다음엔 어떻게 할지 약속을 정해요",
        "a": "같은 문제로 다시 싸우게 되면, 앞으로는 어떻게 할지 둘만의 규칙을 정해 두는 편이에요. 무엇 때문에 또 부딪혔는지 짚은 다음, 다음에 같은 상황이 오면 각자 무엇을 할지까지 정하려 할 가능성이 커요. 정한 규칙은 흐지부지 두지 않고 실제로 지켜지는지 계속 챙기는 쪽으로 기울어요. 같은 일이 되풀이되는 걸 그냥 두기 어렵고, 익숙한 방식으로 안정되게 굴러가는 관계를 원하는 경향이 있어서예요."
      }
    ]
  };
  function 예시(box) {
    var e = 예시자료;
    box.innerHTML = '<section class="card"><h3 class="doc-h">예시 — 지어낸 한 사람의 결과 일부</h3>'
      + '<p class="hint" style="margin:0 0 12px">결제 전에는 내 결과를 보여 드리지 않아요. 대신 책사가 지어낸 한 사람의 생년월일로 실제로 만든 결과에서 몇 줄을 고치지 않고 옮겼어요. 결제하면 내 생년월일로 이런 글을 처음부터 끝까지 받아요.</p>'
      + '<p style="margin:0 0 4px"><b>해독 결과 첫 줄</b></p><p class="lv-t" style="margin:0 0 12px">' + esc(e.title) + '</p>'
      + '<p style="margin:0 0 4px"><b>모습 하나 — ' + esc(e.trait.name) + '</b></p><p style="margin:0 0 4px">' + esc(e.trait.line) + '</p></section>'
      + e.items.map(function (it) { return '<section class="card"><p class="hint" style="margin:0 0 6px">예시 · ' + esc(it.section) + '</p><p class="lv-t">' + esc(it.t) + '</p><p style="margin:0">' + esc(it.a) + '</p></section>'; }).join('');
  }
  // 결제 전 결제 상자 — 결제 열쇠는 누를 때 서버에 묻는다(peek, 만들지도 세지도 않음). 이미 샀으면(검수 계정 포함) 결제 대신 바로 만든다(다음).
  // [필수] 동의에 「생년월일시를 이 콘텐츠를 만드는 데 쓰는 것」을 함께 받는다 — 결제 전에는 생년월일을 서버에 보내지 않는다.
  function 사기상자(box, b, 다음) {
    var 받는것 = ['연애할 때 나는 어떤 사람인지 해독 결과 전문 — 세 가지 모습, 그래서 해 볼 것, 조심할 것',
      '마음에 드는 사람이 생겼을 때부터 오래 함께할 때까지, 장면마다 내가 하는 행동을 풀어 쓴 글 전부',
      '장마다 그 장의 나를 한 줄로 정리해 드려요',
      '결제하면 그때 내 것을 만들어 드려요(1분 남짓). 결제한 카카오 계정에 1년 동안 남아서, 폰에서 열어도 PC에서 열어도 같은 결과가 나와요'];
    box.innerHTML = '<section class="card lv-paybox"><h3 class="doc-h">내 해독 결과 받기</h3>'
      + '<p style="margin:0 0 4px"><b>결제하면 받는 것</b></p><ul style="margin:0 0 10px;padding-left:20px;line-height:1.7">'
      + 받는것.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
      + '<div id="lvBuyWrap"><p style="margin:0 0 6px;font-size:12.5px;line-height:1.7;color:var(--ink2)">결제하면 그때 만들어 바로 열리는 디지털 콘텐츠입니다. '
      + '열람이 시작되면 청약철회(결제 후 7일 안 취소)가 제한될 수 있고, 열람 전에는 전액 환불됩니다. 만들지 못하면 전액 환불됩니다.</p>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.7;color:var(--ink);cursor:pointer;margin:0 0 10px">'
      + '<input type="checkbox" id="lvAgree" style="margin-top:4px;width:auto;flex:none">'
      + '<span><b>[필수]</b> 위 내용과, 생년월일시를 이 콘텐츠를 만드는 데 쓰는 것에 동의합니다. (<a href="terms.html#refund" target="_blank" rel="noopener">환불 규정</a> · <a href="privacy.html" target="_blank" rel="noopener">개인정보 처리방침</a>)</span></label>'
      + '<button class="btn" id="lvBuy" type="button" style="width:100%">출시 기념가 9,900원 결제하고 내 것 받기</button>'
      + '<p class="hint" id="lvPaySay" style="margin:8px 0 0"></p></div></section>';
    var btn = box.querySelector('#lvBuy'), say = box.querySelector('#lvPaySay'), P = global.ChaeksaPay;
    if (P && P.product) P.product('love_full').then(function (p) {
      if (!btn.isConnected || btn.dataset.busy) return;
      if (p && p.amount) btn.textContent = (P.값 ? P.값(p) : '출시 기념가 ' + P.won(p.amount)) + ' 결제하고 내 것 받기';
      else { btn.disabled = true; say.textContent = '온라인 결제는 준비 중이에요. 열리는 대로 이 자리에서 바로 열 수 있어요.'; }
    }).catch(function () {});
    btn.onclick = function () {
      if (btn.dataset.busy) return;
      var ok = box.querySelector('#lvAgree');
      if (!ok || !ok.checked) { say.textContent = '위 [필수] 칸에 체크해 주셔야 결제할 수 있어요.'; return; }
      쓰기(동의키, true);
      var C = global.ChaeksaCloud; P = global.ChaeksaPay;
      if (!P || !P.buy) { say.textContent = '결제 화면을 불러오지 못했어요. 새로고침해 주세요.'; return; }
      if (!(C && C.signedIn && C.signedIn())) {   // 산 것을 그 카카오 계정에 매어 두어야 다른 기기에서도 열린다
        try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, hash: '#love', pick: null, at: Date.now() })); } catch (e) {}
        try { C.signInWith('kakao'); } catch (e) { try { localStorage.removeItem('chaeksa.return'); } catch (x) {} say.textContent = '로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.'; }
        return;
      }
      try { global.ChaeksaTrack && global.ChaeksaTrack.event && global.ChaeksaTrack.event('pay'); } catch (e) {}   // 깔때기 ④ 결제 단추 누름
      var 원래 = btn.textContent;
      btn.dataset.label = 원래; btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = '결제를 준비하는 중…'; say.textContent = '';
      샀나묻기(b).then(function (r) {
        if (r && r.paid === true) { delete btn.dataset.busy; return 다음(); }   // 이미 샀다(검수 계정 · 다른 기기) — 결제 없이 바로 만든다
        var k = 올바른열쇠(r && r.payKey);
        if (!k) throw new Error('결제를 준비하지 못했어요. 새로고침해 주세요.');
        btn.textContent = '결제창을 여는 중…';
        return P.buy('love_full', k, 'kakao');
      }).catch(function (e) { return { ok: false, message: String((e && e.message) || e) }; })
        .then(function (r) {
          if (!btn.isConnected) return;
          delete btn.dataset.busy; btn.disabled = false; btn.textContent = 원래;
          if (r && r.ok === false && !r.closed) say.textContent = r.message || '결제창을 열지 못했어요.';
        });
    };
    if (P && P.곧열림자리) P.곧열림자리(box.querySelector('#lvBuyWrap'));
  }

  // 전체판 결제 상자(10-01) — 잠긴 답이 있을 때만, 1장이 끝나는 자리(#lvPay)에. 값은 서버 상품표(products · love_full)에서 받아 단추에 적는다(pay.js 원칙: 값은 한 곳).
  // 청약철회 안내와 [필수] 동의는 앱 결제 상자(app.js 결제상자)와 같은 말 — 체크 전에는 결제를 열지 않는다.
  // 다 내고 돌아오면(pay-done → #love) 이 탭이 다시 그려지고, 아래 산것확인이 서버에 물어 전체를 받아 온다.
  function 잠금상자(box, 저장, b) {
    var 잠긴 = (저장.items || []).filter(function (it) { return it.locked; }).length;
    var 결론잠김 = !!(저장.portrait && 저장.portrait.locked);
    if (!잠긴 && !결론잠김) { box.innerHTML = ''; return; }
    var 열쇠 = 올바른열쇠(저장.payKey), 열린 = 저장.items.length - 잠긴;
    var 첫장 = 저장.items.length ? 저장.items[0].section : null;
    var 첫장다열림 = !저장.items.some(function (it) { return it.section === 첫장 && it.locked; });
    // 이 목록은 pay.html 「결제하면 풀리는 것」과 같은 말이다(10-02) — 고치면 거기도 같이 고친다.
    var 받는것 = ['연애할 때 나는 어떤 사람인지 해독 결과 전문 — 세 가지 모습, 그래서 해 볼 것, 조심할 것',
      '세 가지 모습마다 몇 장에서 드러나는지 짚어 드려요',
      (첫장다열림 ? '2장부터 마지막 장까지' : '나머지 장면 모두') + ', 연애할 때 내가 하는 행동을 풀어 쓴 글이 바로 열려요',
      (저장.portrait && 저장.portrait.chapters && Object.keys(저장.portrait.chapters).length ? '장마다 그 장의 나를 한 줄로 정리해 드려요' : ''),
      '결제한 카카오 계정에 1년 동안 남아서, 폰에서 열어도 PC에서 열어도 같은 결과가 나와요'];
    box.innerHTML = '<section class="card lv-paybox"><h3 class="doc-h">' + (잠긴 ? '아직 봉인된 글 ' + 잠긴 + '개' : '해독 결과 전체') + '</h3>'
      + (잠긴 ? '<p style="margin:0 0 10px">' + (첫장다열림 ? '1장을 먼저 모두 보여 드렸어요.' : '앞 글 ' + 열린 + '개를 먼저 보여 드렸어요.') + ' 나머지 글도 이미 다 써 두었고, 봉인을 풀면 이 자리에서 바로 보여요.</p>' : '')
      + '<p style="margin:0 0 4px"><b>결제하면 풀리는 것</b></p><ul style="margin:0 0 10px;padding-left:20px;line-height:1.7">'
      + 받는것.filter(Boolean).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
      + '<div id="lvBuyWrap"><p style="margin:0 0 6px;font-size:12.5px;line-height:1.7;color:var(--ink2)">결제하면 바로 열리는 디지털 콘텐츠입니다. '
      + '열람이 시작되면 청약철회(결제 후 7일 안 취소)가 제한될 수 있고, 열람 전에는 전액 환불됩니다.</p>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.7;color:var(--ink);cursor:pointer;margin:0 0 10px">'
      + '<input type="checkbox" id="lvAgree" style="margin-top:4px;width:auto;flex:none">'
      + '<span><b>[필수]</b> 위 내용을 확인했고 동의합니다. (<a href="terms.html#refund" target="_blank" rel="noopener">환불 규정</a>)</span></label>'
      + '<button class="btn" id="lvBuy" type="button" style="width:100%">출시 기념가 9,900원 결제하고 봉인 풀기</button>'
      + '<p class="hint" id="lvPaySay" style="margin:8px 0 0"></p></div></section>';
    var btn = box.querySelector('#lvBuy'), say = box.querySelector('#lvPaySay'), P = global.ChaeksaPay;
    // 서버가 준 결제 열쇠가 없으면 단추를 잠그고 서버에 묻는다. 로그인 전이면 단추는 그대로 두고(누르면 로그인), 돌아와서 묻는다.
    var C1 = global.ChaeksaCloud;
    if (!열쇠 && C1 && C1.enabled && C1.enabled() && C1.signedIn && C1.signedIn()) {
      btn.disabled = true; say.textContent = '결제를 준비하는 중이에요…';
      샀나묻기(b).then(function (r) {
        if (!btn.isConnected) return;   // 다른 곳(산것확인 · 채우기)이 이미 다시 그렸다
        var k = 올바른열쇠(r && r.payKey);
        if (!k) { say.textContent = '결제를 준비하지 못했어요. 새로고침해 주세요.'; return; }
        저장.payKey = k; 쓰기(결과키 + 표(b), 저장); 잠금상자(box, 저장, b);
      }).catch(function () { if (btn.isConnected) say.textContent = '결제를 준비하지 못했어요. 새로고침해 주세요.'; });
    }
    // 단추의 값은 상품표 값으로 다시 적는다. 상품이 내려가 있으면(active 아님) 단추를 잠근다.
    if (P && P.product) P.product('love_full').then(function (p) {
      if (!btn.isConnected || btn.dataset.busy) return;
      if (p && p.amount) btn.textContent = (P.값 ? P.값(p) : '출시 기념가 ' + P.won(p.amount)) + ' 결제하고 봉인 풀기';   // pay.js 값 = 「출시 기념가 9,900원」
      else { btn.disabled = true; say.textContent = '온라인 결제는 준비 중이에요. 열리는 대로 이 자리에서 바로 열 수 있어요.'; }
    }).catch(function () {});
    btn.onclick = function () {
      if (btn.dataset.busy) return;
      var ok = box.querySelector('#lvAgree');
      if (!ok || !ok.checked) { say.textContent = '위 [필수] 칸에 체크해 주셔야 결제할 수 있어요.'; return; }
      var C = global.ChaeksaCloud; P = global.ChaeksaPay;
      if (!P || !P.buy) { say.textContent = '결제 화면을 불러오지 못했어요. 새로고침해 주세요.'; return; }
      if (!(C && C.signedIn && C.signedIn())) {   // 산 것을 그 카카오 계정에 매어 두어야 다른 기기에서도 열린다
        try { localStorage.setItem('chaeksa.return', JSON.stringify({ path: location.pathname, hash: '#love', pick: null, at: Date.now() })); } catch (e) {}
        try { C.signInWith('kakao'); } catch (e) { try { localStorage.removeItem('chaeksa.return'); } catch (x) {} say.textContent = '로그인 창을 열지 못했어요. 잠시 뒤 다시 해 주세요.'; }
        return;
      }
      if (!열쇠) { say.textContent = '결제를 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.'; return; }   // 서버 열쇠 없이는 결제를 열지 않는다
      try { global.ChaeksaTrack && global.ChaeksaTrack.event && global.ChaeksaTrack.event('pay'); } catch (e) {}   // 깔때기 ④ 결제 단추 누름
      var 원래 = btn.textContent;
      btn.dataset.label = 원래; btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = '결제창을 여는 중…'; say.textContent = '';
      // 결제창으로 넘어가면 이 아래는 대개 안 돈다. 돌아왔다면 막힌 것이거나 창을 닫은 것이다(pay.js 누르면과 같은 처리).
      Promise.resolve().then(function () { return P.buy('love_full', 열쇠, 'kakao'); })
        .catch(function (e) { return { ok: false, message: String((e && e.message) || e) }; })
        .then(function (r) {
          delete btn.dataset.busy; btn.disabled = false; btn.textContent = 원래;
          if (r && r.ok === false && !r.closed) say.textContent = r.message || '결제창을 열지 못했어요.';
        });
    };
    // 결제가 아직 시험 모드면(손님은 살 수 없다) 값 단추 자리를 「곧 열려요 · 채널 추가」로 바꾼다. 갈림은 pay.js 곧열림 하나.
    if (P && P.곧열림자리) P.곧열림자리(box.querySelector('#lvBuyWrap'));
  }

  function 그리기(el, profile) {
    if (!el) return;
    if (!profile || !profile.year) {
      el.innerHTML = '<section class="card"><h2>사랑할 때만 나오는 당신</h2><p class="hint">내 생년월일시를 먼저 저장해 주세요.</p></section>';
      return;
    }
    var b = 생일(profile), 키 = 결과키 + 표(b), 저장 = 읽기(키);
    var 이름 = profile.name ? esc(profile.name) + ' · ' : '';
    el.innerHTML = '<div class="lv-cover">' + 그림(표지그림, true) + '<span class="k" id="lvCoverK">연애</span><span class="n" id="lvCoverN">사랑할 때만 나오는 당신</span></div>'
      + '<section class="card">'
      + '<p class="hint" style="margin:0 0 10px">' + 이름 + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? ' (시간 모름)' : ' ' + b.hour + ':' + String(b.minute).padStart(2, '0')) + ' 기준으로, 책사가 직접 만든 알고리즘이 태어난 날의 글자에서 당신이 연애할 때 하는 말과 행동을 계산해요. 맨 위에 「연애할 때 당신은 어떤 사람인지」 결론을 정리하고, 연애의 장면마다 당신이 하는 행동을 장으로 나눠 풀어 드려요. 결제 전에는 지어낸 한 사람의 결과로 예시를 보여 드리고, 결제하면 그때 내 것을 만들어 드려요(출시 기념가). 카카오 계정 하나에 한 사람 한 번 만들 수 있어요. 만든 결과는 폰 · PC 어디서 열어도 같아요.</p>'
      + '<div id="lvHead"></div><ol class="lv-steps" id="lvSteps" hidden></ol><p class="hint" id="lvSt" style="margin:8px 0 0"></p></section>'
      + '<div id="lvTop"></div>'
      + '<p class="hint" id="lvAbout" style="margin:0 0 10px" hidden>태어난 날에서 계산한 행동 경향이라 틀릴 수 있어요.</p>'
      + '<div id="lvList"></div><div id="lvEnd"></div>';
    var head = el.querySelector('#lvHead'), st = el.querySelector('#lvSt'), list = el.querySelector('#lvList'), about = el.querySelector('#lvAbout'), top = el.querySelector('#lvTop'), end = el.querySelector('#lvEnd'), steps = el.querySelector('#lvSteps');
    var timer = null, t0 = null, 기다리는중 = false, 대기키 = 키 + '.wait';
    var 기다림말 = '여덟 글자를 해독하는 중이에요. 다 되면 여기에 바로 떠요. 이 화면을 그대로 두세요.';
    function 알림(msg, err) { clearInterval(timer); steps.hidden = true; st.textContent = msg; st.style.color = err ? 'var(--seal, #8c2f23)' : ''; }
    // 표지 글 — 결론이 있으면 결론 첫 줄, 없으면 콘텐츠 이름
    function 표지글() {
      var p = 저장 && 저장.portrait, k = el.querySelector('#lvCoverK'), n = el.querySelector('#lvCoverN');
      if (k) k.textContent = p && p.title ? '해독 결과' : '연애';
      if (n) n.textContent = p && p.title ? p.title : '사랑할 때만 나오는 당신';
    }
    // 다 받은 결과를 그린다 — 표지 · 결론 · 장들(1장 끝에 결제 상자) · 맨 끝 맞대 보기
    function 다그리기() {
      표지글(); 결론상자(top, 저장); 목록(list, 저장, 키);
      var slot = list.querySelector('#lvPay'); if (slot) 잠금상자(slot, 저장, b);
      끝상자(end, 저장); about.hidden = false;
    }
    // 받은 답을 질문에 붙인다. paid === false 면 서버가 맛보기만 보낸 것 — 안 온 답은 잠금 칸이 된다(옛 서버 답에는 paid 가 없다 → 전부 연 것).
    function 채우기(답들, msg, paid, payKey, 결론) {
      var A = {}; (답들 || []).forEach(function (it) { A[it.id] = it; });
      저장.items.forEach(function (it) {
        if (Object.prototype.hasOwnProperty.call(A, it.id)) { it.a = A[it.id].a || '답을 쓰지 못했어요.'; it.t = A[it.id].t || ''; it.locked = false; }
        else if (paid === false) { it.a = ''; it.t = ''; it.locked = true; }
        else { it.a = '답을 쓰지 못했어요.'; it.t = ''; it.locked = false; }
      });
      저장.paid = paid !== false; if (올바른열쇠(payKey)) 저장.payKey = payKey;
      if (결론 && 결론.title) 저장.portrait = 결론;
      var 잠긴 = 저장.items.filter(function (it) { return it.locked; }).length;
      쓰기(키, 저장); head.innerHTML = '';
      알림((msg || '해독을 마쳤어요.') + (잠긴 ? ' 1장 끝에서 봉인을 풀면 나머지 글 ' + 잠긴 + '개가 보여요.' : ''));
      다그리기();
    }
    // 결론 칸 전에 받은 결과(이 기기에 결론이 없음) — 보관된 답을 다시 불러오면 서버가 결론을 한 번 만들어 같이 준다.
    // 답 받기 문(love-answers)은 보관된 답이 있으면 새로 쓰지 않고 꺼내 준다. 같은 기기에서 6시간에 한 번만 묻는다.
    function 결론없음() {
      var C0 = global.ChaeksaCloud;
      return !저장.portrait && 저장.runId && 저장.sig && !(Date.now() - (+저장.결론물음 || 0) < 6 * 3600 * 1000)
        && C0 && C0.enabled() && C0.signedIn();
    }
    function 첫장잠김() {
      var C0 = global.ChaeksaCloud, 첫 = 저장.items[0] && 저장.items[0].section;
      return !저장.paid && 저장.runId && 저장.sig && 저장.items.some(function (it) { return it.section === 첫 && it.locked; })
        && !(Date.now() - (+저장.결론물음 || 0) < 6 * 3600 * 1000) && C0 && C0.enabled() && C0.signedIn();
    }
    function 결론받기() {
      저장.결론물음 = Date.now(); 쓰기(키, 저장);
      // portraitOnly — 서버에 보관된 답이 없으면 새로 쓰지 말고 그냥 돌아오라는 표시(결론만 받으러 가는 길)
      post('/api/love-answers', { portraitOnly: true, runId: 저장.runId, birth: b, sig: 저장.sig, items: 저장.items.map(function (it) { return { id: it.id, section: it.section, q: it.q }; }) }).then(function (r) {
        if (!list.isConnected || !r || !r.saved || !Array.isArray(r.items)) return;
        채우기(r.items, r.portrait ? '해독 결과를 맨 위에 붙였어요.' : '', r.paid, r.payKey, r.portrait);
      }).catch(function () {});
    }
    // 잠긴 채로 이 기기에 남아 있으면 — 결제하고 돌아왔거나 다른 기기에서 샀을 수 있다. 서버에 샀는지만 묻고(peek, 만들지도 세지도 않음),
    // 샀으면 보관된 전체를 받아 온다(새로 쓰지 않는다 — 원가 0).
    function 산것확인() {
      var C0 = global.ChaeksaCloud;
      if (!C0 || !C0.enabled() || !C0.signedIn()) return;
      샀나묻기(b).then(function (r) {
        var k = 올바른열쇠(r && r.payKey);
        if (k && k !== 저장.payKey) { 저장.payKey = k; 쓰기(키, 저장); }   // 옛 꼴 열쇠를 서버 열쇠로 바꿔 둔다(단추는 잠금상자가 다시 그린다)
        if (!r || r.paid !== true || !list.isConnected) return;
        알림('봉인을 푸는 중이에요…');
        return post('/api/love-questions', { consent: true, birth: b }).then(function (r2) {
          if (!list.isConnected || !r2 || !Array.isArray(r2.answers)) return;
          if (r2.runId !== 저장.runId) 저장 = { runId: r2.runId, sig: r2.sig, payKey: 올바른열쇠(r2.payKey) || 저장.payKey, items: r2.items.map(function (it) { return { id: it.id, section: it.section, q: it.q, a: '', t: '' }; }), fb: 저장.fb || {} };
          채우기(r2.answers, '봉인이 풀렸어요.', r2.paid, r2.payKey, r2.portrait);
        });
      }).catch(function () { if (list.isConnected) 알림(''); });
    }
    if (저장 && 저장.items && 저장.items.length && 저장.items.every(function (it) { return it.a || it.locked; })) {
      다그리기();
      // 결론이 없거나, 옛 무료 범위(1장 일부만 열림)로 남은 결과면 보관된 것을 한 번 다시 받는다(새로 쓰지 않음 — 원가 0, 6시간에 한 번)
      if (결론없음() || 첫장잠김()) 결론받기();   // 답을 다시 불러오는 길이 산 것도 함께 확인한다
      else if (저장.items.some(function (it) { return it.locked; })) 산것확인();
      return;
    }
    // 새로 만드는 건 산 사람만(10-02 「무료범위없이 예시만」) — 로그인은 결제 상자를 누를 때. 이미 받은 결과는 로그인 없이도 보인다.
    var C = global.ChaeksaCloud, 로그인 = !!(C && C.enabled() && C.signedIn());
    // 질문은 받았는데 답이 덜 왔으면(끊김) 답만 다시 받는다 — 질문부터 다시 하면 한 번 더 쓴 것이 된다(한 사람 · 횟수 제한 09-30)
    // 덜 된 동안은 장을 그리지 않는다 — 기다림 네 단계만 보인다.
    var 덜됨 = !!(저장 && 저장.items && 저장.items.length && 저장.runId && 저장.sig);
    var 동의 = 읽기(동의키) === true;
    // 기다림 네 단계 — 지난 단계는 ✓, 지금 단계는 굵게, 남은 단계는 옅게
    function 단계그리기(초수) {
      var n = 0; 단계때.forEach(function (t, i) { if (초수 >= t) n = i; });
      steps.innerHTML = 단계.map(function (t, i) { return '<li class="' + (i < n ? 'done' : i === n ? 'now' : '') + '">' + (i < n ? '✓ ' : '') + t + (i === n ? '…' : '') + '</li>'; }).join('');
    }
    // 걸린 시간은 처음 누른 때부터 센다(새로고침 · 기다림 확인을 거쳐도 이어서)
    function 초(msg) {
      if (기다리는중) msg = 기다림말; t0 = t0 || +읽기(대기키) || Date.now(); 알림(msg); steps.hidden = false;
      var f = function () { var s = Math.max(0, Math.round((Date.now() - t0) / 1000)); st.textContent = msg + ' (' + s + '초)'; 단계그리기(s); };
      f(); timer = setInterval(f, 1000);
    }
    function 지우기(k) { try { localStorage.removeItem(k); } catch (e) {} }
    function 답받기(msg) {
      초(msg);
      return post('/api/love-answers', { runId: 저장.runId, birth: b, sig: 저장.sig, items: 저장.items.map(function (it) { return { id: it.id, section: it.section, q: it.q }; }) }).then(function (r) {
        채우기(r.items, r.saved ? '이 카카오 계정으로 받은 결과를 불러왔어요.' : null, r.paid, r.payKey, r.portrait);
      });
    }
    // 09-30 사장님 「자동뜨게해」 — 이 계정으로 지금 만드는 중이면(새로고침 · 다른 기기) 새로 만들지 않고 10초마다 확인해서 다 되면 바로 띄운다.
    // 확인은 서버에 묻기만 한다(보관된 게 있으면 꺼내 주고, 아직이면 「만드는 중」) — 토큰 안 듦. 누른 표시(대기키)가 있으면 화면을 다시 열어도 이어서 기다린다.
    function 시작() {
      var btn = el.querySelector('#lvGo'); if (!btn || !btn.isConnected) return;
      btn.disabled = true;
      if (!읽기(대기키)) 쓰기(대기키, Date.now());
      var 말 = '1분 남짓 걸려요. 이 화면을 그대로 두세요.';
      var 일 = 덜됨 ? 답받기(말) : (초(말), post('/api/love-questions', { consent: true, birth: b }).then(function (r) {
        저장 = { runId: r.runId, sig: r.sig, payKey: 올바른열쇠(r.payKey), items: r.items.map(function (it) { return { id: it.id, section: it.section, q: it.q, a: '', t: '' }; }), fb: {} };
        쓰기(키, 저장); 덜됨 = true;
        // 이 카카오 계정으로 이미 만든 결과(다른 기기 포함)면 새로 만들지 않고 그대로 꺼내 온다(09-30)
        // 잠긴 사람은 맛보기만 오므로 빈 배열일 수도 있다 — 배열이면 보관된 답이 있다는 뜻이다(10-01)
        if (r.saved && Array.isArray(r.answers) && (r.answers.length || r.paid === false)) return 채우기(r.answers, '이 카카오 계정으로 만든 결과를 불러왔어요.', r.paid, r.payKey, r.portrait);
        return 답받기(말);
      }));
      일.then(function () { 지우기(대기키); 기다리는중 = false; t0 = null; }, function (e) {
        if (!btn.isConnected) return;   // 다른 화면으로 갔으면 그만(다시 열면 이어서)
        if (e.status === 402) { 지우기(대기키); 기다리는중 = false; t0 = null; 알림(''); return 예시판(); }   // 안 샀다 — 예시와 결제 상자로
        if (e.status === 409 && Date.now() - (+읽기(대기키) || Date.now()) < 10 * 60 * 1000) { 기다리는중 = true; 초(기다림말); setTimeout(시작, 10000); return; }
        지우기(대기키); 기다리는중 = false; t0 = null;
        알림(e.message, true); btn.disabled = false;
        if (덜됨 && e.status === 400) { 덜됨 = false; 저장 = null; 지우기(키); list.innerHTML = ''; }   // 이 기기 것이 서버와 안 맞으면 처음부터
        btn.textContent = 덜됨 ? '이어서 받기' : '내 연애 행동 보기';
      });
    }
    // 산 사람 — 만들기 단추를 놓고 바로 시작한다(결제하고 돌아오면 또 누르지 않게).
    function 열고시작() {
      list.innerHTML = ''; end.innerHTML = '';
      head.innerHTML = '<button class="btn" id="lvGo" style="width:100%">' + (덜됨 ? '이어서 받기' : '내 연애 행동 보기') + '</button>';
      el.querySelector('#lvGo').onclick = 시작;
      시작();
    }
    // 안 산 사람 — 지어낸 한 사람 예시 + 결제 상자(누르면 로그인 · 결제, 이미 샀으면 바로 만들기)
    function 예시판() {
      head.innerHTML = ''; about.hidden = true;
      예시(list); 사기상자(end, b, function () { 동의 = true; 열고시작(); });
    }
    if (로그인 && 덜됨) { 동의 = true; 쓰기(동의키, true); 열고시작(); return; }   // 질문까지 받고 끊긴 사람 — 답만 이어서(산 사람만 질문을 받는다)
    if (로그인 && 동의) {   // 결제하고 돌아왔거나 이미 산 사람인지 서버에 묻는다(peek — 만들지도 세지도 않음)
      알림('확인하는 중이에요…');
      샀나묻기(b).then(function (r) { if (!list.isConnected) return; 알림(''); if (r && r.paid === true) 열고시작(); else 예시판(); },
        function () { if (!list.isConnected) return; 알림(''); 예시판(); });
      return;
    }
    지우기(대기키);
    예시판();
  }

  // 장 그림 표 · 그림 · 바탕을 행동양식 궁합(pair.js)도 쓴다
  global.ChaeksaLoveView = { 그리기: 그리기, 장그림: 장그림, 기본그림: 기본그림, 그림: 그림, 띠: 띠, 장머리: 장머리 };
})(typeof window !== 'undefined' ? window : globalThis);
