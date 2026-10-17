/* ==========================================================================
   MAREA - SERVICE WORKER v15
   Offline-first, honest about it:
   - INSTALL precaches the app shell (page, scripts, styles, icons, manifest),
     so Marea opens with no connection from the very first visit.
   - Network-first with a short timeout: on a weak or "fake" connection the app
     opens from its own copy instead of hanging, then refreshes in the background.
   - The face model + MediaPipe runtime (~15 MB) are cache-first and immutable.
     They are stored the first time Face Control runs, or on purpose from
     Settings -> "Face Control offline" (message PREFETCH_FACE).
   - Updates are OFFERED (app shows a banner), never applied mid-use.
   ========================================================================== */

const CACHE_NAME = 'marea-cache-v15';
const STATIC_CACHE = 'marea-static-v1';
const CACHE_FIRST_PATHS = ['/models/', '/mediapipe/'];
const NETWORK_TIMEOUT_MS = 3500;

const SHELL_EXTRA = [
    '/manifest.json', '/favicon.svg', '/icon-192.png', '/icon-512.png',
    '/icon-192-maskable.png', '/icon-512-maskable.png', '/apple-touch-icon.png',
];

const FACE_ASSETS = [
    '/models/face_landmarker.task',
    '/mediapipe/wasm/vision_wasm_internal.js',
    '/mediapipe/wasm/vision_wasm_internal.wasm',
];

// Our responses are static files. A server that adds `Vary: Origin` would make a cached
// script fail to match the page's own CORS-mode request (module scripts, stylesheets with
// `crossorigin`) and the app would 503 offline — so Vary is deliberately ignored.
const MATCH = { ignoreVary: true };

function isCacheable(response) {
    return response && response.ok && response.status === 200;
}

/** Cache the page, its hashed scripts/styles, lazy chunks and static extras. */
async function precacheShell() {
    const cache = await caches.open(CACHE_NAME);
    const page = await fetch('/', { cache: 'reload' });
    if (!isCacheable(page)) throw new Error('shell page unavailable');
    await cache.put('/', page.clone());

    const html = await page.text();
    const assets = new Set();
    for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) assets.add(m[1]);

    // Follow the main script for lazily imported chunks (e.g. the face engine code)
    for (const url of [...assets]) {
        if (!url.endsWith('.js')) continue;
        try {
            const res = await fetch(url);
            if (!isCacheable(res)) continue;
            await cache.put(url, res.clone());
            const js = await res.text();
            for (const m of js.matchAll(/["']\.\/([A-Za-z0-9_-]+\.js)["']/g)) assets.add('/assets/' + m[1]);
        } catch (_) { /* a missing chunk is fetched (and cached) on first use */ }
    }

    await Promise.all([...assets, ...SHELL_EXTRA].map(async (url) => {
        try {
            if (await cache.match(url)) return;
            const res = await fetch(url);
            if (isCacheable(res)) await cache.put(url, res);
        } catch (_) { /* best effort */ }
    }));
}

async function broadcast(message) {
    const all = await self.clients.matchAll({ includeUncontrolled: true });
    all.forEach((c) => c.postMessage(message));
}

async function prefetchFace() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        for (const url of FACE_ASSETS) {
            if (await cache.match(url)) continue;
            const res = await fetch(url);
            if (!isCacheable(res)) throw new Error(url + ' ' + res.status);
            await cache.put(url, res);
        }
        await precacheShell().catch(() => {}); // makes sure the lazy face-engine chunk is stored too
        await broadcast({ type: 'FACE_PREFETCH', state: 'done' });
    } catch (_) {
        await broadcast({ type: 'FACE_PREFETCH', state: 'error' });
    }
}

// Install: store the shell. A failed precache never blocks installing the worker.
self.addEventListener('install', (e) => {
    e.waitUntil(precacheShell().catch(() => {}));
});

// The app sends SKIP_WAITING only after the person pressed "Update now";
// PREFETCH_FACE when they asked to store Face Control for offline use.
self.addEventListener('message', (e) => {
    const type = e.data && e.data.type;
    if (type === 'SKIP_WAITING') self.skipWaiting();
    if (type === 'PREFETCH_FACE') e.waitUntil(prefetchFace());
});

// Activate: drop old app caches (the face cache survives updates) and take control.
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE).map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

async function offlineFallback(request) {
    if (request.mode === 'navigate') {
        const shell = await caches.match('/', MATCH);
        if (shell) return shell;
    }
    return new Response('Sin conexión / Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, MATCH);

    const network = fetch(request).then((res) => {
        if (isCacheable(res)) cache.put(request, res.clone());
        return res;
    });
    network.catch(() => {}); // a late failure after the timeout must not be unhandled

    if (!cached) {
        try { return await network; } catch (_) { return offlineFallback(request); }
    }
    // We already hold a copy: give the network a moment, then use the copy.
    try {
        return await Promise.race([
            network,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS)),
        ]);
    } catch (_) {
        return cached;
    }
}

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return; // never any external request

    // Immutable heavy assets (face model / wasm runtime): cache-first
    if (CACHE_FIRST_PATHS.some((p) => url.pathname.startsWith(p))) {
        e.respondWith((async () => {
            const cached = await caches.match(e.request, MATCH);
            if (cached) return cached;
            const res = await fetch(e.request);
            if (isCacheable(res)) {
                const cache = await caches.open(STATIC_CACHE);
                cache.put(e.request, res.clone());
            }
            return res;
        })());
        return;
    }

    // Navigations with a query string (?utm=…) still open the cached shell
    if (e.request.mode === 'navigate' && url.search) {
        e.respondWith((async () => {
            try {
                return await Promise.race([
                    fetch(e.request),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS)),
                ]);
            } catch (_) {
                return offlineFallback(e.request);
            }
        })());
        return;
    }

    e.respondWith(networkFirst(e.request));
});
