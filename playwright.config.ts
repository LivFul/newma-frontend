import { defineConfig, devices } from "@playwright/test";

// PORT lets a developer sidestep a busy :3000 locally; PLAYWRIGHT_BASE_URL targets a deployed preview (P1+).
const port = process.env.PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const WEB_SERVER_TIMEOUT_MS = 120_000;
// next dev compiles on demand and shares the CPU with everything else on a laptop; CI hits a built preview.
const TEST_TIMEOUT_MS = process.env.CI ? 30_000 : 60_000;
// Vercel Authentication blocks previews unless every request carries the bypass header (P1 review focus 1).
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders: Record<string, string> = bypass
  ? { "x-vercel-protection-bypass": bypass, "x-vercel-set-bypass-cookie": "true" }
  : {};

export default defineConfig({
  testDir: "tests",
  testMatch: ["e2e/**/*.spec.ts", "a11y/**/*.spec.ts"],
  fullyParallel: true,
  timeout: TEST_TIMEOUT_MS,
  // next dev compiles routes on first hit; the demo pages re-render after BFF writes.
  expect: { timeout: process.env.CI ? 5_000 : 15_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "on-first-retry", extraHTTPHeaders },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    {
      name: "iphone",
      testMatch: [
        "e2e/favicon.spec.ts",
        "e2e/sticky-header.spec.ts",
        "e2e/home.spec.ts",
        "e2e/mobile-menu.spec.ts",
      ],
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "ipad",
      testMatch: ["e2e/favicon.spec.ts", "e2e/home.spec.ts", "a11y/emulation.spec.ts"],
      use: { ...devices["iPad Pro 11"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm dev --port ${port}`,
        // Probe the heaviest route so next dev compiles it before the parallel workers start.
        url: `${baseURL}/primitives`,
        reuseExistingServer: !process.env.CI,
        timeout: WEB_SERVER_TIMEOUT_MS,
      },
});
