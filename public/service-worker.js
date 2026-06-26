/* ==========================================================================
   MAREA - SERVICE WORKER v11
   Network-first with cache fallback. Always serves freshest content.
   v11: Cache WebGazer CDN so eye-gaze works offline after first use.
   ========================================================================== */

const CACHE_NAME = 'marea-cache-v11';

// Versioned CDN assets — cache-first (URL encodes the version, so safe to cache forever)
const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/webgazer@2.1.0/dist/webgazer.min.js',
];

// Install — do NOT auto-skipWaiting so the app can show an update popup.
// On first install there is no controller, so the app sends SKIP_WAITING immediately.
self.addEventListener('install', () => {
    console.log('[SW v11] Installing…');
});

// Message handler — app sends { type: 'SKIP_WAITING' } when user approves update
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        console.log('[SW v11] Skip waiting — activating now');
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
                        console.log('[SW v11] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW v11] Activated — claiming clients');
            return self.clients.claim();
        })
    );
});

function isCacheable(response) {
    return response && response.ok && response.status === 200;
}

// Fetch — network-first for same-origin; cache-first for versioned CDN assets
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isCDNAsset = CDN_ASSETS.includes(e.request.url);

    if (!isSameOrigin && !isCDNAsset) return;

    // Cache-first for versioned CDN assets (URL itself encodes version)
    if (isCDNAsset) {
        e.respondWith(
            (async () => {
                const cached = await caches.match(e.request);
                if (cached) return cached;
                try {
                    const response = await fetch(e.request);
                    if (isCacheable(response)) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(e.request, response.clone());
                    }
                    return response;
                } catch (_err) {
                    return new Response('Sin conexión', { status: 503 });
                }
            })()
        );
        return;
    }

    // Network-first for same-origin assets
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
                    console.log('[SW v11] Serving from cache:', e.request.url);
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
