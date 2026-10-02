import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { clearSessionCookie, demoGuard, noStore, withSession } from "@/lib/demo/bff";
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
    expect(await response.text()).not.toContain("secret-in-message");
    expect(spy).toHaveBeenCalled();
  });
});
