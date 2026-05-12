/**
 * gidek service worker — minimal, network-first.
 *
 * - GET istekleri: network'ten dene, başarısızsa cache, son çare /offline.
 * - Sadece same-origin sayfa ve statik asset'ler cache'lenir; API/RSC stream
 *   istekleri (POST, /api/*, RSC fetch'leri) bypass edilir.
 * - install/activate'te eski cache'ler temizlenir.
 */
const CACHE_NAME = 'gidek-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(OFFLINE_URL);
      self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Sadece kendi origin'imiz. API + RSC stream + chrome-extension bypass.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/data')) return;

  // Navigation isteklerinde network → fail → offline page.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          return res;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const offline = await cache.match(OFFLINE_URL);
          return offline ?? new Response('', { status: 504, statusText: 'offline' });
        }
      })(),
    );
    return;
  }

  // Diğer GET'ler: network-first, başarısızsa cache.
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        // Statik asset'leri pasif cache'le.
        if (res.ok && (url.pathname.startsWith('/_next/static') || url.pathname.endsWith('.svg'))) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        return new Response('', { status: 504, statusText: 'offline' });
      }
    })(),
  );
});
