/* StudyDesk service worker — offline app shell + installable PWA */
const CACHE = "studydesk-v2";
const CORE = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "./firebase-config.js", "./sync.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" }))).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put("./index.html", r.clone())); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((r) => {
        const cp = r.clone(); caches.open(CACHE).then((ca) => ca.put(req, cp)); return r;
      }).catch(() => caches.match(req))
    );
    return;
  }

  if (/gstatic\.com|fonts\.googleapis\.com|cdnjs\.cloudflare\.com|jsdelivr\.net/.test(url.host)) {
    e.respondWith(
      caches.match(req).then((c) => c || fetch(req).then((r) => {
        const cp = r.clone(); caches.open(CACHE).then((ca) => ca.put(req, cp)); return r;
      }).catch(() => c))
    );
    return;
  }
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});
