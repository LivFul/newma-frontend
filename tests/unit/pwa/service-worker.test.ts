import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const sw = readFileSync(path.join(ROOT, "public/sw.js"), "utf8");

// The worker is a plain script, so it runs here in a vm against a fake `self`, `caches` and `fetch`.
const ORIGIN = "https://newma.test";

type FakeResponse = {
  ok: boolean;
  tag: string;
  headers: { get: (name: string) => string | null };
  clone: () => FakeResponse;
};
type FakeRequest = { url: string; method: string; mode: string };
type Network = (request: FakeRequest) => Promise<FakeResponse>;
type WorkerEvent = {
  request?: FakeRequest;
  respondWith: (result: Promise<unknown>) => void;
  waitUntil: (result: Promise<unknown>) => void;
};

const reply = (tag: string, ok = true, cacheControl: string | null = null): FakeResponse => {
  const value: FakeResponse = {
    ok,
    tag,
    headers: { get: (name) => (name.toLowerCase() === "cache-control" ? cacheControl : null) },
    clone: () => value,
  };
  return value;
};
const get = (target: string, mode = "no-cors"): FakeRequest => ({
  url: new URL(target, ORIGIN).href,
  method: "GET",
  mode,
});
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
      get("/sw.js"),
      get("/ecosystem/wet-lab?_rsc=1abc", "cors"),
      get("/_next/image?url=%2Fimages%2Fa.jpg&w=640&q=75"),
      { ...get("/"), method: "POST" },
      get("https://cdn.other.test/lib.js"),
    ];
    for (const request of passthrough) {
      expect(worker.fire("fetch", request).handled, request.url).toBe(false);
    }
    expect(worker.fetch).not.toHaveBeenCalled();
    expect(worker.fire("fetch", get("/ecosystem/wet-lab", "navigate")).handled).toBe(true);
    expect(worker.fire("fetch", get("/images/hero-botanical.jpg")).handled).toBe(true);
  });

  // Value: protects=a visited public page reloads offline from cache (whatever its query string) and an unvisited one shows the precached offline page; fails_when=navigations stop falling back to cache or to /offline when the network fails; why_new=no test ran the fetch handler; seam=none
  it("serves a visited page from cache and the offline page for an unvisited one when offline", async () => {
    let online = true;
    const worker = loadWorker((request) =>
      online ? Promise.resolve(reply(`net:${request.url}`)) : Promise.reject(new Error("offline")),
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

  // Value: protects=an error page or a response that asked for no shared caching is never replayed offline in place of the offline page; fails_when=the ok or Cache-Control check is dropped from the navigation path; why_new=the failure branch was untested; seam=none
  it("does not store failed or no-store navigation responses", async () => {
    let online = true;
    let next = () => reply("boom", false);
    const worker = loadWorker(() =>
      online ? Promise.resolve(next()) : Promise.reject(new Error("offline")),
    );
    await worker.fire("install").result;
    for (const [target, response] of [
      ["/ecosystem/missing", () => reply("boom", false)],
      ["/legal/terms", () => reply("secret", true, "private, no-store, max-age=0")],
    ] as const) {
      next = response;
      const call = worker.fire("fetch", get(target, "navigate"));
      await call.settled();
    }
    online = false;
    for (const target of ["/ecosystem/missing", "/legal/terms"]) {
      await expect(worker.fire("fetch", get(target, "navigate")).result).resolves.toMatchObject({
        tag: "precache:/offline",
      });
    }
  });

  // Value: protects=stable-URL assets are served from cache first and refreshed behind, hashed build output is never refetched, and a failed response is never stored; fails_when=the ok check is dropped so a 500 is cached, cached assets stop being served, or immutable chunks revalidate; why_new=no test ran the asset path; seam=none
  it("serves cached assets first, never refetches hashed chunks, and never stores a failed response", async () => {
    let current: Network = (request) => Promise.resolve(reply(`v1:${request.url}`));
    const worker = loadWorker((request) => current(request));
    const asset = get("/images/hero-botanical.jpg");
    const initial = worker.fire("fetch", asset);
    await expect(initial.result).resolves.toMatchObject({ tag: `v1:${asset.url}` });
    await initial.settled();
    current = (request) => Promise.resolve(reply(`v2:${request.url}`));
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

  // Value: protects=runtime entries are capped without ever evicting the precached offline page; fails_when=the cache grows without bound or trimming removes the offline shell; why_new=the cache never evicted anything before; seam=none
  it("caps runtime entries and keeps the precached shell", async () => {
    const worker = loadWorker((request) => Promise.resolve(reply(`net:${request.url}`)));
    await worker.fire("install").result;
    for (let index = 0; index < 130; index += 1) {
      await worker.fire("fetch", get(`/images/plate-${index}.jpg`)).settled();
    }
    const [name] = [...worker.stores.keys()];
    const urls = [...worker.stores.get(name!)!.keys()];
    expect(urls).toContain(new URL("/offline", ORIGIN).href);
    expect(urls).not.toContain(new URL("/images/plate-0.jpg", ORIGIN).href);
    expect(urls).toContain(new URL("/images/plate-129.jpg", ORIGIN).href);
    expect(urls.length).toBeLessThan(130);
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

  // Value: protects=every precache entry resolves to a real file or route, because cache.addAll rejects on one miss and the worker then never installs; fails_when=a precached icon is renamed or the offline route is removed; why_new=the vm fake always resolves addAll; seam=none
  it("precaches only files and routes that exist", () => {
    const match = /const PRECACHE = (\[[^\]]*\]);/.exec(sw);
    const precache = JSON.parse(match![1]!) as string[];
    expect(precache).toContain("/offline");
    for (const entry of precache) {
      const exists =
        entry === "/offline"
          ? existsSync(path.join(ROOT, "src/app/(site)/offline/page.tsx"))
          : existsSync(path.join(ROOT, "public", entry));
      expect(exists, entry).toBe(true);
    }
  });
});
