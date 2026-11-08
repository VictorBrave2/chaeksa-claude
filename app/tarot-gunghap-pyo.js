/* 정통 타로 궁합 — 결과표 그리기(11-03 사장님 「타로 궁합 ㄱㄱ」 · gunghap-pyo.js · zw-gunghap-pyo.js 와 같은 꼴).
 * 계산은 비공개 /api/tarot-gh-pyo — 나의 켈틱 한 판(물음 연애 · 정통타로 그대로) + 상대의 사람 카드 + 거르개 9 · 무작위 40,000판의 %.
 * 한 짝(나 · 그)은 한 달에 한 판 — 이 기기에 그달 판을 기억해 다시 열면 같은 판(정통타로의 「이번 달」과 같음 · 결정함 82).
 * 글은 tarot-gunghap-pyo-copy.js · 자리 이름 · 카드 연애 풀이는 three-pieces.js(이미 있는 Codex 글) — 이 파일은 고르기 · 부르기 · 그리기만.
 * 사건: tarot_gh_pyo(새 판) · tarot_gh_pyo_again(기억한 판) · tarot_gh_pyo_end(맨 아래까지 봄).
 * 11-07 사장님 「이용자의 상황에 맞게 고르고 → 카드를 고르고 → 상황에 맞는 카드의 풀이 → API 로 10장이 융합된 결론」(결정함 142) — 카드 고르기 앞에 처지 하나(썸 · 사귀는 중 · 헤어진 뒤 · 혼자 마음에 둠)를 고른다.
 *   처지는 판에 실려 서버 서명에 묶이고(바꿀 수 없음), 카드 풀이는 C.카드풀이처지.<처지>(COPY-0044 · 빈 칸은 공통 카드풀이), 엮기 결론은 그 처지의 물음에 답한다. 처지 글(C.처지.목록)이 비어 있으면 이 단계 없이 바로 카드(공통 판). */
