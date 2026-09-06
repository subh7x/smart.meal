const CACHE="smartmeal-pro-v1";
const ASSETS=["./","./index.html","./style.css","./script.js","./smartmeal-logo.png","./smartmeal-icon-192.png","./smartmeal-icon-512.png","./favicon-64.png","./manifest.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    const copy=r.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy));
    return r;
  }).catch(()=>cached)));
});
