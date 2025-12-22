const CACHE_NAME = "bakery-app-v3"; // <--- CHANGE THIS MANUALLY WHEN UPDATING !!!!

const ASSETS = [
  "./",
  "./index.html",
  "./ingredients.json",
  "./manifest.json",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/fuse.js@6.6.2",
  "https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js"
];

// 1. INSTALL: Cache all files
self.addEventListener("install", (e) => {
  // Forces the waiting service worker to become the active service worker
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. ACTIVATE: Delete old caches (Cleanup)
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Tell the active service worker to take control of the page immediately
  return self.clients.claim(); 
});

// 3. FETCH: Serve from cache if available, otherwise network
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});