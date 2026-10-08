// Mirrors src/styles/tokens/color.css for the places CSS variables cannot reach (viewport metadata,
// next/og images). tests/unit/site/brand.test.ts keeps both in step.
export const BRAND_HEX = Object.freeze({
  background: "#f1f6f1",
  elevated: "#ffffff",
  foreground: "#082b33",
  muted: "#4f6b70",
  accent: "#0b3f4b",
  borderStrong: "#6c8689",
  /** Night: the dark brand ground (theme colour, app tiles). */
  night: "#06242b",
  ecoCompute: "#b69cff",
  ecoComputeInk: "#553d99",
  ecoOptional: "#a8442a",
  warningInk: "#8a5a00",
  successInk: "#0b7a52",
});
export const BACKGROUND_HEX = BRAND_HEX.background;
