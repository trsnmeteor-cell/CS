/* 三条河原町店 受付アプリ  Service Worker
   オフラインでも起動できるようにアプリ本体をキャッシュします。
   index.html を更新したら VERSION を上げてください。 */
var VERSION = 'sanjokawaramachi-v4';
var ASSETS = ['./', './index.html', './manifest.webmanifest',
              './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){
    return Promise.all(ASSETS.map(function(u){
      return c.add(new Request(u, {cache:'reload'})).catch(function(){});
    }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k !== VERSION) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === 'basic'){
          var copy = res.clone();
          caches.open(VERSION).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){
        if(req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
