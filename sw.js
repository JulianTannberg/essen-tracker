const CACHE="essen-tracker-pages-v84";
const VERSION="84";
const INDEX_KEY=`./index.html?v=${VERSION}`;
const ASSETS=[
  "./manifest.webmanifest",
  "./icon.svg",
  "./top-branch.png",
  "./kueche.html",
  "./kitchen-block-library-v84.js?v=84",
  "./assets/mineralwasser-neutral.webp",
  "./assets/lidl-vegan-symbolbilder.webp",
  "./assets/kitchen-food-sprite.webp",
  "./assets/kitchen-food-sprite-2.webp",
  "./assets/kitchen-food-sprite-3.webp",
  "./assets/kitchen-food-sprite-4.webp",
  "./assets/kitchen-food-sprite-5.webp",
  "./assets/kitchen-food-sprite-6.webp",
  `./sleep-mode.js?v=${VERSION}`,
  `./v63-weight-start.js?v=${VERSION}`,
  `./herb-knowledge-v64.js?v=${VERSION}`,
  `./daily-thoughts-v65.js?v=${VERSION}`
];

async function withRuntimePatches(response){
  if(!response)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;

  let html=await response.text();
  const tags=[];

  if(!html.includes("sleep-mode.js")){
    tags.push(`<script src="./sleep-mode.js?v=${VERSION}"></script>`);
  }
  if(!html.includes("v63-weight-start.js")){
    tags.push(`<script src="./v63-weight-start.js?v=${VERSION}"></script>`);
  }

  if(tags.length){
    const injected=tags.join("\n");
    html=html.includes("</body>")?html.replace("</body>",`${injected}\n</body>`):html+injected;
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
      const injected=await withRuntimePatches(raw);
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
    const kitchen=url.pathname.endsWith("/kueche.html");
    const pageKey=kitchen?"./kueche.html":INDEX_KEY;
    event.respondWith((async()=>{
      try{
        const raw=await fetch(event.request,{cache:"no-store"});
        const response=kitchen?raw:await withRuntimePatches(raw);
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(pageKey,copy)).catch(()=>{});
        return response;
      }catch(_){
        return (await caches.match(pageKey))||(await caches.match(kitchen?"./kueche.html":"./index.html"));
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
