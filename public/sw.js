// Service Worker — cache persistente de imagens e assets.
// Objetivo: ao fechar e reabrir a aba/app, capas, ícones e arquivos estáticos
// já estão em disco e renderizam instantaneamente, sem refazer fetch.

const VERSION = "v3";
const IMG_CACHE = `img-cache-${VERSION}`;
const ASSET_CACHE = `asset-cache-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

// Hosts de capas/ícones que valem a pena guardar agressivamente.
const IMAGE_HOSTS = [
  "s4.anilist.co",
  "cdn.myanimelist.net",
  "books.google.com",
  "books.googleusercontent.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "drive.google.com",
];

const MAX_IMG_ENTRIES = 600;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![IMG_CACHE, ASSET_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const toDelete = keys.length - maxEntries;
  for (let i = 0; i < toDelete; i++) await cache.delete(keys[i]);
}

function isImage(request, url) {
  if (request.destination === "image") return true;
  if (IMAGE_HOSTS.includes(url.hostname)) return true;
  if (/\.(png|jpe?g|webp|gif|svg|avif|ico)$/i.test(url.pathname)) return true;
  return false;
}

function isStaticAsset(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (["style", "script", "font"].includes(request.destination)) return true;
  if (/\.(css|js|woff2?|ttf|otf)$/i.test(url.pathname)) return true;
  return false;
}

// Cache-first com revalidação em background.
async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Revalida em background (best-effort) — não bloqueia a resposta.
    fetch(request)
      .then((res) => {
        if (res && res.ok) {
          cache.put(request, res.clone());
          if (maxEntries) trimCache(cacheName, maxEntries);
        }
      })
      .catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === "opaque")) {
      cache.put(request, res.clone());
      if (maxEntries) trimCache(cacheName, maxEntries);
    }
    return res;
  } catch (err) {
    // offline e sem cache — devolve resposta vazia pra não quebrar a UI
    return new Response("", { status: 504, statusText: "offline" });
  }
}

// Stale-while-revalidate para assets da app.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Não interceptamos chamadas a APIs (Supabase functions, GraphQL, REST)
  if (
    url.pathname.startsWith("/functions/") ||
    url.hostname.endsWith("supabase.co") ||
    url.hostname === "graphql.anilist.co" ||
    url.hostname === "api.jikan.moe" ||
    url.hostname === "www.googleapis.com"
  ) {
    return;
  }

  if (isImage(request, url)) {
    event.respondWith(cacheFirst(request, IMG_CACHE, MAX_IMG_ENTRIES));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }
});
