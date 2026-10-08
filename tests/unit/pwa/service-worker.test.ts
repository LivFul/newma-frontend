import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const sw = readFileSync(path.join(ROOT, "public/sw.js"), "utf8");
// The PRECACHE entries as written in sw.js, however Prettier wraps the array.
const PRECACHE_LIST = [
  .../const PRECACHE = \[([^\]]*)\];/.exec(sw)![1]!.matchAll(/"([^"]+)"/g),
].map((m) => m[1]!);

// The worker is a plain script, so it runs here in a vm against a fake `self`, `caches` and `fetch`.
const ORIGIN = "https://newma.test";

type FakeResponse = {
  ok: boolean;
  tag: string;
  redirected: boolean;
  headers: { get: (name: string) => string | null };
  clone: () => FakeResponse;
};
type ReplyOptions = {
  cacheControl?: string;
  contentType?: string;
  redirected?: boolean;
  date?: string;
};
type FakeRequest = { url: string; method: string; mode: string };
type Network = (request: FakeRequest) => Promise<FakeResponse>;
type WorkerEvent = {
  request?: FakeRequest;
  respondWith: (result: Promise<unknown>) => void;
  waitUntil: (result: Promise<unknown>) => void;
};

const reply = (tag: string, ok = true, options: ReplyOptions = {}): FakeResponse => {
  const headers: Record<string, string> = {
    "cache-control": options.cacheControl ?? "",
    "content-type": options.contentType ?? "application/javascript",
    date: options.date ?? "",
  };
  const value: FakeResponse = {
    ok,
    tag,
    redirected: options.redirected ?? false,
    headers: { get: (name) => headers[name.toLowerCase()] || null },
    clone: () => value,
  };
  return value;
};
// next start and the CDN serve hashed build output with this header; next dev does not.
const IMMUTABLE = "public, max-age=31536000, immutable";
// A production server's answer: build output under /_next/static/ carries the immutable header.
const served = (request: FakeRequest, tag: string): FakeResponse =>
  reply(tag, true, {
    cacheControl: new URL(request.url).pathname.startsWith("/_next/static/") ? IMMUTABLE : "",
  });
const get = (target: string, mode = "no-cors"): FakeRequest => ({
  url: new URL(target, ORIGIN).href,
  method: "GET",
  mode,
});
// The worker fetches the offline shell by plain path and everything else by request.
const pathOf = (input: string | FakeRequest): string =>
  typeof input === "string" ? input : new URL(input.url).pathname;
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function loadWorker(network: Network) {
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const stores = new Map<string, Map<string, FakeResponse>>();
  const keyOf = (input: string | { url: string }) =>
    new URL(typeof input === "string" ? input : input.url, ORIGIN).href;
  const caches = {
    open: (name: string) => {
      const store = stores.get(name) ?? new Map<string, FakeResponse>();
      stores.set(name, store);
      return Promise.resolve({
        addAll: (urls: string[]) => {
          for (const url of urls) store.set(keyOf(url), reply(`precache:${url}`));
          return Promise.resolve();
        },
        put: (request: string | FakeRequest, response: FakeResponse) => {
          store.set(keyOf(request), response);
          return Promise.resolve();
        },
        match: (request: string | FakeRequest) => Promise.resolve(store.get(keyOf(request))),
        keys: () => Promise.resolve([...store.keys()].map((url) => ({ url }))),
        delete: (request: { url: string }) => Promise.resolve(store.delete(keyOf(request))),
      });
    },
    keys: () => Promise.resolve([...stores.keys()]),
    delete: (name: string) => Promise.resolve(stores.delete(name)),
    match: (input: string | FakeRequest) => {
      for (const store of stores.values()) {
        const hit = store.get(keyOf(input));
        if (hit) return Promise.resolve(hit);
      }
      return Promise.resolve(undefined);
    },
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: (event: WorkerEvent) => void) => {
      listeners.set(type, listener);
    },
    skipWaiting: vi.fn(() => Promise.resolve()),
    clients: { claim: vi.fn(() => Promise.resolve()) },
  };
  const fetchSpy = vi.fn(network);
  vm.runInNewContext(sw, { self, caches, fetch: fetchSpy, URL });

  function fire(type: string, request?: FakeRequest) {
    let responded: Promise<unknown> | undefined;
    const waits: Promise<unknown>[] = [];
    const event: WorkerEvent = {
      request,
      respondWith: (result) => {
        responded = Promise.resolve(result);
      },
      waitUntil: (result) => {
        waits.push(Promise.resolve(result));
      },
    };
    listeners.get(type)?.(event);
    return {
      handled: responded !== undefined,
      result: responded ?? Promise.all(waits),
      // Resolves once the response and every waitUntil task it started (cache writes) are done.
      settled: async () => {
        await responded?.catch(() => undefined);
        await flush();
        await Promise.all(waits);
      },
    };
  }
  return { fire, fetch: fetchSpy, self, stores };
}

