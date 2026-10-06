// Bump CACHE whenever the precache list changes: activate drops every other cache name, so clients
// rebuild their cache from the new list.
const CACHE = "newma-v2";
const PRECACHE = ["/offline", "/brand/icon-192.png", "/brand/icon-512.png", "/brand/favicon.svg"];
// Pages, images and the rest share one budget; hashed build chunks get a larger one of their own so a
// burst of images can never evict the CSS and JS that the cached pages depend on.
const MAX_ENTRIES = 120;
const MAX_STATIC_ENTRIES = 400;

// Allowlist: only public marketing pages and static assets are ever cached. Everything else (the
// session-bound /demo and /access, /api, RSC and data fetches, other /_next/image requests, this
// worker) is left to the network, whatever its path looks like.
const PAGE_PATHS = new Set(["/", "/offline"]);
const PAGE_PREFIXES = ["/ecosystem/", "/legal/"];
const STATIC_PREFIX = "/_next/static/";
// Matched with startsWith: three directories plus the favicon, whose exact path has no longer variant.
const ASSET_PATH_STARTS = [STATIC_PREFIX, "/brand/", "/images/", "/favicon.ico"];
// The wordmark goes through next/image, so the browser asks the optimizer for it.
const IMAGE_ENDPOINT = "/_next/image";
const IMAGE_SOURCE_PREFIX = "/brand/";

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

// Only a plain /brand/ file: the source is resolved first, so /brand/../demo/x.png collapses to /demo/x.png
// and is refused, and a source carrying its own query (one cache key per value) or a repeated `url`
// parameter is refused too.
function isBrandImage(url) {
  const sources = url.searchParams.getAll("url");
  if (sources.length !== 1) return false;
  const source = new URL(sources[0], url.origin);
  return (
    source.origin === url.origin &&
    source.search === "" &&
    source.pathname.startsWith(IMAGE_SOURCE_PREFIX)
  );
}

function isAsset(url) {
  if (url.pathname === IMAGE_ENDPOINT) return isBrandImage(url);
  return ASSET_PATH_STARTS.some((prefix) => url.pathname.startsWith(prefix));
}

// A response is stored only when it succeeded, was not redirected, and did not ask to stay out of
// shared caches.
function isCacheable(response) {
  if (!response.ok || response.type === "opaque" || response.redirected) return false;
  const control = response.headers.get("Cache-Control");
  return !control || !/no-store|private/i.test(control);
}

// Assets are never HTML: an interstitial or fallback page answering an asset URL must not be pinned.
function isCacheableAsset(response) {
  return isCacheable(response) && !/text\/html/i.test(response.headers.get("Content-Type") || "");
}

// Oldest runtime entries go first; the precached shell (the offline page and icons) is never trimmed.
const PRECACHED = new Set(PRECACHE.map((path) => self.location.origin + path));

async function evictOldest(cache, keys, limit) {
  for (const key of keys.slice(0, Math.max(0, keys.length - limit))) {
    await cache.delete(key);
  }
}

async function trim(cache) {
  const keys = (await cache.keys()).filter((key) => !PRECACHED.has(key.url));
  const isStatic = (key) => new URL(key.url).pathname.startsWith(STATIC_PREFIX);
  await evictOldest(
    cache,
    keys.filter((key) => !isStatic(key)),
    MAX_ENTRIES,
  );
  await evictOldest(cache, keys.filter(isStatic), MAX_STATIC_ENTRIES);
}

// Replacing an existing entry adds no key, so only a new key can push the cache over budget.
async function store(key, response) {
  const cache = await caches.open(CACHE);
  const existed = await cache.match(key);
  await cache.put(key, response);
  if (!existed) await trim(cache);
}

// The precached offline page references the chunk hashes of the deploy that installed this worker, and
// the worker's bytes do not change between ordinary deploys. Refreshing it when the home page loads
// keeps it in step with the current deploy, at most every OFFLINE_REFRESH_MS, and only with an HTML
// answer (a captive portal or proxy interstitial must not replace it). On any failure the previous copy
// simply stays.
const OFFLINE_REFRESH_MS = 6 * 60 * 60 * 1000;

async function refreshOffline() {
  const current = await caches.match("/offline");
  const stored = current ? Date.parse(current.headers.get("Date") || "") : Number.NaN;
  if (Date.now() - stored < OFFLINE_REFRESH_MS) return;
  const response = await fetch("/offline");
  const isHtml = /text\/html/i.test(response.headers.get("Content-Type") || "");
  if (isCacheable(response) && isHtml) await store("/offline", response);
}

// Pages are keyed by path, so query strings never multiply entries.
function networkFirstPage(event, url) {
  const key = url.origin + url.pathname;
  return fetch(event.request)
    .then((response) => {
      if (isCacheable(response)) {
        event.waitUntil(store(key, response.clone()));
        if (url.pathname === "/") event.waitUntil(refreshOffline().catch(() => undefined));
      }
      return response;
    })
    .catch(async () => (await caches.match(key)) || (await caches.match("/offline")));
}

function cachedAsset(event, url) {
  const request = event.request;
  return caches.match(request).then((cached) => {
    // Hashed build output never changes at its URL, so a hit needs no revalidation.
    if (cached && url.pathname.startsWith(STATIC_PREFIX)) return cached;
    const fetched = fetch(request)
      .then((response) => {
        if (isCacheableAsset(response)) event.waitUntil(store(request, response.clone()));
        return response;
      })
      .catch(() => cached);
    if (cached) event.waitUntil(fetched);
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
  if (isAsset(url)) event.respondWith(cachedAsset(event, url));
});
