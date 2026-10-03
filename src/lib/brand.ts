// Mirrors src/styles/tokens/color.css for the places CSS variables cannot reach (viewport metadata,
// next/og images). tests/unit/site/brand.test.ts keeps both in step.
export const BRAND_HEX = Object.freeze({
  background: "#0b1020",
  elevated: "#141a2e",
  foreground: "#f3f5f9",
  muted: "#b7bfd1",
  accent: "#7cc4ff",
  warning: "#ffd27a",
  success: "#8fe3b4",
  borderStrong: "#6b7694",
  ecoCompute: "#b69cff",
  ecoOptional: "#ff9a85",
});
export const BACKGROUND_HEX = BRAND_HEX.background;
