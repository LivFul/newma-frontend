import { describe, expect, it } from "vitest";
import { sentryOptions } from "@/lib/observability/sentry-options";

describe("sentryOptions", () => {
  it("is disabled with no DSN and defaults the environment to development", () => {
    const options = sentryOptions({});
    expect(options.enabled).toBe(false);
    expect(options.dsn).toBeUndefined();
    expect(options.environment).toBe("development");
  });
  it("treats a whitespace-only DSN as unset", () => {
    expect(sentryOptions({ NEXT_PUBLIC_SENTRY_DSN: "   " }).enabled).toBe(false);
  });
  it("enables with a DSN and takes the environment from VERCEL_ENV", () => {
    const options = sentryOptions({
      NEXT_PUBLIC_SENTRY_DSN: "https://key@o0.ingest.sentry.io/1",
      VERCEL_ENV: "preview",
    });
    expect(options.enabled).toBe(true);
    expect(options.dsn).toBe("https://key@o0.ingest.sentry.io/1");
    expect(options.environment).toBe("preview");
  });
  it("never sends default PII and samples 10% of traces", () => {
    const options = sentryOptions({});
    expect(options.sendDefaultPii).toBe(false);
    expect(options.tracesSampleRate).toBe(0.1);
  });
});
