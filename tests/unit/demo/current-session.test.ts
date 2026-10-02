import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const cookieStore = { get: vi.fn() };
const headerStore = new Headers();
vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => headerStore,
}));
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));

import { requireSession, requireSessionFetch } from "@/lib/demo/current-session";
import { armBff, disarmBff, envelope } from "./bff-helpers";

describe("requireSession", () => {
  afterEach(() => {
    disarmBff();
    cookieStore.get.mockReset();
    redirect.mockClear();
  });

  it("returns the backend session for the cookie matching the scheme", async () => {
    const fetchMock = armBff([
      Response.json({ persona: "scientist", tenant_id: "t", expires_at: "x", created_at: "y" }),
    ]);
    cookieStore.get.mockImplementation((name: string) =>
      name === "newma_demo_sid" ? { value: "sid-9" } : undefined,
    );
    const session = await requireSession();
    expect(session.persona).toBe("scientist");
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("x-demo-session")).toBe("sid-9");
  });

  it("redirects to /access when there is no cookie", async () => {
    armBff([]);
    await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT /access");
  });

  it("redirects through the cookie-clearing route when the backend rejects the session", async () => {
    armBff([envelope("session_expired", 401)]);
    cookieStore.get.mockReturnValue({ value: "stale" });
    await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT /api/demo/sessions/expired");
  });

  it("rethrows other backend failures so the error boundary shows them", async () => {
    armBff([envelope("upstream_error", 503)]);
    cookieStore.get.mockReturnValue({ value: "sid" });
    await expect(requireSession()).rejects.toMatchObject({ status: 503 });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("requireSession memoisation", () => {
  // React's per-request `cache` only memoises inside a server render, which jsdom cannot host;
  // the guard is structural: the export must be the cache() wrapper of the loader.
  it("is wrapped in React cache() so layout and page share one backend call per render", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../../../src/lib/demo/current-session.ts"),
      "utf8",
    );
    expect(source).toMatch(/import \{ cache \} from "react";/);
    expect(source).toMatch(/export const requireSession = cache\(async/);
  });
});

describe("requireSessionFetch", () => {
  afterEach(() => {
    disarmBff();
    cookieStore.get.mockReset();
    redirect.mockClear();
  });

  it("forwards the cookie session to the given path", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    cookieStore.get.mockReturnValue({ value: "sid-2" });
    const { data } = await requireSessionFetch<{ items: unknown[] }>("/v1/jobs");
    expect(data).toEqual({ items: [] });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example/v1/jobs");
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("x-demo-session")).toBe("sid-2");
  });

  it("redirects through the expired route when the backend rejects the session", async () => {
    armBff([envelope("invalid_session", 401)]);
    cookieStore.get.mockReturnValue({ value: "stale" });
    await expect(requireSessionFetch("/v1/jobs")).rejects.toThrow(
      "NEXT_REDIRECT /api/demo/sessions/expired",
    );
  });

  it("rethrows other failures", async () => {
    armBff([envelope("not_found", 404)]);
    cookieStore.get.mockReturnValue({ value: "sid" });
    await expect(requireSessionFetch("/v1/jobs/x")).rejects.toMatchObject({ status: 404 });
    expect(redirect).not.toHaveBeenCalled();
  });
});
