// Clipping and spacing helpers for the emulation proxies (docs/A11Y_MANUAL_PASS*.md, WCAG 1.4.10 and
// 1.4.12). Read-only page.evaluate() calls; the text-spacing override is the WCAG 1.4.12 bookmarklet.
import type { Page } from "@playwright/test";

/** WCAG 1.4.12 values: line height 1.5, paragraph spacing 2em, letter 0.12em, word 0.16em. */
export const TEXT_SPACING_CSS = `
  *, *::before, *::after {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p { margin-bottom: 2em !important; }
`;

export async function applyTextSpacing(page: Page): Promise<void> {
  await page.addStyleTag({ content: TEXT_SPACING_CSS });
}

/**
 * Text containers that hide part of their text: overflow hidden or clip (or an ellipsis) on an axis
 * where the content is larger than the box. Scrollable boxes (auto, scroll) are fine: the text is
 * still reachable. Visually hidden elements (the sr-only skip link, 1x1 px) and svg are skipped.
 */
export async function clippedText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const CLIPPING = new Set(["hidden", "clip"]);
    const TOLERANCE_PX = 1;
    const hasText = (el: Element) => (el.textContent ?? "").trim().length > 0;
    return [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => !el.closest("svg") && hasText(el) && el.checkVisibility())
      .filter((el) => el.clientWidth > 1 && el.clientHeight > 1)
      .filter((el) => {
        const s = getComputedStyle(el);
        const clipsX = CLIPPING.has(s.overflowX) || s.textOverflow === "ellipsis";
        const clipsY = CLIPPING.has(s.overflowY);
        return (
          (clipsX && el.scrollWidth > el.clientWidth + TOLERANCE_PX) ||
          (clipsY && el.scrollHeight > el.clientHeight + TOLERANCE_PX)
        );
      })
      .slice(0, 8)
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}.${el.className} "${el.textContent!.trim().slice(0, 40)}"`,
      );
  });
}

/**
 * Leaf text elements whose boxes overlap a sibling text element's box by more than a few pixels:
 * a proxy for "overlapping text" after a spacing change. Positioned decorations and svg are skipped.
 */
export async function overlappingText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const OVERLAP_PX = 4;
    const leaves = [...document.querySelectorAll<HTMLElement>("body *")].filter(
      (el) =>
        !el.closest("svg") &&
        el.children.length === 0 &&
        (el.textContent ?? "").trim().length > 0 &&
        el.checkVisibility() &&
        getComputedStyle(el).position === "static" &&
        el.getBoundingClientRect().width > 1,
    );
    const hits: string[] = [];
    leaves.forEach((a, i) => {
      const ra = a.getBoundingClientRect();
      leaves.slice(i + 1).forEach((b) => {
        if (a.parentElement !== b.parentElement) return;
        const rb = b.getBoundingClientRect();
        const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (x > OVERLAP_PX && y > OVERLAP_PX) {
          hits.push(
            `"${a.textContent!.trim().slice(0, 30)}" / "${b.textContent!.trim().slice(0, 30)}"`,
          );
        }
      });
    });
    return hits.slice(0, 8);
  });
}

/** CSS animations and transitions still running (finite or infinite) longer than `maxMs`. */
export async function runningAnimations(page: Page, maxMs = 10): Promise<string[]> {
  return page.evaluate((limit) => {
    return document
      .getAnimations()
      .filter((a) => a.playState === "running")
      .filter((a) => {
        const timing = a.effect?.getComputedTiming();
        const duration = Number(timing?.duration ?? 0);
        return timing?.iterations === Infinity || duration > limit;
      })
      .map((a) => {
        const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
        return `${target?.tagName.toLowerCase() ?? "?"} ${(a as CSSAnimation).animationName ?? a.id}`;
      })
      .slice(0, 8);
  }, maxMs);
}
