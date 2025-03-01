// 简单的Service Worker示例
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('food-scanner-v1').then((cache) => {
      return cache.addAll([
        '/food-scanner/',
        '/food-scanner/index.html',
        '/food-scanner/manifest.json',
        '/food-scanner/icon-192x192.png',
        '/food-scanner/icon-512x512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
