// Mirrors src/styles/tokens/color.css for the places CSS variables cannot reach (viewport metadata,
// next/og images). tests/unit/site/brand.test.ts keeps both in step.
export const BRAND_HEX = Object.freeze({
  background: "#f7f8f4",
  elevated: "#ffffff",
  foreground: "#1b2a1a",
  muted: "#535e4d",
  accent: "#244322",
  borderStrong: "#7a876f",
  /** Deep Forest: the dark brand ground (theme colour, plates). Kept under its old key for callers. */
  night: "#1b3319",
  sage: "#9ba77d",
  lavender: "#86809c",
  ecoCompute: "#b69cff",
  ecoComputeInk: "#553d99",
  ecoOptional: "#a8442a",
  warningInk: "#8a5a00",
  successInk: "#3f6b2b",
});
export const BACKGROUND_HEX = BRAND_HEX.background;
