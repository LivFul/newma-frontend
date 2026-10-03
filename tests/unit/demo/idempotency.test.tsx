import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStableKey } from "@/lib/demo/idempotency";
import { postJson } from "@/lib/demo/client";
import { vi } from "vitest";

describe("useStableKey", () => {
  it("keeps one key across renders and mints a new one on reset", () => {
    const { result, rerender } = renderHook(() => useStableKey());
    const first = result.current.key;
    rerender();
    expect(result.current.key).toBe(first);
    act(() => result.current.reset());
    expect(result.current.key).not.toBe(first);
    expect(result.current.key).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
  });
});

describe("postJson", () => {
  it("returns data and the replay flag on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ id: "x" }, { status: 200, headers: { "idempotent-replayed": "true" } }),
      ),
    );
    const result = await postJson<{ id: string }>("/api/demo/x", { a: 1 });
    expect(result).toEqual({ ok: true, status: 200, data: { id: "x" }, replayed: true });
    vi.unstubAllGlobals();
  });

  it("returns the error envelope with details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { code: "persona_forbidden", message: "no", details: { allowed: ["x"] } },
          { status: 403 },
        ),
      ),
    );
    const result = await postJson("/api/demo/x", {});
    expect(result).toEqual({
      ok: false,
      status: 403,
      error: { code: "persona_forbidden", message: "no", details: { allowed: ["x"] } },
    });
    vi.unstubAllGlobals();
  });

  it("maps a network failure and a non-envelope body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    expect(await postJson("/api/demo/x", {})).toMatchObject({
      ok: false,
      status: 0,
      error: { code: "network_error" },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("oops", { status: 500 })),
    );
    expect(await postJson("/api/demo/x", {})).toMatchObject({
      ok: false,
      status: 500,
      error: { code: "upstream_error" },
    });
    vi.unstubAllGlobals();
  });
});
