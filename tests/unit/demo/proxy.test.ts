import { afterEach, describe, expect, it } from "vitest";
import { forward, proxy, withParams } from "@/lib/demo/proxy";
import {
  isIdempotencyKey,
  isNonEmptyString,
  isRecord,
  isStringArray,
  isUuid,
  oneOf,
  withIdempotencyKey,
} from "@/lib/demo/guards";
import { demoFetch } from "@/lib/demo/api";
import { armBff, bffRequest, disarmBff, sentUrl } from "./bff-helpers";

describe("guards", () => {
  it("validates primitives", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isNonEmptyString(" ")).toBe(false);
    expect(isNonEmptyString("a")).toBe(true);
    expect(isStringArray(["a"])).toBe(true);
    expect(isStringArray([1])).toBe(false);
    expect(isUuid("3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f")).toBe(true);
    expect(isUuid("DEMO-C-001")).toBe(false);
    expect(oneOf(["a", "b"] as const)("b")).toBe(true);
    expect(oneOf(["a", "b"] as const)("c")).toBe(false);
    expect(isIdempotencyKey("k:1.a-b_c")).toBe(true);
    expect(isIdempotencyKey("bad key")).toBe(false);
    expect(isIdempotencyKey("x".repeat(129))).toBe(false);
  });

  it("keeps a valid client key and mints one otherwise", () => {
    expect(withIdempotencyKey({ a: 1, idempotency_key: "k-1" })).toEqual({
      a: 1,
      idempotency_key: "k-1",
    });
    const minted = withIdempotencyKey({ a: 1 });
    expect(minted?.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(withIdempotencyKey({ idempotency_key: "bad key" })).toBeUndefined();
  });
});

describe("forward and proxy", () => {
  afterEach(disarmBff);

  it("forwards status, the replay header and no-store", async () => {
    armBff([
      new Response(JSON.stringify({ id: "x" }), {
        status: 200,
        headers: { "content-type": "application/json", "idempotent-replayed": "true" },
      }),
    ]);
    const response = forward(await demoFetch("/v1/candidates", { sessionId: "s" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("idempotent-replayed")).toBe("true");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("proxy builds the query string and skips undefined values", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    await proxy("/v1/taxa", { sessionId: "s", query: { cursor: "a b", limit: undefined } });
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/taxa?cursor=a+b");
  });

  it("withParams awaits params inside the session wrapper", async () => {
    armBff([], false);
    const handler = withParams<{ id: string }>(async (_ctx, params) =>
      forward({ status: 200, data: params, headers: new Headers() }),
    );
    const off = await handler(bffRequest("/x"), { params: Promise.resolve({ id: "a" }) });
    expect(off.status).toBe(404);
    armBff([]);
    const on = await handler(bffRequest("/x"), { params: Promise.resolve({ id: "a" }) });
    expect(await on.json()).toEqual({ id: "a" });
  });
});
