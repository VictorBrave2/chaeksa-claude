/* 책사 서비스 워커
 * HTML(내비게이션)은 항상 새로 받는다 — 여기에 정적 파일의 ?v=N 이 적혀 있으므로
 * HTML이 캐시되면 사용자가 계속 옛 버전을 쓰게 된다.
 * 나머지 자원은 URL에 버전이 붙어 있어 네트워크 우선 + 캐시 폴백으로 충분하다.
 */
const CACHE = 'chaeksa-v71';
const FILES = ['./', './index.html', './privacy.html', './terms.html', './manifest.json', './og.png', './icon-192.png', './icon-512.png'];

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
        .then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put('./index.html', c)); return r; })
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
