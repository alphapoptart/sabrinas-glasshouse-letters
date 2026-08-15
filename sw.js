const CACHE='glasshouse-letters-expanded-estate-20260815a';
const ASSETS=['./','index.html','core.css','v2.css','estate.css','sequel-v5.css','estate-areas.css','manifest.json','icon.svg','icon-192.png','js/storage.js','js/data.js','js/audio.js','js/plantart.js','js/game.js','js/save-migrations.js','js/minigames.js','js/visit.js','js/ui.js','js/sequel-features.js','js/sunstone-seasons.js','js/estate.js','js/sequel-v5.js','js/estate-areas.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request))) });
