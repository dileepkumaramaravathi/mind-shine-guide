const CACHE_NAME = 'mind-mood-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.jpg'
];

// Installation: Cache initial core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetching: Reliable Network-First for scripts & documents to enable instant updates, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  // We only intercept standard GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Do not intercept hot updates, WebSockets, or backend /api calls
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/@') || 
    url.pathname.includes('hot-update') ||
    url.pathname.includes('vite') ||
    url.pathname.includes('websocket')
  ) {
    return;
  }

  // Network-First for scripts & page navigations to override aggressive local caching on updates
  const isScriptOrNavigate = event.request.destination === 'script' || event.request.mode === 'navigate';

  if (isScriptOrNavigate) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
        })
    );
    return;
  }

  // Cache-First strategy for images, styles, and fonts for high performance
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const isStaticAsset = 
            event.request.destination === 'style' || 
            event.request.destination === 'image' ||
            event.request.destination === 'font';

          if (networkResponse.status === 200 && isStaticAsset) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
    })
  );
});
