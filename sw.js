const CACHE_PREFIX='icar-claw-v3-';
const CACHE='icar-claw-v3-20261019-kimi7';
const ASSETS=["./", "./index.html", "./manifest.webmanifest", "./assets/icon.svg", "./assets/home-motion.css?v=14.8", "./assets/home-motion.js?v=14.8", "./assets/v3.css", "./assets/v3-polish.css?v=3.2", "./assets/brand/pavilion-v31.png", "./assets/v3.js", "./assets/scenes-v3.js", "./assets/brand/v25-cutout.png", "./assets/brand/pavilion-min.png", "./assets/brand/卡基狗.png"];
const APP_URLS=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!APP_URLS.has(event.request.url))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}
    return response;
  }).catch(async()=>{
    const cache=await caches.open(CACHE),hit=await cache.match(event.request);
    return hit||(event.request.mode==='navigate'?await cache.match('./index.html'):null)||Response.error();
  }));
});
