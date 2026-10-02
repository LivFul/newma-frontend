import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";

/** Navigate and wait for hydration so interactions never race the client bundle under `next dev`. */
async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

// Computed transition-duration is serialised in seconds by Chromium ("0.15s", "0.00001s").
const toMilliseconds = (value: string): number => {
  const [first] = value.split(",");
  return first.trim().endsWith("ms") ? parseFloat(first) : parseFloat(first) * 1000;
};

const buttonTransitionDuration = async (page: import("@playwright/test").Page) => {
  await gotoHydrated(page, "/primitives");
  const button = page.getByRole("button", { name: "Primary" });
  return button.evaluate((el) => getComputedStyle(el).transitionDuration);
};

test("buttons transition over the fast motion token", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await buttonTransitionDuration(page)).toBe("0.15s");
});

test("reduced-motion users get no perceptible transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await buttonTransitionDuration(page);
  expect(toMilliseconds(duration)).toBeLessThanOrEqual(0.01);
});
