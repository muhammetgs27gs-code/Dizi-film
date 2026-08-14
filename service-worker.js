// ===== Bobin Service Worker =====
// Basit "app shell" önbellekleme: ana sayfa ve ikonlar çevrimdışı da açılabilsin diye
// önbelleğe alınır. TMDB/Haberler/Firebase gibi ağ istekleri her zaman canlı denenir;
// sadece başarısız olursa (çevrimdışıyken) mümkün olduğunca önbellekten karşılanır.

const CACHE_NAME = 'bobin-cache-v1';
const APP_SHELL = [
  './bobin.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAppShell = url.origin === self.location.origin;

  if (isAppShell) {
    // Uygulama kabuğu: önce ağ, olmazsa önbellek (her zaman en güncel sürüm gösterilsin diye)
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
  // Dış istekler (TMDB, Firebase, haberler vb.) service worker'a takılmadan doğrudan ağa gider.
});
