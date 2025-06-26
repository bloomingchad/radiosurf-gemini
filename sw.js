// A version for the cache. Update this when you update your app files.
const CACHE_VERSION = 1;
const CACHE_NAME = `radiosurf-cache-v${CACHE_VERSION}`;

// A list of all the files that make up the "app shell".
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/dist/js/main.js',
  '/dist/js/state.js',
  '/dist/js/api/discovery.js',
  '/dist/js/api/reporting.js',
  '/dist/js/api/requests.js',
  '/dist/js/player/core.js',
  '/dist/js/player/pool.js',
  '/dist/js/player/sleep-timer.js',
  '/dist/js/ui/display.js',
  '/dist/js/ui/search.js',
  '/dist/js/ui/theme.js'
  // Note: We don't cache the .map files as they are for development only.
];

// The install event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  // Pre-cache the app shell.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// The activate event is fired after install.
// It's a good place to clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// The fetch event is fired for every network request.
// We use a "cache, falling back to network" strategy.
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // If the resource is in the cache, return it.
        return cachedResponse;
      }
      
      // If the resource is not in the cache, fetch it from the network.
      return fetch(event.request).then((networkResponse) => {
          // Don't cache API requests or other dynamic content.
          // For this app, it's simpler to just cache the app shell and let everything else pass through.
          // If you wanted to cache API responses, you'd add logic here.
          return networkResponse;
      });
    })
  );
});
