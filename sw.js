/* 富士長野雪國之旅：離線快取 */
var VER="v3-2026-11-24";
var CORE=["./","index.html","apple-touch-icon.png","favicon-32.png","icon-512.png","qr/tickets.json"];
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(VER).then(function(c){
    return c.addAll(CORE.map(function(u){return new Request(u,{cache:"reload"});})).then(function(){
      return fetch("qr/tickets.json",{cache:"no-store"}).then(function(r){return r.json();}).then(function(t){
        var imgs=[];(t||[]).forEach(function(k){(k.users||[]).forEach(function(u){if(u.qrimg)imgs.push(u.qrimg);});});
        return c.addAll(imgs.map(function(u){return new Request(u,{cache:"reload"});}));
      }).catch(function(){});
    });
  }));
});
self.addEventListener("message",function(e){if(e.data==="skip")self.skipWaiting();});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==VER;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
function netFirst(req,key){
  return caches.open(VER).then(function(c){
    var timeout=new Promise(function(res){setTimeout(function(){res(null);},4000);});
    var net=fetch(req.mode==="navigate"?new Request(req.url,{cache:"no-cache",credentials:"same-origin"}):req,{cache:"no-cache"}).then(function(r){if(r&&r.ok)c.put(key||req,r.clone());return r;});
    return Promise.race([net.catch(function(){return null;}),timeout]).then(function(r){
      if(r)return r;
      return c.match(key||req,{ignoreSearch:true}).then(function(m){return m||net;});
    });
  });
}
function cacheFirst(req){
  return caches.open(VER).then(function(c){return c.match(req).then(function(m){
    var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==="opaque"))c.put(req,r.clone());return r;});
    return m||net;
  });});
}
self.addEventListener("fetch",function(e){
  var req=e.request;if(req.method!=="GET")return;
  var u=new URL(req.url);
  if(u.origin===location.origin){
    if(req.mode==="navigate"){e.respondWith(netFirst(req,"index.html"));return;}
    if(/\/qr\/tickets\.json$/.test(u.pathname)){e.respondWith(netFirst(new Request(u.origin+u.pathname),u.origin+u.pathname));return;}
    e.respondWith(cacheFirst(req));return;
  }
  if(u.host==="fonts.googleapis.com"||u.host==="fonts.gstatic.com"||u.host==="cdnjs.cloudflare.com"){e.respondWith(cacheFirst(req));return;}
});
