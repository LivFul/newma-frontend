import { describe, expect, it } from "vitest";
import { seededTargets, uuid5 } from "@/lib/demo/seed-targets";

describe("uuid5", () => {
  it("matches RFC 4122 / Python uuid.uuid5", () => {
    // uuid.uuid5(uuid.NAMESPACE_DNS, "python.org")
    expect(uuid5("6ba7b810-9dad-11d1-80b4-00c04fd430c8", "python.org")).toBe(
      "886313e1-3b8a-5372-9b90-0c9aee199e5d",
    );
  });

  it("maps the seeded targets into a tenant", () => {
    const targets = seededTargets("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
    expect(targets.map((t) => t.display_name)).toEqual([
      "Target-α — fictional",
      "Target-β — fictional",
      "Target-γ — fictional",
    ]);
    expect(targets[0].id).toBe(
      uuid5("6ba7b810-9dad-11d1-80b4-00c04fd430c8", "c36d0680-ff9b-59c5-bbf8-9e86152e25a5"),
    );
  });
});

describe("seededTargets with a malformed tenant id", () => {
  it("returns no targets instead of throwing", () => {
    expect(seededTargets("not-a-uuid")).toEqual([]);
  });
});
