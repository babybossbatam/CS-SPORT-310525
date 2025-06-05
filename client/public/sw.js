
const CACHE_NAME = 'cs-sport-v1';
const urlsToCache = [
  '/',
  '/assets/fallback-logo.png',
  '/assets/fallback-logo.svg',
  '/fonts/Inter-Regular.woff2',
  '/CSSPORT_1_updated.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests for dynamic content
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
