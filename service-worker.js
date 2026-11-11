// Felifrío 1.8 · Caché de archivos de la app; nunca almacena respuestas de Supabase.
const CACHE='felifrio-v1.8-cards-20261110';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',ev=>ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',ev=>ev.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('felifrio-v')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',ev=>{
 if(ev.request.method!=='GET')return;
 const url=new URL(ev.request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 ev.respondWith(fetch(ev.request).then(res=>{
  if(res.ok&&res.type==='basic'){const copy=res.clone();ev.waitUntil(caches.open(CACHE).then(c=>c.put(ev.request,copy)))}
  return res;
 }).catch(()=>caches.match(ev.request).then(res=>res||(ev.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
