/**
 * UniPlanner — Progressive Web App Service Worker
 * Provides offline application shell, safe caching, and deployment update handling.
 */

const CACHE_NAME = 'uniplanner-shell-v2';

// Essential application shell precache resources
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

// Service Worker Installation: Precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Prepare worker for fast activation when safe
        return self.skipWaiting();
      })
      .catch((error) => {
        // Log installation error without failing completely
        console.warn('[UniPlanner SW] Precache installation warning:', error);
      })
  );
});

// Service Worker Activation: Clean up old caches and claim existing clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Listen for message from client to activate updated worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: Intelligent offline caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Ignore non-http / non-https schemes (e.g. chrome-extension, data URIs)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navigation Requests (HTML Pages): Network-First with cached fallback
  // Ensures fresh app shell when online and seamless loading when offline.
  // Avoids serving stale code indefinitely while guaranteeing offline usability.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Never cache error pages or invalid responses
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed (offline): serve cached index.html or root
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/index.html').then((fallback) => {
              return fallback || caches.match('/');
            });
          });
        })
    );
    return;
  }

  // 2. Built Static Assets (/assets/*): Cache-First
  // Vite assets are immutable and content-hashed (e.g. index-CBpru1O5.js)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch((fetchErr) => {
            // Cannot fetch and not in cache
            return cachedResponse || Promise.reject(fetchErr);
          });
      })
    );
    return;
  }

  // 3. Icons and Manifest: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline - no network update needed
            return null;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. External resources (e.g. Google Fonts): Stale-While-Revalidate with error resilience
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.type === 'opaque')
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Remote fonts unavailable offline; system font fallback takes over
            return new Response('', { status: 408, statusText: 'Offline Font Unavailable' });
          });
      })
    );
    return;
  }

  // 5. Default: Network with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
