const CACHE_NAME = 'ReleaseRadar-v2';

const ASSETS = [
  './index.html',
  './manifest.json',
  './assets/js/github.js',
  './assets/js/main.js',
  './assets/js/store.js',
  './assets/js/ui.js',
  './assets/js/utils.js',
  './assets/css/styles.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
