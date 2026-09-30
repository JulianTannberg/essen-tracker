const CACHE="essen-tracker-pages-v52";
const ASSETS=["./index.html?v=52","./manifest.webmanifest?v=52","./icon.svg?v=52","./top-branch.png?v=52"];

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
          caches.open(CACHE).then(cache=>cache.put("./index.html?v=52",copy)).catch(()=>{});
          return response;
        })
        .catch(()=>caches.match("./index.html?v=52").then(r=>r||caches.match("./index.html")))
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