describe("service worker", () => {
  // Value: protects=live session, API, RSC, image-optimizer, non-GET and cross-origin requests never enter the worker; fails_when=a path leaves the allowlist logic, an encoded variant is treated as public, or the origin or method check is removed; why_new=a source grep passes when a guard is dead code; seam=none
  it("leaves everything outside the public allowlist to the network", () => {
    const worker = loadWorker(() => Promise.resolve(reply("net")));
    const passthrough = [
      get("/api/demo/me"),
      get("/demo/w1-rights", "navigate"),
      get("/access", "navigate"),
      get("/%64emo/w1-rights", "navigate"),
      get("/primitives", "navigate"),
      get("/ecosystem", "navigate"),
      get("/legalese", "navigate"),
      get("/sw.js"),
      get("/ecosystem/wet-lab?_rsc=1abc", "cors"),
      get("/_next/image?url=%2Fimages%2Fa.jpg&w=640&q=75"),
      get("/_next/image?url=%2Fbrand%2F..%2Fdemo%2Fa.png&w=64&q=75"),
      get("/_next/image?url=%2Fbrand%2Fa.png%3Fn%3D1&w=64&q=75"),
      get("/_next/image?url=%2Fbrand%2Fa.png&url=%2Fdemo%2Fb.png&w=64&q=75"),
      get("/_next/image?url=https%3A%2F%2Fevil.test%2Fbrand%2Fa.png&w=64&q=75"),
      get("/_next/image?url=%2F%2Fevil.test%2Fbrand%2Fa.png&w=64&q=75"),
      get("/_next/image?url=http%3A%2F%2F%5B&w=64&q=75"),
      { ...get("/"), method: "POST" },
      get("https://cdn.other.test/lib.js"),
    ];
    for (const request of passthrough) {
      expect(worker.fire("fetch", request).handled, request.url).toBe(false);
    }
    expect(worker.fetch).not.toHaveBeenCalled();
    const handled = [
      get("/", "navigate"),
      get("/legal/privacy", "navigate"),
      get("/ecosystem/wet-lab", "navigate"),
      get("/images/hero-botanical.jpg"),
      get("/brand/icon-192.png"),
      get("/favicon.ico"),
      get("/_next/static/chunks/app.js"),
      get("/_next/image?url=%2Fbrand%2Ficon-192.png&w=256&q=75"),
    ];
    for (const request of handled) {
      expect(worker.fire("fetch", request).handled, request.url).toBe(true);
    }
  });

  // Value: protects=a visited public page reloads offline from cache (whatever its query string) and an unvisited one shows the precached offline page; fails_when=navigations stop falling back to cache or to /offline when the network fails; why_new=no test ran the fetch handler; seam=none
  it("serves a visited page from cache and the offline page for an unvisited one when offline", async () => {
    let online = true;
    const worker = loadWorker((request) =>
      online
        ? Promise.resolve(served(request, `net:${request.url}`))
        : Promise.reject(new Error("offline")),
    );
    await worker.fire("install").result;
    const visited = get("/ecosystem/wet-lab?utm=mail", "navigate");
    const first = worker.fire("fetch", visited);
    await expect(first.result).resolves.toMatchObject({ tag: `net:${visited.url}` });
    await first.settled();
    online = false;
    await expect(
      worker.fire("fetch", get("/ecosystem/wet-lab", "navigate")).result,
    ).resolves.toMatchObject({ tag: `net:${visited.url}` });
    await expect(
      worker.fire("fetch", get("/legal/privacy", "navigate")).result,
    ).resolves.toMatchObject({ tag: "precache:/offline" });
  });

  // Value: protects=an error page, a redirected or no-store response, or an HTML page answering an asset URL is never stored and replayed; fails_when=the ok, redirected, Cache-Control or HTML-type check is dropped; why_new=the failure branches were untested and a fallback page could be pinned under a hashed chunk URL forever; seam=none
  it("does not store failed or no-store navigation responses", async () => {
    let online = true;
    let next = () => reply("boom", false);
    const worker = loadWorker(() =>
      online ? Promise.resolve(next()) : Promise.reject(new Error("offline")),
    );
    await worker.fire("install").result;
    for (const [target, response] of [
      ["/ecosystem/missing", () => reply("boom", false)],
      [
        "/legal/terms",
        () => reply("secret", true, { cacheControl: "private, no-store, max-age=0" }),
      ],
      ["/legal/privacy", () => reply("moved", true, { redirected: true })],
    ] as const) {
      next = response;
      const call = worker.fire("fetch", get(target, "navigate"));
      await call.settled();
    }
    online = false;
    for (const target of ["/ecosystem/missing", "/legal/terms", "/legal/privacy"]) {
      await expect(worker.fire("fetch", get(target, "navigate")).result).resolves.toMatchObject({
        tag: "precache:/offline",
      });
    }

    online = true;
    for (const [target, response] of [
      ["/_next/static/chunks/fallback.js", () => reply("html", true, { contentType: "text/html" })],
      ["/images/private.jpg", () => reply("secret", true, { cacheControl: "no-store" })],
    ] as const) {
      next = response;
      await worker.fire("fetch", get(target)).settled();
    }
    online = false;
    for (const target of ["/_next/static/chunks/fallback.js", "/images/private.jpg"]) {
      await expect(worker.fire("fetch", get(target)).result).resolves.toBeUndefined();
    }
  });

  // Value: protects=stable-URL assets are served from cache first and refreshed behind, hashed build output is never refetched, and a failed response is never stored; fails_when=the ok check is dropped so a 500 is cached, cached assets stop being served, or immutable chunks revalidate; why_new=no test ran the asset path; seam=none
  it("serves cached assets first, never refetches hashed chunks, and never stores a failed response", async () => {
    let current: Network = (request) => Promise.resolve(served(request, `v1:${request.url}`));
    const worker = loadWorker((request) => current(request));
    const asset = get("/images/hero-botanical.jpg");
    const initial = worker.fire("fetch", asset);
    await expect(initial.result).resolves.toMatchObject({ tag: `v1:${asset.url}` });
    await initial.settled();
    current = (request) => Promise.resolve(served(request, `v2:${request.url}`));
    const stale = worker.fire("fetch", asset);
    await expect(stale.result).resolves.toMatchObject({ tag: `v1:${asset.url}` });
    await stale.settled();
    await expect(worker.fire("fetch", asset).result).resolves.toMatchObject({
      tag: `v2:${asset.url}`,
    });

    const chunk = get("/_next/static/chunks/app.js");
    const first = worker.fire("fetch", chunk);
    await first.settled();
    const calls = worker.fetch.mock.calls.length;
    await expect(worker.fire("fetch", chunk).result).resolves.toMatchObject({
      tag: `v2:${chunk.url}`,
    });
    expect(worker.fetch.mock.calls.length).toBe(calls);

    const broken = get("/images/broken.jpg");
    current = () => Promise.resolve(reply("server-error", false));
    await worker.fire("fetch", broken).settled();
    current = () => Promise.reject(new Error("offline"));
    await expect(worker.fire("fetch", broken).result).resolves.toBeUndefined();
  });

  // Generated by /ship pre-landing review
  // Value: protects=build output not marked immutable (next dev's unhashed chunks) is fetched fresh on every load, never stored, and only falls back to a cached copy offline;
  //   fails_when=the worker serves any cached /_next/static/ hit without checking Cache-Control, so a dev session replays stale client code and hydration breaks;
  //   why_new=every chunk test used a production-shaped response, so a cache-first rule for unhashed dev chunks still passed; seam=none
  it("goes to the network for build output that is not immutable", async () => {
    let online = true;
    let version = 1;
    const worker = loadWorker((request) =>
      online
        ? Promise.resolve(
            reply(`dev${version}:${request.url}`, true, {
              cacheControl: "no-cache, must-revalidate",
            }),
          )
        : Promise.reject(new Error("offline")),
    );
    const chunk = get("/_next/static/chunks/src_components_site_site-header.js");
    await worker.fire("fetch", chunk).settled();
    version = 2;
    await expect(worker.fire("fetch", chunk).result).resolves.toMatchObject({
      tag: `dev2:${chunk.url}`,
    });
    const stored = [...worker.stores.values()].flatMap((store) => [...store.keys()]);
    expect(stored).not.toContain(chunk.url);

    // A copy cached by an older worker is no longer replayed online; it only stands in offline.
    const [name] = [...worker.stores.keys()];
    const store = worker.stores.get(name!) ?? new Map<string, FakeResponse>();
    worker.stores.set(name ?? "newma-v3", store);
    store.set(chunk.url, reply(`stale:${chunk.url}`));
    await expect(worker.fire("fetch", chunk).result).resolves.toMatchObject({
      tag: `dev2:${chunk.url}`,
    });
    online = false;
    await expect(worker.fire("fetch", chunk).result).resolves.toMatchObject({
      tag: `stale:${chunk.url}`,
    });
  });

  // Value: protects=runtime entries are capped without ever evicting the precached offline page or the hashed chunks the cached pages need; fails_when=the cache grows without bound, trimming removes the offline shell, or a burst of images evicts a shared chunk; why_new=the cache never evicted anything before and oldest-first eviction removed the shared CSS first; seam=none
  it("caps runtime entries and keeps the precached shell and the hashed chunks", async () => {
    const worker = loadWorker((request) => Promise.resolve(served(request, `net:${request.url}`)));
    await worker.fire("install").result;
    await worker.fire("fetch", get("/_next/static/css/shared.css")).settled();
    for (let index = 0; index < 130; index += 1) {
      await worker.fire("fetch", get(`/images/plate-${index}.jpg`)).settled();
    }
    const [name] = [...worker.stores.keys()];
    const urls = [...worker.stores.get(name!)!.keys()];
    expect(urls).toContain(new URL("/offline", ORIGIN).href);
    expect(urls).toContain(new URL("/_next/static/css/shared.css", ORIGIN).href);
    expect(urls).not.toContain(new URL("/images/plate-0.jpg", ORIGIN).href);
    expect(urls).toContain(new URL("/images/plate-129.jpg", ORIGIN).href);
    expect(urls.length).toBeLessThan(130);
  });

  // Value: protects=the logo, which reaches the browser through the image optimizer, still shows offline, while other optimizer requests stay on the network; fails_when=the optimizer allowance for /brand/ sources is dropped or widened to every image; why_new=the v1 worker cached it by accident and the allowlist silently removed it; seam=none
  it("keeps the optimized wordmark available offline", async () => {
    let online = true;
    const worker = loadWorker((request) =>
      online
        ? Promise.resolve(served(request, `net:${request.url}`))
        : Promise.reject(new Error("offline")),
    );
    const logo = get("/_next/image?url=%2Fbrand%2Ficon-192.png&w=256&q=75");
    await worker.fire("fetch", logo).settled();
    online = false;
    await expect(worker.fire("fetch", logo).result).resolves.toMatchObject({
      tag: `net:${logo.url}`,
    });
  });

  // Value: protects=the offline page is refreshed whenever the home page loads, so it follows the current deploy instead of the one that installed the worker; fails_when=the refresh is dropped or runs for other pages; why_new=the precached copy was never updated between worker changes; seam=none
  it("refreshes the offline page when the home page loads", async () => {
    let online = true;
    const worker = loadWorker((request) =>
      online
        ? Promise.resolve(
            reply(`net:${pathOf(request)}`, true, {
              contentType: pathOf(request) === "/offline" ? "text/html" : undefined,
            }),
          )
        : Promise.reject(new Error("offline")),
    );
    await worker.fire("install").result;
    await worker.fire("fetch", get("/legal/privacy", "navigate")).settled();
    expect(worker.fetch.mock.calls.map(([request]) => pathOf(request))).not.toContain("/offline");

    await worker.fire("fetch", get("/", "navigate")).settled();
    online = false;
    await expect(
      worker.fire("fetch", get("/legal/terms", "navigate")).result,
    ).resolves.toMatchObject({ tag: "net:/offline" });
  });

  // Value: protects=a failed, non-HTML, no-store or rejected refresh never replaces the precached offline page, and a copy refreshed within six hours is not fetched again; fails_when=the HTML or cacheability check or the .catch is dropped, or the throttle is removed; why_new=only the happy refresh was tested, and an interstitial answering 200 could have replaced the only offline fallback; seam=none
  it("keeps the precached offline page when a refresh fails and throttles recent ones", async () => {
    const html = { contentType: "text/html" };
    const attempts: Array<() => Promise<FakeResponse>> = [
      () => Promise.resolve(reply("bad", false, html)),
      () => Promise.resolve(reply("portal", true, { contentType: "application/json" })),
      () => Promise.resolve(reply("secret", true, { ...html, cacheControl: "no-store" })),
      () => Promise.reject(new Error("refresh failed")),
    ];
    for (const attempt of attempts) {
      let online = true;
      const worker = loadWorker((request) =>
        online
          ? pathOf(request) === "/offline"
            ? attempt()
            : Promise.resolve(reply("home", true, html))
          : Promise.reject(new Error("offline")),
      );
      await worker.fire("install").result;
      await worker.fire("fetch", get("/", "navigate")).settled();
      online = false;
      await expect(
        worker.fire("fetch", get("/legal/terms", "navigate")).result,
      ).resolves.toMatchObject({ tag: "precache:/offline" });
    }

    const worker = loadWorker((request) =>
      Promise.resolve(
        pathOf(request) === "/offline"
          ? reply("fresh", true, { ...html, date: new Date().toUTCString() })
          : reply("home", true, html),
      ),
    );
    await worker.fire("install").result;
    await worker.fire("fetch", get("/", "navigate")).settled();
    await worker.fire("fetch", get("/", "navigate")).settled();
    const offlineFetches = worker.fetch.mock.calls.filter(([r]) => pathOf(r) === "/offline");
    expect(offlineFetches).toHaveLength(1);
  });

  // Value: protects=a cached offline page is refreshed again once it is older than six hours or dated in the future (a client clock behind the server), instead of being trusted forever; fails_when=the age check accepts a negative age or ignores the six-hour limit; why_new=only a fresh and a missing Date header were covered, and a client clock running behind would have kept a stale offline page indefinitely; seam=none
  it.each([
    ["older than six hours", () => new Date(Date.now() - 7 * 3600_000).toUTCString()],
    ["dated in the future", () => new Date(Date.now() + 3 * 3600_000).toUTCString()],
  ])("refreshes the offline page again when its copy is %s", async (_name, stamp) => {
    const html = { contentType: "text/html" };
    const worker = loadWorker((request) =>
      Promise.resolve(
        pathOf(request) === "/offline"
          ? reply("copy", true, { ...html, date: stamp() })
          : reply("home", true, html),
      ),
    );
    await worker.fire("install").result;
    await worker.fire("fetch", get("/", "navigate")).settled();
    await worker.fire("fetch", get("/", "navigate")).settled();
    const offlineFetches = worker.fetch.mock.calls.filter(([r]) => pathOf(r) === "/offline");
    expect(offlineFetches).toHaveLength(2);
  });

  // Value: protects=hashed build chunks are capped at their own larger budget, oldest first, without touching the precached shell; fails_when=the static budget is removed or raised without bound; why_new=the static budget was only shown to survive an image burst, never to be enforced; seam=none
  it("caps hashed chunks at their own budget", async () => {
    const worker = loadWorker((request) => Promise.resolve(served(request, `net:${request.url}`)));
    await worker.fire("install").result;
    for (let index = 0; index < 405; index += 1) {
      await worker.fire("fetch", get(`/_next/static/chunks/c-${index}.js`)).settled();
    }
    const [name] = [...worker.stores.keys()];
    const urls = [...worker.stores.get(name!)!.keys()];
    const chunks = urls.filter((url) => url.includes("/_next/static/"));
    expect(chunks.length).toBeLessThanOrEqual(400);
    expect(urls).not.toContain(new URL("/_next/static/chunks/c-0.js", ORIGIN).href);
    expect(urls).toContain(new URL("/_next/static/chunks/c-404.js", ORIGIN).href);
    expect(urls).toContain(new URL("/offline", ORIGIN).href);
  });

  // Value: protects=install precaches the offline page and activates at once, and activate drops older caches; fails_when=the offline page leaves the precache or old cache versions are kept after an update; why_new=no test ran install or activate; seam=none
  it("precaches the offline page and takes over at install, then drops older caches at activate", async () => {
    const worker = loadWorker(() => Promise.resolve(reply("net")));
    await worker.fire("install").result;
    expect(worker.self.skipWaiting).toHaveBeenCalled();
    const [current] = [...worker.stores.keys()];
    expect(worker.stores.get(current!)?.has(new URL("/offline", ORIGIN).href)).toBe(true);

    worker.stores.set("newma-v1", new Map());
    await worker.fire("activate").result;
    expect([...worker.stores.keys()]).toEqual([current]);
    expect(worker.self.clients.claim).toHaveBeenCalled();
  });

  // Value: protects=the offline page shows the logo to a visitor who went offline before any page loaded it; fails_when=the default wordmark lockup is renamed or dropped from the precache; why_new=only the optimizer path was cached, and only after an online visit; seam=none
  it("precaches the wordmark the offline page renders", () => {
    const wordmark = readFileSync(path.join(ROOT, "src/components/site/wordmark.tsx"), "utf8");
    // The offline page renders <Wordmark /> with its defaults: the `wordmark` lockup, light tone.
    const lockup = /wordmark: \{\s*light: "([^"]+)"/.exec(wordmark)![1]!;
    expect(PRECACHE_LIST).toContain(lockup);
  });

  // Value: protects=an upgrade that only adds precache entries keeps the build chunks visitors already cached, so the offline page keeps its CSS and JS;
  //   fails_when=CACHE is bumped for an addition, and activate deletes the cache that holds the chunks the precached /offline HTML needs;
  //   why_new=the newma-v3 bump in this branch was reproduced to leave the offline page unstyled right after the worker upgraded; seam=none
  it("keeps the cached build chunks across an upgrade that adds precache entries", async () => {
    const worker = loadWorker(() => Promise.resolve(reply("net")));
    const chunk = new URL("/_next/static/chunks/app.js", ORIGIN).href;
    // newma-v2 is the cache name main ships; this branch only adds entries to its precache list.
    worker.stores.set("newma-v2", new Map([[chunk, reply("chunk")]]));
    await worker.fire("install").result;
    await worker.fire("activate").result;
    const kept = [...worker.stores.values()].some((store) => store.has(chunk));
    expect(kept).toBe(true);
  });

  // Value: protects=every precache entry resolves to a real file or route, because cache.addAll rejects on one miss and the worker then never installs; fails_when=a precached icon is renamed or the offline route is removed; why_new=the vm fake always resolves addAll; seam=none
  it("precaches only files and routes that exist", () => {
    expect(PRECACHE_LIST).toContain("/offline");
    for (const entry of PRECACHE_LIST) {
      const exists =
        entry === "/offline"
          ? existsSync(path.join(ROOT, "src/app/(site)/offline/page.tsx"))
          : existsSync(path.join(ROOT, "public", entry));
      expect(exists, entry).toBe(true);
    }
  });
});
