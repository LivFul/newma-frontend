import { describe, expect, it } from "vitest";
import { buildCsp, sentryOrigin } from "@/lib/security/csp";

const directives = (policy: string) =>
  Object.fromEntries(
    policy.split("; ").map((part) => {
      const [name, ...values] = part.split(" ");
      return [name, values];
    }),
  ) as Record<string, string[]>;

describe("buildCsp", () => {
  it("is first-party only in production, with no eval and no report endpoint", () => {
    const d = directives(buildCsp({ nodeEnv: "production" }));
    expect(d["default-src"]).toEqual(["'self'"]);
    expect(d["script-src"]).toEqual(["'self'", "'unsafe-inline'"]);
    expect(d["connect-src"]).toEqual(["'self'"]);
    expect(d["object-src"]).toEqual(["'none'"]);
    expect(d["frame-ancestors"]).toEqual(["'none'"]);
    expect(d["base-uri"]).toEqual(["'self'"]);
    expect(d["form-action"]).toEqual(["'self'"]);
    // No scheme-only or wildcard sources anywhere.
    expect(
      Object.values(d)
        .flat()
        .filter((v) => /^(\*|[a-z-]+:)$/.test(v)),
    ).toEqual([]);
    expect(d["img-src"]).toEqual(["'self'"]);
    expect(Object.keys(d)).not.toContain("report-uri");
    expect(Object.keys(d)).not.toContain("report-to");
    // Ignored (with a console warning) in a report-only policy.
    expect(Object.keys(d)).not.toContain("upgrade-insecure-requests");
  });

  it("adds eval and the analytics debug origin in development only", () => {
    const d = directives(buildCsp({ nodeEnv: "development" }));
    expect(d["script-src"]).toContain("'unsafe-eval'");
    expect(d["script-src"]).toContain("https://va.vercel-scripts.com");
    expect(buildCsp({ nodeEnv: "production" })).not.toContain("vercel-scripts");
  });

  it("allows the Sentry DSN's origin for connect-src without leaking the key or path", () => {
    const policy = buildCsp({
      nodeEnv: "production",
      sentryDsn: "https://publickey@o123.ingest.de.sentry.io/456",
    });
    expect(directives(policy)["connect-src"]).toEqual([
      "'self'",
      "https://o123.ingest.de.sentry.io",
    ]);
    expect(policy).not.toContain("publickey");
    expect(policy).not.toContain("/456");
  });

  it("uses the nonce with 'strict-dynamic' instead of 'unsafe-inline' when one is given", () => {
    const d = directives(buildCsp({ nodeEnv: "production", nonce: "abc123DEF456ghi7+/=" }));
    expect(d["script-src"]).toEqual(["'self'", "'nonce-abc123DEF456ghi7+/='", "'strict-dynamic'"]);
    expect(d["script-src"]).not.toContain("'unsafe-inline'");
  });

  it("refuses a nonce that could break out of the directive", () => {
    expect(() => buildCsp({ nonce: "x'; script-src *" })).toThrow(/nonce/);
    expect(() => buildCsp({ nonce: "" })).toThrow(/nonce/);
  });

  it("defaults to the production policy when called without an environment", () => {
    expect(buildCsp()).toBe(buildCsp({ nodeEnv: "production" }));
  });
});

describe("sentryOrigin", () => {
  it.each([undefined, "", "   ", "not a url", "javascript:alert(1)"])(
    "is undefined for %j",
    (dsn) => {
      expect(sentryOrigin(dsn)).toBeUndefined();
    },
  );
});
