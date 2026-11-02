const CACHE_NAME = "glitched-v5";
const APP_BASE = "/Glitched/";

const APP_FILES = [
  APP_BASE,
  APP_BASE + "index.html",
  APP_BASE + "tower-backdrop.js",
  APP_BASE + "manifest.json",
  APP_BASE + "192.png",
  APP_BASE + "512.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("glitched-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(APP_BASE)) return;

  const isPage = event.request.mode === "navigate" ||
    url.pathname === APP_BASE + "index.html" || url.pathname === APP_BASE;

  event.respondWith(
    (isPage
      ? fetch(event.request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        }).catch(() => caches.match(event.request))
      : caches.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            }
            return response;
          });
        })
    )
  );
});
