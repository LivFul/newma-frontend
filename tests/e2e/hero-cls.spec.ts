import { expect, test } from "../support/test";

const MAX_HERO_SHIFT = 0.02;

test("swapping the static layer for the interactive twin shifts nothing", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __shifts: number }).__shifts = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput)
          (window as unknown as { __shifts: number }).__shifts += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/");
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30_000 });
  await page.waitForTimeout(500);
  const shifts = await page.evaluate(() => (window as unknown as { __shifts: number }).__shifts);
  expect(shifts).toBeLessThanOrEqual(MAX_HERO_SHIFT);
});
