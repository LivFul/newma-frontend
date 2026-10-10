// Keyboard-only helpers for the automatable rows of docs/A11Y_MANUAL_PASS*.md (P6 hardening).
// Every helper drives the page with Tab, Shift+Tab, Enter and Escape only; evaluate() reads state.
import type { Page } from "@playwright/test";

/** One focus stop: the element's walk index (or -1 for an unmarked element) and how it looks. */
export type FocusStop = Readonly<{
  idx: number;
  /** Focus sits in host chrome that is not ours (the Vercel preview toolbar); walks step over it. */
  foreign: boolean;
  label: string;
  indicator: boolean;
  obscured: boolean;
}>;

const MARK = "data-kb-idx";
// Vercel injects its toolbar and comments into preview deployments as this custom element; focus
// inside its shadow root reports the host as document.activeElement.
const FOREIGN_HOSTS = "vercel-live-feedback, nextjs-portal";

/**
 * Marks every element a keyboard user should be able to reach and returns how many there are.
 * Tabbable: natively focusable or tabindex >= 0, not disabled, not inert, rendered and visible
 * (closed <details> content and display:none are excluded; the sr-only skip link is included).
 */
export async function markTabbables(page: Page): Promise<number> {
  return page.evaluate(
    ({ mark, foreign }) => {
      const selector = [
        "a[href]",
        "area[href]",
        "button",
        "input:not([type=hidden])",
        "select",
        "textarea",
        "summary",
        "iframe",
        "[tabindex]",
        "[contenteditable=true]",
      ].join(",");
      const candidates = [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => {
        if (el.tabIndex < 0 || el.closest("[inert]") || el.closest(foreign)) return false;
        if (el.closest("[hidden]")) return false;
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;
        // Header theme control: roving tabindex + icon-only radios are covered in unit/e2e theme tests.
        if (el.closest('[role="radiogroup"][aria-label="Theme"]')) return false;
        // Roving tabindex: only the active radio in a group participates in sequential focus.
        if (el.getAttribute("role") === "radio" && el.tabIndex !== 0) return false;
        if ((el as HTMLButtonElement).disabled) return false;
        if (el.tagName === "SUMMARY" && el.parentElement?.firstElementChild !== el) return false;
        return el.checkVisibility({ visibilityProperty: true, opacityProperty: false });
      });
      document.querySelectorAll(`[${mark}]`).forEach((el) => el.removeAttribute(mark));
      candidates.forEach((el, i) => el.setAttribute(mark, String(i)));
      return candidates.length;
    },
    { mark: MARK, foreign: FOREIGN_HOSTS },
  );
}

/** Describes document.activeElement: its mark, a readable label and whether focus is visible. */
export async function describeFocus(page: Page): Promise<FocusStop | undefined> {
  return page.evaluate(
    ({ mark, foreign }) => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el === document.documentElement) return undefined;
      const style = getComputedStyle(el);
      const outline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
      const shadow = style.boxShadow !== "none" && style.boxShadow !== "";
      // SVG links draw their focus ring on a stroked child (the hero's .eco-hit), not an outline.
      const stroked = [...el.querySelectorAll("*")].some((child) => {
        const s = getComputedStyle(child);
        return s.stroke !== "none" && parseFloat(s.strokeWidth) >= 2 && s.strokeOpacity !== "0";
      });
      const rect = el.getBoundingClientRect();
      const x = Math.min(Math.max(rect.left + rect.width / 2, 0), innerWidth - 1);
      const headerBottom =
        document.querySelector("[data-site-header]")?.getBoundingClientRect().bottom ?? 0;
      const y = Math.min(
        Math.max(Math.max(rect.top + Math.min(rect.height / 2, 8), headerBottom + 1), 0),
        innerHeight - 1,
      );
      const hit = document.elementFromPoint(x, y);
      const obscured =
        rect.width > 1 &&
        !!hit &&
        !el.contains(hit) &&
        !hit.contains(el) &&
        !!hit.closest("header");
      const label = `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}"`;
      return {
        idx: Number(el.getAttribute(mark) ?? -1),
        foreign: el.closest(foreign) !== null,
        label,
        indicator: outline || shadow || (el.closest("svg") !== null && stroked),
        obscured,
      };
    },
    { mark: MARK, foreign: FOREIGN_HOSTS },
  );
}

const MAX_EXTRA_STOPS = 10;

/**
 * Presses `key` until focus leaves the page (body) or comes back to the first stop: that proves there
 * is no trap. Returns the stops in order. Throws when the walk does not finish within the budget.
 */
export async function walk(page: Page, key: "Tab" | "Shift+Tab", total: number) {
  const stops: FocusStop[] = [];
  for (let i = 0; i < total + MAX_EXTRA_STOPS; i += 1) {
    await page.keyboard.press(key);
    const stop = await describeFocus(page);
    if (!stop) return { stops, escaped: true };
    // Host chrome after our content means Tab left the page; before any stop it is stepped over.
    if (stop.foreign) {
      if (stops.length > 0) return { stops, escaped: true };
      continue;
    }
    if (stops.length > 0 && stop.idx === stops[0].idx && stop.idx !== -1) {
      return { stops, escaped: true };
    }
    stops.push(stop);
  }
  return { stops, escaped: false };
}

/**
 * Moves the sequential-focus starting point to the top of the document, as a fresh load from the
 * address bar does (a plain blur() would keep the last focused element as the starting point).
 */
export async function resetFocus(page: Page): Promise<void> {
  await page.evaluate(() => {
    const sentinel = document.createElement("span");
    sentinel.tabIndex = -1;
    document.body.prepend(sentinel);
    sentinel.focus({ preventScroll: true });
    sentinel.remove();
    window.scrollTo(0, 0);
  });
}

/** Moves the sequential-focus starting point past the last element, for a Shift+Tab walk. */
export async function focusEnd(page: Page): Promise<void> {
  await page.evaluate(() => {
    const sentinel = document.createElement("span");
    sentinel.tabIndex = -1;
    document.body.append(sentinel);
    sentinel.focus();
    sentinel.remove();
  });
}

/** Tabs forward until `predicate` holds for the focused stop; fails after `limit` presses. */
export async function tabTo(
  page: Page,
  predicate: (stop: FocusStop) => boolean,
  limit = 200,
): Promise<FocusStop> {
  for (let i = 0; i < limit; i += 1) {
    await page.keyboard.press("Tab");
    const stop = await describeFocus(page);
    if (stop && predicate(stop)) return stop;
  }
  throw new Error("tabTo: target not reached by keyboard");
}

/**
 * The key that moves focus through links as `key` does elsewhere. WebKit on macOS follows Safari's
 * default and puts only form controls in the Tab order; Alt+Tab includes links. Linux WebKit (CI)
 * and every other engine take the plain key.
 */
export function sequentialKey(page: Page, key: "Tab" | "Shift+Tab"): string {
  const engine = page.context().browser()?.browserType().name();
  return engine === "webkit" && process.platform === "darwin" ? `Alt+${key}` : key;
}

/** True when the focused element sits inside `selector`. */
export async function focusInside(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((s) => document.activeElement?.closest(s) !== null, selector);
}
