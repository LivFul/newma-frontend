import { afterEach, describe, expect, it, vi } from "vitest";

const init = vi.fn();
const captureRouterTransitionStart = vi.fn();
vi.mock("@sentry/nextjs", () => ({ init, captureRouterTransitionStart }));

const load = async (dsn: string | undefined) => {
  vi.resetModules();
  if (dsn === undefined) vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
  else vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", dsn);
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
  const mod = await import("@/instrumentation-client");
  await mod.sentryReady;
  return mod;
};

describe("instrumentation-client", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
    vi.unstubAllEnvs();
    init.mockClear();
    captureRouterTransitionStart.mockClear();
  });
  it("never loads or initialises Sentry without a DSN", async () => {
    const mod = await load(undefined);
    expect(init).not.toHaveBeenCalled();
    mod.onRouterTransitionStart("/x", "push");
    expect(captureRouterTransitionStart).not.toHaveBeenCalled();
  });
  it("lazily initialises Sentry and forwards router transitions when a DSN is set", async () => {
    const mod = await load("https://k@o.ingest.sentry.io/1");
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://k@o.ingest.sentry.io/1", environment: "preview" }),
    );
    mod.onRouterTransitionStart("/x", "push");
    expect(captureRouterTransitionStart).toHaveBeenCalledWith("/x", "push");
  });
  it("does not load the SDK on a first load of the light custodian route (W10 budget)", async () => {
    window.history.pushState({}, "", "/demo/w10-custodian");
    const mod = await load("https://k@o.ingest.sentry.io/1");
    expect(init).not.toHaveBeenCalled();
    mod.onRouterTransitionStart("/x", "push");
    expect(captureRouterTransitionStart).not.toHaveBeenCalled();
  });
  it("still loads the SDK on other demo routes with a DSN", async () => {
    window.history.pushState({}, "", "/demo/w1-rights");
    await load("https://k@o.ingest.sentry.io/1");
    expect(init).toHaveBeenCalled();
  });
});
