const CACHE_NAME = 'heritage-crm-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  // Do not intercept or cache requests. Firebase and all CRM data remain network-only.
  if (event.request.method !== 'GET') return;
});
