import { expect, test } from "../support/test";

const CENTER_TOLERANCE_PX = 2;
const MIN_TEXT_GAP_PX = 8;

// Value: protects=each "How it works" step number sits on the middle of its leaf or pill shape, and on phones the step text clears the marker; fails_when=the icons go back to the whole logo's box (the shape drifts to one side of its svg) or the marker is narrower than the text offset; why_new=the numbers were centred on the logo's box, so they landed on the edge of their shapes; seam=none
test("each step number is centred on its icon and clear of the step text", async ({ page }) => {
  await page.goto("/");
  const steps = page.locator("#product ol > li");
  await steps.first().scrollIntoViewIfNeeded();
  const count = await steps.count();
  expect(count).toBe(4);

  for (let index = 0; index < count; index += 1) {
    const step = steps.nth(index);
    const [shape, number, text] = await Promise.all([
      step.locator("svg path").first().boundingBox(),
      step.locator("svg + span").boundingBox(),
      step.locator("p").first().boundingBox(),
    ]);
    expect(shape && number && text, `step ${index + 1} boxes`).toBeTruthy();
    const centre = (box: { x: number; y: number; width: number; height: number }) => ({
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    });
    const [shapeCentre, numberCentre] = [centre(shape!), centre(number!)];
    expect(
      Math.abs(shapeCentre.x - numberCentre.x),
      `step ${index + 1} horizontal`,
    ).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
    expect(
      Math.abs(shapeCentre.y - numberCentre.y),
      `step ${index + 1} vertical`,
    ).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
    // Side by side only where the marker sits left of the text (phones); on wide screens it is above it.
    if (shape!.y + shape!.height > text!.y) {
      expect(text!.x - (shape!.x + shape!.width), `step ${index + 1} gap`).toBeGreaterThanOrEqual(
        MIN_TEXT_GAP_PX,
      );
    }
  }
});
