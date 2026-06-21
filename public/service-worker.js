/* ==========================================================================
   MAREA - SERVICE WORKER
   Network-first with cache fallback. Always serves freshest content.
   Cache version bumped to v4 to purge potential stale/corrupted entries.
   Only caches successful (HTTP 200) responses to prevent caching errors.
   ========================================================================== */

const CACHE_NAME = 'marea-cache-v5';

// Install Event — skip waiting so the new SW activates immediately
self.addEventListener('install', () => {
    console.log('[SW v5] Installing…');
    self.skipWaiting();
});

// Activate Event — clean old caches and claim clients
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('[SW v4] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW v4] Activated — claiming clients');
            return self.clients.claim();
        })
    );
});

// Helper: only cache responses we actually want to keep
function isCacheable(response) {
    return response && response.ok && response.status === 200;
}

// Fetch Event — network-first, fallback to cache, update cache on success
self.addEventListener('fetch', (e) => {
    // Only handle GET navigation and same-origin requests
    if (e.request.method !== 'GET') return;

    e.respondWith(
        (async () => {
            try {
                // Try network first
                const networkResponse = await fetch(e.request);

                // Only cache healthy responses — never cache errors or redirects
                if (isCacheable(networkResponse)) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(e.request, networkResponse.clone());
                }

                return networkResponse;
            } catch (_err) {
                // Offline — serve from cache
                const cachedResponse = await caches.match(e.request);
                if (cachedResponse) {
                    console.log('[SW v4] Serving from cache:', e.request.url);
                    return cachedResponse;
                }

                // If navigating and no cache match, try the root
                if (e.request.mode === 'navigate') {
                    const fallback = await caches.match('./index.html');
                    if (fallback) return fallback;
                }

                // Nothing we can do
                return new Response('Sin conexión — volvé a intentar cuando tengas internet.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            }
        })()
    );
});
