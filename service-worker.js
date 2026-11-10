const CACHE = 'felifrio-v1.5-offline-2026-11-10';
const CORE = ['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('felifrio-v') && k !== CACHE).map(k=>caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 if(event.request.method !== 'GET')return;
 const url = new URL(event.request.url);
 if(url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith(
  fetch(event.request).then(response => {
   if(response.ok && response.type === 'basic'){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
   }
   return response;
  }).catch(()=>caches.match(event.request).then(cached => cached || (event.request.mode==='navigate' ? caches.match('./index.html') : Response.error())))
 );
});