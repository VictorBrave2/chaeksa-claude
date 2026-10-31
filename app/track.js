/* 책사 · 유입 카운터
 *
 * 블로그를 올려도 그중 몇 명이 실제로 사이트에 왔는지 알 방법이 없었다.
 * 그 하나만 세기 위한 코드다.
 *
 * 저장하는 것 — 언제 / 어디서 왔나 / 어느 화면 / 이 브라우저의 첫 방문인가 /
 *              (스위치를 켜면) 브라우저가 스스로 만든 무작위 id — 돌아온 사람을 세기 위해서다.
 * 저장하지 않는 것 — IP, 사용자 에이전트, 계정, 화면 크기, 그 밖의 모든 것.
 *
 * 실패해도 앱은 아무 영향을 받지 않는다. 통계 때문에 서비스가 멈추면 안 된다.
 */
(function (global) {
  'use strict';

  var CFG = global.CHAEKSA_SUPABASE || {};
  var KEY_SEEN = 'chaeksa.seen';        // 첫 방문 판별
  var KEY_LAST = 'chaeksa.trackAt';     // 같은 세션 중복 기록 방지

  /** 어디서 왔는가. 알려진 곳은 이름으로, 나머지는 호스트만. 경로·검색어는 버린다. */
  function sourceOf() {
    try {
      var q = new URLSearchParams(location.search);
      var tag = q.get('from') || q.get('utm_source');
      if (tag) return String(tag).slice(0, 40);

      var ref = document.referrer;
      if (!ref) return 'direct';
      var h = new URL(ref).hostname.replace(/^www\./, '');
      if (h === location.hostname) return 'internal';
      if (h.indexOf('naver.') >= 0) return 'naver';
      if (h.indexOf('google.') >= 0) return 'google';
      if (h.indexOf('daum.') >= 0 || h.indexOf('kakao.') >= 0) return 'daum/kakao';
      if (h.indexOf('instagram.') >= 0) return 'instagram';
      if (h.indexOf('youtube.') >= 0) return 'youtube';
      if (h.indexOf('t.co') >= 0 || h.indexOf('x.com') >= 0) return 'x';
      return h.slice(0, 40);
    } catch (e) { return 'direct'; }
  }

  function firstTime() {
    try {
      if (localStorage.getItem(KEY_SEEN)) return false;
      localStorage.setItem(KEY_SEEN, '1');
      return true;
    } catch (e) { return false; }
  }

  /** 같은 사람이 새로고침할 때마다 세지 않는다 (6시간에 한 번) */
  function tooSoon() {
    try {
      var last = +(localStorage.getItem(KEY_LAST) || 0);
      if (last && Date.now() - last < 6 * 3600 * 1000) return true;
      localStorage.setItem(KEY_LAST, String(Date.now()));
      return false;
    } catch (e) { return false; }
  }

  /** 추적을 원하지 않는다고 브라우저가 밝혔는가(Do Not Track). 방문도 사건도 이것 하나로 거른다 — 개인정보처리방침 1-1. */
  function dntOn() {
    try {
      var dnt = global.doNotTrack || (global.navigator && (navigator.doNotTrack || navigator.msDoNotTrack));
      return dnt === '1' || dnt === 'yes';
    } catch (e) { return false; }
  }

  // 로봇 · 헤드리스 — 방문(hit)과 사건(event)이 같이 쓴다(한 곳에서만 고친다).
  //   다음(Daum) 앱(DaumApps/)은 사람이다 — 거르는 건 다음 수집 로봇(Daumoa · Daum/x.y)뿐(11-01 v1542).
  //   11-01 v1543 — JS 를 돌리는 구글 도구(Google-InspectionTool · GoogleOther · Google-Read-Aloud · Chrome-Lighthouse)와 카카오톡 미리보기(kakaotalk-scrap)도 거른다.
  //   폰 상표 CUBOT 은 로봇이 아니다(이름에 bot 이 들어 있어 그 폰 손님이 빠졌다).
  //   옛 아이폰 Safari 가 못 읽는 정규식(뒤를 보는 (?<!…) 등)은 쓰지 않는다 — 이 파일이 통째로 멈춘다.
  function botLike() {
    try {
      if (navigator.webdriver) return true;
      var ua = String(navigator.userAgent || '').replace(/cubot/ig, '');
      return /bot|crawl|spider|slurp|headless|yeti|daumoa|daum\/|bingpreview|facebookexternalhit|preview|inspectiontool|googleother|read-aloud|lighthouse|kakaotalk-scrap/i.test(ua);
    } catch (e) { return false; }
  }

  function hit() {
    // 추적을 원하지 않는다고 브라우저가 밝히면 세지 않는다
    if (dntOn()) return;
    if (!CFG.url || !CFG.anonKey) return;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
    // 내(클로드) 캡처·검사 방문은 세지 않는다 — 주소에 cap= 또는 scan= 이 붙는다(2026-09-15 헤드리스 캡처가 첫 방문 열 건으로 찍혔다).
    try { var q = new URLSearchParams(location.search); if (q.has('cap') || q.has('scan')) return; } catch (e) {}
    // 10-25 배포가 많던 날(10-22~24 커밋 36 · 37 · 50)마다 「첫 방문 · direct」가 110~134 로 뛰었다 — 바뀐 쪽을 다시 그리는 검색 로봇(JS 실행)이다. 로봇 · 헤드리스는 세지 않는다. 사람 수는 그대로(사주 넣은 사람 하루 4~5).
    if (botLike()) return;
    if (tooSoon()) return;

    var row = {
      source: sourceOf(),
      path: String(location.pathname || '/').slice(0, 120),
      first_time: firstTime(),
    };
    // 돌아온 사람 (docs/29 여덟) — 브라우저가 스스로 만든 무작위 id.
    // IP·UA·계정과 무관하고 지우면 새 사람이다. 열이 없는 표에 보내면 PostgREST 가
    // 기록 전체를 거절하므로 migrate-16 을 돌린 뒤 config.js 스위치로 켠다.
    if (global.CHAEKSA_TRACK_VID) {
      try {
        var vid = localStorage.getItem('chaeksa.vid');
        if (!vid) {
          var a = new Uint8Array(12); (global.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; });
          vid = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
          localStorage.setItem('chaeksa.vid', vid);
        }
        row.vid = vid;
      } catch (e) {}
    }
    var body = JSON.stringify(row);
    try {
      fetch(CFG.url + '/rest/v1/visits', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: CFG.anonKey,
          Authorization: 'Bearer ' + CFG.anonKey,
          Prefer: 'return=minimal',
        },
        body: body,
        keepalive: true,          // 곧바로 다른 페이지로 떠나도 전송이 끝난다
      }).catch(function () {});    // 실패는 조용히 넘긴다
    } catch (e) {}
  }

  // 화면이 실제로 보인 뒤에 센다 (프리렌더·봇 프리페치를 걸러낸다)
  function start() {
    if (document.visibilityState === 'visible') hit();
    else document.addEventListener('visibilitychange', function once() {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', once);
        hit();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  /** 깔때기 사건(2026-09-15 사장님 「계기판을 어떻게 살리지」) — 같은 visits 표에 path='ev:이름' 으로 한 줄.
   *  profile(생년월일 넣음) · sheet(유료 장 엶) · pay(결제 단추 누름) · applymail(출산택일 신청 쪽의 메일 신청 단추, 2026-09-22).
   *  naverform 은 바깥 신청 폼 단추였다(10-02 네이버폼 걷음 — 더 보내지 않는다). 한 브라우저에서 하루 한 번만.
   *  집계는 funnel_stats(migrate-30) 가 vid 로 사람을 가른다. 스위치가 꺼져 있으면 vid 없이 보내 사건 수만 남는다.
   *  opt.noVid — 방문 번호를 붙이지 않는다. index.html 머리의 오류 문지기(err:파일:줄, 10-02)가 쓴다: 고장 횟수만 세면 되므로 사람과 잇지 않는다. */
  function event(name, opt) {
    try {
      if (dntOn()) return;   // 방문과 같다 — Do Not Track 이면 사건도 안 남긴다(2026-09-22, 방침과 어긋나 있었다)
      if (!CFG.url || !CFG.anonKey) return;
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
      // 11-01 방문 세기(hit)와 같은 거름 — 로봇 · 헤드리스 · 내(클로드) 캡처 · 검사(cap= · scan=)는 사건도 세지 않는다(헤드리스 시험이 three3 · three3_q 사건을 남겼다).
      try { var q = new URLSearchParams(location.search); if (q.has('cap') || q.has('scan')) return; } catch (e) {}
      if (botLike()) return;
      var k = 'chaeksa.ev.' + name, today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(k) === today) return;
      localStorage.setItem(k, today);
      var row = { source: 'ev', path: 'ev:' + String(name).slice(0, 40), first_time: false };
      if (global.CHAEKSA_TRACK_VID && !(opt && opt.noVid)) { var vid = localStorage.getItem('chaeksa.vid'); if (vid) row.vid = vid; }
      fetch(CFG.url + '/rest/v1/visits', {
        method: 'POST', keepalive: true,
        headers: { 'content-type': 'application/json', apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey, Prefer: 'return=minimal' },
        body: JSON.stringify(row),
      }).catch(function () {});
    } catch (e) {}
  }

  /** 끝까지 읽었나 — 결과 칸(box)의 마지막 줄이 화면에 들어오면 name 사건을 하루 한 번 남긴다(10-28 방향 「끝까지 읽는가」).
   *  나중에 다시 그려도 새 마지막 줄을 본다. 화면에 보이는 것은 바꾸지 않는다. */
  var 보는중 = typeof WeakMap === 'function' ? new WeakMap() : null;
  function watchEnd(box, name) {
    try {
      if (!box || !global.IntersectionObserver) return;
      if (보는중 && 보는중.get(box)) 보는중.get(box).disconnect();
      var last = box.lastElementChild;
      while (last && last.lastElementChild && last.offsetHeight > (global.innerHeight || 800)) last = last.lastElementChild;
      if (!last) return;
      var io = new IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) { io.disconnect(); event(name); return; }
      });
      io.observe(last);
      if (보는중) 보는중.set(box, io);
    } catch (e) {}
  }

  global.ChaeksaTrack = { sourceOf: sourceOf, event: event, watchEnd: watchEnd };
})(window);
