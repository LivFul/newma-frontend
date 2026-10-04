import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
  replayIntegration: vi.fn(),
}));

const clientSource = readFileSync(
  path.join(process.cwd(), "src/instrumentation-client.ts"),
  "utf8",
);

describe("sentry-browser", () => {
  it("re-exports only what the client uses, so the bundler can drop Replay and Feedback", async () => {
    const mod = await import("@/lib/observability/sentry-browser");
    expect(Object.keys(mod).sort()).toEqual([
      "captureException",
      "captureRouterTransitionStart",
      "init",
    ]);
  });

  it("is the only route by which the browser loads the SDK (a namespace import ships all of it)", () => {
    expect(clientSource).not.toMatch(/import\(\s*["']@sentry\/nextjs["']\s*\)/);
    expect(clientSource).toMatch(/import\(\s*["']@\/lib\/observability\/sentry-browser["']\s*\)/);
  });
});
