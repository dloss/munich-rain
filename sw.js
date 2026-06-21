/* Service Worker — Regenradar München
   Macht die App offline-fähig und robust bei schlechtem Empfang:
   - App-Hülle (HTML/JS/CSS/Fonts/Icons): cache-first (lädt sofort)
   - Kacheln (.png, fremde Hosts): stale-while-revalidate, mit Größenlimit
   - API-Daten (RainViewer, Open-Meteo): network-first mit Cache-Fallback */

const VERSION = "v5";
const SHELL = "shell-" + VERSION;
const TILES = "tiles-" + VERSION;
const DATA  = "data-"  + VERSION;
const TILE_MAX = 400;            // max. zwischengespeicherte Kacheln

const PRECACHE = [
  "./", "./index.html", "./manifest.webmanifest",
  "./vendor/leaflet/leaflet.min.css", "./vendor/leaflet/leaflet.min.js",
  "./vendor/fonts/fonts.css",
  "./vendor/fonts/inter-400.woff2", "./vendor/fonts/inter-500.woff2", "./vendor/fonts/inter-600.woff2",
  "./vendor/fonts/space-grotesk-500.woff2", "./vendor/fonts/space-grotesk-600.woff2", "./vendor/fonts/space-grotesk-700.woff2",
  "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  // kein skipWaiting: neue Version wartet, bis der Nutzer im Update-Hinweis bestätigt
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => ![SHELL, TILES, DATA].includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// erlaubt der Seite, ein Update sofort zu aktivieren
self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
});

async function trim(cacheName, max){
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

// Kacheln: zwischengespeicherte Version sofort liefern, im Hintergrund erneuern
async function tileStrategy(req){
  const c = await caches.open(TILES);
  const cached = await c.match(req);
  const net = fetch(req).then((res) => {
    if (res && (res.ok || res.type === "opaque")){
      c.put(req, res.clone());
      trim(TILES, TILE_MAX);
    }
    return res;
  }).catch(() => cached);
  return cached || net;
}

// API-Daten: erst Netz, bei Fehler letzter bekannter Stand aus dem Cache
async function dataStrategy(req){
  const c = await caches.open(DATA);
  try{
    const res = await fetch(req);
    if (res && res.ok) c.put(req, res.clone());
    return res;
  }catch(e){
    const cached = await c.match(req);
    if (cached) return cached;
    throw e;
  }
}

// App-Hülle: aus dem Cache, sonst Netz; Navigation fällt auf index.html zurück
async function shellStrategy(req, isNav){
  const c = await caches.open(SHELL);
  const cached = await c.match(req, { ignoreSearch: isNav });
  if (cached) return cached;
  try{
    const res = await fetch(req);
    if (res && res.ok) c.put(req, res.clone());
    return res;
  }catch(e){
    if (isNav){
      const fallback = await c.match("./index.html");
      if (fallback) return fallback;
    }
    throw e;
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  const isNav = req.mode === "navigate";
  const crossOrigin = u.origin !== self.location.origin;

  if (crossOrigin && u.pathname.endsWith(".png")){
    e.respondWith(tileStrategy(req));
  } else if (u.hostname === "api.rainviewer.com" || u.hostname === "api.open-meteo.com"){
    e.respondWith(dataStrategy(req));
  } else if (!crossOrigin || isNav){
    e.respondWith(shellStrategy(req, isNav));
  }
  // alles andere: Browser-Standardverhalten
});
