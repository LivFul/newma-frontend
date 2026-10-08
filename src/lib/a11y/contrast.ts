// WCAG 2.x relative luminance and contrast ratio.
const SRGB_LINEAR_THRESHOLD = 0.03928;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_SCALE = 1.055;
const SRGB_GAMMA = 2.4;
const CONTRAST_OFFSET = 0.05;

const channel = (c: number): number => {
  const s = c / 255;
  return s <= SRGB_LINEAR_THRESHOLD
    ? s / SRGB_LINEAR_DIVISOR
    : ((s + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_SCALE) ** SRGB_GAMMA;
};

export const expandHex = (hex: string): string => {
  const h = hex.trim().replace("#", "");
  return h.length === 3
    ? h
        .split("")
        .map((ch) => ch + ch)
        .join("")
    : h;
};

export const luminance = (hex: string): number => {
  const h = expandHex(hex);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrastRatio = (fgHex: string, bgHex: string): number => {
  const [l1, l2] = [luminance(fgHex), luminance(bgHex)].sort((a, b) => b - a);
  return (l1 + CONTRAST_OFFSET) / (l2 + CONTRAST_OFFSET);
};

const channels = (hex: string): number[] => {
  const h = expandHex(hex);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (rgb: number[]): string =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

/**
 * `top` at `alpha` over an opaque `below`. Browsers composite alpha in gamma-encoded sRGB, so the
 * channels are blended as they are.
 */
export const blend = (top: string, alpha: number, below: string): string => {
  const [t, b] = [channels(top), channels(below)];
  return toHex(t.map((c, i) => c * alpha + b[i]! * (1 - alpha)));
};

// Generic `--name: value;` parser; callers decide which values are colours.
export const parseCssVars = (css: string): Record<string, string> =>
  Object.fromEntries(
    Array.from(css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi), (m) => [m[1], m[2].trim()]),
  );
