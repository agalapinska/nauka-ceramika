/* Service worker: aplikacja działa offline po pierwszym otwarciu.
   Strategia stale-while-revalidate: serwujemy z cache od razu,
   w tle dociągamy świeżą wersję — aktualizacja widoczna przy następnym wejściu. */
var CACHE = "ceramika-v1";
var PLIKI = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PLIKI); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return; /* zewnętrzne (formsubmit, linki) — zawsze sieć */
  e.respondWith(
    caches.match(e.request).then(function (zCache) {
      var zSieci = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var kopia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, kopia); });
        }
        return res;
      }).catch(function () { return zCache; });
      return zCache || zSieci;
    })
  );
});
