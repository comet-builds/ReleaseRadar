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

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  globalThis.skipWaiting();
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      const deletions = [];
      for (const n of names) {
        if (n !== CACHE_NAME) deletions.push(caches.delete(n));
      }
      return Promise.all(deletions);
    })
  );
  globalThis.clients.claim();
});

globalThis.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
