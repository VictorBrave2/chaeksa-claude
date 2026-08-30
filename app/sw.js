/* 책사 서비스 워커
 * HTML(내비게이션)은 항상 새로 받는다 — 여기에 정적 파일의 ?v=N 이 적혀 있으므로
 * HTML이 캐시되면 사용자가 계속 옛 버전을 쓰게 된다.
 * 나머지 자원은 URL에 버전이 붙어 있어 네트워크 우선 + 캐시 폴백으로 충분하다.
 */
const CACHE = 'chaeksa-v409';
const FILES = ['./', './index.html', './privacy.html', './terms.html', './taekil.html', './manifest.json', './og.jpg', './favicon.ico', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // HTML은 캐시를 건너뛰고 항상 최신을 받는다 (오프라인일 때만 캐시)
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
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    fetch(req)
      .then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return r; })
      .catch(() => caches.match(req))
  );
});

/* ── 아침 푸시 ──
 * 서버는 빈 푸시로 깨우기만 하고 문구는 여기서 만든다 (api/push.js 참조).
 * 푸시를 받으면 반드시 알림을 띄워야 한다 — 안 띄우면 브라우저가 구독을 끊는다. */
self.addEventListener('push', (e) => {
  const day = ['일','월','화','수','목','금','토'][new Date().getDay()];
  e.waitUntil(self.registration.showNotification('책사', {
    body: day + '요일의 흐름이 준비됐습니다. 오늘의 시간대를 확인해 보세요.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'chaeksa-daily',                 // 같은 태그면 겹치지 않고 갱신된다
    data: { url: './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow('./');
  }));
});