(function (global) {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app/api/tarot-gh-pyo';
  var C = global.ChaeksaTarotGhPyoCopy || {}, PP = global.ChaeksaPeople, TPc = global.ChaeksaThreePieces || {};
  var 펼침글 = (TPc.세점 && TPc.세점.펼침) || {};
  // 11-08 사장님 「컨텐츠에 대한 설명이 부족하구나?」 — 설명 칸을 연다. 자리 뜻 열 줄 · 읽는 법 · 열째 카드 끝말은 정통 타로 공용 글(three-pieces.js 세점.펼침)을 그대로 쓰고,
  //   궁합 글(C.자리뜻 열 다 참 · C.읽는법 · C.결과.끝말)이 있으면 그것이 먼저. 소개 글(C.쪽.설명) · 등급 뜻(C.판.등급뜻)은 COPY-0045(Codex) — 비면 그 줄은 안 나온다.
  function 자리뜻표() { var A = C.자리뜻 || {}; return Object.keys(A).filter(function (k) { return A[k]; }).length >= 10 ? A : (펼침글.자리뜻 || {}); }
  function 끝말줄(끝카, 등) {   // 결과 맨 위 — 왜 열째 카드를 먼저 읽나(정통 타로의 끝말 · 대길 · 대흉이면 대까닭 한 줄)
    if (!끝카) return '';
    var R = C.결과 || {}, 놓 = (TPc.놓임말 || {})[끝카.놓임] || 끝카.놓임 || '';
    var 말 = 채움(R.끝말 || 펼침글.끝말, { 카드: 끝카.이름 || '', 놓임: 놓, 길흉: 등[끝카.등급] || '' });
    var 대 = /^대/.test(끝카.등급 || '') && 펼침글.대까닭 ? 채움(펼침글.대까닭[끝카.등급] || '', { 카드: 끝카.이름 || '' }) : '';
    return 칸('p', 'gh-end-line', [말, 대].filter(Boolean).join(' '));
  }
  var 기억열쇠 = 'chaeksa.tarotgh';
  // 11-08 사장님 「정통타로궁합 초기화좀」 — 주소 뒤 ?reset 이면 이 기기에 기억한 판을 지우고 새 판부터(서버엔 판이 없어 지울 게 없다). 주소에서 reset 은 바로 떼어 다시 열어도 또 지우지 않는다.
  try { if (/[?&]reset(=|&|$)/.test(location.search)) { localStorage.removeItem(기억열쇠); history.replaceState(null, '', location.pathname + location.hash); } } catch (e) {}
  var $ = function (id) { return document.getElementById(id); };
  // 11-09 사장님 「궁합3개 합쳐서SSS급 궁합 측정으로 가야지」 — 바깥 주인(sss-gh-pyo.js)이 상자({ out, err, … })를 주면 그리로 그리고, 없으면 이 쪽의 #out · #err. 계산 · 글은 그대로.
  var H = null, OUT = function () { return (H && H.out) || $('out'); }, ERR = function () { return (H && H.err) || $('err'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var 칸 = function (태그, cls, 글) { return 글 ? '<' + 태그 + (cls ? ' class="' + cls + '"' : '') + '>' + esc(글) + '</' + 태그 + '>' : ''; };
  // 11-08 값 뒤 조사를 값의 받침에 맞춘다(three.js 채움과 같은 셈 — 「완드 3가」 → 「완드 3이」 · 끝 괄호는 건너뜀 · 끝이 숫자면 한자음 받침). 공용 약속 {값|와} 도 받는다.
  var 숫자받침 = [21, 8, 0, 16, 0, 0, 1, 8, 8, 0];
  var 받침of = function (s) {
    var 원 = String(s), 앞 = 원.replace(/(?:\s*\([^()]*\))+\s*$/, '') || 원;
    if (/[0-9]$/.test(앞)) return 숫자받침[+앞.slice(-1)];
    var t = 앞.replace(/[^가-힣]+$/, ''); if (!t) return -1; var c = t.charCodeAt(t.length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? c % 28 : -1;
  };
  var 조사짝 = { 와: ['과', '와'], 과: ['과', '와'], 을: ['을', '를'], 를: ['을', '를'], 은: ['은', '는'], 는: ['은', '는'], 이: ['이', '가'], 가: ['이', '가'], 라는: ['이라는', '라는'], 이라는: ['이라는', '라는'] };
  var 조사맞춤 = function (v, 조) { var b = 받침of(v); if (b < 0) return 조; if (조 === '으로' || 조 === '로') return b === 0 || b === 8 ? '로' : '으로'; var 짝 = 조사짝[조]; return 짝 ? 짝[b ? 0 : 1] : 조; };
  var 채움 = function (t, v) {
    return String(t || '').replace(/\{([^{}|]+)(?:\|([^{}]*))?\}([’”」』)]*)((?:으로|로|이라는|라는|와|과|을|를|은|는|이|가)(?=$|[\s.,!?:;]))?/g, function (m, k, 붙, 닫, 뒤) {
      if (!v || v[k] == null) return m;
      var x = String(v[k]);
      return x + (붙 ? 조사맞춤(x, 붙) : '') + (닫 || '') + (뒤 ? 조사맞춤(x, 뒤) : '');
    });
  };
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
  function 부르기(a0, b0) {   // 사람 둘을 주면(바깥 주인) 그 둘, 아니면 고르기 칸(#na · #geu). 시작했으면 true(이번 달 판이 있으면 바로 결과 · 끝은 상자.끝남), 막혔으면 false.
    var 목록 = 사람목록(), G = C.고르기 || {};
    var a = a0 || 목록.find(function (p) { return p.id === $('na').value; }), b = b0 || 목록.find(function (p) { return p.id === $('geu').value; });
    var err = ERR(); if (err) err.textContent = '';
    var 막힘 = function (t) { if (err) err.textContent = t || ''; return false; };
    if (!a || !b || a.id === b.id) return 막힘(G.같은사람);
    var 나 = 입력(a), 그 = 입력(b);
    if (나.hour == null || 그.hour == null || 나.hour === '' || 그.hour === '') return 막힘(G.시모름);
    if (!/^[MF]$/.test(나.gender || '') || !/^[MF]$/.test(그.gender || '')) return 막힘(G.성별모름);
    var 열쇠 = a.id + '|' + b.id + '|' + JSON.stringify([나, 그]), 있던 = 기억읽기()[열쇠];   // 11-04 고치기로 생년월일을 바꾸면 이번 달 판도 새로(사람 id 는 그대로라)
    if (있던 && 있던.때 && 있던.때.달 === 서울달() && 있던.거르개) { 그리기(있던, a, b, true, 열쇠); return true; }
    의식 = { a: a, b: b, 나: 나, 그: 그, 열쇠: 열쇠, 고름: [], 처지: 처지목록().length ? null : '', 움직임: 'spread', r: null, 연: 0 };   // 처지 글이 없으면 '' = 공통(단계 건너뜀)
    의식그리기();
    return true;
  }
  // 11-06 사장님 「카드 10장을 고르는 연출이 없네? 그리고 카드 10장 뽑으라고 안내멘트도 넣어줘」 — 정통 타로(three.js · 결정함 83 · 84)와 같은 연출:
  //   부채꼴 77장(나 카드를 뺀 덱 · 뒤집힌 채)에서 열 장을 고른다(고른 차례 = 자리 1 ~ 10 · 카드는 서버가 섞은 덱의 그 자리 = 몸의 고름) → 한 장씩 뒤집기(판을 눌러도 · 단추를 눌러도) → 열째를 뒤집으면 결과.
  //   글은 정통 타로 글 그대로(세점.펼침.고르기 「{물음}을 두고 카드를 펼칩니다. 아래에서 열 장을 골라 주세요 …」 · 물음 = 세점.물음말.love · 세점.펼침.뒤집기 「{n}번 · {자리} 뒤집기」) · 모양은 three.css 의 판 · 부채꼴 그대로.
  //   이번 달에 이미 펼친 짝(기기 저장)은 연출 없이 바로 결과. 다시 펼친 판(열째 애매)은 결과에서 바로 보인다(판.다시줄).
  var 그림길 = 'art/tarot/chaeksa-v1/', 자리수 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var 오른쪽보는 = new Set(['C08', 'C10', 'C11', 'C12', 'C13', 'P02', 'P08', 'P09', 'P11', 'P13', 'P14', 'S06', 'S07', 'S11', 'S13', 'W02', 'W03', 'W06', 'W07', 'W09', 'W10', 'W11', 'W12']);   // three.js 와 같음(결정함 80 — 나 카드 그림이 보는 쪽)
  var 의식 = null;
  // 11-09 사장님 「타로 카드의식할때 계속 스크롤이 올라가잖아」 — 정통 타로(three.js · 결정함 89)와 같은 지킴: 다시 그리기 전 그 칸(부채 · 판)의 화면 높이를 재어, 다시 그린 뒤 같은 높이로 되돌린다(손끝 아래 그대로).
  //   열째를 고른 뒤 서버를 기다리는 동안도 부채 자리를 빈 칸으로 남겨 쪽이 짧아지지 않게 한다(짧아지면 브라우저가 스크롤을 위로 당긴다). 가짜 문서(시험 · 검사기)에선 조용히 넘어간다.
  var 상자있음 = function (el) { return !!el && (typeof el.getClientRects !== 'function' || el.getClientRects().length > 0); };
  function 화면위of(sel) { try { var el = OUT().querySelector(sel); return el && typeof el.getBoundingClientRect === 'function' && 상자있음(el) ? { sel: sel, top: el.getBoundingClientRect().top } : null; } catch (e) { return null; } }
  function 제자리(지) {
    if (!지) return;
    try { var el = OUT().querySelector(지.sel); if (!el || typeof el.getBoundingClientRect !== 'function' || typeof global.scrollBy !== 'function' || !상자있음(el)) return; var d = el.getBoundingClientRect().top - 지.top; if (Math.abs(d) >= 1) global.scrollBy(0, d); } catch (e) {}
  }
  function 다보이게(sel) {   // 펼친 판이 머리 줄(84) · 아래 띠 · 네비(92)에 가리면 가장 적게 움직여 다 보이게(three.js 다보이게의 짧은 판)
    try {
      var el = OUT().querySelector(sel), 높 = +global.innerHeight || 0; if (!el || !높 || typeof el.getBoundingClientRect !== 'function' || typeof global.scrollBy !== 'function' || !상자있음(el)) return;
      var r = el.getBoundingClientRect(), 위 = 84, 바닥 = 높 - 92, d = 0;
      if (r.top < 위) d = r.top - 위; else if (r.bottom > 바닥) d = Math.min(r.bottom - 바닥, r.top - 위);
      if (Math.abs(d) >= 1) global.scrollBy(0, d);
    } catch (e) {}
  }
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
  // 11-07 처지 고르기(결정함 142) — 열쇠 넷은 서버 · Codex 글과 같다. 이름이 있는 처지만 단추로.
  var 처지열쇠 = ['ssom', 'dating', 'broken', 'crush'];
  function 처지목록() { var L = (C.처지 || {}).목록 || {}; return 처지열쇠.filter(function (k) { return L[k] && L[k].이름; }); }
  function 처지of(k) { return k ? (((C.처지 || {}).목록 || {})[k] || null) : null; }
  function 처지그림() {
    var K = C.처지 || {};
    return '<div class="card three-card three-rite gh-state" data-gh-rite>' + 문장줄('three-fan-say', K.머리) + '<div class="who">' + 처지목록().map(function (k) { return '<button type="button" data-gh-state="' + k + '">' + esc(처지of(k).이름) + '</button>'; }).join('') + '</div>' + 칸('p', 'why', K.도움) + '</div>';
  }
  function 처지고르다(k) {
    var 의 = 의식; if (!의 || 의.r || 의.처지 || 처지목록().indexOf(k) < 0) return;
    의.처지 = k; 의.움직임 = 'spread'; 의식그리기();
  }
  function 의식그리기(지킴) {   // 지킴 { sel, top } — 다시 그린 뒤 그 칸을 이 화면 높이로(결정함 89)
    var 의 = 의식; if (!의) return;
    var 나id = 나카드id(의.a), 자리이름 = 자리이름표(), 자리뜻 = 자리뜻표(), h;
    if (!의.r && 의.처지 == null) { OUT().innerHTML = 처지그림(); return; }
    if (!의.r) {
      var 처 = 처지of(의.처지), 수 = 의.고름.length, 다음 = 수 + 1, 물음 = (TPc.세점 && TPc.세점.물음말 && TPc.세점.물음말.love) || '', 말 = (처 && 처.안내) || (C.고르기 || {}).안내 || (물음 ? 채움(펼침글.고르기, { 물음: 물음 }) : '');
      h = '<div class="card three-card three-rite three-picking" data-gh-rite>' + 고르는판(나id, 수, 의.움직임)
        + 문장줄('three-fan-say', 말) + '<p class="three-fan-count" aria-live="polite"><span class="three-fan-no">' + Math.min(다음, 10) + '</span>' + 칸('b', '', 자리이름[Math.min(다음, 10)] || '') + '<span class="three-fan-of">' + 수 + ' / 10</span></p>'
        + (수 < 10 ? 부채(의.고름, 의.움직임) : '<div class="three-fan" aria-hidden="true"></div>' + 칸('p', 'three-fan-say', C.부르는중)) + '</div>';   // 열째 뒤 서버를 기다리는 동안도 안내 · 셈 줄 · 부채 높이를 그대로 둔다(쪽이 짧아져 스크롤이 올라가지 않게 · 11-09)
    } else {
      var 판 = 의.r.펼침.자리, 연 = 의.연, x = 연 ? 판[연 - 1] : null, P = C.판 || {}, 등 = P.등급 || {}, 단추글 = 채움(펼침글.뒤집기, { n: 연 + 1, 자리: 자리이름[연 + 1] || '' }) || (자리이름[연 + 1] || '');
      h = '<div class="card three-card three-rite" data-gh-rite>' + 뒤집는판(나id, 판, 연, 의.움직임)
        + (연 === 0 ? 문장줄('gh-read', 채움(C.읽는법 || 펼침글.읽는법, {})) : '')   // 11-08 첫 장을 열기 전에 읽는 법 한 줄(정통 타로와 같은 글)
        + (x ? '<p class="gh-flip-now"><span>' + esc(x.n + '. ' + (자리이름[x.n] || '')) + '</span> <b>' + esc(x.이름) + '</b>' + esc([x.놓임 === '거꾸로' ? P.거꾸로 : '', 등[x.등급] || ''].filter(Boolean).map(function (s) { return ' · ' + s; }).join('')) + '</p>'
          + 칸('p', 'gh-flip-pos', 자리뜻[x.n]) + 칸('p', 'gh-flip-m', 연애풀이(x, 의.r.성별 && 의.r.성별[0], 의.r.처지)) : '')   // 11-08 자리의 뜻 한 줄 → 그 자리의 카드 풀이   // 11-08 사장님 「한장씩 열면서 카드이름 + 삽화 + 설명」 — 여는 자리마다 현재 상황의 카드 풀이를 바로 보인다(열 장 판과 같은 글)
        + (연 < 10 ? '<div class="three-flip-foot"><button type="button" class="btn three-rite-btn" data-gh-flip>' + esc(단추글) + '</button></div>' : '') + '</div>';
    }
    OUT().innerHTML = h;
    제자리(지킴);
  }
  function 고르다(i) {
    var 의 = 의식; if (!의 || 의.r || 의.고름.length >= 10) return;
    if (!(i >= 0 && i <= 76 && i === Math.floor(i)) || 의.고름.indexOf(i) >= 0) return;
    var 지 = 화면위of('.three-sp-board');   // 판은 손끝 아래 그대로(부채는 그 아래 같은 자리)
    의.고름.push(i); 의.움직임 = 'pick'; 의식그리기(지);
    if (의.고름.length === 10) 펼쳐부르기();
  }
  function 뒤집다() {
    var 의 = 의식; if (!의 || !의.r || 의.연 >= 10) return;
    var 지 = 화면위of('.three-sp-board');
    의.연++; 의.움직임 = 'flip';
    if (의.연 >= 10) { 의식 = null; 그리기(의.r, 의.a, 의.b, false, 의.열쇠); return; }
    의식그리기(지);
  }
  function 펼쳐부르기() {
    var 의 = 의식;
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ 나: 의.나, 그: 의.그, 고름: 의.고름, 처지: 의.처지 || undefined }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.거르개) throw new Error(j.코드 || 'x'); return j; }); })
      .then(function (r) { if (의식 !== 의) return; var 지 = 화면위of('.three-sp-board'); 기억쓰기(의.열쇠, r); 의.r = r; 의.연 = 0; 의.움직임 = 'deal'; 의식그리기(지); 다보이게('.three-sp-board'); })   // 펼친 판은 고르던 판 자리 그대로(결정함 89)
      .catch(function () { if (의식 === 의) 의식 = null; OUT().innerHTML = ''; var err = ERR(); if (err) err.textContent = C.오류 || ''; });
  }
  if (typeof document !== 'undefined') document.addEventListener('click', function (e) {
    var t = e.target, out = OUT(); if (!t || !t.closest || !out || !out.contains(t)) return;
    var st = t.closest('[data-gh-state]'); if (st) { 처지고르다(st.getAttribute('data-gh-state')); return; }
    var p = t.closest('[data-three-pick]'); if (p) { 고르다(+p.getAttribute('data-three-pick')); return; }
    if (t.closest('[data-gh-flip]') || t.closest('[data-three-flipboard]')) 뒤집다();
  });
  // 11-06 사장님 「열장 엮기를 API로 초안 ㄱㄱ」(결정함 141) — 열 장을 두 사람 이야기로 엮는 결론 · 단락 · 할 일은 비공개 /api/tarot-gh-story 가 쓴다.
  // 보내는 것은 판의 뼈(때 · 성별 · 상대 카드 · 열 장 id · 놓임 · 다시)와 서버가 판에 붙인 서명뿐 — 생년월일 · 이름은 안 간다. 받은 글은 그달 판과 함께 이 기기에 저장해 다시 열면 같은 글.
  var STORY = 'https://chaeksa-behavior-core.vercel.app/api/tarot-gh-story';
  var 옛이야기 = /v0\.[1234]$/;   // 서버 lib/tarot-story.js 판(지금 v0.5 · 출처를 화자로 세우는 말 막음) — 저장된 글이 v0.4 까지면 다시 엮는다(11-07)
  // 11-07 일곱 답(결정함 143 · 사장님 「이 물음 7가지가 처지상황 넷과 융합」) — 결론 한 줄 + 마음 · 결말 · 때 · 할일 · 까닭 · 다른사람 · 나. 답 머리는 C.이야기.물음머리(COPY-0044 · 비면 머리 없이 글만). 옛 글(이야기[] · 할일)도 그대로 그린다.
  var 물음차례 = ['마음', '결말', '때', '할일', '까닭', '다른사람', '나'];
  function 이야기그림(s) {
    var K = C.이야기 || {}, el = OUT().querySelector('#gh-story'); if (!el) return;
    try { if (H && H.이야기) H.이야기(s); } catch (e) {}   // 바깥 주인(SSS급 궁합 측정)에게 엮은 글을 알린다(요약 줄)
    if (!s || !(s.답 || s.이야기)) { el.innerHTML = 칸('p', 'why', K.없음); if (!el.innerHTML) el.remove(); return; }
    var 머리들 = K.물음머리 || {}, h = 칸('p', 'k', K.머리) + 칸('p', 'c', s.결론);
    if (s.답) h += 물음차례.map(function (k) { return s.답[k] ? '<div class="gh-a' + (k === '할일' ? ' is-todo' : '') + '">' + 칸('p', 'qh', 머리들[k]) + 칸('p', k === '할일' ? 'todo' : '', s.답[k]) + '</div>' : ''; }).join('');
    else h += s.이야기.map(function (t) { return 칸('p', '', t); }).join('') + 칸('p', 'todo', s.할일);
    el.innerHTML = h;
  }
  function 엮기(r, 열쇠) {
    var 판 = r.펼침.다시 ? r.펼침.다시.자리 : r.펼침.자리;
    var 몸 = { 때: r.때, 성별: r.성별, 그카드: { id: r.그카드.id, 같은카드: !!r.그카드.같은카드 }, 다시: !!r.펼침.다시, 처지: r.처지 || undefined, 자리: 판.map(function (c) { return { id: c.id, 놓임: c.놓임 }; }), 서명: r.서명 };
    fetch(STORY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(몸) })
      .then(function (x) { return x.json().then(function (j) { if (!x.ok) throw new Error(j.코드 || 'x'); return j; }); })
      .then(function (s) { if (s.이야기) { r.이야기 = s; if (열쇠) 기억쓰기(열쇠, r); } 이야기그림(s); 셈(s.이야기 ? 'tarot_gh_story' : 'tarot_gh_story_none'); })   // 글이 안 온 판은 저장하지 않는다 — 다시 열면 다시 부른다(한 판 한 번은 서버 메모리가 맡음)
      .catch(function (e) { 이야기그림(null); 셈('tarot_gh_story_fail'); try { console.warn('tarot-gh-story', e && e.message); } catch (x) {} });   // 11-08 실패도 사건으로 센다(까닭은 e.message = 서버 코드 또는 fetch 오류)
  }
  // 11-06 궁합 말(COPY-0043) — C.카드풀이.<카드>.<놓임>(두 사람 사이로 쓴 글)이 있으면 그것, 없으면 정통타로 연애 글(three-pieces 세점.펼침.물음카드뜻.love) — 글 하나 또는 { M, F }
  function 연애풀이(x, g, 처지) {   // 11-07 처지 글(C.카드풀이처지.<처지>) 먼저 — 빈 칸은 공통
    var 처 = 처지 && C.카드풀이처지 && C.카드풀이처지[처지], 면 = 처 && 처[x.id] && 처[x.id][x.놓임];
    if (!면) 면 = C.카드풀이 && C.카드풀이[x.id] && C.카드풀이[x.id][x.놓임];
    if (!면) { var t = 펼침글.물음카드뜻 && 펼침글.물음카드뜻.love; 면 = t && t[x.id] && t[x.id][x.놓임]; }
    return typeof 면 === 'string' ? 면 : 면 && typeof 면 === 'object' ? (면[g] || '') : '';
  }
  function 자리이름표() { var A = C.자리이름 || {}; return Object.keys(A).length >= 10 ? A : (펼침글.자리 || {}); }   // 열 자리가 다 차야 궁합 이름을 쓴다(반쯤 섞인 판 없음)
  function 판그림(r, b) {
    var P = C.판 || {}, 등 = P.등급 || {}, 자리이름 = 자리이름표(), 자리뜻 = 자리뜻표(), g = r.성별 && r.성별[0];
    var 판 = r.펼침.다시 ? r.펼침.다시.자리 : r.펼침.자리;
    return 칸('h3', 'sec', P.머리) + (r.펼침.다시 ? 칸('p', 'why', P.다시줄) : '') + '<div class="tg-grid">' + 판.map(function (x) {
      var 그것 = x.id === r.그카드.id && !r.그카드.같은카드;
      var 그림 = 그림id.test(x.id) ? '<img class="' + (x.놓임 === '거꾸로' ? 'rev' : '') + '" src="art/tarot/chaeksa-v1/' + x.id + '-s.webp?v=2" alt="" loading="lazy" decoding="async">' : '';
      return '<div class="tg-c' + (그것 ? ' him' : '') + '">' + 그림 + 칸('p', 'n', x.n + '. ' + (자리이름[x.n] || '')) + 칸('p', 'pos', 자리뜻[x.n])
        + 칸('p', 'y', x.이름) + 칸('p', 'g', [x.놓임 === '거꾸로' ? P.거꾸로 : '', 등[x.등급] || '', 그것 ? 채움(P.상대표시, { 그: 그부름(b) }) : ''].filter(Boolean).join(' · '))
        + 칸('p', 'm', 연애풀이(x, g, r.처지)) + '</div>';
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
    var 엮을 = !!(r.서명 && (!r.이야기 || 옛이야기.test(r.이야기.판 || '')));   // 서명 있는 판(11-06 뒤 새 판)만 엮는다 · 저장된 글이 있으면 다시 안 부른다(v0.1 나열 글만 다시)
    var 처 = 처지of(r.처지), K처 = C.처지 || {};
    var h = (다시 ? 칸('p', 'why', M.다시보기) : '')
      + '<div class="big gh-top">' + 칸('p', 'k', R.머리) + (처 && K처.결과줄 ? 칸('p', 'gh-state-line', 채움(K처.결과줄, { 처지: 처.이름 })) : '') + 칸('h2', 'gh-name', 끝카 ? 끝카.이름 : '') + 칸('p', '', 끝카 ? [끝카.놓임 === '거꾸로' ? P.거꾸로 : '', 등[끝카.등급] || ''].filter(Boolean).join(' · ') : '')
      + 끝말줄(끝카, 등) + 칸('p', 'gh-end-line', 끝카 ? (P.등급뜻 || {})[끝카.등급] : '')   // 11-08 왜 이 카드가 먼저인가 · 이 등급이 무슨 뜻인가(등급뜻은 COPY-0045)
      + 칸('small', '', 채움(M.줄, { 끝: 끝 })) + '</div>'
      + (r.서명 || r.이야기 ? '<div class="card gh-story" id="gh-story">' + (엮을 ? 칸('p', 'why', S.기다림) : '') + '</div>' : '')
      + '<div class="card">' + 그카드줄(r, b) + '</div>' + 넷째줄(r, b)
      + 판그림(r, b) + '<div class="gh-end"></div>';
    var out = OUT(); out.innerHTML = h;
    if (엮을) 엮기(r, 열쇠); else if (r.이야기) 이야기그림(r.이야기);
    셈(다시 ? 'tarot_gh_pyo_again' : 'tarot_gh_pyo');
    try {
      if ('IntersectionObserver' in global) {
        var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { 셈('tarot_gh_pyo_end'); io.disconnect(); } });
        io.observe(out.querySelector('.gh-end'));
      }
    } catch (e) {}
    try { if (H && H.끝남) H.끝남(r, a, b, !!다시); } catch (e) {}   // 바깥 주인(SSS급 궁합 측정)에게 열 장을 다 열었다고 알린다
  }
  // 11-09 SSS급 궁합 측정의 세 면 요약 — 열째 카드 이름 · 놓임 · 길흉(이 판의 「먼저 읽을 것」과 같음) + 엮은 결론 한 줄(있으면). 글은 이 표 · 공용 글 그대로.
  function 요약(r) {
    var P = C.판 || {}, 등 = P.등급 || {}, 판 = r && r.펼침 ? (r.펼침.다시 ? r.펼침.다시.자리 : r.펼침.자리) : [], 끝카 = 판[9];
    if (!끝카) return null;
    return { 이름: 끝카.이름 || '', 한줄: [끝카.놓임 === '거꾸로' ? P.거꾸로 : '', 등[끝카.등급] || ''].filter(Boolean).join(' · '), 결론: (r.이야기 && r.이야기.결론) || '' };
  }
  function 시작() {
    var 쪽 = C.쪽 || {};
    if (쪽.제목) { $('h1').textContent = 쪽.제목; document.title = 쪽.제목 + ' · 책사'; }
    $('sub').textContent = 쪽.소개 || '';
    $('eyebrow').textContent = 쪽.위표시 || '';
    // 11-08 소개 글(COPY-0045) — 이 화면이 무엇을 주나 · 어떻게 보나. 줄 여럿(배열) · 비면 칸 자체가 안 보인다.
    var 설 = 쪽.설명, 줄들 = Array.isArray(설) ? 설.filter(Boolean) : (설 ? [설] : []), ab = $('gh-about');
    if (ab) { ab.innerHTML = 줄들.length ? 칸('p', 'k', 쪽.설명머리) + 줄들.map(function (t) { return 칸('p', '', t); }).join('') : ''; ab.hidden = !줄들.length; }
    고르기그림();
  }
  global.ChaeksaTarotGhPyo = { 그리기: 그리기, 부르기: 부르기, 요약: 요약, 상자: function (o) { H = o || null; } };
  if (typeof document !== 'undefined' && !global.ChaeksaGhHost) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작); else 시작(); }   // 바깥 주인이 있으면 스스로 시작하지 않는다
})(typeof window !== 'undefined' ? window : globalThis);
