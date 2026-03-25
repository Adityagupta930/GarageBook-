const CACHE = 'gb-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip: API calls, non-GET, cross-origin, Next.js internals
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/')) {
    // Cache Next.js static chunks (JS/CSS) — these are content-hashed
    if (url.pathname.includes('/static/')) {
      e.respondWith(
        caches.open(CACHE).then(cache =>
          cache.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
              cache.put(e.request, res.clone());
              return res;
            });
          })
        )
      );
    }
    return;
  }

  // For pages: network first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
