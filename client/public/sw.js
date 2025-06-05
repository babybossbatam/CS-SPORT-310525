
const CACHE_NAME = 'css-sport-v2';
const STATIC_CACHE = 'static-v2';
const API_CACHE = 'api-v2';

// Minimal cache for critical resources only
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/fallback-logo.png'
];

// Critical API endpoints to cache
const API_PATTERNS = [
  /\/api\/fixtures\/live/,
  /\/api\/leagues\/popular/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        // Only cache critical assets
        return cache.addAll(STATIC_ASSETS.slice(0, 2)); // Reduce initial cache
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !cacheName.includes('v2'))
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests
  if (request.method !== 'GET') return;

  // Cache API responses with shorter TTL
  if (url.pathname.startsWith('/api/')) {
    const shouldCache = API_PATTERNS.some(pattern => pattern.test(url.pathname));
    
    if (shouldCache) {
      event.respondWith(
        caches.open(API_CACHE).then(cache => {
          return cache.match(request).then(response => {
            if (response) {
              const age = Date.now() - new Date(response.headers.get('date') || 0).getTime();
              // Shorter cache for API (2 minutes)
              if (age < 2 * 60 * 1000) {
                return response;
              }
            }
            
            return fetch(request).then(fetchResponse => {
              if (fetchResponse.ok) {
                cache.put(request, fetchResponse.clone());
              }
              return fetchResponse;
            }).catch(() => response || new Response('Offline', { status: 503 }));
          });
        })
      );
    }
    return;
  }

  // Cache static assets
  event.respondWith(
    caches.match(request).then(response => {
      if (response) return response;
      
      return fetch(request).then(fetchResponse => {
        if (fetchResponse.ok && url.origin === self.location.origin) {
          const responseClone = fetchResponse.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return fetchResponse;
      });
    })
  );
});
