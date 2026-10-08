import { describe, expect, it } from "vitest";
import { bootstrapFromStorage, parsePreference, resolveTheme } from "@/lib/theme/state";

describe("theme state", () => {
  it("parses invalid storage as the default dark preference", () => {
    expect(parsePreference("nope")).toBe("dark");
    expect(parsePreference(null)).toBe("dark");
  });

  it("resolves explicit and system preferences", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("bootstraps class hints from storage", () => {
    expect(bootstrapFromStorage("dark", false)).toEqual({
      preference: "dark",
      resolved: "dark",
    });
    expect(bootstrapFromStorage(null, false)).toEqual({
      preference: "dark",
      resolved: "dark",
    });
  });
});
