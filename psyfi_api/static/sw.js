// PsyFi Service Worker - progressive enhancement of the existing PWA shell.
// Strategies follow MOBILE_PWA_GUIDE.md + docs/PWA_GPU_ROUTE.md.
// Decision: /gpu/ is a separate route (not embedded); not shell-precached.

const CACHE_NAME = 'psyfi-shell-v12';
const SHELL_URLS = [
  '/',
  '/static/style.css',
  '/static/app.js',
  '/static/renderer.js',
  '/static/render_worker.js',
  '/static/viz/math.js',
  '/static/viz/safetyPass.js',
  '/static/viz/engines/index.js',
  '/static/viz/parameterFieldWebGL.js',
  '/static/viz/experiencePlayer.js',
  '/static/manifest.json',
  '/static/icon-192.png',
  '/static/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell', CACHE_NAME);
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

function isGpuRoute(url) {
  return url.pathname === '/gpu' || url.pathname.startsWith('/gpu/');
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

  // GPU Lab (/gpu/): network-first; never use the legacy shell HTML as a
  // successful stand-in for GPU documents when online. Offline → shell `/`.
  if (isGpuRoute(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache hashed GPU assets opportunistically; skip opaque failures.
          if (response.ok && !isNavigationRequest(request)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (isNavigationRequest(request)) {
            return caches.match('/');
          }
          return caches.match(request).then((cached) => cached || Response.error());
        })
    );
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
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets under /static: cache-first.
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
  }
});
