/* Offline cache: serves from cache instantly, refreshes files in the background.
   After you upload new files, the update shows on the next app launch. */
const VERSION = 'eutaxia-v19.5', ART = 'deificatio-art-2'; // ART/FONTS keep their old names so renaming the app doesn't re-download the pictures and fonts
// v15: ART renamed because the cottage pictures were repainted under the same file names (the old copies get dropped)
// v13: UI-style fonts live in their own cache, filled once at install and kept across app updates (rename FONTS if a font changes)
const FONTS = 'deificatio-fonts-1', FONT_FILES = ['fonts/caveat-latin-600-normal.woff2', 'fonts/comic-neue-latin-400-normal.woff2', 'fonts/comic-neue-latin-700-normal.woff2', 'fonts/cormorant-garamond-latin-600-italic.woff2', 'fonts/cormorant-garamond-latin-600-normal.woff2', 'fonts/courier-prime-latin-400-normal.woff2', 'fonts/courier-prime-latin-700-normal.woff2', 'fonts/eb-garamond-latin-400-normal.woff2', 'fonts/eb-garamond-latin-600-normal.woff2', 'fonts/fraunces-latin-600-italic.woff2', 'fonts/fraunces-latin-600-normal.woff2', 'fonts/fredoka-latin-500-normal.woff2', 'fonts/fredoka-latin-600-normal.woff2', 'fonts/michroma-latin-400-normal.woff2', 'fonts/nixie-one-latin-400-normal.woff2', 'fonts/orbitron-latin-700-normal.woff2', 'fonts/press-start-2p-latin-400-normal.woff2', 'fonts/rajdhani-latin-600-normal.woff2', 'fonts/share-tech-mono-latin-400-normal.woff2', 'fonts/unifrakturmaguntia-latin-400-normal.woff2', 'fonts/vt323-latin-400-normal.woff2', 'fonts/yuji-boku-latin-400-normal.woff2'];
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'data/catalog.js', 'data/seasons.js', 'scenes.js', 'themes.js', 'ranks.js', 'data/foods.js', 'manifest.webmanifest',
  ...['cyber', 'cottage', 'village', 'academia'].flatMap(t => [`themes/t_${t}_ko.jpg`, `themes/t_${t}_ja.jpg`, ...(t === 'cyber' ? ['zhs', 'zht'] : ['zh']).map(a => `themes/t_${t}_${a}.jpg`)]),
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))
  .then(() => caches.open(FONTS)).then(c => Promise.all(FONT_FILES.map(f => c.match(f).then(hit => hit || c.add(f).catch(() => null)))))
  .then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== ART && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // theme pictures never change: once cached, serve them without re-downloading (they're only fetched for the theme in use)
  if (new URL(req.url).pathname.includes('/fonts/')) { // fonts never change: cache-first
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(FONTS).then(c => c.put(req, copy)); } return res; })));
    return;
  }
  if (new URL(req.url).pathname.includes('/themes/')) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(ART).then(c => c.put(req, copy)); } return res; })));
    return;
  }
  const net = fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); return caches.open(VERSION).then(c => c.put(req, copy)).then(() => res); }
    return res;
  }).catch(() => null);
  e.waitUntil(net);
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || net.then(r => r || caches.match('index.html'))));
});
