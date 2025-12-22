const CACHE_NAME = "bakery-app-v5"; // <--- CHANGE THIS MANUALLY WHEN UPDATING !!!!

const ASSETS = [
  "./",
  "./index.html",
  "./ingredients.json",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/utils.js",
  "./js/ingredients.js",
  "./js/recipes.js",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/fuse.js@6.6.2",
  "https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js",
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

self.addEventListener("fetch", (e) => {
  // If requesting ingredients.json, use Network First strategy
  if (e.request.url.includes("ingredients.json")) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Clone response to put in cache
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(e.request)) // Fallback to cache if offline
    );
  } else {
    // Standard Cache First for everything else (CSS, JS, HTML)
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch(e.request);
      })
    );
  }
});