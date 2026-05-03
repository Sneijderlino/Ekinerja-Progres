const CACHE_NAME = 'ekin-pwa-cache-v1';
const OFFLINE_FALLBACK = '/index.html';

const CACHE_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/service-worker.js',
  '/assets/css/index.css',
  '/assets/js/index.js',
  '/assets/js/html2pdf.bundle.min.js',
  '/assets/img/logo-apk.png',
  '/inputan.html',
  '/inputan-tabel.html',
  '/rekapan.html',
  '/panduan-penggunaan.html',
  '/install-aplikasi.html',
  '/login.html',
  '/register.html',
  '/auth/index.html',
  '/auth/masuk.html',
  '/auth/daftar.html',
  '/auth/lupa-password.html',
  '/auth/akun.html',
  '/auth/welcome.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return null;
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          }
          return caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_FALLBACK));
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_FALLBACK))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || !networkResponse.ok) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(OFFLINE_FALLBACK));
    }),
  );
});
