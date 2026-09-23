/* 三条河原町店 受付アプリ  Service Worker
   ・ページ本体はネットワーク優先（更新がすぐ反映）／オフライン時のみキャッシュ
   ・アイコン等はキャッシュ優先（表示を速く）
   index.html を更新したら VERSION を上げてください。 */
var VERSION = 'sanjokawaramachi-v15';
var CORE = ['./', './index.html', './manifest.webmanifest',
            './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){
    return Promise.all(CORE.map(function(u){
      return c.add(new Request(u, {cache:'reload'})).catch(function(){});
    }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k !== VERSION) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('message', function(e){
  if(e.data === 'SKIP_WAITING'){ self.skipWaiting(); }
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var accept = req.headers.get('accept') || '';
  var isDocument = req.mode === 'navigate' || accept.indexOf('text/html') >= 0;

  if(isDocument){
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(VERSION).then(function(c){ c.put('./index.html', copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === 'basic'){
          var copy = res.clone();
          caches.open(VERSION).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
