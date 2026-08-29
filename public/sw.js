const VERSION = 'hdb-v1.0.3';
const SHELL = ['/', '/demo', '/bridge', '/privacy', '/terms', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/assets/topographic-bridge-720.webp', '/assets/topographic-bridge-1280.webp'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    const response = await fetch('/index.html');
    const html = await response.clone().text();
    const builtAssets = [...new Set(html.match(/\/assets\/[^"']+\.(?:js|css)/g) || [])];
    await cache.put('/index.html', response);
    await cache.addAll(builtAssets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy = response.clone(); caches.open(VERSION).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match('/index.html'))));
    return;
  }
  event.respondWith(caches.match(url.pathname).then(cached => cached || fetch(event.request).then(response => { if (response.ok) caches.open(VERSION).then(cache => cache.put(url.pathname, response.clone())); return response; })));
});
