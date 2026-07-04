/* ==========================================================================
   MAREA - SERVICE WORKER v14
   Network-first with cache fallback. Always serves freshest content.
   v14: Face Control + Facial Neurofeedback (KAI perception). The MediaPipe
   wasm runtime and face model are large and immutable → cache-first, so
   after the first use they work offline forever without re-downloading.
   ========================================================================== */

const CACHE_NAME = 'marea-cache-v14';

// Immutable heavy assets (face model + wasm runtime) — cache-first, stored
// in a separate cache that SURVIVES app updates (no 15MB re-download per release)
const STATIC_CACHE = 'marea-static-v1';
const CACHE_FIRST_PATHS = ['/models/', '/mediapipe/'];

// Install — do NOT auto-skipWaiting so the app can show an update popup.
// On first install there is no controller, so the app sends SKIP_WAITING immediately.
self.addEventListener('install', () => {
    console.log('[SW v13] Installing…');
});

// Message handler — app sends { type: 'SKIP_WAITING' } when user approves update
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        console.log('[SW v13] Skip waiting — activating now');
        self.skipWaiting();
    }
});

// Activate — clean old caches and claim all clients
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
                    .map((key) => {
                        console.log('[SW v13] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW v13] Activated — claiming clients');
            return self.clients.claim();
        })
    );
});

function isCacheable(response) {
    return response && response.ok && response.status === 200;
}

// Fetch — network-first, same-origin only. No external requests ever.
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return;

    // Cache-first for immutable heavy assets (face model / wasm runtime)
    if (CACHE_FIRST_PATHS.some((p) => url.pathname.startsWith(p))) {
        e.respondWith(
            (async () => {
                const cached = await caches.match(e.request);
                if (cached) return cached;
                const response = await fetch(e.request);
                if (isCacheable(response)) {
                    const cache = await caches.open(STATIC_CACHE);
                    cache.put(e.request, response.clone());
                }
                return response;
            })()
        );
        return;
    }

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
                    console.log('[SW v13] Serving from cache:', e.request.url);
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
