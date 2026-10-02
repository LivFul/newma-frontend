import { defineConfig, devices } from "@playwright/test";

// PORT lets a developer sidestep a busy :3000 locally; PLAYWRIGHT_BASE_URL targets a deployed preview (P1+).
const port = process.env.PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const WEB_SERVER_TIMEOUT_MS = 120_000;

export default defineConfig({
  testDir: "tests",
  testMatch: ["e2e/**/*.spec.ts", "a11y/**/*.spec.ts"],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm dev --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: WEB_SERVER_TIMEOUT_MS,
      },
});
