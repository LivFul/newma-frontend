// Mirrors src/styles/tokens/color.css for the places CSS variables cannot reach (viewport metadata,
// next/og images). tests/unit/site/brand.test.ts keeps both in step.
export const BRAND_HEX = Object.freeze({
  background: "#e8f2ef",
  elevated: "#f6faf8",
  foreground: "#09191f",
  muted: "#4a6467",
  accent: "#1d5c52",
  borderStrong: "#6e8986",
  ecoCompute: "#9a5230",
  ecoOptional: "#a8442a",
  warningInk: "#8a5a00",
  successInk: "#3f7a70",
});
export const BACKGROUND_HEX = BRAND_HEX.background;
