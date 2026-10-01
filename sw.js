const CACHE="essen-tracker-pages-v56";
const ASSETS=["./index.html?v=56","./manifest.webmanifest?v=56","./icon.svg?v=56","./top-branch.png?v=56"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;

  if(event.request.mode==="navigate"){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put("./index.html?v=56",copy)).catch(()=>{});
          return response;
        })
        .catch(()=>caches.match("./index.html?v=56").then(r=>r||caches.match("./index.html")))
    );
    return;
  }

  if(sameOrigin){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
          return response;
        })
        .catch(()=>caches.match(event.request))
    );
  }
});
