/*
 * N8 — minimal, deliberately conservative service worker.
 *
 * Strategy (safety first — a stale SW must never trap updates):
 *   • NETWORK-FIRST for every same-origin GET, with the cache only as the
 *     offline fallback — when online the user always gets fresh bytes, so
 *     neither the app shell nor the API can go stale while a tab is open.
 *   • Runtime cache ONLY same-origin successful GETs: navigations (the app
 *     shell), hashed /_next/static assets (immutable by name) and the icons.
 *     API responses are never cached.
 *   • Versioned cache name + delete-old-caches on activate + skipWaiting +
 *     clients.claim → a new deployment takes over cleanly on the next load.
 *   • Cross-origin requests and non-GET never touch the SW (Firebase, the
 *     gateway's other ports, uploads... all pass through untouched).
 */

const CACHE = "savedbox-sw-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Dev/live tooling must never be intercepted.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  const cacheable =
    request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/");

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        if (cacheable && fresh && fresh.status === 200 && fresh.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match("/");
          if (shell) return shell;
        }
        throw error;
      }
    })(),
  );
});
