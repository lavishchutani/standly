const CACHE_NAME = 'standly-shell-v11';
const SHELL_FILES = ['./', './index.html', './manifest.json', './css/core.css', './css/widgets.css', './js/core.js', './js/storage.js', './js/world-data.js', './js/widgets/clock.js', './js/vendor/jsmediatags.min.js', './js/widgets/music.js', './js/widgets/notes.js', './icons/icon-180.png', './icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
  // Activate on the next app launch, keeping open pages on one coherent version.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('standly-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).catch(error => {
    if (event.request.mode === 'navigate') return caches.match('./index.html');
    throw error;
  })));
});
