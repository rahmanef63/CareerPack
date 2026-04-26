// CareerPack service worker — minimal, stale-while-revalidate for GET
// requests. Versioned cache name so new releases evict old assets.
//
// IMPORTANT: bump this string on EVERY release. The activate handler
// purges any cache whose name doesn't match, so users on the previous
// bundle automatically pull fresh assets after the SW updates. Keep
// the suffix in lockstep with deploys; "-vN" or a date hash both work.

const CACHE = "careerpack-v22-2026-04-26-pb-export-tabs";
const PRECACHE = [
  "/",
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

  // Never cache Next.js data, API, or auth-sensitive endpoints.
  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    return;
  }

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
