import { expect, test } from "@playwright/test";

// Computed transition-duration is serialised in seconds by Chromium ("0.15s", "0.00001s").
const toMilliseconds = (value: string): number => {
  const [first] = value.split(",");
  return first.trim().endsWith("ms") ? parseFloat(first) : parseFloat(first) * 1000;
};

const buttonTransitionDuration = async (page: import("@playwright/test").Page) => {
  await page.goto("/primitives");
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
