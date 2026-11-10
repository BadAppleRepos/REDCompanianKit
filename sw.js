/* Service worker: caches the app so it works offline once installed. Bump VERSION when files change. */
const VERSION = 'redkit-v14';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './js/data.js', './js/store.js', './js/ui.js', './js/roller.js', './js/homebrew.js', './js/character.js', './js/ripperdoc.js', './js/combat.js',
  './js/map.js', './js/dice.js', './js/app.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first (so updates show up), falling back to the cache when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    // 'no-cache' revalidates with the server so updated files are never served stale from the HTTP cache.
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
