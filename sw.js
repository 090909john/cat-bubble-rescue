// 離線快取：所有資源 cache-first
const VERSION = 'cbr-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './css/style.css',
  './js/core.js', './js/store.js', './js/audio.js', './js/art.js', './js/game.js', './js/garden.js', './js/ui.js', './js/main.js',
  './data/levels.json', './data/content.json', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
