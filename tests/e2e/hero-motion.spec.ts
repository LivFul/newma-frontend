import { expect, test } from "../support/test";
import { gotoHeroReady } from "../support/hero";

const WCAG_AUTO_MOTION_LIMIT_MS = 5000;
// The hero background lines are an ambient, slow, deliberate loop that was asked for by name; every
// other animation on the page must stay finite and short.
const AMBIENT_LOOP = "botanical-drift";
// The pipeline diagram's own deliberate loops (a slowly turning loop and pulsing chevrons). Like the
// background lines they may run forever, but only by moving transform or opacity.
const PIPELINE_LOOPS: Readonly<Record<string, readonly string[]>> = {
  "loop-spin": ["transform"],
  "chevron-pulse": ["opacity", "transform"],
};

type Running = { name: string; endMs: number; properties: string[] };

async function runningAnimations(page: import("@playwright/test").Page): Promise<Running[]> {
  return page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation): animation is CSSAnimation => animation instanceof CSSAnimation)
      .map((animation) => {
        const end = animation.effect?.getComputedTiming().endTime;
        const keyframes = (animation.effect as KeyframeEffect).getKeyframes();
        const skip = new Set(["offset", "easing", "composite", "computedOffset"]);
        return {
          name: animation.animationName,
          // JSON turns Infinity into null, so report an infinite loop as a huge number.
          endMs: typeof end === "number" && Number.isFinite(end) ? end : 1e12,
          properties: [...new Set(keyframes.flatMap((kf) => Object.keys(kf)))].filter(
            (key) => !skip.has(key),
          ),
        };
      }),
  );
}

// Value: protects=the hero background lines drift on their own using transform only, and every other animation stays under five seconds (WCAG 2.2.2); fails_when=the drift stops, animates a paint property such as background-position, or another infinite or long animation is added; why_new=the drift had been removed for repainting the hero, and nothing checked that its replacement really moves or that nothing else loops; seam=none
test("the hero lines drift by transform and nothing else loops", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHeroReady(page);
  const animations = await runningAnimations(page);

  const drift = animations.find((animation) => animation.name === AMBIENT_LOOP);
  expect(drift, "the hero lines animation").toBeDefined();
  expect(drift?.endMs, "an endless loop").toBeGreaterThan(1e9);
  expect(drift?.properties).toEqual(["transform"]);

  for (const { name, endMs, properties } of animations) {
    if (name === AMBIENT_LOOP) continue;
    const allowed = PIPELINE_LOOPS[name];
    if (allowed) {
      expect(
        properties.every((property) => allowed.includes(property)),
        `loop ${name}`,
      ).toBe(true);
      continue;
    }
    expect(endMs, `animation ${name}`).toBeLessThanOrEqual(WCAG_AUTO_MOTION_LIMIT_MS);
  }

  const transformOf = () =>
    page.evaluate(
      () => getComputedStyle(document.querySelector(".botanical-lines")!, "::before").transform,
    );
  const before = await transformOf();
  await page.waitForTimeout(1500);
  expect(await transformOf(), "the lines have moved").not.toBe(before);
});

// Value: protects=nothing in the hero moves on its own for visitors who ask for reduced motion; fails_when=the drift is declared outside the no-preference media block; why_new=reduced motion was only checked for the diagram, not the background; seam=none
test("the hero lines stay still under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // The interactive hero layer never loads under reduced motion, so its ready hook never appears.
  await page.goto("/");
  await expect(page.locator(".botanical-lines")).toBeAttached();
  const names = (await runningAnimations(page)).map((animation) => animation.name);
  expect(names).not.toContain(AMBIENT_LOOP);
});
