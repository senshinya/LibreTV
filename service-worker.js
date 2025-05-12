const CACHE_NAME = 'libre-tv-cache-v1';
const urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/app.js',
  '/js/config.js',
  '/js/ui.js',
  '/js/api.js',
  '/js/password.js',
  '/libs/tailwindcss.min.js',
  '/libs/DPlayer.min.js',
  '/libs/hls.min.js',
  '/libs/sha256.min.js',
  '/https://images.icon-icons.com/38/PNG/512/retrotv_5520.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
