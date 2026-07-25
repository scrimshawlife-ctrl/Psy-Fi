// PsyFi Service Worker - progressive enhancement of the existing PWA shell.
// Strategies follow MOBILE_PWA_GUIDE.md using the current static asset layout.

const CACHE_NAME = 'psyfi-shell-v2';
const SHELL_URLS = [
  '/',
  '/static/style.css',
  '/static/app.js',
  '/static/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(SHELL_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removing old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

function isApiOrSimulateRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/simulate') ||
    url.pathname === '/health' ||
    url.pathname === '/docs' ||
    url.pathname.startsWith('/openapi')
  );
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Simulation/API traffic is network-only.
  if (isApiOrSimulateRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML navigation: network-first with shell fallback.
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('/') )
    );
    return;
  }

  // Versioned/static assets under /static: cache-first.
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }
});
