const CACHE_NAME = "ashenveil-climb-vNaN";
const APP_BASE = "/Ashenveil/";
const APP_FILES = [APP_BASE, APP_BASE + "index.html", APP_BASE + "manifest.json", APP_BASE + "192.png", APP_BASE + "512.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("ashenveil-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_BASE)) return;
  const page = event.request.mode === "navigate" || url.pathname === APP_BASE || url.pathname === APP_BASE + "index.html";
  event.respondWith(page
    ? fetch(event.request).then(response => { if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone())); return response; }).catch(() => caches.match(event.request).then(hit => hit || caches.match(APP_BASE + "index.html")))
    : caches.match(event.request).then(hit => hit || fetch(event.request).then(response => { if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone())); return response; }))
  );
});

