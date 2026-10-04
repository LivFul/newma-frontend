import { expect, test } from "../support/test";
import { heroSvg, holdHeroChunk } from "../support/hero";

const MAX_HERO_SHIFT = 0.02;
const SAME_PIXEL = 0.5;

type Probe = { __shifts: number; __captionTops: number[]; __views: string[] };
test("swapping the static layer for the interactive twin shifts nothing", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Probe;
    w.__shifts = 0;
    w.__captionTops = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput) w.__shifts += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    // Everything below the graphic must stay put through the swap: sample the caption every frame.
    const sample = () => {
      const caption = document.querySelector(".eco-figure figcaption");
      if (caption) w.__captionTops.push(Math.round(caption.getBoundingClientRect().top * 10) / 10);
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto("/");
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30_000 });
  await page.waitForTimeout(800);
  const { shifts, tops } = await page.evaluate(() => {
    const w = window as unknown as Probe;
    return { shifts: w.__shifts, tops: w.__captionTops };
  });
  expect(shifts).toBeLessThanOrEqual(MAX_HERO_SHIFT);
  expect(tops.length).toBeGreaterThan(2);
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(SAME_PIXEL);
});

test("hover present at the swap keeps the view exploded (no collapse flash)", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "hover is a desktop input");
  await page.addInitScript(() => {
    const w = window as unknown as Probe;
    w.__views = [];
    new MutationObserver(() => {
      const svg = document.querySelector("svg.eco-svg");
      if (svg) w.__views.push(`${svg.getAttribute("data-layer")}:${svg.getAttribute("data-view")}`);
    }).observe(document, { subtree: true, attributes: true, childList: true });
  });
  // Without the hold, a page whose idle callback fires before `goto` resolves swaps first and the
  // hover lands on the interactive layer, which proves nothing (seen against production).
  // The held chunk can delay the load event, so do not wait for it.
  const chunk = await holdHeroChunk(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await chunk.requested;
  await heroSvg(page).hover();
  await expect(heroSvg(page)).toHaveAttribute("data-layer", "static");
  chunk.release();
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30_000 });
  await expect(heroSvg(page)).toHaveAttribute("data-view", "exploded");
  await page.waitForTimeout(500);
  const views = await page.evaluate(() => (window as unknown as Probe).__views);
  expect(views.filter((v) => v.startsWith("interactive:"))).not.toContain("interactive:assembled");
});
