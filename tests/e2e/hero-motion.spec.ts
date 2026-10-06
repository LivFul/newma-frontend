import { expect, test } from "../support/test";
import { gotoHeroReady } from "../support/hero";

const WCAG_AUTO_MOTION_LIMIT_MS = 5000;

// Value: protects=nothing on the page animates by itself for more than five seconds, so no pause control is needed (WCAG 2.2.2); fails_when=an infinite or long CSS animation is added or restored; why_new=the hero's orbit dashes and node float ran forever and nothing checked default-motion animations; seam=none
test("no CSS animation runs on its own for more than five seconds", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHeroReady(page);
  const animations = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation): animation is CSSAnimation => animation instanceof CSSAnimation)
      .map((animation) => {
        const end = animation.effect?.getComputedTiming().endTime;
        return {
          name: animation.animationName,
          // JSON turns Infinity into null, so report an infinite loop as a huge number.
          endMs: typeof end === "number" && Number.isFinite(end) ? end : 1e12,
        };
      }),
  );
  for (const { name, endMs } of animations) {
    expect(endMs, `animation ${name}`).toBeLessThanOrEqual(WCAG_AUTO_MOTION_LIMIT_MS);
  }
});
