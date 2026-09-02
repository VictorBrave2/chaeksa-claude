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

  function hit() {
    // 추적을 원하지 않는다고 브라우저가 밝히면 세지 않는다
    var dnt = global.doNotTrack || (global.navigator && (navigator.doNotTrack || navigator.msDoNotTrack));
    if (dnt === '1' || dnt === 'yes') return;
    if (!CFG.url || !CFG.anonKey) return;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
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

  global.ChaeksaTrack = { sourceOf: sourceOf };
})(window);
