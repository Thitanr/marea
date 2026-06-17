/* ==========================================================================
   MAREA - SERVICE WORKER
   Enables offline load of the application assets.
   ========================================================================== */

const CACHE_NAME = 'marea-cache-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './i18n.js',
    './sound.js',
    './manifest.json'
];

// Install Event - cache core assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching files...');
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event - clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Fetch Event - network fallback to cache offline
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Try fetching from network, if fails, throw error (or serve offline page)
            return fetch(e.request).catch(() => {
                // If offline and request is for page, return cached index
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
