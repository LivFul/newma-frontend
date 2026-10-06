// Bump CACHE whenever the precache list or an asset served at a stable URL changes: activate drops
// every other cache name, so clients pick up the new bytes on the next load.
const CACHE = "newma-v2";
const PRECACHE = ["/offline", "/brand/icon-192.png", "/brand/icon-512.png", "/brand/favicon.svg"];
const MAX_ENTRIES = 120;

// Allowlist: only public marketing pages and static assets are ever cached. Everything else (the
// session-bound /demo and /access, /api, RSC and data fetches, /_next/image, this worker) is left to
// the network, whatever its path looks like.
const PAGE_PATHS = new Set(["/", "/offline"]);
const PAGE_PREFIXES = ["/ecosystem/", "/legal/"];
const IMMUTABLE_PREFIX = "/_next/static/";
const ASSET_PREFIXES = ["/brand/", "/images/"];
const ASSET_PATHS = new Set(["/favicon.ico"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isPage(path) {
  return PAGE_PATHS.has(path) || PAGE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isAsset(path) {
  return (
    path.startsWith(IMMUTABLE_PREFIX) ||
    ASSET_PATHS.has(path) ||
    ASSET_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

// A response is stored only when it succeeded and did not ask to stay out of shared caches.
function isCacheable(response) {
  if (!response.ok || response.type === "opaque") return false;
  const control = response.headers && response.headers.get && response.headers.get("Cache-Control");
  return !control || !/no-store|private/i.test(control);
}

// Oldest runtime entries go first; the precached shell (the offline page and icons) is never trimmed.
const PRECACHED = new Set(PRECACHE.map((path) => self.location.origin + path));

async function trim(cache) {
  const keys = (await cache.keys()).filter((key) => !PRECACHED.has(key.url));
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) {
    await cache.delete(key);
  }
}

async function store(key, response) {
  const cache = await caches.open(CACHE);
  await cache.put(key, response);
  await trim(cache);
}

// Pages are keyed by path, so query strings never multiply entries.
function networkFirstPage(event, url) {
  const key = url.origin + url.pathname;
  return fetch(event.request)
    .then((response) => {
      if (isCacheable(response)) event.waitUntil(store(key, response.clone()));
      return response;
    })
    .catch(async () => (await caches.match(key)) || (await caches.match("/offline")));
}

function cachedAsset(event, path) {
  const request = event.request;
  return caches.match(request).then((cached) => {
    // Hashed build output never changes at its URL, so a hit needs no revalidation.
    if (cached && path.startsWith(IMMUTABLE_PREFIX)) return cached;
    const fetched = fetch(request)
      .then((response) => {
        if (isCacheable(response)) event.waitUntil(store(request, response.clone()));
        return response;
      })
      .catch(() => cached);
    if (cached) event.waitUntil(fetched.then(() => undefined));
    return cached || fetched;
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (isPage(url.pathname)) event.respondWith(networkFirstPage(event, url));
    return;
  }
  if (isAsset(url.pathname)) event.respondWith(cachedAsset(event, url.pathname));
});
