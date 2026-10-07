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

// Colour feedback rides the fast token; the press and hover scale is a spring and needs the base token
// to read. Both are asserted per property, so neither channel can drift to instant or sluggish.
test("buttons transition colour over the fast token and scale over the base spring token", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHydrated(page, "/primitives");
  const button = page.getByRole("button", { name: "Primary" });
  const byProperty = await button.evaluate((el) => {
    const style = getComputedStyle(el);
    const properties = style.transitionProperty.split(",").map((p) => p.trim());
    const durations = style.transitionDuration.split(",").map((d) => d.trim());
    const timing = style.transitionTimingFunction;
    return { properties, durations, springScale: timing.includes("linear(") };
  });
  const durationOf = (property: string): string =>
    byProperty.durations[byProperty.properties.indexOf(property)] ?? "missing";
  expect(durationOf("background-color")).toBe("0.15s");
  expect(durationOf("color")).toBe("0.15s");
  expect(durationOf("scale")).toBe("0.28s");
  expect(byProperty.springScale).toBe(true);
});

test("reduced-motion users get no perceptible transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await buttonTransitionDuration(page);
  expect(toMilliseconds(duration)).toBeLessThanOrEqual(0.01);
});
