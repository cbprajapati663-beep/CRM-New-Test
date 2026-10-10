const CACHE_NAME = 'heritage-crm-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  // A real fetch handler is required for Chromium's installability checks.
  // Keep all CRM/Firebase data network-only; never cache customer records.
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(fetch(request));
});
