// FINLAB PH service worker: makes the site installable and shows a friendly page when offline.
// It never caches app code or data, so a new deploy is always picked up straight away.
const OFFLINE = 'offline.html';
const CACHE = 'finlab-offline-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(new URL(OFFLINE, self.registration.scope))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return; // everything else goes straight to the network
  event.respondWith(fetch(event.request).catch(() => caches.match(new URL(OFFLINE, self.registration.scope))));
});
