import type { Locator, Page } from "@playwright/test";
import { expect } from "./test";

export const SLUGS = [
  "interface",
  "agentic-compute",
  "scientific-review",
  "wet-lab",
  "data-knowledge",
  "provenance-dlt",
] as const;
export type Slug = (typeof SLUGS)[number];

export const heroLink = (page: Page, slug: Slug): Locator =>
  page.locator(`svg.eco-svg a[href="/ecosystem/${slug}"]`);
export const heroPart = (page: Page, slug: Slug): Locator =>
  page.locator(`svg.eco-svg g[data-slug="${slug}"]`);
export const heroSvg = (page: Page): Locator => page.locator("svg.eco-svg");

/** Open the home page and wait for the interactive twin (stable hook set by Interactive). */
export async function gotoHeroReady(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30_000 });
}

export async function partY(page: Page, slug: Slug): Promise<number> {
  return heroPart(page, slug).evaluate((g) => g.getBoundingClientRect().y);
}

const SETTLE_SAMPLES = 5;
const SETTLE_INTERVAL_MS = 150;

async function allPartYs(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("svg.eco-svg g[data-slug]")).map(
      (g) => g.getBoundingClientRect().y,
    ),
  );
}

/**
 * Resolve once every part has stopped moving. The explode staggers parts by 0.06 s each, so a single
 * part can look still while another is waiting for its delay: sample all six across several frames.
 * Returns the y of the requested part.
 */
export async function settled(page: Page, slug: Slug = "provenance-dlt"): Promise<number> {
  let previous: number[] = [];
  let stableRuns = 0;
  await expect
    .poll(
      async () => {
        const current = await allPartYs(page);
        const stable =
          previous.length === current.length &&
          current.every((y, i) => Math.abs(y - previous[i]!) < 0.01);
        stableRuns = stable ? stableRuns + 1 : 0;
        previous = current;
        return stableRuns >= SETTLE_SAMPLES;
      },
      { intervals: [SETTLE_INTERVAL_MS], timeout: 10_000 },
    )
    .toBe(true);
  return previous[SLUGS.indexOf(slug)]!;
}

export async function focusedHref(page: Page): Promise<string | null> {
  return page.evaluate(() => document.activeElement?.getAttribute("href") ?? null);
}

/** Press Tab until the first hero component holds focus (the shell above it has a variable stop count). */
export async function tabToFirstComponent(page: Page): Promise<void> {
  for (let i = 0; i < 30; i += 1) {
    await page.keyboard.press("Tab");
    if ((await focusedHref(page)) === "/ecosystem/interface") {
      const insideSvg = await page.evaluate(
        () => document.activeElement?.closest("svg.eco-svg") !== null,
      );
      if (insideSvg) return;
    }
  }
  throw new Error("Tab never reached the first hero component");
}

/** Scrolls the element into view first: touch taps outside the viewport hit nothing. */
export async function center(locator: Locator): Promise<{ x: number; y: number }> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("no bounding box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
