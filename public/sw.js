const CACHE = 'dex-shell-v1';
const FILES = ['./', './index.html', './styles.css', './config.js', './app.js', './facts.js', './icon.svg', './icon-192.png', './icon-512.png', './manifest.webmanifest'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (new URL(event.request.url).pathname.endsWith('/config.js')) {
    event.respondWith(fetch(event.request).then(async response => { const cache = await caches.open(CACHE); await cache.put(event.request, response.clone()); return response; }).catch(() => caches.match(event.request)));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(match => match || fetch(event.request)));
});
// Push subscription and delivery remain unimplemented until the private backend is configured and device-tested.
