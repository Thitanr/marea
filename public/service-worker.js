/* ==========================================================================
   MAREA - SERVICE WORKER
   Network-first with cache fallback. Always serves freshest content.
   ========================================================================== */

const CACHE_NAME = 'marea-cache-v3';

// Install Event — skip waiting so the new SW activates immediately
self.addEventListener('install', () => {
    self.skipWaiting();
});

// Activate Event — clean old caches and claim clients
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event — network-first, fallback to cache, update cache on success
self.addEventListener('fetch', (e) => {
    // Only handle GET navigation and same-origin requests
    if (e.request.method !== 'GET') return;

    e.respondWith(
        (async () => {
            try {
                // Try network first
                const networkResponse = await fetch(e.request);

                // Cache the fresh response for next time (clone because body can only be consumed once)
                const cache = await caches.open(CACHE_NAME);
                cache.put(e.request, networkResponse.clone());

                return networkResponse;
            } catch (_err) {
                // Offline — serve from cache
                const cachedResponse = await caches.match(e.request);
                if (cachedResponse) return cachedResponse;

                // If navigating and no cache match, try the root
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }

                // Nothing we can do
                return new Response('Offline', { status: 503 });
            }
        })()
    );
});
