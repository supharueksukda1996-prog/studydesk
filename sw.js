/* StudyDesk service worker — offline app shell + installable PWA */
const CACHE = "studydesk-v1";
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
  if (req.method !== "GET") return; // never cache writes (Firestore etc.)
  const url = new URL(req.url);

  // App navigations → network first, fall back to cached shell (offline)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put("./index.html", r.clone())); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Same-origin assets → cache first
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((c) => c || fetch(req).then((r) => {
        const cp = r.clone(); caches.open(CACHE).then((ca) => ca.put(req, cp)); return r;
      }))
    );
    return;
  }

  // Cross-origin: cache fonts + the Firebase SDK (from gstatic); everything else network-only
  if (/gstatic\.com|fonts\.googleapis\.com|cdnjs\.cloudflare\.com|jsdelivr\.net/.test(url.host)) {
    e.respondWith(
      caches.match(req).then((c) => c || fetch(req).then((r) => {
        const cp = r.clone(); caches.open(CACHE).then((ca) => ca.put(req, cp)); return r;
      }).catch(() => c))
    );
    return;
  }
  // Firestore / auth / other APIs — always go to the network
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});
