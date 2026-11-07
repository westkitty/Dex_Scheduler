// Offline static shell only. No schedule, bill, or authentication responses enter this cache.
const CACHE = 'dex-shell-v2';
const ASSETS = ['./', './index.html', './styles.css', './config.js', './app.js', './facts.js', './icon.svg', './icon-192.png', './icon-512.png', './manifest.webmanifest'];
const ALLOWED = new Set(ASSETS.map(path => new URL(path, self.registration.scope).pathname));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dex-shell-') && key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !ALLOWED.has(url.pathname)) return;
  // Network-first assets allow new deployments to replace old JS/CSS, with offline fallback.
  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(event.request, response.clone());
    }
    return response;
  }).catch(async () => {
    const fallback = await caches.match(event.request);
    return fallback || (event.request.mode === 'navigate' ? await caches.match('./index.html') : Response.error());
  }));
});
// Web Push requires a separate private server, consent and device-level integration.
