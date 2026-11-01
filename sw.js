/* Offline cache: serves from cache instantly, refreshes files in the background.
   After you upload new files, the update shows on the next app launch. */
const VERSION = 'deificatio-v8';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'data/catalog.js', 'data/seasons.js', 'scenes.js', 'data/foods.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const net = fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); return caches.open(VERSION).then(c => c.put(req, copy)).then(() => res); }
    return res;
  }).catch(() => null);
  e.waitUntil(net);
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || net.then(r => r || caches.match('index.html'))));
});
