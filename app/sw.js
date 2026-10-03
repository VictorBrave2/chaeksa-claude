/* 책사 서비스 워커
 * 10-02 개편 3묶음 「빠르기」 — 주소마다 받는 길을 셋으로 나눈다. 전에는 무엇이든 네트워크에서 먼저 받고, 배포마다(하루 스무 번도)
 * 캐시를 통째로 지워서, 다시 온 손님도 스크립트 1.2MB 를 다시 받았다.
 *  ① 내용 지문이 붙은 파일(?v= 뒤가 0-9a-f 열 자 — tools_bust.py 가 파일 내용으로 붙인다) — 캐시 먼저.
 *     내용이 바뀌면 지문(주소)이 바뀌므로 같은 주소는 언제나 같은 내용이다. 그래서 다시 온 손님은 바뀐 파일만 새로 받는다.
 *     이 칸(chaeksa-files)은 배포마다 지우지 않는다. 같은 파일의 옛 지문은 새 지문을 넣을 때 지운다.
 *  ② 그림 — 캐시에 있으면 그것을 바로 보이고, 뒤에서 새로 받아 바꿔 둔다(다음에 열 때 새 그림). 칸(chaeksa-img)은 그림 400장까지.
 *  ③ HTML — 늘 새로 받는다(여기에 ①의 주소가 적혀 있다). 인터넷이 끊겼을 때만 캐시(그 쪽 · 없으면 홈).
 *  그 밖(지문 없는 파일 · 숫자 ?v=) — 네트워크 먼저, 끊겼을 때만 캐시.
 *  캐시에는 제대로 받은 것(r.ok)만 넣는다 — 404 · 오류 쪽이 캐시에 남아 다음에 그것을 보이는 일이 없게.
 */
const CACHE = 'chaeksa-v1293';          // tools_bust.py --bump 가 올린다 — 이 파일이 바뀌어야 브라우저가 새 일꾼을 받는다
const FILES_CACHE = 'chaeksa-files';    // ① 지문 붙은 파일 — 배포마다 지우지 않는다
const IMG_CACHE = 'chaeksa-img';        // ② 그림
const IMG_MAX = 400;
// 설치 때 미리 넣어 두는 쪽 — 인터넷이 끊겼을 때 보일 것. 미리보기 그림(og.jpg)은 뺐다(화면에 쓰지 않는 큰 그림).
const FILES = ['./', './index.html', './privacy.html', './terms.html', './taekil.html', './manifest.json', './favicon.ico', './icon-192.png', './icon-512.png'];
const 지문 = /[?&]v=[0-9a-f]{10}(?:&|$)/;
// 내 컴퓨터 개발 서버(localhost)에서는 아무것도 가로채지 않는다 — 파일을 고친 뒤 지문을 다시 붙이기(tools_bust.py) 전까지는
// 주소가 그대로라, 캐시 먼저면 고친 것이 안 보인다. 개발 화면은 늘 네트워크에서 받는다.
const 개발 = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(self.location.hostname) || /\.(localhost|test)$/.test(self.location.hostname);
const 그림 = /\.(?:webp|png|jpe?g|gif|svg|ico|avif)$/i;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  const 둘것 = [CACHE, FILES_CACHE, IMG_CACHE];
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => 둘것.indexOf(k) < 0).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// ① 캐시 먼저 — 없으면 받아서 넣고, 같은 파일의 옛 지문은 지운다.
function 캐시먼저(req, url) {
  return caches.open(FILES_CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) {
      const copy = r.clone();
      c.put(req, copy).then(() => c.keys()).then((ks) => Promise.all(ks.filter((k) => {
        const u = new URL(k.url);
        return u.pathname === url.pathname && u.search !== url.search;
      }).map((k) => c.delete(k)))).catch(() => {});
    }
    return r;
  })));
}
// ② 그림 — 있는 것을 먼저 보이고 뒤에서 새로 받는다. 없으면 받은 것을 보이고 넣는다. {답, 뒤} — 뒤 = 캐시에 넣기까지(일꾼이 그때까지 살아 있게).
function 그림먼저(req) {
  const 칸 = caches.open(IMG_CACHE);
  let 넣기 = null;
  const 새로 = fetch(req).then((r) => {
    if (r.ok) {
      const copy = r.clone();
      넣기 = 칸.then((c) => c.put(req, copy).then(() => c.keys()).then((ks) => ks.length > IMG_MAX
        ? Promise.all(ks.slice(0, ks.length - IMG_MAX).map((k) => c.delete(k))) : null)).catch(() => {});
    }
    return r;
  });
  const 답 = 칸.then((c) => c.match(req)).then((hit) => hit || 새로);
  return { 답, 뒤: 새로.then(() => 넣기, () => null) };
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (개발 || req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // ③ HTML은 캐시를 건너뛰고 항상 최신을 받는다 (오프라인일 때만 캐시)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req.url, { cache: 'no-store' })
        .then((r) => {
          // 홈만 홈 자리에 넣는다. 예전엔 어떤 주소를 받아오든 './index.html' 칸에
          // 덮어썼다 — 결제 착지(pay-done.html)를 지나고 나면 홈 캐시가 그 페이지로
          // 바뀌어, 오프라인에서 앱을 열면 방금 결제한 손님이
          // 「결제를 마치지 못했습니다」를 본다. 404 도 같은 식으로 홈을 오염시켰다.
          const p = new URL(r.url || req.url, self.location.origin).pathname;
          const 홈 = p === '/' || /\/index\.html$/.test(p);
          if (r.ok && 홈) { const c = r.clone(); caches.open(CACHE).then((x) => x.put('./index.html', c)); }
          return r;
        })
        // 끊겼을 때 — 홈은 마지막으로 받은 홈, 그 밖은 설치 때 넣어 둔 그 쪽(개인정보처리방침 · 약관 · 출산택일)이 있으면 그것, 없으면 홈
        .catch(() => {
          const p = new URL(req.url).pathname;
          const 홈 = p === '/' || /\/index\.html$/.test(p);
          return (홈 ? caches.match('./index.html') : caches.match(req, { ignoreSearch: true })).then((r) => r || caches.match('./index.html'));
        })
    );
    return;
  }

  const url = new URL(req.url);
  if (지문.test(url.search)) { e.respondWith(캐시먼저(req, url)); return; }
  if (그림.test(url.pathname)) { const 일 = 그림먼저(req); e.respondWith(일.답); e.waitUntil(일.뒤); return; }

  e.respondWith(
    fetch(req)
      .then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return r; })
      .catch(() => caches.match(req))
  );
});

/* 아침 푸시는 2026-09-14 걷었다(오늘 탭 없음). */
