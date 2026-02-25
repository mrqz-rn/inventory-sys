// service-worker.js — Nexus Warehouse Pro
// Strategy: Cache-First for static assets, Network-First for navigation/API

const CACHE_NAME = 'nexus-v1';
const RUNTIME_CACHE = 'nexus-runtime-v1';

// Files to pre-cache on install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
];

// External CDN origins to cache at runtime
const CDN_ORIGINS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://esm.sh',
];

// ─── Install: cache the app shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: serve from cache or network ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http schemes
  if (!request.url.startsWith('http')) return;

  // Navigation requests: Network-first, fall back to cached index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => cached || fetch(request))
        )
    );
    return;
  }

  // CDN assets (Tailwind, fonts, ESM modules): Cache-first, update in background
  const isCDN = CDN_ORIGINS.some((origin) => request.url.startsWith(origin));
  if (isCDN) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          // Update cache in background (stale-while-revalidate)
          fetch(request)
            .then((fresh) => cache.put(request, fresh))
            .catch(() => {});
          return cached;
        }
        try {
          const fresh = await fetch(request);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return new Response('Offline — resource unavailable', { status: 503 });
        }
      })
    );
    return;
  }

  // Same-origin static assets: Cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Everything else: Network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ─── Background Sync (if supported) ───────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'TRIGGER_SYNC' })
        );
      })
    );
  }
});