import { describe, expect, it, vi } from "vitest";
import { absoluteUrl, FALLBACK_SITE_URL, siteUrl, type SiteEnv } from "@/lib/site";

const env = (partial: SiteEnv): SiteEnv => partial;

describe("siteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL over the Vercel production host over the constant", () => {
    expect(
      siteUrl(
        env({
          NEXT_PUBLIC_SITE_URL: "https://newma.example",
          VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
        }),
      ),
    ).toBe("https://newma.example");
    expect(siteUrl(env({ VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app" }))).toBe(
      "https://prod.vercel.app",
    );
    expect(siteUrl(env({}))).toBe(FALLBACK_SITE_URL);
    expect(FALLBACK_SITE_URL).toBe("https://newma-frontend.vercel.app");
  });
  it("never uses the per-deployment VERCEL_URL, even when the process environment sets it", () => {
    vi.stubEnv("VERCEL_URL", "newma-abc123.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    try {
      expect(siteUrl()).toBe(FALLBACK_SITE_URL);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("trims trailing slashes and whitespace", () => {
    expect(siteUrl(env({ NEXT_PUBLIC_SITE_URL: " https://newma.example/// " }))).toBe(
      "https://newma.example",
    );
  });
  it("treats an empty value as unset", () => {
    expect(siteUrl(env({ NEXT_PUBLIC_SITE_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "" }))).toBe(
      FALLBACK_SITE_URL,
    );
  });
  it("rejects http:// in production builds but allows it in development", () => {
    expect(() =>
      siteUrl(env({ NEXT_PUBLIC_SITE_URL: "http://newma.example", NODE_ENV: "production" })),
    ).toThrow(/https/);
    expect(
      siteUrl(env({ NEXT_PUBLIC_SITE_URL: "http://localhost:3100", NODE_ENV: "development" })),
    ).toBe("http://localhost:3100");
  });
  it("rejects values that are not absolute URLs", () => {
    expect(() => siteUrl(env({ NEXT_PUBLIC_SITE_URL: "newma.example" }))).toThrow(/absolute/);
  });
  it("builds absolute URLs from paths", () => {
    const e = env({ NEXT_PUBLIC_SITE_URL: "https://newma.example/" });
    expect(absoluteUrl("/x", e)).toBe("https://newma.example/x");
    expect(absoluteUrl("y", e)).toBe("https://newma.example/y");
    expect(absoluteUrl("/", e)).toBe("https://newma.example/");
  });
});
