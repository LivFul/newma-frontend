export const SECTION = "px-5 py-(--space-20) md:px-12 md:py-(--space-28)";
export const CONTAINER = "mx-auto w-full max-w-[80rem]";
export const H2 =
  "font-display text-4xl leading-[1.04] font-bold tracking-[-0.03em] text-balance md:text-5xl";
export const H2_SUB =
  "font-display text-3xl leading-[1.04] font-bold tracking-[-0.03em] text-balance md:text-4xl";
export const H3_TITLE = "font-display text-2xl font-semibold tracking-[-0.015em]";
export const STATEMENT =
  "font-display text-2xl leading-snug font-normal tracking-[-0.02em] md:text-3xl";

/**
 * Hero stagger steps are literal class strings, not built from the index: Tailwind generates a class
 * only when it can read the whole class name in source, so an interpolated name never reaches the
 * stylesheet and every item starts at once. The index is a union, so a step outside the table is a
 * compile error and not a silent clamp.
 */
export type HeroStep = 1 | 2;
const HERO_STEP: Record<HeroStep, string> = {
  1: "[--hero-i:1]",
  2: "[--hero-i:2]",
};

/**
 * Base class for the CSS-only hero load sequence, for the actions only. Never put it on the copy (h1,
 * tagline, lede): an item starts at opacity 0, and on phones the lede is the LCP node, so a fade there
 * moved LCP past every script that ran before it.
 */
export const HERO_ENTRANCE_ITEM = "hero-entrance-item";
export const heroEntrance = (step: HeroStep) => `${HERO_ENTRANCE_ITEM} ${HERO_STEP[step]}`;

/** Child inside a `[data-reveal]` section. It fades in with its section; only the hero cascades. */
export const REVEAL_CHILD = "reveal-child";
