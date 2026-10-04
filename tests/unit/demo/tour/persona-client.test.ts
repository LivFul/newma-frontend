import { afterEach, describe, expect, it, vi } from "vitest";
import { switchPersona } from "@/lib/demo/persona-client";

describe("switchPersona", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts the persona to the BFF route and resolves true on success", async () => {
    const fetchMock = vi.fn(async () => Response.json({ persona: "finance" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(switchPersona("finance")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/demo/sessions/persona", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ persona: "finance" }),
    });
  });

  it("resolves false on an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ code: "x", message: "y" }, { status: 403 })),
    );
    await expect(switchPersona("partner")).resolves.toBe(false);
  });

  it("resolves false when the request cannot be made", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network");
      }),
    );
    await expect(switchPersona("partner")).resolves.toBe(false);
  });
});
