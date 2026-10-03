import { describe, expect, it, vi } from "vitest";

const requireSessionFetch = vi.fn();
vi.mock("@/lib/demo/current-session", () => ({ requireSessionFetch }));
const { load } = await import("@/lib/demo/server-data");
const { DemoApiError } = await import("@/lib/demo/api");

describe("load", () => {
  it("returns data", async () => {
    requireSessionFetch.mockResolvedValueOnce({
      status: 200,
      data: { items: [] },
      headers: new Headers(),
    });
    expect(await load("/v1/candidates")).toEqual({ data: { items: [] } });
  });

  it("turns a 4xx envelope into a renderable error without details outside the allowlist", async () => {
    requireSessionFetch.mockRejectedValueOnce(
      new DemoApiError(404, { code: "not_found", message: "Not found.", details: { x: 1 } }),
    );
    expect(await load("/v1/candidates")).toEqual({
      error: { code: "not_found", message: "Not found." },
    });
  });

  it("hides 5xx and unknown failures behind upstream_error", async () => {
    requireSessionFetch.mockRejectedValueOnce(new Error("boom"));
    const result = await load("/v1/candidates");
    expect(result.error?.code).toBe("upstream_error");
  });

  it("rethrows Next redirects", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/access;307;",
    });
    requireSessionFetch.mockRejectedValueOnce(redirect);
    await expect(load("/v1/candidates")).rejects.toBe(redirect);
  });
});
