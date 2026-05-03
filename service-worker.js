// Cache versioning dengan timestamp untuk automatic cache busting
const CACHE_VERSION = '2.1.0';
const BUILD_TIMESTAMP = Date.now();
const CACHE_NAME = `ekin-pwa-${CACHE_VERSION}-${BUILD_TIMESTAMP}`;
const OFFLINE_FALLBACK = '/index.html';

// Runtime cache untuk CDN dan external resources
const RUNTIME_CACHE = `ekin-runtime-${CACHE_VERSION}`;

// Critical assets yang harus di-cache saat install
const CRITICAL_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/assets/css/index.css',
  '/assets/js/index.js',
  '/assets/img/logo-apk.png'
];

// Assets tambahan untuk caching
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
  '/admin.html',
  '/auth/index.html',
  '/auth/masuk.html',
  '/auth/daftar.html',
  '/auth/lupa-password.html',
  '/auth/akun.html',
  '/auth/welcome.html',
  '/auth/css/index.css',
  '/auth/js/index.js'
];

// URLs yang tidak boleh di-cache
const NO_CACHE_URLS = [
  '/api/',
  '/admin',
  'localhost',
  '127.0.0.1'
];

// Install event - cache critical assets only
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS).catch(err => {
          console.warn('[SW] Failed to cache some critical assets:', err);
          // Continue even if some assets fail
          return Promise.resolve();
        });
      }),
      // Cleanup old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('ekin-pwa-') && name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
    ])
  );
  
  // Force new version to activate immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          }),
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isNavigationRequest = event.request.mode === 'navigate';
  const isExternalRequest = requestUrl.origin !== self.location.origin;

  // Skip external requests (unless from approved CDNs)
  if (isExternalRequest) {
    // Allow Google CDN, jsDelivr, etc
    if (requestUrl.hostname.includes('googleapis.com') || 
        requestUrl.hostname.includes('cdnjs.cloudflare.com') ||
        requestUrl.hostname.includes('jsdelivr.net')) {
      event.respondWith(cacheOrNetworkStrategy(event.request));
    }
    return;
  }

  // Skip URLs yang tidak boleh di-cache
  if (NO_CACHE_URLS.some(url => requestUrl.pathname.includes(url))) {
    event.respondWith(fetch(event.request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // Navigation requests - Network First (dengan cache fallback)
  if (isNavigationRequest) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // HTML files - Network First
  if (requestUrl.pathname.endsWith('.html')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Assets (CSS, JS, IMG) - Cache First
  if (requestUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)$/i)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // JSON, API - Network First
  if (requestUrl.pathname.endsWith('.json')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Default - Stale While Revalidate
  event.respondWith(staleWhileRevalidateStrategy(event.request));
});

/**
 * Network First Strategy - Try network, fallback to cache
 * Ideal untuk: Navigation, HTML, JSON, API calls
 */
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        return response;
      }
      return getCachedResponse(request);
    })
    .catch(() => getCachedResponse(request));
}

/**
 * Cache First Strategy - Use cache, fallback to network
 * Ideal untuk: Static assets (CSS, JS, IMG)
 */
function cacheFirstStrategy(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      // Revalidate in background
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone()));
          }
        })
        .catch(() => {}); // Ignore errors
      return cachedResponse;
    }
    return fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        }
        return response;
      })
      .catch(() => getCachedResponse(request));
  });
}

/**
 * Stale While Revalidate - Use cache immediately, update in background
 * Ideal untuk: Everything else
 */
function staleWhileRevalidateStrategy(request) {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    return cachedResponse || fetchPromise;
  });
}

/**
 * Get cached response or return offline fallback
 */
function getCachedResponse(request) {
  return caches.match(request)
    .then((response) => response || caches.match(OFFLINE_FALLBACK))
    .catch(() => caches.match(OFFLINE_FALLBACK));
}

/**
 * Cache or Network Strategy (untuk CDN eksternal)
 */
function cacheOrNetworkStrategy(request) {
  return caches.match(request).then((response) => {
    return response || fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      });
  });
}

// Message handler untuk cache control dari client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      Promise.all(names.map(name => caches.delete(name)));
    });
  }
});
