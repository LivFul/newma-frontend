import { expect, test } from "../support/test";
import { gotoHeroReady, heroLink, heroSvg, settled } from "../support/hero";

// INP lab proxy (assumption A-P4-13): Lighthouse cannot measure INP, so every interaction on the hero
// is timed with the Event Timing API. Field INP at p75 is a CP-3 follow-up.
const MAX_INTERACTION_MS = 200;
const MAX_CLS = 0.1;

test("hero interactions each stay within 200 ms", async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __durations: number[] };
    w.__durations = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) w.__durations.push(entry.duration);
    }).observe({
      type: "event",
      durationThreshold: 16,
      buffered: true,
    } as PerformanceObserverInit);
  });
  await gotoHeroReady(page);
  const toggle = page.getByRole("button", { name: "Explore components" });
  await toggle.click();
  await settled(page);
  await toggle.click();
  await settled(page);
  if (!isMobile) {
    await heroSvg(page).hover();
    await settled(page);
    await page.mouse.move(2, 2);
    await settled(page);
  }
  await heroLink(page, "interface").focus();
  for (const key of ["ArrowRight", "ArrowRight", "ArrowLeft", "End", "Home", "Escape"]) {
    await page.keyboard.press(key);
  }
  await page.waitForTimeout(300);
  const durations = await page.evaluate(
    () => (window as unknown as { __durations: number[] }).__durations,
  );
  expect(Math.max(0, ...durations)).toBeLessThanOrEqual(MAX_INTERACTION_MS);
});

test("cumulative layout shift across the whole page load stays within 0.1", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput) w.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await gotoHeroReady(page);
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(() => (window as unknown as { __cls: number }).__cls),
  ).toBeLessThanOrEqual(MAX_CLS);
});
