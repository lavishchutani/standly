// Service worker: makes the app open instantly (even offline) and
// is the hook iOS uses to deliver Web Push notifications to this PWA.

const CACHE_NAME = "standly-shell-v6";

// Everything needed to render the app with no network connection.
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/core.css",
  "./css/widgets.css",
  "./js/core.js",
  "./js/storage.js",
  "./js/widgets/clock.js",
  "./js/widgets/music.js",
  "./js/widgets/notes.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clean up old cache versions when you ship a new sw.js
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Cache-first for the app shell; falls back to network for anything else.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// --- Push notifications (wire up once you add a push backend) ---
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Dash", body: "" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "icons/icon-180.png"
    })
  );
});
