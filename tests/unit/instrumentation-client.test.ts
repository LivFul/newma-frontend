import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const init = vi.fn();
const captureRouterTransitionStart = vi.fn();
const captureException = vi.fn();
vi.mock("@/lib/observability/sentry-browser", () => ({
  init,
  captureRouterTransitionStart,
  captureException,
}));

// jsdom has no requestIdleCallback: hold idle callbacks so a test can choose when the page is idle.
let idleCallbacks: (() => void)[] = [];
const runIdle = () => {
  const pending = idleCallbacks;
  idleCallbacks = [];
  pending.forEach((callback) => callback());
};

const load = async (dsn: string | undefined) => {
  vi.resetModules();
  if (dsn === undefined) vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
  else vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", dsn);
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
  const mod = await import("@/instrumentation-client");
  runIdle();
  await mod.sentryReady;
  return mod;
};

describe("instrumentation-client", () => {
  beforeEach(() => {
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => idleCallbacks.push(callback));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    idleCallbacks = [];
    captureException.mockClear();
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
  it("waits for the page to be idle after load before fetching the SDK (keeps it out of LCP and TBT)", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://k@o.ingest.sentry.io/1");
    const mod = await import("@/instrumentation-client");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(init).not.toHaveBeenCalled();
    runIdle();
    await mod.sentryReady;
    expect(init).toHaveBeenCalledTimes(1);
  });
  it("reports errors thrown before the SDK loaded once it has initialised", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://k@o.ingest.sentry.io/1");
    const mod = await import("@/instrumentation-client");
    const early = new Error("before init");
    window.dispatchEvent(new ErrorEvent("error", { error: early }));
    expect(captureException).not.toHaveBeenCalled();
    runIdle();
    await mod.sentryReady;
    expect(captureException).toHaveBeenCalledWith(early);
  });
  it("logs instead of rejecting when the SDK cannot start", async () => {
    const failure = new Error("chunk failed");
    init.mockImplementationOnce(() => {
      throw failure;
    });
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(load("https://k@o.ingest.sentry.io/1")).resolves.toBeDefined();
    expect(logged).toHaveBeenCalledWith("Sentry browser SDK failed to start", failure);
    logged.mockRestore();
  });
});
