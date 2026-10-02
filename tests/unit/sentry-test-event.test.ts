import { describe, expect, it, vi } from "vitest";
import { sendTestEvent } from "../../scripts/sentry-test-event.mjs";

const sentryStub = () => ({
  init: vi.fn(),
  captureMessage: vi.fn(() => "event-id"),
  flush: vi.fn(async () => true),
});

describe("sentry-test-event", () => {
  it("reports no DSN configured and sends nothing without a DSN", async () => {
    const sentry = sentryStub();
    await expect(sendTestEvent({}, sentry)).resolves.toBe("no DSN configured");
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });
  it("initialises, sends one message and flushes when a DSN is set", async () => {
    const sentry = sentryStub();
    const env = {
      NEXT_PUBLIC_SENTRY_DSN: "https://key@o0.ingest.sentry.io/1",
      VERCEL_ENV: "preview",
    };
    await expect(sendTestEvent(env, sentry)).resolves.toMatch(/sent event event-id/);
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: env.NEXT_PUBLIC_SENTRY_DSN, environment: "preview" }),
    );
    expect(sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(sentry.captureMessage).toHaveBeenCalledWith("newma-frontend test event");
    expect(sentry.flush).toHaveBeenCalled();
  });
});
