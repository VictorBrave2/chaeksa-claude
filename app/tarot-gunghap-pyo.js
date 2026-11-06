/* 정통 타로 궁합 — 결과표 그리기(11-03 사장님 「타로 궁합 ㄱㄱ」 · gunghap-pyo.js · zw-gunghap-pyo.js 와 같은 꼴).
 * 계산은 비공개 /api/tarot-gh-pyo — 나의 켈틱 한 판(물음 연애 · 정통타로 그대로) + 상대의 사람 카드 + 거르개 9 · 무작위 40,000판의 %.
 * 한 짝(나 · 그)은 한 달에 한 판 — 이 기기에 그달 판을 기억해 다시 열면 같은 판(정통타로의 「이번 달」과 같음 · 결정함 82).
 * 글은 tarot-gunghap-pyo-copy.js · 자리 이름 · 카드 연애 풀이는 three-pieces.js(이미 있는 Codex 글) — 이 파일은 고르기 · 부르기 · 그리기만.
 * 사건: tarot_gh_pyo(새 판) · tarot_gh_pyo_again(기억한 판) · tarot_gh_pyo_end(맨 아래까지 봄). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app/api/tarot-gh-pyo';
  var C = global.ChaeksaTarotGhPyoCopy || {}, PP = global.ChaeksaPeople, TPc = global.ChaeksaThreePieces || {};
  var 펼침글 = (TPc.세점 && TPc.세점.펼침) || {};
  var 기억열쇠 = 'chaeksa.tarotgh';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 칸 = function (태그, cls, 글) { return 글 ? '<' + 태그 + (cls ? ' class="' + cls + '"' : '') + '>' + esc(글) + '</' + 태그 + '>' : ''; };
  var 채움 = function (t, v) { return String(t || '').replace(/\{([^}]+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var 쪽수 = function (p) { return (p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : String(Math.round(p))).replace(/\.0+$/, '') + '%'; };
  var 셈 = function (이름) { try { if (global.ChaeksaTrack) global.ChaeksaTrack.event(이름); } catch (e) {} };
  var 글of = function (f) { return (C.거르개 || {})[f.id] || {}; };
  var 그림id = /^(?:M(?:0\d|1\d|2[01])|[WCSP](?:0[1-9]|1[0-4]))$/;
  function 서울달() { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7); } catch (e) { return ''; } }
  function 기억읽기() { try { return JSON.parse(localStorage.getItem(기억열쇠) || '{}') || {}; } catch (e) { return {}; } }
  function 기억쓰기(k, r) {   // 그달 판만 남긴다(지난 달 판은 지운다)
    try { var m = 기억읽기(), 달 = 서울달(), n = {}; Object.keys(m).forEach(function (x) { if (m[x] && m[x].때 && m[x].때.달 === 달) n[x] = m[x]; }); n[k] = r; localStorage.setItem(기억열쇠, JSON.stringify(n)); } catch (e) {}
  }

  function 사람목록() { return PP && PP.list ? PP.list().filter(function (p) { return p && p.birth && p.birth.year; }) : []; }
  // 이름 없이 넣은 사람(people.js 가 「이름 없음」으로 저장)은 표에선 이름을 비우고, 문장에선 고르기 칩과 같은 부름(「나」 · 관계)으로(11-04)
  function 표이름(p) { if (PP && PP.nameOf) return PP.nameOf(p); var n = p && p.name ? String(p.name).trim() : ''; return n && n !== '이름 없음' ? n : ''; }   // people.js nameOf(옛 대체 이름도 이름이 아니다, 11-04 v1621)
  function 부름(p) { return 표이름(p) || (PP && PP.relationOf ? PP.relationOf(p) : (p && p.isSelf ? '나' : (p && p.relation) || '그 사람')); }   // 고르기 칩과 같은 부름(people.js relationOf)
  function 그부름(b) { var n = 부름(b); return n === '나' ? '상대' : n; }   // 11-04 이 쪽의 「나」는 첫 칸(묻는 사람) — 나를 둘째 칸에 고르면 이 쪽 글이 쓰는 「상대」로 부른다(v1622 · 표가 없어 줄 머리를 바꿀 수 없다)
  // 11-04 사장님 「사람추가하라고하네 문제있네」 — 두 사람 고르기 · 더하기 · 고치기를 이 쪽 안에서(pair-pick.js · 세 궁합 쪽 같이 씀). 고른 id 는 #na · #geu.
  function 고르기그림() {
    var G = C.고르기 || {};
    if (!global.ChaeksaPairPick) { $('pick').innerHTML = 칸('p', 'sub', G.사람없음); return; }
    global.ChaeksaPairPick.그리기($('pick'), { 나: G.나, 그: G.그, 단추: G.단추, 도움: G.도움, 없음: G.사람없음, 보기: 부르기 });
  }
  function 입력(p) {
    var b = (p && p.birth) || {}, o = { year: b.year, month: b.month, day: b.day, hour: b.hour, minute: b.minute || 0, gender: b.gender, place: b.place };
    if (b.longitude != null) o.longitude = b.longitude;
    if (b.tzOffset != null) o.tzOffset = b.tzOffset;
    return o;
  }
  function 부르기() {
    var 목록 = 사람목록(), G = C.고르기 || {};
    var a = 목록.find(function (p) { return p.id === $('na').value; }), b = 목록.find(function (p) { return p.id === $('geu').value; });
    var err = $('err'); err.textContent = '';
    if (!a || !b || a.id === b.id) { err.textContent = G.같은사람 || ''; return; }
    var 나 = 입력(a), 그 = 입력(b);
    if (나.hour == null || 그.hour == null || 나.hour === '' || 그.hour === '') { err.textContent = G.시모름 || ''; return; }
    if (!/^[MF]$/.test(나.gender || '') || !/^[MF]$/.test(그.gender || '')) { err.textContent = G.성별모름 || ''; return; }
    var 열쇠 = a.id + '|' + b.id + '|' + JSON.stringify([나, 그]), 있던 = 기억읽기()[열쇠];   // 11-04 고치기로 생년월일을 바꾸면 이번 달 판도 새로(사람 id 는 그대로라)
    if (있던 && 있던.때 && 있던.때.달 === 서울달() && 있던.거르개) { 그리기(있던, a, b, true, 열쇠); return; }
    의식 = { a: a, b: b, 나: 나, 그: 그, 열쇠: 열쇠, 고름: [], 움직임: 'spread', r: null, 연: 0 };
    의식그리기();
  }
  // 11-06 사장님 「카드 10장을 고르는 연출이 없네? 그리고 카드 10장 뽑으라고 안내멘트도 넣어줘」 — 정통 타로(three.js · 결정함 83 · 84)와 같은 연출:
  //   부채꼴 77장(나 카드를 뺀 덱 · 뒤집힌 채)에서 열 장을 고른다(고른 차례 = 자리 1 ~ 10 · 카드는 서버가 섞은 덱의 그 자리 = 몸의 고름) → 한 장씩 뒤집기(판을 눌러도 · 단추를 눌러도) → 열째를 뒤집으면 결과.
  //   글은 정통 타로 글 그대로(세점.펼침.고르기 「{물음}을 두고 카드를 펼칩니다. 아래에서 열 장을 골라 주세요 …」 · 물음 = 세점.물음말.love · 세점.펼침.뒤집기 「{n}번 · {자리} 뒤집기」) · 모양은 three.css 의 판 · 부채꼴 그대로.
  //   이번 달에 이미 펼친 짝(기기 저장)은 연출 없이 바로 결과. 다시 펼친 판(열째 애매)은 결과에서 바로 보인다(판.다시줄).
  var 그림길 = 'art/tarot/chaeksa-v1/', 자리수 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var 오른쪽보는 = new Set(['C08', 'C10', 'C11', 'C12', 'C13', 'P02', 'P08', 'P09', 'P11', 'P13', 'P14', 'S06', 'S07', 'S11', 'S13', 'W02', 'W03', 'W06', 'W07', 'W09', 'W10', 'W11', 'W12']);   // three.js 와 같음(결정함 80 — 나 카드 그림이 보는 쪽)
  var 의식 = null;
  function 서울오늘() { try { var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number); return { y: p[0], m: p[1], d: p[2] }; } catch (e) { var d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; } }
  function 나카드id(p) {   // 서버 나카드of 와 같은 규칙(웨이트 671) — 남 40 이상 나이트 · 아래 킹, 여 40 이상 퀸 · 아래 페이지(판 가운데 그림에만 쓴다)
    var b = (p && p.birth) || {}, t = 서울오늘(), 나이 = t.y - (+b.year || t.y) - ((t.m < +b.month || (t.m === +b.month && t.d < +b.day)) ? 1 : 0);
    return b.gender === 'F' ? (나이 >= 40 ? 'P13' : 'P11') : (나이 >= 40 ? 'P12' : 'P14');
  }
  var 앞면img = function (id, cls) { return 그림id.test(String(id)) ? '<img class="three-sp-img' + cls + '" src="' + 그림길 + id + '-s.webp?v=2" alt="">' : '<span class="three-sp-img three-sp-none' + cls + '"></span>'; };
  var 뒷면img = function (cls) { return '<img class="three-sp-img three-sp-back' + cls + '" src="' + 그림길 + 'back-s.webp" alt="">'; };
  function 판틀(나id, 칸, 덧) {
    var 한칸 = function (n) { var c = 칸(n) || {}; return '<div class="three-sp three-sp-' + n + (c.cls || '') + '" style="--i:' + n + '">' + (c.안 || '') + '<span class="three-sp-n">' + n + '</span></div>'; };
    return '<div class="three-sp-board' + (덧 || '') + (오른쪽보는.has(나id) ? ' is-face-right' : '') + '" aria-hidden="true"><div class="three-sp-mid"><div class="three-sp three-sp-sig" style="--i:0">' + 앞면img(나id, '') + '</div>'
      + 한칸(1) + 한칸(2) + '</div>' + 자리수.slice(2).map(한칸).join('') + '</div>';
  }
  function 고르는판(나id, 수, 움직임) {   // 고른 만큼 뒷면 · 다음 칸 깜박임 · 막 놓인 칸은 날아든다
    return '<div class="three-sp-wrap">' + 판틀(나id, function (n) { return n <= 수
      ? { cls: n === 수 && 움직임 === 'pick' ? ' is-arrive' : '', 안: 뒷면img(n === 2 ? ' is-cross' : '') }
      : { cls: ' is-empty' + (n === 수 + 1 ? ' is-next' : ''), 안: '<span class="three-sp-img three-sp-slot' + (n === 2 ? ' is-cross' : '') + '"></span>' }; }, ' is-pick') + '</div>';
  }
  function 뒤집는판(나id, 자리, 연, 움직임) {   // 연 장까지 앞면(막 뒤집은 칸은 접히고 펴짐) · 나머지 뒷면 · 다음 장 깜박임 · 판 어디를 눌러도 다음 장
    var 판 = 판틀(나id, function (n) {
      var x = 자리[n - 1], 가 = n === 2 ? ' is-cross' : '';
      if (n > 연) return { cls: n === 연 + 1 ? ' is-next' : '', 안: 뒷면img(가) };
      var 앞 = 앞면img(x && x.id, 가 + (x && x.놓임 === '거꾸로' ? ' is-rev' : '')), 막 = n === 연 && 움직임 === 'flip';
      return { cls: 막 ? ' is-flip' : '', 안: 막 ? '<span class="three-sp-face">' + 앞 + '</span><span class="three-sp-backface">' + 뒷면img(가) + '</span>' : 앞 };
    }, ' is-flipping' + (움직임 === 'deal' ? ' is-anim' : ''));
    return '<div class="three-sp-wrap"' + (연 < 10 ? ' data-three-flipboard' : '') + '>' + 판 + '</div>';
  }
  function 부채(고름, 움직임) {   // 77장 -50 ~ 50도 · 고른 장은 빠진다
    var 집 = {}; (고름 || []).forEach(function (i) { 집[i] = 1; });
    var h = '<div class="three-fan' + (움직임 === 'spread' ? ' is-spread' : '') + '" data-three-fan>';
    for (var i = 0; i < 77; i++) { if (집[i]) continue; h += '<button type="button" class="three-fan-card" data-three-pick="' + i + '" style="--a:' + (-50 + 100 * i / 76).toFixed(2) + ';--k:' + i + '" aria-label="' + (i + 1) + '"></button>'; }
    return h + '</div>';
  }
  // 11-06 사장님 「줄바꿈 신경좀 써줘」 — 안내 글은 문장마다 한 줄(폰에서 「고른 / 순서대로」처럼 구절 가운데가 끊기지 않게)
  var 문장줄 = function (cls, 글) { return 글 ? '<p class="' + cls + '">' + String(글).split(/(?<=[.!?])\s+/).map(esc).join('<br>') + '</p>' : ''; };
  function 의식그리기() {
    var 의 = 의식; if (!의) return;
    var 나id = 나카드id(의.a), 자리이름 = 자리이름표(), h;
    if (!의.r) {
      var 수 = 의.고름.length, 다음 = 수 + 1, 물음 = (TPc.세점 && TPc.세점.물음말 && TPc.세점.물음말.love) || '', 말 = (C.고르기 || {}).안내 || (물음 ? 채움(펼침글.고르기, { 물음: 물음 }) : '');
      h = '<div class="card three-card three-rite three-picking" data-gh-rite>' + 고르는판(나id, 수, 의.움직임)
        + (수 < 10 ? 문장줄('three-fan-say', 말) + '<p class="three-fan-count" aria-live="polite"><span class="three-fan-no">' + 다음 + '</span>' + 칸('b', '', 자리이름[다음] || '') + '<span class="three-fan-of">' + 수 + ' / 10</span></p>' + 부채(의.고름, 의.움직임)
          : 칸('p', 'three-fan-say', C.부르는중)) + '</div>';
    } else {
      var 판 = 의.r.펼침.자리, 연 = 의.연, x = 연 ? 판[연 - 1] : null, P = C.판 || {}, 등 = P.등급 || {}, 단추글 = 채움(펼침글.뒤집기, { n: 연 + 1, 자리: 자리이름[연 + 1] || '' }) || (자리이름[연 + 1] || '');
      h = '<div class="card three-card three-rite" data-gh-rite>' + 뒤집는판(나id, 판, 연, 의.움직임)
        + (x ? '<p class="gh-flip-now"><span>' + esc(x.n + '. ' + (자리이름[x.n] || '')) + '</span> <b>' + esc(x.이름) + '</b>' + esc([x.놓임 === '거꾸로' ? P.거꾸로 : '', 등[x.등급] || ''].filter(Boolean).map(function (s) { return ' · ' + s; }).join('')) + '</p>' : '')
        + (연 < 10 ? '<div class="three-flip-foot"><button type="button" class="btn three-rite-btn" data-gh-flip>' + esc(단추글) + '</button></div>' : '') + '</div>';
    }
    $('out').innerHTML = h;
  }
  function 고르다(i) {
    var 의 = 의식; if (!의 || 의.r || 의.고름.length >= 10) return;
    if (!(i >= 0 && i <= 76 && i === Math.floor(i)) || 의.고름.indexOf(i) >= 0) return;
    의.고름.push(i); 의.움직임 = 'pick'; 의식그리기();
    if (의.고름.length === 10) 펼쳐부르기();
  }
  function 뒤집다() {
    var 의 = 의식; if (!의 || !의.r || 의.연 >= 10) return;
    의.연++; 의.움직임 = 'flip';
    if (의.연 >= 10) { 의식 = null; 그리기(의.r, 의.a, 의.b, false, 의.열쇠); return; }
    의식그리기();
  }
  function 펼쳐부르기() {
    var 의 = 의식;
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ 나: 의.나, 그: 의.그, 고름: 의.고름 }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.거르개) throw new Error(j.코드 || 'x'); return j; }); })
      .then(function (r) { if (의식 !== 의) return; 기억쓰기(의.열쇠, r); 의.r = r; 의.연 = 0; 의.움직임 = 'deal'; 의식그리기(); })
      .catch(function () { if (의식 === 의) 의식 = null; $('out').innerHTML = ''; $('err').textContent = C.오류 || ''; });
  }
  if (typeof document !== 'undefined') document.addEventListener('click', function (e) {
    var t = e.target, out = $('out'); if (!t || !t.closest || !out || !out.contains(t)) return;
    var p = t.closest('[data-three-pick]'); if (p) { 고르다(+p.getAttribute('data-three-pick')); return; }
    if (t.closest('[data-gh-flip]') || t.closest('[data-three-flipboard]')) 뒤집다();
  });
  // 11-06 사장님 「열장 엮기를 API로 초안 ㄱㄱ」(결정함 141) — 열 장을 두 사람 이야기로 엮는 결론 · 단락 · 할 일은 비공개 /api/tarot-gh-story 가 쓴다.
  // 보내는 것은 판의 뼈(때 · 성별 · 상대 카드 · 열 장 id · 놓임 · 다시)와 서버가 판에 붙인 서명뿐 — 생년월일 · 이름은 안 간다. 받은 글은 그달 판과 함께 이 기기에 저장해 다시 열면 같은 글.
  var STORY = 'https://chaeksa-behavior-core.vercel.app/api/tarot-gh-story';
  function 이야기그림(s) {
    var K = C.이야기 || {}, el = $('gh-story'); if (!el) return;
    if (!s || !s.이야기) { el.innerHTML = 칸('p', 'why', K.없음); if (!el.innerHTML) el.remove(); return; }
    el.innerHTML = 칸('p', 'k', K.머리) + 칸('p', 'c', s.결론) + s.이야기.map(function (t) { return 칸('p', '', t); }).join('') + 칸('p', 'todo', s.할일);
  }
  function 엮기(r, 열쇠) {
    var 판 = r.펼침.다시 ? r.펼침.다시.자리 : r.펼침.자리;
    var 몸 = { 때: r.때, 성별: r.성별, 그카드: { id: r.그카드.id, 같은카드: !!r.그카드.같은카드 }, 다시: !!r.펼침.다시, 자리: 판.map(function (c) { return { id: c.id, 놓임: c.놓임 }; }), 서명: r.서명 };
    fetch(STORY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(몸) })
      .then(function (x) { return x.json().then(function (j) { if (!x.ok) throw new Error(j.코드 || 'x'); return j; }); })
      .then(function (s) { if (s.이야기) { r.이야기 = s; if (열쇠) 기억쓰기(열쇠, r); } 이야기그림(s); 셈(s.이야기 ? 'tarot_gh_story' : 'tarot_gh_story_none'); })   // 글이 안 온 판은 저장하지 않는다 — 다시 열면 다시 부른다(한 판 한 번은 서버 메모리가 맡음)
      .catch(function () { 이야기그림(null); });
  }
  // 11-06 궁합 말(COPY-0043) — C.카드풀이.<카드>.<놓임>(두 사람 사이로 쓴 글)이 있으면 그것, 없으면 정통타로 연애 글(three-pieces 세점.펼침.물음카드뜻.love) — 글 하나 또는 { M, F }
  function 연애풀이(x, g) {
    var 면 = C.카드풀이 && C.카드풀이[x.id] && C.카드풀이[x.id][x.놓임];
    if (!면) { var t = 펼침글.물음카드뜻 && 펼침글.물음카드뜻.love; 면 = t && t[x.id] && t[x.id][x.놓임]; }
    return typeof 면 === 'string' ? 면 : 면 && typeof 면 === 'object' ? (면[g] || '') : '';
  }
  function 자리이름표() { var A = C.자리이름 || {}; return Object.keys(A).length >= 10 ? A : (펼침글.자리 || {}); }   // 열 자리가 다 차야 궁합 이름을 쓴다(반쯤 섞인 판 없음)
  function 판그림(r, b) {
    var P = C.판 || {}, 등 = P.등급 || {}, 자리이름 = 자리이름표(), g = r.성별 && r.성별[0];
    var 판 = r.펼침.다시 ? r.펼침.다시.자리 : r.펼침.자리;
    return 칸('h3', 'sec', P.머리) + (r.펼침.다시 ? 칸('p', 'why', P.다시줄) : '') + '<div class="tg-grid">' + 판.map(function (x) {
      var 그것 = x.id === r.그카드.id && !r.그카드.같은카드;
      var 그림 = 그림id.test(x.id) ? '<img class="' + (x.놓임 === '거꾸로' ? 'rev' : '') + '" src="art/tarot/chaeksa-v1/' + x.id + '-s.webp?v=2" alt="" loading="lazy" decoding="async">' : '';
      return '<div class="tg-c' + (그것 ? ' him' : '') + '">' + 그림 + 칸('p', 'n', x.n + '. ' + (자리이름[x.n] || ''))
        + 칸('p', 'y', x.이름) + 칸('p', 'g', [x.놓임 === '거꾸로' ? P.거꾸로 : '', 등[x.등급] || '', 그것 ? 채움(P.상대표시, { 그: 그부름(b) }) : ''].filter(Boolean).join(' · '))
        + 칸('p', 'm', 연애풀이(x, g)) + '</div>';
    }).join('') + '</div>';
  }
  function 그카드줄(r, b) {
    var K = C.그카드 || {}, 자리이름 = 자리이름표(), k = r.그카드;
    if (k.같은카드) return 칸('p', 'why', K.같은카드);
    return 칸('p', '', 채움(K.줄, { 그: 그부름(b), 카드: k.이름 || '' }))
      + (k.자리 ? 칸('p', 'why', 채움(K.나온자리, { 자리: k.자리 + '. ' + (자리이름[k.자리] || '') })) : 칸('p', 'why', K.안나옴));
  }
  // 11-06 사장님 「타로를 필터식으로 할 필요는 없지 않느냐」 — 거르개 아홉 · 비율 걷음(결정함 140). 타로 궁합 = 이번 달 연애 열 장 읽기 + 상대 카드가 어디 나왔나 + 넷째 자리(무의식의 배우자 · 결정함 134).
  // 넷째 자리 줄 — 값은 판[3](카드 · 사람 카드인가 · 상대 카드와 같은가) · 글은 C.넷째(COPY-0042). 머리가 비면 안 그린다.
  function 넷째줄(r, b) {
    var K = C.넷째 || {}; if (!K.머리) return '';
    var 판 = r.펼침.다시 ? r.펼침.다시.자리 : r.펼침.자리, x = 판[3]; if (!x) return '';
    var 사람 = /^[WCSP]1[1-4]$/.test(x.id), 같은 = !r.그카드.같은카드 && x.id === r.그카드.id;
    var 값 = { 그: 그부름(b), 카드: x.이름 || '' };
    return '<div class="card gh-t4">' + 칸('p', 'k', K.머리) + 칸('p', '', 채움(같은 ? K.같은줄 : 사람 ? K.사람줄 : K.상태줄, 값)) + 칸('p', 'why', K.뜻줄) + '</div>';
  }
  function 그리기(r, a, b, 다시, 열쇠) {
    var R = C.결과 || {}, M = C.이번달 || {}, P = C.판 || {}, 등 = P.등급 || {}, S = C.이야기 || {};
    var 판 = r.펼침.다시 ? r.펼침.다시.자리 : r.펼침.자리, 끝카 = 판[9];
    var 끝 = r.때 && r.때.끝 ? (+r.때.끝.slice(5, 7)) + '월 ' + (+r.때.끝.slice(8, 10)) + '일' : '';
    var 엮을 = !!(r.서명 && !r.이야기);   // 서명 있는 판(11-06 뒤 새 판)만 엮는다 · 저장된 글이 있으면 다시 안 부른다
    var h = (다시 ? 칸('p', 'why', M.다시보기) : '')
      + '<div class="big gh-top">' + 칸('p', 'k', R.머리) + 칸('h2', 'gh-name', 끝카 ? 끝카.이름 : '') + 칸('p', '', 끝카 ? [끝카.놓임 === '거꾸로' ? P.거꾸로 : '', 등[끝카.등급] || ''].filter(Boolean).join(' · ') : '')
      + 칸('small', '', 채움(M.줄, { 끝: 끝 })) + '</div>'
      + (r.서명 || r.이야기 ? '<div class="card gh-story" id="gh-story">' + (엮을 ? 칸('p', 'why', S.기다림) : '') + '</div>' : '')
      + '<div class="card">' + 그카드줄(r, b) + '</div>' + 넷째줄(r, b)
      + 판그림(r, b) + '<div id="gh-end"></div>';
    $('out').innerHTML = h;
    if (r.이야기) 이야기그림(r.이야기); else if (엮을) 엮기(r, 열쇠);
    셈(다시 ? 'tarot_gh_pyo_again' : 'tarot_gh_pyo');
    try {
      if ('IntersectionObserver' in global) {
        var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { 셈('tarot_gh_pyo_end'); io.disconnect(); } });
        io.observe($('gh-end'));
      }
    } catch (e) {}
  }
  function 시작() {
    var 쪽 = C.쪽 || {};
    if (쪽.제목) { $('h1').textContent = 쪽.제목; document.title = 쪽.제목 + ' · 책사'; }
    $('sub').textContent = 쪽.소개 || '';
    $('eyebrow').textContent = 쪽.위표시 || '';
    고르기그림();
  }
  global.ChaeksaTarotGhPyo = { 그리기: 그리기 };
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작); else 시작(); }
})(typeof window !== 'undefined' ? window : globalThis);
