import type { Page } from "@playwright/test";

// CI runs on Linux, where the system font stacks fall back to wider faces than on a developer Mac.
// Forcing a wide face reproduces that locally and keeps the reflow checks honest.
export const WIDE_FONT_STACK = '"Verdana", "DejaVu Sans", sans-serif';

export async function forceWideFont(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after { font-family: ${WIDE_FONT_STACK} !important; }`,
  });
}

/** Pixels the document is wider than the viewport (0 when nothing scrolls sideways). */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/** Elements (outside svg) whose right edge lies beyond the viewport, for readable failures. */
export async function overflowingElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll("body *")]
      .filter((el) => !el.closest("svg") && el.getBoundingClientRect().right > width + 0.5)
      .slice(0, 6)
      .map((el) => `${el.tagName} ${(el.textContent ?? "").slice(0, 30)}`);
  });
}
