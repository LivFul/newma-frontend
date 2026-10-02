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

import { requireSession } from "@/lib/demo/current-session";
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
