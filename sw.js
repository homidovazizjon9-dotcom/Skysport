// Bump this version on EVERY deploy — it forces cache invalidation
const CACHE_NAME = 'rashody-v202603151914';

// Listen for SKIP_WAITING message from the page
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Install — pre-cache shell
self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, don't wait
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./', './index.html', './manifest.json'])
        .catch(() => {}) // don't fail install if some asset is missing
    )
  );
});

// Activate — delete ALL other caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // take control of all open tabs
  );
});

// Fetch strategy:
// - Google APIs / fonts → always network
// - HTML pages → network-first (updates apply immediately), fallback to cache
// - Everything else → cache-first (fast), update cache in background
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network for external APIs
  if (url.hostname.includes('google') ||
      url.hostname.includes('fonts') ||
      url.hostname.includes('anthropic')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // Network-first for HTML — always get fresh version
  if (e.request.mode === 'navigate' ||
      e.request.destination === 'document' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for static assets (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || fetchPromise;
    })
  );
});
