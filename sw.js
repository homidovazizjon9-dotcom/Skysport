// Bump VERSION on every release — it must match the ?v= in index.html
const VERSION = '20260920';
const CACHE_NAME = 'rashody-v' + VERSION;

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        './', './index.html',
        `./styles.css?v=${VERSION}`, `./app.js?v=${VERSION}`, `./firebase-init.js?v=${VERSION}`,
        './manifest.json', './icon-192.png', './icon-512.png'
      ]).catch(() => {})
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function putInCache(request, response) {
  // Clone synchronously: the original body is consumed by the page right away
  const copy = response.clone();
  caches.open(CACHE_NAME).then(c => c.put(request, copy));
}

self.addEventListener('fetch', e => {
  // Skip non-GET requests — POST/PUT cannot be cached
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Always network for external APIs
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('groq') ||
      url.hostname.includes('anthropic') ||
      url.hostname.includes('fonts')) {
    return; // let browser handle normally
  }

  // Network-first for HTML
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) putInCache(e.request, res);
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Stale-while-revalidate for static assets (incl. Firebase SDK from gstatic)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request)
        .then(res => {
          if (res.ok) putInCache(e.request, res);
          return res;
        })
        .catch(err => {
          if (cached) return cached;
          throw err;
        });
      return cached || net;
    })
  );
});
