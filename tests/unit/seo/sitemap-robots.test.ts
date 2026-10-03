import { afterEach, describe, expect, it, vi } from "vitest";
import { ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";
import { FALLBACK_SITE_URL } from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.doUnmock("@/lib/site");
});

describe("sitemap", () => {
  it("lists exactly the home page and the six component pages, with no dates", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = sitemap();
    expect(entries.map((e) => e.url)).toEqual([
      `${FALLBACK_SITE_URL}/`,
      ...ECOSYSTEM_SLUGS.map((slug) => `${FALLBACK_SITE_URL}/ecosystem/${slug}`),
    ]);
    for (const entry of entries) expect(entry).not.toHaveProperty("lastModified");
  });
  it("never lists the demo, the sign-in page or the primitives gallery", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    for (const url of urls) expect(url).not.toMatch(/\/(access|demo|primitives|legal)/);
  });
  it("lists the legal pages only once they are approved", async () => {
    vi.resetModules();
    vi.doMock("@/lib/site", async (importOriginal) => ({
      ...(await importOriginal<typeof import("@/lib/site")>()),
      LEGAL_APPROVED: true,
    }));
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(`${FALLBACK_SITE_URL}/legal/privacy`);
    expect(urls).toContain(`${FALLBACK_SITE_URL}/legal/terms`);
  });
});

describe("robots", () => {
  it("allows the site, disallows /api/ and lists the sitemap on production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: robots } = await import("@/app/robots");
    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
      sitemap: `${FALLBACK_SITE_URL}/sitemap.xml`,
    });
  });
  it("does not disallow /access, /demo or /primitives, so crawlers can see their noindex", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: robots } = await import("@/app/robots");
    const rules = robots().rules;
    const text = JSON.stringify(rules);
    for (const path of ["/access", "/demo", "/primitives"]) expect(text).not.toContain(path);
  });
  it("disallows everything on previews and any other Vercel environment", async () => {
    for (const env of ["preview", "development"]) {
      vi.resetModules();
      vi.stubEnv("VERCEL_ENV", env);
      const { default: robots } = await import("@/app/robots");
      expect(robots()).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
    }
  });
  it("treats a non-Vercel build (no VERCEL_ENV) as the public site", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    const { default: robots } = await import("@/app/robots");
    expect(JSON.stringify(robots())).toContain("sitemap");
  });
});
