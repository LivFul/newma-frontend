import type { NextConfig } from "next";
import { describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";
import { buildCsp } from "@/lib/security/csp";
import { pathToRegexp } from "next/dist/compiled/path-to-regexp";

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
    for (const source of ["/demo/:path*", "/access/:path*", "/primitives/:path*", "/api/:path*"]) {
      const rule = rules.find((r) => r.source === source);
      expect(rule, source).toBeDefined();
      expect(rule!.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
    }
  });
  // Value: protects=/sw.js is revalidated on every load and may control the whole origin, so an updated worker is picked up; fails_when=the no-cache or Service-Worker-Allowed header is dropped or loosened; why_new=no test covered the worker's headers; seam=none
  it("serves /sw.js uncached and allowed to control the whole origin", async () => {
    const rules = await (nextConfig as NextConfig).headers!();
    const rule = rules.find((r) => r.source === "/sw.js");
    expect(rule, "/sw.js").toBeDefined();
    expect(rule!.headers).toEqual([
      { key: "Cache-Control", value: "no-cache" },
      { key: "Service-Worker-Allowed", value: "/" },
    ]);
  });
  it("leaves the homepage and component pages indexable (no X-Robots-Tag rule)", async () => {
    const rules = await (nextConfig as NextConfig).headers!();
    const robotsSources = rules
      .filter((r) => r.headers.some((h) => h.key === "X-Robots-Tag"))
      .map((r) => r.source);
    expect(robotsSources.sort()).toEqual([
      "/access/:path*",
      "/api/:path*",
      "/demo/:path*",
      "/primitives/:path*",
    ]);
  });
  it("ships the CSP as Report-Only, statically everywhere except the proxy's nonce routes (A-P4-16)", async () => {
    const rules = await (nextConfig as NextConfig).headers!();
    const keys = rules.flatMap((rule) => rule.headers.map((h) => h.key));
    expect(keys).not.toContain("Content-Security-Policy");
    const cspRules = rules.filter((r) =>
      r.headers.some((h) => h.key === "Content-Security-Policy-Report-Only"),
    );
    expect(cspRules).toHaveLength(1);
    const [rule] = cspRules;
    expect(rule.headers).toEqual([
      {
        key: "Content-Security-Policy-Report-Only",
        value: buildCsp({
          nodeEnv: process.env.NODE_ENV,
          sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          vercelEnv: process.env.VERCEL_ENV,
        }),
      },
    ]);
    // Next compiles `source` with path-to-regexp; the same library decides which paths match here.
    const matches = (path: string) => pathToRegexp(rule.source).test(path);
    for (const path of ["/", "/ecosystem/wet-lab", "/legal/privacy", "/api/demo/me", "/demos"]) {
      expect(matches(path), path).toBe(true);
    }
    for (const path of ["/access", "/demo", "/demo/w1-rights", "/demo/w6-provenance/a/b"]) {
      expect(matches(path), path).toBe(false);
    }
  });
});
