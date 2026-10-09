import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_INIT_SCRIPT } from "@/lib/theme/init-script";

describe("theme init script", () => {
  it("matches the shipped public/theme-init.js file", () => {
    const shipped = readFileSync(
      path.resolve(__dirname, "../../../public/theme-init.js"),
      "utf8",
    ).trim();
    expect(THEME_INIT_SCRIPT.trim()).toBe(shipped);
  });
});
