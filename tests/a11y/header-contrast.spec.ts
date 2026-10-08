// The header's muted labels (Slate on the light glass) over the hero, measured on the rendered page: the
// glass blurs the hero photo by 22px, so the backdrop the text actually sits on is an average no flat
// colour bound can model (tests/unit/site/header-glass.test.ts covers the flat sage wash). The label text
// is made transparent and every backdrop pixel behind it is checked against Slate.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { contrastRatio, parseCssVars } from "../../src/lib/a11y/contrast";
import { expect, test } from "../support/test";

const SLATE = parseCssVars(
  readFileSync(path.join(process.cwd(), "src/styles/tokens/color.css"), "utf8"),
)["--color-fg-muted"]!;
const WCAG_AA_TEXT = 4.5;
const SCROLL_STEP_PX = 100;
// Text pixels are hidden; the inset keeps antialiased rim pixels of the pill hover ground out of the box.
const INSET_PX = 6;
const MUTED_LABELS = '[data-site-header] nav[aria-label] a, [data-site-header] a[rel="noopener"]';

test.skip(({ isMobile }) => isMobile, "the muted labels sit in the bar from lg up");

async function darkestBackdrop(page: Page, decoder: Page): Promise<string> {
  const boxes = await page
    .locator(MUTED_LABELS)
    .evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect).filter((b) => b.width > 0),
    );
  let darkest = "#ffffff";
  for (const box of boxes) {
    const png = await page.screenshot({
      clip: {
        x: box.x + INSET_PX,
        y: box.y + INSET_PX,
        width: box.width - 2 * INSET_PX,
        height: box.height - 2 * INSET_PX,
      },
    });
    const hexes = await decoder.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(img, 0, 0);
      const { data } = context.getImageData(0, 0, img.width, img.height);
      const out = new Set<string>();
      for (let i = 0; i < data.length; i += 4) {
        out.add(
          `#${[data[i]!, data[i + 1]!, data[i + 2]!].map((c) => c.toString(16).padStart(2, "0")).join("")}`,
        );
      }
      return [...out];
    }, png.toString("base64"));
    for (const hex of hexes) {
      if (contrastRatio(SLATE, hex) < contrastRatio(SLATE, darkest)) darkest = hex;
    }
  }
  return darkest;
}

for (const width of [1024, 1440]) {
  test(`muted header labels stay AA over the hero at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({
      content: `${MUTED_LABELS} { color: transparent !important; }`,
    });
    const decoder = await context.newPage();
    const heroHeight = await page
      .locator("section:has(#hero-heading)")
      .evaluate((el) => el.getBoundingClientRect().height);
    let checked = 0;
    for (let y = 0; y <= heroHeight; y += SCROLL_STEP_PX) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      // Two frames: the header re-probes its tone on the next frame after a scroll.
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const tone = await page.locator("[data-site-header]").getAttribute("data-tone");
      if (tone !== "light") continue;
      const backdrop = await darkestBackdrop(page, decoder);
      expect(contrastRatio(SLATE, backdrop), `${backdrop} at scroll ${y}`).toBeGreaterThanOrEqual(
        WCAG_AA_TEXT,
      );
      checked += 1;
    }
    expect(checked, "the walk must measure the light glass at least once").toBeGreaterThan(0);
  });
}
