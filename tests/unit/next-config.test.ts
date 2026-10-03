import type { NextConfig } from "next";
import { describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";

const EXPECTED_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

describe("next.config security headers", () => {
  it("applies the baseline headers to every route", async () => {
    const config = nextConfig as NextConfig;
    const rules = await config.headers!();
    const allRoutes = rules.find((rule) => rule.source === "/:path*");
    expect(allRoutes).toBeDefined();
    const received = Object.fromEntries(allRoutes!.headers.map((h) => [h.key, h.value]));
    expect(received).toEqual(EXPECTED_HEADERS);
  });
  it("is wrapped for MDX: a loader rule exists for .mdx files and pages stay unrouted", async () => {
    // @next/mdx only registers its Turbopack rules when TURBOPACK is set, as `next dev` and `next build` do.
    vi.stubEnv("TURBOPACK", "1");
    vi.resetModules();
    const { default: wrapped } = await import("../../next.config");
    vi.unstubAllEnvs();
    const config = wrapped as NextConfig;
    const rules = config.turbopack?.rules ?? {};
    expect(Object.keys(rules).some((key) => key.includes("mdx"))).toBe(true);
    expect(typeof config.webpack).toBe("function");
    expect(config.pageExtensions ?? ["tsx", "ts", "jsx", "js"]).not.toContain("mdx");
  });
  it("adds X-Robots-Tag noindex rules for the demo, sign-in, primitives and API surfaces", async () => {
    const rules = await (nextConfig as NextConfig).headers!();
    for (const source of ["/demo/:path*", "/access", "/primitives", "/api/:path*"]) {
      const rule = rules.find((r) => r.source === source);
      expect(rule, source).toBeDefined();
      expect(rule!.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
    }
  });
  it("leaves the homepage and component pages indexable (no X-Robots-Tag rule)", async () => {
    const rules = await (nextConfig as NextConfig).headers!();
    const robotsSources = rules
      .filter((r) => r.headers.some((h) => h.key === "X-Robots-Tag"))
      .map((r) => r.source);
    expect(robotsSources.sort()).toEqual(["/access", "/api/:path*", "/demo/:path*", "/primitives"]);
  });
  it("sets no Content-Security-Policy: it is deferred to the deploy-hardening item (A-P4-16)", async () => {
    const rules = await (nextConfig as NextConfig).headers!();
    const keys = rules.flatMap((rule) => rule.headers.map((h) => h.key));
    expect(keys).not.toContain("Content-Security-Policy");
  });
});
