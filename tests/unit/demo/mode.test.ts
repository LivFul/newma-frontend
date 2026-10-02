import { afterEach, describe, expect, it, vi } from "vitest";
import { isDemoMode } from "@/lib/demo/mode";

describe("isDemoMode", () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is true only when NEXT_PUBLIC_DEMO_MODE is exactly "true"', () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    expect(isDemoMode()).toBe(true);
  });
  it.each(["", "1", "TRUE", "false", undefined])("is false for %j", (value) => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", value as string);
    expect(isDemoMode()).toBe(false);
  });
});
