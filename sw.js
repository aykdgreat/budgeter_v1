
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('my-pwa-cache').then(cache => {
      return cache.addAll([
        '/index.html',
        '/css/budget.css',
        '/js/script.js',
        '/js/tailwind.js',
        '/js/vue.global.js',
        '/icon512.png',
        
        'https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
