// CareerPack service worker — stale-while-revalidate for static GETs,
// network-first for navigations with `/offline` fallback. Versioned
// cache name evicts old assets on each release.
//
// IMPORTANT: bump this string on EVERY release. The activate handler
// purges any cache whose name doesn't match. Keep the suffix in lockstep
// with deploys; "-vN" or a date hash both work.

const CACHE = "careerpack-v23-2026-04-30-pwa-offline";
const PRECACHE = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/logo.svg",
  "/brand/logo-mark.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => null))
  );
  // We DO NOT call self.skipWaiting() unconditionally any more —
  // the SWUpdatePrompt component prompts the user to reload, then
  // posts a SKIP_WAITING message which we handle below. That way
  // open tabs aren't surprised by a mid-session asset swap.
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GETs; let everything else fall through to network.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  const url = new URL(request.url);

  // Never cache Next.js data, API, or auth-sensitive endpoints. They
  // must always hit the network so realtime queries / auth tokens stay
  // fresh.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    return;
  }

  // Navigation requests: network-first, falling back to a cached
  // response, then the precached `/offline` page if neither works. This
  // keeps the app installable + usable when offline without serving a
  // stale dashboard to online users.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigations so the same URL works offline next time.
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/offline"))
        ),
    );
    return;
  }

  // Static assets: stale-while-revalidate. Serve from cache instantly,
  // refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
