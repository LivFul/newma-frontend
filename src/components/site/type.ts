export const SECTION = "px-5 py-(--space-20) md:px-12 md:py-(--space-28)";
export const CONTAINER = "mx-auto w-full max-w-[80rem]";
export const H2 =
  "font-display text-4xl leading-[1.02] font-medium tracking-[-0.03em] text-balance md:text-5xl";
export const H2_SUB =
  "font-display text-3xl leading-[1.02] font-medium tracking-[-0.03em] text-balance md:text-4xl";
export const H3_TITLE = "font-display text-2xl font-medium tracking-[-0.015em]";
export const STATEMENT =
  "font-display text-2xl leading-snug font-normal tracking-[-0.02em] md:text-3xl";

/**
 * Stagger steps are literal strings, not built from the index: Tailwind generates a class only when it
 * can read the whole class name in source, so `[--hero-i:${index}]` would never reach the stylesheet and
 * every item would start at once. An index past the table clamps to the last step.
 */
const HERO_STEP = [
  "[--hero-i:0]",
  "[--hero-i:1]",
  "[--hero-i:2]",
  "[--hero-i:3]",
  "[--hero-i:4]",
] as const;
const REVEAL_STEP = [
  "[--reveal-i:0]",
  "[--reveal-i:1]",
  "[--reveal-i:2]",
  "[--reveal-i:3]",
  "[--reveal-i:4]",
  "[--reveal-i:5]",
] as const;
const step = (steps: readonly string[], index: number): string =>
  steps[Math.min(Math.max(Math.trunc(index), 0), steps.length - 1)]!;

/** Base class for the CSS-only hero load sequence. Never put this on the h1 (it is the LCP node). */
export const HERO_ENTRANCE_ITEM = "hero-entrance-item";
export const heroEntrance = (index: number) => `${HERO_ENTRANCE_ITEM} ${step(HERO_STEP, index)}`;

/** Staggered child inside a `[data-reveal]` section. Index is the delay step. */
export const REVEAL_CHILD = "reveal-child";
export const revealChild = (index: number) => `${REVEAL_CHILD} ${step(REVEAL_STEP, index)}`;
