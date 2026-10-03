import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  demoGuard,
  noStore,
  readJson,
  seeOther,
  withDemo,
  withSession,
} from "@/lib/demo/bff";
import { DemoApiError } from "@/lib/demo/api";
import { armBff, bffRequest, disarmBff, setCookieHeader } from "./bff-helpers";

describe("demoGuard", () => {
  afterEach(disarmBff);
  it("returns undefined in demo mode and a 404 JSON response otherwise", async () => {
    armBff([]);
    expect(demoGuard()).toBeUndefined();
    armBff([], false);
    const response = demoGuard();
    expect(response?.status).toBe(404);
    expect((await response?.json()).code).toBe("not_found");
  });
});

describe("noStore", () => {
  it("answers 204 with no body when given undefined", async () => {
    const response = noStore(undefined);
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("");
  });
  it("serialises JSON with Cache-Control: no-store and the given status", async () => {
    const response = noStore({ a: 1 }, { status: 201 });
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ a: 1 });
  });
});

describe("clearSessionCookie", () => {
  it("expires the cookie matching the scheme", () => {
    const secure = clearSessionCookie(NextResponse.json({}), true);
    expect(setCookieHeader(secure)).toMatch(/^__Host-newma_demo_sid=;.*Max-Age=0/);
    const dev = clearSessionCookie(NextResponse.json({}), false);
    expect(setCookieHeader(dev)).toMatch(/^newma_demo_sid=;.*Max-Age=0/);
  });
});

describe("withSession", () => {
  afterEach(disarmBff);

  it("hands the handler the session id and scheme", async () => {
    armBff([]);
    const handler = vi.fn(async () => noStore({ ok: true }));
    const response = await withSession(handler)(bffRequest("/x", { https: true }));
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "sid-123", secure: true }),
    );
  });

  it("maps a non-session DemoApiError to its status and envelope", async () => {
    armBff([]);
    const failing = withSession(async () => {
      throw new DemoApiError(409, { code: "job_terminal", message: "done" });
    });
    const response = await failing(bffRequest("/x"));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "job_terminal",
      message: "done",
      details: undefined,
    });
    expect(setCookieHeader(response)).toBe("");
  });

  it("maps an unexpected error to a 502 without leaking its message", async () => {
    armBff([]);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = withSession(async () => {
      throw new Error("Bearer secret-in-message");
    });
    const response = await failing(bffRequest("/x"));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      code: "upstream_error",
      message: "The demo backend is unavailable",
    });
    expect(spy).toHaveBeenCalled();
  });
});

describe("same-origin guard", () => {
  afterEach(disarmBff);
  const ok = async () => noStore({ ok: true });

  it.each(["same-origin", "none"])("allows a non-GET with Sec-Fetch-Site %s", async (site) => {
    armBff([]);
    const response = await withSession(ok)(bffRequest("/x", { method: "POST", fetchSite: site }));
    expect(response.status).toBe(200);
  });
  it("allows a non-GET without Sec-Fetch-Site when Origin matches the request origin", async () => {
    armBff([]);
    const response = await withDemo(ok)(
      bffRequest("/x", { method: "POST", fetchSite: null, origin: "http://localhost:3100" }),
    );
    expect(response.status).toBe(200);
  });
  it("matches Origin against the forwarded host and proto", async () => {
    armBff([]);
    const req = bffRequest("/x", {
      method: "POST",
      fetchSite: null,
      origin: "https://app.example",
    });
    req.headers.set("x-forwarded-host", "app.example");
    req.headers.set("x-forwarded-proto", "https");
    expect((await withDemo(ok)(req)).status).toBe(200);
  });
  it.each([
    { fetchSite: "cross-site", origin: "http://localhost:3100" },
    { fetchSite: "same-site", origin: "http://localhost:3100" },
    { fetchSite: null, origin: "https://evil.example" },
    { fetchSite: null, origin: null },
  ])("rejects %j with 403 cross_site_request", async (opts) => {
    armBff([]);
    const handler = vi.fn(ok);
    const response = await withSession(handler)(bffRequest("/x", { method: "POST", ...opts }));
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe("cross_site_request");
    expect(handler).not.toHaveBeenCalled();
  });
  it("never applies to GET", async () => {
    armBff([]);
    const response = await withSession(ok)(bffRequest("/x", { fetchSite: "cross-site" }));
    expect(response.status).toBe(200);
  });
});

describe("readJson", () => {
  afterEach(disarmBff);
  it("returns the parsed body for application/json (with parameters)", async () => {
    armBff([]);
    const req = bffRequest("/x", {
      method: "POST",
      json: { a: 1 },
      contentType: "application/json; charset=utf-8",
    });
    await expect(readJson(req)).resolves.toEqual({ a: 1 });
  });
  it("maps a missing or wrong Content-Type to 415 inside the wrappers", async () => {
    armBff([]);
    const handler = withDemo(async (req) => noStore(await readJson(req)));
    const response = await handler(bffRequest("/x", { method: "POST", contentType: "text/plain" }));
    expect(response.status).toBe(415);
    expect((await response.json()).code).toBe("unsupported_media_type");
  });
});

describe("seeOther", () => {
  it("answers 303 with a relative Location", () => {
    const response = seeOther("/access?reason=expired");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/access?reason=expired");
  });
});

describe("readJson size cap", () => {
  afterEach(disarmBff);
  const CAP = 256 * 1024;
  const handler = withSession(async ({ req }) => noStore((await readJson(req)) ?? null));
  const streamed = (chunks: Uint8Array[], headers: Record<string, string> = {}) => {
    let pulled = 0;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (pulled >= chunks.length) return controller.close();
        controller.enqueue(chunks[pulled]);
        pulled += 1;
      },
      cancel() {
        cancelled = true;
      },
    });
    const request = new NextRequest("http://localhost:3100/x", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "newma_demo_sid=sid-123",
        "sec-fetch-site": "same-origin",
        ...headers,
      },
      body,
      duplex: "half",
    } as unknown as ConstructorParameters<typeof NextRequest>[1]);
    return { request, state: () => ({ pulled, cancelled }) };
  };

  it("refuses a body over 256 KiB with 413", async () => {
    armBff([]);
    const big = { blob: "x".repeat(300 * 1024) };
    const response = await handler(bffRequest("/x", { method: "POST", json: big }));
    expect(response.status).toBe(413);
    expect((await response.json()).code).toBe("payload_too_large");
  });

  it("rejects on Content-Length alone, before reading the body", async () => {
    armBff([]);
    const { request, state } = streamed([new Uint8Array(10)], {
      "content-length": String(CAP + 1),
    });
    expect((await handler(request)).status).toBe(413);
    // A ReadableStream prefetches one chunk by itself; the handler must not have read any.
    expect(state().pulled).toBeLessThanOrEqual(1);
    expect(request.bodyUsed).toBe(false);
  });

  it("aborts a chunked body at the cap instead of buffering all of it", async () => {
    armBff([]);
    const chunk = new Uint8Array(64 * 1024).fill(0x61);
    const { request, state } = streamed(Array.from({ length: 100 }, () => chunk));
    expect((await handler(request)).status).toBe(413);
    expect(state().cancelled).toBe(true);
    expect(state().pulled).toBeLessThan(10);
  });

  it("still parses a chunked body under the cap", async () => {
    armBff([]);
    const enc = new TextEncoder();
    const { request } = streamed([enc.encode('{"a":'), enc.encode("1}")]);
    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ a: 1 });
  });
});
