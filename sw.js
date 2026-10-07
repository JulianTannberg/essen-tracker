const CACHE="essen-tracker-pages-v57";
const VERSION="57";
const INDEX_KEY=`./index.html?v=${VERSION}`;
const ASSETS=[`./manifest.webmanifest?v=${VERSION}`,`./icon.svg?v=${VERSION}`,`./top-branch.png?v=${VERSION}`,`./sleep-mode.js?v=${VERSION}`];

async function withSleepMode(response){
  if(!response)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  let html=await response.text();
  if(!html.includes("sleep-mode.js")){
    const tag=`<script src="./sleep-mode.js?v=${VERSION}"></script>`;
    html=html.includes("</body>")?html.replace("</body>",`${tag}\n</body>`):html+tag;
  }
  const headers=new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(ASSETS).catch(()=>{});
    try{
      const raw=await fetch(INDEX_KEY,{cache:"no-store"});
      const injected=await withSleepMode(raw);
      if(injected)await cache.put(INDEX_KEY,injected);
    }catch(_){ }
  })());
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
    event.respondWith((async()=>{
      try{
        const raw=await fetch(event.request,{cache:"no-store"});
        const injected=await withSleepMode(raw);
        const copy=injected.clone();
        caches.open(CACHE).then(cache=>cache.put(INDEX_KEY,copy)).catch(()=>{});
        return injected;
      }catch(_){
        return (await caches.match(INDEX_KEY))||(await caches.match("./index.html"));
      }
    })());
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
