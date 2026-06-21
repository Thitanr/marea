/* ==========================================================================
   MAREA - SERVICE WORKER v7
   Network-first with cache fallback. Always serves freshest content.
   v7: Auto-apply updates immediately — page reloads when new SW activates.
   ========================================================================== */

const CACHE_NAME = 'marea-cache-v7';

// Install — do NOT auto-skipWaiting so the app can show an update popup.
// On first install there is no controller, so the app sends SKIP_WAITING immediately.
self.addEventListener('install', () => {
    console.log('[SW v6] Installing…');
});

// Message handler — app sends { type: 'SKIP_WAITING' } when user approves update
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        console.log('[SW v6] Skip waiting — activating now');
        self.skipWaiting();
    }
});

// Activate — clean old caches and claim all clients
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('[SW v6] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW v6] Activated — claiming clients');
            return self.clients.claim();
        })
    );
});

function isCacheable(response) {
    return response && response.ok && response.status === 200;
}

// Fetch — network-first, cache fallback
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return;

    e.respondWith(
        (async () => {
            try {
                const networkResponse = await fetch(e.request);
                if (isCacheable(networkResponse)) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(e.request, networkResponse.clone());
                }
                return networkResponse;
            } catch (_err) {
                const cachedResponse = await caches.match(e.request);
                if (cachedResponse) {
                    console.log('[SW v6] Serving from cache:', e.request.url);
                    return cachedResponse;
                }
                if (e.request.mode === 'navigate') {
                    const fallback = await caches.match('/');
                    if (fallback) return fallback;
                }
                return new Response('Sin conexión — volvé a intentar cuando tengas internet.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            }
        })()
    );
});
