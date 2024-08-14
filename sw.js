const VERSION = "v1";
const CACHE_NAME = `my-budgeter-${VERSION}`;

const APP_STATIC_RESOURCES = [
  "/",
  '/index.html',
  '/css',
  '/css/budget.css',
  '/css/line/line-awesome.css',
  '/css/fonts/la-solid-900.ttf',
  '/js/script.js',
  '/js/tailwind.js',
  '/js/vue.global.prod.js',
  '/icon512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
     (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll(APP_STATIC_RESOURCES);
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        }),
      );
      await clients.claim();
    })(),
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
